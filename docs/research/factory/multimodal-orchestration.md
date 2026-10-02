# Multimodal orchestration: the modality planner, anticipatory generation, cross-student reuse and the content cost governor

Date: 2026-10-02 · Status: research and design, nothing built · Scope: Forge (content factory) and the Director's
module choice · Companion files: `modality-planner-sim.py` (Monte-Carlo, stdlib), `modality-planner-sim-2026-10-02.txt`
(its output).

**Question.** Given the topic, the child's learning-profile posterior, vibe, attention state, device and network,
time left and cost budget, which medium should the child get: game, simulation, animation, video, image, diagram,
story, song, plain voice, text or worksheet? Should it be generated now, taken from what was pre-generated, or taken
from the library? Also covered: anticipatory generation (predict misconceptions, pre-build the remediation),
reuse across students, and a per-student daily cost governor.

**What this builds on (not repeated here).**
- Learning-science §2 and §8 (LS): formats F1-F8, topic types T1-T5, the format-efficacy posterior, the
  no-learning-styles rule.
- tech-and-market §3 (TM): the T0-T3 module tiers. Google GenUI: 3.5% one-shot, 69.3% after 10 rounds.
- llm-game-generation (LG): the G1/G2/G3 game tiers, and §9 "when a game is the wrong medium".
- orchestration-architecture (OA): rule C1 (the Conductor is code), C7 (cost governor), C8 (library first), the
  §9 degrade ladder.
- day-cycle §9 (DC): the night pipeline and the N1-N6 rules.
- motivation-interest §2.6 (MI): activity selection and the moment states.
- dialogue-affect (DA), vibe-temperament (VT), low-end-offline (LE): device tiers A-D, link rungs, data saver.
- auto-validation-qa (QA): the Q0-Q10 gate.

This document adds the layer *between* "what to teach next" (MI §2.6) and "build it" (Forge). That layer
decides the medium, where the artefact comes from, when to build it ahead of time, and who pays.

Evidence tags (house style):
- **[V]** verified today from source;
- **[S]** secondary or abstract-level;
- **[M]** measured here (with n);
- **[sim]** output of `modality-planner-sim.py` on [U] inputs;
- **[U]** unmeasured design assumption;
- **[I]** inference.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| MO1 | **The modality planner is pure code: `plan(ctx) → ModalityPlan`.** No LLM chooses the medium live. LLMs work offline only: they label topics with content shapes, propose candidate misconceptions and write briefs | OA C1. Structure enforced by the platform beats structure written into a prompt (LS §3.3). The choice must be replayable and testable for invariants (no song for a concept, no game on first exposure) | A shadow LLM planner beats the code planner on delayed retrieval in a pre-registered micro-RCT, with zero invariant violations over 10k simulated lessons |
| MO2 | **Two layers, kept separate.** *Format family* (F1-F8, a teaching move with an evidence base) is chosen by the LS §8.4 bandit. *Modality* (the medium that realises it) is chosen by content-shape fit, device, time, latency and cost. Per-child learning personalisation acts only on the format layer. The modality layer personalises engagement and preference, and only as tie-breaks | "Learning styles" fail the crossover test (LS §2) [S]. Content-format fit is the honest version (Willingham) [M]. Learn Your Way, the strongest 2025 result, let students *choose* representations; it did not infer a type [V] | E-PROFILE (LS §8.7) shows per-child *modality* (not format) allocation beats the population-best policy on delayed outcomes |
| MO3 | **Content shape is a property of the topic, stored in the kit (`contentShapes[]`, 11 codes, §3.2), and it is the first filter.** It is labelled offline by an LLM with an engine-map prior and checked by a human per chapter | Content-format fit is the one fit with evidence. The engine maps already pick a primary engine per topic (maths 304, science 146 topics) [V repo] | Labels disagree with expert teachers above 15% on a 100-topic audit |
| MO4 | **The source ladder is library → library core + per-child fill → prefetched → generate-now (cheap, schema-validated media only) → build race (expensive; never blocks; always has a fallback) → never live (video, G3, per-child images)** | Per-child generation of expensive media cannot pay for itself: a per-child key reaches 11% reuse and $0.71/child-day for remediation games alone **[sim]**. Latency: image 23 s [M], video 55-124 s [M], G2 minutes [U] | A per-child generated artefact beats the library version on delayed retrieval, and its marginal cost fits the tier (OA C8 condition) |
| MO5 | **Cache keys are exact and layered: expensive *core* × shared *skin pack* × per-child *fill*.** Language and interest are fill or skin layers, never part of the core key. Embeddings may *suggest* neighbours. They never *serve* a hit | Keeping skin and language out of the core lifts reuse from 49.8% to 91.7% at 1k children and from 85.5% to 99.2% at 10k **[sim]**. Semantic-cache key collisions hijack 86% of responses (CacheAttack, 2026) [S]. Serving a child a "similar" fraction game is a correctness bug | Measured core-key hit rate stays below 70% at 10k children (the key is too fine), or the skin layer is shown to hurt learning |
| MO6 | **Anticipation is a launch-phase and long-tail tool, not a steady-state one.** Night pre-builds take the top-3 misconceptions of predicted topics, ranked by aggregated demand per unit cost under a nightly cap. A one-off seeded catalogue covers the top-2 misconceptions of every topic | At 300 children the night pre-build lifts "a bespoke remediation is ready when the misconception surfaces" from 89.3% to 96.0%. At 3k children, build-on-miss alone already reaches 98.4%, because the cohort warms the library **[sim]**. At scale the night budget moves to *quality*: extra repair rounds, judges, human review | Measured served-ready rate at ≥ 3k children stays below 95% (the cohort is more spread out than modelled: boards, calendars) |
| MO7 | **Misconception prediction uses data first and the LLM only for candidates.** P(m \| child, topic) = curriculum and cohort prevalence + the child's prerequisite evidence. An LLM-proposed misconception starts at a low prior until it is observed | LLM student simulators flip under *any* feedback: Selective Flip Score is near zero across 7 models (Do, Sonkar & Sachan 2026) [S]. LLMs underestimate hard-item difficulty (QWK 0.578; Wang et al. 2026) [S]. LLMs are good at *generating* plausible misconceptions and distractors (Mitton 2026; Zengaffinen 2026) [S] | An LLM prevalence estimator reaches Brier ≤ 0.15 against observed diagnostic rates on ≥ 50 topics |
| MO8 | **Content has its own budget lines, separate from voice.** Per child per day: soft $0.05 and hard $0.10 of *marginal* content spend. Library misses are paid from a global **library fund**, never from the child who triggered them. Both reserve before they spend (OA §9.2) | Default-day marginal content spend is mean $0.053, p90 $0.075 **[sim]**. Fills and per-child TTS dominate, so the in-lesson narrator should be the already-paid live teacher, not TTS. Charging misses to children puts p99 at $0.54 **[sim]** and penalises early adopters | Revenue tier changes, or measured content spend per child-month exceeds 25% of the tier price |
| MO9 | **Video is a library-only phenomenon hook (≤ 12 s, no baked text, human-reviewed). It is never a lecture and never per child** | Probe today: taxila-sora completed 4/4 jobs, 8 s 720p, 55-124 s wall, 3.1-4.1 MB [M, n=4]. The Devanagari title came out misspelled ("गुरूत्वाकर्शण" for गुरुत्वाकर्षण), and the photosynthesis clip omitted water and glucose [M, n=1 each, contact-sheet inspection]. Synthetic video matches human video on learning, but not *more* (n=83; n=500) [S] | A reviewed video hook beats an animated scene-DSL version of the same phenomenon on delayed retrieval |
| MO10 | **Offer the child a choice when the top two options are within δ.** Two or three options, never a choice between the evidence-based core and fluff | LS rule 26 (Patall 2008) [S]; MI §2.6. In Learn Your Way, most students used at least one transformation beyond the core text, and all used quizzes [V] | Choice offers lower completion or delayed retrieval in A/B |

---

## 1. The problem, restated so it can be built

A "modality" is three different decisions, and conflating them is how products end up selling learning styles.

