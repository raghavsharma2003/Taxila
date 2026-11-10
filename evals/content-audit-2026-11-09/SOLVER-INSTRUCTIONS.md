# Blind-solve audit of school question data (Indian classes 1-9, CBSE/NCERT)

You are checking answer keys for a children's tutoring product. Work in two strict phases. Do not call any paid or network service. Do not edit anything under /home/user/Taxila.

## Phase 1: solve blind
Read ONLY `questions.json` in your batch folder. Do NOT open the keys folder yet.
Each entry has an id, class, subject, a prompt in English (`prompt_en`) and in Hinglish/Hindi (`prompt_hi`), sometimes `options` (then pick exactly one option text), a `unit`, or for kind `worked_example` a problem to solve fully.
Solve every item yourself, carefully (do the arithmetic on paper or with `node -e`; do not guess). Write `answers.json` in the batch folder: an array of
`{ "id", "answer", "note" }` where `note` (optional, short) records any of:
- the question is ambiguous, unanswerable as written (e.g. needs a picture that is not there), or has more than one / no correct option;
- prompt_en and prompt_hi ask different things or use different numbers;
- prompt_hi is Hindi/Hinglish that no Indian teacher would say (garbled, machine-translated, wrong word, wrong script mix). Normal classroom Hinglish is fine; only flag clear cases and quote the phrase;
- the content is clearly wrong for the stated class (more than about two classes too hard or too easy), or states something factually false.
Write all answers before phase 2.

## Phase 2: compare with the keys
Now read `keys.json` in the keys folder for your batch. For each item compare your answer with `answer` / `acceptable` (worked examples: with `steps` and `answer`/`faded`). Where they agree in substance, do nothing. Where they differ, re-solve from scratch and decide:
- `key_wrong`: the stored key (or a worked-example step, or the flagged option) is wrong. Give the correct answer and the working.
- `acceptable_wrong`: the main key is right but one of the `acceptable` forms is a wrong answer that would be marked right (quote it).
- `question_flawed`: ambiguous / unanswerable / more than one defensible answer and the key picks one / languages disagree.
- `solver_wrong`: you were wrong and the key is right (still list it, briefly).
Also scan every key's `acceptable` list, even where you agreed, for a form that is actually a wrong answer.

Write `report.json` in the batch folder: `{ "solved": <count>, "agreed": <count>, "findings": [ { "id", "verdict", "prompt_en", "key", "mine", "why" } ], "hinglish": [ { "id", "phrase", "why" } ], "level": [ { "id", "why" } ], "other_notes": [ ... ] }`.
Be strict and concrete: a skeptic must be able to verify each finding in two minutes. Do not pad: no style nits, no "could be clearer". Only real errors.

Your final message: the counts and the list of `key_wrong`, `acceptable_wrong` and `question_flawed` ids with one line each.
