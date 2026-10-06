# ship5 p3-voicesig: apply order, switches, proofs

Stream: voice-signal knowledge states (priority 3), end to end. Owner directive `owner-ship-five-2026-10-05`; bar
`docs/design/reset/VALUES-100.md` V2 items 2-4. Design: `docs/design/voice-signals/SPEC.md` (ship5 status at the top),
`docs/design/voice-signals/INTEGRATION.md` ("As shipped in ship5").

**Honesty first.** No state is measured on children. Every per-state number shipped is SIMULATED (7 states) or absent
(`workingAloud`); the only real-speech number is the filler detector on ADULT speech. So every state runs in SHADOW in
production: computed on every spoken turn, logged as trace codes, and the Director / comprehension / pace consumers get
exactly what they got before this stream. `GET /api/voicesig/status` says so per state. The status page
(`docs/status/*.html`, main loop) should embed that table.

## What is already in the tree (no patch needed)
New files of this stream (WIP checkpoints 9102ffa / 39f940d plus this session):
- `src/voicesig/**`: the shared front-end (`frontend/*`), `lessonTap.ts` (THE one mic tap; duplex's `src/duplex/liveTap.ts`
  already uses it), `lessonFeatures.ts` (the runtime's voice-features wrapper: one tap → utterance numbers + kv on the same
  turn POST), `head.ts`, `turn.ts`, `flag.ts`, `tapUrl.ts`, `types.ts`. `src/voicesig/ort.ts` comes in patch 08 (it needs the
  package).
- `server/voicesig/**`: `lesson.js` (THE seam: `turn`, `startRows`, `endSave`, `withdraw`, `sweep`, `config`, `status`),
  `gate.js` (the precision gate + the shipped evidence), `lint.js` (restriction-12 word list, build lint + runtime guard),
  `routes.js`, `adapter.js`, `rules.js`, `ladder.js`, `baseline.js`, `calibrate.js`.
- `scripts/voicesig/sweep.mjs` (one consent sweep run), `evals/voicesig/**` (harness, simulator, `state-precision.mjs`).
- Tests: `tests/p3-voicesig-server.test.mjs` (25), `tests/p3-voicesig-client.test.mjs` (10), `tests/voicesig.test.mjs`
  (32, shim to `evals/voicesig/tests`), `tests/p3-voicesig-sweep-db.test.mjs` (+ `.run.mjs`, 5, Neon TEST branch),
  `tests/prod/p3-voicesig-acceptance.mjs`.
- Migration `021_voicesig.sql` is ALREADY applied on the Neon TEST branch (2026-10-05 20:14 UTC; columns verified equal to
  patch 07 on 2026-10-06). Not applied anywhere else.

## Patches (in this order; each `git apply --check` passes on 8006902)
| # | file | touches | what |
|---|---|---|---|
| 01 | `patches/01-contracts-kv.diff` | `shared/contracts.ts` | types `VoiceUtterance.kv?: KnowledgeVoice` (top-level; never inside `features`, which would 400) |
| 02 | `patches/02-reason-codes.diff` | `server/brain/reasons.js` | trace families `vs`, `vs_gate`, `vs_act`; `component_error.voicesig`. **If p5-interaction's 09 is applied first, use `02b-reason-codes.after-p5.diff` instead** (same content, rebased; checked on 8006902 + p5 09) |
| 03 | `patches/03-turn-seam.diff` | `server/brain/turn.js` | every committed spoken turn calls `voicesigSeam.turn` (pure, sub-ms, inside `seamSafe`); a disclosure turn (predicate, classifier, duplex floor) gets nothing; a LIVE state's hints merge into `planCtx.voice` (followUpProbe / gentlerHint / slowerPace, the vocabulary the Director, comprehension schedule and pace adapter already read); shadow hands nothing; vs codes to `brain_trace`; `state.vsb` never learns from a safety turn or a late turn; `debug.vs` |
| 04 | `patches/04-lesson-baseline.diff` | `server/routes/lesson.js` | lesson start loads the child's baseline in the existing `Promise.all` (never throws); lesson end writes it back off the reply path (`void`) |
| 05 | `patches/05-pace-consent.diff` | `server/routes/account.js`, `server/routes/parent.js`, `src/parent/Pages.tsx` | the parent toggle: purpose `voice_pace_memory` ("Remember your child's usual answering pace", off by default, numbers only, no region named); withdrawal deletes the rows in the same request |
| 06 | `patches/06-server-index.diff` | `server/index.js` | registers `GET /api/voicesig/config` and `/status`. **If p2-face's 03 is applied first, use `06b-server-index.after-p2face.diff`** (checked on 8006902 + p2-face 03). `...voicesig` sits before `...lane` (tests/w2d-voice-lanes asserts `...lane }`) |
| 07 | `patches/07-migration-021.diff` | NEW `db/migrations/021_voicesig.sql`, `db/migrations/README.md` | schema `voicesig` (subject / baseline / calibration / population_norm), numbers only, cascade on child erasure. 021 is the next free number (no other ship5 stream takes one) |
| 08 | `patches/08-onnxruntime-web.diff` | `package.json`, `package-lock.json`, NEW `src/voicesig/ort.ts` | `onnxruntime-web` 1.30.0 (owner-approved): WASM, one thread, same-origin assets, lazy, skipped on Save-Data / 2G; then `npm ci` |
| 09 | `patches/09-voice-features-shared-tap.diff` | `src/voice/features.ts` | `VoiceFeatures.attachFrames`: take frames from the shared tap instead of its own worklet |
| 10 | `patches/10-runtime-factory.diff` | `src/lesson/runtime.ts` | the default voice-features factory becomes `VoicesigLessonFeatures` (inner `VoiceFeatures` as the fallback on any failure) |
| 11 | `patches/11-worker-consent-sweep.diff` | `server/worker.mjs` | the ticker leader runs `voicesigSweep(q)` every 6 h (and on `--once`): deletes subjects whose latest `voice_pace_memory` consent is not a grant. Never throws |

