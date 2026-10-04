-- PROPOSAL, NOT APPLIED. voicesig per-child baselines (docs/design/voice-signals/SPEC.md §5; INTEGRATION.md step A4).
-- The main loop allots the number (db/migrations/0NN_voicesig.sql), applies it to the Neon TEST branch first
-- (DATABASE_URL=$CONDUCTOR_TEST_DATABASE_URL node scripts/migrate.mjs), then production in a wave's integration step.
-- Format per db/migrations/README.md: one statement per `;` at line end, no $$ blocks.
--
-- What it may hold (G-VS-SCHEMA, tests/voicesig.test.mjs): running moments of per-turn MEASUREMENTS (timing, pauses,
-- relative intensity) per child x context x language mode x answer form, and per-head calibration offsets. Never a per-turn
-- history, transcript, audio, embedding or derived knowledge-state name.
-- Consent: rows exist ONLY for children whose parent granted V2 ("remember your child's usual answering pace"; off by
-- default). Withdrawal deletes voicesig.subject (cascade). Account deletion cascades through child(id).
-- Residency: Neon has no India region (nearest aws-ap-southeast-1, Singapore); the V2 notice names it. The schema moves
-- unchanged to Azure Database for PostgreSQL (South India) if the main database moves.

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

-- Jobs (not part of the migration; the nightly worker runs them):
--   retention: delete from voicesig.subject where last_seen < now() - interval '180 days';
--   withdrawal backstop: delete from voicesig.subject s where not exists (select 1 from <v2 consent table> c where c.child_id = s.child_id and c.granted);
-- Existing table voice_baseline (migration 006) persists per-child baselines WITHOUT a V2-style grant. Proposal: put it
-- under the same V2 gate, or fold it into voicesig.baseline and drop it, so there is ONE persistent baseline, not two.
