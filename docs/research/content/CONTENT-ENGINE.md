# CONTENT-ENGINE: the build spec for Taxila's live learning modules

**Date:** 2026-10-02 · **Status:** synthesis of the `content/` workstream. This is the build spec. Where the sibling documents disagree, this one rules, and §0.2 records each ruling with what would reverse it.

**What it covers.** During a live voice lesson the backend picks, fills, validates and mounts a module while the teacher talks: a manipulative, simulation, game wrapper, diagram, narrated animation or chant. The child's actions stream back as facts, so the teacher "sees" what the child does. This document specifies:

| § | content |
|---|---|
| 1 | Architecture: tiers T0–T3, latency budgets, modality choice rules, where code runs |
| 2 | The engine catalogue: 45 engines, their params, events, misconceptions, probes, size and v1 priority, plus computed coverage |
| 3 | The `scene@1` DSL (JSON Schema) |
| 4 | The module↔host protocol (bridge v2, TypeScript) |
| 5 | The teacher observation pipeline (event → coalesced observation → Director) |
| 6 | The diagram, image, animation, video and chant pipelines |
| 7 | The teacher-stage component |
| 8 | Validation harness and safety |
| 9 | v1 build order |

**Inputs read in full, engineering reviews included.** In this folder: `maths-engines.md` (+ `maths-engine-map.json`), `science-engines.md` (+ `science-engine-map.json`), `language-sst-engines.md` (+ `language-sst-engine-map.json`), `game-mechanics.md`, `genui-reliability.md` (+ `genui-scene-dsl.mjs`, `.schema.json`, bench JSON), `sandbox-telemetry.md` (+ probe), `diagrams-images.md` (+ 3 probes), `animation-video.md` (+ `explainer-dsl.mjs`, bench, render, Sora probe), `songs-rhymes-audio.md` (+ chant probes) and `teacher-visual.md` (+ sync probe). From the level above: `tech-and-market.md` §3–4 and `learning-science.md` §2.4, §6 and §8.4. From the code: `shared/contracts.ts`, `src/modules/`, `context/decisions.md`. Each section names the sibling section it rests on, so the detail and the raw evidence stay one hop away.

**Evidence tags.**
- **[X]** measured in this repo; the script and raw JSON are in this folder.
- **[V]** a primary source read by a sibling workstream.
- **[S]** a secondary source.
- **[U]** an estimate or unverified claim.
- **[I]** an inference made by this synthesis.

No new measurements were taken for this document. Every number below is inherited from the sibling that measured it. **Coverage figures in §2.3 were computed here** from the engine maps by `content-engine-coverage.py` (in this folder), against all 514 maths, EVS and science topics.

---

## 0. Decisions

### 0.1 What this spec decides

1. **Models fill data; tested code renders, grades and animates.** The evidence is consistent across every modality we measured:
   - free generated interactives pass 3.5% one-shot [V];
   - free scenes pass 0/8 first call on `taxila-fast` [X];
   - free explainers pass 3/8 [X];
   - Sora drew 3 + 3 apples under "3 + 4 = 7" [X];
   - gpt-image-2 put Hindi labels on the wrong part 5/32 times [X].

   So **no model writes event-handling code, geometry, correctness keys, labels on images, or facts in video for a live child** (genui §0.1, diagrams §0, animation §0).
2. **Four tiers plus a library.**
   - **T0:** a reviewed engine with a kit preset.
   - **T1:** an engine plus params filled live; measured 1.88 s p50 / 2.05 s p90 [X].
   - **T2a:** a `scene@1` template fill; measured 3.08 / 3.35 s [X].
   - **T2b:** a free `scene@1`, near-line only, requested at least 45 s ahead.
   - **T3:** free HTML, offline only, behind gates V0–V9 and two-key review.
   - **lib:** promoted T2b and T3 assets.
   - The router is deterministic server code (genui §3.1). The model never picks its tier, template or renderer.
3. **Live non-interactive media are also template fills.**
   - **Animation:** `explainer@1`, 8 templates, 8/8 valid at 2.88 s p50 [X].
   - **Diagrams:** a spec fill that code lays out.
   - **Chant:** pre-rendered, reviewed clips scheduled on a Web Audio beat.
   - **Images and video are library-only.** Images take about 23 s; Sora is B-roll behind a flag that is off by default.
4. **v1 ships 12 hand-built engines for maths and science:**
   - number-line, collections, place-value, fractions, multiply-divide, data-graphs, patterns (with the number grid), geoboard and measure;
   - motion-lab (the kinematics + forces + pendulum slice), sky (2D only) and water-cycle.

   They are the primary engine for **229 of 514 topics (44.6%)**: maths 59%, EVS and science 24%. With the T2a template and diagram layer the figure is **273 of 514 (53.1%)**. Every other topic has a defined fallback (§2.3).
5. **One protocol: bridge v2** (sandbox-telemetry §4), with the corrections in §4.
   - The maths, science, language, diagram, explainer and chant event dialects all become `interaction{name, facts}` with names drawn from each manifest.
   - **The host grades and the module only claims.** `classify.js` stops trusting `moduleAnswer.correct`.
6. **The teacher sees facts, never sentences.** Observations are `key=value` lines drawn from manifest vocabularies, ≤ 240 characters. They travel in three lanes (log, fold, milestone) behind a talk gate (sandbox-telemetry §5). Free text from a module or a child never enters the voice model's context as instructions.
7. **Misconception detectors are evidence, not verdicts.** A signal can only schedule a verifying probe, capped at one per 3 minutes. "Likely" needs at least 2 independent signals. No detector moves mastery, and none is shown to a parent as a diagnosis (learning-science §7.2; science §2.5; maths R.6).
8. **Every engine fades concrete → pictorial → abstract**, and a concept counts as learned-today only after an abstract-stage success (Fyfe, McNeil & Borjas 2015 [S]).
   - Concrete skins are bland and familiar: imli seeds, roti, matchstick bundles.
   - No confetti, mascots or decorative motion (Rey 2012 d = −0.30 / −0.48 [S]).
9. **Game wrappers sit on top of engines and never add an economy** (game-mechanics G1–G14).
   - The learning act *is* the game act, enforced by two CI tests.
   - No points, coins, streaks, leaderboards or child-vs-child competition.
   - Every wrapper must beat a no-wrapper arm before it ships widely.
10. **Performance target: p95 frame ≤ 33 ms on a ₹10k reference phone.** Continuous loops are capped at 30 fps; state-driven engines render on demand. Only one animating module is live at a time. The engines are vanilla TS on a shared `engine-kit`, with no React and no zod inside the frame. "60 fps" is promised only for compositor-only effects (maths R.3, science R1.1, teacher-visual C-23).
11. **Safety is by predicate, inherited and extended.**
    - The child-safety floor stays: never deny being an AI, Childline 1098 and Tele-MANAS 14416, safeguarding hand-off. This includes a ≤ 60 s cap on any window where the teacher is not listening (songs E5.1).
    - Content Safety is scored on the original string and its English gloss, plus a Devanagari and romanised blocklist, because Hindi is not among the trained languages [V].
    - No raster carries text. No generated map, flag, banknote or deity. No child free-text input in engines.

### 0.2 Arbitration: where the sibling documents disagreed

| # | question | positions found | ruling | reverse if |
|---|---|---|---|---|
| A1 | Event dialect | Four dialects: v1 code, tech-and-market §3.4, maths §3.2 (`action`, `probe_*`, `misc_signal`), science §2.2 (salience 0/1/2). Diagrams, explainer and chant each add more | **Bridge v2 only** (§4). Every engine event becomes `interaction{name:"ns.verb", facts}`. Probe results become `answer` plus a host `verdict`. Science salience 2 is derived by message kind. Misconception ids are canonical upper case, so science `mc.part.expand` → `MC.PART.EXPAND` | — (one contract is a precondition of building anything) |
| A2 | Where first-party engines run | `decisions.md#forge-sandbox-lanes`: a sandboxed iframe for generated code. Diagrams E0.2: run T1 engines as host React components to avoid font, image and mount costs. Songs E2.19: chant must be host-side | **v1:** every *visual* module (T0–T3) mounts in the sandboxed frame, with one protocol, one budget and one freeze rule. Fonts and engine chunks ship as hashed assets inside the APK with ACAO (already shipped [V]). Raster bases travel once in `init` as `data:` URLs. **Host-side, first-party:** anything that owns audio, the mic or the teacher stage: `chant-track`, the read-along speech window, `board@1`, the pointer overlay, `LockPanel` and `word-chain` | V15 on the reference phone shows frame mount > 1.5 s or a Devanagari font fallback for T0/T1. Then T0/T1 move in-process behind the same bridge API (an in-page MessageChannel adapter) |
| A3 | Frame rate | maths: 60 fps for most engines. science: cap 30. teacher-visual: 30 fps face | **Gate:** p95 frame ≤ 33 ms with no long task > 200 ms (V10, V15). 30 fps cap for continuous sims; render-on-demand otherwise | device lab shows ≥ 20% headroom on the reference phone; then raise the cap per engine |
| A4 | Debounce vs batching | maths §3.2: ≤ 4 Hz debounce. maths C6 and observer: batch, never drop. genui: 4 Hz settles | **The engine never drops semantic events.** It sends every semantic act; the token bucket allows 20/s with a burst of 40. The host observer coalesces (drags 600 ms, taps 400 ms). Pointer-move is never sent | ledger cost on device > 1 ms/s |
| A5 | Structured-output depth | maths C1: about 5 levels (from memory). genui: measured 10 levels, 400 properties, 1000 enums [X] | **Use the measured limits.** Still flatten every LLM-facing spec. `MathValue` has a string form (`"3/4"`, `"₹37"`, `"2:45"`), distractors are a flat list, enums are hoisted into `$defs`, and optional fields are nullable on the wire | Azure changes the limits (re-run `genui-azure-limits-probe.mjs` on every deployment change) |
| A6 | `<` and `>` in strings | genui S0 and diagrams D0 ban them in data | **Ban markup at the sink, not the characters.** All text renders via `textContent` or SVG `<text>`, never `innerHTML`. TeX uses `\lt` and `\gt`. "3 < 5" is class 1–3 content | — |
| A7 | `label-diagram@1` | genui template (sprite plus parts x,y) vs diagrams engine (verified anchor manifest) | **One engine:** the diagrams spec, compiled to `scene@1` nodes. The LLM picks a library base and part ids; anchors come only from a human-verified manifest. On phones: one label column ≤ 40% of the width, portrait or 1:1 bases, and a `numbered` mode for 7–8 parts (diagrams E1) | — |
| A8 | Sorting | `sorter@1` (game), `sort-bins@1` (T2a), `compare-venn` sort mode | **One mechanic, one semantic event `so.place`.** `compare-venn@1` is the T1 engine. `sort-bins@1` is its T2a twin through the scene alias map. Truth keys come only from verified kits (language review: live LLM truth arrays violate "a model never grades") | — |
| A9 | `lockbox@1` | game-mechanics: an engine | **A host `LockPanel` component** (game review C3). An iframe cannot read another iframe's committed value, and a dial with no free input removes the brute-force risk | — |
| A10 | Measurement engines | maths `measure@1` and science `measure-lab@1` overlap (rulers, zero error, balance, units) | **Merged into `measure@1`**, with science scenes (parallax, thermometers, three bowls) as scenes. Readings are entered by stepper or number pad, never by voice (science E14) | — |
| A11 | Devanagari wrapping and reveal | `Intl.Segmenter` (teacher-visual C-11) vs not reliable before ICU 74 (diagrams E0.4; language review) | **Wrap on spaces only.** Use a pure-JS akshara segmenter where grapheme units are needed (phonics, highlight). Line-height 1.5–1.6. `write` is a left-to-right clip wipe, never per character. Bundle subsetted Mukta and Noto Sans Devanagari | a WebView floor of Chrome ≥ 120 is adopted |
| A12 | Chant control surface | songs §7.2: `kit`, `bpm` and an `arc` array | **LLM-facing params are `kitId` (enum from the lesson plan), `mode`, `tempo: slow\|base\|fast`, `lines`, `passes`, and `arc: acquire\|consolidate\|recall`.** BPM is a kit property. There is no live-render fallback | — |
| A13 | Stage aspect | genui allows 3:4 | **4:3 and 1:1 only.** The host publishes `stageBox` (genui review: a 3:4 stage does not fit beside the teacher panel at 360×640) | kids-ux confirms 3:4 in a measured layout |
| A14 | Name in frame | `InitCtx.displayName` | **Never in T2/T3 frames.** Self-navigation is an exfiltration channel no CSP closes (sandbox review E.1.3). T0/T1 may show a first name through a host overlay only | — |
| A15 | Hindi C1–5 data | language doc: Hindi classes 1–5 never built, blocking the varnamala engine | **Closed since:** `data/curriculum/c1-hindi.json` … `c5-hindi.json` now exist (19 chapters in C1) [V, file listing 2026-10-02]. The *skills layer* (NIPUN components, grammar strands) is still missing for English and Hindi | — |

---

## 1. Architecture

### 1.1 Tiers

| tier | what is generated, by whom | output | validator | latency (measured / budget) | evidence weight | fallback |
|---|---|---|---|---|---|---|
| **T0** reviewed preset | nothing: a kit item names a reviewed engine preset | `ModuleSpec` | golden specs in CI | 0 ms (bundled) | 1.0 | — |
| **T1** engine + params | code fills operands, stage, skin, distractors (one generator per `MC.*` id) and traps. `taxila-fast` at effort `none` writes only `ask` (L10n, about 50 tokens), or nothing when a template exists | `ModuleSpec` for one of 45 engines | `safeParse` → `resolveParams` (clamp) → pure `lint(spec)` → `solve(spec) !== null` → string safety; < 5 ms [U] | **1.88 s p50 / 2.05 s p90** [X genui §4]; 0 on a prefetch hit | 1.0 (0.5 on an unverified mini-kit) | the kit's deterministic spec |
| **T2a** template fill | `taxila-fast` at effort `none` picks slots for a template the *router* chose | `{template, slots}` → `expand()` → `scene@1` | slot zod → autofix → lint S0–S7 → exact solver | **3.08 / 3.35 s** [X genui §6.3] | 1.0 after the template's review | T1 or board + voice |
| **T2b** free scene | `taxila-fast` or `taxila-brain`, strict schema, one repair | `scene@1` | same as T2a | 11.9–18.2 s p50 plus 10–13 s per repair [X]. **Near-line only: `horizonMs ≥ 45 s`** | 0.75 until promoted | T2a, T1, board |
| **T3** free-form | Forge offline (coder plus critic), `taxila-module@1` SDK only | HTML/JS/SVG/p5 | V0–V9 + harness V1–V15 + two-key human review | minutes to hours; never live | 0 as a draft; T0-equivalent once promoted to `lib:` | not shown |
| **lib** | promoted T2b/T3, reviewed explainers, figures, rasters, chant kits | immutable versioned assets | gates at promotion; telemetry-based retirement | 0 ms (prefetched) | per source tier | — |

**Non-interactive layers** use the same router, cache and telemetry:

| layer | live path | library path | spec |
|---|---|---|---|
| diagrams | `flow@1`, `concept-map@1`, `formula@1` and `contrast-pair@1` spec fills, about 1–3 s [U]; `label-diagram@1` over a library base | `svg-figure@1` free SVG with an assertion manifest; `illustration@1` rasters with no text | §6.1 |
| animation | `explainer@1` template, **2.88 s p50 / 3.46 s max** [X] | the same DSL with TTS bookmarks; MP4 only for sharing and the lite tier | §6.3 |
| video | never | Sora B-roll with no assertions, flag off by default; pre-rendered narration video in v2 | §6.4 |
| chant | `chant-track@1` plays a reviewed `ChantKit` | Forge render, gate A (ASR phonkey), gate B (human ear) | §6.5 |
| board | `board@1` items with `CueAt` on the teacher's speech clock | — | §7 |

### 1.2 Request flow

```
Director move ─► ModuleRequest{topic, skill, item, want{mechanic, probe, representation}, band, lang,
                               child{interests, activeMisconceptions, stage}, deadlineMs, horizonMs}
   └─► route()  (server, pure; genui §3.1 + diagrams §3 + format rules §1.4)
         ordered candidates: T0/T1 engine (engine map) → lib asset → T2a template (mechanic tag) → T2b (only if horizon ≥ 45 s)
         → diagram / explainer / chant layer when the move is "show", "explain" or "recite"
   └─► source ladder: device cache → server cache (exact key, never embedding similarity) → kit preset → live fill
   └─► validate (tier gates; first failure → precise slot error → ≤ 1 repair for T2, 0 for T1) → Content Safety (parallel with the preamble)
   └─► ModulePlan{tier, engine, spec, source, validatedBy, fallback (always present)}
   └─► client: mount frozen ─► ready ─► unfreeze at your_turn ─► events ─► observer@1 ─► lanes ─► Director
```

**Prefetch.** At the start of each teacher turn the Director plans modules for the two most likely next moves in parallel and caches them. At lesson start the planner sends the next 3–5 objectives' specs (≤ 5 KB each) and assets (≤ 120 KB WebP each) (genui §3.2, diagrams §4.7).

The cache key is `(engine@ver, topic, item, band, lang, skin, misc-set, intent, emphasis, validatorVersion)`. The `intent` and `emphasis` fields are added for explainers (animation E.7). Language and skin stay out of raster keys: labels are an overlay (MO5).

### 1.3 Latency budgets

The child-visible budget is the teacher's spoken preamble. A turn of about 25 words covers about 2–3 s, and an explain turn of 15–40 words covers 5–13 s (genui §3.2). A module always mounts frozen and unfreezes at `your_turn`.

| step | budget | measured or basis |
|---|---|---|
| prefetch or cache hit → mounted | ≤ 300 ms | engine assets in APK; mount p90 173 ms at 6× CPU [X sandbox P13] |
| T1 fill (cache miss) | ≤ 2.0 s p90 | 2.05 s [X] |
| T2a fill + validate | ≤ 3.5 s p90 | 3.35 s [X] |
| explainer template fill | ≤ 3.5 s | 3.46 s max [X] |
| diagram spec fill + layout | ≤ 3 s | 1–3 s [U]; dagre 2–10 ms for 6 nodes [X] |
| validation (T1 lint + solve; T2 S0–S7 + solver) | ≤ 5 ms T1; ≤ 50 ms T2 server-side | [U]; the solver is exact to 200k states |
| Content Safety on strings | ≤ 300 ms, in parallel | [U] |
| frame `ready` | ≤ 2 s at 6× throttle (V1); ≤ 1.5 s on the reference phone (V15) | [X] desktop proxy, [U] device |
| engine immediate feedback (tick or shake, sound request) | ≤ 100 ms after the act | engine contract (sandbox review E.3) |
| teacher reaction to a milestone | 1.2 s quiet hold + Director + `response.create` ≈ 2–3 s | sandbox §5.5 |
| board or pointer cue vs the spoken word | mark visible at word onset in ≥ 85% of cues; never > 2 s early, never > 0.5 s late | 86.7% at a 400 ms pre-roll, n = 60 anchors [X teacher-visual §5.2] |
| chant first beat after framing | ≤ 1 bar after `response.done` | count-in covers it (songs §10) |
| T2b scene | requested with `horizonMs ≥ 45 s` | 12–41 s incl. a repair [X] |
| images | never live | about 23 s; 16–22 s at low quality [X] |
| video | never live | 51–57 s per 4 s clip [X] |

### 1.4 Modality choice rules

The router chooses a modality from the **content** first and the **learner** second. It never uses a "style" (learning-science rules 22–24, §8.4). The inputs are:
- the topic's shape and type (the engine maps plus the five topic types: T1 verbatim, T2 vocabulary, T3 concept, T4 procedure, T5 problem-solving);
- the Director's move;
- the learner model's state.

