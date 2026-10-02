# Songs, chants and rhymes for verbatim content: evidence, music APIs (2026), and a v1 audio engine

**Date:** 2026-10-02 · **Question:** songs, chants and rhymes for verbatim content (tables, varnamala, poems,
sequences). What does the evidence say by age? Which music-generation APIs exist in 2026 (ElevenLabs Music,
Suno, Stable Audio, Azure, OpenAI), and what are their licences, latency and Hindi lyric quality? Is the simpler
path, a rhythmic TTS chant over a client-side Web Audio beat, good enough? **Output:** a v1 recommendation and
implementable engine specs.

**Read first (not repeated here):** `learning-science.md` §2.4 (seductive details d = -0.30 / -0.48; songs only for
verbatim content) and rule 24. `language-sst-engines.md` X2 `rhythm-poem@1`, the poem/varnamala *pedagogy* engine.
This document specifies the **audio layer** that `rhythm-poem@1` and the maths tables chant both run on. It adds
what was missing there: measured TTS behaviour, a beat-locking scheme, how the live teacher hands over to a track,
and the music-model landscape.

**Tags:** [V] verified at the source today · [S] secondary source · [M] measured by this doc's probes ·
[I] inference · [U] unverified or unknown.

**Artifacts in this folder**

| file | what it is |
|---|---|
| `songs-chant-probe.mjs` → `songs-chant-probe-2026-10-02.json` (+ 72 WAVs in `songs-chant-probe-2026-10-02/`) | 4 Azure arms × 6 verbatim lines × 3 reps = 72 clips: latency, duration, pitch statistics, ASR round-trip |
| `songs-chant-rescore.mjs` | re-runs the ASR with `language=hi/en` pinned and adds `asrHi` / `recallHi` to the JSON |
| `songs-chant-beatfit-probe.mjs` → `songs-chant-beatfit-2026-10-02.json` (+ 13 WAVs) | can Azure Speech hit a beat grid (`mstts:audioduration`, `<break>`)? |

---

## 0. Verdict

1. **v1 is a chant, not a song. No Azure option can sing.** No first-party Azure music model exists [V, Foundry
   catalogue]. `gpt-4o-mini-tts` told to "sing" showed no acoustic sign of singing in my clips: held-note share
   was 0.83 vs 0.80 for plain reading, and f0 spread was 8.9 vs 9.8 semitones (n = 18 per arm) [M]. ElevenLabs
   Music, Suno and Lyria are excluded by `azure-only-compute`. Suno has no public API anyway [S].
2. **The verbatim corpus is finite, so nothing needs generating live.** All of it fits one library of about 3,500
   short lines: पहाड़े 2-20, varnamala and barahkhadi, months, days, planets, number names 1-100, and the
   public-domain poems. That costs **under $2** to render with Azure Neural TTS [I from V price]. It is rendered
   once, checked by ASR and **by a human ear**, and cached. Personalisation goes into *tempo, segmentation, gaps
   and mode*, never into the words. The words are the curriculum.
3. **The chant voice is pre-rendered per line, and the client schedules it on a Web Audio beat.** The live
   realtime teacher cannot hold a beat, because she is a speech-to-speech model with server VAD. She frames the
   chant, hands over to the track, listens, and reacts afterwards. During the track, mic audio goes to a local
   slot detector, not to realtime.
4. **Use Azure Speech hi-IN Neural (Swara) for Hindi lines, not gpt-4o-mini-tts.** Swara is deterministic:
   identical duration on every rep, so one render is the render. It is fast (first byte 160 ms, total 297 ms
   median) and its table lines are short and even (1.03-1.20 s, so 2 beats at ≤ 90 BPM) [M].
   `gpt-4o-mini-tts` varies from run to run (a varnamala line ran 1.97-2.90 s) and needs 3 beats per table
   line [M]. Both read the table lines phonetically right about 11-12 times in 12 (hand-coded from ASR) [M].
5. **Varnamala needs one clip per letter.** Swara merged "क ख ग घ ङ" into one word in 3/3 runs ("कखगघव") [M].
   With commas or `<break>` the letters separate, but **ङ came back as "म" in 3/3 runs** [M]. The nasals (ङ ञ ण)
   and conjuncts (क्ष त्र ज्ञ) need human-reviewed clips, or a one-time human recording. That is 52 letters plus
   barahkhadi.
6. **Beat-fitting happens on the client, not in SSML.** `mstts:audioduration` sets the length of the *file*, which
   includes about 1.0 s of trailing silence Azure appends. A 1.25 s target compressed the speech roughly 2×, to
   0.58 s, which is unusable. A 2.5 s target just padded silence [M]. Store each clip's measured `onsetMs` and
   p-centre, and schedule the p-centre on the beat. Tempo variants come from SSML `prosody rate` at render time
   (-15% / 0 / +15%), not from `playbackRate`, which shifts pitch.
7. **A chant is for acquisition only.** A recited sequence is retrieved serially: the child has to run "दो एकम
   दो… दो सत्ते चौदह" to reach 2×7 [I]. Every `pahada` chant pass must therefore hand over to shuffled retrieval
   (the maths fact-fluency engine) within the same session. Chants are never sold as understanding
   (learning-science §2.4).
8. **ASR cannot gate this content as-is.** `gpt-4o-transcribe` returned Urdu, Bengali, Gurmukhi, Latin or Hangul
   script for **7-9 of 15 Hindi gpt-4o-mini-tts clips per arm (Swara: 1 of 15), even with `language=hi`** [M], even where the audio
   was right. Any verbatim check, whether on our clips or on the child's echo, must use a **script-agnostic
   phonetic key** (§7.6), not Devanagari string match.
9. **Songs are v2, offline only, with review.** The path is either an open-weight song model on an Azure GPU
   (ACE-Step 1.5, MIT; YuE, Apache-2.0; both allowed as "open-source on Azure compute"), with Hindi lyric accuracy
   [U] and needing a probe, or original compositions recorded by people. Never live, never per-child.

---

## 1. What the evidence says, by age

### 1.1 The core findings

| finding | source | tag | what Taxila does with it |
|---|---|---|---|
| Melody helps text recall **only when the melody is simple, repeats across verses and is learned well**. With a new melody for every verse, spoken text was recalled better | Wallace 1994, *JEP:LMC* 20:1471-1485 | [S] | One tune or groove per kit, repeated every pass. Never a new melody per stanza |
| The song advantage in adults largely disappears when spoken text is given at the **same slow rate** as the song | Kilgour, Jakobson & Cuddy 2000, *Memory & Cognition* 28:700-710 | [S] | Much of the "song effect" is slowing down and chunking. A paced chant captures most of it at a fraction of the cost [I] |
| Singing while learning gave no recall gain over speaking for adults learning new lyrics | Racette & Peretz 2007, *Memory & Cognition* 35:242-253 | [S] | No reason to make children *sing*. Speaking the line on the beat is enough |
| Adults learning Hungarian phrases recalled them better after learning by singing than by speaking | Ludke, Ferreira & Overy 2014, *Mem Cogn* 42:41-52 | [V title] | Supports chant and song for **verbatim foreign-language strings**, e.g. English sequences for Hindi-medium children |
| Children (Ecuador, ages ≈ 8-10) learning an English passage as a song beat the spoken-poem group on verbatim recall, pronunciation and translation, and the gain held after 6 months | Good, Russo & Sullivan 2015, *Psychology of Music* 43:627-640 | [S] | The strongest child evidence. It used two weeks of repeated exposure, with the song as the passage itself |
| Young adults who watched a televised Preamble song often as children recalled the text verbatim better. Repetition was the active ingredient | Calvert & Tart 1993, *J Appl Dev Psych* 14:245-260 | [V pdf title; S finding] | Repetition across days (spaced re-runs by the Conductor) matters more than production value |
| 4-year-olds learned novel words better from speech than from song | J Child Lang, "Spoken or sung" (cited in learning-science §2.4) | [S] | Under about 6, the chant carries **known words in order** (varnamala, counting), not new vocabulary |
| Nursery-rhyme knowledge at age 3 predicts later phonological awareness and reading. Rhyme training improved rhyme awareness | Bryant, Bradley, Maclean & Crossland 1989, *J Child Lang* 16:407-428; ERIC EJ1097164 (2011) | [S] | Classes 1-2: rhyme and beat serve **phonological awareness** (`rhythm-poem@1` rhyme-spot mode) |
| Music training → phonological awareness d = 0.2, no reading-fluency effect | Gordon, Fehd & McCandliss 2015 (via language-sst-engines) | [V there] | Never claim songs improve reading or comprehension |
| Decorative songs harm retention (-0.30) and transfer (-0.48) | Rey 2012 (learning-science §2.4) | [S] | The lyric must *be* the content. No jingles about concepts |
| Mechanism: rhythm and melody give a temporal scaffold (chunking, stress, line length) that cues serial order | Wallace 1994; PMC4056382 (music mnemonics review) | [S] | This is *serial* cueing. Random access (2×7 on its own) must be trained separately (§0.7) |

### 1.2 By age band (Taxila bands)

