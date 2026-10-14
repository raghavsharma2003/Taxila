# Duplex and speech-to-speech landscape, October 2026 (Hinglish children, phone loudspeaker, Azure-only)

**Date:** 2026-10-11. **Question:** which full-duplex or speech-to-speech conversational systems exist, which of
them handle Hindi and Hinglish, and which ones Taxila may call today under the Azure-only rule with 0 GPU quota.
**Companion files (not repeated here):** `../duplex/PRODUCTS.md` (Study A, product mechanics),
`../duplex/MODELS-PAPERS.md` (Study B, papers and benchmarks), and the separate PersonaPlex teardown.

**Evidence tags.**
- **[V]** = read today (2026-10-11) from a primary source: model card, official doc, GitHub README, arXiv abstract or
  HTML, or the Azure retail price API. The fetch tool summarises pages, so a summary can drop detail. A [V] on a vendor
  claim means *the vendor says so*, not that it is true.
- **[U]** = unverified: press, a search snippet, a third-party blog, memory, or a claim carried from an earlier Taxila
  study and not re-read today.
- **[M]** = measured in this repo (cited from `context/measurements.md`, not re-run).
- **[E]** = my arithmetic or inference.

"Hindi: no evidence" means no language table, model card or paper section names Hindi. It does not mean the model
fails in Hindi.

---

## 1. Summary (the 10 lines)

1. **Nothing open and full-duplex speaks Hindi with usable quality and commercial weights today.** PersonaPlex is
   English-only per its model card [V]. Moshi is English [V]. Human-1 (Hindi, Moshi-based) has no confirmed weight
   release and rates 0.564/5 on interruption responses [V].
2. **Azure Voice Live supports hi-IN [V]:** in its multilingual input model, in `azure_semantic_vad_multilingual`
   (turn detection), in MAI-Transcribe-2, and through hi-IN voices (`diya`, `meera`, Swara, MAI-Voice-2 Arjun).
3. **Voice Live is half-duplex with barge-in.** It has server echo cancellation (with a Live-Reference AEC mode for
   client playback), deep noise suppression, semantic end-of-turn and avatars [V]. It is the best managed fit for a
   phone loudspeaker today. The filler-word list it uses to stop false barge-in is English-only [V].
4. **gpt-realtime and gpt-realtime-mini list Hindi** in Microsoft's Voice Live language table [V]. gpt-realtime-2.1
   is deployable through Voice Live in `centralindia`, including a `-regional` variant processed in India [V].
5. **GPT-Live-1 is the only true full-duplex model sold on Azure** ($3.00/h Global meter [V]). On IndicFDB Hindi it
   replies in 0.181 s but takes the floor in about 38% of natural pauses (pause success 61.59%) [V]. That is
   dangerous for slow-answering children, and the floor decision belongs to the model, not to Taxila's code.
6. **Azure Speech hi-IN STT and TTS are GA and CPU-free for Taxila** [V]. The cascade (Voice Live or our own) stays
   the only path where code holds the floor and a safety predicate runs before speech.
7. **Open turn models run on CPU today:** Smart Turn v3 (BSD-2, 8M parameters, Hindi 93.44% on its test set, about
   12-95 ms on CPU) [V], and VAP (MIT, English-trained) [V]. Both can sit on Azure Container Apps without GPUs.
8. **Best open full-duplex candidates after GPU quota:** (a) PersonaPlex or Moshi re-trained on Hindi two-channel
   data, following the Human-1 recipe (26k h) [V]; (b) MiniCPM-o 4.5 (Apache-2.0, 9B, full-duplex, English and
   Chinese speech) [V] with a Hindi fine-tune. Both need data we do not have yet.
9. **Hindi-capable commercial S2S systems outside Azure** include Gemini 3.8 Live, Nova 2 Sonic, Hume EVI 4-mini
   (sunset 2026-11-13), ElevenLabs, Deepgram Flux Multilingual and Sarvam [V]. Taxila may cite them, not call them.
10. **Verdict:** today, ship Voice Live (or our own Azure cascade) with hi-IN and en-IN, server AEC and a CPU turn
    model. Keep GPT-Live-1 as a measured benchmark arm only. Revisit open duplex once GPU quota exists and a Hindi
    two-channel corpus is available.

---

## 2. The big comparison table

Columns:
- **Duplex:** **FD** = true full-duplex (listens while speaking, model decides overlap); **HD+B** = half-duplex with
  barge-in (VAD or end-of-turn decides, speech stops on interrupt); **Casc** = STT, LLM and TTS stack; **Comp** =
  component only.
- **BC:** backchannels.
- **Azure status:** **Direct** = sold by Microsoft (Foundry Models sold by Azure, or Azure Speech / Voice Live
  meters); **MP** = Marketplace or partner only; **No** = not on Azure; **Self** = open weights you could host on
  Azure GPUs (quota is 0 today).

### 2.1 Commercial systems

