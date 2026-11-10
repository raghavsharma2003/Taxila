# director19 (2026-11-10)

Run facts only; counts are made by hand by the judges.

- **Tree:** int/r6 `d0dd1d5a0` (integration 25c): Brain v6.10 (`dc-r7-script-walk-v6-10`: the picture turn decided once, the request table's T2 rows, the acknowledgement removed, pace and openers, authored joints) and its follow-up (script-card help counts as help; a card answered right is not posed again in the lesson), Studio P6 (`pictureTurn`), Learning D13 (joints, data fixes).
- **Lessons:** 16 (4 topics × steady, stuck, offtopic, steering), Director only, reactive child, `TAXILA_R7_SCRIPT=on`. The round 8 reader (`knows.js`) is on this tree as a module with no call site: it changes nothing in this run.
- **Cost:** 1,544 model calls, about $1.071, in one run (cap $1.25). A first attempt was killed by a worker restart after four lessons (about $0.25, not used).
- **Scripts as run:** `scripts/` (Learning D13).
- **In each row of the `.json`:** `held` comes from what was drawn (unit, changed, kept, drawn, pages, and `layout` on a picture turn). `changed` and `kept` now compare against the board that was up before the turn. The child sim answers only a card her line has said, and the goodbye waits for an open card.
- **Judged by hand:** `judges/` (four reports and the prompt they were given). Write-up: `docs/design/round7/judgements/director19-2026-11-10.md`.
