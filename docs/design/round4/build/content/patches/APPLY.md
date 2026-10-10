# Round 4 · stream 2 (content) · patch requests

Applied on `claude/r4-content` only as separate commits titled `[patch-request] …`; the main session drops and re-applies
them at merge (BUILD-PLAN §4 rule 2, §5).

| # | patch | files (not stream 2's) | why | proof |
|---|---|---|---|---|
| 01 | `01-board-page-migration.diff` | `db/migrations/024_board_page.sql` (new; **provisional number**: the main session allots it) | the notebook: every board a child was shown is saved per lesson (lesson-keyed like `studio_mount`, cascades with the lesson, no `child_id` column), so `GET /api/studio/notebook` lists a child's pages on any device and replays them in order | `tests/prod/r4-content-boards.mjs` notebook check (every lesson's boards saved, listed and replayable in order); without the table the seam logs once and the notebook falls back to the device list |
