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
