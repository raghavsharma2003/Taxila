// Caption line fitting (§3.8): current phrase only, split at clause boundaries from the transcript's
// punctuation so a line never wraps mid-word in portrait. There are no word timestamps on either lane
// (R5), so while she speaks the clause advances on a speech-rate estimate; once she stops, the last clause
// (usually the question she handed over) stays up. No word highlight ships until E-8 says it may.
import type { Band, ReadingLevel } from "../band.ts";

const MAX_WORDS_PER_LINE = 9;
/** ~2.6 spoken words per second for her Hinglish register, plus a beat per clause. */
const MS_PER_WORD = 380;
const CLAUSE_BEAT_MS = 250;

export function clauses(text: string): string[] {
  const parts = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[,.;:!?।…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // A long clause with no punctuation is cut at word boundaries.
  const out: string[] = [];
  for (const p of parts) {
    const words = p.split(" ");
    for (let i = 0; i < words.length; i += MAX_WORDS_PER_LINE) out.push(words.slice(i, i + MAX_WORDS_PER_LINE).join(" "));
  }
  return out;
}

/** Index of the clause to show `ms` after her audio started; the last one once she is done. */
export function clauseAt(list: string[], ms: number, speaking: boolean): number {
  if (!list.length) return -1;
  if (!speaking) return list.length - 1;
  let acc = 0;
  for (let i = 0; i < list.length; i++) {
    acc += list[i].split(" ").length * MS_PER_WORD + CLAUSE_BEAT_MS;
    if (ms < acc) return i;
  }
  return list.length - 1;
}

export type CaptionMode = "icons" | "phrase";

/** Defaults by reading level; captions-always overrides (§3.8 table). */
export function captionMode(reading: ReadingLevel, always: boolean): CaptionMode {
  if (always) return "phrase";
  return reading === "R0" ? "icons" : "phrase";
}

export const readingFor = (band: Band): ReadingLevel => (band === "b1" ? "R0" : band === "b2" ? "R1" : "R2");
