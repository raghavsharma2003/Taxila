# Step g: retiring the old chrome, the plan and the counts

Brief §3 step g: "Retire the classic skin and the Kaksha skin's terminal chrome (slash labels, grid, clipped corners, chevrons). Delete the CSS they leave unused and report the counts before and after."

## Why this is a plan and not yet a deletion

Every file that carries the terminal chrome is still what production shows. The new look is behind `?tx=`, and the shipped default is `TX_DEFAULT = null` (`src/ui-v3/r8/tx.ts`). Deleting the old chrome now would change production before the owner has seen the new look, which is the main loop's order: step b goes to the owner first.

So step g is one change in two commits, made the day the default flips:
1. `TX_DEFAULT = "a"` (one line).
2. The deletions below, in one commit separate from any fix, with a `context/inbox` entry listing each removed path and the last commit that holds it (round 7 standing rule).

The round 7 standing rule also keeps "the classic skin" because the owner parked it rather than retired it. Removing `?ui=classic` itself needs the main loop's word.

## Counts now (measured 2026-11-11 on claude/r8-design, `src/**/*.css` without dev pages and the engine gallery)

| | now | the review (2026-11-10, its own method) |
|---|---|---|
| CSS files | 43 | 36 |
| distinct colour literals | 449 | 351 |
| distinct font sizes | 85 | 69 |
| distinct radii | 47 | 44 |

The method: every `#hex` and `rgb()`/`rgba()` literal, every `font-size` value and the size in every `font` shorthand, and every `border-radius` value, each counted once. The script is `scripts/css-counts.mjs`, re-run for the "after".

## What goes when the default flips

| path | lines | what it is | after the flip |
|---|---|---|---|
| `src/ui-v3/kaksha/futurist.css` | 237 | the Volt and Holo looks: breathing CTA, "»" chevrons, the shell word, inset tick hovers, glows | delete; the r8 files replace every rule the new look needs |
| `src/ui-v3/kaksha/tokens.css` look blocks (holo / volt / dawn) | ~250 | four palettes of `--k-*` values | keep one block: the bridge's `--k-*` → `--tx-*` mapping becomes the only definition, then the `--k-*` names are renamed to `--tx-*` in the components (mechanical) |
| `src/ui-v3/kaksha/kaksha.css`, `kit.css`, `nav.css` | 480 | chamfer (`.kx-cut`), mono labels, the starfield `Sky` | the chamfer, mono and sky rules go; the layout rules stay, in tokens |
| `src/ui-v3/kaksha/lesson/desk.kaksha.css` | 205 | the Desk's terminal dress (chamfers, the 32 px grid, mono, glow sky) | the dress goes; `src/ui-v3/r8/lesson.css` is the lesson's look |
| `src/onboarding/volt.css` | 190 | set-up's HUD (carbon grid, "// " eyebrows, slanted cells, chamfers, diamond PIN dots) | delete after `onboarding.css` takes its remaining layout rules (Learning's path: by patch) |
| `src/parent/parent.css` "calm Volt" block | ~115 | the corner's HUD dress | delete the block (Learning's path: by patch) |
| `src/child/child.css` (classic child app) | 436 | the classic skin | only if the main loop retires `?ui=classic` |
| `src/ui/teacher/**` picture on the lesson and home | — | the cartoon face | stays in the repo; the new look does not mount it (her look is the owner's choice) |

**Lints, in the same commit:**
- `tests/ui-v3-lint.test.mjs` gains the r8 rules over all of `src/ui-v3/`: no `clip-path: polygon`, no "// " labels, no uppercase mono labels, and tokens only.
- These rules already guard the new files in `tests/r8-tx-tokens.test.mjs`.

**Expected "after":**
- about 1,400 lines of CSS deleted and 6 to 8 files gone;
- colours under 60, mostly the games' and engines' own art palettes, which are not chrome;
- font sizes and radii at the token scale plus the engines' own.

## Asked of the main loop

1. Confirm that step g lands with the default flip, not before.
2. Retire `?ui=classic` and `src/child/child.css`, or keep them parked.
