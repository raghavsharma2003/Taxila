# Azure-billed voice sweep v2: every Hindi/Indian Azure voice on 5 teacher passages (2026-10-02)

Experiment `azure-speech-voices`. Script: `azure-speech-voices.mjs` (synth + ASR), `analyze-azure-speech-voices.py`
(table), raw rows `results.json`, audio `samples/<CODE>.mp3`, code key `samples/KEY.json` (185 clips, 37 arms x 5
passages, 42.3 MB). Price evidence: `prices-speech-eastus2.json` (retail API dump, eastus2). Builds on
`../voices-hindi.md` (§3.5, §5) and `../listening-samples.md`. Passages are TEST STIMULI ONLY, never prompt text.

**What this measures and what it does not.** TTFB, total synthesis time, speaking rate, ASR round-trip
intelligibility, and price. It does NOT measure "indistinguishable from a real Indian person". The Meera law
(metrics won, ears lost) holds here too: the WER column is saturated and cannot rank voices. The goal question is
decided by the blind ear test, not by this table.

## 0. Verdict (for the main loop)

1. **Intelligibility floor: every arm passes.** 185/185 clips round-trip through `taxila-transcribe`
   (gpt-4o-transcribe, no language hint) with mean normalised WER <= 0.041 per arm; 160/185 at exactly 0; no
   off-script (Urdu/Bengali) transcripts on any Hindi passage. WER does not separate the candidates.
2. **Latency: MAI-Voice-2.1-Flash is the only Hindi-native family that is fast end-to-end.** Median TTFB 321 ms,
   median total 730 ms for 15-34 s of audio (RTF 0.03-0.04). MAI HD: TTFB 935 ms (it appears to buffer, then
   send). DragonHD en-IN: TTFB 244-253 ms but total ~3.7 s (true streaming at ~3.6x realtime). gpt-4o-mini-tts:
   TTFB 302 ms median (one 4.6 s outlier on `sage`).
3. **Price (retail, verified meters):** Neural $15/1M chars, Neural HD $22/1M chars (meter effective
   2026-09-01), gpt-4o-mini-tts $12/1M audio-out tokens + $0.60/1M text-in (= ~$0.015/min). **No MAI-Voice meter
   and no DragonHDOmni meter exists** in the retail API; their price is [U]. Per minute of teacher speech every
   arm lands at **$0.008-0.021/min (Rs 0.7-1.8/min)**, so cost does not decide between them; performance does.
4. **Ear-test shortlist from this sweep (performance first):** `hi-IN-Kavya:MAI-Voice-2.1-Flash`,
   `hi-IN-Priya:MAI-Voice-2.1(-Flash)`, `hi-IN-Dhruv:MAI-Voice-2.1-Flash` (male), `en-IN-Diya:DragonHDLatestNeural`
   (lang-tagged), `hi-IN-Diya:DragonLatestNeural`, `gpt-4o-mini-tts marin` (cascade default voice per
   `voice-lane-cascade-default`). A sibling AI-judge proxy run (`judge-summary.json`, OpenRouter judges,
   experiments only) ranked mai-hd:Priya / mai-flash:Dhruv (4.75), dhd-plain:Diya (4.70), diya-dragon (4.88, n=2
   clips) highest among Azure arms with n>=5, but that judge scored the HUMAN studio anchor at 3.3, below most
   TTS, so it is uncalibrated and is not evidence of human-likeness.
5. **`<lang xml:lang="hi-IN">` on en-IN DragonHD changes nothing measurable** (WER 0.0018 vs 0.0036, CER 0.018 vs
   0.024, duration within +-12%, TTFB identical). Whether it changes the ACCENT of the Hindi spans is an ear
   question; both variants are in `samples/` for the A/B.
6. **Found a real failure:** `hi-IN-Arjun:MAI-Voice-2.1(-Flash)` has no `softvoice` style; sending it returns
   HTTP 502 (the REST call surfaced as `UND_ERR_SOCKET` after retries). Any production style map must be built
   from each voice's `StyleList` in `/voices/list`, never from a family default. Harper and Grant list no styles.

