-- r4-khand (BUILD-PLAN-V2 §3 G2; number 026 allotted by the main session: 024 board_page, 025 child_school_chapter).
-- play_build: the child's own Khand builds, kept as artefacts (game-mechanics G5: a child's build, shown to the parent).
-- Written ONLY by the server from its own replay of the child's acts on a solved level (server/play/builds.js); the device
-- never sends a build. Heights only (the law's state); no counter, no score, nothing that unlocks or decays.
-- Erasure: child_id cascades with the child row.
create table if not exists play_build (
  id         bigserial primary key,
  child_id   uuid not null references child(id) on delete cascade,
  level_id   text not null,
  topic_id   text not null,
  skill_id   text not null,
  mode       text not null,
  goal       text not null,
  w          smallint not null,
  d          smallint not null,
  heights    smallint[] not null,
  base       smallint[] not null,
  created_at timestamptz not null default now(),
  unique (child_id, level_id)
);
create index if not exists play_build_child on play_build (child_id, created_at desc);
