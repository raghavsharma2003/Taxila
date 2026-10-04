# VOICE v3 SCREEN: machine listen-proxy over every round-2 render, and the 6 arms for the blind page (2026-10-04)

Input: the 440 clips in `renders/` (135 hosted + 300 open-weight, see `renders/manifest*.json`) plus the 5 round-1
DragonHD Diya plain clips (`docs/design/superhuman/voice-probe/wav/dhd-diya__L*__plain.wav`, the anchor).
Bar: the raters' failure list in `BLIND-RESULTS-2026-10-04.md` (reading not talking; English-accented Hindi and an
accent switch on English words; timbre change mid-line; wrong numbers and words; pauses on random words; punctuation
read aloud; too slow or rushed).
Code and data: `screen/` (`collect.py`, `align.py`, `judge.mjs`, `score.py`, `rank.py`; per-clip `clips.json`,
per-arm `arms.json`, raw STT in `raw/`, alignments in `align/`, judge output `judge.json`).

**What this file is not.** Nobody has listened to these clips. Every number below is a machine proxy. In round 1, the
best proxy family (the AI judge) missed hums and silences. This screen only throws out arms with measurable defects
and orders the rest. **Which voice sounds like a person is decided by Raghav and Gaurav on the blind page.**

---

## 0. Bottom line

**The 6 arms for the blind page** (2 open-weight, 2 male options, Azure first, the round-1 anchor kept):

| # | arm (cond on the page) | voice | platform, status | why it is in | main risk |
|---|---|---|---|---|---|
| 1 | **r1 DragonHD Diya, plain** (anchor) | `hi-IN` Diya DragonHD (round-1 V2) | Azure Speech, GA | The fixed reference. Raters already heard it, and every new arm has to beat it. Clean on every proxy (0 words missed, 18/18 numbers, no mid-phrase pauses). | Raters said it reads rather than talks. Its job is to be the bar, not the pick. |
| 2 | **Veena kavya, plain** | `maya-research/Veena` / kavya (F) | open weights, Apache-2.0 @ 8b770f9e, self-host | Best open arm on accuracy: WER 0.007, 54/54 numbers. Top-3 on the native-accent proxies (CTC CER 0.07, GOP-English -0.94). The only open model trained on Hindi, English and code-mixed speech from studio artists. | No style control. RTF 2.6 on an L4, so it needs an L40S-class GPU or a serving engine. A stock artist voice needs Maya's written consent letter. |
| 3 | **Chatterbox-hi design-M, plain** | `ResembleAI/Chatterbox-Multilingual-hi`, cloning a VoxCPM2-designed synthetic male | open weights, MIT @ 82ca7127, self-host | Male option. #2 overall on the composite. 0 mid-phrase pauses in 15 takes. The most stable timbre between English and Hindi words of the open males (x-vector 0.88, F0 gap 1.9 st). | No streaming: TTFB is the whole clip (4.4 s). The same designed voice exists on VoxCPM2, which streams (TTFB 0.12 s) but runs fast (5.8 syl/s). |
| 4 | **OmniIndic Hazelmori, plain + expressive** | `hi-in-hazelmori:DragonHDOmniIndicNeural` (F) | Azure Speech centralindia, **Preview** | The best Azure Indic-Omni arm. Omni was the only Azure family whose expressive take beat its plain take for the humans (7-0). Clean numbers (18/18) and a far better English-word accent proxy than OmniIndic Diya (GOP-English -1.12 vs -2.95). | Preview: a "switch on GA" target for minors. Its expressive take places 2 mid-phrase pauses of 0.3 s or more (after "बटा" and "ऊपर"). That is the raters' "random pause" failure, so their ears should check it. |
| 5 | **Nova 2 Sonic kiara, plain + expressive** | `amazon.nova-2-sonic-v1:0` / kiara (F) | AWS Bedrock us-east-1, GA, Activate credit | The cleanest hosted speech-to-speech arm. 0 word errors on both takes, 18/18 numbers, and the best English-word accent proxy of any arm (GOP-English -0.39/-0.45). Speech-to-speech prose direction won 8-1 for gpt-realtime in round 1, and this is the only GA speech-to-speech Indian voice we may use. | us-east-1 only (no Mumbai). Its self-transcript cannot be trusted (it lied on arjun L5). About $1.08/h output price comes from a secondary source. |
| 6 | **Omni Arjun, plain** | `en-IN-Arjun:DragonHDOmniLatestNeural` (M) | Azure Speech centralindia, **unlisted** | Azure male option. WER 0.000 and 18/18 numbers. The best Hindi-native proxy of any male Azure arm (CTC CER 0.08, GOP-Hindi -0.05). | Unlisted voice: no SLA, could disappear. Its expressive take changes timbre on English words (x-vector 0.67, the worst of the passing arms), so it is **left off**. |

**Reserves**, if an arm can't be served on the page: Veena vinaya (M, open), Svara female (open, emotion tags), VoxCPM2
design-M expressive (open, streaming), Chatterbox design-F (open), the new Dragon hi-IN Diya (Azure Preview).

