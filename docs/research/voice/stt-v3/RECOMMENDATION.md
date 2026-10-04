# STT v3 recommendation: who listens to the child for the whole session (2026-10-04)

Inputs:
- `SCAN.md`, the desk scan;
- `LICENCES.md`;
- the open-weight bench at `evals/stt-v3/results/` (`tables-stt-v3.md`, `summary-stt-v3.json`);
- the Azure refresh at `evals/model-refresh-2026-10-04/stt/`;
- prices from `evals/model-refresh-2026-10-04/setup/results/prices-2026-10-04.json`;
- the India latency run in `context/measurements.md` (Chennai ACA jobs, 2026-10-04).

Tags:
- **[M]** measured, with path;
- **[V]** vendor price or card;
- **[U]** our estimate, not measured.

**Every accuracy number here comes from synthetic TTS speech** (180 speech clips, 12 or 30 non-speech clips, and 4
reversed-babble clips). The figures measure each instrument, not real children. E1 (real children) is still the gate for
every promotion below.

---

## 0. The answer

**Owner directive.** The child is heard for the whole session, full-duplex, so they can interrupt or ask at any time
(`owner-always-listen-full-session-2026-10-04`, `owner-no-speech-gating-2026-10-04`). Under that directive STT is a
**per-session-hour** cost, and three facts decide the plan.

1. **No open model beats MAI-Transcribe-2 or gpt-live-transcribe (D4) on the turn-final transcript.** On character
   error, the best open model (Qwen3-ASR-1.7B) ties D4. The best *streaming* open model (Nemotron-3.5) is measurably
   worse:
   - character error: +0.018, 80% CI [0.008, 0.029];
   - numbers: 84/96 vs 92/96, and the 80% intervals do not overlap.
2. **One open model is the right always-on ear.** That model is `nvidia/nemotron-3.5-asr-streaming-0.6b` with
   auto-LID.
   - It is truly streaming: a partial every 320 ms, and the text is complete **254 ms p50** after the child stops.
   - It emitted nothing on 0/30 non-speech clips and 0 characters across 4 × 10-minute always-on soaks.
   - One L4 carries 128 streams.
   - It costs **$0.04-0.11 per session-hour all-in**, against **$1.02** for D4 and **$1.30** for Azure Speech with LID.
   - It has a commercial licence (OpenMDW-1.1) that allows fine-tuning on our own child audio.
3. **Sarvam and Shunya do not fit.**
   - Sarvam's weights are not available. v4 is API-only. v3 comes only as an encrypted SageMaker package: $5,000/month
     plus instances, with no fine-tuning.
   - Shunya's open `zero-stt-hinglish` **invented text on 27-30 of 30 non-speech clips** (examples: "आप आप आप…",
     "Volver a la taula"). For a microphone that is open for an hour, that rules it out.

**Pick per stage**

| stage | always-on listening (barge-in, partials, endpoint) | turn-final transcript (what the Director grades) | why |
|---|---|---|---|
| **Pilot now** (E1, ≤ ~100 children, average concurrency in single digits) | **MAI-Transcribe-2-Streaming** in southindia, with D4 as automatic fallback (as already decided) | the same stream | Below about 1.2-1.6 average concurrent sessions the API is cheaper than any warm GPU pair. MAI is the most accurate arm measured and the fastest from India (68 ms after commit, Chennai) |
| **Pilot, in parallel** | **Nemotron-3.5 auto-LID in shadow**: replay the consented E1 recordings offline, plus one live India latency probe | — | This answers the only open question, Nemotron on real children, for about $100 of GPU time. No production dependency |
| **At scale** (≥ ~20 average concurrent, and E1 passed) | **Self-hosted Nemotron-3.5** (auto-LID plus a script guard) in India. Azure Central India first; AWS ap-south-1 if quota clears and it is cheaper. API lane as hot fallback | Nemotron text for ungraded turns. On **graded-answer turns**, a second pass (MAI-Transcribe-2, or self-hosted Qwen3-ASR-1.7B) until E1 or a child fine-tune shows Nemotron within margin on numbers | About **9-25× cheaper per session-hour** than D4 once idle headroom is counted. Latency is equal or better. The audio stays in our own account |
| **At scale, after an E1 child fine-tune** | Nemotron, fine-tuned on consented E1 audio | Nemotron alone, if it passes | Removes the second pass |

