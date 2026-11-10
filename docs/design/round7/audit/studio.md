# Audit: studio (2026-11-10)

Area 4 of the whole-project audit (`BRIEF.md`, `RULES2.md`). **Audit only**: the Studio stream is mid-build in these
files, so no product code is changed here. Small, certain fixes are written as patches under
`docs/patches/to-studio/` with a test that fails before and passes after.

Branch `claude/r7-audit-studio`, from `int/r6` at integration 21a (`8bb6b188`).

Status: **final**. Skeptic pass (one sub-agent, asked to refute each finding): 10 confirmed, 2 partly confirmed
(STUDIO-03, STUDIO-06; corrections folded into their notes), none refuted.

## Findings

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| STUDIO-01 | P1 | broken | studio | shade-grid@1 with labels and a shown fraction fails its own lint for every grid of 2+ rows, so the claims board for "N columns aur M rows" draws nothing | `server/forge/explainer/templates.js:439`, called by `server/stagecraft/claims-board.js:98` | move the fraction from `y0 + H + 34` to `y0 + H + 56` | patch 003 |
| STUDIO-02 | P2 | inconsistent | studio | catalogue boards are served for topics whose cross-check failed or never ran (13 topics, 102 boards); the game and explainer of the same topics are withheld | `server/stagecraft/catalogue.js:136-143` (the boards loop) (served by `board-first.js:217`, `board-sync.js:470`) | skip the boards when the record is not checked | patch 004 |
| STUDIO-03 | P2 | not good enough | studio | 13 catalogue topics have no usable game or explainer; 7 failed the cross-check on real errors (oxygen sorted as "Burns", a "-10" rule on a 50, 45, 40 pattern, a ₹550 key for ₹36,250 + ₹18,750) and 6 were never checked; one more game is refused for an unsafe string | `data/studio-catalogue/topics/` (list below) | re-author the 13 and re-run the cross-check; the 7 errors are listed so the authoring prompt can be fixed first | open |
| STUDIO-04 | P3 | no longer needed | studio | `POST /api/forge/requests` and `POST /api/forge/prefetch` have no caller anywhere (client, scripts, tests/prod); the lesson warms fills through `forgeSeam.prefetchLessonFills` instead | `server/routes/forge.js:51-77` | delete both routes; move `publicFill` and `limit` (used by two tests) or drop them with the routes | proposal (needs main) |
| STUDIO-05 | P3 | broken | studio | the beat card's progress dots stop moving from the 9th board: 8 dots are drawn and all are "done", so no dot is "now" | `src/studio/StudioStage.tsx:337` (`card.n` grows per board: `server/stagecraft/beat-card.js:42`) | mark dot `min(n, 8) - 1` as now: `i < Math.min(card.n, 8) - 1` | open |
| STUDIO-06 | P3 | no longer needed | studio | five `.patch` files inside product folders were applied in the W2 integration and now apply neither forward nor backward | `server/forge/seam-patches/*.patch` (3), `server/studio/seam-patches/*.patch` (2) | delete them; `context/` cites them by name as method, so add an inbox entry with the last commit that holds them | proposal (needs main) |
| STUDIO-07 | P3 | inconsistent | studio | the Studio v2 node tests live outside `tests/`, so neither `npm test` nor `npm run test:all` runs them (9 tests; they pass today when run by hand) | `src/studio-v2/tests/studio-v2.test.mjs`; `scripts/test-shard.mjs:28` reads only `tests/` | move the file to `tests/studio-v2.test.mjs` (fix its relative imports) | open |
| STUDIO-08 | P3 | inconsistent | studio | Stagecraft's default mode is "on" in `lesson.js` and in its header, but `StagecraftHost` falls back to "off" when no mode is passed | `server/stagecraft/host.js:30` vs `server/stagecraft/lesson.js:27-30` | `o.mode ?? stagecraftMode()` (one default, one place) | open |
| STUDIO-09 | P3 | not good enough | studio | number-line-hop@1 is advertised (and authorable) for ranges it cannot lay out: 63 of 180 calls on a grid of the advertised range are refused (an equation with negatives runs off the board; "+1" then "-1" labels overlap) | `server/forge/explainer/templates.js:507-547`, `server/forge/explainer/board-ref.js:24` | narrow the advertised range to what lays out, or wrap the equation row | open |
| STUDIO-10 | P3 | not good enough | studio | the picture lane's per-job and per-lesson maps are never pruned, so a long-running replica keeps one entry per picture and per lesson forever | `server/studio/picture.js:47-55`, `118-120` | drop a lesson's `perLesson` / `failed` rows and its jobs when the seam forgets the lesson, or cap the maps like `cache` | open |
| STUDIO-11 | P2 | not good enough | studio | Stagecraft pays for generated specs that can never be shown: the conductor launches the `generated_spec` rung on `taxila-fast-bg` by default, but the tray gate refuses every generated spec ("not judged at the child's sizes") because nothing ever sets a judge verdict | `server/stagecraft/conductor.js:260`, `server/stagecraft/lesson.js:99-100`, `server/forge3/tray-gate.js:205-208`; `server/forge3/gate.js:22` `judgeArtifact` has no caller | launch the spec rung only when a judge lane is configured (`FORGE3_QA_URL`), the way `seam.js:450` skips live builds without a gate: pass `rungs` without `generated_spec` to the host otherwise | open |
| STUDIO-12 | P2 | broken | studio | the live build race and the local gate cannot load in the production image: `server/studio/fixers.js` imports `rolldown/parseAst`, but `rolldown` arrives only through `vite` (a devDependency) and the image installs with `--omit=dev`. Dormant today (no gate URL is set), so it breaks silently the day the gate is wired | `server/studio/fixers.js:14`, `server/studio/qa/static.js:4`; `Dockerfile:13`; `package.json` (no `rolldown`) | add `rolldown` 1.2.12 to `dependencies` (the version vite and the studio-qa image already use), via a platform patch | open |