## 1. Arms (37) and method

| family | voices | SSML | n clips |
|---|---|---|---|
| `mai-hd` `hi-IN-<v>:MAI-Voice-2.1` | Kavya, Priya, Harper, Arjun, Dhruv, Grant | prosody rate 0.95; Kavya/Priya/Dhruv praise=`excited`, correction=`softvoice`; Arjun praise=`excited` only; Harper/Grant unstyled (no StyleList) | 30 |
| `mai-flash` `...:MAI-Voice-2.1-Flash` | same six | same | 30 |
| `dhd-plain` `en-IN-<v>:DragonHDLatestNeural` | Diya, Lavanya, Meera, Aarti, Arjun, Neerja | rate 0.95, no styles, Devanagari sent as-is | 30 |
| `dhd-lang` | same six | as above, Devanagari runs wrapped in `<lang xml:lang="hi-IN">` | 30 |
| `swara-plain` / `swara-styled` `hi-IN-SwaraNeural` | Swara | rate 0.95; styled: `cheerful` default/praise, `empathetic` correction | 10 |
| `diya-dragon` `hi-IN-Diya:DragonLatestNeural` | Diya | rate 0.95 | 5 |
| `omni` `hi-IN-<v>:DragonHDOmniLatestNeural` (unlisted in voices/list, resolves) | Swara, Kavya, Aarti, Ananya, Diya, Madhur | rate 0.95 | 30 |
| `4omtts` gpt-4o-mini-tts (Azure OpenAI `/audio/speech`) | coral, sage, shimmer, marin (marin supported) | voice DESCRIPTION instructions (native North Indian teacher accent, Indian English vowels, warm/unhurried) + per-passage mood note | 20 |

Passages: (a) Hinglish greeting + cricket-match memory callback to "Aarav", 160 chars; (b) Hinglish equivalent
fractions with a pizza + gentle question, 319 chars; (c) pure Hindi plants/roots for class 3; (d) Indian English
praise with "beta"; (e) "शाबाश" praise segment then a gentle correction segment (3/4 > 2/3) - styled arms switch
style between the two segments inside one request.

Timing: Node fetch from this container (via egress proxy) to `eastus2.tts.speech.microsoft.com` REST v1, mp3
24 kHz 96 kbps, 2 concurrent workers, one shot per cell (n=5 per arm), 2026-10-02. TTFB = first non-empty body
chunk; total = last byte. Production will run in centralindia/eastus2 from Azure Container Apps without the proxy,
so absolute numbers are an upper bound; relative ordering is the finding.

ASR: each mp3 sent to `taxila-transcribe` with no language hint. WER uses Devanagari->Roman transliteration plus
phonetic folding (aspiration, vowel length, nukta, doubled letters), digit/fraction normalisation into the
passage's number language, an alias list for English words ASR writes in Devanagari (pizza/पिज़्ज़ा, match/मैच ...),
and near-match tolerance (normalised edit distance <= 0.34 per word). This is deliberately lenient: it measures
"could a listener recover the words", not accent. The constant CER 0.057 on passage (a) is the name "Aarav"
(आरव vs aarav folding), present in every arm.

## 2. Per-arm results