**What STT cannot do for the owner's other ask.** STT does not produce a "human-like voice with modulation and
emotion"; none of these models outputs it.
- *Hearing* the child's emotion is a separate paralinguistic lane fed from the same audio stream (§6).
- *Speaking* with human-like modulation is the TTS / speech-to-speech side, covered in `../voices-hindi.md` and
  `../human-likeness.md`.

---

## 1. Accuracy against MAI-Transcribe-2 and D4 (80% intervals)

**Method.**
- The same corpus and the same `score.mjs` / `score2.mjs` were used throughout. The D4 and MAI rows re-score to the
  refresh tables exactly.
- ΔCER is the item-level paired difference against D4 (30 items × 6 conditions), with a bootstrap CI.
- numbers and answers use Wilson 80% intervals.
- Non-speech uses Wilson 80% intervals: the upper bound is 0.052 for 0/30 and 0.120 for 0/12.

| arm | cerNorm | ΔCER vs D4, 80% CI | numbers (80% CI) | graded answers (80% CI) | non-speech | wrong-script clips |
|---|---|---|---|---|---|---|
| **D4** gpt-live-transcribe + keywords + prompt (current eastus2) | 0.028 | — | 92/96 [0.924, 0.978] | 76/78 [0.940, 0.989] | 0/12 (n30 not run) | 0 |
| **MAI-Transcribe-2** batch | **0.017** | −0.011 [−0.022, 0.001] | 91/96 [0.911, 0.970] | **78/78** [0.979, 1] | 0/12 | 0 |
| **MAI-Tx-2-Streaming** (India primary) | 0.021 | −0.007 [−0.017, 0.003] | 90/96 [0.898, 0.962] | **78/78** [0.979, 1] | 0/12 | 3 |
| Qwen3-ASR-1.7B auto (best open, batch) | 0.031 | +0.003 [−0.005, 0.012] | 84/96 [0.825, 0.912] | 70/78 [0.845, 0.934] | 0/30 | 2 |
| **Nemotron-3.5 auto-LID 320 ms** (best open streaming) | 0.046 | +0.018 [0.008, 0.029] | 84/96 [0.825, 0.912] | 74/78 [0.906, 0.972] | 0/30; soak 0 chars / 40 min | 5 |
| Nemotron-3.5 auto-LID 560 ms | 0.048 | +0.020 [0.011, 0.030] | 84/96 [0.825, 0.912] | 74/78 [0.906, 0.972] | 0/30 | 4 |
| Nemotron-3.5 auto-LID 1120 ms | 0.045 | +0.017 [0.006, 0.027] | 85/96 [0.837, 0.921] | 71/78 [0.860, 0.944] | 0/30 | 3 |
| Nemotron-3.5 forced hi-IN (any chunk) | 0.148-0.167 | +0.12-0.14 | 70-72/96 | 56-59/78; **English answers 0/12** | 0/30 | 0 |
| Qwen3-ASR-0.6B auto | 0.078 | +0.050 [0.031, 0.071] | 70/96 | 64/78 | 0/30 | 1 |
| Voxtral-Mini-4B-Realtime 960 ms | 0.118 | +0.089 [0.064, 0.118] | 51/96 | 46/78 | 0/30 | 5 |
| Zero-STT-Hinglish (Shunya), language=hi | 0.125 | +0.097 [0.057, 0.137] | 83/96 | 68/78 | **30/30** | 1 |
| Zero-STT-Hinglish (Shunya), auto | 0.134 | +0.106 [0.064, 0.145] | 81/96 | 68/78 | **27/30** | 0 |

Not benched:
- **SraVaani ×2 and IndicConformer ×2**: gated on Hugging Face, and there is no accepted-terms token. `LICENCES.md`
  gives the SSM route.
