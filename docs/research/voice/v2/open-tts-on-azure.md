# Open-source TTS self-hosted on Azure GPU, and "train our own teacher voice"

2026-10-02. Experiment `open-tts-on-azure`. Builds on `../voices-hindi.md` (§3.12 IndicF5), `judge-summary.md`
(AI-judge ranking of Azure voices) and `reference-gemini.md`.
Evidence tags as in voices-hindi.md: **[M]** measured here, **[V]** vendor or model card, **[P]** published
third-party study, **[E]** our estimate (arithmetic shown), **[U]** unverified secondary source.

**Bottom line**
1. No open model is ready to replace Azure Speech as the live teacher voice today. Four are commercially
   licensed, Hindi-capable and 10/10 intelligible on our passage (b) **[M]**: **Veena** (Apache-2.0, Hindi/Hinglish native,
   4 studio voices), **Svara-TTS** (Apache-2.0, Orpheus-Hindi base), **Chatterbox-Multilingual-hi** (MIT)
   and **VoxCPM2** (Apache-2.0). None has an independent human-preference result for Indian listeners. The one
   open model that does, IndicF5, came **last of 7** in a 120 k-comparison Indian study (BT 806 against Gemini 1129
   and gpt-4o-mini-tts 943) **[P]**. It also mangled every Latin-script English word in our Hinglish passage (0/10), and scored 10/10 once those words
   were transliterated to Devanagari **[M]**.
2. **T4 is out for the LLM-codec family (Veena, Svara, Orpheus).** A 3 B model needs about 82 audio tokens/s per stream
   for real time. In fp16 a T4's memory bandwidth caps one stream at about 48 tok/s **[E]**. The floor is an **A100**:
   about $3.67/h as an NC24ads_A100_v4 VM, or $1.90/h GPU meter plus vCPU and memory on Container Apps serverless.
   Expected first audio is about **0.2–0.3 s** on a warm A100 **[P/V]**. Self-hosting only beats Azure DragonHD/MAI on
   price above about **10 concurrent sessions sustained** **[E]**.
3. **Train our own voice: yes, and record once for two targets.** A consented, work-for-hire Hindi-English recording
   session (~2,000 utterances, about 3–4 h of finished audio) feeds both of these:
   (a) **Azure Professional Voice**, which supports **hi-IN HD voice, multi-style, cross-lingual and multilingual
   training** **[V]**. It costs $52 per training compute-hour (about 10 h, so about $520), **$4.03/h per hosted model
   endpoint** (about $2.9 k/month always-on), and $24/M characters for synthesis ($48/M HD) **[V, Azure retail API]**.
   (b) a **LoRA fine-tune of Veena/Svara** on Azure A100. Compute is about $5–40 per run **[E]**. This is the same
   recipe Maya Research used to build Veena: 15 k utterances per speaker, LoRA r=192/96 **[V]**.
   The Azure route is the production path, because it is managed, uses SSML and needs no GPU ops. The OSS route is the
   hedge, and it is the only route that gives emotion tags and full control.

---

## 1. Candidates

