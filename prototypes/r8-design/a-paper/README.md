# Direction A: "Paper and ink"

A warm off-white ground. The board is a sheet of paper with a real shadow under it. Text is deep ink. There is one warm accent, marigold, for the primary action and for "your move", and indigo for the teacher. Headings and the parent corner are set in a serif. The whole app, child and parent, uses one light theme.

Screens: `home.html`, `lesson-board.html`, `lesson-turn.html`, `lesson-worked.html`, `game.html`, `parent.html`, `onboarding.html`, `offline.html`. Open any of them from disk; they need no server. The words, icons and board drawings come from `../content.js`, which direction B shares. The zones and grids come from `../layout.css`, also shared. This direction's own files are `tokens.css` (every value) and `skin.css` (surfaces, shadows, the one built transition).

## The argument

**Who it suits.** It suits parents, who are the people who pay and who read the weekly report. The parent corner is the same theme as the child's app, so nothing changes when the phone is handed over. It suits children who do long lessons, and lessons in bright rooms: Indian homes in the afternoon, on budget phones with dim screens. Light grounds read better than dark ones in daylight. It suits the board most of all. The lesson is the board, and maths on paper is what every child has seen in a good textbook. Fractions set in STIX Two over a paper ground look like a well-made NCERT page, not a terminal or a toy. The owner's bar is Brilliant and 3Blue1Brown. Brilliant is light, and its look comes from typesetting and restraint, which this direction copies.

**Why it does not read young.** The usual light kids' app has a saturated background, rounded bubbly type, big illustrations and many colours. This direction has none of them. The ground is near-neutral paper. Headings are in a book serif (Source Serif 4). There is a single accent, and there are no illustrations except the board. The teacher is a 44 px initial in a circle. The test in the brief is whether a 13-year-old would be embarrassed to be seen using it. The closest things they already use are a school textbook, Notion and Apple's Books. None of these is childish.

**Where it is weak.**
- It is the bigger change from what is built. Every Kaksha surface is dark today, and older children who liked the dark "instrument" look lose it. DESIGN-V3's research (F4) says tweens read dark mode as grown-up. This direction bets that typesetting and restraint read as grown-up too. That bet should be checked with children before phase 2 is finished (`docs/design/reset/DESIGN-V3.md` §15 lists the test).
- Marigold is a narrow colour. It carries black text well (8.35 : 1), but it cannot carry text on paper itself, so the "Your turn" label uses a darker marigold token (`--move-text`). The design depends on that one accent staying rare. A second warm colour on any screen would start to look like a children's app.
- The games keep their dark blueprint look. A dark stage on a light page is the most contrasty moment in the app. It reads well, as a window onto the game, but the game screens will always feel like a different room.
- Shadows cost a little paint on cheap phones. There are two shadow tokens, and neither animates.

