# Patch 002 to Games: the role colours under the three laws, and the token names

**From:** Design (round 8). **To:** Games (`src/play/**`, `shared/play.ts` ArtTokens).
**Why:** the main loop's rulings of 2026-11-11 (`docs/design/round8/games-judging/RULINGS-2026-11-11.md`, law 1).
- Green means right, and only right.
- The picked row or box takes the **focus** colour.
- Her own wrong value takes the **mix-up** colour.
- The action button keeps the **action** colour.

This file gives Games the names and values. Games makes the change and asserts it in each family's cert, as the rulings ask.

## 1. What breaks law 1 today (`src/play/core/styles.ts`)

| where | today | the fault |
|---|---|---|
| `Painter` body state `"selected"` (line ~182) | strokes `a.you` | `you` is #5B7A00 (olive) on Kagaz and #CBFF4D (lime) on the dark arts. Both read as green, so a picked box looks "right" before anything is checked. |
| `ArtTokens.you` as the action hue | olive / lime | The action and "right" share a hue family. A child cannot tell "press this" from "you got it". |
| a wrong pick | `good` in two judged modes (`kon/name` find, `stambh/tally` wrong row outline) | This is the judged fault itself. |

## 2. The change asked

**1. Add two roles to `ArtTokens` (`shared/play.ts`).**
- `focus`: the picked or selected thing. Her finger is on it; it is not a verdict.
- `mixup`: her own wrong value, shown with the magnifier or a dashed shape. It is never red and never a cross.

`look` already plays the mix-up part. Either rename it to `mixup` or alias it. Keep one name in the cert's assertion.

**2. `selected` strokes `a.focus`, never `a.you` or `a.good`.**

**3. `good` is drawn only on a state the checker graded right.** The cert asserts this on every generated level:
- no `good` stroke or tick on a body the key does not mark right;
- no `good` before a check.

**4. `you` is the action hue only** (the one "your move" element per state).
- Under the new look it is marigold, not lime.
- It is never used on a figure.

## 3. Values per art direction (the same roles as Design's tokens and Studio's board)

| art | ground | focus | good (= answer) | mixup (= look) | you (action fill / its text) |
|---|---|---|---|---|---|
| kagaz (paper; theme A) | #F3EADB | **#3B47B0** | **#0B736A** | **#8A5A00** | #EFA52E / ink #1C1A16 |
| raat (night; theme B) | #0A0C12 | **#8F9BFF** | **#4FE0A2** | **#FFB54A** | #CBFF4D / ink #0F1218 |
| chalk | #1E2A26 | #A9B4FF | #8BE0B3 (today) | #F5B465 (today) | today's |
| blueprint | #0F2E57 | #E7D1FF | #74E8BD (today) | #FFB547 (today) | today's |

**Measured (2026-11-11):**
- **Contrast on the art's ground** (focus / answer / mix-up):
  - kagaz: 6.49 / 4.79 / 4.97
  - chalk: 7.54 / 9.48 / 8.20
  - blueprint: 9.66 / 9.05 / 7.72
  - raat: 7.73 / 11.65 / 11.13
- **Deuteranopia distance** (Studio's `tests/theme-palette.test.mjs` measure; it must be at least 0.15):

  | art | focus–answer | focus–mix-up | answer–mix-up |
  |---|---|---|---|
  | kagaz | 0.301 | 0.456 | 0.155 |
  | chalk | 0.587 | 0.907 | 0.342 |
  | blueprint | 0.482 | 0.950 | 0.472 |
  | raat | 0.710 | 1.040 | 0.335 |

**Kagaz has the least margin, answer against mix-up (0.155).** The shape rule already carries it: a tick for right, a magnifier and dash for a mix-up. Keep that rule in the cert.

The kagaz and raat values are the same as `src/styles/tx-tokens.css` themes A and B (`--tx-focus`, `--tx-ans`, `--tx-mix`, `--tx-move`). They are also the values Studio's board is asked to take (`docs/patches/to-studio/009-palette-roles/`). One child sees one meaning per colour, whether on the board, in a game or in the parent corner. `tests/r8-palette-sync.test.mjs` holds the board and token sides. A Games cert assertion holding kagaz and raat to the same four values would close the loop.

## 4. The chrome under `?tx=` (`src/play/play.css`)

A lesson and the child's screens carry `data-tx="a" | "b"` on their root when the device opted in (`src/ui-v3/r8/tx.ts`; production unchanged until the default flips). The play chrome can follow with one block. The `--pl-*` names stay, so no rule in play.css changes:

```css
/* round 8: under the new look the play chrome reads Design's tokens (src/styles/tx-tokens.css) */
[data-tx] .pl-root.pl-root {
  --pl-bg: var(--tx-bg); --pl-bg2: var(--tx-surface-2); --pl-ink: var(--tx-ink); --pl-ink2: var(--tx-ink-2);
  --pl-line: var(--tx-line); --pl-btn: var(--tx-surface); --pl-btn-ink: var(--tx-ink);
  --pl-you: var(--tx-move); --pl-you-ink: var(--tx-on-move); --pl-accent: var(--tx-tutor);
  --pl-font: var(--tx-font-ui); --pl-display: var(--tx-font-display); --pl-mono: var(--tx-font-ui);
}
```

**The art direction under `?tx=`:** theme A plays in kagaz and theme B in raat. This would be a two-line choice in `src/play/core/volt-art.ts` where the art is picked. The child's chosen art can still win if Games prefers that.

**`.pl-mark` (a rotated diamond) and mono labels** are the old terminal chrome. Under `[data-tx]`:
- the mark becomes a circle: `border-radius: 50%; transform: none`;
- labels move to the UI face in sentence case.

## 5. Token names, for reference

The full set is in `src/styles/tx-tokens.css`. Theme A is on `:root, [data-tx="a"]` and theme B on `[data-tx="b"]`. B swaps values and never adds a name.

| group | names |
|---|---|
| grounds | `--tx-bg`, `--tx-surface`, `--tx-surface-2`, `--tx-line`, `--tx-line-2` |
| ink | `--tx-ink`, `--tx-ink-2`, `--tx-ink-3` |
| action | `--tx-accent`, `--tx-on-accent`, `--tx-move`, `--tx-on-move`, `--tx-move-text` (the action hue as text on paper) |
| her | `--tx-tutor`, `--tx-tutor-soft` |
| meaning | `--tx-focus`, `--tx-focus-fill`, `--tx-ans`, `--tx-ans-fill`, `--tx-mix`, `--tx-ok` (= answer, for "secure" and "right") |
| safety only | `--tx-danger` (never a verdict) |
| subjects | `--tx-maths`, `--tx-science`, `--tx-evs`, `--tx-english`, `--tx-hindi`, `--tx-social` |
| type | `--tx-font-ui`, `--tx-font-display`, `--tx-font-read`, `--tx-font-math`, `--tx-font-deva`; sizes `--tx-t-1`..`--tx-t-8` (14, 16, 18, 21, 26, 32, 44, 60 px) |
| space and shape | `--tx-s-1`..`--tx-s-8` (4–64 px), `--tx-r-1`..`--tx-r-3`, `--tx-shadow-1`, `--tx-shadow-2` |
| motion | `--tx-ease`, `--tx-ease-settle`, `--tx-dur-1`..`--tx-dur-3` |
