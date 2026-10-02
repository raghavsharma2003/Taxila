// The seam from the live Director's per-answer Evidence (shared/contracts.ts Evidence, server/director/
// state.js evidenceFrom) to BKT-R EvidenceEvents. Pure. The route owns the ids (session = lesson id,
// episode = one item attempt chain) and the facts the old Evidence does not carry (tries before, whether
// the episode ended, the grader, options). Mapping (LEARNER-MODEL §6.1 outcome table, director probe ids):
//   P2 why → probe.why  · P1 teach-back → probe.teachback · P3 → transfer.near · P4 → transfer.far
//   P6 error-spot → errorspot · P5 predict → predict · P7 diagnostic / an item with K options → item.mcqK
//   anything else (P8 contrast, P10 retrieval, P14, P15 practice) → item.open, by the hint ladder:
//     correct: C0 first try no rung · C1 a later try no rung · C2 one rung · C3 two or three · C4 four (bottom-out)
//     "pata nahi" before attempting → IDK · an incorrect answer is NOT an outcome until the episode ends
//     (the ladder continues); an episode that ends without a correct answer is C4.
import { outcomeIndex } from "./outcomes.js";

const LEGACY_PROBE_CLASS = { P2: "probe.why", P1: "probe.teachback", P3: "probe.transfer.near", P4: "probe.transfer.far", P6: "probe.errorspot", P5: "probe.predict" };
const PROBE_OUTCOME = {
  "probe.why": { correct: "full", partial: "partial", incorrect: "none", misconception: "misconception" },
  "probe.teachback": { correct: "high", partial: "mid", incorrect: "low", misconception: "misconception" },
  "probe.transfer.near": { correct: "pass", partial: "fail", incorrect: "fail", misconception: "fail" },
  "probe.transfer.far": { correct: "pass", partial: "fail", incorrect: "fail", misconception: "fail" },
  "probe.errorspot": { correct: "caught_fixed", partial: "caught", incorrect: "missed", misconception: "missed" },
  "probe.predict": { correct: "right", partial: "other", incorrect: "other", misconception: "mapped_wrong" },
};

/** item.open outcome from the hint ladder; null = no outcome yet (the episode continues). */
export function openOutcome({ correct, triesBefore = 0, rungs = 0, idk = false, noAttempt = false, episodeEnded = false }) {
  if (noAttempt) return "NA";
  if (idk && triesBefore === 0 && rungs === 0) return "IDK";
  if (correct) return rungs >= 4 ? "C4" : rungs >= 2 ? "C3" : rungs === 1 ? "C2" : triesBefore > 0 ? "C1" : "C0";
  return episodeEnded ? "C4" : null;
}

/**
 * @param {import("../../../shared/contracts").Evidence} ev legacy evidence row
 * @param {{ id: string, sessionId: string, sessionStartAt: string, at: string, episodeId: string, topicType?: string,
 *   options?: number, triesBefore?: number, idk?: boolean, episodeEnded?: boolean, grader: 'code'|'llm'|'human', graderVersion?: string,
 *   asrConf?: number, kitVerified?: boolean, discriminates?: string, preAttemptHelp?: boolean, contaminated?: boolean,
 *   gamingWindowKt?: boolean, controllerEasy?: boolean, assisted?: 'parent'|'sibling'|null, safetyFired?: boolean, form?: 'produce'|'recognise' }} c
 * @returns {import("../../../shared/learner").EvidenceEvent | null} null when the answer is not (yet) an outcome
 */
export function fromLegacyEvidence(ev, c) {
  // The grader is a fact about THIS answer (classify.js graded it against a verified key = "code", a model
  // call = "llm"), never a default: an "llm" default would fold every code-graded answer through the 0.7
  // confusion matrix and keep θ frozen (thetaObs takes code-graded events only).
  if (!["code", "llm", "human"].includes(c.grader)) throw new Error(`fromLegacyEvidence ${c.id}: grader ('code'|'llm'|'human') is required`);
  if (ev.outcome === "no_evidence") return null;
  const base = {
    id: c.id, sessionId: c.sessionId, sessionStartAt: c.sessionStartAt, at: c.at, episodeId: c.episodeId, skillIds: [ev.skillId],
    itemKey: ev.itemId ?? `${ev.skillId}:${ev.probe}`, grader: c.grader, graderVersion: c.graderVersion ?? "classify-v1",
    ...(c.topicType ? { topicType: c.topicType } : {}), ...(c.asrConf != null ? { asrConf: c.asrConf } : {}),
    ...(c.kitVerified === false ? { kitVerified: false } : {}), ...(c.discriminates ? { discriminates: c.discriminates } : {}),
    ...(ev.misconceptionId ? { misconceptionId: ev.misconceptionId } : {}), ...(c.preAttemptHelp ? { preAttemptHelp: true } : {}),
    ...(c.contaminated ? { contaminated: true } : {}), ...(c.gamingWindowKt ? { gamingWindowKt: true } : {}),
    ...(c.controllerEasy ? { controllerEasy: true } : {}), ...(c.assisted ? { assisted: c.assisted } : {}),
    ...(c.safetyFired ? { safetyFired: true } : {}), ...(c.form ? { form: c.form } : {}),
  };
  const probeCls = LEGACY_PROBE_CLASS[ev.probe];
  if (probeCls) return { ...base, cls: probeCls, outcome: outcomeIndex(probeCls, PROBE_OUTCOME[probeCls][ev.outcome]) };
  if (c.options >= 2 || ev.probe === "P7") {
    const K = Math.min(4, Math.max(2, c.options ?? 3));
    if ((c.triesBefore ?? 0) > 0) return null;            // retries carry no evidence (elimination)
    const cls = `item.mcq${K}`;
    return { ...base, cls, outcome: outcomeIndex(cls, ev.outcome === "correct" ? "first_correct" : "wrong") };
  }
  const name = openOutcome({ correct: ev.outcome === "correct", triesBefore: c.triesBefore, rungs: ev.hintsUsed, idk: c.idk, episodeEnded: c.episodeEnded });
  if (!name) return null;
  return { ...base, cls: "item.open", outcome: outcomeIndex("item.open", name) };
}

/** A teach event (explanation, worked example, animation): transition only, no observation. */
export const teachEvent = ({ id, sessionId, sessionStartAt, at, episodeId, skillId, topicType }) =>
  ({ id, sessionId, sessionStartAt, at, episodeId, skillIds: [skillId], teach: true, cls: "item.open", outcome: 0, grader: "code", graderVersion: "teach", itemKey: `teach:${skillId}`, ...(topicType ? { topicType } : {}) });
