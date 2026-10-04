# STT v3 scan: open-weight Hindi/Hinglish STT for an always-on child session (2026-10-04)

This is a desk scan. It used web and Hugging Face sources, plus read-only AWS and Azure price and quota pulls. **No model
was run.** The bench comes next (§7). This scan follows:
- `../v2/stt-hinglish.md` (v2: Azure arms, n = 180 synthetic clips);
- `../../../../evals/model-refresh-2026-10-04/stt/` (refresh: MAI-Transcribe-2, gpt-transcribe, rt-whisper);
- `context/rejected.md` (`rj-aws-transcribe-all-modes`, `gpt-transcribe-fabricates-nonspeech`,
  `mai-transcribe-15-hallucinates-silence`, `mai-stream-refuses-context`, `gpt-realtime-whisper-no-context`).

Tags:
- **[M]** measured in this repo (path given);
- **[V]** vendor model card, paper or price API, read 2026-10-04;
- **[S]** secondary source (press, blog);
- **[U]** our inference or estimate, not measured.

Every WER below is the vendor's own number on adult or crowd-sourced speech. **None of these models publishes a
child-speech result.** E1 (real children) is still the gate.

---

## 0. Bottom line

1. **What the owner directive changes.** The child is heard for the whole session, so STT is billed per session-hour,
   not per speech-minute. MODEL-STACK §275's lever 1 was "stop streaming the whole lesson". That lever is now off the
   table.
   - At API prices a session-hour costs about **$1.02** (gpt-live-transcribe [V]) or **$1.30** (Azure Speech real-time
     plus LID [V]).
   - MAI-Transcribe-2-Streaming is still **unmetered**.
2. **Self-hosting an open streaming transducer costs about $0.01-0.02 per session-hour at realistic concurrency.**
   That is 50-100× below the API [U, arithmetic §5]. The catch is a fixed floor: two warm GPUs, because a live lane
   cannot scale to zero (cold start 161 s, inherited). That floor is about **$1.2-1.6/h ≈ $850-1,200/month**, so
   self-hosting pays once average concurrency passes about **1.5 sessions**.
3. **The architecture class matters more than the brand.**
   - CTC and RNNT/TDT transducers (Nemotron, IndicConformer, SraVaani) emit *blanks* on silence. They cannot write
     a fluent sentence out of nothing.
   - LLM-decoder models (Whisper and its fine-tunes such as Zero STT, Voxtral, Qwen3-ASR, MAI-1.5, gpt-transcribe)
     *can*. Every fabrication rejection in `rejected.md` comes from this class [M].
   - For an always-on mic, which hears TV, siblings and fans for most of the hour, this is the deciding structural
     prior [U]. LLM-decoder arms must therefore pass a non-speech probe with **n ≥ 30** before any further step.
4. **Sarvam: reference-only under the directive.**
   - Saaras v4 (2026-09-25) is API-only and its weights are not public [S].
   - Saaras v3 can run in our own AWS account only as an encrypted SageMaker Marketplace model package. The fee is a
     **$5,000/month** contract plus instance cost [S, AWS Marketplace listing]. The weights are not ours, and the
     package cannot be fine-tuned on child audio.
   - Its API (about ₹30/h ≈ $0.35/h [S]) can serve as a measured *reference ceiling* if the owner wants one.
5. **Shunya Labs: one candidate, two exclusions.**
   - **Zero STT Hinglish is open** (Whisper-medium post-train, OpenRAIL, 0.8B). It is the only model found that
     writes Hindi in Devanagari and English in Latin, our reference convention [V, card samples]. It has no WER
     claim, no streaming support, and carries Whisper's silence risk. Bench it.
   - **Pingala V1 is excluded.** Its RAIL-M licence forbids derivatives (no child fine-tune) and requires a paid
     commercial licence. Its Hindi WER on Vaani is 22.1 [V].
   - The faster commercial "Zero STT Codeswitch" is API-only.
6. **The new strongest open candidate is `nvidia/nemotron-3.5-asr-streaming-0.6b`** (2026-09-10):
   - cache-aware FastConformer-RNNT, 600M parameters;
   - Hindi in Tier 1, with FLEURS hi WER **6.81** at a 1.12 s chunk and **8.13** at 80 ms (language given) [V];
   - about 2,400 streams per H100 at a 1.12 s chunk and 240 at 80 ms [V];
   - OpenMDW-1.1 licence, commercial use permitted [V].

   Unknowns: no Indian training corpus is listed, Indian English is not a listed locale, and nothing about
   code-switch output is documented.