1. **Pedagogical move:** *what kind of teaching act* this is, for example worked example (F2), visual-first (F3),
   interest context (F4), chant (F5), game wrapper (F6) or attempt-first (F8). The move set is fixed by the lesson
   phase (lesson-arc P1-P7) and the learner state. Within the eligible set it is ranked by the LS §8.4
   delayed-success posterior. This is where per-child learning personalisation lives, and it is shrunk hard
   toward the population (Schmucker et al. 2025: contextual bandits rarely beat a well-tuned uniform policy) [V, LS].
2. **Medium (realisation):** *what the child sees and hears*. An F3 move can be a static diagram, an animated
   scene, a manipulable simulation or a 3-level game, and the right one depends on the content shape, the device,
   the minutes left, attention and money.
3. **Source:** *where the artefact comes from*: library, library plus fill, prefetch, generate-now or build race.
   This depends on latency, cost and reuse.

The planner owns decisions 2 and 3 and *consumes* decision 1. Everything it does is logged as a
`modality.planned` event with its reason codes, so the teacher (and the parent report) can be told *why*.

---

## 2. What 2025-2026 work adds (beyond LS, TM and LG)

| work | what it is | finding that changes this design | tag |
|---|---|---|---|
| **Learn Your Way** (LearnLM Team, arXiv 2509.13348, Sep 2025) | Textbook → personalised text (grade level plus one interest, with only the parts "particularly amenable to personalisation" rewritten and **highlighted**) → immersive text, narrated slides, audio-graphic teacher-student dialogue, mind maps, embedded quizzes. Gemini 2.5 Pro, not fine-tuned. Illustrations from a **separately fine-tuned** image model | RCT, n=60, ages 15-18, Chicago: higher immediate *and* 3-day retention (both p = 0.03, Mann-Whitney) against a PDF reader. **Students chose** the representations. Expert raters scored the illustration component *lowest*. Narrated slides scored far above silent slides on engagement. The authors note the study cannot say which component helped, and that the system is not adaptive to performance | [V] |
| **Harnessing Generative UI for Education** (arXiv 2609.20738) | plan → leveled goals → UI → guidance, with a critique loop | 3.5% one-shot, 69.3% after 10 rounds (TM §3.1). The medium is costly to make *correct*, so the planner must know a medium's **ready-probability by deadline**, not just its fit | [S] |
| **Guided Learning in Gemini** (Google, 2025-08-06) | "rich, multimodal responses, including images, diagrams, videos and interactive quizzes" | Google does not publish its selection policy. Take nothing from it except that a mixed-media default is now the market's expectation | [V] |
| **Revenga-Lozano et al. 2026** (arXiv 2601.09470), observational, N=661, 16-24 weeks of high-school physics | optional elaborated feedback in verbal, graphical and mathematical forms | Using multi-representation feedback had a small, consistent positive association with post-test scores, independent of prior knowledge. **For students with low representational competence, using *diverse* representations was associated with more learning, and the advantage shrank as competence grew.** This is an expertise-reversal-shaped signal: offer *variety* to novices and focus for experts. Observational, so it is a prior and not a rule | [S] |
| **Synthetic video RCTs**: Leiker et al. 2023 (n=83 adults); Li, Barry & Cukurova 2024 (n=500 adults, 4 arms) | AI-generated instructor video vs human video vs text | **No difference** in learning between synthetic and human video, or between video and text. Learners *preferred* video. So video is an engagement and preference lever, not a learning lever. The cost is justified only where motion of a real phenomenon *is* the content | [S] |
| **MMMG** (Luo et al. 2025, arXiv 2506.10963) | 4,456 expert-validated "knowledge image" prompts (diagrams, charts, mind maps) | The best model (GPT-4o) scored **50.2** on MMMG-Score: low entity fidelity, weak relations, clutter. Knowledge diagrams must be *structured renders* (scene DSL, SVG), with the raster model kept for illustration. This matches Learn Your Way's low illustration scores | [S] |
| **LLM student simulators**: Sonkar et al. 2024 (arXiv 2410.12294); Do, Sonkar & Sachan 2026 (arXiv 2605.12748) | can an LLM hold a misconception the way a student does? | Tuning on misconception data reproduces errors but damages correct solving unless the mix is calibrated. Across 7 models, simulators show **near-zero Selective Flip Score**: they abandon the "misconception" under any corrective signal. **Do not use LLM-simulated students to predict which misconceptions a child will show, or to test remediation content** | [S] |
| **Distractor and misconception generation**: Zengaffinen et al. 2026 (arXiv 2603.15547); Mitton et al. 2026 (arXiv 2602.02414) | can an LLM produce plausible wrong reasoning? | In maths, models follow a misconception-based process: solve, articulate the error, simulate it. In science they fall back on semantic similarity. Anchoring the prompt to the correct solution adds +6.4% alignment with human distractors. Generate → retrieve → rerank beats direct generation for diagnosing misconceptions from dialogue. **Good for proposing candidates, weak for estimating prevalence** | [S] |
| **Item difficulty from text**: Wang et al. 2026 (arXiv 2607.28634); SMART (Scarlatos et al. 2025) | can an LLM predict how hard an item is? | Best zero-shot QWK was 0.578, below a fine-tuned encoder (0.625), and LLMs **underestimate hard items**. Difficulty and prevalence must come from response data (KT's Glicko/IRT layer), with LLMs as weak cold-start priors only | [S] |
| **Walkington et al. 2026** (arXiv 2604.12066): multi-agent personalised maths problems in ASSISTments, 8 teachers, 212 problems | LLM writes, then four agent critics check accuracy, authenticity, readability and realism | Agents caught most realism issues while the problems were being written. Teachers and students still wanted to change the **fine-grained personal context**: authenticity and fit is the residual failure. So interest personalisation should be a small, child-editable layer (interest tags), not deep rewriting | [S] |
| **CacheAttack** (Zhang et al. 2026, arXiv 2601.23088) | semantic (embedding-keyed) caches | Locality and collision resistance conflict. Black-box collisions hijacked 86% of responses. **Content for children is never served on embedding similarity** | [S] |
| **Budget-constrained routing**: PILOT (Panda et al. 2025, arXiv 2508.21141) | LLM routing as a contextual bandit with a multi-choice knapsack cost policy | The same structure fits *media* routing: a bandit on value, a knapsack on spend. §9 uses a greedy knapsack for the night library fund | [S] |
| **LearnLM × Eedi RCT** (arXiv 2512.23633, n=165, UK) | supervised AI tutoring | +5.5 pp on novel problems against human tutors alone. Relevant here only as evidence that Eedi-style *diagnostic MCQs* (one distractor per misconception) are the instrument that gives misconception prevalence | [S] |

**Net.** No 2025-2026 study shows that an *automatic* per-learner choice of medium beats learner choice or a good
default. The positive results (Learn Your Way; interest personalisation, LS §2.4) come from (a) multiple
representations being *available*, (b) light interest context, and (c) the learner choosing. The planner is
therefore built as a **fit-and-feasibility engine with a choice surface**, not as a learner-type classifier. Its
learning-personalisation claim is limited to what E-PROFILE can falsify.

---

## 3. The catalogue

### 3.1 Eleven modalities, as Forge can actually produce them on Azure

Latency is to "visible on the child's screen". Cost is marginal per child unless marked "shared". Prices are from
OA §9.1 and LG §8.

| id | modality | realisation (generator → runtime) | live source | latency | marginal cost | bytes (tier C) | validators | format families |
|---|---|---|---|---|---|---|---|---|
| `voice` | plain voice plus whiteboard anchor | live teacher (gpt-realtime) plus a host anchor (key word or number in Devanagari or Latin) | always | ≤ 0.8 s turn [S] | already paid (voice budget) | ~0 | persona invariants | F1, F7 |
| `text` | on-screen reading | kit text, or a luna rewrite to a reading level | library / fill | 0 / 1.9 s [M luna wall] | $0 / ~$0.002 | < 5 KB | reading-level lint; Content Safety | F1, F4 |
| `diagram` | static structured visual | scene@1 DSL (content/genui-scene-dsl) or engine snapshot → SVG | library / generate-now | 0 / 2-8 s [U] | $0 / ~$0.003 | 5-40 KB | DSL schema, lint S1-S7, layout pass, label truth | F3, F2 |
| `image` | raster illustration | gpt-image-2 (labels as an SVG overlay, never baked in) | library / prefetch only | 0 / 23 s low [M], ~2 min high [S] | shared: $0.006 low, $0.053 medium | 40-120 KB WebP | safety classifier, VLM check, no-text check | F4, story |
| `animation` | narrated timeline | scene@1 timelines (≤ 4, ≤ 30 s), narrated by the live teacher in lesson, TTS offline | library / generate-now | 0 / 3-10 s [U] | $0 / ~$0.004 (+ TTS offline $0.015/min [S]) | 10-60 KB | timeline lint, step-truth replay | F2, F3 |
| `sim` | manipulable simulation | T1 engine plus spec (TM §3.2), or a T2 Forge build | library / fill / race | 0 / 1-3 s / minutes | $0 / ~$0.003 / shared $1.5-3.5 | engine ≤ 30 KB br | zod spec, goal solver, QA Q0-Q5 | F3, F8 |
| `game` | multi-level game | G1 kit fill, G2 kit-extended build (LG) | fill / race / library | 3-25 s / P50 ~8 min [U] | ~$0.003 / shared ~$2.5 | kit ≤ 340 KB gz precached | QA Q0-Q10, bot solvability | F6 |
| `video` | ≤ 12 s phenomenon hook | sora-2 (taxila-sora), human-reviewed; labels overlaid by the host | **library only** | 0 (stream) | shared $0.80 / 8 s [S] | 3.1-4.1 MB at 720p [M]; ~1 MB after a 480p re-encode [U] | human review, VLM fact check, no-text rule | hook for F3 |
| `story` | narrative (child as character, interest context) | luna text from a story shape plus cached images plus teacher or TTS voice | fill / prefetch | 2-4 s text | ~$0.002-0.004 | < 10 KB + cached images | Content Safety, truth anchors (facts come from the kit), authenticity lint | F4, X1 role-play |
| `song` | chant or rhythm over a beat | rhythm-chant engine (game-kit §5.7): the lyric *is* the content, procedural beat, TTS or teacher voice | library / fill | 0 / 2-5 s | $0 / ≤ $0.01 TTS | < 50 KB | lyric = verbatim key; syllable-beat fit | F5 only |
| `worksheet` | printable or offline practice | print template filled from the verified item bank | fill (night) | night | ~$0.002 | PDF 50-200 KB | answer keys from kit only | practice, homework |

Two rules sit outside the table:
- **Narration in a live lesson is spoken by the teacher**, who is already streaming paid audio. TTS is used only for
  offline packs and replays. This one rule removes the largest marginal content cost in §9.3 **[sim]**.
- **No raster image or video carries text.** All labels are host-rendered (SVG or DOM) from verified strings.
  Evidence: the misspelled Devanagari in the sora probe [M], MMMG [S], and LG §6.

### 3.2 Content shapes (topic property, `kit.contentShapes`)

Eleven codes. A topic has one to three of them, weighted. The night LLM labels them, the engine-map primary acts as
a prior, and a human checks each chapter.

`spatial` (geometry, symmetry, nets) · `quantity` (fractions, place value, ratio, integers) · `causal` (circuits,
forces, acids and bases) · `process` (water cycle, digestion, germination) · `classify` (living and non-living,
materials) · `verbatim` (tables, varnamala, months, planet order) · `lexical` (vocabulary, phonics, spelling,
grammar forms) · `narrative` (history, EVS family and community, stories) · `geo` (maps, places) · `procedure`
(long division, column addition, constructions) · `phenomenon` (something observable that cannot be manipulated:
eclipse, monsoon, seed germination, volcano).

### 3.3 Fit prior: modality × content shape (0 = never, 1 = weak, 2 = good, 3 = best)

This is the β prior's *media* analogue. It is a hand prior from Willingham-style content-format fit (LS §2.4 item
9), the multimedia principles and the engine maps, and the night labeller and audits will revise it **[U]**.

