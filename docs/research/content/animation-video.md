# Animation and video for Taxila: what to generate live, what to pre-render, what it costs

**Date:** 2026-10-02 · **Question:** explainer animation and video for children (classes 1-9). The options are LLM → Manim / Motion Canvas / Remotion / GSAP timelines / Lottie; Khan-style whiteboard; sora-2 on Azure (cost, latency, child safety, accuracy failures); Veo and others for reference; pre-rendered vs live. **Output:** what to generate live, what to pre-render per chapter, cost per minute, and the pipeline, written as implementable specs.

**Artefacts in this folder (all runnable from the repo root):**

| file | what it is |
|---|---|
| `explainer-dsl.mjs` | the `explainer@1` DSL: zod schema, 6×6 anchor grid, 8 template expanders, lint E1-E12, state simulator and checks, compiler to a flat render plan |
| `explainer-bench.mjs` → `explainer-bench-2026-10-02.json` | live-path generation bench: 8 real curriculum topics, template arm vs free-form arm, on Azure |
| `explainer-render.mjs` → `explainer-render-2026-10-02.json` | pre-render path end to end: Azure TTS with bookmarks, GSAP player, Playwright frame capture, ffmpeg |
| `animation-video-sora-probe.mjs` → `animation-video-sora-probe-2026-10-02.json` | `taxila-sora` liveness, latency and accuracy probe (3 clips, with my frame review) |

**Evidence tags:**
- **[V]** verified today against a primary source.
- **[S]** secondary source.
- **[X]** measured here (n and method given).
- **[K]** known literature: the citation was verified via Crossref today, but the paywalled text was not re-read, so the numbers come from memory.
- **[U]** an estimate or inference.

**Method and limits.** This session's shared web-search budget was used up before this question began. Sources here come from direct fetches instead: the arXiv API, Microsoft Learn, the Azure pricing pages (`data-amount` attributes), OpenAI's deprecations page, the GSAP and Remotion licences, Google's pricing page, NotebookLM help, Crossref, and the Guo 2014 PDF. OpenAlex and Semantic Scholar rate-limited this IP, and ScienceDirect returned 403. All three measurements are small (n = 3 clips, 8 briefs × 5 arms, and 1 render). They are enough to pick a direction, not to publish.

---

## 0. TL;DR (the findings that change decisions)

1. **Generated video must not carry facts.** I measured `taxila-sora` on three classic classroom scenes [X, n=3]:
   - **Count (Class 1):** it drew 3 + 3 apples, merged them into 6, and wrote "3 + 4 = 7" above them in perfect chalk.
   - **Seed (germination):** the root grew down correctly, but the leaves opened *underground*.
   - **Shadow:** correct.

   The literature points the same way. In Code2Video's head-to-head, Veo3 scored **2.5** on TeachQuiz against **86.0** for agentic Manim code [V]. PhysicsLENS (2026-10-01) found that **34 of 47** plausible-looking videos ignore the physical property the prompt asked for [V]. **Rule (extends tech-and-market §4): if correctness matters, the motion is code. Video is only for mood and the real world.**
2. **Sora 2 is on borrowed time.** OpenAI removed `sora-2`, `sora-2-pro` and the Videos API from its API on **2026-09-24** and named no replacement [V]. Azure still served `taxila-sora` on 2026-10-02, but it is a preview with no retirement date [V]. My three runs all completed in **51-57 s per 4 s 720p clip**, at **$0.10/s** [V price, X latency]. Treat it as a library-only B-roll lane that can disappear. Download every clip within 24 h, because Azure jobs expire [V].
3. **Live animation = `explainer@1` templates rendered by a GSAP player in the sandbox frame.** The model picks one of 8 templates and fills its slots plus one note per beat. Code computes every count, coordinate, angle and shadow.
   - Template arm: **8/8 valid at p50 2.9 s, max 3.5 s** on `taxila-fast` with no reasoning, about $0.0007 per explainer.
   - Free-form explainers: **3/8 at p50 13.6 s** on `taxila-fast`, and **2/8 at p50 29.7 s** on `taxila-brain` [X].

   This replicates the genui bench (template expansion 6-7/8, free scene composition 0-3/8) for animation.
4. **Pre-rendering is the same DSL, captured.**
   - Azure Speech made 30 s of Hindi narration in 1.9 s, with one SSML `<bookmark>` per beat, which gives exact beat sync and word timings for karaoke captions [X].
   - Playwright with GSAP frame-seek captured at **1.49× realtime on 4 vCPU** [X].
   - All-in cost is **about $0.01 per finished minute**. That is 600× cheaper than raw Sora footage and 1,800× cheaper per *usable* minute [X/U].
