-- 043 (round 7 whole-project audit, platform PLAT-17; numbering: Platform 040-043): brain_trace.item_id and
-- misconception_id for every database. 016_brain.sql was edited in place after it was applied (its two `alter ... add
-- column if not exists` lines), and files are tracked by name, so a database that ran the first 016 never got them;
-- server/brain/trace.js probes for them per process (columnReady) for that reason. Idempotent: a no-op where 016's
-- create or alters already made them. Once this is applied everywhere, Brain can drop the probe.
alter table brain_trace add column if not exists item_id text;
alter table brain_trace add column if not exists misconception_id text;
