# Voice audit: proposals for the owner (2026-11-10)

From `docs/design/round7/audit/voice.md`. These are the items main held or that need an owner decision. Nothing here is built.

## 1. Expressive voice delivery is now off by default (V-27): please confirm

**What the child hears now.** Until this change, every DragonHD reply was read through the "expressive" plan: planned pauses, slower clauses, a lower pitch on calm lines. Now she reads the plain line, as the fallback voice always did.

**Why.** Project memory disagreed with itself. `context/rejected.md` (`rj-ssml-delivery-plan-2026-10-04`) records a listening test where people scored the planned delivery lower than the plain line (2.10 vs 2.40; "choppy", "slow"), yet the code had it on by default. Main decided to make the default match the rejection.

**Your call.** Keep it off, or run the blind listen that was planned (about 20 lines, plain vs planned, children's lessons) and switch it back on if planned wins. Switch: `TAXILA_VOICE_EXPRESSIVE=1` on the Container App, no rebuild.

**Cost.** None to keep it off. The listen costs a few minutes of speech synthesis and an hour of someone's ears.

## 2. The realtime lane (V-36): what removing it would take

**What a child sees now.** Nothing. Every spoken lesson starts as "cascade" (`src/child/lesson/useDesk.ts`). Only the dev page can start the realtime lane, and production builds drop that page. Its code still ships in the app bundle, and `src/lesson/runtime.ts` still defaults to it when nothing else is said.

**Proposal.** Main decided not to delete it now. If you retire it later:

- **Would go:** `src/lesson/voiceLink.ts`, `realtime.ts`, `ledger.ts`, `voiceFlags.ts`; in `runtime.ts` the lane switch, its rate-limit and reply-filter code; `POST /api/realtime/token` and `POST /api/lesson/lane`; `server/voice/realtimeSession.js`; `server/voice/expressive/compile/realtime.js`; the realtime panel in `src/pages/LessonDev.tsx`.
- **Depends on it and would need changing first:** `tests/client-runtime.test.mjs`, `w2d-voice-lanes.test.mjs`, `safety-r4-realtime-filter.test.mjs` (a safety test: frozen until the safety phase), `pair-scope.test.mjs`, `round3-integration.test.mjs`, `w2-seams.test.mjs`, two files in `tests/prod/`, `tests/client-e2e.mjs`; about 29 tests that start a lesson as "voice" through fake links; `scripts/live-probes.mjs`, `scripts/check-prompt-budget.mjs`; five realtime evals; `server/pair/scope.js` and `server/brain/turn.js` (Brain); and the `context/` entries on the lane switch, the `gpt-realtime` measurements, `meera-realtime-azure` and `rj-realtime-default-at-current-quota`.
- **Smallest first step:** make `runtime.ts` default to cascade, so the realtime lane can only start when asked for by name.

**Cost.** About a day of careful work across four streams (voice, brain, platform, tests), mostly test rewiring. The safety test means it is best done in the safety phase.

## 3. The old server duplex modules (V-37): not deleted, and why

The report listed fifteen `server/duplex` modules with no live importer. Checked again under the deletion rule, every one is still read by something that the rule says to keep:

- `registry.js` is imported by `server/brain/turn.js` (Brain's file). `registry.sliceFor` always returns null, so that call does nothing, but removing it needs a Brain patch.
- `slice.js` is imported by `tests/safety-robust-seams.test.mjs`, a safety test (frozen until the safety phase). `index.js`, `routes.js`, `speculator.js`, `drafts.js`, `buildIntent.js` and `triage.js` hang off it.
- `floorManager.js` with `eot.js`, `backchannel.js`, `ear.js` and `bargein.js` is the v1 floor manager that `context/rejected.md` freezes as the TaxilaFDB baseline B3, run by `evals/duplex/harness.mjs`.
- `semantic.js` is cited in `context/` as the open stage-A semantic arm, with measurements.
- `launch.js` is the vehicle for two `tests/r5-overflow.test.mjs` cases that check `chatStream`'s overflow restart with cancellation; deleting it would drop that coverage of `server/azure.js`.

**Proposal.** Leave them until the safety phase. Then, in one change: a Brain patch drops the `duplexRegistry` call from `turn.js`; the safety test moves to what it really checks (`partialSafety.js`, which is live); the B3 baseline moves under `evals/duplex/` with its harness; `launch.js`'s two tests are rewritten against `chatStream` directly.

**Cost.** Half a day once the safety phase allows touching the safety test.

## 4. Dead code removed (V-39), and what stayed

Removed (one commit, listed in `context/inbox/r7-audit-voice.json`): `server/voice/expressive/compile/mai.js` and `omni.js` (no engine used them; only one test read them).

Kept, because the rule says so:

- `TrainedEngine` and `loadOnnxFloorModel`, and `scripts/duplex/*`: cited in `context/` (the stage-B model decisions).
- `turnModel.ts loadSmartTurn`: cited in `context/decisions.md`.
- `src/voicesig/frontend/encoder.ts`: its types are imported by `head.ts`, `ort.ts` and `bus.ts`, and the voicesig evals construct it.
- `GET /api/voicesig/status`: used by `tests/prod` and cited in `context/measurements.md`.
- `AckRationer` / `ackBank` (`src/lesson/latency.ts`): the live acknowledgement is `src/latency/ack.ts`, but `tests/ui-v2-latency.test.mjs` uses `AckRationer` as the clip policy in G-WAIT-1, the check that her waiting and nod timing never track whether the answer was right (it also guards the live floor). Rewrite that test against the live ack rules first, then remove it.
- `GET /api/voice/trends`: no client, but it is the parent-trends half of the voice-features design; removing a parent feature is your call, not a cleanup.

## 5. The Opus decoder flush (V-34): left as it is

The decoder is flushed after every packet. That may cost a little audio quality or fail a later decoder, but nobody can listen to it from here (it needs a phone and ears). Proposal: one listening check on a phone, same reply with and without the per-packet flush. Cost: ten minutes on a device.

## 6. Streamed replies still start a second synthesis briefly (follow-up to V-20)

V-20 is fixed on the voice side: when turn-audio streamed the reply, the turn's prewarm is now aborted and the reply counts once in the speech limit. But `server/brain/turn.js` still starts that prewarm (two speech jobs) before turn-audio aborts it, so a little Azure speech is still spent per streamed reply. Proposal for Brain: skip the prewarm when the turn is being streamed by turn-audio (the route can pass a flag on `hooks`). Cost: a small Brain change and one test.

## 7. Kept on purpose

- **AWS scripts (V-38):** kept (`scripts/voice/v3`, `scripts/voice/stt-v3`, `scripts/voicesig/aws-check.py`): an open owner question about the AWS build scripts. Nothing runs them.
- **Voice switch and Roman-to-Devanagari (V-29):** not wired, by main's decision. The record is corrected in the context inbox; one data fix landed ("bara" is no longer read as twelve outside a run of numbers).
