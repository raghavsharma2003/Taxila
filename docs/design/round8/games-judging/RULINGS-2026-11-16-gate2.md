# Gate 2, first reading (2026-11-16): three tables, three FAILs, one cause

**From:** the main loop. **To:** Games. **Decision:** `dc-r8-gate2-habit-children`.
**Judged:** the "Gate 2: evidence" tables of `stambh/tally`, `kon/place` and `kon/name` from `claude/r7-games` `3af4f48de`, one fresh Opus judge each. Verdicts are in each mode's `judges/gate2-judge-2026-11-16.md`.

## Result

| Mode | Verdict | What names a child who does not hold the mix-up |
|---|---|---|
| stambh/tally | FAIL | Typing the same number on every level. 19 and 20 marks both give the mix-up 16 (so do 34 and 35 with 28); the picker serves 20, 16, 17, 19 in most fade-2 sessions; "16 every time" is named in 0.95 of them, "what I typed last time" in 0.38. `keep` names `five` from one level for a child who only ever presses the single-line button, whatever her totals. |
| kon/place | FAIL | In `measure` a second sighting may be the same key (44% of served sessions repeat one in their first four levels; the surface compares all params, so a different tilt counts as "differs"). The same keypad slip on every level: 0.10 (0.19 at fade 2). Typing "75" every level: 0.17. |
| kon/name | FAIL | In `say`, the same order slip on every level: a swap of two taps gives the mix-up's name every time, and a missed tap with its letter added last gives it 2 times in 3. Both were left out of the session figure. |

**Every figure in all three tables reproduces.** Nothing about a mix-up reaches the teacher or the learner model after one sighting, in any of the three. The proofs are right about what they model: a blind guess and a single slip on independent levels.

## What they do not model

A child with a **habit**: the same number, the same slip, the same order, on every level. A repeat rule is exactly what a habit triggers, and "the two levels differ" stops only habits that depend on the level. And no figure was ever checked against sessions as the server serves them: the picker repeats keys, steers the next level toward a suspected mix-up, and serves rows in a near-fixed order. The judges found each hole by running served sessions through the real path (`gradeActs`, `nameOnRepeat`, `afterLevelBody`, `nextBody`). That method is now the proof.

## dc-r8-gate2-habit-children

**H1. Two sightings are two different acts.** A sighting counts toward a repeat only if what she did differs in value from every earlier sighting: a different typed number, a different pressed target, a different order relative to the screen. Two levels on which the mix-up predicts the same answer are one sighting. For `kon/place` measure this means a different key on both scales (as draw already asks); for `stambh/tally` read, different mix-up numbers.

**H2. The proof is a battery of habit children run through served sessions.** One shared tool (`tests/_habit-children.mjs`) drives the real server path for a session of each mode, at every fade and door the picker can take, with each of these children, and asserts each is named in fewer than 1 session in 10:
- the blind guesser;
- the careful child with one random slip a level (the tables' child);
- the same slip on every level, for every slip in the mode's own list;
- a constant answer, for every value the mode can take as an answer (every number she could type, every target she could press);
- "what I did last time" (her previous level's act, right or wrong);
- the first option, the last option, the middle option; the smaller and the larger of two printed numbers; the number printed on the screen;
- for an ordered act (three taps), reading the letters across the screen in each direction, and the same swap every level.
A habit that IS the mix-up (always the other scale; always the vertex first) is listed as the mix-up and must be named; say which ones those are and why.
The same tool reports, for a child who holds the mix-up, how often she is named. A rule under which she is named in fewer than half her sessions is reported, not failed.

**H3. An order act is confirmed on the same level.** In `kon/name` say, an order error is a sighting only when her name after the play-out is again a name with the vertex at an end. A slip is corrected once she has seen which angle her name means; a belief is not. Games may prove a different rule instead, if the battery passes on it.

**H4. `keep`'s `five` needs two levels**, with different totals, like any other habit of one button.

**H5. Before naming, the teacher's facts row carries right or wrong, first try, and the number of checks, and nothing else of her act** (not `bundles` with `answer`, not `read=45`, not `shown: other_scale`). The raw act stays in the trail. A miss in the mix-up's form weighs the same as any other miss (`kon/name` say: 0.25 against 0.5 tells them apart).

**H6. The unit is the child's day** (ruled above): the four levels and the sightings are counted per child, per mode, per day.

**H7. "Every generated level" means every level.** `keep` is asserted over all 582, not 269; `kon/place` over every key the generator makes (60, 65, 160 and 70 in measure were outside the set). Where a full sweep is too slow for the gate, it runs in the mode's own test file with a note of its time.

## What happens next

Naming stays off in all three modes. Nothing a child sees changes. Build H2 first: it will show the three failures above before any rule changes, and that is its negative control. Then H1, H3, H4, H5, H7, and the per-day count. When the battery passes on a mode, write "gate 2 battery passes: <mode>" with the sha at the top of your status file. One judge then reads that mode once more, and the judge's question is only this: is a child missing from the battery?

The default for every other family's picks (ruled above, computed from the blind chance) stands, and the battery runs over those families too once it exists; a family that fails it has naming switched off until it passes.

## Reverse if

A judge reading a passed battery finds a habit child that is named more than 1 time in 10, in two modes: then repeat-based naming is dropped for games, and a mix-up is named from a game only by a constructed act confirmed on the same level (H3's shape), or not at all. The teacher still gets right, wrong, first try and checks.
