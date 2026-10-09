# LIVE-TECH: Composed Play. The model writes a 50-token move, the engine builds the game, the teacher plays it with the child

**Round 3 · gamification concept, live-generation lane** · 2026-10-09 · one of three independent designers (not coordinated) ·
no product code written · nothing committed, deployed or migrated.

**Tags.** **[M]** measured this session (method, n and date given where it appears; raw data in
`docs/design/round3/game/concepts/live-tech-probe/`). **[T]** read in Taxila's own code, data, docs or `context/`.
**[V]** read in a primary source this session (abstract or page). **[S]** secondary (search summary, press, a source quoted
by another). **[U]** design inference, not measured. **[E]** estimate, arithmetic shown.

**Binding inputs.** Owner directive 2026-10-09 (two-way teacher, voice signals, live-built content, duplex, natural and
relational; "the content which is built is cheap and basic and nonsense and in particular style only and when seen in the
site is not viewed properly and totally broken"; "we are cracking the gamification of learning"). `context/rejected.md`
(read first: `live-free-generation`, `generated-media-carries-facts`, `forge-live-codegen-race`, `in-game-success-as-mastery`,
`adaptive-sequencing-as-the-lever`, `rj-w2b-label-maxlength-24-in-schema`, `rj-holistic-model-judge-gate`,
`rj-mean-check-pass-as-quality`, `rj-plumbing-batteries-as-acceptance`, `rj-ot-generic-mode-default`). VALUES-100 V3 bars.
STUDIO-V2, STAGECRAFT, DESIGN-V3 §5-6, round-2 content RESEARCH/APPLY, `docs/research/content/game-mechanics.md` (G1-G14).

---

## 0. The answer on one page

1. **What is broken is not the architecture; it is what the architecture was asked to produce and where it was put.**
   Measured on the round-2 production review shots and the shipped catalogue (§1):
   - the shipped Studio piece rendered in a **181 × 113 CSS px box** on a 360 × 800 phone. The engines draw a fixed
     1000 × 625 world, so the engine's own 38-unit label floor becomes **6.9 px** and its 130-unit touch target **24 px**.
     DESIGN-V3 promised a 326 px wide slot; the shipped Desk gives the tray whatever the cards leave over;
   - **one art direction**: 16/16 core engines paint a near-black or deep-navy ground and 24/26 extension engines call the
     same `backdrop()` (radial gradient, engineering grid, vignette), inside a cream app shell;
   - **coverage was bought with catch-alls**: 382/385 class 4-7 explainers are the one `scene-explainer@1`; 87 topics
     share `story-rail@1`, 33 share `sort-storm@1`;
   - **mismatch**: a perimeter lesson (c6-maths-ch06-t01) mounted a geoboard asking "Aisi shape rango jiska kshetrafal = 3"
     (an area task), clipped at the right edge, while the teacher asked about adding sides;
   - **too slow to be live**: a full spec takes 3.4-7.0 s p50 on the spec lane (RS-4 bench, n = 30 per archetype) and the
     catalogue's full specs took 6.2 s p50 (games) and 9.7 s p50 (explainers) to write.
2. **The concept, Composed Play.** A game is *composed*, not written. Four kinds of hand-built, reviewed modules are
   combined by a type check: **representations** (the maths or science object with its laws: a number line, an area grid
   with a conserved-length rope, an evaporation box, a want-graph of traders), **forms** (the game feel and loop: predict-run,
   shape-under-constraint, fair-test, route-the-trade, spot-the-slip, catch, build-a-level), **art packs** (six distinct
   looks that restyle the relevant objects through one style interface) and **voice hooks** (what the teacher and the child
   can do in the game by speaking). A form declares the capabilities it needs; a representation declares what it provides;
   only certified pairs exist.
3. **The model writes a move, not a game.** Code builds a complete, playable *base spec* from the kit in ≤ 20 ms [U]. The
   model only picks among code-made candidates and dresses them for this child: which form, which context from the
   child's own interests, which beat order, which teacher move, one goal line and one why-question. Measured this session
   on the spec lane's deployment (`taxila-fast-bg`, gpt-5.6-luna, effort none, US sandbox → eastus2): a strict-schema
   delta came back in **p50 1.53 s / p90 1.86 s (n = 24, 80 output tokens)**, and a grammar-constrained delta in
   **p50 1.32 s / p90 1.47 s (n = 12, 50 tokens)**. That is 2-5× faster than the full-spec rung, and the base spec makes the
   model optional: on a 429 the child still gets the game, only less personal.
4. **Truth is computed, layout is solved, the picture is checked before it is shown.** Laws recompute every value the
   child sees. A layout solver places everything at the *device's real box* with legibility as hard constraints (text ≥ 14 px,
   16 px for classes 4-5; targets ≥ 48 px), choosing between arrangements instead of scaling one down. The device renders
   the first frame of every beat offscreen and runs deterministic checks before the reveal. Every (form, representation,
   pack, viewport, language) combination is screenshot-certified in CI, so a live spec only instantiates proven ground.
5. **On a phone the game owns the screen.** When a game is live the lesson switches to *play mode*: the teacher becomes a
   face-and-caption strip, the question folds into the game's goal rail, the dock becomes the game's controls. The world gets
   360 × 372 px at the 360 × 640 floor and 360 × 454 px at 360 × 800: twice the width, 3.3-4× the height and 6.5-8× the
   area of the shipped tray.
