# To Studio 015: a round shape that is not a circle, a slack string, and pictures that add something

From main, 2026-11-23. Source: `docs/design/round7/judgements/director32-2026-11-23.md` (decision `dc-r8-director32`,
item 8). Reports: `evals/hybrid-side-by-side/results/2026-11-23-director32/judges/report-c4ch01t02.md`,
`report-c6ch07t01.md`, `report-c5t03.md`.

## 1. A round shape that is not a circle (`shape@1`)

The staged class 4 lesson asks "Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti
circle hai?" and has nothing to draw it with: the card was said over the previous point's perfect circle labelled "sikka,
barabar door" (steady 78, 82, 84), a contradiction. No board kind draws a round shape that is not a circle.

- `shape: "oval"` (an ellipse) and `shape: "uneven"` (a closed smooth outline with no symmetry, the same every time for the
  same params), each with `centre` and up to three radii drawn to the outline, each with its own label ("8 cm", "10 cm") and
  drawn to its own length, so that the picture is true of the numbers.
- The radii view of Studio 014 works on both: the radii at three places, each at its own length.
- The checker's rule that a card which says "circle" needs a circle drawn accepts these where the card's key is that the
  shape is NOT a circle.

## 2. A slack string

The same lesson's follow-up card: a 12 cm string went slack while the pencil turned. Today it is posed over a tight 12 cm
circle (true as a reference, and no picture of the thing asked about).

- `shape@1` with `slack: { from, to, depth }`: the outline is the circle of the string's length except between the two
  angles, where it comes in towards the centre by `depth` (never outside the circle: a slack string lets the pencil come
  closer, not go further). The tight circle may be drawn faint behind it as a guide (`guide: true`).
- Its radii view shows one radius at full length and one inside the dent, shorter.

## 3. The tester on a turned shape

"Tester ko tile ke saath ghuma kar rakho" is the idea of skill 1 and the only picture for it today is the tester alone
(stuck 18, offtopic 28: "shows nothing about the turned shape"). `shape@1` for a rectangle or square already takes copies
and a turned copy: add `tester: { on: <copy>, corner: <n>, turned: true | false }`, the Studio 014 tester overlay laid at
that corner, either square to the page (it does not fit a turned tile) or turned with the shape (it fits).

## 4. A view is offered only when it adds something

`viewOf` returns no view when the second view would draw the same wholes the board already draws in the same arrangement:
the bars-as-wholes view beside the same bars (c6-ch07 offtopic 30, steering 14), and a fold drawn once more (c5-t03 stuck
18). Learning 021 then authors a picture for those cards or lists them. Print the list of cards in the seven scripts that
lose a view by this rule.

## 5. Small

- `equal-groups@1` with `each: 1` draws "5 × 1 = 5" under five whole laddoos (c6-ch07 skill 3, the asked step's picture):
  `showSum: false` hides the sum line.
- `compare@1` items that wrap onto a line crossing the column rule make the board fail to draw (found in c6-ch07 s3 e2 by
  the fix agent, 2026-11-23): the board shrinks the text or refuses at author time with a checker error, never at run time.

## Measure

`tests/r8-studio015-shapes.test.mjs`: each new drawing's ops (an oval's two radii at their own lengths; the slack outline
never outside the tight circle; the tester's two states); the list of cards that lose a view under item 4; the op cap of 120
held for every new board.
