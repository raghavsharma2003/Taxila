# Round 3 · forge · APPLY

## What is already in the tree (owned paths; carried by the main loop's WIP checkpoint commits 7773366 / a29cc0b, not gated)

| path | what |
|---|---|
| `server/studio/qa/whiteboard.js`, `semantics.js` | wb-gate@3: W10 screen claims drawn, W11 shows an idea, W12 no next-step reveal, W13 fractions agree, W9+ long word answers, W14 advisory |
| `server/studio/seam.js` | board ground per lesson (`forge3/art.js`); **`composeAsk`** (a play piece for an interactive ask, built before the kernel), `slotFor` shows it on the same turn, `slotOf` for `source: "play"` |
| `src/studio/StudioStage.tsx` | the camera (`boardView.ts`), **boards laid out for the box (`boardFit.ts`)**, the device check / board twin for Studio v2 worlds AND play pieces (error "layout" → twin; a box that grows retries), play pieces fill the tray, the rail band for Studio v2 chrome on phones, measurement split into `useStageArea` + a pure `boxFor` |
| `src/studio/boardFit.ts` (new), `boardView.ts`, `twinBoard.ts`, `renderers.ts`, `studio.css` | layout-for-the-box, framing, twin, the play renderer registration (build-time glob), lesson-stage chrome |
| `server/forge3/**` (new) | `live.js` (the live play piece), `compose.js` (the ladder), `art.js`, `gate.js` + `qa-service.mjs` + `infra/Dockerfile` (the QA service), `certify.js` + `play-cert.js` (certificates), `qa/*` (render, measure, checks, harness), `certs/catalogue.json` + `certs/play.json` |
| `tests/round3-forge-unit.test.mjs`, `-semantics`, `-live` (new), `-qa-browser`; `tests/fixtures/round3-forge/`; `tests/prod/round3-forge.mjs` | unit, browser and acceptance |

## Patches (unified diffs written against `cadf527`; all eight also apply cleanly on the WIP checkpoint HEAD `a29cc0b`, alone and after play 01-05, checked 2026-10-09 ~13:00 UTC, and in sequence on HEAD `a8a6b56` (~14:00 UTC); apply 04 first, then 01-03, 05-08)

Order and the test proving each:

| # | patch | files | what it does | proof | flags / deps |
|---|---|---|---|---|---|
| 04 | `04-tests-follow-gate-and-frame.diff` | `tests/round2-content.test.mjs`, `tests/studio-stage-geometry.test.mjs` | the reject reason may now include W10; the box keeps the board FRAME's aspect | the two tests (green in the gate copy) | **apply with the owned changes**, or those two tests fail |
| 01 | `01-studio-v2-hud-keys.diff` | `src/studio-v2/core/host.ts` | each HUD pill carries `data-key` so the lesson stage hides score / streak pills (chain, combo, streak, accuracy, precision, time) | matrix: no "CHAIN" / "ACCURACY" text in the lesson stage | none |
| 02 | `02-module-frame-fit.diff` | `src/modules/frame/main.tsx`, new `src/modules/frame/fit.ts` | an engine taller / wider than its frame is scaled to fit (≥ 0.75), else its frame scrolls; never cut off | `tests/prod/round3-forge.mjs` R4 on module trays | none |
| 03 | `03-brain-keep-engine-for-game-asks.diff` | `server/brain/turn.js` | (a) a game / animation / simulation ask keeps a non-rung engine already in the tray; (b) otherwise `studioSeam.composeAsk` builds a PLAY piece before the kernel and no whiteboard is requested for the ask; (c) a play slot takes the tray from the Director's rung like a Stagecraft piece | `node --test tests/round3-forge-live.test.mjs` (seam + live), `tests/prod/round3-forge.mjs` R2 | `FORGE3_PLAY=0` turns (b) off; needs `server/forge3/live.js` and the play stream's `server/play/start.js`, `src/play/families` (a missing play stream = composeAsk null = the old path) |
| 05 | `05-stagecraft-catalogue-qa-certificate.diff` | `server/stagecraft/catalogue.js` | a catalogue game / explainer broken at EVERY judged size (`server/forge3/certs/catalogue.json`) is not served; never judged = allowed | `node --test tests/stagecraft.test.mjs`; `certify.js` output | `FORGE3_QA_CERTS=0` ignores the certificates |
| 06 | `06-geoboard-no-area-task-in-a-perimeter-ask.diff` | `src/modules/frame/engines/geoboard.logic.ts`, new `tests/round3-forge-geoboard.test.mjs` | a perimeter ask never defaults to an area target | `node --test tests/round3-forge-geoboard.test.mjs` | none |
| 07 | `07-desk-gives-back-an-empty-studio-tray.diff` | `src/child/lesson/useDesk.ts`, `src/child/lesson/WorkTray.tsx` | the Studio stage reports a slot that ENDED with nothing to show (board refused / failed, piece retired: `{ type: "empty" }`, `src/studio/StudioStage.tsx`); the Desk gives the tray back (Face layout) instead of an empty white box | `tests/prod/round3-forge.mjs` R4 (Q5.drawn views) | none; a new slot id holds the tray again |
| 08 | `08-simulation-ask-is-interactive.diff` | `server/director/requests.js`, new `tests/round3-forge-requests.test.mjs` | "simulation dikhao" / "simulate karo" / "show me a simulation" are read as interactive visual requests in code (kind animation); before, no pattern matched them and only the model classifier's flag sometimes did (2 of 5 forge acceptance runs read the c7 ask as a plain worked example and gave a board) | `node --test tests/round3-forge-requests.test.mjs tests/owner-requests.test.mjs` (19/19 with the patch) | none |

