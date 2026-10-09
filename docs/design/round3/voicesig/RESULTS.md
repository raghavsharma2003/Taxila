# Round 3 voicesig: results (2026-10-09)

Every number: what, n, method, where measured, population. ADULT, SIMULATED/SCRIPTED and LOCAL numbers are labelled as
such. No number here is a child precision (none exists; see §3 and PILOT-PROTOCOL.md). Result files are under
`evals/voicesig/results/2026-10-09/` unless noted.

## 1. Filled-pause detector (V2 item: precision ≥ 0.80 on adults first)

Harness: AMI Meeting Corpus (CC BY 4.0), the SAME test set as the shipped model's 2026-10-04 number: 8 Indian-L1 series,
32 held-out speakers, 7.23 h, 1,685 filler words; the product front-end (vsgru-in/1) regenerated from the source audio
today. Event level: runs ≥ the operating point's minimum length of p ≥ thr over speech frames that overlap an own
labelled word; true positive = overlaps a filler word (`train_filler.py runs_eval`, imported). Precision CI: speaker-
clustered bootstrap (32 clusters) and Wilson. ADULT English meeting speech. Reproduction check: the shipped graph on
today's features gives exactly the 2026-10-04 numbers (0.7526 / 0.6012 / 1,241 runs / word AUROC 0.9421), on float32 and
on the float16 storage used for the larger run.

PENDING_TABLE_1

## 2. The thinking-pause cue (voicesig → duplex)

### 2.1 Pause level, real Hindi speech (LiveKit EOT-Bench Hindi, CC BY 4.0, 400 adult turns; `pauses.mjs`)

PENDING_TABLE_2

### 2.2 Ceiling check with gold fillers (AMI test channels, 4-party meetings; `ami_pauses.py`)

PENDING_TABLE_3

### 2.3 Through the real duplex bridge (duplex-real E1 replay; `duplex_replay.mjs`)

PENDING_TABLE_4

## 3. Children: HiACC fire rates (evaluation only; `hiacc_eval.py`)

PENDING_TABLE_5

## 4. What she would have done (shadow log; local production build)

PENDING_TABLE_6

## 5. Cost

PENDING_TABLE_7

## 6. Gates

PENDING_TABLE_8

## 7. Still short of the bar, and exactly why

PENDING_TABLE_9