7. **Where to host.**
   - **Azure first.** A Central India `NC4as_T4_v3` costs $0.579/h on demand. An ACA serverless T4 costs about
     $0.37/h for the GPU meter, or $0.53-0.60/h in total (inherited) [V]. Both are in-country.
   - **AWS is viable.** A g6.xlarge (L4) costs $0.80/h on demand in us-east-1 and $0.97/h in ap-south-1. But the
     **ap-south-1 G/VT quota is 0 (both on-demand and spot)** [M, Service Quotas, 2026-10-04]. AWS Mumbai cannot host
     until a quota request clears. us-east-1 adds about 200 ms of India RTT [M, `rtt-2026-10-04.json`: centralindia
     251 ms vs eastus2 51 ms from the US container].
8. **"Human-like voice features and emotion" is not an STT output.**
   - No candidate here returns prosody or affect. Saaras v4's five output modes are all text [S].
   - The same always-on stream can feed a separate paralinguistic lane: on-device pause and energy features, which
     v2 §2.6 already recommends.
   - See `../emotion-attunement.md` for that design. It is out of scope here.

**Bench these 6 (ranked):** see §6. Nemotron-3.5 streaming; SraVaani-0.5-live with SraVaani-1.0 as a second pass;
IndicConformer-600M; Voxtral-Mini-4B-Realtime; Zero STT Hinglish; Qwen3-ASR-1.7B.

---

## 1. What "always-on" requires of an STT engine

| requirement | why | what it rules out |
|---|---|---|
| Streaming partials within ~0.5 s of speech onset | A child can interrupt or ask mid-turn. MAI-2-Streaming's first partial at **2.6 s** [M, MODEL-STACK §1.2] is already flagged as a barge-in risk | Whisper-class models without a streaming wrapper. With VAD gating and 1 Hz re-decode they give partials about every 1 s [U] |
| No text from non-speech, hour after hour | The mic is open about 60 min per session, and most of that is not the child | Any arm with output on more than 0 of n ≥ 30 non-speech clips (the law behind `gpt-transcribe-fabricates-nonspeech`) |
| Hindi in Devanagari plus English terms, or a script we can normalise | The grader string-matches, and werRaw measures this | Roman-only models (Oriserve Hinglish) unless we add a transliteration layer |
| Numbers survive, with no answer biasing | numSeq is the strictest metric. Answer values never go into bias lists (v2 review R2) | — |
| Cost scales with session-hours | Owner directive | At API prices, $1.02-1.30 per session-hour |
| Commercial licence on weights **and** fine-tune data | We will want to fine-tune on E1 child audio | CC BY-NC weights (MMS-1b-all, indic-seamless), no-derivative licences (Pingala), and NC data (HiACC, already flagged) |

---

## 2. Candidate table (open weights, self-hostable)

Revisions are the HF `sha` read from `https://huggingface.co/api/models/<id>` on 2026-10-04 [V]. "Gated auto" means
the files are behind an automatically approved terms click, so the bench account must accept it once.

