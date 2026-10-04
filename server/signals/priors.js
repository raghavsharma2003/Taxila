// Constants for the signal layer. BAND_PRIORS and SIG_STATES mirror shared/signals.ts (the server is plain JS and does not
// import TypeScript); tests/signals-server.test.mjs asserts the copies are equal, so a second table cannot drift.
// Every threshold is [U] until its measurement id (SIGNALS-SPEC §9) passes.

export const SIG_STATES = Object.freeze([
  "evidenceWeight", "verifyDue", "unsureCorrect", "stepState", "recallCue", "teachFresh", "choiceDue", "paceDown",
  "breakDue", "childWin", "advanceOk", "consolidate", "tryFirst", "evidenceDiscount", "waitLonger", "nudgeAtSec",
  "relEvidence", "ABSTAIN",
]);

/** [U] planning estimates (SIGNALS-SPEC §2.5.5), replaced by SG-M9 pooled medians. */
export const BAND_PRIORS = Object.freeze({
  B1: { onsetNumberMs: 1800, onsetExplainMs: 3200, articulationWps: 1.8, waitNudgeSec: 7, medianWords: 3, plannedMinutes: 15 },
  B2: { onsetNumberMs: 1500, onsetExplainMs: 2800, articulationWps: 2.1, waitNudgeSec: 6, medianWords: 4, plannedMinutes: 20 },
  B3: { onsetNumberMs: 1300, onsetExplainMs: 2400, articulationWps: 2.4, waitNudgeSec: 5, medianWords: 6, plannedMinutes: 25 },
  B4: { onsetNumberMs: 1200, onsetExplainMs: 2200, articulationWps: 2.6, waitNudgeSec: 5, medianWords: 7, plannedMinutes: 30 },
});

/** SL-8: a signal may never move pL by more than this per turn vs the no-signal fold (= MASTERY_NUDGE_CAP). */
export const MASTERY_NUDGE_CAP = 0.03;
/** SL-8: extra (consolidation) items a signal may cost per skill per session. */
export const MAX_CONSOLIDATE = 2;
/** SL-12: at most one verifying move per this many child turns. */
export const VERIFY_EVERY = 4;
/** A cue counts at this many of the child's OWN SDs (server/voice/features.js CUE_Z). */
export const CUE_Z = 1.5;
/** §2.6: live-lane acoustic q is capped here until SG-M11 validates the proxy. */
export const LIVE_Q_CAP = 0.5;
/** §2.5.4 session anchor: first N reliable answer turns; |median| at or above this with one sign = an off day. */
export const ANCHOR_N = 4;
export const ANCHOR_MIN = 0.75;
/** Features the anchor and drift read (per-child z from turnVoice). */
export const ANCHOR_FEATURES = Object.freeze(["onsetMs", "articulationWps", "pauseFrac"]);
/** D1 factors (§3.2). */
export const K_UNSURE = 0.8;
export const K_RIGHT_TO_WRONG = 0.8;
export const LR_FLUENT = 1.05;
export const LR_SLOW = 0.95;
export const LR_CLIP = Object.freeze([0.9, 1.1]);
/** D11 clamps (§3.2). */
export const NUDGE_MIN_SEC = 4;
export const NUDGE_MAX_SEC = 12;
/** STT families (§2.7): fillers/false starts kept only by a verbatim STT. */
export const STT_FAMILY = Object.freeze({
  "gpt-live-transcribe": "clean", "mai-transcribe-2": "verbatim", "gpt-4o-transcribe": "clean", typed: "typed", unknown: "clean",
});
