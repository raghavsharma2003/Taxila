# Round 4 · stream 2 (content) · patch requests

Applied on `claude/r4-content` only as separate commits titled `[patch-request] …`; the main session drops and re-applies
them at merge (BUILD-PLAN §4 rule 2, §5).

| # | patch | files (not stream 2's) | why | proof |
|---|---|---|---|---|
| 01 | `01-board-page-migration.diff` | `db/migrations/024_board_page.sql` (new; number 024 allotted by the main session, 2026-10-10; idempotent, additive only) | the notebook: every board a child was shown is saved per lesson (lesson-keyed like `studio_mount`, cascades with the lesson, no `child_id` column), so `GET /api/studio/notebook` lists a child's pages on any device and replays them in order | `tests/prod/r4-content-boards.mjs` notebook check (every lesson's boards saved, listed and replayable in order); without the table the seam logs once and the notebook falls back to the device list |
| 02 | `02-visual-before-module-plan.diff` | `server/director/state.js` (stream 4A) | the child's visual ask (`p.visual`) is set on the move BEFORE `planModule`, so a game / animation / simulation ask gets the topic engine's open task (`modules.js` `interactiveDefault`: geoboard build, place-value build). Before, `move.visual` was set after the plan, so `interactiveDefault` never fired live and every such ask got the still board rung (round3-forge R2 1/6 on taxila.dev and on this branch's local build, 2026-10-10). The later assignment (with its shape) is unchanged. | in-process: c6-maths-ch06-t01 ask → `geoboard@1 build`, c5-maths-ch01-t01 → `place-value@1 build` (were `explainer@1`); `tests/prod/round3-forge.mjs` R2 on a local production build |
