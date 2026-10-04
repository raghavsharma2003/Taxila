# RESEARCH-PLACEMENT: models, placement and policy for reading a child's knowledge state from voice

**Workstream:** voice-signals / Research B (models, placement, policy), 2026-10-04. Research only: no product code
changed, nothing committed or pushed, no Wave 2, duplex or `server/signals/**` file edited. No paid AI call was made.
Cloud checks were read-only (quotas, prices, budgets, running instances); nothing was launched.

**Owner directive this answers (2026-10-04, binding):** "Voice signal will be a MAJOR part in checking that the
student has understood or not. If Microsoft has a problem, use AWS or Neon."

**Builds on, does not repeat:** `docs/design/signals/RESEARCH.md` (**R**: tiers T/E/X, §1.1 restriction 12 verbatim),
`docs/design/signals/SIGNALS-SPEC.md` (**SS**: features, legal modes M0-M3, E1 protocol), the built signal layer
(`server/signals/**`, `src/signals/**`, `shared/signals.ts`), `docs/research/world-best/understanding-detection.md`
(**UD**: ESE §4, open item `wb-coc-epistemic-vs-emotional`), `docs/research/duplex/ARCHITECTURE.md` + `src/duplex/engine.ts`
(**DX**), `server/voice/features.js`, `src/voice/**`, `scripts/gpu/**` (the proven AWS job harness), `context/rejected.md`.

**Tags.** [M] measured here (n, method, date given); [T] already measured or decided in this repo (path cited);
[V] primary source read this session; [S] secondary source; [E] estimate, with the experiment that replaces it;
[U] unverified or my inference. **Not legal advice:** every policy reading below is [U] until counsel or Microsoft
answers in writing; the verbatim quotes are [V].

**Artefacts.** Harness: `evals/voicesig/placement/` (`export.py`, `prosody_net.py`, `expose.py`, `bench-one.mjs`,
`bench-all.sh`, `frontend-bench.mjs`, `train_cost.py`, `hfmeta.py`). Raw results: `evals/voicesig/placement/results/2026-10-04/`.
Cloud probes: `scripts/voicesig/aws-check.py`, `scripts/voicesig/azure-gpu-quota.py` (read keys from `.env.local`,
print none). Model weights are not in the repo (all > 20 MB or untrained); `export.py` re-creates them from Hugging Face.

---

## 0. The answer on one screen

1. **Placement is not what keeps us inside Microsoft's rule; the target is.** Restriction 12 binds "customers of
   Microsoft AI Services" and forbids using "the services" to infer emotional states [V]. Our own model on the phone,
   on AWS or on plain Azure compute is not itself a Microsoft AI Service. But restriction 4 also forbids using the
   services to "interact with content, decisions, or actions prohibited in this Code" [V]. So if an emotion model ran
   anywhere and its output reached the Azure-served teacher or TTS, the Microsoft services would be acting on a
   prohibited inference. Moving an emotion model to AWS does not cure that. A **knowledge-state** model is outside
   restriction 12 wherever it runs, provided it passes the label test in item 2. On that reading, Microsoft "has no
   problem" with the knowledge-state model, so the owner's AWS/Neon fallback is needed for two things only: GPU
   training (Azure has 0 GPU quota) and the optional shadow emotion arm.
2. **The label test** (§4.2), proposed as a build gate. A voice model is a knowledge-state model only if:
   - (a) its training target is a **task outcome**: correct now, delayed or transfer success, recognition-probe
     success after "yaad nahi", or the same wrong answer persisting after feedback. It is never a human rating of how
     the child seemed to feel or sound;
   - (b) its outputs are named for knowledge or for the teacher's move;
   - (c) nothing documents, logs or prompts them as a feeling;
   - (d) a lint enforces (b) and (c).

   The EU Commission guidelines say "attitude and emotion are equivalent" for anti-circumvention [S via FPF]. Renaming
   an emotion classifier does not move it, so (a) is the test that carries the weight.
3. **Encoder choice (measured, §2): the Smart Turn v3.2 backbone is the one shared encoder.** It is a Whisper-tiny
   encoder (4 layers, d = 384) plus an attention-pool and MLP head: 8.68 MB int8, BSD-2-Clause, trained on CC-BY-4.0
   data [V]. I exposed its frame sequence and pooled 384-d embedding as extra graph outputs. The end-of-turn logit is
   unchanged (max diff 0.0), and the cost is the same: wasm 1-thread min 209.1 ms vs 209.0 ms [M]. So **one encoder
   pass per turn end feeds both** DX's `pTurnEnd` and the knowledge head. That is "one shared audio front-end, never
   two", by construction.
4. **The SSL family loses on the device by a wide margin.** wav2vec2-base, HuBERT-base, WavLM-base-plus and
   DistilHuBERT were measured int8 in onnxruntime-web WASM, 1 thread, 3 s of audio:
   - the three base models: 1,361-1,388 ms min, 122 MB, +650-793 MB RSS;
   - DistilHuBERT: 895 ms min, 50 MB.

   The whole Whisper-tiny encoder costs 209 ms over **8 s** of audio [M]. Their raw-waveform CNN front-end is the cost.
   Licence blocks two other candidates: MMS is CC-BY-NC-4.0, and IndicWav2Vec Hindi is a gated repo at 1.26 GB [V].
   WavLM is CC BY-SA 3.0 (share-alike on derived weights) [V]: usable as an offline teacher, not shipped.
