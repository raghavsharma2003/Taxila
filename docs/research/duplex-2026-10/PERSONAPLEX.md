# PersonaPlex-7B teardown: what it is, what Taxila can take from it, and how to host it later (2026-10-11)

Scope: NVIDIA PersonaPlex-7B (`nvidia/personaplex-7b-v1`, arXiv 2602.06053), its base Kyutai Moshi (arXiv 2410.00037),
and the Hindi descendants of Moshi. Written for the duplex engine (`src/duplex/`), whose weak spots are: continuers kept
82% (bar 90%), decision gap p50 about 1 s (bar 350 ms), false yields to other voices 14%, and self-yields on its own echo
13% on AMI.

**Tags.** [S] = read at the linked source on the date given. [M] = measured here today (Azure Retail Prices API, code
read). [E] = ESTIMATE with the arithmetic shown. [U] = could not verify. Every source was accessed on 2026-10-11 unless
another date is given.

Related memory, not repeated here:
- `docs/research/duplex/MODELS-PAPERS.md` §3.2, §3.14, §4.2: Moshi, Human-1, IndicFDB.
- `context/rejected.md` `rj-native-duplex-teacher-2026-10-04`: a native duplex model as the teacher is rejected.
- `docs/research/duplex/TAXILAFDB.md` and `ENGINE-MODEL.md`: our benchmark, and stage A/B of the engine.

---

## 0. Verdict

1. **PersonaPlex is English-only.** Its tokenizer has no Devanagari. It is not a Taxila teacher today, and cannot be one
   without a Hindi rebuild of the depth of Human-1.
2. **The weights are under the NVIDIA Open Model License (2025-10-24 version).** It allows commercial use, and nothing in
   it bars use with children. It carries a guardrail-circumvention termination clause, and you are responsible for the
   outputs. The code is MIT.
3. **Hosting it** needs about 17 GB for bf16 weights plus about 1.6 GB of KV cache per session [E]. The working single-GPU
   SKUs in Central India are NC24ads A100 v4 ($5.14/h) and NC40ads H100 v5 ($9.77/h) [M].
   - Container Apps serverless A100 does not exist in either Indian region. T4 is too small and too old.
   - The reference server runs **one session per process** [M]. No published per-GPU concurrency exists [U].
4. **The value now is the recipe, not the model.** Five ideas transfer straight into our engine (§5).
   - Two-channel training labels.
   - Her own stream as an input.
   - Word-clock alignment.
   - Synthetic stitched dialogues with voice augmentation.
   - Role-probe evaluation.
5. **The `rj-native-duplex-teacher` rejection stands.** Nothing here meets its reversal condition.

---

## 1. What it is

### 1.1 Dates and artefacts