| # | model (HF id @ revision) | arch / params | licence (commercial?) | streaming / partial latency | GPU fit | published Hindi WER [V unless marked] | code-switch output | noise / child notes |
|---|---|---|---|---|---|---|---|---|
| A | `nvidia/nemotron-3.5-asr-streaming-0.6b` @ `ea30d66debe3740a08b573244286791d423d6b3e` (2026-09-10) | cache-aware FastConformer-RNNT, 24 layers, 0.6B, language-ID prompt | OpenMDW-1.1, "ready for commercial use" (yes) | **native**: 80, 160, 320, 560 or 1,120 ms chunks, non-overlapping. Partial ≈ chunk + compute | T4/L4 easily (0.6B). H100: ~2,400 streams at 1.12 s, ~240 at 80 ms | FLEURS hi (language given): 8.13 at 80 ms, 7.41 at 320 ms, 6.81 at 1.12 s. Auto-LID: 11.47 down to 8.23 | Not documented. With `hi-IN`, English terms are likely written in Devanagari. `auto` appends an `<xx-XX>` tag per utterance [U] | No Indian data listed (Riva proprietary, Granary, CV, FLEURS). en-IN is not a locale. Punctuation built in. Hinglish fine-tune exists (row A′) |
| A′ | `addyo07/nemotron-3.5-0.6b-hinglish` @ `276471451a8214e690a4c7061ad14a3bd727bb3f` | A fine-tuned, streaming kept (320 ms) | Apache-2.0, but **data licence unstated** | as A | as A | Claims conversational Hinglish 42.2 → 24.6, clean Hindi 24.75 (worse) | Hinglish (script unstated) | Research arm only until its data provenance is known |
| B | `ARTPARK-IISc/SraVaani-0.5-live` @ `29a15303a55673367134eee9e1d18cb1a2dcaabf` (2026-08-01, gated auto) | cache-aware FastConformer + CTC, 17 layers, ~430M | MIT (yes) | **native**, lookahead switchable at runtime: 0, 80, 480 or 1,040 ms | "Real-time-safe on CPU, >60× RT on one GPU" | Hindi 22.1 (0 ms) to 18.0 (1,040 ms), benchmark mix of Vaani, Kathbath, FLEURS etc. | Multi-script Indic + Latin BPE; "may write borrowed English words in Latin" | Vaani is phone-recorded crowd speech from many districts, so likely noise-robust [U]. No child data stated |
| B′ | `ARTPARK-IISc/SraVaani-1.0` @ `f5dd5358325a5208775b91dad98918e079ea2b27` (2026-09-02, gated auto) | FastConformer + hybrid TDT-CTC, 17 layers (offline) | HF metadata says MIT; the paper (arXiv 2608.08235) says CC BY 4.0. Both are commercial-OK | offline, so VAD-gated finals | small | Hindi mean **14.0** over 8 test sets (51.6 h); card says 12.4. Indic mean 28.4 vs Saaras v3 33.9 and IndicConformer 30.2 | as B | 30.6k h fine-tune over 24 public sets. **Check each set's licence before fine-tuning** |
| C | `ai4bharat/indic-conformer-600m-multilingual` @ `e9b71b369c048e2c6b634d4c131061c34e441179` (2026-02-07, gated auto) | Conformer, hybrid CTC + RNNT, 600M, 22 languages | MIT (yes) | not cache-aware. RNNT can be chunked; else VAD-gated with re-decoded partials | small; ONNX available | Vaani-Benchmark hi **13.2** | Per-language Devanagari vocabulary: English terms come out in Devanagari [U] | IndicVoices-style extempore and conversational data; no child data stated. Hindi-only large variant: `ai4bharat/indicconformer_stt_hi_hybrid_ctc_rnnt_large` @ `deada84ce880997c56ee933aa21571d768264700` (MIT) |
| D | `mistralai/Voxtral-Mini-4B-Realtime-2602` @ `2769294da9567371363522aac9bbcfdd19447add` (2026-03-11) | 970M causal audio encoder + 3.4B LM, sliding-window attention ("infinite" streaming) | Apache-2.0 (yes) | **native**, delay 80-1,200 ms in steps of 80, or 2,400. 480 ms recommended. vLLM Realtime websocket only | ≥ 16 GB (bf16), so L4 or L40S, not T4 | FLEURS hi: 15.28 at 160 ms, 12.88 at 480 ms, 11.82 at 960 ms, 10.73 at 2.4 s | LM tokenizer; mixed script plausible [U] | **LLM decoder, so fabrication risk on non-speech.** Known vLLM bug: the 3rd concurrent session returns no text (vllm #35863) [V] |
| E | `shunyalabs/zero-stt-hinglish` @ `93b882ac4f1d470d910ef8e1e48d44d51a439cc6` (2025-12-12) | Whisper-medium post-train, ~0.8B | OpenRAIL (commercial OK under use restrictions; read before shipping) | none: VAD-gated, partials by re-decode (each call encodes a 30 s window) | T4/L4 (faster-whisper / CTranslate2 conversion [U]) | **none published.** Card samples show errors (जगों, बढ़े). Shunya's blog claims 11.9 Hindi WER for its commercial model, not this one [S] | **Native mixed script**: "Rome में ... television screens", our reference convention [V] | Data: Vaani, Kathbath, Shrutilipi plus proprietary. Whisper-family silence hallucination risk [U] |
| F | `Qwen/Qwen3-ASR-1.7B` @ `7278e1e70fe206f11671096ffdd38061171dd6e5` (2026-01-30); also `Qwen/Qwen3-ASR-0.6B` @ `5eb144179a02acc5e5ba31e748d22b0cf3e303b0` | audio encoder + Qwen3 LM | Apache-2.0 (yes) | streaming via vLLM only (no batch, no timestamps) | L4 | hi 12.80 on Qwen's internal News-Multilingual set (30 languages) | unknown [U] | LLM decoder: fabrication risk |
| G | IndicWhisper (AI4Bharat Vistaar; Whisper-medium per-language fine-tunes; object-store download) | Whisper-medium | MIT (yes) | none | small | hi: Kathbath 10.3, Kathbath-Hard 12.0, FLEURS 11.4, CV 15.0, IndicTTS 7.6 (2023) | Devanagari | Vividh-ASR (arXiv 2605.13087): clean-studio adaptation "overwrites the encoder's robust feature space", 66% WER on spontaneous speech (Malayalam). **Do not bench**: superseded by B′/C and studio-biased |
| H | `openai/whisper-large-v3` @ `06f233fe06e710322aca913c1bc4249a0d71fce1` (Apache-2.0); `openai/whisper-large-v3-turbo` @ `41f01f3fe87f28c78e2fbf8b568835947dd65ed9` (MIT); Hindi fine-tunes `ARTPARK-IISc/whisper-large-v3-vaani-hindi` @ `63b5cc7c…`, `vasista22/whisper-hindi-large-v2` @ `f98540ce…`, `Trelis/whisper-hinglish-preview` @ `eab1188f…` (Apache-2.0) | Whisper | yes | none | L4 | not re-verified here | v3 tends to Devanagari or Urdu script without a hint [U] | Our own measured Whisper-family service (`gpt-realtime-whisper-no-context`) lost to D4 on every metric. **Do not bench** ahead of A-F |
| I | `Oriserve/Whisper-Hindi2Hinglish-Apex` @ `f3214eed20b4e4d4144e739982d911f87b9cb223` (turbo base); `-Prime` @ `4edf7b8291f950e3ac4f32bdacb38c46800e77dc` (v3 base) | Whisper | Apache-2.0 | none | L4 | Apex: CV 35.96, FLEURS 29.79, IndicVoices 47.64 | **Roman only** ("Mehnat to poora kerte hain") | 700 h of noisy Indian audio. Fails the script requirement. **Do not bench** |
| J | Meta Omnilingual ASR (`facebook/omniASR-LLM-7B` @ `4b0bada258b398cb7e6c5b3a6ed5448fb914385b`, `facebook/omniASR-CTC-1B` @ `8c22e3ff…`; v2 checkpoints in the fairseq2 cards) | w2v + CTC or LLM, 300M-7B | Apache-2.0 (yes) | **none**: input under 40 s; the "unlimited" variant cannot be fine-tuned | 7B LLM ~17 GB; 7B CTC RTF 0.006 on A100 | Hindi number not found in sources | one script per language code [U] | Breadth model (1,600+ languages), not a Hinglish specialist. Revisit only if A-F fail |

### Excluded on licence or language (no bench)

| model | reason |
|---|---|
| `facebook/mms-1b-all` @ `3d33597e…` | CC BY-NC 4.0 |
| `ai4bharat/indic-seamless` @ `9e97fd8a…` | CC BY-NC 4.0 |
| `shunyalabs/pingala-v1-universal` @ `d7ae93c8…` (gated) | Shunya RAIL-M: no derivatives, no redistribution, paid commercial licence; free tier is up to 10,000 h/month; Vaani hi WER 22.1 |
| `nvidia/parakeet-tdt-0.6b-v3`, `nvidia/canary-1b-v2` (CC BY-4.0) | no Hindi (25 European languages) |
| `kyutai/stt-1b-en_fr`, `kyutai/stt-2.6b-en` | English and French only |
| `nvidia/canary-qwen-2.5b` | English only |
| `moorlee/qwen3-asr-0.6b-hinglish-hiacc-v1` | HiACC data is CC BY-NC (already flagged in v2 review R8) |
| NVIDIA Riva Hindi (NIM) | production needs NVIDIA AI Enterprise, a paid licence. The open checkpoint (row A) covers the same family |

---

## 3. Reference-only rows (API or closed weights; measured or vendor numbers)

| engine | status under directive | Hindi / Hinglish evidence | streaming / latency | price per session-hour (always-on) |
|---|---|---|---|---|
| **gpt-live-transcribe D4** (Azure, eastus2) | allowed, current default | cerNorm 0.028, answers 76/78, 0/12 non-speech [M] | first partial 1.4 s; final 1.29 s after speech end (US) [M] | **$1.02** [V] |
| **MAI-Transcribe-2-Streaming** (Azure, SI/CI) | allowed, India primary (Preview) | cerNorm 0.021, answers 78/78, 0/12 non-speech; refuses keywords and prompt [M] | first partial **2.6 s**; final 68 ms after commit (Chennai) [M] | **unmetered**; placeholder $0.36 [U] |
| Azure Speech real-time, LID hi/en (R4) | allowed, fallback | cerNorm 0.071, answers 74/78 [M] | final 0.88 s [M] | **$1.30** ($1.00 + $0.30 LID) [V] |
| Azure Custom Speech hi-IN (fine-tune on E1 audio) | allowed | not measured | as R4 | $1.20 + $0.054 hosting [V, v2 R8] |
| gpt-transcribe, MAI-Transcribe-1.5, gpt-4o(-mini)-transcribe | **rejected** for live/grading | fabricate text on non-speech [M] | — | — |
| Amazon Transcribe streaming | **rejected** (`rj-aws-transcribe-all-modes`) | best mode 64/78 answers; 41/180 short clips empty [M] | final 2.28 s [M] | ~$1.44 (list $0.024/min) [U, not re-pulled] |
| Sarvam Saaras v4 (2026-09-25) | reference-only (API, closed) | IndicContextEval 16.03 WER (L5 keyword prompting); LID error 5.22% (22 languages) [S] | "TTFT < 150 ms"; REST, batch, WebSocket [V blog] | not listed [V blog]. v3 API ≈ ₹30/h ≈ $0.35 [S] |
| Sarvam Saaras v3 self-hosted | reference-only (encrypted SageMaker model package; weights not ours; no fine-tune) | IndicVoices ~22 WER [S] | streaming supported [V docs] | **$5,000/month contract** + SageMaker instance [S, Marketplace] |
| Shunya Zero STT / Codeswitch (commercial) | reference-only (API) | 3.10 *English* composite (OpenASR); "11.9 Hindi" [S, own blog] | "~200 ms partials", "sub-250 ms" [S] | not published |
| Harvested: Sarvam saarika:v2.5 sync | reference only | Hinglish output ~99% Devanagari, including English [M, harvest `hp-gurukul-chain.md`] | 25 s clip → 4.1 s; hard 30 s cap; HTTP 402 on credit exhaustion [M, harvest] | — |

If the owner wants a measured ceiling, a Sarvam API reference arm on the v2 corpus would cost under $1. It is
reference-only, never production.

---

## 4. Code-switch output and the scorer

- `score.mjs` cerNorm and keyRecall are script-agnostic (consonant skeleton), so Devanagari-only output (rows A, C)
  is not penalised there.
- werRaw and our grader's string matching expect English terms in Latin. Devanagari-only engines need one of two
  fixes:
  - (a) a deterministic Devanagari→Latin back-transliteration for the lesson's own keyword list, used at match time
    only and never as recogniser bias; or
  - (b) grading on the skeleton [U].
- Measure werRaw anyway, so the cost of each option is visible.
- Row E (Zero STT) and row B (SraVaani-live) are the only candidates whose cards show mixed-script output.

---

## 5. Cost per always-on session-hour (self-hosted)

### 5.1 GPU prices pulled 2026-10-04 [V]

| host | GPU | on-demand $/h | spot $/h (by AZ) |
|---|---|---|---|
| AWS us-east-1 g4dn.xlarge | T4 16 GB | 0.526 | 0.251-0.285 |
| AWS us-east-1 g6.xlarge | L4 24 GB | 0.8048 | 0.568-0.684 |
| AWS us-east-1 g6e.xlarge | L40S 48 GB | 1.861 | 1.838 |
| AWS ap-south-1 g4dn.xlarge | T4 | 0.579 | 0.215-0.235 |
| AWS ap-south-1 g6.xlarge | L4 | 0.9664 | 0.519-0.789 |
| AWS ap-south-1 g6e.xlarge | L40S | 2.235 | 1.838-2.235 |
| Azure centralindia NC4as_T4_v3 | T4 | 0.579 | 0.164 |
| Azure eastus2 NC4as_T4_v3 | T4 | 0.526 | 0.275 |
| Azure centralindia NC24ads_A100_v4 | A100 80 GB | 5.142 | 0.950 |
| Azure centralindia NC40ads_H100_v5 | H100 | 9.772 | 4.964 |
| Azure Container Apps serverless T4 (GPU meter only) | T4 | $0.000102/s = **0.367** (+ vCPU/memory; inherited total 0.53-0.60 active) | — |

Sources:
- AWS: Pricing API and `describe_spot_price_history`.
- Azure: `prices.azure.com` retail API.
- Quotas (Service Quotas, 2026-10-04): us-east-1 G/VT on-demand **8** and spot **8** vCPU; **ap-south-1 on-demand 0
  and spot 0**.

### 5.2 Concurrency per GPU [U unless marked]

Method: take the vendor's H100 or other figure. Scale to L4 at 1/8 (FP16 dense about 121 vs 989 TFLOPS; memory
bandwidth 300 vs 3,350 GB/s ≈ 1/11) and to T4 at 1/15. **Then halve for headroom**: p99 latency, feature
extraction, bursts and a VAD side-car. These are planning numbers; the load test in §7 replaces them.

