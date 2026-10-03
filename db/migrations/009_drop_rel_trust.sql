-- 009: drop the never-again-written trust columns (inherited NM-3: trust is never persisted; harvest port task).
alter table rel_state drop column if exists trust;
alter table rel_state drop column if exists last_trust_update;
