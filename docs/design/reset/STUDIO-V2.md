# STUDIO V2: the quality bar for games and animation, and how Taxila generates them without visible failure

**Date:** 2026-10-04 · **Status:** spec + three built exemplars (prototypes only; no product code touched) ·
**Binding inputs:** `docs/design/OWNER-RESET-2026-10-04.md` (cited **R1-R16**; this file answers R3, R4, R9, R12, R14,
R15), `docs/design/reset/DESIGN-V3.md` (visual language, motion system, stage contract §6), `docs/design/superhuman/LIVE-STUDIO.md`
(live code builds, gate G0-G10), `context/rejected.md`, `docs/research/content/game-mechanics.md`,
`docs/research/factory/{game-kit-frameworks,llm-game-generation}.md`, `docs/research/world-best/generated-learning-content.md`.
Child-safety floor above everything.

**Exemplars (open in a browser, no build step, no network):** `prototypes/reset/studio/index.html` →
1. `01-landfall/` real-time fractions game (maths, class 5-6),
2. `02-circuit-lab/` circuit simulation on a real nodal solver (science, class 7),
3. `03-moon-phases/` cinematic narrated explainer with an interactive ending (science, class 4 and 7).

Recordings (Playwright video, 1280×800): `prototypes/reset/studio/recordings/{landfall,circuit,moon}.webm`, plus
`moon-narrated.mp4` with the narration laid back in at the exact moments the page started each clip.

**Tags.** **[V]** read in a primary source this session. **[S]** secondary. **[M]** measured this session (method
and n in §14). **[T]** read in Taxila's own code, docs or `context/`. **[U]** design inference, not yet measured.

**What this supersedes.** (1) LIVE-STUDIO §3.3's archetype list as the quality bar: its archetypes ("shade the
fraction", "sort into bins", "match pairs") are the quiz-in-costume the owner rejected (R3). LIVE-STUDIO's machinery
stays for the rare piece no engine covers (§4.3). (2) LIVE-STUDIO §4.2's visible "being made" caption. DESIGN-V3 §6.9
already superseded it, and this spec keeps that. (3) For the 9-15 band, `game-mechanics.md` rule 4 (no points of any
kind) and rule 6 (stopwatch-only time pressure) are amended in narrow, reversible ways (§12, D-S2, D-S3).

---

## 0. The answer on one page

1. **Why the old output was cheap.** The live path asked a model for a whole game or animation as code in 20-45 s
   [T: LIVE-STUDIO §14]. That window has room for correctness or for craft, never both. Game feel is not code a model
   can write in one pass: squash and stretch, hit-stop, a springy dock, a camera that eases, a terminator drawn as an
   exact ellipse, charge that moves at a speed proportional to the solved current. Each is days of tuning, and the
   2026 benchmarks agree. The best agent builds 41.5% of real-engine game tasks (GameCraft-Bench, 2026-06 [V]). The
   best model renders 66.7% of Manim tasks, with pedagogical coverage 0.18 (ManiBench, 2026-03 [V]). Taxila's own free
   scenes were lint-clean 0/8 and 3/8 [T: `live-free-generation`].
2. **The fix is a split.** Craft and truth live in **archetype engines**: hand-built once, reviewed, versioned and
   tested like product code. The model writes a **spec**, a small JSON document (1.2-3.4 KB in the exemplars [M]). The
   spec says which items, in what order, paired how, at what pace, with which goals, which narration and cues, and in
   which words. The engine validates every field, recomputes every truth from the kit, repairs what it can and
   replaces what it cannot. A bad spec makes a plainer piece, never a broken one. Brilliant reached the same answer
   from the other side: "the breakthrough didn't come from upgrading to r1 or o3; it came from making the
   representations in our game engine more LLM-friendly" [V: Brilliant blog].
3. **The bar is testable.** §1 lists 10 checks for games and 10 for animations. Every exemplar was built to pass them.
   §14 has the measurements.
4. **The catalogue.** §6 has 36 game and simulation archetypes and 27 animation archetypes, mapped to NCERT classes
   4-7 maths and science by curriculum id (`data/curriculum/*.json`) and, where the kit has one, by misconception id.
   Three are built: `catch-on-line@1`, `circuit-bench@1` and `orbital-explainer@1`.
5. **Frequency (R14).** A spec costs one small structured call. The plan-shaped call measured 3.25 s p50, 8/8
   schema-valid [T: LIVE-STUDIO §14.6], and well under a tenth of a cent. Frequency is therefore bound by pedagogy,
   not money or latency. §7 sets the policy: a visual in every teaching turn, a Studio piece at every beat that calls
   for one, and anything the child asks for at the next turn boundary. "Harder", "slower" and "again" are instant knob
   changes on the running engine.
6. **Zero visible failure (R9).** There is a five-rung ladder inside the frame: repaired spec, then the archetype's
   kit-seeded default spec, then the board version of the same idea. The engine loop traps errors and freezes on the
   last good frame. There is no caption, no spinner and no error card. In fuzzing, 87 mutated specs across the three
   exemplars produced 0 visible failures (§14, M5).
7. **Latency.** Engines are precached with the shell. A spec fits inside the teacher's spoken lead-in, and the first
   frame paints in under 300 ms after the spec arrives [M: §14]. The rare live code build (LIVE-STUDIO) keeps its 90 s
   lead-time rule.
8. **Engine choice per archetype.** Vector and diagram archetypes (number lines, circuits, orbits) run on a small
   Canvas 2D studio core: about 8 KB gz, crisp text and exact geometry. Sprite and physics arcade archetypes run on
   Phaser 4 through `tgk@1` (decided in `game-kit-frameworks.md`). three.js is loaded lazily for the few 3D archetypes.
   Rive is for hand-authored character assets in the shell, never inside a Studio frame. Manim and Motion Canvas are
   for offline library video only. The model never picks a runtime.

---

## 1. The quality bar (each item is a check, not a wish)

### 1.1 Games and simulations

| id | the bar | how it is checked | exemplar evidence |
|---|---|---|---|
| QB-G1 | **The learning act is the game act.** Strip the wrapper and the child still does the same maths or science act. No game state changes without one. | `game-mechanics.md` §3.4 remove-the-game / remove-the-learning tests on the spec + engine | Landfall: placing the dock *is* the magnitude estimate. Circuit Lab: building the loop *is* the circuit. |
| QB-G2 | **Real time.** The world moves without the child, and at least one decision is made under time or physics. | engine review; state changes per frame without input | pods fall and can overlap; charge flows; filament warms |
| QB-G3 | **Feedback within 100 ms of every act, and it shows the truth**, not just right or wrong. | frame trace: input → first visual change | the miss shows where the value really lives, the gap, and "off by ~1/8" |
| QB-G4 | **Juice at medium-high, on the learning act only.** Squash and stretch, particles, hit-stop ≤ 80 ms, shake ≤ 6 units, rising pitch on chains. A reduced-motion variant keeps the game playable. | engine checklist; `?motion=reduce` run | Kao 2020 (n = 3,018): medium and high juiciness beat none and extreme on enjoyment, play time and performance [S] |
| QB-G5 | **Difficulty adapts within the run** (speed, tolerance, scaffold marks) and between runs (learner model). | adapt events in the log | Landfall `adapt` events: easier after 2 misses (eighths marks appear in ion), harder after a chain of 4 |
| QB-G6 | **The score measures mastery, not currency.** Precision (100 − mean PAE), landed/total and chain, inside the run only. No coins, XP, persisted points or leaderboards against other children. | spec + engine review | §12 D-S2 |
| QB-G7 | **Waves escalate and include a twist that targets a named misconception.** | spec lint: each wave names its target (kit id) | wave 3 "Same spot?" (`m-bigger-numbers-bigger`); wave 4 "Past one" (`m-less-than-one`, `m-mixed-wrong`) |
| QB-G8 | **Runs are short (45-120 s) and want a second go.** | session log; owner and child playtest (Fun Toolkit "again-again") [U] | the Landfall run is about 90 s |
| QB-G9 | **60 fps target on a mid phone**, with an adaptive-resolution floor so it never stutters into unplayability. | rAF trace under CDP CPU throttle on the 915×412 @ 2.625 profile (§14 M3) | engine drops resolution 2 → 1.5 → 1.25 → 1 when the median frame is slower than 52 fps |
| QB-G10 | **Every act is evidence**: an estimate plus the truth, graded by the host and never by the frame. | `Studio.answer` rows carry estimate, PAE and verdict | 21 `answer` rows per Landfall run; 5 step answers and 4 observations per Circuit Lab run |

