# director25 (2026-11-16): run facts

- 16 lessons: 4 pilot topics (c4-maths-ch05-t01, c5-maths-ch02-t01, c5-maths-ch02-t02, c6-maths-ch06-t01) × 4 rule-based children (steady, stuck, offtopic, steering). Director only, reactive child.
- Tree: int/r6 integration 78, commit cd6eb6d61 (the same code as production release 45). The model-written joins were off.
- 1,672 model calls, about $1.18 (cap 3,200 calls, $2.50).
- Files: `<child>-<topic>.md` (the lesson as heard), `<child>-<topic>.json` (rows under `director`, with what was on screen, the walk's cell address, the turn's `seams`, and on child rows the `intent` the rule-based child meant), `scripts/<topic>.json` (the script as run), `check-run.txt` (every dry predicate over the live rows).
- Lesson lengths in rows: steady 133, 137, 121, 129; stuck 67, 87, 67, 79; offtopic 81, 67, 71, 67; steering 69, 57, 69, 63 (c4, c5-t01, c5-t02, c6).
- The predicate check over the live rows: 56 predicates. Every gated predicate reads 0. The pending predicate repeatedAuthored reads 3 (steering c5-t02 row 32, stuck c5-t02 row 18, stuck c6 row 8). A predicate reading 0 is code's reading, not a judgement: count by hand.
- The known item: the safety turn fired after "no place" in steady c5-t01 (rows 50 to 54), offtopic c5-t01 (rows 44, 46) and stuck c5-t01 (row 84).
- Counts over the live rows (code, not a judgement): 690 teacher turns, 62 of them over 60 words; 16 picture turns; joints recorded in `seams`: before a remediation 29, backTo 24, Hindi switch 16, after her AI line 13, after an aside 11; every recorded joint is `by: authored`.
