# Listening samples for the teacher-voice blind ear test (2026-10-02)

**What this is.** A blinded, loudness-matched listening pack and a rating page for the question every earlier
product in this lineage answered wrongly by metrics: *does this voice sound like a real Indian teacher talking to
my child?* Three short teacher passages from one real lesson shape, synthesised with **gpt-4o-mini-tts × 10 voices**
and **gpt-realtime-2.1 (`taxila-realtime`) × 4 voices**. Plus a script-variant arm, an instruction-off control,
and catch trials. All of it sits behind random codes, with a self-contained page that rates four axes and exports JSON.

**What this is not.** It is not a ranking. No human has rated anything yet. Every number below is an
*objective flag* for listeners to check. None of them decides a voice. This lineage has two warnings on that:
Azure TTS won pronunciation 15/15 and lost by ear as "not human, not Indian" (`companion-tech.md` §2, `azure-tts`),
and Gurukul's instrument "has never been used on a human ear" (`gurukul.md` §3.5).

Evidence tags: **[M]** measured here, **[P]** prior measurement in this repo or a harvested sibling,
**[S]** external source, **[I]** inference, **[U]** unverified.

---

## 0. Findings (TL;DR)

1. **Everything requested generated, with zero errors** [M]. gpt-4o-mini-tts on this Azure resource accepted
   **all 10 requested voices**, including `marin` and `cedar`: 40/40 calls returned HTTP 200 mp3. gpt-realtime-2.1 took all 4
   voices, and the session echo confirmed each one. It read all 12 scripts **verbatim on the first take**
   (own-transcript token similarity 1.00 on 12/12, so no take was discarded under the pre-registered rule).
2. **Raw loudness spans 14 LU across mini-tts voices** [M]: `sage` −32.0 LUFS, `coral` −27.8, `alloy` −18.1. An
   unnormalised ear test would have measured loudness, not voice: louder clips are routinely heard as clearer
   and "better". The listening copies are linear-gain matched to **−24.5 ± 0.2 LUFS** (57/57 clips linear).
3. **`loudnorm linear=true` is a request, not a guarantee** [M]. At −20 LUFS / −2 dBTP, ffmpeg silently fell back
   to *dynamic* (time-varying) gain on the peakiest clips (peak-to-loudness ratio up to 22.4 dB), which reshapes
   prosody differently per voice. The pack is now rendered at −24 LUFS / −1 dBTP, and the applied type is checked
   per clip. Proposed rejection entry in §11.
4. **The Hindi maths term is a real flag** [M, proxy]. In passage C, the ASR round-trip (gpt-4o-transcribe) heard
   **तुल्य भिन्न** exactly in **5/10 mini-tts clips** (alloy, ash, sage, verse, cedar) and **0/4 realtime clips**
   (heard as भिम्म, तुल्ले भिन्ने, भिन्य, भिन्द). One-sided Fisher p = 0.13, so this is **not significant**. Treat it as
   an item for the ear, not a verdict. An excluded smoke take of realtime `marin` was heard as "तुलेज धिन्ने". It points the
   same way as the sibling probe's realtime Urdu/Bengali-script ASR passes (`voices-hindi.md` §3.1).
5. **Latency (US container, text-in)** [M]: mini-tts time to first byte median **303 ms** (265-805, the 805 was
   the cold first call), synthesis at RTF 0.14. Realtime time to first audio median **909 ms** (598-1874) *for
   reading a script*. It still spent 14-29 reasoning tokens per response, and it emits **20 audio tokens per second**
   of speech.
6. **Long mini-tts passages drift in loudness** [M]: loudness range up to 9 LU (`sage` fades ~10 LU over 25 s;
   `verse`, `coral` 6-7.5 LU), against ≤ 3.8 LU for every realtime clip (median 3.25 vs 2.4). This is either
   expressive dynamics or a fade artefact. Only ears can say. It is the first thing to listen for on those codes.
7. **Size and cost** [M]: 57 listening clips = 12.6 MB. All audio including originals = **37.6 MB** (cap 40). Total API
   spend for the pack ≈ **$0.9** at list prices (§5.5).

---

## 1. Files

All paths are under `docs/research/voice/`.

| path | what | give to listeners? |
|---|---|---|
| `samples/blind-test.html` | self-contained rating page (inline CSS/JS, no network), manifest injected | **yes** |
| `samples/<CODE>.mp3` × 57 | blinded listening copies: edge-trimmed, uniform 150 ms lead / 400 ms tail, linear-gain −24.5 LUFS, mp3 64 kbps mono 24 kHz | **yes** |
| `samples/manifest.json` | `[{code, block}]` only, the page's clip list | harmless |
| `samples/KEY.json` | **unblinding file**: code → engine, voice, passage, instructions, raw file, every metric, ASR text, catch-trial sources | **never** |
| `samples/raw/<CODE>.mp3` × 40 | gpt-4o-mini-tts originals exactly as returned (128 kbps mono 24 kHz) | **never** (file type and bitrate unblind the engine) |
| `samples/raw/<CODE>.flac` × 12 | realtime originals: the WAV-wrapped PCM16 24 kHz, archived as FLAC (decoded PCM sha256-verified bit-exact against the WAV payload, hash in KEY) | **never** |
| `gen-listening-samples.mjs` | generator: phases `gen` · `post` · `catches` · `listen` · `page` | — |
| `score-blind-test.mjs` | unblind + score exports with pre-registered rules | — |

