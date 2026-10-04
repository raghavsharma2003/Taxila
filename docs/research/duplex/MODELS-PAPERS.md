# Duplex liveliness, Study B: the models and the papers (2022 → October 2026)

**Date:** 2026-10-04. **Owner brief:** `owner-duplex-liveliness-2026-10-04`. While the child speaks, the teacher should
listen *and* think. It should decide whether to answer mid-utterance or wait for the whole sentence, backchannel,
handle interruptions, and build things in parallel. The brief is explicit that this is not STT → LLM → TTS turn-taking.

**Scope.** This is the research record of full-duplex spoken dialogue, 2022-2026:
- native duplex models: dGSLM, Moshi, SyncLLM, LSLM, Freeze-Omni, Mini-Omni2, VITA, OmniFlatten, MinMo,
  NTPP/Parrot, SALMONN-omni, the NVIDIA line, Meta's work, RoboEgo/FLM-Audio, and Human-1 for Hindi;
- the 2026 wave that splits "talk" from "think": dual-system, frontend/backend and delegation designs;
- the benchmarks: Full-Duplex-Bench v1, v1.5, v2 and v3, **IndicFDB**, Talking Turns, HumDial, TurnBench, TACT,
  LateIntent, DuplexJail and others;
- every *cascaded* duplex mechanism that has a measured result.

The question the study answers: **which mechanisms can Taxila use in a cascade** with commercial streaming STT and TTS,
code-made decisions and the child-safety floor, and what did each one measure? Native duplex models are not an option
here. None is on Azure for Hindi with our safety controls, and the one Azure duplex model (GPT-Live-1) is out of
scope on cost (`owner-drop-gpt-live-1-2026-10-04`).

**This file does not repeat** three earlier documents, which it cites where needed:
- `PRODUCTS.md` (Study A): the products, including GPT-Live-1's front-end/back-end split, Tavus Griffin and
  Sparrow-2, turnprobe, and the Hume sunset.
- `../world-best/voice-ux-smoothness.md`: Smart Turn v3, the VAP licence, the child VAP result (bAcc 94 vs silence
  AUC 0.62), and Voice Live EOU and AEC.
- `../voice/human-likeness.md`: timing norms, and the first look at Moshi and FDB v1.

**Evidence tags.**
- **[P]**: read in the paper's full text this session. 87 arXiv PDFs were downloaded and converted with
  `pdftotext`, and numbers were taken from the tables and text, not from abstracts or summaries. Where a table came
  out garbled, the tag says "text".
- **[V]**: a primary web page fetched through a summarising tool.
- **[S]**: secondary (a search snippet or third-party write-up).
- **[M]**: measured. **[M-here]** means measured by this study (§6). **[T]** means measured earlier in this repo
  (`context/`).
- **[E]**: an estimate or inference, always labelled.
- Paper numbers are the authors' own. Almost all are English or Chinese, adult speech, often synthetic. **None is a
  child, and none is Hinglish**, except IndicFDB (adult Hindi, mined from real conversations) and Human-1 (adult Hindi).

---

## 0. The answer on one page

1. **The field split in 2026, and the split points our way.** Through 2025, "full duplex" meant one model that hears
   and speaks on parallel streams (Moshi and its descendants). In 2026 the strongest systems pull apart three jobs:
   - *floor control*: a small, fast model or controller;
   - *thinking*: a big asynchronous LLM, plus tools;
   - *speaking*: streaming TTS or a speech head.

   Examples: SALMONN-duo, Realtime-Venus, NVIDIA's frontend-backend tool calls, MoshiRAG and Context Spanning.
   GPT-Live-1 has the same shape (Study A).

   **In the ICASSP 2026 HumDial full-duplex challenge, cascaded and semi-cascaded entries took ranks 1-3.** They
   scored final 76.6 / 73.5 / 71.0, against 62.3 for Gemini-2.5, 43.8 for Freeze-Omni and 34.5 for Moshi [P]. A cascade
   with a good controller is not the second-best option. On interruption plus rejection it is the measured best.

2. **No system yet is both fast and patient. That trade-off is the thing Taxila must beat, and code context is how.**
   IndicFDB (NVIDIA, Sept 2026) covers 10 Indian languages, 12,350 samples and 35 model-language pairs. "Every pair
   with sub-second turn taking latency has at most 90.16% pause handling success, and every pair above 99% responds
   after at least 1.125 s" [P].

   In Hindi:

   | | gap | pause handling (waits through pauses) | backchannel success |
   |---|---|---|---|
   | human reference | 0.259 s | 100% | 0.079 backchannels/s |
   | GPT Live | 0.181 s | 61.6% | 15.3% |
   | Gemini 3.8 | 1.400 s | 100% | 0.010 backchannels/s (hardly ever backchannels) |

   A generic model cannot know whether a pause is a child thinking. **Taxila's Director can.** It knows the item, the
   answer form expected (a number, a fraction, a why-explanation, a teach-back), how this child paces, and what a
   complete answer looks like. That is the one advantage a tutor has over a general assistant. Every mechanism below
   is ranked by how well it turns that context into timing.

3. **Answering *before* the child finishes is almost never right for an answer turn.** This study measured it (§6,
   M-B1) [M-here]. The 13 gradable child-answer stimuli were replayed word by word through the repo's own value
   extractor. Committing to the first *confirmed* value heard would have graded the wrong value:

   | transcripts | early verdict wrong |
   |---|---|
   | reference text | 5 / 13 (38%) |
   | production STT (D4) | 35 / 78 (45%) |
   | MAI-Transcribe-2-Streaming | 30 / 78 (38%) |

   The causes: self-corrections ("तीन बटा आठ नहीं नहीं तीन बटा चार"), operands spoken before the result
   ("नौ और छह मिलाकर पंद्रह"), and "seven eights are fifty six". Even an oracle that knew the final value saves a
   **median of 0 words** (mean 0.85), because the answer sits at or within two words of the end.

   So the latency win is at the **endpoint**, not in barging in. Two things follow:
   - The mid-utterance capabilities are for *other* moments. Distress always stops and attends. A child's "ruko" or
     "kya?" makes the teacher yield. A long off-track ramble gets a gentle hold-on.
   - Grading always waits for the end.

4. **"Think while listening" is real and measured, but its interruptions are not safe for children.** SHANKS
   (NTU/Microsoft, ACL 2026) is the closest paper to a tutor: the model listens to a user explaining a maths solution
   and interrupts on an error [P].
   - Its cascade variant (Whisper + Qwen-2.5-7B, 4 s chunks) interrupts **86.1%** of wrong solutions, and 78.3% of
     those interruptions are valid.
   - But it also interrupts **24.9% of fully correct solutions**. The E2E variant does so on 30.6%, the 3 s-chunk
     variant on 41.1%.
   - Its median interrupt arrives 5-7 s after the error.

   A quarter of correct children being cut off is disqualifying. The *thinking* half transfers well. SHANKS completed
   56.9% of tool calls before the user's turn ended, and Meta's think-while-listening work showed a 70% latency cut
   at equal accuracy. **The interrupting half must be decided by code against verified keys**, never by a model's
   judgement. That is the repo's "a model never grades" law, now with a number behind it.

5. **The cascade mechanisms with the best measured payoff, ranked for Taxila.** Full detail is in §5.

   | # | mechanism | evidence | where it is today |
   |---|---|---|---|
   | 1 | Speculation from the endpoint candidate, kept private until promoted | Endpoint Anticipation: −505 ms mean for +28.4% compute, on Unmute. PredGen: ~2× in simulation. Voice-Light: private candidates promoted only if the final transcript is lexically unchanged | Taxila already speculates replies (hits 10-11/12 [T]), but from the *final* commit, not the candidate |
   | 2 | Semantic/predictive end-of-turn computed beside ASR, with one causal label rule | Turn-aware ASR: 0.97 boundary recall at 0.39 s median, 0.3 false fires per speech-minute. FD-VAD: EOT recall 0.853 at FP ≤ 0.10. JAL-Turn: 12 ms on a shared encoder. Prosody beats text (F1 0.93, 7.8% false alarms at 400 ms) | **Warning:** Voice-Light found Smart Turn v3.2 worse than a tuned 640 ms silence policy on real English silence candidates: 13.5% vs 2.7% false cut-offs, 20.7% vs 95.6% recall. Small n, but it is the model `wb-predictive-endpoint` picked |
   | 3 | Commit-safe fast prefix, slow continuation | RelayS2S: P90 first chunk 81 ms vs 1,006 ms, 99% quality kept; 5-word prefixes good 82.5-95% with a verifier. Preface robot: initial latency 2.45 → 1.15 s in a real mall, n = 644 responses. MoshiRAG: a "keyword delay" of up to ~2 s lets retrieval finish behind the opening | Taxila's grounded uptake prelude (TEACHER-BRAIN L3) is this pattern, with a prefix that is safe by construction |
   | 4 | Reversible floor control with a playback-anchored context | PACE: referent anchoring 25.0% → 96.3%. Self-listening: 7.8% → 73.0%. Voice-Light: history only from browser-acknowledged audio. Personalised VAD: false barge-in 10.2% vs 33.4% (LiveKit) and 78.1% (TEN) for +30 ms | Taxila has pause-then-decide barge-in but sends only a boolean `teacher_interrupted`, not *how much was heard* |
   | 5 | Intent-aware interruption | HiThink Turn: interruption success 89% → 98%, stop latency −60.9%. A 0.5B LLM dialogue manager with four control tokens: > 93.5% accuracy. FlexDuo idle state: −23% false interruptions | — |
   | 6 | Dual-system delegation | SALMONN-duo, Realtime-Venus, NVIDIA frontend-backend (tool-call recall 92-97%). Talk continues while a backend works and its result is merged in | Live Studio's build race and the kernel are already shaped like this |

6. **The duplex-specific safety findings must shape the design from day one.**
   - **DuplexJail:** a spoken jailbreak *timed* to land mid-response raised attack success by 33.8-39.3 points on
     PersonaPlex.
   - **LateIntent:** three of four native duplex models engaged more with harmful requests whose intent arrived
     after a pause. A 1.5 s silence after the intent becomes clear brings this back near baseline.
   - **Spurious onsets:** Moshi and PersonaPlex start talking into digital silence in 30% and 27.5% of 5-minute runs.
   - **"Take the floor when asked, not when needed":** duplex models challenge a false claim in only 14-15% of
     replies, and warn of a hazard in 4-7%.

   For Taxila this means:
   - the safety predicate runs on **every partial**, not only finals;
   - no early commit on a prefix whose meaning can still turn;
   - the teacher never self-starts out of silence except from a code timer.

   The safety floor stays above everything. The duplex machinery adds detection points; it never removes one.

**Recommendation.** Build a **"listening teacher" cascade** (§7). The structure:
- an always-on ear;
- a code floor state machine fed by four sensors: the device VAD, streaming STT partials, a prosodic end-of-turn
  score, and an answer-form completeness check computed in code;
- listening notes made on every stable partial: code first, a fast model in parallel;
- speculation from the endpoint candidate;
- a commit-safe uptake prefix;
- playback-anchored history;
- Studio builds triggered from the listening notes rather than from the turn.

Grading and verdicts wait for the endpoint. Only safety, explicit floor requests and off-task holds act
mid-utterance. Section 8 is the integration plan for the Wave-2 code; nothing here edits `server/routes/lesson.js`,
`server/brain/**` or `src/child/lesson/**`. Section 9 lists the experiments, with pass bars.

---

## 1. Method

- **Corpus.** Three arXiv API title searches ("full-duplex", duplex+speech, end-of-turn/turn-taking, backchannel,
  speculative + spoken dialogue, "while listening"; about 400 hits), filtered to spoken dialogue. On top of those,
  the named papers from the brief. 87 papers were downloaded as PDFs and converted to text. The papers carrying the
  key numbers were read in their results sections, about 50 of them.
