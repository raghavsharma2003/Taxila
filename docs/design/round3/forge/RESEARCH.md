# Round 3 · forge · RESEARCH: live-built content that is correct, varied and never broken on the site

Stream: forge (owner directive 2026-10-09: "the content which is build is cheap and basic and nonsense and in perticular style
only and when seen in the site is not viewed properly and totally broken"). Owned paths: `server/studio/**`, `src/studio/**`,
`server/forge3/**`; everything else is a patch in `patches/` (see `APPLY.md`). The audit that reproduces the complaint is in
`audit/README.md`; the numbers before and after are in `RESULTS.md`.

Labels: **[M]** measured in this stream (method and n given), **[S]** an external source (named), **[T]** read in this repo's
code or `context/`, **[U]** unmeasured / my judgement. Nothing here is a child measurement: every number is from a browser,
a script or my own reading.

---

## 0. The complaint, reproduced (short form; full catalogue in `audit/README.md`)

- **Prod walk [M]** (taxila.dev, web 145996f, 2026-10-09, 12 lessons, the child's visual ask as the 3rd turn, each view shot
  at 360 × 800, 412 × 915 and 1366 × 768): 12/12 asks put a board on the stage; **0/6 game / animation / simulation asks got
  anything the child could do** (2 of them unmounted the engine already in the tray for a static board); **12/12 boards were
  the same green chalkboard**; **7/12 boards contradicted or gave away what she said** (a number line with no ticks under "5
  equal gaps", "fraction of fraction → multiply" under "roti ke 5 equal parts", 3 groups of 3 under "3 groups of 5", halves
  and quarters under "1/3 ka ek part", a flow chart answering "Observe ke baad kaunsa step?", the answer "One lakh / Seven
  thousand / Forty" written, a label "Screen"); module engines ran out of the tray (keys "7 8 9" cut off at 360 × 800).
- **Library matrix [M]** (every catalogue piece, 382 topics × game / explainer / board, rendered in the real Desk tray +
  StudioStage at the tray boxes taxila.dev gives on those three screens, judged by `server/forge3/qa/checks.js`): **0 of
  2,280 Studio v2 game and explainer views pass** the play floors at any size (8 px type label at every size; canvas
  labels 11.9 px and targets 41 px at 360); catalogue boards fail at 360 in 381/382 (text < 14 px: an 800 × 500 board's
  words come out at 9-13 px in a 312 px box).

The three root causes, in one line each: (1) the picture is not checked against the words (the board gate checked numbers,
words, overlap and counts of drawn families, but passed vacuously when nothing was drawn); (2) the piece is a fixed
landscape world fitted into a portrait leftover box; (3) there is one look, and the request kind is not honoured.

---

## 1. How the best products and papers solve exactly this

### 1.1 Generated educational visuals fail on layout, and the fix that measured best is discrete slots + a critic on the render

- **Code2Video** (Chen, Lin, Shou, arXiv 2510.01174, 2025) [S]: agentic Manim video generation (planner → coder → critic).
  The critic is a VLM that inspects the **rendered** video beside the code with "visual anchor prompts": the canvas is
  discretised into a **6 × 6 grid of anchor points**, small elements take one anchor, large ones a region, and the critic
  looks for overlapping elements, lecture lines occluded by animation, and **large unused regions that unbalance the frame**.
  Ablation (GPT-4.1, their Table 4): removing the anchors drops aesthetics 79.0 → 69.2 and TeachQuiz 82.0 → 55.2; removing
  the critic drops them to 72.5 and 60.7. The 6 × 6 grid beat 4 × 4, 8 × 8 and free placement.
  **Transfers:** (a) layout from a closed set of positions (our templates and play arrangements already do this; free model
  coordinates are what produced the 1/11 arrow and the corner drawings); (b) judge the RENDER, not the script, at the size
  the child sees; (c) "large unused region" is a real defect class (our boards: content filling 24% of the box).
  **Does not transfer:** a VLM critic in the loop — their critic adds minutes; our live budget is 1.5-3 s.
- **TheoremExplainAgent** (arXiv 2502.19400, 2025) [S]: 93.8% of long-form theorem videos generated, but "most of the videos
  produced exhibit minor issues with visual element layout". Layout is the common residual failure even when content works.
- In this repo [T]: free generation for the live lesson was already measured and rejected (`live-free-generation`: free
  scenes 0/8-3/8 lint-clean, 11.9-18.2 s; a 13/19/148° triangle with the right labels passed a glance); generated pixels
  carry wrong counts (`generated-media-carries-facts`: Sora drew 3 + 3 apples under "3 + 4 = 7"). The live path is code
  engines and templates — the right architecture — but nothing checked that the code-drawn picture **agrees with her line**.

### 1.2 Visual QA of generated UI: screenshots over time + a checklist; deterministic checks where a model is unreliable

- **ArtifactsBench** (Tencent Hunyuan, arXiv 2507.04952, 2025) [S]: runs each generated artifact, captures **screenshots over
  time** of its interaction, and grades with an MLLM against a **per-task checklist** (10 dimensions: visual fidelity,
  interaction correctness, code). Reported 94.4% ranking consistency with WebDev Arena and ~90% pairwise agreement with
  human experts. **Transfers:** render at fixed times (we use a fake clock to judge a board at its END state and an early
  frame), and judge per checklist item, not holistically.
- **MLLM as a UI Judge** (Luera et al., arXiv 2510.08783, 2025) [S]: GPT-4o, Claude and Llama on 30 interfaces track human
  judgements on some dimensions and diverge on others. WiserUI-Bench (arXiv 2505.05026) [S]: models show limited
  understanding of how a UI affects behaviour.
- **In this repo the model judge has been measured, and it false-passes exactly the defects that matter** [T]:
  `rj-holistic-model-judge-gate`; vision judge on diagrams (MODEL-STACK): taxila-brain 3/80 false passes, kimi 8, mistral
  22/80; `rj-grok-label-judge` 8/44; `rj-w2f-bbox-label-checks` (boxes lie about overlap; sample the drawn parts).
  **Decision:** the gate is deterministic (measured rendered text px, clipping against the box, overlap between rendered
  text runs, target sizes, non-blank, composition fill, renderer errors) plus code meaning checks; a model judge may only
  ADD refusals in offline certification, never pass anything, and never runs on the child's path.

### 1.3 Responsive simulations: what a fixed design world does on a phone

- **PhET** [U: from memory of the joist/scenery code, not re-read here]: each screen is laid out in fixed `layoutBounds`
  (about 1024 × 618) and scaled uniformly to fit the window; on a portrait phone the scale is width-bound and the rest is
  empty. This is exactly Studio v2's 1000 × 625 world in a 328 × 404 tray **[M]**: the box is 324 × 202, 47% of the tray;
  labels 38 units → 12.3 px, targets 130 units → 42 px. Uniform scaling cannot meet a 14 px floor on a 360 px phone.
- **Duolingo / Rive** [S, vendor claim]: Rive's layout features let one animation adapt to screen size and orientation
  (no measured data found). **Brilliant** [S]: interactive diagrams built with an in-house parametric tool (Diagrammar,
  Strange Loop 2022); no published layout numbers found.
- **Transfers:** the world must be laid out FOR the box (the play stream's per-family arrangements, `shared/play.ts` FLOORS,
  play mode giving the world 360 × 576 at 360 × 800), never scaled into it. For today's fixed-world engines the honest move
  is to not show them where they cannot be read (device check → board twin) and to make them pass where they can (laptop).

### 1.4 Legibility and touch floors

- **WCAG 2.2** [S]: SC 2.5.8 target size ≥ 24 × 24 CSS px (AA); SC 2.5.5 ≥ 44 × 44 (AAA); text contrast 4.5:1. Apple HIG
  44 pt; Material 48 dp.
- **Children** [S]: Bernard, Chaparro, Mills & Halcomb 2002 (Behaviour & IT; n = 27, ages 9-11): 14-pt and sans-serif text
  judged easier and faster to read; no measured speed difference between 12 and 14 pt. Small n; preference, not performance.
- **Decision:** the forge gate uses the play grammar's floors (`shared/play.ts` FLOORS: text 14 px, 16 px for classes 4-5,
  targets 44 px) so a forge verdict and a play invariant mean the same thing; the device's last-line check (StudioStage)
  applies the general floors (14 px labels, 44 px targets) to the box the piece actually got and swaps a Studio v2 world
  for its board twin below them (a 360 phone tray: labels 12.3 px, targets 42 px → twin; a 412 phone: 14.3 px / 49 px →
  the game). The classes 4-5 floor (16 px) is judged and reported, not swapped on: a slightly small game that can be
  played beats a still board.

### 1.5 "The picture must say what she says": nobody publishes this for live tutors; it is ours to check

- Code2Video's critic and ArtifactsBench's checklists judge layout and interaction, not whether a drawing agrees with a
  sentence spoken over it. In this repo, W8 (equal-part families match her counts) and board-first (her line written from
  the board's facts row) were the right idea [T], but the audit shows the gaps: W8 passed vacuously when nothing was drawn
  and accepted 9 as 3 × 3 for "3 groups of 5" [M].
- **Decision (wb-gate@3, `server/studio/qa/semantics.js`):** W10 every count she attributes to the screen is drawn (equal
  parts, number-line gaps from the ticks actually drawn, groups and what each holds); W11 a board shows an idea (not only
  medium words like "Screen" or generic words like "fraction of fraction multiply"); W12 when she asks what follows X the
  board does not draw X's successor; W13 the fractions the board names include one she names; W9+ a current item's word
  answer of any length is withheld; W14 (shares a word with her line) is ADVISORY only (see §4).

### 1.6 Variety without randomness

- Design tokens as data (W3C design-tokens format) and art directions as palettes behind one style interface [S: live-tech
  concept §3.5; play DESIGN §4]. The whiteboard renderer already has three designed grounds (chalk, paper, grid) [T] and
  never used two of them [M]. The play stream picks among four art directions with `pickArt` (child choice, topic fit,
  class 4-5 light grounds, never the same twice in a row) [T].
- **Decision:** boards get one ground per lesson by subject and band, varied across lessons (`server/forge3/art.js`);
  composed play pieces use `pickArt` with the lesson's last art (`server/forge3/compose.js`).

### 1.7 Words at screen size, geometry at world size (how maps solve "the picture is too big for the screen")

- **Web maps** [S: Mapbox GL / MapLibre style specification, `text-size` is in screen pixels and symbol labels are placed
  with collision detection after the geometry is projected; the same idea is classic cartographic label placement]: when a
  map is shown smaller, roads and coastlines shrink, the place names do not; a label that would collide is dropped or
  moved, never shrunk below its size. **Transfers:** a whiteboard on a 324 px phone box should scale its drawing and keep
  its words at the floor, and a layout that would make words collide is not used (`src/studio/boardFit.ts`: same ops, same
  sizes, coordinates × f, accepted only when the overlap and crossing counts do not rise). **Does not transfer:** dropping
  labels — on a teaching board every word is content, so a board with no clean layout is shown as drawn and counted.
- Measured on this repo's boards [M, pure code over 382 catalogue first beats + the 20 taxila.dev boards, 2026-10-09]:
  boards whose smallest word is under 14 px fall from 312/402 to 61/402 at the 360 phone box and from 271 to 36 at 412;
  none gains an overlap or a crossing; 1.7 ms per board. Rendered check of the same boards: `RESULTS.md` §2.

---

## 2. What transfers to a Hindi-English voice tutor for 9-15 year olds in India, on Azure only

- **Phones first.** 360-412 CSS px wide is the target device [T: DESIGN-V3; U for the exact Indian distribution]; every
  judged size starts there. The laptop (1366 × 768) is judged too because parents' laptops exist and the wide Desk differs.
- **Hinglish lines over English boards** make word-overlap checks unreliable [M: W14 flagged 69/234 real boards, including
  on-topic ones like "paani garam hokar upar jaata hai" over "evaporates"]; meaning checks are built on numbers, counts and
  structure, which survive code-switching.
- **Azure only.** No third-party judge or render service. Chromium runs in an isolated container (the existing `studio-qa`
  pattern: untrusted environment, no secrets, egress denied) — `server/forge3/qa-service.mjs` follows it. The advisory model
  judge, when used offline, is `taxila-brain` (Azure, the repo's measured best of the tried judges; still advisory).
- **Quotas are maxed.** Nothing in the forge3 live path calls a model. A 429 cannot break it; a QA service that is down
  means "not judged", which means the certified library / board / voice rung shows, never an unjudged piece.

---

## 3. The design chosen (and where each part lives)

| layer | what it does | where | on the child's path? |
|---|---|---|---|
| Meaning gate | W0-W13 on every live board against her real line (pure code, < 2 ms over W0-W9) | `server/studio/qa/whiteboard.js`, `semantics.js` | yes (unchanged call sites) |
| Camera | the stage frames a board's drawn content (≤ 2× zoom, never crops an op, never a `continue` board) | `src/studio/boardView.ts`, `StudioStage.tsx` | yes |
| Board laid out for the box | on the child's box, a board's GEOMETRY scales while its WORDS keep their size (the map-label rule), kept only when as clean as the original (no new overlap, nothing outside, no word newly crossed by a line); a continue board reuses its fresh board's transform | `src/studio/boardFit.ts`, `StudioStage.tsx` | yes (pure, 1.7 ms per board) |
| Live play piece | an interactive ask → compose()'s ladder → the play stream's own session start (coverage entry, solver-checked level, pickArt) → a `PlayArtifact` with its board twin on the Studio slot, the same turn; the art is checked against the play certificate | `server/forge3/live.js`, `server/studio/seam.js composeAsk/slotFor` + patch 03 | yes (no model call) |
| Device check | the child's own box decides: a Studio v2 world below 14 px labels / 44 px targets, or a play level whose layout refused the box, shows its board twin (16 px young floor judged, not swapped on); a box that later grows retries the piece | `src/studio/twinBoard.ts`, `StudioStage.tsx` | yes |
| Lesson chrome | in the lesson stage, Studio v2's dev label, duplicate captions and score / streak pills are not shown; goal and readouts get a 14 px floor | `src/studio/studio.css` + patch 01 (data-key) | yes |
| Render-and-judge | real Desk tray + StudioStage in Chromium at 360 × 800 / 412 × 915 / 1366 × 768 tray boxes, fake clock, measured checks Q1-Q7 on DOM, SVG and canvas text (`canvasTextProbe` records every `fillText` with its rendered box) | `server/forge3/qa/*` | no (offline / QA service) |
| Empty tray given back | a Studio slot that ends with nothing to show (board refused / failed, piece retired) emits `empty`; the Desk drops the studio tray instead of an empty white box | `StudioStage.tsx` + patch 07 | yes |
| Certificates | the library judged per size; a piece broken at every size is never served | `server/forge3/certify.js`, `certs/` | read at reveal (patch 05) |
| Composition | interactive ask → play level (if the skill is admitted) → certified game → keep the engine in the tray → board → voice; picture ask → board → certified explainer → voice; art rotates | `server/forge3/compose.js`, `art.js` + patch 03 | yes (pure) |
| Board variety | one ground per lesson by subject and band, varied across lessons | `server/forge3/art.js`, `server/studio/seam.js` | yes |
| Frame fit | an engine taller or wider than its frame is scaled to fit (≥ 0.75), else scrolls; never cut off | patch 02 (`src/modules/frame/fit.ts`) | yes |

The play stream's grammar is where the games come from (`shared/play.ts`: code-generated, solver-checked levels in four
families, four art directions, laid out for the real box). forge does not author levels, keys, child-visible words or art
outside that list (GRAMMAR §1); it chooses which admitted family / mode / art to put up, judges it at the child's size, and
falls back down the ladder when it does not pass. `FOR-PLAY.md` lists what forge needs from play (registration of
`PlayStage` in the Studio renderer registry, the coverage file, a level generator entry point).

---

## 4. What was tried or considered and rejected

1. **A model judge as the gate** — rejected on this repo's own measurements (§1.2): it false-passes wrong labels and
   counts. Kept only as an offline, refusal-only signal.
2. **Refitting board coordinates on the server** (scale and translate the ops to fill the board) — breaks "continue" boards:
   a worked example draws its next script on the previous board, matched by board size
   (`src/modules/whiteboard/StudioWhiteboard.tsx priorFor`). The camera on the client gets the same gain with the script
   untouched.
3. **W14 "the board shares a word with her line" as a hard check** — 69/234 real boards flagged, with false refusals across
   Hindi and English ("upar jaata hai" vs "evaporates", "one-third" vs "1/3"). Kept as an advisory logged with the gate.
4. **Shrinking fonts to fit** a 16:10 world into a phone tray — below the floor is unreadable; the fix is a layout for the
   box (play) or a different representation (board twin), never a smaller font.
5. **Rotating the phone to landscape for 16:10 engines** — it would give 576 × 360 boxes, but it needs the Desk to hide the
   card, dock and face, which the play stream's play mode already does in portrait with a world laid out for the box; two
   competing "full screen" modes would confuse a child.
6. **A Chromium render of every live board before it shows** — the board lateness bar is 1.5 s p90 and boards ride the turn
   response; the gate's pure-code geometry (W1, overlap, inside-board) plus the camera cover layout, and the render-and-judge
   layer certifies the producers (templates, catalogue) offline and samples live boards.
7. **Hiding the whole Studio v2 HUD in the lesson** — it also carries the task readout ("CUT THE BAR 1/4"); only the score
   and streak keys (chain, combo, streak, accuracy, precision, time) are hidden, by key (patch 01 puts the key on the DOM).
9. **Rendering every play level in Chromium on the server before it shows** — the levels are generated per child (seeded
   by child, entry and counter), so they cannot all be pre-rendered, and the web image carries no browser (the production
   image copies server, shared, data, src, dist only). Chosen instead: certify the play stream's levels AS SERVED (every
   coverage entry, the levels the play server's own picker returns for fresh children, in every art, at the three
   play-mode sizes: `server/forge3/play-cert.js`), refuse an art that failed, and let the device's own box decide the rest
   (the play renderer refuses a box it cannot lay out; the stage shows the twin). A per-level live render remains possible
   through the QA service (`gate.js`) once it is deployed; it is not on the child's path today. This is sampling, not proof:
   a level shape the sample never produced is judged only by the device.
10. **A first-frame judge on the child's device** (measure the mounted piece with the same checks before revealing it) —
    designed but NOT built this round: the board path already predicts its own legibility exactly in code (boardFit), the
    Studio v2 and play paths already step down by box, and a DOM measure on low-end phones (elementsFromPoint over every
    text run) has not been timed on a real device. Reversal: a device-side defect the offline QA did not predict.
11. **Fitting boards on the server** (send a phone layout and a laptop layout) — the server does not know the child's box
    (the client never reports it), and two scripts double what the gate must check and the wire must carry. The client
    lays the ONE gated script out for its own box with a transform that changes no op's meaning (same ops, same order, same
    words, same sizes; only coordinates scale).
8. **Keyword topic maps for "coverage"** — already logged by the live-tech concept as meaningless (385/385 "covered"); the
   honest measure is "a piece the child can use, at their size, that agrees with her words".
