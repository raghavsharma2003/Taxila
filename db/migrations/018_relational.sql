-- W2-I (BUILD-PLAN §1.6 W2 allotment; RELATIONAL-OS §5.1-§5.4, R0): the bond record. Additive and re-runnable.
--
-- 1. rel_bond: the bond record per (child, agent), a CACHE of the rel_event fold (server/relational/bond.js replay must
--    equal it byte for byte, AT-U1). Facts only: academic-record counts that gate the stage, the stage (never regresses),
--    the address the child conferred, an open teacher-owned event, fired milestone ids, the ritual ledger. NO trust,
--    closeness, mood, rupture kind about the child's feelings, timing, gap or free text (NM-3; the scan in
--    tests/learner-mode.test.mjs reads this file). Layer rel_bond (M1+), server/learner/mode.js.
--    DEVIATION from §5.3 (decision w2i-rel-bond-new-table): the spec re-keys rel_state to (child, agent). rel_state is
--    written by learner/writer.js relSessionStmt (`on conflict (child_id)`) inside lesson.js end() and by account.js at
--    child creation, both outside W2-I's paths: changing its primary key would make every lesson end throw until both
--    move. rel_state stays the legacy session counter; rel_bond is the new per-agent record.
-- 2. rel_event gains agent_id, dim (closed set), cite {lessonId, turnIdx[]} (index-only, never a quote) and body (closed
--    fields per dim). rel_event.note (free text, 001) is never written again: NOT NULL is dropped so new rows omit it.
-- 3. relational_note: parent-visible relational facts as typed templates over closed slots (never the child's words),
--    rendered at read time in the parent's language. M0 history (deleted on the ratchet to M0).
-- 4. rel_overlay_window: the cross-session dependency counters (integers only). Layer rel_overlay = M3 only: no M1 or M2
--    write path exists (assertWritable throws), so no row exists for a launch child.
create table if not exists rel_bond (
  child_id       uuid not null references child(id) on delete cascade,
  agent_id       text not null,
  stage          text not null default 'meeting' check (stage in ('meeting','first_sessions','regular','long_haul')),
  stage_since    timestamptz not null default now(),
  sessions       int not null default 0 check (sessions >= 0),
  distinct_days  int not null default 0 check (distinct_days >= 0),
  first_day      date,
  last_day       date,
  address        jsonb,
  teacher_open   jsonb,
  milestones     text[] not null default '{}',
  rituals        jsonb not null default '{}'::jsonb,
  event_seq      bigint not null default 0,
  legal_mode_at_write text not null,
  updated_at     timestamptz not null default now(),
  primary key (child_id, agent_id)
);

alter table rel_event add column if not exists agent_id text;
alter table rel_event add column if not exists dim text;
alter table rel_event add column if not exists cite jsonb;
alter table rel_event add column if not exists body jsonb;
alter table rel_event alter column note drop not null;
alter table rel_event drop constraint if exists rel_event_dim_check;
alter table rel_event add constraint rel_event_dim_check check (dim is null or dim in ('teacher_owned','repair','address','stage','milestone','ritual','christen','session'));
alter table rel_event drop constraint if exists rel_event_cited;
alter table rel_event add constraint rel_event_cited check (dim is null or (cite is not null and jsonb_typeof(cite->'turnIdx') = 'array' and jsonb_array_length(cite->'turnIdx') >= 1 and agent_id is not null and note is null));
create index if not exists rel_event_child_agent on rel_event(child_id, agent_id, id);

create table if not exists relational_note (
  id          bigserial primary key,
  child_id    uuid not null references child(id) on delete cascade,
  agent_id    text not null,
  lesson_id   uuid references lesson(id) on delete cascade,
  kind        text not null check (kind in ('boundary_warmth','boundary_secret','boundary_contact','boundary_romance','boundary_goodbye','identity_asked','memory_forgotten','milestone','christened','teacher_slip_owned','safeguard_handoff')),
  slots       jsonb not null default '{}'::jsonb,
  at          timestamptz not null default now()
);
create index if not exists relational_note_child on relational_note(child_id, at desc);

create table if not exists rel_overlay_window (
  child_id    uuid not null references child(id) on delete cascade,
  agent_id    text not null,
  week        date not null,
  counts      jsonb not null,
  primary key (child_id, agent_id, week)
);
