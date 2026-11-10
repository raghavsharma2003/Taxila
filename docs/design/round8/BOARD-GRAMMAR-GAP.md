# The r8 board grammar against today's whiteboard (C1 Studio, 2026-11-10; one page, nothing built)

Main asked what would have to change in `server/forge/explainer/` and `shared/whiteboard.js` to draw the prototype board
(`prototypes/r8-design/shots/a-lesson-board-p360.png`, claude/r8-design 8b56f526) from the same BOARD_REFS data. The
prototype board for "how many quarters make one half" has:

- stacked fractions in a maths face;
- a curly bracket naming the half ("1/2" over two quarters);
- the half filled in an accent colour, the asked part outlined;
- a dashed "easy to mix up" marker under the whole with its words ("4 quarters make the whole");
- an equation with an answer slot (a dashed green box holding "?");
- a legend keyed to those three marks.

Whichever direction the owner picks, these are the pieces.

## What exists and carries over

- **Ops** (`shared/whiteboard.js` OPS): rect, line (with `dashed`), polygon, text, label, numwork, highlight. A numwork
  `fraction` layout already stacks fractions with a bar, as a block. Every template already writes "?" for an asked value
  (the masked-key rules, maskReveals). That "?" is the answer slot's content.
- **Data**: BOARD_REFS params already carry what the prototype names. fraction-parts and fraction-bars have parts, shade
  and label, with label "?" for the asked value and "" for unnamed. fraction-line has marks. The key withholding
  (liveKeys, lineStatesKey) decides which value is the slot.

## What has to change

1. **A stacked fraction anywhere text goes** (shared/whiteboard.js, Player.tsx, boardFit). Today a label "1/4" is drawn
   inline. The validator would accept a fraction run (`text: "1/4"` with `frac: true`, or recognise a/b with b ≤ 12) and
   the renderer would stack it. `textBox` measures it as two lines at about 0.7 size. The fit predicate (boardAt / boardFit
   in the tray gate) must then count the numeral's own px against the 14/16 px floor. This is the main renderer change: it
   touches every fraction template's label positions (cell centres, bar labels, line marks), because a stacked fraction is
   about 1.8 times taller.
2. **A bracket op** (`brace`: from, to, side, label). It is a curly brace over a span with its label (stacked) at the apex,
   and it is how the board names a group ("these two quarters are one half"). It would be new in OPS, the validator, the
   renderer and the anti-overlap check (Q3.apart). Templates use it where they now write "1/2" beside a bar.
3. **Marks by role, not by colour.** The prototype uses three meanings: *the part asked about* (accent fill and outline),
   *your answer* (a dashed green slot) and *easy to mix up* (dashed rust). They would become a `role` field on ops ("focus",
   "slot", "mixup"), drawn from the palette (src/modules/whiteboard/palette.ts) per theme. The answer slot is a styled
   box around the masked "?" (the mask already exists; it gains a box). This is how the two design directions can share
   one data model: each direction is a palette and type tokens over the same roles.
4. **A legend made from the roles used.** One row per role present, at most 3, each label ≤ 24 characters (the
   anti-narration rule stays). It is laid out below the figure by the template's layout pass, and counted in the board's
   fit and its words-on-screen budget.
5. **The mix-up marker needs the beat's misconception** (server/forge/explainer + board-ref.js). The words "4 quarters make
   the whole" are not in today's params. The template would take an optional `mixup` param, and the seam would fill it
   from the beat's `targets` misconception (the kit's verified belief, as a short label from the kit, never model text).
   The template decides where the dashed marker goes for each kind: under the whole for fraction-parts, the gap count
   for fraction-line, the boundary for measured. It is ≤ 32 characters and checked by the same key predicate
   (lineStatesKey) so it never states the open key.
6. **An equation line under a figure** ("1/2 = ? × 1/4"). numwork `equation` exists, but templates don't emit it with a
   figure. fraction-parts and fraction-bars would gain an optional `relation` param ({ lhs, op, rhs } from the board's own
   parts, the asked term as the slot), laid out below the figure.
7. **A maths face.** The prototype's numerals are in a book serif, and the board's text is in a handwriting face. The
   renderer's font becomes a token per text role (numerals vs words), and `GLYPH_ADVANCE` (shared/whiteboard.js) becomes
   one value per face. Fit and the 24 px phone measures change with it, so certificates are re-run.

## Order, if built

The order would be 1 (stacked fractions), then 3 (roles), 2 (brace), 6 (relation), 4 (legend) and 5 (mix-up marker), then
7 once the owner picks a direction.

1-4 are renderer and validator work in Studio's files. 5 needs Brain to pass the beat's misconception id on the intent:
`scriptBeat.targets` is already there, so this may need nothing from Brain. 7 waits for the owner's pick.

Each step re-runs the whiteboard certificates (boardFit at the three boxes) and the director board predicates. I estimate
4-5 days for 1-6, with the templates done kind by kind (fraction kinds first, since they are the 4 pilot topics).