- **What counts as a result.** A number with its benchmark and n, taken from a table or results paragraph. A claim
  from an abstract alone is marked as such.
- **Measurement.** One deterministic measurement was run in this repo (§6). It needs no network, no models and no
  secrets.
- **Not done.**
  - No native duplex model was run. None has Hindi weights we may ship, except Human-1, which is not on Azure.
  - No commercial API was called.
  - No child audio exists yet (E1 is pending), so every child-specific claim below is either [E] or an experiment
    in §9.

---

## 2. The landscape in one picture

```
                    ┌──────────────── NATIVE DUPLEX (one model hears + speaks) ────────────────┐
 2022  dGSLM (Meta) ── two towers, Fisher units: natural turn timing, no meaning
 2024  Moshi (Kyutai) ── dual audio streams + inner-monologue text; 160/200 ms   ← the reference design
       SyncLLM (Meta/UW) ── time-chunked Llama; predicts the user's next chunk to hide 240 ms network
       LSLM ── listen-while-speaking fusion; interrupt (IRQ) token
       OmniFlatten / Mini-Omni2 / VITA ── flattened streams, command interrupts, two-instance duplex
       Freeze-Omni ── frozen LLM + chunk state head (listen / interrupt / ignore)
       SALMONN-omni ── codec-free, "thinking" tokens decide speak/listen
 2025  MinMo (Alibaba) ── duplex predictor head on the LLM; 600/800 ms
       NTPP (Parrot line) ── next-token-PAIR prediction over two channels
       SALM-Duplex (NVIDIA) ── streaming encoder in, codec agent out, no speech pretraining
       RoboEgo / FLM-Audio ── "natural monologue" text, 80 ms theoretical
 2026  PersonaPlex (NVIDIA, Moshi-based) ── role + voice prompts
       Human-1 (Josh Talks / VoiceArena) ── Moshi re-tokenised for Devanagari, 26k h Hindi
       BayLing-Duplex, MiniCPM-o 4.5, DuplexOmni, NemotronLabs VoiceChat (tool streams) ...
                    └───────────────────────────────────────────────────────────────────────────┘
                    ┌──────────── SPLIT DESIGNS (small listener/talker + big thinker) ──────────┐
 2025  FlexDuo, LLM-enhanced DM (Tencent, 0.5B semantic VAD), FireRedChat (pVAD + EoT), Easy Turn
 2026  DuplexCascade (VAD-free micro-turns), Voice-Light (causal + speculative + ack history),
       RelayS2S (fast prefix / slow continuation), SoulX-Duplug, HiThink Turn, JAL-Turn, FD-VAD,
       turn-aware ASR, Endpoint Anticipation, PACE, Self-Listening, MoshiRAG, Context Spanning,
       NVIDIA frontend-backend tools, SALMONN-duo, Realtime-Venus  ← where the field is now
                    └───────────────────────────────────────────────────────────────────────────┘
                    ┌───────────── THINK WHILE LISTENING / TALKING (reasoning timing) ──────────┐
       LiveMind (2024), PredGen (COLM 2025), STITCH (ICLR 2026), SHANKS (ACL 2026),
       Meta "Can Speech LLMs Think while Listening?", Chronological Thinking, FLAIR (latent)
                    └───────────────────────────────────────────────────────────────────────────┘
```

**Four ways to make a model "duplex"**, and what each one means for us:

| family | how listening and speaking coexist | examples | cost to us |
|---|---|---|---|
| A. Dual-stream / multistream | User and agent audio are parallel token streams at a fixed frame rate (80 ms for Mimi). The model emits silence or speech every frame | dGSLM, Moshi, PersonaPlex, Human-1, NTPP, SALM-Duplex | Needs a speech LM per language and voice, and two-channel conversational data (26k h for Hindi in Human-1). No Azure path. Safety and persona controls are weak |
| B. Time-multiplexed / flattened | Fixed chunks of user input alternate with output chunks in one sequence | SyncLLM, OmniFlatten, DuplexCascade (as text) | **DuplexCascade does this in TEXT with a stock LLM.** That is reachable for us |
| C. State-token controller | A small head or model reads the stream and emits {continue-listening, start-speaking, interrupt, ignore, backchannel, wait} | Freeze-Omni, MinMo, VITA, FlexDuo, LLM-DM, Easy Turn, SoulX-Duplug, HiThink | **Directly reachable.** The controller is code plus small models; the brain is unchanged |
| D. Split: talker + thinker | A real-time front end keeps the floor while a backend reasons or calls tools asynchronously; results are merged into the dialogue | SALMONN-duo, Realtime-Venus, NVIDIA frontend-backend, MoshiRAG, RelayS2S, GPT-Live-1 | **Our natural shape.** The front end is code + STT + TTS; the backend is the Director, classify and Studio |

---

## 3. The native models: mechanism, measured result, what transfers

Each entry ends with **Steal**: what survives in a cascade.

### 3.1 dGSLM: Generative Spoken Dialogue Language Modeling (Meta, Nguyen et al., 2022; TACL 2023) [P]

- **Mechanism.** Two transformer towers share weights and cross-attend, one per channel. They are trained on
  2,000 h of Fisher two-channel telephone speech, using HuBERT units with edge-unit and duration prediction.
