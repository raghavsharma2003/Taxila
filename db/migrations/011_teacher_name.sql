-- 011: the child names their teacher (context/decisions.md#child-names-teacher), additive only.
-- child.teacher_name: the name the child gave the character they picked (null = the character's own name, e.g. Asha).
-- The safety predicate is code (server/compiler/characters/naming.js); this check is only the shape floor, so a
-- write that skipped the predicate still cannot store markup or a long string. teacher_name_at: when it was set
-- (the next lesson re-introduces her under the new name, still as an AI teacher).
alter table child add column if not exists teacher_name text;
alter table child add column if not exists teacher_name_at timestamptz;
alter table child drop constraint if exists child_teacher_name_shape;
alter table child add constraint child_teacher_name_shape
  check (teacher_name is null or (char_length(teacher_name) between 2 and 16 and teacher_name ~ '^[A-Za-z]+([ -][A-Za-z]+){0,2}$'));

-- Every accepted name and every reset, for the parent corner's "Teacher's name" history. A rejected attempt is never
-- stored (it may be a word a child should not have typed): only accepted names reach a row. source: who set it.
create table if not exists teacher_name_history (
  id            bigint generated always as identity primary key,
  child_id      uuid not null references child(id) on delete cascade,
  name          text,
  character_id  text not null,
  source        text not null check (source in ('child', 'parent', 'switch')),
  at            timestamptz not null default now()
);
create index if not exists teacher_name_history_child on teacher_name_history(child_id, at desc);