- **The research-only Nemotron Hinglish fine-tune**: it needs NeMo.

**How to read it**
- **MAI-2 ≥ D4 > open models.** The MAI-vs-D4 intervals cross 0, so on synthetic speech they tie. MAI reaches that with
  no lesson keywords, while D4's keyword list equals the stimulus vocabulary.
- **Nemotron's gap is real but narrow.**
  - Character error: its 80% CI excludes 0.
  - Numbers: 84/96 vs 92/96, and the intervals do not overlap. Numbers are the strictest metric, because a lost digit
    becomes a wrong grade.
  - Graded answers: 74/78 vs 76/78, with overlapping intervals.
  - By category: Hinglish answers 24/24 and Hindi 21-23/24. The losses sit in pure English (9-11/12) and in numbers.
- **Noise behaves like D4, a little worse.**
  - Nemotron 560 ms cerNorm: clean 0.024 (D4 0.021), white 10 dB 0.062 (D4 0.032), pink 10 dB 0.059 (D4 0.031).
- **Two Nemotron failure modes have known fixes.**
  - Never force `hi-IN`: English comes back empty.
  - Auto-LID put 3-5 of 180 clips into Vietnamese or Arabic script. A Devanagari/Latin script guard catches these by
    construction.
- **Background speech leaks through every model.** Reversed-speech babble produced words on 1-4 of 4 clips for every
  arm (D4 and MAI were not run on babble). That is a speaker or VAD problem, not an STT choice (§5).

---

## 2. Latency from India

**What is measured from India.** Chennai ACA jobs, 2026-10-04, n = 20 [M]:

| lane | region | text after the client commits (p50 / p90) |
|---|---|---|
| MAI-Tx-2-Streaming | southindia | **68 / 75 ms** |
| D4 gpt-live-transcribe | eastus2 | 753 / 914 ms |
| app health round trip | Chennai → southindia app | 4 / 5 ms |
| app health round trip | Chennai → eastus2 | 215 ms |

**What is measured for the open models.** These were measured on the GPU host (AWS us-east-1 L4), audio fed in real
time, with no network [M]:

| arm | text complete after speech end, p50 / p90 | partial cadence | first partial p50 |
|---|---|---|---|
| Nemotron auto 320 ms | **254 / 452 ms** | 320 ms | 913 ms (clip clock) |
| Nemotron auto 560 ms | 279 / 574 ms | 560 ms | 759 ms |
| Qwen3-ASR-1.7B (batch) | about 0.98 s request after a 600 ms endpoint (1,582 ms by the batch convention) | none | — |
| MAI-Tx-2-Streaming (refresh) | — | — | **2,581 ms** |
| D4 (refresh) | — | — | 1,409 ms |

**Not measured.**
- India to AWS ap-south-1. The quota there is 0, so nothing could be launched.
- India to an Azure Central or South India GPU. Our Azure GPU quota has not been checked, and southindia GPU prices were
  not pulled.

**Estimate for Nemotron hosted in India** [U]:
- 254 ms of compute after speech end, plus one in-country round trip of about 20-60 ms (home ISP to Mumbai, Chennai or
  Pune).
- The text is complete about **0.3 s** after the child stops.
- The endpointer waits at least about 450 ms of silence before committing (commit-early, decided). So Nemotron's final
  text is ready **before** the commit and adds about **0 ms** to the turn.
- MAI adds 68 ms after commit. D4 from India adds 753 ms.
- A second pass on graded turns adds its own request time after commit: MAI batch about 1.2 s from the US, unknown from
  India; Qwen3 about 1 s on the GPU [M/U]. That is why §0 limits the second pass to graded-answer turns.

**Barge-in.** Nemotron sends partials every 320 ms. MAI's first partial comes at 2.6 s and D4's at 1.4 s. Barge-in
itself should still fire from the on-device VAD; STT partials only confirm that the sound is words. Nemotron is the only
lane fast enough to tell "the child said something" from "a noise" within one partial.

**To close the gap:** one Chennai ACA job against a single Nemotron container on an Azure Central India T4. This is the
same harness as the India latency run, and costs about $5.