| band | classes | what the chant is for | register | evidence strength |
|---|---|---|---|---|
| B0 (5-6 y) | 1 | Counting 1-20, varnamala स्वर, rhymes for phonological awareness, action rhymes | Slow (72-88 BPM), call-and-response, claps and gestures, very short lines | Moderate for phonological awareness [S]. Weak or mixed for new words through song [S] |
| B1 (6-8 y) | 2-3 | पहाड़े 2-10, व्यंजन by varga, barahkhadi, months and days, NCERT poems | 84-100 BPM, echo then together then fill-gap | Moderate for verbatim sequences (Good 2015; Calvert 1993) [S] |
| B2 (8-11 y) | 4-6 | पहाड़े 11-20, planets, states and capitals in order, doha meter, English poem recitation | 92-112 BPM, child leads, speed ladder | Moderate (verbatim) [S]. Risk: chained recall (§0.7) [I] |
| B3 (11-15 y) | 7-9 | Formula wording, periodic-table rows, SI prefixes, Hindi poems and dohas, English poetry | Beat or rap-style groove, no nursery register, opt-in only | Weak in adolescents. "Babyish" rejection risk [I]. Offered as a tool, never imposed |

**Bottom line [I]:** the evidence is real but narrow and modest. It covers verbatim and serial recall,
needs repetition over days, and comes mostly from slower pacing and chunking. A **paced, beat-locked chant with
repetition and fading cues** gets the documented benefit. A full song mostly adds cost, licensing risk and
seductive-detail risk.

---

## 2. The verbatim corpus (what actually needs audio)

From `data/curriculum/*.json` and the sibling engine maps (counts approximate) [I]:

| kit family | content | lines | rights |
|---|---|---|---|
| `pahada-hi` | 2-20 × 1-10, traditional wording (दो एकम दो, दो दूनी चार, दो तिया छह, दो चौके आठ, दो पंजे दस, दो छक्के बारह, दो सत्ते चौदह, दो अट्ठे सोलह, दो नवां अठारह, दो दहाम बीस) | 190 | traditional, public domain |
| `tables-en` | "two ones are two" / "2 × 1 = 2" | 190 | trivial, no rights |
| `varnamala` | 13 स्वर + 33 व्यंजन + 4 संयुक्त (क्ष त्र ज्ञ श्र) + अं अः | ~52 single-letter clips | none |
| `barahkhadi` | 33 consonants × 12 matras | ~400 syllable clips | none |
| `ginti-hi` | 1-100 Hindi number names (irregular: उन्नीस, उनतीस, उनचास…) | 100 | none |
| sequences | months (en/hi), days, planets, seasons (ऋतुएँ), colours of the rainbow, SI prefixes, states in order | ~120 | none |
| poems | 46 English + 22 Hindi primary poems and pads (language-sst-engines X2), dohas (Kabir, Rahim) | ~1,500 lines | **mixed**: traditional / PD / NCERT-held (§9) |
| alphabet-en | A-Z phonics and letter names | 52 | none |

Total: about 3,500 lines, about 60k characters. At Azure Neural $15/M chars [V, voices-hindi §3.3], **one render
of everything costs about $0.90**. Three tempo variants cost about $2.70 [I]. Generation cost does not matter.
The binding costs are **human review** and the varnamala edge cases.

---

## 3. The music-generation landscape, 2026-10-02

| option | sings lyrics? | Hindi | licence for our use | latency | allowed under `azure-only-compute`? | verdict |
|---|---|---|---|---|---|---|
| **ElevenLabs Eleven Music (v2, 2026-05-27)** | yes, vocals and lyrics, 3 s-10 min | Hindi not listed in the docs I found [U]. Listed: en, es, de, ja… [S] | trained on licensed data (Merlin, Kobalt, Believe). Commercial use on paid plans. Games, film and ads need extra licensing or Enterprise [S] | ~21-42 s per 90 s track, end to end [S] | **no** (third-party AI API) | reference only |
| **Suno** | yes | yes (consumer app) [S] | WMG settlement (Nov 2025): licensed models due in 2026, current models retired [S] | n/a | **no**, and there is **no public API**: a curated partner programme exploring one since July 2026, no endpoints or docs [S]. Unofficial wrappers break ToS [S] | excluded |
| **Google Lyria 3 / 3 Pro (Vertex, preview); Lyria 3.5 (Gemini API, Sep 2026)** | yes, vocals with timed lyrics | **yes**, Hindi is one of 8 vocal languages [S, Google Cloud blog] | Google terms; SynthID watermark [U] | not measured | **no** (Google) | the best Hindi-singing option on the market, and excluded. Escalate to the owner only if songs become a must-have |
| **Stable Audio 2.5 / 3.0** | **no**, instrumental only [S] | n/a | Community Licence: own the output. >$1M revenue needs Enterprise [S] | seconds [S] | API **no**. Open weights (Stable Audio Open) on Azure GPU = yes | backing tracks only. Our client beat makes it unnecessary |
| **Azure OpenAI / Foundry first-party** | no music model in the catalogue [V]. Audio models are speech: gpt-4o-mini-tts, gpt-audio-1.5, gpt-realtime-2.1 [V] | speech yes | first-party | TTS 270-630 ms [M] | yes | **speech only**. `gpt-4o-mini-tts` "sing" instruction: no measurable singing [M] |
| **Azure AI Speech (Neural / DragonHD / MAI-Voice)** | no singing voices [V roster] | hi-IN Swara, Madhur, Kavya… [V] | first-party | 160 ms first byte, 297 ms total per line [M] | yes | **v1 chant voice** |
| **sora-2 on Azure (preview)** | generates audio with video. Singing [U] | [U] | first-party preview, but OpenAI removed it from its own API on 2026-09-24 [V, animation-video §0] | 51-57 s per 4 s clip [M there] | yes, but on borrowed time | no, for this use |
| **gpt-realtime-2.1 (the teacher)** | the API generation was described by developers as unable to sing [S]. Not probed | — | — | live | yes | the teacher **speaks** rhymes. A beat-locked chant is not hers to hold (§5) |
| **ACE-Step 1.5 (Jan 2026), open weights** | yes, lyrics plus accompaniment, 10 s-10 min | "50+ languages". Hindi not explicitly listed [S, GitHub] | **MIT** [S] | <2 s per song on A100, <10 s on 3090, <4 GB VRAM for the 2B turbo [S] | **yes** (open source on Azure GPU) | **v2 candidate**. Needs a Hindi lyric-WER probe |
| **YuE (M-A-P), open weights** | yes, lyrics2song with vocals | en, zh, yue, ja, ko listed. Hindi [U] | **Apache-2.0** since 2025-01-30 [S] | minutes on a large GPU [U] | yes | v2 fallback candidate |

**Reading.** On 2026-10-02 the only services that sing Hindi well (Lyria, Suno) are excluded, and the excluded
ElevenLabs does not document Hindi. The allowed singing route is open weights on an Azure GPU. Lyric
intelligibility in Hindi there is unknown, and for a *verbatim* product, a sung "दो सत्ते चौदह" that sounds like
"दो सत्ते चौदा" is a wrong answer delivered beautifully. That is why songs are v2, offline, and gated by the
same phonetic check plus a human ear (§8).

---

## 4. Measured: can Azure-native TTS carry a beat-locked chant?

### 4.1 Method (`songs-chant-probe.mjs`, 2026-10-02, eastus2)

- **Lines:** पहाड़ा of 2 lines 1-4 (दो एकम दो / दो दूनी चार / दो तिया छह / दो चौके आठ), varnamala "क ख ग घ ङ",
  and "Mercury, Venus, Earth, Mars".
- **Arms:** `tts-chant` (gpt-4o-mini-tts `marin`, instruction = a rhythmic class-chant *shape*), `tts-sing`
  (instruction = sing a nursery tune), `tts-plain` (no instruction), `az-swara` (hi-IN-SwaraNeural, prosody
  -10%). 3 reps each. **n = 18 clips per arm, 72 total.**
- **Measures:** first-byte and total latency from this container (US, not India). Speech span after trimming
  below 5% of peak RMS. Autocorrelation f0 (80-500 Hz): 10-90% spread in semitones, and "held-note share" (the
  fraction of consecutive voiced frames moving < 0.5 st). ASR through `taxila-transcribe`, unpinned and then
  pinned with `language=hi|en` (`songs-chant-rescore.mjs`). **Phonetic correctness hand-coded by me from the ASR
  text, script-agnostic.**
- **Not done:** listening. I have no ears in this loop. Every "correct" below is "ASR heard the right phonemes",
  which is necessary, not sufficient. The human gate in §8 exists for that reason.

### 4.2 Results

| arm | first byte (med) | total (med) | table-line duration range (s) | duration spread across reps of the same line | held-note share (med) | f0 spread (st, med) | table lines phonetically right (hand-coded) | varnamala, all 5 letters separate and right |
|---|---|---|---|---|---|---|---|---|
| tts-chant | 277 ms | 628 ms | 1.39-1.97 | up to 0.27 s | 0.83 | 8.65 | 11/12 ("चौके" → "chaanken" once) | 0/3 (2/3 got 4 of 5. ङ dropped) |
| tts-sing | 287 ms | 633 ms | 1.31-1.94 | up to 0.60 s | 0.83 | 8.92 | 12/12 | 0/3 (one "का खा गा घा") |
| tts-plain | 272 ms | 595 ms | 1.00-1.84 | up to 0.44 s | 0.80 | 9.81 | 11/11 (one ASR 502) | 2/3 |
| **az-swara** | **160 ms** | **297 ms** | **1.03-1.20** | **0.00 s (deterministic)** | 0.72 | 10.87 | **12/12** | **0/3, letters merged "कखगघव"** |