- **A Nemotron-3.5 at a 560 ms chunk.** The vendor gives 240 streams at 80 ms and 2,400 at 1.12 s, i.e. about linear
  in chunk frames (≈171 per frame). At 7 frames that is about 1,200 per H100, taken conservatively.
  - L4: 1,200 / 8 = 150, halved → **75**.
  - T4: 1,200 / 15 = 80, halved → **40**.
  - At a 160 ms chunk (2 frames): about 480 per H100, so L4 ≈ **30**.
- **B SraVaani-0.5-live.** 430M parameters with CTC (no decoder loop), so the same class as A: L4 ≈ **75**, T4 ≈
  **40**.
- **C IndicConformer-600M, VAD-gated, partials re-decoded every 0.5 s.**
  - Assume a VAD-active fraction a = 0.4 (child speech plus background speech that trips VAD).
  - With an average utterance of 3 s, each active second re-decodes about 3 s of audio (2 decodes × 1.5 s mean
    buffer).
  - Take L4 RTFx ≈ 300 for a 600M Conformer with batching.
  - Sessions = 300 / (0.4 × 3) = 250. Batching latency bounds this, so cap at **60**.
  - On T4: **30**.
- **D Voxtral-Realtime 4B.** The only figure found is 32 concurrent streams at 606 tok/s aggregate on a Tenstorrent
  p300x2. That is about 19 tok/s per stream against the 12.5 tok/s needed [V, community card].
  - Assume L40S ≈ 48 streams, halved → **24**.
  - Assume L4 ≈ 12, halved → **6**.
  - T4 is not viable (no bf16, 16 GB).