| arm | voice | n | TTFB med (max) ms | total med ms | RTF | chars/s | WER mean (max) | WER a/b/c/d/e | off-script | $/1M chars | $/min speech |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `4omtts:coral` | `coral` | 5 | 664 (851) | 2766 | 0.156 | 11.6 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 21.76 I | 0.0151 |
| `4omtts:marin` | `marin` | 5 | 304 (345) | 2536 | 0.144 | 11.8 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 21.43 I | 0.0151 |
| `4omtts:sage` | `sage` | 5 | 299 (4605) | 3596 | 0.243 | 11.1 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.8 I | 0.0151 |
| `4omtts:shimmer` | `shimmer` | 5 | 286 (532) | 2788 | 0.143 | 11.6 | 0.005 (0.03) | 0.00/0.00/0.00/0.03/0.00 | 0 | 21.72 I | 0.0151 |
| `dhd-lang:Aarti` | `en-IN-Aarti:DragonHDLatestNeural` | 5 | 239 (251) | 3605 | 0.271 | 14.9 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.0 V | 0.0197 |
| `dhd-lang:Arjun` | `en-IN-Arjun:DragonHDLatestNeural` | 5 | 242 (284) | 3813 | 0.288 | 15.5 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.0 V | 0.0204 |
| `dhd-lang:Diya` | `en-IN-Diya:DragonHDLatestNeural` | 5 | 244 (260) | 3504 | 0.271 | 15.9 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.0 V | 0.0209 |
| `dhd-lang:Lavanya` | `en-IN-Lavanya:DragonHDLatestNeural` | 5 | 239 (449) | 3679 | 0.28 | 15.7 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.0 V | 0.0207 |
| `dhd-lang:Meera` | `en-IN-Meera:DragonHDLatestNeural` | 5 | 245 (687) | 3914 | 0.279 | 13.8 | 0.005 (0.03) | 0.00/0.00/0.00/0.03/0.00 | 0 | 22.0 V | 0.0182 |
| `dhd-lang:Neerja` | `en-IN-Neerja:DragonHDLatestNeural` | 5 | 260 (731) | 3619 | 0.296 | 16.0 | 0.005 (0.03) | 0.00/0.00/0.00/0.03/0.00 | 0 | 22.0 V | 0.0212 |
| `dhd-plain:Aarti` | `en-IN-Aarti:DragonHDLatestNeural` | 5 | 243 (301) | 3656 | 0.274 | 15.4 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.0 V | 0.0204 |
| `dhd-plain:Arjun` | `en-IN-Arjun:DragonHDLatestNeural` | 5 | 244 (254) | 3740 | 0.287 | 15.0 | 0.005 (0.03) | 0.00/0.00/0.00/0.03/0.00 | 0 | 22.0 V | 0.0198 |
| `dhd-plain:Diya` | `en-IN-Diya:DragonHDLatestNeural` | 5 | 290 (821) | 3701 | 0.286 | 15.2 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.0 V | 0.0201 |
| `dhd-plain:Lavanya` | `en-IN-Lavanya:DragonHDLatestNeural` | 5 | 287 (824) | 3737 | 0.298 | 16.3 | 0.005 (0.03) | 0.00/0.00/0.00/0.03/0.00 | 0 | 22.0 V | 0.0215 |
| `dhd-plain:Meera` | `en-IN-Meera:DragonHDLatestNeural` | 5 | 262 (792) | 4208 | 0.282 | 13.8 | 0.005 (0.03) | 0.00/0.00/0.00/0.03/0.00 | 0 | 22.0 V | 0.0182 |
| `dhd-plain:Neerja` | `en-IN-Neerja:DragonHDLatestNeural` | 5 | 283 (607) | 3279 | 0.285 | 16.0 | 0.005 (0.03) | 0.00/0.00/0.00/0.03/0.00 | 0 | 22.0 V | 0.0211 |
| `diya-dragon` | `hi-IN-Diya:DragonLatestNeural` | 5 | 884 (2547) | 1782 | 0.118 | 13.4 | 0.005 (0.02) | 0.00/0.00/0.00/0.00/0.02 | 0 | 15.0 U | 0.0121 |
| `mai-flash:Arjun` | `hi-IN-Arjun:MAI-Voice-2.1-Flash` | 5 | 315 (854) | 632 | 0.04 | 10.5 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 15.0 U | 0.0095 |
| `mai-flash:Dhruv` | `hi-IN-Dhruv:MAI-Voice-2.1-Flash` | 5 | 438 (915) | 734 | 0.042 | 11.0 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 15.0 U | 0.0099 |
| `mai-flash:Grant` | `hi-IN-Grant:MAI-Voice-2.1-Flash` | 5 | 334 (376) | 681 | 0.037 | 12.6 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 15.0 U | 0.0113 |
| `mai-flash:Harper` | `hi-IN-Harper:MAI-Voice-2.1-Flash` | 5 | 307 (323) | 518 | 0.03 | 10.4 | 0.018 (0.09) | 0.00/0.09/0.00/0.00/0.00 | 0 | 15.0 U | 0.0093 |
| `mai-flash:Kavya` | `hi-IN-Kavya:MAI-Voice-2.1-Flash` | 5 | 320 (449) | 797 | 0.038 | 11.3 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 15.0 U | 0.0102 |
| `mai-flash:Priya` | `hi-IN-Priya:MAI-Voice-2.1-Flash` | 5 | 337 (530) | 785 | 0.034 | 8.9 | 0.006 (0.03) | 0.00/0.03/0.00/0.00/0.00 | 0 | 15.0 U | 0.008 |
| `mai-hd:Arjun` | `hi-IN-Arjun:MAI-Voice-2.1` | 5 | 1001 (1524) | 1417 | 0.087 | 9.5 | 0.005 (0.02) | 0.00/0.00/0.00/0.00/0.02 | 0 | 22.0 U | 0.0126 |
| `mai-hd:Dhruv` | `hi-IN-Dhruv:MAI-Voice-2.1` | 5 | 903 (1047) | 1251 | 0.072 | 9.4 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.0 U | 0.0125 |
| `mai-hd:Grant` | `hi-IN-Grant:MAI-Voice-2.1` | 5 | 892 (952) | 1298 | 0.082 | 11.6 | 0.020 (0.04) | 0.03/0.04/0.02/0.00/0.00 | 0 | 22.0 U | 0.0153 |
| `mai-hd:Harper` | `hi-IN-Harper:MAI-Voice-2.1` | 5 | 940 (1575) | 1695 | 0.078 | 9.8 | 0.027 (0.09) | 0.00/0.09/0.04/0.00/0.00 | 0 | 22.0 U | 0.0129 |
| `mai-hd:Kavya` | `hi-IN-Kavya:MAI-Voice-2.1` | 5 | 1459 (1718) | 2108 | 0.096 | 9.9 | 0.041 (0.12) | 0.00/0.09/0.00/0.00/0.12 | 0 | 22.0 U | 0.0131 |
| `mai-hd:Priya` | `hi-IN-Priya:MAI-Voice-2.1` | 5 | 994 (1101) | 1474 | 0.078 | 9.3 | 0.008 (0.02) | 0.00/0.01/0.00/0.00/0.02 | 0 | 22.0 U | 0.0123 |
| `omni:Aarti` | `hi-IN-Aarti:DragonHDOmniLatestNeural` | 5 | 755 (2641) | 3573 | 0.172 | 11.8 | 0.015 (0.04) | 0.03/0.04/0.00/0.00/0.00 | 0 | 22.0 U | 0.0155 |
| `omni:Ananya` | `hi-IN-Ananya:DragonHDOmniLatestNeural` | 5 | 1028 (1240) | 2221 | 0.132 | 12.5 | 0.006 (0.03) | 0.03/0.00/0.00/0.00/0.00 | 0 | 22.0 U | 0.0165 |
| `omni:Diya` | `hi-IN-Diya:DragonHDOmniLatestNeural` | 5 | 342 (991) | 2155 | 0.167 | 13.7 | 0.009 (0.05) | 0.00/0.00/0.00/0.00/0.05 | 0 | 22.0 U | 0.0181 |
| `omni:Kavya` | `hi-IN-Kavya:DragonHDOmniLatestNeural` | 5 | 1782 (8734) | 3053 | 0.274 | 11.6 | 0.013 (0.07) | 0.07/0.00/0.00/0.00/0.00 | 0 | 22.0 U | 0.0153 |
| `omni:Madhur` | `hi-IN-Madhur:DragonHDOmniLatestNeural` | 5 | 373 (439) | 2460 | 0.13 | 11.1 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.0 U | 0.0147 |
| `omni:Swara` | `hi-IN-Swara:DragonHDOmniLatestNeural` | 5 | 1453 (7108) | 5096 | 0.275 | 11.4 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 22.0 U | 0.015 |
| `swara-plain` | `hi-IN-SwaraNeural` | 5 | 645 (1084) | 1404 | 0.06 | 9.7 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 15.0 V | 0.0087 |
| `swara-styled` | `hi-IN-SwaraNeural` | 5 | 1164 (4224) | 2039 | 0.118 | 10.2 | 0.000 (0.00) | 0.00/0.00/0.00/0.00/0.00 | 0 | 15.0 V | 0.0092 |