**What it costs to build** (phase 2, in order):
1. Tokens. `src/ui-v3/kaksha/tokens.css` (309 lines) is replaced by this token set, with the `--k-*` names kept as aliases, so components change in one place. `src/ui-v3/kaksha/tokens.ts` mirrors it. Fonts: Atkinson Hyperlegible Next and Mukta are already self-hosted in `public/fonts/`. Source Serif 4 and STIX Two Text (both OFL) are added as woff2 files. Space Grotesk is retired.
2. Chrome. Four files carry the terminal affectations: the `clip-path` corners, the grid background, the slash labels and the chevrons. They are `src/ui-v3/kaksha/futurist.css`, `kaksha.css`, `kit.css` and `nav.css`, and they also carry the dark surfaces. `futurist.css` is deleted, and the other three are rewritten against the tokens. `src/ui-v3/kaksha/copy.ts` drops the `//` eyebrows.
3. The lesson. `src/child/lesson/desk.css` and `src/ui-v3/kaksha/lesson/desk.kaksha.css` + `stage.css` take the zones from `../layout.css`. On a phone that is the board, then the caption with the teacher's circle, the question, three steer chips and the dock. On a wide screen it is the board and question bar on the left and the teacher, steps, chips and dock on the right. The teacher picture in `src/ui/teacher/**` (stream D) becomes the circle with the voice ring. That change goes by patch to D.
4. The board (stream C1, by patch under `docs/patches/to-studio/`). `shared/whiteboard.js` `kakshaBoardSkin()` maps its ink roles onto this direction's meaning colours: `accent` becomes `--focus`, `good` becomes `--ans` and `mark` becomes `--mix`, on the paper ground. Its `numFont` changes from the mono face to `--font-math`, and `DIGIT_ADVANCE` (0.6, measured for mono) is re-measured for STIX Two. `src/modules/whiteboard/Player.tsx` already draws the `numwork` layout `fraction` as a stacked fraction. `server/forge/explainer/templates.js` must emit fractions through that layout, not as a one-line text op (today's "1/2 × 1/2 = 1/4"). The `PAPER` palette in `src/modules/whiteboard/palette.ts` is already close to this direction: same ground family, a blue accent, a green "good" and an orange "mark".
5. The parent corner. `src/parent/parent.css` (399 lines) is restyled in the reading face. It stays in the one theme. Its content does not change.
6. The classic skin is retired: `?ui=classic` and its CSS are removed. The UI lints in `tests/ui-v2-lint.test.mjs` and `tests/ui-v3-lint.test.mjs` change to these rules: token values only, 8 sizes, 3 radii, no `clip-path` and no `//` labels.

My estimate is six commits, with about 1,600 lines of CSS rewritten and about 900 deleted. One patch goes to C1 (the board) and one to D (the teacher circle).

## Tokens

All of them are in `tokens.css`:
- **Type:** 8 sizes (14, 16, 18, 21, 26, 32, 44, 60 px).
- **Space:** one scale (4, 8, 12, 16, 24, 32, 48, 64).
- **Corners:** 3 radii (8, 16, 999).
- **Shadows:** 2.
- **Motion:** 3 durations and one easing.

Fonts: Atkinson Hyperlegible Next (UI), Source Serif 4 (headings, questions, the parent corner), STIX Two Text (maths), Mukta (Devanagari). All four are under the SIL Open Font Licence and can be self-hosted.

Colour carries meaning on the board, and the same roles appear in the legend under it:

