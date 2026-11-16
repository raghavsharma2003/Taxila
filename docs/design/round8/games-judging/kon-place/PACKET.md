# Judge packet: `kon/place`, placing the protractor (class 6 maths, "Measuring and drawing angles")

This packet is meant to be read on its own: everything a judge needs is in this file and the 58 screenshots beside it. **Gate 1:** the night rulings' fixes are on branch `claude/r8-gate1-place-tally` (see "Gate 1 fixes (night rulings)" first; the screens they change were retaken there). **Round 3.** Code: branch `claude/r8-kon-place-r3` (the fixes after the evening judging, `RULINGS-2026-11-11-evening.md`, kon/place 1–6: see "Changes for round 3" first; before it, the fixes after `RULINGS-2026-11-11.md` and after main's hold of the same day). Every screenshot was retaken on it. **Not yet checked on a real phone, or with a child.** **Gate 2 (evidence) is the section "Gate 2: evidence" below, on branch `claude/r8-gate2-place`; a judge for gate 2 reads that section only.**

**Topic:** c6-maths-ch02-t03, "Measuring and drawing angles". Class 6, age band 10–12. Three goals: `measure` (skill s2, also s1), `draw` (s3, s2, s1) and `size` (s2).

**What is new.** The older game for this topic drew the protractor already sitting on the angle, so only one of the kit's mix-ups could ever show. Here the protractor lies loose and the child puts it on the angle herself. The game grades the placement, and then grades the number she types or the mark she makes against what the protractor *as she placed it* shows.

