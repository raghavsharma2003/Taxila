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
| **Builds persist** as artefacts: `play_build` (migration 026), written only from the server's own replay of a solved level; heights only; `GET /api/play/builds` | patch 06 (+08) | done on my DB |
| **Twin first, 3D streams in**: the 2D twin paints and is playable at once. The 3D world takes over at a turn-point with the same controller, and the 2D view comes back on any 3D failure | patch 04 (PlayStage), `shim/stage3d.ts` (`hidden`, `onReady`, `reveal`) | done |
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
| C8 | no reward economy | **met by construction**. G1's economy lint (`tests/r4-games-core-economy.test.mjs`) on the trial merge: lints 1 and 3 pass. Lint 2 (no wall clock) flagged Khand's re-mesh timing, which is now removed: a shipped Khand reads no clock. The only lines it still flags are in `shim/stage3d.ts`, the copy of G1's own allow-listed stage, which the port deletes | code review; `tests/play-style-lint.test.mjs` |
| C9 | reachable in a lesson when asked and at a practice beat, through the server grade into the ledger | **asked: met** ("game khelna hai" on perimeter and arrays, "can we play a game?" on views: the play slot is `nazariya/<mode>` and the block world is on the stage). **Practice beat: not met, including with G1's patch 03**: 0 of 3 lessons put the block world on the stage unasked, on base, with stream 2's `move.visual` line, and on a trial merge of G1 @d2177c80 (patch 03 included) + Khand. Where it drops is traced in §4 | loop A1 / P8, 139/139 checks; `tests/prod/r4-khand-beat.mjs` (local prod, n = 3 per run, 2026-10-10) |
| C10 | ≥ 50 fps median at 4× throttle | **not measured on device.** The SwiftShader proxy numbers (54-56 / 40-48 / 16-18 fps at 360 / 412 / 1366) are kept as a proxy only and never count as met. The main session decided (as delegate) that the tier-3d DPR floor stays 1.0; the real-phone run (O-R4, a ₹10k Android) decides C10 | `r4-khand-shots.mjs --fps` (proxy) |

## 3. Numbers (proxy unless said)

