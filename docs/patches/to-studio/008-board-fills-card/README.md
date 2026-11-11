# to-studio 008: the board fills its card under the round 8 theme

**From:** Design (r8). **For:** C1 Studio, owner of `src/studio/**`, `src/modules/whiteboard/**`, `shared/whiteboard.js` and `server/forge/explainer/**`.
**Why:** the main loop reviewed the round 8 lesson screen (`?tx=a`, phase 2 step b) and found the board does not fill its card. "The board is the hero only if its content is scaled to the card."
**Images:**
- `before-p360.png` and `before-d1366.png`: today, under `?tx=a`.
- `after-mock-p360.png` and `after-mock-d1366.png`: a mock made in the browser, not code. The header is moved into the card's top edge, the box is the whole card, and the drawing's viewBox is cropped to its content.

The fixture is `src/ui-v3/kaksha/dev/desk.html?class=5&fixture=work-beat&tx=a`.

These are asks, not a diff. You are reworking the board's role palette right now, so a diff from me would collide with that work.

## 1. Fold the card head into the board card's top edge

`StudioStage` reserves `CARD_HEAD_PX` (34, or 38 for young children) above the box for the "Picture" chip and the beat dots. It then letterboxes a 400 × 300 board inside what is left. At 360 px that makes a band of about 40 px over the head and another under the drawing.

The ask: under a round 8 root (`.kx-lesson[data-tx]`), draw the head over the box's top-left corner and give the box the whole slot. The head is small: about 28 px tall and left-aligned. The drawing then needs a clear zone of the head's size in that corner. `--pip-zone-*` already does this for the bottom-right corner, so the same pattern can serve a `--head-zone-*` at the top-left.

## 2. Scale the content to the box, not the board's nominal 400 × 300

What the card needs from the renderer: a viewBox fitted to the drawn content's bounding box plus a margin (about 14 board units in the mock), letterboxed `xMidYMid meet` into the box.

The mock shows the gain: the same board is about 15 to 20 % larger at 360 px, limited by width. `boardFit` already scales geometry while keeping words at the 14 px floor, so it may be the place to add "fit to content, then to the box".

Keep the rule you already keep: never re-lay a drawing out mid-animation. The fitted viewBox should be fixed once per piece, from the final frame's bounding box.

## 3. Fault: the "1/2" label over the shaded half touches the rectangle

The "2" of the brace label's denominator sits on the square's top line. You can see it at both sizes, in `before-*` and more clearly in `after-mock-*`. It is a layout fault: a label's box must keep clear of the stroke it names by at least the label gap that `lintScript` uses for overlaps.

## 4. The palette: the three meaning roles, agreed values

The main loop asked us to settle the three roles so they are distinct without leaning on red against green. Every role keeps its own shape as well as its colour:
- focus: an outline and a tint;
- slot: a dashed box;
- answer: a tick or a ring;
- mixup: a dashed line.

Round 8 tokens (`src/styles/tx-tokens.css`), as of this patch:

| role (shared/whiteboard.js ROLE) | A "paper" (default) | B "night" | token |
|---|---|---|---|
| ground | `#FFFDF8` | `#131B26` | `--tx-board` |
| ink | `#1C1A16` | `#F3F1EA` | `--tx-board-ink` |
| muted | `#6F675B` | `#8F9CAE` | `--tx-board-soft` |
| focus (stroke) | `#3B47B0` indigo | `#8F9BFF` | `--tx-focus` |
| focus (fill) | `#DCE0F5` | `#283260` | `--tx-focus-fill` |
| slot and answer | `#0B736A` bluish green | `#4FE0A2` | `--tx-ans` |
| slot fill | `#DAEFE8` | `#133A2D` | `--tx-ans-fill` |
| mixup | `#8A5A00` ochre | `#FFB54A` amber | `--tx-mix` |

**What changed for A:** answer moved from `#1C7348` to the bluish green `#0B736A` (your deuteranopia check asked for it to move bluer than our first `#0B7356`), and mixup from rust `#A84B22` to ochre `#8A5A00`. Focus, answer and mix-up now follow the Okabe-Ito colour-blind-safe set (blue, bluish green, orange). Every pair is measured at 5.2:1 or better on the ground (`tests/r8-tx-tokens.test.mjs`).

**Your PAPER role table** in `src/modules/whiteboard/palette.ts` still carries the phase 1 values (`answer #1C7348`, `mixup #A84B22`). Please take the new ones.

**Why the board reads "muddy" today:** a fill is drawn as the stroke colour at `fillAlpha` (0.26 or 0.3) on paper. Indigo at 0.3 over warm paper turns lilac-grey, and next to the grey ink fill of the other quarter it reads muddy.

The ask: read a designed tint for focus and slot fills (`--tx-focus-fill`, `--tx-ans-fill`) when the page has them, instead of stroke × alpha. The `muted` fill stays a light tint of the board's soft ink.

**How the board gets these today, with no Studio edit:** `src/ui-v3/r8/bridge.css` points `--k-ion` → `--tx-focus`, `--k-secure` → `--tx-ans`, `--k-look` → `--tx-mix`, `--k-ink-3` → `--tx-ink-3`, `--k-deep` → `--tx-board` and `--k-ink` → `--tx-ink` under `[data-tx]`. Your `kakshaBoardSkin` reads those names.

When your role palette lands, reading `--tx-*` directly would be cleaner. The names are in the table, and `watchSkin` should then also watch `data-tx`.

## 5. Also seen: the dev fixture's own data

On `work-your_turn`, the plain board shows "1/2 = 2/4" while the question asks how many quarters make one half. That is the dev fixture's scenario (`src/child/lesson/dev/DeskDev.tsx`), not a product board. No action is needed from Studio.
