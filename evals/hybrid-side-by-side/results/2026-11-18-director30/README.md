# director30 (2026-11-18): run facts

- 16 lessons: 4 pilot topics (c4-maths-ch05-t01, c5-maths-ch02-t01, c5-maths-ch02-t02, c6-maths-ch06-t01) × 4 rule-based children (steady, stuck, offtopic, steering). Director only, reactive child. The model-written joins were off.
- Tree: int/r6 integration 85, commit 932da5faf (the code of production release 51, 577c904, plus the release's record). One invocation, 12:37 to 13:02 UTC.
- Model calls: 1,301 (about $0.96); cap 3,200 calls, $2.50.
- Files: `<child>-<topic>.md` (the lesson as heard), `<child>-<topic>.json` (rows under `director`, with what was on screen, the walk's cell address, the turn's `seams`, and on child rows the `intent` the rule-based child meant), `scripts/<topic>.json` (the script as run), `check-run.txt` (every dry predicate over the live rows).
- Lesson lengths in rows: steady 95, 97, 105, 103; stuck 77, 77, 79, 83; offtopic 69, 71, 87, 87; steering 65, 51, 55, 71 (c4, c5-t01, c5-t02, c6). In director29 the steady lessons were 99, 99, 103, 103 rows.
- The predicate check over the live rows: exit 0, every gated predicate 0, including the ones written from director29's rows (`pictureDrawn`, `pageStart`, `stepToldEarly`, `keyEarly`, `helpSpentCold`, `reaskFigure`). Not gated: `repeatedAuthored` 48 (a question said at the end of two turns running: the card after help or a hint, an asked step after its easier wording, the card after a picture), `replyCheckin` 1 (offtopic c4: a reply into a bridge whose card is held for a due park return), `parkCutByChildEnd` 1. A predicate reading 0 is code's reading, not a judgement: in director29 the check read 0 while four picture turns drew the wrong board. Count by hand.
- Counts over the live rows (code, not a judgement): 644 teacher turns, 148 over 60 words, 3 over 75 words, 0 over 90; 16 picture turns.
  - The 3 turns over 75 words: stuck c5-t02 row 4 (80) and steering c5-t02 row 4 (78), each the first teaching turn led by the start line; offtopic c6 row 18 (79), led by a park line.
  - Picture turns: 16, every one a split with an authored caption; by code's comparison the board drawn is the board named on all 16 (check it yourself: `screen.counts` against `screen.preselected`, and against her words).
  - Turns ending on a comprehension check-in: steady 4, 5, 4, 4; stuck 2, 3, 6, 2; offtopic 4, 2, 6, 5; steering 2, 3, 4, 4 (c4, c5-t01, c5-t02, c6). In director29 the steady lessons had 6, 6, 5, 6.
  - Rows marked `noFit`: offtopic c4 44 (`point`). One worked close said without its why (`closeShort`).
  - Right verdicts said with the short reason (`whyShort: true` on the row, now set only where the short reason was said): steady 3, 3, 7, 6; stuck 2, 1, 3, 5; offtopic 1, 0, 4, 6; steering 2, 1, 1, 4.
  - Asked worked steps (`cell.part` ending `:ask`): 28 (steady lessons 13).
  - Joints recorded in `seams`: before a remediation 45, backTo 42, before a worked problem 32, the easier-words switch 13, after a park 9, the start line 9, after an aside 8, the nothing-easier line 6, after her AI line 5, after try-first 3, the after-key return 3.
- The dry run on the same code (no model) read the same on the lines that do not depend on model words: 3 turns over 75, steady check-ins 4, 5, 4, 4.