| model | licence (commercial?) | Hindi / Hinglish | size, codec | streaming / speed evidence | cloning / fine-tune path | verdict |
|---|---|---|---|---|---|---|
| **Maya Research Veena** | Apache-2.0 ✅ **[V]** | native hi + en + code-mixed; 4 studio voices (kavya, agastya, maitri, vinaya) **[V]** | 3 B Llama + SNAC 24 kHz; ctx 2048 | "sub-80 ms on H100" **[V]**; MOS 4.2 **[U]** (secondary blog, no method) | LoRA on Llama backbone (their own recipe: 15 k utt/speaker, 8×H100) **[V]**; no zero-shot cloning | **Top OSS candidate** for a Hinglish teacher; must be ear-tested |
| **Svara-TTS v1** (Kenpath) | Apache-2.0 ✅ **[V]**; base `canopylabs/3b-hi-ft` (Apache card, Llama-3.2 pretrain) | 19 Indic langs + Indian English; ~50 speakers, 2,000 h open data (SYSPIN, RASA, IndicTTS, SPICOR) **[V]** | 3 B Orpheus-style SNAC | GGUF/edge; emotion tags `<happy>` etc. **[V]** | "LoRA-friendly" **[V]**; Orpheus: "good after ~50 examples, best ~300/speaker" **[V]** | Strong candidate; it is also our **Orpheus-Hindi** proxy |
| **Orpheus multilingual (Hindi)** | research release; base Llama-3.2 licence (commercial OK under 700 M MAU) | Hindi pair (pretrain + ft), gated **[V]** | 3 B SNAC | ~200 ms streaming, ~100 ms with input streaming **[V]**; TTFA ~280 ms A100 / ~180 ms H100 (community) **[P]** | full fine-tune/LoRA, unsloth notebook **[V]** | Use through Svara/Veena, which are better Hindi fine-tunes of the same architecture |
| **Chatterbox Multilingual V3 / -hi** (Resemble) | MIT ✅ **[V]** | Hindi in 23 langs + a **dedicated Hindi fine-tune** **[V]** | 0.5 B, 300-char input cap in demo | Resemble sells "sub-200 ms" only for its hosted API **[V]** | zero-shot cloning from a 5–10 s clip; emotion "exaggeration" knob **[V]** | Strong candidate; cloning makes the consent rules critical |
| **VoxCPM2** (OpenBMB) | Apache-2.0 ✅ **[V]** | Hindi among 30 langs **[V]** | 2 B, tokenizer-free diffusion-AR, 48 kHz | RTF ~0.3 on RTX 4090, ~0.13 with Nano-vLLM **[V]** | voice *design* from a text description, plus controllable cloning **[V]** | Candidate (voice design from a description is unusual); Hindi is one of 30 langs, not a focus |
| **IndicF5** (AI4Bharat) | MIT ✅ (gated: clone only with permission) **[V]** | 11 Indic langs, 1,417 h | 0.4 B flow-matching | RTF 2.87 on T4 **[P, Gurukul]**, no streaming | reference clip + transcript every call | **No.** Last of 7 in the Indian preference study **[P]**; 0/10 Latin-script terms here, 10/10 after Devanagari transliteration **[M]** |
| **Indic Parler-TTS** (AI4Bharat) | Apache-2.0 ✅ **[V]** | 21 langs; Hindi speakers Rohit, Divya; native-speaker score 84.8 % ± 2.1 **[V]** | 0.9 B | streaming via the parler-tts guide **[V]** | style from a text description; no cloning; fine-tunable | Weak: 1.86 MOS vs 3.63 for a newer model in a third-party comparison **[P]**; code-mixing not documented |
| **Sesame CSM-1B** | Apache-2.0 ✅ | **English only** **[V]** | 1 B Llama + Mimi | — | fine-tune possible, no Hindi base | **No** (no Hindi) |
| **Kyutai TTS (DSM)** | CC-BY-4.0 ✅ | **en/fr only** **[V]** | 1.6–2 B | 220 ms; 32 streams on one L40 <350 ms **[V]** | — | **No** (no Hindi); its streaming design is the best in the field |
| **Fish Audio S2 Pro / OpenAudio** | **Research licence, non-commercial** ❌ (commercial needs a deal) **[V]** | hi listed among 80+ langs | 4 B + 0.4 B dual-AR | RTF 0.195, TTFA ~100 ms on H200 **[V]** | fine-tune code released | **No** under the Azure-only + licence rules, unless Fish licenses it |
| **CosyVoice 3** (FunAudioLLM) | Apache-2.0 ✅ | **Hindi not in supported list** (zh, en, fr, es, ja, ko, it, ru, de) **[V]** | 0.5 B | streaming **[V]** | zero-shot cloning | **No** for Hindi |
| **F5-TTS / F5-Hindi** | base CC-BY-**NC** ❌; SPRINGLab F5-Hindi-24KHz CC-BY-4.0 ✅ (151 M, IndicTTS + IndicVoices-R) **[V]** | pure Hindi | 151 M | non-streaming flow matching | reference clip | **No** for live; same family as IndicF5 |
| **XTTS-v2** (Coqui) | **CPML, non-commercial** ❌; Coqui shut down, so no licence can be bought | hi supported | 0.5 B | ~200 ms streaming (community) | 6 s cloning | **No** (licence) |

Not on the brief, but seen in the Spaces search: Higgs Audio v3, IndexTTS-2, VibeVoice and Kokoro. None of them
lists Hindi as a focus language, so none was tested.

## 2. Passage (b) samples (experiment, public HF Spaces)

