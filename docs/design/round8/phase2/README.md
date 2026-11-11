# Design revamp, phase 2: steps a and b

Brief: `docs/design/round8/PHASE2-BRIEF.md`. Direction A ("Paper and ink") is the default theme. Direction B ("Night class") is the second theme on the same names.

## The switch

| URL on any page | effect on this device (kept in localStorage `tx.flag.ui.tx.r8`) |
|---|---|
| `?tx=a` | the new lesson screen, theme A |
| `?tx=b` | the new lesson screen, theme B |
| `?tx=off` | today's look, even after the default changes |
| `?tx=default` | forget this device's choice |

The shipped default is `TX_DEFAULT = null` in `src/ui-v3/r8/tx.ts`. Until it changes, production renders today's look for everyone; only a device that opted in sees the new screen. Turning it on for everyone is one line: `TX_DEFAULT = "a"`.

The switch is presentation only. The AI disclosure, the helplines, the floor and every server truth are identical on both paths.

## Step a: the token set and the two themes

- **`src/styles/tx-tokens.css` is the one token set.** It holds 8 type sizes, one spacing scale of 8 steps, 3 radii, colours by role, 2 shadows and the motion.
  - Theme A is on `:root` / `[data-tx="a"]`.
  - Theme B is on `[data-tx="b"]`. It swaps the same names and adds no new ones.
  - B's light parent surface is `[data-tx-surface="light"]`.
  - The values are the phase 1 prototypes', with one change: A's serif is Literata, which is already self-hosted, in place of Source Serif 4.
- **`src/ui-v3/r8/bridge.css`** points today's Kaksha names (`--k-*`, and the Desk's own names) at the `--tx-*` tokens under a root that carries `data-tx`. Today's components therefore take the theme without a rule of their own, and so does the board: Studio's renderer reads `--k-*` off the Desk root. The board roles land as:
  - focus → `--tx-focus`
  - slot and answer → `--tx-ans`
  - mixup → `--tx-mix`
  - muted → `--tx-ink-3`
- **`tests/r8-tx-tokens.test.mjs`** fails:
  - any text pair under 4.5:1 (5:1 for running text), in A, B and B's light surface;
  - more than 8 sizes, other than 3 radii, or 30 or more colours;
  - a B-only name;
  - any literal colour, font size or radius, clipped corner, uppercase label or monospace in `src/ui-v3/r8/*.css`.
- **`scripts/lint-ui.mjs`** allows hex in `src/styles/tx-tokens.css` and nowhere new.
- **No visible change at step a:** nothing applies without `data-tx`.

## Step b: the lesson screen on a phone (phase 1 screens 2 and 3)

- **The teacher is a presence, not a face** (`src/ui-v3/r8/Presence.tsx`): a circle with her initial and a voice ring.
  - "AI teacher" is always printed.
  - The ring is solid while she talks and faint while she listens. It breathes only when motion is allowed.
  - There is no picture. Her look stays the owner's choice.
- **The layout** (`stageLayout.ts`, `presence: true`). On a phone the PiP is gone. While a piece is up, a talk row (her circle and the caption) sits between the board and the question. The phone column is:
  - the top bar;
  - the board (the hero);
  - the talk row;
  - the question;
  - the chips;
  - the dock.

  Before, the column was the top bar, the "Picture" chip, the board with a face over it, the caption, the question, the chips and the dock, with the caption laid over the board. On wide screens her tile is one presence row, and the caption takes the side column. With nothing on the stage she holds it as a larger circle. `tests/r8-lesson-presence.test.mjs` pins these.
- **The look** (`src/ui-v3/r8/lesson.css`, only under `data-tx`):
  - The board is a paper card with a real shadow.
  - The question is in the display face, the second strongest thing on the screen, and lifts on her turn.
  - The chips are quiet pills.
  - The dock is the one "your move" colour.
  - No clipped corners, grid, mono or uppercase labels, and no glow sky.
- **Maths set as maths on the plain board** (`Board.tsx`, `mathRuns.ts`): fractions stack in STIX Two Text under the theme. Without it, the same spans read as before, and the text content is unchanged.

