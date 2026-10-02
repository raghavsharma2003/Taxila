-- Taxila per-student workspace tables (proposed db/migrations/0xx_workspace.sql).
-- Rationale: docs/research/conductor/student-workspace.md §6 (2026-10-02). Draft, not applied.

-- Global directory (small; lives in cell 0 or its own tiny project). Routing only: no personal data.
create table child_directory (
  child_id    uuid primary key,
  guardian_id uuid not null,
  cell        smallint not null,                        -- Neon project index
  region      text not null default 'sea',              -- 'sea' (Singapore) | 'in' (future India cell)
  state       text not null default 'active',           -- mirrors workspace.state for routing
  moved_at    timestamptz
);

create table workspace (
  child_id     uuid primary key references child(id) on delete cascade,
  state        text not null default 'provisional' check (state in
               ('provisional','active','dormant','notice','paused','erasing','erased')),
  legal_mode   text not null default 'M1' check (legal_mode in ('M0','M1','M2','M3')),   -- NM-1
  schema_v     int  not null default 1,
  academic_year text not null,                          -- '2026-27'; rollover in §11.3
  last_active_at timestamptz,
  dormant_since  timestamptz,
  notice_sent_at timestamptz,
  bytes_hot    bigint not null default 0,               -- refreshed nightly; quota and cost telemetry
  bytes_blob   bigint not null default 0,
  quota        jsonb not null default '{"creations_mb":50,"notebook_pages":2000}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- W4: per-child DEK, wrapped by the Key Vault key `taxila-ws-kek`. Deleting this row is the crypto-shred.
create table child_key (
  child_id    uuid primary key references child(id) on delete cascade,
  kek_version text not null,                            -- Key Vault key version used to wrap
  wrapped_dek bytea not null,                           -- AES-256 DEK, RSA-OAEP/AES-KW wrapped
  created_at  timestamptz not null default now(),
  rotated_at  timestamptz
);

-- Index of every blob a child owns (the Blob account never needs listing to answer "what exists?")
create table workspace_object (
  child_id    uuid not null references child(id) on delete cascade,
  id          text not null,                            -- ULID
  kind        text not null check (kind in ('segment','notebook_snapshot','creation','export','voice_moment')),
  blob_key    text not null,                            -- c/<cell>/<childId>/<prefix>/<id> in taxilaws
  bytes       bigint not null, sha256 bytea not null,
  enc         text not null default 'dek-v1',           -- 'dek-v1' | 'none' (exports are re-encrypted per link)
  expires_at  timestamptz,                              -- exports 7 d, voice moments 30 d
  created_by  text not null,                            -- owner from WORKSPACE_MAP
  created_at  timestamptz not null default now(),
  primary key (child_id, id)
);

-- Archived hot rows (W3): turns > 30 d, evidence > 180 d, events > 400 d, decisions > 90 d
create table archive_segment (
  child_id    uuid not null references child(id) on delete cascade,
  source      text not null check (source in ('turn','kt_evidence','student_event','decision_log','day_plan')),
  from_key    text not null, to_key text not null,      -- seq or timestamp range, inclusive
  rows        int not null,
  object_id   text not null,                            -- → workspace_object (zstd NDJSON, DEK-encrypted)
  created_at  timestamptz not null default now(),
  primary key (child_id, source, from_key)
);

-- Notebook and whiteboard (§9): a page has layers, each layer has exactly one writer
create table notebook_page (
  child_id    uuid not null references child(id) on delete cascade,
  page_id     text not null,                            -- ULID
  kind        text not null check (kind in ('lesson_board','notebook','homework','offline_task')),
  lesson_id   uuid references lesson(id) on delete set null,
  skill_ids   text[] not null default '{}',
  title       text,                                     -- shape, e.g. topic name; never child text
  snapshot_object text,                                 -- compacted ops → workspace_object id
  op_seq      bigint not null default 0,                -- last compacted op
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  primary key (child_id, page_id)
);
create table notebook_op (
  child_id    uuid not null, page_id text not null,
  layer       text not null check (layer in ('teacher','child')),
  writer      text not null,                            -- 'director' | device_id
  writer_seq  bigint not null,                          -- per-writer monotonic counter
  seq         bigint generated always as identity,
  op          bytea not null,                           -- DEK-encrypted NotebookOp (§9)
  at          timestamptz not null default now(),
  primary key (child_id, page_id, writer, writer_seq),  -- idempotent replays
  foreign key (child_id, page_id) references notebook_page(child_id, page_id) on delete cascade
);

-- Per-child shelf of library artefacts (§10). The artefact itself is library-level (forge_artifact).
create table artifact_shelf (
  child_id    uuid not null references child(id) on delete cascade,
  artifact_id text not null,                            -- forge_artifact id (content-addressed)
  skin        jsonb not null default '{}',              -- runtime init params: name token, interest context, language
  first_lesson uuid references lesson(id) on delete set null,
  uses        int not null default 0,                   -- operational fact (what was shown), not an engagement model
  pinned_by_child boolean not null default false,       -- explicit choice ("mera game")
  hidden      boolean not null default false,           -- parent or child removed it
  last_used_at timestamptz,
  primary key (child_id, artifact_id)
);
create table artifact_use (                              -- one row per showing; parent transparency + no-repeat logic
  child_id uuid not null references child(id) on delete cascade, artifact_id text not null,
  lesson_id uuid references lesson(id) on delete cascade, at timestamptz not null default now(),
  outcome  text check (outcome in ('goal_met','abandoned','stuck','error'))   -- module protocol result, no timing
);

create table child_creation (
  child_id uuid not null references child(id) on delete cascade, id text not null,
  kind text not null check (kind in ('drawing','game_project','teachback_audio','photo')),
  title text, object_id text not null, lesson_id uuid references lesson(id) on delete set null,
  created_at timestamptz not null default now(), primary key (child_id, id));

-- Devices are not identity (inherited law); they are revocable replicas bound to a guardian
create table device (
  id          text primary key,                         -- random, minted at pairing; not a hardware id (NM-5)
  guardian_id uuid not null references guardian(id) on delete cascade,
  platform    text not null check (platform in ('android','web')),
  app_version text, paired_at timestamptz not null default now(),
  last_sync_at timestamptz, clock_offset_ms int,        -- measured at each sync handshake (§8.5)
  revoked_at  timestamptz, wipe_pending boolean not null default false
);
create table device_child (                              -- which profiles this device may open
  device_id text not null references device(id) on delete cascade,
  child_id  uuid not null references child(id) on delete cascade,
  doc_versions jsonb not null default '{}',             -- last ETag served per doc (§8.2)
  last_op_seq  bigint not null default 0,               -- last acked writer_seq from this device for this child
  primary key (device_id, child_id)
);

create table pack (
  child_id    uuid not null references child(id) on delete cascade,
  for_date    date not null, version int not null default 1,
  manifest    jsonb not null,                           -- PackManifest (§8.3)
  shared_bytes bigint not null, personal_bytes int not null,
  built_at    timestamptz not null default now(), expires_at timestamptz not null,
  primary key (child_id, for_date, version)
);

create table workspace_lifecycle (                       -- every transition; content-free, kept as an erasure receipt
  id bigserial primary key, child_id uuid not null,      -- no FK: survives the erase as a receipt
  from_state text, to_state text not null, reason text not null, actor text not null,
  detail jsonb not null default '{}', at timestamptz not null default now()
);
create table data_request (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references guardian(id) on delete cascade, child_id uuid,
  kind text not null check (kind in ('export','erase_child','erase_lesson','erase_transcripts','reset_profile','correct')),
  scope jsonb not null default '{}', status text not null default 'queued',
  object_id text, requested_at timestamptz not null default now(), done_at timestamptz,
  receipt jsonb                                          -- counts per map entry, no content
);
