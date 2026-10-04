# Duplex runtime: the Wave 2.5 integration plan (exact W2 files and what each one gets)

2026-10-04 · runtime workstream · status: **plan only**. No Wave 2 file was edited by this workstream.
Companion to `ARCHITECTURE.md` v2 (§11 seams S1-S15, §11.3 rollout). The runtime this plan wires in is built and tested
under the duplex paths only:

| layer | file | what it is |
|---|---|---|
| contract | `src/duplex/engine.ts` | `EngineTick` → `EngineDecision`, `DuplexEngine` (types only) |
| device host | `src/duplex/host.ts` | the tick loop: frames, STT events, her playback, screen, context, estimates, 100 ms timer → governed commands |
| governor | `src/duplex/governor.ts` | FloorPhase state machine + vetoes G1-G11 (safety, barrier, hold, legality, horizon, cut-in list, verdict, rate, WT1, backstop, her floor) |
| stage A | `src/duplex/engineRules.ts` | the rules estimator + policy + PrepareHint (draft / warm / STT probe / build intent) |
| stage B seam | `src/duplex/adapter.ts` | `createEngine()`: stage A now; `TrainedEngine` + `loadOnnxFloorModel()` when `flags.trained` and a model exist |
| perception | `src/duplex/audio.ts`, `markers.ts`, `form.ts`, `overlap.ts`, `features.ts` | child audio + prosody, lexical markers, answer-form grammar, overlap classifier, feature vector `cce-features/1` |
| face | `src/duplex/face.ts` | governed decisions → avatar cues (seam S7) and the shipped `Floor` (seam S11) |
| server slice | `server/duplex/slice.js`, `routes.js`, `fanin.js`, `echo.js`, `partialSafety.js`, `speculator.js`, `buildIntent.js` | partials fan-in, echo subtraction, sticky safety (server authority), speculation + TTS warm-up, build intents, `/api/duplex/*` |
| measurement | `evals/duplex/tick-sim.mjs` → `results/tick-sim-2026-10-04.json` | M-D7, the runtime at tick level vs cascade-900 and silence-640 |
| tests | `tests/duplex-runtime.test.mjs` | 41 tests: hands-free host, every governor veto, stage A, overlap, face, adapter, fan-in, echo, safety, speculator, builds, slice, routes |

Everything below is **additive and behind a flag**; with every flag off the shipped lesson behaves byte-for-byte as today.

---

## 0. Order of work (each step ships alone, each has a pass bar)

| step | flag (`src/lesson/voiceFlags.ts`) | files touched (owner) | pass bar before the next step |
|---|---|---|---|
| W2.5-1 | `duplex.slice` | `server/index.js` (router) | `/api/duplex/*` answer 401 without auth, 200 with; `npm test` green |
| W2.5-2 | `duplex.partialSafety` | `server/brain/turn.js`, `shared/contracts.ts` (W2-E) | v1 D2: a distress partial whose final is revised clean still yields the rank-0 safeguard (battery) |
| W2.5-3 | `duplex.heardUpTo` | `src/lesson/ttsStream.ts` (S14), `src/lesson/cascadeLink.ts` | X5: heardUpTo within one word of the audible position on ≥ 90 % of yields |
| W2.5-4 | `duplex.engine = shadow` | `src/lesson/cascadeLink.ts` (S10), `src/lesson/runtime.ts` | TaxilaFDB L2 meets A2/A3/A8/A10; the shadow disagreement log reviewed; 0 safety disagreements |
| W2.5-5 | `duplex.engine = on` (closed answers, India lane) | `cascadeLink.ts`, `floor.ts` (S11), `src/child/lesson/TalkButton.tsx`, `LessonScreen.tsx` | A1 at L3 on real audio (DX-2); A2; A8 |
| W2.5-6 | `duplex.engine = on` (open contexts) + semantic | `server/duplex/semantic.js` (new, duplex path), W2-C `persona/adapter.js` (S6) | A2 on F2 (thinking pauses) ≤ silence-640 on the same audio |
| W2.5-7 | `duplex.overlap` | `cascadeLink.ts` | A4/A5/A6/A15 (yield latency, continuer keep-talking, echo) |
| W2.5-8 | `duplex.listeningFace` | `src/avatar/behaviour.ts` (S7) | A7 visual; one nod producer |
| W2.5-9 | `duplex.cutIn` | W2-C Director moves (S12) | A9 |
| W2.5-10 | `duplex.engineTrained` | none outside duplex paths (`models/duplex/*.onnx` + flag) | ARCHITECTURE §5.5 gates |

