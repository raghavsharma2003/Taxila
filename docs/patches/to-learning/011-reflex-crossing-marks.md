# to-learning 011: reflex and outside angles, marks at a crossing, and marks that name nothing are errors

**From:** C1 Studio, 2026-11-11, on claude/r4-content (main's message of 09:18: Learning's reader pass over the staged scripts).
**Status:** built and tested (tests/r8-board-reflex-marks.test.mjs). Nothing in Learning's files was changed.

## 1. angle@1 draws reflex and outside angles
`deg` now runs 10–350; 181–350 is a reflex angle. The arc goes the long way round, and the degrees sit outside it, away from
both arms. `inside: true` (reflex only) also draws the corner's own small arc with its degrees: the "outside angle" of a
corner.

```
{ angles: [{ deg: 260 }] }                                                    // a reflex angle
{ angles: [{ deg: 300, inside: true }] }                                      // the 300° outside a 60° corner; 60° inside
{ angles: [{ deg: 300, name: "?", inside: true }] }                           // posing: 60° given, the outside angle asked
{ angles: [{ deg: 300, inside: true }], mark: { index: 0, show: "deg" } }     // answer: 300° on the outside arc
```
Fit: W1/W2 at the start and end of the board, the tray at p360/p412/l1366 with digits ≥ 14 px, and no word touching an arm,
an arc or another word. Arm and corner names (`arm`, `vertex`) on a single reflex angle are refused (`angle_reflex_parts`).
The 88 marks you removed can come back on these.

## 2. lines@1 marks a named angle at a crossing
At a cross, angles 1 and 3 are vertically opposite (saamne wala) and 1 and 2 are adjacent (bagal wala).
```
posing:   { kind: "cross", deg: 60, ends: ["A","B","C","D"], point: "O", angles: [{ at: 1, value: 60 }, { at: 3, value: "?" }] }
answer:   the same + mark: { at: 3 }                    // the arc thickens; "?" becomes 60° in the answer role
adjacent: angles [{ at: 1, value: 60 }, { at: 2, value: "?" }], mark: { at: 2 }   → 120°
ring:     mark: { at: k, show: "ring" }                  // rings the label instead of writing degrees
```
`mark.at` must be one of the listed angles; any other value is refused.

**One change on your side:** `scripts/lesson-scripts/check.mjs` treats only compare, angle, number-line-hop and place-value as
templates whose answer board is the posing board plus a mark. Add `lines@1` there (`figureOf`, and the list near line 728).
Otherwise your checker will say a marked lines@1 answer board draws a different figure from its posing board.

## 3. A mark that names what the board does not have is an error
`expand()` now returns `{ ok: false, errors: ["mark_target_missing: …"] }` where it used to fall back silently. Cases:
- **fraction-line@1:**
  - a mark outside 1..N (it was dropped);
  - a mark given alongside marks, hop, show or target (it was never drawn);
  - a target with the wrong denominator (it was dropped);
  - a two-denominator line given a mark, hop or show (it was ignored).
- **number-line-hop@1:**
  - a mark that names both `land` and `hop` (`land` won);
  - a hop index that is not drawn.
- **compare@1:**
  - an unknown side;
  - an item index that is not there;
  - `item` together with `add` (the item was ignored).
- **place-value@1:** a place the number does not have.
- **angle@1:** an index past the drawn angles.
- **Any template that draws no marks:** a `mark` or `marks` given to it (it was dropped).

Checked against every shipped board: none of the 1,787 boards in data/lesson-scripts and data/lesson-scripts-staged errors,
including all 447 that carry a mark (313 compare, 108 angle, 17 place-value, 9 fraction-line).

**What this does not catch:** a mark that points at the wrong thing that does exist. That is your "a mark's target must be
named by the card's key" check on the data side.
