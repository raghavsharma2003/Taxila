// Which whiteboard values may become chalk-ledge chips. Pure (unit-tested).
import type { Family } from "../band.ts";

/**
 * Young ledge chips: pictures, numerals and short words only (§3.7: first-exposure chips are pictures or
 * numerals; the Young limit of 2 text regions). A sentence-length text value is left off the Young ledge
 * (and so off the board fallback and the day's artefact). The Director should send short shapes for Young
 * whiteboards: flagged to the Director workstream.
 */
export const YOUNG_CHIP_MAX = 12;
export function ledgeChipFits(c: { kind: string; value: string }, family: Family): boolean {
  return family !== "young" || c.kind !== "text" || c.value.trim().length <= YOUNG_CHIP_MAX;
}
