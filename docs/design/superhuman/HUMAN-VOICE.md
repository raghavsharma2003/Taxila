# HUMAN-VOICE: an exact human teacher voice in Hindi, English and Hinglish

Spec, 2026-10-04. Owner directive: `owner-superhuman-teacher-2026-10-04` (Voice): *"an exact human voice in Hindi,
English and Hinglish, with human voice elements (humming, pausing, tone and pitch change, audible thinking:
Maya/Meera-like, not a plain voice)."*

This document specifies the **expressive layer**. Taxila does not have one today. It turns what the teacher is
about to say, plus the moment the Director already knows, into delivery: emotion, pace, pitch, pauses, fillers,
breaths, hums, laughs and self-corrections. It runs on every TTS engine Taxila may use and on both lanes. It extends
four documents and does not repeat them:
- `docs/research/voice/human-likeness.md`: levers, child evidence, the Tier 1/2/3 table;
- `docs/research/world-best/voice-ux-smoothness.md`: turn-taking, latency masking, visual backchannels;
- `docs/research/voice/v2/VOICE-CHOICE.md`: which voice;
- `docs/harvest/INHERITANCE-MAP.md`: Meera's and Maya's lessons.

Evidence tags:
- **[M]** measured here on Azure (n, method and file given);
- **[V]** read in a primary source;
- **[S]** secondary source or search summary;
- **[U]** unverified;
- **[H]** inherited measurement from html-portfolio.

Everything measured lives in `docs/design/superhuman/voice-probe/` (scripts and JSON).
The listening clips are in `docs/design/superhuman/voice-clips/`.

---

## 0. Decisions in one page

1. **The planner plans from the MOMENT, not from the words, and the live path is code (0 ms).**
   - An LLM delivery planner is measured valid (15/15 at effort low, 10/10 at effort none) but slow:
     - full-text output: p50 1,882 ms at effort none (n=10);
     - annotate-only output: p50 1,398 ms on taxila-fast and 904 ms on grok-4-1-fast-non-reasoning (n=10 each) [M].
   - Any serial LLM step therefore costs ≥ 0.9 s on a turn that is already 2.97 s end to end.
   - So the live cascade uses a deterministic **moment planner**. It reads Director state: move, verdict,
     child-laughed, think-aloud, affect, class band, relationship stage. It then aligns that plan to the reply's
     clauses in code.
   - The LLM annotator is used only where latency is free: kit narration, openings, Forge narration and prewarmed
     lines, all cached.
2. **The reply model never sees a tag, a style word or a sound word. Only the compiler writes engine markup.**
   - Meera taught a tag vocabulary inside a bracket ban and got stage directions in 10/10 replies [H].
   - On gpt-realtime-2.1, a bracketed laugh direction was voiced in ≥ 2/4 turns [M, voice-prompt-labels-and-brackets].
   - The TeacherSheet and `compile()` are untouched by this spec.
3. **Per-engine capability is measured, not taken from the docs. Two Microsoft docs claims were false for our voices.**
   - Learn says DragonHD paralinguistic tags work "on all voices with all languages" [V]. On **en-IN DragonHD
     (Diya, Arjun) the tags are SPOKEN**: "Laughter", "Breathing", "Sighing" in English text, and
     "लाफ्टर / ब्रीदिंग / साइन" in Hindi text, 12/12 renders [M].
   - Learn marks `<prosody>` unsupported on DragonHD [V]. **`<prosody rate>` IS honoured on en-IN DragonHD**:
     -20% gives +20% speech duration (Diya 6.34 → 7.63 s, Arjun 5.77 → 7.30 s), and +20% gives -16%/-8% (n=3 per
     cell) [M]. This **supersedes `rj-prosody-rate-on-dragonhd`** (§13).
4. **Non-verbals are spliced clips of the SAME persona, rendered offline. Fillers are synthesised INSIDE the
   sentence, never as clips.**
   - DragonHD style markers render silently. Its paralinguistic tags are spoken. So a `<break>` of the clip's exact
     length is planned, and the server splices the persona's own breath, hum, laugh or relieved sigh into that gap.
   - The clips come from the persona's Omni sibling, which renders tags natively (`hi-IN-Diya`, `en-IN-Arjun`
     `:DragonHDOmniLatestNeural`).
   - Lexical acks ("haan", "achha") as clips come out in citation form [H]. So every word, filler included, is
     spoken by the TTS in context.
5. **Measured effect (AI judge, a weak instrument).**
   - On DragonHD, the full layer (plan + markers + breaks + clips) raised humanlike from 3.88 to 4.70 (Diya and
     Arjun, n=8-10 judgments per arm). Emotion fit went from 3.75 to 4.60 (Diya) and from 3.88 to 4.50 (Arjun).
   - Position-swapped pairwise: Diya expressive won 3/5 lines and lost 0. Arjun won 1 and lost 2.
   - The layer **without** clips was worse than with them on both voices (pairwise -2 and -1).
   - On gpt-4o-mini-tts, MAI-Voice-2.1-Flash and gpt-realtime-2.1, prose instructions changed nothing measurable:
     0 audible laughs or breaths, pairwise 0. Those engines ignore delivery requests for non-verbals [M].
   - **The owner's blind test decides**, not this judge (§8.3).
