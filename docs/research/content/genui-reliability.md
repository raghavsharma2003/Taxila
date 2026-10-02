# Generative UI reliability: Taxila's three-tier module strategy and the `scene@1` DSL

**Date:** 2026-10-02 · **Workstream:** content / genui-reliability · **Question:** what generative UI can and cannot do reliably for children in 2026, and how Taxila gets a personalised interactive on screen while the teacher talks: (T1) engine + params in under 2 s, (T2) scenes composed from primitives through a JSON DSL, (T3) free-form HTML built offline and promoted into the library after validation and human review.

**Builds on (read first, not repeated):** `tech-and-market.md` §3–4 (tiers T0–T3, the sandbox and bridge, Google's 3.5% → 69.3%), `learning-science.md` §2.4 (seductive details, dual coding, concreteness fading), `maths-engines.md` §3 (ModuleSpec, ProbeSpec, fading, R1–R10), `science-engines.md` §2, `language-sst-engines.md` §3 (LR1–LR8), `game-mechanics.md` §3 and §5, `factory/llm-game-generation.md` (v0, bolt, OpenGame, gates G0–G7), `factory/coding-agent-harnesses.md` §5 (the Forge harness), `design/kids-ux-ages.md` §4 (band tokens).

**Companion files in this folder:**
- `genui-scene-dsl.mjs`: the executable `scene@1` spec (zod schema as source of truth, EXPR@1, layout, lint S0–S7, reachability solver, autofix, six template expanders, strict-wire converter). `genui-scene-dsl.schema.json` is generated from it (`node genui-scene-dsl.mjs --emit`).
- `genui-scene-dsl.test.mjs`: 47 controls (24 positive, 19 seeded defects, 1 autofix check, 3 schema checks), all passing.
- `genui-bench.mjs` + `genui-bench-2026-10-02.json` (§6, every raw model output kept) and `genui-azure-limits-probe.mjs` + `genui-azure-limits-taxila-{fast,brain}-2026-10-02.json` (§6.1).

| tag | meaning |
|---|---|
| **[Me]** | measured this session (method, n and date in §6) |
| **[V]** | read today in the primary source (paper HTML or PDF text, repo, vendor doc) |
| **[S]** | secondary: an arXiv abstract read through the API, a sibling doc's citation, or a leaked prompt |
| **[M]** | from memory, not re-checked. This session's web-search budget was used up before the workstream started, so sources were verified by direct fetch (arXiv API, known URLs) |
| **[U]** | design hypothesis or estimate; measure it before relying on it |

---

## 0. TL;DR (decisions)

1. **The field has converged, and our own measurements agree: the model should generate data for tested code, not code.**
   - Free code is impressive but slow and brittle. Google's Generative UI pages beat markdown in **82.8%** of comparisons but take "a minute or two", and on weaker backbones **29–60%** of outputs had errors (LMArena prompts) **[V]**. Generated educational interactives pass every check **3.5%** of the time one-shot, **69.3%** after 10 critique rounds **[V]**.
   - The weak part is behaviour, not appearance: functional correctness **24.4 vs** visual fidelity **64.3** (IWR-Bench); code **96.6** vs visuals **17.6** (V-GameGym) **[S]**. Decoupling fixes it: ALGOGEN's JSON trace for a deterministic renderer reaches **99.8% vs 82.5%** end-to-end **[S]**.
   - **Rule:** no model writes event-handling code for a live child. Dragging, dropping, sliders, choices and ordering are runtime code; the model writes a document.
2. **T1 is measured, and it meets the 2 s bar [Me].**
   - `taxila-fast` (gpt-5.6-luna) at `reasoning_effort: none` fills a `fractions@1` spec in **1.88 s p50 / 2.05 s p90**, **10/10** valid including the engine-maths checks. Effort `low` doubles latency (3.46 / 5.09 s) and fails once.
   - The engine reports **4 ms per output token** and an 89 ms time to first token (medians), so **output tokens are the T1 latency budget**. Code fills numbers and traps, the model writes only the language fields, and specs are prefetched during the previous teacher turn, so the latency the child sees is close to 0.
3. **Azure structured-output limits measured today differ from the Azure doc [Me].**
   - Accepted: a 400-property schema (the doc says 100); minimum, maximum, pattern, maxLength and minItems accepted and honoured (n = 1). Rejected: nesting beyond **10** levels (the doc says 5), and more than **1000 enum values in total** (our first scene schema had 1003, so repeated subschemas are hoisted into `$defs`).
   - Lark CFG custom tools work on both text deployments (1.0–1.4 s). A never-seen schema cost no measurable extra latency at T1 size (5 cold/warm pairs).
4. **T2 is `scene@1`: 22 primitive node kinds, variables, derived values, EXPR@1 bindings, timelines, goals and probes, in a flat, A2UI-style list.** It has two sub-tiers:
   - **T2a:** the model picks one of 11 templates and fills its slots (6 coded today). **Measured:** 3.08 s p50 / 3.35 s p90 on `taxila-fast` at effort none. 6/8 scenes were lint-clean as run, and 8/8 after the v1.1 fixes (in-sample) **[Me]**. **This is the live generative path.**
   - **T2b:** the model composes a scene from primitives. **Measured:** the first call takes 11.9 s p50 on fast and 18.2 s on brain. After one repair, 6/8 (fast) and 7/8 (brain) are lint-clean, but p90 with a repair is 24–41 s **[Me]**. **That is too slow for a teacher's turn, so T2b runs near-line:** requested at least 45 s ahead (the next concept, or during practice), cached, and promoted (P4, §7.6).
5. **The validator is the product.** A schema parse, then lint S1–S7 (references, expressions, geometry and hit sizes, behaviour, kid-UX and contrast, safety, budgets), then an **exact solver** over reachable states: every goal reachable and false at mount, exactly one correct choice, no trap true together with the correct answer.
   - On real model output it caught defects a schema-valid parse accepted: options named as timelines, 22-dp drag targets in a B3 scene, overlapping zones, duplicate ids, 4.2:1 text contrast (§6.3). Each class became a deterministic autofix (v1.1–v1.3), a scene@1.1 schema rule, or a model repair. 47/47 controls pass.
6. **Use strict decoding for the DSL; it costs tokens but nothing else works.** In json_object mode, 7/8 free scenes were schema-invalid, and one repair fixed none. In strict mode, 0/16 were schema-invalid. The cost: **24.5% of the strict payload is `null`s** standing in for absent optional fields, so scene@1.1 should shrink the optional surface **[Me]**.
7. **Templates win on latency and validity, but whether a template fits is a judgement no validator makes.** In 2 of 2 runs, "label the parts of a flower" was squeezed into `sort-bins@1`: lint-clean, but the part–whole picture is lost. The router matches on mechanic tags, never on a free model choice, and the missing templates (`label-diagram@1` first) are build items.
8. **The bench found a semantic bug in EXPR@1 itself.** `2/tand(45)` evaluates to `2.0000000000000004`, so "shadow > 2" was already true at mount. Ordering comparisons are now tolerant (ε = 1e-9, validator v1.1). The runtime and the validator share one evaluator, so they cannot disagree.
9. **T3 (free HTML, p5.js, SVG or three.js) never runs live.** The Forge harness builds it; it must pass gates V0–V9 (an oracle sweep for physics and maths truth, geometry from an exported scene graph, a vision critique on Google's four axes); two reviewers sign it ("two-key"); then it is promoted in one of four forms (§7.6). Gap tickets from T2 and fallbacks decide what T3 builds.
10. **No tier generates images live.** Learn Your Way's illustrations were its weakest component even with a fine-tuned model **[V]**, and gpt-image-2 takes about 23 s. Scenes use a versioned sprite library and verified assets.
11. **Personalise by substituting data into validated structure, not by regenerating.** Learn Your Way rewrote only the "amenable" spans **[V]**. Taxila swaps sprites, contexts, numbers, traps and language inside a scene that has already passed.
12. **Never patch a live scene through conversation.** Multi-turn generative-UI editing passes 74.9% of single turns but completes only 37.3% of five-turn episodes **[S]**. Regenerate from the spec with the change as a parameter.

---

## 1. State of the art 2024–2026: what each system teaches

| system | how it generates | reliability evidence | Taxila takes / rejects |
|---|---|---|---|
| **Google Generative UI** (Leviathan et al., arXiv 2604.09577; Gemini 3) | Whole HTML plus Tailwind CDN from a long system prompt. The prompt sets a core philosophy ("interactive apps first", "no walls of text", "no placeholders"), lists planning steps (brainstorm about 12 features, filter, integrate), documents the `/gen` image and search tools, bans storage and `window.parent`, and requires exact output markers. Nine post-processors then run: they inject client-error reporting, fix JS parse errors, add missing Tailwind directives, break circular dependencies, escape attributes, strip stray citations and replace hallucinated icons **[V: PDF]** | Elo 1710.7. Preferred to markdown **82.8%**; experts preferred to it 56.0% vs 43.0%; "at least comparable in 44%". **Emergent:** output errors 0% on Gemini 2.5+, **29%** on 2.0 Flash, **60%** on Flash-Lite; a minimal prompt still did reasonably. Limits: "can often take a minute or two", plus "occasional" JS, CSS and HTML errors **[V]** | **Take:** a post-processor catalogue and injected error reporting (our autofix and the frame's `error` event). **Reject:** live use; the fast model tier is exactly where errors climb |
| **"Harnessing Generative UI for Education"** (arXiv 2609.20738) | Four stages: (1) plan the objectives (the teacher edits them), then an "idea" naming entities, telemetry and knobs; (2) **K = 5 levelled goals, each generated given the previous ones**, with critique; (3) GenUI as HTML/JS; (4) guidance: tour, hints, solutions and feedback. Render in Chrome, then critique on four axes (**visual, solution, telemetry, mechanical**) **[V: HTML]** | **3.5%** one-shot → **69.3%** after 10 rounds; per-axis gains are "not monotonic". 12 US teachers made 36 requests and judged 3/36 insufficient; every usability score was ≥ 7 (mean > 8.1). Experts rated 40 requests: **86%** accepted, biology weakest ("more of textbook sequence"). Here "telemetry" means on-screen live plots, **not** an event stream to a tutor. No latency or cost reported **[V]** | **Take:** sequential levelled goals, the four critique axes (T3 gate V6), and the acceptance-rubric fail list (§7.5). **Note:** their interactives report nothing to a teacher; Taxila's contract is the difference |
| **Learn Your Way** (arXiv 2509.13348) | Gemini 2.5 Pro "without additional fine-tuning" for text transforms. Re-levels text to a Flesch–Kincaid grade, then "replaces only" the segments "amenable to personalization" with interest rewrites. Builds mind maps, narrated slides, audio lessons, timelines and quizzes. A **fine-tuned image model** was needed because stock models drew inaccurate educational illustrations **[V: HTML]** | Experts rated every component above 0.90 except **illustrations, which scored lowest**. RCT: n = 60, ages 15–18, one chapter; ahead on the immediate test and at 3 days (both p = 0.03, Mann–Whitney) **[V]** | **Take:** surgical substitution into verified structure; images offline and verified. **Note:** a single chapter, older learners |
| **ChatGPT interactive maths and science** | 70+ curated topics with live sliders (sibling doc **[S]**) | curated, not generated | the market leader ships T1 |
| **Claude artifacts** | One file (React, HTML, SVG or Mermaid) in a separate-origin sandbox. The 2024 prompt pins the libraries (lucide-react 0.263.1, recharts, shadcn/ui), says "NO OTHER LIBRARIES … ARE INSTALLED", bans arbitrary Tailwind values (`h-[600px]`) and web images, and allows scripts only from cdnjs **[S: leaked prompt]** | no published reliability numbers; the user iterates by chat | **Take:** a pinned allowlist and *tokens, not arbitrary values* (our colour, size and hit tokens). **Reject:** user-as-QA, since no adult is in the loop during play |
| **Gemini Canvas** | single-file HTML/React preview, iterate by chat **[M]** | none published | same lesson as artifacts |
| **v0 / bolt / Lovable** | composite pipelines: a streaming rewrite layer, deterministic autofixers, full-file writes (sibling doc **[S/V]**) | "errors as often as 10%"; the fixers give "double-digit" gains | **Take:** cheap deterministic fixes run before any model repair (§5.8) |
| **tldraw make-real** (archived 2026-02-20) | sketch screenshot plus previous HTML → one HTML file (Tailwind CDN); red ink means instructions; "DO NOT create phone frames…" **[V: repo prompt, 2025-11-19]** | none published | iterate-on-output is a teacher-authoring idea, not a child one |
| **tldraw agent starter kit** | The model sees a screenshot **plus simplified shapes** (`BlurryShape`, `FocusedShape`, `PeripheralShapeCluster`) "to improve the model's understanding and performance". It acts through create, update and delete plus **align, distribute and stack**; actions stream and apply as each one completes **[V: docs]** | none published | **Take:** a simplified object model, layout operations instead of coordinates, per-action streaming. A production tldraw licence is required, so we copy patterns only (`student-workspace.md`) |
| **A2UI** (Google, Apache-2.0, v0.9.1; v1.0 RC) | Declarative JSON: a "flat list of components with ID references, which is easy for LLMs to generate incrementally". A client-owned **catalog**, JSON-Pointer data binding, actions reported back, and a `VALIDATION_FAILED` error carrying the pointer path **[V]** | A2UI-Bench: the best tuned model scores 75.6 overall **[S]** (declarative output is not automatically easy) | **Take:** the flat node list, a catalog id, and pointer-addressed errors fed to repair |
| **json-render** (Vercel Labs, Apache-2.0) | A catalog of components with zod props generates the system prompt; "AI can only use components in your catalog"; streams through `SpecStream`; `$state` bindings and visibility conditions **[V: README]** | none published | **Take:** zod as one source for the schema, the prompt and the validator (done) |
| **Manim and animation generators** | The model writes Manim (or HTML/CSS) code for explanatory animation | TheoremExplainAgent (o3-mini): 93.8% success, 0.77 overall. ManiBench names "visual-logic drift". SGA geometric verification: +16.1% MVQS, preferred in 84.4%. SFT+GRPO+RITL: 94% render success. LLM2Manim: n = 100 students, post-test 83% vs 78%. Animation2Code: models "struggle to maintain temporal consistency" **[S: abstracts]** | **Take:** check geometry from a scene graph, never from pixels alone. Animate by timeline data (§5.6) |
| **"LLM writes p5.js"** | No p5.js-specific reliability benchmark was found through the arXiv API this session **[U]**. The nearest are Animation2Code, AVR-Agent (JS games: custom assets gave **no** win-rate gain) and V-GameGym (Pygame) **[S]** | — | Treat p5.js like any free code: T3 only, behind the T3 gates |

## 2. Evidence that decides the architecture

### 2.1 Free code fails on behaviour and time, not on syntax

| benchmark | what passes | what fails |
|---|---|---|
| IWR-Bench (2509.24709): rebuild an interactive page from a video | visual fidelity **64.25%** | functional correctness **24.39%**; best overall 36.35% **[S]** |
| V-GameGym (sibling) | code score **96.6** | image **17.6**, video **20.7** **[V]** |
| Interaction2Code (2411.03292, ASE 2025): 127 pages, 374 interactions | static layout | "ten types of failure"; weak on visually subtle interactions **[S]** |
| LongWebBench (2606.17727) | plausible-looking pages | "often fail to support executable multi-step interactions"; fidelity falls with length **[S]** |
| Design Theater (2607.22928): 24 tasks | the stated design rationale | > 25% of rationales not implemented; **34%** of functional requirements **[S]** |
| GameASG-Bench (sibling) | static checks 97.7–99.6% | strict task success 14.9–55.3% **[S]** |

**Consequence.** A DSL that moves interaction logic into tested runtime code removes the weakest layer of generated software. The model is left with layout and content, which models do comparatively well, and both of those can be checked by machine.

### 2.2 Intermediate representations beat end-to-end generation

| work | IR | result |
|---|---|---|
| ALGOGEN (2605.12159) | the LLM writes a tracker that emits VTA-JSON; a style language plus a deterministic renderer produce Manim, TikZ or three.js | **99.8% vs 82.5%** end-to-end; fewer overlaps and frame inconsistencies **[S]** |
| Mage (sibling) | a structural IR for Unity scenes | runtime pass falls by half, but mechanism F1 rises from 0.12 to 0.82–1.00 **[V]** |
| GamED.AI (sibling) | 15 mechanic templates with typed gates | **90%** vs ReAct 72.5%; drag-drop 96.2% **[S]** |
| DeclarUI (2409.11667) | declarative UI code | 98% compilation success **[S]** |
| LEGOUI (2608.04293) | UI-DSL "bricks" | > 95% accuracy on requirement analysis **[S]** |
| "Design-time GenUI" position paper (2606.15902) | modality-agnostic cards, generated and teacher-verified **before** any learner sees them | argument, no data; it matches T3 plus the library **[S]** |

### 2.3 Constrained decoding fixes syntax, not meaning

| work | finding |
|---|---|
| 2609.23742 | Constrained decoding raises schema validity from 78.6–92.9% to **100%**, but "a persistent semantic gap" remains **[S]** |
| 2607.18261 | **100%** schema-valid, yet semantic success "near 80%" **[S]** |
| 2605.26128 ("constraint tax") | On small models, validity rises 61.5% → 100% while accuracy falls **19.7% → 11.0%** **[S]** |
| "Let Me Speak Freely?" (2408.02442) | Format restrictions degrade reasoning, and stricter formats degrade it more **[S]** |
| **This session [Me]** | json_object mode broke the schema in 7 of 8 T2b scenes (`align:"center"`, `drag.back:"origin"`, labels as bare strings); strict mode broke it in 0 |

**Rules.**
1. Use strict decoding for every DSL document.
2. Keep reasoning out of the JSON. The reasoning model thinks internally; the schema has no "explanation" fields.
3. Semantic validation (the S4 solver, engine maths, fact banks) is mandatory, because a valid document can still be a wrong lesson.

### 2.4 Self-repair: what it buys and where it plateaus

| evidence | number |
|---|---|
| Olausson et al. (2306.09896) | gains "often modest" once cost is counted; the bottleneck is feedback quality **[S]** |
| 2604.10508 | +4.9 to +17.1 pp (HumanEval), +16 to +30 pp (MBPP), diminishing per round **[S]** |
| Play2Code (sibling) | 3.24 rounds on average; **93.5%** finish within 5 **[S]** |
| OpenGame (sibling) | steepest gain by T = 3, plateau at T = 5 **[S]** |
| Google education interactives | 10 rounds; per-axis progress non-monotonic **[V]** |
| **This session [Me]** | one repair round with pointer-addressed lint errors fixed 6 of 8 failing T2b scenes on fast and 4 of 5 on brain. It fixed **0 of 7** json_object schema failures |

**Budgets.**
- **T1:** zero model repairs. A spec that fails falls back to the kit's deterministic spec.
- **T2:** deterministic autofix, then **one** model repair with at most 10 pointer-addressed errors, then the template or T1 fallback.
- **T3:** up to 5 rounds per gate family. Keep the **Pareto-best** build so far (the gate-score vector); never keep "the latest", because progress is non-monotonic. Stop after 2 rounds without improvement.

---

## 3. The strategy: three tiers and a router

| tier | generator | output | validator | latency (measured / target) | reliability | fallback |
|---|---|---|---|---|---|---|
| **T1 engine + params** | code, plus `taxila-fast` (effort none) for language fields only | `ModuleSpec` for one of about 62 hand-built engines | zod, then engine maths (R7), then clamp | **1.88 s p50 / 2.05 s p90** for a full spec **[Me]**; about 0 when prefetched | **10/10 [Me]** | the kit's deterministic spec (`server/director/modules.js`) |
| **T2a template fill** | `taxila-fast` (effort none) | `{template, slots}` → `expand()` → `scene@1` | slot zod, then the full scene lint and solver | **3.08 s p50 / 3.35 s p90** **[Me]** | 6/8 as run; **8/8** with the v1.1 autofix (in-sample). Template fit was wrong in 1/8 **[Me]** | T1, or whiteboard plus voice |
| **T2b free scene** | `taxila-fast` or `taxila-brain` (effort low), strict schema | `scene@1` | autofix, lint and solver, one repair | 11.9 / 14.0 s (fast), 18.2 / 28.5 s (brain), plus 10–13 s per repair. **Near-line only** **[Me]** | **6/8** (fast) and **7/8** (brain) after one repair **[Me]** | T2a, then T1, then whiteboard; logs a gap ticket |
| **T3 free-form** | Forge (codex coder, brain critic), offline | HTML/JS on `taxila-module@1` | V0–V9, then two-key human review | minutes to hours, never live | about 70% after the loop (Google; sibling **[S]**) | not shown until promoted |

### 3.1 Router (server, deterministic; the model never chooses its own tier)

```ts
// server/director/modules.js grows into this. Inputs come from the Director's move plus the kit.
type Mechanic = "manipulate"|"explore"|"sort"|"sequence"|"match"|"label"|"count"|"compare"|"predict"|"construct"|"watch";
interface ModuleRequest {
  lessonId: string; move: Move; topicId: string; skillId?: string; itemId?: string;
  band: "B1"|"B2"|"B3"|"B4"; lang: "en"|"hi"|"hi-Latn+en"; numerals: "latn"|"deva";
  want: { mechanic: Mechanic; probe?: ProbeKind; representation?: string };  // from kit.formats + item.kind
  child: Pick<ChildBrief, "interests"|"activeMisconceptions"|"vibe">;
  deadlineMs: number;   // how long the teacher's current turn covers the wait (≈ 330 ms per spoken word)
  horizonMs: number;    // how far ahead the module is needed: 0 = this move; > 0 = prefetch for a later move
}
interface ModulePlan {
  tier: "T1"|"T2a"|"T2b"|"lib"; engine: string;      // "fractions@1" | "scene@1" | "lib:germination@2"
  spec: unknown; source: "cache"|"prefetch"|"live"; validatedBy: string;   // e.g. "scene@1 validator v1.2"
  fallback: ModulePlan | { tier: "whiteboard"; ui: UiDirectives };      // always present for T2
  ms: { plan: number; llm?: number; validate: number };
}
function route(r: ModuleRequest): ModulePlan[] {          // ordered candidates; the first that validates in time wins
  const out = [];
  const eng = engineMap.primary(r.topicId, r.want);       // maths/science/lang-sst engine maps + game wrappers
  if (eng) out.push(t1(eng, r));                          // T1 always first when an engine covers the topic
  const lib = library.find(r.topicId, r.want, r.band);    // promoted T3 modules and cached T2 scenes
  if (lib) out.push(lib);
  const tpl = templates.byMechanic(r.want.mechanic, r.band);   // tag match, never a free model choice (§0.7)
  if (tpl && r.deadlineMs >= P90.t2a) out.push(t2a(tpl, r));        // measured p90 3.35 s: live-viable
  if (r.horizonMs >= P90.t2bWithRepair) out.push(t2b(r));         // measured 24–41 s with a repair: near-line only
  return out;   // empty → whiteboard plus voice, and a gap ticket {topic, mechanic, band, why}
}
```

### 3.2 Latency rules

- **Prefetch beats speed.** At the start of each teacher turn, the Director plans modules for the two most likely next moves, in parallel, and caches them. The cache key is `(engine, topic, item, band, lang, skin, misc-set)`. A cache hit costs 0 ms.
- **Measured T1 cost [Me]:** about 190 output tokens; wall 1.88 s from the US build container, of which engine 0.90 s (TTFT 89 ms + 4 ms/token), service 1.29 s, the rest network. India adds the RTT to eastus2 **[U]**.
- **Cut output tokens, not models.** Numbers, distractors and traps come from code (each `MC.*` id has a generator, e.g. `MC.FRAC.ADD_ACROSS(a/b, c/d) → (a+c)/(b+d)`); the model writes only `ask {en, hi, hi_latn}`, about 50 tokens, about 0.5 s faster **[U]**. Even the `ask` can be templated per probe kind, leaving no model call at all.
- **T2a is live, T2b is near-line [Me].** A template fill is about 380 output tokens (3.1–3.4 s), which the teacher's spoken preamble (about 2–3 s) nearly covers. A free scene is 1.7–1.9k output tokens: 12–29 s per call plus 10–13 s per repair, while an explain turn (15–40 words) covers about 5–13 s. So T2b is requested with `horizonMs ≥ 45 s` (the next concept, or while the child practises) and lands in the cache. A module always mounts **frozen** (kids-ux S2) and unfreezes at `your_turn`.
- **Streaming as a blackboard [U].** A flat node list can render node by node as each node validates, like a teacher drawing on the board. Interaction stays disabled until the whole document passes lint and the solver.

---

## 4. T1: engine + params in under 2 s

**Inventory (from the sibling docs):** 25 maths engines, 16 science engines plus 2 harnesses, 13 language/SST engines on 4 kits, and 8 game engines plus 10 wrappers, about **62 engines**. Topic → engine maps exist for every curriculum topic (`maths-engine-map.json`, `science-engine-map.json`, `language-sst-engine-map.json`).

**Who fills what:**

| field | filled by | why |
|---|---|---|
| engine | engine map (deterministic) | the model never searches 62 engines live |
| operands and values | `extractValues(kit item)` (exists) | numbers come from the verified kit, never from the model |
| stage and linked | table (mastery × band → stage; maths §3.4) | fading is a policy, not a guess |
| skin and context | interests → skin map; bland-concrete rule R2 | personalisation as data |
| distractors and traps | code: one generator per `MC.*` id | correct by construction; LR7 |
| `expect.correct` | **engine maths** | R7. The model's value is compared and discarded |
| `ask` (L10n) | model (≈ 50 tokens) or a template per probe kind | the only language field |

**Measured [Me]** (one full model fill of the `fractions@1` spec from maths §3.5; 10 different fraction sums; strict schema; US build container):

| arm | n | valid incl. engine-maths checks | p50 | p90 | output tokens p50 (reasoning) |
|---|---|---|---|---|---|
| taxila-fast, effort none | 10 | **10** | **1876 ms** | 2050 ms | 191 (0) |
| taxila-fast, effort low | 10 | 9 (one spec dropped the add-across trap) | 3459 ms | 5094 ms | 380 (165) |
| taxila-brain, effort none | 10 | 10 | 2483 ms | 2874 ms | 172 (0) |
| taxila-brain, effort low | 10 | 10 | 4184 ms | 6982 ms | 354 (157) |

**Decisions.** T1 runs on `taxila-fast` at **effort none**: reasoning buys nothing on a fill this constrained and costs 1.5–5 s. Engine maths stays the authority anyway: no `correct_wrong` in 40 fills, but R7 is about the 41st.

---

## 5. T2: the `scene@1` DSL (normative source: `genui-scene-dsl.mjs`; schema: `genui-scene-dsl.schema.json`)

### 5.1 Design principles and where each comes from

| principle | source |
|---|---|
| One flat `nodes[]`, with containment through `parent` ids; streams node by node | A2UI's flat adjacency list |
| A closed catalog of 22 kinds; unknown kinds are a schema error | A2UI, json-render, artifacts' library allowlist |
| `(x, y)` is always the **centre**; layout containers (`row`, `column`, `grid`, `circle`, `scatter`) replace hand arithmetic | tldraw agent's align/distribute/stack; SGA's overlap repair |
| Colours, text sizes and control sizes are **tokens**, not values; controls size themselves from the band | artifacts' "no arbitrary values"; kids-ux §4.1 and §4.3 |
| Interactions are behaviours the runtime implements (`drag`, `tap`, `zone`, `slider`, `choice`, `order`…) | §2.1: behaviour is where free code fails |
| Simulation is **EXPR@1** bindings over variables, never JS | ALGOGEN (data plus a deterministic renderer); constrained-DSL behaviours (Real-Time World Crafting, sibling) |
| Animation is a **timeline of data** (`tween`, `show`, `pulse`, `cue`, `trace`, `count`), at most 30 s, with no decorative motion | learning-science §2.4 (seductive details), R6; temporal contiguity through `cue` |
| Goals, probes and traps are predicates; the runtime emits telemetry automatically | maths §3.1 ProbeSpec; the shipped `ModuleToHost` |
| Every number is finite; exact rational arithmetic stays in engines (`fractions@1`) | R7; tier boundary |

### 5.2 Document

```ts
// Mirrors the zod source. Optional = may be absent (strict wire: null).
type ID = string;                       // /^[a-z][a-z0-9_]{0,23}$/
type L10n = { en: string; hi: string; hi_latn?: string };   // ≤ 80 chars each, no "<" or ">"
type Expr = { $: string };              // EXPR@1, ≤ 160 chars
type Num = number | Expr; type Bool = boolean | Expr;
type Color = "none"|"bg"|"surface"|"ink"|"ink2"|"line"|"done"|"c1"|"c2"|"c3"|"c4"|"c5"|"c6"
           |"c1d"|"c2d"|"c3d"|"c4d"|"c5d"|"c6d"|"water"|"leaf"|"soil"|"sun"|"sky"|"fire"|"ice"|"metal"|"wood";
type Size = "label"|"caption"|"title"|"numeral";        // resolved per band and script (kids-ux §4.1)
interface Scene {
  dsl: "scene@1";
  meta: { band: "B1"|"B2"|"B3"|"B4"; lang: "en"|"hi"|"hi-Latn+en"; title: L10n;
          objective_ids: string[]; topic_ids: string[]; template?: string };      // ≤ 4 ids each
  stage: { aspect: "4:3"|"1:1"|"3:4"; bg: "bg"|"surface"|"sky"|"none" };          // 1000 × 750 | 1000 | 1333 units
  vars: Var[];          // ≤ 8
  derive: Derive[];     // ≤ 8, evaluated in order, may use earlier derives
  nodes: Node[];        // 1–80; repeat instances ≤ 100 in total
  timelines: Timeline[];// ≤ 4, ≤ 40 steps each, ≤ 60 in all, each ≤ 30 s
  goals: Goal[];        // ≤ 5
  probe?: Probe;        // at most one per scene (one idea per scene)
  feedback: "on_commit"|"on_drop"|"none";   // tick or shake plus sound only (R6); the voice is the reward
}
interface Var { id: ID; type: "num"|"int"|"bool"|"enum"; init: number|boolean|string;
  min?: number; max?: number; step?: number; options?: ID[]; tl: string; unit?: string }   // num/int require min and max
interface Derive { id: ID; expr: string; tl: string; unit?: string; dp?: 0|1|2|3 }
interface Base { id: ID; parent?: ID; x?: Num; y?: Num; rot?: Num; scale?: Num; op?: Num;
  fill?: Color; stroke?: Color; sw?: number; dash?: boolean; show?: Bool; z?: number;     // z in −10…10
  role?: "content"|"control"|"label"|"feedback"|"context";   // context never animates
  tags?: ID[];          // ≤ 4; zone.accepts matches tags; a node's own id is also a tag
  tl?: string;          // teacher label (English, ≤ 32): used in the teacher's summary line
  say?: L10n;           // spoken on tap (tap-to-hear), and the a11y name
  drag?: { axis: "xy"|"x"|"y"; snap: "zone"|"grid"|"none"; grid?: number; back: boolean; in?: ID };
  tap?: { act: "select"|"toggle"|"set"|"say"; var?: ID; value?: number|string|boolean } }
interface Goal { id: ID; when: string; tl: string }            // false at mount, reachable (solver S4)
interface Probe { id: ID; kind: "predict"|"diagnose"|"classify"|"sequence"|"estimate"|"construct"; ask: L10n;
  commit: { via: "choice"|"check"|"order"|"voice"; node?: ID }; correct: string;           // EXPR@1 → boolean
  traps: { when: string; misc: `MC.${string}` }[]; reveal?: ID }                            // ≤ 4 traps; reveal = timeline id
interface Timeline { id: ID; on: "mount"|"host"|"button"|"commit"|"goal"; ref?: ID; steps: Step[] }
interface Step { t: number; ms: number; do: "tween"|"show"|"hide"|"pulse"|"set"|"cue"|"trace"|"count";
  target?: ID; prop?: "x"|"y"|"rot"|"scale"|"op"|"w"|"h"|"r"; to?: number; var?: ID;
  value?: number|boolean|string; cue?: ID; ease?: "linear"|"inout"|"out" }
```

### 5.3 Node catalog (22 kinds)

| kind | own props | interactive | notes |
|---|---|---|---|
| `rect` | `w h r?` | via drag or tap | |
| `circle` · `ellipse` | `r` · `rx ry` | via drag or tap | |
| `wedge` | `r a0 a1 r0?` (degrees) | via tap | pies, angles, dials; `r0` makes a ring segment |
| `line` · `poly` | `pts` (2 points · 3–64 points), `head?` · `closed` | no | points are relative to the node's `x,y` (default 0,0) |
| `text` | `text: L10n \| {fmt}` · `size` · `w?` · `align?` · `bold?` | no | `fmt` interpolates `{var}` and `{derive}`; the target script is never transliterated (LR1) |
| `math` | `tex ≤ 120` · `size` | no | KaTeX subset; parsed by KaTeX server-side (not in the reference lint) |
| `sprite` | `lib` · `w h` · `flip?` | via drag or tap | library ids only (S6); flat and bland (R2) |
| `image` | `asset` (`ast_…`) · `w h` | no | verified cached asset only (LR3) |
| `group` | `layout?` | no | `row`, `column`, `grid{cols}`, `circle{r}`, `free`, `scatter{seed,w,h}` |
| `repeat` | `count: Num` · `item{kind: circle\|rect\|sprite …, drag?}` · `layout` | instances inherit drag | counting and grouping without N nodes; instances are interchangeable for the solver |
| `axis` | `from to step every? len orient` | no | ticks and labels; the number line itself is T1 (`number-line@1`) |
| `connector` | `from to head label?` | no | a straight link between two nodes' box edges (callouts) |
| `zone` | `w h shape accepts[] cap? label? visible arrange` | drop target | `arrange: grid` compacts dropped items |
| `slider` · `stepper` · `toggle` | `var len orient value` · `var` · `var label` | yes | thickness = band hit size, set automatically |
| `choice` | `var` (enum) · `options[2–4]{id, label\|sprite\|tex, misc?}` · `layout` · `commit` | yes | tile = band `tile.answer.min`; option count ≤ band `choices.max` |
| `button` | `label` · `act: check\|reset\|play\|next` · `timeline?` | yes | |
| `order` | `items[2–6]{id, label\|sprite}` · `orient` · `start?` | yes | tap-to-swap plus drag (R8) |
| `keypad` | `var` (int) · `digits 1–4` | yes | B3–B4 only (S5) |

### 5.4 EXPR@1 (one evaluator, shared by the validator and the frame runtime)

```
expr    := tern ;  tern := or ('?' expr ':' expr)? ;  or := and ('||' and)* ;  and := cmp ('&&' cmp)*
cmp     := add (('=='|'!='|'<'|'<='|'>'|'>=') add)? ;  add := mul (('+'|'-') mul)* ;  mul := un (('*'|'/'|'%') un)*
un      := ('-'|'!') un | pow ;  pow := atom ('^' un)? ;  atom := number | 'string' | true | false | PI | name | call | '(' expr ')'
call    := fn '(' expr (',' expr)* ')'
fn      := min max abs round(x,d) floor ceil sqrt sind cosd tand atand clamp lerp     -- pure, total, finite or error
         | count(zone[,tag]) has(zone,node) at(node) order(list)                          -- state functions
name    := a var id | a derive id
```
- No loops, no assignment, no member access, no strings beyond comparison.
- Depth ≤ 24, length ≤ 160.
- Division by zero and non-finite results are errors, caught at lint against the initial state (S2.eval).
- Numeric `==` and `!=` use |a − b| < 1e-9; since **v1.1**, `<`, `<=`, `>` and `>=` use the same ε (§0.8).
- `order(list)` returns the ids joined by commas.

### 5.5 What the runtime does with a scene (the frame engine `scene@1`)

**Mount.** `HostToModule.init` arrives with `{engine: "scene@1", params: {scene}}`. The frame then:
1. runs the same `validate()` again (defence in depth; the frame has no network);
2. lays out the scene with **real** font metrics and replies `ready{overflow:[ids]}`. The host unmounts the scene on any overflow and shows the fallback.

**Child acts → events** (shipped `ModuleToHost`, flat `data` ≤ 12 keys): drop → `interaction sc.drop {node, zone, ok}`; slider/stepper/toggle settles (4 Hz debounce) → `sc.set {var, v}`; tap → `sc.tap {node}`; choice → `sc.choose {choice, option}`; reorder → `sc.order {list, seq}`; timeline cue → `sc.cue {timeline, cue}`; goal predicate true → `goal_met` (once); probe commit → `answer {value, correct, misc?}` with `correct` computed by EXPR, never by a model; 20 s idle or 3 rejected drops in a row → `stuck`.

**Teacher's eyes.** The runtime writes one key=value line per milestone from the `tl` labels (science §2.4: facts, not prose):
`[module m7 scene sort-bins] placed=6/6 water={fish,frog,crab} land={cow,camel,dog} check=wrong misc=MC.EVS.FROG_LAND_ONLY`

**Host commands** (maths §3.3): `highlight{target}`, `reveal`, `reset`, `play{timeline}`, `cue{id}`, `set_param{name: var, value}`, `record_answer{probe, value, source: "voice"}`. A `cue` lets the teacher's narration drive a timeline step, which keeps narration and motion in step (temporal contiguity).

**Alias map.** T2a templates that duplicate a T1 mechanic emit the same semantic names (`sort-bins@1`'s `sc.drop` is read as `sorter@1`'s `so.place`). The learner model therefore sees one signal however the scene was produced.

### 5.6 Animation in the DSL

Timelines are data, so they can be verified: every target exists, `tween` needs `prop` and `to`, each timeline is ≤ 30 s and ≤ 40 steps, and `context` nodes never move (R6). `trace` draws a stroke progressively (the blackboard), `count` highlights targets in sequence for counting, and `pulse` is the only attention effect. `prefers-reduced-motion` makes every step instant. A predict probe's `reveal` timeline runs only after commit (P5: predict before reveal). Manim-style explainer *videos* are not a T2 job; they are T3 offline assets rendered once per objective (§7).

### 5.7 Templates (T2a): slots small enough to fill in about 3 s, expanded by code

| template | mechanic → probe kind | slots | status |
|---|---|---|---|
| `sort-bins@1` | sort → classify | `title`; `bins[2–4]{id,label,fill}`; `items[2–8]{id,sprite,say,bin,misc?}` | **coded**; DSL twin of `sorter@1` |
| `count-group@1` | count/construct → construct | `title`; `groups 2–5`; `per 1–6`; `sprite`; `say`; `container`; `misc_unequal?` | **coded**; voice commit (B1 has no room for a 64-dp check button) |
| `slider-explore@1` | explore → goal | `input{id,min,max,step,init,unit,label}`; `readouts[1–2]{id,expr,unit,dp,label}`; `visual{bar\|count\|needle, of, max}`; `goal{when}` | **coded** |
| `sequence-steps@1` | sequence → sequence | `steps[3–6]{id,label,sprite?}`; `start[]`; `traps[≤2]{order[],misc}` | **coded**; B1–B2 max 4 steps (hit size) |
| `compare-choice@1` | compare → diagnose | `question`; `left,right{label,sprite,count}`; `ask: more\|fewer`; `misc_wrong?` | **coded**; P8 contrast |
| `predict-reveal@1` | predict → predict | `question`; `subject{sprite,say}`; `options[2–3]{id,label,misc?}`; `correct`; `effect: shrink\|grow\|sink\|rise\|fade`; `after{sprite?,say}` | **coded**; POE without an engine |
| `label-diagram@1` | label → classify | `base{sprite\|asset}`; `parts[2–6]{id,x,y,label}`; `distractors[≤2]`; zones at the parts, labels as draggables | **spec**; first to build (§0.7) |
| `hotspot-explore@1` | explore/retrieve → construct | `base`; `spots[2–8]{id,x,y,r,say}`; `mode: explore\|find(id)` | spec |
| `match-pairs@1` | match → diagnose | `left[2–5]`, `right[2–5]` (label\|sprite\|tex), `pairs[]`, `misc per wrong pair` | spec; across representations (3/4 ↔ bar ↔ 0.75) |
| `story-problem@1` | translate → construct | `context sprites`; `quantities[]`; `ask`; `answer: choice\|keypad`; `handoff: tape-diagram@1` | spec |
| `worked-steps@1` | watch → predict next step | `steps[2–6]{math\|label, cue}`; `faded[]` (blanks for the child) | spec; worked example → faded (learning-science) |

**Six coded templates × four bands = 24 positive controls, all lint-clean [Me].** Expanders throw a precise error when a band's hit sizes cannot fit the content. For example, 12 draggable rotis do not fit a B1 phone at 64 dp: the stage is 300 dp wide, so at most 4 fit per row. That error goes back to the model as a slot error.

### 5.8 Validation: what "valid" means (all in milliseconds; the solver is exact up to 200k states, then seeded sampling, which reports a warning)

| code | check | rule source |
|---|---|---|
| S0 | strict zod parse: closed objects, enums, lengths, patterns, no `<` or `>` in any string | schema |
| S1 | ids unique; `parent` is a group; no cycles; var, zone, timeline, node and `{fmt}` references resolve; num/int vars have `[min, max]` and `init` within it | A2UI validation |
| S2 | every expression parses, names resolve, the result type matches (bool vs number), and it evaluates at mount without error | EXPR@1 |
| S3 | after layout: every box on stage; drag and tap targets ≥ band `hit.min` (64/64/48/48 dp at 0.30 dp per unit); interactive boxes never overlap (except a draggable on its `drag.in` zone); zones never overlap; texts never overlap; no unwrapped text wider than the stage | kids-ux §4.1; SGA |
| S4 | **solver**: each goal false at mount and reachable; probe `correct` reachable (and false at mount unless predict or diagnose); a choice probe has **exactly one** correct option; no trap co-occurs with `correct`; warns on untagged distractors and on unreachable traps | maths R7; LR7 |
| S5 | choices ≤ band max; keypad only in B3+; words on stage ≤ 8/20/40/60; text contrast ≥ 4.5:1 against the shape under it (WCAG 2, token hex); context nodes never animate; a goal or probe is present (R3) | kids-ux; R6 |
| S6 | sprites in the library; asset ids well formed; no markup; Content Safety runs on every string (server-side) | LR3; tech-and-market §3.6 |
| S7 | ≤ 80 nodes, ≤ 100 instances, timelines ≤ 30 s and ≤ 60 steps | budget |
| **autofix** | runs before lint and costs no model call. **v1:** null-strip, sprite snapping by leaf name, colour words → tokens, numeric strings → numbers, undersized drag targets grown to the band minimum. **v1.1:** lone `=` → `==`. **v1.2:** a `probe.reveal` that names an option is pointed at the commit timeline or dropped; root nodes that overflow by ≤ 80 units are nudged back on stage. **v1.3:** a text or math `fill` other than `ink`/`ink2` becomes `ink` | v0, Google post-processors; §6.3 |

**Controls [Me].** `genui-scene-dsl.test.mjs` passes 47/47: 24 template × band positives; 19 seeded defects, each caught by its named code (unknown sprite, 20-unit target, off stage, zones overlap, goal unreachable, goal trivially true, unknown name, unparseable, trap co-occurring with correct, contrast, words, unguided, duplicate id, markup, undeclared var, divide by zero at mount, slider goal out of range, two correct options, decoration moving); 1 autofix check (a tint used as text colour is fixed, not failed); 3 schema checks.

**scene@1.1 schema changes, decided from §6.3** (not yet applied, so the measured numbers stay comparable):
- text and math `fill` ∈ {`ink`, `ink2`};
- `probe.reveal` is renamed `reveal_timeline`;
- no stage-level `title` text. The host renders `meta.title` in its chrome, and scene texts must sit inside a layout group;
- the optional surface shrinks: `rot`, `scale`, `op`, `z`, `dash` and `sw` move into one optional `look` object, to cut the strict-mode null tax.

### 5.9 Wire formats

| format | status | measured |
|---|---|---|
| **canonical JSON** (`genui-scene-dsl.schema.json`, 81 KB minified) | storage, cache and the frame | — |
| **strict wire** = canonical with optional → nullable, `$defs` hoisting, tuples → arrays (`toStrict()`) | **the T2b default** | 589 properties, 50 KB; accepted by Azure after hoisting (1003 → < 1000 enums) **[Me]**. Null tax: **24.5%** of payload characters are `null`s (16 scenes) **[Me]** |
| **json_object** with the catalog in the prompt | rejected | schema failures in 7/8; repair did not recover them **[Me]** |
| **Lark CFG** line DSL (`rect r1 10 20`) | candidate for streaming and token thrift | works on both deployments, 1.0–1.4 s (n = 1 each) **[Me]**; needs a second grammar, so it is v2 |

### 5.10 A complete scene (the `slider-explore@1` expansion from the controls, abridged)

```json
{"dsl":"scene@1","meta":{"band":"B3","lang":"hi-Latn+en","title":{"en":"Sun and shadow","hi":"सूरज और परछाई","hi_latn":"Sooraj aur parchhai"},"objective_ids":[],"topic_ids":[],"template":"slider-explore@1"},
 "stage":{"aspect":"1:1","bg":"surface"},
 "vars":[{"id":"sun","type":"num","init":45,"min":10,"max":80,"step":5,"tl":"sun height","unit":"deg"}],
 "derive":[{"id":"shadow","expr":"round(2 / tand(sun), 1)","tl":"shadow length","unit":"m","dp":1}],
 "nodes":[{"kind":"rect","id":"bar_bg","x":500,"y":250,"w":800,"h":70,"fill":"c6","role":"context"},
  {"kind":"rect","id":"bar","x":{"$":"100 + 400 * clamp(shadow / 12, 0, 1)"},"y":250,"w":{"$":"max(2, 800 * clamp(shadow / 12, 0, 1))"},"h":70,"fill":"c3d","tl":"shadow length"},
  {"kind":"group","id":"reads","x":500,"y":620,"layout":{"type":"row","gap":60}},
  {"kind":"text","id":"shadow_t","parent":"reads","size":"label","align":"middle","w":420,"text":{"fmt":{"en":"Shadow: {shadow} m","hi":"परछाई: {shadow} m","hi_latn":"Parchhai: {shadow} m"}}},
  {"kind":"slider","id":"s_in","x":500,"y":780,"var":"sun","len":800,"orient":"h","value":true,"say":{"en":"Sun height","hi":"सूरज की ऊँचाई"},"tl":"sun height"},
  {"kind":"text","id":"s_in_t","x":500,"y":945,"text":{"en":"Sun height","hi":"सूरज की ऊँचाई","hi_latn":"Sooraj ki oonchai"},"size":"caption","align":"middle","w":900}],
 "timelines":[],"goals":[{"id":"target","when":"shadow > 5","tl":"shadow longer than 5 m"}],"feedback":"none"}
```

---

## 6. Measurements (2026-10-02, this session)

**Method.** `node docs/research/content/genui-bench.mjs` from the US cloud build container to eastus2 (`/openai/v1/chat/completions`); `taxila-fast` = gpt-5.6-luna, `taxila-brain` = gpt-5.6-sol; synthetic briefs, no child data. Validator v1 at run time; v1.1–v1.3 were applied afterwards to the **same stored outputs**, so those columns are in-sample (§6.4). Every raw output is in `genui-bench-2026-10-02.json`.

### 6.1 Azure structured outputs (n = 1 per probe per deployment; `genui-azure-limits-probe.mjs`)

| probe | result |
|---|---|
| 120- and 400-property flat schemas | **accepted** (3.9–12.2 s; the 400-integer output took 8.7 s on fast, 12.2 s on brain) |
| 9 levels of object nesting / 13 levels | accepted / **rejected: "13 levels of nesting exceeds limit of 10"** |
| `minimum`, `maximum`, `maxLength`, `pattern`, `minItems`, `maxItems` | accepted and honoured in the sample (`a ∈ [3,5]`, `s` ≤ 4 chars `^[a-z]+$`, 2 items) |
| full scene schema, strict | **rejected: "at most 1000 enum values in total … received 1003"**; accepted after `$defs` hoisting (589 properties, depth 3) |
| Lark CFG custom tool, Responses API | **works**: `rect r1 10 20\ncircle c1 50 60` in 1.4 s (fast) and 1.0 s (brain) |
| new schema vs repeated schema (T1 size, 5 pairs) | cold 1.87 s mean vs warm 1.83 s: no first-use penalty visible at this size |

### 6.2 T1: see §4

### 6.3 T2a and T2b (8 briefs: habitats sort B2, sharing rotis B1, Sun–shadow slider B4, germination order B3, more-apples compare B2, wet-cloth predict B3, flower labels B3, square area = perimeter B4)

| arm | n | lint-clean on the first call, v1 (as run) | first call with v1.3 autofix (in-sample) | after 1 repair | first call p50 / p90 | repair call p50 | output tokens p50 (reasoning) |
|---|---|---|---|---|---|---|---|
| T2a fast, effort none | 8 | 6 | 8 | — | **3.08 / 3.35 s** | — | 381 (0) |
| T2a fast, effort low | 8 | 7 | 8 | — | 3.89 / 4.38 s | — | 419 (82) |
| T2b fast, effort low, **strict** | 8 | 0 | 4 | **6** | 11.9 / 14.0 s | 10.3 s | 1719 (166) |
| T2b fast, effort low, json_object | 8 | 1 | 1 | 1 | 8.1 / 10.8 s | 5.0 s | 1239 (327) |
| T2b brain, effort low, **strict** | 8 | 3 | 6 | **7** | 18.2 / 28.5 s | 12.8 s | 1886 (401) |

**What failed on the first call** (T2b strict, 16 scenes; the count is scenes showing the code), and what removes it:

| code | scenes | cause | remedy |
|---|---|---|---|
| S3.off_stage | 8 | titles and grids a few units over an edge; one grid 61 units off | v1.2 nudge (≤ 80 units) fixes 6. The rest are long titles, so the host draws titles outside the scene (scene@1.1) |
| S1.timeline_ref | 5 | `probe.reveal` set to an option or step id, not a timeline | v1.2 repoints it to the single `commit` timeline, or drops it. scene@1.1 renames the field `reveal_timeline` |
| S5.contrast | 4 | tints `c1`–`c4` and `done` used as text colours (3.6–4.2:1) | v1.3: text is `ink` or `ink2` only. scene@1.1 makes this a schema rule |
| S3.text_overlap | 3 | free-placed title, instruction and readout texts | layout groups for texts; no stage titles (the teacher speaks) |
| S4.goal_trivial | 2 | float boundary (`2/tand(45) > 2`) | v1.1 tolerant comparisons |
| S3.overlap, S1.dup_id, S3.hit_small | 2, 1, 1 | genuine design slips (overlapping zones, `shadow` used as a var id and a node id, 22-dp drag labels) | model repair |

**Observations.**
- **Templates were right in 7/8 briefs on both T2a arms.** The flower-labelling brief went to `sort-bins@1` in both: lint-clean and pedagogically wrong (§0.7).
- **json_object output breaks the vocabulary** (`align:"center"`, `drag.back:"origin"`, L10n as bare strings, expressions inside `pts`, a lower-case `MC.` id), and one repair round did not recover any of it.
- **Every residual failure after repair is text placement** (titles and readouts overlapping or overflowing).
- **brain beats fast on free composition** (3 vs 0 first-pass; 7 vs 6 after repair) at 1.5–2× the latency. For near-line T2b, use brain; for live T2a, fast is enough.

### 6.4 Caveats

- n is 8 briefs per arm with one rep. This picks a direction; it is not a rate.
- The v1.1–v1.3 autofixes were designed after seeing these failures, so their pass rates overstate. They need fresh briefs.
- Lint-clean does not mean pedagogically good. Template fit (b7) and fact correctness (which animals live in water) need the fact bank and a reviewer.
- The text metrics are estimates. The frame re-measures with real fonts (§5.5).
- Latency is from the US. Add the India RTT.

---

## 7. T3: free-form HTML offline → library

### 7.1 Pipeline

T3 runs on the Forge harness (`coding-agent-harnesses.md` §5: job stages, six tools, `apply_patch`, a debug protocol), with `kind: "interactive"`. That kind covers simulations, animations, explorable diagrams and novel mechanics; games keep the game pipeline in `llm-game-generation.md` §7.

- **Inputs:** a **gap cluster** of ≥ 3 tickets with the same `(objective, mechanic)`, a curriculum calendar entry with no engine, or a teacher request in authoring mode.
- **Planner (brain)** writes a `ModuleBrief` on Google's stage 1–2 pattern: objectives; entities, knobs and observables; **K levelled goals, each generated given the previous ones**; an oracle (a reference function for every observable); misconception traps; band; allowed libraries.
- **Coder (codex)** builds on `taxila-module@1` (§7.2) with only SVG/DOM, p5 1.11, KaTeX, JSXGraph and three.js (lazy), all bundled locally because CSP `connect-src` is `'none'`.

### 7.2 `taxila-module@1`: the only API a T3 artifact may use

```ts
interface LibManifest {
  id: `lib:${string}@${number}`; title: L10n; objective_ids: string[]; topic_ids: string[]; bands: Band[];
  params: Record<string, { type: "number"|"int"|"enum"|"bool"; min?: number; max?: number; options?: string[]; default: unknown; doc: string }>;
  events: string[];                          // namespaced, flat payloads, ≤ 12 keys (maths §3.2)
  goals: { id: string; tl: string }[]; probes: ProbeKind[]; misc: MiscId[];
  oracle: { inputs: string[]; outputs: string[]; fn: string; tol: number }[];   // fn = id of a reference function in the QA repo
  libs: ("svg"|"p5@1.11"|"katex@0.16"|"jsxgraph@1"|"three@lazy")[]; budget: { gzipKB: number; fpsMin: 45 };
  review: { subject: Sig; ux: Sig; at: string } | null;   // null = never shown to a child
}
interface TaxilaModule {                    // injected; wraps the shipped postMessage bridge
  ready(): void; act(type: string, data?: Record<string, string|number|boolean>): void;
  goal(id: string): void; answer(probe: string, value: unknown, correct: boolean, misc?: MiscId): void;
  stuck(reason: string): void; onCommand(fn: (c: HostToModule) => void): void;
  params(): Record<string, unknown>; lang(): "en"|"hi"|"hi-Latn+en"; band(): Band;
}
interface TaxilaTestAPI extends GameTestAPI {        // llm-game-generation §5, plus:
  sceneGraph(): { id: string; kind: string; box: { x: number; y: number; w: number; h: number };
                  text?: string; fill?: string; interactive: boolean }[];   // geometry for V5; feeds the scene@1 S3/S5 lint
  setParam(name: string, v: unknown): void; readouts(): Record<string, number>;   // for the V3 oracle sweep
}
```

### 7.3 Gates V0–V9 (cheapest first; the first failure triggers repair)

| gate | check | tool |
|---|---|---|
| V0 manifest | zod; params ranged; every goal and probe declared; oracle covers every displayed number | zod |
| V1 static | acorn AST ban-list (`fetch`, XHR, WebSocket, `eval`, `Function`, `import()`, storage, cookies, `window.open`, `top`/`parent` outside the SDK); imports ⊆ the allowlist; ≤ 400 kB gz | acorn |
| V2 boot | headless Chromium at 360×640 and 412×915, CPU 4× throttled: `ready` ≤ 3 s, zero console errors, frame not blank | Playwright on Container Apps |
| **V3 oracle** | sweep each param over 50 points (grid plus random); `readouts()` must match the reference function within `tol`. The physics or maths must be right, not merely look right | QA repo reference functions |
| V4 behaviour | a bot drives `TaxilaTestAPI.input`: every goal reachable, exactly one correct path per probe, traps emit their `misc`, events valid against the manifest, no deadlock | GameASG-style test API |
| **V5 geometry** | `sceneGraph()` at 6 keyframes goes through **the same scene@1 S3/S5 lint**: on stage, hit sizes, overlaps, text sizes, contrast | `genui-scene-dsl.mjs` (reused) |
| V6 vision critique | brain on 6 keyframes, on Google's four axes (visual, solution, telemetry-as-display, mechanics) plus R6 seductive details plus Devanagari shaping. Before it is trusted, measure its fabrication rate on seeded-bug builds (sibling M4) | taxila-brain |
| V7 content | every string and image prompt through Content Safety; dates and facts against the fact bank (LR6); rights (LR2) | Azure |
| V8 pedagogy | rubric: the action **is** the concept; ends abstract (R1); traps present; no decoration in the play area | taxila-brain, as a ranking judge only |
| V9 determinism and perf | same seed → same `sceneGraph` hash; FPS ≥ 45 median under 4× CPU; memory ≤ 150 MB | Playwright |

### 7.4 Repair loop

Deterministic fixers first (the OpenGame debug protocol: error signature → cause → fix), then the model, ≤ 5 rounds per gate family. Keep the Pareto-best build and stop after 2 non-improving rounds. On failure run a second coder configuration, because success sets barely overlap (sibling GameASG finding). Budget per job ≤ 60 min and ≤ $5 **[U]**; measure it.

### 7.5 Human review: "two-key" (nothing reaches a child without both signatures)

- **Subject key:** a teacher in that subject and band checks the concept, the oracle values, the traps and the levelled goals. **Kid-UX key:** target sizes, reading load, the Hindi and Hinglish, motion, fear or shame cues.
- **The review page shows** bot replays at 360×640, the teacher-facing event stream exactly as the Director sees it, keyframes in light/dark and en/hi, the critique log, and the oracle sweep plot.
- **Fail on any of** (Google's acceptance-rubric fail list, adapted): objective unachievable or unmeasurable; core idea or metaphor inadequate; level descriptors unintelligible; levels misordered; theory or formula missing, irrelevant or wrong; plus Taxila's: an action with no telemetry, decoration in the play area, an untagged distractor.
- Every reject reason is appended to the debug protocol and the planner's few-shot list. Target ≤ 15 min per module **[U]**.

### 7.6 Promotion paths and retirement

| path | when | becomes |
|---|---|---|
| **P1 library module** | passes V0–V9 and both keys | `lib:<slug>@<v>`, which T1 can mount live with its declared `params` (the router's `library.find`) |
| **P2 template** | a mechanic recurs across ≥ 3 gap clusters | a hand-written `scene@1` template (T2a), or a new catalog kind |
| **P3 engine** | a library module is mounted in more than ~200 lessons a week **[U]** | a hand-built engine with fading, detectors and golden tests |
| **P4 cached scene** | a T2b scene that passed validation, was used ≥ 5 times with normal goal and stuck rates, and is signed by one subject key | a library scene keyed by `(objective, mechanic, band, lang)`, re-personalised by data |

**Retirement is automatic and telemetry-driven:** `error` events in > 0.5% of mounts, a `stuck` rate more than 2× its mechanic's median, or a `goal_met` rate outside its band's interquartile range sends a module back to review **[U thresholds]**. Versions are immutable, and the cache key always includes the version.

---

## 8. Risks, open questions and the next measurements

1. **T2b is near-line by measurement (24–41 s at p90 with a repair)**, so its value depends on how far ahead the Director predicts the next concept. Measure the prefetch hit rate (mounted ÷ generated) and the real `deadlineMs` distribution (which decides whether T2a's 3.35 s p90 is ever exposed) in pilot lessons.
2. **Template fit is semantic.** Measure mechanic-tag routing vs model choice on a 40-brief cross-subject set, scored by two teachers. Build `label-diagram@1` first.
3. **Text metrics.** Measure estimated vs real overflow on 200 scenes rendered in the frame (Devanagari shaping, conjuncts), then replace the S3 estimates with a metrics table.
4. **Vision-judge fabrication (V6).** Seed 20 known bugs and require ≥ 90% recall at ≤ 10% false alarms before V6 can fail a build (sibling M4).
5. **Strict null tax vs a Lark line DSL.** Run the same 8 briefs in a CFG line grammar (tokens, latency, validity); adopt if it saves ≥ 30% of tokens at equal validity.
6. **Engine-map gaps.** Every T2 or fallback mount writes a gap ticket. The weekly gap report decides the T3 queue, and the queue is the library's growth rate.
7. **Fact correctness inside lint-clean scenes** (which animals are "water" animals). The fact bank (LR6) must cover EVS classification sets before sort scenes run unreviewed.
8. **India latency.** Re-run `genui-bench.mjs --only t1` from an India client. If T1 p90 exceeds 2.5 s, prefetch is mandatory rather than an optimisation.

---

## 9. Proposed `context/` entries (for the main loop to merge; this workstream writes only in `content/`)

**Decisions** (each has a reversal condition):
- `module-tiers-genui`: live = T1 (engine + params) and T2a (template fill); T2b (free scene) = near-line, horizon ≥ 45 s; T3 (free HTML) = offline only, after two-key review. *Reverse if* T2b p90 with one repair drops below the median explain-turn length on fresh briefs.
- `t1-effort-none`: T1 fills run on `taxila-fast` at `reasoning_effort: none`; code computes numbers, distractors and traps. *Reverse if* a fresh 40-fill set shows a validity gap of ≥ 5 pp for effort `low`.
- `dsl-strict-decoding`: `scene@1` is always requested in strict mode with `$defs` hoisting. *Reverse if* a Lark line DSL matches validity with ≥ 30% fewer output tokens.
- `router-not-model`: the router chooses the tier and the template by mechanic tags; the model never picks its own tier. *Reverse if* model choice beats tag routing on the 40-brief teacher-scored set.

**Measurements** (`genui-*-2026-10-02`, US build container → eastus2, synthetic briefs):
- `azure-structured-limits`: 400 properties accepted; nesting > 10 rejected; > 1000 enum values rejected; min/max/pattern honoured; Lark CFG works (n = 1 per probe per deployment).
- `t1-fill-latency`: fast/none 1.88 / 2.05 s p50/p90, 10/10; fast/low 3.46 / 5.09 s, 9/10; brain/none 2.48 / 2.87 s, 10/10; brain/low 4.18 / 6.98 s, 10/10 (n = 10 each).
- `t2-scene-generation`: T2a fast/none 3.08 / 3.35 s, 6/8 lint-clean; T2b strict fast 11.9 / 14.0 s, 0/8 first call → 6/8 after one repair; T2b strict brain 18.2 / 28.5 s, 3/8 → 7/8; json_object 1/8 → 1/8; strict null tax 24.5% of payload (n = 8 briefs per arm).

**Rejections:**
- `json-object-for-dsl`: schema-less JSON mode with the catalog in the prompt. 7/8 scenes broke the vocabulary (`align:"center"`, `drag.back:"origin"`, bare-string L10n), and one repair fixed 0/7.
- `float-strict-ordering`: exact `<`/`>` in EXPR@1. `2/tand(45) > 2` was true at mount, so a goal fired instantly. Replaced by ε-tolerant ordering (v1.1).
- `model-picks-template`: free model choice of template. The flower-labelling brief went to `sort-bins@1` in 2/2 runs (lint-clean, pedagogically wrong).

---

## Sources

Primary and secondary sources used in this document (fetched 2026-10-02 unless marked):
- Leviathan, Valevski, Kalman et al., *Generative UI: LLMs are Effective UI Generators*, Google Research, arXiv 2604.09577 — PDF: https://generativeui.github.io/static/pdfs/paper.pdf [V]; blog: https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/ [V]
- Kovshov et al., *Harnessing Generative UI for Education: Tailored Learning Interactives*, arXiv 2609.20738 — https://arxiv.org/html/2609.20738v1 [V]
- LearnLM Team, *Towards an AI-Augmented Textbook* (Learn Your Way), arXiv 2509.13348 — https://arxiv.org/html/2509.13348 [V]
- A2UI — https://github.com/google/A2UI and https://a2ui.org/specification/v0.9-a2ui/ [V]; Kong et al., *Macaron-A2UI*, arXiv 2605.24830 [S]
- json-render — https://github.com/vercel-labs/json-render [V]
- tldraw make-real — https://github.com/tldraw/make-real (archived 2026-02-20; prompt at app/prompt.ts) [V]; tldraw agent starter kit — https://tldraw.dev/starter-kits/agent [V]
- Claude artifacts system prompt (2024 leak) — https://gist.github.com/dedlim/6bf6d81f77c19e20cd40594aa09e3ecd [S]
- Azure OpenAI structured outputs (doc updated 2026-08-24) — https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/structured-outputs [V; limits contradicted by §6.1]
- OpenAI custom tools and CFG — https://developers.openai.com/api/docs/guides/function-calling [V]; structured outputs first-schema latency note — https://developers.openai.com/api/docs/guides/structured-outputs [V]
- Liao et al., *ALGOGEN*, arXiv 2605.12159 [S]; Lopez et al., *SGA*, arXiv 2607.18116 [S]; Oli et al., *ManiBench*, arXiv 2603.13251 [S]; Ku et al., *TheoremExplainAgent*, arXiv 2502.19400 [S]; Rammuni Silva et al., Manim SFT/GRPO/RITL, arXiv 2604.18364 [S]; *LLM2Manim*, arXiv 2604.05266 [S]; *Animation2Code*, arXiv 2606.28593 [S]; *AVR-Agent*, arXiv 2508.00632 [S]
- Chen et al., *IWR-Bench*, arXiv 2509.24709 [S]; Xiao et al., *Interaction2Code*, arXiv 2411.03292 (ASE 2025) [S]; Zhao et al., *LongWebBench*, arXiv 2606.17727 [S]; Imteyaz et al., *Design Theater*, arXiv 2607.22928 [S]; Peng et al., *EvoGenUI-Bench*, arXiv 2608.29387 [S]; Zhou et al., *LEGOUI*, arXiv 2608.04293 [S]; *DeclarUI*, arXiv 2409.11667 [S]; Neshaei et al., *The Missing Layer: Design-Time Generative UI*, arXiv 2606.15902 [S]
- Chavan et al., arXiv 2609.23742 [S]; Li et al., *When JSON Is Not Enough*, arXiv 2607.18261 [S]; Ray, *The Constraint Tax*, arXiv 2605.26128 [S]; Tam et al., *Let Me Speak Freely?*, arXiv 2408.02442 [S]; Geng et al., *JSONSchemaBench*, arXiv 2501.10868 [S]
- Olausson et al., *Is Self-Repair a Silver Bullet for Code Generation?*, arXiv 2306.09896 [S]; Arimbur et al., *How Many Tries Does It Take?*, arXiv 2604.10508 [S]
- Sibling docs (citations carried, not re-fetched): `factory/llm-game-generation.md` (v0, bolt, Lovable, V-GameGym, Mage, GamED.AI, OpenGame, Play2Code, GameASG-Bench, ArtifactsBench), `tech-and-market.md` §3, `design/kids-ux-ages.md` §4, `conductor/student-workspace.md` (tldraw licence)
