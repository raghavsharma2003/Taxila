# World-best voice conversation UX for children: turn-taking, latency, backchannels, ASR, TTS, sound and trust

**Date:** 2026-10-03. **Scope:** turn-taking and endpointing (VAP, semantic/audio end-of-turn models, full-duplex
2025-2026), latency masking, backchannels, barge-in and echo, children's ASR, Indian TTS naturalness, sound
design, child-facing app patterns (Khan Kids, Duolingo, Lingokids, Ello, Toca Boca) and parent trust (ClassDojo,
Seesaw, Brightwheel).

**This document extends, and does not repeat:**
- `../voice/VOICE-TEACHER.md` (build spec: floor states, think-time window, ASR lanes, safety floor);
- `../voice/human-likeness.md` (timing norms, wait time, Moshi and Full-Duplex-Bench, ranked levers);
- `../voice/asr-kids-hinglish.md` and `../voice/v2/stt-hinglish.md` (child ASR literature, HiACC, E0, the lane L/G result);
- `../voice/v2/VOICE-CHOICE.md`, `../voice/voices-hindi.md` (voice shortlist, Voice Live lanes, GPT-Live);
- `../voice/network-resilience.md`; `../design/PRODUCT-DESIGN.md` §3.12 and §4.5 (waits ladder, earcons);
- `../design/kids-ux-ages.md` (Khan Kids, Lingokids, Toca, Sesame) and `../design/parent-experience.md` (parent-messaging RCTs, ClassDojo).

Read those for the baseline. This file adds evidence and Azure capabilities found since then, two **corrections**
to proposed decisions (§0, items 2-3), and a steal list mapped to files.

**Evidence tags.** **[V]** read at the primary source this session (paper PDF/abstract, vendor doc, model card,
licence). **[S]** secondary (search snippet, press, a primary quoted elsewhere). **[U]** unverified or my
inference. A [V] on a vendor page means *the vendor says so*. **[M]** = measured in this repo (cited, not re-run).

**Method.** ~30 WebSearch queries, ~25 primary fetches (Microsoft Learn source pages, arXiv abstracts, ACL
Anthology PDF parsed with `pdftotext`, Hugging Face model and dataset cards, GitHub READMEs, Daily.co engineering
posts). Pages that refused fetch (MDPI 403, Common Sense Media 403, MIT DSpace 405) are cited [S].

---

## 0. The findings that change something

1. **Silence length barely predicts whether a child has finished; a predictive model does.** On the Ohio Child
   Speech Corpus (148 h, children 4-9, English), silence duration separated turn SHIFT from HOLD with
   **AUC 0.62** (child-initiated 0.62, adult-initiated 0.59; Switchboard adults 0.63). A Voice Activity
   Projection model using only the audio *before* the silence reached **F1 90.3 / balanced accuracy 94.0**
   overall and **88.95 / 94.14 on child-initiated events**, with no clear age trend
   (Brahimi, Blanc & Fourtassi, IWSDS 2026) [V]. Taxila's endpoint today is a fixed 900 ms silence
   (`server/voice/stt.js`, `voice-turn-config`, n=1 synthetic). A fixed threshold is the weakest
   possible turn model for children: it either cuts thinkers off or makes every complete answer wait.
2. **Correction: DragonHD voices do not support SSML `<prosody>`.** Microsoft's HD-voices page lists `<prosody>`
   (pitch, contour, range, **rate**, volume) as **No** for DragonHD and for Dragon HD Omni; `<break>`,
   `<lang>`, `<phoneme>`, `<say-as>`, `<sub>` and alias lexicons are Yes for DragonHD [V,
   high-definition-voices, updated 2026-09-24]. `voice-choice-v2` and VOICE-CHOICE.md §3 put the per-character
   pace (targets ~11/13/11 chars/s) in `<prosody rate>`, and VOICE-CHOICE already flags "[U] whether DragonHD
   honours prosody rate". Its own numbers (15.2-15.9 chars/s at `rate=0.95`, vs 12.0 for real Hinglish speech)
   fit "ignored". Pace must come from voice choice (Meera is natively 13.8), `<break>` at clause boundaries,
   Voice Live's `voice.rate` (documented "for any standard Azure text to speech voices", HD not stated [U]),
   or gpt-4o-mini-tts `speed`. The en-IN DragonHD personas Taxila found GA in `voices/list` are also absent
   from that page's DragonHD table (which lists de/en-US/es/fr/ja/zh only) [V]: the docs lag the catalogue, so
   every SSML feature must be probed per voice, not read off the page.
3. **Correction/qualifier: word timings for karaoke exist only on Dragon HD Omni, not DragonHD.** Word boundary
   events are listed as an Omni feature [V]; Omni is not production (`dragonhdomni-not-production`). So the
   `karaoke-from-transcript-estimate` rejection stands for the DragonHD cascade path. One open door: Voice Live
   returns `response.audio_timestamp.delta` word timestamps "when you use Azure voices" with
   `output_audio_timestamp_types: ["word"]` [V, voice-live-how-to]; whether that works for an en-IN DragonHD
   voice is [U] and is a one-afternoon probe on lane B.