```ts
// server/director/modality.ts — pure; unit-tested against a golden table per topic type × band × prior knowledge
type Modality = "engine" | "template" | "diagram" | "explainer" | "chant" | "wrapper" | "board_only";
interface ModalityInput {
  topicType: "verbatim" | "vocabulary" | "concept" | "procedure" | "problem";   // learning-science §8.4 T1–T5
  shape: "quantity" | "geometry" | "phenomenon" | "process" | "hierarchy" | "parts" | "equation" | "text" | "map" | "time";
  move: "hook" | "teach" | "worked" | "practice" | "probe" | "teach_back" | "review" | "recite";
  band: "B1" | "B2" | "B3" | "B4"; mastery: "new" | "learning" | "practising" | "learned_today" | "secure";
  stage: "concrete" | "pictorial" | "abstract";           // fading machine (maths §3.4)
  priorKnowledge: "low" | "high";                          // expertise-reversal gate (learning-science 16)
  activeMisc: string[]; interests: string[];               // closed-enum interest tags
  device: { tier: "A" | "B" | "C" | "D" | "E"; reducedMotion: boolean; dataSaver: boolean };
  formatPosterior?: Record<"F1"|"F2"|"F3"|"F4"|"F5"|"F6"|"F7"|"F8", number>;   // delayed-success posterior (§8.4 there)
}
```

| # | rule (code, evaluated in order) | evidence |
|---|---|---|
| M1 | Every spoken explanation carries an on-screen anchor (a `board@1` item, diagram or engine). There is no voice-only teaching of a concept | dual coding; transient-information effect (learning-science §2.4.3, rule 17) [S] |
| M2 | `shape ∈ {quantity, geometry, phenomenon, map, time}` → an **engine** (T1). The number line is the hub for every number representation | content-format fit (Willingham) [M]; maths R6 |
| M3 | `shape ∈ {process, hierarchy, parts, equation}` → a **diagram** (`flow`, `concept-map`, `label-diagram`, `formula`) or a static scene. An **explainer** only when *change over time is the concept* (germination, water cycle, merging groups) | Höffler & Leutner d ≈ 0.37 only for representational animation [K]; Tversky congruence |
| M4 | `topicType = verbatim` (tables, varnamala, months, planet order, poem recitation) → **chant**, and only there. A chant pass must hand over to shuffled retrieval (`quick-item`) in the same session | rule 24; seductive details d = −0.30 / −0.48 [S]; serial-recall trap (songs §0.7) |
| M5 | `priorKnowledge = low` → a worked example first (`worked-steps@1` or an engine `demo`), then faded. `high` with prerequisites at `practising` or above, B3–B4 → attempt-first (`boss-problem` wrapper) | expertise reversal d = 0.505 / −0.428 [S]; productive failure reverses in Grades 2–5 (game-mechanics) |
| M6 | Stage comes from the fading machine (promote after 3 correct with no hints, demote after 2 errors). A new concept enters at `concrete` for B1–B2 and at `pictorial` for B3–B4 | Fyfe 2015 [S]; thresholds [U] (M2 experiment) |
| M7 | `move = practice` with mastery at least `learning` → a **wrapper** may wrap the engine: at most 2 wrappers per session, never the same twice in a row, ≤ 40% of lesson time, and 20% of eligible blocks left unwrapped as the control arm | game-mechanics G14 and planner rules [U] |
| M8 | `move = probe` → a probe kind chosen by the misconception being verified. `diagnose` and `contrast` verify a detector signal; `translate` checks transfer; `predict` opens POE; `spot_error` only after `learned_today` | learning-science §7; maths §3.1 |
| M9 | `activeMisc` non-empty → choose the engine and probe whose `detectors` include it, and seed `expect.distractors` from that `MC.*` generator. Verifying probes are capped at 1 per 3 min | maths R.6.4 |
| M10 | `interests` → the skin and story context only (cricket, kirana, festivals, trains) and only as data, never as a new structure. Skins must stay bland in the concrete stage | interest g = 0.36–0.55 [S]; Petersen & McNeil 2013 [S] |
| M11 | Reality, mood or a hook ("a monsoon street") → `illustration@1` from the library, or a still with a pan. Never a raster for a quantity, geometry or procedure; never video for a fact | diagrams §3 bans; animation §0.1 |
| M12 | `device.tier ≥ D` or `reducedMotion` → explainers jump to each beat's end state; the board appears without a wipe; one animating module at a time; T3 modules restricted to B3–B4 and tier ≤ B | sandbox E.4; animation §6.3 |
| M13 | Among eligible formats within a small margin of expected delayed success, **offer the child 2–3 choices**; otherwise Thompson-sample on `formatPosterior` with a 10–20% uniform floor. Reward = delayed success, never engagement | learning-science §8.4 rules 1–5 |
| M14 | No eligible engine, template or diagram within the deadline → `board_only` (board + voice + a kit picture), and log a **gap ticket** `{topic, mechanic, band, why}`. Gap tickets decide what T3 builds | genui §3.1 |

### 1.5 Where code runs