---

## 3. Cost per always-on session-hour at 100 / 1,000 / 10,000 concurrent children

### 3.1 Assumptions

**Load profile [U].**
- C is *peak* concurrent children.
- Load is 6 peak-equivalent hours a day (after-school IST), 30 days a month, so session-hours/month = 180 × C.
- Every row is divided by the same session-hours.

**Self-hosted Nemotron-3.5 at 320 ms.**

| item | value | basis |
|---|---|---|
| Capacity per GPU (planning) | **64 streams per L4** | measured limit 128 at RTF p95 0.89, halved for p95 headroom; at 64, step p95 is 144 ms and RTF 0.45 [M] |
| Capacity per GPU (T4) | 32 streams | [U]: not measured on T4; T4 FP16 is about half an L4 |
| Fleet | ceil(C / cap) × 1.2 + 1 spare | 20% lead headroom, because a cold start takes 161 s [M, inherited] and autoscaling must run ahead of the ramp; plus N+1 |
| Flat schedule | the whole fleet 24 h a day | — |
| Autoscaled schedule | the whole fleet for the peak 6 h plus 2 h of ramp; max(2, 25% of fleet) warm for the other 16 h | — |
| On-call fallback | the API lane (D4 at $1.02/h) takes 0.5% of session-hours, i.e. GPU incidents at 99.5% availability [U] | It has no fixed cost (billed per use), but the client must reconnect mid-session to it |
| On-call people | not priced in the table | Each $1,000/month of on-call or ops time adds $0.056/session-hour at C = 100, $0.0056 at 1,000 and $0.00056 at 10,000 |

**Prices [V, pulled 2026-10-04].**
- AWS ap-south-1 g6.xlarge L4: $0.966/h on demand.
- AWS us-east-1 L4: $0.805/h.
- Azure Central India NC4as_T4_v3: $0.579/h.
- Spot is excluded for the live lane: a reclaim ends every child on that GPU.

**APIs [V].**
- gpt-live-transcribe: **$1.02/h** (southindia and eastus2 Gl meter).
- Azure Speech S1 real-time: $1.00/h, plus Enhanced/LID at $0.30/h.
- Commitment tiers are best-of: 100K h at $40,000 plus $0.40/h overage, and the LID add-on at 100K h for $12,000 plus
  $0.12/h.
- MAI-Tx-2-Streaming has **no meter**. The placeholder is the Fast Transcription meter at $0.36/h, unconfirmed until
  the 2026-10-06 bill.

### 3.2 Table

All values are $/session-hour, with $/month in brackets. Self-hosted figures include the fallback share.

| option | C = 100 (18k session-h/mo) | C = 1,000 (180k) | C = 10,000 (1.8M) |
|---|---|---|---|
| **Nemotron, Azure CI T4, autoscaled** [cap U] | **0.082** ($1.5k; fleet 6) | **0.051** ($9.3k; fleet 40) | **0.049** ($88k; fleet 377) |
| Nemotron, Azure CI T4, flat 24 h | 0.144 ($2.6k) | 0.098 ($17.6k) | 0.092 ($166k) |
| **Nemotron, AWS ap-south-1 L4, autoscaled** | 0.108 ($1.9k; fleet 4) | 0.048 ($8.6k; fleet 21) | **0.042** ($75k; fleet 190) |
| Nemotron, AWS ap-south-1 L4, flat 24 h | 0.160 ($2.9k) | 0.086 ($15.5k) | 0.079 ($141k) |
| Nemotron, AWS us-east-1 L4, autoscaled (+~200 ms RTT; not for live) | 0.091 | 0.041 | 0.036 |
| *Bench ideal: 128 streams, 100% utilised* | *0.0063* | *0.0063* | *0.0063* |
| **gpt-live-transcribe (D4)** | **1.02** ($18.4k) | **1.02** ($184k) | **1.02** ($1.84M) |
| Azure Speech RT + LID, pay-as-you-go | 1.30 ($23.4k) | 1.30 ($234k) | 1.30 ($2.34M) |
| Azure Speech RT + LID, best commitment tier | 0.845 ($15.2k) | 0.52 ($93.6k) | 0.52 ($936k) |
| MAI-Tx-2-Streaming at the $0.36 placeholder | 0.36 ($6.5k) | 0.36 ($64.8k) | 0.36 ($648k) |
| *Add-on: second pass on graded turns, MAI batch at $0.36, at most 25% of the hour* | +≤0.09 | +≤0.09 | +≤0.09 |
| *Add-on: second pass on graded turns, self-hosted Qwen3-ASR-1.7B* | +~0.02-0.04 [U] | same | same |

