# Forge QA gate: automated validation of generated games, sims and media

**Date:** 2026-10-02 · **Question (auto-validation-qa):** how Forge proves a generated game or app is correct, playable,
fast on a low-end Android phone, accessible, safe for a child and pedagogically right, *before* a child opens it; and
how failures drive the repair loop.

**Builds on (not repeated):**
- `tech-and-market.md` §3.3–3.6: schema-first, golden tests, sandbox and bridge, Google's 3.5% → 69.3% critique loop.
- `factory/llm-game-generation.md` §5, §7, §10: gate ladder G0–G7, `__taxilaTest` API, fixer catalogue, M1–M7.
- `factory/coding-agent-harnesses.md` §5.2–5.6, §6: stages S0–S6, validators V0–V7, `__forge` keypoint seam,
  repair-loop pseudocode, M-F1–M-F5.
- `factory/sandboxes-per-student.md` §5: the trusted and untrusted lanes, Chromium hardening, and the FPS-gate risk.
- `content/game-mechanics.md` §3.4: the integration lint L1–L9.
- `content/maths-engines.md`: R1 (stages), R6 (no seductive details), R10 (deterministic `getState`/`setState`).
- `data/kits/SCHEMA.md`: verified answer keys from a blind solver.

| tag | meaning |
|---|---|
| **[V]** | verified today against the primary source (repo source, vendor doc, paper HTML) |
| **[S]** | secondary: abstract, HTML summary or vendor blog, not checked line by line |
| **[M]** | from memory of the literature, not re-checked this session |
| **[U]** | our design hypothesis or estimate. It must be measured (see §13) before Forge relies on it |

**Constraints that shape this design.**
- **Models.** The brief lists `taxila-opus` and `taxila-sonnet`. `Taxila/CLAUDE.md` (owner directive, 2026-10-02) and
  `context/decisions.md#azure-only-compute` say both deployments were **deleted** and that Marketplace models are not
  allowed. Every judge below therefore runs on first-party deployments by default (`taxila-brain` for vision and
  rubrics, `taxila-fast` for cheap classification). §7.4 names where a cross-family Claude judge would help, as a
  reversal condition and not as a dependency.
- **Two earlier docs disagree.** Their gate ladders (G0–G7 vs V0–V7) and test seams (`window.__taxilaTest` vs
  `window.__forge`) differ. **This doc supersedes both with one ladder (Q0–Q10) and one seam (`__forge` v1, §3).** The
  name mapping is in §2.2.

---

## 0. TL;DR (decisions)

1. **Verifiers come in three classes, and only one of them may block on its own.**
   - **Programmatic oracles** (state assertions, solvers, answer-key matching, geometry, perf counters) are the
     backbone. GameGen-Verifier's state-injection keypoints reach **92.2% Acc@5 vs 58.8%** for agent-as-verifier, and
     run **16.6× faster** **[S]**.
   - **Model judges** catch what code cannot see. Measured judges are imprecise:
     - AgentRewardBench: no LLM judge exceeds **70% precision**, so about 30% of failures are called successes **[S]**;
     - VideoGameQA-Bench: visual regression best **45.2%**, UI unit testing best **40%**, with "high false-positive
       rates" **[S]**;
     - GlitchBench: GPT-4V **43.4%** **[S]**;
     - the project's own `vision-fab` measurement: gpt-5.6 luna/terra "read part, assert the rest" **[V harvest]**.
   - **GUI play agents** agree with humans at κ 0.64, close to human–human κ 0.66, but fail at timing and at small or
     low-contrast UI (Play2Code) **[S]**.

   **Rule:** a judge verdict blocks only when it is *grounded* (its evidence cross-checks against the game's own
   snapshot; §7.2), and only on criteria where the judge has measured precision ≥ 0.9 on our mutant corpus (§8).
2. **Make "visual" checks programmatic wherever possible.** The kit's test seam exports each entity's bounding box,
   role, text, font size and colours. Off-screen, occlusion, overlap, text overflow, touch-target size, contrast and
   blank frames then become geometry and pixel arithmetic, not vision-model opinions. That moves most of
   `llm-game-generation`'s G5 "polish" checks from a judge to code (§4.7). The vision judge keeps only what is
   semantic: is the feedback understandable, is the art coherent, does a sprite look scary, is the goal obvious
   without reading.
3. **Bots play every level, and they play as personas, not as one perfect player.** The bot set (§4.5):
   - `replay`: the planner's solution;
   - `solver`: the family's independent solver;
   - `misc`: one bot per misconception path;
   - `novice`: noisy, idles, uses hints;
   - `fuzz`: random legal actions plus raw-pointer gremlins;
   - `speed`: rapid taps;
   - `interrupt`: pause, background, resize, reset.

   This follows game-testing research: goal-driven and human-like agents find different bugs (Ariyurek et al.: 45 seeded
   bugs **[S]**), and RL or exploration agents find exploits and stuck spots (Bergdahl et al., CoG 2020 **[S]**).
   Solvability is proved two ways: replay *and* the independent solver. Softlocks are found by calling the solver from
   mid-game states the novice bot reached.
4. **Pedagogy is gated by keys, not by opinion.**
   - Every item answer is engine-computed, or matched to a kit item whose `verified.agrees === true`, or agreed by two
     independent blind solves. Otherwise the item is dropped.
   - The game's *grader* is itself tested, table-driven from the kit:
     - every `acceptable` form must be accepted;
     - every misconception distractor must be tagged with its `MC.*` id;
     - random wrong values must be rejected.
   - Every level maps to brief objectives, and every objective has a level.
   - The pedagogy LLM rubric (intrinsic integration, scaffold, abstract end) is advisory except for two grounded
     items (§4.6).