- **E Zero STT Hinglish (Whisper-medium), VAD-gated, 1 Hz partials.** Every call encodes a full 30 s window.
  - Medium on L4 at fp16 is about 30 batched calls/s.
  - Active streams = 30; sessions = 30 / 0.4 = 75, halved → **35**.
  - T4: about **15**.
- **F Qwen3-ASR-1.7B, vLLM streaming (chunked re-encode).** L4 ≈ 20, halved → **10**. The 0.6B model is about 2-3×
  that.

### 5.3 $/session-hour = GPU $/h ÷ concurrent sessions

| model | host (price) | sessions/GPU | **$/session-h** |
|---|---|---|---|
| A Nemotron-3.5 @560 ms | AWS us-east-1 L4 spot ($0.58) | 75 | **$0.0077** |
| A | AWS us-east-1 L4 on demand ($0.805) | 75 | $0.011 |
| A | AWS ap-south-1 L4 on demand ($0.966), after the quota request | 75 | $0.013 |
| A | Azure centralindia T4 on demand ($0.579) | 40 | $0.014 |
| A | Azure ACA serverless T4 (~$0.60 total) | 40 | $0.015 |
| A @160 ms | AWS L4 on demand ($0.805) | 30 | $0.027 |
| B SraVaani-live | Azure CI T4 ($0.579) | 40 | $0.014 |
| C IndicConformer, VAD-gated | AWS L4 on demand ($0.805) | 60 | $0.013 |
| C | Azure CI T4 ($0.579) | 30 | $0.019 |
| D Voxtral-RT 4B | AWS L40S on demand ($1.861) | 24 | $0.078 |
| D | AWS L4 on demand ($0.805) | 6 | $0.134 |
| E Zero STT Hinglish | AWS L4 on demand ($0.805) | 35 | $0.023 |
| E | Azure CI T4 ($0.579) | 15 | $0.039 |
| F Qwen3-ASR-1.7B | AWS L4 on demand ($0.805) | 10 | $0.081 |
| *API: gpt-live-transcribe* | Azure | — | *$1.02* |
| *API: Azure Speech RT + LID* | Azure | — | *$1.30* |