| System | Duplex | BC / overlap | Hindi / Hinglish (evidence) | Latency (source) | Persona / voice | Licence | Hosting | Azure status |
|---|---|---|---|---|---|---|---|---|
| **Azure Voice Live** (cascade or native host) | HD+B | No BC output; barge-in on by default; English filler list suppresses false barge-in [V] | **Yes [V]**: hi-IN in multilingual STT model; `azure_semantic_vad_multilingual` lists Hindi; hi-IN voices | First audio 858 ms (Voice Live + Azure voice), n=5/arm [M] | Instructions; 600+ voices; custom voice; avatar (incl. photo avatars) [V] | Proprietary service | Managed | **Direct** |
| **gpt-realtime / gpt-realtime-2.1 / -mini** (Azure OpenAI or Voice Live) | HD+B | Stops on any speech onset; no BC [U, Study A turnprobe] | **Listed [V]** in the Voice Live language table ("Hindi"; list = languages under 50% WER) | gpt-realtime-2.1 native first audio 776 ms, n=5/arm [M] | Instructions; OpenAI voices (marin, cedar); in Voice Live also Azure voices | Proprietary | Managed | **Direct** (Global incl. southindia; Voice Live centralindia, incl. Regional) [V] |
| **azure-realtime** (Voice Live) | HD+B | as Voice Live | **Yes [V]**: native voices `diya`, `meera` "bilingual Hindi and Indian-accented English" | First audio 476 ms, n=5/arm [M] | 34 curated native voices [V] | Proprietary | Managed | **Direct** (Voice Live, centralindia Global) [V] |
| **GPT-Live-1** (Azure OpenAI) | **FD** | Model-owned; adapts to interruptions [V]; IndicFDB Hindi BC JSD 0.822 [V] | "Multilingual ... no guarantee of uniform quality" [V]; IndicFDB Hindi row [V] | IndicFDB Hindi turn latency 0.181 s, interruption 0.322 s [V] | Instructions (appendable); voice fixed at start [V] | Proprietary | Managed | **Direct** (meter "Live 1": $3.00/h Global, $3.30/h DZ [V]); not yet in the sold-by-Azure model table (2026-10-08) [V] |
| **phi4-mm-realtime** (Voice Live, preview) | HD+B | as Voice Live | **No**: its list is zh, en, fr, de, it, ja, pt, es [V] | no number | Azure TTS voices | Proprietary service (Phi-4-MM weights MIT) | Managed | **Direct** (Lite tier, preview) [V] |
| **Azure AI Speech STT/TTS** (+ MAI-Transcribe-2, MAI-Voice-2) | Comp | n/a | **Yes [V]**: hi-IN STT; 9 hi-IN Neural voices + hi-IN Arjun on MAI-Voice-2 (HD) and MAI-Voice-2-Flash; MAI-Transcribe-2 lists Hindi | Taxila STT/TTS numbers in `context/measurements.md` [M] | SSML, styles (Swara), custom/pro voice | Proprietary | Managed | **Direct** |
| **OpenAI Realtime / GPT-Live (openai.com)** | HD+B / FD | same models | same as Azure | gpt-realtime-2.1 price $32 / $64 per 1M audio tokens in/out [V] | same | Proprietary | Managed | No (OpenAI direct); same models on Azure |
| **Google Gemini 3.8 Live** | HD+B (server VAD; proactive audio) | IndicFDB Hindi: pause S.R. 100, BC freq 0.010/s [V] | **Yes [V]** (`hi` among 99 languages) | IndicFDB Hindi 1.400 s turn, 1.255 s interruption [V] | Voices; affective dialog [V] | Proprietary | Managed | No |
| **xAI Grok Voice (Think Fast 2.0)** | HD+B | IndicFDB Hindi BC freq 0.004/s [V] | Evaluated in Hindi by IndicFDB [V]; no vendor language table found [U] | IndicFDB Hindi 2.556 s [V]; vendor "<1 s" TTFA [U] | Voices | Proprietary | Managed | No (Grok text models are on Foundry; voice API not found) [U] |
| **Amazon Nova 2 Sonic** | HD+B | "Intelligent turn-taking" [V] | **Yes [V]**: Hindi + en-IN; polyglot voices switch languages | 1.39 s TTFA [U]; endpointing 1.5-2.0 s [U, Study A] | Voices | Proprietary | Managed | No |
| **Hume EVI 3 / EVI 4-mini** | HD+B, "always interruptible" | Tone-based EOT [V] | **EVI 4-mini yes [V]** (11 languages incl. Hindi); EVI 3 English only | no number [V] | Voice + supplemental LLM | Proprietary | Managed | No; **sunset 2026-11-13** [V] |
| **ElevenLabs Agents** | Casc HD+B | [U] | **Yes [V]**: Flash v2.5, Multilingual v2, v3, v3 Conversational, v4 list Hindi | Flash v2.5 ~75 ms, v4 Turbo ~100 ms, v3 Conversational ~280 ms model inference [V] | Voice cloning, voice library | Proprietary | Managed | No |
| **Deepgram Voice Agent** (Flux STT + LLM + Aura) | Casc HD+B; Flux has built-in EOT | [U] | **Flux Multilingual includes Hindi** (10 languages, code-switching) [U, press + changelog] | [U] | Aura voices | Proprietary | Managed or self-host | No |
| **Sarvam** (Samvaad agents; Bulbul TTS; Saarika/Saaras STT) | Casc HD+B ("ASR → LLM → TTS loop") [V] | [U] | **Yes [V]**: 11 Indian languages + English; Bulbul `hi-IN`; mixed-language speech | "sub-500 ms" vendor claim [U] | Bulbul v3 30+ voices; v4-flash 200+ personas [V] | Proprietary (weights not open) | Managed (India-hosted) | No |
| **Cartesia** (Sonic-3.x TTS, Ink-2 STT, Line agents) | Casc HD+B | [U] | Sonic-3 42 languages; Sonic-3.6 beta "better Hinglish" [U] | Sonic "90 ms" vendor, 166-190 ms measured by a reviewer [U] | Cloning | Proprietary | Managed | No |
| **Gnani Inya VoiceOS** (5B voice-to-voice) | S2S, interruption handling claimed [U] | [U] | 15+ Indian languages incl. code-mixed [U] | "sub-second" vendor claim [U] | [U] | Research preview; no weights found [U] | Managed | No |
| **Tavus Griffin / CVI** | FD claimed | see Study A | no evidence | see Study A | video persona | Proprietary | Managed | No |

### 2.2 Open systems

