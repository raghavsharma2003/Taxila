-- 010: stored parent reports (server/reports/**; PARENT-REPORT.md §10.1 stages 1-9, CONDUCTOR.md §7.3 X8/X11). Additive, re-runnable.
-- One row per (child, cadence, period, render_version): the job is idempotent on that key, and an operator re-render
-- under a new template version is a new row, never an overwrite. `claims` holds every admitted claim with its slots
-- and the ledger rows behind it (factIds) — the "Kaise pata?" tap-through reads them; `renders` holds the Lane A
-- text in en / hinglish / hi plus the validated spoken script. No transcript text and no voice features are stored
-- here. Cascades on the child's erasure.
create table if not exists parent_report (
  id              bigint generated always as identity primary key,
  child_id        uuid not null references child(id) on delete cascade,
  cadence         text not null check (cadence in ('daily', 'weekly')),
  period          text not null,                              -- 'YYYY-MM-DD' (learning day) | 'YYYY-Www' (ISO week)
  window_from     timestamptz not null,
  window_to       timestamptz not null,
  render_version  text not null,
  k7              boolean not null default false,             -- the calibration gate state the text was rendered under
  claims          jsonb not null,
  renders         jsonb not null,
  meta            jsonb not null default '{}',                -- screened candidates, Lane B attempts / model / ms / spend
  facts_digest    text not null,
  created_at      timestamptz not null default now(),
  unique (child_id, cadence, period, render_version)
);
create index if not exists parent_report_child on parent_report (child_id, cadence, period desc);
