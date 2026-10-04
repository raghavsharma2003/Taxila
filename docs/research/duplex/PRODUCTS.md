# Duplex liveliness, Study A: the products (who listens, thinks and speaks at once, and how)

**Date:** 2026-10-04. **Owner brief:** `owner-duplex-liveliness-2026-10-04`. The teacher should listen and think while
the child talks, choose between answering mid-utterance and waiting for the whole sentence, backchannel naturally,
handle barge-in, and build things in parallel. That is the opposite of STT → LLM → TTS turn-taking.
**Scope:** every product and platform that ships real-time duplex conversational AI as of October 2026. For each one:
its architecture, how listening, thinking and speaking overlap, how it decides turn-end and backchannels, its
interruption policy, its latency numbers with sources, and what it claims versus what has been demonstrated.
Research models (VAP, PersonaPlex, Freeze-Omni and others) belong to Study B. Taxila's own architecture comes in
the later studies. This file stops at implications (§6).

**This file does not repeat** `../world-best/voice-ux-smoothness.md` (Smart Turn v3, VAP, child VAP AUC 0.62 vs
bAcc 94, Voice Live EOU and AEC, latency masking) or `../voice/human-likeness.md` (timing norms, Moshi,
Full-Duplex-Bench v1). It cites them where needed. What is new here: GPT-Live-1's front-end/back-end split and its
Azure event surface, Tavus Griffin and Sparrow-2, independent at-the-ear measurements (turnprobe), TurnBench,
VideoFDB, Full-Duplex-Bench v3, Speak's GPT-Live tutor numbers, and the Hume sunset.

**Evidence tags.**
- **[V]** = a primary page fetched this session: vendor doc, vendor blog, arXiv abstract or HTML, or a GitHub
  README. The fetches went through a summarising fetch tool, so verbatim text was requested, but a summary can drop
  or distort. Numbers that two sources report differently are marked **⚠**.
- **[S]** = secondary: press, search snippet, or a third-party write-up.
- **[M]** = measured in this repo (cited, not re-run).
- **[E]** = my estimate or inference.
- A **[V]** on a vendor claim means *the vendor says so*, not that it is true.
- "Demonstrated" means an independent party measured it, or the vendor published method plus n.

**Method.** About 45 WebSearch queries and about 40 primary fetches: Tavus pages and docs, Microsoft Learn GPT-Live
and Voice Live pages, OpenAI and Deepgram docs, LiveKit, Pipecat, ElevenLabs, AWS, Google, Hume, Kyutai READMEs,
arXiv (TurnBench 2608.25218, VideoFDB 2605.30256, FDB-v3 2604.04847, frontend-backend tool calls 2609.19334), and
the turnprobe repo README plus two blog posts. Nothing was run against a paid API in this study.

---

## 0. The findings that change something

