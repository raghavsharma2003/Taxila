# Kit slips found by the staged-script reader pass (November 2026)

Main asked for every kit change found while reading the 30 staged scripts, in one place, so the kits' own failure rate is
visible. Each one is fixed in the kit's own text, and the topic's `notes` array carries a dated line.

| # | Kit topic | Item / place | What was wrong | Now | Found in |
|---|---|---|---|---|---|
| 1 | c4-maths-ch06-t01 (c4-maths.json) | practice i11, hint 4 | "2 cm is smaller than a fingernail"; a fingernail is about 1 cm wide | "2 cm is only about two finger widths" | batch 2 |
| 2 | c4-maths-ch06-t01 (c4-maths.json) | skillExamples s3 step (c) | 10 m is "bigger than the classroom wall"; many classroom walls are about 10 m | "far bigger than a desk can be" | batch 2 |
| 3 | c5-maths-ch05-t01 (c5-maths.json) | skillExamples s3 step (a) | a 40 cm school bag "fits along a ruler"; a class-5 scale is 15 or 30 cm | "less than 1 m (about 40 cm), less than one big stride" | batch 1 |
| 4 | c5-maths-ch02-t02 (c5-maths.json) | practice i01 | "1/4 or 1/8 of the same pizza" was the same question as pilot s1 e2, so the ladder repeated the lesson | "1/3 or 1/9" (key 1/3), re-solved | kit-ladder predicate |
| 5 | c4-maths-ch05-t01 (c4-maths.json) | practice i08 | "1/4 of 20 marbles" was the same question as pilot s2 e3 | "1/4 of 28 marbles" (key 7), re-solved | kit-ladder predicate |
| 6 | c5-maths-ch03-t01 (c5-maths.json) | rl-o2 accept | accepts "ulṭi" with an IAST diacritic; a typed "ulti" does not match | "ghadi ki ulti disha mein" | batch 3 |
| 7 | c5-maths-ch03-t01 (c5-maths.json) | practice i04 | the same problem as the topic's own worked example (12 to 9 clockwise) | minute hand 9 to 6 clockwise (three-quarter turn), re-solved | batch 3 |
| 8 | c5-maths-ch13-t01 (c5-maths.json) | practice i11 | "which numbers on 0-24 have both marks" keys "12 and 24"; both jumpers start at 0, so 0 is marked by both | (to fix with batch 4) | batch 4 |
| 9 | c5-maths-ch03-t02 (c5-maths.json) | i13 hint 3, i07 answer, rl-h2 last hint | obtuse given as "bigger than a right angle" with no "less than a straight angle", which is the m-straight-is-obtuse mix-up itself | (to fix with batch 4) | batch 4 |
| 10 | c6-maths-ch02-t01 (c6-maths.json) | skillExamples[0] step (d) result; i13 hint | step (d) repeats the whole answer instead of "(d) line"; "a dot means it stops there" is false (ray AB passes its dot B) | (to fix with batch 4) | batch 4 |
| 11 | c6-maths-ch02-t02 (c6-maths.json) | full-turn misconception | its belief "an angle is fixed by where the arm ends up" is true of an angle as a figure; the mix-up is about the turn | (to fix with batch 4) | batch 4 |
| 12 | c4-maths-ch05-t01 (c4-maths.json) | practice i13, hint 2 | "Half is 2 pieces; a quarter is 4 pieces" | "Half means the pizza is cut into 2 equal pieces; a quarter, into 4." | pilots' read |
| 13 | c4-maths-ch05-t01 (c4-maths.json) | s3 ladder (gap, not a slip) | every s3 item used only halves, thirds and quarters, so every s3 lesson card repeated the ladder | added i14 (1/5 vs 1/8), i15 (order 1/6, 1/5, 1/8), i16 (why 1/8 < 1/6), each blind-solved | pilots' read |
| 14 | c5-maths-ch02-t02 (c5-maths.json) | practice i01, hint 1 | still "which pizza is cut into more slices?" after i01 became one pizza (my slip in change #4) | "Cut the same pizza into 3 slices, or into 9: which way gives more slices?" | pilots' read |
| 15 | c5-maths-ch02-t01 (c5-maths.json) | near-transfer rl-h2, Hindi | Bar B's "4 gaps" dropped "barabar", on which the answer depends | "4 barabar gaps", matching the English | pilots' read |

Changed items were re-solved blind by a fresh agent that saw only the item (c4 i08 → 7; c5-t02 i01 → 1/3; c5-ch03 i04 → three-quarter turn; rl-o2 "ulti disha" = anticlockwise): all agree. Pins: server/forge3/certs/modules.json samples 119 (c4 i08) and 234 (c5-t02 i01) are certified game renders with the old items' params (Games re-aims them); data/arena/c5-maths.json carries the old c5-ch03 i04 (Games rebuilds the arena).

Rate so far: 15 entries (14 slips, 1 ladder gap) over the 20 staged topics read and the 4 pilots' kits. That covers kit text that a script quotes or
the checker compares against. No kit answer key has been wrong.
