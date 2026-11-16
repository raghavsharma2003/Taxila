VERDICT:
FAIL

**Why.** The battery passes and no single-habit child I could add breaks the 1-in-10 line. It fails on step D: on served levels, children from the battery itself type exactly the mix-up's number, and those levels are counted. On tally keys, the discriminating-level rule from the answers file is not built. `discriminatingPair` returns `a !== b` for string sightings, so for this mode the rule is H1 only. The packet says "no tally child acts as the mix-up on a served level". That is false.

**A. The battery.** The full sweep (`HABIT_FULL=1`) passes 8/8 in 2m28s, and its table matches the packet.
- Worst non-holder, read: 0.013 at fade 2 and 0.008 by door sequence (tgg), both "bundles only, a bundle skipped".
- Worst non-holder, keep: 0 and 0.
- Negative control under the old rules, full seeds:
  - "16 every time": worst fade 0.234 (fade 1), worst cell 0.900.
  - "what I typed last time": 0.234 / 0.900.
  - Blind guesser: 0.

**B. Children it has.**
- Read: careful; blind; one random slip a level; 8 ways of reading × counting slips; 21 single-key typing slips; constants 0–99; repeats her last number; types last level's right number; the number line's end; the holder; the half-holder.
- Keep: careful; blind; one random slip; stroke flips (first, last); first line across drawn standing; the first stroke in the next row; first-row total ±1; 21 typing slips; constants; only the second button; alternating buttons; last level's totals; every stroke in the first, last or middle row; three holders. "Only the first button" is listed as a holder.

**D. A counted pair.** The battery's child "bundles only, a bundle skipped" (fade 2, pL 0.9, door sequence tgg, seed 2):
- Served 31, 46, 43, 49; she typed 25, 40, 35, 40.
- 31→25, 43→35 and 49→40 are each the mix-up's number, all distinct, with bundles and loose lines differing.
- She is named at level 4. This happens in 4 of 960 sessions.
- The child "loose lines doubled, a bundle skipped" has a counted pair (for example 17→14 with 25→20) in 162 of 960 sessions, but is never named.

How I searched: every deterministic non-holder in the battery, 10 seeds per cell, checking for picks with distinct numbers whose bundles and loose lines both differ.

| child | in the battery already? | named, worst fade | under 1 in 10? |
|---|---|---|---|
| bundles only, a bundle skipped | yes | 0.013 (fade 2) | yes |
| a random slip a level, under each of 6 ways of reading | no | 0.001 | yes |
| two random slips in a session (read right; bundles only) | no | 0 | yes |
| blind on the level after a miss (6 ways of reading) | no | 0.001 | yes |
| alternates two ways of reading (30 pairs) | no | 0 | yes |
| last level's right number ±1, 3, 4, 5; her own last number ±1, 4, 5; after a miss, the solve she was shown | no | 0.003 | yes |
| a fixed finger offset on every key (8 directions, ± a way of reading) | no | 0.025 | yes |
| 7 more ways of reading × 12 counting slips × 42 typing habits, plus linear habits (6,774 in all; 473 can name in principle) | no | see the next three rows | — |
| a bundle skipped AND the 2nd key one to the right | no | **0.253** (fade 3; worst cell 0.70) | **no** |
| a bundle skipped AND the 2nd key one to the left | no | **0.119** (fade 2) | **no** |
| "3 per bundle + 4" (not a habit a teacher would recognise) | no | 0.647 | no |
| keep: 302 others (linear totals; marks in bundles of 4 or 6) | no | only the ones that count standing lines are named | — |
| keep: only the first button, totals blind or constant | listed as a holder | 1.000 | — (ruled as the kit's second sign) |

The only habits over the line need two independent habits at once, or are the mix-up in another form ("each group one short + a loose line counted twice" is 4b+s exactly). I don't count those as children a teacher would recognise.

**E. Holders.**
- Read holder: named in 0.797 of sessions. By fade: 0.647 / 0.931 / 0.813. At pL 0.9: 0.34 (fade 1) and 0.40 (fade 3). She is never named in 10 of 96 cells.
- Read half-holder: 0.324 (0.12 at fade 1, pL 0.9).
- Keep, all three forms: 1.000.
- No form of the mix-up is effectively never named. The weakest is the half-holder at high pL.

**F. What the teacher gets before naming.** Facts row after one sighting: `bundles=4 answer=16 goal=read checks=1`. 20 − 4 = 16, so the mix-up can be read straight off it. The unnamed pick enters at weight 0.25 against 0.5 for an ordinary miss, so the weight also tells them apart. This is H5, not built yet; noted, not failed.

**Faults**
1. **Blocks.** The discriminating-level rule is not applied to tally read. Counted pairs where a habit and the mix-up give the same act exist in served sessions (step D), and the packet's claim that none exist is wrong. Either build the rule for numbers, or apply the answers file's "Reverse if": every read row has some constant child X = M, so no read level discriminates against the battery as written.
2. **Should fix (for main to rule).** In keep, "always the first button" (H2's "first option" child) and the "five" sign are the same act on every level. The battery lists her only as a holder, and she is named 1.000 whatever her totals.
3. **Should fix.** Two-habit composites reach 0.253, driven by the pad's edge (0 has no key to its right) and by the firm row 22.
4. **Minor.** The pair 16 and 20 (20 is firm) names anyone whose act happens to give 13 then 16. Fade 1 serves 20 often.

**Once real children play.** Watch how often a non-holder's three sightings are all from the 5(b−1) rows (25, 31, 37, 43, 49). Watch the share of keep children who never press "╱" while their totals are wrong. Watch whether 16 and 20 together carry most of the read namings at fade 1.

Everything is in `<scratch>/judge-games8/work-stambh-tally/`. The scripts are `kids.mjs`, `filter.mjs`, `runcands.mjs`, `rank.mjs`, `top.mjs`, `more.mjs`, `keep.mjs`, `d.mjs`, `df.mjs`, `f2.mjs` and `e.mjs`; the battery's own output is `battery-full.log` and `table-full.md`.