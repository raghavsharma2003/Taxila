-- Round 5 truth bar (main 2026-10-15, dc-r143-edit-full-undo; ships in 14.5 or with the latency work): an edited
-- re-send of a child turn (same turnSeq, edited: true) that arrives AFTER the turn landed, and before any later turn
-- landed, SUPERSEDES it: the lesson state is restored from the snapshot taken when that turn committed, the turn's rows
-- MOVE to the archive tables below (never flagged: rj-r143-supersede-flag-column; never deleted), and the edit is graded
-- as the turn. Number 030 allotted by main (db/migrations/README.md, int/r5-rel143 @ 3c975f83).

-- One row per lesson: the state BEFORE its latest committed turn, overwritten in that turn's transaction. `ids` names
-- that turn's rows: { kt: kt_evidence ids, rows: child turn-row seqs, audit / probe / weave: grade_audit, probe_log,
-- weave_queue ids }.
create table if not exists lesson_undo (
  lesson_id  uuid primary key references lesson(id) on delete cascade,
  turn_seq   int not null,
  turn       int not null,
  prev       jsonb not null,
  ids        jsonb not null,
  at         timestamptz not null default now()
);

-- The archives: the same columns (no identity, no unique indexes: a row keeps its id) plus who superseded it and when.
-- The foreign keys mirror the originals', so a deleted child / lesson takes its archived rows with it; the M0 ratchet
-- classifies each one (server/learner/mode.js).
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

create table if not exists grade_audit_superseded (like grade_audit including defaults);
alter table grade_audit_superseded add column if not exists superseded_by text;
alter table grade_audit_superseded add column if not exists superseded_at timestamptz;
create index if not exists grade_audit_superseded_child on grade_audit_superseded (child_id);

create table if not exists probe_log_superseded (like probe_log including defaults);
alter table probe_log_superseded add column if not exists superseded_by text;
alter table probe_log_superseded add column if not exists superseded_at timestamptz;
create index if not exists probe_log_superseded_child on probe_log_superseded (child_id);

create table if not exists weave_queue_superseded (like weave_queue including defaults);
alter table weave_queue_superseded add column if not exists superseded_by text;
alter table weave_queue_superseded add column if not exists superseded_at timestamptz;
create index if not exists weave_queue_superseded_child on weave_queue_superseded (child_id);

-- rows whose child / lesson is gone (none in a fresh database) would block the constraint
delete from kt_evidence_superseded a where not exists (select 1 from child c where c.id = a.child_id);
delete from evidence_superseded a where not exists (select 1 from child c where c.id = a.child_id) or (a.lesson_id is not null and not exists (select 1 from lesson l where l.id = a.lesson_id));
delete from brain_trace_superseded a where not exists (select 1 from lesson l where l.id = a.lesson_id);
delete from grade_audit_superseded a where not exists (select 1 from child c where c.id = a.child_id);
delete from probe_log_superseded a where not exists (select 1 from child c where c.id = a.child_id);
delete from weave_queue_superseded a where not exists (select 1 from child c where c.id = a.child_id);
-- (drop + add: idempotent; scripts/migrate.mjs splits on semicolons, so no DO block; the archives are empty when added)
alter table kt_evidence_superseded drop constraint if exists kt_evidence_superseded_child_fk;
alter table kt_evidence_superseded add constraint kt_evidence_superseded_child_fk foreign key (child_id) references child(id) on delete cascade;
alter table evidence_superseded drop constraint if exists evidence_superseded_child_fk;
alter table evidence_superseded add constraint evidence_superseded_child_fk foreign key (child_id) references child(id) on delete cascade;
alter table evidence_superseded drop constraint if exists evidence_superseded_lesson_fk;
alter table evidence_superseded add constraint evidence_superseded_lesson_fk foreign key (lesson_id) references lesson(id) on delete cascade;
alter table brain_trace_superseded drop constraint if exists brain_trace_superseded_lesson_fk;
alter table brain_trace_superseded add constraint brain_trace_superseded_lesson_fk foreign key (lesson_id) references lesson(id) on delete cascade;
alter table grade_audit_superseded drop constraint if exists grade_audit_superseded_child_fk;
alter table grade_audit_superseded add constraint grade_audit_superseded_child_fk foreign key (child_id) references child(id) on delete cascade;
alter table probe_log_superseded drop constraint if exists probe_log_superseded_child_fk;
alter table probe_log_superseded add constraint probe_log_superseded_child_fk foreign key (child_id) references child(id) on delete cascade;
alter table weave_queue_superseded drop constraint if exists weave_queue_superseded_child_fk;
alter table weave_queue_superseded add constraint weave_queue_superseded_child_fk foreign key (child_id) references child(id) on delete cascade;
