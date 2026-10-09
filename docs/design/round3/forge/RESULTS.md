# Round 3 · forge · RESULTS (2026-10-09)

Every number below is from a browser or a script driven by an adult harness. **None is a child measurement.** Each says
where it was measured: **taxila.dev** (production, web 145996f), **local HEAD** (a production build of git `cadf527` = the
production code + docs, `server/serve.mjs`, Neon TEST, real Azure models, this US sandbox), or **local forge** (the same
base + forge's owned paths + forge patches 01-07 (08 where said) + the play stream's files and patches 01-05;
`scratchpad/r3-forge/mk-c.sh`). The sandbox was heavily shared during every local run (load average 15-24 on 4 cores):
local timings are slow and noisy in both arms. A copy of the SHARED working tree, or of the 12:32 WIP checkpoint HEAD
`a29cc0b` (all streams' uncommitted work), is reported separately and never as forge's "after".

## 0. Verdict

The owner's complaint is reproduced (`audit/README.md`) and its causes that forge owns are fixed in code:

- **Nonsense boards** (the picture contradicting or answering her words): 2/17 on taxila.dev and 3/16 local HEAD → **0/13**.
- **Broken views** at 360 × 800 / 412 × 915 / 1366 × 768: 7/36 taxila.dev, 10/36 local HEAD → **4/36** local forge (the 4: a
  module engine that is not forge's file, one slow board, and a play number line whose labels overlap — a play defect the
  new canvas probe catches).
- **Library at the child's size:** Studio v2 games and explainers broken at EVERY size 378/378 and 382/382 → **0** and **0**;
  catalogue boards broken at 360: 381/382 → **101/382**.
- **One look → variety:** board grounds 1 → **3** per run; play pieces in 3 art directions and 8 forms; never the same look
  twice in a row.
- **Something to DO when the child asks to play:** 0/6 interactive asks → **2/6** in the final clean run (3/6 in an earlier
  run), and **2/2 more for the simulation ask with patch 08**; at the child's own size **6/18** views playable (0/18 before).
  Caveat: the final play certificate (§4, made after that run) refuses the c5 compare piece at the phone box, so with
  today's files the expected count on this set is **2/6 with patch 08** (kept engine + c7 fair test), not 3/6.

Still short: **3 interactive asks get a board** (no play game for those topics, and the practice route runs no Stagecraft);
**play's canvas layouts** fail on some levels (the certification in §4 now refuses them); the **classes 4-5 16 px floor**;
the **3 s / 1.5 s timing bars are not shown met** (§5).

## 1. Same harness, before and after (`tests/prod/round3-forge.mjs`, 12 visual asks)

One fresh adult-scripted child per case, the practice page of the case's topic, typed lane, two ordinary turns, then the
ask (picture / diagram / draw / whiteboard / picture-evs / diagram-science, and game / animation / game-perimeter /
sim-science / game-sst / animation-maths); every view measured at the three sizes with the forge3 checks. Q3 overlaps of
a word with a prefix of itself (the handwriting reveal mid-write) are re-judged as not overlaps in the before runs, which
were made before measure.js skipped them (`scratchpad/r3-forge/summarize.mjs`, from the stored detail strings).

| | taxila.dev before | local HEAD before | **local forge after** | (integrated `a29cc0b`, not forge's after) |
|---|---|---|---|---|
| when (UTC) | 11:28-11:43 | 11:28-11:43 | 13:00-13:17 | 12:57-13:15 |
| canvas text measured | no (no canvas pieces appeared) | no (none appeared) | **yes** | yes |
| R1 something real on the stage | 11/12 | 11/12 | **12/12** | 12/12 |
| R2 interactive ask → something to DO | 0/6 | 0/6 | **2/6** (+ sim-science 2/2 with patch 08) | 2/6 |
| R2b interactive views playable at that size | 0/18 | 0/18 | **6/18** (+ 3/3, 3/3 with patch 08) | 6/18 |
| R3 boards contradicting / answering her line | 2/17 | 3/16 | **0/13** | 0/16 |
| R4 broken views | 7/36 | 10/36 | **4/36** | 4/36 |
| R5 distinct board grounds | 1 (chalk) | 1 (chalk) | **3** | 3 |
| T1 request → piece p50 / p90 | no piece (n=0) | 979 / 979 ms (n=1) | 352 / 3161 ms (n=4) | 3124 / 6784 (n=3) |
| T2 board lateness p50 / p90 | −700 / 2374 ms (n=11) | −700 / −700 (n=10) | −700 / −700 (n=8) | −700 / 2813 (n=8) |

- **The 4 broken views after:** the number-line module engine (src/modules, not forge's) at 13.1 px on the 360 phone; one
  board not yet drawn when the 360 view was measured (empty box, drawn by the 412 view); the c5 play number line at 360 and
  412 (tick labels drawn over each other: 18 and 11 overlaps, play's view).
- **Where the interactive successes come from:** the c4 fractions engine already in the tray is kept (patch 03; before, 2/2
  such engines were unmounted for a board); play pieces for c5 compare (5/5 forge runs) and c7 fair test (4/7 runs without
  patch 08 — the ask "simulation dikhao" matched no request pattern and was read as a worked example on 3 of 7 — and 2/2
  with patch 08, playable 3/3 and R4 3/3 both times). The other three asks (c6 how scientists find out, c6 perimeter, c6
  locating places) have no play coverage and no Stagecraft host on the practice route, so they get a board.
- **Variance, all forge runs (n = 6 full or partial runs, 50 asks):** nonsense boards 0 in every run; empty Studio boxes left
  after a refused board 11/36 views in one run before patch 07, 0 after it.
- Raw: `audit/before-prod-harness/` (taxila.dev), `audit/after-local/` (+ `patch08-sim/`): screenshots and `round3-forge.json`.

## 2. The library at the child's size (`audit/harness/matrix.mjs`, every catalogue piece)

Real Desk tray + StudioStage, local Chromium, fake clock to the settled state, at the tray boxes taxila.dev gives (360 →
328 × 404, 412 → 380 × 519, 1366 → 752 × 408); classes 4-5 at the 16 px floor.

| piece | before (HEAD, 10:02) 360 / 412 / 1366 broken | after (forge, 12:18) 360 / 412 / 1366 broken | broken at EVERY size |
|---|---|---|---|
| catalogue boards (382) | 381 / 367 / 9 | **101 / 56 / 2** | 9 → 2 |
| the 20 taxila.dev boards (60 views) | 6 / 3 / 0 | **2 / 0 / 0** | 0 → 0 |
| Studio v2 games (378) | 378 / 378 / 378 | **0 / 149 / 1** (360: all board twins) | 378 → **0** |
| Studio v2 scene explainer (382) | 382 / 382 / 382 | **1 / 150 / 2** (360: all twins) | 382 → **0** |

Why the rest fail: boards at 360 — no clean layout reaches the floor (dense labels; classes 4-5 at 16 px); games and
explainers at 412 — mostly classes 4-5 at 14.3 px against 16 px (served under the 14 px rule, §6), plus 31 clipped pills.
The pure prediction agrees (boards under 14 px at 360: 312 → 61 of 402). At 360 every Studio v2 piece is its **board
twin**: legible, but words, not a game. These two runs measured Studio v2 canvas text by the host's design-unit minimums;
the canvas-probe re-run (MATRIX-3, §4) finds more at 1366: games 43, explainers 27 broken views (still 0 at every size).

## 3. Variety (pure code)

- Boards over the 12 audit lessons, random lesson ids, 50 reps: 3 grounds every time, never the same twice in a row
  (taxila.dev: 12/12 chalk).
- Play pieces for one child, one per covered topic in a row (47): kagaz 23, blueprint 13, chalk 11 (raat never picked:
  play's pickArt prefers light grounds for these topics), 8 forms, never the same art twice in a row; the same topic asked
  4 times in one lesson: kagaz, chalk, kagaz, chalk.

## 4. Judged quality of play pieces, and the canvas probe

**What the QA could not see.** Play pieces (and Studio v2 engines) draw their words on a canvas; the QA measured DOM and
SVG text only. An after-run screenshot (c5 compare at 360) showed tick labels drawn on top of each other while R4 passed.
`measure.js canvasTextProbe` now records every `fillText` with its rendered box (clipped to the canvas) per canvas frame;
the same lesson view then fails Q3 with 18 overlaps at 360 and 11 at 412, live and in the harness alike.

**Where it is judged.** The first certification rendered `PlayStage` directly in play DESIGN §7's planned worlds
(360 × 576 …), which carry a header and teacher strip the Desk never shows and are not the boxes the shipped Desk play mode
gives. The final certification judges the child's real path — a PlayArtifact on the Studio stage (PlayStudioRenderer →
PlaySession) in the Desk play-mode boxes measured live (324 × 528, 376 × 643, 736 × 536). Harness vs live on the same two
levels: 6/6 views agree (both pass the c7 level at every size; both fail the c5 level at 360 and 412 with the same overlap
counts).

| run | path | samples | classes 6-7 pass at every size | classes 4-5 | cells servable (14 px rule) |
|---|---|---|---|---|---|
| 1 (11:21) | PlayStage, planned worlds, DOM text only | 456 (2 seeds) | 280/320 | 0/136 (16 px) | 44/48 at every size |
| 2 (13:0x) | PlayStage, planned worlds, + canvas probe | 228 (1 seed) | 112/160 | 0/68 | 28/48; 4 nowhere (nishana compare c4) |
| **final** (13:4x) | **Studio stage, Desk play-mode boxes, + canvas probe** | 228 (1 seed, 4 arts) | **140/160** | **48/68** (16 px) | **36/48** at every size; **0 nowhere** |

Final run (`server/forge3/certs/play.json`, shots `audit/play-cert/`): all three sizes 188/228 levels; by size 360 188,
412 212, 1366 224. By form (levels passing at every size): strips 40/40, equation 12/12, place 36/36, fair-test 76/76;
atoms 12/32 (goal line ellipsised at the 324 px box: Q2 ×20), bundles 4/8 (Q3 at 360), compare 8/20 (tick labels
overlap: Q3 at 360 and 412, 12 each), equality 0/4 (c4-5 labels at 14 px against 16 px everywhere; servable under the
14 px rule). Cells servable at the 360 box: atoms 0/4, bundles 0/4, compare 4/8 — so live.js (which judges an unknown
device as the 360 phone) refuses those, **including the c5 compare piece that §1's after-run served**: with these
certificates the expected interactive count on §1's set is 2/6 (the kept engine + the c7 fair test with patch 08), not
more, until play fixes those views. Art never changed a verdict (every failing cell failed in all its arts).

**MATRIX-3** (13:2x, Studio v2 games and explainers re-judged with the canvas probe, same boxes as §2), broken views at
360 / 412 / 1366: games (378) **0 (all twins) / 163 / 43**, explainers (382) **0 (twins) / 165 / 27**; broken at every
size 0 and 0; not servable anywhere 0. Against §2's design-unit run the 1366 column rises from 1 → 43 and 2 → 27: canvas
words clipped at the frame (Q2, mostly beat-line and era-drop) and overlapping canvas labels (Q3, 51 in explainers) that
the earlier run could not see. `certs/catalogue.json` is built from this merged matrix (boards from §2's 12:18 run).

## 5. Timing bars

- **Request → piece p90 ≤ 3 s: NOT shown met.** The play piece rides the ask turn's own response, so this is the turn
  time. Local forge: 352 / 3161 ms (p50 / p90, n=4) in the final run; 1734 / 6687 (n=3), 403 / 3560 (n=2), 3653 / 4242 (n=3)
  in earlier ones. Server turn times were p50 2.9-3.3 s, p90 4.5-4.8 s before and after alike (server logs, 35-42 turns per
  run): the reply path dominates, as round 2 found; forge adds `composeAsk` (buildLive warm 4.0 ms p50, 8.3 p90, 38.8 max,
  n=30, no DB; learner read capped at 350 ms) on interactive asks only. taxila.dev gave no piece before (n=0).
- **Board lateness p90 ≤ 1.5 s: NOT shown met on production.** taxila.dev before 2374 ms (n=11; an earlier run 1785, n=11).
  Local: HEAD −700 (n=10); forge final −700 (n=8), earlier −700 (n=7), −700 (n=5), 2618 (n=8). Forge does not change when a
  board is made or sent; it adds W10-W13 (0.32 ms per board) and the client layout (0.17-1.65 ms per board). The harness
  counts a late board from the turn BEFORE the ask as the ask's board when it lands after the ask (one 17 304 ms outlier in a
  single-case rerun): a harness limitation, said here rather than hidden.

## 6. Decisions taken on this evidence (`context/inbox/r3-forge.json`)

- Boards are laid out for the box on the client (geometry scales, words keep their size), only when as clean as drawn.
- Interactive asks get a code-built play@1 piece live (no model), with a board twin for boxes that cannot hold it; an engine
  already in the tray is kept first.
- Serving = the device's 14 px rule (a classes 4-5 view failing only the 16 px floor with ≥ 14 px text may be served);
  quality numbers keep the strict verdict. When the child's size is not known (the client does not report it), a play art
  is offered only if it passed on the 360 phone box.
- The QA is deterministic and measured in the page (DOM, SVG and canvas text); a model may only refuse, offline.
- A slot that ends empty gives the tray back (patch 07). A simulation ask is an interactive ask (patch 08).

## 7. What is still short of the bar, and exactly why

1. **3/6 interactive asks get a board**: no play coverage for those topics (play covers 47 of 250 class 4-7 topics) and the
   practice route has no Stagecraft host (no library game either). Owners: play (coverage), Stagecraft (library rung on
   practice lessons).
2. **Play canvas layouts**: nishana compare tick labels overlap at 360/412; other cells per §4. The certificate now refuses
   what fails at the phone box, so those topics fall back to the board or the engine; the fix is in play's views.
3. **Classes 4-5 floor (16 px)**: missed by ~149 Studio v2 views at 412 and by most play chrome; served under the 14 px rule.
4. **Boards with no clean layout**: 101/382 catalogue boards still under the floor at 360 (dense labels); the producers
   (templates, catalogue; not forge's files) must draw fewer, larger words for a phone.
5. **Module engines** (src/modules, not forge's): the number-line engine scaled into its frame renders 13.1 px at 360.
6. **A play piece holds the tray** until the seam retires it (no level-end hook into the studio seam yet).
7. **Timing**: §5; production not measured after.
8. **Not measured at all**: real phones, Indian networks, children, the voice lane, the Young Desk, real (Conductor-chosen)
   lessons, the QA service deployed.

## 8. Gates

- `npx tsc -b`: clean (main tree; gate copy = cadf527 + forge owned + all forge patches).
- `npx vite build`: clean (every measurement copy).
- Forge tests: `tests/round3-forge-{unit,semantics,live,qa-browser}.test.mjs` 36/36 in the main tree; patch 06's geoboard
  test and patch 08's requests test (+ `owner-requests` 17/17) green in patched copies.
- Related suites in the gate copy (round2-content, studio-*, stagecraft*, w2b-*, whiteboard-clock): 199/206; the 7 failures
  also fail on a pure cadf527 copy on the same machine at the same time (a "< 60 ms per ask" budget measured at 73.6-91.9 ms
  on HEAD and 90.6-99.2 ms on forge under load average 20+; `w2b-whiteboard-browser` 11-13 browser timeouts; the
  stage-skeleton test passed on re-run).
- Full `npm test` in the gate copy: **not completed** — the run stopped at test 565 (no summary written) under the shared
  machine's load; by then 61 failures, 60 of them `engines-browser.test.mjs` (every module engine scenario times out
  waiting for `.ek[data-engine]`; the same scenarios fail identically on a pure cadf527 copy) and 1 deploy-gate test that
  needs a git checkout (the gate copy is not one). It needs a quiet machine before merge.