| component | runs in | why |
|---|---|---|
| T0/T1 engines, `scene@1` runtime, diagram engines, `explainer@1` player, T3 `lib:` modules | sandboxed iframe: `sandbox="allow-scripts"`, opaque origin, strict CSP, bridge v2 over a `MessagePort` | one protocol, one budget, freeze and teardown; generated code must be here, so first-party code shares the path (A2) |
| `chant-track@1`, `pahada@1` audio, read-along audio clock and speech window, `board@1`, `pointer-overlay@1`, `LockPanel`, `word-chain@1` voice turns, captions, face | host (React shell; imperative refs for per-frame work) | they own audio, the mic or the stage; the frame has `microphone 'none'`, `media-src 'none'`, `connect-src 'none'` |
| router, spec fill, validators, solver, Content Safety, grader for persistence | server (`server/director/*`) | the model never sees the solver; the server signs `{sceneHash, validatorVersion}` |
| grader for live verdicts | host (imports each engine's pure `grade()`) | evidence is host-graded (§4.6) |
| Forge (T3, rasters, figures, explainer pre-render, chant render) | ACA jobs in the egress-denied sandbox lane (`decisions.md#forge-sandbox-lanes`) | offline; reviewed |

---

## 2. Engine catalogue

### 2.1 The common contract every engine implements

The manifest merges maths §3.1, science §2.1, sandbox-telemetry §4.2, and the corrections from every engineering review. It lives in `shared/engine-manifest.ts`. **zod stays on the host and the server**; the frame receives clean JSON and only clamps.

```ts
export type Stage = "concrete" | "pictorial" | "abstract";
export type ProbeKind =                                     // union of maths §3.1, science POE, language and diagram probes
  | "predict" | "contrast" | "translate" | "diagnose" | "spot_error" | "construct" | "estimate"   // maths
  | "classify" | "sequence" | "explain";                                                          // scene@1 / language / POE
export type MiscId = `MC.${string}`;                        // canonical upper case: MC.<DOMAIN>.<SLUG>
export interface EngineManifest {
  id: `${string}@${number}`;                                // "fractions@1"
  title: { en: string; hi: string };
  subjects: ("maths" | "evs" | "science" | "english" | "hindi" | "sst")[];
  describe: string;                                         // ≤ 600 chars: becomes the show_module tool description (a shape, not lines)
  paramsJsonSchema: string;                                 // generated from the host zod source; strict-wire form (A5)
  llmParams: string[];                                      // the ≤ ~6 params a model may set (science R1.2: mark llm:true|false)
  presets: Record<string, string[]>;                        // named registries (figures, scenes, worked, cases); no ad-hoc geometry
  validCombos?: Record<string, string[]>;                   // e.g. model → allowed modes (maths R.4)
  stages: Stage[]; representations: string[]; probes: ProbeKind[];
  caps: Cap[];                                              // host commands it honours (§4.2)
  emits: string[];                                          // NAME_RE event names, e.g. "fr.cut"
  facts: Record<string, { type: "num" | "int" | "bool" | "enum" | "id" | "frac"; enum?: string[]; unit?: string }>;
  targets: { id: string; label: { en: string; hi: string }; kind: "part" | "region" | "control"; moving?: boolean }[];
  detectors: { misc: MiscId; topics: string[]; on: string; rule: string;   // rule = JSONLogic over facts, no free code
               strength: "weak" | "strong"; needs: "taps" | "voice"; verify: ProbeKind[] }[];
  poe?: { id: string; ask: string /* kit id */; capture: "choice" | "multi" | "slider" | "tap_target" | "order" | "numeric" | "voice" }[];
  twin?: { id: string; minBand: Band; adult: boolean };     // physical twin (science, mandatory for float-sink)
  budget: { gzipKB: number; maxNodes: number; heapMB: number; loop: "on_demand" | "continuous_30" };
  // pure functions, imported by host, server and harness (no DOM):
  resolveParams(p: unknown): { params: unknown; issues: string[] };   // clamp + combo check
  lint(spec: ModuleSpec): Issue[];
  solve(spec: ModuleSpec): ScriptStep[] | null;             // reachability; null = unreachable goal. Exploratory engines: golden scripts
  grade(spec: ModuleSpec, value: AnswerValue): Outcome;     // host-side authority (§4.6)
  renderStatic(params: unknown): string;                    // SVG snapshot, for contrast-pair@1 panels and posters (diagrams E1)
}
// Common ModuleSpec fields (LLM wire, flattened): engine, module_id, objective_ids, topic_ids, lang, numerals, band,
// stage, linked, seed, skin, locks[], params (engine-specific), goals[{id, check: {pred: enum, args}}], probe
// (top-level sibling of params; values as MathValue strings "3/4"; distractors [{v, misc}]).
```

**Common events.** Every engine emits these through the kit, in addition to its own `ns.*` events. They are the fixes from maths R.6, sandbox E.3 and diagrams E0.8:
- `undo{of}` and `reset`;
- `hint_used{rung}`;
- `miss{near}`: a tap that hit no target;
- `first_touch_ms` once per probe;
- `visible{target,on}` (folded only);
- `stage.change{from,to,reason}`;
- `misc.signal{misc,strength}`;
- `probe.open{probe,kind}`.

The `answer` message carries `latency_ms`, `attempt`, `changes` and `via`.

**Common rules** (definition of done for every engine):
1. Three fading stages, plus a linked mode with a live symbolic readout.
2. Bilingual labels from kit term banks.
3. Tap-first input with targets of 64 dp (B1–B2) or 48 dp (B3–B4), clamped by `minTargetDp`.
4. Deterministic and seedable; state serialisable.
5. `getState`/`setState` round trip.
6. About 20 golden specs.
7. A detector precision/recall harness, with a scripted wrong path that fires and a correct path that does not.
8. `prefers-reduced-motion` honoured, and no flash faster than 3/s.
9. Colour is never the only cue: ± glyphs and patterns.
10. Numeric entry only; no child free text.
11. `renderStatic()` exported.

### 2.2 The catalogue (45 engines)

Each entry gives:
- **id**, then subjects and classes; **primary** = the number of curriculum topics where the planner mounts this engine first, computed from the maps after the merges noted.
- **params**: the LLM-facing sketch; full schemas in the sibling sections cited.
- **events**: the `ns.*` names.
- **MC**: misconceptions surfaced, as slugs.
- **probes**.
- **size**: engineer-days with the kit built, excluding art, taken from the sibling review.
- **priority**:
  - **v1** = the launch 12;
  - **v1.1** = the next wave;
  - **lang-v1** = the language-launch track;
  - **v2** = later;
  - **P2** = deferred until telemetry justifies it.

Seven merges reduce the inventory from 62 to 45 engines. In each case two engines share a renderer and state model; the second becomes a mode or scene of the first:
1. `number-grid` → `patterns`;
2. `symmetry` → `shape-lab`;
3. `chance` → `data-graphs`;
4. `algebra-moves` + `rule-lab` → `symbol-lab`;
5. `measure-lab` → `measure`;
6. `heat-flow` → `particles`;
7. `sentence-scramble` + `grammar-transform` → `sentence-lab`.

Separately:
- **Folded into templates:** `picture-word` and `source-card` become T2a templates (`match-pairs@1` with audio, and `hotspot-explore@1` with a claims sort).
- **Moved to the wrapper layer:** the game engines (§2.4).

#### Maths (21)

**M01 `number-line@1`** · maths C1–C9 · primary 21, any 47 · **v1** · M, 5 d (defer `real` and zoom depth > 3)
- params: `{min, max: MathValue; numberKind: whole|fraction|decimal|integer|real; ticks{major, minor?, labels: all|ends|none}; orientation: h|v; partition?{d ≤ 24, childCuts}; zoom?{enabled, maxDepth ≤ 3, target}; markers[{value, label?, draggable}] ≤ 4; jumps?{enabled, sizes[], arcLabels}; context?: road|lift|thermometer|sea_level|plain; skin}`. The `context` values host the integer models.
- events: `nl.place{value,target,abs_err,pae}` · `nl.jump{from,to,size}` · `nl.partition{unit,d,equal}` · `nl.zoom{lo,hi,depth}` · the `tg.*` tug-of-war mode
- MC: `JUMP_COUNTS_START`, `UNEQUAL_SPACING`, `FRAC_NOT_NUMBER`, `LONGER_DECIMAL_BIGGER`, `ROUND_IN_STEPS`, `NO_NUMBER_BETWEEN`
- probes: estimate (PAE on an unticked line, logged as a proxy and never optimised; Unal 2024 β = .13 [V]), predict, translate (the hub), contrast, diagnose. Offset handle plus magnifier for precision.

**M02 `collections@1`** · maths C1–C4, C7 · primary 13 · **v1** · M, 4 d (ten-frame and part-part-whole first)
- params: `{items[{kind: seed|stick|counter|dot, n ≤ 100}]; layout: scatter|row|five_frame|ten_frame|double_ten_frame|tally|pairs|groups; groupSize?; flashMs?; allowMove; showCount: never|after_commit|live; compare?{left, right, spreadSide}; seed}`
- events: `col.tag{i,said_n,double_tag,skipped}` · `col.total{claimed,actual,recounted}` · `col.frame` · `col.split` · `col.group` · `col.compare{chosen,correct,spread_side}`
- MC: `ONE_TO_ONE`, `CARDINALITY` (needs voice), `CONSERVATION`, `COUNT_ALL`, `ONE_WAY_TEN`, `TALLY_FIFTH`, `ODD_DIGIT`
- probes: predict (flash), contrast (spread vs bunched), translate, construct (ways to make 10), estimate. Flash ≤ 3/s and small.

**M03 `place-value@1`** · maths C1–C8 · primary 25 · **v1** · L, 9 d, shipped as 3 units: `place-value` 4 d, `column-ops` 3 d, abacus + base-n 2 d
- params: `{model: bundles|blocks|disks|notes|abacus|chart; base 2–10; places[]; grouping: indian|international; mode: represent|compare|add|subtract|convert; value?; operands?; exchange: manual|auto|off; showNumberName}`, with a `validCombos` table
- events: `pv.piece` · `pv.exchange{from,to,dir}` · `pv.overflow` · `pv.write{written,value,ok}` · `pv.col{col,digit,carry,borrow}` · `pv.compare`
- MC: `CONCAT_EXPANDED`, `ZERO_PLACEHOLDER`, `TEEN_REVERSAL` (voice), `SMALLER_FROM_LARGER`, `NO_REGROUP`
- probes: predict, translate (name ↔ bundles ↔ chart ↔ ₹), contrast (305 vs 350), spot_error, diagnose. Counts above 20 per place render as a stacked glyph with a badge. Proportional models come before non-proportional ones (Barner 2018: 21% could decode the abacus [V]).

**M04 `fractions@1`** · maths C3–C8 · primary 15 · **v1** · L, 8 d: core 5 d (bar/circle; make, name, compare, equivalent, add) + extensions 3–4 d
- params: `{model: bar|circle|set|grid100|wall; wholes; partitions[] (d ≤ 24); equalOnly; shaded?; mode: make|name|compare|equivalent|add|subtract|multiply|divide|percent; operands?; showSymbol; skin: roti|chocolate|ribbon|plain}`
- events: `fr.cut{parts,equal}` · `fr.shade` · `fr.compare` · `fr.refine{from_d,to_d}` · `fr.overlay` · `fr.measure`
- MC: `UNEQUAL_PARTS`, `BIGGER_DENOM`, `COUNT_PIECES`, `ADD_SAME_EQUIV`, `ONE_PART_COMPARE`, `ADD_ACROSS`, `MULT_BIGGER`, `DIV_SMALLER`
- probes: predict (1/2 + 1/3; the T1 worked example in maths §3.5 and genui §4), contrast, translate (bar → number line), diagnose, construct. The bar plus number line is the default; the circle is for part-whole only (Hamdan & Gunderson 2017 [V]).

**M05 `multiply-divide@1`** · maths C1–C8 · primary 22 · **v1** · L, 8 d as 2 units: groups/array/area/share 4 d; factors/Venn/inverse 4 d
- params: `{model: groups|array|area|share|factor_rect|factor_tree|venn|jumps; a?, b?, n?; mode: build|share|group|multiply_multi|factor|hcf_lcm|inverse; showPartialProducts; remainder: show|hide; story?: kit id}`
- events: `md.group` · `md.rotate` · `md.partial` · `md.deal` · `md.rect` · `md.tree` · `md.venn`
- MC: `COUNT_GROUPS`, `ORDER_MATTERS`, `SHARE_UNEQUAL`, `TIMES_ZERO`
- probes: predict (rotate: same total?), contrast (sharing vs grouping), translate (story → array → expression), construct (all rectangles of 12), spot_error. Hosts the `pahada@1` array view (dual coding).

**M06 `balance@1`** · maths C1–C4, C7 · primary 4, any 9 · **v1.1, the first of the wave** (leverage: the equal-sign misconception from Class 1) · M, 4 d
- params: `{mode: compare|equal_sign|solve; left[Term], right[Term]; unknowns[]; units; ops[add_both|remove_both|divide_both|swap_sides]; showEquation}`. Positive terms only; negatives hand off to integers or algebra-tiles (Otten 2019 [V/S]).
- events: `bal.tilt` · `bal.place` · `bal.op{keeps_level}` · `bal.one_side` · `bal.solve`
- MC: `EQ_OPERATIONAL`, `BIGGER_HEAVIER`, `COTTON_IRON`, `COMPENSATION`
- probes: predict (tilt), contrast, translate (balance ↔ equation), spot_error, construct.

**M07 `geoboard@1`** · maths C3–C6, C8–C9 · primary 15 · **v1** · L, 7 d; v1 slice 3 d (integer grid, rectilinear cuts, half-square)
- params: `{grid{kind: square|dot, w ≤ 7 (B1–B2) / 12, h, unit}; mode: area|perimeter|same_area|dissect|formula|pythagoras; shapes[Polygon ≤ 12 integer pts | preset]; tools[]; constraints{area?, perimeter?}; showFormula}`
- events: `geo.shape` · `geo.count` · `geo.cut_move{area_before,area_after}` · `geo.claim` · `geo.unit`
- MC: `AREA_PERIM_SWAP`, `SAME_PERIM_SAME_AREA`, `LONGER_MORE_AREA`, `TWO_SIDES_PERIM`
- probes: contrast (same perimeter, different area), construct, predict (cut and move), translate.

**M08 `data-graphs@1`** · maths C1–C9 (+ chance, C9 ch7) · primary 23 (incl. chance) · **v1** · L, 7 d as 3 units: pictograph/tally/bar/table 4 d; line/pie/stacked 3 d; mean views 2 d. The `experiment` mode is P2, 3 d.
- params: `{data[] ≤ 200 | preset; view: sort|tally|table|pictograph|bar|line|pie|stacked|dot|mean_level|mean_balance|experiment; scale{key, start, step}; editable[]; summary[]; weights[]; device?: spinner|coin|dice|bag (experiment); trials{batch, max ≤ 1000}; seed}`
- events: `dat.sort` · `dat.icon` · `dat.bar` · `dat.scale` · `dat.read{via}` · `dat.level` · `dat.fulcrum` · `dat.pie{sum_deg}` · `ch.guess` (renamed from `ch.bet`; no stake, coins or money language) · `ch.run`
- MC: `SPACE_IS_MORE`, `ICON_IGNORES_KEY`, `HALF_ICON_WHOLE`, `WIDTH_AS_VALUE`, `FIFTY_FIFTY`, `GAMBLERS_FALLACY`, `SUMS_EQUALLY_LIKELY`
- probes: contrast (two scales), predict (outlier and the mean), translate, spot_error (a misleading axis). Cricket charts (Manhattan, worm) are a skin here (game review C2).

**M09 `tape-diagram@1`** · maths C1–C5, C7–C9 · primary 10, any 17 · **v1.1** · M, 5 d if CAS-lite exists, otherwise L
- params: `{mode: part_whole|compare|multiplicative|ratio|percent|before_after|equation; tapes[{id, label, units, unitValue?, known}] ≤ 4; unknown; story: kit id; allowSplit; showEquation}`
- events: `tape.draw` · `tape.align` · `tape.split` · `tape.bracket` · `tape.eq{equivalent}` · `tape.answer`
- MC: `KEYWORD_MORE_ADD`, `HOW_MANY_MORE_ORDER`, `LAST_OP_LEARNT`, `WORD_ORDER_EQUATION`
- probes: translate (story → tape → equation; the richest), contrast (same numbers, different structure), predict, spot_error. It is the handoff target of `story-problem@1`.

**M10 `patterns@1`** · maths C1, C3–C9 (+ the number grid, C1–C8) · primary 29 (incl. grid) · **v1** · L, 7 d: core 4 d + grid layouts 2 d; the fractal mode deferred
- params: `{mode: repeat|grow|sequence|machine|growth_compare|grid; elements[]; core[]; figure{kind, rule: CAS-lite string}; terms ≤ 20; rule{explicit, recursive}; hide[]; grid?{layout: hundred|addition|multiplication|sieve|magic|pyramid, start, cols ≤ 10, mask[], highlight{rule: enum}}}`
- events: `pat.extend` · `pat.core` · `pat.figure` · `pat.table` · `pat.rule{fits_all}` · `pat.machine` · `grid.move` · `grid.mark` · `grid.sieve` · `grid.fill`
- MC: `COLOUR_ONLY`, `RANDOM_IS_PATTERN`, `REVERSED_DIFFERENT`, `ONLY_INCREASING`, `NINE_BEFORE_ZERO`, `ROW_ADDS_ONE`, `PLUS10_ONES`
- probes: predict (the 10th figure), contrast (3n+1 vs 2ⁿ), translate (figure ↔ table ↔ rule ↔ graph), construct (magic square).

**M11 `clock-calendar@1`** · maths C1–C5 · primary 10 · **v1.1** · M, 5 d
- params: `{view: analog|digital|both|timeline|calendar|stopwatch; time{h, m}; geared: true; precision: hour|half|quarter|5min|minute; format: 12|24; ampm; vocab[sawa|saadhe|paune|dedh|dhai]; hideNumerals; calendar?{month, year, inclusive}}`
- events: `clk.set` · `clk.read{err: hands_swapped|minute_as_number|…}` · `clk.elapsed` · `cal.count{inclusive}` · `clk.order`
- MC: `HANDS_SWAPPED`, `MINUTE_AS_NUMBER`, `NOON_AM`, `MINUTES_OVER_60`
- probes: predict (minute hand +15: where is the hour hand?), translate (analog ↔ digital ↔ Hindi time words), contrast (*paune teen* vs *sawa teen*). No visible countdowns; the stopwatch is a measuring tool.

**M12 `money@1`** · maths C1–C3, C8 (+ the `dukaan` wrapper) · primary 5 · **v1.1** · M, 4 d; **art and legal gated** (stylised, non-replica; the Rs 2000 note excluded)
- params: `{denominations_paise[]; series: 2019|mixed; wallet[]; shop?{items[{kit id, price_paise}]}; mode: recognise|make|pay|change|budget|compare; twinEvery 2–4 (dukaan)}`
- events: `mon.tray` · `mon.exchange` · `mon.pay{total,given,change,ok}` · `mon.compare{by: value|count|size}` · `sh.twin{format,ok,pair_id}`
- MC: `MORE_COINS_MORE`, `BIGGER_COIN_MORE` (the old 25 mm ₹1 is bigger than the new ₹2 [S]), `NOTE_LESS_THAN_COINS`, change = price, `PCT_UP_DOWN_CANCEL`
- probes: contrast (3 coins vs 1 note), translate ("dhai sau" → ₹250), predict (change), construct (fewest pieces).

**M13 `measure@1`** · maths C1–C5, C8–C9 + science measurement (C6 ch5–7, C9 ch1) · primary 22 (incl. measure-lab) · **v1** · L, 7 d maths (ruler and non-standard units 4 d, jug/pour 2 d, scale and conversion 3 d) + 1.5–2 wk science scenes
- params: `{tool: ruler|tape|thread|jug|balance|thermometer|map_scale|conversion|circle_roll; object: kit id; units[]; rulerStart: zero_at_edge|zero_inset|broken; eyeAngle_deg?; thermometer?: clinical|lab; ambient_C?}`
- events: `ms.align` · `ms.read{start_err, errType: zero|parallax|unit|scale|none}` · `ms.pour` · `ms.convert` · `ms.roll{C,D,ratio}` · `ms.misuse`
- MC: `START_AT_ONE`, `START_AT_EDGE`, `ENDS_NOT_ALIGNED`, `SAME_SPANS`, `MC.LEN.CURVE`, `MC.TEMP.HEAT_EQ_TEMP`, `MC.THERM.CLINICAL_BOIL`, `MC.UNIT.OPTIONAL`
- probes: predict (pour tall-thin into short-wide), contrast, translate (mixed units ↔ decimal), spot_error. Readings by stepper or number pad, never voice (science E14). The thermometer shake is a swipe, not device motion; the three-bowls twin is capped at 45 °C.

**M14 `shape-lab@1`** · maths C1–C9 (+ symmetry, C3–C6) · primary 19 · **v1.1** · L, 8 d + symmetry 4 d (tiling cut to v2)
- params: `{mode: name|sort|compose|morph|tile|mirror|complete|turn|rangoli; pieces[preset]; classes[]; sortView: bins|venn|tree; allowRotateFlip; mirrorAngles[]; turnOrders[]}`
- events: `shp.name` · `shp.sort` · `shp.morph` · `shp.compose` · `sym.line` · `sym.complete{translated}` · `sym.turn` · `sym.design`
- MC: `ROTATION_RENAMES`, `PROTOTYPE_TRIANGLE`, `SLANT_NOT_STRAIGHT`, `SQUARE_NOT_RECT`, `VERTICAL_ONLY`, `EXACTLY_ONE`, `COPY_NOT_FLIP`, `MIRROR_ONLY`
- probes: contrast (rotated square vs rhombus), predict (will it tile? fold on the diagonal?), construct, diagnose.

**M15 `angles@1`** · maths C2, C4–C8 · primary 11 · **v1.1** · M, 5 d
- params: `{mode: turn|compare|measure|types|pairs|transversal|sum; arms{len1, len2}; angle; protractor{scales: inner|outer|both, draggable}; lines{parallel, transversalDeg}; polygon: preset}`
- events: `ang.set` · `ang.compare{longer_arms_chosen}` · `ang.read{scale}` · `ang.pair` · `ang.sum`
- MC: `ARM_LENGTH`, `ANGLE_IS_LENGTH`, `ORIENTATION`, `WRONG_SCALE`
- probes: contrast (short-wide vs long-narrow), predict (angle sum, big vs small triangle), translate (degrees ↔ fraction of a turn ↔ clock). 1° snap; offset handle.

**M16 `integers@1`** · maths C6–C7, C9 · primary 5 · **v1.1** · M, 4 d
- params: `{context: lift|tokens|thermometer|passbook|sea_level; range (lift −5…+6, NCERT Bela's Building); start; ops[]; allowZeroPairs; showExpression}`. Tokens are green/red **plus a ± glyph and a pattern**.
- events: `int.press` · `int.token` · `int.zero_pair` · `int.take{zero_pairs_needed}` · `int.answer` · `int.compare`
- MC: `NEG_MAGNITUDE`, `SUB_SMALLER`, `NEG_NEG_ADD_POS`, `NEG_NOT_REAL`
- probes: predict, translate (lift ↔ tokens ↔ expression ↔ line), contrast ((+5)+(−3) vs (+5)−(−3)), spot_error.

**M17 `algebra-tiles@1`** · maths C3, C7–C9 · primary 8 · **v2** · M, 5–6 d (2D only; `dim: 3` dropped to iso2d or static)
- params: `{tiles[]; mode: build|combine|evaluate|expand|identity|factorise; expr: CAS-lite; target; xValue; colours{pos: green, neg: red} + glyphs}`
- events: `alg.tile` · `alg.zero_pair` · `alg.combine{legal}` · `alg.rect` · `alg.eval` · `alg.expr`
- MC: `LETTER_IS_OBJECT`, `DIFFERENT_LETTERS_DIFFERENT`, `JUXTAPOSE`, `COMBINE_UNLIKE`
- probes: predict ((a+b)² with only a² and b²), translate, contrast (2x vs x²), spot_error. Every game-like session ends on a symbolic step.

**M18 `coord-grid@1`** · maths C1, C4–C5, C8–C9 · primary 10 · **v1.1** · M, 5 d
- params: `{mode: position|left_right|route|map_scale|plot|distance|line|solutions|slope; extent; quadrants: 1|4; scene{viewerFacing, objects[preset]}; scaleBar; line{m, c, editable}; equation{a, b, c}; hideLabels}`
- events: `crd.place{swapped}` · `crd.lr` · `crd.route` · `crd.dist` · `crd.line` · `crd.test` · `crd.slope`
- MC: `LR_ABSOLUTE`, `NORTH_IS_UP`, `MAP_IS_REAL`, `XY_SWAP`
- probes: predict (where is (−2, 3)?), contrast ((3,2) vs (2,3)), translate (table ↔ points ↔ equation), construct (three solutions of x + y = 5). Snap to integers.

**M19 `geo-construct@1`** · maths C6–C9 · primary 17 · **v1.1 as presets only** (5–6 d); full L, 10+ d; JSXGraph is a lazy chunk of about 130 kB gz, licence check pending [U]
- params: `{mode: construct|drag_test|sticks|congruence|circle; tools[]; given: preset; sticks[]; dragTest; measures: on_tap|live (≤ 60 objects)}`. Coordinates always come from a constraint solver (MagicGeo/GeoLoom [S]).
- events: `gc.construct` · `gc.drag{invariant,held}` · `gc.sticks{closes}` · `gc.congruence{noncongruent_built}` · `gc.claim{from_diagram}`
- MC: `RAY_TWO_ENDS`, `LONGER_LINE_DIFFERENT`, `RADIUS_VARIES`, `RECT_DIAG_PERP`
- probes: predict (drag the vertex), contrast (AAA pair), construct, spot_error. Consider porting the C6–7 constructions off JSXGraph.

**M20 `solids@1`** · maths C1–C4, C8–C9 · primary 13 · **P2** · L, 10 d
- params: `{mode: identify|count|views|nets|volume|surface; solid: preset; dims; net{squares}; render: iso2d (default) | 3d (opt-in after a GPU probe)}`
- events: `sol.count{rotated}` · `sol.view` · `sol.fold{closes}` · `sol.fill` · `sol.unroll`
- MC: `ONLY_BALLS_ROLL`, `ORIENTATION_RENAMES`, `CONE_NO_SLIDE`, `CURVED_NO_FLAT`
- probes: predict (will this net fold?), contrast, translate (solid ↔ net ↔ views), construct. `webglcontextlost` falls back to a static image.

**M21 `symbol-lab@1`** (algebra-moves + rule-lab) · maths C3, C6–C9 · primary 13 · **P2** · L, 4 d for the v1 slice (tap-to-evaluate, mind-the-mistake, trace, Euclid); gesture moves in v2
- params: `{mode: evaluate|moves|mistake|trace|claim_test|algorithm_race; expr: CAS-lite (≤ 200 nodes, depth ≤ 20); goal; allowedMoves[]; rule: preset; claim{text: kit id, predicate: enum, domain}; algorithms[preset]}`. No custom rules; predicates are an enum.
- events: `am.move{legal}` · `am.illegal{attempt,reason}` · `am.goal` · `rl.step` · `rl.case` · `rl.counterexample` · `rl.conclude{verdict,cases}`
- MC: `LEFT_TO_RIGHT`, `MINUS_FIRST_TERM`, `ADD_BASES`, `ZERO_POWER_ZERO`, `TRICK_IS_MAGIC`, `FEW_CASES_PROVE`, `CONVERSE_TRUE`
- probes: spot_error (the core probe), predict, construct (counterexample), contrast. DragonBox g = .269 and FH2T g = .135 against an active control (Decker-Woodrow 2023 [V]).

#### EVS and science (14)

All science engines share the science §2 contract:
- Every engine has a POE hook with the simulation locked until a prediction is committed, a ghost of the prediction shown against the outcome, and a mandatory teacher resolution. After 2 consecutive wrong POEs the engine switches to a worked demonstration.
- Bands A (C3–5), B (C6–8) and C (C9) change the controls and numerals, not the physics.
- Every engine declares a physical twin.
- Physics invariants are golden-tested.
- Free-string params are replaced by `safe:true` registries (science R1.3).
- Rendering is canvas2D for continuous sims and on-demand otherwise.

**S01 `particles@1`** (+ heat-flow) · C6 ch8, C7 ch5/7, C8 ch7/9 · primary 8 (incl. heat-flow) · **v1.1** · M–L; science estimate 3 wk + heat-flow 1.5 wk
- params: `{scene: states|boil|evap-condense|matka|diffusion|expansion|conduction|convection|radiation|insulation; substance: water|wax|ghee|camphor (band C)|air; heat_W −200…200; pressure_atm 0.5–2; container; particles 20–150 (low-end 40); view: macro|lens|split|micro}`
- model: a macroscopic enthalpy controller holds the temperature plateau at phase changes, which fixes PhET's documented gap [V]. The particle view is a behavioural model, not Lennard-Jones. Convection uses a prescribed stream function.
- events: `phase_change` · `plateau` · `droplets_formed` (s2) · `particle_tracked` · `lens_over` · `pin_dropped` · `dye_rises` · `wrapped_T`
- MC: `PART.EXPAND`, `PART.STUFF_BETWEEN`, `PART.SOLID_STILL`, `PART.GAS_MASSLESS`, `STATE.BUBBLES_AIR`, `STATE.GLASS_LEAK`, `STATE.EVAP_BOIL_ONLY`, `HEAT.WOOL_PRODUCES`, `HEAT.METAL_COLDER`, `HEAT.COLD_FLOWS`
- probes: POE (bubbles, plateau, cold glass, heat, matka), contrast, explain. Twins: an ice glass with food colour; the hot-chai spoon replaced by warm tap water ≤ 45 °C poured by an adult.

**S02 `circuits@1`** · C5 ch7, C7 ch3–4, C8 ch4, C9 ch9 · primary 9 · **v1.1** · L, 3 wk (the MNA solver is 1 d; the editor is the cost)
- params: `{scene: build|diagram|conductor-test|electromagnet|heating|lemon-cell|energy-meter; tray[preset]; cells 1–4; currentView; flow: conventional|electron; symbols: pictures|symbols|both; coilTurns; core; testItem: registry}`. Band A uses a two-tap wire editor; targets ≥ 48 dp; the heating scene has a locked topology.
- events: `circuit_changed` (on drop) · `bulb_state` · `short_circuit` (s2) · `ammeter_read` · `item_tested` · `led_reversed`
- MC: `ELEC.UNIPOLAR`, `ELEC.CLASHING`, `ELEC.ATTENUATION`, `ELEC.SEQUENTIAL`, `ELEC.SWITCH_MAKES`, `ELEC.BATTERY_TANK`, `ELEC.WATER_BODY_INSULATE`, `EM.COIL_ALWAYS_MAGNET`
- probes: POE ×6, contrast, construct. **Safety:** no mains or switchboard twins, ever.

**S03 `magnets@1`** · C6 ch4, C8 ch4/13 · primary 3 · **v2** · M, 1.5–2 wk
- params: `{scene: test-tray|poles|field|compass|cut|strength|earth; magnets[{type, strength, x, y, angle}] ≤ 4; fieldView: off|compasses|filings|lines; items[registry]}`
- events: `item_tested` · `pole_interaction` · `magnet_cut` (s2) · `compass_settled` · `pins_count`
- MC: `MAG.ALL_METALS`, `MAG.BIGGER_STRONGER`, `MAG.SPLIT_POLES`, `MAG.NO_THROUGH`, `MAG.MIDDLE_STRONGEST`
- probes: POE (cut a magnet), contrast. Twin warnings: no swallowing small or neodymium magnets; keep away from phones, cards and pacemakers.

**S04 `optics@1`** · C3 ch10, C7 ch11, C8 ch10, C9 ch5 · primary 7 · **v1.1** · L, 3 wk (≤ 64 rays, 2D)
- params: `{scene: materials|shadows|plane-mirror|pinhole|periscope|spherical-mirror|lens|vision; source{kind, x, y, size}; objects[registry]; mirror; lens; focal_cm; object_cm; pinhole_mm; showNormal; protractor}`
- events: `shadow_changed` · `eye_sees` · `angle_measured{from_surface}` (s2) · `image_formed` · `prediction_drawn`. Facts `angle_i`, `angle_r` and `law_met` (sandbox E.6).
- MC: `LIGHT.SHADOW_SUBSTANCE`, `LIGHT.MOON_SOURCE`, `LIGHT.VISION_ACTIVE`, `LIGHT.IMAGE_ON_SURFACE`, `LIGHT.ANGLE_SURFACE`, `LIGHT.PINHOLE_UPRIGHT`
- probes: POE ×6, construct (ray draw by waypoints, 24 dp snap), contrast. **Never look at the Sun** is golden-tested.

**S05 `plant-lab@1`** · C3 ch4, C5 ch1, C6 ch10, C7 ch10, C8 ch13 · primary 5 · **v2** · L, 2.5 wk; parametric SVG art
- params: `{scene: germination|photosynthesis|leaf-gas|transport|starch-test|vanhelmont; plant: registry; light 0–100; co2_ppm 0–1000; temp_C 5–45; water 0–1; dayNight; days; jars[] ≤ 6}`
- events: `germinated` · `bubble_rate` · `starch_result` · `wilted` · `net_o2_negative` (s2) · `ledger_viewed`
- MC: `PLANT.FOOD_FROM_SOIL`, `PLANT.NO_RESPIRE_NIGHT_ONLY`, `PLANT.CO2_ONLY`, `GERM.SOIL_LIGHT`, `PLANT.SEED_NOT_ALIVE`
- probes: POE, investigation (fair test), contrast.

**S06 `ecosystem@1`** · C3 ch5–6, C4 ch3, C6 ch2, C8 ch12–13 · primary 8 · **v1.1** · M, 2.5 wk
- params: `{scene: tree-survey|soil-life|depend|farm-chain|farm-web|pond|vulture; species[registry, ≤ 12] (rates derived from roles, starting near equilibrium); links[]; arrowMeaning: energy; mode: build|run|perturb|pyramid; weeks}`
- events: `arrow_drawn` · `chain_complete` · `species_removed` (s2) · `population_change` · `web_validated`
- MC: `ECO.ARROW_EATS`, `ECO.NO_RIPPLE`, `ECO.BIG_IMPORTANT`, `ECO.NO_DECOMPOSERS`, `ECO.PREDATORS_MORE`
- probes: POE (remove the vulture: Prakash 2003, Green/Oaks 2004 [M]), construct, predict. The sign of every scripted perturbation is golden-tested over random `n0`. No rabies imagery.

**S07 `body-systems@1`** · C7 ch9, C8 ch2, C9 ch3 · primary 5 · **v2, art-blocked** · L
- params: `{scene: digestion|respiration|circulation|musculoskeletal|levels; food: roti|rice|dal|ghee|apple; exercise 0–3; zoom: organism…cell; labels: show|quiz|off; joint}`
- events: `token_stage` · `label_dropped` · `zoom_changed` · `breath_rate` · `joint_moved`
- MC: `DIG.STRAIGHT_TO_STOMACH`, `RESP.BREATHING_EQ_RESPIRATION`, `BODY.BAG_OF_ORGANS`, `CIRC.BLUE_BLOOD`, `MUSC.PUSH`
- probes: classify, sequence, POE. **Never model-generated anatomy**; reproduction and adolescence go only to human-reviewed content.

**S08 `sky@1`** · C4 ch10, C5 ch9, C6–C8, C9 ch13 · primary 14 · **v1** · L, 3–4 wk; **2D only** (three.js dropped: about 170 kB gz and Mali WebView risk)
- params: `{scene: daynight|shadow-stick|seasons|phases|eclipse|stars|solarsystem|uneven-heating; dayOfYear; hour; observer: srinagar|delhi|chennai|kanyakumari|sydney; tilt_deg 0–90; ecc: true|exaggerated; view: space|ground|split|lamp-ball; timeSpeed; scale (with a "not to scale" chip)}`
- events: `date_changed` · `shadow_marked` · `phase_predicted` (s2) · `tilt_changed` · `eclipse` (s2) · `distance_read`
- MC: `SKY.SEASONS_DISTANCE`, `SKY.SUN_MOVES`, `MOON.EARTH_SHADOW`, `MOON.CHANGES_SHAPE`, `ECL.EVERY_MONTH`, `STAR.DAY_GONE`, `EARTH.EQUATOR_CLOSER`
- probes: POE ×6, predict, contrast (Delhi vs Sydney). The constants were checked: perihelion about 3 Jan, 23.44°, a 29.53 d synodic month, 5.1° lunar inclination. Hemisphere-correct phase tables are golden-tested.

**S09 `mixtures-lab@1`** · C6 ch9, C8 ch8–9, C9 ch5 · primary 9 · **v1.1** · L, 2.5 wk
- params: `{scene: kitchen-separation|water-separation|classify|dissolve|solubility-T|concentration|advanced-separation|tyndall; preset; tools[]; temp_C; water_mL; addSpoons; stir; balance; particleInset}`. Methods are operators with preconditions; a mass-conservation balance.
- events: `method_applied` · `method_failed` (s2) · `saturated` · `mass_reading` · `tyndall`
- MC: `SEP.ONE_METHOD`, `SOL.SALT_GONE`, `SEP.FILTER_SALT`, `SOL.MASS_LOST`, `SOL.UNLIMITED`, `SOL.DISSOLVE_EQ_MELT`, `COLL.MILK_SOLUTION`
- probes: POE, construct (a separation plan), contrast.

**S10 `motion-lab@1`** · C4–C9 · primary 20 · **v1 as a slice** · XL in full (7–9 wk); really four renderers sharing one physics core
- **v1 slice** (kinematics + graphs, forces + friction, pendulum): 13 of the 20 topics, about 4–5 wk [U]. Work, energy, machines and pressure go to v1.1.
- params: `{scene: motion-types|speed|strobe|push-cart|friction-surfaces|track|freefall|graphs|tugofwar|bus-brake|recoil|pendulum|sling|…; mass_kg; force_N; surface; mu_s, mu_k; L_m; amp_deg ≤ 20 for the period scene; bobMass_g; g: earth|moon; air; graphs[x-t|v-t|a-t]}`, as a per-scene discriminated union with ≤ 4 LLM params
- model: velocity-Verlet or RK4; thermal energy from friction work (not E0 − KE − PE); a static-to-kinetic friction clamp; `timeScale` changes steps per frame, not dt.
- events: `motion_state` · `friction_regime` · `oscillations_timed` · `graph_predicted` (s2) · `object_stopped` · `net_force`
- MC: `F.MOTION_NEEDS_FORCE`, `F.REST_NO_FORCES`, `F.USED_UP`, `F.HEAVY_FALLS_FASTER`, `F.ACTION_CANCELS`, `PEND.HEAVY_FASTER`, `GRAPH.PICTURE`, `KIN.DISP_EQ_DIST`, `KIN.ZERO_V_NO_A`
- probes: POE ×8, investigation (pendulum fair test), predict (graphs). Twin: the pencil-point-on-palm demo replaced by dough or clay. Strobe ≤ 3 flashes/s.

**S11 `sound@1`** · C9 ch10 · primary 3 · **v2** · M, 1.5–2 wk
- params: `{scene: chain|medium|belljar|string|echo|reverb|sonar; f_Hz ≥ 400 (phone speakers); amp; medium: air|water|steel|vacuum; string{L_cm, tension, thickness}; wall_m}`
- events: `particle_tracked` · `vacuum_level` (s2) · `echo` · `pitch_change` · `string_plucked`
- MC: `SND.VACUUM`, `SND.AIR_TRAVELS`, `SND.LOUD_EQ_HIGH`, `SND.ECHO_ANYWHERE`, `SND.AIR_FASTEST`
- probes: POE, contrast. **The module never plays audio itself.** It sends `request{what:"sound"}`; the host plays the cue ≤ −18 dBFS for ≤ 3 s and ducks the mic, so VAD does not barge in (science E11).

**S12 `water-cycle@1`** · C3 ch7, C5 ch1–2/10, C7 ch7, C8 ch6, C9 ch13 · primary 10 · **v1** · L, 2.5 wk + art
- params: `{scene: home-supply|cycle|distribution|river|landcover|groundwater|seabreeze|monsoon|winds-currents; sun; hour; season; landCover: forest|farm|city; pumping 0–3; rain_mm; showTracer; particleZoom; years}`
- model: compartments; the aquifer drawn as pores; clouds as droplets; a kinematic convection cell, not a fluid solver; schematic maps with no borders.
- events: `tracer_step` · `water_table` · `borewell_dry` (s2) · `breeze` · `runoff_ratio` · `cloud_zoom`
- MC: `GW.LAKE`, `WC.CLOUD_VAPOUR`, `WC.RAIN_SQUEEZE`, `WIND.LOW_TO_HIGH`, `WATER.DRINKABLE`, `RIVER.FROM_SEA`, `RIVER.SELF_CLEAN`
- probes: POE, predict, sequence. Twin rule: no ponds, wells or rivers.

**S13 `indicator-lab@1`** · C6 ch3, C7 ch2/4/5, C9 ch9 · primary 7 · **v1.1** · M, 2.5 wk
- params: `{scene: indicators|neutralise|change-sort|rusting|combustion|mass-conservation|food-tests; substances[registry safe:true] (no bleach, cleaners, pesticides or medicines); indicator: litmus-red|litmus-blue|turmeric|china-rose|red-cabbage|phenolphthalein; drops; showPH (band C only); sealed; days}`
- events: `tested` · `sorted` · `neutral_reached` (s2) · `change_classified` · `rust` · `flame_out` · `mass` (s2)
- MC: `AB.ALL_DANGEROUS`, `AB.SOUR_ONLY`, `AB.MIX_HARMFUL`, `CH.RUST_DIRT`, `CH.BURN_DESTROYS`, `FOOD.ONE_NUTRIENT`
- probes: POE, classify, contrast. **Never taste; never mix household cleaners.** Haldi and hibiscus colours need a bench test first [U].

**S14 `float-sink@1`** · C4 ch7, C6 ch6, C8 ch5/9 · primary 3 · **v2** · S–M, 1.5 wk
- params: `{scene: kitchen-tub|compare|upthrust|density|boat|mystery; objects[registry{mass_g, vol_cm3, material, shape}]; fluid: fresh|salt|oil; saltSpoons; compareBy: mass|volume|density; showForces; springBalance}`
- events: `settled` · `prediction` · `balance_reading`
- MC: `FS.HEAVY_SINKS`, `FS.BIG_DENSER`, `FS.MASS_EQ_WEIGHT`, `FS.FLOATERS_NO_WEIGHT`
- probes: POE, investigation, contrast. **The physical twin is mandatory:** hands-on beat virtual (g = 0.85 over 69 studies [S]). The potato and egg facts need a bench test [U].

#### Language and SST (10)

These follow language-sst §2 and run on 4 kits: `text-kit`, `tile-kit`, `card-kit`, `map-kit`. Speech and audio are host-side. All correctness comes from rules or verified accept-keys; an answer outside the key goes to a closed-set check, never to free grading. Every `TextUnit` carries rights; live generation never reproduces NCERT text.

**L01 `phonics@1`** · English and Hindi C1–C2, TaRL remediation · any 22 · **lang-v1 (P0 for a C1–2 launch)** · M, 3–5 d
- params: `{script: deva|latn; mode: grid|compose|blend|segment|swap|conjunct; inventory[] (taught units only); items[{word: kit id, units[], distractorUnits?[{u, misc}]}] ≤ 6; grid?{layout: varga|frequency}; maxOptions: 2|3}`. Tracing is dropped (a separate engine later); tiles wrap at 360 dp.
- events: `ph.tap{unit}` · `ph.compose{cons,matra,ok}` · `ph.blend{ok,ms}` · `ph.segment{ok,err_pos}` · `ph.swap`
- MC: `HIN.MATRA_LENGTH`, `HIN.NASAL`, `HIN.REPHA_RAKAR`, `HIN.HALF_FORM`, `ENG.FIRST_UNIT_GUESS`, `ENG.SHORT_VOWEL`, `ENG.BD`
- probes: construct, diagnose (distractor kind = diagnosis). Tap-to-sound comes from a host-decoded WebAudio sprite. Akshara-first (Nag 2007 [V]); phonics d = 0.41 [V].

**L02 `word-builder@1`** · all classes; "new words" in every chapter · any 106 · **lang-v1** · M, 3–5 d
- params: `{lang; mode: spell|morph|compound|sandhi-join|sandhi-split|family; parts[{text, role}]; targets[{word, parts[]}] (sandhi targets kit-authored and verified); distractors[{text, misc}]; showRule: never|after|always}`
- events: `wb.build{result,ok,inLexicon}` · `wb.split{word,cut_at,ok}`
- MC: `HIN.SANDHI_CONCAT`, `HIN.UPSARG_PRATYAY`, `ENG.SUFFIX_SPELLING`, `ENG.PREFIX_MEANING`
- probes: construct, diagnose.

**L03 `sentence-lab@1`** (scramble + grammar transform) · English and Hindi C1–C9 · any 22 + 68 · **lang-v1** · S (order) + M (transform)
- params: `{lang; mode: order|question|meaning-first|transform|combine; tokens[{id, text}] ≤ 6 chunks; acceptKeys[][] (closed, small); op?: tense:*|number|negate|question:*|voice:*|reported|combine|hi:vachan|hi:ling|hi:kaal|hi:ne|hi:karak|hi:aadar; tray[{text, misc}]; workedFirst}`. The 6-chunk cap exists because key closure over 9 tokens is 362,880 orders.
- events: `ss.place` · `ss.submit{inAccept,first_wrong_slot,moves}` · `ss.unlisted` (goes to a closed-set check) · `gt.edit` · `gt.submit{ok,first_err_slot}`
- MC: `ENG.VERB_FINAL`, `ENG.NO_INVERSION`, `ENG.ARTICLE_DROP`, `ENG.DOUBLE_PAST`, `ENG.OVERREG`, `ENG.SV_AGREE`, `HIN.VERB_MEDIAL`, `HIN.NE_AGREEMENT`, `HIN.OBLIQUE`, `HIN.AADAR`
- probes: construct, diagnose. Grammar is taught by transformation and sentence combining (+0.50), never by labelling drills (−0.32) (Graham & Perin 2007 [V]).

**L04 `story-sequence@1`** · all subjects C1–C9 (+ 24 EVS/science process topics) · primary 53 · **lang-v1** · M, 3–5 d
- params: `{cards[{id, picture: verified asset, text?}] 3–8; correctOrder[]; acceptOrders?; mode: order|next|missing|cause|retell|process; links?[{from, to, kind: then|because|so}]; revealText; verifiedSet}`. An unverified card set is retell-only.
- events: `sq.move` · `sq.submit{tau,first_err,adj_swaps}` · `sq.link{kind,ok}` · `sq.retell{cards_hit}`
- MC: `NARR.ENDS_ONLY`, `NARR.SURFACE_CUE`, `NARR.CAUSE_EFFECT_SWAP`, `PROC.STEP_SKIP`
- probes: sequence, predict (next), explain. Images are 512 px WebP, streamed.

**L05 `read-along@1`** · English and Hindi C1–C9 · primary 11, any 126 · **lang-v1** · L, > 5 d plus the host speech window
- params: `{text: TextUnit; mode: listen|echo|choral (unscored)|solo|cloze; highlight: word|line (akshara only with alignment data); rate: 0.8|1.0; segMaxSec 25; tapToHear; scoring?{locale: hi-IN|en-IN, useAccuracy: false}}`
- events: `rd.play` · `rd.tap{tok}` · `rd.seg_result{correct,omit,insert,wcpm}` (s2, host-emitted). Help is tap-for-help, not live hesitation detection (PA results arrive only at the end).
- MC: `READ.FIRST_UNIT_GUESS`, `READ.SKIP_UNKNOWN`, `READ.WORD_BY_WORD`
- probes: construct (cloze). AccuracyScore carries no evidence until calibrated on Indian children (M-L1). Karaoke timings are built offline from TTS WordBoundary events.

**L06 `map-explorer@1`** · SST C6–C9, EVS C2–C5 · primary 26 (+9) · **lang-v1 (P0 for SST), blocked on Survey of India boundary data** · L, > 5 d
- params: `{basemap: india|world|region; layers[]; targets: featureId[] (never geometry); mode: explore|locate|name|trace (checkpoint taps)|retrieve|direction|coordinate; labels: all|targets|none; tolPx}`. Time, schematic, routes and overlay are cut from v1.
- events: `mp.tap{hit,dist_px}` · `mp.drop{region_ok}` · `mp.trace{coverage,order_ok}` · `mp.dir{ok}` · `mp.coord{err_deg,swapped}`
- MC: `SST.LATLONG_SAME`, `SST.INDIA_CONTINENT`, `EVS.RIVER_FROM_SEA`, `EVS.DESERT_HOT`, `GEO.NORTH_UP`, `GEO.CAPITAL_SWAP`
- probes: retrieve (the default: one feature deleted; Carpenter & Pashler 2007 [V]), construct, diagnose.

**L07 `timeline@1`** · SST C3–C4, C6–C9 · primary 18 · **lang-v1 (P0 for SST)** · M, 3–5 d
- params: `{scale: ordinal (B1–B2) | linear | log; range{from, to: Year{y, era}}; events[{id, label, when, approx?, picture?, lane?, fact: FactRef}]; mode: before-after|order|place|read|duration|century; snapYears}`. Personal timelines use a fixed generic template, order only.
- events: `tl.order{tau}` · `tl.place{err_years,rel_err}` · `tl.duration` · `tl.century`
- MC: `SST.BCE_UP`, `HIST.YEAR_ZERO`, `HIST.CENTURY_OFF`, `HIST.EVEN_GAPS`, `HIST.DEEP_TIME`
- probes: sequence, estimate, construct. There is no year zero; dates resolve to cited fact ids.

**L08 `compare-venn@1`** (+ sorter) · all subjects C1–C9 · primary 18 (+18 sorter) · **lang-v1; the sort mode is shared with maths and science (A8)** · M, 3–5 d
- params: `{mode: venn2|venn3 (≤ 6 items, not B1–B2)|sort|table|odd-one-out|rule; sets[2–4]; items[{id, label, picture?, truth[], misc?}] ≤ 8 (B1–B2) / 12 (truth from verified kits only); requireReason: shared|all|none}`
- events: `cv.place{region,ok}` (alias `so.place`) · `cv.reason` · `cv.done{shared_acc,exclusive_acc}` · `so.rule_guess` (choice, not free text)
- MC: `CMP.ALL_SHARED`, `CMP.NONE_SHARED`, `SST.WEATHER_CLIMATE`, `SST.UNPAID_NOT_WORK`, `SST.RIGHTS_NO_DUTIES`, `ECO.MONEY_INTRINSIC`, `EVS.SHINY_METAL`, `EVS.PLASTIC_ROTS`
- probes: classify, contrast, explain.

**L09 `role-play@1`** · English, Hindi and SST civics C1–C9 · primary 24 (+8) · **lang-v1** · L (Director and voice plumbing about 8 d)
- params: `{scene{id, setting, register}; roles[{id, kind: npc|child, voice, persona (≤ 200 chars, a shape), fictional: true}]; goals[{id, check{intents[]}}]; beats[] ≤ 8; civic?{process}; maxTurns; safety{thirdPersonOnly, noRealPersons: true, noStrangerContact: true}; exitCue}`
- events (host-emitted; the frame never hears): `rp.turn{beat,intent,lang_mix}` · `rp.goal` · `rp.exit{reason}`
- MC: `CIV.WRONG_AUTHORITY`, `ECO.SHOPKEEPER_PRICE`, `LANG.REGISTER`, `EVS.STRANGER_SAFE` (opens a teaching branch, not a score)
- probes: construct (goal), classify (closed-set intent). **Break character on distress or any AI-identity question** (never deny being an AI). A validator scans for real-person and party names.

**L10 `rhythm-poem@1`** · English and Hindi poems, dohas, varnamala, ordered lists C1–C9 · primary 69 · **lang-v1** · M (visual modes); audio on `chant-track@1` (§6.5)
- params: `{poem: TextUnit (rights ≠ ncert-pending); meter?{kind: free|stress|matra}; mode: listen|echo-line|rhyme-spot|fill-gap|perform|matra-count; actions?[{line, gesture}]; gaps?{schedule: vanishing, maxFrac}; kitId (chant)}`
- events: `rh.line{completeness}` (← `chant.slot`) · `rh.gap{tok,ok}` (← `chant.token`) · `rh.rhyme{pair,ok}` · `rh.matra{counted,actual}`
- MC: `POEM.LINE_SKIP`, `POEM.RHYME_BY_SPELLING`, `HIN.MATRA_WEIGHT`
- probes: construct, diagnose. Uses an offline `rhymeKey` per word. Poems are for recitation and rhyme, never sold as reading help (Gordon 2015 d = 0.2 on phonological awareness, none on fluency [V]).

### 2.3 Coverage (computed for this spec)

The method:
- Every maths topic (304) and EVS/science topic (210) is assigned its primary engine from `maths-engine-map.json` and `science-engine-map.json`, after the merges above.
- Generic science formats are assigned to the T2a and diagram layer: sorter → `sort-bins`/`compare-venn`, sequence and time-lapse → `sequence-steps`/`flow@1`, label-diagram and microscope → `label-diagram@1`, classification-key → `concept-map@1`, habitat-match → `match-pairs@1`, plus pattern, thali-builder, spot-the-hazard (`hotspot-explore@1`) and formula-builder (`formula@1`).
- Story, scenario, map, reviewed-content, atom-builder and label-reader are **not** counted for that layer.

| set | maths | EVS + science | all 514 |
|---|---|---|---|
| **v1 T1 (the 12)** | 179/304 (**59%**) | 50/210 (24%) | **229 (44.6%)** |
| v1 T1 + T2a/diagram layer | 179 (59%) | 94/210 (**45%**) | **273 (53.1%)** |
| pure-greedy 12 for comparison (adds geo-construct instead of water-cycle, measure kept) | 182 (60%) | 34 (16%) | 216 (42.0%) before the merges |

By class, v1 T1 maths primary coverage is:

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 |
|---|---|---|---|---|---|---|---|---|
| 21/29 | 14/24 | 20/32 | 21/30 | 23/32 | 22/36 | 22/43 | 21/37 | 15/41 |

By class, EVS + science coverage with the template layer is:

| C3 | C4 | C5 | C6 | C7 | C8 | C9 |
|---|---|---|---|---|---|---|
| 13/24 | 9/20 | 11/20 | 19/33 | 9/36 | 10/34 | 23/43 |

**Why these 12, not the greedy 12.**
- The pure greedy pick takes `geo-construct` (17 topics). It is a 10+ day engine with a JSXGraph licence question and serves C6–9 only.
- `water-cycle` (10 topics) is the only science engine that reaches C3 and C5 EVS, where science coverage is otherwise near zero.
- `motion-lab` (20 topics) is included as its kinematics, forces and pendulum slice (13 of the 20).
- `balance` (4 primary) is kept as the first v1.1 engine despite low topic count, because it targets the equal-sign misconception from Class 1.
- Class 9 maths is the weakest column (15/41). If Class 9 is a launch class, pull `geo-construct` presets and `algebra-tiles` forward (maths §0).

**The other 241 topics** are served by fallbacks, never left without a surface:
- the remaining engines' primary topics: `shape-lab` 19, `geo-construct` 17, `solids` 13, `symbol-lab` 13, `angles` 11, `coord-grid` 10, `clock-calendar` 10, `tape-diagram` 10, `circuits` 9, `mixtures-lab` 9 and others;
- generic story 16, map 9, scenario 8 and reviewed-content 8.

Until each engine lands, the router serves these with explainer templates, `flow@1` and `label-diagram@1` diagrams, T2a templates, or board plus voice, and every such mount logs a gap ticket (§1.4 M14). The v1.1 wave (§9) raises T1 coverage most per day.

### 2.4 Cross-cutting harnesses and the wrapper layer (not counted in the 45)

| id | kind | what it does | priority |
|---|---|---|---|
| `poe-harness@1` | harness | setup → ask → capture (locked) → confidence → reveal → ghost → explain → resolve (mandatory) → transfer. Capture modes: choice, multi, slider, tap_target, order, numeric, waypoint draw (24 dp snap), voice (host) | v1 (with sky, water-cycle and motion-lab) |
| `investigation-harness@1` | harness | assigns roles (changed, measured, kept-same) over an engine's declared `variables{independent, dependent, control, measure(), noise}` (science R1.2); trials, repeats, modes demo\|conflict\|guided; auto bar or line graph. Demonstrations g 0.69 and cognitive conflict g 0.80 were the significant moderators [V] | v1.1 |
| `quick-item@1` | drill engine | single-item retrieval (tables, bonds, letters, terms); production or decision items; `floor_ms` calibrated per device. Also the shuffled-retrieval handoff that every `pahada` pass must end in | v1 (needed by chant) |
| `case-file@1` | engine | detective: worked steps with one planted error, or a clean case about 25% of the time. Plain-text maths grammar plus the kit evaluator, not KaTeX. Cases are authored and reviewed offline | v1.1 |
| `word-chain@1` | host voice game | Shabd Antakshari over a graded lexicon with offline rhyme and last-sound keys; tap fallback on low ASR confidence; non-listed input is never echoed; distress routes to safeguarding | v2 (English-only M first) |
| `LockPanel` | host component | escape-room locks whose code is a value committed in an engine (A9) | v1.1 |
| wrappers W1–W10 | specs over engines | `personal-best`, `lockbox-escape`, `boss-problem`, `build-it`, `detective`, `tug-of-war` (= `number-line` tug mode), `dukaan` (= `money` + twins), `cricket-scorer` (= `data-graphs` skin; scripted balls generated by code), `sort-rule` (= `compare-venn` rule mode), `word-chain`. Each must pass remove-the-game and remove-the-learning in CI | v1.1, starting with `personal-best`, `tug-of-war` and `detective` |

**Wrapper rules** (game-mechanics G1–G14):
- Planner: at most 2 wrappers per session, never the same one twice in a row, ≤ 40% of lesson time [U].
- 20% of eligible practice blocks get no wrapper; that is the control arm for G-E1.
- No timer for B1. Count-up personal best only, opt-in, after untimed accuracy ≥ 90%.
- Rapid guesses under the calibrated floor never count toward progress.
- Assets: ≤ 6 decorative sprites, no animation while a question is open, a celebration of ≤ 800 ms.

### 2.5 The shared `engine-kit` (Wave 0; nothing else starts before it)

Contents, merged from maths R.5, science R0.2, language E, diagrams E1 and animation E.3:
- **Pointer layer:** pointer and hit-test with `touch-action:none` and pointer capture; drag and snap with a 24 dp lift and a 12 dp slop; `miss` detection; `minTargetDp` clamp.
- **Render and timing:** tween and timeline (transform and opacity only); a scheduler that wraps rAF and timers, so `freeze` and `visibilitychange` really halt; render-on-demand; a fixed-dt accumulator; a frame-budget guard (skip substeps when a frame exceeds 25 ms).
- **Maths:** exact rationals plus money (paise) and time (minutes) types; one shared float `eq(a, b, eps)` for geometry; **CAS-lite** (a Pratt parser over a closed grammar, ≤ 200 nodes, depth ≤ 20, a step budget, normal-form equivalence); EXPR@1 (shared with `scene@1`).
- **Determinism:** a seeded RNG; `getState`/`setState` and canonical-JSON hashing with floats quantised to 1e-4; the fading machine.
- **Text and fonts:** a text layer with bundled Mukta and Noto Sans Devanagari subsets; `document.fonts.load` before layout; DOM-measured wrap on spaces; line-height 1.5; a pure-JS akshara segmenter.
- **Bridge and contracts:** the bridge v2 client (§4); `summarize`/facts helpers; the detector runtime (JSONLogic over facts); `renderStatic()`.
- **Test harness:** golden-spec, golden-script and detector precision/recall harnesses in Playwright against `serve.mjs` headers.

**Budgets:**
- The kit is 25–35 kB gz, cached once.
- Each engine is 25–60 kB gz on top. JSXGraph and three.js are lazy chunks.
- Build target is Chrome 80 / ES2019, verified on Android 9 stock WebView.
- At most about 250–300 live SVG nodes; above that, canvas with a display list.
- DPR cap of 2, or 1.5 on low memory; the backing store ≤ 1.5× CSS size or 720 px wide.
- No `filter`, `blur`, `shadowBlur` or per-frame gradients.
- Cost: **about 15–20 engineer-days** (maths says 8–10 for its subset, science 3–4 weeks for its own; one kit serves both) [U].

---

## 3. The `scene@1` DSL

**Normative source:** `genui-scene-dsl.mjs` (zod, validator v1.3, EXPR@1, solver, 6 template expanders). **Generated schema:** `genui-scene-dsl.schema.json` (81 KB minified). The controls are `genui-scene-dsl.test.mjs`, 47/47 passing [X]. This section fixes the **scene@1.1** changes that this spec adopts. The sketch below is the contract the build implements; regenerate the full schema from the zod source rather than hand-editing it.

### 3.1 Schema (JSON Schema 2020-12, scene@1.1, abridged to the structure; leaf limits as in `LIMITS`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "taxila/scene.v1_1.json",
  "type": "object", "additionalProperties": false,
  "required": ["dsl", "meta", "stage", "vars", "derive", "nodes", "timelines", "goals", "feedback"],
  "properties": {
    "dsl":   { "const": "scene@1.1" },
    "meta":  { "type": "object", "additionalProperties": false, "required": ["band", "lang", "title", "objective_ids", "topic_ids"],
               "properties": { "band": { "$ref": "#/$defs/band" }, "lang": { "enum": ["en", "hi", "hi-Latn+en"] },
                               "title": { "$ref": "#/$defs/l10n" },                         "//": "rendered by the HOST chrome, never on stage",
                               "objective_ids": { "type": "array", "maxItems": 4, "items": { "type": "string" } },
                               "topic_ids": { "type": "array", "maxItems": 4, "items": { "type": "string" } },
                               "template": { "type": ["string", "null"] } } },
    "stage": { "type": "object", "additionalProperties": false, "required": ["aspect", "bg"],
               "properties": { "aspect": { "enum": ["4:3", "1:1"] }, "bg": { "enum": ["bg", "surface", "sky", "none"] } } },
    "vars":      { "type": "array", "maxItems": 8,  "items": { "$ref": "#/$defs/var" } },
    "derive":    { "type": "array", "maxItems": 8,  "items": { "$ref": "#/$defs/derive" } },
    "nodes":     { "type": "array", "minItems": 1, "maxItems": 80, "items": { "$ref": "#/$defs/node" } },
    "timelines": { "type": "array", "maxItems": 4,  "items": { "$ref": "#/$defs/timeline" } },
    "goals":     { "type": "array", "maxItems": 5,  "items": { "$ref": "#/$defs/goal" } },
    "probe":     { "oneOf": [{ "$ref": "#/$defs/probe" }, { "type": "null" }] },
    "feedback":  { "enum": ["on_commit", "on_drop", "none"] }
  },
  "$defs": {
    "id":    { "type": "string", "pattern": "^[a-z][a-z0-9_]{0,23}$" },
    "band":  { "enum": ["B1", "B2", "B3", "B4"] },
    "str":   { "type": "string", "minLength": 1, "maxLength": 80, "not": { "pattern": "<[A-Za-z/!?]|\\{\\{|javascript:" } },
    "l10n":  { "type": "object", "additionalProperties": false, "required": ["en", "hi"],
               "properties": { "en": { "$ref": "#/$defs/str" }, "hi": { "$ref": "#/$defs/str" }, "hi_latn": { "$ref": "#/$defs/str" } } },
    "expr":  { "type": "object", "additionalProperties": false, "required": ["$"], "properties": { "$": { "type": "string", "maxLength": 160 } } },
    "num":   { "oneOf": [{ "type": "number" }, { "$ref": "#/$defs/expr" }] },
    "bool":  { "oneOf": [{ "type": "boolean" }, { "$ref": "#/$defs/expr" }] },
    "color": { "enum": ["none","bg","surface","ink","ink2","line","done","c1","c2","c3","c4","c5","c6","c1d","c2d","c3d","c4d","c5d","c6d",
                        "water","leaf","soil","sun","sky","fire","ice","metal","wood"] },
    "misc":  { "type": "string", "pattern": "^MC\\.[A-Z0-9_.]{2,60}$" },
    "look":  { "type": "object", "additionalProperties": false,                         "//": "scene@1.1: one optional object instead of 6 nullable fields (null tax was 24.5%)",
               "properties": { "rot": { "$ref": "#/$defs/num" }, "scale": { "$ref": "#/$defs/num" }, "op": { "$ref": "#/$defs/num" },
                               "z": { "type": "integer", "minimum": -10, "maximum": 10 }, "dash": { "type": "boolean" }, "sw": { "type": "number" } } },
    "base":  { "type": "object", "required": ["id", "kind"],
               "properties": { "id": { "$ref": "#/$defs/id" }, "parent": { "$ref": "#/$defs/id" },
                               "x": { "$ref": "#/$defs/num" }, "y": { "$ref": "#/$defs/num" },     "//": "centre-anchored; layout containers replace arithmetic",
                               "fill": { "$ref": "#/$defs/color" }, "stroke": { "$ref": "#/$defs/color" }, "show": { "$ref": "#/$defs/bool" },
                               "look": { "$ref": "#/$defs/look" },
                               "role": { "enum": ["content", "control", "label", "feedback", "context"] },   "//": "context never animates",
                               "tags": { "type": "array", "maxItems": 4, "items": { "$ref": "#/$defs/id" } },
                               "tl": { "type": "string", "maxLength": 32 },                        "//": "teacher label: the key in observation lines",
                               "say": { "$ref": "#/$defs/l10n" },                                  "//": "tap-to-hear; TTS pre-rendered at validation",
                               "drag": { "type": "object", "properties": { "axis": { "enum": ["xy","x","y"] }, "snap": { "enum": ["zone","grid","none"] },
                                                                            "grid": { "type": "number" }, "back": { "type": "boolean" }, "in": { "$ref": "#/$defs/id" } } },
                               "tap": { "type": "object", "properties": { "act": { "enum": ["select","toggle","set","say"] }, "var": { "$ref": "#/$defs/id" } } } } },
    "node": { "allOf": [{ "$ref": "#/$defs/base" }], "oneOf": [
      { "properties": { "kind": { "const": "rect" },    "w": { "$ref": "#/$defs/num" }, "h": { "$ref": "#/$defs/num" }, "r": { "type": "number" } } },
      { "properties": { "kind": { "enum": ["circle", "ellipse"] }, "r": { "$ref": "#/$defs/num" }, "rx": { "$ref": "#/$defs/num" }, "ry": { "$ref": "#/$defs/num" } } },
      { "properties": { "kind": { "const": "wedge" },   "r": { "type": "number" }, "a0": { "$ref": "#/$defs/num" }, "a1": { "$ref": "#/$defs/num" }, "r0": { "type": "number" } } },
      { "properties": { "kind": { "enum": ["line", "poly"] }, "pts": { "type": "array", "minItems": 2, "maxItems": 64 }, "head": { "type": "boolean" }, "closed": { "type": "boolean" } } },
      { "properties": { "kind": { "const": "text" },    "text": { "oneOf": [{ "$ref": "#/$defs/l10n" }, { "type": "object", "properties": { "fmt": { "$ref": "#/$defs/l10n" } } }] },
                        "size": { "enum": ["label","caption","title","numeral"] }, "w": { "type": "number" }, "fill": { "enum": ["ink", "ink2"] } } },
      { "properties": { "kind": { "const": "math" },    "tex": { "type": "string", "maxLength": 120 }, "fill": { "enum": ["ink", "ink2"] } } },
      { "properties": { "kind": { "const": "sprite" },  "lib": { "type": "string", "pattern": "^[a-z]+\\.[a-z0-9_]{1,30}$" }, "w": { "type": "number" }, "h": { "type": "number" } } },
      { "properties": { "kind": { "const": "image" },   "asset": { "type": "string", "pattern": "^ast_[a-z0-9]{8,64}$" } } },
      { "properties": { "kind": { "const": "group" },   "layout": { "type": "object", "properties": { "type": { "enum": ["row","column","grid","circle","free","scatter"] } } } } },
      { "properties": { "kind": { "const": "repeat" },  "count": { "$ref": "#/$defs/num" }, "item": { "type": "object" } } },
      { "properties": { "kind": { "const": "axis" },    "from": { "type": "number" }, "to": { "type": "number" }, "step": { "type": "number" } } },
      { "properties": { "kind": { "const": "connector" }, "from": { "$ref": "#/$defs/id" }, "to": { "$ref": "#/$defs/id" } } },
      { "properties": { "kind": { "const": "zone" },    "accepts": { "type": "array", "items": { "$ref": "#/$defs/id" } }, "cap": { "type": "integer" } } },
      { "properties": { "kind": { "enum": ["slider", "stepper", "toggle"] }, "var": { "$ref": "#/$defs/id" } } },
      { "properties": { "kind": { "const": "choice" },  "var": { "$ref": "#/$defs/id" },
                        "options": { "type": "array", "minItems": 2, "maxItems": 4,
                                     "items": { "type": "object", "properties": { "id": { "$ref": "#/$defs/id" }, "misc": { "$ref": "#/$defs/misc" } } } } } },
      { "properties": { "kind": { "const": "button" },  "act": { "enum": ["check", "reset", "play", "next"] } } },
      { "properties": { "kind": { "const": "order" },   "items": { "type": "array", "minItems": 2, "maxItems": 6 } } },
      { "properties": { "kind": { "const": "keypad" },  "var": { "$ref": "#/$defs/id" }, "digits": { "type": "integer", "minimum": 1, "maximum": 4 } } } ] },
    "var":      { "type": "object", "required": ["id", "type", "init", "tl"] },
    "derive":   { "type": "object", "required": ["id", "expr", "tl"] },
    "timeline": { "type": "object", "required": ["id", "on", "steps"],
                  "properties": { "on": { "enum": ["mount","host","button","commit","goal"] }, "steps": { "type": "array", "maxItems": 40 } } },
    "goal":     { "type": "object", "required": ["id", "when", "tl"], "properties": { "hints": { "type": "array", "maxItems": 3 } } },
    "probe":    { "type": "object", "required": ["id", "kind", "ask", "commit", "correct", "traps"],
                  "properties": { "kind": { "enum": ["predict","diagnose","classify","sequence","estimate","construct"] },
                                  "commit": { "type": "object", "properties": { "via": { "enum": ["choice","check","order","voice"] } } },
                                  "correct": { "type": "string", "maxLength": 160 },
                                  "traps": { "type": "array", "maxItems": 4, "items": { "type": "object", "required": ["when", "misc"] } },
                                  "reveal_timeline": { "$ref": "#/$defs/id" } } }
  }
}
```

**The scene@1.1 deltas over scene@1:**
1. `stage.aspect` loses `3:4` (A13).
2. Text and math `fill ∈ {ink, ink2}`.
3. `probe.reveal` becomes `reveal_timeline`.
4. No stage-level title text.
5. The optional `look` object replaces `rot`, `scale`, `op`, `z`, `dash` and `sw`.
6. The string ban becomes a markup pattern rather than any `<` or `>` (A6).
7. `goal.hints[≤ 3]` gives authored tiered hints (genui review E3).
8. `slider` and `keypad` emit `t` and `lat` timing.
9. `sc.drop` carries `rejected_drops` and `first_zone`.
10. `sc.explore{min, max, changes, dwell_at_goal, reversals}` replaces the 4 Hz settle stream.

The bench numbers were taken on scene@1. Keep v1.3 of the validator for comparability, and re-run `genui-bench.mjs` on 1.1 before switching the live path.

### 3.2 Semantics that the schema cannot carry (enforced by the validator)

| code | rule |
|---|---|
| S1 | References resolve: ids unique, parents are groups, no cycles. Num/int vars have `[min, max]` with `init` inside |
| S2 | EXPR@1 parses, names resolve, types match, and the expression evaluates at mount. Comparisons use ε = 1e-9 |
| S3 | After layout against the smallest published `stageBox` (320×240 dp): everything is on stage; hit targets ≥ 64/64/48/48 dp; no overlapping interactives, zones or texts. Text is measured with real font metrics (on device, D8) |
| S4 | **Solver:** every goal is false at mount and reachable; exactly one correct choice; no trap is co-true with `correct`; untagged distractors warn |
| S5 | Choices ≤ the band max; keypad B3+ only; words on stage ≤ 8/20/40/60; contrast ≥ 4.5:1; context never animates; a goal or probe is present. **S5.flash:** ≤ 2 pulses per target per second, with a cap on luminance-change area |
| S6 | Sprites come from the versioned library; assets resolve against the signed manifest; no markup; Content Safety on every string; a regex for phone numbers, URLs and `@` |
| S7 | ≤ 80 nodes, ≤ 100 instances, timelines ≤ 30 s and ≤ 60 steps |
| autofix v1–v1.3 | null-strip; sprite snap; colour words → tokens; numeric strings → numbers; grow undersized targets; lone `=` → `==`; repair probe reveal; nudge overflow ≤ 80 units; text fill → `ink` |

**The frame does not re-run the full validator** (it imports zod and the 200k-state solver). The server signs `{sceneHash, validatorVersion}`. The frame runs a generated standalone structural subset plus the on-device overflow check, and replies `ready{overflow:[]}` (genui review E1). The renderer is **SVG DOM**, ≤ about 180 elements. It uses one rAF loop, dirty flags, compiled EXPR with dependency tracking and transform-only animation; animated `w`, `h` and `r` tweens are capped.

### 3.3 Templates (T2a)

| template | mechanic → probe | status | v1? |
|---|---|---|---|
| `sort-bins@1` | sort → classify (alias `so.place`) | coded | v1 |
| `count-group@1` | count/construct → construct (voice commit at B1) | coded | v1 |
| `slider-explore@1` | explore → goal | coded | v1 |
| `sequence-steps@1` | sequence → sequence (B1–B2 ≤ 4 steps) | coded | v1 |
| `compare-choice@1` | compare → diagnose (P8 contrast) | coded | v1 |
| `predict-reveal@1` | predict → predict (POE without an engine) | coded | v1 |
| `label-diagram@1` | label → classify, verified anchors (A7) | spec, **build first** | v1 |
| `match-pairs@1` | match → diagnose; with `audio`, it is the old `picture-word@1` (34 topics as secondary) | spec | v1 |
| `hotspot-explore@1` | explore/retrieve → construct; with `claims[]` it is the old `source-card@1` | spec | v1.1 |
| `story-problem@1` | translate → construct → hands off to `tape-diagram@1` | spec | v1.1 |
| `worked-steps@1` | watch → predict next step; faded blanks (the M5 worked-example route) | spec | v1 |

**Template fit is a router decision on mechanic tags, never a model choice.** "Label the flower" was squeezed into `sort-bins` 2 times out of 2 [X]. Per-template **slot sanity rules** are a ship blocker for live use. One example: `split-share` must have `take < parts` when the objective is a unit fraction (animation §6.8: `take: 4` showed 4/4).

---

## 4. Module ↔ host protocol: bridge v2

**Normative:** sandbox-telemetry §4, as amended here by the sandbox, teacher-visual and diagrams reviews. The types live in `shared/bridge.ts`. The parsers stay hand-written (no eval, no zod JIT) in `src/modules/frame/protocol.ts` and are shared by the frame, the host and Node tests.

### 4.1 Lifecycle

```
host                                                  frame (sandbox="allow-scripts", origin "null")
 create iframe #mid ── load #1 ─────────────────────►  bootstrap: delete RTC*, freeze intrinsics, capture port primitives in a closure,
                                                        install CSP-violation / longtask / error reporters, kit scheduler
                    ◄── window: hello{mid, boot, build}  (the only window message; host checks event.source + boot nonce + load==1)
 new MessageChannel; postMessage(init{…}, "*", [port2]) ─►  validate structure → resolveParams → mount engine → apply replay/restore
                    ◄── port: ready{caps, emits, targets, state}
 commands (cseq↑) ── port ─────────────────────────────►  apply → ack{cseq, ok, reason, applied_t}
                    ◄── port: interaction | progress | answer | goal_met | stuck | state | request | perf | rects | layout_changed | error
 verdict{answer_seq} (host-graded) ── port ──►  feedback
 ping every 2 s ──► ◄── pong ≤ 1 s;   2nd iframe load = navigation → kill, incident, denylist engine@ver;   teardown → bye (≤ 500 ms)