## Evidence notes

**STUDIO-01.** Reproduce: `expand({ template: "shade-grid@1", rows: 3, cols: 5, block: [3, 2], labels: true })` returns
`ok: false, errors: ["text_overlap:o2+frac"]`. A grid over every rows 1-6 × cols 1-10 × block, labels on, fraction shown:
1,080 of 1,080 refused (and 20 more with `o1+frac`). The fraction numwork's box is `y0 - 1.0 rh` to `y0 + 1.4 rh`
(`shared/whiteboard.js:610-622`, rh = 34.8), so its top sits about 35 units above `at`, on top of the "N rows" label at
`y0 + H + 18`. The claims board makes this exact call (`claims-board.js:98`, `labels: true`) whenever her line says
"shaded hissa 2 columns aur 3 rows" without asking; `claimsBoard` then skips it (`if (!x.ok) continue`). With 56 the
whole grid passes (4,616 of 4,616) and the deepest grid's denominator still ends inside the board.

**STUDIO-02.** `catalogue.js` header: "the blind cross-check's verdict is 'pass' (an unchecked or failed entry is
reported, never shown)". `entryFromRecord` honours that for `game` and `explainer` (`checked`), then pushes every beat
that lints into `e.boards` with no check. `board-first.js:217` and `board-sync.js:470` read `catalogueEntry(...).boards`.
Count today: 13 topics, 102 boards.

