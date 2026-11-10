# Audit: studio (2026-11-10)

Area 4 of the whole-project audit (`BRIEF.md`, `RULES2.md`). **Audit only**: the Studio stream is mid-build in these
files, so no product code is changed here. Small, certain fixes are written as patches under
`docs/patches/to-studio/` with a test that fails before and passes after.

Branch `claude/r7-audit-studio`, from `int/r6` at integration 21a (`8bb6b188`).

Status: **in progress** (pushed early; more findings follow).

## Findings

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| STUDIO-01 | P1 | broken | studio | shade-grid@1 with labels and a shown fraction fails its own lint for every grid of 2+ rows, so the claims board for "N columns aur M rows" draws nothing | `server/forge/explainer/templates.js:439`, called by `server/stagecraft/claims-board.js:98` | move the fraction from `y0 + H + 34` to `y0 + H + 56` | patch 003 |
| STUDIO-02 | P2 | inconsistent | studio | catalogue boards are served for topics whose cross-check failed or never ran (13 topics, 102 boards); the game and explainer of the same topics are withheld | `server/stagecraft/catalogue.js:136-143` (served by `board-first.js:217`, `board-sync.js:470`) | skip the boards when the record is not checked | patch 004 |
| STUDIO-03 | P2 | not good enough | studio | 13 catalogue topics have no usable game or explainer; 7 failed the cross-check on real errors (oxygen sorted as "Burns", a "-10" rule on a 50, 45, 40 pattern, a ₹550 key for ₹36,250 + ₹18,750) and 6 were never checked; one more game is refused for an unsafe string | `data/studio-catalogue/topics/` (list below) | re-author the 13 and re-run the cross-check; the 7 errors are listed so the authoring prompt can be fixed first | open |
| STUDIO-04 | P3 | no longer needed | studio | `POST /api/forge/requests` and `POST /api/forge/prefetch` have no caller anywhere (client, scripts, tests/prod); the lesson warms fills through `forgeSeam.prefetchLessonFills` instead | `server/routes/forge.js:51-77` | delete both routes; move `publicFill` and `limit` (used by two tests) or drop them with the routes | proposal (needs main) |
| STUDIO-05 | P3 | broken | studio | the beat card's progress dots stop moving from the 9th board: 8 dots are drawn and all are "done", so no dot is "now" | `src/studio/StudioStage.tsx:328` (`card.n` grows per board: `server/stagecraft/beat-card.js:42`) | mark dot `min(n, 8) - 1` as now: `i < Math.min(card.n, 8) - 1` | open |
| STUDIO-06 | P3 | no longer needed | studio | five `.patch` files inside product folders were applied in the W2 integration and now apply neither forward nor backward | `server/forge/seam-patches/*.patch` (3), `server/studio/seam-patches/*.patch` (2) | delete them; `context/` cites them by name as method, so add an inbox entry with the last commit that holds them | proposal (needs main) |
| STUDIO-07 | P3 | inconsistent | studio | the Studio v2 node tests live outside `tests/`, so neither `npm test` nor `npm run test:all` runs them (9 tests; they pass today when run by hand) | `src/studio-v2/tests/studio-v2.test.mjs`; `scripts/test-shard.mjs:28` reads only `tests/` | move the file to `tests/studio-v2.test.mjs` (fix its relative imports) | open |
| STUDIO-08 | P3 | inconsistent | studio | Stagecraft's default mode is "on" in `lesson.js` and in its header, but `StagecraftHost` falls back to "off" when no mode is passed | `server/stagecraft/host.js:30` vs `server/stagecraft/lesson.js:27-30` | `o.mode ?? stagecraftMode()` (one default, one place) | open |
| STUDIO-09 | P3 | not good enough | studio | number-line-hop@1 is advertised (and authorable) for ranges it cannot lay out: 63 of 180 calls on a grid of the advertised range are refused (an equation with negatives runs off the board; "+1" then "-1" labels overlap) | `server/forge/explainer/templates.js:507-547`, `server/forge/explainer/board-ref.js:22` | narrow the advertised range to what lays out, or wrap the equation row | open |
| STUDIO-10 | P3 | not good enough | studio | the picture lane's per-job and per-lesson maps are never pruned, so a long-running replica keeps one entry per picture and per lesson forever | `server/studio/picture.js:47-55`, `118-120` | drop a lesson's `perLesson` / `failed` rows and its jobs when the seam forgets the lesson, or cap the maps like `cache` | open |

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
`c7-science-ch09-t02`. Children on these topics get no catalogue game or explainer (the code boards still serve).

**STUDIO-04.** `grep -rn "api/forge/requests\|api/forge/prefetch"` over `src scripts tests evals server` finds only the
route table. `routes/lesson.js:457` warms through `forgeSeam.prefetchLessonFills`, which also registers `onFill`; the
route's own prefetch passes no `onFill` (`routes/forge.js:73`), so even if called its fills would never reach the
lesson's table. `tests/forge-g1.test.mjs:24` and `tests/forge-g1-serve.test.mjs:21` import `publicFill` and `limit`.

**STUDIO-05.** `Array.from({ length: Math.min(card.n, 8) }, (_, i) => i < card.n - 1 ? "is-done" : "is-now")`: for
`n = 9`, `i` runs 0-7 and every `i < 8`, so all eight are done. `cardFor` increments `n` on every fresh board of the
lesson, so a normal lesson passes 8.

**STUDIO-06.** `git apply --check` and `git apply --check -R` both fail for all five. `context/decisions.md:5241`
(`w2int-seam-patches-applied`) records that they were applied on 2026-10-05. `context/measurements.md:1380, 2288, 2845`
and `context/architecture.md:68` name them as the tree a measurement ran on, so per RULES2 they stay until main agrees;
the files remain in git history.

**STUDIO-07.** `scripts/test-shard.mjs:28` lists `tests/*.test.mjs` only; `package.json` `test` is `node --test tests/`.
`node --test src/studio-v2/tests/studio-v2.test.mjs`: 9 pass. Nothing else in the repo names the file.

**STUDIO-08.** `lesson.js` always passes `mode` (from `stagecraftMode()`, default "on"), so production is not affected;
any other caller (tests, evals) that builds a host without a mode silently gets "off". Two defaults for one flag.

**STUDIO-09.** Grid: start -20..100 step 7 × ten hop lists within the advertised range. Refusals: `line_too_long` 36
(by design, span > 40), `inside_board:eq` 9 (e.g. start -20, hops [3, 3, 3, 3]: the equation row starts at x 60 and runs
past 400), `text_overlap` 18 (hops [1, -1]: both hop labels at the same middle). A refused template steps the ladder
down; nothing false is drawn, but an author or the model is offered calls that cannot draw.

**STUDIO-10.** `jobs.set(id, …)` on every picture and `perLesson.set(lessonId, …)` on every lesson that asks one; only
`_resetPictures` (tests) clears them. `failed` is cleared only when the next turn of the same lesson reads it.

## Patches

- `docs/patches/to-studio/003-shade-grid-fraction-clear.patch` (STUDIO-01) with `tests/r7-audit-studio-shade-grid.test.mjs`:
  0/2 before, 2/2 after; six existing suites that use shade-grid pass (70/70).
- `docs/patches/to-studio/004-catalogue-boards-need-check.patch` (STUDIO-02) with
  `tests/r7-audit-studio-catalogue-boards.test.mjs`: 1/3 before, 3/3 after; 170 existing tests that read the catalogue pass.

## Coverage

(filled in at the end)
