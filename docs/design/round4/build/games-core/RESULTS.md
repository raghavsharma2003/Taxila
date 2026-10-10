# Round 4 · G1 games core + Antariksh · RESULTS

**Branch:** `claude/r4-games-core` · **Base:** `claude/blissful-mayer-icwe2j` @ 0e4bb7b6 · **Started:** 2026-10-10.
**Honesty:** nothing here has met a child or run on a phone. Every frame-rate and load number is a **proxy**: headless
Chromium (build 1194) with SwiftShader software GL on a shared cloud container, with `engine=3d` forcing the engine past
the software-GPU tier rule. Real-phone frame rate is **NOT measured** (it needs the owner's device, O-R4).

## 1. What is built

| item | where | state |
|---|---|---|
| Day 0 core API contract (for G2) | `CORE-API.md`, `src/play/engines/core3d/api.ts` | pushed day 0 (5120a58c) |
| S0.3 rule split | `server/play/tools/rules/<family>.mjs` + `index.mjs` | done; byte-identical (§3) |
| shared 3D core | `src/play/engines/core3d/{stage3d,labels,audio,progress,tier,dress,host}.ts` | done |
| PlayStage integration | `src/play/PlayStage.tsx` | the controller lives per level; 3D when an engine renders the law and the tier allows, else the round-3 2D view (also the board twin after a context loss / frame errors / load timeout, with the same controller) |
| E1 Antariksh | `src/play/engines/antariksh/{index,world}.ts`, `data/play/reactions/antariksh.json` | place / compare / round as aim → fire → decloak and fly-into-gate; doors as warp gates; 3 themes × 3 wrappers |
| the dress delta | `server/play/dress.js`, `POST /api/play/dress` | taxila-fast, closed enums, field-by-field, 1.9 s deadline, base otherwise |
| focusMal from `misconception_seen` | `server/play/start.js`, `src/play/core/pick.ts` | done |
| economy lint in `npm test` | `tests/r4-games-core-economy.test.mjs` | done, with negative controls |
| picker novelty + harder door | `server/play/levels.js nextBody` | fixed (novelty never fired server-side) |

## 2. How the lesson seam stays unchanged

`PlayStudioRenderer → PlaySession → PlayStage` is the same path; the engine is chosen inside `PlayStage`. Acts still go
through `PlayController.dispatch` and `/api/play/act`; the server still regenerates the level from the signed session and
replays the raw acts; signed evidence still folds through `lessonBridge` as `via: "game"` × 0.5; voice still maps the
closed grammar onto control ids (`commit`, `nudge-*`, `round-*`, `order-*`, kept as `voiceOnly` controls where the spatial
act is the primary one). The only additions on the wire are optional: `dress` on level responses, `engine` on act posts
(chooses her words for the screen; never graded), `POST /api/play/dress`.

## 3. Numbers (method, n, date: 2026-10-10)

| measure | before | after | method · n |
|---|---|---|---|
| S0.3: `build-coverage --check` output, `coverage.json` sha256 | — | identical | 1 build each |
| S0.3: play tests (`tests/play-*.test.mjs` + `round3-fix`) | 180/180 | 180/180 | node --test |
| economy lint | did not exist | 8/8; planted violations trip 6/6 rules | `tests/r4-games-core-economy.test.mjs` |
| Antariksh browser contract | — | 7/7 | `tests/r4-games-core-engine.test.mjs` (SwiftShader, 360 × 800) |
| server Game Director (dress, focusMal, doors, C6 words) | — | 9/9 | `tests/r4-games-core-server.test.mjs` |
| engine + 3D stage download | — | engine 8.9 KB br, stage + three.js 108.9 KB br (on demand only) | vite build, brotli q11 |
| play chunk (all play routes) | 231 KB br (three bundled in after the first wiring) | 127 KB br | same |

(The C1-C10 table, frame rate, cold load, shots and video are added below as they are measured.)

## 4. Environment notes

- The container's Playwright browsers are build 1194; the repo's Playwright 1.63 expects 1243. Test and harness runs use a
  scratch `PLAYWRIGHT_BROWSERS_PATH` that aliases the 1194 binaries under the 1243 names (nothing in the repo or `/opt`
  changes).
- In this container `tests/engines-browser.test.mjs` fails 60 cases identically on the untouched base (the older
  Chromium words its CSP message "Refused to connect …", which the test's noise filter does not match): environment, not
  this branch. CI installs its own browser.
- `tests/eyes.test.mjs` "health … 503 without one" needs no `DATABASE_URL` in the test env (CI has none); the gate runs use
  only `TEST_DATABASE_URL` / `CONDUCTOR_TEST_DATABASE_URL`, as CI does.
- One gate run saw `voice-cascade` "duck within ~150 ms" fail at 361 ms while a SwiftShader audit loaded the machine; it
  passes 3/3 on a quiet host. Gate runs since are made with the machine otherwise idle.

## 5. Patch requests (`patches/APPLY.md`)

01 her speaking signal for the music duck (`src/lesson/runtime.ts`, stream 3) · 02 the parent's fire / scan switch
(`child_controls.play_verb` migration + `/api/parent/controls`, main) · 03 the game at the practice beat
(`server/studio/seam.js` + `server/forge3/live.js`, stream 2).

## 6. Not met yet / next

In progress: the full C1-C10 certificate per Antariksh skill (C4 audit at three sizes × three themes × two class bands is
running; frame rate at 4× throttle; cold load at 1.2 / 3 / 10 Mbps; C9 on a local production build, asked and at a practice
beat); `certs/play.json` regenerated with both renderers; shots and a webm per theme at all three sizes; round3-play on
this tree.
