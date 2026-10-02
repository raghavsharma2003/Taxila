-- Learner model v2 (docs/research/learner/LEARNER-MODEL.md §4, §6.1-§6.3.1, §8; decisions
-- learner-legal-mode-ratchet, learner-bktr-ledger). The spec names this 003_learner.sql; 003 was taken.
-- M1 tables only. Every table cascades on the child's erasure; every persisted row carries the mode it was
-- written under. server/learner/writer.js is the ONLY module that writes these tables, and it calls
-- assertWritable(child, layer) first. No latency, pause, prosody, affect, mood, engagement, trust, vibe or
-- free-text-about-the-child column exists here (NM-3; tests/learner-mode.test.mjs scans this file).
-- Re-runnable (if not exists). Probabilities and θ are double precision so a restored row is
-- byte-identical to the replayed fold (the spec's `real` would not be).

alter table child add column if not exists legal_mode text not null default 'M1';
alter table child drop constraint if exists child_legal_mode_check;
alter table child add constraint child_legal_mode_check check (legal_mode in ('M0','M1','M2','M3'));

-- Knowledge: event-sourced. seq is the order key, assigned in the write transaction under
-- pg_advisory_xact_lock(hashtext(child_id)). ASR-dropped and safety turns are never written.
create table if not exists kt_evidence (
  seq               bigint generated always as identity primary key,
  id                text unique not null,
  child_id          uuid not null references child(id) on delete cascade,
  session_id        text not null,
  session_start_at  timestamptz not null,
  episode_id        text not null,
  occurred_at       timestamptz not null,
  skill_ids         text[] not null check (cardinality(skill_ids) between 1 and 3),
  cls               text not null,
  outcome           smallint not null,
  grader            text not null check (grader in ('code','llm','human')),
  grader_version    text not null,
  item_key          text not null,
  teach             boolean not null default false,
  assisted          text check (assisted in ('parent','sibling')),
  controller_easy   boolean not null default false,
  gaming_window     boolean not null default false,
  pre_attempt_help  boolean not null default false,
  form              text check (form in ('produce','recognise')),
  target            text,
  topic_type        text,
  misconception_id  text,
  discriminates     text,
  mis_route         text check (mis_route in ('mis','skill')),
  entry_rung        smallint not null default 0,
  contaminated      boolean not null default false,
  kit_verified      boolean,
  params_version    text not null,
  purpose           text not null default 'P2',
  legal_mode_at_write text not null
);
create index if not exists kt_evidence_child_seq on kt_evidence (child_id, seq);

-- The cached fold per (child, skill); kt_evidence is the truth (replay = online fold).
create table if not exists kt_skill_state (
  child_id        uuid not null references child(id) on delete cascade,
  skill_id        text not null,
  params_version  text not null,
  p_l             double precision not null check (p_l between 0 and 1),
  retention       double precision not null,
  mem             jsonb,
  n               int not null,
  flags           jsonb not null,
  recent          smallint[] not null default '{}',
  opp             int not null default 0,
  run             int not null default 0,
  display         text not null check (display in ('unseen','introduced','practising','learned_today','mastered','durable')),
  refresh         boolean not null,
  next_review_at  timestamptz,
  prior_pl0       double precision,
  prior_epoch_id  text,
  prior_seq       bigint,
  extra           jsonb not null default '{}',
  purpose         text not null default 'P2',
  legal_mode_at_write text not null,
  updated_at      timestamptz not null,
  primary key (child_id, skill_id)
);
create index if not exists kt_skill_state_due on kt_skill_state (child_id, next_review_at);

create table if not exists kt_misconception (
  child_id            uuid not null references child(id) on delete cascade,
  misconception_id    text not null,
  logit               double precision not null,
  hits                int not null default 0,
  last_at             timestamptz,
  resolved_at         timestamptz,
  check_scheduled_at  timestamptz,
  purpose             text not null default 'P2',
  legal_mode_at_write text not null,
  primary key (child_id, misconception_id)
);

-- Ability: the marginal view (brief, parent level bridge) and the joint epoch base per subject (§6.3.1d).
create table if not exists kt_ability (
  child_id        uuid not null references child(id) on delete cascade,
  strand          text not null,
  mu              double precision not null,
  sd              double precision not null,
  n_obs           int not null default 0,
  engine_version  text not null,
  purpose         text not null default 'P2',
  legal_mode_at_write text not null,
  updated_at      timestamptz not null,
  primary key (child_id, strand)
);
create table if not exists kt_ability_epoch (
  child_id        uuid not null references child(id) on delete cascade,
  subject         text not null,
  epoch_id        text not null,
  session_id      text,
  opened_at       timestamptz not null,
  strands         text[] not null,
  m               double precision[] not null,
  s               double precision[] not null,
  sd0             double precision[] not null,
  engine_version  text not null,
  purpose         text not null default 'P2',
  legal_mode_at_write text not null,
  primary key (child_id, subject)
);

-- Frozen globals: written only by the nightly job under a new params_version (no child id).
create table if not exists kt_params (
  version     text not null,
  scope       text not null check (scope in ('cluster','skill','labeller','fsrs','item')),
  key         text not null,
  params      jsonb not null,
  n_children  int,
  n_obs       int,
  fitted_at   timestamptz not null,
  primary key (version, scope, key)
);

-- Learning speed: M2+ only (the writer gate refuses layer 'eta' in M1).
create table if not exists kt_child (
  child_id    uuid primary key references child(id) on delete cascade,
  eta         double precision not null default 0,
  eta_n       int not null default 0,
  legal_mode_at_write text not null
);

-- Every mode change (ratchet down only).
create table if not exists learner_mode_audit (
  id          bigint generated always as identity primary key,
  child_id    uuid not null,
  from_mode   text not null,
  to_mode     text not null,
  reason      text not null,
  actor       text not null,
  at          timestamptz not null
);
create index if not exists learner_mode_audit_child on learner_mode_audit (child_id, at desc);
