# Round 3 · forge · RESULTS (2026-10-09)

Every number below is from a browser or a script, run by an adult harness. **None is a child measurement.** Where a number
was measured matters, so each one says it: **taxila.dev** (production, web 145996f = HEAD's code), **local HEAD** (a
production build of git HEAD served by `server/serve.mjs`, Neon TEST, real Azure models, from this US sandbox), or **local
forge** (the same, built from HEAD + forge's owned paths + forge patches 01-07 + the play stream's files and its patches
01-05; `scratchpad/r3-forge/mk-final.sh`). The sandbox was heavily shared (load average 15-24 on 4 cores) during every
local run: local timings are slow and noisy in both arms.

## 0. Verdict in one paragraph

The owner's complaint is reproduced and its causes are fixed in code where forge owns them: boards that contradicted her
words no longer reach the child (nonsense boards 2/17 and 3/16 before → 0/16 after), boards and Studio v2 pieces are laid
out for the child's real box (broken views 7/36 on taxila.dev and 10/36 local HEAD → 3/36 local forge; library pieces broken
at every size: games 378/378 → 0/378, explainers 382/382 → 0/382), the look varies (1 board ground → 3; play pieces in 3 art
directions, 8 forms) and a game / animation / simulation ask now gets something to do on topics the play stream covers
(0/6 → 3/6 asks; 9/18 views playable at the child's size with play mode). What is still short: **3 of the 6 interactive asks
still get a board** (their topics have no play game and the practice route runs no Stagecraft), **play pieces have real
layout defects the first certification missed** (canvas-drawn labels overlapping; found by the canvas probe added late in
the round, §4), the **classes 4-5 16 px floor** is missed by most play and Studio v2 views, and the **3 s / 1.5 s timing bars
are not shown met** (§5).

## 1. Same harness, before and after (`tests/prod/round3-forge.mjs`, 12 visual asks)

12 cases: one fresh adult-scripted child each, the practice page of the case's topic, typed lane, two ordinary turns, then
the visual ask (picture / diagram / draw / whiteboard ×6, game / animation / simulation ×6); each view measured at 360 × 800,
412 × 915 and 1366 × 768 with the forge3 checks. "Broken" re-judges Q3 overlaps of a word with a prefix of itself (the
whiteboard's handwriting reveal mid-write: "togeth" over "together") as not overlaps in the runs made before measure.js
skipped them (method: the stored detail string; `scratchpad/r3-forge/summarize.mjs`).

| | taxila.dev before | local HEAD before | local forge after |
|---|---|---|---|
| when (UTC) | 11:28-11:43 | 11:28-11:43 | 12:03-12:20 (+ play-case reruns 12:25-12:45) |
| R1 something real on the stage | 11/12 | 11/12 | 12/12 |
| R2 interactive ask → something to DO | **0/6** | **0/6** | **3/6** |
| R2b interactive views playable at that size | 0/18 | 0/18 | **9/18** |
| R3 boards contradicting / answering her line | 2/17 | 3/16 | **0/16** |
| R4 broken views (any hard check) | 7/36 | 10/36 | **3/36** |
| R5 distinct board grounds | 1 (chalk) | 1 (chalk) | **3** (grid, paper, chalk) |
| T1 request → piece p50 / p90 | no piece (n=0) | 979 / 979 ms (n=1) | 1734 / 6687 ms (n=3) |
| T2 board lateness after her audio p50 / p90 | −700 / 2374 ms (n=11) | −700 / −700 (n=10) | −700 / 2618 (n=8) |

The three broken views after: the number-line module engine (not forge's file) at 13.1 px on the 360 phone and blank at
1366 (Q5 in its frame), and one board drawing in 14% of its box (Q7). Raw: `audit/before-prod-harness/`,
`audit/after-local/` (screens and `round3-forge.json`).

**Where the three interactive successes come from:** the c4 fractions engine already in the tray is kept (patch 03; before,
2/2 such engines were unmounted for a board), and two play pieces (c7 fair test, c5 compare on a number line). Over all forge
runs: the play piece was delivered 4/5 times for the c7 topic (once the ask was not read as a simulation ask) and 5/5 for
the c5 topic; the kept engine 4/4. The other three asks (c6 "how scientists find out", c6 perimeter, c6 locating places)
have no play coverage and the practice route runs no Stagecraft host, so they still get a board (open
`o-r3f-stagecraft-off-on-practice`).

**Earlier forge runs, for honesty about variance:** without play's patches (no play mode) and without patch 07, two forge
runs gave do 3/6 and 3/6, playable 3/18 and 4/18 (play pieces showed as their board twins), broken 1/36 and 13/36 — the 13
were 11 empty white Studio boxes left after the meaning gate refused a nonsense board, which is what patch 07 fixes (the
Desk gives the tray back). A run on a copy of the SHARED working tree (six other streams' uncommitted edits) is not counted.

**The canvas probe (added 12:40, §4) changes one after number:** with text drawn on canvases measured, the c5 play piece
(number line 0 to 1,00,000) fails Q3 at 360 and 412 (tick labels drawn over each other): after-run R4 for that case 1/3.
The table above was measured before the probe; with it, broken views after are at least 5/36 (the same run's three plus
these two). The c7 fair-test piece was not re-measured live with the probe (that rerun's ask got a board), and in the
play-mode harness its level fails Q3 at 360 (2 overlaps), so it would likely add one more.

## 2. The library at the child's size (`audit/harness/matrix.mjs`, every catalogue piece)

Real Desk tray + StudioStage, local Chromium, fake clock to each piece's settled state, at the tray boxes taxila.dev gives
(360 → 328 × 404, 412 → 380 × 519, 1366 → 752 × 408); classes 4-5 judged at the 16 px floor.

| piece | before (HEAD, 10:02) 360 / 412 / 1366 broken | after (forge, 12:18) 360 / 412 / 1366 broken | broken at EVERY size before → after |
|---|---|---|---|
| catalogue boards (382) | 381 / 367 / 9 | **101 / 56 / 2** | 9 → 2 |
| the 20 taxila.dev boards (views) | 6 / 3 / 0 | **2 / 0 / 0** | 0 → 0 |
| Studio v2 games (378) | 378 / 378 / 378 | **0 / 149 / 1** (360: all shown as board twins) | 378 → **0** |
| Studio v2 scene explainer (382) | 382 / 382 / 382 | **1 / 150 / 2** (360: all twins) | 382 → **0** |

Why the rest still fail: boards at 360 — no clean layout reaches the floor (dense labels; classes 4-5 at 16 px); games and
explainers at 412 — almost all are classes 4-5 at 14.3 px against the 16 px floor (the serving rule allows them, §6), plus
31 views with a clipped pill. The board numbers agree with the pure prediction (312 → 61 boards under 14 px at 360, n=402;
the rendered count is higher because classes 4-5 are judged at 16 px). Studio v2 canvas text in this matrix was judged by
the host's design-unit minimums; the canvas-probe re-run is §4.

## 3. Play pieces (the play stream's grammar, composed live by forge)

- **In the lesson Desk without play mode** (StudioStage + PlayStudioRenderer, `scratchpad/r3-forge/play-desk.mjs`, 3 covered
  topics × 3 sizes): the game at 412 × 915 only; its board twin at 360 × 800 (box 324 × 400 < MIN_BOX) and 1366 × 768 (box
  736 × 392). **With play's Desk play mode (patch 04)**: the game at all three sizes (§1 R2b 9/18).
- **Certification, first run** (`server/forge3/play-cert.js`, every coverage entry, served levels, 2 seeds, 4 arts, play-mode
  boxes; 456 samples; DOM text only): classes 6-7 280/320 pass at every size; classes 4-5 0/136 at the 16 px floor (play's
  chrome at 14 px); art never changed a verdict. Serving rule (§6): 44/48 cells servable at every size.
- **Certification with the canvas probe**: see §4.
- **Live cost**: `buildLive` warm 4.0 ms p50, 8.3 ms p90, 38.8 ms max (n=30, no DB; the learner read is bounded at 350 ms);
  first call 315 ms (imports).

## 4. What the QA could not see, and the probe that fixed that

An after-run screenshot (`audit/after-local/` c5 compare level at 360) showed a number line whose tick labels were drawn on
top of each other, while R4 passed: play pieces (and Studio v2 engines) draw their words on a canvas, and the QA measured
only DOM and SVG text. `measure.js canvasTextProbe` now records every `fillText` with its rendered box per canvas frame;
the same level fails Q3 with 11 overlaps at 360, 10 at 412, 1 at 1366, and a fair-test level 2 at 360.

PLAY-CERT-2 and MATRIX-2 (re-certification with the probe) are filled in below when their runs finish.

## 5. Timing bars

- **Request → piece on stage p90 ≤ 3 s**: NOT shown met. The play piece rides the ask turn's own response, so this is the
  turn time: local forge 1734 / 6687 ms (p50 / p90, n=3), earlier forge runs 403 / 3560 (n=2) and 3653 / 4242 (n=3). Server
  turn times in the same runs were p50 2.9-3.3 s, p90 4.5-4.8 s **before and after alike** (server logs, n=35-42 turns per
  run): the reply path dominates, as round 2 found; forge adds composeAsk (4-8 ms warm, ≤ 39 ms) on interactive asks only.
  taxila.dev gave no piece before (n=0). Needs a production or quiet-machine run after deploy.
- **Board lateness p90 ≤ 1.5 s**: NOT shown met. taxila.dev before: 2374 ms (n=11; an earlier run 1785, n=11). Local: HEAD
  −700 (n=10); forge −700 (n=7), −700 (n=5), 2618 (n=8). Forge does not change when a board is made or sent; it adds the
  W10-W13 checks (0.32 ms per board) and the client layout (0.17-1.65 ms per board).

## 6. Decisions taken on the evidence (in `context/inbox/r3-forge.json`)

- Boards are laid out for the box on the client (map-label rule), only when as clean as drawn.
- Interactive asks get a code-built play@1 piece live (no model) with a board twin for small boxes.
- Serving = the device's 14 px rule: a classes 4-5 view failing only the 16 px floor with ≥ 14 px text may be served; the
  quality numbers keep the strict verdict.
- The QA is deterministic and measured in the page; models only refuse, offline.
- A slot that ends empty gives the tray back (patch 07).

## 7. What is still short of the bar, and exactly why

1. **3/6 interactive asks get a board** — no play coverage for those topics (play covers 47 of 250 class 4-7 topics) and
   the practice route has no Stagecraft host, so no library game either. Fix: more play families/coverage (play), or run
   the certified library game rung on practice lessons (Stagecraft, not forge's file).
2. **Play pieces' canvas layouts** — overlapping tick labels (nishana compare at 360/412), an ellipsised atoms goal line, a
   fair-test label overlap at 360, 14 px chrome for classes 4-5. play-stream fixes; forge refuses an art whose certificate
   failed, but the defects are in every art.
3. **Classes 4-5 floor (16 px)** — missed by most play pieces and ~149 Studio v2 views at 412; served under the 14 px rule.
4. **Boards with no clean layout** — 101/382 catalogue boards still under the floor at 360 (dense labels); the producer
   (templates and the catalogue, not forge's files) must draw fewer, larger words for a phone.
5. **Module engines** (src/modules, not forge's): the number-line engine scaled to fit its frame renders 13.1 px at 360.
6. **Timing** — §5; not measured on production after.
7. **Not measured at all**: real phones, Indian networks, children, the voice lane, the Young Desk, real (Conductor-chosen)
   lessons, the QA service deployed.

## 8. Gates run

- `npx tsc -b`: clean (main tree and the gate copy = HEAD + forge owned + all forge patches).
- `npx vite build`: clean (every measurement copy).
- Forge tests: `tests/round3-forge-{unit,semantics,live,qa-browser}.test.mjs` + patch 06's geoboard test: green.
- Related suites in the gate copy (round2-content, studio-*, stagecraft*, w2b-*, whiteboard-clock): the only failures also
  fail on a pure HEAD copy on the same machine at the same time (timing budgets and browser timeouts under load average
  20+): `round2-content` "< 60 ms per ask" (HEAD 73.6-91.9 ms, forge 90.6-99.2 ms), `w2b-whiteboard-browser` 11-13, and
  `engines-browser` number-line / collections. Full `npm test` result: §8 note below.
