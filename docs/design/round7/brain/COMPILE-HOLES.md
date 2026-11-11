# C1 step 1: holes and doubles per script (generated)

**Source:** `node scripts/lesson-scripts/compile-report.mjs` over server/director/compile.js. Do not edit by hand.

**Type table:** 324 cells (9 part kinds × 12 columns × 3 help states), 279 of them apply (the answer columns are for cards only).

**Missing fields** are counted once per field of the script, however many rules name it. **Rule holes** count every (part, column, help) cell that names a missing field.

**Scripts:** 34 (4 live, 30 staged). Missing fields: 186. Rule holes: 278. Doubles: 0.

**Second clarify** (dc-r8-second-clarify-shows-not-rewords): it shows the part's board and says the same authored line once more (alts[0] when the script has one). Second clarifies with no board to show (repetition alone): 0. A third clarify is clarify/spent: on a card its key and why; on a point or check-in, the card; on a worked step, the next step; on a remediation, its then-card.

**Fallback cells:** every missing field's cells compile to a named fallback (today's behaviour) until Learning authors it: resay_show 102, key_only 60, worked_answer 45, next 68, as_wrong 3. Cells left as holes with no fallback: 0.

**Not applicable:** 381 misconception cells on cards with no `targets` (cards that test no kit mix-up: a wrong answer takes the `wrong` column). Not holes, not fallbacks.

## Missing fields, all scripts

| Part kind, field | Missing | What it is |
|---|---|---|
| bridge simpler | 68 | a simpler of the bridge into the next skill, for a clarify on it. Fallback: next |
| worked_step simpler | 102 | the worked problem's own simpler (its steps have one), for a clarify on the problem. Fallback: resay_show |
| your_step remediation | 1 | a remediation for the mix-up the worked example's own card targets. Fallback: as_wrong |
| your_step why | 15 | the why of the worked example's own card. Fallback: worked_answer (right), key_only (key cells) |

## Per script

| Script | Where | Parts | Cells | Missing | bridge simpler | worked_step simpler | your_step remediation | your_step why | Doubles |
|---|---|---|---|---|---|---|---|---|---|
| c4-maths-ch05-t01 | live | 61 | 1881 | 8 | 2 | 3 | 0 | 3 | 0 |
| c5-maths-ch02-t01 | live | 68 | 2106 | 8 | 2 | 3 | 0 | 3 | 0 |
| c5-maths-ch02-t02 | live | 70 | 2160 | 8 | 2 | 3 | 0 | 3 | 0 |
| c6-maths-ch06-t01 | live | 64 | 1962 | 5 | 2 | 3 | 0 | 0 | 0 |
| c4-maths-ch01-t02 | staged | 56 | 1728 | 5 | 2 | 3 | 0 | 0 | 0 |
| c4-maths-ch03-t01 | staged | 56 | 1728 | 5 | 2 | 3 | 0 | 0 | 0 |
| c4-maths-ch03-t02 | staged | 53 | 1638 | 5 | 2 | 3 | 0 | 0 | 0 |
| c4-maths-ch04-t01 | staged | 62 | 1917 | 5 | 2 | 3 | 0 | 0 | 0 |
| c4-maths-ch04-t02 | staged | 53 | 1629 | 5 | 2 | 3 | 0 | 0 | 0 |
| c4-maths-ch06-t01 | staged | 57 | 1755 | 5 | 2 | 3 | 0 | 0 | 0 |
| c4-maths-ch07-t01 | staged | 56 | 1719 | 6 | 2 | 3 | 0 | 1 | 0 |
| c4-maths-ch09-t01 | staged | 63 | 1944 | 5 | 2 | 3 | 0 | 0 | 0 |
| c4-maths-ch14-t01 | staged | 45 | 1386 | 5 | 2 | 3 | 0 | 0 | 0 |
| c5-maths-ch01-t01 | staged | 53 | 1638 | 5 | 2 | 3 | 0 | 0 | 0 |
| c5-maths-ch02-t03 | staged | 59 | 1818 | 8 | 2 | 3 | 0 | 3 | 0 |
| c5-maths-ch03-t01 | staged | 54 | 1656 | 7 | 2 | 3 | 0 | 2 | 0 |
| c5-maths-ch03-t02 | staged | 63 | 1944 | 5 | 2 | 3 | 0 | 0 | 0 |
| c5-maths-ch05-t01 | staged | 58 | 1791 | 5 | 2 | 3 | 0 | 0 | 0 |
| c5-maths-ch13-t01 | staged | 54 | 1674 | 5 | 2 | 3 | 0 | 0 | 0 |
| c5-maths-ch13-t02 | staged | 59 | 1827 | 5 | 2 | 3 | 0 | 0 | 0 |
| c6-maths-ch02-t01 | staged | 57 | 1746 | 5 | 2 | 3 | 0 | 0 | 0 |
| c6-maths-ch02-t02 | staged | 57 | 1746 | 5 | 2 | 3 | 0 | 0 | 0 |
| c6-maths-ch02-t03 | staged | 56 | 1710 | 6 | 2 | 3 | 1 | 0 | 0 |
| c6-maths-ch02-t04 | staged | 60 | 1836 | 5 | 2 | 3 | 0 | 0 | 0 |
| c6-maths-ch05-t01 | staged | 61 | 1872 | 5 | 2 | 3 | 0 | 0 | 0 |
| c6-maths-ch07-t01 | staged | 56 | 1719 | 5 | 2 | 3 | 0 | 0 | 0 |
| c6-maths-ch07-t03 | staged | 60 | 1836 | 5 | 2 | 3 | 0 | 0 | 0 |
| c6-maths-ch07-t04 | staged | 62 | 1899 | 5 | 2 | 3 | 0 | 0 | 0 |
| c6-maths-ch07-t05 | staged | 58 | 1782 | 5 | 2 | 3 | 0 | 0 | 0 |
| c6-maths-ch08-t01 | staged | 60 | 1836 | 5 | 2 | 3 | 0 | 0 | 0 |
| c7-maths-ch02-t01 | staged | 53 | 1620 | 5 | 2 | 3 | 0 | 0 | 0 |
| c7-maths-ch03-t01 | staged | 62 | 1899 | 5 | 2 | 3 | 0 | 0 | 0 |
| c7-maths-ch05-t01 | staged | 58 | 1800 | 5 | 2 | 3 | 0 | 0 | 0 |
| c7-maths-ch05-t02 | staged | 61 | 1872 | 5 | 2 | 3 | 0 | 0 | 0 |

## Rule holes per rule

| Rule (kind/column/help) | Cells naming a missing field |
|---|---|
| worked_step/clarify/fresh | 102 |
| bridge/clarify/fresh | 68 |
| your_step/clarify/heard | 15 |
| your_step/clarify/spent | 15 |
| your_step/give_up/spent | 15 |
| your_step/right/fresh | 15 |
| your_step/right/heard | 15 |
| your_step/right/spent | 15 |
| your_step/wrong/spent | 15 |
| your_step/misconception/fresh | 1 |
| your_step/misconception/heard | 1 |
| your_step/misconception/spent | 1 |

## Doubles

None.
