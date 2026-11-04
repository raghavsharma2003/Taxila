// Bands and the grade-equivalent scale derive from classLevel only (LEARNER-MODEL §3, LM18: no date of
// birth). One table: shared/learner.ts BANDS (Brain); this module re-exports it.

// round 7 (PIPELINE §A: Brain owns the band table): derived from shared/learner.ts BANDS, never redefined, so the
// register (young 1-3, preteen 4-6, teen 7-9; decision D3) and the class-4 move reach every reader at once.
import { BANDS as SHARED_BANDS } from "../../shared/learner.ts";

export const BANDS = SHARED_BANDS;

/** @param {number} classLevel 1-9 */
export function bandsFor(classLevel) {
  const b = BANDS[classLevel];
  if (!b) throw new Error(`classLevel ${classLevel} out of range 1-9`);
  return b;
}

/** GE origin: 0.0 = start of Class 1, so the start of Class c is c − 1. */
export const geStartOfClass = (classLevel) => classLevel - 1;
