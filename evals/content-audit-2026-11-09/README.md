# Blind solve of kit and placement answer keys (content-data audit, 2026-11-09)

Evidence for the figure in `docs/design/round7/audit/content-data.md`: **1,802 items solved blind, no wrong answer key.**

## Method

- Date: 2026-11-09, on `int/r6` at integration 21a (commit 4e3d4b83 plus nothing in `data/`).
- `sample.mjs` drew the sample with a fixed seed (20261109):
  - per kit file, at random: 40 items for maths, 30 for science and EVS, 20 for English, Hindi and social science (teach-back items left out);
  - per kit file: 10 misconception diagnostics for maths, 6 for the others;
  - per maths kit file: 8 worked examples;
  - every placement item (456).
- Nine Claude solver agents each got one batch. **Keys were withheld until the answers were written:** a solver read only `questions.json`, wrote `answers.json`, and only then opened `keys.json` and wrote `report.json`. Their instructions are in `SOLVER-INSTRUCTIONS.md`.
- The audit session then checked every disagreement a solver raised against the data.
- Nothing paid was called. The solvers are the same model family as the audit session; the kits' own blind solve (DeepSeek, Grok) is a separate check.

## Batches

| Batch | Content | n solved | Agreed with key | Wrong keys |
|---|---|---|---|---|
| b1 | maths, classes 1-3 | 174 | 174 | 0 |
| b2 | maths, classes 4-5, with placement 4-5 | 188 | 188 | 0 |
| b3 | maths, classes 6-7, with placement 6-7 | 188 | 188 | 0 |
| b4 | maths, classes 8-9, with placement 3 and 8 | 200 | 200 | 0 |
| b5 | science, classes 6-9 | 144 | 144 | 0 |
| b6 | EVS, classes 3-5, with placement 3-5 | 228 | 228 | 0 |
| b7 | social science 6-9, with science placement 6-8 | 212 | 212 | 0 |
| b8 | English, classes 1-9 | 234 | 228 | 0 |
| b9 | Hindi, classes 1-9 | 234 | 226 | 0 |
| **Total** | | **1,802** | **1,788** | **0** |

The 14 disagreements in b8 and b9 are items that ask about a story, poem or picture the prompt does not carry. The solver guessed and could not re-derive the key, so those keys are unverified, not confirmed and not shown wrong.

## Files, per batch

- `questions.json`: what the solver saw (id, class, subject, both prompts, options where the item has them).
- `answers.json`: the solver's answers, written before the keys were opened, with its notes.
- `keys.json`: the stored keys at the time of the audit.
- `report.json`: the comparison: counts, findings (`key_wrong`, `acceptable_wrong`, `question_flawed`, `solver_wrong`), Hinglish and class-level flags.

The findings that survived checking are CD-05, CD-06, CD-10, CD-11, CD-12, CD-13 and CD-14 in the audit report. Some keys and prompts here were corrected afterwards, so `keys.json` is a snapshot, not the current data.

No real child's words are in these files: every prompt and answer is authored content.
