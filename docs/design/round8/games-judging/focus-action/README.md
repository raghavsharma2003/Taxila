# Focus and action: the 3D selection and Design's patch 002

**From:** Games, branch `claude/r8-focus-action`. **For:** main, to look at; no judges.
**Rulings:** `RULINGS-2026-11-15.md` (row "3D engines": the selection takes the focus colour, in the same commit as patch 002) and `RULINGS-2026-11-11-night.md` ("Also": the action colour outside the green family in both looks).

All shots are 360 × 640 at 2× pixel density (720 × 1280), RGB. They were taken on the forge QA harness (`server/forge3/qa`) with reduced motion.

| File | What it shows |
|---|---|
| `stambh-keep-action-kagaz-360x640.png` | stambh/tally keep in kagaz, the "five" form (five standing lines, the totals right). Kaanch is right and keeps its green tick. "Phir se rakho" is her move and is now marigold (#EFA52E, text #1C1A16). Before, it was lime beside the green tick. The picked row is outlined in focus (#3B47B0). |
| `stambh-keep-action-raat-360x640.png` | The same state in raat. The action is magenta (#FF6FD8, text #0F1218), the tick is Design's answer green (#4FE0A2), and the picked row is Design's focus (#8F9BFF). |
| `yantra-beam-lab-select-360x640.png` | yantra beam in 3D, theme lab. A mirror has just been placed and picked. Its turn ring, its frame glow and its "0°" label are in kagaz focus (#3B47B0), where they were olive before. |
| `yantra-beam-bench-select-360x640.png` | The same in theme bench, on the green cutting mat. The ring and frame glow are in blueprint focus (#E7D1FF) and the label is on its dark pill. Both were lime before. |
| `khand-views-mitti-select-360x640.png` | khand (nazariya views) in 3D, theme mitti, mid-drag with Build. Her cursor (block edges) and the drag box are in focus (#3B47B0, the paper art's focus, which stands off the daylit grass). Both were lime before. |

The 3D chrome's action button ("Run", "Check") is also magenta now, because the 3D stage plays in raat.

## What changed

**The 2D painter.**
- "you" is no longer a painter role. The 108 places where a view asked for "you" now ask for "focus", and the colour on screen does not change.
- `server/forge3/qa/laws.mjs` fails a canvas use of "you" in any state as law 1: "the action hue on a figure". This runs over every served level, in `tests/r8-play-laws.test.mjs`.

**The 3D engines.**
- Each engine reads its selection colour through `lawColor` (`src/play/core/styles.ts`, the same `LAW_ROLES` map the laws read). One change of an `ART` focus token therefore moves the 2D painter and the engines together.
- yantra: each theme names the art whose focus stands off its floor and its label pill.
  - lab: kagaz.
  - rooftop: kagaz, with raat for the labels.
  - bench: blueprint.
- khand: reads the paper art's focus.
- antariksh: its reticle, bolt and probe marks take raat's focus.

**Tokens (`ART`, play.css).**

| art | role | old | new |
|---|---|---|---|
| kagaz | action (fill / text) | #5B7A00 olive | #EFA52E / #1C1A16 |
| kagaz | answer | #22794D | #0B736A |
| kagaz | mix-up | #9A5B00 | #8A5A00 |
| kagaz | focus | #3B47B0 | #3B47B0 (unchanged) |
| chalk | action (fill / text) | #CBFF4D lime | #FF6FD8 / #0F1218 |
| blueprint | action (fill / text) | #CBFF4D lime | #FF6FD8 / #0F1218 |
| blueprint | focus | #E2B0FF | #E7D1FF (Design's) |
| raat | action (fill / text) | #CBFF4D lime | #FF6FD8 / #0F1218 |
| raat | focus | #C8A6FF | #8F9BFF |
| raat | answer | #3DDC97 | #4FE0A2 |
| raat | mix-up | #FFB547 | #FFB54A |
| play chrome `--pl-you` (every art) | action | #C2F542 lime | the art's action |

- The play chrome also gains `--pl-focus` per art. A pressed button (`aria-pressed`) is outlined in focus, where it was lime before.
- Section 4's `[data-tx]` block is in play.css.
- Theme B's `--tx-move` in `src/styles/tx-tokens.css` is still lime, and that file is Design's. Under `[data-tx="b"]` the play chrome therefore keeps raat's magenta.

## Measured (2026-11-16)

These use WCAG contrast. The deuteranopia distance is Studio's measure (`tests/theme-palette.test.mjs`) and must be at least 0.15.

**Magenta #FF6FD8 on the dark arts:**

| art | on ground | to focus | to answer | to mix-up |
|---|---|---|---|---|
| chalk | 6.02 | 0.336 | 0.347 | 0.607 |
| blueprint | 5.50 | 0.514 | 0.339 | 0.687 |
| raat | 7.93 | 0.357 | 0.356 | 0.682 |

Its text #0F1218 on it is 7.60.

**Kagaz marigold #EFA52E (Design's):**
- On the paper it is 1.74. It is a filled button, and its text #1C1A16 on it is 8.35.
- Deuteranopia distance: 0.775 to focus, 0.576 to answer, 0.526 to mix-up.

**Rejected for the dark arts:**
- marigold and orange: the distance to mix-up is 0.13 to 0.15;
- coral #FF8A7A: 0.176 to mix-up on chalk;
- pink #FF8FA3: 0.093 to answer on raat.