**Read-out**
- **Idle headroom is the real cost of self-hosting.** It moves Nemotron from the bench-ideal $0.006 to **$0.04-0.11**
  per session-hour, which is still **9-25× below D4** at every scale. A hybrid with the MAI second pass, at about
  $0.13-0.20, is still 5-8× below D4.
- **Break-even is low.** A warm pair of Azure CI T4s costs about $845/month. At $1.02 per session-hour it pays once
  average concurrency passes about **1.2 sessions** (AWS L4 pair: about 1.6) [U, SCAN §5.4].
  - E1, with 80 children, will mostly sit below that. That is why the pilot stays on the API.
- **Quota is the scale blocker, not money.**
  - C = 10,000 needs about 190 L4s or about 377 T4s in India.
  - AWS ap-south-1 G/VT quota is **0** today; us-east-1 is 8 vCPU (one g6.xlarge).
  - Azure GPU quota has not been checked.
  - Larger GPUs (A100 or H100 in Central India) would cut the node count about 10-30× and need a load test of their
    own.
- **MAI's price decides the pilot more than anything here.** If it bills at about $0.36, the pilot STT bill is a third
  of D4's. If it bills above D4, `owner-mai-preview-children-ok-2026-10-04` reverses.

---

## 4. Operational burden

| | API lane (MAI-Tx-2 / D4 / Azure Speech) | self-hosted Nemotron |
|---|---|---|
| Fleet | none | GPU pool in one Indian region. Autoscaling must lead the ramp (161 s cold start). N+1 spare. Health checks per stream |
| Serving stack | vendor | **Not yet production-grade.** The bench used transformers plus our own batched loop, because transformers' batched streaming stops after about 2 chunks (`rj-transformers-batched-rnnt-streaming`). Production needs NeMo or Riva-style serving (Riva NIM needs a paid NVIDIA AI Enterprise licence) or our loop hardened behind a WebSocket |
| Failover | vendor's | Client-side mid-session reconnect to the API lane. Must be built and tested: a dropped ear mid-sentence is a broken conversation |
| Model ops | vendor changes the model under us (Preview) | pinned revision (`ea30d66…`), our own regression gate (this bench), and a fine-tune pipeline on consented E1 audio |
| Safety probes | per model change | per model or serving change: non-speech n ≥ 30, a 60-minute soak, and the script guard rate |
| On-call | vendor status page | a rota covering IST after-school hours (about 16:00-22:00) at minimum |
| Quota | per-deployment capacity (`stt-live-concurrency-2026-10-04`: 40 parallel sessions OK) | regional GPU quota requests: **ap-south-1 is 0 today** |
| Data | audio leaves to the model vendor within Azure | audio never leaves our account. Better for children's audio, and the only route to a child fine-tune |
| Licence | Microsoft terms (Preview) | OpenMDW-1.1, permissive and commercial-OK (`LICENCES.md`) |

**Verdict.** Self-hosting is a real engineering workstream: about 2-4 engineer-weeks [U] for serving, autoscaling,
failover and probes, plus an ongoing rota. That buys back about 95% of the STT bill at scale, and it is the only
route to a model tuned on our own children.

---

## 5. What is still open (in order)

1. **E1 offline replay.** Nemotron auto-LID plus the script guard vs MAI and D4 on consented real-child audio:
   numbers, graded answers, babble and sibling speech. This decides whether a second pass is needed at all.
