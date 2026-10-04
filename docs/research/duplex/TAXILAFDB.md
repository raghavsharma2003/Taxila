# TaxilaFDB v1: the duplex benchmark for a child tutor, and the first measurement of every arm (2026-10-04)

**What this is.** Our own full-duplex benchmark, the one ARCHITECTURE.md v2 §6 specified. It has 560 scripted child
exchanges for classes 4-7, each rendered with Azure TTS child-like voices and mixed with her echo, background speech and
noise. Every label comes from the script, so there is no annotation step. It runs at L1 (simulated streaming STT, $0 per
run) and was checked at L2 (the real live transcriber on 48 test streams). This file covers the benchmark and the
results. The engine models (stage A, stage B) are in [ENGINE-MODEL.md](ENGINE-MODEL.md).

**Labels used below:** [M] measured here, with n, method and date. [E] estimate. [T] taken from elsewhere in the repo.

---

## 1. The answer on one page

Table 1 is the TaxilaFDB **test** split, measured 2026-10-04 at L1 with runtime hash `1d138d3168bf`.
- **Scale:** 960 streams. That is 240 scenarios × 2 held-out voices × clean/noisy.
- **Held out:** 31 template families and both test voices were never seen in tuning or training.
- **Brackets:** 95% bootstrap intervals over scenarios, 1,000 resamples.
- **Gap definition:** the gap is DECISION time minus the child's last voiced frame, so the STT final is inside it.

**Table 1. All arms on the test split**

| arm | lane | cut-offs, thinking pauses (M2) | turns cut off | gap p50 / p90 (M3) | missed reply ≤2 s (M4) | hold violations (M12) | verdict on a repaired value (M11) | non-safety speech after distress (M13) |
|---|---|---|---|---|---|---|---|---|
| **B0 cascade-900** (today) | D4 | 31.3% [22.0-41.1] | 42.5% | 1,690 / 1,950 ms | 37.3% | 47/48 | 3/40 | 5/84 |
| **B1 silence-640** | D4 | 74.2% [68.7-80.0] | — | 650 / 950 | 2.5% | 48/48 | 12/40 | 30/84 |
| B1 silence-640 | FAST | 82.8% [77.4-88.6] | 88.6% | 640 / 700 | 2.1% | 48/48 | 0/40 | 2/84 |
| **B2 Smart Turn v3.2, thr 0.5** | FAST | 64.2% [58.6-70.2] | 74.5% | 210 / 270 * | 39.2% | 40/48 | 4/40 | 17/84 |
| B2 Smart Turn v3.2, thr 0.95 | FAST | 36.9% [29.6-45.0] | 53.6% | 210 / 270 * | 71.0% | 39/48 | 1/40 | 7/84 |
| **E-A stage A** (rules + governor) | D4 | **2.6% [1.0-4.4]** | 3.9% | 1,140 / 1,608 | 10.4% | **0/48** | **0/40** | 1/84 |
| **E-A stage A** | FAST | **2.3% [0.6-4.6]** | 4.1% | **370 / 1,488** | 8.5% | 2/48 | 4/40 | 2/84 |
| E-A + LLM (grok-4-1-fast-nr) | FAST | 3.6% [1.4-6.2] | 6.3% | 370 / 1,496 | 8.1% | 2/48 | 4/40 | 2/84 |
| E-B stage B (trained, features-only) | FAST | 55.2% [43.0-65.6] | 54.6% | 360 / 1,540 | 3.6% | 3/48 | 7/40 | 1/84 |

\* Smart Turn's gap counts only the turns it answered within 2 s. Its "missed" column counts the turns it judged
incomplete, which then waited for the 3 s timeout.

- **Thinking pauses:** n = 732, from fillers, hesitations, hold requests, word searches and mid-explanation pauses.
- **Respond ends:** n = 528.
- **Bars:** the owner's bar is "≤ silence-640 on the same set, also ≤ 3% absolute, and ≤ Smart Turn". Stage A meets all
  three on both lanes. The 3% bar holds at the point estimate; the upper CI is 4.4-4.6%.

**The silence frontier the engine must dominate (test, FAST lane; the D4 lane is within ±5 pts)**

