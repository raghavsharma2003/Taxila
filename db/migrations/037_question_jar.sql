-- 037 (round 7, stream F Learning, learning-question-jar-promises): the Question jar (STUDENT-FLOW §7).
-- A question or share the teacher parked in a lesson (Brain's s.later) and did not get back to before the lesson ended is
-- kept here, so her promise ("we'll come back to that") survives into the next lesson: the next start opens on it as a hook,
-- the child's home shows how many are waiting, and the Conductor plans for it (teacher.promise → slot.promisesDue).
-- `topic` is the parked entry's ≤ 60-character topic (conversation/policy.js parkEntry), already screened in code; never the
-- child's raw words beyond that. One row per (lesson, later id): a lesson end that runs twice writes nothing new.
create table if not exists question_jar (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references child(id) on delete cascade,
  lesson_id       uuid not null,
  later_id        text not null,
  topic           text not null check (char_length(topic) <= 60),
  learning        boolean not null default true,
  share           boolean not null default false,
  subject         text,
  created_at      timestamptz not null default now(),
  answered_at     timestamptz,
  answered_lesson uuid,
  unique (lesson_id, later_id)
);
create index if not exists question_jar_open on question_jar (child_id, created_at) where answered_at is null;
