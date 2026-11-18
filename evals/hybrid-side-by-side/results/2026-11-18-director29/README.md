# director29 (2026-11-18): run facts

- 16 lessons: 4 pilot topics (c4-maths-ch05-t01, c5-maths-ch02-t01, c5-maths-ch02-t02, c6-maths-ch06-t01) × 4 rule-based children (steady, stuck, offtopic, steering). Director only, reactive child. The model-written joins were off.
- Tree: int/r6 integration 84, commit 50abc534a (the code of production release 50, e18ceef, plus the release's record). One invocation, 07:50 to 08:16 UTC.
- Model calls: 1,325 (about $0.97); cap 3,200 calls, $2.50.
- Files: `<child>-<topic>.md` (the lesson as heard), `<child>-<topic>.json` (rows under `director`, with what was on screen, the walk's cell address, the turn's `seams`, and on child rows the `intent` the rule-based child meant), `scripts/<topic>.json` (the script as run), `check-run.txt` (every dry predicate over the live rows).
- Lesson lengths in rows: steady 99, 99, 103, 103; stuck 73, 77, 83, 85; offtopic 69, 69, 87, 83; steering 63, 55, 67, 55 (c4, c5-t01, c5-t02, c6). In director28 the steady lessons were 141, 125, 141, 121 rows.
- The predicate check over the live rows: exit 0, every gated predicate 0, the fifteen written for this build included. Not gated: `repeatedAuthored` 15 (a card's question said again on the turn after help, a hint or a picture) and `parkCutByChildEnd` 1 (steering c4: an aside was parked and the child ended the lesson before the return was due). A predicate reading 0 is code's reading, not a judgement: count by hand.
- Counts over the live rows (code, not a judgement): 643 teacher turns, 148 over 60 words, 7 over 75 words, 0 over 90; 16 picture turns.
  - The 7 turns over 75 words are all row 4 (the first teaching turn after a second request at the greeting, led by the "nothing easier" line): stuck c4 78, c5-t02 86, c6 81; offtopic c4 78; steering c4 78, c5-t02 85, c6 81.
  - Turns ending on a comprehension check-in: steady 6, 6, 5, 6; stuck 2, 5, 6, 6; offtopic 4, 6, 5, 3; steering 5, 6, 4, 4 (c4, c5-t01, c5-t02, c6). In director28 the steady lessons had 16, 11, 8, 10.
  - Rows marked `noFit` (a turn that ended on a check-in because its parts did not fit): offtopic c4 44 (`point`), offtopic c5-t02 36 (`point`), offtopic c5-t02 60 (`worked`). None in a steady lesson.
  - Right verdicts said with the short reason (`whyShort: true` on the row): steady 3, 4, 8, 6; stuck 2, 1, 3, 5; offtopic 1, 0, 4, 5; steering 0, 0, 3, 4.
  - Asked worked steps (`cell.part` ending `:ask`): 30 (steady lessons 13). No quick question and no invitation exists in the scripts.
  - Joints recorded in `seams`: before a remediation 44, backTo 38, before a worked problem 34, the nothing-easier line 18, the easier-words switch 15, after her AI line 8, after an aside 7, the after-key return 6, after try-first 3, the go-on line after a key 1; every recorded joint is `by: authored`.
- The dry run on the same code (no model) read the same on the lines above that do not depend on model words: 7 turns over 75, steady check-ins 6, 6, 5, 6.