| role | token | shape that goes with it |
|---|---|---|
| the part being talked about | `--focus` (the teacher's indigo: she is pointing at it) | solid outline and a tint |
| the answer | `--ans` (green) | a dashed box while it is open; a tick once accepted |
| a mix-up | `--mix` (rust; never red, never a verdict) | always dashed |

<!-- contrast:start -->
Measured by `tools/contrast.mjs` from `a-paper/tokens.css` (WCAG 2.x relative luminance; 2026-11-10). Colours in the token file: **18** (17 hex values and 1 shadow tint). Pairs below their minimum: **0**.

| where | pair | used for | ratio | minimum | result |
|---|---|---|---|---|---|
| child | `--ink` #1C1A16 on `--bg` #F4EFE6 | headings, body on the ground | 15.17 : 1 | 5 | pass |
| child | `--ink` #1C1A16 on `--surface` #FFFDF8 | body on cards | 17.09 : 1 | 5 | pass |
| child | `--ink-2` #4B453C on `--bg` #F4EFE6 | secondary text on the ground (caption, notes) | 8.28 : 1 | 5 | pass |
| child | `--ink-2` #4B453C on `--surface` #FFFDF8 | secondary text on cards | 9.32 : 1 | 5 | pass |
| child | `--ink-2` #4B453C on `--surface-2` #EBE4D7 | dock status line | 7.50 : 1 | 4.5 | pass |
| child | `--ink-3` #655E53 on `--bg` #F4EFE6 | inactive tab labels (14 px) | 5.59 : 1 | 4.5 | pass |
| child | `--ink-3` #655E53 on `--surface` #FFFDF8 | inactive tab labels on the bar (14 px) | 6.30 : 1 | 4.5 | pass |
| child | `--on-accent` #1C1A16 on `--accent` #EFA52E | primary button label | 8.35 : 1 | 4.5 | pass |
| child | `--on-move` #1C1A16 on `--move` #EFA52E | listening dock text | 8.35 : 1 | 4.5 | pass |
| child | `--move-text` #7E4C00 on `--surface` #FFFDF8 | the "Your turn" label | 7.07 : 1 | 4.5 | pass |
| child | `--tutor` #3B47B0 on `--tutor-soft` #E2E4F5 | the teacher's initial | 6.13 : 1 | 4.5 | pass |
| child | `--board-ink` #1C1A16 on `--board-bg` #FFFDF8 | board chalk/ink, numbers | 17.09 : 1 | 5 | pass |
| child | `--board-ink` #1C1A16 on `--focus-fill` #DCE0F5 | numbers inside the focus area | 13.26 : 1 | 4.5 | pass |
| child | `--board-soft` #6F675B on `--board-bg` #FFFDF8 | soft board labels | 5.48 : 1 | 4.5 | pass |
| child | `--focus` #3B47B0 on `--board-bg` #FFFDF8 | the part being talked about | 7.61 : 1 | 4.5 | pass |
| child | `--ans` #1C7348 on `--board-bg` #FFFDF8 | the answer | 5.75 : 1 | 4.5 | pass |
| child | `--ans` #1C7348 on `--ans-fill` #DAEEE1 | the answer inside its box | 4.81 : 1 | 4.5 | pass |
| child | `--mix` #A84B22 on `--board-bg` #FFFDF8 | the mix-up note | 5.59 : 1 | 4.5 | pass |
| child | `--ink-2` #4B453C on `--board-bg` #FFFDF8 | legend and step text on the board | 9.32 : 1 | 4.5 | pass |
| parent | `--ink` #1C1A16 on `--bg` #F4EFE6 | parent body on the ground | 15.17 : 1 | 5 | pass |
| parent | `--ink` #1C1A16 on `--surface` #FFFDF8 | parent body on cards | 17.09 : 1 | 5 | pass |
| parent | `--ink-2` #4B453C on `--bg` #F4EFE6 | secondary text | 8.28 : 1 | 5 | pass |
| parent | `--ink-2` #4B453C on `--surface` #FFFDF8 | secondary text on cards | 9.32 : 1 | 5 | pass |
| parent | `--ink-3` #655E53 on `--surface` #FFFDF8 | inactive tab labels (14 px) | 6.30 : 1 | 4.5 | pass |
| parent | `--on-accent` #1C1A16 on `--accent` #EFA52E | primary button label | 8.35 : 1 | 4.5 | pass |
| parent | `--ink` #1C1A16 on `--tutor-soft` #E2E4F5 | selected option label | 13.77 : 1 | 5 | pass |
| parent | `--tutor` #3B47B0 on `--surface` #FFFDF8 | speaker icons, selection ring | 7.61 : 1 | 4.5 | pass |
| parent | `--ok` #1C7348 on `--bg` #F4EFE6 | evidence tick | 5.10 : 1 | 4.5 | pass |
<!-- contrast:end -->

## Motion

| what moves | how long | easing | when |
|---|---|---|---|
| **A board appearing (built, `lesson-board.html`).** Strokes draw in the order she talks about them: the frame, the half line, the quarter line, the focus outline, the brace. Fills and labels fade up 6 px as their stroke finishes; the equation comes last | each stroke 700 ms, 140 ms apart; fades 320 ms; about 1.8 s in all | `cubic-bezier(.22,.7,.2,1)` (fast start, soft landing) | when a board arrives, timed to her first clause |
| the teacher's voice ring | 1.6 s loop, scales to 1.1 and fades | same | while she talks |
| the listening level bars | 900 ms, alternate | ease-in-out | while the child may speak |
| an answer accepted (not built here: see B) | 400 ms | same | |

Nothing bounces, and nothing celebrates. Under `prefers-reduced-motion: reduce` every animation is off and the board is drawn complete.
