# voicesig integration plan: exact call sites (2026-10-04)

This plan wires the voicesig build (`src/voicesig/**`, `server/voicesig/**`) into files this workstream may not edit.
Every step is a proposal for that file's owner. Line numbers are from the tree on 2026-10-04 (after Wave 2's BR1 and
before BR2), so re-check them before applying. Everything ships **shadow-only**: `server/voicesig/ladder.js` puts every
state at L0, so no step below changes what a child is taught until a state earns L1 with a measurement.

## As shipped in ship5 (2026-10-06): this plan is superseded by the patch set

The A1-A7 steps below were the 2026-10-04 proposal. The owner directive `owner-ship-five-2026-10-05` (ship it, ON by
default, kill switch, old path as fallback) replaced them with one seam module and eleven patches against HEAD 8006902.
Apply order, switches and the test that proves each patch: `docs/design/ship5/p3-voicesig/APPLY.md`.

| was | now |
|---|---|
| A1/A2 signals-layer wiring | not needed: `server/voicesig/lesson.js` `turn()` reads kv + transcript + grader verdict and hands the Director, comprehension and pace consumers the existing tie-breaker vocabulary (`followUpProbe` / `gentlerHint` / `slowerPace`) through `planCtx.voice`, only for a LIVE state (patch 03) |
| A3 validator precondition | unchanged: kv rides top-level on `TurnRequest.voiceFeatures.kv` (patch 01 types it) |
| A4 baselines at start / end | patch 04 (`startRows` / `endSave`), patch 07 = migration `db/migrations/021_voicesig.sql` (the proposal SQL, numbered), patch 05 = the parent toggle `voice_pace_memory` (off by default; withdrawal deletes at once), patch 11 = the worker consent sweep |
| A5 `src/lesson/frontendGlue.ts` | `src/voicesig/lessonTap.ts` (ONE tap per lesson, reference-counted; duplex's `src/duplex/liveTap.ts` takes frames from it) + `src/voicesig/lessonFeatures.ts` (patch 09 adds `VoiceFeatures.attachFrames`, patch 10 makes it the runtime default with `VoiceFeatures` as the fallback) |
| A6 kv on the request | inside `VoicesigLessonFeatures` (kv is attached to the same utterance object the turn POST already carries; never delays the turn) |
| A7 comprehension | the probe-gap path already reads `voice.followUpProbe`; nothing new |
| the filler detector runtime | patch 08: `onnxruntime-web` 1.30.0 (owner-approved), WASM single thread, same-origin assets, lazy, skipped on Save-Data / 2G |
| status page | `GET /api/voicesig/status` (patch 06): per state population / precision / CI / recall / n / method / date and why it is shadow |

Every state is shadow today: no state has a precision measured on children, and `server/voicesig/gate.js` lets only a
children-population precision >= 0.80 (n fired >= 100, ladder L1, `TAXILA_VOICESIG=on`) open the gate.

## What exists now (built and tested here)

| piece | file | status |
|---|---|---|
| two-input worklet `taxila-tap2` (P processed, R raw) | `src/voicesig/frontend/tapWorklet.ts` | P is sample-identical to `taxila-feature-tap` (test) |
| per-hop frames: one `FrameAnalyzer` push per chunk, plus R RMS | `src/voicesig/frontend/frames.ts` | byte-identical to `dsp.ts` (test) |
| log-mel ring (Whisper constants, 8 s) | `src/voicesig/frontend/logmel.ts` | streaming = batch (test) |
| `AudioFrontEnd` + browser attach + raw-track opener | `src/voicesig/frontend/bus.ts` | refuses a second front-end per tab |
| single encoder session (ORT injected) + `requestPass` coalescing | `src/voicesig/frontend/encoder.ts`, `bus.ts` | one pass per turnSeq (test) |
| GRU input vector + filler runs | `src/voicesig/frontend/gruInput.ts` | used offline for training, so features are identical |
| per-turn measurements, device quality | `src/voicesig/turn.ts` | SY-1 onset, SY-2 gain (tests) |
| device head → `KnowledgeVoice` | `src/voicesig/head.ts` | stage 0, plus the filler detector when loaded |
| filler detector | `models/voicesig/filler-gru.onnx` (+ `.json` card) | AMI-trained; metrics in `evals/voicesig/results/2026-10-04/` |
| adapter, rules, ladder, calibration, baseline | `server/voicesig/*.js` | pure; G-VS-SAFETY 10k, G-VS-NODOUBLE (tests) |
| harness, metrics, simulator, K1 trainer | `evals/voicesig/*.mjs`, `scripts/voicesig/k1-train.mjs` | runs on simulated rows today |
| migration proposal | `docs/design/voice-signals/migration-proposal.sql` | not applied |

## Order (the server accepts a field before the client sends it)

**A3 → A1 → A2 → A6 → A5 → A4 → A7.** One measured fact changes the risk of getting this order wrong. Today
`validateUtterance` ignores an unknown top-level key, so a `voiceFeatures.kv` sent early is dropped, not rejected with a
400 (test "A3 precondition"). The same fields placed inside `voiceFeatures.features` **would** get a 400. kv must never
go there.

### A3: `server/voice/features.js` (voice owner)
- In `validateUtterance` (line 96), after the `features` loop, add:
  `const kv = u.kv == null ? null : validateKv(u.kv)` (import from `../voicesig/adapter.js`).
  - Return `kv` in the record.
  - An invalid kv becomes `null`, never a 400: features are tie-breakers.
- In `turnVoice` (line 288), return `{ ...out, kv: u.kv }`, so the turn handler gets this utterance's kv.
- Do **not** store kv in `voice_feature.f`. Store only the numbers in `kv.f` that are already allowlisted. The
  in-product join (SPEC §6.4) reads them back under V4.

### A1: `shared/signals.ts` (main loop)
- `SignalInput.voice` gets `kv?: KnowledgeVoice` (from `src/voicesig/types.ts`) and `vsb?: Record<string, {n, nTotal, mean, m2}>`.
  `vsb` holds the session's voicesig baseline rows, which live in `lesson.state.vsb`: about 20 rows (about 1.2 KB) per
  lesson.
- `SignalInput` gets `ageBand?: "9-10" | "11-13"`. Derive it from the class: class ≤ 5 → `9-10`.
- `SignalFrame` gets `vs?: { state, licence, lrV, lrVApplied, shadow, cap, h, reasons }`.
- Rename `unsureCorrect` → `fragileCorrect` in `SIG_STATES`, and keep `unsureCorrect` as a one-release alias.
  `tests/signals-lint.test.mjs` already passes both names.

### A2: `server/signals/index.js` + `states.js` + `tests/signals-lint.test.mjs` (signals owner)
- **Lint.** In `signals-lint.test.mjs` G-SIG-PURE, allow imports of `server/voicesig/adapter.js` (one line, beside
  `server/learner/affect.js`). The adapter, rules, ladder and calibration are pure: no clock, env, network or DB.
  `tests/voicesig.test.mjs` "boundaries" checks they do not import signals. A reverse-direction purity test is added
  below.
- **`index.js` `step()`.** Insert this after `const q = quality(input, L);` (line ~110) and after the item block that
  computes `repeatWrong`. Safety has already returned ABSTAIN above, so kv is never computed on a safety turn.
  ```js
  const vs = input.voice?.kv ? toSignalInput(input.voice.kv, {
    verdict, safety: false, words: L.words, o3History: repeatWrong,
    ling: { idk: L.idk?.v ?? null, hedge: L.hedge, fillerLex: L.fillerLead?.v === true, toks: L.toks, repairDir: L.repairDir, thinkAloud: !!L.thinkAloudLex },
    context: input.item?.form === "read_aloud" ? "read_aloud" : "answer", form: input.item?.form ?? "number",
    langMode: L.langMode ?? input.langModeHint, ageBand: input.ageBand, baseline: new VsBaseline(input.voice.vsb ?? {}),
    qSignals: q.acoustic, deltaFitted: !!input.deltaFitted, deltaZ: input.delta && input.voice?.baseline?.onsetMs?.sd ? input.delta / input.voice.baseline.onsetMs.sd : 0,
    mode: input.vsMode ?? "off",
  }) : null;
  ```
  - Pass `vs` into `derive` as `F.vs`.
  - After `derive`, set `frame.vs = vs && { ...pick(vs) }`, and push `vs.reasons` onto `frame.reasons`.
  - The caller updates `lesson.state.vsb` with `updateBaseline(...)` after the turn, so a turn is never scored against
    itself.
- **`states.js` D1 (lines 34-50).** When `F.vs && F.vs.stage >= 0 && !F.vs.shadow`:
  - skip the `A1` / `L4` block;
  - set `lrE = replaceTimingTerm(1, F.vs.lrVApplied, [Math.max(LR_CLIP[0], F.vs.cap[0]), Math.min(LR_CLIP[1], F.vs.cap[1])])`;
  - `why` gets `V1` (`fluentRecall` / `fragileCorrect`) or `V3` (`heldBelief`).

  In shadow (every state today), D1 is unchanged and only the reason codes are added. This is the replacement rule:
  voice never multiplies with the onset term (G-VS-NODOUBLE).
- **D2.** `eVerify ||= F.vs?.state === "fragileCorrect" && F.vs.licence !== "none" && !F.vs.shadow`. It shares the
  SL-12 budget unchanged.
- **D4.** If `F.vs?.state === "searching"`, keep `recallCue` and add reason `vs:searching:*`. If voice and the lexical IDK
  disagree, the adapter already returned `state: null`.
- **D10.** If `F.vs?.state === "rapidGuess" && !F.vs.shadow`, set `frame.evidenceDiscount = 0.5` (the same value as
  D10).
- **Env.** `TAXILA_VOICESIG = off | shadow | on`. The turn handler reads it (`vsMode(process.env)`) and passes it as
  `input.vsMode`. The signals layer never reads env.

- **`toks` is required (verify pass 2026-10-04).** server/signals' `fillerLead` counts `haan`, `ji`, `ok`, `achha` as
  planning fillers, so `readText("haan ji, paanch").fillerLead.v === true`, measured. With `toks` present, the adapter
  replaces `fillerLex` with `rules.fillerLexOf(toks)`, which skips deference and acknowledgement tokens. The same defect
  feeds SIGNALS D1 L4 (`states.js` line 48), which this workstream may not edit. **Proposal A2b** (signals owner): remove
  `haan, han, ji, ok, okay, achha, acha, accha, हां` from `PLANNING` in `lexicon/discourse.js`, or treat them as skippable
  like `STOP`, and add the "haan ji, paanch" case to the signals tests.
- **Privacy (verify pass).** `frame.vs` and the `vs:*` reason codes go to the trace row only. They must never reach a
  prompt (`server/brain/**` compile), the child, a parent payload (`server/routes/parent.js`, `server/comprehension/report/**`)
  or a stored learner profile, at any ladder level. Today server/signals has no caller in `server/`, so nothing leaks yet.
  The step that wires signals into the brain must add a test asserting that no `vs:` string appears in any compiled prompt
  or parent payload.

### A6: kv on the turn request: `src/lesson/runtime.ts` (link owner; not `src/child/lesson/**`)
- Line 584, in the `child_final` case. Before `queueTurn`, start `head.commit({ fromT, toT, teacherEndAt, words, langMode, micClass })`:
  - `fromT` / `toT` are the same window `UtteranceTracker.finalize` used;
  - `teacherEndAt` is the tracker's.
- Race the commit against `HEAD_BUDGET_MS` (20 ms). If it resolves in time, set `voice.kv = kv`. If not, send the turn
  without kv. **The turn is never delayed** (SPEC §3.4, VS-A9).
- Line 698 already copies `input.voiceFeatures` onto `req.voiceFeatures`. kv rides inside it with no further change.

### A5: the shared front-end in the lesson: `src/lesson/frontendGlue.ts` (new) + `src/voice/features.ts` (+25 lines)
- `runtime.ts` `startVoiceFeatures` (line 505). With flag `voicesig.frontend` on, call
  `attachFrontEnd({ ctx: tap.ctx, stream: tap.stream, workletUrl, raw: flags.voicesigRawTrack, herAudible, toClock })`
  instead of `vf.attachTap`:
  - `workletUrl` comes from `import u from "../voicesig/frontend/tapWorklet.ts?worker&url"`;
  - `toClock = (ct) => Date.now() - Math.max(0, ctx.currentTime - ct) * 1000 - inputLatencyMs`, the same formula as
    `VoiceFeatures.onChunk`, so src/voice's onset clock is unchanged;
  - `herAudible = (t) => teacherMeter >= TEACHER_AUDIBLE || echoRisk`.
- `src/voice/features.ts` gets `attachFrames(fe: AudioFrontEnd)`. It subscribes
  `fe.onFrame(f => this.tracker.addFrames([{ t: f.t, rmsDb: f.rmsDb, f0: f.f0, speech: f.speech }]))` and never creates
  its own `taxila-feature-tap`. Exactly one tap exists (G-VS-ONE).
- `new VoicesigHead(fe, { filler })`. Load `filler` lazily after the first teacher turn with `loadFillerModel(ort, url, thr, ver)`:
  - `ort` comes from a dynamic `import("onnxruntime-web")`, which needs a new dependency: an owner decision;
  - `thr` is from `models/voicesig/filler-gru.json`.
- **Duplex, when it is wired into the lesson.** Today `EngineHost` has no caller outside `src/duplex/`, so the glue is
  written for the day it gets one. It goes in `frontendGlue.ts`; no `src/duplex/**` file changes.
  ```ts
  fe.onFrame((f) => host.frame(f.t, Math.pow(10, f.rmsDb / 20), f.f0));
  fe.onEncoderPass((p) => host.estimate({ acoustic: { atMs: p.t, pComplete: p.logits[0], model: "smart-turn-v3.2", computeMs: p.computeMs } }, p.t));
  // duplex's candidate end and voicesig's commit both call fe.requestPass(turnSeq, t): one pass per turn
  ```
  `ChildAudioTracker` fed this way equals the old path on every frame (test G-VS-DXEQ (duplex)). The duplex owner should
  re-run its own X1 false-cut battery with the flag on (VS-A10, second half).

### A4: baselines at lesson start / end: `server/routes/lesson.js` (Wave 2)
- `start` (line 140). If the child holds V2 (consent purpose `voice_pace_memory`, the latest row granted):
  - `const { baseline } = await loadBaseline(q, { childId, key: VOICESIG_SUBJECT_KEY, v2: true })`;
  - `state.vsb = baseline.rows`.

  Without V2, `state.vsb = {}`, so the baseline is session-only.
- `end` (line 444). `await saveBaseline(q, { childId, key, v2, band, consentVer }, new VsBaseline(state.vsb))`. It runs
  off the reply path in `seamSafe`.
- Withdrawing V2 calls `withdraw(q, …)` synchronously from the Controls action.
- Consent purposes go in the existing `consent` table (`001_core.sql`, free-text `purpose`):
  - V1 `voice_analysis`;
  - V2 `voice_pace_memory`;
  - V3 `audio_research` (already listed);
  - V4 `voice_numbers_improve`.
- New secret `VOICESIG_SUBJECT_KEY` (at least 32 random bytes), stored in `.env.local` and the Container Apps secret
  store. Never logged.
- Apply `migration-proposal.sql` as the next allotted number, on the Neon test branch first.

### A7: `server/comprehension/*` (comprehension owner)
- `searching` confirmed by O2 (the recognition probe was answered correctly): log an FSRS lapse on the card. pL is not
  lowered. If the probe fails, the turn is a normal not-yet.
- `heldBelief` with T agreement: open a misconception facet and book a delayed re-check.
- Both behind `TAXILA_SIGNALS_EVIDENCE` and the ladder (shadow → reason codes only).

## Verification after each step
- `npx tsc -b && npx vite build && npm test`. `tests/voicesig.test.mjs` carries G-VS-ONE, G-VS-DXEQ, G-VS-SAFETY,
  G-VS-LABEL, G-VS-SCHEMA, G-VS-NODOUBLE and the A3 precondition.
- After A2: `node evals/voicesig/harness.mjs <rows>` on any recorded shadow lesson export. Every safety row abstains,
  and the state fire rate per 100 turns is printed.
- After A6: compare TurnRequest send time with the flag on vs off. VS-A9 requires a p95 delta ≤ 10 ms.
