# Round 4 · U1 gamified app directions (for the owner to pick)

Three interactive prototypes of the whole session-first child journey. Each is one offline HTML file: open it in
a browser at phone size (360 x 800) or on a laptop (1366 x 768).

| direction | file | in one line |
|---|---|---|
| A · Kaksha (कक्षा: orbit, and classroom) | `kaksha/index.html` | a premium dark game client; your own planet whose orbits fill with stations and whose night side lights up as ideas become secure |
| B · Nagar (नगर: city) | `nagar/index.html` | a floating sandstone island in daylight; every secured idea raises a real Indian structure (a baoli for equal parts, a jantar for angles) |
| C · Chhaap (छाप: a print) | `chhaap/index.html` | a riso print studio in two inks; every secured idea opens a wooden block-print stamp, and your poster prints a new pass with it |

The comparison, the judges and the risks are in `COMPARE.md`.

**Jump to any state** with the URL hash, for example `index.html#s=lesson&at=check&lang=hi`:
- `s` is `open`, `intake`, `lesson`, `game`, `end`, `world` or `parent`.
- `at` is `plan` (intake), `check` or `ok` (lesson), `play` (game) or `before` (world).
- `lang` is `hing`, `hi` or `en`.
- `mute=1` turns the procedural sound off.

Without a hash, the prototype starts at Open and flows by itself: Asha asks, the child's words arrive, the topic is
mapped and a plan is agreed, the board inks beat by beat, and a checkpoint waits for a tap on the line. Tap the right
place to go on, or the wrong one to see the "look again" path. Then the game launches (hold the button), the session
ends, and the world changes.

## What is real and what is a stand-in

- **Asha** is the grown-up option 4 (lamp1 layers from `art/character/puppet2d/lamp1/`). She is driven here by a light
  DOM puppet (`_src/asha.js`) with a blink, gaze, brows, breath, sway and a syllable-envelope jaw. The product keeps
  the real `TxPuppet` runtime in the `<Teacher>` slot.
- **The child's speech** is simulated: the listening meter and the transcript are scripted.
- **The game** is a still from the Antariksh and Khand prototypes in `docs/research/round4/games/proto/shots/`.
- **The copy** is prototype copy. In the product, her words come from the Director and never from a fixed script.
- **Rules followed:** no points, coins, streaks or leaderboards (option B). No padlock icons and no "N of M"
  counters. Nothing is red for wrong. The teacher's face is verdict-neutral.

## Rebuild

```
node docs/design/round4/app/_src/build.mjs      # src.html -> index.html (subset fonts, inline images, puppet)
node docs/design/round4/app/_src/shoot.mjs      # shots/*.webp at 360x800 and 1366x768
node docs/design/round4/app/_src/lint.mjs       # shots/lint.json
NODE_USE_ENV_PROXY=1 node docs/design/round4/app/_src/judge.mjs 5   # judge/ (Azure, model judges)
```

The fonts are SIL OFL: Space Grotesk, JetBrains Mono, Anek Devanagari, Instrument Serif, Tiro Devanagari Hindi,
Bricolage Grotesque and Geist Mono. Pages inline only subsets of them. No new dependency was added to the product.