Harness: `oss-tts-samples.py` (HF ZeroGPU Spaces via gradio_client) and `oss-veena-cpu.py` (Veena on local CPU,
because no Veena Space was up). Results: `oss-tts-samples.json`. Audio is in `samples/oss-*.mp3`, 64 kbps mono 24 kHz,
about 0.2 MB each.

Cloning models got the vendor's own Hindi demo prompt (Resemble `hi_f1.flac`, transcribed by our gpt-4o-transcribe).
No real person was recorded or cloned. Wall times include ZeroGPU queueing and are **not latency evidence**.

Intelligibility check (round trip): gpt-4o-transcribe (`taxila-transcribe`) on each clip. We counted the 10
English-term slots in the passage (pizza ×5, one by two ×2, two by four ×2, equivalent fractions ×1) that come back
recognisable. **Hindi words came back correctly in every clip. All of IndicF5's errors were on Latin-script words.**

| file | model / voice | audio s | chars/s | English terms intact | notes **[M]** |
|---|---|---|---|---|---|
| `oss-svara.mp3` | Svara v1, Hindi (Female) | 24.6 | 13.0 | 10/10 | transcript is near-verbatim |
| `oss-voxcpm2.mp3` | VoxCPM2, voice design ("warm young Indian woman teacher…") | 27.3 | 11.7 | 10/10 | ASR even kept "equivalent fractions" in Latin script |
| `oss-chatterbox-hi.mp3` | Chatterbox-Multilingual-hi, clone of `hi_f1` (2 chunks, 300-char cap) | 26.1 | 12.2 | 10/10 | "एकिवालेंट फ्राक्षन्स" (slight) |
| `oss-chatterbox-v3.mp3` | Chatterbox Multilingual V3 (general), lang=hi, clone of `hi_f1` | 24.4 | 13.1 | 10/10 | ASR wrote 1/2 and 2/4 as numerals, and heard an extra "यानी" before 2/4 (possible insertion) |
| `oss-indicf5.mp3` | IndicF5, clone of `hi_f1` | 18.1 | 17.6 | **0/10** | pizza→"हेज़ा", one by two→"नम ईचू", two by four→"चूरी फंड"; Latin words are garbled or dropped (hence the short clip) |
| `oss-indicf5-devanagari.mp3` | IndicF5, same clone, **English words pre-transliterated to Devanagari** | 23.0 | 13.9 | **10/10** | the normaliser fixes it: "इक्विवेलेंट फ्रैक्शन्स" |
| `oss-veena-kavya.mp3` | Veena `kavya` (local CPU bf16, sentence by sentence, 200 ms gaps) | 23.2 (22.2 speech) | 14.4 | 10/10 | "इक्विलेंट फ्राक्षन्स" (slight); natively reads Latin-script English inside Hindi |

Reference point: the measured median for Hinglish speech is 12.0 chars/s (voices-hindi.md §5).
Not produced: CosyVoice 3, which has no Hindi anyway, because the anonymous ZeroGPU quota ran out.
**Finding [M]:** IndicF5 cannot read Latin script inside Hindi (0/10). With the same text transliterated to Devanagari
it scores 10/10. Any model in that family must sit behind a Latin→Devanagari pass in the spoken-notation normaliser.
Veena, Svara, Chatterbox and VoxCPM2 read mixed-script text as written.

**What these samples do NOT tell us:** whether any of them sounds like a real Indian teacher. An ASR round trip only
measures intelligibility. The AI-judge pipeline (`judge-voices.mjs`) could not be run: the OpenRouter key has $0.27
left, and audio judging needs $0.50 or more. Next step: add the `oss-*` clips to the blind human test
(`make-blind-page.py`) next to MAI-Voice-2.1 HD Priya and DragonHD Diya, which lead on the AI judge.

### 2.1 Veena run (measured token rate)
Five sentences gave 1,820 SNAC tokens for 22.2 s of audio, which is **82.1 audio tokens per second of speech** **[M]**
(308 tokens produced 3.75 s, three times over). That confirms the real-time budget used in §3.1. On 4 vCPU in bf16
the model ran at about 1.6 tok/s (1,047 s of CPU for 22 s of audio), roughly 50× slower than real time. That says
nothing about GPU latency; this run exists only to produce audio we can listen to. Per-sentence data is in
`oss-tts-samples.json` → `veena-kavya`.

## 3. Serving on Azure: what hardware, what latency, what cost

