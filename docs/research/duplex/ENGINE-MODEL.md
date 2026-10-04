# The engine model: stage A (rules + fast Azure LLM) and stage B (trained), measured on TaxilaFDB (2026-10-04)

**Companion documents.**
- [TAXILAFDB.md](TAXILAFDB.md) describes the benchmark and has the full results table.
- [ARCHITECTURE.md](ARCHITECTURE.md) v2 is the design these engines implement: the Continuous Conversational Engine,
  re-deciding on a 100 ms timer and on every stream event, behind one code governor.

Labels: [M] measured (n, method and date are in TAXILAFDB.md); [E] estimate.

## 1. Verdict

1. **Stage A ships as the engine, and stage B stays off.**
   - On the held-out test split, stage A cuts children off in **2.3-2.6% of thinking pauses**. The bars it beats:

     | arm | cut-offs |
     |---|---|
     | today's 0.9 s cascade | 31% |
     | tuned 640 ms silence | 74-83% |
     | Smart Turn v3.2 off the shelf | 37-64% |

   - Its decision gap is p50 **370 ms on the fast lane** and 1,140 ms on today's D4 transcriber.
   - It dominates the whole silence frontier: no silence threshold gets under 5% cut-offs without missing almost every
     reply.
2. **The fast LLM adds no measurable cut-off benefit.** With grok-4-1-fast-nr's semantic estimate, cut-offs go
   2.3% → 3.6% (FAST) and 2.6% → 4.6% (D4), inside overlapping intervals. Missed replies go 10.4% → 5.9% on D4. It stays
   behind `flags.semantic` (off). The stated reason is DX-4: its 640 ms p50 latency (sandbox → eastus2) means its read
   arrives after the code's.
3. **Stage B as trained does not pass the promotion gates.**
   - The fused model (Smart Turn encoder + engine features) generalises worse than chance to the held-out voices and
     families: tick AUC 0.36 on test, 0.07 on dev.
   - The dev-selected features-only variant ranks ticks better than stage A (AUC 0.75 vs 0.61 on test), but in closed
     loop it cuts off 13-55%.
   - What would reverse this is §4.4.
4. **Off-the-shelf Smart Turn cannot read these children.** On the same ticks its own probability has AUC 0.47 on test.
   Its embedding carries no transferable end-of-turn signal for TTS child Hinglish, which matches Study B's 13.5% cut-offs
   on real speech. The fused stage B's collapse follows from this.

## 2. Stage A as built (src/duplex/engineRules.ts + governor.ts, behind host.ts)

**Estimator.** The §2.5.8 combiner over code features:
- the answer-FORM grammar (form.ts: "62" after "27+35?" is complete with zero silence);
- Hinglish markers (understand.js / markers.ts);
- the lexical horizon (words count only once they cover the audio);
- prosody, for timing only;
- the child's pause profile;
- silence, as one saturating term;
- the semantic LLM estimate, in open contexts only, when flagged.

**Policy.** One proposal per tick (SPEAK / HOLD / BACKCHANNEL / REACT / YIELD / KEEP_TALKING / CUT_IN). Preparation by
pComplete hysteresis drives drafts and the warm uptake.

**Governor (code, not a model).** G1 safety (sticky); G2 the pre-speech barrier; G3 hold requests; G4 phase legality;
G5 the horizon; G6 the closed cut-in list; G7 fast mouth, late verdict; G8 rate limits; G9 wait time I; G10 backstops;
G11 her floor.

**The semantic estimator** (new: `server/duplex/semantic.js`):
- **Output:** typed numbers only: `{pComplete, pHoldWanted, asksHer, offTask}`.
- **Payload:** exchange, beat, question type, her last act and the stable prefix. No child id, no name, never the key.
- **Deployments:** primary grok-4-1-fast-non-reasoning; fallback taxila-fast.
- **When the host asks** (maybeAskSemantic): open contexts, ≥ 2 new words and ≥ 600 ms since the last ask.
- **Measured** [M], 3,092 unique prefixes:

  | deployment | latency p50 / p90 | notes |
  |---|---|---|
  | grok-4-1-fast-nr | 636 / 927 ms | 0 errors on the last pass |
  | taxila-fast | 1,036 / 1,537 ms | 555/1,681 errors on the last pass (rate limits) |

