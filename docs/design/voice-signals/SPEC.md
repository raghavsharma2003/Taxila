# VOICE-SIGNALS SPEC: reading what a child knows from how they answer

Status: design, 2026-10-04. Nothing here has been measured on a Taxila child. Each threshold is either a pre-registered
test (§7, §9) or is marked [E] (estimate) or [U] (unvalidated planning number). Evidence tags follow the repo
convention: [M] measured here (n, method, date given), [T] true of the current tree, [V] read at source, [S] taken
from a search summary.

Inputs: `RESEARCH-SCIENCE.md` (RS) and `RESEARCH-PLACEMENT.md` (RP) in this folder; `docs/design/signals/SIGNALS-SPEC.md`
(SS); `docs/design/signals/RESEARCH.md` (R); `docs/research/world-best/understanding-detection.md` (UD, which defines ESE);
`docs/research/duplex/ARCHITECTURE.md` and `src/duplex/engine.ts` (DX); `server/voice/features.js`; `src/voice/**`;
`shared/signals.ts`; `context/rejected.md`.

Owner directive (2026-10-04, binding): *"Voice signal will be a MAJOR part in checking that the student has understood
or not. If Microsoft has a problem, use AWS or Neon."*

---

## 0. The answer on one page

1. **What voice reads: knowledge states, not feelings.** There are eight per-turn states:
   `fluentRecall`, `workingAloud`, `fragileCorrect`, `heldBelief`, `effortfulGuess`, `rapidGuess`, `searching`, `absent`.
   Each one is defined by a **task outcome it predicts**, and each licenses one teaching move (§1):
   - advance or consolidate;
   - wait;
   - probe why;
   - correct by contrast, then re-check after a delay;
   - scaffold;
   - discount the answer and re-ask;
   - give a recall cue;
   - teach fresh.

   The models are trained only on outcomes: delayed or transfer success, recognition-probe success, or the same wrong
   answer coming back. They are never trained on a human's rating of how the child sounded. That **label test** (RP
   §4.2) is what keeps this outside Microsoft restriction 12, wherever the model runs.
2. **Voice becomes "major" by choosing the next question, not by moving mastery directly.** This splits into four parts:
   - **What it controls.** Voice picks the move. That move then produces graded, Tier-T evidence, and the evidence moves
     the learner model.
   - **Ladder of direct weight.** On mastery itself, voice starts as a likelihood ratio (LR) inside [0.9, 1.1], which is
     today's `lrE` clamp. It earns a wider clamp, up to [0.67, 1.5], only by passing pre-registered acceptance bars (§4.3).
   - **Downward cap.** A single turn can never lower pL by more than 0.03 (SS SL-8). This is unchanged.
   - **Where voice weighs most.** The `searching` vs `absent` split routes an "I don't know" either to a retrieval lapse
     (FSRS) or to a knowledge gap (pL). Once a recognition probe confirms it, that is the most consequential thing voice
     does to the learner model.
3. **One shared audio front-end** (§2): `src/voicesig/frontend/`.
   - **One worklet, two inputs.** Input 0 is the existing processed capture (AEC, NS and AGC on, the track STT
     receives). Input 1 is a second `getUserMedia` track with AGC and NS off, used only for analysis. The browser
     applies AGC before any worklet sees the audio, so a worklet cannot undo it; that is why the second track is needed.
   - **One per-frame computation**, every 20 ms: YIN f0 runs once, plus processed RMS, raw RMS and aperiodicity.
     An 80-bin log-mel ring is updated every 10 ms.
   - **One ONNX Runtime session per tab**, running the Smart Turn v3.2 backbone with its pooled embedding exposed
     (RP §2.4).
   - **The duplex engine** receives the same frames through its own public `EngineHost.frame(t, rms, f0)` and
     `estimate(e)` methods. The two are wired by a small glue file in the lesson runtime. Neither workflow edits the
     other's files.
4. **Model** (§3).
   - **Stage 1:** calibrated rules over child-relative, item-adjusted features. It runs in shadow from day one.
   - **Stage 2:** a small trained model. Inputs are the frozen Smart Turn embedding (384), a prosody GRU (96), about 16
     child-z scalars, text features and the grader verdict. The head is a multi-output MLP, under 50 KB.
   - **Where it runs:** on the device (WASM, with WebGPU later).
   - **Turn latency:** the head adds ≤ 20 ms, and the turn request is never delayed. The encoder pass (420-840 ms on a
     mid-range phone [E]) runs inside the existing classify window. If it is not ready in time, the head drops that
     input and does not wait.
5. **Fusion** (§4).
   - **Output:** voicesig emits `KnowledgeVoice` (numbers only) on `TurnRequest.voiceFeatures.kv`.
   - **Server side:** `server/voicesig/adapter.js` turns it into an LR `lrV` and a state proposal.
   - **Replacement, not addition:** `lrV` replaces, and is never multiplied with, the onset/filler part of `lrE` in
     `server/signals/states.js`. Otherwise the same evidence would be counted twice.
   - **Gating:** `lrV` is scaled by audio quality `q` and by per-child baseline maturity `m = n/(n+20)`. On a safety
     turn it is suppressed entirely.
   - **Seam:** this layer touches `server/signals/**` only through a documented adapter proposal (§4.5).
6. **Baselines** (§5).
   - **Storage:** they live in the main database, which is Neon today (`server/db.js` [T]), in a `voicesig.*` schema
     keyed by an HMAC of the child id.
   - **Write pattern:** loaded at lesson start, written at lesson end.
   - **Consent:** they persist only under the parent's **V2** opt-in, which is off by default. Without V2, baselines
     last for the session only.
   - **Retention:** rows are deleted after 180 days without the child being seen, and within 24 h of V2 being withdrawn.
7. **Data** (§6). No public corpus combines child speech, knowledge labels and a commercial licence.
   - **Shipped weights** come only from Taxila's own consented data: the real-child pilot (20-40 children of families
     the owner knows, 3 sessions with delayed transfer probes as ground truth), then the in-product flywheel (numbers
     plus later outcomes, under V4).
   - **Public corpora** are used for evaluation, or for licence-clean auxiliary tasks.
   - **Synthetic audio** proves measurement only.
8. **Acceptance** (§7). The pre-registered bars include:
   - AUROC on correct answers, against delayed-transfer failure;
   - **ΔAUROC over text-only signals**, the main bar;
   - searching vs absent, against the recognition probe;
   - calibration (ECE);
   - breakdowns by language mode, microphone class, age band and speech-difference group;
   - zero added turn latency, and duplex non-regression.

   No state changes behaviour for a real child before it passes its bars.

---

## 1. Outputs: knowledge states, the move each licenses, and their weight caps

### 1.1 The label test (binding; G-VS-LABEL)

A voicesig output may exist only if all of the following hold (RP §4.2):
- (a) it is trained, or calibrated, to predict a **task outcome**;
- (b) it is named for knowledge or for a move;
- (c) nothing documents, logs or prompts it as a feeling;
- (d) a lint enforces (b) and (c). This extends `tests/signals-lint.test.mjs` to `src/voicesig/**`, `server/voicesig/**`,
  `evals/voicesig/**` and `scripts/voicesig/**`. The forbidden list adds `unsure`, `confident`, `confidence`, `doubt`,
  `confused`, `nervous`, `anxious`, `hesitant` (as a state name) and `emotion*` to SS §3.1's regex.

Human coder labels (§6.3) may **evaluate** an output. They never **train** one.

### 1.2 Outcomes (the training and calibration targets)

| id | outcome | observed when | source |
|---|---|---|---|
| O1 | **delayed success**: the same skill is answered correctly at the delayed or woven check (CE7), or on a transfer variant, 2-7 days later | after a graded answer at t | scheduler, `comprehension` [T] |
| O2 | **recognition success** after a non-answer: the in-episode recognition probe (mcq2 or cue) is answered correctly | after an IDK turn | Director recall path [T], UD S1 |
| O3 | **persistence**: the same wrong answer (same FNV hash or numeric value, `SigAttempt.h`) recurs after corrective feedback, in the session or at the delayed check | after a wrong answer | `SignalSession.item.attempts` [T] |
| O4 | **re-ask agreement**: an immediate re-ask, or a parallel item, gets the same verdict | after a rapid answer | Director re-ask |

### 1.3 The eight states

Notation:
- `v` is the grader verdict (Tier T, never voice).
- `h1..h4` are the head outputs (§3.3), each one a calibrated probability of the matching O1..O4.
- Every threshold is [U] until its measurement passes.

