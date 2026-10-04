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
| IndicVoices (AI4Bharat) | CC BY 4.0 [S] | train (Hindi filler / onset calibration) | Hugging Face copy is gated; needs the source-site terms read and a non-gated path |
| Vaani (IISc / ARTPARK) | CC BY 4.0 [S] | train | gated on Hugging Face |
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
