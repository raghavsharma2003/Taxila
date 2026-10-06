# Round 2 · stream content: apply order and proof

2026-10-06 · base **HEAD 205083e**.

- Every patch passes `git apply --check` on HEAD, alone and all together.
- They also apply on top of `round2/latency/patches/01-brain-perceive-prefetch-adopt.diff` and
  `round2/truth/patches/03-lesson-end-closes-episode.diff`, the other round-2 patches that touch the same files.
- Nothing was committed, pushed, deployed or migrated. Every hot file was changed only in a scratch copy.
- **New files** (already in the tree, used by the patches):
  - `server/stagecraft/board-first.js`
  - `server/stagecraft/board-legible.js`
  - `evals/content/coverage.mjs`
  - `tests/round2-content.test.mjs`
  - `tests/prod/round2-content.mjs`
  - `docs/design/round2/content/RESEARCH.md`
  - `evals/content/results/*`

## Order

| # | patch | files | what it does | proven by |
|---|---|---|---|---|
| 01 | `01-whiteboard-w8-groups.diff` | `server/studio/qa/whiteboard.js` | W8 accepts "N equal groups, each with M" as N × M: a partition count she said times another number she said. This is the owner-5 production failure. | `tests/round2-content.test.mjs` "W8 reads …" (the exact prod line passes; a 4-group line still refuses 15 dots) |
| 02 | `02-board-sync-first.diff` | `server/stagecraft/board-sync.js` | Rung 0 is the board-first pick. The catalogue boards in the code rung are made legible first. | "board-sync takes the preselected board as rung 0" (no model call when it passes) |
| 03 | `03-studio-seam-first.diff` | `server/studio/seam.js` | Adds `preselectWhiteboard` (same guards as `requestIntent`).<br>`requestIntent` draws a passing pick synchronously, so the ack carries the artifact.<br>A continued board keeps the board on screen when it passes against her new line.<br>Telemetry `[studio] board-first …` and `kept board refused …` (check ids only). | "seam: preselect, then requestIntent draws synchronously" (3 cases incl. safety and continue) |
| 04 | `04-brain-turn-board-first.diff` | `server/brain/turn.js` | After the kernel, preselect. The row joins the move's content before the reply is written; stale rows are stripped (`isBoardFirstRow`), and it is never added while another piece takes the tray. The ack's artifact rides `ui.studioSlot`. | acceptance R+B (`tests/prod/round2-content.mjs`); `tests/brain-turn.test.mjs` unchanged |
| 05 | `05-fractions-name-of.diff` | `shared/engine-catalog.js`, `src/modules/frame/engines/fractions.logic.ts`, `fractions.tsx`, `src/modules/frame/kit/kit.css`, `server/director/recheck.js` | `fractions@1` modes `name` and `of`. The adapters bind only exact keys. The server re-grades `fr.name` / `fr.of` from the raw act. | "fractions@1 name / of" (binding, frame logic, forged claims graded by the server) |
| 06 | `06-engine-harness-name-of.diff` | `tests/engine-catalog.test.mjs`, `evals/engines-coverage.mjs` | Teaches the planner↔frame replay harness the two modes. **Apply with 05**: without it, `engine-catalog.test.mjs` fails 3 cases, and that is the harness, not the engine. | `tests/engine-catalog.test.mjs` 6/6 |

**Off switch.** `TAXILA_BOARD_FIRST=0` preselects nothing; the turn and the board ladder are exactly as before.

**Safety floor, unchanged.**
- Nothing is preselected on or after a safeguarding turn (`L.safety`), or with the parent's Studio switch off.
- W7 (SEVERE/PII) and W9 (no answer reveal) run at preselect. W9 runs as if her line said no number.
- Every board shown passes the full gate W0-W9 against her REAL line.
- The persona prompt is not touched: the row is values only, never a sentence.

## Gates, run on a scratch copy of HEAD + patches

- `npx tsc -b`: 0 errors.
- `npx vite build`: passes.
- `node --test tests/round2-content.test.mjs`: 16/16 on the patched copy. On the unpatched tree: 8 pass, 8 skip with the patch name.
- Full `node --test tests/` (one process), run on the HEAD copy and the patched copy at the same time:
  - HEAD copy: 1074 tests, 69 failures. All of them come from the scratch copy: no `public/` or `art/`, no browser, and
    parts of `docs/` and `evals/` data missing.
  - Patched copy: cut by my 1700 s timeout before its summary. The 68 failures it reached are all in the HEAD copy's
    failure set; there are 0 new failures.
  - The stream's 5 suites pass inside the one-process run (no hook at file top level).
  - A full run on the real tree belongs to the integrator.
- The related suites pass identically before and after: `brain-turn`, `director-*`, `engine-*`, `p4-content-*`,
  `stagecraft*`, `studio-*`, `w2-seams`, `whiteboard-clock`, `safety-robust-seams`.

## Before / after (same harness, `tests/prod/round2-content.mjs`)

