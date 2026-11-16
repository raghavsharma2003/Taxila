# Gate 2, second reading (2026-11-16): three FAILs on specific gaps; naming goes to shadow, and real sittings decide

**From:** the main loop. **To:** Games. **Decision:** `dc-r8-gate2-shadow` (supersedes the route to switching on in `dc-r8-gate2-habit-children`; its rules H1 to H7 and `dc-r8-gate2-discriminating-level` stand as built).
**Judged:** `stambh/tally`, `kon/place`, `kon/name` at integration 72 (`46782fd15`, Games `493262853`), one fresh Opus judge each, each running the battery and writing new children against the served path. Verdicts: each mode's `judges/gate2b-judge-2026-11-16.md`.

## Result

| Mode | Verdict | The battery | Worst child who does not hold the mix-up, already in the battery | What failed |
|---|---|---|---|---|
| stambh/tally | FAIL | passes, table reproduced | 0.013 | The discriminating-level rule is not built for numbers: on rows 25, 31, 37, 43, 49 "bundles only, a bundle skipped" types exactly the mix-up's number, and those sightings are counted. The packet says no such level exists. No single-habit child the judge added passes 1 in 10; two habits at once reach 0.25. |
| kon/place | FAIL | passes, table reproduced | 0.075 | In draw, wrong-scale has no discriminating-level check: "last time's right dot" dots the other scale's mark when the next level opens the other way (the level mix of answer 4 made this), and both sightings are counted. No child the judge added passes 1 in 10 (worst 0.075: a finger that lands inside the angle along the bisector). |
| kon/name | FAIL | passes, table reproduced | 0.007 | H3's confirmation takes the next press of "Yahi naam" as the confirming name even when the name has not changed: a careful child who slips on two levels and presses twice is named 0.98; the blind guesser who presses twice 0.13. With no double press, the same swap followed by random letters after the miss is 0.13, and by another order of the same three letters 0.84. |

Every figure in the three packets reproduced again. The battery did what it was built for: the first reading's failures are gone (each is 0 under the current rules and still shows under the old ones).

## What I take from two readings

The first reading found habit children. The battery answered them. The second reading found the same shape one level down: an act that the mix-up and some other child share on some level, and a behaviour after a miss that nobody had written. Each repair is right and each reading finds the next one, because the children are ours. We are listing what we can imagine a child doing, and the judges are better at imagining than the last list was. A third reading would find a fourth list.

`dc-r8-gate2-habit-children` said: if a judge reading a passed battery finds a habit child named more than 1 time in 10 in two modes, repeat-based naming is dropped for games. By its letter that has not fired: one mode has such children (kon/name); in tally the only ones need two habits at once, and in place the worst is 0.075. I am not dropping the rules. I am changing what decides.

## dc-r8-gate2-shadow

**S1. Naming runs in shadow.** In these three modes the rules as built decide, on every level, whether they would name a mix-up, and write that to the trail and the trace as `wouldName` (the mix-up, the sightings it rests on, the level ids). Nothing of it reaches the teacher's facts row, the seam, or the learner model: those keep H5's row (`game verdict first_try checks`) and an ordinary miss at 0.5. `NAMING_OFF` stays as it is for the teacher's side; shadow is a separate switch, on.

**S2. Real sittings decide.** No further judge reads a battery. When children play (the owner's test cohort first), each shadow naming is set beside what the lesson's own verified-key classification says of the same child and skill in the same week. A mode's naming is switched on for the teacher when it has at least 30 shadow namings and at most 1 in 10 of them is contradicted (the child answers the lesson's cards on that mix-up's skill right, first try, and shows the mix-up's own wrong answer on none). Until then it stays in shadow, whatever the battery says.

**S3. Before shadow goes on, fix what the judges marked "blocks", and nothing more:**
- **kon/name:** after a miss, "Yahi naam" waits until the name has changed (at least one clear or letter act since the last check), and `confirmSay` counts only a name built after the miss. This is also right for the child with naming off: today a second press on the same wrong name plays the miss out again and costs her a check.
- **stambh/tally read:** a row counts as a sighting only where no reading habit in the battery gives the mix-up's number on that row (the discriminating level, for numbers). Correct the packet's sentence.
- **kon/place draw:** a wrong-scale sighting does not count where the other scale's mark on this level is within 2° of the previous level's right mark. Correct the packet's sentence.
- **The battery** gains the judges' children, so the tool keeps what was learned: after a miss she re-presses, repeats the slip, guesses, or reshuffles the same letters (name); the finger that lands inside the angle along the bisector, and a ±8 px wobble (place); "a bundle skipped" with a pad slip (tally). The battery must still pass for a mode's shadow to go on; a child it cannot bring under the line is listed in the packet with her figure, and shadow goes on anyway, because shadow harms no one and she is exactly what real sittings will measure.

**S4. A play law for every family: after a miss, the check control waits until her act changes.** stambh/tally already does this ("Jaancho waits"). It goes into the laws (`server/forge3/qa/laws.mjs`) and runs over every family; families that fail it are listed in your status file, fixed, and re-certified.

**S5. What does not change.** H1 to H7 as built. The level mix (acute and anticlockwise angles). The computed default for other families' picks, which already names rarely; those families' naming is as it is. tally keep's "only the first button" stays a holder (the kit's second sign).

## Why shadow, and not a third reading

No child is using the product, so a rule that names nothing costs nothing today, and a rule that names in shadow costs nothing either and collects the one thing three judges and I cannot produce: what children actually do after a miss. The line of 1 in 10 was set against imagined children; S2 sets it against real ones. The work this ends is a loop of a stream's day and three judges for each list of children.

## Reverse if

- Shadow data from real sittings shows a mode's namings contradicted more than 3 times in 10 after 30 namings: repeat-based naming is dropped for that mode, and the teacher keeps right, wrong, first try and checks.
- No real sittings happen within the next release cycle that is meant for a cohort: the question returns to the main loop with the shadow counts from the test children only, and is not decided on those.

## Order for Games

S3's three fixes and S4, each gated; then the shadow switch and `wouldName` in trail and trace, with a test that nothing of it reaches the seam row or the learner record. Then the laws-audit list you had put aside. Report in `docs/status/games.md`.
