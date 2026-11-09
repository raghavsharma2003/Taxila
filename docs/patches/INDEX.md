# Cross-stream patches: index and status

Written 2026-11-09 by the docs audit (`docs/design/round7/audit/docs-memory.md`, DOCS-39), on `int/r6` at integration 21a.
The rule for these files is PIPELINE.md §O: the author commits `to-<owner>/NNN-<slug>.patch` and messages the owner, who
applies it.

**How the status was found.** "applied" means `git apply --check -R` passes: the patch reverses cleanly, so its exact
change is in the tree. "landed" means it no longer reverses (the file was edited afterwards) but its added lines are
there. The "lines" column is how many of the patch's added lines (12 characters or longer) are found in the target files.
A `.md` file is a written ask, not a patch; its status is in the note where it was checked.

**Numbers collide.** Authors numbered per author, not per folder, so numbers repeat inside `to-brain` (four files
numbered 001, three 002, three 005, two each of 003, 008 and 011), `to-app` (three 001, two 002), `to-platform` (three 001)
and `to-voice` (two 001, no 002). Always cite a patch by its full file name.

**Open items: 3 of 45 patches.**

## from-platform

| File | Status | Lines | Target | Note |
|---|---|---|---|---|
| 001-cost-ledger-call-sites.md | written ask | — | — | Lesson rollup, TTS, D5 and image call sites are in. The STT row is not: `sttSession` in `server/cost/meter.js` has no caller in `server/voice/stt.js`. |
| 002-d5-relay-ticket.md | written ask | — | — | Not checked. |

## to-app

| File | Status | Lines | Target | Note |
|---|---|---|---|---|
| 001-face-teacher-stills-ledger.patch | applied | 20/20 | `src/child/art.tsx`, `src/ui/Art.tsx` |  |
| 001-handsfree-default.patch | **not applied** | 0/8 | `src/child/copy.ts`, `src/child/prefs.ts` +1 | None of its 8 added lines are in the tree: `src/child/prefs.ts` still defaults `talk: "tap"` and carries a separate `handsFree` pref. `tests/r7-voice-handsfree.test.mjs` asserts on this patch's text. Routed to the app audit. |
| 001-school-here.md | written ask | — | — | Landed. |
| 002-face-landing-portrait-own-still.patch | applied | 4/4 | `src/app/landing/Site.tsx` |  |
| 002-handsfree-first-frame.patch | landed, edited since | 7/15 | `src/child/lesson/useDesk.ts` | 7 of 15 added lines are in the tree. |
| 003-face-hello-clip-visemes.patch | applied | 5/5 | `src/child/voice.ts` |  |
| 004-face-home-daily-greeting.patch | landed | 12/13 | `src/ui-v3/kaksha/Shell.tsx`, `src/ui-v3/kaksha/screens/KakshaHome.tsx` +1 | 12 of 13 added lines are in the tree; later edits changed the rest. |
| 005-face-teachback-protege.patch | applied | 3/3 | `src/child/lesson/TeacherWindow.tsx` |  |
| 006-face-retire-teacher-shims.patch | applied | 3/3 | `src/app/childStubs.tsx`, `src/ui/index.ts` |  |
| 007-coldstart-answers.md | written ask | — | — | Landed (the ask is in `src/onboarding/ChildProfile.tsx`). |

## to-brain