**The three laws this packet is built to** (main's rulings, for every game):
1. Green means right and only right. What she has selected but not yet committed is blue-violet (the focus colour). Her own wrong value is brown (the mix-up colour). The green-yellow action button keeps its colour.
2. After a miss the screen never holds the key while a try remains: not the key, not a line she can trace, not readings that settle the next pick.
3. A mix-up is named only by an act a guess rarely produces (a typed number, a placement, a mark). A mix-up from a pick among a few buttons is graded at chance weight and is not kept on her record; it is named when it repeats on a level whose surface differs (gate 2: join-wrong-end on its fourth sighting, below). Read per session (gate 2, 2026-11-16), no kon/place mix-up is named from one level any more: vertex-off, centre-on-arm and wrong-scale are named on a second level that differs, join-wrong-end on its fourth, all within the session's first four levels.

**The mix-ups it plays out** (kit ids `c6-maths-ch02-t03-m-*`):

| Goal | At chance weight from one level, named on a second level that differs (gate 2, per session) | Named on the fourth sighting (gate 2) |
|---|---|---|
| measure | wrong-scale, vertex-off, centre-on-arm (*) | — |
| draw | wrong-scale, vertex-off, centre-on-arm (*) (a second asked size) | join-wrong-end (one of two join buttons) |
| size | none (the kit's `tool-size` is not claimed: Goal 3) | — |

(*) `centre-on-arm` is Learning's new kit entry (the old `vertex-off` split in two on 2026-11-11: `vertex-off` is now only the bottom edge on O). The game names it already; the coverage rule maps it to the kit id when that id reaches the integration branch (integration 49). Until then a centre-on-arm placement is an ordinary refusal with no mix-up recorded.

## Gate 2 battery (2026-11-16: H1 built; the discriminating level built; the battery passes)

**Third pass (2026-11-16, main's note 004, branch `claude/r8-steer-dir`).**
- **Which sign each one-scale or one-number pattern carries.** The protractor's right scale is the one whose 0 lies on OA. On an angle opening anticlockwise that is the outer scale; on one opening clockwise it is the inner scale. So:
  - "always the inner scale" is wrong exactly on angles that open **anticlockwise**, and right on every clockwise one;
  - "always the outer scale" is wrong exactly on angles that open **clockwise**;
  - "always the larger number" is wrong exactly on **acute** angles (the larger of θ and 180 − θ is the wrong one there), on either side;
  - "always the smaller number" is wrong exactly on **obtuse** angles.

  So the evidence for each is a second miss by the other scale on a level of the **same side and the same kind** as the first, with another key.
- **The steer (answer 1).** After a wrong-scale sighting, the next level opens the same way as the sighting's level and has a key that none of the sightings had: measure's key on both scales, draw's asked size. A level of the same kind (acute or not) is tried first. Before this, the focus sent the next level to clockwise angles only (the only ones whose solve is evidence on the scale), where the inner reading is right. How it works: a sighting keeps `{ cw, key, acute }` (`placeSteer`, through the new `FamilyLogic.steerOf`, the chance memory, `steersOf` and `GenRequest.steers`), and `placeNeeds` tries side+kind, then side, then the list without it. Answer 4's level mix still comes first. Asserted in the battery: 10,476 of 10,476 steps in the full sweep, and 4,588 more under the level mix.
- **The level mix moves to the third level.** It is still "by the fourth". Served sessions met their first acute or anticlockwise angle only on the fourth level, where a first sighting has no level left for its second. A separate commit; main can drop it.
- **draw, note 004 item 4 (the dot differs).** With the steer alone, "last time's right dot" went over the line in the gate sweep: 0.063 worst fade, **0.125 worst door (ttt)**. A same-side level whose mix-up dot is the right dot just played makes that habit act as the mix-up. So while the steer is on, a draw level's mix-up dot is never the right dot of the level just played. Asserted: 6,032 of 6,032 in the full sweep. In the full sweep she is no longer named at all (was 0.075).

| holder | before (gate / full) | after (gate / full) |
|---|---|---|
| measure · always the inner scale | 0 / 0 | **1.00 / 1.00** |
| draw · always the inner scale | 0 / 0 | **1.00 / 1.00** |
| measure · always the larger number | 0.031 / 0.063 | **1.00 / 1.00** |
| measure · always the smaller number | 1.00 / 0.92 | 1.00 / 1.00 |
| measure, draw · always the outer scale | 1.00 / 0.96, 0.98 | 1.00 / 1.00 |
| the other scale's number or mark | 1.00 / 1.00 | 1.00 / 1.00 |

With the steer but the mix still at the fourth level (gate sweep): inner 0.167 (measure) and 0.125 (draw); larger 0.19 with the same-kind try, 0 without it. Other holders, full sweep: vertex-off 0.909 measure (was 0.924), 0.961 draw (was 0.932); always 'A se jodo' 0.620 (was 0.600).

| goal | worst non-holder, full sweep, worst fade: before → after | worst door: before → after |
|---|---|---|
| measure | 0.005 → 0.007 (one random slip a level, vertex-off, fade 3) | 0.011 → 0.008 (placed right, any number, wrong-scale, ggg) |
| draw | 0.075 (last time's right dot) → 0.036 (the right dot, either button, join-wrong-end, fade 1) | 0.050 → 0.050 (the same child, ggg) |

No child with no randomness has a cell at 0.5 or more. Full sweep: 503 s. **Served levels changed** in gate-sweep sessions, compared with before this branch: careful child 348 of 768 levels in measure and 338 of 768 in draw (third levels, and levels after a wrong-scale sighting). **Re-certified** kon/place: 4,484 samples, all passing at every size. No cert sample changed, because the cert's levels are a fresh child's first level and the focus level (n = 0), which neither change touches, so `server/forge3/certs/play.json` is unchanged. **Browser:** `tests/r8-games-kon-layout.test.mjs` now also plays 8 levels the picker serves: for measure and draw, an acute angle; an acute angle tilted 25° or more; and a level steered after vertex-off from base 0 and from base 180 (`placeLayoutLevels`). It passes, with no view change, in 10.1 min.

**Second pass (2026-11-16, `dc-r8-gate2-discriminating-level`, main's answers 1 and 4).**
- **Answer 4, the level mix.** No acute angle was ever served: centred across the board, an acute angle's vertex sits too near the side for the protractor's half-disc, so the generator refused every one. A figure that does not fit centred is now moved across, nearest the middle first. From a session's fourth level, while it has not met an acute angle or one opening anticlockwise, the level is one that supplies what is missing (`placeNeeds`). Every served session in the battery's test meets both by its fourth level (asserted). Served levels changed: in the gate sweep's sessions, about two levels in three differ (careful child: 518 of 768 measure, 464 of 768 draw); distinct levels per goal rose (measure 35 to 49, draw 42 to 53 for the careful child). Re-certified: every sample passes at every size.
- **Answer 1, vertex-off on a discriminating level.** Her sighting carries the level's base direction (the protractor's base line as the solver lays it, `baseDir`) and her offset in the protractor's frame. A second sighting counts only when the two base directions differ by 45° or more, the frame offset is the same (within `VO_BAND`), and so the board offset differs (`discriminatingPair`). After a first sighting the session is steered to a level 45° or more away (fade 1 may tilt for it); in the battery the next level after a holder's first sighting is that far away in every session (asserted at 95% or more). If none can be served within the four levels, vertex-off is not named that day. Note: an angle opening the other way has the same base direction (its OA points the other way, the protractor lies the same), so answer 4's mix does not by itself give question 1 its differing directions; the tilt does.
- **New child:** the finger held on the board where the bottom edge sat on her first level, every level. Named 0 in both goals.
- **Other mix-ups.** wrong-scale and join-wrong-end: no child who does not hold them acts as them on served levels (worst 0.075, "last time's right dot", draw fade 3), so they keep H1's reading. centre-on-arm is not mapped by the coverage, so it is never named here.

| goal | worst non-holder, worst fade: H1 → now | worst door sequence (now) |
|---|---|---|
| measure | 0.006 → 0.005 (placed right, any number, wrong-scale, fade 2) | 0.011 (the same child, ggt) |
| draw | 0.021 → 0.075 (last time's right dot, wrong-scale, fade 3) | 0.050 (the right dot, either button, join-wrong-end, ggg) |

**Holders, named (full sweep, now).** vertex-off **0.92 measure, 0.93 draw** (were 0.46 and 0.43 after H1). Other scale 1.00 (both goals); smaller number 0.92; outer scale 0.96 measure, 0.98 draw; always 'A se jodo' 0.60. **"Always the larger number": 0.06. "Always the inner scale": 0 in both goals.** Answer 4 now serves the levels that tell them (an acute angle; one opening anticlockwise), one each by the fourth level, but they need two sightings with different keys, and the picker's steer toward wrong-scale goes to levels that open clockwise (the only ones whose solve is evidence on the scale), where the inner reading is right. Reported, not failed.

**Answer 3, the statistic (all three modes).** The battery now also asserts the worst door sequence, pooled over fades, pL and seeds, under 1 in 10, so one door cannot hide inside a fade. A child with no randomness in her acts (a constant, the same slip, reading across) is reported by her worst cell, and every such cell named in half her sessions or more is listed below the table with the share of her sessions such cells hold. In the full sweep there are none, in any of the three modes. The table below is the full sweep (`HABIT_FULL=1`) after `dc-r8-gate2-discriminating-level`, with the worst door sequence as a column. It replaces the table after H1/H3/H4; the text after this block is that pass, kept as written.


`tests/_habit-children.mjs` runs every habit child of `RULINGS-2026-11-16-gate2.md` H2 through whole served sessions. That is the real path: `gradeActs` → `nameOnRepeat` → `afterLevelBody` → `nextBody`, at every fade, pL and door sequence, with naming forced on inside the battery only (`NAMING_OFF` is unchanged). Its test is `tests/r8-habit-battery-kon-place.test.mjs`. The table below is the full sweep (`HABIT_FULL=1`: 10 sessions a cell, 30 for a random child, 4 for each constant over every pL), after the rules were built. For each child and mix-up it shows the share of her sessions in which she is named. Only children named at all, or who hold the mix-up, are listed. The asserted figure is the worst fade (pooled over pL, doors and seeds). The worst single cell is reported.

**What was built (H1, two sightings are two different acts).**
- **measure's surface is its key on both scales** (`measureSurface`). θ and 180 − θ are one key, and another tilt of the same key is not another level.
- **A sighting counts only when what she did differs from every earlier one** (`placeSighting`):
  - the number she typed (measure wrong-scale);
  - the rim mark she dotted (draw wrong-scale);
  - for vertex-off and centre-on-arm, where her protractor's centre sat, as an offset from the vertex **on the board**. Two offsets within the centre tolerance (`tolPx`, a finger's drop, 11) are one act.
- **join-wrong-end has no value.** It is a pick between two buttons, and its spec already asks for both button orders among its four.

**The frame for a placement (main's open question 1).** The offset is taken on the board, not in the protractor's own frame. In the protractor's frame the bottom edge on O sits PD along the normal on every level, so the child who holds vertex-off would repeat one value and could never be named. On the board her offset turns with the arm she lays the base on. A habit of dropping the finger the same way stays where it was.

The cost: two of her levels count as two acts only when their first arms lie more than about 27° apart. At fade 1 (tilts within 10°) she is seldom named. That is reported below, and is under half.

New children: the same drop every level with a finger's wobble (4 px), in measure and draw. Under the old rules they are named 0.97 and 0.92. Under H1 they are named 0.

**Before → after (worst child who does not hold the mix-up, worst fade).**

| goal | sweep | before | after |
|---|---|---|---|
| measure | gate | 0.938 (the same drop every level, 20 up, vertex-off; with a wobble 0.974) | 0.016 (one random slip a level, vertex-off) |
| measure | full | 0.956 (drop 20 up-right; with a wobble 0.967) | 0.006 (placed right, any number, wrong-scale) |
| draw | gate | 0.891 (drop 20 up; with a wobble 0.911) | 0.026 (the right dot, either button, join-wrong-end) |
| draw | full | 0.906 (drop 20 up; with a wobble 0.920) | 0.021 (the same) |

The negative control still runs every time: the same children under the rules from before H1 (`legacy`). Under those rules, typing 75 every level, the same pad slip and the same drop are named, and every naming of a constant number or a pad slip comes on a second sighting of the same key.

**Holders, named (full sweep).**
- The other scale's number: 1.00.
- The smaller number: 1.00.
- Always the outer scale: 1.00 in measure, 0.99 in draw.
- The other scale's mark in draw: 1.00.
- vertex-off: 0.46 in measure, 0.43 in draw. It was 1.00. Fewer than half: reported.
- Always 'A se jodo': 0.45 (unchanged).
- "Always the larger number" and "always the inner scale" are still never told apart by the served levels: 0 and 0.003.

| goal | child | holds | mix-up | named (all sessions) | worst fade | worst door sequence | worst cell |
|---|---|---|---|---|---|---|---|
| measure | placed right, any number (0-180) (random) |  | wrong-scale | 0.004 (n 2880) | 0.005 (fade 2) | 0.011 (ggt, n 360) | 0.067 (f2 pL0.6 ggt, n 30) |
| measure | one random slip a level (typing, a tick, a drop) (random) |  | vertex-off | 0.003 (n 2880) | 0.003 (fade 1) | 0.008 (gtt, n 360) | 0.100 (f2 pL0.3 gtt, n 30) |
| measure | the smaller of the two printed numbers | **holds** | wrong-scale | 0.915 (n 960) | 0.978 (fade 1) | 0.967 (ggg, n 120) | 1.000 (f1 pL- ggg, n 10) |
| measure | the larger of the two printed numbers | **holds** | wrong-scale | 0.063 (n 960) | 0.125 (fade 2) | 0.108 (ggg, n 120) | 0.400 (f2 pL0.3 tgg, n 10) |
| measure | always the outer scale | **holds** | wrong-scale | 0.963 (n 960) | 0.988 (fade 1) | 0.983 (ggg, n 120) | 1.000 (f1 pL- ggg, n 10) |
| measure | always the inner scale | **holds** | wrong-scale | 0 (n 960) | 0 (fade 1) | 0 (ggg, n 120) | 0 (f1 pL- ggg, n 10) |
| measure | the mix-up: the other scale's number | **holds** | wrong-scale | 1.000 (n 960) | 1.000 (fade 1) | 1.000 (ggg, n 120) | 1.000 (f1 pL- ggg, n 10) |
| measure | the mix-up: the bottom edge on the vertex, reads what it shows | **holds** | vertex-off | 0.924 (n 960) | 0.953 (fade 1) | 0.950 (ggt, n 120) | 1.000 (f1 pL- ggg, n 10) |
| measure | constant answer (181 values; worst: constant 0) | | wrong-scale | 0 (n 384) | 0 (fade 1) | 0 (ggg, n 48) (constant 0) | 0 (f1 pL- ggg, n 4) |
| measure | constant answer (181 values; worst: constant 0) | | vertex-off | 0 (n 384) | 0 (fade 1) | 0 (ggg, n 48) (constant 0) | 0 (f1 pL- ggg, n 4) |
| draw | placed right, any dot, either button (random) |  | wrong-scale | 0.001 (n 2880) | 0.003 (fade 3) | 0.006 (gtt, n 360) | 0.067 (f3 pL0.6 gtt, n 30) |
| draw | placed right, the right dot, either button (random) |  | join-wrong-end | 0.033 (n 2880) | 0.035 (fade 3) | 0.050 (ggg, n 360) | 0.133 (f2 pL- gtg, n 30) |
| draw | one random slip a level (a nudge, a tick, the other button, a drop) (random) |  | vertex-off | 0.003 (n 2880) | 0.004 (fade 1) | 0.008 (tgg, n 360) | 0.033 (f1 pL- tgg, n 30) |
| draw | one random slip a level (a nudge, a tick, the other button, a drop) (random) |  | join-wrong-end | 0.002 (n 2880) | 0.003 (fade 2) | 0.006 (gtt, n 360) | 0.033 (f1 pL0.6 ggt, n 30) |
| draw | last time's right dot |  | wrong-scale | 0.025 (n 960) | 0.075 (fade 3) | 0.025 (ggg, n 120) | 0.100 (f3 pL- ggg, n 10) |
| draw | always the outer scale (dot where it reads the size) | **holds** | wrong-scale | 0.983 (n 960) | 0.994 (fade 2) | 1.000 (ggg, n 120) | 1.000 (f1 pL- ggg, n 10) |
| draw | always the inner scale | **holds** | wrong-scale | 0 (n 960) | 0 (fade 1) | 0 (ggg, n 120) | 0 (f1 pL- ggg, n 10) |
| draw | the mix-up: the other scale's mark | **holds** | wrong-scale | 1.000 (n 960) | 1.000 (fade 1) | 1.000 (ggg, n 120) | 1.000 (f1 pL- ggg, n 10) |
| draw | the mix-up: always 'A se jodo' | **holds** | join-wrong-end | 0.600 (n 960) | 0.681 (fade 2) | 0.800 (ggg, n 120) | 1.000 (f1 pL- ggg, n 10) |
| draw | the mix-up: the bottom edge on the vertex | **holds** | vertex-off | 0.932 (n 960) | 0.969 (fade 2) | 0.942 (ggg, n 120) | 1.000 (f1 pL- ggg, n 10) |
| draw | constant answer (181 values; worst: constant dot 0) | | wrong-scale | 0 (n 384) | 0 (fade 1) | 0 (ggg, n 48) (constant dot 0) | 0 (f1 pL- ggg, n 4) |
| draw | constant answer (181 values; worst: constant dot 0) | | vertex-off | 0 (n 384) | 0 (fade 1) | 0 (ggg, n 48) (constant dot 0) | 0 (f1 pL- ggg, n 4) |
| draw | constant answer (181 values; worst: constant dot 0) | | join-wrong-end | 0 (n 384) | 0 (fade 1) | 0 (ggg, n 48) (constant dot 0) | 0 (f1 pL- ggg, n 4) |

Children with no randomness in their acts whose worst cell is named 0.5 or more (answer 3), with the share of her sessions such cells hold:

none.

sweep: {"full":true,"seeds":10,"randomSeeds":30,"constSeeds":4,"constPls":null}; 329113 ms

## Gate 2, H5 and H7 (2026-11-16, branch `claude/r8-gate2-h5h7`)

- **H5, the facts row.** Until a level names a mix-up, the row the teacher gets for a measure, draw or size level is `game=kon/place verdict=… first_try=0|1 checks=n` (`checks` is the level's commits), and an impasse row is `game=… checks=n` (`server/play/routes.js` `seamOut`). Gone from it: `read`, `made`, `pick`, `placed`, `centre_px`, `base_deg`, `locked`, `measure`/`angle`/`compare`, `goal`, `shown`, and the lead's `misses`, `extra`, `chose`, `next`. The trail keeps the raw act. A level that names a mix-up keeps naming's own row: the lead with `placed=ok|off`, and the family's facts.
- **H5, the weight.** A miss in a mix-up's form (vertex-off, centre-on-arm, wrong-scale, join-wrong-end) was CHANCE_WEIGHT (0.25), and any other miss GAME_WEIGHT (0.5). Every miss now leaves at 0.5 (`nameOnRepeat`). The reason is the same as in the other modes: a miss is not luck, and naming-off and named rows are already 0.5.
- Asserted in `tests/r8-gate2-facts-row.test.mjs`. Through the route: 35 served levels and 263 level ends in the gate (147 levels and 1,355 ends in the full sweep). Naming on: 192 levels, 44 named.
- **H7.** The gate-2 tables now run over **every level the generator can make: 2,510** (1,496 measure, 1,014 draw). `kon.place.ts` `placeLevelOf` is the function `generatePlace` calls; the generator was refactored around it, and the served levels are byte-identical over 120,866 generated levels. The test calls it over every key θ, both orientations, every tilt any fade draws (a steered fade-1 level takes fade 2's tilts) and every fade. For each one it takes the first accepted point on a grid of the continuous draws.
  - Every table depends on the key, the tilt, the orientation and the tolerances, not on where the figure sits on the board, so this covers every level the tables can see.
  - Every sampled level is among them. A check over 742,987 generated levels (3,000 seeds × every fade, both steers) found none outside the set.
  - The old 8 seeds reached 719 of these, as 1,014 param sets.
  - Measure keys: 20–75, 105–135, 145–160 (60, 65, 70 and 160 are now in). Draw keys: 20–40, 60, 65, 115–160.
  - "Measure never serves 140" is now checked over every measure level.
  - The join's order comes from the level's seed (a coin), not its key, so the join table stays on the sampled levels.
  - Every assertion holds. The worst figures are unchanged, except that vertex-off's worst drop moves from 0.0929 to 0.0930.
  - Time: 6 s → 16 s for the file.

## Gate 2: evidence

Ruling (`RULINGS-2026-11-11-night.md`, decision `dc-r8-game-gate-play-then-evidence`), kon/place: "nothing reaches the teacher from one join press (the packet says the sign does; make the code and the packet agree with law 3), and give the tolerance that names vertex-off". **Law 3's number:** an act that a blind guess or one ordinary slip produces more than 1 time in 10 names nothing by itself. **Read per session** (`RULINGS-2026-11-15.md`, "To Games, 2026-11-16"): the 1 in 10 is the chance that a child is named a mix-up she does not hold over one sitting. Named from one level, vertex-off (1 in 3.1), wrong-scale in `measure` (1 in 2.9) and in `draw` (1 in 9.4) were over it over four levels; every kon/place mix-up is now named on a repeat ("Per session", below). Computed in the same test ("gate 2, per session"); the rule on branch `claude/r8-gate2-session`.

Branch `claude/r8-gate2-place`. Every number below is computed by `tests/r8-games-kon-place-gate2.test.mjs` from the board, the protractor, the pad as the view lays it out and the law's own tests of a placement, and asserted on every generated level: 178 `measure` and 179 `draw` levels (fades 1–3, eight seeds, the kit map the server serves, centre-on-arm mapped as it will be at integration 49). Naming is still off for kon/place (`NAMING_OFF`); the last part says what switching it on changes.

**What counts as what.**
- A **pose** is the protractor's centre (any point, to half a board unit) and its turn (whole degrees: the law turns in 1° steps).
- A **blind placement**: the centre anywhere on the 320 × 340 board, evenly, and any of the 360 turns, evenly. **Near the vertex**: the centre anywhere within the protractor's radius (105 units) of O, any turn.
- An **ordinary slip** in placing: one press of ← ↑ ↓ → (one board unit), or one turn step (1°, about the protractor's own centre, so the centre does not move). In typing (measure): one key landing on a key that touches it (side or corner) on the pad as laid out (1 2 3 4 5 6 / 7 8 9 0 ⌫, six to a row), two neighbouring presses swapped, one press not registered, one press registered twice, each as the pad takes it (no fourth digit, nothing after a lone 0, nothing over 180). In reading the scale: one small tick (5°) or one long tick (10°) off. In draw's dot: one ↺ / ↻ press (1° along the rim).
- **A drop that misses**: the turn right, the centre off O by up to r units in any direction, evenly over that disc (a finger that lands short or long). Not a single slip: it is how far off a whole drop may land, given for every r.
- **A pick**: one of a few buttons. Its chance is 1 over the number of buttons, and a habit of pressing one place (the first button, the left one) is counted too.

### The four mix-ups and size, at a glance

| Mix-up | The act | Blind | One ordinary slip | Named from | Per session (4 levels): before → now |
|---|---|---|---|---|---|
| vertex-off | a placement | 1 in 8,905 (board); 1 in 2,835 (near O) | 0 (a drop that misses: 1 in 10.8) | **a second level** (was one) | 1 in 3.1 → **1 in 21.9** |
| centre-on-arm | a placement | measure 1 in 1,227, draw 1 in 2,453 (board); measure 1 in 390, draw 1 in 781 (near O) | 0 (a drop that misses: 1 in 54) | **a second level** (was one; where a level maps it) | 1 in 13.9 → **1 in 499** |
| wrong-scale, measure | a typed number | 5 in 181 = 1 in 36 | typing: 1 in 14 at worst on a key (155), 1 in 10 at worst on a reading the law names at; tick: 0 | **a second level** (was one) | 1 in 2.9 → **1 in 19.1** |
| wrong-scale, draw | a dot on the rim | 5 in 181 = 1 in 36 | dot nudge: 0; tick: 0 | **a second asked size** (was one level) | 1 in 9.4 → **1 in 227** |
| join-wrong-end | one of two buttons | 1 in 2 one level; 1 in 4 two | a slip onto the other button makes it (below) | **the fourth sighting**, four asked sizes, both button orders | 1 in 16 → **1 in 16** (four of four levels; with no cap, four of six was 11 in 32) |
| size (`tool-size`) | one of three buttons | 1 in 3 | — | never: size names no mix-up | — |

### Per session: how many levels, and the arithmetic

(2026-11-16, H1: a second sighting also needs another act. In measure, another key on both scales. For a placement, her centre more than a finger's drop (`tolPx`) from where it sat, on the board. See "Gate 2 battery". The figures below are for levels that differ, so they are upper bounds now.)

**How many levels a session serves.** None is set by how a session serves levels: `/api/play/next` serves another whenever it is asked, and each act signs the session token afresh. So the figure needs a bound, and the server sets one: **a pick with a gate-2 rule is named only on the session's first four levels** (`NAMING_LEVELS = 4`, `server/play/levels.js`, from the session body's level count, which only the server sets). Later levels still grade right or wrong and play out; they name no pick. The same cap holds for `stambh/tally` and `kon/name`.

**The gap: the day, not the session** (`RULINGS-2026-11-15.md`, "the per-session reading" 3): the ruling's unit is the child's day (per child, per mode, per day; IST, `server/learner/kt/ledger.js` `dayOf`), but the four levels and the sightings are still counted per session, since no play table holds them (an unnamed sighting lives only in the signed session token), so three sessions in a day are three counts until a per-day play table lands (a migration; the status file says what it takes).

**The chance on one level, p** (for a child who does not hold the mix-up): the worst of a blind act, one ordinary slip and a drop that misses, over every generated level; for wrong-scale in `measure` also over every reading the law names at (a placement within the tolerance shows a few degrees off the key: 1 in 10 at worst there, which is over the keys' own 1 in 14). Each level is independent, so over n = 4 levels:
- named from one level: 1 − (1 − p)⁴;
- named on a second level: P(two or more of four) = 1 − (1 − p)⁴ − 4p(1 − p)³;
- the join, on the fourth: p⁴ (four of four).

| Mix-up | p (the worst act on a level) | From one level, 4 levels | Now: on a second level (join: the fourth) | Law 3's line |
|---|---|---|---|---|
| vertex-off | 0.0929 (a drop that misses, r = 30) | 1 − 0.9071⁴ = 0.323 = **1 in 3.1** | 1 − 0.9071⁴ − 4 × 0.0929 × 0.9071³ = 0.0456 = **1 in 21.9** | was over; now under |
| centre-on-arm | 0.0185 (a drop that misses, r = 138) | 0.072 = 1 in 13.9 | 0.0020 = 1 in 499 | under both ways; a repeat all the same, since a from-one-level rule is not held to the session's first four levels, and at six it passes the line (1 − (53/54)⁶ = 0.106) |
| wrong-scale, measure | 0.1 (one typing slip, at a reading the law names at) | 1 − 0.9⁴ = 0.344 = **1 in 2.9** | 1 − 0.9⁴ − 4 × 0.1 × 0.9³ = 0.0523 = **1 in 19.1** | was over; now under |
| wrong-scale, draw | 5/181 = 0.0276 (a blind dot) | 0.106 = **1 in 9.4** | 0.0044 = 1 in 227 | was over; now under |
| join-wrong-end | 1/2 (a blind press) | — | (1/2)⁴ = **1 in 16** | under |

A second sighting counts on a level that differs: in `measure` any other level; in `draw` another asked size (`chanceRepeat` `apart: [0]`; the join order need not differ for these). A `measure` and a `draw` sighting never count together (their surfaces are of different shapes). The figures leave the surfaces out, so they are upper bounds.

### vertex-off: the tolerance that names it

**The band.** vertex-off is named when, at her first decision, the protractor is not placed and:
- its base lies along an arm within ±3° (in `measure`, with the other arm crossing the half-disc), and
- its centre is within **10 units** of the point 24 units (the strip's depth) from O along the normal into the half-disc: where the centre is when the bottom edge's middle is on O.

(Gate 2 per session: within this band a level counts toward vertex-off; it is named on a second.) So the centre lies **14 to 34 units from O, within 24.6° of the normal (asin 10/24), on the side the protractor opens**: at 360, about 12 to 29 CSS px off O; at 1366, about 32 to 77 px. The test checks on every level that this is exactly the band the law names (72 ways round, just inside names it, just outside does not; ±3° of turn names it, ±4° does not; the served vertex-off pose is in it).

**Why 10 (it was 11).** At 11, a drop that misses landed in the band 1 time in 9.3 (r = 30: 0.108). At 10 the worst over every r is **1 in 10.8** (r = 30: 0.093). Real vertex-off placements are not lost: the served pose is the band's centre, and a child aiming the bottom edge at O lands within 10 units as she lands within the 11 of a placement.

| vertex-off, every generated level (178 measure, 179 draw) | Result | Law 3's line |
|---|---|---|
| Turns the band takes, of 360 | 14: 7 turns (±3°) for each of two ways the base can lie (draw: either way along OA; measure: along OA or along OB, opening towards the other arm) | — |
| A blind placement, board | 14 × π × 10² / (320 × 340 × 360) = **1 in 8,905** (an upper bound: the whole disc counted on the board) | under 1 in 10 |
| A blind placement near O (within 105 units, any turn) | 14 × 10² / (105² × 360) = **1 in 2,835** | under 1 in 10 |
| Locked where it rests (no move at all) | names nothing, on every level | — |
| One slip from **any** placement (centre anywhere within 11 units of O, turn within ±3°): a nudge (4 ways) or a turn step (2 ways) | **0**: a placed centre is at most 11 units from O, one nudge makes it 12, the band starts at 14; a turn does not move the centre. Tried on every level: 72 points on the tolerance's edge × 7 turns × 6 slips = 3,024, none named | one slip names nothing |
| A drop that misses, by its reach r (right turn) | 0 for r ≤ 13; 1 in 18.5 (r = 20); 1 in 12 (r = 25); **1 in 10.8 at worst (r = 30)**; 1 in 11.6 (r = 34); 1 in 16 (r = 40); 1 in 36 (r = 60) | under 1 in 10 for every r |

### centre-on-arm

**The band** (unchanged): the centre within 11 units of A (in `measure`, of B too) with the base along that arm within ±3°; or a bottom corner of the protractor within 11 units of O with the base along an arm. Its nearest point to O is 107.7 − 11 = 96.7 units away.

| centre-on-arm, every generated level | Result | Law 3's line |
|---|---|---|
| Discs the band takes over the 360 turns | measure 84 (A, B and the two corners, for each arm's two directions within ±3°); draw 42 | — |
| A blind placement, board (upper bound) | measure **1 in 1,227**; draw 1 in 2,453 | under 1 in 10 |
| A blind placement near O | measure **1 in 390**; draw 1 in 781 | under 1 in 10 |
| One slip from any placement | **0** (96.7 units away; the 3,024 slips above, none named) | one slip names nothing |
| A drop that misses | at worst **1 in 54** (r = 138) | under 1 in 10 |
| Locked where it rests | names nothing | — |

### wrong-scale

**The mix-up's numbers** on a level whose key is θ (what the protractor shows on the right placement): 180 − θ, ± 2, five numbers. Named only where the two scales differ by more than 4 (always here: the keys stay 15° or more from 90, so the mix-up's number is at least 30 from the key in `measure`, 50 in `draw`).

| wrong-scale, measure (178 levels; keys 65, 70, 75, 105, 110, 115, 120, 125, 130, 135, 145, 150, 155, 160) | Result | Law 3's line |
|---|---|---|
| A blind number on the pad (0 to 180) | 5 / 181 = **1 in 36** | under 1 in 10 |
| One typing slip on the key: the share of the pad's slips that land on the mix-up's numbers | 0 on twelve keys; 110: 1 of 16 ("710" → 71: the 1 one key off, and the pad will not take the 0 after 71); 155: 1 of 14 ("255" → 25) | **1 in 14 at worst** |
| One tick off (5° or 10°, either way) | 0 (the mix-up's number is 30 or more away) | — |
| **140 is no longer served** (it was at fades 2 and 3) | 2 of 18 slips land: "40" (the 1 not registered) and "41" (1 and 4 swapped, then the 0 not taken): **1 in 9** | over the line: refused |
| A placement within the tolerance shows a reading a few degrees off the key; at a reading whose one typing slip passes 1 in 10 (16, 140, 141, 159, 164, 165, 166: every reading 0 to 180 is worked out) the law names no wrong-scale, and her number is an ordinary miss | asserted: the law's set is the one worked out in the test, and such a placement typed the other scale's number is not named | — |

| wrong-scale, draw (179 levels; asked 115 to 160) | Result | Law 3's line |
|---|---|---|
| A blind dot on the rim (0 to 180) | 5 / 181 = **1 in 36** | under 1 in 10 |
| One ↺ / ↻ press from the right mark | 0 (1°; the mix-up's mark is 50° or more away) | — |
| A tap off on the rim | 1° of rim is 1.8 units; the mix-up's mark is about 92 units or more along the rim: no finger's slip | — |

**Counting the wrong way is the mix-up, not a slip.** A child who counts ticks from the printed 90 the wrong way reads exactly the other scale's number (the other scale prints its own 90 at the same tick and its numbers run the other way): that is what reading the wrong scale is, and it repeats. It is not counted as a slip.

### join-wrong-end: nothing from one press

| join-wrong-end, draw (179 levels; "A se jodo" first on 96) | Chance | Law 3's line |
|---|---|---|
| One join, blind (her placement and dot right) | 1 in 2 | over: names nothing |
| Two joins on two levels | 1/2 × 1/2 = 1 in 4 | **still over: a pair is not enough** |
| Three | 1 in 8 | still over |
| **Four, on four different asked sizes, with both button orders among them** | (1/2)^4 = **1 in 16** | under 1 in 10 |
| A habit of pressing one place (the first button, or the left one) | A only where A comes first (54% of levels), never under both orders: **0** | — |

**What one press sends now** (with naming on as well as off): the evidence row is an ordinary miss at chance weight with no mix-up and no `chanceMis`; nothing in the trail; no seam row mid-level (a pick's mix-up sends none); the level-end facts and facts row carry `placed`, `made` and `at` (as for any miss) and no `sign`, `mal` or `misconception`. The law no longer writes `sign=join-wrong-end` into the moment's facts at all (it had named the belief after one press). Her own play-out on the device is unchanged: her brown line from A, the arc at A, the chip "∠A".

**How the server names it.** The session remembers each join-wrong-end at chance weight with its level's surface, in two parts: the asked size and the join order (`drawSurface`; the last six picks are kept). On a later level's join-wrong-end, it is named (at the game weight, `named: "repeat"`, then in the trail) only when this level and three remembered ones have **four different asked sizes** (different marks on the rim) and **both join orders** among them (`konLogic.chanceRepeat`, `server/play/levels.js` `repeatMet`). The shared rule for every other pick (one earlier sighting on a surface that differs) is unchanged.

### What changes when main switches naming on

(Main removes `kon/place` from `NAMING_OFF` in `shared/play.ts`; no screen changes.)
- vertex-off, centre-on-arm (where mapped) and wrong-scale: one level's first decision reaches the lesson as an ordinary miss (at chance weight, no mix-up, no seam, nothing in the trail); the session remembers it. A second, on a level that differs (in `draw`, another asked size), within the session's first four levels, is named in that level's evidence row (`named: "repeat"`, the game weight) and trail. `placed=off` still reaches the teacher at once: it is what her act did, not a name.
- join-wrong-end: one, two or three presses reach the lesson as ordinary misses; the session remembers them. The fourth, on the terms above, within the session's first four levels, is named in that level's evidence row and trail.
- size names nothing either way.
- Until then nothing is named and nothing is remembered. Tested both ways: "gate 2, the server's rule with naming ON" (`gradeActs` → `lessonEvidence` → `nameOnRepeat` → `afterLevelBody`, the session token carrying what it remembers; and as served).

**For main, not decided here.**
1. **A finger slip onto the other join button.** If her one slip on a draw level is on the join press, it makes join-wrong-end every time (the only button beside "O se jodo" is "A se jodo"). With the tally rule's convention (a slip on every level, certain), no number of repeats gets under 1 in 10; with a mis-press rate s per join it is s^4. The four-sightings rule rests on mis-presses being rare on two 48 px buttons. Measured nowhere yet. If main wants it closed without that assumption, the join can become a constructed act: she draws the ruler line from the dot to an end point (a drag ending within some units of O or A, 130 units apart), which would be named as the placements are (on a second level). That is a change to the screen (gate 1 again).
2. **Per pair or per session.** Ruled per session (2026-11-16); answered in "Per session" above: the join's four are four of the session's first four levels.

## The rule the game enforces (never stated on screen)

A protractor is **placed** when both of these hold:
- its small centre dot is within 11 board-units of the vertex O (about 9 CSS px on a 360 px phone, about 25 px on the 1366 screen; see Sizes);
- its straight base line is within ±3° of an arm. For `measure`, the other arm must also cross the half-disc, i.e. the protractor opens towards it.

Everything after that is graded on what the protractor shows *as placed*:
- The scale to read is the one whose 0 sits on the placed arm.
- A typed reading counts if it is within ±2° of what that scale shows. **The number she types decides which scale she read:** within ±2° of 180 minus that number is the other scale (`wrong-scale`).
- A drawn dot counts if it is within ±2° of the asked angle on that scale.

**A protractor that is not placed can never solve the level**, whatever number she types or marks off it. The game never snaps the protractor to the vertex or to an arm (a snap would be the placement), never prints a reading for her, shows no live reading of the angle, and has no timer.

## Goal 1: `measure` (read the angle)

**What she sees.** Two black arms from a dot O, with letters A and B at the arm ends and O near the dot (O stands clear of every line of the protractor in every pose: below its bottom edge when it is placed). A loose, see-through half-disc protractor rests below the figure, slightly tilted. It has a printed outer scale and a printed inner scale. Numbers are printed every 20° at fade 1 (as in the shots), every 30° at fade 2, and only 0, 90 and 180 at fade 3; small ticks are every 5°, longer every 10°. Where two numbers would stand closer than 4 px at the screen's size and the protractor's turn, a number first slides along its own tick (an inner one inward, an outer one outward); only where no slide parts them are **both numbers at that tick** left out together, the outer and the inner (at 360 × 640, protractor flat: the tick of the outer 80 and the inner 100; nothing at 1366). A number is never left out of one scale alone. The scale numbers are drawn over the arms and her lines on a ground halo, so a line through a number never hides it. A round blue-violet handle with two turning arrows sits on the protractor's body. The instruction under the board reads "Protractor se ∠AOB naapo". There is a row of six small buttons (↺ ↻ ← ↑ ↓ →), then "Wapas" and "Rakh do". Shots: `measure-initial-*`, `measure-turned-*` (turned 12°: a number slid along its tick), `measure-placed-*`.

**What she does, in order.**
1. She drags the protractor by its body to move it. **← ↑ ↓ → move it by one board px** (about 0.84 CSS px at 360, 2.3 px at 1366) for the last fine step under her finger: the law's own move, no snap, no reading, nothing on screen but the protractor moving.
2. She drags the blue-violet handle to turn it about its own centre, in 1° steps. ↺ and ↻ turn it by exactly 1° each press.
3. She presses "Rakh do". The protractor is now frozen. The instruction changes to **"Scale padho aur ∠AOB ka number likho"** and a **number pad** appears: 1 … 9, 0 and ⌫ (delete), with "Phir se rakho", "Wapas" and "Yahi hai" under it. Shot: `measure-locked-*`.
4. **She types the number she reads.** Nothing on the board prints a value: tapping the protractor does nothing after the lock. Her number appears in a blue-violet chip under the board as she types (e.g. "150°"). The pad refuses a number over 180. Shot: `measure-typed-*`.
5. She presses "Yahi hai" (off until she has typed a digit).
6. After the lock she has two ways back: "Wapas" takes back one step (the lock itself, or, after a miss, her last "Yahi hai"), and "Phir se rakho" unfreezes the protractor and clears what she typed.

**This level's givens and key** (as in the shots, level `kon-place:measure:150:180m`). OA runs flat to the **left**; OB goes up and to the right, so the angle opens clockwise from OA. Placed with its centre on O and its base along OA, the protractor's **outer** scale has its 0 at the far (right) end, away from A, and the **inner** scale has its 0 on OA. **The key is 150°**, read on the inner scale. 150 is not a printed number at fade 1 (every 20° is printed): she counts the ticks past 140. Reading the outer scale gives 30: that is `wrong-scale`. Levels like this one, where the outer scale is the wrong one, are half of all levels. Shot: `measure-end-*`.

### Mal-rule `vertex-off`
- **Kit belief:** "Lines up the bottom edge of the protractor instead of putting its centre point on the vertex". Signs (as split by Learning): "Places the vertex on the protractor's bottom edge, not at the small centre mark", "Gets readings a few degrees off (about 6 to 8 degrees: 133 for 125)", "Does not look for the small centre mark".
- **What a child holding it does.** She slides the protractor so its flat bottom edge lies along OA with O on that edge (O at the middle of the edge). This leaves the centre dot 24 board-units above O. She turns it flat, locks it, and types the number the protractor *as it sits* shows (here 161). Shots: `measure-vertex-off-typed-*`, `measure-vertex-off-played-*`.
- **What the screen then shows when she presses "Yahi hai"** (no words):
  - a brown ring on O, with a thin dashed brown line from O to the protractor's centre dot: **the placement only**;
  - her "161°" chip stays **neutral** (no colour of right or of a mix-up), and **no arm is drawn from the misplaced centre** (round 3, ruling 1: such an arm runs beside OB and would tell her whether her number was right).
  - The ring and the dashed join appear only in the play-out of a committed decision whose placement is the bottom edge on O. Never before her first "Yahi hai", never for any other off placement.
- **How it is graded.** Not right. Her number is graded only on a placed protractor, so here it is **not graded at all**: whatever she types (161, 150, 30, 7), the decision, its name and its play-out are the same. It is `vertex-off` by the placement alone (the bottom edge on O); one level names nothing, a second such level names it (gate 2, per session). The generator only serves a level where the reading as placed differs from the true angle by at least 3°, so a child who reads her misplaced protractor correctly does not land on the key by accident.

### Mal-rule `centre-on-arm` (*)
- **Kit belief:** "Puts the protractor's centre mark (or its corner) somewhere other than the vertex: on an arm, or at an arm's end point". Signs: "Puts the centre mark on point A or C, the end of an arm", "Sets the protractor's corner, not its centre mark, at the vertex", "Reads a number tens of degrees off, or finds no reading at all".
- **What the game takes as this placement** (each a placement a guess rarely makes, law 3): the centre mark within 11 units of an arm's end point (A, or B in `measure`) with the base along that arm (±3°); or the protractor's bottom corner within 11 units of O with the base along an arm.
- **What a child holding it does** (shot `measure-centre-on-arm-played-*`): she puts the centre mark on A with the base along OA, locks it, and types what she thinks she reads (150). Part of the protractor then runs past the board's edge: it is her own placement. A scale number that would not stand wholly on the board is not drawn, and neither is the other number at its tick (gate 1), so no cut "140" reads "40".
- **What the screen then shows:** the brown ring on O and the dashed brown join from O to where her centre is (here along OA, to A): the placement only. Her "150°" chip stays neutral (150 is the true size; round 2 painted it brown and drew an arm from her centre parallel to OB, which told her 150 was right). No arm is drawn from her centre. In `draw` (shot `draw-centre-on-arm-played-*`): the ring and join, her arm from O through the dot she marked on the misplaced protractor, its arc and the chip "∠O" (gate 1: no number on it).
- **How it is graded.** Never right (an off placement never solves), and her number is not graded (whatever she types, the same decision). `centre-on-arm` only on a level that maps it, named on a second such level (gate 2, per session); the ring and the join are shown only where it is mapped (an unnamed off placement never shows where the centre belongs).

### Mal-rule `wrong-scale`
- **Kit belief:** "Reads the wrong scale on the protractor, e.g. gets 130° for a 50° angle". Signs: "Gives a reading over 90° for an obviously narrow angle", "Always reads the outer scale", "Two readings for the same angle add to 180°".
- **What a child holding it does.** She places the protractor correctly and types the other scale's number: 180 − 150 = **30**. Shots: `measure-wrong-scale-typed-*`, `measure-wrong-scale-played-*`.
- **What the screen then shows:** a dashed brown arm from O at 30° from OA, i.e. the arm her number means on the scale whose 0 is on OA, far from OB, **stopping inside the inner number ring** (gate 1: running on, it met the outer scale at 150, the key); a dashed brown arc between OB and that arm (no number on it); her "30°" chip in brown. The true size is never shown. **From her second miss on a placed protractor** her arm and arc are no longer drawn, only her brown chip (gate 1: miss after miss, the arm had become a too-high, too-low guide). Shot: `measure-second-miss-played-*` (30, then 140).
- **When the game takes it as wrong-scale** (counted toward a repeat; named on a second level, gate 2 per session). When her typed number is within ±2° of 180 minus the true reading, and the angle is not close to 90° (where the two scales would agree), and (gate 2) the protractor as placed does not show one of the readings whose other-scale number one typing slip reaches more than 1 time in 10 (140, 141, 159; and 16, 164–166, which no key is). Any other wrong number is an ordinary miss with the same arm drawn (first placed miss only) and no mix-up named; within 5° it is recorded as a near miss.
- **What a first-try solve says.** Only on a level where the outer scale is the wrong one (as here) does a first-try solve count as evidence that she chose the right scale. On a level where OA points right, the outer scale is the right one, a child who always reads the outer scale solves it, and her solve says nothing about scales (it counts only as a correct placement).

## Goal 2: `draw` (draw an angle of a given size)

**What she sees.** Only the first arm, OA, with the dot O and the letter A. The same loose protractor rests below. The instruction gives the size: "Protractor se OA par ∠AOB = 130° banao". Shot: `draw-initial-*`.

**What she does, in order.**
1. She drags, turns and presses "Rakh do" exactly as in `measure`. The instruction changes to **"Kinare par 130° ka bindu lagao, phir jodo"**. Shots: `draw-placed-*`, `draw-locked-*`.
2. She taps the rim of the protractor to put a blue-violet dot, a hollow ring, so the tick under it shows through. Tapping the rim again moves it, and **↺ ↻ move the dot 1° along the rim** (1° is under 2 px on a phone, too fine for a finger). The arrows say which way it moves round the rim, not "−1"/"+1", because a number would name one of the two scales. Shot: `draw-dot-*`.
3. She presses "O se jodo" or "A se jodo" to join the dot to O or to A with the ruler. Both are off until a dot is placed. **The two buttons' order changes from level to level** (here "A se jodo" comes first).
4. "Phir se rakho" unfreezes the protractor and clears the dot; "Wapas" undoes her last step. After a miss, a new dot ends the play-out of the old one: nothing is measured until she joins again.

**This level's givens and key** (level `kon-place:draw:130:180m`). OA flat, pointing **left**; **asked angle 130°** (not a printed number at fade 1). She must place the protractor (centre on O, base on OA), put the dot at **130 on the scale whose 0 is on OA** (here the inner scale), and join it to **O**. The game then draws her arm from O through the dot in green, with its letter **B** at its end and a green tick beside it. Shot: `draw-end-*`. Draw accepts the protractor either way round; it reads whichever scale has its 0 on OA.

**After any miss** the screen shows only *her* arm (brown), a brown arc at the corner it starts from, and a brown chip naming that corner, "∠O" or "∠A", **with no number**, its letter set in the face the board's point letters use (gate 1, by the main loop's look, 2026-11-15: in the mono face the O read like a zero; then raised from 15 to 18 px, the size of the point letters, so the O does not read small beside the ∠ sign) (gate 1: her arm lies across the placed protractor and she reads it there herself; a printed size turned a retry into arithmetic). **The asked arm is never drawn**: there is no line to trace.

### Mal-rule `vertex-off`
- **What a child holding it does.** Bottom edge on OA with O on it (centre 24 units above O); dot at 130 on the scale; joined to O. Shot: `draw-vertex-off-played-*`.
- **What the screen then shows:** the brown ring on O with the dashed line to the protractor's centre; her arm from O through the dot, in brown; a brown arc at O and the chip "∠O" (her arm really makes 123°, which she reads on the protractor herself).

### Mal-rule `wrong-scale`
- **What a child holding it does.** Places the protractor correctly, marks 130 on the *other* (outer) scale, which puts the dot 50° from OA, joins to O. Shot: `draw-wrong-scale-played-*`.
- **What the screen then shows:** her brown arm (it makes 50°), a brown arc at O and the chip "∠O".
- As in `measure`, it is told apart only on levels where the outer scale is the wrong one (OA points left, as here).

### Mal-rule `join-wrong-end` (at chance weight)
- **Kit belief:** "Believes the degree mark can be joined to either end of the first arm, so joins it to the far end instead of to the vertex where the protractor's centre was".
- **What a child holding it does.** Places the protractor correctly, puts the dot at the right mark (130), then presses "A se jodo". Shot: `draw-join-wrong-end-played-*`.
- **What the screen then shows:** her brown line from A (the far end of OA) through the dot; a small brown arc at A; a chip "∠A" (the line makes 22° there; no number on the chip).
- **How it is graded.** Not right. It is the `join-wrong-end` signature only when the dot itself was at the right mark. Because the join is one of two buttons, a guess makes it half the time, so one join puts **nothing on her record**: the grade keeps it at chance weight (`chanceMis`), and the play server names it only on her **fourth** such join, on four levels with four different asked sizes and both button orders among them (gate 2, below). Nothing about one join reaches the teacher: no mix-up, no `sign`, nothing in the facts, the seam or the trail (gate 2: the old `sign=join-wrong-end` fact is gone).

## Goal 3: `size` (which angle is more?)

**What she sees.** Two angles, ∠P above and ∠Q below. Each already has a protractor sitting correctly on it, one small (above in this level) and one big. Each angle's name is under its vertex. **Both protractors print the same numbers** (every 30° at fades 1 and 2, as in the shots; 0, 90 and 180 at fade 3). The instruction reads **"Kaunsa kon zyada hai: ∠P, ∠Q, ya dono barabar?"**. Three buttons: "∠P", "Barabar", "∠Q". Nothing can be moved. Shot: `size-initial-*`.

**What she does.** She presses one of the three buttons.

**The keys.** The generator makes **any of the three** the key, equally often, and either protractor can hold the bigger angle. The two angles differ by 15–40° or are equal; at fades 1 and 2 neither is a printed number.
- Level 1 (`kon-size:105:105:B`): ∠P = ∠Q = 105°; **the key is "Barabar"**. Shot: `size-end-*`: a chip "∠P = ∠Q" between the two figures with the green tick beside it, clear of both names.
- Level 2 (`kon-size:100:135:Bm`): ∠P = 100° (small protractor, opening the other way), ∠Q = 135° (big protractor); **the key is "∠Q"**. Shots: `size-other-*`.

**A wrong pick** shows only *her* pick, in brown: the name she picked becomes a brown chip under its figure, or, for "Barabar", a brown chip "∠P = ∠Q" between the figures. **No reading is shown** while a pick remains (the readings would settle the next pick). Shots: `size-wrong-pick-played-*` (she picks ∠Q on level 1), `size-other-same-played-*` (she picks "Barabar" on level 2).

### No mix-up is named here
The kit's `tool-size` belief ("Thinks a bigger protractor gives a bigger reading for the same angle") is about the *reading* one angle gives under two tools. This goal asks which of two angles is more and never asks for a reading, so it does not claim `tool-size`. A wrong pick is an ordinary miss.

## Things the judges should know

- **Can a child pass by trial?**
  - `measure` and `draw`: not by luck. A protractor that is not placed never solves. A correct reading of a wrong placement is `vertex-off`, never right. Only the exact "bottom edge on O" placement is *named* `vertex-off`; any other off placement is a plain refusal with no mix-up recorded, and its play-out shows nothing of where the centre belongs (no ring, no line to O): in `measure` only her neutral chip, in `draw` her own arm from O and the angle it makes. She can try again; every decision is recorded. Only a *first* decision that is already a solve counts as first-try evidence. Her first decision stays the level's evidence even if she then solves (a mix-up there counts toward a repeat, gate 2).
  - After a miss the play-out shows where *her* number or arm landed, never the key. A persistent child can still compare her arm with OB (measure) or adjust her dot and join again (draw): that is reading the protractor again, which is the skill.
  - `size`: one pick among three, so a first-try solve enters the learner model at the "chance" weight. She can pick again after a miss and passes within three presses, but not first-try. Any of the three can be the key, so no fixed habit ("the bigger tool", "always Barabar") wins more than a third of the levels.
- **End screens.** A first-try solve ends with a full green tick; a solve after a miss ends with a **pale** tick. The line under the board says what she did and how many checks it took, with no praise: "Tumne 150° likha · jaanch: 1" (measure), "Tumne ∠AOB = 130° banaya · jaanch: 2" (draw), and for size what she found: "∠P aur ∠Q barabar hain · jaanch: 1" or "∠Q zyada hai · jaanch: 2" ("jaanch" lowercase after the dot, as in kon/name). Shots: `*-end-*` (one check), `*-end-after-miss-*` (two checks, pale tick).
- **What the teacher receives.** `placed` (ok or off, at her first decision), `centre_px`, `base_deg`, `read` (measure), `made` and `at` (draw), `pick` (size), and the mix-up if named (gate 2: vertex-off, centre-on-arm and wrong-scale on a second level, join-wrong-end on its fourth, within the session's first four levels). The teacher is not told the measure reading before she gives it. The game never speaks.
- **Sizes.** The board is a fixed 320 × 340 units scaled into the box. In `measure` and `draw` on a phone the buttons keep a band of three rows from the first screen, so the board has one size in every state: at 360 × 640, 1 unit is 0.84 CSS px and the protractor 177 px wide (first screen, placed, locked, typed, each miss, the end); at 1366 × 768 it is 474 px wide throughout. The turning handle's touch area is 64 px. **The centre tolerance is 11 units** (about 9 CSS px at 360; about 25 px at 1366); the bottom-edge placement sits 24 units off, outside it. **vertex-off is named within 10 units of that bottom-edge pose** (gate 2: 14 to 34 units from O; about 8 CSS px at 360, about 23 px at 1366). The line under the board always keeps room for two lines on a phone, so the board does not move when the line changes.
  - Measure and draw angles are every 5° from 20° to 160°, never within 10° of 0, 90 or 180, and never a printed number at fades 1 and 2; a `measure` key is never 140 (gate 2: one typing slip reaches its other-scale number 1 time in 9). Half open clockwise (OA points left). At fade 1 the first arm lies flat or within 10° of flat; at higher fades it can tilt up to 50° either way.
  - Size angles run 20° to 150°, never within 10° of 90°.
- **Not checked yet:** on a real phone, or with a child. The 11-unit tolerance stands until it is tried on a phone (reversal: more than about 30% placement misses with no belief named).

## Every child-facing string

The lesson is in Hinglish (shown), Hindi or English; the game shows only the lesson's language. The figure's letters (A, B, O, P, Q) and the digits are the same in all three.

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header) | Kon | कोण | Angles |
| instruction, measure, before "Rakh do" | Protractor se ∠AOB naapo | चाँदे से ∠AOB नापो | Measure ∠AOB with the protractor |
| instruction, measure, after "Rakh do" | Scale padho aur ∠AOB ka number likho | स्केल पढ़ो और ∠AOB की संख्या लिखो | Read the scale and type the size of ∠AOB |
| instruction, draw, before "Rakh do" (size filled in) | Protractor se OA par ∠AOB = 130° banao | चाँदे से OA पर ∠AOB = 130° बनाओ | Draw ∠AOB = 130° on OA with the protractor |
| instruction, draw, after "Rakh do" | Kinare par 130° ka bindu lagao, phir jodo | किनारे पर 130° का बिंदु लगाओ, फिर जोड़ो | Put a dot at 130° on the rim, then join it |
| instruction, size | Kaunsa kon zyada hai: ∠P, ∠Q, ya dono barabar? | कौन-सा कोण ज़्यादा है: ∠P, ∠Q, या दोनों बराबर? | Which angle is more: ∠P, ∠Q, or are they the same? |
| end line, measure | Tumne 150° likha · jaanch: 1 | तुमने 150° लिखा · जाँच: 1 | You wrote 150° · checks: 1 |
| end line, draw | Tumne ∠AOB = 130° banaya · jaanch: 1 | तुमने ∠AOB = 130° बनाया · जाँच: 1 | You drew ∠AOB = 130° · checks: 1 |
| end line, size (key ∠P or ∠Q) | ∠Q zyada hai · jaanch: 1 | ∠Q ज़्यादा है · जाँच: 1 | ∠Q is more · checks: 1 |
| end line, size (key "Barabar") | ∠P aur ∠Q barabar hain · jaanch: 1 | ∠P और ∠Q बराबर हैं · जाँच: 1 | ∠P and ∠Q are the same · checks: 1 |
| spoken label of ← ↑ ↓ → (protractor, before the lock) | Protractor ko baayein / upar / neeche / daayein khiskao | चाँदे को बाएँ / ऊपर / नीचे / दाएँ खिसकाओ | Move the protractor left / up / down / right |
| lock button | Rakh do | रख दो | Place it |
| unlock button | Phir se rakho | फिर से रखो | Move it again |
| commit button, measure | Yahi hai | यही है | That's it |
| number pad, measure | 1 … 9, 0, ⌫ | same | same |
| spoken label of ⌫ | Aakhri ank mitao | आख़िरी अंक मिटाओ | Delete the last digit |
| spoken label of ↺ / ↻ (protractor, before the lock) | Protractor ko ghadi ki ulti disha mein ghumao / … ghadi ki disha mein ghumao | चाँदे को घड़ी की उलटी दिशा में घुमाओ / … घड़ी की दिशा में घुमाओ | Turn the protractor anticlockwise / clockwise |
| spoken label of ↺ / ↻ (the dot, draw) | Bindu ko ghadi ki ulti disha mein khiskao / … ghadi ki disha mein khiskao | बिंदु को घड़ी की उलटी दिशा में खिसकाओ / … घड़ी की दिशा में खिसकाओ | Move the dot anticlockwise / clockwise |
| join buttons, draw (order varies) | O se jodo · A se jodo | O से जोड़ो · A से जोड़ो | Join to O · Join to A |
| size buttons | ∠P · Barabar · ∠Q | ∠P · बराबर · ∠Q | ∠P · Same · ∠Q |
| undo button | Wapas | वापस | Undo |
| chips | 150° (her own number) · ∠O · ∠A · ∠P = ∠Q · ∠P · ∠Q | same | same |

"Rakh do" uses "do" as the verb "give/put", not the number two. Every spoken label is in the lesson's language with no number word. The game shows no feedback words: no "right", no "wrong", no hint text. The round "T" at the top is the teacher's avatar from the lesson shell, not part of the game.

## Gate 1 fixes (night rulings)

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11-night.md`, "kon/place: passes gate 1" (three fixes, and two minor ones in the same commit). Branch `claude/r8-gate1-place-tally`. Only the screens these change were retaken (360 × 640 at 2× pixel density; 1366 × 768 taken at 2× and scaled to 1×; RGB, no palette reduction); one is new (`measure-second-miss-played`). The gate-2 items (join-wrong-end's sign, the vertex-off tolerance) are not in this commit.

| Ruling | Change | Shots | Test |
|---|---|---|---|
| 1. A scale number not wholly on the board is not drawn | The view drops every number whose figures and halo do not lie wholly inside the board (`kon.scale.ts` `onBoard`), and with it the other number at its tick, so no scale is ever left numbered alone. Only her own placement can push numbers off the board (centre-on-arm); at rest nothing is dropped. The browser layout check no longer excuses a cut number on the centre-on-arm screens. | `measure-centre-on-arm-played-*`, `draw-centre-on-arm-played-*` | `tests/r8-games-kon-place.test.mjs` "gate 1, ruling 1": the real view on every generated measure and draw level (fades 1–3, six seeds), rest / placed / vertex-off / centre-on-arm, at 360 and 1366: no drawn number outside the board, none on one scale alone, and some centre-on-arm screen does drop numbers; `tests/r8-games-kon-layout.test.mjs` (browser): no `cut` fault on any screen |
| 2. Measure, wrong-scale: her arm stops inside the inner number ring; after two placed misses no arm | Her dashed arm now runs only as far as `innerReach` allows: short of where a three-figure inner number would stand at its heading, and 4 px short of any number it would meet (a slid one included); her arc shrinks with it where it must. The law counts her misses on a placed protractor (`placedMisses`, undone by "Wapas"); from the second the arm and arc are not drawn and her brown chip stays. | `measure-wrong-scale-played-*`, `measure-second-miss-played-*` (new) | `tests/r8-games-kon-place.test.mjs` "gate 1, ruling 2": every generated measure level where wrong-scale applies, at 360 and 1366: her arm's end is nearer the centre than every number it points at, no number lies on it; after a second miss no arm from her centre and her chip still drawn; undo returns the count |
| 3. Draw: the miss chip carries no number | The chip names the corner only: "∠O" or "∠A". Since the main loop's look (2026-11-15): the chip is set in the face of the board's point letters, not the mono face, where O read like a zero; the four draw `*-played` shots retaken. Held by the same test: the chip's text is drawn in the same face as the letters O and A (it failed on the mono chip). | `draw-vertex-off-played-*`, `draw-wrong-scale-played-*`, `draw-join-wrong-end-played-*`, `draw-centre-on-arm-played-*` | `tests/r8-games-kon-place.test.mjs` "gate 1, ruling 3": every generated draw level, every miss (four mal-rules and a plain miss), at 360 and 1366: the chip is drawn and no text but the scale's own numbers holds a digit |
| Minor: the rim dot is a hollow ring | The dot is stroked, never filled (2.5 px ring, radius 6), so the tick under it shows through, in every colour it takes (focus, the mix-up's brown, green at the end). | `draw-dot-*`, `draw-end-*`, `draw-end-after-miss-*`, the draw `*-played` shots | the same test: on every generated draw level the dot's circle is stroked and never filled |
| Minor: the resting protractor is wholly on the board | It rests 4 board px higher (`REST_Y` = PD + 8) and the generator serves only a rest whose every point stays 6 board px inside the board (`poseFits(rest, PR, REST_MARGIN)`; a tilted strip had met the bottom edge at 360). | `measure-initial-*`, `measure-turned-*`, `draw-initial-*` | `tests/r8-games-kon-place.test.mjs` "gate 1 (minor)": every generated measure and draw level at 360 and 1366: every line of the resting protractor at least 4 px inside the board, and every number it lays out drawn and on the board |

## Changes for round 3

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11-evening.md`, kon/place 1–6 (the judging of `6746c7d47`). All 56 screens were retaken (360 × 640 at 2× pixel density; 1366 × 768 taken at 2× and scaled to 1×; RGB, no palette reduction). Each ruling is held by a test: `tests/r8-games-kon-layout.test.mjs` (headless on every generated level, and in the browser on every served level and screen at both sizes) or `tests/r8-games-kon-place.test.mjs`.

| Ruling | What changed | Shots that show it | Held by |
|---|---|---|---|
| 1. A right number painted wrong | Her number is graded only on a placed protractor. On an off placement (vertex-off, centre-on-arm, or any other) the play-out shows the placement only: the ring on O and the dashed join to her centre, where the level names the mix-up. Her number's chip stays neutral whatever it is; no arm is drawn from her misplaced centre. The decision itself does not depend on the number (it never did; now it is pinned). In `draw` the miss still shows her own arm from O and the angle it makes (her own line, not a reading). | `measure-centre-on-arm-played` (150, neutral, ring and join only), `measure-vertex-off-played` (161, neutral, ring and join only); compare `measure-wrong-scale-played` (placed: her 30 brown, its arm and arc) | layout (browser): on measure's vertex-off and centre-on-arm screens only OA and OB are drawn, and her chip carries no meaning colour; place test: every generated measure level, three off placements, five typed numbers each: one and the same decision |
| 2. The letter O | O is placed after every line, clear of all of them by 4 px: every line of the protractor (rim, base, strip sides, bottom edge, ticks, centre mark), the arms and her lines, the arcs, the ring, the dots, the chips and the scale numbers. It keeps to the side away from the angle's opening and steps further out before it swings round. In `draw` it was on the wrong side (inside the opening, under the arc and the protractor's centre: missing on `draw-vertex-off-played`); now it is below. Placed, it sits just under the bottom edge; vertex-off, just under O on the edge. | `draw-vertex-off-played`, `measure-placed`, `draw-placed`, `measure-vertex-off-*`, `draw-centre-on-arm-played`, `measure-turned` | layout: headless on every generated level (fades 1–3, four seeds) in the rest, placed, vertex-off and centre-on-arm poses at both sizes, O has a spot clear of every protractor line, within 62 board px of its vertex; browser: O on every measure and draw screen, and no protractor line crosses its ink |
| 3. Numbers left out at 360 | A number is never left out of one scale alone. Where two numbers would come closer than 4 px, a number first slides along its own tick (inner inward up to 22 px, never onto the turning handle; outer outward up to 4 px), the least slide that parts them. Only where no slide does are **both** numbers at that tick left out (never 0, 90, 180). At 360 flat (fade 1): the tick of the outer 80 / inner 100 goes, both numbers. Turned, other numbers slide or other pairs go: in `measure-turned` (12°) the inner 180 slides 17 px in along the base, the inner 140 and 60 a px or two, and the outer 80 / inner 100 pair is left out. At 360 and fade 1 a turned protractor leaves out one or two pairs on most turns (the 20° print step is crowded on a 177 px protractor); at fades 2 and 3 nothing is left out at any turn, and nothing at 1366. Depends only on the screen size, the protractor's turn and the fade's print step, never on the key. | `measure-placed-360`, `measure-turned-360`, every 360 measure/draw shot | layout: headless every whole turn at every print step and both sizes: the ticks left out are the same on both scales, and as drawn every value v has as many 180 − v; browser: the same on every drawn screen |
| 4. Lines through the numbers | The scale numbers are drawn last, after the arms, her arm, her dot and the play-out lines, each on a ground-coloured halo (painter `text(…, { halo })`). OB through the inner 160 and outer 20 no longer hides them. | `measure-vertex-off-*-360`, `measure-placed`, `draw-end`, `size-*` | layout (browser): every scale number is drawn with its halo, and every arm is drawn before the first number (the audit's draw order) |
| 5. Placing with a finger | Four position nudges beside the turn arrows: ← ↑ ↓ → move the protractor by one board px (the law's own move act; no snap, no reading, no cue beyond the protractor moving). On a phone they share the turn arrows' row (six buttons). Spoken labels in the lesson's language. | `measure-initial`, `measure-placed`, `draw-initial`, `draw-placed` | place test: the four buttons, their direction and step, and a nudge moves the pose by exactly one board px; accessible labels in all three languages with no number word |
| 6. Words | "Rim par" → **"Kinare par 130° ka bindu lagao, phir jodo"**. Size's end line says what she found: "∠P aur ∠Q barabar hain · jaanch: 1", "∠Q zyada hai · jaanch: 2" (Hindi and English alike; "jaanch" lowercase after the dot, as kon/name's end lines). | `draw-locked`, `draw-dot`, `size-end`, `size-other-end-after-miss` | place test: the strings |

## Changes after judging round 2

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11.md` (kon/place 1–6, and the three laws). Each change is held by a test: the proof suite `tests/r8-games-kon-place.test.mjs` (every generated level) or the layout check `tests/r8-games-kon-layout.test.mjs` (every served level, every screen, 360 × 640 and 1366 × 768).

| Ruling | What changed | Screens |
|---|---|---|
| 1. Measure: she types the number | After "Rakh do" a number pad (0–9, ⌫); no tap prints a value (the band tap is gone); the typed number decides the scale (±2 of the scale whose 0 is on the placed arm is right, ±2 of 180 minus it is `wrong-scale`). | `measure-locked`, `measure-typed`, `*-typed`, `*-played` |
| 2. Draw: only her arm and "∠O x°" after a miss; nudges | The asked arm is never drawn; her arm (brown), its arc and chip only. ↺ ↻ move the dot 1° along the rim (arrows, so no scale is named). | `draw-*-played`, `draw-dot` |
| 3. Size: all three answers offered; no readings on a miss; tick clear of labels; any key; same numbers | New instruction "∠P, ∠Q, ya dono barabar?"; a miss shows only her pick in brown; "Barabar" solved shows "∠P = ∠Q" between the figures with the tick beside it; the generator makes each of the three the key a third of the time (the "bigger tool's angle is never the answer" rule is gone); both protractors print every 30° (fades 1–2). | `size-*` |
| 4. Scale evidence only where the outer scale is wrong; join-wrong-end at chance; button order | `wrong-scale` is discriminated (and listed first, so a first-try solve says "chose the right scale") only on levels where the outer scale is wrong; the two orientations are served equally (was 45/55). `join-wrong-end` is graded at chance weight (`chanceMis`, not on her record from one join; named on a repeat on another level, by the shared law-3 rule). The join buttons' order varies by level. | `draw-join-wrong-end-played` |
| 5. Mix-up colour; B label; instruction after "Rakh do"; checks at the end | Her wrong number or arm is brown, her selection blue-violet, green only when right; the finished arm carries B; the instruction changes after the lock; end lines count checks, and a solve after a miss has a pale tick. | `*-end`, `*-end-after-miss`, `*-locked` |
| 6. Tolerance; vertex-off kit wording | Tolerance unchanged (11 units). Learning split the kit entry: `vertex-off` is the bottom edge only (as the game already played it), and the new `centre-on-arm` (centre on an arm's end, or the corner on O) is named by the law, with the same ring-and-join play-out; the rule maps it with integration 49. | `*-centre-on-arm-played` |
| Law 1 (every family) | The handle and her dot/number are blue-violet (focus), not green; brown for her wrong value. The views name these by role (answer, focus, mix-up): the painter's `LAW_ROLES`, with the new blue-violet focus token. | all |

Also fixed while retaking: the vertex-off protractor's top numbers could be cut at the board's top edge on some mirrored levels (the generator now keeps the numbers' full height on the board), and the letter O stands a little further from the vertex so the vertex-off ring never touches it.

## Changes after the hold

Main held kon/place's judging on 2026-11-11 for three faults. All 54 screens were retaken after the fixes.

1. **Scale numbers ran together.** On the inner scale at 360, "80" and "100" touched ("80100") once the board shrank after "Rakh do". The lettering now works like this (`src/play/families/kon/kon.scale.ts`, one function used by both the view and the layout check):
   - The outer numbers stand where they did.
   - Each inner number now sits just inside the end of its long tick, however wide it is and however the protractor is turned. Before, every inner number stood at one fixed radius.
   - The inner 0 and 180 lie along the base, lifted just clear of the base line, where an arm runs.
   - If two numbers (outer, inner, or one of each) would still come within 4 px of each other at this screen size and turn, the fewest numbers that clear every such pair are left out. Inner numbers go before outer ones, and the ends 0, 90 and 180 always print.
   - (Superseded in round 3, ruling 3: numbers now slide along their ticks, or both numbers at a tick go together.) At 360 × 640 with the protractor flat at fade 1, only the inner 100 was left out. The inner 80 and the outer 100 and 80 still print at those ticks. On a protractor tilted 5–10° (some fade-1 levels), two or three inner numbers drop. At fades 2 and 3 a tilted protractor can drop the inner 150 or 30.
   - Nothing is left out at 1366, or on either size protractor. The two size protractors always print the same numbers.
   - Numbers stay as digits, at the 14 px floor.
   - The letters A, B and O also keep 4 px clear of every number. Before, O stood against the resting protractor's 80 ("80O"); now it takes the nearest clear spot around the vertex.
   - The three laws are untouched: a number left out depends only on the screen size and the protractor's turn, never on the key, and the cert's law check finds 0 breaks.
2. **The check now compares numbers with each other.** `tests/r8-games-kon-layout.test.mjs` checks every scale number's box against every other's (at least 4 px apart; a box is the number's advance width by its figure height):
   - Headless, on every generated level of `measure`, `draw` and `size` (fades 1–3, six seeds). It checks every pose a level serves (resting, placed, vertex-off, centre-on-arm; both size protractors) and every whole turn of the loose protractor. It runs at the world boxes of 360 × 640 and 1366 × 768 with the view's own layout function.
   - In the browser, on the served levels, every screen at both sizes, with the widths the browser measured. These are compared with the headless model (within 0.6 px), and the world box with the headless one.
   - Letters against numbers, the same way.
3. **The protractor changed size while she read.** At 360 the number pad added a third row of buttons after "Rakh do", and the protractor shrank from 213 px to 181 px (`measure`) or 178 px (`draw`). Now `measure` and `draw` keep a band of three button rows from the first screen on a phone (`src/play/play.css`), with the rows at its foot. The board keeps one box in every state: the protractor is 177 × 109 px at 360 and 474 × 291 px at 1366, on the first, placed, locked, typed, miss and end screens. The layout check asserts this for each goal at both sizes. Size (one row of three buttons) was already constant: 176 and 243 px at 360, 352 and 488 px at 1366.

**Centre-on-arm screens.** The check still exempts the protractor's own numbers cut at the board's edge (and the ring over its 0) on the centre-on-arm screens. Her protractor is centred on A, so part of it lies off the canvas at both sizes: it cuts 140, 160 and 180 at 360, and 160 and 180 at 1366. That is her placement, not the layout, and no layout of the scale can bring numbers back from beyond the screen's edge.

## Known issues still open

1. **`centre-on-arm` mapping** goes live with integration 49 (the kit id is on Learning's branch, not yet on the integration branch). The game names it already where a level maps it; the shots show it with that mapping.
2. **The protractor is 177 px wide at 360 × 640** (fixed after the hold: it no longer changes size, but it now has the smaller size in every state, where before only the first screen had about 213 px). The numbers stay at the 14 px floor. Reverse if children cannot read the 5° ticks at that size.
3. `kon/ends` (same family, not in this packet) was fixed to the laws too: its open-end light is green only when solved, the asked figure is no longer drawn after a miss, and `ray-two-ends` is at chance weight.

## Screenshots (56)

`<goal>-<step>-{360x640,1366x768}.png`:
- measure: `initial`, `turned` (round 3: the loose protractor turned 12°), `placed`, `locked`, `typed`, `vertex-off-typed`, `vertex-off-played`, `centre-on-arm-played`, `wrong-scale-typed`, `wrong-scale-played`, `second-miss-played` (gate 1: 30, then 140), `end`, `end-after-miss`
- draw: `initial`, `placed`, `locked`, `dot`, `vertex-off-played`, `centre-on-arm-played`, `wrong-scale-played`, `join-wrong-end-played`, `end`, `end-after-miss`
- size: `initial`, `wrong-pick-played`, `end` (level 1, key "Barabar"); `other-initial`, `other-same-played`, `other-end-after-miss` (level 2, key ∠Q)

Steps: `initial` is the first screen; `placed` the protractor in its right place, not yet locked; `locked` just after "Rakh do"; `typed` / `*-typed` a number typed, before "Yahi hai"; `dot` the dot on the rim; `*-played` just after the decision; `end` solved first try; `end-after-miss` solved at the second check (measure: after typing the other scale's 30; draw: after the wrong-scale arm; size: after a "Barabar" pick).

The 360×640 shots are at 2× pixel density; the 1366×768 shots were taken at 2× and scaled to 1× (colours unchanged). Levels (fade 1, as served): measure `kon-place:measure:150:180m`, draw `kon-place:draw:130:180m`, size `kon-size:105:105:B` and `kon-size:100:135:Bm`.