- **Result.** It reproduces the *statistics* of turn-taking: IPUs, pauses, gaps and overlaps per minute come close to
  the ground truth (the DLM-5 rows of the paper's Table 2). The content is babble; the paper reports low
  meaningfulness MOS.
- **Lesson.** Timing can be learned from audio alone. Meaning cannot.
- **Steal.** The turn-taking *event taxonomy* (IPU, pause, gap, overlap, backchannel) and the **floor-transfer offset
  (FTO)** metric. FTO is our KPI for every child turn (§9).

### 3.2 Moshi (Kyutai, Défossez et al., Sept 2024) [P]

- **Mechanism.**
  - The Helium 7B text LM sits over the Mimi codec: 12.5 Hz, 80 ms frames, 1.1 kbps.
  - An RQ-Transformer (temporal plus depth) models **two audio streams**, the user's and Moshi's.
  - **Inner Monologue:** time-aligned text tokens of Moshi's *own* speech are predicted as a prefix to its audio
    tokens. PAD tokens are about 65% of the text stream in English conversation. The user's stream is *not*
    transcribed.
  - An acoustic delay of 1 frame gives a theoretical latency of 160 ms; it is 200 ms in practice.
- **Results.**
  - Inner Monologue roughly triples spoken QA: Web Q 9.2 → 26.6, LlaMA-Q 21.0 → 62.3, Audio TriviaQA 7.3 → 22.8.
  - Changing only the text/audio delay turns the same architecture into streaming TTS (4.7% WER on LibriSpeech
    test-clean with 2 s lookahead) or streaming ASR.
- **Failures measured by others.**
  - FDB v1: pause-handling takeover rate 0.985 (synthetic) / 0.980 (Candor); backchannel frequency 0.001
    (JSD 0.957) [P].
  - FDB v1.5: stays silent or "unknown" on 92% of backchannels.
  - IndicFDB English: pause success 57.5%, backchannel success 3.1%.
  - Spurious onsets in 30% of 5-minute runs of digital silence (§3.14).
- **Steal.**
  1. **Text-first scaffolding.** The model plans words, then speaks them. In a cascade the LLM text *is* the inner
     monologue, which is why cascades keep their intelligence (FDB-v2 below).
  2. **"Delay" as a design knob between streams.** It becomes our *lookahead* budget: how far TTS may run ahead of
     what the controller has confirmed.

### 3.3 SyncLLM: "Beyond Turn-Based Interfaces" (Meta + UW, Veluri et al., EMNLP 2024) [P]

- **Mechanism.** Llama-3-8B is trained on interleaved **time chunks** (160-240 ms) of both speakers' HuBERT units.
  To stay in sync over the internet, it first **predicts the user's next chunk**, appends that estimate, then
  generates its own chunk. This makes it tolerant to up to 240 ms of network latency.
- **Training.** 212k h of synthetic spoken dialogue plus only 2k h of real dialogue (Fisher).
- **Result.** Better meaningfulness than dGSLM at equal naturalness. It generalises from Fisher to Candor.
- **Steal.** **Predict the speaker's continuation to act before it arrives.** In text, this is exactly PredGen and the
  "question completeness" idea (§5.3, §5.4). For a tutor the continuation is unusually predictable, because the
  question constrains the answer. But M-B1 (§6) shows the *final value* is what arrives last.

### 3.4 LSLM: "Language Model Can Listen While Speaking" (Ma et al., Aug 2024) [P]

- **Mechanism.** A token-based decoder-only TTS speaks while a streaming SSL encoder listens. Three fusion points were
  tried (early, middle, late). The model emits an IRQ token to stop.
- **Result.** Middle fusion was best:

  | condition | WER | interrupt precision | recall | F1 |
  |---|---|---|---|---|
  | command-based, clean | 4.05% | 97.80% | 98.19% | 98.00% |
  | voice-based (diverse commands, unseen speakers), noisy | 8.50% | 87.69% | 82.77% | 85.15% |

  The test set was 1,000 utterances, half with an interruption.
- **Steal.** Moving from clean command-based interruptions to noisy, diverse voice interruptions costs about 13 F1 points,
  even in a dedicated model. Indian homes
  are noisy. Our barge-in must stay **pause-then-decide** (already `cascade-barge-pause-decide`), never stop on onset.

### 3.5 Freeze-Omni (Tencent/NWPU, Wang et al., Nov 2024) [P]

- **Mechanism.** The LLM (Qwen2-7B) is **frozen**. A chunk-level **state head** on its hidden states predicts:
  - 0 = keep listening;
  - 1 = end of speech, interrupt and generate;
  - 2 = end of speech, no need to respond.

  An acoustic VAD gates it.
- **Latency.** LLM interrupted → first text chunk 478 ms mean (468 p50). The authors' real-scenario estimate is about
  1.2 s including 200-300 ms of network.
- **Benchmarks.**
  - FDB v1: the lowest open-model takeover during pauses (0.642 / 0.481) but slow (smooth-turn latency 0.953 s;
    interruption latency 1.409 s; GPT-4o-judged relevance 3.615).
  - HumDial: best rejection among baselines (50.2) but interruption 29.6.
  - FDB-v2: correction 2.74, entity tracking 2.62.
- **Steal.** **A frozen brain plus a separate state controller works, and it is the most patient.** This is our design
  with the Director as the frozen brain. Its weakness, slowness, comes from serial text → speech, which our speculation
  and prefix mechanisms address.

### 3.6 Mini-Omni2 (Xie & Wu, Oct 2024) and VITA / VITA-1.5 (Fu et al., 2024-25) [P]

- **Mini-Omni2: command-based interruption.** The model stops on a spoken stop-command ("Stop Omni"); there is no
  general barge-in model.
- **VITA-1.0: two model instances.** One generates while the other monitors the audio. When the monitor detects a
  real query, the two swap roles. State tokens classify input as a query or noise. VITA-1.5 drops the separate ASR and
  TTS for end-to-end speech.
- **Steal.**
  - Explicit **lexical floor commands** are the most reliable interruption signal there is. Taxila already treats a
    push-to-talk press or typing as an outright stop. Spoken "ruko / stop / ek minute / wait" should be a fast path
    too. HiThink (§5.7) and Voice-Light both keep a lexical fast path.
  - VITA's monitor/generator split is the ancestor of the 2026 split designs.

### 3.7 OmniFlatten (Alibaba, Oct 2024) [P]

- **Mechanism.** Text and speech streams for both speakers are **flattened** into one sequence for an unmodified GPT
  backbone. Training is staged: modality alignment, then half-duplex, then full-duplex.
- **Steal.** A *text-only* version of this flattening is what DuplexCascade does (§5.2). That path keeps a stock LLM.

### 3.8 MinMo (Alibaba FunAudioLLM, Jan 2025) [P]

- **Mechanism.** About 8B parameters, trained on about 1.4M h of speech. A **Full Duplex Predictor** reads the LLM's
  hidden embeddings and decides whether to respond.
- **Latency.** Speech-to-text about 100 ms. Full-duplex latency 600 ms in theory, 800 ms in practice.
- **Turn-taking.**
  - User turn-taking (the system stops when the user speaks): mean response 250 ms (88.8 ms on human-machine data,
    448.8 ms on Alimeeting).
  - Assistant turn-taking (the system starts when the user ends): about 660 ms.
- **Backchannels.** Recognising user backchannels is "70%-80%" accurate. The authors note a **trade-off with
  user-turn-taking sensitivity**: the more eagerly it stops for the user, the more backchannels it mistakes for
  interruptions.
- **Steal.** That trade-off is fundamental. A stop policy that is good for children (yield fast) will treat more "haan"
  and "hmm" as turns. Our transcript-decides rule plus the ≥ 1 s-remaining condition (`cascadeLink.ts`) is the right
  structure. The threshold must be tuned on child data.

### 3.9 NTPP / the Parrot line (Wang et al., ICML 2025) [P]

- **Mechanism.** **Next-token-pair prediction** over two channels with a decoder-only model. It is speaker-independent,
  so the model learns both sides of a conversation.
- **Result.** Better turn-taking prediction and response coherence than prior dual-channel models. FLEXI suggests
  NTPP as "a promising path".
- **Steal.** Nothing directly. It needs two-channel speech LMs.

### 3.10 SALMONN-omni (Tsinghua/ByteDance, Nov 2024 → May 2025) [P]

- **Mechanism.** Codec-free: speech is embedded, not tokenised into the LLM vocabulary. A **dynamic "thinking"
  mechanism** inside the LLM decides when to switch between listening and speaking. The model hears its own output
  stream, which gives it built-in echo awareness.
- **Result.** "At least 30% relative" improvement over open full-duplex models on spoken QA and open-domain dialogue.
- **The 2026 successor is SALMONN-duo** (§5.9): an always-on full-duplex front end plus an asynchronous slow LLM agent.
- **Steal.** Listening to one's *own* output is what makes self-interruption and echo handling sane. Our cascade has
  the playback clock instead (§5.8).

### 3.11 The NVIDIA line [P]

- **SALM-Duplex (May 2025).**
  - A streaming encoder for user audio, codec output for the agent, and channel fusion.
  - It is the first duplex S2S model with **no speech pretraining**, at a 0.6 kbps agent codec.
  - It beats earlier duplex models on reasoning, turn-taking and barge-in.
- **PersonaPlex (Jan 2026; Moshi-based).** Role prompts plus voice cloning from a speech sample, trained on synthetic
  prompt+dialogue data.
  - IndicFDB English: the only model-language pair with **sub-second turn-taking (0.360 s) and > 75% pause handling
    (90.16%)**. Lowest JSD (0.799) at a human-like 0.091 backchannels/s.
  - English-only; NVIDIA Open Model License (Study A / world-best).
  - It is also the model DuplexJail attacked most easily (§5.10).
- **NemotronLabs VoiceChat (Sept 2026).**
  - A streaming encoder and decoder LM with **parallel output streams**: agent text, structured function calls, an
    auxiliary RNN-T branch for incremental user transcription, and streaming TTS.
  - FDB 1.0: the lowest pause takeover among open models, 100% takeover after an interruption, post-interruption
    quality 4.33/5.
  - FDB 1.5: resumes after user backchannels 93% of the time.
  - FDB 3.0: tool-selection F1 82.5%.
- **Frontend-backend tool calls (Sept 2026).** A duplex speech-to-text front end emits a delegation token and forwards
  the streaming transcript to a text backend LLM. Results come back through "prefill-and-repeat".
  - Tool-call recall 92-97%; correctly rejects 81.2% of irrelevant calls.
  - With a Qwen3-235B backend it beats GPT-realtime-mini on FDB-v3.
- **IndicFDB (Sept 2026)** is NVIDIA's benchmark (§4.2).
- **Steal.**
  - The separate **user-transcript stream** inside a duplex model (RNN-T branch) is NVIDIA admitting that the brain
    needs text.
  - The **delegation token** is the cleanest form of "talk now, think in the backend". Our equivalent is the Director
    and Studio proposals arriving asynchronously through the kernel.

### 3.12 Meta's full-duplex research

- dGSLM and SyncLLM, above.
- **"Can Speech LLMs Think while Listening?"** (Shih et al., Meta Superintelligence Labs, Oct 2025) [P]:
  - Chain-of-thought fine-tuning of a *multi-stream* speech LLM improves spoken reasoning accuracy by **2.4×** on
    average.
  - To recover the latency, the model starts reasoning *before the question ends*. An entropy-based **"question
    completeness"** score picks the moment.
  - At equal latency, this gives +4% accuracy on ARC-Easy over heuristic start points.
  - DPO on rejection-sampled preferences then gives **a 70% latency reduction at no accuracy loss**.
- **Steal.** A *completeness score over the partial transcript* decides when thinking may start. For a tutor this score
  can be computed in code from the expected answer form (§7.3), with an LLM entropy score as a fallback for open "why"
  answers.

### 3.13 RoboEgo / FLM-Audio (BAAI and others, 2025) [P]

- **RoboEgo (FLM-Ego)** is an omnimodal model with native full duplexity: theoretical duplex latency **80 ms**, with
  content quality "comparable" to semi-duplex omni models in real streaming visual dialogue.
- **FLM-Audio** introduces **"natural monologues"**: sentence-level text the model speaks, *not* word-aligned with
  padding the way Moshi's inner monologue is. Dual training alternates monologue position (before vs after audio).
- **Steal.** Sentence-level planning ahead of speech, not word-level, is how a cascade already works. It confirms that
  the planner may run whole sentences ahead of the speaker.

### 3.14 Human-1: the first Hindi full-duplex model (Josh Talks / VoiceArena, Apr 2026, rev. Sept 2026) [P]

- **Mechanism.** Built from Moshi. It trains a **Hindi tokenizer**, reinitialises the vocabulary-dependent parameters,
  and keeps the audio pathway and the frozen Mimi codec. Two-stage training on **26,000 h of spontaneous two-channel
  Hindi from 14,695 speakers**.
- **Results.**
  - Naturalness 4.10 vs 4.55 for human speech; 66.9% of paired comparisons tie. Gap and pause statistics match real
    conversations.
  - IndicFDB Hindi: the most human-like backchannel timing of any system (JSD 0.795, 0.110 backchannels/s against a
    human 0.079), pause handling 72.1% (GPT Live 61.6%).
  - But turn-taking latency is **2.021 s** and the interruption-response rating is **0.564/5**, where other Hindi
    systems rate 4.86-4.97.
- **Reading.**
  - **Hindi duplex *timing* is learnable from 26k h of real two-channel data.** That is the first proof in our
    language.
  - **A duplex model trained on conversation has no content quality and no safety layer.** A 0.56/5 response rating
    with a child is not shippable.
  - Not on Azure.
- **Steal.**
  - The **data recipe and the timing statistics**: Hindi human gaps of 0.259 s and backchannels at 0.079/s are
    targets for our controller.
  - A labelling heuristic for child FTO from E1 two-channel recordings (§9).

### 3.15 Others in the 2026 wave (abstract-level unless stated)

- **BayLing-Duplex** (Jun 2026): a single autoregressive LLM with a few special tokens decides listen, speak and
  stop, with no auxiliary module.
- **MiniCPM-o 4.5** (Apr 2026): an omni-modal full-duplex model. DuplexCascade's table lists "MiniCPM-Duplex".
- **DuplexOmni** (Jun 2026): listen, see, think and speak.
- **MultiTalk** (Sept 2026): multi-party and bilingual.
- **CharDuplex**: persona consistency.
- **Spurious onsets** (MIT, Sept 2026) [P]: under digital-zero input, Moshi and PersonaPlex start speaking in
  **30% / 27.5%** of 5-minute continuations. At every onset the speech probability **spikes by > 9 orders of magnitude
  in one 80 ms frame**, a self-conditioning collapse, not slow drift. The fix is a counterfactual test ("would the next
  token change if the user input were muted?"). It keeps genuine responses at one-sided 95% lower bounds of
  96.9-99.3%, with a 61 ms p95 decision time.
- **Steal.** A self-starting teacher is a failure mode. Every teacher onset in our design is caused by an endpoint, a
  code timer (an idle nudge) or a beat transition, never by "the model felt like it".

---

## 4. The benchmarks: what they measure, and what they say about cascades

### 4.1 Full-Duplex-Bench v1 → v3 (Lin et al., NTU/Berkeley, 2025-26) [P]

**FDB v1** has four behaviours: pause handling, backchannel, smooth turn-taking and user interruption. The core metric
is the takeover rate (TOR). Table III:

| | dGSLM | Moshi | Freeze-Omni | Gemini Live |
|---|---|---|---|---|
| pause TOR ↓ (synthetic / Candor) | 0.934 / 0.935 | 0.985 / 0.980 | 0.642 / 0.481 | **0.255 / 0.310** |
| backchannel TOR ↓ / freq ↑ / JSD ↓ | 0.691 / 0.015 / 0.934 | 1.000 / 0.001 / 0.957 | 0.636 / 0.001 / 0.997 | 0.091 / 0.012 / 0.896 |
| smooth turn TOR ↑ / latency s | 0.975 / 0.352 | 0.941 / 0.265 | 0.336 / 0.953 | 0.655 / 1.301 |
| interruption TOR ↑ / GPT-4o score ↑ / latency s | 0.917 / 0.201 / 2.531 | 1.000 / 0.765 / 0.257 | 0.867 / 3.615 / 1.409 | 0.891 / 3.376 / 1.183 |

The pattern: end-to-end duplex models are **fast and rude**. They take over during pauses and answer interruptions
with irrelevant content (GPT score 0.765 for Moshi). Controlled or cascaded systems are **patient and relevant but
slow**.

**FDB v1.5: overlap handling** (n = 200 interruptions, 99 backchannels, 100 talking-to-others, 100 background speech).
GPT-4o Realtime is the most decisive:

| system | stop after a user interruption | re-enter |
|---|---|---|
| GPT-4o Realtime | 0.23 s | 1.50 s |
| Moshi | 1.16 s | 1.47 s |
| Gemini | 2.20 s | 2.62 s |
| Nova Sonic | 2.25 s | 2.75 s |

On user backchannels, Sonic resumes in 98% and Gemini in 93%, but GPT-4o in only 70%. GPT-4o also *responds* to
background speech 93% of the time, where Sonic resumes 98% of the time. The authors name two strategies: "repair-first"
(yield fast) and "continuity-first" (keep the floor).

**For a child tutor the right setting is per moment**, not per system:
- *continuity-first* while the teacher delivers a two-clause instruction and the sibling talks in the background;
- *repair-first* when the child says "kya?".

**FDB v2: multi-turn, with an automated examiner.**

| task score (fast pacing) | correction | entity tracking | safety |
|---|---|---|---|
| GPT-Realtime | 4.02 | 4.51 | 4.44 |
| Moshi | 2.88 | 2.76 | 3.67 |
| Freeze-Omni | 2.74 | 2.62 | 3.94 |

Instruction-following "falls quickly" over a dialogue, while turn-taking decays slowly.

**FDB v3: tool use under real disfluent speech.**

| system | Pass@1 | latency | turn-take | interruption avoidance |
|---|---|---|---|---|
| GPT-Realtime | **0.600** | — | — | **13.5%** |
| Gemini Live 3.1 | — | 4.25 s (fastest) | 78.0% (lowest) | — |
| Cascaded Whisper → GPT-4o → TTS | — | **10.12 s** (highest) | **perfect** | — |

**Self-correction handling is a top failure for every system.** That is the d01/d03 case in M-B1 (§6), and children
self-correct constantly [E: Rowe-era classroom literature; to be measured on E1].

### 4.2 IndicFDB: the benchmark that is about our users (NVIDIA + VoiceArena, Sept 2026) [P]

- **Data.** 10 Indian languages and 12,350 samples, mined from about 50,000 h of channel-separated real conversations
  with VAD heuristics. Interruption samples are synthetic and human-validated. Timing is scored by
  language-independent VAD rules: an utterance under 1.2 s is a backchannel, over 2 s a takeover. Content is
  transcribed and translated to English with open models and rated by an LLM.
- **Hindi rows** (Table 2):

| system | pause S.R. ↑ | turn-taking S.R. / latency | backchannel S.R. / JSD / freq | interruption S.R. / latency / rating |
|---|---|---|---|---|
| **Human** | 100 | 100 / **0.259 s** | 100 / 0.000 / **0.079** | — |
| GPT Live | 61.59 | 91.06 / **0.181 s** | 15.32 / 0.822 / 0.109 | 100 / 0.322 / 4.857 |
| Grok Voice Think Fast 2.0 | 99.05 | 85.11 / 2.556 s | 98.18 / 0.986 / 0.004 | 99.67 / 1.628 / 4.960 |
| Gemini 3.8 Live | 100 | 99.15 / 1.400 s | 98.18 / 0.942 / 0.010 | 100 / 1.255 / 4.970 |
| Gemini 3.1 Flash Live | 100 | 98.30 / 2.128 s | 100 / 0.990 / 0.003 | 100 / 1.678 / 4.973 |
| Human-1 (Hindi duplex) | 72.06 | 89.36 / 2.021 s | 45.97 / **0.795** / 0.110 | 95.67 / 1.573 / **0.564** |

- **Headline (authors).** "Commercial APIs ... are either fast or robust to pauses, never both." There are 35
  model-language pairs. A backchannel "success" counts silence as success, so Gemini's 98-100% hides near-zero
  backchannel rates.
- **What it means for Taxila.**
  1. **The Hindi human turn gap is 259 ms. Our cascade gap is about 3 s** [T] (the India app estimate ≈ 2.9 s). The
     target is not 259 ms, because a tutor pausing well beats a tutor answering instantly (Rowe wait time,
     TEACHER-BRAIN §5.4). But the *first sign of uptake* (receipt, gesture, prefix) must land near human timing.
  2. **The best fast system takes over in 38% of natural Hindi pauses.** Children pause more and longer than adults
     [E; world-best §S1 child VAP data]. So any fixed fast policy will cut off children. The threshold must come from
     context (§7.3).
  3. **Human Hindi backchannel rate is 0.07-0.10 per second**: about one per 10-14 s of listener time. A child's
     10-second teach-back deserves roughly one acknowledgement, visual or audio. Silence for the whole explanation is
     a measurable deviation (JSD = 1).

### 4.3 Talking Turns (CMU and others, ICLR 2025) [P]

- **Method.** A judge model trained on Switchboard turn-taking events scores live user sessions with Moshi and with a
  VAD-based cascade (Silero, Whisper-tiny, SmolLM-135M, Melo).
- **Findings.**
  - Both "sometimes do not understand when to speak up".
  - Moshi "interrupts too aggressively" at unlikely points.
  - **Both rarely backchannel.**
  - Neither gives cues about whether it wants to keep the floor.
  - Moshi mostly keeps talking when interrupted, while the cascade yields.
- **Steal.** **Floor-keeping cues**: a teacher who is mid-thought should *sound* mid-thought. That means
  continuation prosody, "aur...", or the face. HUMAN-VOICE owns this.

### 4.4 HumDial (ICASSP 2026 Grand Challenge, full-duplex track) [P]

- **Design.** Real human-recorded dual-channel conversations. Scenarios: **interruption** (follow-up, repeat request,
  topic switch, silence/stop) and **rejection** (user backchannels, third-party speech, user talking to someone else,
  …). Scored on interruption, rejection and delay.

| rank | team (architecture) | interruption | rejection | delay s | final |
|---|---|---|---|---|---|
| 1 | Cookie asr (cascaded) | 79.3 | 72.2 | 1.260 | **76.6** |
| 2 | Badcat (semi-cascaded, unit-based agent) | 89.7 | 57.8 | 1.632 | 73.5 |
| 3 | SenseDialog (semi-cascaded; SenseTime) | 76.4 | 60.9 | 1.237 | 71.0 |
| – | Gemini-2.5 | 79.8 | 36.5 | 1.301 | 62.3 |
| – | Freeze-Omni | 29.6 | 50.2 | 2.578 | 43.8 |
| – | Moshi | 35.4 | 22.8 | 2.876 | 34.5 |

- **The organisers' analysis.**
  - "Most submissions adopt cascaded or semi-cascaded pipelines ... dominant due to its modularity and
    controllability."
  - Turn-taking strategy is "the most distinctive factor".
  - End-to-end entries suffer "auditory blindness" during generation.
  - Every system's weak spots are third-party speech and transient noise.
- **Steal.** **Rejection** (not answering the sibling, the TV, or the child talking to mum) is half the score and the
  weakest skill everywhere. In Indian homes it may matter more than interruption [E].

### 4.5 TurnBench (Sesame, Aug 2026) [P]

- **Data.** 30 h of hand-labelled dyadic conversation, triple-annotated across six interaction styles, plus a 104 h
  training set. 14 systems were benchmarked.
- **Findings.**
  - End-of-turn recall is stable across styles.
  - **Interruption false positives are strongly style-dependent and concentrate in backchannel-dense styles.**
  - In smooth transfers, humans start a **median 151 ms *before*** the turn ends. No system matches that without
    excessive false positives.
- **Steal.** Only *anticipation* gets below 0 ms. That is why Endpoint Anticipation (§5.3) matters more than a faster
  detector.

### 4.6 Intent, safety and content benchmarks [P]

- **TACT, "Neither Silence nor Overlap Is Failure"** (Sept 2026). 9,728 episodes. Timing is scored against
  intent-conditioned human floor-transfer distributions. The best of 11 systems scores 0.47 against a human 0.86.
  TACT agrees with humans at Spearman 0.81, where binary metrics manage 0.46.
  - **Lesson:** "wait 3 s" can be right and "overlap" can be right. It depends on the speaker's intent. Score our
    timing per move type, not with one latency number (§9).
- **LateIntent-Bench** (Sept 2026). 3,136 sessions with a shared ambiguous prefix that then turns benign or harmful.
  Three of four native duplex models **increased harmful engagement** when intent arrived late. **Inserting 1.5 s of
  silence after intent revelation kept the premature-response rate near baseline.**
- **DuplexJail** (UMass/Dolby, Sept 2026). Fixed spoken jailbreak prompts injected *during* the model's response.
  Guided Completion at a 1.0 s delay raised whole-response attack success to 40.3% (PersonaPlex) and 48.7%
  (PersonaPlex-RL), **+33.8 and +39.3 points**. On HarmBench, held out, a 0.5 s delay added 14.7 / 12.3 points.
  BayLing-Duplex got *less* harmful.
  - **Lesson:** a mid-response user input is a new turn and passes through the full guard path. It is never "context
    appended to the ongoing generation".
- **"Take the floor when asked, not when needed"** (Sept 2026). Across five model families, being addressed and
  silence trigger speech reliably. False facts and hazards do not: only 14-15% of false-fact replies challenge the
  claim, and 4-7% of hazard replies warn. Permission to interrupt does not close the gap.
  - **Lesson:** a model will not self-select to correct the child. If we *want* a mid-utterance correction, code must
    decide it.
- **Duplex Cue: "Continue, Adapt, or Yield"** (Sept 2026). 300 human-confirmed listener cues. On 66 collaborative
  cues (the listener supplies a word or a correction), human speakers **adapt within the turn 68.2%** of the time.
  PersonaPlex does so 34.8% of the time, otherwise continuing unchanged (42.4%) or yielding (22.7%).
  - **Lesson:** a third response exists beside "stop" and "continue": *fold the child's interjection in and carry
    on*. A child who calls out the answer while the teacher is still asking it should hear "haan, बिल्कुल, seven..."
    and not have the teacher stop dead or ignore them (§7.4).
- **MTR-DuplexBench, FLEXI, τ-Voice, Game-Time, VideoFDB:**
  - all show multi-round degradation, emergency-awareness gaps, tool-use gaps and weak tempo/time-awareness;
  - VideoFDB: "cascaded speech-to-avatar systems ... fundamentally preclude the production of full-duplex nonverbal
    cues".
  - **Lesson for our avatar:** the face must be driven by the *listening* controller (nods, gaze, lean-in while the
    child speaks), not only by the reply. Griffin's VideoFDB scores (Study A) are the bar.

---

## 5. The cascaded-duplex mechanisms: evidence and the Taxila mapping

Each mechanism lists what it is, what was measured, the child/Hinglish risk, and where it lands in Taxila.
Implementation lives under `server/duplex/**` and `src/duplex/**`; integration goes through the seams in §8.

### 5.1 Always-on ear plus reversible floor control

- **What it is.** The microphone and the STT stream stay open for the whole lesson. A fast acoustic onset (VAD,
  32-80 ms) *ducks or pauses* the teacher immediately but **discards nothing**. Only stronger evidence commits a stop:
  lexical content, a learned floor-take probability, or sustained speech.
- **Evidence.**
  - Voice-Light [P] is exactly this:
    - fade toward −15 dB over 450 ms, paused by 500 ms;
    - a floor-take probability above 0.82 commits;
    - a non-floor-feedback probability above 0.82 *resumes the same generation without adding a user turn*;
    - sustained speech commits after 900 ms;
    - paused audio stays resumable for 800 ms;
    - a committed interrupt drops new server PCM and fades no more than 100 ms of buffered audio.
  - FireRedChat [P]: a **personalised VAD** (enrolled target speaker) cuts false barge-in to **10.2%**, against
    33.4% for LiveKit and 78.1% for TEN, at T90 170 ms vs 140 ms (+30 ms).
  - HumDial: third-party speech is the hardest case for everyone.
- **Taxila today.** `cascade-barge-pause-decide` [T] already implements onset duck → pause → the transcript decides →
  resume or stop. It includes an echo test by consonant skeleton and a Hindi backchannel list. That is structurally
  the 2026 state of the art.
- **What is missing:**
  1. **Target-speaker conditioning.** The child's voice is enrolled at onboarding (a 10 s "apna naam bolo" sample).
     The pVAD score is then a feature in the floor decision, so a sibling or the TV cannot take the floor. Risk:
     children's voices change and siblings sound alike. Measure on E1 (§9, X3).
  2. **The playback-anchored context** (§5.8).
  3. **A rejection class** in the transcript verdict, beside turn, silent, backchannel and echo: "not addressed to
     the teacher". That covers "mummy, pani do", a sibling, or the TV. Evidence that it is learnable: HumDial
     rejection, FlexDuo's *Idle* state (−23% false interruptions [P]), and HiThink's non-target playback-resume rate
     of 0.735 [P].

### 5.2 Micro-turns: the LLM reads the stream in fixed slices (text-level duplex)

- **What it is.** DuplexCascade [P] (SB Intuitions, Mar 2026):
  - streaming ASR text is flushed every **Δt** into a "micro-turn";
  - a LoRA-tuned text LLM (Qwen2-7B, 50k UltraChat dialogues converted to duplex sequences, 5k steps) answers each
    micro-turn with either speech text or one control token: `<user is speaking>`, `<user finish speaking>`,
    `<user is interrupting>`, `<user backchannel>`, `<user is thinking>`, or `<system backchannel>`. The last one
    plays a **pre-synthesised backchannel clip**.
- **Evidence.**
  - It has the best averaged turn-taking accuracy among the open systems on FDB v1, and keeps VoiceBench close to a
    plain ASR + Qwen pipeline.
  - **Δt sweep (0.3-1.8 s):** accuracy *rises* up to **Δt = 1.2 s** and falls after that, while latency rises with Δt.
  - The LLM-enhanced dialogue manager [P] (Tencent): a **0.5B** LLM reads speech in short intervals and emits four
    control tokens (continue-listening, start-speaking, and real vs fake interruption). The big engine runs only when
    needed. **> 93.5%** accuracy across cases; errors were mostly ASR errors.
- **Taxila mapping.** This is the **listening-notes loop** (§7.2): a slice every ~0.6-1.2 s while the child speaks.
  - The control decision is made by **code first**: answer-form completeness, safety predicate, lexical floor commands.
  - A small fast model is the fallback for open answers.
  - The Director never runs per slice. Cost discipline: `classifyFast` and `scanSafety` are microseconds [T]; a model
    call per slice is not, so it is gated (§7.2).
- **Risk.** Δt was tuned on adult English and Japanese. Children speak slower with longer pauses, so the optimum may
  be longer [E].

### 5.3 Predictive end-of-turn, and speculation from the candidate

- **What it is.** The endpoint is *forecast*, not just detected. Downstream LLM and TTS work starts on the candidate
  and is discarded if the child continues.
- **Evidence.**
  - **Endpoint Anticipation** (BUT/CMU, Jun 2026) [P]. A speech model forecasts endpoints up to **2.56 s** ahead and
    beats VAP-based baselines. Integrated with Kyutai's Unmute cascade, it gives **−505 ms mean latency for +28.4%
    speculative computation**. The authors define metrics for *realised saving vs redundancy*, which we should adopt.
  - **Turn-aware streaming ASR** (Pine AI, Sept 2026) [P]. A LoRA on Qwen3-ASR-0.6B transcribes *and* detects end of
    turn: **0.97 boundary recall at 0.39 s median latency, 0.3 false fires per speech-minute**, replicated on a fresh
    test set. "No silence timeout reaches this point."
    - **Key method rule:** every streaming label must be computable from input *up to the decision point*. Offline
      labels "encode the future" and manufacture a phantom precision/recall trade-off. Appending one second of silence
      raised a "broken" model's EOT recall from 0.10 to 1.00.
    - This applies directly to the child fine-tune that `wb-predictive-endpoint` plans from E1 timestamps.
  - **FD-VAD** (UMD, Sept 2026) [P]: ASR-free, audio → CONTINUE/STOP with confidence-gated commitment. TurnBench dev
    EOT recall **0.853 at FP ≤ 0.10**, zero-shot.
  - **JAL-Turn** (Recho, Mar 2026) [P]: acoustic plus linguistic cross-attention on a **shared frozen ASR encoder**.
    Runs in parallel with ASR at 12 ms, down from 204 / 27 ms.
  - **"Less can be more"** (Uniphore India, Sept 2026) [P]: in a controlled ablation, **acoustic + prosodic features
    win**. Utterance F1 0.93 with 7.8% false alarms at 400 ms median latency. *Adding text increases premature
    detections.* This matches the repo's citation (arXiv 2609.11066 in `wb-predictive-endpoint`).
  - **Next-Turn** (Huawei, Jun 2026) [P]: train on *time-to-next-speech-onset*, which needs no labels. +25.9 points
    absolute in endpoint accuracy within 320 ms.
  - **Kyutai STT semantic VAD** [V]: pause heads at 0.5, 1, 2 and 3 s; the pause-prediction delay adapts to content
    and intonation. Unmute reports sub-second response.
  - **SpeculativeETD** (Mar 2025) [P]: a tiny on-device GRU for "non-speaking" plus a server wav2vec model for "turn
    end vs pause". This device/server split is the pattern `turnModel.ts` already plans.
  - **A cautionary result, Voice-Light** [P]: a locked test on **1,673 real-conversation silence candidates (HOLD
    n = 37)**:

    | policy | false cut-offs | EOT recall | mean latency |
    |---|---|---|---|
    | Silero, 0.05 threshold, 640 ms minimum delay | 2.70% | **95.60%** | 656 ms |
    | LiveKit v1-mini | 2.70% | 91.50% | 654 ms |
    | **Smart Turn v3.2** (threshold 0.95) | **13.51%** | **20.72%** | 684 ms |
    | Voice-Light's own learned checkpoint | 2.70% | 12.53% | 770 ms |

    No swept learned detector met the authors' gate (≤ 5% false cut-offs, ≥ 70% recall, ≤ 800 ms p95), so the
    deployed system **keeps a hybrid controller**. HOLD n = 37 is tiny, and Smart Turn may have seen overlapping
    training data. But this is the same Smart Turn release `wb-predictive-endpoint` adopted.
  - **TurnBench**: no system matches human anticipation (−151 ms) without too many false positives.
- **Taxila mapping.**
  - **L1:** `turnModel.ts` (behind `turn.predictive`, default off) already does candidate silence at 500 ms + a
    score + hold/merge. The study adds three things:
    1. **A context completeness feature computed in code** (§7.3). It is the feature generic detectors lack. For an
       answer-form item it is near-deterministic; Voice-Light's and Pine's lessons say a *semantic* feature helps
       only if it is causal and calibrated.
    2. **Keep a tuned silence policy as the floor.** Ship the learned scorer only if it beats Silero-at-640 ms on
       *child* HOLD cases (§9, X1). Do not assume Smart Turn transfers.
    3. **Anticipation for speculation, not for speaking.** A candidate fires *speculative* work (classify on the
       candidate transcript, speculative replies, the prelude's TTS warm-up). It never fires speech before the
       endpoint commits. That is how Endpoint Anticipation gets −505 ms without cutting anyone off.
  - **L2:** speculative replies from the candidate, not the final. `cascade-speculative-reply` already hits 10-11/12
    [T]. Moving the start earlier saves the candidate→final gap. With MAI streaming finals at 68 ms that gap is small,
    so most of the saving comes from overlapping the **classify** stage with the endpoint wait [E: ≈ 0.4-0.6 s from
    MODEL-STACK §2.3; measure in X2].
- **Promotion rule** (Voice-Light, adopt verbatim). A speculative candidate is promoted only if the final transcript
  differs by case, punctuation or whitespace at most. **Any lexical change invalidates it.** Every speculative artefact
  carries a generation id, and stale text or PCM is rejected at a barrier. This matches `speculation-one-clock` [T] and
  extends it to the candidate stage.

### 5.4 Think while listening: incremental understanding during the child's turn

- **What it is.** The model reasons over the partial input while the user is still speaking. That covers unspoken
  chain-of-thought, intermediate variables and tool calls, so the reasoning is done by the time the turn ends.
- **Evidence.**
  - **SHANKS** [P] (chunks of 4 s; Qwen2.5-Omni E2E or Whisper-large-v3 + Qwen-2.5-7B cascade; n = 1,280 correct and
    1,140 wrong spoken maths solutions, synthetic TTS).

    | method | interrupts on CORRECT ↓ | valid on correct | interrupts on WRONG ↑ | valid on wrong ↑ | latency after error |
    |---|---|---|---|---|---|
    | no-thinking baseline | 1.4% | 16.7% | 13.8% | 26.8% | 6.46 s |
    | SHANKS-E2E | 30.6% | 25.7% | 84.8% | 63.9% | 5.08 s |
    | **SHANKS-Cascade** (stronger text LLM) | **24.9%** | 40.3% | **86.1%** | **78.3%** | 6.90 s |
    | E2E, t_chunk = 3 s | 41.1% | 21.4% | 88.7% | 60.3% | 1.56 s |

    - Tool calls: **56.9%** of API calls were made while the user was still speaking, and 80-90% of successful calls
      happened during user speech. Accuracy was lower than call-after-listen.
    - The authors: "the interruption ability of SHANKS is mostly related to the reasoning ability of the backbone".
      Also: full-duplex models "cannot interrupt the user at all" for content reasons, and GPT-4o "cannot interrupt
      the user when the user is still talking".
  - **Meta "think while listening"** [P]: a question-completeness entropy picks when to start. +4% ARC-Easy at equal
    latency, and **70% lower latency at equal accuracy** after DPO.
  - **Chronological Thinking** (NTU/StepFun) and **FLAIR / "The Silent Thought"** (NTU/Mila) [P] replace a duplex
    model's idle silence tokens with causal reasoning that adds no latency. Both report consistent quality gains;
    numbers are in the papers' tables.
  - **LiveMind** (2024) [P]: inference on incomplete input cut response latency by **84.0%** on MMLU and **71.6%** on
    MMLU-Pro at comparable accuracy. A large model reasoning plus a small model producing output gave −37% latency and
    +4.3% accuracy.
  - **STITCH** (Microsoft/NTU, ICLR 2026) [P]: think while *talking*, alternating unspoken reasoning chunks with spoken
    chunks during playback. It matches the latency of no-CoT baselines while scoring **+15%** on maths reasoning.
- **Taxila mapping: listening notes, code-first.**
  - What "thinking" means for a tutor is concrete:
    - which item the child is answering;
    - whether a value has been stated, and which;
    - whether a known misconception's signature has appeared ("4 is bigger so 1/4 is bigger");
    - whether a self-correction marker has appeared ("nahi nahi", "no wait");
    - whether the child is asking something ("kya", "matlab", rising intonation);
    - whether distress words have appeared.

    All of these are code over the partial transcript. They run in microseconds per slice.
  - An open "why" or teach-back explanation additionally gets a **fast-model note every ~1.2 s**. That is the slice
    size DuplexCascade found best [P]; it is [E] for children. The note is a short structured JSON with the claims
    made so far and the misconceptions matched (from the kit list, never free text). It is *read by the Director at
    the endpoint* as pre-computed context, which cuts the classify stage.
  - **No interruption from notes**, except the cases in §7.4. SHANKS's 24.9% false interruption rate on correct
    solutions is the reason.
  - **STITCH transfers too.** While the teacher's first sentence plays (about 2-3 s of audio [E]), the server may
    compute the *next* thing: the follow-up probe, the Studio reveal, the second clause. That is already implicit in
    sentence-streamed TTS; the study names it as a budget (§7.5).

### 5.5 Commit-safe fast prefix, slow continuation

- **What it is.** Something short and correct starts immediately. The substantive answer follows in the same voice
  stream, once the slow path is ready.
- **Evidence.**
  - **RelayS2S** (Trinity College Dublin, Mar → Sept 2026) [P].
    - A duplex S2S fast path drafts a ~5-word prefix, streamed to TTS at once. A learned verifier on decoder hidden
      states commits it or falls back. The ASR → LLM slow path (GPT-4.1) continues *conditioned on the committed
      prefix*, in the same TTS session.
    - **P90 first chunk 81 ms vs 1,006 ms**, excluding TTS and network.
    - Real dialogues: **269 vs 748 ms** average, retaining **99%** of cascade textual quality.
    - 82.5-95% of five-word S2S prefixes are judged good. The verifier reaches 95% good-prefix throughput at an 8%
      fallback rate.
  - **Context-aware preface robot** (Osaka/Kyoto, ICMI 2026; a real shopping mall) [P].
    - An intent-readiness detector triggers gpt-4o-mini to write a short preface, **under 10 characters and
      non-committal**. VAP decides when to deliver it. gpt-4o writes the main answer.

      | condition | initial latency mean (median) | initial-to-main gap mean (median) |
      |---|---|---|
      | no filler (n = 205 responses) | 2.45 s (2.19) | — |
      | fixed filler (n = 188) | **0.94 s (0.70)** | 0.74 s (0.57) |
      | contextual preface (n = 251) | 1.15 s (0.92) | **0.43 s (0.16)** (significantly shorter than fixed filler, U = 35139, p < .001) |

    - No significant difference in ratings (an exploratory questionnaire).
  - **MoshiRAG** [P]: the **"keyword delay"** is the natural gap between response onset and the key information.
    Retrieval budgeted at ≤ 2 s finishes behind it, reaching factuality "comparable to the best publicly released
    non-duplex speech LMs".
  - **X-Talk** [P]: a "statement mechanism" generates buffered response content *ahead of* a tool call to mask its
    latency.
- **Taxila mapping: the L3 grounded uptake prelude** (TEACHER-BRAIN §5.4) is this exact pattern, with one advantage.
  Our prefix is **built in code from the child's own key token**, delivered verdict-neutral, so it needs no verifier:
  it is correct by construction. That matters because a learned verifier always has an error budget (RelayS2S: 95%
  good-prefix throughput at an 8% fallback rate), and a bad prefix to a child ("Shabash!" before a wrong answer)
  leaks the verdict.
- **Rules to adopt:**
  1. **Under 10 characters / one breath, non-committal.** The preface robot used this as its safety rule. Ours is:
     the child's token plus a neutral particle ("सात… हम्म"), never praise, never a verdict.
  2. **Same TTS session for prefix and continuation**, so there is no seam (RelayS2S; HUMAN-VOICE aligner).
  3. **Budget the keyword delay.** The reply's first clause (uptake) carries no verdict-critical content, which buys
     ~1-2 s for the classify/guard path [E]. TEACHER-BRAIN's "uptake → promise → instruction" shape already does this.
     The study makes it an explicit **timing contract**: the guard must finish before the first verdict-bearing word
     is due to play, not before the first audio.
  4. **Fixed fillers are faster but wear out** (`rj-static-filler-list` [T]; the preface robot: fixed fillers are
     0.21 s faster to start on the mean but leave a 0.74 s vs 0.43 s mean gap before the main answer).

### 5.6 Backchannels: when the listener talks without taking the floor

- **What it is.** Short acknowledgements ("haan", "hmm", a nod) during the speaker's turn.
- **Evidence.**
  - Human Hindi rate is **0.079/s** (IndicFDB); across 10 languages, 0.070-0.098/s [P].
  - Commercial systems either never do it (Gemini 0.003-0.010/s) or take the floor (GPT Live 15% success).
  - **"Controlling Backchannels"** (KIT/Sesame/Edinburgh, Sept 2026) [P]: a small head on a duplex model's hidden
    states predicts backchannel onset. Above a tunable threshold a backchannel is force-decoded. It generalises across
    7B (PersonaPlex) and 1B models, and human raters judged the backchannels on par with real ones.
  - **VAP backchannel fine-tune** ("Yeah, Un, Oh", 2024) [P]: continuous frame-wise prediction of backchannel timing
    *and type*.
  - **DuplexCascade-β** [P]: the LLM emits `<system backchannel>` and a **pre-synthesised clip** plays. It came second
    on backchannel metrics among the open systems while keeping overall accuracy competitive.
  - **Park et al. (HRI 2017)**: prosody-timed robot backchannels made 4-6-year-olds tell stories with more energy
    (world-best §S4).
- **Taxila today.** The visual backchannel driven by mic level (human-likeness Lever 13 [T]); audio backchannels
  rejected on half-duplex (`human-likeness` Tier 3 #17).
- **What changes with an always-on ear.** The original objection was a mic hold splitting the turn and echo uplinking
  (+171 ms) [T]. That weakens once the ear is always on and the echo test exists, but the echo/AEC test on real phones
  is still pending.
- **Proposal.**
  1. Keep **visual first**: a nod or gaze at backchannel-opportunity points. The timing rule comes from prosody (Park
     BOP) plus the human rate of ~1 per 10-14 s.
  2. Add **audio backchannels only on long child turns** (teach-back, story, explanation over 6 s). Use **one
     pre-recorded clip per teacher voice from a small rotating set**, and play it only when the device-side echo
     canceller is confirmed on that device class. Gate it behind `duplex.audioBackchannel` and the X4 echosim/device
     test.
  3. **Never backchannel on an answer turn.** "Hmm" after "7" reads as a verdict [E; the same law as the prelude's
     verdict-neutrality].

### 5.7 Interruptions: stop, keep the floor, or adapt?

- **Evidence.**
  - **HiThink Turn** (Sept 2026) [P] separates *response intent* from *semantic completeness* and conditions on
    playback state, streaming 240 ms chunks. Supervision is the **minimal intent-sufficient prefix**: the earliest
    point where the intent is clear.
    - FDB average interaction score 0.933; non-target-speech playback resume 0.735.
    - **Intent-prefix triggering raises interruption success from 89% to 98% and cuts mean stop latency by 60.9%.**
  - **FlexDuo** [P]: an explicit **Idle** state filters irrelevant audio. **−23% false interruptions, +8% response
    accuracy** on Fisher, beating VAD-gated baselines in Chinese and English.
  - **SoulX-Duplug** (SJTU/Soul, Mar 2026) [P]: a plug-in state predictor running streaming ASR jointly as a
    "semantic VAD", open-sourced with a bilingual eval.
  - **Easy Turn** (NWPU/Huawei, Sept 2025) [P]: four states, **complete / incomplete / backchannel / wait**, plus a
    1,145 h training set. It beats TEN Turn Detection and Smart Turn v2 on its own test set. The **"wait"** state is
    the user saying "hold on".
  - **Duplex Cue**: humans adapt within the turn 68% of the time (§4.6).
- **Taxila mapping: a five-way verdict on overlapping speech**, extending today's four:
  - **TURN**: stop.
  - **BACKCHANNEL**: resume.
  - **ECHO**: resume.
  - **NOT-ADDRESSED**: resume, possibly with a soft "haan?" if it repeats.
  - **INTERJECTION-TO-FOLD**: the child supplied the answer or a word while the teacher was asking. The teacher
    acknowledges and adapts in-turn rather than stopping. This needs the reply to be re-planned from the playback
    point, which is a **Director call with `heardUpTo`** (§5.8).

  Plus a **WAIT** fast path for "ruko / ek minute / sochne do / wait": the teacher stops, shows a thinking-together
  pose, and the endpoint threshold rises for the next ~10 s [E].

  The intent-sufficient-prefix idea gives a cheap win: lexical floor commands are decidable from the **first one or
  two words**, so the stop can commit before the final transcript arrives.

### 5.8 Playback-anchored context: the teacher knows what was actually heard

- **What it is.** Text generation, TTS and playback run at different speeds. After an interruption, the dialogue
  history must contain only what the child *heard*.
- **Evidence.**
  - **PACE** [P] calls the failure "Generative Context Mis-anchoring". It anchors model context to the client playback
    boundary. **Referent anchoring 25.0% → 96.3%** over cancellation-only, on GCM-Bench (108 cases). Interruption
    quality is preserved on 200 FDB samples.
  - **Self-Listening** (CUHK-SZ, Sept 2026) [P] feeds the played speech back as an input stream. Anchoring accuracy
    **7.8% → 73.0%**, beating GPT-Realtime-2.1 by 29.2 points at the same stop and response latency. The authors
    name **"interactive tutoring"** as a target setting: users ask to repeat or continue from where the system
    stopped.
  - **Voice-Light** [P]: "Durable assistant history is constructed only from audio ranges that the browser confirms
    it rendered." The browser acknowledges playback ranges every 80 ms.
- **Taxila today.** The client sends `teacher_interrupted` (a boolean) and `req.teacherInterrupted`, so the server
  knows *that* she was cut but not *where*. If the child interrupts a three-clause reply after clause one ("kya?"),
  the next turn's history still contains clauses two and three as if they were said. A repeat, or the next probe, can
  then refer to something the child never heard.
- **Proposal.** The cascade player already has the TTS stream and a playback clock. It reports
  `heardUpTo = {responseId, chars, words, ms}`: the last *fully played* word boundary. TTS word timings come from
  DragonHD/Azure word-boundary events, else are estimated from the sentence and character position.
  - The server trims the stored teacher turn to that prefix and marks the rest `unheard`.
  - The Director's next `compile()` sees only the heard part, plus a note "(interrupted after: …)".
  - This is small, high-value and safety-relevant: an *unheard* safety line (a helpline) must be **re-said**, not
    assumed delivered.

### 5.9 Dual-system delegation: build while talking

- **What it is.** A real-time front end keeps the conversation going. Heavy work (reasoning, tools, content
  generation) runs asynchronously, and the result is merged into the conversation when ready.
- **Evidence.**
  - **SALMONN-duo** [P]: system 1 is an always-on duplex speech LLM; system 2 is an asynchronous slow LLM agent.
    System 1 learns *when to delegate*. **Knowledge-boundary-aware training avoids unnecessary delegation**, and
    cost-aware RL improves task success and safety on τ-Voice "with an acceptable increase in the delegation rate".
  - **Realtime-Venus** (Ant, Sept 2026) [P]: a dual-loop runtime. A harness runs tasks in the background while
    foreground interaction continues on a shared causal timeline.
  - **NVIDIA frontend-backend** [P]: a delegation token plus prefill-and-repeat.
  - **Context Spanning** [P]: backend text is injected into the duplex model by chunked prefill inside the frame
    budget.
  - **MoshiRAG** [P]: the retrieval trigger token ⟨ret⟩; the answer is merged behind the keyword delay.
- **Taxila mapping.** LIVE-STUDIO already races builds (26.7 / 48.7 s to playable [T]) and mounts library modules in
  ≤ 1 s. The kernel arbitrates reveals. What the duplex study adds is the **trigger time**: a Studio intent can be
  proposed *from a listening note* (the child's partial explanation reveals misconception m1) instead of after the
  turn. That gains the child's speaking time, typically 3-10 s on an explanation [E], for a library mount or a skeleton.
  The kernel still decides *reveal* timing at a beat boundary (attention budget: one new thing). Delegate on knowledge
  boundaries (SALMONN-duo): code knows when a module exists in the library, so no model decides that.

### 5.10 Safety under duplex timing

- **Evidence.** DuplexJail, LateIntent, spurious onsets, and "take the floor when asked" (§3.15, §4.6).
- **Rules for Taxila** (they extend, never relax, the floor):
  1. **`scanSafety` on every partial and every slice**, not only on finals. A distress hit is the one case where the
     teacher acts **mid-utterance**: she stops talking at once, the face turns to attention, and the turn goes to the
     safeguard path when the child's turn ends. If the child goes quiet, it goes after the 1.5 s LateIntent pause.
     Never stay silent on a distress partial waiting for "completeness".
  2. **No early verdict commit** on any turn whose partial contains a distress candidate, a self-correction marker,
     or a negation after a value. M-B1 shows why.
  3. **A mid-reply child utterance is a new turn** through the full guard path, never appended to an ongoing
     generation (DuplexJail).
  4. **No self-initiated teacher speech from silence** except from code timers (idle nudge, beat timer). This is the
     answer to spurious onsets.
  5. **Unheard safety lines are re-said** (§5.8).
  6. Speculative replies are guarded exactly like real ones before promotion (they already share `compile()` and the
     guards [T]).

---

## 6. Measurement M-B1 (this study): can a numeric answer be graded before the child finishes?

**Harness.** `evals/duplex/prefix-commit.mjs`, deterministic and offline. Output:
`evals/duplex/results/prefix-commit-2026-10-04.json`.

**Corpus.**
- The 13 gradable child-answer stimuli in `docs/research/voice/v2/stt/stimuli.mjs` (synthetic child TTS, Hinglish,
  Hindi, Indian English and hesitant categories), as reference text.
- Every final transcript of those clips from the production STT arm (D4, live-tx kw+prompt) and from
  MAI-Transcribe-2-Streaming (S0) in the 2026-10-04 refresh rows: 78 each, which is 6 transcripts per stimulus across
  the clean, child and TV arms.

**Method.**
- Each transcript is replayed word by word through the repo's own `extractValues()`.
- The truth is the value the grader's `answerOK` rule would use on the whole utterance.
- **P1** commits to the first value heard. **P1b** commits to the first value *confirmed* by a following word that is
  neither a number nor a fraction separator, which is about a one-word wait.
- The **oracle** is the earliest word after which the latest value never changes again.

**Results** [M-here]:

| transcripts | n | P1 wrong | P1b wrong [80% Wilson] | P1b words saved, median | oracle words saved, median / mean |
|---|---|---|---|---|---|
| reference text | 13 | 9 (69%) | **5 (38%) [0.23, 0.56]** | 4 | **0 / 0.85** |
| D4, production STT | 78 | 54 (69%) | **35 (45%) [0.38, 0.52]** | 4 | 0 / 0.85 |
| S0, MAI streaming | 78 | 45 (58%) | **30 (38%) [0.32, 0.46]** | 5 | 0 / 0.85 |

By category (reference + D4, n = 91):

| category | P1b wrong |
|---|---|
| Hinglish | 0/28 |
| Hindi | 14/28 |
| English | 9/14 |
| hesitant / self-correcting | 17/21 |

The oracle saving is 2 words in Hinglish and Hindi (the verb tail "होते हैं") and 0 in English and hesitant answers.

**Where the early verdicts go wrong** (reference):
- h05 "सौ में से अड़तालीस घटाओ तो बावन": commits 100, truth 52;
- h08 "नौ और छह मिलाकर पंद्रह": commits 9, truth 15;
- e04 "seven eights are fifty six": commits 7, truth 56;
- d03 "twenty one no wait twenty four": commits 21, truth 24;
- d01 "तीन बटा आठ नहीं नहीं तीन बटा चार": commits 3/8, truth 3/4.

**Reading.**
1. Children (and adults) state operands, working and self-corrections *before* the answer. The answer value is the
   **last** content in the utterance. **Mid-utterance grading is wrong 38-45% of the time, and a perfect oracle saves
   almost nothing** (median 0 words).
2. The only "tail" worth anticipating is the Hindi verb-final closer after the value ("…पंद्रह होते हैं"), about two
   words. A **value-then-closer pattern** is a strong, code-computable endpoint feature (§7.3) [E: the timing gain is
   about the duration of 2 words, ≈ 0.4-0.7 s; measure in X1].
3. This supports the "a model never grades" law from a new angle: **timing**. The duplex capability must not leak
   into grading.

**Limits.**
- These are text word-prefixes, not audio partials. Real partials revise words, so real early-commit error is *higher*.
- The speech is synthetic child TTS.
- The 78 transcripts are 6 per stimulus, so the effective n is 13 stimuli.
- Only numeric/fraction answers are covered; choice and why answers are untested.
- Re-run on E1 real child recordings with streaming partials (§9, X1).

---

## 7. What this means for Taxila: the "listening teacher" cascade

### 7.1 Four loops on four clocks

```
 child mic ──► [EAR]  device VAD 32 ms · pVAD score · echo-skeleton · level → face (nods/gaze)        (client, always)
                  │
                  ├─► STT stream (MAI-Tx-2-Streaming / live-transcribe): partials + finals             (always on, whole session)
                  ▼
           [FLOOR]  code state machine, 80-240 ms tick                                                 (src/duplex/floor-fsm.ts)
           LISTENING ─► HOLDING (child mid-thought) ─► CANDIDATE_END ─► COMMITTED_END ─► TEACHER_SPEAKING
                ▲             │  (wait / 'ruko' raises threshold)            │                │
                │             └──────────── onset inside hold window ◄───────┘                ▼
                └──── YIELDED ◄── TURN ◄── DUCKED (overlap: turn | backchannel | echo | not-addressed | fold-in)
                  │
                  ▼
           [NOTES]  per stable slice (~0.6-1.2 s) while the child speaks                               (server/duplex/notes.js)
           code: answer-form completeness · value/closer · self-correction · question · scanSafety · misconception sig
           model (gated, open answers only): fast structured note → cached for the Director
                  │
                  ├─► at CANDIDATE_END: speculative classify + speculative replies + prelude TTS warm-up (private)
                  ├─► Studio intent from a note (library mount / skeleton) → kernel decides reveal at the beat
                  ▼
           [BRAIN]  at COMMITTED_END: Director /turn (W2 code, unchanged) consumes notes + promotes a matching speculation
                  │
                  ▼
           [VOICE]  commit-safe prelude (child's token, verdict-neutral) → reply in the same TTS session
                    playback clock → heardUpTo → server history trims to heard
```

Who decides what (the code/model split, per the owner's rule):

| decision | maker | why |
|---|---|---|
| floor state, stop/duck/resume | code (sensors: VAD, pVAD, STT partial, prosody score, completeness) | must be fast, auditable, safe; HumDial winners are rule/controller cascades |
| end-of-turn threshold | code, from beat / answer form / child pace | the context generic models lack (IndicFDB trade-off) |
| verdict (correct/incorrect) | code against verified keys, else classify **after** the endpoint | M-B1: 38-45% wrong mid-utterance |
| mid-utterance teacher action | code, only the §7.4 cases | SHANKS 24.9% false interruption |
| what to say | model (reply), guarded | unchanged W2 path |
| open-answer listening note | small fast model, structured, gated | DuplexCascade / LLM-DM: small models suffice for control signals |
| what to build | Studio policy (code) + builder models | unchanged LIVE-STUDIO path |

### 7.2 The listening-notes loop (think while listening, code-first)

- **Slice.** Emit a slice when the STT partial has been stable for ≥ 1 word *and* ≥ 600 ms since the last slice, or at
  any finalised fragment. The slice size is tuned on child data; DuplexCascade's adult optimum is 1.2 s [P].
- **Per slice, code only** (≈ µs):
  - `classifyFast` on the partial, as a *hint, never a commit*;
  - `scanSafety(partial)`;
  - value / closer / negation / self-correction markers;
  - a question/clarify cue ("kya", "matlab", "samajh nahi aaya");
  - lexical floor commands;
  - misconception signature matches from the kit (`targetFor(...).matches`);
  - addressed-to-teacher heuristics (names, "mummy", "bhaiya").
- **Per slice, a model** only when the beat is a why-probe or teach-back, the partial has grown by ≥ 5 words since the
  last note, and the lesson's note budget (cost cap) is not spent. One structured call to the fast deployment returns
  claims so far, kit misconception ids matched, and whether it looks complete. The output is cached with a slice id;
  the Director reads the latest note at the endpoint. **Notes never produce speech.**
- **Cost.** A teach-back of 10 s with 1.2 s slices and a ≥ 5-word gate is about 3-4 note calls [E]. At the measured
  ~$0.0002 per fast classify call [T], that is under $0.001 per teach-back.

### 7.3 The context-aware endpoint (the feature generic detectors lack)

`P(done)` combines four inputs:
- the prosodic/acoustic score (Smart Turn, or our fine-tune, *if* it beats the tuned-silence floor on child HOLDs);
- the silence duration;
- the **answer-form completeness** computed in code from the partial;
- the child's own pace prior (median pause within turns over the last N turns).

Answer-form completeness rules [E: thresholds from E1]:

| answer form (from `ui.answerForm` / item) | complete when | hold when |
|---|---|---|
| number | a value is present **and** (a closer word follows, or silence ≥ candidate) **and** no trailing operator / negation / self-correction marker in the last 2 words | a value is followed by "aur / plus / into / nahi / no / wait / matlab", or the partial ends on an operand pattern ("…में से", "…मिलाकर") |
| fraction | "a बटा b" complete | ends on "बटा / by / upon", or only a numerator |
| choice | an option text or label matched | "ya / or" pending |
| why / explain / teach-back | the model note says complete **and** silence ≥ a longer candidate (≈ 800-1200 ms) | always lean to hold; a pause is thinking (Rowe) |
| yes/no | a token matched | — |
| free chat | prosody + silence only | — |

- **Thresholds.** Low for number, choice and yes/no; high for why and teach-back. This is the schedule
  TEACHER-BRAIN §5.4 L1 already names. The study adds the code completeness feature and the M-B1 hold patterns.
- **Commit vs speculate.**
  - **Speculative work fires at CANDIDATE_END** (silence ≥ 300-500 ms, or completeness true): classify, replies,
    and the prelude warm-up.
  - **Speech fires only at COMMITTED_END.**
  - A new onset inside the hold window invalidates the speculation and merges the fragment (`turnModel.ts` already
    merges). This is Endpoint Anticipation's split: −505 ms for +28% compute [P].

### 7.4 When the teacher acts during the child's turn (the whole list)

| trigger (code-detected) | teacher action mid-utterance | evidence / law |
|---|---|---|
| distress predicate hit on a partial | stops any speech now; face to attention; safeguard path at turn end (or after 1.5 s of silence) | safety floor first; LateIntent |
| "ruko / wait / ek minute / sochne do" | WAIT: stops, visual "thinking together", raises the threshold ~10 s | Easy Turn "wait"; HiThink lexical fast path |
| "kya? / phir se / samajh nahi aaya" while the teacher speaks | yields, then repeats from `heardUpTo` | Self-Listening / PACE |
| the child calls out the answer during the teacher's question | fold-in: acknowledges in-turn and continues (re-planned from `heardUpTo`) | Duplex Cue (humans adapt 68%) |
| off-task monologue > ~20 s with no item content (code: no key terms, no values) | gentle hold-on at the next pause, never mid-word | [E]; TACT intent-conditioned timing |
| backchannel opportunity on a long explanation | visual nod (audio clip only if gated on) | IndicFDB human rate; Park 2017 |
| **an error detected mid-explanation** | **nothing until the endpoint** (then the Director re-teaches) | SHANKS 24.9-41% false interruption on correct |

### 7.5 Timing budget (India app; estimates until X2 measures them)

Rows marked [T] were measured earlier; everything else is [E].

| stage | today [T] | listening teacher | how |
|---|---|---|---|
| receipt (face) | ≤ 150 ms target | ≤ 150 ms | L0, unchanged |
| endpoint | 1069 ms (900 ms silence) | **450-600 ms on complete answers; longer, by design, on explanations** | §7.3 |
| STT final | 68 ms (MAI, CHN) | 68 ms | — |
| classify | inside the Director 1562 ms | **overlapped with the endpoint wait** on a candidate | §5.3 |
| reply first token | inside the Director | speculative from the candidate, hit or miss | §5.3 |
| first audible sound | ≈ 3.04 s | **prelude ≈ endpoint + ~250-400 ms → ≈ 0.8-1.0 s** | §5.5 |
| first reply audio | ≈ 2.93 s p50 | ≈ 1.6-2.0 s on hits [E] | — |

The TEACHER-BRAIN targets (first sound ≤ 1.6 s, first reply audio ≤ 2.5 s p50) look reachable *only* with candidate
speculation plus the prelude [E]. The floor (≤ 3.2 s p50) stays a hard gate.

---

## 8. Integration plan (Wave 2 is being built elsewhere: no edits to `server/routes/lesson.js`, `server/brain/**`, `src/child/lesson/**`)

The new code lives under `server/duplex/**`, `src/duplex/**` and `evals/duplex/**`. These are the seams, and each one
is an *additive* hook the W2 owners can accept or refuse.

| # | new module (proposed) | seam into W2 code | contract |
|---|---|---|---|
| I1 | `src/duplex/floor-fsm.ts`: the floor state machine (pure, unit-testable) | `src/lesson/cascadeLink.ts` calls `floor.onEvent(e)` beside the existing verdict code (shadow mode first: log the FSM decision next to today's decision) | `FloorEvent = vad_onset / vad_offset / partial / final / playback / lexical`; `FloorDecision = duck / pause / resume / stop / hold / commit / wait`; every decision carries a reason code |
| I2 | `src/duplex/completeness.ts`: answer-form completeness + hold patterns (§7.3) | `src/lesson/turnModel.ts` scorer: add it as a feature next to Smart Turn or the heuristic (it already takes `ui.answerForm` and `beat`) | `complete(partial, form, lang) → {p, reason}`; deterministic; tests from the M-B1 stimuli |
| I3 | `src/duplex/heard.ts`: playback clock → `heardUpTo` | `src/lesson/ttsStream.ts` already resolves first and last sample; add word-boundary ticks. `runtime.ts` attaches `heardUpTo` to the next `/turn` request | `{responseId, chars, ms}`; the server trims history (W2 owner adds a 5-line trim in the turn store) |
| I4 | `server/duplex/notes.js`: listening notes (code + gated model) | a new route `POST /api/duplex/slice` (its own router table, not in `lesson.js`); `lessonTurn` reads `notes.latest(lessonId, turnSeq)` **if present** (one optional read the W2-E owner adds) | `Note = {sliceId, partial, value?, markers[], misconceptions[], complete?, model?: {claims[], ids[]}}`; never speech |
| I5 | `server/duplex/speculate.js`: candidate-stage speculation | `POST /api/duplex/candidate {transcript, turnCtx}` runs the **same** `planTurn`/`compile()` speculation `cascade-speculative-reply` uses, keyed by generation id. `/turn` promotes only on lexical identity (§5.3 rule) | `{genId, transcriptHash, replies[], classify?}` with TTL = the turn |
| I6 | `server/duplex/safety-partial.js`: `scanSafety` on partials → an `attend` event | client gets `{type: "attend"}` → the teacher stops, the face turns to attention; the turn routes to safeguard at the end | the predicate is unchanged; only *when* it runs changes |
| I7 | `src/duplex/backchannel.ts`: BOP timing → avatar nod (audio clip behind a flag) | the avatar controller (W1-F) receives `nod` events | rate cap ≈ 1 per 10 s; never on answer turns |
| I8 | `evals/duplex/*`: the X1-X6 harnesses (§9) | — | each writes `results/*.json` with n, method and date |

**Flags** (all default OFF): `duplex.floorFsm` (shadow → on), `duplex.completeness`, `duplex.heardUpTo`,
`duplex.notes`, `duplex.candidateSpec`, `duplex.partialSafety` (**recommended ON first**: pure safety gain, no timing
risk), `duplex.audioBackchannel`.

**Rollout order** (risk-ascending):
1. I6 partial safety;
2. I3 heardUpTo;
3. I1 FSM in shadow;
4. I2 completeness inside `turn.predictive`;
5. I5 candidate speculation;
6. I4 notes;
7. I7 backchannel.

---

## 9. Experiments (what must be measured before any of this ships)

| id | question | method | n / data | pass bar |
|---|---|---|---|---|
| **X1** | Do the endpoint features transfer to children? | Replay E1 child recordings with streaming partials. Score arms: 900 ms silence; Silero-tuned 640 ms; Smart Turn v3.2; + completeness; + pace prior. HOLD = the child resumed within 2 s | ≥ 300 silence candidates, ≥ 60 HOLD, per band | false cut-offs ≤ the 900 ms arm; EOT p50 ≤ 600 ms on complete answers; adopt a learned scorer only if it beats Silero-640 on child HOLDs (the Voice-Light lesson) |
| **X2** | What does candidate speculation buy? | Probe fleet from Central India; candidate-spec on vs off; Endpoint Anticipation's realised-saving vs redundancy metrics | 30 turns per band | first reply audio −≥ 300 ms p50; extra reply calls ≤ +40%; 0 promoted-stale replies |
| **X3** | Does pVAD stop siblings and TV taking the floor? | Enrol the child; inject sibling, adult and TV speech at 20 / 10 dB (FireRedChat protocol) | ≥ 200 overlap events | false barge-in ≤ 10%, T90 ≤ +50 ms vs no pVAD |
| **X4** | Is an audio backchannel echo-safe on Indian Android? | echosim + device run, phone speaker, AEC on | 3 device classes × 50 | 0 backchannels mis-heard as child turns; no echo-triggered pauses above the bargeStats baseline |
| **X5** | Does `heardUpTo` fix repeat requests? | A GCM-style tutor set: interrupt after clause k, then "phir se bolo" or a reference question | ≥ 60 cases | referent anchoring ≥ 90% (PACE reached 96.3%) |
| **X6** | M-B1 on real speech | Re-run `prefix-commit.mjs` on E1 transcripts *with streaming partials*, including choice and why answers | ≥ 100 gradable answers | confirms or refutes "no early grading" (expected: error ≥ M-B1) |
| X7 | Child backchannel rate and FTO norms | Mine E1 two-channel recordings with the IndicFDB VAD heuristics | E1 | gives our human reference rows (gap, pause, backchannel/s) per band |

---

## 10. Do-not-do list (proposed `context/rejected.md` entries, by evidence rather than trial)

1. **A native duplex model as the teacher.** On IndicFDB Hindi, Human-1's content rating is 0.564/5 and GPT Live takes
   over in 38% of pauses. FDB-v2 shows correction and entity tracking at 2.6-2.9 for open duplex models. DuplexJail
   gives +34-39 points of attack success. GPT-Live-1 is out on cost (owner). *Revisit if* a duplex model on Azure
   passes our safety evals in Hindi with a content rating ≥ 4.5 and pause success ≥ 95% on IndicFDB.
2. **Mid-utterance grading or correction by a model.** M-B1: 38-45% wrong early verdicts. SHANKS: 24.9-41% false
   interruptions of correct solutions. "Take the floor": models challenge false claims only 14-15% of the time even
   when allowed. *Revisit if* a code-keyed early verdict reaches ≤ 2% error on E1 partials (X6).
3. **Assuming Smart Turn v3.2 beats tuned silence.** Voice-Light measured 13.5% false cut-offs and 20.7% recall vs
   2.7% and 95.6% for Silero-640 (small HOLD n). Keep it a *feature* until X1.
4. **Speaking on the anticipated endpoint.** Anticipation is for speculation only. TurnBench: no system matches human
   anticipation without excess false positives.
5. **A speculative artefact surviving a lexical change of the final transcript.** Voice-Light rule; stale text or PCM
   is rejected by generation id.
6. **History that includes unheard teacher text.** PACE and Self-Listening.
7. **Audio backchannels on answer turns.** They read as verdicts [E].

---

## 11. Proposed context entries

These are in `context/inbox/duplex-study-b.json`; the main loop merges them.

- `m-b1-prefix-commit-2026-10-04` (measurement): the §6 table, with method and n.
- `rj-native-duplex-teacher-2026-10-04` (rejection, by evidence): §10 item 1.
- `rj-mid-utterance-model-grading-2026-10-04` (rejection, by evidence): §10 item 2.
- `duplex-cascade-listening-teacher-2026-10-04` (proposed decision): the §7 architecture, with **reverse if** X1 shows
  context completeness adds no AUC over silence on child HOLDs, or X2 saves < 150 ms p50.
- `duplex-partial-safety-first-2026-10-04` (proposed decision): `scanSafety` on every partial, as the first rollout.
  **Reverse if** the false-attend rate on E1 exceeds 1 per lesson-hour.
- `duplex-heard-upto-2026-10-04` (proposed decision): playback-anchored history. **Reverse if** X5 shows no anchoring
  gain.
- `smart-turn-unproven-vs-silence-2026-10-04` (measurement, external): the Voice-Light table, as a caution on
  `wb-predictive-endpoint`.

---

## 12. Sources (all accessed 2026-10-04; arXiv IDs read in full text unless marked)

**Native duplex models.**
- dGSLM 2203.16502
- Moshi 2410.00037
- SyncLLM 2409.15594
- LSLM 2408.02622
- Freeze-Omni 2411.00774
- Mini-Omni2 2410.11190
- VITA 2408.05211; VITA-1.5 2501.01957
- OmniFlatten 2410.17799
- MinMo 2501.06282
- NTPP 2506.00975
- SALMONN-omni 2411.18138 and 2505.17060
- SALM-Duplex (NVIDIA) 2505.15670
- PersonaPlex 2602.06053
- NemotronLabs VoiceChat 2609.21967
- RoboEgo 2506.01934
- FLM-Audio 2509.02521
- Human-1 (Hindi) 2604.23295
- BayLing-Duplex 2606.14528
- MiniCPM-o 4.5 2604.27393
- Spurious onsets 2609.13445

**Split, delegation and context designs.**
- SALMONN-duo 2609.34247
- Realtime-Venus 2609.13814
- NVIDIA frontend-backend 2609.19334
- Context Spanning 2609.33443
- MoshiRAG 2604.12928
- RelayS2S 2603.23346
- PACE 2608.07631
- Self-Listening 2609.05592

**Cascaded-duplex control and turn-taking.**
- DuplexCascade 2603.09180
- Voice-Light 2609.20995
- FireRedChat 2509.06502
- X-Talk 2512.18706
- Unit-based agent (HumDial #2) 2601.20230
- LLM-enhanced dialogue management 2502.14145
- FlexDuo 2502.13472
- SoulX-Duplug 2603.14877
- Easy Turn 2509.23938
- Phoenix-VAD 2509.20410
- FD-VAD 2609.35791
- JAL-Turn 2603.26515
- HiThink Turn 2609.34096
- "Less can be more" EoT 2609.11066
- Semantic-uncertainty TRP 2609.10934
- Endpoint Anticipation 2606.13450
- SpeculativeETD 2503.23439
- Turn-aware streaming ASR 2609.04225
- Next-Turn 2606.18094
- DualTurn 2603.08216
- VAP backchannel 2410.15929
- Controlling backchannels 2609.29418
- Context-aware preface robot 2607.23204
- Kyutai DSM / Unmute 2509.08753
- Kyutai STT semantic VAD [V]: https://kyutai.org/stt/ and https://github.com/kyutai-labs/delayed-streams-modeling

**Thinking timing.**
- LiveMind 2406.14319
- PredGen 2506.15556
- STITCH 2507.15375
- SHANKS 2510.06917
- Meta think-while-listening 2510.07497
- Chronological Thinking 2510.05150
- FLAIR / Silent Thought 2603.17837

**Benchmarks.**
- Full-Duplex-Bench 2503.04721; v1.5 2507.23159; v2 2510.07838; v3 2604.04847
- IndicFDB 2609.31967
- Talking Turns 2503.01174
- HumDial 2604.21406
- TurnBench 2608.25218
- TACT 2609.27372
- LateIntent 2610.00272
- DuplexJail 2609.09420
- Take-the-floor 2609.19596
- Duplex Cue 2609.13117
- MTR-DuplexBench 2511.10262
- FLEXI 2509.22243
- τ-Voice 2603.13686
- Game-Time 2509.26388
- VideoFDB 2605.30256
- Surveys 2509.14515 and 2606.19453 (abstract-level)

**Griffin** [V]: https://www.tavus.io/griffin. It reports 0.43 s audio-to-video latency on H100s; a 48% "real person"
judgement from 54 participants; VideoFDB generation 3.83 vs human 3.92 and perception 3.73 vs 4.20. Product detail
is in Study A.

**Repo cross-references.**
- `context/decisions.md`: `cascade-speculative-reply`, `cascade-barge-pause-decide`, `speculation-one-clock`,
  `wb-predictive-endpoint`, `plan-turn-timing-in-w2`, `owner-drop-gpt-live-1-2026-10-04`,
  `stt-mai2-stream-primary-india-2026-10-04`.
- `docs/ops/MODEL-STACK.md` §2.3.
- `docs/design/superhuman/TEACHER-BRAIN.md` §5.4.
- `src/lesson/{cascadeLink,turnModel}.ts`.
- `server/director/classify.js` (`classifyFast`).
