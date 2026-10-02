-- Conductor M0 follow-up: align the notification outbox with CONDUCTOR.md §4.10.3 while the table is still empty
-- (nothing enqueues a notify command at M0; the Notifier is M1). Fixes the drift in 004_conductor.sql:
--   child_id on delete CASCADE (was set null: erasing a child left its safety/account intents with the guardian),
--   guardian_id NOT NULL, class → cls, the spec's status enum, block_reason / channel / provider_id / attempts /
--   sent_at / delivered_at / opened_at / correlation_id, and NOT NULL not_before / not_after.
-- notify_slot.child_id stays on delete set null (a tombstone: erasure never frees a slot, probe F3).
-- household_id (G3) waits for the household table. Re-runnable; the $$ body follows 004's '; --' line rule so
-- scripts/migrate.mjs's splitter keeps it one statement (tests/conductor-planner.test.mjs checks the split).

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = current_schema() and table_name = 'notification' and column_name = 'class') then
    alter table notification rename column class to cls; --
  end if; --
end $$;

alter table notification drop constraint if exists notification_child_id_fkey;
alter table notification add constraint notification_child_id_fkey foreign key (child_id) references child(id) on delete cascade;

delete from notification where guardian_id is null;
alter table notification alter column guardian_id set not null;

alter table notification add column if not exists block_reason text;
alter table notification add column if not exists channel text;
alter table notification add column if not exists provider_id text;
alter table notification add column if not exists attempts int not null default 0;
alter table notification add column if not exists sent_at timestamptz;
alter table notification add column if not exists delivered_at timestamptz;
alter table notification add column if not exists opened_at timestamptz;
alter table notification add column if not exists correlation_id text;

update notification set correlation_id = coalesce(correlation_id, 'legacy:' || id),
  not_before = coalesce(not_before, created_at), not_after = coalesce(not_after, created_at + interval '7 days');
alter table notification alter column correlation_id set not null;
alter table notification alter column not_before set not null;
alter table notification alter column not_after set not null;

alter table notification drop constraint if exists notification_status_check;
update notification set status = 'blocked' where status = 'held';
alter table notification add constraint notification_status_check
  check (status in ('pending','sending','sent','delivered','failed','expired','cancelled','blocked'));
