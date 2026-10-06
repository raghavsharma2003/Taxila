// Round 2, stream latency: the turn's PERCEIVE stage (classifyFast ∥ classify ∥ the UNDERSTAND note ∥ speculative replies),
// as one function both the turn (server/brain/turn.js) and the turn PREFETCH (server/latency/routes.js) run, so that work
// started on the device's stable partial transcript, before the final transcript and the /turn request exist, is the
// SAME work the turn would have started, and the turn adopts it instead of starting it again.
//
// Why (docs/design/round2/latency/RESEARCH.md): on gpt-live-transcribe the joined transcription deltas are complete
// ~0.3 s BEFORE the server VAD's speech_stopped and ~0.8 s before the "completed" transcript the turn waits for
// (evals/model-refresh-2026-10-04/router-shipnow/cascade-latency-live-transcribe-2026-10-04.json: last delta p50 -278 ms
// vs speech_stopped, completed +508 ms). Every model call of the turn can start that much earlier (Voice-Light 2026,
// Deepgram Flux EagerEndOfTurn: the same idea on other stacks).
//
// Correctness rules (nothing here commits, speaks or grades on its own):
//  1. ADOPT ONLY ON IDENTICAL INPUTS. A prefetch is keyed by fingerprint(): the lesson, the stored state it read (hash of
//     the whole jsonb), the child's text byte for byte, and every classify() input except the ASR confidence (which only
//     classifyFast reads: the turn re-runs classifyFast on the real confidence and adopts only if the result is identical).
//     Anything else → the turn runs perceive() itself, exactly as before. So the grade and the model distress read the turn
//     commits are always the ones computed on the turn's own inputs.
//  2. A speculative reply is used only through pickSpeculation's exact reply-key match (unchanged rule); all the turn's
//     post-reply guards (safety opening, relational floor, spoils, gender) still run on it.
//  3. NOTE-PARALLEL: on a non-answer turn the note is waited on (≤ NOTE_WAIT_MS from its start). Today the reply call starts
//     only after that wait. Here, the moment classify() returns a non-answer while the note is still out, the reply for the
//     no-note plan is written in parallel; if the note then leaves the reply key unchanged (no note, shadow, or an intent
//     that maps to no request) the reply is already there. If the note changes the plan, the key differs and the turn
//     writes the reply as before. Costs at most one extra reply call per non-answer turn, never quality.
//  4. Degrades, never fails: a prefetch that errors, a 429, a mismatch → the turn's own path.
import { createHash } from "node:crypto";

/** How long a prefetch waits for its turn. */
export const PREFETCH_TTL_MS = 20_000;
/** Prefetches per lesson per minute (a child who pauses mid-thought re-sends as the deltas change). */
export const PREFETCH_PER_MIN = 30;

const sha1 = (s) => createHash("sha1").update(s).digest("hex");

/** The classify() inputs that decide its model call (everything except `trace` and `asrConfidence`), in a fixed order. */
export function clsInputs(a) {
  return [a.target ?? null, a.childText ?? "", a.heard ?? null, a.lang ?? null, !!a.typed, a.chipId ?? null, a.moduleAnswer ?? null, a.classLevel ?? null];
}

/**
 * The adopt key: the same lesson, the same stored state (the jsonb as read), the same words, the same classify inputs,
 * and the same barge-in bit (the plan reads it).
 */
export function fingerprint({ lessonId, state, clsArgs, bargeIn = false }) {
  return sha1(JSON.stringify([String(lessonId), sha1(JSON.stringify(state ?? null)), clsInputs(clsArgs), !!bargeIn]));
}

/**
 * Rule 3 is OFF by default; TAXILA_NOTE_PARALLEL=on turns it on. Measured 2026-10-06 (evals/latency/turn-e2e.mjs, local,
 * n = 40 turns over two runs): it launched 8 extra reply calls and 1 of them was used (in the other 7 the note changed the
 * plan; in 29 more the no-note key was already a speculative reply: "dup"). Quotas are maxed, so a 1-in-8 call is not worth
 * it on this script; kept behind the flag for a script with more "no note / shadow" non-answers.
 */
export const noteParallelOn = (env = process.env) => /^(on|1|true|yes)$/i.test(String(env.TAXILA_NOTE_PARALLEL ?? ""));

/** A promise's settled-ness without awaiting it. */
function track(p) {
  const t = { settled: false, value: undefined };
  p?.then((v) => { t.settled = true; t.value = v; }, () => { t.settled = true; });
  return t;
}

/** A non-answer: the turn waits for the note before it plans (turn.js `nonAnswer`). */
export const isNonAnswer = (cls) => !!cls && cls.outcome === "no_evidence" && !cls.request && !cls.help && !cls.flags?.distress;

/**
 * The perceive stage. Mirrors the turn's lines exactly: classifyFast; the speculative replies when the bytes decided
 * nothing (text lanes); the UNDERSTAND note under the same condition; classify(). Plus the note-parallel reply (rule 3).
 * @param {{ classifyFast: Function, classify: Function, understand: Function, speculate: Function, planTurn: Function,
 *   replyKey: Function, textReply: Function, conv2Mode: () => string, now?: () => number }} d
 * @param {{ classified: boolean, clsArgs: object, state: object, target: object, planCtx: object, said: string,
 *   historyOf: Function, textLane: boolean, late: boolean, help: any, childText: string, noteArgs: object | null,
 *   noteParallel?: boolean }} x
 */
