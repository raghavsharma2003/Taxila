# director24 (2026-11-16): run facts

- 16 lessons: 4 pilot topics (c4-maths-ch05-t01, c5-maths-ch02-t01, c5-maths-ch02-t02, c6-maths-ch06-t01) × 4 rule-based children (steady, stuck, offtopic, steering). Director only, reactive child.
- Tree: int/r6 integration 73, commit 1d2807e26 (the same commit as production release 40).
- 1,582 model calls, about $1.12 (cap 3,200 calls, $2.50).
- Files: `<child>-<topic>.md` (the lesson as heard), `<child>-<topic>.json` (rows under `director`, with what was on screen, the walk's cell address, the turn's `seams`, and on child rows the `intent` the rule-based child meant), `scripts/<topic>.json` (the script as run), `check-run.txt` (every dry predicate over the live rows).
- Lesson lengths in rows: steady 135, 121, 143, 117; stuck 67, 87, 67, 67; offtopic 75, 67, 71, 75; steering 69, 57, 57, 51 (c4, c5-t01, c5-t02, c6).
- The predicate check over the live rows: 51 predicates. Three gated predicates are not 0: orderParts 1 (steady c4 row 96: a card before its point), readerAgrees 2 (offtopic c5-t01 row 66 and stuck c5-t01 row 86: a goodbye after the safety turn recorded as nothing), uiWords 1 (offtopic c5-t02 row 70: buttons named aloud). The pending predicate repeatedAuthored reads 7. Every other predicate reads 0. Check these rows yourself.
- The known item: the safety turn fired after "no place" in offtopic c5-t01 (row 44, and again at 46) and stuck c5-t01 (row 84). It did not fire in steady c5-t01.
- Counts over the live rows (code, not a judgement): 16 picture requests, 16 views drawn, 0 turns that used the line that names nothing; 260 turns said a card whole, 19 of them a card also said whole within her last two turns; joints placed: backTo 30, before a remediation 36, after an aside 6, after her AI line 12, park 8, Hindi switch 16.
