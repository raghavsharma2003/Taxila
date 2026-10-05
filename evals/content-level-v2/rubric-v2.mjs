// Calibration rubric v2 (RS-6, 2026-10-04). Frozen before any v2 output was read; its sha256 is written next to every
// result so a later edit cannot be compared silently. What changed from v1 (evals/content-level/judge.mjs RUBRIC) and why:
//   1. Chapter anchoring (v1 bias 1: the dice item was "grade 4, requires counting all faces of a cube"): the rater is NOT
//      shown the chapter, topic title or outcome of the item. It sees the question, the key and the class.
//   2. Legacy syllabus (v1 bias 2): the rater gets the 2025-26 NCERT chapter scope of classes C-2..C+1 (data/curriculum),
//      and is told to judge "taught before class C?" against those books only.
//   3. Verdict drift (v1's "too_easy" also meant "below class-C exercises", so literal-recall comprehension was flagged):
//      v2 asks for a grade and a demand, and the verdict is computed by CODE (too_easy = grade <= C-2; too_hard = grade >= C+2).
//   4. Comprehension shape (17 v1 false positives were acceptable comprehension/inference items): a question about a
//      class-C text is rated by the reading and reasoning it needs at that class, not as "everyday recall".
import { createHash } from "node:crypto";

export const RUBRIC_V2 = `You are an experienced CBSE teacher and NCERT item writer calibrating practice questions for a tutor.
For each item you get: the child's class C, the subject, the question as the child hears it, and its answer key.
You are NOT told which chapter it comes from. Do not guess the chapter and do not let a topic name raise your rating.

Rate the DEMAND of this exact question:
- grade: the school class (1-10, decimals like 4.5 allowed) whose NCERT 2025-26 exercises ask questions of this demand:
  size of numbers, number of steps, abstraction, vocabulary, and the reasoning needed. A question that a child could answer
  from everyday life with no schooling on the idea is rated by the class where children can answer it, usually low.
- demand: "recall" (state a fact or count something shown), "apply" (use a taught procedure or idea once),
  "reason" (two or more linked steps, explain why, compare cases), "transfer" (use the idea in an unfamiliar setting).
- needsC: true only if answering needs an idea or skill that the scope below first teaches in class C or later.

Use the 2025-26 NCERT scope given for classes C-2..C+1 to decide when an idea is taught. Ignore the older CBSE syllabus:
for example Ganita Prakash 7 teaches decimals, arithmetic expressions and letter-numbers, so a fair class-7 question on
them is grade 7 even if older books taught a simpler version earlier.

Language and reading items: a comprehension question about a text from the class-C book is rated by the reading and
inference it needs from a class-C reader; recalling a detail of a class-C text is at least grade C-1. Rhymes, spelling of
very common words, picture vocabulary and opposites of everyday words are rated where children actually learn them.

Be calibrated, not harsh: a gentle first step that still needs the class-C idea is grade C-1 to C.
Reply as JSON: {"r":[{"id":"...","grade":<number>,"demand":"recall|apply|reason|transfer","needsC":true|false,"why":"<= 12 words"}]}
in input order, one entry per item.`;

export const RUBRIC_V2_SHA = createHash("sha256").update(RUBRIC_V2).digest("hex").slice(0, 16);

/** Code-computed verdict from a v2 rating (rubric change 3). */
export function verdictV2(cls, r) {
  if (!r || typeof r.grade !== "number") return null;
  if (r.grade <= cls - 2) return "too_easy";
  if (r.grade >= cls + 2) return "too_hard";
  return "right";
}