**Out, with the defect that removed it** (section 3): all three MAI-Voice-2.1 voices (silences up to 15.7 s, 2.0-2.9
syl/s); Nova arjun (says a different L5 sentence; 14-19% of words missed); OmniIndic Diya (both renders drop words on
L1: "पहले tens" on plain, "तो total हुआ बासठ" on expressive; the worst English-word accent proxy of the Azure arms);
Voice Live + OmniIndic Diya (same words dropped, a 1.9 s silence, timbre change 0.49); Polly generative Kajal (English-
accented Hindi, 15-16/18 numbers); Polly neural Kajal (already rejected, `rj-polly-teacher-voice`); Svara male
(0.8-0.9 mid-phrase pauses per clip, which is exactly the "pauses on random words" failure); VoxCPM2 design-F
(0.5-0.7 mid-phrase pauses per clip, 3.7 syl/s slow); both VibeVoice-1.5B voices (words and numbers); VibeVoice-7B male (1.6 s
silence). The three round-1 controls (DragonHD Arjun, Omni Diya V4, realtime marin) score well or badly here, but
both raters already heard and failed them, so re-testing them costs page time and teaches nothing new.

**The one thing to take away about the composite.** The top of the composite is DragonHD Arjun, a voice both raters
rejected in round 1. The proxies measure the *absence of defects* and *native articulation*. A flat, read-aloud voice
scores well on both. **Talking vs reading, warmth and the laugh are not measured by anything here** (the AI judge
fails at them, section 2.5). So the picks above use the composite as a gate and a tiebreak, not as the ranking. Each
pick also brings something round 1 did not test: an open model, an Indic Omni model, a GA S2S voice or a new male.

---

## 1. Method: six screens

All 440 clips were screened. The AI judge ran on take 1 of every cell (240 clips). For open-weight arms, which have
3 takes per cell, the metrics are averaged over takes. **The page uses take 1 unless take 1 fails a gate; then it uses
the first take that passes.** That rule was written down here before any human listens.