**Frame rate**: 4× CPU throttle, camera orbiting so every frame renders, 10 s per run, `tier=3d` override (SwiftShader
would otherwise get the 2D twin), DPR 1 (the contract's floor for tier 3d), load average 1.2-4.6 on 4 cores, 2026-10-10:

| world box | views | floor | powers (cube) | our JS per frame (p50 / p95) | draws / triangles |
|---|---|---|---|---|---|
| 360 × 447 | 54.4 | 54.2 | 55.0 | 1.3-4.1 / 3.5-7.3 ms | 5-11 / 7-9k |
| 412 × 567 | 46.8 | 40.3 | 41.8 | 1.4-4.0 / 3.7-7.1 ms | same |
| 1006 × 768 | 15.7 | 15.8 | 17.6 | 1.4-4.3 / 4.0-8.5 ms | same |

Drawing the sky after the opaque world (depth-tested) changed it to 56.4 / 47.9 / 17.5 for views: within the noise.

Reading: frame rate falls with pixels (161k → 233k → 773k), while our JS stays at 1-4 ms. The bound is SwiftShader's
software fill in the GPU process, which the CPU throttle does not touch (FEASIBILITY §5.3 saw the same). That is ~9
Mpx/s here, far below a phone GPU. The scene is 5-11 draws and under 10k triangles, against tier budgets of 80 / 150k.
**C10 is unmet at 412 and 1366 on this proxy**, and the phone run is owner-dependent (O-R4).

**The re-mesh path** (the prototype's main-thread re-mesh was 8.2 ms p50 / 19.1 ms p95): an edit every 250 ms, n = 40 per
run. The mesh runs **in the worker**: 0.1-0.2 ms p50 / 0.2-2.0 ms p95. The main thread does no meshing. Worker round trip
4-17 ms p50; the main-thread frame p50 stays 16.7 ms at 360 / 412. (Measured before G1's economy lint 2 applied. Khand now
reads no clock in a shipped build. The harness injects one, `__khandClock`, and times only the round trip: the
worker-side mesh ms is no longer taken in the browser. The node mesher test covers the mesh itself.)

**Greedy meshing** (node, exact): 4×4×4 cube 80 → 9 quads; 6×4 floor 44 → 5; 9×9 pit with paving 165 → 9. It covers
exactly the naive faces on 300 random builds.

**Cold load: twin first.** The 2D twin of the same level paints at once and is playable. The 3D world streams in behind
it and takes over at a turn-point with the same controller; acts made on the twin carry over. Dev page carrying every
play family, brotli, cache off, 4× CPU, n = 3 per profile, 384 KB, 2026-10-10:

| link | 2D twin playable | 3D playable |
|---|---|---|
| 10 Mbps / 60 ms | **0.88 s** (one cold run 2.3 s) | 1.6-1.8 s (cold 4.1 s) |
| 3 Mbps / 150 ms | **1.3 s** | 2.4-2.6 s |
| 1.2 Mbps / 300 ms | **2.1-2.2 s** | 4.4-4.6 s |

Before twin-first (3D only): the first world frame took 1.5 / 2.4 / 4.4 s, with nothing playable before it. In the app bundle the engine is its own 36 KB (14 KB gz) chunk and three.js stays tree-shaken
(217 + 318 KB as before), loaded only when a Khand level mounts.

**API latency** (local prod, this sandbox): start p90 295 ms, act p90 149 ms (n = 15 / 94).

**Lesson seam line** (P8, model-written by the lesson stack): *"Riya, aapne rectangle ki chaaron sides jodkar perimeter 12
nikala…"*. In the first run she said *"perimeter 9"* for a 3 × 3 floor (fence 12): the facts row said `floor=9 fence=12
sides=3x3`. The row now says `area=9 perimeter=12 rect=3 by 3`, and the re-run read it right (n = 1 each, model output).

## 4. Not met, and why

- **C10 is not measured on a device.** The SwiftShader numbers are a proxy only (CPU rasterising). The main session
  decided the tier-3d DPR floor stays 1.0. The phone run (O-R4) decides it. Proposed to G1, not built here: a frame-time
  governor behind a default-off flag that lowers the render scale only when measured p95 frame time on the real device
  is over budget.
- **C9 "at a practice beat": 0/3 in every run, including with G1's patch 03.** n = 3 lessons, 11 turns each, typed lane
  plus the NumberPad on numeric items, local prod, own Neon TEST branch, 2026-10-10:

  | run | route | lessons that offered the game unasked |
  |---|---|---|
  | base | `/practice/` | **0/3** (`results/beat-local-base.json`) |
  | with stream 2's `if (p.visual) move.visual = p.visual;` (local only, never committed) | `/practice/` | **0/3** (`results/beat-local-patched.json`) |
  | trial merge G1 @d2177c80 (patch 03 included) + Khand | `/practice/` | **0/3** (`results/beat-local-g1p03.json`) |
  | same trial merge | `/lesson/new?topic=` | **0/3** (`results/beat-local-g1p03-lesson.json`, re-run with a trace: `-lesson-dbg.json` + `beat-local-g1p03-trace.txt`) |

  **My harness ran the wrong surface in the first three runs.** `/practice/<topic>` starts with purpose `practice`
  (Quick Practice), and `studioSeam.prefetch` returns before any Studio piece for that purpose, patch 03 included. Those
  runs could never reach the beat. The harness now opens the lesson route by default (`--route practice` keeps the old
  run). On the lesson route the Director reaches `practice` at turn 4-5 in all three lessons. The offer drops at three
  points (trace, temporary logging in the trial tree only, never committed):

  1. **Prefetch, perimeter (c6-maths-ch06-t01): no game is built.** Patch 03 takes the plan's LAST skill,
     `c6-maths-ch06-t01-s3` ("solve real perimeter problems, including finding a side from the perimeter"). Khand
     admits s1 and s2 of that topic, not s3, so `buildLive` returns null. The other two lessons built one:
     `nazariya/floor` (area) and `nazariya/powers` (squares).
  2. **Turn 4: the game is held.** Studio proposes `play:practice`, but `slotFor` holds it because her move asks a
     question of its own (`hint.asking`, `!p.requested`).
  3. **Turn 5, the `practice_set` beat: Stagecraft takes the stage.** Studio proposes `play:practice` again, but this
     lesson has a Stagecraft host in mode `on`. `server/stagecraft/seam-bridge.js` `merge()` lets Stagecraft's own reveal
     win over a Wave 2 proposal ("Stagecraft's reveal wins over a Wave 2 proposal"), so its piece `c1` is revealed. From
     then on a piece is on screen, and `statusFacts` makes no new proposal while it is up. Stagecraft pieces filled the
     stage from turn 5 to turn 11 in all three lessons.

  Why G1's own C9b passes: it is API-only. It may not attach a Stagecraft host, or it may meet a beat without a
  question. That is G1's to confirm; I have not run it on a Khand topic. The fixes are outside Khand's files: in
  `seam-bridge.js` `merge()` (Stagecraft), let a `need: "practice"` play piece at `practice_set` count as exempt, or
  have Stagecraft offer it. Optionally, patch 03 could pick any admitted plan skill, not just the last one. Inside
  Khand, admitting `-s3` (a floor goal "find the missing side from the perimeter") is possible law work, not done.
- **"Two lessons stopped taking typed input after 4 turns": not a bug. It was my harness.** Repro (base run, 2026-10-10):
  at turn 5 of c6-maths-ch06-t01 and c5-maths-ch11-t01 the practice item was numeric ("Khaali jagah bhariye: 3 × 160 =
  __ m"). The dock correctly swapped the text field for the NumberPad (`number-pad` and `pad-send` visible,
  `child-input` absent, dock `data-floor="your_turn"`). Every `/api/lesson/turn` returned 200 with a normal move, and
  the page had no console errors. My harness only knew `child-input`, so it gave up. Taught to answer on the NumberPad,
  all three lessons ran 11 turns (2 NumberPad answers each in two of them). No owner file to fix.
- **Cold load**: the child can play the 2D twin within 2.2 s even at 1.2 Mbps. The 3D world itself arrives at 4.4-4.6 s
  on that link, and the twin carries the level until then.
- **Young band (classes 1-4, voice + tiles + NumberPad, never typed words): no Khand act needs typing.** Building is
  touch (tap, drag a layer). The two numbers a level asks for (the array count, the next square / cube number) use Khand's
  own on-screen digit keypad: buttons `k0`-`k9` / `Del` / `Say N`, which the closed voice grammar also presses. The
  turned-array prediction is two buttons. No text field exists in the engine or the 2D twin.
- **Class 4 typed lane**: class-4 children got no typed input on the practice page (voice-first). The browser asks
  therefore ran with class-5 children on the class-4 topics. The main session confirmed this as the right workaround and
  confirmed with stream 2 that the Young family has no typed input by design (src/child/band.ts B1/B2). Voice asks for class 4 are untested here.
- **Her words around the game** come from the Director, not Khand. In the views run she said "top view chuniye"
  ("choose") while the task is to build. Routed to 4A by the main session.
- **Art**: the blocks and sky are drawn in code (no Azure image generation used). The owner has not judged the look.
- **Not built**: faces / edges / corners (c4-maths-ch01-t01, ◐ in FEASIBILITY), tilings (c7-maths-ch14-t02),
  directions on a block map (c5-maths-ch05-t01), turn symmetry (c5-ch10-t01, c6-ch09-t02) and congruence (c7-ch09) need
  laws this plot does not have (rotation of a figure, path following). The rest of F8 (Moon phases, shadows, light) is
  science and belongs to other engines.

## 5. Patch requests

`patches/01`-`09`, with `APPLY.md` (why, and the test that proves each). Two need main's attention:
- **06**: the migration is `026_r4khand_play_build.sql` (number allotted by main; idempotent, additive only).
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

1. ~~Tier 3d's DPR floor~~: decided by the main session; it stays 1.0, and C10 waits on the phone run.
2. Whether unsolved free builds should also be kept in the gallery (today, only solved levels).
3. A real-phone run (O-R4) for C10.
