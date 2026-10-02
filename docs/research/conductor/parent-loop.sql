-- Taxila parent loop (docs/research/conductor/parent-loop.md §11). Proposed db/migrations/0xx_parent_loop.sql
-- Depends on: guardian, child (ARCHITECTURE §1.7), student_event (orchestration §3.2). Audio is never stored.

create table guardian_profile (
  guardian_id uuid primary key references guardian(id) on delete cascade,
  language text not null, script text not null, prefers_voice boolean not null default false,
  address text, cadence text not null default 'weekly' check (cadence in ('weekly','daily_pull','daily_push','fortnightly')),
  report_weekday smallint not null default 0, report_time time not null default '10:00',
  involvement jsonb not null default '{}', alert_prefs jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create table parent_conversation (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  guardian_id uuid not null references guardian(id) on delete cascade,
  mode text not null check (mode in ('intake','ptm_voice','ptm_text','ask')),
  state text not null, started_at timestamptz not null default now(), ended_at timestamptz,
  end_reason text, spent_micro_usd bigint not null default 0, summary jsonb
);
create table parent_turn (                                 -- text only; audio never stored
  conv_id uuid not null references parent_conversation(id) on delete cascade, idx int not null,
  speaker text not null check (speaker in ('parent','teacher')), text text not null,
  fact_ids text[] not null default '{}', claim_check jsonb, lint jsonb, created_at timestamptz not null default now(),
  primary key (conv_id, idx)
);
create table parent_worry (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  guardian_id uuid not null references guardian(id), kind text not null, topic_ids text[] not null default '{}',
  status text not null default 'open', commitment_id uuid, created_at timestamptz not null default now()
);
create table parent_commitment (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  guardian_id uuid not null references guardian(id), kind text not null, refs text[] not null,
  due_at timestamptz not null, status text not null default 'open' check (status in ('open','fulfilled','missed','cancelled')),
  result_fact_ids text[], closed_at timestamptz, created_in uuid references parent_conversation(id)
);
create index parent_commitment_due on parent_commitment (status, due_at) where status = 'open';
-- cap (≤ 4 open per child, ≤ 2 new per conversation) is enforced in the API inside the insert transaction:
-- insert ... select ... where (select count(*) from parent_commitment where child_id=$1 and status='open') < 4
-- and asserted in tests (PLI10 sweeper covers closure).
create table care_note (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  author_guardian uuid not null references guardian(id), text text not null check (length(text) <= 160),
  effect text not null check (effect in ('gentle_mode','avoid_topic','none')), avoid_topic text,
  expires_at timestamptz not null,
  renewed boolean not null default false, created_at timestamptz not null default now(),
  constraint care_note_ttl check (expires_at <= created_at + interval '30 days')   -- renewal re-inserts a row (renewed=true), max once
);
create table home_activity_assignment (
  child_id uuid not null references child(id) on delete cascade, iso_week text not null,
  activity_id text not null, activity_version int not null, skill_ids text[] not null,
  feedback text check (feedback in ('done','skipped','too_hard','child_loved','child_refused','no_time')),
  feedback_at timestamptz, primary key (child_id, iso_week)                           -- one per week (PP5)
);
create table weekly_letter (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade, iso_week text not null,
  story jsonb not null, text_render text not null, voice_script text, voice_asset text, voice_expires_at timestamptz,
  lint jsonb not null, ledger_hash text not null, sent_at timestamptz, unique (child_id, iso_week)
);
create table parent_alert (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  cls text not null check (cls in ('S','W','L','R','C','A')), dedupe text not null,
  refs text[] not null default '{}', fact_ids text[] not null default '{}',
  gate_out text, gate_reason text, notification_id uuid, acknowledged_at timestamptz,
  created_at timestamptz not null default now(), unique (child_id, dedupe)
);
