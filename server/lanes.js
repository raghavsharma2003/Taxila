// Quota lanes (BUILD-PLAN §1.3 rev 2, superhuman-quota-isolation; TEACHER-BRAIN §12 "capacity isolation", §5.4 L5).
// OWNED BY W2-E. Hot and background model calls must never share a quota pool:
//   - hot: reply, classify, distress, realtime (a child hears a 429 here as silence);
//   - background: Studio plan and build, memory consolidation, the voice annotator, parent texts, the router bench.
// Background calls should go to their own deployments (O13a/b: `taxila-fast-bg`, `taxila-studio-sol`; `twinFor` names
// them when TAXILA_BG_TWINS configures them). Until those exist, a sliding-minute window per deployment caps background
// calls at 30% of the deployment's TPM (queued FIFO, never dropped), and a hot 429 on a deployment pauses its background
// traffic, so background is shed first. The cap applies ONLY to deployments that also carry hot traffic (SHARED_HOT): a
// background call on a deployment no hot lane uses (the Studio build arms taxila-gpt6, gpt-5.6-terra, taxila-gpt6-luna) is
// never queued, because there is no hot traffic there to protect and the cap only starved live builds and the live
// whiteboard (W2-E fixer, measured with createLanes and a fake clock: the 21st prefetch build waited 55 s).
// Contract (server/azure.js calls these on every POST):
//   - admit() is synchronous: undefined = go now; a Promise = a background call waiting for its bucket. A hot (or
//     untagged) call is never delayed;
//   - settle() records what the call used and its status (a 429 feeds the pause); never throws.
// Untagged calls are treated as hot (never delayed): only a caller that says `quotaLane: "background"` is shaped.

/** @typedef {import("../shared/brain").QuotaLane} QuotaLane */

export const QUOTA_LANES = Object.freeze(["hot", "background"]);

/** Deployment capacity in tokens per minute (BUILD-PLAN §10.2, measured 2026-10-04; gpt-6 rows 2026-10-05). TAXILA_TPM (JSON) overrides. */
export const TPM = Object.freeze({
  "taxila-fast": 500_000, "grok-4-1-fast-non-reasoning": 500_000, "taxila-brain": 500_000, "gpt-5.6-terra": 500_000, "taxila-codex": 500_000,
  "taxila-kimi-code": 100_000, "DeepSeek-V4-Pro": 500_000, "DeepSeek-V4-Flash": 125_000, "grok-4.3": 500_000, "grok-4-20-non-reasoning": 500_000,
  "grok-4-20-reasoning": 500_000, "taxila-oss120": 200_000, "taxila-grok46": 200_000, "taxila-mistral-m35": 200_000,
  // the Studio arms and the live whiteboard's deployment (ARM listing 2026-10-05, evals/build-plan/results/deployments-2026-10-05.json)
  "taxila-gpt6": 500_000, "taxila-gpt6-luna": 500_000, "taxila-gpt61-sol": 500_000,
});
/**
 * The deployments hot lanes use (reply, classify, distress, realtime, and the classify fallback): only these are shared
 * pools whose background traffic is capped. TAXILA_SHARED_HOT (JSON array or comma list) overrides; the DEPLOY_* env
 * the server runs on are added so a re-pointed hot lane is always protected.
 */
export const SHARED_HOT_DEFAULT = Object.freeze(["taxila-fast", "grok-4-1-fast-non-reasoning", "taxila-realtime"]);
export function sharedHot(env = process.env) {
  const raw = env.TAXILA_SHARED_HOT;
  const listed = raw ? (parseJson(raw) ?? String(raw).split(",")) : SHARED_HOT_DEFAULT;
  const hot = [...(Array.isArray(listed) ? listed : SHARED_HOT_DEFAULT), env.DEPLOY_REPLY, env.DEPLOY_CLASSIFY, env.DEPLOY_FAST, env.DEPLOY_REALTIME,
    env.TAXILA_CLASSIFY_FALLBACK && env.TAXILA_CLASSIFY_FALLBACK !== "0" ? env.TAXILA_CLASSIFY_FALLBACK : null];
  return new Set(hot.map((x) => String(x ?? "").trim()).filter(Boolean));
}
/** Background share of a SHARED deployment's TPM (§1.3: 30%). */
export const BACKGROUND_SHARE = 0.3;
/** A background call's token estimate before its usage is known (settle() books the difference as debt or credit). */
export const EST_TOKENS = Object.freeze({ chat: 4000, default: 2000 });
/** After a hot 429 on a deployment its background traffic waits this long; after a background 429, this long. */
export const HOT_429_PAUSE_MS = 10_000, BG_429_PAUSE_MS = 5_000;
const UNKNOWN_TPM = 200_000;

const parseJson = (v) => { try { return v ? JSON.parse(v) : null; } catch { return null; } };

/**
 * One lanes instance (the module exports a default one; tests make their own with a fake clock).
 * @param {{ now?: () => number, setTimer?: (fn: () => void, ms: number) => unknown, tpm?: Record<string, number>, share?: number,
 *   shared?: Iterable<string> }} [o]  shared: the deployments hot lanes use (default sharedHot()); only they are capped
 */
