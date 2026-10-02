-- household.sql (gap-fill G3-household-siblings) — lift into db/migrations/005_household.sql.
-- Depends on: 001_core (guardian, child), 002_conductor (child_seq, student_event, ingest_event, conductor_state,
-- decision_log, wakeup, fire_wakeups, notification, notify_slot), 004_workspace (device, workspace).
-- Design: household.md. Probed on scratch PG 16.14 by household-pg16-probe.sh (household-pg16-probe-2026-10-02.txt).
--
-- LOCK POSITION (X29 writer table, CONDUCTOR.md §3.4):
--   household allocator : household (lease UPDATE = FOR NO KEY UPDATE; NEVER `SELECT … FOR UPDATE`, which would
--                         block every child commit's household_inbox FK check) → household_slot (this household's
--                         rows, active members only) → household_inbox (delete consumed ids) → new rows only:
--                         household_decision, household_decision_member, wakeup (courier). NEVER child_seq,
--                         conductor_state, notify_slot or another household.
--   Conductor commit    : … → notification / notify_slot (guardian-scoped keys; slot 1 before slot 2) →
--                         household_inbox (new rows; FK KEY SHARE on household, compatible with NO KEY UPDATE) →
--                         child_seq LAST (unchanged).
--   session.reassign    : workspace(lower id) → workspace(higher id) FOR UPDATE → moved ledger rows →
--                         conductor_usage (lower, higher) → budget (lower, higher) → session_reassign (new) →
--                         wakeup courier rows for both children. NEVER child_seq.
--   erasure             : (1) → erasing; (2) child lease; (2b) household fence: one short transaction
--                         `update household set version = version` + `update household_member set state='leaving'`;
--                         (3) cascade delete. (2b) waits out an in-flight allocator; later passes skip `leaving`.
--   fire_wakeups        : unchanged order (wakeup SKIP LOCKED → each child's child_seq). It stays the ONLY writer
--                         that locks more than one child_seq, so no two multi-child_seq writers can form a cycle.

create extension if not exists btree_gist;          -- for the household_slot exclusion constraint [V Neon extension list: M]

-- ---------- the household (one per owner guardian in v1) ----------
create table household (
  id uuid primary key default gen_random_uuid(),
  owner_guardian_id uuid not null unique references guardian(id) on delete cascade,
  tz text not null,                                  -- every member's routine uses this tz (I-H12)
  anchor_school time not null default '16:30',       -- parent-authored household anchor (DC1), school days
  anchor_off time not null default '11:00',          -- off days
  phones smallint not null default 1 check (phones between 1 and 3),   -- planning lanes, parent-declared
  order_mode text not null default 'younger_first' check (order_mode in ('younger_first','parent_fixed')),
  version bigint not null default 0,                 -- allocator CAS
  lease_token uuid, lease_until timestamptz,         -- allocator mutex (like conductor_state)
  updated_at timestamptz not null default now());

create table household_member (                      -- column owners: row = parent API/workspace; est_min = allocator;
                                                     -- state = erasure fence; fixed_pos = parent API
  child_id uuid primary key references child(id) on delete cascade,
  household_id uuid not null references household(id) on delete cascade,
  ref smallint not null,                             -- ordinal, never reused; the only member id in household audit
  state text not null default 'active' check (state in ('active','leaving')),
  fixed_pos smallint,                                -- order_mode = 'parent_fixed'
  est_min smallint,                                  -- last reported sitting length (the estimate for a child who
                                                     -- has not opened today); null → band template session
  unique (household_id, ref));
create index household_member_hh on household_member (household_id);

create table household_device (                      -- a paired device's lane; a lane is a phone
  device_id text primary key references device(id) on delete cascade,
  household_id uuid not null references household(id) on delete cascade,
  lane smallint not null check (lane between 0 and 2));

-- ---------- the read model: who has which phone, when (written ONLY by the allocator) ----------
create table household_slot (
  household_id uuid not null references household(id) on delete cascade,
  day date not null,                                 -- learningDay in household.tz
  child_id uuid not null references child(id) on delete cascade,
  seq smallint not null,                             -- 0 = the current planned window; 1.. = sitting facts in order
  lane smallint not null default 0,
  hh_version bigint not null,                        -- the allocation that wrote it
  starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at),
  state text not null check (state in ('planned','frozen','done')),
  primary key (household_id, day, child_id, seq),
  constraint household_slot_no_overlap exclude using gist
    (household_id with =, day with =, lane with =, tstzrange(starts_at, ends_at, '[)') with &&)
    deferrable initially deferred);                  -- I-H1: the constraint IS the overlap check (re-timing several
                                                     -- rows in one pass may cross transiently; checked at COMMIT)