| System | Duplex | BC / overlap | Hindi (evidence) | Latency (source) | Persona / voice | Licence / weights | Hosting | Azure status |
|---|---|---|---|---|---|---|---|---|
| **NVIDIA PersonaPlex-7B-v1** (2026-01-15) | **FD** (dual-stream, Moshi-based) | IndicFDB English BC freq 0.091/s, JSD 0.799 [V] | **No. English only [V]** ("English speech response for English speech input"); IndicFDB lists it English-only, no Hindi row [V] | FDB smooth turn-taking 0.170, interruption 0.240 [V]; IndicFDB English 0.360 s [V] | **Text role prompt + voice prompt (audio tokens)** [V] | NVIDIA Open Model License, "ready for commercial use"; gated [V] | 7B (Hub shows 8B); A100/H100, BF16, tested A100 80 GB [V] | Self (no Direct) |
| **Kyutai Moshi** (moshiko / moshika) | **FD** (two audio streams + inner monologue) | Barely backchannels [U, FDB via Study A] | **No. English** (model card) [V] | 160 ms theoretical, ~200 ms on L4 [V] | Two fixed voices; fine-tune via moshi-finetune [V] | Weights CC-BY 4.0; code MIT/Apache [V] | 7B; ~24 GB GPU (PyTorch), q4/q8 MLX [V] | Self |
| **Kyutai Unmute** | Casc HD+B (STT with end-of-speech detection → any LLM → streaming TTS) | none | **No**: Kyutai STT 1B en/fr, 2.6B en [V] | TTS ~750 ms on one L40S, ~450 ms on separate GPUs [V] | Voice repository [V] | MIT code; STT weights CC-BY 4.0 [V] | ≥16 GB GPU [V] | Self |
| **Kyutai Hibiki / Hibiki-Zero** | Simultaneous S2S translation | n/a | **No**: Hibiki-Zero fr/es/pt/de → en [V]; Hibiki fr → en [U] | 12.5 Hz streaming; ~3x RT on H100 [V] | n/a | Hibiki-Zero CC BY-NC-SA 4.0 (non-commercial) [V] | ~3B [V] | Self (licence blocks product use) |
| **Josh Talks Human-1** (Hindi) | **FD** (Moshi + Hindi tokenizer) | Best Hindi BC timing on IndicFDB (JSD 0.795, 0.110/s) [V] | **Yes, Hindi** (26k h, 14,695 speakers) [V] | IndicFDB Hindi 2.021 s turn; interruption rating **0.564/5** [V] | Prompted continuation | Paper CC BY 4.0; weights not confirmed [V] | ~7B (Moshi) [U] | Self if released |
| **Sesame CSM-1B** | Comp (contextual TTS); not duplex | n/a | **No**: "Primarily English ... likely won't do well" [V] | ~150 ms first frame on H100 [U] | Speaker IDs + audio context; not a cloning tool [V] | Apache-2.0, gated [V] | Hub shows 2B params (named 1B) [V] | Self |
| **Standard Intelligence hertz-dev** | **FD** base model (audio-only) | Overlap handled as a two-speaker base model [V] | no evidence | 120 ms on one RTX 4090; 62.5-80 ms theoretical [V] | Base model (continuation) | Apache-2.0 (repo) [V] | 8.5B [V] | Self |
| **Freeze-Omni** (Tencent/NWPU) | FD-ish (chunk-state head predicts interrupts) [V] | interrupt states [V] | no evidence (English/Chinese demos) [U] | none in README [V] | fixed voice | License.txt (type not stated) [V] | Frozen Qwen2-7B [V] | Self |
| **MiniCPM-o 4.5** | **FD** (continuous audio and video in; speaks; proactive ~1/s) [V] | not documented | **No**: speech English and Chinese only [V] | TTFT 0.6 s [V] | **Voice cloning from a short clip** [V] | Apache-2.0 [V] | 9B (Qwen3-8B); 19 GB bf16, 11 GB int4; full-duplex via llama.cpp-omni on ≥12 GB Nvidia [V] | Self |
| **MiniCPM-o 2.6** | HD+B (live streaming) [U] | [U] | **No** (en/zh) [U] | [U] | cloning [U] | Apache-2.0 [U] | 8B [U] | Self |
| **Qwen2.5-Omni-7B** | HD streaming (Thinker-Talker) | no | no evidence (no language list) [V] | none stated [V] | 2 voices (Chelsie, Ethan) [V] | Apache-2.0 [V] | ~11B on Hub; 31 GB bf16 for 15 s video [V] | Self |
| **Qwen3-Omni-30B-A3B** | HD streaming, "natural turn-taking" [V] | not stated | **No**: speech in 19 languages incl. Urdu, not Hindi; speech out 10, no Hindi [V] | not stated [V] | 3 voices [V] | Apache-2.0 [V] | 35B on Hub (MoE); ~79 GB bf16 [V] | Self (not in sold-by-Azure list [V]) |
| **Qwen3.5-Omni** (2026-03-30) | S2S API with "semantic interruption" [U] | [U] | 113 recognition languages/dialects, 36 output [U]; Hindi not confirmed | [U] | [U] | API only, weights not open [U] | Alibaba Cloud | No |
| **GLM-4-Voice** | HD streaming | no | **No**: Chinese and English [V] | speech after ~20 tokens [V] | instructable emotion/speed [U] | Code Apache-2.0; weights separate licence [V] | 9B [V] | Self |
| **LLaMA-Omni2** | HD streaming | no | **No**: English; Bilingual variants en/zh [V] | not stated [V] | single voice | **Research only**; commercial licence by request [V] | 0.5-32B [V] | Self (licence blocks) |
| **VITA-1.5** | HD + VAD demo | no | **No**: English and Chinese [V] | ~1.5 s end-to-end [V] | single voice | License.txt (not stated) [V] | Qwen2.5-7B based [V] | Self |
| **VITA-Audio** | HD | no | no evidence (zh/en examples) [V] | first audio chunk 53 ms (from 236 ms) [V] | single voice | not stated [V] | 7B [V] | Self |
| **Step-Audio 2 mini** | HD | no | **No** (en/zh tags) [V] | not stated [V] | [U] | Apache-2.0 [V] | 8B [V] | Self |
| **Kimi-Audio-7B** | HD S2S | no | **No** evidence (en/zh benchmarks) [V] | not stated [V] | single voice | MIT + Apache (Qwen-derived) [V] | 7B [V] | Self |
| **SALMONN-omni** | **FD**, codec-free, "dynamic thinking" [V] | Claims BC, echo cancellation, context-dependent barge-in [V] | no evidence [V] | not stated | n/a | Weights not confirmed [V] | [U] | Self if released |
| **OmniFlatten** (Alibaba) | **FD** (flattened streams) [V] | Claims BC and overlap [V] | no evidence | [U] | n/a | No weights mentioned [V] | [U] | No |
| **SyncLLM** (Meta/UW) | **FD** (time-synchronous LLM) [V] | overlap + BC [V] | no evidence | Works under ≤240 ms network latency [V] | n/a | No code/weights link [V] | Llama3-8B [V] | No |
| **dGSLM** (Meta, 2022) | **FD** (two-tower, textless) | BC + overlap learned from Fisher [U] | No (English Fisher) [U] | n/a | n/a | fairseq release [U] | [U] | Self |
| **NemotronLabs VoiceChat** (2026-09) | **FD** with tool calls and user-transcript branch [V] | Resumes after BC 93% (FDB 1.5) [V] | not stated [V] | not stated [V] | n/a | "Open"; licence not stated [V] | [U] | Self if released |
| **Ultravox v0.5-0.7** | Comp (audio-in, text-out) [V] | n/a | "42 languages" tag; Hindi not named [V] → [U] | TTFT ~150 ms on A100-40GB (8B) [V] | n/a | MIT (8B card) [V] | 8B / 70B [V] | Self |
| **Microsoft Phi-4-multimodal** | Comp (audio-in, text-out) [V] | n/a | **No**: audio languages exclude Hindi [V] | n/a | n/a | MIT [V] | 5.6B [V] | Voice Live `phi4-mm-realtime` = Direct [V]; raw weights not in sold-by-Azure table [V] |
| **Sarvam Shuka v1** | Comp (audio-in, text-out) [V] | n/a | **Yes**: fine-tuned en + hi; zero-shot 11 Indic [V] | n/a | n/a | Llama 3 licence [V] | Saaras v1 encoder + Llama3-8B [V] | Self |
| **AI4Bharat IndicConformer-600M** | Comp (ASR) | n/a | **Yes**: 22 languages [V]; Indic-Transcribe (25) now recommended [V] | not stated | n/a | MIT [V] | 600M; CTC+RNNT [V] | Self (CPU feasibility [U]) |
| **AI4Bharat IndicF5** | Comp (TTS, cloning) | n/a | **Yes**: 11 languages incl. Hindi [V] | not stated | Reference-audio cloning (permission required) [V] | MIT [V] | 0.4B [V] | Self |
| **AI4Bharat Indic Parler-TTS** | Comp (TTS) | n/a | **Yes**: 21 languages; Hindi speakers Rohit, Divya, Aman, Rani [V] | not stated | **Text-description voice control** [V] | Apache-2.0 [V] | ~0.9B [V] | Self |
| **Indic-Speak** (Bodhan AI / AI4Bharat) | Comp (TTS) | n/a | 22 Indian languages + English [U] | [U] | [U] | "Indic Open Model License"; hosting for third parties needs approval [U] | Llama-3.2-3B base [U] | Self (licence risk) |
| **Pipecat Smart Turn v3.x** | Comp (audio end-of-turn) | n/a | **Yes**: Hindi 93.44% on 1,295 test samples (FP 4.40%, FN 2.16%) [V] | 12.6 ms (c7a.2xlarge) to 94.8 ms (t3.medium) CPU [V] | n/a | BSD-2-Clause [V] | 8M params, 8 MB int8 [V] | **Runs on ACA CPU today** |
| **LiveKit turn detector** | Comp | n/a | Text model Hindi TPR 99.4 / TNR 96.3; audio model lists Hindi [V] | text 50-160 ms CPU [V] | n/a | LiveKit Model License [V] | Qwen2.5-0.5B (text, deprecated) [V] | Licence ties it to LiveKit [U] |
| **VAP** (Ekstedt) | Comp (stereo turn projection) | Predicts BC/shift [U] | No: trained on Switchboard, Fisher, Candor [V] | not stated | n/a | MIT [V] | small CPC + transformer [V] | CPU-feasible [U] |

