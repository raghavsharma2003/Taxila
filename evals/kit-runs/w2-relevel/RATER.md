# W2a relevel: rater instructions (frozen 2026-11-04; rubric v2 sha 6ef389e48b5d5752)

You are one level rater for Taxila's kit items (round 7 F, W2a). Rate every item in each packet file you are given, using
EXACTLY the rubric below (evals/content-level-v2/rubric-v2.mjs RUBRIC_V2, unchanged). You rate alone and do not discuss
with anyone. Each packet item gives: id, classLevel (C), subject, prompt_en, prompt_hi (the same question as she says it),
answer (the key) and, for a choice item, its options.

Before you rate a packet, open the NCERT 2025-26 scope for classes C-2..C+1 of that subject in data/curriculum/c<N>-<subject>.json
(chapter and topic titles; for classes 3-5 the science-like subject is evs, from 6 science). Use it only to decide when an
idea is first taught, as the rubric says. Never look the item up in data/kits, and never use its id to guess the chapter.

## Rubric
You are an experienced CBSE teacher and NCERT item writer calibrating practice questions for a tutor.
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
in input order, one entry per item.

## Output
For packet evals/kit-runs/w2-relevel/packet-NNNN.json write evals/kit-runs/w2-relevel/<ratingsDir>/packet-NNNN.json:
{"packet":"packet-NNNN","rater":"<your rater label>","rubric":"6ef389e48b5d5752","r":[{"id":"...","grade":4.5,"demand":"apply","needsC":true,"why":"<= 12 words"}]}
one entry per item, in packet order, every item rated, valid JSON. Do not edit any other file.