| shape \ modality | voice | text | diagram | image | animation | sim | game | video | story | song | worksheet |
|---|---|---|---|---|---|---|---|---|---|---|---|
| spatial | 1 | 0 | **3** | 1 | 2 | **3** | 2 | 0 | 0 | 0 | 2 |
| quantity | 1 | 1 | **3** | 0 | 2 | **3** | **3** | 0 | 1 | 0 | 2 |
| causal | 2 | 1 | 2 | 0 | 2 | **3** | 2 | 1 | 1 | 0 | 1 |
| process | 2 | 1 | 2 | 1 | **3** | 2 | 1 | 2 | 2 | 0 | 1 |
| classify | 1 | 1 | 2 | 2 | 0 | 1 | **3** | 0 | 1 | 0 | 2 |
| verbatim | 2 | 1 | 1 | 0 | 1 | 0 | 2 | 0 | 0 | **3** | 2 |
| lexical | **3** | 2 | 0 | 2 | 0 | 0 | 2 | 0 | 1 | 1 | 2 |
| narrative | **3** | 2 | 1 | 2 | 1 | 0 | 1 | 1 | **3** | 0 | 1 |
| geo | 1 | 0 | **3** | 1 | 1 | 2 | 2 | 0 | 1 | 0 | 2 |
| procedure | 1 | 1 | 2 | 0 | **3** | 2 | **3** | 0 | 0 | 0 | **3** |
| phenomenon | 2 | 0 | 1 | 2 | 2 | 2 | 0 | **3** | 1 | 0 | 0 |

Hard zeros are invariants, not preferences. Song is only for `verbatim` and (weakly) `lexical`, enforcing LS rule
24. Video is 0 except for `phenomenon`, `process` and `narrative`. Image is 0 for `quantity`, `procedure` and
`causal`, because a raster picture of a quantitative relation is a seductive detail at best and wrong at worst.

### 3.4 Phase mask: modality × lesson move (lesson-arc phases)

| move (phase) | allowed | forbidden | note |
|---|---|---|---|
| first exposure (P3 teach) | voice+anchor, diagram, animation, sim (predict-observe-explain), video hook (≤ 12 s, at most once), story frame (B1-B2), image (context) | game, worksheet, song (unless the topic is T1) | LG §9: games are for practice of something already introduced |
| worked example (F2) | animation (step timeline), diagram sequence | game, video | the fading is driven by the kit's `fadedVersion` |
| misconception remediation | sim in predict mode (contrast), diagram contrast pair, animation of the correct process, story with cognitive conflict (B1-B2) | game *until* one correct unaided contrast item | remediation = `KitMisconception.remediation.representation` (contracts) |
| practice (P5) | game (G1/G2), sim challenge, diagram items, song (T1 only) | video, story-only | wrappers per game-mechanics G1-G14 |
| retrieval warm-up (P1) | voice, micro-game (≤ 2 min), song (T1) | anything with a > 3 s load | must be instant: library only |
| teach-back (P6) | voice, child-drawn diagram (draw tool) | everything generated | the child is the medium |
| wrap and preview (P7) | voice, image teaser (prefetched), video hook (library) | builds | |
| homework or offline | worksheet, prebuilt game pack, story audio (TTS), read-along | anything that needs the network | LE §8 offline packs |

---

## 4. Inputs: `PlannerContext`

