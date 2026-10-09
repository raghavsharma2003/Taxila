# Play · APPLY (round 3, stream play)

Five unified diffs, each checked with `git apply --check` (working tree) and `git apply --check --cached` (index) on
2026-10-09, first on HEAD `cadf527`, then again on `a29cc0b` and on `6aeda52` (the main loop's later WIP checkpoints). They touch shared hot files the play stream does not own; everything else the stream built is in its own paths
(`src/play/**`, `server/play/**`, `data/play/**`, `shared/play.ts`, `tests/play-*.test.mjs`, `tests/prod/round3-play.mjs`,
`docs/design/round3/play/**`) and needs no patch.

**No migration. No new secret is required** (the session and evidence tokens use `TAXILA_PLAY_KEY` when set, else a key
derived from `DATABASE_URL`, stable across the replicas of one environment; set `TAXILA_PLAY_KEY` (≥ 16 chars) in the
Container App secret store to rotate it independently). **No model call** on any play route: quotas cannot 429 them.

Order matters only for 03 → 04 (the client sends what the turn reads); 01 can ship alone (the API is self-contained).

| # | file(s) | what | proof (test, where it passed) |
|---|---|---|---|
| 01 | `server/index.js` | mount `/api/play/*` (one import + one spread) | `tests/prod/round3-play.mjs` 93/93 against a local production server with 01-05 applied (Neon TEST, 2026-10-09); taxila.dev today: P0 404 (routes absent) |
| 02 | `server/learner/kt/ledger.js` + new `tests/play-ledger-seam.test.mjs` | a game event (`via: "game"`, also a late correction of one) is never the delayed check, never spends it, never sets `unaided`: only a bare item outside the game can make a skill learned or secure | the new test: 4/4 with the patch, 1/4 on HEAD (it fails on HEAD by design); `tests/learner-*.test.mjs`, `bkt`, `comprehension-{engine,schedule,reteach}`, `round2-truth*`: same 132 pass / 4 environment fails with and without the patch (scratch copy without `db/`, `evals/`) |
| 03 | `server/brain/turn.js` + new `tests/play-turn-seam.test.mjs` | the lesson turn folds the play server's OWN grade: an evidence token (HMAC, bound to child + lesson, server/play/evidence.js) verified, folded once per level as one `via: "game"` item episode on the lesson's kit skills only; a seam's PLAY facts row reaches the reply only from a verified seam token, key=value pairs only (the recitation law); any device-sent row or data on a play event is deleted first | the new test 5/5 (forged, foreign-child, foreign-lesson, edited, out-of-kit tokens fold nothing; a sentence signed into a row is cut to its pairs); `brain-*`, `learner-live`, `safety-content-filter`, `voice-*`, `lesson-{safety,truth}`: identical results with and without the patch (102 pass / 9 environment fails from the scratch copy's missing `evals/`) |
| 04 | `src/child/lesson/{deskLayout.ts,useDesk.ts,Desk.tsx,WorkTray.tsx}` + new `tests/play-desk-seam.test.mjs` | PLAY MODE: with a play piece in the Studio slot the question card folds (the game's goal rail is the card), her speech row keeps its minimum and the tray takes the rest, so the embedded play box (`src/play/core/box.ts MIN_BOX` 300 × 440) fits on phones ≥ 690 CSS px tall; WorkTray forwards a play piece's signed tokens as module events through `src/play/lessonBridge.ts` (level end → `goal_met`, impasse / misconception → `stuck`, evidence and predictions ride along; acts stay on the device) | the new test 10/10; `ui-v2-deskLayout`, `client-runtime`, `duplex-runtime`, `voice-features-runtime`: 92/92 with the patch; `tsc` clean on the patched scratch tree apart from a missing `models/` json the copy did not carry |
| 05 | `src/lesson/runtime.ts` | each committed child utterance (not a chip) is also dispatched as `taxila:play-heard`; a play piece on screen maps a short command to the same control presses a finger makes (closed grammar, `src/play/core/voice.ts`); the turn is sent as before either way, so scanSafety, the model distress read and the stop check-in run on every committed turn | `tests/play-voice.test.mjs` 38/38 (with `tests/play-style-lint`): "bas", "stop", "help", feelings and sentences are never game acts |

## How to apply and verify

```
git apply docs/design/round3/play/patches/01-play-routes.diff
git apply docs/design/round3/play/patches/02-ledger-game-never-the-check.diff
git apply docs/design/round3/play/patches/03-turn-folds-play.diff
git apply docs/design/round3/play/patches/04-desk-play-mode.diff
git apply docs/design/round3/play/patches/05-runtime-heard.diff
npx tsc -b && npx vite build && npm test
# then, against a local production server (Neon TEST) and after deploy against taxila.dev:
NODE_USE_ENV_PROXY=1 TAXILA_BASE=<base> node --env-file=.env.local tests/prod/round3-play.mjs
```

## Flags and rollback

- There is no runtime flag: play appears in a lesson only when forge's `compose()` ladder offers a play rung for the skill
  (`data/play/coverage.json`) and forge's live path (`server/forge3/live.js`) turns it into a `PlayArtifact`. Reverting 01
  removes the API (the Studio renderer then reports `unavailable` and the stage shows the board twin); reverting 03 stops
  play evidence from reaching the ledger (play still runs); reverting 04 returns the tray to its old size (the renderer
  refuses boxes under 300 × 440 and the board twin shows instead).
- 02 changes how ANY `via: "game"` event folds (today no other producer emits one in the lesson path; the comprehension sim
  tests use `probe.*` game events, which are not item classes and are unaffected).

## What the main loop must know before shipping

- The forge stream's working-tree changes (`src/studio/renderers.ts` play glob, `src/studio/StudioStage.tsx` board-twin
  fallback, `server/studio/seam.js`, `server/forge3/**`) are what put a play piece on the Studio slot; these patches assume
  them. Without forge's renderer glob the play artifact has no renderer.
- `server/play/routes.js` was fixed on 2026-10-09 to read the router's parsed body (`fn(req, res, body)`): reading the
  request stream a second time returned `{}` and every POST failed `childId required`. Found by `tests/prod/round3-play.mjs`
  on the first local run.
