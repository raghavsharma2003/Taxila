-- Taxila Conductor day-cycle tables (proposed db/migrations/0xx_conductor.sql; extends 001_core.sql).
-- Rationale: docs/research/conductor/day-cycle.md §11 (2026-10-02). Draft, not applied.

create table if not exists child_routine (
  child_id        uuid primary key references child(id) on delete cascade,
  tz              text not null default 'Asia/Kolkata',
  school_start    time, school_end time,
  bedtime         time not null default '21:00',
  anchor_cue      text,                         -- parent words, e.g. 'after snack'; never shown on lock screen
  anchor_from     time, anchor_to time, backup_from time, backup_to time,
  daily_cap_min   int  not null check (daily_cap_min between 10 and 120),
  lesson_min      int  not null check (lesson_min between 10 and 60),
  allowed_from    time not null default '07:00', allowed_to time not null default '20:30',
  weekend_mode    text not null default 'light' check (weekend_mode in ('normal','light','off')),
  morning_preview boolean not null default false,
  child_plan      text,                         -- B3-B4 if-then from reflection; parent-visible
  updated_at      timestamptz not null default now()
);

create table if not exists calendar_event (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references child(id) on delete cascade,
  kind        text not null check (kind in ('unit_test','periodic_test','half_yearly','annual','holiday',
                                              'festival','vacation','family_day','school_event')),
  start_date  date not null, end_date date not null check (end_date >= start_date),
  chapters    text[] not null default '{}',
  source      text not null check (source in ('parent','child','diary_ocr','school_calendar','national_calendar')),
  confirmed   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists calendar_event_child on calendar_event(child_id, start_date);

create table if not exists day_plan (
  child_id    uuid not null references child(id) on delete cascade,
  day         date not null,
  version     int  not null default 1,
  mode        text not null,
  plan        jsonb not null,                   -- DayPlan
  built_by    text not null check (built_by in ('night_job','first_open','replan')),
  built_at    timestamptz not null default now(),
  primary key (child_id, day, version)
);

create table if not exists day_event (
  id          bigserial primary key,
  child_id    uuid references child(id) on delete cascade,
  guardian_id uuid references guardian(id) on delete cascade,
  at          timestamptz not null default now(),
  type        text not null,
  data        jsonb not null default '{}'
);
create index if not exists day_event_child on day_event(child_id, at desc);

create table if not exists homework_request (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references child(id) on delete cascade,
  lesson_id   uuid references lesson(id) on delete set null,
  state       text not null,                    -- HomeworkState
  items       jsonb not null default '[]',      -- extracted item text + matched kit/template + skill ids
  chapter_guess text,
  image_kept  boolean not null default false,   -- default false: image deleted after extraction (H6)
  minutes_used int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists notification_log (
  id          uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references guardian(id) on delete cascade,
  child_id    uuid references child(id) on delete cascade,
  cls         text not null check (cls in ('anchor_reminder','weekly_report','milestone','daily_note',
                                           'test_window','safety','account','payment')),
  channel     text not null check (channel in ('push','whatsapp','in_app')),
  decision    text not null,                    -- 'sent' | why it was blocked (mayNotify)
  sent_at     timestamptz not null default now(),
  opened_at   timestamptz, dismissed_at timestamptz
);
create index if not exists notification_log_week on notification_log(guardian_id, cls, sent_at desc);

create table if not exists night_job (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references child(id) on delete cascade,
  for_day     date not null,
  step        text not null,                    -- build_day_plan | engines | scene_dsl | images | t3_request | brief
  status      text not null check (status in ('queued','running','ok','failed','shed')),
  cost_inr    numeric(10,2),
  output_keys text[] not null default '{}',     -- asset_cache keys
  started_at  timestamptz, finished_at timestamptz
);
create index if not exists night_job_day on night_job(for_day, status);