### 5.4 The fixed floor decides early-stage economics

- A live lane cannot scale to zero. The measured ACA T4 cold start is 161 s (inherited, `hp-private-voice.md`
  pv-33).
- So the minimum is **2 warm GPUs** (one serving, one failover):
  - Azure CI T4: 2 × $0.579 = **$1.16/h ≈ $845/month**;
  - AWS L4 on demand: 2 × $0.805 = $1.61/h ≈ $1,175/month.
- Break-even against gpt-live-transcribe at $1.02 per session-hour: $1.16 / ($1.02 − $0.014) ≈ **1.2 concurrent
  sessions on average** (Azure T4), or ≈ 1.6 (AWS L4).
- Below that, the API is cheaper. Above it, self-hosting is about 50-100× cheaper at the margin, and the warm pair
  covers up to about 40-75 concurrent sessions before a third GPU is needed.
- Spot is fine for the bench, but **not for the live lane**: a reclaim ends every child's session on that GPU. A
  spot second replica is possible only if the client fails over to the API lane [U].

### 5.5 Latency vs the current lanes [V/U]

| engine | first partial after onset | final after speech end |
|---|---|---|
| A Nemotron @160 / 560 ms | ≈ chunk + RTT ≈ 0.2-0.3 s / 0.6-0.8 s [U] | endpoint hangover + chunk [U] |
| B SraVaani-live @480 ms | ≈ 0.5-0.6 s [U] | hangover + lookahead [U] |
| C / E VAD-gated | ≈ VAD onset + first re-decode ≈ 0.5-1.0 s [U] | hangover (300-600 ms) + one decode (~50-150 ms) [U] |
| D Voxtral @480 ms | ≈ 0.5-0.6 s [U] | ≈ delay [U] |
| MAI-2-Streaming | **2.6 s** [M] | 68 ms after commit (Chennai) [M] |
| gpt-live-transcribe D4 | 1.4 s [M] | 1.29 s after speech end (US) [M] |

