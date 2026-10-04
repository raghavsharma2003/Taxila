# VOICE v3 SCAN: the most human Hindi / Hinglish / Indian-English voices we are allowed to render (2026-10-04)

Scope: a research scan (web + model cards + free catalogue/price APIs + one 4-clip Azure probe) to pick what round 2 of
the human blind test renders. It builds on `../v2/VOICE-CHOICE.md`, `../v2/open-tts-on-azure.md`, `../voices-hindi.md`,
`../../../design/superhuman/HUMAN-VOICE.md` and `../../../design/superhuman/voice-clips/results/BLIND-RESULTS-2026-10-04.md`,
and does not repeat what those already established.
Evidence tags: **[M]** measured today in this scan, **[P]** earlier measurement in this repo, **[V]** vendor page,
model card or price/catalogue API read today, **[S]** third-party secondary source, **[E]** our estimate with the
arithmetic shown, **[U]** unverified.

**What this file is not.** No candidate below has been heard by a human for this product. A spec sheet, a vendor MOS or a
"code-switching" bullet has never predicted what our two raters heard in round 1, where every Azure voice failed. This
file only decides **what to render**. The blind page decides everything else.

---

## 0. Bottom line

1. **New on Azure, never rendered: `hi-in-diya:DragonHDOmniIndicNeural` and `hi-in-hazelmori:DragonHDOmniIndicNeural`.**
   They are listed in Central India's `voices/list` today (Preview, NeuralHD, `ModelSeries: HDOmni`) and are **absent
   from eastus2** [M]. They are a separate Indic-tuned Omni model, not the unlisted `hi-IN-*:DragonHDOmniLatestNeural`
   that round 1 played as V4. One probe line rendered on both (HTTP 200, 2 takes each) [M]. Omni was the only Azure family
   whose expressive arm beat its own plain arm 7-0 in round 1, so this is the highest-prior Azure arm for round 2. It is
   **Preview**, so a win makes it a "switch on GA" target for minors (`voice-ga-only-for-minors`), not a production pick.
2. **The open-weight field for Hindi is thin, and most of the 2026 newcomers are non-commercial or have no Hindi.** The
   allowed open arms are **Veena** (Apache-2.0, native Hinglish, 4 studio artists), **Svara-TTS v1** (Apache-2.0 card,
   Llama 3.2 chain, emotion tags), **VibeVoice-Hindi** (MIT community fine-tune, a conversational/podcast model),
   **VoxCPM2** (Apache-2.0, voice design), **Chatterbox-Multilingual-hi** (MIT, cloning only), **Indic Parler-TTS**
   (Apache-2.0, caption control) and **Vyom-TTS-Hindi-3B** (MIT card, Llama chain, new in Aug 2026).
   **Excluded by licence:** Voxtral-4B-TTS (CC BY-NC 4.0), Higgs Audio v3 (non-commercial), **OmniVoice (CC BY-NC
   weights, although its code is Apache)**, Fish S2 Pro (research licence). **Excluded because there is no Hindi:** CosyVoice 3, IndexTTS-2,
   Qwen3-TTS, Sesame CSM, Kyutai, Spark-TTS, Dia2, Maya1, Chatterbox Turbo/Flash, Kokoro (Hindi graded C).
3. **AWS adds two hosted arms that nobody has heard yet: Amazon Nova 2 Sonic `kiara` / `arjun` (hi-IN and en-IN, S2S,
   GA, us-east-1) and Polly generative `Kajal` (en-IN with hi-IN as a second language, `ap-southeast-1` is the nearest
   region).** Both are credit-funded and allowed. Neither is offered in Mumbai today [M].
4. **AWS GPU in Mumbai has quota 0** (`L-DB2E81BA` and `L-3819A6DF` both 0.0 in ap-south-1) [M]. Every open-model
   render for this round runs in us-east-1 under the existing 8-vCPU G/VT quota. That is fine for offline blind-test
   clips. It says nothing about India latency, and production self-hosting in Mumbai needs a quota request first.
