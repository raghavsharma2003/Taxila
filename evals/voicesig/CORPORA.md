# Corpora used by voicesig, and what each may be used for

The rule: anything trained into a shipped model must allow commercial use. A non-commercial corpus is used for
evaluation or research only, and is labelled that way here. No gated Hugging Face model or dataset is used. Each
licence below was read at its source on the date given.

## Used in this build (2026-10-04)

| corpus | what was used | licence (read at source) | use here | attribution |
|---|---|---|---|---|
| **AMI Meeting Corpus** | individual-headset wavs, 23 meetings, 92 channels, speaker-disjoint split; manual word annotations v1.6.2 | CC BY 4.0, read at groups.inf.ed.ac.uk/ami/corpus/license.shtml on 2026-10-04 | **train / val / test** of the filler detector (`models/voicesig/filler-gru.onnx`) | "AMI Meeting Corpus, University of Edinburgh / IDIAP / TNO et al., CC BY 4.0" |
| **ICSI Meeting Corpus** | headset-mix wavs of 5 meetings; core NXT word annotations | CC BY 4.0, read at groups.inf.ed.ac.uk/ami/icsi/license.shtml on 2026-10-04 | **cross-corpus test only**; never trained on | "ICSI Meeting Corpus, International Computer Science Institute, CC BY 4.0" |
| **FLEURS** (`google/fleurs`, not gated) | `hi_in` and `en_us` dev audio, about 15 min each | CC BY 4.0, from the dataset card on 2026-10-04 | **false-alarm check only**: read speech has no filled pauses | "FLEURS, Google, CC BY 4.0" |

Only numbers were kept: every wav was deleted after the product front-end reduced it to per-frame features.

## Candidates not used yet

| corpus | licence | permitted use | why not used now |
|---|---|---|---|
| IndicVoices (AI4Bharat) | CC BY 4.0 (HF card) | train (Hindi filler / onset calibration) | `ai4bharat/IndicVoices` is gated (`gated: auto`, HF API 2026-10-04 [V]); the no-gated rule excludes it until a non-gated source with readable terms exists |
| Vaani (IISc / ARTPARK) | CC BY 4.0 (HF card) | train | `ARTPARK-IISc/Vaani` is gated (`gated: auto`, HF API 2026-10-04 [V]) |
| MyST (child science tutoring, US) | CC BY-NC-SA free tier [S] | **evaluation only** (labelled NC) | needs an LDC account; not obtainable in this session |
| HiACC, ASER, ScAA (Indian child speech) | CC BY-NC(-SA) [S] | **evaluation only** (labelled NC) | not obtained |
| MUCS 2021 Hinglish | CC BY-SA [S] | evaluation only (share-alike on weights unresolved) | not obtained |
| ITSPOKE, Pon-Barry | research-only [S] | research only, never train | not obtained |
| Nexdata Hindi child speech (34 h) | commercial purchase [S] | train (owner decision) | not bought |

## What no public corpus covers

None of these corpora carries the knowledge outcomes (O1-O4) that the knowledge heads predict. None has Hindi or
Hinglish children, and none was recorded through phone capture with AGC. So the filler detector is an
**adult-trained** component. The knowledge heads themselves can only be trained on Taxila's own consented pilot and
flywheel data.

## Verify pass (2026-10-04)

- **Capture-chain check.** 4 AMI test headset channels plus 1 interferer channel (IS1006b.D) were re-downloaded (CC BY 4.0) and run through `perturb_eval.py`, which is evaluation only. Every wav was deleted.
- **Weights.** The only weights that ship are `filler-gru` (AMI, CC BY 4.0). That licence requires attribution, so the product NOTICE / About page must carry: "AMI Meeting Corpus, University of Edinburgh / IDIAP / TNO et al., CC BY 4.0".
- **Benchmark-only weights.** The encoder benchmarks in `placement/` loaded these models, none gated:
  - whisper, wav2vec2, hubert and distilhubert: Apache-2.0;
  - smart-turn-v3: BSD-2;
  - wavlm-base-plus: its HF card has no licence tag, though the upstream microsoft/unilm repo is MIT. Confirm the licence before any wavlm weights ship.
- **Never downloaded.** The NC / "other" models (mms, audeering SER, emotion2vec) were only metadata-checked.

## Round 3 (2026-10-09)

| corpus | what was used | licence (read at source 2026-10-09) | use here | attribution |
|---|---|---|---|---|
| **AMI Meeting Corpus** | test: the same 8 Indian-L1 series' "b" meetings (32 channels) as 2026-10-04; val: 6 series (24 channels); train: 21 series × up to 2 meetings (160 channels, 84 speakers) | CC BY 4.0 (groups.inf.ed.ac.uk/ami/corpus/license.shtml) | train / val / test of `models/voicesig/filler-gru-r3.onnx`; the thinking-pause gold-filler check (`evals/voicesig/r3/ami_pauses.py`) | as above |
| **FLEURS** `hi_in`, `en_us` | TRAIN split, 120 min hi + 60 min en (speakers disjoint from dev/test per the card), as hard negatives (every speech frame = non-filler); DEV split for false alarms (the 2026-10-04 15-min harness + all of dev) | CC BY 4.0 (HF dataset card; not gated) | **train** (negatives) and false-alarm evaluation | "FLEURS, Google, CC BY 4.0" |
| **LiveKit EOT-Bench, Hindi** (`livekit/eot-bench-data`, the duplex-real copy in the shared scratch) | 400 real adult turns, annotated silences (holds) and turn ends | CC BY 4.0 (read by the duplex-real stream, 2026-10-07) | **evaluation only** here: the thinking-pause cue, pause level (`pauses.mjs`) and through the duplex replay (`duplex_replay.mjs`) | "LiveKit EOT-Bench, CC BY 4.0" |
| **HiACC** (Singh, Singh & Kadyan 2025, *Data in Brief*; zenodo.org/records/15551669) | all 1,861 child + 3,321 adult utterances (20 children aged 10-14, 20 adults; Hinglish; Samsung Galaxy M34, 16 kHz) | **conflicting**: the Zenodo record says CC BY 4.0; the article's specifications table says "academic/research use under a CC BY-NC 4.0 license". The stricter reading applies | **evaluation only**: fire rates children vs adults under identical conditions (`hiacc_eval.py`); never trained on; every wav deleted after the front-end; the zip deleted after the run | "HiACC, Singh, Singh & Kadyan, 2025" |
| MyST | — | CC BY-NC-SA 4.0 free tier (evaluation only) | not obtained: myst.cemantix.org did not resolve from this sandbox; the HF mirrors are gated | — |

**Consent note (HiACC).** Ethics approval UPES REF-1002; the article says all participants were informed and gave consent;
it does not describe parental consent for the children. Used for evaluation only, numbers only; flagged to the owner.
**Still no corpus** has children's filler marks with a usable licence; HiACC transcripts do not mark fillers, so it gives
fire rates, not precision. Precision on children comes only from the consented pilot (`docs/design/round3/voicesig/PILOT-PROTOCOL.md`).