Server-side placement in India (Azure Central India or AWS Mumbai) also removes about 200 ms per round trip compared
with us-east-1 or eastus2 [M, RTT file].

---

## 6. Ranked: open-weight models worth benchmarking

| rank | HF repo @ revision | why it earns a bench slot | arms | kill criterion |
|---|---|---|---|---|
| **1** | `nvidia/nemotron-3.5-asr-streaming-0.6b` @ `ea30d66debe3740a08b573244286791d423d6b3e` | Native cache-aware streaming. Best published Hindi WER (6.8-8.1, FLEURS). Transducer, so no fabrication on silence by construction. Highest streams per GPU. Commercial licence | `target_lang=hi-IN` vs `auto`; chunks 160 / 560 / 1,120 ms | non-speech output on more than 0/30; answers below 70/78; English terms unrecoverable |
| **2** | `ARTPARK-IISc/SraVaani-0.5-live` @ `29a15303a55673367134eee9e1d18cb1a2dcaabf`, with `ARTPARK-IISc/SraVaani-1.0` @ `f5dd5358325a5208775b91dad98918e079ea2b27` as the final/second-pass arm | Indian-built on Vaani (noisy phone speech, many districts). Streaming with runtime-switchable lookahead. Code-switch tokenizer. MIT. 1.0 beats Saaras v3 and IndicConformer on the Indic mean | live at 480 and 1,040 ms; 1.0 on VAD-closed turns | as rank 1; live Hindi WER is 18-22 published, so it must at least tie R4 on numbers |
| **3** | `ai4bharat/indic-conformer-600m-multilingual` @ `e9b71b369c048e2c6b634d4c131061c34e441179` | The Indic incumbent (MIT, 576k downloads). IndicVoices training. CTC/RNNT, no fabrication by construction. Already named in v2 review R8 | CTC vs RNNT; VAD-gated with 0.5 s re-decode; plus `indicconformer_stt_hi_hybrid_ctc_rnnt_large` @ `deada84ce880997c56ee933aa21571d768264700` | Devanagari-only output breaks English answers beyond what the §4 normaliser can recover |
| **4** | `mistralai/Voxtral-Mini-4B-Realtime-2602` @ `2769294da9567371363522aac9bbcfdd19447add` | The only open LLM-decoder model that streams natively (Apache-2.0). Hindi FLEURS 11.8-12.9 at 480-960 ms. Mixed script plausible | delay 480 and 960 ms; vLLM realtime; **non-speech n ≥ 30 first** | any non-speech output; the vLLM 3-session bug still reproduces |
| **5** | `shunyalabs/zero-stt-hinglish` @ `93b882ac4f1d470d910ef8e1e48d44d51a439cc6` | The owner asked about it. Native Devanagari + Latin output matches our reference. Indian data (Vaani, Kathbath, Shrutilipi). Open weights | VAD-gated; `language=hi` vs none; faster-whisper conversion vs HF; **non-speech n ≥ 30 first** | any non-speech output (Whisper class); no streaming path under 1 s |
| **6** | `Qwen/Qwen3-ASR-1.7B` @ `7278e1e70fe206f11671096ffdd38061171dd6e5` | Apache-2.0, Hindi supported, vLLM streaming, cheap 0.6B sibling (`5eb144179a02acc5e5ba31e748d22b0cf3e303b0`) | `language=Hindi` vs auto; **non-speech n ≥ 30 first** | any non-speech output; Hindi CER worse than R4 |

These are optional research arms, not production: `addyo07/nemotron-3.5-0.6b-hinglish` @
`276471451a8214e690a4c7061ad14a3bd727bb3f`. It answers whether a Hinglish fine-tune helps rank 1. Its data licence
is unknown, so it must not ship.

---

## 7. Bench plan (next phase; not run here)

