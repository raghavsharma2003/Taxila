# STT for Indian children's Hinglish on Azure (stt-hinglish v2, measured 2026-10-02)

Builds on `../asr-kids-hinglish.md` (E0: strategy, 21 stimuli, TV-babble arm, hallucination-on-silence law).
This run adds what E0 did not cover:
- a new 30-utterance set;
- a **second TTS family**, so no engine gets an unnoticed home-family advantage;
- white and pink noise at 10 dB SNR;
- **Azure Speech real-time (streaming SDK)** with phrase lists and continuous language ID;
- streaming partial and final latency;
- a fresh check of the catalog for newer STT models.

**Synthetic speech is not children's speech.** These numbers measure the *instrument*:
- accuracy on child-shaped TTS;
- which script each engine writes;
- whether numbers survive;
- latency;
- what each engine invents when nobody is speaking.

They say nothing about real child phonology, real home acoustics or children under 8. E1 (real children,
`../asr-kids-hinglish.md` §6) is still the gate.

The utterances in `stt/stimuli.mjs` are **test stimuli only**. Never copy any of them into a prompt.

Tags: **[M]** measured here (n and method given), **[V]** vendor documentation or price list, **[U]** our inference, not measured.

Artifacts (all under `stt/`):
- `stimuli.mjs`: 30 utterances, keywords, decoys and the script-only prompt.
- `score.mjs`: the deterministic scorer. It reuses the E0 skeleton.
- `probe.mjs`: `gen | run | score`, resumable.
- `results-2026-10-02.json`: all 2,013 rows plus aggregates.
- `clips-meta.json`: speech onset and end per clip.
- `audio/*.ogg`: 183 clips, 2.1 MB.

---

## 0. Bottom line

1. **Default STT: `taxila-live-transcribe` (gpt-live-transcribe 2026-07-28), with per-lesson `keywords` and
   a speaker-and-script prompt that contains no vocabulary (arm D4).** It was the best arm on every accuracy
   metric, in every noise arm and with both TTS families [M, n = 180 speech clips]:

   | metric | D4 result |
   |---|---|
   | normalised CER | 0.026 |
   | normalised WER | 0.049 |
   | key-term recall | 0.938 |
   | all numbers correct, in order | 92/96 |
   | graded answers | 76/78 |
   | clips in a wrong script | 0 |
   | decoy insertions | 0 |
   | output on non-speech | 0/3 |

   Paired against the next-best arm (R4), D4 had lower CER on 67 clips and higher on 14. On number sequences
   D4 alone was right on 23 clips and R4 alone on 4.
