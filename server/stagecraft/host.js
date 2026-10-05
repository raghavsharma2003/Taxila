// The server-side runner (STAGECRAFT.md §8): one per lesson. It owns the clock, the AbortControllers and the effects;
// the decisions are the pure reducer's (conductor.js). Flag: STAGECRAFT = off | shadow | on.
//   off     nothing runs (the W2 path is byte-identical)
//   shadow  everything runs and is logged, builds included, but outcomeAt() returns null: the stage never changes
//   on      outcomeAt() returns the reveal outcome the seam maps to a slot (patch P3)
// Never throws into the turn path: every builder error becomes a `landed ok:false` input.
import { config, initPortfolio, step } from "./conductor.js";

// REVIEW 2026-10-05: the conductor's quota buckets live in each lesson's portfolio, so N lessons on one process used to
// draw N x 120 RPM from one deployment. This bucket is shared by every host in the process; a launch it refuses never
// reaches Foundry and comes back as a local 429 (the chain then fails over, or "do not build").
const GLOBAL = new Map();
export function _resetGlobalQuota() { GLOBAL.clear(); }
export function globalTake(dep, rpm, now) {
  if (!rpm) return { ok: true };
  let b = GLOBAL.get(dep);
  if (!b) { b = { tokens: rpm, at: now }; GLOBAL.set(dep, b); }
  b.tokens = Math.min(rpm, b.tokens + (Math.max(0, now - b.at) / 60_000) * rpm); b.at = now;
  if (b.tokens < 1) return { ok: false, retryAfterMs: Math.ceil(((1 - b.tokens) / rpm) * 60_000) };
  b.tokens -= 1;
  return { ok: true };
}

export class StagecraftHost {
  /**
   * @param {{ lessonId: string, mode?: "off"|"shadow"|"on", cfg?: object, catalog: object, builders: ReturnType<import("./builders.js").createBuilders>,
   *   clock?: () => number, timerMs?: number, sink?: (row: object) => void, onEffect?: (e: object) => void }} o
   */
  constructor(o) {
    this.mode = o.mode ?? process.env.STAGECRAFT ?? "off";
    this.clock = o.clock ?? (() => Date.now());
    this.builders = o.builders;
    this.cfg = config({ ...(o.cfg ?? {}), catalog: o.catalog, instant: o.builders?.instant });
    this.state = initPortfolio(o.lessonId, this.clock());
    this.sink = o.sink ?? (() => {});
    this.onEffect = o.onEffect ?? (() => {});
    this.ctl = new Map();
    this.timerMs = o.timerMs ?? 500;
    this.timer = null;
    this.closed = false;
  }
  start() {
    if (this.mode === "off" || this.timer) return this;
    this.timer = setInterval(() => this.input({ t: "timer", at: this.clock() }), this.timerMs);
    this.timer.unref?.();
    return this;
  }
  close() {
    this.closed = true;
    if (this.timer) clearInterval(this.timer);
    for (const c of this.ctl.values()) c.abort();
    this.ctl.clear();
  }
  /** One input; returns the reveal outcome if the input was a reveal point. Never throws. */
  input(inp) {
    if (this.mode === "off" || this.closed) return null;
    let res;
    try { res = step(this.state, inp, this.cfg); } catch (e) { this.sink({ kind: "error", at: this.clock(), reason: String(e?.message ?? e).slice(0, 80) }); return null; }
    this.state = res.state;
    let outcome = null;
    for (const e of res.effects) {
      try {
        if (e.e === "telemetry") this.sink(e.row);
        else if (e.e === "launch") this.launch(e);
        else if (e.e === "cancel") { this.ctl.get(e.candidateId)?.abort(); this.ctl.delete(e.candidateId); }
        else if (e.e === "reveal") outcome = e.outcome;
        this.onEffect(e);
      } catch { /* an effect handler never breaks the lesson */ }
    }
    return outcome;
  }
  /** The seam asks at a reveal point (synchronous, in-memory). shadow → null (decided and logged, never shown). */
  outcomeAt(point) { return this.decide(point).shown; }
  /** The decided outcome in every mode (shadow logs it and the kernel tracks it) and what may be shown (on only). */
  decide(point) {
    const o = this.input({ t: "reveal_point", point });
    return { decided: o, shown: this.mode === "on" ? o : null };
  }
  noteQuota(deployment, status, retryAfterMs) { this.input({ t: "quota", deployment, status, retryAfterMs, at: this.clock() }); }

  launch(e) {
    const c = this.state.candidates.find((x) => x.id === e.candidateId);
    if (!c) return;
    // build against the candidate's own premise (what isFresh checks at the reveal), not whatever is current now
    const key = { ...(this.state.meta.current ?? {}), ...(c.premise ?? {}) };
    const g = e.deployment ? globalTake(e.deployment, this.cfg.globalRpm?.[e.deployment], this.clock()) : { ok: true };
    if (!g.ok) {
      queueMicrotask(() => { this.noteQuota(e.deployment, 429, g.retryAfterMs); this.input({ t: "landed", candidateId: c.id, ok: false, retryable: true, costUsd: 0, at: this.clock() }); });
      return;
    }
    const ctl = new AbortController();
    this.ctl.set(c.id, ctl);
    const B = this.builders;
    const run = c.rung === "generated_spec" ? () => B.generatedSpec(c, e.deployment, ctl.signal, key)
      : c.rung === "image" ? () => B.image(c, e.deployment, ctl.signal, key)
      : c.rung === "live_codegen" ? () => B.liveCodegen(c, ctl.signal, key)
      : c.rung === "library" ? () => B.library(c)
      : null;
    if (!run) return;
    Promise.resolve().then(run).then((r) => {
      this.ctl.delete(c.id);
      if (ctl.signal.aborted) return this.input({ t: "landed", candidateId: c.id, ok: false, costUsd: r?.usd ?? 0, at: this.clock() });
      if (e.deployment) this.noteQuota(e.deployment, 200);
      this.input({ t: "landed", candidateId: c.id, ok: !!r?.ok, payload: r?.payload, checks: r?.checks, facts: r?.facts?.onScreen ? r.facts : undefined, costUsd: r?.usd ?? 0, at: this.clock() });
    }, (err) => {
      this.ctl.delete(c.id);
      const is429 = err?.status === 429;
      if (is429 && e.deployment) this.noteQuota(e.deployment, 429, err.retryAfterMs);
      this.input({ t: "landed", candidateId: c.id, ok: false, retryable: is429, costUsd: 0, at: this.clock() });
    });
  }
}