ASR output script for the 15 Hindi clips per arm, with `language=hi` pinned [M]:

| arm | Devanagari | Urdu (Arabic script) | Bengali | Gurmukhi | Latin | Hangul |
|---|---|---|---|---|---|---|
| tts-chant | 7 | 6 | 1 | 0 | 1 | 0 |
| tts-sing | 6 | 7 | 0 | 0 | 1 | 1 |
| tts-plain | 7 | 4 | 1 | 1 | 1 | 0 (+1 error) |
| az-swara | 14 | 1 | 0 | 0 | 0 | 0 |

**Reading.**
- **Determinism decides it.** Swara gives the same clip every time, so a reviewed clip stays reviewed and the
  beat map is computed once. gpt-4o-mini-tts would need its own review per render, and its lines are longer and
  uneven (3 beats per table line at 96 BPM, against Swara's 2) [M/I].
- **"Sing" does nothing measurable.** Held-note share and f0 spread do not separate `tts-sing` from
  `tts-plain`. f0 spread does not separate singing from expressive speech at all (Swara, a speaking voice, has
  the widest spread). So this is "no evidence of singing", not proof of its absence. A 10-second listen settles
  it, but it does not change the recommendation, because a sometimes-singing model is unusable for verbatim
  content either way [I].
- **The ASR script problem is the eval finding.** Hindi and Urdu are one spoken language. A short chant line
  gives the recogniser no lexical context to choose a script. Devanagari key-matching scored mini-tts at 0.43
  recall when the phonetics were about 95% right. Every verbatim gate (§7.6) must normalise script first.

### 4.3 Beat-fitting probe (`songs-chant-beatfit-probe.mjs`, Swara, n = 1 per case; Swara is deterministic)

| case | target | file length | speech span (ffmpeg silencedetect, -40 dB) | ASR (`language=hi`) |
|---|---|---|---|---|
| plain "दो एकम दो" (from 4.1) | — | 2.39 s | 0.22 → 1.35 s (1.12 s); **1.04 s trailing silence** | दो एकम दो |
| `audioduration=1250ms` | 1.25 s | **1.82 s** | 0.12 → 0.70 s (**0.58 s, ≈ 1.9× compressed**) | দো একম দো (right phonemes) |
| `audioduration=2500ms` | 2.5 s | 2.47 s | 0.24 → 1.40 s (unchanged, padded) | दो एकम दो |
| "दो तिया छह" at 1.25 s | 1.25 s | 1.82 s | — | "दोत्या छे" (**merged at 2×**) |
| "क<break 400ms/>ख…ङ" | — | 5.39 s | 4.25 s | क ख ग घ **म** |
| "क, ख, ग, घ, ङ" | — | 3.96 s | 2.86 s | क ख ग घ **म** |
| `audioduration=3125ms` + commas | 3.125 s | 3.10 s | 2.25 s | का ख ग घ **म** |

**Reading [M].** `audioduration` budgets the whole file, trailing silence included, so a tight beat slot forces
roughly 2× speech that merges words. Do not use it. Trim on the client and align by onset. Natural Swara table
lines take 1.0-1.3 s of speech. With 120 ms of air, that fits 2 beats at ≤ 90 BPM (0.667 s/beat). For about
105 BPM, render a +15% `prosody rate` variant. **ङ is misheard as म in every Swara condition.** It needs a reviewed human clip, an
SSML `<phoneme>` attempt (untested), or a spoken carrier ("ङ, जैसे गङ्गा") [U].

---

## 5. Why the live teacher does not chant on the beat herself

- The teacher is `gpt-realtime-2.1` with server VAD and per-turn `response.create` (decisions `voice-realtime-model`,
  `voice-turn-config`). Her output timing is set by generation, network jitter (India ↔ eastus2: 2-3 round
  trips) and VAD, none of which is beat-aware [I].
- A beat with a voice drifting 100-300 ms off it is worse than no beat. Children entrain to the beat and the
  voice pulls them off it [I].
- A beat on the loudspeaker plus open mic plus server VAD means the beat leaks into the mic and VAD fires, so she
  interrupts herself. This is the echo failure in `low-end-offline` §"Echo on loudspeakers".

**So the handover is explicit:** the teacher frames the chant, the track plays, the teacher is silent and **not
listening through realtime**, then the teacher reacts to a structured summary. She *can* still do a free-time
call-and-response with no beat ("मैं बोलूँ 'दो एकम', तुम बोलो 'दो'") as an ordinary turn exchange. That is
`mode: "teacher-led"` and needs no track.

**Same-voice law** (low-end-offline §"Same-voice law": a child never hears a stranger speaking *as her*). The chant
voice is **not presented as the teacher**. It is the "chant track", a distinct named chorus voice, which the
teacher introduces like a classroom recording ("चलो, ताल वाली रिकॉर्डिंग के साथ बोलते हैं!"). Reverse if the
L2-C blind ABX (M-LE-10) shows gpt-4o-mini-tts `marin` is heard as the same person as the realtime teacher
*and* a reviewed render of the full corpus passes §8. Then the chant could be hers.

---

## 6. v1 recommendation

**Build `chant-track@1`.** It is an audio runtime: Web Audio synthesised groove plus pre-rendered, human-reviewed
per-line Azure Speech clips, scheduled on the audio clock, with echo, together, fading-gap and speed-ladder
modes. A per-slot child-voice detector streams back to the Director. Two pedagogy engines consume it:
`rhythm-poem@1` (exists, language-sst X2) and the new `pahada@1` (§7.3). Total client weight is about 6 kB of
code, with no audio samples (the groove is synthesised). Clips are about 10-25 KB each as 20 kbps Opus.

Rejected for v1, with reasons:

| alternative | why not v1 |
|---|---|
| generated songs per child | excluded vendors; no Azure singing model; Hindi lyric accuracy [U]; 20-60 s latency; seductive-detail risk; adds nothing personal, because the words are fixed |
| live TTS render per lesson | works (300 ms) but needs no doing: the corpus is finite and a fresh render is an unreviewed render |
| gpt-4o-mini-tts as the chant voice | non-deterministic, so every render needs fresh review; longer lines; ASR script chaos makes automatic checking harder [M] |
| teacher (realtime) chants on the beat | cannot be beat-locked; echo and VAD conflicts (§5) |
| Stable Audio or ACE-Step instrumental beds | a synthesised dhol, tabla-ish or clap groove is about 1 kB of code, 0 bytes of assets, exactly on tempo at any BPM, and has no licence question |

**v2 (after v1 is measured in use):** an `ace-step-probe` on an Azure GPU (NC-series spot). Render 20 पहाड़ा and
poem lines as songs with a fixed tune template, then run the §8 gate. If at least 95% pass the phonetic check and
the human ear, songs enter the library as an *alternative mode* of the same kit, never live. Original
compositions by people are the other path (licence: work-for-hire).

---

## 7. Engine specs

### 7.1 Shared types (`shared/contracts.ts` additions)

```ts
export type Bpm = number;                                   // 60..120, clamp in the engine
export type GroovePreset = "clap-4" | "keherwa-8" | "dadra-6" | "dhol-4" | "tick-4" | "none";
export type ChantMode =
  | "listen"        // track voice on every line, child listens (first exposure only)
  | "echo"          // track line, then a silent child slot of equal beats (call-and-response)
  | "together"      // track and child on the same slot; track voice ducked to 60%
  | "fade"          // together, but each pass hides more tokens (vanishing cues); hidden = beat only
  | "child-leads"   // track voice only on the first line; child slots for the rest; beat continues
  | "speed-ladder"  // together/child-leads repeated at rising tempo variants (slow → base → fast)
  | "teacher-led";  // no track: the realtime teacher runs free-time call-and-response (no beat)

export interface ClipRef {
  id: string;                    // "pahada-hi/2/7@base"
  url: string;                   // Azure Blob, Opus 20 kbps, 24 kHz mono (low-end-offline data-saver law)
  durMs: number;                 // full file
  onsetMs: number;               // first 10 ms frame above 5% peak RMS (measured at render)
  pCentreMs: number;             // first RMS peak ≥ 50% after onset: the perceptual beat point
  speechMs: number;              // onset → last frame above 5% peak
  tempoVariant: "slow" | "base" | "fast";   // SSML prosody rate -15% | 0 | +15%
  voice: string;                 // "hi-IN-SwaraNeural" — must equal the kit's chorusVoice
  review: { asrPhonKey: string; phonMatch: boolean; humanOk: boolean; reviewer: string; at: string };
}

export interface ChantLine {
  idx: number;
  text: string;                  // canonical verbatim text (Devanagari / Latin), the curriculum
  tokens: string[];              // display + fade units (words; for varnamala: letters)
  phonKeys: string[];            // per-token script-agnostic phonetic key (§7.6)
  clips: Partial<Record<"slow" | "base" | "fast", ClipRef>>;
  beats?: number;                // slot length; default = computed (§7.4)
  gesture?: string;              // action rhyme hint, e.g. "clap", "touch-nose"
}

export interface ChantKit {               // a library item; JSON-schema in §7.5
  kitId: string;                          // "pahada-hi-2", "varnamala-vyanjan-ka-varga", "poem-c1-hindi-ch03"
  family: "pahada" | "tables-en" | "varnamala" | "barahkhadi" | "ginti" | "sequence" | "poem" | "alphabet";
  lang: "hi" | "en" | "hinglish";
  objectiveIds: string[];                 // curriculum objective ids
  rights: "traditional" | "pd" | "original" | "licensed" | "ncert-pending";   // §9; "ncert-pending" never ships
  chorusVoice: string;
  groove: GroovePreset;
  baseBpm: Bpm;
  meter: 4 | 6 | 8;
  lines: ChantLine[];
  version: number;
}
```

### 7.2 `chant-track@1` (audio runtime, P0)

**Covers:** every beat-locked verbatim chant in classes 1-9. It hosts `rhythm-poem@1` modes listen, echo-line,
clap, fill-gap and perform, plus `pahada@1`.

```ts
export interface ChantTrackParams {
  kit: ChantKit;
  mode: ChantMode;
  bpm?: Bpm;                       // default kit.baseBpm; band defaults B0 80, B1 92, B2 100, B3 104
  lines?: [number, number];        // segment (inclusive), e.g. [5, 8] for 2×5..2×8 only
  passes?: number;                 // 1..6, default 3
  countInBars?: 0 | 1 | 2;         // default 1, with spoken "1, 2, 3, 4" clips (rendered in the kit voice)
  echoGapBeats?: number;           // child slot length in echo; default = line slot
  fade?: { schedule: "vanishing" | "backward-chain"; maxFrac: number /* 0..1 */; keepFirstToken: boolean };
  ladder?: Array<"slow" | "base" | "fast">;   // speed-ladder order, default ["slow","base","fast"]
  duckChildSlots?: number;         // beat gain during child slots, 0..1, default 0.35 (less leak into mic)
  highlight: "line" | "word" | "akshara";     // karaoke; akshara for R0/R1 Hindi (language-sst X2)
  mic: "detect" | "detect+asr" | "off";       // §7.6; "off" when no mic permission
  reducedMotion?: boolean;
  seed: number;                    // R10 deterministic (maths-engines)
}

export interface ChantTrackAPI {
  load(p: ChantTrackParams): Promise<void>;   // prefetches clips (from the lesson plan) and decodes them to AudioBuffers
  start(atCtxTime?: number): void;
  pause(): void; resume(): void;
  stop(reason: "done" | "teacher" | "child" | "error"): void;
  setBpm(b: Bpm): void;                       // applied at the next bar line
  getState(): unknown; setState(s: unknown): void;
  on(ev: ChantEvent["type"], fn: (e: ChantEvent) => void): void;
}
```

**Groove synthesis (no assets).** All voices are scheduled with `AudioContext.currentTime` through a lookahead
scheduler: a 25 ms timer schedules every event due within the next 120 ms ("A Tale of Two Clocks", web.dev) [V].

| voice | recipe |
|---|---|
| `kick` / dhol "dha" | sine osc 150 → 50 Hz exp ramp over 120 ms, gain 1 → 0.001 over 180 ms |
| `clap` | white-noise buffer → bandpass 1.2 kHz Q 0.8, three 10 ms bursts 8 ms apart, decay 120 ms |
| tabla-ish "na" / "tin" | sine 380 Hz (na) / 520 Hz (tin) + noise bandpass 3 kHz 15 ms; pitch bend -30 cents over 80 ms |
| `tick` | square 2 kHz, 5 ms, gain 0.2 |
| accent | first beat of the bar ×1.4 gain |

| preset | meter | pattern (one bar) |
|---|---|---|
| `clap-4` | 4 | clap · tick · clap · tick |
| `keherwa-8` | 8 | dha ge na ti · na ka dhi na (tabla-ish mapping) |
| `dadra-6` | 6 | dha dhi na · dha tu na |
| `dhol-4` | 4 | dha · na · dha dha · na |
| `tick-4` | 4 | tick ×4 (B3 / minimal) |

The master bus passes through a `DynamicsCompressorNode` (threshold -18 dB) so the beat never masks the voice.
The beat sits 9 dB under voice clips.

**Line scheduling.** For slot start `t` (a beat time), play the clip at `t - pCentreMs/1000 + onsetMs/1000`,
offset into the buffer by `onsetMs` (the leading silence is skipped). The clip's p-centre lands on the beat.
Trailing silence is cut by a 30 ms gain fade at `onset + speechMs + 60 ms`.

**Teacher handover (live-lesson runtime).**
1. The Director issues a `chant.start` move. The teacher's realtime turn frames it, as a shape and not a line:
   "invite, name the kit, say it's with the beat".
2. On that turn's `response.done`, the client **stops forwarding mic audio to realtime**: it sends
   `input_audio_buffer.clear` and holds the uplink. It also sets `turn_detection.create_response=false` via
   `session.update` so nothing fires on leakage.
3. The track runs. The mic goes to the local slot detector (§7.6) through `getUserMedia({echoCancellation:true,
   noiseSuppression:false, autoGainControl:false})`. Noise suppression is off because it eats chanting [I].
   Whether Chrome/WebView AEC removes Web Audio output from the mic on Android is [U] (§11, M-SONG-3), and is
   the reason for `duckChildSlots`.
4. On stop, the client restores the realtime config, then injects a `conversation.item.create` (system/user text)
   holding the `ChantSummary` (§7.4) and asks for the teacher's reaction turn.
5. **Barge-out:** a child tap on "रुको" or a sustained loud non-chant voice over 2 s outside child slots stops
   the track (`stop("child")`) and returns the floor to the teacher with the reason.

### 7.3 `pahada@1` (maths tables, P0; consumes chant-track)

```ts
export interface PahadaParams {
  n: number;                            // 2..20
  range: [number, number];              // multipliers, default [1, 10]
  lang: "hi" | "en";                    // hi = traditional wording; en = "two ones are two" / "2 times 1 is 2"
  arc: Array<{ mode: ChantMode; passes: number; tempo: "slow" | "base" | "fast" }>;
  // default arc (B1): echo×1 slow → together×1 base → fade×2 base (vanishing, product token hidden first)
  thenRetrieval: { engine: "fact-fluency"; items: number /* ≥ 6 */; shuffle: true };   // §0.7: mandatory
  showArray?: boolean;                  // pairs each line with the multiply-divide array view (dual coding, learning-science F-rules)
}
```

- **The fade order is pedagogical:** hide the product first (दो सत्ते \_\_\_), then the multiplier word
  (दो \_\_\_ चौदह). Backward chaining from the last line suits B0-B1 [I].
- **Hindi multiplier words** are a fixed lexicon per kit: एकम, दूनी, तिया, चौके, पंजे, छक्के, सत्ते, अट्ठे, नवां,
  दहाम. 11-20 use regional forms such as ग्यारह एकम ग्यारह. Regional variants (e.g. "दो तिया छह" vs "दो तीए
  छह") are listed as accepted `phonKeys` alternatives, never corrected [I].
- **Events add** `pahada.handoff {n, retrievalItems}`. The fact-fluency engine owns the correctness keys (verified
  keys, never model-graded: inherited law).

### 7.4 Slot timing and the summary

```ts
// beats for a line slot: smallest even count whose duration covers speech + 120 ms of air
function slotBeats(speechMs: number, bpm: Bpm, meter: number): number {
  const beatMs = 60000 / bpm;
  let b = Math.ceil((speechMs + 120) / beatMs);
  if (b % 2) b += 1;                   // even slots keep lines on bar halves
  return Math.min(b, meter * 2);
}
// Swara table lines (1.03-1.20 s speech, §4.2): at 96 BPM, 1.20 + 0.12 = 1.32 s > 2 beats (1.25 s) → 4 beats,
// which halves the chant's pace. So fit BPM per kit instead: base BPM = floor(60000 * 2 / (maxSpeechMs + 120))
// → ~90 BPM for pahada-hi base; fast variant (+15% rate, ~1.02 s) → ~105 BPM.
// The kit stores the BPM its clips fit; the engine never time-stretches.
```

The worked numbers above are the reason `baseBpm` is a **kit** property computed at render time, not a band
constant. The band sets the *variant* (slow, base or fast), and the kit says what BPM that variant fits.

```ts
export type ChantEvent =
  | { type: "chant.start"; kitId: string; mode: ChantMode; bpm: Bpm; lines: [number, number]; t: number }
  | { type: "chant.slot"; line: number; pass: number; kind: "track" | "child" | "together";
      voicedFrac: number;        // fraction of 20 ms frames in slot above the adaptive noise floor + 9 dB
      onsetOffsetMs: number | null;   // child onset minus slot beat (entrainment; logged, never a misconception)
      phonMatch?: number;        // 0..1 token match from batched ASR (mic:"detect+asr"), §7.6
      hiddenTokens: number }
  | { type: "chant.tap"; beat: number; offsetMs: number }          // child taps or claps on screen (salience 0, aggregated)
  | { type: "chant.pass"; pass: number; slotsChild: number; slotsVoiced: number; slotsMatched?: number; fadeFrac: number }
  | { type: "chant.tempo"; from: Bpm; to: Bpm }
  | { type: "chant.stop"; reason: "done" | "teacher" | "child" | "error"; elapsedMs: number };

export interface ChantSummary {          // what the Director and teacher see; text-rendered as notes, never lines to recite
  kitId: string; passes: number;
  childSlots: number; voiced: number; matched?: number;
  weakLines: number[];                   // lines voiced < 0.3 or phonMatch < 0.6 on ≥ 2 passes
  tempoReached: "slow" | "base" | "fast";
  stoppedBy: "done" | "teacher" | "child" | "error";
}
```

**Learner-model use.** `voicedFrac` per line says whether the child *participated*. `phonMatch` (batched
after each pass, never on the critical path) says *what* they said. Weak lines feed the fact-fluency item picker
and the Conductor's spaced re-run (Calvert 1993: repetition across days) [S]. Entrainment (`onsetOffsetMs`,
`chant.tap`) is logged only. Rhythm skill is not the objective.

### 7.5 JSON Schema: `ChantKit` (library item)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "taxila/chant-kit.v1.json",
  "type": "object",
  "required": ["kitId", "family", "lang", "objectiveIds", "rights", "chorusVoice", "groove", "baseBpm", "meter", "lines", "version"],
  "additionalProperties": false,
  "properties": {
    "kitId": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "family": { "enum": ["pahada", "tables-en", "varnamala", "barahkhadi", "ginti", "sequence", "poem", "alphabet"] },
    "lang": { "enum": ["hi", "en", "hinglish"] },
    "objectiveIds": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
    "rights": { "enum": ["traditional", "pd", "original", "licensed", "ncert-pending"] },
    "chorusVoice": { "type": "string" },
    "groove": { "enum": ["clap-4", "keherwa-8", "dadra-6", "dhol-4", "tick-4", "none"] },
    "baseBpm": { "type": "number", "minimum": 60, "maximum": 120 },
    "meter": { "enum": [4, 6, 8] },
    "version": { "type": "integer", "minimum": 1 },
    "lines": {
      "type": "array", "minItems": 1, "maxItems": 64,
      "items": {
        "type": "object",
        "required": ["idx", "text", "tokens", "phonKeys", "clips"],
        "additionalProperties": false,
        "properties": {
          "idx": { "type": "integer", "minimum": 0 },
          "text": { "type": "string", "minLength": 1, "maxLength": 120 },
          "tokens": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
          "phonKeys": { "type": "array", "items": { "type": "array", "items": { "type": "string" }, "minItems": 1 } },
          "beats": { "type": "integer", "minimum": 1, "maximum": 16 },
          "gesture": { "type": "string" },
          "clips": {
            "type": "object", "minProperties": 1, "additionalProperties": false,
            "properties": {
              "slow": { "$ref": "#/$defs/clip" }, "base": { "$ref": "#/$defs/clip" }, "fast": { "$ref": "#/$defs/clip" }
            }
          }
        }
      }
    }
  },
  "$defs": {
    "clip": {
      "type": "object",
      "required": ["id", "url", "durMs", "onsetMs", "pCentreMs", "speechMs", "tempoVariant", "voice", "review"],
      "properties": {
        "id": { "type": "string" }, "url": { "type": "string", "format": "uri" },
        "durMs": { "type": "integer" }, "onsetMs": { "type": "integer" }, "pCentreMs": { "type": "integer" },
        "speechMs": { "type": "integer" }, "tempoVariant": { "enum": ["slow", "base", "fast"] },
        "voice": { "type": "string" },
        "review": {
          "type": "object", "required": ["phonMatch", "humanOk"],
          "properties": {
            "asrPhonKey": { "type": "string" }, "phonMatch": { "const": true }, "humanOk": { "const": true },
            "reviewer": { "type": "string" }, "at": { "type": "string", "format": "date-time" }
          }
        }
      }
    }
  }
}
```

`phonMatch: const true` and `humanOk: const true` make an unreviewed clip a **schema failure**. Safety by
predicate, not instruction (inherited law). `rights: "ncert-pending"` passes the schema but is blocked by the
library loader.

### 7.6 Script-agnostic phonetic key (`shared/phonkey.ts`)

Needed because ASR returns Hindi in five scripts (§4.2). The key is a lossy consonant-vowel skeleton.

```ts
// 1. Transliterate any of Devanagari / Arabic-Urdu / Bengali / Gurmukhi / Latin to a coarse Latin (ISO-15919-ish).
// 2. Collapse: aspirates kept distinct for varnamala kits only (kh≠k); otherwise kh→k, gh→g, ch/chh→c, th→t, dh→d, ph→p, bh→b
//    retroflex↔dental merged (ṭ→t, ḍ→d, ṇ→n) except varnamala; nasalisation (ं ँ ں ং) dropped; ā→a, ī→i, ū→u, e/ai→e, o/au→o
//    Urdu: ے→e, ی→i/y, و→o/v by position; Hangul/other script → fail (phonMatch = 0, flagged for human ear)
// 3. Strip non-letters, single spaces.
export function phonKey(text: string, opts: { strictAspiration?: boolean; strictRetroflex?: boolean }): string;
// Token match: a line's phonKeys[i] is a list of accepted keys (regional variants); match if any is a
// substring of the transcript key at the expected position ±1 token.
export function phonMatch(expected: string[][], transcript: string): { matched: number; of: number; perToken: boolean[] };
```

Golden cases come from this probe's transcripts (`songs-chant-probe-2026-10-02.json` → `asrHi`):
"دو دونی چار" ≡ "दो दूनी चार"; "দো তিয়া ছ" ≡ "दो तिया छ"; "Do tia če" ≡ "दो तिया छे"; "दोत्या छे" =
**merged** (token boundary lost, so line fails with strict boundaries); "क ख ग घ म" ≠ "…ङ" (strict nasal in
varnamala kits). Put them in `evals/phonkey.test.mjs`.

### 7.7 Integration with `rhythm-poem@1`

`rhythm-poem@1` keeps its params and events (language-sst X2). It drives `chant-track@1` for `listen`,
`echo-line`, `fill-gap` and `perform`, mapping `rh.line` ← `chant.slot` (completeness = `phonMatch`) and
`rh.clap` ← `chant.tap`. Its `rhyme-spot` and `matra-count` modes are visual and stay its own. Its note "the
teacher chants over a WebAudio beat" is **superseded** by §5: the *track* chants and the teacher frames it.

---

## 8. Library pipeline (Forge, offline)

```
kit source (text + tokens + phonKeys + rights)  ── human-authored or copied from verified kit data
   │
   ├─ render: Azure Speech REST, chorusVoice, SSML per line × {slow -15%, base 0, fast +15%}
   │          varnamala/barahkhadi: one <voice> per letter/syllable; nasals & conjuncts flagged "human-clip"
   ├─ measure: onsetMs, pCentreMs, speechMs (same RMS code as songs-chant-probe.mjs → shared/audio-measure.mjs)
   ├─ gate A: ASR (taxila-transcribe, language pinned) → phonKey → phonMatch must be 1.0 per token
   ├─ gate B: human ear (native Hindi speaker), 1.5× speed listening queue, reject reasons coded
   ├─ compute: per-variant BPM fit (§7.4), store in kit
   └─ publish: Opus 20 kbps → Azure Blob, ChantKit JSON validated against chant-kit.v1.json, version++
