-- 046 (round 7 F, App's app-world-hangar-depth; Learning's range 044-049; PIPELINE §14 B2-4, K-P5):
-- child_map_mark: the FIRST time /api/child/map saw a chapter sealed or a skill secure. Set once, never cleared on a dip,
--   so a chapter that decays and re-seals is still one moment ("Chapter sealed" in the Debrief once; "since {date}").
--   backfilled = the mark was already true on the child's first map read after this migration: its time is unknown, so
--   the API sends null for it (never a fake "today"). One ('seen', '') row marks the child's first map read.
-- child_equip: the Hangar cosmetics the child equipped (catalog item ids, data/kaksha/catalog.json), synced across devices.
-- Additive and re-runnable; erasing the child cascades both.
create table if not exists child_map_mark (
  child_id    uuid not null references child(id) on delete cascade,
  kind        text not null check (kind in ('chapter_sealed', 'skill_secure', 'seen')),
  ref_id      text not null check (char_length(ref_id) <= 120),
  first_at    timestamptz not null default now(),
  backfilled  boolean not null default false,
  primary key (child_id, kind, ref_id)
);
create table if not exists child_equip (
  child_id    uuid primary key references child(id) on delete cascade,
  equipped    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
