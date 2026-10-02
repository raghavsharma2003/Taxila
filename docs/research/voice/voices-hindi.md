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
     native OpenAI realtime voices. It did so for **0 of 84** Hindi clips from Azure's Indian voices (TTS, Voice Live and `azure-realtime`).
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
   - GPT-Live-1 with `marin`, in Round 2 only (it paraphrases, §3.1b).
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
| The voice must be the same on **every** lane, and the voice identity must be part of every cache key | Meera `cache-outlives-the-voice`, `engine-per-phrase` | Narration TTS and the live voice must come from the **same voice** (§3.2) |
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
| **A+. GPT-Live-1** (`taxila-live`, `wss://…openai.azure.com/openai/v1/live/sessions`) | full-duplex S2S; a backend reasons via delegation | OpenAI voices (default `marin`); voice and instructions immutable after `session.start` **[V]** | native, continuous | full-duplex by design | none | ≈ $3/h flat voice **[P, tech-and-market §1.9, secondary source]** |
| **C. Voice Live `azure-realtime`** (`model=azure-realtime`) | Microsoft's own realtime model + native voices | `diya` (hi-IN, "crisp, clear bilingual Hindi and Indian-accented English"), `meera` (hi-IN, "calm, warm bilingual … soothing"), `aarti` (en-IN, "warm, rich … guided learning") **[V]** | native to azure-realtime (capability vs gpt-realtime-2.1 **unknown**) | yes **[V]** | none documented | Pro tier; meter for native voices **[U]** |
| **E. Self-built cascade, Azure TTS** (STT → LLM → Azure Speech / gpt-4o-mini-tts) | three Azure services | §3.2-3.5 | **text only**: tone and hesitation are lost unless a separate prosody path is built | must be built (Meera's `liveCall.ts` floor) | full SSML + lexicon | TTS $0.011-0.016/min + STT + LLM |
| *D. Gemini Live (off-Azure, research-only)* | single S2S model | 10 voices accepted at `hi-IN` (Despina, Aoede, Kore…) **[P]** | native | yes, measured at Meera | none | ~$0.014/min at Meera's measured mix; Google prices double on 2027-01-01 **[P]** |
| *E'. Third-party cascade (research-only)* | Sarvam / ElevenLabs / Cartesia / Google TTS | §3.7-3.11 | text only | must be built | per vendor | $0.022-0.06/min TTS |
| *F. Self-hosted IndicF5 (open model on Azure GPU: allowed, but not viable)* | GPU service | reference-clip cloning | n/a | n/a | normaliser (Gurukul) | GPU-hours; not realtime (RTF 2.87 on T4) **[P]** |

Regions **[V]**: Voice Live serves `azure-realtime`, `gpt-realtime-2.1` and `gpt-realtime-2.1-mini` from
**centralindia** as Global Standard, and MAI and HD TTS are hosted in centralindia. So the session endpoint
can sit next to Indian users. Global Standard may run inference elsewhere **[I]**; measure before assuming
a saving.

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
  session has emitted audio **[V]**. `audio.output.speed` 0.25-1.5 **[P, tech-and-market §1.6]**.
- No accent/locale control. Indian accent can only be asked for in instructions **[V]**.
- Prior: on `gpt-realtime-mini`, Meera found six voices at 137-192 Hz, "none plausible as an Indian woman",
  and Hinglish "sometimes broken" **[P]**. On 2.1 Taxila measured correct Hinglish pedagogy, but nobody has
  listened for accent **[P]**. Forum reports of 2.1 drifting into an English accent (European languages) **[P]**.
- Already deployed (`taxila-realtime`); 10 RPM quota cap **[P]**.
- Today **[M]**: first audio after `response.create` (text in) had a median of 776 ms across 10 voices × 5
  (p90 1165, range 455-1840). The voice reads verbatim (token fidelity 0.99-1.00). The unhinted ASR heard
  **6 of 40 Hindi clips as Urdu or Bengali** (verse 2, marin 1, sage 1, alloy 1, ballad 1 Bengali).

### 3.1b GPT-Live-1 (`taxila-live`) — lane A+

- Full-duplex; a backend reasons via delegation. Context is injected via `session.instructions.append`,
  `session.thinking.append` (quiet) and `session.commentary.append` ("say aloud, may paraphrase"), each
  ≤ 500 tokens **[V]**. Default voice `marin`, immutable after start **[V]**.
- Today **[M]**: the session is **clocked by input audio**. With no input frames, commentary was acknowledged
  but never spoken. With 40 ms silence frames streaming, first audio came **662-665 ms** after the append
  (n=2, voices marin/cedar). The commentary channel **does not read verbatim**:
  - marin added its own teaching on 2/5 stimuli;
  - both voices turned the English stimulus into Hinglish (2/2).

  So GPT-Live can be judged only in Round 2 (§6.2). The language move matters for an English-mode lesson,
  where the language-mirror rule must be re-tested on GPT-Live.

### 3.2 gpt-4o-mini-tts (cascade; narration twin of lane A)

- Same 13-voice family including `marin`/`cedar` **[V]**. Free-text `instructions` steer "accent, emotional
  range, intonation, impressions, speed, tone, whispering" **[V]**. Hindi is in the language list **[V]**.
- On Azure the **2025-12-15 snapshot** is billed separately (`gpt4o mn tts … 1215`): $0.60/M text in,
  $12/M audio out (global) **[V Azure retail API]**.
- Role: pre-rendered narration that must sound like the live voice if lane A wins. Same-name-same-timbre
  across models is **not** guaranteed (Meera `live-vs-tts-timbre`: f0 within 0.32 st, brightness
  inconclusive) **[P]**. The ear decides whether `marin`(TTS) and `marin`(realtime) are one person.
- Today **[M]**: streaming first byte was a median of **283 ms** (n=50, 10 voices, with an Indian-accent shape
  note) and 279 ms without the note (n=10). The unhinted ASR heard 2/40 Hindi clips as Urdu, both from `verse`.
- Note text: the probe's `ACCENT_NOTE` describes a voice and contains no line she could say (law 1). Whether
  it shifts the accent toward Indian is an ear question. Pairs `tts:marin` / `tts0:marin` are in the pack.

### 3.3 Azure Speech hi-IN / en-IN Neural (lanes B, E)

- Regional roster (eastus2 `voices/list`, today) **[M]**: hi-IN **Swara** (F, styles cheerful/empathetic/
  newscast), **Aarti**, **Kavya**, **Ananya** (F); **Madhur**, **Arjun**, **Aarav**, **Kunal**, **Rehaan** (M).
  en-IN Neural includes **Neerja** (styles) and the Hinglish-oriented **`*IndicNeural`** voices (Aarti, Neerja,
  Arjun, Prabhat), which "support Hinglish speech synthesis" **[V]**.
- Full SSML: phoneme, lexicon, say-as, prosody **[V]**. $15/M chars (S1 Neural; same in centralindia) **[V]**.
- Prior: this family is what Meera rejected by ear for a 24-year-old Bangalore woman. Companion-tech §2.4
  asks to re-test it because "teacher didi" is a different target **[P]**.
- Today **[M]**: REST (not streamed; first byte ≈ full synthesis) gave a median of 691 ms, with
  `hi-IN-AartiNeural` an outlier at ~2.1 s. All hi-IN voices read **Roman Hinglish as Hindi**: the ASR
  returned clean Devanagari for s2 on every arm. So the Sarvam-style "Roman input degrades" trap was not
  seen here. Whether Roman input *sounds* worse is an ear question.

### 3.4 Azure DragonHD / Dragon (lanes B, E)

- en-IN DragonHD, GA: **Diya, Meera, Aarti, Neerja, Lavanya** (F), **Arjun** (M). Tags are "Customer
  Service, Chat"; each lists **91 secondary locales including hi-IN** (one voice, both languages) **[M]**.
- **`hi-IN-Diya:DragonLatestNeural`** is new, in Preview, and hi-IN primary **[M]**. It is probably the
  standalone sibling of Voice Live's native `diya` **[I]**.
- DragonHD: <300 ms latency class, `temperature`, `<lang>`, `<phoneme>`, lexicon alias; **no `<prosody>`**
  **[V]**. Dragon HD Omni (700+ voices, `express-as` styles, multilingual) exists. The name
  `hi-IN-Swara:DragonHDOmniLatestNeural` returned 200 but is not in the roster **[M]**, so treat it as unverified.
- $22/M chars (Neural HD) **[V]**.
- Today **[M]**: DragonHD en-IN over REST gave a median first byte of **2077 ms** (n=15), because REST returns
  after full synthesis. In Voice Live, `en-IN-Meera:DragonHDLatestNeural` gave first audio at a median of
  899 ms behind gpt-realtime-2.1 (n=5), so streaming hides most of it. They read Devanagari Hindi as Hindi
  (recall 1.0); speech rate was the fastest of all arms (14-15 chars/s vs ~12 median).
  `hi-IN-Diya:DragonLatestNeural`: 629 ms REST.

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
- Today **[M]**:
  - Flash REST gave a median first byte of **519 ms** (n=20); the full model gave 1139 ms.
  - `Priya` speaks **~40% slower** than every other arm (6.8 chars/s). It expanded "cm" to "centimeter" and
    added a "है". Pace is part of the voice and can be set with `rate`, so judge it by ear.
  - The full-model `Kavya` split Roman "tukde" into "tuk de" (recall 0.6 on s2); its Flash sibling did not.

### 3.6 Voice Live `azure-realtime` native voices (lane C)

- `diya`, `meera` (hi-IN), `aarti` (en-IN) among 34 voices. Requires API ≥ `2026-01-01-preview` **[V]**.
  The session echoed `{"name":"diya","type":"azure-realtime-native"}` **[M]**.
- Unknown: the reasoning quality of the `azure-realtime` model itself. Taxila's pedagogy evidence
  (misconception handling, 25-word turns, language mirroring) is all on gpt-realtime-2.1. **Lane C
  must pass the teacher bake-off** (`evals/realtime-bakeoff.mjs`) **before its voice matters.**
- Today **[M]**: first audio after `response.create` (text in) had a median of **476 ms**
  (n=15, range 384-687): the fastest in-loop lane measured. All 3 voices read verbatim, recall was 1.0, and
  0/12 Hindi clips were heard as another language. One session (`aarti`) timed out on the first attempt;
  it succeeded on retry (n=1 failure in 4 sessions).

### 3.7-3.11 Third-party TTS (cascade only) — research-only under `azure-only-compute`

| vendor / model | Hindi voices and controls | latency, streaming | price | evidence and traps |
|---|---|---|---|---|
| **Sarvam Bulbul v3** (2026-02-05) | 30-35+ voice-artist speakers (shubh, priya, kavya, ritu, neha, simran, ishita…); 11 langs incl. hi-IN/en-IN; pace 0.5-2.0, temperature 0.01-2.0 **[V]** | REST (2,500 chars), HTTP and **WebSocket** streaming (24 kHz cap, `flush`) **[V]** | ₹3.00/1k chars ≈ $34/M **[V][I]** | Josh Talks blind A/B (>20k votes, >500 annotators, vendor-cited): ElevenLabs v3 led on quality; Bulbul led at 8 kHz and on fewest skips/mispronunciations **[V]**. Sarvam warns Roman input "significantly reduces output quality" **[V]**. Gurukul key hit HTTP 402 **[P]** |
| **ElevenLabs** Flash v2.5, v3 Conversational, v4 / **v4 Turbo** (2026-09-28) | Hindi on Multilingual v2 and Flash v2.5; v3/v4 list 70+/90+ langs without naming Hindi **[V]**; Indian library voices **[T]** | Flash ~75 ms; v3 Conv ~280 ms; v4 Turbo ~150 ms TTFS over WebSocket **[V]** | $0.04-0.08/1k chars; v4 promos until 2026-10-12; agents $0.08/min **[V]** | Artificial Analysis Elo #1 (v4, 1320), but that arena is US/UK-accent filtered **[V]**, so it is not Hindi evidence |
| **Google** Chirp 3 HD; Gemini 3.8 Flash / Flash-Lite TTS | Chirp 3 HD hi-IN + en-IN, `speaking_rate`, `[pause]` markup, IPA/X-SAMPA, no SSML in streaming; Gemini TTS 30 voices, natural-language `style` **[V]** | streaming PCM **[V]** | Chirp ≈ $30/M **[T]**; Gemini $16.5 / $11 per M (AA) **[V]** | Meera's cascade used Gemini TTS: degraded nights 9.7-11.3 s first frame **[P]** |
| **Cartesia** Sonic 3.6 | "expanded support for Hindi transcripts written in **Latin script**", better Indian names; nonverbal laughter **[V]** | "sub-90 ms" **[V]** | ≈ $37-39/M (≈ 1 credit/char) **[I]** | TTS concurrency 5 (Startup) / 15 (Scale) binds at class scale **[V]**; AA Elo 1273 (English-filtered) |
| **Smallest.ai** Lightning v3.1 | Hindi + Indic pages, instant cloning **[V]** | "sub-100 ms" **[V]** | $19.5/M (AA) **[V]** | no independent Hindi evidence; flagged by Gurukul **[P]** |

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
~220 text tokens/min, **~720 chars/min** of Hinglish speech (measured median 12.0 chars/s × 60, §5), ₹88/$. Context
re-processing (the dominant realtime cost in 45-minute sessions, tech-and-market §1.9) is **excluded**.

| lane / product | $/min of teacher speech | ₹/min |
|---|---|---|
| A. gpt-realtime-2.1 native voice | 0.082 | 7.2 |
| A'. gpt-realtime-2.1-mini native voice (rejected for pedagogy) | 0.025 | 2.2 |
| B. Voice Live Pro: gpt-realtime-2.1 + Azure standard voice | 0.042 | 3.7 |
| B'. Voice Live Std: gpt-realtime-2.1-mini + Azure voice | 0.032 | 2.8 |
| C. Voice Live `azure-realtime` (if billed as LLM audio out **[U]**) | 0.077 | 6.8 |
| A+. GPT-Live-1 (flat ≈ $3/h of session, not of speech **[P]**) | ≈ 0.05 per session-minute | ≈ 4.4 |
| E. Azure Neural TTS ($15/M chars) | 0.011 | 0.9 |
| E. Azure Neural HD / DragonHD ($22/M) | 0.016 | 1.4 |
| E. gpt-4o-mini-tts ($12/M audio tok) | 0.014 | 1.3 |
| *E'. Sarvam Bulbul v3 (₹3/1k chars), research-only* | 0.025 | 2.2 |
| *E'. ElevenLabs Flash v2.5 / v3 Conv / v4 Turbo list ($0.04/1k)* | 0.029 | 2.5 |
| *E'. ElevenLabs v3 / v4 list ($0.08/1k)* | 0.058 | 5.1 |
| *E'. Google Chirp 3 HD (~$30/M **[T]**)* | 0.022 | 1.9 |
| *E'. Cartesia Sonic (~$39/M **[I]**)* | 0.028 | 2.5 |

Voice Live Pro retail meters (eastus2 = centralindia, today) **[V]**: LLM audio in $32/M, LLM audio out
$64/M, LLM text in $4/M, text out $16/M (`Text Output 2`: $24/M), Standard Speech audio out $31/M tokens,
Custom Speech audio out $55/M, cached $0.40/M. Whether HD/MAI voices bill as "Standard Speech" is **[U]**:
check the first invoice line. Re-query: `prices.azure.com/api/retail/prices` with
`$filter=serviceName eq 'Foundry Tools' and productName eq 'Azure Speech' and armRegionName eq 'eastus2'`
(Voice Live, TTS). For realtime and TTS model meters, use `armRegionName eq 'eastus2'` with `contains(meterName,'tts')`
or `productName eq 'Azure OpenAI Media'`.

---

## 5. Measured today — objective gates

**Method (2026-10-02, n = 5 clips per arm, 44 arms + 2 GPT-Live arms, 221 clips).**
- Harness: `docs/research/voice/probe-voices-hindi.mjs`, then `asr-rescore.mjs`, then `analyze-voice-probe.py`.
  Run from the US build container against the eastus2 resource; add India↔eastus2 RTT for real users.
- Stimuli: 5 K-9 teacher lines, one per script condition: Devanagari, Roman Hinglish, mixed script,
  numerals/formula, Indian English.
- First audio is measured per lane:
  - REST TTS: request → first body byte. Azure Speech REST is not streamed, so this ≈ full synthesis.
  - gpt-4o-mini-tts: streamed PCM.
  - S2S lanes: text-in `response.create` → first audio delta. This is model + voice latency, **not**
    end-of-child-speech latency (that is `realtime-audio-in-2026-10-02`).
- Intelligibility proxy: two gpt-4o-transcribe passes (no hint; `language=hi`) and 5 bilingual key terms per
  line. "Raw" counts Devanagari/Latin spellings only; "script-aware" also accepts Urdu spellings of the same
  spoken word.
- Loudness: ffmpeg `ebur128`, raw output before normalisation.
- Compact results (no audio): `probe-2026-10-02-results.json`. Blinded, loudness-normalised clips for the
  internal pre-screen (34 Azure arms × 5): `prescreen-2026-10-02/` (4.4 MB).

**By lane [M]:**

| lane | clips | first audio median (p90) ms | range ms | Hindi clips the ASR wrote in another script |
|---|---|---|---|---|
| A. gpt-realtime-2.1 native (10 voices) | 50 | 776 (1165) | 455-1840 | **6/40** (Urdu 5, Bengali 1) |
| A via Voice Live (`marin`, type `openai`) | 5 | 528 (642) | 499-642 | 2/4 |
| A+. GPT-Live-1 (`marin`, `cedar`; first stimulus only) | 2 | 663 | 662-665 | 0/2 |
| B. Voice Live gpt-realtime-2.1 + Azure voice (MAI Kavya Flash, DragonHD Meera) | 10 | 858 (1009) | 579-1022 | 0/8 |
| C. Voice Live `azure-realtime` (diya, meera, aarti) | 15 | **476** (611) | 384-687 | 0/12 |
| E. gpt-4o-mini-tts, streamed (10 voices + Indian-accent note) | 50 | **283** (335) | 249-778 | 2/40 (`verse`) |
| E. Azure MAI-Voice-2.1-Flash REST (4 voices) | 20 | 519 (672) | 368-1165 | 0/16 |
| E. Azure Neural REST (7 voices) | 35 | 691 (1984) | 208-4941 | 0/28 |
| E. Azure DragonHD en-IN REST (3 voices) | 15 | 2077 (2326) | 1653-2432 | 0/12 |

**By arm [M]** (n = 5 each; recall is a floor check, not a ranking — law 3):

| arm | first audio, median ms | recall raw / script-aware | non-Hindi-script ASR passes (of 2 × 4 Hindi clips) | chars/s | raw LUFS |
|---|---|---|---|---|---|
| `tts:marin` | 525 (first call of the run, cold) | 1.00 / 1.00 | 0/8 | 13.3 | -21.1 |
| `tts:cedar` | 278 | 1.00 / 1.00 | 0/8 | 11.1 | -21.4 |
| `tts:coral` | 289 | 1.00 / 1.00 | 0/8 | 10.4 | -27.2 |
| `tts:shimmer` | 280 | 1.00 / 1.00 | 0/8 | 11.6 | -20.2 |
| `tts:sage` | 293 | 1.00 / 1.00 | 0/8 | 10.6 | -31.1 |
| `tts:ballad` | 290 | 1.00 / 1.00 | 0/8 | 10.8 | -24.9 |
| `tts:verse` | 278 | 0.68 / 0.96 | 2/8 | 10.1 | -23.7 |
| `tts:ash` | 286 | 1.00 / 1.00 | 0/8 | 10.7 | -22.8 |
| `tts:alloy` | 276 | 1.00 / 1.00 | 0/8 | 11.8 | -19.2 |
| `tts:echo` | 277 | 1.00 / 1.00 | 0/8 | 11.8 | -20.8 |
| `tts0:marin` | 282 | 1.00 / 1.00 | 0/8 | 11.5 | -21.6 |
| `tts0:coral` | 279 | 1.00 / 1.00 | 0/8 | 11.4 | -27.6 |
| `az:hi-IN-SwaraNeural` | 438 | 1.00 / 1.00 | 0/8 | 10.3 | -20.2 |
| `az:hi-IN-AartiNeural` | 2088 | 1.00 / 1.00 | 0/8 | 13.3 | -19.6 |
| `az:hi-IN-KavyaNeural` | 610 | 1.00 / 1.00 | 0/8 | 11.3 | -19.1 |
| `az:hi-IN-AnanyaNeural` | 600 | 0.96 / 1.00 | 0/8 | 11.7 | -19.5 |
| `az:hi-IN-MadhurNeural` | 711 | 1.00 / 1.00 | 0/8 | 10.0 | -16.9 |
| `az:en-IN-AartiIndicNeural` | 691 | 1.00 / 1.00 | 0/8 | 12.9 | -18.7 |
| `az:en-IN-NeerjaIndicNeural` | 643 | 1.00 / 1.00 | 0/8 | 13.6 | -20.1 |
| `az:en-IN-Meera:DragonHDLatestNeural` | 2177 | 1.00 / 1.00 | 0/8 | 14.4 | -23.7 |
| `az:en-IN-Diya:DragonHDLatestNeural` | 2077 | 0.96 / 0.96 | 0/8 | 15.3 | -23.5 |
| `az:en-IN-Aarti:DragonHDLatestNeural` | 1971 | 1.00 / 1.00 | 0/8 | 14.9 | -18.2 |
| `az:hi-IN-Diya:DragonLatestNeural` | 629 | 1.00 / 1.00 | 0/8 | 14.7 | -19.9 |
| `az:hi-IN-Kavya:MAI-Voice-2.1-Flash` | 505 | 1.00 / 1.00 | 0/8 | 11.4 | -18.2 |
| `az:hi-IN-Priya:MAI-Voice-2.1-Flash` | 641 | 0.88 / 1.00 | 0/8 | 6.8 | -20.0 |
| `az:hi-IN-Harper:MAI-Voice-2.1-Flash` | 472 | 1.00 / 1.00 | 0/8 | 10.2 | -15.8 |
| `az:hi-IN-Dhruv:MAI-Voice-2.1-Flash` | 533 | 1.00 / 1.00 | 0/8 | 9.9 | -21.7 |
| `az:hi-IN-Kavya:MAI-Voice-2.1` | 1139 | 0.92 / 0.92 | 0/8 | 13.1 | -17.0 |
| `rt:marin` | 652 | 0.88 / 0.92 | 2/8 | 11.8 | -23.5 |
| `rt:cedar` | 773 | 1.00 / 1.00 | 0/8 | 11.4 | -22.3 |
| `rt:coral` | 888 | 1.00 / 1.00 | 0/8 | 11.3 | -26.0 |
| `rt:shimmer` | 534 | 1.00 / 1.00 | 0/8 | 11.0 | -20.2 |
| `rt:sage` | 640 | 0.80 / 1.00 | 2/8 | 10.9 | -31.7 |
| `rt:ballad` | 1170 | 0.92 / 0.92 | 2/8 | 10.7 | -26.8 |
| `rt:verse` | 560 | 0.60 / 0.96 | 4/8 | 10.4 | -24.3 |
| `rt:ash` | 767 | 0.96 / 1.00 | 0/8 | 11.7 | -24.5 |
| `rt:alloy` | 830 | 0.92 / 0.96 | 1/8 | 12.1 | -18.8 |
| `rt:echo` | 1081 | 1.00 / 1.00 | 0/8 | 11.1 | -22.4 |
| `vl:azure-realtime + diya` | 455 | 1.00 / 1.00 | 0/8 | 12.6 | -24.4 |
| `vl:azure-realtime + meera` | 499 | 1.00 / 1.00 | 0/8 | 12.4 | -21.8 |
| `vl:gpt-realtime-2.1 + hi-IN-Kavya:MAI-Voice-2.1-Flash` | 858 | 0.96 / 0.96 | 0/8 | 11.6 | -18.1 |
| `vl:gpt-realtime-2.1 + en-IN-Meera:DragonHDLatestNeural` | 899 | 1.00 / 1.00 | 0/8 | 14.5 | -24.5 |
| `vl:gpt-realtime-2.1 + marin` | 528 | 0.72 / 1.00 | 3/8 | 11.5 | -23.1 |
| `vl:azure-realtime + aarti` | 438 | 1.00 / 1.00 | 0/8 | 11.3 | -19.1 |

**What the numbers say, and what they don't:**
- **Every arm clears the intelligibility floor** (script-aware recall ≥ 0.92). The gate does not discriminate,
  as Meera's ASR-recall trap predicted. Ranking stays with ears.
- **Voice Live does not tax latency.** The same `marin` voice gave 528 ms through Voice Live vs 652 ms direct,
  so there is no measurable overhead (n=5 each, different sessions). Swapping in an Azure TTS voice adds ≈ 330-370 ms
  (text → TTS first chunk).
- **`azure-realtime` is the fastest in-loop lane** (476 ms). Its pedagogy is unmeasured (§3.6).
- **Language-ID signal [M], interpretation [I]:**
  - On Hindi lines, the unhinted ASR (gpt-4o-transcribe) chose Urdu or Bengali script for 6/40 native OpenAI
    realtime clips and 2/4 via Voice Live. It never did so for any of 84 Hindi clips from Azure's Indian voices or
    `azure-realtime`.
  - Even with `language=hi` the ASR kept Urdu script on some clips, and it is stochastic: one clip flipped
    between runs.
  - Read it as "the acoustics leave the Hindi/Urdu/Bengali decision open". That **predicts nothing** about
    how a child hears her, and it is the strongest objective hint that the **accent axis must be in the
    panel**.
- **Loudness spread is 16 LU** (−31.7 to −15.8 LUFS raw). Unnormalised, the loud arms would win on loudness
  alone, so §6.4 normalisation is mandatory.
- **Speech rate varies 6.8-15.3 chars/s.** Priya (MAI) is slow and DragonHD en-IN is fast. Rate is part of a
  voice and is tunable (`rate`, `speed`). Judge each at its default, then pre-screen the winner at
  0.9× for Classes 1-4.
- **Not measured:**
  - children's ears;
  - first audio from India;
  - Round-2 prosody that follows the child;
  - Voice Live `style` per turn;
  - lexicon effect;
  - cost on a real invoice.

---

## 6. Blind-test shortlist and protocol

### 6.1 Shortlist (Azure-shippable arms decide; reference arms only calibrate)

Entry rule: pass the §5 gates (all current arms do), then win an **internal blind pre-screen**:
2-3 fluent Hindi listeners rate the `prescreen-2026-10-02/` pack (34 arms × 5 lines, loudness-matched,
blinded `V01-V34`) and pick the best voice per lane. That keeps the child panel at ≤ 10 arms.

| # | arm | lane | why it is in |
|---|---|---|---|
| 1 | `marin`, gpt-realtime-2.1 native | A | incumbent in `taxila-realtime`; every pedagogy number so far was measured with it |
| 2 | `cedar` (or the pre-screen's best other native voice), gpt-realtime-2.1 | A | OpenAI's other "best quality" voice; gives a lower register if a "bhaiya/sir" persona is wanted. 0/8 non-Hindi-script ASR passes today |
| 3 | `meera`, Voice Live `azure-realtime` | C | native S2S, described as bilingual hi-IN, "calm, warm, soothing"; 476 ms lane median |
| 4 | `diya`, Voice Live `azure-realtime` | C | the second bilingual hi-IN native voice, "crisp, clear": the clarity end of the axis |
| 5 | `hi-IN-Kavya:MAI-Voice-2.1-Flash` via Voice Live + gpt-realtime-2.1 (pre-screen vs Harper/Priya/Dhruv) | B | hi-IN-primary expressive voice built for agents; keeps gpt-realtime-2.1 pedagogy. **Preview** |
| 6 | `en-IN-Meera:DragonHDLatestNeural` via Voice Live + gpt-realtime-2.1 (pre-screen vs `en-IN-Diya` DragonHD, `hi-IN-Diya:DragonLatestNeural`, `hi-IN-SwaraNeural`) | B | **GA** Indian voice with hi-IN as secondary locale: the production-safe lane-B fallback |
| 7 | `marin`, GPT-Live-1 | A+ | full-duplex candidate (tech-and-market §1.10); **Round 2 only**, because it paraphrases (§3.1b) |
| R1 | Sarvam Bulbul v3, best pre-screen speaker | ref | **never shippable** (Azure-only). It measures the gap to an India-native leader. Needs an owner-provided key or clips |
| R2 | ElevenLabs v4 Turbo, Indian library voice | ref | **never shippable**. It measures the gap to the general expressiveness leader |
| H | a real Indian teacher, consented, reading the same stimuli | anchor | "exactly human-like" needs a human reference; it sets the ceiling every arm is judged against |
| C | arm 6 at 8 kHz with −6 dB SNR noise | anchor | low anchor plus catch trials (exclude listeners < 90% catch accuracy, per Gurukul) |

Not shortlisted:
- gpt-4o-mini-tts is the narration twin of the lane-A winner, so it is tested as "same person?". Pairs
  `tts:<v>` vs `rt:<v>` are in the pack.
- The remaining native voices and Azure Neural voices compete only in the pre-screen.
- Gemini Live, Chirp/Gemini TTS, Cartesia and Smallest are off-Azure and add no Hindi evidence beyond R1/R2.
- IndicF5 is not realtime-capable (§3.12).

If R1 or R2 beats every Azure arm by a 95% lower bound > 50% on axes 1-2, **escalate to the owner** per the
`azure-only-compute` reversal condition. Do not quietly add a vendor.

**Relation to the sibling pack.** `samples/blind-test.html` (from `gen-listening-samples.mjs`, scored by
`score-blind-test.mjs`) holds 52 clips, **all OpenAI voices**: gpt-4o-mini-tts ×10 voices and gpt-realtime-2.1
marin/cedar/coral/shimmer. As built, that panel can only choose the least-foreign OpenAI voice. Before it runs
with children, add arms 3-6 above: the Voice Live lanes (`laneVL` in `probe-voices-hindi.mjs` shows the
session shape). Also extend `armOf()` in the scorer beyond the `rt`/`tts` engines.

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

- Loudness-normalise every clip to the same integrated LUFS (today's raw clips span **16 LU**, §5; the pack
  is at −20 ± 1 LUFS) and resample to one format (24 kHz mono, same codec and bitrate).
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
| A reference arm (Sarvam, ElevenLabs) beats every Azure arm by a 95% lower bound > 50% | escalate to the owner (Azure-only reversal condition). If a vendor is ever allowed, price the cascade honestly: +STT, a hand-built barge-in floor (Meera's `liveCall.ts`/echosim), loss of native audio input, 1.5-3 s turns |
| MAI-Voice-2.1 stays Preview at launch | don't ship a Preview voice to minors without an SLA. Fall back to the DragonHD / Neural sibling that ranked next by ear |
| Voice Live adds measurable latency over direct realtime from India | test a `centralindia` Voice Live resource (azure-realtime and gpt-realtime-2.1 are offered there as Global Standard) before deciding |
| Promotional prices end (ElevenLabs v4/v4 Turbo on 2026-10-12) or Google doubles prices (2027-01-01) | re-run §4 from the retail API (filters in §4) and vendor pages |

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
- Azure GPT-Live how-to (session.start, commentary/thinking append, PCM format): https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/gpt-live
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

Harness and data written by this workstream (all in `docs/research/voice/`): `probe-voices-hindi.mjs`,
`asr-rescore.mjs`, `analyze-voice-probe.py`, `probe-2026-10-02-results.json`, `prescreen-2026-10-02/`.

In-repo priors: `docs/harvest/companion-tech.md` §1, §2, §11.3 and §R; `docs/harvest/gurukul.md` §0, §3.5-3.7;
`context/measurements.md` (`realtime-teacher-bakeoff-2026-10-02`, `realtime-audio-in-2026-10-02`);
`docs/research/tech-and-market.md` §1.6, §1.8-1.9, §5.
