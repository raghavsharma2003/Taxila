# Round 3 voicesig: how to apply

Everything in the stream's owned paths is already in the working tree (not committed): `src/voicesig/**`,
`server/voicesig/**`, `evals/voicesig/**`, the new `models/voicesig/filler-gru-r3.{onnx,json}`, `tests/round3-voicesig.test.mjs`,
`tests/prod/round3-voicesig.mjs`. Four patches touch files this stream does not own; each is a unified diff against HEAD
(written against `cadf527`; re-checked against `1fb079b` and `a8a6b56`, the main loop's later WIP checkpoints) and passes `git apply --check --cached` (the index = HEAD) on all three, 2026-10-09.

| order | patch | files | what it does | flag / kill | the test that proves it |
|---|---|---|---|---|---|
| 01 | `patches/01-reasons-vs-shadow.diff` | `server/brain/reasons.js` | adds the closed trace-code families `vs_would` (followUpProbe / gentlerHint / slowerPace), `vs_diff` (same / changed / not_run), `vs_hold` (fired). Without it `knownReasons` drops the new codes (nothing breaks; nothing is logged) | — | `tests/round3-voicesig.test.mjs` emits exactly these codes; `tests/p3-voicesig-server.test.mjs` "reason codes" still green; `tests/brain-kernel.test.mjs` |
| 02 | `patches/02-brain-turn-shadow-plan.diff` | `server/brain/turn.js` | adds the shadow codes (`vs_would.*`, `vs_hold.fired`) to the turn's trace row; then, AFTER the commit and never awaited by a hosted reply, when this turn's voice read is shadow AND would hand the Director a tie-breaker (not on safety, late or re-planned turns), runs `planTurn` once more on the same (cloned) state with that tie-breaker (pure; its staged writes are dropped, as the speculative plan's are) and records `voicesigSeam.shadowDiff()` as `vs_diff.*` by updating that trace row; local debug awaits it: `debug.vs.shadow` = { would, actual, shadow (move kind, rung, probe, shape hash), changed, ms } (never words) | `TAXILA_VOICESIG_COUNTERFACTUAL=0` (off); `TAXILA_VOICESIG=off` (all voicesig) | local `tests/prod/round3-voicesig.mjs` lesson arm ("every turn with a would-hint ran the counterfactual", "< 50 ms"); shadow arm: the move is the same with and without kv |
| 03 | `patches/03-duplex-live-estimate.diff` | `src/duplex/live.ts`, `src/duplex/liveTap.ts` | a public `DuplexLive.estimate({ acoustic }, t)` passthrough to the host, and the lesson tap's glue subscribes to `src/voicesig/holdBus.ts`, so the thinking-pause cue reaches the engine as an AcousticEstimate on the tap's epoch clock | `TAXILA_VOICESIG_HOLDCUE=0` (server kill: the client never starts the cue); `TAXILA_VOICESIG_DETECTOR=0` also stops it | `tests/round3-voicesig.test.mjs` HoldCue → holdBus; duplex's own runtime tests stay green |
| 04 | `patches/04-duplex-engine-acoustic-hold.diff` | `src/duplex/engineRules.ts`, `src/duplex/governor.ts` | a fresh acoustic estimate with pHoldWanted ≥ 0.6 counts in zH exactly like the lexical `fillerTail` (inside the same `max()`, never both) and stretches the governor's silence backstop as `fillerTail` does | as 03 (no estimate → no effect: byte-identical decisions) | `evals/voicesig/r3/duplex_replay.mjs` arm `cue+zh` vs `off` on the frozen HEAD copy (RESULTS.md §2.3); duplex `tests/duplex-*.test.mjs` |

**Conflicts to expect.** The duplex stream is editing `src/duplex/{config,engine,engineRules,governor,markers}.ts` in this
tree right now (5 files modified during this run). Patches 03-04 are against HEAD; apply them AFTER the duplex stream's
patches and re-run `git apply --check` — 04 is 7 lines (one new boolean in `estimate()`, one more term inside an existing
`max()`, one more `||` in `stretch()`), so a rebase is mechanical. Then re-run `duplex_replay.mjs` (all three arms with
`--src` = the merged tree) to re-measure on the merged engine: the numbers in RESULTS.md are for the HEAD engine.

**Order rationale.** 01 before 02 (the codes must be in the vocabulary before the turn writes them); 03 before 04 (the
estimate must arrive before the engine counts it; 04 alone is inert). Server and client halves are independent.

**No migration.** Nothing new is stored: `pausesRead` / `thinkPauses` ride in `TurnRequest.voiceFeatures.kv` (validated
in `server/voicesig/adapter.js`, never persisted); the shadow record is trace codes and debug only.

**Deploy note.** The new detector ships as `models/voicesig/filler-gru-r3.onnx` (imported by `src/voicesig/ort.ts` with
`?url`, so it lands in `dist/` at build time; the production image copies `dist`). The old `filler-gru.onnx` stays in the
tree for the before/after harness. Old clients that send kv without the new counters are unaffected; new clients that
reach an old server get their kv dropped by the old validator (never a 400), i.e. voicesig is silent for that turn.

**Gates run in this tree (2026-10-09):** see RESULTS.md §6.