6. **Recommended stack (§12).**
   - Cascade: en-IN DragonHD per character (GA), plus this layer. That means:
     - a per-sentence style marker;
     - `<break>` pauses;
     - `<prosody rate>` pace;
     - the same-persona clip bank.
   - Fallback: gpt-4o-mini-tts `marin`/`cedar` with instructions only, no clips.
   - Premium lane: lane B (Voice Live: gpt-realtime-2.1 reasons, the character's DragonHD voice speaks) carrying the
     same compiler, once probe P-VL passes. Lane A native `marin` gets only prose notes and a thinking-hum bank.
   - Long term, toward "exact human": Azure Professional Voice from one consented teacher, with **real recorded**
     breaths, hums and laughs as the bank (escalation rung 2). Apply now.
7. **The safety floor is absolute and lives in code.**
   - Safety turns (distress, helplines, safeguarding hand-off, never-deny-AI) bypass the layer: calm register, no
     fillers, no non-verbals, plain digit words.
   - No laugh near a mistake. No sigh in a correction.
   - No self-correction of a number, a term or an answer.
   - A human-sounding voice never becomes a human claim: the identity rules are unchanged.

---

## 1. What "exact human" means here, and what it must never mean

- **Target: presence.** By Sesame's definition [V], that is emotional intelligence, conversational dynamics,
  contextual awareness and a consistent personality. On the ear axes of `voice-blind-test-v2-protocol` it means
  natural, native, warm and correct Hindi, plus "sounds like a real teacher" in the A/B test.
- **Never a target: "the child cannot tell it is an AI."** For minors that measures deception (human-likeness.md
  §0.1). The voice can sound fully human while the teacher says, every time she is asked, that she is an AI
  (`voice-ga-only-for-minors`, the CORE floor). Both are true of Meera [H].
- **Human elements are means, not ornament.** Each one does a job that the research names:
  - a breath before a long or important sentence aids recall (600 ms helps, 300 ms does not; Elmers 2021 [S]);
  - shared laughter, *licensed by the child's laugh*, raises perceived empathy (Inoue 2022 [S]); always-laughing
    sometimes wins, so selection matters;
  - varied pauses before the key idea are the opposite of plain DragonHD's flat pause pattern (pause SD 0.06 s [M]);
  - a filled pause before a new term helps adult recall (Fraundorf & Watson 2011 [S]), but 3-5-year-olds do not
    use it, and children trust confident speakers (Birch 2010 [S]). So hesitant fillers are confined to think-aloud.
  - Every element therefore has a licence rule (§5.3) and a rate cap (§5.5).

---

## 2. State of the art (2025-2026): what each system teaches us

| system | mechanism for human elements | what we take | usable at runtime? |
|---|---|---|---|
| **Sesame CSM / Maya** | One transformer over interleaved text **and audio** history. It predicts Mimi RVQ codebook 0, and a small decoder fills the rest. Prosody comes from **conversation context**. Sizes 1B/100M, 3B/250M, 8B/300M. Without context, listeners showed no preference vs human. **With 90 s of context, humans were still preferred** [V, Sesame blog]. | **Context drives prosody.** Our planner input is the moment (child's last turn, move, verdict), never the sentence alone. The remaining human gap is contextual prosody, not timbre. | No. CSM-1B is Apache-2.0 [V] but English-first: "some capacity for non-English ... likely won't do well" [V, HF card]. It is not on Azure. Its misuse terms forbid impersonation [V]. |
| **Hume EVI / Octave** | An LLM-based TTS that "understands" text. Delivery comes from natural-language **acting instructions** (tone, pacing, emphasis). Octave 2 claims 11 languages incl. Hindi, ~100-200 ms [S]. Its description field is Octave-1-only [S]. EVI 3 is EN/ES only, EVI 4-mini adds Hindi [S]. | Acting instructions as **bands, not prose lines** (our `PACE`/`emotion` enums compile to short notes for instruction-taking engines). | No: third-party API (Azure-only directive). Reference only. |
| **OpenAI gpt-realtime / gpt-4o-mini-tts** | gpt-realtime: "captures non-verbal cues (like laughs), switches language mid-sentence, adapts tone"; new voices `marin`/`cedar` [S, announcement via search]. gpt-4o-mini-tts: an `instructions` field steers tone, pace and accent [S]. | Lane A prosody follows instructions per clause; `speed` is playback rate, not composition (human-likeness §2.2). | Yes, on Azure. But **measured: neither renders a requested laugh, chuckle or breath** from prose (0/10 and 0/8 audible events) [M]. |
| **ElevenLabs v3 audio tags** | Inline `[laughs]`, `[whispers]`, `[sighs]`; a tag affects what follows until a natural break. Vendor advice: use tags with intent, not density; combinations are not additive [V, ElevenLabs blog]. | The **tag-to-clause scope** idea and the density warning, which became our rate governor. | **Never at runtime** (third-party). Reference only. |
| **Azure DragonHD (Latest)** | Context-aware HD voices that "automatically detect emotions". Style markers `[excited]` / `<mstts:express-as>` and paralinguistics `[laughter]` `[breathing]` `[sighing]` `[coughing]` `[throat_clearing]` `[yawning]`. **A style marker lasts until a sentence boundary**; `[Neutral]` resets it; `<break>` does not reset it. `temperature` 0-1. SSML subset: `<break>` yes, `<lang>` yes, `<prosody>` "no" [V, Learn HD voices + SSML voice, updated 2026-09-24]. | Our cascade engine. Per-sentence markers, `<break>`, `<lang>`, and `<prosody rate>` (honoured despite the doc [M]). | Yes. en-IN Diya, Arjun and Meera are **GA** (`voice-ga-only-for-minors`). Tags are spoken on en-IN [M], so non-verbals come from the bank. |
| **Azure DragonHD Omni** | 700+ voices; styles incl. `joking`, `proud`, `relieved`; paralinguistics "available on all voices with all languages"; express-as with natural-language descriptions (Ava/Andrew); word-boundary events; `temperature/top_p/top_k/cfg_scale`; **no `<break>`, no `<prosody>`** [V]. | Measured: hi-IN Diya Omni **renders laughter and breathing audibly** and consumes all tags silently (0/8 leaks; laugh 2/2, breath 2/2 where planned) [M]. It is our **offline clip-bank source**. | Not for production: hi-IN Omni personas are still **absent from voices/list** (`dragonhdomni-not-production`). First byte is now fine: p50 291 / p90 319 ms plain, 258 / 341 expressive (n=20 each) [M]. |
| **Azure MAI-Voice-2 / 2.1** | Prompted TTS with emotion tags (sad, whispered, excited) and role styles. Hindi-English code-switching. In 11-language speaker-similarity tests, listeners preferred MAI-Voice-2 45.5% vs human 44% vs tie 10.5% [V, microsoft.ai]. On Azure: per-voice `StyleList` via express-as. | Benchmark voice; switch-on-GA target (`voice-choice-v2`). | Preview only, so not for minors. Measured: `[laughter]` spoken "(Laughter)" and `[breathing]` spoken (2/3) [M]; bracket style markers returned no audio on all 3 MAI voices, and express-as with a style outside the voice's StyleList failed too [M]. Use express-as from the StyleList plus `<break>` only. |
| **Dia 1.6B (Nari Labs)** | Dialogue TTS with `(laughs)`, `(sighs)`, `(humming)`, `(inhales)`, `(chuckle)` and more. Apache-2.0. **English only** [S, HF card]. | The inventory of non-verbal kinds. | No: English only, not on Azure. |
| **Orpheus 3B (Canopy Labs)** | A Llama-3B LM over SNAC tokens. Tags `<laugh> <chuckle> <sigh> ...`. Apache-2.0. A multilingual research release includes a **Hindi** expressive voice with tags [S]. | Proof that an Indic LM-TTS can carry tags. The hedge route (rung 3) could fine-tune on our own recordings. | Not at runtime: self-hosting needs a GPU (`t4-cannot-serve-3b-codec-tts`); A100 economics are in `voice-escalation-ladder`. Llama-3.2 licence chain [V via Svara's tree]. |
| **Indic Parler-TTS (AI4Bharat)** | Caption-controlled (pitch, rate, expressivity, noise). Apache-2.0. Hindi NSS 84.79% (finetuned). Emotion rendering only in 10 languages, **not Hindi** [V, HF card]. | Captions-as-bands, again. | No: no Hindi emotion, not streaming-grade on Azure. |
| **Veena (Maya Research)** | 3B Llama-architecture, SNAC 24 kHz, Hindi + English + code-mixed, 4 voices, <80 ms on H100. Apache-2.0. **No emotion or non-verbal tokens yet** ("planned") [V, HF card]. | Hedge-route base (rung 3). | No (GPU, no tags). Artist-consent record needed before any use (`voice-escalation-ladder`). |
| **Svara-TTS v1 (Kenpath)** | Fine-tuned from `canopylabs/orpheus-3b-0.1-pretrained` ← `meta-llama/Llama-3.2-3B-Instruct`. 19 Indic languages. End-of-utterance emotion tags `<happy> <sad> <anger> <fear> <clear>`. Card says Apache-2.0 [V] while the base carries the **Llama 3.2 Community Licence** [V, model tree]. | Hedge-route base with emotion. | No (GPU). Record the licence chain before shipping. |
| **Meera (html-portfolio)** | On the live lane (Gemini Live), **the written register is the prosody**: stretched vowels, "...", written laughter (2.76 per 100 words). No affect knob [H]. On the cascade, a taught tag vocabulary produced stage directions 10/10 and displaced the register (laughter 0.15/100 words) [H]. Non-lexical "Hmm/Mmhm" post-turn ack clips in her own timbre were shaped by `shapeAck` (-30 dB core, -55 dB edges, 25/90 ms fades) [H]. Lexical "Haan/Acha" clips sounded robotic (citation form) [H]. A laugh clip on a timer was rejected [H]. A backchannel while the user speaks costs +171 ms or uplinks her voice [H]. | (1) Never teach the reply model a convention we then have to strip. (2) Non-lexical clips only, same timbre, shaped. (3) Words in context only. (4) Never audio during child speech. (5) The `shapeAck` constants. (6) Brackets are never inert. | Lessons, plus `shapeAck` (port and retune). |
| **Maya (html-portfolio, private voice / Vyakti)** | Per-token Hindi/English fan-out joined with 60 ms reset prosody: 3.36x longer, speaker ECAPA 0.434 vs 0.825 one-pass [H]. A prosody plan as closed bands, never threaded (`register: null`) [H]. | **One synthesis per reply.** Never split a reply into per-language or per-clause requests. Clips go into planned gaps inside one stream. Bands, not prose. | Lessons. |

**What the field converges on (2025-26):**
- human elements come from context-aware models, through tags or acting instructions;
- the best systems still lose to humans on contextual prosody (CSM with context [V]);
- no Azure-sold engine that is GA for Indian minors renders non-verbals in Hindi today [M].

**Therefore:** context-aware planning in code, plus the most expressive GA voice, plus same-persona clips. That
matches the state of the art on everything Azure lets us control, and the recorded-teacher route closes the rest.

---

## 3. Today's stack (from code and context)

Deployed Azure resources:
- `server/azure.js` DEPLOY;
- `.env.local`;
- `context/decisions.md` `forge-models`, `model-router-v2`.

| role | deployment | model |
|---|---|---|
| premium S2S | `taxila-realtime` | gpt-realtime-2.1 |
| S2S fallback | `gpt-realtime-2.1-mini` | gpt-realtime-2.1-mini |
| reply, classify, plan | `taxila-fast` | gpt-5.6-luna (reasoning family: effort `none`/`low`; **`minimal` is rejected**, HTTP 400 [M]) |
| classify (prod) | `grok-4-1-fast-non-reasoning` | Direct from Azure |
| writing, judges | `taxila-brain` | gpt-5.6-sol |
| cascade TTS (prod today) | `gpt-4o-mini-tts` | voices `marin` (Asha), `cedar` (Arjun) (`server/compiler/characters/*.js`) |
| STT | `taxila-transcribe`, `taxila-live-transcribe` | gpt-4o-transcribe family |
| Azure Speech (eastus2) | key = AOAI key | DragonHD / Omni / MAI voices via `tts.speech.microsoft.com` |

Not yet in production:
- **DragonHD is not wired.** `voice-choice-v2` proposes it, but no `server/` file calls Azure Speech TTS. Only
  `evals/avatar/gen-stim-rest.mjs` does.
- The cascade speaks gpt-4o-mini-tts with the per-teacher STYLE notes (`server/voice/speech.js`).
- The client plays raw PCM (`src/lesson/ttsStream.ts`).
- The realtime lane is WebRTC (`src/lesson/realtime.ts`).
- No expressive layer exists anywhere.

---

## 4. Measurements (2026-10-04, US sandbox → eastus2; Central India is unmeasured)

### 4.1 Capability probe: what each engine does with each markup (`cap-probe.mjs`, `cap-results.json`)

Two lines were used (Hindi-led Hinglish and English), with plain and 7 markups per engine, and ASR by
`taxila-transcribe`.

| engine / voice | `[laughter]` `[breathing]` `[sighing]` | style marker `[amused]` | express-as | `<break 700ms>` | temperature |
|---|---|---|---|---|---|
| en-IN-Diya DragonHD | **spoken** (EN 3/3, HI 3/3 as Devanagari words) | silent ✓ | accepted, silent | honoured (+0.8-1.1 s) | accepted |
| en-IN-Arjun DragonHD | **spoken** (EN 2/3 + "Saying" for sigh, HI 3/3) | silent ✓ | accepted | honoured | accepted |
| hi-IN-Swara Omni | **silent, rendered** (0/8 leak) | silent ✓ | silent ✓ | accepted (Learn: unsupported) | accepted |
| hi-IN-Priya MAI-2.1-Flash | laughter **spoken** "(Laughter)", breathing spoken | **failed** (no audio; express-as `amused` not in StyleList also failed) | StyleList only | honoured | n/a |
| hi-IN-Priya MAI-2.1 HD | laughter spoken | failed | StyleList only | honoured | n/a |
| hi-IN-Dhruv MAI-2.1-Flash | laughter, breathing spoken | failed | StyleList only | honoured | n/a |
| gpt-4o-mini-tts marin | `[laughs]` mangled into words ("क्या था"); spelled "haha" read as the word "हाहा"; instructed laugh 0 audible | n/a | n/a | n/a | n/a |

Judge (`calib.mjs`, `calib-results.json`) calibration on known controls was **11/16**:
- spoken-tag detection worked 3/4;
- laugh-clip detection worked;
- same-speaker vs two-speaker detection worked;
- it **could not hear a pure hum** (0/2) and **missed a long silence** (0/2).

So hum and pause claims below rest on objective metrics (§4.4), not the judge. Its laugh and breath detections are
usable signals; its nativeness scores are not (`gpt-audio-not-a-judge`).

### 4.2 Pace and pitch control on en-IN DragonHD (`pace-probe.mjs`, `pitch-probe.mjs`, `*-results.json`)

One 101-character Hinglish line, n=3 per cell, speech-only duration after an edge trim at -45 dB:

| condition | Diya s (chars/s) | Arjun s (chars/s) |
|---|---|---|
| plain | 6.34 (15.9) | 5.77 (17.5) |
| `<prosody rate="-20%">` | **7.63 (13.2)** | **7.30 (13.8)** |
| `<prosody rate="+20%">` | 5.29 (19.1) | 5.31 (19.0) |
| `[slow]` marker | 6.67 (15.1) | 5.73 (17.6) |
| `[fast]` marker | 6.78 (14.9) | 5.97 (16.9) |
| `[calm]` marker | 6.47 (15.6) | 5.77 (17.5) |

- **Rate is honoured; the slow/fast markers do nothing measurable.**
- Pitch (Diya, f0 median by autocorrelation):
  - plain 244.9 Hz;
  - `pitch="-10%"` 220.3 Hz (-10%, honoured);
  - `pitch="+15%"` 255.8 Hz (only +4.4%).
- `volume="-30%"` gave -2.1 dB RMS.
- Consequences:
  - pace is set with `<prosody rate>`;
  - lowering pitch (calm, gentle) works;
  - raising pitch (surprise) must come from the style marker, not `<prosody>`;
  - the per-voice base rate for 11-13 chars/s is about -20% to -30%, to be confirmed by ear.

### 4.3 The A/B experiment: 5 Hinglish teacher lines × 6 arms × plain/expressive

Inputs and arms:
- **Lines** (`lines.mjs`, test stimuli only, never prompt text):
  - L1 think-aloud sum;
  - L2 shared laughter at the child's joke;
  - L3 surprised praise;
  - L4 gentle correction;
  - L5 wonder hook.
- **Plans:** `planner.mjs` (full-text LLM planner, taxila-fast effort low), then the code validator, then the
  per-engine compiler (`plans.json`).
- **Arms:** DragonHD Diya and Arjun (with and without clips), Omni Diya, MAI Priya Flash, gpt-4o-mini-tts marin and
  gpt-realtime-2.1 marin, for 70 clips (`clips.json`).
- **Analysis** (`analyze.mjs`, `analysis.json`):
  - ASR for spoken-tag leaks;
  - the realtime audio judge ×2 per clip;
  - a position-swapped pairwise judge per (arm, line).

| arm | cond | leak | humanlike | emotion fit | laugh heard | breath heard | pairwise vs plain (5 lines) |
|---|---|---|---|---|---|---|---|
| DragonHD Diya | plain | 0/5 | 3.88 | 3.75 | 0 | 0 | |
| | expressive + clips | 0/5 | **4.70** | **4.60** | 2 (L2 ×2) | 8/10 | **+3 (3 W, 2 tie)** |
| | expressive, no clips | 0/5 | 4.40 | 4.20 | 0 | 0 | -2 |
| DragonHD Arjun | plain | 0/5 | 3.88 | 3.88 | 0 | 0 | |
| | expressive + clips | 0/5 | **4.70** | 4.50 | 2 (L2 ×2) | 4/10 | -1 (1 W, 2 L) |
| | expressive, no clips | 0/5 | 4.22 | 4.11 | 0 | 0 | -1 |
| Omni Diya | plain | 0/5 | 5.00 | 4.50 | 0 | 0 | |
| | native tags + markers | 0/5 | 4.90 | 4.50 | 2 (L2 ×2) | 2 (L5 ×2) | -1 |
| MAI Priya Flash | plain | 0/5 | 4.56 | 4.22 | 0 | 0 | |
| | express-as + breaks | 0/5 | 4.60 | 4.50 | 0 | 0 | -1 |
| gpt-4o-mini-tts marin | plain | 0/5 | 4.25 | 4.25 | 0 | 0 | |
| | per-clause instructions | 0/5 | 4.20 | 4.10 | **0** | **0** | 0 |
| gpt-realtime-2.1 marin | plain (reader) | 0/5 | 4.20 | 4.20 | 0 | 0 | |
| | clause delivery note | 0/5 | 4.50 | 4.38 | **0** | **0** | 0 |

Objective prosody (`splice.py metrics`, `metrics.json`):
- **Plain DragonHD pauses are nearly uniform** (pause SD 0.06 s, Diya and Arjun). That is a robotic tell.
- With the layer, pause SD is 0.43-0.49 s, duration +29-31%, and f0 SD is unchanged (3.3-3.6 st).
- gpt-4o-mini-tts expressive: pause SD 0.18 → 0.31 s, +29% duration.
- MAI already has varied pauses plain (0.45 s).

What this shows:
- **On GA DragonHD, the clips and the pauses carry the gain.** The style markers alone (no clips) did not win pairwise.
- The engines that "take instructions" (mini-tts, realtime) **ignore requests for non-verbal sounds**.
- Omni, unlisted, is the most natural plain voice and needs no layer for prosody.

Caveats:
- The judge is an LLM on audio with known blind spots (§4.1).
- n is 5 lines × 2 judgments.
- ASR content recall dips (e.g. 0.78 on Arjun expressive) are ASR artefacts: digits rendered as numerals, an Urdu-
  script transcript, and a clause dropped after a long pause. A tail re-transcription recovered the "missing" clause
  verbatim [M].
- **No claim of human-parity is made.** The owner's blind page (§8.3) is the decision instrument.

### 4.4 Latency (`latency.mjs`, `latency.json`; streaming raw PCM, n=20 per arm)

| arm | first byte p50 | p90 | max |
|---|---|---|---|
| DragonHD Diya plain | 228 | 287 | 752 |
| DragonHD Diya expressive (markers + `<break>`) | 231 | 284 | 292 |
| Omni Diya plain / expressive (tags) | 291 / 258 | 319 / 341 | 325 / 365 |
| MAI Priya Flash expressive | 289 | 361 | 371 |
| gpt-4o-mini-tts marin with instructions | 688 | 931 | 960 |

Markup costs **0 ms** of first byte. The splicer adds no first-byte delay, because a leading non-verbal plays from
cache *before* the TTS first byte (§5.7).

### 4.5 Planner latency (`plan-latency.json`, `compact-plan.json`; n=10 per arm)

| planner | output | valid after code checks | p50 | p90 |
|---|---|---|---|---|
| taxila-fast, effort low | full text segments | 15/15 | 2,391 | 3,131 |
| taxila-fast, effort none | full text segments | 10/10 | 1,882 | 2,596 |
| grok-4-1-fast-nr | full text segments | 7/10 (dropped words 2, added "हा हा" 1) | 2,766 | 2,920 |
| taxila-fast, effort none | annotate-only tuples | 0/10 (enum names instead of indices; fixable with strict json_schema) | 1,398 | 1,777 |
| grok-4-1-fast-nr | annotate-only tuples | 7/10 | 904 | 1,821 |

Conclusions:
- No LLM planner fits serially on the live path.
- The full-text form also carries a content-preservation risk: grok dropped words in 2/10.
- So the planner never writes words (§5.2). The live path is code (§5.1).

---

## 5. The expressive layer: design

```
Director (move, verdict, childLaughed, thinkAloud, affect, band, bond)
     │                                   reply text (guarded, final)
     ▼                                         │
 MomentPlan (code, 0 ms) ──────────────►  ClauseAligner (code)  ◄── Governor (per-session rates, recency)
     ▲   (LLM annotator: offline/cached         │  DeliveryPlan v1 (clauses × delivery)
     │    content only)                         ▼
     │                                    Engine compiler (per voice capability)
     │                     ┌───────────────┬──────────┼───────────────┬──────────────┐
     │                 DragonHD SSML     Omni SSML   MAI SSML     mini-tts instr   realtime note
     │                 + gap list          (tags)    (express-as)   (per sentence)   (response.create)
     │                     ▼
     │               Azure Speech stream ──► Splicer (fills planned gaps with bank clips) ──► framed PCM v2
     │                                                                     │ events (laugh/breath/hum @ sample)
     └──────────── safety turn? → SAFETY register (bypass: no fillers, no non-verbals, calm, slow) ─────┘
                                                                           ▼
                                               client PcmStreamPlayer + avatar (smile/inhale/closed-mouth)
```

### 5.1 MomentPlan: the live planner (code)

`server/voice/expressive/moment.js`, a pure function:
`momentPlan(ctx) → { arc, licence, pace, intensityCap, register }`.

Inputs, all already on the server at turn time:
- `move` (Director move id);
- `verdict` (`say.js verdictFor`);
- `childLaughed` (§5.6);
- `thinkAloud` (the move is worked-example or think-aloud);
- `affect` (attunement band, from `voice-features` and the comprehension engine; frustration ↑, confidence ↓);
- `band` (class band 1-2 / 3-5 / 6-9);
- `bond` (relationship stage from the relational OS);
- `lang` (mode: hi / hinglish / en);
- `safety` (distress or helpline or safeguarding);
- `turnIndex`, `secondsSinceLastNonverbal` (from the governor).

Rules (a table in code, one row per move family; values are bands, not prose):

| moment | emotion arc (by clause position) | licensed non-verbals | pace | pauses |
|---|---|---|---|---|
| greet / reunion | warm → curious | breath (if ≥ 12 words) | normal | short |
| hook / wonder | wonder (low) → delighted (rise on the last clause) | breath before the reveal; hum only if a question opens it | slow → normal | **long before the reveal** (450-700 ms) |
| explain | calm → warm, emphasis on the new term | breath before a ≥ 12-word sentence | slow on the term clause | 250-450 ms before the term |
| think-aloud / worked | thinking throughout; proud on the result clause | hum before the first step; breath mid | slow steps, brisk result | **varied** 150-500 ms between steps |
| pose question | curious | none | normal | 300 ms before the ask |
| praise (verdict = correct) | surprised (if hard or first try) → delighted → warm | sigh_relief only after a long struggle (≥ 2 wrong tries) | brisk → normal | short |
| correct (verdict = not_yet / partial) | calm → reassuring → curious | **none** (never laugh, never sigh) | **slow** | 400-650 ms before the look-again clause |
| shared laughter (childLaughed) | amused → playful → warm (fact returns calm) | chuckle or laugh on clause 0 only | brisk → normal | 0 before the laugh; 300-550 ms before the fact |
| comfort (affect frustrated) | calm, intensity ≤ 0.4 | breath (slow) | slow | longer |
| wrap / goodbye | warm → proud | none | normal | normal |
| **safety** | calm, neutral intensity 0.3 | **none** | slow | fixed 300 ms between sentences |

Caps:
- `intensityCap`: band 1-2 = 0.8, band 3-5 = 0.7, band 6-9 = 0.5. Above ~9 the uncanny-valley risk rises
  (human-likeness §0.6), so older children get less animation.
- `bond` raises warmth by at most +0.1 after the relationship OS reports a stage ≥ "familiar".
- Never "whispering", "affectionate", "secretive" or "sad" styles: intimacy and attachment risk for minors
  (`human-likeness` §6).

### 5.2 ClauseAligner and inserted words (code)

`server/voice/expressive/align.js`: `align(replyText, moment, governor, lang) → DeliveryPlan`.

- **Clause split:** on `, । ! ? .` and em-dash, keeping abbreviations and numbers whole. It reuses `sentencesOf`
  (`server/voice/sentences.js`). Each clause gets the arc value for its position (first, middle, last, or the clause
  holding the key term).
- **Key-term clause:** the clause containing the item's new term or answer value, from `compile()` lesson context.
  It gets emphasis (the one word) and a longer pause before.
- **Fillers** (inserted words, the only change to wording allowed):
  - closed inventory per language: hi `हम्म अच्छा हाँ तो अरे देखो चलो`; en `hmm okay so well oh`; hesitant
    `उम्म / umm` only in think-aloud;
  - placed at a clause start, never mid-clause;
  - at most 1 per turn (2 in think-aloud);
  - governed by §5.5;
  - synthesised **inside** the same TTS request, never as a clip (citation-form lesson [H]).
- **Self-correction** (think-aloud only): one restart of a *function phrase* ("पहले… पहले tens"), never of a number,
  a unit, a term, an answer value or a helpline digit. A restart of "बीस… पच्चीस" would teach a wrong number to a
  child who copies. Checked by a code predicate against the item's numeric and term tokens.
- **No other word changes.** The aligner returns `clauses[].text` such that
  `clauses.map(text).join(" ")` minus inserted fillers equals the guarded reply byte for byte, apart from whitespace.
  It is asserted, and a mismatch speaks the plain reply.

### 5.3 DeliveryPlan contract (`shared/contracts.ts`)

```ts
export type Emotion = "neutral"|"warm"|"amused"|"delighted"|"surprised"|"calm"|"reassuring"|"curious"|"wonder"|"thinking"|"playful"|"proud";
export type NonVerbal = "none"|"breath"|"hum"|"chuckle"|"laugh"|"sigh_relief";
export interface DeliveryClause {
  text: string;                 // exact reply words (plus at most one inserted filler at the start)
  emotion: Emotion; intensity: number;      // 0..1, already capped by band
  pace: "slow"|"normal"|"brisk";
  pauseBeforeMs: number;        // 0 for clause 0, always
  nonverbalBefore: NonVerbal;   // licensed by MomentPlan, allowed by Governor
  emphasis?: string;            // one word of `text`
  filler?: string;              // which inserted word (for the governor and the logs)
}
export interface DeliveryPlan {
  v: 1; lang: "hi"|"hinglish"|"en"; register: "normal"|"safety";
  clauses: DeliveryClause[];
  source: "moment"|"annotator"|"plain";     // plain = fail-closed
}
export interface VoiceEvent { kind: Exclude<NonVerbal,"none">|"clause"; atSample: number; clause?: number }
```

`TtsRequest` gains an optional `delivery?: DeliveryPlan` (server-built only; a client-sent plan is ignored).

### 5.4 Engine capability registry (`server/voice/expressive/caps.js`)

This is measured data, not doc data. Each entry cites its measurement id. At boot it reads
`voices/list` for `StyleList` (`tts-style-map-from-family-default`) and drops unknown styles.

| engine key | styles | paralinguistic tags | `<break>` | `<prosody rate>` | non-verbal path | first-byte p50 |
|---|---|---|---|---|---|---|
| `dhd:en-IN-*` | bracket markers, **re-emitted per sentence** | **spoken → forbidden** | yes | **yes** (pitch down only) | bank clip into a planned gap | 228 |
| `omni:*` | bracket markers / express-as | native, silent | no (use "…" for > 500 ms) | no | native tag | 291 |
| `mai:*` | express-as ∩ StyleList | **spoken → forbidden** | yes | yes [U] | bank (if a persona bank exists) else none | 289 |
| `oai-tts:marin/cedar` | `instructions` (bands → short notes) | none render | n/a (sentence split = pause) | `speed` (playback) | bank from the same voice (§5.6) else none | 688 |
| `rt:gpt-realtime-*` | response-level delivery note | none render | n/a | n/a | client-side pre-reply hum only | lane metric |
| `vl:dhd` (lane B) | [U] → probe P-VL | [U] | [U] | [U] | bank via the splicer if Voice Live returns audio to the server [U] | [U] |

### 5.5 Governor: rates that keep it human, not a tic (`server/voice/expressive/governor.js`)

The state is per lesson, in memory on the lesson's turn runner, and is persisted in `lesson.state.voice` so a
resume keeps it.

Fillers:
- ≤ 1 per 2 turns on average (window 10 turns);
- **the same filler never twice within 6 turns**;
- no filler on a turn that opens with praise or a correction (G-PRAISE-1 already shapes those openings).

Breath:
- ≤ 1 per turn;
- only before a clause ≥ 12 words or the reveal clause;
- ≥ 20 s since the last breath.

Hum:
- think-aloud or wonder only;
- ≥ 180 s since the last hum.

Laugh and chuckle:
- licensed only (§5.6);
- ≥ 300 s since the last one;
- never in the 2 turns after a not_yet verdict.

Sigh_relief:
- ≥ 600 s apart;
- praise after a struggle only.

Self-correction:
- ≥ 600 s apart;
- think-aloud only.

Takes and silence:
- the same clip take is never used twice in a row (≥ 3 takes per kind, rotated least-recently-used);
- added silence per turn ≤ 1.5 s (planned pauses, excluding clips and the post-question wait);
- the excess is trimmed proportionally.

Each rule has a unit test and a log counter (`voice.expr.*`) for the telemetry gate (§8.4).

### 5.6 Licences for non-verbals

- **childLaughed** comes from any of:
  1. ASR or text tokens: `haha`, `hehe`, `हाहा`, `😂`, a `(laughing)` annotation;
  2. text-lane emoji;
  3. Lane-L audio laughter event: no Azure STT emits one today [U]. Path (3) is a build-time open model only
     after a licence check. Until then it is (1) and (2) only.
- **A joke by the child** without laughter licenses `amused` style but not a laugh clip.
- **Never** a laugh or chuckle when:
  - the verdict is not_yet or partial;
  - the affect is frustrated;
  - it is a safety turn;
  - the class band is 6-9 and the child did not laugh first.
- The **hum** is non-lexical "mm-hmm-thinking", pre-rendered, and only as the first sound of a think-aloud turn or
  a wonder hook.
- The **breath** is an inhalation ~400-650 ms before a long clause (Elmers: 600 ms helps [S]).

### 5.7 Non-verbal clip bank (offline, per persona)

Build: `scripts/voice-bank/build.mjs` (new), offline, run by the main loop. Per persona:
- **Source:** the persona's Omni sibling (`hi-IN-Diya`, `en-IN-Arjun`, `en-IN-Meera`) renders `[breathing]`,
  `[laughter]`, `[laughter] हाँ` (chuckle), `हम्म…` (hum) and `[sighing]`. That is 12 takes per kind × 5 kinds = 60
  renders (probe used 3; `bank/`).
- **Trim and shape:** port Meera `shapeAck` into `scripts/voice-bank/shape.mjs`:
  - core at -30 dB, edges to -55 dB (caps 60/200 ms);
  - curved fades 25 ms in, 90 ms out;
  - per-kind target level relative to the persona's speech RMS: breath, hum and sigh at -8 dB; laugh and chuckle at
    -3 dB (the probe values in `splice.py`).
- **Auto-QA per take:**
  - ASR must return empty or non-lexical (no word);
  - duration bands: breath 350-800 ms, hum 300-900 ms, chuckle 250-700 ms, laugh 500-1400 ms, sigh 500-1100 ms;
  - judge laugh/breath detected (calibrated events);
  - speaker check: f0 median within ±8% of the persona's DragonHD f0 (the `prosody-baseline` method [H]).
- **Owner curation page:** `docs/design/superhuman/voice-bank/curate.html` (built by the script). It plays each take
  in context: spliced into 2 lines. Approve or reject.
- **Store:** approved takes as 24 kHz s16le PCM in the private Blob container `voice-bank/<persona>/<kind>-<n>.pcm`,
  plus a `manifest.json` (sha256, ms, rms, source voice, approval date). They are loaded into memory at boot (~60 ×
  25 KB = 1.5 MB per persona) by `server/voice/expressive/bank.js`. A manifest hash goes into every TTS cache key
  (voice identity rule: `own-teacher-voice` / harvest 37).
- **Identity:** the voice id, bank version and source model are recorded with every persisted audio. The f0-drift
  alarm (`scripts/prosody-baseline.mjs`, a harvest port) also covers the bank.
- **Rule from `voice-ga-only-for-minors`:** the bank is a static, human-approved build asset, not a runtime call to a
  Preview or unlisted model. It is **flagged for the owner (O-1)** because its source model is unlisted. If the owner
  says no, the same pipeline runs on recorded human clips (the Professional Voice talent, rung 2), and the DragonHD
  arms run with breaks only until then.

### 5.8 Splicer: filling planned gaps inside ONE stream (`server/voice/expressive/splice.js`)

The DragonHD compiler emits one SSML document per reply (never per clause: the per-token fan-out reset prosody
[H]). Where a non-verbal is planned:
- **Before clause 0:** no gap is emitted. The server writes the clip's PCM to the response **immediately**, before
  the TTS first byte arrives (~228 ms), then appends the stream. A leading breath or hum therefore **masks** first-
  byte latency instead of adding to it.
- **Mid-reply:** the compiler emits `<break time="{clipMs + 120}ms"/>` and records `gaps[] = {kind, ms}`. The
  streaming splicer runs a 10 ms-frame energy detector:
  - when a run of frames below -50 dBFS reaches **max(200 ms, gap.ms - 80 ms)**, that is the n-th planned gap;
  - the clip is mixed starting 60 ms into the run, with 15 ms in and 60 ms out fades;
  - the output is held back by at most the detector window (200 ms), and only inside that silence, so it is never
    audible;
  - a natural pause shorter than the threshold never matches, and gaps are consumed strictly in order;
  - if a gap is not found before the stream ends, the clip is dropped (fail-silent) and `voice.expr.gap_miss` is
    counted.
- **Events:** the splicer emits `VoiceEvent{kind, atSample}` for each clip played and each clause start it can
  locate.

### 5.9 Engine compilers (`server/voice/expressive/compile/*.js`, pure)

- **`dhd.js` (cascade default).** One `<speak>`; Devanagari runs in `<lang xml:lang="hi-IN">` (`voice-choice-v2`).
  - Per clause: `<break>` for the pause; a style marker mapped from emotion (table below) **at the start of every
    sentence inside the clause**, because markers reset at sentence boundaries [V].
  - `[Neutral]` where the emotion is neutral.
  - `<prosody rate>` = base rate for the voice (pace table, §12) + {slow -10%, normal 0, brisk +8%}.
  - `<prosody pitch="-6%">` for calm and reassuring; no pitch-up (ineffective).
  - Emphasis: no `<emphasis>` support, so the emphasised word is placed after a 120 ms `<break>` (a micro-pause
    before the key word) and nothing else.
  - **Paralinguistic tag words are never emitted** (a lint assert).
- **`omni.js` (when listed).** Native `[breathing]` / `[laughter]` / `[sighing]` tags plus style markers per
  sentence; "…" for pauses > 500 ms; no `<break>` or `<prosody>`.
- **`mai.js` (benchmark, on GA).** Express-as only where the style is in this voice's StyleList, plus `<break>`.
  No tags.
- **`oai-tts.js` (fallback).** The reply is split at sentence boundaries only (the TTS first byte does not depend on
  length [M, `tts-first-clause-no-gain`]). It is one request per sentence. `instructions` = the STYLE note +
  `Feeling: {emotion}, {low|medium|high}. Pace: {band}.` The input text is never altered. Bank clips are spliced
  between sentences if a bank for that voice exists.
- **`realtime.js` (lane A).** The response-level `instructions` gain one shape line from the plan:
  `delivery: {emotion arc as bands}; pace {band}; pause before the key idea`. It follows the VOICE-TEACHER
  assembly. The note never contains a sound word: a laugh is **never** requested on lane A, because the model cannot
  render it and the word leaks (§4.3 and `voice-prompt-labels-and-brackets`).
- **`voicelive.js` (lane B).** Depends on probe P-VL (§11): does Voice Live (a) accept SSML or bracket markers in the
  model's text output stream and (b) let the server receive the audio? If (a), the clause aligner runs on the
  streamed text at sentence granularity and markers are inserted by a Voice Live text-transform hook [U]. If (b),
  the splicer works as on the cascade. If neither, lane B gets the lane-A treatment.

Emotion → DragonHD style marker (measured silent on en-IN):

| emotion | warm | amused | delighted | surprised | calm | reassuring | curious | wonder | thinking | playful | proud |
|---|---|---|---|---|---|---|---|---|---|---|---|
| marker | appreciative | amused | excited | surprised | calm | reassuring | curious | intrigued | reflective | joking* | proud* |

\* `joking` and `proud` are listed for Omni and in the SSML-voice DragonHD table [V]. They are unverified on en-IN
DragonHD; the boot probe falls back to `amused` / `appreciative` if they are spoken.

### 5.10 Safety register (bypass)

When `register = "safety"`:
- any distress classification, a helpline turn, a safeguarding hand-off, the never-deny-AI answer or an
  identity/age question;
- the plan is fixed: neutral/calm at 0.3, slow, 300 ms between sentences, no fillers, no non-verbals, no style
  markers except `[calm]`;
- helpline digits as plain space-separated words (`voice-tts-spoken-render`; `helpline-digits-comma-separated` was
  rejected);
- a test asserts that the safety path produces zero clips and zero inserted words.

### 5.11 Thinking sounds and latency masking

- **Think-aloud turns:** the hum or breath is clause 0's leading non-verbal (§5.8), so it plays while TTS starts.
- **Slow turns (Director knows the reply will take > 1.5 s, e.g. a classify plus a long reply):** the world-best S3
  order holds: body first (avatar think pose, `voice-ux-smoothness` S3), then the reply.
  - A thinking hum **may** be sent first only when the governor allows a hum and the move is think-aloud or wonder.
  - Never a lexical filler on a timer ("hmm, ek second" landed after the move in Meera [H]).
  - This is a Tier-2 lever behind the ear test (§8.3) because S3 recorded "never a canned filler". A non-lexical,
    same-timbre, licensed hum is the narrow exception being tested, not a general filler.
- **No audio during child speech.** Backchannels while the child talks are **visual only** (S4). Half-duplex: a mic
  hold splits the turn and +171 ms of uplink harm was measured [H].
- **Post-turn uptake:** "achha" or "हाँ" as the first word of the reply comes from the aligner's filler slot, inside
  the synthesis, governed.

### 5.12 Languages

- **Hinglish (default):** Devanagari runs `<lang hi-IN>` inside an en-IN DragonHD voice. Fillers are chosen from the
  inventory of the clause's dominant script.
- **Hindi-heavy (Hindi-medium children):** the same voice with `<lang hi-IN>` across the reply. Omni hi-IN replaces
  it when listed (best plain naturalness, 5.0 judge [M]).
- **English mode:** en-IN text untagged; English fillers only; style markers fully supported on English content [V].

### 5.13 LLM annotator (offline and cached content only)

`server/voice/expressive/annotate.js` is for:
- kit narration;
- openings;
- Forge build narration ("main abhi ek game bana rahi hoon…" lines are authored elsewhere; this only annotates
  delivery);
- read-aloud passages.

It works as follows:
- input: numbered clauses plus the moment;
- output: strict json_schema tuples with enum names (fixes the 0/10 index failure in §4.5);
- the same validator and governor rules apply, with the same fail-closed-to-moment behaviour;
- deployment: taxila-fast at effort low; ~800 tokens per line [M, plans.json usage 513 in / 299 out].

Results go into the TTS cache keyed by (text, plan hash, voice, bank version).

### 5.14 Client and avatar

- **Framed TTS protocol v2:** `Accept: application/x-taxila-pcm-frames;v=2` on `/api/voice/tts-stream`. Frames are
  `[type u8][len u24][payload]`, where type 0 = PCM s16le and type 1 = a JSON `VoiceEvent`. Old clients get raw PCM
  (no events).
- **Parser:** `src/lesson/ttsStream.ts` `readFrames()`.
- **Events go to the avatar** (`src/avatar/lip.ts` and the face presets):
  - `laugh`/`chuckle` → the smile preset plus a shoulder bob, mouth open with no visemes;
  - `breath` → a 300 ms inhale (chest and shoulders up, lips parted);
  - `hum` → lips closed, eyes up-left (the think pose);
  - `sigh_relief` → an exhale plus a soft smile.
- **Captions** never show a tag, filler marker or event. They show the reply text, with an inserted filler shown
  as-is (it is a spoken word).
- `resumePoint()` (barge-in resume) is unchanged. Clips are not quiet stretches, so a resume never lands inside one.

---

## 6. Both lanes, end to end

| step | cascade (default) | realtime lane A (gpt-realtime marin/cedar) | realtime lane B (Voice Live, DragonHD voice) |
|---|---|---|---|
| plan | moment + aligner after the guarded reply, inside `/turn` before prewarm (`cascade-tts-prewarm`) | moment only (the reply is generated by the S2S model) | moment; aligner on streamed sentences [U] |
| words | the guarded reply, unchanged plus ≤ 1 filler | the model's own | the model's own |
| delivery | DragonHD SSML (markers, breaks, rate, pitch) | a delivery shape line in `response.create` instructions | markers via a transform [U] |
| non-verbals | spliced bank clips, leading clip masks first byte | **none in speech**; optional pre-reply hum clip from the `marin` bank (rendered offline with gpt-4o-mini-tts "Hmm." inputs, same voice), client-played in the THINKING floor state before the first response audio | spliced if audio passes through the server [U] |
| fillers | aligner slot, in-synthesis | none injected (0/28 natural fillers [M]; prompted fillers recite) | aligner slot [U] |
| identity | DragonHD persona = bank persona | `marin` = mini-tts fallback voice = hum bank | the same persona as the cascade (`voice-one-identity-across-lanes`) |

---

## 7. Budgets

Latency (added to speech-end → first teacher audio):

| component | budget | measured |
|---|---|---|
| moment + aligner + compile | ≤ 3 ms p99 (pure code) | to measure in a unit benchmark |
| markup on DragonHD first byte | ≤ +10 ms | +3 ms p50 (231 vs 228) [M] |
| leading clip | **-200 ms perceived** (audio starts before the TTS first byte) | to measure from India |
| mid-reply splicer hold | ≤ 200 ms, only inside silence | by design |
| lane A delivery line | 0 (same request) | |

Cost:
- **DragonHD: $22 per 1M characters** (`voice-choice-v2`, verified there). Markup adds ~12 characters per sentence
  marker and ~25 per `<break>`/`<prosody>`. For a typical 180-character reply with 3 sentences, that is ~+90
  characters, ≈ +50% billed characters **if** SSML tag characters are billed [U]. Microsoft's billing rule for SSML
  markup characters must be read before launch (owner ask O-5).
- **Worst case:** at ~20k teacher characters per lesson-hour, +50% = +10k characters = **+$0.22 per lesson-hour**.
  The mitigation if it is billed: emit `<prosody>` once per reply, not per clause (−60% of markup).
- **Clips:** storage is negligible; there is no synthesis cost at runtime.
- **LLM annotator (offline only):** ~800 tokens per cached line. It runs once per line, ever.
- **Added speaking time:** +29-31% per reply from pauses and clips [M]. The governor's 1.5 s per-turn cap bounds it.
  The lesson pacer must count delivered audio seconds, not characters.

---

## 8. Quality gates

### 8.1 Code gates (CI, every commit touching `server/voice/expressive/**`)
1. **Leak lint:**
   - no paralinguistic tag word in any compiled DragonHD or MAI SSML;
   - no bracket, style word or sound word in any reply-model prompt (extends the `compile()` asserts of
     `voice-teacher-spec`);
   - no sound word in lane-A instructions.
2. **Content preservation:** aligner output words minus fillers equal the guarded reply, over 2,000 recorded
   production replies (from `lesson_turns`, scrubbed) and all kit lines.
3. **Safety bypass:** 200 safety fixtures give 0 fillers, 0 clips and 0 markers other than `[calm]`.
4. **Licences:** a laugh never appears when the verdict is not_yet/partial or the affect is frustrated (property
   test over generated contexts). A self-correction never touches a numeric or term token.
5. **Governor:** simulated 60-turn lessons on 50 seeds:
   - filler rate ≤ 0.5 per turn;
   - no same filler within 6 turns;
   - laugh gap ≥ 300 s;
   - silence cap respected.
6. **Splicer:** the synthetic stream tests (known gaps, natural pauses, early stream end) give 100% gap hit with 0
   false fills on natural pauses ≥ 150 ms that are shorter than the threshold.

### 8.2 Audio gates (nightly from the probe fleet, Central India and eastus2)
1. **ASR leak battery:** 40 lines × every production voice with the layer on. **0** spoken tag or style words
   (regex plus a Devanagari transliteration list, which fixes the gap in `cap-probe`'s LEAK regex, where it missed
   "लाफ्टर").
2. **Style-marker silence re-probe** on every voice at boot and nightly. A newly spoken marker is removed from the
   registry automatically and alerts.
3. **First byte:** DragonHD expressive p50 ≤ 300 ms and p90 ≤ 450 ms from Central India (n=20).
4. **Bank drift:** f0 and duration of every live take vs the manifest; prosody-baseline alarm at f0 ±8%.

### 8.3 Ear gates (decide; nothing ships on the judge)
1. **Owner blind page (built, ready):** `docs/design/superhuman/voice-clips/blind-test.html`.
   - 40 A/B pairs: 30 plain vs expressive plus 10 clips vs no-clips, over 6 voices × 5 lines.
   - Fresh codes; a side is unlocked only after ≥ 80% of each clip is played; per-clip "odd" ticks for: said a tag,
     pasted-in sound, wrong pause, voice changed, overacted.
   - Export/Import JSON. Unblind with `voice-probe/score-blind.py <export.json>`.
   - Key: `voice-clips/blind-key.json`, not to be opened before rating.
   - **Ship bar for the clip bank:** a splice or "voice changed" tick on ≤ 1 in 5 spliced clips, and expressive
     preferred or tied on ≥ 4/5 lines per DragonHD voice.
2. **Panel round** (`voice-blind-test-v2-protocol`): add the expressive DragonHD arms vs plain DragonHD vs MAI vs a
   human anchor. Bar: paired LB > 50% on natural for expressive vs plain, with native not worse.
3. **Child round 2** (after the panel-ethics note): *"which teacher would you rather learn from?"* Never *"is she
   a person?"* (§1).

### 8.4 Production telemetry (the felt-defects loop)
- `voice.expr.{filler,breath,hum,laugh,sigh}` per 100 turns, by voice and band.
- **Barge-in within 1 s after a non-verbal clip** (an annoyance proxy; alarm if > 2× the barge rate after a plain
  clause).
- Gap-miss rate (alarm > 2%).
- Fail-closed-to-plain rate (alarm > 1%).

---

## 9. Failure modes

| failure | effect on the child | detection | handling |
|---|---|---|---|
| A style marker becomes spoken after a vendor update | the teacher says "reflective" aloud | nightly ASR battery; boot re-probe | registry auto-drops the marker; alert |
| A clip timbre does not match (vendor voice drift) | "a different person sighed" | f0 drift alarm; owner tick rate | the bank is disabled for that voice (breaks only); rebuild |
| Splicer misses a gap | a pause with no breath (harmless) | gap_miss counter | fail-silent |
| Splicer fills a natural pause | a breath in a slightly odd place | synthetic tests; owner ticks | the threshold is tied to the planned gap length |
| Laugh licensed wrongly (sarcastic "haha") | laughs at a frustrated child | affect check; barge-after-clip metric | the frustrated-affect veto; band 6-9 needs a child laugh first |
| Filler tic | "achha" every turn | governor; telemetry | recency and rate caps |
| The aligner alters words | wrong content | the preservation assert | speak plain; log |
| DragonHD down or 5xx | — | upstream error | fall back to gpt-4o-mini-tts with instructions (identity change logged); no clips unless a marin bank exists |
| India first byte too high | slower start | probe fleet | a leading clip masks ≤ 400 ms; else stay plain-fast |
| SSML markup billed | +$0.22 per lesson-hour worst case | invoice check O-5 | collapse `<prosody>` per reply |
| Lane A note voiced | the teacher says "delivery…" | lane-A transcript lint | a shapes-only line, no labels (VOICE-TEACHER) |
| Safety turn gets expressive | a playful tone on distress | safety-bypass test | register bypass in code before planning |

---

## 10. UX in detail: what the child hears (Asha, class 3, Hinglish)

1. **Think-aloud (L1).** She stops after the question. A soft closed-mouth "mm" (her own) starts *at once* while
   the face looks up-left. "सत्ताईस और पैंतीस।" Then a 350 ms pause and a small inhale. "पहले tens जोड़ते हैं, बीस
   और तीस…" (slow, reflective). A 250 ms pause. "पचास।" A 450 ms pause, then brisker and proud: "तो total हुआ
   बासठ!" The caption shows the words only.
2. **Shared laughter (L2).** The child laughs while saying "पौधे cold drink पीते हैं!". She chuckles first (the
   avatar smiles and bobs its shoulders), then plays along briskly: "Cold drink? फिर तो सारे पौधे गमले में burp
   करते!" A 550 ms pause and a breath, then calm and warm: "नहीं, पौधे सिर्फ़ पानी पीते हैं, अपनी जड़ों से।" If the
   child had *not* laughed, the same words come amused but with no laugh.
3. **Surprised praise (L3).** "अरे!" (the surprised marker, quick). A 250 ms pause. "पहली बार में ही?" (delighted). A
   small breath before the specific praise, then warm. No sigh: there was no struggle.
4. **Gentle correction (L4).** No filler opening, no laugh, no sigh. Slower (-10% rate on top of the base), pitch
   slightly lower. "अच्छा, यहाँ थोड़ा रुकते हैं।" A 500 ms pause and a breath. The pizza clause is slow. A 650 ms
   pause before the look-again clause, which is curious.
5. **Wonder (L5, Arjun, class 6).** A breath, then "पता है," low and slow (intrigued). A long pause before the fact,
   which is delivered intrigued. A 420 ms pause and a breath, then a rise to excited on "सोचो, अभी इसी वक़्त भी!"
   Intensity is capped at 0.5 for band 6-9: wonder, not theatre.
6. **Distress or helpline.** A plain, calm, slow, even voice. No sounds or fillers. Digits are said clearly.

---

## 11. Acceptance tests

| id | test | pass |
|---|---|---|
| HV-1 | compile 2,000 replies × 3 voices; lint | 0 tag words, 0 sound words in reply prompts |
| HV-2 | preservation over replies and kits | 100% byte-equal minus fillers |
| HV-3 | safety fixtures | 0 fillers, 0 clips |
| HV-4 | governor simulation (50 seeds × 60 turns) | all §8.1.5 bounds |
| HV-5 | splicer synthetic suite | 100% gap hits, 0 false fills |
| HV-6 | ASR leak battery, nightly, India + US | 0 leaks |
| HV-7 | first byte expressive vs plain from Central India, n=20 | p50 ≤ 300 ms, Δ ≤ 10 ms |
| HV-8 | leading clip → first audible sample from the end of the child's speech | ≥ 150 ms earlier than without the clip |
| HV-9 | owner blind page | §8.3.1 ship bar |
| HV-10 | panel | §8.3.2 bar |
| HV-11 | avatar events | laugh, breath and hum events within ±40 ms of the clip onset in the PCM (offline compare) |
| HV-12 | P-VL probe (lane B) | answers (a) markers accepted silently? (b) server audio access? (c) first byte; decides `voicelive.js` |
| HV-13 | lane A | delivery line present; 0 sound words; never-deny-AI battery unchanged |
| HV-14 | bank QA | every approved take: no ASR word, in duration band, f0 within ±8% |
| HV-15 | pace table | per-voice base rate gives 11-13 chars/s (n=10 lines) and passes an owner ear check |

---

## 12. Recommended voice stack and owner asks

**Stack:**
1. **Cascade (most minutes):** en-IN DragonHD per character:
   - Asha = `en-IN-Diya`;
   - Arjun = `en-IN-Arjun`;
   - Uma = `en-IN-Meera` (pending a probe).
   All three are GA. The full expressive layer, base `<prosody rate>` about -25% (Diya) and -28% (Arjun) to reach
   ~12-13 chars/s (confirm with HV-15), per-sentence style markers, `<break>` pauses, and the same-persona bank.
2. **Fallback:** gpt-4o-mini-tts `marin`/`cedar` (named snapshot) with band instructions, plus a `marin`/`cedar` hum
   bank if the ear test passes.
3. **Premium lane:** lane B (Voice Live + the character's DragonHD voice) if P-VL passes. Else lane A native
   `marin`/`cedar` with delivery lines only.
4. **Watch list:**
   - hi-IN DragonHD Omni (most natural plain voice; native non-verbals in Hindi) the day it is listed;
   - MAI-Voice-2.1 on GA (express-as plus breaks; tags forbidden).
5. **Toward exact human (rung 2, start now):** Azure Professional Voice from one consented work-for-hire Hindi-
   English teacher (`own-teacher-voice-record-once`).
   - Add to the recording script a **non-verbal session**: 40 breaths, 40 hums, 30 chuckles, 20 laughs and 20 relief
     sighs, natural and in context.
   - These become the bank (real human non-verbals in the exact timbre of the voice). They remove the O-1 concern.

**What the owner must do or deploy:**
- **O-1:** decide whether the clip bank may be rendered offline from the unlisted Omni sibling (a static, human-
  approved asset), or must wait for recorded human clips. Until then, DragonHD runs with breaks and markers but no
  clips.
- **O-2:** an Azure Speech resource in **Central India** (already in `model-router-v2`). Confirm en-IN DragonHD
  (Diya, Arjun, Meera) and Omni availability there.
- **O-3:** enable **Voice Live** on the Foundry resource with DragonHD voices, for probe P-VL (lane B).
- **O-4:** a private Blob container `voice-bank` on the existing storage account (read by `taxila-web`'s managed
  identity).
- **O-5:** a support ticket to Microsoft with three questions:
  1. are SSML markup characters (style markers, `<break>`, `<prosody>`) billed;
  2. why en-IN DragonHD speaks the paralinguistic tags that Learn says work on all voices, and whether that changes;
  3. the listing and GA dates for hi-IN DragonHD Omni and MAI-Voice-2.1.
- **O-6:** apply for **Professional Voice Limited Access** and commission the talent recording with the non-verbal
  session (rung 2).
- **O-7:** listen to the blind page (40 pairs, ~25 min) and export the JSON.
- **No new Foundry model is needed** for this layer: taxila-fast and grok are deployed. Optionally, the
  `gpt-4o-mini-tts` 2025-12-15 snapshot (already asked).

---

## 13. Proposed context entries (also in `context/inbox/human-voice.json`)

- **decision `hv-expressive-layer`:** moment planner (code) plus clause aligner, per-engine compilers, same-persona
  clip bank, splicer, governor and safety bypass. The reply model never sees delivery vocabulary. Reverse if the
  owner or panel prefers plain DragonHD, or the annotator-on-live becomes ≤ 300 ms with equal plans.
- **decision `hv-live-planner-is-code`:** LLM planner p50 ≥ 904 ms in every form (n=10 per arm). Reverse if an
  Azure model annotates clauses in ≤ 300 ms p90 at ≥ 95% validity.
- **decision `hv-fillers-in-synthesis-clips-nonlexical`:** words are always spoken in context by the TTS; clips are
  non-lexical only.
- **measurement `hv-cap-probe-2026-10-04`:** the engine × markup matrix of §4.1.
- **measurement `hv-ab-judge-2026-10-04`:** the §4.3 table, with the judge's caveats.
- **measurement `hv-dhd-prosody-2026-10-04`:** the rate and pitch tables of §4.2.
- **measurement `hv-latency-2026-10-04`:** §4.4 and §4.5.
- **rejected `hv-instructed-nonverbals`:** asking gpt-4o-mini-tts or gpt-realtime-2.1 in prose for a laugh, chuckle
  or breath gave 0 audible laughs or breaths in 18 judged clips (10 + 8).
- **rejected `hv-paralinguistic-tags-en-IN-dragonhd`:** tags are spoken (12/12).
- **rejected `hv-llm-planner-serial`:** +0.9-2.4 s.
- **rejected `hv-full-text-planner`:** the model rewrites words (grok dropped words in 2/10).
- **supersedes `rj-prosody-rate-on-dragonhd`:** rate is honoured (n=3 × 6 cells × 2 voices). BUILD-PLAN W2-D #4
  should set pace by `<prosody rate>` from the per-voice table.
- **open `hv-omni-listing`:** the Omni first byte now meets the < 1 s reversal (p90 319-341 ms, n=20) but it is
  still unlisted.

---

## 14. Build order (the full version, sequenced; ≈ 14 days)

| step | work | files | gate | est. |
|---|---|---|---|---|
| B0 | Contracts, capability registry (seeded from §4 JSON), leak lint, safety-register predicate | `shared/contracts.ts`, `server/voice/expressive/{caps,lint}.js` | HV-1 (lint part), HV-3 | 0.5 d |
| B1 | Azure Speech streaming TTS client (DragonHD PCM stream, `<lang>`, base rate per voice, cache key with plan + bank hash, fallback to mini-tts); `voice-choice-v2` wiring per character | `server/voice/azureTts.js` (new), `server/voice/speech.js`, `server/compiler/characters/*.js`, `shared/tutors.js` | HV-7, HV-15 | 2 d |
| B2 | Moment planner, clause aligner, governor, compilers (dhd, omni, mai, oai-tts, realtime) + unit and property tests | `server/voice/expressive/{moment,align,governor}.js`, `compile/*.js`, `server/voice/expressive/*.test.js` | HV-1..4 | 2.5 d |
| B3 | Bank pipeline: render 12 takes × 5 kinds × 3 personas, shape (shapeAck port), auto-QA, curation page, Blob upload, `bank.js` loader | `scripts/voice-bank/{build,shape}.mjs`, `docs/design/superhuman/voice-bank/`, `server/voice/expressive/bank.js` | HV-14, O-1, O-4 | 2 d |
| B4 | Streaming splicer + leading-clip-first, framed TTS v2, client parser, avatar events | `server/voice/expressive/splice.js`, `server/routes/voice.js`, `src/lesson/ttsStream.ts`, `src/avatar/lip.ts` | HV-5, HV-8, HV-11 | 2.5 d |
| B5 | Wire into `/turn` (after the guard, before prewarm) and the text lane's "Hear"; telemetry counters | `server/routes/lesson.js` (seam), `server/voice/prewarm.js` | HV-2 on production replies; §8.4 | 1 d |
| B6 | Realtime: lane-A delivery line in `response.create`; `marin`/`cedar` hum bank + client pre-reply hum (flagged); P-VL probe → `voicelive.js` | `src/lesson/realtime.ts`, `server/voice/expressive/compile/{realtime,voicelive}.js`, `evals/voice-live-probe.mjs` | HV-12, HV-13 | 2 d |
| B7 | LLM annotator (strict schema) for kits, openings, Forge narration, read-aloud; cache | `server/voice/expressive/annotate.js` | validity ≥ 95%, preservation 100% | 1 d |
| B8 | Nightly audio gates on the probe fleet (ASR leak, marker re-probe, first byte, bank drift) | `evals/voice-expressive-nightly.mjs`, `scripts/prosody-baseline.mjs` | HV-6, HV-7 | 0.5 d |
| B9 | Ear rounds: owner page now; panel arms; child round 2 | `voice-clips/`, `docs/research/voice/v2/` | HV-9, HV-10 | owner time |
| B10 | Rung 2: Professional Voice + recorded non-verbal bank (replaces the Omni-sourced bank) | O-6 | panel vs stock | external |

**Order rationale:**
- B0-B2 are pure code and unblock everything.
- B1 is independently valuable: DragonHD is the proposed voice and is not wired today.
- B3 and B4 carry the measured gain (clips plus pauses).
- B6 waits on O-3.
- Nothing in B0-B8 needs a model the owner has not deployed.

---

## 15. Sources

Primary and vendor:
- Sesame, "Crossing the uncanny valley of conversational voice":
  https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice [V]
- sesame/csm-1b model card (Apache-2.0, English-first, misuse terms): https://huggingface.co/sesame/csm-1b [V]
- Microsoft Learn, HD voices (DragonHD, Omni, styles, paralinguistics, SSML support, parameters; updated
  2026-09-24): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices [V]
- Microsoft Learn, SSML voice (style markers reset at sentence boundaries; `[Neutral]`; `<break>` does not reset):
  https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice [V]
- Microsoft AI, "Introducing MAI-Voice-2" (emotion tags, Hindi-English code-switching, 45.5% vs 44% preference):
  https://microsoft.ai/news/mai-voice-2/ [V]
- Hume Octave / EVI: https://www.hume.ai/octave, https://dev.hume.ai/docs/text-to-speech-tts/acting-instructions,
  https://www.hume.ai/blog/introducing-evi-3, https://www.testingcatalog.com/hume-ai-launches-octave-2-and-evi-4-mini-voice-models/ [S]
- OpenAI gpt-realtime announcement: https://openai.com/index/introducing-gpt-realtime/. Direct fetch returned 403,
  so the content is via https://the-decoder.com/openais-real-time-api-picks-up-laughter-accents-and-switches-languages-in-real-time/ [S]
- ElevenLabs, "Audio Tags 101": https://elevenlabs.io/blog/v3-audiotags [S]
- Dia-1.6B: https://huggingface.co/nari-labs/Dia-1.6B [S]
- Orpheus multilingual (Hindi): https://github.com/canopyai/Orpheus-TTS (via search); https://huggingface.co/lex-au/Orpheus-3b-Hindi-FT-Q8_0.gguf [S]
- Indic Parler-TTS: https://huggingface.co/ai4bharat/indic-parler-tts [V]
- Veena: https://huggingface.co/maya-research/Veena [V]
- Svara-TTS v1 (base chain Orpheus ← Llama-3.2-3B-Instruct): https://huggingface.co/kenpath/svara-tts-v1 [V]

Research cited through Taxila's own reviewed docs (`human-likeness.md` §10): Elmers et al. 2021 (breath), Inoue,
Lala & Kawahara 2022 (shared laughter), Fraundorf & Watson 2011, Owens et al. 2017, Birch et al. 2010
(disfluency and confidence), Kory-Westlund et al. 2017 (expressive voice and learning), Park et al. 2017 (child
backchannels).

Inherited (html-portfolio): `docs/harvest/INHERITANCE-MAP.md` items 10, 113-115, 137; `hp-main-voice-surfaces.md`
A18/A19 (`shapeAck`, ack clips), rejections 1-5; `meera-repo.md` §4-6; `companion-tech.md` (`ack-bracket-direction`,
`murmur-timbre`, spoken register).

Measured here: `docs/design/superhuman/voice-probe/` contains:
- `cap-probe.mjs`, `calib.mjs`, `planner.mjs`, `render.mjs`, `splice.py`, `analyze.mjs`, `rtjudge.mjs`;
- `latency.mjs`, `pace-probe.mjs`, `pitch-probe.mjs`, `plan-latency.mjs`, `compact-plan.mjs`;
- `make-blind.py`, `score-blind.py`;
- results `*.json`.

Clips: `docs/design/superhuman/voice-clips/` (70 mp3 at -24 LUFS, plus `blind-test.html` and `blind-key.json`).
