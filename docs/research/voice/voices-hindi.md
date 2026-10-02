# Hindi / Hinglish teacher voice options — 2026-10-02

Workstream `voices-hindi`. Question: which voices can carry an exactly-human-like Hindi-English teacher
for Classes 1-9 (Hinglish code-switching, pure Hindi, Indian English), at what latency and cost, which of
them can live inside a realtime speech-to-speech (S2S) loop versus only a cascade, and which go into the
blind ear test.

Evidence tags: **[M]** measured here today (n, method below) · **[V]** vendor primary doc fetched today ·
**[P]** prior measurement in this repo or a harvested sibling · **[T]** training knowledge, not re-verified
today (WebSearch budget was exhausted this session; Google pricing pages are JS-rendered) · **[U]** unknown or
inferred, must be checked · **[I]** inference.

---

## 0. Verdict

**Binding constraint:** `context/decisions.md#azure-only-compute` (owner, 2026-10-02) keeps ElevenLabs,
Sarvam and every other third-party AI API out of builds; research may cite them. So only Azure lanes can
*win*. Third-party voices appear here as market context and as optional **non-shippable reference arms**.

1. **On Azure, a voice is no longer either S2S or cascade.** Azure **Voice Live** runs `gpt-realtime-2.1`
   with native audio *in*, so the model still "hears" the child, and speaks through **any Azure TTS voice**:
   hi-IN Neural, en-IN DragonHD, and the new **MAI-Voice-2.1(-Flash) hi-IN** voices **[V]**. It also offers a
   dedicated `azure-realtime` model with native Indian voices **`diya`**, **`meera`** (hi-IN, bilingual) and
   **`aarti`** (en-IN) **[V]**. All of these worked from this resource today, first try **[M]**.
2. **Five Azure in-loop lanes exist:**
   - A: gpt-realtime-2.1 with a native voice;
   - A+: GPT-Live-1 (`taxila-live`, full-duplex, OpenAI voices);
   - B: Voice Live + gpt-realtime-2.1 + an Azure voice;
   - C: Voice Live `azure-realtime`;
   - E: a self-built cascade with Azure TTS.

   Gemini Live, Sarvam, ElevenLabs, Cartesia and Google are off-Azure and therefore research-only.
3. **No voice has been tested on human listeners yet.** Meera's Azure TTS lost by ear ("not human, not Indian")
   while winning every metric **[P]**. Gurukul's Hindi TTS candidates never reached a listener panel **[P]**.
   Today's numbers (§5) are **gates**: latency and intelligibility. They do not rank voices.
4. **Measured today (§5, n=5 clips per arm, text-in, US container → eastus2) [M]:**
   - Voice Live `azure-realtime` gave the fastest first audio of any in-loop lane: **median 476 ms**.
     gpt-realtime-2.1 native gave 776 ms (p90 1165), and Voice Live + gpt-realtime-2.1 + Azure voice gave 858 ms.
   - Every arm cleared the intelligibility floor (script-aware key-term recall ≥ 0.92).
   - The unhinted ASR returned a **non-Hindi script (Urdu ×5, Bengali ×1) for 6/40 Hindi clips** from the
     native OpenAI realtime voices. It did so for **0 of 120+** clips from Azure's Indian voices.
5. Voice Live has two Taxila-specific advantages the native voices lack:
   - **`custom_lexicon_url`** gives deterministic pronunciation of NCERT terms, numerals and formulas.
     Gurukul's IndicF5 misread 6/8 chemical symbols **[P]**.
   - **Word timestamps and visemes** drive the board/avatar sync **[V]**.

   It also accepts **personal voice** in-loop (gated). That corrects Gurukul's "no S2S API accepts a cloned
   voice" **[V]**.
6. **Cost per minute of teacher speech output, at list price [V]+[I] (§4):**
   - native gpt-realtime-2.1 audio: about **$0.082**;
   - Voice Live gpt-realtime-2.1 + Azure voice: about **$0.042**;
   - Azure TTS in a cascade: **$0.011-0.016**.

   Input/context re-processing dominates long sessions on every realtime lane.
