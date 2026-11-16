# director23 (2026-11-16): run facts

- 16 lessons: 4 pilot topics (c4-maths-ch05-t01, c5-maths-ch02-t01, c5-maths-ch02-t02, c6-maths-ch06-t01) × 4 rule-based children (steady, stuck, offtopic, steering). Director only, reactive child.
- Tree: int/r6 integration 69, commit 35599fed8 (the same commit as production release 36).
- 1,598 model calls, about $1.13 (cap 3,200 calls, $2.50).
- Files: `<child>-<topic>.md` (the lesson as heard), `<child>-<topic>.json` (rows under `director`, with what was on screen, the walk's cell address, and on child rows the `intent` the rule-based child meant), `scripts/<topic>.json` (the script as run), `check-run.txt` (every dry predicate over the live rows).
- Lesson lengths in rows: steady 135, 127, 143, 117; stuck 67, 87, 67, 67; offtopic 75, 67, 71, 75; steering 69, 57, 57, 67 (c4, c5-t01, c5-t02, c6).
- The predicate check over the live rows: 48 predicates. Two gated predicates are not 0: readerAgrees 1 (steady c5-t02 row 142: the child's line after the closing key's check-in was meant as a reason and read "incorrect") and orderNoUnit 1 (steady c6 row 116: the wrap names a square while the closing answer board is up). The pending predicate repeatedAuthored reads 11 (an authored sentence of 6 or more words in two of her turns running). Every other predicate reads 0. Check these rows yourself.
- Counts over the live rows (code, not a judgement): 16 picture requests, 16 views drawn; 281 turns said a card whole, 36 of them a card also said whole within her last two turns; `backTo` joint 9 times in the run.