### 3.1 The real-time constraint
The LLM-codec models (Veena, Svara, Orpheus) emit 7 SNAC tokens per ~85 ms frame, which is **82 tokens/s of audio**
(**measured 82.1 on Veena, §2.1 [M]**). Decoding a 3 B model at batch 1 is memory-bandwidth bound, so the
per-stream ceiling is roughly bandwidth ÷ weight bytes **[E]**:

| GPU (Azure offer) | bandwidth | fp16/bf16 3 B (6.6 GB) | int4 AWQ (~2 GB) | fit |
|---|---|---|---|---|
| T4 16 GB (ACA serverless, NC4as_T4_v3) | 320 GB/s | ~48 tok/s → **0.6× real time** | ~160 tok/s ceiling, ~100 practical → 1.2×, 1 stream | **no** for 3 B; possible for Chatterbox 0.5 B / Parler 0.9 B, unmeasured |
| A10 24 GB (NVads_A10_v5 VMs only, not ACA) | 600 GB/s | ~90 tok/s → 1.1× | ~2× | marginal; NV36ads costs $3.20/h, almost an A100 |
| **A100 80 GB** (ACA serverless, NC24ads_A100_v4) | 2.0 TB/s | ~300 tok/s single stream; batching with vLLM serves many | — | **yes** |
| H100 (NC40ads_H100_v5) | 3.35 TB/s | Veena "sub-80 ms" **[V]** | — | yes, $6.98/h |

**Expected first audio, warm A100, streaming SNAC decode in 7-token frames:** prefill of about 100 text tokens takes
<20 ms, plus the first 2–4 frames (28 tokens, ~0.1–0.15 s), plus SNAC decode of ~10 ms. That gives **≈ 0.2–0.3 s**
**[E]**, which agrees with the community figure of ~280 ms for Orpheus on A100 **[P]**. For comparison, Azure MAI/DragonHD
over REST was in the same few-hundred-ms class in our earlier probes (voices-hindi.md).
**Concurrency per A100 (vLLM continuous batching):** about 16–24 real-time streams **[E]**. The teacher speaks
about 35–40 % of a session, so that is **≈ 40–60 concurrent sessions per GPU** **[E]**. This needs a load test before
anyone relies on it.

### 3.2 Prices (Azure retail prices API, eastus, 2026-10-02) **[V]**
| resource | meter |
|---|---|
| ACA serverless T4 GPU | $0.000073/s = **$0.263/h** (Central India $0.367/h) + vCPU $0.0864/h + memory $0.0108/GiB·h |
| ACA serverless A100 GPU | $0.000529/s = **$1.904/h** (Central India $2.668/h) + vCPU + memory. About **$3.3/h** with 8 vCPU / 64 GiB; up to ~$6.3/h if the full 24 vCPU / 220 GiB profile is billed **[E]** |
| ACA dedicated GPU profile | $4.41/h (eastus) |
| VM NC4as_T4_v3 | $0.526/h (spot $0.149) |
| VM NV36ads_A10_v5 | $3.20/h |
| **VM NC24ads_A100_v4** | **$3.673/h** (spot $0.679) |
| VM NC40ads_H100_v5 | $6.98/h |
| Azure Neural HD / DragonHD TTS | $22/M chars |
| Custom (Professional) voice synthesis | $24/M chars; CNV **HD** $48/M |
| Custom voice training | **$52 per compute hour** |
| **Custom voice model hosting** | **$4.032/h per model** |
| Personal voice synthesis | $24/M chars (+ $600 per 1 k profiles/month storage) |

Region note: serverless A100 is **not offered in Central/South India**, only T4 **[V]**. The nearest A100 regions are
East US, Sweden Central, Australia East and others. From India that adds about 200 ms or more RTT for each audio
chunk, which erases most of the self-hosting latency advantage. A dedicated A100 VM in Central India (if quota is
granted) or Southeast Asia needs to be checked.

### 3.3 Cost per session-hour **[E]**
Assumptions: teacher speaks 40 % of an hour, about 720 chars/min, so ~17,300 chars per session-hour.
- Azure DragonHD / MAI-Voice-2.1 HD at $22/M: **$0.38 ≈ ₹33 per session-hour**.
- Azure Professional (custom) voice at $24/M: $0.42, **plus $4.03/h of endpoint hosting** whether or not it is used.
- Self-hosted Veena/Svara on an A100 VM at $3.67/h, ~50 sessions per GPU: **$0.07 ≈ ₹6.5 per session-hour at full
  utilisation**. A minimum of 2 warm replicas for redundancy costs ~$5.4 k/month. Break-even with DragonHD is about
  **10 sustained concurrent sessions**, and production-grade redundancy needs about 20.
