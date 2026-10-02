# ASR for Indian children: Hindi, English and Hinglish (strategy + E0 measurement + E1 protocol)

Date 2026-10-02. Scope: speech recognition of what a child aged 6-15 says to the Taxila voice teacher, in
pure Hindi, Indian English and Hindi-English code-mix. Covers four things: what is published (2023-2026),
what the Azure first-party engines actually do (E0, measured today, synthetic), the ASR strategy, and the
E1 protocol for real children.

**Never copy any line of this document into a prompt.** The ASR context strings quoted in §3 are inputs to
an ASR model, not to the teacher. §3.4 shows that the "sentence-shaped text gets recited" law applies to ASR
context too.

Evidence tags: **[M]** measured here today (n and method given); **[H]** harvested measurement from an earlier
product (`docs/harvest/`); **[P]** peer-reviewed or arXiv paper; **[V]** vendor documentation or claim;
**[U]** our inference, unmeasured.

Builds on: `docs/harvest/companion-tech.md` (STT row 3, live-floor, `turnCoverage` noise-to-Hindi),
`docs/harvest/gurukul.md` §3.6 (script truth), `context/measurements.md` (realtime bake-off, endpoint table,
"E1 is still the first real measurement to make"), `voice/relational-os-teacher.md` (mishear-and-correct),
`safety/dpdp-deep.md` (NM-12 ephemeral audio, NM-13 no child voice before verifiable parental consent (VPC), §7.10 research exemption).

Artifacts: `asr-e0/stimuli.mjs`, `asr-e0/score.mjs` (deterministic scorer, reused unchanged for E1),
`asr-e0/probe.mjs`, `asr-e0/e0-results-2026-10-02.json` (every row + aggregates), `asr-e0/audio/*.ogg`
(the synthetic child clips, for listening).

---

## 0. Bottom line

1. **ASR in Taxila is an evidence channel, not the ear.** `gpt-realtime-2.1` hears the child's audio
   natively. The transcript is a side lane produced by a separate transcription model. That lane feeds the
   learner model, the grader ("a model never grades: classify against verified keys") and parent reports. So
   the bar is not "good WER". It is: **never turn a wrong or absent answer into a right one**, never invent
   speech in silence, and keep NCERT terms recoverable in a predictable script.
2. **Live lane: `gpt-live-transcribe` (deployment `taxila-live-transcribe`) with a per-lesson `keywords`
   list plus a short speaker-and-script `prompt` that contains no vocabulary.** This was the best arm in E0
   on the child-shifted clips [M]: skeleton CER 0.043, key-term recall 0.93, answer accuracy 14/15, 0 wrong-script
   clips, 0 decoy insertions, 0/3 output on near-silence. Without context, the same model wrote Japanese,
   Kannada, Bengali and Nastaliq into 5/42 Hindi clips [M].
3. **Second-opinion lane, for answer-bearing turns only: Azure Speech Fast Transcription `hi-IN`+`en-IN`.**
   It never hallucinated on silence (0/5) and never produced a foreign script [M]. Its output is all
   Devanagari when the locale is `hi-IN` only, and mixed script with `en-IN` added. The grader reads both
   lanes through a script-agnostic skeleton. If the two disagree on the answer value, the turn is ungraded
   and the teacher makes a natural repair move. She does not grade on a guess.
4. **Do not use `gpt-4o-transcribe` / `gpt-4o-mini-transcribe` as live or grading lanes.** On near-silence,
   `gpt-4o-transcribe` returned text in **5/5** clips in every configuration [M]. With a vocabulary list in
   its prompt, 3/5 of those outputs were *lesson content*, including a fluent, correct-sounding answer
   produced from a 0.3 s clip [M]. `gpt-4o-mini-transcribe` with the same prompt recited the whole term list,
   or wrote a paragraph of science, on **5/5** near-silent clips and on 5 speech clips (CER up to 44) [M].
   This is the Meera recitation law, reproduced in an ASR.
5. **Azure Speech `phraseList` is a no-op for `hi-IN`** on Fast Transcription. C2 matched C0 on every
   metric [M], consistent with the docs' "for locales where the feature is enabled" [V]. Keyword biasing
   therefore lives in the live-transcribe `keywords` field.
6. **Home TV at 10 dB SNR breaks every engine** (skeleton CER 0.56-0.97 on the noisy arm). Every engine also
   transcribes the TV itself, because TV audio *is* speech [M]. No engine choice fixes this. The fix sits
   upstream (near-field capture, the client floor, a "that wasn't the child" predicate) and must be measured
   in real homes in E1.
7. **Endpointing for children must be longer, item-aware and child-adaptive.** Children's response latency
   grows with utterance complexity at about twice the adult slope (79 vs 37 ms per morpheme [P]). Taxila
   already measured `semantic_vad` auto-response splitting a mid-thought pause [M, measurements.md]. Use a
   think-time window keyed by item type and by that child's measured pause profile. Never fill the child's
   planning pause. No synthetic backchannels (inherited [H]).
8. **Nothing about real children is measured yet.** E0 is synthetic: TTS told to sound like a 9-year-old, then
   pitch and formant shifted. It measures the *instrument* (script behaviour, hallucination, biasing side
   effects, latency), not child WER. **E1 (§6) is the gate**: 80 children, consented, three class bands,
   real phones, real homes.

---

## 1. What is published (2023-2026)

### 1.1 Why child speech is harder (the general literature)