export function createLanes({ now = () => Date.now(), setTimer = (fn, ms) => { const t = setTimeout(fn, ms); t.unref?.(); return t; }, tpm, share = BACKGROUND_SHARE, shared } = {}) {
  const caps = { ...TPM, ...(tpm ?? parseJson(process.env.TAXILA_TPM) ?? {}) };
  const hotPools = new Set(shared ?? sharedHot());
  const WINDOW = 60_000;
  /** deployment → { log: {at, tokens}[] (background calls of the last minute), pausedUntil, queue: {need, resolve}[], timer } */
  const buckets = new Map();
  const stats = { admitted: 0, waited: 0, hot429: 0, bg429: 0, unshared: 0 };

  /** The background allowance per sliding minute: 30% of the deployment's TPM (a window, not a bucket: no 2x first minute). */
  const allowance = (dep) => (caps[dep] ?? UNKNOWN_TPM) * share;
  function bucket(dep) {
    let b = buckets.get(dep);
    if (!b) { b = { log: [], pausedUntil: 0, queue: [], timer: null }; buckets.set(dep, b); }
    const t = now();
    while (b.log.length && b.log[0].at <= t - WINDOW) b.log.shift();
    return b;
  }
  const used = (b) => b.log.reduce((a, x) => a + x.tokens, 0);
  const take = (b, need) => { const e = { at: now(), tokens: need }; b.log.push(e); return e; };
  function drain(dep) {
    const b = bucket(dep);
    b.timer = null;
    while (b.queue.length) {
      const head = b.queue[0];
      if (now() < b.pausedUntil || used(b) + head.need > allowance(dep)) break;
      b.queue.shift();
      head.resolve(take(b, head.need));
    }
    if (b.queue.length && !b.timer) {
      // wake when the pause ends, or when enough of the window's oldest calls fall out of it
      const need = b.queue[0].need;
      let free = allowance(dep) - used(b), at = now();
      for (const x of b.log) { if (free >= need) break; free += x.tokens; at = x.at + WINDOW; }
      b.timer = setTimer(() => drain(dep), Math.max(b.pausedUntil - now(), at - now(), 1));
    }
  }

  /** @param {{ quotaLane?: QuotaLane, deployment: string, kind: string, estTokens?: number }} call */
  function admit(call) {
    if (call?.quotaLane !== "background" || !call.deployment) return undefined;
    // a deployment no hot lane uses: nothing to protect, never queued (its own 429s are the caller's race partner's turn)
    if (!hotPools.has(call.deployment)) { stats.unshared += 1; return undefined; }
    stats.admitted += 1;
    const dep = call.deployment;
    const need = Math.min(allowance(dep), Math.max(1, Number(call.estTokens) || EST_TOKENS[call.kind] || EST_TOKENS.default));
    const b = bucket(dep);
    if (!b.queue.length && now() >= b.pausedUntil && used(b) + need <= allowance(dep)) { take(b, need); return undefined; }
    stats.waited += 1;
    return new Promise((resolve) => {
      b.queue.push({ need, resolve: () => resolve() });
      if (!b.timer) drain(dep);
    });
  }

  /** @param {{ quotaLane?: QuotaLane, deployment: string, kind: string, status: number | string, usage?: { in?: number, out?: number }, estTokens?: number }} done */
  function settle(done) {
    try {
      if (!done?.deployment) return;
      const dep = done.deployment;
      const status = Number(done.status);
      const background = done.quotaLane === "background";
      if (status === 429) {
        const b = bucket(dep);
        b.pausedUntil = Math.max(b.pausedUntil, now() + (background ? BG_429_PAUSE_MS : HOT_429_PAUSE_MS));
        stats[background ? "bg429" : "hot429"] += 1;
        return;
      }
      if (background && !hotPools.has(dep)) return;
      if (background && done.usage) {
        // book the difference between what the call used and its estimate as one more entry of the window (debt or credit)
        const usedTokens = (Number(done.usage.in) || 0) + (Number(done.usage.out) || 0);
        const est = Math.min(allowance(dep), Number(done.estTokens) || EST_TOKENS[done.kind] || EST_TOKENS.default);
        if (usedTokens > 0 && usedTokens !== est) { const b = bucket(dep); b.log.push({ at: now(), tokens: usedTokens - est }); }
      }
    } catch { /* never throws into a model call */ }
  }

  return { admit, settle, stats, buckets, caps, shared: hotPools };
}

/** The background twin deployment of a shared one (TAXILA_BG_TWINS JSON, e.g. {"taxila-fast":"taxila-fast-bg"}), else null. */
export function twinFor(deployment) {
  const twins = parseJson(process.env.TAXILA_BG_TWINS);
  return twins && typeof twins[deployment] === "string" ? twins[deployment] : null;
}

const DEFAULT = createLanes();

/**
 * @param {{ quotaLane?: QuotaLane, deployment: string, kind: string, estTokens?: number }} call
 * @returns {Promise<void> | undefined}
 */
export function admit(call) { return DEFAULT.admit(call); }

/**
 * @param {{ quotaLane?: QuotaLane, deployment: string, kind: string, status: number | string, usage?: { in?: number, out?: number } }} done
 */
export function settle(done) { DEFAULT.settle(done); }
