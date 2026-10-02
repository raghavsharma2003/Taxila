# Experiment `reference-gemini`: non-Azure reference voices and an AI-judge pass over every v2 sample

2026-10-02. **EXPERIMENTS ONLY.** OpenRouter was used to generate the reference clips and to run the judges. Every `ref-*.mp3` is
**reference-not-for-production** (the flag is in `samples/KEY-ref.json`, the unblinding file; never give it to listeners). Production
voice stays Azure-billed (`azure-billed-open-models`, `voice-lane-cascade-default`).

## 1. What OpenRouter exposes (models API, 2026-10-02)
- `output_modalities: audio` (chat models): only `openai/gpt-audio` and `-mini`, plus the Lyria music models. **The Gemini native-audio models are not exposed as chat models that output audio.**
- `speech` (TTS endpoint `/api/v1/audio/speech`): 23 models, among them **google/gemini-3.8-flash-tts**, gemini-3.8-flash-lite-tts,
  gemini-3.1-flash-tts-preview, x-ai/grok-voice-tts-1.0, minimax/speech-2.8-hd, fish-audio/s2.1-pro, bytedance-seed/seed-audio-1-0,
  hexgrad/kokoro-82m, qwen-audio-3.0-tts, deepgram, mistral voxtral-mini-tts, orpheus, sesame csm, and the MAI-Voice-2/2.1 family
  (the same models we get Direct from Azure, so they were left out of the reference set).
- So the "Gemini voice the owner likes" is reachable for reference through the **Gemini TTS** models. The Gemini Live native-audio dialogue model is not.

## 2. Reference generation (`gen-ref.mjs`, `passages-ref.mjs`)
- 90 clips = 18 arms × the 5 test passages (a greeting + memory callback; b fractions with pizza; c pure Hindi for class 3;
  d English with warmth; e shabash plus a gentle correction). Arms: gemini-3.8-flash-tts × 7 voices (Kore, Leda, Sulafat, Despina,
  Achernar, Aoede, Vindemiatrix), gemini-3.8-flash-lite Sulafat, gemini-3.1-flash-tts-preview Kore and Sulafat, Gemini Sulafat with no style
  note, grok ara and eve, minimax, fish-s2.1-pro, seed-audio, kokoro, and a **negative control** (Gemini Kore directed to an American accent).
- How Gemini is steered: a structured "audio profile / scene / director's notes / transcript" header. A flat "Read this as…" prefix was
  **read aloud** in 2/3 smoke clips, as a Devanagari transliteration. The structured header was not read aloud. Every clip was ASR-checked for note words.
- Post-processing: silence trimmed from the edges, 150/400 ms padding, two-pass loudnorm to -24 LUFS, mp3 at 64 kbps mono. Raw originals are kept out of the repo.
  `restore-ref.sh` rebuilds the mp3s after a concurrent re-run wiped `samples/`.
- Audio size: `samples/` is 53 MB in total (Azure + ref), under the 60 MB cap.

## 3. Judge pass
Full numbers and method are in `judge-summary.md`. Headlines:
- 3 audio judges. Only **gemini-3.1-pro-preview** caught the American-accent negative control (native 2.4, leak 80%). gpt-audio rated it
  5.0 native-Indian and is excluded. qwen3.8-omni-flash judges 94% of TTS as "human". Gemini-Pro test-retest Spearman is 0.94 (n=26).
- **Coverage is PARTIAL: 178/278 clips rated, 100 Azure clips unrated.** The OpenRouter key hit its $10 cap ($0.27 left; audio
  requests need ≥ $0.50 → HTTP 402). Every MAI-Voice-2.1 arm, Diya DragonHD and every reference arm *is* fully rated. Missing are most
  en-IN DragonHD voices, gpt-realtime `omni:*`, gpt-4o-mini-tts and Swara. The 40-minute wait for the Azure files was not needed: all 183 were already present.

| Gemini-Pro composite (1-5) | |
|---|---|
| Gemini-3.8-flash-tts, director note (6 voices) | 5.00 |
| **Azure MAI-Voice-2.1 HD Priya** | **4.85** |
| **Azure DragonHD Diya** | **4.70** |
| Azure MAI-Voice-2.1 Flash Dhruv | 4.65 |
| Gemini-3.8 Sulafat, *no* director note | 4.45 |
| other MAI voices | 3.50-4.10 |
| grok | 3.5 |
| human anchor (studio read prose) | 3.25 |
| American negative control | 2.95 |
| minimax / fish / kokoro / seed | 1.65-2.55 |

## 4. Implications for the voice choice (proxy; human ears decide)
1. **Azure is not far behind.** MAI-Voice-2.1 HD Priya and Diya DragonHD match the Gemini reference on native-Indian and Hindi
   pronunciation (5.0, zero accent leak) and trail it only on naturalness (4.6 / 4.2 vs 5.0).
2. **Style direction is the lever.** Gemini without its note falls below Priya. The next Azure experiment should push the
   equivalents: MAI styles (excited and so on), SSML prosody and breaks, and gpt-4o-mini-tts `instructions`. Re-judge them the same way.