## Screenshots (this folder)

Each name is `<when>-<screen>-<size>.png`:
- **when:** `before` (today); `after-a` (`?tx=a`); `after-b` (`?tx=b`).
- **screen:**
  - `lesson-board`: a board up while she talks (fixture `work-beat`);
  - `lesson-turn`: a board up on her turn (`work-your_turn`);
  - `lesson-idle`: nothing up, her turn (`your_turn`).
- **size:** `p360` is 360 × 740 @2x; `d1366` is 1366 × 768.

**About the fixture data:** the board contents and lines are the dev fixtures' (`src/child/lesson/dev/DeskDev.tsx`), not a real lesson. In particular `lesson-turn` shows "1/2 = 2/4" on the board while the question asks how many quarters make one half. That is the fake scenario's data, not the product giving the answer away.

They were taken from the Kaksha Desk dev page (`src/ui-v3/kaksha/dev/desk.html?class=5&fixture=…&tx=…`, the real Desk and skin), with reduced motion on.

## Fix-ups after the main loop's review of step b (2026-11-11)

1. **The plain board fills its card:** its lines are centred and the maths is scaled to the card. Studio pieces (the drawn board) need Studio's renderer to fit content to the box and to fold the card head into the card. That ask is a patch: `docs/patches/to-studio/008-board-fills-card/`, with before and mock-after images.
2. **The "1/2" label touches the square's top line.** This is Studio's layout, reported as a fault in the same patch.
3. **The steer chips are one row, every pill one line high.** On a phone the row scrolls and fades at its end. There is no 2 × 2 grid, which would cost the board 48 px.
4. **Wide screens:** the caption holds her last lines (up to 168 px), the chips sit right under it, and the dock stays at the column's foot. The chips steer what she just said, so they belong next to her words. The dock stays where the thumb and the eye expect it on every screen. The spare height is one quiet gap above the dock, never between her words and the chips.
5. **The palette's three meaning roles:** focus is indigo, answer a bluish green, mix-up an ochre (A). This follows the Okabe-Ito colour-blind-safe set, so it no longer sets red against green. Studio is asked to read designed fill tints instead of stroke × alpha (the patch, §4).
6. **The fixture's "1/2 = 2/4"** is fake data (see "About the fixture data" above).

`after-*` images are re-taken after these fixes.

## Step c: the child home

- **Every Kaksha screen carries the switch.** `KxRoot` (kit.tsx) and `KakshaRoot` (Shell.tsx) set `data-tx`. `src/ui-v3/r8/kx.css` drops the terminal chrome on all of them:
  - the starfield sky and its grid;
  - clipped corners;
  - mono uppercase labels;
  - the "FLIGHT DECK" shell word;
  - the "»" chevron, the sweep and the breathing on the primary button.

  The shared pieces (buttons, the dock, panels, labels, headings) take the tokens. World, Hangar and the other Kaksha pages pick this up too; steps d to g dress them where they need more.
- **The home:**
  - her presence (a circle, her name, "AI teacher") replaces the face picture;
  - the greeting is in the display face;
  - one Start in the accent;
  - the dock links are quiet rectangles.

  No topic and no plan card on the home: that is the standing decision "Just start. Asha takes it from there." (main, 2026-10-10, `KakshaHome.tsx`), so the phase 1 prototype's topic card is not built.
- **The wordmark** reads "Taxila" in the markup (views.tsx, Who.tsx). The current look keeps its uppercase through CSS (`.kx-mark`), so production is unchanged.
- **Images:** `before-home*`, `after-a-home*` and `after-b-home*` (state start, and done with "One more"), from `src/ui-v3/kaksha/dev/index.html?screen=home&state=…&tx=…`.

## Step d: onboarding

- **The switch on set-up.** The StepFrame root (`src/onboarding/Layout.tsx`) carries `data-tx` and `data-tx-surface="light"`: these are the parent's screens, so they are light in both themes. The bridge also covers Kaksha roots nested inside a themed root, so the child-facing panels (her voice sample, her name) follow without touching their markup, which `tests/r11-asha-volt.test.mjs` pins.
- **What `src/ui-v3/r8/onboarding.css` removes:**
  - the carbon grid;
  - the "// " eyebrows and legend prefixes;
  - the slanted, glowing progress cells (now a thin line);
  - chamfered tiles, buttons and PIN keys;
  - corner brackets;
  - mono uppercase labels;
  - the "»" chevron and the sweep on the primary button;
  - the diamond PIN dots.
