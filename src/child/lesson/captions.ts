// Caption line fitting (§3.8): current phrase only, split at clause boundaries from the transcript's
// punctuation so a line never wraps mid-word in portrait. There are no word timestamps on either lane
// (R5), so while she speaks the clause advances on a speech-rate estimate; once she stops, the last full
// sentence (usually the question she handed over, up to two lines) stays up. No word highlight ships until E-8 says it may.
import type { Band, ReadingLevel } from "../band.ts";

const MAX_WORDS_PER_LINE = 9;
/** ~2.6 spoken words per second for her Hinglish register, plus a beat per clause. */
const MS_PER_WORD = 380;
const CLAUSE_BEAT_MS = 250;

/** A clause chunk fits two caption lines at the narrowest caption box (195 px beside her picture at 360 px). */
const MAX_CHARS = 38;
/** At rest, the last full sentence may take two lines. */
const MAX_REST_WORDS = MAX_WORDS_PER_LINE * 2;

export function clauses(text: string): string[] {
  const parts = text
    .replace(/\s+/g, " ")
    .trim()
    // Clause boundaries: punctuation followed by a space, and em / en dashes (with or without spaces).
    .split(/(?<=[,.;:!?।…])\s+|\s*[—–]\s*|\s+-\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // A long clause is cut at word boundaries into the FEWEST chunks that each fit the caption: at most MAX_WORDS_PER_LINE
  // words AND MAX_CHARS characters (r7 director10 replay: 39 of 273 clauses of one lesson lost their last words at 360 px,
  // where the line beside her picture is 195 px, two lines of about 24 characters). The chunks are balanced by length,
  // so there is never a stranded 2-word tail.
  const out: string[] = [];
  for (const p of parts) {
    const words = p.split(" ");
    const n = Math.max(Math.ceil(words.length / MAX_WORDS_PER_LINE), Math.ceil(p.length / MAX_CHARS), 1);
    if (n === 1 || words.length < 2) { out.push(p); continue; }
    const target = p.length / n;
    let cur: string[] = [], len = 0, made = 0;
    words.forEach((w, i) => {
      const left = words.length - i;
      // close the chunk before this word when it has reached its share, and the rest can still make the remaining chunks
      const over = len + 1 + w.length;
      const share = made < n - 1 && over > target * 1.15 && left >= n - 1 - made;
      if (cur.length && (share || over > MAX_CHARS || cur.length >= MAX_WORDS_PER_LINE)) {
        out.push(cur.join(" ")); made++; cur = []; len = 0;
      }
      cur.push(w); len += (len ? 1 : 0) + w.length;
    });
    if (cur.length) out.push(cur.join(" "));
  }
  return out;
}

/**
 * What stays up once she stops: the last full sentence (usually the question she handed over), up to two
 * lines; a longer last sentence falls back to its last clause.
 */
export function restingLine(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  const sentences = flat.split(/(?<=[.!?।…])\s+/).filter(Boolean);
  const last = sentences[sentences.length - 1] ?? flat;
  if (last.split(" ").length <= MAX_REST_WORDS) return last;
  const list = clauses(last);
  return list[list.length - 1] ?? last;
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