5. **The ceiling is still a third party.** The only large Indian human study (120k comparisons, 1,900 raters) ranks
   Gemini 2.5 Pro TTS first, then ElevenLabs v3 and Cartesia Sonic 3 (tied), then Sarvam Bulbul v3 [P, arXiv 2604.21481].
   No Azure voice, no Veena and no Svara was in that study. Those reference systems stay reference-only.
6. **Production reality check.** Even if an open model wins the ear test, the managed production route remains **Azure
   Professional Voice** from a consented, work-for-hire teacher recording (`voice-escalation-ladder`). An open model only
   becomes the product voice after a LoRA on our own consented recordings (Veena/Svara), never with a stock artist voice
   unless Maya confirms in writing that the artist consented to commercial use by third parties.

### Ranked render list (allowed to render, 11 arms)

The rank is a prior on clearing the raters' failure list: one consistent Indian accent across Hindi and English words, talking rather
than reading, correct numbers, no fake-emphasis pauses. It is weighted by whether a production path exists. "F/M"
marks the voices that cover the female teacher and the male option.

| # | arm | exact id / repo @ revision | voices (F / M) | where it runs | why it is on the list | main risk |
|---|---|---|---|---|---|---|
| 1 | **Azure DragonHD Omni Indic** | `hi-in-diya:DragonHDOmniIndicNeural` | Diya (F) | Azure Speech **centralindia** only [M] | new Indic-specific Omni model; round 1's Omni expressive arm won 7-0; native `[laughter]` on Omni hi-IN measured before [P] | Preview; TTFB from the US 1.63-1.83 s vs DragonHD 1.22-1.29 s on the same path (n=2) [M]; no `<break>`/`<prosody>` on Omni [V] |
| 2 | **Veena** (Maya Research) | `maya-research/Veena` @ `8b770f9e69e6b35ef320d4cd70a99a4ab6dd022f` | `kavya`, `maitri` (F); `agastya`, `vinaya` (M) [V] | AWS GPU, us-east-1 (g6e.xlarge) | the only open model built for Hindi + English + code-mixed from 60k studio utterances by 4 professional artists [V]; reads Latin English inside Hindi natively [P] | no emotion tokens yet [V]; round-1 clip was sentence-split with 200 ms gaps [P] (render whole lines); artist-consent letter needed for production |
| 3 | **Azure DragonHD Omni Indic** | `hi-in-hazelmori:DragonHDOmniIndicNeural` | Hazelmori (F) | centralindia [M] | the second voice of the same new model; gives the panel a within-model timbre choice | same as #1; persona origin unknown |
| 4 | **Amazon Nova 2 Sonic** | Bedrock `amazon.nova-2-sonic-v1:0`, `voiceId` `kiara` / `arjun` (hi-IN and en-IN) [V] | kiara (F), arjun (M) | Bedrock **us-east-1** [M] | GA speech-to-speech with native hi-IN and en-IN voices and documented code-switching inside a sentence [V]; adaptive prosody from conversation context [V] | an S2S model may paraphrase a fixed line, so fidelity must be checked; "does not allow developers to modify pitch, accent, speaking rate" [V]; not in Mumbai or Singapore [M] |
| 5 | **Svara-TTS v1** (Kenpath) | `kenpath/svara-tts-v1` @ `db8a02fc1e4eab827ff6dda5bed3b56d4d2dd51e` | `Hindi (Female)`, `Hindi (Male)`; `English (Female/Male)` [V] | AWS GPU | Apache card, 19 Indic languages + Indian English, sentence-end emotion tags `<happy>` `<sad>` `<anger>` `<fear>` `<clear>` [V]; 10/10 intelligible before [P] | trained on read-speech corpora (SYSPIN, RASA, IndicTTS, SPICOR) [V], so its prior is "reading"; Llama 3.2 licence chain; data licences [U] |
| 6 | **VibeVoice-Hindi** | `tarun7r/vibevoice-hindi-7b` @ `6c2ed6db5ca5665a0cdc264b8876b27990fc4d0b` (and `-1.5B` @ `6385ac1bc85f5200a5f6512a4fcc71eeee2543d1`) | from its shipped speaker prompts [U] | AWS GPU (L40S for 7B) | the only Hindi model whose base is built for long-form multi-speaker conversation (podcast/dialogue), which is the "talking, not reading" axis that every Azure voice failed [V] | community fine-tune, Hindi data provenance not stated [U]; speaker identity comes from voice prompts, so use only a shipped or consented prompt; adds an audible disclaimer + watermark [V]; not streaming at 7B [U] |
| 7 | **Amazon Polly generative** | engine `generative`, `VoiceId=Kajal`, `LanguageCode=hi-IN` and `en-IN` [M] | Kajal (F) | **ap-southeast-1** (nearest; not offered in ap-south-1) [M] | GA, bilingual en-IN/hi-IN, "highly colloquial" billion-parameter generative engine with bidirectional streaming [V] | no male generative voice for India; no human Hindi evidence anywhere; $30/M chars [V] |
| 8 | **VoxCPM2** (OpenBMB) | `openbmb/VoxCPM2` @ `32279effe8c19989596f05d353d1447f51d9e915` | voice design from a description, F and M | AWS GPU (8 GB VRAM) [V] | Apache-2.0, 30 languages incl. Hindi, 48 kHz, streaming, a voice from a text description rather than a clone [V]; 10/10 intelligible before [P] | Hindi is 1 of 30 languages; design results vary run to run (vendor says generate 1-3 times) [V] |
| 9 | **Chatterbox Multilingual (Hindi pack)** | `ResembleAI/Chatterbox-Multilingual-hi` @ `82ca71273cc2a9ab19efdf8315f865c1a5af0ee7` | the speaker of the reference clip | AWS GPU | MIT, a dedicated Hindi pack at 2.55% CER [V], an emotion-exaggeration knob, a PerTh watermark on by default [V] | **cloning only**: render only from a consented in-house adult reference clip (never Resemble's demo speaker on a shared page); a zero-shot clone can never be the product voice (`voice-escalation-ladder`) |
| 10 | **Indic Parler-TTS** (AI4Bharat) | `ai4bharat/indic-parler-tts` @ `7b527af5ee8ed1f9a28d80b19703ed9bb8ba10ca` (gated: auto) | `Divya` (F), `Rohit` (M) [V] | AWS GPU (fits L4) | Apache-2.0, a caption that can ask for "conversational, moderate pace, close mic" [V] | weak third-party MOS (1.86) [P]; no Hindi emotion rendering [V]; code-mixing undocumented |
| 11 | **Vyom-TTS-Hindi-3B** (ATX Labs) | `atx-labs/Vyom-TTS-Hindi-3B` @ `55443940845566d69777b037ade476267c7fbc62` (gated: auto) | one female voice | AWS GPU | the newest Hindi Orpheus fine-tune (Aug 2026), MIT card, "expressive female voice" [V] | its own card reports WER 29% (normal Hindi), 46% on numbers and artefacts on English words [V]; Llama chain; training data not stated |

**Controls (re-render, not new arms):** the two round-1 arms that won their within-voice comparison, with the same
normalised text so that round 2 is comparable to round 1: DragonHD Omni Diya expressive (V4) and gpt-realtime-2.1
`marin` expressive (V6). Add one **en-IN DragonHD Arjun** control as the male GA floor.

**Not in this round, but on the production path:** Azure **Professional Voice** (needs recordings + Limited Access) and
**personal voice** (Limited Access, consented sample). Neither can be rendered without approval and a recording.

### Reference only (the ceiling; never in the product)

| reference | why it matters | rule |
|---|---|---|
| **Google Gemini TTS / Gemini Live** (Gemini 2.5 Pro TTS, 3.1 Flash TTS, 3.1 Flash Live) | #1 in 9/10 languages in the Indian study [P]; the owner's "smoothness" target [P] | third-party and `ct-no-gemini-api-for-minors`; adult raters only; outputs never become training or prompt data |
| **ElevenLabs v3 / v4** | #2 in the Indian study (v3, BT 1056) [P]; audio tags `[laughs]` `[sighs]`; Hindi listed for v3 and v4 [V] | third-party; reference only |
| **Sarvam Bulbul v3 (v4 announced 2026-07-30)** | the Indian-built leader, 30+ Indian voice artists, Hinglish-tuned [V]; v4 claims "richer emotion" but has no published spec yet [S] | third-party API, closed weights [S]; reference only |

The licence-barred open models (Voxtral-4B-TTS, Higgs Audio v3, OmniVoice, Fish S2 Pro) and Maya Research's proprietary
**Maya 2** (2B, 11 Indic languages, API or Baseten only [V]) are also reference-only.

---

## 1. The bar, and how each arm gets a fair hearing

Raters' failure list (round 1): reading instead of talking; English-accented Hindi and an accent switch between Hindi
and English words; timbre change mid-line; wrong numbers and words (27, 35, total, 10, rukte); pauses on random words
as fake emphasis; punctuation read aloud; too slow or too rushed; spliced breaths heard as "moaning" (clips stay OFF);
a laugh must be native, in context, and flow into the next sentence.

Rendering rules that follow from it (apply to every arm):
- **Text.** The five round-1 lines from `blind-test.html` (`M.scenes`, L1-L5), unchanged. They are already
  normalised: numbers as Hindi words (सत्ताईस, पैंतीस, बासठ, बीस, तीस, पचास, सात, पाँच, बारह), English words in Latin
  script (tens, total, Cold drink, burp, divide, pizza). Before sending, strip the exclamation and question marks only
  for engines that read punctuation aloud (MAI did) and never send `...`. Keep `।`, `,`, `?`, `!` for the rest.
- **Script exceptions.** IndicF5-family and any model that mangles Latin script (measured 0/10 on IndicF5 [P]) gets a
  Devanagari-transliterated variant. Apply it to Vyom and Indic Parler only if a first take mangles the English words.
- **One synthesis per line.** Never sentence-split with artificial gaps (Veena's round-1 handicap [P]).
- **Laugh (L2).** Only where the engine produces it natively: Omni `[laughter]` (measured to render, not to be spoken,
  on hi-IN Omni [P]); Nova Sonic and VibeVoice may laugh on their own; Chatterbox via exaggeration. Never splice.
- **Delivery note.** Arms that take one (Nova Sonic system prompt, VoxCPM2 / Parler description, Omni `express-as`) get
  the same short band, never a sentence she could recite: warm, conversational, talking to a 9-year-old, unhurried,
  one Indian accent for Hindi and English words alike.
- **Takes and stimuli.** 3 takes per cell, pick nothing by hand (the page samples a take), PCM to -26 LUFS as in v2.

---

## 2. What the platforms actually offer today (measured)

| fact | value | evidence |
|---|---|---|
| Azure Speech voices for hi-IN + en-IN | 51 in centralindia, 50 in eastus2 | `voices/list` both regions [M] |
| Only in centralindia | `hi-in-diya:DragonHDOmniIndicNeural`, `hi-in-hazelmori:DragonHDOmniIndicNeural` (Preview) | [M] |
| Only in eastus2 | `hi-IN-Diya:DragonLatestNeural` (Preview) | [M] |
| GA HD Indian voices | en-IN `Aarti`, `Arjun`, `Diya`, `Lavanya`, `Meera`, `Neerja` `:DragonHDLatestNeural` | [M] |
| MAI-Voice hi-IN (all Preview) | Priya, Kavya, Dhruv, Arjun × {2, 2-Flash, 2.1, 2.1-Flash}; Grant/Harper 2.1 (not Indian personas [P]) | [M] |
| southindia Speech | voices/list 503 (not a Speech region) | [M], as `docs/ops/INDIA-MOVE.md` |
| OmniIndic probe, L1, from the US sandbox | Diya: 200, TTFB 1.83 / 1.65 s, audio 7.95 / 7.35 s. Hazelmori: 200, TTFB 1.68 / 1.63 s, audio 8.10 / 6.70 s | [M] n=2 each |
| Same path, same line, baselines | en-IN Diya DragonHD TTFB 1.29 / 1.22 s; hi-IN Kavya MAI-2.1-Flash 2.27 / 2.43 s | [M] n=2 each |
| Foundry audio models (Direct, OpenAI format) | eastus2: gpt-4o-mini-tts 2025-12-15, gpt-audio-1.5, gpt-live-1, gpt-realtime-2.1 (+mini). southindia: gpt-realtime-2.1 (+mini), gpt-live-1, no TTS model. **No Voxtral or other third-party TTS listed** | ARM `locations/*/models` [M] |
| Voice Live models | gpt-realtime-2.1 (+datazone, mini), gpt-5.6-terra/luna, azure-realtime, phi4-mm-realtime and others; custom voice works in Voice Live | Learn, updated 2026-09-29 [V] |
| Omni SSML | `express-as` yes, `<lang>` yes, `<break>` **no**, `<prosody>` no, `<phoneme>` no; `temperature` 0.3-1.0, `top_p`, `top_k`, `cfg_scale` 1.0-2.0 (speed/relevance) | Learn HD voices, updated 2026-09-24 [V] |
| Polly generative India | `Kajal` en-IN (+ hi-IN) in us-east-1 and **ap-southeast-1**; none in ap-south-1 | `describe_voices` [M] |
| Nova 2 Sonic | `amazon.nova-2-sonic-v1:0` in us-east-1; absent in ap-south-1 and ap-southeast-1 | Bedrock `list_foundation_models` [M]; voices kiara/arjun for hi-IN and en-IN [V] |
| AWS GPU Mumbai | g5/g6/g6e offered; **On-Demand and Spot G/VT quota 0** | EC2 offerings + Service Quotas [M] |

The TTFB numbers above are US-sandbox → Central India (about 1 s of extra path versus the 228 ms DragonHD p50 measured
to eastus2 [P]). They only compare voices on one path; they are not India latencies. The OmniIndic vs DragonHD gap is
about +0.4 s on equal footing [M, n=2]; MAI Flash was +1.0 s on the same path.

---

## 3. Hosted candidates on our platforms

| system | Hindi / Hinglish evidence | code-switch | expressiveness control | latency | licence / status | India hosting |
|---|---|---|---|---|---|---|
| **DragonHD Omni Indic** (`hi-in-diya`, `hi-in-hazelmori`) | none published; never rendered here | Omni: automatic language detection + `<lang>` [V] | `express-as` style names (ecstatic, joking, reassuring, …), paralinguistics on all languages [V]; temperature/top_p/cfg_scale | +0.4 s vs DragonHD on one path [M] | Preview | **centralindia** [M] |
| DragonHD en-IN (Diya, Arjun, Meera, Neerja, Aarti, Lavanya) | round 1: no voice passed; "English woman speaking Hindi", "dual accent" [P] | `<lang xml:lang="hi-IN">` | no styles; tags spoken as words on en-IN [P]; `<break>`; rate honoured despite docs [P] | 228 ms p50 eastus2 [P] | GA, $22/M [V] | centralindia [M] |
| MAI-Voice-2 / 2.1 (Priya, Kavya, Dhruv, Arjun; HD and Flash) | round 1 V5 read punctuation aloud [P]; the vendor claims 45.5% vs human 44% preference across 11 languages [V] | Hindi-English code-switching named in the model card [V] | StyleList `express-as` only [P] | HD ~1 s TTFB [P]; Flash 320 ms eastus2 [P], 2.3 s on the US→CI path [M] | Preview; "not recommended for production" [S]; from $22/M [S] | centralindia [M] |
| gpt-realtime-2.1 / gpt-live-1 / gpt-audio-1.5 (`marin`, `cedar`) | round 1 V6: expressive won 8-1 but kept the accent problem [P] | switches language mid-sentence [S] | prose instructions; no non-verbals on request (0/18) [P] | 776 ms first audio lane A [P] | GA | rt-2.1 and live-1 in **southindia** [M] |
| Voice Live (rt-2.1 + Azure voice, or `azure-realtime` native meera/diya) | rendered in v1 only on other passages [P] | as the voice used | voice `rate`, custom lexicon [P] | 858 ms (B), 476 ms (C) [P] | GA (models listed) | check the region tab before use [U] |
| **Professional Voice / personal voice** | the production route; hi-IN supports HD, multi-style and cross-lingual training [P] | cross-lingual hi-IN → en-IN [P] | multi-style sets | as DragonHD [U] | Limited Access; $48/M HD + $4.032/h hosting [P] | Speech regions [U] |
| **Amazon Nova 2 Sonic** (`kiara`, `arjun`) | "officially supported" for Hindi and Indian English [V]; no independent Hindi evaluation found | polyglot voices and code-switching within a sentence [V] | system prompt only; no pitch, accent or rate control [V] | "low latency" [V], unmeasured | GA; speech in $3/M, speech out $12/M tokens [S]; output watermark [V] | us-east-1 only of the regions checked [M] |
| **Amazon Polly generative** `Kajal` | none found | bilingual en-IN + hi-IN voice [V] | a subset of SSML; no newscaster style [V] | streaming and bidirectional streaming [V], unmeasured | GA, $30/M chars [V] | ap-southeast-1 nearest [M] |

## 4. Open-weight candidates

GPU is for real-time serving. The offline render for the blind test fits any 24 GB card except VibeVoice-7B (L40S).

| model | licence (commercial?) | Hindi / Hinglish evidence | code-switch | expressiveness | latency / GPU | verdict |
|---|---|---|---|---|---|---|
| **Veena** | Apache-2.0 ✅; "Llama architecture" (ask Maya about weight lineage) [P]; 4 real artists' voices [V] | built for hi + en + code-mixed; MOS 4.2 (vendor, no method) [V]; 10/10 terms [P] | native [V/P] | none yet ("planned") [V] | <80 ms H100, ~120 ms A100-40GB, ~200 ms 4090 (vendor) [V]; 3B needs ≥ ~600 GB/s per real-time stream [E, `t4-cannot-serve-3b-codec-tts`] | **render (#2)** |
| **Svara-TTS v1** | Apache-2.0 card ✅ + Llama 3.2 Community Licence chain [P]; data terms [U] | 10/10 terms [P]; ~50 speakers from read corpora [V] | "common patterns work" [V] | `<happy> <sad> <anger> <fear> <clear>` [V] | ~280 ms A100 (Orpheus class) [P] | **render (#5)** |
| **VibeVoice-Hindi 7B / 1.5B** (community) | MIT ✅ (base Microsoft VibeVoice MIT [V]); Hindi data [U] | the model card's own claim only [V] | the card says hi + en | spontaneous conversational prosody (base model) [V] | 7B ~18 GB bf16 [E]; no Hindi streaming [U] | **render (#6)** with shipped speaker prompts only |
| **VoxCPM2** | Apache-2.0 ✅ | 30 languages incl. Hindi [V]; 10/10 terms [P] | no tags needed [V] | description-based voice design and style [V] | RTF 0.30 (4090), 0.13 with Nano-vLLM; ~8 GB [V] | **render (#8)** |
| **Chatterbox Multilingual V3, Hindi pack** | MIT ✅ | CER 2.55% on the Hindi pack [V] | not documented | exaggeration knob [P]; PerTh watermark [V] | ~300 ms TTFB H100, 0.5B [V] | **render (#9)**, consented clone only |
| **Indic Parler-TTS** | Apache-2.0 ✅ | NSS 84.8% [P]; MOS 1.86 third-party [P] | not documented | caption: pitch, rate, expressivity, noise [V]; no Hindi emotion [P] | 0.9B, slow [P] | **render (#10)** |
| **Vyom-TTS-Hindi-3B** | MIT card ✅ + Llama chain [V] | WER 16.6/29.1/45.9% (complex/normal/numbers, own card) [V] | "minor phonetic artifacts" on English [V] | not stated | 3B codec, like Svara | **render (#11)**, optional |
| Svara voiceclone-beta | Apache-2.0 | - | - | zero-shot cloning | - | no (cloning) |
| Orpheus `3b-hi-ft-research_release` | ft Apache, pretrain Llama 3.2 [V] | - | - | `<laugh>` family tags [P] | - | superseded by Svara/Vyom on the same base |
| IndicF5 / F5-Hindi | MIT (gated) / CC-BY-4.0 | last of 7 in the Indian study [P]; 0/10 Latin terms [P] | needs transliteration | none | not streaming [P] | no (`indicf5-live-loop`) |
| Voxtral-4B-TTS (Mistral) | **CC BY-NC 4.0** ❌ [V] | Hindi among 9; vendor reports its strongest cloning preference on Hindi (~80%) [S] | - | - | - | reference only; not on Foundry [M] |
| Higgs Audio v3 (Boson, 2026-06-04) | **research / non-commercial** ❌ [S] | 102 languages [S] | - | inline emotion, prosody, SFX [S] | 4B | reference only |
| OmniVoice (k2-fsa) | **CC BY-NC weights** ❌ (code Apache) [V] | 600+ languages; no Hindi numbers on the card [V] | - | `[laughter]`, voice design [V] | RTF 0.025 [V] | reference only |
| Fish S2 Pro | research licence ❌ [V] | hi listed [P] | - | - | - | reference only |
| CosyVoice 3, IndexTTS-2, Qwen3-TTS, Sesame CSM-1B, Kyutai TTS / Pocket TTS, Spark-TTS, Dia2, Maya1, Chatterbox Turbo/Flash/Nano | various | **no Hindi** in the official language lists [V] (Kyutai Pocket TTS has an unofficial community Hindi model [S]) | - | - | - | out |
| Human-1 (Josh Talks, Moshi-based Hindi full-duplex) | no weights found on HF [M] | naturalness 4.10 vs human 4.55 (paper) [S] | - | - | - | watch: the only Hindi S2S research system |

## 5. Cost per hour of teacher speech

Basis [E]: 1 hour of teacher speech ≈ 43,200 characters (720 chars/min, the v2 basis; the measured Hinglish rate of
12 chars/s [P] gives the same). A session-hour is 40% of that (17,300 chars, as in v2).

| arm | price | $ per hour of teacher speech | note |
|---|---|---|---|
| DragonHD en-IN | $22/M chars [V] | **0.95** | GA |
| DragonHD Omni Indic | not on a retail meter [U]; DragonHD rate assumed | ~0.95 [U] | confirm the billed meter after one day |
| MAI-Voice-2.1 HD / Flash | from $22/M [S] / $15/M? [U] | 0.95 / ~0.65 | Preview |
| gpt-4o-mini-tts | ~$21.7/M equivalent [P] | 0.94 | |
| Polly generative Kajal | $30/M [V] | **1.30** | AWS credit |
| Nova 2 Sonic | speech out $12/M tokens, in $3/M, text extra [S] | not computable: output speech tokens per second unpublished [U] | S2S also bills context; measure from one session |
| Voice Live B (rt-2.1 + Azure voice) | ~$0.042/min [P] | ~2.5 | excludes context re-processing |
| gpt-realtime-2.1 native | ~$0.082/min [P] | ~4.9 | excludes context |
| Professional Voice HD | $48/M + $4.032/h per hosted model [P] | 2.07 + hosting (~$2.9k/month per voice) | production route |
| Self-host 3B codec (Veena/Svara/Vyom) on AWS g6e.xlarge (L40S 48 GB) | $1.861/h us-east-1, **$2.235/h ap-south-1** [M, Pricing API] | ~0.14-0.28 at 8-16 real-time streams per GPU [E]; 2.24 at 1 stream | L40S ~864 GB/s → ~130 tok/s per fp16 stream vs 82 needed [E]; concurrency unmeasured |
| Self-host on g6.xlarge (L4 24 GB) | $0.805 / $0.966 per hour [M] | n/a for 3B fp16 (L4 ~300 GB/s is T4-class, < real time [E]); fine for 0.5B Chatterbox / 0.9B Parler / 2B VoxCPM2 [U] | offline rendering is fine on L4 |
| Azure A100 VM, Central India | $5.142/h [P] | ~0.1 at 50 sessions [P] | the Azure hedge from v2 |

## 6. Render plan within this workflow's caps (AWS $80, Azure $20)

- **Azure (≈ $1):** OmniIndic Diya + Hazelmori × 5 lines × {plain, `express-as` per line from the Omni list (L2
  `joking` + `[laughter]`, L3 `surprised`, L4 `reassuring`, L5 `curious`)} × 3 takes = 60 clips × ~110 chars ≈ 6.6k chars;
  plus 3 controls × 5 × 3 takes. Render in **centralindia**. No `<break>` (unsupported on Omni). Try `temperature=0.7`
  (default) and one lower-variance arm only if take-to-take timbre drift shows up (a round-1 failure).
- **AWS hosted (≈ $1):** Polly `Kajal` generative from ap-southeast-1 (hi-IN; en-IN as a second take); Nova 2 Sonic from
  us-east-1 with `kiara` and `arjun`: send each line as a text turn with a system prompt to say it verbatim, keep only
  takes whose transcript matches the line, and report the verbatim rate as a result in its own right.
- **AWS GPU (≈ $6-15):** one `scripts/gpu/run.py` job on `g6e.xlarge` (4 vCPU fits the 8-vCPU G/VT quota) in us-east-1,
  `--max-minutes 120`, self-terminating. Runs Veena (4 voices), Svara (Hindi F/M, with tags), VibeVoice-Hindi-7B,
  VoxCPM2 (F and M designs), Chatterbox-hi (only if a consented reference clip exists), Indic Parler (Divya, Rohit) and
  Vyom. Weights from HF at build time (allowed for experiments; production must mirror them). Record each repo's
  revision as listed above and the sha256 of every downloaded weight file in the run manifest.
- Then: ASR round trip on the numbers and English terms (the raters' "wrong numbers and words" failure) with the
  project's non-gpt-4o scorer, and loudness/codec matching to -26 LUFS PCM, **before** anything reaches a rater.

## 7. What this scan cannot tell you

- Whether any arm sounds like a person talking to a child. No human has heard OmniIndic, Nova Sonic, Polly Kajal,
  VibeVoice-Hindi or Vyom. Veena and Svara were heard only as one v2 passage clip each [P].
- India latency for anything. Every number here is from a US sandbox; AWS hosted arms are not in Mumbai at all.
- OmniIndic's price, persona origin and GA date (no Learn page names it yet; it appears only in `voices/list`) [U].
- Whether a community fine-tune (VibeVoice-Hindi, Vyom) was trained on commercially licensed data [U]. A win by either
  would have to be re-earned by a LoRA on our own consented recordings before it could ship.
- The Voice Arena Hindi leaderboard (one search snippet ranked Gemini 3.1 Flash TTS 3, ElevenLabs v3 6, Bulbul v3 13 and
  Dragon HD Omni 17) rendered empty when fetched, so it is not used [U].

## Sources

- Azure: `voices/list` (centralindia, eastus2, 2026-10-04) and the ARM `locations/{region}/models` catalogue [M];
  learn.microsoft.com speech-service `high-definition-voices` (updated 2026-09-24) and `voice-live` (updated 2026-09-29);
  MAI-Voice-2 model card (microsoft.ai, 2026-06-02).
- AWS: Polly `describe_voices` per region, Bedrock `list_foundation_models`, EC2 offerings, Service Quotas and the Pricing API
  (2026-10-04) [M]; docs.aws.amazon.com Polly generative voices and Polly pricing; Nova 2 Sonic AI Service Card and
  language-support page; Nova pricing via third-party summaries [S].
- Model cards (HF API, revisions as listed): maya-research/Veena, maya-research/maya1, kenpath/svara-tts-v1,
  kenpath/svara-tts-voiceclone-beta, tarun7r/vibevoice-hindi-7b and -1.5B, microsoft/VibeVoice-1.5B, openbmb/VoxCPM2,
  ResembleAI/Chatterbox-Multilingual-hi and chatterbox-flash, ai4bharat/indic-parler-tts and IndicF5,
  atx-labs/Vyom-TTS-Hindi-3B, k2-fsa/OmniVoice, mistralai/Voxtral-4B-TTS-2603, fishaudio/s2-pro,
  FunAudioLLM/Fun-CosyVoice3-0.5B-2512, IndexTeam/IndexTTS-2, SparkAudio/Spark-TTS-0.5B, sesame/csm-1b,
  nari-labs/Dia2-2B, canopylabs/3b-hi-ft-research_release; Resemble "Chatterbox Multilingual v3" article; Baseten
  library "Maya 2".
- Studies: arXiv 2604.21481 ("Preferences of a Voice-First Nation", 120k comparisons); arXiv 2604.23295 (Human-1, Josh
  Talks); Boson AI Higgs Audio v3 pages; Kyutai Pocket TTS announcement; Sarvam Bulbul v4 coverage (explainx.ai);
  ElevenLabs v3/v4 docs; Google Gemini 3.1 Flash TTS docs.
