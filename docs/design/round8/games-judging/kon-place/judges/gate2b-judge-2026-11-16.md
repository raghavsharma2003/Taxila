VERDICT
FAIL

The battery passes, and no child I added is named in 1 session in 10 or more. It fails on D: a battery child gives the mix-up's act on two served levels and both sightings are counted. In draw, wrong-scale is not checked for a discriminating level at all.

**A. The battery.** Both sweeps pass, 9 of 9 tests (gate sweep 113 s; `HABIT_FULL=1` 298 s). The full table I printed matches the packet's line for line.
- **Worst non-holder, measure:** 0.005 by fade ("placed right, any number", wrong-scale, fade 2); 0.011 by door sequence (ggt).
- **Worst non-holder, draw:** 0.075 by fade ("last time's right dot", wrong-scale, fade 3); 0.050 by door sequence ("the right dot, either button", join-wrong-end, ggg).
- **Gate sweep:** measure 0.010 / 0.014; draw 0.047 / 0.056.
- **Negative control still fails under the old rules:** constant 75, 0.398 (fade 2); first key one row low, 0.166; drop 20 up, 0.934 (measure) and 0.981 (draw). All are 0 under the current rules.

**B. Children in the battery.**
- **Measure:** careful; blind; placed right with any number; one random slip; every typing slip (40 kinds); ticks ±5 and ±10; 48 fixed drops; 4 drops with a ±4 wobble; the finger held where the bottom edge sat on level 1; turns ±1 to ±3; constants 0 to 180; her last number; last level's right number; the printed number nearest the right reading, the outer reading and the inner reading; locks where it rests. Listed as holders: smaller, larger, outer, inner, other scale, vertex-off, centre-on-arm.
- **Draw:** careful; blind; any dot; either button; one random slip; dot ±1, ±5, ±10; 48 drops; wobbles; the fixed finger; constant dots; first, last and O button; her last dot and button; last level's right dot; the printed number nearest the size; rest. Listed as holders: outer, inner, other, always 'A se jodo', vertex-off.

**C. Children the battery lacks**, run through served sessions at every fade, pL and door sequence: 10 sessions a cell, 30 for random children. Scripts are in `<scratch>/judge-games8/work-kon-place/`.

| child | in the battery already? | share named, worst fade (worst door sequence) | under 1 in 10? |
|---|---|---|---|
| last time's right dot (draw) | yes | 0.075 f3 (0.025) | yes, but it is D's counted pair |
| measure: lands 18–26 into the angle, along the bisector | no | 0.075 f3 (0.050), vertex-off | yes |
| a drop that misses on every level (r=30) | no | measure 0.031 (0.044); draw 0.037 (0.036) | yes |
| fixed drop 16–28 in 8 directions, ±8 wobble (64 children) | no (battery: ±4, two offsets) | worst 0.024 draw (0.031) | yes |
| drag undershoot 16–28 toward where it rested | no | 0 | yes |
| centre on the letter O | no | 0 | yes |
| any number or dot after her first miss | no | 0.001 | yes |
| careful with two slips a session | no | 0 | yes |
| last level's whole solve (pose and number or dot) | no | 0 | yes |
| last level's turn; last level's other-scale number | no | 0 | yes |
| the printed number lowest on screen (nearest the pad) | no | 0 | yes |
| draw: last level's size on the right scale; last dot's screen direction; last dot with the button in last time's place | no | 0 | yes |
| join: first then last in turn; the letter nearer the dot | no | 0 | yes |
| holders of a different mix-up (cross-naming) | yes | 0 | yes |
| right and the other scale in turn | no (half a holder) | 0.93 / 0.96 | not a non-holder |

**D. The two new rules.**
- **H1 works** (a second sighting must differ in value from the first): constant children score 0, fixed drops score 0, and "last time's right number" in measure is blocked by the key-on-both-scales surface.
- **The discriminating-level rule is not built for wrong-scale.** It exists only for vertex-off (`discriminatingPair`) and kon/name say.
- **A counted pair, found by searching every non-constant battery child's named sessions** (`pair-search.mjs`):
  - **The session:** draw, "last time's right dot", fade 3, pL default, doors ggg, child hb6.
  - **Level 2** (θ=120, opens clockwise): she dots 120, last level's right rim mark. The holder also dots 120. Counted as sighting 1.
  - **Level 4** (θ=115, opens anticlockwise): she dots 65, the holder dots 65. Both sightings are counted and she is named.
- She is named in 24 of 960 sessions, and at the same 0.075 under the old rules, so H1 does nothing for her. Answer 4's anticlockwise level is the switch in opening that turns her copied dot into the other scale's mark.
- The packet's claim that "no child who does not hold them acts as them on served levels" is contradicted by this row of its own table.

**E. Holders named** (share of sessions, full sweep):
- **Measure:** other scale 1.000, outer 0.963, smaller 0.915, vertex-off 0.924.
- **Draw:** other 1.000, outer 0.983, vertex-off 0.932, 'A se jodo' 0.600.
- **Effectively never named:** "always the inner scale" (0, both goals), "always the larger number" (0.063), and centre-on-arm (0, because the coverage does not map it).

**F. After one sighting** (naming on, and as served): the facts row carries `read=135`, `made=45°`, `placed=off centre_px=24` and `made=20°` (after a join to A). The moment carries `shown: other_scale`, `centre_off` or `far_end`, and `nextFocus` steers the next level toward the mix-up. Nothing is named: the trail's mal is empty and the evidence row is an ordinary miss at weight 0.25.

**Faults**
1. **Blocks:** draw wrong-scale counts sightings on levels where a battery child ("last time's right dot") gives the same act. The fix is a level check, then a re-run:
   - a sighting does not count where the other scale's mark on this level is within ±2 of the previous level's right rim mark;
   - or the picker does not follow a level with one of the opposite opening and the size's supplement.
2. **Should fix:** vertex-off's pairing lets a habit fixed to the figure through. A child who lands 18–26 inside the angle reaches 0.075 at fade 3. Add her to the battery.
3. **Should fix:** the packet's sentence about wrong-scale and join-wrong-end needs to be corrected to match its own table.
4. **Minor:** the wobble children cover only ±4 px on two offsets; a ±8 hand peaks at 0.024.
5. **Minor:** "larger" and "smaller" are counted as holders. That is defensible from the kit's signs ("a reading over 90 for a narrow angle"; "two readings add to 180"), but it removes two of H2's named children from the non-holder check.

**What to watch after the fix, with real children.** Children copying the previous level's dot or number, since the level mix of answer 4 makes copies look like the other scale. Real thumb-drop spread and direction, and whether drops lean toward the angle's opening, against the 10-unit band. How often "always inner" and "always larger" children are seen and never named. Sessions restarting within a day, which reset the four-level count.