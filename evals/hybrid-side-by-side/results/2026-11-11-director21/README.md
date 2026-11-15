# director21 (2026-11-11): run facts

- 16 lessons: 4 pilot topics (c4-maths-ch05-t01, c5-maths-ch02-t01, c5-maths-ch02-t02, c6-maths-ch06-t01) × 4 rule-based children (steady, stuck, offtopic, steering). Director only, reactive child.
- Tree: int/r6 integration 52, commit 1697dcc54.
- 1,733 model calls, about $1.27 (cap 3,200 calls, $2.50).
- Files: `<child>-<topic>.md` (the lesson as heard), `<child>-<topic>.json` (rows under `director`, with what was on screen and the walk's cell address), `scripts/<topic>.json` (the script as run), `check-run.txt` (every dry predicate over these live rows).
- Lesson lengths in rows: steady 133, 145, 143, 121; stuck 87, 67, 69, 69; offtopic 67, 69, 73, 75; steering 67, 51, 57, 57 (c4, c5-t01, c5-t02, c6).
- The predicate check reads 0 on every gated predicate. The one pending predicate, twinsData, reads 8: the rows where a script used two words for one thing (fixed in the scripts after this run was cut).