---

## 1. `server/index.js` — register the slice (S1)

```js
import { createDuplexRoutes } from "./duplex/routes.js";
import { lessonForVoice } from "./routes/voice.js";        // export the existing lessonFor + core_tutoring check
// …
register({ ...lesson, ..., ...lane, ...createDuplexRoutes({
  authorize: lessonForVoice,                               // (req, lessonId) → { lessonId } or throws 401/403
  serverCtx: duplexItemContext,                            // (lessonId, itemId) → { codeGradable, outcomes, misconceptionValues, misconceptionIds, topicTerms, answerForm, beat }
  launchDraft: azureLauncher,                              // server/duplex/launch.js (keyed generations; hash-promoted)
  launchWarm: ttsWarmLauncher,                             // DragonHD synth of the uptake into a held buffer (never audible unless promoted)
  launchBuild: studioPrefetch,                             // W2-H prefetch keys only (S13)
  source: "mai_stream",
}) });
```

- `server/routes/voice.js`: export `lessonFor` wrapped with the `core_tutoring` consent check (the same two lines the voice
  routes already run) as `lessonForVoice`. One line of export, no behaviour change.
- `duplexItemContext` lives in `server/duplex/` (new file, duplex path) and reads the kit item the lesson is on; it is the
  only place misconception values enter, and nothing it returns is ever sent to the device.

## 2. `shared/contracts.ts` + `server/brain/turn.js` — the turn carries the duplex summary (S2, W2-E)

`TurnRequest` gains one optional field (additive):

```ts
duplex?: {
  transcriptHash: string;          // FNV-1a of the turn text the engine decided on (fanin textHash)
  genId?: string | null;           // the promoted speculative generation (slice.speak → genId)
  safetyPending?: { kind: "self_harm" | "abuse" | "fear" | null; source: "predicate" | "model_note" } | null;
  superseded?: string[];           // generations voided by a revoke (never graded, never shown)
  heardUpTo?: { chars: number; words: number; ms: number } | null;
  cutInReason?: "safety" | "word_search_cue" | "off_task_drift" | "question_to_her" | "hold_offer" | null;
  engineSummary?: { engine: string; reasons: string[]; pComplete: number[]; decidedAfterEndMs: number | null } | null; // no words
};
```

`server/brain/turn.js` (`lessonTurn`):
1. `safetyPending` set → rank 0 safeguard **even if `childText` now reads clean** (v1 law 5). Before `planTurn`.
2. `genId` set and its `transcriptHash` equals the hash of `childText` → serve the held generation (no second Director
   call); otherwise ignore it (lexical identity only, `cascade-speculative-reply`).
3. `superseded` ids → never graded, never written as a verdict row.
4. `heardUpTo` → trim her last turn in history to what was audible (S3).
5. `cutInReason` → the Director's move map (S12): `word_search_cue → offer_cue` (never the target term),
   `off_task_drift → redirect_with_uptake`, `question_to_her → answer`, `hold_offer → offer_choice`, `safety → safeguard`.
6. Trace row: `engineSummary` stored as numbers and codes only (`w2e-brain-trace`: no child words).

## 3. `src/lesson/cascadeLink.ts` — the engine host adapter (S10, the main seam)

This is where the duplex runtime meets the live audio. Today `CascadeLink` (a) turns every STT final into a child turn
(through `FragmentMerger` when `turn.predictive` is on), (b) pauses her on a local VAD onset and lets the transcript
decide, (c) supports push-to-talk. Under `duplex.engine` the decision moves to `EngineHost`:

