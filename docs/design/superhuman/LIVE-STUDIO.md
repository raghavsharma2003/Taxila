# LIVE STUDIO: things built live while the teacher talks

**Date:** 2026-10-04 · **Status:** spec (buildable), with measurements taken this session on Azure Foundry ·
**Directive:** `context/decisions.md#owner-superhuman-teacher-2026-10-04` (THE DIRECTIVE), which supersedes
`forge-live-codegen-race` as a product rule · **Owner of this spec:** main loop · **Code touched by this session:**
none in product paths; probes only under `evals/live-studio/`.

**Tags.** **[V]** read in a primary source this session (vendor doc, paper, blog by the builder). **[S]** secondary
(press, a reverse-engineering write-up, a search summary). **[U]** unverified or a design inference that must be
measured. **[M]** measured by this session on Azure (method and n in §14). **[T]** read in Taxila's own code, docs or
`context/` this session.

**Read first, not repeated here:** `docs/research/world-best/generated-learning-content.md` (the 2026 landscape,
steals S1-S11, the A2UI / MCP Apps protocols, EE-Eval, InteractScience, GameASG, ManimAgent, KVBench),
`docs/research/content/genui-reliability.md` (T1/T2/T3 tiers, `scene@1`, the 3.5% → 69.3% critique result),
`docs/research/factory/{FACTORY,coding-agent-harnesses,llm-game-generation,sandboxes-per-student,auto-validation-qa}.md`,
`docs/design/gap-audit/live-content.md` (what production shows a child today: almost nothing), the Forge G2 code
(`server/forge/g2/*`, the tgk-lite@2 kit) and its measurements (`forge-g2-e2e-azure-*`, `forge-g2-mutants-*`).

---

## 0. The answer on one page

**What Live Studio is.** A background build system inside the lesson. While the teacher explains, the Teacher Brain
decides that *this child, now* needs a thing to touch: a game, a simulation, an explorable, an animation, a diagram or
chart, an illustration, or a small multi-page "mini-site". Studio plans it, paints a skeleton within 300 ms, builds it
with the Foundry model that measured best for that kind, plays it headlessly against the verified kit's truth in an
isolated Azure sandbox, repairs it from the gate's own failure report, and reveals it at the moment the teacher reaches
for it. The child plays; every tap is evidence. The passed build goes into a library keyed by *structure*, not by
child, so the next child with the same need gets it in under a second with their own numbers, words and language.

**Why this is now possible when `forge-live-codegen-race` said it was not.** That rejection had three legs. Two of
them were measured away this session and one is replaced by design:
1. *"Every lesson start would pay minutes of codegen."* Measured: a full single-file interactive, streamed, is
   **~20-45 s of generation** on the best Foundry models and the strict gate adds **~10-15 s** [M §14]. A teacher's
   explanation segment is 60-180 s [T: lesson-arc.md]. The build fits *inside* the talk if it starts at the right
   moment, which the Brain's lookahead provides (§3.1).
2. *"Dollars per artefact against ~$3/month revenue."* Measured: **$0.002-0.09 per passed build** depending on the
   model [M §14], against G2's $0.20 offline harness. And the library effect (§3.11) makes the marginal build cost per
   child fall towards zero: a passed build re-gated with new params passed in most cases [M §14.4].
3. *"Human review before generated code reaches a child."* This is the leg the DIRECTIVE changes. It is replaced by
   (a) an **automated gate that plays the artifact against code truth** (strict all-checks, measured recall on seeded
   bugs in G2 = 1.0 [T]), (b) **architecture that makes the dangerous failures impossible rather than detected**: the
   child-visible words come only from a strings table that passed the safety gate, quantities and keys come only from
   the verified kit through the runtime, the frame has no network and no identity, and the host, never the artifact,
   grades; and (c) **human review moves to the library**: a build is promoted for cross-child reuse only after a
   sampled human review (§3.11). A first-time live build is shown to one child, once, after the gate.

**Key decisions (each has a reversal condition in §16):**

