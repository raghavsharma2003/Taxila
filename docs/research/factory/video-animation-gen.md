# Forge video and animation lanes: what to use for explainers, chapter videos and live animation

Workstream `factory/video-animation-gen`, 2026-10-02. Question: which generation lane should Forge use for

1. a 20-60 s concept explainer generated **during** a lesson,
2. a pre-rendered chapter video,
3. live on-screen animation synced to the teacher's speech.

Lanes studied: sora-2 on Azure, Manim + LLM (TheoremExplainAgent, Code2Video, TeachMaster and successors),
Remotion, Motion Canvas / Revideo, GSAP timelines generated live, a Khan-style whiteboard with TTS timestamps,
and Lottie. The output is a latency and cost table, a decision per use case, and pipeline designs.

Evidence tags:
- **[M]** measured in this session (n, method and files in §2);
- **[V]** vendor primary document fetched today;
- **[S]** paper or secondary source (abstract or HTML fetched today);
- **[P]** prior document in this repo;
- **[I]** inference;
- **[U]** unknown, must be measured.

The WebSearch budget was exhausted before this workstream started. Every source below was fetched directly
(WebFetch, arXiv search pages, package source via pip).

Read first: `llm-game-generation.md` §6 (assets; it already said "do not build on Sora 2"),
`content/genui-reliability.md` §2.2, §5.6 and §7 (scene@1 timelines, `cue`, ALGOGEN),
`design/ui-teardown.md` §4.3 (Director-armed cues on the playback clock), `auto-validation-qa.md` (gates),
`coding-agent-harnesses.md` (Forge harness), and `sandboxes-per-student.md` (ACA pricing).
This document does not repeat those; it extends them to time-based media.

---

## 0. Verdict

1. **The pixel-video lane is ending on Azure in 13 days. Do not build on it.**
   - Foundry's retirement schedule (updated 2026-09-23) lists `sora-2` **2025-12-08: Preview, retirement
     2026-10-15, replacement "—"**. The 2025-10-06 version already retired on 2026-07-15 **[V]**.
   - OpenAI removed the Videos API and every sora-2 alias on 2026-09-24, also with no replacement **[V]**.
   - There is no first-party Azure video model after that date. The schedule lists only image models (gpt-image-2,
     gpt-image-2.5-flare/-sunburst, MAI-Image-2.5) **[V]**.
   - Today's probe also shows why it was never the right lane for a curriculum product **[M, n = 4 + sibling n = 3]**:
     - Sora wrote a number line labelled `-2 -3 -4 -1 -5 5 -9 -19 …`.
     - It misspelled गुरुत्वाकर्षण as गुरूत्वाकर्श… (ू for ु, श for ष).
     - It lost an object between frames.
     - It took **49-79 s for a 4 s clip** and **87-118 s for an 8 s clip**, at $0.10 per second.
   - Generated pixels cannot be validated against an answer key. Code can.
2. **One intermediate representation drives all three use cases: `explainer@1`.**
   - It is a narrated sequence of `scene@1` timelines (the DSL that already exists, `genui-scene-dsl.mjs`) plus
     beats keyed to narration segments and terms.
   - It has three renderers:
     - (a) the in-app frame runtime, **live and interactive**, with no video file;
     - (b) a **deterministic seek renderer** that exports MP4. It drives the same timeline frame by frame in
       headless Chromium into ffmpeg and measured **1.0× real time at 720p30 on one page** **[M]**;
     - (c) a **Manim backend**, only for segments that need precise maths or geometry.

   ALGOGEN's "LLM writes an IR, a deterministic renderer draws it" result (99.8% vs 82.5% end-to-end, fewer
   overlaps **[S, via genui-reliability §2.2]**) is the reason for this shape.
3. **Use case (1), the 20-60 s in-lesson explainer, is an `explainer@1` the teacher performs live.**
   - It is **not** a video clip. The teacher's realtime voice speaks each segment while the frame runs that
     segment's timeline. Beats fire on Director-armed cues on the playback clock (ui-teardown §4.3).
   - It stays interruptible, in her voice and in Hindi script with correct shaping. The child can tap and pause it.
   - Generation takes **≈ 3-4 s from a template** or **≈ 12-18 s free-form** on `taxila-fast`/`taxila-brain`
     **[P: genui-reliability §6.3]**, and costs about $0.001-0.01.
   - It also exports to MP4 for replay and WhatsApp sharing through renderer (b).
   - Manim is the measured alternative when a precise diagram matters:
     - LLM → Manim → MP4 took **19-40 s to generate plus 4-6 s to render at 480p** for a 30 s scene;
     - render success was **10/10** within one repair round;
     - but the labels collided in **6/10** and the maths was wrong in **1/10** **[M]**.

     Manim is therefore the library lane, not the live lane.
4. **Use case (2), the pre-rendered chapter video (3-8 min), is an offline Forge job: storyboard → segments
   → per-segment lane → gates → assemble → two-key human review → library.**
   - Each segment uses one lane:
     - `manim` for maths and geometry;
     - `explainer` for processes and manipulatives;
     - `still` for gpt-image-2 art with camera moves and code-drawn labels.
   - Narration is Azure TTS. Word boundaries come from batch synthesis (`wordBoundaryEnabled`, p50 10-20 s,
     p95 120 s) **[V]** or from the Speech SDK `WordBoundary`/`BookmarkReached` events **[V]**.
   - Cost: ≈ **$0.2-2 per 5-min video** in model spend, 10-20 min wall time **[I, from Code2Video 8.8-13.8 min/video
     and TheoremExplainAgent $1.16-4.67 per video [S]]**. Human review time dominates.
   - Videos are made per topic, never per child (Conductor C8). Personalisation is a parameter skin.
5. **Use case (3), live animation synced to the teacher's speech, is `scene@1` timelines plus the host
   `cue{id}` command, armed by the Director and fired on the playback clock.**
   - Sync sources, best first:
     - Voice Live word timestamps (lane B);
     - the character offset in the transcript delta × the voice's chars/s (measured **10.9 ± 1.1 chars/s** on
       gpt-4o-mini-tts, n = 6 **[M]**);
     - `audio_start`/`audio_end`.
   - GSAP core is the tween and seek engine inside the frame: 72.9 kB minified **[M]**, free for commercial use
     including the former Club plugins since 2025-04-30 **[V]**.
   - Nothing is generated on the live path except the T1/T2a parameters that already exist.
6. **The other tools, ranked:**
   - **Remotion** works, but costs $0.01 per render with a $100/month minimum for companies with more than 3
     employees **[V]**, and it would be a second scene language.
   - **Motion Canvas / Revideo** (MIT) are good offline TypeScript renderers, but they duplicate what the seek
     renderer already does with our own DSL.
   - **Lottie** is for curated reward and transition loops only. Generating Lottie is research-grade
     (OmniLottie, LottieGPT; CC BY-NC-ND, fine-tuned VLMs **[S]**).
   - **Whiteboard stroke-drawing** is a `trace` step in scene@1 (GSAP DrawSVG, now free), not a separate lane.
7. **Fix these now, independent of the decision:**
   - `gpt-4o-mini-tts` **2025-03-20** (Preview) also retires on **2026-10-15**. Pin the deployment to 2025-12-15 (GA)
     **[V]**. Which version `gpt-4o-mini-tts` points to here is **[U]**.
   - The Forge image needs Devanagari fonts (`fonts-noto-core`). With them, Manim's Pango text shapes
     गुरुत्वाकर्षण / क्ष / त्र correctly **[M]**. Without them it renders tofu.

---

## 1. Azure facts that set the boundaries (fetched today)