4. **Azure now ships an audio end-of-turn model and client-reference echo cancellation in Voice Live.**
   - `end_of_utterance_detection` models: `semantic_detection_v1`, `semantic_detection_v1_multilingual`, and
     (2026-06-01-preview) **`smart_end_of_turn_detection`**, which "operates directly on the input audio
     stream" with `threshold_level` low/medium/high and `timeout_ms` [V, API ref 2026-06-01-preview].
   - `azure_semantic_vad_multilingual` lists Hindi; `remove_filler_words` drops an **English** filler list
     during an ongoing response to cut false barge-ins [V].
   - **Live-Reference AEC** (API 2026-07-15): the client sends stereo PCM16, channel 0 = mic, channel 1 = what the
     device actually plays; the server cancels against the real playback path. The default server reference
     assumes playback starts immediately and "if playback is delayed for more than two seconds, echo
     cancellation quality is impacted" [V]. Taxila's pause-then-decide barge-in *keeps buffering and resumes
     later* (`cascade-barge-pause-decide`), which is exactly the delayed-playback case: on lane B
     (Voice Live) the default AEC reference will be misaligned after every resumed pause.
   - `auto_truncate` (truncate server-side audio to the client's playback state on interruption) [V].
5. **Interim responses exist in Voice Live but only for cascaded text-LLM + Azure voice, not realtime audio
   models;** default trigger is latency ≥ **2000 ms**, static texts are picked at random, LLM interims use
   `gpt-4.1-mini` with 50 tokens [V, how-to-voice-live-interim-response]. The mechanism is right, the defaults
   are wrong for children (§2, S3).
6. **A gesture beats a progress symbol for masking latency.** Gonzales et al. 2025 (n=24, within-subject, VR
   embodied agent): a multimodal behavioural filler (verbal + gesture) improved perceived response time,
   presence, humanlikeness and naturalness; symbolic indicators (a badge-style bar, a thinking bubble) pulled
   gaze off the agent's face and improved nothing; **87.5%** preferred the behavioural filler [V, arXiv
   2508.11781]. Taxila's waits ladder uses a "three dots (thinking)" pictogram and, for Older, "a named phase with
   elapsed time counting up" (PRODUCT-DESIGN §3.12): both are symbolic.
7. **Full-duplex is still not an option for Hindi on Azure, and still backchannels badly.** NVIDIA PersonaPlex-7B
   (Jan 2026, NVIDIA Open Model License, commercial OK) is English-only [S]; Moshi weights are CC-BY 4.0,
   English and French only [S]. Full-Duplex-Bench reports Moshi's backchannel frequency at 0.005 with JSD
   0.977 [S]. GPT-Live-1 (Azure) is full-duplex with a sideband socket and `thinking/commentary/instructions`
   append events (≤ 500 tokens each), no authoritative turn-completed event, and instructions and voice are
   immutable after `session.start` [V, gpt-live how-to]. Build half-duplex excellently; do not wait for duplex.
8. **The best open turn model is commercially usable, tiny, and covers Hindi.** Pipecat **Smart Turn v3.x**:
   Whisper-Tiny encoder + linear head, 8 M params, int8 ONNX 8 MB, audio-only (≤ 8 s, 16 kHz), 23 languages,
   **Hindi 93.44% (n=1,295 test samples)**, English 94.31% (v3.0), English 94.7-95.6% in v3.1 after adding
   human-recorded data; CPU inference 10-100 ms; **BSD-2-Clause weights and code**; training data CC BY 4.0 with
   a `synthetic` flag [V, GitHub, HF, Daily.co]. LiveKit's turn detector (Qwen2.5-0.5B, *text-only*, Hindi TPR
   99.4 / TNR 96.3) is under the "LiveKit Model License" [V]: treat it as not usable outside LiveKit Agents
   until counsel reads it.
9. **Prosody beats text for end-of-turn, and text adds false alarms.** Sharon, A, Hacioglu & Stolcke (Sept 2026):
   acoustic-prosodic signals alone gave utterance F1 0.93 with 7.8% false alarms at 400 ms median latency;
   adding text *raised* false alarms without improving accuracy [V, arXiv 2609.11066]. This matters because
   Taxila's planned partial-transcript predicates (VOICE-TEACHER §9.4) are text cues, and E0 found the live
   transcript arrives only ~530-570 ms after commit [M].
10. **Children engage more with a contingent listener and with a speaker who entrains to them.**
    Park et al. HRI 2017 (4-6 year-olds): a robot whose backchannels were timed by a prosody-based
    backchannel-opportunity model was preferred, drew more gaze, and children told stories "with higher energy"
    than to a non-contingent robot [S, abstract]. Kory-Westlund & Breazeal 2019 (n=86, ages 3-8, 2×2): a robot
    that matched the child's speaking rate and pitch (plus a backstory) produced more target-word use in
    retellings and more positive affect [V, Frontiers].