To share the test: send **only** `blind-test.html` plus the 57 top-level `*.mp3` (a zip, an Azure Storage static
site, or any static host). The page plays by relative path, so it works from `file://` and from a web server
(verified in headless Chromium, §6). Hidden repeats are byte-identical copies of their source. That only unblinds
someone who hashes files.

**Why FLAC for the realtime originals.** The task asked for WAV wrapping and a < 40 MB total. WAV originals
(15.6 MB) + mp3 originals (17.7 MB) + a fair listening set (12.6 MB) = 45.8 MB. The choices were: lower the
listening bitrate (this degrades exactly what is being judged), drop the separate listening copies (this unblinds via
codec, file type, loudness and onset gap), or archive the WAV losslessly. The post phase chose the last, *only
because* the total exceeded 39.5 MB. It hashed the decoded PCM against the WAV payload before deleting each WAV.
`ffmpeg -i raw/X.flac raw/X.wav` restores identical samples.

---

## 2. Stimuli. TEST STIMULI ONLY: never copy into a prompt, kit or few-shot block

These are *listening material*. Sentence-shaped text in a teacher prompt gets recited: example quotes were
recited 4/5 turns and dropped to 0 after removal (`companion-tech.md` law `recited-prompt`). These passages live in docs and in the
generator, and nowhere else. Each passage was written to one lesson's move shapes (`indian-teacher-discourse.md`
§3.1), so listeners judge a voice on teacher-shaped speech rather than announcer copy.

