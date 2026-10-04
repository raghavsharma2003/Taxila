// BKT-R: one evidence event → per-skill log-evidence → posterior → one transition per item-episode
// (LEARNER-MODEL §6.1 update rules 0-9). Pure; the session ledger (ledger.js) carries the per-(skill,
// session) budget and the episode set. Reads only held inputs (§13.1): no vibe, timing, affect or
// engagement value is a parameter of anything in this file.
import { EMISSIONS, OUTCOMES, outcomeName, confusion, fold, isNoUpdate } from "./outcomes.js";
import { retrievability } from "./fsrs.js";

/** Per-cohort ASR floor [U] (KT R23); below it an event is no evidence and never a wrong answer. */
export const ASR_MIN = Object.freeze({ default: 0.5 });
/** Σ_session w·log LR per (skill, session) is clamped to ±log 50 [U] (KT R3). */
export const SESSION_LOG_CAP = Math.log(50);
/** Learning transition per opportunity by topic type (§6.1 defaults; T1/T2 are FSRS+Elo in the spec, BKT here [U]). */
export const T_BY_TYPE = Object.freeze({ T1: 0.15, T2: 0.15, T3: 0.12, T4: 0.18, T5: 0.10 });
/** Guess/slip per topic type for the cold-start correction (cluster defaults, = legacy bkt.js PARAMS). */
export const GS_BY_TYPE = Object.freeze({
  T1: { g: 0.20, s: 0.10 }, T2: { g: 0.20, s: 0.10 }, T3: { g: 0.25, s: 0.12 }, T4: { g: 0.15, s: 0.15 }, T5: { g: 0.10, s: 0.20 },
});
export const TEACH_CAP = 0.10;
const P_MIN = 1e-6, P_MAX = 1 - 1e-6;

export const clampP = (p) => Math.min(P_MAX, Math.max(P_MIN, p));
export const logit = (p) => Math.log(clampP(p) / (1 - clampP(p)));
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));

/**
 * Rule 0 gate: why an event carries no evidence (null = it does).
 * @param {import("../../../shared/learner").EvidenceEvent} ev
 */
export function dropReason(ev, { cohort = "default", paraEnabled = false } = {}) {
  if (!OUTCOMES[ev.cls] || outcomeName(ev.cls, ev.outcome) === undefined) return "bad_outcome";
  if (ev.safetyFired) return "safety";
  if (ev.asrConf != null && ev.asrConf < (ASR_MIN[cohort] ?? ASR_MIN.default)) return "low_asr";
  if (isNoUpdate(ev.cls, ev.outcome)) return "no_attempt";
  if (ev.contaminated) return "contaminated";
  if (ev.cls === "para" && !paraEnabled) return "para_off";
  return null;
}

/**
 * Emission pair for one event after grader folding (rule 2) and the symmetric retrieval gate (rule 3),
 * at retrievability R. Returns { kR, u } for the observed outcome.
 */
export function gatedEmission(ev, R, confusionOverrides) {
  const e = EMISSIONS[ev.cls];
  const M = confusion(ev.grader, e.k.length, confusionOverrides?.[ev.cls]);
  const k1 = fold(e.k, M), u1 = fold(e.u, M);
  const o = ev.outcome;
  return { kR: R * k1[o] + (1 - R) * u1[o], u: u1[o] };
}

/**
 * Source weight on K (COMPREHENSION-ENGINE.md §1.1; = comprehension/params.js W_SRC): a game commit counts ×0.5 and a
 * Forge module (host-graded until the 50-session agreement gate) ×0.75. Lucky game predictions otherwise carried
 * guessers over the pL 0.6 "does it" line (comprehension sim: not_yet accuracy 0.62 with game evidence, 0.75 without).
 */
// studio (W2-H, LIVE-STUDIO D12 §3.10): host-graded Studio answers weigh like modules until ledger-game-full-weight resolves
export const SOURCE_WEIGHT = Object.freeze({ game: 0.5, module: 0.75, studio: 0.75 });
/**
 * The source an event's weight comes from: its via, except a late verdict's correction (via 'late',
 * comprehension/later.js lateEvent), which carries its held event's game / module source in its id (`<id>:late:<via>`).
 */
export const sourceOf = (ev) => (ev.via === "late" ? /:late:(game|module|studio)$/.exec(String(ev.id ?? ""))?.[1] ?? "late" : ev.via);
/** Rule 4 tempering exponent: assisted ^0.5, gaming window ^0.25, controllerEasy ^0.5, unverified kit ^0.5, source (game/module). */
export function temper(ev) {
  let x = SOURCE_WEIGHT[sourceOf(ev)] ?? 1;
  if (ev.assisted) x *= 0.5;
  if (ev.gamingWindowKt) x *= 0.25;
  if (ev.controllerEasy) x *= 0.5;
  if (ev.kitVerified === false) x *= 0.5;
  return x;
}

/**
 * Raw log-evidence per skill of one event, from the PRE-event pLs (conjunctive items, kt-algorithms §1.5:
 * the item is "known" only if every skill is; blame lands on the weakest). Single-skill = log(kR/u).
 * @param {number[]} pls pre-event pL per skill (same order as ev.skillIds)
 * @param {number[]} Rs retrievability per skill
 */
export function logEvidence(ev, pls, Rs, confusionOverrides) {
  if (pls.length === 1) {
    const { kR, u } = gatedEmission(ev, Rs[0], confusionOverrides);
    return [Math.log(kR / u)];
  }
  // conjunctive: gate with the weakest retrievability [U]
  const { kR, u } = gatedEmission(ev, Math.min(...Rs), confusionOverrides);
  return pls.map((p, i) => {
    const others = pls.reduce((a, q, j) => (j === i ? a : a * q), 1);
    const known = others * kR + (1 - others) * u;   // P(o | L_i = 1)
    const notKnown = u;                              // P(o | L_i = 0): the item is unknown
    return Math.log(known / notKnown);
  });
}

/**
 * Rules 5-6: the j-th event of a class on (skill, session) weighs 1/j; the session sum is clamped to
 * ±log 50. Returns the log-evidence actually applied and the new budget.
 * @param {{ sum: number, byClass: Record<string, number> }} budget
 */
export function spend(budget, cls, raw) {
  const j = (budget.byClass[cls] ?? 0) + 1;
  const c = raw / j;
  const sum = Math.max(-SESSION_LOG_CAP, Math.min(SESSION_LOG_CAP, budget.sum + c));
  return { applied: sum - budget.sum, budget: { sum, byClass: { ...budget.byClass, [cls]: j } } };
}

/** Rule 7 transition. T_eff = σ(logit T + η) with η only in M2+ (learning speed is not written in M1). */
export const tEff = (topicType, eta = 0) => sigmoid(logit(T_BY_TYPE[topicType] ?? T_BY_TYPE.T3) + eta);
export const transition = (q, T) => q + (1 - q) * T;
/** Teach-only episode: pL + (1 − pL)·T, capped at +0.10 per episode. */
export const teachStep = (pL, T, gainedThisEpisode = 0) => pL + Math.max(0, Math.min((1 - pL) * T, TEACH_CAP - gainedThisEpisode));

export { retrievability };