---

## 1. The landscape: who does what better than anyone

| who | what they do better than anyone | evidence | usable by Taxila? |
|---|---|---|---|
| **Pipecat Smart Turn v3.2** (Daily) | open, audio-native end-of-turn classifier; 8 MB; Hindi and Marathi trained; open data | [V] GitHub/HF/blog | yes: BSD-2 weights, runs on device or on ACA CPU |
| **VAP / VAP-Realtime** (Ekstedt, Skantze, Inoue) | continuous prediction of who speaks next from stereo audio, plus backchannel and nod prediction heads; multilingual EN/ZH/JA | [V] GitHub, LREC-COLING 2024 | code MIT; **pretrained models academic-only** → method only, train our own |
| **IWSDS 2026 child VAP** (Brahimi et al.) | the only child-adult turn-taking model result found: VAP bAcc 94 vs silence AUC 0.62 | [V] PDF | method; OCSC is on TalkBank (licence not checked [U]) |
| **Azure Voice Live** | managed EOU models incl. audio `smart_end_of_turn_detection`, multilingual semantic VAD with Hindi, deep noise suppression, Live-Reference AEC, auto-truncate, interim responses, word timestamps, visemes | [V] Learn | yes (lane B); preview flags noted per feature |
| **Next-Turn** (Interspeech 2026) | trains endpointing on *time-to-next-speech-onset*, +25.9 pts absolute endpoint accuracy within 320 ms; gains grow with longer pauses | [V] abstract | method (label-free targets from our own timestamps) |
| **SpeculativeETD** (ACL 2026) | small on-device GRU flags silence, server wav2vec decides turn vs pause | [V] abstract | architecture pattern = our local VAD + server decide |
| **ConvFill** (Srinivas et al. 2025-26) | small "talker" speaks a grounded first part at once while a big reasoner streams knowledge in; users rated it on par with frontier (n=18) | [V] abstract | pattern only; we do the grounded part in code (S3) |
| **Duolingo Video Call (Lily)** | character-led spoken practice at scale; 2025 added **push-to-talk "so Lily stops interrupting mid-sentence"**, captions for beginners, post-call feedback | [V] blog | confirms Taxila's tap-by-default; reject the XP-for-longer-answers mechanic |
| **Ello** | read-aloud coach for K-3: never says "wrong", asks the child to revisit a misread word, phonics prompts when stuck, word highlighting while listening | [S] Common Sense, reviews | pattern; reading engine already specced (`language-sst-engines.md`) |
| **Khan Academy Kids** | every text element tappable to hear; a narrator character in the corner reinforces instructions with gesture | [S] KA blog | already adopted (PD-G10); the gesture point feeds S4 |
| **Seesaw** | families see only teacher-approved work; approved items become immutable | [S] Seesaw help | Taxila's claim gate is the analogue; S10 adds the child's own artefact |
| **Brightwheel** | logs as the day happens, push on update; vendor says it cuts inbound parent calls | [S] vendor | partial: Taxila stays end-of-day (reports-end-of-day-jobs), see §3 |
| **ClassDojo** | auto-translation of teacher messages to 35+ languages | [S] (in parent-experience.md) | already covered |

**Children's ASR, 2025-2026 additions** (beyond asr-kids-hinglish §1):
- Canary and Parakeet beat Whisper zero-shot on MyST/OGI child speech (MyST test 9.2 / 8.5 WER) with less
  training data, "suggesting data quality is important" (Fan et al., arXiv 2406.10507) [S]. Neither has Hindi;
  this is a pointer that curated data beats scale, not a model option.
- Lathouwers et al. (arXiv 2605.28833, Apr 2026): fine-tuned Whisper-medium 5.54% WER on JASMIN children vs
  70.37% on noisy DART; comparing ASR output with the *prompt* auto-selected 42.0% / 18.1% of utterances as
  correctly read with **≥ 98.3% precision**, so only the rest need human transcription [V].
- ChildVox (arXiv 2605.29257, May 2026): 20+ subtasks over 17 child datasets for SSL, ASR and audio-LLMs [V
  abstract]; an evaluation reference, licence not checked [U].
- Azure Speech **semantic segmentation** (`Speech_SegmentationStrategy=Semantic`, SDK ≥ 1.41) is for
  continuous dictation/captioning and "shouldn't be used in single recognition mode or interactive
  scenarios"; it has no confidence scores [S, MS Q&A + docs snippet]. Do not use it as an endpoint for the
  fallback lane R4.

---

## 2. STEAL LIST

Each item: mechanism → how it lands in Taxila (files) → expected impact → how to measure → licence/compliance.

### S1. Predictive end-of-turn: "commit early, decide late" (highest impact)
- **Mechanism.** Replace "900 ms of silence = turn over" with a two-stage decision. Stage 1: a short candidate
  silence (start at 400-500 ms) proposes an endpoint. Stage 2: an audio turn model scores the last ≤ 8 s of the
  child's audio for P(finished), and the Director's think-time window (item type, child profile) sets the
  threshold. Respond on high P; on low P keep listening and **merge** the next fragment into the same turn.