| state | defined by (verdict × predicted outcome) | strongest voice cues (RS §8) | teaching move it licenses | consumer (existing) | SS equivalent |
|---|---|---|---|---|---|
| `fluentRecall` | v = correct ∧ h1 ≥ 0.85 | short item-adjusted content onset (z ≤ −0.5), no leading filler, no hedge, steady articulation | **advance** (or count toward `advanceOk`); fade guidance | Director / beat exit; comprehension | D9 `advanceOk`, D1 fluent ×1.05 |
| `workingAloud` | turn in progress or just ended with procedure words + within-turn pauses + voiced duration ≥ child p75; no verdict needed | voiced run structure, pauses resumed, rate stable; text "pehle… phir…", partial values | **slow down / wait**: hold the rung, wait ≥ max(nudgeAtSec, 8 s), never hint into it | vibe/turn timing; duplex hold | D11 `waitLonger`, `thinkAloud` |
| `fragileCorrect` | v = correct ∧ h1 ≤ 0.55 | delayed content onset, leading filler, text hedge, pause fraction; final-word relative intensity (raw track; VS-M4) | **probe why** ("kaise socha?") or a transfer probe; if mastery is on the edge, **consolidate** with one extra item in a new representation | Director `shouldAskWhy`; D9 | D2 `unsureCorrect` (rename proposed: `fragileCorrect`) ⇒ `verifyDue` |
| `heldBelief` | v ∈ {not_yet, partial} ∧ h3 ≥ 0.5 | fast, fluent, unhedged wrong answer; strongest when O3 history exists | **correct by contrast**: clear corrective feedback, the child regenerates the correct answer, the kit's misconception contrast, a representation switch, then a **delayed re-check** on the scheduler | Director (rung, representation); scheduler | D3 `stuck_unproductive` with a matched misconception |
| `effortfulGuess` | v = not_yet ∧ h3 < 0.5 ∧ slow/filled | slow onset, fillers, hedge | **scaffold** (the normal not-yet path); do **not** treat it as a misconception | Director | default path |
| `rapidGuess` | onset ≪ child norm for the item class (z ≤ −2, item-adjusted) ∧ short answer ∧ h4 < 0.6 | timing only | **discount and re-ask**: evidence weight ×0.5 on the turn (SS D10), re-ask or offer a choice | comprehension; Director | D10 `evidenceDiscount` |
| `searching` | non-answer ∧ h2 ≥ 0.6 | **slow, filled** IDK; "yaad nahi aa raha / zubaan pe hai / ruko"; partial information | **recall cue** (two-option recognition probe); if the probe succeeds, count an **FSRS lapse, not a pL drop** | Director recall; FSRS | D4 `recallCue` |
| `absent` | non-answer ∧ h2 ≤ 0.35 | **fast, unfilled** "pata nahi / nahi aata" | **teach fresh** with the kit's first representation; do not cue | Director | D4 `teachFresh` |

Everything else, including the band between thresholds, is `null` (abstain). Abstaining is the expected result on
most turns.

### 1.4 Weight caps per state (what each state may do at each ladder level)

**Move licences** follow SS SL-4. A voice-only (Tier E) reading may buy only a **cheap** move, meaning one that is
useful whether or not the reading is right: a why-probe, a recall cue, a longer wait, or a re-ask.

The **costly moves** are teaching fresh, holding advancement, and any move against the child. For these, voice must
agree with a Tier-T signal (verdict, lexical IDK type, hedge, or O3 history). If voice and Tier T disagree, the state
is `null` (SL-11).

**Evidence caps** are on the LR that voicesig adds to the knowledge emission of the turn.

| state | move licence when voice-only | move licence with T agreement | LR cap L1 (default) | L2 (after §7 bars) | L3 (after replication) | pL effect cap per turn |
|---|---|---|---|---|---|---|
| `fluentRecall` | none (no move needed) | `advanceOk` input | ≤ 1.10 | ≤ 1.25 | ≤ 1.50 | +0.03 / +0.04 / +0.05 |
| `workingAloud` | wait (timing only) | wait | 1.00 (no evidence) | 1.00 | 1.00 | 0 |
| `fragileCorrect` | why-probe (counts against SL-12 budget) | why-probe; consolidate ≤ 1 extra item | ≥ 0.90 | ≥ 0.80 | ≥ 0.67 | −0.03 (SL-8, all levels) |
| `heldBelief` | none (costly: needs T) | contrast correction + delayed re-check | ≥ 0.90 on the misconception facet | ≥ 0.80 | ≥ 0.67 | −0.03 (SL-8) |
| `effortfulGuess` | none | scaffold (default path) | 1.00 | 1.00 | 1.00 | 0 |
| `rapidGuess` | re-ask (cheap) | evidence ×0.5 (D10) | weight ×0.5 toward 1 (the answer is down-weighted, the child is not penalised) | same | same | 0 beyond the discount |
| `searching` | recall cue (cheap) | route to FSRS lapse when O2 confirms | n/a: routes the event, no LR | — | — | pL unchanged if confirmed |
| `absent` | none (costly: needs the lexical IDK) | teach fresh | n/a | — | — | normal not-yet path |

Ladder rules:
- **Level per state.** A level is granted per state, never globally, and it is a config row
  (`server/voicesig/ladder.js`) with the measurement id that earned it.
- **Demotion.** If a monthly refit fails the bar it was granted on, the state drops one level automatically
  (G-VS-LADDER).
- **Downward cap.** The −0.03 limit is SS SL-8 and is not this spec's to change. Raising it is an owner decision with
  its own measurement.

### 1.5 Wire type (proposed `src/voicesig/types.ts`; numbers only)

```ts
export type VsState = "fluentRecall" | "workingAloud" | "fragileCorrect" | "heldBelief" | "effortfulGuess"
  | "rapidGuess" | "searching" | "absent";
export interface KnowledgeVoice {
  v: 1; modelVer: string; stage: 0 | 1 | 2;          // 0 = features only (shadow), 1 = rules, 2 = trained head
  aLogit?: [number, number, number, number];          // stage 2 only: audio partial logits A·audio64 for h1..h4 (§3.3);
                                                     // the server adds text/verdict logits + calibration → h1..h4
  z: Record<string, number | null>;                  // child-relative feature z (§3.1), null = immature baseline
  q: { audio: number; raw: 0 | 1; enc: 0 | 1; micClass: MicClass; langMode: "hi" | "hinglish" | "en" | "unk" };
  baselineN: number;                                 // samples behind the z (maturity, §4.2)
  computeMs: number;                                 // device cost, for VS-A9
}
export type MicClass = "builtin" | "wired" | "bt" | "speaker_route" | "unknown";
```

States are **derived on the server** from `h`, the verdict and Tier T (§4). The device never sends a state name, so a
client bug can never assert one. `server/voice/features.js` has to admit `kv.*` in its range-checked allowlist **before**
the client sends it. That order is a hard lesson: an unknown field returns HTTP 400 and the utterance is lost (RP §6
step 5; `voice-features-latest-signals-race`).

---

## 2. One shared audio front-end

### 2.1 Why a second track, and what each track is for

- Today both lesson links capture with `{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }`
  (`src/lesson/voiceLink.ts:92`, `cascadeLink.ts:391` [T]).
- AGC runs inside the browser's capture pipeline, before any `MediaStreamSource` or AudioWorklet sees a sample. So no
  worklet can undo it, and "an AudioWorklet with AGC off" is only possible on a track that was **requested** with AGC
  off.