- Cold start: ACA can scale to zero, but a 7 GB model on a cold GPU takes tens of seconds to minutes, even with ACR
  artifact streaming and an Azure Files model mount **[V/P]**. A live tutor must keep `minReplicas ≥ 1` during school
  hours, so "serverless" mostly buys per-second billing outside those hours.

## 4. Recommended self-hosting plan (only if the blind test says an OSS voice wins)
1. **Ear test first (no GPU spend).** Put `oss-veena-kavya`, `oss-svara`, `oss-chatterbox-hi` and `oss-voxcpm2` into the
   human blind test against MAI-Voice-2.1 HD Priya, DragonHD Diya and the Gemini reference. Kill the self-hosting
   track if no OSS clip reaches the Azure leaders.
2. **Pilot:** one ACA app on the **serverless A100** profile (East US or Sweden Central first, because quota is
   on by default for PAYG). The image is vLLM plus the Orpheus/Veena SNAC streaming server (OpenAI-style
   `/v1/audio/speech` shape, behind `server/voice/speech.js` as a new provider). Weights go on an Azure Files mount,
   with ACR Premium artifact streaming. `minReplicas=0` for the pilot.
   Measure TTFA, RTF and the concurrency knee with 1–32 synthetic streams, from an Indian client.
   Pilot budget: ~20 GPU-hours, ≈ **$70**.
3. **Production shape (if the pilot passes):** a dedicated A100 VM pair or ACA dedicated GPU profile in the
   nearest A100 region with acceptable RTT. Keep `minReplicas=2` during 06:00–22:00 IST. Keep Azure Speech
   (MAI/DragonHD) as **automatic fallback** on any timeout, which is the same two-lane pattern as
   `voice-lane-cascade-default`.
4. Same safety floor: the spoken-notation normaliser runs before *any* TTS. IndicF5 shows what happens without it
   (0/10 Latin terms correct).

## 5. "Train our own Indian teacher voice": plan
**Record once, own it, train two ways.**

**Voice talent and rights.** Hire a professional Hindi-English voice artist (a teacher-register persona,
female first, male second). Use a written work-for-hire contract with explicit consent for synthetic-voice use in a
children's education product, covering (a) Azure Professional Voice and (b) self-trained open models. Include a
revocation and attribution clause and pay a royalty or buy-out. Azure also requires a **recorded verbal consent
statement** by the talent (voice talent profile) and **Limited Access approval** for custom voice **[V]**. Apply now,
because approval is a review gate with an unknown lead time.

**Script (≈ 2,000 utterances, ≈ 3–4 h finished audio).** Microsoft says 300 utterances give a reasonable voice and a
distinctive persona needs 1,000–2,000 **[V]**. Orpheus-family fine-tunes are "good after ~50 examples, best ~300 per
speaker"; Veena itself used 15 k per speaker **[V]**. Proposed mix:
- ~50 % classroom Hinglish: explanations, questions to a child, wait-and-prompt, praise, gentle correction.
  These must be written by our own script team as *recording material*, never taken from prompts.
- ~25 % pure Hindi.
- ~15 % Indian-English.
- ~10 % short phrases, numbers and maths read the way the spoken-notation rules say them.
- 10–20 % questions and 10–20 % exclamations **[V: Microsoft script guidance]**.
- For Azure "contextual" mode, add ≥ 30 min of paragraph-length takes (>30 s each) **[V]**.
- Multi-style for hi-IN: record 3–4 style sets (warm-explaining, excited-praise, gentle-correction, calm-question)
  of ~300 utterances each.

**Recording spec.** 48 kHz/24-bit mono, SNR > 35 dB, peaks −3 to −6 dB, 100–200 ms head/tail silence. Sessions of
2–3 h a day, 3–4 days a week, with a "match file" re-read every page **[V]**. Studio, engineer and talent in Mumbai or Delhi
for about 6–8 session days: **≈ ₹1.5–4 lakh** **[E, unverified market rate]**.

