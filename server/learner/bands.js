// Bands and the grade-equivalent scale derive from classLevel only (LEARNER-MODEL §3, LM18: no date of
// birth). One table; shared/learner.ts BANDS mirrors it and tests/learner-bands.test.mjs asserts equality.

export const BANDS = Object.freeze({
  1: { b4: "B1", b3: "A", contract: "6-9", typicalAge: [6, 7] }, 2: { b4: "B1", b3: "A", contract: "6-9", typicalAge: [7, 8] },
  3: { b4: "B2", b3: "A", contract: "6-9", typicalAge: [8, 9] }, 4: { b4: "B2", b3: "B", contract: "6-9", typicalAge: [9, 10] },
  5: { b4: "B3", b3: "B", contract: "10-15", typicalAge: [10, 11] }, 6: { b4: "B3", b3: "B", contract: "10-15", typicalAge: [11, 12] },
  7: { b4: "B3", b3: "C", contract: "10-15", typicalAge: [12, 13] }, 8: { b4: "B4", b3: "C", contract: "10-15", typicalAge: [13, 14] },
  9: { b4: "B4", b3: "C", contract: "10-15", typicalAge: [14, 15] },
});

/** @param {number} classLevel 1-9 */
export function bandsFor(classLevel) {
  const b = BANDS[classLevel];
  if (!b) throw new Error(`classLevel ${classLevel} out of range 1-9`);
  return b;
}

/** GE origin: 0.0 = start of Class 1, so the start of Class c is c − 1. */
export const geStartOfClass = (classLevel) => classLevel - 1;
