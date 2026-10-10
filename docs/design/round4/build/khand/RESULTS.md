# Round 4 · G2 Khand · RESULTS

**Stream:** G2 (`claude/r4-khand`, draft PR #3). **Date:** 2026-10-10. **Own DB:** the stream's Neon TEST branch.

**Honesty.** No child has used any of this. Every frame rate, load time and screenshot here comes from headless Chromium
with SwiftShader (software GL) in this cloud sandbox: it is a **proxy, not a phone**. "Grades" are code against code (an
independent oracle), not learning. The lesson-loop replies were written by the lesson stack's Azure models on a local
production build.

## 1. What is built

| piece | where | state |
|---|---|---|
| **Nazariya law**: one height-map block plot under five modes (views; arrays as multiplication; floor vs fence; square and cube numbers; mirror completion). Generators, solvers, shortcut search, kit mal-rules, board twin; every number and key from code | `src/play/families/nazariya/` | done |
| **Khand engine** as a core3d@1 engine (`create(core, deps) → EngineView`). Greedy chunk mesher with corner AO in a Web Worker (main-thread fallback), pooled GPU buffers, code-drawn block atlas, voxel terrain with themes (mitti / barf / jungle). Orbit, true orthographic front / side / top views, first-person walk with a stick. Tap to build or break, drag to lay or clear a layer, pinch zoom. Projection walls (views), glass (mirror), live fence (floor), DOM labels, a keypad for counts | `src/play/engines/khand/` | done |
| **Thin core3d adapter** until G1 merges: G1's `api.ts` and `tier.ts` verbatim, plus a minimal Core3D host (`shim/stage3d.ts`): real-box canvas, ratchet governor, labels with audit, progress store, audio bus, context loss, tier. Also Khand's registry line. three.js and the engine load on demand (tree-shaken) | `src/play/engines/khand/shim/` | done; **the port is a delete** |
| **2D board twin** (same controller, same control ids) for tier 2d / context loss / frame errors | `src/play/families/nazariya/plot.view.ts` | done |
| **Coverage rules**: 15 rules over 11 class 4-6 maths topics, every mal-rule mapped to a verified kit misconception (checked by build-coverage). Exports `family` for G1's S0.3 loader | `server/play/tools/rules/nazariya.mjs` | done |
| **Reaction bank**: conditioned shapes in en / hinglish / hi; no verdict words; the key is never said | `data/play/reactions/nazariya.json` | done |
| **Builds persist** as artefacts: `play_build`, written only from the server's own replay of a solved level; heights only; `GET /api/play/builds` | patch 06 (+08) | done on my DB |
| No music in Khand (O-G2); nothing alive destroyed ("Break" removes blocks); no points, streaks, lives, timers, random drops or persisted counters (G1's economy lint rules: no clock or RNG in progress code; cosmetics only) | | by construction |

Coverage moves from 47 to 57 topics in `data/play/coverage.json` (maths 32 → 42).

## 2. The certificate (BUILD-PLAN §3.1 C1-C10), claimed topics

Claimed (11): c4-maths-ch02-t01 (views), c4-maths-ch09-t01 (arrays), c5-maths-ch11-t01 / t02 / t03,
c6-maths-ch06-t01 / t02 (area and perimeter), c6-maths-ch01-t01 (square and cube numbers), c4-maths-ch11-t02,
c5-maths-ch10-t02, c6-maths-ch09-t01 (mirror).

| # | check | result | instrument (n, method, date) |
|---|---|---|---|
| C1 | admitted by a skill | **met**: 15 entries, every ACTS skill exists in its kit; `entryFor(skill)` lands on a Nazariya entry that exercises it | `build-coverage --check`; `tests/r4-khand-server.test.mjs` (node, 2026-10-10) |
| C2 | law, solver, shortcut-free; generator p95 ≤ 50 ms | **met**: every generated level is solvable and shortcut-free, and the solver's acts grade solved and clean. Generator p95 ≤ 12 ms per mode (n = 60 requests per mode, single node process; it was 53.7 ms under the full parallel suite before the floor-best memo) | `tests/r4-khand-law.test.mjs`; `tests/play-server.test.mjs` (every entry × fade) |
| C3 | 0 wrong grades over ≥ 2,000 random acts per mode; forged, tampered and replayed acts refused | **met**: **0 wrong grades over ≥ 5,000 acts per mode** (≈ 25,000 acts, 2,400+ graded logs: solves, mal-rules, near misses, junk) against an oracle written without the law. Claim fields, tampered plots and cross-level replays are refused. On the server, an edited session → 400 and a foreign level id → 409 for all 15 entries | `tests/r4-khand-law.test.mjs`; `tests/prod/r4-khand-loop.mjs` K3/K4 (local prod, 2026-10-10) |
| C4 | fit at 360 × 800, 412 × 915, 1366 × 768: text ≥ 14 / 16 px, numerals ≥ 18, targets ≥ 44, 0 overflow, 0 clipped | **met on the proxy**: **104 shots, 0 failures**. 13 mode/goal cases × 3 sizes, engine and 2D twin, plus mistake and solved states at 360, rotating the four art directions. In the real lesson Desk: 9/9 views pass (three asks × three sizes) | `tests/prod/r4-khand-shots.mjs --shots`; `r4-khand-loop.mjs` A1 (headless, 2026-10-10) |
| C5 | ≥ 80% of graded acts are manipulations | **met by design** (not separately counted): every goal is built (place / layer / break); the only non-spatial commits are a count (array, powers), a same/different prediction (turned array) and the check | the law's act grammar |
| C6 | words: 0 verdict words, 0 unrevealed keys, 0 floor violations | **met**: every shape × language passes the play guard and the lesson floor. Every `{?why=}` names a refusal the law makes and every `{?mal=}` a mal-rule it implements. The key was never spoken on any mal path; K6 found 0 bad lines on the live server | `tests/r4-khand-server.test.mjs`; loop K6 |
| C7 | signed evidence folds `via: "game"`; a forged token folds nothing | **met**: one `kt_evidence` row via game; the same tokens again and a forged token fold nothing | loop P8 (local prod, own Neon branch) |
| C8 | no reward economy | **met by construction**; G1's economy lint has not yet run on this tree (it is on G1's branch) | code review; `tests/play-style-lint.test.mjs` |
| C9 | reachable in a lesson when asked and at a practice beat, through the server grade into the ledger | **asked: met** ("game khelna hai" on perimeter and arrays, "can we play a game?" on views: the play slot is `nazariya/<mode>` and the block world is on the stage). **Practice beat: not measured** (see §4) | loop A1 / P8, 139/139 checks (local prod, 2026-10-10) |
| C10 | ≥ 50 fps median at 4× throttle (proxy) | **met at 360 only**: 54-55 fps at 360, **40-47 at 412, 16-18 at 1366** (see §3) | `r4-khand-shots.mjs --fps` |

## 3. Numbers (proxy unless said)

**Frame rate**: 4× CPU throttle, camera orbiting so every frame renders, 10 s per run, `tier=3d` override (SwiftShader
would otherwise get the 2D twin), DPR 1 (the contract's floor for tier 3d), load average 1.2-4.6 on 4 cores, 2026-10-10:

| world box | views | floor | powers (cube) | our JS per frame (p50 / p95) | draws / triangles |
|---|---|---|---|---|---|
| 360 × 447 | 54.4 | 54.2 | 55.0 | 1.3-4.1 / 3.5-7.3 ms | 5-11 / 7-9k |
| 412 × 567 | 46.8 | 40.3 | 41.8 | 1.4-4.0 / 3.7-7.1 ms | same |
| 1006 × 768 | 15.7 | 15.8 | 17.6 | 1.4-4.3 / 4.0-8.5 ms | same |

Reading: frame rate falls with pixels (161k → 233k → 773k), while our JS stays at 1-4 ms. The bound is SwiftShader's
software fill in the GPU process, which the CPU throttle does not touch (FEASIBILITY §5.3 saw the same). That is ~9
Mpx/s here, far below a phone GPU. The scene is 5-11 draws and under 10k triangles, against tier budgets of 80 / 150k.
**C10 is unmet at 412 and 1366 on this proxy**, and the phone run is owner-dependent (O-R4).

**The re-mesh path** (the prototype's main-thread re-mesh was 8.2 ms p50 / 19.1 ms p95): an edit every 250 ms, n = 40 per
run. The mesh runs **in the worker**: 0.1-0.2 ms p50 / 0.2-2.0 ms p95. The main thread does no meshing. Worker round trip
4-17 ms p50; the main-thread frame p50 stays 16.7 ms at 360 / 412.

**Greedy meshing** (node, exact): 4×4×4 cube 80 → 9 quads; 6×4 floor 44 → 5; 9×9 pit with paving 165 → 9. It covers
exactly the naive faces on 300 random builds.

**Cold load to the first world frame** (the dev page, which carries every play family; brotli; cache off; 4× CPU; n = 3 per
profile): 10 Mbps / 60 ms **1.5-1.6 s** (one cold 3.7 s); 3 Mbps / 150 ms **2.3-2.5 s**; 1.2 Mbps / 300 ms **4.4-4.5 s**;
350-384 KB. In the app bundle the engine is its own 36 KB (14 KB gz) chunk and three.js stays tree-shaken
(217 + 318 KB as before), loaded only when a Khand level mounts.

**API latency** (local prod, this sandbox): start p90 295 ms, act p90 149 ms (n = 15 / 94).

**Lesson seam line** (P8, model-written by the lesson stack): *"Riya, aapne rectangle ki chaaron sides jodkar perimeter 12
nikala…"*. In the first run she said *"perimeter 9"* for a 3 × 3 floor (fence 12): the facts row said `floor=9 fence=12
sides=3x3`. The row now says `area=9 perimeter=12 rect=3 by 3`, and the re-run read it right (n = 1 each, model output).

## 4. Not met, and why

- **C10 at 412 and 1366 on the proxy** (above). There is nothing left to govern at the contract floor (DPR 1). Fixing it
  needs either a real GPU (the phone run, O-R4), or a lower DPR floor for tier 3d: G1's contract, owner/G1 decision.
- **C9 "at a practice beat"**: not measured. The browser loop measured the asked path only. Whether the Director offers
  the game unprompted is the Director's rule (stream 2 / 4A); Khand is admitted to coverage, so that rule applies to it
  as to every family.
- **Cold load at 1.2 Mbps**: 4.4 s against a 3 s bar (dev page).
- **Class 4 typed lane**: class-4 children got no typed input in the practice page (voice-first), so the browser ask ran
  with class-5 children on the class-4 topics. Voice asks for class 4 are untested here.
- **Her words around the game** come from the Director, not Khand. In the views run she said "top view chuniye"
  ("choose") while the task is to build. That is outside this stream's files; reported to main.
- **Art**: the blocks and sky are drawn in code (no Azure image generation used). The owner has not judged the look.
- **Not built**: faces / edges / corners (c4-maths-ch01-t01, ◐ in FEASIBILITY), tilings (c7-maths-ch14-t02),
  directions on a block map (c5-maths-ch05-t01), turn symmetry (c5-ch10-t01, c6-ch09-t02) and congruence (c7-ch09) need
  laws this plot does not have (rotation of a figure, path following). The rest of F8 (Moon phases, shadows, light) is
  science and belongs to other engines.

## 5. Patch requests

`patches/01`-`09`, with `APPLY.md` (why, and the test that proves each). Two need main's attention:
- **06**: the migration number (`024` is a placeholder).
- **04**: drop it once G1's core3d lands, then add `KHAND_ENTRY` to `src/play/engines/registry.ts` and delete `shim/`.

## 6. Gates (local, own Neon branch, 2026-10-10)

`npx tsc -b`, `npx vite build`, `check-prompt-budget` PASS, `lint-ui` 353 (baseline). `npm test`: the remaining failures
are environment-only:
- `tests/engines-browser` fails because the container ships Playwright browser build 1194 while the repo wants 1243; G1
  sees the same on the untouched base.
- `tests/eyes` health check fails only when `.env.local` is loaded into the run.

The run's real failures (learner ratchet for `play_build`, the forge-live example topic, the generator p95 under load) are
fixed by patches 08 and 09 and the memo, and re-run green.

## 7. Owner decisions needed

1. Tier 3d's DPR floor (G1's `TIER_BUDGET`: 1.0): may Khand go to 0.75 on weak GPUs? Pixelated blocks survive it.
2. Whether unsolved free builds should also be kept in the gallery (today, only solved levels).
3. A real-phone run (O-R4) for C10.