5. **Performance is gated on a *calibrated* runner and on relative regression. It is not gated on raw headless FPS.**
   - Headless Chromium in a GPU-less container renders WebGL through SwiftShader. Chromium says SwiftShader WebGL needs
     `--enable-unsafe-swiftshader` and "is not intended for running untrusted content" **[V]**.
   - FPS there therefore measures the CPU rasteriser, not the phone.
   - Gate on main-thread frame cost, long tasks, input-to-feedback latency, heap growth and payload. Measure these at a
     CPU-throttle rate calibrated so the runner's benchmark matches a reference low-end Indian Android phone
     (Lighthouse's `benchmarkIndex` method **[V]**).
   - Gate on regression vs the kit template's own baseline in the same container.
   - Absolute FPS is checked on real phones through Playwright's Android WebView driver at mechanic promotion
     (§4.8).
6. **Content safety needs a Hindi layer that Azure does not provide.**
   - Azure AI Content Safety harm models were "trained and tested" on 8 languages. **Hindi is not one of them**, and
     prompt shields and custom categories were tested in English only **[V]**.
   - Forge's text check is therefore three things:
     - Content Safety at a **child threshold (block at severity ≥ 2)**;
     - a custom Hindi/Hinglish blocklist;
     - a `taxila-brain` child-suitability classifier for every `hi` and `hi-Latn` string, until §13 QA-M4 says
       Content Safety alone is good enough.
   - Image checks are Content Safety on images (it returns only levels 0/2/4/6 **[V]**), plus OCR for stray text, plus a
     vision check for real-person likeness, logos, religious symbols used as props, and age-band scariness.
7. **The repair loop is driven by the gate (diagram in §6).**
   - Every finding gets a stable **signature**, so failures can be matched to known fixes.
   - Order of repair:
     - deterministic fixers run first;
     - then debug-protocol lookup;
     - then a builder round with a **minimal evidence pack**: first failure per gate, ≤ 3 event-triggered frames,
       the trace tail.
   - After a repair, only the gates whose inputs changed re-run, plus a regression subset.
   - Caps: 5 logic rounds and 2 polish rounds.
   - When the same signature fails 3 times, stop and switch to the builder's alternate model for one round.
   - A level that cannot be fixed is trimmed. A build with fewer than 3 green levels falls back to G1.
8. **Defend against the builder gaming the gate (Goodhart).**
   - The builder cannot edit tests: `KEEP` hashes, read-only `tests/`.
   - It never sees judge prompts or thresholds, only findings.
   - **30% of keypoints and all fuzz seeds are held out** until the final gate.
   - The judge is never the builder's model (self-preference bias, Panickssery et al. 2024 **[M]**).
9. **The gate is tested like code.**
   - A **mutant corpus** of 18 operators is applied to golden games: flip the answer check, drop `goal_met`,
     cover the answer, shrink a button, break Devanagari, leak memory, and others (§8).
   - Each mutant class is measured for gate recall, and false alarms are measured on clean builds.
   - The corpus re-runs whenever the kit, a judge model, a prompt or a threshold changes.
   - Gate flake rate must be **0** on deterministic checks. A check that disagrees with itself on the same seed is
     reported as a `NONDETERMINISM` finding against the game.
10. **Cost and latency [U].**
    - A full Q0–Q10 pass on a G2 build costs about **2–3 min and $0.15–0.35**: roughly $0.01 compute, under $0.01
      Content Safety, and $0.10–0.30 for judges.
    - Repair rounds re-run incrementally, in about 40–90 s.
    - The G1 live fast path (kit code plus new data) runs Q0, Q2-lite, Q3, Q4-lite, Q5, Q6-geo and Q8-text in about
      **5–8 s** on the warm trusted pool, with no vision judge.
    - QA is about 10% of a G2 build's cost. That is cheap insurance: one bad game reaching a child costs far more
      in trust.

---

## 1. Evidence: what each evaluator kind can be trusted with

| evaluator (source) | what it does | measured reliability | what Forge takes |
|---|---|---|---|
| **Google, Generative UI for Education** (arXiv 2609.20738) | plan → K = 5 leveled goals (concrete, clear, growing, scaffolded) → generate → critique and refine on **visual, solution, telemetry, mechanical** axes, over code *and* the Chrome render | single prompt passes all critiques **3.5%**; after 10 rounds **69.3%**; improvement per axis is non-monotonic ("delicate interplay"); experts accept **86%** of 40; biology weakest **[S, HTML]** | the four axes become Q3/Q4 (solution, mechanical), Q2/Q5 telemetry, Q6/Q9 visual. Non-monotonic means **regression guards are required**: a fix on one axis breaks another. The paper does not say how the solution critique is executed or how hallucinated critiques are handled **[S]**, so Forge must specify both |
| **Google Generative UI** (generativeui.github.io; Google Research blog, 2025-11) | full HTML from detailed system instructions, plus **post-processors** that "fix a set of common issues that couldn't be fixed with the system instructions alone" | Elo 1736 and preferred over everything except human experts, "at least comparable in 50% of cases"; **speed excluded from the evaluation** **[S]** | deterministic post-processors (our fixer catalogue, §6.3) are standard practice at Google scale, not a hack |
| **GameGen-Verifier** (arXiv 2605.07442) | spec → Hoare-style keypoints (P, a, Q); inject state P through the JS runtime or CDP; run a bounded action sequence a; assert Q by program **and** VLM on screenshots | **92.2% Acc@5, 95.4% F1@5** vs ≤ **58.8%** for coverage-enforced agent-as-verifier; **16.6×** faster; "keypoint extraction is not guaranteed to be complete"; misses long traversals and emergent bugs **[S]** | Q3 is this method. Its stated blind spot (long traversals, emergence) is exactly what the Q4 persona bots are for |
| **Play2Code / PlaytestArena** (arXiv 2605.28258) | GUI agent plays at 1280×720 with real mouse and keys; 5 phases; per-game rubric of ~7.7 observable criteria; returns a report plus a fix list that the builder treats "as advice rather than instruction" | per-criterion agreement **84.2%**, κ **0.64** (human–human 0.66), game-level ρ 0.87; platformer pass@10 0.66 vs human 0.87; 93.5% stop within 5 rounds **[S]** | the GUI playtest is valid for *ranking* and for discoverability. It is not the logic oracle. Its findings are advisory fixes. Run it at mechanic promotion and on a 5% audit sample (§4.10) |
| **ArtifactsBench** (arXiv 2507.04952) | Playwright at 1024×768; **3 staged screenshots** (before, during, after scripted interaction) + code + 10-dimension checklist; MLLM referee | 94.4% ranking consistency with WebDev Arena; expert agreement **79.06% with 1 frame → 90.95% with 3**; code-awareness helps **[S]** | the judge always gets ≥ 3 frames per level *and* the source excerpt. Forge improves on this with **event-triggered** frames (§7.1) |
| **WebGen-Bench** (arXiv 2505.03733) | WebVoyager UI agent executes written test cases (≤ 15 actions) → YES / NO / PARTIAL; GPT-4o grades appearance 1–5 | agent vs human agreement **86–94%**; best generator only **27.8%** of test cases; manual testing would cost 10.8 h / $378 per run **[S]** | UI agents executing *written test cases* are reliable enough to rank builds. We go one step further and execute them semantically through `act()` |
| **WebArena evaluators** (`evaluation_harness/evaluators.py`) | `StringEvaluator` (`exact_match`, `must_include`, LLM `fuzzy_match`), `URLEvaluator`, `HTMLContentEvaluator` (JS locator on final page state); `EvaluatorComb` **multiplies** scores | design reference **[V source]** | **conjunctive gates over final state**: a program reads state through a locator; LLM matching only where semantics need it, and the result is still multiplied in |
| **AgentRewardBench** (arXiv 2504.08942) | 12 LLM judges vs expert labels on 1,302 web-agent trajectories | best precision **69.8%**, recall 83.1%; rule-based evaluators **under**-report success (WebArena 25.6% vs expert 42.3%); screenshots + a11y tree *together* scored lower than screenshots alone **[S]** | judges are too lenient to ship on alone; rules are too strict to reward novelty. **Rules block; judges explain.** Do not dump every modality into one judge call |
| **VideoGameQA-Bench** (arXiv 2505.15952) | VLMs on game QA: visual unit tests, UI unit tests, visual regression, glitches, needle-in-haystack, bug reports | visual unit test best 53.0%, UI unit 40.0%, visual regression 45.2%, image glitch 82.8%, video glitch 78.1%, clipping 87.8%, needle-in-haystack 36.0%, bug report 54%; "high false-positive rates"; weak on fine detail and object placement **[S]** | VLMs are decent at "is something obviously broken" and poor at "is this exactly as specified". Exact layout goes to geometry checks (Q6) |
| **GlitchBench** (arXiv 2312.05291) | LMMs asked what is wrong in real game glitch frames | GPT-4V **43.4%**; a 27.7-point swing between two phrasings of the question **[S]** | judge prompts must be **criterion-specific**, never "anything wrong?". Measure prompt sensitivity (§8) |
| **BALROG** (arXiv 2411.13543) | LLM/VLM agents on games | "several models perform worse when visual representations … are provided" **[S]** | our bots act on **semantic state** (`legalActions()`), not pixels |
| **Agent-as-a-Judge** (arXiv 2410.10934) | an agent with tools inspects the artifact and its intermediate steps | "dramatically outperforms LLM-as-a-Judge", about as reliable as humans on DevAI (55 tasks, 365 requirements) **[S]** | a judge that can *query state* (our grounded cross-check, §7.2) beats a judge that only looks |
| **Ariyurek et al. 2019** (arXiv 1906.00317); **Bergdahl et al. CoG 2020** (arXiv 2103.15819) | synthetic goal agents and human-like (IRL) agents; DRL testing agents | both agent types "compete with human testers" on 45 seeded bugs; DRL finds exploits, stuck spots and difficulty issues **[S]** | persona bots (§4.5); difficulty validation by bot cost |
| **Project harvest `vision-fab`** (2026-08-11, n = 12 screens, 160 calls) | fabrication test of vision models on real screenshots | gpt-5.6 luna/terra read 3–4 of 9 messages, reported nothing illegible, and asserted content that was not there (1–2 fabrications / 32) **[V harvest]** | every judge verdict must quote evidence that can be checked. Use `taxila-brain` (sol), never luna, for vision. Re-run vision-fab on game frames (QA-M3) |

**Principles that follow (cited by number below):**
- **QP1** Code is the oracle wherever an oracle can be written.
- **QP2** Judges must quote and point; ungrounded claims never block.
- **QP3** Use semantic actions for logic and pixels only for appearance.
- **QP4** Use several weak testers with different biases rather than one strong one.
- **QP5** Every gate has a measured recall and a measured false-alarm rate, or it does not block.
- **QP6** Regressions are checked on every round, because improvement is non-monotonic.
- **QP7** Hold out part of the test set from the builder.
- **QP8** Determinism is a correctness property of the game, not a convenience of the test.

---

## 2. The gate at a glance

### 2.1 Ladder (cheapest first; within a tier, every check runs so one repair round can batch its fixes)

```
 tier  gate  what                                         oracle               blocks?  lane   time (G2)
 ───── ───── ──────────────────────────────────────────── ──────────────────── ──────── ────── ─────────
 A     Q0    spec + contract (zod, ranges, keys, coverage) code                 hard     T/U    < 1 s
 A     Q1    static (tsc, AST ban list, KEEP hashes, size) code                 hard     U      3–8 s
 B     Q2    boot + runtime hygiene (console, net, CSP)    browser events       hard     U      8–15 s
 B     Q3    keypoints (state-inject → act → assert)       code                 hard     U      5–20 s
 B     Q4    bot players (7 personas), solvability, curve  code + solver        hard     U      20–60 s
 B     Q5    pedagogy + answer truth (kit keys, grader)    code (+ LLM advis.)  hard     T/U    2–10 s
 C     Q6    geometry + accessibility (bbox, contrast, axe) code + pixels       hard     U      10–20 s
 C     Q7    performance (calibrated throttle, regression) counters             hard*    U      20–40 s
 C     Q8    content safety (text, image, audio, IP)       service + LLM        hard     orch.  3–10 s
 D     Q9    judged quality (vision judge, grounded)       VLM, cross-checked   blocker† orch.  30–60 s
 D     Q10   publish checks + regression + canary          code                 hard     orch.  5 s (+ live)
 *  absolute FPS is advisory in the container and hard only on the real-device lane (§4.8)
 †  only grounded findings on criteria with measured precision ≥ 0.9 (§7.3)
```

Tier A failures stop the run: nothing else is meaningful. Tier B runs only if A is green, C only if B is green. Tiers C
and D run in parallel, because they share the same recorded bot trajectories and frames (§4.5).

### 2.2 Name mapping (supersedes the two earlier ladders)

| Q | llm-game-generation | coding-agent-harnesses | game-mechanics lint |
|---|---|---|---|
| Q0 | G0 | S1 zod | — |
| Q1 | G1 | V0, V1 | L2 (static part), L3 |
| Q2 | G2 (boot part) | V2 (boot part) | — |
| Q3 | G3 (asserts) | V3 | L1 |
| Q4 | G3 (solve, deadlock) | V4 | L9b, L5/L8 runtime |
| Q5 | G6 (truth), G7 | V6 (rubric) | L6, L9a |
| Q6 | G5 (most of it, now as code) | V5 (checklist items that are geometric) | L4 |
| Q7 | G2 (FPS part) | V2 (FPS part) | — |
| Q8 | G6 (safety) | V6 (safety) | — |
| Q9 | G4, G5 (semantic part) | V5 | — |
| Q10 | publish in §7.1 | S6, V7 | — |

### 2.3 Which artifact runs which gates

| artifact | gates | notes |
|---|---|---|
| G1 kit-filled game (live, trusted lane) | Q0, Q2-lite (1 viewport, no throttle), Q3, Q4-lite (replay + misc + fuzz 20 s), Q5, Q6-geo, Q8-text | ≤ 8 s **[U]**. The kit code was fully gated at promotion; only the data is new. New skin images never enter the live path (prereviewed packs) |
| G2 kit-extended build (per brief, untrusted lane) | all Q0–Q10; Q9 vision judge on event frames; no GUI agent | ships automatically when the decision (§5.3) is `ship`/`ship_partial` |
| G3 new mechanic / template promotion | all, plus Q4 GUI playtest, Q7 on real phones, human review (teacher + child-safety reviewer) | becomes a kit family and is then reused by G1/G2 |
| reskin of a published G2 (S0 hit) | Q0, Q2-lite, Q3 subset, Q6-geo, Q8 (new strings/images only) | from `coding-agent-harnesses` M-F5: measure before it skips more |
| image, animation, audio, worksheet | §9 | same report shape |

---

## 3. The test seam: `window.__forge` v1 (one API, in the kit, never written by the builder)

Each base scene in the kit implements this interface. It is compiled only into validation builds, and the publish
step (Q10) asserts that it is **absent** from the production bundle. It merges `__taxilaTest`
(`llm-game-generation`) with `__forge` (`coding-agent-harnesses`) and adds the members that QA needs: `legalActions`,
entity geometry, and metrics.

```ts
// packages/forge-kit/core/src/test/forge-api.ts   (KEEP file; hash-checked by Q1)
export interface ForgeTestAPI {
  version: 1;
  reset(seed: number): void;                    // seeded RNG + fixed-step clock (maths-engines R10)
  levels(): string[];                           // LEVEL_ORDER
  loadLevel(id: string): void;
  getState(): object;                           // serialisable; setState(getState()) must be a no-op (Q3 round-trip)
  setState(s: object): void;                    // GameGen-Verifier state injection
  act(a: Action): ActResult;                    // semantic input, same code path as the pointer handler
  legalActions(): Action[];                     // the action space at this instant (bots, fuzzer, softlock search)
  step(ms: number): void;                       // advance fixed-step simulation; rendering is driven separately
  snapshot(): GameSnapshot;
  events(): BridgeEvent[];                      // bridge v2 events since reset, in order, with seq
  solve?(from?: object): Action[] | null;       // family solver; null = provably unsolvable from that state
  metrics(): { frameMs: number[]; longTasks: number; rafCount: number; textures: number; heapMB?: number };
}
export type Action = { type: string; [k: string]: string | number | boolean };   // e.g. {type:"drop",item:"i3",bin:"gt_half"}
export interface ActResult { accepted: boolean; reason?: "illegal" | "paused" | "animating"; events: number[] /* seqs */ }
export interface GameSnapshot {
  level: string; status: "intro" | "playing" | "won" | "failed" | "paused";
  stage: "concrete" | "pictorial" | "abstract";
  attempts: number; hintsShown: number; stateHash: string;
  goalsMet: string[];
  viewport: { w: number; h: number; dpr: number; safe: [number, number, number, number] };
  entities: Entity[];
}
export interface Entity {
  id: string; kind: string;
  role: "target" | "control" | "text" | "feedback" | "decor" | "hud";
  bbox: [number, number, number, number];       // CSS px, viewport space, after camera transform
  visible: boolean; interactive: boolean; z: number;
  text?: { value: string; lang: "en" | "hi" | "hi-Latn"; px: number; weight: number; fg: string; bgHint?: string; maxW?: number; wrapped: boolean };
  semantic?: { itemId?: string; value?: string; misc?: string; colourCodes?: string };   // what this entity means
}
```

**Kit obligations, checked by Q1 and Q3 and not by trust:**
- `act()` and the pointer handler call the same `dispatch()`. Q3 checks this by replaying the same action once via
  `act` and once via `page.mouse` at the entity's bbox centre, and asserting the same `stateHash`.
- The progress reducer is pure `(state, VerifiedAct) → state` (lint L2).
- All visible text comes from `levels.json`/`gameConfig` (V6). The builder cannot write string literals into scenes;
  Q1 checks this with an AST rule that rejects string literals passed to text constructors.
- Time is the fixed-step clock, never `Date.now()`. The runner additionally installs Playwright's clock, which
  overrides `requestAnimationFrame` and `performance` **[S, Playwright docs]**, so tweens and timers are controllable
  at 20–50× real time.

---

## 4. The gates in detail

### 4.1 Q0 Spec and contract (code, < 1 s)

- `GameSpec`/`GameDesignDoc` parse with zod in strict mode. Numbers are clamped by family ranges, never trusted.
- Every asset key is declared. Every level has `objectiveIds ⊆ brief.objectiveIds`, a `solution`, ≥ 1 `miscPath` when
  the brief has a strong misconception, and ≥ 3 keypoints.
- **Coverage:** every brief objective is covered by ≥ 1 level.
- **Locales:** every string exists in every locale the brief needs (`en`, `hi`, `hi-Latn`). Numerals match
  `brief.numerals`.
- **Held-out split** (QP7): the harness moves 30% of keypoints (stratified per level) and all fuzz seeds into
  `/qa/heldout`, which the builder cannot read. They run only at the final gate. If the held-out pass rate is
  > 15 pp below the visible pass rate, that is an overfitting signal and is logged against the recipe **[U]**.

### 4.2 Q1 Static (code, 3–8 s)

- `tsc --noEmit` and an esbuild bundle. The bundler exits 0 on type errors (the same lesson as Meera's
  `verify-release`), which is why tsc runs separately.
- **acorn AST ban list:** `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `eval`, `Function`, dynamic
  `import()`, `importScripts`, `localStorage`/`sessionStorage`/`indexedDB`, `document.cookie`, `window.open`,
  `location` writes, `top`/`parent`/`opener` (except the bridge module), `navigator.sendBeacon`, `Worker` from blob,
  `Math.random` (use the kit RNG), `Date.now`/`new Date` in game code, and string literals into text APIs.
- **`KEEP` file hashes unchanged:** `Base*`, `behaviors/*`, `systems/*`, `test/*`, `bridge/*`, `qa/*`.
- **Size:** per-game code plus data ≤ 300 kB gz, assets ≤ 1.2 MB, total transfer ≤ 1.5 MB. The kit runtime (Phaser
  plus core) is versioned, shared and precached by the app, so it is excluded **[U]**.
- **Scene and asset consistency:** scene keys ⊆ main ∩ `LEVEL_ORDER`; code asset keys ⊆ `asset-pack.json`. Unused
  assets are a minor finding.

### 4.3 Q2 Boot and runtime hygiene (browser, 8–15 s)

Viewports: 360×640 DPR 2 (the low-end Indian Android baseline **[U]**) and 412×823 DPR 1.75 (Lighthouse's Moto G
Power profile **[V, constants.js]**).

The runner serves `dist` from `127.0.0.1` with the production CSP (`connect-src 'none'`) and the host resolver rules
from `sandboxes-per-student` §5.3. The page is loaded inside a **host harness page** that mounts it in the same
sandboxed iframe as the app (`sandbox="allow-scripts"`). The real bridge `init` runs with a nonce, so bridge bugs show
up here, not on a child's phone.

| check | how | pass |
|---|---|---|
| ready | first bridge `ready` event | ≤ 3 s at the calibrated throttle (§4.8) |
| console | `page.on('console')` type error/warning; `page.on('pageerror')`; `unhandledrejection` hook | 0 errors, 0 page errors; warnings ≤ 3, and each must match an allowlist signature (for example the SwiftShader deprecation notice) |
| network | `context.route('**/*')` aborts all non-local requests; `requestfailed` is recorded | 0 attempted non-local requests (any attempt is a **blocker**, signature `NET.EGRESS`) |
| CSP | `securitypolicyviolation` listener injected into the frame | 0 violations |
| GPU | `webglcontextlost` listener; Phaser renderer type recorded | 0 lost contexts; the renderer is recorded in the report |
| blank frame | screenshot luminance stddev, and the share of pixels ≠ the background colour | stddev > 4 and > 2% of pixels differ, at t = ready + 500 ms |
| bridge schema | every event zod-parses as bridge v2 (`maths-engines` §3.2); rate ≤ 20 events/s | 100% valid |
| round trip | `setState(getState())` leaves `stateHash` unchanged on every level | 100% |
| audio policy | no `AudioContext` before the first user gesture; music off by default for `vibe.pace=calm` | yes |

### 4.4 Q3 Keypoints (code, 5–20 s, parallel pages)

GameGen-Verifier's procedure **[S]**, run through `__forge`:

```
for kp in keypoints (visible ∪ held-out at final gate):
  page = pool.take();  api.reset(seed); api.loadLevel(kp.level); api.setState(merge(base, kp.setup))
  for a in kp.actions: r = api.act(a); assert r.accepted || kp.expectRejected; api.step(kp.dt ?? 100)
  for q in kp.assert: check(q, api.getState(), api.events(), api.snapshot())   // eq|gt|lt|includes|emitted|absent
  on fail: screenshot + last 20 events + state diff → finding  sig = `KP.${kp.id}.${q.op}`
```

The planner writes keypoints from the spec. The harness adds **generated keypoints** that every game must pass:
- **correct answer:** emits `answer{correct:true}` and changes progress;
- **wrong answer:** emits `answer{correct:false}`, progress unchanged, a feedback entity becomes visible within 300 ms
  of game time;
- **misconception distractor:** emits `misc_signal` with the right `MC.*`;
- **hint:** the ladder advances one step per request, up to 4;
- **win:** `goal_met{goal:"level:<id>"}` fires exactly once;
- **pause:** no state change while paused.

### 4.5 Q4 Bot players: solvability, robustness, difficulty (code + solver, 20–60 s)

All bots act through `act()`/`legalActions()` (QP3). The runner records each trajectory as `(seed, actions, events,
stateHashes, event-triggered frames)`, and Q6, Q7 and Q9 reuse these recordings.

| bot | policy | asserts | catches |
|---|---|---|---|
| `replay` | the planner's `LevelSpec.solution` | every level reaches `won`; each misc path emits its misc and does **not** win | wrong win condition, off-by-one, misc not tagged |
| `solver` | `solve()` from level start, *independent of the planner* | non-null on every level; its plan, replayed, wins | unsolvable levels the planner believed were solvable (planner and solver disagree → blocker `SOLVE.DISAGREE`) |
| `novice` | 20 seeds; p(correct) 0.6 → 0.8 by level; idles 25 s once; asks for hints; repeats a wrong answer | completes L1 in ≥ 80% of seeds; `stuck` emitted after the idle; no `failed` state without a free retry; no softlock (below) | punishing loops, missing stuck events, retry bugs |
| `misc` | answers consistent with one misconception, for each `MC.*` in the brief | every trap fires its `MC.*`; feedback visible; never wins via misconception answers | traps without diagnosis; a misconception that can win |
| `fuzz` | 3 held-out seeds × 120 s game time: random `legalActions()`, plus 60 s of raw pointer and touch chaos (gremlins.js style, MIT **[V licence]**) at random coordinates, multi-touch, drag-off-canvas | **progress stays 0** (lint L9b, no brute force); 0 errors; `stateHash` changes when acts are accepted; no frame > 500 ms | crashes in input handlers, brute-forceable locks, exceptions on edge input |
| `speed` | 10 taps/s on the current target | no double scoring (one `answer` per item attempt); `rapid_guess` flagged; no stacked tweens | race conditions, duplicate events |
| `interrupt` | at random points: pause/resume, `visibilitychange` hidden 5 s, resize 360 → 412 → 360, host `reset`, `AudioContext` suspend | state preserved or cleanly reset; `rafCount` ≈ 0 while hidden; layout re-flows (Q6 re-run on that frame) | Android backgrounding bugs, resize breakage, battery drain |

**Softlock search.** Sample 20 states from the `novice` and `fuzz` trajectories. From each, `setState(s)` and then
`solve(s)`:
- it must return non-null; or
- a visible `control` entity with `semantic.value === "retry"` must exist.

Otherwise the finding is `SOFTLOCK` (blocker), with the state attached. Without a solver (rare families), run a
bounded BFS over `legalActions()` to depth 12 with state-hash dedup **[U]**.

**Difficulty curve.** For each level, compute `cost = |solver plan| × mean branching(legalActions)`, plus
family-specific terms (number magnitude, distractor count, unlike denominators, and so on). Rules:
- cost must be non-decreasing across `LEVEL_ORDER`, allowing one plateau (minor finding otherwise, major if
  level k+1 is easier than level k − 1);
- L1 must be the easiest;
- the last level must have `stage = abstract` (R1 and lint L6), otherwise a blocker.

This is a proxy until `llm-game-generation` M3 calibrates bot cost against children's solve time.

**Time on task.** The mean game time of the `novice` bot must fall within 0.6–1.4× of the planned slot (default
4–8 min) **[U]**.

### 4.6 Q5 Pedagogy and answer truth (code; LLM rubric advisory)

| check | oracle | pass |
|---|---|---|
| **P1 answer truth** | for each item: (a) engine recompute (exact rationals, unit maths); else (b) a kit item with the same prompt hash whose `verified.agrees === true`; else (c) two blind solves (`taxila-brain`, effort high, different seeds, no key shown) that agree with each other *and* with the key | 100% of shipped items. Failing items are **dropped**, not repaired by the builder. If < 4 items remain in a level, the level is trimmed. Items from an unverified mini-kit (`verified:false`) may ship only under (a) or (c) |
| **P2 grader test** | table-driven from the kit: every `acceptable` form → `correct:true`; each `diagnostic.options[]` with a `misconceptionId` → `misc_signal` with that id; 20 random typed wrong values → `correct:false`; whitespace, numeral script (Devanagari vs Latin) and equivalent fractions per item kind | 100% |
| **P3 objective map** | `level.objectiveIds`, and the skills tagged on emitted `VerifiedAct`s during `replay` | every level emits acts on its declared skills; every brief objective is exercised |
| **P4 misconception targeting** | brief misconceptions with strength `strong` | each appears as a trap in ≥ 2 levels |
| **P5 integration** | lint L1 (causality), L6 (abstract end), L9a (remove-the-game: same act sequence without the shell), L9b (from `fuzz`) | all pass |
| **P6 telemetry for the teacher** | the `replay` and `novice` event streams through the host's `actFromEvent` and `summarize()` | every act yields a `VerifiedAct`; the observation line is ≤ 200 chars and contains no prose; `game.end` totals equal a recount from the events |
| **P7 language** | per band: words per instruction ≤ 12 (B1–B2) or ≤ 20 (B3–B4); no English-only string when `lang=hi`; voiced instruction exists for B1–B2 | all **[U thresholds]** |
| **P8 pedagogy rubric** (`taxila-brain`, text) | spec, levels, feedback strings, and the `novice` trace summary → rubric: the action IS the concept; feedback carries information about the error; scaffold rises; no seductive detail in the play area; mastery stages instead of currency | **advisory**, except two items that block when the evidence is grounded: "a decorative entity animates while a probe is open" (also checked by code via snapshot roles, lint L4) and "wrong feedback is only a generic 'wrong' with no in-world information" (checked by comparing the `feedback` entity text with the feedback preset id) |

"A model never grades" holds here. The LLM never decides whether an answer is right. It only reviews design, and two
independent blind solves are a *key check*, not grading of a child.

### 4.7 Q6 Geometry and accessibility (code + pixels, 10–20 s)

Computed from `snapshot()` at every event-triggered frame of the `replay` and `novice` recordings, on both viewports.

| check | computation | pass (B1–B2 / B3–B4) |
|---|---|---|
| on-screen | interactive and text bboxes inside the viewport minus safe insets | 100% |
| touch target | interactive bbox min side; centre-to-centre spacing | ≥ 48 CSS px at 360 width (≈ 48 dp, Android guidance **[M]**; WCAG 2.2 2.5.8 minimum is 24 px **[M]**, axe `target-size` **[V]**); spacing ≥ 8 px |
| occlusion | for each `target`/`text`: area covered by entities with higher z and role ≠ hud | ≤ 10% |
| text overflow | `text.wrapped && bbox.w > maxW`, or the bbox crosses its container | 0 |
| font size | `text.px` | ≥ 18 / ≥ 14 CSS px; Devanagari +2 px **[U]** |
| contrast | sample the screenshot inside the text bbox: foreground = the declared `fg`; background = the median of non-glyph pixels | ≥ 4.5:1, or ≥ 3:1 for ≥ 24 px or bold ≥ 18.7 px (WCAG 1.4.3 **[M]**) |
| Devanagari shaping | for every `hi` string: `document.fonts.check('16px "Noto Sans Devanagari"', s)`, plus tofu detection (render each grapheme cluster offscreen and compare its advance with the `.notdef` advance), plus conjunct test strings (क्ष, त्र, ज्ञ, श्र) rendered at the font's px and compared with a reference raster from the kit (pixel diff < 3%) | 0 tofu; 0 broken conjuncts |
| colour-only meaning | entities with `semantic.colourCodes`: screenshots under CDP `Emulation.setEmulatedVisionDeficiency` deuteranopia, protanopia and achromatopsia **[V, CDP]**; pairwise CIEDE2000 between category colours | ΔE ≥ 15 under each condition **[U]**, or a redundant shape/icon code is declared |
| flashing | luminance of the recorded frame sequence at 30 fps | no more than 3 general flashes per second (WCAG 2.3.1 **[M]**) |
| reduced motion | context with `reducedMotion: 'reduce'` **[V, Playwright types]** | tween and particle durations shrink (via `metrics`) and no camera shake |
| tap alternative | for every drag action in `legalActions()`, an equivalent tap-tap action exists | yes (`accessibility.tapOnly`) |
| timing | if `pacing.timer`: it can be turned off from the host and there is no lose-on-timeout (WCAG 2.2.1 **[M]**) | yes |
| DOM shell | `@axe-core/playwright` on the host harness and any DOM overlay, tags `wcag2a`, `wcag2aa`, `wcag22aa` **[V, Playwright doc]** | 0 serious or critical |
| audio equivalence | every voice line has an on-screen text or icon equivalent present in the same frame | yes |

axe cannot see inside a `<canvas>`. Playwright's own doc warns that automated checks find only some problems **[V]**.
That is why the canvas checks come from the kit's entity model instead. Children with real access needs are covered by
human review at mechanic promotion, not by this gate.

### 4.8 Q7 Performance on low-end Android (counters, 20–40 s)

**The problem.** The container has no GPU. WebGL goes through SwiftShader (`--use-gl=angle --use-angle=swiftshader`),
and the automatic fallback is being removed **[V, Chromium doc]**. CPU throttling via CDP
`Emulation.setCPUThrottlingRate{rate}` is "a slowdown factor" *relative to the host* **[V, CDP]**. Lighthouse
therefore calibrates by host class: a 4× multiplier takes a high-end desktop to mid-tier mobile, and about 10× to
low-end mobile (Galaxy J2 class, `benchmarkIndex` < 125) **[V]**. Chrome DevTools 134 added calibrated low- and
mid-tier mobile presets **[S]**. ACA consumption vCPUs are not a fixed host class.

**The method.**

1. **Calibrate per runner boot.** Run a 300 ms fixed JS benchmark (Lighthouse-style). Choose
   `rate = runnerScore / referenceScore`, clamped to [2, 12].
   - `referenceScore` is the same benchmark run once on each **reference phone** through Playwright's Android driver
     (`_android.devices()` → `device.webView({pkg})`, present in the installed Playwright 1.63 types **[V]**).
   - Reference phones are owned hardware, about ₹8–12k Android Go-class handsets (2–3 GB RAM). Choose the actual
     models from Taxila's own device telemetry **[U]**.
   - The report records `{runnerScore, rate, renderer}`.
2. **Gate on what transfers from the container to a phone** (JS and layout cost), during a 10 s scripted segment of
   the `replay` trajectory per level, in real time with the clock released:

| metric | how | pass **[U, set by QA-M1]** |
|---|---|---|
| main-thread cost per frame | `PerformanceObserver('long-animation-frame')` / `longtask` + the kit's `metrics().frameMs` (update + render CPU time) | p95 ≤ 12 ms at the calibrated rate |
| long tasks after `ready` | `longtask` entries > 100 ms | 0 during play; ≤ 1 per level transition, ≤ 300 ms |
| tap → feedback | from `act` dispatch to the first frame where the feedback entity is visible (Event Timing API and snapshot) | p95 ≤ 150 ms |
| heap | `performance.memory`/CDP `Runtime.getHeapUsage` after 3 replay cycles of all levels | growth ≤ 10% (leak); absolute ≤ 120 MB |
| textures | `metrics().textures` × size | ≤ 48 MB; atlases ≤ 2048² |
| load | cold `ready` with Lighthouse slow-4G-like network emulation (150 ms RTT, ~1.6 Mbps **[M]**) | ≤ 5 s; warm ≤ 3 s |
| idle | `rafCount` while hidden; CPU while paused | ≈ 0 rAF hidden; paused CPU < 5% |
| **regression vs template** | the same metrics for the kit template game, in the same container, in the same run | ≤ +25% on frame cost and heap |

3. **Absolute FPS** (median ≥ 45, p5 ≥ 30) is **hard only on the real-device lane**: the reference phones run the build
   in the Capacitor WebView at mechanic promotion (G3) and on a nightly sample of the published G2 builds. In the
   container FPS is recorded, never blocking. This settles the `sandboxes-per-student` §5.3 risk.

### 4.9 Q8 Content safety (service + LLM, 3–10 s, orchestrator)

| layer | input | rule |
|---|---|---|
| **S1 text, Azure AI Content Safety** | every child-facing string (all locales), TTS line, image prompt and alt text, batched ≤ 10k chars per call **[V limit]** | **block at severity ≥ 2** in any of hate, sexual, violence, self-harm (the child threshold; the service default for apps is often 4 **[U]**) |
| **S2 blocklist** | the same strings | Content Safety custom blocklist: Hindi and Hinglish slurs, caste terms, body-shaming, brand and IPL team names, real cricketer and film-star names, romance register words (from the child-safety floor) → any hit fails |
| **S3 Hindi/Hinglish classifier** | `hi` and `hi-Latn` strings (Content Safety is not trained on Hindi **[V]**) | `taxila-brain` structured output `{unsafe, category, span}` with a child-specific taxonomy (fear, violence, romance, religion mocked, stereotype, shaming, dangerous act) → any `unsafe` fails. Measure against Content Safety in QA-M4; drop one of them only on evidence |
| **S4 PII** | strings + the bundle | no child name, phone number, email, URL or address patterns (regex), and no `childRef` in the bundle |
| **S5 images** | every new sprite and background | Content Safety image API (returns 0/2/4/6 **[V]**): fail at ≥ 2. Azure AI Vision OCR: any text > 2 characters fails (labels never go into pixels). Vision check (`taxila-brain`, grounded): real-person likeness, logos and brands, religious figures or symbols used as game objects, weapons and gore, age-band scariness (B1–B2), skin-tone and gender stereotyping in roles |
| **S6 code behaviour** | from Q1/Q2 | no network, storage, navigation, popups or free-text input fields; any of these fails |
| **S7 audio** | TTS lines from S1-cleared text only; SFX and music from preset banks only | `taxila-transcribe` round trip of each TTS line: WER ≤ 15% vs the intended text (mispronounced Hindi gets caught) **[U]** |
| **S8 IP** | strings ≥ 110 chars: Content Safety protected-material text check (English only **[V]**); image prompt lint for franchise names | no NCERT passage copied verbatim beyond kit-licensed items (`tech-and-market` §7.2) |

Any S-layer failure is **unsafe**: it never ships, a reproducible incident is logged, and the content is not shown to
the builder verbatim. The builder sees only `SAFETY.<layer>.<category>` with the offending string id.

### 4.10 Q9 Judged quality (VLM, grounded; 30–60 s)

Described in §7. In short:
- the **vision judge** gets event-triggered frames, the source excerpt and the GDD rubric;
- it returns `CritiqueItem[]` with evidence;
- the evidence is cross-checked against snapshots;
- only grounded blockers on calibrated criteria block.

The **GUI playtester** (Play2Code-style, pixels only) runs at G3 promotion and on a **5% random audit** of shipped G2
builds. A drop in its rubric pass rate is an alarm for the whole recipe, not a block on one child's game.

### 4.11 Q10 Publish, regression and live canary

- **Publish:** re-hash the dist; the `__forge` API is absent; the CSP header is set; the manifest carries the
  `QaReport` hash, recipe, models and ledger.
- **Kit regression:** on every kit or Phaser change, re-run the **golden corpus**: all promoted families × 3 specs,
  plus 50 sampled published games.
  - Replay the stored trajectories with the same seeds.
  - Assert identical `stateHash` sequences and event streams.
  - Run `toHaveScreenshot`-style pixel diffs on the event frames (threshold 0.1%, anti-aliasing tolerant).
  - Any diff blocks the kit release, or the pinned kit version is kept for old games.
- **Live canary** (the app's telemetry after deployment, per artifact):

| signal | trip | action |
|---|---|---|
| bridge `error` events | ≥ 1 child with ≥ 2 errors in the first 50 plays | unpublish the artifact; the child sees the G1 fallback |
| item anomaly | an item answered wrong by ≥ 70% of children whose mastery is ≥ 0.8 (n ≥ 10) | quarantine the item, which is a suspected key error; re-run P1 |
| quit before level 2 | > 40% (n ≥ 20) | flag for G3 review; lower the recipe score |
| `stuck` rate | > 2× the family median | flag the level |

---

## 5. Pass criteria and the ship decision

### 5.1 Finding severities

- **blocker:** the level or build cannot ship.
- **major:** repair is requested. If it is still open after the round caps, the build ships only if the score
  threshold holds.
- **minor:** logged, and counted in the score.
- **info:** logged only.

Unsafe findings (Q8) are a separate class that overrides everything.

### 5.2 Hard criteria (all must hold for a level to be `ship`)

The thresholds are §4 defaults. They are **[U]** until §13 sets them.
- Q0–Q3: 0 blockers.
- Q4: `replay` wins, `solver` agrees, all misc paths are tagged, no softlock, the fuzz progress is 0, the curve
  ends abstract.
- Q5: P1 = P2 = 100%, and P3–P6 pass.
- Q6: 0 blockers on the 360-wide viewport.
- Q7: container metrics pass. Real-device FPS is required only for G3.
- Q8: 0 unsafe findings.
- Q9: 0 grounded blockers on calibrated criteria.

### 5.3 Decision function

```ts
// forge/qa/decide.ts
export function decide(r: QaReport, p: QaPolicy): QaDecision {
  if (r.findings.some(f => f.cls === "unsafe")) return { kind: "reject_unsafe" };              // never ships, incident
  if (r.gates.some(g => g.tier === "A" && g.status !== "pass")) return { kind: "repair", scope: "A" };
  const ship = r.levels.filter(l => l.blockers.length === 0);
  const score = qualityScore(r, p);                                                            // §5.4
  if (ship.length === r.levels.length && score >= p.minScore) return { kind: "ship", score };
  if (r.roundsLeft > 0) return { kind: "repair", scope: firstFailingTier(r) };
  if (ship.length >= p.minLevels /*3*/ && contiguousFromL1(ship) && endsAbstract(ship) && score >= p.minScore)
    return { kind: "ship_partial", levels: ship.map(l => l.id), score };
  return { kind: "fallback_g1" };                                                              // child keeps the G1 game
}
```

**`ship_partial` keeps the curve honest:** shipped levels must be a prefix L1..Lk, and the trimmed set's last level
must still be abstract. The harness re-labels it, so the child never sees a gap.

### 5.4 Quality score (soft; ranking and threshold)

`score = 1 − Σ w_sev × n / norm`, with weights major 0.08 and minor 0.02. Q9 judge items count only when grounded.
- `minScore` = 0.75 for G2 **[U]**.
- The score is **for ranking and drift detection**: recipe A vs B, and this week vs last week. It never overrides a
  hard criterion, which follows AgentRewardBench's lesson that judge-heavy scores are too lenient.

---

## 6. The repair loop

```
            ┌──────────────────────── gate run (incremental) ────────────────────────┐
 build ───► │ Q0 ► Q1 ► [Q2 Q3 Q4 Q5] ► [Q6 Q7 Q8 Q9] ► decide()                    │
            └───────────────┬────────────────────────────────────────────────────────┘
                            │ repair
                            ▼
   1 normalise findings → signatures ─► 2 deterministic fixers ─► (re-gate, no LLM)
                            │ still red
                            ▼
   3 protocol lookup (signature → cause → fix shape) ─► 4 evidence pack ─► 5 builder round (S4/S5 caps)
                            │
                            ▼
   6 regression guard: re-run changed-input gates + regression subset; green→red ⇒ git reset to last green
                            │
   7 stop rules: same signature ×3 ⇒ alternate builder model for 1 round ⇒ still red ⇒ trim level / fallback
   8 learn: resolved ⇒ protocol entry (signature, cause, diff summary); unresolved ⇒ incident + mutant candidate
```

### 6.1 Signatures

`<GATE>.<CHECK>.<CODE>[.<scope>]`, for example:
- `Q2.CONSOLE.TypeError.cannot-read-x-of-undefined@scenes/Level3.ts`
- `Q4.SOFTLOCK.no-retry@L4`
- `Q6.TARGET.small@btn_submit`
- `Q8.S3.fear`

Error messages are normalised: numbers, ids and paths are stripped, as in OpenGame's debug protocol **[S, via
`llm-game-generation`]**. Signatures key three things:
- the fixer catalogue;
- the protocol;
- the stuck detector.

### 6.2 Evidence pack (what the builder sees; the "minimal" part matters)

Per round, the builder sees:
- at most **one finding per (gate, check)**, ordered blockers first, then earliest tier first;
- for each finding:
  - signature, file:line if known, a detail of ≤ 300 chars, and the expected vs observed state values;
  - ≤ 3 frames: the event frame just before and just after the failing event, plus the same frame from the
    template baseline when it is a regression;
  - the last 20 bridge events;
  - the `fixHint` from the protocol, if one matched;
  - the trajectory as an `act` list that the builder can re-run through `run_check keypoints --repro <id>`.

The pack never includes judge prompts, thresholds, held-out keypoints or the safety text (QP7, §4.9). It is capped
at about 8k tokens plus images. Long contexts of failure dumps degrade repair, and the harness doc already keeps each
stage at about 40k tokens **[U]**.

### 6.3 Deterministic fixers (before any LLM round; each logged)

From `llm-game-generation` §7.3, plus QA-specific fixers:
- snap unknown asset keys to the nearest registry key;
- re-merge a replaced `gameConfig.json`;
- register missing scenes;
- clamp config numbers;
- **raise text px to the band floor and re-wrap**;
- **nudge an occluding decor entity's z below targets**;
- **enlarge hit areas to 48 px**, which changes the hit area, not the art;
- **swap a failing palette pair for the skin pack's high-contrast pair**;
- **drop items that fail P1** (never "fix" a key with a model).

More than 3 fixer applications in one job is a recipe-quality signal.

### 6.4 Rounds, caps and stop rules

| stage | rounds | per-round builder steps | stop rule |
|---|---|---|---|
| logic repair (Q0–Q5 red) | ≤ 5 | ≤ 8 | the same signature red in 3 consecutive rounds → one round on the alternate builder deployment (GameASG: success sets barely overlap across harnesses **[S]**) → still red → trim that level |
| polish repair (Q6–Q9 red) | ≤ 2 | ≤ 6 | majors open after 2 rounds → ship if the score holds; blockers → trim the level |
| job caps | `coding-agent-harnesses` §5.2: 40 steps, 15 min, $2.50 | | on a cap, `decide()` runs on the best green checkpoint |

**Flake policy (QP8).** A deterministic check that fails is re-run once with the same seed:
- different result → finding `Q*.NONDETERMINISM` against the *game* (blocker; usually `Math.random`, wall-clock time
  or async asset races);
- same result → a real failure.

The runner itself is held to 0 nondeterminism (QA-M5). Nondeterminism caused by the runner is a P0 infra bug, and it
is never retried away.

**Incremental re-gating.** A dependency map decides which gates re-run after a change:
- `levels.json` or items → Q0, Q3, Q4, Q5, Q8-text;
- `src/**` → Q1–Q7, Q9;
- assets → Q6, Q8-image, Q9;
- the skin → Q6, Q9.

A **regression subset** always re-runs: Q2 on both viewports, `replay` on all levels, and the previously failing
checks. This is the guard against the non-monotonic improvement that Google observed **[S]**.

### 6.5 Learning

A signature resolved by a builder diff becomes a protocol candidate `{signature, cause ≤ 200 chars, fixShape ≤ 300
chars, family, hits}`. Candidates are promoted to `FORGE.md` pitfalls after ≥ 3 independent hits (shapes, not
sentences). An unresolved signature becomes:
- an incident;
- a **mutant candidate** for §8, so the gate's corpus grows with real failures.

---

## 7. Judges

### 7.1 Vision judge (Q9): inputs and prompt as structure

- **Model.** `taxila-brain` (gpt-5.6-sol) at high effort. Never the builder's model (QP4; self-preference **[M]**).
  Never luna or terra (`vision-fab`).
- **Frames.** *Event-triggered* frames, captured by the bots at semantically important instants:
  - level intro;
  - first `probe_open`;
  - just after a correct answer (+300 ms);
  - just after a misconception answer (+300 ms);
  - hint step 2;
  - `goal_met`;
  - the abstract-stage frame.

  That gives about 6–7 frames per level on the 360×640 viewport, plus intro and end frames at 412×823. Capture is
  JPEG q80 at device resolution, because downscaling hides 14 px text. This improves on ArtifactsBench's fixed 3
  frames (1 → 3 frames raised agreement from 79% to 91% **[S]**): every frame comes with the event that caused it.

**Prompt structure** (position is mechanism, so binding rules go last):
1. **Role.** One line: you check one child's game against listed criteria.
2. **Context.** Age band; language; the family's one-line `coreLoop.why`; the GDD rubric items (~8, observable).
3. **Inputs.** Frames, each labelled `{frameId, level, event, viewport}`. The scene source excerpt is ≤ 6k tokens.
   The source matters because code-awareness helps **[S]**.
4. **Criteria.** One per call group, never "anything wrong?" (GlitchBench's 27.7-point phrasing swing **[S]**). Each
   criterion is phrased as an observable claim with a frame scope. Examples:
   - "after the wrong answer, the frame shows where the jump landed relative to the target";
   - "the goal is understandable without reading for B1";
   - "art style is consistent across sprites";
   - "nothing in the play area moves while the question is open";
   - "no element looks frightening for ages 6–9".
5. **Output.** `CritiqueItem[]` via strict JSON schema: `{criterion, pass, severity, evidence: {frameId, bbox?,
   quotedText?, observation ≤ 160 chars}, fix ≤ 200 chars}`.
6. **Binding rules, last:**
   - `pass:false` needs a frame id and either a bbox or quoted visible text;
   - if you cannot read something, say `illegible` with its bbox; never infer it;
   - do not suggest new features;
   - judge only the listed criteria.

### 7.2 Grounding cross-check (makes a looking judge into a querying judge)

```ts
function ground(item: CritiqueItem, frames: Map<string, { snap: GameSnapshot; ocr: string[] }>): Grounding {
  const f = frames.get(item.evidence.frameId);
  if (!f) return "ungrounded";                                           // invented frame
  if (item.evidence.quotedText) {
    const texts = [...f.snap.entities.flatMap(e => e.text ? [e.text.value] : []), ...f.ocr];
    if (!texts.some(t => normEditDistance(t, item.evidence.quotedText!) <= 0.2)) return "ungrounded";   // vision-fab
  }
  if (item.evidence.bbox) {
    const hit = f.snap.entities.some(e => e.visible && iou(e.bbox, item.evidence.bbox!) >= 0.1);
    if (!hit && !/background|empty|blank/.test(item.evidence.observation)) return "ungrounded";
  }
  return "grounded";
}
```

How verdicts are used:
- **Ungrounded failures** never block. They count toward the judge's fabrication rate (§8). If the rate rises above
  5% in a week, the judge recipe is rolled back.
- **Grounded failures:** where a programmatic check covers the same claim (occlusion, contrast, overflow), the code
  verdict wins. Disagreements are logged as calibration data.
- **Ensemble for blockers:** a second judge call uses the same frames in shuffled order, with only the
  candidate-blocker criteria. A blocker stands only if both calls flag the same criterion with overlapping evidence.
  This trades recall for the precision that the evidence in §1 says judges lack.

### 7.3 When a judge criterion may block

A criterion becomes blocking only after QA-M3 measures, for that criterion and on our mutant and clean corpus:
- precision ≥ 0.90;
- recall ≥ 0.60;
- with n ≥ 30 positives.

Below that, the criterion is **major and advisory**: it goes to repair once, then into the score. The list of
calibrated criteria is versioned in the recipe. Changing the model or the prompt resets the criterion to advisory
until the corpus re-run passes.

### 7.4 Other judges

| judge | model | input | output | blocks? |
|---|---|---|---|---|
| pedagogy rubric (P8) | `taxila-brain`, text | spec, levels, feedback strings, novice trace summary | rubric items with evidence (quoted string ids, event seqs) | two grounded items only (§4.6) |
| Hindi safety (S3) | `taxila-brain`, structured | strings with ids | `{id, unsafe, category, span}` | yes (unsafe class) |
| blind solver (P1c) | `taxila-brain` ×2, effort high, different seeds | item prompt only | answer | only through key disagreement → the item is dropped |
| GUI playtester (G3 promotion, 5% audit) | `taxila-brain` computer-use-style loop on pixels, 1280×720 and 412×823, ≤ 60 actions per level, 5 phases (Play2Code) | the GDD rubric | per-criterion pass + fix list (advisory) | no; drift alarm |
| cross-family second opinion | **Claude Sonnet 5.5, if the owner lifts the Marketplace directive** | the same as the vision judge | the same | would replace the self-ensemble; reverse when QA-M3 shows cross-family agreement raises blocker precision by ≥ 5 pp **[U]** |

---

## 8. Testing the gate: the mutant corpus

Every gate needs a recall and a false-alarm rate (QP5). Golden games are the promoted kit families × 3 specs (about
24 at launch). Each mutant is applied by an AST or asset transform, so it is reproducible and labelled.

| # | mutant operator | target gate | example |
|---|---|---|---|
| M1 | flip a comparison in the answer check | Q3, Q5-P2 | `===` → `!==` in `isCorrect` |
| M2 | off-by-one in the win condition | Q3, Q4 | `>=` → `>` on the goal count |
| M3 | drop a `goal_met` / `misc_signal` emit | Q3, Q5-P6 | delete the emit line |
| M4 | wrong misconception id | Q4 misc, Q5-P2 | `MC.FRAC.ADD_ACROSS` → `MC.FRAC.BIGGER_DENOM` |
| M5 | make a level unsolvable | Q4 solver | remove the only correct tile |
| M6 | softlock after a wrong answer | Q4 softlock | disable the retry control on `failed` |
| M7 | brute-forceable lock | Q4 fuzz (L9b) | dial accepts any 2-digit value after 50 tries |
| M8 | decor entity covers the answer | Q6 occlusion, Q9 | z-swap |
| M9 | button shrunk to 28 px | Q6 target | scale 0.6 |
| M10 | low-contrast label | Q6 contrast, Q9 | `#999` on `#bbb` |
| M11 | broken Devanagari (font swapped to Latin-only) | Q6 shaping, Q9 | tofu |
| M12 | off-screen feedback at 360 width | Q6 on-screen, Q9 | x += 400 |
| M13 | memory leak per level | Q7 heap | push textures into a global array |
| M14 | 80 ms busy loop per frame | Q7 frame cost | `while (performance.now() - t < 80)` |
| M15 | beacon attempt | Q2 network, Q1 | an obfuscated `fetch` via `window['fe'+'tch']` (Q1 must catch the computed member, or Q2 catches the attempt) |
| M16 | unsafe string in Hindi | Q8 S3 | a mild threat phrase in Hinglish |
| M17 | `Math.random` in the reducer | Q1, Q2 nondeterminism | — |
| M18 | seductive detail: confetti loop during a probe | Q5-P8, Q6 (roles), Q9 | particle emitter on `probe_open` |

Metrics per gate and per mutant class:
- recall = caught / applied;
- false-alarm rate on unmutated goldens;
- time to detect.

Requirements:
- **Hard gates must reach recall ≥ 0.95 on their target classes** before Forge publishes without human review **[U]**.
- **Judge criteria** follow §7.3.
- The corpus re-runs on any change to the kit, the runner image, a judge model or prompt, or a threshold. A recall
  drop of > 5 pp blocks that change (the gate's own regression test).
- Real incidents (§6.5) add operators over time.

---

## 9. Other media: the same report, different checks

| medium | gates | notes |
|---|---|---|
| **image / diagram** (`taxila-image`, SVG, Mermaid) | Q0 (spec), Q8 S5 (Content Safety image, OCR text-free, likeness/logo/religion/scariness), correctness: labels are overlay text from the spec, so check overlay anchors against the spec's semantic points (for example the arrow points to the lens focal point), done by geometry on the SVG overlay plus a grounded vision criterion "the labelled part is the part named" | SVG: XML-parse, no `<script>`, no `foreignObject`, no external `href`; Mermaid: `mermaid.parse()` (`tech-and-market` §3.5) |
| **animation** (tween/Lottie/canvas) | Q2 boot, Q6 flashing and reduced motion, Q7 frame cost, duration within spec ±10%, narration sync (each caption cue's timestamp within 300 ms of its TTS segment), Q9 on 5 keyframes | the same kit seam: `snapshot()` per keyframe |
| **song / audio** | lyrics through Q8 S1–S3; factual check of lyrics against the kit (every claim maps to a kit expectation, LLM-extracted and key-matched); TTS round trip WER ≤ 15%; loudness −16 LUFS ±2 and true peak ≤ −1 dBTP (EBU-style **[M]**); ducking under the teacher's voice verified by mixing a test clip | songs only for verbatim content (`learning-science` §2.4; R6) |
| **worksheet** (HTML → PDF) | Q5 P1 on every answer key; reading level per band; Playwright `page.pdf()` render, then text overflow (bbox of each answer box vs its content), page count ≤ spec, Devanagari shaping check on PDF raster; Q8 text | the answer key never prints on the child copy (string search on the PDF text layer) |
| **video** (`taxila-sora`) | Content Safety image on 1 frame/s, OCR, Q9 criteria on 6 frames, duration and audio WER | Sora's API was shut down at OpenAI on 2026-09-24 and the Azure retirement date is unknown (`llm-game-generation` §0.6). Do not build the lane until that is resolved |

---

## 10. Contracts

```ts
// shared/forge-qa.ts  (new seam; mirrors contracts.ts conventions)
export type QaGateId = "Q0" | "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6" | "Q7" | "Q8" | "Q9" | "Q10";
export type QaTier = "A" | "B" | "C" | "D";
export type Severity = "blocker" | "major" | "minor" | "info";
export type FindingSource = "code" | "bot" | "solver" | "service" | "judge" | "device";

export interface QaFinding {
  gate: QaGateId; check: string; signature: string;
  severity: Severity; cls: "defect" | "unsafe" | "nondeterminism" | "regression" | "overfit";
  source: FindingSource; level?: string; viewport?: "360x640" | "412x823" | "device";
  entityId?: string; file?: string; line?: number;
  detail: string;                                   // ≤ 300 chars, facts not prose
  expected?: unknown; observed?: unknown;
  evidence?: { frames?: string[]; clip?: string; traceBlob?: string; bbox?: [number, number, number, number]; quotedText?: string };
  grounding?: "grounded" | "ungrounded" | "n/a";
  repro?: { seed: number; level: string; actions: import("./forge").Action[] };
  fixHint?: string;                                 // from protocol / fixer catalogue
  heldOut?: boolean;
}
export interface QaGateResult {
  gate: QaGateId; tier: QaTier; status: "pass" | "fail" | "skip" | "error";
  ms: number; usd: number; metrics: Record<string, number>; findings: QaFinding[];
}
export interface QaProfile {
  runnerImage: string; kit: string; chromium: string; renderer: "webgl-swiftshader" | "canvas" | "device-gpu";
  benchmark: { runnerScore: number; referenceDevice: string; referenceScore: number; throttleRate: number };
}
export interface QaReport {
  reportId: string; jobId: string; buildSha: string; artifactKind: "game" | "sim" | "image" | "animation" | "audio" | "worksheet";
  tier: "G1" | "G2" | "G3" | "reskin"; recipe: string; policyVersion: string;
  profile: QaProfile; round: number; roundsLeft: number;
  gates: QaGateResult[]; findings: QaFinding[];       // flattened, deduped by signature
  levels: { id: string; blockers: string[]; majors: string[]; metrics: Record<string, number> }[];
  score: number; decision: QaDecision;
  judges: { model: string; promptHash: string; calls: number; ungrounded: number }[];
  ledger: { ms: number; usd: number; images: number; csCalls: number };
}
export type QaDecision =
  | { kind: "ship"; score: number }
  | { kind: "ship_partial"; levels: string[]; score: number }
  | { kind: "repair"; scope: QaTier }
  | { kind: "fallback_g1" } | { kind: "reject_unsafe" } | { kind: "human_review"; reason: string };
export interface QaPolicy {                            // versioned; every number here is [U] until §13
  version: string; minScore: number; minLevels: number;
  logicRounds: number; polishRounds: number; sameSigStop: number;
  heldOutShare: number; heldOutGapPP: number;
  touchPx: number; fontPx: { B1: number; B2: number; B3: number; B4: number }; contrast: { normal: number; large: number };
  perf: { frameMsP95: number; tapFeedbackMsP95: number; heapGrowth: number; heapMB: number; vsTemplate: number; readyMs: number };
  safety: { textSeverityBlock: 2; imageSeverityBlock: 2; hindiClassifier: boolean };
  judge: { blockingCriteria: string[]; ensembleForBlockers: true; fabricationRollback: number };
}
```

---

## 11. Runner skeleton (Playwright, the untrusted lane)

```ts
// forge-runner/qa/session.ts  — one browser per runner, one context per check group
import { chromium, type Page } from "playwright";
export async function openGame(distUrl: string, vp: { width: number; height: number; dpr: number }, rate: number) {
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader", `--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1`] });   // runner has no identity
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr,
    isMobile: true, hasTouch: true, reducedMotion: "no-preference", serviceWorkers: "block" });
  const log: RuntimeLog = { console: [], pageErrors: [], blocked: [], csp: [], lost: 0 };
  await ctx.route("**/*", r => isLocal(r.request().url()) ? r.continue() : (log.blocked.push(r.request().url()), r.abort()));
  const page = await ctx.newPage();
  page.on("console", m => (m.type() === "error" || m.type() === "warning") && log.console.push({ t: m.type(), text: m.text() }));
  page.on("pageerror", e => log.pageErrors.push(String(e)));
  await page.addInitScript(() => {                                        // runs in every frame, including the game iframe
    addEventListener("securitypolicyviolation", e => (window as any).__qaCsp?.push((e as any).violatedDirective));
    addEventListener("unhandledrejection", e => console.error("unhandledrejection", String((e as any).reason)));
    addEventListener("webglcontextlost", () => console.error("webglcontextlost"), true);
    new PerformanceObserver(l => ((window as any).__qaLong ??= []).push(...l.getEntries().map(x => x.duration)))
      .observe({ type: "longtask", buffered: true });
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });            // calibrated (§4.8)
  await page.clock.install();                                             // rAF + performance under test control
  await page.goto(`http://127.0.0.1:${PORT}/qa-host.html?src=${encodeURIComponent(distUrl)}`);
  const game = page.frameLocator("#mod");                                 // same sandboxed iframe as the app
  return { browser, ctx, page, cdp, log, api: forgeHandle(page) };        // forgeHandle: typed evaluate() wrappers on __forge
}
export async function eventFrame(page: Page, label: string) {            // event-triggered capture for Q6/Q9
  const snap = await forgeHandle(page).snapshot();
  const jpg = await page.screenshot({ type: "jpeg", quality: 80, animations: "allow" });
  return { label, snap, jpg };
}
```

Bots run as `async (api, rng) => Trajectory` functions against `forgeHandle`. Every `act` is followed by
`api.step(dt)` and `page.clock.runFor(dt)`, so the simulation and the render clock advance together. Event frames are
captured when `api.events()` grows with a capture-worthy type. Pages run in parallel: at most 2 contexts per 2 vCPU
runner (`sandboxes-per-student` §5.3), and bots are spread over contexts by level.

---

## 12. Cost and latency [U unless tagged]

| item | per G2 full pass | basis |
|---|---|---|
| runner compute (≈ 150 s × 2 vCPU / 4 GiB) | ≈ $0.009 | ACA consumption $0.000024/vCPU-s + $0.000003/GiB-s **[V, sandboxes doc §9.2]** |
| Content Safety text (≈ 10 batched records) + images (≈ 8) | < $0.02 | per-record pricing; check the retail API before relying on it **[U]** |
| Hindi classifier + blind solves (≈ 15k in / 2k out) | ≈ $0.03–0.06 | `taxila-brain` price **[U]** |
| vision judge (≈ 16 frames ≈ 20–30k image tokens + 8k text; 2 calls with the blocker ensemble) | ≈ $0.08–0.25 | **[U]**: measure image tokens per frame on brain (QA-M3) |
| **total, first full pass** | **≈ $0.15–0.35** | vs build ≈ $1.5–3.5 (`llm-game-generation` §8) |
| incremental repair re-gate | ≈ $0.02–0.15, 40–90 s | most rounds touch only Q3–Q5 |
| G1 fast path | < $0.005, 5–8 s | no judge; Content Safety on new strings only |
| G3 promotion extras: GUI playtest (≈ 60 actions × levels) + device lane + human | ≈ $1–3 + about 30 min of human time | rare |

| latency (G2, first pass) | P50 | P90 |
|---|---|---|
| tier A | 5 s | 10 s |
| tier B (parallel pages) | 45 s | 90 s |
| tier C ∥ D | 50 s | 100 s |
| **total** | **≈ 1.7 min** | **≈ 3.3 min** |

With 2 repair rounds the gate adds about 3–5 min to a G2 job. That fits inside `llm-game-generation`'s P50 of 8 min
only if gates run incrementally and tiers C and D overlap. Measure this in QA-M7.

---

## 13. Measurements to run (each becomes a `context/measurements.md` entry with n, method and date)

1. **QA-M1 Runner calibration.**
   - Reference phones: 2–3 owned low-end Android devices.
   - Run the 24 goldens on the phones (Capacitor WebView via Playwright `_android`) vs the runner at the calibrated
     rate.
   - Metric: Spearman ρ of per-level frame cost, and the ratio spread.
   - Sets `perf.*` thresholds. **Reverse** container perf gating, keeping only regression vs template plus the
     nightly device sample, if ρ < 0.7.
2. **QA-M2 Mutant recall.** §8 corpus: 18 operators × 24 goldens ≈ 430 mutants, plus 24 clean builds × 5 seeds.
   - Metric: recall and false alarms per gate.
   - Gate: hard gates ≥ 0.95 recall on their target classes, with 0 false alarms on clean builds.
3. **QA-M3 Judge calibration.** On the M8–M12, M18 mutants and the clean set:
   - per-criterion precision and recall of the vision judge, single call vs ensemble;
   - fabrication rate (ungrounded share);
   - image tokens per frame;
   - prompt-sensitivity: 2 phrasings per criterion, κ between them.

   This sets `judge.blockingCriteria`. It re-runs the project's `vision-fab` method on game frames.
4. **QA-M4 Hindi safety.**
   - 300 strings: 150 benign kids' Hindi/Hinglish (NCERT-like, game feedback) and 150 unsafe for children (mild
     threats, shaming, romance, caste, religious mockery, adversarial transliteration).
   - Content Safety at severity ≥ 2 vs the `taxila-brain` classifier vs both, labelled by 2 native speakers.
   - **Reverse** S3 (drop the LLM layer) only if Content Safety alone reaches ≥ 0.95 recall at ≤ 5% false positives.
5. **QA-M5 Determinism.** Each golden × 20 runs × 2 viewports. Required: identical `stateHash` streams and event
   streams, and screenshot diffs ≤ 0.1%. Any runner-caused flake is a P0.
6. **QA-M6 Gate validity on children.**
   - For 60 shipped G2 games, correlate the QA score and the major count with live outcomes: quit-before-L2,
     `stuck` rate, Again-Again replay, item anomalies.
   - If the score does not predict outcomes (ρ < 0.2), the soft score is re-weighted. Hard gates stay, because they
     are defects regardless.
7. **QA-M7 Latency.** P50 and P90 of a full pass and of an incremental re-gate on the ACA Job runner, cold and warm.
8. **QA-M8 Held-out gap.** The visible vs held-out keypoint pass rate per recipe, over 50 builds. A gap > 15 pp means
   the builder is overfitting, and FORGE.md or the evidence pack must change.
9. **QA-M9 Bot cost vs child difficulty.** This is `llm-game-generation` M3, run with the Q4 cost metric: does the
   bot-derived curve order match children's median solve time? It sets the curve rule's weights.

### Reversal conditions

- **Q9 vision judge.** If QA-M3 finds no criterion reaching precision 0.9 even with the ensemble, Q9 becomes purely
  advisory. Visual blockers then come only from Q6 code checks plus the G3 human review.
- **The ≥ 2 child safety threshold.** If it false-blocks more than 3% of benign kit strings in QA-M4, raise it to 4
  for `en` only, never for `hi`.
- **The bot personas.** If `novice`/`interrupt` find nothing in QA-M2 that `replay` + `fuzz` miss, drop them to save
  about 20 s.

---

## 14. Proposed `context/` entries (for the main loop to merge via `context/inbox/`)

- **decision `forge-qa-gate`.** One ladder (Q0–Q10) and one seam (`__forge` v1). It supersedes the G0–G7 and V0–V7
  ladders in `llm-game-generation` §5 and `coding-agent-harnesses` §5.6. Rationale: §1, QP1–QP8.
  - Reverse if: QA-M2 shows a simpler subset (Q0–Q4 + Q8) reaches the same recall on all mutant classes.
- **decision `forge-qa-judges-grounded`.** Judge verdicts block only when grounded and calibrated (§7.3).
  - Evidence: AgentRewardBench precision ≤ 70%; VideoGameQA-Bench false positives; `vision-fab`.
  - Reverse if: QA-M3 shows ungrounded judge verdicts with precision ≥ 0.9.
- **decision `forge-perf-calibrated`.** No raw headless FPS gate. Use a calibrated throttle, regression vs the
  template, and absolute FPS only on real devices.
  - Evidence: SwiftShader doc; Lighthouse calibration doc.
  - Reverse if: QA-M1 ρ ≥ 0.9 between SwiftShader FPS and device FPS.
- **decision `forge-safety-hindi-layer`.** Content Safety plus a Hindi blocklist plus an LLM classifier for `hi` and
  `hi-Latn`.
  - Evidence: the language-support doc (Hindi is not in the trained set).
  - Reverse: QA-M4.
- **measurement placeholders:** QA-M1 to QA-M9, to be filled in.

No rejection entries yet: nothing in this doc has been tried and failed. Do not log a rejection for "raw FPS gate"
until QA-M1 has run. It is a predicted failure, not a measured one.

---

## 15. Risks and open questions

- **The kit's entity model can lie.** If `snapshot()` misreports bboxes (camera transforms, containers), every
  geometry check is wrong in the same way.
  - Mitigation: Q3 checks the `act` vs pointer equivalence at bbox centres; QA-M2 includes M8 and M12 visual mutants.
  - Open: should a nightly sampled pixel-level check compare entity bboxes against rendered sprite alpha masks?
- **Bots validate the spec, not the child.** A game can be solvable, bug-free and still confusing. Q9 and the G3 GUI
  playtest only partly cover this. The real measure is children (`llm-game-generation` M5, QA-M6).
- **Held-out keypoints come from the same planner as the visible ones.** The planner's blind spots are shared. Only
  generated keypoints (§4.4), the personas and the fuzzer are independent of it.
- **Content Safety pricing and Hindi quality** are unverified **[U]**. QA-M4 also decides the cost line.
- **The real-device lane needs owned phones and an operator.** Azure has no device farm in the allowed set
  **[U, verify]**. Third-party farms (Firebase Test Lab, BrowserStack) are excluded by the Azure-only directive for
  builds, but could be cited as calibration references.
- **Judge model drift.** A silent model update could shift Q9. Mitigation: `judges[].promptHash` and model version go
  into every report; a weekly mutant-corpus run on Q9 (≈ $5–10 **[U]**); automatic rollback on a fabrication-rate rise.
- **Gate latency vs the lesson.** If QA-M7 P90 exceeds 5 min, move Q9 to *post-publish async*. The game ships on
  Q0–Q8, and a Q9 blocker unpublishes it before the child's second play. This is acceptable only because Q8 safety
  stays pre-publish, always.

---

## Sources

**Papers and benchmarks**
- Google, *Harnessing Generative UI for Education*, arXiv 2609.20738 (2026-09-18): https://arxiv.org/html/2609.20738 **[S]**
- Google, *Generative UI* project and blog: https://generativeui.github.io/ ·
  https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/ **[S]**
- GameGen-Verifier, arXiv 2605.07442: https://arxiv.org/html/2605.07442 **[S]**
- Play2Code / PlaytestArena, arXiv 2605.28258: https://arxiv.org/html/2605.28258 **[S]**
- ArtifactsBench, arXiv 2507.04952: https://arxiv.org/html/2507.04952 **[S]**
- WebGen-Bench, arXiv 2505.03733: https://arxiv.org/html/2505.03733 **[S]**
- AgentRewardBench, arXiv 2504.08942: https://arxiv.org/html/2504.08942 **[S]**
- VideoGameQA-Bench, arXiv 2505.15952: https://arxiv.org/html/2505.15952 **[S]**
- GlitchBench, arXiv 2312.05291: https://arxiv.org/html/2312.05291 **[S]**
- BALROG, arXiv 2411.13543: https://arxiv.org/abs/2411.13543 **[S]**
- Agent-as-a-Judge, arXiv 2410.10934: https://arxiv.org/abs/2410.10934 **[S]**
- Ariyurek, Betin-Can and Surer, *Automated Video Game Testing Using Synthetic and Human-Like Agents*, arXiv
  1906.00317: https://arxiv.org/abs/1906.00317 **[S]**
- Bergdahl et al., *Augmenting Automated Game Testing with Deep Reinforcement Learning*, IEEE CoG 2020, arXiv
  2103.15819: https://arxiv.org/abs/2103.15819 **[S]**
- Panickssery et al., *LLM Evaluators Recognize and Favor Their Own Generations*, 2024 **[M]**; Zheng et al., *Judging
  LLM-as-a-Judge* (MT-Bench), 2023 **[M]**
- GameASG-Bench, OpenGame, PlayCoder, V-GameGym, GameDevBench: as cited in `factory/llm-game-generation.md` and
  `factory/coding-agent-harnesses.md`

**Source code and vendor docs**
- WebArena evaluators:
  https://raw.githubusercontent.com/web-arena-x/webarena/main/evaluation_harness/evaluators.py **[V]**
- Lighthouse throttling and calibration:
  https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/docs/throttling.md ;
  screen emulation: https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/core/config/constants.js **[V]**
- Chromium, *Using Chromium with SwiftShader*:
  https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md **[V]**
- Chrome DevTools Protocol, Emulation domain (`setCPUThrottlingRate`, `setEmulatedVisionDeficiency`):
  https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/pdl/domains/Emulation.pdl **[V]**
- Chrome DevTools 134, calibrated CPU throttling: https://developer.chrome.com/blog/new-in-devtools-134 **[S]**
- Playwright Clock: https://playwright.dev/docs/clock **[S]**; accessibility testing:
  https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/accessibility-testing-js.md **[V]**; Android
  WebView API: `node_modules/playwright-core/types/types.d.ts` v1.63 (local) **[V]**
- axe-core rule descriptions (`target-size`, `color-contrast`):
  https://raw.githubusercontent.com/dequelabs/axe-core/develop/doc/rule-descriptions.md **[V]**
- gremlins.js (MIT): https://github.com/marmelab/gremlins.js **[V licence]**
- Azure AI Content Safety, language availability and limits:
  https://learn.microsoft.com/en-us/azure/ai-services/content-safety/language-support (redirects to the region
  availability page) **[V]**; harm categories and severity levels:
  https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories **[V]**
- WCAG 2.2 (1.4.3, 2.2.1, 2.3.1, 2.5.8) **[M]**; Android touch-target guidance (48 dp) **[M]**

**Internal**
- `docs/research/tech-and-market.md` §3
- `docs/research/factory/{llm-game-generation, coding-agent-harnesses, sandboxes-per-student}.md`
- `docs/research/content/{game-mechanics, maths-engines}.md`
- `data/kits/SCHEMA.md`
- `shared/contracts.ts`
- `docs/harvest/hp-main-engine.md` (`vision-fab`)
- `context/decisions.md` (`forge-models`, `forge-infra-azure`, `azure-only-compute`)
- `context/rejected.md#claude-on-foundry-credits`