5. **The first knowledge model should be small and interpretable, and needs no GPU.** E1 is about 3,200 child turns
   from 40 children (SS §7.2). That supports a regularised logistic or GAM over about 30 timing and prosody features
   plus per-child intercepts (UD's ESE), with a linear probe on the frozen Smart Turn embedding as the challenger.
   - The 38k-parameter prosody GRU trains one E1-sized epoch in **20.4 s on 4 vCPU** [M] and infers in **1.9 ms**
     wasm [M].
   - Embedding extraction for all of E1 is minutes of CPU.
   - **GPU is needed only for a later encoder fine-tune**, which runs at 2.5 clip-passes/s on 4 vCPU [M], about 7 h
     for E1 × 20 epochs.
6. **Cloud state, measured 2026-10-04:**
   - **Azure:** 0 GPU quota in all 10 regions checked. Seven Compute quota requests from 2026-10-03 all read `Failed`.
     Container Apps dedicated A100 limit is 0 [M]. CPU quota in South India is large: D-family limits of 65-350 vCPU.
   - **AWS ap-south-1 (Mumbai):** 0 G/VT quota, on-demand and spot.
   - **AWS us-east-1:** 8 vCPU G/VT, on-demand and spot [M]. Spot minima over 6 h: g4dn.xlarge $0.252, g5.xlarge
     $0.412, g6.xlarge $0.564 per hour [M].
   - **Instances:** none running in either region, no orphan volumes.
   - **Budget:** `taxila-build-gpu` $100/month, $0.00 actual [M].
7. **Training plan (§3):**
   - Phase 1 (E1) runs on CPU in India: an Azure Container Apps job in South India, under $2. If the owner wants no
     Microsoft compute at all, use AWS c7i.2xlarge spot in Mumbai at $0.153/h, under $2.
   - Phase 3 (encoder fine-tune) runs on AWS g5/g6 spot through the existing `scripts/gpu` harness. That harness has a
     self-shutdown, an EventBridge backstop, a reaper and terminate-on-exit.
   - Estimated $22-36 at spot (at most $64 if every run fell back to on-demand) against the $80 AWS cap [E], and $0-2
     against the $20 Azure cap.
   - Child audio leaves India only if the owner files a Mumbai G-quota request (`L-3819A6DF`, 0 → 8). Otherwise the
     P4 consent must name US processing.
8. **Indian law binds all three clouds equally, and it is stricter than restriction 12 in one place.**
   - DPDP s.9(3) says a Data Fiduciary "shall not undertake tracking or behavioural monitoring of children" [S]. That
     is a prohibition, not a consent requirement.
   - The Fourth Schedule exempts an "educational institution" only for "the educational activities of such
     institution" [V].
   - Whether Taxila is one, and whether per-child timing baselines are "behavioural monitoring", is a **counsel
     question before 13 May 2027** (s.9 commencement [S]).
   - Microsoft's AUP, AWS's AUP and AWS's Responsible AI Policy all forbid unlawful use or unlawful monitoring [V], so
     whatever DPDP forbids is forbidden on every cloud.
   - Design answer: persistent baselines only under explicit, unbundled parental consent. The default is off, with
     session-only baselines (SS mode M0), so the feature still works with the toggle off.
9. **Per-child baselines should stay in the main database** (Azure PostgreSQL, South India, existing `voice_baseline`
   table), not move to Neon.
   - Storing numbers in a database does not use a Microsoft AI service.
   - Neon has no India region: 11 regions listed on 2026-10-04, the nearest is Singapore [M].
   - Neon would add a second deletion path.

   §5 still gives the Neon-portable schema: pseudonymous key, load at lesson start, write once at lesson end, so the
   owner can choose Neon without redesign.
10. **A finding for the duplex workflow** (not my files): DX budgets Smart Turn at "10-100 ms CPU [V]" per candidate
    endpoint. In WASM, 1 thread, on this Xeon it is **209 ms min** [M]. On a mid-range Android big core that is about
    420-840 ms [E]. Options:
    - a 3 s window (67 ms min here [M]);
    - wasm threads, which need COOP/COEP cross-origin isolation (Taxila sets neither today [M: grep]);
    - WebGPU (unmeasured);
    - running the encoder on our own ACA CPU in India (native 40 ms [M]).

    A device-lab run (VSP-M1) decides.

---

## 1. What the model infers, and what it may be called

The frame (from the brief, unchanged): the target is the child's **knowledge and metacognitive state** as evidenced
in a spoken answer, not a feeling. The science is feeling-of-knowing and prosodic uncertainty:
- Smith & Clark 1993: weaker FOK went with rising intonation, hedges, "uh/um", and "I don't know" over "I can't
  remember" (n = 25 adults [V abs via UD]).
- Brennan & Williams 1995: listeners read those cues as the speaker's knowledge.
- Krahmer & Swerts 2005: children produce and perceive uncertainty cues [V abs via R].
- Pon-Barry & Shieber 2011.
- The ITSPOKE line, which is the most important for naming. Litman & Forbes-Riley frame uncertainty as a
  **learning impasse**: "the incorrectness component of each state reflects the actual accuracy of the student's
  answer, while the uncertainty component reflects the tutor's perception of the student's awareness of this
  accuracy" [V, Handbook of Metacognition and Learning Technologies 2013, ch. 25]. Their results:
  - Wizard-of-Oz uncertainty adaptation: significantly higher learning.
  - The fully automated version: significant "only for a subset of students", because the system "did not
    automatically recognize student uncertainty often enough" [V].

  **Detector recall, not the idea, was the bottleneck.** That is the engineering problem this file places.

**Outputs are named for knowledge, and each name is defined by the outcome it is trained to predict.** This is the
naming half of the label test (§4.2). The state names below are **Research A's** (`RESEARCH-SCIENCE.md` §1.3), adopted
here so there is one vocabulary. This file adds the **training target** for each name, which is what makes the name
honest. A model emits calibrated probabilities `p.<name>`; the closed vocabulary for `server/voicesig` and
`src/voicesig` is:

| brief's description | state name (Research A) | training target (an outcome event, never a rating of feeling) | teacher move it licenses |
|---|---|---|---|
| confident-correct, fluent recall | `fluentRecall` | correct now **and** correct on the delayed or woven check | advance; space out the next review |
| uncertain-correct (fragile) | `fragileCorrect` | correct now **and** fails the delayed or transfer check on the same skill (UD ESE) | "why?" or a transfer probe instead of moving on |
| confident-wrong (misconception) | `heldBelief` | wrong now, and the **same** wrong answer or misconception match recurs after feedback | address the misconception (no plain re-ask) |
| searching / tip of the tongue | `searching` | "can't recall" (IDK_R) or a late non-answer, **then** success on a recognition probe or recall cue | recall cue, longer wait; not teach-fresh |
| doesn't know | `absent` | IDK, then a failed recognition probe | teach fresh |
| guessing, effortful (knows they don't know) | `effortfulGuess` | wrong now, and wrong again on an isomorphic item with no persistent wrong value | the normal not-yet path |
| guessing, rapid | `rapidGuess` | the answer does not replicate on an isomorphic item next turn (either verdict) | discount the evidence; re-ask or offer a choice |
| reasoning aloud | `workingAloud` | multi-clause speech while the answer is still forming, followed by an answer in the same turn (DX `thinking_pause` hold) | hold the floor, never interrupt |
| (combined) | `answerReliability` | the LR multiplier on the graded emission, fitted against delayed success (ESE) | evidence weight only |
| (gate) | `q`, `ABSTAIN` | audio reliability (`server/signals/quality.js`, SS §2.6) | no move when unreliable |

Two names in the existing code need the same discipline:
- **`unsureCorrect` in `shared/signals.ts`** is fine while it is fed by Tier-T hedge words ("shayad": the child said
  it). It must not be emitted by a voice model under that name. The voice-derived equivalent is `fragileCorrect`, and
  Research A proposes renaming the built state too.
- **SS §7.2's coder labels** (`unsure-correct` coded by two raters from audio) are acceptable for evaluating and
  diagnosing the shipped model. They are **not** acceptable as its training target, because they are human
  perceptions of how uncertain a child sounded (§4.2).

---

## 2. Candidate encoders and models: licence, size, measured latency

### 2.1 Method [M]

- **Machine:** 4-vCPU Intel Xeon @ 2.1 GHz, Node 22.22, onnxruntime-node 1.30.0 (native CPU) and onnxruntime-web 1.30.0
  (WASM SIMD, the browser's engine, run in Node). Python 3.11, torch 2.14.1+cpu, transformers 5.18, onnxruntime
  1.30.0 for export and int8 dynamic quantisation (MatMul/Gemm weights).
- **Load caveat:** the container was shared with other workflows' test suites during the runs. The load average was
  6-13 on 4 vCPUs (`uptime`, 20:15 and 20:25 UTC). **I report min and p50.** The min is the best estimate of the
  uncontended cost on this machine, and p50/p95 are inflated by contention. Multi-thread cells came out *slower* than
  1-thread (Smart Turn native 4 threads p50 243 ms vs 1 thread 47 ms), so **all multi-thread numbers are discarded as
  invalid**.
- **Protocol:** each (model, runtime, input) cell ran in a fresh process. The process recorded session create time,
  one warm-up run, then N timed runs (N = 5-200, by cost) on fixed pseudo-random input. Inputs:
  - 80 × 800 log-mel (8 s, Smart Turn's fixed window: "Up to 8 seconds … padding at the beginning" [V README]);
  - 80 × 300 (3 s);
  - raw 16 kHz audio of 3 s and 8 s for the wav2vec2 family;
  - 800 × 10 frame features + 16 scalars for the prosody net.
- **Fidelity:** the cosine between the int8 and torch pooled embeddings on the same input.
- **Date:** 2026-10-04. Raw: `results/2026-10-04/bench-grid.jsonl`, `bench-rerun.jsonl`, `export.jsonl`.

### 2.2 Results [M]

Latency is in ms, min / p50, single thread. Create time and RSS are for the WASM runtime.

| model | input | params | int8 size | int8 fidelity (cos) | native ORT min / p50 | **WASM min / p50** | WASM create | WASM RSS + |
|---|---|---|---|---|---|---|---|---|
| prosody logistic (29 → 7) | 28 numbers | 203 | 1 KB (fp32) | — | 0.01 / 0.01 | **0.02 / 0.03** | 252 | 56 MB |
| prosody CNN+BiGRU (§2.7) | 800 × 10 + 16 | 38,184 | 159 KB (fp32) | — | 0.88 / 0.95 | **1.87 / 2.06** | 268 | 70 MB |
| **Smart Turn v3.2 cpu** (int8) | 8 s mel | 8 M [V] | 8.68 MB | (vendor) | 40.26 / 41.85 | **209.04 / 242.15** | 875 | 180 MB |
| **Smart Turn v3.2, shared outputs** (+frames, +pooled) | 8 s mel | 8 M | 8.68 MB | logit diff 0.0 | 40.73 / 45.43 | **209.14 / 215.90** | 1,007 | 181 MB |
| Smart Turn v3.2 gpu (fp32) | 8 s mel | 8 M | 32.4 MB | — | 64.95 / 67.57 | 377.99 / 388.75 | 595 | 292 MB |
| Whisper-tiny encoder (our int8) | 8 s mel | 7.79 M | 9.98 MB | 0.9965 | 26.66 / 27.61 | 211.89 / 227.51 | 409 | 183 MB |
| Whisper-tiny encoder, 3 s window | 3 s mel | 7.79 M | 9.59 MB | — | 8.56 / 13.82 | **67.22 / 98.34** | 1,076 | 180 MB |
| Whisper-base encoder | 8 s mel | 20.03 M | 23.6 MB | 0.998 | 54.01 / 56.64 | 477.96 / 487.47 | 666 | 205 MB |
| DistilHuBERT | 3 s audio | 23.49 M | 50.4 MB | 0.9941 | 170.21 / 174.87 | 894.96 / 916.74 | 547 | 390 MB |
| DistilHuBERT | 8 s audio | | | | 476.74 / 496.20 | 2,507 / 2,636 | 659 | 430 MB |
| wav2vec2-base | 3 s audio | 94.37 M | 121.9 MB | **0.8405** | 223.18 / 234.10 | 1,363 / 1,397 | 1,235 | 651 MB |
| wav2vec2-base | 8 s audio | | | | 632.24 / 645.37 | 3,880 / 4,143 | 1,081 | 709 MB |
| HuBERT-base (ls960) | 3 s audio | 94.37 M | 121.9 MB | 0.9812 | 222.46 / 228.45 | 1,361 / 1,393 | 1,084 | 650 MB |
| HuBERT-base | 8 s audio | | | | 623.28 / 638.89 | 3,872 / 4,174 | 1,089 | 712 MB |
| WavLM-base-plus | 3 s audio | 94.38 M | 122.2 MB | 0.988 | 228.19 / 235.77 | 1,388 / 1,470 | 1,111 | 793 MB |
| WavLM-base-plus | 8 s audio | | | | 672.10 / 678.10 | 3,885 / 3,937 | 1,188 | 884 MB |
| wav2vec2-base fp32 (ref) | 3 s audio | | 377.7 MB | — | 386.00 / 414.84 | — | — | — |

**What the numbers say:**
- **WASM costs 5-8x native here.** Smart Turn native min is 40 ms against 209 ms in WASM. The vendor's "12 ms on a
  modern CPU" [V] is a native, multi-threaded x86 figure. **Browser budgets must use WASM numbers.**
- **The raw-waveform SSL encoders are 6.5x the Whisper-tiny encoder** per pass at **3 s vs 8 s** of audio. Per second
  of audio the gap is about 17x. Their 7-layer CNN on 16 kHz samples (plus a 128-tap positional conv) dominates short
  inputs. DistilHuBERT keeps that front-end, so distilling the transformer barely helps (895 ms).
- **wav2vec2-base int8 drifts** (cos 0.84; HuBERT 0.98, WavLM 0.99). Pretrained-only wav2vec2 has activation outliers
  that dynamic int8 handles badly. It would need static calibration or fp16.
- **Exposing two encoder outputs from Smart Turn is free:** same logits, same min latency. The graph surgery is
  `expose.py`; the tensors are `layer_norm_8` [1, 400, 384] and `sum_1` [1, 384].
- **A 3 s window is 3.1x cheaper than 8 s** (67 vs 209 ms min). Smart Turn itself is trained on left-padded 8 s
  windows, so a 3 s variant is a separate model or a re-trained Smart Turn. Option for VSP-M1 only.

### 2.3 The front-end around the encoder [M]

`frontend-bench.mjs`, 2026-10-04, same machine:
- **The shipped `dsp.ts` `FrameAnalyzer`** (YIN F0 on speech frames, RMS, adaptive floor), fed 20 ms chunks as the
  worklet does: **0.172 ms p50 / 0.287 ms p95 / 0.428 ms p99 per 20 ms hop**, about **9.6 ms CPU per audio second**.
  n = 1,575 hops, 1,459 of them voiced. A second run under load average 12 gave p50 0.171 ms and p99 2.04 ms.
- **A Whisper-style 80-bin log-mel over 8 s** (400-point Hann, hop 160, 512-point radix-2 FFT, naive JS with twiddles
  recomputed per butterfly): **73.9 ms p50** for the whole window (n = 30); 97 ms under load average 12.
  - Computed incrementally per 10 ms hop as audio arrives, that is about 0.09 ms per hop, about **9 ms per audio
    second**. At turn end the mel is already in the ring and adds nothing to the turn-end latency.
  - Precomputed twiddles would cut it further [E].

So the front-end adds about 9-10 ms of main-thread or worker CPU per audio second for the mel. That is the same order
as the YIN path that already runs.

### 2.4 One shared front-end, two heads (the design that answers "never two")

```
 mic ─► featureWorklet (16 kHz, 20 ms)  [built, src/voice]
          ├─► dsp.ts FrameAnalyzer: VAD frames, YIN F0, RMS          [built]  ── prosody contours + tracker scalars
          └─► log-mel ring, 80 × 10 ms, last 8 s                     [new, ~9 ms/audio-s]
                    │
                    ▼   ONE encoder pass per committed turn end (and at DX's candidates, when the duplex flag is on)
          Smart Turn v3.2 backbone (int8, 8.7 MB, one ORT-web session in a Worker)
             ├─► logits ─────────────────► pTurnEnd ──► DX floor manager (duplex workflow owns the policy)
             └─► sum_1 [384] (+ layer_norm_8 frames) ──┐
          prosody GRU pooled [96] + 16 scalars ─────────┴─► knowledge head (MLP, < 50 KB) ─► KnowledgeVoice
                                                                                 (§1 vocabulary, numbers only)
```

**Rules for the shared front-end:**
1. **Exactly one ORT session and one mel ring per tab.** Whoever owns the session (proposal: `src/voice/`, the
   existing neutral owner of the tap) publishes `encoderPass{turnSeq, t, logits, pooled}`. The duplex engine and
   voicesig both subscribe. Neither creates a second session (§6).
2. **The knowledge head reuses the last pass at the committed turn end.** It runs its own pass only if no pass exists
   for that turn: duplex flag off, or Smart Turn not yet validated (DX keeps `w_audio = 0` until X1).
3. **Through Phase 2, the backbone stays frozen and only the heads train.** Fine-tuning the backbone would change
   DX's end-of-turn behaviour. Any later fine-tune is multi-task (the EOT loss on Smart Turn's CC-BY data plus
   our child holds, and the knowledge loss), and ships only if EOT metrics do not regress (VSP-M5).
4. **The prosody path is the floor.** Devices too slow for the encoder (VSP-M1 class probe: one pass on silence at
   session start, disable if > 600 ms [E threshold]) run prosody + scalars only. The head degrades by dropping
   inputs, not by failing.

### 2.5 Phone estimate and delivery

**Mid-range Android (A76/A78-class big core) is estimated at 2-4x the Xeon WASM single-thread time** [E].
- Basis: Geekbench-6-class single-core ratios between a 2.1 GHz cloud Xeon and Helio G99 / Dimensity 6100 / Snapdragon
  6 Gen 1 big cores [U].
- Chrome may schedule a Worker on a little A55 core under thermal or battery pressure, at about 6-10x [E].
- Replaced by VSP-M1. The repo's own A55 caution is in `rejected.md` (wav2arkit, 491 ms per audio second here).

| path | Xeon WASM min [M] | mid-range big core [E] | verdict |
|---|---|---|---|
| prosody GRU (+ scalars) | 1.9 ms | 4-8 ms | always on |
| Smart Turn shared pass, 8 s | 209 ms | 420-840 ms | fits inside the classify call (726 ms p50 after commit [T DX §5]) on mid-range phones; the evidence is keyed to its turn and folds late if it misses |
| Whisper-tiny 3 s window | 67 ms | 135-270 ms | fallback design if VSP-M1 fails the 8 s pass |
| Whisper-base 8 s | 478 ms | 0.96-1.9 s | offline challenger only |
| wav2vec2 / HuBERT / WavLM, 3 s | 1.36-1.39 s | 2.7-5.6 s | rejected on device |
| DistilHuBERT, 3 s | 0.90 s | 1.8-3.6 s | rejected on device |

**Delivery cost [M]:**
- `ort-wasm-simd-threaded.wasm`: 14.2 MB raw, 3.7 MB gzip. DX ships it anyway for Smart Turn, so it is shared.
- Smart Turn int8: 8.68 MB raw, 7.5 MB gzip.
- Prosody GRU: 159 KB.
- WASM RSS with Smart Turn loaded: +180 MB. That matters on 3-4 GB phones next to the avatar. Measure on device.
- **Threads:** multi-threaded WASM needs `crossOriginIsolated`, so the page must send COOP `same-origin` and COEP
  `require-corp` or `credentialless` [S]. A grep of `server/`, `src/`, `scripts/` and the vite config finds neither
  header today [M].
- **WebGPU:** Chrome on Android has shipped WebGPU since 121 on Android 12+ with Qualcomm and ARM GPUs [S]. For an 8M
  model, dispatch overhead may cancel the gain [U]. Unmeasured here (no GPU in the container).

### 2.6 Licences: models and corpora (anything trained into a shipped model must permit commercial use)

Checked on the Hugging Face API and the model cards, 2026-10-04 [V]. Raw: `results/2026-10-04/hf-meta.jsonl`.

| candidate | licence | gated | size | may it ship in weights? |
|---|---|---|---|---|
| **pipecat-ai/smart-turn-v3** (v3.2 cpu/gpu ONNX) | **BSD-2-Clause**; training data `smart-turn-data-v3.1/3.2-train` **CC-BY-4.0** (attribution) | no | 8.7 / 32.4 MB | **yes** (add to LICENSES with data attribution). sha256 cpu `2bb02631…967e4f`, gpu `ab8dc64b…39be` [M] |
| openai/whisper-tiny, whisper-base | Apache-2.0 on the HF card (MIT on GitHub) | no | 151 / 290 MB fp32 | yes |
| facebook/wav2vec2-base, hubert-base-ls960, data2vec-audio-base, wav2vec2-xls-r-300m; ntu-spml/distilhubert | Apache-2.0 | no | 94-1,270 MB | yes by licence; **no by latency** (§2.2) |
| microsoft/wavlm-base, wavlm-base-plus | card links UniSpeech `LICENSE` = **CC BY-SA 3.0 Unported** [V] | no | 378 MB | commercial use allowed, but **share-alike**: derived weights we distribute to browsers would have to be CC BY-SA. **Offline teacher only** |
| facebook/mms-300m, mms-1b | **CC-BY-NC-4.0** | no | 1.27 / 3.86 GB | **no**: eval and research only, labelled as such |
| ai4bharat/indicwav2vec-hindi | Apache-2.0 card, but **gated** ("auto") | yes | 1.26 GB | **no** (no-gated rule; also too large) |
| ai4bharat/indic-conformer-600m-multilingual | MIT, **gated** | yes | — | no (no-gated rule) |
| facebook/w2v-bert-2.0 | MIT | no | 2.3 GB | yes by licence, far too large |
| UsefulSensors/moonshine-tiny | MIT (English) | no | 108 MB fp32 | yes; a variable-length encoder worth a later bake-off (not measured) |
| onnx-community/silero-vad | MIT | no | 0.6 MB int8 | yes (if a model VAD is wanted) |
| livekit/turn-detector | LiveKit model licence ("other") | no | — | no (already excluded in DX) |
| speechbrain ECAPA, WeSpeaker | Apache-2.0 / CC-BY-4.0 | no | — | **use banned**: speaker identification (restriction 15; `voice-features-longitudinal` "never voiceprints") |
| openSMILE / eGeMAPS | research and private use only; commercial needs an audEERING licence [S] | — | — | **do not ship openSMILE**; `dsp.ts` already reimplements the published feature definitions |
| SER, for a shadow arm only: audeering wav2vec2-large-robust-12-ft-emotion-msp-dim | CC-BY-NC-SA-4.0 | no | 661 MB | never ships; internal research use is a counsel question |
| emotion2vec_plus_base | FunASR "model-license" ("other") | no | 1.1 GB | never ships |
| speechbrain emotion-recognition-wav2vec2-IEMOCAP | Apache-2.0 code; IEMOCAP data is research-licensed | no | — | never ships |
| **Corpus: MyST** (470 h, 1,371 US children, grades 3-5, talking to a virtual science tutor) | free for **non-commercial** use under a CC licence; commercial licence by contract with Boulder Learning [S: LDC2021S05, arXiv 2309.13347] | — | — | **evaluation and research only** unless a commercial licence is bought; the closest public analogue to our turns |
| Corpus: Smart Turn data v3.x | CC-BY-4.0 | no | — | yes (EOT loss in any multi-task fine-tune) |

**No public corpus carries knowledge-state labels for child speech with a commercial licence.** Pon-Barry's and the
ITSPOKE corpora are not public [U]. **The training labels must come from Taxila's own consented sessions**, and they
come for free from outcomes (UD ESE). Synthetic TTS cannot train prosody meaning: SS §7.1 and the ES-2 finding that
TTS fillers are not human fillers [T].

### 2.7 Verdicts and the model ladder

| stage | data | model | where it runs | needs GPU? |
|---|---|---|---|---|
| **K0 (now)** | none real | rules already built (`server/signals`), plus the timing z-scores in `features.js` | device + server | no |
| **K1 (E1: about 3,200 turns, 40 children)** | E1 audio (P4 consent) + outcomes | (a) regularised logistic or GAM over ≤ 30 timing and prosody features with per-child random intercepts (ESE); (b) challenger: L2 linear probe on the frozen Smart Turn `sum_1` (or PCA-16 of it); (c) challenger: the 38k prosody GRU. **About 1-2 parameters per 30 events** sets the capacity: with about 500-1,000 minority events, (a) is the expected winner [E] | inference on device; training on CPU in India | **no** (§3.1) |
| **K2 (production shadow; M1+ consented children, ≥ 50k answered turns with outcomes)** | handcrafted features from all consented children; embeddings **only** from the P4 cohort (§3.2) | the same heads refit monthly; prosody GRU if K1 shows contour value | device | no |
| **K3 (only if K1/K2 show the frozen embedding helps but plateaus)** | P4 audio, about 20-50k clips | multi-task fine-tune of the Smart Turn backbone (EOT + knowledge), optionally distilled from a WavLM-base-plus teacher fine-tuned offline | training on AWS GPU; inference still on device | **yes** (§3.4) |

**Rejected for on-device use:** wav2vec2-base, HuBERT-base, WavLM-base-plus, DistilHuBERT (latency, size, memory); MMS
(licence); IndicWav2Vec (gated, size); Whisper-base (2.3x tiny's cost for an unmeasured gain; kept as an offline
challenger).

---

## 3. Training plan: what needs a GPU, and where it runs

### 3.1 What actually needs a GPU [M]

`train_cost.py`, 2026-10-04; 4 vCPU, torch CPU, 4 threads, shared container (load average 6.8-7.8), so these are upper
bounds:

| job | measured | at E1 scale | at K3 scale (50k clips × 30 epochs) |
|---|---|---|---|
| prosody GRU, one epoch over 3,200 answers (batch 32) | **20.4 s** | 50 epochs ≈ 17 min CPU | ≈ 4.4 h CPU |
| frozen Whisper-tiny / Smart Turn embedding, batch 8 × 8 s (torch) | 0.94 s (8.5 clips/s); ORT native 1 thread 40 ms/clip min | 3,200 clips ≈ 6 min | 50k ≈ 1.6 h CPU |
| full Whisper-tiny encoder fine-tune, fwd + bwd, batch 8 × 8 s | **3.15 s min (2.5 clip-passes/s)** | 64k passes ≈ 7.1 h CPU | 1.5 M passes ≈ 167 h CPU → **GPU** |

**A FLOP check makes the GPU estimate credible.** The Whisper-tiny encoder costs about 6.4 GFLOP forward per 8 s clip
(2 × 8 M params × 400 tokens), and fwd + bwd about 20 GFLOP. The measured 2.5 passes/s implies about 50 GFLOP/s
effective on 4 vCPU, which is plausible. An A10G or L4 at a conservative 5-10 TFLOP/s effective for a small model gives
250-500 passes/s [E], so the K3 job takes 50-100 min per run. WavLM-base-plus costs about 16x per clip (CNN front-end
plus 95M parameters), so a 10-epoch teacher fine-tune on 50k clips is about 5-11 GPU-h [E].

### 3.2 Data: production never uploads audio, and embeddings are identity-bearing

- **Production (SS §5): raw audio is never stored.** Only numbers ride `TurnRequest.voiceFeatures`. The knowledge
  head runs on the device, and **only its outputs** (a handful of numbers under the §1 names) leave the phone.
- **The pooled encoder embedding is not uploaded in production.** Self-supervised and Whisper encoder states carry
  speaker identity [U, standard result; VSP-M3 measures it on our encoder]. A stored 384-d vector per answer is a
  voiceprint in all but name, and restriction 15 plus `voice-features-longitudinal` ("never voiceprints") forbid that.
- **Embeddings and audio for training come only from the P4 research cohort** (E1 and successors), under research
  consent that names them, in the Azure research container (SS §7.2: deleted at study end + 90 days). An embedding,
  a mel or audio sent to AWS is child voice data leaving that container, and the P4 notice must say so (§4.5).

### 3.3 Azure (cap USD 20): CPU yes, GPU no [M]

`scripts/voicesig/azure-gpu-quota.py`, 2026-10-04, read-only, service principal from `.env.local`. Raw:
`results/2026-10-04/azure-gpu-quota.json`.
- **GPU:** every NC/ND/NV/NG family limit is 0 in southindia, centralindia, westindia, eastus2, eastus, westus3,
  swedencentral, uaenorth, polandcentral and southeastasia (26-27 GPU families per region).
  - `lowPriorityCores` (spot) limit is 3 everywhere.
  - Container Apps `SubscriptionDedicatedNCA100Gpus` = 0. No serverless-GPU usage entry is listed.
  - Quota requests: 5 in eastus2 and 1 each in eastus and centralindia, all dated 2026-10-03, state `Failed`.

  This matches `aws-build-gpu` [T] one day later.
- **CPU:** standard D-family limits are 65-350 vCPU in southindia, so CPU training and embedding extraction run in
  India.
- **Prices (Azure Retail Prices API, southindia, 2026-10-04) [M]:**
  - Container Apps consumption: vCPU active $0.000024/s ($0.0864/vCPU-h), memory $0.000003/GiB-s.
  - D16as_v6 on-demand: $1.021/h. Its spot price is $0.189/h, but spot is capped at 3 vCPUs, so it is unusable.
  - The ACA T4 GPU meter exists ($0.00011/s = $0.396/h), with no quota.
- **Plan:** K1 feature and embedding extraction plus head fitting as one ACA job in southindia (4 vCPU / 8 GiB):
  under 1 h ≈ $0.43 [E from the measured meters]. K2 monthly refits are the same order. **Azure GPU: none until quota
  exists.**

Restriction 12 does not reach this job. It is our own open-weights model on generic Azure compute (not a Microsoft AI
Service, §4.1), and it is trained on knowledge outcomes (§4.2). It runs off Microsoft only if the owner prefers that
(next section).

### 3.4 AWS (cap USD 80): the GPU path, through the existing harness [M]

`scripts/voicesig/aws-check.py`, 2026-10-04, read-only, keys read from `.env.local` directly (the shell exports
placeholder AWS keys: `rj-node-env-loader-aws-placeholders` [T]). Raw: `results/2026-10-04/aws-check.json`.

| | ap-south-1 (Mumbai) | us-east-1 |
|---|---|---|
| G+VT vCPU quota, on-demand / spot | **0 / 0** | **8 / 8** |
| P vCPU quota | 0 / 0 | 0 / 0 |
| Standard vCPU quota, on-demand / spot | 16 / 32 | 16 / 32 |
| spot min over the last 6 h: g4dn.xlarge (T4) | $0.216 | $0.252 |
| g5.xlarge (A10G 24 GB) | $0.656 | **$0.412** |
| g6.xlarge (L4 24 GB) | $0.529 | $0.564 |
| g6e.xlarge (L40S 48 GB) | $2.052 | $1.839 |
| c7i.2xlarge (CPU) | $0.153 | $0.156 |
| on-demand g4dn / g5 / g6 (Pricing API) | $0.579 / $1.208 / $0.966 | $0.526 / $1.006 / $0.805 |
| instances not terminated; unattached volumes | none; 0 GB | none; 0 GB |
| budgets | `taxila-build-gpu` USD 100/month, actual $0.00 (October usage $1.10, fully credited) | |

**The harness exists.** `scripts/gpu/run.py` + `common.py` + `reaper.py` (decision `aws-build-gpu`, used for the face
jobs) already enforce every "terminate when done" rule the brief asks for:
- `shutdown -h +MAX` as the first user-data line, with shutdown behaviour = terminate;
- an EventBridge Scheduler backstop that terminates the instance at its deadline;
- terminate on every exit path, waiting for `terminated`;
- a reaper for tagged instances past their lifetime;
- a no-inbound security group, IMDSv2 only, a root volume that deletes on termination;
- `HARD_MAX_MINUTES` 480.

voicesig adds one job directory, `scripts/voicesig/jobs/k3-*` (`run.sh`, `job.json`), launched with
`python3 scripts/gpu/run.py scripts/voicesig/jobs/k3-… --types g5.xlarge,g6.xlarge --max-minutes 150`. **No new launcher
code.**

**K3 plan and budget [E]:**

| run | GPU-h | at spot $0.41-0.56/h | at on-demand worst case |
|---|---|---|---|
| Smart Turn backbone multi-task fine-tune: 6 configs × 3 seeds × 1.5 h | 27 | $11-15 | $22-27 |
| WavLM-base-plus teacher, 2 runs × 10 epochs | 10-22 | $4-12 | $10-22 |
| distillation into the backbone, 3 runs × 2 h | 6 | $2.5-3.4 | $5-6 |
| spot rework (+20%), boot and setup (about 10 min per run) | about 8 | $3-4.5 | $6-8 |
| EBS gp3 100 GB for run lifetimes; S3; transfer (in free, out small) | — | about $1 | about $1 |
| **total** | **about 51-63** | **about $22-36** | **about $42-64** |

**Spend guards for the $80 cap:**
1. A voicesig-specific AWS Budget (`taxila-voicesig`, $80) with alerts at 50/80/100%, plus a budget action that
   attaches a deny-`ec2:RunInstances` policy to the build IAM user at 100%. This is an owner action, because creating
   it writes to the account.
2. The tag `taxila-job=voicesig` on every run, so Cost Explorer can attribute spend.
3. A checkpoint to S3 every 10 min, so a spot reclaim costs at most 10 min. Spot is fine offline; `rj-spot-gpu-live-lane`
   rejects spot only for the live lane [T].
4. Never leave an instance idle: the harness terminates on exit, and `status.py` lists anything tagged.

**Region and residency.** Mumbai has no GPU quota today, so as things stand K3 would move P4 child audio from the
Azure research container (India) to us-east-1. Two acceptable paths:
- (a) **The owner files a Service Quotas request** for `L-3819A6DF` (All G and VT Spot Instance Requests) and
  `L-DB2E81BA` in ap-south-1, 0 → 8 vCPU. Mumbai spot g6.xlarge is $0.529/h, about the same price. This is
  recommended.
- (b) us-east-1 with a P4 consent text that names "processed in the United States on Amazon Web Services for model
  training, deleted after training".

DPDP permits transfer except to notified countries [S], but notice is required either way.

**AWS for K1 too, if the owner wants zero Microsoft compute for voice.** c7i.2xlarge spot in ap-south-1 ($0.153/h,
Standard spot quota 32 vCPU) runs the K1 job in under 1 h through the same harness with `--cpu` (under $1). The cost
is the cross-cloud copy of P4 data out of Azure Storage. On my reading (§4.1) this is not required.

### 3.5 Spend against caps

| cloud | cap | K1 | K2 (per month) | K3 | headroom |
|---|---|---|---|---|---|
| Azure | $20 | ≈ $0.4-2 (ACA CPU) | ≈ $0.5 | $0 (no quota) | ≥ $17 |
| AWS | $80 | $0 (or < $1 if run off Azure) | $0 | ≈ $22-36 spot, ≤ $64 on-demand | ≥ $16 at worst |

---

## 4. Policy

### 4.1 Does Microsoft restriction 12 cover our own models on Azure compute, or only Microsoft AI services?

**The text [V, Code of Conduct for Microsoft AI Services v4.0, 2026-05-01, fetched 2026-10-04]:**
- Scope: "This Microsoft Enterprise AI Services Code of Conduct ('Code of Conduct') defines the requirements that all
  customers of Microsoft AI Services (as defined in the Product Terms) must adhere to in good faith." … "This Code of
  Conduct applies in addition to the Microsoft Product Terms, including the Acceptable Use Policy."
- Usage restrictions: "Customers, users, and applications built with Microsoft AI Services must NOT use the services,
  including applications that make decisions, or take actions, autonomously or with varying levels of human
  intervention: … 4. To generate, present alongside, monetize, or interact with content, decisions, or actions
  prohibited in this Code of Conduct. … 12. To attempt to infer people's emotional states from their physical,
  physiological, or behavioral characteristics (e.g., facial expressions, facial movements, or speech patterns),
  including inferring emotions such as anger, disgust, happiness, sadness, surprise, fear, or other terms commonly used
  to describe a person's emotional state. … 15. … to identify or verify individual identities based on people's faces,
  voices, or other physical, physiological, or behavioral characteristics. … 17. For ongoing surveillance or real-time
  or near real-time identification or persistent tracking of the individual using any of their personal data,
  including biometric data, without the individual's valid consent."
- Product Terms glossary [V]: "**Microsoft AI Service**: an Online Service or feature thereof that uses artificial
  intelligence technologies, including any Microsoft Generative AI Service." "**Online Service**: a Microsoft-hosted
  service to which Customer subscribes under a Microsoft volume licensing agreement…" Product Terms: "Customer must
  use Microsoft AI Services in accordance with the Acceptable Use Policy and the Microsoft Enterprise AI Services Code
  of Conduct."
- Product Terms Acceptable Use Policy, which covers **every** Online Service, compute included [V]: "Neither Customer,
  nor those that access an Online Service through Customer, may use an Online Service: in a way prohibited by law,
  regulation, governmental order or decree; to violate the rights of others; …" It contains no emotion clause.

**Reading [U, to confirm in writing with Microsoft; extends `wb-coc-epistemic-vs-emotional`]:**

| where the inference runs | restriction 12 applies? | why |
|---|---|---|
| Azure OpenAI, Speech, Foundry Models, Content Understanding (any Microsoft AI Service) | **yes, directly** | "use the services to attempt to infer…" |
| our own open-weights model on Azure VMs, Container Apps or Batch | **not directly** | a VM or container is an Online Service, but not one that "uses artificial intelligence technologies"; the AI is our software. The AUP (law, rights of others) applies |
| our own model on the child's phone | not directly | not an Online Service at all |
| our own model on AWS or other non-Microsoft compute | not directly | not a Microsoft service |
| **any of the above when the output reaches a Microsoft AI Service** (in the Director prompt, as a reason that steers the Azure-served teacher reply, or as a TTS style) | **yes, through restriction 4**, if the inference is an emotional state | the Microsoft service would "interact with … decisions, or actions prohibited in this Code" |

**Consequences:**
1. **UD §1.5 was right in effect** ("a homemade DSP feature extractor does not escape the Code just because it is not
   an Azure API"), and this is the mechanism: restriction 4 plus the fact that Taxila is an "application built with
   Microsoft AI Services".
2. **Placement is therefore not a compliance cure for an emotion model** whose output steers the teacher
   (`rj-voicesig-placement-as-cure`, §8).
3. **For a knowledge-state model, placement is a free engineering choice.** Pick it on latency, privacy and cost.
4. **For the shadow emotion arm, placement off Microsoft is necessary but not sufficient.** Its output must also never
   reach a Microsoft service (§4.6). That matches the brief's own condition.
5. **Microsoft keeps discretion:** "Customers deemed by Microsoft to have violated the Code of Conduct or the
   Microsoft Product Terms may lose access to the Online Service, at Microsoft's sole discretion" [V]. Losing access
   would end the whole product, so the written question stays open even where the reading looks safe.

### 4.2 Is a knowledge or uncertainty state an "emotional state" under restriction 12?

**The words:** "emotional states … including inferring emotions such as anger, disgust, happiness, sadness, surprise,
fear, or other terms commonly used to describe a person's emotional state" [V].
- The named list is Ekman's six basic emotions.
- Read *ejusdem generis*, "other terms" means other affect terms of that kind.
- "Know", "don't know", "can't recall", "guessed" and "worked it out" are epistemic and memory states. No emotion
  taxonomy lists them, and each is verifiable against a task outcome.

**The interpretive guide Microsoft itself points to.** The Code was "designed to better align with emerging AI
regulations (e.g., EU AI Act)" [V]:
- AI Act recital 18: emotions are "emotions or intentions such as happiness, sadness, anger, surprise, disgust,
  embarrassment, excitement, shame, contempt, satisfaction and amusement". It "does not include physical states, such
  as pain or fatigue" and does not include "the mere detection of readily apparent expressions, gestures or movements
  … unless they are used for identifying or inferring emotions", for example "characteristics of a person's voice,
  such as a raised voice or whispering" [S, recital text via ai-act-law.eu and search summary].
- The Commission's February 2025 guidelines:
  - "attitude and emotion are equivalent for the purposes of this prohibition" (anti-circumvention) [S via FPF];
  - education examples: "assessing students' attention and motivation through the recognition of emotions" is
    prohibited [S via search summary of the guidelines];
  - they do not address knowledge, uncertainty or cognitive load (FPF: "The document does not address whether these
    specific mental states would be covered") [S].

**Where the grey is (words to keep out of voice outputs):**

| term | why it is grey | rule |
|---|---|---|
| "confused" / "confusion" | an "academic emotion" in D'Mello's work; Hume lists Confusion among its prosody "expression" dimensions | banned as a voice output (UD A11 [T]) |
| "uncertain", "unsure", "doubt" | the ITSPOKE literature sometimes groups uncertainty with affect, and Hume lists Doubt as an expression dimension; but Litman & Forbes-Riley define it as "the tutor's perception of the student's awareness of this accuracy", a metacognitive impasse [V] | never a voice output **name**; the knowledge it implies is expressed as `fragileCorrect` / `searching` / `effortfulGuess` |
| "confident" | used in everyday speech for a feeling ("feeling confident") | never a voice output name; use `fluentRecall` and `heldBelief` |
| "frustrated", "bored", "anxious", "stressed", "tired" (as a feeling), arousal, valence, mood | emotions or arousal by any reading | Tier X: banned from voice (R §1.3) |
| "fatigue" | the AI Act excludes it as a physical state; but "tired" is commonly used as a feeling | from session position and task evidence only (R §1.3), never from F0 |

**The label test (proposed build gate; the honest version of "name by action"):** a voice-derived output is a
knowledge-state output only if all four hold. Otherwise it is treated as Tier X.

1. **Target:** its training target is an outcome event from the task: correctness now; delayed or woven-transfer
   success; recognition-probe success after "yaad nahi"; the same wrong answer persisting after feedback; answer
   replication on an isomorphic item. **A human rating of how the child seemed to feel or sound is never a training
   target.** Coder labels from SS §7.2 may evaluate and diagnose the model only.
2. **Name:** its name comes from the closed vocabulary in §1 (knowledge or the teacher's move).
3. **Use:** it never enters a prompt as a description of the child. It enters as a structured evidence weight or a
   move licence (`server/signals` reason codes), exactly like the existing `signalsFrom()`. It never reaches the child
   or a parent (SS §5), and it is never stored as a state (only per-child calibration numbers, §5).
4. **Enforcement:** the `signals-lint` vocabulary test (`frustrat|bored|anxi|sad|happy|arous|valence|mood|stress|tired|confus`)
   extends to `src/voicesig/**`, `server/voicesig/**` and `scripts/voicesig/**`, plus `unsure|confiden|doubt` for
   voice-derived identifiers (VSP-M9).

**Why (1) carries the weight.** A model trained to predict "will this correct answer survive a delayed check" learns
whatever acoustic evidence predicts retrieval strength. Regulators would see a learning-analytics predictor validated
against learning, not a reading of the child's affect. A model trained on "sounded unsure" ratings learns human
perception of a state that ordinary language often treats as a feeling. Under the "attitude and emotion are equivalent"
reading, the renaming in (2) would not save it.

**The written question to Microsoft**, to send with the open item: list the exact outputs (§1 table), their training
targets (the outcome events above), where they run (device and our own compute), and how they are used (evidence
weights and move licences in a tutoring Director; never shown or stored as states). Ask whether restriction 12 or 4
reaches them.

### 4.3 AWS: Acceptable Use Policy and Responsible AI Policy scope

- **AWS Acceptable Use Policy** (last updated 2021-07-01) [V]: "This Acceptable Use Policy ('Policy') governs your use
  of the services offered by Amazon Web Services, Inc. and its affiliates ('Services')". It covers all services, EC2
  included. Prohibited: illegal or fraudulent activity, violating the rights of others, violence or terrorism, child
  sexual exploitation or abuse, security violations, and spam. **No AI, biometric or emotion clause.**
- **AWS Responsible AI Policy** (last updated 2025-01-13) [V]: "applies to your use of artificial intelligence and
  machine learning Services, features, and functionality (including third-party models)".
  - Prohibitions include using them to "violate the privacy rights of others, including unlawful tracking,
    monitoring, and identification", "depict a person's voice or likeness without their consent", and "harm or abuse
    of a minor".
  - For "consequential decisions" (fundamental rights, health or safety) it requires risk evaluation and "appropriate
    human oversight, testing, and other use case-specific safeguards".
  - It has **no emotion-inference prohibition**. AWS itself sells face emotion attributes in Rekognition [U, product
    knowledge].
- **Scope for us [U]:**
  - Training our own open-weights model on plain EC2 GPUs through `scripts/gpu` uses EC2, S3 and EventBridge, not an
    AWS AI/ML Service. The AUP applies and the RAI Policy arguably does not.
  - If we used SageMaker or Bedrock, the RAI Policy would apply, and its "unlawful tracking, monitoring" clause points
    straight back to Indian law (§4.4).
  - The guardrails it asks for (human oversight on consequential decisions, no unlawful monitoring, minors) are
    already Taxila's floor. Voice evidence never makes a consequential decision on its own: it buys a probe or a wait
    (R §1.3).
- **So AWS adds no restriction-12-type ban.** AWS does not loosen the law either.

### 4.4 Indian law binds every cloud: DPDP s.9 and the 2025 Rules

- **s.9(1):** verifiable consent of the parent before processing a child's personal data.
- **s.9(2):** no processing "likely to cause any detrimental effect on the well-being of a child".
- **s.9(3):** "A Data Fiduciary shall not undertake tracking or behavioural monitoring of children or targeted
  advertising directed at children" [S, statute text via the cited guides]. This is a **prohibition, not a consent
  item**.
- **Fourth Schedule (Rule 12)** [V via dpdpa.com]: an exemption from s.9(1) and 9(3) for an "educational institution",
  where "Processing is restricted to tracking and behavioural monitoring: for the educational activities of such
  institution; or in the interests of safety of children enrolled with such institution". "Educational institution"
  means "an institution of learning that imparts education, including vocational education".
- **Rule 3 (notice):** itemised personal data, a specified purpose per item, plain language, and withdrawal as easy as
  giving consent [S].
- **Rule 10 (verifiable parental consent):** identity and age of the parent, from reliable details held or a virtual
  token (e.g., DigiLocker) [S].
- **Commencement:** substantive s.9 obligations begin **13 May 2027** [S]; `compliance-deferred-to-launch` [T].

**For voice signals [U, counsel]:**
1. Whether an online tutor is an "institution of learning that imparts education" decides whether the exemption
   applies at all.
2. If it does not, a **persistent** per-child record of how fast and how fluently a child answers, kept to adapt
   teaching, could be read as "behavioural monitoring". Consent would not cure that.
3. The same question hangs over the persistent learner model (mastery and FSRS state). **Voice baselines are an
   increment on an existing exposure, not a new kind.**

The design must therefore work in **SS mode M0**: session-only baselines, nothing persisted, band priors at session
start. That mode already exists in SS §5 and in `features.js` (the M0 ratchet). Persistent baselines become an
opt-in improvement, not a dependency.

### 4.5 What a parent toggle needs: consent and notice

Three separate grants. Each is unbundled, off until the parent acts, and as easy to withdraw as to give. They sit on
`psych-consent-assent-two-tier` (P1 service, P4 research) [T]:

| grant | tier | covers | default | when withdrawn |
|---|---|---|---|---|
| **V1 "Listen for how answers are given, during the lesson"** | P1 | on-device analysis of the answer's timing and sound, to estimate how solid an answer is; numbers per answer; nothing kept after the lesson (M0) | asked at onboarding with its own checkbox (DPDP "clear affirmative action"); without it, the voice-knowledge head is off and text and task signals run alone | effective from the next turn |
| **V2 "Remember your child's usual answering pace"** | P1 | persistent per-child voice timing averages and calibration numbers (§5) | **off** until ticked | rows deleted within 24 h [E target]; band priors resume |
| **V3 "Help research: record lessons for the study"** | P4 + child assent | audio for E1-type studies, training on it (named clouds and countries), deletion at study end + 90 days | off; study enrolment only | stop recording; delete what is not yet anonymised per the protocol |

**Itemised notice content (Rule 3 shape; product copy, written by a person, not by a model):**
- what is collected (V1): "timing of answers (how long before your child starts, pauses, speaking speed) and the
  answer's sound pattern, analysed on your phone";
- what leaves the phone: "a few numbers per answer, never the recording";
- what it is for: "to tell whether an answer is solid or needs a 'why?' question, and to give your child enough
  thinking time";
- what it is **not**: "not used to detect emotions or mood, not used to identify your child by voice, never shown to
  you or your child as a score, never used for ads";
- where it is kept: "India (Microsoft Azure, South India)" for V2. If the owner picks Neon: "Singapore (Neon, on Amazon
  Web Services)";
- for V3, the processors and countries ("Amazon Web Services, United States or India, for model training");
- how long it is kept; how to withdraw (Controls → Voice; one tap); how to complain;
- a version string stored with the grant.

**Child assent (ICMR, as in `psych-consent-assent-two-tier`):** a neutral narrator, never the tutor's voice. In words
for the child: the teacher listens to *how* you answer so she knows when to give you more time or ask "why?". She does
not try to guess your feelings, and you can ask to turn it off.

**Restriction 17 ("persistent tracking … without the individual's valid consent") is met by V2 being opt-in** with
verifiable parental consent and child assent [U].

### 4.6 The shadow emotion arm: only if the owner insists, and only like this

The brief allows it as research, judged only on predictive value for learning outcomes over the knowledge model.
**My recommendation is to defer it until K1 has reported.** If K1's knowledge model already captures the acoustic
signal, the arm can only show redundancy. Conditions, all required:
1. **Inputs:** P4 audio only (V3), with the P4 notice and assent naming "research on whether vocal expression adds
   anything to predicting learning". This is not in SS §7.2 today, which forbids training an emotion model on E1
   audio (SL-2). That needs an amendment by the owner, the IEC and counsel.
2. **Off Microsoft end to end:** AWS EC2 through `scripts/gpu`, in Mumbai once quota exists. No Microsoft AI Service
   ever sees its inputs or outputs. Results are files in S3, deleted with the study.
3. **Model:** an off-the-shelf adult SER (e.g., audeering dimensional, emotion2vec+). Every one carries a
   non-commercial, share-alike or research-data lineage (§2.6), so internal research use is itself a counsel question.
   No model is trained on child emotion labels.
4. **Output reaches nothing:** not a prompt, not the Director, not the child, not a parent, not a stored profile, not
   `brain_trace`. It is analysed only offline, as an added covariate in the ESE outcome model (ΔAUC on delayed
   success over the knowledge model, child-clustered).
5. **Kill rule:** archived if ΔAUC < 0.02 or its 80% CI includes 0. The null result is logged as a rejection.

---

## 5. Per-child baselines: Neon vs the main database, and a schema sketch

**Recommendation:** keep per-child baselines in the **main database** (Azure Database for PostgreSQL Flexible,
`taxila-sin-pg`, South India, the existing `voice_baseline` table from `db/migrations/006_voice_features.sql`). Write
the new tables Neon-portable so the owner can switch without redesign.

| | Azure PG (South India) | Neon |
|---|---|---|
| restriction 12 | not engaged: a database storing numbers is not "use of the services to infer" anything [U] | not engaged |
| residency | India | **no India region**: 11 regions listed 2026-10-04, the nearest is `aws-ap-southeast-1` Singapore [M; matches `rj-neon-india-region` T] |
| deletion | cascades from `child` (`on delete cascade`), on the same account-deletion path B3 built | no FK to `child`; needs an outbox event plus a nightly anti-join reconciliation |
| latency | in-VNet | Chennai → Singapore per query unmeasured [T]; made irrelevant by the load/write pattern below |
| cost | inside the existing PG | existing Neon org (projects `taxila` Singapore, read-only rollback; `taxila-us` us-east-1) |
| when Neon wins | — | the owner wants all voice-signal data off Microsoft, or counsel reads restriction 17 / DPDP as favouring separation |

**Access pattern (works for either store):** load the child's rows once at lesson start. Update in memory, in the
lesson state, on reliable turns only (`features.js` rules). Write once at lesson end, or at the M0 ratchet, write
nothing. That is two round trips per lesson, off the turn path, so the Singapore distance stops mattering.

```sql
-- voicesig schema (Postgres 17; Neon or Azure PG). Numbers only: no audio, no transcript, no embedding,
-- no state names, no emotion words. Lint VSP-M9 checks this file.
create schema if not exists voicesig;

-- Pseudonymous subject: HMAC-SHA256(child_id, VOICESIG_SUBJECT_KEY) computed by the server. In Neon the main
-- child UUID never appears; in Azure PG the same key is used for uniformity.
-- Rows exist only while consent V2 holds.
create table voicesig.subject (
  subject       bytea primary key,                  -- 32-byte HMAC
  consent_ver   text  not null,                     -- notice version of the V2 grant
  granted_at    timestamptz not null,
  band          text  not null check (band in ('B1','B2','B3','B4')),
  updated_at    timestamptz not null default now()
);

-- Running per-child baseline (Welford; exponential window past n_max), one row per
-- context x language mode x feature. The feature list is a closed allowlist mirrored from the client.
create table voicesig.baseline (
  subject    bytea not null references voicesig.subject(subject) on delete cascade,
  context    text  not null check (context in ('answer','read_aloud')),
  lang_mode  text  not null check (lang_mode in ('hi','hinglish','en','unk')),
  feature    text  not null check (feature in (
               'onsetMs','contentOnsetMs','pauseFrac','longestPauseMs','articulationWps','voicedFrac',
               'flatVoicedRuns','f0IqrSt','f0EndSlopeStPerS')),
  n          int   not null check (n >= 0),
  n_total    int   not null check (n_total >= n),     -- optimistic-lock token, as in voice_baseline
  mean       double precision not null,
  m2         double precision not null check (m2 >= 0),
  updated_at timestamptz not null default now(),
  primary key (subject, context, lang_mode, feature)
);

-- Per-child calibration of the knowledge head (ESE's random intercept/slope): an offset on the head's logit
-- per output, never the output itself. Shrunk toward 0 by the server until n >= 30.
create table voicesig.calibration (
  subject    bytea not null references voicesig.subject(subject) on delete cascade,
  head       text  not null check (head in ('fragileCorrect','heldBelief','searching','absent',
                                                   'effortfulGuess','rapidGuess','fluentRecall','answerReliability')),
  model_ver  text  not null,                          -- calibration is void when the head changes
  n          int   not null check (n >= 0),
  a          double precision not null default 0,     -- intercept shift
  b          double precision not null default 1,     -- slope on the logit
  updated_at timestamptz not null default now(),
  primary key (subject, head, model_ver)
);

-- Population norms for item-difficulty adjustment (SS signal_norms). No subject column; k-anonymity >= 20.
create table voicesig.population_norm (
  feature      text not null,
  band         text not null,
  lang_mode    text not null,
  item_b_bin   smallint not null,                     -- IRT difficulty bin
  n_children   int  not null check (n_children >= 20),
  median       double precision not null,
  mad          double precision not null,
  fitted_at    timestamptz not null default now(),
  primary key (feature, band, lang_mode, item_b_bin)
);

-- Retention: a subject unseen for 180 days is deleted (rows are useless once stale; children change).
-- Deletion on account erasure: server emits erase(subject); Neon variant adds a nightly anti-join against
-- the main DB's live child ids (via the HMAC) as a reconciliation backstop.
create index on voicesig.subject (updated_at);
```

**What this deliberately cannot hold:** a per-turn history (per-turn `voice_feature` rows stay in the main DB with
their lesson cascade, SS §5), any derived state, any text, any embedding. Size: about 9 features × 2 contexts × 4 language
modes plus 4 calibration rows comes to about 76 rows per child, about 10 KB. At 100k children that is about 1 GB [E].

---

## 6. Integration plan (proposals only; no file outside my scope was edited)

| step | owner | change | flag |
|---|---|---|---|
| 1 | `src/voice/` owner (neutral tap owner) | add `logmel.ts` (incremental 80-bin ring) and `encoder.ts` (the **single** ORT-web session in a Worker, loading Smart Turn v3.2 with the two extra outputs from `expose.py`), publishing `encoderPass{lessonId, turnSeq, t, logits, pooled}` | `voice.encoder` |
| 2 | duplex workflow (`src/duplex/**`) | its `infer()` reads `pTurnEnd` from `encoderPass` instead of owning a session; re-plan the 100 ms candidate budget against VSP-M1 (§0.10) | DX's own |
| 3 | voicesig (`src/voicesig/**`, my scope) | `head.ts`: on the committed turn end, take the last `encoderPass` for that `turnSeq` (or request one), plus the prosody GRU input from `dsp.ts` frames and tracker scalars; output `KnowledgeVoice` (§1 names) with `modelVer`, `q` | `voicesig.head` = off / shadow / on |
| 4 | W2 lesson owners (`src/child/lesson/**`) | attach `KnowledgeVoice` to `TurnRequest.voiceFeatures.kv` (numbers only) | same |
| 5 | voice server owner (`server/voice/features.js`) | admit `kv.*` in an allowlist with ranges (as `FEATURE_RANGES`), server first and client second (the step-13 lesson in the signals build: unknown fields 400 and lose the utterance) | — |
| 6 | signals owner (`server/signals/**`), via an adapter | a `voiceK` evidence term: an LR on the knowledge emission, starting inside SS's clamp [0.9, 1.1]. The clamp widens only when ESE shows ΔAUC ≥ 0.03 on delayed items and ECE ≤ 0.05 (UD §4). **This is how voice becomes "major": by earned weight, not by placement.** A safety turn suppresses it (scanSafety first) | `TAXILA_SIGNALS_EVIDENCE` |
| 7 | voicesig (`server/voicesig/**`) | `baseline.js` (load at lesson start, write at end, M0 respected) and `calibrate.js` over the §5 schema; a migration proposal for `voicesig.*` | `voicesig.persist` (needs V2) |
| 8 | voicesig (`scripts/voicesig/**`) | `jobs/k1-*` (CPU) and `jobs/k3-*` (GPU) for `scripts/gpu/run.py`; a `taxila-voicesig` budget (owner action) | — |

---

## 7. Measurement backlog (pre-registered; VSP = voice-signals placement)

| id | question | method | pass / reverse |
|---|---|---|---|
| **VSP-M1** | real phone latency of the shared pass | device lab, 3 classes (Helio G85/G99, Dimensity 6100, Snapdragon 6 Gen 1 or 7s Gen 2), Chrome Android: WASM 1 thread, WASM 4 threads under COOP/COEP, WebGPU; 8 s and 3 s windows; prosody GRU; RSS | 8 s pass p95 ≤ 700 ms on the mid class → ship 8 s; else 3 s window; else prosody-only on that class. Also re-plan DX's candidate budget |
| VSP-M2 | does the frozen Smart Turn embedding add knowledge signal over handcrafted features? | E1, child-clustered CV, outcome = delayed failure after a correct answer (`fragileCorrect`) | adopt if ΔAUC ≥ 0.02 with the 80% CI excluding 0; else prosody + scalars only |
| VSP-M3 | how identifying is each candidate upload? | P4 audio; a cosine speaker verifier on pooled-384, PCA-16 and head outputs; EER | upload only representations with EER ≥ 0.35 [U bar]; production uploads head outputs only regardless |
| VSP-M4 | int8 fidelity on real child audio | head outputs int8 vs fp32 | Spearman ≥ 0.99, decision flips ≤ 1% |
| VSP-M5 | does a K3 multi-task fine-tune hurt end-of-turn? | DX's X1/E-C1 child-hold set before and after | no regression beyond 1 pp on false cuts; else ship heads only |
| VSP-M6 | baseline store round trips | from Chennai: Azure PG vs Neon Singapore, load + write per lesson (n ≥ 20) | informational; the pattern keeps both off the turn path |
| VSP-M7 | fairness | inherits SG-M6: fire rates and ΔAUC by home language and speech-difference flag | ≤ 0.02, else remove the feature for everyone |
| VSP-M8 | AWS cost actual vs estimate | Cost Explorer by `taxila-job=voicesig` | stop if any run exceeds 1.5x its estimate |
| VSP-M9 | label test and vocabulary | a test asserting every voicesig output's training target is an outcome column; lint as in §4.2 | 100%; failing builds |
| VSP-M10 | DPDP s.9(3) reading | counsel memo: educational-institution status; whether timing baselines count as behavioural monitoring | if not exempt and "monitoring": V2 stays off for everyone (M0 only) |

---

## 8. Proposed context entries (also written to `context/inbox/voicesig-placement.json`)

- **measurement `m-voicesig-encoder-latency-2026-10-04`**: the §2.2 table. WASM 1 thread min: Smart Turn 209 ms (8 s),
  Whisper-tiny 3 s window 67 ms, prosody GRU 1.9 ms, SSL base family 1,361-1,388 ms (3 s), DistilHuBERT 895 ms.
  Container load caveat.
- **measurement `m-voicesig-cloud-quota-2026-10-04`**: Azure GPU 0 in 10 regions, 7 requests Failed; AWS G/VT Mumbai
  0, us-east-1 8; spot and on-demand prices; no running instances; budget $100, actual $0.
- **measurement `m-voicesig-train-cost-2026-10-04`**: GRU epoch 20.4 s; Whisper-tiny fine-tune 2.5 clip-passes/s on 4
  vCPU.
- **decision `voicesig-shared-encoder-smart-turn` (proposed)**: one encoder pass (the Smart Turn v3.2 backbone with
  exposed outputs) feeds EOT and the knowledge head; frozen through K2.
  - Reverse if: VSP-M2 shows the embedding adds nothing (drop the encoder from voicesig; DX keeps it), or VSP-M1
    fails on the mid class (3 s window or prosody-only).
- **decision `voicesig-outcome-defined-labels` (proposed)**: the label test (§4.2) gates every voice output.
  - Reverse if: Microsoft answers in writing that restriction 12 or 4 covers outcome-trained knowledge evidence from
    speech timing and prosody. Then voice reduces to Tier T plus timing-free features.
- **decision `voicesig-training-cpu-first` (proposed)**: K1/K2 run on CPU in India (ACA job); GPU only for K3 on
  AWS spot through `scripts/gpu`, Mumbai once quota exists.
  - Reverse if: Azure GPU quota is granted (move K3 to Azure in India), or K1 shows the encoder is useless (no K3).
- **decision `voicesig-baselines-main-db` (proposed)**: baselines stay in Azure PG South India under V2 consent; the
  schema is Neon-portable.
  - Reverse if: the owner or counsel prefers separation from Microsoft (move to Neon, accepting Singapore residency
    and a second deletion path).
- **rejection `rj-voicesig-ssl-cnn-frontends-on-device`**: wav2vec2, HuBERT, WavLM and DistilHuBERT measured at
  1.36-1.39 s and 0.90 s per 3 s in WASM, 50-122 MB, +390-793 MB RSS; wav2vec2-base int8 cos 0.84.
  - Revisit if: a ≤ 20 MB SSL student without the raw-waveform CNN reaches ≤ 250 ms per 3 s in WASM.
- **rejection `rj-voicesig-licence-blocked`**: MMS (CC-BY-NC-4.0), IndicWav2Vec and indic-conformer (gated), WavLM
  shipped weights (CC BY-SA share-alike), openSMILE (non-commercial).
- **rejection `rj-voicesig-placement-as-cure`**: moving an emotion model off Azure does not take it outside the Code
  when its output steers an Azure-served teacher (restriction 4).
- **open `open-voicesig-dpdp-9-3`** (counsel, before 13 May 2027), **`open-voicesig-mumbai-g-quota`** (owner: Service
  Quotas request in ap-south-1), **`open-voicesig-smart-turn-phone-budget`** (duplex: 209 ms WASM vs a 100 ms candidate
  budget), and an extension of `wb-coc-epistemic-vs-emotional` (send the §4.2 written question with the output table).

---

## 9. Sources

**Primary, read this session [V]:**
- Microsoft, *Code of Conduct for Microsoft AI Services* v4.0, 2026-05-01: https://learn.microsoft.com/en-us/legal/ai-code-of-conduct
- Microsoft Product Terms, Glossary ("Microsoft AI Service", "Online Service"): https://www.microsoft.com/licensing/terms/product/Glossary/all ;
  Product Terms for Online Services (Acceptable Use Policy; "Customer must use Microsoft AI Services in accordance with … the … Code of Conduct"): https://www.microsoft.com/licensing/terms/product/ForOnlineServices/all
- AWS Acceptable Use Policy (2021-07-01): https://aws.amazon.com/aup/
- AWS Responsible AI Policy (2025-01-13): https://aws.amazon.com/ai/responsible-ai/policy/
- DPDP Rules 2025, Fourth Schedule: https://www.dpdpa.com/schedule/schedule4.html
- Smart Turn v3.x model card and README: https://huggingface.co/pipecat-ai/smart-turn-v3 ; https://github.com/pipecat-ai/smart-turn ;
  data licences: https://huggingface.co/datasets/pipecat-ai/smart-turn-data-v3.1-train , …-v3.2-train
- Hugging Face model API and cards for every model in §2.6 (licence, gating, file sizes): `results/2026-10-04/hf-meta.jsonl`
- UniSpeech (WavLM) licence, CC BY-SA 3.0: https://github.com/microsoft/UniSpeech/blob/main/LICENSE
- Litman & Forbes-Riley 2013, "Towards improving (meta)cognition by adapting to student uncertainty in tutorial
  dialogue", *International Handbook of Metacognition and Learning Technologies*, ch. 25: https://people.cs.pitt.edu/~litman/10.1007_978-1-4419-5546-3_25.pdf
- Neon regions and projects (Neon API via MCP, 2026-10-04); Azure Retail Prices API; AWS EC2, Service Quotas,
  Pricing, Budgets and Cost Explorer APIs; Azure Compute, Container Apps and Quota usages APIs (all 2026-10-04,
  read-only).

**Secondary [S]:**
- EU AI Act recital 18: https://ai-act-law.eu/recital/18/ ; https://artificialintelligenceact.eu/recital/18/
- FPF, "Red Lines under EU AI Act: emotion recognition in the workplace and education institutions": https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/
- Commission guidelines on prohibited practices, summaries: https://www.insideprivacy.com/artificial-intelligence/european-commission-guidelines-on-prohibited-ai-practices-under-the-eu-artificial-intelligence-act/ ;
  https://www.orrick.com/en/Insights/2025/04/EU-Commission-Publishes-Guidelines-on-the-Prohibited-AI-Practices-under-the-AI-Act
- DPDP s.9 and commencement, Rule 3 and Rule 10 summaries: https://veritect.ai/digital-data-ai-law/dpdp-childrens-data-compliance-playbook ;
  https://tsaaro.com/blogs/safeguarding-minors-online-understanding-parental-consent-obligations-and-behavioural-monitoring-restrictions-under-the-dpdpa-and-dpdp-rules ;
  https://www.consently.in/blog/dpdp-rule-3-itemized-consent-notice-guide ; DPDP Rules PDF: https://www.dpdpa.com/DPDP_Rules_2025_English_only.pdf
- Forbes-Riley & Litman 2011, *Speech Communication* 53(9-10):1115-36, doi:10.1016/j.specom.2011.02.006; wizarded
  UNC-ITSPOKE, *Computer Speech & Language*: https://www.sciencedirect.com/science/article/abs/pii/S0885230809000734
- MyST corpus: https://catalog.ldc.upenn.edu/LDC2021S05 ; https://arxiv.org/abs/2309.13347
- openSMILE licensing: https://github.com/audeering/opensmile ; https://audeering.github.io/opensmile/about.html
- Chrome WebGPU on Android (Chrome 121); WASM threads require cross-origin isolation (web platform documentation).

**Carried from sibling Taxila docs (their tags apply):** Smith & Clark 1993; Brennan & Williams 1995; Krahmer &
Swerts 2005; Pon-Barry & Shieber 2011; Hübscher & Prieto 2019; ESE (UD §4); the tiers (R §1.3); legal modes and E1
(SS §5, §7.2); the DX budgets and the Smart Turn vendor figures.
