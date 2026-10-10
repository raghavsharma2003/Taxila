# Round 4 · G1 games core + Antariksh · RESULTS

**Branch:** `claude/r4-games-core` · **Base:** `claude/blissful-mayer-icwe2j` @ 0e4bb7b6 · **Started:** 2026-10-10.
**Honesty:** nothing here has met a child or run on a phone. Browser numbers are a SwiftShader proxy in headless
Chromium on a shared container and are labelled as such.

## Done

| item | state | evidence |
|---|---|---|
| Day 0: core API contract | pushed | `CORE-API.md`, `src/play/engines/core3d/api.ts` (+ `tier.ts`, `registry.ts`); `tests/r4-games-core-api.test.mjs` 3/3 |
| S0.3 rule split | done, no behaviour change | `server/play/tools/rules/{todo-jodo,taraazu,nishana,kyun-lab}.mjs` + `index.mjs`; `build-coverage --check` output and `data/play/coverage.json` byte-identical before/after; `tests/play-*.test.mjs` + `round3-fix` 180/180 before and after (only a timing diagnostic line differs); `tests/r4-games-core-rules-split.test.mjs` 4/4 |

G2 adds a family by dropping `server/play/tools/rules/<family>.mjs` (exporting `family`, `RULES`, `ACTS`, optional
`check`); `rules/index.mjs` picks it up after the four fixed families, alphabetically, with no edit to either file.

## Environment notes

- The container's Playwright browsers are build 1194; the repo's Playwright 1.63 expects 1243. The test suite was run
  with `PLAYWRIGHT_BROWSERS_PATH` pointing at a scratch directory that aliases the 1194 binaries under the 1243 names
  (nothing in the repo or `/opt` changed). Without it every browser test fails at launch.

## Not met yet / next

Core3d stage, Antariksh, dress delta, economy lint, certification: in progress.
