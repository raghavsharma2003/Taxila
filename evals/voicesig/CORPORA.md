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
