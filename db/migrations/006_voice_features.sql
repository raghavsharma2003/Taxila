-- Child voice features (decision voice-features-longitudinal; server/voice/features.js). Numbers only: the
-- device computes them and never uploads audio, and no transcript text is kept here (turn.text already holds
-- what the child said). Everything cascades on the child's erasure.
create table if not exists voice_feature (
  id          bigserial primary key,
  child_id    uuid not null references child(id) on delete cascade,
  lesson_id   uuid references lesson(id) on delete cascade,
  item_id     text,
  context     text not null default 'answer' check (context in ('answer','read_aloud')),
  asr_conf    real,
  barge_in    boolean not null default false,
  -- false = stored but excluded from baselines, z-scores, signals and trends (low ASR confidence, barge-in, too short)
  reliable    boolean not null,
  f           jsonb not null,                       -- VoiceFeatureValues (allowlisted, range-checked)
  z           jsonb not null default '{}',          -- per-child z at the time it was recorded (baseline before it)
  signals     jsonb not null default '{}',          -- signalsFrom(z): tie-breakers only, never labels
  at          timestamptz not null default now()
);
create index if not exists voice_feature_child on voice_feature(child_id, at desc);
create index if not exists voice_feature_lesson on voice_feature(lesson_id, at desc);

-- Running per-child baseline per context × feature (Welford; exponential window past n = 300).
-- n_total counts every sample ever and is the optimistic-lock token for concurrent updates.
create table if not exists voice_baseline (
  child_id    uuid not null references child(id) on delete cascade,
  context     text not null check (context in ('answer','read_aloud')),
  feature     text not null,
  n           int not null,
  n_total     int not null,
  mean        double precision not null,
  m2          double precision not null,
  updated_at  timestamptz not null default now(),
  primary key (child_id, context, feature)
)
