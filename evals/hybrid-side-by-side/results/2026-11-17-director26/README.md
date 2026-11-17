# director26 (2026-11-17): run facts

- 16 lessons: 4 pilot topics (c4-maths-ch05-t01, c5-maths-ch02-t01, c5-maths-ch02-t02, c6-maths-ch06-t01) × 4 rule-based children (steady, stuck, offtopic, steering). Director only, reactive child.
- Tree: int/r6 integration 79, commit 521801aa5 (the code of production release 46). The model-written joins were off.
- 1,621 model calls, about $1.14 (cap 3,200 calls, $2.50).
- Files: `<child>-<topic>.md` (the lesson as heard), `<child>-<topic>.json` (rows under `director`, with what was on screen, the walk's cell address, the turn's `seams`, and on child rows the `intent` the rule-based child meant), `scripts/<topic>.json` (the script as run), `check-run.txt` (every dry predicate over the live rows).
- Lesson lengths in rows: steady 131, 133, 161, 117; stuck 69, 75, 71, 73; offtopic 85, 69, 77, 67; steering 53, 51, 51, 51 (c4, c5-t01, c5-t02, c6).
- The predicate check over the live rows: 68 predicates. Four gated predicates are not 0: orderParts 1 and orderDisplaced 1 (steering c5-t02 row 6: a card before its point), endsOnQuestion 1 (steering c5-t02 row 4: a turn that ends with nothing to answer), uiWords 1 (steering c6 row 50: buttons named aloud). The pending predicate repeatedAuthored reads 11. A predicate reading 0 is code's reading, not a judgement: count by hand.
- The known item: the child's line "no place" was not said in this run (the turns fell differently and the child's line at that card was another request), so the safety turn did not occur. Nothing in that code was changed.
- Counts over the live rows (code, not a judgement): 675 teacher turns, 44 over 60 words, 6 over 75 words; 16 picture turns; turns ending on a check-in in the steady lessons 25, 29, 32, 24 (c4, c5-t01, c5-t02, c6); joints recorded in `seams`: before a remediation 30, backTo 27, the easier-words switch 16, the go-on line after a key 12, after her AI line 11, after an aside 10; every recorded joint is `by: authored`.
