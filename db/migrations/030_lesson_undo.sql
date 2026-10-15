-- Round 5 truth bar (main 2026-10-15, dc-r143-edit-full-undo; 14.4 at the earliest): an edited re-send of a child turn
-- (same turnSeq, edited: true) that arrives AFTER the turn landed, and before any later turn landed, SUPERSEDES it: the
-- lesson state is restored from the snapshot taken when that turn committed, the turn's evidence MOVES to the archive
-- tables below (never deleted; no live reader can resurrect it), and the edit is graded as the turn.
-- Number: tentative until main allots it (db/migrations/README.md).

-- One row per lesson: the state BEFORE its latest committed turn, overwritten in that turn's transaction.
create table if not exists lesson_undo (
  lesson_id  uuid primary key references lesson(id) on delete cascade,
  turn_seq   int not null,
  turn       int not null,
  prev       jsonb not null,
  ids        jsonb not null,
  at         timestamptz not null default now()
);

-- The archives: identical columns plus who superseded the row and when.
create table if not exists kt_evidence_superseded (like kt_evidence including defaults);
alter table kt_evidence_superseded add column if not exists superseded_by text;
alter table kt_evidence_superseded add column if not exists superseded_at timestamptz;
create index if not exists kt_evidence_superseded_child on kt_evidence_superseded (child_id);

create table if not exists evidence_superseded (like evidence including defaults);
alter table evidence_superseded add column if not exists superseded_by text;
alter table evidence_superseded add column if not exists superseded_at timestamptz;
create index if not exists evidence_superseded_child on evidence_superseded (child_id);

create table if not exists brain_trace_superseded (like brain_trace including defaults);
alter table brain_trace_superseded add column if not exists superseded_by text;
alter table brain_trace_superseded add column if not exists superseded_at timestamptz;
create index if not exists brain_trace_superseded_lesson on brain_trace_superseded (lesson_id);
