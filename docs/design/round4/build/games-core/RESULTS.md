# Round 4 · G1 games core + Antariksh · RESULTS

**Branch:** `claude/r4-games-core` (draft PR #7 → `claude/blissful-mayer-icwe2j`) · **Base merged:** 39c88fe ·
**Date:** 2026-10-10.
**Honesty:** nothing here has met a child or run on a phone. Every frame-rate and load number is a **proxy**:
- **Where:** headless Chromium (build 1194) on a shared 4-core cloud container.
- **Renderer:** SwiftShader software GL.
- **Forced path:** `engine=3d` forces the engine past the software-GPU tier rule. Production sends software GL to the 2D views.

**Real-phone frame rate is NOT measured.** It needs the owner's device (O-R4).

## 1. What is built

| item | where | state |
|---|---|---|
| Day 0 core API contract (for G2) | `CORE-API.md`, `src/play/engines/core3d/api.ts` | pushed day 0 (5120a58c) |
| S0.3 rule split | `server/play/tools/rules/<family>.mjs` + `index.mjs` | done; byte-identical coverage; new families drop in a file |
| shared 3D core | `src/play/engines/core3d/{stage3d,labels,audio,progress,tier,dress,host}.ts` | done (DOM labels with floors and keep-in-box, frame governor, context loss → 2D, audio bus with the voice duck, traced progress store) |
| PlayStage integration | `src/play/PlayStage.tsx` | one controller per level; 3D when an engine renders the law and the tier allows, else the round-3 2D view; the 2D view is also the board twin after a context loss / frame errors / load timeout, with the same controller and acts |
| E1 Antariksh | `src/play/engines/antariksh/{index,world}.ts`, `data/play/reactions/antariksh.json`, `data/play/engine-words.json` | place / compare / round as aim → fire → decloak; fly-into-gate; doors as warp gates; 3 themes × 3 wrappers; all 18 Nishana skills on 12 topics |
| the dress delta | `server/play/dress.js`, `POST /api/play/dress` | taxila-fast, closed enums, validated field by field, 1.9 s deadline, base dress otherwise; no model string reaches the child |
| focusMal from `misconception_seen` | `server/play/start.js`, `src/play/core/pick.ts` | done; also `nextFocus` at the door |
| economy lint in `npm test` | `tests/r4-games-core-economy.test.mjs` | 8/8, planted violations trip 6/6 rules |
| picker novelty + harder door | `server/play/levels.js nextBody` | fixed (novelty never fired server-side) |
| kill switches | `TAXILA_PLAY=off` (admits nothing), `TAXILA_PLAY_3D=off` (2D views only) | done, tested |
| E1 angles (`kon`) | `src/play/families/kon/{kon.logic,kon.view}.ts`, `server/play/tools/rules/kon.mjs` | a new small law:<br>• turn (c5-maths-ch03-t01; mal-rules cw-confuse, half-is-quarter)<br>• set on a two-scale protractor (c6-maths-ch02-t03; mal-rule wrong-scale)<br>2D dial only, **no 3D mode**; off the play map |

## 2. How the lesson seam stays unchanged

`PlayStudioRenderer → PlaySession → PlayStage` is the same path; the engine is chosen inside `PlayStage`. Acts still go
through `PlayController.dispatch` and `/api/play/act`; the server regenerates the level from the signed session and
replays the raw acts; signed evidence folds through `lessonBridge` as `via: "game"` × 0.5; voice maps the closed grammar
onto control ids. Only optional fields are added on the wire: `dress` on level responses, `engine` on act posts (chooses
her words for the screen, never graded), `POST /api/play/dress`.

## 3. Certificate C1-C10 (BUILD-PLAN §3.1)

**Antariksh (Nishana law), all 18 admitted skills on 12 topics.**

| # | result | evidence |
|---|---|---|
| C1 | **pass**: admitted by skill | `build-coverage --check` ok (87 skills admitted across families) |
| C2 | **pass** | the Nishana law is round 3's: `tests/play-logic.test.mjs` and `play-server.test.mjs` green in `npm test` |
| C3 | **pass**: same battery (≥ 2,000 random acts per mode, forged / tampered / replayed refused) | same |
| C4 | **pass**, two instruments | **forge3 cert** (`server/forge3/certs/play.json`): 28/28 Nishana cells pass at 360 / 412 / 1366. That is 2D in 4 art directions plus 3D in 3 themes, × class bands 4 and 7.<br>**Harness audit** (`results/audit-summary.json`): 18 skills × 3 themes × 3 sizes × 2 bands × aim / miss / hit. 308/324 on the first run. The 16 misses were one clipped gap label (c7-maths-ch03-t01 s1/s2, 360/412); fixed (eed81168), re-audit 36/36 (`results/audit-c7-maths-ch03-t01.json`) |
| C5 | **open question** | place and round are spatial acts (aim, fire). Compare is two placements then flying into the nearer/farther gate. A minimal compare solve is 2 manipulations of 3 acts (67%), under the 80% bar if a gate flight is counted as a pick. The act-log share was not measured. |
| C6 | **pass** | `tests/play-react.test.mjs`. The engine reaction bank is checked in `tests/r4-games-core-server.test.mjs`. C9c: every line she said in 18 skill runs passes the play guard |
| C7 | **pass** | `tests/play-evidence.test.mjs`, `play-ledger-seam.test.mjs`. C9c: exactly one `kt_evidence` row `via: "game"` per solved level, on the right skill |
| C8 | **pass** | `tests/play-style-lint.test.mjs` + the economy lint (no persisted counters, no wall clock in progress, no level-ending timers, no RNG after generation, every progress write traced, no economy words) |
| C9 | **partial** | **C9c**, per skill, through the server grade into the ledger: 145/145, re-run on a local prod build of 78b7a86b with prod routing: 145/145 again.<br>**C9a**, asked "game khelna hai": 8/12 topics give the game; the other 4 open the lesson on an s1 that play does not admit, and correctly offer no game for an untaught skill.<br>**C9b**, practice beat: **0/12, open**. Patch 03 builds the piece, but the Stagecraft reveal holds the practice slot; stream 2's "an admitted play piece beats the Stagecraft reveal" is needed. |
| C10 | **not met** (proxy) | median fps at 4× throttle: 360 px **42.6**, 412 px **28.9**, 1366 px **9.3**; bar 50. See §5. |

**Kon (angles), 2 topics / 4 skills.**
- **C1:** pass.
- **C2 / C3:** pass, in `tests/r4-games-core-kon.test.mjs`:
  - ≥ 2,000 random acts per mode, with claim fields mixed in;
  - an independent check of every solve;
  - generator p95 ≤ 50 ms;
  - every mal-rule lands on its own misconception;
  - set levels are never passable at 0 / 90 / 180.
- **C4:** forge3 cert 8/8 cells (4 arts × 2 goals at 3 sizes).
- **C9:** not run.
- **C10:** n/a (2D).

## 4. Numbers (method, n, date 2026-10-10)

| measure | before | after | method · n |
|---|---|---|---|
| S0.3 `coverage.json` | — | byte-identical after the split | `build-coverage --check` |
| gates on the merged tree 78b7a86b | — | tsc, vite build, prompt budget PASS, lint 353 (baseline 353); `npm test` 2698 tests: 2632 pass, 6 skipped, 60 fail (all the env-only `engines-browser` "browser:" cases, identical on the untouched base here) | full run, idle host |
| CI `gates` on PR #7 | — | green on 70251998; one red on eed81168 (kon had no Director verb), fixed by patch 04 | GitHub Actions |
| round3-play (local prod build, prod routing) | base 39c88fe: 93/93, start p90 676 / 473 ms | **93/93**, start p90 525 / 230 ms, act p90 113 / 119 ms | 2 alternating runs each. A first cold run on this branch read 844 ms (one miss) |
| economy lint | did not exist | 8/8; planted violations trip 6/6 | `tests/r4-games-core-economy.test.mjs` |
| Antariksh browser contract | — | 7/7 (CI too, after the wait-on-state fix) | `tests/r4-games-core-engine.test.mjs` |
| engine download | — | engine 8.9 KB br, stage + three.js 108.9 KB br, on demand only | vite build, brotli q11 |
| play chunk | 231 KB br | 127 KB br | same |
| cold load to the first 3D frame (355 KB) | — | 10 Mbps/60 ms **3.3 s** · 3 Mbps/150 ms **3.6 s** · 1.2 Mbps/300 ms **4.9 s** (medians) | harness `load`, n = 3 each, proxy |
| voice duck (music under her voice at 120 ms) | 5.1% of the bed (τ 40 ms) | **1.7-1.9%** (τ 30 ms) | harness `checks`, n = 3 |
| context loss | — | falls to the 2D board with the same acts (2 → 2), never blank | harness `checks` |
| reduced motion | — | particles 1×, the gap is still drawn | same |
| parent "scan" switch | — | the commit button reads "Scan karo" | same |
| music default | — | off for class 4, on for class 7 (the child's toggle wins) | same |

Media (`media/`): one webm per theme at each size (9, `media/video/`), and the miss state of each goal per theme and size
(27 + 2 kon dials, `media/shots/`). Results JSON: `results/`.

## 5. Frame rate (C10), what the proxy says

| viewport | DPR floor 1 (fps median, p95 ms) | DPR floor 0.75 (dd3ea5bd) | our JS work per frame p95 |
|---|---|---|---|
| 360 × 800 | 36.4, 50 | **42.6**, 50 | ~13 ms |
| 412 × 915 | 25.7, 67-83 | **28.9**, 67-83 | ~14-16 ms |
| 1366 × 768 | 9.3, 183-283 | 9.3, 217-233 | ~14 ms |

- **The scene:** 25 draw calls, 3,120 triangles, 4 textures.
- **Where the time goes:** the engine's own work stays around 13-16 ms at p95 at every size. Software rasterisation is the rest, and it saturates the 4 cores (load average about 4 during the runs).
- **What this proxy cannot say:** whether a phone GPU makes 50 fps. Only the reference-phone run can (O-R4).
- **Governor change:** the 3D tier may now step the backing store down to DPR 0.75. Labels are DOM, so text stays sharp. The governor only steps down when the frame-interval p95 is over 24 ms, and never steps back up.

## 6. Patch requests (`patches/APPLY.md`)

- **01:** her speaking signal for the music duck (`src/lesson/runtime.ts`, stream 3).
- **02:** the parent's fire / scan switch: `db/migrations/027_r4g_play_verb.sql` (final; main applies it) + `/api/parent/controls` (main).
- **03:** the game at the practice beat (`server/studio/seam.js` + `server/forge3/live.js`, stream 2).
  - **Skill order:** the current practice move's skill first, then earlier taught plan skills that play admits, never an untaught one.
  - **A declinable offer:** "not_this" brings the library piece back.
- **04:** kon's verbs in the Director's `PLAY_ACTS` (`server/director/play-verbs.js`).

01, 03 and 04 are applied on this branch as separate `[patch-request]` commits.

## 7. Environment notes

- **Playwright browsers:** the container's are build 1194; the repo's Playwright expects 1243. Runs use a scratch `PLAYWRIGHT_BROWSERS_PATH` that aliases the 1194 binaries (nothing in the repo or `/opt` changes).
- **`tests/engines-browser.test.mjs`:** fails 60 cases identically on the untouched base here. The older Chromium words its CSP message differently. Environment only; CI is green.
- **Gate secrets:** gate runs read only the two test database URLs from `.env.local`, in node, never through a shell. One earlier run echoed the session test-branch URL into a local task file. It was deleted, never committed or sent, and reported to the main session.
- **Migration 025:** my session database was branched at migration 023. The base's 025 was applied to it (own branch only) with `scripts/migrate.mjs`.

## 8. Not met / next

- **C9b** (practice beat): waits on stream 2's reveal rule; patch 03 is ready.
- **C10:** 42.6 / 28.9 / 9.3 fps on the software-GL proxy against a 50 fps bar. Real-phone frame rate is NOT measured (O-R4).
- **C5 for compare:** the share of manipulations is not measured; a minimal solve is 2 of 3.
- **Kon:**
  - no 3D (Antariksh) mode;
  - not on the play map;
  - no C9 run;
  - Director review of its verbs is pending (patch 04).