```

### 4.2 Types (v2.1 = sandbox-telemetry §4.2 + amendments, marked ★)

```ts
export const BRIDGE_V = 2 as const;
export const LIMITS = {
  msgBytes: 8192,               // module→host events
  bulkBytes: 65536,             // ★ init, restore and state{blob} only; never forwarded to a model
  factKeys: 12, keyLen: 24, strLen: 64, detailLen: 120, emitsMax: 40,
  ratePerSec: 20, burst: 40, floodMs: 3000, readyTimeoutMs: 8000, pingEveryMs: 2000, pongTimeoutMs: 1000,
  rectsPerSec: 4,               // ★ rects and layout_changed (teacher-visual C-13)
  sessionEvents: 500,           // ★ per mount, then aggregate (maths R.6.8)
} as const;
export const NAME_RE = /^[a-z][a-z0-9_]{0,23}(\.[a-z0-9_]{1,24}){0,2}$/;
export const KEY_RE  = /^[a-z][a-z0-9_]{0,23}$/;
export type Prim = string | number | boolean | null;
export type Facts = Record<string, Prim>;
export type Tier = "T0" | "T1" | "T2" | "T3";
export type Band = "B1" | "B2" | "B3" | "B4";
export type Stage = "concrete" | "pictorial" | "abstract";
export type MiscId = `MC.${string}`;
export type Outcome = "correct" | "incorrect" | "misc" | "partial";
export type AnswerValue =
  | { t: "math"; s: string }                       // ★ MathValue string form: "3/4", "0.125", "₹37", "2:45", "(3,2)" (A5)
  | { t: "choice"; id: string } | { t: "set"; ids: string[] } | { t: "order"; ids: string[] }
  | { t: "label"; target: string; id: string } | { t: "vars"; vars: Facts };
