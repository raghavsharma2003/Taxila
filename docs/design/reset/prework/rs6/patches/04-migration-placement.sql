-- PROPOSED NEW FILE: db/migrations/0NN_placement.sql (RS-6 F2; RESET-PLAN §3.1 allots migration `placement` to RS-6).
-- One row per placement round. `state` is server/placement/session.js's serialisable state (items asked, answers graded by
-- code, seed); `result` is cat.js result(): strand posterior summary, level, startGE, skipAhead, and `placement`, the
-- own-evidence site handed to server/learner/kt/ability.js initialBase({ placement }) when the strand's epoch opens.
-- Additive only. A child's placement is learning data: covered by the existing account-deletion cascade via child(id).
create table if not exists placement (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references child(id) on delete cascade,
  subject      text not null check (subject in ('maths', 'evs', 'science')),
  state        jsonb not null,
  result       jsonb,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists placement_child on placement (child_id, subject, created_at desc);

-- The school's current chapter per subject, asked of the parent at onboarding and changeable by the child (F0.4).
-- server/content/next-topic.js (patch 01) reads child.school_chapter?.[subject].
alter table child add column if not exists school_chapter jsonb;