export function perceive(d, x) {
  const now = (d.now ?? Date.now)();
  const fast = x.classified ? d.classifyFast(x.clsArgs) : null;
  const specs = x.textLane && !x.late && fast && !fast.result
    ? d.speculate(x.state, x.target, fast.flags, { ...x.planCtx, now }, { said: x.said, historyOf: x.historyOf }, fast.lowAsr ? { outcomes: ["no_evidence"], source: "asr" } : {})
    : [];
  const c2 = d.conv2Mode();
  const noteT0 = performance.now();
  const noteP = c2 !== "off" && !x.late && fast && !fast.result && !fast.lowAsr && !fast.request && x.childText && !x.help && x.noteArgs
    ? d.understand({ ...x.noteArgs, trace: x.clsArgs.trace }) : null;
  noteP?.catch(() => {});
  const noteState = track(noteP);
  const clsP = x.classified ? d.classify(x.clsArgs) : Promise.resolve(null);
  clsP.catch(() => {});
  const out = { now, fast, specs, noteP, noteT0, clsP, c2, noteParallel: null };
  if (noteP && x.textLane && !x.late && (x.noteParallel === true || (x.noteParallel !== false && noteParallelOn()))) {
    out.noteParallel = clsP.then((cls) => {
      if (!isNonAnswer(cls) || noteState.settled) return null;
      return exactSpec(d, x, cls, now, specs);
    }).catch(() => null);
  }
  return out;
}

/**
 * The reply for the plan `cls` gives (the no-note plan), pushed onto `specs` so the turn's pickSpeculation finds it — unless
 * a speculative reply with the same key is already being written. Resolves with "dup" | "launched" | "hold" | null.
 */
async function exactSpec(d, x, cls, now, specs) {
  const trace = [];
  const plan = await d.planTurn(x.state, cls, { ...x.planCtx, now });
  if (plan.r.hold) return "hold";
  const next = plan.r.state;
  const history = x.historyOf(next);
  const key = d.replyKey(next, x.planCtx.kit, plan.r, plan.instructions, x.said, history);
  for (const p of [...specs]) {
    const s = await p.catch(() => null);
    if (s?.key === key) return "dup";
  }
  const result = d.textReply({ instructions: plan.instructions, state: next, kit: x.planCtx.kit, childText: x.said, trace, history, ui: plan.r.ui, module: next.module });
  result.catch(() => {});
  specs.push(Promise.resolve({ key, trace, result, noteParallel: true }));
  return "launched";
}

// ───────────────────────────── the prefetch store (per process) ─────────────────────────────

const store = new Map(); // lessonId → { fp, P, trace, at, text }
const rate = new Map(); // lessonId → [timestamps]

/** Keep one prefetch per lesson (the newest wins: the child's text grew). */
export function putPrefetch(lessonId, entry, nowMs = Date.now()) {
  for (const [id, e] of store) if (nowMs - e.at > PREFETCH_TTL_MS) store.delete(id);
  store.set(String(lessonId), { ...entry, at: nowMs });
}

/** May this lesson prefetch now? (PREFETCH_PER_MIN per rolling minute.) */
export function allowPrefetch(lessonId, nowMs = Date.now()) {
  const k = String(lessonId);
  const ts = (rate.get(k) ?? []).filter((t) => nowMs - t < 60_000);
  if (ts.length >= PREFETCH_PER_MIN) { rate.set(k, ts); return false; }
  ts.push(nowMs);
  rate.set(k, ts);
  if (rate.size > 5000) for (const [id, v] of rate) if (!v.some((t) => nowMs - t < 60_000)) rate.delete(id);
  return true;
}

/**
 * The turn's adopt check. Returns the prefetched perception when its fingerprint equals the turn's and classifyFast on the
 * turn's real inputs (with the real ASR confidence) gives the same result; else null. The entry is consumed either way
 * when the fingerprint matched (one turn adopts it at most once); a non-matching entry stays until its TTL (a later turn
 * can never match it: the state hash moves with every committed turn).
 */
export function adoptPrefetch(lessonId, { fp, fast }, nowMs = Date.now()) {
  const k = String(lessonId);
  const e = store.get(k);
  const miss = (why) => { misses.set(k, why); if (misses.size > 2000) misses.delete(misses.keys().next().value); return null; };
  if (!e) return miss("none");
  if (nowMs - e.at > PREFETCH_TTL_MS) return miss("expired");
  if (e.fp !== fp) return miss(e.text === undefined ? "inputs" : "inputs_or_words");
  store.delete(k);
  if (JSON.stringify(e.P.fast ?? null) !== JSON.stringify(fast ?? null)) return miss("fast");
  misses.delete(k);
  return { ...e.P, prefetch: { adopted: true, aheadMs: nowMs - e.at, trace: e.trace } };
}

const misses = new Map(); // lessonId → why the last turn did not adopt (debug: the turn's debug.prefetch.miss)
/** Why the lesson's last turn did not adopt a prefetch ("none" = no prefetch arrived), or null. */
export const adoptMissOf = (lessonId) => misses.get(String(lessonId)) ?? null;

/** Tests only. */
export const __test = { store, rate, misses, clear: () => { store.clear(); rate.clear(); misses.clear(); } };
