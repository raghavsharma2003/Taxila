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

| detector | operating point (thr / min run) | test precision | speaker-clustered 95% | recall (fillers ≥ the min run) | recall over ALL 1,522 fillers ≥ 200 ms | runs (n) | FLEURS dev15 false runs / speech-min hi / en | FLEURS all-dev hi / en |
|---|---|---|---|---|---|---|---|---|
| **before**: shipped filler-gru/1 at its shipped point (F1 on the 2026-10-04 val) | 0.44 / 200 ms | **0.753** | 0.694-0.804 | 0.601 (of 1522) | 0.601 | 1241 | 3.80 / 3.36 | 4.20 / 3.92 |
| shipped filler-gru/1 at the round-3 val rule (P ≥ 0.82 on val) | 0.53 / 300 ms | **0.818** | 0.761-0.865 | 0.523 (of 1263) | 0.447 | 831 | 1.85 / 2.64 | 2.05 / 2.02 |
| **after**: round-3 `bi32-ft-neg` at the round-3 val rule (the card's point) | 0.55 / 300 ms | **0.842** | 0.795-0.885 | 0.506 (of 1263) | 0.430 | 774 | 0.18 / 0.24 | 0.17 / 0.45 |
| round-3 `bi32-ft-neg` at its F1-best val point (for reference) | 0.46 / 200 ms | **0.758** | 0.703-0.806 | 0.612 (of 1522) | — | 1271 | 0.46 / 0.72 | 0.60 / 1.40 |

Word-level AUROC on the same test (speaker-clustered 95%): shipped 0.9421 [0.9294, 0.9546]; round-3 0.954 [0.9426, 0.9641]. Indian-L1 speakers' channels at the round-3 point: precision 0.7988, recall 0.4411. Val operating points: shipped {'thr': 0.53, 'minFrames': 15, 'precision': 0.8226, 'recall': 0.5834, 'runs': 795, 'fillerWords': 1097}; round-3 {'thr': 0.55, 'minFrames': 15, 'precision': 0.8218, 'recall': 0.6007, 'runs': 825, 'fillerWords': 1097}. Training data: {"channels": 160, "speakers": 84, "hours": 32.69, "fillerFrames": 250197, "wordFrames": 2895663, "fillerWords": 7869, "otherWords": 154654}; FLEURS negatives {"chunks": 16, "speechMin": 116.8}. Held-out FLEURS train chunk (not trained on) FA/min: round-3 {'speechMin': 13.7, 'falseRunsPerSpeechMin': 0.073, 'runs': 1}.

**Reading table 1 honestly.**
- The bar "precision ≥ 0.80 on adults" is met at the point estimate: **0.753 → 0.842** (n 774 runs, 32 speakers). The
  speaker-clustered 95% interval is 0.795-0.885, so its lower end sits just under 0.80; Wilson (runs as independent) is
  0.815-0.866. On the Indian-L1 speakers' own channels it is 0.799 (n 164 runs, 297 fillers): at the bar, not above it.
- **It was bought mostly with the operating point, and it costs recall.** The shipped graph at the same pre-registered
  val rule already reads 0.818; the retrain adds +0.024 precision. Recall over the same 1,522 fillers falls from 0.601
  (shipped point) to 0.447 (shipped graph, strict point) and 0.430 (round-3). At its own F1 point the round-3 graph is
  0.758 / 0.612, i.e. the curve itself moved little on English meetings (word AUROC 0.942 → 0.954, intervals overlap).
- **What the retrain did buy is Hindi:** false runs on Hindi read speech (FLEURS dev, speakers disjoint from the
  training negatives) fall from 4.20 per speech-minute (shipped point) and 2.05 (shipped graph, strict point) to **0.17**;
  English read speech 3.92 → 0.45. (Adult read speech; whether this carries to children's spontaneous Hindi is unmeasured, §3.)
- Only one candidate was trained to completion (warm start + negatives); the from-scratch, no-negatives and bi-GRU 48
  candidates were stopped by the box's load (RESEARCH §5, `rj-r3vs-from-scratch-on-shared-box`), so the Hindi gain cannot
  be split between "more AMI speakers" and "FLEURS negatives".

## 2. The thinking-pause cue (voicesig → duplex)

### 2.1 Pause level, real Hindi speech (LiveKit EOT-Bench Hindi, CC BY 4.0, 400 adult turns; `pauses.mjs`)

| detector | labelled pauses | cue fired | P(speaker went on \| fired) (Wilson 95%) | share of holds caught | holds ≥ 500 ms caught | fired at a turn END |
|---|---|---|---|---|---|---|
| shipped filler-gru/1 @ 0.44 / 200 ms | 1074 (674 holds, 400 ends) | 21 | **1** (0.845-1) | 0.031 | 3/147 | 0/400 |
| round-3 `bi32-ft-neg` @ card point | 1074 (674 holds, 400 ends) | 11 | **1** (0.741-1) | 0.016 | 0/147 | 0/400 |

pComplete published by the cue = 1 − the lower Wilson bound = 0.259 (round-3 detector). ADULT, task calls to an agent; no STT involved.

### 2.2 Ceiling check with gold fillers (AMI test channels, 4-party meetings; `ami_pauses.py`)

| detector | events | base P(hold) | P(hold \| GOLD um/uh last) | P(hold \| cue fired) | detector vs gold trailing filler P / R |
|---|---|---|---|---|---|
| shipped | 1095 (701 holds) | 0.64 | 0.71 [0.624, 0.782] (n 124) | 0.738 [0.632, 0.821] (n 80) | 0.925 / 0.597 |
| round-3 `bi32-ft-neg` | 1095 (701 holds) | 0.64 | 0.71 [0.624, 0.782] (n 124) | 0.823 [0.71, 0.898] (n 62) | 0.968 / 0.484 |

4-party meetings: others take the floor after a filler far more than a tutor would; the ceiling here is a lower bound for a 1:1 lesson.

### 2.3 Through the real duplex bridge (duplex-real E1 replay; `duplex_replay.mjs`)

| arm (same recording eot-D4-after, frozen engine) | cut-offs on holds ≥ 500 ms | all holds ≥ 100 ms cut | in-speech commits | decision gap p50 / p90 ms | cue | engineRules / governor hash |
|---|---|---|---|---|---|---|
| off (HEAD engine, no estimate: production today) | 12/147 (0.082) | 12/674 | 4 | 923 / 2060 | - of - reads; {} | `2a14be6dbf` / `8b25c03c28` |
| + cue, shipped detector (zero-edit path: patch 03 only) | 12/147 (0.082) | 12/674 | 4 | 923 / 2224 | 27 of 1297 reads; {"hold": 22, "voiced": 5} | `2a14be6dbf` / `8b25c03c28` |
| + cue, round-3 detector (patch 03 only) | 12/147 (0.082) | 12/674 | 4 | 923 / 2060 | 11 of 1297 reads; {"hold": 9, "voiced": 2} | `2a14be6dbf` / `8b25c03c28` |
| + cue, round-3 detector + patch 04 (zH + backstop stretch) | 12/147 (0.082) | 12/674 | 4 | 923 / 2060 | 11 of 1297 reads; {"hold": 9, "voiced": 2} | `859c72958d` / `0f6911acf1` |

**Reading 2.1-2.3.** The cue is precise wherever it can be checked (every fire on EOT-Bench Hindi was a hold; 0.97 of
its AMI fires sit on a gold trailing um/uh) and rare (1.6% of holds with the round-3 graph). Through the real duplex
bridge it changes nothing on this recording: none of the 12 holds the engine cuts today ends in a filler (they follow
content words; 5 are pauses between digit groups of a dictated phone or form number), so neither the zero-edit path nor
patch 04 can prevent them. With the shipped graph one false fire at a turn end (a single drawn-out word) delayed that turn
by 2.0 s (p90 2,060 → 2,224 ms); the round-3 graph does not fire there. Verdict: **wired, harmless on this set, no
measured benefit for adults; it stays shadow** until the children's pilot measures it (§7).

## 3. Children: HiACC fire rates (evaluation only; `hiacc_eval.py`)

| detector @ point | children: runs / speech-min (speakers' IQR) | adults: runs / speech-min (IQR) | children: utterances with a run | adults | child / adult f0 median | cue fired per pause read, children / adults |
|---|---|---|---|---|---|---|
| `models/voicesig/filler-gru.onnx@0.44/200ms` | 2.812 ([1.35, 2.51, 3.16]) | 2.804 ([1.59, 2.21, 3.55]) | 0.153 | 0.133 | 259.3 / 174.5 Hz | 0.013 / 0.025 |
| `models/voicesig/filler-gru.onnx@0.53/300ms` | 1.308 ([0.7, 1.09, 1.43]) | 1.46 ([0.71, 1.24, 1.94]) | 0.078 | 0.074 | 259.3 / 174.5 Hz | 0.006 / 0.011 |
| `models/voicesig/filler-gru-r3.onnx@0.55/300ms` | 0.222 ([0.0, 0.0, 0.28]) | 0.774 ([0.27, 0.52, 1.07]) | 0.013 | 0.04 | 259.3 / 174.5 Hz | 0.001 / 0.006 |

HiACC (EVALUATION ONLY; CC BY 4.0 per Zenodo / CC BY-NC 4.0 per the article: the stricter reading applied). 20 children aged 10-14 and 24 adult speakers (the corpus metadata lists 24), Hinglish, Samsung Galaxy M34, 16 kHz. NOT a precision: the transcripts do not mark fillers. Fire rates under identical conditions, children vs adults. Children: 117.0 speech-min over 1858 utterances; adults 180.8 min / 3318 utterances.

**Reading table 3.** The shipped graph fires on these children exactly as often as on these adults (2.81 vs 2.80 per
speech-minute, same phone, same tasks), so it does not over-fire on child voices (f0 259 vs 175 Hz). The round-3 graph
fires **13× less on the children (0.22) but only 3.6× less on the adults (0.77)**. Either most of the shipped graph's
child fires were false (Hindi long vowels, which the negatives target), or the round-3 graph misses children's real
fillers (it has never seen a child, and Hindi fillers only as negatives in read speech). The transcripts cannot say
which. **This is the main new risk: on children the round-3 detector may be precise and deaf.** The pilot measures
recall as well as precision for exactly this reason (PILOT-PROTOCOL §6.1 reports recall; a recall far below the adult
0.43 would send the operating point back to val children).

## 4. What she would have done (shadow log; local production build)

SCRIPTED child turns (not children) on a LOCAL production build (HEAD + this stream + patches 01-04, NODE_ENV=production, Neon TEST branch). Shadow: nothing acts.

| turns | read a state | states | would hand a tie-breaker | counterfactual ran | her move would have changed | cost p50 / p95 / max ms | turns with vs_hold.fired | errors |
|---|---|---|---|---|---|---|---|---|
| 96 | 26 | {"searching": 3, "fragileCorrect": 13, "effortfulGuess": 8, "heldBelief": 2} | 24 | 24 | 3 (hint -> hint (gentlerHint); hint -> hint (gentlerHint); hint -> hint (gentlerHint)) | 11.5 / 44 / 84.6 | 56 | 0 |

Reading: the voice reads that today would hand the Director a tie-breaker change her move rarely (3 of 24), and only
through `gentlerHint` (a gentler rung's content). `followUpProbe`, the move the literature supports most (ITSPOKE's
"treat correct + uncertain as needing substance"), changed nothing in 13 fragileCorrect reads: the Director reads it as a
one-slot shortening of the optional-probe gap (`server/comprehension/schedule.js`), which rarely tips the turn. So even
a perfect detector would not make voice "major" in her moves until a proven state is given a real consumer effect (the
ladder's L1 step). Measured on a production build, labelled scripted.

## 5. Cost

Shared 4-vCPU sandbox at load 10-28 from other streams during every run (`evals/voicesig/results/2026-10-09/cost.json`):
absolute numbers are pessimistic and noisy.

| what | method | n | result |
|---|---|---|---|
| `HoldCueCore.frame()` per 20 ms hop (detector excluded) | `process.cpuUsage` over 10 min of synthetic hops (2 s voice / 1 s pause) | 3 runs | **0.05-0.08 ms CPU per audio-second** |
| one detector call, onnxruntime-web WASM, 1 thread (the device runtime), 3 s window (the cue's read) | wall clock after 1 warm-up | 20 | shipped p50 0.96 / p95 13.1 ms; round-3 p50 0.43 / p95 12.7 ms |
| same, 30 s window (a long turn's commit read) | as above | 20 | shipped p50 5.3 / p95 17.2 ms; round-3 p50 7.1 / p95 12.7 ms |
| patch 02's counterfactual `planTurn`, AFTER the commit (never on a hosted reply's path) | `debug.vs.shadow.ms`, local production build | 24 (battery) | p50 11.5 / p95 44 / max 84.6 ms |
| the rejected inline variant (on the reply path) | same, 3 battery runs | 3 × ~24 | p50 3.4-8.7 / p95 15.4-23.6 ms — moved off the path (`rj-r3vs-inline-counterfactual`) |

Same architecture and size as the shipped model (10,817 parameters, 45,496 B), so detector cost differences are load
noise. Bundle: the round-3 graph replaces the shipped one in the `?url` import (no size change). No Azure AI call is
added by this stream (all inference on device; the counterfactual is a pure in-process plan): **0 new paid calls.**

## 6. Gates

Run in this working tree on 2026-10-09 (HEAD `a8a6b56`, the main loop's WIP checkpoint that already contains this
stream's owned files; patches 01-04 not applied to the tree; they are applied in a scratch "after" copy =
`git archive HEAD` + owned paths + patches 01-04).

| gate | where | result |
|---|---|---|
| `npx tsc -b` | working tree | **pass** (exit 0, re-run after the last edit) |
| `npx vite build` | after copy, `--outDir` in scratch (the tree's `dist/` untouched) | **pass**; `filler-gru-r3-*.onnx` emitted as an asset |
| `tests/round3-voicesig.test.mjs` | working tree | **29/29** |
| `tests/p3-voicesig-server.test.mjs` · `tests/voicesig.test.mjs` · `tests/p3-voicesig-client.test.mjs` | working tree | 25/25 · 32/32 · 10/10 (the client file's "never delay" case failed once at load 25 with AND without the cue, then passed; it is a wall-clock test) |
| brain / duplex / safety suites with patches applied | after copy | brain-kernel 14/14, brain-lanes 5/5, lesson-safety 9/9, signals-lint 4/4, duplex-real-engine 18/18, duplex-real-replay 3/3, duplex-real-shadow 9/9, duplex-runtime 42/42, p1-duplex-live 17/17 |
| `git apply --check --cached` for 01-04 | against `cadf527`, `1fb079b` and `a8a6b56` | **all pass** |
| `tests/prod/round3-voicesig.mjs` **before** | `https://taxila.dev` (production, read-only arms; this stream not deployed) | 21/25: the 4 FAILs are exactly the round-3 items that are not deployed (status serves the round-3 detector row; status serves the cue row; the client bundle carries card `filler-gru/2`; the bundle carries `vs-hold/1`). Lesson DB checks and the safety arm skip remotely (WARN) |
| `tests/prod/round3-voicesig.mjs` **after** | local production build of the after copy (`NODE_ENV=production`, Neon TEST branch, port 8977) | **39/39** (incl. the safety arm: safeguard move, both helplines verbatim, no voicesig read and no `vs*` code on the disclosure turn) |
| full `npm test` | working tree | **not valid this round**: under other streams' load the browser engine suites hit hook timeouts that cascade (1,828 failures, none in a voicesig file; the same suites fail on a pure HEAD copy). Not claimed. |

Persona/child-safety invariants: the restriction-12 lint (`G-VS-LABEL`) runs inside `round3-voicesig.test.mjs` over
`src/voicesig`, `server/voicesig`, `evals/voicesig` and the four patches: green; no code or string names an emotion.

## 7. Still short of the bar, and exactly why

1. **Children's precision does not exist yet, and it is the bar that matters.** Every precision number above is ADULT
   (AMI meetings, EOT-Bench task calls). The licensed children's corpora were evaluated: MyST (the only large
   child corpus with filler marks) could not be obtained (registration/LDC route; no download reachable from this box);
   HiACC (20 Hinglish children, CC BY 4.0 on Zenodo, article CC BY-NC → evaluation only) has no filler marks, so it
   yields fire rates, not precision. The gate therefore keeps the detector **shadow** (`gate.js`: population must be
   children, precision ≥ 0.80 with CI lower bound ≥ 0.70, ≥ 20 children, ≥ 100 fired). The only route to the bar is the
   consented pilot (`PILOT-PROTOCOL.md`, vs-pilot-2: 32 children, 3 sessions, frozen bars), which needs the owner, an
   ethics committee and parents — not code.
2. **Adults: met at the point, not at the interval.** 0.842 [0.795, 0.885] speaker-clustered; the lower bound is 0.005
   under 0.80, and Indian-L1 speakers read 0.799 (n 164). It was mostly bought by a stricter operating point (shipped
   graph at the same rule: 0.818) and costs recall: 0.601 → 0.430 of all fillers ≥ 200 ms.
3. **Possible child deafness (new risk).** On HiACC the round-3 graph fires 0.22 runs/speech-min on children vs 0.77 on
   adults (shipped: 2.81 vs 2.80). Without child filler labels this is either fewer false alarms or missed child
   fillers. The pilot scores recall for exactly this; if child recall is far below adult, the operating point is
   re-chosen on val children, not shipped.
4. **The thinking-pause cue is precise but rare and prevented nothing here.** P(hold | fired) = 1 (11 fires, Wilson
   lower 0.741) on EOT-Bench Hindi, but it catches 1.6% of holds, and the 12 holds the duplex engine cuts on the real
   recording do not end in a filler (5 are digit-group pauses), so cut-offs stay 12/147 in every arm. Measured on the
   HEAD duplex engine; the duplex stream's in-flight engine changes are not merged, so `duplex_replay.mjs` must be re-run
   on the merged tree (APPLY.md). Benefit on children unmeasured; it stays shadow.
5. **Voice does not yet change her moves much, even in counterfactual.** 3 of 24 tie-breakers would change the move,
   all `gentlerHint` content; `followUpProbe` changed nothing in 13 reads because the Director consumes it as a weak
   one-slot schedule nudge. That is a Director-consumer limit, recorded for the ladder's L1 step, not fixed here (not this
   stream's files).
6. **Knowledge states remain simulated.** The 8 states (searching, fragileCorrect, effortfulGuess, heldBelief, …) are
   read and logged in shadow on scripted turns only; none has a measured child precision. Nothing acts on a child.
7. **Training breadth.** Only one round-3 candidate finished (warm start + FLEURS negatives); from-scratch and wider
   candidates were stopped by the shared box's load, so the Hindi false-alarm gain cannot be attributed between "more
   AMI speakers" and "negatives", and no child or Hindi filler has ever been a training positive.