```ts
// shared/modality.ts (proposed; pure, imported by Director, Conductor and the Forge planner)
import type { TopicType, FormatFamily } from "./contracts";

export type Modality = "voice"|"text"|"diagram"|"image"|"animation"|"sim"|"game"|"video"|"story"|"song"|"worksheet";
export type ContentShape = "spatial"|"quantity"|"causal"|"process"|"classify"|"verbatim"|"lexical"|"narrative"|"geo"|"procedure"|"phenomenon";
export type Move = "first_exposure"|"worked_example"|"remediate"|"practice"|"retrieval"|"teachback"|"wrap"|"homework";
export type Moment = "warming"|"flow"|"curious"|"struggle"|"frustrated"|"boredUnder"|"boredOver"|"boredMeaning"|"anxious"|"gaming"|"fatigued"; // MI §2.5
export type Source = "library"|"library_fill"|"prefetched"|"generate_now"|"build_race"|"on_device";

export interface PlannerContext {
  now: number;
  lesson: { id: string; phase: "P1"|"P3"|"P5"|"P6"|"P7"|"offline"; move: Move; minutesLeft: number; wrapAt?: number;
            lastModalities: Modality[] /* most recent first, ≤ 6 */; teacherBridgeSec: number /* talk that can cover a load, default 3 */ };
  topic: { topicId: string; objectiveId: string; topicType: TopicType; shapes: { shape: ContentShape; w: number }[];
           misconceptionId?: string; kitVersion: string };
  format: { family: FormatFamily; posteriorDraw: number; sd: number };   // decided upstream by LS §8.4; consumed here
  learner: {
    ageBand: "B1"|"B2"|"B3"|"B4"; priorKnowledge: "low"|"mid"|"high";           // expertise reversal (LS §2.5)
    repCompetence?: number;                                                       // 0-1, from translate_rep items (§2, Revenga-Lozano)
    engagement: Partial<Record<Modality, { mean: number; n: number }>>;           // LS §8.5: a constraint, never the objective
    revealedPref: Partial<Record<Modality, number>>;                              // choices taken / offered, shrunk
    interestTags: string[]; lang: "hi-Latn+en"|"hi"|"en"; readingLevel: number;  // 0-1
  };
  state: { moment: Moment; minutesInSession: number; attentionBudgetMin: number /* DC §1.3 by band */ };
  vibe: { energy: "calm"|"warm"|"bright" };                                        // VT §4.2; affects skin, not medium
  device: { tier: "A"|"B"|"C"|"D"; net: "offline"|"poor"|"ok"|"good"; dataSaver: boolean;
            audioOut: "speaker"|"headphones"|"muted"; packIds: string[] /* on-device offline packs */ };
  budget: { childDayLeftMicroUsd: number; libraryFundLeftMicroUsd: number; rate: { image: number; codex: number; sora: number } /* tokens left */ };
  inventory: InventoryView;                                                         // §6: what already exists for this key
}

export interface InventoryView {
  lookup(key: ArtifactCoreKey): { artifactId: string; quality: { a: number; b: number }; ready: boolean } | null;
  inflight(key: ArtifactCoreKey): { jobId: string; etaSec: number; pReadyBy: (sec: number) => number } | null;
}
```

Notes:
- `learner` contains no "style" field, by construction (LS rule 22).
- `revealedPref` and `engagement` are tie-breakers inside the eligible set (MO2).
- `repCompetence` is the only learner trait the *medium* layer reads for learning. It shifts toward *variety* for
  low competence and *focus* for high competence. This is a prior from observational data and is flagged for
  E-MO3 (§12).

---

## 5. The planner

### 5.1 Output

```ts
export interface ModalityOption {
  modality: Modality; source: Source; artifactKey: ArtifactCoreKey; fill?: FillSpec;
  expReadySec: number; pReadyByNeed: number; expMinutes: number; marginalMicroUsd: number; fundMicroUsd: number;
  utility: number; reasons: string[];          // e.g. ["fit:quantity=3","phase:practice","tier:C→kit30fps","late-risk:0.12"]
}
export interface ModalityPlan {
  primary: ModalityOption;
  fallbacks: ModalityOption[];                 // ≥ 1, the last always source=library|on_device with marginal 0 (OA §9.4 floor)
  offerChoice?: ModalityOption[];              // 2-3 options when within δ (MO10)
  speculative: ForgeRequest[];                 // build races / prefetch jobs the Conductor may enqueue (never awaited)
  reservations: { scope: "child"|"library"; microUsd: number; id: string }[];
  traceId: string;                             // logged as modality.planned with ctx digest + reasons
}
```

### 5.2 Algorithm (code, deterministic apart from the seeded Thompson draw)

```
plan(ctx):
  # Stage 0: eligibility. Every rule is a predicate with a reason code; none is a prompt.
  E = all modalities
  E -= {m : fitPrior[m][s] == 0 for every shape s with w ≥ .3}     # §3.3 hard zeros
  E ∩= phaseMask[ctx.lesson.move]                                  # §3.4
  E  = affectGate(E, ctx.state.moment)                             # §5.3
  E  = deviceGate(E, ctx.device)                                   # §5.4
  E  = {m ∈ E : minMinutes[m] ≤ ctx.lesson.minutesLeft}            # time gate
  E  = {m ∈ E : formatCompatible(m, ctx.format.family)}            # §3.1, last column
  if E is empty: E = {voice}                                       # voice + anchor is always valid

  # Stage 1: realise each modality as (modality, source) options and score them
  for m in E:
    for src in sourceLadder(m, ctx):                               # §6; skips sources that cannot meet the need
      o = option(m, src)
      fit   = Σ_s w_s · fitPrior[m][s] / 3                         # 0..1
      learn = sigmoid(ctx.format.posteriorDraw) · quality(o)       # quality: artifact Beta posterior mean (§7.5), 0.8 for fills
      eng   = clamp(engagement[m].mean shrunk to the band prior, .3, 1)
      late  = 1 - o.pReadyByNeed                                   # need = teacherBridgeSec live, deadline for races
      U = fit · learn · (0.7 + 0.3·eng)
          − λT · o.expMinutes / ctx.lesson.minutesLeft
          − λC · o.marginalMicroUsd / max(ctx.budget.childDayLeftMicroUsd, 1)
          − λL · late
          − λS · switchCost(m, lastModalities[0])                  # 0 same, .5 same family, 1 different (cognitive reset)
          − λR · repeats(m, lastModalities[0..3]) · (repCompetence < .5 ? 1.5 : 0.5)   # variety for novices
          + λP · revealedPref[m]                                    # small: preference is a tie-break
      keep o with U
  # Stage 2: pick, allowing exploration and choice
  rank options by U; with probability ε (= .15) draw primary uniformly from options with U ≥ U_max − .2 (LS §8.4 floor)
  if U_2 ≥ U_1 − δ (= .08) and move ∉ {retrieval, teachback} and choiceRate(vibe) allows: offerChoice = top 2-3 (distinct modalities)
  # Stage 3: fallbacks and reservation
  fallbacks = best option per cheaper source with pReadyByNeed ≈ 1, ending in a library|on_device option with marginal 0
  reserve(child, primary.marginal) or demote primary to the first fallback whose reservation succeeds (OA §9.2)
  speculative = races for the primary key if source ∈ {build_race} and libraryFund reservation succeeds
  return plan
```

Starting weights [U, tune on replayed logs (§12)]: λT = .3, λC = .2, λL = .6, λS = .15, λR = .1, λP = .05.
λL is large on purpose. A late medium in a live lesson costs more than a plain one, because the teacher has to fill
dead air. The Q-gates also mean "late" usually arrives with "untested".

### 5.3 Affect and attention gate (inputs from MI §2.5 and DA)

| moment | effect on the eligible set | why |
|---|---|---|
| frustrated, anxious | remove timers, builds and *new* mechanics; prefer a medium the child already knows (`lastModalities`), plus voice, diagram and the familiar sim | familiarity lowers extraneous load; MI targetP .85-.95 |
| fatigued, or `minutesInSession` > `attentionBudgetMin` | remove game levels > 1, video and story; prefer a short close-win (voice or diagram) | MI `M.CLOSE-WIN`; DC §1.3 attention by age |
| boredUnder | allow a game in challenge mode or a test-out item; down-weight voice and text | MI: raise difficulty, not decoration |
| boredMeaning | up-weight story, video hook (if `phenomenon`) and interest context (F4); keep difficulty | "change channel or context" (MI) |
| curious | allow a sim in predict mode (an ungraded teaser) | information gap (MI §1.5) |
| gaming | remove multiple-choice-shaped games; prefer open sim goals and voice why-questions | DA §5.1; LS §7.2 |
| flow | add a switch-cost penalty (×2): do not change the medium while it works | don't break flow |

### 5.4 Device, network and audio gate (inputs from LE §2, §7, §9)