Dependencies: 03 needs 02 (else `knownReasons` drops the codes; the turn still works). 04/05/11 need 07 migrated where they
run (without it every DB call is caught: session-only baselines, the sweep logs and returns -1). 10 needs 08 (`ort.ts`) and
09 (`attachFrames`; without it the wrapper falls back to the inner tap). 01 is types only.

After applying: `npm ci`, then **migrate 021 on prod only when the integrator deploys** (`node scripts/migrate.mjs` with the
prod `DATABASE_URL`; additive), set `VOICESIG_SUBJECT_KEY` (>= 32 random hex chars) in the Container App secret store for
persistence (without it: session-only baselines, `status.persistence` says so, nothing is stored).

## Switches (ON by default; the old path is the automatic fallback)
| switch | where | effect |
|---|---|---|
| `TAXILA_VOICESIG` = unset / `shadow` | ACA env, runtime | the shipped default: pipeline on, every state shadow |
| `TAXILA_VOICESIG=off` | ACA env, runtime | kill: the server reads no kv, writes no code, loads/saves no baseline; `/api/voicesig/config` says `frontend:false`, so new lesson loads take the old `VoiceFeatures` tap with no kv (fails OPEN on a missing/slow route) |
| `TAXILA_VOICESIG=on` | ACA env | lets a state act ONLY if it also passes the gate (children precision >= 0.80, >= 100 fired, ladder >= L1, fitted calibration). Today: no state passes, so `on` == `shadow` |
| `TAXILA_VOICESIG_FRONTEND=0` / `TAXILA_VOICESIG_DETECTOR=0` | ACA env | client keeps the old tap / skips the ORT detector (stage-0 kv) |
| `?voicesig=0|1|default` | per device (persisted) | the owner's test switch (`src/voicesig/flag.ts`) |
| `VOICESIG_SUBJECT_KEY` | secret store | persistence under the parent's choice; absent = session-only |

Degradation: no AI call is added by this stream (no quota, no 429 path); ORT is on-device. Any throw in the seam returns
the no-voicesig value with `component_error.voicesig`; the detector slower than its budget leaves stage-0 kv; the turn POST
is never delayed (test).

