-- Conductor M0 substrate (docs/research/conductor/CONDUCTOR.md §2.4, §3.1, §3.8, §3.9; decisions
-- conductor-code-reducer, conductor-substrate-neon). The spec calls this file 002_conductor.sql; 002/003 were taken.
--
-- LOCK ORDER (X29, measured): child_seq is the LAST existing row any multi-table writer locks.
--   Conductor commit: conductor_state -> job -> wakeup -> notification/notify_slot -> child_seq.
--   complete_job:     job -> workspace (read) -> child_seq (via ingest_event).
--   fire_wakeups:     wakeup (SKIP LOCKED) -> each child's child_seq (the ONLY multi-child_seq writer).
--   domain write + ingest_event: own domain row -> child_seq.
-- Every child-keyed row cascades on the child's erasure (notification: fixed in 004_conductor_notification.sql;
-- notify_slot.child_id is a deliberate set-null tombstone).
--
-- scripts/migrate.mjs splits on a ';' at END OF LINE and runs one statement per HTTP call. Inside every
-- $$ body below no line ends with ';' (each internal statement ends '; --'), so a function is one statement.
-- tests/conductor-planner.test.mjs checks that split. Everything is re-runnable (if not exists / or replace).

-- ULID (Crockford base32, 48-bit ms time + 80 random bits): event ids minted inside SQL (complete_job, fire_wakeups).
create or replace function gen_ulid() returns text language plpgsql volatile as $$
declare
  enc constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; --
  ts bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint; --
  rnd bytea := gen_random_bytes(10); --
  out text := ''; --
  acc bigint; --
  h int; i int; --
begin
  for i in reverse 9..0 loop out := out || substr(enc, ((ts >> (5 * i)) & 31)::int + 1, 1); end loop; --
  for h in 0..1 loop
    acc := 0; --
    for i in 0..4 loop acc := (acc << 8) | get_byte(rnd, h * 5 + i); end loop; --
    for i in reverse 7..0 loop out := out || substr(enc, ((acc >> (5 * i)) & 31)::int + 1, 1); end loop; --
  end loop; --
  return out; --
end $$;

-- ───────────── the log (§2.4) ─────────────
create table if not exists child_seq (
  child_id      uuid primary key references child(id) on delete cascade,
  last          bigint not null default 0,
  pending_since timestamptz                       -- the dirty set (X30): set on ingest, cleared by the commit that folds it
);
create index if not exists child_seq_dirty on child_seq (pending_since) where pending_since is not null;

create table if not exists student_event (
  child_id       uuid not null references child(id) on delete cascade,
  seq            bigint not null,                  -- per child, commit-ordered (orch R2.1)
  id             text not null,
  type           text not null,
  source         text not null check (source in ('device','director','parent','school','clock','agent','safety','system')),
  idem_key       text not null,
  occurred_at    timestamptz not null,
  received_at    timestamptz not null default now(),
  causation_id   text,
  correlation_id text not null,
  traceparent    text,
  body           jsonb not null,
  primary key (child_id, seq),
  unique (child_id, idem_key)
);
create index if not exists student_event_type on student_event (child_id, type, seq desc);

-- The ONLY way to append. The child_seq row lock is held to commit, so seq N+1 cannot commit before N (I-R1).
-- Duplicates (same idem key) return null and write nothing. The duplicate re-check runs AFTER the row lock, so a
-- concurrent duplicate waits for the first, sees its row, and returns null without burning a seq (no gaps).
create or replace function ingest_event(p_child uuid, p_id text, p_type text, p_source text, p_idem text,
  p_occurred timestamptz, p_corr text, p_cause text, p_body jsonb, p_trace text default null)
