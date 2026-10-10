# U1 · gamified app directions: RESULTS

**Stream:** U1. **Branch:** `claude/r4-app-design`. **Updated:** 2026-10-10.

**Owns:** `docs/design/round4/app/**`. This file and `context/inbox/r4-app.json` are the stream's reporting files.
No product code was touched, so the npm gates do not apply. No patch requests were made.

## Done

- **Three interactive, offline prototypes** of the full session-first journey, each one self-contained HTML file
  (about 1.3 MB with subset fonts, the lamp1 Asha layers and the game stills inlined):
  - `docs/design/round4/app/kaksha/index.html`: A, dark game client and orbit world;
  - `docs/design/round4/app/nagar/index.html`: B, daylight isometric city of ideas;
  - `docs/design/round4/app/chhaap/index.html`: C, riso print studio with block-print stamps.
- **Each prototype covers:**
  - Open: her face, her name, one Start.
  - Intake in duplex: "aaj school mein kya hua?", the child's words, the topic mapped to the syllabus, and a plan.
  - The lesson board inking beat by beat in step with her caption, then a checkpoint answered on the board, with a
    right path and a look-again path.
  - The Antariksh launch: a live build recipe, hold-to-launch, a transition, then in game.
  - Session end: what you did, what became secure and what it opened, tomorrow.
  - The world, with a yesterday/today toggle and collections opened only by secured skills.
  - The parent view.
  - All of it in Hinglish, हिंदी and English, at 360x800 and 1366x768.
- **Shots:** 12 states × 2 viewports per direction, in `<dir>/shots/`.
- **Compare document:** `docs/design/round4/app/COMPARE.md`, with one screen per direction, best-at, risks, the judge
  tables, the lint table and a recommendation.
- **Harnesses** in `docs/design/round4/app/_src/`: `build.mjs`, `shoot.mjs`, `lint.mjs` and `judge.mjs`.

## Numbers

**Lint** (`_src/lint.mjs`): 48 page states per direction (8 states × 3 languages × 2 viewports), Playwright
Chromium, 2026-10-10.

| finding | before | after |
|---|---|---|
| text < 14 px | 12 / 12 / 12 | 0 / 0 / 0 |
| Devanagari < 16 px | 4 / 0 / 0 | 0 / 0 / 0 |
| touch targets < 44 px | 48 / 48 / 48 | 0 / 0 / 0 |
| contrast fails | 54 / 126 / 72 | 0 / 0 / 0 |
| overflow pages | 0 / 0 / 6 | 0 / 0 / 0 |

Each cell reads Kaksha / Nagar / Chhaap. The "before" contrast counts include an approximation error in the first
lint (translucent gradient stops guessed against grey), which was fixed in the same change.

**Model judges** (ADVISORY, not children): `taxila-brain` (GPT family) and `taxila-kimi26` (Kimi K2.6), blind,
n = 5 per judge per direction plus n = 5 three-way rankings per judge, 2026-10-10, 0 errors.
- **Ranking:** Kaksha was first overall in 10 of 10 rankings and coolest to a 12-year-old in 10 of 10.
  - Most premium: Nagar 6 of 10, Kaksha 4 of 10.
  - Least childish: Kaksha 7, Nagar 2, Chhaap 1.
- **Absolute scales** saturate at about 4 / 5. Full table in COMPARE.md.
- **"Childish ≤ 1"** is met only by Kaksha with the GPT judge (1.00 ± 0). Every other cell is 1.2-1.8.

## Not met, or not measured

- **Childish ≤ 1 on both judges:** not met by any direction. Kaksha with Kimi is 1.40 ± 0.49.
- **No child and no owner** has judged anything. The cheap child test (TEARDOWN §3.2) is recommended before scale.
- **No real phone and no frame rate** were measured. The prototypes use a canvas starfield (Kaksha), an SVG diorama
  (Nagar) and backdrop blur (Kaksha, Nagar), whose cost on a ₹10k phone is unknown.
- **No motion clip.** Headless Playwright video blacked out about 30 s of the flow, so I removed it. The motion is
  in the prototypes.
- **The game is a still**, and **Asha is a light DOM puppet** over the lamp1 layers, not TxPuppet.
- **No generated art.** All world art is code-drawn: canvas, SVG and CSS. The Azure image models were not called.
- **Weaknesses the judges named for all three:** the phone lesson board looks static below the line, and the intake
  and end screens are text-dense. These go into BUILD-SPEC for the chosen direction.

## Owner decisions needed

1. **Pick a direction:** A Kaksha, B Nagar or C Chhaap. My recommendation is A, with an optional B-style
   buildable settlement on Kaksha's planet (see COMPARE.md).
2. **Whether to run the five-second child test first,** before the wave-3 build: 20 class 4-5 and 20 class 7-8
   children, with girls included.

## Next (after the pick)

Write `docs/design/round4/app/BUILD-SPEC.md` for the chosen direction, mapped onto `src/app`, `src/child`,
`src/parent`, `src/onboarding`, the `<Teacher>` slot, the Desk and `src/play`. It will cover screens, components,
tokens, motion specs, what changes and what stays, and which stream owns each part.
