// Misconceptions: a separate binary state per (child, misconception), logit m += log LR per event
// (LEARNER-MODEL §6.2, kt-algorithms §1.6). p ≥ 0.7 only ever buys a VERIFYING probe, never a verdict;
// resolved = p ≤ 0.2 after a discriminating probe, and is never set without a scheduled delayed check.
import { isGenerativePass, isUnaidedCorrect } from "./outcomes.js";

export const MIS_PRIOR = 0.15, LR_HIT = 6.9, LR_DISCRIMINATING_CORRECT = 0.49, VERIFY_P = 0.7, RESOLVE_P = 0.2;
const CHECK_DELAY_MS = 20 * 3600_000;
const logit = (p) => Math.log(p / (1 - p));
export const misP = (m) => 1 / (1 + Math.exp(-m.logit));

/** @returns {import("../../../shared/learner").MisconceptionState} */
export const newMisconception = (id, prior = MIS_PRIOR) =>
  ({ misconceptionId: id, logit: logit(prior), hits: 0, lastAt: null, resolvedAt: null, checkScheduledAt: null });

/**
 * Which misconception states one event touches: a hit on ev.misconceptionId (the grader mapped the
 * answer to that belief), or a correct answer on an item that discriminates ev.discriminates.
 */
export function misconceptionEffects(ev) {
  const out = [];
  if (ev.misconceptionId && ev.misRoute !== "skill") out.push({ id: ev.misconceptionId, kind: "hit" });
  if (ev.discriminates && ev.discriminates !== ev.misconceptionId
    && (isUnaidedCorrect(ev.cls, ev.outcome) || isGenerativePass(ev.cls, ev.outcome)) && !ev.assisted && !ev.preAttemptHelp) {
    out.push({ id: ev.discriminates, kind: "discriminating_correct" });
  }
  return out;
}

/** Raw log-evidence of one effect. */
export const misLogLR = (kind) => Math.log(kind === "hit" ? LR_HIT : LR_DISCRIMINATING_CORRECT);
/**
 * Σ_session log LR per (child, misconception, session) is clamped to ±log 50, as K's budget is (bktr SESSION_LOG_CAP).
 * Uncapped, five hits in one lesson put the logit at +7.9 and recovery after a successful re-teach needed ≥ 16
 * discriminating correct answers; capped, at most +3.9 per session (≤ 6 to resolve). Returns the applied delta.
 */
export const MIS_SESSION_LOG_CAP = Math.log(50);
export function spendMis(sum, raw) {
  const next = Math.max(-MIS_SESSION_LOG_CAP, Math.min(MIS_SESSION_LOG_CAP, sum + raw));
  return { applied: next - sum, sum: next };
}

/** Apply one effect. `at` is the session start (no intra-session clock). A discriminating correct answer
 * on a state with no hit only lowers the logit (the ledger does not even create such a row). */
export function updateMisconception(m, kind, at, delta = misLogLR(kind)) {
  const t = new Date(at).toISOString();
  if (kind === "hit") return { ...m, logit: m.logit + delta, hits: m.hits + 1, lastAt: t, resolvedAt: null, checkScheduledAt: null };
  const next = { ...m, logit: m.logit + delta, lastAt: t };
  if (m.hits > 0 && !m.resolvedAt && misP(next) <= RESOLVE_P) {    // never resolve (or schedule) what was never seen
    next.resolvedAt = t;
    next.checkScheduledAt = new Date(new Date(at).getTime() + CHECK_DELAY_MS).toISOString();
  }
  return next;
}

/** The Director's read: active (unresolved) misconceptions, with needsVerify at p ≥ 0.7. */
export function misconceptionView(states) {
  return Object.values(states).filter((m) => !m.resolvedAt && m.hits > 0)
    .map((m) => ({ id: m.misconceptionId, p: misP(m), needsVerify: misP(m) >= VERIFY_P, hits: m.hits }))
    .sort((a, b) => b.p - a.p || (a.id < b.id ? -1 : 1));
}