returns bigint language plpgsql as $$
declare s bigint; --
begin
  if exists (select 1 from student_event where child_id = p_child and idem_key = p_idem) then return null; end if; --
  insert into child_seq (child_id) values (p_child) on conflict do nothing; --
  perform 1 from child_seq where child_id = p_child for update; --
  if exists (select 1 from student_event where child_id = p_child and idem_key = p_idem) then return null; end if; --
  update child_seq set last = last + 1, pending_since = coalesce(pending_since, now())
   where child_id = p_child returning last into s; --
  insert into student_event (child_id, seq, id, type, source, idem_key, occurred_at, correlation_id, causation_id, body, traceparent)
  values (p_child, s, p_id, p_type, p_source, p_idem, p_occurred, p_corr, p_cause, p_body, p_trace); --
  return s; --
end $$;

-- ───────────── the actor (§3.1) ─────────────
create table if not exists conductor_state (
  child_id     uuid primary key references child(id) on delete cascade,
  state_v      int not null,
  version      bigint not null default 0,
  cursor_seq   bigint not null default 0,
  mode         text not null default 'free' check (mode in ('free','in_lesson','paused','safety_hold')),
  learning_day date,
  plan_day     date,
  plan_version int,
  state        jsonb not null,
  lease_token  uuid,
  lease_until  timestamptz,
  updated_at   timestamptz not null default now()
);

-- The Conductor's turn_trace and the replay input record (orch R2.8). brief_digest -> brief_snapshot (X34).
create table if not exists decision_log (
  child_id       uuid not null references child(id) on delete cascade,
  version        bigint not null,
  at             timestamptz not null default now(),
  now_used       timestamptz not null,
  state_v        int not null,
  build_sha      text not null,
  from_seq       bigint not null,
  to_seq         bigint not null,
  brief_digest   text,
  household_v    bigint,
  arms           text[] not null default '{}',
  decisions      jsonb not null,                   -- [{seq, type, rules[], blocked:[{cmd, guard, reason}], quarantined?}]
  commands       jsonb not null,
  correlation_id text not null,
  primary key (child_id, version)
);

-- Content-addressed recorded view reads (X34, X41): {"key": {value, asOf, src, stale}}.
create table if not exists brief_snapshot (
  child_id   uuid not null references child(id) on delete cascade,
  digest     text not null,
  value      jsonb not null,
  created_at timestamptz not null default now(),
  primary key (child_id, digest)
);

-- Versioned plans, written ONLY inside the Conductor commit (X2).
create table if not exists day_plan (
  child_id    uuid not null references child(id) on delete cascade,
  day         date not null,
  version     int not null,
  source      text not null check (source in ('code','llm')),
  inputs_hash text not null,
  reason      text not null,                       -- 'first_open' | 'replan:<cause>' | 'resume' | 'parent_change' | 'day_start'
  plan        jsonb not null,
  adopted_at  timestamptz not null default now(),
  primary key (child_id, day, version)
);

-- Written by admission (§9.5), read by the Conductor. The reserve UPDATE is the cap (see server/conductor/usage.js).
create table if not exists conductor_usage (
  child_id     uuid not null references child(id) on delete cascade,
  learning_day date not null,
  cap_min      int not null,
  used_min     real not null default 0,
  reserved_min real not null default 0,
  hw_used_min  real not null default 0,
  voice_sec    jsonb not null default '{}',
  primary key (child_id, learning_day)
);