export interface StateSnap { hash: string; facts: Facts; stage?: Stage }    // hash = FNV-1a of canonical state, floats quantised to 1e-4 ★
export type Cap = "set_param" | "set_params" | "highlight" | "reveal" | "reset" | "set_stage" | "open_probe" | "record_answer"
  | "demo" | "lock" | "freeze" | "snapshot" | "restore" | "ghost" | "focus" | "set_scene" | "locate" | "cue"
  | "anim" | "verdict";                            // ★ set_params, locate, cue, anim
export interface TargetDecl { id: string; kind: "part" | "region" | "control"; moving?: boolean }   // ★ label comes from the host registry, not the frame
export interface Rect { x: number; y: number; w: number; h: number }

interface MBase { v: 2; mid: string; seq: number; t: number }
export type ModuleMsg =
  | (MBase & { k: "hello"; boot: string; build: string })
  | (MBase & { k: "ready"; caps: Cap[]; emits: string[]; targets: TargetDecl[]; state: StateSnap;
               overflow?: string[]; fit_scale?: number; min_label_px?: number })                    // ★ diagram D8
  | (MBase & { k: "interaction"; name: string; facts: Facts; src: "child" | "host" | "engine"; cause?: number; salience: 0 | 1 })
  | (MBase & { k: "progress"; goal: string; distance: number })                                     // ★ optional per goal; absent for exploratory engines
  | (MBase & { k: "answer"; probe?: string; item?: string; value: AnswerValue; latency_ms: number; first_touch_ms?: number;   // ★
               attempt: number; changes: number; via: "tap" | "drag" | "keys" | "voice"; claim?: Outcome; misc?: MiscId; state: StateSnap })
  | (MBase & { k: "goal_met"; goal: string; attempts: number; hints: number; ms: number; state: StateSnap })
  | (MBase & { k: "stuck"; reason: `eng.${string}`; facts?: Facts })
  | (MBase & { k: "state"; reply_to?: number; snap: StateSnap; blob?: string /* canonical JSON, ≤ bulkBytes */ })   // ★ blob
  | (MBase & { k: "request"; what: "sound" | "hint" | "attention"; ref?: string })                  // modules never play audio
  | (MBase & { k: "rects"; reply_to: number; rects: Record<string, Rect | null>; vw: number; vh: number })   // ★ teacher pointer
  | (MBase & { k: "layout_changed" })                                                                // ★ throttled ≥ 250 ms
  | (MBase & { k: "ack"; cseq: number; ok: boolean; reason?: string; applied_t?: number })          // ★ applied_t = frame clock after next rAF
  | (MBase & { k: "error"; code: ErrorCode; fatal: boolean; detail?: string })
  | (MBase & { k: "perf"; long_tasks: number; max_task_ms: number; fps_p10?: number; frame_p95_ms?: number })
  | (MBase & { k: "pong"; n: number }) | (MBase & { k: "bye" });
