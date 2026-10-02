-- Fixtures for conductor-lock-order-rev2-probe.sh (CONDUCTOR.md §3.4 rev 2, X29). Applied once after
-- orchestration-lock-order-probe.schema.sql: a create_commitment() in the parent-loop PA-5 shape (child_seq as the mutex,
-- taken first, then only NEW rows are inserted).
create table if not exists commitment (id serial primary key, child_id uuid not null, status text not null default 'open');
create or replace function create_commitment(p_child uuid) returns boolean language plpgsql as $$
begin
  perform 1 from child_seq where child_id = p_child for update;          -- the mutex (pl PA-5)
  perform pg_sleep(1.0);
  if (select count(*) from commitment where child_id = p_child and status = 'open') >= 4 then return false; end if;
  insert into commitment (child_id) values (p_child);
  perform ingest_event(p_child, 'parent.commitment_created', 'commit:' || gen_random_uuid(), '{}');
  return true;
end $$;