Tags: V = verified retail meter, U = no meter found, price assumed, I = inferred from audio duration
(gpt-4o-mini-tts tokens estimated at 1250 audio tokens/min).

## 3. Per-family summary

| family | n | TTFB med | TTFB p90 | total med | chars/s | mean WER | mean CER | clips WER>0 | $/1M chars |
|---|---|---|---|---|---|---|---|---|---|
| mai-flash | 30 | 321 | 530 | 730 | 10.7 | 0.004 | 0.029 | 2 | U (15?) |
| mai-hd | 30 | 935 | 1523 | 1446 | 9.9 | 0.017 | 0.039 | 10 | U (22?) |
| dhd-plain | 30 | 253 | 692 | 3728 | 15.2 | 0.004 | 0.024 | 4 | 22 V |
| dhd-lang | 30 | 244 | 285 | 3713 | 15.3 | 0.002 | 0.018 | 2 | 22 V |
| omni | 30 | 593 | 4958 | 2573 | 11.9 | 0.007 | 0.030 | 5 | U (22?) |
| diya-dragon | 5 | 884 | 956 | 1782 | 13.4 | 0.005 | 0.020 | 1 | U |
| swara-plain | 5 | 645 | 1027 | 1404 | 9.7 | 0 | 0.041 | 0 | 15 V |
| swara-styled | 5 | 1164 | 1260 | 2039 | 10.2 | 0 | 0.037 | 0 | 15 V |
| 4omtts | 20 | 302 | 732 | 2762 | 11.5 | 0.001 | 0.027 | 1 | ~21.8 I ($12/M audio tok V) |

