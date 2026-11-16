# nazariya/tri: Gate 2 battery (2026-11-16)

**Why.** `RULINGS-2026-11-16-gate2-answers.md`, answer 2 under "a computed default for every family's picks": add exact `pickOptions` family by family (`nazariya/tri` apex cells second), and run the habit battery over each family as it is added. A family that fails the battery has naming switched off until it passes. This file is the mode's packet section (there was no tri packet; the family has several modes, so the folder is the mode's).

**Status.** nazariya/tri names today (it is not in `NAMING_OFF`). It still does after this pass: the battery passes on `more`, the mode's one pick.

- Nothing a child sees changed: after a miss the level already waits for her next corner.
- No served level changed: 64,800 served bodies hash the same before and after, `proof.discriminates` included. So there is no re-cert.
- `box` and `match` are not picks. Their mix-ups (lxb, slant-side) come from a laid floor or rectangle, a constructed act named from one level, and they are not in this battery (question for main in `docs/status/games.md`).

## The pick and its exact options (`triLogic.pickOptions`, `triPickOptions`)

`more`: she puts tent B's top corner on a grid point, then checks. Every point the law takes is an option: 0 ≤ x ≤ w, above the base (0 ≤ z < zb), (w + 1) × zb of them. shape-looks shows on the w points of A's top line other than A's own corner. So p = w / ((w + 1) zb).

The old default replayed the family's acts, which saw two options (the mix-up's point and the solve's), so it read p as 1/2.

p and k before → after, over every generated level (each coverage entry × fades 1–3 × 20 seeds × no focus and the mix-up as focus):

| Pick | Levels | Options | p before | k before | p after | k after |
|---|---|---|---|---|---|---|
| more:shape-looks | 2,028 | 39 to 117 | 1/2 | 4 | 0.103 to 0.308 | 2 (1,389 levels), 3 (639) |

## What the battery found, and the two rules built

With the exact k, the battery (`tests/r8-habit-battery-nazariya-tri.test.mjs`, `tests/_habit-children.mjs` with `cellIds`) showed what the old k had hidden only partly. The careful child's point is one row above A's top line, over the base's middle, and it has three neighbours ON A's top line. So:

- one random slip a level was named 0.32 (worst fade) and 0.40 (worst door sequence);
- the same slip every level (down, down-left, down-right) 0.9–1.0;
- a constant point up to 0.33 by door;
- last time's right point 0.17 by door.

Under the old k (4) the same slips every level were already named 0.59–1.0. The mode failed before this pass too.

Built (both are the gate-2 modes' own tools; `HABIT_RULES` gates both, so the battery's `legacy` is the negative control):

- **H1: two sightings are two different acts** (`triLogic.sightingOf`). The value is the grid point she put the corner on, and the same point twice is one act. This catches a constant point and "what I did last time".
- **H3's shape: confirmed on the same level** (`tri.logic.ts confirmMore`). A sighting counts only when her next corner after the play-out, which shows the two cloths the same, is again on A's top line off A's corner. A slip is corrected once she has seen the cloths come out equal; a belief is not.
  - Unconfirmed, the row is a plain miss at the game weight, with no `chanceMis`. (A miss is not luck; `tests/r7-games-chance-weight.test.mjs` asserts it.)
  - `malActs` for shape-looks now carries the holder's confirmation (the corner slid to the base's other end on A's top line, checked again). `pickOptions` carries the same acts after every option, so p is still read from the first pick.
  - The discriminating moments (`proveLevel`) are unchanged, so served levels do not change.

**Result: every child who does not hold the mix-up is named in fewer than 1 session in 10** (worst fade pooled over pL, doors and seeds; worst door sequence pooled over fades).

| Sweep | Worst non-holder, worst fade | Worst door sequence | Holders |
|---|---|---|---|
| before (old k, no H1 or confirmation) | 1.000 (the same slip every level: down) | 1.000 | 0.995–0.997 |
| exact k, no H1 or confirmation | 1.000 (same) | 1.000 | 0.995–1.000 |
| after, gate (2 a cell; about 18 s) | 0.005 (blind, any point above the base, fade 3) | 0.014 (same, tgg) | 0.995 / 1.000 / 1.000 |
| after, full (`HABIT_FULL=1`; about 2 min) | 0.004 (blind, any point on the plot, fade 3) | 0.008 (same, ggt) | 0.998 / 0.998 / 1.000 |

**The children.**
- **Careful:** the solve; straight above A's corner one row higher; any point above A's top line.
- **Blind:** any point above the base; any point on the plot (below the base is refused). Each guesses again after a miss.
- **Slips:** one random slip a level (a neighbour of the careful point). The same slip every level, each of the eight neighbours. A careful child who aims anywhere above A's top line and lands one point off the same way every level, each of the eight.
- **Constants:** every point of the 13 × 9 grid, 117 of them.
- **Memory:** what I did last time; last time's right point.
- **Positions:** the first option (top-left), the last option (the right end, one row above the base), the middle option, and the base's middle as high as the plot goes.
- **Holders:** on A's top line over the base's middle; over the base's other end; anywhere on it but A's corner. Each puts it on A's top line again after the play-out.

**Answer 3:** no child with no randomness in her acts has a cell at 0.5 or more, in either sweep. No non-holder child is named at all except the two blind guessers.

The full table (`HABIT_FULL=1`: ten sessions a cell, thirty for a random child, four for each constant over every pL):

| goal | child | holds | mix-up | named (all sessions) | worst fade | worst door sequence | worst cell |
|---|---|---|---|---|---|---|---|
| more | blind: any point above the base (and again after a miss) (random) |  | shape-looks | 0.001 (n 2880) | 0.001 (fade 2) | 0.003 (tgg, n 360) | 0.033 (f2 pL0.6 ttt, n 30) |
| more | blind: any point on the plot, below the base refused (and again after a miss) (random) |  | shape-looks | 0.003 (n 2880) | 0.004 (fade 3) | 0.008 (ggt, n 360) | 0.033 (f1 pL- tgg, n 30) |
| more | the mix-up: B's corner on A's top line, over the base's middle | **holds** | shape-looks | 0.998 (n 960) | 1.000 (fade 2) | 1.000 (ggg, n 120) | 1.000 (f1 pL- ggg, n 10) |
| more | the mix-up: B's corner on A's top line, over the base's other end | **holds** | shape-looks | 0.998 (n 960) | 1.000 (fade 1) | 1.000 (ggg, n 120) | 1.000 (f1 pL- ggg, n 10) |
| more | the mix-up: slides the corner along A's top line, anywhere off A's corner (random) | **holds** | shape-looks | 1.000 (n 2880) | 1.000 (fade 2) | 1.000 (ggg, n 360) | 1.000 (f1 pL- ggg, n 30) |
| more | constant answer (117 values) | | shape-looks | 0 (n 384 each) | 0 | 0 | 0 |

Children not listed are named in no session. The session is still the unit, not the child's day (H6, kept for the first real cohort).
