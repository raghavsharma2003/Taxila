# forge → play: what the live pipeline and the visual QA need from the play stream (round 3, 2026-10-09)

The two streams meet only through files. This page is forge's side; GRAMMAR.md is play's. Numbers here are forge's
measurements of play's files AS THEY WERE in the tree on 2026-10-09 ~11:20 UTC (play was still building); re-run
`server/forge3/play-cert.js` after any change to `src/play/**`.

## 1. What forge already does with play's files (no change needed from play)

- **Live composition** (`server/forge3/live.js`, called by `server/studio/seam.js composeAsk` on a game / animation /
  simulation ask): compose()'s ladder admits a play piece by the coverage file (`skills[skillId]`, else the topic's first
  `entries` row, the same rule as `server/play/levels.js entryFor`; `excluded` topics never), then calls play's own
  `startSession(child, { skillId, topicId, goal, lessonId, art, lastArt }, q)` (learner read bounded at 350 ms, then the class
  defaults), and puts `{ kind: "play", stage, play: { sessionId, family, mode, skillId, topicId, art, levelId }, boardTwin }`
  on the Studio slot. `boardTwin.board` is `logic.board(level, logic.init(level))`; the facts row is `logic.facts(...)`
  (numbers and ≤ 24-char strings only). forge writes no level, key, word or art.
- **Art**: the art is play's `pickArt` result (inside startSession, with the lesson's last art); forge only swaps it when
  `server/forge3/certs/play.json` says that art FAILED for the (family, mode, class band) and another art passed.
- **Rendering on the Desk**: `src/studio/renderers.ts` registers `src/play/PlayStudioRenderer.tsx` (build-time glob);
  `src/studio/StudioStage.tsx` gives a play piece the WHOLE tray (no fixed aspect) and, when the renderer emits
  `{ type: "error", message: "layout" }`, shows the piece's board twin; a box that later grows by ≥ 8% retries the piece.
- **Certification** (`server/forge3/play-cert.js`): every coverage entry, the levels play's picker serves to fresh children
  (2 seeds), in every art in `FAMILY_ARTS`, on `src/play/PlayStage.tsx` in play mode at 360 × 576, 412 × 691 and 1006 × 768,
  judged by `server/forge3/qa/checks.js` with `FLOORS` (classes 4-5 at `textYoung`). Output `server/forge3/certs/play.json`.

## 2. What forge measured that play needs to act on (bug reports, with the shot paths in RESULTS.md §4)

0. **(found 11:45, already fixed by play by ~12:05 UTC)** every `POST /api/play/*` route re-read a request body the router
   had already consumed (`server/router.js` passes it as the handler's third argument): on a real server `/api/play/start`
   answered `400 childId required` and `/api/play/level` `400 bad_session`, so every play piece fell to its board twin.
   The current `server/play/routes.js` takes the router's body; forge's last measurement copy needed no local fix.
1. **The Desk tray is smaller than `MIN_BOX` on two of the three judged screens without play mode.** `PlayStudioRenderer`
   refuses boxes under `src/play/core/box.ts MIN_BOX` (300 × 440 now; 300 × 420 when measured). The Desk's Studio tray box (taxila.dev geometry, a 1-2 line card) is 324 × 400 on a 360 × 800 phone, 376 × 515
   on 412 × 915 and 736 × 392 on a 1366 × 768 laptop; with a 4-line card the 360 phone gives 324 × ~313. So without play
   mode a play piece shows as the game on the 412 phone only, and as its board twin on the 360 phone and the laptop
   (measured through the real StudioStage, RESULTS.md §3). Play's patch 04 (Desk play mode: the card folds, the tray takes
   its height) is what makes play pieces playable on those screens; forge's final measurement copy includes it (RESULTS.md
   §1). A landscape arrangement for short, wide boxes (≥ 700 × 380) would still help a laptop whose tray stays short.
2. **The class 4-5 text floor.** `FLOORS.textYoung` is 16 px; play's own chrome renders some labels at 14 px for classes
   4-5 ("Split & Merge", "On the Line" titles; the strips goal line), so those pieces fail Q1 at every size for c4-c5.
3. **The goal line is ellipsised at 360 px** on some atoms levels ("Pair the matching atoms, then name the LCM" clipped:
   Q2 at 360 × 576).
4. **Canvas-drawn labels overlap** (found with the canvas probe, `server/forge3/qa/measure.js canvasTextProbe`, 12:40 UTC):
   a nishana compare level for c5 (0 to 1,00,000, kagaz) draws every tick label over its neighbours — Q3 with 11 overlaps
   at 360 × 576, 10 at 412 × 691 and 1 at 1006 × 768 — seen live in a lesson at 360 × 800 (RESULTS.md §1, §4); a kyun-lab
   fair-test level has 2 overlapping labels at 360. The tick labels need thinning (label every k-th major tick, or the
   ends plus the landmark only) when `labelWidth > tickGap`. Full re-certification numbers: RESULTS.md §4.
5. **The board twin is thin for some levels**: strips "make" levels start from one unsplit bar, so the twin reads
   "Barabar hisse / 1: 0 (0/1)". The twin is what a 360-phone child sees until play mode lands; it should carry the goal
   (e.g. the target fraction) when the goal is on screen in the game too.

## 3. What forge still needs from play

1. **Register `/api/play/*`** (play patch 01, now written). Without `/api/play/level` the renderer cannot fetch the level and
   the stage shows the twin.
2. **Play mode on the Desk** (play patch 04, now written). Patch order with forge: both orders apply cleanly on HEAD
   (play 01-05 then forge 01-07, and forge first), checked with `git apply` on a HEAD export 2026-10-09; forge 07 touches
   `WorkTray.tsx studioToLesson` and `useDesk.ts` away from play 04's hunks.
3. **Keep `FLOORS` the single source**; forge reads them (`src/studio/boardFit.ts`, `server/forge3/qa/checks.js`).
4. **Evidence**: forge writes no `studio_mount` row for play pieces (its source check admits Studio sources only); play's
   grade path is where a played level becomes evidence (GRAMMAR §7).

## 4. What the forge gate says about a play piece

`server/forge3/certs/play.json` → `pieces["family/mode"]["art@c4|c7"]` → `{ byViewport: { p360, p412, l1366 }, n, fails }`
(a cell passes a size only when every sampled level passed there) plus `samples[]` (one row per level and art). live.js
offers an art only where the cell did not fail; a (family, mode, art) that fails is a play-stream bug report, not a forge
override.