---

## 3. Per-system notes

### 3.1 Azure (what Taxila may call)

**Azure AI Voice Live** [V, overview, how-to and language pages dated 2026-09-24 to 2026-10-08].
- **What it is.** A managed WebSocket/WebRTC speech-to-speech API, compatible with the Azure OpenAI Realtime events.
  It hosts native audio models (gpt-realtime family, azure-realtime, phi4-mm-realtime). It can also run a managed
  cascade: Azure STT, then any listed text model (gpt-4.1, gpt-5.x, gpt-5.6-terra/luna, BYOM gpt-5.5), then Azure
  TTS. Foundry agents also work.
- **Echo and noise.**
  - `input_audio_echo_cancellation: server_echo_cancellation` is "used when the model's voice is played back to the
    end-user through a speaker". By default the service uses its own output as the reference.
  - Quality degrades if the client delays playback by more than 2 s.
  - **Live-Reference AEC** (API 2026-07-15) takes stereo PCM16 from the client: mic on channel 0, actual playback on
    channel 1. It is the right mode for a phone loudspeaker with client-side buffering.
  - `azure_deep_noise_suppression` is optimised for the speaker nearest the mic.
- **Turn detection.**
  - Types: `server_vad`, `semantic_vad` (gpt-realtime only), `azure_semantic_vad`, `azure_semantic_vad_multilingual`.
  - The multilingual type lists "English, Spanish, French, Italian, German (DE), Japanese, Portuguese, Chinese,
    Korean, Hindi".
  - Defaults: `silence_duration_ms` 500; `prefix_padding_ms` 400/420 (API 2026-04-10); `interrupt_response` true;
    `auto_truncate` false.
  - `remove_filler_words` uses an **English** list (ah, umm, mm, uh, huh, oh, yeah, hmm). Hindi fillers such as
    "haan", "acha", "matlab" are not in it, so a Hinglish "haan" may trigger barge-in [E].
  - An `end_of_utterance_detection` model (`semantic_detection_v1`, with a multilingual variant in the SDKs) exists.
    Its language list was not found [U].
