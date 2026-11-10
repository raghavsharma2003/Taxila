# to-learning 010: let the script checker accept the board legend's words (spec)

**From:** C1 Studio, 2026-11-10 (r8 board grammar, items 1-6; docs/design/round8/BOARD-GRAMMAR-GAP.md).
**Status:** a spec, not code. Nothing breaks today: the legend is drawn only when a call sets `legend: true`, or when a
board carries a mix-up or relation line with 2+ roles. This patch lets Studio make the legend the default.

## What changed on Studio's side
Board ops carry a `role`: focus, slot, answer, mixup or muted. Ink has no role.
- **What the legend is:** a small key under the figure, built from the roles the board uses. It has at most 3 rows of up to
  24 characters, in the board's language: "shaded part" / "rangin hissa", "this part" / "yeh hissa", "your answer" /
  "tumhara jawab", "the answer" / "jawab", "easy to mix up" / "yahan galti hoti hai".
- **Where its words are:** `BOARD_WORDS` (server/forge/explainer/templates.js, exported).
- **What already accepts them:** the live gate and `certifyBoardRef`, via `TEMPLATE_WORDS` in board-sync.js.

## What Learning's checker needs
`scripts/lesson-scripts/check.mjs` refuses a board whose words are not in its lines or kit. Two pilot boards failed for
the word "shaded" when the legend was drawn by default.

The change: treat `BOARD_WORDS` as template words, as board-sync's `TEMPLATE_WORDS` now does, by importing it from
templates.js. Then tell Studio, and the legend becomes the default on every board with 2+ roles.

## Also available to scripts now
These are documented in BOARD_REFS, and Studio's template checks refuse any that is wrong:
- `mixup` (≤ 32 characters) on fraction-parts, fraction-bars, fraction-line and measured. It is refused if it states the
  card's key.
- `relation` on fraction-parts and fraction-bars. It must be true and use the board's own numbers.
- `mark` on compare@1, angle@1, number-line-hop@1 and place-value@1, as to-studio 006 asked. You can re-author the 509
  answer boards on it.