7. **Blind-test shortlist (§6): 7 Azure arms, a human anchor and a degraded control.**
   - Native `marin` (the incumbent) and `cedar`.
   - Voice Live `azure-realtime` with `meera` and `diya`.
   - Voice Live + gpt-realtime-2.1 with `hi-IN-Kavya:MAI-Voice-2.1-Flash`, and with
     `en-IN-Meera:DragonHDLatestNeural` (GA fallback).
   - GPT-Live-1 with `marin`, in Round 2 only (it paraphrases, §5).
   - Optional reference arms, never shippable: Sarvam Bulbul v3 and ElevenLabs v4 Turbo, to price what the
     Azure-only rule costs.
   - IndicF5 is a **no** for the live loop (RTF 2.87 on T4, needs a reference clip) **[P]**.
8. **Gate before any lane-C voice can win:** `azure-realtime` is not gpt-realtime-2.1. It must first pass
   Taxila's teacher bake-off (25 words/turn, misconception handling, language mirroring). All pedagogy
   evidence so far is on gpt-realtime-2.1.

---

## 1. Laws carried in (do not re-derive)

| law | where it was measured | consequence for this choice |
|---|---|---|
| Voices are chosen **by ear, blind**, with accent identity as a first-class axis. Pronunciation ≠ accent | Meera `azure-tts`: Hindi words 15/15, first audio 255 ms, 5× cheaper, **rejected by ear** (companion-tech §2.2-2.3) | Today's probe gates candidates and never ranks them |
| Speaker-embedding / Hz scores disagree with ears | Gurukul: ECAPA repeatedly contradicted the owner's verdict; "the Hz anchor is broken as a filter" | No f0 or ECAPA column in the shortlist logic |
| Expressive delivery **lowers** ASR recall | Meera: coral 0.93 vs control 0.71 is **not** a quality ranking | Today's key-term recall column is a floor check (≥0.8), not a score |
| No synthetic backchannels; prosody **hears**, does not **label** | Meera `backchannel`, `prosody-reads-hearing-not-feeling` | Prefer lanes with native audio *input* (A, B, C). Never add "mm/haan" clips |
| Paralinguistic tags in TTS text get **read aloud** | Meera: `[laughs softly]` → spoken "Softly" | On TTS lanes, any style tag must be a documented vendor tag, tested by ear |
| A Hinglish sentence is **one acoustic utterance**; never split per language | Gurukul `hinglish-is-one-acoustic-utterance` (ECAPA 0.825 vs 0.434; 24.6% vs 65.5% silence) | One vendor, one call per utterance; reject per-phrase engine switching |
| The voice must be the same on **every** lane, and the voice identity must be part of every cache key | Meera `cache-outlives-the-voice`, `engine-per-phrase` | Narration TTS and the live voice must come from the **same voice** (§5) |
| Script is a first-class variable | Gurukul: Sarvam ASR returns Devanagari; romanised lexicon measured code-switch 0.000 | Stimuli cover Devanagari, Roman, mixed, numerals and English separately |
| Spoken disclosure **unblinds** every listening test | Gurukul earbench `gurukul-ws-v` | Trim any "I am an AI…" lead-in from blind clips; disclosure is tested separately |
| Brevity and language mirroring are **structural** on gpt-realtime-2.1 | Taxila `realtime-teacher-bakeoff`, `realtime-audio-in` (25 words/turn; mirror rule fixed English drift) | These carry over to Voice Live + gpt-realtime-2.1 because it is the same model |

---

## 2. Which voices can sit inside a realtime loop

"In-loop" means the voice speaks inside one managed session that does VAD, barge-in and truncation, with
the child's audio going natively into the model (so the model hears hesitation, tone and code-switching).