3. **Candidates for the human blind test:** MAI HD Priya, DragonHD Diya, MAI Flash Dhruv (male), and one Gemini-3.8 reference
   (Kore or Sulafat) as the "Gemini smoothness" target.
4. Caveats: one AI judge drives the ranking, and it may favour its own family (Gemini-Pro gives Gemini TTS 4.94 vs 3.57 for the rest). The absolute scale is not
   "humanness": the real human anchors scored 3.25. n=5 passages per arm. The pairwise harness (`judge-pairwise.mjs`), built to
   break the ceiling, was not run because the budget was exhausted.

## 5. To finish
Raise the OpenRouter key cap by about $5. Then run `NODE_USE_ENV_PROXY=1 HUMAN_DIR=<anchors> node judge-voices.mjs` (it resumes only missing slots), then
`python3 analyze-judge.py`, then `TOPN=10 node judge-pairwise.mjs`. After that comes the human blind test (`make-blind-page.py`).

## Files
`gen-ref.mjs`, `passages-ref.mjs`, `restore-ref.sh`, `judge-voices.mjs`, `judge-pairwise.mjs` (not run), `analyze-judge.py`,
`judge-results.json` (raw, `coverage` block), `judge-summary.json`, `judge-summary.md`, `samples/ref-*.mp3`, `samples/KEY-ref.json`.
Model notes: `docs/research/models/audio-judge-models.md`.

## Review
Adversarial review, 2026-10-02. I recomputed every number from `judge-results.json`, `samples/KEY*.json` and the OpenRouter `/models` and `/key` endpoints (both are free). The arithmetic holds: the composites, calibration, 530 ratings and $4.19 spend all reproduce (Gemini-Pro $2.25 + retest $0.33 + gpt-audio $1.40 + qwen $0.21). The key's remaining balance is $0.259. The conclusions are weaker than the report says, for the reasons below.

**Factual corrections**
1. **`omni:*` is not gpt-realtime.** In KEY.json those arms are `hi-IN-*:DragonHDOmniLatestNeural`, which is Azure Speech. The report and judge-summary call them "gpt-realtime". **gpt-realtime-2.1 (`taxila-realtime`, the premium lane) was not in the sweep at all.**
2. **The default production TTS is effectively unrated.** `voice-lane-cascade-default` makes **gpt-4o-mini-tts** the default lane. Gemini-Pro rated only 2 of its 20 clips (coral, 3.5). Sage, marin and shimmer have no headline rating. So the report ranks everything *except* the voice production uses today. The external human benchmark in measurements.md (arXiv 2604.21481) puts GPT-4o-mini-TTS at a 40% win rate, near the bottom. If the blind test confirms Priya or Diya, this decision has to be revisited (TTS swap). Note also that **MAI-Voice-2.1 and DragonHDOmni have no retail price meter** (`azure-speech-voices.md`): the price is unknown and must be priced before anyone proposes them as the default.
3. **"Choice of MAI voice matters more than HD vs Flash" is contradicted by the data.** The same voice with the same styles gives Priya HD 4.85 vs Priya Flash 3.85, and Dhruv HD 3.80 vs Dhruv Flash 4.65. The tier gap is up to 1 point, in opposite directions for different voices. That is noise, or a voice×tier interaction. It does not support either claim.
4. **Style parity: the advice to "push MAI styles next" is partly already done.** Priya, Kavya and Dhruv already had `excited`/`softvoice`, and Arjun had `excited`. Harper and Grant were *unstyled*. So in the MAI voice ranking, voice is confounded with whether styles were applied.
5. **`samples/` is 56.7 MB now, not 53 MB.** The `oss-*.mp3` files from open-tts-on-azure landed after this report. Adding `stt/audio` (1.8 MB), v2 is about 58.4 MB, which is right at the 60 MB cap. **Do not generate any more audio into v2** without deleting some first.
6. **The inbox file has already been merged.** It is at `context/inbox/merged/voice-v2-reference-judge.json`, and its contents are now in measurements.md (`voice-v2-ai-judge-proxy`) and rejected.md (`gpt-audio-not-a-judge`). That measurement entry repeats the overclaims below, so it should be amended (corrections 3, 7, 8 and 9).