| silence threshold | 300 | 450 | 640 | 900 | 1,200 | 1,600 | 2,200 | 3,000 | **stage A** |
|---|---|---|---|---|---|---|---|---|---|
| thinking-pause cut-offs | 98.9% | 94.0% | 82.8% | 56.1% | 39.2% | 26.9% | 17.3% | 5.1% | **2.3%** |
| gap p50 (ms) | 300 | 460 | 640 | 900 | 1,200 | 1,600 | 1,980 | — | **370** |
| missed ≤2 s | 3.6% | 2.8% | 2.1% | 0.8% | 0.6% | 0.9% | 97.5% | 100% | 8.5% |

- **Dominance:** no silence threshold gets under 5% cut-offs without missing every reply. Stage A is at 2.3% cut-offs and
  a 370 ms p50. That is fewer cut-offs than every threshold, and a shorter gap than every threshold from 450 ms up.
- **Its cost:** an 8.5% missed-reply rate, against 0.6-2.8% for the 450-1,600 ms thresholds.

**The other liveliness metrics, stage A on the test split**

| metric | FAST lane | D4 lane | bar (ARCHITECTURE.md §7) | met? |
|---|---|---|---|---|
| M7 yield on a real barge-in (child onset → her stop), p50 / p90 | 770 / 1,030 ms (n=107) | 1,151 / 2,030 ms (n=85) | p50 ≤ 200 ms | **no** (G11's 1 s sustained-voice rule decides most yields) |
| M7 yield within 1 s | 87% | 25% | ≥ 98% | no |
| M8 keeps talking through a continuer ("haan", "acchha"), strict | 66.7% (n=36) | 72.2% | ≥ 90% | **no** |
| M9 false yields to TV / sibling / side talk during her line | 50% | 66.7% | ≤ 10% | **no** (no speaker model) |
| M9 false turn-taking on background speech before the answer | 6.3% | 0% | ≤ 5% | borderline |
| M10 cut-in recall: word search 97.5%, hold offer 90%, question to her 100% | 97% overall | 82% | ≥ 0.8 | yes |
| M10 cut-in precision / out-of-policy | 100% / 0 | 100% / 0 | ≥ 0.9 / 0 | yes |
| M13 distress detected / safeguard over a talking child / false safety on benign | 100% / 0% / 0% | 100% / 0% / 0% | — / 0 / — | yes |
| M14 echo self-trigger (her own voice at −10/−20/−30 dB) | 0% (n=40) | 0% | ≤ 2% | yes |
| M6 nods per second of child speech in turns ≥ 4 s; mid-word nods; nods in closed answers | 0.197; 2.9%; 0 | 0.203; 2.4%; 0 | 0.5-2× 0.079/s; < 10%; 0 | rate **2.5× human** (over the 2× cap), placement yes |
| M11 repair collisions: an uptake started and the child then repaired | 57.5% | 20% | reported | — |
| audible gap (first audio = decision + composed first-sound path) p50 | 2,048 ms | 2,686 ms | A1 ≤ 350 ms | **no** (the warm uptake primed only 164 of 483 replies) |

**L2 check of the simulator (real gpt-live-transcribe partials, 48 test streams, real time, 2026-10-04, third pass)**

| | live (real STT) | L1 simulator (same streams) |
|---|---|---|
| first partial after onset p50 / p90 | 1,154 / 1,517 ms | 1,743 / 2,048 ms (M-D2 calibration) |
| partial lag p50 / p90 | 396 / 1,218 ms | 713 / 1,477 ms |
| thinking-pause cut-offs | 1/38 | 0/38 |
| gap p50 | 840 ms | 1,165 ms |
| missed replies | 3/36 | 2/36 |
| per-stream agreement | turn cut off 28/29, missed 35/36; gap live − sim p50 −100 ms (p10 −592, p90 +476) | |
| distress detected / unsafe speech | 4/4 / 0 | 4/4 / 0 |

- **What agrees:** the simulator predicts the engine's outcome on 63 of 65 per-stream decisions.
- **Where it is pessimistic:** the real transcriber was faster than the M-D2 calibration on this run. The real gap was
  about 100-300 ms shorter.

### What changed because of this run

The benchmark found ten runtime defects. Each was fixed on train / dev evidence, or on the L2 world check, before the
frozen test run. §6 lists them.

---

## 2. The benchmark

### 2.1 Scenarios (generate.mjs, deterministic, seed 20261004)

**Composition:**
- 560 scenarios in 64 template families (`tfam`) and 12 families (F1-F12).
- Classes: 4 (191), 5 (166), 6 (132), 7 (71).
- Language: Hinglish 505, English 45, Hindi 10. Both scripts appear.
- Topics: NCERT classes 4-7 maths and science items (topics.mjs).

| family | what | train / dev / test scenarios |
|---|---|---|
| F1 closed answers | fluent integer, fraction, decimal+unit, choice, yes/no, word; value + tail word; multi-slot; hesitant (filler / preface); self-repair (bare, inline "नहीं नहीं", marker "सॉरी") | 76 / 13 / 51 |
| F2 open explanations | 1-3 internal pauses of 600-3,000 ms, with and without a final yield cue | 45 / 8 / 27 |
| F3 questions to her | turn-initial; mid-explanation | 24 / 0 / 16 |
| F4 chit-chat | short adult-like timing, Hinglish and English | 21 / 0 / 9 |
| F5 holds and word searches | "ruko / ek minute / soch raha hoon / one second" (incl. a 15 s+ hold); "woh… kya kehte hain" | 28 / 0 / 22 |
| F6 IDK and trouble | "pata nahi", "samajh nahi aaya", "phir se" | 15 / 0 / 9 |
| F7 barge-ins while she speaks | repair "kya?", stop "ruko / ek minute didi", answer to her yes/no, a new turn, a called-out answer (fold-in) | 30 / 0 / 20 |
| F8 continuers while she speaks | haan haan, hmm, acchha, theek hai: at her clause boundaries and mid-clause | 18 / 0 / 18 |
| F9 rejection | TV, sibling, side talk, pressure-cooker whistle: during her line and before the child answers | 24 / 0 / 16 |
| F10 safety | disclosures after a value, after a pause, during her line, plus benign look-alikes (lines from the existing S/S2 sets only) | 0 / 0 / 24 (test-only: safety is code, never learned) |
| F11 off-task drift | 6-9 drift sentences | 8 / 0 / 8 |
| F12 echo | her own voice at −10 / −20 / −30 dB, no child | 10 / 0 / 20 |

**Gold labels by construction:**
- every inter-segment pause has a class:
  - thinking classes (a takeover is a cut-off): filler, hesitation, hold_request, hold_long, word_search, repair_open,
    mid_explanation, drift_pause;
  - complete-looking-then-more classes: repair, mid_answer_slot, pre_disclosure, question_pause;
- an end class: `respond` (a prompt reply is the human reference) or `either` (an explanation without a yield cue, where a
  0.5-2.5 s wait is acceptable);
- the expected overlap behaviour: yield or keep talking;
- the allowed cut-in and its window;
- the distress segment.

### 2.2 Rendering (render.mjs) and mixing (mix.mjs)

**Rendering:**
- Each child utterance is ONE Azure Speech SSML synthesis with in-utterance `<break>`s, so the prosody before a pause stays
  continuation-like.
- Child-likeness: SSML pitch +14-38% and rate −6-8% on hi-IN Neural voices, plus a duration-preserving post-shift for the
  male voices. No Hindi child voice exists in the catalogue (read 2026-10-04).
- Her line: en-IN-Diya DragonHD.
- 1,120 renders; 237,492 SSML characters; ≤ $4.54 [M]. Every render passed the measured-gap check (0 dropped).
- Gold times are MEASURED from the rendered audio by energy segmentation, never assumed.

**Mixing:**
- one 16 kHz mic stream per scenario × voice × condition;
- her echo residue at −30 dB (clean) or −25 dB (noisy), or the F12 level;
- overlays: TV, sibling, side talk, cooker;
- a code-generated noise bed (pink, brown or white) at SNR 15-20 dB in the noisy condition;
- 20 ms frames: RMS plus the shipped YIN from src/voice/dsp.ts, the device's own code.

**Voices:**
- train: Ananya, Aarav, Swara, Kunal (2 per scenario);
- test: Kavya, Rehaan.

**Output:** 2,240 streams (960 test, 1,196 train, 84 dev), 7.0 h, outside the repo.

### 2.3 Splits (split.mjs, frozen before any engine ran)

- **Test** = 31 held-out template families, rendered ONLY in the 2 held-out voices.
- **Dev** = 4 template families.
- **F10** is test-only.
- **What touched which split:** every engine change in §6 was made on train / dev diagnostics, plus the L2 world check.
  Test was scored after the last change. Stage B's variant choice used dev; its calibration used out-of-fold train.

### 2.4 The L1 world (world.mjs)

The world plays one stream into the real device runtime (src/duplex/host.ts → engine → governor) in virtual time:
- **The mic frames** as measured.
- **A reactive STT** (evals/duplex/streams.mjs SttSim):
  - D4 = taxila-live-transcribe, calibrated on M-D2 (n=28 runs);
  - FAST = a word-timed India lane modelled on Nemotron [E];
  - it transcribes the child's words, near-field overlays (sibling, side talk, TV at ≥ −12 dB) and her echo at ≥ −30 dB;
  - where the child is speaking, quieter speech under her is masked (dominant-speaker rule).
- **Her playback clock:** her scripted line from the gold word times; replies start at a composed first-audio time
  (Speculator warm uptake, draft or cold, bootstrapped from 48 measured cascade turns).
- **Open loop:** the child audio is fixed, so a cut-off does not stop the child. The child's next words then overlap her
  reply, which is what a real cut-off costs.

### 2.5 Arms (arms.mjs)

Every arm runs through the same host and governor. Baselines run the governor in "baseline" mode: G1/G2 safety, G4 phase
legality and the G11 her-floor yield only.

| arm | what it is |
|---|---|
| B0 | cascade-900: the STT final after 900 ms of server VAD is the turn |
| B1 | silence-N: device silence ≥ N ms once words exist; N = 640 is the bar, and a sweep of 8 thresholds traces the frontier |
| B2 | Smart Turn v3.2 off the shelf (pipecat-ai/smart-turn-v3, BSD-2), the Pipecat pattern. At 200 ms of silence, the last ≤ 8 s of the child floor is run once; p ≥ thr → SPEAK, else wait for more speech or the 3 s timeout. Features are computed on Azure Container Apps (§4) |
| E-A | stage A, plus E-A+LLM with the semantic estimate replayed at its measured latency |
| E-B | stage B |

### 2.6 Metrics (metrics.mjs)

- **Coverage:** M1-M16 as in ARCHITECTURE.md v2 §6.2.
- **Cut-offs (M1, M2):** scored at DECISION time inside the gold pause.
- **Reasons that are not cut-offs:**
  - a SPEAK in a question pause answers the child's question;
  - a hold offer is allowed at ≥ 15 s (gold clock, 500 ms tolerance for the device's silence clock);
  - a CUT_IN with the pause class's own reason.
- **F11 drift cut-ins** are scored as infeasible: the rendered drifts last 11-15 s, against limits of 20 / 30 s. A drift
  cut-in fired anyway is out of policy.
- **CIs:** a cluster bootstrap over scenarios.

---

## 3. Per-family detail (stage A, FAST, test)

- **Remaining cut-offs:** 17 of 732 thinking pauses. They are mid-explanation pauses longer than the 2.5-3.5 s wait-time-II
  backstop, and drift pauses.
- **Missed replies:** 45/528. Mostly open explanations answered after the 2 s window by the backstop, plus noisy-condition
  closed answers whose words the STT dropped.
- **Hold violations:** 2/48, both F5.hold_long, where "सोच रहा हूँ" was not visible on one lane before the backstop fired.
- **Verdicts on repaired values:** 4/40, all one template, F1.rep_marker ("पंद्रह सेंटीमीटर [1.4 s] सॉरी बारह…"). The 1.4 s
  repair pause outlasts the 1.2 s verdict delay (G7).
  - Recommendation: VERDICT_DELAY 1.6 s, validated on train first.
  - The D4 lane had 0, because its slower words made the first reply later.
- **Unsafe speech:** 2/84.
  - f10-after_pause-0501, a pre-disclosure IDK: her verdict-free help reply to "पता नहीं" was already playing when the
    disclosure began.
  - f10-during_her-0493 on one lane.
  - Safeguard over a talking child: 0. Detection: 84/84.

## 4. Compute and spend (2026-10-04)

| item | where | cost [M unless marked] |
|---|---|---|
| child + her renders (earlier in this workstream) | Azure Speech centralindia | ≤ $4.54 |
| Smart Turn features for 2,240 streams (126k encoder passes) | Azure Container Apps, eastus2, 16 executions × 4 vCPU, 8 min | ≈ $1.0 [E: Consumption list price] |
| semantic LLM cache (3,092 unique prefixes × 2 deployments) | grok-4-1-fast-nr, taxila-fast (Azure Direct) | $5.58 + $0.27 |
| L2 live STT (3 passes × 48 streams × ~12 s) | taxila-live-transcribe | < $0.10 [E] |
| stage B training | sandbox CPU (no GPU needed for a 54k-tick fusion head) | $0 |
| **total Azure** | | **≈ $11.5, under the $40 cap**; AWS $0 (not used) |

## 5. Limits (read before quoting)

- **No real children.** Synthetic TTS voices with scripted prosody; fillers are rendered as short words. Prosody learned or
  measured here says nothing about children; E1 / DX-12 decide that.
- **One author's scripts:** 560 scenarios. Family sizes are designed, not sampled from lessons.
- **The FAST lane is a model [E].** Only D4 is calibrated, and L2 shows D4 itself running faster today than its M-D2
  calibration.
- **The world is open loop on the child**, and has no Opus codec or phone IR. Echo is a mixed residue, not a real AEC.
- **Cut-in recall for off-task drift is untested:** the renders are too short.
- **Audible gaps are compositions** of measured stage distributions, not end-to-end playback.

## 6. Runtime defects TaxilaFDB found (fixed before the test run)

| # | defect | evidence (split) | fix |
|---|---|---|---|
| 1 | The device ear latched "speaking" in a noisy room: the shipped EnergyVad learns its floor only while silent, so 0 offsets in 8.4 s | noisy train streams: 0 replies | `audio.ts`: minimum-statistics noise floor (5th percentile over 5 s) |
| 2 | Aperiodic noise bursts reopened turns and reset the silence clock | noisy train: hesitant answers never answered | `audio.ts`: an onset needs ≥ 1 YIN f0 frame; the silence clock runs from the last VOICED frame |
| 3 | "एक मिनट दीदी" was not a hold (a trailing address word) | train: 10/72 hold violations | `understand.js`: a VOCATIVE set |
| 4 | A settled continuer was re-classified after she resumed, and she yielded again | train F8 | `host.ts`: clear the overlap onset on resume |
| 5 | Echo onsets in her inter-word dips | train F12: 26/40 self-yields | `audio.ts`: 250 ms peak-hold of her output level; `echo.js`: a FRESH single token of hers is echo |
| 6 | A yield tag could not end an explanation; a non-answer clause ended closed questions | train: 34 late explanation ends; 46/192 drift pauses cut | `engineRules.ts`: the yield tag lifts the explanation cap; −1.5 logit for a closed question with no value |
| 7 | The wait-time-II backstop was 2 s | train: 49/440 mid-explanation cut-offs | `config.ts` open_explanation backstop 2.5-3.5 s |
| 8 | The backstop spoke an uptake and a verdict on an abandoned value while a repair was open | train: 3/40 | `governor.ts`: a verdict-free prompt when the repair is open |
| 9 | Her −30 dB echo IS transcribed by the real STT (L2). Items opened by her echo swallowed the child's answer (32-48% missed); whole-item echo removal deleted the child's "एक" | L2 + train | `fanin.js` straddling items; `echo.js` utterance-wide window, and no removal past the last echo run |
| 10 | Echo interleaved with a disclosure broke the safety predicate's phrase. The shipped predicate also misses "कभी कभी लगता है मैं ना रहूं।" when the STT's danda follows the last word | test F10 diagnosis (no tuning: safety is code) | `partialSafety.js` also scans the echo-stripped and the punctuation-free readings with the SAME predicate. The predicate bug is reported for server/director/safety.js (not this workstream's file) |

Two further adjustments:
- **Overlap duration bar:** sustained voice was raised from 450 to 600 ms. On the train split, TTS continuers ran 380-530 ms.
- **Stage B vouching:** a features-only stage B no longer "vouches" for unseen audio at G5 (`adapter.ts`). Letting it do so
  had removed the lexical horizon: 32 verdicts on repaired values on D4.
