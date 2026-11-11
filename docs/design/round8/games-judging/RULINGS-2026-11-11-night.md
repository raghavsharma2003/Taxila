# Game modes, judging of 2026-11-11 (night): rulings, and a change to the gate

**From:** the main loop. **To:** Games. **Decision:** `dc-r8-game-gate-play-then-evidence`.
**Judged:** `stambh/tally` (round 4), `kon/name` (round 3) and `kon/place` (round 3) from `claude/r7-games` `e26cc539d`, two fresh Opus judges each, 111 screens. Reports are in each mode's `judges/` folder.

## Result

| Mode | Judge 1 | Judge 2 | What blocked |
|---|---|---|---|
| stambh/tally | FAIL | FAIL | The record: the `read` goal can name the mix-up from an ordinary slip (two slips together; a neighbouring key on the pad) |
| kon/name | FAIL | FAIL | One thing the child sees ("≠" between two angles that are equal in size); and the record (a "tap a small arc" shortcut that beats chance) |
| kon/place | PASS | FAIL | The record: `sign=join-wrong-end` reaches the teacher from one press of one of two buttons |

Every ruling from the last round is done on the screens in all three modes. No judge found a wrong key, a wrong scale, an answer given away before she acts, a colour that says right over a wrong thing, or the key left on screen after a miss.

## What today's rounds show

Across five judgings today and 20 verdicts, the faults a judge blocks on have moved from what the child sees to what the game records about her. In this round four of the five failing verdicts block on the record. Each round a fresh judge finds one more way an ordinary slip can look like the mix-up, and the level law is widened by that case. That will not converge: a law built from found cases stays one case behind (`fd-slip-sets-found-by-judges-not-by-law`), and the modes stay away from children for a reason that does not touch the child who plays.

So the gate is split in two.

## dc-r8-game-gate-play-then-evidence

**Gate 1, play.** A mode is shown to children when two fresh judges pass everything the child sees and does: facts, words against picture, readability and reach, language, nothing given away before she acts, no passing by trial without it showing, fit for her class, a true end screen, law 1 (green only for right) and law 2 (no key on screen after a miss). A mode shown on gate 1 alone runs with **naming off**: it records right or wrong, first try or not, and the number of checks, and it names no mix-up to the learner model or the teacher.

**Gate 2, evidence.** Naming is switched on for a mode when its evidence rule is proved, not when a judge fails to break it: the mode names a mix-up only on a repeat (the mix-up's own answer on two levels whose numbers or figures differ), or from a constructed act whose chance under a blind guess and under any single slip is worked out and is under 1 in 10. The proof is a table in the packet and an assertion over every generated level; one judge reads the table.

**Law 3 gets its number:** an act that a blind guess or one ordinary slip produces more than 1 time in 10 names nothing by itself.

Naming off is a property of the mode in the play rules (one flag), so turning it on later changes no screen.

**Reverse if:** a mode shown with naming off teaches something wrong that a judge's evidence finding would have caught (a child or a judge shows the play-out itself misleading because of the same hole): then that mode goes back behind both gates. Or, if after gate 2's proof a judge still finds a single-slip route in two modes running: then naming needs a repeat in every mode, with no constructed-act exception.

## Where each mode stands

**kon/place: passes gate 1.** Both judges pass every child-facing item; judge 2's only blocking fault is the record. It is shown with naming off once these three are fixed and proved by test (I will look at the retaken shots myself; no further judging round for gate 1):
1. A scale number that is not wholly on the board is not drawn (a cut "140" reads "40", a cut "160" reads "0").
2. On a wrong-scale miss in measure, her dashed arm stops inside the inner number ring so it cannot be read off the other scale at the key. After two placed misses her arm is no longer drawn (it had become a too-high, too-low guide).
3. In draw, the miss chip carries no number. Her arm lies across the placed protractor and she reads it herself.
Minor, same commit: the rim dot is a hollow ring so the tick shows through; the resting protractor is wholly on the board.
For gate 2: nothing reaches the teacher from one join press (the packet says the sign does; make the code and the packet agree with law 3), and give the tolerance that names vertex-off.

**stambh/tally: passes gate 1 after two fixes.** Both judges pass every child-facing item except the number line.
1. The number line has one scale for the whole level, set from the level and not from her number or the key (a bigger number never moves left). 
2. In read's largest case the second line's count digits stand clear of the first line's strokes.
Shown with naming off after those, proved by test and my look at the shots.
For gate 2: stop listing slips. `keep` may name from one level (both judges: its two totals together need three slips). `read` names tally-four only when the mix-up's number is typed on two levels whose bundles and loose lines both differ. Put the two-level rule and its arithmetic in the packet.

**kon/name: gate 1 not passed.** One thing the child sees is untrue: "∠APO ≠ ∠OAP" where the two angles are equal in size, because the rays are equal and the triangle is isosceles.
1. No two angles of a figure are within 8° of each other in size (rays of different lengths; asserted on every level), so the row is true whether she reads "≠" as "a different angle" or "not equal".
2. `find` keys are spread evenly over all five arcs, the wide one included, asserted over the generator; the chance weight is then 1 in 5 and no "small arc" shortcut exists.
3. The "≠" row and the name chip keep one letter height clear of every letter at 360.
4. The dashed ray beside a solid line is offset enough to be seen at 360.
Then two fresh judges on gate 1.
For gate 2: in `say`, a vertex-first or vertex-last name is named on its second occurrence (three random taps produce it 1 time in 6, over the 1 in 10 line); a first fade-1 solve with O at the vertex is fade-weighted.

## Also

- The lime action button beside green ticks (both tally judges, third round running): finish Design's patch 002 so the action colour is outside the green family in both looks. It is not a gate 1 blocker (it never marks a value), and it has now been deferred twice.
- Tell Studio which topics leave `data/studio-approved/no-game-target.json` as each mode passes gate 1.