create index household_slot_child on household_slot (child_id);

-- ---------- the only way a child's Conductor talks to its household: new rows ----------
create table household_inbox (
  id bigint generated always as identity primary key,
  household_id uuid not null references household(id) on delete cascade,
  child_id uuid references child(id) on delete cascade,              -- null for parent/system reports
  day date not null,
  kind text not null check (kind in ('plan_reported','sitting_started','sitting_ended','sitting_voided',
                                     'routine_changed','member_joined')),
  body jsonb not null,                               -- HouseholdReport (household.md §2.2); no free text
  child_version bigint,                              -- conductor_state.version that emitted it (audit)
  created_at timestamptz not null default now());
create index household_inbox_hh on household_inbox (household_id, id);
create index household_inbox_child on household_inbox (child_id);
-- dirty set (debounce 60 s, X30 pattern; a plain read, no FOR UPDATE):
-- select household_id from household_inbox group by household_id having min(created_at) < now() - interval '60 seconds'
--  order by min(created_at) limit 50;

-- ---------- allocator audit and replay record ----------
create table household_decision (
  household_id uuid not null references household(id) on delete cascade, version bigint not null,
  at timestamptz not null default now(), now_used timestamptz not null, build_sha text not null,
  day date not null, inbox_to bigint not null,       -- consumed household_inbox ids <= this
  facts jsonb not null,                              -- HouseholdFacts at the pass (anchor, phones, order_mode, tz)
  output jsonb not null,                             -- [{ref, seq, lane, from, to, state, changed}]: refs only
  primary key (household_id, version));
create table household_decision_member (             -- per-member inputs; cascades with the child (I-H6)
  household_id uuid not null, version bigint not null,
  child_id uuid not null references child(id) on delete cascade,
  ref smallint not null, input jsonb not null,       -- MemberInput minus childId
  primary key (household_id, version, ref),
  foreign key (household_id, version) references household_decision on delete cascade);
create index household_decision_member_child on household_decision_member (child_id);
-- retention: the replay window (90 d [U]), like decision_log

-- ---------- courier: the wakeup row is the only cross-child path into a child's log ----------
alter table wakeup
  add column event_type text not null default 'clock.wakeup'
    check (event_type in ('clock.wakeup','household.window_assigned','session.reassigned')),
  add column payload jsonb;                          -- merged UNDER the event body's own keys; the replay record

create or replace function fire_wakeups(p_limit int) returns table (child_id uuid, seq bigint) language sql as $$
  with d as (select w.child_id, w.dedupe from wakeup w where w.fired_at is null and w.due_at <= now()
              order by w.due_at for update skip locked limit p_limit),
       f as (update wakeup w set fired_at = now() from d
              where w.child_id = d.child_id and w.dedupe = d.dedupe
              returning w.child_id, w.dedupe, w.reason, w.event_type, w.payload)
  select f.child_id, ingest_event(f.child_id, gen_ulid(), f.event_type,
           case when f.event_type = 'clock.wakeup' then 'clock' else 'system' end,
           'wake:' || f.dedupe, now(), 'wake:' || f.dedupe, null,
           coalesce(f.payload, '{}'::jsonb) || jsonb_build_object('reason', f.reason, 'wakeupId', f.dedupe))
           -- the courier's keys win: a payload can never forge `reason` or `wakeupId`
    from f;
