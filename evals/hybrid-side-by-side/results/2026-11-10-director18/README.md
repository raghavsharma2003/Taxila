# director18 (2026-11-10)

Run facts only; counts are made by hand by the judges.

- **Tree:** int/r6 `2239d0005` (integration 23): Brain v6.9 (`dc-r7-script-walk-v6-9`: turns that teach nothing hold the board, bridges in the next unit, the request table, the acknowledgement, wording), Studio v6.9 (split view from the board's own parts, picture line, layout record), Learning D12.
- **Lessons:** 16 (4 topics × steady, stuck, offtopic, steering), Director only, reactive child, `TAXILA_R7_SCRIPT=on`.
- **Cost:** 1,513 model calls, about $1.044, in one run (cap $1.25).
- **Scripts as run:** `scripts/` (Learning D12 with its follow-up).
- **In each row of the `.json`:** `held` now comes from what was drawn (unit, changed, kept, drawn, pages). `layout` was meant to be recorded and is on no row; `changed` and `kept` compare against the page preselected earlier in the same turn and are wrong on about 30 rows. The judges read the take, not these flags.

- **Judged by hand:** `judges/` (four reports and the prompt they were given). Write-up: `docs/design/round7/judgements/director18-2026-11-10.md`.