| screen | instrument | what it catches from the failure list | known weakness |
|---|---|---|---|
| 1. word accuracy | `taxila-gpt-transcribe` (gpt-transcribe 2026-07-28, eastus2, no prompt, no language hint) **and** Azure Speech short-audio hi-IN (centralindia, chained so long silences don't cut it short). WER on normalised tokens (digits to Hindi words, Devanagari spellings of English words mapped back to Latin, nukta and chandrabindu folded). **A word counts as wrong only if both recognisers miss it.** Numbers are exact-match. | wrong numbers and words, added or repeated words, punctuation read aloud | gpt-transcribe's language model can repair a slip (so both are required). "burp" is mis-spelled by both STTs on almost every arm (बर्ब, बर्फ़), so a burp miss is STT noise, not a voice defect. |
| 2a. accent: Hindi words | LM-free greedy decode + CTC forced alignment with a Hindi-native acoustic model (`Harveenchadha/vakyansh-wav2vec2-hindi-him-4200`, MIT @ e2568c3f). **CTC CER** on the Devanagari words, and **GOP-Hindi** (mean of log p(aligned label) - max log p over the word's frames; 0 = the Hindi model is certain). | English-accented Hindi | Also penalises fast or very expressive delivery, so expressive takes score worse. Not calibrated against humans (see 2.6). |
| 2b. accent: English words | **GOP-English**: the same alignment, with English words given as their Indian Devanagari spelling (total → टोटल, pizza → पिज़्ज़ा). An Indian "total" fits टोटल; an American one does not. | accent switch on English words | Only 1-3 English words per line (L5 has none). |
| 2c. timbre | `microsoft/wavlm-base-plus-sv` x-vectors (@ feb593a6): cosine(English-word audio, Hindi-word audio) in the same clip; cosine(first half, second half); and the mean cosine across the 5 lines of one voice. Praat F0: median on English words vs Hindi words, in semitones. | timbre change mid-line, register jump on English words | English-word audio is only about 0.3-0.8 s, so the cosine is noisy. Use it as a relative flag (below about 0.7 is suspicious), not an absolute score. |
| 3. pauses | Energy VAD (20 ms frames, speech = within 35 dB of the clip's 95th percentile), pauses of 180 ms or more inside the speech, each placed on a word boundary by the forced alignment. **A mid-phrase pause** is one after a word with no punctuation. Also the longest internal silence. | pauses on random words as fake emphasis; dead air | A stop closure plus an emphatic beat can look like a short pause. 300 ms or more is the stricter count (`pause_mid_long`). |
| 4. rate | Syllables (Hindi schwa-deletion rule, fixed counts for English words) / speech span. The teacher band is **3.8-5.6 syl/s**, a gate; the composite prefers ~4.7 **[E]**. | too slow / rushed | The band is our estimate. Round-1 "too slow / rushed" remarks were not tied to clips, so the band cannot be fitted to them. |
| 5. AI judge | `judge.mjs`: gpt-realtime-2.1 (`taxila-realtime`) and gpt-realtime-2.1-mini, audio in, JSON out. Each clip is scored 1-5 on talking vs reading, warmth, accent and humanlike, plus the failure flags. Audio is normalised to -24 LUFS before judging. | talking vs reading, warmth (in principle) | **Did not work** (section 2.5). Weighted 0.10 and treated as noise. |
| 6. platform | manifests + SCAN.md: licence @ commit, status, region, TTFB as measured during rendering, billing source | | TTFB was measured from a US sandbox or a US GPU, not India. |

**Composite** (`rank.py`): gates first: words missed by both STTs ≤ 3%; no number missed by both or inserted; max
internal silence ≤ 1.5 s; fewer than 5 mid-phrase pauses of 300 ms or more per arm; rate 3.8-5.6 syl/s. Then a clipped z-score sum:
words 0.15, numbers 0.05, CTC CER 0.15, GOP-Hindi 0.10, GOP-English 0.10, mid-phrase pauses 0.10, max pause 0.05,
|rate - 4.7| 0.10, x-vector EN↔HI 0.05, x-vector halves 0.05, judge 0.10. The weights are a judgement call and are
written in `rank.py` so they can be argued with.

## 2. Results

### 2.1 Every arm × condition, ranked by the composite

WER is gpt-transcribe. "Words missed" counts a word only if both STTs missed it, and includes the STT-noise "burp". Numbers are exact
matches over all takes. GOP: closer to 0 = more native to a Hindi acoustic model. x-vec EN-HI: same-speaker
similarity of the English words vs the Hindi words. Judge: the mean of talking + humanlike over both judge models (1-5).
TTFB: median from rendering (Azure/Polly/Nova: US sandbox to first audio byte; open: on-GPU L4, first audio; Chatterbox: the full clip).

| # | arm | cond | gates failed | WER | words missed (both STT) | numbers | rate syl/s | max pause s | mid-phrase pauses/clip | CTC CER (Hindi words) | GOP Hindi | GOP English | x-vec EN-HI | F0 EN-HI st | judge | composite | TTFB ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ctrl-dhd-arjun-m | plai | pass | 0.011 | 0.009 | 18/18 | 5.23 | 0.66 | 0.20 | 0.04 | -0.03 | -0.48 | 0.86 | 3.1 | 3.20 | +0.72 | 1082 |
| 2 | **oss-chatterbox-hi-vox-design-m** | plai | pass | 0.017 | 0.009 | 53/54 | 5.48 | 0.60 | 0.00 | 0.09 | -0.12 | -0.99 | 0.88 | 1.9 | 3.30 | +0.61 | 4378 |
| 3 | oss-chatterbox-hi-vox-design-f | plai | pass | 0.032 | 0.012 | 54/54 | 4.55 | 0.60 | 0.20 | 0.12 | -0.07 | -0.75 | 0.84 | 2.6 | 3.30 | +0.60 | 5341 |
| 4 | az-dragon-diya-hi | plai | pass | 0.015 | 0.009 | 18/18 | 4.93 | 0.44 | 0.00 | 0.06 | -0.11 | -1.17 | 0.88 | 2.1 | 3.05 | +0.56 | 651 |
| 5 | aws-polly-neural-kajal-hi | plai | pass | 0.079 | 0.017 | 18/18 | 4.63 | 0.60 | 0.00 | 0.21 | -0.21 | -1.13 | 0.94 | 3.3 | 3.00 | +0.54 | 298 |
| 6 | **oss-veena-kavya** | plai | pass | 0.007 | 0.006 | 54/54 | 5.20 | 0.68 | 0.07 | 0.07 | -0.09 | -0.94 | 0.84 | 2.5 | 3.00 | +0.54 | 873 |
| 7 | oss-chatterbox-hi-vox-design-m | expr | rate | 0.007 | 0.006 | 54/54 | 5.63 | 0.48 | 0.00 | 0.05 | -0.08 | -0.90 | 0.82 | 2.2 | 3.20 | +0.54 | 4378 |
| 8 | oss-voxcpm2-design-m | plai | rate | 0.004 | 0.003 | 54/54 | 5.78 | 0.70 | 0.00 | 0.02 | -0.04 | -0.87 | 0.80 | 2.4 | 3.10 | +0.53 | 119 |
| 9 | oss-veena-maitri | plai | pass | 0.025 | 0.009 | 54/54 | 4.78 | 0.52 | 0.07 | 0.10 | -0.10 | -0.77 | 0.81 | 3.3 | 2.96 | +0.50 | 881 |
| 10 | oss-chatterbox-hi-vox-design-f | expr | pass | 0.021 | 0.012 | 54/54 | 4.58 | 1.20 | 0.07 | 0.21 | -0.22 | -0.74 | 0.84 | 2.5 | 3.20 | +0.49 | 5341 |
| 11 | oss-veena-vinaya | plai | pass | 0.018 | 0.009 | 54/54 | 5.06 | 0.62 | 0.13 | 0.12 | -0.12 | -1.11 | 0.84 | 2.3 | 3.10 | +0.46 | 877 |
| 12 | **az-omni-arjun-m** | plai | pass | 0.000 | 0.000 | 18/18 | 4.43 | 0.66 | 0.20 | 0.08 | -0.05 | -1.40 | 0.89 | 1.5 | 2.80 | +0.45 | 801 |
| 13 | oss-vibevoice-hindi-7b-vox-design-f | plai | pass | 0.025 | 0.009 | 54/54 | 4.15 | 1.18 | 0.27 | 0.20 | -0.73 | -2.07 | 0.90 | 2.5 | 3.45 | +0.41 | 268 |
| 14 | **aws-nova2sonic-kiara** | expr | pass | 0.000 | 0.000 | 18/18 | 4.62 | 0.96 | 0.20 | 0.17 | -0.28 | -0.39 | 0.89 | 2.8 | 2.70 | +0.39 | 724 |
| 15 | oss-voxcpm2-design-f | plai | mid-phrase pauses, rate | 0.014 | 0.009 | 53/54 | 3.72 | 1.40 | 0.47 | 0.22 | -0.41 | -1.10 | 0.90 | 3.4 | 3.55 | +0.38 | 148 |
| 16 | **aws-nova2sonic-kiara** | plai | pass | 0.011 | 0.009 | 18/18 | 4.51 | 1.14 | 0.00 | 0.16 | -0.16 | -0.45 | 0.84 | 3.0 | 2.75 | +0.38 | 724 |
| 17 | **az-omniindic-hazelmori** | plai | pass | 0.031 | 0.009 | 18/18 | 5.48 | 0.72 | 0.20 | 0.12 | -0.16 | -1.12 | 0.80 | 2.4 | 3.00 | +0.38 | 796 |
| 18 | oss-veena-agastya | plai | pass | 0.019 | 0.017 | 54/54 | 4.79 | 0.56 | 0.33 | 0.09 | -0.14 | -1.52 | 0.82 | 2.4 | 3.00 | +0.36 | 884 |
| 19 | oss-svara-female | plai | pass | 0.026 | 0.020 | 54/54 | 4.62 | 0.52 | 0.47 | 0.05 | -0.05 | -1.91 | 0.81 | 2.3 | 2.95 | +0.35 | 941 |
| 20 | oss-svara-female | expr | pass | 0.029 | 0.017 | 54/54 | 4.75 | 0.78 | 0.40 | 0.15 | -0.21 | -2.34 | 0.86 | 3.3 | 3.20 | +0.34 | 941 |
| 21 | **r1-dhd-diya-plain (anchor)** | plai | pass | 0.000 | 0.000 | 18/18 | 5.30 | 0.58 | 0.00 | 0.15 | -0.11 | -0.81 | 0.84 | 5.1 | 2.85 | +0.32 | - |
| 22 | oss-voxcpm2-design-m | expr | pass | 0.011 | 0.009 | 54/54 | 5.41 | 0.88 | 0.07 | 0.07 | -0.08 | -1.17 | 0.79 | 2.4 | 2.80 | +0.32 | 119 |
| 23 | oss-svara-male | plai | mid-phrase pauses | 0.034 | 0.023 | 54/54 | 4.40 | 0.46 | 0.80 | 0.08 | -0.07 | -1.85 | 0.92 | 2.8 | 2.95 | +0.25 | 941 |
| 24 | ctrl-v4-omni-diya | expr | pass | 0.037 | 0.017 | 18/18 | 4.28 | 1.26 | 0.00 | 0.29 | -0.58 | -3.41 | 0.94 | 3.8 | 3.35 | +0.09 | 807 |
| 25 | aws-polly-gen-kajal-hi | plai | words, numbers | 0.128 | 0.070 | 16/18 | 4.21 | 0.64 | 0.00 | 0.17 | -0.24 | -0.78 | 0.92 | 2.7 | 2.85 | +0.08 | 364 |
| 26 | aws-polly-gen-kajal-en | plai | words, numbers | 0.148 | 0.096 | 15/18 | 4.21 | 0.64 | 0.00 | 0.17 | -0.24 | -0.78 | 0.92 | 2.6 | 3.15 | +0.07 | 375 |
| 27 | oss-vibevoice-hindi-7b-vox-design-m | plai | silence>1.5s | 0.028 | 0.009 | 54/54 | 4.23 | 1.60 | 0.07 | 0.31 | -1.04 | -2.33 | 0.85 | 3.2 | 3.00 | +0.06 | 247 |
| 28 | oss-svara-male | expr | numbers, mid-phrase pauses | 0.032 | 0.026 | 53/54 | 4.31 | 0.72 | 0.87 | 0.09 | -0.08 | -1.50 | 0.84 | 2.6 | 2.90 | +0.04 | 941 |
| 29 | ctrl-v4-omni-diya | plai | pass | 0.031 | 0.009 | 17/18 | 5.20 | 1.06 | 0.00 | 0.29 | -0.56 | -1.87 | **0.68** | 2.0 | 2.90 | -0.07 | 807 |
| 30 | **az-omniindic-hazelmori** | expr | pass | 0.017 | 0.009 | 18/18 | 4.14 | 1.02 | 0.60 | 0.40 | -0.62 | -2.27 | 0.85 | 3.3 | 3.10 | -0.08 | 796 |
| 31 | oss-voxcpm2-design-f | expr | mid-phrase pauses, rate | 0.031 | 0.017 | 53/54 | 3.79 | 1.24 | 0.67 | 0.26 | -0.39 | -1.53 | 0.83 | 2.8 | 2.80 | -0.14 | 148 |
| 32 | ctrl-v6-rt-marin | plai | pass | 0.029 | 0.009 | 18/18 | 3.92 | 0.72 | 0.80 | 0.30 | -0.83 | -1.65 | 0.79 | 2.8 | 3.20 | -0.14 | 1219 |
| 33 | oss-vibevoice-hindi-1.5b-vox-design-m | plai | words, numbers | 0.139 | 0.070 | 52/54 | 4.65 | 1.46 | 0.13 | 0.23 | -0.40 | -1.41 | 0.79 | 2.2 | 2.75 | -0.18 | 107 |
| 34 | az-omniindic-diya | plai | pass | 0.047 | 0.026 | 18/18 | 4.79 | 0.94 | 0.20 | 0.33 | -0.57 | -2.95 | 0.93 | 3.3 | 2.65 | -0.21 | 820 |
| 35 | az-mai21-arjun-m | expr | silence>1.5s, rate | 0.053 | 0.009 | 18/18 | 2.03 | 15.74 | 1.00 | 0.20 | -0.16 | -0.96 | 0.92 | 3.4 | 2.80 | -0.35 | 2661 |
| 36 | az-mai21-arjun-m | plai | silence>1.5s, rate | 0.055 | 0.009 | 18/18 | 2.37 | 10.88 | 0.40 | 0.30 | -0.25 | -1.11 | 0.90 | 1.3 | 2.90 | -0.41 | 2661 |
| 37 | oss-vibevoice-hindi-1.5b-vox-design-f | plai | words, numbers, mid-phrase pauses | 0.059 | 0.035 | 52/54 | 3.88 | 1.30 | 0.73 | 0.34 | -0.82 | -2.10 | 0.87 | 3.1 | 3.05 | -0.41 | 127 |
| 38 | az-omni-arjun-m | expr | pass | 0.000 | 0.000 | 18/18 | 4.42 | 0.92 | 0.40 | 0.41 | -1.20 | -3.32 | **0.67** | 2.7 | 2.70 | -0.46 | 801 |
| 39 | az-voicelive-omniindic-diya | plai | pass | 0.019 | 0.009 | 18/18 | 3.97 | 1.50 | 0.40 | 0.60 | -1.78 | -3.12 | 0.87 | 3.5 | 3.10 | -0.55 | 859 |
| 40 | aws-nova2sonic-arjun-m | plai | words, numbers, silence>1.5s | 0.154 | 0.139 | 16/18 | 4.16 | 1.56 | 0.40 | 0.22 | -1.59 | -0.51 | 0.86 | 5.6 | 2.96 | -0.55 | 657 |
| 41 | az-mai21-kavya | expr | silence>1.5s | 0.024 | 0.009 | 18/18 | 4.18 | 2.88 | 0.60 | 0.41 | -1.81 | -3.41 | 0.94 | 3.1 | 2.60 | -0.60 | 2744 |
| 42 | az-voicelive-omniindic-diya | expr | words, numbers, silence>1.5s | 0.051 | 0.043 | 17/18 | 4.23 | 1.90 | 0.00 | 0.56 | -1.28 | -3.63 | **0.49** | 3.8 | 3.35 | -0.71 | 859 |
| 43 | az-mai21-dhruv-m | expr | silence>1.5s, mid-phrase pauses, rate | 0.007 | 0.000 | 18/18 | 3.43 | 5.06 | 1.80 | 0.59 | -1.34 | -2.01 | 0.84 | 4.5 | 3.20 | -0.73 | 2794 |
| 44 | ctrl-v6-rt-marin | expr | pass | 0.019 | 0.017 | 18/18 | 3.97 | 1.02 | 0.80 | 0.64 | -1.29 | -2.08 | 0.80 | 4.5 | 2.90 | -0.75 | 1219 |
| 45 | aws-nova2sonic-arjun-m | expr | words, numbers, silence>1.5s | 0.204 | 0.191 | 16/18 | 4.29 | 1.70 | 0.40 | 0.36 | -1.77 | -0.45 | 0.91 | 3.3 | 2.65 | -0.76 | 657 |
| 46 | az-omniindic-diya | expr | words, numbers, silence>1.5s | 0.079 | 0.052 | 17/18 | 4.41 | 1.80 | 0.20 | 0.61 | -1.21 | -3.71 | 0.79 | 2.9 | 3.00 | -0.76 | 820 |
| 47 | az-mai21-dhruv-m | plai | silence>1.5s, rate | 0.025 | 0.009 | 18/18 | 2.56 | 4.20 | 1.40 | 0.55 | -1.31 | -2.98 | 0.85 | 5.0 | 2.95 | -1.06 | 2794 |
| 48 | az-mai21-kavya | plai | silence>1.5s, rate | 0.046 | 0.009 | 18/18 | 2.91 | 7.66 | 0.20 | 0.55 | -2.36 | -3.82 | 0.85 | 1.8 | 2.65 | -1.18 | 2744 |

(Judge = mean of talking and humanlike from both judge models. Composite = the `rank.py` score. Bold rows are the picks; a bold x-vector value is below 0.7. `arms.json` has every sub-score and flag count.)

### 2.2 Words and numbers (screen 1)

- **With a strong STT, the "wrong numbers" picture changes.** The renders scan reported बासठ lost on 11/20 Veena takes. That came from
  Azure hi-IN short-audio, which stops at the first long pause. With gpt-transcribe plus chained Azure STT, Veena
  gets **216/216 numbers** across all four voices. Real number errors remain only on Nova arjun, Polly generative,
  VibeVoice-1.5B, OmniIndic Diya expressive, Voice Live expressive, and one take each of Svara male and VoxCPM2-F.
- **OmniIndic Diya drops words.** Plain L1 skips "पहले tens", heard by gpt-transcribe, gpt-4o-transcribe and Azure,
  and forced alignment squeezes both words into 0.2 s with GOP -9.9. Expressive L1 skips "तो total हुआ बासठ". Voice
  Live + OmniIndic Diya drops the same tail. The new OmniIndic model skips words on this line, and the gate set by
  the round-1 "wrong numbers" complaint exists to catch exactly that.
- **Nova arjun** says a different sentence on L5 in both takes (14-19% of words missed), as the renders scan found.
  Kiara has 0 errors.
- **MAI-Voice-2.1 adds words.** On kavya L4 plain both STTs hear an added "चाँद चाँद" after the line. The silences and
  repeats found by the renders scan are confirmed.
- Punctuation read aloud: one possible case in 440 clips. On MAI dhruv L4 plain, Azure STT ends with "डॉट" while
  gpt-transcribe hears "दो...", and the same take inserts "वट-वटाक". That is MAI's round-1 "dot dot" defect again. No
  other clip has a "dot", "comma" or tag word in either transcript, so the normalisation fix (no "...") holds
  everywhere else.

### 2.3 Accent and timbre (screen 2)

- **Hindi-native articulation** (CTC CER on Hindi words / GOP-Hindi). Best: VoxCPM2-M 0.02, DragonHD Arjun 0.04,
  Svara-F 0.05, Dragon hi-IN Diya 0.06, Veena kavya 0.07, Omni Arjun plain 0.08. Worst: Voice Live 0.56-0.60,
  realtime marin expr 0.64, OmniIndic Diya expr 0.61, MAI 0.41-0.59.
- **The English-word accent switch** (GOP-English). This is the proxy that most directly targets the raters' "dual
  accent" remark. The Omni family scores badly on it: V4 Omni Diya expr -3.41, OmniIndic Diya -2.95/-3.71, Omni Arjun
  expr -3.32, MAI kavya -3.4/-3.8. The voices built for Indian English do well: Nova kiara -0.39/-0.45, DragonHD
  Arjun -0.48, Chatterbox-F -0.75, Veena maitri -0.77, the r1 DragonHD Diya anchor -0.81. **This matches round 1**: the
  raters said the Omni and realtime voices "keep the accent problem", and those are the arms this proxy marks worst.
  Polly generative Kajal is the counter-example. Its STT transcripts show English-accented Hindi (पर्चास, फियर), yet its
  GOP-Hindi (-0.24) is unremarkable. So the proxy catches the English-word switch better than a foreign accent on Hindi words.
- **Timbre.** Arms with a likely timbre change on English words (x-vector EN↔HI below 0.7): Voice Live expressive 0.49,
  Omni Arjun expressive 0.67, V4 Omni Diya plain 0.68. Every pick sits at 0.80 or above. Within-line drift (first
  half vs second half) stays between 0.91 and 0.97 for all arms, so nothing looks spliced. Cross-line consistency per voice
  is 0.93-0.98. The lowest is Veena agastya at 0.93, where one voice sounds slightly different line to line.

### 2.4 Pauses and rate (screens 3-4)

- **Dead air:** MAI 2.9-15.7 s; Nova arjun 1.6-1.7 s; Voice Live 1.5-1.9 s; OmniIndic Diya expressive 1.8 s; VibeVoice-7B M 1.6 s.
- **Pauses on random words** (the raters' fake-emphasis failure). The worst arms are MAI dhruv (1.4-1.8 per clip),
  Svara male (0.8-0.9), realtime marin (0.8), VibeVoice-1.5B F (0.7), VoxCPM2-F (0.5-0.7) and OmniIndic Hazelmori
  expressive (0.6, e.g. after "बटा", "ऊपर" and "में"). Veena kavya/maitri (0.07), Chatterbox-M and the anchor (0.00) have almost none.
- **Rate.** The anchor runs at 5.3 syl/s. VoxCPM2-M (5.8) and Chatterbox-M expressive (5.6) are at the fast edge; if
  the raters call anything "rushed", it will be these. VoxCPM2-F (3.7) and MAI (2.0-2.9) are slow.

### 2.5 The AI judge did not work (screen 5)

- The two judge models barely agree: Spearman 0.15 (talking), 0.16 (warmth), **-0.04 (accent)** and 0.18 (humanlike), n=237.
- Of 15 clips with an internal silence over 2 s (MAI's 5-15 s gaps among them), **0 were flagged** `odd_pause` by
  either model. That is the same failure as round 1, where the judge missed the hums and silences.
- Calibration against round 1's human direction (the expressive take beat plain for both V4 Omni Diya, 7-0, and V6
  realtime marin, 8-1). The judge's talking+humanlike vote per line got V4 right 3-1-1 (gpt-realtime-2.1) and 3-2
  (mini), but **V6 wrong 1-4** and 2-2-1.
- Scores sit between 2 and 4 for every arm, including MAI with 15 s of silence.
- **The AI judge's accent score does not correlate with the acoustic accent proxy** (Spearman -0.10).
- A second judge family was tried. **Phi-4-multimodal-instruct** (Azure, Microsoft, deployed as `scout-phi4mm` for
  this test and deleted afterwards) transcribed the probe line as "सतтайसोपेपी चोरते ही बिसो…". Its speech input has no
  Hindi, so it can't judge Hindi delivery. **Voxtral Small/Mini on Bedrock** returned "Too many tokens per day" in every region
  (the account's daily quota is 0). gpt-live-1 (`taxila-live`) refuses the realtime text-out socket (HTTP 400).
  So no second family is available on our platforms today.

Conclusion: the AI judge gets weight 0.10 in the composite and decides nothing. The `gpt-audio-not-a-judge` law also
holds for gpt-realtime-2.1 on Hinglish delivery.

### 2.6 How far to trust the proxies

- Screens 1, 3 and 4 are physical measurements (what words, where the silences are, how fast). They are reliable
  for **defects**, and every exclusion in section 0 rests on them.
- The accent proxies (2a/2b) point the same way as round 1's remarks on the Omni and realtime voices, but they have
  not been calibrated against human labels. They also miss Polly generative's foreign-sounding Hindi, and they
  penalise expressive delivery. n = 5 lines per arm.
- **Nothing here measures talking vs reading, warmth or the laugh.** The round-1 winner directions (expressive Omni,
  expressive realtime) score *worse* on these proxies than flat voices. So the blind page has to keep plain/expressive pairs for
  arms that have native expression (Hazelmori, kiara).

## 3. Why each pick, and why not the others

- **Anchor (DragonHD Diya plain, round 1).** Kept unchanged, as instructed. The same five round-1 clips are reused, so
  the comparison with round 1 is exact.
- **Veena kavya over maitri, vinaya and agastya.** It has the lowest WER and the most native Hindi proxy of the four, and 0.07
  mid-phrase pauses per clip. Maitri (#9) is the reserve female, with the better English-word proxy. Vinaya (#11) is the reserve male.
  Agastya has the lowest cross-line consistency (0.93) and 0.33 mid-phrase pauses per clip.
- **Chatterbox design-M over VoxCPM2 design-M.** It is the same designed voice: Chatterbox clones the VoxCPM2 design.
  VoxCPM2-M plain is cleaner (CTC CER 0.02) but fails the rate gate at 5.78 syl/s. Chatterbox-M plain is at 5.48 with
  0 mid-phrase pauses. If the raters like this voice, the production follow-up is to make VoxCPM2 (which streams) run
  slower, or to stream Chatterbox. Neither is solved yet.
- **Chatterbox design-F is not picked** (#3 on the composite). It is the female twin of the same synthetic design, and
  Veena kavya already fills the open-female slot with a voice built from real Hindi speakers. It is a reserve.
- **OmniIndic Hazelmori, not Diya.** It comes from the same new model, but Diya drops words on L1 in both conditions,
  has the worst English-word proxy in the family, and has a 1.8 s silence on expressive. Hazelmori keeps the expressive arm,
  despite its proxy cost (#30), because human raters preferred Omni expressive over plain 7-0 in round 1. The proxies
  have never beaten that. Its 0.6 mid-phrase pauses per clip are the thing to listen for.
- **Nova 2 Sonic kiara.** It is the only GA, credit-funded, speech-to-speech Indian voice with zero word errors. It
  doubles as the test of whether an S2S model "talks" more than TTS for these raters (realtime marin did, 8-1, but kept
  the accent problem; kiara's English-word accent proxy is among the best measured).
- **Omni Arjun plain** is the Azure male. DragonHD Arjun (#1) already failed both raters in round 1, the MAI males fail
  the silence and rate gates, and Nova arjun says the wrong sentence. Its expressive take is excluded for the timbre jump.
- **Dragon hi-IN Diya (new, non-HD, Preview, #4)** is a reserve. It is clean, but plain-only, in the same Dragon family
  as the anchor, and from eastus2. On the page it would most likely sound like a second anchor.
- **Polly neural Kajal (#5)** looks clean but was already rejected for the teacher voice (`rj-polly-teacher-voice`):
  one Hindi voice, no male, robotic uniform pauses, and 0 wins out of 40 AI-judge pairs. Nothing here changes that.

## 4. Latency, cost, licence and platform for the picks

| pick | TTFB measured (where) | cost per hour of teacher speech | licence / terms | production path |
|---|---|---|---|---|
| DragonHD Diya (anchor) | 1.22-1.29 s US sandbox → eastus2 (SCAN); about 110-190 ms server-side measured earlier (HUMAN-VOICE) | ~$0.95 ($22/M chars) | Azure Speech, GA | live today |
| Veena kavya | 0.87 s on-GPU, L4, HF reference code, RTF 2.6 | ~$0.14-0.28 at 8-16 streams/L40S **[E]**; $2.24 at 1 stream | Apache-2.0 @ 8b770f9e; stock artist voice needs Maya's written consent; a LoRA on our own consented teacher is the clean path | self-host on AWS GPU (Activate credit) or the Azure A100 hedge; Mumbai GPU quota is 0 today |
| Chatterbox-hi design-M | 4.4 s (whole clip, no streaming), RTF 0.56 on L4 | small model; L4-class GPU is enough **[E]** | MIT @ 82ca7127; voice is a synthetic VoxCPM2 design, no real person | self-host; needs streaming work |
| OmniIndic Hazelmori | ~0.8 s US → centralindia, warm connection | ~$0.95 if billed at the DragonHD rate **[U]** | Azure Speech, Preview | Azure centralindia; switch on at GA (`voice-ga-only-for-minors`) |
| Nova 2 Sonic kiara | 0.72 s US sandbox → us-east-1, session open | ~$1.08/h output + mic input **[E from S]** | Bedrock on-demand, GA | AWS us-east-1 only; no Mumbai |
| Omni Arjun | ~0.8 s US → centralindia | ~$0.95 **[U]** | Azure Speech, unlisted voice | at risk: unlisted, can vanish without notice |

None of these latencies were measured from India.

## 5. What this screen cost, and on whose money

All spend came from the two grants. No third-party API was called. OpenRouter was not used.

- **Azure (startup grant): about $6-7 [E].** Breakdown: about 70 min of audio through Azure Speech STT short-audio (~$1.2); about 66 min through
  gpt-transcribe (~$0.4 **[U]** meter); the realtime judge at 480 calls (46.8k audio-in tokens plus ~0.34M text in and ~0.12M out,
  ~$4); and Phi-4-multimodal probes (< $0.01). The `scout-phi4mm` deployment was created on `taxila-ai-southindia` for
  this test and **deleted** after it failed. Cap: $20.
- **AWS (Activate credit): $0.38** (scripts/gpu ledger). Two failed L4 spot runs: $0.21 (no ffmpeg) and $0.13 (a WavLM
  short-segment crash, now guarded). The alignment then ran on a c7i.4xlarge spot for $0.04, because the 8-vCPU G/VT quota
  was taken by another workflow's `stt-v3-bench` instances. **No instance of this job is left running.** Bedrock Voxtral: $0
  (throttled). Cap: $80.
- The gpt-transcribe S0 call-rate limit made 151 of 440 first-pass calls fail. They were redone serially, honouring
  Retry-After (`collect.py fill`). Every clip has both transcripts.

## 6. Before the page goes up

1. Loudness-normalise every chosen clip to -26 LUFS. None of the renders are normalised yet.
2. Per arm: 5 lines × (plain, plus expressive where listed). Take 1, unless it fails a gate (rule in section 1).
3. Keep the round-1 page mechanics: per-listener shuffle, ≥ 80% played before voting, the optional note per card (the
   owner's written remarks were the most informative output of round 1). Add a checkbox for "accent changes on English
   words", the defect the proxies can only partly see.
4. Two raters again (owner and Gaurav, equal weight), as decided for round 1.

## 7. Reproduce

```
cd /home/user/Taxila; set -a; . ./.env.local; set +a
python3 docs/research/voice/v3/screen/collect.py          # VAD + gpt-transcribe + Azure hi-IN STT -> raw/
python3 docs/research/voice/v3/screen/collect.py fill     # redo rate-limited gpt-transcribe calls
python3 scripts/gpu/run.py <job dir from screen/gpu-job/> --cpu   # align.py on a throwaway instance -> align/
WS_FROM=<dir with node_modules/ws>/ node docs/research/voice/v3/screen/judge.mjs   # -> judge.json
python3 docs/research/voice/v3/screen/score.py && python3 docs/research/voice/v3/screen/rank.py
```
`screen/gpu-job/` holds the `run.sh` and `job.json` used. Copy `screen/collect.py`, `screen/align.py` and the five round-1
anchor WAVs (as `r1/`) beside them before launching. The package versions the run resolved are in `screen/align-freeze.txt`.
