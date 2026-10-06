-- ship5 p3-voicesig (owner-ship-five-2026-10-05): per-child voice-signal baselines (docs/design/voice-signals/SPEC.md §5).
-- Number 021 (next free after W2's 020; if another ship5 stream also took 021, rename this file to the next free number
-- at integration; nothing references the number).
-- Apply to the Neon TEST branch first: DATABASE_URL=$CONDUCTOR_TEST_DATABASE_URL node scripts/migrate.mjs
--
-- What it may hold (G-VS-SCHEMA, tests/p3-voicesig-server.test.mjs): running moments of per-turn MEASUREMENTS (timing,
-- pauses, relative intensity) per child x context x language mode x answer form, and per-head calibration offsets. Never a
-- per-turn history, transcript, audio, embedding or derived knowledge-state name.
-- Consent: rows exist ONLY for children whose parent chose "Remember your child's usual answering pace" (consent purpose
-- voice_pace_memory; off by default). Withdrawal deletes voicesig.subject at once (cascade; server/routes/account.js).
-- Account / child deletion cascades through child(id). The subject key is HMAC(child_id, VOICESIG_SUBJECT_KEY).
-- Residency: these rows live wherever the production database lives (docs/ops/INDIA-MOVE.md); the parent copy names no region.
-- Additive only.

create schema if not exists voicesig;

create table if not exists voicesig.subject (
  subject      bytea primary key,
  child_id     uuid not null unique references child(id) on delete cascade,
  consent_ver  text not null,
  granted_at   timestamptz not null,
  band         text not null check (band in ('B1','B2','B3','B4')),
  last_seen    timestamptz not null default now()
);

create table if not exists voicesig.baseline (
  subject    bytea not null references voicesig.subject(subject) on delete cascade,
  context    text not null check (context in ('answer','read_aloud')),
  lang_mode  text not null check (lang_mode in ('hi','hinglish','en','unk')),
  form       text not null check (form in ('number','word','choice_spoken','explain','read_aloud')),
  feature    text not null check (feature in ('onsetMs','contentOnsetMs','pauseFrac','longestPauseMs','articulationWps','voicedFrac','fillerLeadMs','durRatio','finalRelDb','durationMs')),
  n          int not null check (n >= 0),
  n_total    int not null check (n_total >= n),
  mean       double precision not null,
  m2         double precision not null check (m2 >= 0),
  updated_at timestamptz not null default now(),
  primary key (subject, context, lang_mode, form, feature)
);

create table if not exists voicesig.calibration (
  subject    bytea not null references voicesig.subject(subject) on delete cascade,
  head       text not null check (head in ('h1','h2','h3','h4')),
  model_ver  text not null,
  n          int not null check (n >= 0),
  a          double precision not null default 0,
  b          double precision not null default 1,
  updated_at timestamptz not null default now(),
  primary key (subject, head, model_ver)
);

create table if not exists voicesig.population_norm (
  feature     text not null,
  band        text not null check (band in ('B1','B2','B3','B4')),
  lang_mode   text not null check (lang_mode in ('hi','hinglish','en','unk')),
  form        text not null,
  item_b_bin  smallint not null,
  n_children  int not null check (n_children >= 20),
  median      double precision not null,
  mad         double precision not null check (mad >= 0),
  fitted_at   timestamptz not null default now(),
  primary key (feature, band, lang_mode, form, item_b_bin)
);

create index if not exists voicesig_subject_seen on voicesig.subject(last_seen);