- **In Taxila.**
  - `src/lesson/vad.ts` already gives on-device onset/offset. Add `src/lesson/turnModel.ts` running Smart Turn
    v3.2 int8 ONNX through onnxruntime-web on the mic ring buffer (16 kHz resample of the existing tap). It does
    not touch `liveCall`-style audio imports; keep it a pure scorer with a Node test like `EnergyVad`.
  - `server/voice/stt.js`: the transcription session keeps server VAD for *transcripts*, but the client owns the
    commit on answer-bearing floor states (VOICE-TEACHER §9.4 already anticipates "turn detection off with a
    client VAD on answer states"). `cascadeLink.ts` holds the transcript until the turn decision, and
    `floor.ts` gets a `holding` sub-state (still visibly LISTENING).
  - The Director's window becomes a *threshold schedule* rather than a timer: high threshold for "explain why",
    low for yes/no and single numbers; per-child priors from `voice-features-longitudinal` onset/pause stats.
  - Speculative replies (`cascade-speculative-reply`) can start at the stage-1 candidate, so the saved wait is
    not eaten by classify latency.
- **Expected impact.** Median child-last-word → first-sound drops by roughly the silence saved on complete answers
  (900 → ~450 ms, ≈ 0.4-0.5 s of the measured 2.1-2.4 s) [I], while mid-thought cuts should fall, not rise, if
  the child result (bAcc ~94 vs silence AUC 0.62) transfers to Hindi/Hinglish [U].
- **Measure.** (a) Offline first, on E1 recordings: label every ≥ 250 ms silence SHIFT/HOLD from the transcript
  and what followed (the IWSDS protocol: silence ≥ 250 ms preceded by ≥ 1 s speech), report AUC for silence vs
  Smart Turn vs Smart Turn + Director threshold, per band and per item type. (b) Live: cut-off rate (child speech
  resumes within 2 s of a teacher onset, plus "she cuts me off" reports) and gap p50/p90 by preceding act.
  Gate: cut-offs not worse than 900 ms arm, p50 gap at least 300 ms better.
- **Licence.** Smart Turn BSD-2 weights; Whisper-Tiny base MIT; training data CC BY 4.0 (attribution). Runs on
  the child's device: no paid AI call, so the Azure-only directive is untouched. Download 8 MB once (fits the
  low-end data budget only if cached with the pack; check `low-end-data-budget.py`). If run server-side instead,
  it is self-hosted open weights on ACA, which needs the same owner decision as IndicConformer (asr-kids O4).

### S2. Train the turn model on our own children, label-free (Next-Turn targets)
- **Mechanism.** Fine-tune the S1 model on consented E1/E1+ audio using *time-to-next-speech-onset* targets
  derived from timestamps alone (Next-Turn: +25.9 pts within 320 ms, gains grow with pause length) [V].
- **In Taxila.** `evals/turn/` harness: extract (audio window, gap, next speaker) from stored E1 sessions; train
  head-only (keep the encoder frozen) on an Azure ML or ACA GPU job; export ONNX; ship behind a flag.
- **Impact.** Closes the gap between adult-trained turn data and Indian children's longer, variable pauses [I].
- **Measure.** Same AUC table as S1 on held-out children (split by child, never by utterance).
- **Compliance.** Uses child audio for model training: needs the E1 consent clause (asr-kids §6.3 already lists
  "use of the audio to adapt Azure Custom Speech"; add "to train the turn-taking model"). Never use HiACC (CC
  BY-NC) or OCSC for the shipped weights.

### S3. Latency masking by her body first, then a code-built uptake echo (never a canned filler)
- **Mechanism.** In the 1-4 s band, the teacher's *face and body* carry the wait (a thinking gesture, a glance at
  the board, a small nod at the child's answer) instead of a dots pictogram near her face (Gonzales 2025: symbol
  pulled gaze off the face, gesture won 87.5%) [V]. If first audio is not ready by ~1.2-1.5 s (satisfaction
  peaked near 1.5 s latency in the VR filler study [S]), she says a **content-bearing uptake fragment built in
  code from the child's own words**: the value or key noun the child just said, in her voice, with identical
  prosody whether it was right or wrong ("साठ..." / "the mitochondria..."), then the Director's reply. This is
  ConvFill's "grounded first part" without a talker model.
