// Bayesian Knowledge Tracing with forgetting, plus the mastery status ladder (learning-science §6 rule 2).
//
// Forgetting is a per-OPPORTUNITY transition (BKT+F), never a clock: nothing here lowers pKnown because
// time passed. Inherited law "no decay by absence" — a child who comes back after a month must not find
// a lower number waiting. Time enters only through the review scheduler (nextReview → status "due"),
// whose delayed retrieval then produces the evidence that moves pKnown, up or down.
//
// Pure functions only; persistence is learner/model.js.

/** Starting parameters per topic type (design priors — to be fitted on Taxila data). */
export const PARAMS = {
  T1: { pInit: 0.15, pLearn: 0.30, pSlip: 0.10, pGuess: 0.20, pForget: 0.02 }, // verbatim / sequence
  T2: { pInit: 0.15, pLearn: 0.25, pSlip: 0.10, pGuess: 0.20, pForget: 0.02 }, // vocabulary
  T3: { pInit: 0.10, pLearn: 0.15, pSlip: 0.12, pGuess: 0.25, pForget: 0.01 }, // concept / why
  T4: { pInit: 0.10, pLearn: 0.20, pSlip: 0.15, pGuess: 0.15, pForget: 0.01 }, // procedure
  T5: { pInit: 0.05, pLearn: 0.10, pSlip: 0.20, pGuess: 0.10, pForget: 0.01 }, // problem solving
};
export const paramsFor = (topicType) => PARAMS[topicType] ?? PARAMS.T3;

/**
 * How much each hint rung inflates the chance of a correct answer WITHOUT knowing (pump → assertion).
 * At rung 4 the answer was said, so a "correct" is almost no evidence at all.
 */
const HINT_GUESS = [0, 0.2, 0.4, 0.6, 0.95];

export const LEARNED_P = 0.6;
export const MASTERED_P = 0.8;
/** Probes that count as generative / transfer evidence (rule 2b): teach-back, why, near/far transfer, inverse, translate. */
export const GENERATIVE_PROBES = new Set(["P1", "P2", "P3", "P4", "P13", "P14"]);
/** Delayed retrieval must cross into a later session with at least this gap (same-sitting recall is not delayed). */
export const MIN_DELAY_MS = 6 * 3600_000;
/** Expanding review intervals in days. */
export const REVIEW_DAYS = [1, 3, 7, 16, 35, 75];
const DAY = 86_400_000;

const clamp = (p) => Math.min(0.999, Math.max(0.001, p));

/**
 * One BKT step.
 * @param {number} pKnown        prior P(known)
 * @param {import("../../shared/contracts").EvidenceOutcome} outcome
 * @param {number} hintsUsed     hint-ladder rungs consumed before this answer (0-4)
 * @param {number} probeWeight   likelihood weight (probe reliability × kit verification × gaming discount)
 * @param {typeof PARAMS.T3} params
 * @returns {number} posterior after the learn/forget transition
 */
export function update(pKnown, outcome, hintsUsed = 0, probeWeight = 1, params = PARAMS.T3) {
  if (outcome === "no_evidence" || !(probeWeight > 0)) return pKnown;
  const p = clamp(pKnown);
  const success = outcome === "correct" || outcome === "partial";
  // Hints weaken successes only: a wrong answer after help is still a wrong answer.
  const guess = success ? params.pGuess + (1 - params.pGuess) * HINT_GUESS[Math.max(0, Math.min(4, hintsUsed | 0))] : params.pGuess;
  const w = outcome === "partial" ? probeWeight * 0.5 : probeWeight;
  const lKnown = success ? 1 - params.pSlip : params.pSlip;
  const lUnknown = success ? guess : 1 - guess;
  // Tempered likelihood: weight < 1 moves the posterior less, > 1 (delayed retrieval) moves it more.
  const a = p * lKnown ** w;
  const b = (1 - p) * lUnknown ** w;
  const post = a / (a + b);
  return clamp(post * (1 - params.pForget) + (1 - post) * params.pLearn);
}

