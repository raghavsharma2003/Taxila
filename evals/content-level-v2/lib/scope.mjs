// NCERT 2025-26 chapter scope per class x subject, read from data/curriculum (read-only). Rubric v2 gives the rater the
// scope of class C and the two classes below, so "is this taught before class C?" is judged against the CURRENT books,
// not the legacy CBSE syllabus (v1 bias 2: 7/17 false positives were NCERT-2023 syllabus shifts).
import { readFileSync, existsSync } from "node:fs";

const DIR = new URL("../../../data/curriculum/", import.meta.url);
const cache = new Map();
export function curriculum(cls, subject) {
  const k = `${cls}-${subject}`;
  if (cache.has(k)) return cache.get(k);
  const f = new URL(`c${cls}-${subject}.json`, DIR);
  const d = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
  cache.set(k, d);
  return d;
}
/** The science lineage: EVS in classes 3-5, Science from class 6. */
export const lineage = (cls, subject) => (subject === "science" || subject === "evs") ? (cls <= 5 ? "evs" : "science") : subject;

export function scopeLine(cls, subject) {
  const d = curriculum(cls, lineage(cls, subject));
  if (!d) return `class ${cls}: (no book in seed)`;
  return `class ${cls} ${d.book}: ` + d.chapters.map((c) => `${c.number}. ${c.title}${c.topics?.length && c.topics.length < 6 ? " [" + c.topics.map((t) => t.title).join("; ") + "]" : ""}`).join(" | ");
}
/** Scope block for class C: classes C-2..C (and C+1 for the too-hard check). */
export function scopeBlock(cls, subject) {
  return [cls - 2, cls - 1, cls, cls + 1].filter((c) => c >= 1 && c <= 10).map((c) => scopeLine(c, subject)).join("\n");
}
