# Direction B: "Night class"

The dark ground of today's app, kept and calmed. It is a single blue-grey family with no pure black, and the terminal affectations are gone: no slash labels, no grid background, no clipped corners, no chevrons and no monospace. The board is a luminous slate with chalk-white strokes. Its meaning colours glow faintly. Lime ("volt") appears only when it is the child's move. The parent's screens (the parent corner and onboarding) are light.

Screens: `home.html`, `lesson-board.html`, `lesson-turn.html`, `lesson-worked.html`, `game.html`, `parent.html`, `onboarding.html`, `offline.html`. They have the same markup, words, board drawings and zones as direction A (`../content.js`, `../layout.css`). This direction's own files are `tokens.css` (every value, including the light parent set under `.parent`) and `skin.css`.

## The argument

**Who it suits.** It suits the older child, 11 to 15, who likes the current look. DESIGN-V3's research found that tweens read dark mode as grown-up, and the apps they respect (Spotify, Discord, games) are dark. It suits the board as a stage. Coloured strokes on a dark slate glow, and that is the 3Blue1Brown look the owner named. It suits evening lessons, which is when most of these children study. It is the smaller change: the layout, the tokens' shape and most component CSS stay. The work is mainly removal.

**Where it is weak.**
- **There are two looks.** The child's app is dark and the parent's is light, because a parent reading a weekly report in grey on black will not read it (fault 3 in the review). Two themes are better than three skins, but they are still two, and the hand-over between them (for example, a parent opening the lesson report from a child's phone) is a visible change. That is fault 5 in a smaller form.
- **It stays cold.** The teacher's warmth has to come from her voice and words. The screen gives her almost nothing: indigo on blue-grey is calm, not warm. On a budget phone in a bright room the dark ground loses contrast on its secondary text first, even though every pair measures at 5 : 1 or better.
- **The lime is loud.** Used once per screen it works well: the listening dock on "Your turn" is unmissable. But it is also the home screen's start button and the game's "harder one" button, so the rule ("only your move") needs a lint to survive phase 2.
- **It looks like what the owner has already seen.** The owner's October complaint was about a different build. But a dark build that looks like a calmer release 16 may not register as the revamp the owner asked for.

**What it costs to build** (phase 2, in order):
1. Tokens. `src/ui-v3/kaksha/tokens.css` keeps its shape (`--k-*`), and its values are cut to this set. Today there are 351 colours across the app; this set has 27. Space Grotesk is replaced by Bricolage Grotesque for display. Atkinson Hyperlegible Next, Literata and Mukta are already self-hosted in `public/fonts/`. STIX Two Text and Bricolage Grotesque (both OFL) are added.
2. Chrome. In `src/ui-v3/kaksha/futurist.css` the grid, the clipped corners (`clip-path` polygons, also in `kaksha.css`, `kit.css`, `nav.css`, `desk.css` and `parent.css`), the chevrons and the mono eyebrows are deleted. `src/ui-v3/kaksha/copy.ts` drops the 22 `//` labels.
3. The lesson. `src/child/lesson/desk.css`, `src/ui-v3/kaksha/lesson/desk.kaksha.css` and `stage.css` take the zones from `../layout.css`. That cuts the phone lesson from seven zones to five, with the question as the second strongest thing on screen. The teacher picture (stream D, `src/ui/teacher/**`) becomes the circle with the voice ring, by patch to D.
4. The board (stream C1, by patch). `shared/whiteboard.js` `kakshaBoardSkin()` already reads its colours from Kaksha tokens. It gains the slate ground and the glow. Its roles are kept, with `--k-look` (amber) for the mix-up and `--k-secure` (mint) for the answer. `numFont` changes from mono to `--font-math` (STIX Two Text), and `DIGIT_ADVANCE` is re-measured. `server/forge/explainer/templates.js` emits fractions through the stacked `numwork fraction` layout, which `src/modules/whiteboard/Player.tsx` already draws.
5. The parent corner. `src/parent/parent.css` becomes the light set under `.parent`, in Literata for reading. This is the largest single change in B, because the corner is dark today.
6. The classic skin is retired, and the lints change as in A.

My estimate is five commits, with about 1,100 lines of CSS changed and about 900 deleted. The same two patches go to C1 and D.

## Tokens

All of them are in `tokens.css`:
- **Type:** 8 sizes (14, 16, 18, 21, 26, 32, 44, 60 px).
- **Space:** one scale (4, 8, 12, 16, 24, 32, 48, 64).
- **Corners:** 3 radii (6, 12, 999).
- **Depth:** lightness steps on dark, plus one board shadow and one glow radius.
- **Motion:** 3 durations and two easings.

Fonts: Atkinson Hyperlegible Next (UI), Bricolage Grotesque (display), Literata (parent reading), STIX Two Text (maths), Mukta (Devanagari). All five are under the SIL Open Font Licence.

| role on the board | token | shape that goes with it |
|---|---|---|
| the part being talked about | `--focus` (the teacher's ion indigo) | solid outline, tint, faint glow |
| the answer | `--ans` (mint) | a dashed box while open; a tick once accepted |
| a mix-up | `--mix` (amber; never red, never a verdict) | always dashed |
| your move | `--move` (volt lime) | at most one element per screen |

<!-- contrast:start -->
Measured by `tools/contrast.mjs` from `b-night/tokens.css` (WCAG 2.x relative luminance; 2026-11-10). Colours in the token file: **27** (27 hex values). Pairs below their minimum: **0**.

| where | pair | used for | ratio | minimum | result |
|---|---|---|---|---|---|
| child | `--ink` #EEF1F6 on `--bg` #0F1218 | headings, body on the ground | 16.56 : 1 | 5 | pass |
| child | `--ink` #EEF1F6 on `--surface` #171B24 | body on cards | 15.22 : 1 | 5 | pass |
| child | `--ink-2` #B4BBC9 on `--bg` #0F1218 | secondary text on the ground (caption, notes) | 9.72 : 1 | 5 | pass |
| child | `--ink-2` #B4BBC9 on `--surface` #171B24 | secondary text on cards | 8.94 : 1 | 5 | pass |
| child | `--ink-2` #B4BBC9 on `--surface-2` #1E2330 | dock status line | 8.14 : 1 | 4.5 | pass |
| child | `--ink-3` #9098AA on `--bg` #0F1218 | inactive tab labels (14 px) | 6.48 : 1 | 4.5 | pass |
| child | `--ink-3` #9098AA on `--surface` #171B24 | inactive tab labels on the bar (14 px) | 5.96 : 1 | 4.5 | pass |
| child | `--on-accent` #0F1218 on `--accent` #CBFF4D | primary button label | 16.03 : 1 | 4.5 | pass |
| child | `--on-move` #0F1218 on `--move` #CBFF4D | listening dock text | 16.03 : 1 | 4.5 | pass |
| child | `--move-text` #CBFF4D on `--surface` #171B24 | the "Your turn" label | 14.73 : 1 | 4.5 | pass |
| child | `--tutor` #8F9BFF on `--tutor-soft` #252B4A | the teacher's initial | 5.45 : 1 | 4.5 | pass |
| child | `--board-ink` #F3F1EA on `--board-bg` #131B26 | board chalk/ink, numbers | 15.33 : 1 | 5 | pass |
| child | `--board-ink` #F3F1EA on `--focus-fill` #283260 | numbers inside the focus area | 10.83 : 1 | 4.5 | pass |
| child | `--board-soft` #8F9CAE on `--board-bg` #131B26 | soft board labels | 6.21 : 1 | 4.5 | pass |
| child | `--focus` #8F9BFF on `--board-bg` #131B26 | the part being talked about | 6.85 : 1 | 4.5 | pass |
| child | `--ans` #4FE0A2 on `--board-bg` #131B26 | the answer | 10.32 : 1 | 4.5 | pass |
| child | `--ans` #4FE0A2 on `--ans-fill` #133A2D | the answer inside its box | 7.49 : 1 | 4.5 | pass |
| child | `--mix` #FFB54A on `--board-bg` #131B26 | the mix-up note | 9.86 : 1 | 4.5 | pass |
| child | `--ink-2` #B4BBC9 on `--board-bg` #131B26 | legend and step text on the board | 8.98 : 1 | 4.5 | pass |
| parent (light) | `--ink` #15171C on `--bg` #F6F6F2 | parent body on the ground | 16.55 : 1 | 5 | pass |
| parent (light) | `--ink` #15171C on `--surface` #FFFFFF | parent body on cards | 17.93 : 1 | 5 | pass |
| parent (light) | `--ink-2` #474C57 on `--bg` #F6F6F2 | secondary text | 7.95 : 1 | 5 | pass |
| parent (light) | `--ink-2` #474C57 on `--surface` #FFFFFF | secondary text on cards | 8.61 : 1 | 5 | pass |
| parent (light) | `--ink-3` #474C57 on `--surface` #FFFFFF | inactive tab labels (14 px) | 8.61 : 1 | 4.5 | pass |
| parent (light) | `--on-accent` #FFFFFF on `--accent` #3F4FD8 | primary button label | 6.32 : 1 | 4.5 | pass |
| parent (light) | `--ink` #15171C on `--tutor-soft` #E6E8FB | selected option label | 14.77 : 1 | 5 | pass |
| parent (light) | `--tutor` #3F4FD8 on `--surface` #FFFFFF | speaker icons, selection ring | 6.32 : 1 | 4.5 | pass |
| parent (light) | `--ok` #0B7D55 on `--bg` #F6F6F2 | evidence tick | 4.75 : 1 | 4.5 | pass |
<!-- contrast:end -->

## Motion

| what moves | how long | easing | when |
|---|---|---|---|
| **An answer accepted (built, `lesson-worked.html`).** The child's ⅓ pin drops onto the mark from 28 px above and settles with a slight overshoot. A glow of the answer colour swells from it and fades, the label fades up, and the tick draws itself | pin 420 ms; label 240 ms after 200 ms; glow 520 ms; tick 260 ms after 380 ms; about 650 ms in all | pin `cubic-bezier(.2,.9,.25,1.18)` (settle); the rest `cubic-bezier(.22,.7,.2,1)` | the moment her answer is classified correct against the key |
| the teacher's voice ring | 1.6 s loop | ease-out | while she talks |
| the listening level bars | 900 ms, alternate | ease-in-out | while the child may speak |
| a board appearing (not built here: see A) | about 1.8 s | ease-out | |

There is no confetti, no sound effect and no score. The glow is the whole celebration. Under `prefers-reduced-motion: reduce` every animation is off and the accepted state is shown at once.