### 1.2 Animations and explainers

| id | the bar | how it is checked | exemplar evidence |
|---|---|---|---|
| QB-A1 | **One idea per piece, built against a named misconception.** | spec names a kit misconception id | `c4-evs-ch10-t02-m2` / `c7-science-ch12-t03-m2`: "phases are Earth's shadow" |
| QB-A2 | **Narration-locked.** Clause-level cues with a 400 ms pre-roll, anchored to *measured* audio durations. Captions are phrase-level and never word-lit. | compile log: cue time = line start + clause offset − 0.4 s | 21 lines synthesized once; durations and pauses measured with ffprobe + silencedetect (§14 M6) |
| QB-A3 | **Every picture is computed.** Positions, lit halves, terminators, flows and shadows come from engine geometry. A cue can be late; the picture cannot be wrong. | G6-style probes: every disc pixel vs the exact projected-hemisphere mask; waxing lit on the right (northern sky) | §14 M7: 0 disagreeing pixels over 49 phase angles |
| QB-A4 | **Cinematic grammar.** Establishing shot → focus → reveal → payoff, with camera moves eased in and out, at most 3 moving things at once, and stable colour coding. | storyboard lint (beats per shot, concurrent motions) | sky cold open → camera pull-out to space → split view → misconception kill → hands-on |
| QB-A5 | **Two linked representations.** The cause view and the effect view are driven by one variable. | both views read the same angle | top view ↔ "from Earth" window, both from `moon.theta` |
| QB-A6 | **The wrong idea is shown failing**, not just denied. | spec has a contrast beat | Earth's shadow cuts the sunlight and points away; the first-quarter Moon is far from it and still half dark |
| QB-A7 | **It ends interactive where that helps, with a question graded by code.** | `answer` rows | drag the Moon: a morning half moon gets a "look again"; the evening half and the full moon get a tick |
| QB-A8 | **Deterministic and scrubbable**: state = f(t), so "show again", "slower" and seek are exact. | seek to any t gives the same frame | `?t=` and ←/→ seeking; the screenshot sheets were taken by seeking |
| QB-A9 | **Stage contract.** Labels ≥ 38 units, safe zones clear, nothing overflows at any size. | engine records every label under the minimum (`TaxStudio.tooSmall`) | 0 undersized labels across all three runs [M] |
| QB-A10 | **Pace.** 45-120 s, with pauses after reveals and a narration rate a 10-year-old can follow. | timeline length; words per minute of speech (≤ 150 for class 4) | 94 s timeline; narration measured at **166 wpm, over the bar** (§14 M6): the fix is a slower pace instruction on the TTS call, not yet re-synthesized |

---

## 2. What the best do, and what Taxila takes (research)