| lane | how | voices for Hindi/Hinglish | audio in → model | barge-in / truncation | pronunciation control | cost of output speech |
|---|---|---|---|---|---|---|
| **A. gpt-realtime-2.1 native** (Azure OpenAI `/openai/v1/realtime`, today's `taxila-realtime`) | single S2S model | `marin`, `cedar` (recommended), `coral`, `shimmer`, `sage`, `verse`, `ash`, `ballad`, `alloy`, `echo` **[V]**; no locale or accent parameter; accent is prompt-only | native | yes (measured 7-260 ms cancel) **[P]** | none; prompt "reference pronunciations" only | $64/M audio tokens ≈ $0.077/min **[V]** |
| **B. Voice Live + gpt-realtime-2.1 + Azure voice** (`wss://<res>.services.ai.azure.com/voice-live/realtime?api-version=2026-04-10&model=gpt-realtime-2.1`) | model emits text, then Azure TTS speaks it, in one managed session | any Azure voice: hi-IN Neural (Swara, Madhur, Aarti, Kavya, Ananya, Arjun, Aarav, Kunal, Rehaan), en-IN Indic Neural (Aarti/Neerja/Arjun/Prabhat), en-IN DragonHD (Diya, Meera, Aarti, Neerja, Lavanya, Arjun), MAI-Voice-2.1(-Flash) hi-IN (Kavya, Priya, Harper, Dhruv, Arjun, Grant), custom/personal voice **[V][M]** | native (gpt-realtime hears the child) | yes, plus `azure_semantic_vad_multilingual` (Hindi listed), server echo cancellation, deep noise suppression, `remove_filler_words` (English filler list only) **[V]** | `custom_lexicon_url`, `rate` 0.5-1.5, HD `temperature`, `locale`/`prefer_locales` fields echoed back **[V][M]** | LLM text out + "Standard Speech Audio Output" $0.031/1K tok ≈ $0.042/min **[V][I]** |
| **C. Voice Live `azure-realtime`** (`model=azure-realtime`) | Microsoft's own realtime model + native voices | `diya` (hi-IN, "crisp, clear bilingual Hindi and Indian-accented English"), `meera` (hi-IN, "calm, warm bilingual … soothing"), `aarti` (en-IN, "warm, rich … guided learning") **[V]** | native to azure-realtime (capability vs gpt-realtime-2.1 **unknown**) | yes **[V]** | none documented | Pro tier; meter for native voices **[U]** |
| **D. Gemini Live** (off-Azure; Meera's measured incumbent) | single S2S model | 10 voices accepted at `hi-IN` (Despina, Aoede, Kore…) **[P]** | native | yes, measured at Meera | none | ~$0.014/min at Meera's measured mix **[P]**; Google prices double on 2027-01-01 **[P]** |
| **E. Self-built cascade** (STT → LLM → streaming TTS) | three vendors | everything in §3.7-3.12 | **text only**: tone and hesitation are lost unless a separate prosody path is built | must be built (Meera's `liveCall.ts` floor) | full SSML/lexicon per vendor | TTS $0.011-0.06/min + STT + LLM |
| **F. Self-hosted** (IndicF5) | GPU service | reference-clip cloning | n/a | n/a | normaliser (Gurukul) | GPU-hours; not realtime (RTF 2.87 on T4) **[P]** |

**What lane B gives up** **[I]**: the native model's own *output* prosody, meaning laughter, whispering and
a warmer delivery when the child sounds upset. These come from the S2S model "deciding how to say it". In
lane B the TTS predicts prosody from text alone (HD voices "detect emotion in input text" **[V]**). MAI
voices take `mstts:express-as` styles; in Voice Live the echo shows a `style` field **[M]** but per-turn
style switching is **not verified**. The model still *hears* the child, because input is native.
Whether it *sounds* less human is exactly what the blind test decides.

**What lane B gains**: Indian voices with a native accent; a pronunciation lexicon; word timestamps and
visemes for board/avatar sync; personal voice later (the "real teacher clone" product) without leaving
the S2S loop; and roughly half the output-speech cost.

---

## 3. Catalogue

### 3.1 gpt-realtime-2.1 native voices (lane A)

- Ten voices. OpenAI: "for best quality, we recommend `marin` or `cedar`". The voice locks once the
  session has emitted audio **[V]**. `audio.output.speed` 0.25-1.5 **[V via tech-and-market §1.6]**.
- No accent/locale control. Indian accent can only be asked for in instructions **[V]**.
- Prior: on `gpt-realtime-mini`, Meera found six voices at 137-192 Hz, "none plausible as an Indian woman",
  and Hinglish "sometimes broken" **[P]**. On 2.1 Taxila measured correct Hinglish pedagogy, but nobody has
  listened for accent **[P]**. Forum reports of 2.1 drifting into an English accent (European languages) **[P]**.
- Already deployed (`taxila-realtime`); 10 RPM quota cap **[P]**.

### 3.2 gpt-4o-mini-tts (cascade; narration twin of lane A)

- Same 13-voice family including `marin`/`cedar` **[V]**. Free-text `instructions` steer "accent, emotional
  range, intonation, impressions, speed, tone, whispering" **[V]**. Hindi is in the language list **[V]**.
- On Azure the **2025-12-15 snapshot** is billed separately (`gpt4o mn tts … 1215`): $0.60/M text in,
  $12/M audio out (global) **[V Azure retail API]**.
- Role: pre-rendered narration that must sound like the live voice if lane A wins. Same-name-same-timbre
  across models is **not** guaranteed (Meera `live-vs-tts-timbre`: f0 within 0.32 st, brightness
  inconclusive) **[P]**. The ear decides whether `marin`(TTS) and `marin`(realtime) are one person.

### 3.3 Azure Speech hi-IN / en-IN Neural (lanes B, E)

- Regional roster (eastus2 `voices/list`, today) **[M]**: hi-IN **Swara** (F, styles cheerful/empathetic/
  newscast), **Aarti**, **Kavya**, **Ananya** (F); **Madhur**, **Arjun**, **Aarav**, **Kunal**, **Rehaan** (M).
  en-IN Neural includes **Neerja** (styles) and the Hinglish-oriented **`*IndicNeural`** voices (Aarti, Neerja,
  Arjun, Prabhat), which "support Hinglish speech synthesis" **[V]**.
- Full SSML: phoneme, lexicon, say-as, prosody **[V]**. $15/M chars (S1 Neural; same in centralindia) **[V]**.
- Prior: this family is what Meera rejected by ear for a 24-year-old Bangalore woman. Companion-tech §2.4
  asks to re-test it because "teacher didi" is a different target **[P]**.

### 3.4 Azure DragonHD / Dragon (lanes B, E)

- en-IN DragonHD, GA: **Diya, Meera, Aarti, Neerja, Lavanya** (F), **Arjun** (M). Tags are "Customer
  Service, Chat"; each lists **91 secondary locales including hi-IN** (one voice, both languages) **[M]**.
- **`hi-IN-Diya:DragonLatestNeural`** is new, in Preview, and hi-IN primary **[M]**. It is probably the
  standalone sibling of Voice Live's native `diya` **[I]**.
- DragonHD: <300 ms latency class, `temperature`, `<lang>`, `<phoneme>`, lexicon alias; **no `<prosody>`**
  **[V]**. Dragon HD Omni (700+ voices, `express-as` styles, multilingual) exists. The name
  `hi-IN-Swara:DragonHDOmniLatestNeural` returned 200 but is not in the roster **[M]**, so treat it as unverified.
- $22/M chars (Neural HD) **[V]**.

### 3.5 MAI-Voice-2.1 / MAI-Voice-2.1-Flash (lanes B, E) — new, Preview

- Microsoft's own expressive TTS. **hi-IN voices: Kavya, Priya, Harper (F); Dhruv, Arjun, Grant (M)**;
  en-IN: Priya, Dhruv **[V][M]**. Kavya/Priya/Dhruv have 18 emotion styles (happy, hopeful, softvoice,
  whispering…); Harper has `educational`, `narrator`, `agent` **[V]**. Flash is "optimized for real-time
  voice agents"; the full model is for "long-form … educational content" **[V]**. Both are in centralindia **[V]**.
- Gated instant cloning from a 5-60 s consented clip **[V]**.
- Public preview, "not recommended for production workloads" **[V]**. Older `MAI-Voice-2(-Flash)` names
  still resolve **[M]**.
- No separate retail meter was found. Flash is probably billed as "Neural/Neural HD Flash" and the full
  model as "Neural HD" **[U]**.

### 3.6 Voice Live `azure-realtime` native voices (lane C)

- `diya`, `meera` (hi-IN), `aarti` (en-IN) among 34 voices. Requires API ≥ `2026-01-01-preview` **[V]**.
  The session echoed `{"name":"diya","type":"azure-realtime-native"}` **[M]**.
- Unknown: the reasoning quality of the `azure-realtime` model itself. Taxila's pedagogy evidence
  (misconception handling, 25-word turns, language mirroring) is all on gpt-realtime-2.1. **Lane C
  must pass the teacher bake-off** (`evals/realtime-bakeoff.mjs`) **before its voice matters.**

### 3.7 Sarvam Bulbul v3 (cascade)

- Released 2026-02-05. 30-35+ professional voice-artist voices (shubh default, priya, kavya, ritu, neha,
  pooja, simran, ishita, shreya, …) and 11 languages incl. hi-IN/en-IN **[V]**. REST (2,500 chars), HTTP
  streaming and **WebSocket** streaming (24 kHz cap; `flush`; `min_buffer_size`) **[V]**. Pace 0.5-2.0,
  temperature 0.01-2.0 **[V]**.
- Vendor-cited third party: a Josh Talks blind A/B, ~2,000 votes per language, >20,000 votes from >500
  annotators. ElevenLabs v3 alpha led on audio quality; Bulbul v3 led at 8 kHz and had the fewest word skips
  and mispronunciations **[V, vendor-reported]**.
- **Script trap:** Sarvam's own docs warn that transliterated (Roman) input "significantly reduces output
  quality" **[V]**. A Roman-Hinglish LLM output would have to be transliterated before synthesis.
- ₹3.00 per 1,000 chars (REST and streaming) **[V]** ≈ $34/M chars at ₹88/$ **[I]**.
- Prior: Gurukul's key returned **HTTP 402** (no audio) **[P]**. Sarvam STT can't own availability **[P]**.
  India-hosted, which is good for DPDP optics **[I]**.

### 3.8 ElevenLabs (cascade, or its own agent platform)

- Hindi on Multilingual v2 and Flash v2.5. v3, v3 Conversational and v4 list 70+/90+ languages without
  naming Hindi on the page **[V]**.
- Latency: Flash v2.5 ~75 ms; v3 Conversational ~280 ms (Text-to-Dialogue WebSocket); **v4 Turbo** ~150 ms
  TTFS over WebSocket. v4 and v4 Turbo shipped **2026-09-28** **[V]**.
- Price per 1K chars: Flash/Turbo $0.04; v3 Conversational $0.04; v3 $0.08; v4 $0.08 (promo $0.022);
  v4 Turbo $0.04 (promo $0.011) until 2026-10-12. "Speech Engine" agents cost $0.08/min **[V]**.
- Strength: the voice library has Indian voice actors (by-ear selection needed) **[T]**. Artificial Analysis
  ranks **Eleven v4 #1 (Elo 1320)**, but that arena is **English-accent filtered** (US/UK) **[V]**, so it is
  not Hindi evidence.

### 3.9 Google Chirp 3 HD / Gemini TTS (cascade)

- Chirp 3 HD supports **hi-IN and en-IN** with streaming synthesis. `speaking_rate` runs 0.25-2.0, pauses
  use `[pause]` markup, custom IPA/X-SAMPA pronunciations are allowed, and **no SSML in streaming** **[V]**.
  Price ≈ $30/M chars **[T]**.
- Gemini TTS: **Gemini 3.8 Flash TTS** and **3.8 Flash-Lite TTS**, 30 voices (the same names as Gemini
  Live), Hindi supported, natural-language `style` field, streaming PCM **[V]**. Artificial Analysis lists
  them at $16.5 / $11 per M chars **[V]**.
- Off-Azure, so it can't be used on the credit grant **[P]**. Meera's cascade lane already used
  `gemini-3.1-flash-tts-preview`, with measured degraded nights of 9.7-11.3 s first frame **[P]**.

### 3.10 Cartesia Sonic 3.6 (cascade)

- Sonic 3.6 adds "expanded support for Hindi transcripts written in **Latin script**, as well as improved
  pronunciation of Indian names and places" **[V]**. That is the only vendor that explicitly targets Roman
  Hinglish input. "Sub-90 ms" latency, 44 languages, nonverbal laughter in the transcript **[V]**.
- Plans: Startup $49 for 1.25M credits, Scale $299 for 8M. ≈ 1 credit/char ⇒ ~$37-39/M chars **[V]+[I]**.
  TTS concurrency is only 5 on Startup and 15 on Scale **[V]**, which binds at classroom scale.
- Artificial Analysis Elo 1273 (#3, English-filtered) **[V]**.

### 3.11 Smallest.ai Lightning v3.1 (cascade) — mentioned for completeness

- India-founded. "sub-100 ms latency", Hindi, Tamil, Kannada and other Indic pages, instant cloning **[V]**.
  Artificial Analysis lists Lightning V3.1 Pro at $19.5/M chars **[V]**. No independent Hindi evidence;
  Gurukul flagged it as a candidate **[P]**.

### 3.12 AI4Bharat IndicF5 (self-host) — not a live-loop candidate

- MIT licence (gated: "only clone voices for which you have explicit permission"), 0.4 B parameters,
  24 kHz, 11 Indic languages, ~1,417 h training data. It **requires a reference clip and its transcript**
  for every synthesis. No streaming **[V]**.
- Gurukul measured on a T4: RTF **2.87**, mixed-script Hinglish WER 0.45, chemical symbols 6/8 wrong, and the
  best identity proxy (ECAPA 0.825) **[P]**. Too slow for a turn and wrong on science text. It remains the
  route only for a future "your own teacher's voice, offline narration" product.

---

## 4. Cost per minute of teacher speech (output side only)

Assumptions: ~20 audio tokens/s out (Azure Voice Live doc **[V]**; OpenAI 1 token per 50 ms **[P]**),
~220 text tokens/min, ~760 chars/min of Hinglish speech (§5 median chars/s × 60), ₹88/$. Context
re-processing (the dominant realtime cost in 45-minute sessions, tech-and-market §1.9) is **excluded**.

| lane / product | $/min of teacher speech | ₹/min |
|---|---|---|
| A. gpt-realtime-2.1 native voice | 0.082 | 7.2 |
| A'. gpt-realtime-2.1-mini native voice (rejected for pedagogy) | 0.025 | 2.2 |
| B. Voice Live Pro: gpt-realtime-2.1 + Azure standard voice | 0.042 | 3.7 |
| B'. Voice Live Std: gpt-realtime-2.1-mini + Azure voice | 0.032 | 2.8 |
| C. Voice Live `azure-realtime` (if billed as LLM audio out **[U]**) | 0.077 | 6.8 |
| E. Azure Neural TTS ($15/M chars) | 0.011 | 1.0 |
| E. Azure Neural HD / DragonHD ($22/M) | 0.017 | 1.5 |
| E. gpt-4o-mini-tts ($12/M audio tok) | 0.014 | 1.3 |
| E. Sarvam Bulbul v3 (₹3/1k chars) | 0.026 | 2.3 |
| E. ElevenLabs Flash v2.5 / v3 Conv / v4 Turbo list ($0.04/1k) | 0.030 | 2.7 |
| E. ElevenLabs v3 / v4 list ($0.08/1k) | 0.061 | 5.4 |
| E. Google Chirp 3 HD (~$30/M **[T]**) | 0.023 | 2.0 |
| E. Cartesia Sonic (~$39/M **[I]**) | 0.030 | 2.6 |

Voice Live Pro retail meters (eastus2 = centralindia, today) **[V]**: LLM audio in $32/M, LLM audio out
$64/M, LLM text in $4/M, text out $16/M (`Text Output 2`: $24/M), Standard Speech audio out $31/M tokens,
Custom Speech audio out $55/M, cached $0.40/M. Whether HD/MAI voices bill as "Standard Speech" is **[U]**:
check the first invoice line.

---

## 5. Measured today — objective gates

<!--PROBE-->

---

## 6. Blind-test shortlist and protocol

### 6.1 Shortlist

Rule for entering the panel: an arm must pass the §5 gates (key-term recall floor ≥ 0.8 on Devanagari and
mixed script; first audio inside its lane budget; reads Roman Hinglish as Hindi rather than English). It
must also be the **best of its vendor in an internal pre-screen**: 2-3 fluent Hindi listeners, blind,
choosing one voice per vendor. That keeps the child panel to ≤ 9 arms.

| # | arm | lane | why it is in |
|---|---|---|---|
| 1 | `marin` (gpt-realtime-2.1 native) | A | incumbent in `taxila-realtime`; every pedagogy number so far was measured with it |
| 2 | `cedar` (gpt-realtime-2.1 native) | A | OpenAI's other "best quality" voice; a lower register in case a "bhaiya/sir" persona is wanted |
| 3 | `meera` (Voice Live `azure-realtime`) | C | the only native-S2S voice described as bilingual hi-IN; "calm, warm, soothing" |
| 4 | `diya` (Voice Live `azure-realtime`) | C | the second bilingual hi-IN native voice; "crisp, clear". This is the clarity end of the axis |
| 5 | `hi-IN-Kavya:MAI-Voice-2.1-Flash` via Voice Live + gpt-realtime-2.1 | B | hi-IN-primary expressive voice with emotion styles, built for agents; keeps gpt-realtime-2.1 pedagogy |
| 6 | `en-IN-Meera:DragonHDLatestNeural` via Voice Live + gpt-realtime-2.1 (pre-screen vs `en-IN-Diya` DragonHD and `hi-IN-Diya:DragonLatestNeural`) | B | GA (not Preview) Indian HD voice with hi-IN as a secondary locale. This is the safe production fallback |
| 7 | Sarvam Bulbul v3, best female speaker by pre-screen (e.g. priya / kavya / ritu / simran) | E | India-native; the strongest vendor claim on Indian languages and code-mix. **Needs a funded key** (Gurukul hit 402) |
| 8 | ElevenLabs v3 Conversational **or** v4 Turbo with an Indian library voice | E | strongest general expressiveness, and v4 Turbo is new (2026-09-28). Tests whether "human" beats "Indian-native" |
| H | **a real Indian teacher**, consented, reading the same stimuli | anchor | "exactly human-like" needs a human reference. Its humanness score is the ceiling every arm is judged against |
| C | degraded control: arm 6 at 8 kHz with −6 dB SNR noise | anchor | low anchor plus catch trials (exclude listeners < 90% catch accuracy, per Gurukul) |

Not shortlisted, with reasons:
- Native `coral/shimmer/sage/verse/ash/ballad/alloy/echo`: the internal pre-screen picks at most one of them
  to challenge `marin`.
- gpt-4o-mini-tts: it is the narration twin of whichever lane-A voice wins, so it is tested as "same person?"
  rather than as a candidate.
- Plain hi-IN Neural (Swara, Madhur…): the Meera ear verdict family. Keep one (Swara) only if the pre-screen
  rates it above arm 6.
- Chirp 3 HD / Gemini TTS / Cartesia / Smallest: cascade-only and off-Azure, with no Hindi evidence beyond
  vendor claims. Bring one in only if arms 7-8 both fail the gates.
- IndicF5: not realtime-capable (§3.12).

### 6.2 Two rounds, because the lanes differ in *what* they control

- **Round 1 — voice identity, fixed text.** Every arm reads the same 24 meaning-matched stimuli: 6 groups ×
  {Devanagari, Roman Hinglish, mixed script} + 6 English, all K-9 maths/science with numerals, units and
  formulas (Gurukul F4 protocol, adapted). In-loop arms are driven verbatim, as in today's probe. This
  isolates accent, warmth, clarity and code-switch smoothness from content.
- **Round 2 — the live system, same child turns.** Feed each in-loop arm the same scripted child audio
  turns (the `evals/realtime-audio-in.mjs` stimuli, re-voiced by 2-3 consented real children once available)
  and record the teacher's replies. This round can show the one thing lane B might lose: prosody that
  follows the child, such as a softer reply after a hesitant answer. Words differ between arms, so judge
  pairwise on "which teacher would you rather learn from" and "is this a real person", not on content.

### 6.3 Listeners, axes and decision rule

- Listeners: children in Classes 3-8 and their parents, Hindi-belt and non-Hindi-belt, plus 3 teachers.
  ≥ 20 fluent listeners and ≥ 800 judgments before any "indistinguishable from human" claim (Gurukul).
- Axes, scored **separately** and never folded into one MOS: (1) sounds like a real person,
  (2) sounds Indian, meaning someone from here and not a foreigner speaking Hindi, (3) warmth ("would you
  like her as your didi/teacher"), (4) clarity for a 7-year-old, (5) code-switch smoothness, (6) science/
  maths term pronunciation. Children aged 6-9 do pairwise forced choice with pictures (two faces, "which
  didi?") instead of scales.
- Decision rule: a lane wins only if the 95% lower bound of paired preference is > 50% on axes 1-2
  against every other in-loop arm (two-level bootstrap over listeners and prompt groups). "Not
  significant" is reported as **inconclusive**, never as "indistinguishable" (Gurukul).

### 6.4 Blinding hygiene (each of these has unblinded a test before)

- Loudness-normalise every clip to the same integrated LUFS (today's raw clips span several LU, §5) and
  resample to one format (24 kHz mono, same codec and bitrate).
- Trim leading and trailing silence to a fixed pad, so a lane can't be spotted by its onset gap.
- Remove any spoken AI disclosure from Round-1 clips (Gurukul `gurukul-ws-v`). Disclosure behaviour is a
  separate gate.
- File names are HMAC ids and the order is Latin-square randomised. Voice names never appear in the UI.
- Fix seeds and never regenerate a clip "because it sounded off". Three takes per prompt, all kept.


---

## 7. What would change this

| if… | then… |
|---|---|
| Children and parents prefer a lane-A native voice (`marin`/`cedar`) by ear | keep today's `taxila-realtime` path. Narration must use gpt-4o-mini-tts with the **same** voice, and the ear checks that the two sound like one person |
| A lane-B Indian voice wins by ear and lane-B Round-2 clips are not judged "flatter" than lane A | move the live call to Voice Live with `model=gpt-realtime-2.1` and that Azure voice. Narration uses the same Azure voice via Speech REST, and pronunciation goes through one lexicon file shared by both |
| Lane C (`azure-realtime`) passes `evals/realtime-bakeoff.mjs` (25 words/turn, correct misconception handling, language mirroring) **and** its voice wins | it becomes the simplest single-model path with native Indian voices. Until then its voice can't win on voice alone |
| A cascade-only vendor (Sarvam, ElevenLabs) wins by a 95% lower bound > 50% over every in-loop arm | price the cascade honestly: +STT, a hand-built barge-in floor (Meera's `liveCall.ts`/echosim), loss of native audio input, 1.5-3 s turns. Ask the vendor about S2S partnerships before building |
| MAI-Voice-2.1 stays Preview at launch | don't ship a Preview voice to minors without an SLA. Fall back to the DragonHD / Neural sibling that ranked next by ear |
| Voice Live adds measurable latency over direct realtime from India | test a `centralindia` Voice Live resource (azure-realtime and gpt-realtime-2.1 are offered there as Global Standard) before deciding |
| Promotional prices end (ElevenLabs v4/v4 Turbo on 2026-10-12) or Google doubles prices (2027-01-01) | re-run §4 from the retail API (`prices.azure.com` filter in §5 method) and vendor pages |

---

## 8. Sources

Primary documents fetched 2026-10-02 (via WebFetch; the WebSearch quota was exhausted for this session):

- Azure Voice Live overview: models, tiers and the "option to use Azure text to speech voices": https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live
- Voice Live how-to: voice object, `azure-realtime` native voices, HD regions, rate, timestamps, visemes, turn detection, Live-Reference AEC: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to
- Voice Live customization: `custom_lexicon_url`, custom voice, personal voice in-loop: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to-customize
- Voice Live language support (input models, Azure TTS output): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-language-support
- Azure Speech regions (Voice Live per region incl. centralindia; MAI/HD TTS regions): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions
- Azure HD voices (DragonHD, Omni, Flash, SSML subset, parameters): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices
- MAI-Voice-2.1 / 2.1-Flash (Preview), hi-IN voices and styles: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/mai-voices
- Azure TTS language and voice support (hi-IN / en-IN, IndicNeural): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
- Azure retail prices API (all $ figures for Azure in this doc): https://prices.azure.com/api/retail/prices (filters in §5 method)
- OpenAI TTS guide (gpt-4o-mini-tts voices, instructions, languages): https://developers.openai.com/api/docs/guides/text-to-speech
- OpenAI realtime conversations (voices, lock after first audio): https://developers.openai.com/api/docs/guides/realtime-conversations
- Sarvam Bulbul v3 model page: https://docs.sarvam.ai/api-reference-docs/getting-started/models/bulbul
- Sarvam TTS REST and streaming: https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert and https://docs.sarvam.ai/api-reference-docs/text-to-speech/api/streaming
- Sarvam Bulbul v3 launch blog (Josh Talks blind A/B, vendor-cited): https://www.sarvam.ai/blogs/bulbul-v3
- Sarvam pricing: https://www.sarvam.ai/api-pricing
- ElevenLabs models: https://elevenlabs.io/docs/models · capabilities: https://elevenlabs.io/docs/overview/capabilities/text-to-speech · pricing: https://elevenlabs.io/pricing/api · v4 launch: https://elevenlabs.io/blog/eleven-v4
- Google Chirp 3 HD: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd · Gemini TTS: https://ai.google.dev/gemini-api/docs/speech-generation
- Cartesia models: https://docs.cartesia.ai/build-with-cartesia/tts-models/latest · Sonic: https://cartesia.ai/sonic · pricing: https://cartesia.ai/pricing
- Smallest.ai Lightning: https://smallest.ai/text-to-speech
- AI4Bharat IndicF5: https://huggingface.co/ai4bharat/IndicF5 · https://github.com/AI4Bharat/IndicF5
- Artificial Analysis TTS arena (English-accent filtered; not Hindi evidence): https://artificialanalysis.ai/text-to-speech/leaderboard

In-repo priors: `docs/harvest/companion-tech.md` §1, §2, §11.3 and §R; `docs/harvest/gurukul.md` §0, §3.5-3.7;
`context/measurements.md` (`realtime-teacher-bakeoff-2026-10-02`, `realtime-audio-in-2026-10-02`);
`docs/research/tech-and-market.md` §1.6, §1.8-1.9, §5.