**Route A: Azure Professional Voice (production default).** hi-IN supports **HD voice, Neural, multi-style,
cross-lingual source/target and multilingual primary/secondary** **[V: tts-cnv language table]**. So one hi-IN
training set can also speak en-IN. Cost:
- Training: ~10 compute-h × $52 ≈ **$520** per model. Sources disagree on the per-training cap ($936 vs $4,992)
  **[U]**, so treat ≤ $1 k as likely.
- Hosting: **$4.03/h per deployed model**, about **$2.9 k/month** always-on per voice, so ~$5.9 k/month for two voices.
- Synthesis: $24/M chars, or $48/M for HD.

Benefits: SSML, visemes, the same API as today, and no GPU ops. Risk: Microsoft may decline Limited Access for a
child-facing persona.

**Route B: LoRA on Veena or Svara (hedge, maximum control).** Fine-tune the Apache-licensed 3 B base with LoRA on
the same recordings. One A100 for 3–4 h of audio at ~3 epochs is a few GPU-hours: about **$5–15 spot / $15–40
on-demand** on Azure ML or an ACA job **[E]**. Benefits: emotion tags, prosody we can steer per Director turn,
no per-character fee, and the weights are ours. Costs: GPU serving (§3), our own safety and quality gates, and the
need to prove in a blind test that it matches Route A.

**Do NOT use zero-shot cloning (Chatterbox, VoxCPM2, IndicF5) as the product voice.** A 5-second clone is weaker than
a trained model, and the same feature lets anyone clone anyone. Use cloning in experiments only, and only with
consented clips.

## 6. Open questions and next measurements
- Human blind test, including the `oss-*` clips (decides everything above).
- An A100 TTFA and concurrency load test of Veena/Svara on ACA, from an Indian client (the [E] figures above).
- Whether the ACA serverless A100 bills the full profile CPU/memory or only the container's requested share.
- Limited Access lead time and acceptance for a child-education custom voice.
- `cosyvoice3` (no Hindi, low priority). An HF token would remove the ZeroGPU quota stalls hit in this run.
- The other three passages (a, c, d, e) on Veena/Svara/Chatterbox-hi once a GPU pilot exists. This run covered only (b).