- **In Taxila.**
  - `src/avatar` / the teacher rig: a `think` and `consider-answer` clip set driven by `floor.ts` THINKING,
    replacing the dots glyph on the stage (keep the glyph in the status strip for accessibility, away from the
    face).
  - `server/voice/prewarm.js`: on `/turn` arrival, synthesize the uptake fragment from the *transcript* (already
    guarded text; it is the child's words, not new content) while the Director runs; serve it only if the real
    reply's first audio is later than the threshold.
  - Reply composer: the real reply must not then repeat the fragment (strip a leading echo of the same token).
- **Expected impact.** Perceived wait falls without lying about speed; a gap after a correct answer no longer
  reads as "I was wrong" (human-likeness §2.1) [I].
- **Measure.** Child re-speaking during THINKING (a proxy for "she didn't hear me"), panel rating of
  "she was listening" on matched clips with/without, and a verdict-leak check: blind listeners must not guess
  right/wrong from the fragment above chance (pre-register 55% upper bound).
- **Guards.** No random static filler list (Voice Live's default design): a recognisable tic in a child's
  daily teacher is the "sentence-shaped line" failure in audio form. Never a fragment on safety turns. Never on
  the realtime lane (Voice Live interims are not supported for realtime audio models anyway [V]).

### S4. Visual backchannels while the child talks, timed by prosody, never audio
- **Mechanism.** A backchannel-opportunity rule (Park 2017 BOP: prosodic speaker cues) triggers a nod or soft
  eyebrow-raise on the avatar during the child's long turns (explain-why, teach-back, story retell). No
  "hmm"/"haan" audio while the mic is open: it would pollute ASR and trip the echo/backchannel logic in
  `cascadeLink.ts`, and human-likeness Tier 3 #17 already rejects audio backchannels on half-duplex.
- **In Taxila.** `src/lesson/vad.ts` emits a new `bcOpportunity` event (speech ≥ 1.5 s, then a 200-500 ms dip with
  falling energy, max one per 3 s [I thresholds]); `uiBridge.ts` maps it to the avatar's nod channel; reduced
  motion keeps a 1-frame ring pulse instead.
- **Impact.** Longer, higher-energy child explanations (Park: more gaze, more energy) [S], which is more evidence
  per turn for the comprehension engine.
- **Measure.** A/B on explain-why items: words per child turn, share of turns with a because/क्योंकि clause,
  and "she was listening" ratings. Nod timing audit: nods landing mid-word (should be < 10%).
- **Licence.** Our rule, no model. If VAP's backchannel head is wanted later, retrain: its pretrained weights are
  academic-only [V].

### S5. Rate entrainment to the child (pace, not emotion)
- **Mechanism.** Nudge her speaking pace toward the child's measured articulation rate within a band (e.g.
  ±10% around the character's base pace), updated between sessions, never mid-sentence (Kory-Westlund 2019,
  n=86: entrainment + backstory raised target-word use and positive affect) [V].
- **In Taxila.** `server/voice/features.js` already stores per-child speaking-rate z-scores
  (`voice-features-longitudinal`). `styleForChild()` in `server/voice/speech.js` turns that into a pace value.
  Because DragonHD ignores `<prosody>` (§0.2), the knob is `<break>` density at clause boundaries for DragonHD,
  `voice.rate` on Voice Live (probe it on HD), or `speed` on gpt-4o-mini-tts.
- **Impact.** A slow Class 2 reader gets a slower teacher automatically; fast Class 8 talkers are not lectured at
  a crawl [I].
- **Measure.** Within-child A/B weeks: comprehension-probe pass rate on teacher explanations, "phir se" (replay)
  rate, panel naturalness of the adjusted clips (no robotic gaps from breaks).
- **Compliance.** Rate and pause are not emotional-state inference; it stays inside the Microsoft Code of
  Conduct line (`ct-no-voice-emotion-inference`). Pitch entrainment is excluded (no SSML pitch on DragonHD; and
  child-pitch matching risks a "childish" voice).

### S6. Fix the TTS recipe before it ships (correction, cheap)
- **Mechanism.** Remove `<prosody rate>` from the DragonHD SSML template in VOICE-CHOICE §3; pace by voice choice
  plus `<break>`; keep `<lang xml:lang="hi-IN">` runs, `<say-as>`, alias lexicon for NCERT terms; test
  `enhancePronunciation=true` (DragonHD parameter for proper nouns/acronyms/ambiguous words) [V] on the
  spoken-notation probe set; `temperature` 0.6-0.8 per character for take-to-take stability [V].
- **In Taxila.** The SSML builder that `voice-choice-v2` will add to `server/voice/speech.js`; extend
  `notation-probe` and `voices-hindi` probes with (a) a rate-honoured check (chars/s at rate 0.75 vs 1.0, n ≥ 5
  sentences), (b) `enhancePronunciation` on/off WER on the NCERT term set.
- **Impact.** Avoids shipping a pace control that does nothing; may fix term mispronunciations without a
  lexicon entry per word.
- **Measure.** chars/s delta (expect ~0 if ignored), term WER via both ASR passes, panel natural score.
- **Compliance.** GA voices only for minors (`voice-ga-only-for-minors`); `enhancePronunciation` is a parameter on
  a GA voice, but check it is not marked preview for en-IN [U].

### S7. Echo that survives pause-and-resume: Live-Reference AEC on lane B; measure on the cascade
- **Mechanism.** On Voice Live, send stereo PCM16 (mic + the exact samples played) with
  `reference_source: "client", channels: 2` (API ≥ 2026-07-15) so AEC follows the real playback path, including
  ducking, pause/resume and resampling [V]. Add `remove_filler_words` only if the session language is English
  (its list is English-only [V]); Taxila's own Hindi backchannel list in `cascadeLink.ts` stays for Hindi.
- **In Taxila.** Lane B client (`src/lesson/realtime.ts` / the Voice Live link): an AudioWorklet that interleaves
  the mic with a tap of `PcmStreamPlayer` output. For the cascade lane (mic → Azure transcription WebRTC), the
  open question is whether Chrome/WebView AEC references WebAudio playback; the barge counters
  (`bargeStats`) already exist to answer it on devices.
- **Impact.** Fewer false barge-ins on phone loudspeakers, the main Indian setup; makes open-mic viable on more
  devices (today it needs a headset label, `ui-child-voice-on-cascade`) [I].
- **Measure.** `bargeStats.resumedEcho` and unconfirmed local pauses per 100 teacher turns, speaker vs headset,
  default vs Live-Reference arms, on 3 low-end Android phones.
- **Compliance.** Azure first-party feature; no new data stored.

### S8. Lane B end-of-turn: test Azure's audio EOU before building our own there
- **Mechanism.** On Voice Live, `turn_detection: { type: "azure_semantic_vad_multilingual", languages:
  ["hi","en"], end_of_utterance_detection: { model: "smart_end_of_turn_detection", threshold_level: "low",
  timeout_ms: <band window> } }`, with `create_response: false` on answer states (floor states unchanged).
- **In Taxila.** `server/voice/stt.js`-equivalent session builder for lane B; floor-state mapping per
  `voice-floor-states-hybrid`.
- **Impact.** If it handles Hindi children, the premium lane gets predictive turn-taking with no client model.
- **Measure.** Same SHIFT/HOLD protocol as S1 on the same E1 clips replayed through the session.
- **Compliance.** `smart_end_of_turn_detection` appears in a **preview** API version [V]. The GA-only rule is
  written for voices; whether a preview turn detector may run for minors is an owner decision (flag, don't
  assume).

### S9. Scale child ASR ground truth with prompt-match auto-labelling
- **Mechanism.** For read-aloud and fixed-answer items, accept a transcript automatically when lane L and lane G
  both match the prompt/answer exactly (Lathouwers 2026: 18-42% of utterances auto-selected at ≥ 98.3%
  precision) [V]; humans label only the rest.
- **In Taxila.** E1 pipeline (`asr-kids-hinglish.md` §6.5 ground truth): add an `auto_accept` tier with a 5%
  human audit; feed the same rows to Azure Custom Speech hi-IN adaptation (already planned) and to S2.
- **Impact.** Cuts E1 transcription cost and makes continuous post-launch ground truth affordable [I].
- **Measure.** Audit precision of the auto tier (gate ≥ 98%); share of utterances auto-accepted by band.
- **Compliance.** Same consent as E1; auto-accepted *correct* reads bias the set toward easy speech, so WER is
  always reported on the full stratified sample, never on the auto tier.

### S10. Parent trust: the child's own explanation, approved and consented (Seesaw's best idea)
- **Mechanism.** Seesaw shows families only teacher-approved work, frozen once approved [S]. Taxila's analogue
  of the most trusted artefact is not a score but **the child explaining something in their own words**. Offer,
  under a separate opt-in, one short teach-back clip per week (or its transcript when audio is not consented)
  attached to the claim it supports.
- **In Taxila.** `server/routes/parent.js` weekly payload gets an optional `childVoice` evidence item tied to a
  claim that already passed the claim gate (`b3-parent-claim-gate`); the client plays it in the evidence drawer.
- **Impact.** Converts "trust the AI's report" into "hear your child" [I]; plausible lever on the parent
  retention problem parent-experience.md names.
- **Measure.** M6 parent testing: trust and comprehension of the report with vs without the clip; opt-in rate.
- **Compliance.** Today no raw child audio is stored (`voice-features-longitudinal`). This needs an owner
  decision, a distinct consent, short retention, and the child's own assent shown in the child UI ("your
  grown-up will hear this"). Transcript-only is the default fallback.

---

## 3. Anti-patterns others learned the hard way

1. **A fixed silence timeout as the turn model for children.** Silence AUC 0.62 in child-adult talk [V]; Taxila's
   own 600 ms vs 900 ms trade-off (n=1) is the same trap. Tune a predictive model, not the timeout.
2. **Text-only end-of-turn on top of an ASR that arrives late.** Text raised false alarms in the 2026 ablation [V];
   live-transcribe finals arrive ~0.55 s after commit [M]. Use text cues only as a veto (a dangling
   "क्योंकि"/"and"), never as the trigger.
3. **Training or tuning turn-taking on synthetic speech.** Smart Turn's jump from v3.0 to v3.1 came from adding
   human recordings; Daily says synthetic data "lacks the natural variability and subtle cues" [V]. Taxila's E0
   is TTS: never set endpoint thresholds from it.
4. **Letting the agent take the floor while a learner is mid-sentence.** Duolingo shipped push-to-talk in 2025
   because Lily interrupted [V]. Taxila's tap-by-default is right; hands-free must earn its way back with S1/S7
   numbers.
5. **Rewarding longer spoken answers with points.** Duolingo gave Calls an XP goal "hit faster with longer
   responses" [V]. That teaches talking, not explaining, and is banned by Taxila's no-reward-economy rules.
6. **Random static fillers and a 2-second latency threshold.** Voice Live's defaults (2000 ms, random pick from a
   list such as "Let me look that up for you") [V] are built for call centres. Silence is noticed earlier and a
   repeated phrase becomes a tic. See S3.