2. **India latency probe** on an Azure Central India T4 (and a quota check), from Chennai.
3. **T4 capacity.** The load test was L4-only; the T4 rows above use an estimated 32.
4. **The MAI meter** on the 2026-10-06 bill.
5. **Bench the gated arms** (SraVaani-0.5-live and 1.0, IndicConformer) through the SSM token route. They are
   Indian-trained, and SraVaani writes English in Latin, so they could beat Nemotron on numbers.
6. **A babble / sibling gate.** Every model wrote words on reversed babble. The always-on ear needs a target-speaker or
   near-field gate (an on-device VAD energy floor plus speaker enrolment from the child's first turns) before E1, under
   any STT.
7. **A production serving path** (NeMo streaming server vs our loop) and its own load test.

---

## 6. Reading the child's emotion and prosody from the same stream

The owner wants human-like voice interaction. The *listening* half of that is paralinguistic: how the child said
something, not only what they said. No STT here outputs it, so it is a **separate lane** fed by the same always-on
audio.

**What it takes**

1. **Fork the stream, do not add a model call.** The audio already arrives continuously at the Nemotron host. A sidecar
   on the same host, or on the device, computes the features every 0.5-1 s for frames the VAD marks as child speech.
2. **Use continuous features relative to this child's own baseline, not emotion labels.**
   - pitch (F0) level and range;
   - energy;
   - speaking rate (from Nemotron's token timing);
   - pause length before and inside answers;
   - response latency;
   - voice quality (jitter, shimmer, breathiness);
   - laughter and sighs, from a small non-speech event detector;
   - hesitation fillers, from the transcript itself.
   
   These are cheap: CPU or device, a few ms per second of audio [U]. They need no GPU budget.
3. **Map them to Director signals, not names.**
   - Examples: "slower and quieter than this child's first five minutes", "long pre-answer pause plus a rising end",
     "laughing".
   - The Director already has signal slots for these (`../emotion-attunement.md` §4, §6.3-6.4).
   - The law there holds: **prosody informs what the teacher does, and never becomes a stored category or a spoken
     label** ("you sound sad"). Categorical speech emotion recognition stays out: the best published macro-F1 is about
     0.43 on adult podcasts, and nothing exists for child Hinglish.
4. **An optional learned layer, later.** A self-supervised speech encoder can supply embeddings for an
   arousal/valence-style regressor. Candidates: WavLM or HuBERT, whose licences must be checked per checkpoint. The
   regressor would be fine-tuned only on consented E1 audio with human-coded states. It belongs on the same GPU as
   Nemotron: about 95M-300M parameters, batched [U].
5. **Gate it the way STT is gated.** Pre-register what "works" means, e.g. a Director policy using the feature beats
   transcript-only on a coded E1 subset (frustration onset caught earlier, no rise in false "are you OK?" interrupts).
   Until that is measured, the features may only shape pacing (wait time, words per turn), never content.
6. **Consent.** Voice features of a child are biometric-adjacent. Store aggregates per session at most, never raw
   per-utterance vectors, and cover it in the E1 consent text.

**Speaking side.** The other half of "human-like" (her voice's modulation and emotion) is TTS and speech-to-speech, not
STT. The always-on Nemotron ear helps it indirectly: low-latency partials let her back-channel ("haan…", "achha") and
yield mid-word the way a person does.

---

## 7. Decisions, measurements and rejections proposed

These are in `context/inbox/stt-v3.json`, and each is written up in `context/decisions.md`, `measurements.md` and
`rejected.md`:
- decisions: `stt-v3-pilot-api-plus-offline-shadow`, `stt-v3-scale-self-host-nemotron-ear`, `stt-v3-script-guard`,
  `stt-v3-paralinguistic-sidecar`;
- measurements: `stt-v3-accuracy-80ci-2026-10-04`, `stt-v3-cost-model-2026-10-04`;
- rejections: `rj-nemotron-turn-final-now`, `rj-sarvam-self-host-package`, `rj-api-per-hour-always-on-at-scale`,
  `rj-spot-gpu-live-lane`.

They rest on the bench's own inbox `context/inbox/stt-v3-bench.json`, which is also written up now.