| id | block | move shape | language / script | child | length |
|---|---|---|---|---|---|
| P1 | A | OPEN: name + warm token + callback to a child-volunteered fact (grandmother's visit, her parathas) + two short rising questions, then stop | Hinglish, Roman | Riya, 9, class 4 | 40 words, 13-18 s |
| P2 | B | FRAME (concrete object) → EXPLAIN (halves → quarters) → tag-check (*hai na?*) → name the term once → CHOICE-sized question | Hinglish, Roman, Hindi matrix with English maths nouns | Riya | 82 words, 30-37 s |
| P3 | C | the same as P2, conversational Hindi, NCERT Hindi-medium term (*तुल्य भिन्न*) as the pronunciation stress item | Hindi, Devanagari | class 3 | 79 words, 30-36 s |
| P1m, P2m | A, B | P1/P2 word-for-word, with Hindi words in Devanagari and English words in Latin | Hinglish, mixed script | | |

The texts as synthesised (stimuli):

- **P1**: Hello Riya! Kaisi ho aaj? Arre haan, pichhli baar tumne bataya tha na ki Sunday ko nani aane wali
  hain... aur ki nani ke haath ke aloo parathe duniya mein sabse best hote hain. Toh? Aayi nani? Parathe mile?
- **P2**: Achha, ek pizza socho. Usko do barabar hisson mein kaata, aur tumne ek hissa liya... yaani half, one by
  two. Ab wahi pizza chaar barabar slices mein kaato. Half pizza ke liye ab kitne slices lene padenge? Do, hai na?
  Toh one by two aur two by four dikhte alag hain, par pizza utna hi milta hai. Inhe kehte hain equivalent
  fractions. Achha, ek baat batao... agar pizza aath slices mein kata ho, toh half ke liye kitne slices logi?
- **P3**: अच्छा, एक पिज़्ज़ा सोचो। उसे दो बराबर टुकड़ों में काटा, और तुमने एक टुकड़ा लिया... यानी आधा पिज़्ज़ा। अब वही
  पिज़्ज़ा चार बराबर टुकड़ों में काटो। आधे पिज़्ज़ा के लिए अब कितने टुकड़े लेने होंगे? दो, है ना? तो एक बटा दो और दो
  बटा चार देखने में अलग हैं, पर पिज़्ज़ा उतना ही मिलता है। इन्हें तुल्य भिन्न कहते हैं। अच्छा, एक बात बताओ... अगर
  पिज़्ज़ा आठ टुकड़ों में कटा हो, तो आधे के लिए कितने टुकड़े लोगी?
- **P1m / P2m**: the mixed-script renderings are in `gen-listening-samples.mjs` `PASSAGES`.

Design notes on the stimuli:
- **Turn length is deliberately over the live cap.** P2/P3 are ~80 words, whereas a live turn is ≤ 25 words
  (`measurements.md#realtime-teacher-bakeoff`). A listener needs 25-35 s to judge warmth and accent drift, and the
  drift finding (§0.6) only shows on long passages. The ear test judges a voice; the live cap judges a turn.
- **Child gender is fixed (girl, *logi*)**, so gender agreement is audible and constant across arms
  (`indian-teacher-discourse.md` §4.4).
- **P3 is above class 3 on purpose for one word.** *तुल्य भिन्न* is a class 5 Hindi-medium term. It is there as the
  hardest conjunct (ल्य, न्न) for the "Hindi pronunciation" axis.
- **No AI disclosure is spoken in any clip.** A spoken disclosure unblinded every Gurukul test
  (`hp-gurukul-chain.md` §5.1). Disclosure is an app-voiced UI matter and a separate gate.

---

## 3. Arms

| arm | engine (deployment) | voices | passages | n clips |
|---|---|---|---|---|
| core TTS | gpt-4o-mini-tts (`gpt-4o-mini-tts`), `instructions` = voice note | alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar | P1, P2, P3 | 30 |
| script variant | gpt-4o-mini-tts, voice note | marin, coral, shimmer, sage (the four female-timbre voices) | P1m, P2m | 8 |
| instruction-off control | gpt-4o-mini-tts, **no** `instructions` | marin, coral | P2 | 2 |
| core realtime | gpt-realtime-2.1 (`taxila-realtime`), voice note + read-verbatim rule last | marin, cedar, coral, shimmer | P1, P2, P3 | 12 |
| degraded controls (catch) | 450-2600 Hz band, 8 kHz resample, 5-bit crush, from a random source per block | — | one per block A, B, C | 3 |
| hidden repeats (catch) | byte copy of a random source clip under a new code | — | A, B | 2 |
| **total listening clips** | | | A 20 · B 22 · C 15 | **57** |

Why the three additions beyond the requested matrix:
- **Script variant.** On a cascade lane the *text script* is the production lever: the LLM brain can be told to
  emit Roman or mixed script. Meera measured bare "hai" round-tripping as English "hi" (`companion-tech.md`
  `hinglish-tts-l1`), and Gurukul made script a first-class variable (`gurukul.md` §3.6). The realtime lane is not
  varied, because in production it generates its own words.
- **Instruction-off control.** This tests whether the Indian-accent voice note changes what listeners hear. If it
  doesn't, the note is decoration and the voice is the only lever. The same pair exists in the sibling probe
  (`voices-hindi.md` §3.2, `tts0:marin`), so the two can be cross-checked.
- **Catch trials.** Without them a careless rater is indistinguishable from a discerning one
  (`hp-gurukul-chain.md` §5.1). The degraded control plays the role of a MUSHRA low anchor (ITU-R BS.1534 [S]).
  The hidden repeat measures a listener's own consistency. Every block holds a degraded control, so a child's
  one-block session is still validatable.

Gender of timbre [I, listen to confirm]: ash, ballad, echo, verse and cedar are commonly described as male, and
alloy as neutral. The voice note says "young Indian woman", and an instruction does not change timbre. They are kept
because the task asked for the full roster, and because a male teacher ("bhaiya/sir") is a legitimate Taxila persona
(tutor selection). The axis wording "real Indian teacher" is gender-neutral on purpose.

---

## 4. Method

### 4.1 Synthesis (`gen-listening-samples.mjs gen`)

- **gpt-4o-mini-tts:** `POST $AZURE_OPENAI_ENDPOINT/audio/speech`,
  `{model: "gpt-4o-mini-tts", voice, input, instructions, response_format: "mp3"}`. Up to 4 attempts on
  429/5xx (none were needed: `http_attempts` = 1 on 40/40). OpenAI documents `instructions` as controlling "accent,
  emotional range, intonation, impressions, speed of speech, tone, whispering", and recommends `marin`/`cedar` for
  best quality [S: OpenAI TTS guide].
- **gpt-realtime-2.1:** `wss://<host>/openai/v1/realtime?model=taxila-realtime`, header `api-key`. Each clip runs
  in **its own session**, so no conversation history carries across passages. The sequence is
  `session.update {type: realtime, instructions, output_modalities: [audio], audio.input.turn_detection: null,
  audio.output: {voice, format: audio/pcm 24 kHz}}` → `conversation.item.create` (user `input_text` = passage) →
  `response.create`. It collects `response.output_audio.delta` (base64 PCM16 24 kHz), then wraps the result as WAV. It
  also records `response.output_audio_transcript.delta`, `usage`, and the session's voice echo. Voice is fixed per session before
  any audio, which matches the documented rule that it cannot change after first audio [S: OpenAI realtime guide]. Sessions were spaced 7 s apart
  to stay under the deployment's 10 RPM.
- **The voice note** is a *description of a voice*, not a line she could say: an Indian woman in her mid-twenties,
  a North-Indian primary teacher with Hindi as first language; Indian accent throughout; retroflex/aspirated/nasal
  Hindi phonetics; one child beside her; warm, unhurried, rising questions; not an announcer or kids-TV register.
  It is identical for both engines. The realtime session adds a **read-verbatim rule appended last**, because
  position is mechanism (`companion-tech.md` `prompt-position`: mid-brief 0/8, last 8/8).
- **The fidelity rule was fixed before generation.** A realtime take is kept only if its own transcript matches the script
  at normalised-token LCS similarity ≥ 0.80, with at most 3 takes. The rule guards "did it read the script" and never "did it
  sound nicer" (Gurukul: never regenerate for a nicer sample). Result: 12/12 first takes kept, 0 discarded. mini-tts is
  single-take by construction.
- **The generator refuses to overwrite an existing `KEY.json`.** Deleting the key is the only way to regenerate, and
  that should be deliberate.

### 4.2 Equal geometry and blinding (`post`, `catches`, `listen`, `page`)

| leak | how it would unblind | what was done |
|---|---|---|
| file type and codec | `.wav` = realtime, `.mp3` = TTS; 128 kbps vs PCM | every listening copy is mp3 64 kbps mono 24 kHz, named `<CODE>.mp3` |
| loudness | 14 LU raw spread (§0.2); the louder clip wins | two-pass ffmpeg `loudnorm` **linear** to I −24 / TP −1. The applied type is read back from pass 2 (57/57 linear). Result −24.72 … −24.34 LUFS |
| onset and tail gaps | engines differ in leading silence | edge silence trimmed at −50 dBFS, then a uniform 150 ms lead and 400 ms tail |
| code shape | counters, hashes of arm/item, audio hashes leak (`hp-gurukul-chain.md` §5.1) | 4-character codes drawn from `crypto.randomInt` over an unambiguous alphabet, unrelated to content |
| order | the same order for everyone confounds voice with position and fatigue | blocks in fixed order A, B, C; clips shuffled **per listener** (seeded, stored); position exported |
| page text | voice or engine names in HTML | the `page` phase scans the page for every voice and engine word and refuses to write on a hit (0 hits) |
| spoken disclosure | Gurukul trap | none in any stimulus |

### 4.3 Objective flags (`post`)

Per clip, KEY.json records: raw and trimmed duration, raw and trimmed LUFS / true peak / loudness range, words
per second, latency, and an **ASR round-trip** through `taxila-transcribe` (gpt-4o-transcribe, legacy
`/openai/deployments/…/audio/transcriptions` route; the `/openai/v1` route 404s for transcription on this
resource, per `probe-voices-hindi.mjs`). From the ASR it scores key-term recall over bilingual spelling aliases,
and token similarity to the script.

How to read the ASR flags:
- **Script similarity is meaningless for Roman passages.** The ASR writes Hinglish in Devanagari ("पीजा", "equivalent"),
  so P1/P2 similarity is ~0 by construction. That is the known script-truth trap (`gurukul.md` §3.6). Use recall.
- **gpt-4o-transcribe is an LLM ASR and autocorrects from context.** A clean recall says little. An *odd spelling of
  a common word* is the informative signal.
- Recall misses on "pizza" in the first pass were **spelling** (पीजा/पिज़ा), not pronunciation. The aliases were
  widened and recall re-scored from the stored ASR text. This is an instrument fix, not a re-roll.

---

## 5. Results (generation; no human ratings yet)

### 5.1 gpt-4o-mini-tts, core arms (voice note on). Codes are P1 / P2 / P3

| voice | codes | TTFB median ms | speech s (P1/P2/P3) | words/s | raw LUFS (mean) | max LRA (LU) | ASR recall | ASR heard *तुल्य भिन्न* as |
|---|---|---|---|---|---|---|---|---|
| alloy | 4JAM/7NAF/F7QE | 286 | 15.5 / 34.7 / 31.9 | 2.43 | −18.4 | 2.9 | 0.92 | तुल्य भिन्न ✓ |
| ash | H49F/ACJU/FW7Q | 375 | 18.1 / 36.0 / 34.5 | 2.22 | −22.4 | 5.6 | 0.87 | तुल्य भिन्न ✓ |
| ballad | KUNC/M3UC/7HVJ | 316 | 17.6 / 34.9 / 33.3 | 2.29 | −24.8 | 3.9 | 0.96 | तुल्य भिन |
| coral | 4HHM/Y9WR/E37F | 395 | 18.2 / 33.5 / 30.2 | 2.38 | −27.8 | 6.3 | 0.92 | तुल्यभिन |
| echo | M4QR/4KKV/R9DN | 277 | 15.4 / 30.4 / 33.0 | 2.52 | −19.9 | 4.2 | 0.96 | तुल्य भिन |
| sage | EYXN/AHK4/LXEE | 305 | 15.7 / 35.4 / 36.1 | 2.31 | −29.5 | 8.3 | 1.00 | तुल्य भिन्न ✓ |
| shimmer | 3LT9/VQJJ/4MT7 | 280 | 15.8 / 33.2 / 32.0 | 2.45 | −20.4 | 4.5 | 1.00 | तुल्य भिन्ने |
| verse | LT47/YUKN/HEYJ | 384 | 18.2 / 37.3 / 30.7 | 2.29 | −24.5 | 7.5 | 1.00 | तुल्य भिन्न ✓ |
| marin | FYWT/XDMF/RED3 | 291 | 14.8 / 32.8 / 32.8 | 2.49 | −21.8 | 3.4 | 0.92 | तुल्य भिन्ण |
| cedar | 9QWJ/RKUX/WX3N | 298 | 13.3 / 30.2 / 30.6 | 2.72 | −22.3 | 4.1 | 1.00 | तुल्य भिन्न ✓ |

Support: **10/10 voices accepted** on mini-tts here (0 errors, 40/40 HTTP 200). OpenAI's API lists 13 voices
(also fable, nova, onyx) [S]. Those three were not requested. Wall time 2.0-5.1 s for 13-37 s of audio (median RTF 0.14).

### 5.2 gpt-realtime-2.1 (`taxila-realtime`), read-verbatim. Codes are P1 / P2 / P3

| voice | codes | TTFA ms (P1/P2/P3) | speech s | words/s | raw LUFS | max LRA | verbatim (min sim) | ASR recall | ASR heard *तुल्य भिन्न* as | audio tokens (3 clips) |
|---|---|---|---|---|---|---|---|---|---|---|
| marin | KDVY/DK4M/YE4M | 1278 / 879 / 598 | 16.1 / 28.2 / 32.5 | 2.56 | −23.4 | 2.3 | 1.00 | 0.91 | तुल्य भिम्म | 1558 |
| cedar | VJ4F/ERCY/RXW7 | 832 / 796 / 1165 | 14.7 / 29.8 / 33.3 | 2.57 | −22.0 | 3.8 | 1.00 | 0.87 | तुल्ले भिन्ने | 1581 |
| coral | DNAQ/7JUD/DWVT | 965 / 774 / 777 | 16.8 / 31.0 / 35.0 | 2.39 | −25.9 | 3.2 | 1.00 | 0.96 | तुल्य भिन्य | 1680 |
| shimmer | MVTV/TUHH/HC7V | 1660 / 939 / 1874 | 16.2 / 32.9 / 33.1 | 2.41 | −20.1 | 2.4 | 1.00 | 0.96 | तुल्य भिन्द | 1666 |

- 12/12 sessions echoed the requested voice. `status=completed` on all. Wall time to `response.done` 4.0-11.7 s
  (median RTF 0.25; slower than mini-tts, still faster than real time).
- Output tokens across 12 responses: 6,485 audio + 2,050 text + 210 reasoning; input 4,432 text tokens (the instructions plus
  passage, ~370 per session, uncached because every session was fresh). Audio is **20.0 tokens per second of speech**.
- ASR misses on P1 for marin/cedar were the name "Riya", heard in another spelling. Not a pronunciation flag.

### 5.3 Variants

| code | voice | passage | instructions | speech s | words/s | raw LUFS | LRA | ASR recall |
|---|---|---|---|---|---|---|---|---|
| CHY7 | marin | P1m (mixed script) | note | 15.2 | 2.57 | −21.2 | 1.0 | 1.00 |
| 34NE | coral | P1m | note | 15.0 | 2.59 | −27.9 | 1.9 | 1.00 |
| NFMQ | shimmer | P1m | note | 14.0 | 2.78 | −20.4 | 1.7 | 1.00 |
| QWXN | sage | P1m | note | 17.8 | 2.19 | −30.7 | 2.5 | 1.00 |
| UXKT | marin | P2m | note | 33.3 | 2.40 | −21.5 | 3.3 | 1.00 |
| VNQA | coral | P2m | note | 33.2 | 2.41 | −28.4 | 4.4 | 1.00 |
| 3FWU | shimmer | P2m | note | 30.9 | 2.59 | −20.7 | 4.3 | 1.00 |
| X3F3 | sage | P2m | note | 35.0 | 2.29 | −29.3 | **9.0** | 0.88 |
| TTQM | marin | P2 | **none** | 32.5 | 2.46 | −21.1 | 2.8 | 1.00 |
| WTND | coral | P2 | **none** | 34.5 | 2.32 | −26.2 | 5.2 | 0.88 |

The objective columns cannot separate script variants or the note on/off. That is the point of putting them in front of ears.

### 5.4 Catch trials (hidden among the arms)

| code | kind | source | block | expectation used by the scorer |
|---|---|---|---|---|
| QN97 | degraded control | FYWT (tts marin P1) | A | clarity < the same listener's clarity for the source |
| W4CR | degraded control | M3UC (tts ballad P2) | B | same |
| QATU | degraded control | HC7V (rt shimmer P3) | C | same |
| XRRA | hidden repeat | DNAQ (rt coral P1) | A | within 1 point of the source on each axis |
| XWRT | hidden repeat | Y9WR (tts coral P2) | B | same |

### 5.5 Cost of this pack (list prices; Azure may differ)

| item | quantity | price basis | ≈ USD |
|---|---|---|---|
| gpt-4o-mini-tts | 18.4 min of audio (40 clips) | ≈ $0.014/min (`voices-hindi.md` §4) [P] | 0.26 |
| gpt-realtime-2.1 | 6,485 audio + 2,260 text/reasoning output tokens, 4,432 input tokens | $64 / $16 / $4 per M (gpt-realtime list) [T; the 2.1 price is unverified] | 0.47 |
| gpt-4o-transcribe | 23.8 min (52 clips) | ≈ $0.006/min [T] | 0.14 |
| smoke tests | 3 clips | | < 0.05 |
| **total** | | | **≈ 0.9** |

---

## 6. The blind-test page (`samples/blind-test.html`)

- **Self-contained:** one HTML file with inline CSS and JS, no external fonts or scripts, light and dark themes
  (system preference plus a toggle), phone-first layout with a 16 px gutter.
- **Listener profile** (stored and exported): initials, role (child / parent / teacher / other), age band, home
  language, listening device, optional place. These are the strata the analysis needs (children vs parents, Hindi-
  vs non-Hindi-home).
- **Per clip:** code, play/pause, seek, elapsed time. **Four 1-5 sliders**: *sounds like a real Indian teacher*, *warmth*,
  *clarity for a child*, *Hindi pronunciation*. Each slider stays **unset (grey, "not rated") until moved**, so a
  default 3 is never recorded. A **"can't judge"** button per axis is exported as `"na"` and scored as missing,
  never as a 3. There is a free-text note per clip, because "not human and not Indian" came from a note, not a number.
- **Sliders unlock only after the clip starts playing.** Plays and the furthest fraction listened are recorded, so ratings
  of unheard clips are detectable.
- **One shared audio element**, so starting a clip stops the previous one.
- **Order:** blocks A → B → C, clips shuffled per listener from a stored seed. **Short sessions:**
  `blind-test.html?blocks=A` (or `?blocks=A,C`) shows only those blocks. Use this for children (block A ≈ 20 clips,
  ≈ 6 min of audio).
- **Storage:** `localStorage` keyed by a hash of the manifest, with every access in try/catch. If storage fails the
  page still works and warns once to export before closing.
- **Export:** a JSON download (`taxila-voice-ratings-<initials>-<time>.json`), Copy JSON as a fallback, and Start over.
  Schema `taxila-blind-test-ratings/v1`:
  `{page_version, manifest_hash, started_at, exported_at, order_seed, listener{…}, axes, blocks_shown, n_clips,
  n_rated, clips{CODE: {ratings{real_teacher, warmth, clarity, hindi}, note, plays, listened_frac, first_play_at,
  rated_at, position}}}`. It holds codes only, so an export cannot unblind anyone.
- **Verified [M]** in headless Chromium 1.63 at 360 and 375 px from `file://`: 57 cards; 57/57 mp3 decode; no
  horizontal scroll; sliders locked until play; play → rating → reload persisted; export JSON well-formed; a
  second listener got a different order over the same set; `?blocks=A` shows 20 clips including its degraded
  control; zero console errors. **Not yet verified:** iOS Safari and Android Chrome on real phones.

---

## 7. Scoring (`score-blind-test.mjs`)

Run `node score-blind-test.mjs samples/KEY.json ratings/*.json`. These rules were written **before any rating existed**:

- **Exclusion** (listeners are reported, never silently dropped):
  - on any degraded control, clarity ≥ the same listener's clarity for its source;
  - **or** both hidden repeats differ from their source by > 1 point on ≥ 2 axes;
  - **or** no degraded control rated at all (unvalidated).
  Gurukul's bar is < 90% catch accuracy = invalid (`hp-gurukul-chain.md` §5.1). Requiring every degraded control
  to pass is stricter than that, and the repeats are lenient, because a second hearing can honestly move a rating.
- **Aggregation:** per listener, mean per arm per axis. Then the arm mean, with a percentile bootstrap over
  **listeners** (2,000 resamples). There is also a pure-Hindi-only table (block C).
- **Contrasts**, each a paired per-listener difference with a bootstrap CI. A difference is called only if the
  95% interval excludes 0. Otherwise it is **"inconclusive", never "the same"**.
  - `rt:<v>` vs `tts:<v>` for marin/cedar/coral/shimmer. This asks "is the narration twin the same teacher?"
  - mixed vs Roman script per voice.
  - voice note on vs off.
- **Ship gate (inherited):** a voice wins only if the 95% lower bound of paired preference is > 50%. "Indistinguishable from human" needs ≥ 20 fluent listeners
  and ≥ 800 judgments (`gurukul.md` §3.5). This pack has no human anchor yet (§9), so it cannot support any "human-like" claim.
- Tested [M] on synthetic exports: exclusion paths, the tables and the contrasts all run. The scorer's `armOf()` knows
  only the `rt`/`tts` engines; extend it when Voice Live / Azure Speech arms join (`voices-hindi.md` §6.1).

---

## 8. Running the panel

- **Who:** children in classes 3-8 and their parents. Include Hindi-belt and non-Hindi-belt families, plus 2-3 primary
  teachers (they are the strictest judges of "real teacher"). Consent from guardians. Children never type their
  name: use initials.
- **Session length:** the full pack is ≈ 26 min of audio, about 40 min with rating. That is fine for adults, too long for
  children. Children do one block per sitting (`?blocks=A`, then B, then C on another day). Ages 6-9 should
  do pairwise picture choice instead of sliders (`voices-hindi.md` §6.3). This page is for 10+ and adults.
- **Device:** whatever the family uses (phone speaker is realistic for Taxila). The device is recorded, so the analysis can
  split headphones from speakers.
- **Instruction to the person running it:** don't say which voices are AI or which engine is which, don't say
  "pick the best one", and don't play clips aloud for a group (the first reaction anchors everyone).
- **Before the panel:** the owner and 2-3 fluent Hindi listeners do one full pass as a pilot. This catches unusable clips
  (for example, if the `sage` fade turns out to be an artefact) and checks timing. Pilot ratings are kept separate.

---

## 9. What this pack cannot tell you

1. **There is no human anchor.** A consented real Indian teacher reading P1-P3 is the missing reference arm and the
   ceiling for "exactly human-like". Add one by recording her, running the same `listenCopy` geometry, giving it a
   code, and adding it to KEY and the manifest. Until then, the most a result can say is "the best of these", never "human-like".
2. **It is OpenAI voices only, by task design.** As `voices-hindi.md` §6.1 says, this panel can choose the least-
   foreign OpenAI voice, and nothing beyond that. The Azure India-native arms (Voice Live `azure-realtime` meera/diya, MAI-
   Voice-2.1 Kavya, DragonHD en-IN Meera) are in the sibling `prescreen-2026-10-02/` pack. Run the two packs as
   rounds, or merge the pre-screen winners into this one on the same three passages.
3. **Reading is not teaching.** The realtime clips read a fixed script. In production the model writes its own words and
   prosody in reply to a child. Reading may sound better or worse than generated speech. Round 2 of the
   sibling protocol (same child turns, live replies) is the test for that.
4. **The ASR flags are proxies.** One ASR, one take per arm, and n = 1 per voice per passage. The तुल्य भिन्न split (5/10 vs
   0/4) is p = 0.13.
5. **Measured from the US build container.** Latency excludes India↔eastus2 RTT and says nothing about real phones.
6. **One take per arm.** Within-voice take-to-take variation is unmeasured. The sibling protocol's 3 fixed takes
   per prompt would measure it, at roughly 3× the size, so a larger cap or a smaller passage set would be needed.
7. **There is no child-voice or classroom-noise condition.** It is irrelevant for a TTS ear test, but matters for the live loop (echosim).

---

## 10. Decisions this enables, and what would reverse them

| decision candidate | evidence that would make it | reversal condition |
|---|---|---|
| Choose the live teacher voice from the panel, never from §5's columns | inherited law (`azure-tts`) | none: this is a floor |
| Narration (gpt-4o-mini-tts) uses the *same voice name* as the live lane | `rt:v` vs `tts:v` contrast inconclusive or favourable for that voice | the panel says the twins are different people (a paired difference on *real teacher* or a note pattern), in which case pick the narration voice separately and accept two timbres, or move narration to the live model |
| The cascade text script (Roman vs mixed) for Hindi words | mixed-vs-Roman contrast on *Hindi pronunciation* | the contrast flips in a later panel, or the brain cannot emit the script reliably |
| Keep the Indian-accent voice note in TTS `instructions` | note-on beats note-off on *real teacher* | inconclusive with n ≥ 20, then drop it as decoration |
| Normalise every listening pack with a linear-gain check | §0.3 [M] | none: this is instrument hygiene |

---

## 11. Proposed `context/` entries (for the main loop to log; this task writes only under `docs/research/voice/`)

- **measurement `listening-pack-2026-10-02`:** 52 clips (40 gpt-4o-mini-tts × 10 voices, 12 gpt-realtime-2.1 × 4),
  text-in, US container. Mini-tts: all 10 voices accepted, TTFB median 303 ms (265-805, n=40), RTF 0.14, raw
  loudness −32.0 … −18.1 LUFS. Realtime read-verbatim: 12/12 first-take similarity 1.00, TTFA median 909 ms
  (598-1874, n=12), 20.0 audio tokens per second of speech, 14-29 reasoning tokens per read. ASR heard
  *तुल्य भिन्न* exactly in 5/10 mini-tts vs 0/4 realtime (one-sided Fisher p = 0.13). Method:
  `docs/research/voice/gen-listening-samples.mjs`, KEY in `samples/KEY.json`.
- **rejection `loudnorm-linear-silently-dynamic`:** ffmpeg `loudnorm … linear=true` falls back to dynamic gain
  when target + peak-to-loudness ratio exceeds the TP ceiling (here at −20 LUFS / −2 dBTP; PLR up to 22.4 dB). It
  changes prosody per clip, without warning, inside a blind test. Fix: choose I ≤ TP − max PLR (−24 / −1 here) and
  read `normalization_type` from pass 2. Applies to any loudness-matched pack, including `prescreen-2026-10-02/`
  (pack at −20 ± 1 LUFS; its applied type is unchecked).
- **decision candidate `ear-pack-geometry`:** every ear-test pack ships one codec, linear loudness match, uniform
  edge pads, random codes, per-listener order, a degraded control per block and a hidden repeat. The key and originals
  never travel with the page. Reverse only if a leak is found that this misses.
- **open item:** a consented human-teacher anchor reading P1-P3. Without it, no "human-like" claim is possible.

---

## 12. Reproduce

```
cd docs/research/voice
# ws@8 must be resolvable: e.g. npm i ws@8 in a scratch dir and pass WS_FROM=<that dir>/
set -a; . /home/user/Taxila/.env.local; set +a
NODE_USE_ENV_PROXY=1 WS_FROM=<dir>/ node gen-listening-samples.mjs samples gen      # refuses if samples/KEY.json exists
NODE_USE_ENV_PROXY=1 node gen-listening-samples.mjs samples post                    # loudness, listening copies, ASR, catches, size cap
node gen-listening-samples.mjs samples catches                                      # one degraded control per block (idempotent) + page
node gen-listening-samples.mjs samples listen                                       # re-render copies, re-score recall (no API calls)
node gen-listening-samples.mjs samples page                                         # inject manifest, scan page for identity words
node score-blind-test.mjs samples/KEY.json <exports…>
```

Smoke-test a subset with `ARM_FILTER='<regex on engine|voice|passage|instructions>'` into a scratch directory. The
scratchpad is shared with sibling agents, so use a unique subdirectory.

---

## 13. Sources

External:
- OpenAI, *Text to speech* guide: 13 voices; "for best quality, we recommend `marin` or `cedar`"; `instructions`
  controls accent, emotional range, intonation, impressions, speed, tone, whispering; PCM is 24 kHz 16-bit.
  https://developers.openai.com/api/docs/guides/text-to-speech
- OpenAI, *Realtime conversations* guide: 10 voices, marin/cedar recommended; the voice cannot change once the
  session has emitted audio; `response.output_audio.delta` carries base64 audio, PCM 24 kHz.
  https://developers.openai.com/api/docs/guides/realtime-conversations
- Microsoft Learn, *Azure OpenAI Realtime API reference*: follows the OpenAI spec; the Azure deviation is deployment
  names in `input_audio_transcription.model` (updated 2026-06-05).
  https://learn.microsoft.com/en-us/azure/foundry/openai/realtime-audio-reference
- EBU R 128 v5.0 (Nov 2023): programme loudness −23 LUFS, with loudness range and max true peak as descriptors.
  https://tech.ebu.ch/publications/r128
- ITU-R BS.1534-3 (MUSHRA, 2015): the hidden-reference and low-anchor method that the degraded control mirrors (anchor
  design from the standard's text [T]; the summary page does not show it). https://www.itu.int/rec/R-REC-BS.1534
- ITU-T P.808 (06/2021): subjective evaluation of speech quality with a crowdsourcing approach (the rating-scale
  analogue for remote listeners). https://www.itu.int/rec/T-REC-P.808

Internal (read for this task):
- `docs/harvest/companion-tech.md` §2 (azure-tts lost by ear; voice-ears; hinglish-tts-l1), laws table §9
- `docs/harvest/gurukul.md` §3.5 (bake-off protocol, 0 listeners), §3.6 (script truth)
- `docs/harvest/hp-gurukul-chain.md` §5.1-5.2 (earbench: blind ids, catch trials, three verdicts, disclosure trap)
- `docs/research/voice/human-likeness.md` §8 lever 8 / E6 (voice by blind ear), §9 (mini-tts twin of marin unverified)
- `docs/research/voice/indian-teacher-discourse.md` §3.1, §4.1-4.4 (move shapes, Hindi-mode register, gender agreement)
- `docs/research/voice/voices-hindi.md` §3, §5, §6 (sibling catalogue, objective gates, shortlist, prescreen pack)
- `docs/research/voice/probe-voices-hindi.mjs` (session shapes; legacy transcription route)
- `context/measurements.md` (`realtime-teacher-bakeoff`, `realtime-audio-in`: brevity-last, language mirror)
