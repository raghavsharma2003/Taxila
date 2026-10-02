// Which whiteboard values may become chalk-ledge chips. Pure (unit-tested).
import type { Family } from "../band.ts";

/**
 * Young ledge chips: pictures, numerals and short words only (§3.7: first-exposure chips are pictures or
 * numerals; the Young limit of 2 text regions). A sentence-length value of ANY non-image kind is left off the
 * Young ledge (and so off the board fallback and the day's artefact): the Director also sends worked-example
 * problems as kind "math" (state.js workedContent), and those are sentences. The Director should send short
 * shapes for Young whiteboards: flagged to the Director workstream.
 *
 * Safety by predicate: the safeguarding whiteboard (the helplines) always passes, whatever its length,
 * whenever the move is a safeguard OR the value carries a helpline number.
 */
export const YOUNG_CHIP_MAX = 12;
export const YOUNG_CHIP_WORDS = 3;
/** A mostly-numeric expression ("3/4 + 1/4 = 1") may run longer than a word chip. */
export const YOUNG_EXPR_MAX = 24;
const HELPLINE = /(^|\D)(1098|14416)(\D|$)/;

export function isHelpline(value: string): boolean {
  return HELPLINE.test(value);
}

/** Mostly digits / operators / fraction marks: at most a quarter of the non-space characters are letters. */
function mostlyNumeric(v: string): boolean {
  const s = v.replace(/\s+/g, "");
  if (!s) return false;
  const letters = (s.match(/\p{L}/gu) ?? []).length;
  return letters / s.length <= 0.25;
}

export function ledgeChipFits(c: { kind: string; value: string }, family: Family, opts?: { safeguard?: boolean }): boolean {
  if (opts?.safeguard || isHelpline(c.value)) return true;
  if (family !== "young" || c.kind === "image") return true;
  const v = c.value.trim().replace(/\s+/g, " ");
  if (!v) return false;
  if (mostlyNumeric(v)) return v.length <= YOUNG_EXPR_MAX;
  return v.length <= YOUNG_CHIP_MAX && v.split(" ").length <= YOUNG_CHIP_WORDS;
}