Observations:
- **MAI HD is the least intelligible family** (10/30 clips with WER>0, worst Kavya 0.12 on the praise/correction
  passage and 0.09 on fractions; Harper 0.09 on fractions). Flash siblings of the same voices are cleaner (2/30).
  This repeats the earlier finding that full-model Kavya splits words that Flash does not (voices-hindi §3.5).
- **Speaking rate separates families more than anything else here.** At the same `rate=0.95`, en-IN DragonHD
  speaks ~15 chars/s, MAI ~10, Swara ~10, gpt-4o-mini-tts ~11.5. Priya Flash is slowest (8.9). DragonHD's pace
  is the closest to an adult conversation and may read as rushed to a 9-year-old; MAI's may read as
  teacher-deliberate or as slow. Rate is tunable, so the ear test must equalise or deliberately vary it.
- **DragonHDOmni is unlisted and has bad tails:** Kavya Omni TTFB max 8.7 s, Swara Omni 7.1 s (p90 for the
  family 5.0 s). Not a live-loop candidate until it is listed and the tail is re-measured.
- **Swara `express-as` styles cost ~0.5 s TTFB** (1164 vs 645 ms median) on a non-HD voice.
- **gpt-4o-mini-tts honoured Hinglish as written:** ASR returned 22% Latin for coral/marin on the fractions
  passage (English words kept English) vs 0-8% for Azure Speech arms, where ASR transliterated English words into
  Devanagari. Whether that means the Azure voices pronounced "pizza/equivalent" more Hindi-ly, or only that ASR
  chose a script, is an ear question.