| item | value | tag |
|---|---|---|
| sora-2 on Azure, API | v1 API, same schema as OpenAI: `POST /openai/v1/videos` (multipart: `model`, `prompt`, `seconds`, `size`, optional `input_reference` image that must match `size`, `remix_video_id`), `GET /videos/{id}` (status `queued`/`in_progress`/`completed`/`failed`, `progress` 0-100), `GET /videos/{id}/content` → MP4. Plus list and delete | [V] + [M] |
| durations | `seconds` ∈ **4 / 8 / 12** (default 4). The concept page's "1-20 s" belongs to the older job API also shown on that page | [V] |
| sizes | API table: `720x1280` (default) and `1280x720`. The limitations list has more sizes for the legacy job API | [V] |
| concurrency | "two video creation jobs running at the same time"; jobs expire after 24 h | [V] |
| generation time | "typically 1 to 5 minutes". The doc's own sample: a 4 s 720×1280 clip took 67 s | [V] |
| price | **$0.10 per second** (720p, both orientations), Global Standard | [V, Azure blog] |
| content rules | "only content suitable for audiences under 18"; copyrighted characters and music rejected; real people (including public figures) cannot be generated; **input images with human faces rejected** | [V] |
| quality limits | struggles with "complex physics, causal relationships …, spatial reasoning (left from right), precise time-based event sequencing"; prompts should be "English or other Latin script" | [V] |
| lifecycle | `sora-2 2025-10-06` retired 2026-07-15 → 2025-12-08; **`sora-2 2025-12-08` Preview, retires 2026-10-15, replacement —**. Preview retirements give "30 days notice" and are never extendable | [V, schedule updated 2026-09-23] |
| OpenAI side | "On March 24th, 2026, we notified developers using the Videos API and Sora 2 … of their deprecation and removal from the API on September 24, 2026." No replacement | [V, developers.openai.com/api/docs/deprecations] |
| TTS lifecycle | `gpt-4o-mini-tts 2025-03-20` Preview → retires 2026-10-15; `2025-12-15` GA → 2027-06-15 | [V] |
| image lifecycle | `gpt-image-2` GA to 2027-10-21; **new `gpt-image-2.5-flare` and `-sunburst` (GA 2026-09-09)**, not yet measured here | [V]; speed and quality [U] |
| word timings | Speech SDK events `WordBoundary` (AudioOffset in 100-ns ticks, Duration, TextOffset, BoundaryType word/punctuation/sentence) and `BookmarkReached` (SSML `<bookmark mark=…/>`), plus `VisemeReceived`. **SDK only, not the TTS REST API** | [V] |
| batch TTS | REST batch synthesis: `properties.wordBoundaryEnabled` → `[nnnn].word.json`, `sentenceBoundaryEnabled` → `.sentence.json`; latency p50 10-20 s, p95 ≤ 120 s; 100 requests per 10 s | [V] |
| Claude on Foundry | `coding-agent-harnesses.md` records that provisioning `taxila-opus`/`taxila-sonnet` **failed** (rejected.md#claude-on-foundry-credits), and the CLAUDE.md directive allows first-party models only | [P] |

Claude therefore appears below only as an arm in published results. Every lane here runs on `taxila-codex`,
`taxila-brain`, `taxila-fast`, `taxila-image` and Azure TTS.

---

## 2. Measurements (2026-10-02)

All runs went from the US cloud build container to the Azure resource, on 4 vCPU and 15 GB RAM. Add the
India RTT for production.

### 2.1 sora-2 (`taxila-sora`): `factory/video-probe.mjs` → `video-probe-2026-10-02/results.json`

Method:
- 4 prompts, 1280×720, 2 jobs in flight, poll every 5 s.
- Frames inspected at 1 fps with crops, by one rater (this agent).
- Cost: $2.40.
- MP4s were moved out of the repo; the contact sheets stay.
- The sibling probe `content/animation-video-sora-probe-2026-10-02.json` (3 × 4 s, same day) is pooled for latency.

| clip | seconds | server time (created → completed) | what the frames show |
|---|---|---|---|
| p1 photosynthesis with labels | 8 | **87 s** (wall 90) | title `PHOTOSYNTHESIS` and `CO₂` correct. `OXYGEN` on the bubbles is about 10 px and partly garbled. Sun cropped at the edge. Direction correct |
| p2 seed germination | 8 | **118 s** | a root appears, but the seed **rises above the jar rim** and there is no root-first order. Usable as reviewed b-roll at best |
| p3 Devanagari title | 4 | **79 s** | **misspelled**: गुरुत्वाकर्षण → गुरूत्वाकर्श… The mango **vanishes** between frames 2 and 3 |
| p4 child character + number line | 4 | **53 s** | a cartoon 9-year-old girl is generated without refusal. **Number-line labels are wrong**: −2 −3 −4 −1 −5 5 −9 −19 −19 −13 −14 −12 −10 |
| sibling: seed / count / shadow | 4 each | 53 / 51 / 49 s | latency only (no frame verdicts recorded there) |

Every clip carried an AAC soundtrack (mean −18 to −20.5 dB) that nobody asked for. It must be stripped or replaced.

**Latency summary:**
- 4 s clips: median 53 s, range 49-79 (n = 5).
- 8 s clips: 87 and 118 s (n = 2).

A 30 s explainer needs ≥ 3 jobs (12 + 12 + 8 s, billed 32 s = $3.20). With 2 in flight that means ≥ 2 rounds,
≈ 3-5 min **[I]**, and three clips that share no characters, layout or colours.

### 2.2 LLM → Manim CE render loop: `factory/manim-probe.mjs` → `manim-probe-2026-10-02.json`

Method:
- Manim Community **v0.21.0**, no LaTeX (Text only), 5 Class 2-7 concepts × 2 models.
- Responses API; `taxila-codex` (gpt-5.3-codex, reasoning medium) and `taxila-fast` (gpt-5.6-luna, default effort).
- Prompt shape: one Scene class, a `NARRATION = [(sentence, seconds)…]` list whose seconds must equal the
  segment's `run_time` + `wait` totals, font ≥ 32, ≤ 6 words per Text, a safe frame.
- Render `-ql` (854×480@15); up to 2 repairs fed back the traceback.
- 12-frame contact sheets rated by eye (one rater).
- Code and sheets are in `video-probe-2026-10-02/manim/`.

| model | render OK first try | OK within ≤ 1 repair | gen time per call | output tokens | render 30 s @480p15 | duration = plan (±0.15 s) | maths/science correct | label collision visible |
|---|---|---|---|---|---|---|---|---|
| codex | **3/5** | 5/5 | 24-40 s (repair 10-12 s) | 3.2-4.7k | 5.1-5.7 s | 5/5 | 4/5 | **4/5** |
| fast (luna) | **5/5** | 5/5 | 19-27 s | 3.1-3.8k | 4.2-5.0 s | 5/5 | **5/5** | 2/5 |

- **Both codex first-try failures were the same hallucinated call**: `AnnularSector(..., outer_radius=…)`
  raises "got multiple values for keyword argument 'outer_radius'". This belongs in a deterministic fixer
  catalogue (v0's "autofixer" pattern, `llm-game-generation` §1), not in a model round.
- **The one maths error is the kind render gates never see.** In codex's triangle-sum scene, the three
  "moved" corners overlap and do not tile a straight angle. The scene asserts 180° without showing it. This is
  ManiBench's "visual-logic drift" **[S, via genui-reliability §1]**. It is caught only by checking geometry from
  the scene graph (§7.3) or by a reviewer.
- **The collisions are text-on-text or text-on-arc in the last third of the scene,** when the model adds a
  misconception callout to a full stage. This is TheoremExplainAgent's "minor issues with visual element layout"
  **[S]** and the same residual that scene@1 has after repair (genui-reliability §6.3: "every residual failure
  after repair is text placement") **[P]**.
- **Timing compliance was 10/10.** Asking the model to make each segment's animation seconds equal to the
  narration seconds works. That is the hook for audio-first sync (§6.4).
- Render cost scales with quality. On c2 (30 s): **720p30 9.4 s, 1080p60 30.2 s**; c4 at 720p30 took 10.5 s
  **[M]**.
- **Devanagari:** after `apt-get install fonts-noto-core fonts-lohit-deva`, `Text("गुरुत्वाकर्षण · तीन-चौथाई ¾ · क्षत्रिय",
  font="Noto Sans Devanagari")` shaped every conjunct correctly **[M]**. Pango handles complex scripts. Before the
  fonts were installed there was no Devanagari face.
- **Cost per attempt** at list price **[I from tokens × price]**:
  - codex ≈ 4k output × $14/M ≈ **$0.06**;
  - luna ≈ 3.3k × $1.20/M ≈ **$0.004**;
  - render compute ≈ 6 s × 2 vCPU × $0.000024 ≈ **$0.0003** (ACA consumption rate **[P]**).

n = 5 per arm. This picks a direction; it is not a rate. "luna beats codex" is not established, and the
next run needs 20+ concepts and a second rater.

### 2.3 Deterministic seek renderer (GSAP timeline → MP4): `factory/gsap-render-probe.mjs` → `gsap-render-probe-2026-10-02.json`

Method:
- One SVG scene (place value 345: 3 flats, 4 rods, 5 cubes, labels, equation), a 30 s GSAP 3.15 timeline,
  paused.
- For each frame: `tl.seek(i/30)`, then a Playwright `screenshot({type:'jpeg'})` from chrome-headless-shell at
  1280×720, piped to `ffmpeg -f mjpeg … libx264`.

Result **[M]**:
- 900 frames in **30.1 s wall (1.00× real time)**;
- mean screenshot **31.7 ms**;
- MP4 109 kB;
- scene HTML 1.9 kB plus gsap.min.js 72.9 kB.

Gotcha: `page.evaluate(() => tl.seek(t))` **hangs**, because it returns the circular timeline object. The
evaluate must return `void`.

Chunking the timeline across N pages should scale roughly linearly up to the core count **[I]**. That is about
8-10 s for 30 s on 4 vCPU, untested.

### 2.4 Per-segment TTS timing: `factory/tts-segment-probe.mjs` → `tts-segment-probe-2026-10-02.json`

Method: `gpt-4o-mini-tts`, voice `coral`, 6 Hinglish (Roman script) narration sentences of 35-64 chars, WAV,
non-streamed.

Result **[M]**:
- latency **0.81-1.11 s per segment**;
- audio 3.85-6.4 s;
- speaking rate **10.9 ± 1.1 chars/s** (CV 10%).

Consequences:
- Synthesising **each segment separately** gives exact segment durations with no timestamps at all. Segments run
  in parallel, so a 6-segment explainer is voiced in ≈ 1-1.5 s.
- Within a segment, a beat placed by character offset × chars/s has an expected error of about ±10% of its
  offset: ≈ ±0.3 s at 3 s in. That sits at the `auto-validation-qa` animation gate's 300 ms bound. Beats that
  must land on a word therefore need real word boundaries (Azure Speech) or must sit at segment starts.

---

## 3. Lane assessments

### 3.1 sora-2 (pixel video)

| criterion | finding |
|---|---|
| API shape | async job (§1). It fits an ACA job worker; it never fits the live path |
| durations | 4/8/12 s. A 20-60 s explainer is 2-5 stitched clips with no shared state (remix and `input_reference` help continuity a little) **[V]** |
| latency | 49-118 s per clip **[M]**, 2 concurrent jobs per resource **[V]** |
| cost | $0.10/s: $3 for 30 s, $30 for a 5-min chapter, before any retry **[V]** |
| educational quality | motion as content (germination, a falling mango) is plausible but physically loose. **Labels, numbers and Devanagari are wrong** **[M]**. The vendor list (causality, left/right, sequencing) is exactly science content **[V]** |
| text | short English uppercase titles OK; small text garbled; Devanagari misspelled **[M]** |
| kid safety | under-18 content filter, no real people, face inputs rejected **[V]**. Cartoon children are generated **[M]**. The unrequested soundtrack is a content-safety surface. No answer key can check pixels |
| lifecycle | **retires 2026-10-15 with no replacement** **[V]** |

**Conflict to resolve.** `multimodal-orchestration.md` MO9 (same day) keeps sora as a library-only ≤ 12 s
phenomenon hook. That row depends on a deployment that returns `410 Gone` from 2026-10-15 **[V]**. The
hook survives only as (a) clips generated by hand and archived as ordinary reviewed assets before 10-15, or
(b) the `still` + motion lane (§3.8).

**Decision: build nothing on it.** Remove `taxila-sora` from the Forge lane list (it is in `decisions.md:63`
and `orchestration-architecture.md` §5.3 as `forge.video`). If the owner wants a few b-roll clips for the
library before 10-15 (a seed growing, a monsoon cloud), generate them by hand, review them, and store them
as ordinary assets. That is a curation task, not a pipeline.

**Reverse if:** Azure lists a GA first-party video model with a published retirement ≥ 12 months out, and
that model passes a 20-clip blind check:
- labels and numbers correct ≥ 95%;
- Devanagari spelled right;
- object permanence held.

Even then it would be a b-roll lane only.

### 3.2 Manim CE + LLM

**What the literature shows** (all [S], fetched today):

| work | pipeline | numbers that matter here |
|---|---|---|
| TheoremExplainAgent (Ku et al., ACL 2025, arXiv 2502.19400; MIT) | planner → storyboard; coding agent writes Manim; RAG over Manim docs; ≤ 5 repair retries; Kokoro TTS with `manim-voiceover` | success **o3-mini 93.8%**, GPT-4o 55.0%, Gemini 2.0 Flash 14.6%, Claude 3.5 Sonnet 2.1%. Cost per video $1.16 (o3-mini, ~1,680 s), $1.71 (4o), $4.67 (Sonnet + RAG). Videos up to 10 min vs ~20 s without planning. Failures: hallucinated Manim APIs, LaTeX errors, general bugs; "most videos … minor issues with visual element layout". Human–auto correlation weak on narrative (ρ 0.14-0.17) |
| Code2Video (Chen, Lin, Shou, arXiv 2510.01174; MIT; Manim 0.19) | Planner → Coder (scope-guided auto-fix: line → block → global) → Critic (VLM with **visual anchor** prompts) | TeachQuiz **86.0** (Claude Opus 4.1) / 82.0 (GPT-4.1) vs direct code 40.0; **pixel models (Sora, Wan, Veo 3) 0.0-2.5**; human 3B1B 97.1. Aesthetics 87.9 vs 37.8. Time **13.8 min / 43.1k tokens** (Opus), **8.8 min / 19.3k** (GPT-5). Ablations: −41.5 without the Planner, −26.8 without visual anchors, −21.3 without the Critic. Human study n = 40: middle-school learners 88.1 TeachQuiz vs undergraduates 55.0 |
| TeachMaster (arXiv 2601.04204, ACL 2026) | planning, design and rendering agents, code as the semantic medium | cost "0.3% of traditional online course videos" (no engine named in the abstract) |
| PhysicsSolutionAgent (arXiv 2601.13453) | Manim physics-solution videos up to 6 min, 15-parameter auto QA plus VLM feedback | 32 videos, 100% completion, 3.8/5; flags visual verification as the weak point |
| ALGOGEN (arXiv 2605.12159) [P via genui-reliability] | LLM writes a tracker emitting VTA-JSON; a deterministic renderer draws Manim/TikZ/three.js | **99.8% vs 82.5%** end-to-end, fewer overlaps |
| LLM2Manim (2604.05266), Manim SFT+GRPO (2604.18364), SGA (2607.18116), ManiBench (2603.13251) [P via genui-reliability] | | n = 100 students 83% vs 78% post-test; 94% render success after RL; geometric verification +16.1%; "visual-logic drift" |
| ANVIL (arXiv 2605.16295) | analogy text → Manim for CS lecturers | teacher evaluation; LLM screen |
| "MathVideo" | **not found**: arXiv full-text search for `MathVideo` returned zero results today | [U]. The brief may mean one of the above |

**What today's probe adds [M]:**
- Single-shot render success is already high on 2026 models (8/10 first try, 10/10 within one repair). A
  repair round costs ≈ 10-12 s.
- The remaining problems are **layout** (6/10 scenes had a visible collision) and **semantic geometry** (1/10).
  Neither is visible to "did it render?".
- Duration control works (10/10), so audio-first timing is feasible.
- Render is cheap: ≤ 6 s at 480p and ≈ 10 s at 720p for a 30 s scene.

**Strengths:**
- precise geometry;
- the 3Blue1Brown visual grammar, which children's maths explainers already borrow;
- exact Devanagari text with the right font;
- MIT licence;
- a big public corpus, so the models know the API.

**Weaknesses:**
- Output is a flat video: no interaction, no telemetry inside the scene.
- It is Python in a sandbox, so it needs the ACA job lane (`sandboxes-per-student.md`), not the browser.
- The visual style is not Taxila's chalkboard identity unless we ship a `TaxilaScene` base class with tokens
  (colours and fonts from `visual-identity.md`).
- LaTeX adds about 1-2 GB of TeX Live and a common failure class. Prefer Text, plus KaTeX → SVG →
  `SVGMobject` for the few Class 8-9 formulas **[I]**.

**Decision:** Manim is the **precise-maths segment backend for chapter videos and the library**, and the
fallback renderer when an explainer needs geometry the scene@1 node set cannot draw. It is not the default
in-lesson lane (§5).

### 3.3 Remotion (React → video)

**Facts [V]:**
- Free for individuals, non-profits and for-profits with **≤ 3 employees**. Above that, a Company License is
  required: Creators **$25/month per seat**, Automators **$0.01 per render with a $100/month minimum**,
  Enterprise from $500/month.
- Copying or modifying Remotion "for the purpose of selling … your own derivate of Remotion" is not allowed.
- It ships agent skills (`npx skills add remotion-dev/skills`: create, markup, render, captions, …) and serves
  `.md` docs for agents.
- Performance guidance: GPU CSS and WebGL are slow on cloud CPUs, and JPEG frames are faster than PNG.

**Fit:**
- React plus `useCurrentFrame`/`interpolate` is easy for LLMs. Its frame-pure model also guarantees
  determinism, which is what our seek renderer does by hand.
- Its value is media compositing (video layers, captions, transitions), which Taxila barely needs once pixel
  video is gone.
- It would be a **second scene language** next to scene@1. Every explainer would then need two validators,
  two style systems and two telemetry contracts.

**Decision: not adopted.**

**Reverse if:** the chapter-video pipeline needs real compositing (camera footage, picture-in-picture,
licensed stock), **and** the seek renderer cannot reach visual parity. The cost ($100/month plus $0.01 per
render) is not the obstacle; duplication is.

### 3.4 Motion Canvas and Revideo

**Facts:**
- **Motion Canvas** (MIT; generator-based TypeScript animations; real-time editor; "synchronize them with
  voice-overs") has 19.2k stars and was active today **[V, GitHub page]**. Its rendering is editor-centred.
- **Revideo** (MIT) is the headless-render variant: `renderVideo()`, a CLI render endpoint, `<Audio/>`/`<Video/>`
  "frame-accurate synchronization", and parallelised rendering across workers. Its docs say a scene is "plain
  TypeScript, so Claude or Codex can produce one from a prompt" **[V, GitHub README]**.

**Fit:**
- Both are better authoring languages than raw GSAP for long explainers: generators read as a script.
- They are the strongest "build our own Remotion-free renderer" candidate if the scene@1 renderer's visual
  ceiling proves too low.
- Today they would be a third scene language for the model, and they cannot run the interactive in-app
  version.

**Decision: hold.** The seek renderer over scene@1 (§2.3) covers MP4 export.

**Reverse if:** a blind panel (n ≥ 10 children or teachers) rates scene@1-exported chapter segments clearly
below Revideo-authored ones of the same storyboard.

### 3.5 GSAP timelines generated live

**Facts:**
- GSAP 3.15 core is 72.9 kB minified **[M]**.
- The "Standard No Charge" licence (from 2025-04-30) covers commercial use and "all of GSAP including the
  plugins that were formerly 'members-only' like SplitText and MorphSVG". The one prohibited use: tools "that
  allow users to build visual animations without code" competing with Webflow **[V]**.
- Forge is not offered to users as a no-code animation builder. Children never author animations, so this
  looks clear **[U: one-line legal check]**.

**Fit:**
- The model should **not write GSAP code**. It writes scene@1 `timelines` (data). The frame runtime compiles
  each `Step` (`tween/show/hide/pulse/set/cue/trace/count`) into a paused `gsap.timeline()`.
- The same timeline then serves:
  - live play;
  - `cue` jumps (`tl.tweenTo(label)`);
  - pause on interruption (`tl.pause()` on the exact frame; ui-teardown §4.4: "the speech animation stops on
    the frame of interruption");
  - `prefers-reduced-motion` (`tl.progress(1)` per beat);
  - deterministic MP4 export (`tl.seek(t)` per frame, §2.3).
- GSAP's `DrawSVGPlugin` implements scene@1's `trace` (the chalk stroke). `MorphSVG` is available but should
  stay unused (decorative).

**Decision: GSAP core (+ DrawSVG) is the tween engine inside `scene@1`'s frame runtime.** It is bundled
locally under the sandbox CSP (tech-and-market §3.4), never from a CDN.

### 3.6 Khan-style whiteboard with synced narration

**The Khan shape:** a voice explains while a hand draws strokes, and each stroke appears as the word is
said. The pieces:
- **Strokes:** scene@1 `trace` steps (DrawSVG or vivus). Vivus is MIT and works on stroked `<path>` only:
  "cannot be filled", "text elements aren't supported" **[V]**.
  - Handwritten **English** needs single-stroke fonts (Hershey/Relief SingleLine) or text → path outlines
    with a clip-mask reveal.
  - **Devanagari** has no single-stroke font in common use **[U]**. Reveal shaped text with a left-to-right
    clip mask (the shirorekha draws first, a cheap and readable approximation) **[I]**.
- **Timing:** word boundaries from Azure Speech, or segment-level timing from per-segment TTS (§2.4). The
  `manim-voiceover` 0.4.0 source (MIT) shows the standard algorithm **[V: `tracker.py`]**:
  - it stores the text offset of each `<bookmark mark='X'/>`;
  - it maps that offset → audio time by interpolating the TTS word boundaries (`TimeInterpolator`);
  - it exposes `wait_until_bookmark(X)`;
  - with no boundaries, it falls back to proportional time.

  Our `Beat.at = {kind: "term"}` (§6.1) is the same idea, keyed on terms rather than bookmarks, so it also
  works on live realtime speech.
- **The chalkboard surface** is `visual-identity.md`'s board token set (`board #1F3B30`, chalk `#F5F2E8`) **[P]**.

**Decision:** "whiteboard" is a **visual mode of `explainer@1`** (`stage.surface = "board"`, strokes via
`trace`, chalk tokens), not a separate lane.

### 3.7 Lottie / dotLottie

**Facts:**
- Playback is cheap and already chosen for rewards (tech-and-market §2: "Lottie handles reward animations")
  **[P]**.
- Generation research:
  - **OmniLottie** (CVPR 2026, arXiv 2603.02138): Lottie tokenizer plus VLM, MMLottie-2M dataset, **CC BY-NC-ND**;
  - **LottieGPT** (arXiv 2604.11792): fine-tuned Qwen-VL **[S]**.

  Neither is a first-party Azure model. Neither reports validity against GPT-class models writing raw Lottie JSON.

**Fit:** Lottie animates designed vector art. It cannot carry curriculum truth (numbers, labels and geometry
from the kit).

**Decision:**
- Lottie is a **curated asset library**: rewards, transitions, a few character loops, each licence-checked.
  The scene@1 `sprite` node may reference a Lottie id.
- **Never LLM-generated.**

**Reverse if:** an Azure-hostable Lottie generator appears with a licence that allows commercial use and
≥ 95% schema validity.

### 3.8 Stills with motion (gpt-image-2 + camera moves): the "video feel" without a video model

- gpt-image-2 renders an illustration in ≈ 17-23 s (low/medium) **[P]**. Labels are **never baked into pixels**;
  they are SVG overlays from the kit (llm-game-generation §6, tech-and-market §4) **[P]**.
- Motion comes from code: Ken Burns pan and zoom, a parallax split into 2-3 layers (background, subject cutout
  via transparent output or MIT `rembg`, labels), plus scene@1 `pulse`/`trace` over the still.
- 2-4 keyframes come from image **edit** of the base ("same character … frame i of n"), the OpenGame I2I
  path **[P]**.
- This is the replacement for every "motion is the content" sora use (monsoon clouds, a seed). The motion is
  schematic, but the labels are right.
- Untested: `gpt-image-2.5-flare`/`-sunburst` speed and edit consistency **[U]**.

---

## 4. Latency and cost table (30 s of finished content unless stated)

| lane | time to first playable (P50) | marginal cost | interactive | text/number fidelity | Hindi script | validation | status |
|---|---|---|---|---|---|---|---|
| **sora-2 clips** | 4 s clip 53 s; 30 s ≈ 3-5 min (≥ 3 jobs, 2 in flight) | **$3.20** (32 s billed) | no | **wrong labels and digits** [M] | **misspelled** [M] | pixels only: OCR plus VLM plus human | **retires 2026-10-15** [V] |
| **Manim live** (LLM → render → MP4) | ≈ 30-45 s first pass (gen 19-40 s + render 4-6 s @480p + TTS ≈ 1 s parallel + upload); ≈ 55 s with one repair [M+I] | luna $0.004 / codex $0.06 per attempt + TTS ≈ $0.008 + compute $0.0003 | no | exact (text is code) | exact with fonts [M] | render, duration, bbox lint, VLM critic | measured; library lane |
| **explainer@1 performed** (client renders scene@1 timelines; teacher speaks) | template ≈ 3-4 s; free-form ≈ 12-18 s (fast/brain strict) [P] + validator ms; runs while the teacher's preamble plays | ≈ $0.001-0.01 model; voice is the live session's own audio | **yes** (pause, tap, cue, telemetry) | exact | exact (browser shaping) | scene@1 lint S1-S7 + solver (ms) [P] | **recommended (1)** |
| **explainer@1 clip** (same doc + per-segment TTS) | above + ≈ 1-1.5 s TTS | + ≈ $0.008 TTS per 30 s [I: $0.015/min] | yes (it is still a scene) | exact | exact | + audio duration gate | for replay and B1 |
| **explainer@1 → MP4** (seek renderer) | 30 s @720p30 in 30 s on 1 page [M]; ≈ 8-10 s on 4 pages [I] | ≈ 30 vCPU-s ≈ $0.001 | no | exact | exact | frame-hash determinism, duration | library, share |
| **chapter video** (5 min, mixed segments) | 10-20 min wall [I from Code2Video 8.8-13.8 min] + human review | ≈ $0.2 (luna coder) to ≈ $1.5 (codex coder + brain planner + VLM critic) [I] + TTS $0.08 + render ≈ $0.02 | no (MP4) | exact | exact | full gate set (§7) + two-key review | **recommended (2)** |
| **live cue animation** (scene already loaded) | ≤ 1 frame after the cue fires; T1 spec 1-3 s if new [P] | 0 | yes | exact | exact | timeline lint (exists) | **recommended (3)** |
| Remotion | not measured [U] | $0.01/render, ≥ $100/month (> 3 employees) [V] | no (Player is interactive, but a second runtime) | exact | exact | own | not adopted |
| Revideo / Motion Canvas | not measured [U] | MIT, compute only | no | exact | exact | own | hold |
| Lottie playback | 0 (curated) | 0 | limited (state machines) | n/a | n/a | licence check | rewards only |
| still + motion | ≈ 20-25 s per new image (pre-generate) [P] | ≈ $0.05 per medium image [P] | yes (inside scene@1) | labels as overlays | exact | image safety + overlay lint | library + scene background |

Per-child economics (Conductor C7/C8 **[P]**):
- An in-lesson explainer is ≈ $0.01, about one third of a percent of the $3.1 monthly revenue line, so even
  20 per month are affordable.
- A chapter video is amortised across every child who studies that chapter.
- A sora 30 s clip per child per lesson would cost more than the whole subscription.

---

## 5. Which lane for which use case

| use case | primary | fallback 1 | fallback 2 | never |
|---|---|---|---|---|
| **(1) 20-60 s concept explainer during a lesson** | `explainer@1` **performed** by the live teacher (template-first; free-form if no template fits) | library explainer or Manim clip for that objective (pre-rendered, reviewed) | the T0/T1 engine with Director cues (no explainer) | live sora; live free-form Manim shown unreviewed to a child |
| **(2) pre-rendered chapter video** | offline storyboard pipeline: segments in `manim` / `explainer` / `still` lanes → MP4 + captions, two-key review | explainer@1-only chapter (all segments in scene@1, exported) | narrated slides (stills + overlays) | sora; Remotion as a second scene language |
| **(3) live animation synced to speech** | scene@1 timelines + `cue`, armed by the Director, fired on the playback clock (GSAP runtime) | fire at `audio_start`, hold to `audio_end` | static highlight (`highlight{target}`) | the voice model calling animation tools mid-utterance (audio-to-face §6.1 rule: the Director already knows the move) |

**Why "performed" beats "clip" for (1) [I, grounded in learning-science and prior decisions]:**
- **Voice identity.** The product is "an exactly-human teacher". A clip narrated by a different TTS voice in the
  middle of her lesson breaks the illusion. This is the same failure Meera's TTS showed by ear (voices-hindi
  §0.3) **[P]**.
- **Interruptibility.** The child can say "ruko, samajh nahi aaya" at beat 3. The Director pauses the timeline at
  that beat and knows *which beat* confused the child. That is a learner-model signal a video cannot give.
- **Temporal contiguity** (the narration and the matching motion happen together) is enforced by `cue`, not
  hoped for (genui-reliability §5.4 **[P]**).
- **It costs nothing extra.** The teacher's audio is already being paid for.

Clip mode remains for: replay from the notebook, B1 children who should rest from the teacher's voice, offline
(Capacitor), and parent sharing (MP4 via WhatsApp).

---

## 6. Architecture: one IR, three renderers

```
                          ┌──────────── Director (live) / Forge (offline) ────────────┐
 brief (objective, MC ids,│ luna/sol structured output (template slots or free-form)  │
 band, lang, skin, kit)──►│ → explainer@1 JSON ──► validate (scene@1 lint + beat lint)│
                          └───────────────┬───────────────────────────────────────────┘
                                          │ same document
        ┌─────────────────────────────────┼──────────────────────────────────┐
        ▼                                 ▼                                  ▼
 (a) frame runtime (app)         (b) seek renderer (ACA job)        (c) manim backend (ACA job)
 scene@1 + GSAP, cue-driven      Chromium: tl.seek(i/fps) → JPEG     explainer seg ─► TaxilaScene .py
 performed or clip mode          → ffmpeg + TTS track → MP4 + VTT     (LLM or IR→code) → MP4 + VTT
 telemetry: beat, pause, tap     library / share / offline           precise maths segments only
```

### 6.1 Contracts (proposed additions to `shared/contracts.ts`)

```ts
// explainer@1 — a narrated sequence over ONE scene@1 document. No pixels, no code.
export interface ExplainerDoc {
  dsl: "explainer@1";
  meta: { objective_ids: string[]; misconceptions: string[]; band: "B1" | "B2" | "B3" | "B4";
          lang: "hi" | "hi-Latn" | "en" | "mix"; skin?: string; kit_ref: string; template?: string };
  scene: SceneDoc;                         // scene@1 (genui-scene-dsl.mjs); its timelines carry the motion
  surface: "canvas" | "board";             // board = chalk tokens + `trace` strokes (whiteboard mode)
  segments: NarrationSeg[];                // 3–8 segments; Σ est_s ∈ [20, 60]
  beats: Beat[];                           // ≤ 24; each plays one scene timeline (or a labelled sub-range)
  checks?: { probe_after?: string };       // optional scene@1 probe the teacher asks after the last beat
}
export interface NarrationSeg {
  id: string;
  say: L10n;                               // what the teacher conveys: shape, ≤ 25 words (decisions.md brevity)
  terms: string[];                         // cue-match terms in BOTH scripts, e.g. ["तीन-चौथाई","teen bata chaar","3/4"]
  est_s: number;                           // planner estimate; replaced by measured audio_s
  must_say?: string[];                     // kit terms the teacher must utter (checked on the transcript)
}
export type BeatAt =
  | { kind: "seg_start" } | { kind: "seg_end" }
  | { kind: "term"; term: string }         // fires when the term is spoken (word timestamps / transcript offset)
  | { kind: "offset"; ms: number };        // ms after seg_start (clip mode only)
export interface Beat { id: string; seg: string; at: BeatAt; timeline: string; label?: string;
                        hold_ms?: number /* min dwell before the next beat */ }

// Timing resolved per render. Audio-first: animation stretches to the voice, never the reverse.
export interface TimingTrack {
  seg: string; audio_s: number;
  source: "azure-wordboundary" | "azure-bookmark" | "segment-only" | "live-transcript" | "live-audio-events";
  words?: { text: string; t0_ms: number; t1_ms: number; text_offset: number }[];
}

// Forge job for time-based media (rides the Forge harness, coding-agent-harnesses §5).
export interface MediaJob {
  kind: "explainer" | "explainer_mp4" | "manim_segment" | "chapter_video";
  key: string;                             // hash(objective, template|spec, model, style_version, voice) → cache
  brief: ExplainerBrief | ChapterBrief;
  budget: { usd: number; wall_s: number; repair_rounds: number };
  lane_hint?: "explainer" | "manim" | "still";
}
export interface MediaArtifact {
  key: string; kind: MediaJob["kind"]; doc?: ExplainerDoc;
  mp4?: { blob: string; w: number; h: number; fps: number; dur_s: number; sha256: string };
  vtt?: string; timing: TimingTrack[]; gates: GateResult[];
  review: { content_key?: string; pedagogy_key?: string; at?: string };  // two-key, genui-reliability §7.5
}

// Telemetry (frame → host → learner model), same postMessage bridge as modules.
export type ExplainerEvent =
  | { e: "beat"; beat: string; t_ms: number } | { e: "pause"; beat: string; by: "child" | "teacher" | "interrupt" }
  | { e: "replay"; from_beat: string } | { e: "tap"; target: string; beat: string } | { e: "done"; dwell_ms: number };
```

### 6.2 Template-first generation (the 3-second path)

Explainer templates are code that expands a few slots into a full `explainer@1`, like scene@1's T2a
(genui-reliability §5.7). The model fills about 10-20 slots in ≈ 3 s **[P: T2a p50 3.08 s]**. A first set,
chosen by the misconceptions the kits already name:

| template | shape | example objectives |
|---|---|---|
| `partition-equal@1` | whole → cut into n (equal vs unequal contrast) → shade k → symbol k/n | fractions B1-B3 |
| `build-up-count@1` | groups appear one by one → regroup → numeral → expanded form | place value, multiplication as repeated addition |
| `measure-compare@1` | two objects → unit tiles → count both → compare → name the attribute | area vs perimeter, length, mass |
| `process-sequence@1` | 3-6 stages on a path, each with a cause arrow | germination, water cycle, digestion |
| `cause-effect-slider@1` | one variable animates through 3 values, the readout follows | shadows, evaporation, speed |
| `ray-geometry@1` | object, mirror or lens, normal, ray, angle arcs, equal-angle reveal | reflection, angles |
| `rearrange-proof@1` | parts move and tile a target (corners → straight line) | angle sum, area by cut-and-move |

`rearrange-proof@1` exists precisely because of the codex triangle failure (§2.2). Its template code computes
the target tiling, so the model only chooses colours and words.

### 6.3 Free-form path

When no template fits, brain writes the full `explainer@1` with strict structured output. The expected cost is
the T2b numbers: p50 ≈ 12-18 s, and ≈ 6-7/8 lint-clean after one repair **[P]**. The Director needs a cover
move for that wait (the teacher asks a predict question first). If the deadline passes, fall back to the T1
engine with cues.

### 6.4 Timing resolution (audio-first)

1. **Performed mode.** For each segment the Director sends the next teacher turn with the segment's shape
   (`say`, `must_say`, ≤ 25 words, the brevity rule last). The client starts `seg_start` beats on that
   response's `output_audio_buffer.started`. `term` beats fire from, best first:
   - Voice Live word timestamps;
   - the transcript delta offset × measured chars/s, only if the transcript leads playback by ≥ 150 ms (E-8);
   - otherwise they collapse to `seg_start` + `hold_ms` (the ui-teardown §4.3 ladder).

   `seg_end` fires on `output_audio_buffer.stopped`. If a must-say term never appears in the transcript, the
   beat still plays at segment end (motion never waits on the voice model's wording) and the miss is logged.
2. **Clip mode and MP4.** Synthesise each segment separately (in parallel); `audio_s` is exact (§2.4). Then:
   - Azure Speech voices: take `WordBoundary` events (SDK) or batch `word.json` and place `term` beats exactly
     (`manim-voiceover`'s interpolation, §3.6).
   - `gpt-4o-mini-tts`: place `term` beats by character offset (±10%), or author them as `seg_start`.

   Each segment's timeline is time-scaled to `audio_s` (`tl.timeScale(dur/audio_s)`), clamped to
   0.8-1.25×. Outside that range the segment fails the duration gate and is regenerated with new `est_s`.
3. **Manim backend.** The generated scene uses the probe's segment contract (each segment's run_time + waits
   = `NARRATION[i].seconds`, 10/10 compliant **[M]**). Seconds are set to the measured `audio_s` *before*
   generation, so no stretching is needed.

---

## 7. Pipelines

### 7.1 P1: the in-lesson explainer (live, fast lane)

```
t=0     Director decides "explain" (misconception MC.FRAC.UNEQUAL detected, or the child asks "kyun?")
        ├─ teacher preamble turn starts ("chalo, ek roti lete hain…")  ← covers generation
        └─ forge.explainer request {objective, MC, band, lang, skin, template?}
t≈0.3s  cache lookup key = hash(objective, template, slots-skeleton, style_v)  → hit: go to t≈3.5
t≈3s    luna fills template slots (strict schema)         [P: 3.08 s p50]   | free-form brain ≈12–18 s
t≈3.1s  expand → explainer@1 → lint S1–S7 + beat lint + solver (ms) → autofix → (fail: 1 repair, else fallback)
t≈3.3s  push doc to frame (postMessage `init`), preload sprites
t≈3.5s  Director begins segment 1 turn; frame plays beats on cues
...     child interrupts → tl.pause() at the frame; Director handles; resume from beat start or skip
end     probe_after (optional) → teacher asks; telemetry {beats, pauses, taps, dwell} → learner model
async   if the doc was new: enqueue explainer_mp4 job (seek render + TTS) for the notebook replay
```

Budgets: generation ≤ 4 s on the template path and ≤ 18 s free-form, with a hard deadline of 20 s (then use
the T1 engine). Validation stays under 50 ms. Zero pixels are generated live.

Cost: ≤ $0.01 per explainer.

Who checks it: templates are reviewed once; filled slots are lint-checked and kit-sourced. A free-form
explainer is shown live only if it is lint-clean and every number and label traces to the kit (genui
router rule). Otherwise the child gets the fallback.

### 7.2 P2: the chapter video (offline, ACA job)

```
ChapterBrief {chapter, objectives[], misconceptions[], band, lang, length_target 180–480 s, style_v}
 1 Planner (taxila-brain, strict)  → Storyboard: 6–16 segments {id, goal, lane, say(L10n), terms, visual brief,
                                     kit refs, est_s}. Lint: every claim ↔ kit fact; one idea per segment;
                                     ≤ 25 words/segment for B1–B2; worked examples follow concreteness fading
 2 Voice (Azure TTS batch, wordBoundaryEnabled) → per segment audio + word.json → TimingTrack (exact)
   └─ voice = the teacher's chosen Azure voice; lexicon for NCERT terms (voices-hindi custom lexicon)
 3 Per-segment build, in parallel (one ACA job per segment, egress denied, 2 vCPU):
     lane explainer → luna/brain → explainer@1 (template-first) → seek render 1080p30
     lane manim     → codex or luna → TaxilaScene subclass (NARRATION seconds = audio_s) → manim -qh
     lane still     → gpt-image-2 (cached by topic×style) → still+motion explainer@1 (overlays) → seek render
 4 Gates per segment (§7.3), repair ≤ 3 rounds (scope-guided: fixer catalogue → line → block → regenerate)
 5 VLM critic (taxila-brain vision, 6 frames/segment + anchor grid overlay, Code2Video's visual anchors)
   → layout + "does the frame show the claim?" → targeted repair
 6 Assemble: ffmpeg concat + audio (loudnorm −16 LUFS) + burnt-in nothing; captions WebVTT from words;
   chapter markers from segments; poster frame; 1080p30 H.264 + 480p fallback rendition
 7 Two-key review (content + pedagogy) in the review UI; segment-level reject → regenerate that segment only
 8 Library: MediaArtifact keyed by (chapter, objectives, style_v, voice, model); skins re-render text only
```

Wall time: 10-20 min, dominated by step 3 (parallel) and the critic rounds **[I]**. Code2Video reports 5.6×
speedup from parallelising scenes **[S]**.

Model spend for 10 segments:
- planner ≈ 15k out on brain ≈ $0.30;
- coders 10 × 4k (luna $0.05 / codex $0.56);
- repairs about +30%;
- critic 60 frames ≈ $0.15;
- TTS 5 min ≈ $0.08;
- render ≈ $0.02.

Total: **≈ $0.6 (luna coders) to ≈ $1.3 (codex coders)** **[I]**. Cheaper than TheoremExplainAgent's o3-mini
$1.16 for a shorter target and far below sora ($30).

### 7.3 Gates for time-based media (extends `auto-validation-qa.md` §9, animation and video rows)

| gate | explainer@1 | manim segment | MP4 (any) |
|---|---|---|---|
| G-schema / lint | scene@1 S1-S7 + beat lint: every `beat.timeline` exists, `term` ∈ `segments[seg].terms`, Σ est_s ∈ [20, 60], ≤ 24 beats, no `context` node animates | AST lint: one Scene subclass of `TaxilaScene`; allowed imports; no file or network; no Tex unless the formula whitelist allows it | — |
| G-fixers (deterministic, before any model) | v1.x autofix (exists) | catalogue starts with `AnnularSector(outer_radius=)` → `Annulus`/`Sector` rewrite [M: 2/5 codex failures]; Tex → Text; `DecimalNumber` → Text | — |
| G-render | frame boots, every timeline compiles to a GSAP timeline | `manim -ql` exit 0 in ≤ 60 s | ffprobe: codec, dimensions, fps, no black/frozen run > 2 s (ffmpeg `blackdetect`/`freezedetect`) |
| G-duration | each segment's time scale within 0.8-1.25× of `audio_s` | per segment `video_s` = Σ planned seconds ± 0.15 s [M: 10/10] | total = Σ `audio_s` ± 0.3 s; A/V drift < 40 ms |
| **G-layout (scene graph, not pixels)** | scene@1 S3 overlap and off-stage on real font metrics (exists) | **`TaxilaScene` instruments `play`/`wait`: at each segment end it collects the bounding boxes of all `Text`/`MathTex` and labelled shapes, fails on text∩text > 0, text∩unrelated-shape > 15% of label area, or any box outside x∈[−6.5, 6.5], y∈[−3.6, 3.6]** | — |
| **G-geometry claims** | template invariants (e.g. `rearrange-proof` tiles exactly) | for claims tagged in the storyboard (`angles_sum`, `equal_parts`, `equal_angles`), the scene exposes its final mobjects and a checker verifies them numerically (sector angles sum 180° ± 1°, areas equal ± 1%, angle(ray, normal) equal ± 0.5°) | — |
| G-text truth | all strings are kit-sourced or lint-checked; Hindi via a font present in the frame | all `Text` strings ∈ the storyboard's strings | OCR on keyframes (Azure Vision Read) must match the storyboard strings (Devanagari included) |
| G-safety | Content Safety on every string | same | Content Safety on 1 frame/s; no flashes > 3/s (WCAG 2.3.1) via luminance diff; reduced-motion variant exists |
| G-critic | — (live path has none) | VLM on 6 frames with anchor grid: layout, "frame shows the claim" | — |
| G-human | templates once | two-key per chapter | two-key |

The geometry gate is what would have caught codex's triangle-sum scene. The layout gate would have caught
6/10 of today's collisions before any model or human looked **[I, from the observed boxes]**.

### 7.4 P3: live cue-synced animation (no generation)

- The engine or scene is already mounted (T0/T1/T2). The Director's move carries
  `ui.cues[{when, match, act: "play"|"highlight"|"point", target}]` (ui-teardown §4.3 extended with `act: "play"`
  → host `cue{id}`/`play{timeline}`).
- The client fires cues on the **playback clock**, never on the model's improvisation. Gaze leads the pointer by
  about 200 ms.
- On barge-in: `tl.pause()`. On resume: `tl.tweenTo(beatStartLabel)`.
- Reduced motion: every step jumps to its end state.
- Telemetry: `cue_fired{lag_ms}` against `audio_start`. This gives the sync error distribution per source,
  the measurement that decides whether `term` cues are viable on lane A.

---

## 8. Prompt structure (shapes, not lines)

The inherited law applies: sentence-shaped text in a prompt gets recited, and position is mechanism. The
explainer and Manim prompts therefore carry structure and limits, never example narration.

**explainer@1 template fill (luna, strict schema):**
- `instructions`:
  - role (one line);
  - output = the template's slot schema only;
  - band limits (words per segment from scene@1 `BANDS`, choices, type sizes);
  - language rule (`say` in L10n with `hi` Devanagari and `hi_latn` Roman Hinglish; NCERT term spellings from
    the kit glossary);
  - the misconception to confront (by id plus its kit description);
  - "every number and label must come from `kit_facts`";
  - **last line:** the hard limits (≤ 25 words per segment, Σ seconds 20-60).
- `input`: JSON `{objective, kit_facts[], misconception, band, lang, skin, template_id}`.
  No prose examples of narration.

**Manim segment coder (library lane):**
- `instructions`:
  - the probe's contract (§2.2): one `TaxilaScene` subclass, Text only (or the formula whitelist);
  - `NARRATION` seconds fixed to the given `audio_s`;
  - font ≥ 32 and ≤ 6 words per Text;
  - the safe frame;
  - use `self.place_label(...)` (the base class's collision-aware placer) instead of `next_to` for callouts;
  - `self.claim(kind, mobjects)` for every tagged claim (feeds G-geometry);
  - the allowed-API list (a version-pinned Manim 0.21 subset: the RAG idea from TheoremExplainAgent, but
    pinned and short);
  - **last:** "output exactly one python block".
- Repair turns carry the traceback tail (as in the probe), or the gate's JSON finding (`{gate:"layout",
  overlaps:[["lbl_3/4","lbl_not_equal"]], segment:4}`), never a prose critique.

**Planner (brain):**
- output = Storyboard schema;
- the curriculum facts and the misconception list come in as data;
- learning-science constraints as rules: one idea per segment, concreteness fading, no decorative motion,
  predict-before-reveal probes between segments, a worked-example pairing for maths;
- the lane choice rule as data (`manim` only if a precise geometric or graph claim is present).

---

## 9. Child safety specifics for time-based media

- **No generated pixels of people on the live path.** Explainers use the sprite library (`people.child`,
  `people.farmer` in scene@1) **[P]**. Sora's willingness to draw a 9-year-old **[M]** is one more reason not to
  depend on it.
- **Audio is ours.** Every soundtrack is our TTS plus ZzFX/procedural sound. Generated soundtracks (sora's AAC
  track **[M]**) never ship.
- **Seductive details are removed by rule**, not by taste. `context` nodes never animate; there is no
  background motion, and music is off by default for anxious profiles (llm-game-generation §6).
- **Photosensitivity:** a luminance-flash gate (≤ 3 flashes/s) on every MP4 and timeline. `pulse` is the only
  attention effect.
- **No autoplay chains** (day-cycle: "never queue another" **[P]**). Clip mode ends on a still with the teacher's
  question.
- **Captions on by default for B1-B2** (WebVTT from word boundaries), in the script the child reads.

---

## 10. Risks, unknowns and the next measurements (in order)

| # | measurement | decides | method |
|---|---|---|---|
| V-1 | **Pin `gpt-4o-mini-tts` to 2025-12-15** and confirm this resource's version | the narration lane survives 2026-10-15 | Foundry deployment view / Models API `lifecycleStatus` |
| V-2 | explainer@1 template fill: 7 templates × 10 briefs, first-pass lint-clean and p50/p90 latency on luna | the 3-4 s claim for (1) | port `genui-bench.mjs` |
| V-3 | **Performed-mode sync error** on gpt-realtime-2.1 (lane A) vs Voice Live (lane B): `cue_fired.lag_ms` for `seg_start` and `term` beats, n ≥ 100 cues | whether `term` beats are allowed on lane A (E-8 in audio-to-face) | in-app telemetry on 5 scripted lessons |
| V-4 | Manim `TaxilaScene` with layout and geometry gates: rerun today's 10 concepts + 20 new ones; count collisions caught vs a human second rater | G-layout precision/recall; luna vs codex | extend `manim-probe.mjs` |
| V-5 | Seek renderer chunked across 4 pages at 1080p30; frame-hash determinism across 3 runs | export throughput and determinism | extend `gsap-render-probe.mjs` |
| V-6 | Azure Speech `WordBoundary` on hi-IN and en-IN voices for Hinglish in Roman and Devanagari: are boundaries per word and offsets monotonic? | `term` beat placement in clip mode | Speech SDK JS in Node, 20 sentences |
| V-7 | Blind preference, teachers and children (n ≥ 10): performed explainer vs clip vs Manim clip of the same objective | (1) primary; Revideo reversal | review UI A/B |
| V-8 | Retention micro-RCT: explainer vs no explainer on one misconception (delayed probe) | whether explainers earn their minutes | Conductor rule 37 shape |
| V-9 | gpt-image-2.5-flare/-sunburst latency and edit consistency for still + motion keyframes | `still` lane speed | 10 images × 3 edits |
| V-10 | GSAP licence one-liner with counsel ("Forge is not a no-code builder offered to users") | keep GSAP | — |

Known risks:
- Free-form explainers may be lint-clean but pedagogically weak (genui-reliability §6.4). Templates cover the
  common misconceptions first.
- The live path's 12-18 s free-form wait needs a teacher cover move; if it happens often, more templates are
  needed.
- Manim visual style drifts from the app's identity unless `TaxilaScene` owns colours, fonts and the board
  surface.
- Chapter-video review load is a staffing question. Code2Video's human study shows generated videos
  still trail professional tutorials (64.0 vs 97.1 TeachQuiz) **[S]**.

---

## 11. Proposed `context/` entries (for the main loop to merge)

- **decision `forge-video-lanes`** (2026-10-02):
  - No pixel-video lane. Time-based media is `explainer@1` (scene@1 timelines + narration beats) with three
    renderers: frame runtime, seek renderer → MP4, and Manim for precise-maths segments.
  - In-lesson explainers are **performed** by the live teacher.
  - Chapter videos are offline, per topic, and two-key reviewed.
  - Rationale: §0. **Reverse if:** a GA first-party Azure video model with ≥ 12-month lifecycle passes the
    20-clip label/number/Devanagari/permanence check (≥ 95%), *and* V-7 shows children prefer it.
- **rejection `sora-for-curriculum`:**
  - Tried: 7 clips (4 here + 3 sibling).
  - What broke: wrong number-line digits, misspelled Devanagari, object permanence, 49-118 s per 4-8 s clip,
    $0.10/s, 2 concurrent jobs, unrequested soundtrack.
  - Retirement 2026-10-15 with no replacement.
  - `supersedes` the `taxila-sora` lane in `decisions.md:63` and `orchestration-architecture` §5.3 `forge.video`.
- **conflict note for the main loop:** `multimodal-orchestration` MO9 (video hook via taxila-sora) must be
  amended, because sora-2 2025-12-08 retires on 2026-10-15 with no replacement. Either archive reviewed hooks
  before that date, or route `video` → `still` + motion.
- **rejection `remotion-second-scene-language`:** a second IR plus a fee for > 3 employees; reverse if
  compositing is needed.
- **measurement `manim-llm-render-2026-10-02`:**
  - n = 10 (5 concepts × codex, luna), Manim 0.21, 480p15.
  - First-try render 8/10, ≤ 1 repair 10/10.
  - Collisions 6/10, maths wrong 1/10, duration match 10/10.
  - Gen 19-40 s, render 4-6 s (720p30 ≈ 10 s, 1080p60 ≈ 30 s).
  - Method: `factory/manim-probe.mjs`.
- **measurement `sora2-azure-2026-10-02`:** server time 4 s: 49-79 s (n = 5); 8 s: 87-118 s (n = 2); method
  `factory/video-probe.mjs` + `content/animation-video-sora-probe.mjs`.
- **measurement `seek-render-2026-10-02`:** GSAP timeline → MP4 at 720p30 = 1.00× real time on 1 Chromium page,
  31.7 ms per frame; `factory/gsap-render-probe.mjs`.
- **measurement `tts-segment-timing-2026-10-02`:** gpt-4o-mini-tts, 6 Hinglish segments: 0.81-1.11 s each,
  10.9 ± 1.1 chars/s; `factory/tts-segment-probe.mjs`.
- **decision `forge-image-fonts`:** the Forge and render images include `fonts-noto-core` (Noto Sans/Serif
  Devanagari). Measured: correct conjunct shaping in Manim/Pango. Reverse: never; it is a correctness
  requirement.
- **inbox note:** pin `gpt-4o-mini-tts` 2025-12-15 before 2026-10-15.

---

## Sources

Azure and OpenAI (fetched 2026-10-02):
- Sora 2 video generation overview (preview), Microsoft Learn, updated 2026-06-05: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation
- Model retirement schedule, Microsoft Foundry, updated 2026-09-23: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule
- Foundry Models lifecycle and support policy: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirements
- Sora 2 in Azure AI Foundry (pricing $0.10/s, 2025-10-15): https://azure.microsoft.com/en-us/blog/sora-2-now-available-in-azure-ai-foundry/
- OpenAI deprecations (Videos API removal 2026-09-24): https://developers.openai.com/api/docs/deprecations, and https://heydev.us/blog/openai-model-shutdowns-september-2026-audit-your-app
- Speech synthesis events (WordBoundary, VisemeReceived, BookmarkReached; SDK only): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis
- Batch synthesis properties (wordBoundaryEnabled, latency): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-synthesis-properties

Papers:
- Ku et al., TheoremExplainAgent, arXiv 2502.19400 (abs and HTML); code (MIT): https://github.com/TIGER-AI-Lab/TheoremExplainAgent
- Chen, Lin, Shou, Code2Video, arXiv 2510.01174 (abs and HTML); code (MIT): https://github.com/showlab/Code2Video
- Wang et al., TeachMaster, arXiv 2601.04204
- PhysicsSolutionAgent, arXiv 2601.13453; ANVIL, arXiv 2605.16295; LASEV, arXiv 2602.11790; DATAREEL, arXiv 2604.25220 (arXiv search listings)
- Yang et al., OmniLottie, arXiv 2603.02138 (CVPR 2026, CC BY-NC-ND); LottieGPT, arXiv 2604.11792
- ALGOGEN 2605.12159, SGA 2607.18116, ManiBench 2603.13251, LLM2Manim 2604.05266, Manim SFT/GRPO 2604.18364: cited via `content/genui-reliability.md`

Tools:
- Remotion license (raw LICENSE.md) and pricing: https://raw.githubusercontent.com/remotion-dev/remotion/main/LICENSE.md, https://www.remotion.pro/license
- Remotion: https://www.remotion.dev/docs/ai/, https://www.remotion.dev/docs/performance, https://github.com/remotion-dev/skills
- Motion Canvas: https://github.com/motion-canvas/motion-canvas; Revideo: https://github.com/redotvideo/revideo
- GSAP licensing: https://gsap.com/licensing/
- vivus: https://github.com/maxwellito/vivus
- manim-voiceover 0.4.0 source (MIT; `tracker.py`, `services/azure.py`, read from the PyPI wheel): https://github.com/ManimCommunity/manim-voiceover

Repo:
- `factory/llm-game-generation.md`, `factory/auto-validation-qa.md`, `factory/coding-agent-harnesses.md`, `factory/sandboxes-per-student.md`
- `content/genui-reliability.md`, `content/genui-scene-dsl.mjs`, `content/animation-video-sora-probe-2026-10-02.json`
- `design/ui-teardown.md`, `avatar/audio-to-face-ml.md`, `voice/voices-hindi.md`, `conductor/orchestration-architecture.md`, `conductor/day-cycle.md`, `tech-and-market.md`

Probe artefacts (this workstream), all in `docs/research/factory/`:
- `video-probe.mjs`
- `manim-probe.mjs`
- `gsap-render-probe.mjs`
- `tts-segment-probe.mjs`
- `video-probe-2026-10-02/` (Sora results and contact sheets; Manim code and contact sheets)
- `manim-probe-2026-10-02.json`
- `gsap-render-probe-2026-10-02.json`
- `tts-segment-probe-2026-10-02.json`
