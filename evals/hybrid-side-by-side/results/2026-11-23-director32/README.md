# director32 (2026-11-23): run facts

- 28 lessons: 7 topics × 4 rule-based children (steady, stuck, offtopic, steering). Director only, reactive child. The model-written joins were off.
  - The five live lessons: c4-maths-ch05-t01, c5-maths-ch02-t01, c5-maths-ch02-t02, c5-maths-ch02-t03 (live since director31), c6-maths-ch06-t01.
  - Two staged scripts, rewritten after failing director31 and walked by the eval harness only (no child can be served them): c4-maths-ch01-t02 (right angles, comparing angles, the circle), c6-maths-ch07-t01 (fractional units, sharing).
- Tree: int/r6 integration 88, commit 50b784f8e (the code of production release 54, 5fe357d, plus the release's record). One invocation, 07:32 to 08:07 UTC.
- Model calls: 2,226 (about $1.66); cap 5,600 calls, $4.50.
- Files: `<child>-<topic>.md` (the lesson as heard), `<child>-<topic>.json` (rows under `director`, with what was on screen, the walk's cell address, the turn's `seams`, and on child rows the `intent` the rule-based child meant), `scripts/<topic>.json` (the script as run), `check-run.txt` (every dry predicate over the live rows).
- Lesson lengths in rows, in the order c4-ch05-t01, c5-ch02-t01, c5-ch02-t02, c5-ch02-t03, c6-ch06-t01 | c4-ch01-t02, c6-ch07-t01: steady 109, 97, 105, 97, 103 | 111, 87; stuck 71, 79, 87, 79, 79 | 85, 79; offtopic 77, 75, 75, 75, 67 | 69, 87; steering 51, 55, 51, 53, 67 | 51, 51. In director31 the steady lessons were 109, 97, 105, 97, 103 | 115, 89.
- The predicate check over the live rows: exit 0, every gated predicate 0, including this round's (`falseReturn`, `shortAskKind`, `stepAskRunning`, `helpOtherPart`, `workedCheckin`, `pictureSame`, `pictureRefused`, `pictureTwoLines`, `firstTeachLong`). Counted, not gated: `repeatedAuthored` 18 (a sentence of a card said in two turns running where the card is asked again), `vpcUnlisted` 7 (a verdict-point-card turn of 66 words), `reaskNoForm` 5, `parkCutByChildEnd` 1, `pointNoFit` 1. A predicate reading 0 is code's reading, not a judgement: count by hand.
- Counts over the live rows (code, not a judgement): 1,100 teacher turns, 233 over 60 words, 0 over 75 words. The longest turn in each lesson is 66 to 75 words.
  - Picture requests: 35. By the row's own record (`cell.picture`): 24 drew the board's second view, 4 drew the card's authored picture (steady c6-ch07-t01 18, stuck c4-ch01-t02 18, stuck c6-ch07-t01 18, offtopic c4-ch01-t02 28), and 7 got the card's hint (row 16 of every steering lesson: that child asks for a second picture straight after the first). Check each against what was on screen and against her words.
  - Turns ending on a comprehension check-in (counted by the closing words of the turn), in the topic order above: steady 4, 5, 6, 4, 2 | 4, 4; stuck 1, 3, 5, 3, 2 | 5, 3; offtopic 3, 4, 5, 3, 2 | 3, 5; steering 0, 4, 4, 2, 3 | 2, 3.
  - Rows marked `noFit`: stuck c4-ch01-t02 70 (`point`).
  - Right verdicts said with the short reason (`whyShort: true`): 100 rows. Asked worked steps (`cell.part` ending `:ask`): 78 rows.
- The steady child's closing question: answered right in c4-ch05-t01, c5-ch02-t01, c5-ch02-t03 and c6-ch07-t01; missed twice in c5-ch02-t02 and c6-ch06-t01; in c4-ch01-t02 the child says "pata nahi, shayad wahi" twice and is given the answer.
- The dry run on the same code (no model) read the same on every gated predicate.
