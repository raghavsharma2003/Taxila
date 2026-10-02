-- Comprehension engine (docs/research/comprehension/COMPREHENSION-ENGINE.md §5.2, §3.5, §4.2, §9 item 13).
-- Every child-linked table cascades on the child's erasure and records the legal mode it was written under.
-- arm_posteriors is population-level and carries NO child id. No latency, pause, prosody, affect, mood,
-- engagement, trust, vibe or free-text-about-the-child column exists here (NM-3): the facets are academic record
-- derived from answers only. Numbered 007 alongside 007_pin_pending.sql (independent tables; order-insensitive).
-- Re-runnable (if not exists).

-- Cached facet fold per (child, skill); kt_evidence (plus its CE contract fields below) is the truth: replay = online.
create table if not exists comp_facet_state (
  child_id        uuid not null references child(id) on delete cascade,
  skill_id        text not null,
  params_version  text not null,
  u_p             double precision not null check (u_p between 0 and 1),
  t_p             double precision not null check (t_p between 0 and 1),
  facets          jsonb not null,
  state           text not null check (state in ('not_yet','shallow','fragile','understood','durable')),
  reasons         jsonb not null default '[]',
  updated_at      timestamptz not null default now(),
  legal_mode_at_write text not null,
  primary key (child_id, skill_id)
);

-- CE contract additions on the evidence log (additive; null for events written before this migration).
alter table kt_evidence add column if not exists via text check (via in ('dialogue','game','module','callback','weave'));
alter table kt_evidence add column if not exists ebo text;
alter table kt_evidence add column if not exists shape_id text;
alter table kt_evidence add column if not exists weave_host text;
alter table kt_evidence add column if not exists coincident boolean not null default false;
alter table kt_evidence add column if not exists unfamiliar_context boolean not null default false;
alter table kt_evidence add column if not exists deference_discount boolean not null default false;
alter table kt_evidence add column if not exists span_ok boolean;

-- Every re-teach, with its outcome resolved asynchronously (§5.2, §5.4).
create table if not exists reteach_attempts (
  id                bigint generated always as identity primary key,
  child_id          uuid not null references child(id) on delete cascade,
  session_id        text not null,
  skill_id          text not null,
  misconception_id  text,
  arm_id            text not null,
  rep_class         text not null,
  representation_id text,
  surface_id        text,
  trigger           text not null check (trigger in ('misconception_confirmed','wheel_spin','two_fails_post_rung3','u_low_after_practice','transfer_fail','delayed_fail')),
  chosen_by         text not null check (chosen_by in ('kit_primary','thompson','explore','recap','pick')),
  outcome           text check (outcome in ('failed','repaired_now','resolved_now','resolved_next','resolved_delayed','induced_bug','contaminated')),
  reward            double precision,
  at                timestamptz not null default now(),
  resolved_at       timestamptz,
  legal_mode_at_write text not null
);
create index if not exists reteach_attempts_child_skill on reteach_attempts (child_id, skill_id, at);

-- Representation fluency (RT4): P(reads this representation) per child.
create table if not exists rep_fluency (
  child_id          uuid not null references child(id) on delete cascade,
  representation_id text not null,
  p_read            double precision not null check (p_read between 0 and 1),
  n                 int not null default 0,
  updated_at        timestamptz not null default now(),
  legal_mode_at_write text not null,
  primary key (child_id, representation_id)
);

-- Population bandit posteriors per (arm, cluster). NO child id, by construction.
create table if not exists arm_posteriors (
  arm_id      text not null,
  cluster     text not null,
  a           double precision not null default 1,
  b           double precision not null default 1,
  n           int not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (arm_id, cluster)
);

-- Cross-topic delayed checks (§3.5).
create table if not exists weave_queue (
  id              bigint generated always as identity primary key,
  child_id        uuid not null references child(id) on delete cascade,
  skill_id        text not null,
  kind            text not null check (kind in ('woven','callback','protege_return','game_callback')),
  anchor_at       timestamptz not null,
  earliest_at     timestamptz not null,
  due_at          timestamptz not null,
  topics_since    int not null default 0,
  host_candidates text[] not null default '{}',
  host            text,
  status          text not null default 'queued' check (status in ('queued','hosted','done','expired')),
  legal_mode_at_write text not null
);
create unique index if not exists weave_queue_open on weave_queue (child_id, skill_id, kind) where status in ('queued','hosted');

-- Probe log: which shape, which skill, which session (novelty rules, M-PT sampling). Test weight, not timing.
create table if not exists probe_log (
  id           bigint generated always as identity primary key,
  child_id     uuid not null references child(id) on delete cascade,
  session_id   text not null,
  skill_id     text not null,
  shape_id     text not null,
  facet        text not null check (facet in ('K','U','T','D','M')),
  mandatory    boolean not null,
  reason       text not null,
  test_weight  double precision not null,
  evidence_id  text,
  at           timestamptz not null default now(),
  legal_mode_at_write text not null
);
create index if not exists probe_log_child_skill on probe_log (child_id, skill_id, at);

-- Every closed-label verdict (§4.2 calibration gate; the nightly job refits grader confusion from it). The span is
-- the child's own words (≤ 200 chars), kept only while the transcript exists: it cascades with the child.
create table if not exists grade_audit (
  id              bigint generated always as identity primary key,
  child_id        uuid not null references child(id) on delete cascade,
  session_id      text not null,
  skill_id        text not null,
  shape_id        text,
  op              text not null check (op in ('R-EXP','R-MIS','R-INST')),
  grader_version  text not null,
  model           text,
  target_id       text not null,
  label           text not null,
  span            text check (span is null or length(span) <= 200),
  span_ok         boolean not null,
  lang            text,
  ms              int,
  human_label     text,
  at              timestamptz not null default now(),
  legal_mode_at_write text not null
);
create index if not exists grade_audit_op on grade_audit (op, grader_version, at);