- AGC flattens relative intensity, the cue that tracks **accuracy** in adults (RS §2.3; RS #4). It is RS §8 cue #8,
  currently blocked.

| track | constraints | feeds | never feeds |
|---|---|---|---|
| **P (processed)**: the existing capture | AEC on, NS on, AGC on (unchanged) | STT and the S2S link (unchanged); YIN f0, processed RMS, VAD, the log-mel ring | — |
| **R (raw analysis)**: new, flag `voicesig.rawTrack` | preferred `{ echoCancellation: true, noiseSuppression: false, autoGainControl: false }` (config R1). Fallback R2: all three false, with echo gated by her playback clock | **RMS only** (raw dB, peak, clip fraction, noise floor): relative intensity, SNR, clipping, gain-change detection for `q` | STT, any network path, the encoder (the encoder stays on P, the distribution Smart Turn was trained on) |

Rules:
1. **R is optional, and its absence never fails anything.** If the second `getUserMedia` call fails, or if VS-M4(a)
   finds that R degrades P's AEC on a device class, R is off for that class. Intensity cues are then dropped, `q.raw = 0`,
   and everything else runs unchanged.
2. **R is analysed only on child frames.** These are frames voiced by P's VAD while her playback meter is below
   `TEACHER_AUDIBLE` (`src/voice/features.ts` [T]) and `echoRisk = 0`. In config R2 the speaker leaks into R, so R
   frames during her audio are discarded.
3. **No audio leaves the device from either track** (unchanged law). Only numbers leave.
4. **Android WebView / Capacitor.** Whether a second capture with different processing is honoured on the same device
   is [U] per browser engine, so VS-M4(a) runs on Chrome Android **and** the APK WebView. iOS Safari historically
   shares one processed source per device [U]; there R is expected off.

### 2.2 The module: `src/voicesig/frontend/` (owned by voicesig; imports, never copies, the shipped DSP)

```
src/voicesig/frontend/
  tapWorklet.ts     one AudioWorkletProcessor "taxila-tap2", numberOfInputs: 2 (P, R). Audio thread does ONLY:
                    anti-alias + decimate to 16 kHz on both inputs, post 20 ms chunks {t, p: Float32Array, r?: Float32Array}
                    (same discipline as src/voice/featureWorklet.ts: no analysis on the audio thread, rejected class
                    "CPU contention on mid-range Android").
  frames.ts         main-thread/Worker consumer: per 20 ms hop, ONE call to the shipped dsp.ts FrameAnalyzer on P
                    (YIN f0, aperiodicity, RMS, adaptive floor) + rmsOf() on R → AudioFrame (below). ≈ 9.6 ms CPU per audio
                    second [M RP §2.3: 0.172 ms p50 / hop, n = 1,575 hops, 2026-10-04]; R adds one RMS per hop (< 0.01 ms [E]).
  logmel.ts         incremental 80-bin log-mel of P, 10 ms hop, 8 s ring (≈ 9 ms CPU per audio second [M RP §2.3]).
  encoder.ts        THE single ORT-web session per tab (Worker): Smart Turn v3.2 int8 with the extra outputs
                    (pooled 384, frames) from RP's expose script. Publishes EncoderPass. Device class probe at session start
                    (one pass on silence; > 600 ms [E] → encoder disabled for the session, prosody path only).
  bus.ts            AudioFrontEnd: the publish/subscribe surface below. No consumer touches a worklet or a session.
  types.ts          AudioFrame, EncoderPass, AudioFrontEnd (erasable TS, no imports beyond shared/).
```

```ts
export interface AudioFrame {                 // one per 20 ms hop; numbers only
  t: number;                                  // audio clock, ms (AudioContext.currentTime base, as featureWorklet)
  rmsDb: number;                              // P (processed): what EnergyVad / duplex / cascade duck already mean by "loud"
  f0: number | null; aperiodicity: number;    // YIN on P, computed ONCE for every consumer
  speech: boolean;                            // FrameAnalyzer's adaptive-floor speech flag
  rawDb?: number; rawPeak?: number; rawClip?: number;   // R only; absent when q.raw = 0
}
export interface EncoderPass { turnSeq: number; t: number; windowMs: number; logits: Float32Array; pooled: Float32Array;
  computeMs: number; device: "wasm1" | "wasm4" | "webgpu" }
export interface AudioFrontEnd {
  onFrame(cb: (f: AudioFrame) => void): () => void;
  onEncoderPass(cb: (p: EncoderPass) => void): () => void;
  requestPass(turnSeq: number, endT: number): void;      // idempotent per turnSeq; coalesces duplex + voicesig requests
  window(ms: number): Float32Array | null;               // last N ms of P at 16 kHz, for duplex's EngineTick.audio (stage B)
  frames(fromT: number, toT: number): AudioFrame[];       // ring of the last 90 s (HISTORY_MS, tracker.ts [T])
  caps(): { raw: boolean; encoder: boolean; micClass: MicClass };
}
```

### 2.3 How each consumer reads it, without either workflow editing the other's files

| consumer | how it consumes | file that changes | owner of that change |
|---|---|---|---|
| **duplex engine** (`src/duplex/host.ts`) | the existing public `EngineHost.frame(t, rms, f0)` is called with `f.t, f.rmsDb` converted to linear RMS (as today) and `f.f0`. Its `ChildAudioTracker` keeps deriving every `ProsodyFrame` field (`f0SlopeStPerS`, `f0RelRange`, `energySlopeDbPerS`, `finalLengthening`, `speechRateSylPerS`) itself. Smart Turn `pTurnEnd` arrives through the existing `estimate({ acoustic })` as an `AcousticEstimate` built from `EncoderPass.logits`. `EngineTick.audio` is filled from `window(ms)` | **none in `src/duplex/**`** | — |
| **lesson runtime glue** | one new file, `src/lesson/frontendGlue.ts` (proposed): it creates the `AudioFrontEnd` on the link's existing `AudioContext` and `MicTap`, and forwards `onFrame` → `host.frame`, `onEncoderPass` → `host.estimate`, and `onFrame` → `VoiceFeatures`. About 40 lines | new file in `src/lesson/` | main loop (Wave 2 owns `src/child/lesson/**`; `src/lesson/` is the link owner's) |
| **`src/voice/VoiceFeatures`** | a proposed `attachFrames(fe: AudioFrontEnd)` alongside `attach(stream)`: it consumes `AudioFrame`s instead of creating its own `taxila-feature-tap` worklet. With `voicesig.frontend` on, its own worklet is never created, so there is still exactly **one** tap | `src/voice/features.ts` (+ about 25 lines) | voice owner (main loop) |
| **voicesig head** (`src/voicesig/head.ts`) | `frames()` for the committed turn's span, then `utteranceStats()` from the shipped `dsp.ts` and the tracker scalars; `onEncoderPass` for the turn's `turnSeq` (`requestPass` if none exists) | own scope | voicesig |

**Exactly-one invariants** (G-VS-ONE, a Playwright and unit test):
- one `AudioWorkletNode` named `taxila-tap2` or `taxila-feature-tap`, never both;
- one `InferenceSession` for the Smart Turn model;
- one YIN call per hop;
- `requestPass` from duplex and voicesig for the same `turnSeq` yields one pass.

**Duplex non-regression** (G-VS-DXEQ): replay a recorded frame log through `ChildAudioTracker`, once fed by the old
`featureWorklet` path and once by `frames.ts`. Every `ProsodyFrame` field must be byte-identical. This holds by
construction because both run the same `FrameAnalyzer` on the same P samples, and the test proves it.

**Mapping of the duplex `ProsodyFrame` fields to voicesig features.** These are shared semantics, computed once per
consumer from the same frames:

| `EngineTick.child.prosody` field | voicesig use | note |
|---|---|---|
| `f0Hz`, `f0RelRange` | GRU input `f0St` (child-session-relative); never a feature on its own | F0 level/range is RS §8 "excluded"; it is a GRU input only, and an ablation in VS-A11 must show the head does not lean on it |
| `f0SlopeStPerS` | not a stage-1 feature (Hindi phrase-final rise, RS §4.1; SS A9 excluded) | stage 2 may see contour only through the GRU, with VS-M3 deciding re-admission |
| `energyDb`, `energySlopeDbPerS` | `rawDb`-based relative intensity replaces it when `q.raw = 1` | AGC-processed energy is the floor cue; raw energy is the knowledge cue |
| `finalLengthening` | not used for knowledge (Hindi contrastive length, RS §4.3) | duplex keeps it for floor timing |
| `speechRateSylPerS` | `articulationZ` cross-check (A16 nuclei/s) | |
| `ChildAudio.silenceRunMs`, `pausesThisTurn`, `firstOnsetAt` | content onset, pause fraction, `workingAloud` structure | the same timestamps, so duplex and voicesig never disagree on when the child began |

---

## 3. The model

### 3.1 Features (child-relative first, item-adjusted, language-mode keyed)

Every scalar is converted to a z against the child's own baseline for **(context, langMode, item form)**. While the
baseline has fewer than 8 samples, band priors apply (SS §2.5.5 `BAND_PRIORS`), and an offset is subtracted when it is
fitted: δ(form, b − θ), SS §2.5.3. A language-mode key prevents code-switching from looking like hesitation (RS §4.4;
VS-M7).