export type ErrorCode = "bad_params" | "unreachable_goal" | "engine_crash" | "unknown_engine" | "load_failed" | "csp_violation"
  | "long_task" | "clamped" | "navigated" | "flood" | "protocol" | "not_ready" | "no_pong" | "state_diverged" | "revoked";

interface HBase { v: 2; mid: string; cseq: number }
export interface InitCtx { lang: "en" | "hi" | "hi-Latn+en"; numerals: "latn" | "deva"; band: Band; reducedMotion: boolean;
  theme: "light" | "dark"; hostNow: number; stageBox: { w: number; h: number };   // ★ stageBox; ★ NO displayName for T2/T3 (A14)
  minTargetDp: number; deviceTier: "A" | "B" | "C" | "D" | "E" }
export type HostMsg =
  | (HBase & { k: "init"; engine: `${string}@${number}`; tier: Tier; spec: unknown; ctx: InitCtx;
               replay: HostMsg[]; restore?: string /* blob, replaces replay past 50 cmds or 4 KB */; assets?: Record<string, string /* data: URL */> })
  | (HBase & { k: "set_param"; name: string; value: Prim | Prim[]; by: "teacher" | "director" })
  | (HBase & { k: "set_params"; values: Record<string, Prim | Prim[]>; atomic: true; by: "teacher" | "director" })    // ★
  | (HBase & { k: "highlight"; target: string; ms?: number })
  | (HBase & { k: "reveal"; what: "answer" | "hint" | "step"; rung?: 1 | 2 | 3 | 4; idx?: number })                 // ★ idx for stepwise
  | (HBase & { k: "cue"; id: string })                                                                              // ★ narration-driven timeline step
  | (HBase & { k: "anim"; op: "load" | "play" | "hold" | "replay" | "reduce_motion"; beat?: number; on?: boolean })  // ★ explainer@1
  | (HBase & { k: "locate"; targets: string[] /* ≤ 4 */ })                                                        // ★
  | (HBase & { k: "reset" }) | (HBase & { k: "snapshot" }) | (HBase & { k: "restore"; blob: string })              // ★ blob, not hash
  | (HBase & { k: "set_stage"; stage: Stage }) | (HBase & { k: "open_probe"; probe: string })
  | (HBase & { k: "record_answer"; probe: string; value: AnswerValue })            // voice answer after host ASR + confirmation
  | (HBase & { k: "verdict"; answer_seq: number; outcome: Outcome; misc?: MiscId })
  | (HBase & { k: "demo"; moves: string[] }) | (HBase & { k: "lock"; actions: string[] })
  | (HBase & { k: "freeze"; on: boolean }) | (HBase & { k: "ghost"; on: boolean }) | (HBase & { k: "focus"; target: string })
  | (HBase & { k: "set_scene"; scene: string }) | (HBase & { k: "ping"; n: number }) | (HBase & { k: "teardown" });
```

### 4.3 Validation and attribution rules (both directions, before any effect)

**Envelope.**
- `v === 2`, `mid` matches the slot, `seq` strictly increases (duplicates dropped, gaps counted), `t` never decreases.
- Plain JSON only.
- Facts must be in `manifest.facts`, with type-checked values; strings must be a declared enum member or match the id pattern.
- `name` must be in `ready.emits`, and `ready.emits` must be a subset of `manifest.emits`.

**Commands.**
- The host never sends a `Cap` that `ready.caps` lacks. The teacher's tool call gets `{ok:false, reason:"unsupported"}`, so she never narrates a change that did not happen.
- The engine clamps and acks the value it applied (`reason:"clamped:12"`).
- Repeated `set_param` calls on one name within 100 ms coalesce. A scenario set-up uses `set_params` (atomic).

**Rects** (teacher-visual C-13).
- Accepted only from `event.source === iframe.contentWindow` with the mount nonce.
- Values must be finite and are clamped to `[0, vw] × [0, vh]`. A rect larger than 60% of the viewport is rejected.
- The overlay is clipped to the iframe box and sits below the "computer teacher" badge and the safeguarding control.
- Labels come only from the host registry.
- For `moving` targets the host re-asks `locate` every 100 ms while a mark is held.

**Attribution.**
- Teacher-caused changes are `src:"host"` with `cause = cseq`. They never count as child actions for idle, thrash or gaming detection.
- A `goal_met` during a `demo`, or within 1 s of a teacher move that made it true, is a **demonstration, not evidence**.

**Realm hardening** (T2/T3).
- Generated code runs in the same realm as the kit.
- Bootstrap freezes the intrinsics, captures the port and `JSON` in a closure, and exposes only a narrow `emit(name, facts)`.
- T2/T3 facts are untrusted weights.

### 4.4 Mapping every sibling dialect onto v2

| source | message | v2 |
|---|---|---|
| shipped v1 (`contracts.ts`) | `ready` / `interaction{name,data}` / `answer{value,correct}` / `goal_met` / `stuck` / `error` | `ready` / `interaction{facts: flatten(data), src:"child", salience:1}` / `answer{claim}` re-graded by the host / `goal_met` / `stuck{reason:"eng."+r}` / `error{engine_crash}`. v1 is accepted while `v` is absent |
| maths §3.2 | `action{type}`, `probe_open`, `probe_commit`, `probe_result`, `misc_signal`, `stage_change`, `state{summary}` | `interaction{name}`, `interaction{name:"probe.open"}`, `answer`, host `verdict`, `interaction{name:"misc.signal"}`, `interaction{name:"stage.change"}`, `state{snap.facts}` (no prose) |
| science §2.2 | `salience 0/1/2`, `cause`, `src` (model) | 0 → salience 0; 1 → salience 1; 2 is derived by `k` (answer, goal_met, stuck and error are milestones; a misconception signal with strength ≥ 0.6 → milestone via the observer); `src: engine` |
| diagrams §4.2 | `fl.step`, `cm.place`, `ld.drop`, `fx.step`, `tap`, `ready{overflow}` | `interaction` names; `answer` for blanks and quizzes; `ready{overflow, fit_scale, min_label_px}` |
| animation §6.7 | `anim.load/play/hold/replay`; `anim.ready`, `beat_start`, `beat_end`, `replay_req`, `tap`, `probe_commit`, `error` | host `anim{op}`; `ready`, `interaction{name:"anim.beat_start"…}`, `answer{probe}` with the key computed by the template; plus `anim.interrupt{by}` and `replays`/`dwell_ms` facts (animation E.5) |
| chant (host-side) | `chant.start/slot/pass/tempo/stop`, `ChantSummary` | the same observer input type as module events, `mid = "chant"`, with facts only. The summary goes to the Director as a milestone |
| game `VerifiedAct` | host-derived | built by the host from `answer` + `verdict` (`src_seq` = the answer `seq`) |
| teacher stage | `locate`/`rects`/`layout_changed` | as typed above |

### 4.5 Correctness authority

| tier | who computes the outcome that becomes evidence | module claim | weight |
|---|---|---|---|
| T0/T1 | the host runs the engine's pure `grade(spec, value)`; the key comes from the verified kit `expect`, never from the LLM fill | must agree, else `state_diverged` and no evidence | 1.0 (0.5 unverified mini-kit) |
| T2 `scene@1` | the host re-evaluates `probe.correct` and the traps on `value.vars` with the shared EXPR@1 evaluator | ignored | 1.0 after the template's review |
| T2 Forge game | MathValue equivalence against `expect` | ignored | 0.75 until 50 sessions show ≥ 0.98 agreement [U] |
| T3 draft | none | ignored | 0 |
| voice answers | `record_answer` only after ASR plus a confirmation turn. Detectors tagged `needs: voice` fire only on confirmed answers | — | 1.0 for numerals; advisory for Hindi number words until calibrated |

`server/director/classify.js` (the `moduleAnswer.correct` path, now about line 213 [V sandbox review]) accepts an outcome only when `evidence.by === "host"` and the engine is a registered T0/T1/T2.

---

## 5. Teacher observation pipeline (`observer@1`)

### 5.1 Pipeline

```
port msgs ─► module-gate (envelope, caps, rates, nonce, load count)
   ─► ledger (ring buffer 2,000, incl. salience 0; uploaded in batches: ids + facts only, never child audio or text)
   ─► reducer per module:  coalesce ─► grade (§4.5) ─► host-derived detectors ─► engine misc.signal gate ─► timing features
   ─► Observation{lane, facts, line, evidence?}
   ─► lanes:   log ─► ledger only
               fold ─► conversation.item.create (no response) ≤ 1 line / module / 2.5 s   [GPT-Live: session.thinking.append]
               milestone ─► talk gate ─► Director call (TurnRequest.moduleEvents) ─► instructions + response.create
   ─► learner model: evidence (host-graded) ─► KT;  misc signals ─► verification scheduler (≤ 1 probe / 3 min)
