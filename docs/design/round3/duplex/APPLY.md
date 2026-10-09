# duplex (round 3) · APPLY

Nothing here is committed, pushed or deployed. This stream's own paths (`src/duplex/**`, `server/duplex/**`, `evals/duplex*/**`)
are edited in place; two SHARED test/client files change only through the patches below.

## 1. Patches, in order (shared files)

| # | patch | files | what | proved by |
|---|---|---|---|---|
| 01 | `patches/01-duplex-runtime-test-hushed-sustain.diff` | `tests/duplex-runtime.test.mjs` | the barge-in test now asserts the round-3 overlap rule: the hush meets the child within 200 ms, the PAUSE waits for the words or `OVERLAP.hushedSustainMs` (1,000 ms) of voice (was: paused at 600 ms of voice) | the patched file: 42/42 (scratch tree with this stream's tree, 2026-10-09). **Apply together with this stream's in-place `src/duplex` changes: without it `tests/duplex-runtime.test.mjs` has 1 failing test (the old 700 ms assertion).** |
| 02 | `patches/02-duplex-switch-fails-to-shadow.diff` | `src/duplex/flags.ts`, `tests/p1-duplex-live.test.mjs` | a hands-free switch that cannot be read (route missing, slow 1.5 s, error) runs SHADOW, never live (was: failed OPEN to the build default "on" while production is shadow); a build default "off" still wins; a device forced on/off and the server's answer are unchanged | `tests/p1-duplex-live.test.mjs` patched: 17/17 (scratch tree) |

`git apply --check` passes for both on cadf527 and on the current HEAD 6aeda52 (re-checked 2026-10-09). They are independent of each other.

## 2. Edited in place (this stream's paths)

| file | change | proved by |
|---|---|---|
| `src/duplex/markers.ts`, `src/duplex/engine.ts` | `endShape` (terminal / comma / broken / unclosed, only once the session's transcriber has punctuated; null on simulated STT) and `enumerating` on `LexicalMarkers` (optional fields); `PauseClass`; `PrepareHint.eager`; `OverlapFeatures.hushed` | `tests/round3-duplex-eot.test.mjs` |
| `src/duplex/engineRules.ts` | `pauseClass()`; `extraWait` outside closed answers = `PAUSE_WAIT[class]` (was `OPEN_TURN_WAIT` 1,100 ms for everything and 0 ms for a question to her); the eager end of turn in `prepare()`; stage A version `2026-10-09.r3` | `tests/round3-duplex-eot.test.mjs`; eot-bench replays (CRITERIA.md) |
| `src/duplex/config.ts` | `PAUSE_WAIT` {hold 1,600, enumerating 1,200, question 900, idk 0, complete 1,100} chosen on TRAIN; `OVERLAP.hushGiveUpEchoOnly`, `hushedSustainMs` 1,000, `endedShortWaitsForWords`, `armedRevoke`, `overlapProbe`, `acousticYieldNeedsNonEcho` (all on; each ablated on AMI, CRITERIA.md §6) | as above + AMI replay |
| `src/duplex/overlap.ts`, `governor.ts` G11 | `acousticYieldNeedsNonEcho`: a burst too close to her echo to be hushed is never stopped for on acoustics alone (its words decide) | AMI ablation (CRITERIA.md §6); TaxilaFDB unchanged |
| `src/duplex/governor.ts` | G10: in free / question-to-her / chit-chat the class wait IS the backstop (floored by the child's pace); G7: an onset over an OPEN reply inside the revoke window ARMS the revoke (the overlap classifier decides; a pending verdict still revokes at once) | `tests/round3-duplex-eot.test.mjs`, `tests/ship5-fix-duplex-revoke.test.mjs` (5/5), `tests/duplex-runtime.test.mjs` G7 tests |
| `src/duplex/overlap.ts` | an ended burst <= 650 ms with no words waits for its words; while hushed, an acoustics-only yield needs 1,000 ms of voice | `tests/round3-duplex-eot.test.mjs` |
| `src/duplex/host.ts` | hush give-up counts only echo-like bursts and resets on a confirmed one; the overlap micro-commit probe (live only); `hushed` in the overlap features; the eager hint is part of the think-track change key | `tests/round3-duplex-eot.test.mjs` |
| `src/duplex/live.ts` | `DuplexPort.eager?` (start / cancel with the exact words), `stats.eagerStarts / eagerCancels` | `tests/round3-duplex-eot.test.mjs` |
| `server/duplex/fanin.js` | an EMPTY final covers its audio (a breath / click after the last words no longer blocks the decision until the hard backstop) | `tests/round3-duplex-eot.test.mjs` hi__4361 (3,080 ms → decided at the empty final) |
| `server/duplex/config.js` | the owner-test cohort `TAXILA_DUPLEX_LIVE_FOR`; `Vary: cookie` | `tests/round3-duplex-config.test.mjs` (6/6) |

New: `evals/duplex-r3/*` (pause table, policy simulator, semantic ceiling, AMI overlap runner, eager, criteria, splits),
`tests/round3-duplex-{eot,config}.test.mjs`, `tests/fixtures/round3-duplex-eot-hi__{4102,4164,4361}.json` (device frames + real
D4 events of eot-bench turns, CC BY 4.0, no audio), `tests/prod/round3-duplex.mjs`, result files
`evals/duplex-real/results/r3-*.json`.

Full `npm test` on the tree as it stood at 6aeda52 + this stream's working files (2026-10-09, one process, 26 min, under load
from other agents): 2,432 tests, 2,425 pass, 4 fail. Mine: `tests/duplex-runtime.test.mjs` #384 (patch 01 fixes it). Not this
stream: `tests/p3-voicesig-client.test.mjs` "never delay the turn" (a timing test: 10/10 alone afterwards),
`tests/round2-content.test.mjs` "board-first preselect", `tests/studio-stage-geometry.test.mjs`. `tests/p1-duplex-link.test.mjs`
(failing at 7773366 on the voicesig `?worker&url` import) now passes.

## 3. Flags and environment

- **Production stays `TAXILA_DUPLEX=shadow`.** The switch criteria are not met (CRITERIA.md).
- **Owner test:** set `TAXILA_DUPLEX_LIVE_FOR=<sha256 of the owner's lower-case login email>` (a plain email also works) on the
  `taxila-web` Container App. The owner then gets the hands-free teacher on any signed-in device; everyone else stays shadow;
  `TAXILA_DUPLEX=off` still kills it for everyone. The device switch `?duplex=1` / `?duplex=default` keeps working as before
  (a device forced on is still live whatever the server says: the owner's old URL trick; patch 02 does not change it).
- Kill switches for the round-3 behaviour (each a constant in `src/duplex/config.ts`, rebuild needed): `PAUSE_WAIT` (set every
  class to 1,100 to return to round 2's open wait), `OVERLAP.armedRevoke`, `hushGiveUpEchoOnly`, `endedShortWaitsForWords`,
  `overlapProbe`, `acousticYieldNeedsNonEcho`, `hushedSustainMs` (= `sustainedMs` restores the 600 ms pause; AMI says keep 1,000).
- No migration. No new model, route or secret.

## 4. Coordination with relational-human (round 3)

`src/latency/duplexTurn.ts` (relational-human, not on HEAD) starts the turn prefetch on `think/prepare` when
`c.hint.draft === "start"`. `draft` fires at a projected pComplete >= 0.5, which on real Hindi pauses is flat (AUC 0.50 at the
moment the words cover the audio) and can fire on words older than the audio. The measured signal is `c.hint.eager`
(`"start"` = covered words of a finished-looking turn; fired on the exact committed words at 354 of 399 real turn ends on D4,
280 ms before the commit, 0.07 cancelled starts per turn). One-line change for that stream:
`if ((c.hint.eager ?? c.hint.draft) === "start" && …)`. The engine side needs nothing more.

## 5. After deploy

1. `NODE_USE_ENV_PROXY=1 node tests/prod/round3-duplex.mjs` against taxila.dev (with `DUPLEX_OWNER_EMAIL/PASSWORD` for the cohort
   arm). Before deploy: config/everyone/shadow pass, Vary and bundle fail (not deployed), owner warns.
2. The owner tries a voice lesson hands-free; the shadow telemetry (`POST /api/duplex/shadow` → Log Analytics) then records
   real turns for the first time: in the 3 days to 2026-10-09 production served 512 lesson starts but only 5
   `/api/duplex/config` requests and 0 real shadow summaries (only the round-2 test's synthetic posts): voice lessons are
   almost never run, so Gate S cannot fill without them.
