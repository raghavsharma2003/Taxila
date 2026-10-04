-- W2-E (BUILD-PLAN §1.6 W2 allotment; TEACHER-BRAIN §4, §11, TB12; BR0): the Teacher Brain's explainable record.
--
-- 1. brain_trace: one row per committed turn, written INSIDE the turn's transaction (server/brain/trace.js). It says what
--    the kernel saw and decided, as codes and digests only: the proposals (source, kind, rank, reason codes), the
--    winners, the rejected ones with why, the beat, the lane and the server's own compute time. Never the child's words,
--    never a model's prose, never an affect or engagement label (NM-3). A support question ("why did she do that?") and
--    the parent's "How Taxila teaches {child}" page are answered from these rows (TB12). Kept 90 days (expires_at).
-- 2. decision_record: a decision point that chose between acceptable options (today: the re-teach arm, RT-ARM), with
--    the options, the choice, how it was chosen, and its propensity when the chooser knows it (RESEARCH-PROGRAM §4.3).
-- 3. lesson_plan: the planned beats of a lesson and their revisions (BR3 fills it in W3; the table lands now).
-- 4. format_posterior: POPULATION rows only (format x topic type x Band4); no child id, ever (NM-3; TEACHER-BRAIN §4).
--
-- No new child_id column: every per-child row is keyed by lesson_id with ON DELETE CASCADE, so erasure and the M0
-- ratchet (which deletes `lesson`, learner/mode.js M0_HISTORY_TABLES) remove them with the lesson.
create table if not exists brain_trace (
  id          bigserial primary key,
  lesson_id   uuid not null references lesson(id) on delete cascade,
  turn        int not null,
  at          timestamptz not null default now(),
  lane        text not null,
  move        text not null,
  beat        text,
  inputs_hash text not null,
  proposals   jsonb not null,
  accepted    jsonb not null,
  rejected    jsonb not null,
  reasons     text[] not null default '{}',
  server_ms   int,
  kernel_us   int,
  legal_mode_at_write text not null,
  expires_at  timestamptz not null default now() + interval '90 days',
  unique (lesson_id, turn)
);
create index if not exists brain_trace_expires on brain_trace (expires_at);

create table if not exists decision_record (
  id          bigserial primary key,
  lesson_id   uuid not null references lesson(id) on delete cascade,
  turn        int not null,
  at          timestamptz not null default now(),
  point_id    text not null,
  options     jsonb not null,
  chosen      text not null,
  chosen_by   text not null,
  randomised  boolean not null default false,
  propensity  double precision,
  seed_ref    text,
  available   boolean not null default true,
  reasons     text[] not null default '{}',
  legal_mode_at_write text not null
);
create index if not exists decision_record_point on decision_record (point_id, at);
create index if not exists decision_record_lesson on decision_record (lesson_id, turn);

create table if not exists lesson_plan (
  id          bigserial primary key,
  lesson_id   uuid not null references lesson(id) on delete cascade,
  revision    int not null,
  at          timestamptz not null default now(),
  plan        jsonb not null,
  reasons     text[] not null default '{}',
  inputs_hash text not null,
  unique (lesson_id, revision)
);

create table if not exists format_posterior (
  format      text not null,
  topic_type  text not null,
  band        text not null,
  alpha       double precision not null default 1,
  beta        double precision not null default 1,
  n           int not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (format, topic_type, band)
);