## Tests that prove each piece
| piece | test | result (2026-10-06) |
|---|---|---|
| seam: shadow default, kill, typed/no-kv, SAFETY (flag, predicate alone, duplex), gate order, simulated can never open it, LIVE fixtures hand each hint, baseline z after 8 turns, held-belief history, row cap, never-throw, reason codes in the closed vocabulary, start/end/withdraw round trip, persistence never throws, config/status, restriction-12 word list + folder lint (code AND patches), **10k generated turns: no state-of-mind word in any output, nothing at all on a safety turn**, G-VS-SCHEMA on migration 021, consent sweep | `tests/p3-voicesig-server.test.mjs` | 25/25 pass (main tree) |
| ONE tap (utterance numbers + head share one front-end; kv on the same POST), G-VS-DXEQ frame equality, G-VS-ONE ref-count, fallback on attach failure, kill switches, config fails open, turn never delayed by the detector, micClass, ORT graph loads and runs | `tests/p3-voicesig-client.test.mjs` | 9/10 in the main tree (ORT case skips: package not installed until 08); **10/10 with 08 applied** (scratch; one 30 s turn p50 5.15 ms, n=7, node wasm 1 thread) |
| front-end / adapter / harness gates (G-VS-SAFETY 10k, NODOUBLE, narrowband, SY-1/SY-2, streaming = batch) | `tests/voicesig.test.mjs` | 32/32 |
| stored baselines on real Postgres; sweep keeps grants, latest row decides, child-specific and guardian-wide withdrawal, cascade, erasure without the key | `tests/p3-voicesig-sweep-db.test.mjs` | 5/5 on the Neon TEST branch |
| end to end on a running server | `tests/prod/p3-voicesig-acceptance.mjs` | **46/46** against the patched server on the Neon TEST branch (local, mode shadow); see below |

Run the acceptance: `TAXILA_BASE=http://localhost:PORT node tests/prod/p3-voicesig-acceptance.mjs` (DB checks need
`CONDUCTOR_TEST_DATABASE_URL` in the environment for a local target; `TAXILA_DB_URL` for a remote one). Against taxila.dev:
`NODE_USE_ENV_PROXY=1 node tests/prod/p3-voicesig-acceptance.mjs`. The safety arm opens a real safeguarding incident on its
own throwaway account (held for a human, as designed).

## Verified how
All 11 patches were applied to a scratch copy (`/tmp/claude-0/…/scratchpad/ship5/p3-voicesig/tree`: the working tree's
`server/ shared/ src/ tests/ db/ evals/voicesig` with every hot file the patches touch reset to its 8006902 blob,
`onnxruntime-web` 1.30.0 linked in), never the main tree. Then:
- `tsc -p tsconfig.json`: 0 errors (without 08 the only error is `ort.ts` missing its package, as expected);
- `vite build`: OK; ORT lands as lazy chunks `ort-*.js` 72.7 kB (24.4 kB gz) + `ort-wasm-simd-threaded-*.wasm` 14.2 MB
  (3.7 MB gz), fetched only when the detector loads; `tapWorklet-*.js` 1.5 kB;
- the 31 test files that import any patched file: 426 tests, 0 failures attributable to the patches after the 06 fix (the
  first run caught `...lane }` in w2d-voice-lanes; two other failures were scratch-copy gaps, re-run green once the files
  were present);
- the full `node --test tests/` on the scratch tree (patches 01-10): 878 tests, 794 pass, 75 fail, 9 skip. Every failure was
  checked: 60 `browser:` module tests + the 360x800 frame test (need the built `dist/` + Playwright, absent in the copy),
  the eyes.test.mjs image-tag gate (git state of the copy), and 13 p5-interaction tests that need p5's own patches (they fail
  identically with these patches reversed; p5-interaction-conversation's reason-code test needs p5 09). None touches voicesig;
- after adding patch 11 and the consent sweep: the voicesig files + w2d-voice-lanes + w2-seams + the sweep DB test on the
  patched copy: 109/109; `tsc` 0 errors. Patch 11 itself was checked by `node --check` and by the sweep's own DB test; the
  patched worker was NOT run (`--once` would fire Conductor wakeups and jobs on the test branch);
- `06b` checked after p2-face 03, `02b` after p5-interaction 09;
- the patched server ran on the Neon TEST branch (`TAXILA_VOICESIG` unset) and the acceptance passed 46/46; with
  `TAXILA_VOICESIG=off` the config route answered `{mode:"off", frontend:false, detector:false}` and status `why:"killed"`.

## Not done here (and why)
- **No state measured on children.** Needs the consented pilot (VALUES-100 honesty rule). The pipeline to measure it exists:
  `node evals/voicesig/state-precision.mjs --rows pilot.jsonl --population children` (outcome-defined truth), then replace a
  row in `gate.js` EVIDENCE and raise its ladder row, both in a reviewed diff.
- **No fitted per-head calibration ships**, so even a gate-passing state would stay shadow by the adapter's own rule until
  the pilot fits one (SPEC §6.3).
- **Not deployed / not migrated on prod / not run against taxila.dev**: the brief forbids it; the integrator runs the
  acceptance there after deploying.