| condition | rule |
|---|---|
| tier D, or Android Go | modalities ⊆ {voice, text, diagram, sim(T1), story(text), song(T1 engine), worksheet}; no video, no kit games |
| tier C | games capped at 30 fps; heavy archetypes swapped for the T1 engine (LE §2); video only if already on the device |
| `net = offline` | source must be `on_device` (packs) or `library` already cached; the planner never schedules a fetch |
| `net = poor`, or `dataSaver` | no video; images ≤ 60 KB; animation preferred over image; whole-lesson extra media ≤ 3 MB (LE §3) |
| `audioOut = muted` (shared room, night) | song removed; voice is replaced by `text` + captions; animation narration becomes captions |
| realtime link degraded (LE §7 rung ≥ L2) | prefer media that carry the meaning without speech (diagram, sim with on-screen goals) |

### 5.5 Why the LLM does not choose

An LLM was considered as the live chooser ("given this context, choose the best modality"). It is rejected for the
live path:
- it is not replayable;
- it takes 1.9-2.9 s per call [M luna/sol wall];
- it does not respect hard zeros without a validator, and the validator then *is* the planner;
- the inherited law applies: "safety by predicate, not instruction".

The LLM's jobs are:
- **offline shape labelling** (§3.2);
- **candidate misconceptions and distractors** (§7.2; generate → retrieve → rerank, anchored to the correct
  solution);
- **briefs** for Forge (LG §7.3);
- **the night deliberation** (OA §4.5) that may propose *which topics* to pre-build. Code accepts or rejects that
  proposal.

---

## 6. Generate now, pre-generated or library: the source ladder

### 6.1 Rules

`sourceLadder(m, ctx)` returns, in this order, the sources whose preconditions hold:

| source | precondition | typical ready time | who pays |
|---|---|---|---|
| `on_device` | the artefact is in an installed pack (LE §8) | 0 | nobody |
| `library` | an exact core key hit with `quality.mean ≥ q_min` (.6) and a gate pass for the current gate version | 0.1-0.3 s (blob + CDN) [U] | nobody |
| `library_fill` | a core hit plus a per-child fill (numbers, items, interest skin, language strings) | 1-3 s luna fill [U]; 3-25 s for a G1 game [U] | child (marginal) |
| `prefetched` | built for this child or cohort at night or at lesson start (DC §9; OA §5.2) | 0 | already paid |
| `generate_now` | m ∈ {text, diagram, animation, story, song(fill), sim(T1 spec)} **and** P(valid ≤ teacherBridgeSec + 5 s) ≥ .9 **and** the output passes its schema validator | 2-10 s | child |
| `build_race` | m ∈ {sim(T2), game(G2), image} **and** deadline ≥ P50 build time **and** the library fund reserves. The child always gets a fallback; the late artefact lands in the library | minutes | library fund |
| never live | video; G3; any per-child image; any per-child "core" | n/a | n/a |

### 6.2 The personalisation test: what deserves per-child generation

