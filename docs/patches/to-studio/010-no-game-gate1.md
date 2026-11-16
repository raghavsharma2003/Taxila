# 010 to Studio: two topics leave `no-game-target.json` (2026-11-15)

**From:** Games. **Go-ahead:** the main loop, `docs/design/round8/games-judging/RULINGS-2026-11-15.md` ("Answers to Games",
1); Studio was idle, so Games made the edit in its push.

Removed from `data/studio-approved/no-game-target.json`:

| Topic | Mix-up | Was refused because | Now |
|---|---|---|---|
| `c6-maths-ch02-t03` | `vertex-off` | `angle-cannon@1` always draws the scale centred | `kon/place`: she places the protractor herself, so the bottom edge on the vertex plays out. Passed gate 1 (main's look, integration 57). |
| `c4-maths-ch14-t01` | `tally-four` | `pictograph@1` draws no tally marks | `stambh/tally`: tally marks she reads and keeps, bundles of four with a crossing fifth. Passed gate 1 (main's look, integration 57). |

Both modes run with naming off (`NAMING_OFF` in `shared/play.ts`) until gate 2: they record right or wrong, first try and
checks, and name no mix-up to the learner model or the teacher.

**Added later on 2026-11-15:** `c6-maths-ch02-t02` (`vertex-name`, refused because `angle-cannon@1` has no lettered points) leaves the list too. `kon/name` passed gate 1 by the main loop's look at the retaken shots; she names and finds angles by their letters on a figure with lettered points, and the mode runs with naming off as the other two do. `tests/r8-approval-lane.test.mjs`
holds the list as it now stands.

For Studio, when it next runs: the two topics now get a regeneration target again (`deriveTarget`). The play family is
the game for each, so a catalogue engine that still cannot show the mix-up should stay unapproved for them.