| finding | source | what it means for Taxila |
|---|---|---|
| A causal analysis over Wav2Vec2, HuBERT, Whisper and MMS on two child corpora: **age and the number of words in the clip** have the largest effect on error, then background noise and pronunciation ability. Fine-tuning on child speech reduces the age effect, but the word-count sensitivity *persists* | Singh, Sahidullah, Kinnunen 2025 [P] ([arXiv 2502.08587](https://arxiv.org/abs/2502.08587)) | Short answers ("पाँच", "हाँ") are the hardest shape and the most common shape of a child's turn in tutoring. E0 and E1 report short-answer recall separately |
| Kid-Whisper: fine-tuning Whisper on cleaned MyST data, WER 13.93 → 9.11 (small) and 13.23 → 8.61 (medium); the gain generalises to unseen child sets | Attia et al. 2024 [P] ([arXiv 2309.07927](https://arxiv.org/abs/2309.07927)) | Child fine-tuning works, but Taxila cannot fine-tune a first-party Azure transcribe model. We can only choose, give context and post-process (§3). Fine-tuning becomes possible only through Azure Custom Speech (§4.4) |
| Whisper hallucinates more where a clip has long non-vocal stretches (5.3 s vs 3.5 s in hallucinating vs clean segments); 1.4% of segments hallucinated, 38% of those harmful | Koenecke et al., FAccT 2024 [P] ([arXiv 2402.08021](https://arxiv.org/abs/2402.08021)) | Children pause a lot while thinking. E0 §2.3 reproduces it on gpt-4o-transcribe, and worse |
| Dutch child speech, 9 models: fine-tuned Whisper-medium best, WER 5.5% on clean JASMIN but **70.4%** on noisy DART. ASR-vs-prompt agreement can certify 42% (clean) / 18% (noisy) of utterances at ≥98.3% precision | 2026 [P] ([arXiv 2605.28833](https://arxiv.org/abs/2605.28833)) | Recording conditions dominate. The same certification idea (agree with a known reference, otherwise do not trust) is the basis of the two-lane grader (§4.2) |
| Children's response latencies are longer than adults' and track the partner's latency (adult +1 s → infant +1.26 s; infants ~1 s on average) | Nguyen et al. 2022, Bayesian meta-analysis of 26 studies [P] ([Child Development](https://srcd.onlinelibrary.wiley.com/doi/abs/10.1111/cdev.13754)) | Endpointing must expect long gaps, and a slow teacher slows the child too (§5) |
| Child response latency rises 79 ms per morpheme of utterance complexity vs 37 ms for mothers | Verbal response latency in mother-child dialogue, 2025 [P] ([LLD 22(2)](https://www.tandfonline.com/doi/full/10.1080/15475441.2025.2510223)) | A long explanation needs a longer pre-onset wait than a yes/no (§5.2) |
| A children's reading-ASR deployment (Bambara, 60 children, 55 h): WER 0.42 → 0.22 after adaptation; **children under 10 are the main residual error**; disaggregating by age was essential | 2026 [P] ([arXiv 2606.31508](https://arxiv.org/abs/2606.31508)) | E1 stratifies by class band and reports per band. A single pooled number would hide classes 1-3 |

### 1.2 Hindi, Hinglish and Indian children

| finding | source |
|---|---|
| **HiACC**, the first Hinglish code-switched corpus with children: 20 children aged 10-14 (10 M / 10 F), 2.04 h, 1,858 utterances, recorded in a classroom with road and playground noise; adults 3,318 segments. **Convention: Hindi words in Devanagari, English words in Latin** (the convention E0 and E1 adopt). Baseline WER (adults/children): Whisper-medium 16/18, MMS-1b-all 31/36, XLS-R-300m 38/40. Children switch *within* a sentence far more often than adults: 60.7% vs 36.7% of switches. CC BY-NC 4.0 on Zenodo | Singh, Singh, Kadyan 2025 [P] ([PMC12329218](https://pmc.ncbi.nlm.nih.gov/articles/PMC12329218/), [Zenodo 15551669](https://zenodo.org/records/15551669)) |
| Code-switching raises WER by 30-50% relative compared with monolingual input (cited in HiACC) | same |
| **Vistaar / IndicWhisper** (AI4Bharat): Whisper fine-tuned on 10.7k h. Hindi WER: Kathbath 10.3, Kathbath-Hard 12.0, FLEURS 11.4, CommonVoice 15.0, MUCS 12.0, **Gramvaani (phone, rural) 26.8**; Hindi average 13.6. Best on 39/59 benchmarks | Bhogale et al., Interspeech 2023 [P] ([arXiv 2305.15386](https://arxiv.org/abs/2305.15386), [GitHub](https://github.com/AI4Bharat/vistaar)) |
| **IndicConformer-600M-multilingual**: hybrid CTC+RNNT over all 22 scheduled languages, MIT licence, trained on IndicVoices (23.7k h, 76% extempore, 51k speakers, 400+ districts). No code-switch or child WER published | AI4Bharat [V] ([HF](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual), [IndicVoices](https://huggingface.co/datasets/ai4bharat/IndicVoices)) |
| **LAHAJA**, a multi-accent Hindi benchmark (speakers whose first language varies), shows large accent spread in Hindi ASR | Javed et al., Interspeech 2024 [P] ([arXiv 2408.11440](https://arxiv.org/abs/2408.11440)) |
| **Sarvam Saaras v3**: ~19% WER on IndicVoices (19.31% on the top-10-language subset) vs ~22% for v2.5. Claims to beat GPT-4o-transcribe and Gemini 3 Pro on Indian benchmarks. Streaming "Fast" mode under 150 ms to first token. No child evaluation. No quantified code-mix number on the blog | Sarvam [V] ([blog](https://www.sarvam.ai/blogs/asr)) |
| Sarvam's own evaluation note: WER wrongly penalises डॉक्टर vs doctor, digits vs spelled numbers (500 / पांच सौ / ५००) and colloquial variants. They propose LLM-WER, intent and entity scores | Sarvam [V] ([blog](https://www.sarvam.ai/blogs/evaluating-indian-language-asr)) |
| Gurukul (harvest): Sarvam ASR returns **Devanagari for English words too**, so a romanised marker lexicon measured code-switch ratio 0.000. Azure ASR WER on mixed-script Hinglish was 0.45. Whisper large-v3 CER on distinct-script code-switch was 32-52% | [H] `gurukul.md` §3.6 |
| Entity-dense code-mix (digits, amounts, brand names) is where commercial Indic ASR fails: Deepgram Nova-3 entity hit rate 0.16 on Telugu. 22k synthetic TTS utterances (~$50) + LoRA raised an open model to 0.47 (3× commercial); about 100% of the gain came from the synthetic entity-dense set | 2026 [P] ([arXiv 2605.03073](https://arxiv.org/abs/2605.03073)) |
| Wadhwani AI's Vachan Samiksha (oral reading fluency, Hindi/Gujarati/English, ASR fine-tuned "for student voices") is deployed in Gujarat government schools (since Aug 2023) and Rajasthan (since May 2025). A public RFP evaluates it on 4,000 recordings from Grades 3-8. No public WER | [V] ([Wadhwani](https://www.wadhwaniai.org/impact/education-solutions/oral-reading-fluency/), [RFP](https://www.samsstc.com/rfp-tender/rfp-tender-description/rfp-for-model-evaluation-of-aienabled-oral-reading-fluency-solution-in-hindi-and-gujarati-lords-education-and-health-society-lehs/172)) |

**Under the Azure-only directive, Sarvam, IndicWhisper, IndicConformer and HiACC-trained models are
research context, not build options.** IndicConformer (MIT) could in principle be self-hosted on Azure
Container Apps. That would be Azure compute, but it would need its own owner decision (§7, open question
O4). HiACC is CC BY-NC, so it can serve as an *evaluation* set for research but not as product training data.

### 1.3 The Azure first-party candidates (what exists on 2026-10-02)

| engine | surface | Hindi / code-mix | biasing / context | status on Taxila resource (eastus2) |
|---|---|---|---|---|
| `gpt-live-transcribe` (released 2026-07-29) | realtime transcription session or Realtime input transcription | 22 languages on Common Voice, error rate 19.70% vs 20.33% for gpt-realtime-whisper; 9.60% vs 11.65% on real-world audio [V] | `prompt`, `keywords`, `languages`; earlier turns are used automatically as context [V] | deployed as `taxila-live-transcribe`; measured (D arms) |
| `gpt-transcribe` (batch sibling) | `/audio/transcriptions` | same family [V] | same | not deployed; not measured |
| `gpt-4o-transcribe` (2025-03-20) | batch + realtime | yes | `language`, `prompt`, logprobs | `taxila-transcribe`; measured (A arms) |
| `gpt-4o-mini-transcribe` (2025-12-15) | batch + realtime | yes | same | measured (B arms) |
| `gpt-realtime-whisper` | realtime | yes | — | priced $1.02/h in eastus2 [V, Azure retail API]; not measured |
| Azure Speech Fast Transcription | REST `transcriptions:transcribe` 2025-10-15 | `hi-IN`, `en-IN`, multi-locale | `phraseList` (≤2,000 phrases, "where enabled") [V] | measured (C arms); $0.36/audio-hour [H] |
| Azure Speech **LLM Speech** (enhanced mode) | same REST, `enhancedMode` | Hindi in the supported list; multilingual by default; prompt-tuning up to 4,096 chars [V] | `prompt`, `phraseList` | **"Enhanced mode is currently not supported yet"** on eastus2 [M]; needs a supported region |
| **MAI-Transcribe-2** (2026-09-03, preview) | same REST, `enhancedMode.model` | 60 languages incl. Hindi; **automatic code-switching "for commonly blended pairs such as Hinglish"**; verbatim style keeps fillers and false starts; FLEURS-60 WER 5.2% [V] | `phraseList` keyword biasing | **"not supported yet"** on eastus2 [M]. Served from East US, West US, West US2, North Europe, **Central India**, Southeast Asia [V]. Untested |

Sources: [OpenAI transcription guide](https://developers.openai.com/api/docs/guides/transcription),
[GPT-Live-Transcribe announcement](https://community.openai.com/t/gpt-live-transcribe-and-gpt-transcribe-two-new-transcription-models-in-the-api/1388318),
[Azure realtime audio](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio),
[MAI-Transcribe on Azure Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/mai-transcribe),
[MAI-Transcribe-2 model card](https://microsoft.ai/pdf/MAI-Transcribe-2-Model-Card.pdf),
[LLM Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/llm-speech),
[phrase list](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/improve-accuracy-phrase-list),
[LLM Speech 2607](https://devblogs.microsoft.com/foundry/announcing-azure-ai-speech-llm-2607/).

MAI-Transcribe-2 is the most interesting candidate on paper: it claims Hinglish code-switching, has verbatim
mode (self-corrections matter for grading, see §2.2 d01), offers keyword biasing and is served from Central
India, which also suits India latency and data residency. **It must be measured before it is believed.**
E0b (§2.5) needs a Speech resource in a served region. Provisioning one is an owner/main-loop action, not
something this research workstream does.

---

## 2. E0: synthetic instrument probe (measured 2026-10-02)

### 2.1 Method

- **Stimuli** (`asr-e0/stimuli.mjs`): 21 *child-answer* utterances in six categories:
  - short answers (7): numbers, yes, "don't know", a single term, a fraction;
  - NCERT Hinglish (7);
  - Hindi-medium pure Hindi (3);
  - Indian English (2);
  - disfluent/self-correcting (2).
  References follow the HiACC convention (Hindi in Devanagari, English in Latin). 16 items carry a
  gradable answer value with distractors.
- **Audio**: `gpt-4o-mini-tts`, voices `coral` and `sage`, told to sound like a shy 9-year-old Indian child.
  Three arms:
  - `clean`;
  - `child`: pitch and formant ×1.2 via asetrate/atempo, duration kept, approximating a shorter vocal tract;
  - `noisy`: the child arm plus two-voice Hindi TV babble at 10 dB SNR.
  Plus three non-speech clips: 3 s dithered silence, 4 s babble alone, 4 s pink noise.
  `p02-sage` came out of TTS as about 0.3 s of near-silence. It is scored below as a near-silent probe, not as speech.
- **Engines** (all first-party, Taxila Foundry resource, eastus2, called from a US build container):
  - A: `gpt-4o-transcribe`;
  - B: `gpt-4o-mini-transcribe`;
  - C: Azure Fast Transcription;
  - D: `gpt-live-transcribe`, a realtime transcription session paced at real time in 40 ms chunks.
  D arms ran on the `child` arm and non-speech only.
- **Context variants**:
  - the full ASR prompt (speaker + script convention + a 22-term list: 16 lesson terms + 6 **decoys**, terms
    that occur in no stimulus);
  - a script-only prompt (speaker + script convention, *no vocabulary*);
  - keywords (the same 22 terms);
  - Azure `phraseList`.
- **Scoring** (`asr-e0/score.mjs`, deterministic, no model):
  - `skelCER`: script-agnostic consonant-skeleton CER. Devanagari, Nastaliq and Latin map to one space.
  - `rawWER`: exact-script WER against the canonical reference.
  - `keyRecall`: answer-carrying terms, script-agnostic.
  - `keyRawRecall`: the same terms in the expected script.
  - `answer`: the value given, or the last value after a self-correction.
  - `wrongScript`: any Arabic, Bengali, Gurmukhi or other script.
  - `decoyHits`.
  - `confAUROC_bad`: how well mean token logprob, or Azure confidence, separates bad transcripts
    (key recall < 1 or skelCER > 0.25).
- n per cell: 42 clips (21 × 2 voices), one pass, no retries except on HTTP 429/5xx. Total 1,251 + 264 calls.

### 2.2 Results, `child` arm (the closest proxy) [M]

| arm | skelCER | rawWER | keyRecall | keyRaw (script) | short-answer recall | answers | wrong-script clips | decoys | conf AUROC | latency median |
|---|---|---|---|---|---|---|---|---|---|---|
| A0 4o-tx, no hint | 0.191 | 0.409 | 0.728 | 0.565 | 0.43 | 10/16 | 1 | 0 | 0.93 | 355 ms |
| A1 4o-tx, `language=hi` | 0.179 | 0.427 | 0.736 | 0.589 | 0.43 | 10/16 | 1 | 0 | 0.88 | 372 ms |
| A2 4o-tx, hi + full prompt | 0.076 | 0.230 | 0.903 | 0.736 | 0.86 | 11/16 | 0 | 0 | 0.76 | 340 ms |
| A3 4o-tx, hi + script-only prompt | 0.113 | 0.308 | 0.847 | 0.671 | 0.71 | 12/16 | 0 | 0 | 0.80 | 391 ms |
| B0 mini-tx, no hint | 0.279 | 0.489 | 0.681 | 0.538 | 0.32 | 10/16 | 4 | 1 | 0.83 | 330 ms |
| B1 mini-tx, hi | 0.256 | 0.449 | 0.669 | 0.550 | 0.32 | 10/16 | 5 | 0 | 0.81 | 326 ms |
| B2 mini-tx, hi + full prompt | **6.311** | **6.960** | 0.823 | 0.736 | 0.57 | 10/16 | 1 | **17** | 0.80 | 360 ms |
| C0 Azure fast `hi-IN` | 0.280 | 0.391 | 0.685 | 0.552 | 0.71 | 12/16 | 0 | 0 | 0.86 | 231 ms |
| C1 Azure fast `hi-IN`+`en-IN` | 0.120 | 0.230 | 0.827 | 0.712 | 0.86 | **13/16** | 0 | 0 | 0.69 | 241 ms |
| C2 Azure fast `hi-IN` + phraseList | 0.277 | 0.391 | 0.685 | 0.552 | 0.71 | 12/16 | 0 | 0 | 0.84 | 297 ms |
| D0 live-tx, no context | 0.134 | 0.259 | 0.817 | 0.721 | 0.64 | 12/16 | **5** | 0 | — | final +529 ms |
| D1 live-tx, languages + kw + full prompt | 0.044 | 0.119 | 0.927 | 0.825 | 0.93 | 15/16 | 0 | 0 | — | final +527 ms |
| D2 live-tx, kw only | 0.072 | 0.174 | 0.905 | 0.813 | 0.86 | 15/16 | 1 | 0 | — | final +570 ms |
| D3 live-tx, script-only prompt | 0.054 | 0.174 | 0.908 | 0.800 | 0.85 | 14/15 | 0 | 0 | — | final +569 ms |
| **D4 live-tx, kw + script-only prompt** | **0.043** | **0.119** | **0.933** | **0.829** | **0.93** | 14/15 | **0** | **0** | — | final +567 ms |

- "final +N ms" is the time from `input_audio_buffer.commit` to the `completed` transcript (realtime-paced
  audio). Batch latency is the full request time from a US container to eastus2. Add India↔eastus2 RTT for
  real users.
- Answer denominators of 15 are rows lost to the errors in §2.4.
- `s07` (चौबीस, 24) failed in almost every arm, written as चाबीस / Shabbies / शाबीस. The TTS voice itself
  may have mispronounced it. Treat it as a synthetic artefact until E1.

Clean and noisy arms (full table in the JSON):
- **Clean**: A2 skelCER 0.033, C1 0.071, A3 0.031.
- **Noisy (10 dB TV babble)**:
  - skelCER: A2 0.561, A3 0.713, C1 0.783, C0 0.872, A0 0.829, B0 0.972.
  - Short-answer recall: A0 0.05, C1 0.54.
  - Every engine collapses.

### 2.3 Hallucination on silence and near-silence [M]

Near-silent set: 3 s dithered silence, 4 s pink noise, and the three `p02-sage` clips (~0.3 s of
near-silence in 1.2 s). The babble-alone clip is excluded because it *is* speech: every engine transcribed the
TV news, which is correct ASR and a product problem (§4.3).

| arm | non-empty output on near-silence | of which contain lesson vocabulary |
|---|---|---|
| A0 / A1 4o-tx | **5/5** (e.g. a greeting in English, a Spanish greeting, single syllables) | 0 |
| A2 4o-tx + full prompt | **5/5** | **3**, incl. a decoy term on pink noise, a maths *question* on silence, and **a fluent, correct-sounding fraction answer from the 0.3 s clip** |
| A3 4o-tx + script-only prompt | **5/5** (short Hindi words) | 0 |
| B0 / B1 mini-tx | 0/5 | 0 |
| B2 mini-tx + full prompt | **5/5** | **5**: on pink noise, the term list recited verbatim; on silence, a 120-word Hinglish paragraph defining every listed term |
| C0 / C1 / C2 Azure fast | 0/5 | 0 |
| D0-D4 live-tx (any context) | 0/3 | 0 |

**This is the most important E0 result.** A grader that reads an A2 transcript would have marked a silent
child *correct*. The context that most improves recall on speech (a vocabulary list in a free-text prompt) is
the context that manufactures plausible answers out of silence. `gpt-live-transcribe` with the same 22 terms
in `keywords` inserted 0 decoys on speech and produced nothing on near-silence.

### 2.4 Other instrument facts [M]

- **Script**:
  - Azure `hi-IN` alone writes **every English word in Devanagari** (Latin share 0.000 on all 42 clips).
    Adding `en-IN` brings Latin back for some terms (English terms in Latin: 0.34-0.45).
  - Without a hint, `gpt-4o-transcribe` writes a foreign script, mostly **Nastaliq (Urdu)** and once
    Bengali, on 19/126 clips. `language=hi` reduces this only to 15. A script instruction in the prompt
    brings it to 0.
  - `gpt-live-transcribe` without context: 5/42 clips contain Japanese, Kannada, Bengali or Nastaliq mid-sentence.
- **Self-correction** (d01, "three, no no, four"): every engine above 0.1 skelCER kept both values in
  order, so "answer = last value" is recoverable from all of them. Azure has no verbatim switch.
  MAI-Transcribe-2 "clean" style would *delete* the false start [V], so E0b must use verbatim.
- **Confidence**: mean token logprob from `gpt-4o-transcribe` separates bad from good transcripts with AUROC
  0.76-0.93 (child arm) and 0.95 (clean, A2). Azure phrase confidence gives 0.69-0.86. The live-transcribe
  `completed` event in this session shape carried no logprobs, so the live lane has no confidence signal
  of its own.
- **Live-transcribe flakiness**: across 225 live sessions:
  - 2 refused a context field mid-run: `"The 'languages' parameter is not supported for this model"` once and
    `"The 'keywords' parameter is not supported for this model"` once. The same fields were accepted in
    every other session that carried them (D1/D2/D4, ~130 sessions), so this looks like heterogeneous
    backend replicas behind one deployment [U].
  - 3/135 sessions in the ablation never completed within 60 s.
  - The client must strip the refused field and retry, and must run a watchdog (§4.1).
- **`phraseList` on `hi-IN`**: identical output to no list on all 126 clips. It is silently ignored.

### 2.5 What E0 cannot say, and E0b

E0 cannot say anything about:
- real child phonology (substitutions such as /ʃ/→/s/, cluster reduction, Hindi-medium English);
- real disfluency timing;
- real home acoustics;
- children under 8;
- regional accents (LAHAJA shows these matter);
- WebRTC/Opus capture on low-end Android.

All of that is E1.

**E0b**, in a supported region (Central India preferred), against the same stimuli and scorer:
- MAI-Transcribe-2 verbatim, with and without `phraseList`;
- LLM Speech with a script-convention prompt;
- `gpt-transcribe` batch;
- Voice Live with MAI-Transcribe as input transcription.

Re-running costs under $1. `node asr-e0/probe.mjs run|score <workdir>` is resumable. Add configs to `CONFIGS`.

---

## 3. Script: what the transcript should look like

### 3.1 Convention

**Canonical code-mix**: Hindi words in Devanagari, English words in Latin, numbers as spoken. HiACC uses it;
the A3/D3/D4 script-only context produces it. This is the reference convention for E1 annotation and for
kit answer keys.

### 3.2 Rule: never match a single script

Engines disagree on script, and one engine disagrees with itself:
- Azure `hi-IN` writes "denominator" as डिनॉमिनेटर;
- 4o-transcribe writes Nastaliq;
- live-transcribe writes the term in Latin one turn and in Devanagari the next.

The Gurukul `romanised-lexicon-meets-devanagari-asr` rejection [H] is the same failure in a different place.
So every consumer reads transcripts through a **script-agnostic skeleton normaliser**
(`score.mjs#skeleton`: Devanagari/Urdu/Latin → one consonant skeleton, nukta folded, numerals ↔ spoken
numbers both ways).

Kit answer keys store:
1. the canonical form;
2. the Devanagari transliteration of English terms;
3. the Hindi-medium NCERT term. For example, *denominator* also stores हर, and *photosynthesis* also stores
   प्रकाश संश्लेषण. A child in Hindi mode may say either. That is a different word, not a transliteration,
   so it is a key alias, not a skeleton match.

### 3.3 Display

Children and parents never see raw ASR. Parent reports quote the child only through the canonical-form
normaliser, and only where both lanes agree [U]. A mis-scripted quote reads to a parent as "the app thinks
my child speaks Urdu". The A0 Nastaliq rate makes that a real risk.

### 3.4 ASR context follows the same prompt laws

- **No sentence-shaped vocabulary in a free-text ASR prompt.** A2 and B2 show that an LLM-based transcriber
  treats the list as content it may emit.
- Vocabulary goes only into a structured field the engine treats as hints (`keywords`). Even there, decoy
  insertions stay a standing metric.
- The free-text prompt says only *who speaks* and *which script convention to use*. It holds no terms, no
  lesson topic sentence and no example utterances.
- This is the ASR form of the inherited law "sentence-shaped prompt text gets recited". It goes in
  `rejected.md` (§8).

---

## 4. The ASR strategy

### 4.1 Lane L: the live lane (every child turn)

- **Engine**: Realtime session `input_audio_transcription.model = taxila-live-transcribe`, or a dedicated
  transcription session beside the conversation session if the realtime session cannot carry
  `keywords`/`prompt` (verify on `gpt-realtime-2.1` before the build).
- **Context, compiled per lesson by the one `compile()`**:
  - `keywords`: at most ~40 terms from the kit's concept list, in canonical form, plus Devanagari forms of
    English terms in Hindi mode and the Hindi-medium terms in Hindi mode. The E0 list had 22.
  - `prompt`: speaker age band + script convention only. Language mode (Hindi / English / Hinglish) enters as
    a convention clause, never as example text.
  - `languages`: omit. E0 shows it adds nothing over D4, and it is the field that was refused.
- **Client rules**:
  - Refuse-and-strip retry: on `invalid_parameter` for a context field, re-send `session.update` without that
    field and log a `context_degraded` event.
  - Completion watchdog: if no `completed` arrives N s after commit, mark the turn `asr_missing` and never
    fabricate.
  - Never send audio the client floor has classified as non-speech. This is the inherited client-owned floor
    [H]. Sending only gated speech is the first defence against §2.3.
- **Use**:
  - The transcript goes to the Director as *evidence*, tagged with the lesson-mode, engine and
    context-degraded flags.
  - Hot-path law [H]: no durable profile or weight update from in-call ASR. Durable learner-model updates
    happen after the session, from reconciled lanes.

### 4.2 Lane G: the grading lane (answer-bearing turns only)

An answer-bearing turn is one where the Director has an open item with a verified key.

1. The same gated audio segment is sent to **Azure Fast `hi-IN`+`en-IN`**: 0 hallucination, 0 wrong script,
   best answer accuracy in batch, ~240 ms.
2. Both transcripts are read through the skeleton normaliser and matched against the key and its distractors
   (the E0 `answer` extractor: numbers, fractions, last value after self-correction).
3. **Agree on the value** → grade against the key (deterministic).
   **Disagree, or either lane empty while the other is not** → the turn is ungraded, and the Director issues
   a repair move. The shape: the teacher owns the mishearing, keeps warmth, and asks again in a lighter form.
   She never implies the child was wrong. Write this as a kit note, not a line.
4. **Agreement rate is a live health metric** per child, per device and per lesson. A child whose agreement
   rate sits below the band median is flagged for an environment check (TV, distance, device), not marked
   down.
5. **Never grade from Lane L alone where the key is a short answer** (one or two words). That is the shape
   with the highest error in the literature [P] and in E0 (short-answer recall 0.64-0.93).

Why not `gpt-4o-transcribe` as the second opinion, given its useful logprobs? Because it outputs text for
5/5 near-silent clips. The second opinion must fail *empty*, not fail *fluent*. Its logprob AUROC (0.76-0.93)
is worth a later E1 arm as a third, confidence-only signal, run only on audio the floor has gated.

### 4.3 Noise and "that wasn't the child"

- TV and siblings are speech. ASR will transcribe them correctly, so no ASR setting solves this.
- Upstream fixes:
  - near-field capture and headset prompts in onboarding (`design/low-end-offline.md`);
  - client floor level gates [H];
  - a **non-child predicate** on the transcript: the content is unrelated to any open item, the register is
    adult (news anchor, ad copy), or the segment is long and fluent when the child's profile is short-turn.
    When it fires, the turn is ignored, not answered. Measure its precision in E1.
- Inherited rejection [H]: `turnCoverage` with short windows made a server ASR invent Hindi sentences from
  noise. Do not reach for coverage knobs.

### 4.4 Later levers (each needs its own measurement)

- **Azure Custom Speech `hi-IN`**: adaptation with E1 audio. Azure, first-party, allowed. Needs E1
  consent for training use (a separate tick box, §6.3), and costs $0.45-0.96/h on commitment tiers. Only if
  E1 shows Lane G is the bottleneck.
- **MAI-Transcribe-2 / LLM Speech** in Central India as Lane G or Lane L replacement, after E0b and E1.
- **Synthetic entity-dense NCERT audio** (the TTS→STT flywheel [P]) for numerals, units and term-dense
  sentences. Only usable through Custom Speech. Never mistake synthetic gains for child gains (E0 is the
  cautionary example).
- **Self-hosted IndicConformer** on Azure Container Apps (Azure compute; needs an owner decision, O4).

---

## 5. Endpointing for children

### 5.1 What is known

- [P] Children's gaps before responding are longer and more variable than adults'. Latency scales with
  utterance complexity (79 ms/morpheme vs 37 for adults). Children match the partner's tempo
  (Nguyen 2022).
- [M, measurements.md] On `gpt-realtime-2.1`:
  - `server_vad` 900 ms ended the turn +870 ms after true end without splitting a mid-thought pause;
  - `server_vad` 600 and `semantic_vad` low with auto-response **split a mid-thought pause** (2 of 3
    semantic arms);
  - barge-in cancelled the teacher within 7-260 ms.
- [H] Meera: the client owns the floor. Server VAD sensitivity knobs were no-ops (150/300/500 ms within ±50 ms).
  A stuck-endpoint watchdog was needed in loud rooms (0 ms of silence uplinked in 32 s).
- [M, E0] `gpt-live-transcribe` emits its final transcript ~530-570 ms after commit. Commit placement *is*
  the endpoint.

### 5.2 Design

1. **The Director, not VAD, decides when a child's turn is over.** VAD supplies speech onset and offset. The
   Director holds a *think-time window* whose length depends on:
   - **Item type**:
     - yes/no and single-number answers: short;
     - "explain why": long;
     - pure planning silence after a hard question: longest.
   - **Child profile**: that child's measured onset-latency and intra-turn-pause distribution per item type,
     a running estimate updated after each session (not in-call; hot-path law). It starts from E1 band
     priors.
   - **Partial-transcript state**:
     - an unresolved negation or self-correction cue extends the window (the d01 shape: a value, then a
       negation word);
     - a dangling Hindi postposition or conjunction (और, तो, क्योंकि, मतलब) extends it;
     - a complete number answer to a number item shortens it.
     These are deterministic predicates on Lane L partials, not a model call.
2. **During the window the teacher stays silent.** No synthetic backchannels [H]. No filling the child's
   planning silence with hints. If the window expires without speech, the teacher makes one gentle
   check-in move (a kit shape, varied, never a fixed line). Then she waits again with a longer window before
   scaffolding.
3. **Commit only after the Director's window closes.** In auto-response modes the server can respond on
   its own endpoint. Use `create_response: false` / client `response.create` in the answer-bearing state,
   accepting the measured +300-500 ms first-audio cost there only. Keep auto-response in chat states, where
   snappiness matters more than not interrupting.
4. **Barge-in stays immediate** (measured fine). A child talking over the teacher is never penalised and
   never treated as an answer to a different item.
5. **Silence is data, not failure**: per-item onset latency, intra-turn pauses and the "no answer" rate go to
   the learner model post-session as covert understanding signals (`learner/` docs). This must never be
   rendered to parents as "slow".

---

## 6. E1: real children, measurement protocol

### 6.1 Questions E1 must answer (each with a pre-registered decision)

| id | question | decides |
|---|---|---|
| Q1 | Lane L (D4) and Lane G (C1) skelCER, key recall and answer accuracy by class band (1-3 / 4-6 / 7-9), mode (Hindi / English / Hinglish) and noise | whether the two-lane design ships; whether a band needs push-to-talk |
| Q2 | **False-correct rate**: P(graded correct \| child's true answer wrong or absent) under the agree-rule | the shipping gate (§6.6) |
| Q3 | Ungraded (disagreement) rate | the repair-move frequency the child experiences; too high means the teacher feels deaf |
| Q4 | Hallucination on real think-time silence and on household noise (gated vs ungated) | whether gating is sufficient |
| Q5 | Child onset-latency and intra-turn-pause distributions by band and item type | the think-time priors in §5.2 |
| Q6 | Premature-cut rate and endpoint lag of candidate endpoint policies, replayed offline on the same audio | the endpoint policy |
| Q7 | Non-child predicate precision/recall on TV and sibling speech | §4.3 |
| Q8 | E0b engines (MAI-Transcribe-2, LLM Speech, gpt-transcribe) on the same audio, if a supported-region resource exists | engine replacement |
| Q9 | Inter-annotator agreement on canonical code-mix transcription of child speech | how much of the measured error is reference noise |

### 6.2 Sample

- **n = 80 children**, minimum 60. Stratified:
  - class band 1-3 / 4-6 / 7-9: ~27 each;
  - medium of instruction Hindi / English: at least 1/3 each;
  - gender balanced within ±10%;
  - at least 3 Hindi-belt regions (e.g. UP/Bihar, Rajasthan/MP, Delhi NCR) plus at least 10 children whose
    home language is not Hindi (a LAHAJA-style accent spread);
  - device tier: at least 1/3 on sub-₹12k Android.
- **Per child: ~45-60 min in one or two sittings**, never more than 25 min at a stretch for classes 1-3.
- **Power, for Q2**:
  - 80 children × ~40 answer-bearing turns = ~3,200 turns.
  - With an intra-child correlation of 0.1, the design effect is 1 + 39×0.1 ≈ 4.9, so the effective n is
    ~650.
  - A false-correct rate of 1% then has a 95% CI of about ±0.8 pp. That is enough to distinguish 1% from 3%,
    not 1% from 1.5% [U, binomial approximation].
  - Children are the unit of analysis. Bootstrap by child.

### 6.3 Consent, assent and data handling (child-safety floor; compliance details go to counsel)

- **Parent**: verifiable parental consent through the same VPC flow as the product (NM-13). No child audio
  before it. The consent text is plain-language Hindi and English, read aloud on request, and states:
  - purpose: improving how the teacher hears children;
  - what is recorded;
  - who listens: named annotators under an NDA;
  - where it is stored: Azure India region, encrypted, separate research store;
  - retention: audio deleted at most 12 months after the study, transcripts de-identified;
  - withdrawal: anytime, with deletion within 7 days.
- **Separate, unticked-by-default options**:
  - (a) use of the audio to *adapt* Azure Custom Speech;
  - (b) keeping clips as a regression set beyond 12 months.
  Neither is required to take part.
- **Child assent**, age-appropriate, spoken by a human researcher, not the AI teacher. It covers: this is a
  computer helper; you can stop anytime; no wrong answers. A child's "stop" ends the session without question.
  Classes 1-3 have a parent within earshot.
- **The AI teacher identifies as an AI if asked** (floor). No romance or companion register. Safeguarding: if
  a child discloses harm, the researcher follows the hand-off protocol, and Childline 1098 / Tele-MANAS
  14416 details are given to the parent.
- **The research exemption** (DPDP s.17(2)(b), Rule 16) *may* apply only if E1 data never feeds decisions
  about a specific child (`safety/dpdp-deep.md` §7.10):
  - E1 sessions write nothing to any product learner profile;
  - E1 runs on a separate deployment with a research flag;
  - E1 does not count as product use.
  Counsel confirms before recruitment.
- **No speaker-ID or voiceprint is ever derived** (it would turn the stream into biometric data,
  `dpdp-deep.md` §1).
- **Compensation**: non-coercive and identical for completers and withdrawers (e.g. a book voucher to the
  family).

### 6.4 Session design

Each session runs through the **real app capture path**: WebRTC → realtime session, Opus, the device's own
mic. A simultaneous **reference recorder** captures the same audio:
- the browser `MediaRecorder` at 48 kHz from the same mic, uploaded after the session;
- optionally, a researcher's clip-on mic for 20% of children, to separate capture loss from ASR loss.

Blocks, each mode-balanced (the child chooses Hindi / English / mix in B3-B5; B1-B2 are fixed):

| block | content | reference | measures |
|---|---|---|---|
| B1 read-aloud | 12 NCERT sentences at band level (4 Hindi, 4 English, 4 Hinglish) from the kits | the printed text (the child's deviations are annotated) | Q1 with a known reference; Q9 baseline |
| B2 short answers | 15 items: numbers, fractions, units, yes/no, single NCERT terms, both Hindi and English number words | annotated | Q1 short, **Q2**, Q3 |
| B3 explain | 6 "tell me why/how" prompts on concepts just taught | annotated | Q1 spontaneous, Q5 |
| B4 self-correction | 4 items designed to invite a revision (a tempting distractor, then a "check again" move) | annotated | answer = last value |
| B5 think-time | 6 hard items with deliberate long planning, plus 2 where the child is told they may stay silent | timestamps | Q4, Q5, Q6 |
| B6 home noise | 5 B2-type items repeated with the household's normal background (TV on if that is normal; never asked to create noise), plus 60 s of room tone with the child silent | annotated + noise log | Q4, Q7, noise arm |

- The teacher in E1 runs the production persona compiled for research mode. Item order is randomised
  within blocks.
- **Each child turn is cut once by the reference VAD and replayed offline** through every engine arm and
  every endpoint policy. Live behaviour is measured only for the production arm. The rest is replay, so all
  arms see identical audio.

### 6.5 Ground truth

- Two independent annotators (native Hindi, fluent English, trained on the HiACC convention plus Taxila
  additions) transcribe every utterance blind to every ASR output. Additions:
  - numbers as spoken;
  - fillers kept;
  - false starts marked;
  - non-child speech tagged `[other]`.
- A third adjudicates disagreements.
- **Inter-annotator skelCER is reported per band** (Q9). An engine whose error is within annotator
  disagreement is "at ceiling" for that band.
- Annotators also tag:
  - the answer value the *child* meant, judged from context;
  - a child-intelligibility rating (1-3);
  - whether the answer was correct against the kit key.
  This tagged truth is what Q2 measures against.
- **No model scores anything.** `asr-e0/score.mjs` is reused unchanged. Any change is a new versioned scorer
  with both versions reported.

### 6.6 Metrics and pre-registered gates

| metric | gate to ship the two-lane design | action if missed |
|---|---|---|
| **False-correct** (graded correct, truly wrong/absent), pooled and per band | ≤ 1% pooled, ≤ 2% in every band | tighten the agree-rule (require exact skeleton key match, not value), or push-to-talk for that band |
| False-wrong (graded wrong, truly correct) | ≤ 3% | a softer repair move; check whether key aliases are missing |
| Ungraded rate (disagreement) | ≤ 15% of answer-bearing turns in classes 4-9, ≤ 25% in 1-3 | engine or band changes; investigate device/noise strata |
| Hallucination on gated silence (B5 silent turns, B6 room tone) | 0 non-empty Lane G outputs; Lane L ≤ 1% | gating thresholds; never ship an engine that fails fluent |
| Wrong-script output (Lane L) | ≤ 1% of turns | context compile check |
| Key recall (script-agnostic), B2 | report per band; no gate | Custom Speech if Lane G is the bottleneck |
| Premature cut (endpoint fires inside a child's own turn), B3/B5 | ≤ 5% of turns per band | lengthen the band prior |
| Endpoint lag (true end → commit), B2 | median ≤ 900 ms for short answers | shorten the item-type window |
| Non-child predicate precision | ≥ 0.9 at recall ≥ 0.5 | ignore-only mode; never answer TV |

Plus descriptive reporting (no gate):
- skelCER, rawWER and keyRawRecall per engine × band × mode × noise;
- confidence AUROC;
- onset-latency and pause distributions (Q5), which are the deliverable for §5.2.

### 6.7 Analysis

- Mixed-effects logistic regression for false-correct / ungraded / recall:
  - fixed effects: band, mode, noise block, device tier, utterance word count;
  - random intercepts: child and item.
- Report child-cluster bootstrap 95% CIs.
- Endpoint policies are compared on replay with paired differences per child.
- Report **per-band numbers first**, pooled numbers second. The pooled number is the one that hides
  classes 1-3.
- Pre-register the gates (§6.6) and this analysis in `context/decisions.md` *before* the first child is
  recorded.

### 6.8 Logistics and cost

- 2 researchers (one Hindi-native) and 2-3 annotators.
- Annotation load: ~80 children × ~250 utterances ≈ 20k utterances, ~12-15 h of child speech. At ~6× real
  time per annotator, double annotation is ~180 annotator-hours.
- Engine replay cost is negligible: ~15 h × 6 arms × <$1.1/h ≈ under $100 of Azure.
- The real cost is people and recruitment.
- **Sequence**:
  1. pilot with 6 children (2 per band) to fix the protocol;
  2. freeze the scorer and gates;
  3. full run;
  4. analyse;
  5. log to `context/`.

---

## 7. Open questions

- **O1**: Does `gpt-realtime-2.1`'s own session accept `keywords`/`prompt` for its input transcription, or
  does Lane L need a parallel transcription session (twice the audio uplink)? Check on the realtime
  deployment before the build.
- **O2**: The live-transcribe "parameter not supported" refusals (2 of ~130 sessions carrying context fields). Find out whether this is
  replica heterogeneity. Re-measure over a day, and ask through Azure support.
- **O3**: MAI-Transcribe-2 / LLM Speech need a Speech resource in a served region (Central India). Owner
  decision on provisioning, then E0b.
- **O4**: Is a self-hosted MIT model (IndicConformer) on Azure Container Apps within the Azure-only
  directive? It is Azure compute, but not an Azure AI model. Owner decision. Not needed unless E1 fails.
- **O5**: Does a TTS voice mispronounce चौबीस (s07)? Ear-check the clip in `asr-e0/audio/`, or replace the
  item. If it does not, three engines share a real weakness on that numeral.
- **O6**: The India↔eastus2 RTT adds to every number in §2. Measure the same probe from an India-region
  container.

## 8. Proposed `context/` entries (for the main loop to merge)

- **measurement `asr-e0-synthetic-2026-10-02`**:
  - n = 42 clips × 3 arms × 15 configs + 3 non-speech;
  - method: §2.1;
  - headline: D4 child-arm skelCER 0.043, answers 14/15, 0 decoys, 0/3 near-silence output;
  - A2 5/5 near-silence outputs, 3 with lesson vocabulary;
  - B2 5/5 recited the list;
  - Azure `hi-IN` phraseList identical to none;
  - 10 dB TV babble: skelCER ≥ 0.56 for every engine.
- **rejection `vocab-list-in-free-text-asr-prompt`**:
  - tried: a term list in the free-text `prompt` of 4o-transcribe / 4o-mini-transcribe;
  - broke: a fabricated correct-sounding answer from 0.3 s of near-silence (A2), whole-list recital and
    paragraph generation on 5/5 near-silent clips (B2), CER up to 44 on speech;
  - supersedes nothing; extends the "sentence-shaped text gets recited" law to ASR context.
- **rejection `azure-phraselist-hi-in`**:
  - tried: `phraseList` on Fast Transcription `hi-IN`;
  - broke: no effect at all (identical outputs, 126 clips).
- **rejection `4o-transcribe-as-grader`**: fails fluent on silence (5/5 in every configuration).
- **decision `asr-two-lane`**: Lane L = live-transcribe + `keywords` + script-only prompt; Lane G = Azure
  Fast `hi-IN`+`en-IN` on answer-bearing turns; grade only on agreement via the skeleton.
  *Reverse if* E1 false-correct > 1% pooled or ungraded > 15% (classes 4-9), or if E0b/E1 show a single
  engine meeting every §6.6 gate alone.
- **decision `endpoint-director-owned`**: think-time window by item type × child profile; commit after the
  window in answer-bearing states. *Reverse if* E1 replay shows server `semantic_vad` low with client
  `response.create` has premature-cut ≤ 5% and lag ≤ 900 ms in every band.

## 9. Sources

- Singh, Sahidullah, Kinnunen 2025, *Causal Analysis of ASR Errors for Children*: <https://arxiv.org/abs/2502.08587>
- Attia et al. 2024, *Kid-Whisper*: <https://arxiv.org/abs/2309.07927>
- Koenecke et al. 2024, *Careless Whisper*: <https://arxiv.org/abs/2402.08021>
- *Transcribing Children's Speech: ASR Performance and Obtaining Reliable Orthographic Transcriptions*, 2026: <https://arxiv.org/abs/2605.28833>
- *Building an ASR Solution for Training and Assessing Children's Reading*, 2026: <https://arxiv.org/abs/2606.31508>
- Nguyen et al. 2022, turn-taking meta-analysis: <https://srcd.onlinelibrary.wiley.com/doi/abs/10.1111/cdev.13754>
- Verbal response latency in mother-child dialogue, 2025: <https://www.tandfonline.com/doi/full/10.1080/15475441.2025.2510223>
- Singh, Singh, Kadyan 2025, *HiACC*: <https://pmc.ncbi.nlm.nih.gov/articles/PMC12329218/>; data <https://zenodo.org/records/15551669>
- Bhogale et al. 2023, *Vistaar / IndicWhisper*: <https://arxiv.org/abs/2305.15386>, <https://github.com/AI4Bharat/vistaar>
- AI4Bharat IndicConformer: <https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual>; IndicVoices: <https://huggingface.co/datasets/ai4bharat/IndicVoices>
- Javed et al. 2024, *LAHAJA*: <https://arxiv.org/abs/2408.11440>
- Sarvam Saaras v3: <https://www.sarvam.ai/blogs/asr>; Sarvam on Indic ASR evaluation: <https://www.sarvam.ai/blogs/evaluating-indian-language-asr>
- *The TTS-STT Flywheel*, 2026: <https://arxiv.org/abs/2605.03073>
- Wadhwani AI ORF: <https://www.wadhwaniai.org/impact/education-solutions/oral-reading-fluency/>
- OpenAI transcription guide (gpt-transcribe / gpt-live-transcribe context): <https://developers.openai.com/api/docs/guides/transcription>
- GPT-Live-Transcribe announcement: <https://community.openai.com/t/gpt-live-transcribe-and-gpt-transcribe-two-new-transcription-models-in-the-api/1388318>
- Azure realtime audio: <https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio>
- MAI-Transcribe on Azure Speech: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/mai-transcribe>; model card <https://microsoft.ai/pdf/MAI-Transcribe-2-Model-Card.pdf>
- Azure LLM Speech: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/llm-speech>; LLM Speech 2607: <https://devblogs.microsoft.com/foundry/announcing-azure-ai-speech-llm-2607/>
- Azure phrase list: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/improve-accuracy-phrase-list>
- Harvested: `docs/harvest/companion-tech.md`, `docs/harvest/gurukul.md`; Taxila: `context/measurements.md`, `docs/research/safety/dpdp-deep.md`

---

## Review

Skeptical review, 2026-10-02 (voice-AI engineer + child-safety lens). I re-read this document against its own
numbers. I did not re-fetch the 2026 arXiv papers or vendor pages, so every citation stays at the evidence tag the
author gave it. Items are ordered by severity. Items marked BLOCKER should change the design or the gates before
the build or E1 starts.

### R1. Child-safety gaps

1. **BLOCKER: the safety path is not separated from the grading path.** §4.1 gates audio by the client floor,
   §4.2 leaves disagreeing turns ungraded, and §4.3 says a turn whose content is "unrelated to any open item"
   is "ignored, not answered". A disclosure of harm, fear, or distress is by definition unrelated to the open
   item, is often quiet, and may be long and fluent for a child who normally gives short turns. Two of the
   proposed non-child predicate cues (off-item content, long fluent turn from a short-turn child) therefore
   fire on exactly the child who finally opens up. Correction: crisis and safeguarding detection must run on a
   union of lanes and on the realtime model's native audio understanding, must never depend on agreement
   between lanes, and must never be silenced by "ignore" or "ungraded". The non-child predicate may only
   suppress an *answer-grading* attempt, never the safety classifier, and a suppressed turn should still get a
   gentle human-sounding check-in when the floor heard speech.
2. **BLOCKER: statutory reporting is missing from E1.** §6.3 says the researcher follows a hand-off protocol
   and gives helpline details to the *parent*. If the parent or household is the source of harm, that is the
   wrong recipient. Indian child-protection law (POCSO Act ss.19 and 21) places a reporting duty on any person
   who has knowledge of a sexual offence against a child, and failure is itself punishable [U, from memory,
   counsel to confirm]. This applies to researchers *and to annotators*, who will hear raw household audio
   (B6 room tone, `[other]` speech) long after the session ends. Correction: add an annotator escalation
   channel with a named safeguarding lead, child-protection training for every person who hears audio, and a
   protocol where the researcher or lead can contact Childline directly without routing through the parent.
3. **Bystander audio is unconsented.** B6 deliberately records the family's normal TV and room, and
   `[other]` tagging implies annotators hear siblings and adults. §6.3 consents only the parent for the child.
   Correction: consent wording covers other household members' incidental speech, with a "pause recording"
   control, and the retention rule for bystander segments is stated separately.
4. **Assent wording is untruthful.** The child is told there are "no wrong answers" while B2 is annotated
   correct/incorrect against a key and the whole study measures grading. Correction: assent shape states that
   the *system* is being tested, not the child, and that the answers are noted. Do not say anything that is
   false to a child to reduce anxiety. Also state in the shape that the human researcher, not the teacher,
   delivers it (already stated) and that the consent is read aloud by default, not "on request", given
   low-literacy households. Consent must be offered in the household's language, not only Hindi and English,
   for the 10+ non-Hindi-home children recruited.
5. **Data residency contradiction.** §6.3 promises storage "in Azure India region", but every engine in §1.3
   and E0 runs in eastus2, §7 O6 admits the RTT, and Lane G sends gated audio to a second processor. Child
   audio therefore crosses borders and passes through two services. Correction: state per lane where audio
   goes and for how long, confirm NM-12 (ephemeral audio) still holds for the second Fast Transcription call
   and any Azure-side logging, and do not promise India-only storage until the engines are in India.
6. **Per-child pause and agreement profiles are sensitive inference.** §4.2 item 4 and §5.2 build a persistent
   profile of a child's speech timing and agreement rate. Those signals correlate with stammering, speech
   and language disorders, hearing loss and home language. Correction: the profile must never be labelled,
   shown to parents, or used for anything but the endpoint window; the "environment check" flag must not
   frame a child's accent or disorder as a device problem; and the DPDP position on behavioural monitoring of
   children for a non-institutional ed-tech product needs counsel, not the §6.3 hedge. The cited
   DPDP s.17(2)(b) / Rule 16 research exemption was not verified here.
7. **Equity is not measured.** Ungraded rate and false-wrong rate will be higher for accented, non-Hindi-home,
   disfluent and speech-impaired children, who then hear more repair moves and feel the teacher is deaf.
   E1 sampling includes accent spread but no stammering or speech-disorder strata and reports no gate by home
   language. Correction: add strata (or at least a pilot) and report ungraded and false-wrong rates by home
   language and disfluency.
8. **Parent reports may misquote or expose.** §3.3 quotes the child through a canonical normaliser. A
   normalised transcript is not what the child said, and a quote can include personal disclosures about the
   household. Correction: no verbatim quoting of off-task or personal content in parent reports, and say that
   normalised quotes are reconstructions.
9. **The client floor's miss rate is never measured.** Gating is called "the first defence" (§4.1), but no E1
   gate covers the floor dropping quiet or whispered child speech. Shy classes 1-3 children are the likeliest
   to be dropped. Correction: add floor recall on quiet speech as a gated metric, and tie it to the check-in
   behaviour in item 1.

### R2. Human-likeness that becomes deception

1. **Repair move must not fabricate a cause.** §4.2 has the teacher "own the mishearing". The system actually
   hears the audio natively and the disagreement is between side lanes. The shape may admit not catching the
   answer. It must not invent a cause (a bad line, her ears, the child mumbling) and must never imply the
   child was at fault. Add that to the kit note.
2. **Ungrounded verdict leakage.** The realtime model hears the audio itself and can react ("that's right")
   before the Director's verdict, or after an ungraded turn. §5.2.3 suppresses auto-response in answer-bearing
   states, but the document never says how the Director's verdict reaches the model (an out-of-band item
   before `response.create`) or that the model is told it has not judged the answer. Without this, the
   deterministic grader is cosmetic.
3. **Covert assessment of children.** "Silence is data" and the learner model are described as *covert*. The
   parent-facing and child-facing disclosure that learning behaviour is being inferred is not specified here.
   Cross-reference the safety docs before ship; do not let human-likeness warmth hide the fact of assessment.

### R3. Claims without enough evidence

1. **Zero-hallucination claims rest on n of 3 to 5, and the denominators are not independent.** The near-silent
   set is 3 s silence, 4 s pink noise, and three clips that are the *same* 0.3 s TTS artefact across the
   clean/child/noisy arms (effective n is about 3). Azure "0/5" and live-transcribe "0/3" have a 95% upper
   bound of roughly 50-70% (rule of three). They show "not yet observed on synthetic non-speech", not "fails
   empty". Synthetic dither and pink noise are also not breathing, "hmm", chair noise or a child trailing off.
   §4.2's "0 hallucination" and the §6.6 gate language should be rephrased as a hypothesis for E1.
2. **"Best arm" claims have no uncertainty.** 21 distinct utterances, two TTS voices, one pass, no seeds, no
   CIs. D1 0.044, D4 0.043, D3 0.054, D2 0.072 are indistinguishable; D1 (full term list in prompt) also had
   0 decoys, so the E0 data do not show that the live-transcribe prompt must be vocabulary-free (that rule is
   transferred from other models). Answer denominators differ across arms (15 vs 16), so "14/15" and "13/16"
   are not comparable. Report with child-cluster-free bootstrap over utterances at least, and call the arm
   ranking provisional.
3. **In-family bias.** The audio is `gpt-4o-mini-tts` and the winners are OpenAI-family transcribers; Azure
   Speech is out-of-family. Synthetic speech from a model family is likely easier for that family's ASR. This
   confounds the lane choice, and it is not acknowledged in §2.5. Mitigate by adding a non-OpenAI TTS (Azure
   neural `hi-IN`/`en-IN` voices) as a second stimulus source in E0b.
4. **Developmental literature is stretched.** The 79 vs 37 ms per morpheme result and the Nguyen
   infant-latency meta-analysis come from mother-child and infant/toddler dialogue. Applying them to ages
   6-15 with a tutor is [U], not [P]. The Koenecke segment-length figures concern Whisper and aphasic
   speakers; the doc uses them correctly as a mechanism hint but not as an effect size for Taxila.
5. **The agreement-certification analogy is misapplied.** The Dutch study certifies an ASR transcript by
   agreement with a *known prompt text*. Two ASRs on the same audio share acoustic evidence, so their errors
   are correlated, and with a small answer space (single digits, yes/no) chance agreement on a wrong value is
   high. "Agree means safe" needs measurement of the joint error rate, not an analogy.
6. **Skeleton matching can create false-correct.** The consonant-skeleton normaliser folds vowels and scripts.
   Concrete collisions: "ten" and "teen" share a skeleton (t-n), and Hindi तीन (3) shares it too; 7 vs 60
   (सात/साठ) and the -teen/-ty pairs are at risk depending on aspiration folding. This is directly the
   false-correct metric E1 gates on. Correction: before E1, compute collision rates of every kit key
   against its distractors and its numeric neighbours, and use exact-form or phoneme-aware matching for
   number items.
7. **Confidence AUROC is overfit and synthetic.** AUROC 0.76-0.93 is computed on the same 42 clips with a
   "bad" label derived from the same scorer, with no held-out set. Do not use it as a design basis yet.

### R4. Things the realtime API may not do (verify before building)

1. **Partials before commit may not exist.** §5.2 item 1 relies on "deterministic predicates on Lane L
   partials" to extend the think-time window. §2.4 and §5.1 measured the live-transcribe final arriving
   about 530-570 ms *after commit* in a session paced at real time. If deltas only follow commit, there are
   no mid-speech partials, and a window-extension rule that needs a dangling conjunction cannot fire until the
   endpoint has already passed. Add an E-test: when do the first delta events arrive relative to speech
   and to commit, on the real Realtime session?
2. **"Commit placement is the endpoint" conflicts with the design.** On server VAD the buffer is committed on
   the server's speech-stopped, whatever the Director intends. Delaying `response.create` does not merge two
   committed items: a child who pauses past the VAD window produces two user items and two transcripts, and
   Lane G receives a fragment. Holding commit open requires turn detection off with a client-owned VAD and
   manual commit, which has its own barge-in and truncation handling costs. The document treats response
   timing and commit timing as the same thing. Specify which mode, and how fragments are merged for Lane G.
3. **O1 (keywords/prompt on the realtime session) is the load-bearing unknown, yet §0 states the lane as the
   plan.** If a parallel transcription session is needed, the Director must align two sessions' turn
   boundaries, uplink doubles, and cost and failure modes (the 3/135 non-completing sessions) double. Mark
   Lane L as conditional until O1 is answered on the production deployment.
4. **Replica heterogeneity is a guess [U]** and the refuse-and-strip retry means the context a lesson
   depends on can vanish mid-call. The `context_degraded` event must also alter the grading policy (treat
   Lane L as untrusted), not just log.
5. **Lane G latency and plumbing are unmodelled.** Fast Transcription is a batch REST call needing the gated
   segment uploaded; measured ~240 ms is from a US container to eastus2, excluding upload from a low-end
   Android over a mobile link and the India-US RTT. The grading path sits inside the answer-bearing response
   delay, which §5.2.3 already says costs +300-500 ms. State a total latency budget and a timeout fallback
   (ungraded and repair, never guess).

### R5. E1 protocol and statistics

1. **Power numbers do not match the session design.** §6.2 assumes ~40 answer-bearing turns per child and
   §6.8 assumes ~250 utterances per child. §6.4's blocks total about 50 items, of which only B2, B4 and B6
   (about 24) have a verified key. That gives about 1,900 gradable turns and roughly 4,000 utterances, not
   3,200 and 20,000, so annotation hours are about 5 times lower and the CI wider.
2. **The false-correct denominator is the wrong population.** False-correct is conditional on the true answer
   being wrong or absent. Tutored children mostly answer correctly, so the denominator is maybe 20-40% of
   turns plus about 160 deliberate silent turns. With about 27 children per band the per-band effective n is
   in the tens to low hundreds, and a zero-event result still has a 95% upper bound above 2%. The
   "≤2% in every band" gate is therefore not demonstrable. Correction: build the false-correct test offline
   by grading every answer's audio against *neighbouring items' keys and distractors* (cross-item confusion),
   which needs no extra children and no deliberately wrong answers, and make the per-band gate descriptive.
3. **Parent within earshot (classes 1-3)** confounds speech with parental prompting. Log it as a covariate.
4. **Third annotator and adjudication hours are not in the 180 h estimate.**
5. **Gate set is silent on the safety path.** Add: recall of crisis and disclosure cues on the realtime audio
   when Lane G or the floor drops the turn, with scripted (not real) disclosure simulations by the researcher
   and never by the child.

### R6. Recitation hygiene

1. No prompt-bound sentence-shaped text was found in the document; the quotes are ASR stimuli, and the
   warning at the top is correct. Two residual risks: (a) §4.2 item 3's repair move and §5.2 item 2's
   check-in move are specified as shapes, but the kit-note authors must keep them as shape-only notes with
   varied slots, or the teacher will repeat one phrasing every wrong turn (the Meera law); (b) the 16-term
   `keywords` list is vocabulary placed in an LLM-based transcriber, and E0 showed the same family
   fabricating lesson content under a different field. The decoy-insertion metric must stay a standing
   production check, not an E0-only metric, and the lane must be re-tested on every model version.

### Corrections summary

See the structured return of this review; each item above is a correction to make before the build or E1.