**STUDIO-03.** `loadCatalogue()` today: 385 files, games ok 368, unchecked 9, missing 4, unsafe string 1, safety-excluded 3.
Failed checks (from each file's `check.issues`): `c4-maths-ch03-t02` (rule "-10" on 50, 45, 40), `c5-evs-ch09-t02`
(explainer skips autumn), `c5-maths-ch04-t01` (key ₹550 for ₹36,250 + ₹18,750), `c5-maths-ch10-t01` (a fold-symmetry
round in a turn-symmetry topic), `c7-maths-ch08-t01` (a round that does not reach its misconception),
`c7-maths-ch09-t03` (the prompt gives away the answer), `c7-science-ch04-t03` (oxygen classed as "Burns"). Never
checked: `c4-maths-ch04-t02`, `c4-maths-ch07-t02`, `c4-maths-ch13-t02`, `c6-maths-ch07-t02`, `c6-maths-ch07-t04`,
`c7-science-ch09-t02`. Children on these topics get no catalogue game or explainer (the code boards still serve). Three more records
(`c7-science-ch06-t01` to `t03`) have none on purpose: they are under the child-safety floor, not a finding.

**STUDIO-04.** `grep -rn "api/forge/requests\|api/forge/prefetch"` over `src scripts tests evals server` finds only the
route table. `routes/lesson.js:457` warms through `forgeSeam.prefetchLessonFills`, which also registers `onFill`; the
route's own prefetch passes no `onFill` (`routes/forge.js:73`), so even if called its fills would never reach the
lesson's table. `tests/forge-g1.test.mjs:24` and `tests/forge-g1-serve.test.mjs:21` import `publicFill` and `limit`.

**STUDIO-05.** `Array.from({ length: Math.min(card.n, 8) }, (_, i) => i < card.n - 1 ? "is-done" : "is-now")`: for
`n = 9`, `i` runs 0-7 and every `i < 8`, so all eight are done. `cardFor` increments `n` on every fresh board of the
lesson, so a normal lesson passes 8.

**STUDIO-06.** `git apply --check` and `git apply --check -R` both fail for all five. `context/decisions.md:5241`
(`w2int-seam-patches-applied`) records that they were applied on 2026-10-05. `context/measurements.md:1380, 2288, 2845`
and `context/architecture.md:68` name them as the tree a measurement ran on. The skeptic found the added lines of four
of them in the code (7/7, 2/3, 13/13, 1/1) but only 5 of 15 for `w2h-turn-slot.patch`: that one was hand-merged and has
moved on since (`decisions.md:4647`), so it should be read before it is deleted. All five are cited, so per RULES2 they stay until main agrees;
the files remain in git history.

**STUDIO-07.** `scripts/test-shard.mjs:28` lists `tests/*.test.mjs` only; `package.json` `test` is `node --test tests/`.
`node --test src/studio-v2/tests/studio-v2.test.mjs`: 9 pass. Nothing else in the repo names the file.

**STUDIO-08.** `lesson.js` always passes `mode` (from `stagecraftMode()`, default "on"), so production is not affected;
any other caller (tests, evals) that builds a host without a mode silently gets "off". Two defaults for one flag.

**STUDIO-09.** Grid: start -20..100 step 7 × ten hop lists within the advertised range. Refusals: `line_too_long` 36
(by design, span > 40), `inside_board:eq` 9 (e.g. start -20, hops [3, 3, 3, 3]: the equation row starts at x 60 and runs
past 400), `text_overlap` 18 (hops [1, -1]: both hop labels at the same middle). A refused template steps the ladder
down; nothing false is drawn, but an author or the model is offered calls that cannot draw. The skeptic's random sample
of the advertised range: 897 of 2,000 refused.

**STUDIO-10.** `jobs.set(id, …)` on every picture and `perLesson.set(lessonId, …)` on every lesson that asks one; only
`_resetPictures` (tests) clears them. `failed` is cleared only when the next turn of the same lesson reads it.

**STUDIO-11.** `rungs` is never set (`conductor.js:94`: unset allows every rung), so with `control: "on"` the conductor
makes `generated_spec` candidates (`conductor.js:260`). `config.js:155,162` chains `taxila-stagecraft` (absent) then
`taxila-fast-bg`; `productionDeps()` gives the builder a real `chat` (`lesson.js:61-64`), so each launch is a paid call
(about $0.0013; caps 300 per lesson-hour and $0.06 per lesson-hour, `config.js:125`). At reveal, `tray-gate.js:205-208`
refuses a `generated_spec` with no `verdict.byViewport`, and `seam-bridge.js:109` passes `c?.verdict`, which nothing
sets (`grep judgeArtifact`: only its definition). The image and live rungs do not spend today: `productionDeps()` has
no `imageCall`, `decide`, `planBuild` or `buildRace`, so they throw "unwired". The gap map (`gap-map.json:914`) proposes
wiring the judge (an owner cost question); until that happens the spec spend buys nothing.

**STUDIO-12.** Reproduced by moving `node_modules/rolldown` aside (as `npm ci --omit=dev` leaves it):
`import("./server/index.js")` loads, but `import("./server/studio/build.js")` and `import("./server/studio/qa/gate.js")`
fail with `ERR_MODULE_NOT_FOUND: Cannot find package 'rolldown' imported from server/studio/fixers.js`. `seam.js:458`
imports `build.js` lazily inside `race()`, whose caller swallows the error (`.catch(() => null)`), so every live build
would quietly become the skeleton. `npm ls rolldown`: `vite@8.3.2 → rolldown@1.2.12`; `infra/studio-qa/package.json`
pins `rolldown 1.2.12` for its own image, which is why the gate service itself works.

## Patches

- `docs/patches/to-studio/003-shade-grid-fraction-clear.patch` (STUDIO-01) with `tests/r7-audit-studio-shade-grid.test.mjs`:
  0/2 before, 2/2 after; six existing suites that use shade-grid pass (70/70).
- `docs/patches/to-studio/004-catalogue-boards-need-check.patch` (STUDIO-02) with
  `tests/r7-audit-studio-catalogue-boards.test.mjs`: 1/3 before, 3/3 after; 170 existing tests that read the catalogue pass.

## The brief's four questions

- **`src/studio` against `src/studio-v2`, `server/forge` against `server/forge3`: which is live?** All four are live.
  `src/studio` is the stage every Studio piece renders in (`WorkTray.tsx`, `useDesk.ts`, the notebook screens).
  `src/studio-v2` is the engine library behind it: the Stagecraft renderer mounts it (`src/stagecraft/controller.ts:10-27`);
  only its `gallery/` and `tools/` are dev-only (not build inputs), and its tests are not run (STUDIO-07). `server/forge`
  holds the G1 fills the Director mounts (`forge/seam.js`, warmed at lesson start) and the board templates every board
  path draws with (`forge/explainer/**`). `server/forge3` holds the tray gate every reveal passes (`tray-gate.js`), the
  certificates, the board art and the play composer. What is left over: the two `/api/forge/*` routes (STUDIO-04) and the
  five applied `.patch` files (STUDIO-06).
- **Board templates that draw something false, clip at 360 px or fail their own lint.** I expanded every template over a
  parameter grid (counts below) and checked the drawn shaded count against the fraction and the written column-op answer
  against the sum: no false drawing found. The templates refuse rather than draw wrong. One fails its own lint on calls
  that are used in a lesson (STUDIO-01); one is advertised for ranges it cannot lay out (STUDIO-09). Clipping at 360 px is
  the stage's job (`boardFit.ts` lays the board out for the box at a 14 px floor); not re-measured here.
- **Catalogue entries nothing can reach.** 13 topics have no usable game or explainer (STUDIO-03), and their boards were
  still served (STUDIO-02). Every catalogue topic is in the curriculum, and every certificate names a catalogue topic.
- **Speculative builds: what a child sees when one fails or is late.** On default settings no speculative build reaches a
  child. The live race needs a gate service that is not wired (`seam.js:450`, and `gap-map.json:933`), so a "live"
  decision falls to the skeleton-as-activity, which the stage shows as a normal activity; while anything is being made
  the stage keeps the last finished piece or the calm ground (`StudioStage.tsx:114`, `143-147`), never a spinner or an error.
  A frame that errors becomes its skeleton (`StudioStage.tsx:281-290`); a slot that ends empty gives the tray back.
  Stagecraft's generated specs are paid for and always refused (STUDIO-11). If the gate is wired, live builds would still
  not run in the production image (STUDIO-12).

## Coverage

**Read fully:** `server/routes/studio.js`, `server/routes/forge.js`, `server/forge/seam.js`, `server/forge/index.js`
(requestFill, prefetch), `server/studio/picture.js`, `server/stagecraft/claims-board.js`, `catalogue.js`, `beat-card.js`,
`lesson.js`, `host.js` (constructor and input), `src/studio/StudioStage.tsx`, `src/studio/renderers.ts`,
`src/studio/useStudio.ts` (wire and api), `infra/studio-qa/*`, `server/forge3/certify.js`, the maths templates in
`server/forge/explainer/templates.js` (lines 95-705) and its `expand` / claims code, `board-ref.js`.

**Sampled:** `server/studio/seam.js` (about 400 of 1,734 lines: registry, runPiece, onReveal, mount rows),
`server/stagecraft/conductor.js` (rungs, spec launch), `builders.js` (spec, image, live), `config.js`,
`server/forge3/tray-gate.js` (stagecraft and frame cases), `shared/whiteboard.js` (lint and numwork geometry),
`server/studio/plan.js` (planBuild), `src/modules/whiteboard/StudioWhiteboard.tsx` (header, timing),
`src/studio/skeletons.tsx` (registry).

**Measured (pure code, no network):**
- template expansion grids: fraction-parts 264, column-op 190, combine-count 187, equal-groups 40, fraction-of 400,
  fraction-line (show) 365, number-line-hop 180, place-value 11, shade-grid 236 + 4,616, fraction-bars 6, area-grid 960,
  bar-chart 45, angle 70, measured 451, wholes 25, unrolled 6, timeline 4, flow 4, cycle 4, compare 1, zoom 6, scale 6;
- `loadCatalogue()` over all 385 topic files; the explainer library (316 entries) through `checkCall` and `expand`;
- the certificate table against the catalogue; the client import graph for `src/studio*`, `src/stagecraft`,
  `src/modules/whiteboard`; every `process.env` read in the area and where it is set;
- the production import of `build.js` / `qa/gate.js` without `rolldown`; the studio-qa image's file layout.

**Not read:** `src/studio-v2/engines/**` and `core/**` (about 11,000 lines; their own 9 tests pass when run by hand),
`shared/studio-spec-ext/**`, `server/studio/build.js`, `router.js`, `qa/players/**`, `server/forge3/compose.js`,
`art.js`, the G1 planner and templates (`server/forge/planner.js`, `templates.js`, `generator.js`),
`src/stagecraft/controller.ts`, and the catalogue's game and explainer content beyond its recorded checks.
`board-first.js` and `board-sync.js` were read only where cited: the held board (director16, "Decision:
dc-r7-held-board") is being built in them now and is not a finding here.
