# LLM-generated games for Taxila's Forge: what works, and the strategy

**Date:** 2026-10-02 · **Question:** which approaches produce polished, bug-free, *fun* games reliably, and what
should Forge (the content factory) do. **Builds on (not repeated):** `tech-and-market.md` §3 (T0–T3 module tiers,
sandbox and bridge, Google's 3.5% → 69.3% critique-loop result), `content/maths-engines.md` and
`content/science-engines.md` (engine contract, rules R1–R10), `learning-science.md` §2.4 and §6 (seductive details,
game effect sizes, reward economies), `context/decisions.md#forge-models` and `#forge-infra-azure`,
`context/rejected.md#claude-on-foundry-credits`.

| tag | meaning |
|---|---|
| **[V]** | verified today against the primary source (paper PDF text, repo source code, vendor doc) |
| **[S]** | secondary: abstract, HTML summary, vendor blog or search summary; not checked line by line |
| **[M]** | from memory of the literature, not re-checked this session |
| **[U]** | our estimate or design hypothesis. Forge must measure it before relying on it |

**Constraint check before reading on.** The task brief lists `taxila-opus` and `taxila-sonnet` as available. Two
project facts disagree: `Taxila/CLAUDE.md` (owner directive, 2026-10-02) says "No Anthropic/Claude-on-Foundry or
other Marketplace models", and `context/rejected.md#claude-on-foundry-credits` records that the deployment failed at
purchase. **This design therefore runs entirely on first-party Azure OpenAI deployments** (`taxila-codex`,
`taxila-brain`, `taxila-fast`, `taxila-image`, TTS). The coder sits behind a model adapter, so a Claude deployment can
be bake-off-tested the day the owner lifts the directive (`forge-models` already names that reversal condition).
The same directive rules out ElevenLabs, Suno and similar APIs for sound. That is why §6 uses procedural audio.

---

## 0. TL;DR (decisions this research supports)

1. **Free generation does not produce reliable games. Constrained generation does.** These numbers come from different
   benchmarks with different bars, so do not subtract them from each other. They agree in direction:
   - **One-shot free generation:**
     - Google's educational GenUI: 3.5% pass all critiques
     - PlaytestArena: 29.7% rubric pass
     - V-GameGym: best model about 45/100, with visual and gameplay sub-scores near 20/100
     - WebGameBench: the best agent reaches 76.9% "usable" but only **20.2% "excellent"**
   - **Agentic loops with play-testing:** 66.8% (Play2Code), 69.3% (Google after 10 rounds), 65.1 intent alignment
     (OpenGame).
   - **Templates and DSLs with deterministic gates:** 90% validation pass (GamED.AI, $0.46/game, under 60 s); 88.4%
     playable levels (MarioGPT); 68–86% (SINE).

   Children get a game from the constrained path. The free path only grows the library.
2. **Compile-pass and lint-pass rates are not quality signals.**
   - GameASG-Bench: static checks pass 97.7–99.6%, but strict task success is 14.9–55.3%.
   - Mage: direct generation had the *highest* runtime-pass rate (43%) and the *emptiest* scenes (mechanism F1 ≈ 0.12).
     Compile rate was **anti-correlated** with correctness **[V]**.

   Forge's gates must **play the game**: a scripted bot through a test API, plus a GUI or vision agent. Static checks
   only filter cheap errors.
3. **The best open design to copy is OpenGame** (Apache-2.0, Phaser 3.90, read in full today **[V]**):
   - template families with **hook-only extension**, config-first `gameConfig.json`, an asset registry, a GDD whose
     sections map one-to-one onto execution steps, and an evolving "debug protocol" of (error signature → cause → fix);
   - its ablation shows the template library plus debug protocol adds **+13.9 intent-alignment points** over a static
     skeleton (51.2 → 65.1), and dropping hook-driven implementation costs **−11.6** **[S]**.

   Forge should fork its structure, not its genres.
4. **Taxila's games are three tiers:**
   - **G1 kit-filled:** live and per child; seconds; expected **≥ 95% valid** **[U]**.
   - **G2 kit-extended agentic build:** while the teacher teaches; 5–15 min; expected **60–75%** pass all gates on the
     first job, with G1 as the guaranteed fallback **[U]**.
   - **G3 free-form new mechanic:** offline; human-reviewed; expected **about 20–35%** reach "excellent" **[U]**.

   Personalisation lives mostly in **data**: items, misconception traps, numbers, skin, pacing, language. Mechanics
   are chosen by learning objective, **never by "learning style"** (learning-science §1, rule 3).
5. **Fun has to be designed in. It cannot be prompted in.**
   - The design levers with evidence: **intrinsic integration** (the maths *is* the move: 7× more voluntary play time
     and more learning, Habgood & Ainsworth 2011 **[S]**); challenge tuned to ability; immediate, concept-bearing
     feedback ("juice" on the learning action, not decoration); short levels with visible progression; no coin
     economies (Deci et al.; learning-science rule 27).
   - LLM judges of "fun" correlate only weakly with players (ρ ≈ .37 on creative alignment, no significant correlation
     on emergence **[S]**). Fun is measured on children: voluntary replay, the Fun Toolkit's Again-Again table.
6. **Assets:**
   - sprites from `taxila-image` (gpt-image-2), with **transparent background (preview at OpenAI; Azure parity
     unverified)** or a flat key colour plus MIT `rembg`;
   - **never** `@imgly/background-removal` (AGPL-3.0 **[S]**);
   - animation by tweening and 2–4-frame image edits, not video;
   - SFX from **ZzFX** presets (MIT, < 1 kB);
   - music from procedural or ABC-notation loops;
   - voice lines from Azure TTS.

   **Do not build on Sora 2.** OpenAI shut down its Sora API on **2026-09-24** **[S]**. The Azure doc (updated
   2026-06-05) states no retirement date **[V]**, but there is no successor.
7. **Cost and latency per game [U, derived in §8]:**
   - G1 ≈ **$0.01–0.15**, 3–25 s;
   - G2 ≈ **$1.5–3.5** on gpt-5.3-codex (about 2× on Claude Opus 5.5 pricing), P50 about 8 min, P90 about 15 min;
   - cache G2 games by (objective × mechanic × skin) and re-personalise through G1 data, so most children never wait
     for a G2 build.

---

## 1. Production systems: how they actually build apps and games

| system | generation architecture | what makes it reliable | relevance to Forge |
|---|---|---|---|
| **v0 (Vercel)** | "composite model": RAG over curated docs and code samples, a frontier base model (Sonnet 3.7 → 4), and **"LLM Suspense"**, a streaming rewrite layer that fixes known errors mid-stream (bad icon names → closest export by embedding, long URLs → tokens; < 100 ms, no extra model call). Then **autofixers**: deterministic ones (missing `package.json` deps) plus a small fine-tuned fixer (wraps `useQuery` in its provider via AST) that runs in < 250 ms only when needed **[S]** | LLM code "can have errors as often as 10% of the time"; the pipeline gives "a double-digit increase in success rates" **[S]**. Success is measured as *working preview vs error or blank screen* | Forge needs the same two cheap layers before any agent repair round: a **deterministic fixer catalogue** (asset-key snapping, scene-registration repair, config-merge repair) and **version-pinned docs injection** (Phaser 3.90 API, our hook list), not web search |
| **bolt.new (StackBlitz, open source)** | one LLM call emits `<boltArtifact>` with ordered `<boltAction type="shell|file">` steps into an in-browser **WebContainer**; rules: "ALWAYS show the complete, up-to-date file contents", install dependencies before files, never restart a running dev server, "split functionality into smaller modules" **[V: prompts.ts]** | the preview is instant, so errors surface fast; the user is the repair loop | full-file writes avoid diff-application bugs. Forge's agent writes whole small files (hook subclasses), never patches engine files |
| **Lovable** | spec → context → plan → build → feedback. A **fast model pre-selects context** before the main generation call. It "tried complex multi-agent orchestration and abandoned it" for a cheap router, a strong generator and deterministic verification **[S, third-party write-ups]** | context selection and deterministic checks, not agent count | one coder agent per job with the right files in context (OpenGame's "three-layer reading", §3) |
| **Google AI Studio Build** | prompt → full React + Node app by the "Antigravity" coding agent (relaunched 2026-03-20; Android at I/O 2026-05-19) **[S]** | general vibe-coding; no game-specific kit | proof that the generic agent route works for prototypes, not for a child-facing quality bar |
| **Google Generative UI / dynamic view** (Gemini 3 Pro) | detailed system instructions, tools (image generation, search) and post-processors for common errors; output is complete HTML/JS **[S]** | humans "overwhelmingly" prefer it to markdown; it is "at least comparable" to expert-made pages in **50%** of cases (Leviathan et al., arXiv 2604.09577) **[S]**; it can take "a minute or more" | the education follow-up (3.5% → 69.3%) is the critique-loop baseline Forge must beat |
| **Claude artifacts / Gemini Canvas** | single-file HTML/React in a sandboxed iframe on a separate origin with preloaded libraries **[M]** | the user iterates by chat | single-file output is the easiest to sandbox, but quality has no gate and no telemetry contract |
| **Websim** | the LLM (Claude 3.5 Sonnet, GPT-4o) generates a whole HTML page per imagined URL; links generate new pages on visit **[S]** | none. Delight comes from novelty, not correctness | shows how much *surprise* drives fun. Not a model for reliability |
| **Rosebud AI** | Three.js browser engine; prompt → agent scaffolds scenes, physics, UI and a test level; **starts from genre templates** (top-down RPG, platformer, runner, visual novel, idle); remix and one-click publish **[S, vendor pages]** | templates and an engine the agent did not write | the consumer market converged on template-first too |
| **Astrocade** | "TikTok for games": separate agents for visuals, UI and gameplay tuning; **remix any game** **[S]** | remixing proven games | remix is how Forge's G2 should work: start from a library game that already passed, then change data, skin and hooks |

**Pattern across all of them:** nobody ships raw single-shot LLM games to end users at a quality bar. They ship one of
three things: (a) templates or remixes plus an agent, (b) composite pipelines with deterministic fixers, or (c) an
iterate-by-chat loop where *the user* is QA. Taxila has no adult in the loop during play, so (c) is not an option.

---

## 2. Research: generating games and levels with LLMs (2023–2026)

### 2.1 Whole-game code generation

| work | setup | headline result | lesson |
|---|---|---|---|
| **GameGPT** (Chen et al., arXiv 2310.08067, rev. 2025-09) | multi-agent roles (planner, coder, reviewer) plus small expert models; targets hallucination and *redundancy* **[S]** | architecture paper, no strong external benchmark | role-play multi-agent designs predate playable evaluation. Treat them as historical |
| **V-GameGym** (ACL Findings 2026) | 2,219 Pygame tasks from 100 clusters; scores code, screenshots and 10 s recordings; 70 models | best **final score 45.0** (GPT-5): code **96.6**, image **17.6**, video **20.7**. o3 solves the most games (1,092 of 2,219 ≈ 49%). "Most generated games fall into the Poor and Fair categories" **[V: PDF]** | **code that runs ≠ a game that looks and plays right**. Visual and dynamic quality is the bottleneck |
| **ArtifactsBench** (Tencent, arXiv 2507.04952) | 1,825 visual/interactive tasks incl. game development; scripted interaction, screenshots and GIFs; MLLM judge with a per-task checklist | judge rankings reach **94.4% consistency** with WebDev Arena and > 90% pairwise agreement with experts; generalist models often beat code-specialist ones **[S]** | an **MLLM judge with a per-task checklist is valid for ranking** builds. It is not proven for absolute pass/fail on a single child's game |
| **GameDevBench** (arXiv 2602.11103) | 132 Godot 4 tasks, about 106 lines over 5 files | best **54.5%** (Gemini 3 Pro with multimodal feedback). Runtime video lifted Claude Sonnet 4.5 from **33.3% to 47.7%**. Failures: asset selection, spritesheet parsing, animation frames **[S]** | **feed the agent runtime screenshots or video**, not only logs |
| **Mage** (arXiv 2605.07342) | 858 Unity scene attempts, 4 open models (7–30B); four axes: compile, runtime, structure, mechanism | direct NL → C# has the highest runtime pass (**43%**) and the emptiest mechanisms (**F1 ≈ 0.12**). Structural IR conditioning halves runtime pass but restores mechanism F1 to **0.82–1.00**. Compile rate is "anti-correlated with functional correctness" **[V: abstract and intro]** | **a structured intermediate representation (our GDD/spec) trades raw pass rate for games that actually contain the mechanic**. Gate on mechanism, not compile |
| **WebGameBench** (arXiv 2605.17637) | 111 browser games, 7 families, from a frozen "Structured WebGame Specification" (overview, flow, controls, objects, rules, feedback, constraints, evaluable points); a Codex-based Playwright evaluator plays the build | best: **Claude Opus 4.7, 76.9% usable / 20.2% excellent**. Generation took 20–24 agent turns, evaluation 31–35. 85% human agreement on usability. Failures: physics exceptions, dead input, win/loss logic, mid-game deadlocks **[S]** | even the best agent with a perfect spec mostly ships "playable with defects". **Excellence needs a kit** |
| **PlaytestArena / Play2Code** (arXiv 2605.28258) | 200 browser games, 8 genres, about 7.7 rubric items each, judged by a GUI agent that *plays*; Play2Code loops a game agent and a GUI agent with episode, skill and world memory | **66.8%** rubric pass vs **29.7%** single-pass and **52.2%** code-only iteration. 3.24 rounds on average; 93.5% finish within 5 rounds. GUI agents struggle with real-time precision (platformers) and low-contrast UI **[S]** | **play-testing adds about 15 points over code-only repair.** Cap at 5 rounds. Our bot must not depend on twitch skill (see the test API, §5) |
| **GameASG-Bench** (arXiv 2609.21293) | the agent must implement a **pre-declared test interface** (`reset`, `loadScenario`, `input`, `getSnapshot`); 336 static and 885 browser checks | static pass **97.7–99.6%** vs strict success **14.9–55.3%** (best "GPT-6-Astra" 26/47). Raising the turn budget from 30 to 120 lifts success from 14.9% to 38.3%. Claude Code and Codex CLI both reach 18/47 but only 10 tasks overlap **[S]** | **make testability part of the template.** Budget turns generously. **Run two coder configs and keep whichever passes** (their success sets barely overlap) |
| **OpenGame** (arXiv 2604.18394; repo `leigest519/OpenGame` @ c9bea37, Apache-2.0) | a Qwen-Code fork. Pipeline: classify the archetype by physics → copy the template family → GDD → assets → config → hook-only code → verify. Five families: platformer, top-down, grid logic, tower defence, UI-heavy. An evolving debug protocol | OpenGame-Bench (150 tasks), with Sonnet 4.6: build **72.4** / visual **67.2** / intent **65.1**, vs Cursor 66.8 / 61.4 / 58.9 and direct LLM 58.5 / 50.8 / 50.3. By genre (intent): platformer **76.8**, puzzle/UI **52.6**. Repair gains are steepest by T=3 and plateau at T=5. "About 34.9% of weighted mechanical requirements" are still unmet **[S paper; code V]** | the closest public blueprint. **Abstract and puzzle genres, which most curriculum games are, are its weakest**: silent logic bugs produce no errors. Hence solver-based checks (§5) |
| **AVR-Agent** (arXiv 2508.00632) | multi-agent JS game generation; omni-modal judging of audio-visual recordings; asset bank | better win rate than one-shot. But models gained **no** win rate from custom assets and AVR feedback: AI "struggles to utilise high-quality resources as effectively as humans" **[S]** | **good assets do not rescue a weak build.** Spend effort on mechanics and gates first |

### 2.2 Constrained languages and levels (PCG through LLMs)

| work | representation | result | lesson |
|---|---|---|---|
| **MarioGPT** (2023) | levels as tile strings; fine-tuned GPT-2 | **88.4%** of 250 levels completed by an A* agent (best baseline LSTM about 31%) **[S]** | data-level generation is far more reliable than code generation, but needs a solver to *prove* playability |
| **Word2World** (Nasir, James & Togelius 2024) | story → extracted characters, tiles and goals → 2D grid in 2 steps | coherent, playable worlds; **multi-step structured extraction beats direct generation** **[S]** | split "narrative or theme" from "level grid" |
| **Game generation via LLMs (VGDL)** (Hu, Zhao & Liu, IEEE CoG 2024) | VGDL rules + levels together | first framework for rules and levels at once **[S]** | DSLs are viable for rules. Grammar-guided RL follow-ups (arXiv 2503.15783) improve validity **[S]** |
| **GAVEL** (Todd et al., NeurIPS 2024) | Ludii game description language; fine-tuned CodeLlama-13B plus MAP-Elites | novel, playable board games outside the training distribution **[S]** | evolution plus automated play evaluates *novelty and balance*, useful for G3 |
| **ScriptDoctor** (2025, arXiv 2506.06524) | PuzzleScript; compiler errors and BFS solver results fed back; up to 10 attempts | GPT-4o: **80%** compile, **55%** have one solvable level, only **5%** have all levels solvable in > 10 moves. o3-mini: 93% compile, 20% all-solvable. Levels are "overly short", and making them harder means stretching rows **[S]** | **LLMs are bad at puzzle-level design**. Levels must come from **code generators plus solvers**, with the LLM choosing parameters |
| **Real-Time World Crafting** (Drake & Dong, arXiv 2510.16952) | LLM → constrained DSL → ECS configured at runtime | safe player-authored behaviours. Chain-of-thought helps creative alignment; few-shot is needed for complex DSL **[S]** | for "make your own power-up" moments: DSL, never raw code |

### 2.3 Educational game generation specifically

| work | approach | result |
|---|---|---|
| **GamED.AI** (arXiv 2604.23947) | LangGraph DAG of 6 phases with typed I/O and **deterministic quality gates (first-order-logic predicates, Pydantic)**; **15 mechanic templates** in two families (drag-drop, click-to-identify, trace-path, sequencing, sorting, memory match, branching scenario, compare, hierarchy; state tracer, bug hunter, algorithm builder, complexity, constraint puzzle) | **90.0%** validation pass vs ReAct agents 72.5% vs sequential pipeline 56.7%. Per mechanic: **96.2% (drag-drop) down to 60.0% (description matching)**. Educational correctness **4.2/5 vs 4.3/5 hand-authored** (n.s.). **$0.46/game, < 60 s, about 19.9k tokens** (73% fewer than ReAct). Beat Claude Code's best prompting (67%) on Bloom alignment. Limits: English only, expert ratings (n = 5), no learning outcomes; gates check structure, not facts **[S]** |
| **SINE** (MDPI *Applied Sciences* 16(6):2932, 2026) | text interactive-fiction serious games; open-weight LLMs; **grammar-guided decoding + deterministic validation + repair agent** | **68–86%** joint success (compiles, playable, learning-goal fidelity) depending on prompting strategy **[S, abstract only: full text 403]** |
| **Google, "Harnessing Generative UI for Education"** (arXiv 2609.20738) | plan → leveled goals → UI → guidance; render-and-critique loop | 3.5% → 69.3% after 10 rounds; experts accepted 86% (in tech-and-market §3.1) **[S]** |
| **Duolingo** (blog, 2023-06-22) | prompts as "a Mad Lib for generating Duolingo lessons": fixed rules (structure, length) plus variable slots (level, grammar); "Our Spanish teaching experts always have the final say" **[S]** | the industrial precedent for "template + LLM fill + review" |

**Synthesis.** Every system with a reliability number of 85% or more constrains the output space to *data inside a
fixed mechanic*: GamED.AI's templates, MarioGPT's tile strings, Duolingo's Mad Libs. Every free-code system sits
between 20% and 70% even with agents and loops. That 20–70% band has two uses: building and extending kits offline,
and live builds when a fallback exists.

---

## 3. Template/kit + LLM fill vs free generation: the decision

| axis | free generation (agent writes the game) | kit-extended (agent writes hooks + config on a template family) | kit-filled (LLM writes a JSON spec; engine is fixed) |
|---|---|---|---|
| reliability (evidence) | 20–49% excellent or full-score (WebGameBench, V-GameGym) | 65–72 on a 100 scale (OpenGame); 66.8% (Play2Code) | 88–96% (GamED.AI best mechanics, MarioGPT); about 99% for schema-validity alone **[U]** |
| polish ceiling | high in principle, rarely reached | as high as the template's juice and UI | exactly the kit's polish, every time |
| novelty and surprise | highest | medium (new rules through hooks, new levels, new skins) | low by mechanic, high by content and theme |
| latency | 5–30 min with a loop | 5–15 min | 3–25 s |
| who guarantees correct answers | nobody, unless tests are written | engine maths, if the template owns the answer check | engine maths (rule R7) |
| fit for live child use | no | yes, with a G1 fallback | yes |

**Decision.** Kit-filled is the live default. Kit-extended is the "while the teacher teaches" build. Free generation
runs offline to grow the kit. This matches `tech-and-market` T0–T3 and refines T2/T3 for games.

**What the kit must contain** (copied from OpenGame's working structure **[V: repo]**, adapted):
- `core/`: Phaser 3.90 boot, `Preloader`, `TitleScreen`, `LevelManager.LEVEL_ORDER`, pause, victory and complete
  scenes, `StateMachine`, `utils`, `gameConfig.json` using the `{ "value": X, "type", "description" }` wrapper.
- `modules/<family>/`:
  - `Base*.ts` scenes that own `create()` and `update()`, plus `_Template*.ts` files to copy;
  - opt-in **hooks**, for example the grid family's `getBoardConfig`, `createEntities`, `checkWinCondition`,
    `onCellClicked`, `onEntityEnteredCell`, `onTurnEnd`, `onWinConditionMet`, `onUndoPerformed` (27 hooks in
    `BaseGridScene.ts`);
  - `behaviors/` (patrol, chase, movement) and `systems/` (board, turn, wave, economy);
  - a "FILE CHECKLIST" comment block in each template.
- `docs/`: `gdd/core.md` (GDD format, "Forbidden in GDD: Implement X from scratch … unspecified numeric values"),
  per-family `design_rules.md`, `template_api.md` (compressed hook and API reference) and a manual.
- `debug-skill/protocol.json`: entries of `{signature: {stage, errorCode, messagePattern}, rootCause, fix}`, for
  example `TextureNotFound` → "key differs from asset-pack.json". Reactive entries are appended after every failure
  and generalised after repeated hits.

**What Taxila adds that OpenGame lacks:**
1. **Pedagogy hooks owned by the base class:** the answer check, misconception tagging and bridge telemetry
   (`ModuleToHost`), so an agent cannot ship a game that never reports.
2. **A test API** in every base scene (§5).
3. **Solver-backed level generators** per family.
4. **Kid UX invariants** in the base: tap-first, 48 dp targets at ages 6–9, 360×640 fit, no text-only instructions,
   Devanagari font bundled.
5. **Mastery-gated progression in place of coins.**

---

## 4. Game families for classes 1–9 (intrinsic integration first)

**Rule.** The learning action must be the core game action (Habgood & Ainsworth 2011: same content; the intrinsic
version gave more learning under fixed time and **7× longer voluntary play** than an end-of-level quiz version **[S]**).
"Shoot the right answer" and "answer a quiz to unlock a jump" are *extrinsic*. They are allowed only as a G1 fallback
wrapper.

| family (Forge id) | physics or loop (OpenGame lineage) | intrinsic maths/science examples | level generator + solver | expected G2 reliability |
|---|---|---|---|---|
| `track-jump` | side view + gravity (platformer) | jump to the right **fraction or decimal position** on a number-line track; integer lift ("Bela's building", GP6 ch10); skip-counting stepping stones | platform positions from target values; reachability by simulated jump arcs | high (platformer 76.8 intent in OpenGame **[S]**) |
| `grid-path` | discrete grid (grid logic) | route a cart so the **sum or product along the path** hits the target; Sokoban-style pushing of place-value blocks (10 ones → 1 ten when pushed together); balance tiles | BFS/A* over states; difficulty = solution length × branching | medium (puzzle genres weakest: 52.6) → **solver gate mandatory** |
| `sort-build` | UI drag/tap (ui_heavy) | sort living/non-living, conductors/insulators; build a food chain; assemble a circuit that lights | constraint check per drop; all items placeable | high (GamED.AI drag-drop 96.2% **[S]**) |
| `catch-lane` | top-down free motion | steer a basket to catch **equivalent fractions of 3/4**; dodge "non-multiples of 6"; catch the shadows that match the light's position (optics) | spawn schedule from item bank; target rate p ≈ 0.4–0.6 | high |
| `defend-path` | path + waves (tower defence) | towers fire only on enemies whose number is a multiple of the tower's factor; place the right factor towers | wave simulation; at least one placement beats all waves; greedy bot as lower bound | medium |
| `story-choice` | UI dialogue (ui_heavy) | EVS/SST branching scenario (water saving in a village, a monsoon trip); science predict–observe–explain inside a story | graph check: every branch reaches an end; every key concept node is visited on ≥ 1 path | high |
| `memory-match` | UI grid | pairs across representations: 3/4 ↔ bar ↔ 0.75 ↔ "teen chauthai" | trivial | very high |
| `sim-challenge` | wraps an existing science or maths engine (`optics@1`, `circuits@1`, `balance@1`) with goals, levels and a timer-free score | "make the image real and inverted in ≤ 3 moves"; "balance with the fewest weights" | the engine's own goal predicates | high: reuses tested engines |

Coverage target **[U]**: these 8 families cover the "practice" phase (F6 game wrapper in learning-science) for most
P0/P1 maths topics and about half of science topics. The rest stay as engines or sims (§9).

**Where the child's profile enters** (all through data, so it is cacheable and safe):

| profile signal (Director/learner model) | game variable |
|---|---|
| objective + mastery (BKT) | family choice, starting difficulty, number ranges, stage (concrete or pictorial skin vs abstract numerals) |
| active misconception flags | **trap items**: the distractors and level layouts that would succeed *only* under the misconception (adding across denominators; "longer decimal is bigger"). Each tagged `misc` in the answer event |
| interests (cricket, dinosaurs, Bollywood dance, space) | **skin pack** and narrative frame; never the mechanic |
| vibe/temperament (calm, competitive, anxious) | pacing (timer off for anxious children), feedback intensity, challenge ramp, whether a "beat your best" ghost appears |
| age band | input mode (tap only at 6–9), text density (none at 6–7, voiced), level length (60–120 s) |
| language | `{en, hi}` labels; voiced instructions from TTS; numerals `latn` / `deva` |

---

## 5. The validation stack (what "bug-free" means, and how Forge proves it)

**Principle:** treat every generated build as broken until a bot has played every level. The gates run in order,
cheapest first, and the first failure triggers repair:

```
G0 spec      zod/ajv on GameSpec + GDD sections; numbers in range; every asset key declared   (ms)
G1 static    tsc --noEmit; eslint; acorn AST ban-list (fetch, XHR, WebSocket, eval, Function, import(),
             localStorage, cookie, window.open, top/parent except bridge); KEEP-file hash unchanged;
             scene keys ⊆ main.ts ∩ LEVEL_ORDER; code asset keys ⊆ asset-pack.json; bundle ≤ 600 kB gz   (s)
G2 boot      headless Chromium at 360×640 and 412×915, CPU-throttled 4×: page loads, `ready` bridge event
             within 3 s, zero console errors, first frame not blank (pixel variance), FPS ≥ 45 median over 10 s   (10–20 s)
G3 behave    via window.__taxilaTest: for each level: reset → loadLevel → solver/bot plays → assert
             win reachable; lose/fail path reachable and non-punishing; every goal emits goal_met;
             every answer emits answer{correct, misc?}; trap items emit the right misc; no deadlock
             (state hash changes within N inputs); level k+1 harder than k (solution length/branching)  (20–60 s)
G4 playtest  GUI agent (vision model) plays from screenshots against the GDD-derived rubric (~8 items:
             "the jump lands on the tapped position", "wrong landing shows the gap on the line")   (1–3 min)
G5 polish    vision critique on 6 keyframes: text legible ≥ 14 sp, contrast ≥ 4.5:1, Devanagari shaped,
             nothing off-screen, touch targets ≥ 48 dp, consistent art style, no unintended text in sprites   (30 s)
G6 content   all child-facing strings + image prompts → Azure AI Content Safety; maths truth computed by
             engine or matched to the kit's verified answer keys (data/kits) — a model never grades   (s)
G7 pedagogy  rubric (taxila-brain): the action IS the concept; misconception traps present; ends on an
             abstract/symbolic step (R1, DragonBox lesson); no decorative distractions inside the play area (R6)   (s)
```

**The test API every base scene implements.** The agent never writes this; the template does. It follows
GameASG-Bench's four-method interface **[S]** plus a solver hook:

```ts
// packages/forge-kit/core/src/test/api.ts  (installed only in validation builds; stripped from prod bundle)
export interface TaxilaTestAPI {
  version: 1;
  reset(seed: number): void;                        // deterministic RNG, fixed dt
  levels(): string[];                               // LEVEL_ORDER
  loadLevel(id: string): void;
  input(a: TestInput): void;                        // semantic inputs, not pixels: no twitch skill needed
  step(ms: number): void;                           // advance the fixed-step clock (headless, faster than real time)
  snapshot(): GameSnapshot;                         // for asserts and deadlock detection
  solve?(): TestInput[] | null;                     // family-level solver (BFS/arc search/wave sim); null = unsolvable
}
export type TestInput =
  | { kind: "tap"; target: string }                 // entity id or cell "x,y"
  | { kind: "drag"; from: string; to: string }
  | { kind: "dir"; d: "up" | "down" | "left" | "right" }
  | { kind: "choose"; option: string }
  | { kind: "wait"; ms: number };
export interface GameSnapshot {
  level: string; status: "playing" | "won" | "failed" | "paused";
  score?: number; attempts: number; stateHash: string;
  goalsMet: string[]; lastAnswers: { item: string; value: string; correct: boolean; misc?: string }[];
  entities: { id: string; kind: string; x: number; y: number; visible: boolean }[];
}
declare global { interface Window { __taxilaTest?: TaxilaTestAPI } }
```

The **semantic input** design (tap an entity id, not a pixel) sidesteps PlaytestArena's finding that GUI agents fail
on real-time precision **[S]**. G4 then checks, separately, that the visuals match what G3 proved.

**Why both G3 and G4.** G3 proves logic: solvable, telemetry complete, traps tagged. It cannot see that a sprite
covers the answer or that feedback appears off-screen. G4 and G5 can see those, but MLLM judges are reliable for
*ranking* (ArtifactsBench 94.4%) more than for absolute verdicts. The project's own harvest also warns that the cheaper
gpt-5.6 tiers "read part, assert the rest" on screenshots (`vision-fab`). **Use `taxila-brain` (sol) for G4 and G5, and
measure its fabrication rate on seeded-bug builds before trusting it (M4, §10).**

---

## 6. Assets: sprites, animation, SFX, music, voice (Azure first-party only)

| asset | method | why | caveats |
|---|---|---|---|
| **sprites, props** | `taxila-image` (gpt-image-2): one **style anchor** sentence per skin pack ("flat-shaded, thick outline, warm Indian-village palette"), isolated subject, `background: "transparent"`, PNG. Fallback: a flat magenta background, then MIT `rembg` in the worker | OpenGame's prompt shape: "single character, centred, pure white background, SIDE VIEW only" plus background removal **[V: generate-assets.ts]**. Transparent output is native in gpt-image-2 (preview) **[S]** | Azure parity for `transparent` is **[U]**: test it. **Do not use `@imgly/background-removal`** (AGPL-3.0 **[S]**). Labels never go into pixels: text is an SVG/Phaser overlay (rule from tech-and-market §4) |
| **skin packs** | pre-generate 20–30 packs (cricket, space, jungle, kitchen, monsoon village, dinosaurs, Bollywood stage, trains) × 8 families at medium quality, human-reviewed, cached in Blob | a 23 s per-image latency never hits the live path. Interests map to packs, so most children reuse reviewed art | per-child custom art: at most the hero/avatar, generated async and swapped in when ready |
| **animation** | (1) **procedural tween animation** (squash-stretch, bob, rotate, particles) on a single sprite: free and always consistent; (2) 2–4 frames by image *edit* from the base sprite ("same exact character as reference … frame i of n", OpenGame's I2I path **[V]**) for idle and walk | AVR-Agent found models do not exploit rich assets **[S]**; animation is polish, not mechanism | **no video-derived frames:** OpenGame's default I2V path depends on a video model, and the Sora API shut down at OpenAI on 2026-09-24 **[S]** |
| **tilesets, backgrounds** | gpt-image-2 backgrounds at 1536×1024 (low or medium), and tiles from a curated open set (Kenney CC0 **[M]**), auto-tiled in code (OpenGame: ASCII → Phaser JSON with 47-tile blob bitmasking **[V]**) | correctness-critical layout stays in code | |
| **SFX** | **ZzFX** (MIT, < 1 kB, 20 parameters) with a curated **preset bank** of about 40 sounds (correct-soft, wrong-gentle, pop, whoosh, jump, land, level-up, unlock, tick); the LLM picks a preset id per event, never raw parameters | deterministic, offline, tiny, no third-party API **[S]** | wrong-answer sounds are gentle, never buzzers (kids-ux; no punishment) |
| **music** | a small library of procedural loops (WebAudio pattern player) or ABC notation → WAV in the worker (OpenGame's fallback: "ABC notation → WAV via symusic" **[V]**); the default is **off** for anxious or young profiles | Azure has no music model; Toca Boca: "no stressy music" (kids-ux-ages) | music under the teacher's voice must duck. Test on device |
| **voice lines** | Azure TTS (`gpt-4o-mini-tts` or Neural) for instructions and celebrations in the teacher's voice, pre-rendered per spec and cached by text hash | instructions must be voiced for ages 6–8 (Sesame: no text-only help) | the live teacher (realtime) speaks the *teaching*; the game speaks only fixed short lines |

---

## 7. Forge game pipeline (implementable)

### 7.1 Flow

```
Director (lesson state) ──GameBrief──► Forge API (Container App, eastus2)
   │                                    ├─ 1. ROUTE   cache lookup (objective×family×skin) → hit? → G1 fill → deliver (≤ 25 s)
   │                                    ├─ 2. G1 NOW  always build a G1 game first (fallback guaranteed)
   │                                    └─ 3. G2 JOB  if no cached G2 game fits, or the brief asks for novelty:
   │                                           a. DESIGN   taxila-brain → GameDesignDoc (6 sections, schema)
   │                                           b. LEVELS   family generator + solver → levels.json (code, not LLM)
   │                                           c. ASSETS   registry diff → cached packs ∪ new images (parallel)
   │                                           d. BUILD    taxila-codex agent in a sandbox: copy template, write
   │                                                       config, override hooks only (≤ 40 turns)
   │                                           e. GATES    G0–G7; on fail → fixer catalogue → agent repair (≤ 5 rounds)
   │                                           f. PUBLISH  Blob forge/<artifactId>/ (unguessable id) + catalog row
   ◄──── module_ready {artifactId, tier} ── teacher: "chalo, tumhare liye ek game bana hai…"
```

Sandboxing: each G2 job runs in a **Container Apps job** or a dynamic session (Python and Node custom container) with
no network except the Azure OpenAI endpoint and Blob, a CPU/RAM cap and a 20-minute wall clock (`forge-infra-azure`).
Headless Chromium runs in the same container. The image is pinned in ACR with Phaser 3.90, Playwright and rembg baked
in.

### 7.2 Contracts

```ts
// shared/forge.ts (new seam; mirrors contracts.ts conventions)
export type GameFamily = "track-jump" | "grid-path" | "sort-build" | "catch-lane" | "defend-path"
  | "story-choice" | "memory-match" | "sim-challenge";
export type Tier = "G1" | "G2" | "G3";

export interface GameBrief {
  briefId: string;
  childRef: string;                        // opaque id; never a name in prompts or URLs
  objectiveIds: string[]; topicIds: string[];
  mastery: Record<string, number>;         // skill → pKnown (BKT)
  misconceptions: { id: `MC.${string}`; strength: "weak" | "strong" }[];
  interests: string[];                     // mapped to skin packs server-side
  vibe: { pace: "calm" | "normal" | "brisk"; competitive: boolean; timerOk: boolean };
  ageBand: "6-9" | "10-15"; lang: "en" | "hi" | "hi-Latn+en"; numerals: "latn" | "deva";
  deadlineMs: number;                      // when the teacher plans to hand over (e.g. 9 min from now)
  allowG2: boolean;
}

export interface GameSpec {                // G1: the only thing the live LLM writes
  family: GameFamily; kit: `${GameFamily}@${number}`;
  title: { en: string; hi: string };
  skin: string;                            // pack id from the catalog
  levels: LevelSpec[];                     // 3–6; generated by code from these params, LLM never draws grids
  items: Item[];                           // content bank; answers computed by engine maths
  traps: { itemId: string; misc: `MC.${string}` }[];
  feedback: { correct: string; wrong: string; hintLadder: string[] };   // preset ids + short {en,hi}
  pacing: { timer: boolean; levelSeconds: number; lives: null };        // no lives/punishment by default
  endOnSymbol: true;                       // last level is the abstract/symbolic step (R1)
}
export interface LevelSpec { id: string; difficulty: 1 | 2 | 3 | 4 | 5; params: Record<string, number | string> }
export interface Item { id: string; prompt: { en: string; hi: string }; value: string /* engine-typed */ }

export interface GameDesignDoc {           // G2: the GDD, each section feeds one step (OpenGame core.md pattern)
  s0_architecture: { family: GameFamily; scenes: string[]; levelOrder: string[] };
  s1_assets: { styleAnchor: string; registry: AssetReq[] };
  s2_config: Record<string, { value: unknown; type: string; description: string }>;
  s3_entities: { file: string; copies?: string; extends?: string; hooks: { name: string; does: string }[] }[];
  s4_content: { levelGen: Record<string, unknown>; items: Item[]; traps: GameSpec["traps"] };
  s5_roadmap: { op: "COPY" | "UPDATE" | "CREATE"; file: string; section: string }[];
  rubric: { id: string; observable: string }[];   // ~8 items → gate G4
}
export type AssetReq =
  | { type: "image" | "background"; key: string; desc: string; size: "1024x1024" | "1536x1024" }
  | { type: "anim"; key: string; desc: string; frames: { name: string; n: 2 | 3 | 4 }[] }
  | { type: "sfx"; key: string; preset: string } | { type: "voice"; key: string; text: { en: string; hi: string } };

export interface GateReport {
  gate: "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";
  pass: boolean; ms: number;
  failures: { signature: string; file?: string; detail: string; evidence?: string /* blob url of screenshot */ }[];
}
export interface ForgeJob {
  jobId: string; brief: GameBrief; tier: Tier;
  status: "queued" | "designing" | "assets" | "building" | "gating" | "repair" | "published" | "fell_back";
  rounds: number; gates: GateReport[]; artifactId?: string;
  cost: { inTok: number; cachedTok: number; outTok: number; images: number; usd: number };
  timing: Partial<Record<ForgeJob["status"], number>>;
}
```

**Telemetry.** Games speak the existing bridge (`ModuleToHost` in `shared/contracts.ts`: `ready`, `interaction`,
`answer`, `goal_met`, `stuck`, `error`), so the Director, `ModuleEventBuffer` and milestone flush work unchanged:
- `answer` carries `{value, correct}` plus `data.misc` and `data.item`;
- `goal_met.goal` = `level:<id>`;
- `stuck` fires after 20 s idle or 3 failed attempts on one item;
- `interaction` names are namespaced, for example `game.jump`, `game.hint`, `game.replay`.

The base class emits these. Agent code cannot remove them, because G3 asserts them.

### 7.3 The coder agent's prompt (structure, not text)

Ordered by the house law "position is mechanism": rules that must fire go **last**.

1. **Role and environment** (short): sandbox paths; tools (`read_file`, `write_file`, `run`, `list`); a 40-turn
   budget; no network.
2. **Inputs**: GDD path, family id, and the three-layer reading order (OpenGame **[V]**):
   - Layer 1 `template_api.md`;
   - Layer 2 only the `_Template*` and `Base*` files named in GDD §5;
   - Layer 3 the family manual, read last.
3. **Workflow phases**: copy → merge config ("the final JSON MUST still contain `screenSize`, `debugConfig`,
   `renderConfig`") → register scenes → implement hooks → self-review checklist → `npm run build` → `npm run
   test:gates`.
4. **Protocol excerpt**: the 10–20 `debug-skill` entries most often matched for this family, fetched by signature
   frequency.
5. **Hard constraints, last:**
   - never edit KEEP files (`Base*`, `behaviors/*`, `systems/*`, `test/*`, `bridge/*`);
   - never invent hook names, keys or signatures ("if it's not in the source or `template_api.md`, it doesn't exist");
   - every asset key must be in `asset-pack.json`;
   - no child-facing string literals in code (all text comes from `gameConfig` or `items`);
   - no timers or lives unless `pacing.timer` is set.

**Repair round input:** the failing `GateReport` items, plus the matched protocol entries, plus up to 3 screenshots or
one 5 s clip from G2–G4 (GameDevBench: runtime video gives +42% relative **[S]**). On the 3rd failed round, the job
publishes nothing and the child keeps the G1 game. The failure becomes a new reactive protocol entry, so the library
learns. This "living protocol" is worth about +5.9 build-health points in OpenGame **[S]**.

**Deterministic fixer catalogue** (runs before any repair round; v0's autofixer idea):
- snap unknown asset keys to the nearest registry key by edit distance;
- repair a replaced-instead-of-merged `gameConfig.json`;
- add missing scene registrations;
- fix `import { type X }` misuse;
- clamp config numbers to family ranges.

Each fix is logged. More than 3 fixes in one job count as a quality signal against that coder config.

---

## 8. Cost and latency model

Prices:
- `taxila-codex` (gpt-5.3-codex): **$1.75 in / $14 out / $0.17 cached** per M tokens **[S, OpenRouter list price; Azure
  rate assumed equal, U]**.
- gpt-image-2 medium 1024²: about **$0.053**; low about $0.006 (tech-and-market §4 **[V]**).
- Claude Opus 5.5, for comparison only: $4 / $20 per M, cache reads $0.20 (Anthropic first-party; the same rate
  applies on Foundry) **[V: claude-api reference]**.
- `taxila-brain` (gpt-5.6-sol) is not listed here; its token price is **[U]**.

| tier | tokens (est.) | images | compute | **$ per game** | latency |
|---|---|---|---|---|---|
| **G1 fill** | 4k in / 1.5k out on `taxila-fast` | 0 (cached pack) or 1–2 hero | < 10 s CPU (generator + solver + G0/G2/G3 quick) | **$0.01–0.15** | **3–25 s** |
| **G2 build** | design about 20k in / 6k out (sol); coder about 600k in (≈ 80% cached) / 60k out over ≤ 40 turns; 2 repair rounds × 40k in / 8k out | 4–10 new (others cached) | 2 vCPU × 10–15 min (Chromium + build) ≈ $0.05 **[U]** | **≈ $1.5–3.5** (coder ≈ $1.2–1.6; images $0.2–0.5; judges $0.2–0.6; design [U]) | P50 ≈ 8 min, P90 ≈ 15 min **[U]** |
| **G2 on Claude Opus 5.5** (if ever permitted) | same profile | same | same | ≈ $3–6 **[U]** | similar |
| **G3 new mechanic** | 2–5× G2 plus human review | 20–40 | | $10–30 + review time | hours to days |

**Latency budget for G2** (target: ready before the teacher's practice phase, about 10 minutes into the lesson):

| step | P50 | how to keep it down |
|---|---|---|
| design (GDD) | 40 s | structured output; family-specific few-shot GDD |
| levels | 2 s | code |
| assets | 60–90 s, in parallel with the build | packs cached; at most 4 new images in parallel |
| build (agent) | 3–5 min | three-layer reading; the template owns 80% of the code; KEEP files pre-built |
| gates (one round) | 2 min | G0–G3 in 60 s; G4/G5 only once G3 passes |
| repair (expected 1–2 rounds) | 2–4 min | fixer catalogue first |

**Economics.** At about $2.5 per G2 build, a bespoke G2 build per child per lesson is too expensive at scale **[U]**.
Strategy:
- G2 builds are keyed by **(objective × family × skin pack)** and reused;
- each child gets a **G1 re-fill** of a cached G2 game: their numbers, their traps, their language, their pacing;
- a new G2 build runs only on a cache miss. Misses fall as the catalogue grows. Model about 300 objectives × 2
  families × 5 popular skins ≈ 3,000 builds ≈ **$7.5k one-off [U]**, after which a child's game costs G1 money.

---

## 9. Routing: when a game is the wrong medium

Games are for **practice and retrieval of a skill already introduced** (learning-science F6). The Director should
not make a game when:
- the topic is first exposure (teach with an engine or sim plus the voice teacher; "fading" starts concrete);
- the topic is T1 verbatim content where a song or rhyme *about the content* works (learning-science §2.4);
- the topic is a factual or narrative SST topic better served by a story or image (`story-choice` is the exception);
- the child's affect signal is low (the learner model's frustration flag), in which case offer a calm activity.

Other media in the same Forge (summary only; separate docs):
- **sims** use the existing engines;
- **animations** are code (SVG/Phaser tween timelines narrated by TTS), not video;
- **images** use gpt-image-2;
- **worksheets** use a print template filled from the same item bank;
- **songs** are TTS rhythm over procedural beats, about the content.

**Video should not depend on Sora 2** (see §6).

---

## 10. Expected success rates and the measurements that set them

| tier | expected first-attempt pass (all gates) | with fallback, child gets a working game | anchor evidence |
|---|---|---|---|
| G1 kit-filled | **≥ 95%** spec valid on first try, **≥ 99%** after one re-ask; gates ≈ 100% (the engine is pre-tested) | 100% | GamED.AI 90% overall, 96% best mechanic; v0's base error rate about 10% before fixers **[S]** |
| G2 kit-extended | **60–75%** within 3 repair rounds; puzzle-like families (grid-path, defend-path) at the low end | ≈ 100% (G1 already delivered) | OpenGame intent alignment 65.1 (platformer 76.8, puzzle 52.6); Play2Code 66.8%; Google 69.3% **[S]** |
| G3 free-form | **20–35%** reach "excellent"; ≥ 70% "usable" | n/a (offline, reviewed) | WebGameBench 76.9% usable / 20.2% excellent; V-GameGym ≤ 49% **[S/V]** |

These are **priors, not measurements**. Run these in order before relying on them (log each to
`context/measurements.md` with n, method and date):

1. **M1 coder bake-off.**
   - Method: 24 briefs (3 per family), G2 pipeline end to end; `taxila-codex` vs `taxila-brain` as coder (and Claude
     only if the directive changes).
   - Metric: all-gates pass within 3 rounds, $ and minutes per pass.
   - GameASG-Bench says success sets barely overlap across harnesses **[S]**, so also measure "either of two" (run
     both in parallel when the deadline is tight).
2. **M2 G1 validity.** 200 specs across families × ages × languages: schema pass, re-ask rate, G3 pass, Content Safety
   flags, Hindi label quality (native-speaker check on 50).
3. **M3 solver honesty.** For each family, 50 generated levels: does solver-solvable mean a human child can solve it?
   Adult testers first, then children. Also check the difficulty order (level k+1 slower than k).
4. **M4 vision-judge honesty.** 40 builds with **seeded bugs** (occluded answer, off-screen feedback, wrong label,
   broken Devanagari, blank canvas): catch rate and false-alarm rate for G4/G5 on `taxila-brain`. Required before G4
   can block a release.
5. **M5 fun, on children** (only real measure):
   - voluntary replay rate (Again-Again: "would you play this again?"), Smileyometer (Read & MacFarlane Fun Toolkit
     **[S]**);
   - quit-before-level-2 rate and time-on-task;
   - G2 vs G1 vs extrinsic quiz wrapper, within-child, n ≥ 30 children per age band.
   - LLM fun judgments are not a substitute (ρ ≈ .37 **[S]**).
6. **M6 learning.** Pre and post probe on the target misconception (the engine-computed probes from maths-engines §3),
   game vs engine-only practice. Habgood says intrinsic should win; verify on our population.
7. **M7 latency from India.** G1 delivery P95 and G2 P50/P90 from job start to `module_ready`, on eastus2 workers.

**Reverse the strategy if:**
- M1 shows G2 below 45% after 3 rounds: shrink G2 to "re-skin and re-level only" and grow G3 offline;
- M5 shows no replay or learning difference between intrinsic G2 games and G1 wrappers: stop paying for G2 and invest
  in G1 kit breadth;
- M4 shows the vision judge misses more than 30% of seeded bugs: G4/G5 become advisory and human spot-checks gate the
  catalogue.

---

## 11. Tensions with existing Taxila rules, resolved

| rule | tension | resolution |
|---|---|---|
| maths-engines R6 "no seductive details: no confetti, mascots inside an engine" | games want juice, characters and themes | juice is allowed **only on the learning action** (the landing, the cut, the match), carrying information (the gap distance on a miss). Characters and skins sit at the edges of the play area, never inside the number line or grid. Decorative particles never accompany idle states. Measure retention in M6 |
| learning-science rule 27 "no points or coins per completed task" | the owner wants children to "level up" | levels = **mastery stages** of the skill ("Level 3: unlike denominators"), shown informatively. No currency, no streak loss, no unlock shop. Replay is driven by challenge and "beat your best", which is off for anxious profiles |
| R2 "bland concrete objects at the concrete stage" | interest-themed skins (cricket balls as counters) | skins apply at the **pictorial and abstract** stages and to the narrative frame. Concrete-stage counters stay bland per R2 |
| "a model never grades" | games judge answers | correctness is computed by engine or family code from typed values; the LLM only authors items, and every authored answer is recomputed or matched to kit keys (G6) |
| child safety floor | generated text and images | Content Safety on all strings and image prompts; no free-text input in games; no links, no network (CSP `connect-src 'none'`); unguessable artifact ids; the child's name never enters prompts or URLs |

---

## 12. What to fork, what to build, in order

1. **Fork OpenGame's `agent-test/` structure** (Apache-2.0; keep NOTICE):
   - meta-template core, the hook pattern, `gdd/core.md` format, the three-layer reading prompt and the debug
     protocol schema;
   - not its Qwen CLI (Forge's harness is our own Node loop over Azure Responses).
   - Port two families first, **`sort-build`** (highest expected reliability) and **`track-jump`** (most intrinsic
     maths), with the Taxila base layer (bridge, test API, kid UX invariants).
2. **Gates G0–G3 and the fixer catalogue** before any agent work. They also validate hand-built G1 kits.
3. **G1 for the two families** (spec schema, generators, solvers, 5 skin packs). Ship it to lessons.
4. **G2 agent loop** on `taxila-codex`, then M1. Add G4/G5 after M4.
5. Families 3–8, the skin-pack catalogue, then G3 offline exploration (GAVEL-style search over hook combinations,
   scored by solver-measured depth, M5 replay and human review).

---

## Sources

**Production systems**
- Vercel, "How we made v0 an effective coding agent": https://vercel.com/blog/how-we-made-v0-an-effective-coding-agent **[S]**
- Vercel, "Introducing the v0 composite model family": https://vercel.com/blog/v0-composite-model-family **[S]**
- bolt.new system prompt (source): https://raw.githubusercontent.com/stackblitz/bolt.new/main/app/lib/.server/llm/prompts.ts **[V]**
- Beam, "How Lovable and Bolt work": https://www.beam.cloud/blog/agentic-apps **[S]**
- Lovable at the code level: https://howworks.ai/blog/how-lovable-works **[S]**
- Rosebud AI: https://rosebud.ai/ai-game-creator and https://lab.rosebud.ai/learn **[S]**
- Websim overview: https://www.nextbigfuture.com/2024/07/websim-ai-for-ai-building-websites-games-and-more-from-prompts.html **[S]**
- Astrocade: https://gamesbeat.com/astrocade-rolls-out-ai-agent-powered-game-creation-experience-so-anyone-can-create-games/ **[S]**
- Google AI Studio vibe coding: https://www.buildfastwithai.com/blogs/google-ai-studio-vibe-coding-guide **[S]**
- Leviathan et al., "Generative UI: LLMs are Effective UI Generators": https://arxiv.org/abs/2604.09577 **[S]**
- Google Research blog on Generative UI: https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/ **[S]**
- Duolingo, "How Duolingo uses AI to create lessons faster" (2023-06-22): https://blog.duolingo.com/large-language-model-duolingo-lessons/ **[S]**

**Game generation research**
- OpenGame paper: https://arxiv.org/html/2604.18394v1 **[S]**
- OpenGame repo (read: `agent-test/prompts/custom.md`, `docs/gdd/core.md`, `debug-skill/seed-protocol/protocol.json`, `templates/modules/grid_logic/src/scenes/BaseGridScene.ts`, `packages/core/src/tools/generate-assets.ts`; commit c9bea37, Apache-2.0): https://github.com/leigest519/OpenGame **[V]**
- V-GameGym: https://arxiv.org/pdf/2509.20136 and https://aclanthology.org/2026.findings-acl.276/ **[V]**
- ArtifactsBench: https://arxiv.org/abs/2507.04952 **[S]**
- GameDevBench: https://www.emergentmind.com/papers/2602.11103 **[S]**
- Mage: https://arxiv.org/pdf/2605.07342 **[V]**
- WebGameBench: https://arxiv.org/html/2605.17637v1 **[S]**
- PlaytestArena / Play2Code: https://arxiv.org/html/2605.28258 **[S]**
- GameASG-Bench: https://arxiv.org/html/2609.21293 **[S]**
- AVR-Eval / AVR-Agent: https://arxiv.org/abs/2508.00632 **[S]**
- GameGPT: https://arxiv.org/abs/2310.08067 **[S]**
- MarioGPT: https://arxiv.org/pdf/2302.05981 **[S]**
- Word2World: https://arxiv.org/abs/2405.06686 **[S]**
- Hu, Zhao & Liu, "Game Generation via Large Language Models": https://arxiv.org/abs/2404.08706 **[S]**
- Grammar and gameplay-aligned RL for game description generation: https://arxiv.org/pdf/2503.15783 **[S]**
- GAVEL: https://arxiv.org/abs/2407.09388 **[S]**
- ScriptDoctor: https://arxiv.org/html/2506.06524v1 **[S]**
- Real-Time World Crafting: https://arxiv.org/abs/2510.16952 **[S]**
- Gallotta et al., "Large Language Models and Games: A Survey and Roadmap": https://arxiv.org/pdf/2402.18659 **[M]**

**Educational game generation and evidence**
- GamED.AI: https://arxiv.org/html/2604.23947v3 **[S]**
- SINE interactive-fiction serious games: https://www.mdpi.com/2076-3417/16/6/2932 **[S, abstract via search]**
- Habgood & Ainsworth 2011, *J. Learning Sciences* 20(2): https://www.tandfonline.com/doi/abs/10.1080/10508406.2010.508029 **[S]**
- LLM-vs-human ratings of generated game behaviours (ρ ≈ .37): https://arxiv.org/pdf/2510.16952 **[S]**
- Read & MacFarlane, Fun Toolkit: https://www.researchgate.net/publication/220579413_Validating_the_Fun_Toolkit_An_instrument_for_measuring_children's_opinions_of_technology **[S]**

**Assets and platform**
- gpt-image-2 transparent backgrounds (preview): https://community.openai.com/t/transparent-backgrounds-are-now-available-in-preview-for-gpt-image-2-in-the-api/1391541 **[S]**
- ZzFX / jsfxr: https://github.com/chr15m/jsfxr and https://code-garage.com/en/blog/a-sound-generator-in-javascript-for-your-web-games-and-prototypes **[S]**
- @imgly/background-removal (AGPL-3.0): https://www.npmjs.com/package/@imgly/background-removal-node **[S]**
- Phaser size and v4 performance: https://phaser.io/news/2025/05/phaser-v4-release-candidate-4 and https://github.com/phaserjs/phaser **[S]**
- Azure Sora 2 overview (image-to-video, audio, 1–5 min generation, no retirement date stated; updated 2026-06-05): https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation **[V]**
- OpenAI Sora API shutdown on 2026-09-24: https://heydev.us/blog/openai-model-shutdowns-september-2026-audit-your-app and https://community.openai.com/t/release-sora-2-open-weights-before-shutdown/1388719 **[S]**
- gpt-5.3-codex pricing: https://openrouter.ai/openai/gpt-5.3-codex **[S]**

---

## Principal review

**Reviewer stance:** adversarial principal engineer, 2026-10-02. **The question:** will this produce fun, correct,
bug-free games for a 9-year-old within minutes on Azure? **Short answer:** the *strategy* holds up: kit-first, G1 always
delivered, G2 cached, a bot plays every level. Several mechanisms are wrong as written, though. Three would fail on
the first real build: the CSP, the TPM budget and the egress claim. Two would quietly corrupt the learner model:
telemetry the agent can author, and motor slips tagged as misconceptions. The fun design is under-specified.

**New evidence gathered for this review.** Probe: `factory/llm-game-generation-review-probe.mjs` →
`llm-game-generation-review-probe-2026-10-02.json`. All runs from the US build container, n is small, tag **[M]**.
- `taxila-opus` on `…services.ai.azure.com/anthropic/v1/messages` returns **404 `DeploymentNotFound`** (n=1). The task
  brief's "available deployments" list is stale. The doc's Azure-OpenAI-only constraint is correct and stays.
- **`taxila-codex` rate limit headers:** `x-ratelimit-limit-tokens: 500000` and `x-ratelimit-limit-requests: 5000`
  per 60 s. Region: East US 2.
- **codex turn on a 10.9k-token prefix**, writing one ~40-line hook file:

  | effort | wall | output tokens | reasoning tokens |
  |---|---|---|---|
  | low | 3.3 s | 300 | 109 |
  | medium | 4.3–6.5 s | 386–453 | 195–265 |
  | high | 10.9 s | 1,330 | 1,125 |

  n=1 per cell.
- **Prompt caching (identical 10.9k prefix):**
  - Without `prompt_cache_key`: 1 of 3 warm calls hit.
  - With `prompt_cache_key`: 5 of 5 warm calls hit, 10,624 of 10,804 tokens cached.
  - The `remaining-tokens` header dropped by about the full prompt size on cached calls too. The rate limiter appears to
    count cached tokens against TPM **[M, inference from headers, n=6]**.
- **Phaser 3.90 loads images "via XHR as Blobs" by default** (`loader.imageLoadType` default `'XHR'`) **[V:
  `src/core/Config.js`, `src/loader/filetypes/ImageFile.js` @ v3.90.0]**.
- **Azure AI Content Safety harm models were "trained and tested on" 8 languages, and Hindi is not one of them**
  **[V: Learn, region-availability/language section, 2026-09-18]**.
- **Azure prompt caching** **[V: Learn prompt-caching, 2026-08-11]**:
  - extended 24 h retention is available for `gpt-5.3-codex`;
  - on the GPT-5.6 family, **cache writes are billed** and `prompt_cache_key` misses above about 15 requests/min per
    key.
- **GameASG-Bench claims re-checked against the HTML [V]:**
  - L1 checks pass 97.7–99.6%;
  - GPT-6-Astra + Codex CLI reach 26/47;
  - Claude Code and Codex CLI each reach 18, with only 10 tasks in common;
  - the turn-budget result (14.9% → 27.7% → 38.3% at 30/60/120 turns) is **DeepSeek-V4-Flash on Claude Code**, not a
    general result.
- **The ρ ≈ .37 source re-checked [V: arXiv 2510.16952 HTML]:** the raters were **6 human participants**, and they
  rated *player-authored DSL behaviours* on "creative alignment". That is not game fun.

### A. Corrections that change the design

| # | claim in the doc | what is wrong | correction |
|---|---|---|---|
| P1 | §11: "CSP `connect-src 'none'`" | **This breaks every Phaser game at boot.** Phaser 3.90 fetches images (as blobs), JSON, atlases and audio by XHR. Also, Blob Storage cannot set response headers, so CSP can only be a `<meta>` tag, and `<meta>` CSP does not support `frame-ancestors` or `sandbox` | A kit-owned `<meta http-equiv="Content-Security-Policy">` as the **first** child of `<head>`: `default-src 'none'; script-src <artifactPrefix>; connect-src <artifactPrefix>; img-src <artifactPrefix> blob: data:; media-src <artifactPrefix> blob: data:; font-src <artifactPrefix>; style-src 'unsafe-inline'`. Here `<artifactPrefix>` is the **path-scoped** `https://<acct>.blob.core.windows.net/forge/<artifactId>/`, not the whole account origin. Add G2 asserts: zero CSP violations (`securitypolicyviolation` listener) and zero blocked requests |
| P2 | §7.1: the sandbox has "no network except the Azure OpenAI endpoint and Blob" | Not implementable on `taxila-env`. It has no VNet, and `Microsoft.Network` is NotRegistered, so there is no egress filtering (**[V]** in `sandboxes-per-student.md` §2). Dynamic sessions offer only `EgressDisabled` or `EgressEnabled`, with no allowlist | **Brain outside, hands inside** (`coding-agent-harnesses.md` §5): the model loop and the keys stay in the orchestrator. The sandbox runs with egress disabled and node_modules baked into the image (no `npm install` at job time; the agent cannot add dependencies). Chromium gets `--host-resolver-rules` plus Playwright route-abort as defence in depth |
| P3 | §8: the coder costs "about 600k in" over 40 turns | **About 5× low.** A realistic prefix is about 28k tokens: system, `template_api.md`, Base files and GDD. Context grows about 2.5k per turn from reads, logs and output. So Σ input ≈ 40×28k + 2.5k×780 ≈ **3.1M tokens** per build **[U, arithmetic]**. Dollars land close to the doc's anyway (about $1.0 input at 90% cached plus about $0.6 output ≈ **$1.6**), because cached input is cheap | Keep the $ estimate. **Fix the token estimate, because tokens set the next row** |
| P4 | §8: cost is the binding constraint | **TPM is.** At 500k TPM, and with cached tokens apparently counted, one G2 build streaming about 3M tokens through a 5–8 min build needs **400–600k TPM**. **One build can saturate the whole `taxila-codex` deployment.** "Run two coder configs in parallel" halves capacity again. A class-time burst of 50 cache misses would queue for hours | (a) **Context discipline:** each stage (copy/config → hooks → repair) starts a *fresh* context from a handoff note, capped at about 35k tokens. That turns quadratic growth into linear and gets about 1M tokens per build. (b) Request a quota increase, and add a second codex deployment in another region behind the adapter. (c) **A G2 admission controller:** a token-bucket queue on measured TPM. A job whose expected start-to-ready time exceeds `deadlineMs` is never started live; it is queued for the off-peak catalogue build. (d) Set `prompt_cache_key = kit@version:family` and `prompt_cache_retention: "24h"` on codex. Without the key, warm hits were 1 of 3 |
| P5 | §8: build 3–5 min; G2 P50 8 min, P90 15 min | Measured turns are 3–11 s on an 11k prefix, and more at 30k+. 40 turns ≈ 3–6 min of model time alone. Add 8–12 build/test tool calls (tsc 3–6 s, vite 5–10 s, a G3 run 20–60 s): **about 7–11 min for the build stage**. So **P50 is about 12–15 min and P90 is above 20 min**, which hits the 20 min wall clock. The doc's G2 numbers also disagree with `coding-agent-harnesses.md` (p50 6–10 min, $0.6–1.2) | Inner loop on esbuild incremental (< 1 s) with tsc only at `submit()`. Cap at **25 steps** (WebGameBench's best agents used 20–24 turns). Run effort `medium` for writes and `high` only for repair rounds. **State plainly to the owner: G2 cannot reliably land inside one lesson. It is a catalogue builder, and G1 refill is the live personalisation path.** Re-derive P50/P90 from M7, not from this table |
| P6 | §8: the catalogue key is (objective × family × **skin**), ≈ 3,000 builds ≈ $7.5k | The doc itself says skins are data and never change the mechanic, so the skin does not belong in a *code* build key. The estimate also assumes every build passes | Key G2 by **(objective × family × mechanic-variant)**, about **600 builds**, with skins swapped by G1. At 60–75% pass and about 1.5 attempts per success: **≈ 900 attempts × $1.6 ≈ $1.5k [U]**. The real cost is **review**: a catalogue game is served to thousands of children, so it needs G3-grade human review (or at least a sampled review plus the M4-calibrated judge). That is about 600 × 10 min ≈ 100 reviewer-hours. Budget that, not tokens |
| P7 | §5 G3 and §11: "correctness is computed by engine or family code"; "a model never grades" | **In G2, the family code that grades is agent-written.** `checkWinCondition`, `onCellClicked` and `onEntityEnteredCell` are hooks the agent implements. An agent bug that emits `answer{correct:true}` on a wrong landing passes G3 if the bot only plays the solver path. The learner model then records false mastery | Hooks emit **raw facts only**, `{itemId, value}`. `correct` and `misc` are computed by a **kit-owned pure `grade(itemId, value)`** compiled from `items` and `traps`. That function lives in KEEP files, and **the host recomputes it again** from the spec before the Director sees the event. G3 adds a **negative-path sweep**: for each item, inject every distractor and every trap and assert `correct=false` with the right `misc`. The host bridge validates `event.source === iframe.contentWindow` (the origin is `"null"` under sandbox), the zod schema, `itemId ∈ spec`, and a rate cap (≤ 5 answers/s). A runaway loop must not flood BKT |
| P8 | §4: `track-jump`, `catch-lane` ("steer a basket", "dodge") | **A motor slip gets tagged as a misconception.** A 9-year-old who mis-steers the basket under 3/4 produces the same event as one who believes 6/8 ≠ 3/4. That poisons the misconception flags the whole product is built on | **Separate choice from execution.** Every family emits `intent` (what the child selected: a tapped target or a committed lane) apart from `outcome`. Only `intent` is graded. For ages 6–9, a mechanic must never need timing precision to express an answer: the child taps a point and the character jumps there, with physics as cosmetic animation. Where execution can fail (`catch-lane`), a miss is `interaction:game.miss`, never an `answer` |
| P9 | §5: the test API is "stripped from prod bundle" | The shipped artifact is then not the artifact that was tested. Tree-shaking and dead-code differences are exactly where "passes CI, blank on device" bugs live | **Ship the bundle that was tested.** The test API stays in, inert until the host posts a one-time token from the validation harness. Hash the gated bundle; the published bundle must match it byte for byte |
| P10 | §5: `reset(seed)` and `step(ms)` determinism | Agent code that uses `Math.random`, `Date.now`, `performance.now`, `setTimeout` or `requestAnimationFrame` silently breaks seeding and fixed stepping. Then G3 is flaky and its deadlock check fires false alarms | Add these to the G1 AST ban-list *for agent-authored files*. The kit exposes `this.rng` (seeded `Phaser.Math.RandomDataGenerator`) and drives the loop via `game.headlessStep(time, delta)` / `game.step` with `physics.arcade.fixedStep: true`. Run G3 twice with the same seed and require identical state-hash traces |
| P11 | §5 G2: "FPS ≥ 45 median" in headless Chromium, 4× throttle | The container has no GPU. WebGL runs on SwiftShader, so FPS measures the CI box, not a ₹8k Android phone. The gate will flap | Gate on **frame-time regression versus the same family's template baseline** in the same container (≤ 1.3×). Add a **decoded-texture budget**: Σ w×h×4 ≤ 48 MB (gpt-image-2 1024² PNGs decode to 4 MB each; low-end WebViews die above about 100 MB). Add a **first-load payload budget** ≤ 2.5 MB, with sprites downscaled to 2× display size and packed to a WebP atlas. Real-device frame-time checks run on a reference low-end phone in the M7 pass |
| P12 | §5 G1: an "acorn AST ban-list (fetch, eval, …)" | acorn does not parse TypeScript. Ban-lists are also trivially bypassed (`globalThis['fe'+'tch']`, `(()=>{}).constructor('…')`). And CSP does **not** cover WebRTC: `RTCPeerConnection` can beacon out of a sandboxed iframe | Run the scan on **esbuild output of agent-authored modules only**; scanning Phaser would false-alarm. Treat it as a lint. The security boundary is the opaque-origin sandbox (`sandbox="allow-scripts"` only), the path-scoped CSP (P1), no `allow=` permission delegation (the host page holds **microphone** permission for the voice teacher; never delegate it) and banned `RTCPeerConnection`/`WebTransport`. G2 asserts `typeof RTCPeerConnection` was never touched (via an instrumented getter) |
| P13 | §7.1 and `forge-infra-azure`: Blob public read; path `forge/<childId?>/<artifactId>/` | (a) If the container's public access level is `container`, anyone can **list** every artifact, and "unguessable ids" means nothing. (b) Opening the URL top-level runs the game **unsandboxed** on the shared blob origin, with localStorage shared across all games. (c) A per-child path segment links artifacts to a child | Access level `blob`, never `container` (assert it in deploy). No child id in paths. The kit boot refuses to start unless `window.top !== window` **and** a host handshake nonce arrives within 2 s; it shows a "open this in Taxila" card otherwise. Move to API-minted short-TTL SAS URLs when `forge-infra-azure`'s reversal condition fires |
| P14 | §5 G6: "child-facing strings + image prompts → Azure AI Content Safety" | (a) Moderating the *prompt* does not moderate the *image*. (b) Content Safety is not trained on Hindi **[V]**, and romanised Hinglish is weaker still. (c) Content Safety catches toxicity, not the risks that actually matter here: religious and caste imagery, skin-tone stereotypes, flags and maps (India's borders are a legal matter), brand logos, a wrong maths fact in a label | G6 becomes three checks. (1) Content Safety *Analyze image* on every generated image (≤ 4 MB, so downscale first). (2) Content Safety text **plus** a `taxila-brain` closed-rubric classifier for `hi`/`hi-Latn`, plus a curated Hindi/Hinglish blocklist. (3) A VLM cultural-safety rubric on skin-pack art (no deities, religious symbols, caste markers, political maps or real brands). Skin packs are human-reviewed anyway (§6); per-child hero art must pass (1) and (3) before it can swap in |
| P15 | §6: Sora "no retirement date"; transparent background "Azure parity unverified" | Both are superseded by same-day [V] siblings. The Foundry schedule lists `sora-2 2025-12-08` **Preview, retiring 2026-10-15** with no replacement (`video-animation-gen.md` §1). Native `background:"transparent"` returned real RGBA 8/8 on `taxila-image` (`asset-pipeline.md` AP3) | Sora: remove it from Forge lanes (13 days left). Transparency: native first, with a colour-type check that falls back to an adaptive magenta key |
| P16 | §0.5 and §10 M5: "LLM judges of fun correlate weakly (ρ ≈ .37)" | That source is n=6 adults rating DSL behaviours, not fun | Keep the conclusion (fun is measured on children). Downgrade the citation to "weak, indirect evidence". The stronger argument is the doc's own Habgood row plus the Emergence null result ("surprise is distinct from the judge's novelty") |
| P17 | §5 G4: a GUI agent plays from screenshots in "1–3 min" | A vision agent at 3–10 s per step × about 8 rubric items × several steps each is **4–8 min**, and it is the flakiest gate (PlaytestArena: GUI agents fail on timing and low-contrast UI) | **Judge the G3 trace, do not re-play it.** G3 already drives every level through semantic inputs, so capture start, mid and end frames per level plus a frame after each graded input. G4 is then 1–2 VLM calls per level against the GDD rubric (the ArtifactsBench three-temporal-frames recipe) ≈ 30–60 s. A free-roaming GUI agent runs only offline (G3 tier, M4) |

### B. Missing failure modes (add them to gates or the runtime)

1. **G2 lands mid-play.** Never hot-swap a game the child is playing. The teacher offers G2 as "next round". The
   Director owns the handover moment.
2. **No in-game adaptivity.** The spec fixes 3–6 levels. A child who fails level 2 three times needs an easier
   variant *now*, not at the next lesson.
   - Ship the family level generator **client-side** (deterministic, seeded, kit-owned).
   - The kit owns a `difficulty ± 1` rule and the hint ladder.
   - G3 must exercise the *descend* branch as well as the solver path.
3. **Offline and poor networks.**
   - Pre-fetch the artifact into the Capacitor filesystem (or a service-worker cache) when `module_ready` fires.
   - Telemetry buffers locally and flushes later (`ModuleEventBuffer` exists; make sure the iframe → host path queues
     events while the host is backgrounded).
4. **Devanagari rendering.**
   - Phaser `BitmapText` does not shape Devanagari. Ban it for `hi` strings and use `Text` (canvas shaping) or a DOM
     overlay.
   - Await `document.fonts.load()` of the bundled Noto Sans Devanagari before the first frame.
   - G5 checks matras and conjuncts on a fixed test string ("क्षत्रिय, श्रृंखला").
5. **Young children cannot drag.** `sort-build` "drag-drop" contradicts "tap-first at 6–9". Make tap-select then
   tap-target the default input, with drag optional at 8+.
6. **Prompt injection from the child.** `interests` comes from a voice transcript. Only **closed-vocabulary ids**
   (skin-pack ids, interest tags) may cross into the designer or coder prompts or into image prompts. Raw transcript
   text never does. Add an assertion in the brief builder.
7. **A stale catalogue after a kit upgrade.**
   - Cache keys include `kit@version`.
   - A kit bump re-runs G0–G3 (not the agent) on every cached game and quarantines failures.
8. **A cache-write bill on GPT-5.6.** The designer and the judges run on `taxila-brain` (gpt-5.6-sol), where cache
   writes are billed **[V]**.
   - Use `prompt_cache_options.mode:"explicit"` with one breakpoint after the frozen rubric.
   - Measure `cache_write_tokens` in M1.
9. **Fun is unowned.** The rules strip coins, lives, timers and mascots from the play area. Nothing in the pipeline
   then *adds* fun. "Juice" (game feel) is the one thing LLMs are worst at and humans tune by hand. Add a kit-owned,
   human-tuned **feel layer** per family:
   - landing squash and particles, combo feedback on consecutive correct intents;
   - a **surprise beat slot** per level, chosen from a kit catalogue (the platform starts moving, a new hazard rule
     that carries the concept);
   - a finale or "boss" level that is the symbolic step (R1);
   - **cosmetic rewards tied to mastery stages, not currency** (a sticker on the hero for "unlike denominators
     mastered").

   G7 checks that each slot is filled. M5 then tests whether G2's hook novelty beats a G1 game with the same feel
   layer. If it does not, G2 is buying nothing (that sharpens the §10 reversal condition).

### C. What survives review unchanged
- Kit-filled live, kit-extended offline or near-live, free-form offline. The evidence table in §2–§3 supports it, and
  the GameASG figures re-checked [V].
- Solver-backed level generation, and the LLM never draws grids (ScriptDoctor).
- A test API in the template (GameASG's `window.__gameTest` shape re-confirmed [V]), semantic inputs, and G3 before
  any vision gate.
- M1–M7 as the measurement plan. Add **M8: TPM per build and admission queue wait at a burst of 20 concurrent
  misses**, and **M9: the negative-path grading sweep (P7) on 24 seeded-bug builds**: the share of builds where
  agent hooks misreport `correct`.

### D. Revised numbers (replace §0.7 and §8 headline)

| tier | $ per game | wall clock | binding limit |
|---|---|---|---|
| G1 refill (cached G2 or kit) | $0.01–0.15 | 3–25 s | none at expected volume |
| G2 build (catalogue miss) | ≈ $1.2–2.0 on codex **[U; tokens per P3, measured turn costs]** | P50 ≈ 12–15 min, P90 > 20 min **[U; from measured 3–11 s turns]** | **TPM: about 1 concurrent build per 500k-TPM deployment** until P4(a) is in |
| G2 catalogue (≈ 600 keys) | ≈ $1.5k tokens + about 100 reviewer-hours | an off-peak batch | human review |

**Context to log (proposed, `context/inbox/`):**
- measurement `codex-turn-latency-cache-2026-10-02` (the numbers above, n as stated);
- rejection `csp-connect-none-phaser` (breaks the XHR loader);
- decision `forge-g2-admission-by-tpm` (reverse if the codex quota is ≥ 2M TPM or measured tokens per build are
  ≤ 1M);
- decision `forge-grade-in-kit-not-hooks` (reverse never; it is the "a model never grades" law applied to
  agent-written code).
