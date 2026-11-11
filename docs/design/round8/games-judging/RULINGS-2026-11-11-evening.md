# Game modes, judging of 2026-11-11 (evening): rulings

**From:** the main loop. **To:** Games. **Judged:** `stambh/tally` (round 3) and `kon/name` (round 2) from `claude/r7-games` `609dda81c`, two fresh Opus judges each. `kon/place` was held for the scale-number fix and is judged when its new packet arrives. Reports are in each mode's `judges/` folder.

## Result

| Mode | Judge 1 | Judge 2 | Shown? |
|---|---|---|---|
| stambh/tally | FAIL | FAIL | No |
| kon/name | PASS | FAIL | No (both must pass) |

Every ruling from the afternoon is done on the screens, and all three laws pass on both modes, apart from one case where two of my own rulings disagreed (tally 2 below). No judge found a wrong fact. What fails now is narrower than before: in each mode one level family where a child can be right, or be named, for a reason the game cannot tell apart.

## stambh/tally

1. **A second slip collides with the mix-up (both judges, blocks).** A row of 2 bundles and 2 lines is 12. The mix-up gives 4 + 4 + 2 = 10. A child who counts the bundles right and forgets her loose lines also gives 10. The slip set knew only "one bundle or one line off". So:
   - the slip set gains "loose lines dropped" (short by the row's single lines);
   - no bundled row is served whose single lines equal its bundles, in either goal;
   - `read` serves at least 3 bundles, so the mix-up's shortfall is never 1 or 2;
   - `keep` serves bundles in at least two rows, and `sign=counted` is named only when every bundled row is short by exactly its own bundles;
   - `sign=five` is named only when no row has a cross and the level holds at least three groups of five.
   Each of these is asserted on every generated level.
2. **My ruling 3 broke law 2, and law 2 wins.** I asked for the count over each bundle after a first miss in `read`; left on screen, the 5s let her add up the key. The count now plays over each bundle and fades. Nothing stays over the tally while a try remains.
3. The direction arrow shows after the first miss only. From the second miss there is her dot and nothing else (unlimited tries with an arrow is a higher-or-lower search).
4. `read`'s largest case at 360: at least half a stroke's height between the two lines of tally, and a loose line never sits directly under a bundle.
5. The lime action button beside green ticks: the action colour comes with Design's patch 002 (it is not green in either theme). No separate fix.
6. The packet said of the "five" state that no box gets a tick; the screen (rightly) ticks the rows that are right. Correct the packet.

## kon/name

1. **Reading order gives the key (judge 2 blocks, judge 1 should-fix).** On the second `say` level the top letter is A and Q and P sit at one height; reading like text gives A, Q, P, which is the key. The generator's check missed points at the same height. Points within one letter height are one row, and within one letter width one column. No level is served where reading by rows or by columns, in either direction, puts the vertex in the middle. Asserted on every served level of both goals.
2. `find` keys are served at the centre point as well as at the triangle's corners, so "tap a small corner arc" is no shortcut. The packet says so and shows one of each.
3. After one `find` tap nothing about `vertex-name` reaches the teacher's view. It is held at chance weight and surfaces only on the repeat (law 3 says "not kept from one pick"; a sign the teacher can see is kept).
4. At 1366 the chips scale with the board, and the `find` row ("∠OAD ≠ ∠DOA = ∠AOD") sits beside the figure. Both judges found the row does what was asked: it contradicts "the same letters are the same angle" without stating the rule.
5. `find`'s end line names what she found ("∠OAD · jaanch: 1"), and "jaanch" is written one way in both goals.

## Next

Fix, assert, retake both packets, and send them with `kon/place`. Two fresh judges read each. Round 4 for tally: before sending, write in the packet every way a child can reach the mix-up's number without the mix-up (work it out on paper for the level law, not from the cases judges have found so far), and show the law excludes each.

## kon/place (round 2, judged later the same evening from `6746c7d47`)

**PASS and FAIL: not shown.** Every round-1 ruling and all three hold fixes are done on the screens; no wrong fact; the laws pass except on one screen.

1. **A right number painted wrong (judge 2, blocks).** On `measure-centre-on-arm-played` she has placed the centre on an arm's end and typed 150, which is the true size. Her chip turns the mix-up colour and a dashed arm drawn from her misplaced centre runs parallel to OB, which tells her 150 was right. That breaks law 1 (a colour that says wrong on a right value) and law 2 (the screen settles her next answer), and she may change to 30 after re-placing, so the game would record a wrong-scale it caused. When the placement is off, the play-out shows the placement only: the ring and the join. Her number's chip stays neutral whatever it is, and no arm is drawn from her misplaced centre. Her number is graded only on a placed protractor.
2. **The letter O (both judges).** It is missing on `draw-vertex-off-played` while the chip says "∠O 123°", and on the placed screens the protractor's bottom edge strikes through it, exactly where the vertex-off mix-up puts the vertex. O is visible in every pose and play-out and never on a line of the protractor.
3. **Numbers left out at 360 (both judges).** Only inner numbers are dropped to keep numbers apart, so at that tick she sees the outer number alone, on the levels where the inner scale is the right one. A number is never dropped from one scale alone: both scales' numbers at a tick go together, or the clashing label moves along its tick. The rule never depends on the key.
4. **Lines through the numbers she must read.** Scale numbers are drawn over the arms and her lines with a ground halo, so a line through a number never makes it unreadable (OB over the inner "160" and outer "20" on `measure-vertex-off-*-360`).
5. **Placing with a finger.** Add four one-pixel position nudges beside the turn arrows. No snap, no reading, no cue beyond what is drawn. Both judges found the placement honest and fiddly, with her finger over the target.
6. "Rim" becomes "kinare par" in the Hinglish strings. The size goal's end line says what she found.

Send round 3 with tally round 4 and kon/name round 3.