7. **Progress symbols beside the face.** They divert gaze and do not improve perceived wait [V].
8. **Waiting for full duplex.** 2026's open duplex models are English(/French) and still backchannel rarely [S];
   GPT-Live has no authoritative turn event and immutable instructions [V], which collides with a Director that
   re-plans every turn.
9. **Server echo cancellation with buffered or paused playback.** Microsoft documents degradation beyond 2 s of
   playback delay [V]; pause-then-decide creates exactly that.
10. **Copying verdict sounds.** Duolingo's major-third "correct" and tritone "fail" sounds [S] are the operant cue
    Taxila bans (PRODUCT-DESIGN §4.5). Fresh support for minimal sound: in an eye-tracked RCT (n=57, ages 4-5,
    Singapore) nonverbal sound effects and music did not direct attention to target words; language
    proficiency did (Sun et al., LLT Oct 2025) [V].
11. **Semantic segmentation as an interactive endpoint.** Microsoft says it is for dictation/captioning only and
    returns no confidence [S]; lane G grading needs confidence.
12. **Reading SSML support off the feature page.** The HD page omits the en-IN DragonHD voices that the API lists
    as GA, and marks `<prosody>` unsupported [V]. Probe each element per voice and log it.
13. **Shipping an open model whose weights are "open" but not commercial.** VAP-Realtime pretrained models are
    academic-only; LiveKit's turn detector has its own model licence; HiACC and many child corpora are NC [V].