/** @returns {import("../../shared/contracts").SkillState} */
export function newSkillState(skillId, topicType, now = new Date()) {
  return {
    skillId, pKnown: paramsFor(topicType).pInit, status: "unseen", attempts: 0, correctUnaided: 0,
    generativePass: false, delayedPass: false, lastSeen: new Date(now).toISOString(),
  };
}

const LEARNED_STATES = new Set(["learned_today", "mastered", "due"]);

/** Status from the cumulative evidence flags (rule 2: mastered needs a, b AND c). */
export function deriveStatus(s) {
  if (s.attempts === 0) return s.status === "unseen" ? "unseen" : "introduced";
  if (s.correctUnaided >= 1 && s.generativePass && s.pKnown >= LEARNED_P) {
    return s.delayedPass && s.pKnown >= MASTERED_P ? "mastered" : "learned_today";
  }
  return "practising";
}

/**
 * Next review time. Just learned → 1 day. A successful delayed retrieval climbs the ladder from the
 * interval it was scheduled on; a failed one restarts at 1 day; other practice keeps the schedule.
 */
export function scheduleReview(prev, next, ev, now) {
  if (!LEARNED_STATES.has(next.status)) return undefined;
  const t = new Date(now).getTime();
  if (!LEARNED_STATES.has(prev.status) || !prev.nextReview) return new Date(t + REVIEW_DAYS[0] * DAY).toISOString();
  if (ev.probe !== "P10") return prev.nextReview;
  if (ev.outcome !== "correct" || ev.hintsUsed > 0) return new Date(t + REVIEW_DAYS[0] * DAY).toISOString();
  const lastInterval = (new Date(prev.nextReview).getTime() - new Date(prev.lastSeen).getTime()) / DAY;
  const days = REVIEW_DAYS.find((d) => d > lastInterval + 0.01) ?? REVIEW_DAYS[REVIEW_DAYS.length - 1];
  return new Date(t + days * DAY).toISOString();
}

/** "due" is derived on read: a learned skill whose review time has passed. */
export function withDue(s, now = new Date()) {
  if ((s.status === "learned_today" || s.status === "mastered") && s.nextReview && new Date(s.nextReview) <= new Date(now)) {
    return { ...s, status: "due" };
  }
  return s;
}

/**
 * Fold one piece of evidence into a skill state.
 * @param {import("../../shared/contracts").SkillState} prev
 * @param {import("../../shared/contracts").Evidence} ev
 * @param {{ topicType: string, now?: Date|string|number, lessonStartedAt: Date|string|number }} ctx
 * @returns {import("../../shared/contracts").SkillState}
 */
export function applyEvidence(prev, ev, { topicType, now = new Date(), lessonStartedAt }) {
  if (ev.outcome === "no_evidence") return prev;
  const at = new Date(now).getTime();
  const unaidedCorrect = ev.outcome === "correct" && ev.hintsUsed === 0;
  const wasLearned = LEARNED_STATES.has(prev.status);
  // Delayed = this is the first contact with the skill since before this lesson began, and the gap is real.
  const crossesSession = new Date(prev.lastSeen).getTime() < new Date(lessonStartedAt).getTime()
    && at - new Date(prev.lastSeen).getTime() >= MIN_DELAY_MS;
  const next = {
    ...prev,
    pKnown: update(prev.pKnown, ev.outcome, ev.hintsUsed, ev.weight, paramsFor(topicType)),
    attempts: prev.attempts + 1,
    correctUnaided: prev.correctUnaided + (unaidedCorrect ? 1 : 0),
    generativePass: prev.generativePass || (unaidedCorrect && GENERATIVE_PROBES.has(ev.probe)),
    delayedPass: ev.probe === "P10" && wasLearned && crossesSession ? unaidedCorrect : prev.delayedPass,
    lastSeen: new Date(at).toISOString(),
  };
  next.status = deriveStatus(next);
  const review = scheduleReview(prev, next, ev, at);
  if (review) next.nextReview = review; else delete next.nextReview;
  return next;
}

/** The teacher explained this skill: unseen → introduced (no evidence, pKnown untouched). */
export function markIntroduced(s) {
  return s.status === "unseen" ? { ...s, status: "introduced" } : s;
}