**Methodology flaws**
7. **The top of the ranking is inside judge noise.** Gemini-Pro's test-retest mean absolute difference is 0.30 composite per clip, and single-axis swings of 2 points happen at temperature 0 (Flash Priya e-praise: naturalness 3 → 1). With n=5 clips per arm, Gemini 5.00 vs Priya 4.85 vs Diya 4.70 vs Dhruv 4.65 is **not separable**. Priya's whole gap is 2 clips scoring 4 instead of 5. Report them as a tied top group, not as a ranked list. Nine Gemini arms sit at exactly 5.00, a ceiling, so "Gemini is better" is not measured either. Only the pairwise run can separate them.
8. **The composite is really three axes.** `native_indian` equals `hindi_pronunciation` in 154 of 166 Gemini-Pro ratings, so the composite double-counts one dimension. That inflates the "tie on native/Hindi" story. Report naturalness and warmth separately; those are where the voices actually differ.
9. **The same-family judge is also the only discriminating judge.** Gemini-Pro gives Gemini TTS 4.94 vs 3.57 for everything else, and no non-Google judge can catch the control. So "Gemini is the smoothness ceiling" rests on a Google model grading Google audio. The no-note result shows direction matters, but it does not rule out family bias, which can act on the shared acoustic signature regardless of the note. A judge from another family that can discriminate is needed. Untested candidates: `nvidia/nemotron-3-nano-omni-30b` (free on OpenRouter); an Azure-billed gpt-realtime-2.1 / gpt-audio deployment; a Qwen-omni with a stricter rubric. The external human benchmark (Gemini 2.5 Pro TTS ranked #1, 70% win rate, 1,900 native raters) independently supports Gemini being strong, but it contains no MAI-Voice voice.
10. **Unequal codec path.** Gemini arms were requested as lossless **PCM**, then encoded once to 64 kbps. Azure arms were 96 kbps **mp3** decoded and re-encoded to 64 kbps, two lossy generations. The bias favours the reference and would be read by the judge as "naturalness". Fix: request Azure as `riff-24khz-16bit-mono-pcm` for judge and blind-test stimuli.
11. **Unequal direction.** The Gemini note ("warm, smiling, patient… beside one nine-year-old") closely matches the judge rubric ("Indian teacher speaking to a child aged about 8-10"). Azure got styles plus prosody 0.95 at most. This handicaps Azure, so Azure's near-tie is if anything conservative. But it also means the 0.55-point note effect is partly "told the same thing as the grader".
12. **The human anchor is invalid as a ceiling.** The IndicTTS clips use *different text*: adult read prose in Hindi only, no Hinglish, not addressed to a child. They were scored with a child-warmth rubric (warmth 2.2). Their low score shows the anchor is mismatched, not that the scale "measures ranking". Separately, Gemini-Pro judged 0% of real humans "human" while judging 60-100% of Gemini TTS clips "human". **The human/synthetic axis is inverted.** Nothing here measures owner goal (1), "indistinguishable from a real Indian person". A valid ceiling needs a real Indian teacher recording the 5 test passages (same text, Hinglish, child-directed). That costs about one hour of a person's time and is the single most valuable missing stimulus.
13. **The negative control is weak.** A deliberately American accent still got native_indian 2.4 (it should be about 1) and naturalness 3.2. The rubric under-penalises accent, so a subtler "English speaker attempting Hindi" leak, which is the owner's stated fear, would likely pass. Add a *subtle* control too (e.g. en-US voice reading the Devanagari text, or Gemini directed "slight non-native accent").
14. **The judge is not the newest model.** `gemini-3.1-pro-preview` was created 2026-02-19. Newer audio-input Gemini models exist (3.5 to 3.8 flash, 2026-05 to 09) but they are Flash and from the same family. `:batch` variants are half price (the Gemini-Pro judge has a `:batch` slug). Use it for the remaining 100 clips plus the pairwise run. That run then costs about $1.5, not $5.
15. **The reference set is missing the strongest Indic commercial voices.** ElevenLabs v3, Sonic 3 and Sarvam Bulbul v3 (ranks 2-4 in the external human benchmark) are absent, because OpenRouter doesn't carry them. That is acceptable, but "Azure is not far behind" means "behind Gemini TTS on one Gemini judge", nothing broader. Gemini *Live* native-audio dialogue, likely what the owner actually heard, is untested and different from Gemini TTS.

**Licence and production-rule traps**
16. **Gemini output must not become training or distillation data.** Google's Gemini API terms bar using outputs to develop competing models. `ref-*` clips must never become fine-tuning, voice-cloning or prompt-audio targets for a self-hosted Azure voice (relevant to open-tts-on-azure: IndicF5, Chatterbox, Veena and VoxCPM all take reference audio). Use them only as listening references. Add this to KEY-ref.json's flag.
17. **Under-18 terms.** rejected.md `ct-no-gemini-api-for-minors` already bars Gemini from child-facing paths. For the blind test, play Gemini reference clips to adult raters (parents and teachers), not to children. The blind-test decision rule must be "best **Azure** arm, measured against the reference", never "the winner ships". If listeners prefer Gemini, there is no production path.
18. **IndicTTS anchors.** They are correctly kept out of the repo (`HUMAN_DIR`). Their database licence is research-oriented, so keep it that way.
19. **No Azure-only violation found.** `grep openrouter` over `server/ src/ api/` finds nothing. OpenRouter is used only under `docs/research`.

**Corrected bottom line.** Azure MAI-Voice-2.1 HD Priya, DragonHD Diya and MAI Flash Dhruv form a *tied* top Azure group that this one judge cannot separate from directed Gemini TTS. It is a single same-family judge with a ceiling, n=5 clips per arm, and a codec path biased toward the reference. The cascade's actual default TTS (gpt-4o-mini-tts) and gpt-realtime-2.1 remain unmeasured. The next step needs no extra cap: re-render the shortlist plus gpt-4o-mini-tts (with `instructions`) as PCM, record a real teacher on the 5 passages, and run the human blind test with adult Indian listeners. Pairwise AI judging (on `:batch`) is a secondary check.