| product / body of work | what it actually does | what to take | what to avoid | tag |
|---|---|---|---|---|
| **Brilliant** | Interactive-first lessons. Rive state machines for progress and celebration UI. AI generates puzzle implementations and practice variants while humans own "the learning objective, the progression, and the aha moment", because "AI can't meet the bar for level design". Representations were made LLM-friendly. | Engine + LLM-friendly spec. Humans design archetypes and level grammar; models fill them. Variation from the same objective. | Streaks and "day streak" celebrations (DESIGN-V3 bans them for 9-15). | [V] blog.brilliant.org/hand-crafted-machine-made; rive.app/blog/how-brilliant-org… |
| **PhET** | 10 years, 125 designs, 600 student interviews. **Implicit scaffolding**: affordances and constraints cue productive exploration without instructions. Less worksheet guidance produced more engagement. Realistic-but-simplified visuals, multiple linked representations. | Tools appear when the step needs them (Circuit Lab's tray changes per step). One affordance per idea. Linked views. No instruction text beyond the goal line. | Open sandbox with no goal for a 10-year-old in a voice lesson. The teacher frames, the sim constrains. | [V] arXiv 1306.6544 |
| **DragonBox** | Algebra rules introduced as card-and-monster mechanics, then symbols fade in. | Concreteness fading inside an engine (cards → symbols). | Assuming in-game success transfers: DragonBox players gained no paper-equation skill in a 3.5 h study [T: `in-game-success-as-mastery`]. Studio evidence is weighted ×0.75 and paired with transfer probes. | [S]+[T] |
| **Prodigy** | Fantasy RPG where combat moves are gated by quiz questions; heavy membership upsell ("16 ads… 4 math problems" in 19 min). | Nothing from the core loop. The maths sits *outside* the fun (quiz-gate). | The quiz-gate pattern is banned (`game-kit-frameworks` §0.10), and so are pets, loot and upsell. | [S] Fairplay / NBC |
| **Kahoot** | Points = ⌊(1 − (t/T)/2) × 1000⌉ for a correct answer. Speed matters, but a slow correct answer still earns ≥ 50%. Class-wide competition. | Speed as a *bonus on correctness*, never a gate. The ≥ 50% floor idea maps onto Landfall's wide catch zone + precision score. | Child vs child leaderboards: Clark 2016 found single-player competitive games g = −0.06 vs non-competitive 0.45 [T: game-mechanics]. | [V] support.kahoot.com |
| **3Blue1Brown / Manim** | Programmatic animation where everything is computed. Continuous transformations between representations. Patient pacing; the "aha" is shown, not told. | State = f(t). Morphs between representations. Every quantity computed. | Live Manim: renders take minutes and LLM Manim fails often (ManiBench 66.7% render; ManimAgent 19-31 min/task) [V]. Manim stays an offline library lane. | [V] |
| **Kurzgesagt** | About 1,200 hours per video, around 200 unique illustrations per 10 minutes, 2-3 animators for 8-10 weeks, rigged characters. | The grammar, not the hours: flat-but-deep vector look, establishing shots, consistent colour semantics, warm narration. | Pretending a model can produce this per request. It cannot. The engine's primitives carry the look, and the spec only directs. | [S] |
| **Motion Canvas** | TypeScript generators as the timeline. Voice-over sync exists, but cut points are hand-written. | Generator-style "the code is the timeline" thinking. Taxila's engine compiles cues to time from measured audio, which is the step Motion Canvas leaves manual. | Shipping its editor or runtime in the child frame (unneeded weight). | [V] motioncanvas.io, GitHub |
| **Theatre.js** | Keyframe editor for web motion. Core is Apache-2.0; Studio is AGPL-3.0 (dev-time only); 1.0 is in private development; npm 0.7.2 is 2 years old. | Offline hand-authoring of camera paths for library pieces, if ever needed (core only). | Studio in any shipped bundle (AGPL). Betting live generation on a paused public release. | [V] GitHub / npm |
| **Rive** | Editor-authored vector animation with state machines. Runtimes are MIT. `@rive-app/webgl2` ships about 925 KB gz WASM plus glue. | Hand-authored character and UI assets (teacher reactions, the shell's micro-interactions). State-machine inputs set by code. | Generated content (`.riv` files are editor-authored, so a model cannot write them). Loading a 1 MB runtime inside a Studio frame. | [V] rive.app docs, npm |
| **Game feel literature** | Swink, *Game Feel* (2008): real-time control, simulated space, polish. Jonasson & Purho, "Juice it or lose it" (2012). Kao 2020 goldilocks result. CHI 2024 on juicy feedback and competence/effectance. | QB-G4's list, applied to the learning act. | Decorative juice with no learning meaning (DESIGN-V3 §4: motion means something happened). | [S] |
| **Number-line learning science** | Number-line estimation (PAE) is the standard fraction-magnitude measure (Siegler & Booth 2004). Fraction magnitude knowledge predicts later maths. A number-line game trained the trained task but did not transfer widely (Nuraydin et al. 2022, n = 188). | Landfall logs PAE as evidence and mixes line ranges (0-1, 0-2) and equivalents to push transfer. | Treating game precision as mastery: transfer probes stay in the lesson. | [T: rejected.md] [S] |

---

## 3. Web technology per need

| need | choice | why (evidence) | rejected / caveats |
|---|---|---|---|
| Vector and diagram archetypes (number lines, circuits, orbits, charts, geometry) | **Taxila studio core**: Canvas 2D + `lib/stage.js` (fit, DPR, adaptive resolution, loop, tweens, pooled particles, shake, hit-stop, glow sprites, synth sound, HUD, Studio bridge, seam). **~8 KB gz** [M]. | Exact geometry and crisp text at any size. No framework weight. Runs from `file://`. Every exemplar holds QB-A9 with 0 undersized labels [M]. | SVG for gate-heavy static diagrams (LIVE-STUDIO §3.13 keeps SVG/DOM where the gate must read structure). Canvas engines expose structure through the seam instead (§10). |
| Sprite, arcade and physics games (runner, platformer, sling, boat) | **Phaser 4** (`phaser@4.2.1`, MIT) through the `tgk@1` facade; Phaser 3.90 as a flag. | Already decided with measurements: 8/8 builder familiarity, first frame 840 ms at 6× throttle on the ESM path, Arcade + Matter physics, scenes, audio [T: game-kit-frameworks §0]. | PixiJS v8 is a renderer without scenes, physics, audio or tweens. KAPLAY: no stable release since 2025-06, 28.6 fps on the 200-sprite bench. Excalibur: pre-1.0, 3/8 builder probe [T]. |
| 2D physics | **Matter.js** (inside Phaser) for sandbox puzzles. **Planck.js** (45.9 kB gz) as the reversal. **Rapier** only offline, where WASM determinism matters. | The law judges and the physics animates: correctness is computed by kit maths, never read back from a float simulation [T: game-kit-frameworks §0.4]. Circuit Lab follows the same rule: the solver is exact nodal analysis, not a particle sim. | Rapier `-compat` is 1.29 MB gz [T]. |
| 3D (views of solids, seasons, the solar system in perspective) | **three.js r186**, lazily loaded, only where the objective is 3D. | Largest corpus; minimal bundle 133 kB gz; 421 ms boot [T]. | Babylon is about 2× the size with a smaller corpus. |
| Timelines and explanatory motion | **In-house deterministic timeline** (`moon.js` compile: cues → tracks, value = f(t)). | Scrubbable, testable, narration-locked; about 60 lines. | **GSAP**: 100% free since 2025-04-30, including former Club plugins, under Webflow's standard no-charge licence [V]. It is allowed in hand-built engines, but the Studio frame does not need it. |
| Narration sync | Measured clause timing: TTS per line, then `ffprobe` duration + `silencedetect` pauses. Cues at clause starts with 400 ms pre-roll; phrase captions. | `teacher-stage-cue-scheduler` [T]; `karaoke-from-transcript-estimate` rejected word-lit captions [T]. | Motion Canvas's manual cut points. |
| Character and UI motion assets | **Rive** (MIT runtime) for hand-authored teacher reactions and shell micro-interactions. | State machines driven by code inputs; one file across platforms [V]. | Not inside Studio frames (1 MB WASM). Not generated. |
| Offline explainer video for the library | **Manim** (Community) and/or Motion Canvas rendered by the Forge offline, then reviewed. | Programmatic and exact; the cost is minutes per clip, which is acceptable offline. | Never live (ManiBench, ManimAgent numbers above) [V]. |
| Sound | Synthesized WebAudio (`stage.js sfx`). ZzFX-style presets for arcade engines. | 0 bytes of assets; pitch rises with chain; muted under narration. | Howler (duplicates the runtime; last release 2023) [T]. |

**Engine rule learned while building:** never put `backdrop-filter` over a live canvas. On software and low-end
compositing it re-blurs every frame. The exemplars' HUD, captions and task pill use solid translucent fills (§14 M3).

---

## 4. What 2024-2026 research says about LLM-generated games and animation

| result | number | what it means for Taxila | tag |
|---|---|---|---|
| GameCraft-Bench (140 Godot tasks, 15 families, 2026-06) | best agent **41.46%**, most < 40%; failures were incomplete games, thin content, non-working feedback and poor presentation even when the mechanic was recognisable | whole-game generation is not a live path | [V] arXiv 2606.17861 |
| PlaytestArena / Play2Code (200 browser games, 2026-05) | single pass 29.7%; play-test loop **66.8%** | iterative playing helps but takes minutes, which suits offline Forge only | [V] arXiv 2605.28258 |
| WebGameBench | 76.9% "usable", **20.2% "excellent"** | quality, not just function, is where models fall short | [T: llm-game-generation §0] |
| GameASG-Bench | mean check pass 93.2% vs **55.3%** strict all-checks | report strict pass rates only | [T: `rj-mean-check-pass-as-quality`] |
| InteractScience | best model passes every test on **13.29%**; widgets "work" while violating the science | science truth must be engine code | [T] |
| ManiBench (Manim CE, 2026-03) | best model renders **66.7%**; pedagogical-element coverage **0.18** | even rendering code is unreliable, and teaching content less so | [V] arXiv 2603.13251 |
| Code2Video / ManimAgent / SGA / OmniManim (2025-26) | agentic Manim +40% TeachQuiz; SGA geometric verification raises the layout score 16.1%, humans prefer it 84.4%; visual layout priors improve render quality | layout and geometry need solvers and verifiers, and these pipelines take minutes | [V] arXiv 2510.01174, 2606.30296, 2607.18116, 2605.15585 |
| Brilliant (2025) | "making the representations in our game engine more LLM-friendly" was the breakthrough; humans own level design | the spec-over-engine split | [V] |
| Taxila, live free generation (2026-10-02) | free scenes lint-clean 0/8 and 3/8; 11.9-18.2 s p50 per call | free composition is out of the live path | [T] |
| Taxila, LIVE-STUDIO probe (2026-10-04) | raced code builds 3/3 at 36.7-54.2 s p50, $0.13-0.23 per raced build; needs ≥ 90 s lead; the gate caught flows drawn backwards 13 times | the live code path works only with lookahead and a gate | [T] |
| Taxila, plan-shaped structured call | 3.25 s p50, 8/8 schema-valid (`taxila-fast`, effort none) | specs are cheap and fast; validity is enforced by schema plus engine repair | [T: LIVE-STUDIO §14.6] |

**The four generation tiers that follow:**

| tier | what the model writes | latency | validity | used when |
|---|---|---|---|---|
| **T-spec (default)** | a JSON spec for a built archetype engine | 1-4 s [U: 3.25 s p50 measured for a similar schema] | 100% renders after engine repair (fuzz §14 M5); pedagogical quality varies and is measured | every Studio piece the catalogue covers: the frequent path |
| **T-hook** | small typed expressions inside a spec (an item generator rule, a scoring curve, a predicate's parameter), evaluated by the engine's own expression evaluator; no JS | same | bounded by the evaluator; out-of-range → clamp | variety without new code |
| **T-build** | a whole single-file piece against `studio-kit@1` (LIVE-STUDIO) | 37-54 s p50 raced + gate | strict gate G0-G10 | a need no engine covers; opportunistic, ≤ 3 per lesson |
| **T-forge** | a new archetype engine | hours, offline, human review | product-grade tests | the catalogue grows from `studio_gap` demand rows |

---

## 5. What the model generates vs what the engine provides

| concern | engine (hand-built, reviewed, versioned) | model (per child, per moment) |
|---|---|---|
| truth | exact rationals; nodal solver; orbital geometry and terminator; kit keys; host grading | which kit items, from the admissible set only |
| feel | dock spring, juice, hit-stop, particles, sound, camera easing, filament warm-up | none |
| pedagogy grammar | wave and step structure, scaffold mechanics (tick marks, tray affordances), misconception twists *as mechanisms* | which twist, which order, which pairing (e.g. 3/4 with 6/8), how many items, pacing within clamps |
| goals | a closed list of predicates (`bulbLit`, `meters`, `switchCycle`, `tested`, `brightness`; `same_spot`; drag-target checks) | which predicate ends each step, and its parameters |
| words | min sizes, layout, safe zones, the fallback strings table | the strings table in the child's language and register (Q8-checked), narration lines (teacher content), goal lines |
| time | clock, cue compiler (pre-roll), measured audio durations, captions | which narration line, which verbs at which clause |
| adaptivity | the DDA machinery (speed, tolerance, scaffolds) and its bounds | starting difficulty from the learner model, within clamps |
| failure | validation, repair, defaults, watchdog, board fallback | none (a model is never in the recovery path) |
| evidence | `Studio.answer` / `Studio.event` rows with estimate, truth and PAE | the telegraphic facts the teacher sees |

**The spec contract (`studio-spec@2`).** The envelope is `{archetype, skills[], lang, strings{}, …archetype body}`.
The archetype body is described by a JSON schema per archetype, and the engine validates semantics beyond the schema:

- **Landfall** checks: fractions parse; denominator ≤ 12; value strictly inside the line; "equal" groups really are
  equal by cross-multiplication; line range ≤ 3; speed and gap clamped; strings ≤ 48 characters with no markup.
- **Circuit Lab** checks: edges must be adjacent grid nodes; components come from the closed set; a cell's `plus` must
  be one of its edge's nodes; predicates come from the closed list; strings ≤ 70-80 characters.
- **Moon** checks: verbs come from the closed list (`show`, `hide`, `set`, `camera`, `orbit`, `skyPhase`, `ghosts`,
  `strip`, `eclipse`, `interactive`); props and targets exist; angles are finite; clause anchors (`sN`, `end`, seconds)
  resolve against measured narration.

Invalid fields are dropped or clamped and recorded in a `spec_repaired` event. If nothing usable is left, the
archetype's kit-seeded default spec plays instead. The model never sees physics constants and never writes a check.

---

## 6. Archetype catalogue (classes 4-7, maths and science)

Curriculum ids are from `data/curriculum/*.json`; misconception ids are from `data/kits/*.json`. Engine: **C** =
Canvas studio core, **P** = Phaser 4 via `tgk@1`, **3** = three.js. "Spec" is what the model writes. Built: ★.

### 6.1 Games and simulations (36)

| # | archetype | the learning act = the game act (real-time element) | topics | misconceptions targeted | engine | spec |
|---|---|---|---|---|---|---|
| 1 ★ | `catch-on-line@1` **Landfall** | steer a dock to where a number lives before the pod lands (falling pods, overlap, precision) | c5-maths-ch02-t01, c6-maths-ch07-t02/t03/t04, c7-maths-ch03-t03, c6-maths-ch10-t02, c4-maths-ch04-t03 | c6-maths-ch07-t03 m-bigger-numbers-bigger; c6-maths-ch07-t02 m-less-than-one, m-mixed-wrong, m-count-marks | C | waves: line, marks, items, pairs, speed, gap |
| 2 | `line-runner@1` **Gate Runner** | jump at the moment the runner passes the called value (timing = position) | c5-maths-ch02-t02, c7-maths-ch03-t03, c4-maths-ch04-t02 | m-bigger-numbers-bigger | P | calls, speed curve, line range |
| 3 | `slice-at@1` **Fraction Slice** | swipe-cut a tossed bar or roti at the asked fraction (physics toss, cut precision) | c4-maths-ch05-t01, c6-maths-ch07-t01, c5-maths-ch02-t03 | equal-parts errors | P (Matter) | targets, toss pattern |
| 4 | `pour-to@1` **Pour** | stop the tap when the jug reaches a target (fluid fill under time) | c4-maths-ch08-t02, c5-maths-ch08-t02, c7-maths-ch03-t01 | ml↔l conversion | C | vessels, targets, flow rates |
| 5 | `balance-beam@1` **Tilt** | place weights to balance a beam (torque physics); equations as balance | c7-maths-ch15-t02, c7-maths-ch04-t01, c4-maths-ch08-t01 | "do the same to both sides" | P (Matter) | equations, weight sets |
| 6 | `zero-pair@1` **Zero Pair Blaster** | fire + and − tokens; pairs annihilate; land exactly on the target | c6-maths-ch10-t03, c7-maths-ch10-t01 | subtracting a negative | C | targets, token budgets |
| 7 | `angle-cannon@1` **Trajectory** | set the cannon's turn to hit targets (angle as turn, estimation) | c5-maths-ch03-t01/t02, c6-maths-ch02-t03/t04 | angle size vs arm length | P | target angles, wind |
| 8 | `mirror-route@1` **Bounce** | rotate mirrors to route a laser (reflection; corresponding and alternate angles) | c7-science-ch11-t03, c7-maths-ch05-t03 | angle of incidence | C | grid, mirrors, goal |
| 9 | `area-claim@1` **Plot** | drag out exactly N square units before the timer (same area, different shapes) | c5-maths-ch11-t01/t03, c6-maths-ch06-t02 | area vs perimeter confusion | C | targets, grid size |
| 10 | `fence@1` **Fence** | spend a fixed perimeter to enclose the most area (strategy) | c5-maths-ch11-t02, c6-maths-ch06-t01 | bigger perimeter = bigger area | C | perimeter budgets |
| 11 | `sieve-storm@1` **Sieve Storm** | numbers rain; slash composites, which split into factors; primes pass | c6-maths-ch05-t02/t04, c5-maths-ch13-t02 | 1 is prime; odd = prime | P | ranges, rain speed |
| 12 | `beat-jumps@1` **Beat Jumps** | jump on multiples to a beat; common multiples are where beats coincide | c5-maths-ch13-t01, c7-maths-ch11-t02, c4-maths-ch09-t01 | LCM as a product | C (WebAudio clock) | bpm, multiples |
| 13 | `tile-fit@1` **Tile Fit** | drop the largest square tile that exactly tiles the floor (HCF) | c7-maths-ch11-t01 | HCF vs LCM | C | floor dimensions |
| 14 | `number-forge@1` **Number Forge** | catch thousand/hundred/ten/one blocks on a conveyor to build a target; 10 merge into 1 | c4-maths-ch04-t01, c7-maths-ch01-t01, c7-maths-ch03-t02 | place-value regrouping | P | targets, conveyor speed |
| 15 | `ballpark@1` **Ballpark** | fire at the closest estimate bucket before the sum lands | c4-maths-ch07-t02, c5-maths-ch06-t02, c6-maths-ch03-t04, c7-maths-ch01-t02 | exact vs approximate | C | expressions, buckets |
| 16 | `order-circuit@1` **Order of Operations Circuit** | choose operation lanes so the expression hits a target (brackets change the route) | c7-maths-ch02-t01/t02 | left-to-right only | P | target, lanes |
| 17 | `rule-machine@1` **Machine Factory** | feed inputs, infer the rule, automate the line | c6-maths-ch01-t01/t03, c7-maths-ch04-t03, c4-maths-ch03-t02 | rule from one example | C | rules (T-hook) |
| 18 | `mirror-paint@1` **Mirror Paint** | paint one side in real time while the mirror paints the image; rotational spinner | c4-maths-ch11-t01/t02, c5-maths-ch10-t01, c6-maths-ch09-t01/t02 | diagonal mirror lines | C | grids, axes |
| 19 | `drone-route@1` **Drone Delivery** | fly a drone on a map by directions against wind; scale distances | c4-maths-ch02-t02, c5-maths-ch14-t01/t02 | scale reading | P | maps, stops |
| 20 | `view-match@1` **Shadow Match** | rotate a block build until its top, front and side silhouettes match | c4-maths-ch02-t01, c4-maths-ch01-t01 | hidden cubes | 3 | builds |
| 21 | `time-lock@1` **Time Lock** | set clock hands and elapsed time before the vault closes | c4-maths-ch12-t01/t02, c5-maths-ch12-t01/t02 | hour-hand position | C | times |
| 22 | `data-rush@1` **Data Rush** | tally a live stream into a chart; then tune the data to hit a target mean | c4-maths-ch14-t02, c5-maths-ch15-t02, c6-maths-ch04-t03, c7-maths-ch13-t02/t03 | mean vs mode | C | streams, questions |
| 23 | `dukaan@1` **Dukaan Rush** | serve customers: price × quantity, change with decimals (market-maths bridge) | c7-maths-ch03-t04, c7-maths-ch12-t01, c4-maths-ch07-t02 | decimal alignment | P | items, prices |
| 24 | `truss@1` **Truss** | build a bridge from triangles; the load test enforces triangle rules | c7-maths-ch07-t01/t03, c5-maths-ch07-t01 | any three lengths make a triangle | P (Matter) | spans, lengths |
| 25 | `twin-hunt@1` **Twin Hunt** | spot congruent pairs fast by rotating or flipping (SSS/SAS/ASA) | c7-maths-ch09-t01/t02 | AAA congruence | C | shape sets |
| 26 | `orchard@1` **Orchard** | harvest a fraction of a fraction of a field (area model) | c7-maths-ch08-t01/t02 | multiplying makes bigger | C | fractions |
| 27 | `tessellate@1` **Tessellate** | falling polygons fit only where vertex angles sum to 360° | c7-maths-ch14-t02, c5-maths-ch07-t02 | all shapes tile | C | piece sets |
| 28 ★ | `circuit-bench@1` **Circuit Lab** | build loops on a bench; current solved exactly; test materials; switches; cells in series | c7-science-ch03-t01/t02/t03 | t01-m1 one wire; t01-m2 current used up; t02-m2 switch before bulb; t03-m3 only metals conduct | C | steps, tray, presets, predicates |
| 29 | `polarity@1` **Polarity** | flip magnet poles to steer a steel ball through a maze; compass navigation | c6-science-ch04-t01/t02/t03 | all metals are magnetic | P (Matter) | mazes |
| 30 | `food-web@1` **Balance the Forest** | add or remove species to keep populations alive (population sim) | c4-evs-ch03-t02, c6-science-ch02-t03 | removing a predator helps | C | species, links |
| 31 | `sort-plant@1` **Sort Plant** | pick the separation method as mixtures roll by (winnowing wind physics, sieve, magnet, filter) | c6-science-ch09-t01/t02 | method-property mismatch | P | mixtures |
| 32 | `phase-shift@1` **Phase Shift** | control heat and wind to move particles between states; evaporation factors | c6-science-ch08-t01/t02/t03 | boiling only evaporates | C | targets, conditions |
| 33 | `heat-route@1` **Conduct or Convect** | route heat with materials and currents; land and sea breeze | c7-science-ch07-t01/t02/t03 | cold "flows" in | C | layouts |
| 34 | `motion-match@1` **Distance-Time** | drive so the live distance-time graph matches a target; pendulum timing | c7-science-ch08-t01/t02/t03, c6-science-ch05-t03 | steeper = longer | C | target graphs |
| 35 | `shadow-play@1` **Shadow Play** | move a torch to cast a shadow of the asked size; materials; pinhole | c7-science-ch11-t01/t02/t04, c4-evs-ch10-t01 | shadow colour = object colour | C | targets |
| 36 | `leaf-lab@1` **Leaf Lab** | control light, CO₂ and water; stomata open and close; sugar rate (limiting factor) | c7-science-ch10-t01/t02/t03 | plants eat soil | C | conditions, goals |

More science seeds for later engines: `ph-mixer@1` (c7-science-ch02), `cargo-boat@1` (c4-evs-ch07-t01),
`gut-run@1` (c7-science-ch09-t01), `sprout@1` (c6-science-ch10-t02, fair tests c6-science-ch01-t02),
`seasons-orbit@1` (c7-science-ch12-t02), `rust-race@1` (c7-science-ch05-t02).

### 6.2 Animations and explainers (27)

| # | archetype | the idea shown (engine primitives) | topics | misconception |
|---|---|---|---|---|
| A1 | `line-zoom@1` | zoom into the line between two marks: tenths, then hundredths (zoomable number line) | c7-maths-ch03-t01/t02, c5-maths-ch02-t01 | longer decimal = bigger |
| A2 | `re-cut@1` | one bar re-cut into 2/4, then 4/8; the shaded amount never moves (partition morph) | c6-maths-ch07-t03, c5-maths-ch02-t03 | m-add-same, m-one-side |
| A3 | `area-multiply@1` | fraction × fraction (and decimal × decimal) as overlapping shading | c7-maths-ch08-t01, c7-maths-ch12-t01 | multiplying makes bigger |
| A4 | `measure-divide@1` | 3 ÷ 1/4 as "how many quarter cups fill 3 cups" | c7-maths-ch08-t02 | dividing makes smaller |
| A5 | `zero-pairs@1` | tokens annihilate; subtracting is adding the opposite | c6-maths-ch10-t03, c7-maths-ch10-t01/t02 | sign rules as magic |
| A6 | `turn@1` | a ray sweeps; turns as fractions of a full turn; protractor reading | c5-maths-ch03-t01, c6-maths-ch02-t02/t03 | arm length = angle |
| A7 | `tear-and-align@1` | a triangle's corners tear off and line up on a straight line | c7-maths-ch07-t03 | angle sum depends on size |
| A8 | `slide-transversal@1` | the transversal slides; corresponding angles stay locked | c7-maths-ch05-t01/t03 | — |
| A9 | `cut-and-slide@1` | a parallelogram or triangle re-forms into a rectangle (area) | c6-maths-ch06-t03 | — |
| A10 | `indian-place-value@1` | lakhs and crores grouping, powers of ten | c7-maths-ch01-t01, c4-maths-ch04-t01 | comma placement |
| A11 | `figurate@1` | dot patterns grow: triangular and square numbers, sum of odd numbers = square | c6-maths-ch01-t01/t02, c5-maths-ch07-t02 | — |
| A12 | `fold-and-spin@1` | 3D paper fold reveals line symmetry; rotation order | c6-maths-ch09-t01/t02, c5-maths-ch10-t01 | — |
| A13 | `tally-to-chart@1` | tallies morph into bars; the mean as bars levelling | c6-maths-ch04-t01/t03, c7-maths-ch13-t02 | — |
| A14 | `balance@1` | do the same to both sides (balance) | c7-maths-ch15-t02 | — |
| A15 ★ | `orbital-explainer@1` | phases from the lit half and the near half; Earth's shadow; lunar eclipse; reusable for day/night and eclipses | c4-evs-ch10-t02, c7-science-ch12-t01/t03 | c4-evs-ch10-t02 m1, m2, m3; c7-science-ch12-t03 m2 |
| A16 | `water-cycle@1` | evaporation, condensation, precipitation, groundwater (directed particle flows, G6-checked) | c7-science-ch07-t04, c5-evs-ch01-t01, c6-science-ch08-t02 | clouds are smoke |
| A17 | `inside-matter@1` | particles of solid, liquid and gas under a temperature slider | c6-science-ch08-t01, c6-science-ch07-t01 | particles expand |
| A18 | `charge-loop@1` | current around a loop; open and closed; same everywhere (shares Circuit Lab's solver) | c7-science-ch03-t01/t02 | t01-m2, t02-m1 |
| A19 | `ray-optics@1` | rays from a source: shadows, reflection, pinhole inversion (2D ray tracer) | c7-science-ch11-t02/t03/t04 | we see by light from eyes |
| A20 | `sea-breeze@1` | day and night convection loops over land and sea | c7-science-ch07-t02 | — |
| A21 | `inside-a-leaf@1` | CO₂ in through stomata, water up the xylem, O₂ out, sugar to phloem (flow directions G6-checked) | c7-science-ch10-t01/t02/t03 | plants get food from soil |
| A22 | `gut-journey@1` | food through the alimentary canal with what each organ does | c7-science-ch09-t01 | — |
| A23 | `life-cycle@1` | time-lapse life cycles (plants and animals) | c6-science-ch10-t03 | — |
| A24 | `field-lines@1` | iron filings settle into field lines; compasses align | c6-science-ch04-t02/t03 | — |
| A25 | `winnow-slowmo@1` | wind separates husk by mass; sedimentation and decantation | c6-science-ch09-t01/t02 | — |
| A26 | `motion-graph@1` | a car drives while its distance-time graph draws; pendulum period vs length | c7-science-ch08-t01/t02/t03 | heavier bob = slower swing |
| A27 | `rust-and-burn@1` | iron + oxygen + water; the fire triangle | c7-science-ch05-t02 | rust is dirt |

**Excluded by the child-safety floor:** `c7-science-ch06` (adolescence) gets no generated animation or game. It stays
with the teacher's words and the textbook's approved diagrams; the safeguarding hand-off rules apply.

---

## 7. Frequency policy (R14): often, driven by the child and the conversation

The rule is that the stage is never idle while she teaches, and something made for this child appears whenever the
moment calls for it. Specs are cheap, so the limits are pedagogical:

| trigger (from the Brain's moment, DESIGN-V3 duplex floor states) | response | timing |
|---|---|---|
| **The child asks**: "show me", "make it a game", "explain it differently", "I don't get it", "can I try" | the best-fit archetype for the current skill, else the board | at the next turn boundary; **p95 ≤ 4 s** from end of turn to first frame [U: spec 3.25 s p50 + mount < 0.3 s] |
| **Misconception detected** (classifier against kit ids) | a contrast piece whose spec targets that id (e.g. Landfall pairs for `m-bigger-numbers-bigger`; Moon's shadow beat for `m2`) | within the same beat |
| **Explain beat on a process or spatial idea** | an animation archetype by default; the board otherwise | as the beat opens (pre-planned from the lesson arc, prefetched) |
| **Practice beat**, after accuracy is shown untimed | a real-time game archetype for fluency | at the beat |
| **Disengagement signal** (shortening answers, long latencies, off-task) | switch modality: game ↔ sim ↔ animation | next turn boundary |
| **Curiosity within bounds** (parked question returns, R6) | a short explorable or animation | at wrap-up or when the Brain re-opens it |
| **Steering on a running piece**: "harder", "slower", "again", "show me again" | **no new generation**: a knob change on the engine (speed, tolerance, marks) or a timeline seek | instant (< 100 ms) |

Constraints:
- One Studio piece on stage at a time.
- Nothing new enters while the child holds the floor (DESIGN-V3 §4 rule 3); swaps happen at turn boundaries.
- Live code builds stay at ≤ 3 per lesson (LIVE-STUDIO §3.1). Spec-driven pieces have no count cap, only the
  pedagogy rules above.

**Targets to measure in Wave 2.5 child sessions [U]:**
- share of lesson time with a Studio piece on stage: 35-55%;
- median gap between pieces ≤ 4 min;
- ≥ 25% of pieces initiated by the child;
- 100% of "show me" requests answered at the next turn boundary;
- 0 pieces revealed while the child is speaking.

---

## 8. Zero visible failure (R9)

The child never learns that anything is generated, late or wrong. The ladder below runs inside the frame and the
host. Every rung is a correct artifact.

1. **Validated spec.** Schema, then semantics against the kit (items admissible, pairs equal, edges adjacent, verbs
   known), then truths recomputed by the engine. Measured cost: microseconds.
2. **Repaired spec.** Bad items are dropped, numbers clamped, strings defaulted, unknown verbs or predicates removed,
   and a `spec_repaired` event is written for the router's quality score.
3. **Archetype default.** If nothing playable is left, the archetype's kit-seeded default spec plays (e.g. Landfall's
   one-wave "Quarters"). The teacher's facts come from what is actually on screen (`StudioFacts`), so she never
   points at something that is not there.
4. **Board fallback.** If the engine fails to boot or traps repeated runtime errors, the host cross-fades (420 ms,
   DESIGN-V3 §6.8) to the board version of the same idea with the same values. The outgoing frame is held until the
   board has painted.
5. **Voice only**, as the last resort.

Runtime rules:
- The loop runs each frame inside a guard. A thrown frame keeps the last good image. Three errors in a second raise
  `engine_failed` to the host (rung 4).
- Adaptive resolution and reduced motion handle slow devices before frames drop.
- `visibilitychange` pauses everything.
- There is no "making this for you", no skeleton label, no spinner and no error card. This aligns with DESIGN-V3
  §6.9 and supersedes LIVE-STUDIO §4.2.

**Hot-swap.** A better version (a passed live build, or a promoted library variant) replaces a running piece only at a
turn boundary, with state handed over through the same params. The swap is a cross-fade, never a reload.

**Measured (§14 M5):** 87 route-served mutated specs (dropped keys, junk types, out-of-range values, unequal "equal"
pairs, divide-by-zero fractions, unknown verbs and predicates, markup in strings, truncated JSON, `{}`, `[]`) plus 3
controls gave **0 visible failures**: no page errors, every piece reported ready and painted a non-blank stage.

---

## 9. Latency hiding

| stage | budget | how it is hidden |
|---|---|---|
| Engines (code + fonts) | 0 at lesson time | precached with the shell. Each engine is 10-12 KB gz plus the 8 KB core [M]; Phaser engines share one precached runtime |
| Spec generation | 1-4 s | started from the Brain's lookahead at the beat's opening, or on the child's request while she speaks her uptake line ("okay, let me make that a race"). Never a visible wait |
| Mount → first frame | ≤ 300 ms | engines boot from a warm frame; Landfall, Circuit Lab and Moon reported ready 0.10-0.25 s after navigation in the recordings [M] |
| Narration | 0 | the explainer's audio is the teacher's turn; cues are compiled from durations that are already measured (offline lines) or known on arrival (live TTS returns duration with the audio) |
| Live code build (T-build only) | 37-54 s p50 | LIVE-STUDIO's 90 s lookahead rule; the spec-driven engine piece plays meanwhile, and the build hot-swaps in at a turn boundary if it passes |

---

## 10. QA for engine + spec pieces

Engines are product code and pass product gates once per version:
- unit tests on the truth (e.g. Circuit Lab's solver against hand-computed loops; §14 M4);
- bot play of every predicate through real pointer events on the test seam (LIVE-STUDIO G5 pattern);
- spec fuzz (§14 M5);
- semantic probes (§14 M7);
- layout at three viewports with `tooSmall` = 0;
- the 4× throttle perf trace.

Each *spec* needs only the validator plus a cheap headless replay before first reveal to a new child: the LIVE-STUDIO
G-mount idea at a fraction of the cost, about 1-2 s. Library promotion keeps LIVE-STUDIO §3.11's sampled human review
of specs per archetype, because a valid spec can still be a dull or badly sequenced lesson. Judges stay advisory
(`rj-holistic-model-judge-gate`).

---

## 11. The three exemplars: what each proves

### 11.1 Landfall (`catch-on-line@1`): maths action game
**Topics:** c5-maths-ch02-t01, c6-maths-ch07-t02/t03.

The pods carry fractions. The child steers the volt dock along a number line, with critically damped spring physics,
a lean and a speed cap, so that it sits where the value lives before the pod lands. The landing beam reveals the
truth only in the last 260 ms, so the falling position is never a hint.

**The four waves:**
1. Quarters, with quarter marks.
2. Eighths with only the half marked (`m-count-marks`). Pods overlap, so the child has to prioritise.
3. "Same spot?": 1/2 + 4/8, 3/4 + 6/8 and 2/3 + 4/6 fall together and land in one place, so catching both gives
   SAME SPOT and the equation (`m-bigger-numbers-bigger`).
4. "Past one" on a 0-2 line: 5/4, 3/2 = 1 1/2, 9/8 = 1 1/8 (`m-less-than-one`, `m-mixed-wrong`).

**Mechanics:**
- *Juice:* glow sprites, squash, ring shockwaves, hit-stop on EXACT, chains with rising pitch, a perspective floor and
  parallax stars.
- *Feedback on a miss:* the gap from the dock to the truth, a magnifier (never red), and "off by ~1/8".
- *DDA:* two misses in a row slow the pods, widen the dock and fade in scaffold marks in ion for 3 pods. A chain of 4
  makes it harder.
- *Score:* precision (100 − mean PAE), landed/total and chain, inside the run only.
- *Evidence:* each landing is an `answer` with the estimate and its PAE.

### 11.2 Circuit Lab (`circuit-bench@1`): science simulation
**Topics:** c7-science-ch03-t01/t02/t03.

A modified-nodal-analysis solver re-solves the bench every frame. Cells have EMF 1.5 V and internal resistance
0.4 Ω, so a short circuit really heats the cell and cells in series really add. Charge (conventional current) moves
at a speed proportional to the solved current. Bulbs glow by P/P₁, with filament warm-up and a light pool on the bench.

**The five steps, each ended by a predicate from the closed list:**
1. Close the loop (`t01-m1`).
2. Two meters read the same on both sides of the bulb (`t01-m2`).
3. A switch placed *after* the bulb still turns everything off (`t02-m2`).
4. Test materials in a tester gap. Pencil lead glows dim, which is true and kills `t03-m3`.
5. Make the bulb brighter. A second cell dropped the wrong way round cancels the first, so the sim says "pushing
   against each other" and the child flips it.

The tray offers only the tools each step needs (PhET implicit scaffolding). After the steps it becomes a free build.

### 11.3 Why the Moon has phases (`orbital-explainer@1`): cinematic explainer
**Topics:** c4-evs-ch10-t02, c7-science-ch12-t03.

**Shot list:**
1. A dusk sky over an Indian city skyline (temple shikhara, rooftop water tanks, a banyan). The Moon runs through its
   shapes on the clauses "A thin curve. / Half a circle. / A full disc."
2. Title card.
3. The camera pulls out to a view from above the North Pole. Sunlight streams in; eight ghost moons are all lit on the
   Sun's side.
4. One revolution, with the lit half fixed toward the Sun.
5. Split view: the "from Earth" window and the phase strip are driven by the same angle. The gold arc (sun-facing
   half) and the ion arc (Earth-facing half) overlap; "half of the lit half" pulses.
6. The misconception beat: Earth's shadow is drawn cutting the sunlight and pointing away. The first-quarter Moon is
   nowhere near it and still half dark. At full Moon it slips in and turns copper: a lunar eclipse.
7. Hands-on ending: drag the Moon. A morning half moon gets "a morning one, try the other side", then the evening
   half and the full moon get ticks.

**Narration:** 21 lines synthesized once with the product's TTS call (`gpt-4o-mini-tts`, voice `marin`, Azure grant).
Their measured durations and pauses drive every cue with a 400 ms pre-roll. Captions are phrase chunks snapped to
measured pauses.

---

## 12. Tensions resolved (proposed decisions; each has a reversal condition)

- **D-S1 Engine + spec is the default generation path.** LIVE-STUDIO's live code builds become the opportunistic
  fallback for uncovered needs.
  - *Why:* craft cannot be generated reliably in a live window (§4), while specs are fast and always render (§14).
  - *Reverse if:* a live code arm reaches P(pass strict gate by deadline) ≥ 0.95 on n ≥ 30 per archetype **and**
    blind child and owner ratings of its builds match the engine pieces (≥ 4/5 craft).
- **D-S2 For classes 4-7, a run may show a mastery score.** That means precision, landed/total and chain, visible
  only inside the run. It is never persisted as points, never converted to currency or unlocks, and never ranked
  against other children. This amends `game-mechanics.md` rule 4 for the reset band (R3: "real games").
  - *Why:* the score *is* the learning measure (PAE). It is in-world consequence, not an extrinsic reward.
    Brilliant, PhET-style challenges and Kahoot all use performance feedback, and the Deci-style undermining effect
    attaches to expected tangible rewards, which this is not.
  - *Reverse if:* an A/B with a no-score arm shows lower next-item-unaided accuracy, more anxiety signals, or more
    rushing (time-to-commit falling while PAE rises).
- **D-S3 Real-time speed is adaptive and starts slow.** The first wave is near-untimed (2.3-2.6 s per pod with marks
  on). Speed rises only with demonstrated precision. Two misses slow it down. A calm mode (no speed-up) switches on
  from anxiety signals or a parent setting. This keeps the spirit of `game-mechanics.md` rule 6 while allowing real
  time.
  - *Reverse if:* state maths-anxiety measures rise relative to the untimed arm.
- **D-S4 No `backdrop-filter` over a live canvas.** Use solid translucent fills.
  - *Why:* measured frame cost on the throttled profile (§14 M3); a known low-end Android jank source.
  - *Reverse if:* a real-device trace on the reference ₹10k phone shows the blur costs < 1 ms per frame.
- **D-S5 Explainers are deterministic timelines (state = f(t))** compiled from measured narration durations, with
  clause cues and phrase captions. Never word-lit.
  - *Reverse if:* `teacher-stage-cue-scheduler`'s own reversal fires (exact live alignment becomes cheap).
- **D-S6 Archetype engines own min sizes and safe zones**, and record every undersized label at runtime
  (`tooSmall`). A non-zero count fails the engine's release.
  - *Reverse:* never for the floor sizes. The sizes themselves follow DESIGN-V3 §6.4.

---

## 13. How this lands in the product (for the main loop; this session touched no product code)

1. **`src/studio/core/`** ports `lib/stage.js`:
   - fit and DPR, adaptive resolution, loop guard, tweens, fx, synth sound, HUD/task/captions;
   - Studio bridge on the existing frame protocol;
   - the seam behind a test build flag.
2. **`src/studio/engines/{catch-on-line,circuit-bench,orbital-explainer}/`** port the three engines. Each engine
   gets `schema.json` (zod in `shared/studio.ts`), `validate.ts`, `default-spec.json` (kit-seeded) and tests.
3. **`server/studio/spec.js`**:
   - the planner's structured call (`taxila-fast-bg`, effort none) with the archetype's schema and the kit slice;
   - Q8 on strings;
   - router entry "T-spec first", then T-build (LIVE-STUDIO), then board.
4. **`evals/studio-v2/`** holds the spec-quality bench per archetype: the strict validity rate, the repair rate, and
   human review of sequencing on n ≥ 30 per archetype. It also gets this folder's `spec-fuzz.mjs` and `record.mjs` as
   gates.
5. **Catalogue growth.** Priority order: the Landfall family (2, 15) and the line archetypes (A1, A2). Then
   Circuit-bench siblings (A18) and Shadow Play (35). Then Leaf Lab (36) with A21, reusing LIVE-STUDIO's
   flow-direction checks. Then the remaining physics games on Phaser. Each new engine is a Forge T-forge job with
   human review.
6. **Acceptance with children (R15)**, all transcript- and video-reviewed:
   - "show me" honoured at the next turn boundary 100%;
   - a Studio piece in every beat that calls for one;
   - the owner plays each built archetype on his own phone;
   - Fun Toolkit "again-again" ≥ 60% for games;
   - next-item-unaided accuracy vs board-only (the LIVE-STUDIO experiment).

---

## 14. Measurements (this session, 2026-10-04)

All runs were from this container: Playwright 1.63, Chromium headless shell (software raster), 4 shared cores. The
host load average was 7.6-8.9 from other agents during the perf runs, so every frame-time number is a pessimistic
proxy, not a phone measurement.

{{MEASUREMENTS}}

**Not measured (and not claimed):**
- real-device frame times on a Mali/Adreno phone with GPU canvas;
- spec generation by a live model for these schemas (the 3.25 s figure is LIVE-STUDIO's plan-shaped call);
- children's ratings, learning effect or anxiety;
- audio playback inside the headless browser (the narration is muxed into the mp4 from the page's own timestamps).

---

## 15. Sources

- Brilliant, "Hand-crafted, machine-made: How we make learning games with AI", blog.brilliant.org/hand-crafted-machine-made [V]
- Rive, "How Brilliant.org motivates learners with Rive animations", rive.app/blog [V]; Rive runtime docs, rive.app/docs/runtimes/web/canvas-vs-webgl [V]
- Podolefsky, Moore & Perkins, "Implicit scaffolding in interactive simulations", arXiv 1306.6544 [V]
- Kahoot, "How points work", support.kahoot.com [V]
- Kao, "The effects of juiciness in an action RPG", *Entertainment Computing* 2020, n = 3,018 [S via sciencedirect abstract]
- "How does Juicy Game Feedback Motivate? Testing Curiosity, Competence, and Effectance", CHI 2024 (doi 10.1145/3613904.3642656) [S; page returned 403]
- GameCraft-Bench, arXiv 2606.17861 [V]; GUI Agents for Continual Game Generation (PlaytestArena / Play2Code), arXiv 2605.28258 [V]
- ManiBench, arXiv 2603.13251 [V]; SGA, arXiv 2607.18116 [V]; See Before You Code (OmniManim), arXiv 2605.15585 [V]; Code2Video, arXiv 2510.01174 [V]; ManimAgent, arXiv 2606.30296 [V]
- Motion Canvas docs and repository (motioncanvas.io, github.com/motion-canvas) [V]; Theatre.js repository and npm (@theatre/core Apache-2.0, @theatre/studio AGPL-3.0) [V]
- GSAP licence change: css-tricks.com "GSAP is now completely free" and Webflow help [V]
- Kurzgesagt production figures: "How to make a Kurzgesagt video in 1200 hours" (10.studio, fandom summary) [S]
- Prodigy critique: Fairplay for Kids; NBC News 2021 [S]
- DragonBox studies: BJET 2023 (Chan et al.); Long & Aleven 2014 via `context/rejected.md#in-game-success-as-mastery` [S/T]
- Taxila: LIVE-STUDIO.md, DESIGN-V3.md, game-mechanics.md, game-kit-frameworks.md, llm-game-generation.md, generated-learning-content.md, `context/rejected.md`, `context/decisions.md#teacher-stage-cue-scheduler`, `data/curriculum/*.json`, `data/kits/*.json` [T]
