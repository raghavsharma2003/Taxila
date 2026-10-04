// Earned weight (SPEC §1.4, §4.3): per-state ladder level → the LR cap voice may apply, plus the move licence. A level is
// a CONFIG ROW with the measurement id that earned it, never a code default above L0. Demotion is automatic (G-VS-LADDER):
// a monthly refit that fails the bar a level was granted on drops the state one level.
// Pure: no I/O. The −0.03 per-turn pL cap is SIGNALS SL-8 (server/signals clipMasteryNudge) and is not this module's.

/** @typedef {"fluentRecall"|"workingAloud"|"fragileCorrect"|"heldBelief"|"effortfulGuess"|"rapidGuess"|"searching"|"absent"} VsState */

export const VS_STATES = Object.freeze([
  "fluentRecall", "workingAloud", "fragileCorrect", "heldBelief", "effortfulGuess", "rapidGuess", "searching", "absent",
]);

/** LR caps per level [L0, L1, L2, L3] as [lo, hi]. L0 = shadow: LR is always 1. */
export const LR_CAPS = Object.freeze({
  fluentRecall: [[1, 1], [1, 1.1], [1, 1.25], [1, 1.5]],
  workingAloud: [[1, 1], [1, 1], [1, 1], [1, 1]],
  fragileCorrect: [[1, 1], [0.9, 1], [0.8, 1], [0.67, 1]],
  heldBelief: [[1, 1], [0.9, 1], [0.8, 1], [0.67, 1]],
  effortfulGuess: [[1, 1], [1, 1], [1, 1], [1, 1]],
  // rapidGuess down-weights the answer (evidence ×0.5 toward 1), it never penalises the child: no LR of its own.
  rapidGuess: [[1, 1], [1, 1], [1, 1], [1, 1]],
  // searching / absent ROUTE the event (FSRS lapse vs pL); they carry no LR.
  searching: [[1, 1], [1, 1], [1, 1], [1, 1]],
  absent: [[1, 1], [1, 1], [1, 1], [1, 1]],
});

/** pL effect cap per turn (upward) by level; downward is always SL-8's 0.03. */
export const PL_UP_CAP = Object.freeze({ fluentRecall: [0, 0.03, 0.04, 0.05] });

/** Move licence when voice alone reads the state, and with Tier-T agreement (SPEC §1.4). */
export const LICENCE = Object.freeze({
  fluentRecall: { voiceOnly: "none", withT: "advanceOk_input" },
  workingAloud: { voiceOnly: "wait", withT: "wait" },
  fragileCorrect: { voiceOnly: "why_probe", withT: "why_probe_or_consolidate" },
  heldBelief: { voiceOnly: "none", withT: "contrast_and_delayed_recheck" },
  effortfulGuess: { voiceOnly: "none", withT: "scaffold" },
  rapidGuess: { voiceOnly: "reask", withT: "evidence_discount" },
  searching: { voiceOnly: "recall_cue", withT: "fsrs_lapse_route" },
  absent: { voiceOnly: "none", withT: "teach_fresh" },
});

/** Cheap moves (useful whether or not the reading is right) are the only ones voice may buy alone (SL-4). */
export const CHEAP = Object.freeze(new Set(["wait", "why_probe", "reask", "recall_cue"]));

/** Entry bars per level (SPEC §4.3), for the refit job to check. Pre-registered; all child-clustered. */
export const BARS = Object.freeze({
  1: "stage-1 calibration fitted on the pilot, ECE <= 0.08, fire-rate fairness (VS-A6) passes",
  2: "VS-A1 dAUROC >= 0.03 over text-only (80% CI excludes 0), VS-A4 ECE <= 0.05, VS-A6 breakdowns pass",
  3: "L2 bars replicated on a second cohort (n >= 200 children) and VS-A13 delayed accuracy +0.03 (CI excludes 0)",
});

/**
 * The shipped ladder: every state at L0 (shadow). Raising a row is a reviewed diff that names the measurement id.
 * @type {Record<VsState, { level: 0|1|2|3, earnedBy: string|null, at: string|null }>}
 */
export const LADDER = Object.freeze(Object.fromEntries(VS_STATES.map((s) => [s, Object.freeze({ level: 0, earnedBy: null, at: null })])));

/** The [lo, hi] LR cap for a state at a level (L0 → [1, 1]). */
export function capFor(state, level) {
  const row = LR_CAPS[state];
  if (!row) return [1, 1];
  const l = Math.max(0, Math.min(3, level | 0));
  return row[l];
}

export function levelOf(state, ladder = LADDER) {
  return ladder[state]?.level ?? 0;
}

/**
 * Monthly refit outcome → next ladder row. A failed bar at the granted level demotes one level; a pass keeps it. Promotion
 * is never automatic (a person reviews the measurement and raises the row).
 * @param {{ level: number, earnedBy: string|null, at: string|null }} row @param {{ passed: boolean, measurementId: string, at: string }} refit
 */
export function afterRefit(row, refit) {
  if (refit.passed || row.level === 0) return { ...row };
  return { level: row.level - 1, earnedBy: `demoted:${refit.measurementId}`, at: refit.at };
}
