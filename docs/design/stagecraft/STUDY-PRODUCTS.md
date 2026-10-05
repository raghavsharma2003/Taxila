# Stagecraft, Study A: products and systems that build content in parallel with a live conversation and show the right piece at the right moment

**Date:** 2026-10-05. **Owner brief:** OWNER-RESET item 17 (binding): "on the go content build and showcased without
fail; in the content creation we need similar to the duplex architecture where in parallel we are building various
content while the convo is going on and how it changes, and then accordingly showing the student the right one."
Also binding: items 3, 4, 9, 12, 14 (real-time games, cinematic animation, zero visible failure, proper diagrams,
frequent adaptive generation).

**Scope.** For every product or system that builds or picks content while a conversation runs, this study records:
- **what** is generated;
- **when** it is triggered: explicitly (the user asks), in-turn (the model decides while answering), anticipatorily
  (before anyone asks), or by perception (something seen or heard);
- **latency**;
- **how it avoids showing stale or broken content**;
- **how many candidates are built and thrown away**;
- **evidence of learning impact**, where any exists.

This file stops at implications (§6). The Stagecraft architecture belongs to a later study. It touches no product
code.

**This file does not repeat** the documents below. It cites them where needed.
- `docs/research/duplex/PRODUCTS.md`: GPT-Live-1's front/back split, Griffin internals, turnprobe, Speak's
  thinking-pause numbers.
- `docs/design/superhuman/LIVE-STUDIO.md` §1: Claude Code, Codex, artifacts, v0, Lovable, Bolt, Gemini GenUI, MCP
  Apps, Code2Video, all as *build machinery*.
- `docs/research/world-best/generated-learning-content.md` §1: the learning-visual landscape, A2UI, EE-Eval,
  ManimAgent, KVBench, Genie 3.
- `docs/design/reset/STUDIO-V2.md` §2: Brilliant, PhET, DragonBox, Prodigy, Kahoot, 3Blue1Brown, Kurzgesagt, Motion
  Canvas, Rive.

What is new here is the **parallel-and-pick** angle: who builds *more than one* thing while the talk goes on, how they
decide which one reaches the screen, and what they do with the rest.

**Evidence tags.**
- **[V]** a primary page fetched this session: vendor doc, vendor blog, GitHub issue, arXiv abstract, or a
  peer-reviewed working paper. The fetch tool summarises pages, so a summary can drop or distort text. A **[V]** on a
  vendor claim means *the vendor says so*, not that it is true.
- **[S]** secondary: press, a search snippet, or a review site.
- **[T]** read in Taxila's own code, docs or `context/` this session.
- **[M]** measured in this repo, cited and not re-run.
- **[E]** my estimate or inference.
- **⚠** two sources disagree.

**Method.** About 35 WebSearch queries and 14 primary fetches:
- Google Live API tools page;
- Tavus perception-tool and interactions docs;
- the LiveKit agents docs plus issues #7302 (Python) and #1365 (JS);
- Vercel's v0 agent blog;
- Brilliant's "hand-crafted, machine-made" post;
- Duolingo's Video Call AI post;
- Khan Academy's 2026 diagrams post;
- Claude's visuals post;
- the Roblox 4D beta thread;
- Google Research's Learn Your Way post;
- Chalkbeat and FutureEd on the Khanmigo RCT.

Nothing was run against a paid API, so Azure spend was $0.

---

## 0. The findings that change something

