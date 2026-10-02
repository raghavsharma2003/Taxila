-- Taxila core schema. Identity is an authenticated guardian + child id — never a device id
-- (inherited rejection: surface-switch-recall / device-uuid-is-not-identity).
-- Audio is never stored. Every child row cascades on erasure.

create extension if not exists pgcrypto;

create table if not exists guardian (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  pw_hash       text not null,             -- scrypt$N$r$p$salt$hash
  name          text not null,
  phone         text,
  locale        text not null default 'en-IN',
  created_at    timestamptz not null default now()
);

create table if not exists auth_session (
  token_hash    text primary key,           -- sha256 of the opaque cookie token
  guardian_id   uuid not null references guardian(id) on delete cascade,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  user_agent    text
);
create index if not exists auth_session_guardian on auth_session(guardian_id);

-- Versioned, per-purpose, revocable consent (DPDP s.9 / Rule 10). A purpose is usable only while the
-- latest row for (guardian, child, purpose) has granted = true.
create table if not exists consent (
  id            bigserial primary key,
  guardian_id   uuid not null references guardian(id) on delete cascade,
  child_id      uuid,
  purpose       text not null,             -- 'core_tutoring' | 'learning_profile' | 'memory' | 'transcripts_retention' | 'audio_research'
  version       text not null,             -- consent text version shown
  granted       boolean not null,
  method        text not null,             -- 'checkbox_v1' | 'digilocker' | ...
  created_at    timestamptz not null default now()
);
create index if not exists consent_lookup on consent(guardian_id, child_id, purpose, created_at desc);

create table if not exists child (
  id            uuid primary key default gen_random_uuid(),
  guardian_id   uuid not null references guardian(id) on delete cascade,
  first_name    text not null,
  class_level   int  not null check (class_level between 1 and 9),
  board         text not null default 'cbse',
  school_medium text not null default 'english',   -- english | hindi | other
  language_pref text not null default 'hinglish',  -- hinglish | hindi | english
  birth_year    int,
  avatar        text,
  teacher_id    text not null default 'asha',      -- character sheet id
  interests     text[] not null default '{}',      -- parent-visible, editable; sensitive categories never stored
  created_at    timestamptz not null default now()
);
create index if not exists child_guardian on child(guardian_id);

create table if not exists lesson (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references child(id) on delete cascade,
  topic_id      text not null,
  kind          text not null default 'live',      -- live | practice | diagnostic
  state         jsonb not null default '{}',       -- director state machine snapshot
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  summary       text,
  parent_note   text
);
create index if not exists lesson_child on lesson(child_id, started_at desc);

create table if not exists turn (
  id            bigserial primary key,
  lesson_id     uuid not null references lesson(id) on delete cascade,
  seq           int not null,
  speaker       text not null check (speaker in ('child','teacher','system')),
  text          text not null,
  asr_conf      real,
  meta          jsonb not null default '{}',
  at            timestamptz not null default now()
);
create index if not exists turn_lesson on turn(lesson_id, seq);

-- Every piece of evidence about understanding, with its source probe and likelihood weight.
create table if not exists evidence (
  id            bigserial primary key,
  child_id      uuid not null references child(id) on delete cascade,
  lesson_id     uuid references lesson(id) on delete cascade,
  skill_id      text not null,
  item_id       text,
  probe         text not null,                     -- P1..P24 from the probe catalogue
  outcome       text not null,                     -- correct | incorrect | partial | misconception | no_evidence
  misconception_id text,
  hints_used    int not null default 0,
  weight        real not null default 1,
  turn_id       bigint references turn(id) on delete set null,
  at            timestamptz not null default now()
);
create index if not exists evidence_child_skill on evidence(child_id, skill_id, at desc);

create table if not exists skill_state (
  child_id      uuid not null references child(id) on delete cascade,
  skill_id      text not null,
  p_known       real not null,
  status        text not null default 'introduced',  -- unseen|introduced|practising|learned_today|mastered|due
  attempts      int not null default 0,
  correct_unaided int not null default 0,
  generative_pass boolean not null default false,
  delayed_pass  boolean not null default false,
  last_seen     timestamptz not null default now(),
  next_review   timestamptz,
  primary key (child_id, skill_id)
);

create table if not exists misconception_state (
  child_id      uuid not null references child(id) on delete cascade,
  misconception_id text not null,
  evidence_count int not null default 0,
  resolved      boolean not null default false,
  last_seen     timestamptz not null default now(),
  primary key (child_id, misconception_id)
);

-- Format trials for the learning profile (narrow mode by default until the DPDP 9(3) opinion).
create table if not exists format_trial (
  id            bigserial primary key,
  child_id      uuid not null references child(id) on delete cascade,
  skill_id      text not null,
  topic_type    text not null,
  format        text not null,                     -- F1..F8
  allocated_by  text not null,                     -- prior | thompson | explore | choice
  immediate     real,
  delayed       real,                              -- filled when delayed retrieval happens
  at            timestamptz not null default now()
);

-- Cited memory: every fact names the turn it came from (inherited: citation enforcement).
create table if not exists memory (
  id            bigserial primary key,
  child_id      uuid not null references child(id) on delete cascade,
  kind          text not null,                     -- interest | win | struggle | preference | life_event | joke
  text          text not null,
  source_turn   bigint references turn(id) on delete set null,
  confidence    real not null default 0.7,
  superseded_by bigint references memory(id),
  created_at    timestamptz not null default now()
);
create index if not exists memory_child on memory(child_id, created_at desc);

create table if not exists rel_state (
  child_id      uuid primary key references child(id) on delete cascade,
  trust         real not null default 0.3,
  stage         text not null default 'first_meeting',
  sessions      int not null default 0,
  last_trust_update date,
  open_rupture  jsonb,
  updated_at    timestamptz not null default now()
);

create table if not exists rel_event (
  id            bigserial primary key,
  child_id      uuid not null references child(id) on delete cascade,
  kind          text not null,                     -- rupture | repair | milestone
  note          text not null,
  lesson_id     uuid references lesson(id) on delete set null,
  at            timestamptz not null default now()
);

create table if not exists module_run (
  id            bigserial primary key,
  lesson_id     uuid not null references lesson(id) on delete cascade,
  engine        text not null,
  params        jsonb not null,
  events        jsonb not null default '[]',
  outcome       text,
  at            timestamptz not null default now()
);

create table if not exists asset_cache (
  key           text primary key,                  -- includes model + style version (inherited: identity in cache keys)
  kind          text not null,                     -- image | scene | diagram
  url           text,
  body          jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists incident (
  id            bigserial primary key,
  child_id      uuid references child(id) on delete cascade,
  lesson_id     uuid references lesson(id) on delete set null,
  kind          text not null,                     -- safeguarding | floor_violation | content | abuse
  severity      text not null,
  detail        jsonb not null,
  handled       boolean not null default false,
  at            timestamptz not null default now()
);

create table if not exists audit (
  id            bigserial primary key,
  guardian_id   uuid,
  action        text not null,
  detail        jsonb not null default '{}',
  at            timestamptz not null default now()
);

create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now());