| # | feature | source | tier | stage 1 | stage 2 |
|---|---|---|---|---|---|
| F1 | content onset z (onset + leading filled segment, `onsetContentMs`, SS A2), item-adjusted | frames + tracker | E | ✔ | ✔ |
| F2 | response type: answer / IDK `cant_recall` / IDK `not_known` / other (`server/signals/linguistic.js` [T]) | transcript | T | ✔ | ✔ |
| F3 | leading filler (acoustic flat-voiced run A7 ∨ lexical L4) | frames + transcript | E/T | ✔ | ✔ |
| F4 | text hedge (L3) | transcript | T | ✔ | ✔ |
| F5 | pause fraction z, longest pause z (A3/A4) | frames | E | ✔ | ✔ |
| F6 | articulation rate z (A6), A16 cross-check | frames + transcript | E | ✔ | ✔ |
| F7 | final-word relative intensity: raw dB of the last voiced 300 ms minus the utterance's raw median | R track | E | only if q.raw | ✔ |
| F8 | duration ratio vs child median for the form (wordy forms only, `sig-l15-wordy-forms-only`) | tracker | E | ✔ | ✔ |
| F9 | self-repair direction (L5) | transcript | T | ✔ | ✔ |
| F10 | intra-turn code-switch flag | transcript | T | key | ✔ |
| F11 | prosody GRU embedding (96) over [f0St, rawDb or rmsDb rel, speech, aperiodicity] frames | frames | E | — | ✔ |
| F12 | Smart Turn pooled embedding (384), frozen | encoder | E | — | ✔ (challenger, VSP-M2) |
| F13 | grader verdict, item b − θ, hint rung, attempts on item | server | T | ✔ | ✔ |

### 3.2 Stage 1: calibrated rules (ships to shadow first; no training data needed to start)

Stage 1 scores each state with a transparent additive rule over F1-F10, then maps the score to h1..h4 through a
**per-band isotonic calibration**. Before the pilot, that calibration is an identity placeholder, so stage 1 is
**shadow only**. It becomes active once it is fitted on pilot outcomes (§6.3).

| head | rule score (each term ±1, only when its feature is reliable) |
|---|---|
| h1 (correct → delayed success) | −[F1 z ≥ 1.0] − [F3] − [F4] − [F5 z ≥ 1.0] + [F1 z ≤ −0.5 ∧ ¬F3 ∧ ¬F4] + [F7 ≥ +2 dB] |
| h2 (IDK → recognition success) | +[F2 = cant_recall] + [F1 z ≥ 1.0] + [F3] − [F2 = not_known ∧ F1 z ≤ 0] |
| h3 (wrong → persistence) | +[F1 z ≤ −0.5] + [¬F3 ∧ ¬F4] + [same hash as a prior wrong (O3 history)] |
| h4 (rapid → re-ask agreement) | −[F1 z ≤ −2.0 ∧ words ≤ 2] |

Rules:
- **Guards.** These are SS's guardrails, unchanged: `q.audio < 0.5` ⇒ every E term is 0; δ unfitted ⇒ F1 is not
  item-adjusted, and its E terms are halved; safety ⇒ `ABSTAIN`.
- **Age band.** For the 9-10 band (B1/B2-equivalent ages), VS-M6 decides whether E terms stay on. Until then, they
  are halved.
- **Determinism.** Stage 1 is pure and deterministic, and lives in `server/voicesig/rules.js` (the server sees the z
  values and the transcript). Running it on the server lets it use Tier T features without shipping the lexicon to
  the client. The device sends `aLogit` only when stage 2 is active; h1..h4 are always finished on the server.

### 3.3 Stage 2: trained small model (encoder + head, text + audio fusion)

```
 frames (P, R) ─► prosody GRU (1 layer, 96 hidden, ≈ 38k params) ─┐
 EncoderPass.pooled (384, frozen Smart Turn) ─► Linear 384→32 ─────┤
 F1-F10 child-z scalars (≈ 16) ────────────────────────────────────┼─► MLP 160→64→4 (+ per-head bias) ─► logits → per-band
 text bits: F2 one-hot, F4, F9, F10; F13 verdict one-hot, b−θ, rung ┘                         temperature + per-child (a, b) ─► h1..h4
```

**Where each part lives.**
- **Device (`src/voicesig/head.ts`).** The GRU, the projection and the MLP run as one ONNX graph of under 200 KB in
  the shared ORT session's runtime. They run in a **second, tiny InferenceSession** for the head. The single-session
  rule is about the 8.7 MB encoder, and the head graph is separate by design so it can be swapped without touching
  duplex.
- **Text bits and verdict.** These are known only on the server at grading time. So the device computes the
  **audio-side embedding** (GRU + projection, 64-d) and the audio-only partial logits. The server's adapter adds the
  text and verdict logits from a **linear layer over the same weights**. Concretely, the head is factorised as
  `logit = A·audio64 + T·text + c` (with A and T read from the same exported weight file), so no audio embedding is
  ever uploaded.

**What leaves the device.** `A·audio64`, the four audio partial logits. That is 4 numbers per turn, low-identity by
construction; VSP-M3 checks the EER.

**Training targets.** O1-O4 (§1.2), as multi-task binary cross-entropy. Each head trains only on turns where its
outcome is defined: h1 on correct answers, h2 on IDKs, h3 on wrong answers, h4 on rapid answers. There is **no
self-report target**, because children aged 7-10 are poor, overconfident judges of their own knowing (RS §3.2).

**Per-child calibration.** This uses ESE's random intercept and slope: `(a, b)` per head, shrunk to (0, 1) until the
child has n ≥ 30 outcome-labelled turns (`voicesig.calibration`, §5).

**Training phases.**

| phase | data | compute | cost | auto-termination |
|---|---|---|---|---|
| K1 | pilot (§6.3) rows: features + outcomes, about 3,600 turns [E] | Azure Container Apps job, South India, CPU; the 38k GRU trains one E1-sized epoch in 20.4 s on 4 vCPU [M RP §2.1, 2026-10-04] | < USD 2 of the Azure cap of USD 20 [E] | ACA job exits; no idle instance by construction |
| K2 | pilot + flywheel rows (V4); frozen-encoder embeddings extracted **on device during the pilot sessions** (pilot audio is also kept under V3 to allow re-extraction) | same, CPU | < USD 5 [E] | same |
| K3 (optional) | V3 research audio only; multi-task fine-tune of the encoder's top layers, EOT loss on Smart Turn's CC-BY data + child holds + O1-O4 | AWS g5.xlarge spot via `scripts/gpu` harness (self-shutdown, EventBridge backstop, reaper, terminate-on-exit [T]); **Mumbai** once quota `L-3819A6DF` is raised, else us-east-1 **only if** the V3 consent names US processing | USD 22-36 spot, ≤ 64 on-demand [E RP §3.4] vs AWS cap 80 | harness terminates; a budget action `taxila-voicesig` USD 80 blocks launches at 100% (owner action) |

K3 ships only if duplex end-of-turn (EOT) metrics do not regress (VSP-M5), because a fine-tuned backbone changes
duplex's `pTurnEnd`. Until then, the backbone stays frozen.

### 3.4 Where it runs and the latency budget per turn

The budget is set by a standing rule: **the turn request is never delayed by voicesig.** Speed is not traded away.

| step | where | budget | measured / estimate | if late |
|---|---|---|---|---|
| frame DSP (YIN, RMS ×2, mel) | Worker, continuous | ≤ 20 ms CPU per audio second | ≈ 19 ms/audio-s [M RP §2.3, Xeon], ×2-4 on mid-range phones [E] | — (streaming) |
| utterance stats + z | device at commit | ≤ 5 ms | `utteranceStats` is already shipped [T]; cost not separately measured | — |
| prosody GRU + head audio part | device at commit | ≤ 20 ms p95 | 1.9 ms Xeon WASM [M], 4-8 ms phone [E] | omitted from this turn; `stage` drops to 1 |
| encoder pass (8 s window) | device Worker, started at duplex's candidate end or at commit | must finish before the STT final + 150 ms grace | 209 ms Xeon WASM 1 thread [M], 420-840 ms phone [E]; the classify window after commit is 726 ms p50 [T DX §5] | `q.enc = 0`; the head uses its encoder-absent variant (trained with encoder dropout p = 0.3) |
| attach `kv` to `TurnRequest` | device | 0 added ms (attached to the request that is already being sent) | — | — |
| `server/voicesig/adapter.js` + rules | server, inside `signals.step` | ≤ 2 ms p99 (SS SL-13 budget is 30 ms in total) | [U] until benchmarked (VS-A9) | — |

The encoder-absent head variant is the **floor** on slow devices (RP §2.4 rule 4). The model degrades by dropping
inputs, never by failing or by waiting.

There is **no server-side audio fallback.** Running the encoder on our own Container Apps CPU (native 40 ms [M]) would
mean uploading mel frames, which carry identity. That breaks "audio never leaves the device", so it is not offered. A
device that is too slow runs prosody-only.

---