**Order with the play stream's patches** (`docs/design/round3/play/patches/01-05`): both orders apply cleanly on HEAD
(checked with `git apply` on a HEAD export, 2026-10-09: play 01-05 then forge 01-07, and forge 01-07 then play 01-05);
forge 03 and play 03 both touch `server/brain/turn.js` in separate hunks; forge 07 and play 04 both touch `WorkTray.tsx` /
`useDesk.ts` in separate hunks. forge's final measurement copy applied play 01-05 first.

**Dependency on the play stream (must be applied together or `FORGE3_PLAY=0`):** the play piece's client renderer fetches its
level from `POST /api/play/level`, which exists only once the play stream registers `/api/play/*` (play's patch 01 on
`server/index.js`). Without it the renderer gets nothing, reports `unavailable`, and the stage shows the board twin (never
an empty box, but never the game either). forge's measurement copies registered the route table with one import line and
say so in every number (`RESULTS.md`).

No migration. No production DB change. forge writes no `studio_mount` row for play pieces (the table's source check admits
Studio sources only).

## Flags (all default ON; each is a kill switch)

- `FORGE3_PLAY=0` — no live play pieces (interactive asks take the board path as before).
- `FORGE3_BOARD_ART=0` — boards keep the producer's ground (every board chalk, as before).
- `FORGE3_QA_CERTS=0` — patch 05 ignores the visual-QA certificates.
- The camera, the board layout-for-the-box and the device check have no flag: they are the stage's rendering. Revert by
  reverting `src/studio/StudioStage.tsx` (boardFit is pure and only called from there).

## The visual-QA service (not deployed; owner action)

- Image: `server/forge3/infra/Dockerfile` (Playwright base; builds the harness from `src/` at image build time).
- Run like `studio-qa`: Container App in an untrusted environment, ingress internal, egress denied, no secrets;
  `FORGE3_QA_TOKEN` on both sides; `taxila-web` gets `FORGE3_QA_URL`. Until then `server/forge3/gate.js` answers
  `unavailable` and nothing that needs live judging is shown; the certified library, boards, play pieces (certified by
  sampling) and voice are unaffected.
- Regenerate the certificates after any change to `src/studio`, `src/studio-v2`, `src/modules/whiteboard`, `src/play` or
  the catalogue / coverage:
  `FORGE3_QA_LOCAL=1 node docs/design/round3/forge/audit/harness/matrix.mjs --out <dir> --sources prod,boards,games,explainers`,
  `node server/forge3/certify.js --from <dir>/matrix.json`, and
  `FORGE3_QA_LOCAL=1 node server/forge3/play-cert.js --harness <dir>/_harness`.

## What is NOT wired (said plainly)

- The `generated_spec` Stagecraft rung is not routed through `gate.js` yet (Stagecraft's file): the call to add before
  `reveal` is `judgeArtifact(artifact) → showableAt(verdict, vpClass)`; the client does not report its box today.
- Play mode on the Desk (the world getting 360 × 576 on a phone) is the play stream's patch; until it lands a play piece
  is the game on 412-class phones and its board twin on 360 phones and 1366 × 768 laptops (`FOR-PLAY.md` §2.1).
- A first-frame judge on the child's device was designed, not built (`RESEARCH.md` §4.10).