---

## 4. Proposed context entries (for the main loop; also in `context/inbox/world-best-voice-ux.json`)

- **open `open-predictive-turn-model`**: S1+S2, with the E1 SHIFT/HOLD AUC table as the deciding measurement;
  constrains `voice-turn-config`.
- **correction to `voice-choice-v2`**: DragonHD ignores/does not support `<prosody>`; pace by voice, `<break>`,
  Voice Live `rate` (probe) or gpt-4o-mini-tts `speed` (S6).
- **open `open-voicelive-word-timestamps`**: probe `output_audio_timestamp_types:["word"]` with an en-IN DragonHD
  voice on lane B; would reopen `karaoke-from-transcript-estimate` for lane B only.
- **open `open-live-reference-aec`**: S7 on lane B; constrains `cascade-barge-pause-decide` on Voice Live.
- **rejection `rj-symbolic-wait-indicator`** (literature): dots/progress near the face (S3, Gonzales 2025).
- **rejection `rj-static-filler-list`** (literature + vendor default): random canned fillers at 2 s.

## 5. Open questions

1. Does Smart Turn's Hindi accuracy (adult, mostly read/prompted speech) transfer to Hinglish children 6-14? Only
   E1 can say. If not, S2 is required, not optional.
2. On-device inference cost on a Rs 8-10k Android WebView: Whisper-Tiny encoder over 8 s of audio in WASM is
   unmeasured here [U]; budget 150 ms p90 or move to ACA CPU.
3. Is `smart_end_of_turn_detection` multilingual? The API reference does not list its languages [V: absent].
4. Does Voice Live `voice.rate` apply to DragonHD voices?
5. Owner: is a preview *capability* (not a voice) acceptable for minors (S8)? Is a consented child-voice clip for
   parents acceptable (S10)?

---

## 6. Sources

**Turn-taking and endpointing**
- Brahimi, Blanc & Fourtassi, *Predicting Turn-Taking in Child-Adult Conversations Using Voice Activity Projection*, IWSDS 2026: https://aclanthology.org/2026.iwsds-1.34.pdf [V]
- Inoue et al., *Multilingual Turn-taking Prediction Using VAP*, LREC-COLING 2024: https://arxiv.org/abs/2403.06487 [S]; *Real-time and Continuous Turn-taking Prediction Using VAP*: https://arxiv.org/abs/2401.04868 [S]
- VAP-Realtime (MIT code, academic-only models, backchannel head): https://github.com/inokoj/VAP-Realtime [V]
- Sharon, A, Hacioglu, Stolcke, *Less can be More: What Aspects of Speech Drive End-of-Turn Detection*, 2026: https://arxiv.org/abs/2609.11066 [V]
- Tsoi et al., *Next-Turn: Duration-Aware Streaming Endpoint Detection*, Interspeech 2026: https://arxiv.org/abs/2606.18094 [V]
- Ok, Yoo, Lee, *Speculative End-Turn Detector*, ACL 2026: https://arxiv.org/abs/2503.23439 [V]
- Pipecat Smart Turn: https://github.com/pipecat-ai/smart-turn [V]; https://huggingface.co/pipecat-ai/smart-turn-v3 [V]; data licence https://huggingface.co/datasets/pipecat-ai/smart-turn-data-v3.2-train [V]; v3 per-language table https://www.daily.co/blog/announcing-smart-turn-v3-with-cpu-inference-in-just-12ms/ [V]; v3.1 human data https://www.daily.co/blog/improved-accuracy-in-smart-turn-v3-1/ [V]
- LiveKit turn detector (model licence, text-only, Hindi TPR/TNR): https://huggingface.co/livekit/turn-detector [V]

