# duplex-real · APPLY

Stream: duplex-real (round 2). Nothing here is committed, pushed or deployed. One hot file is touched (by patch); the rest
are this stream's own paths or duplex-only files outside the hot list, edited in place.

## 1. Patch (hot file), in order

| # | patch | file | what | proved by |
|---|---|---|---|---|
| 01 | `patches/01-register-shadow-route.diff` | `server/index.js` | registers `POST /api/duplex/shadow` (`server/duplex/shadowLog.js`) | `tests/prod/round2-duplex-real.mjs` (local, patched tree: 10/10; prod today: 404 → 1/7) |

`git apply --check docs/design/round2/duplex-real/patches/01-register-shadow-route.diff` passes on HEAD (617df2b and 0aaba77).

## 2. Edited in place (duplex-only paths, not on the hot list)

| file | change | proved by |
|---|---|---|
| `src/duplex/host.ts` | a commit pins the epoch a revoke restores (`prevTurnStart` at SPEAK / CUT_IN); `commitEmpty()` | `tests/duplex-real-replay.test.mjs` (real eot-bench speech + real STT events, hi__4015 → hi__4016: failed before, passes after) |
| `server/duplex/fanin.js` (+ `.d.ts`) | a final whose item has no reported audio start answers the oldest commit sent before it (`takeOldest` / `peekOldest`); `commitEmpty()` | `tests/duplex-real-engine.test.mjs` (fan-in block) |
| `src/duplex/cascadeDuplex.ts` | shadow telemetry (frames, rows, STT finals, her playback → one summary per lesson, beacon on close); `input_audio_buffer_commit_empty` from the engine's own probe is consumed while the engine decides (was: `child_silent` → floor flip + resume of a paused reply) | `tests/duplex-real-shadow.test.mjs`, `tests/duplex-real-engine.test.mjs` |
| `src/duplex/live.ts` | `commitEmpty()`; optional `semantic` estimator passthrough (off unless given; the semantic arm is evals-only) | `tests/duplex-real-engine.test.mjs`, existing `tests/p1-duplex-live.test.mjs` |
| `src/duplex/config.ts` | `OPEN_TURN_WAIT` = 1,100 ms (chosen on TRAIN) | `tests/duplex-real-engine.test.mjs` |
| `src/duplex/engineRules.ts` | `extraWait` applies `OPEN_TURN_WAIT` outside closed answers (questions to her and "pata nahi" exempt); `exchangeOf`: a yes/no answer longer than 3 words is a free turn | `tests/duplex-real-engine.test.mjs` |
| `src/duplex/governor.ts` | **net unchanged** vs 617df2b. WIP checkpoint 0aaba77 captured an experiment (G7 "armed revoke") mid-flight; the working tree reverts it (rejected on AMI: `rj-dxr-armed-revoke`) | existing `tests/duplex-runtime.test.mjs` G7 test green |
| `server/duplex/understand.js` (+ `.d.ts`) | copula projection cue ("मेरा फोन नंबर है", "answer है" project a complement; questions exempt) | `tests/duplex-real-engine.test.mjs` |

New files: `src/duplex/shadowTelemetry.ts`, `server/duplex/shadowLog.js`, `evals/duplex-real/{eot-replay,eot-sweep,eot-sem,eot-diag,make-fixture,shadow-report,criteria}.mjs`
(+ edits to this stream's own `lib.mjs`, `eot.mjs`, `ami-real.mjs`), `tests/duplex-real-{shadow,engine,replay}.test.mjs`,
`tests/fixtures/duplex-real-revoke-hi4016.json` (frames + STT events from eot-bench, CC BY 4.0; no audio),
`tests/prod/round2-duplex-real.mjs`.

## 3. Gates run on this tree

- `npx tsc -b` exit 0.
- every `tests/*duplex*.test.mjs` file green on its own (10 files); `tests/runtime-image-imports.test.mjs` green.
- `npm test` (one process, 2026-10-07 on this tree): 2,135 tests, 2,124 pass, 0 fail, 11 skipped, exit 0.

## 4. After deploy

1. `NODE_USE_ENV_PROXY=1 node tests/prod/round2-duplex-real.mjs` against taxila.dev: expect 7/7 (log arm is local only).
2. Keep `TAXILA_DUPLEX=shadow`. Read the shadow lines weekly:
   `ContainerAppConsoleLogs_CL | where Log_s has "duplex_shadow"` → file → `node evals/duplex-real/shadow-report.mjs <file> --json s.json`
   → `node evals/duplex-real/criteria.mjs --shadow s.json` (CRITERIA.md §3).
