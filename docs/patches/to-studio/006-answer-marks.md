# to-studio 006: an answer mark on compare@1, angle@1, number-line-hop@1 and place-value@1 (spec)

**From:** Learning (round 7 F), director19 D14.7a (`dc-r7-script-walk-v6-11`), 2026-11-10.
**Status:** a spec, not code. Learning's checker already accepts the mark (see "Learning's side" below). Nothing changes on
screen until Studio's templates draw it.

## Why
A keyed card closes with its answer spoken over its `answerBoard` (dc-r7-held-board). Four templates have no way to show
an answer, so the answer board must be the same as the board the card was asked on, and the answer is heard but never seen.
Counted on int/r6 + D14 over all 34 scripts (4 live, 30 staged): **509 of 831 answer boards equal their posing board.**

| Template | Answer boards equal to the posing board |
|---|---|
| compare@1 | 330 |
| angle@1 | 108 |
| place-value@1 | 17 |
| number-line-hop@1 | 13 |

The rest (fraction-parts, measured, shape, column-op and others: 41 boards in total) are smaller, and out of scope here.
- In c5-maths-ch03-t02, 21 of 27 cards have an answer board equal to the posing board.
- In c5-maths-ch13-t01, 23 of 24 do.

## The param: `mark`, on an answer board only
The same template draws the same figure, plus one highlight. A posing board never carries `mark`; Learning's checker refuses
one there.

- **compare@1:** `mark: { side: "left" | "right", item?: <index>, add?: "<text>" }`.
  - Rings the chosen column, or one item in it, and draws a tick.
  - `add` appends one highlighted item to that column. This is how a value appears, for example `{ side: "right", add: "₹85" }`.
  - Use: choice cards ("kaunsa zyada: Anil ya Bina?" rings Bina's column) and value cards.
  - Gate: `add` is not a "?" and holds at most 24 characters.
- **angle@1:** `mark: { index: <i>, show?: "deg" | "bigger" }`.
  - `show: "deg"` draws the measured arc on angle `i` and writes its degrees.
  - `show: "bigger"` thickens angle `i`'s arc and ticks it.
  - Use: "which angle is bigger" (c6-ch02-t02 s2/e1: mark angle B) and "how many degrees" cards.
- **number-line-hop@1:** `mark: { land: true }` or `mark: { hop: <i> }`.
  - `land: true` circles the final landing point and labels its value.
  - `hop: i` highlights one hop and its landing value.
  - Use: "where does the frog land" (c5-ch13-t01) and the count of hops.
- **place-value@1:** `mark: { place: "ones" | "tens" | "hundreds" | "thousands" | "ten-thousands" | "lakhs" | "ten-lakhs", value?: true }`.
  - Highlights that column's digit.
  - With `value: true`, writes the digit's value under it ("8 → 800").
  - Use: "8 ki value kya hai" (c4-ch04-t01 s2 c1: `{ place: "hundreds", value: true }` over 2864).

## Gate (W) notes
- **W9 no_reveal** keeps refusing an answer on a posing board. A board that carries a `mark` is an answer board by
  construction, so W9 allows the number that mark shows.
- **The numbers-shown check** (board-ref `authored` numbers) should count the mark's drawn value as shown.
- **`claimsOf`** (templates.js) for each of the four could expose the mark, so that a why can be checked against it, for
  example `{ angles: [...], marked: i }`.

## Learning's side (in D14, already pushed)
- **`figureOf`** (`scripts/lesson-scripts/check.mjs`) ignores `mark` for these four templates. A marked answer board
  therefore stays "the same figure" as its unmarked posing board, and the held-board and figure rules pass unchanged.
- **The new rule:** a card's posing board carrying `mark` is an error.
- **When Studio's mark lands**, Learning re-authors the answer boards: the 44 cards in c5-ch03-t02 and c5-ch13-t01 first,
  then all 509 by script. Every keyed card then closes on a board that shows its answer.