- **Corpus and scorer.** Unchanged:
  - the v2 corpus (`docs/research/voice/v2/stt/`, 180 speech clips plus the 12 non-speech clips of the refresh);
  - `score.mjs` plus `score2.mjs` (fixed numSeq).
- **Add before any LLM-decoder arm is believed:**
  - non-speech to **n ≥ 30**: TV babble, ceiling fan, a sibling talking Hindi far-field, pressure-cooker whistle,
    and digital zeros;
  - a **60-minute continuous-stream soak** per streaming arm (the lesson audio with long gaps), counting characters
    emitted outside speech. That is the always-on failure mode, and no current probe measures it.
- **Load test.** N simulated real-time streams per GPU (N = 8, 16, 32, 64, …) until p95 partial latency exceeds
  700 ms. This replaces every [U] concurrency figure in §5.2.
- **Host.** AWS us-east-1 g6.xlarge spot through `scripts/gpu/run.py` (quota of 8 vCPU = one g6.xlarge or
  g6.2xlarge at a time).
  - Estimate: 6 models × (setup ~15 min + corpus ~10 min + soak 60 min + load ~15 min) ≈ 10 GPU-hours ≈ $6-8 at
    spot, inside the $60 cap [U].
  - Ask the owner to request **ap-south-1 G/VT quota** (L-DB2E81BA and L-3819A6DF; 0 today) if Mumbai hosting is
    wanted, or use Azure Central India T4.
- **Gate to production.** A bench win on synthetic clips only earns a shadow slot. E1 real-child audio decides, as
  for D4 and MAI.

## 8. Open questions for the owner

1. Is the ~$850/month floor for a warm Azure Central India T4 pair acceptable before concurrency justifies it?
2. Request ap-south-1 GPU quota, or keep self-hosting on Azure Central India?
3. Is a one-off Sarvam API reference arm (< $1, reference-only) wanted as a ceiling?

## Sources

- HF model API and cards (2026-10-04):
  - [nemotron-3.5-asr-streaming-0.6b](https://huggingface.co/nvidia/nemotron-3.5-asr-streaming-0.6b)
  - [SraVaani-0.5-live](https://huggingface.co/ARTPARK-IISc/SraVaani-0.5-live)
  - [indic-conformer-600m-multilingual](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual)
  - [Voxtral-Mini-4B-Realtime-2602](https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-2602)
  - [zero-stt-hinglish](https://huggingface.co/shunyalabs/zero-stt-hinglish)
  - [pingala-v1-universal](https://huggingface.co/shunyalabs/pingala-v1-universal)
  - [Qwen3-ASR-1.7B](https://huggingface.co/Qwen/Qwen3-ASR-1.7B)
  - [Whisper-Hindi2Hinglish-Apex](https://huggingface.co/Oriserve/Whisper-Hindi2Hinglish-Apex)
  - [nemotron-3.5-0.6b-hinglish](https://huggingface.co/addyo07/nemotron-3.5-0.6b-hinglish)
- Papers:
  - [SraVaani 1.0, arXiv 2608.08235](https://arxiv.org/html/2608.08235)
  - [Vividh-ASR, arXiv 2605.13087](https://arxiv.org/pdf/2605.13087)
- Other model sources:
  - [AI4Bharat Vistaar](https://github.com/AI4Bharat/vistaar)
  - [Omnilingual ASR](https://github.com/facebookresearch/omnilingual-asr)
  - [vLLM issue #35863](https://github.com/vllm-project/vllm/issues/35863)
- Sarvam and Shunya:
  - [Sarvam Saaras V4 blog](https://www.sarvam.ai/blogs/introducing-saaras-v4)
  - [Sarvam self-hosted docs](https://docs.sarvam.ai/api/self-hosted/introduction)
  - [AWS Marketplace: Sarvam](https://aws.amazon.com/marketplace/pp/prodview-7zok3fqtuzeqg)
  - [MarkTechPost on Saaras V4](https://www.marktechpost.com/2026/09/26/sarvam-ai-releases-saaras-v4-a-speech-to-text-model-for-all-22-indian-languages-and-global-english/)
  - [Shunya Zero Codeswitch news](https://www.letsdatascience.com/news/shunya-labs-releases-zero-codeswitch-speech-model-ddbb3788)
  - [Shunya Hinglish blog](https://www.shunyalabs.ai/blog/best-ai-models-for-hinglish-speech-to-text-in-2026)
- Azure:
  - [HF on Microsoft Foundry (Parakeet deploy example)](https://huggingface.co/docs/microsoft-azure/foundry/examples/deploy-nvidia-parakeet-asr)
- Prices: AWS Pricing API, EC2 spot price history, Service Quotas; Azure Retail Prices API (all pulled 2026-10-04).
