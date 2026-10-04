-- W2-H (BUILD-PLAN §1.6 W2 allotment; LIVE-STUDIO §3.11, §10, §12; STUDENT-FLOW §5.3, §9.3): Studio in the lesson.
--
-- 1. studio_build: one row per gate-passed build, content-addressed (build_sha = sha256 of exactly the fragment bytes the
--    gate passed; the client re-hashes before it mounts). Child-free: the build, its plan digest and its record (timings,
--    usage, the check list). Never a child id, a name or a child's words (LIVE-STUDIO §5.4).
-- 2. studio_library: one row per identity = sha256(kind, archetype, skill, Band4, lang family, kit hash, studio-kit version).
--    The builder model is a variant attribute, never part of the key. States live_passed -> transfer_passed -> promoted
--    -> retired; at most 3 promoted variants (server/studio/library.js enforces it).
-- 3. studio_gate_pass: the gate-result cache (LIVE-STUDIO §9): exactly which (build, params, strings) passed G-mount or
--    G-transfer. When the gate is down a library build mounts only on an exact hit here.
-- 4. studio_mount: one row per piece shown to a child in a lesson: what was revealed, why, the outcome, the live-build
--    spend the per-child caps read, and "Not this one" (not_this_at: that archetype is not offered to this child for a
--    week, STUDENT-FLOW §5.3). No child_id column (016's rule): keyed by lesson_id with ON DELETE CASCADE, so erasure and
--    the M0 ratchet (which deletes `lesson`) remove it; per-child reads join lesson.child_id.
-- 5. kt_evidence.via gains 'studio' (host-graded Studio answers, weight x0.75 in learner/kt/bktr.js SOURCE_WEIGHT).
create table if not exists studio_build (
  build_sha   text primary key,
  identity    text not null,
  archetype   text not null,
  kind        text not null,
  fragment    text not null,
  plan        jsonb not null default '{}'::jsonb,
  record      jsonb not null default '{}'::jsonb,
  status      text not null default 'live_passed' check (status in ('live_passed','transfer_passed','promoted','retired')),
  distinct_passes int not null default 1,
  mounts      int not null default 0,
  incidents   int not null default 0,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists studio_build_identity on studio_build (identity, status);

create table if not exists studio_library (
  identity       text primary key,
  kind           text not null,
  archetype      text not null,
  skill_id       text not null,
  band           text not null,
  lang_family    text not null,
  kit_hash       text not null,
  kit_version    text not null,
  promoted_shas  text[] not null default '{}',
  stats          jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

create table if not exists studio_gate_pass (
  build_sha    text not null references studio_build(build_sha) on delete cascade,
  params_hash  text not null,
  strings_hash text not null,
  gate         text not null,
  at           timestamptz not null default now(),
  primary key (build_sha, params_hash, strings_hash)
);

create table if not exists studio_mount (
  id          bigserial primary key,
  lesson_id   uuid not null references lesson(id) on delete cascade,
  intent_id   text not null,
  build_sha   text,
  source      text not null check (source in ('library','live','skeleton','whiteboard')),
  kind        text not null,
  archetype   text not null,
  skill_id    text,
  topic_id    text,
  misconception_id text,
  facts       jsonb not null default '{}'::jsonb,
  usd         numeric(10,5) not null default 0,
  revealed_at timestamptz,
  outcome     jsonb not null default '{}'::jsonb,
  not_this_at timestamptz,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (lesson_id, intent_id)
);
create index if not exists studio_mount_lesson on studio_mount (lesson_id, created_at desc);

alter table kt_evidence drop constraint if exists kt_evidence_via_check;
alter table kt_evidence add constraint kt_evidence_via_check check (via in ('dialogue','game','module','callback','weave','late','studio'));