-- Routine facts only (anchor, bedtime, school hours); null columns fall back to band defaults in the planner.
create table if not exists child_routine (
  child_id     uuid primary key references child(id) on delete cascade,
  tz           text not null default 'Asia/Kolkata',
  wake_time    text check (wake_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  school_start text check (school_start ~ '^[0-2][0-9]:[0-5][0-9]$'),
  school_end   text check (school_end ~ '^[0-2][0-9]:[0-5][0-9]$'),
  recovery_min int check (recovery_min between 0 and 240),
  bedtime      text check (bedtime ~ '^[0-2][0-9]:[0-5][0-9]$'),
  anchor       text check (anchor ~ '^[0-2][0-9]:[0-5][0-9]$'),
  updated_at   timestamptz not null default now()
);

-- One shared national-holiday calendar (§4.9). Per-child overrides arrive as school.day_override events.
create table if not exists calendar (
  day    date not null,
  region text not null default 'IN',
  kind   text not null check (kind in ('holiday','school_day','off')),
  label  text not null,
  primary key (day, region)
);

-- Minimal workspace (§10.1 item 2): complete_job fences on state = 'erasing' (ws SW6). Rows are created lazily
-- (server/conductor/step.js ensureActor) until child creation does it in the same transaction as `child`.
create table if not exists workspace (
  child_id       uuid primary key references child(id) on delete cascade,
  state          text not null default 'active' check (state in ('active','paused','erasing','erased')),
  legal_mode     text not null default 'standard',
  academic_year  text,
  last_active_at timestamptz
);

-- ───────────── jobs (§3.8) ─────────────
create table if not exists job (
  id               bigint generated always as identity primary key,
  kind             text not null,
  child_id         uuid references child(id) on delete cascade,
  idem_key         text not null,
  input            jsonb not null,
  lane             text not null check (lane in ('fast','slow','sandbox')),
  priority         smallint not null default 2,     -- 0 = child waiting
  status           text not null default 'queued' check (status in ('queued','running','retry','done','failed','cancelled','dead')),
  run_after        timestamptz not null default now(),
  not_before_lesson_end boolean not null default false,
  deadline_at      timestamptz,
  cancel_requested boolean not null default false,
  budget_micro_usd bigint not null,
  spent_micro_usd  bigint not null default 0,       -- TOTAL across attempts (orch R3.5)
  attempts         int not null default 0,          -- the fencing token
  max_attempts     int not null default 5,
  lease_sec        int not null default 60,
  lease_until      timestamptz,
  worker           text,
  result_ref       text,
  last_error       text,
  correlation_id   text not null,
  causation_id     text,
  traceparent      text,
  created_at       timestamptz not null default now(),
  finished_at      timestamptz,
  unique (kind, idem_key)
);
create index if not exists job_ready on job (lane, priority, run_after) where status in ('queued','retry');
create index if not exists job_expired on job (lane, lease_until) where status = 'running';
create index if not exists job_child on job (child_id);

-- Finish a job and tell the Conductor in ONE transaction (orch R2.3), fenced by attempt (a zombie changes
-- nothing) and by erasure (ws SW6). Lock order: job -> workspace (read) -> child_seq.
create or replace function complete_job(p_job bigint, p_attempt int, p_ok boolean, p_result text,
                                        p_error text, p_final boolean) returns boolean language plpgsql as $$
declare j job%rowtype; v_status text; --
begin
  select * into j from job where id = p_job and attempts = p_attempt and status = 'running' for update; --
  if not found then return false; end if; --
  if j.child_id is not null and exists (select 1 from workspace w where w.child_id = j.child_id and w.state = 'erasing') then
    update job set status = 'cancelled', finished_at = now(), lease_until = null where id = p_job; --
    return false; --
  end if; --
  v_status := case when j.cancel_requested then 'cancelled' when p_ok then 'done'
                   when p_final or j.attempts >= j.max_attempts then 'dead' else 'retry' end; --
  update job set status = v_status, result_ref = p_result, last_error = p_error, lease_until = null,
         finished_at = case when v_status in ('done','dead','cancelled') then now() end,
         run_after = case when v_status = 'retry'
                          then now() + make_interval(secs => least(power(2, j.attempts), 300) * (0.8 + random() * 0.4))
                          else run_after end
   where id = p_job; --
  if j.child_id is not null and v_status in ('done','dead') then
    perform ingest_event(j.child_id, gen_ulid(), case when v_status = 'done' then 'job.done' else 'job.failed' end, 'agent',
      'job:' || j.id || ':' || v_status, now(), j.correlation_id, 'job:' || j.id,
      case when v_status = 'done'
           then jsonb_strip_nulls(jsonb_build_object('type', 'job.done', 'jobId', j.id::text, 'kind', j.kind, 'idemKey', j.idem_key, 'resultRef', p_result))
           else jsonb_build_object('type', 'job.failed', 'jobId', j.id::text, 'kind', j.kind, 'idemKey', j.idem_key, 'error', left(coalesce(p_error, 'unknown'), 200), 'final', true) end); --
  end if; --
  return true; --
end $$;

-- ───────────── wakeups: the clock is data (§3.9) ─────────────
create table if not exists wakeup (
  child_id   uuid not null references child(id) on delete cascade,
  dedupe     text not null,                         -- semantic: day_start:2026-10-03, replan:<day>, pause_end:<until>
  due_at     timestamptz not null,
  reason     text not null,
  fired_at   timestamptz,
  event_type text,                                  -- courier rows (G3) set a type + payload; null = clock.wakeup
  payload    jsonb,
  created_at timestamptz not null default now(),
  primary key (child_id, dedupe)
);
create index if not exists wakeup_due on wakeup (due_at) where fired_at is null;

-- Fire due wakeups: the mark and the ingest commit together or not at all (orch R2.2), so a fired row always has
-- exactly one clock.wakeup event (I-R2). SKIP LOCKED lets two tickers overlap harmlessly; ingest_event's idem key
-- 'wake:<dedupe>:<due epoch>' makes a re-armed row (same dedupe, new due_at) fire again exactly once.
-- p_only restricts to some children (tests, piggyback drains). A courier payload is merged UNDER our own keys.
create or replace function fire_wakeups(p_limit int, p_only uuid[] default null)
returns table (child_id uuid, dedupe text, seq bigint) language sql as $$
  with d as (select w.child_id, w.dedupe from wakeup w
              where w.fired_at is null and w.due_at <= now() and (p_only is null or w.child_id = any(p_only))
              order by w.due_at for update skip locked limit p_limit),
       f as (update wakeup w set fired_at = now() from d
              where w.child_id = d.child_id and w.dedupe = d.dedupe
              returning w.child_id, w.dedupe, w.reason, w.due_at, w.event_type, w.payload)
  select f.child_id, f.dedupe,
         ingest_event(f.child_id, gen_ulid(), coalesce(f.event_type, 'clock.wakeup'), 'clock',
                      'wake:' || f.dedupe || ':' || floor(extract(epoch from f.due_at))::bigint, now(),
                      'wake:' || f.dedupe, null,
                      coalesce(f.payload, '{}'::jsonb) || jsonb_build_object('type', coalesce(f.event_type, 'clock.wakeup'),
                        'reason', f.reason, 'wakeupId', f.dedupe))
    from f
$$;

-- ───────────── notification outbox (§4.10; the Notifier itself is M1) ─────────────
-- Superseded shape: 004_conductor_notification.sql aligns this table with §4.10.3 (cascade, cls, status enum, …).
create table if not exists notification (
  id          bigint generated always as identity primary key,
  child_id    uuid references child(id) on delete set null,
  guardian_id uuid references guardian(id) on delete cascade,
  dedupe      text not null,
  class       text not null,
  intent      jsonb not null,
  status      text not null default 'pending' check (status in ('pending','held','sent','delivered','failed','cancelled')),
  not_before  timestamptz,
  not_after   timestamptz,
  created_at  timestamptz not null default now(),
  unique (guardian_id, dedupe)
);
-- The insert IS the cap (X61: per recipient guardian; slot 1 = the family letter, slot 2 = one other learning push).
create table if not exists notify_slot (
  guardian_id     uuid not null references guardian(id) on delete cascade,
  scope           text not null,                    -- e.g. 'week:2026-W40'
  slot            smallint not null check (slot in (1,2,3)),
  child_id        uuid references child(id) on delete set null,
  notification_id bigint references notification(id) on delete set null,
  taken_at        timestamptz not null default now(),
  primary key (guardian_id, scope, slot)
);

-- Admission buckets (§8.3): the UPDATE with headroom IS the admission.
create table if not exists rate_bucket (
  deployment     text primary key,
  capacity       int not null,
  tokens         real not null,
  refill_per_sec real not null,
  refilled_at    timestamptz not null default now()
);
insert into rate_bucket (deployment, capacity, tokens, refill_per_sec)
values ('taxila-realtime', 10, 10, 10.0 / 60) on conflict (deployment) do nothing;
