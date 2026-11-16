-- 034 (round 7, stream F Learning, learning-subject-rotation): the child's school timetable, by weekday.
-- The day's subject comes from here first (dc-r7 D6: parent timetable, then the child's intake, then the Conductor's
-- rotation). One row per (child, weekday, source); weekday 0 = Sunday .. 6 = Saturday (conductor/clock.js weekday).
-- `subjects` is the day's school subjects in the order the parent (or the intake) gave them; the rotation picks from
-- them (server/conductor/rotation.js). A parent row always wins over an intake row for the same weekday.
create table if not exists child_timetable (
  child_id   uuid not null references child(id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  source     text not null default 'parent' check (source in ('parent', 'intake')),
  subjects   text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (child_id, weekday, source)
);