| today (`cascadeLink.ts`) | with `duplex.engine = shadow` | with `duplex.engine = on` |
|---|---|---|
| `setupAudio` / mic graph | also tee the feature worklet's 20 ms frames (`src/voice/featureWorklet.ts`: RMS + YIN f0) into `host.frame(t, rms, f0)` | same |
| `TranscriptionProtocol.handle` deltas / completed | also `host.stt({ type:"partial", delta:true, … })` / `host.stt({ type:"final", … })` with `audioStartMs` from `speech_started.audio_start_ms` | same |
| server VAD `silence_duration_ms` 900 (`realtime.ts DEFAULT_TURN_DETECTION`) | unchanged | **1,500 ms**: server VAD becomes the backstop only; the engine decides |
| `onChildEvent` → `deliverChild(final)` = a turn | unchanged; host logs what it *would* do | **a final is not a turn.** The turn is committed only on `{to:"voice", op:"speak"|"cut_in"}`: `runtime.commitChild({ text, textHash, uptake, verdictNotBefore, duplex: slice summary })` |
| local VAD onset → `player.duck(0.2)`, sustained → pause | unchanged | host emits `duck` / `unduck` / `yield{atWordBoundary, resumable, heardUpTo}` / `resume`; the link obeys (`player.duck`, `player.stopAtWordBoundary`, `player.resumeFrom(heardUpTo)`) |
| `isBackchannel` / `isEcho` verdict on the final | unchanged | superseded by the overlap classifier + `EchoSubtractor` (both reuse `skeleton()` from this file) |
| `input_audio_buffer.commit` only on push-to-talk release | — | also on `{to:"stt", op:"commit"}` (the micro-commit probe) |
| her playback | `host.herEvent({kind:"start", words: ttsWordTimings, act, handsOver})`, `verdict`, `end`, `stopped` from the player clock (S14) | same |
| — | `{to:"think", …}` → `POST /api/duplex/handover | prepare | speak` (debounced to changes; `prepare` only on hint change) | same |
| — | `{to:"log"}` → telemetry (S15), consent-gated, numbers + codes only | same |

New code is a thin adapter class (`DuplexBridge`) that can live in `src/duplex/bridge.ts` (duplex path) and be
constructed by `CascadeLink` behind the flag; the edits inside `cascadeLink.ts` are then: construct it, tee frames and
protocol events into it, and replace the three decision points above with `if (this.duplex?.on) { … obey … } else { … today … }`.

**Hands-free, full-session (owner-always-listen-full-session-2026-10-04).** Under `duplex.engine = on` the link is
hands-free for the whole lesson: `setPushToTalk(false)` and never re-enabled by the UI; `talkStart` / `talkEnd` are
reachable only on the `recording` transport (no transcription call: WebRTC blocked) and the `typed` transport. The duplex
modules themselves have no press / release API at all (asserted by `tests/duplex-runtime.test.mjs`).

## 4. `src/lesson/ttsStream.ts` — her playback clock and word boundaries (S14)

- Emit `{ type: "her_words", utteranceId, words: [{w, startMs, endMs}] }` mapped to the session audio clock from the
  DragonHD / Azure word-boundary events (fall back to `estimateWords(text, start, 70 ms/char)` from `host.ts` when absent).
