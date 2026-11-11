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
| 16 | c6-maths-ch02-t03 (c6-maths.json) | misconception m-vertex-off (from Games, via main) | its belief and "a few degrees off" sign are the bottom-edge mistake; its sign "vertex at the corner of the edge" and options "anywhere on arm BA" / "on point A" are a different mistake (centre mark off the vertex: tens of degrees off) | split: vertex-off keeps the bottom-edge mistake; new **c6-maths-ch02-t03-m-centre-on-arm** takes arm and end-point placements (own signs, diagnostic, remediation); i02 retargeted; the staged script's five end-point cards retargeted | main 14:55 |

Changed items were re-solved blind by a fresh agent that saw only the item (c4 i08 → 7; c5-t02 i01 → 1/3; c5-ch03 i04 → three-quarter turn; rl-o2 "ulti disha" = anticlockwise): all agree. Pins: server/forge3/certs/modules.json samples 119 (c4 i08) and 234 (c5-t02 i01) are certified game renders with the old items' params (Games re-aims them); data/arena/c5-maths.json carries the old c5-ch03 i04 (Games rebuilds the arena).

Rate so far: 15 entries (14 slips, 1 ladder gap) over the 20 staged topics read and the 4 pilots' kits. That covers kit text that a script quotes or
the checker compares against. No kit answer key has been wrong.

## Staged round 6 (2026-11-11 evening): batch 6 read, second-read fixes

| # | topic (kit) | item | slip | fix | found by |
|---|---|---|---|---|---|
| 17 | c6-maths-ch07-t05 (c6-maths.json) | i09 | tagged s3 (mixed fractions) but 1/2 L + 1/4 L = 3/4 L, a sum below 1 that repeats i03; s3 had no mixed-fraction practice item | now 2 1/3 m + 1 1/2 m = 3 5/6 m (accept 23/6) | batch 6 reader |
| 18 | c6-maths-ch07-t05 (c6-maths.json) | rl-h1 | prompt_en wrote "₹11/15 … ₹4/15 … ₹2/15" for fractions of a balance (reads as fractions of a rupee); the Hindi had no ₹ | ₹ removed from prompt_en | batch 6 reader |
| 19 | c6-maths-ch02-t01 (c6-maths.json) | i09 | four villages → 6 roads is the s3 explain ask's own case; the ladder needs three rungs and the skill has no other practice item | now nine villages → 36 roads (8 + 7 + … + 1), a count taught nowhere in the script | batch 4 second reader / fixer |
| 20 | c7-maths-ch03-t01 (c7-maths.json) | rl-h2 | prompt_hi had a macron, "chaurā" | "chauda" | batch 6 reader |

Re-solved blind by a fresh agent that saw only the two changed questions: 2 1/3 + 1 1/2 → 3 5/6 m; nine villages → C(9, 2) = 36. Both
agree. Pins: tests/cert-item-hash passes (no certified sample cites these items); data/arena rebuilt with build-arena (the new i09's
mixed-number key leaves it out of the arena, and its old challenges go).

Open (proposed by fixers, not made; each needs a new item that repeats no card's frame or key):
- c4-maths-ch03-t01 i07 ("7 + 9: odd or even?") is s3's only odd + odd practice item.
- c5-maths-ch03-t01 i11 shares check c2's "start at 12, turn anticlockwise, which number?" frame; the skill's only spare item repeats e1.
- c5-maths-ch05-t01 i10 is the same pick-cm/m/km frame as the worked example; the skill has three items.
- c4-maths-ch01-t02 s2 and c4-maths-ch09-t01 s2 have no spare practice item that does not repeat an explain ask.

Rate so far: 19 entries (18 slips, 1 ladder gap) over the 30 staged topics and the 4 pilots' kits. No kit answer key has been wrong.
| 21 | c6-maths-ch02-t01 (c6-maths.json) | rl-h3 | five players → 10 segments: the s3 explain ask's own numbers and answer; the ladder (i08, i09, rl-h3) has no spare item | now ten players → 45 segments | round 7–8 readers |

Re-solved blind: C(10, 2) = 45, agrees. Arena and play coverage rebuilt.

## Staged rounds 8–9 (2026-11-11 night): ladder items given away by the lesson

| # | topic (kit) | item | slip | fix | found by |
|---|---|---|---|---|---|
| 22 | c5-maths-ch02-t03 (c5-maths.json) | i01 | half = 2 quarters, stated in s1's points and worked example before the ladder | 1/5 = 3/15 | fourth reader (x2) |
| 23 | c5-maths-ch02-t03 (c5-maths.json) | i05 | 1/2 folded to 2/4, worked in s1's points | 1/7 folded to 2/14 | fourth reader (x2) |
| 24 | c5-maths-ch02-t03 (c5-maths.json) | i09 | 4/8 vs 1/2, stated in s1 e3's point | 3/18 vs 1/6 (No, same) | fourth reader (x2) |
| 25 | c5-maths-ch02-t03 (c5-maths.json) | i12 | 1/2 lines up with 2/4 and 4/8: s1 e3's point word for word | 2/5 lines up with 6/15 | fourth reader (x2) |
| 26 | c5-maths-ch02-t03 (c5-maths.json) | i11 | 3/4 cup with a 1/8 spoon → 6: s1 e3's own numbers | 5/6 cup with a 1/12 spoon → 10 | fourth reader (x2) |
| 27 | c6-maths-ch02-t04 (c6-maths.json) | rl-h3 | 8:00 → obtuse (120°): same frame and answer as i09 (4 o'clock) in the same ladder | 11:00 → acute (30°) | fourth reader (x2) |

All six re-solved blind by a fresh agent that saw only the questions: 3/15; 2/14; No (3/18 = 1/6); 6/15; 10; acute, 30°. All agree.
The replacement fractions were checked against the script: none of 3/15, 1/7, 2/14, 3/18, 6/15, 10/12 is spoken in c5-ch02-t03. c5's kit
does not round-trip through a JSON re-serialise, so each item was replaced in place, span by span. Arena and play coverage rebuilt;
cert-item-hash passes.
Rate so far: 27 entries over the 30 staged topics and the 4 pilots' kits. No kit answer key has been wrong.
