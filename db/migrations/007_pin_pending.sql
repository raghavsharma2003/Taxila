-- Forgotten-PIN reset pending state moves out of audit.detail (review: the audit trail will be exportable, §6.9,
-- and a 4-6 digit PIN hash is brute-forceable offline). Audit keeps only the request metadata.
alter table guardian_pin add column if not exists pending_hash text;
alter table guardian_pin add column if not exists pending_effective_at timestamptz;
alter table guardian_pin add column if not exists pending_requested_at timestamptz;
-- Login attempt counter lookups (server/routes/account.js login).
create index if not exists audit_guardian_action on audit (guardian_id, action, id);