2. **Streaming fallback: Azure Speech real-time with continuous language ID over `hi-IN` + `en-IN` (arm R4).**
   - Accuracy: CER 0.071, answers 74/78, 0 hallucinations, 0 wrong script.
   - It is a different model family on a different service, so one failure is unlikely to take out both.
   - Final transcript about 880 ms after the child stops (p50, Azure's own endpointing included).
   - For a batch second opinion on answer turns, **Azure Fast Transcription `hi-IN`+`en-IN` (C1)** is close
     on accuracy (CER 0.072, answers 73/78) at a 262 ms request time.
3. **`gpt-4o-transcribe` and `gpt-4o-mini-transcribe` stay out of the live and grading lanes.** E0 found
   this; this run confirms it with new failure modes:
   - **On white noise at 10 dB they write fluent sentences that were never said.** For example
     "मैं कक्षा में आठ बजे पहुँची थी।" and "Teacher: What's the capital of India? Student: Delhi." CER is
     0.61-0.84 on that arm.
   - With the script-only prompt (no vocabulary at all), both produced text on **3/3** non-speech clips,
     e.g. "मैं 7 बजे घर आऊंगा." on silence.
   - Without a script hint they write the wrong script on 17-21 of 180 clips.
4. **Azure `phraseList` is a no-op for `hi-IN` in real time as well as in batch.** R2 (with the list) was
   identical to R1 (without it) on CER and recall, to the third decimal [M]. The same list on `en-IN` gives
   high skeleton accuracy (CER 0.063) but writes all Hindi in Roman script (raw WER 0.65), and Hindi number
   words get lost (pure Hindi: 11/24 numbers).
5. **Hesitations are where engines differ most.** On the 5 hesitation items (×6 clips each):
   - Without context, live-transcribe writes "umm" as Arabic, Tamil, Telugu, Korean or Vietnamese text in
     16/30 clips (e.g. "أم", "ஆம்", "うん。").
   - D4 cuts this to 0 and gets 18/18 answers.
   - Azure Fast turned "उम्म… आठ सत्ते… छप्पन" (8 × 7 = 56, recited as a times table) into "19856" or into
     nothing, on all 6 clips.
6. **Latency** (US container to eastus2, audio streamed at real time) [M]:
   - First partial after speech onset: Azure real time about 1.0 s; live-transcribe about 1.4 s.
   - Final transcript: live-transcribe takes **657 ms p50 / 760 ms p90 after `commit`**. Azure real time is
     final **about 820-880 ms after speech end**, with its own endpointer included.
   - In the cascade, live-transcribe's total is therefore *client endpoint hangover + about 0.66 s*.
   - Batch request time for a 3-6 s clip: 262-355 ms.
7. **MAI-Transcribe-2 is still not testable.** It returned "Enhanced mode with model is currently not
   supported yet" on eastus2 today [M]. `gpt-transcribe`, `gpt-realtime-whisper-2` and
   `gpt-offline-whisper-1` are in the resource's model catalog but **not deployed** [M].
   - **Ask the owner** to deploy `gpt-transcribe` ($0.27/h [V]) and `gpt-realtime-whisper-2`, and to create
     an AIServices or Speech resource in **Central India** so MAI-Transcribe-2 can be measured.
   - Re-running this probe on new arms costs under $1 (`ONLY=<regex> node probe.mjs run`).

---

## 1. Method

### 1.1 Stimuli (30 child-answer utterances; `stt/stimuli.mjs`)

| category | n | shape |
|---|---|---|
| Hinglish (NCERT terms inside Hindi grammar) | 10 | pizza slices, equivalent fractions, numerator/denominator, photosynthesis, water cycle, "पाँच into तीन पंद्रह" |
| pure Hindi (Hindi-medium, class 3 register) | 8 | पृथ्वी/सूर्य, अंश/हर, वाष्पीकरण, पर्णहरित, "सौ में से अड़तालीस घटाओ" |
| Indian English | 7 | "two by four is equal to one by two", "seven eights are fifty six", a request to repeat |
| hesitation / self-correction | 5 | "उम्म… तीन बटा आठ… नहीं नहीं, तीन बटा चार", "umm… मतलब…", "I think it is twenty one… no wait, twenty four", "आठ सत्ते… छप्पन" |

- 16 items contain numbers. Across the 6 clips per item that makes 96 clip-level number sequences.
- 13 items carry a gradable answer, often with distractors; 78 clip-level answers.
- The references follow the E0 convention: Hindi in Devanagari, English in Latin, fillers kept.

### 1.2 Audio (183 clips)

**Two TTS families:**
- **G**: `gpt-4o-mini-tts`, told to sound like a 9-year-old Indian child. Voices `coral` and `sage` alternate.
- **Z**: Azure Speech neural voices (`hi-IN` Ananya/Rehaan; `en-IN` for the English items) with prosody
  pitch +25% and rate +12%.

**Processing:** leading and trailing silence trimmed, then padded to 300 ms before and 600 ms after speech.

**Three acoustic arms:**
- clean;
- white noise at 10 dB SNR;
- pink noise at 10 dB SNR.

SNR is measured against the RMS of the active speech (a node mixer).

**Non-speech clips (3):** 3 s dithered silence, 4 s white noise, 4 s pink noise.

### 1.3 Engines (all Azure-billed on the Taxila AIServices resource, eastus2)

| arm | engine | context |
|---|---|---|
| A0 / A3 | `taxila-transcribe` = gpt-4o-transcribe 2025-03-20, batch | none / `language=hi` + script-only prompt |
| B0 / B3 | `gpt-4o-mini-transcribe` 2025-12-15, batch | none / `language=hi` + script-only prompt |
| C1 | Azure Speech Fast Transcription, batch | locales `hi-IN`,`en-IN` |
| D0 / D4 | `taxila-live-transcribe` = gpt-live-transcribe, realtime transcription session, 40 ms chunks at real time, `commit` at clip end | none / 22 `keywords` (16 lesson terms + 6 decoys) + script-only prompt |
| R1 | Azure Speech **real-time** (Speech SDK 1.x websocket, 16 kHz, 40 ms chunks at real time) | `hi-IN` |
| R2 | same | `hi-IN` + PhraseListGrammar (22 terms) |
| R3 | same | `en-IN` + phrase list |
| R4 | same | continuous LID `hi-IN`/`en-IN` + phrase list |

The script-only prompt contains no vocabulary. It reads:

> "A child aged 8 to 12 in India answers a teacher aloud in Hindi, English, or a Hindi-English mix. Write
> Hindi words in Devanagari and English words in Latin script, exactly as spoken."

E0 showed that a term list placed in a free-text prompt manufactures lesson content out of silence. The
**decoys** never occur in any stimulus, so any decoy in a transcript is an over-biasing insertion.

### 1.4 Scoring (deterministic, no model; `stt/score.mjs`)

- **cerNorm**: CER on the script-agnostic consonant skeleton, spaces removed. Devanagari, Nastaliq and Roman
  all map to one space, so "teen" = "तीन" and "carbon dioxide" = "कार्बनडाइऑक्साइड".
- **werNorm**: WER over per-word skeleton tokens.
- **werRaw**: exact-script WER against the canonical code-mix reference. It shows whether the transcript is in
  the script our string-matching code expects.

For all three, fillers are removed on both sides and digits are mapped to the spoken form the reference
uses, so "15" = "पंद्रह" and "3/4" = "तीन बटा चार".

- **keyRecall**: the answer-carrying terms recovered, script-agnostic.
- **numSeq**: every number in the clip extracted in order, with fractions as `a/b`, and an exact match
  required. A wrong number turns a right answer wrong, so this is the strictest metric here.
- **answers**: the graded value, or the last value after a self-correction, with no distractor present.
- **wrongScript**: any Arabic, Bengali, Tamil, Telugu, CJK, Vietnamese or other non-target script.
- **decoys**: decoy terms inserted.
- **fillerKept**: whether a filler survives into the transcript. This matters for the disfluency features in
  `voice-features-longitudinal`.

### 1.5 n, coverage and cost

- 11 arms × 183 clips = 2,013 calls, one pass.
- Retries only on HTTP 429/5xx.
- 1 live-transcribe timeout (60 s), re-run successfully.
- About 2.4 audio-hours processed in total, for an estimated cost under $3.

---

## 2. Results [M]

### 2.1 Overall (n = 180 speech clips per arm)

| arm | cerNorm | werNorm | werRaw | keyRecall | numSeq | answers | wrong script | decoys | fillers kept | latency |
|---|---|---|---|---|---|---|---|---|---|---|
| A0 4o-tx no hint | 0.282 | 0.359 | 0.441 | 0.619 | 57/96 | 49/78 | 21 | 0 | 9/30 | req 355 ms |
| A3 4o-tx hi + script prompt | 0.225 | 0.301 | 0.346 | 0.682 | 58/96 | 51/78 | 0 | 0 | 6/30 | req 334 ms |
| B0 4o-mini-tx no hint | 0.340 | 0.415 | 0.471 | 0.566 | 49/96 | 46/78 | 17 | 0 | 7/30 | req 320 ms |
| B3 4o-mini-tx hi + script prompt | 0.302 | 0.375 | 0.451 | 0.628 | 52/96 | 47/78 | 1 | 0 | 9/30 | req 320 ms |
| C1 Azure Fast hi+en | 0.072 | 0.124 | 0.191 | 0.857 | 78/96 | 73/78 | 0 | 0 | 12/30 | req 262 ms |
| D0 live-tx no context | 0.068 | 0.112 | 0.173 | 0.870 | 78/96 | 65/78 | **19** | 3 (1 real) | 8/30 | partial 1.44 s, final 1.32 s after end |
| **D4 live-tx kw + script prompt** | **0.026** | **0.049** | **0.103** | **0.938** | **92/96** | **76/78** | **0** | **0** | 12/30 | partial 1.42 s, final 1.32 s after end (0.66 s after commit) |
| R1 Azure RT hi-IN | 0.116 | 0.234 | 0.430 | 0.785 | 70/96 | 74/78 | 0 | 0 | 7/30 | partial 1.03 s, final 0.82 s after end |
| R2 Azure RT hi-IN + phrases | 0.116 | 0.235 | 0.430 | 0.785 | 71/96 | 74/78 | 0 | 0 | 7/30 | same as R1 |
| R3 Azure RT en-IN + phrases | 0.063 | 0.130 | 0.652 | 0.927 | 70/96 | 63/78 | 0 | 0 | 12/30 | partial 1.27 s, final 0.89 s |
| R4 Azure RT LID hi/en + phrases | 0.071 | 0.147 | 0.218 | 0.857 | 73/96 | 74/78 | 0 | 0 | 11/30 | partial 2.26 s, final 0.88 s |

How to read the latency column:
- "final after end" is measured from the last speech sample. For the D arms it includes the 600 ms of
  trailing pad sent before `commit`, which stands in for a client endpointer with 600 ms hangover.
- Live-transcribe p90 after commit: 760 ms.
- Azure real-time p90 after speech end: 890-990 ms.

### 2.2 By noise arm (cerNorm / numSeq; n = 60 per cell)

| arm | clean | white 10 dB | pink 10 dB |
|---|---|---|---|
| A0 4o-tx | 0.065 / 27 of 32 | **0.688 / 2 of 32** | 0.094 / 28 of 32 |
| A3 4o-tx + script | 0.030 / 26 | **0.610 / 4** | 0.035 / 28 |
| B3 4o-mini + script | 0.060 / 24 | **0.781 / 1** | 0.065 / 27 |
| C1 Azure Fast | 0.049 / 26 | 0.085 / 26 | 0.082 / 26 |
| D0 live-tx | 0.037 / 27 | 0.089 / 24 | 0.078 / 27 |
| **D4 live-tx** | **0.021 / 32** | **0.027 / 30** | **0.031 / 30** |
| R1 Azure RT hi | 0.092 / 24 | 0.130 / 23 | 0.126 / 23 |
| R4 Azure RT LID | 0.059 / 26 | 0.079 / 23 | 0.077 / 24 |

- The gpt-4o family is fine on clean and pink audio but collapses on broadband white noise. When it fails it
  writes *fluent, unrelated sentences*, not gibberish, and fluent text is the dangerous kind for a grader.
  `gpt-4o-mini-transcribe` without a hint even switched language, writing Esperanto- and Czech-looking text.
- Real phones apply AGC and noise suppression, so white noise is a stress probe, not a home model [U].
- E0's TV-babble arm, which is speech-on-speech, remains the hard realistic case. It broke every engine
  (`../asr-kids-hinglish.md` §2.2), and this run does not change that.

### 2.3 By TTS family (cerNorm G / Z): who has a home advantage?

| arm | G (gpt-4o-mini-tts) | Z (Azure neural) |
|---|---|---|
| A3 4o-tx | 0.164 | 0.285 |
| B3 4o-mini-tx | 0.231 | 0.373 |
| C1 Azure Fast | 0.063 | 0.080 |
| D4 live-tx | 0.024 | 0.029 |
| R4 Azure RT LID | 0.067 | 0.076 |

- gpt-4o(-mini)-transcribe is markedly worse on Azure-synthesised speech. This is a family effect, or a
  sign that it is fragile to voice variety.
- D4 and the Azure engines are stable across the two sources. **No Azure home-family advantage is visible.**
- The D4 lead holds on both sources, so it is not an artefact of hearing OpenAI's own TTS.

### 2.4 By category (cerNorm; answers)

| arm | Hinglish | Hindi | English | hesitant |
|---|---|---|---|---|
| C1 Azure Fast | 0.073; 24/24 | 0.028; 24/24 | 0.024; 12/12 | 0.206; 13/18 |
| D0 live-tx | 0.047; 21/24 | 0.041; 23/24 | 0.017; 9/12 | 0.224; 12/18 |
| **D4 live-tx** | **0.017; 24/24** | 0.031; 24/24 | **0.007**; 10/12 | **0.064; 18/18** |
| R1 Azure RT hi | 0.101; 24/24 | 0.044; 20/24 | 0.184; 12/12 | 0.166; 18/18 |
| R4 Azure RT LID | 0.103; 24/24 | 0.044; 20/24 | 0.020; 12/12 | 0.125; 18/18 |

Notes:
- Azure `hi-IN` is strongest on pure Hindi. On Hinglish it writes English terms in Devanagari, which the
  skeleton forgives and the raw-script metric does not.
- D4's 2 lost English answers come from one clip pair: the Z voice's "two by four" became "Dubai four" in
  both noise arms.
- D4's other 2 number misses: "सौ में से" (100) became "समय से" on the Z noise clips.
- R1's misses: सात (7) became साथ ("with") on 3 clips. That homophone is a classic Hindi trap, and it argues
  for keeping key numbers in `keywords` [U].

### 2.5 Non-speech (silence, white, pink: n = 3 per arm)

| arm | output on non-speech |
|---|---|
| A0, B0, C1, D0, D4, R1-R4 | 0/3 |
| **A3** 4o-tx + script-only prompt | **3/3**: "मैं 7 बजे घर आऊंगा." (silence), "पानी" (white), "साढ़े." (pink) |
| **B3** 4o-mini + script-only prompt | **3/3**: "Yes, sir." (silence), "Teacher: What's the capital of India? Student: Delhi." (white), "छोड़ो" (pink) |

E0 showed that a *vocabulary* prompt makes the gpt-4o family hallucinate. This run shows that **even a prompt
with no vocabulary at all**, only speaker and script, is enough to make both models produce text from
nothing. Under the "a model never grades" law these models are disqualified from any answer-bearing lane. The
same prompt sent to live-transcribe (D4) produced nothing.

### 2.6 Other instrument facts

- **Live-transcribe without context writes foreign scripts on fillers.** In 19/180 clips (16 of them on the
  hesitation items) it wrote fillers and short Hindi words as Arabic, Bengali, Tamil, Telugu, Kannada,
  Japanese, Korean or Vietnamese.
- **D0 inserted a decoy once**: "एक decimal fractions" for "equivalent fractions". The scorer counted 3
  decoy hits; the other 2 (m04-G) are skeleton-substring false positives, where "doce multiply" contains the
  skeleton of "decimal". D4, with the decoy in its own keyword list, inserted none.
- **The context in D4 is load-bearing, not optional.** The client must strip a refused field and retry,
  because E0 saw sporadic "parameter not supported" errors. It also needs a watchdog: 1 timeout here, 3/135
  in E0.
- **Fillers survive rarely in every engine** (at best 12/30). None of them is a reliable disfluency counter.
  The disfluency features in `voice-features-longitudinal` should come from on-device pause and energy
  analysis, not from transcript fillers [U].
- **Azure continuous LID costs about 1.2 s of first-partial latency** (2.26 s vs 1.03 s) and adds nothing to
  final latency.
- **The Speech SDK needs a proxy setting in this container.** It honours `SpeechConfig.setProxy()`, which
  `probe.mjs` reads from `HTTPS_PROXY`.

---

## 3. Cost (per hour of audio streamed or sent) [V, Azure retail API, eastus2, 2026-10-02]

| engine | price |
|---|---|
| gpt-live-transcribe (Global) | **$1.02/h** |
| Azure Speech S1 real-time STT | **$1.00/h** |
| gpt-transcribe (Global), not deployed | $0.27/h |
| gpt-4o-transcribe | ~$0.36/h (audio input $6 per 1M tokens) |
| gpt-4o-mini-transcribe | ~$0.18/h |
| Azure Fast Transcription | ~$0.36/h (harvested figure) |

The streamed engines bill for every second sent. **Gate the mic stream with the on-device VAD** so only
child speech plus hangover is sent. A child talks for perhaps 25-35% of a lesson [U], so live-transcribe
then costs about $0.30 (≈ ₹25) per lesson-hour.

On performance-first model choice, D4's accuracy lead over every cheaper option (numbers 92/96 vs at best
78/96) is worth the price.

