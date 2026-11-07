# Studio's new templates in the real lesson player (r7 App, 2026-11-07)

**What was checked:** the boards come from Studio's own `expand()` on claude/r4-content 3ef08301f, at B3 pace, and every one passed Studio's gates and lint. Each was drawn by the real Desk (the stage-first work tray, `src/child/lesson/dev/DeskDev.tsx` `work-beat`, with the board injected through `window.__deskScript`), at 360x800, 412x915 and 1280x800, after the board's full duration.

**Overlap check:** the drawn SVG text boxes are tested pairwise, together with text running off the board.

**Confirm-reveal:** a `+reveal` case is statedMark's swap of the "?" text op for her stated value (`"?"` → `110°`, `1/8`, `40000`, `7/12`), at the same anchor in accent ink.

Shots: `shots-boards/<case>-360x800.png` for every case, plus 412 and 1280 for the two failing scale cases (the other 412 and 1280 renders matched 360 and are not kept).

| Case | Template | 360 | 412 | 1280 |
|---|---|---|---|---|
| bars-3 (+reveal 4/8) | fraction-bars@1 | clean | clean | clean |
| bars-q-shaded (+reveal 7/12): the shade-grid second view | fraction-bars@1 | clean | clean | clean |
| wholes-unequal: Cake A / Cake B, "1 bada, 2 chhote" | wholes@1 | clean | clean | clean |
| wholes-one: 12 parts, a title | wholes@1 | clean; the board fills the card, while the caption, question and dock stay visible | clean | clean |
| lines-cross (+reveal 110°, 70°) | lines@1 | clean | clean | clean |
| lines-parallel: 8 angles (+reveal 120°) | lines@1 | clean | clean | clean |
| fline-q (+reveal 1/8) | fraction-line@1 | clean | clean | clean |
| **scale-10**: 0 to 1000 step 100, marks 300 / ? / 500 | **number-line-scale@1** | **tick labels run together ("100200300…"); marks 300400500 touch** | same | same |
| **scale-6digit**: 0 to 100000 step 20000 | **number-line-scale@1** | **"80000100000" reads as one number** | same | same |

## number-line-scale@1: the tick labels are wider than the template allows (Studio)

**Measured in the player:** the number_line row labels are drawn at fs × 0.8 = 19.2 board units in Geist Mono. One digit is 11.5 units, so "100" is 34.5 and "100000" is 69.

The template's interval is (340 − 24) / N:
- **10 intervals:** 31.6 units, narrower than any three-digit label;
- **5 intervals:** 63.2 units, narrower than "100000".

**What lets it through:**
- `textBox(…, "s")` estimates about 10.4 units per digit;
- the number_line layout has no lint for its own row labels colliding;
- the marks' two-row lift keeps a 6-unit gap by that estimate, and "300 / 400 / 500" still touch on screen.

**Suggested rule (Studio):**
- A tick row is legible when (W − 24) / N ≥ digits(to) × 11.5 + 6. That gives at most 18, 11, 7, 6, 5 and 4 intervals for 1 to 6 digits.
- Otherwise, label every k-th tick (k dividing N) and keep the end labels.
- Use the player's real advance (0.6 em of the drawn size) in `textBox`, or measure it once, so the marks' lift and `lintScript` see what the child sees.
- A lint check for labels inside one numwork op would have caught both cases.