| File | Status | Lines | Target | Note |
|---|---|---|---|---|
| 001-board-pointing-truth.patch | landed | 34/34 | `server/brain/turn.js`, `server/director/shapes.js` +1 | Every added line is in the tree; the file has moved on, so it no longer reverses cleanly. |
| 001-gameact-turn.patch | applied | 45/45 | `server/brain/turn.js`, `tests/r7-brain-gameact.test.mjs` |  |
| 001-learner-view.md | written ask | — | — | Landed. |
| 001-talking-rules-spoken-register.patch | landed | 47/49 | `server/compiler/characters/arjun.js`, `server/compiler/characters/asha.js` +5 | 47 of 49 added lines are in the tree; later edits changed the rest. |
| 002-board-prewarm-lookahead.patch | applied | 8/8 | `server/brain/turn.js` |  |
| 002-play-verbs-new-modes.patch | landed | 11/11 | `server/director/play-verbs.js` | Every added line is in the tree; the file has moved on, so it no longer reverses cleanly. |
| 002-start-refusal-limits.patch | landed | 1/1 | `server/routes/lesson.js` | Every added line is in the tree; the file has moved on, so it no longer reverses cleanly. |
| 003-contracts-learner-view.patch | landed | 23/24 | `shared/contracts.ts` | 23 of 24 added lines are in the tree; later edits changed the rest. |
| 003-studio-slot-eta.patch | applied | 2/2 | `server/brain/turn.js` |  |
| 004-play-verbs-kila.patch | landed | 4/4 | `server/director/play-verbs.js` | Every added line is in the tree; the file has moved on, so it no longer reverses cleanly. |
| 004-question-jar.md | written ask | — | — | Landed (see 004b). |
| 004b-question-jar.patch | landed | 87/88 | `server/brain/turn.js`, `server/director/shapes.js` +4 | 87 of 88 added lines are in the tree; later edits changed the rest. |
| 005-leak-guard-numerals.md | written ask | — | — | Follow-up open: `PINNED_ITEMS` is still in `scripts/kits/w5-filter-numerals.mjs`; the note says it is removed when the guard lands. |
| 005-map-marks-equip-contracts.patch | applied | 7/7 | `shared/contracts.ts` |  |
| 005-play-verbs-naksha.patch | landed | 5/5 | `server/director/play-verbs.js` | Every added line is in the tree; the file has moved on, so it no longer reverses cleanly. |
| 006-lesson-brief.md | written ask | — | — | Landed. |
| 007-homework-start.md | written ask | — | — | Landed. |
| 008-app-child-memory-route.patch | landed | 23/25 | `server/relational/routes.js` | 23 of 25 added lines are in the tree; later edits changed the rest. |
| 008-explain-format.md | written ask | — | — | Landed. |
| 009-studio-slot-skill.patch | landed | 3/3 | `server/brain/turn.js` | Every added line is in the tree; the file has moved on, so it no longer reverses cleanly. |
| 010-studio-slot-item-open.patch | applied | 3/3 | `server/brain/turn.js` |  |
| 011-db-probe-timer-unref.patch | applied | 2/2 | `tests/r5-safety-distress-beside.test.mjs`, `tests/relational-db.test.mjs` |  |
| 011-script-scene-ref.patch | **pending** | 0/14 | `server/brain/propose.js`, `server/director/script.js` +2 | `sceneRef` is nowhere in `server/`, `src/`, `shared/` or `tests/`. `docs/design/round7/studio/BOARD-REFS.md` still calls it a draft. Routed to Brain. |
| 012-studio-child-text-final.patch | landed, edited since | 2/3 | `server/routes/lesson.js` | 2 of 3 added lines are in the tree. |
| 013-hops-and-square-units.patch | landed, edited since | 2/5 | `server/brain/say.js` | 2 of 5 added lines are in the tree. |
| 014-screen-par-dikhao.patch | landed in another form | 0/3 | `server/director/requests.js` | `server/director/requests.js` reads "screen par dikhao"; the regex has been edited since, so the patch's own line is not there. |
| 015-second-view-words.patch | applied | 19/19 | `server/brain/propose.js`, `server/brain/say.js` +1 |  |
| 016-harness-page-up.patch | landed | 11/13 | `evals/hybrid-side-by-side.mjs` | 11 of 13 added lines are in the tree; later edits changed the rest. |
| 017-harness-card-page.patch | **partly; the rest is likely overtaken** | 5/10 | `evals/hybrid-side-by-side.mjs` | Its S9b half (`shownKind`, `avoidKind`) is in the harness through patch 018. Of its S9 half, "the picture request on the first page only" is in the harness (Brain, v6.6); the `ofCard` / `cardPage` pass-through is not. The held board (`dc-r7-held-board`) drops line-driven paging, so this is probably no longer needed: Brain confirms. |
| 018-harness-page-up-kind.patch | applied | 6/6 | `evals/hybrid-side-by-side.mjs` |  |

## to-learning

| File | Status | Lines | Target | Note |
|---|---|---|---|---|
| 001-bands-derive-from-shared.patch | applied | 11/11 | `server/learner/bands.js`, `server/learner/model.js` |  |
| 002-face-onboarding-teacher-direct.patch | applied | 8/8 | `src/onboarding/Setup.tsx`, `src/onboarding/steps/Meet.tsx` |  |
| 003-db-probe-timer-unref.patch | applied | 3/3 | `tests/comprehension-db.test.mjs`, `tests/comprehension-w1c-db.test.mjs` +1 |  |
| 004-signin-code-links.patch | applied | 8/8 | `src/onboarding/Account.tsx`, `src/onboarding/Forgot.tsx` |  |

## to-platform

| File | Status | Lines | Target | Note |
|---|---|---|---|---|
| 001-drain-test-wait-for-request.patch | landed in another form | 0/2 | `tests/graceful-shutdown.test.mjs` | `tests/graceful-shutdown.test.mjs` waits with an `inFlight(requests)` helper instead of the patch's loop. |
| 001-placement-routes.patch | landed | 1/2 | `server/index.js` | The file is not a valid patch (`git apply --check`: "No valid patches in input"), but its change is in `server/index.js` (the placement route table is registered). Its note says the spread in `server/routes/child.js` goes once applied; that spread is still there. |
| 001-speech-region-2.patch | applied | 5/5 | `scripts/deploy-azure.mjs` |  |
| 002-signin-code-routes.patch | applied | 3/3 | `server/index.js` |  |

## to-studio

| File | Status | Lines | Target | Note |
|---|---|---|---|---|
| 001-box-contract-stage-first.patch | applied | 40/40 | `server/forge3/certs/box-contract.json` | Applies both ways because it only adds a block; the block (`stageFirst`) is in `server/forge3/certs/box-contract.json`. Do not apply it again. |
| 002-ofcard-to-client.patch | applied | 14/14 | `server/stagecraft/board-first.js`, `server/studio/seam.js` +1 |  |

## to-voice

| File | Status | Lines | Target | Note |
|---|---|---|---|---|
| 001-first-clause-board-hold.patch | landed | 18/18 | `src/lesson/ttsStream.ts` | Every added line is in the tree; the file has moved on, so it no longer reverses cleanly. |
| 001-game-utterance-ack.patch | applied | 10/10 | `src/lesson/runtime.ts` |  |
| 003-app-ask-transcribe-childid.patch | applied | 5/5 | `server/routes/voice.js` |  |