Generate per child only what is **cheap, validated by schema, and has evidence of effect**:
- interest contexts in word problems and story frames (interest meta g = .36-.55, LS §2.4) [S];
- the child's own numbers and difficulty (KT targetP, MI §2.6);
- language mix and reading level (Learn Your Way's two personalisation axes) [V];
- the child's name and teacher callbacks, injected at **runtime** by the host so they never enter a shared
  artefact (DPDP; OA C8).

Everything visual and every mechanic is a shared core. The per-child effect of a bespoke *mechanic* has no evidence,
while its cost is about 300× a fill (§9.1).

### 6.3 Latency and cost, end to end (the planner's `expReadySec` and `marginalMicroUsd` tables)

| modality × source | P50 ready | P95 ready | marginal $ | shared $ | basis |
|---|---|---|---|---|---|
| voice | 0.8 s | 1.7 s | voice budget | | [M] realtime bakeoff 0.9-1.7 s turn |
| diagram generate_now | 3 s | 8 s | 0.003 | | [U] luna wall 1.88 s [M] + DSL lint/repair |
| sim library_fill (T1 spec) | 2 s | 4 s | 0.003 | | [U] TM §3.5 |
| game library_fill (G1) | 5 s | 25 s | 0.003-0.01 | | [U] LG §8 |
| game build_race (G2) | 8 min | 15 min | 0 | 1.5-3.5 | [U] LG §8 |
| single-file module build (codex) | 23 s gen | 32 s gen | | ~0.04 | [M] game-kit probe, n=64, median 20-32 s per framework, $2.40 / 64 |
| image prefetch (low / medium) | 23 s | 60 s | 0 | 0.006 / 0.053 | [M] n=1 23 s; [S] price |
| video library build (8 s, 720p) | 90 s | 124 s | 0 | 0.80 + review | [M] n=4, 55-124 s wall |
| TTS narration (offline) | 0.3 s TTFB | 0.8 s | 0.015/min | | [M] mini-tts TTFB median 303 ms |
| story text fill | 2 s | 4 s | 0.002-0.004 | | [U] |

---

## 7. Anticipatory generation

### 7.1 Four horizons

| horizon | when | what is built | keyed at | budget line |
|---|---|---|---|---|
| H0 catalogue | before launch, then weekly | for every objective: the top-2 misconceptions × 1-2 mechanics as G2 cores; diagram and animation cores; skin packs (8 interest themes × ~6 images); phenomenon video hooks for `phenomenon` topics only | core | library fund (one-off ≈ $3.7k for 1,476 game cores across 9 classes × 82 topics × 2 misconceptions **[sim]**; LG estimated ≈ $7.5k for 3,000 builds [U]) |
| H1 night | 22:30-05:30 IST (DC §9) | aggregated demand: for each child's predicted topics (top-2, p ≥ .3), the top-k misconceptions by P(m \| child), *summed across children per core key* and ranked by demand / cost under a nightly cap; per child: spec fills, story text, worksheets, offline TTS | core (shared); fill (child) | library fund (cores); child night cap N4 (fills) |
| H2 lesson start | `module.requested` race (OA §5.2) | the lesson's primary medium for the planned objective, if the library misses | core | library fund |
| H3 in lesson | after the first diagnostic probe (≈ minute 3, lesson-arc §6) identifies m | a remediation core for (objective, m), raced against the practice-phase deadline; meanwhile the T1 contrast engine teaches | core | library fund |

### 7.2 Predicting a child's misconceptions

```
logit P(m active | child c, topic t) =
      a_m                                    # prevalence, by class and board: from diagnostic MCQ outcomes (Eedi-style:
                                             #   one distractor per misconception, kit.misconceptions[].diagnostic)
    + b · flag(c, m' ∈ related(m))           # the child holds a related misconception on a prerequisite skill (KT §1.6 states)
    + d · (1 − pKnown(c, prereq(t)))         # weak prerequisites raise every misconception on t
    + e · cohortRate(m, school/class, 14d)   # school-sync cohort, shrunk
    + f · photoEvidence(c, m)                # homework or school-paper photos (need-goals §6)
```

- **Cold start for a_m.** The 601 curriculum misconception strings in `data/curriculum/` [V repo count: maths 344,
  science 180, evs 68, sst 9; english and hindi 0] start at a_m = logit(.25) for a topic's first-listed misconception
  and logit(.10) for the others [U].
- **LLM-proposed candidates.** Candidates from generate → retrieve → rerank, anchored to the correct solution, enter
  at logit(.05) and are *never* pre-built until they have been observed at least 5 times. LLM simulators are not
  faithful (SFS ≈ 0) and LLM difficulty estimates skew easy [S].
- **English and Hindi.** These have no listed misconceptions today. Their remediation is error-type based (phonics
  confusions, gender agreement), so pre-building there means *item* variants, not cores.

### 7.3 What to pre-build: value per unit cost

For a core key k = (objective, m, mechanic, band):

```
demand_k   = Σ_children P(topic tomorrow) · P(m | child) · P(medium chosen | context)     # expected uses tomorrow
reuse_k    = demand_k + E[uses over the next 30 days]                                     # from the cohort's calendar spread
value_k    = reuse_k · Δ · (1 − P(ready via in-lesson race))                              # Δ = gain of bespoke over the T1 fallback, prior .05 [U]
build if value_k / cost_k is in the top-N under the nightly library cap
```

A G2 core costs about $2.5 [U]. A remediation *diagram or animation* core costs about $0.003-0.01, so the planner
pre-builds those for **every** listed misconception of every predicted topic. The cheap media should never miss.

### 7.4 What the simulation says (`modality-planner-sim.py` S2) **[sim]**

Model:
- a moving syllabus, with each child at an offset ~ N(0, 3 topics) from the class calendar;
- a 5-long Zipf tail of misconceptions;
- P(a misconception surfaces in a lesson) = .4;
- an in-lesson G2 race is ready by practice time with P = .6.

| children | policy | served-ready | 30-day builds | spend |
|---|---|---|---|---|
| 300 | build-on-miss only | 89.3% | 847 | $2.1k |
| 300 | night top-3, cap 150 | 96.0% | 1,014 | $2.5k |
| 300 | seeded top-2 catalogue + night | 96.5% | 509 (+1,476 one-off) | $1.3k (+$3.7k) |
| 3,000 | build-on-miss only | 98.4% | 1,251 | $3.1k |
| 3,000 | night top-3, cap 150 | 99.1% | 1,370 | $3.4k |
| 30,000 | build-on-miss only | 99.8% | 1,472 | $3.7k |

How to read it:
- **At launch scale, anticipation and seeding buy about 7 points of "a bespoke remediation was ready".**
- **At ≥ 3k children the cohort warms the library by itself.** Only the first child on a key pays the race, and the
  T1 engine covers that child anyway (N2).
- At scale, the night's value moves from *coverage* to **quality**: extra repair rounds, the Q9 judge, human review
  of the most-used cores, and long-tail misconceptions.
- **Caveat:** one calendar per class is optimistic. Boards (CBSE vs RBSE), school calendars and revision spread the
  cohort. M-MO2 (§12) measures the real spread.

---

## 8. Caching and reuse across students

### 8.1 Three layers, three keys

```ts
export interface ArtifactCoreKey {            // expensive, shared, content-addressed
  modality: Modality; objectiveId: string; misconceptionId: string | null;
  mechanic: string;                           // engine@ver | wrapper@ver | archetype@ver | "scene@1"
  band: "B1"|"B2"|"B3"|"B4";                  // hit sizes, words-on-stage, choices (scene DSL BANDS)
  deviceClass: "full"|"lite";                 // tier A/B vs C/D variant (frame caps, no physics)
  kitVersion: string; gateVersion: string; generatorVersion: string;   // model + prompt-shape + kit ids
}
export interface SkinKey { theme: "cricket"|"food"|"animals"|"vehicles"|"films_music"|"festivals"|"space"|"generic"; styleVersion: string }
export interface FillSpec {                   // per child, cheap, never stored in the shared artefact
  items: string[] /* kit item ids */; numbers?: Record<string, number>; lang: "hi-Latn+en"|"hi"|"en";
  stringsTableId: string /* per (core, lang), verified once by a native-speaker check */; difficulty: number; pacing: "slow"|"medium"|"fast";
}
// hash = sha256(canonicalJSON(key)) ; blob path forge/core/<hash>/ ; skin forge/skin/<theme>@<v>/ ; fills live in Neon, never in blob
```

The rules that make it work:
1. **Language and interest never enter the core key.** Cores take strings by id from a `stringsTable`, built once
   per (core, lang) and checked. Interest is a *skin* (sprites, palette, nouns) bound at mount time. Compare
   scheme B with scheme C in §8.2.
2. **The child's name and memories never enter any artefact.** The host injects them at runtime through the
   `init` message (TM §3.4).
3. **Keys are exact.** An embedding index over (objective text, misconception text) is used offline to *propose*
   that a new topic can reuse an existing core. A human or a deterministic engine-compatibility check confirms it,
   and the result is written as an alias row. Nothing is ever served on similarity (CacheAttack) [S].
4. **Versioned, superseded and never deleted.** A kit or gate version bump marks cores `stale`. Stale cores still
   serve as fallbacks until rebuilt, and are revalidated by re-running Q0-Q5 (cheap) before being re-promoted.

### 8.2 Reuse by key scheme (S1, remediation-game requests over 30 days) **[sim]**

| children | A: per child | B: core with skin and language baked in | **C: core + skin + fill** |
|---|---|---|---|
| 1,000 | 10.8% hit, $0.715/child-day | 49.8%, $0.403 | **91.7%, $0.068** |
| 10,000 | 11.0%, $0.712 | 85.5%, $0.116 | **99.2%, $0.008** |
| 100,000 | 11.1%, $0.712 | 98.0%, $0.016 | **99.9%, $0.002** |

Per-child generation of game cores costs about 23% of the ₹299 (≈ $3.1/month) tier *per day*. That makes
scheme A a non-starter at any scale. Scheme C's remaining cost is dominated by fills.

### 8.3 Which artefact to serve when several qualify (the artefact bandit)

Each core carries a Beta posterior over a composite "worked" outcome:
- did not quit before level 2;
- replayed voluntarily (Again-Again);
- had a post-artefact probe success on the target misconception (maths-engines §3 probes; the delayed version
  weighs ×2).

Selection is by Thompson sampling among cores with the same key family. New cores get an optimistic prior (Beta(2,1))
for their first 20 serves. A core with mean < .45 after n ≥ 30 serves is **demoted**: it is excluded from planning,
and its brief goes back to Forge with the evidence pack. A core is **quarantined** immediately on any safety
incident or answer-truth defect. This is the in-production half of QA Q10.

### 8.4 Storage

| what | where | retention |
|---|---|---|
| cores, skins | Blob `taxilaforge/forge/core/<hash>/`, CDN-cached, public-read behind unguessable hashes (decisions `forge-infra-azure`) | while referenced; superseded versions kept 180 days |
| strings tables | Blob, beside the core | as the core |
| fills, serves, outcomes | Neon `artifact_serve(child_id, core_hash, fill_id, outcome jsonb, at)` | learner-data retention (LS §8.6) |
| index | Neon `artifact_core(hash pk, key jsonb, status, quality_a, quality_b, gate_version, created_at, superseded_by)` plus `artifact_alias(from_key_hash, to_hash, approved_by)` | permanent |

---

## 9. The content cost governor

### 9.1 Budget lines (added to OA §9.2's `budget` table as new scopes)

| scope | period | default limit | spends on | when exhausted |
|---|---|---|---|---|
| `child_content` | day | soft $0.05, hard $0.10 [U] | fills, generate-now, story text, offline TTS, worksheets | soft: generate-now becomes library-only for that child; hard: everything marginal-zero (library, on-device, voice) |
| `child_night` | night | $0.03 [U] (DC N4) | per-child night fills and TTS | shed TTS, then stories, then worksheets; keep the lesson brief |
| `library_fund` | day | $150/day at launch [U]; then a % of revenue | G2/T2 races, H1 cores, images, video, judges | queue by value/cost (§7.3); races still fall back |
| `deployment` | minute | image 4 RPM, realtime 10 RPM [V] | everything | priority: lesson start > in-lesson generate-now > races > night |

- **Attribution.** A child is charged only for marginal work done *for that child* (fills). A library miss is
  charged to the fund. To stop one child draining the fund, misses are capped at 2 races per child per day [U].
- **Reservation.** Before spending, the planner reserves the worst case (max tokens × price, or images × price) and
  settles later with actual usage (OA §9.2). A failed reservation is not an error. It demotes the option to the
  next fallback inside `plan()`.

### 9.2 Knapsack for the library fund

Every night and every hour, the Conductor holds a queue of candidate builds `(key, value_k, cost_k, deadline)`.
It fills the remaining fund greedily by `value_k / cost_k` (the PILOT-style multi-choice knapsack [S], greedy is
enough at this size), subject to:
- the `azure:image ≤ 3` concurrency (OA §5.3);
- the codex rate bucket;
- ≥ 30% of the fund held for in-lesson races (H2/H3) until 18:00 IST, the evening lesson peak (DC §2).

### 9.3 What a default day costs a child (S3) **[sim]**

Inputs [U]:
- about 8 fills a day at $0.003;
- 0-3 live diagrams;
- per-child TTS in 50% of days (2 ± 1 min);
- a story on 30% of days and a worksheet on 20%;
- an in-sim miss share of 20% (sensitivity only).

| | mean | p50 | p90 | p99 |
|---|---|---|---|---|
| marginal content $ per child-day | 0.053 | 0.039 | 0.075 | 0.54 |

Reading it:
- The p99 is entirely the miss-share term. That is why MO8 charges misses to the fund, which brings p99 under $0.10.
- About 28% of the mean is per-child TTS, which is why live narration is done by the teacher (§3.1). With both
  changes, the expected marginal spend is about $0.028/child-day ≈ **$0.85/child-month** [sim, I].
- That is still about 27% of a ₹299 tier (at the MO8 reversal line), before voice. **The cheapest remaining lever is a per-child fill
  cache keyed by (child, item set, core):** revision days reuse yesterday's fills. Measure it in M-MO4.

### 9.4 Per-modality degrade ladder (extends OA §9.4)

| modality | rung 0 | rung 1 | rung 2 | floor (marginal 0) |
|---|---|---|---|---|
| game | library core + G1 fill | G1 kit default levels | T1 engine practice | tap-to-answer items from the kit |
| sim | library T2 | T1 engine + spec | T1 default params | static diagram |
| animation | library | generate-now scene | static diagram sequence | voice + anchor |
| image | library | prefetched (night) | SVG scene | none |
| video | library | animation of the same phenomenon | diagram | voice description |
| story | prefetched personalised | kit story with interest noun swap | voice-told | text |
| song | library chant | rhythm engine + kit lyric | teacher chants | text list |
| worksheet | night fill | kit default worksheet | | on-screen items |

As in OA: **degradation may change richness, never correctness or safety.** Every rung uses verified kit answers.

---

## 10. What the teacher says and sees

- **Bridging.** When a plan's primary needs more than 1 s, the Director gets `primary.expReadySec` and emits a
  *bridge shape*: a preamble move that names what is coming without promising it, and that has a fallback. It is a
  shape, never a line (inherited law). If the option misses its `pReadyByNeed` deadline, the Director silently
  mounts `fallbacks[0]`. The teacher never says "loading".
- **Visibility.** Module events (`ready`, `param_change`, `goal_met`, `answer`, `idle`, `error`; TM §3.4) and
  kit-emitted game telemetry (game-kit §4.4) are folded into the Director's turn context. The teacher can then say
  what the child did, and only what the kit emitted. `modality.planned.reasons` gives the teacher a truthful "why
  this" for the parent report.
- **The child's choice.** When `offerChoice` is set, the Director renders 2-3 tiles. The choices are about medium,
  never about whether to do the evidence-based core. The child's pick updates `revealedPref`.

---

## 11. Worked examples (what `plan()` returns)

1. **Class 4, fractions (equivalent fractions), P3 first exposure.** B2, tier C, net ok, flow, misconception
   "bigger denominator = bigger fraction" flagged from a prerequisite.
   - The shape is `quantity` (1.0). Game is masked (first exposure), image and video are zero-fit.
   - Eligible: diagram, sim, animation, voice.
   - Primary: `sim` / `library_fill` (fraction-bars@1 in predict mode, contrast spec), ready in 2 s.
   - Fallbacks: diagram contrast (library), then voice + anchor.
   - Speculative: none (the core exists).
2. **The same child at P5 practice.** The H3 race for the G2 core (equiv-fractions × biggerDenominator ×
   "chai-stall" × B2) is in flight with an ETA of 4 min, but practice starts in 1 min.
   - pReadyByNeed = .1, so the late penalty dominates.
   - Primary: `game` / `library_fill` (G1 `dukaan@1` with the child's numbers, food skin).
   - The race continues and lands in the library for the next child.
3. **Class 2, months of the year, P5, child fatigued at minute 19 of a 20-minute budget.**
   - The shape is `verbatim`, so song fits best (3), but the fatigue gate keeps only short close-wins.
   - Primary: `song` / `library` (chant of the months, 40 s), narrated by the teacher.
   - `offerChoice`: none (fatigue).
4. **Class 8, monsoon formation, P3, tier B, data saver on.**
   - The shapes are `phenomenon` .6 and `process` .4. Video is allowed by fit but removed by data saver.
   - Primary: `animation` / `library` (scene timeline: sea → evaporation → wind → hills).
   - `offerChoice` = {animation, story ("a raindrop's journey"), sim (wind × temperature)}, all within δ.
5. **Class 6 child, homework on a weekend evening, offline.**
   - Only `on_device` sources are allowed: a worksheet from the night pack, plus a pack game on today's topic.

---

## 12. Measurements (each one goes to `context/measurements.md` with n, method and date)

| id | what | method | pass / decision |
|---|---|---|---|
| M-MO1 | **Planner invariants** | property tests over 10k random `PlannerContext`s: no hard-zero modality chosen; no game on first exposure; every plan has a marginal-0 floor; no reservation above the limit; offline ⇒ only on-device sources | 0 violations, in CI (`evals/`) |
| M-MO2 | **Cohort spread** | from 2 weeks of real school-sync data: the per-class distribution of syllabus offsets; re-run S2 with the measured spread | if served-ready < 95% at the current N, raise the night cap or seed more of the catalogue |
| M-MO3 | **Shape labels** | luna labeller vs 2 expert teachers on 100 topics (stratified by subject and class) | κ ≥ .7; else a human labels the disagreeing chapters |
| M-MO4 | **Content spend per child-day** | `cost_ledger` grouped by scope over 2 weeks with ≥ 100 children | mean ≤ $0.05; p99 ≤ $0.10; fill-cache hit rate reported |
| M-MO5 | **Latency truth** | `expReadySec` vs observed time-to-`ready` by modality × source, from India (Jio and Airtel 4G; tier C device) | calibration slope .8-1.2; else refit the §6.3 tables |
| M-MO6 | **Misconception predictor** | Brier and AUC of P(m \| child, topic) against diagnostic outcomes on ≥ 50 topics; LLM-only prior as the baseline | the predictor beats prevalence-only; the LLM prior stays below prevalence-only (expected) |
| M-MO7 | **Artefact bandit health** | share of serves on demoted-or-better cores; time to demote a seeded bad core (mutant corpus from QA §8) | bad core demoted within ≤ 40 serves |
| E-MO1 | **Choice vs silent pick** | within-child A/B over 4 weeks, ≥ 60 children per band: offer the choice when within δ vs serve the top option | keep choice unless completion or delayed retrieval is worse (MO10 reversal) |
| E-MO2 | **Planner vs fixed defaults** | randomise lessons to the planner vs a per-topic-type fixed medium (the population-best table); primary outcome delayed retrieval at 1 week | the planner must not be worse. If it is not better, keep only the gates and the source ladder (the feasibility half) and drop the utility weights |
| E-MO3 | **Variety for novices** | λR × repCompetence on vs off | adopt only if delayed transfer improves for low representational competence (Revenga-Lozano is observational) |
| E-MO4 | **Video hook value** | library video hook vs the animated version of the same phenomenon, 6 topics | MO9 reversal condition |

**Kill criteria.**
- If E-MO2 shows no gain, the product claim is limited to "Taxila shows each topic in the form that fits it, on any
  phone, instantly". That claim is true and defensible without per-child medium personalisation.
- If M-MO4 exceeds $0.10/child-day mean after the fill cache, generate-now is restricted to diagrams and story text.

---

## 13. Proposed `context/` entries (for the main loop to merge through `context/inbox/`)

- **decision `modality-planner-code`** (MO1, MO2). Reverse if the conditions in §0 are met.
- **decision `artifact-key-core-skin-fill`** (MO5), with the S1 numbers as **[sim]**, not a measurement.
- **decision `content-budget-lines`** (MO8): child_content $0.05/$0.10, misses on library_fund.
- **decision `video-library-hook-only`** (MO9). It cites the measured probe: 4/4 completed, 55-124 s; the
  misspelled Devanagari title; the incomplete photosynthesis content.
- **rejection `semantic-cache-for-content`**: embedding-similarity serving. Why: correctness (a "similar" fraction
  game is a different objective) and CacheAttack's 86% hijack rate [S].
- **rejection `llm-simulated-students-for-prevalence`**: using LLM student simulators to predict which
  misconception a child will show, or to test remediation. Why: near-zero misconception faithfulness (SFS) [S].
- **rejection `per-child-core-generation`**: per-child game/sim/image cores. Why: 11% reuse, $0.71/child-day
  [sim]; no evidence of a per-child mechanic effect.
- **measurement `modality-planner-sim-2026-10-02`**: S1-S3 as [sim] with all inputs listed [U]. It is not
  comparable to real data until M-MO2 and M-MO4 exist.
- **flag (conflict to resolve).** This task brief lists `taxila-opus` and `taxila-sonnet` as available. The repo
  `CLAUDE.md` (Azure first-party only) and `context/decisions.md#azure-only-compute` say those deployments were
  removed. The planner and governor here are model-agnostic. Every price row uses Azure OpenAI first-party models,
  and the Claude columns in LG §8 stay comparison-only until the owner resolves this.

---

## 14. Risks and open questions

1. **The fit prior is a hand table.** It encodes the authors' judgement more than measured fit. M-MO3 audits the
   labels. Nothing yet audits the *matrix* except E-MO2. Until then, treat it as the population default the bandit
   explores around, not as truth.
2. **Choice can become a preference treadmill.** Children pick the familiar and fluent medium (LS §2.6). Choices
   are offered only among options within δ on *learning* utility, so preference cannot override the core. Watch
   for children who always pick the game and see whether their delayed retrieval falls.
3. **Cohort spread is the swing variable** for whether anticipation pays (§7.4). Boards, holidays, school calendars
   and catch-up children spread demand.
4. **The quality posterior is confounded by who gets served.** Early cores serve early adopters. Compare cores on
   matched children (KT ability strata) before demoting on outcomes rather than quits.
5. **Sora on Azure works today but has no successor** (LG §6 notes OpenAI's own API shutdown on 2026-09-24 [S]).
   Every video hook therefore has an animation twin in the library, built from the same brief.
6. **Hindi strings tables need native review per core.** This is a human cost that scales with cores × languages.
   Budget about 2 minutes per table, with spot checks after the first 200 [U].
7. **Open question: should the teacher "argue" for a medium?** A teacher that says "I think a picture will help
   here" sets an expectation and models metacognition. It also risks sounding like learning-style talk. Proposal:
   allowed only as a reason about the *topic* ("maps make this easier"), never about the child.

---

## Sources

Fetched or queried 2026-10-02 unless marked. Abstract-level reads are tagged [S] in the text.

- LearnLM Team (Google). *Towards an AI-Augmented Textbook* (Learn Your Way). arXiv 2509.13348, Sep 2025.
  https://arxiv.org/abs/2509.13348 · HTML read in full for method and RCT: https://arxiv.org/html/2509.13348 [V]
- Kovshov, A., Choudhury, A., Iurchenko, A., et al. *Harnessing Generative UI for Education: Tailored Learning
  Interactives.* arXiv 2609.20738, 2026-09-17. https://arxiv.org/abs/2609.20738 [S]
- Google. *Guided Learning in Gemini.* 2025-08-06. https://blog.google/outreach-initiatives/education/guided-learning/ [V]
- Revenga-Lozano, N., Avila, K. E., Steinert, S., et al. *Personalized Multimodal Feedback Using Multiple External
  Representations: Strategy Profiles and Learning in High School Physics.* arXiv 2601.09470, 2026.
  https://arxiv.org/abs/2601.09470 [S]
- Leiker, D., Gyllen, A. R., Eldesouky, I., et al. *Generative AI for learning: Investigating the potential of
  synthetic learning videos.* arXiv 2304.03784, 2023. https://arxiv.org/abs/2304.03784 [S]
- Li, Z. R.-Y., Barry, C., Cukurova, M. *Adult learners recall and recognition performance and affective feedback
  when learning from an AI-generated synthetic video.* arXiv 2412.10384, 2024. https://arxiv.org/abs/2412.10384 [S]
- Luo, Y., Yuan, Y., Chen, J., et al. *MMMG: A Massive, Multidisciplinary, Multi-Tier Generation Benchmark for
  Text-to-Image Reasoning.* arXiv 2506.10963, 2025. https://arxiv.org/abs/2506.10963 [S]
- Sonkar, S., Chen, X., Liu, N., et al. *LLM-based Cognitive Models of Students with Misconceptions.* arXiv
  2410.12294, 2024. https://arxiv.org/abs/2410.12294 [S]
- Do, H., Sonkar, S., Sachan, M. *Simulating Students or Sycophantic Problem Solving? On Misconception Faithfulness
  of LLM Simulators.* arXiv 2605.12748, 2026. https://arxiv.org/abs/2605.12748 [S]
- Zengaffinen, Y., Opedal, A., Rooein, D., et al. *Can LLMs Model Incorrect Student Reasoning? A Case Study on
  Distractor Generation.* arXiv 2603.15547, 2026. https://arxiv.org/abs/2603.15547 [S]
- Mitton, J., Bhattacharyya, P., Smith, D., et al. *Misconception Diagnosis From Student-Tutor Dialogue: Generate,
  Retrieve, Rerank.* arXiv 2602.02414, 2026. https://arxiv.org/abs/2602.02414 [S]
- Wang, X., Jiao, H., Li, M., et al. *Can LLMs Really Understand Item Difficulty Levels?* arXiv 2607.28634, 2026.
  https://arxiv.org/abs/2607.28634 [S]
- Scarlatos, A., Fernandez, N., Ormerod, C., et al. *SMART: Simulated Students Aligned with IRT for Question
  Difficulty Prediction.* arXiv 2507.05129, 2025. https://arxiv.org/abs/2507.05129 [S]
- Walkington, C., Beauchamp, T., Ikram, F., et al. *Mathematics Teachers' Interactions with a Multi-Agent System for
  Personalized Problem Generation.* arXiv 2604.12066, 2026. https://arxiv.org/abs/2604.12066 [S]
- Zhang, Z., Liu, Z., Xie, Y., et al. *From Similarity to Vulnerability: Key Collision Attack on LLM Semantic
  Caching.* arXiv 2601.23088, 2026. https://arxiv.org/abs/2601.23088 [S]
- Panda, P., Magazine, R., Devaguptapu, C., et al. *Adaptive LLM Routing under Budget Constraints* (PILOT). arXiv
  2508.21141, 2025. https://arxiv.org/abs/2508.21141 [S]
- LearnLM Team, Eedi, et al. *AI tutoring can safely and effectively support students: An exploratory RCT in UK
  classrooms.* arXiv 2512.23633, 2025. https://arxiv.org/abs/2512.23633 [S]
- Gao, J., Dubé, A. K. *Personalizing Mathematical Game-based Learning for Children: A Preliminary Study.* arXiv
  2603.25925, 2026 (level-validity classifier; background for §8.3). https://arxiv.org/abs/2603.25925 [S]
- In-repo (read today, [V]):
  - `docs/research/learning-science.md` §2, §8;
  - `docs/research/tech-and-market.md` §3;
  - `docs/research/factory/llm-game-generation.md` §0, §8-10;
  - `docs/research/conductor/orchestration-architecture.md` §0, §5, §9;
  - `docs/research/conductor/day-cycle.md` §9;
  - `docs/research/learner/motivation-interest.md` §2.6;
  - `docs/research/learner/vibe-temperament.md` §4.2;
  - `docs/research/design/low-end-offline.md` §2-3;
  - `docs/research/factory/game-kit-frameworks.md` §2.4 (codex probe, n=64);
  - `docs/research/factory/video-probe-2026-10-02/results.json` and contact sheets (sora probe, n=4);
  - `context/measurements.md` (`infra-smoke-2026-10-02`; image 23 s);
  - `context/decisions.md` (`forge-models`, `azure-only-compute`);
  - `data/curriculum/*.json` (742 topics, 601 misconceptions, counted by script);
  - `shared/contracts.ts`; `server/director/modules.js`.
- Earlier research cited through LS, not re-fetched here: Pashler 2008; Willingham 2015; Noetel 2022; Reinwein
  2012; Rey 2012; Walkington 2013; Patall 2008; Schmucker 2025; Rafferty 2019; Clément 2015.