## 4. Fusion into the signal layer and the learner model

### 4.1 Path

```
device kv ──► TurnRequest.voiceFeatures.kv ──► server/voice/features.js (allowlist, ranges) ──► turnVoice()
          ──► server/voicesig/adapter.js: toSignalInput(kv, verdict, ling, baseline) → { lrV, state, why, cap }
          ──► server/signals step(): scanSafety result first (safety ⇒ ABSTAIN, adapter output discarded)
              evidenceWeight.lrE := clip(lrE_nonTiming × lrV, cap(state, ladder))   ← replaces A1/L4 term, never stacks
              unsureCorrect/verifyDue, recall, advance, evidenceDiscount fed by the derived state (§1.3 "SS equivalent")
          ──► comprehension fuse: sigWeight = k; lrE multiplies the facet likelihood; |ΔpL| clipped (SL-8, §1.4 column)
```

### 4.2 How much voice may move mastery: gating

`lrV = 1 + (lrRaw − 1) · g`, with `g = qA · m · aB`:
- `lrRaw = h/(1−h) ÷ prior odds`, using the head output for the turn's state, with the prior taken per band and form.
- **qA**, audio quality: `min(q.acoustic` from SS §2.6 `quality()` [T], `qBed, qDur, qLevel`, mic-class factor`)`. The
  mic-class factor is 1 for builtin and wired, 0.8 for bt (codec latency smears onset [E]), and 0.5 for speaker_route
  (echo risk). If `qA < 0.5`, then g = 0.
- **m**, baseline maturity: `n / (n + 20)`, where n is the child's reliable samples for the turn's (context, langMode,
  form). If n < 8, m = 0 for E-only terms (band priors may still set timing, SS SL-5).
- **aB**, age-band factor: 1, or 0.5 for ages 9-10 until VS-M6 passes.

After gating, `lrV` is clipped to the state's ladder cap (§1.4). The product with the non-timing part of `lrE` is
clipped again to the same cap. `clipMasteryNudge` (`server/signals/index.js` [T]) still enforces the pL cap.

**Disagreement** (SL-11). If voice says `fluentRecall` and Tier T says hedge or right-to-wrong, or voice says
`fragileCorrect` and Tier T says fluent with no hedge, then the state is `null` and `lrV` = 1.

### 4.3 Earned weight (the meaning of "major")