**Tuning history.** Every change was made on TaxilaFDB train / dev or the L2 world check. TAXILAFDB.md §6 lists them, and
they are in the code with their evidence in comments.

| train split, FAST lane | thinking-pause cut-offs | hold violations | missed |
|---|---|---|---|
| first run | 10.8% | 10 | 12.5% |
| final | 2.0% | 0 | 1.8% |

Test was scored once, after the last change.

**Failing bars, stated plainly:**

| bar | measured | target | cause |
|---|---|---|---|
| A4 yield on a barge-in | p50 770-1,151 ms | ≤ 200 ms | G11's 1 s sustained-voice rule decides most yields |
| A5 keep talking through continuers | 67-72% | ≥ 90% | TTS continuers last 380-530 ms; real ones may differ |
| A6 rejecting TV / sibling during her line | 50-67% false yields | ≤ 10% | no speaker model (X3) |
| A1 audible gap | p50 2.0 s | ≤ 350 ms | the warm uptake primes only a third of replies |
| A8 verdict on a repaired value | 4/40 on FAST, one template | 0 | a 1.4 s repair pause outlasts the 1.2 s verdict delay |
| A11 missed replies | 8.5-10.4% | ≤ 2% | late explanation ends from the backstop |

## 3. Stage B: the design, and why it departs from ARCHITECTURE.md §5.2

| part | §5.2 sketch | built | why |
|---|---|---|---|
| audio | Smart Turn v3.2 backbone, **fine-tuned** | backbone **frozen**: its attention-pooled 384-d embedding (graph output `sum_1`, exposed without changing the logits) plus its own logit | The training audio is 4 TTS voices with scripted prosody. A fine-tuned encoder would learn those voices, and the frozen test split holds out exactly that. The frozen ablation already shows the audio carries ~no transferable signal here (§4), so fine-tuning on the same voices could only overfit. GPU training (AWS, allowed for training) was therefore not spent |
| text | a small multilingual encoder (MuRIL, IndicBERT, MiniLM, Qwen-0.5B) | the engine's own feature vector (features.ts `cce-features/1`, 82 numbers: form state, Hinglish markers, horizon, prosody, pace, context) | The code already reads the words. No licence-checked Hinglish child text corpus exists to tune an encoder, and 20 MB rules out the candidates |
| fusion / heads | a 2-layer transformer over [audio CLS, text CLS, context]; 5 heads | late-fusion MLP (F→64, 384→32, + logit + audio-missing flag → 64 → pComplete, pHoldWanted); audio dropout 0.2 | three "tokens" do not need attention; ~30k parameters |
| sampling | silence-matched | silence-matched: per silence bin, end and not-end ticks carry equal weight | §5.3 step 5 |
| calibration | per-context temperature + isotonic | per-exchange Platt scaling on out-of-fold train predictions (GroupKFold by template family), folded into the graph | |
| data | labels by construction | 54,146 silent child-floor ticks (train, 916 streams × 2 lanes), from stage A's own trajectory; labels from the render gold | |
| splits | held out by voice and template | as frozen in split.mjs; the variant was picked on dev; test untouched by every choice | |

## 4. Stage B measurements [M]

### 4.1 Tick level

Silent child-floor ticks, AUC of pComplete against "the child has finished". Values are dev / test.

| model | AUC end | AUC hold | ECE end |
|---|---|---|---|
| fused (audio + features) | 0.07 / 0.36 | 0.64 / 0.65 | 0.89 / 0.56 |
| **features only** (exported) | **0.90 / 0.75** | 0.82 / 0.60 | 0.11 / 0.29 |
| audio only (frozen Smart Turn + head) | 0.47 / 0.51 | 0.75 / 0.76 | 0.31 / 0.33 |
| Smart Turn v3.2 probability alone | 0.56 / 0.47 | — | 0.51 / 0.52 |
| stage A pComplete | 0.67 / 0.61 | 0.70 / 0.69 | 0.22 / 0.21 |

Notes on the table:
- Features-only test ECE by context: closed answers 0.42, open explanations 0.10, chit-chat 0.20. The A14 bar (≤ 0.05)
  fails everywhere.
- Train out-of-fold AUC end: fused 0.78, features 0.80, audio 0.61. The fused model collapses only on held-out voices and
  families.

### 4.2 Closed loop (TaxilaFDB test)

