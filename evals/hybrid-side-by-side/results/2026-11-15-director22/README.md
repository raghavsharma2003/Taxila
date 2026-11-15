# director22 (2026-11-15): run facts

- 16 lessons: 4 pilot topics (c4-maths-ch05-t01, c5-maths-ch02-t01, c5-maths-ch02-t02, c6-maths-ch06-t01) × 4 rule-based children (steady, stuck, offtopic, steering). Director only, reactive child.
- Tree: int/r6 integration 57, commit 3ef74ffdd.
- 1,721 model calls, about $1.23 (cap 3,200 calls, $2.50).
- Files: `<child>-<topic>.md` (the lesson as heard), `<child>-<topic>.json` (rows under `director`, with what was on screen and the walk's cell address), `scripts/<topic>.json` (the script as run), `check-run.txt` (every dry predicate over the live rows).
- Lesson lengths in rows: steady 137, 147, 141, 143; stuck 67, 67, 83, 83; offtopic 71, 71, 69, 71; steering 69, 65, 65, 59 (c4, c5-t01, c5-t02, c6).
- The predicate check over the live rows: 41 predicates. One gated predicate is not 0: orderParts 2 ("the card before its point": stuck c4 row 52, stuck c5-t02 row 24). The pending predicate repeatedAuthored reads 7 (an authored sentence of 6 or more words in two of her turns running). Every other predicate reads 0. Check these rows yourself.
