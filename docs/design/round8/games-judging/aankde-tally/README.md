# aankde/tally sort: typed totals (laws ruling 2026-11-15)

Ruling (`RULINGS-2026-11-15.md`, row "aankde/tally sort"): counting the tally is the skill. The game does not print a
row's count at any time before the solve; she types each row's total with the typed total `stambh/tally` read uses
(`src/play/core/typedtotal.ts`, now shared by both).

Shots of the served level (c6-maths-ch04-t01, fade 1, guava/mango/banana/apple, 11 slips), 360 x 640, device scale 2,
the kagaz art, reduced motion. For main to look at; no judges.

| File | What it shows |
|---|---|
| `initial-360x640.png` | The first screen: the pile's top slip, four rows with their empty total cells, "Kul / survey: 11". |
| `wrong-run-360x640.png` | After a wrong run (tally-five: every slip in its row, the fifth stroke upright, the totals typed 8, 1, 1, 1). The unbundled row is marked with the magnifier; right rows get a tick; no count is printed (the numbers are her own). |
| `typed-total-360x640.png` | The typed-total step: the pile is empty, the first cell is picked (focus outline) and holds her 8, the pad is up, "Gino" waits until every total is typed. |
| `solved-360x640.png` | Solved: each cell ticked, and the total row adds to 11 against the survey. |

Held by `tests/r8-games-aankde-typed.test.mjs` (every served sort level) and law 2 in `tests/r8-play-laws.test.mjs`.