5. **Ship the DSL, not the video.** The explainer JSON plus Opus narration comes to **0.12 MB/min**, against **0.48 MB/min** for the MP4 of the same explainer [X]. Sora 720p clips average 2-3 Mbps (about 18 MB/min) [X]. MP4 is only for sharing (the parent's WhatsApp recap) and for lite-tier devices.
6. **Khan-style whiteboard is a style plus two verbs, not a separate product.** `draw` reveals strokes and `write` wipes text in, on the chalkboard tokens from `visual-identity.md`. Guo et al. (6.9 M sessions) found tablet-drawing videos more engaging than slides [V]. Watching a diagram being drawn improved transfer over seeing it already drawn [K: Fiorella & Mayer 2016].
7. **No Remotion, no Motion Canvas, and Manim offline only.**
   - Remotion needs a paid company licence above 3 employees ($100/month minimum for automated rendering) [V]. Our player plus Playwright capture does the same job.
   - Motion Canvas is an editor-first TypeScript generator API, so it gains us nothing over the DSL.
   - Manim is the best LLM target for LaTeX-heavy Class 8-9 derivations (agentic render success about 94% [V]). It still needs critique loops (Code2Video: 13.8 min per video [V]), so it stays an optional Forge lane, measured before adoption.
   - Lottie and Rive are for hand-authored assets only (celebrations, the teacher avatar), never LLM-generated live.
8. **Live sync rule: one beat = one teacher turn.** A beat starts when that turn's first audio plays, and its end state holds while the child answers. This fits `voice-turn-config` (about 25 words per turn) with no mid-sentence timing problem. Beats pause on a probe, and the child can replay any beat.
9. **Devanagari must never be revealed character by character.** `[..."छाया"]` splits into `छ, ा, य, ा`, detaching the vowel signs [X]. `write` is always a left-to-right clip wipe.
10. **New lint, from a defect the lints missed.** In the rendered explainer, the merged group overlapped one dot. Pixel overlap is invisible to anchor-level lint, so add E13: bounding-box intersection on the compiled plan, the SGA idea [V], before the library ships.

---

## 1. What is already decided (read, not repeated)

| decision | where |
|---|---|
| T0 engines, T1 spec-fill live, T2 free-form only offline with review; images never in the live path (~23 s each) | `tech-and-market.md` §3-4; `measurements.md#infra-smoke` |
| Scene DSL `scene@1` with timelines (tween/show/hide/pulse/trace/count, ≤ 30 s, ≤ 60 steps); template expansion beats free composition | `genui-scene-dsl.mjs`; `genui-bench-2026-10-02.json` |
| Animations are code (SVG/Phaser tweens narrated by TTS), not video; "do not build on Sora 2" | `factory/llm-game-generation.md` §0.6, §6 |
| Video is library-level, never per child, never on the live path, human-reviewed; ≤ 60 s, only where motion is the content | `conductor/orchestration-architecture.md` C8; `conductor/day-cycle.md` §8 |
| Video ≤ 480p, ≤ 30 s, ≤ 400 kbps; data-saver mode drops video | `design/low-end-offline.md` §9 |
| Animation QA gates: boot, flashing / reduced motion, frame cost, duration ±10%, narration sync ≤ 300 ms, keyframe criteria | `factory/auto-validation-qa.md` §9 |
| Seductive details hurt; songs only for verbatim content; dual coding; concreteness fading; transient-information effect | `learning-science.md` §2.4 |

This document adds four things. It measures the Sora status instead of asserting it. It adds the animation-specific evidence. It specifies `explainer@1`, the narrated-animation layer the scene DSL lacks (narration-synced beats, verbs, checks, a 60-90 s length). And it supplies the pipeline and the cost per minute.

---

## 2. Learning science specific to animation (not in `learning-science.md`)

| finding | source | design rule here |
|---|---|---|
| Animation beats static pictures on average, but only when the animation *represents* the content. Decorational animation does nothing. The effect is largest for procedural-motor knowledge and for realistic depiction. Overall d ≈ 0.37 | Höffler & Leutner 2007, *Learning and Instruction* 17:722-738, doi 10.1016/j.learninstruc.2007.09.013 [K] | animate only when motion or change *is* the concept; E4 bans moving context |
| The meta-analytic average is small (g ≈ 0.23), with moderators (pacing, domain) | Berney & Bétrancourt 2016, *Computers & Education* 101:150-167, doi 10.1016/j.compedu.2016.06.005 [K] | expect modest gains; prove per template by micro-RCT (§11) |
| **Congruence** (the change shown must match the change meant) and **apprehension** (it must be slow and simple enough to perceive); many "animation wins" were confounded with extra information | Tversky, Morrison & Bétrancourt 2002, *IJHCS* 57:247-262, doi 10.1006/ijhc.2002.1017 [K] | ≤ 2 simultaneous movers (E3); one idea per beat; code-computed geometry (congruence cannot be left to a generator) |
| Learner-paced segments beat a continuous presentation for transfer | Mayer & Chandler 2001, *J. Ed. Psych.* 93:390-397, doi 10.1037/0022-0663.93.2.390 [K] | beats hold their end state; replay any beat; never autoplay a whole minute |
| A visual cue on the relevant element improved comprehension and transfer of an animation, for cued *and* uncued content | de Koning et al. 2007, *Applied Cognitive Psychology* 21:731-746, doi 10.1002/acp.1346 [V abstract] | `focus` dims the rest; `pulse` (≤ 3 Hz, E9) marks what the teacher names |
| Watching diagrams being drawn progressively improved transfer over already-drawn diagrams | Fiorella & Mayer 2016, *J. Ed. Psych.* 108:528-546 [K]; dynamic drawing in video lectures, Fiorella et al. 2019 (*JEP*, doi 10.1037/edu0000325) [K] | Khan-style `draw`/`write` verbs; the chalkboard style |
| Across 6.9 M edX sessions, median engagement topped out around 6 min. Khan-style tablet drawing was more engaging than slides, and fast, enthusiastic speech beat slow speech. These are **engagement, not learning, measures** | Guo, Kim & Rubin 2014, L@S, doi 10.1145/2556325.2566239 [V PDF] | explainers ≤ 60 s (B1-B2) / ≤ 90 s (B3-B4) (E7); the live teacher's natural pace |
| Children's TV (capacity model): narrative and educational content compete for working memory; learning is best when the lesson *is* the plot | Fisch, *Children's Learning From Educational Television*, ch. "The Capacity Model", doi 10.4324/9781410610553-18 [K] | story wrappers carry the concept (`story-panels`), never a parallel plot |

**What is not known:** no study tests LLM-generated narrated animations against static diagrams for Indian children, and none tests a voice-synced "beat = turn" format. The per-template micro-RCT in §11 is the only way to find out.

---

## 3. Landscape

### 3.1 Tools: which renders what, and whether an LLM can write it

| tool | what it is | LLM-writable live? | licence / cost | verdict for Taxila |
|---|---|---|---|---|
| **GSAP 3.15** | JS timeline tweening; DrawSVG, MorphSVG, MotionPath and SplitText now ship in the free npm package | yes, but **through our DSL** (the model never writes GSAP) | "Standard no-charge" licence; commercial use including paid apps is OK. **Prohibited:** use in no-code visual animation builders that compete with Webflow. AI-generated code is explicitly allowed [V gsap.com/standard-license]. Core 72.9 KB min / **28.3 KB gzip**; DrawSVG 2.2 KB, MotionPath 9.7 KB, MorphSVG 9.6 KB gzip [X] | **adopt** as the player runtime, inside the sandbox frame |
| **Web Animations API** | native browser tweening | via DSL | free, 0 KB | the fallback if GSAP's licence ever bites; the DSL is renderer-agnostic |
| **Manim CE** | Python maths animation (3Blue1Brown); renders video offline | yes. TheoremExplainAgent: **93.8%** success [V]. ManimTrainer: **94%** render success, 85.7% visual similarity, with a 30 B open model [V]. SGA geometric verification: +16.1% visual quality [V]. ALGOGEN, with execution decoupled from rendering: **99.8% vs 82.5%** end to end [V] | MIT; render cost is CPU minutes; Devanagari needs the Pango `Text` path (MathTex is LaTeX) [U] | **optional offline Forge lane** for Class 8-9 algebra and geometry derivations only |
| **Motion Canvas** | TS generator-based scenes with an editor; ffmpeg export | possible, but no evidence base | MIT | **skip**: duplicates the DSL with less control |
| **Remotion** | React components rendered to video by headless Chrome | yes (React) | free for ≤ 3 employees; Company licence: Creators $25/seat/month; **Automators $0.01/render, $100/month minimum**; Enterprise from $500/month [V] | **skip**: our player + Playwright capture is the same technique without a React video stack or a licence |
| **Lottie** (lottie-web, dotLottie) | After Effects JSON | no. Research is moving: LottieGPT (660 K-animation dataset), OmniLottie, VAnim [V], but none is production-ready, and none is on Azure | MIT runtimes; asset licences vary | **hand-authored micro-assets only** (celebration, loading, icons) |
| **Rive** | state-machine vector animation | no (binary, editor-authored) | runtime MIT | the **teacher avatar** (decided in tech-and-market §2), not explainers |
| **sora-2 on Azure** | text/image → 720p video with audio | yes, as a prompt | **$0.10/s** [V] | **B-roll lane only**, library-level; §4 |
| **Veo 3.1** (Google, reference only) | text/image → video with audio | yes, as a prompt | $0.40/s standard; Fast $0.10/s (720p) to $0.30/s (4K); Lite $0.05/s (720p) [V ai.google.dev] | **excluded** by the Azure-only directive; cited for price comparison |
| **NotebookLM ("Gemini Notebook") Video Overviews** | sources → narrated visual explainer; Explainer, Short (about 60 s) and Cinematic formats; styles include Whiteboard; 50+ languages including Hindi | — | Cinematic is 18+ and English-only; "may contain inaccuracies"; generation can take **"more than 30 minutes"** [V support.google.com] | the market reference: narrated explainers at scale are slow and unverified. Taxila's edge is seconds, verified, interactive and voice-synced |

### 3.2 LLM → animation research: the lessons that transfer

| system | result | the transferable trick |
|---|---|---|
| **Code2Video** (arXiv 2510.01174) | agentic Manim **86.0** TeachQuiz vs direct code 40.0; Veo3 **2.5**, Wan2.2 0.0; 3Blue1Brown 97.1. **13.8 min and 43.1 K tokens per video** (Claude Opus 4.1); direct code 2.8 min [V] | a **6×6 visual-anchor grid** lifted element layout 45.2 → 82.8; 8×8 was worse (77.2) [V]. `explainer@1` uses 6×6 |
| **MoVer** (arXiv 2502.13372) | LLM motion graphics correct on **58.8%** first try, **93.6%** with ≤ 50 verify-and-correct rounds, 5,600 prompts [V] | a **first-order-logic motion-verification DSL**. Our `checks` are a small live-safe version: zero rounds live, many offline |
| **ALGOGEN** (2605.12159) | 99.8% vs 82.5% success by having the LLM produce a *trace* that a deterministic renderer draws [V] | **decouple execution from rendering**: templates compute, the model chooses |
| **SGA** (2607.18116) | scene-graph extraction plus targeted refinement of spatial conflicts; human preference 84.4% [V] | geometric overlap verification → our E13 (to add) |
| **TheoremExplainAgent** (2502.19400) | 93.8% success; "minor issues with visual element layout" persist [V] | layout is the residual failure even when code runs |
| **Teaching Monster Challenge** (2608.08852) | systems "handle the content well but are far weaker at presenting it and adapting it"; LLM judges cannot rank the top systems [V] | **teacher review stays the library gate**; never an LLM judge alone (inherited: "a model never grades") |

### 3.3 Why generated video fails teaching content

- **Azure's own limitations list** for Sora 2 says it has difficulty with "complex physics, causal relationships (for example, bite marks on a cookie), spatial reasoning (for example, knowing left from right), and precise time-based event sequencing" [V]. Those are the exact properties of most science explainers.
- **VideoPhy-2:** the best model reaches only 22% joint performance on the hard action-centric physics subset [V].
- **Physics-IQ:** physical understanding is "severely limited, and unrelated to visual realism" [V].
- **PhysicsLENS:** 34 of 47 plausible-looking videos ignore the stated property [V].
- **The probe (§4.3)** reproduced the counting and biology failures on our own deployment.

---

## 4. sora-2 on Azure: status, rules, measurement

### 4.1 Status and API [V Microsoft Learn, updated 2026-06-05; OpenAI deprecations]

- **OpenAI:** "On March 24th, 2026, we notified developers using the Videos API and Sora 2 video generation model aliases and snapshots of their deprecation and removal from the API on September 24, 2026." No replacement is listed. Press coverage reports the Sora consumer app shutting down too (Ars Technica, Variety, 2026-03-24 headlines) [S].
- **Azure:** Sora 2 is still a *preview*, with no retirement date stated, and `taxila-sora` answered on 2026-10-02 [X]. **Risk:** an upstream model with no vendor road map. Every clip we keep must be stored by us, and the product must work with the lane switched off.
- **API (v1, OpenAI-compatible):**
  - Calls: `POST /openai/v1/videos {model, prompt, size, seconds}`, then poll `GET /videos/{id}`, then `GET /videos/{id}/content`.
  - Remix: `remix_video_id`. Image anchor: `input_reference`, which must match the output size exactly.
  - Sizes are 720×1280 or 1280×720; the API table lists 4/8/12 s, and the limitations section says 1-20 s.
  - **Two concurrent jobs** per resource. Jobs expire after **24 h** (our `expires_at − created_at` = 86,400 s [X]). There is no `n_variants` for 1080p.
  - Prompts work best "in English or other Latin script languages".

### 4.2 Content rules (child safety) [V]

- Only content "suitable for audiences under 18". That is good for us, but Microsoft says a bypass setting will come later, so pin it off in config.
- Real people, including public figures, cannot be generated. Input images with human faces are rejected. Copyrighted characters and music are rejected. "Sora 2 blocks all IP and photorealistic content."
- Input and output moderation plus Azure content filters apply on top.

**Taxila additions:**
- No children's photos as input, ever (also a DPDP matter).
- No real places of worship, religious figures, flags or maps in generated video. Maps must come from Survey-of-India-compliant vector assets (`tech-and-market` §3.2).
- Every kept clip passes the `auto-validation-qa` §9 video gates plus teacher review.

### 4.3 The probe [X, 2026-10-02]

**Method:** 3 clips at 1280×720, 4 s each, in a flat 2D children's cartoon style, from the US build container to eastus2. I reviewed 2 fps contact sheets and 3 full-size keyframes per clip. Billed about $1.20.

| clip | wall time (create → done) | bytes / bitrate | what was right | what was wrong | verdict |
|---|---|---|---|---|---|
| **seed**: germination in a glass jar | 53.5 s (progress 10 → 99% by 42 s) | 1.02 MB / 1.98 Mbps; H.264 30 fps + AAC | root grows **down**, shoot **up**, two leaves open, style held | leaves open **inside the soil**; seed coat shatters into flying shards; the root branches at once | partial: wrong for a Class 6 lesson |
| **count**: 3 red + 4 green apples merge; board says 3 + 4 = 7 | 57.1 s | 1.54 MB / 3.0 Mbps | chalk "3 + 4 = 7" exact in every frame | **3** green apples, not 4; the merged group is **6** under a board that says 7 | **fail**: teaches a wrong fact |
| **shadow**: sun rises, stick's shadow shortens; label "छाया" | 51.4 s | 1.32 MB / 2.58 Mbps | shadow points away from the sun and shortens; Devanagari exact | "overhead" drawn at the frame's top edge | pass |

**Reading.** Text rendering was good (2/2, including Devanagari). Counting failed (0/1), and process biology was half right. The model is a good illustrator and an unreliable witness. A reviewer must check every frame of a clip against a checklist, so a reviewed second of Sora costs far more than $0.10.

**Throughput.**
- Two concurrent jobs at about 55 s per 4 s clip gives **about 8.7 s of footage per wall-minute** per resource [X].
- At a 1-in-3 acceptance rate [U], one usable minute costs about **$18** of generation and about 20 min of wall time, before review.

### 4.4 What Sora is still for (if the lane survives)

**Only** footage where *nothing countable, directional or causal is asserted by the video itself*. Examples: monsoon rain over a village, a river in flood, a bustling mela, waves on a beach, a field of mustard. The teacher speaks the facts, and any label is an SVG overlay from the DSL, never baked-in text. Keep clips 4-8 s, one per chapter at most, and never as the explanation.

| field | rule |
|---|---|
| prompt template | `{STYLE_TOKEN} {scene noun phrase}. Static or slow pan camera. No people's faces in close-up, no text, no logos, no flags, no religious symbols. Soft ambient sound only.` |
| style token | one fixed per library version (for example `flat 2D children's educational illustration, cream background, soft colours`) so clips match the app's art |
| review checklist (on 1 frame/s) | nothing asserted is wrong; no faces in close-up; no text; no flicker or morphing horror; nothing scary for ages 6-9 (`kids-ux-ages`); audio has no speech |
| storage | download at once; blob `forge/video/<objective>/<hash>.mp4`, re-encoded to ≤ 480p, ≤ 400 kbps H.264 + 32 kbps AAC (the `low-end-offline` cap); poster frame as WebP |
| key | `(objective_id, prompt_hash, style_version, model="sora-2@2025-12-08")` |
| off switch | the explainer DSL version is always the default; video is a progressive enhancement, and the data-saver mode drops it |

---

## 5. Decision matrix: what is made how

| content | live (lesson, seconds) | pre-rendered per chapter (library, reviewed) | never |
|---|---|---|---|
| counting, operations, place value, fractions, integers (C1-7 maths) | `explainer@1` template (combine-count, split-share, number-line-hop) or the T1 engine itself | the same explainer with TTS, captured to MP4 for sharing | Sora (counting fails, §4.3) |
| processes and cycles (germination, water cycle, digestion, life cycles) | template (process-steps, cycle, path-trace) | the same + optional 4-8 s Sora B-roll intro *without* assertions | Sora showing the process itself |
| geometry of light, shadow, sun, moon, orbits | computed template (sun-shadow, moon-phase; ray-path planned) | the same | any generator drawing geometry freehand (the free arm got the shadow lengths wrong, §6.8) |
| labelled structures (flower, cell, heart, a triangle construction) | `build-diagram` (planned): Khan-style `draw` + `write` over a verified SVG asset | the same | gpt-image-2 labels (tech-and-market §4) |
| algebra and derivations (C8-9) | `equation-steps` (planned): KaTeX lines + `focus`/`morph` | **Manim lane, optional** (after the §11 test) | — |
| SST narrative, history, English stories | `story-panels` (planned): 2-4 pre-generated gpt-image-2 panels with slow pan + captions | panels generated per chapter (23 s each, never live) | Sora for historical people or events (real people blocked; accuracy) |
| real-world phenomena (monsoon, flood, river, market) | a still image + pan | **Sora B-roll** (§4.4), if the lane survives | — |
| celebrations, transitions, the teacher | Lottie / Rive hand-authored assets | — | LLM-generated Lottie |

---

## 6. `explainer@1`: the live animation spec

### 6.1 Design principles (each traceable to evidence)

1. **The model chooses; code computes.** Templates turn slots into a cast and beats. Counts, positions, the arithmetic in the symbol line, shadow lengths and moon terminators are code (ALGOGEN; the Sora count failure).
2. **Discrete layout.** Everything sits on a 6×6 anchor grid (`A1`…`F6`, or regions `B2:C3`), never on raw coordinates from the model (Code2Video).
3. **Beats are segments.** 2-8 beats, one idea and at least one visual change each (E5). Each holds its end state (Mayer & Chandler).
4. **Motion only where motion is the concept.** At most 2 movers at once (E3) and no moving decoration (E4), following Höffler & Leutner and Tversky.
5. **Verifiable claims.** Each explainer carries `checks` (MoVer-style predicates) evaluated by a pure simulator in under 1 ms. A failed check means no ship.
6. **Notes are shapes, not lines.** A note says what to point at and what to ask (E8; inherited law: sentence-shaped prompt text gets recited). Spoken lines for pre-rendering live in `tts`, written by a separate narration pass and reviewed.
7. **Renderer-agnostic.** The DSL compiles to a flat render plan; GSAP is one consumer of it, and the frame capture plays the same plan.

### 6.2 Interfaces (TypeScript view of the zod schema in `explainer-dsl.mjs`)

```ts
type Anchor = `${"A"|"B"|"C"|"D"|"E"|"F"}${1|2|3|4|5|6}`;          // 6x6 grid, columns left→right, rows top→bottom
type Region = Anchor | `${Anchor}:${Anchor}`;
type L10n = { en: string; hi: string; hi_latn?: string };            // ≤ 80 chars, no markup
type Band = "B1" | "B2" | "B3" | "B4";                              // kids-ux-ages bands (6-7, 8-9, 10-12, 13-15)

interface Actor {
  id: string; at: Region; role: "content" | "label" | "context";     // context never moves (E4)
  kind: "sprite" | "shape" | "text" | "math" | "repeat" | "arrow" | "path" | "axis"
      | "svgpath";                                                    // svgpath: template-computed geometry only
  lib?: SpriteId; shape?: "circle" | "rect" | "ring" | "line"; color?: ColorToken; size?: "s" | "m" | "l";
  text?: L10n; tex?: string; n?: number /* repeat 1-20 */; layout?: "row" | "grid" | "cluster";
  from?: string; to?: string /* arrow */; pts?: Anchor[] /* path */; axis?: { from: number; to: number; step: number };
  hidden?: boolean;                                                   // revealed by enter/draw/write
  xy?: [number, number]; d?: string;                                  // INTERNAL (templates only; not in the LLM schema)
}
type Verb = "enter" | "exit" | "draw" | "write" | "move" | "follow" | "grow" | "shrink" | "split" | "merge"
          | "count" | "morph" | "pulse" | "focus" | "set";
interface Act { do: Verb; target: string; to?: Region; into?: string; n?: number; ms?: number /* 150-6000 */;
                with?: boolean /* parallel with previous act */; text?: L10n }
interface Beat { id: string; note: string /* shape for the live teacher, ≤ band words */; tts?: L10n /* pre-render line */;
                 cue: "turn" | "auto" | "tap"; hold_ms?: number; acts: Act[] /* 1-5 */ }
interface Check { at: string /* beat id; evaluated at its end */; expr: string }   // grammar in 6.6
interface Explainer {
  dsl: "explainer@1";
  meta: { topic_id: string /* c6-maths-ch07-t01 */; band: Band; title: L10n; template?: string };
  bg: ColorToken; cast: Actor[] /* ≤ 24 */; beats: Beat[] /* 2-8 */; checks: Check[] /* ≤ 10 */;
  probe?: { before: string; kind: "predict" | "explain"; ask: L10n }; // POE: asked before the reveal beat
}
// What the live model actually emits (strict structured output; Azure rejects a top-level anyOf, so it is wrapped):
interface TemplateEnvelope { call: { template: TemplateId; title: L10n; notes: string[]; slots: Slots[TemplateId];
  probe?: { before_beat: number; kind: "predict" | "explain"; ask: L10n } } }
```

A real output from the bench (`taxila-fast`, reasoning `none`, 1,972 ms):

```json
{ "call": { "template": "combine-count@1", "slots": { "a": 2, "b": 3, "op": "add", "sprite": "obj.mango" },
  "title": { "en": "Putting together", "hi": "मिलाकर गिनना", "hi_latn": "Milakar ginna" },
  "notes": ["...5 shapes, one per beat..."],
  "probe": { "before_beat": 3, "kind": "predict", "ask": { "en": "How many mangoes are there altogether?", "hi": "…" } } } }
```

The template computes `2 + 3 = 5` and the check `count(ga)==5` at beat 4; the model never writes "5".

### 6.3 Verbs → player (GSAP) mapping

| verb | render | notes |
|---|---|---|
| `enter` / `exit` | opacity 0 → 1 / 1 → 0 | B1-B2: add a small scale-in (no bounce, kids-ux transform/opacity only) |
| `draw` | stroke-dashoffset L → 0 (DrawSVG in production) | Khan-style progressive drawing; arrows and diagram parts |
| `write` | `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)` wipe | **never** per-character or SplitText reveal: Devanagari matras and conjuncts break (`[..."छाया"]` → `छ ा य ा`) |
| `move` / `follow` | x/y tween to an anchor, or along a template path (MotionPath) | counts as a mover (E3) |
| `grow` / `shrink` | scale with transform-origin set per template (plants grow from the base) | mover |
| `split` / `merge` | repeat: n copies leave, or join `into` (the counts add in the simulator); shape: n equal parts | the simulator is the source of truth for `count` |
| `count` | pulses copies 1..n in sequence; the teacher counts aloud | E6: `n` must equal the copies on stage |
| `morph` | crossfade concrete → pictorial → symbolic (concreteness fading) | MorphSVG optional |
| `pulse` / `focus` | scale yoyo ≥ 333 ms (E9: ≤ 3 Hz); dim everything but the target (signalling) | `focus` is the cue from de Koning 2007 |
| `set` | change a label value (`fmt`) | readouts only |

Reduced motion (`prefers-reduced-motion` or the parent setting): every beat jumps to its end state with a 200 ms crossfade. This is possible because the simulator defines each end state.

### 6.4 Templates

All 8 below are implemented in `explainer-dsl.mjs`; the ones marked *planned* are next.

| template | slots (the model fills) | beats | computed by code | checks |
|---|---|---|---|---|
| `combine-count@1` | a, b ∈ 0-10, op add / take_away, sprite | 5 (add) / 4 | group layout, merge, total, symbol line `a + b = c` | `count(ga)==c`, `visible(sym)` |
| `cycle@1` | 3-6 stages {label, sprite}, centre? | n+1 | positions on an ellipse, arrows, loop closure | last arrow visible |
| `process-steps@1` | 2-6 steps {label, sprite, change appear/grow/move_down/move_up/shrink} | n | positions, arrows, direction of change | `moved(p_i, down/up)` per step |
| `split-share@1` | whole roti/bar/circle, parts 2-12, take | 4 | equal partition, fraction text | `parts(whole)==parts` |
| `number-line-hop@1` | start, hops ±n (1-4) | hops+2 | axis range, hop arcs, final position, equation | `x(mk)==px(result)` |
| `sun-shadow@1` | object, times morning/noon/evening | times | sun altitude → shadow length h/tan(alt), direction away from the sun | shadow visible per time |
| `moon-phase@1` | 2-8 phases | phases | lit fraction and side from the phase angle | phase visible |
| `path-trace@1` | 2-6 stations, mover, route down/right/winding | stations | route geometry, label placement | last station visible |
| *planned* `build-diagram@1` | verified SVG asset id + ordered part ids + labels | parts | stroke order from the asset; label anchors from the asset's semantic points | each part visible; labels at their part |
| *planned* `ray-path@1` | mirror/lens type, object distance, focal length | 3-4 | ray tracing (reuses the T1 `ray-optics` engine maths) | image position vs the lens formula |
| *planned* `equation-steps@1` | KaTeX lines (2-6) + the moved term per step | lines | term matching, highlight | each step equals the previous under a CAS check |
| *planned* `bar-grow@1`, `timeline@1`, `map-route@1`, `story-panels@1`, `fade-concrete@1`, `geometry-construct@1` | — | — | — | — |

### 6.5 Lint (run on every explainer, live and offline; well under 1 ms)

| code | rule | evidence |
|---|---|---|
| E0 | strict schema (zod) | — |
| E1 | references resolve (targets, arrow endpoints, merge targets); required fields per kind | — |
| E2 | no two visible content actors on one anchor cell at a beat end | Code2Video layout |
| E3 | ≤ 2 simultaneous movers per beat | apprehension |
| E4 | `context` actors never move | seductive details |
| E5 | every beat changes a content actor | transient information |
| E6 | `count` only on repeats, and `n` must equal the copies on stage | the Sora count failure |
| E7 | note words ≤ band cap (14/18/24/28); total ≤ 60 s (B1-B2) / 90 s (B3-B4) | segmenting; Guo 2014 |
| E8 | notes contain no paired quotation marks (shapes, not lines). v1.1: apostrophes are fine (the v1.0 rule produced 2 false positives in the bench) | inherited recitation law |
| E9 | no pulse faster than 3 Hz | WCAG 2.3.1; auto-validation Q6 |
| E10 | every hidden actor is revealed | — |
| E11 | the simulator runs; a probe precedes a later reveal | predict-observe-explain |
| E12 | every `check` holds at its beat end | MoVer |
| **E13 (to add)** | no bounding-box intersection between content elements in the compiled plan at any beat end | SGA; the merge overlap seen in §7 |

### 6.6 Check grammar (regex-parsed; no eval)

`count(id)==n | parts(id)==n | visible(id) | moved(id,down|up|left|right) | grew(id) | above(a,b) | below(a,b) | x(id)==px`. These are evaluated against the simulator's end-of-beat states. Templates emit their own checks; free-form output must carry checks that hold.

### 6.7 Live integration with the voice teacher

- **Request.** The Director's move carries `show: { kind: "explainer", objective_id, template_hint?, beat }`. Lookup order:
  1. The library cache, keyed by `(objective_id, template, slot_hash, band, lang, dsl_version, style_version)`. A hit costs 0 ms; the cache is prefetched from the lesson plan (tech-and-market §3.5).
  2. On a miss, `taxila-fast` (reasoning `none`) fills the template call, about 2-3.5 s, which the teacher's spoken preamble covers.
  3. The result is validated (< 1 ms). If it fails, one repair round with the error codes in the prompt. If that also fails, fall back to the T1 engine or a static diagram.
- **Beat = turn.** The client starts beat *k* when the first audio chunk of the teacher response tagged with beat *k* plays, using the audio playback clock rather than the transcript. The beat's end state then holds through the child's turn. `cue:"tap"` beats wait for the child. `cue:"auto"` beats (pre-render only) run on `hold_ms`.
- **Probe.** At `probe.before`, the player pauses. The teacher asks the predict question, and the reveal beat plays only after the child commits (learning-science §1.6, predict-observe-explain).
- **Host → frame commands** (extends the `HostCmd` union in tech-and-market §3.4): `anim.load {plan}`, `anim.play {beat}`, `anim.hold`, `anim.replay {beat}`, `anim.reduce_motion {on}`.
- **Frame → host events** (extends `ModuleEvent`): `anim.ready`, `anim.beat_start {beat}`, `anim.beat_end {beat}`, `anim.replay_req {beat}` (the child tapped replay: a confusion signal for the learner model), `anim.tap {actor}` (attention), `anim.probe_commit {answer, ms}`, `anim.error`. All are debounced into the observer stream exactly like other module events.

### 6.8 Measured: can it be generated live? [X, `explainer-bench-2026-10-02.json`]

**Method:** 8 real topics from `data/curriculum`: C1 addition, C4 shadows, C6 germination, C7 water cycle, C6 equal shares, C6 integers, C7 digestion, C8 moon phases. Each brief carried a one-line child context (for example, "child thinks the shadow is longest at noon"). Strict `json_schema` on `/openai/v1/chat/completions`, 1 rep, from the US container to eastus2. Pass means schema plus lint v1.1 plus checks.

| arm | pass | p50 / max latency | output tokens p50 | failure codes |
|---|---|---|---|---|
| **template · taxila-fast · reasoning none** | **8/8** | **2.88 s / 3.46 s** | 263 (input 1,911) | — |
| template · taxila-fast · low | 8/8 | 4.43 s / 5.80 s | 489 | — |
| template · taxila-brain · none | 8/8 | 4.61 s / 6.45 s | 309 | — |
| free · taxila-fast · low | 3/8 | 13.55 s / 15.97 s | 2,617 | E12 ×4, E2 ×3, E5 ×1 |
| free · taxila-brain · low | 2/8 | 29.70 s / 41.52 s | 3,074 | E5 ×5, E12 ×2, E2 ×1 |

Notes:
- **As-run numbers.** The as-run template passes were 7, 8 and 7. Both misses were the v1.0 E8 apostrophe false positive. The saved outputs were re-validated offline with v1.1, with no new model calls; both numbers are in the JSON.
- **Template choice was right in 24/24.** Addition → combine-count, shadows → sun-shadow, germination → process-steps with root `move_down` and shoot `move_up` (3/3), and so on.
- **One pedagogical miss that lint cannot see.** `split-share` with `take: 4` for "share among 4 siblings" shows 4/4 instead of 1/4. The arithmetic was right and the teaching choice was wrong. This is why library entries get teacher review, and why the live path needs a per-template slot sanity rule (for example, `take < parts` when the objective is "a unit fraction").
- **Free-form failures repeat the video-model failures, but here they are caught.** One explainer drew a morning shadow shorter than the noon shadow (`above(morning_shadow,noon_shadow)` failed). One placed the integer marker by value instead of pixel position (`x(marker)==-2` read 240). One put groundwater above the rain. One left actors overlapping.
- **The 1,911 input tokens are mostly the sprite list and the template menu.** That prefix is cacheable.
- **Cost per live explainer:** 1,911 × $0.20/M + 263 × $1.20/M ≈ **$0.0007** (gpt-5.6-luna Global prices, [V]).

**Conclusion.** Live = template. Free-form explainers go to the offline Forge with a MoVer-style loop and review, like T2 scenes.

---

## 7. The pre-render pipeline (per chapter, offline, reviewed)

```
lesson plan / syllabus calendar ──► Forge job `forge.explainer` (ACA `slow` lane, KEDA-triggered)
  1 plan      taxila-brain: objective → template call (or free beats + checks, ≤ N MoVer-style repair rounds)
  2 narrate   taxila-brain: one `tts` line per beat in hi / en / hi_latn (shape notes → spoken lines; reviewed text)
  3 voice     Azure Speech SSML: <bookmark mark="b1"/>…<break 400ms/> per beat · WordBoundary → captions (WebVTT)
  4 retime    beat span = next bookmark − this bookmark (narration drives the animation, never the reverse)
  5 compile   explainer → render plan (els + tweens + labels), lint E0-E13, checks
  6 capture   Playwright Chromium 854×480: for each frame tl.seek(i/24) → JPEG  (only when an MP4 is needed)
  7 encode    ffmpeg H.264 CRF 28 + AAC 48 k → MP4 ≤ 400 kbps · Opus 20 k narration for in-app DSL mode
  8 QA        auto-validation-qa §9 animation gates + keyframe Q9 + Content Safety on text · teacher review
  9 publish   blob forge/explainer/<objective>/<hash>/{plan.json, narration.{hi,en}.opus, captions.vtt, share.mp4}
```

**Measured once, end to end** [X, `explainer-render-2026-10-02.json`]. The input was `combine-count@1` (3 mangoes + 4) with Hindi narration in `hi-IN-SwaraNeural` at rate −8%.

| step | result |
|---|---|
| TTS | 169 characters → **30.18 s** of audio in **1.95 s** wall; 5 bookmarks at 0.05 / 6.77 / 13.98 / 18.68 / 26.54 s; 68 word boundaries (karaoke-ready) |
| compile | 30.13 s plan; plan JSON 1.2 KB; explainer JSON 1.5 KB; lint clean |
| capture | 724 frames at 24 fps in **20.3 s** wall on 4 vCPU = **1.49× realtime** |
| encode | 2.7 s; MP4 **239 KB = 63.5 kbps** (flat art; real sprites will be higher, still under the 400 kbps cap) |
| delivery | DSL mode (JSON + 20 kbps Opus) **0.12 MB/min** vs MP4 **0.48 MB/min** |
| visual check | groups of 3 and 4 → merged → "3 + 4 = 7" at the right beats; **one dot overlapped after the merge** (→ E13) |

**In-app delivery uses the DSL, not the MP4.**
- It is 4× smaller here and far smaller than any real video.
- It stays interactive: tap, replay a beat, predict.
- It can be re-skinned per child (names, sprites, language) at zero cost.
- It renders on the CPU budget the low-end tiers already allow (SVG with transform and opacity only).

MP4 is produced only for (a) the parent's recap or WhatsApp share, (b) lite-tier devices whose measured frame-drop counter rejects live SVG animation (`kids-ux-ages` G9), and (c) the Sora B-roll lane.

**Manim lane (optional, Class 8-9 maths only).** Taxila-codex writes Manim CE from an `equation-steps` or geometry beat sheet, using a 6×6 anchor prompt and renderer-in-the-loop repair (ManimTrainer's RITL), followed by SGA-style overlap checks and teacher review. **Adopt only if** the `equation-steps` DSL template fails teacher review on more than 30% of Class 8-9 algebra objectives in the §11 pilot.

---

## 8. Cost per minute

Prices are Azure Global, read today [V]:
- gpt-5.6-luna: $0.20 in / $1.20 out per 1M tokens.
- gpt-5.6-sol: $4 / $20.
- Azure Speech neural TTS: $15 per 1M characters (HD $22).
- gpt-4o-mini-tts: $12 per 1M audio-output tokens.
- Container Apps consumption: $0.000024 per vCPU-second and $0.000003 per GiB-second.
- sora-2: $0.10/s.

| path | unit cost | per finished minute | latency | note |
|---|---|---|---|---|
| **live explainer** (template, taxila-fast) | $0.0007 per explainer [X] | ≈ **$0.001** (one explainer ≈ 0.5-1 min with the teacher) | 2.9 s p50 [X]; 0 on a cache hit | the teacher's own voice is the narration |
| **pre-rendered explainer, DSL mode** | TTS ≈ 340 characters/min → **$0.005** + plan LLM ≈ $0.05-0.20 per explainer (sol, with critique rounds) [U] | ≈ **$0.01-0.2** one-off, then $0 per view | minutes (offline) | bytes 0.12 MB/min [X] |
| + MP4 capture | 4 vCPU × 40 s per video-minute ≈ $0.004 + memory ≈ $0.001 [X/U] | **+ $0.005** | 1.5× realtime | only where an MP4 is needed |
| **Sora B-roll** | $0.10/s | **$6 raw; ≈ $18 per accepted minute** at 1-in-3 acceptance [U] | ≈ 55 s per 4 s clip; 2 jobs at once | plus about 2 min of human review per clip [U] |
| Veo 3.1 (reference, not allowed) | $0.40 / $0.10 / $0.05 per second | $24 / $6 / $3 raw | — | excluded (Azure-only) |
| Manim agentic (reference) | about 43 K tokens and 13.8 min per video (Code2Video) | about $0.5-1 on sol tokens [U] + render CPU | 10-15 min | optional lane |

**Library sizing.**
- The curriculum seed has **742 topics**: 304 maths, 146 science, 64 EVS, 118 English, 45 Hindi, 65 SST.
- Assume one explainer for about 60% of the 514 maths, science and EVS topics, which is about **310 explainers** at about 1 min, voiced in hi and en.
- Compute is about **$310 × 0.2 ≈ $60 worst case** [U].
- Sora B-roll at one 8 s clip per science, EVS or SST chapter (about 90 chapters) × 3 attempts is about **$220** [U].
- **The binding cost is teacher review time** (about 5 min per explainer ≈ 26 h), not compute.
- Live generation per 45-min lesson: about 6 explainers × $0.0007 ≈ **$0.004**, and $0 after the library fills.

---

## 9. Risks and failure modes

| risk | mitigation |
|---|---|
| Sora is withdrawn from Azure without notice | the lane is optional; the DSL version is the default; every clip is stored by us; nothing in a lesson depends on video |
| a template is arithmetically right but pedagogically wrong (the `take: 4` case) | per-template slot rules tied to the objective; library entries need teacher review; live outputs log to a review queue |
| GSAP licence scope (no-code animation builders) | Taxila is not a builder product; the DSL is renderer-agnostic (WAAPI fallback) |
| animation becomes decoration | lint E3-E5 and E9; the micro-RCT in §11 must show a delayed-retrieval gain per template, or the template reverts to a static diagram |
| Devanagari rendering | wipe-only `write`; bundle Noto Sans Devanagari in the sandbox; screenshot test per release (OCR on the captured frames) |
| low-end devices drop frames | measured frame-drop counter → reduced-motion end-state mode → MP4 fallback (lite tier) |
| narration and beat drift in live mode | sync on the audio playback clock at turn start, not on transcript deltas; the end state holds, so drift costs nothing |

---

## 10. Implementation checklist (for the build workstream)

1. Move `explainer-dsl.mjs` into `shared/` (schema + lint + simulator + compile) and the GSAP player into `src/modules/frame/engines/explainer.tsx`. Bundle GSAP core, DrawSVG and MotionPath locally (CSP `connect-src 'none'`).
2. Add lint E13 (bounding-box overlap on the compiled plan) and the per-template slot sanity rules.
3. Add the `anim.*` host commands and events to `shared/contracts.ts` and the observer debounce.
4. Add `forge.explainer` to the job kinds (`orchestration-architecture` §4), with steps 1-9 of §7. Put Azure Speech bookmark sync in `server/forge/voice.js`.
5. Build the 6 planned templates, `build-diagram` and `ray-path` first: they cover the most science objectives and reuse verified assets and engine maths.
6. Gate the Sora lane behind a feature flag (default off), with the §4.4 checklist and a nightly liveness probe (one 4 s clip a week, $0.40).
7. Gates in CI: golden plans per template (snapshot of the compiled plan), the bench re-run on prompt changes, and a frame-capture smoke test.

---

## 11. Measurements to run next (in priority order)

| id | question | method | reverses |
|---|---|---|---|
| A1 | Does a template explainer beat the same content as a static diagram plus voice for delayed retrieval? | within-child micro-RCT per template (learning-science §8.7 bandit-safe design), B1-B2 and B3-B4 separately, outcome = next-session retrieval | if there is no gain for a template, it becomes static |
| A2 | Real-device frame time for the player | 2-3 GB Android reference device, 60 s explainer, median ≤ 16 ms / p95 ≤ 33 ms (`kids-ux-ages` G9) | MP4 or reduced-motion default on that tier |
| A3 | Live latency from India, cold and warm cache | Central India client → eastus2, n ≥ 30 per template | move the fill model or prefetch harder |
| A4 | Template bench at n = 5 reps × 30 topics, with a teacher rating of pedagogy | extends `explainer-bench.mjs` | a template whose slots are pedagogically wrong in > 10% is redesigned |
| A5 | Sora acceptance rate on B-roll-only prompts (no assertions) | 20 clips × checklist review | under 1/3 acceptance → drop the lane |
| A6 | Manim lane vs `equation-steps` for C8-9 algebra | 10 objectives × both, teacher review | the §7 adoption rule |

---

## 12. Proposed `context/` entries (for the main loop to merge)

- **measurement `sora-azure-probe-2026-10-02`:** 3/3 completed; 51-57 s per 4 s 720p clip; 2-3 Mbps; 1/3 fully correct (count wrong, seed biology wrong, shadow right); text 2/2. n=3. Method in §4.3.
- **measurement `explainer-live-bench-2026-10-02`:** the §6.8 table. n=8 briefs × 5 arms × 1 rep.
- **measurement `explainer-prerender-2026-10-02`:** the §7 table. n=1.
- **decision `animation-live-template`:** the live path is `explainer@1` templates on taxila-fast with reasoning `none`.
  - *Reverse if:* free-form passes ≥ 7/8 under 5 s, or the A1 RCT shows no learning gain.
- **decision `video-library-broll-only`:** Sora is B-roll only, behind a flag, with no assertions.
  - *Reverse if:* a first-party Azure video model passes the count, direction and causality probe at ≥ 9/10, or Azure retires Sora (then delete the lane).
- **rejection `sora-for-explanations`:** Sora asked to show 3 + 4 apples drew 3 + 3 and merged them into 6 under "= 7"; the germination leaves opened underground (§4.3).
- **rejection `free-form-live-explainers`:** 3/8 and 2/8 pass at 13.6 s and 29.7 s; the failures are geometric self-contradictions (§6.8).
- **rejection `per-character-text-reveal`:** it detaches Devanagari vowel signs.
- **rejection `remotion`:** licence plus stack, with no capability over Playwright + GSAP capture (§3.1).

---

## Sources

**Measured here:** `animation-video-sora-probe-2026-10-02.json`, `explainer-bench-2026-10-02.json`, `explainer-render-2026-10-02.json` (this folder).

**Vendor and primary:**
- Microsoft Learn, Sora 2 video generation overview (preview), updated 2026-06-05: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation [V]
- OpenAI API deprecations (Sora 2 and Videos API removed 2026-09-24): https://developers.openai.com/api/docs/deprecations [V]
- Azure OpenAI pricing (Sora 2, gpt-5.6, gpt-4o-mini-tts): https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/ [V]
- Azure Speech pricing: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/ [V]
- Azure Container Apps pricing: https://azure.microsoft.com/en-us/pricing/details/container-apps/ [V]
- Gemini API pricing (Veo 3.1): https://ai.google.dev/gemini-api/docs/pricing [V]
- GSAP Standard License: https://gsap.com/standard-license [V]
- Remotion licence: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md and https://www.remotion.pro/license [V]
- NotebookLM / Gemini Notebook Video Overviews help: https://support.google.com/notebooklm/answer/16454555 [V]

**Press (Sora shutdown):** Ars Technica, "OpenAI announces plans to shut down its Sora video generator" (2026-03-24), https://arstechnica.com/ai/2026/03/openai-plans-to-shut-down-sora-just-15-months-after-its-launch/; Variety (2026-03-24), https://variety.com/2026/digital/news/openai-shutting-down-sora-video-disney-1236698277/ [S, headlines via the HN Algolia index; the articles were not fetched]

**Research (arXiv abstracts via export.arxiv.org):**
- Code2Video 2510.01174 (HTML read): https://arxiv.org/abs/2510.01174
- MoVer 2502.13372: https://arxiv.org/abs/2502.13372
- TheoremExplainAgent 2502.19400: https://arxiv.org/abs/2502.19400
- ManimTrainer 2604.18364: https://arxiv.org/abs/2604.18364
- SGA 2607.18116: https://arxiv.org/abs/2607.18116
- ALGOGEN 2605.12159: https://arxiv.org/abs/2605.12159
- PhysicsSolutionAgent 2601.13453: https://arxiv.org/abs/2601.13453
- Teaching Monster 2608.08852: https://arxiv.org/abs/2608.08852
- PIVOT 2609.24083: https://arxiv.org/abs/2609.24083
- EduStory 2605.09378: https://arxiv.org/abs/2605.09378
- VideoPhy-2 2503.06800: https://arxiv.org/abs/2503.06800
- Physics-IQ 2501.09038: https://arxiv.org/abs/2501.09038
- PhysicsLENS 2610.01162: https://arxiv.org/abs/2610.01162
- LottieGPT 2604.11792: https://arxiv.org/abs/2604.11792
- OmniLottie 2603.02138: https://arxiv.org/abs/2603.02138
- VAnim 2605.01517: https://arxiv.org/abs/2605.01517
- LiveSVG 2605.30174: https://arxiv.org/abs/2605.30174

**Learning science** (citations verified via Crossref; [K] where the text was not re-read):
- Höffler & Leutner 2007: https://doi.org/10.1016/j.learninstruc.2007.09.013
- Berney & Bétrancourt 2016: https://doi.org/10.1016/j.compedu.2016.06.005
- Tversky, Morrison & Bétrancourt 2002: https://doi.org/10.1006/ijhc.2002.1017
- Mayer & Chandler 2001: https://doi.org/10.1037/0022-0663.93.2.390
- de Koning et al. 2007: https://doi.org/10.1002/acp.1346 [V abstract]
- Fiorella & Mayer 2016, *J. Ed. Psych.* 108(4)
- Fiorella et al.: https://doi.org/10.1037/edu0000325
- Guo, Kim & Rubin 2014: https://doi.org/10.1145/2556325.2566239 [V PDF] (https://pg.ucsd.edu/publications/edX-MOOC-video-production-and-engagement_LAS-2014.pdf)
- Fisch, capacity model: https://doi.org/10.4324/9781410610553-18

---

## Engineering review

**Reviewer:** senior frontend/game engineer, 2026-10-02. **Scope:** can each `explainer@1` engine be built in React/TS + SVG in at most 2 days, does it hold 60 fps on a Rs 10k Android, are the params enough for LLM control, are the events enough for the teacher to observe learning, and what are the safety issues. **Method:** I read this document and the artefacts it cites (`explainer-dsl.mjs`, `explainer-render.mjs`). I ran no device tests, so every performance statement below is [U] (engineering estimate) until measurement A2 is run. Where the document says "measured", only the frame-capture path was measured, and that is not the on-device path.

### E.1 Verdict

The direction is right: model fills slots, code computes, SVG plays a flat plan. The document overstates readiness in six places (E.2). Four of them would break the "2 days per engine" claim if left uncorrected: the shared player is not costed, Devanagari wiping is under-specified, E13 is harder than a lint line, and the planned templates are not equal in cost.

### E.2 Corrections to the document

1. **The player is a separate deliverable, not a free by-product.** The bench player (`explainer-render.mjs`, about 20 lines) is a seek-driven GSAP timeline in a bare SVG. The production player needs everything below, and none of it is in the "8 templates implemented" claim.
   - Live play/hold/replay of a single beat (a seek-driven timeline plays continuously; it has no hold semantics).
   - Reduced-motion jump to the end state.
   - The `anim.*` command and event wiring through the sandbox postMessage bridge.
   - Font loading, a sprite library, and teardown.
   - **Cost: L (4-5 days), built once, before any engine.** The per-engine estimates in E.4 assume it exists. Total build is therefore player L + templates, not 8 x S.
2. **"Bundle GSAP locally" must be checked against the sandbox size budget and the licence reading.** The 28.3 KB gzip core is fine. MorphSVG and DrawSVG are listed as "optional/production". Plan for the core plus MotionPath only (about 38 KB gzip). `draw` can be done with `stroke-dashoffset` and `getTotalLength()` with no plugin, and `morph` as a crossfade (already the stated default). This removes two plugin dependencies and the licence question for them. The GSAP "AI-generated code is allowed" wording was read from the licence page; have counsel confirm before shipping inside a paid app, since the "no-code builder" prohibition is the only open clause.
3. **`write` as a `clip-path: inset()` wipe on SVG `<text>` is not portable.** CSS `clip-path` on SVG child elements is unreliable on older Android WebViews (Chrome 70-80 era, common on Rs 10k devices on stock Android 9-10 with an un-updated System WebView). Use an SVG `<clipPath>` with a `<rect>` whose width is tweened (attribute animation, no CSS clip-path). Measure at least one WebView 74-90 device. Also tween the rect in the text's writing direction only for LTR; Devanagari is LTR, so this is fine, but a right-to-left Urdu/Arabic-script extension would need a mirrored wipe (note for later).
4. **Devanagari shaping in SVG `<text>` needs a font fallback test.** The bench ran in desktop Chromium with Noto installed. On a device, SVG text with `font-family` fallback can render conjuncts correctly but at a slow first paint if the font is not bundled. Bundle a subsetted Noto Sans Devanagari (about 100-150 KB woff2 for the used glyphs [U]) and await `document.fonts.load()` before `anim.ready`. Measure text width with `getComputedTextLength()` after load, never estimate it from character count; the `fit` of a Hindi label inside a 6x6 cell is otherwise a layout bug the lint cannot see.
5. **E13 (bounding-box overlap lint) is not a one-liner.** The compiled plan has anchors and `xy`, not sizes. To intersect boxes the compiler needs sprite sizes, text extents (which depend on the font, correction 4), and `repeat` cluster extents. Do it in two stages: (a) compile-time with conservative per-sprite boxes from the sprite manifest, run in CI and the offline Forge (cost M, 1.5 days); (b) do NOT run text-extent overlap live, because the live path has no DOM. Live remains E2 (one anchor cell). State this limit; the document says E13 runs "before the library ships", which is correct, but the checklist (section 10 item 2) implies it also gates live output.
6. **The "60 fps" claim is not made anywhere, and `kids-ux-ages` G9 asks for median 16 ms.** The document rests this on "SVG with transform and opacity only". That is true for composited HTML layers, but **SVG element transforms are not GPU-composited in most WebViews**: every frame re-rasterises the SVG layer on the main thread. Expect fine results with fewer than about 40 simple elements and one or two movers, and a cliff past that on a 2 GB device [U]. The E3 (2 movers) and cast <= 24 limits are therefore load-bearing for performance, not just for pedagogy. Recommended rule: **render each actor as an absolutely positioned HTML `<div>`/`<img>` (or a CSS-sized inline SVG sprite) moved with `transform: translate3d()` and `opacity`**, which promotes it to its own compositor layer, and use one SVG overlay only for arrows and paths. This is a cheap architectural decision that should be made before the player is written; retrofitting it is an L task. Add `will-change: transform` only to active movers and remove it at beat end (layer memory on 2 GB devices).
7. **Timeline library choice under live play.** GSAP timelines use `requestAnimationFrame`; they pause when the page is hidden (good) but the audio clock does not. Section 6.7 says beats start from the audio playback clock; the player must therefore start a *fresh* tween per beat (not seek a single global timeline), and a beat that overruns its audio just holds. Seek-per-frame is a capture technique only. Say so explicitly, otherwise the build workstream will reuse the capture player live and get drift.
8. **"0.12 MB/min DSL" excludes sprites.** The 14 sprites/bundles (`SPRITES`) are a fixed one-time asset (about 100-200 KB as SVG [U]), cacheable in the WebView, but the first-lesson download must count it. Minor; correct the table footnote.
9. **Teacher observability is thinner than 6.7 claims.** See E.5.
10. **The Sora lane needs a safety line the document lacks.** See E.6.

### E.3 Cross-cutting engineering requirements

| requirement | rationale |
|---|---|
| Sprite manifest with intrinsic box, anchor point and transform-origin per sprite | needed by E13, `grow` (plants grow from the base), `merge` targets and shadow geometry |
| Single `AnimEngine` class: `load(plan)`, `play(beat)`, `hold()`, `replay(beat)`, `destroy()`, no React inside the frame | the frame is sandboxed; React only wraps the host side. Keeps the frame bundle small (<= 120 KB gzip including GSAP) |
| Frame-time counter (rAF delta, p50/p95) reported in `anim.ready`/`anim.error` | feeds the G9 fallback to reduced motion/MP4; without it, A2 cannot be automated |
| Beats are pure functions of `(plan, beatIndex)` end state | enables reduced motion, replay, and test snapshots; already stated, but make it an invariant tested in CI with a DOM snapshot per beat end |
| Visibility/AudioFocus handling: pause on `visibilitychange`, resume to the same beat | a child switching apps mid-lesson otherwise desynchronises narration and animation |
| Touch targets: every `anim.tap`-able actor >= 48 dp hit area even when the sprite is smaller | kids-ux; undersized sprites at 6x6 grid on a 5-inch screen are about 50 px per cell, fine, but `size: "s"` sprites are not |
| Minimum frame size assumption: 360 x 640 dp portrait | the bench is 854x480 landscape. On a portrait phone the 6x6 grid gives about 60 x 100 dp cells; label text in a cell must fit Hindi at >= 14 sp. Define the stage as landscape and letterbox, or define a portrait grid. This choice is missing and affects every template's coordinates |

### E.4 Per-engine build-cost estimate

Sizes: **S** = at most 1 day, **M** = about 2 days (within the stated budget), **L** = more than 2 days (needs splitting or de-scoping). Estimates assume the shared player (E.2 item 1) and the cross-cutting items exist, one engineer, including unit tests and golden-plan snapshots but excluding the teacher-review time and the micro-RCT.

| engine | in the document | size | notes: feasibility, perf, params, risks |
|---|---|---|---|
| **Shared player + sprite lib + bridge** | not costed | **L** (4-5 d) | see E.2 items 1, 3, 4, 6, 7. Prerequisite for everything below. Could be split: player core (2 d), sprite manifest and assets (1-2 d), bridge and events (1 d) |
| `combine-count@1` | implemented | **S** | up to 20 repeats of a sprite: 20 elements is fine. `merge` of two clusters = 2 movers (at the E3 limit; moving individual copies would break it, so animate the cluster group, not each sprite). Params (a, b in 0-10, op, sprite) are sufficient; LLM cannot go wrong except in sprite choice. Pedagogical gap: no `take_away` visual for b > a (negative). Lint it |
| `cycle@1` | implemented | **S** | 3-6 stages on an ellipse: easy. Label overflow with Hindi text on 6 stages in portrait is the risk (E.3 stage size). Params fine |
| `process-steps@1` | implemented | **S** | per-step `change` enum is the right LLM-control surface. `move_down` for roots under the soil needs the sprite to be clipped by a soil band (the Sora-style "leaves open underground" bug has an SVG analogue: a shoot sprite drawn above `soil` layering). Add a z-order layer param (`under: "soil"`) or the template hard-codes layering. |
| `split-share@1` | implemented | **S-M** | equal partition of circle/bar/roti: bar is trivial; circle sectors need arc path generation (a template-computed `svgpath`, fine). Parts up to 12 on a circle is tight at 360 dp. Needs the pedagogical slot rule (`take < parts`) from section 6.8, which is a small but required validator. |
| `number-line-hop@1` | implemented | **S** | one axis, up to 4 hops: trivial. Check that tick labels do not collide for ranges > 20 (add an auto-stride param computed in code, not by the LLM) |
| `sun-shadow@1` | implemented | **M** | trig is easy; the cost is the visual: a shadow polygon with correct skew from an arbitrary sprite needs the sprite's footprint and height from the manifest. A rectangle or the object silhouette as a skewed duplicate (`transform: skewX`) is the cheap version. Perf fine. Teacher-visible risk: the document computes `h/tan(alt)`, which blows up near 0 degrees; clamp altitude to [10, 90] and cap shadow length at the stage edge, or evening shadows leave the frame |
| `moon-phase@1` | implemented | **M** | terminator drawn as an SVG path (two arcs) is the standard approach and cheap. Hemisphere (northern India vs. the textbook picture) and waxing/waning side must come from a fixed table; this is a known source of textbook errors, so a golden test per phase is mandatory. Params fine |
| `path-trace@1` | implemented | **S-M** | a mover along a route with 2-6 stations: MotionPath plugin (9.7 KB) or a hand-rolled `getPointAtLength` tween (cheaper, no plugin). Winding routes need a route library, not free coordinates |
| `build-diagram@1` (planned) | planned | **L** | the template is trivial; the **verified SVG assets with semantic part ids and label anchor points are the work**, and they are Content-team, not engineering, deliverables (about 30-60 min per diagram to author and verify, for flower/cell/heart/etc.). Engineering: M (1.5 d) for stroke-order reveal with `stroke-dashoffset` over arbitrary asset paths (filled shapes need a mask-wipe instead, since `draw` only works on strokes). **Asset pipeline makes this L overall.** Do not promise it for the next release |
| `ray-path@1` (planned) | planned | **M-L** | tracing is reused maths from the T1 engine (the document says), but SVG rays, reflections, a virtual image shown dotted, and the sign convention (Cartesian, as CBSE uses) are easy to get wrong. M if the maths module is genuinely shared and already tested; L if it must be extracted first. Needs golden tests against the textbook lens formula (the document's check `image position vs the lens formula` is correct and should be a hard gate) |
| `equation-steps@1` (planned) | planned | **L** | KaTeX in the frame is about 60-80 KB gzip plus fonts (about 100 KB more) [U]: a real cost on a data-capped plan and for the sandbox bundle. "Each step equals the previous under a CAS check" requires a CAS in the shared package (e.g. a tiny rational-function normaliser, or `nerdamer`/`mathjs`, +100 KB+). Term-move highlighting needs a tokeniser for the LaTeX. This is not a 2-day template; either cut scope to **linear equations in one variable with integer/rational terms** (M, 2-3 d, custom mini-CAS) or defer. The document's "optional Manim lane" tests whether this template is good enough, which is premature until the template exists |
| `bar-grow@1`, `timeline@1` | planned | **S** each | `bar-grow` is trivial; `timeline` needs a date-to-position mapping and label collision handling |
| `map-route@1` | planned | **L** | blocked by asset licensing and the Survey of India constraint already noted; the engineering is S, the data is not |
| `story-panels@1` | planned | **M** | pan/zoom on 2-4 pre-generated images is easy (Ken Burns via `transform`). Perf: a 1024x1024 decoded bitmap is 4 MB; four panels on a 2 GB device is borderline and decoding during a pan can jank. Pre-decode (`img.decode()`), downscale to display size at pack time (about 800 px wide), serve WebP. Add a caption-over-image contrast rule. Safety: see E.6 |
| `fade-concrete@1` | planned | **M** | concrete to pictorial to symbolic crossfades need three matched asset sets per topic; again content-bound |
| `geometry-construct@1` | planned | **L** | compass-and-straightedge construction with arcs, intersections and a correctness check is a mini geometry engine. It overlaps with the T1 maths engines (the maths-engines doc should own it) rather than the explainer |
| Lint E13 | to add | **M** | see E.2 item 5 |
| `forge.explainer` job (steps 1-9) | specified | **L** | TTS bookmark sync, Playwright capture, ffmpeg and blob publish already work as a script; productionising them as a queue job with retries, review state and idempotency is a multi-day task. It is not blocking for the live path |
| Sora B-roll lane | optional | **S** | submit, poll, download, re-encode, store. Cheap to build; the work is the review checklist. Keep it last |
| Manim lane | optional | **L** | needs a Python/LaTeX/Pango toolchain image and a repair loop; defer until A6 actually justifies it |

**Totals (one engineer, assuming no content-team dependency):**
- Player + 8 implemented templates in production quality: **about 12-14 working days** (player 4-5, eight templates about 8, E13 1.5, testing/golden plans 1-2). The document's implied "implemented, ship" is optimistic by about 2x because the bench code skips the player, fonts, lint-in-CI, and events.
- Planned templates, in order of value per cost: `bar-grow` (S), `timeline` (S), `story-panels` (M), `ray-path` (M-L), `build-diagram` (engineering M + content L), `equation-steps` (L), the rest deferred.

### E.5 Can the teacher observe learning from the events?

The event list (`anim.ready`, `beat_start`, `beat_end`, `replay_req`, `tap`, `probe_commit`, `error`) tells the teacher what the child *did*, not what they *understood*. Gaps:

1. **A beat that merely plays is not evidence of learning.** `beat_end` only says the animation finished. The only comprehension signal is the probe (`probe_commit {answer, ms}`), and the document allows at most one probe per explainer (`probe?: {...}` is a single object). Allow 1 probe per 3 beats (up to 2) for B3-B4, and make `probe.kind: "tap_target"` possible (child taps where the 4th mango goes), which gives richer, language-free evidence than a spoken answer from a 6-year-old.
2. **The probe answer must be graded by code against the computed key**, not by the model (inherited rule). Add `probe.key` (computed by the template, e.g. 7) and `probe_commit` carries `{answer, correct: boolean, ms, attempts}`. Today `correct` is absent.
3. **Replay events need context.** `replay_req {beat}` is a confusion signal only if the teacher also knows how many times and whether the narration was playing. Add `replays: n` and `dwell_ms` (time on the beat end state before the child's next utterance).
4. **Tap events need coordinates relative to the cast.** `anim.tap {actor}` is good; add `{actor|null, role}` so taps on `context` actors (decoration) are distinguishable from taps on content: a child tapping the sun instead of the shadow is information. Also debounce taps (children mash) with a 250 ms window and cap per-beat events at, say, 10.
5. **Interrupts.** Add `anim.interrupt {beat, by: "child_speech"|"nav"|"background"}` so the Director knows a beat was cut off and should not be assumed seen. Barge-in is common with kids.
6. **Attention is unobserved.** Without gaze/focus, `beat_end` while the app is backgrounded looks identical to a watched beat. The visibility event in E.3 fixes the worst case.
7. **Privacy:** events must carry actor ids and numbers only, never free text typed by the child, and only to the learner model (identity is an authenticated child id).

### E.6 Safety review

1. **Sora input and output.** The document covers moderation and no-faces rules. Add: (a) a **perceptual-hash and OCR check on frames** for baked text (the probe showed it can draw exact wrong text, which is also an injection surface for unwanted words); (b) every clip's audio track must be **stripped** at the re-encode step, not merely "no speech" reviewed, since the lane adds no value from audio and any audio is un-reviewable at scale (`-an` in ffmpeg); (c) a hard reviewer sign-off state in the library so an unreviewed clip can never be served, enforced by the server (predicate, not instruction).
2. **Child-safety floor inside animations.** Child-facing text is generated by the model (`title`, `notes`, `ask`, `L10n` labels). The live path must run Azure Content Safety (or a local blocklist predicate) on **all L10n strings before `anim.load`**, not only on offline output. Section 7 step 8 mentions Content Safety for pre-render only. The latency cost is about 100-300 ms and can run in parallel with the plan compile.
3. **Prompt-injection through the child's context.** The bench brief includes "one-line child context". If that string includes child-provided words, it can steer the slot-filler. Slots are enum/number-bound, which limits the damage, but the free `L10n` fields (title, ask) accept 80 characters of model text: validate for the 80-char cap, no URLs, no markup, no emoji from a blocklist, and render them as `textContent`, never `innerHTML`. State this as a lint (E14).
4. **SVG injection.** `svgpath.d` is described as "internal (templates only)". Enforce it by having the *LLM schema* omit it and the validator reject it, which the document says; also reject any `href`, `style`, `on*` and `<foreignObject>` in the player's DOM construction. Build the DOM with `createElementNS` and an attribute allowlist, as the bench player does; never concatenate an HTML string. The 600 KB-class sprite library must itself be sanitised (no scripts in sprite SVG).
5. **Flashing/photosensitivity.** E9 caps pulse at 3 Hz (WCAG 2.3.1). Also cap **full-frame luminance transitions** (the `focus` dim and the end-of-beat crossfade) and area of flashing; `focus` dim toggled across consecutive short beats can approach flash thresholds on a bright background. Add a lint: no more than 3 `focus`/`pulse` transitions per second of plan time, and no full-stage background change faster than 3 per second. Reduced motion must also disable `pulse` outright, not merely jump to end states.
6. **Cultural and content sensitivity.** Sprites for `story-panels` and `sun-shadow` (people, deities, food) need the same review as images: no meat sprites in a vegetarian-default context if the school or family context is unknown, no religious symbols in generic scenes, skin tone and clothing variety in people sprites, and an India-appropriate map (already noted). Moon-phase and "sun rises in the east" content must use the correct hemisphere/direction table.
7. **Wrong-fact safety (the core risk).** The "pedagogically wrong but arithmetically right" slot case (`take: 4`) is a *fact* risk on the live path, where no human reviews. Per-template slot sanity rules are therefore a **ship blocker for live use**, not a nice-to-have. Also log every live explainer to a review queue (already stated) and have a kill switch per template id.
8. **Memory/DoS.** The frame sandbox must cap plan size (e.g., <= 16 KB), element count (<= 60) and total duration, and `anim.load` must reject over-limit plans; a malformed plan must not hang a child's lesson. Add a watchdog: if `anim.ready` has not fired in 3 s, host falls back to the static diagram.

### E.7 Is the LLM-facing parameter surface sufficient?

- **Yes for the 8 implemented templates.** The slot enums and numeric ranges are the right control surface (8/8 valid). Two additions: (a) a per-template **"intent" enum** (for example `combine-count: "total" | "difference" | "commutativity"`) so the teacher can request the idea, not just numbers (without it, the same a and b always produce the same beats); (b) a **`emphasis`** slot (which beat to focus/pulse), constrained to beat ids, so the teacher can respond to a child's specific confusion without free-form beats.
- **No for free-form.** The 2-3/8 pass rate stands; do not widen the live schema. Adaptation should be by re-choosing the template and slots, with 2-3 s latency covered by speech.
- **Cache key** in 6.7 contains `slot_hash` but not `intent`/`emphasis` once added; include them, or personalised variants collide.
- **Sprites** are an enum of 14 bundles: sufficient for Class 1-3 counting, thin for Class 4-9 science. This is the practical ceiling on LLM control and is a content-team pipeline (sprite authoring), not an LLM problem.

### E.8 Recommended build order

1. Architecture decisions in E.2 item 6 (HTML-layer sprites with `translate3d`) and E.3 stage orientation; one half-day spike on a real Rs 10k device (satisfies A2 early, before 8 templates are built on the wrong substrate).
2. Shared player, fonts, sprite manifest, bridge, events (E.5 additions), safety validators (E.6 items 2-4, 8).
3. `combine-count`, `number-line-hop`, `process-steps`, `cycle` (all S), with golden plans and a frame-time CI check.
4. `split-share`, `path-trace`, `sun-shadow`, `moon-phase` (S-M/M).
5. E13 offline lint, then `bar-grow`, `timeline`, `story-panels`.
6. `ray-path`, `build-diagram` (after content assets), `equation-steps` (scoped to linear equations).
7. Sora lane and Manim lane only after the above are in production and A1/A5/A6 report.

### E.9 Verdict summary

| area | status |
|---|---|
| 8 implemented templates, feasible in React/TS + SVG | **yes**, but the player is an extra L and the real total is 12-14 days, not "done" |
| 60 fps on a Rs 10k Android | **unproven; likely only with HTML-layer compositing and at most about 40 elements**; spike on device first |
| LLM param sufficiency | yes for templates, plus `intent` and `emphasis`; no for free-form |
| Teacher observability | insufficient as written; add graded probes, replay context, interrupts, tap role |
| Safety | adequate offline; **live path needs text safety predicates, template slot sanity rules, SVG allowlist, flash limits and a watchdog** |
