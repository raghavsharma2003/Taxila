// Bands: ONE table for every superhuman spec (TEACHER-BRAIN §21.1 "one owner per shared thing"; LEARNER-MODEL §3).
// W2 seam commit (BUILD-PLAN §4). Band4 B1-B4 by CLASS (1-2, 3-4, 5-7, 8-9), Band3 A/B/C for register knobs, and
// ContractBand "6-9" | "10-15" (AGE) for the legacy contracts only. No spec may key behaviour on an ad-hoc "6-9" that
// could be read as class or age. The table itself lives in shared/learner.ts (BANDS, mirrored by server/learner/bands.js
// and asserted equal by tests/learner-shared.test.mjs); this module is the import point every W2+ stream uses, so a
// second band table can never appear.
import { BANDS, type Band3, type Band4, type BandRow, type ClassLevel, type ContractBand, type Register } from "./learner.ts";

export { BANDS };
export type { Band3, Band4, BandRow, ClassLevel, ContractBand, Register };

/** Band4 for a class level (1-9). Out of range → throws (a band is never guessed). */
export function band4Of(classLevel: number): Band4 {
  const row = BANDS[classLevel as ClassLevel];
  if (!row) throw new Error(`classLevel ${classLevel} out of range 1-9`);
  return row.b4;
}

/** The launch focus (owner 2026-10-04): classes 4-7, i.e. B2 (class 4) and B3 (5-7). Other classes must not break. */
export const LAUNCH_CLASSES: readonly ClassLevel[] = [4, 5, 6, 7];

/** The teacher's register for a class (decision D3): young 1-3, preteen 4-6, teen 7-9. Out of range → throws. */
export function registerOf(classLevel: number): Register {
  const row = BANDS[classLevel as ClassLevel];
  if (!row) throw new Error(`classLevel ${classLevel} out of range 1-9`);
  return row.register;
}

/** The legacy age band ("6-9" | "10-15") for a class: young → "6-9", preteen / teen → "10-15". Out of range → throws. */
export function contractBandOf(classLevel: number): ContractBand {
  const row = BANDS[classLevel as ClassLevel];
  if (!row) throw new Error(`classLevel ${classLevel} out of range 1-9`);
  return row.contract;
}

/** The classes of a register, as an inclusive [first, last] range (the persona sheets' `classes`). */
export function classesOf(register: Register): [number, number] {
  const cs = (Object.keys(BANDS) as unknown as number[]).map(Number).filter((c) => BANDS[c as ClassLevel].register === register);
  return [Math.min(...cs), Math.max(...cs)];
}
