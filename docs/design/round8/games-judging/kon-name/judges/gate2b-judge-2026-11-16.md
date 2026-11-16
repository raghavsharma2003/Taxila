VERDICT:
FAIL

**A. The battery.** The full sweep (`HABIT_FULL=1`) passes 8 of 8 tests in 129 s and matches the packet's table exactly. The negative control still shows the old failures: under the old rules the swap, missed-tap and reading-across children are each named in 0.9 or more of their sessions. Worst child who does not hold the mix-up:
- `say`: 0.007 by fade (blind guesser, fade 2) and 0.008 by door sequence (ttg).
- `find`: 0.005 by fade (blind tap, fade 2) and 0.008 by door sequence (gtg).

**B. Children in the battery.**
- `say`: careful; blind with no repeated letters, and blind with repeats (both guess again after a miss); one random slip a level; each of 11 slips on every level; 64 constants; "the same taps as last time"; reading across in 8 directions; starting at the first, last or second letter on screen. Holders: vertex first, vertex last, any order. Every non-holder does the solve after a miss.
- `find`: careful; blind; one random slip a level; 24 fixed finger offsets; 5 constants; last arc; leftmost, rightmost, topmost, bottommost and middle arc; smallest, largest and middle-sized angle; the arc inside the triangle. Holders: first letter, last letter.

**C. Children it lacks** (full sweep: 10 sessions per cell, 30 for random children; scripts in `work-kon-name/kids.mjs` and `kids2.mjs`). The main gap: after a miss, "Yahi naam" stays switched on. The view disables it only when fewer than three letters are tapped (`kon.name.view.ts:310`), and `stepName` keeps the taps. `confirmSay` takes the next commit as the confirmation, so pressing the same name a second time confirms it. The H3 rule never checks that the name changed or that the play-out ran.

| child | in the battery already? | share named, worst fade | under 1 in 10? |
|---|---|---|---|
| same swap 1-2 every level, presses "Yahi naam" twice | no | 1.000 | **no** |
| same missed tap added last, presses twice | no | 1.000 | **no** |
| careful, swap slips on 2 of 4 levels, presses twice | no | 0.982 | **no** |
| battery's one random slip a level, presses twice | no | 0.475 | **no** |
| battery's blind guesser, presses twice | no | 0.130 (door ttt 0.153) | **no** |
| starts at the second letter on screen, presses twice | no | 0.762 | **no** |
| right and swap on alternate levels, presses twice | no | 0.919 | **no** |
| same swap, random three letters after a miss | no | 0.130 (door 0.144) | **no** |
| same swap, another order of her three letters after a miss | no | 0.843 | no (arguable: trial and error) |
| same swap, the same slip again after the play-out | no | 1.000 | no (arguable: H3 assumes she corrects) |
| last level's solve taps, kept after the play-out | no | 0.375 | no (arguable) |
| careful, swap slip on 1 of 4 levels, presses twice | no | 0 | yes |
| one random slip, random letters after a miss | no | 0.067 (door 0.072) | yes |
| a random slip on 1 in 3 of every name she builds | no | 0.046 | yes |
| reads across, and again after the play-out | no | 0 | yes |
| alphabetical order, kept after the play-out | no | 0.819 | not counted (her order ignores the vertex, which is the belief) |
| `find`: larger corner / right corner / random corner | no | 0.039 / 0.027 / 0.031 (n 3840) | yes |
| `find`: smaller, left, upper or lower corner; last level's arc; corners in turn | no | 0 | yes |

The battery's own slip and swap children are 0 because they always clear and do the solve. That is the one exit H3 allows, and the battery never tries any other.

**D. A counted pair.** Session hb0, fade 2, no pL, doors ggg. The battery's `slip:swap 1-2` child with a double press taps:
- BER on `kon-name:say:115:90:50:30:0:1` (not a discriminating level);
- PQC on `kon-name:say:120:45:120:35:1:1` (a discriminating level).

The vertex-first holder taps exactly the same on the same levels. Both are counted and both are named at level 2, with `named:"repeat"` at weight 0.5. Under the ruling's own definition, no `say` level is discriminating: a swap of 1-2 *is* "vertex first" on every level. `readsAcrossAll` separates only the reading habits. H1 holds for `kon/name`, but by surface: two sightings always have different letters.

**E. Holders named.** Vertex first 1.00, vertex last 1.00, any order 0.58, `find` first letter 0.50.
- **Effectively never named:** `find` last letter (0), and any holder who builds the right name after the play-out (0 by H3's design).

**F. Before naming (H5 is not built).** After one sighting the facts row is `verdict=solved first_try=0 misses=2 extra=10 … said=QRP commits=3`. After an ordinary wrong-letter miss it is `misses=0` with `refused=1` in the trail. So `misses` tells the mix-up's form from other misses. The evidence row also still enters an unconfirmed mix-up-form miss at weight 0.25 against 0.5 for an ordinary miss.

**Faults**
1. **Blocks.** H3 counts an unchanged re-commit as confirmation (`kon.logic.ts:474–481` together with the view's commit button). A careful child who slips twice and double-taps is named 0.98 of the time; the blind guesser who double-taps, 0.13. Fix: confirm only with a name newly built after a miss (at least one clear or letter act between the two commits), or switch "Yahi naam" off until the name changes. The repair needs its own run of this battery.
2. **Blocks.** A same-swap child who guesses at random after the miss is named 0.130 (door sequence 0.144), with no double press involved. H3's 1-in-6 chance per level is too weak against a habit slip. The discriminating level cannot help, because it does not tell the swap from vertex first.
3. **Should fix.** The battery's only after-miss behaviour for non-holders is clear and solve. It needs children who re-press, repeat the slip, guess or reshuffle after a miss.
4. **Should fix.** The facts row's `misses`/`refused` split and the 0.25 weight show the mix-up before naming (H5).
5. **Minor.** The `find` last-letter holder is never named; the any-order holder is named 0.58.

**What to watch.** Naming should stay off, so this is what to measure from the first real sittings:
- how often a child presses "Yahi naam" twice on one name;
- what a child does after a vertex-first miss: re-presses, guesses, reshuffles or corrects;
- how often order slips repeat within one level.

Under the ruling's "Reverse if", these children count toward the two-mode trigger that would drop repeat naming for games.

All my scripts and the battery's printed table are in `<scratch>/judge-games8/work-kon-name/`.