---

## 4. Recommendation

| role | engine and config | why | reverse if |
|---|---|---|---|
| **Default live STT (cascade lane L)** | `taxila-live-transcribe` + per-lesson `keywords` (lesson terms + the item's answer numbers in both scripts) + speaker/script `prompt` with no vocabulary; client VAD gates and commits; watchdog strips a refused field and retries | best on every metric, every arm, both TTS families; 0 hallucination, 0 wrong script, 0 decoy insertions | E1 real-child CER or answer accuracy loses to R4/C1, or MAI-Transcribe-2 / gpt-transcribe wins a rerun |
| **Streaming fallback** (live-tx outage, timeout, refused session) | Azure Speech real-time, continuous LID `hi-IN`+`en-IN` | independent service and family; 0 hallucination; 74/78 answers; final ≈ 0.88 s after speech end | LID latency or Hinglish script hurts the real-child turn feel |
| **Second opinion on answer-bearing turns (lane G)** | Azure Fast Transcription `hi-IN`+`en-IN` on the stored turn audio (ephemeral) | 262 ms, 73/78 answers, 0 hallucination; disagreement with lane L means ungraded plus a natural repair move, never a guess | it disagrees with L on real children so often that repairs become annoying |
| **Do not use in live or grading lanes** | gpt-4o-transcribe, gpt-4o-mini-transcribe | fabricate fluent text on white noise and, with any prompt, on silence | a new version passes the non-speech and white-noise probes |
| **Do not rely on** | Azure `phraseList` for `hi-IN` | measured no-op in batch (E0) and real time (here) | Azure enables it for hi-IN |

**Next measurements:**
1. Rerun with `gpt-transcribe` and `gpt-realtime-whisper-2` once the owner deploys them, and with
   MAI-Transcribe-2 verbatim once a Central India resource exists.
2. Add E0's TV-babble arm to this harness.
3. Measure India↔eastus2 RTT from a Jio/Airtel phone.
4. E1 with real children (the gate).

## 5. Proposed `context/` entries

These are in `context/inbox/stt-hinglish-v2.json`, for the main loop to merge.

---

## Review (adversarial, 2026-10-02)

I re-read `stt/stimuli.mjs`, `stt/score.mjs`, `stt/probe.mjs` and the price file, and recomputed from
`stt/results-2026-10-02.json`. **The D4 default survives.** Several numbers and one recommendation need
correcting before anyone builds on them.

### R1. Survives: D4's accuracy lead holds when items, not clips, are the unit
- The 6 clips per item are not independent (2 voices × 3 noise arms of one sentence), so 67-vs-14 overstates n.
- Per item (n = 30), D4 has lower mean CER than R4 on 16 items and higher on 5. Mean ΔCER = 0.045,
  bootstrap 95% CI [0.020, 0.074].
- Against C1, D4 is lower on 14 items and higher on 6. ΔCER = 0.045, CI [0.010, 0.101].
- Report these item-level figures alongside the clip counts.

### R2. Must fix: the decision recommends a keyword config that was never tested and leaks the answer
- §4 and `decisions.md#stt-default-live-transcribe-kw` set `keywords` = lesson terms **plus "the item's answer
  numbers in both scripts"**.
- The tested D4 list had **no answer numbers.** It had 16 lesson terms plus 6 decoys, and the only number in
  it was the decoy सत्रह.
- Putting the correct answer into the recogniser's bias list pushes a child's *wrong* number towards the
  *right* one. That manufactures correct answers, which the law that a model never grades exists to prevent.
- Fix: until a test with wrong-answer stimuli shows no pull towards the biased number, keep answer values out
  of `keywords`. That test: the child says 8, `keywords` contains 7, measure how often the transcript says 7.
- Amend the decision text accordingly.

### R3. Must fix: the latency comparison is not like for like, and Azure is faster to the final transcript
- Both engines received identical audio, including the same 600 ms trailing pad.
- Measured from the last speech sample:
  - D4 final = **1.32 s** (table §2.1);
  - Azure real-time final = **0.82–0.88 s**.
- Azure was about 0.45–0.5 s faster to the final transcript, and about 0.4 s faster to the first partial
  (1.0 s vs 1.4 s, LID off).
- The headline phrasing "657 ms after commit vs 820–880 ms after speech end" makes live-transcribe look faster.
  It is not.
- Under the performance-first rule, D4 still wins on accuracy. The cost is real, though: about 0.5 s of
  turn-taking latency. Shrink it by trimming client VAD hangover, and record it as a reversal condition.

### R4. Must fix: the scorer penalises Azure's inverse text normalisation, so some Azure "number misses" are scorer artefacts
- C1 `d05-G-clean` = "8 7 56।". That is a correct rendering of "आठ सत्ते छप्पन", and it graded
  `answer: true`. The numSeq miss comes from सत्ते not being in `NUM`.
  - So the §0/§2.4 claim "19856 or nothing **on all 6 clips**" is wrong: 1 of the 6 clips is correct.
- C1 `m09` ×3: "0.5 पिज़्ज़ा" for "half pizza" fails numSeq, because "half" is not a number in the reference.
- R1/R2 `e04` ×6: "सेवन एट्स और 56" fails because Devanagari-transliterated English numerals are not in `NUM`.
  The skeleton CER forgives this; the number extractor does not.
- Corrected estimate:

  | arm | report | corrected |
  |---|---|---|
  | C1 numbers | 78/96 | ≈ 82/96 |
  | R1 numbers | 70/96 | ≈ 76/96 |

- D4 still leads at 92/96, so the ranking stands. The gap is smaller.
- These Azure misses are real errors, not scorer artefacts:
  - "7/8 are fifty-six";
  - "पाँच into 315";
  - सात → साथ.
- Scorer flaw: the skeleton maps th→t and drops vowels. So the सात/साथ homophone that the report highlights
  costs **0** cerNorm, and only numSeq catches it.

### R5. The gpt-4o-transcribe rejection is right, but the stated reason rests on a single noise condition
- Over clean and pink audio only, A3 (gpt-4o-transcribe with `hi` and the script prompt) is **second-best**:

  | arm | CER (clean + pink) | numbers (clean + pink) |
  |---|---|---|
  | D4 | 0.026 | 62/64 |
  | A3 | 0.032 | 54/64 |
  | C1 | 0.065 | 52/64 |
  | R4 | 0.068 | 50/64 |

- The overall "0.225" comes almost entirely from the synthetic white-noise arm. §2.2 itself calls that arm a
  stress probe and not a home model.
- What actually disqualifies these models is the fabrication of fluent text:
  - on white noise;
  - on non-speech when given any prompt.
- Note that A0 with no prompt produced 0/3 on non-speech.
- Restate the reason as "fabricates fluent text under broadband noise, and on silence when prompted", not
  "CER 0.225–0.34".

### R6. Wrong price: real-time with language detection costs more than $1.00/h
- The price file has `S1 Speech to Text Enhanced Feature Audio = $0.30/h`. Continuous language ID is billed
  under that enhanced add-on [V, retail API meter; mapping per Azure pricing page].
- So R4 is **≈ $1.30/h**, not $1.00/h. Correct this in §3 and in `models/stt-routing.md`.
- Fast Transcription at $0.36/h is confirmed in `prices-speech-eastus2.json`, so it is [V], not "harvested".
  There is also a $0.10/h promo meter.
- The $1.02/h for gpt-live-transcribe matches `tech-and-market.md`. E0, however, gave $1.02/h to
  *gpt-realtime-whisper*. Re-pull the gpt-live-transcribe meter by name before quoting it.
- The ≈ $0.30 per lesson-hour assumes 25–35% child talk time [U]. VAD hangover and pre-roll inflate the
  streamed seconds, so budget about 0.4×.

### R7. Methodology limits that the bottom line understates
1. **Non-speech n = 3 per arm.** "0 hallucination" on 0/3 has a 95% upper bound of about 63%.
2. **The TV-babble arm was not rerun.** Speech-on-speech is the realistic failure mode, and it broke every
   engine in E0.
3. **Stimulus voices.** These are adult TTS voices pitched up, or "told to sound like a child". Both read
   the reference text verbatim and are perfectly articulated. A real child's speech differs:
   mispronunciations, slower syllables, higher F0 from vocal-tract length, not pitch shift.
   - Whether Ananya and Rehaan are child-persona voices is unverified; check the voices list.
   - Expect absolute CER on real children to be several times higher. Rankings may reorder, and engines
     trained with more Indian child audio could gain most.
4. **The keyword list equals the stimulus vocabulary.** All 16 terms occur in the stimuli, so keyRecall for
   the D4/R2–R4 arms is partly circular. A real per-lesson list will also be closer to the stimuli than a
   cross-subject list.
5. **D4 changes two factors at once (keywords + prompt).** There is no keywords-only or prompt-only
   live-transcribe arm. The claim that a vocabulary-free prompt is safe on live-transcribe therefore rests on
   n = 3 non-speech clips. Add arms D1 (keywords only) and D2 (prompt only).
6. **Single region, single pass, US container.** India-to-eastus2 RTT is unmeasured. A Central India
   deployment would cut Azure Speech RTT; check whether live-transcribe is available there.
7. **Azure arms were not tuned.** For example, `SegmentationSilenceTimeoutMs` was not tuned, which affects R3's
   latency conclusion, and C1 was given no phrase list.

### R8. Missing candidates (the Azure-only rule allows open models self-hosted on Azure GPU)
- These were not considered and should be on the rerun list:
  - AI4Bharat IndicConformer (MIT; Hindi, child-heavy IndicVoices data);
  - Whisper large-v3 / v3-turbo (MIT) and Indic fine-tunes;
  - Meta Omnilingual ASR (Apache-2.0);
  - Azure **Custom Speech** fine-tuned on E1 child audio (S1 $1.20/h, plus $0.054/h hosting per the price file).
- **Licence trap:** several Indic training and eval corpora are CC BY-NC (HiACC is already flagged). Any
  fine-tune must check its data licence, not just the model's.
- The existing gaps (gpt-transcribe, gpt-realtime-whisper-2, MAI-Transcribe-2) are correctly flagged.

### R9. Azure-only production compliance: passes
- Every engine is Azure-billed on the Taxila AIServices resource.
- `probe.mjs` makes no OpenRouter or third-party calls.
- One note: `taxila-live-transcribe` is a **Global** deployment, so children's audio may be processed outside
  the region. Compliance is deprioritised, but put this on the DPDP list. A Data Zone or regional deployment
  is the fix if one becomes needed.