```

The chant runtime, the read-along speech window, the teacher stage (`cue_outcome`) and host-side games feed the same reducer as virtual modules. So the Director receives one format whatever produced the event.

### 5.2 Coalescing and derived detectors

| raw | becomes | default |
|---|---|---|
| continuous `param.set` or drag on one control | `drag{param, from, to, n, ms}` after a quiet gap | 600 ms |
| repeated taps on one target | `tap{target, n}` | 400 ms |
| A → B → A | `flip{target, n}` | within 2 s |
| slider exploration (scene@1.1) | `sc.explore{min, max, changes, dwell_at_goal, reversals}` | on settle or commit |

| detector (host-side, engine-agnostic, child events only) | rule | lane |
|---|---|---|
| idle | no child event for 15 s (B1–B2) or 20 s (B3–B4) while visible, unfrozen and **nobody speaking** | milestone, at most once per 60 s |
| circling | ≥ 3 local minima of `progress.distance` in 20 s without reaching 0. **Skipped when the engine has no `progress`** | milestone |
| thrash | ≥ 8 child acts in 5 s with no fall in distance | fold; twice → milestone |
| repeat_wrong | the same value graded wrong twice on one probe | milestone → verify the misconception |
| rapid | `latency_ms` below the per-device floor (start: 600 ms tap, 1,200 ms produced) | a fact only; never a milestone alone; never counts toward progress |
| fast_retry | next answer < 2 s after a wrong verdict | fact |
| dwell_after_hint | from host `reveal{hint}` to the next child act | fact |
| miss_rate | taps that hit nothing, per window | fact; B1–B2 separates motor or UI trouble from concept errors |
| cue_outcome | first touch on a pointer cue's target after `cue_fired`, `{touchedAtMs \| null, windowMs}` (teacher-visual E.4) | fact; the most useful attention signal |
| engine stuck | the module's own `stuck{eng.*}` | milestone |
| misc.signal | an engine detector fired | fold, plus a verification-scheduler entry. A milestone only on the 2nd independent signal or strength ≥ 0.6 |

### 5.3 The observation line

The format is `[mod <mid> <engine>]` followed by `key=value` pairs in manifest order, ≤ 240 characters. Values are numbers (≤ 4 significant figures), enums, ids or `n/d`. **Sentence templates are banned:** sentence-shaped prompt text gets recited (html-portfolio: 4/5 recited → 0 after removal [V]).

```
[mod m_12 fractions@1] answer=2/5 verdict=misc misc=MC.FRAC.ADD_ACROSS latency_ms=4100 attempt=1 stage=pictorial
[mod m_3 particles@1] drag=T_C from=25 to=100 n=14 ms=6200 phase=boiling plateau=true pred=air match=false
[mod chant pahada@1] kit=pahada-hi-7 passes=3 child_slots=30 voiced=27 weak_lines=6,8 tempo=base trust=high
[mod m_9 stage] cue=c2 target=denominator touched_ms=820
```

**The prompt-injection firewall.** A fact passes only if its key is in `manifest.facts` and its value type-checks. T2/T3 modules can never place free text into the voice model's context. Labels a child *sees* may be LLM-written; the teacher's context gets their ids. Child-originated strings (word-chain words, rule guesses) enter only as quoted data, ≤ 40 characters, charset-limited, PII-scrubbed and never in instruction position (game review S1).

### 5.4 The talk gate

| condition when a milestone is ready | action |
|---|---|
| teacher audio playing (between `output_audio_buffer.started` and `stopped`) | hold; deliver on stop; force delivery at the next stop after 6 s. B1–B2 modules get `freeze{on:true}` while she speaks |
| child speaking | attach to that turn's `TurnRequest.moduleEvents`; no separate response |
| quiet | wait 1.2 s (children exclaim on success), then call the Director and `response.create` |
| < 4 s since the last module-triggered response, or 3 already this minute | merge into the next milestone; a `goal_met` is never dropped |
| `goal_met` and `answer` within 300 ms | one milestone |

The engine gives **its own immediate non-verbal feedback** (tick or shake, plus a sound request) within 100 ms. The teacher's speech follows 2–3 s later. Engines never wait for `verdict` to acknowledge an act.

```ts
export interface ObserverConfig {   // every value is a tunable, logged per lesson
  coalesceQuietMs: 600; tapMergeMs: 400; foldEveryMs: 2500;
  idleMs: { B1: 15000; B2: 15000; B3: 20000; B4: 20000 };
  thrash: { actions: 8; windowMs: 5000 }; circling: { minima: 3; windowMs: 20000 };
  repeatWrong: 2; rapidTapMs: 600; rapidProduceMs: 1200; fastRetryMs: 2000; demoGraceMs: 1000;
  milestoneMinGapMs: 4000; maxTeacherPromptsPerMin: 3; childSpeechHoldMs: 1200; holdMaxMs: 6000;
  verifyProbeMinGapMs: 180000; miscLikelyMinSignals: 2;
  ledgerMax: 2000; lineMaxChars: 240; sessionEventCap: 500;
}
```

**Transport caveat.** The talk gate depends on `output_audio_buffer.started` and `stopped`, which exist on the WebRTC transport [S]. A spike must confirm the transport the app actually uses; on WebSocket the client tracks its own playback clock (sandbox review E.2).

---

## 6. Media pipelines

### 6.1 Diagrams (diagrams-images §3–4)

**Router:** the visual's content shape decides the renderer; the model never does.

| shape | renderer | live? |
|---|---|---|
| quantity, number, fraction, measurement, data, time | the maths T1 engines | T1 spec |
| geometry figure | `geo-construct` (constraints + solver), or `svg-figure@1` from the library | T1 / library |
| physical phenomenon | the science engines | T1 |
| process, cycle, sequence, cause → effect | **`flow@1`** (`chain` and `branch` via `@dagrejs/dagre`, 17 KB gz; `cycle` as a fixed polar layout capped at 6 nodes at 380 dp) | spec fill |
| hierarchy, classification | **`concept-map@1`** (a tidy tree; `tree-down` only in v1; ≤ 7 nodes at B1–B2) | spec fill |
| parts of a structure | **`label-diagram@1`** over an SVG part-figure or a verified raster base (A7) | library base + spec |
| equation, formula, chemical equation | **`formula@1`** (KaTeX 0.19 + mhchem, a lazy chunk of 76 KB gz) | named formulas by id `F.*`; free `tex` only for worked steps, with a numeric check |
| misconception contrast | **`contrast-pair@1`** over two `renderStatic()` snapshots; interactive only after the pick; panels stacked on phones | spec fill |
| bespoke exact figure | **`svg-figure@1`**: offline free SVG with an assertion manifest | never live |
| context, story, hook | **`illustration@1`**: a cached raster with no text, plus overlays | library only |
| real organism, monument, artefact | a licensed photo (Wikimedia, licence stored) | library |
| map of India or the world | `map-explorer@1` on Survey of India boundaries | T1 |

**Hard bans (lint):**
- a raster with text;
- a raster for any quantity, procedure or geometry;
- a raster of a map, flag, emblem, banknote, coin design, deity or place of worship;
- Mermaid or Graphviz in the child frame (1.58 MB gz; sanitiser advisories; Hindi widths off by ≥ 70 px [X]);
- live free-form SVG.

**Labels:**
- Every label comes from the kit term bank (`TermRef.term`) in English, Hindi and Hinglish, with NCERT spelling.
- `TermRef.text` is allowed only for non-technical English words; `hi` always comes from the kit (diagrams E0.6).
- Leader lines are computed by a non-crossing matching, and end in a dot inside the part.

**Gates, split by where they can run (diagrams E0.5):**

| where | gates |
|---|---|
| server, ms, no model | D0 strict parse; D1 every term resolves and is complete for `lang`; D2 structure (a connected flow, a cycle ≥ 3, a tree with no cycles, parts in the anchor manifest, exactly one correct contrast); D3 KaTeX parse under the allowlist; D5 contrast and ≤ 4 meaningful colours plus the CVD rule; D6 words ≤ band max; D7 Content Safety on every string *and every spoken string*; D9 ≤ 40 KB and ≤ 300 nodes |
| device | D4 layout fits at scale 1 with real fonts (labels ≥ 16 sp Latin / 18 sp Devanagari; hits ≥ band); D8 post-paint `ready.overflow` empty, else unmount and fall back to voice + anchor |

KaTeX settings: `trust:false`, `maxExpand:200`, `maxSize:20`, a closed macro allowlist. The allowlist adds `\lt \gt \% \ldots \quad \Rightarrow \therefore \because \boxed \square \underline`, `array` with a size cap for column arithmetic, and `^\circ`. Add the CSS rule `.katex .text{font-family:Mukta,…}` [X].

**Events** (as `interaction` names): `fl.step`, `fl.order{submitted,first_wrong_idx}`, `cm.place`, `ld.drag_start`, `ld.drop{part,label,dropped_label_part}`, `ld.drop_miss`, `ld.hint`, `fx.step`, `fx.answer`, `tap{part}`. Every answer carries `ms`, `attempt` and `hint_used`. For `quiz_voice`, the frame sends `ld.voice_wait` and the host emits the answer after ASR.

### 6.2 Raster images (Forge, offline)

**Pipeline** (diagrams §5): a visual plan → a prompt compiled from style blocks as data → 2–3 low-quality candidates ($0.0059, about 20 s [X]) → the winner regenerated at medium ($0.0527, about 40 s [X]) through `images/edits` with the band's style-anchor images → the gates below.

| gate | check | threshold |
|---|---|---|
| I0 | Azure output filter | pass |
| I1 | Content Safety `image:analyze` | 0 in every category |
| I2 | no text, checked by VLM OCR, plus a connected-component pass for glyph-like clusters | exact |
| I3 | CIELAB quantisation to the band palette | hue clusters ≤ 6/8/10 |
| I4 | skin tokens | ±1 step; the classifier is still to build, so the human key catches it meanwhile |
| I5 | VLM checklist | smoke test only |

After the gates:
- **Anchors:** the VLM proposes two independent runs. A person confirms every anchor, about 5 s per part. **Unverified anchors are never served.** Hit masks are flood-filled offline from the *published* WebP, with the bytes hash pinned.
- **Two-key review:** subject truth, and identity and representation.
- **Publish:** WebP (40–120 KB); the PNG original is archived with its C2PA manifest.

**Rules:**
- No child photo, voice-derived avatar or drawing is ever sent to an image model.
- No per-child images.
- Illustrated children only (Azure blocks photoreal minors [V]).
- Never name a living artist or folk tradition.

**Library sizing:** about 750 rasters plus 400 figures is $110–250 in tokens and **about 45 reviewer-hours**. Review time, not compute, is the binding cost [I]. The review tool (L, 4–5 d) and a rate-limited queue at 4 RPM (M) are build items.

### 6.3 Animation: `explainer@1` (animation-video §6)

- **Live:** `taxila-fast`, effort `none`, fills a `TemplateEnvelope{template, slots, notes[], probe?}`. Code computes counts, coordinates, angles and shadows on a 6×6 anchor grid. Measured 8/8 valid, 2.88 s p50, about $0.0007 each [X].
- **Templates, v1:** `combine-count`, `number-line-hop`, `process-steps`, `cycle` (all S), then `split-share`, `path-trace`, `sun-shadow` and `moon-phase` (S–M). Each gains an `intent` enum and an `emphasis` beat slot, and both go into the cache key.
- **Templates, v1.1:** `bar-grow`, `timeline`, `story-panels`, then `ray-path` (reusing optics maths), `build-diagram` (after verified assets) and `equation-steps` (linear equations only, with a mini-CAS).
- **Player:** one `AnimEngine` class (`load`, `play(beat)`, `hold`, `replay`, `destroy`), with no React in the frame.
  - Actors are absolutely positioned HTML layers moved with `translate3d` and `opacity`; one SVG overlay carries arrows and paths. This is decided before the player is written (animation E.2.6).
  - GSAP core plus MotionPath (about 38 KB gz). `draw` uses `stroke-dashoffset`; `morph` is a crossfade. `write` is an SVG `<clipPath>` rect width tween, never CSS clip-path and never per character.
  - A fresh tween per beat, never a seek on a global timeline in the live path.
- **Sync:** one beat per teacher turn. A beat starts on the first played audio of the turn tagged with it, on the playback clock, and its end state holds. Probes pause before the reveal. Keys are computed by the template, and the host grades `answer`.
- **Lint E0–E14:**
  - E3 ≤ 2 movers (load-bearing for performance);
  - E4 context never moves;
  - E6 `count` matches the copies;
  - E8 notes are shapes, with no quoted lines;
  - E9 ≤ 3 Hz;
  - E12 checks hold;
  - **E13** bounding-box overlap on the compiled plan, offline and in CI only;
  - **E14** L10n strings ≤ 80 characters, no URL, no markup, `textContent` only.
  - Plans are capped at 16 KB and ≤ 60 elements. Watchdog: no `ready` within 3 s → a static diagram.
- **Pre-render:** the same DSL plus Azure Speech SSML bookmarks per beat (30 s of Hindi in 1.95 s [X]). Beats are retimed to the bookmarks. In-app delivery is the DSL plus 20 kbps Opus (**0.12 MB/min**). An MP4 (Playwright capture at 1.49× realtime, ≤ 400 kbps) is made only for parent sharing and the lite tier. Cost is about $0.01 per finished minute [X/U].
- **Manim:** an optional C8–9 Forge lane, adopted only if `equation-steps` fails teacher review on more than 30% of algebra objectives (A6 measurement). **No Remotion** (licence) and **no Motion Canvas**.

### 6.4 Video

**Generated video carries no facts.** The Sora probe drew 3 + 3 apples merging into 6 under "3 + 4 = 7", and leaves opened underground [X]. Code2Video scores Veo3 at 2.5 against 86.0 for agentic Manim [V].

**Sora 2 on Azure** is a preview on borrowed time: OpenAI removed it from its own API on 2026-09-24 [V].
- It is a **B-roll lane behind a flag that is off by default.** Use it only for footage that asserts nothing countable, directional or causal, such as monsoon rain or a mela.
- Clips are 4–8 s, at most one per chapter.
- Download within 24 h; strip audio (`-an`); re-encode to ≤ 480p and ≤ 400 kbps.
- Run perceptual-hash and OCR checks on frames.
- A server-enforced reviewer state means an unreviewed clip can never be served.
- A weekly liveness probe costs $0.40.

**v2 video face:** pre-rendered narration video from self-hosted MuseTalk on Azure GPUs. The renderer owns the audio clock (teacher-visual §8). Third-party avatar vendors are benchmarks only, under the Azure-only directive.

### 6.5 Songs, chants, rhymes (songs-rhymes-audio §6–8)

**v1 is a chant, not a song.** There is no Azure first-party music model [V]. `gpt-4o-mini-tts` asked to "sing" showed no measurable singing in n = 18 clips [X]. Third-party song APIs are excluded.

**The corpus is finite** (about 3,500 lines): पहाड़े 2–20, varnamala and barahkhadi, ginti, months, days, planets, and public-domain poems and dohas. It is rendered once with **Azure Speech hi-IN Swara**, which is deterministic (160 ms first byte, 297 ms total, 12/12 table lines right [X]). Each clip is gated by ASR → phonkey (gate A) and **a human ear** (gate B), then cached.

**`chant-track@1`** (host-side, A2):
- The groove is synthesised in Web Audio (`clap-4`, `keherwa-8`, `tick-4`), with voices at 250 Hz–4 kHz because phone speakers cannot play a 50 Hz kick.
- Whole bars are scheduled up front on the audio clock. Each clip's p-centre lands on the beat, and its leading silence is skipped.
- Modes: `listen`, `echo`, `together`, `fade` (needs `ClipRef.words[]` from SDK WordBoundary), `child-leads`, `speed-ladder` and `teacher-led`.
- The highlight is driven from `ctx.currentTime − outputLatency` through refs.

**Handover:**
1. The teacher frames the chant in a turn.
2. On `response.done`, `setTurnDetection(null, …)` is called and the mic track is disabled, with no second `getUserMedia`.
3. The track plays.
4. The `ChantSummary` returns as facts.
5. The teacher reacts.

**Safety:** a hard cap of **≤ 60 s per segment with a teacher listening turn between segments.** In v1b, voiced non-matching content in clean slots runs through the same crisis predicate as live turns. The "रुको" button is always visible. Master gain is ≤ −6 dBFS and ramps in.

**`pahada@1`:**
- arcs: `acquire`, `consolidate` or `recall`;
- fade order: the product first, then the multiplier word;
- **mandatory handoff** to shuffled `quick-item` retrieval of ≥ 6 items;
- accepted regional variants are `phonKeys` alternatives.

**Phonetic key** (`shared/phonkey.ts`): ASR returned Urdu, Bengali or Gurmukhi script for 7–9 of 15 Hindi clips, even with `language=hi` [X]. Every verbatim check therefore normalises script to a consonant-vowel skeleton first. A **negative suite** (सत्ते vs सात, चौदह vs a dropped ह) must fail.

**Rights:** `ncert-pending` is a schema failure. NCERT poems stay unshipped until the owner decides; children may still recite from their own book in `teacher-led` mode.

**Varnamala:** ङ was misheard as म in every Swara condition, and the letters merged without breaks [X]. The nasals and conjuncts need reviewed human clips.

**v1a (8–9 d):** contracts, a loader, the core (listen, echo and together; 2 grooves), a word-boundary Forge render, the review tool, `pahada@1` with `mic:"off"` and the teacher listening after each segment, and a Devanagari phonkey.

**v1b:** `fade`, the AudioWorklet slot detector with a calibration bar and `detectorTrust`, slot ASR and the crisis predicate. It ships only after M-SONG-3 shows trust is attainable. **Songs** come in v2, offline: ACE-Step (MIT) or YuE (Apache-2.0) on Azure GPU, behind the same gates at ≥ 95%.

---

## 7. The teacher-stage component (`TeacherStage`, teacher-visual §2–9 with review corrections)

### 7.1 Layers and ownership

```
TeacherStage (one per lesson; owns StageBus, PlaybackClock, CueScheduler; host-side)
├─ StageFrame        layout family, framing, gaze geometry, the "computer teacher" disclosure badge (outside the rig)
│   └─ FaceRenderer  rive2d | sprite2d | talkinghead3d | portrait | none | video
├─ BoardView         board@1 (ChalkLedge ≤ 3 chips portrait / ≤ 5 lines split)
├─ PointerOverlay    one <svg>, pointer-events:none, above ModuleHost, below the badge and the safeguarding control
├─ CaptionLine       phrase-level only (word-lit only when est = "aligned")
└─ (ModuleHost)      sibling; reached only via locate/rects and highlight
```

- **One clock.** `PlaybackClock` counts time since her first audio frame *played* (`output_audio_buffer.started`, refined by the level tap). It re-anchors at every above-gate onset after ≥ 400 ms of silence. It freezes while `document.hidden`, and the return counts as a barge-in.
- **One rAF loop**, shared with `level.ts`, or the worker loop for `sprite2d`.
- **React is used only for props that change at ≤ 1 Hz.** Board, pointer, captions and mouth go through imperative refs.

### 7.2 The Director contract: cues are data, never lines

```ts
export type CueAt = { k: "say"; say: string[]; nth?: number } | { k: "turn_start" } | { k: "turn_end" } | { k: "now" };
// `say` alternatives: numbers, symbols, or kit-vocabulary terms only — never a sentence (validator).
// v1 matcher: digits + operators only; Hindi number words and terms after E-TV-3.
export type BoardItem =
  | { id: string; kind: "text"; text: string /* ≤ 24, kit or validated */; script: "latn" | "deva" }
  | { id: string; kind: "math"; expr: string /* MathLite ≤ 40 */ }
  | { id: string; kind: "colmath"; rows: string[]; op: "+" | "−" | "×"; carries?: string }   // column arithmetic C1–4 (review C-11)
  | { id: string; kind: "image"; assetId: string; alt: string }
  | { id: string; kind: "mark"; on: string; shape: "underline" | "circle" | "arrow" | "box"; to?: string };
export interface BoardOp { op: "write" | "mark" | "erase" | "clear"; item?: BoardItem; id?: string; at: CueAt; essential?: boolean; pin?: boolean }
export interface PointCue { id: string; mid: string; target: string /* ∈ ready.targets */; at: CueAt;
  shape?: "circle" | "underline" | "arrow"; gaze?: boolean; holdUntil?: "sentence_end" | "child_acts" | "ms" }
export interface UiDirectives { board?: BoardOp[] /* ≤ 3 */; cues?: PointCue[] /* ≤ 2 */;
  affect?: "warm" | "curious" | "insight" | "effort" | "calm" }   // no negative value exists