| artefact | date | source |
|---|---|---|
| HF repo created | 2025-12-31; last modified 2026-03-02 | HF API [M] `huggingface.co/api/models/nvidia/personaplex-7b-v1` |
| Paper v1 (Roy, Raiman, Lee, Ene, Kirby, S. Kim, J. Kim, Catanzaro) | 2026-01-14, the only version | [arXiv 2602.06053](https://arxiv.org/abs/2602.06053) [S] |
| Public release (HF and GitHub), project page | 2026-01-15 | [model card](https://huggingface.co/nvidia/personaplex-7b-v1), [ADLR page](https://research.nvidia.com/labs/adlr/personaplex/) [S] |
| Code | MIT; Moshi fork with `moshi.server` web UI on :8998 | [github.com/NVIDIA/personaplex](https://github.com/NVIDIA/personaplex) [S] |
| Weights | `model.safetensors` 16,742,874,000 bytes; 8,371,408,896 BF16 params (card text says "7B") | HF API [M] |

### 1.2 Architecture (inherited from Moshi)

Source: [Moshi, arXiv 2410.00037v2](https://arxiv.org/abs/2410.00037) (2024-09/10) [S], and the PersonaPlex `loaders.py`
config read today [M].

- **Helium backbone.** A 7B text LLM pretrained on 2.1T tokens of public English data, with a 32k SentencePiece vocabulary
  (mostly English) and RoPE, SiLU gating and RMSNorm.
  - It becomes the **Temporal Transformer**: dim 4096, 32 layers, 32 heads (full multi-head, no GQA), context 3,000 steps
    (= 240 s at 12.5 Hz) [M, `_lm_kwargs`].
- **Mimi codec.** 24 kHz audio at **12.5 Hz**, 8 codebooks of 2,048 entries (~1.1 kbps), causal, with an 80 ms frame.
  - Codebook 1 is distilled from WavLM, so it is semantic. The other 7 are an acoustic RVQ ("split RVQ").
- **Streams.** Each 80 ms step the model sees 17 streams: 1 text, 8 agent audio and 8 user audio.
  - The Temporal Transformer makes one context vector per step.
  - A small **Depth Transformer** (6 layers, dim 1024, 16 heads, separate weights per codebook) then decodes that step's
    audio tokens autoregressively.
  - PersonaPlex config: `n_q=16`, `dep_q=8`, `delays=[0,0,1,1,1,1,1,1,1,0,1,…]`. Text and semantic tokens are at delay 0;
    acoustic tokens trail by one step [M].
- **Inner monologue.** The model predicts time-aligned text of its *own* speech as a prefix to the audio tokens. The text
  comes from Whisper word timestamps, padded with PAD/EPAD; about 65% of English tokens are padding.
  - Shifting the text/audio delay turns the same model into streaming ASR or streaming TTS.
  - The final stages use a delay of 0 [S, Moshi].
- **Dual streams.** The user's audio is a separate input stream. The model never alternates turns: it emits agent audio
  every frame, and that audio is often silence.
- **Latency.** 160 ms theoretical (80 ms frame + 80 ms acoustic delay). Kyutai reports "as low as 200 ms on an L4 GPU" in
  practice ([kyutai-labs/moshi README](https://github.com/kyutai-labs/moshi) [S]).
- **Moshi's training data.** About 7M h of mostly-English audio for pretraining. Then diarised pseudo-stereo, then
  **2,000 h of Fisher** two-channel telephone audio, then more than 20k h of synthetic instruct speech with noise, gain and
  **echo augmentation on the user stream** [S, Moshi paper].

### 1.3 What PersonaPlex adds

Source: [paper](https://arxiv.org/html/2602.06053v1) [S].

- **Hybrid system prompt.** Two segments placed in time before the dialogue.
  - **Voice prompt:** a short speech sample on the agent-audio channel, with the agent text padded.
  - **Text prompt:** role and scenario tokens forced on the agent-text channel, with agent audio silent.
  - During the prompt, the **user channel carries a 440 Hz sine tone**. Custom delimiters mark where the prompt ends.
  - Order made no measured difference. The voice prompt goes first so it can be prefilled and cached.
- **Loss shaping.**
  - The prompt is excluded from the loss.
  - Non-semantic audio tokens are weighted 0.02, and padded text tokens 0.3.
- **Fine-tune only.** It starts from Moshi weights.
  - Adam with cosine schedule; learning rates 2e-6 (temporal) and 4e-6 (depth).
  - 24,576 steps, batch 32, sequences of 2,048 tokens (163.84 s).
  - **About 6 h on 8×A100** [S].
- **Server.** The text prompt arrives as a query parameter wrapped in system tags. Voice prompts are `.pt` embeddings:
  NATF0-3, NATM0-3, VARF0-4 and VARM0-4.
  - The server streams the inner-monologue text to the client (`0x02` frames) next to the audio (`0x01`) [M, `server.py`].

### 1.4 Training data

The model card says only "Fisher English Part 1 and 2, <10,000 h, 7,303 conversations"
([card](https://huggingface.co/nvidia/personaplex-7b-v1) [S]). The paper and project page give the full mix:

| set | dialogs | hours | how it was made |
|---|---|---|---|
| Synthetic customer service | 105,410 | 1,840 | Qwen3-32B and GPT-OSS-120B write transcripts, generated in a hierarchy: domain → scenario → transcript, with an agent role context. Dia TTS clones both voices |
| Synthetic assistant QA | 39,322 | 410 | two-turn QA with a fixed "wise and friendly teacher" role. Chatterbox TTS, one voice per role, turns **stitched** |
| Fisher English (released checkpoint only) | 7,303 | 1,217 | real two-channel calls, **back-annotated with persona prompts** by GPT-OSS-120B at three levels of detail |
| Voice pool | 26,296 samples | — | VoxCeleb, Libriheavy, LibriTTS, CommonAccent, Fisher. 2,630 held out for speaker similarity |

- **Timing is synthesised by stitching.** Turn gaps are added silence. **Interruptions and barge-in are negative-duration
  silence**, so the turns overlap [S, paper §3].
  - The paper does not say how backchannels in the synthetic data are labelled [U]. In the Fisher part they come from
    real listeners.
- **The released checkpoint changes the voices.**
  - Synthetic voices are made with TortoiseTTS, then **pitch- and formant-augmented with Praat**.
  - All synthetic dialogs use Chatterbox.
  - Speaker similarity rises from 0.57 to 0.65 [S].
- **Less than 5,000 h of directed data was enough for task-following** ([ADLR page](https://research.nvidia.com/labs/adlr/personaplex/) [S]).
  - Paper Table 5: even 25% of the data gives Service-Duplex-Bench 4.20 vs 1.75 for Moshi [S].

### 1.5 Evaluation

**Full-Duplex-Bench v1** ([Lin et al., arXiv 2503.04721](https://arxiv.org/abs/2503.04721), 2025).
- TOR is the take-over rate.
  - Pause and backchannel: lower is better.
  - Turn-taking and interruption: higher is better.
- Latency is in seconds. Paper Table 2 [S]:

| model | pause TOR syn ↓ | pause TOR Candor ↓ | BC TOR ↓ | BC freq ↑ | BC JSD ↓ | turn TOR ↑ | turn lat ↓ | interrupt TOR ↑ | interrupt GPT-4o ↑ | interrupt lat ↓ |
|---|---|---|---|---|---|---|---|---|---|---|
| PersonaPlex (paper) | 0.584 | 0.662 | 0.327 | 0.025 | 0.649 | 0.992 | **0.070** | 1.000 | 4.21 | 0.400 |
| **PersonaPlex (released ckpt, Table 6 / card)** | **0.358** | **0.431** | 0.273 | **0.042** | 0.662 | 0.908 | 0.170 | 0.950 | 4.29 | 0.240 |
| Moshi | 0.985 | 0.980 | 1.000 | 0.001 | 0.957 | 0.941 | 0.265 | 1.000 | 0.765 | 0.257 |
| Gemini (2.0-flash-live) | **0.255** | **0.310** | **0.091** | 0.012 | 0.896 | 0.655 | 1.301 | 0.891 | 3.38 | 1.183 |
| Freeze-Omni | 0.642 | 0.481 | 0.636 | 0.001 | 0.997 | 0.336 | 0.953 | 0.867 | 3.62 | 1.409 |
| dGSLM | 0.934 | 0.935 | 0.691 | 0.015 | 0.934 | 0.975 | 0.352 | 0.917 | 0.20 | 2.531 |
| Qwen-2.5-Omni | – | – | – | – | – | – | – | – | 4.59 | 2.740 |

**How to read it.**
- The released checkpoint still **takes over in 36-43% of user pauses**. Gemini is better at pauses (26-31%) but takes
  1.2-1.3 s to answer. No row is both fast and patient.
- Moshi beats PersonaPlex on interruption latency (0.257 vs 0.400 in the paper).
- The NVIDIA page sums this up as pause handling 60.6%, turn-taking 90.8% and interruption 95.0% "success"
  ([ADLR](https://research.nvidia.com/labs/adlr/personaplex/) [S]). That is 1 − TOR averaged.

**IndicFDB, English (Indian) split** ([arXiv 2609.31967](https://arxiv.org/html/2609.31967), 2026-09-25 [S]):

| model | pause S.R. | turn S.R. / lat | BC S.R. / JSD / freq | interrupt S.R. / lat / rating |
|---|---|---|---|---|
| PersonaPlex | 90.16% | 100% / **0.360 s** | 63.12% / 0.799 / 0.091 | 100% / 0.307 s / 4.843 |
| Moshi | 57.46% | 71.06% / 1.475 s | 3.12% / 0.870 / 0.056 | 99.0% / 0.449 s / 3.791 |
| Human (Hindi split, reference) | 100 | 100 / 0.259 s | — / 0 / 0.079 | — |

- **This is the best fast-and-patient row in IndicFDB, but it is English only.** No Hindi row exists for PersonaPlex.

**Naturalness and role.**
- DMOS on FDB: PersonaPlex 3.90, Gemini 3.72, Qwen-2.5-Omni 3.70, Freeze-Omni 3.51, Moshi 3.11. That is Table 1, rated
  by 152 people on 1,216 samples.
- Service-Duplex-Bench (the authors' own, 50 scenarios × 7 probes) GPT-4o mean: **Gemini 4.73, PersonaPlex 4.48**,
  Freeze-Omni 4.02, Qwen 2.76, Moshi 1.75.
  - The probes cover proper-noun recall, context details, unfulfillable requests, rudeness, unspecified requests and
    unrelated requests.
  - It is not public yet ("to be released") [S].
- Speaker similarity (WavLM-TDNN cosine): 0.57 (paper) and 0.65 (released), against 0.00-0.10 for the baselines [S].

**Independent findings (2026), from `MODELS-PAPERS.md`.**
- Spurious onsets: it starts speaking into digital silence in **27.5%** of 5-minute runs ([2609.13445](https://arxiv.org/abs/2609.13445)).
- DuplexJail: attack success rises by **+33.8 points** when a jailbreak is timed to land mid-response ([2609.09420](https://arxiv.org/abs/2609.09420)).
- Duplex Cue: it adapts within its turn to a listener's collaborative cue 34.8% of the time, against 68.2% for humans
  ([2609.13117](https://arxiv.org/abs/2609.13117)).
- These are repo citations dated 2026-10-05 [S].

### 1.6 Latency

- Response latency is 0.070 s (paper) or 0.170 s (released) on FDB turn-taking, and 0.360 s on IndicFDB English.
  Interruption latency is 0.240-0.400 s [S].
- Hardware for these figures is not stated [U]. The card's test hardware is a single **A100 80 GB** [S].
- Moshi's practical 200 ms is on an L4 [S].
- These are model-side figures. Network RTT from India comes on top (§7.5).

---

## 2. Language

- **English-only. Evidence:**
  - The card lists language `en`, and the use case is "English speech response for English speech input" (HF API and
    card [M/S]).
  - All voices and Fisher data are English.
  - Helium's 32k tokenizer "was trained for English and does not cover the Devanagari script"
    ([Human-1, arXiv 2604.23295v3, 2026-09-24](https://arxiv.org/abs/2604.23295) [S]).
  - IndicFDB ran PersonaPlex and Moshi on English only [S].
- **Romanised Hinglish** fits the tokenizer, but the acoustic and dialogue priors are English [E].
  - Untested [U]. Expect English-accented, English-norm prosody.
- **Moshi-family multilingual work.**
  - **Hibiki** (Kyutai, [arXiv 2502.03382](https://arxiv.org/abs/2502.03382), v1 2025-02-05, ICML 2025): a 2.7B
    hierarchical model at 12.5 Hz for **French→English** simultaneous translation.
    - Synthetic aligned data uses per-word delays chosen from a text MT model's perplexity; plain sampling makes it batchable.
    - Weights are CC-BY ([HF](https://huggingface.co/kyutai/hibiki-2b-pytorch-bf16) [S]).
    - It proves the 12.5 Hz multistream design carries a second language. It is not a dialogue model.
  - **Human-1** (Josh Talks / VoiceArena, Apr 2026, v3 2026-09-24) [S]: Moshi adapted to **Hindi**.
    - A new 32k Hindi SentencePiece tokenizer; every vocabulary-dependent parameter (text embeddings, text head) reinitialised.
    - **Mimi stays frozen.** It holds up on Hindi: STOI 0.878, PESQ 2.55 on 654 segments.
    - Stage 1: 26,000 h of native two-channel Hindi from 14,695 speakers, one epoch of about 10k steps, **about 13 h on
      8×H100**, learning rate 3e-5.
    - Stage 2: 990 h curated, effective batch 16, best checkpoint at step 4,812. Text overfits after about 4.8k steps.
    - Results: naturalness 4.10 vs 4.55 human. Only 53% of replies follow the prompt context and 42% are complete.
    - IndicFDB Hindi: pause 72.06%, turn latency 2.021 s, interruption rating **0.564/5**.
    - Weights CC-BY-4.0 on HF (`VoiceArena/Human-1`, `JoshTalksAI/Human-1`) [S, search 2026-10-11]. Access gating [U].
  - **Other derivatives** (HF search [M]):
    - `RetentionLabs/personaplex-ko-ext-base` (2026-07-30) **extends** the text vocabulary from 32,000 to 33,772 rows for
      Korean and fine-tunes on the NIKL corpus. It is a cheaper alternative to a full re-tokenise.
    - `TorchLLM/hindi-personaplex-7b-*` (2026-02-17) claims Hindi ASR with a 497 KB LoRA and AutoModel loading. That is
      implausible for this architecture, so treat it as unreliable [U].
    - `Roxi-Duplex`, a Moshi LoRA for Indian-English support, was seen in search only [U].
- **How much Hindi or Hinglish a fine-tune would need.**
  - **Timing:** Human-1 shows 26k h of real two-channel speech is *sufficient* for human-like Hindi timing. Nobody has
    published the minimum [U].
  - **Role-following:** PersonaPlex shows less than 5k h of *directed* data is enough in a language the backbone already
    knows (25% of 2,250 h already worked).
  - **Content quality** is the binding constraint, not timing. Human-1 at 0.56/5 shows that a Hindi duplex model
    trained on chat data does not reason.
  - **Feasibility for Taxila:** the compute is cheap (§6.5); the data is not. We have no licensed thousands-of-hours
    two-channel Hindi corpus, and synthetic stitched Hinglish (§5.4) teaches role and timing, not real child acoustics.
    - The licence-clean shortcut is to start from **Human-1** (CC-BY-4.0, Hindi tokenizer already in place) and apply
      PersonaPlex's prompt recipe. It is not to start from PersonaPlex.

---

## 3. Licence

| part | licence | source |
|---|---|---|
| PersonaPlex code | MIT | [GitHub README](https://github.com/NVIDIA/personaplex) [S] |
| PersonaPlex weights | **NVIDIA Open Model License Agreement**. The card also cites CC-BY-4.0 in "additional information" (inherited from Moshi). HF licence field is `other`; access is gated (contact sharing) | [card](https://huggingface.co/nvidia/personaplex-7b-v1), HF API [S/M] |
| Moshi and Mimi weights | CC-BY 4.0. Code: MIT (Python), Apache (Rust) | [kyutai-labs/moshi](https://github.com/kyutai-labs/moshi) [S] |
| Human-1 weights | CC-BY-4.0 | HF search result [S]; the card was not opened [U] |

**NVIDIA Open Model License, version of 2025-10-24**
([nvidia.com](https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license/) [S]):
- **Grant:** "Models are commercially usable." Perpetual, worldwide, royalty-free and **revocable**. Derivatives are
  allowed and you own them. NVIDIA claims no ownership of outputs, and **you are responsible for outputs**.
- **Attribution:** ship a Notice file with "Licensed by NVIDIA Corporation under the NVIDIA Open Model License" and a copy
  of the Agreement (§3.1).
- **Termination:** automatic if you **bypass, disable or reduce the efficacy of any technical limitation or safety
  guardrail** without a substantially similar guardrail of your own (§2.1), or if you sue NVIDIA over IP.
- **Other terms:** use must follow NVIDIA's Trustworthy AI terms (§2.3; linked, not reproduced, not read [U]). NVIDIA may
  update the agreement and you must comply or stop. Delaware law; Santa Clara courts.
- **Children:** neither the agreement nor the card has a clause on minors [S]. The card states no limitations section,
  only "requires additional testing using use-case-specific data".

**Reading.**
- Commercial use in a children's product is permitted by the text.
- What it adds is liability: we own the outputs, and the guardrail clause means a fine-tune that weakens the model's
  (thin) refusal behaviour must be replaced by our own guardrail.
- Fine-tuning from Human-1 or Moshi instead keeps us on plain CC-BY-4.0 (attribution only).
- This is not legal advice. Compliance work is deprioritised, so have counsel read the Trustworthy AI terms before any
  ship [U].

---

## 4. What it gets right that a cascade plus a rules engine does not

Each item names the mechanism, then the gap in our engine.

1. **Backchannels generated in-stream.**
   - **Mechanism:** the agent stream is decoded every 80 ms, whoever holds the floor. A short "yeah" or "okay" while the
     user keeps talking is just another token sequence. The model learnt it from real listeners in Fisher's two-channel
     audio, then kept it through stitched synthetic data.
   - Because the decision is conditioned on the user's audio *and* the agent's own text history, its timing tracks
     prosody and syntax. That gives BC JSD 0.649-0.662 vs Moshi 0.957 and Gemini 0.896 (FDB), and freq 0.091/s vs
     human 0.079 on IndicFDB.
   - **Our engine:** no audio backchannel exists. A visual nod is driven by mic level.
2. **Listening while speaking.**
   - **Mechanism:** user audio is an always-on input stream, and the model's own audio is a *separate* stream it knows
     exactly.
   - It never has to infer whether a sound is itself. That separation is learnt, helped by Moshi's echo augmentation of
     the user channel during instruct tuning.
   - **Our engine:** separation is inferred after the fact: an echo-likelihood estimate plus pitch rules. Hence the 13%
     self-yields on AMI.
3. **Modelling pauses, so it doesn't cut off.**
   - **Mechanism:** end-of-turn is not a detector. The question every frame is "is the most likely next agent token
     silence or speech?", given the full semantic and prosodic context of both streams.
   - Pauses inside a user turn appear in training as silence with a *continuing* user stream after them.
   - The released checkpoint's pause TOR falls from 0.98 (Moshi) to 0.36-0.43. Part of that comes from Fisher's real
     mid-turn pauses.
   - **Our engine:** hand-made pause classes and fixed waits. Stage A reaches 2.3-2.6% cut-offs on TaxilaFDB, but at a
     decision gap far above 350 ms on the D4 transcriber.
4. **Natural overlap.**
   - **Mechanism:** the training data contains overlap by construction (negative-silence stitching and real Fisher
     overlap). Generation does not stop the user stream, so the model can keep talking through a continuer, or yield
     inside one frame.
   - Interruption TOR is 0.95-1.0 with 0.24-0.40 s latency [S].
   - **Our engine:** overlap is a code decision: duck, hush at about 120 ms, then classify, then a 1 s forced yield. Every
     overlap costs a hush the child can hear, and continuers are kept only 82%.
   - Note: PersonaPlex is *not* good at the third option, "fold the cue in". It adapts only 34.8% of the time vs 68.2%
     for humans (Duplex Cue).
5. **Persona consistency.**
   - **Mechanism:** the role text is forced on the text channel and the voice sample on the audio channel *before* the
     dialogue, as context the model attends to throughout. It is excluded from the loss, so the model learns to
     condition on it rather than copy it.
   - Training covers about 145k dialogs, each with its own role context.
   - Voice identity is in context, not a fine-tuned voice. That gives SSIM 0.65 vs 0.10 for Moshi; Moshi's own voice
     self-consistency is 98.7%.
   - **Our cascade** already gets persona from the Director and a fixed TTS voice. This is the one area where we do
     *not* lag. The lesson is the *prompt-in-context, loss-masked* trick for any small model we train (§5.7).

---

## 5. Ideas Taxila can adopt in its own engine, without hosting PersonaPlex

Ordered by expected effect on the measured weak spots. All run on allowed compute: on-device, Container Apps CPU, or
Azure-hosted data generation.

### 5.1 Train the turn/continuer model on two-channel labels, the way duplex models learn (continuers 82%, gap ~1 s)

- **What PersonaPlex does:** it never labels "continuer" or "end of turn". The target is simply *what the agent channel
  does next* in a two-channel recording.
- **Our version:** a small causal frame model at **80 ms** (Mimi's rate; 12.5 decisions/s). Use VAP-style targets: the
  voice activity of {child, her} over the next 0-2 s, binned.
  - Inputs: child mic features (log-mel or the existing RMS + YIN f0), **her outgoing stream** (§5.2), and the streaming
    ASR token-timing features already in `features.ts`.
  - Continuer vs barge-in is then *read off* the prediction: if the model expects the child's channel to go quiet in
    under 600 ms while hers continues, it is a continuer. Keep her at duck level and **skip the hush**.
- **Why it can beat stage B:** stage B failed because it learnt 4 TTS voices (`ENGINE-MODEL.md` §1, verdict 3). PersonaPlex's
  answer is *voice diversity at scale*: 26k voice samples, plus Praat pitch and formant augmentation that took SSIM from
  0.57 to 0.65 (§5.4).
- **Size:** a 1-5M-parameter GRU/TCN in ONNX fits the 20 MB device budget. [E]

### 5.2 "Listening while speaking": feed the engine her own stream as an aligned input (self-yields 13%, false yields 14%)

- **What PersonaPlex does:** its own audio and text are first-class inputs, so "is that me?" is never a guess.
- **Our version:** the client knows exactly what it is playing. Build three aligned features per 20 ms.
  1. **Reference-correlation echo feature:** the normalised cross-correlation (or a coherence estimate) between the
     playback buffer and the mic over 0-300 ms lags.
     The echo path on a loudspeaker phone is roughly fixed per session, so track the best lag and gain. A frame whose
     energy is explained by her delayed signal is echo whatever its pitch. This replaces the heuristic echo-likelihood.
  2. **Her word clock:** Azure Speech TTS word-boundary events, the analogue of the inner monologue.
     They tell the engine which word she is on and how far she is from a clause end. Listeners place continuers near
     the speaker's clause ends, so a child onset at her clause end is a continuer prior; one mid-word is a barge-in prior.
  3. **Residual-after-echo VAD:** run the energy VAD on (mic − scaled, aligned playback), a cheap NLMS-style
     cancellation on top of the browser AEC, rather than on the raw mic. [E]
- **Training augmentation:** do what Moshi did. Mix her channel into the child channel with gain and delay jitter and
  loudspeaker impulse responses. Test on the AMI echo split.

### 5.3 A model-timed backchannel, played from pre-rendered clips

- **Mechanism to copy:** in-stream backchannels exist because the model predicts the listener channel.
  - Our §5.1 model already predicts "her" activity during the child's turn. Add one head: P(listener backchannel in
    the next 400 ms).
  - Train it on two-channel Hindi or Hinglish data where the listener backchannels. "Controlling Backchannels" (2026) did
    this as a small head on a duplex model's hidden states (cited in `MODELS-PAPERS.md`, backchannel section).
- **Output:** fire a pre-synthesised Azure TTS clip ("haan", "achha", "hmm", "theek hai") in her voice, gated by a rate
  cap near the human Hindi 0.079/s, never mid-word, only on teach-back or explanation beats (the `ARCHITECTURE.md` A7
  gate). The visual nod stays the fallback.

### 5.4 The synthetic two-channel Hinglish dialogue factory (PersonaPlex's recipe, Azure-only)

1. **Transcripts.** An Azure OpenAI model generates hierarchically: subject → beat type (explain, check, teach-back,
   dictation, closed answer) → scenario → transcript.
   Event tags inline: `<bc>`, `<think-pause 1.8s>`, `<self-repair>`, `<barge-in at word k>`, `<side-talk>`, `<echo>`.
   Model choice comes from the usual bake-off.
2. **Voices.** Her: the production voice. Child: hi-IN and en-IN neural voices with SSML pitch and rate shifts (no Hindi
   child voice exists in the catalogue, TAXILAFDB §2.2, 2026-10-04). Then the PersonaPlex move: **Praat pitch and formant augmentation** (offline DSP, no AI API) to turn about 10 Azure
     voices into hundreds of pseudo-speakers. Hold out whole base voices for test.
3. **Stitching.** Gaps sampled from the human Hindi gap distribution (median 259 ms, IndicFDB) and our child pause
   distributions; overlaps as **negative silence**; backchannels at sampled clause ends of the other channel; her echo
   mixed into the child channel (§5.2); noise beds from TaxilaFDB.
4. **Labels by construction:** every frame's {child, her} activity, event type and the gold "should she yield" are
   written alongside.
5. **Cost** [E].
   - Azure neural TTS in Central India is **$15 per 1M characters** (Retail Prices API, S1 "Neural Text To Speech
     Characters" [M]).
   - At about 15 spoken characters/s [U, assumption], 100 h ≈ 5.4M characters ≈ **$81**, and 1,000 h ≈ **$810**.
   - LLM transcript cost is small next to that [U, model-dependent]. TaxilaFDB measured 1,120 renders = 237k characters
     ≤ $4.54 (`TAXILAFDB.md` §2.2).
6. **Back-annotation.** PersonaPlex labelled *real* Fisher calls with role prompts by LLM.
   Do the same for consented real Taxila lesson recordings (E1): an LLM writes the beat/role context, so real audio
   joins the same training format. Azure batch STT costs $0.18/h in Central India [M].

### 5.5 Make the eager end-of-turn hint a "semantic VAD" that knows the expected answer form

- **Mechanism:** PersonaPlex's turn decision uses semantics (its text stream) and prosody together.
- **What we know already:**
  - Azure's `semantic_vad` split a child's mid-thought pause in our own test (n = 1, synthetic; `server/voice/stt.js`
    comment, `voice-turn-config`).
  - The fast-LLM semantic read added no benefit at a 640 ms p50 (`ENGINE-MODEL.md` §1, verdict 2).
- **What to take:**
  - Run the completeness read **in the engine's own small model** (§5.1 text features), conditioned on the *expected
    answer form* from the Director (number, word, sentence, dictation). That is the context no generic semantic VAD has.
  - A stock LLM is too slow to beat the code.

### 5.6 FullDuplexBench-style evaluation, extended the way PersonaPlex extended it

- TaxilaFDB already covers FDB's four behaviours for Hinglish children.
- **Add PersonaPlex's Service-Duplex-Bench idea as "Tutor-Duplex probes":** fixed probe types per lesson role.
  - Recall of the child's name or the problem's numbers.
  - Context details.
  - Unfulfillable request ("homework kar do").
  - Rudeness.
  - Unrelated or off-topic.
  - **Safety disclosures.**
  - Score with *classifiers against keys*, not a model grader (CLAUDE.md law).
- **Add a speaker-similarity check** (WavLM-TDNN cosine) as a regression gate for any voice change.
- The French FDB adaptation ([arXiv 2609.10765](https://arxiv.org/abs/2609.10765), 2026-09-09 [S]) found that timing
  metrics transfer across languages and content metrics degrade under language mismatch. So score Hinglish content in
  Hinglish, not after translation.

### 5.7 Smaller transferable tricks

- **Prompt-in-context, loss-masked.** If we train any listener or talker model with lesson context (beat, expected
  form), put the context in the sequence and mask it from the loss. PersonaPlex also down-weighted the dominant
  "nothing happening" frames (0.02 non-semantic, 0.3 pad). Our silence-matched sampling is the same idea; keep it.
- **A sine-tone "no user yet" channel.** A distinct filler on the user channel during setup kept PersonaPlex from
  reacting to prompt time. For us: never feed the classifier raw silence before the child's first onset. Mark the
  pre-onset state explicitly. This is the guard against spurious onsets (27.5% for PersonaPlex).
- **Latency targets to hold the engine to:** interruption reaction 0.24 s and turn gap 0.17-0.36 s. These are the
  numbers to beat on the fast lane, where stage A is at 370 ms p50.

---

## 6. The hosting path once GPU quota exists

### 6.1 VRAM [E unless marked]

| precision | weights | + KV per session (3,000-step context) | + Mimi ×2, activations | per-GPU fit |
|---|---|---|---|---|
| bf16 | 16.7 GB [M, file size] | 2 (K,V) × 32 layers × 4096 × 2 B = 0.52 MB/step → **1.57 GB** | ~1-2 GB [U] | ~20 GB for 1 session. Kyutai says about 24 GB for PyTorch Moshi ([README](https://github.com/kyutai-labs/moshi) [S]) |
| int8 / fp8 | ~8.4 GB | 1.57 GB (bf16 KV) | ~1-2 GB | Moshi's demo serves 8-bit weights at about −2 MMLU ([Moshi paper](https://arxiv.org/abs/2410.00037) [S]). No official fp8 PersonaPlex path [U] |
| int4 | ~4.2-4.7 GB | 1.57 GB | ~1-2 GB | Moshi loses 5-10 MMLU at 4 bit [S]. Community q4 GGUF, MLX and nf4 builds exist (HF search [M]) but are unevaluated [U] |

The official server has a `--cpu-offload` flag for small GPUs ([README](https://github.com/NVIDIA/personaplex) [S]). That
is not real-time-safe [U].

### 6.2 SKUs and prices

All prices are PAYG Linux, from the [Azure Retail Prices API](https://prices.azure.com/api/retail/prices) queried
2026-10-11 [M]. They are cross-checkable on the [VM pricing page](https://azure.microsoft.com/pricing/details/virtual-machines/linux/)
and the [Container Apps pricing page](https://azure.microsoft.com/pricing/details/container-apps/). Treat them as
**ESTIMATE**: no discounts, credits or savings plans applied.

| SKU | GPU (memory) | Central India $/h | South India $/h | East US $/h | fit |
|---|---|---|---|---|---|
| Standard_NC40ads_H100_v5 | 1× H100 NVL (94 GB) ([doc](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ncadsh100v5-series)) | **9.772** | not listed | 6.98 | best: room for batching |
| Standard_NC80adis_H100_v5 | 2× H100 NVL (188 GB) | 19.544 | not listed | 13.96 | fine-tune (small) and serving |
| Standard_NC24ads_A100_v4 | 1× A100 80 GB | **5.142** | not listed | 3.673 | card's tested GPU |
| Standard_NC96ads_A100_v4 | 4× A100 80 GB | 20.569 | not listed | 14.692 | fine-tune |
| Standard_ND96amsr_A100_v4 | 8× A100 80 GB | not listed | 49.483 | 32.77 | fine-tune (paper's 8×A100 shape) |
| Standard_ND96isr_H100_v5 | 8× H100 | not listed | not listed | 98.32 | Human-1-scale pretrain |
| Standard_NV36ads_A10_v5 | 1× A10 (24 GB) ([doc](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nvadsa10v5-series)) | 4.48 | not listed | 3.20 | 1 session at bf16, tight; poor value vs A100 |
| Standard_NC4as_T4_v3 | 1× T4 (16 GB) | 0.579 | 0.742 | 0.526 | no: no bf16 tensor cores [U for real-time at int4] |

**Container Apps serverless GPU**
([doc, ms.date 2026-09-21](https://learn.microsoft.com/en-us/azure/container-apps/gpu-serverless-overview) [S]):
- A100 and T4 GPUs, per-second billing, scale to zero, **one GPU per replica, no fractional GPUs**.
- **Central India and South India: T4 only.** A100 is available in Sweden Central, East US, West US/3, Italy North and
  others.
- GPU meters [M]: A100 **$0.000688/s ≈ $2.48/h in Sweden Central**, $0.000529/s ≈ $1.90/h in East US (a Central India
  A100 meter of $0.000741/s exists, but no A100 is offered there); T4 $0.000102/s ≈ $0.37/h in Central India. vCPU and
  memory meters come on top [U, not summed].
- Cold start loads a 16.7 GB image or mount. Use ACR artifact streaming and a storage mount, per the doc.

### 6.3 Concurrent streams per GPU

- **Measured fact:** the reference servers (Kyutai `moshi/server.py` and NVIDIA's fork) hold a global `asyncio.Lock`
  around each WebSocket session. **One process = one conversation** [M, code read 2026-10-11].
- Kyutai's Rust/Candle server batching was not verified [U]. A conference abstract mentions about 500k Moshi sessions
  served on L4 clusters; that is cumulative, not concurrent, and the page returned 403 [U].
- **No published per-GPU concurrency for Moshi or PersonaPlex was found [U].**
- **Ceiling arithmetic [E]** (H100 NVL, 94 GB, ~3.9 TB/s):
  - Memory: (94 − 17 weights − 4 overhead) / 1.6 GB KV ≈ **45 sessions**.
  - Bandwidth: one temporal step reads 16.7 GB once per batch (~4.3 ms), plus about 0.4 ms of KV per session. The depth
    transformer adds 8 sequential small steps. A batched step should fit the 80 ms frame up to tens of sessions.
  - Compute: about 2 × 8.4 GFLOP × 12.5 steps/s ≈ 0.21 TFLOP/s per session. Not binding.
  - **Planning numbers:** 1 (stock server), **8 (custom batched server, conservative)**, 32 (optimistic). The real number
    must be measured: p99 step time < 80 ms at each batch size.
  - A100 80 GB: about 0.8× the memory ceiling (~35) and lower bandwidth [E].

### 6.4 Cost per child-hour [E]

Formula: **$/GPU-h ÷ (sessions per GPU × utilisation)**.

Assumptions:
- Utilisation is 50%: the fleet is sized for after-school peaks and reserved VMs do not scale to zero [U].
- Network, storage, CPU and the safety side-models are excluded.

| GPU (Central India PAYG) | 1 session | 8 sessions | 32 sessions |
|---|---|---|---|
| NC40ads H100 v5 @ $9.772 | $19.54 | **$2.44** | $0.61 |
| NC24ads A100 v4 @ $5.142 | $10.28 | **$1.29** | $0.32 (if ~32 fit) |
| ACA serverless A100, Sweden Central @ ~$2.48 (scale-to-zero, so utilisation ≈ 100% of billed time) | $2.48 | $0.31 | — (ceiling ~35) |

- Reference point: `tech-and-market.md` §4 notes GPT-Live-1 at about $3/h on Azure [S, repo, 2026-10].
- PersonaPlex is cheaper only with a custom batched server. Sweden Central adds about 164 ms of inter-region RTT (§7.5).

### 6.5 The Hindi fine-tune plan, if the rejection's reversal conditions ever come in reach

**Base model.**
- Use Human-1 (CC-BY-4.0, Hindi tokenizer, Hindi timing) if its weights load. Otherwise use PersonaPlex with the Korean
  repo's vocabulary-*extension* trick for Devanagari.
- The **inner monologue stays in Devanagari + Roman Hinglish**. That keeps the text stream readable by our safety
  predicate (§7.1).

| phase | data | compute (scaled from published runs) [E] | cost, Azure PAYG [E] |
|---|---|---|---|
| P0 data factory | 1,000 h synthetic Hinglish tutor dialogs (§5.4), plus E1 consented real lessons back-annotated | CPU + Azure TTS | ~$810 TTS + LLM [U] |
| P1 timing (only if starting from PersonaPlex) | ≥ 5-10k h real two-channel Hindi. **No licensed source exists today [U]**. Human-1 used 26k h for one epoch | Human-1: ~13 h × 8 H100 = 104 H100-h per 26k h → ~40 H100-h per 10k h | ND96isr H100 v5 East US $98.32/h × ~5 h ≈ **$490** |
| P2 role and voice (PersonaPlex recipe) | ~2,000 h stitched synthetic + prompts; 3-5 runs for ablation | Paper: ~6 h × 8 A100 = 48 A100-h per run | ND96amsr A100 v4 South India $49.48/h × 6 h ≈ **$297/run**, ~$0.9-1.5k for 3-5 runs |
| P3 safety tuning | refusal and hand-off dialogs (Childline 1098, Tele-MANAS 14416), adversarial mid-response barge-ins (DuplexJail-style) | ~1 run of P2 | ~$300 |
| Eval | TaxilaFDB + IndicFDB Hindi + Tutor-Duplex probes | 1× A100 for a few days | ~$5.14/h × 72 h ≈ $370 |

- **Total GPU spend is about $2-3k. Data is the real cost and the real blocker.**
- The `rj-native-duplex-teacher` reversal bars stay the gate: IndicFDB Hindi content ≥ 4.5 and pause success ≥ 95%,
  plus passing our Hindi safety evals.

---

## 7. Risks

1. **Child safety: the predicate runs too late or not at all.**
   - Text and semantic audio tokens are at delay 0 in the config [M]. So the inner-monologue word appears in the *same*
     80 ms frame as its audio, with one frame of acoustic lag.
   - A predicate on that text can only mute after the first syllable. Phrase-level checks need an **output hold buffer**
     of N × 80 ms, costing exactly that much latency. Text and audio can also diverge [U, not measured].
   - Moshi's ALERT safety score is 83.05, vs 99+ for GPT-4 and Llama 2 ([Moshi paper](https://arxiv.org/abs/2410.00037) [S]).
   - DuplexJail adds +33.8 points of attack success, and it self-starts into silence in 27.5% of runs (§1.5).
   - Our floor (never deny being an AI, 1098 and 14416 hand-off, no romance register) would have to be **trained in and
     wrapped by** a code gate. The licence also makes us responsible for those outputs.
2. **Hallucination and weak content.** It inherits Helium/Moshi's knowledge (Moshi MMLU 49.7); even the Hindi-native
   Human-1 rates 0.56/5 on replies to interruptions.
   - A duplex model cannot run our "classify against verified keys" grading inline. Any teacher use would be a front-end
     talker in a split design, with the Director as backend.
3. **English-only** (§2). A Hindi build is a data project measured in thousands of hours of two-channel speech.
4. **Licence.** Revocable grant, NVIDIA's right to update the terms, the guardrail-termination clause and the unread
   Trustworthy AI terms [U]. Human-1 and Moshi (CC-BY-4.0) are the lower-risk bases.
5. **Latency on Indian networks.**
   - Model-side 0.17-0.36 s is good. But **no Azure A100 or H100 serverless GPU exists in India**, and of the SKUs queried
     only the NC/NV sizes are priced in Central India (the 8-GPU ND sizes are not).
   - Inter-region P50 RTT from Central India is **164 ms to Sweden Central** and **201 ms to East US**. From South India
     it is 171 and 220 ms ([Azure network latency, ms.date 2026-07-30](https://learn.microsoft.com/en-us/azure/networking/azure-network-latency) [S]).
   - Indian mobile adds 13-61 ms access p50 and 0.3-8% loss (`docs/research/voice/network-resilience.md` §1 [S, repo]).
   - A frame-synchronous model is **more** fragile than a cascade under loss: a missing 80 ms user frame is missing
     input, and the stock client has no jitter strategy [U].
   - It must be in Central India (NC VMs) to be competitive.
6. **Operations.** One session per process in the stock server; 16.7 GB cold starts; no fine-tuning code is published
   ([README](https://github.com/NVIDIA/personaplex) [S]), so we would write the training loop from the paper.

---

All sources are linked inline above, each accessed 2026-10-11 with its publication date where known. Repo memory used:
`docs/research/duplex/MODELS-PAPERS.md`, `TAXILAFDB.md`, `ENGINE-MODEL.md`, `docs/research/voice/network-resilience.md`,
`docs/research/tech-and-market.md`, `context/rejected.md`.