Setup:
- **Local**: scratch copy of HEAD vs the same copy + patches, `server/index.js` on its own port, `TAXILA_DB=test` (Neon TEST
  branch), real Azure models, from the US sandbox.
- **Prod**: taxila.dev, which runs ee97e9c = HEAD for these paths.
- Lateness = (board on the slot − reply received) − 700 ms; −700 means the board rides the turn response.
- Raw output: `evals/content/results/`.

| measure | prod HEAD (n=2 reps) | local HEAD (n=3 reps) | local patched (n=3 reps) | bar |
|---|---|---|---|---|
| requests that put something real on stage | 24/24 | 35/36 | **36/36** | all |
| board slots filled (R + B) | 14/18 | 24/27 | **27/27** | all |
| slots failed while her line pointed at the screen | 4 | 4 | **0** | 0 |
| board lateness after her audio starts | p50 −88 · p90 1731 ms (n=26) | p50 −101 · p90 1516 (n=41) | **p50 −700 · p90 −73 (n=45; 22 in the turn response)** | p90 ≤ 1500 |
| request → piece on stage (reply time) | p50 1673 · p90 1974 (n=12) | p50 2206 · p90 3205 (n=18) | p50 2351 · p90 2913 (n=18) | p90 ≤ 3000 |
| item-bound maths mount per lesson (M, 3 topics) | 0/3 | 1/6 (2 runs) | 2/6 (2 runs) | 3/3 |
| wall time of the battery | 179 s | 269 s | 274 s | ≤ 15 min |

Server side, the board's source:
- **Local patched** (`server-board-lines`): 35 board-first, 11 kept, 12 code, 9 line, 2 not drawn.
- **Local HEAD**: 53 code, 16 spec, 15 line, 6 not drawn.
- **Production, full day** (n=189): 31 not drawn (16.4%).

Part B with the harness run from the patched tree (its re-gate uses patched W8): 30/30 checks, 27/27 filled, lateness
p90 1153 ms (n=27). From the main tree, the harness's own re-gate uses HEAD's W8: 2 boards on "3 barabar groups, har
group mein 5" fail exactly the case patch 01 fixes.

Coverage of the 385 class 4-7 topics (`evals/content/coverage.mjs`, offline):

| | HEAD | patched |
|---|---|---|
| game/sim | 368 | 368 |
| explainer | 369 | 369 |
| board usable at the live gate on both explain and worked-example beats | 276 | **346** |
| validated key | 385 | 385 |
| ALL FOUR | 262 | **331** |
| maths items an engine binds | 72/2497 | 83/2497 |

The ship-five "board plan 379/385" counted boards by shape and lint only. At the live gate, 2886/3011 authored boards
failed W1 (legibility); after the fit, 1904/3011 pass every geometry check.

## Still short of the bar, and exactly why

1. **Request → piece on stage p90 ≤ 3 s is not owned here.** For a Stagecraft piece or a module it equals the turn's reply
   time: the piece rides the turn response.
   - Local p90: 3205 ms on HEAD, 2913 patched (n=18 each). The difference is model noise, not this stream.
   - Prod from the sandbox: p90 1974 (n=12).
   - The ship-five 3304 ms was n=6 (that "p90" is the max): one spoken-lane turn.
   - The latency stream owns the reply path. This stream adds no model call before the reply: preselect is ~16 ms.
2. **Item-bound maths mount per lesson: 2/6, not 3/3.**
   - The three production lessons' first items (i01) now bind (c4/c6 `name`, c7 `of`), plus 8 more blind-verified items (11 in total).
   - But the Director posed the real-life probe rl-h1 early in all 12 measured lessons, and a diagnostic. No engine binds
     those items.
   - Of the maths items, 2414/2497 still bind nothing. 513 of them have plain numeric keys, but a "type the number"
     frame adds no evidence beyond the chat answer, so I did not force it.
   - Closing the gap needs either G1 fills on the rl-/diag items the Director poses first (Forge), or the Director posing a
     bindable item first in maths practice. Both are outside this stream's paths.
3. **Board-first does not cover every beat.** 697/770 explain and worked-example asks get a pick (90.5%; maths 217/282).
   - On a miss, or when her real line contradicts the pick, the old ladder runs, with its old lateness.
   - The live W8 refusals on c6-maths explain (9 in the last local run) are her line naming the worked example's counts
     while the board drawn is a different one. They fall to the code or line rung and still draw.
4. **Not measured on production after the change.** Nothing was deployed. The after numbers are local (Neon TEST, real
   Azure models), n=3 reps, from the US sandbox. The prod numbers are HEAD.
5. **No child data.** Every line is an adult-designed persona turn; these are adult/simulated numbers.
6. **Browser part not run.** The real-client paint check (p4 part E) was not re-run: the sandbox proxy blocked Chromium
   on 2026-10-06. That a whiteboard artifact on the turn response renders follows from code reading (StudioStage uses
   `slot.artifact`), not a screenshot.