6. **Two-way, duplex play.** The teacher is in the game: her ghost hand demonstrates on her clause cues, she plants one
   honest mistake per run for the child to catch (erroneous examples, after the child has one correct act), and she reacts at
   *play turn-points* (a commit, a settled near-miss, a stall past the child's own baseline), never mid-drag. The child can
   talk to the game ("teen chauthai pe rakho", "phir se", "4 by 4"): spoken acts are graded exactly like touches. Reactions
   arrive fast because game outcomes are enumerable: her line for each likely outcome is drafted while the child is still
   dragging.
7. **The child becomes the designer.** Every form has an editor mode: the child builds a puzzle in the same grammar, the
   engine proves it solvable, the teacher plays it (and explains her reasoning), and the child may send it to a parent as
   *Ghar ki paheli*. Learning by teaching has a pooled g = 0.56 when the learner actually teaches (Kobayashi, 28 studies)
   [S].
8. **What it is not.** No points, coins, XP, streaks, lives, loot, unlocks, leaderboards or countdowns; no child-vs-child;
   no free code, free SVG or generated pixels carrying facts; no engagement-tuned difficulty. The reward is the in-world
   consequence of a correct act, the teacher's genuine reaction, and the child's own artefacts (game-mechanics G1-G14 stand).
9. **Honest status.** The architecture choices rest on measured numbers (§1, §2.7) and published results (§2). The
   learning claim does not: games add 0.1-0.3 SD at best in the literature (Clark 2016; Wouters 2013) [V], and nothing here
   has met a child. §8 pre-registers the experiments, the bars and the reversal conditions.

---

## 1. Why today's content is cheap, one-style and broken (measured, not assumed)

### 1.1 The piece is a guest in a leftover box

- **Measured [M]:** `docs/design/round2/review-shots/c4-voice-and-next-day/16-c4-s-animation.png` (round-2 production walk,
  2026-10-07, 360 × 800 at DPR 2). The dark Studio box spans x 178-541, y 808-1035 image px = **181.5 × 113.5 CSS px**,
  a 16:10 rect. Method: PIL bounds of near-black pixels in the tray band, one image.
- **Why [T]:** `src/studio-v2/core/host.css` makes the stage "the largest 16:10 rect inside" the slot, and every engine
  draws a fixed `W = 1000, H = 625` world (`src/studio-v2/core/tokens.ts`). The slot is the Desk's Work tray, and
  `src/child/lesson/deskLayout.ts` gives the tray the elastic remainder after the card, the trouble strip and the dock. In
  that shot the strip "Tap the mic to talk, then tap Done" took the height.
- **What the child saw [M, arithmetic from the host's own constants]:** scale 0.1815 px/unit, so `MIN.label` 38 units =
  **6.9 px**, `MIN.value` 48 = 8.7 px, `MIN.target` 130 = **23.6 px**. The caption overflowed the box ("10 minus 4 is 6, 9 minus
  3 is 6…" spilling out of the top) and labels were clipped ("…housands").
- **What was promised [T]:** DESIGN-V3 §5.1 measured a 326 × 334-360 px slot at 360 × 640 (`design-v3-stage-contract`:
  labels ≥ 12.4 px at that slot). The product that shipped is the Desk (PRODUCT-DESIGN-V2), not the V3 stage. No gate measured
  the piece at the box it actually got: STUDIO-V2 measured at 1280 × 800, 960 × 600 and 915 × 412 [T §14].
- The round-2 content stream found the same defect for boards: 2886/3011 authored boards (95.8%) failed legibility at the
  live tray [T: round2 content RESEARCH §0].

### 1.2 One style, everywhere

- **Measured [M]** (`grep` over `src/studio-v2/engines`, 2026-10-09): all 16 core engines paint near-black or deep-navy grounds
  (#05060B-#0B0D16, the water cycle #08122A); 24 of the 26 extension engines paint the shared `backdrop()` from `ext/kit.ts` ("radial gradient + a
  faint engineering grid + vignette, tinted by the accent"); every engine imports the one token set `C` and the same three
  fonts. Accents vary (319 distinct literal hex values), the look does not.
- The app shell around it is the cream Desk (screenshots 10, 16, 33), so the piece reads as a foreign dark rectangle
  (`design-v3-dark-instrument-identity` was decided for the shell too, but the shipped shell is light).
- Seen at full size the look is a developer dashboard (`src/studio-v2/gallery/posters.json`: glyph circles for species,
  monospace HUD pills, a text box cut off at 1024 px: "you: goes d…").

### 1.3 Coverage was bought with catch-alls

- **Measured [M]** over `data/studio-catalogue/topics/*.json` (385 class 4-7 topics): explainer = `scene-explainer@1` in
  **382/385**; games: `story-rail@1` 87, `sort-storm@1` 33, `beat-line@1` 28, then a long tail. A generic scene of glyphs and
  labels for 382 topics is what "cheap and basic" looks like.
- The honest coverage measure is not "a piece exists for the topic" but "the engine can compute the key of the item the
  child is on". By that measure: **83/2497 class 4-7 maths items** bind to an engine [T: round2 content APPLY]. A keyword
  map of my proposed representations over the kit text "covered" 385/385 topics [M]; that number is meaningless and is
  logged as a rejection (§10).

### 1.4 Nonsense = a piece that does not match the moment

- **Measured [M]** (round-2 production review, 2 of 2 runs): topic c6-maths-ch06-t01 (perimeter), turn `s-example`, tray =
  module. In `review-shots/c6-typed-c7-voice/12-c6-s-example.png` (walk data `data/walk-c6.json`) the question card reads
  "Perimeter ke liye 20, 10, 20, 10 jodiye; total kitna aayega?" while the geoboard frame below asks "Aisi shape rango jiska
  kshetrafal = 3" (an area task), its grid running off the right edge. `c4-voice-and-next-day/33-c6-s-example.png` shows the
  same mount under "Pehle bracket mein kya jodenge?". The kit's engine hint `geoboard-band` mounted an engine whose unbound
  default is an area task: the `rj-ot-generic-mode-default` failure in another engine.
- The fix is structural (§3.2, §4.6): the piece is bound to the item's skill and misconception, and her words are written from
  the facts of what is on stage (the round-2 board-first law), never the reverse.

### 1.5 The live spec rung is too slow for a conversation

- **[T]** `server/stagecraft/config.js` BUILD_MS: generated specs **3.4-7.0 s p50, 4.5-9.6 s p90** (RS-4 bench, n = 30 per
  archetype, `taxila-fast-bg`, JSON mode, effort low, 2026-10-05); usable 7/30 (orbital) to 30/30.
- **[M]** `data/studio-catalogue/spend.jsonl` (3,533 rows, 2026-10-05/06, batch generation): full game specs p50 6.2 s /
  p90 11.9 s (n = 815, ~884 output tokens + ~312 reasoning); explainers p50 9.7 s / p90 13.7 s (n = 1193, ~1968 tokens);
  19% of games needed a fix pass (154/815). A linear fit over the `taxila-fast*` rows gives ≈ **2.9 s + 3.75 ms per output
  token** (n = 3038; batch concurrency inflates the intercept).
- A child's "show me" must be answered on stage within 3 s p90 (VALUES-100 V3.3). A model that writes ~1,000 tokens of game
  cannot meet that; a model that writes ~50-80 tokens of *choice* can (§2.7).

### 1.6 What is right and stays

Engine + spec (`studio-v2-engine-plus-spec`), host grading of the raw act, the board twin, zero visible failure
(`design-v3-no-visible-build`), Stagecraft's speculative portfolio and reveal policy, board-first fusion of her line to the
stage. The world converged on this split: A2UI's "catalog of trusted, pre-approved UI components" that the agent can only
reference [S + T: generated-learning-content §1.2], ChatGPT's 70+ curated concept modules [S]. Composed Play keeps all of it
and changes four things: what the model writes, how modules combine, how the picture is styled and placed, and how the
teacher and child play inside it.

---

## 2. Research (what was measured, and what it means here)

### 2.1 Generation: constrained beats free, and "free" is minutes, not seconds

| source | what they measured | what it means for live play |
|---|---|---|
| Hu et al., *Generating Games via LLMs: VGDL* (CoG 2024, arXiv 2404.08706) [V] | n = 10 per model × prompt cell. GPT-4 with a grammar-plus-context prompt: **10/10 correct** games (rules + levels); the same model with weaker prompts **0/10**; GPT-3.5 at best 4/10; Gemma-7B 0/10. Renaming one keyword (`killSprite` → `removeSprite`) flipped outputs to correct | A DSL is necessary but brittle: correctness lives in the grammar's design and in validators, not in the model |
| Google Research, *Generative UI* (2025) [S: blog] | Human raters strongly preferred generated interfaces to text, close behind human-expert websites, **when generation speed was ignored**; generation "can sometimes take a minute or more"; "occasional inaccuracies" | Free generated interactives are near expert quality but minute-scale and unverified: a library lane, never a turn |
| A2UI (Google, 2025-12, Apache-2.0) [S + T] | Declarative JSON referencing a client-side catalogue; anything outside the catalogue is ignored; flat list with id references for progressive rendering | The catalogue-of-trusted-components pattern is the industry form of "the model fills, code renders" |
| Smith, Andersen, Mateas & Popović, FDG 2012 (Refraction level generation) [S] | Hard constraints (answer set programming) guarantee properties such as "the generated puzzle is solvable", and even aesthetic style properties were directly controllable | Solvability of generated or child-built puzzles is a solver's job (§3.4) |
| InteractScience; GameASG-Bench; WebRISE [T: generated-learning-content §0] | best model passes every test on 13.29% of science demos; 93.2% mean check pass vs 55.3% strict; one model 80.8% visual vs 15.5% functional | Behaviour fails more than looks; report strict all-checks rates (`rj-mean-check-pass-as-quality`) |
| Brilliant, "Hand-crafted, machine-made" [T: STUDIO-V2 §2] | Humans own objective, progression and the aha; AI fills variants; the breakthrough was "making the representations in our game engine more LLM-friendly" | The representation interface is the product; Composed Play makes it typed |
| Duolingo engineering blog [S] | Curriculum human-led; exercises generated from expert-written raw content; personalisation picks which exercises a learner sees | Same division of labour, offline; Taxila does the picking live |

### 2.2 Constrained decoding is available on our deployment, with a trap

- **JSONSchemaBench** (Geng et al., arXiv 2501.10868, ICML 2025 workshop) [V abstract]: 10K real-world schemas, six
  frameworks; real schema complexity undermines the compliance that constrained decoding is assumed to give. Keep the delta
  schema flat and small.
- **Azure custom tools with Lark grammars** (Microsoft Learn, reasoning-models how-to) [S]: GPT-5-series models can call a
  `custom` tool whose output is constrained by a Lark grammar (Responses API). **Measured here [M]: it works on
  `taxila-fast-bg` (gpt-5.6-luna) at effort none** (§2.7), and Azure's Lark parser rejects the bounded repetition operator
  `~2..5` (HTTP 400 "Invalid lark grammar", 12/12).
- **The trap [M, §2.7]:** bounding a free string's *characters* at decode time keeps it within length but cuts words and
  lets one field leak into the next ("goal=… why same rassi se k? why=require?"). The same failure was recorded for schema
  `maxLength` (`rj-w2b-label-maxlength-24-in-schema`: "Fewer flowers get polli"). Bounding *words* with closing punctuation
  fixed the why-question (12/12 well-formed) but left 5/12 goal lines with junk tokens. Conclusion: grammars constrain
  *structure*; child-facing words come from an authored bank or pass a code check with an authored fallback.

### 2.3 Learning evidence that shapes the grammar

| evidence | measured | rule it forces |
|---|---|---|
| Clark, Tanner-Smith & Killingsworth 2016 [V via game-mechanics.md] | games vs non-game g = 0.33; teacher-provided scaffolding **g = 0.58** (k = 4) vs success/fail only 0.26; single-player non-competitive 0.45 vs competitive −0.06; schematic 0.48 vs realistic −0.01; multiple sessions 0.44 vs single 0.08 | the teacher plays inside; no competition; schematic, styled relevant objects; forms recur across days |
| Habgood & Ainsworth 2011 [V via game-mechanics] | intrinsic (maths in the core mechanic) version: more learning and **7× voluntary play time** | the learning act IS the game act (G1, G2) |
| Nuraydin et al. 2022; Long & Aleven 2014 (`in-game-success-as-mastery`) [T] | trained task only; no transfer to paper | every run ends with an abstract act (G8); in-game evidence weighted ×0.75 |
| Breitwieser & Brod 2021, *Child Development* [S]; Brod et al. 2022, *PB&R* [S] | children 9-11 remembered more facts after generating predictions than examples (not so for adults); explicit predictions boost learning of expectancy-violating outcomes | predict-before-run is a first-class form (POE) |
| McLaren et al. 2017; Nguyen et al. 2022 (Decimal Point) [V via game-mechanics] | erroneous examples + self-explanation: d = 0.37 delayed (pooled n = 624); liked less, learned more | the teacher's planted slip, after the child has a correct act |
| Kobayashi 2019 meta-analysis, 28 studies [S] | preparing-to-teach g = 0.35; teaching after preparing **g = 0.56**; larger when the teaching is interactive | build-a-level for the teacher, who plays it back interactively |
| Chase, Chin, Oppezzo & Schwartz 2009 [S: abstract] | students teaching an agent spent more effort and scored higher; strongest for lower achievers | the teacher as a learner of the child's puzzle |
| EDUMATH (arXiv 2510.06965) [V abs]; a teacher-in-the-loop study (7 teachers, 521 grade-7 students, arXiv 2602.15876) [V abs] | interest-customised LLM problems: performance similar to human-written, consistently preferred; teacher-in-the-loop personalisation was broad-grained while students preferred specific references | personalise with the child's own named interests, from closed lists, at the context level; do not expect personalisation itself to move scores |
| Google *Learn Your Way* RCT [V blog] | n = 60, ages 15-18, 40 min: +9% immediate, **78% vs 67%** on a retention test 3-5 days later | multi-representation, interest-matched material helps retention; a small, single-topic, adolescent study |
| Kao 2020 juiciness (n = 3,018) [S]; Wong & Adesope 2021 emotional design [V via game-mechanics] | medium-high juice beats none and extreme; emotional design of relevant elements g = 0.35 retention | juice on the learning act only; art packs style relevant objects, add nothing irrelevant |
| Lomas et al. 2013 [V via game-mechanics] | easier conditions engaged longer and learned slowest | difficulty comes from the learner model, never engagement |

### 2.4 The phone reality

- **Floor device [T]:** Helio G35, 8× A53, PowerVR GE8320, 4 GB (`docs/research/design/low-end-offline.md` tier C); tier B
  Helio G85-G99. 360 × 800 CSS is the common viewport; after browser chrome the floor is 360 × 640.
- **Frame cost [T: STUDIO-V2 §14 M3]:** on a 4× throttled software-raster proxy, shipped engines ran 43-57 fps with 11-33%
  of frames over 20 ms; **never measured on a phone**. Static-layer caching took the Moon from 22 to 43 fps.
- **Touch [S]:** small and corner targets were hard for children 7-11 (Brown & Anthony, CHI 2012, 8 children and 6 adults,
  targets 20-100 px); WCAG 2.5.8 sets 24 px as the floor; Android uses 48 dp. Composed Play uses ≥ 48 px hit areas
  with ≥ 8 px gaps.
- **Server-side screenshots are too slow for a turn [T]:** the deployed Studio gate (Playwright on ACA) took p50 5.7 s /
  p90 9.0 s per check (n = 30). Live checks must run on the device; screenshots certify ground offline (§4.4).

### 2.5 Art and culture

- Clark's schematic > cartoon > realistic, and low anthropomorphism (no faces on pieces) [V]; DESIGN-V3's babyish lint
  (no mascots, candy colours, stars, confetti) [T]. Variety must come from *how the relevant objects are drawn and move*.
- **Warli** painting is a registered Geographical Indication (Adivasi Yuva Seva Sangh, registered 2014-03-31) after European
  galleries claimed copyright over a posted Warli work; brand use without the community (a 2018 legal notice to Bata) is
  contested [S]. Folk-art packs are therefore commissioned from artists of the community, credited and paid, never generated
  and never "inspired by" (§3.5).

### 2.6 Quality checks that work

- EE-Eval: comparing an explorable's extracted state machine with an ideal pedagogical one reached r = 0.728 with human
  interactivity ratings, against 0.530 for a VLM judge and −0.600 for unit tests [T: generated-learning-content §0].
- Holistic VLM judges are unreliable (ManimAgent r = −0.17; WebDevJudge 70.3% vs humans 84.6%); binary atomic checklists
  reach κ = 0.745 (KVBench) [T]. Composed Play's gates are deterministic predicates on the scene graph and pixels; any VLM is
  advisory.

### 2.7 Measured here: how fast and how clean is a small delta? [M]

All runs 2026-10-09, US sandbox → eastus2, deployment `taxila-fast-bg` (the background twin of the reply deployment, the
Stagecraft spec lane), sequential with a 400 ms gap, the c6 perimeter/area scenario of §5.1 with four child utterances and
interests. Scripts and raw rows: `live-tech-probe/`. Cost: about $0.0002 per call [E: 450 in × $0.2/1M + 80 out × $1.2/1M].

| arm | n | latency p50 / p90 / max | output tokens p50 | enum fields valid | free strings clean |
|---|---|---|---|---|---|
| A. strict `json_schema`, 5 enums + 2 strings, effort none | 24 | **1525 / 1859 / 1933 ms** | 80 | 24/24 | 11/24 within the limits stated in the description (goal > 48 chars 10×, why > 60 chars 4×) |
| B. same, effort low | 12 | 2282 / 3030 / 3322 ms | 170 (82 reasoning) | 12/12 | 12/12 |
| C. Lark grammar, char-bounded regex strings, effort none | 12 | 1401 / 1648 ms | 56 | 12/12 | 12/12 within bounds, but most cut mid-word or leaking across fields (by eye, one rater) |
| D. Lark grammar, word-bounded strings ending in "." / "?", effort none | 12 | **1315 / 1470 ms** | 50 | 12/12 | why-questions 12/12 well-formed; goal lines 7/12 clean, 5/12 with junk tokens (by eye, one rater) |
| E. Lark with `~2..5` repetition | 12 | HTTP 400 in 76-216 ms | — | — | Azure's Lark parser rejects the operator |

Context choice followed the child's interests consistently in arm A (6/6 per case: cricket → "cricket practice net",
kheti/cooking → "kitchen garden", drawing → "school flower bed").

**Reading.** The structural part of a delta is reliable and fast at effort none (enums 48/48 across A, C, D). Free child-facing
words are not, whether bounded by description, by characters or by words. So: the hot path asks the model for **enums and ids
only** (plus an optional why-question through the word grammar), takes goal lines from an authored bank per (form, language),
and accepts a model string only if it passes the code checks; otherwise the authored line plays. Not measured: India lane,
concurrency, the effect of a longer real context, and a blind second rater for string quality.

---

## 3. The concept: Composed Play

### 3.1 Four module kinds, combined by type

| layer | what it is | owns | starting set (P1 first, §9) |
|---|---|---|---|
| **Representation** `rep@n` | the curriculum object and its laws | exact truth (rationals, solvers, rate laws, graph algorithms), hit-testing, layout needs (min cell, label slots, arrangements), the board twin | `line` (integers, fractions, decimals, negatives; zoomable), `area-grid` (unit squares, polygons, conserved-length rope), `bar` (strips, partitions), `set` (groups, arrays), `balance`, `circuit` (MNA solver, from Circuit Lab), `rate-box` (Dalton-type evaporation, heat transfer, dissolving), `field-2d` (rays, mirrors, shadows, angles), `want-graph` (agents with have/want, food webs, trade), `timeline`, `map-grid` (scale, directions, lat/long), `chart`, `token-strip` (words, morphemes, matras), `sky` (from the Moon explainer) |
| **Form** `form@n` | the game feel and loop | the verbs, the real-time element, juice, difficulty knobs, HUD rail content, the ideal interaction graph, the editor mode | `predict-run`, `shape-under-constraint`, `fair-test`, `route` (connect so flow / trade / light completes), `catch` (Landfall), `aim`, `sort-by-rule`, `order`, `spot-the-slip`, `build-a-level` |
| **Art pack** `pack@n` | a look | tokens (light and dark grounds), stroke and fill styles, type pairing, motion signature, procedural sound palette, 20-40 text-free vector props | Chalk, Kagaz (paper-cut), Blueprint, Night Lab (today's look, kept as one of six), Syahi (ink and wash), Toy-Lab (soft geometry); commissioned folk packs later (§3.5) |
| **Voice hooks** | what can be said and done by voice inside the form | the spoken command grammar, the teacher's legal moves (ghost move, planted slip, uptake, question), play turn-points | per form; shared number and deixis grammar (Hindi, English, Hinglish) |

**The type check.** A form declares `requires` (e.g. `catch` needs `continuous1D: valueAt(x), positionOf(v)`;
`shape-under-constraint` needs `region + conservedQuantity`; `fair-test` needs `simulate(factors) ≥ 2 factors`; `route`
needs `graph + flowRule`). A representation declares `provides`. A pair is *admissible* when `requires ⊆ provides`; it is
*certified* when CI has rendered and bot-played it at every viewport, pack and language (§4.4). Only certified pairs can be
picked live. Fourteen representations and ten forms give at most 140 pairs; type checking leaves fewer, and certification
decides the rest. That is combinatorial variety from about 30 hand-built modules, against today's 42 one-off engines that
each carry their own look and layout.

**The skill binding.** Each topic's playbook (offline, human-reviewed) lists, per skill and misconception, the admissible
pairs and the item generators the representation can grade (the engine computes the key; `rj-engine-prompt-shows-target`
holds: the spec never shows the answer). This is the coverage that counts: items whose keys an engine computes.

### 3.2 What the model writes and what code provides

| concern | code (hand-built, reviewed, versioned) | model (per child, per moment) |
|---|---|---|
| which idea, now | Stagecraft policy: the want at a turn-point (lossless rule SC-1) | nothing |
| candidate pairs | the playbook for the skill and misconception, filtered by certification and device tier | picks one of ≤ 3 |
| numbers, items, keys | kit items and typed generators; laws compute every displayed value | nothing |
| twist | the misconception's value from the kit (e.g. "same perimeter → same area") | picks the beat order from ≤ 3 patterns |
| teacher's in-game moves | the legal moves per form (ghost demo, one planted slip, uptake, question) | picks which, from the list |
| context | closed list from the kit's `interestContexts` ∩ the child's stored interests | picks one (arm A: consistent 24/24) |
| words on screen | authored bank per form × language, Q8-checked once | an optional why-question via the word grammar, accepted only if it passes checks |
| her spoken lines | the Director's move shape + a telegraphic facts row of what is on stage | the reply model writes the line from facts (existing lane) |
| layout, style, motion, sound | solver, pack, form | nothing |
| grading | the host re-grades the raw act from the validated spec | nothing |
| failure | the ladder (§4.6) | nothing; the model is never in the recovery path |

### 3.3 Play-duplex: the teacher inside the game

Duplex v2 already treats the screen as an input: "ScreenState … a busy child holds the floor without words; submit is a
yield" [T: duplex ARCHITECTURE §2.3]. Composed Play adds the game's own events to that track and defines when she may speak.

- **Floor states.** `C_PLAYING` (a finger is down or moved in the last 600 ms): no speech, no new content, content-blind
  face nods only (DESIGN-V3 "she reacts at turn boundaries and never mid-manoeuvre"). Safety always pre-empts:
  `SAFETY_ATTEND` freezes the stage and quarantines reveals.
- **Play turn-points** (the play analogue of a TRP): a commit (finger up + 600 ms settle, or a spoken act), a settled
  near-miss, a stall longer than the child's own p75 hesitation on this form (floor 6 s), a beat end, a request.
- **Fast reactions without guessing.** Game outcomes are enumerable (a 16 m rope has four whole-number rectangles), so while
  the child drags, the server drafts her line for the likely outcome classes (best, near, the misconception value) from
  facts, reusing duplex v1's wait-time drafts. On commit the matching draft plays; a miss falls back to the normal
  reply lane. Target: her first word ≤ 900 ms after a commit [U]. The on-screen consequence is instant (≤ 100 ms, QB-G3).
- **Ghost moves.** Her hand (a soft cursor in the pack's style) moves on her clause cues with the 400 ms pre-roll of
  `teacher-stage-cue-scheduler`, so "main yahan rakhti hoon" and the move coincide. It is a worked example inside the world.
- **One planted slip per run**, only after the child has one correct act on the skill, drawn from the kit's misconception
  value, never from a free generation. If the child does not catch it within one turn-point, she catches it herself aloud
  (an erroneous example must never stand uncorrected; `own-mistake-note-false-confession` is the warning: ownership is a
  director fact, not a prompt note).
- **The child talks to the game.** A code grammar (the signals stack's normaliser) maps numbers in Hindi, English and
  Hinglish ("teen chauthai", "3 by 4", "dedh"), verbs ("rakho", "badlo", "chalao", "phir se", "dheere", "mushkil wala") and
  deixis ("yahan", "is wale ko", resolved to the last touched object) to the same acts touch produces. Spoken acts are graded
  identically. Every committed utterance still passes `scanSafety()`, the model distress read and the out-of-bounds lexicon.
- **Play signals → knowledge states, never emotions** (MS Code of Conduct restriction 12). Time to first touch, oscillation
  between two values before commit, undo count and commit speed at a misconception value give candidate states
  (searching, confident-wrong, guessing, stuck-productive). They run in shadow until each reaches precision ≥ 0.80 on
  children (VALUES-100 V2.3).

### 3.4 The child as designer: build-a-level, and *Ghar ki paheli*

Every form ships an editor mode in the same grammar: the child chooses the rope length and two fields, the traders and
their wants, the factor to test. The representation's solver proves the puzzle has a unique answer (or tells the child why
not: "dono khet barabar ho gaye, koi ek bada banao"). The teacher then plays it, thinking aloud, and the child judges her.
The artefact persists (G5 allows the child's own builds) and the child may send it to the parent corner as *Ghar ki paheli*:
the parent plays it on their phone, the teacher later tells the child who solved it. No counts, no ranks, no reminders; it is
relatedness outward, not a hook. Strings in a child's puzzle come only from closed lists (no free text, so no PII and no
moderation queue).

### 3.5 Six art directions, one style interface

| pack | look (relevant objects only) | type | motion signature | best for |
|---|---|---|---|---|
| **Chalk** | slate ground, chalk strokes with a small seeded jitter (Rough.js-style; MIT, < 9 kB) [S], two chalk colours | Kalam (OFL, Latin + Devanagari) for labels, Atkinson for numerals | stroke draw-on | maths, worked examples |
| **Kagaz** | layered paper-cut shapes, soft cached shadows, haldi / neel / terracotta / leaf, light grain | Bricolage + Atkinson + Mukta | slide and fold | EVS, science scenes, SST |
| **Blueprint** | deep-blue grid, cyan line work, dimension arrows | Geist Mono labels | plotted lines | geometry, measurement, circuits, motion graphs |
| **Night Lab** | today's dark instrument look | as now | glow pulses | astronomy, electricity, data |
| **Syahi** | brush lines of varying width, flat procedural washes (cached) | Mukta / Atkinson | ink spread | history, language, poems |
| **Toy-Lab** | soft two-tone geometry, isometric, muted (no candy, no faces) | Bricolage | weighted springs on the child's own drop | mechanics and physics games, classes 4-5 |

- **One interface.** Representations never draw colours: they call `style.line(kind)`, `style.region(kind)`,
  `style.token(kind)`, `style.label(role)`, `style.arrow`, `style.particle`, `style.highlight(state)`. A pack implements the
  interface; so every certified pair works in every pack by construction, and CI proves it.
- **Rules.** Code picks the pack (subject fit, the representation's compatibility, the child's choice from 2-3 offered in
  settings, no pack twice in a row for the same child and subject, and a ground that matches the shell theme so the piece is
  never a foreign rectangle). Text contrast ≥ 4.5:1, graphical objects ≥ 3:1; the one "your move" hue is reserved across packs
  (`design-v3-volt-one-carrier`); status is shape-coded (tick, magnifier), never colour alone; no decorative loops; no faces on
  pieces; tokens in the W3C design-tokens format so packs are data.
- **Folk-art packs** (Warli, Gond, Madhubani line systems) only by commission from artists of those communities, credited and
  paid, used where the content belongs (a village haat), never generated (§2.5).

### 3.6 Play mode: the game owns the phone screen

```
360 × 800 (360 × 640 floor)                   wide (≥ 900 px): world left, teacher tile + transcript right
┌──────────────────────────────┐
│ ‖  c6 · Maths · Area      ⋯  │ 44
│ (face) "Rassi utni hi…"      │ 72  teacher strip: face 48 px + her caption, 2 lines
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │        WORLD             │ │ the rest: 454 (372 at the floor)
│ │  (solved at this box,    │ │
│ │   1 layout px = 1 CSS px)│ │
│ └──────────────────────────┘ │
│ GOAL: sabse bada khet · 16 m │ 56  rail: goal line + live readouts (the question folds in here)
│ (mic) Speak anytime [again][⌨]│ 96  dock = the game's controls
└──────────────────────────────┘
```

The world box is 6.5-7.9× the area of the shipped tray (181 × 113): 133,920 and 163,440 px² against 20,600 px². Rotation and resize re-solve, game state survives. When
the run ends (or the child says "bas"), the Desk returns with a 420 ms cross-fade and her line refers to the result card.

### 3.7 What is never in it

No points, coins, XP, gems, stars, streaks, lives, loot, unlocks or leaderboards; no countdown (a world clock only advances
when the child acts or asks); no child-vs-child; no random reward; no variable ratio; no pay-to-win; no guilt or FOMO copy;
no generated images carrying facts; no free code on the live path; no game for c7-science-ch06 (adolescence) or on a
safeguarding turn. A "score" is only the run's own measure (precision, found the best field) and is never persisted
(STUDIO-V2 D-S2 stands, with its reversal).

---

## 4. How it is built and generated live on this stack

### 4.1 The live path and its budget

| step | where | budget | status |
|---|---|---|---|
| 0. Nomination (duplex partial intent, classifier misconception, child request, beat lookahead) | server, Stagecraft | — | exists [T] |
| 1. Candidates + **base spec** from the playbook and kit | server, pure code | ≤ 20 ms | [U]; Forge G1's code pick measured 45 ms for repeated gaps and ≤ 1 ms on memory hits [T] |
| 2. **Delta** (enums + ids; optional why via word grammar) | `taxila-fast-bg` / `taxila-stagecraft`, effort none | p50 1.3-1.5 s, p90 1.5-1.9 s | [M] US only (§2.7) |
| 3. Validate, recompute laws, compile the interaction graph, check strings (Q8, `revealsAnswer`, length, script) | server, shared code | ≤ 10 ms | [U]; validateSpec measured in microseconds [T] |
| 4. Facts row for her line (values only, never a sentence) | server | 0 | round-2 board-first pattern [T] |
| 5. Ship: rides the turn response, or the Studio slot | network | — | exists [T] |
| 6. Layout solve at the device box | client | ≤ 30 ms on tier C | [U], to measure (E-LT3) |
| 7. Offscreen render of each beat's key frame + self-check | client | ≤ 60 ms on tier C | [U], to measure (E-LT3) |
| 8. Reveal at a turn-point (420 ms cross-fade) | client | — | DESIGN-V3 [T] |

Without the model the base spec is ready in ~100 ms; with it, ~1.5-2 s after nomination [E: rows 1-7]. Nominations from the
duplex partial-intent stream usually start before the child finishes, and her reply arrives 1.6-2.3 s after the commit
(Director stage p50 1562 ms, US [T: MODEL-STACK]), so the dressed version is often ready for her turn. If the delta is not
back by the reveal, the base spec plays and the delta is discarded: nothing is ever swapped mid-run.

### 4.2 The spec (`play@1`), and the delta that dresses it

Base spec for §5.1, written by code (abridged):

```json
{ "play": "play@1", "form": "shape-under-constraint@1", "rep": "area-grid@1", "pack": "kagaz@1",
  "skill": "c6-maths-ch06-t02-s3", "targets": ["c6-maths-ch06-t02-m-same-perimeter-area"], "lang": "hinglish",
  "world": { "constraint": { "kind": "fixed-perimeter", "unit": "m" }, "context": "khet" },
  "beats": [
    { "id": "b1", "kind": "predict", "fields": [[6, 2], [4, 4]], "rope": 16, "ask": "which-more" },
    { "id": "b2", "kind": "run", "show": "sow-rows" },
    { "id": "b3", "kind": "build", "rope": 16, "goal": { "pred": "maxArea" } },
    { "id": "b4", "kind": "slip", "after": { "correctActs": 1 }, "shape": [7, 1], "claim": "longer-is-bigger" },
    { "id": "b5", "kind": "build", "rope": 24, "goal": { "pred": "maxArea" } },
    { "id": "b6", "kind": "abstract", "gen": "compare-rect-area", "params": { "a": [10, 5], "b": [8, 7] }, "units": "sq m" },
    { "id": "b7", "kind": "why", "expectation": "c6-maths-ch06-t02:e4" } ],
  "src": { "kit": ["i03", "i08"], "base": "code" } }
```

No displayed answer is in the spec: areas (12, 16, 36; 50 and 56 in the abstract item) are computed by the representation.
The abstract item uses a rope length (30 m) and shapes the child never built, so it tests transfer, not recall of an in-game
value (`rj-w2c-fade-after-full-example`). The delta the model wrote in
the probe (arm D, one row, ~50 tokens):

```
form=shape ctx=net rope=20 move=square goal=alag shapes banao perimeter same rakho. | why=alag shapes ka area alag ho sakta hai?
```

Code ignores `rope` (numbers are code's), maps `ctx=net` to the context list, and accepts the goal line and the why-question
only after the string checks (length, script, Q8, `revealsAnswer`). This row passes; a failing string is replaced by the
authored bank line, never truncated (5/12 goal lines in arm D would have been replaced).

### 4.3 Layout: legibility is a constraint, not a check after the fact

- Inputs: the device's real world box in CSS px, DPR, language, the child's band (text floor 16 px for classes 4-5, 14 px
  above; numerals ≥ 18 px), measured font metrics, the teacher-strip safe area.
- Each representation offers discrete **arrangements** (horizontal or vertical line; grid orientation; corner-drag or
  edge-drag; one field or two side by side; zoom-and-pan for long ranges) and continuous constraints inside each
  (positions, spacing, label slots). The solver picks the first arrangement whose constraints are satisfiable and solves
  positions with a Cassowary implementation (`@lume/kiwi`, BSD-3 per the registry; Cassowary JS, Apache-2.0) [S].
- Hard constraints: every text box inside its region and ≥ the floor; every target hit area ≥ 48 px with ≥ 8 px gaps; no
  label overlaps; nothing in the teacher strip or rail.
- Unsatisfiable → step down: fewer items, then the alternative arrangement, then the board twin. Never a smaller font.
- All words are DOM in a text layer over the canvas (the browser shapes Devanagari correctly; screen readers see it;
  `game-kit-words-in-dom` [T]). The canvas draws the world at the backing-store DPR.

### 4.4 Visual QA before anything reaches the child

1. **Offline certification matrix (CI, per module version).** For every certified (form, representation) pair × 6 packs ×
   5 viewports (360 × 640, 360 × 800, 390 × 844, 768 × 1024, 1366 × 768) × 2 languages × the playbook's seed specs: render
   every beat's key frame in headless Chromium, bot-play every goal predicate through real pointer events, and run the
   deterministic checks below plus a perceptual-hash diff against human-approved baselines. A pair that fails anywhere is not
   certified and cannot be picked. Approved baselines are reviewed once per pack version by a person.
2. **Spec-time proof (server, ms).** Schema, laws recomputed, interaction graph compiled and compared with the form's ideal
   graph (every path reaches the abstract act; the slip follows a correct act; no dead ends), strings checked.
3. **On-device self-check (client, before reveal).** Offscreen render of each beat's key frame, then: every DOM text box
   inside its region and ≥ floor px; no overlap among labels and targets (scene-graph geometry, sampled through
   `elementsFromPoint`, not bounding boxes: `rj-w2f-bbox-label-checks`); text contrast against sampled background pixels;
   non-blank stage (luma spread) and painted entity count = scene-graph count; truth probes (the displayed count equals the
   law's value); the first 10 frames under the tier's budget. A failure steps down the ladder silently.
4. **Shadow audit.** One reveal in twenty is re-rendered server-side from (spec, box, pack) and stored for review; the
   deployed gate's 5.7 s p50 is fine off the child's path.

### 4.5 Rendering kit and device tiers

- Reuse the studio-v2 host (frame guard, last-good-frame hold, static layers, adaptive resolution, pooled particles, synth
  sound) [T], and retire its fixed 1000 × 625 world for play mode.
- Tiers from `low-end-offline` [T]: A full; B 60 fps target with fewer particles; C (Helio G35 class) 30 fps cap with
  interpolation, ≤ 40 particles, no live shadows (cached only), no blur. Reduced motion: cross-fades, the game still works.
- Budgets per frame on tier B: world draw ≤ 8 ms, DOM text layer ≤ 4 ms (`game-kit-words-in-dom` reversal bar) [T].

### 4.6 Degradation and failure (zero visible failure)

Ladder, every rung correct: **dressed spec → base spec (no model) → simpler arrangement / fewer items → the board twin with
the same values → voice only**. A 429 or timeout on the delta lane drops to the base spec for the rest of the lesson
(no retries on the hot path; Stagecraft's quota tiers already cap spend). An engine fault after reveal freezes on the last
good frame and cross-fades to the board twin; her next line is written from the board's facts. The mismatch guard runs at
reveal: the piece's skill must equal the current item's skill (or the beat's), and a piece of another topic is retired
(`stagecraft-stale-topic-piece`).

### 4.7 Safety and truth (unchanged floor)

The host grades every raw act from the validated spec, never the frame's claim (`rj-ot-frame-claim-as-grade`); spoken game
acts pass `scanSafety()`, the model distress read and `server/conversation/lexicon.js`; strings pass Q8 (SEVERE on all, MILD on
non-kit strings) and `revealsAnswer()`; no PII in contexts; no game on or after a safeguarding turn until the hand-off is done;
never deny being an AI; Childline 1098 / Tele-MANAS 14416 untouched; the stop check-in works in play mode exactly as in the
Desk ("bas" during a run triggers the same one check-in).

### 4.8 Where it plugs in

Composed Play is a Stagecraft rung (`generated_spec` becomes `composed`, with the base spec as its instant floor). Stagecraft's
policy decides *what idea* and *when*; Composed Play decides *how it looks and plays*. The studio-v2 engines are not thrown
away: their truth code becomes representations (Circuit Lab's solver → `circuit`, the Moon's geometry → `sky`, Landfall's line
→ `line` + `catch`), and their craft becomes forms. The 385-topic catalogue stays as the library rung once re-certified at the
real box.

---

## 5. Three worked examples (as the child experiences them)

Teacher lines below are **illustrative outputs** of the existing reply lane writing from facts; they are never placed in any
prompt (the recitation law). Times are from the child's commit unless stated, and are design targets assembled from the
measured stage latencies (§4.1), not measurements of these flows.

### 5.1 Maths · c6-maths-ch06-t02 Area (skill s3, misconception `m-same-perimeter-area`) · *Rassi ka khet*

Riya, class 6, Hinglish, interests: cooking with her nani, cricket. Form `shape-under-constraint` × rep `area-grid` (rope of
fixed length) · pack Kagaz (last piece was a Chalk board) · items i03 (predict, 16 m: 6 × 2 vs 4 × 4) and i08 (24 m, biggest
garden), plus the generated abstract item.

| # | teacher (voice) | screen | child | engine / evidence |
|---|---|---|---|---|
| 0 | (kit item i03) "6 by 2 aur 4 by 4, dono ka perimeter 16. Area same hoga?" | Desk, question card | "haan same hoga, perimeter same hai na" | Duplex partial at "perimeter same" nominates a contrast piece (−0.6 s). Classifier: contradicted, `m-same-perimeter-area`. Base spec built in ms; delta back ~1.5 s: `predict→run→build→slip→24m→abstract`, context *kitchen garden* (from "nani ke saath cooking"), move `ghost_thin_strip` |
| 1 | +1.6 s: "Achha, tumhe lagta hai same. Yeh nani ka kitchen garden hai, aur rassi poori 16 metre. Pehle bolo, kis khet mein zyada paudhe lagenge?" | Play mode slides in: paper-cut soil grid, a braided rope as a 6 × 2 field and a 4 × 4 field, "?" plates. Rail: GOAL "Kis khet mein zyada?" · Rassi 16 m (locked) | taps "dono same" | Prediction recorded = misconception value (POE) |
| 2 | "Chalo, boya jaye." then silence | Seedlings pop into every unit square row by row: 2 rows of 6, 4 rows of 4; counters tick 12 and 16 | "arre, 16 zyada!" | The rows-of-b structure is expectation e2, shown by the world, not told |
| 3 | at the settle: "Rassi utni hi thi, phir farak kyun? Ab tum sabse bada khet banao, rassi kheench ke dekho." | Corner handles (48 px hit areas); dragging the length to 7 pays the rope out of the breadth (a small pulley shows it is one rope); live "Khet: 7" | drags: 7 × 1, 5 × 3, 4 × 4; says "4 by 4" | `C_PLAYING`: she is silent, face nods only. Each commit is an act {l, b, P = 16, A}; the spoken "4 by 4" snaps the field and is graded the same |
| 4 | at the commit (draft ready): "4 by 4. Square." … ghost hand stretches a new field: "Main toh lamba wala banaungi, lamba hai toh zyada jagah hogi na?" | Her ghost field 7 × 1 fills with 7 seedlings | "nahi! sirf 7. Patla hai." | Slip after one correct act; caught → `error_spot` act correct |
| 5 | "Ab rassi 24 metre." | Rope grows to 24; grid re-solves to a vertical orientation so cells stay ≥ 30 px with edge-drag | tries 10 × 2 (20), 8 × 4 (32), 6 × 6 (36) | If she stalls past her p75 hesitation, the rail lists her own tried shapes (her data, not the answer); her line: "Ab tak ke khet dekho, kya pattern dikh raha?" |
| 6 | "Ab bina khet ke, likh ke batao." | World fades to a plain card: "Dono ka perimeter 30 m: 10 m × 5 m aur 8 m × 7 m. Kiska area zyada, aur kitna?" | types "8 by 7, 56 square metre" | Abstract act (G8) on numbers she never built, host-graded with units (`m-cm-units` if "56 m") |
| 7 | "Ek line mein: rassi same thi, phir area kyun badla?" | caption only | explains | Closed comprehension grader on expectation e4 |
| 8 | "Ab tum mere liye ek paheli banao?" | Editor: rope length and two fields from her drags; solver checks a unique bigger field | builds 20 m: 9 × 1 vs 5 × 5; taps "Mumma ko bhejo" | Teacher plays it aloud; artefact saved to the parent corner as *Riya ki paheli* |

**Phone layout (360 × 800):** world 360 × 454 (328 × 422 inside 16 px gutters). Predict beat: the two fields stacked, about
54 px cells. 16 m build: 8 columns of about 41 px. 24 m build: the longest side reaches 11, so the solver turns the grid
vertical (12 rows of about 35 px) and switches to edge-drag, because corner hit areas of 48 px would overlap on a one-cell-wide
field. **If the delta never comes:** the same game with context *khet*
and bank strings. **If the self-check fails** (e.g. Hindi labels too long at 360): the two-field predict beat becomes one
field at a time; else the board twin with the 12 / 16 counts drawn. **Evidence:** prediction (contradicted), 6 build acts,
slip caught, best 24 m field found, transfer item with units, why expectation. In-game acts weigh ×0.75; the abstract act and
the delayed check carry the mastery claim.

### 5.2 Science · c6-science-ch08-t03 Factors affecting evaporation (skills s2 fair test, s1, s3; misconception `m2` "only temperature matters") · *Chhat pe kapde*

Aarav, class 6, prefers Hindi; interest: cricket. Form `fair-test` + `predict-run` × rep `rate-box` · pack Kagaz with a
Blueprint graph panel · items i11 (Golu's unfair test, error_spot), i05 (fan vs still corner), i04/i07 (matka), i10 (results →
conclusion). Earlier he said "dhoop mein jaldi sookhta hai, bas": the classifier tagged `m2`.

**The law (computed, never generated).** Each cloth holds water mass W; drying rate dW/dt = −k · A · (e_s(T) − RH · e_s(T)) ·
(1 + 0.54 u), a Dalton-type evaporation law with the Penman wind function shape, where e_s(T) = 0.6108 · exp(17.27 T / (T +
237.3)) kPa (FAO-56 eq. 11) [M: textbook forms from memory, to be checked against FAO-56 before build]. Sun vs shade sets the
cloth temperature; fan sets u; spread vs folded sets A; dry May vs humid August sets RH. For the matka, the same evaporated
mass removes latent heat (2.45 MJ/kg) from the water: ΔT = Δm · L / (m · c). Relative drying times are exact for the model; the
engine never claims real-world minutes beyond "about".

| # | teacher (voice, Hindi register) | screen | child | engine / evidence |
|---|---|---|---|---|
| 1 | "Golu ne test kiya: ek jersey dhoop aur pankhe ke neeche, doosri chhaon mein bina pankhe. Pankhe wali pehle sookhi. Golu kehta hai, hawa se jaldi sookhta hai. Tum kya kehte ho?" | Play mode: a chhat, two cricket jerseys on a line, factor chips under each (sun/shade, fan, spread/folded). Rail: fairness meter "2 cheezein alag" with an amber magnifier | "do cheezein badli, dhoop bhi aur pankha bhi" | Nominated from the earlier `m2` tag at the practice beat's opening (lookahead), so it was ready before the beat; base spec from kit i11 + i05; the delta picked *cricket jersey* from his interests. `fair-test` computes the factor difference = 2; the spoken answer is an `error_spot` act, correct (the planted slip here is Golu's, from the kit) |
| 2 | "Toh tum sirf hawa ka fair test banao." | | sets both in shade, both spread, fan on the left; meter turns mint "sirf hawa alag" | predicate `fairOneFactor(wind)` true; s2 act |
| 3 | "Pehle bolo, kaunsi pehle sookhegi?" | prediction chips: left / right / saath | "saath" | prediction = misconception value |
| 4 | silent while it runs, one clause cue: "graph dekho" | Time-lapse: drips, the cloth lightens with W, vapour particles faster on the fan side; a linked graph draws W(t) for both; the fan side dries first (computed) | watches; can scrub back | two linked representations driven by one simulation (QB-A5) |
| 5 | "Sirf hawa badli thi, aur pankhe wali kaafi pehle sookh gayi." | result card on the rail | | contradiction of `m2` shown, not told |
| 6 | "Ab apni marzi se ek aur cheez test karo." | free test | tests spread vs folded, fairly | each test logged: fair or not, which factor (s2 evidence) |
| 7 | "Ab August, barsaat wala din. Kya hoga?" | RH slider jumps; predict first | "dono der se" | both curves slower (computed) |
| 8 | "Yahi niyam matke pe bhi chalta hai. Saada matka ya rang kiya hua, kis ka paani thanda?" | Scene morphs: the jersey becomes two matkas, pores visible on the plain one; thermometers read from ΔT | predicts plain; runs | transfer to s3 (`m1` "clay is cold") |
| 9 | "Riya ke results: plate 2 ghante, cup 6 ghante. Conclusion bolo." | plain card (i10) | "phailaav zyada, toh jaldi sookha" | abstract act, closed grader |
| 10 | "Pankha hawa thandi nahi karta, phir bhi thandak kyun lagti hai?" | caption | explains | why (`m3`) |

**Teach-back:** Aarav sets up a test for the teacher; she runs it aloud and he judges whether it was fair. **Layout:** the
graph panel sits under the chhat at ≥ 120 px tall on the 360 × 454 world; at the 372 px floor the solver stacks them as tabs
(scene / graph) instead of shrinking both.

### 5.3 SST · c7-sst-ch11-t01 From Barter to Money (skills s1, s3; misconceptions `m2` "barter is easy", `m1` "money has value in itself") · *Haat*

Meher, class 7, English-Hinglish; interest: trading stickers. Form `route` (trade) + `predict-run` × rep `want-graph` · pack
Syahi (ink and wash, terracotta) · items i02 (weaver-farmer-cobbler loop), i03 (goat for one egg), i09/i10 (trust), i04
(timeline), i13 (teach-back). Trigger: she asked "isko game bana do" after the explanation of barter.

**The law.** Each trader has goods and wants. A pairwise trade completes only with a double coincidence of wants; a set of
trades completes when the arrows form a cycle in the want-graph (cycle detection); goods have a divisibility flag (a goat is 1)
and a shelf life in days; from row 5 a commodity money (kauri) is accepted by everyone who trusts it, prices in kauri come from a
code table (rice 2, cloth 6, pot 3, goat 20) and the "trades needed" readout is computed for barter and for money. History
facts on screen (punch-marked coins about the 6th century BCE, RBI 1935, UPI 2016) come from the kit's expectations only.

| # | teacher (voice) | screen | child | engine / evidence |
|---|---|---|---|---|
| 1 | "Haat lagi hai. Tum kumhar ho, tumhare paas matke hain, aur tumhe tyohaar ke liye kapda chahiye." | Play mode: a village haat as ink-washed stalls, each with a goods icon and a want bubble (icons, no faces); her stock: 3 pots | drags a pot to the weaver | Child request → the want fires at the next turn-point; the base spec is ready at once, the delta (~1.5 s) picks the pack and the round order; the piece rides her reply (request → stage bar ≤ 3 s p90). Trade refused: the weaver's bubble shows rice. In-world consequence, not a cross |
| 2 | at the refusal (draft ready): "Julaha ko chawal chahiye. Kise tumhare matke chahiye?" | | finds the farmer wants pots; pot → rice, rice → cloth | 2-step indirect barter; acts graded by the double-coincidence rule |
| 3 | "Ab yeh teen dekho." | weaver → rice, farmer → shoes, cobbler → cloth; no pair works | draws the loop | cycle detected → three-way swap animates (i02, `m2` contradicted by doing) |
| 4 | ghost move, after her correct loop: "Charwahe ko bas ek anda chahiye, uske paas bakri hai. Main bakri ka ek tukda de deti hoon?" | | "bakri aadhi nahi hoti!" | planted slip caught (i03: indivisibility) |
| 5 | "Socho agar sab log ek cheez lete, jaise kauri." | A pouch of kauri appears; prices in kauri on every stall; readout "lena-dena: barter 5 · kauri 3" | completes every want pairwise | medium of exchange and measure of value, shown by the count |
| 6 | "Ek hafta baad kya bachega, chawal ya kauri?" | She advances the day (a clock that moves only when she taps); rice greys after 3 days | predicts kauri | store of value |
| 7 | "Ek ajnabi bina pehchaan wali kauri laaya hai. Log lenge?" | predict, run: traders refuse unmarked shells | predicts "nahi" | `m1`: value comes from trust (i09) |
| 8 | "Ab kram mein lagao." | timeline rep: barter → kauri/grain → punch-marked coins → paper notes → UPI | orders them | abstract act (i04), host-graded |
| 9 | "Ek dost ko samjhao, paisa kyun bana." | caption | explains | teach-back (i13), closed grader on the expectations |

**Teach-back level:** Meher builds a haat (who has and wants what) and predicts whether barter alone can clear it; the solver
checks for cycles and tells her; the teacher plays it. **Note:** money here is curriculum content inside the world, not a reward
currency (G4 is about rewards); nothing is earned, kept or spent outside the run.

---

## 6. What makes it revolutionary, and what is not claimed

| | what exists (surveyed in STUDY-PRODUCTS and generated-learning-content, 2026) | Composed Play | evidence status |
|---|---|---|---|
| per-moment composition | ChatGPT: 70+ fixed concept modules; Gemini/Claude: free code in a minute or more, no correctness claim [S] | a certified game composed from what the child just said, about 1.5 s, truth computed | latency [M, US]; quality certification to build |
| the teacher in the game | PhET: no teacher; Prodigy: quiz-gated combat; Khanmigo: chat beside the content [T, S] | ghost moves on her clauses, one honest planted slip, reactions at play turn-points, never mid-drag | teacher scaffolding g = 0.58, adult interaction g = 0.48 [V]; unmeasured in this form |
| talking to the game | touch-only games; voice assistants without a world | spoken Hinglish acts graded like touches | grammar to build; ASR measured elsewhere [T] |
| the child as designer | level editors without a tutor or a solver | build-a-level in the same grammar, solver-proved, played back by the teacher, shared with family | learning by teaching g = 0.56 [S]; unmeasured here |
| many looks, one truth | one style per product | six packs over one style interface, layouts solved per device, proven before reveal | to build and certify |
| evidence, not points | points, badges, streaks (Duolingo, Kahoot, Prodigy) | every act is graded evidence of a knowledge state; no reward economy | rules G1-G14 [T] |

**Not claimed.** That games teach better than a good explanation: the meta-analytic priors are small and design-dependent,
and the best-designed maths game at scale (ST Math) was null [V]. That play signals read children correctly: they stay in
shadow until measured. That generated wording is child-safe without checks: §2.7 shows it is not.

---

## 7. Risks (with mitigations and kill criteria)

| # | risk | mitigation | kill / reversal signal |
|---|---|---|---|
| R1 | composition creates combinations no one tested, which break visibly | only CI-certified pairs are pickable; certification matrix per module version; fuzz | any visible failure in the battery → the pair is de-certified automatically |
| R2 | generic forms drift back into quiz-in-costume (a `sort` that is a multiple choice) | remove-the-game / remove-the-learning lint per pair; owner review of each form; DESIGN-V3 babyish lint | a pair whose learning act ≠ game act is deleted, not patched |
| R3 | delta latency in India, or 429s at maxed quota | base spec is complete without the model; background twin lane; Stagecraft tier caps; no hot-path retries | India p90 > 2.5 s → code-only rung by default |
| R4 | shallow or off personalisation | closed context lists from the kit ∩ the child's stored interests; no names of real people; measure preference | children do not prefer dressed over base (blind A/B) → drop the delta |
| R5 | art packs are expensive and drift | one style interface; packs are data + small functions; start with 3; baselines approved per version | a pack failing contrast or babyish lint is pulled |
| R6 | tier C phones stutter | tiers, 30 fps cap, cached layers, particle budget, DOM text cost bar | > 15% frames over 33 ms on tier C → turn-based forms only on tier C |
| R7 | the teacher talks over play or reacts mid-drag | `C_PLAYING` floor rule in the governor; drafts play only at turn-points | any talk-over-play event in the battery is a release blocker |
| R8 | in-game success read as mastery | ×0.75 weight; abstract act every run; delayed checks carry "secure" | — (rule, not a hypothesis) |
| R9 | engagement creeping in as the objective | difficulty from the learner model only; no persisted scores; engagement is a guardrail metric | rushing pattern (faster commits, more errors) → calm mode |
| R10 | safety through new surfaces (spoken commands, child puzzles, family sharing) | same committed-turn safety stack; closed lists for puzzle strings; family-only sharing | any safety leak → feature off |
| R11 | Hindi shaping and metrics differ between server proof and device | words in DOM; the device's self-check is the authority; 15% slack in server proofs | — |
| R12 | depends on the duplex engine | without duplex, play-duplex degrades to turn-based cascade (reactions at commits) | — |
| R13 | scope: 14 representations × 10 forms is a lot of hand-built code | build by bindability demand (items whose keys an engine computes), starting with 4 × 5 | coverage by binding is the progress metric, never "a piece exists" |

---

## 8. How to measure that it works (pre-registered)

**Engineering bars** (all must hold on the integrated tree in production before the concept is called live):

| id | what | method | bar |
|---|---|---|---|
| E-LT1 | delta latency and usability on the India lane | ≥ 200 calls from the Chennai ACA job, real lesson contexts | p90 ≤ 2.0 s; enums usable ≥ 99%; strings usable ≥ 90% with authored fallback 100% |
| E-LT2 | certification | full matrix (§4.4) | 0 violations; baselines human-approved per pack |
| E-LT3 | device cost | three reference phones (Helio G35 4 GB, G85/G99, Snapdragon 4 Gen 1) in the Capacitor WebView, n ≥ 10 loads each | first frame ≤ 300 ms from spec (warm); frames > 33 ms ≤ 5% (A/B), ≤ 10% (C at 30 fps); solve ≤ 30 ms; self-check ≤ 60 ms |
| E-LT4 | zero visible failure | 2,000 mutated deltas and specs (harness asserts the mutation was served: `rj-fuzz-that-never-served-the-mutation`) + 200 simulated lessons | 0 page errors, 0 blank stages, ladder always lands on a correct rung |
| E-LT5 | no nonsense | stage-vs-line contradiction (`screenContradiction`) over ≥ 500 turns; stage skill = item skill | 0 and 100% |
| E-LT6 | grading truth | ≥ 2,000 randomised correct / wrong / partial acts per certified pair, touch and voice; forged frame claims | 0 wrong grades; 0 claims accepted (V1.1) |
| E-LT7 | play-duplex | adult actors, then the pilot | talk-over-play 0; first word after a commit p50 ≤ 900 ms; spoken game acts understood ≥ 90% |
| E-LT8 | looks | owner + 2 blind raters on each pack × 6 topics; babyish lint | ≥ 4/5 "premium and made for this topic"; lint 0; no pack twice in a row per child-subject |
| E-LT9 | it is on screen, readable, at the real box | Playwright on the production build at 360 × 640 and 360 × 800 through a real lesson | world ≥ 360 × 372; min text ≥ 14 px (16 for classes 4-5); targets ≥ 48 px |

**Learning bars** (pilot children; until then every claim reads "engineering-complete, unproven on children"):

| id | design | outcome | bar / power |
|---|---|---|---|
| E-LT10 | within-child randomisation by skill: composed game vs board-only explanation of the same skill | next item unaided; delayed check ≥ 2 days in a new form, no hints (V1 "secure"); a paper-format transfer item | expected d ≈ 0.1-0.3 (Clark, Wouters priors). Paired d_z = 0.2 at r ≈ 0.5 needs n ≈ 196 child-skill pairs for 80% power, α = .05 [E: ((1.96 + 0.84)/0.2)²] |
| E-LT11 | misconception-targeted pieces vs board contrast | the kit diagnostic re-asked 2 days later | contradicted-rate lower, CI excludes 0 |
| E-LT12 | build-a-level offered vs not (randomised by lesson) | delayed check on that skill; the share of puzzles that are solvable and explained | report effect with CI; no bar until a prior exists |
| E-LT13 | engagement as a constraint | Fun Toolkit again-again; child-initiated pieces; voluntary replay; rushing guardrail | again-again ≥ 60%; child-initiated ≥ 25%; rushing flagged ≤ 5% of runs |
| E-LT14 | the owner's own test on his phone | the three §5 runs live | the owner says it is a real game, not a quiz, and nothing is broken |

**Reversal conditions.** If E-LT10 shows no advantage over board-only with the CI excluding d ≥ 0.1 at n ≥ 200, games go to
practice beats only and explain beats go to boards. If E-LT1 p90 > 2.5 s, the code-only rung is the default. If E-LT3 fails on
tier C, tier C gets turn-based forms only. If children do not prefer dressed over base specs, the delta is removed.

---

## 9. Build order (for the main loop; nothing built here)

1. **P0, stop the visible breakage:** play mode on phones (the game owns the screen), re-certify the existing catalogue at the
   real box, match the piece's ground to the shell theme, the skill-binding mismatch guard at reveal.
2. **P1, the grammar core:** representations `line`, `area-grid`, `rate-box`, `want-graph`; forms `predict-run`,
   `shape-under-constraint`, `fair-test`, `route`, `spot-the-slip`; packs Chalk, Kagaz, Night Lab; the layout solver, the
   device self-check, the certification matrix, the delta lane (enums + word-grammar why).
3. **P2, play-duplex:** ScreenState feed, play turn-points, outcome-keyed drafts, ghost-hand cues, the spoken act grammar,
   play signals in shadow.
4. **P3:** build-a-level + *Ghar ki paheli*; packs 4-6; more representations and forms in order of items bound; migrate the
   studio-v2 engines' truth code into representations.

---

## 10. Proposed `context/` entries (written to `context/inbox/r3-game-live-tech.json`; not merged)

- **Measurements:** `ms-r3-stage-box-prod-2026-10-07` (181 × 113 px; 6.9 px labels), `ms-r3-catalogue-style-2026-10-09`
  (16/16 near-black, 24/26 shared backdrop, 382/385 one explainer), `ms-r3-catalogue-spec-latency-2026-10-09` (6.2 s / 9.7 s
  p50; 2.9 s + 3.75 ms/token), `ms-r3-live-delta-probe-2026-10-09` (§2.7).
- **Decisions (each with a reversal):** `dec-r3-model-writes-delta-not-spec`, `dec-r3-composed-play-typed-pairs`,
  `dec-r3-play-mode-owns-phone-screen`, `dec-r3-legibility-as-layout-constraint`, `dec-r3-art-packs-style-interface`,
  `dec-r3-child-facing-words-from-bank`, `dec-r3-play-duplex-turn-points`.
- **Rejections:** `rj-r3-fixed-16x10-world-in-leftover-tray`, `rj-r3-schema-description-length-limits`,
  `rj-r3-char-bounded-grammar-strings`, `rj-r3-lark-range-repetition`, `rj-r3-keyword-topic-coverage`.

---

## 11. Sources

- Hu, C. et al. *Generating Games via LLMs: An Investigation with Video Game Description Language.* arXiv 2404.08706 (IEEE CoG 2024). https://arxiv.org/html/2404.08706v1 [V]
- Google Research. *Generative UI: A rich, custom, visual interactive user experience for any prompt.* https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/ [S]
- Google. A2UI repository. https://github.com/google/A2UI [S]; Taxila `docs/research/world-best/generated-learning-content.md` [T]
- Google Research. *Learn Your Way: reimagining textbooks with generative AI.* https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/ [V]
- Geng, S. et al. *JSONSchemaBench.* arXiv 2501.10868. https://arxiv.org/abs/2501.10868 [V abstract]
- Microsoft Learn, Azure OpenAI reasoning models (custom tools, `lark_tool`). https://learn.microsoft.com/en-my/Azure/foundry/openai/how-to/reasoning [S]; Microsoft Foundry blog, freeform tool calling (2025-08-22). https://devblogs.microsoft.com/foundry/unlocking-gpt-5s-freeform-tool-calling-a-new-era-of-seamless-integration/ [S]
- Smith, A. M., Andersen, E., Mateas, M. & Popović, Z. *A Case Study of Expressively Constrainable Level Design Automation Tools for a Puzzle Game.* FDG 2012. https://homes.cs.washington.edu/~zoran/answer-set-level-design.pdf [S]
- Kobayashi, K. *Learning by Preparing-to-Teach and Teaching: A Meta-Analysis.* Japanese Psychological Research (2019). https://metatoc.com/papers/112234-learning-by-preparing-to-teach-and-teaching-a-meta-analysis [S]
- Chase, C. C., Chin, D. B., Oppezzo, M. A. & Schwartz, D. L. (2009). *Teachable Agents and the Protégé Effect.* J. Sci. Educ. Technol. 18(4). https://purl.stanford.edu/zm369yx3532 [S]
- Breitwieser, J. & Brod, G. (2021). *Cognitive prerequisites for generative learning.* Child Development. https://www.pedocs.de/volltexte/2022/25234/pdf/CD_2021_1_Breitwieser_Brod_Cognitive_Prerequisites_for_Generative_Learning_A.pdf [S]; Brod, G. et al. (2022). *Explicitly predicting outcomes enhances learning of expectancy-violating information.* PB&R 29 [S]
- *EDUMATH: Generating Standards-aligned Educational Math Word Problems.* arXiv 2510.06965. https://arxiv.org/abs/2510.06965v1 [V abstract]
- *Should There be a Teacher In-the-Loop? A Study of Generative AI Personalized Tasks in Middle School.* arXiv 2602.15876. https://arxiv.org/abs/2602.15876 [V abstract]
- Brown, Q. & Anthony, L. (2012). *Toward comparing the touchscreen interaction patterns of kids and adults.* CHI 2012 EIST. https://lisa-anthony.com/wp-content/uploads/2012/03/brown-and-anthony-chi2012eist.pdf [S]; Deque, WCAG 2.5.8 target size. https://dequeuniversity.com/rules/axe/4.9/target-size [S]
- Rough.js (MIT). https://www.npmjs.com/package/roughjs [S]; `@lume/kiwi` (Cassowary, BSD-3 per registry). https://github.com/lume/kiwi [S]; Cassowary JS (Apache-2.0). https://github.com/kevinbarabash/cassowary.js [S]
- Warli GI and appropriation: The Better India, https://thebetterindia.com/296974/how-adivasi-women-reclaim-warli-art-for-international-recognition-with-murals-gi-tags [S]; Rooftop, https://rooftopapp.com/blogs/warli-art-is-everywhere-but-the-artists-who-created-it-are-still-being-left-behind [S]
- Duolingo blog: *How Duolingo experts work with AI.* https://blog.duolingo.com/how-duolingo-experts-work-with-ai [S]
- Through Taxila docs (each cites its primary sources): Clark, Tanner-Smith & Killingsworth 2016; Wouters et al. 2013; Habgood & Ainsworth 2011; McLaren et al. 2017; Lomas et al. 2013; McTigue et al. 2020; Wong & Adesope 2021; Kao 2020 (`docs/research/content/game-mechanics.md`); InteractScience, GameASG, EE-Eval, KVBench, ManimAgent, WebDevJudge (`docs/research/world-best/generated-learning-content.md`); Brilliant blog (`docs/design/reset/STUDIO-V2.md` §15) [T]
- FAO Irrigation and Drainage Paper 56 (saturation vapour pressure eq. 11; latent heat) [M: from memory, verify before build]
- Taxila evidence used: `docs/design/round2/review-shots/**` (screens and walk data, 2026-10-07), `data/studio-catalogue/**`, `src/studio-v2/**`, `src/child/lesson/deskLayout.ts`, `server/stagecraft/config.js`, `docs/ops/MODEL-STACK.md`, `docs/design/reset/{DESIGN-V3,STUDIO-V2,VALUES-100}.md`, `docs/design/round2/content/{RESEARCH,APPLY}.md`, `docs/research/design/low-end-offline.md`, `docs/research/duplex/ARCHITECTURE.md`, `data/kits/{c6-maths,c6-science,c7-sst}.json` [T]
