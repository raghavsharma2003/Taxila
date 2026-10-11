-- Release 12, the flight recorder (docs/design/round4/build/r12/TRACKING-BRIEF.md, decision dc-r12-flight-recorder;
-- T-server). Every session recorded end to end, client and server, in one time-ordered stream (shared/trace.ts TraceEvent).
-- Tier 1 (every account): structured events, no audio. Tier 2 (TAXILA_TRACE_FULL_FOR only): also blobs (model prompts and
-- raw responses, DOM replay, audio) in the storage container "trace", pointed to by data.blob.ref.
-- cid / gid cascade from child / guardian: the parent corner's erasure (DELETE /api/children, DELETE /api/account) deletes
-- the rows in its own transaction; the handlers delete the blobs after it commits (server/trace/erase.js).
-- Retention (server/trace/retention.js, the nightly ops job): tier 1 for 30 days, tier 2 for 90 days.
-- Idempotent and additive only.
create table if not exists trace_event (
  id    bigserial primary key,
  sid   text not null,
  pid   text,
  cid   uuid references child(id) on delete cascade,
  gid   uuid references guardian(id) on delete cascade,
  src   text not null check (src in ('client', 'server', 'worker')),
  seq   int not null,
  t     timestamptz not null,
  kind  text not null,
  turn  int,
  rid   text,
  tier  smallint not null default 1 check (tier in (1, 2)),
  data  jsonb not null default '{}'::jsonb,
  at    timestamptz not null default now()
);
create index if not exists trace_event_sid_t on trace_event (sid, t);
create index if not exists trace_event_cid_t on trace_event (cid, t);
create index if not exists trace_event_kind_t on trace_event (kind, t);
create index if not exists trace_event_rid on trace_event (rid) where rid is not null;
create index if not exists trace_event_pid on trace_event (pid) where pid is not null;
create index if not exists trace_event_gid_t on trace_event (gid, t);
-- retention scans by age and tier
create index if not exists trace_event_tier_t on trace_event (tier, t);

-- The owner's flags ("Flag this moment", client kind flag.owner), with their place in the timeline.
create or replace view trace_flag as
  select id, sid, pid, cid, gid, t, turn, data->>'note' as note, data
  from trace_event where kind = 'flag.owner';
