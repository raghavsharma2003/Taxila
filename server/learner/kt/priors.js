// Cold-start prior per skill (LEARNER-MODEL §6.1, KT R4 fix; §6.3.1 TH2): P = grid expectation of the
// 4PL at the skill's recalibrated b under the epoch BASE marginal of its strand (never in-session θ), then
// the guess/slip correction pL0 = clamp((P − g)/(1 − g − s), 0.02, 0.85), then the prerequisite cap
// min(pL_prereq) + 0.15. Materialised once, at the skill's first event, and frozen.
import { A_GE, SKILL_B_SD, bSkill, gAtten, gridExpectNormal, p4pl, strandOfSkill } from "./ability.js";
import { GS_BY_TYPE } from "./bktr.js";

export const PL0_MIN = 0.02, PL0_MAX = 0.85, PREREQ_MARGIN = 0.15;
/** Fallback when a skill has no curricular GE (legacy bkt.js pInit per topic type). */
export const PINIT_BY_TYPE = Object.freeze({ T1: 0.15, T2: 0.15, T3: 0.10, T4: 0.10, T5: 0.05 });

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** The guess/slip-corrected cold start from a predicted first-attempt success P. */
export const correctedPrior = (P, g, s) => clamp((P - g) / (1 - g - s), PL0_MIN, PL0_MAX);

/**
 * @param {{ strands: string[], m: number[], S: number[] } | null} base the epoch base (θ_base)
 * @param {string} skillId
 * @param {{ topicType?: string, prereqPLs?: number[], strand?: string }} [opts]
 * @returns {{ pL0: number, P: number | null, source: 'theta' | 'type_default' }}
 */
export function priorFromTheta(base, skillId, { topicType = "T3", prereqPLs = [], strand = strandOfSkill(skillId) } = {}) {
  const b = bSkill(skillId);
  const i = base ? base.strands.indexOf(strand) : -1;
  let pL0, P = null, source;
  if (b == null || i < 0) {
    pL0 = PINIT_BY_TYPE[topicType] ?? PINIT_BY_TYPE.T3;
    source = "type_default";
  } else {
    const n = base.strands.length;
    const a = A_GE * gAtten(SKILL_B_SD);
    P = gridExpectNormal(base.m[i], Math.sqrt(base.S[i * n + i]), (t) => p4pl(t, b, a));
    const { g, s } = GS_BY_TYPE[topicType] ?? GS_BY_TYPE.T3;
    pL0 = correctedPrior(P, g, s);
    source = "theta";
  }
  if (prereqPLs.length) pL0 = clamp(Math.min(pL0, Math.min(...prereqPLs) + PREREQ_MARGIN), PL0_MIN, PL0_MAX);
  return { pL0, P, source };
}