$$;
-- courier insert (allocator; one row per changed member, dedupe versioned so a later pass never collides):
-- insert into wakeup (child_id, dedupe, due_at, reason, event_type, payload)
-- values ($child, 'hh:' || $day || ':v' || $hhVersion, now(), 'household', 'household.window_assigned', $payload)
-- on conflict (child_id, dedupe) do nothing;

-- ---------- decision_log: what household version each step folded (replay check, I-H4) ----------
alter table decision_log add column household_v bigint;   -- state.household.hhVersion after the batch; null = none

-- ---------- notifications: the cap belongs to the recipient guardian, not to (guardian, child) ----------
alter table notification add column household_id uuid references household(id) on delete cascade;
-- the family letter: child_id NULL, household_id set, dedupe 'letter:{isoWeek}' (unique (guardian_id, dedupe))

drop table if exists notify_slot;
create table notify_slot (                           -- capped classes: the INSERT is the cap (dc AR-5 R5)
  guardian_id uuid not null references guardian(id) on delete cascade,              -- the RECIPIENT
  scope text not null,                               -- 'learn:2026-W40' | 'wb:2026-W40' (ISO week in the guardian's tz)
  slot smallint not null,
  cls text not null,
  child_id uuid references child(id) on delete set null,                            -- attribution only; null = family
  notification_id bigint references notification(id) on delete set null,            -- tombstone: the cap counts sends
  taken_at timestamptz not null default now(),
  primary key (guardian_id, scope, slot),
  check ((scope like 'learn:%' and slot between 1 and 2) or (scope like 'wb:%' and slot = 1)),
  check (slot <> 1 or scope not like 'learn:%' or cls = 'weekly_letter'),         -- slot 1 = the family letter only
  check (slot <> 2 or cls in ('milestone','test_window')));
create index notify_slot_child on notify_slot (child_id);

-- take a learning slot: slot 1 is the family letter's; every other learning class competes for slot 2.
-- A caller that needs both takes 1 before 2 (the probe's opposite-order control deadlocks).
create or replace function notify_take(p_guardian uuid, p_scope text, p_cls text, p_child uuid, p_notification bigint)
returns smallint language sql as $$
  insert into notify_slot (guardian_id, scope, slot, cls, child_id, notification_id)
  values (p_guardian, p_scope,
          1 + (p_scope like 'learn:%' and p_cls <> 'weekly_letter')::int,
          p_cls, p_child, p_notification)
  on conflict do nothing
  returning slot;
$$;
-- null → notification.status = 'blocked', block_reason = 'cap'; the fact rides in the family letter instead.

-- ---------- shared device ----------
create table device_admission (                      -- ONE pending realtime admission per device (orch R7.8)
  device_id text primary key references device(id) on delete cascade,
  child_id uuid not null references child(id) on delete cascade,
  lesson_id uuid not null, priority smallint not null, since timestamptz not null default now());
create index device_admission_child on device_admission (child_id);
-- tap on a tile: insert … on conflict (device_id) do update set child_id = excluded.child_id,
--   lesson_id = excluded.lesson_id, priority = excluded.priority, since = now()
--   where device_admission.child_id <> excluded.child_id   -- a profile switch replaces the old child's wait
-- returning (xmax = 0) as fresh;  a same-child double tap returns no row and reuses the existing wait.

create table session_reassign (                      -- the record behind session.reassigned (both directions)
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references guardian(id) on delete cascade,
  from_child uuid references child(id) on delete set null,
  to_child uuid references child(id) on delete set null,
  scope jsonb not null,                              -- {lessonId?} | {packId?}
  minutes real not null, voice_sec jsonb not null, micro_usd_moved bigint not null, micro_usd_kept bigint not null,
  at timestamptz not null default now());
create index session_reassign_from on session_reassign (from_child);
create index session_reassign_to on session_reassign (to_child);