1. **No product builds several candidates in parallel during a conversation and then picks one for the screen.**
   Every shipping system does one of three things:
   - builds **one** thing per explicit request (Claude visuals, Gemini Canvas, v0, Napkin, Gamma, Roblox 4D);
   - **picks** from a curated library at answer time (ChatGPT's 70+ interactive modules, Gemini's images and
     YouTube clips, Perplexity's TradingView charts);
   - **speculates one reply** and discards it if the transcript changes (LiveKit `preemptive_generation`, Deepgram
     Flux, Pipecat).

   **Napkin** comes closest: it shows *several* visual variations of the same text, but the *human* picks [S]. The
   owner's ask (build many in parallel as the talk moves, then show the right one) is unshipped anywhere. The
   pieces exist in three separate places:
   - speculative execution with commit-on-match (Speculative Actions, LiveKit);
   - non-blocking tools with result scheduling (Gemini Live INTERRUPT / WHEN_IDLE / SILENT);
   - library-first picking (ChatGPT, Khanmigo).

   Taxila would be first to combine them. That makes it a design problem with no reference implementation, so it
   must be measured, not copied.

2. **Everyone who ships visuals to learners at scale without an adult in the loop picks from a curated set rather
   than generating freely**, and the 2026 launches confirm the split [V/S]:
   - **ChatGPT interactive learning**: 70+ fixed concepts, March 2026.
   - **Khanmigo diagrams**: Gemini-generated, but limited to charts, geometric shapes and coordinate plots. Khanmigo
     decides the moment; launched August 2026 [V].
   - **Gemini Guided Learning**: pulls existing images, diagrams and YouTube clips [S].

   Free generation ships only where an adult iterates or checks first: Claude visuals, Gemini Canvas, MagicSchool,
   Diffit, and Brilliant's offline pipeline with "multiple rounds of human review" [V]. The one counter-example,
   **Alpha School**'s on-the-fly AI content, was found by a March 2026 investigation to include "illogical
   multiple-choice questions". Internal documents flagged some AI lesson plans as doing "more harm than good" [S]
   (Alpha disputes this).

   Read-across for Taxila: the "right one" must come from **spec-into-engine pieces whose truth is code** (STUDIO-V2
   T1). Free-form builds (LIVE-STUDIO) are the rare, gated exception. That is already Taxila's split, and this study
   adds evidence for it.

3. **The best existing scheduling vocabulary is Gemini Live's, and it is already in Taxila's code. The field's first
   real bug report on it is a warning.**
   - Gemini Live function calls are `NON_BLOCKING` by default on the 3.8 Live model. A result arrives with
     `INTERRUPT`, `WHEN_IDLE` or `SILENT` [V]. `server/duplex/triage.js` adopts exactly this [T].
   - LiveKit issue #7302 (September 2026) [V] found three problems:
     - scheduling is per session, not per tool;
     - the plugin falls into a hybrid blocking state (15/15 trials);
     - **tool results are held until the agent's speech finishes playing**. So `INTERRUPT` interrupts nothing and
       `WHEN_IDLE` arrives late: NON_BLOCKING + WHEN_IDLE succeeded **7/15 at 5.1 s median**, against BLOCKING
       3/10 at 16.8 s.

   Lesson: result scheduling has to be **owned by Taxila's code, per artifact**, and tested at the screen, not
   trusted to a framework flag. Taxila's governor already owns it [T].

4. **Speculation without a context guard puts stale content in front of the user, and it has happened in
   production frameworks.** LiveKit agents-js issue #1365 [V]: if the user speaks while a tool is running,
   preemptive generation starts a reply *before the tool result is in context*. The model "hallucinates the tool's
   outcome", and the user hears two near-duplicate replies, the hallucinated one first.

   LiveKit's documented guard is "if the chat context or tools change … the speculative response is discarded and
   regenerated" [V]. That covers the transcript but not in-flight work. **The visual equivalent is a pre-built piece
   for a misconception the child has since corrected**, revealed one turn late. Every candidate Stagecraft builds
   needs a **validity key over the conversation state it was built for**, re-checked at reveal time, not at build
   time (§6.3).

5. **Discard rates are published only for speech speculation, and they are high.**
   - Deepgram Flux eager end-of-turn: +50-70% LLM calls [T, duplex PRODUCTS].
   - Taxila's own M-D3 simulation: 77% of draft tokens wasted (3,621 per turn), ≈ $0.06 per lesson-hour [M].
   - LiveKit warns that long user turns make discards likelier [V].
   - Speculative Actions [V]: up to 55% next-action prediction accuracy buys up to 20% latency reduction. That means
     ≥ 45% of speculative actions are thrown away even in the best reported case.

   No product publishes how many *visual* candidates it builds and throws away. Gamma says it uses "20+ models" at
   once [S] for one deck, not as alternatives. **For Stagecraft the economics invert**: a spec-into-engine candidate
   costs about 3.25 s of a small model (STUDIO-V2 [M]) and microseconds to validate. A wasted spec is nearly free;
   a wasted live code build ($0.13-0.23 [M]) is not. Parallel candidates should therefore be **specs**, never races.

6. **Proactive is not the same as unrequested, and the learning evidence punishes the unrequested kind.**
   - In the two-year, 18-school Khanmigo RCT, the median student messaged Khanmigo on a third of practice days, and
     in only **17% of sessions in which they made a mistake**. When it gave hints instead of answers, students
     stopped using it. The overall effect was 0.06-0.08 SD per year, attributed mostly to Khan content [V/S,
     Oreopoulos et al.].
   - Khan's 2026 answer is to make help appear without being asked: diagrams "when it determines that a visual could
     help" [V], plus pop-ups after wrong answers [S]. Its evidence so far is "preliminary signs" of engagement and
     next-item correctness, with no numbers.
   - The multimedia literature points the same way: signalling and temporal contiguity have the largest effects, and
     seductive details cost recall, d ≈ −0.30 [T: learning-science §2.4].

   So a visual that arrives *on the teacher's cue, about the thing just said*, is strongly supported. A visual that
   arrives because it happened to be ready is not. **Readiness must never be the reason to reveal.**

7. **The strongest learning-impact evidence for generated multimodal content is Google's Learn Your Way** [V]. It
   produces five representations per textbook section (immersive text with images and questions, quizzes, narrated
   slides, audio dialogue, mind maps), personalised to grade and interests.
   - Experts rated it ≥ 0.85 on every pedagogical criterion.
   - In an RCT with n = 60 aged 15-18: **78% vs 67% on retention 3-5 days later** (+11 points), and +9% immediately.

   It is **pre-generated per section, not built during a live conversation**, and the learner chooses the
   representation. Its evidence supports *having several representations of the same idea ready*, which is exactly
   the Stagecraft pool. It does not support a model choosing among them mid-talk. That claim remains unmeasured
   anywhere.

8. **"Prep while it rings" is the cheapest parallel-build trick in production, and Taxila under-uses it at lesson
   start.** Duolingo Video Call generates the first question during the ringing animation, separately from the
   main call prompt, because a combined prompt "can often overload the LLM" [V]. Taxila's equivalent is the hook
   beat: 60-180 s of talk before the explain beat [T]. LIVE-STUDIO already uses that window for one live build
   (lookahead ≥ 90 s). The new finding is that the same window can fill a **pool of spec candidates** for every
   likely branch: the skill's known misconceptions, two modalities, the child's last-seen archetypes. This costs
   seconds, not a race.

9. **Perception-triggered tools exist and are fire-and-forget.** Tavus Raven fires vision or audio tools "the moment
   it detects something matching one of the tool descriptions", in parallel with the LLM turn. The event carries the
   triggering frames, and "the PAL does not pause, fill, or react to the result" [V]. Content goes back only through
   `append_llm_context` / `overwrite_llm_context` / `echo` [V].

   This is the shape Taxila's signals already have (`server/signals/**`, `server/voicesig/**` [T]): signals are
   SILENT inputs to the pool, never direct screen writes. Tavus confirms this works commercially, and it publishes
   no latency or debounce numbers.

10. **Dead products are evidence too.** Tome, the consumer AI-slides pioneer, shut its slides product on 2025-04-30
    with under $4M/year revenue and sub-1% conversion [S]. Users who had not exported lost their decks. Generation
    speed was never its problem; nobody paid for generated decks per se. The read-across is weak but real:
    **generation is not the product. The right piece at the right moment is.**

---

## 1. A taxonomy (so the products can be compared)

Five independent choices describe any system that puts content beside a conversation.

| axis | values seen in the field |
|---|---|
| **A. What is produced** | (a1) a pick from a curated library · (a2) parameters into a fixed module · (a3) a spec into a code engine · (a4) free code (HTML/JS/Manim) · (a5) pixels or meshes (image, video, 3D) |
| **B. Trigger** | (b1) explicit user request · (b2) the model decides inside its answer turn · (b3) anticipatory: planned or predicted before anyone asks · (b4) perception: something seen or heard fires a tool · (b5) speculative: built from partial input, committed or discarded |
| **C. Reveal timing** | (c1) inline as soon as ready · (c2) at the next idle point (WHEN_IDLE) · (c3) behind a veil, revealed on a cue · (c4) never shown, used as context (SILENT) · (c5) the human picks among several |
| **D. Staleness control** | (d1) none: whatever arrives shows · (d2) discard on context change (transcript or tool diff) · (d3) ephemeral by design: visuals "change or disappear" · (d4) versioned to a document the user edits · (d5) a validity key re-checked at reveal |
| **E. Breakage control** | (e1) none / user-reported · (e2) stream-time rewriting plus post-stream fixers · (e3) schema plus engine validation · (e4) human review before publication · (e5) a gate that plays the artifact against truth |

Where Taxila sits today [T]:
- **A**: a3 (STUDIO-V2, 16 engines, `validateSpec`), a4 as a gated exception (LIVE-STUDIO race), and a5 (image lane).
- **B**: b1 + b2 + b3 (beat plan, partial intent prefetch).
- **C**: c2 + c3 (triage WHEN_IDLE, veil).
- **D**: partly d2.
- **E**: e3 + e5.

**What the owner's item 17 adds is b5 for visuals, at pool width > 1, with d5.** Nobody ships that combination
(§0.1).

---

## 2. The comparison table

Latency is time from trigger to first useful frame unless noted. "Built / discarded" counts candidates per moment.

| product (date) | A what | B trigger | latency | C reveal | D stale | E broken | built / discarded | learning evidence | tag |
|---|---|---|---|---|---|---|---|---|---|
| **Tavus CVI perception tools** (2026) | a tool call carrying frames | b4 vision/audio, parallel to LLM | not published | c4: fire-and-forget, the result is not consumed by the LLM | n/a | n/a | 1 / 0 | none | [V] |
| **Tavus Griffin** (2026-10-01 preview) | speech + face video | continuous mini-turn decisions | 1,892 ms median response ⚠; 0.43 s A2V | c1 | model-internal | n/a | n/a | none (Turing n = 54) | [V, T] |
| **Gemini Live async tools** (3.8 Live) | any tool result | b2, NON_BLOCKING | tool-dependent; 5.1 s median WHEN_IDLE through LiveKit | c1 INTERRUPT / c2 WHEN_IDLE / c4 SILENT | app's job | app's job | 1 / 0 | none | [V] |
| **Gemini Live visual guidance** (2025-08) | box overlays on the camera feed | b2 | not published | c1 | live feed | n/a | 1 / 0 | none | [S] |
| **ChatGPT Voice in chat** (2025-11) | images, maps, charts, widgets beside speech | b2 | not published | c1, streamed with the transcript | per message | n/a | 1 / 0 | none | [S] |
| **ChatGPT interactive learning** (2026-03-10) | a1/a2: 70+ curated modules | b2 | instant (pre-built) | c1 | n/a | e4 (curated) | 1 / 0 | none published | [S] |
| **GPT-Live-1 delegation** (2026) | backend work on its own track | b2 / b5 | backend-dependent | channels: thinking (c4), commentary, instructions | work survives interruption | n/a | n/a | Speak: −80% thinking-pause interruptions | [T, S] |
| **LiveKit preemptive generation** | a speculative LLM reply (TTS optional) | b5 | saves the end-of-turn wait | c1 once committed | d2; bug #1365 | n/a | 1 per turn / discarded on transcript change | none | [V] |
| **Pipecat RTVI** | server messages and client-side tool calls | b2 or any processor | transport only | app's job | app's job | app's job | n/a | none | [V] |
| **Duolingo Video Call** | the first question, made during ringing | b3 (fixed moment) | hidden in the ring | c1 | per call | prompts + mid-call checks | 1 / 0 | none published | [V] |
| **Khanmigo diagrams** (2026-08-27) | a3/a4: Gemini interactive diagrams (charts, shapes, plots); reacts to drags | b2 ("detects the moment") | not published | c1 | n/a | not described | 1 / 0 | "preliminary signs"; Khanmigo RCT 0.06-0.08 SD/yr | [V] |
| **Gemini Guided Learning** (2025-08) | picks images, diagrams, YouTube | b2 ("proactively") | search latency | c1 | n/a | source curation | 1 / 0 | none | [S] |
| **Google Learn Your Way** (2025-09) | 5 representations per section | b3 (pre-generated) | n/a | c5 (learner picks) | n/a | e4 (expert eval ≥ 0.85) | 5 / 0 | **+11 pts retention, n = 60 RCT** | [V] |
| **Brilliant** | a3: puzzle variants into an engine | offline | "seconds" per asset | after human review | n/a | e3 + e4 | many / review-filtered | none for the AI part | [V] |
| **Synthesis Tutor** | authored lessons and manipulatives, AI adaptation | b2 path choice | instant (authored) | c1 | n/a | e4 ("carefully reviewing every lesson") | n/a | none independent | [S] |
| **Alpha School** | questions, stories, examples "on the fly" | b3 / b2 | not published | c1 | n/a | contested | n/a | vendor: 2.3-2.6× MAP growth; experts cannot verify; investigation found faulty items | [S] |
| **MagicSchool / Diffit** | leveled texts and question sets for teachers | b1 | seconds | to the teacher first | n/a | e4 (the teacher) | 1 / 0 | none causal; reading level off by about ±1 | [S] |
| **Claude visuals in chat** (2026-03-12) | a4: inline HTML/SVG | b1 + b2 ("Claude will decide") | streamed | c1 | **d3: "change or disappear as the conversation evolves"** | e1 | 1 / replaced | none | [V] |
| **v0** | a4: code | b1 | streamed | c1 into a preview | d4 | **e2: LLM Suspense ≤ 100 ms, autofixers < 250 ms; raw LLM errors up to 10%** | 1 / 0 | n/a | [V] |
| **Napkin** | diagrams from text | b1 (spark icon) | "seconds" | **c5: several variations, the human picks** | n/a | the human | N / N−1 | n/a | [S] |
| **Gamma** | a whole deck | b1 | ≈ 30-60 s | streamed per card | d4 | "20+ models" | 1 / 0 | n/a | [S] |
| **Tome** | decks | b1 | n/a | n/a | n/a | n/a | n/a | shut down 2025-04-30 | [S] |
| **Copilot Pages** | a4/text on a persistent canvas | b1 | streamed | c1 | d4 (a multiplayer document) | e1 | 1 / 0 | n/a | [S] |
| **Perplexity inline visualizations** (2026-10) | a2: TradingView charts with data | b2 | not published | c1 | live data | library-rendered | 1 / 0 | n/a | [S] |
| **Roblox Cube 4D** (beta 2026-02) | a5 + scripts: schema objects (Car-5, Body-1) | b1 (player prompt) | **20-40 s** | appears in-world | n/a | **schema decomposition + safety filter on prompt and output** | 1 / 0 | +64% play time in one experience | [V] |
| **3Blue1Brown / Manim agents** | a4 → video | offline | minutes per scene | after render | n/a | render success 66.7-93.8%; critic loops | N retries / N−1 | Code2Video +40% TeachQuiz | [T, S] |
| **Speculative Actions** (research) | the next agent action | b5 | −20% at best | commit on match | d2 | lossless by construction | ≥ 45% discarded | n/a | [V] |

---

## 3. Product deep-dives

### 3.1 Voice and video agents that work in parallel

#### Tavus (CVI, Raven perception tools, Interactions Protocol, Griffin)

- **What runs in parallel [V].** Perception tools are "a parallel step alongside the conversational LLM", split by
  `origin: "vision" | "audio"`. Raven watches the streams continuously and fires a tool when what it sees matches a
  tool description written in `visual_tool_prompt` (formerly `perception_tool_prompt`). The app receives
  `conversation.perception_tool_call` with the tool name, structured arguments and, for vision, the base64 frames
  that triggered it.
- **Reveal.** "Fire-and-forget: the PAL does not pause, fill, or react to the result on the conversational side."
  The response body "is not consumed by the conversational LLM; a 2xx is enough" [V]. To change what the replica
  says, the app sends `conversation.append_llm_context` or `overwrite_llm_context`. To dictate the words exactly, it
  sends `conversation.echo` [V].
- **Stale / broken.** The docs give no latency, debounce, deduplication or rate limits [V], so all of that is the
  app's job.
- **Griffin** (see duplex PRODUCTS §2.1 [T]) decides at sub-second intervals what to say and how. It "builds while
  talking" through one model, with no tool or visual-artifact story published.
- **Take for Taxila.** The three-channel split matches Taxila's design: a perception event is SILENT context, a
  context append steers the model, and an echo sends exact words. Taxila's signals should only ever *nominate* and
  *invalidate* pool candidates. They never put anything on the stage directly. The frames-on-the-event pattern is
  worth copying for audit: store *why* a candidate was nominated (the signal and partial that triggered it) next to
  the candidate.

#### Google Gemini Live (async tools, visual guidance) and the LiveKit evidence

- **Mechanism [V].** On `gemini-3.8-live`, function calls are NON_BLOCKING by default. The model keeps talking,
  fills, and answers follow-ups while the client runs the tool. The tool response carries a scheduling value:
  - `INTERRUPT`: stop the current generation and use the result now;
  - `WHEN_IDLE`: wait until the current turn completes;
  - `SILENT`: absorb it without responding.
- **⚠ Doc disagreement.** The ai.google.dev tools page still says async calling "is not yet supported in Gemini 3.1
  Flash Live" and that the model waits for the tool response [V]. The 3.8 Live developer guide and Vertex docs say
  async is the default [V/S]. Model version decides behaviour, which is one more reason not to depend on it.
- **Measured in the wild.** LiveKit issue #7302 [V], 15 trials per arm on a mid-call persistence task:

  | arm | succeeded | median latency |
  |---|---|---|
  | NON_BLOCKING + WHEN_IDLE | 7/15 | 5.1 s |
  | BLOCKING | 3/10 | 16.8 s |
  | Gemini 3.1 Flash | 4/10 | 19.2 s |

  The root cause is the framework, not the model: "function responses are held until speech playback completes", so
  INTERRUPT cannot interrupt. No maintainer response was visible.
- **Visual guidance (2025-08) [S].** While the camera is shared, Gemini Live draws white-bordered boxes around the
  object it is talking about and dims the rest. That is the simplest form of "show the right thing at the right
  moment": a *pointer* into what is already on screen, synchronised to speech. A July 2026 leak says Google is adding
  a toggle to turn the highlights off [S], which suggests some users find unrequested overlays intrusive [E].
- **Take for Taxila.** Keep the vocabulary (already in `triage.js`), but own the clock. A WHEN_IDLE reveal fires at
  the **governor's** turn boundary, never at "TTS finished playing". The highlight pattern is cheap and strong: when
  a piece is already on stage, the right move is often to *point within it* (an engine knob or a timeline seek, as
  in STUDIO-V2 §7), not to build a new one.

#### OpenAI: ChatGPT Voice with visuals, interactive learning, GPT-Live-1 delegation

- **ChatGPT Voice in chat (2025-11) [S].** Voice now runs inside the chat thread. Spoken answers come with streamed
  text and "images, charts, map cards, and interactive widgets" in real time. The widgets come from the same tools
  as text chat (search images, maps), picked at answer time. Nothing is built ahead.
- **Interactive learning (2026-03-10) [S].** More than 70 maths and science concepts (Ohm's law, Hooke's law,
  compound interest, Coulomb's law…) appear as manipulable modules: change a variable and the graph updates. These
  are curated modules (a1/a2), picked in-turn. That is why they never break [E].
- **GPT-Live-1 (2026) [T].** A live duplex front-end plus a backend on an independent track; "interrupting speech
  doesn't cancel that work". Results come back through `thinking` (quiet), `commentary` (say this) and
  `instructions` (trusted). Price ≈ $0.05/min [S], so about $3/h, which is why the owner dropped it [T]. Speak
  reports about 80% fewer thinking-pause interruptions than turn-based systems [S].
- **Take for Taxila.** OpenAI's learner-facing visuals are **picked, not built**. Its builder track (GPT-Live
  backend) is where parallel work happens, and that track's results land as context first and speech second.
  Visual results should follow the same order: they enter the pool silently, and the teacher's line, not the
  builder, decides when they appear.

#### LiveKit and Pipecat (the frameworks)

- **LiveKit `preemptive_generation` [V].** On by default. It "speculatively starts an LLM response before the user's
  end of turn is confirmed". It is discarded and regenerated "if the chat context or tools change in the
  `on_user_turn_completed` node", or if the final transcript differs. TTS waits for confirmation unless
  `preemptive_tts` is set. The docs warn that long user turns (dictation, storytelling) make discards likelier.
- **The bug (agents-js #1365) [V].** When the user speaks during an in-flight tool, the guard has no current speech
  to check, so a reply is generated from stale context and "hallucinates the tool's outcome". The user hears it,
  then the real reply. The proposed fix is a `_new_turns_blocked` style flag while tools are in flight.
- **Pipecat RTVI [V].** Any processor can push an `RTVIServerMessageFrame` to the client at any time. LLM function
  calls can be executed client-side via `llm-function-call` messages. This is transport; staleness and reveal policy
  are the app's job.
- **Take for Taxila.** Two concrete rules:
  1. A speculative candidate's validity key must include **in-flight work** (pending grades, pending classifier,
     pending safety read), not only the transcript.
  2. Pushing to the client is trivial. Deciding is the product, so the stage protocol should carry *proposals*,
     and the reveal decision stays server-side in the kernel (W2-H `slotFor` [T]).

#### Duolingo Max Video Call (Lily)

- **[V]** The prompt is built as three characters (System coach, Assistant Lily, User). A **"Conversation Prep"**
  stage generates the first question *while the call rings*, separately, because one combined prompt overloads the
  model. Mid-call, the System keeps evaluating ("Did the learner talk about something Lily loves? … something
  inappropriate? If yes, hang up now!"). After the call, the transcript becomes a "List of Facts" for future calls.
- **Visuals.** Lily's animated face only; no generated content on screen.
- **Take for Taxila.** Use a fixed, guaranteed dead window to prepare (Taxila's hook beat and the greeting). Keep
  the preparation prompt separate from the live prompt (recitation and overload laws). Keep a hard safety exit that
  ends everything at once (Taxila: nothing reaches the stage during a safety turn).

#### Speak (Live Tutor Lessons on GPT-Live-1)

Covered in duplex PRODUCTS §0.5 [T]: 476/477 authored lesson lines delivered, and thinking-pause interruptions
13.6% framed as a tutor vs 27.6% as a generic assistant. **Content is authored; the live model runs the moment.**
Speak shows no generated visuals. The relevant lesson is that authored content plus a live delivery layer reaches
near-perfect fidelity. That is the same promise as spec-into-engine.

### 3.2 Learning products

#### Khanmigo (Khan Academy)

- **2026 diagrams [V, 2026-08-27].** "Khanmigo can now detect the moment when a visual may help a student and, with
  Gemini, can generate an interactive diagram accordingly": charts, geometric shapes, parallel coordinate plots.
  Students can drag elements and Khanmigo reacts to where they placed them. No latency, validation or correctness
  method is published. Results are "preliminary signs of increased student engagement and improvement in next-item
  correctness", with no numbers.
- **Trigger:** b2, Khanmigo decides. **Reveal:** c1 inline in the chat. **Stale/broken:** undisclosed.
- **The RCT (Oreopoulos et al., NBER w35620) [V/S].**
  - Design: 18 Tennessee middle schools, two years.
  - Effect: +1.3 national percentile ranks per term, about 0.06-0.08 SD per year (implied 0.14 SD for a full year
    of active use).
  - Engagement: the median student messaged Khanmigo on a third of practice days, and in only 17% of sessions with
    a mistake. Students stopped using it when it refused answers and gave hints.
  - Attribution: authors credit the gains mostly to Khan's content, not the tutor.
  - A follow-up in which the AI pops up without being asked had no published numbers as of this study [V,
    FutureEd].
- **Take for Taxila.** The child-pull problem is real. A help channel the child must *invoke* is barely used. That
  argues for teacher-led reveals (the teacher says "dekho" and the piece is there) over a "tap for a diagram"
  button. It also warns that proactive does not equal effective until measured. Khanmigo's diagram types are the
  same set Taxila's whiteboard and chart engines cover, and Khan chose *types with computable truth*.

#### Google: Gemini Guided Learning and Learn Your Way

- **Guided Learning (2025-08) [S].** Stepwise Socratic tutoring that "proactively" embeds images, diagrams and
  YouTube clips (photosynthesis, cell parts), plus quizzes with charts and flashcards. Visuals are *retrieved*, not
  built.
- **Learn Your Way (Google Research, 2025-09) [V].**
  - Output: five representations per section (immersive text with embedded images and questions, section quizzes,
    narrated slides, audio teacher-student dialogues, mind maps), personalised to grade and interests.
  - Build: Gemini 2.5 Pro plus fine-tuned illustration models and agentic workflows for narrated slides.
  - Quality: three subject experts rated outputs ≥ 0.85 on accuracy, coverage and the LearnLM principles.
  - RCT: n = 60, ages 15-18, against a PDF reader. +9% immediate; **78% vs 67% retention at 3-5 days**; 93% vs 67%
    want to use it again.
- **Take for Taxila.** This is the best evidence that **multiple representations of the same idea, ready at once,
  improve retention**. The pool concept is supported. Two cautions:
  - the learner chose the representation, and the content was pre-generated and expert-checked;
  - n = 60 teenagers in one sitting is far from classes 1-9 in Hinglish voice.

  Stagecraft should log which representation won and why, so Taxila can produce its own version of this result.

#### Brilliant

- **[V]** AI produces "the technical implementation": an interactive puzzle and solution, plus variants "while
  keeping the same learning objective". Humans own "the learning objective, the progression, and the 'aha moment'",
  because "AI can't meet the bar for level design". Gear-train puzzle generation went from 0% to 93% success in
  48 hours once the engine's representation was made LLM-friendly. "Every generated problem also goes through
  multiple rounds of human review." Generation is offline; the scale target is 1,000+ problems per course.
- **Take for Taxila.** The 0 → 93% jump came from **changing the engine representation, not the model**. That is
  STUDIO-V2's bet (specs designed for models). Brilliant does not generate live. Taxila's live spec rung stands
  where Brilliant's human review stands, so the engine validators carry that weight.

#### Synthesis Tutor

- **[S]** Ages 5-11, maths. A conversational tutor with digital manipulatives. The company says it "deliberately
  [does] not outsource education teaching to an LLM" and reviews every lesson and interaction. AI adapts path and
  difficulty in real time. No engineering detail is public, and no independent efficacy study was found.
- **Take for Taxila.** The highest-regarded kids' maths tutor runs authored manipulatives with AI choosing the path.
  That is Stagecraft's "pick the right one" layer with a hand-authored pool.

#### Alpha School (2 Hour Learning)

- **Vendor claims [S].** A "Generative AI engine creates new content (questions, stories, and examples) on the
  fly"; 90% mastery gates on a knowledge graph; MAP growth 2.3-2.6× peers.
- **Counter-evidence [S].** A March 2026 investigation (Emanuel Maiberg, from internal documents) found
  poorly-constructed AI lesson plans and illogical multiple-choice questions, some flagged internally as "more harm
  than good". A July 2026 piece says experts cannot verify the doubled-learning claim. Alpha disputes both.
- **Take for Taxila.** Unverified on-the-fly *question* generation is exactly what Taxila's laws forbid: grading only
  from verified keys, and truth from the kit. Alpha's mastery gate is admirable. Its content generation is the
  anti-pattern.

#### MagicSchool and Diffit (teacher-facing generators)

- **[S]** Diffit levels any source text and adds 3 MCQ, 3 short-answer and 3 open questions in seconds. Reviewers
  report it is often about one reading level off from the one requested. Both tools generate for a teacher who reads
  before the student sees anything.
- **Take for Taxila.** Their safety model is a human gate, and Taxila has no human in the live path. The measured
  ±1 reading-level miss is a warning for any generated Hindi/English text on stage: Stagecraft strings must pass the
  same band check as the teacher's speech.

### 3.3 Generative UI and visual builders

#### Claude visuals in chat and artifacts

- **Visuals (2026-03-12 beta) [V].** On by default. "Claude will decide when to build a visual for something, or you
  can ask it to do so directly". They are inline, **"temporary: they change or disappear as the conversation
  evolves"**, unlike artifacts. Users can ask for adjustments. Web and desktop only at launch [S]. A
  third-party post reports the visualizer breaking and gives a workaround [S], so breakage reaches the user.
- **Take for Taxila.** "Ephemeral by design" is the right staleness model for a conversation. A visual belongs to
  the moment it served and should leave when the talk moves on. Taxila's stage contract (one piece at a time, swaps
  at turn boundaries [T]) is the stricter version of this. Claude shows no gate before display, so a broken visual
  is visible; Taxila cannot accept that (R9).

#### v0 (Vercel), Bolt, Lovable

LIVE-STUDIO §1 covers these [T]. New numbers from Vercel's agent post [V]:
- raw LLMs make code errors "as often as 10% of the time";
- **LLM Suspense** rewrites the stream in under 100 ms with no model call (for example, swapping a hallucinated
  lucide icon for a real export);
- **autofixers** run in under 250 ms "only when needed";
- the composite pipeline adds a "double-digit increase in success rates": v0-1.5-md 93.87% error-free vs 64.71%
  raw [T].

Taxila's stream guard copied this and paid for it once: the `www` rule ate the SVG namespace and broke 10 of 17
failed arms (`rj-w2f-www-rule-ate-svg-namespace` [T]).

#### Napkin

- **[S]** Click a spark beside a paragraph and Napkin offers **multiple visual options** (diagram, flowchart, mind
  map, infographic) within seconds, in several styles. The human picks one.
- **Take for Taxila.** This is the only shipping **N-candidates, pick-one** UX found. In Napkin the picker is the
  user. In Taxila the picker must be code (the kernel), because a child in a voice lesson should never be asked to
  choose between three diagrams of the same idea mid-explanation. Choice is good for children only for 2-4
  *instructionally irrelevant* options [T: learning-science §2.4, Patall 2008]. Child-facing choice could be "game or
  story?" at a beat boundary, never "which diagram?".

#### Gamma and Tome

- **Gamma [S].** A whole deck from one prompt in about 30-60 s, streamed card by card. It reportedly uses "20+ AI
  models simultaneously for text, image generation, layout, and design consistency": parallel *components* of one
  artifact, not alternatives.
- **Tome [S].** Shut down 2025-04-30 (see §0.10).
- **Take for Taxila.** Card-by-card streaming is a good *reveal* grammar for multi-part pieces (an explainer with
  beats). Parallel component builds (image ∥ strings ∥ layout) are how a single Stagecraft candidate should be
  assembled. The image lane runs beside the spec, and code draws labels [T: D10].

#### Microsoft Copilot Pages

- **[S]** A persistent, multiplayer canvas beside the chat. Copilot writes into the page, and the page (not the
  chat) is the durable artifact. Since GPT-5 it can write code onto a page for interactive reports.
- **Take for Taxila.** The **notebook** pattern. What survives the lesson is a page of the pieces the child used,
  which is RS-4's "made-for-you shelf" [T]. It is not a live-moment pattern.

#### Perplexity inline visualizations

- **[S, 2026-10]** Perplexity Computer renders interactive charts inline. Financial series use **TradingView
  Lightweight Charts**, a trusted library fed with retrieved data, not generated chart code. Follow-ups add
  indicators or change the period in place.
- **Take for Taxila.** Data into a trusted renderer, then follow-ups as *knob changes on the same piece*. That is
  STUDIO-V2's steering rule ("harder", "show me again" → no new generation [T]).

### 3.4 Games, worlds and programmatic animation

#### Roblox Cube (3D → 4D generation)

- **[V, beta thread]** A player prompt produces an object decomposed by a **schema** (`Car-5`: body plus four
  wheels; `Body-1`: a single mesh). Scripts are attached so the object works: you can get in the car and drive.
  - Latency: 20-40 s.
  - Safety: "all prompts and outputs go through Roblox safety filters". IP, brand and weapon rules follow the
    experience's content rating.
  - Limits: 10 requests per minute per experience to start; objects do not persist yet; custom schemas are planned
    for later in 2026.
  - Usage: 160,000+ objects in early access, and **+64% play time** among players who used it in one experience
    [S].
- **Take for Taxila.** Roblox's answer to "generated content that works" is the same as STUDIO-V2's: **a schema
  owned by the engine, with the model filling parts**. 20-40 s is the honest latency for pixels or meshes, so meshes
  and images belong in the pool *ahead* of need, never on demand mid-turn. The engagement number is not a learning
  number.

#### Game-engine streaming and procedural content (general practice)

These are well-established techniques, stated from general engineering knowledge [E], and they map directly onto
Stagecraft:
- **Predictive asset streaming.** Open-world engines load what the player is *likely* to need next (by position,
  heading and speed), at coarse detail first. Wrong guesses are evicted.
- **Level of detail and impostors.** A cheap stand-in is always available and is swapped for the full asset when
  it arrives. The rule is "never a hole, sometimes a low-res thing".
- **Pop-in avoidance.** A swap happens when the change is least noticeable (at distance, behind occluders, during
  a camera cut), never in the centre of attention.
- **Deterministic seeds.** Procedural content regenerates identically from (seed, parameters), so it can be cached,
  shared and audited.

Read-across [E]:
- Taxila's skeleton (≤ 300 ms, code) is the LOD-0 impostor.
- The fallback ladder is the mip chain.
- The turn boundary is the camera cut.
- The library identity key (LIVE-STUDIO D11) is the seed.

The missing piece is the predictive part: a **heading** over the conversation (where it is likely to go) that
decides which candidates to stream in.

#### 3Blue1Brown-style programmatic animation (Manim and its agents)

- STUDIO-V2 §2 and world-best §1.4 cover this [T]: ManiBench 66.7% render; ManimAgent 19-31 min per task.
- TheoremExplainAgent [S]: o3-mini agent 93.8% success at up to 5 retries, videos up to 10 minutes. Most failures
  are Manim code hallucinations.
- Code2Video: +40% TeachQuiz with a planner-coder-critic loop [T].
- **Take for Taxila.** Retry-until-render implies about 1-5 builds per kept video, with minutes of latency. Manim is
  an offline library lane. Live cinematic animation (item 4) comes from the engine-timeline approach in STUDIO-V2
  (`orbital-explainer@1`: compiled cues from measured audio), not from live Manim.

### 3.5 Speculation research (the commit-or-discard machinery)

| work | idea | number | tag |
|---|---|---|---|
| **Speculative Actions** (Columbia, 2510.04371) | a fast model predicts the next agent action; run it in parallel; commit only on match ("as-if-sequential, lossless") | up to 55% next-action accuracy → up to 20% latency reduction | [V] |
| **SPORK** (2607.03333), **Speculate with Memory** (2607.12236), **DualSpec** (2603.07416), **AOSpec** (2608.00881) | self-speculative forking; memory-informed speculation; dual-process speculation for research agents; co-speculating actions and observations | abstracts only, not read for numbers | [S] |
| **Endpoint anticipation** (duplex ARCHITECTURE §4.4) | start replies on projected turn-end | −505 ms for +28.4% compute | [T] |

**Take for Taxila.** The lossless property is the one to copy. A speculative visual candidate never changes what the
child sees *unless* it matches what the kernel would have chosen anyway at the boundary. If it matches, it is shown
early-ready. If not, it is discarded and the child sees exactly what a non-speculating system would have shown.
Under this rule speculation can only make things faster, never different, which keeps the safety and correctness
analysis of the non-speculative path valid.

---

## 4. Cross-cutting answers to the five questions

### 4.1 Explicit vs anticipatory triggers

| trigger | who ships it | what it is good for | what goes wrong |
|---|---|---|---|
| explicit (b1) | Claude, v0, Napkin, Gamma, Roblox, MagicSchool | intent is certain | the child rarely asks: 17% of mistake sessions in Khanmigo's RCT |
| in-turn model decision (b2) | ChatGPT Voice, Khanmigo diagrams, Gemini Guided Learning, Claude visuals | relevance to the current sentence | latency equals build time; correctness depends on the generator |
| anticipatory / planned (b3) | Duolingo (ring), Learn Your Way (pre-gen), LIVE-STUDIO beat plan | latency hidden | built for a branch that may not happen |
| perception (b4) | Tavus Raven, Gemini visual guidance | reacts to what is seen or heard | no published latency or debounce; false fires |
| speculative from partials (b5) | LiveKit, Deepgram, Pipecat (speech only) | the earliest start | stale context (#1365), high discard rate |

**No product combines b3 + b5 for visuals.** Item 17 asks for exactly that.

### 4.2 Latency (the honest numbers)

| kind of content | latency | source |
|---|---|---|
| pick from a curated library or module | under 1 s (render only) | ChatGPT modules [S]; Taxila library mount ≤ 300 ms [T] |
| spec into an engine (small model) | about 3-4 s | STUDIO-V2 3.25 s p50 [M] |
| inline HTML/SVG visual (frontier model, streamed) | seconds to tens of seconds | Claude visuals [V, no number]; LIVE-STUDIO first paint 6-40 s [M] |
| full interactive (code) | 20-60 s plus a 5-12 s gate | LIVE-STUDIO race p50 37-54 s [M] |
| deck or multi-part document | 30-60 s | Gamma [S] |
| image | 4-6 s (FLUX) / 17-19 s (gpt-image-2 low) | LIVE-STUDIO D10 [M] |
| 3D object | 20-40 s | Roblox [V] |
| programmatic video | minutes | Manim agents [T/S] |
| WHEN_IDLE tool result through a framework | 5.1 s median | LiveKit #7302 [V] |

The conclusion is plain. **Only the first two rows fit inside a conversational turn.** Everything else must be
built ahead (b3) or arrive "opportunistic" (LIVE-STUDIO §2).

### 4.3 How products avoid stale content

1. **Discard on context diff** (LiveKit, Speculative Actions). Simple. It misses in-flight work (#1365).
2. **Ephemerality** (Claude visuals). The content belongs to a moment and leaves with it.
3. **Persistent document with versions** (v0, Copilot Pages, Gamma). Staleness becomes "an older version", and the
   user edits forward. Not applicable to a child's live lesson.
4. **Live data binding** (Perplexity, Gemini visual guidance). The content redraws from current data.
5. **Validity keys re-checked at reveal.** *Not found in any product.* This is the CPU branch-prediction and
   Speculative Actions discipline applied to UI: check at commit, not at issue.

### 4.4 How products avoid broken content

1. **Curate** (ChatGPT modules, Gemini retrieval, Synthesis, Perplexity's TradingView). Never broken, but narrow.
2. **Human review before learners** (Brilliant, MagicSchool, Diffit, Learn Your Way's expert eval). Not available
   live.
3. **Schema and engine** (Roblox schemas, Brilliant's representation, STUDIO-V2 specs). The model can only fill
   slots the engine knows how to run.
4. **Stream rewriting plus fixers** (v0). Fewer errors, still about 6% error rate.
5. **Play-the-artifact gate** (Taxila LIVE-STUDIO, GameASG-style). Behaviour checked against truth before display.
6. **Nothing** (Claude visuals, Alpha School by the investigation's account). Broken output reaches the user.

### 4.5 How many are built and discarded

| system | built per kept piece | basis |
|---|---|---|
| LiveKit preemptive | about 1.5-2 replies per kept reply (+50-70% calls, Deepgram analogue) | [V/T] |
| Taxila speech drafts (M-D3) | 77% of tokens wasted | [M] |
| Speculative Actions | ≥ 1.8 speculations per kept action (≤ 55% hit) | [V] |
| Napkin | N options, 1 kept by the human | [S] |
| Manim agents | 1-5 builds per kept render | [S/T] |
| Taxila live race | 2 arms, 1 kept (plus ≤ 2 repairs) | [T] |
| everyone else | 1 built, 1 shown | — |

Nobody publishes a figure for visual candidates discarded *because the conversation moved*. Stagecraft's eval must
create this metric (§7).

### 4.6 Learning impact (all of it)

| evidence | strength | what it says about parallel-and-pick |
|---|---|---|
| Learn Your Way RCT, +11 pts retention, n = 60 | moderate (small, teens, vendor-run) | several representations ready → better retention; the learner chose |
| Khanmigo RCT, 0.06-0.08 SD/yr, 18 schools | strong design, weak tutor effect | help that must be asked for goes unused; tutor effect not separable |
| Khanmigo diagrams, "preliminary signs" | none (no numbers) | — |
| Alpha School 2.3-2.6× MAP | unverifiable; contested | — |
| Code2Video +40% TeachQuiz | a benchmark, not learners | planned and critiqued video beats one-shot |
| Roblox +64% play time | engagement, not learning | generated objects are compelling |
| Multimedia meta-meta-analysis (Noetel 2022) | strong | signalling and temporal contiguity are the largest effects; design matters most for **system-paced** media (a voice tutor) [T] |
| Seductive details (Rey 2012) | strong | irrelevant extras cost recall, d ≈ −0.30 [T] |
| In-game success ≠ mastery (DragonBox) | strong | evidence from pieces must be weighted and paired with transfer probes [T] |

**No study anywhere measures learning from content chosen by a model mid-conversation, compared with content
planned in advance.** Taxila would produce the first such number. The A/B should be designed in from day one (§7).

---

## 5. The learning-science constraints on "showing the right one"

These are rules, each traced to evidence above or in `learning-science.md` [T].

1. **Show it when she talks about it.** Temporal contiguity and signalling are the largest multimedia effects. A
   piece revealed one sentence late is worse than none, because the child splits attention between her current line
   and a picture of the previous one. Reveal is bound to the teacher's line (LIVE-STUDIO D9; W2-H facts row built
   *after* arbitration, `rj-w2hfix-facts-row-before-arbitration` [T]).
2. **Relevance beats readiness.** A ready piece that does not serve the current beat is a seductive detail.
   `rj-studio-reveal-on-clock-only` (2/2 probes: an explain piece landed as practice started and was ignored [T]) is
   the local proof.
3. **The child does not pick between alternatives of the same idea.** Choice helps when it is instructionally
   irrelevant and limited to 2-4 options (Patall 2008). Napkin-style "pick a diagram" is wrong for a 9-year-old
   mid-explanation. The kernel picks.
4. **Help that must be invoked goes unused** (Khanmigo, 17%). Teacher-led reveal is the default. The child's "dikhao"
   is honoured at the next turn boundary as an *urgent* WHEN_IDLE (already in `triage.js` [T]).
5. **Evidence from pieces is discounted** (×0.75, paired with transfer probes [T]). A piece that is "right" for the
   moment is one whose interaction produces the evidence the learner model needs next. The picker should score this
   value of information, not engagement.
6. **One thing at a time** (DESIGN-V3 stage contract [T]). Parallelism lives in the pool, never on the stage.

---

## 6. Implications for Stagecraft (inputs to the architecture study, not the architecture)

### 6.1 What to copy, from whom

| take | from | how it lands in Stagecraft |
|---|---|---|
| non-blocking work with result classes INTERRUPT / WHEN_IDLE / SILENT | Gemini Live [V]; already in `triage.js` [T] | every candidate result is SILENT into the pool; only the kernel turns a pool entry into a WHEN_IDLE reveal; INTERRUPT is safety only and *clears* the pool |
| own the clock, not the framework's | LiveKit #7302 [V] | the reveal fires on the governor's boundary, not on TTS playout end |
| commit on match, lossless | Speculative Actions [V] | a speculative candidate is shown only if it equals what the boundary decision picks; otherwise discarded |
| block speculation while work is in flight | LiveKit #1365 [V] | the validity key includes pending grade, classify and safety; a candidate built before a pending result lands is re-checked |
| prep in a guaranteed dead window, with a separate prompt | Duolingo ring [V] | the hook beat fills the pool for every likely branch; the prep prompt is not the live prompt |
| perception nominates, never displays | Tavus Raven [V] | signals and voicesig nominate or invalidate candidates; they never write the stage |
| ephemeral visuals | Claude [V] | a piece leaves when its beat ends; the notebook keeps it |
| point within what is on stage | Gemini visual guidance [S]; Perplexity follow-ups [S] | prefer a knob change or timeline seek on the current piece over a new candidate |
| schema owned by the engine | Roblox [V], Brilliant [V] | candidates are specs into the 16 engines; free code is the gated exception |
| multiple representations ready | Learn Your Way [V] | the pool holds 2-3 modalities of the same idea per likely branch |
| predictive streaming plus impostors | game engines [E] | a conversation heading drives prefetch; the skeleton is the impostor; the swap happens at the "camera cut" (turn boundary) |
| stream rewriting plus fixers, tested against legitimate forms | v0 [V]; `rj-w2f-www-rule-ate-svg-namespace` [T] | any Stagecraft rewriter ships with goldens for everything it removes |

### 6.2 What not to copy

- **Free generation of questions or answers on the fly** (Alpha School): violates "grading only from verified keys".
- **Inline-as-soon-as-ready reveal** (ChatGPT Voice, Claude visuals, Khanmigo): violates contiguity and the stage
  contract when the build is slower than the sentence.
- **Making the user pick among candidates** (Napkin): wrong for children mid-explanation.
- **Framework-owned scheduling** (LiveKit + Gemini): proven to delay and misfire.
- **Live Manim or live meshes in the turn**: minutes and 20-40 s. Ahead of need only.

### 6.3 The one new mechanism the field lacks: a validity key re-checked at reveal

[E] proposal for the architecture study. Every pool candidate carries the conversation state it was built for:

```
validFor = { skill, beat, targetMisconception | null, band, lang, kitHash,
             learnerRev (ledger version at build), floorRev (last committed turn id),
             pending: [ids of grades/classifies/safety reads in flight at build] }
```

At the boundary the kernel re-derives the *current* state and admits a candidate only if all of these hold:
- skill, beat, band, lang and kitHash are equal;
- the misconception is still active in the learner model, at the version now, not at build;
- no safety turn is open;
- every `pending` id has resolved *in a way that does not change the choice*.

Otherwise the candidate is discarded and counted. This is the visual analogue of LiveKit's context diff, closing the
in-flight hole that #1365 exposed. Discards cost almost nothing because candidates are specs (§0.5).

### 6.4 Sizing the pool (from the economics in §4.2)

[E] starting values for the eval to test:
- **Specs:** up to 3 live candidates per likely branch, about 2-3 branches open at once, so about 6-9 small-model
  calls per beat at about 3 s each, all cancellable. At gpt-5.6-luna-class prices this is cents per lesson-hour
  [E, the same order as M-D3's $0.06].
- **Images:** only for the top branch, FLUX lane first, and only from the hook beat onwards (capacity-limited [T]).
- **Live code races:** unchanged at ≤ 3 per lesson (`CAPS.liveBuildsPerLesson` [T]), planned, never speculative.

---

## 7. Measurements this study asks for (none exist in the field)

| id | metric | why | how |
|---|---|---|---|
| SP-1 | **stale-reveal rate**: reveals whose `validFor` no longer matched the state (must be 0) | the #1365 failure class, for visuals | replay TaxilaFDB-style scripted lessons with mid-turn corrections; count |
| SP-2 | **pool hit rate**: share of boundary decisions served from a ready candidate | the speculation payoff (Speculative Actions: ≤ 55%) | the same replays; per trigger type |
| SP-3 | **discard rate and $ per lesson-hour** | the field publishes none for visuals | count candidates built vs revealed; cost from usage fields |
| SP-4 | **boundary-to-first-frame p50/p95** for pool hits vs misses | STUDIO-V2 target p95 ≤ 4 s for "show me" | timestamps at the governor and the stage |
| SP-5 | **contiguity**: the reveal lands within the teacher's referring line | the largest multimedia effect | align the reveal timestamp with the line that names the piece |
| SP-6 | **picked-vs-planned learning A/B**: next-item correctness and delayed retrieval with pieces chosen at the boundary vs pieces fixed by the beat plan | no study anywhere | within-child alternation across beats, kit-keyed probes only |
| SP-7 | **visible-failure count** (must be 0) | R9 | the stage contract validator log; any non-ladder frame counts |

---

## 8. Proposed `context/` entries (for the main loop to merge; not written to `context/` by this study)

- **measurement** `stagecraft-study-products-2026-10-05`: n/a (desk study). It records LiveKit #7302 (WHEN_IDLE 7/15
  at 5.1 s; BLOCKING 3/10 at 16.8 s, n = 15/10), Learn Your Way (+11 pts, n = 60), and the Khanmigo RCT (0.06-0.08
  SD/yr; 17% help use in mistake sessions; 18 schools). Method: primary pages fetched 2026-10-05.
- **rejection candidate** `rj-framework-owned-result-scheduling`: what was tried (by LiveKit + Gemini, not Taxila)
  and what broke: results held until playout, so INTERRUPT is void and WHEN_IDLE is late. Reason Taxila's governor
  owns the reveal clock.
- **rejection candidate** `rj-speculation-without-inflight-guard`: LiveKit agents-js #1365. A speculative output
  built while a tool was in flight hallucinated the tool's result and was played. Applies to visual candidates.
- **decision candidate** `stagecraft-candidates-are-specs`: pool candidates are spec-into-engine only; live code
  races stay planned and capped. *Reverse if* a live code build reaches p95 ≤ 10 s with a ≥ 0.99 gate pass, or
  spec engines cannot express a needed piece type in two consecutive kit audits.
- **decision candidate** `stagecraft-validity-key-at-reveal`: admission is checked against the state at the
  boundary, not at build. *Reverse if* SP-1 is 0 over ≥ 500 replayed boundaries without the check (it would then be
  dead weight).
- **decision candidate** `stagecraft-kernel-picks-not-child`: the child is never asked to choose among alternatives
  of the same idea. *Reverse if* a within-child test shows a choice condition improving delayed retrieval with no
  floor cost.

---

## 9. Sources

Primary [V] (fetched 2026-10-05):
- Google, *Tool use with Live API*: https://ai.google.dev/gemini-api/docs/live-api/tools ; Vertex *Asynchronous
  function calling with Gemini Live API* (page body not returned, title and search summary only):
  https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/asynchronous-function-calling
- LiveKit agents issue #7302: https://github.com/livekit/agents/issues/7302
- LiveKit agents-js issue #1365: https://github.com/livekit/agents-js/issues/1365
- LiveKit, *Agent speech and audio* (preemptive generation): https://docs.livekit.io/agents/build/audio/
- Tavus, *Tool Calling for Perception*: https://docs.tavus.io/sections/conversational-video-interface/pal/perception-tool ;
  *Interactions protocol* (append/overwrite context, echo): https://docs.tavus.io/api-reference/interactions-protocol
- Pipecat, *RTVI standard*: https://docs.pipecat.ai/client/rtvi-standard
- Duolingo, *Get to know the AI behind every Video Call with Lily*: https://blog.duolingo.com/ai-and-video-call/
- Khan Academy, *New AI tools bring interactive diagrams…* (2026-08-27):
  https://blog.khanacademy.org/new-ai-tools-bring-interactive-diagrams-and-targeted-practice-thanks-to-khan-academys-partnership-with-google-org/
- Oreopoulos et al., *One Click Away: AI Tutoring with Khanmigo in a Two-Year School Experiment*, NBER w35620:
  https://www.nber.org/papers/w35620 ; Chalkbeat 2026-08-25:
  https://www.chalkbeat.org/2026/08/25/ai-tutoring-students-khanmigo-khan-academy-engagement-study/ ; FutureEd:
  https://www.future-ed.org/students-tried-khanmigos-ai-tutor-most-didnt-want-its-help/
- Google Research, *Learn Your Way*: https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/
- Brilliant, *Hand-crafted, machine-made*: https://blog.brilliant.org/hand-crafted-machine-made/
- Anthropic, *Claude builds interactive visuals right in your conversation*: https://claude.com/blog/claude-builds-visuals
- Vercel, *How we made v0 an effective coding agent*: https://vercel.com/blog/how-we-made-v0-an-effective-coding-agent
- Roblox, *[Beta] 4D Generation*: https://devforum.roblox.com/t/beta-4d-generation-unlock-new-types-of-gameplay/4331818
- Ye et al., *Speculative Actions*, arXiv 2510.04371: https://arxiv.org/abs/2510.04371

Secondary [S]:
- ChatGPT Voice in chat: https://techcrunch.com/2025/11/25/chatgpts-voice-mode-is-no-longer-a-separate-interface/ ;
  https://www.macrumors.com/2025/11/26/chatgpt-voice-mode-update-seamless-chat/
- ChatGPT interactive learning: https://9to5mac.com/2026/03/13/chatgpt-and-claude-are-evolving-from-chatbots-into-interactive-learning-tools/ ;
  https://dig.watch/updates/chatgpt-dynamic-visual-explanations
- GPT-Live-1 pricing and Speak: https://www.unite.ai/openais-gpt-live-1-arrives-in-the-api-at-0-05-per-minute/
- Gemini Guided Learning: https://blog.google/products-and-platforms/products/education/guided-learning/
- Gemini Live visual guidance: https://blog.google/products-and-platforms/products/gemini/gemini-live-updates-august-2025/ ;
  toggle leak: https://www.androidheadlines.com/2026/07/google-gemini-live-guided-vision-camera-toggle-leak.html
- Synthesis Tutor: https://www.synthesis.com/tutor ; https://www.unite.ai/synthesis-tutor-review/
- Alpha School: https://alpha.school/the-program/ ; investigation coverage:
  https://www.wbur.org/hereandnow/2026/03/23/alpha-school-ai ; https://www.techtimes.com/articles/320040/20260709/ai-private-schools-promise-twice-learning-experts-cannot-verify-that-claim.htm
- Diffit / MagicSchool: https://fltmag.com/leveled-texts-diffit/ ; https://www.schoolgpt.app/versus/diffit-vs-magicschool
- Napkin: https://techcrunch.com/2024/08/07/napkin-turns-text-into-visuals-with-a-bit-of-generative-ai ;
  https://www.therundown.ai/tools/napkin-ai
- Gamma: https://gamma.app/explore/content/guides/what-is-gamma-and-how-does-it-use-ai-to-build-presentations ;
  https://www.sketchbubble.com/blog/gamma-explained-a-comprehensive-deep-dive-into-the-ai-powered-presentation-platform/
- Tome shutdown: https://deckary.com/blog/tome-review
- Copilot Pages: https://support.microsoft.com/en-us/topic/introducing-copilot-pages-6674bd51-9ff5-42c4-9256-44d9428a726f
- Perplexity inline visualizations: https://www.tradingview.com/blog/en/perplexity-computer-integrates-tradingview-lightweight-charts-61346/
- Roblox engagement: https://about.roblox.com/newsroom/2026/02/accelerating-creation-powered-roblox-cube-foundation-model
- TheoremExplainAgent: https://arxiv.org/abs/2502.19400
- SPORK / Speculate with Memory / DualSpec / AOSpec abstracts: https://arxiv.org/html/2607.03333 ,
  https://arxiv.org/pdf/2607.12236 , https://arxiv.org/html/2603.07416 , https://arxiv.org/pdf/2608.00881

Taxila [T]/[M]: `docs/research/duplex/{PRODUCTS,ARCHITECTURE,PLAN}.md`, `docs/design/superhuman/LIVE-STUDIO.md`,
`docs/design/reset/STUDIO-V2.md`, `docs/research/world-best/generated-learning-content.md`,
`docs/research/learning-science.md`, `docs/research/design/ui-teardown.md`, `server/duplex/{triage,buildIntent}.js`,
`server/studio/router.js`, `context/rejected.md` (W2-F, W2-H, W2-H fixer, `rj-studio-after-beats`).