1. **What the owner's brief calls "full duplex with cascading" ships today on Azure, as GPT-Live-1.** OpenAI's
   GPT-Live-1 has two parts.
   - A **live voice model** listens and speaks continuously and decides "many times per second" whether to speak,
     keep listening, pause, interrupt or call a tool.
   - A **backend** does the reasoning. It is either a configured Responses model or *your own code* ("client
     delegation").

   Speech and backend work run on **independent tracks**: "interrupting speech doesn't cancel that work"
   [V, MS Learn concept page]. Our code feeds the live model through three channels, each ≤ 500 tokens per event
   [V, MS Learn how-to]:
   - `session.thinking.append`: quiet context;
   - `session.commentary.append`: say this aloud, may paraphrase;
   - `session.instructions.append`: trusted instructions.

   Status: it is deployable in **southindia** [S, Foundry blog]. The owner dropped it on price, about $3/h
   (`owner-drop-gpt-live-1-2026-10-04`). Microsoft documents it [V] and the arXiv paper Hu et al. 2609.19334
   describes the same pattern [V]. So "front-end duplex model + back-end reasoner" is now the industry's reference
   shape. **Taxila can build the same shape in code with its own components** (§6).

2. **Native duplex models backchannel and yield worse than their marketing says, when measured at the listener's
   ear.** turnprobe (independent, September 2026, 893 trials, synthetic voices, one network) [V, GitHub README and
   blog] measured both OpenAI models:
   - **GPT-Live-1** kept talking through **19/20** backchannels (good). It took a median **1.41 s** (0.66-2.12 s)
     to stop for a real interruption, and stopped in 14/15 trials. It **spoke into 54/117 mid-sentence pauses**
     (only 12 of those were acknowledgements) and answered 12/58 unfinished clauses.
   - The half-duplex **gpt-realtime-2.1** stopped for *everything*, backchannels included (56/56), within 85-189 ms.
     After a lone "yeah" it then waited about 4-5 s before resuming.

   So the duplex model gets backchannels right and barge-in wrong, and the turn-based model does the reverse.
   **Neither is safe for a child who pauses to think.** Both failure modes are measurable with an at-the-ear harness,
   and Taxila needs one (§6.4).

3. **Silence-based endpointing is the slowest *and* the rudest option, on every independent benchmark.**
   - **Sparrow-1 benchmark** [V, Tavus, vendor-run, n=28]: VAD-timeout made 59 interruptions at p50 1002 ms.
     Sparrow-1 made 0 at p50 55 ms.
   - **TurnBench** [V, 30 h triple-annotated, 14 systems]: the best system (VAP) reached EOT recall 0.845 at 5.5%
     false-positive rate, 368 ms median. "No in-budget system approaches the human reference". Humans start a median
     **151 ms before** the turn ends in smooth transfers.
   - **Taxila** today waits a fixed 900 ms of silence. That is 1069 ms p50 to the endpoint [M] and the single
     largest stage of the 3.2 s budget after the Director.

4. **Speculative "commit or discard" generation is the universal latency trick, and every serious vendor ships it:**
   - Sparrow (floor-transfer prediction lets downstream "begin response generation before the user finishes
     speaking, committing or discarding" [V]);
   - Deepgram Flux `EagerEndOfTurn` / `TurnResumed` (150-250 ms earlier, at the cost of 50-70% more LLM calls [V]);
   - LiveKit `preemptive_generation`, on by default [V];
   - Pipecat `EagerUserTurnStopStrategy` [V].

   Taxila already speculates 3 replies per turn (`TAXILA_SPECULATE`, 11/12 hit [M]). It starts them only *after*
   the 900 ms endpoint. Moving the start earlier, triggered by a turn-probability model instead of silence, is the
   cheapest liveliness win on the table. This is an inference [E]; Study B or C must measure it.

5. **Domain framing alone halves a duplex model's interruptions of thinking pauses, and tutoring is the domain.**
   Speak's GPT-Live tutor [V, Speak blog 2026-09-10]:
   - interrupted 27.6% of learner thinking pauses as a generic assistant, and 13.6% when framed as a language tutor;
   - interrupted under 10% of 1-2 s word-search pauses, while still starting its reply about 1 s after the learner
     finished;
   - delivered **476/477 authored lesson lines** across 27 simulated lessons of up to 32 steps.

   This is the closest published analogue to Taxila. Speak authors the lesson and the duplex model runs the moment.
   It maps onto Taxila's "code decides, models speak" rule, *except* that in Speak the floor decision lives inside
   OpenAI's model and not in Speak's code.

6. **Every child-facing product still chooses waiting or push-to-talk over duplex.**
   - **Duolingo** added push-to-talk "so Lily stops interrupting mid-sentence" [S, already in voice-ux-smoothness].
   - **Ello** lets the child read to the end of the page before saying anything [S].
   - **Amira** intervenes "at the moment of struggle" while the child reads [S]. This is the one mid-utterance
     policy in education, and it works because the expected text is known.
   - **Khanmigo** still has no real-time voice [S].

   **No education product found ships true duplex to children.** Taxila would be first, and so carries the
   first-mover risk too.

7. **Griffin is a demonstration of *what liveliness buys*, not an architecture Taxila can copy.** Griffin-Lite:
   - 48% of 54 adults thought it was human, against 2.4% of 41 for Tavus's previous cascade [V]. The calls were one
     minute on one light topic, and the question was asked only at the end of the survey.
   - It leads NVIDIA VideoFDB on both tracks (LM-as-judge) [V].

   But it is a research preview, it is not for sale, and its training data and any LLM behind it are undisclosed.
   Its own leaderboard row shows a median response latency of **1,892 ms ⚠**, against a 1,400 ms human reference in
   VideoFDB's protocol [V, NVIDIA project page]. Its edge is *continuous decision-making plus nonverbal timing*, not
   raw speed. Tavus says it withholds broad release because the model can "deceive a human into believing it is not
   AI" [V]. That sentence is exactly the hazard Taxila's never-deny-being-an-AI floor exists for.

8. **One vendor exited.** Hume is sunsetting the EVI and TTS APIs on **13 November 2026** [V, dev.hume.ai]. Strike
   Hume from any shortlist. The lesson is that a voice-API dependency can vanish in weeks, which argues for owning the
   floor logic in code.

---

## 1. A taxonomy (so the products can be compared)

Each product makes two independent choices. **Where the floor decision lives**: in code (a classifier plus rules) or
inside a generative model. **How often it is made**: once per turn, every 10-100 ms frame, or every sub-second
"mini-turn".

| shape | what speaks | who decides the floor, how often | listening while speaking? | examples |
|---|---|---|---|---|
| **A. Cascade + silence VAD** | text LLM → TTS | code; once, after N ms of silence | barge-in only (VAD energy) | Taxila today (900 ms); Hume EVI default (800 ms); Pipecat fallback (600 ms); Voice Live default `server_vad` (500 ms) |
| **A+. Cascade + turn model + speculation** | text LLM → TTS | a small model (audio or text) per frame or per pause, plus code thresholds; drafts start before the turn is confirmed | yes: a separate interruption/backchannel classifier runs during agent speech | Tavus CVI (Sparrow-2), LiveKit Agents, Pipecat (Smart Turn v3.2), Deepgram Flux, ElevenLabs Agents, Kyutai Unmute, Speak (cascade lanes) |
| **B. Native S2S, half-duplex** | one audio model | server VAD or semantic VAD inside the API; per turn | barge-in cancels generation | gpt-realtime-2.1, Gemini Live 3.8, Amazon Nova 2 Sonic, Hume EVI 3/4-mini, Sesame Maya [S] |
| **C. Native full-duplex** | one model emitting audio every frame, including silence | the model itself, every frame (Moshi 80 ms) or "sub-second mini-turn" (Griffin) | always: two streams in, one out | Kyutai Moshi, Tavus Griffin, NVIDIA PersonaPlex (Study B) |
| **D. Duplex front-end + reasoning back-end** | a live duplex model, fed by a backend | the front model per frame; the backend never holds the floor | always; backend work survives interruption | **GPT-Live-1** (FEM/BEM), Hu et al. 2609.19334, and in spirit Gemini Live async tools (`NON_BLOCKING` + `INTERRUPT/WHEN_IDLE/SILENT`) |

Taxila's binding rule is "code makes decisions, models read, speak, build and write". That rule places it in
**A+**, upgraded toward **D**: a code-owned floor controller that runs every frame, a reasoning backend, a builder
backend, and a mouth that speaks only what code commits. Study C should test whether a model-owned floor (C or D as
sold) can be made to respect the safety floor (§6.2).

---

## 2. Product deep-dives

### 2.1 Tavus Griffin (Human Interaction Model), launched 2026-10-01

**Architecture [V, tavus.io/griffin].** Full-duplex **video-to-video**. Two engines run concurrently:
- a **Continuous Conversational Modeling** engine that perceives incoming audio *and* video and "decides when and
  how to respond", producing "signals that determine what should be said and how" (emotional tone, stance,
  expression, gesture);
- an **Audio-Visual Generation** engine:
  - speech: a fast autoregressive diffusion transformer (VDiT) over **Tavec**, a convolutional autoencoder that maps
    48 kHz audio to a continuous latent of 40 values × 100 frames/s, streaming packets "as small as 10 ms", with a
    voice cloned from about 10 s of audio;
  - video: a few-step autoregressive generator, 720p in 320 ms chunks, one latent → 8 frames at 25 fps, distilled
    in three stages (DMD → teacher forcing → self-forcing).

The page positions Griffin explicitly *against* the cascade ("Most real-time AI works as a relay, often called a
cascade…"). It does **not** say whether a text LLM sits behind the conversational engine, or what grounds factual
content, tools or memory. That is undisclosed. [E] Some text reasoner almost certainly exists, given the content
quality claims, but this is unverified.

**Overlap.**
- Decisions come "at regular sub-second intervals rather than once per turn"; Tavus calls these mini-turns.
- At each interval Griffin picks: speak / continue, backchannel ("mm-hm"), react (a nod or expression), wait, yield,
  or interrupt. It "never stops thinking".
- It tracks time: "how long a silence has lasted, what a sustained silence means, and when to speak again on its
  own".
- Visual grounding covers gaze, facial expression, the environment, and a shared screen.
- The page's timing diagrams are labelled "illustrative and were not measured from a real session" [V]. A third-party
  post highlights a coaching demo in which Griffin follows a task on camera and counts the seconds aloud [S, X post].

**Latency.**
- Audio-to-video 0.43 s average on H100, "half that of the next fastest method" [V]. This is lip-sync lag, not
  response time.
- Response latency in VideoFDB's protocol is **1,892 ms median, against a 1,400 ms human reference** [V, NVIDIA
  leaderboard ⚠]. A third-party post quotes 900 ms for humans [S], which conflicts.

**Benchmarks.**
- VideoFDB generation track: Griffin 3.83/5, human 3.92, next best 2.80 (Gemini 2.5 + Anam, a cascade).
- VideoFDB perception track: Griffin 3.73, human 4.20, MiniCPM-o 4.5 3.44, Gemini 2.5 Flash native 3.17,
  gpt-realtime 2.97 ⚠ (NVIDIA's page shows 2.75).
- Takeover-rate alignment: 62.8% on generation and 73.8% on perception [V].
- Scoring is **LM-as-judge** over 237 dyadic clips [V, arXiv 2605.30256].

**Claimed vs demonstrated.**
- *Demonstrated*: a #1 VideoFDB ranking under an independent benchmark (NVIDIA authors), with LM-judge caveats.
- *Demonstrated with weak power*: the Turing result (n=54, 1-minute calls, one topic, asked post hoc).
- *Claimed only*: backchannel quality, interruption handling, sustained-silence understanding. No per-behaviour
  numbers were published.
- *Not available*: research preview for "select trusted testers", not for customers [V].

**Taxila relevance.** Griffin is a *target*, not a component (it is not Azure and not for sale). Three things to
steal:
1. a decision on a fixed sub-second clock, never waiting for "end of turn";
2. silence duration as a first-class input ("what a sustained silence means": for a child, thinking, stuck or gone);
3. nonverbal reactions such as a nod or an expression as actions on the same menu as speech. Taxila's 3D teacher
   rig can render those.

### 2.2 Tavus CVI: Sparrow-1, Sparrow-2, Raven (the shipping Tavus product)

**Architecture [V, docs.tavus.io].** A cascade with a floor model on top:
Raven (perception: expressions, gaze, background, screen) → Sparrow (conversational flow) → STT → LLM → TTS → Phoenix
(face).

**Sparrow-1 [V, Tavus blog].**
- Audio-native, streaming, recurrent, with persistent state. It models "who owns the conversational floor at every
  moment" at frame level (40 ms state updates), not "has speech ended".
- During agent speech, incoming speech *pauses* playback while Sparrow "continues evaluating floor ownership". Within
  tens of ms it yields or resumes. This is the same idea as Taxila's `cascade-barge-pause-decide`.
- Speculative inference: downstream components begin generating before the user finishes, then commit or discard.
- Vendor benchmark, n=28 hard samples, 400 ms grace window:

  | system | precision | recall | interruptions | p50 | mean |
  |---|---|---|---|---|---|
  | Sparrow-1 | 1.000 | 1.000 | 0 | 55 ms | 292 ms |
  | Deepgram | 0.786 | 1.000 | 7 | 190 ms | 304 ms |
  | Smart-Turn | 0.536 | 1.000 | 21 | 237 ms | 611 ms |
  | VAD-timeout | 0.893 | 1.000 | 59 | 1002 ms | 1046 ms |
  | LiveKit | 0.929 | 1.000 | 3 | 1504 ms | 1621 ms |

  A vendor test on 28 vendor-chosen samples: read it as a direction, not a ranking.

**Sparrow-2 [V, Tavus blog].**
- Native 10 ms frames, processing 80 ms of audio in about 7 ms (Sparrow-1 took about 30 ms). It is a six-layer causal
  transformer on streaming embeddings.
- Tolerates mid-thought pauses of 6-8 s (Sparrow-1: 1-2 s). **This is the child-relevant number.**
- It treats the whole audio stream as evidence: semantic, lexical, prosodic, speaker identity, backchannels,
  interruptions, background speech, noise ("noise understanding, not cancellation").
- It separates "mhm" from a floor-taking attempt natively.
- Numbers, self-reported on the TurnBench **public dev split** (38 conversations, 7.3 h; test-set results pending):

  | metric | Sparrow-2 | runner-up | Smart Turn v3 |
  |---|---|---|---|
  | EOT recall | 92.4% | 84.1% (VAP) | 75.4% |
  | interruption recall | 97.4% | — | 11.8% |
  | unanswered turn ends | 7.6% | 16.7% (VAP) | about 25% |

  Median decision 632 ms, with 87% "inside the human window".

**Controls [V, conversational-flow docs].**
- `turn_detection_model` (sparrow-1 / sparrow-2);
- `turn_taking_patience` low / medium / high;
- `pal_interruptibility` low / medium / high;
- `idle_engagement` off / patient / eager: proactive re-engagement after silence;
- wake and sleep phrases.

**Claimed vs demonstrated.** Sparrow-2's numbers are vendor-run on a public independent dataset, which makes them
checkable but not yet checked. TurnBench's own paper lists VAP as top among the systems *it* ran; Sparrow-2 was not in
that table [V].

**Taxila relevance.** The best documented design for "A+":
- a floor-ownership model (not an endpoint detector) at 10-40 ms;
- a separate yield-or-resume decision during agent speech;
- speculative drafts;
- a patience knob;
- an idle re-engagement mode.

All of it can be rebuilt on Azure ACA CPU with open weights (Smart Turn v3.2, BSD-2) plus our own training on child
audio (`voice-ux-smoothness` S1/S2). Sparrow itself is closed and Tavus-only.

### 2.3 OpenAI GPT-Live-1 (ChatGPT 2026-07-08; API 2026-09-10; Azure Foundry)

**Architecture [V, MS Learn concept / how-to / reference / delegation; S, VentureBeat].**
- A **live voice model** (the FEM, front-end model) "listens, speaks, decides when to respond, and decides when to
  hand off work".
- A **backend** (the BEM, back-end model) "handles delegated reasoning, lookups, tool selection, and longer-running
  tasks". In ChatGPT the backend is GPT-5.5, running asynchronously [S].
- Delegation modes:
  - **Responses delegation**: a configured model plus tools, with function calls returned to the app;
  - **client delegation**: `session.delegation.created` hands *our* app a unit of work. The delegation object
    carries metadata, *not the task text*: we infer the task from transcripts. We return results by commentary
    (spoken) or thinking (quiet).
- Context is summarised automatically near the window limit.

**Event surface (Azure).**
- Endpoint: WebSocket `/openai/v1/live/sessions`, or WebRTC. A **sideband** socket can attach to a running session to
  observe events and send commands.
- Audio: PCM16 at 24 kHz, or 16 kHz, or G.711 μ/A-law.
- Output: `session.output_audio.delta` carries server-timeline `start_ms/end_ms`. Gaps are omitted silence and there
  is no audio-done event.
- Transcripts: `session.input_transcript.delta` / `session.output_transcript.delta` with timestamps, interleaving.
  There is **no authoritative turn-completed event**.
- `session.input_audio.mute/unmute` exists.
- `instructions` and `voice` are **immutable after start**.
- There is **no `response.cancel`** and no turn-detection settings.

**Overlap.** True duplex. The model emits audio while input streams, and backend work continues while it talks.
"'Stop talking' and 'Cancel my order' are different intents" [V]. Measured in this repo [M, voices-hindi §3.1b]:
- the session is clocked by input audio: with no input frames, commentary was never spoken;
- first audio came 662-665 ms after a commentary append (n=2);
- commentary is paraphrased (marin added teaching on 2/5) and English stimuli came out as Hinglish (2/2).

**Turn-end and backchannels.** Learned inside the FEM; there are no knobs. Vendor numbers [V, OpenAI community post]:
- turn-taking latency 0.798 s, against 1.41 s for gpt-realtime-2.1;
- Full-Duplex-Bench v1.5 interactivity 80.1%;
- τ³ first-attempt tasks 83.6% (gpt-realtime-2.1: 45.7%).

Independent numbers [V, turnprobe]: reply gap median 1.23-1.30 s (p90 1.47-1.83 s).

**Interruption.** It adapts rather than finishing a queued response [V]. Measured stop latency is a median 1.41 s
(0.66-2.12 s) and it stopped in 14/15. It kept talking through 19/20 backchannels [V, turnprobe blog 2].

**Languages.** Multilingual, "no guarantee of uniform quality" [V]. Hindi quality was not measured beyond the n=2
probe [M].

**Price.** $0.05 per minute of session, including silence and backend-working time, billed separately from the
backend [V]. That is about $3/h, the reason for the owner's drop.

**Safety (vendor) [S, VentureBeat].**
- Synthetic self-harm eval: 0.72 → 0.98.
- The production-prompt evals were "more mixed": emotional reliance went 0.88 → 0.82, described as not significant.

**Claimed vs demonstrated.** Duplex works and backchannel tolerance is real (19/20, independent). Interruption yield
is slow (1.4 s median, independent). It speaks into thinking pauses often (54/117, independent; Speak's tutor framing
roughly halves that).

**Taxila relevance.** The cleanest public spec of the "D" shape, and it lives on the platform we are allowed to use.
It conflicts with three Taxila rules, so it is a pattern to copy, not a lane to buy (§6.2):
1. the floor is decided in OpenAI's weights, not in our code;
2. speech is not gated: there is no way to hold a reply until the safety predicate runs;
3. it paraphrases committed text.

### 2.4 OpenAI gpt-realtime-2.1 (half-duplex S2S; Azure `taxila-realtime`)

**Turn detection [V, OpenAI VAD guide; V, turnprobe].**
- `server_vad`: threshold, `prefix_padding_ms`, `silence_duration_ms`.
- `semantic_vad`: a classifier on the uttered words, with `eagerness` low / medium (= auto) / high. Its ceilings are
  roughly 8 / 4 / 2 s: p99 7.95 / 3.95 / 2.5 s measured.
- `interrupt_response` and `create_response` toggles.
- Barge-in: on `speech_started` the client stops playback and sends `conversation.item.truncate` with the
  milliseconds actually played, so server history matches what was heard.

**Independent measurements [V, turnprobe, September 2026, n≈112-119 per row]:**

| setting | turn ended in a ≥ 0.6 s pause | heard the model before finishing | of those, on unfinished clauses | reply gap p50 / p90 |
|---|---|---|---|---|
| server_vad 500 ms | 88/89 | 39/112 | 17/56 | 1.38 / 1.82 s |
| semantic high | 50/94 | 20/116 | 2/56 | 1.79 / 3.29 s |
| semantic auto | 31/92 | 13/116 | 2/57 | 1.82 / 4.97 s |
| semantic low | 32/95 | 15/119 | 1/59 | 1.98 / 8.69 s |

Further findings:
- The semantic classifier judges **only the fragment after the last pause**. "…what the capital of Australia is?"
  took 1.5-1.6 s whole, but **9.0-9.2 s** when "Australia is?" followed a 1.5 s pause. That is the same as the
  fragment alone.
- Overlap: it stopped in 56/56 trials, backchannels included, 85-189 ms after onset. After a lone "yeah" it resumed
  only after about 4-5 s.
- Server VAD commits about 586-590 ms after speech ends.

**Third-party benchmark [V, FDB-v3 2604.04847].** GPT-Realtime led Pass@1 (0.600) with the lowest interruption rate
(13.5%). Gemini Live 3.1 was fastest at 4.25 s and had the lowest turn-take rate (78%). A Whisper → GPT-4o → TTS
cascade took 10.12 s. These are latencies on multi-step tool tasks, not plain replies.

**Taxila relevance.** The fragment effect is a direct warning for any text-based end-of-turn classifier on child
speech. Children pause mid-sentence, and a classifier that sees only the tail will either wait 9 s or cut in. Taxila's
`voice-turn-config` (n=1) already saw semantic_vad split a child's mid-thought pause [M].

### 2.5 Google Gemini Live (3.8 Live, Extended Thinking)

**Architecture [V, ai.google.dev Live API capabilities; S, Cloud docs].**
- Native audio S2S with video input. Built-in VAD (automatic activity detection) is on by default:
  - `startOfSpeechSensitivity` and `endOfSpeechSensitivity` (LOW / MEDIUM / HIGH);
  - `prefixPaddingMs` (default 20);
  - `silenceDurationMs` (default 100; 500-800 recommended).
- Manual `activityStart/End` is possible.
- On barge-in, "the ongoing generation is canceled and discarded. Only the information already sent to the client is
  retained", flagged as `serverContent.interrupted`.
- 3.8 Live defaults [S, Cloud guide]:
  - **affective dialog**: adapts tone to prosody and emotion;
  - **proactive audio**: ignores background chatter and replies only when addressed.
- Extended Thinking: `thinkingLevel` low / medium / high.
- Languages: 99 including Hindi [V].

**Thinking while talking [S, Cloud async function-calling page].** Function calls are `NON_BLOCKING` by default in
3.8 Live. The model keeps conversing while tools run. A tool *result* carries a scheduling hint:
- `INTERRUPT`: speak now, cutting current speech;
- `WHEN_IDLE`: wait for the turn to end;
- `SILENT`: absorb without speaking.

**Latency.** Not vendor-quantified in what I read. VideoFDB shows Gemini 3.1 Flash Live at 1,720 ms and 2.5 Flash
native at 3,160 ms [V ⚠]. FDB-v3 shows 4.25 s on tool tasks [V].

**Taxila relevance.** Not usable (not Azure). But the **INTERRUPT / WHEN_IDLE / SILENT** triage for results that
arrive mid-conversation is exactly the policy Taxila needs when a Studio build, a classify verdict or a safety
verdict lands while the teacher or the child is speaking. Steal the vocabulary and own it in code.

### 2.6 Sesame CSM / Maya and Miles

**Architecture [S, multiple; Sesame research page 404 on fetch].**
- CSM: two autoregressive Llama-family transformers over Mimi RVQ tokens. A backbone ingests interleaved text and audio
  history and predicts codebook 0; a small decoder predicts the rest. Sizes 1B / 3B / 8B.
- Its strength is *contextual prosody*: it hears past audio, so it matches the conversation's pitch, pace and emotion.
- Latency claims: under 500 ms end to end, 380 ms average [S]. About 150 ms TTS first frame for CSM-1B on H100 [S].
- Sesame itself reportedly says the experience *feels* duplex but processes speech after you finish talking [S].
  From memory of the February 2025 post [U]: CSM "does not model the structure of conversations itself" (turn-taking,
  pauses, pacing), and fully duplex models are named future work.
- 2026: the hosted voices were upgraded with "tighter handling of overlapping speech"; no paper [S].

**Claimed vs demonstrated.** Viral adoption (more than 1M users and 5M minutes within weeks of launch, February 2025)
[S]. No published turn-taking metrics.

**Taxila relevance.** Proof that *voice-level contextual prosody* drives "feels human" more than duplex does. Sesame
won hearts as a half-duplex system. The open CSM-1B is English-only and not Azure: method only.

### 2.7 Hume EVI 3 / EVI 4-mini (sunsetting 2026-11-13)

**Architecture [V, dev.hume.ai].** A speech-language model plus a supplemental LLM (optional for EVI 3, required for
EVI 4-mini). "Always interruptible": it resumes "with the right context based on where it left off". End-of-turn is
tone-of-voice based.

**Controls [S, changelog April 2026].** `end_of_turn_silence_ms` 500-3000 (default 800),
`prefix_padding_ms` 300, `speech_detection_threshold` 0.5.

**Latency.** EVI 3 "under 300 ms" [S]; EVI 4-mini about 100 ms faster per response [S].

**Languages.** EVI 4-mini supports 11, Hindi included [V].

**Status.** **Sunset: access ends 13 November 2026** [V]. Drop it.

### 2.8 Kyutai: Moshi and Unmute

**Moshi [V, arXiv 2410.00037 abstract].**
- A 7B full-duplex speech-text model on the Mimi codec. Two audio streams (user and Moshi) are modelled in parallel.
- **Inner Monologue**: Moshi predicts its own text tokens slightly ahead of its audio, which roughly triples spoken-QA
  accuracy.
- Latency: theoretical 160 ms, about 200 ms in practice.
- Backchannel frequency on Full-Duplex-Bench is 0.005, JSD 0.977 [S, in voice-ux-smoothness]: it barely backchannels.
- Languages: English and French. Weights CC-BY 4.0.

**Unmute [V, GitHub README].**
- *Cascade*: Kyutai STT (delayed-streams model, 0.5 s delay, with a **semantic VAD** head), any text LLM (GPT-OSS-120B
  in production), then Kyutai streaming TTS that starts before the text is complete.
- Total response latency "below a second". TTS latency falls from about 750 ms on one L40S to about 450 ms on
  separate GPUs.
- STT weights CC-BY 4.0; the code is MIT / Apache.
- STT languages: English and French only.

**Taxila relevance.** Kyutai's own product decision says a lot. The lab that built the first full-duplex model ships a
*cascade with a semantic-VAD head* for real use, because "you can leverage all capabilities of your favorite language
models … reasoning and connection to external tools" [V]. That is the same reason Taxila is cascade-first. The
inner-monologue idea (text slightly ahead of audio) maps to Taxila's "code commits text, then the mouth speaks it".

### 2.9 LiveKit Agents

**Turn detection [V, docs.livekit.io].** Five modes: turn-detector model (recommended), realtime-model built-in, VAD
only, STT endpointing, manual.
- **Audio turn detector** (new): `v1` on LiveKit Inference (cloud) and `v1-mini` on local CPU. It "encodes user audio
  directly, capturing both what is said and how". 14 languages, Hindi included. Endpointing defaults are `min_delay`
  0.3 s and `max_delay` 2.5 s. Licensed under the LiveKit Model License.
- **Text turn detector**: Qwen2.5-0.5B, 396 MB, about 50-160 ms per turn, Hindi TPR 99.4 / TNR 96.3, defaults 0.5 s /
  3.0 s. It is **deprecated** (removal planned for SDK 2.0).
- Dynamic endpointing (Python) adapts the delay within min/max from session pause statistics.

**Interruption [V, LiveKit blog "adaptive interruption handling", Agents 1.5.0].**
- An audio encoder + CNN reads the first few hundred ms of user speech during agent speech, separating true barge-ins
  from backchannels, coughs, sighs and noise.
- Trained on "hundreds of hours" of human-human conversation, with added noise.
- Results on a held-out production set: 86% precision and 100% recall at 500 ms overlap; it rejects 51% of VAD false
  positives, detects true interruptions 64% faster than VAD, takes 216 ms of audio at the median to trigger, and infers
  in ≤ 30 ms.
- **LiveKit Cloud only**: not available self-hosted.
- Other parameters: `false_interruption_timeout` + `resume_false_interruption` ("continue speaking from where it left
  off"), `min_duration`, `min_words`, `discard_audio_if_uninterruptible`. `preemptive_generation` is on by default.

**Independent number.** In Sparrow-1's vendor test, LiveKit's (older) detector made 3 interruptions at p50 1504 ms
[V, vendor test].

**Taxila relevance.** `resume_false_interruption` is Taxila's `cascade-barge-pause-decide`, reached independently.
That is a good sign the design is right. Dynamic endpointing from session pause statistics is the cheapest
child-adaptive patience we could add: each child's own pause distribution sets their window [E]. The models are under
a restrictive licence or cloud-only, so take the method, not the weights.

### 2.10 Pipecat (Daily): Smart Turn v3.2 and turn strategies

**Smart Turn v3.2 [V, GitHub].**
- Whisper-Tiny encoder + linear head, about 8M parameters; int8 is 8 MB on CPU and fp32 is 32 MB on GPU.
- Audio-only, up to 8 s windows.
- **23 languages including Hindi and Marathi.** Hindi was 93.44% on v3.0 (n=1,295) [V, in voice-ux-smoothness].
- 10-100 ms on CPU; about 65 ms on Pipecat Cloud.
- **BSD-2-Clause**, open training and test data.
- v3.2 handles short utterances and noise better.

**Strategies [V, Pipecat docs].** Start strategies:
- `VADUserTurnStartStrategy`;
- `TranscriptionUserTurnStartStrategy`;
- `MinWordsUserTurnStartStrategy`: `min_words` applies **only while the bot is speaking**, so short affirmations
  don't interrupt;
- `WakePhrase…`;
- `KrispVivaIPUserTurnStartStrategy`: Krisp's interruption-prediction model to separate backchannels from barge-ins,
  threshold 0.5, 20 ms frames.

Stop strategies:
- `SpeechTimeoutUserTurnStopStrategy`: 0.6 s;
- `TurnAnalyzerUserTurnStopStrategy`: Smart Turn, the default;
- `EagerUserTurnStopStrategy`: speculation timeout 5 s;
- `LLMTurnCompletionUserTurnStopStrategy`: an LLM-marker protocol.

Recovery:
- `empty_user_turn` separates an *interrupted* empty turn from an *idle* one, with separate prompts and
  `max_consecutive_recoveries` 1;
- `user_turn_stop_timeout` 5 s acts as a backstop.

**Independent numbers.**
- TurnBench: SmartTurn v3 EOT recall 0.752 but **interruption recall 0.107** [V]. Sparrow-2 reports 11.8%.
- Sparrow-1 vendor test: 21 interruptions at p50 237 ms.

**Taxila relevance.** Smart Turn is the only *open, Hindi-trained, commercially licensed* audio turn model. It is the
obvious seed for a Taxila floor model on ACA CPU, already recommended in `voice-ux-smoothness` S1. Its weak spot,
interruption detection, must be covered by a separate classifier, which is LiveKit's and Krisp's pattern.

### 2.11 Deepgram Flux (conversational STT) and Voice Agent

**Architecture [V, Deepgram docs; S, blog].** A single model produces the transcript *and* the turn events, so there
is no separate VAD. Events: `StartOfTurn`, `Update`, `EagerEndOfTurn`, `TurnResumed`, `EndOfTurn`.
- `eot_threshold`: default 0.7, range 0.5-0.9.
- `eager_eot_threshold`: 0.3-0.5 gives EagerEndOfTurn 150-250 ms before EndOfTurn, at the cost of 50-70% more LLM
  calls.
- Guidance is "draft, not finalize" on eager, discard on `TurnResumed`, reuse on `EndOfTurn`. Use a smaller model for
  drafts.
- EOT latency: p90 about 1 s and p95 about 1.5 s [S].
- Languages were not documented on the pages read [V]. [U] It is primarily English.

**Independent number.** Sparrow-1 vendor test: Deepgram made 7 interruptions at p50 190 ms.

**Taxila relevance.** Turn events emitted by the STT itself is the cleanest seam: the transcript and the turn decision
can never disagree on timing. MAI-Transcribe-2-Streaming (Taxila's India STT) has no such events, so Taxila must pair
it with a separate floor model. The eager/resumed protocol is a ready-made contract for `shared/contracts.ts`
(Study C).

### 2.12 ElevenLabs Agents

**Architecture [V, ElevenLabs blog "Interaction models", 2026-07-16].**
- An "advanced cascaded architecture", deliberately not fused, where the stages "pass rich context to each other, not
  just data":
  - Scribe v2 Realtime STT, about 150 ms, 90+ languages;
  - speculative turn-taking;
  - Eleven v3 Conversational TTS, carrying emotional temperature across turns;
  - Flash v2.5, under 75 ms.
- The pipeline is "under a second depending on configuration". No benchmark published.

**Controls [V, conversation-flow docs].**
- turn eagerness: Eager / Normal (default) / Patient;
- turn timeout 1-30 s;
- **soft timeout** 0.5-8 s (default off, recommended 3 s): plays a static or LLM-generated filler while the LLM works;
- interruptions on/off; "interruption ignore terms".
- Transcripts mark `ignored_as_backchannel` [S, changelog].

**Taxila relevance.** A second major vendor choosing cascade-plus-speculation over native S2S *for quality and
control*. Its soft-timeout filler is the anti-pattern Taxila already rejects (canned fillers; S3 in
voice-ux-smoothness prefers body first, then a code-built uptake). ElevenLabs is third-party AI, so it cannot be used
here.

### 2.13 Microsoft Azure Voice Live (the managed Azure option)

Already covered in depth in `voice-ux-smoothness` §0.4-0.5 and S7/S8. Deltas checked today [V, voice-live-how-to,
updated 2026-09-24]:
- `azure_semantic_vad_multilingual` lists Hindi. `remove_filler_words` uses an **English-only** list ("ah, umm, mm,
  uh, huh, oh, yeah, hmm"), ignored during an ongoing response.
- `interrupt_response` defaults to true. `auto_truncate` defaults to false.
- `silence_duration_ms` defaults to 500. `speech_duration_ms` is 80 ms for the semantic types.
- Live-Reference AEC (client playback as the reference, stereo PCM16, API 2026-07-15). The server-reference AEC
  degrades if playback is delayed by more than 2 s.
- MAI-Transcribe-2 is selectable as Voice Live's input STT, with `phrase_list`.
- **azure-realtime** native voices include **`diya` and `meera` (hi-IN, bilingual)** and `aarti` (en-IN). Word
  timestamps and visemes are available for Azure voices.
- `smart_end_of_turn_detection` (audio EOU, 2026-06-01-preview) is recorded in voice-ux-smoothness [V there]. It was
  not re-checked today.
- Interim responses exist only for cascaded text-LLM + Azure voice; the default trigger is 2000 ms [V there].

**Architecture.** It can act as the *managed cascade* (any text model, or a Foundry agent, plus Azure STT/TTS) or
host the native realtime models. The floor decision is Microsoft's VAD/EOU with our thresholds. It is not a duplex
model.

**Taxila relevance.** The only *managed* path on Azure to an audio end-of-turn model plus AEC plus Hindi voices with
visemes. It keeps half-duplex semantics, though: no generation during user speech, and no backchannel output. Lane B
remains a candidate per voice-ux-smoothness S8. It does not deliver the liveliness the brief asks for on its own.

### 2.14 Amazon Nova 2 Sonic

**Architecture [V, AWS docs].** Native S2S with built-in VAD and turn detection.
- `turnDetectionConfiguration.endpointingSensitivity`: HIGH = 1.5 s pause, MEDIUM = 1.75 s, LOW = about 2.0 s.
  Even its *fastest* setting waits 1.5 s.
- Time to first audio 1.39 s [S, AWS blog].
- Taxila status: "Nova 2 Sonic is not recommended for any child-facing lane" and it is untestable on this account
  (decisions 2026-10-04) [M].

**Taxila relevance.** None as a lane. One useful data point: AWS markets LOW (2 s) for "elderly or speech-impaired
users, and complex problem-solving". Vendors do encode patience for slow speakers, but only as a fixed pause.

### 2.15 Education products

| product | what it does with voice | floor policy | evidence | lesson for Taxila |
|---|---|---|---|---|
| **Speak** (adult language learning) | Live Tutor Lessons on **GPT-Live-1** (2026-09-10). Cascade for roleplay; S2S where audio properties matter (2026-03-24) | Duplex model owns the floor; Speak owns the lesson script. Button turn-taking for accuracy; semantic models for hands-free ("still an open problem") | [V] interruptions 27.6% → 13.6% (tutor framing); < 10% on 1-2 s pauses; reply about 1 s after finishing; 476/477 authored lines in 27 simulated lessons; corrections about 85% warranted, about 80% of target errors caught, 12/12 correct non-corrections over 101 scored turns. Pause sample n not stated | The closest analogue. (a) Learners' 300-500 ms pause assumption breaks: Speak says so explicitly. (b) The lesson script survives duplex chaos when authored lines are fed in. (c) Evaluate floor behaviour with *simulated learners*: a harness Taxila can copy |
| **Duolingo Video Call** (Lily) | Character video calls | Added **push-to-talk** "so Lily stops interrupting mid-sentence"; captions for beginners | [S] | The largest consumer deployment retreated from hands-free for learners. Taxila keeps tap-to-talk as a fallback |
| **Praktika** | Avatar tutors; claims avatars "respond within 0.1 seconds" | not documented | [S, marketing] | Treat 0.1 s as a lip-sync claim, not a reply latency |
| **Khanmigo** | Text only in 2026 | — | [S] | No voice benchmark to beat in K-12 |
| **Ello** (K-3 reading) | Child-specific ASR (claims to beat Whisper and Google on kids) | **Waits until the end of the page** before speaking | [S, Fast Company / Common Sense] | A *task-structured* floor policy: when the expected text is known, hold the floor until a natural unit ends |
| **Amira** (reading, CMU ASR) | Real-time micro-interventions | Intervenes **at the moment of struggle**, mid-reading | [S] | The opposite policy, also task-structured: interrupt when the struggle signal is strong. Together, Ello and Amira show the right policy depends on the *activity*, not one global patience setting |

---

## 3. Side by side

### 3.1 Architecture and floor mechanics

| product | shape (§1) | decision cadence | turn-end signal | hears backchannels while speaking? | emits backchannels? | interruption policy | builds or thinks in parallel? | Hindi | usable by Taxila? |
|---|---|---|---|---|---|---|---|---|---|
| Tavus Griffin | C (video) | sub-second mini-turn | learned (audio + video + silence time) | yes (claimed) | yes: verbal and nod (claimed) | learned yield | undisclosed | ? | no (preview, not Azure) |
| Tavus CVI + Sparrow-2 | A+ | 10 ms frames | floor-ownership model | yes (97.4% interruption recall, self-reported) | no | pause → yield or resume | speculative drafts | ? | no (third-party AI) |
| GPT-Live-1 | D | "many times per second" | learned inside the FEM | yes (19/20 ignored, independent) | yes (12 acks in 117 pauses) | learned; 1.41 s median stop | **yes: backend delegation, thinking/commentary channels** | multilingual, unmeasured | Azure, yes, but dropped on price; conflicts with code-decides |
| gpt-realtime-2.1 | B | per turn | server or semantic VAD | no (stops 56/56) | no | stop + truncate (≤ 0.2 s) | tools block the turn | yes (Taxila premium lane) | yes (budgeted lane) |
| Gemini Live 3.8 | B (+ async tools) | per turn | AAD sensitivities | no (cancels) | no | cancel + discard | **NON_BLOCKING tools, INTERRUPT/WHEN_IDLE/SILENT** | yes | no (not Azure) |
| Sesame Maya | B [S] | per turn | ? | partial (2026 "overlap handling") | ? | ? | no | multilingual prosody (2026) [S] | no |
| Hume EVI | B | per turn | prosody EOU + silence 800 ms | no | no | stop, resume with context | supplemental LLM | 4-mini yes | **no: sunset 2026-11-13** |
| Kyutai Moshi | C | 80 ms frames | learned | yes | rarely (0.005) | learned | inner-monologue text | no | no (EN/FR) |
| Kyutai Unmute | A+ | per STT frame | semantic VAD head on the STT | barge-in | no | stop | any LLM + tools | no | method only |
| LiveKit Agents | A+ | per VAD pause + audio EOU | audio turn detector, 0.3-2.5 s | yes (adaptive interruption, cloud) | no | pause; resume on false interruption | preemptive generation | yes (detector) | method only (licence, cloud) |
| Pipecat | A+ | per VAD pause | Smart Turn v3.2 | via Krisp IP / min-words | no | per strategy | eager stop strategy | **yes, open** | **yes: BSD-2 weights** |
| Deepgram Flux | A+ | streaming | model-native EOT events | — | no | — | eager EOT → drafts | ? | no (third-party AI) |
| ElevenLabs Agents | A+ | streaming | proprietary speculative turn-taking | ignore-terms list | soft-timeout filler | stop | parallel tool calls | yes | no (third-party AI) |
| Azure Voice Live | A / B host | per pause | azure semantic VAD (+ audio EOU preview) | filler removal (EN list) | no | stop; auto-truncate | interim responses | **yes (+ hi-IN voices)** | **yes** |
| Nova 2 Sonic | B | per turn | 1.5-2.0 s pause | no | no | barge-in | — | ? | no (decision) |
| Speak tutor | D (GPT-Live) | as GPT-Live | as GPT-Live, tutor-framed | as GPT-Live | as GPT-Live | as GPT-Live | lesson script fed in | EN/ES | pattern |

### 3.2 Latency, by where it was measured

Most numbers are not comparable. Server-side events, byte arrival and "heard at the ear" differ by hundreds of ms.
turnprobe showed that server VAD commits about 590 ms after speech ends, while the reply is *heard* 1.38 s after.

| system | number | what it measures | who measured | n |
|---|---|---|---|---|
| Human, smooth transfer | starts a median **151 ms before** turn end | onset relative to turn end | TurnBench (30 h) | corpus |
| Human, Sparrow-2 blog | median 48 ms before turn end; over half in overlap | same | Tavus citing literature | — |
| Human, VideoFDB protocol | 1,400 ms ⚠ | input → recorded response | NVIDIA | 237 clips |
| Moshi | 160 ms theoretical, about 200 ms practical | model | Kyutai | — |
| Sparrow-1 / Sparrow-2 | 55 ms p50 / 632 ms median decision | floor decision | Tavus | 28 / dev split |
| Smart Turn v3.2 | 10-100 ms inference | classifier only | Daily | — |
| LiveKit adaptive interruption | 216 ms audio to trigger; ≤ 30 ms inference | barge-in decision | LiveKit | held-out set |
| Deepgram Flux | EOT p90 about 1 s, p95 about 1.5 s; eager 150-250 ms earlier | STT turn event | Deepgram [S] | — |
| GPT-Live-1 | 0.798 s turn-taking | vendor metric | OpenAI | — |
| GPT-Live-1 | **1.23-1.30 s p50, p90 1.47-1.83 s** reply gap; **1.41 s** stop | at the ear | turnprobe | 72-119 |
| gpt-realtime-2.1 | 1.38 s (server_vad 500) to 1.98 s (semantic low) p50 | at the ear | turnprobe | about 115 per arm |
| Griffin-Lite | 1,892 ms ⚠ median response; 0.43 s audio→video | VideoFDB protocol / lip-sync | NVIDIA / Tavus | 237 clips |
| Gemini 3.1 Flash Live | 1,720 ms ⚠ | VideoFDB protocol | NVIDIA | 237 |
| Nova 2 Sonic | 1.39 s TTFA; 1.5-2.0 s pause wait | vendor | AWS [S] | — |
| Kyutai Unmute | "below a second" | end to end | Kyutai | — |
| **Taxila cascade today** | **3,316 / 4,010 ms** first sound (900 ms silence + STT + Director + TTS) | end to end, server-instrumented | this repo [M] | 12 |
| Taxila India app | ≈ 3,040 ms first sound [E: stage sum] | — | this repo | — |

The gap is roughly 2 s to GPT-Live's at-the-ear reply. Most of it is *structural*, not model speed:
- the 900 ms silence wait;
- STT final arriving after the endpoint (live-transcribe partials land about 3.1 s *before* VAD stop, but the runtime
  waits for `completed`) [M];
- the Director starting only after commit.

All three move earlier under an A+/D design. That is an inference [E]; Study C should prototype and measure it.

### 3.3 Independent benchmarks worth adopting as yardsticks

| benchmark | what it scores | why Taxila cares |
|---|---|---|
| **turnprobe** (MIT code, CC-BY data) | pause sweep, backchannel vs interruption overlap, fragments, echo / side-talk / self-correction, measured at the ear with calibrated playout | The harness design Taxila should copy for `evals/duplex/`: a real-time pacer, emulated playout, stereo WAV, +10 ms calibration. Child stimuli would be our addition |
| **TurnBench** (30 h, 6 interaction styles, public leaderboard) | EOT recall / FPR / latency; interruption recall / FPR | Interruption false positives "concentrate in backchannel-dense styles". A teacher-child exchange is backchannel-dense |
| **VideoFDB** (NVIDIA, 237 clips, 11 nonverbal dynamics) | perception and generation of nonverbal turns, LM-judge | Relevant once the 3D teacher reacts nonverbally. Cascaded speech-to-avatar "fundamentally" cannot produce full-duplex nonverbal cues [V abstract]. That argues for code-driven nods and gaze *during* child speech |
| **Full-Duplex-Bench v1.5 / v2 / v3** | interactivity, multi-turn with an examiner, tool use under disfluency | v3's disfluent tool-use condition is close to a child self-correcting an answer |

---

## 4. Claimed vs demonstrated (one ledger)

| claim | by | status |
|---|---|---|
| Griffin passes a video Turing test | Tavus | **Weakly demonstrated**: 26/54 vs 1/41; 1-minute calls, one light topic, asked post hoc |
| Griffin #1 on VideoFDB | Tavus, NVIDIA leaderboard | **Demonstrated** under LM-as-judge; small score gaps unreliable (vendor-neutral write-up says so) |
| Griffin backchannels, yields, understands silence | Tavus | **Claimed** only; diagrams "not measured from a real session" |
| Sparrow-1: 100% P/R, 0 interruptions | Tavus | **Vendor test, n=28**, 400 ms grace window |
| Sparrow-2 TurnBench numbers | Tavus | **Self-reported on the public dev split**; the test set is pending |
| GPT-Live handles backchannels | OpenAI | **Demonstrated independently** (19/20 ignored) |
| GPT-Live handles interruptions naturally | OpenAI | **Contradicted on speed**: 1.41 s median stop, 1/15 never stopped |
| GPT-Live 0.798 s turn-taking | OpenAI | Vendor metric; independent at-the-ear reply gap 1.23-1.30 s |
| Semantic VAD rarely interrupts | OpenAI | **Demonstrated** (1-2/57 on unfinished clauses), at the price of 4-9 s waits and the fragment effect |
| LiveKit adaptive interruption: 86% P / 100% R | LiveKit | Vendor held-out set, n not stated |
| Smart Turn Hindi 93.44% | Daily | Vendor test split, n=1,295; **TurnBench interruption recall 0.107 (independent)** |
| Speak tutor: interruptions 13.6%, 476/477 lines | Speak | Vendor eval, simulated learners, partly stated n |
| ElevenLabs "under a second" | ElevenLabs | Claimed, configuration-dependent, no benchmark |
| Praktika "responds within 0.1 s" | Praktika | Marketing; almost certainly lip-sync, not reply |
| Moshi 200 ms | Kyutai | Demonstrated in the paper; poor backchannelling (FDB) |

---

## 5. Mechanisms that recur across products (the steal list for Studies B-D)

Each item names who ships it and how it would land in Taxila's rule of code decides, models speak.

1. **Floor ownership, not end-of-speech.** Ships in Sparrow, Griffin, Moshi and GPT-Live.
   - A floor model emits P(child holds | child yields | child invites a backchannel) every 10-40 ms. Code maps those
     probabilities plus lesson state to actions.
   - Seed it with Smart Turn v3.2 (open, Hindi) and train on our own children (Next-Turn-style label-free targets,
     voice-ux-smoothness S2).
2. **Commit-or-discard speculation.** Ships in Sparrow, Flux, LiveKit and Pipecat.
   - Start the Director's classify ∥ reply drafts on an *eager* floor signal, not on the 900 ms commit.
   - Discard on `resumed`, commit on `yield`.
   - Cost: Flux reports +50-70% LLM calls [V]. At Taxila's about $0.00023 per reply call that is ≈ $0.0001-0.00016
     extra per turn [E].
3. **A separate interruption classifier during teacher speech.** Ships in LiveKit, Krisp IP and Sparrow-2.
   - Smart Turn is weak at this (0.107 recall), so it needs its own head.
   - Its output feeds Taxila's existing pause-then-decide path (`cascadeLink.ts`). That path already matches
     LiveKit's `resume_false_interruption`.
4. **Speech track and task track are independent.** Ships in GPT-Live and Gemini async tools.
   - "Stop talking" never cancels a Studio build, a classify or a safety check.
   - A result that lands mid-conversation gets triaged in code as **INTERRUPT** (safety, always), **WHEN_IDLE**
     (a build is ready), or **SILENT** (learner-model update, absorbed as quiet context).
   - This is the mechanism behind "build things in parallel while the conversation happens".
5. **Quiet context vs spoken commentary.** Ships in GPT-Live (`thinking` vs `commentary`).
   - Taxila's equivalent: the brain keeps a *quiet* running model of the child's utterance (partial transcripts,
     prosody, classify-so-far) separate from what the mouth is allowed to say.
   - Only code-committed lines reach TTS. This preserves "never recite internal notes" (inherited law) by
     construction.
6. **Activity-specific patience.** Ships in Speak (tutor framing halves interruptions), Ello (wait for the unit) vs
   Amira (intervene at struggle), Tavus `turn_taking_patience`, ElevenLabs eagerness, Nova sensitivity, and LiveKit
   dynamic endpointing.
   - Patience should be a function of (activity, question type, this child's pause history), not one constant.
   - Examples: an open "explain in your own words" turn gets Sparrow-2-like 6-8 s tolerance; a yes/no check gets
     about 0.5 s; reading aloud uses an Ello-style unit hold with an Amira-style struggle trigger.
7. **Time as an input.** Ships in Griffin (sustained silence) and Tavus `idle_engagement`.
   - Silence length plus context means: thinking (wait, show a thinking pose), stuck (scaffold), or gone (check in).
   - That maps onto Taxila's waits ladder and trouble states.
8. **History matches what was heard.** Ships in OpenAI `conversation.item.truncate`, Voice Live `auto_truncate`, and
   PACE (arXiv 2608.07631, Study B).
   - When the teacher is cut off, the brain's record must end at the last *played* word.
   - Taxila's `cascade-barge-all-or-nothing` rejection already lists the failure: a reply cut while loading was never
     marked interrupted.
9. **Nonverbal backchannel first.** Ships in Griffin (nods and expressions on the action menu); VideoFDB says
   cascades miss nonverbal turns.
   - While the child speaks, the teacher's body (nod, gaze, "listening" pose) does the backchanneling, timed by the
     floor model's backchannel-opportunity output.
   - Audio "mm-hm" is used rarely, if ever. That keeps it consistent with voice-ux-smoothness S4 (visual
     backchannels, never audio) until a child test says otherwise.
10. **Lesson script fed into a live conductor.** Ships in Speak (476/477 lines).
    - Authored teaching beats are injected as committed lines. The live layer adapts timing and uptake but never
      skips a beat without code's consent.

---

## 6. Implications for Taxila (not an architecture; inputs to Studies C-D)

### 6.1 Where Taxila sits after this survey

- Cascade-by-default is **not** the laggard position it looks like. Kyutai, ElevenLabs, Tavus CVI, LiveKit, Pipecat
  and Speak all run cascades for anything needing reasoning or tools. They win on liveliness by adding a **frame-rate
  floor model + speculation + an interruption classifier + nonverbal listening**.
- Taxila has the cascade and the speculation (late). It is missing the floor model (it has a 900 ms constant), the
  interruption classifier (it has an energy VAD plus a transcript heuristic, `isBackchannel`), and early speculation.
- The "build in parallel" half of the brief (whiteboard, games, code animations during speech) has a clean product
  precedent only in GPT-Live's delegation model and Gemini's async tools. Taxila's Studio race (26.7 s to playable
  [M]) and Director already run server-side. What is missing is the **result-triage policy** (§5.4) and a
  floor-aware moment to surface results.

### 6.2 Why the model-owned floor (GPT-Live as sold) collides with Taxila's floor of rules [E, reasoned from the docs]

1. **Safety predicate first.** Taxila runs `scanSafety()` (about 31 µs) and then classify on the child's words
   *before* the teacher replies. GPT-Live's FEM may already be speaking about 1.3 s after the child stops. Our
   transcript arrives as asynchronous deltas, and there is **no `response.cancel`**: the only levers are
   `session.input_audio.mute` and injected instructions or commentary. So a passive-ideation utterance ("main na
   rahun toh") could get a cheerful reply before code sees it. That violates "child-safety floor above everything".
   An unmeasured mitigation would be to mute output client-side and speak a code-built safety line, but that is
   exactly a code-owned floor, which is the A+/D-in-code design anyway.
2. **Code makes decisions.** In GPT-Live the decision to answer mid-utterance is in OpenAI's weights and cannot be
   tuned. Speak shows framing moves it from 27.6% to 13.6%, but it cannot be set to "never cut a thinking child
   off" [V].
3. **Shapes, not lines; never recite.** GPT-Live paraphrases committed text (2/5 added teaching, 2/2 changed the
   language [M]). Committed lines in Taxila are verified kit content.
4. **Price.** About $3/h versus the cascade's ≈ $1.6/lesson-hour expected [M, MODEL-STACK §2: $0.0269/min]. That is
   the owner's stated drop reason.

**Reverse condition for this whole section:** a GPT-Live (or successor) API that exposes (a) a hold/release gate on
output and (b) floor-policy parameters, at a price below the cascade per lesson-hour. That would make a Study C
bake-off worth paying for.

### 6.3 What to carry into the architecture study (ranked by expected liveliness per rupee, [E])

1. A **floor controller in code**, fed by an open audio turn model (Smart Turn v3.2 seed) at 10-40 ms. It outputs
   `hold / yield / backchannel-opportunity / barge-in / backchannel-only`, with patience set by activity and child.
2. **Eager speculation**: the Director starts on `eager-yield`, discards on `resumed`. This is the largest latency cut
   available without new models.
3. **Use partial transcripts already in hand.** Live-transcribe partials land about 3.1 s before VAD stop [M]. MAI
   streams partials too. The brain can classify-so-far while the child is still talking ("thinking while listening").
4. **Nonverbal listening**: rig nods and gaze on backchannel opportunities. Zero audio risk.
5. **Result triage** (INTERRUPT / WHEN_IDLE / SILENT) for Studio, classify and safety results arriving mid-speech.
6. **A mid-utterance answer only on whitelisted, code-verified triggers**:
   - a safety trigger (always);
   - a child's direct question already complete by the floor model;
   - an Amira-style struggle signal in reading, or in a known-answer exercise where the expected answer is in the
     kit.

   Everything else waits for yield. Speak's and turnprobe's data say models that answer early mostly answer
   *incomplete* thoughts.

### 6.4 Measurements Taxila should own (do not trust vendor numbers)

Proposed for `evals/duplex/`. The design follows turnprobe; nothing was built in this study.
- **An at-the-ear harness**: a real-time 20 ms pacer, emulated playout, stereo recording, a calibration run.
  Without it, every latency in §3.2 is apples and oranges.
- **Child stimuli**: pause sweeps on *unfinished Hinglish clauses* ("matlab… jo plant hai na, woh…"),
  self-corrections ("seven, nahi nahi, eight"), backchannels during teacher speech ("haan", "hmm", "achha"), echo at
  speaker levels (-24/-18/-12 dB), TV or sibling side-talk. All synthetic first, then consented E1 recordings.
- **Metrics**: interruptions of unfinished clauses (target ≈ 0); reply gap p50/p90 at the ear; backchannel
  false-stop rate; true-barge-in stop latency (target under 300 ms, against GPT-Live's 1.41 s); unanswered turn ends
  (Sparrow-2 reports 7.6%).
- **Cost** [E]: our own pipeline run locally costs only Azure STT/LLM pennies. A GPT-Live comparison arm, if ever
  approved, costs about $0.05/min, so about $1-2 for a turnprobe-sized sweep (its runs cost $0.23-1.35 each on
  gpt-live-1 [V]). It needs owner approval because the model is dropped and has no quota (INDIA-MOVE: NOT DEPLOYED).

### 6.5 Open questions (not answerable from public product material)

- Does Griffin have a text reasoner, and how does its content stay grounded? Undisclosed.
- Hindi/Hinglish quality of GPT-Live's floor behaviour: does it cut Hinglish speakers more? Unmeasured anywhere.
- Smart Turn v3.2 on *children's* Hindi: the 93.44% is on its own (largely adult and synthetic) test split.
  Unmeasured on children.
- Whether Voice Live's `smart_end_of_turn_detection` handles Hindi children. Not documented; one probe on lane B
  (voice-ux-smoothness S8).
- Sparrow-2's 6-8 s pause tolerance is the only product number near child thinking-time norms. No open model
  documents it.
- The VideoFDB latency and score discrepancies between the Tavus page and the NVIDIA page (gpt-realtime perception
  2.97 vs 2.75; the human latency reference) need a direct read of the paper's tables (arXiv 2605.30256 HTML).

---

## 7. Proposed context entries (for the main loop to merge; this study writes only under docs/research/duplex/)

- **decision-candidate `duplex-shape-a-plus-toward-d-in-code`**: liveliness comes from a code-owned frame-rate
  floor controller, eager speculation, an interruption classifier, nonverbal listening and result triage, over the
  existing cascade. Not from buying a native duplex model.
  - Rationale: §0.1-0.4, §6.2. Every vendor with reasoning or tools ships A+; the one D product on Azure (GPT-Live)
    cannot gate speech for the safety predicate and is dropped on price.
  - Reverse if: a duplex API exposes an output hold gate plus floor-policy parameters at or below the cascade's cost
    per lesson-hour, *and* our at-the-ear harness shows it beats the A+ prototype on child stimuli.
- **measurement `ext-turnprobe-gpt-live-vs-realtime-2026-09`**: GPT-Live-1 ignored 19/20 backchannels, stopped for
  14/15 interruptions with a median of 1.41 s, and spoke into 54/117 mid-sentence pauses, with a reply gap p50
  1.23-1.30 s. gpt-realtime-2.1 stopped 56/56 within 85-189 ms; semantic VAD p90 reply ran 3.3-8.7 s, with the fragment
  effect (9.0-9.2 s). n=893 trials total, synthetic voices, one network, September 2026, external (sahasrarjn/turnprobe).
- **measurement `ext-speak-gpt-live-tutor-2026-09`**: thinking-pause interruptions 27.6% generic vs 13.6% tutor
  framing; under 10% on 1-2 s pauses; 476/477 authored lines over 27 simulated lessons. Vendor eval (Speak,
  2026-09-10); pause n not stated.
- **measurement `ext-turnbench-2026-09`**: human smooth transfers begin a median 151 ms before turn end. Best system
  VAP: EOT recall 0.845 at 5.5% FPR, 368 ms. SmartTurn v3 interruption recall 0.107. 30 h, triple-annotated, 14
  systems (arXiv 2608.25218).
- **rejection-candidate `rj-hume-evi`**: Hume EVI and TTS are sunset on 2026-11-13 [V]. Never shortlist it.
- **open `open-gpt-live-safety-gate`**: whether GPT-Live can be held silent until `scanSafety` and classify clear,
  via client mute plus commentary. Untested; it blocks any GPT-Live lane on the child-safety floor.

---

## 8. Sources

Tavus
- Griffin: https://www.tavus.io/griffin [V]
- Sparrow-1: https://www.tavus.io/blog/sparrow-1-human-level-conversational-timing-in-real-time-voice [V]
- Sparrow-2: https://www.tavus.io/blog/sparrow-2 [V]
- CVI conversational flow: https://docs.tavus.io/sections/conversational-video-interface/pal/conversational-flow [V]
- Third-party Griffin analysis: https://www.testmuai.com/blog/tavus-griffin/ [S]
- Press: https://www.businesswire.com/news/home/20261001092598/en/ (403 on fetch; [S] via search)

NVIDIA VideoFDB
- https://research.nvidia.com/labs/amri/projects/video-fdb/ [V]
- https://arxiv.org/abs/2605.30256 [V]

OpenAI GPT-Live / Realtime
- https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/gpt-live [V]
- https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/gpt-live [V]
- https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/gpt-live-delegation [V]
- https://learn.microsoft.com/en-us/azure/foundry/openai/gpt-live-reference [V]
- https://community.openai.com/t/introducing-gpt-live-1-in-the-api/1396471 [V]
- https://venturebeat.com/technology/openai-launches-gpt-live-a-full-duplex-voice-upgrade-that-lets-chatgpt-talk-more-like-a-person [S]
- https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/gpt-live-1-brings-more-conversational-voice-to-microsoft-foundry/4543593 [S, regions]
- https://developers.openai.com/api/docs/guides/realtime-vad [V]

turnprobe (independent)
- https://github.com/sahasrarjn/turnprobe (README) [V]
- https://www.sahasrarjn.com/blog/realtime-turn-detection/ [V]
- https://www.sahasrarjn.com/blog/gpt-live-vs-realtime/ [V]

Benchmarks
- TurnBench: https://arxiv.org/abs/2608.25218 and https://arxiv.org/html/2608.25218 [V]
- Full-Duplex-Bench v3: https://arxiv.org/abs/2604.04847 [S via search snippet of the paper]
- Frontend-backend tool calls in full-duplex: https://arxiv.org/abs/2609.19334 [V]

Google
- https://ai.google.dev/gemini-api/docs/live-api/capabilities [V]
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/asynchronous-function-calling [S]

Sesame
- https://research.contrary.com/company/sesame-ai and https://aiwiki.ai/wiki/sesame_csm [S]
- The Sesame research post URL returned 404

Hume
- https://dev.hume.ai/intro [V, sunset]
- https://dev.hume.ai/docs/speech-to-speech-evi/overview [V]
- https://releasebot.io/updates/hume [S]

Kyutai
- https://arxiv.org/abs/2410.00037 [V abstract]
- https://github.com/kyutai-labs/unmute (README) [V]
- https://github.com/kyutai-labs/delayed-streams-modeling (README) [V]

LiveKit
- https://docs.livekit.io/agents/logic/turns/ [V]
- https://docs.livekit.io/agents/logic/turns/turn-detector/ [V]
- https://livekit.com/blog/adaptive-interruption-handling [V]
- https://livekit.com/blog/turn-detection-and-interruption-handling [V]

Pipecat
- https://github.com/pipecat-ai/smart-turn [V]
- https://docs.pipecat.ai/api-reference/server/utilities/turn-management/user-turn-strategies [V]

Deepgram
- https://developers.deepgram.com/docs/flux/voice-agent-eager-eot [V]
- https://deepgram.com/learn/introducing-flux-conversational-speech-recognition [S]

ElevenLabs
- https://elevenlabs.io/blog/interaction-models [V]
- https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow [V]

Microsoft Voice Live
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to [V]

Amazon
- https://docs.aws.amazon.com/nova/latest/nova2-userguide/sonic-turn-taking.html [V]
- https://aws.amazon.com/blogs/machine-learning/how-loka-built-a-natural-low-latency-voice-agent-with-amazon-nova-2-sonic/ [S]

Education
- https://www.speak.com/blog/live-tutor-lessons-powered-by-openais-gpt-live-1 [V]
- https://www.speak.com/blog/building-speaks-voice-agent-platform [V]
- https://blog.duolingo.com/product-highlights/ [S]
- https://praktika.ai/ [S]
- https://www.commonsensemedia.org/ai-ratings/ello and https://www.fastcompany.com/91014953/ [S]
- https://amiralearning.com/amira-tutor [S]
- Khanmigo voice status via review sites [S]

In-repo, cited not re-run
- `docs/ops/MODEL-STACK.md` §2.3
- `docs/research/voice/voices-hindi.md` §3.1b
- `docs/research/world-best/voice-ux-smoothness.md`
- `context/decisions.md` (owner-drop-gpt-live-1, stt-mai2-stream-primary-india, owner-duplex-liveliness)
- `context/rejected.md` (cascade-barge-all-or-nothing)
- `src/lesson/cascadeLink.ts`
- `server/voice/stt.js`