| # | decision | why (evidence) |
|---|---|---|
| D1 | **The skeleton is code, never a model.** Per kind, a pre-built skeleton (layout, palette, the Studio "being made" stage, the real numbers/labels from the plan) paints ≤ 300 ms after intent. The model's first streamed paint arrives later and *replaces* it inside the frame. | Measured streamed first paint is 6-40 s after request, TTFT alone 1-30 s [M]; no model can meet 300 ms. Google GenUI: streaming halves perceived wait but pages still take "a minute or two" [V]. |
| D2 | **One artifact contract, `studio-kit@1`**: a trusted runtime (`Studio.params / t / answer / onVerdict / event / ready / done`), a declared **test seam** (data attributes per kind), and a **stream order** (style → static markup → one script). Models write against it; the gate plays against it. | GameASG: a test interface declared before generation is what makes strict checking possible [V via world-best]; the probe's seam let a code bot play 100% of passed builds with real pointer clicks [M]. |
| D3 | **Truth never comes from the model.** Params (numbers, keys, data) are injected at runtime from the verified kit; words come from a strings table that passed Q8 *before* the build; the host grades `Studio.answer`. A build that hard-codes a value fails the param-transfer re-gate. | `generated-media-carries-facts`, `forge-g2-code-gates-miss-pictures` [T]; the photosynthesis builds needed the science-direction check to catch flows drawn backwards [M]. |
| D4 | **Model routing is per kind and measured, not chosen by name.** The router table in §6 is the output of `evals/live-studio/run.mjs`, re-run weekly; the live race (D5) uses the two best arms per kind. | Per-kind pass rates differ by model and kind [M §14]. |
| D5 | **Race two builders, ship the first that passes.** For every live build, two different model families build in parallel; the first gate-pass is revealed, the other is cancelled (or kept as the library's second variant). | Single-arm first-pass rates are well below 100% [M]; two independent arms raise P(pass by deadline) and cut tail latency; cost stays cents. |
| D6 | **Self-repair is bounded and fed by the gate, not by a judge**: ≤ 2 repair rounds, each prompt = failing check ids + details + the previous file + negative memory for that kind (placed last). | Repair recovered a large share of first-pass failures in the probe [M]; ManimAgent negative memory halves rounds [V via world-best]. |
| D7 | **QA runs server-side in an isolated pool, before the child sees anything.** Production: **Azure Container Apps Sandboxes** (GA 2026-09-23, microVM, egress deny-by-default, sub-second start) with a warm Chromium snapshot; fallback: a dedicated `studio-qa` Container App in the existing untrusted environment `taxila-forge-untrusted`. Never on the child's phone, never in the trusted API process. | GA + microVM [V]; the G2 runner showed Chromium's own sandbox fails in ACA jobs (14/14) so the VM boundary must be the boundary [T]. |
| D8 | **The child sees making, not code.** A "your teacher is making you something" moment: a living sketch that fills in (skeleton → streamed paint behind a soft veil → reveal on the teacher's cue). No progress bars with percentages, no code, no spinner. | Kids-UX research: symbolic wait indicators rejected (`rj-symbolic-wait-indicator`) [T]; Claude/v0/Lovable all show the build; for a child the build must read as craft, not machinery. |
| D9 | **The teacher narrates the build from facts, not scripts.** The Brain receives `StudioStatus` as a telegraphic row (`studio: fraction-pizza building; eta 18s; shows 3/4`), never sentences; the teacher may only point at what is `revealed`. | Recitation law; `screenHasTargets` false-reference bug in production [T]. |
| D10 | **Images are art, never facts, and are made in a separate lane.** FLUX.2-pro for text-free illustration (**~4-6 s** [M]); gpt-image-2 *low* (~17-19 s [M]) when a reference or edit is needed; *medium* (~43 s [M]) only near-line. Every label is drawn by code on top. | `generated-media-carries-facts`, KVBench 51% best [T/V]; capacity today (FLUX 1, gpt-image-2 4) produced 429s at 3 concurrent calls [M] → owner must raise capacity before live images scale. |
| D11 | **The library is the moat.** Identity = (kind, archetype, skill, band, lang-family, kit-hash, studio-kit version); params and strings are per child. Promotion after K gate passes across distinct param sets + a sampled human review. | Param transfer measured [M §14.4]; G2's identity/single-flight/catalogue code is reused [T]. |
| D12 | **Every Studio interaction is evidence with a declared trust level.** `Studio.answer` → host-graded evidence `source: studio` (weight from the comprehension ledger, initially ×0.75 like modules); `Studio.event` → process facts for the learner model (hesitation, undo, strategy) but never correctness. | `ledger-game-full-weight` open item; `in-game-success-as-mastery` rejection [T]. |

**What the owner gets when the build order (§13) is complete:** in a live voice lesson, within the first explanation,
a game or animation made for this child's misconception appears on cue, plays perfectly, counts as evidence, and is
waiting for the next child; a failed build is invisible to the child because the fallback ladder (§3.12) always has
something correct to show.

---

## 1. How the world builds things live (and what Taxila takes)

The landscape of *learning* generators is in world-best §1; this section is about the **build machinery** of the
products the owner named: agent loops, streaming partial artifacts, progressive rendering, self-repair, preview
sandboxes.

| product | how it actually builds | what makes it feel live | self-repair | sandbox / preview | tag |
|---|---|---|---|---|---|
| **Claude Code / Claude Agent SDK** | A model-in-a-loop with tools (read/edit/bash), stateless turns over a cached prefix; planner–generator–evaluator variant for long builds (FACTORY §2.10) | every tool call and diff is shown as it happens | the loop runs tests/linters and reads errors back as observations | local machine or a container; permission prompts | [T: coding-agent-harnesses §2.9-2.10] |
| **OpenAI Codex (CLI + cloud)** | Agent loop on the Responses API; each turn re-sends the whole prompt so **prefix stability = cache hits** (Codex CLI design; G2 measured 72-89% cached input with `prompt_cache_key`) | streamed reasoning summaries and a live terminal | tests as the oracle | cloud: a container per task; **internet blocked during the agent phase by default, setup scripts may use it**; allowlists and GET-only modes exist; named risks "prompt injection from untrusted web content" and "code or secret exfiltration" | [V: Codex cloud docs; S: OpenAI loop post (403 to fetch)] [T] |
| **Claude artifacts / inline visuals** | The model writes one file; the client renders it | the file renders as it streams; visuals "change or disappear as discussions evolve" | the user clicks "try fixing"; console errors are captured from the frame | a sandboxed iframe on a **separate origin (`claudeusercontent.com`)**, `sandbox="allow-scripts"`, code passed in by `postMessage`, console capture | [S: Reid Barber reverse-engineering; V: Anthropic artifacts doc for the CSP host list] |
| **Imagine with Claude** (2025-09, 5-day preview) | "No functionality is predetermined; no code is prewritten": the UI is generated as the user clicks | the app materialises around each interaction | n/a (research preview) | n/a | [S] |
| **v0 (Vercel)** | **Composite model**: RAG over docs/examples → frontier base model → **"LLM Suspense"** rewrites the stream *while it streams* (e.g. replaces a hallucinated icon import in ≤ 100 ms) → **AutoFixers** after the stream (AST fixes ≤ 250 ms, plus a fine-tuned `vercel-autofixer-01`, 10-40× faster than gpt-4o-mini) | streamed code into a live preview | deterministic fixers + a small fix model; **error-free generations 93.87% (v0-1.5-md) vs 64.71% (raw Claude 4 Sonnet)**; "LLMs ... can have errors as often as 10% of the time" | Vercel sandbox preview | [V: Vercel blogs] |
| **Lovable (Build/Agent mode)** | agent explores the codebase, edits across files, inspects logs and network | live preview updates per edit | claims **"reduces build error rates by 90%"** with auto-fix as issues appear | hosted preview | [V: Lovable blog/FAQ, vendor claim] |
| **Bolt.new** | Claude agent generating whole projects into **WebContainers** (Node.js in the browser) | instant in-browser preview, no VM | a runtime error in the preview offers an automatic "fix" action | the user's own browser tab (WebContainer) | [S] |
| **Gemini Canvas / Generative UI** | Gemini with a **long engineered system prompt**, tool endpoints, and **post-processors** (inject error reporting JS; fix JS parse errors; fix CSS directives; escape attributes; fix hallucinated assets) | streaming lets users "start interacting with a partially rendered page, reducing [the minute or two] by about a half" | post-processors + error reporting; errors "can occasionally occur" | Google-hosted sandbox | [V: arXiv 2604.09577 §5 and App. A.6] |
| **MCP Apps / A2UI** | data-only UI (A2UI) or HTML in a double iframe with deny-by-default CSP (MCP Apps); `tool-input-partial` streams partial args into a mounted view | partial-input streaming | n/a | double iframe, CSP from declared domains | [V via world-best §1.2] |
| **Code2Video** | Planner → Coder (Manim) → Critic with **visual anchor prompts** (a 6×6 grid of placement anchors) | n/a (offline video) | critic loop; +40% TeachQuiz for the full pipeline | n/a | [S: project page, arXiv 2510.01174] |

**What Taxila takes, and how it differs:**
1. **Stream into a live preview, but behind a veil** (Claude artifacts, Gemini, morphdom-style streaming renderers
   [S: pi-generative-ui, htmlstream]). The *child* never sees a half-broken page: the streamed paint is visible only
   as a soft, desaturated "sketch" layer under the Studio stage, and becomes interactive only after the gate passes.
2. **Stream-time rewriting (v0's LLM Suspense) as our "stream guard"**: while tokens arrive, a transformer drops any
   URL, `fetch`, `eval`, storage call or unknown `Studio.t` key *before* it reaches the preview frame, and records it
   as a repair hint. Cheap, deterministic, and it means the veil never shows a forbidden thing even for a moment.
3. **Post-stream fixers (v0 AutoFix, GenUI post-processors) before the gate**: deterministic, < 250 ms: close
   unclosed tags, hoist a misplaced `<script>`, add missing `Studio.ready()` after first paint, normalise `data-*`
   seam spellings. Fixers never touch truth (params, grading, strings).
4. **A gate that plays, not a judge that looks**: every product above uses runtime errors as the repair signal;
   none checks *meaning*. Taxila's gate checks behaviour against kit truth (InteractScience: widgets "work" while
   violating science; the probe found exactly this, §14.3).
5. **No internet, ever, during the build or in the artifact** (Codex cloud default, MCP Apps CSP). Unlike Codex,
   there is no setup phase that needs a network: the kit is pre-baked into the sandbox image.
6. **A teacher, not a user, drives iteration.** In every product above a human types "make it bigger". In Taxila the
   Brain's next intent (child struggled, child bored, child asked "what if...") drives the next variation through
   `set_param` (instant) or a *patch build* (§3.7).

---

## 2. The race, solved by design

The rejected design raced codegen against the lesson start with an empty library. Live Studio removes the race with
four mechanisms that compound:

1. **Lookahead.** The Teacher Brain plans the lesson arc (hook → explain → worked example → practice → probe). At the
   *start* of the hook (or on the turn where a misconception is first suspected), it emits a `StudioIntent` for the
   piece it will want at the *explain* or *practice* beat. Measured build-to-playable (p50) is 30-60 s for the best
   arms [M]; the hook plus the first explanation turn last 60-180 s in a voice lesson [T]. **Rule:** an intent must be
   emitted ≥ 45 s (p50 budget) before the beat that needs it, or it is marked `opportunistic` (revealed whenever ready,
   the teacher adapts).
2. **Library first.** Before any model call, the router looks up the library by identity (§3.11). A hit is mounted
   with this child's params in ≤ 300 ms (frame warm) and still passes the per-mount param gate in the background
   (§3.6 G-mount) before the reveal.
3. **Race two builders** (D5). P(at least one passes first try) is the complement of both failing.
4. **The fallback ladder is always loaded** (§3.12): T1 engine → G1 fill → `scene@1`/`explainer@1` template →
   board text/math → voice only. The skeleton itself is a correct, minimal visual from the plan (§3.4), so even when
   every build fails the child sees a correct picture and the teacher never points at nothing.

**The timing budget (live build, p50 / p90 targets):**

| stage | owner | budget p50 / p90 | measured or source |
|---|---|---|---|
| Brain emits intent (inside its turn) | Brain | 0 ms extra (rides the turn) | design |
| Router + library lookup | `server/studio/router.js` | ≤ 20 / 50 ms | Neon hit 49 ms p50 [T: forge-g1-turn-path] → keep an in-process LRU |
| Plan (model fills strings; code picks archetype + skeleton) | `server/studio/plan.js` on `taxila-fast` effort none | ≤ 3.5 / 4 s, **off the critical path** (skeleton uses the code plan) | 3.25 s p50, 3.70 s max, 8/8 schema-valid [M §14.5] |
| Q8 on the strings table | `server/forge/g2/safety.js` reuse | ≤ 1.5 / 3 s, parallel with build start | G2 design-time Q8 [T] |
| Skeleton painted in the frame | `src/studio/skeletons/*` | **≤ 300 ms** after intent reaches client | code only (D1) |
| First streamed paint (behind the veil) | builder | ≤ 25 / 40 s | §14 |
| Generation complete | builder | ≤ 40 / 60 s | §14 |
| Gate (G0-G9) | `studio-qa` sandbox | ≤ 12 / 18 s | 10-15 s local Chromium [M] |
| Repair round (if needed) | builder | ≤ 30 / 45 s per round, ≤ 2 rounds | §14 |
| Reveal on cue | client | ≤ 150 ms (warm frame swap) | frame pre-warm target [T: W2-B #4] |

---

## 3. Architecture

```
 Teacher Brain (server/brain/* in TEACHER-BRAIN.md; today server/director/state.js)
   | StudioIntent {need, skill, misconception?, beat, deadlineMs, child-free brief, params-ref, lang, band}
   v
 server/studio/router.js ── library hit? ──yes──> mount(libraryBuild, params) ─> G-mount gate ─> reveal on cue
   | miss
   v
 server/studio/plan.js  (code: kind→archetype→skeleton + seam; taxila-fast: strings table, teacher cue)
   |  \__ Q8 strings (forge/g2/safety.js) ── fail closed → re-plan once → else fallback ladder
   |  \__ skeleton → client (SSE studio channel) ── paints ≤ 300 ms
   v
 server/studio/build.js  race: builder A (best arm for kind) || builder B (second family)
   |  stream ─> stream-guard.js (drop URLs/eval/storage/unknown keys) ─> client veil (partial paint, frozen)
   v
 server/studio/fixers.js (deterministic post-stream fixes, ≤ 250 ms)
   v
 server/studio/qa/*  → ACA Sandbox pool `studio-qa` (Chromium snapshot): G0..G9 strict, code truth from kit
   |  pass → server/studio/store.js (content-addressed bundle, immutable) → client: READY (still frozen)
   |  fail → repair.js (≤ 2 rounds, failing checks + negative memory last) → back to QA
   v
 Brain: StudioStatus facts (building / ready / revealed / failed) → teacher narrates, reveals on cue
   v
 Child plays in src/studio/StudioFrame.tsx (opaque-origin iframe, hash CSP, no network)
   | Studio.answer → host grades (server/studio/grade.js, kit truth) → kt_evidence source=studio
   | Studio.event  → learner process facts (never correctness)
   v
 library promotion (K passes across param sets + sampled human review) → next child: instant
```

### 3.0 Components mapped to files (all new unless noted)

| component | file(s) | depends on | notes |
|---|---|---|---|
| Contracts | `shared/studio.ts` | `shared/contracts.ts` | §10; `ModuleCommand.mount` gains `src` + `sha256` (already planned in FACTORY §2.6) |
| Router | `server/studio/router.js` | `shared/engine-catalog.js`, `server/forge/planner.js` | decides library / live / fallback; per-kind model table from `server/studio/routes.json` |
| Planner | `server/studio/plan.js`, `server/studio/archetypes/*.json` | `server/azure.js` (`taxila-fast`) | archetype library (≈ 40 at launch, §3.3) |
| Skeletons | `src/studio/skeletons/{game,sim,explorable,anim,chart,diagram,image,minisite}.ts` | studio-kit | code-only first paint |
| Studio kit (trusted runtime in the frame) | `src/studio/kit/runtime.js`, `kit.css`, `primitives/*.js` | — | `Studio.*`, chart/geometry/flow primitives, tween engine (GSAP-like, own code, §3.13) |
| Builder adapters | `server/studio/builders/{responses,chat}.js` | `server/azure.js` (+ streaming), `server/forge/g2/model.js` (Responses) | streaming, usage, cost; `azure.js` gains `chatStream()` |
| Build orchestrator | `server/studio/build.js` | builders, stream-guard, fixers, qa, repair | race of 2, cancellation, deadlines |
| Stream guard | `server/studio/stream-guard.js` | `server/forge/g2/lint.js` ideas | token-time rewriting |
| Fixers | `server/studio/fixers.js` | oxc parser (already a dep via rolldown) | deterministic |
| QA gate | `server/studio/qa/{gate.js,checks/*.js,kinds/*.js}` | Playwright in the sandbox image | ports `evals/live-studio/qa.mjs`; `forge/g2/qa.js` patterns (route-recorded network, CSP probe, determinism) |
| QA pool client | `server/studio/qa/pool.js` | ACA Sandboxes data plane | warm snapshot, per-build context |
| QA sandbox image | `infra/studio-qa/Dockerfile`, `infra/studio-qa/server.mjs` | Playwright Chromium | HTTP: `POST /gate {kind, bundle, params, strings}` → report |
| Repair | `server/studio/repair.js`, `server/studio/memory/<kind>.json` | — | negative memory (validated failure patterns) |
| Store / library | `server/studio/store.js`, `server/studio/library.js` | `server/forge/g2/store.js` (Blob zones), Neon | content-addressed bundles; identity index |
| Grader | `server/studio/grade.js` | `server/forge/g2/truth.js`, `server/forge/kitmath.js` | one grader for gate and lesson |
| Lesson seam | `server/routes/lesson.js` (edit), `server/studio/seam.js` | conductor hooks | studio status rides the turn response + an SSE channel |
| Studio channel | `server/routes/studio.js` | `server/http.js` | `GET /api/studio/stream?lesson=` SSE: skeleton, partial, status, ready |
| Client stage | `src/studio/{StudioStage.tsx,StudioFrame.tsx,Veil.tsx,useStudio.ts}` | `src/modules/host.tsx` patterns | the "being made" moment and the reveal |
| Desk integration | `src/child/lesson/{WorkTray,Desk}.tsx` (edit) | — | tray kind `studio` |
| Evidence | `server/comprehension/*` (edit: `via` gains `studio`) | migration | §3.10 |
| Telemetry | `server/studio/telemetry.js`, table `studio_build` | Neon | every build's timings, cost, checks |
| Evals | `evals/live-studio/*` (exists: this session), `evals/live-studio/router-bench.mjs` | — | weekly router table |
| Migration | `db/migrations/0NN_studio.sql` (number allotted by the main loop) | — | `studio_build`, `studio_library`, `studio_mount` |

### 3.1 Intent: what the Teacher Brain asks for

The Brain owns *when* and *why*; Studio owns *how*. The Brain emits at most one live intent per beat and at most
**3 live builds per lesson** (cost guard; library hits do not count).

```ts
// shared/studio.ts
export type StudioKind = "game" | "simulation" | "explorable" | "animation" | "diagram" | "chart" | "image" | "minisite";
export interface StudioIntent {
  intentId: string; lessonId: string;              // never the child id in anything sent to a model
  kind: StudioKind; skillId: string; itemIds?: string[];   // kit items the piece must use (truth)
  need: "introduce" | "contrast_misconception" | "practice" | "probe" | "explore_question" | "celebrate_mastery";
  misconceptionId?: string;                        // from the kit's diagnostic catalogue, never free text
  beat: "hook" | "explain" | "worked_example" | "practice" | "probe" | "recap";
  neededAtMs: number;                              // Brain's estimate of when it will reach for it (lesson clock)
  priority: "on_cue" | "opportunistic";
  style: { band: "6-9" | "10-12" | "13-15"; lang: "hi" | "en" | "hinglish"; interest?: string /* from an allowlist */;
           representation?: "concrete" | "pictorial" | "symbolic"; motion: "calm" | "lively" };
  childQuestion?: { normalised: string };          // only via the brain's paraphrase, PII-scrubbed; see §5.4
}
```
The Brain decides `kind` from the learner model (what has worked for this child: `representation` preference,
engagement by format, the F1-F8 format allocation in W4-B #2) and from the content: misconceptions about *process*
→ animation or simulation; *quantity* → game with the kit's model pictures; *data* → chart; *structure/parts* →
diagram; *curiosity questions* → explorable or mini-site. That policy lives in TEACHER-BRAIN.md; Studio only enforces
admissibility (a kind the skill cannot support falls back to the closest admissible kind).

### 3.2 Router: library, live, or fallback

Deterministic code, no model:
1. **Admissible?** kind × skill × kit truth available (verified integers/fractions, verified data sets, a diagnostic
   with one correct option, a science process with a verified flow list). If not: fallback ladder.
2. **Library lookup** by identity (§3.11). Hit with status `promoted` → mount now. Hit with status `live_passed`
   (passed for another child, not yet reviewed) → mount for this child too only if the build has ≥ 3 passes across
   distinct param sets and 0 incident reports (§3.11), else build live.
3. **Budget check:** lesson live-build count < 3, daily per-child spend < $0.30, global breaker (G2's breaker code).
4. **Live build** with the per-kind route: `routes.json` = `{kind: [{dep, effort, weight}], race: 2, deadlineMs}`
   produced by the weekly router bench (§6).

### 3.3 Plan: archetypes, not free design

A **live build never designs a new mechanic from nothing**; it instantiates an *archetype* (a pedagogically reviewed
interaction pattern with a declared seam and an ideal state graph, EE-Eval style) and writes the *code and the
craft*. The archetype library is the bridge between "real games, not basic" and "always correct".

- `server/studio/archetypes/*.json`, ≈ 40 at launch, grown by the offline Forge (G2) and by review:
  games (shade-the-fraction, number-line jump, balance scale, sort-into-bins, build-with-tens, match pairs, catch the
  odd one, sequence the steps, estimate-then-reveal), simulations (slider → law: shadow/sun, lever, circuit, density,
  pendulum, food chain population), explorables (scrub a process, compare two cases, predict-observe-explain),
  animations (process flow, transformation, growth over time, cause→effect chain), charts (bar, pictograph, line,
  pie with reading questions), diagrams (labelled parts, cycle, flow, timeline, map with places), mini-sites (a
  3-5 page "explore a topic" site with a quiz page).
- An archetype declares: `seam` (required data attributes, exactly as the probe's briefs did), `states` (ideal FSM),
  `checks` (which G-checks apply and with which tolerances), `paramsSchema` (zod), `stringsKeys`, `skeleton` id,
  `budget` (bytes, draw calls), `antiPatterns` (negative memory seeds).
- **The model's plan job is small:** `taxila-fast` (effort none) writes the **strings table** in the child's language
  and band, the **interest skin** (allowlisted interests only), a one-line *craft direction* (palette mood, motion
  style), and a telegraphic **teacher cue**. Measured 3.25 s p50, 8/8 valid on the strict schema [M]. Code fills
  everything else (params from the kit, seam from the archetype).

### 3.4 Skeleton ≤ 300 ms (code)

Each archetype names a skeleton: a tiny prebuilt renderer in the studio kit that draws the **correct, minimal
version** of the piece from the plan's params (the bar chart with right heights but plain bars; the pizza with the
right number of equal slices; the plant with arrows in the right directions and labels). It is shown inside the
Studio stage with the "being made" treatment (§4.2). Properties:
- Correct by construction (kit primitives; the same primitives the gate trusts).
- Interactive **only if** the build fails and the router chooses "skeleton as fallback" (then the skeleton *is* the
  T1-grade activity and grades through the host). This makes the skeleton the first rung of the fallback ladder.
- Budget: ≤ 8 KB per skeleton, pre-bundled with the frame; mount ≤ 150 ms warm.

### 3.5 Streamed build

**Prompt structure** (law: shapes not lines; rules last): role → `studio-kit@1` API → archetype (seam, states,
params schema, string keys, craft direction, quality bar) → kind-specific science/maths constraints (e.g. flow
directions) → output contract (stream order) → negative memory for this archetype → binding rules. No example code
(it becomes a phrase bank; the same law as persona prompts). The probe's `SYSTEM` + `userPrompt` in
`evals/live-studio/kinds.mjs` is the measured v0 of this prompt.

**Streaming path:** builder SSE → `stream-guard.js` → studio channel → `Veil.tsx` → frame `postMessage({type:
"partial", html})` → the trusted kit morphs the DOM (morphdom-style diff [S]) for markup only; `<script>` blocks are
held until complete *and* until the gate passes; the veil layer is `pointer-events: none`, desaturated, 60%
opacity, under the stage's "making" animation. **Partial paint is decoration, never interaction.**

**Measured stream behaviour [M §14]:** models emitted the style block first and static markup second when asked, so
a meaningful partial paint (≥ 15% of the viewport) appeared at 6-40 s; some outputs built their DOM from script and
showed nothing until the script ran (`paint: -` rows). The stream-order compliance rate is a router metric.

### 3.6 The gate (strict, before the child)

All checks are code; a build ships only if **every hard check passes** (`rj-mean-check-pass-as-quality`). The probe
implements G0-G9 for 3 kinds in `evals/live-studio/qa.mjs`; production ports them to `server/studio/qa/`.

| id | check | how | kinds |
|---|---|---|---|
| G0 | static | size ≤ 60 KB; no URL; no `eval`/`Function`/storage/`fetch`/XHR/WebSocket (AST, not regex, in production: reuse `forge/g2/lint.js` walker) | all |
| G1 | boot | `Studio.ready()` ≤ 5 s; 0 console errors, 0 page errors, 0 CSP violations; 0 network requests (route-recorded, dead proxy); a CSP probe fetch from inside must be refused | all |
| G2 | seam | every required data attribute present and live (e.g. `data-shaded` changes on tap) | all |
| G3 | words | every visible text node ⊆ strings table ∪ numerals (+ allowed punctuation); `Studio.t` called only with table keys | all |
| G4 | layout | 360×640 and 412×915 and 768×1024: no horizontal scroll; every target ≥ 44 px (≥ 56 px for band 6-9); targets inside the viewport; labels do not overlap (> 15% of the smaller box); **labels anchored to their referent** (added after §14.3) | all |
| G5 | play-truth | scripted play with **real pointer clicks at element centres**: a wrong path (graded wrong by the host, no advance) then the right path (graded right, advance); all items to `done`; the host's grade is the truth | game, chart, explorable, minisite quiz |
| G6 | semantics | kind-specific truth: bar heights ∝ values within 1.5 px on a common baseline and **ticks at the right heights** (≤ 6 px); particles of each flow move in the scientifically right direction (water up, CO₂ into the leaf, O₂ out); a fraction whole has exactly *d* equal parts (area equality ≤ 2% in production); geometry constraints by solver (S10) | per archetype |
| G7 | state graph | the reachable interaction FSM (from the seam events) matches the archetype's ideal graph (EE-Eval) — required states reachable, no dead ends, reset works | game, simulation, explorable |
| G8 | no-hint / no-leak | before the child acts, the key is not distinguishable (identical computed styles across options/bars, nothing pre-shaded); no answer text rendered before commit | game, chart, quiz |
| G9 | perf | 4× CPU throttle: rAF p95 ≤ 50 ms; long tasks ≤ 2 during play; memory ≤ 60 MB; animation pauses when hidden | all |
| G10 | determinism | a second run with the same seed gives the same host-side event trace | game, sim |
| G-transfer | param transfer | re-run G2-G8 with a second, held-out param set from the same kit topic (catches hard-coded values) | all, before library entry |
| G-mount | per-child mount | before revealing a library build to a new child: G1 + G3 + G5/G6 with *this* child's params and strings | library hits |

**Advisory (never blocking until calibrated, `rj-holistic-model-judge-gate`):** a binary checklist vision judge on
two frames (cross-family: `taxila-brain` if the builder was not an OpenAI model, `grok-4.3` vision otherwise
[U: grok vision availability]) for "looks crafted / readable / coherent palette / child-appropriate imagery";
results feed the router's quality score and the human review queue, never the reveal.

**Where it runs (D7).** Production: ACA Sandboxes, one sandbox group `studio-qa` in eastus2 (same region as the
models), image `infra/studio-qa` (Node 22 + Playwright Chromium + the studio kit + `qa/` checks), egress
`defaultAction: Deny` with no allow rules, no secrets in the sandbox (the trusted orchestrator posts the bundle in and
reads the report out). Warm pool of N=4 snapshots resumed per build; one browser per sandbox, one context per build.
**Blockers [T]:** the subscription's concurrent sandbox core quota was 1 on 2026-10-02 and our SP cannot assign the
*SandboxGroup Data Owner* role: owner action O-1 (§15). Until then: `studio-qa` as an always-on Container App
(1 vCPU / 2 GiB, min replicas 1) in the existing untrusted environment `taxila-forge-untrusted`, ingress internal
only, egress blocked by the environment's NSG/UDR [U: verify the env has no outbound]. Cost: ≈ $0.000024 × 1 + $0.000003
× 2 per second ≈ **$78/month always-on** [T: ACA_PRICE], acceptable for v1.

### 3.7 Self-repair

- **Input:** failing check ids + details (pixel errors, which label overlapped, the console error text truncated to
  240 chars), the previous file, the archetype's negative memory (validated failure patterns from earlier builds,
  e.g. "roots seam on an empty `<g>`", "Oxygen label placed by the sun", "tick labels as text not at value height"),
  **placed last** (position is mechanism [T]).
- **Output:** the full corrected file (v1). v2: unified diff patches for files > 8 KB once a patch applier with a
  dry-run lands (Aider/Codex `apply_patch` style [T: coding-agent-harnesses §2.1, 2.4]); measured per-round time
  favours full files at today's sizes (repair rounds ran 14-61 s [M]).
- **Bounds:** ≤ 2 rounds per builder; the race partner keeps building meanwhile. A build that fails G1/G3/G8 twice
  (safety-shaped failures) is dropped, not repaired again.
- **Negative memory curation:** a failure pattern enters `server/studio/memory/<archetype>.json` only after it
  recurs ≥ 3 times across builds and a human (or the main loop) writes it as a *shape* (never as code to copy).
  Rejected memories go to `context/rejected.md`.
- **Patch builds for teacher-driven variation:** "make it harder", "same game with my brother's name"... no:
  names never enter (§5.4). Variation = new params (instant, `set_param` or re-mount) or a patch build on a passed
  file with a one-line change request from the Brain's closed vocabulary (`harder`, `slower`, `more_items`,
  `swap_representation`, `add_hint_step`), re-gated in full.

### 3.8 States, progressive reveal and hand-off

```
queued → planning → skeleton_shown → building(A|B) → checking → (repairing → checking)* → ready → revealed → in_use → retired
                                                     ↘ failed (both arms) → fallback_shown
```
- `ready` is *not* visible to the child; it is a fact for the Brain.
- **Reveal rules:** `on_cue` builds reveal when the Brain's turn includes `studio.reveal(intentId)` (the teacher's
  line refers to it); `opportunistic` builds reveal at the next natural pause (end of the teacher's turn, never while
  the child is speaking or answering). A `ready` build not revealed within 4 minutes is retired to the library.
- **Hand-off:** at reveal, the Brain receives `StudioFacts` (what is on screen, as values: `pizza 4 slices; target
  3/4; check button`) so its next line is grounded (W2-B #1 `moduleFacts`), and the frame is unfrozen.
- **During use:** the Brain gets each graded answer and process facts within the turn loop; it can `highlight`,
  `set_param`, `reveal` (next step), or `retire`.

### 3.9 Teacher narration

The teacher talks about the build like a real teacher who is drawing on the board while talking, never like a
machine: *shapes* the Brain may use (never fixed lines; `rj-static-filler-list`):
- **Announce intent** (once, at `skeleton_shown`): a promise tied to the child's last words. Shape: *uptake of what
  the child said + "let me make you something for that" + what it will let them do*.
- **Fill the wait** with teaching, not with the build: the build is background. The teacher keeps explaining with the
  skeleton visible. Never "loading", never a countdown.
- **Reveal** (`studio.reveal`): a gesture-shaped line ("dekho, ye tumhare liye") followed immediately by the first
  instruction grounded in `StudioFacts`.
- **Failure:** the teacher never mentions it; she uses the skeleton or the fallback as if it were the plan.
- The voice lane (realtime model) receives `StudioStatus` as a session-context row updated on change; the cascade
  lane receives it in the compiled facts block. Both are telegraphic.

### 3.10 Evidence back to the learner model

| event | trust | goes to | weight |
|---|---|---|---|
| `Studio.answer(v)` graded by host vs kit truth | host-graded value; *which* option the child tapped is the frame's claim (same caveat as G2 `serve.js`) | `kt_evidence` with `via = 'studio'`, `ebo` = item id, attempt index | ×0.75 of dialogue until `ledger-game-full-weight` is resolved [T] |
| `Studio.event(name, data)` (≤ 12 keys, numbers/short enums) | frame claim | learner process facts: time-to-first-action, undo count, strategy tag (e.g. counted slices one by one vs tapped in a run) | never correctness; features for the comprehension engine's process channel |
| `stuck` (no action 20 s / repeated same wrong) | host-derived | Brain trigger: hint / re-teach | — |
| completion + time | host | engagement-by-format for the format allocator | — |
Rules: no free text from the frame ever reaches a prompt (bridge v2.1 [T]); events are rate-limited (≤ 10/s) and
size-limited (≤ 1 KB).

### 3.11 Cache and library (the effect that makes it scale)

- **Identity** = sha256(kind, archetype id, skill id, band, lang family {hi, en-hinglish}, kit hash, studio-kit
  version, builder model id). Params and strings are *not* in the identity: they are injected per mount.
- **States:** `live_passed` (passed the gate for one child) → `transfer_passed` (G-transfer with a held-out param
  set) → `promoted` (≥ 3 passes on distinct param sets **and** a sampled human review: 100% of the first 50 per
  archetype, then 10%) → `retired` (incident, review reject, kit change, studio-kit version change).
- **Reuse:** a `promoted` build is mounted for any child whose intent maps to the same identity (G-mount runs in
  the background before reveal: ~10 s; the skeleton covers it). `transfer_passed` builds are reusable after G-mount.
- **Variants:** keep ≤ 3 promoted variants per identity (different models / craft); the format allocator can A/B
  them on learning outcome (next-item-unaided correctness), which is the experiment loop the DIRECTIVE asks for.
- **Storage:** reuse `server/forge/g2/store.js` trust zones: run containers per build (untrusted writes), private
  catalogue (trusted), public content-addressed bundles (immutable, `forge/studio/b/<sha>.html`).
- **Measured transfer [M §14.4]:** of the builds that passed, the share that still passed with new params (fraction:
  1/3, 4/6, 2/7; chart: new values and a different top bar; photosynthesis: the English strings table).

### 3.12 Fallback ladder (never a placeholder)

1. Library build (promoted). 2. Live build (race). 3. **Skeleton as the activity** (correct, plain, host-graded).
4. T1 engine (`shared/engine-catalog.js`). 5. G1 fill / `scene@1` / `explainer@1` template. 6. Board text/math.
7. Voice only. Each step down writes a `studio_gap` demand row that feeds the archetype backlog and G2.

### 3.13 Generated animations

- **In the frame (live):** SVG + CSS + the kit's tween engine (`src/studio/kit/primitives/tween.js`: timelines,
  easing, stagger, path-follow, scrub, pause/resume; a GSAP-like API written in-house, so no licence question and no
  network). The model writes scenes against it; the gate measures motion semantics (G6) and pause/scrub (G5).
- **Teacher-synced:** animations expose `steps`; the Brain advances them on its clause cues (phrase-level, 400 ms
  pre-roll per `teacher-stage-cue-scheduler`, never word-level: `karaoke-from-transcript-estimate` [T]).
- **Manim-style video:** offline only (minutes per clip, ManimAgent 19-31 min/task [V via world-best]); rendered on
  the AWS build-time GPU lane or ACA jobs into the library; never in a live window.
- **Canvas** is allowed only for decoration layers; anything the gate must check (labels, flows, parts) must be SVG/DOM.

### 3.14 Diagrams and visualisations

Charts, number lines, geometry, maps, timelines: the kit ships **truth primitives** (`chart.bar(data, scale)`,
`geo.construct(constraints)` via a JSXGraph-MIT-based solver [V licence via world-best], `map.places(ids)` from a
vetted India/world vector set, `timeline(events)`). The model composes, styles and animates them and adds
interaction, but the geometry/scale is computed by the primitive, so G6 checks become cheap invariants. Free-drawn
charts are allowed (the probe measured them) but must pass the same G6 tick/height truth.

### 3.15 Generated images

- Lane: `server/studio/image.js`; FLUX.2-pro (`taxila-flux2`) for text-free art, 4.1-5.9 s [M]; gpt-image-2
  (`taxila-image`) *low* 16.5-18.7 s, *medium* 43.6-43.8 s [M]; FLUX.1-Kontext for consistent edits of a reference.
- Use: backdrops, characters (from the tutor's StylePack references), illustrations for stories and mini-sites,
  "what does a mangrove look like". **Never** labels, counts, maps, diagrams or anything with a right answer.
- Gate: OCR any-text presence = fail (text-free prompt contract), Content Safety image, a binary vision checklist
  (no people stereotypes, no logos/currency/emblems: `content-safety-sole-gate` [T]); labels drawn by code on top.
- **Capacity is the blocker:** 3 concurrent calls hit 429 on both FLUX.2-pro (capacity 1) and gpt-image-2
  (capacity 4) [M]. Owner action O-2: raise to ≥ 20 (FLUX) and ≥ 20 (image) before live images are on by default.

### 3.16 Mini-sites

A mini-site is 3-5 linked pages in one bundle (hash routing inside the frame), built *across* a lesson (deadline =
end of lesson, `opportunistic`), e.g. "Explore the Indus Valley" with an illustrated timeline, a map, a "life of a
child in Lothal" story page with FLUX art, and a 5-question quiz page graded by the host. Same contract and gate;
each page is gated separately and pages reveal as they pass. Larger budget: ≤ 200 KB, 2 builders × 2 pages each.

---

## 4. UX in detail

### 4.1 Principles
1. **Magic, not machinery.** The child sees a picture being made, like a teacher sketching on the board.
2. **The teacher is the maker.** Copy and motion attribute the making to the teacher ("Asha di is making this"),
   never to "AI" or "the app"; the child-safety floor still holds (she never denies being an AI if asked).
3. **Never wait on it.** The lesson continues; the piece arrives into a lesson that was already going.
4. **Correct from the first pixel.** The skeleton is correct; the reveal only adds craft and interaction.
5. **One thing at a time.** At most one Studio piece on screen; the board and the teacher window keep their places.

### 4.2 The "being made" moment (frame by frame)
- **t = 0 (skeleton_shown):** the WorkTray slides up 24 px with a soft paper texture; the skeleton draws itself in
  pencil strokes (SVG `stroke-dashoffset`, 600 ms), in the teacher's accent colour; a small hand-drawn caption chip
  in the child's language: *shape*: "{teacher} is making this for you" (one of the strings, Q8-checked, rotated
  per lesson so it never becomes a tic).
- **t = first streamed paint:** colour washes in behind the pencil lines (the veil at 60% opacity, desaturated),
  like watercolour; elements appear with a 200 ms fade (morph diff only adds). No layout jumps: the skeleton
  reserves the frame size.
- **checking / repairing:** nothing changes visibly (the child must not see "fixing").
- **ready:** a tiny sparkle at the tray corner (no sound), so the teacher's reveal line lands on something that looks
  finished.
- **revealed:** the veil lifts (300 ms), the pencil layer fades, a gentle scale 0.98 → 1.0, and the first target
  pulses once. The teacher's line starts within the same 300 ms.
- **Reduced motion** (OS setting or band 6-9 calm mode): no pencil animation; a cross-fade only.

### 4.3 How the teacher refers to it
- Only `revealed` pieces are referred to (`screenHasTargets` reads Studio state, closing live-content gap 5).
- Her lines name what the child can *do*, grounded in `StudioFacts` values, in the child's register.
- She ties it to the child: *uptake of their mistake* ("tumne kaha 1/4 bada hai… chalo dekhte hain").
- She narrates *their* action, not the game's: "tumne teen hisse rang diye — kitne bache?"

### 4.4 Failure, from the child's side
- Both builders fail → the skeleton becomes the activity (it already looks like the plan), or the ladder steps down;
  the caption chip disappears quietly; the teacher continues. **No error card, ever.** (Production today shows "This
  activity can't open here" then an empty beige box: live-content M2 [T].)
- Runtime error after reveal (frame `error`) → freeze, cross-fade to the skeleton-as-activity with the same params;
  the Brain gets `studio.failed_after_reveal`, says nothing about it, continues from the same item. Incident row;
  the build is retired from the library.

### 4.5 Placement and devices
- Phone portrait: the tray takes the lower 55% (teacher window above), frame 360×≈400 world units scaled.
- Tablet / landscape: tray beside the teacher window. Layout gates G4 test three viewports.
- Low-end (₹8-10k, 3 GB): the frame pre-warms at lesson start; animations obey G9 at 4× throttle; images lazy and
  ≤ 120 KB WebP. Offline: library builds for the next lesson are prefetched into the PWA cache.

### 4.6 What parents see
In the parent corner's lesson view: "Made for Riya today: a pizza fraction game (because she thought 1/4 is bigger
than 1/2)" with a thumbnail and the child's result, generated from the build record and the evidence row; never the
code, never model names.

---

## 5. Sandbox and security

### 5.1 The child's frame
- Opaque origin: `<iframe sandbox="allow-scripts">` (no `allow-same-origin`, no forms, popups, top-navigation,
  downloads), served from the separate play origin used for G2 bundles.
- **Hash-only meta CSP** per bundle (G2 `bundle.js` pattern): `default-src 'none'; script-src 'sha256-…' (kit) 'sha256-…'
  (build); style-src 'sha256-…' 'unsafe-inline'`[for style attributes]; `img-src data: blob:`; `connect-src 'none'`;
  `frame-src 'none'`; `worker-src 'none'`; `form-action 'none'`; `base-uri 'none'`. The probe used the same policy
  with `'unsafe-inline'` scripts; production pins hashes.
- **Partial paint channel:** the frame accepts `partial` messages only before `ready`; partial HTML is sanitised by
  the kit (DOMPurify-equivalent allowlist, no `<script>`, no `on*` attributes, no `href`/`xlink:href` except `#…`).
- The bundle that is revealed is exactly the bytes that passed the gate (sha256 check in `ModuleHost`).
- The runtime freezes intrinsics and `Studio` (probe: `Object.freeze` + non-configurable property) before the build's
  script runs.

### 5.2 The build and QA side
- Builders are model calls from the trusted API with child-free prompts; generated code never executes in the API
  process (it is a string until it reaches Chromium in the QA sandbox).
- QA sandbox: microVM, egress deny, no credentials, no child data (params are kit data; strings are child-free
  templates *before* name/interest substitution… see 5.4), single-use context per build, recycled after 50 builds.

### 5.3 Content safety
- Strings table: G2 Q8 (local predicates incl. romance/companion register, Content Safety per string, `taxila-brain`
  classifier for Hindi/Hinglish, fail closed) before the build starts, so a whole build is never paid for and then
  rejected for a benign word (`forge-g2-q8-after-build` [T]).
- Built code: G3 makes the strings table the only source of words; G0 blocks network/eval; the image lane has its own
  gate.

### 5.4 Child data and prompt injection
- **No child identifier, name or free text in any builder prompt.** The intent carries `childQuestion.normalised`
  only after the Brain's paraphrase through the PII scrub (`scrub-pii` predicates [T]); names, school, place never.
- A child's words can try to steer a build ("make it say a bad word", "make a game about [unsafe topic]"): intents
  come from the Brain's closed vocabulary (`need`, `kind`, `misconceptionId`, `interest` from an allowlist), so the
  child's text never becomes an instruction to a builder; curiosity questions become `explore_question` intents whose
  topic must map to a kit skill or an allowlisted general-knowledge topic, else the teacher answers in words.
- The child's name may appear in a piece only through a runtime string slot `{child}` filled by the host at mount
  (never in a prompt, never in a library bundle).

---

## 6. Models and routing

Deployed on the Foundry account `raghavsharma1729-compan-resource` (ARM listing 2026-10-04 [M]): `taxila-codex`
(gpt-5.3-codex), `taxila-brain` (gpt-5.6-sol), `gpt-5.6-terra`, `taxila-fast` (gpt-5.6-luna), `taxila-kimi-code`
(Kimi-K2.7-Code), `DeepSeek-V4-Pro`, `DeepSeek-V4-Flash`, `taxila-ds41` (DeepSeek-V4.1-Flash, **Fireworks meter, not
Direct**: excluded [T: MODEL-ROUTER R5]), `grok-4.3`, `grok-4-20-*`, `grok-4-1-fast-*`, `taxila-grok46`,
`taxila-oss120`, `Mistral-Large-3`, `Cohere-command-a-plus`, `gpt-4.1-mini`, `taxila-image` (gpt-image-2),
`taxila-flux2` (FLUX.2-pro), `taxila-kontext` (FLUX.1-Kontext-pro), `taxila-sora` (retiring 2026-10-15),
`taxila-realtime`, `gpt-realtime-2.1-mini`, `taxila-live`, `taxila-live-transcribe`, `taxila-transcribe`,
`gpt-4o-mini-transcribe`, `gpt-4o-mini-tts`, `text-embedding-3-small`.

<<ROUTING>>

---

## 7. Latency and cost budgets

<<BUDGETS>>

---

## 8. Quality gates and the numbers we publish

- **Per archetype, weekly:** strict all-checks pass rate at first try and after repair, P(pass by deadline) with the
  race, time-to-playable p50/p90, cost per passed build, transfer pass rate, incident rate after reveal. Never means
  of check pass rates.
- **Ship bar for an archetype to be live-buildable:** P(a passed build by `neededAtMs`) ≥ 0.95 with the race, on
  ≥ 30 runs of the router bench; otherwise the archetype is library-only (built offline, reviewed, mounted).
- **Human review:** 100% of the first 50 library promotions per archetype, then 10% random; reviewer rubric = G-list
  in human words + "would a good teacher use this?" + "is anything wrong, even subtly?" (the hand-drawn-partition
  class of error code cannot catch [T]).
- **Child-side quality:** completion rate, next-item-unaided correctness after a Studio piece vs the fallback
  (the experiment the DIRECTIVE asks for), "show me again" requests.

---

## 9. Failure modes

| failure | detection | response |
|---|---|---|
| Both builders miss the deadline | build clock vs `neededAtMs` | Brain gets `studio.late`; skeleton-as-activity or ladder; the build continues and is revealed later if still relevant (opportunistic) or goes to the library |
| Builder stream stalls (no tokens 20 s) | stream watchdog | cancel that arm; the race partner continues; measured: DeepSeek-V4-Pro hit the 300 s timeout on 2 of its first 3 fraction builds [M] |
| Content filter fires on a builder | `content_filter` error | log, drop arm, do not retry same prompt; if both, fallback; the strings table is re-checked |
| Gate infrastructure down | pool health | **no reveal of un-gated code, ever**; library `promoted` builds still mount (G-mount degraded to G1+G3 on device? no: G-mount is skipped only for builds with ≥ 20 prior mounts and 0 incidents) |
| Hard-coded values (passes for one child, wrong for the next) | G-transfer before library; G-mount per child | retire the build; negative memory |
| Science drawn backwards / label at wrong referent | G6 / G4 anchoring | repair with the check detail |
| Runtime error after reveal | frame `error` | §4.4 |
| Child taps faster than the game can handle | G9 + debounce in kit | kit-level input queue |
| The teacher refers to a piece that is not there | `screenHasTargets` reads Studio state | the Brain's line is regenerated (say.js guard) |
| Cost runaway | per-lesson 3, per-child $0.30/day, global breaker | breaker trips → library and fallback only |
| Model deployment retired/renamed | router bench fails | the route drops to the next arm; alert |
| Quota 429 | per-deployment token buckets in `build.js` | route to the second arm; images queue (§3.15) |
| A prompt-injection attempt via the child's words | closed-vocabulary intents (§5.4) | teacher answers in words |

---

## 10. Contracts

```ts
// shared/studio.ts (continued)
export interface BuildPlan {
  planId: string; intentId: string; archetype: string; kind: StudioKind; skeleton: string;
  params: Record<string, unknown>;                    // from the kit, zod-validated against the archetype
  strings: Record<string, string>;                    // Q8-passed; may contain {child} slot only via host
  craft: { mood: "warm" | "cool" | "earthy" | "night"; motion: "calm" | "lively"; interest?: string };
  teacherCue: string;                                 // telegraphic, for the Brain only
  seam: Record<string, string>; checks: string[]; budgets: { bytes: number; ms: number };
}
export type StudioStatus =
  | { state: "planning" | "skeleton_shown"; intentId: string }
  | { state: "building"; intentId: string; etaMs: number }
  | { state: "ready" | "revealed" | "in_use"; intentId: string; buildSha: string; facts: StudioFacts }
  | { state: "failed"; intentId: string; fallback: "skeleton" | "engine" | "template" | "board" | "voice" };
export interface StudioFacts { kind: StudioKind; archetype: string; onScreen: Record<string, string | number>; step?: number; itemId?: string }
export interface BuildRecord {
  buildSha: string; identity: string; planId: string; builder: { dep: string; effort?: string };
  timings: { ttftMs: number; firstPaintMs?: number; genMs: number; qaMs: number; repairs: number; toPlayableMs: number };
  usage: { in: number; cached: number; out: number }; usd: number;
  gate: { pass: boolean; checks: { id: string; pass: boolean; detail?: unknown }[] };
  status: "live_passed" | "transfer_passed" | "promoted" | "retired" | "failed";
}
// client ← server (SSE /api/studio/stream)
export type StudioWire =
  | { t: "skeleton"; intentId: string; skeleton: string; params: Record<string, unknown>; strings: Record<string, string> }
  | { t: "partial"; intentId: string; html: string }          // guarded, markup-only, pre-ready
  | { t: "status"; status: StudioStatus }
  | { t: "ready"; intentId: string; src: string; sha256: string };
// lesson turn response gains: studio?: { reveal?: string; retire?: string; setParam?: { intentId: string; name: string; value: unknown } }
```

Database (`0NN_studio.sql`): `studio_build(build_sha pk, identity, plan jsonb, record jsonb, status, created_at)`,
`studio_library(identity pk, promoted_shas text[], stats jsonb)`, `studio_mount(lesson_id, intent_id, build_sha,
child_id, revealed_at, outcome)` (child id only here, under the existing erasure cascade).

---

## 11. Acceptance tests

**Offline / CI**
1. `evals/live-studio/qa.mjs` seeded-mutant suite (port G2's mutant approach): for each of the 3 probe kinds, ≥ 15
   mutants (wrong part count, pre-shaded part, bar heights off by 3 px, tick at wrong height, water flowing down,
   O₂ into leaf, label overlap, stray English word, fetch call, `Studio.answer` with a hard-coded value, done never
   called, overflow at 360 px). **Recall = 1.0, false alarms 0/6 goldens** (G2's bar).
2. `tests/studio-contracts.test.mjs`: schemas, CSP builder, hash pinning, partial-HTML sanitiser (XSS corpus).
3. `tests/studio-router.test.mjs`: library-first, budget caps, admissibility, never an un-gated reveal.
4. Stream-guard unit tests: URLs/eval/storage/unknown keys removed mid-token-boundary.

**Azure (router bench, weekly; costs money)**
5. `node evals/live-studio/run.mjs --n 10` over all live archetypes: publish the §6 table; an archetype is live only
   if P(pass by 60 s) with the race ≥ 0.95 (n ≥ 30).
6. Param transfer (`transfer.mjs`) ≥ 0.9 on promoted builds; anchoring (`anchor.mjs`) 100% on promoted photosynthesis-
   class builds.

**Production (Playwright at 360×800 and the probe fleet)**
7. Voice lesson on a fraction topic with a scripted misconception: skeleton ≤ 300 ms after the intent's turn
   response; a passed build revealed on the teacher's cue in ≥ 9/10 runs; 0 un-gated reveals; the teacher's next line
   mentions only on-screen values (100%).
8. Forced builder failure (both arms return garbage): no error card, skeleton-as-activity graded by host, teacher
   never mentions a failure (transcript lint).
9. A second child with the same need gets the library build in ≤ 1 s with their own params; G-mount passes.
10. Evidence: a Studio answer writes `kt_evidence(via='studio')` with the host's grade, never the frame's.
11. Security: from inside a revealed build, `fetch`, `new Image().src=…`, CSS `url()`, `top.location`, `postMessage`
    of a forged `answer` with `correct:true` → all refused or ignored (host re-grades).
12. Low-end: 4× throttle on the reference profile, frame p95 ≤ 50 ms during play for every archetype.

---

## 12. Telemetry and experiments

Every build writes a `studio_build` row with timings, cost and the full check list; every mount a `studio_mount` row
with outcome. The format allocator (W4-B #2) treats "Studio piece (archetype a, variant v)" as arms with reward =
next item correct unaided; the Brain's per-child preference model reads it. Weekly report: archetype × model table,
P(pass by deadline), cost per passed build, incidents, transfer, learning deltas vs fallback.

---

## 13. Build order (full version first; then the order to build it)

The full version is everything in §3-§12. The order below makes each step testable by the owner, never a stub.

| step | what | files | est. (agent-days) | testable result |
|---|---|---|---|---|
| S1 | **Studio kit + contracts + frame**: `studio-kit@1` runtime (port of the probe runtime), seam conventions, hash-CSP bundler (from G2 `bundle.js`), `StudioFrame` with partial channel + sanitiser, skeletons for the 3 probe kinds | `shared/studio.ts`, `src/studio/**`, `server/studio/store.js` | 4 | a library build from this session's probe mounts in the Desk with host grading |
| S2 | **Gate service**: port `evals/live-studio/qa.mjs` to `server/studio/qa/` (AST G0, G7 state graph, G10, anchoring, 3 viewports), `infra/studio-qa` image, `studio-qa` Container App (fallback lane) | `server/studio/qa/**`, `infra/studio-qa/**`, `scripts/deploy-studio-qa.mjs` | 4 | mutant suite recall 1.0; gate p50 ≤ 12 s on Azure |
| S3 | **Builders + race + stream guard + fixers + repair** with per-kind routes from §6 | `server/studio/{build,builders/*,stream-guard,fixers,repair}.js`, `server/azure.js` `chatStream` | 4 | router bench reproduces §14 numbers from the server code path |
| S4 | **Planner + archetype library v1** (the 3 probe archetypes + 9 more: number line, balance, sort bins, sequence, slider-law sim, process animation, labelled-parts diagram, pictograph, timeline) | `server/studio/{plan,router}.js`, `archetypes/*.json` | 5 | 12 archetypes each with ≥ 30 bench runs and a published P(pass by deadline) |
| S5 | **Lesson integration**: Brain intents (with TEACHER-BRAIN.md), SSE channel, status facts into both voice lanes, reveal on cue, `screenHasTargets`, evidence `via='studio'` | `server/routes/{lesson,studio}.js`, `server/studio/seam.js`, `src/child/lesson/{WorkTray,Desk}.tsx`, comprehension | 5 | acceptance tests 7, 8, 10 in production |
| S6 | **UX polish of the moment**: pencil skeleton, watercolour veil, reveal choreography, reduced motion, parent-corner entries | `src/studio/{StudioStage,Veil}.tsx`, parent screens | 3 | owner walk-through on a phone; Playwright shots |
| S7 | **Library**: identity, G-transfer, G-mount, promotion + review CLI (from G2 `review.js`), variants, prefetch for next lesson | `server/studio/library.js`, `scripts/studio-review.mjs` | 4 | acceptance test 9 |
| S8 | **ACA Sandboxes pool** (after O-1): warm Chromium snapshots, per-build contexts, recycle | `server/studio/qa/pool.js` | 2 | gate p50 ≤ 8 s, 0 shared state between builds |
| S9 | **Images lane** (after O-2) + mini-sites + animation tween primitives + chart/geo/map truth primitives | `server/studio/image.js`, `src/studio/kit/primitives/*` | 6 | a mini-site built across a lesson; images text-free 100% |
| S10 | **Experiments + weekly bench + dashboards** | `evals/live-studio/router-bench.mjs`, telemetry | 2 | weekly table auto-published to `context/inbox` |

Total ≈ 39 agent-days; S1-S3 can run in parallel streams; S5 depends on the Brain spec's intent API.

---

## 14. Measurements (this session, 2026-10-04)

<<MEASUREMENTS>>

---

## 15. Owner actions (each has a default)

- **O-1 ACA Sandboxes:** raise the sandbox core quota (was 1) and grant the SP *Container Apps SandboxGroup Data Owner*
  (role `c24cf47c-5077-412d-a19c-45202126392c`) on a new group `studio-qa` in eastus2. Default until done: the
  `studio-qa` Container App lane (§3.6).
- **O-2 Image capacity:** raise `taxila-flux2` from 1 and `taxila-image` from 4 to ≥ 20 each. Default: images
  library-only and near-line.
<<OWNERMODELS>>

---

## 16. Reversal conditions

- D1 (code skeleton): reverse if a model reaches first meaningful paint ≤ 300 ms p90 (would need on-device or
  speculative generation).
- D3 (truth from the kit): never for quantities/keys; for prose strings, reverse only if a per-string gate measures
  ≥ 0.99 precision on Hinglish/Hindi harms.
- D5 (race of two): reverse to single-arm when one arm's P(pass by deadline) ≥ 0.97 on n ≥ 50 for an archetype.
- D6 (≤ 2 repairs): raise if the router bench shows round 3 recovers ≥ 25% of round-2 failures within the deadline.
- D7 (server-side QA): reverse to an on-device shadow-frame gate only if the device gate reproduces server verdicts
  on ≥ 99% of n ≥ 300 builds and the threat model accepts it.
- D10 (images never carry facts): reverse only when a knowledge-image benchmark (KVBench-class) shows ≥ 95% on
  school content *and* our own label-placement probe passes in Hindi.
- D11 (library promotion with sampled human review): drop review to 2% when 500 consecutive reviewed promotions show
  0 rejects for an archetype.

---

## 17. Sources

<<SOURCES>>