**Azure**
- Voice Live how-to (turn detection, multilingual semantic VAD languages, remove_filler_words, Live-Reference AEC, auto_truncate, MAI-Transcribe, rate, word timestamps, visemes, azure-realtime voices): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to [V]
- Voice Live API reference 2026-06-01-preview (`end_of_utterance_detection`, `smart_end_of_turn_detection`): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-api-reference-2026-06-01-preview [V]
- Interim responses: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-voice-live-interim-response [V]
- HD voices (SSML support table, word boundary on Omni, enhancePronunciation, temperature): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices [V]
- GPT-Live how-to: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/gpt-live [V]
- Semantic segmentation limits: https://learn.microsoft.com/en-us/answers/questions/4371468/azure-speech-sdk-formal-list-of-languages-locales [S]; https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-recognize-speech [S]
- Browser AEC scope (echoCancellation mode proposal; render-process-wide, not system-wide): https://tag-github-bot.w3.org/gh/w3ctag/design-reviews-private-brainstorming/163 [S]

**Full duplex**
- PersonaPlex-7B-v1: https://huggingface.co/nvidia/personaplex-7b-v1 [S]; Moshi licence/languages: https://github.com/kyutai-labs/moshi [S]
- Full-Duplex-Bench: https://arxiv.org/abs/2503.04721 [S]; survey https://arxiv.org/abs/2606.19453 [S]

**Latency masking and backchannels**
- Gonzales, Kalamkar, Jörg, Grubert, *Behavioral and Symbolic Fillers as Delay Mitigation for ECAs in VR*, 2025: https://arxiv.org/abs/2508.11781 [V]
- *Please Let Me Think* (fillers, perceived wait; satisfaction peak ~1.5 s): https://dl.acm.org/doi/10.1145/3716553.3750792 [S]
- Kum & Lee, *Can Gestural Filler Reduce User-Perceived Latency?*, Applied Sciences 2022: https://www.mdpi.com/2076-3417/12/21/10972 [S, 403]
- Srinivas et al., *Thinking While Speaking (ConvFill)*: https://arxiv.org/abs/2511.07397 [V]
- Park et al., *Telling Stories to Robots: The Effect of Backchanneling on a Child's Storytelling*, HRI 2017: https://www.media.mit.edu/publications/telling-stories-to-robots-the-effect-of-backchanneling-on-a-child-s-storytelling/ [S]
- Kory-Westlund & Breazeal, *Exploring the Effects of a Social Robot's Speech Entrainment and Backstory…*, Frontiers 2019: https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2019.00054/full [V]

**Children's ASR**
- Fan et al., *Benchmarking Children's ASR with Supervised and Self-supervised Speech Foundation Models*: https://arxiv.org/abs/2406.10507 [S]
- Lathouwers, Gao, Cucchiarini, Strik, *Transcribing Children's Speech…*, 2026: https://arxiv.org/abs/2605.28833 [V]
- Feng et al., *ChildVox*, 2026: https://arxiv.org/abs/2605.29257 [V abstract]

**Sound and child products**
- Sun, Roberts, Tan, Loh, Moh, *Language proficiency over nonverbal sound effects in children's eBook incidental word learning*, LLT 29(3) 2025: https://doi.org/10.64152/10125/73649 [V]
- Duolingo Video Call: https://blog.duolingo.com/video-call [V]; 2025 highlights (push-to-talk, captions, XP): https://blog.duolingo.com/product-highlights/ [V]
- Duolingo sound (major third / tritone): https://www.losdoggies.com/archives/8842 [S]
- Ello (never says wrong; revisit misread words): https://www.commonsensemedia.org/ai-ratings/ello [S, 403]
- Khan Academy Kids (tap-to-hear, Kodi narrator gestures): https://blog.khanacademy.org/supporting-english-language-acquisition-with-khan-academy-kids/ [S]

**Parent trust**
- Seesaw family visibility of approved work: https://help.seesaw.me/hc/en-us/articles/203729445-Navigating-Seesaw-as-a-family-member [S]
- Brightwheel daily reports: https://mybrightwheel.com/childcare-centers/preschool-daily-report/ [S, vendor]