| | thinking-pause cut-offs | gap p50 | missed | verdict on repaired | hold violations |
|---|---|---|---|---|---|
| stage B (features only), D4 | 13.4% | 1,140 ms | 3.4% | 1/40 | 0 |
| stage B (features only), FAST | 55.2% | 360 ms | 3.6% | 7/40 | 3 |
| stage A, FAST | 2.3% | 370 ms | 8.5% | 4/40 | 2 |

**Why it fails in closed loop despite a better tick AUC.** Its calibrated pComplete is high inside pauses that look complete
(verb-final clauses in explanations). The SPEAK threshold is crossed early, and stage A's hand-set caps (the explanation
cap, the closed-question no-value penalty) do not apply to it.

An earlier run let the features-only model "vouch" for unseen audio at G5. That gave 32 verdicts on repaired values and
86% cut-offs. Now only a model that reads audio may vouch (`adapter.ts`, with a test).

### 4.3 Size and latency

Measured on the sandbox x86 CPU while it was shared (load average 6.8-12). These numbers are upper bounds.

| path | size | p50 / p95 |
|---|---|---|
| fusion head (exported, features-only) | 53.7 KB ONNX | CPU 0.29 / 1.18 ms (1 thread); wasm SIMD 0.21 / 0.51 ms |
| + Smart Turn v3.2 encoder (int8) | 8.68 MB | CPU 123 / 232 ms (1 thread, contended); 18 ms per item batched at 4 threads and 39 ms single, measured earlier in the session at lower load; wasm SIMD 278 / 502 ms |
| + numpy log-mel (8 s window) | — | 36 / 228 ms (contended) |

- **The head** meets ≤ 20 MB and ≤ 30 ms everywhere.
- **The audio path** does not meet ≤ 30 ms on a contended CPU. Even idle it is borderline, and on wasm it is 9× over. A
  phone is expected to be 2-4× slower than this x86 [E].

The audio branch is off in the exported model anyway (§4.1).

### 4.4 What would promote stage B (reversal conditions)

All of these must hold:
- trained on **real child audio** (E1, consented, legal mode M1+);
- tick AUC on held-out children above stage A's by more than its CI;
- closed-loop cut-offs at or below stage A's at an equal or lower gap;
- ECE ≤ 0.05 per context;
- the head + encoder ≤ 30 ms on an ACA 2-vCPU replica.

The engine's shadow logs (`ShadowRow.features`, seam S15) are the data path to the first condition. The same logs feed a
native model later (ARCHITECTURE.md §5.6).

## 5. Integration (no Wave 2 file touched)

Unchanged from ARCHITECTURE.md v2 §11. The additions:
- **S6 engine context:** `ctx.cutIn` and `ctx.wt1` must be sent by the Director.
- **Safety:** the duplex partial-safety now scans echo-stripped and punctuation-free readings with the shipped predicate.
  The main loop should fix `server/director/safety.js`'s miss on "…मैं ना रहूं।" (danda after the last word) at the
  source, so the cascade lane is covered too.
- **Echo:** `fanin.js` straddling items and `echo.js` utterance windows are device-side and need no seam.
- **Flags:** stage B stays behind `flags.trained` (off). `models/duplex/cce-stageb-2026-10-04.1.{onnx,json}` is a
  reference artefact, not a candidate.

## 6. Files

| area | files |
|---|---|
| benchmark | `evals/duplex/taxilafdb/{generate,topics,render,mix,split,world,arms,metrics,run,semantic,dump-ticks,stageb,live}.mjs` |
| scripts | `scripts/duplex/{stmel.py, st_features.py, aca-features.mjs, train_stageb.py, latency_stageb.py, latency_wasm.mjs}` |
| runtime | `server/duplex/semantic.js` (new); `src/duplex/{audio,adapter,config,engineRules,governor,host}.ts` and `server/duplex/{echo,fanin,partialSafety,understand}.js` (fixes) |
| model | `models/duplex/cce-stageb-2026-10-04.1.{onnx,json}` |
| results | `evals/duplex/results/taxilafdb-{test-final3,live,stageb-train,stageb-latency,semantic-*,diag-train*}-2026-10-04.json` |
| tests | `tests/duplex-engine-model.test.mjs` (13 tests); `tests/duplex-runtime.test.mjs` (updated vouching assertion) |
