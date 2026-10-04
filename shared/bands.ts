// Bands: ONE table for every superhuman spec (TEACHER-BRAIN §21.1 "one owner per shared thing"; LEARNER-MODEL §3).
// W2 seam commit (BUILD-PLAN §4). Band4 B1-B4 by CLASS (1-2, 3-4, 5-7, 8-9), Band3 A/B/C for register knobs, and
// ContractBand "6-9" | "10-15" (AGE) for the legacy contracts only. No spec may key behaviour on an ad-hoc "6-9" that
// could be read as class or age. The table itself lives in shared/learner.ts (BANDS, mirrored by server/learner/bands.js
// and asserted equal by tests/learner-shared.test.mjs); this module is the import point every W2+ stream uses, so a
// second band table can never appear.
import { BANDS, type Band3, type Band4, type BandRow, type ClassLevel, type ContractBand } from "./learner.ts";

export { BANDS };
export type { Band3, Band4, BandRow, ClassLevel, ContractBand };

/** Band4 for a class level (1-9). Out of range → throws (a band is never guessed). */
export function band4Of(classLevel: number): Band4 {
  const row = BANDS[classLevel as ClassLevel];
  if (!row) throw new Error(`classLevel ${classLevel} out of range 1-9`);
  return row.b4;
}

/** The launch focus (owner 2026-10-04): classes 4-7, i.e. B2 (class 4) and B3 (5-7). Other classes must not break. */
export const LAUNCH_CLASSES: readonly ClassLevel[] = [4, 5, 6, 7];
