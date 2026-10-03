-- 008: the child's tutor choice (AVATAR.md §7.5, tutor-selection-ux §6.2), additive only.
-- child.teacher_id already holds the chosen character id (001). tutor_chosen_at says the CHILD chose it (the
-- picker has no default, so "teacher_id = class default" must not read as a choice). The per-child picker
-- shuffle seed is derived from child.id (shared/tutors.js seedOf), so no seed column.
alter table child add column if not exists tutor_chosen_at timestamptz;

-- Analytics only: never read by the brief, affect, vibe or Director code (tutor-selection-ux §7.4).
-- No reason column, deliberately (a child is never asked why).
create table if not exists tutor_switch (
  id           bigint generated always as identity primary key,
  child_id     uuid not null references child(id) on delete cascade,
  from_id      text,
  to_id        text not null,
  to_rev       int not null default 1,
  source       text not null check (source in ('child', 'child_random', 'parent', 'system_retire', 'class_change')),
  shown        text[] not null default '{}',
  ms_to_choose int,
  at           timestamptz not null default now()
);
create index if not exists tutor_switch_child on tutor_switch(child_id, at desc);