- **What is in their place:**
  - the title in the display face;
  - labels in sentence case;
  - the chosen tile in the teacher's colour;
  - one accent primary action (the 2-second hold gate keeps its behaviour).
- **Ownership:** `src/onboarding/**` is Learning's in round 7's table. The brief assigns this screen to Design, so the only edit there is the root attribute and one import. The styling lives in this stream's file.
- **Images:** `before-onb-class*`, `after-a-onb-class*` and `after-b-onb-class*` (step 1); `before-onb-promises-p360` and `after-a-onb-promises-p360` (step 2).

## Step e: the parent corner

- **The switch on the corner.** The shell root and the PIN gate (`src/parent/Shell.tsx`, `Gate.tsx`) carry `data-tx` and `data-tx-surface="light"` through `txAttrs("light")` (tx.ts). The corner is light in both themes.
- **What `src/ui-v3/r8/parent.css` removes:**
  - the HUD grid;
  - the "// " mono eyebrows (now sentence-case labels);
  - corner-bracket panels (now soft paper cards with a real shadow);
  - chamfered buttons and the four "state" chips (now rounded pills in sentence case);
  - mono dates;
  - the inset tick hovers.
- **The reading face.** Claims, headlines, the home task and letters are set in Literata. The parent's one primary action is the accent.
- **Her picture in the top bar** is hidden. Her look is the owner's choice, and the corner names her in words.
- **Ownership:** `src/parent/**` is Learning's. The brief assigns this screen to Design, so the edits there are the root attributes and one import per file. The styling is in this stream's file.
- **Images:** `before-parent*`, `after-a-parent*` and `after-b-parent*` (`-full` is the whole page; the bottom tab bar is painted once at its viewport position). Taken against `tests/e2e-design-b3-parent.mjs`'s own API fixtures, unlocked with its PIN.

## Step f: the designed fallbacks

- **The offline home.** The review's blank white page (`92-err-offline-home`) was the capture tool's own picture: headless Chromium's network-error page, taken with no service worker. On the production build with its worker (the real path: `/sw.js` serves the last good shell offline), the app boots and its gate said "Something went wrong. Try again." on a rose ring. That reads as the child's fault, and the network is not something that went wrong in the app. Now:
  - when the device reports it is offline, the gate says **"You're offline. Today's lesson needs the internet. Nothing is lost: it picks up where you left off."**, with a calm ring and one Try again;
  - when the network comes back, the shell tries again by itself (`online` event);
  - a real server failure still says the old words.

  The words apply in every look. Under `?tx=` the card is the paper state card, and the page around it takes the theme's ground (it was dark at the edges).
- **Empty stage boxes.** A Studio piece that has not drawn yet (Studio marks its box `.st-empty`) left an empty card on the stage (`100-lesson-19/20`). Under the theme, her current line fills the board card in the display face, or the question when she is not speaking, until the piece draws. There are no "making" words and no spinner: the owner's rule is never to show build state.
- **Images:**
  - `before-offline-p360`: today, with the service worker;
  - `after-current-offline-p360`: today's look with the new words;
  - `after-a-offline-p360` and `after-b-offline-p360`;
  - `before-lesson-studio*`, `before-lesson-play*`, and their `after-a-*` and `after-b-*` versions.
- **Tests:** `tests/r8-lesson-presence.test.mjs` (step f case).

## Not changed (other owners)

- **Studio's piece chrome.** The "Picture" chip, the beat dots and the 40 px band above a Studio piece are Studio's (`src/studio/**`). Under the theme only the piece's inner ring is dropped, by CSS in this stream's file. A Studio patch could fold the chip into the board card.
- **The dock's controls** (Hint, Talk, 123, Wait) are the Desk's behaviour and are unchanged. Only their dress changed.