## 4. Price detail (Azure retail prices API, fetched 2026-10-02)

The Speech meters have moved: `serviceName eq 'Cognitive Services'` now returns **0 items**; Speech is
`serviceName 'Foundry Tools'`, `productName 'Azure Speech'`. Query used:
`$filter=productName eq 'Azure Speech' and armRegionName eq 'eastus2'` (174 meters, saved).

| meter | retail | applies to |
|---|---|---|
| S1 Neural Text To Speech Characters | $15 / 1M chars | Swara, en-IN/hi-IN Neural; probably Dragon (non-HD) and MAI Flash [U] |
| Neural HD Text to Speech Characters | $22 / 1M chars (effective 2026-09-01) | DragonHDLatest; probably MAI-Voice-2.1 HD and DragonHDOmni [U] |
| Commitment tier NTTS 80M / 400M / 2000M | $960 / $3,900 / $15,000 per month (overage $12 / $9.75 / $7.50 per 1M) | Neural (whether HD/MAI draw from it is [U]) |
| Text to Speech - Personal Voice Characters | $24 / 1M chars | personal/cloned voice |
| gpt-4o-mini-tts-aud-out-glbl / txt-inp-glbl | $0.012 / 1K tok, $0.0006 / 1K tok | gpt-4o-mini-tts Global |
| (searched `MAI` in meterName) | only MAI-Thinking-1, MAI-Cyber-1-Flash, MAI-DS-R1 token meters | no MAI-Voice meter exists |

Per minute of produced speech (chars/s from this sweep x price): Neural $0.008-0.009, MAI (assumed) $0.008-0.015,
DragonHD $0.018-0.021, gpt-4o-mini-tts ~$0.015. A 30-minute lesson where the teacher speaks half the time costs
$0.12-0.32 in TTS at retail. Cost is not the discriminator.

## 5. Recommended next steps

1. **Blind ear test (decides the goal).** Use the codes in `samples/KEY.json`; play listeners the shortlist in §0.4
   on all five passages, with plain vs lang-tagged DragonHD as an A/B pair. Native Hindi-speaking listeners
   (ideally parents/teachers from the launch states), "real person or AI?" plus naturalness/accent/warmth for a
   child. The AI judge in `judge-summary.json` is not a substitute (it rated the human anchor below TTS).
2. **Ask Microsoft / the billing export what MAI-Voice-2.1 bills as** before committing to it at scale; run one
   day of traffic and read the cost-management meter it lands on.
3. **Style maps from `StyleList`, not family defaults** (Arjun 502). Put this in the TTS adapter.
4. **Re-measure TTFB from Azure Container Apps (centralindia)** for the shortlist, n>=20 per voice, with streaming
   sentence-chunked synthesis, since the cascade (decision `voice-lane-cascade-default`) speaks sentence by sentence.
5. MAI-Voice-2.1 is Public Preview ("not recommended for production", voices-hindi §3.5): if it wins by ear, the
   fallback voice for outages must be chosen in the same test.

## 6. What would change this

- A blind ear test where a cascade arm here loses to realtime-native voices on "real person" -> revisit the lane.
- MAI-Voice-2.1 GA with a published meter above ~$40/1M chars -> cost would start to matter (still < $0.03/min).
- A strict (non-lenient) WER or accent classifier that separates the arms -> add it as a second objective column.
- DragonHDOmni appearing in `/voices/list` with a stable tail -> re-run it as a live candidate.

## Reproduce

```
set -a; . /home/user/Taxila/.env.local; set +a
NODE_USE_ENV_PROXY=1 node docs/research/voice/v2/azure-speech-voices.mjs all [armRegex]   # resumes; skips done cells
python3 docs/research/voice/v2/analyze-azure-speech-voices.py                              # table + summary.json
```
