// Pure evidence predicates over kt_evidence rows (as loaded by facts.js). The report generator builds claims from
// these; the independent checker (check.js) re-implements its own reading from raw SQL rows and never imports this.
import { ITEM_CLASSES, isDelayedSuccess, outcomeName, recentValue } from "../learner/kt/outcomes.js";
import { DELAY_MS } from "./config.js";

const DAY_MS = 86_400_000;
/** Excluded from every child claim: contaminated rows and rows where a parent or sibling helped (assisted). */
const clean = (e) => !e.contaminated && !e.assisted && !e.teach;

/** A scored attempt at an item (NA = no attempt is not one). */
export const isAttempt = (e) => clean(e) && ITEM_CLASSES.has(e.cls) && outcomeName(e.cls, e.outcome) !== undefined && outcomeName(e.cls, e.outcome) !== "NA";
/** Right on the first try with no hint and no help asked before trying. */
export const isFirstTryUnaided = (e) => isAttempt(e) && recentValue(e.cls, e.outcome) === 1 && !e.preAttemptHelp && !(e.entryRung > 0);
/** Explained in own words: a full why, or a high / mid teach-back (never a game round). */
export const isExplained = (e) => clean(e) && e.via !== "game"
  && ((e.cls === "probe.why" && outcomeName(e.cls, e.outcome) === "full") || (e.cls === "probe.teachback" && ["high", "mid"].includes(outcomeName(e.cls, e.outcome))));
export const isTransferPass = (e) => clean(e) && e.via !== "game" && (e.cls === "probe.transfer.near" || e.cls === "probe.transfer.far") && outcomeName(e.cls, e.outcome) === "pass";
export const isErrorspotFixed = (e) => clean(e) && e.via !== "game" && e.cls === "probe.errorspot" && outcomeName(e.cls, e.outcome) === "caught_fixed";

export const inWindow = (e, w) => e.at >= w.from && e.at < w.to;
/** "{d} days later": whole days, rounded, at least 1 (the checker uses the same written rule). */
export const gapDays = (ms) => Math.max(1, Math.round(ms / DAY_MS));

/**
 * Delayed successes: a first-try unaided success (item C0, a near-transfer pass or a caught+fixed error-spot) whose
 * PREVIOUS contact with the same skill (any row, teach included) was in another session at least 20 h earlier.
 * @param {any[]} events seq-ascending
 * @returns {{ ev: any, prev: any, skillId: string, gapMs: number, d: number }[]}
 */
export function delayedSuccesses(events) {
  const last = new Map();
  const out = [];
  for (const e of events) {
    for (const s of e.skillIds) {
      const p = last.get(s);
      const ok = clean(e) && isDelayedSuccess(e.cls, e.outcome) && !e.preAttemptHelp && !(e.entryRung > 0);
      if (ok && p && p.sessionId !== e.sessionId) {
        const gapMs = Date.parse(e.at) - Date.parse(p.at);
        if (gapMs >= DELAY_MS) out.push({ ev: e, prev: p, skillId: s, gapMs, d: gapDays(gapMs) });
      }
      last.set(s, e);
    }
  }
  return out;
}

/** Group events by each skill they touch. */
export function bySkill(events) {
  const m = new Map();
  for (const e of events) for (const s of e.skillIds) { if (!m.has(s)) m.set(s, []); m.get(s).push(e); }
  return m;
}