- Emit `{ type: "her_verdict" }` when the verdict-bearing segment starts. The reply arrives split by S5 into
  `uptake | bridge | verdict`; the player **holds the verdict segment until `verdictNotBefore`** (fast mouth, late verdict:
  `VERDICT.delayMs` = 2.0 s after the child's last value, M-D7). Nothing else in the player changes.
- Expose `stopAtWordBoundary()` (≤ 50 ms) and `resumeFrom(heardUpTo)` (the existing `heardPos()` anchor is the base).

## 5. `src/lesson/floor.ts` — FloorPhase → the shipped floor (S11)

`face.ts shippedFloor()` is the mapping (her_turn→speaking, overlap→listening, committed→thinking, handover→your_turn,
child_turn→listening, hold_requested→listening, safety_attend→listening, idle→idle). `FloorController` gets one input
`{ type: "duplex_phase", floor }` that sets the floor directly while `duplex.engine = on` and **suspends its own nudge
timer in `hold_requested`** (the governor's G3 owns the 8 s check-in and 15 s offer).

## 6. `src/child/lesson/**` (W2-B UI) — remove the talk-button assumption

- `TalkButton.tsx`: render only when `link.transport !== "webrtc"` (the recording / typed fallbacks). Under
  `duplex.engine = on` with the hands-free call up there is **no talk button**; the mic is open all session and the
  status word comes from the governed floor.
- `LessonScreen.tsx` / `useDesk.ts`: subscribe to `{to:"face"}` cues (S7) for the teacher window and to the duplex floor for
  `StateWord.tsx`; the caption shows the child's echo-subtracted text (never her own words looping back).
- `headset.ts`: when no confirmed echo canceller is present (speakers, no AEC), keep `allowAudioBackchannel = false` and
  raise the overlap echo prior (`echoLikelihood` floor 0.3) — the engine stays visual-only.

## 7. W2-C `server/persona/adapter.js` + `shared/contracts.ts UiDirectives` — the engine context (S6)

`UiDirectives.engine?: EngineContext` (`src/duplex/engine.ts`): `{ exchange, expected: { form, slots, units?, options? },
questionType, beat, band, lang, weakerLanguage, wt1: { faceMs, voiceMs }, cutIn: { wordSearchCue, offTaskMs },
allowLexicalBackchannel, allowAudioBackchannel, itemId }`. **The form, never the key** (`duplex-verdict-blind-timing`):
`expected.form` comes from the kit item's answer type (integer / fraction / decimal / number_unit / yes_no / choice / word /
phrase / open); `options` are the labels already on screen. The device calls `host.context(ui.engine, t)` at each hand-over.

## 8. `src/avatar/behaviour.ts` — the listening face (S7)

Public `listenerNod(peakDeg)`, `holdPose()`, `stillWithYou()`, `checkinLook()`, `calmAttend()`, `yourTurnEmphasis()`.
`face.ts` emits `{kind:"pose"|"nod"|"clip"}`; one producer owns nods (Puppet2D's mic-level listener nods are switched off
under `duplex.listeningFace`). Floor behaviours only: never `teacherAffect`, never keyed to correctness (TB6).

## 9. W2-E `server/brain/moment.js` + `replyKey` (S5, S8)

- The reply plan for a closed item opens verdict-free: the uptake (the child's own value re-voiced, built in code by
  `host.uptakeOf`) and a bridge **shape** (not a stock line: sentence-shaped prompt text gets recited), then the verdict
  segment marked for the player (§4).
- `uptakePrelude` may name the warm buffer id the slice already synthesised (`speculator.onSpeak().warm`).

## 10. W2-H Studio seam (S13)

`slice.drainReveals(phase)` now accepts the v2 `FloorPhase` (turn boundaries: her_turn, committed, handover). Build
intents from partials (`buildIntent.js`: misconception value, curiosity term, aid request, device hint) are prefetch only;
a reveal waits for the kernel at the next boundary.

---

## 11. What the runtime does NOT yet cover (and where it would land)

| gap | why it matters | where |
|---|---|---|
| semantic estimate call (`server/duplex/semantic.js`) | open explanations end only by backstop (~2.0 s) until a fresh semantic read lifts the stage-A cap | duplex path; host already calls `opts.semantic` |
| real echo on speakers | the sim carries no echo; `EchoSubtractor` is unit-tested only | DX-7 on recorded sessions |
| acoustic repair-request ("क्या?") | the synthetic rising contour is too flat on one short word, so the acoustic rule is not exercised (M-D7 i04 yields on words) | real audio, DX-5 |
| draft churn on the fast lane | 62.6 % of speculative tokens wasted on `cce-fast` (frequent relaunch as words land) | raise `PREPARE_CAPS.minNewWords` / debounce after DX-4 |
| trained stage B | `adapter.ts` is ready; no model exists | `scripts/duplex/**`, `models/duplex/**` |