| ladder | entry bar (all child-clustered, pre-registered) | what voice may then do |
|---|---|---|
| L0 shadow | the pipeline runs; G-VS gates pass | log only (`brain_trace` reason codes `vs:<state>:<feature>`) |
| L1 | the stage-1 calibration is fitted on the pilot, ECE ≤ 0.08, and fire-rate fairness passes | cheap moves on voice alone; LR within [0.9, 1.1] (today's clamp) |
| L2 | VS-A1 ΔAUROC ≥ 0.03 over text-only (80% CI excludes 0), VS-A4 ECE ≤ 0.05, VS-A6 breakdowns pass | LR [0.8, 1.25]; voice may decide `consolidate` (≤ 1 extra item) together with Tier T |
| L3 | L2 bars replicated on a second cohort (flywheel, n ≥ 200 children) **and** VS-M5 shows a teaching gain (delayed accuracy +0.03, CI excludes 0) | LR [0.67, 1.5]; voice is a primary input to `advanceOk` (still with T agreement for costly moves) |

### 4.4 Learner-model effects beyond the LR

- **`searching` confirmed by O2.** The FSRS card logs a lapse, and pL is not lowered. If the probe fails, the event
  becomes a normal not-yet. The LR is not touched in either case. This is the largest structural effect voice has,
  and it is gated on Tier T (the recognition answer).
- **`heldBelief`.** Opens a misconception facet on the skill (comprehension `facets.js`, owner: comprehension) and
  books a delayed re-check through the scheduler. The facet is evidence, never a label shown to anyone (SL-9).
- **`fluentRecall` over weeks.** A skill-level fluency aggregate: the median onset z over the child's last 10 correct
  answers on the skill. It is a candidate covariate for the delayed-check scheduler's interval, adopted only if VS-M2
  shows ΔAUC ≥ 0.01. This is where voice timing is strongest (RS §6.3, adjusted R² about 0.6 in reading [S]).

### 4.5 Adapter proposal for the files this workflow may not edit

| # | file (owner) | change | flag |
|---|---|---|---|
| A1 | `shared/signals.ts` (seam; main loop) | `SignalInput.voice.kv?: KvServer` (the adapter output: `{ lrV, state, cap, why }`), and rename `unsureCorrect` → `fragileCorrect` with a one-release alias (RS §1.3) | — |
| A2 | `server/signals/states.js` (signals owner) | when `input.voice.kv` is present and its stage is ≥ 1, skip the A1/L4 `LR_FLUENT`/`LR_SLOW` term and use `kv.lrV` instead; map `kv.state` into D2/D4/D9/D10 inputs; `why` gains `V1..V4` feature ids | `TAXILA_VOICESIG` = off / shadow / on |
| A3 | `server/voice/features.js` (voice owner) | admit `kv` with ranges (aLogit ∈ [−20, 20], z ∈ [−6, 6], computeMs ≤ 5000); `reliable` gating unchanged | — |
| A4 | `server/routes/lesson.js` (Wave 2) | load the `voicesig.*` baseline at lesson start and pass it through; write it back at lesson end (calls `server/voicesig/baseline.js`) | `voicesig.persist` (needs V2) |
| A5 | `src/lesson/frontendGlue.ts` (new; link owner) and `src/voice/features.ts` `attachFrames` | §2.3 | `voicesig.frontend` |
| A6 | `src/child/lesson/**` (Wave 2) | attach `kv` to `TurnRequest.voiceFeatures` | `voicesig.head` |
| A7 | `server/comprehension/*` (comprehension owner) | FSRS-lapse routing for a confirmed `searching`; a misconception facet for `heldBelief` | `TAXILA_SIGNALS_EVIDENCE` |

The order is A3 → A1 → A2 → A6 → A5 → A4 → A7: the server accepts a field before the client sends it.

---

## 5. Per-child baselines in Neon

### 5.1 Placement

- **Where.** The main database (`DATABASE_URL`; Neon today, `server/db.js` [T]), in a separate schema `voicesig`. One
  deletion path and one driver.
- **Region.** Neon has no India region; the nearest is Singapore [M RP §5, 2026-10-04]. This is named in the V2 notice.
- **If the India move goes ahead.** If the main database moves to Azure Database for PostgreSQL in South India, the
  schema moves with it unchanged.
- **Restriction 12.** Not engaged by either store: storing numbers is not using a Microsoft AI service (RP §4.1).

### 5.2 Migration sketch (`db/migrations/0NN_voicesig.sql`, proposed; the main loop numbers and applies it, test branch first)

Statements are separated by `;` at the end of a line, with no `$$` (per `db/migrations/README.md`).

```sql
create schema if not exists voicesig;
create table if not exists voicesig.subject (
  subject      bytea primary key,                     -- HMAC-SHA256(child_id, VOICESIG_SUBJECT_KEY), server-computed
  child_id     uuid not null unique references child(id) on delete cascade,   -- same DB: FK gives erasure for free
  consent_ver  text not null,                         -- V2 notice version
  granted_at   timestamptz not null,
  band         text not null check (band in ('B1','B2','B3','B4')),
  last_seen    timestamptz not null default now()
);
create table if not exists voicesig.baseline (
  subject    bytea not null references voicesig.subject(subject) on delete cascade,
  context    text not null check (context in ('answer','read_aloud')),
  lang_mode  text not null check (lang_mode in ('hi','hinglish','en','unk')),
  form       text not null check (form in ('number','word','choice_spoken','explain','read_aloud')),
  feature    text not null check (feature in ('onsetMs','contentOnsetMs','pauseFrac','longestPauseMs',
               'articulationWps','voicedFrac','flatVoicedRuns','durRatio','finalRelDb')),
  n int not null check (n >= 0), n_total int not null check (n_total >= n),
  mean double precision not null, m2 double precision not null check (m2 >= 0),
  updated_at timestamptz not null default now(),
  primary key (subject, context, lang_mode, form, feature)
);
create table if not exists voicesig.calibration (
  subject bytea not null references voicesig.subject(subject) on delete cascade,
  head text not null check (head in ('h1','h2','h3','h4')),
  model_ver text not null, n int not null check (n >= 0),
  a double precision not null default 0, b double precision not null default 1,
  updated_at timestamptz not null default now(),
  primary key (subject, head, model_ver)
);
create table if not exists voicesig.population_norm (
  feature text not null, band text not null, lang_mode text not null, form text not null, item_b_bin smallint not null,
  n_children int not null check (n_children >= 20), median double precision not null, mad double precision not null,
  fitted_at timestamptz not null default now(),
  primary key (feature, band, lang_mode, form, item_b_bin)
);
create index if not exists voicesig_subject_seen on voicesig.subject(last_seen);
```

This differs from RP §5 in three ways:
- a `child_id` foreign key, since the tables share a database, which gives cascade erasure;
- `form` in the key, because onset differs by answer form (SS §2.5.3);
- head names `h1..h4` instead of state names, so no state name is stored (SL-9).

The schema can hold **no** per-turn history, text, embedding, audio or derived state (G-VS-SCHEMA scans it). Size is
about 9 features × 2 contexts × 4 language modes × up to 5 forms, plus 4 calibration rows: ≤ 364 rows (≈ 40 KB) per
child [E].

### 5.3 Access, retention, toggle

- **Access.** Load once at lesson start (one query). Update in memory on reliable turns only, using the
  `features.js` Welford rules with an exponential window past n = 300. Write once at lesson end (one upsert batch,
  optimistic lock on `n_total`). That is two round trips per lesson, off the turn path, so Singapore latency does not
  matter.
- **Parent toggle V2** ("Remember your child's usual answering pace"):
  - **Off by default.** While off, the same in-memory baseline runs for the session only (SS mode M0), seeded from band
    priors, so the feature still works (and matures after about 8 answers per form within the session).
  - **Withdrawal.** Deletes the `voicesig.subject` row, which cascades to everything else, within 24 h (the target is
    immediate: synchronous delete on the Controls action, plus a nightly sweep as a backstop).
  - **Existing table.** The existing `voice_baseline` table (migration 006) currently persists without a V2-style grant
    [T]. **Proposal for the main loop:** put it under the same V2 gate, or fold it into `voicesig.baseline` and drop it.
    Either way there must be one persistent baseline, not two.
- **Retention.** A nightly job deletes subjects with `last_seen` older than 180 days. Children change, so a stale
  baseline is worse than band priors.
- **Erasure.** Account deletion cascades through `child(id)` (the B3 deletion path [T]).
- **Population norms.** k ≥ 20 children per cell, with no subject column, so they are not personal data once fitted [U:
  counsel to confirm].

---

## 6. Data plan

### 6.1 Public corpora (licence-correct use)

Anything trained into a shipped model must permit commercial use. A non-commercial corpus is **evaluation or research
only**, and is labelled that way in `evals/voicesig/CORPORA.md` (to be written with the first download, after the
licence has been read at source). No gated Hugging Face model or dataset is used.

| corpus | content | licence | permitted use here | status |
|---|---|---|---|---|
| IndicVoices | adult Indic speech incl. Hindi, spontaneous | CC BY 4.0 [S] | **train**: Hindi filler detector (A7 calibration), VAD/onset calibration, langMode classifier for F10 | verify licence at source before download |
| Vaani (IISc/ARTPARK) | adult Indic speech, many districts | CC BY 4.0 [S] | **train**: same auxiliary tasks; dialect coverage for fairness eval | verify |
| Smart Turn training data (via the model) | EOT clips | CC BY 4.0 (model BSD-2) [V RP] | already in the frozen encoder; K3 EOT loss | ok |
| MUCS 2021 Hinglish | lecture code-switched speech | CC BY-SA [S] | **evaluation only** (share-alike on derived weights is unresolved; counsel) | — |
| MyST | child speech, science tutoring (US) | CC BY-NC-SA free tier; commercial licence purchasable [S] | **evaluation only** (child timing distributions, F1/F5 measurement validity on child voices); never trains a shipped model unless the commercial licence is bought | labelled NC |
| HiACC, ASER, ScAA | Indian child speech / reading | CC BY-NC(-SA) [S] | **evaluation only**: child Hindi acoustics, mic-class and noise robustness of the front-end | labelled NC |
| ITSPOKE (DataShop), Pon-Barry | adult tutoring uncertainty | research use only [S] | **research only**: replicate adult cue effect sizes for the pipeline; never train | — |
| CMU Kids | child read speech | unverified | not used until the licence is read | — |
| Nexdata Hindi child speech (34 h) | commercial purchase | commercial [S] | optional purchase for auxiliary training (filler, VAD on child Hindi); owner decision | — |

The excluded models stay excluded (RP §2.6): MMS (NC), CrisperWhisper (NC), IndicWav2Vec (gated), WavLM weights (share-
alike: offline teacher at most, never shipped). openSMILE features are re-implemented in `dsp.ts`, because its licence
forbids commercial use of extracted features (RS §9).

### 6.2 Synthetic audio: measurement validity only

Built with Azure TTS (allowed under the directive), plus scripted splicing, in `evals/voicesig/synthetic/`. Each set
proves that a feature is **measured** correctly. None proves what a feature **means** (SS §0.8):

| set | what it proves | bar |
|---|---|---|
| SY-1 onset | F1 onset/content-onset error vs a known inserted silence (0.3-6 s), with fillers "umm / aaa / matlab" spliced | median abs error ≤ 40 ms, p95 ≤ 120 ms |
| SY-2 gain invariance | every z feature under ±12 dB gain steps and AGC-like compression (ES-2 analogue) | ΔAUROC proxy 0; z drift ≤ 0.1 |
| SY-3 noise / mic class | features under fan, TV, sibling-speech, street beds at 5-20 dB SNR, and BT codec simulation | `q` falls below 0.5 before error exceeds 2× SY-1 |
| SY-4 echo | the teacher's TTS leaking into R (config R2) during her playback | 0 R frames analysed while `echoRisk = 1` |
| SY-5 language mode | the same sentence in hi / hinglish / en, with code-switch inserted | the langMode key separates them; no F1 shift is attributed to hesitation |
| SY-6 duplex equality | G-VS-DXEQ frame replay | byte-identical `ProsodyFrame` |

### 6.3 Real-child pilot protocol (the owner runs it with families they know)

**Purpose.** This yields the first outcome-labelled child data. It fits the stage-1 calibration (ladder L1), tests
VS-M1, VS-M2 and VS-M6, and gives pre-registered first estimates for VS-A1 to VS-A6.

**Who.**
- **Sample.** 20-40 children aged 9-13 (classes 4-7), aiming for ≥ 12 in each of the 9-10 and 11-13 bands. Mix home
  language (Hindi-dominant, Hinglish, English-medium) and devices (at least 3 phone classes, and at least 5 children
  using a wired or BT headset).
- **Exclusions.** None based on speech. Children with a known speech difference are welcome, flagged with consent, for
  the fairness breakdown.
- **Bias.** The owner's own families are a convenience sample, likely urban and English-heavier. This is named as a
  limitation in every result.

**Ethics and consent.**
- **Before it starts.** Run it under the IEC/counsel review already required for E1 (SS §7.2), with the voicesig
  amendment.
- **Who explains it.** A person, not the tutor.
- **No pressure.** Families can refuse with no social consequence. No payment is tied to performance; a flat thank-you
  is fine.
- **Withdrawal.** A child can stop any session at any moment, by saying "ruko / band karo" or pressing the stop button.
  The session then ends with no follow-up question.
- **Safety.** `scanSafety` runs first on every turn, as in the product. Any safety turn hands off to the floor response.
  If a session raises a safeguarding concern, the research script stops and the safeguarding hand-off runs (Childline
  1098 / Tele-MANAS 14416 on screen to the parent).

**Parent consent text** (draft for the owner. Product copy must be finalised by a person and versioned. It is written
as shapes, not lines for the tutor to say.)

> **Taxila voice study: what we are asking**
> Your child will do three short lessons (about 30 minutes each) with Taxila's AI teacher over about 10 days, on your
> phone at home. The teacher is an AI, and will say so if asked.
> **What we record:** the lesson audio (your child's voice and the teacher's) and the answers. We use it to learn
> whether *how* a child answers (how long they take to start, pauses, speaking pace, loudness) helps a teacher know
> whether an answer is solid or needs a "why?" question.
> **What we do not do:** we do not try to detect emotions or mood. We do not identify your child by voice. Nothing is
> shown to you or your child as a score. Nothing is used for advertising.
> **Where it goes:** audio is encrypted and stored in [India: Microsoft Azure, Central India / South India]. It is
> processed for model training on [Amazon Web Services, Mumbai, India / United States, named exactly] by the Taxila
> team only. Numbers derived from it may be kept to improve Taxila.
> **How long:** audio is deleted at the end of the study plus 90 days. Derived numbers that cannot identify your child
> are kept.
> **Your choices (each separate, each can be withdrawn at any time in Controls → Voice, or by messaging [contact]):**
> ☐ V1 Taxila may analyse how answers are given, on the phone, during lessons
> ☐ V2 Taxila may remember my child's usual answering pace between lessons
> ☐ V3 Record these study lessons, and use the recordings for research and model training as described
> ☐ V4 Use the numbers from lessons (never recordings) to improve how Taxila reads answers
> Saying no to any box does not affect anything else. Withdrawing deletes what has not yet been anonymised within 24 hours.
> Questions or complaints: [name, phone, email]. Notice version: vs-pilot-1.

**Child assent** (read by the parent or a neutral narrator, never in the tutor's voice; shape, in the child's
language):
- you will do some lessons with the AI teacher, and we record them;
- the teacher listens to *how* you answer, so she knows when to give you more time or ask "why?";
- she does not try to guess your feelings;
- you can stop any time, and nothing bad happens;
- do you want to try? (yes / no, recorded)

**Session script** (three sessions; items are drawn from `data/kits/**` with blind-solved keys [T]):

| session | when | content (about 30 min) | ground truth produced |
|---|---|---|---|
| S-A | day 0 | 2 min mic check (device class probe, R-track probe, one read-aloud sentence for the baseline seed); then 4 blocks × 12 items across maths facts and procedures, vocabulary, a science concept and an SST fact, at the child's class. Each item gets an **open spoken answer**. On an IDK, the **recognition probe** (two options) follows immediately. On a wrong answer, the corrective feedback follows, and **the same item comes back** at the end of the block. 1 in 5 items, research only: the "pakka / thoda / guess" tap after answering (VS-M10, never a training target) | verdicts, O2 (recognition), O3 (in-session persistence), F1-F12 |
| S-B | day 2-3 | **delayed retest**: every S-A item again (same surface) + an **isomorphic transfer variant** per item (new numbers or a new context, same skill); 6 fresh items for baseline growth | O1 (delayed + transfer), O3 (delayed persistence) |
| S-C | day 7-10 | **second delayed transfer**: a new transfer variant per skill; 6 fresh items | O1 at a longer lag (primary outcome = success on S-C transfer; S-B as secondary) |

Script rules:
- **Probes that would alter outcomes are off.** The teacher behaves as the product does at L0: signals are logged and
  never acted on. The exception is the scripted recognition probe and the corrective feedback, which are the same for
  every child, so voice cannot change what the child is taught before the outcome is measured. This is the "measure
  before you intervene" design. VS-M5 (the A/B on moves) comes after.
- **Item counts.** About 48 items in S-A, 48 + 48 in S-B, and 24 + 6 in S-C, so about 120-170 graded turns per child.
  With 30 children that is about 3,600-5,000 turns [E].
- **Positives.** If about 60% of first answers are correct and about 25-35% of those fail delayed transfer, there are
  about 500-700 positives for h1 [E].
- **Precision.** The child-clustered 95% CI on AUROC will be about ±0.05-0.07 [E]. **The pilot can therefore establish
  L1 calibration and a go/no-go, but cannot by itself establish the L2 ΔAUROC ≥ 0.03 bar.** L2 needs the flywheel
  (§6.4). This is stated so that pilot coverage is not overclaimed.

**Blind behavioural coding** (evaluation only; never a training target):
- **Coders.** Two coders work from audio with the verdicts, the items' answers and every outcome hidden. They mark
  observable **behaviours** only:
  - speech onset;
  - start of the first content word;
  - filled pauses (type: Hindi "uh / um" classes, lexical "matlab / woh");
  - silent pauses ≥ 250 ms;
  - self-repairs (direction left blank);
  - code-switch points;
  - response type (answer / IDK-recall / IDK-not-known / other);
  - "no attempt" (answered without apparent processing).
- **What they never code.** Any feeling, confidence or state-of-mind label. The coding manual's vocabulary is linted
  like the code.
- **Agreement.** Cohen's κ ≥ 0.7 on response type and no-attempt. Onset agreement is reported as ICC; the bar is
  ≥ 0.9.
- **Uses.** The marks validate the device features (F1, F3, F5 against human marks, VS-A8) and evaluate `rapidGuess`
  (VS-A5). They are never used to train.

**Data handling.**
- Audio is captured on the device under V3, uploaded encrypted to an Azure Storage account in India (container
  `voicesig-pilot`, private, SAS-limited) or to S3 in Mumbai, then deleted at study end + 90 days (a lifecycle rule).
- Features are extracted by the **same production front-end code** (re-run offline over the audio in the evals
  harness), so pilot features equal product features.
- Training rows are features + outcomes. Audio is used only for coding, K3, and re-extraction when the front-end
  changes.

### 6.4 The in-product data flywheel (after the pilot)

1. **Every V1-consented voice turn** produces `kv` (numbers). It is logged in `voice_feature.f` (existing table, lesson
   cascade [T]) with `modelVer`.
2. **Outcomes accrue later.** The scheduler's delayed and woven checks, recognition probes and repeat-wrong detection
   are joined by `(child, skill, item)` in a nightly job (`scripts/voicesig/join-outcomes.mjs`). It runs only over rows
   whose child holds **V4**, and writes a de-identified training table:
   - no child id: the HMAC subject plus a per-refit salt;
   - no text;
   - features, the head inputs (numbers), the verdict and O1-O4.
3. **Monthly refit (K2, CPU).**
   - Per-band temperature and the head are refit on the newest 6 months.
   - Child-clustered CV is run against the §7 bars, and per-child `(a, b)` are recomputed.
   - The new `modelVer` ships only if it beats the old one on held-out children, with no subgroup regression (VS-A6).
   - The ladder level is re-checked (§4.3, demotion included).
4. **Novelty guard.** When the STT, kit set or age mix shifts (e.g. the `asrSource` changes), features keyed to
   `asrSource` are refit separately (SS §2.7). A change that moves any feature's population median by more than 0.3 SD
   triggers a recalibration before the next ladder check.
5. **Rows retained** 24 months, then aggregated. A V4 withdrawal deletes the child's rows from the training table at
   the next nightly run.

---

## 7. Acceptance bars (pre-registered; child-clustered CV; 95% CI unless stated; date-stamped results in `evals/voicesig/results/`)

| id | what | metric | bar | ladder it gates |
|---|---|---|---|---|
| **VS-A1** | added predictive value for delayed transfer | ΔAUROC of (text-only signals + voice) over **text-only signals** (verdict, hedge, IDK type, self-repair, pL, b−θ), on correct answers, target O1 | ≥ 0.03, 80% CI excludes 0 (L2); 95% CI excludes 0 on 2 cohorts (L3) | L2, L3 |
| VS-A2 | fragile vs solid on correct answers | AUROC of h1 alone (voice-only inputs) against O1 | ≥ 0.62, lower bound > 0.55 [U; RS §6.3 expects 0.60-0.70] | L1 for `fragileCorrect` |
| VS-A3 | searching vs absent | AUROC of h2 on IDK turns against O2; and VS-M1's recognition gap (slow IDK_R − fast IDK) | AUROC ≥ 0.70; gap ≥ 0.15 with n ≥ 200 IDK events per band | L1 for `searching`/`absent` routing |
| VS-A4 | calibration | ECE (10 equal-mass bins) of h1..h4 vs outcomes; reliability diagram per band | ≤ 0.08 (L1), ≤ 0.05 (L2) | all |
| VS-A5 | rapid guess | precision of `rapidGuess` vs the coders' "no attempt" mark (evaluation only), and O4 disagreement rate | precision ≥ 0.7; O4 disagreement ≥ 2× base rate | L1 for `rapidGuess` |
| VS-A6 | breakdowns | VS-A1/A2/A3/A4 per **langMode** (hi, hinglish, en), per **mic class** (builtin, wired, bt, speaker_route), per **age band** (9-10, 11-13), gender, home language, speech-difference flag; fire rate per 100 turns per group | per-group AUROC within 0.05 of the pooled value and per-group ECE ≤ 0.08; fire-rate gap ≤ 0.02/100 turns (VS-M8). Failing group → the state is disabled **for that group** (or for everyone, if the feature itself is the cause) | L1+ |
| VS-A7 | held belief | P(O3 \| `heldBelief`) − P(O3 \| other wrong answers) | ≥ 0.15, CI excludes 0 | L1 for `heldBelief` |
| VS-A8 | measurement validity | F1/F3/F5 vs blind coder marks (onset ICC ≥ 0.9; filler recall ≥ 0.6 at ≤ 0.05 FP, VS-M9); SY-1 to SY-5 bars | as stated | L0 → L1 |
| VS-A9 | latency | head p95 ≤ 20 ms on the mid class (VSP-M1 device lab); encoder p95 ≤ 700 ms on the mid class for the 8 s window, else the 3 s window, else prosody-only; **TurnRequest send time unchanged** (p95 delta ≤ 10 ms vs flag off); server adapter p99 ≤ 2 ms | as stated | L0 |
| VS-A10 | duplex non-regression | G-VS-DXEQ byte equality; duplex X1 false-cut rate with `voicesig.frontend` on vs off | equality; ≤ 1 pp | L0 |
| VS-A11 | no reliance on excluded cues | ablation: zero the F0-level/range GRU channel; h1 AUROC drop | ≤ 0.01 (if larger, the GRU leans on pitch level: retrain without it) | L2 |
| VS-A12 | safety and label gates | G-VS-SAFETY: 100% ABSTAIN on 10k generated safety turns and the ES-3 distress set; G-VS-LABEL lint; G-VS-SCHEMA | 100% / pass / pass | every build |
| VS-A13 | teaching effect | VS-M5 A/B: probe on text hedges vs text + voice, same verify budget | delayed accuracy on probed skills +0.03, 80% CI excludes 0; null after 2 cohorts → voice drops to a timing-only role | L3 |

Measurement backlog that carries over unchanged: RS VS-M1 to VS-M10, RP VSP-M1 to VSP-M5, SS SG-M1 to SG-M17. New
here:
- **VS-M11:** R-track availability per browser engine and device class (Chrome Android, Capacitor WebView, Safari iOS),
  with AEC quality on P measured by ERLE on a scripted echo test.
- **VS-M12:** how long a session-only (M0) baseline takes to mature, measured as answers until m ≥ 0.5 per form.

---

## 8. Risks

| # | risk | likelihood / impact | mitigation | detector |
|---|---|---|---|---|
| R1 | **Microsoft reads "uncertainty" as an emotional state** | low-med / high | label test (outcome targets only); no state-of-mind names; the written question to Microsoft (SS O-5, extended with voicesig's outputs and their training targets); E-tier stays at L0 until answered | open item `wb-coc-epistemic-vs-emotional` |
| R2 | **DPDP s.9(3) "behavioural monitoring of children"** covers per-child timing baselines | unknown / high | V2 off by default, session-only works without it; counsel opinion before 13 May 2027 (RP §4.4); V2 shipped only after the opinion | owner/counsel |
| R3 | **The child signal is weak** (cues weaker at 9-10; the per-turn gain is small, ΔR² ≈ 0.02 in LISTEN) | high / medium | voice's main role is choosing cheap moves; the ladder grants weight only on evidence; the age-band factor; VS-M6 can switch the 9-10 band off | VS-A1, VS-M6 |
| R4 | **Pilot too small** for ΔAUROC and a biased convenience sample | high / medium | the pilot gates L1 only; L2/L3 need the flywheel; the bias is named in results; the fairness breakdown runs again on the flywheel | VS-A6 on cohort 2 |
| R5 | **The second track breaks AEC** or is not honoured (WebView, iOS) | medium / medium | R optional per device class; VS-M4(a)/VS-M11 before enabling; intensity cues dropped where R is absent | VS-M11 ERLE |
| R6 | **Phone latency / memory**: an 8.7 MB encoder + 180 MB RSS next to the avatar on 3-4 GB phones | medium / medium | class probe; 3 s window; prosody-only floor; never delays the turn | VSP-M1, VS-A9 |
| R7 | **Hindi prosody confounds**: phrase-level rises, contrastive vowel length, code-switch slowing | high (if ignored) / medium | F0 slope and lengthening excluded from stage 1; langMode key; VS-A11 ablation; VS-M3/VS-M7 | VS-A6 per langMode |
| R8 | **Double counting with `server/signals`** (onset already moves `lrE`) | medium / medium | adapter A2 *replaces* the A1/L4 term; property test: `lrE` with kv present never exceeds the cap | G-VS-NODOUBLE |
| R9 | **Over-probing**: voice fires `fragileCorrect` too often, so the child is asked "why?" constantly, which reads as "you're wrong" | medium / medium | SL-12 budget (1 verify per 4 turns) shared across all states; the probe is "kaise socha?", never "are you sure?" | shadow fire rate ≤ 1 per 8 turns [U] |
| R10 | **Speech differences, accents and shy children** read as `fragileCorrect` or `absent` | medium / high (fairness) | per-child z (not population norms); speech-difference flag breakdown; disable per group; `absent` needs the lexical IDK (T) | VS-A6 |
| R11 | **Identity leakage** through uploaded numbers | low / medium | only 4 audio partial logits + z values leave; VSP-M3 EER ≥ 0.35; no embedding is ever stored | VSP-M3 |
| R12 | **Gaming**: the child learns that a pause earns a hint or an easier move | low-med / low | voice-only states buy only cheap moves (probe, cue), which are not easier; D10 `gaming()` unchanged | shadow drift in onset z by week |
| R13 | **STT change silently shifts the text features** used beside voice | medium / medium | per-`asrSource` keys (SS §2.7); novelty guard §6.4.4 | median shift alarm |
| R14 | **Two front-ends creep back** (duplex or src/voice keep their own tap or session) | medium / medium | G-VS-ONE test; `requestPass` coalescing; the glue file is the only wiring point | G-VS-ONE in CI |
| R15 | **Neon residency (Singapore)** objected to by parents or counsel | low-med / low | named in the V2 notice; the schema is portable to Azure PG South India unchanged | — |
| R16 | **Spend overrun / idle GPU** | low / medium | K1/K2 on CPU; K3 only through `scripts/gpu` (auto-terminate, reaper); `taxila-voicesig` budget action blocks launches at USD 80; Azure ≤ USD 20 | budget alerts |
| R17 | **A shadow emotion arm leaks into the product** | low / high | deferred until K1 reports (RP §4.6); if run at all: AWS only, V3 audio only, files in S3, output reaches nothing, killed if ΔAUC < 0.02; the E1 protocol needs an amendment first | code search: no import from the research arm into `src/`, `server/` |

---

## 9. Build order for this workstream (inside its own scope)

1. `src/voicesig/frontend/**` (two-input worklet, frames, logmel, encoder, bus) + G-VS-ONE / G-VS-DXEQ tests + SY-1 to SY-6
   in `evals/voicesig/synthetic/`.
2. `server/voicesig/{rules,adapter,ladder,baseline,calibrate}.js` (pure; deterministic; no network) + G-VS-LABEL lint
   extension + G-VS-SAFETY property test.
3. `src/voicesig/head.ts` + `types.ts` (stage 0 then 1; stage 2 behind `voicesig.head`).
4. `scripts/voicesig/{join-outcomes.mjs, k1-train.py, k2-refit.py, k3-gpu-job.py}` (the K3 job only through
   `scripts/gpu/run.py`).
5. The migration proposal file and the integration plan (§4.5), handed to the main loop.
6. The pilot kit: consent copy (for a person to finalise), the session script as kit selections, and the coding
   manual. It runs only when the owner decides.

## 10. Proposed context entries (for the main loop to merge into `context/`)

- **decision `vs-voice-major-by-moves`**: voice is a major input to understanding by selecting the next move and routing
  IDKs (FSRS lapse vs pL). Its direct LR on mastery is earned by ladder (L1 [0.9, 1.1] → L3 [0.67, 1.5]); the
  downward pL cap stays 0.03. *Reverse if* VS-A13 shows voice-driven moves give no delayed gain after 2 cohorts, in
  which case voice drops to a timing-only role.
- **decision `vs-one-frontend-two-tracks`**: one worklet with two inputs (processed P for STT/f0/encoder, raw R for
  intensity only), one YIN per hop, one encoder session; duplex is fed through `EngineHost.frame` / `estimate`. *Reverse
  if* VS-M11 shows R degrades AEC on a device class (R off for that class), or if f0 on R beats P on VS-A8.
- **decision `vs-outcome-targets-only`**: every head is trained on O1-O4; coder labels evaluate, never train. *Reverse
  if* never: this is the restriction-12 guard (RP §4.2).
- **decision `vs-no-server-audio-fallback`**: a device too slow for the encoder runs prosody-only; mel is never
  uploaded. *Reverse if* VSP-M3 shows a representation with EER ≥ 0.35 that also carries VS-A1 value, and the owner
  accepts the upload.
- **measurement (pending)**: VS-A1 to VS-A13 with n, method and date when run.