- **Language support (input).**
  - The default multilingual model lists 15 locales, including **hi-IN and en-IN**.
  - Up to 10 explicit locales are allowed (first = primary; may add latency).
  - MAI-Transcribe-2 lists Hindi plus 12 more Indic codes.
  - The gpt-realtime / gpt-realtime-mini list includes **Hindi**, Marathi, Kannada, Tamil, Nepali and Urdu (Microsoft
    says the list is OpenAI's languages under 50% WER).
  - phi4-mm-realtime: no Hindi.
- **Output.**
  - Any Azure voice: 9 hi-IN Neural voices, hi-IN Arjun on MAI-Voice-2 (HD) and MAI-Voice-2-Flash, en-IN DragonHD.
  - azure-realtime native voices `diya` and `meera` (hi-IN, bilingual) and `aarti` (en-IN).
  - Word timestamps and visemes work with Azure voices.
  - Avatars: standard, custom and photo avatars (`vasa-1`, `vasa-2` preview). Real-time avatar runs in centralindia.
- **Regions.** `centralindia` hosts azure-realtime, gpt-realtime-2.1 (Global, plus `-regional` = Regional), the
  2.1-mini, gpt-4.1 (Global) and gpt-5.x. HD voices there are processed Regional, MAI-Transcribe-2 Global.
  `mai-transcribe-2-streaming` is in southindia (Global) but not centralindia [V].
- **Pricing.** Azure retail price API, eastus2, read 2026-10-11 [V]:

  | Meter (per 1M tokens) | Pro | Standard | Lite |
  |---|---|---|---|
  | LLM text in / out | $4 / $16 (Text Output 2: $24) | $0.66 / $2.64 | $0.11 / $0.44 |
  | LLM native audio in / out | $32 / $64 | $11 / $22 | $4 / $12 |
  | Azure Speech standard audio in / out | $17 / $31 | $15 / $26 | $15 / $25 |
  | Azure Speech custom audio in / out | $40 / $55 | $39 / $50 | $38 / $50 |

  - Token rates per Microsoft: about 10 audio tokens/s in and 20/s out for Azure OpenAI models [V].
  - So gpt-realtime native costs about $0.019 per minute of child audio in and $0.077 per minute of teacher audio out
    [E].
  - Avatars, custom voice training and hosting are billed separately [V].
- **Fit for Taxila.** Code still owns the floor when we choose `create_response: false`/manual, or run the cascade
  [E]. This is the only Azure path with server AEC, an Indic semantic VAD and hi-IN voices in one session. It is
  half-duplex: no generation during child speech and no BC output.

**Azure OpenAI gpt-realtime family** [V, sold-by-Azure table 2026-10-08; region table 2026-09-03; retail API].
- GA `gpt-realtime` (2025-08-28), `gpt-realtime-mini` (2025-10-06, 2025-12-15), `gpt-realtime-1.5` (2026-02-23),
  `gpt-realtime-2` (2026-05-07) and `gpt-realtime-2.1` / `-2.1-mini` (2026-07-07; "improved silence and noise
  handling").
- Global Standard includes `southindia`.
- Pricing: gpt-realtime-2.1 audio $32 in / $64 out per 1M (Global), $35.2 / $70.4 (Data Zone); mini $10 / $20.
- **Hindi:** listed [V]. Taxila probes [M]:
  - first audio 776 ms native;
  - unhinted ASR wrote non-Devanagari script in 6/40 native clips;
  - details in `context/measurements.md` line ~430.
- Barge-in mechanics: `semantic_vad` eagerness classes and `conversation.item.truncate`. Study A's turnprobe numbers:
  stops on every onset including backchannels, 85-189 ms after onset; the semantic classifier judges only the
  fragment after the last pause [U, carried from Study A].
- Quota: Taxila's deployment is capped at 10 RPM [M, decisions.md].

**GPT-Live-1** [V, Learn concept page dated 2026-09-04; OpenAI live-conversations guide; retail API].
- **Design.** Full-duplex: "listens and generates a response at the same time". It "adapts when a user interrupts".
  The live voice model delegates to a backend (a Responses model or the app).
- **Controls.** Instructions are set at start and appendable (≤500 tokens per append). Voice, model and delegation
  mode are immutable for the session. Context is summarised automatically. There are no turn-detection knobs [V].
- **Price.** $3.00 per session-hour Global and $3.30 Data Zone (meter "Live 1", effective 2026-09-01), including
  silence and muted time; the backend is billed separately [V]. WebRTC has a 15 s minimum per session [V].
- **Languages.** "Multilingual ... no guarantee of uniform quality or parity with gpt-realtime" [V]. The OpenAI
  guide's voice table lists English and Portuguese voices [V].
- **IndicFDB Hindi** [V, 2609.31967 Table]:
  - pause success 61.59%;
  - turn-taking 91.06% at 0.181 s;
  - BC success 15.32%, JSD 0.822, 0.109/s;
  - interruption 100% at 0.322 s, rating 4.857.
  - Human Hindi reference: 0.259 s gap, 0.079 BC/s.
- **Gaps.** It is not a Voice Live model, so Voice Live AEC and noise suppression do not wrap it [V, Voice Live model
  list]. How it handles its own voice coming back through a loudspeaker is undocumented [U].
- **Fit.** The floor sits in OpenAI's weights and speech is not gated by our safety predicate (Study A §6.2). Use it
  as a benchmark arm, not a child lane.

**Azure AI Speech, MAI-Transcribe and MAI-Voice** [V, language-support page dated 2026-09-09; Voice Live language page].
- **hi-IN STT:** real-time, fast and batch; custom speech (audio + human-labelled transcripts); phrase lists.
- **hi-IN Neural voices:** Aarav, Ananya, Aarti, Arjun, Kavya, Kunal, Rehaan, Swara (styles: cheerful, empathetic,
  newscast) and Madhur.
- **MAI-Voice-2 (HD) and MAI-Voice-2-Flash:** hi-IN Arjun, with 13 emotional styles (the page renders the name as "MAI-Voice-2 1"; whether that is 2.1 or a footnote is [U]).
- **Preview and GA status** of MAI voices and transcription are tracked in decisions.md (`voice-lane-a-v1-panel-decides`).
- **Centralindia** has real-time STT, fast transcription, HD voices, MAI voices and custom voice [V].

### 3.2 Open full-duplex models

**NVIDIA PersonaPlex-7B-v1** (short row; see the separate teardown) [V, HF card; arXiv 2602.06053 abstract;
IndicFDB HTML].
- Released 2026-01-15. Built on the Moshiko weights.
- Trained on Fisher English (Parts 1-2; <10k h, 7,303 conversations) plus synthetic role data.
- Controlled by a text role prompt and a voice prompt.
- **Hindi: none.** The card says English input and English output. IndicFDB (whose authors include the PersonaPlex
  authors at NVIDIA) lists it as English-only and reports no Hindi row.
- Hardware: A100/H100, Linux, BF16. Licence: NVIDIA Open Model License, commercial use allowed.
- Study B reports risks [U, carried]: it starts speaking into digital silence in 27.5% of 5-minute runs, and it was
  the easiest model to jailbreak in DuplexJail.

**Kyutai: Moshi, Unmute, Hibiki** [V, GitHub READMEs and HF cards].
- **Moshi** is the origin of the dual-stream line (PersonaPlex, Human-1). It is English (card), 7B, CC-BY 4.0, with
  160 ms theoretical latency. Fine-tuning code is public (`moshi-finetune`), which is the path Human-1 took for Hindi.
- **Unmute** is Kyutai's own *cascade* product: semantic-VAD STT, any LLM, then streaming TTS. Its STT is en/fr only.
- **Hibiki-Zero** (ICML 2026) is speech translation from four European languages to English, under a non-commercial
  licence.
- Kyutai has published no Hindi model.

**Josh Talks Human-1** [V, arXiv 2604.23295 v3 2026-09-24; IndicFDB].
- The only Hindi full-duplex model: Moshi architecture, a Hindi tokenizer, 26,000 h of two-channel Hindi
  conversation, then 1,000 h of fine-tuning.
- Good timing (best BC JSD of all systems in Hindi).
- Content quality is not usable for a tutor: interruption rating 0.564/5, turn latency 2.0 s.
- The paper calls the system "open", but I found no weights link [V → weights U].

**hertz-dev** [V, si.inc post 2024-11-03; GitHub]. An 8.5B audio-only full-duplex *base* model, 120 ms on an RTX
4090, Apache-2.0. No language claims and no instruction following, so research use only.

**MiniCPM-o 4.5** [V, HF card].
- 9B (Qwen3-8B + Whisper-medium + CosyVoice2). Full-duplex: continuous audio and video in, proactive speech decision
  about once per second.
- Cloning from short reference audio. Apache-2.0.
- Runs on a ≥12 GB Nvidia GPU through llama.cpp-omni; int4 needs 11 GB.
- **Speech is English and Chinese only.** This is the strongest permissively licensed full-duplex base for a Hindi
  fine-tune, because its LLM (Qwen3) already reads Hindi text [E], but its speech heads have no Hindi.

**Freeze-Omni, VITA-1.5, VITA-Audio, GLM-4-Voice, LLaMA-Omni2, Step-Audio 2, Kimi-Audio, Qwen2.5/3-Omni** [V,
READMEs and cards].
- All are Chinese/English (or English-only) speech models. None lists Hindi; Qwen3-Omni lists Urdu input but not
  Hindi.
- Freeze-Omni is the only one here with an explicit interrupt head (chunk-level state prediction).
- LLaMA-Omni2 is research-only.
- Qwen3.5-Omni (March 2026) is API-only and not on Azure [U].

**SALMONN-omni, OmniFlatten, SyncLLM, dGSLM, NemotronLabs VoiceChat** [V, arXiv abstracts].
- These are research full-duplex designs.
- SALMONN-omni (codec-free, "dynamic thinking") claims backchannels, echo cancellation and context-dependent
  barge-in.
- SyncLLM tolerates 240 ms network latency.
- VoiceChat adds tool calls and a user-transcript branch.
- None states Hindi, and weights are confirmed for none of them [V].

### 3.3 Turn-taking components (useful under the Azure rule because they run on CPU)

- **Smart Turn v3** (Daily, 2025-09-11) [V]:
  - Whisper-Tiny encoder + linear head, 8M parameters, BSD-2.
  - Hindi 93.44%; Marathi 87.60%; Bengali 84.10%.
  - 12.6 ms on c7a.2xlarge and 94.8 ms on t3.medium.
  - v3.2 is current per the GitHub title; per-language numbers for v3.2 were not published there [V].
  - Study B warns that one team found v3.2 worse than a tuned 640 ms silence rule on real calls (13.5% vs 2.7%
    cut-offs, n=37 pauses) [U, carried].
- **LiveKit turn detector** [V]: an audio model (v1 hosted, v1-mini local), 14 languages including Hindi. The text
  model is deprecated. LiveKit Model License.
- **VAP** [V]: MIT, stereo-input turn projection, trained on English corpora. Needs a child/Hindi re-train.

### 3.4 Indic speech components (open)

- **AI4Bharat** [V, HF cards]:
  - IndicConformer-600M (MIT, 22 languages; superseded by Indic-Transcribe, 25 languages).
  - IndicF5 (MIT, 0.4B, 11 languages, cloning with permission).
  - Indic Parler-TTS (Apache-2.0, ~0.9B, 21 languages, voice by text description; Hindi speakers Rohit and Divya
    recommended).
  - Indic-Speak (22 languages) is now recommended over both TTS models. Its licence restricts third-party hosting [U].
- **Sarvam** [V]: Shuka v1 (Saaras v1 encoder + Llama3-8B; English + Hindi tuned; audio in, text out; Llama 3
  licence). Bulbul and Saarika/Saaras are API-only. Sarvam's Feb-Mar 2026 open releases were LLMs (30B, 105B) [U].
- **No open Hindi speech-to-speech or full-duplex model with commercial weights was found** as of 2026-10-11.
  - Human-1: weights unconfirmed.
  - Gnani Inya VoiceOS: research preview, no weights found [U].
  - A hackathon Hindi fine-tune of Qwen3-Omni exists [U].

### 3.5 Commercial, non-Azure (cite only)

- **Gemini 3.8 Live** [V, live guide updated 2026-09-18]:
  - `hi` among 99 languages; automatic VAD (default silence ~800 ms) or manual activity signals.
  - Barge-in cancels generation. Proactive audio and affective dialog are opt-in.
  - 15-minute audio session cap.
  - IndicFDB Hindi: patient (pause S.R. 100%) but slow (1.40 s) and almost never backchannels (0.010/s) [V].
- **Nova 2 Sonic** [V]: Hindi and en-IN with polyglot voices; 8-minute connection limit.
- **Hume EVI 4-mini** [V]: Hindi; the service sunsets 2026-11-13.
- **ElevenLabs** [V]: Hindi across its TTS models; Agents use Flash v2.5 or v4 Turbo.
- **Deepgram Flux Multilingual** [U]: Hindi among 10 languages, with code-switching and built-in end-of-turn.
- **Sarvam Samvaad** [V]: ASR → LLM → TTS, self-hosted in India, 11 Indian languages + English, mixed-language
  speech; latency claims unverified.
- **Cartesia, Gnani, Grok Voice** [U]: see table.

---

## 4. What is available to Taxila TODAY (Azure Direct, no GPU) versus after GPU quota

### 4.1 Today: Azure Direct, CPU only

| Capability | Option | Hindi / Hinglish | Duplex class | Notes |
|---|---|---|---|---|
| Managed S2S with server AEC + noise suppression | **Voice Live**, centralindia | Yes (multilingual STT hi-IN/en-IN; Indic semantic VAD; hi-IN voices) [V] | HD+B | Live-Reference AEC for loudspeaker playback paths [V]; Hindi fillers not in the barge-in filter [V] |
| Native S2S brain | gpt-realtime-2.1 / -mini (direct or in Voice Live), azure-realtime | Listed [V]; diya/meera voices [V] | HD+B | gpt-realtime-2.1-regional keeps processing in India [V]; 10 RPM quota on Taxila's deployment [M] |
| True full-duplex | **GPT-Live-1** | Unproven: IndicFDB Hindi 38% pause takeovers [V] | FD | $3/h; no gated speech; no Voice Live AEC wrapper [V/E]; benchmark arm only |
| Cascade parts | Azure Speech hi-IN STT, MAI-Transcribe-2 (preview), gpt-live-transcribe, DragonHD/Neural/MAI voices | Yes [V] | Casc | Taxila's current lane design (decisions.md D4, voice-choice-v2) |
| Turn model | Smart Turn v3 (ACA CPU) | Hindi 93.44% (adult test set) [V] | Comp | Child accuracy unmeasured; ship only behind E1 |
| Open S2S / FD models | none | n/a | n/a | Every open duplex model needs a GPU (PersonaPlex A100/H100; Moshi ~24 GB; MiniCPM-o ≥12 GB) [V] |

**Reading.** For a Hinglish child on a phone loudspeaker today, the realistic stack is:
1. Voice Live in centralindia, for its AEC and noise suppression;
2. `azure_semantic_vad_multilingual` with Hindi, plus our own CPU end-of-turn and floor logic;
3. either the cascade (Azure STT → our router brain → hi-IN/en-IN Azure voice) or gpt-realtime-2.1-regional native.

Taxila's code should own interruption and backchannels; Voice Live provides none of them as model output. [E]

### 4.2 After GPU quota lands

1. **PersonaPlex or Moshi re-trained for Hindi** (Human-1 recipe).
   - Needs 10k-26k h of two-channel Hindi conversation [V, Human-1], ideally with child speech.
   - Taxila has no such corpus; E1 two-channel recordings would be the seed [E].
   - Expect Human-1-like timing and Human-1-like content weakness (0.564/5) unless the model delegates to a text
     brain, as NVIDIA's frontend-backend and VoiceChat designs do [V].
   - Licences allow it: CC-BY 4.0 (Moshi) and the NVIDIA Open Model License (PersonaPlex).
2. **MiniCPM-o 4.5 + Hindi speech fine-tune.** Apache-2.0, full-duplex, cloning, runs on one ≥12 GB GPU.
   Speech is en/zh today, so Hindi needs paired speech data.
3. **Open Indic cascade** (no duplex model): IndicConformer / Indic-Transcribe (MIT) + Indic Parler-TTS (Apache) or
   IndicF5 (MIT), with a duplex controller. This only adds value over Azure Speech if blind panels and E1 say so.
4. **Not candidates:**
   - Hibiki-Zero, LLaMA-Omni2: non-commercial or research licences.
   - Qwen3-Omni, GLM-4-Voice, Step-Audio 2, Kimi-Audio, VITA: no Hindi speech.
   - Sesame CSM: English TTS only.
   - hertz-dev: base model, no instruction following.

**Bottom line.** No system serves Hinglish children with true full duplex inside the Azure-only rule today except
GPT-Live-1. Its Hindi pause-takeover rate and model-owned floor make it unsafe as the child lane. Voice Live plus
Taxila's own floor controller is the shippable path. Open full duplex for Hindi is a data problem first and a GPU
problem second.

---

## 5. Sources (all accessed 2026-10-11 unless noted; page dates in parentheses where shown)

**Azure / Microsoft**
- Voice Live overview (ms.date 2026-10-08) [V]: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live
- Voice Live how-to (2026-10-08) [V]: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to
- Voice Live language support (2026-09-24) [V]: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-language-support
- Speech regions incl. Voice Live tab (2026-10-08) [V]: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions?tabs=voice-live
- Speech language and voice support (2026-09-09) [V]: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
- Foundry Models sold by Azure (updated 2026-10-08) [V]: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure
- Region availability for Foundry Models sold by Azure (2026-09-03) [V]: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability
- What is GPT-Live? (2026-09-04, updated 2026-09-30) [V]: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/gpt-live
- Azure retail prices API (Voice Live, gpt-realtime, Live 1 meters; eastus2) [V]: https://prices.azure.com/api/retail/prices
- Azure Speech pricing page (prices render client-side; not readable by fetch) [U]: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/
- Phi-4-multimodal-instruct card [V]: https://huggingface.co/microsoft/Phi-4-multimodal-instruct

**OpenAI**
- gpt-realtime-2.1 model page [V]: https://developers.openai.com/api/docs/models/gpt-realtime-2.1
- GPT-Live live conversations guide [V]: https://developers.openai.com/api/docs/guides/live-conversations

**Benchmarks and papers**
- IndicFDB, arXiv 2609.31967 (2026-09-25) [V]: https://arxiv.org/abs/2609.31967 and https://arxiv.org/html/2609.31967
- Human-1, arXiv 2604.23295 (v3 2026-09-24) [V]: https://arxiv.org/abs/2604.23295
- PersonaPlex, arXiv 2602.06053 (2026-01-14) [V]: https://arxiv.org/abs/2602.06053
- NemotronLabs VoiceChat, arXiv 2609.21967 (2026-09-18, v2 2026-10-01) [V]: https://arxiv.org/abs/2609.21967
- SALMONN-omni, arXiv 2505.17060 (2025-05-17) [V]: https://arxiv.org/abs/2505.17060
- SyncLLM, arXiv 2409.15594 (2024-09-23) [V]: https://arxiv.org/abs/2409.15594
- OmniFlatten, arXiv 2410.17799 (2024-10-23) [V]: https://arxiv.org/abs/2410.17799
- Freeze-Omni, arXiv 2411.00774 (2024-11) [V]: https://arxiv.org/abs/2411.00774
- Hibiki-Zero, arXiv 2602.11072 (2026-02) [U, search]: https://arxiv.org/abs/2602.11072
- Taxila Study A / Study B (2026-10-04) [U where carried]: `../duplex/PRODUCTS.md`, `../duplex/MODELS-PAPERS.md`

**Open model cards and repos**
- PersonaPlex-7B-v1 [V]: https://huggingface.co/nvidia/personaplex-7b-v1
- Moshi repo [V]: https://github.com/kyutai-labs/moshi ; Moshiko card [V]: https://huggingface.co/kyutai/moshiko-pytorch-bf16
- Unmute [V]: https://github.com/kyutai-labs/unmute ; Kyutai DSM (STT/TTS) [V]: https://github.com/kyutai-labs/delayed-streams-modeling
- Hibiki-Zero card [V]: https://huggingface.co/kyutai/hibiki-zero-3b-pytorch-bf16
- Sesame CSM-1B [V]: https://huggingface.co/sesame/csm-1b
- hertz-dev [V]: https://si.inc/posts/hertz-dev/ and https://github.com/Standard-Intelligence/hertz-dev
- Freeze-Omni [V]: https://github.com/VITA-MLLM/Freeze-Omni
- MiniCPM-o 4.5 [V]: https://huggingface.co/openbmb/MiniCPM-o-4_5
- Qwen2.5-Omni-7B [V]: https://huggingface.co/Qwen/Qwen2.5-Omni-7B ; Qwen3-Omni [V]: https://huggingface.co/Qwen/Qwen3-Omni-30B-A3B-Instruct
- Qwen3.5-Omni (secondary, 2026-03-31) [U]: https://rits.shanghai.nyu.edu/ai/qwen3-5-omni-alibabas-omnimodal-ai-speaks-36-languages-and-codes-from-voice
- GLM-4-Voice [V]: https://github.com/THUDM/GLM-4-Voice
- LLaMA-Omni2 [V]: https://github.com/ictnlp/LLaMA-Omni2
- VITA / VITA-1.5 [V]: https://github.com/VITA-MLLM/VITA ; VITA-Audio [V]: https://github.com/VITA-MLLM/VITA-Audio
- Step-Audio 2 [V]: https://github.com/stepfun-ai/Step-Audio2 ; mini card [V]: https://huggingface.co/stepfun-ai/Step-Audio-2-mini
- Kimi-Audio [V]: https://github.com/MoonshotAI/Kimi-Audio
- SALMONN repo [V]: https://github.com/bytedance/SALMONN
- Ultravox [V]: https://github.com/fixie-ai/ultravox ; v0.5 8B card [V]: https://huggingface.co/fixie-ai/ultravox-v0_5-llama-3_1-8b
- Smart Turn [V]: https://github.com/pipecat-ai/smart-turn ; https://huggingface.co/pipecat-ai/smart-turn-v3 ; Daily blog (2025-09-11): https://www.daily.co/blog/announcing-smart-turn-v3-with-cpu-inference-in-just-12ms/
- LiveKit turn detector [V]: https://docs.livekit.io/agents/build/turns/turn-detector/
- VAP [V]: https://github.com/ErikEkstedt/VoiceActivityProjection
- Sarvam Shuka v1 [V]: https://huggingface.co/sarvamai/shuka_v1
- AI4Bharat IndicConformer [V]: https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual ; IndicF5 [V]: https://huggingface.co/ai4bharat/IndicF5 ; Indic Parler-TTS [V]: https://huggingface.co/ai4bharat/indic-parler-tts
- Indic-Speak (community MLX conversion page) [U]: https://huggingface.co/iniquitous/indic-speak-mlx-bf16

**Commercial (non-Azure)**
- Gemini Live guide (2026-09-18) [V]: https://ai.google.dev/gemini-api/docs/live-guide
- Nova 2 Sonic [V]: https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html
- Hume EVI overview (sunset notice) [V]: https://dev.hume.ai/docs/speech-to-speech-evi/overview
- ElevenLabs models [V]: https://elevenlabs.io/docs/overview/models
- Deepgram Flux Multilingual (2026-04) [U]: https://developers.deepgram.com/changelog/2026/4/15 ; https://siliconangle.com/2026/04/29/deepgram-expands-flux-10-languages-mid-call-switching-voice-agents/
- Sarvam TTS API [V]: https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert ; Sarvam conversations overview [V]: https://docs.sarvam.ai/conversations/overview
- Cartesia (secondary) [U]: https://www.runtimewire.com/article/cartesia-sonic-35-ink-2-voice-agent-benchmarks ; https://invideo.io/blog/cartesia-sonic-ai-voice/
- Gnani Inya VoiceOS (2026-02) [U]: https://www.digit.in/news/general/india-ai-impact-summit-2026-gnani-ai-unveils-indias-first-5b-voice-to-voice-ai-model-inya-voiceos.html
- xAI Grok Voice Agent API [U]: https://x.ai/news/grok-voice-agent-api

**Taxila internal**
- `context/measurements.md` (voices-hindi first-audio numbers; realtime bake-offs) [M]
- `context/decisions.md` (0 GPU quota in 17 regions; realtime 10 RPM; lane decisions) [M]