```

The server validator enforces these predicates:
- ≤ 3 board ops and ≤ 2 point cues per turn;
- every target is in the mounted engine's `targets`;
- `text` is in the child's school-medium script; a first-exposure item for B1 is a numeral or picture;
- the anchor block in the teacher's compiled instructions is appended **last** (position is mechanism).

**MathLite** (the board's only maths grammar, no KaTeX) covers `+ − × ÷ / = < > ≤ ≥ ≈`, fractions, units, `□`, mixed numbers, exponents and `√`, all within 40 characters. `x` means × only between numerals; `l` is never a variable. A corpus of ≥ 60 NCERT expressions is the test.

### 7.3 `CueScheduler`

The measured basis [X]:
- Estimator L had a median error of 372 ms and a p90 of 863 ms.
- `response.done` audio tokens are exactly 20 per second of audio, which gives the turn's duration seconds before playback ends.
- A 400 ms pre-roll puts the mark on screen at word onset 86.7% of the time, never more than 2.0 s early.

The rules:
- **Placement:** rate-based (R) from the first delta; upgraded to proportional (S, using the known duration) on `resp_done`. Each cue has a state machine `armed → fired | skipped`, and re-planning touches only `armed` cues. A cue upgraded to within `LATE_MS` fires at once.
- **Policy:** `PRE_MS 400`, `GAZE_LEAD_MS 200`, `LATE_MS 600`. **Board:** early is fine, late is not; a `no_match` falls back to `turn_start`. **Pointer:** never earlier than the previous pointer cue's word + 300 ms, nor before the previous clause boundary; the second cue in a sentence supersedes the first; a `no_match` is skipped.
- **Interruption:** cues past `playedMs` drop; `essential` board items write instantly; the pointer fades at once.
- **Captions:** phrase-level ship now. **Word-lit karaoke ships only with exact alignment:** cached narration, or live once E-TV-2 proves the sideband audio path, with ≥ 90% of words within ±150 ms. The live estimate would light the wrong word about two times in three.
- **Outputs:** `cue_fired{est}`, `cue_skipped{why}`, `board_state` (for the Director's next call), `perf`, and the joined **`cue_outcome`** (§5.2). All carry `turnId` and name their clock.

### 7.4 Faces and performance

The face rig is a **view model** (`TeacherFaceVM`):
- `floor`, `affect` (no negative value; `effort` renders as *focused*, never concern), `mouthOpen` and `mouthShape` (Oculus-15 visemes mapped to 9 shapes, with an amplitude fallback), `gaze` (enum only; StageFrame resolves it), `point`, and triggers.
- **Only `affect` is reachable by the Director.**
- Default **`sprite2d` in a worker on OffscreenCanvas for tiers C and D from day one**, with a WebP/PNG atlas and no KTX2. Budget about 8 MB decoded for 2 × 1024² sheets, or use 768² sheets. Fall back to a main-thread canvas.
- `rive2d` (canvas-lite, 222 KB br) earns tier B only if p95 ≤ 4 ms and the mouth p99 gap ≤ 70 ms (E-TV-4). A day-1 spike must confirm that data binding and nested artboards exist in canvas-lite.

**Budget:**
- Stage total ≤ 4.5 ms idle and ≤ 6 ms during a cue (p95, main thread).
- Stage code 25–35 KB br (a ratchet gate, not a fixed 20).
- Resident memory ≤ 24 MB on tier C.

**Governor step-down order:** idle tweens → face 20 fps → DPR 1 → rive → sprite → portrait → none. Faces switch only in silence. **Board, captions and pointer never degrade:** they carry teaching content.

**Cost:** the v1 stage (no video, no art) is **25–32 engineer-days**. The critical path is stage → scheduler (with a replay harness over the 16 recorded turns, reproducing the §5.2 figures in CI) → board → pointer.

---

## 8. Validation harness and safety

### 8.1 The gate matrix (what runs where, cheapest first; the first failure returns a precise slot error)

| artefact | live gates (ms, no browser) | CI / Forge gates (browser) |
|---|---|---|
| T0 engine | — | V1–V12 on about 20 golden specs per engine, against `serve.mjs` headers, WebView-like (site isolation off), 6× CPU |
| T1 spec | `safeParse` → `resolveParams` → `lint` → `solve` → string safety (length, charset, URL/phone/email regex, Devanagari + romanised blocklist, Content Safety on original + gloss, block at severity ≥ 2) | engine goldens cover the space |
| T2a/b scene | autofix → S0–S7 → solver → string safety; 1 repair (T2) | V1–V13 for promotion |
| diagram | D0–D3, D5–D7, D9 | D4, D8 on device; V7, V8 |
| explainer | E0–E12, E14, slot sanity | E13, golden plans per template, frame-capture smoke test |
| chant kit | loader validates against `chant-kit.v1.json` (unreviewed clip = schema failure) | gate A phonkey = 1.0; gate B human ear; CI: no shipped kit is `ncert-pending` |
| raster / figure | — | I0–I5 + anchors + two-key; `svg-figure` assertion manifest in Chromium |
| T3 module | — | V0–V9 (genui §7.3, incl. an oracle sweep and a sceneGraph lint) + V1–V15 + V14 AST bans and a loop guard (iteration-counted) + two-key review; ≤ 5 repair rounds keeping the Pareto-best build |

**The harness gates** (sandbox-telemetry §6.2, with the review thresholds):

| gate | check | threshold |
|---|---|---|
| V1 | boot | `ready` ≤ 2 s at 6× |
| V2 | protocol conformance | 0 rejects |
| V3 | clean console | 0 errors and 0 CSP violations |
| V4 | no network | 0 foreign requests, 0 STUN packets, `load == 1`; the leak battery extended with dns-prefetch, preconnect, Worker, WebTransport and service worker; an APK-style no-headers variant |
| V5 | goals reachable | `solve()` or a golden script replayed as real input |
| V6 | keyboard only | every goal reachable |
| V7 | axe | 0 serious or critical (`fraction-bars@1` fails today: `nested-interactive`) |
| V8 | target sizes | 64/48 dp |
| V9 | photosensitivity | WCAG 2.3.1: ≤ 3 flashes/s, with virtual time or gap-rejected recordings |
| V10 | low-end performance | p95 frame ≤ 33 ms; no long task > 200 ms; ≤ 2 long tasks > 50 ms per solve; input → event p90 ≤ 100 ms; nodes and gz within budget |
| V11 | leaks | heap back within 1 MB after 20 mounts |
| V12 | determinism | equal `state.hash` |
| V13 | content safety | DOM text walk and screenshots |
| V14 | static code | AST bans |
| V15 | weekly real device | a ₹8–10k, 3 GB phone: `ready` ≤ 1.5 s, the mic denied to the frame |

**Measured baseline for `fraction-bars@1`:** 46 / 119 / 148 ms to first engine DOM at 1× / 4× / 6×; about 1.0 MB heap per frame; message round trip p90 ≤ 11.2 ms [X sandbox P13–P15]. These are desktop proxies until V15 runs.

### 8.2 Isolation (sandbox-telemetry §3)

**Already shipped [V review]:** ACAO on `/assets/*`, and a load-count kill.

**Still open, P0:**
- the strict CSP header on `modules.html`: `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'none'; connect-src 'none'; frame-src 'none'; worker-src 'none'` (`blob:` only for the T2 heavy-sim variant)`; form-action 'none'; base-uri 'none'; object-src 'none'; frame-ancestors <app>`;
- the same policy as a meta tag for Blob-hosted Forge games;
- a deny-all `Permissions-Policy`, `no-referrer` and `nosniff`;
- `allow=` denying camera, mic, geolocation, fullscreen and autoplay;
- RTC* deletion (CSP cannot block STUN [X]);
- size, rate and flood caps;
- zod `jitless` or no zod in the frame;
- the `classify.js` fix;
- the `fraction-bars` axe fix.

**P2:**
- a Capacitor `onPermissionRequest` origin check (today it grants mic and camera to any frame [V source]);
- a `shouldInterceptRequest` allowlist.

On WebView a module shares the host's main thread: a 1.5 s busy loop froze the host for 1.5 s [X]. Freezes are therefore **prevented, not watched**, through budgets, loop guards, Blob Workers, freezing while the teacher speaks, and one animating frame at a time.

### 8.3 Safety predicates (all lint or code, none instructions)

| risk | predicate | where |
|---|---|---|
| child in distress during any module, chant or game | every child utterance in any window (role-play turn, word-chain word, chant slot ASR) passes the live crisis predicate; a hit stops the module and escalates (Childline 1098, Tele-MANAS 14416). No window in which the teacher is not listening exceeds 60 s | observer + chant + role-play |
| "are you real?" / AI identity | role-play `exitCue` breaks character; never deny being an AI | role-play validator, persona gate |
| free text from a model to a child | kit term ids for technical terms; L10n ≤ 80 chars; `textContent` or SVG text only; Content Safety (original + gloss, severity ≥ 2 blocks) + Hindi/Hinglish blocklist (an owned, versioned deliverable with a recall test) | D7, S6, E14, §7.1 of the sandbox doc |
| free text from a child to a model | numeric entry only in engines; spoken input only through ASR into a closed-set intent; quoted, ≤ 40 chars, PII-scrubbed, never in instruction position | engine kit; observer |
| prompt injection from module content | facts-only observation lines from the manifest vocabulary | observer firewall |
| wrong facts taught | engine maths and host grading; verified kit keys; formulas by id plus a numeric check; no baked labels; human-verified anchors; slot sanity rules; physics invariants golden-tested; fact ids for dates and places; per-template kill switch | §2, §6 |
| unsafe experiments | `safe:true` registries; banned twins (mains, tasting, mixing cleaners, looking at the Sun, unattended flame, ponds and wells); safety strings grep-tested | science contract |
| gambling or reward framing | no stakes, coins or points; `ch.guess` not `ch.bet`; no betting language in cricket or shop; fictional teams and brands | game G4, maths S1 |
| photosensitivity and startle | ≤ 3 flashes/s (V9, E9, S5.flash); no full-frame luminance change > 3/s; reduced motion disables pulses; audio ≤ −18 dBFS for engines and ≤ −6 dBFS master for chant, no sound before first touch | all |
| colour-blindness | colour never the only cue (± glyphs, patterns) | engine kit |
| maps, flags, money, deities | Survey of India data only; no generated maps or flags; stylised non-replica money with a legal sign-off gate; no religious imagery in generic scenes | router bans, I5 |
| stereotype and colourism | cast spec + I4 skin check + G-VI-7 audit + rotating names and roles across gender, region and religion | Forge review |
| child data | ids + facts only in the ledger; no child audio stored (batched ASR held in memory for one pass); no `displayName` in T2/T3; DPDP identifier minimisation and retention fields in the event schema from day one | observer, bridge |
| rights | `TextUnit.rights` required; `ncert-pending` never ships; licensed photos store their licence; C2PA kept | loaders |

---

## 9. v1 build order

Estimates are engineer-days for one engineer who knows the repo, excluding art and review labour, taken from the sibling reviews [U]. Nothing here was benchmarked on a device. **Every wave starts with the device measurement that could invalidate it.**

### Week 0: spikes that can overturn the plan (3–5 d, in parallel)

1. Reference-phone device lab (a ₹8–10k, 3 GB phone, plus a Helio G35-class one):
   - mount time for a kit engine in the frame (V15, decides A2);
   - Devanagari font loading in the opaque frame from the Capacitor origin;
   - frame time for an SVG scene, a canvas sim and HTML-layer explainer actors (A2, A3, animation E.8.1);
   - Web Audio decode and scheduling drift (M-SONG-4).
2. Transport check: does the app's realtime path expose `output_audio_buffer.started` and `stopped` for the talk gate and the playback clock (E-TV-1)?
3. Rive canvas-lite capability spike (C-17).
4. Re-run `genui-azure-limits-probe.mjs` and `genui-bench.mjs` against scene@1.1.

### Wave 0: contracts and kit (≈ 40–50 d; nothing else merges before it)

| item | days | source |
|---|---|---|
| P0 isolation fixes (CSP header, Permissions-Policy, RTC deletion, caps, serve-through e2e, `classify.js` host-grading, `fraction-bars` axe) | 2 | sandbox §8 |
| `shared/bridge.ts` v2.1 + hand-written parsers + v1 compatibility + `module-gate@1` | 3 | §4 |
| `shared/engine-manifest.ts` + manifest generator (paramsJsonSchema from zod) + `grade/lint/solve/resolveParams` interfaces | 2 | §2.1 |
| `observer@1` (ledger, coalescing, detectors, lanes) + `grader@1` | 3 | §5 |
| talk gate wired to the realtime session | 3 | §5.4 |
| `engine-kit` (§2.5: pointer, tween, scheduler, rationals, CAS-lite, EXPR@1, RNG, state/hash, fading, text and fonts, detector runtime, `renderStatic`) | 15–20 | maths R.5, science R0 |
| harness V1–V12 in CI (Playwright, WebView-like, 6×) | 3 | §8.1 |
| `scene@1` frame runtime core (SVG renderer, drag/zone controller, layout, timeline, compiled EXPR, telemetry, metrics) | 12–18 | genui E5 |

### Wave 1: the first engines and the generative layer (≈ 35 d)

- **Engines:** `number-line@1` (5), `fractions@1` core (5), `place-value@1` core (4), `collections@1` (4), `multiply-divide@1` core (4).
- **T2a:** the 6 coded templates brought to production, plus **`label-diagram@1`** (5 + a review tool of 4–5) and `match-pairs@1` and `worked-steps@1`.
- **Exit gate:**
  - M1: spec-fill validity ≥ 98% in strict mode;
  - V10 passes on the reference phone for all five engines;
  - detector precision harness green.

### Wave 2: the stage, maths completion and live media (≈ 70 d)

- **Engines:** `data-graphs@1` core (4), `patterns@1` core + grid (6), `geoboard@1` v1 (3), `measure@1` maths core (4), `column-ops` (3).
- **Teacher stage:** `teacher-stage@1` (3–4), `cue-scheduler@1` + replay harness (2–3), digits-only `say-matcher@1` (1), `board@1` + MathLite (5), `pointer-overlay@1` with C-13 validation (2–3), `face-sprite2d@1` (4–5).
- **Explainer:** the player (4–5) + `combine-count`, `number-line-hop`, `process-steps` and `cycle` (4).
- **Diagrams:** `flow@1` (3), `formula@1` (2), `concept-map@1` tree-down (2.5), `contrast-pair@1` (2–3), and the `svg-figure@1` and `illustration@1` runtimes (2).
- **Drill:** `quick-item@1` (2).
- **Exit gates:**
  - G-UT-8: whole stage + module p95 ≤ 33 ms on device;
  - the scheduler reproduces the §5.2 figures in CI;
  - M-TV-2 field skip rate ≤ 15%.

### Wave 3: science v1 and chant (≈ 75 d)

- **Science engines:** `sky@1` 2D (15–20), `water-cycle@1` (12–15, plus art), `motion-lab@1` slice (kinematics/graphs, forces/friction, pendulum; 20–25), `poe-harness@1` (8–10), `measure@1` science scenes (5).
- **Chant:** `chant-track@1` v1a + `pahada@1` + Forge chant render + review tool (8–9).
- **Explainer templates:** `split-share`, `path-trace`, `sun-shadow`, `moon-phase` (5).
- **Forge visual pipeline:** raster + anchors + review tool + queue (8–10), `svg-figure` assertion harness (5).
- **Exit gates:**
  - science detector κ ≥ 0.6 against 2 teachers on 40 POE sessions per engine;
  - live POE `show_module` → interactive ≤ 3 s;
  - the M-SONG-1 ear check done.

**At this point v1 is complete:** 12 engines, T2a with 9 templates, 7 diagram engines, 8 explainer templates, chant v1a, and the teacher stage. That is **≈ 220–270 engineer-days ≈ 11–13 engineer-months, about 12–14 calendar weeks for a team of 5** [U].

### Wave 4 (v1.1) — ordered by topics gained per day

1. `balance@1` (4; Class 1 equal sign);
2. `shape-lab@1` + symmetry (12; +19 topics);
3. `tape-diagram@1` (5; +10, the translate engine);
4. `clock-calendar@1` (5; +10);
5. `coord-grid@1` (5; +10);
6. `angles@1` (5; +11);
7. `geo-construct@1` presets (5–6; +17);
8. `circuits@1` (15; +9);
9. `particles@1` + heat (15–20; +8);
10. `ecosystem@1` (12; +8);
11. `indicator-lab@1` (12; +7);
12. `mixtures-lab@1` (12; +9);
13. `optics@1` (15; +7);
14. `integers@1` (4);
15. `money@1` (4 + art + legal);
16. `investigation-harness@1`, `case-file@1`, `LockPanel`;
17. the first three wrappers, `personal-best`, `tug-of-war` and `detective`, each against a no-wrapper arm (G-E1);
18. chant v1b (after M-SONG-3);
19. the remaining explainer templates.

### Language track (parallel team, lang-v1)

1. `tile-kit` and `card-kit` first;
2. `story-sequence@1` and `compare-venn@1`;
3. `rhythm-poem@1` on `chant-track`;
4. `read-along@1`, with the host speech window and the M-L1 Azure PA calibration on Indian children;
5. `sentence-lab@1`, `phonics@1` and `word-builder@1`, once the skills layer exists in the curriculum data;
6. `role-play@1` (8 d of Director plumbing);
7. `map-explorer@1`, **blocked on Survey of India boundary data procurement**;
8. `timeline@1`.

The estimate is 23–28 engineer-weeks (language review).

### Later (v2 / P2)

`algebra-tiles`, `solids` (iso2d), `symbol-lab`, `magnets`, `plant-lab`, `sound`, `float-sink`, `body-systems` (art-blocked), `word-chain`, the `data-graphs` experiment mode, T2b near-line generation into the library, T3 Forge promotion, the Manim lane (A6), Sora B-roll (A5), video face, and songs.

### Measurements that gate decisions (consolidated)

| id | what | bar | decides |
|---|---|---|---|
| V15 / M9 | engine mount on the reference phone | ≤ 1.5 s warm | A2 (frame vs in-process) |
| M8 / A2 / G-UT-8 | p95 frame per engine, explainer and stage | ≤ 33 ms | A3; tier fallbacks |
| M1 | strict-mode spec-fill validity per engine | ≥ 98% first try | `llmParams` width |
| M2 | auto-fade thresholds A/B on delayed transfer | — | 3 / 2 defaults |
| M3 | detector PPV vs teachers | ≥ 0.4 (else demote to weak); κ ≥ 0.6 for science | detector strength |
| A1 | template explainer vs static diagram + voice, delayed retrieval | a gain per template | template stays or becomes static |
| M-TV-1 | timed board writes vs `turn_start` writes | ≥ 0.1 SD delayed recall | the scheduler's value |
| M-SONG-5 | chant arc vs spoken repetition, day-7 shuffled retrieval | chant ≥ spoken | chant in the default arc |
| G-E1 | each wrapper vs the no-wrapper arm | better on delayed success, or equal and better on continuation | a wrapper ships widely |
| M-L1 | Azure PA vs human raters on Indian children | agreement before evidence | read-along scoring weight |
| M-DI-3 | labelled rasters, n ≥ 40 per language, 2 raters | ≥ 99% spelling and leaders, κ ≥ 0.8 | reversal of the no-baked-labels rule |

---

## Sources

All primary evidence sits in the sibling documents, cited by section above. Each one carries its own source list and evidence tags:
- `maths-engines.md` (Fyfe 2015; Carbonneau 2013; Petersen & McNeil 2013; Hamdan & Gunderson 2017; Barner 2016/2018; Otten 2019; Decker-Woodrow 2023; Unal 2024; NCERT Ganita Prakash);
- `science-engines.md` (PhET licensing and model notes; Hardy 2006; the CVS meta-analysis g = 0.61; Schwichow 2024);
- `language-sst-engines.md` (Azure Pronunciation Assessment; DST 2021; Carpenter & Pashler 2007; Barton & Levstik 1996; Graham & Perin 2007; Ehri 2001; Nag 2007; Gordon 2015);
- `game-mechanics.md` (Clark 2016; Wouters 2013; Andersen 2011; Lomas 2013; McLaren 2015; Banerjee 2025);
- `genui-reliability.md` (Google Generative UI; the education interactives work 2609.20738; Learn Your Way; IWR-Bench; ALGOGEN; constrained-decoding papers; measured Azure limits);
- `sandbox-telemetry.md` (probe P1–P17; chromium.org on WebView site isolation; Capacitor source; Content Safety language support);
- `diagrams-images.md` (renderer, SVG and image probes; MMMG; SVGEval; Autoregressive Mosaics; DiagrammerGPT);
- `animation-video.md` (the Sora probe; Code2Video; MoVer; PhysicsLENS; Höffler & Leutner 2007; Mayer & Chandler 2001; Guo 2014; GSAP and Remotion licences);
- `songs-rhymes-audio.md` (chant probes; Wallace 1994; Kilgour 2000; Good 2015; Calvert & Tart 1993; the Web Audio scheduling guide);
- `teacher-visual.md` (the sync probe; Porte 2026; Rive runtime docs; the Duolingo Lily case study).

Level-above inputs: `tech-and-market.md` §3–4 and `learning-science.md` §2.4, §6 and §8.4. Coverage was computed here by `content-engine-coverage.py` from `maths-engine-map.json` and `science-engine-map.json` (2026-10-02).