```

- **Cost [I from V prices]:** render about $3 for the full corpus in 3 variants; ASR about $0.006/min × ~200 min
  ≈ $1.20. Human review is about 3,500 lines × 3 variants × ~3 s ≈ 9 h at 1.5× speed. Review only `base` and
  spot-check 10% of variants, since the same voice and text differ only in rate: **about 4 h**.
- **Cache key:** `(kitId, version, voice, tempoVariant, sha1(text))`. Prefetched with the lesson plan, like Forge
  assets.
- **Live fallback:** if a kit is missing (e.g. a 23 पहाड़ा asked on the spot), render live (~300 ms per line, in
  parallel) **with gate A only**, mark `review.humanOk=false`, and play it in `teacher-led` style. Free timing,
  no fade, and the teacher present. This needs a loader exception, logged and queued for human review. The kit
  is not persisted to the library until gate B passes.

---

## 9. Licensing and rights

| content | status | rule |
|---|---|---|
| पहाड़े, varnamala, barahkhadi, ginti, months and days, planets | facts or traditional, no copyright [I] | ship |
| traditional rhymes (मछली जल की रानी है, चंदा मामा दूर के — check authorship; some "traditional" rhymes have known authors) | many are PD or unattributed folk; some are not [U] | `rights:"traditional"` needs a cited provenance note per kit |
| NCERT textbook poems (Rimjhim, Marigold, Malhar, Honeysuckle…) | NCERT holds copyright in its textbooks. Many poems are by modern poets still in copyright (author's life + 60 years in India) [I] | `ncert-pending`. **Blocked until the owner decides.** Escalate: NCERT permission or poet estates. Kids can still recite from their own book with the teacher listening (`teacher-led`), with no rendered audio of the text [I] |
| Kabir, Rahim, Tulsi dohas; Tagore pre-1941 works | PD [I] | ship with source edition cited |
| film songs, popular tunes | copyrighted melody and lyrics | never |
| PD melodies (Twinkle Twinkle / "Ah vous dirai-je", Frère Jacques) | PD melody [I] | v2 tune templates only |
| AI-generated audio (Azure TTS) | output usable under Azure terms. The voice is Microsoft's stock voice [I] | fine |
| open-weight song models (v2) | ACE-Step MIT, YuE Apache-2.0 [S]. Training-data provenance not warranted by the licence [U] | v2 gate includes owner sign-off on provenance risk |
| child mic audio | child data | slot-level features only (`voicedFrac`, `onsetOffsetMs`). Batched ASR audio is held in memory for that pass and never stored. Transcripts are kept only as `phonMatch` numbers |

---

## 10. Latency and size budget

| step | budget | measured / basis |
|---|---|---|
| kit fetch (prefetched with the lesson plan) | 0 ms at chant time | Forge prefetch pattern |
| decode 10-line kit (Opus → AudioBuffer) | < 150 ms on a low-end Android | [U] — measure (M-SONG-4) |
| teacher framing turn → first beat | ≤ 1 bar after `response.done` (count-in covers it) | design |
| scheduling jitter | sample-accurate on the audio clock; main-thread stalls < lookahead 120 ms absorbed | web.dev two-clocks [V] |
| live fallback render, 10 lines in parallel | ~300-700 ms | Swara total 297 ms median, single line, US container [M]; India RTT adds 2-3 round trips [I] |
| child-slot ASR batch (per pass) | off critical path, < 2 s | gpt-4o-transcribe |
| clip size | ~3 KB/s at 20 kbps → table line ≈ 4 KB, a 10-line kit × 3 variants ≈ 120 KB | low-end-offline data-saver |

---

## 11. Measurements still owed (proposed `M-SONG-*`)

| id | what | method | bar | blocks |
|---|---|---|---|---|
| M-SONG-1 | the ear check this doc could not do | native-speaker listening to all 72 + 13 probe WAVs; code "sings?", "line correct?", "letters distinct?" | — | confirms or overturns §4 hand-coding |
| M-SONG-2 | ङ / ञ / ण, conjuncts | Swara and 3 other hi-IN voices × `<phoneme>` / carrier word / plain; ASR + ear | ≥ 4/5 heard right | varnamala kits |
| M-SONG-3 | mic leak with the beat on a phone speaker | 3 Android phones (one low-end), chant-track in a WebView, child slots silent vs a child chanting; `voicedFrac` ROC | silent-slot false voiced < 10% at `duckChildSlots` 0.35 | `mic:"detect"` |
| M-SONG-4 | decode and schedule on a low-end device | 2 GB Android, 10-line kit, onset drift over 3 min | drift < 10 ms; no underruns | v1 ship |
| M-SONG-5 | does it work? | within-child A/B, n ≥ 30 children, classes 2-3: पहाड़ा via chant-track arc vs teacher-led spoken repetition at matched time; outcome = shuffled 2×k accuracy and latency at 1 day and 7 days | chant ≥ spoken on day-7 shuffled retrieval | keeps chant-track in the Conductor's default arc |
| M-SONG-6 | v2 songs | ACE-Step 1.5 on an Azure GPU, 20 lines, fixed tune; §8 gates | ≥ 95% pass gate A and B | v2 song mode |

---

## 12. Decisions proposed for `context/` (for the main loop to merge)

- **chant-not-song-v1:** verbatim content gets a beat-locked TTS chant from a reviewed library, not generated
  songs. Rests on: no allowed singing model [V/M]; corpus finite (§2); Kilgour 2000 rate confound [S]. *Reverse
  if:* an allowed model passes M-SONG-6, or M-SONG-5 shows a ceiling the chant cannot beat while literature
  shows melody adds beyond pacing.
- **chant-voice-azure-speech:** Hindi chant clips use Azure Speech hi-IN Neural (deterministic, 160/297 ms,
  12/12 table lines) [M], presented as a chorus voice, not the teacher. *Reverse if:* the L2-C ABX passes for
  `marin` and a reviewed `marin` corpus passes §8 (then the chant is hers); or M-SONG-1 finds Swara's chant
  delivery rejected by children or parents.
- **teacher-does-not-hold-the-beat:** the live teacher frames and reacts; the track holds the beat; mic goes to the
  local slot detector during the track (§5). *Reverse if:* a measured realtime chant stays within ±60 ms of a
  click track over 8 bars.
- **phonkey-for-hindi-asr:** every verbatim ASR check normalises script first [M: 7-9/15 non-Devanagari for
  gpt-4o-mini-tts clips with `language=hi`]. *Reverse if:* the transcriber gains a script-forcing option that gives ≥ 14/15 Devanagari on
  the probe set.
- **rejected (log it):** `mstts:audioduration` for beat-fitting. It budgets the file, including about 1 s of
  trailing silence, and compresses speech about 2× ("दोत्या छे") [M].
- **rejected:** gpt-4o-mini-tts `instructions` to sing. No measurable singing, and durations vary per render [M].

---

## Sources

- Wallace 1994, Memory for music: effect of melody on recall of text — https://www.semanticscholar.org/paper/Memory-for-music:-Effect-of-melody-on-recall-of-Wallace/bbd36596cf39f88c1f3066526a96561b4768f484
- Kilgour, Jakobson & Cuddy 2000, Music training and rate of presentation as mediators of text and song recall, Memory & Cognition 28:700-710 (cited from the literature; not re-fetched) [S]
- Racette & Peretz 2007, Learning lyrics: to sing or not to sing? — https://link.springer.com/article/10.3758/BF03193445
- Ludke, Ferreira & Overy 2014, Singing can facilitate foreign language learning — https://link.springer.com/article/10.3758/s13421-013-0342-5
- Good, Russo & Sullivan 2015, The efficacy of singing in foreign-language learning — https://journals.sagepub.com/doi/abs/10.1177/0305735614528833
- Calvert & Tart 1993, Song versus verbal forms for very-long-term, long-term, and short-term verbatim recall — https://cdmc.georgetown.edu/wp-content/uploads/2015/03/Calvert-Tart-1993.pdf
- Music mnemonics aid verbal memory (review) — https://pmc.ncbi.nlm.nih.gov/articles/PMC4056382/
- Purnell-Webb & Speelman 2008, Effects of music on memory for text — https://journals.sagepub.com/doi/10.2466/pms.106.3.927-957
- Busse et al. 2018, Combining song- and speech-based language teaching (migrant children) — https://pmc.ncbi.nlm.nih.gov/articles/PMC6279872/
- Nursery rhyme knowledge and phonological awareness in preschool children (ERIC EJ1097164) — https://eric.ed.gov/?id=EJ1097164
- Spoken or sung? Word learning in child-directed speech and song (J Child Lang) — https://www.cambridge.org/core/journals/journal-of-child-language/article/spoken-or-sung-examining-word-learning-in-childdirected-speech-and-in-song/C70C79DE915B639AE84D2BC6D710D95B
- ElevenLabs Eleven Music API — https://elevenlabs.io/eleven-music-api ; docs https://elevenlabs.io/docs/overview/capabilities/music ; launch https://elevenlabs.io/blog/eleven-music-now-available-in-the-api
- ElevenLabs Music v2 review (licensing, Merlin/Kobalt) — https://www.buildfastwithai.com/blogs/elevenlabs-music-v2-review-2026 ; latency tests https://www.glbgpt.com/hub/elevenlabs-music-v2-review/
- Suno developer API exploration — https://www.musicbusinessworldwide.com/suno-explores-developer-api-seeking-apps-that-unlock-experiences-generative-music-makes-possible-for-the-first-time/ ; https://www.digitalmusicnews.com/2026/07/03/suno-is-opening-an-api-partner-program/ ; Suno (Wikipedia, WMG settlement) https://en.wikipedia.org/wiki/Suno_(platform) ; unofficial-API risks https://aimlapi.com/blog/the-suno-api-reality
- Stable Audio licensing and comparison — https://stability.ai/explainers/stable-audio-vs-competitors-licensing-export-rights-and-self-hosting-compared ; https://replicate.com/stability-ai/stable-audio-2.5/api ; https://aivideobootcamp.com/blog/stable-audio-3-complete-guide-2026/
- Lyria 3 on Vertex AI (Hindi vocals) — https://cloud.google.com/blog/products/ai-machine-learning/lyria-3-and-lyria-3-pro-on-vertex-ai ; Lyria 3.5 in Gemini API — https://alphasignal.ai/news/google-opens-lyria-3-5-to-developers-generating-full-songs-with-vocals
- Azure OpenAI audio models — https://learn.microsoft.com/en-us/azure/foundry/openai/audio-completions-quickstart ; Foundry models sold by Azure — https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure
- OpenAI next-generation audio models (gpt-4o-mini-tts steerability) — https://openai.com/index/introducing-our-next-generation-audio-models/
- Realtime API capability notes (no singing) — https://community.openai.com/t/introducing-the-realtime-api/966439
- Azure Speech SSML voice and prosody — https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice ; WordBoundary offsets — https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechsynthesiswordboundaryeventargs?view=azure-node-latest
- A tale of two clocks (Web Audio scheduling) — https://web.dev/articles/audio-scheduling ; MDN advanced techniques — https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques
- ACE-Step 1.5 — https://github.com/ace-step/ACE-Step-1.5 ; paper https://arxiv.org/abs/2602.00744
- YuE (Apache-2.0) — https://huggingface.co/m-a-p/YuE-s1-7B-anneal-en-icl ; paper https://arxiv.org/pdf/2503.08638
- Internal: `learning-science.md` §2.4, rule 24; `language-sst-engines.md` X2; `animation-video.md` §0 (Sora status);
  `voice/voices-hindi.md` §3.2-3.3 (Azure voices, prices); `design/low-end-offline.md` (same-voice law, echo, data saver);
  `context/decisions.md` (`voice-realtime-model`, `voice-turn-config`, `azure-only-compute`).

---

## Engineering review

**Reviewer:** senior frontend/game engineer pass, 2026-10-02. Read against this doc, `src/lesson/realtime.ts`,
`src/lesson/voiceLink.ts` and `sandbox-telemetry.md`. Tags as above. Verdict: **the architecture is right (pre-rendered
reviewed clips on a client audio clock, teacher frames and reacts). The spec is not buildable as one 2-day engine, and
five items would fail on a real phone or in the real code.** Corrections first, then cost.

### E1. Blocking corrections (would fail on device or against the real code)

1. **The handover recipe collides with `realtime.ts`.** §7.2 step 2 says `session.update` with
   `turn_detection.create_response=false`. `realtime.ts` documents that a partial `audio.input` update may *replace*
   the object and silently drop transcription (`audioInputFrom`). The code already has the right primitive:
   `setTurnDetection(null, audioInputFrom(session))` (the push-to-talk path), and `turnDetectionFrom()` to restore.
   Use that. Also mute the uplink with `micTrack.enabled = false` instead of only `input_audio_buffer.clear`, and
   restore both on stop. [V from code]
2. **The mic constraints in §7.2 step 3 contradict the live call.** `voiceLink.ts` already holds one
   `getUserMedia` stream (`echoCancellation`, `noiseSuppression`, `autoGainControl` all true) and one `AudioContext`
   with a level analyser. A second `getUserMedia` with `noiseSuppression:false` can open a second capture source on
   Android Chrome, change the audio mode, or fail. Tap the **existing** stream with `createMediaStreamSource` into an
   AudioWorklet, and live with the call's processing. If a chant-specific mic setup is wanted, test
   `track.applyConstraints` on a real device first [U]. Spec it as a shared-stream tap, not a new capture.
3. **Phone speakers cannot play the kick.** §7.2 gives the kick as a 150 → 50 Hz sine. A ₹10k phone speaker rolls
   off below roughly 300-400 Hz [I], so the beat would be almost inaudible and only the voice would be heard.
   Re-specify every groove voice with its energy at 250 Hz-4 kHz: kick = 220 → 120 Hz sine plus a 3 ms noise click;
   keep the clap and tick. Add a "does it sound like a beat on a phone speaker" listening check to M-SONG-1.
4. **"fade" mode is not implementable with whole-line clips.** `fade` / `vanishing` "hidden = beat only" needs the
   track voice silent over specific *tokens*, but `ClipRef` stores only `onsetMs/pCentreMs/speechMs`. Add
   `words: {tokenIdx, startMs, endMs}[]` to `ClipRef` (the schema needs it too). Capture it at render from the
   Azure Speech **SDK** `WordBoundary` event; the REST call the probe used does not return it [S, Azure docs cited in
   Sources]. Hidden trailing token (product first) = truncate the clip at the boundary with a 30 ms fade. Hidden
   mid-line token (multiplier word) = a gain gate with 15 ms ramps at the boundaries. The same field also feeds
   `highlight: "word"`, which currently has no data source. `akshara` highlight has no data source either: render
   per-akshara by the **even-split of the word's span**, flagged approximate, or cut it from v1.
5. **`together` slots cannot be detected.** `voicedFrac` over a slot where the track voice is playing (even ducked
   to 60%) measures the loudspeaker leak, not the child, whenever AEC does not fully cancel Web Audio output (M-SONG-3,
   unmeasured). Only `echo`, `child-leads`, and the *hidden-token windows* of `fade` give a clean reading. Rule:
   `chant.slot.kind:"together"` events carry `voicedFrac: null` unless `detectorTrust === "high"`.

### E2. Other corrections

| # | doc says | problem | correction |
|---|---|---|---|
| 6 | Look-ahead scheduler, 25 ms timer, 120 ms ahead | Low-end Android main thread stalls of 200 ms+ (React renders, GC, WebView) will exceed the 120 ms look-ahead and the timer is throttled when the page is not focused [I]. The clips are all known in advance. | Schedule **whole bars (or the whole pass) up front** on the audio clock, each group routed through its own `GainNode` so `pause/stop/setBpm` can cancel it. Look-ahead timer only for the *next* group, from a Worker interval. Jitter then cannot reach the audio |
| 7 | Karaoke highlight | The highlight is driven from the audio clock but the speaker is `outputLatency` behind (100-300 ms on cheap Android, more on Bluetooth) | Drive rAF from `ctx.currentTime - (ctx.outputLatency ?? ctx.baseLatency ?? 0.12)`; update classes via refs, never React state per word (60 fps on a ₹10k device) |
| 8 | `chant.tap` / `onsetOffsetMs` entrainment | Needs output + input latency + touch latency compensation that we cannot know on Android. The doc itself says "logged, never a misconception" | **Cut from v1.** Drop `chant.tap`, `onsetOffsetMs`. Saves a day and one event type |
| 9 | `ChantTrackParams.kit: ChantKit` | The LLM Director would emit a whole kit (kB of tokens) and could pass an unreviewed one. This breaks "unreviewed clip = schema failure" | LLM-facing param is `kitId: string` (enum from the lesson plan's available kits). The **loader** fetches the kit and validates it against §7.5 server-side |
| 10 | `bpm?: Bpm` plus `setBpm()` | §7.4 says the engine never time-stretches and the kit's clips fit one BPM per variant. An LLM-chosen 100 BPM on a kit fitted for 90 forces every line to 4 beats | Remove `bpm` and `setBpm` from the LLM surface. The only knob is `tempo: "slow"|"base"|"fast"`; BPM is derived from the kit |
| 11 | `PahadaParams.arc: Array<{mode, passes, tempo}>` | A free-form array is a large degree-of-freedom surface for an LLM and untestable | Enum presets: `arc: "acquire" \| "consolidate" \| "recall"`, each expanding to a fixed arc in code. Keep the array only in the internal type |
| 12 | `ChantLine.phonKeys: string[]` | The JSON Schema and `phonMatch()` use `string[][]` (accepted variants per token). The TS type will not compile against them | `phonKeys: string[][]`; also a loader check `phonKeys.length === tokens.length` (not expressible in JSON Schema) |
| 13 | `review` in the TS `ClipRef` has all fields; the schema requires only `phonMatch`, `humanOk`. `phonMatch` is a boolean in `ClipRef.review` and a number in `ChantEvent` | Name collision, drifted contracts | Rename the clip flag `gateA`/`gateB`; make `reviewer` and `at` required in both. Mark `clip` `additionalProperties:false` |
| 14 | `countInBars` uses spoken "1, 2, 3, 4" clips | No field in `ChantKit` for them | Add `countIn: ClipRef[]` (4 clips) per voice; share across kits |
| 15 | Opus 20 kbps, review on the Azure WAV | Opus at 20 kbps smears sibilants and nasals, the exact ङ ञ ण cases. Also encoder pre-skip shifts `onsetMs` | Run gate A, gate B and the onset/p-centre measurement on the **decoded final asset**. Codec: Opus-in-Ogg/WebM is fine for Android WebView and Chrome; Safari support is [U], so keep an AAC fallback for web |
| 16 | `pCentreMs` = first RMS peak ≥ 50% | For "दो एकम दो" the perceptual beat is not the first energy peak | With word boundaries (E1.4), define p-centre as the **onset of the first stressed content word** (not "दो"), set per kit by the reviewer in the review tool |
| 17 | §7.4 BPM fit | Zero slack: a Swara line of 1.21 s tips a table from 2 to 4 beats. Table 11-20 lines are longer than the 1.03-1.20 s measured on 2-10 [U, not probed] | Compute BPM per kit, floor at 72, and allow a 4-beat slot for outliers rather than collapsing the whole kit's tempo. Probe the 11-20 lines before promising 90 BPM |
| 18 | Live fallback render with `humanOk=false`, "loader exception" | It punches a hole in the predicate that is this doc's main safety mechanism, to serve out-of-curriculum asks (a 23 पहाड़ा) | **Remove from v1.** Out-of-library asks go to `teacher-led` (no rendered audio). Revisit after the library exists |
| 19 | `chant-track` runs "in the app" | `sandbox-telemetry.md` §iframe sets `microphone 'none'`, `autoplay 'none'`, `connect-src 'none'` for generated modules | State it: `chant-track@1` and `pahada@1` are **first-party host-side code**, not sandboxed modules. They are not model-generated, so they do not need the iframe. Do not let a sandboxed module request the chant via postMessage with a kit payload, only `kitId` |
| 20 | "about 6 kB of code" | Not credible: scheduler, 5 grooves, 7 modes, fade gate, ladder, worklet VAD, handover, summary | Plan for ≈1,500-2,500 LOC TS, ≈15-25 kB gzip [I]. Still small, but do not budget as 6 kB |
| 21 | 4 h of human review | Excludes the re-render loop and the review tool itself. Varnamala/barahkhadi (≈450 isolated syllables) is where TTS fails: single-syllable SSML often reads as a letter name or adds a vowel | Budget 2-3 reviewer-days, mostly varnamala/barahkhadi. **Probe barahkhadi isolated syllables** (the doc only probed varnamala letters) before committing |
| 22 | `phonMatch` ≥ 0.6 threshold for `weakLines` | The ASR's script chaos (7-9/15 off-script) and child speech mean this number is noisy; the threshold is untuned | Treat `phonMatch` as advisory until a child-speech calibration set exists. Weak-line decisions use `voicedFrac` in clean slots first |

### E3. Are the params enough for LLM control? Are the events enough for the teacher?

- **Params.** After E1/E2 the LLM-facing surface should be exactly: `kitId`, `mode`, `tempo`, `lines`, `passes`,
  `fade.order` (`"last-first" | "product-first" | "random"`; today only `keepFirstToken` and `maxFrac` exist and the
  hide order is implicit), `groove` (kit default; allow `"none"` for sensory-sensitive children), `mic`. Everything
  else (BPM, ladder, duck level, count-in) is derived or a kit default. Missing today: `volume` cap (see S2),
  `restBetweenPassesMs`, and `pauseOnTeacherInterrupt`.
- **Events.** They show *participation* but not *recall*. The recall signal is the **hidden-token window** in `fade`:
  did the child produce the product where the voice went silent. The events are per line slot, so a hidden mid-line
  token is drowned by its visible neighbours. Add:
  `chant.token {line, tokenIdx, hidden: true, voiced: boolean, latencyMs: number|null, phonMatch?: number}`, emitted
  only for hidden tokens (clean of leak because the track voice is silent there; needs E1.4).
- **Trust.** Add a **calibration bar**: count-in plus one beat-only bar, child asked not to speak, to measure leak
  and noise floor; emit `chant.mic {leakDb, floorDb, detectorTrust: "high"|"low"|"none"}`. `ChantSummary` gains
  `detectorTrust` and `hiddenTokenHits: {line, tokenIdx, hits, tries}[]`. With `low`/`none`, the summary says
  "participation unknown" and no `weakLines` are produced. Without this the teacher would praise or correct a child
  on a leak reading.
- **Lifecycle events missing:** `chant.interrupted {cause: "call"|"focus-lost"|"route-change"|"background"}` (see E4).

### E4. Device and performance notes (₹10k Android, WebView)

- **60 fps: yes**, provided highlight is ref/CSS driven (E2.7) and nothing renders per beat. Audio runs on the audio
  thread; a 10-line kit × 3 variants is ≈3-4 MB of decoded 24 kHz mono float (115 KB per 1.2 s clip). Decode only the
  active tempo variant (≈1.2 MB). Do not decode barahkhadi as one kit; load per matra row. [I]
- **Android audio mode.** With an open call mic, Android's WebRTC path can put playback on the voice-communication
  stream, making Web Audio quieter and different in level from the teacher [U]. Add to M-SONG-3: beat and clip level
  vs the teacher at max media volume on three phones, plus Bluetooth earbuds (extra 150-250 ms output latency; fine
  for the audio-clock schedule, wrong for any child-onset timing).
- **Interruptions.** Incoming calls, notifications and audio-focus loss suspend the `AudioContext`. Handle
  `ctx.onstatechange`, `visibilitychange`, and the Capacitor app-pause event: pause, drop to `teacher-led`, emit
  `chant.interrupted`. The spec has no such path.
- **Autoplay.** The `AudioContext` must be resumed inside a user gesture; `voiceLink.ts` already resumes its own
  context. Create the chant context lazily on the "start chant" tap, or reuse that context [V from code].
- **Offline APK.** Bundle pahada 2-10, ginti, varnamala (`base` only) in the APK assets (≈0.6-1 MB) [I]; stream the
  rest.

### E5. Safety review

- **S1. Blind safeguarding window (highest).** While the uplink is held, the teacher cannot hear a child who says
  something that triggers the Childline 1098 / Tele-MANAS 14416 hand-off. Six passes of a 10-line kit run
  ≈ 80-120 s. Mitigations, all by predicate: (a) hard cap **one pass segment ≤ 60 s** with a teacher listening turn
  between segments; (b) in every *non-hidden* silent slot, any voiced content that is long and does not match the
  expected `phonKey` is batched to ASR and run through the **same crisis predicate** as live turns, and a hit stops
  the track and escalates; (c) the "रुको" button is always visible and large. Not optional: this is the child-safety
  floor in `CLAUDE.md`, which stays.
- **S2. Loudness and startle.** Synthesised clap and kick bursts through a phone speaker or earbuds at high media
  volume. Cap the master gain at about -6 dBFS before the compressor, ramp in over the count-in, and never exceed
  the loudness of the teacher's voice. [I]
- **S3. Visual flash.** If a beat pulse is drawn, keep it to quarter-note rate (≤ 1.75 Hz at 105 BPM) and never a
  full-screen flash (WCAG 2.3.1 flash limit is 3 per second). `tick-4` at eighth notes would reach 3.5 Hz if visualised.
  Respect `reducedMotion` and offer a "no beat" groove for sensory-sensitive children.
- **S4. Child voice data.** Per-pass batched ASR sends child audio to `taxila-transcribe`. "Held in memory, never
  stored" describes our side only. Say so in the consent copy, and keep the audio out of any logs and the
  Director's event stream (only `voicedFrac`/`phonMatch` numbers). Compliance is deprioritised by the owner, but
  the data-handling line is cheap now and expensive later.
- **S5. Rights predicate.** `ncert-pending` passing the schema and being blocked by a loader is two places that
  must agree. Make it a schema failure (`rights` enum excludes it) and keep NCERT poems in a separate, unshipped
  folder; add a CI check that no shipped kit is `ncert-pending`.
- **S6. phonkey false accepts.** The collapse rules (aspirates, retroflex, nasalisation, vowel length) accept real
  errors, for instance a dropped final -ह. The golden tests list only equivalences. Add a **negative suite**
  (सत्ते vs सात, चौके vs चौक, चौदह vs चौदा-with-dropped-h) that must fail.

### E6. Build-cost estimate per engine

Sizes: **S** ≤ 1 day, **M** 1-3 days, **L** > 3 days, one engineer, including unit tests, excluding device-matrix
time. "Fits ≤ 2 days" is the brief's bar.

| component | size | est. | fits ≤ 2 d? | 60 fps / ₹10k | main risks |
|---|---|---|---|---|---|
| `shared/contracts` + `chant-kit.v1.json` + loader + CI predicates (E5.5, E2.12-14) | S | 1 d | yes | n/a | contract drift (E2.12-13) |
| `chant-track` **core**: audio-clock scheduler, groove synth (3 presets: clap-4, keherwa-8, tick-4), clip placement, `listen`/`echo`/`together`, count-in, rAF highlight, interruptions | M | 3 d | **no**, 2 d only if cut to `listen`+`echo`, 2 presets, no highlight | yes (audio thread) | speaker-audible grooves (E1.3), output-latency highlight, WebView autoplay |
| `chant-track` extra modes: `fade`, `child-leads`, `speed-ladder`, token gain gate | M | 2 d | yes, **blocked on word boundaries** | yes | word-boundary capture (E1.4), click-free gating |
| mic slot detector: AudioWorklet VAD, shared-stream tap, calibration bar, `detectorTrust`, per-slot ring buffer | M-L | 3-4 d + device testing | **no** | yes | AEC on Android unknown (M-SONG-3); trust gating decides whether it ships |
| realtime handover + `ChantSummary` + barge-out + crisis predicate on slots (E1.1, E5.1) | M | 2 d | yes, if lesson runtime hooks are stable [U, not read in depth] | n/a | interaction with PTT/turn-detection restore; teacher-turn timing |
| `pahada@1` (presets, fade order, handoff to fact-fluency) | S | 1 d | yes | yes | depends on the separate fact-fluency engine existing |
| `rhythm-poem@1` driver (map events, keep its visual modes) | S | 1 d | yes | yes | akshara highlight data (E1.4) |
| `shared/phonkey.ts` + golden + negative tests | M | 2-3 d | borderline; **S (1 d)** if limited to Devanagari + Latin + Urdu and fail on others | n/a | five-script transliteration is the cost; Urdu has no short vowels, so the key must be a consonant skeleton |
| Forge render + measure + gate A + SDK word boundaries + Opus encode + schema validate | M | 2 d | yes | n/a | SDK vs REST; encoded-asset measurement (E2.15) |
| human review tool (queue, 1.5× playback, reject codes, p-centre picker) | S-M | 1-2 d | yes | n/a | not in the doc's plan at all |
| human review labour (corpus) | labour | 2-3 reviewer-days | n/a | n/a | varnamala/barahkhadi nasals, isolated syllables (E2.21) |

**Total engineering:** ≈ 17-21 engineer-days for the full v1 as specced, against the doc's implied ≈ 2. A
defensible **v1a ≈ 8-9 days**: contracts+loader, core (listen/echo/together, 2 presets), word-boundary Forge
pipeline + review tool, `pahada@1` with `mic:"off"` and the teacher listening after each ≤ 60 s segment, a
Devanagari-only phonkey for gate A. **v1b** adds `fade`, the mic detector and calibration, slot ASR and the crisis
predicate, once M-SONG-3 shows `detectorTrust` is attainable. Ship v1a first because it already carries the
documented evidence (paced chunked repetition, Kilgour 2000 / Calvert 1993) and nothing in it is blind to the child.

### E7. Items this review could not verify

- No real-device run was possible here. Every device claim above ("speaker rolls off below ~300-400 Hz", Android
  audio-mode behaviour, 100-300 ms output latency, decode times) is [I]/[U] and maps to M-SONG-3/4.
- I read `realtime.ts` and `voiceLink.ts` only for the mic/turn-detection seams; I did not audit the rest of the
  lesson runtime, so the E6 estimate for the handover carries [U].
- `WordBoundary` availability for hi-IN Neural voices via the SDK is documented generally but **not probed for
  Swara**; add it to M-SONG-2.