## Sources
- Model cards: huggingface.co/maya-research/Veena, kenpath/svara-tts-v1, canopylabs/3b-hi-ft-research_release,
  ResembleAI/chatterbox (+ Chatterbox-Multilingual-hi), openbmb/VoxCPM2, ai4bharat/IndicF5, ai4bharat/indic-parler-tts,
  sesame/csm-1b, kyutai/tts-1.6b-en_fr, fishaudio/s2-pro, FunAudioLLM/Fun-CosyVoice3-0.5B-2512, SPRINGLab/F5-Hindi-24KHz,
  SWivid/F5-TTS, coqui/XTTS-v2. github.com/canopyai/Orpheus-TTS (README: fine-tune guidance, latency; issue #61 TTFA).
- "Preferences of a Voice-First Nation: Large-Scale Pairwise Evaluation…for TTS in Indian Languages", arXiv 2604.21481.
  10 languages, 5,357 sentences, 120 k+ comparisons, 1,900+ raters. BT: Gemini 2.5 Pro TTS 1128.5, ElevenLabs v3 1056.3,
  Sonic 3 1050.8, Bulbul V3 1021.9, Speech 2.8 HD 993.9, gpt-4o-mini-tts 942.8, **IndicF5 805.8** (win rate 19 %).
- Azure: learn.microsoft.com container-apps/gpu-serverless-overview (regions, T4/A100, cold start);
  speech-service professional-voice-train-voice; record-custom-voice-samples; language-support (tts-cnv include:
  hi-IN features); prices.azure.com retail API (meters quoted in §3.2, queried 2026-10-02).

---

## Review

Adversarial review, 2026-10-02. I checked the files and re-queried the Azure retail prices API (eastus and centralindia,
2026-10-02), the ACA serverless-GPU docs page (updated 2026-09-24) and the model cards. The bottom line holds: no
open model is proven, and the human blind test decides. The corrections below change the numbers and two framing claims.

**Prices and arithmetic**
1. **Break-even is ~19–20 concurrent sessions, not ~10.** The figure of 10 is one A100 VM ($3.673/h ÷ $0.38 per
   session-hour), but §3.3 itself requires 2 warm replicas, which costs $7.35/h, so 19.3 sessions. Against MAI-Flash or
   Neural at $15/M ($0.26 per session-hour, if MAI-Flash bills on the S1 Neural meter, which azure-speech-voices.md
   marks [U]), break-even is ~28. Speech commitment tiers ($7.50–12/M overage) push it higher still. Bottom line #2 and
   summary item 9 should say "~20 with redundancy".
2. **"DragonHD/MAI at $22/M" is not a verified MAI price.** No MAI-Voice meter exists in the retail API
   (azure-speech-voices.md §price). DragonHD $22/M is verified (effective 2026-09-01). The MAI price is [U].
3. **A100 VMs do have Central India meters.** NC24ads_A100_v4 costs **$5.142/h** on demand ($0.95 spot) and
   NC40ads_H100_v5 costs $9.772/h. Quota is still unverified. The report says this "needs to be checked". It does exist,
   and it is the obvious production region. At Central India prices: 2 replicas cost ~$7.5k/month, ₹9 rather than ₹6.5
   per session-hour at full utilisation, and break-even is ~27 sessions (HD).
4. **Route A's cost is understated.** The plan trains an **HD** professional voice, but §3.3 prices synthesis at $24/M.
   CNV HD is $48/M (meter verified): 17.3k chars → **$0.83 ≈ ₹73 per session-hour**, plus $4.032/h hosting per voice.
   That makes Route A the most expensive per character of all options. The price should appear in the bottom line.
5. Verified correct: ACA A100 $0.000529/s ($1.904/h), T4 $0.000073/s, vCPU $0.0864/h, memory $0.0108/GiB·h, ACA
   dedicated GPU $4.4076/h, VM A100 $3.673 (spot $0.679), H100 $6.98, A10 $3.20, T4 $0.526 (spot $0.149), CNV training
   $52/h, hosting $4.032/h, CNV $24/M, personal voice $24/M plus $600 per 1K profiles. The 2-replica eastus figure
   ($5.36k/month) is right. The serverless-A100 regions are right: Central and South India get T4 only.
6. Small fixes: Veena on CPU ran at 1,820 tok / 1,047 s = **1.74 tok/s** (not ~1.6), which is 47× slower than real time.
   NC40ads_H100_v5 is an **H100 NVL 94 GB (~3.9 TB/s)**, not 3.35 TB/s. The "82.1 tok/s **[M]**" figure is an
   architectural constant, not a measurement: 7 SNAC codes per 2,048-sample frame at 24 kHz is 82.03/s, which is why every
   sentence's tokens/audio_s ratio is identical. Tag it [V/arch]. The conclusion stands.

**Latency framing (two errors)**
7. "~200 ms RTT **for each audio chunk**" is wrong. With streaming, the RTT is paid once per utterance, to the first
   chunk; later chunks are pipelined.
8. The comparison runs only one way. Our Azure Speech probes also hit **eastus2**, so the India RTT penalty applies to
   the incumbent too. Also, "MAI/DragonHD in the same few-hundred-ms class" contradicts our own data. MAI-Voice-2.1
   **HD** has a TTFB of **0.9–1.5 s** (azure-speech-voices.md, n=5 per voice), and only MAI-Flash is ~320 ms. The leading
   AI-judge voice (Priya HD) is therefore the *slow* one, and that strengthens the case for an OSS pilot. Veena's own
   card claims ~120 ms on A100-40GB and <80 ms on H100 [V].

**Methodology**
9. **The intelligibility test cannot tell the models apart.** It used n=1 clip per model and one passage, and 6 of 7
   models hit the ceiling. The judge is gpt-4o-transcribe, a strong-LM ASR that repairs context ("pizza" ×5 is
   guessable) and that this project already rejected for fabrication (`gpt4o-transcribe-fabricates-noise`).
   "Hindi words came back right everywhere" is not quantified. Use CER over the whole passage with the
   `stt/score.mjs` normaliser, use taxila-live-transcribe or Azure Fast as a second ASR, and use ≥3 seeds per model.
10. **The arms ran under different conditions.** Veena was run sentence by sentence with **artificial 200 ms gaps**
    (cross-sentence prosody untested). Chatterbox-hi ran in 2 chunks, the others as one pass. VoxCPM2 used *voice
    design* while the others used cloning. All cloning models were forced onto **Resemble's** `hi_f1` prompt, which is
    in-distribution for Chatterbox and out-of-distribution for IndicF5. IndicF5 ships its own reference prompts, and its
    reference transcript here came from our ASR, so ASR errors reach the conditioning. Part of IndicF5's 0/10 may be the
    prompt and not the model. The Devanagari result is still valid as a normaliser rule.
11. **The blind test is not ready as built.** Measured integrated loudness ranges from **−14.6 LUFS (VoxCPM2) to
    −21.1 LUFS (Veena)**, against Azure clips at −18.8/−20.7. The OSS clips are 64 kbps and the Azure clips 96 kbps.
    Listeners favour louder clips and can tell codecs apart. Normalise every arm (e.g. −18 LUFS, same codec and
    bitrate, trim leading silence) before `make-blind-page.py`. Otherwise Veena enters with a ~6 LU handicap.
12. **"No real person was cloned" is inaccurate.** `hi_f1` is a recording of a real speaker who consented to
    *Resemble's* demo, not to us. That is fine for an internal experiment. The clone clips must not go on any shared or
    public page, and they must not be described as "not a real person".
13. **The published study proves less than the report implies.** arXiv 2604.21481 pools 10 languages, has no Hindi-only
    or code-mixed breakdown here, uses adult raters, and includes **no Azure voice and no Veena/Svara**. It says nothing
    about the four candidates. It only says IndicF5 is weak and gpt-4o-mini-tts trails Gemini. I did not re-verify the
    arXiv ID or figures.

**Missing candidates (newest models)**
14. **Mistral Voxtral TTS** (4B, open weights, released 2026-03-26) lists **Hindi among its 9 languages**. The weights are
    **CC BY-NC 4.0**, so self-hosting is ruled out without a Mistral enterprise licence. Mistral is a Foundry partner,
    though: **check whether Voxtral TTS is sold Direct from Azure in Foundry.** If it is, it is a production-legal
    newest-model candidate that the owner can deploy. This is the most important omission.
15. **Kokoro-82M** (Apache-2.0) **does** have Hindi voices (hf_alpha, hf_beta, hm_omega, hm_psi, each graded C on its
    VOICES.md). The report says none of the Spaces-search models lists Hindi. Kokoro will probably be weak, but it is the
    only candidate that runs in real time on a T4 or CPU, so it belongs in the table as a measured "no".

**Licence traps**
16. **The Apache-2.0 label is not the whole licence for Svara.** Its card says it was fine-tuned from
    `canopylabs/orpheus-3b-0.1-pretrained` ← `meta-llama/Llama-3.2-3B-Instruct`. The **Llama 3.2 Community Licence**
    therefore applies to the derivative: "Built with Llama" attribution, the Llama AUP, a "Llama" name prefix on any
    redistributed derivative, and the 700M-MAU cap. This is workable but must be recorded. Veena says only "Llama
    architecture, 3B". Ask Maya whether it was initialised from Llama 3.2 weights; if so, the same terms apply.
17. **Svara's training data needs checking.** IndicTTS (IIT Madras) has historically been distributed under a licence
    agreement and not a plain CC licence, and SYSPIN and SPICOR terms should be confirmed [U]. Commercial use of weights
    trained on research-only data is a grey area.
18. **Veena's voices belong to 4 real artists** (proprietary data, ~60k utterances). Apache covers the weights, not the
    artists' personality rights; Indian courts enforced voice personality rights in 2024–25. Before any Veena voice
    becomes "the Taxila teacher", get written confirmation from Maya that the artists consented to third-party
    commercial use. Our own recorded voice (Route A/B) avoids this.
19. Chatterbox embeds a Perth watermark in its output, which is a plus for the safety floor. Keep it on.

**Azure-only rule**
No production violation was found. HF ZeroGPU Spaces, local CPU and OpenRouter were used only for experiments, and
gpt-4o-transcribe ran on Azure. Two additions belong in the plan. The pilot and production images must load weights
from **ACR or Azure Files mirrored once**, never pulled from huggingface.co at runtime. The Gemini reference clip stays
reference-only in the blind test.

**Net effect on the recommendation:** keep the blind-test gate. Before it runs, (a) normalise loudness and codec,
(b) re-run Veena as a full passage, and (c) add a Voxtral-on-Foundry check. If an OSS voice wins, pilot on a
**Central India A100 VM** rather than an East US ACA app. Restate self-hosting economics as "cheaper above ~20–28
concurrent sessions".
