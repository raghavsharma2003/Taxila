create table child (id uuid primary key);
create table child_seq (child_id uuid primary key references child(id), last bigint not null default 0, pending_since timestamptz);
create table student_event (child_id uuid not null, seq bigint not null, id text not null, type text not null, idem_key text not null, body jsonb, primary key (child_id, seq), unique (child_id, idem_key));
create table job (id bigint generated always as identity primary key, kind text not null, child_id uuid, idem_key text not null, status text not null default 'queued', attempts int not null default 0, cancel_requested boolean not null default false, correlation_id text not null default 'c', unique(kind, idem_key));
create table wakeup (child_id uuid not null, dedupe text not null, due_at timestamptz not null, reason text not null, fired_at timestamptz, primary key (child_id, dedupe));
create table conductor_state (child_id uuid primary key, version bigint not null default 0, state jsonb not null default '{}');
create or replace function ingest_event(p_child uuid, p_type text, p_idem text, p_body jsonb) returns bigint language plpgsql as $$
declare s bigint;
begin
  if exists (select 1 from student_event where child_id=p_child and idem_key=p_idem) then return null; end if;
  insert into child_seq (child_id) values (p_child) on conflict do nothing;
  update child_seq set last=last+1, pending_since=coalesce(pending_since, now()) where child_id=p_child returning last into s;
  insert into student_event (child_id, seq, id, type, idem_key, body) values (p_child, s, gen_random_uuid()::text, p_type, p_idem, p_body) on conflict (child_id, idem_key) do nothing;
  return s;
end $$;
-- synthesis (CONDUCTOR.md §3.8) shape: lock job row FIRST, then ingest (child_seq)
create or replace function complete_job(p_job bigint, p_attempt int) returns boolean language plpgsql as $$
declare j job%rowtype;
begin
  select * into j from job where id=p_job and attempts=p_attempt and status='running' for update;
  if not found then return false; end if;
  perform pg_sleep(0.5);
  update job set status = case when j.cancel_requested then 'cancelled' else 'done' end where id=p_job;
  if not j.cancel_requested then perform ingest_event(j.child_id, 'job.done', 'job:'||j.id||':done', '{}'); end if;
  return true;
end $$;
-- fixed shape: lock child_seq FIRST (global order child_seq -> conductor_state -> job -> wakeup)
create or replace function complete_job_fixed(p_job bigint, p_attempt int) returns boolean language plpgsql as $$
declare j job%rowtype; c uuid;
begin
  select child_id into c from job where id=p_job;
  if c is not null then perform 1 from child_seq where child_id=c for update; end if;
  select * into j from job where id=p_job and attempts=p_attempt and status='running' for update;
  if not found then return false; end if;
  perform pg_sleep(0.5);
  update job set status = case when j.cancel_requested then 'cancelled' else 'done' end where id=p_job;
  if not j.cancel_requested then perform ingest_event(j.child_id, 'job.done', 'job:'||j.id||':done', '{}'); end if;
  return true;
end $$;
create or replace function fire_wakeups(p_limit int) returns table (child_id uuid, seq bigint) language sql as $$
  with d as (select w.child_id, w.dedupe, w.reason from wakeup w where w.fired_at is null and w.due_at <= now() order by w.due_at for update skip locked limit p_limit),
       f as (update wakeup w set fired_at=now() from d where w.child_id=d.child_id and w.dedupe=d.dedupe returning w.child_id, w.dedupe, w.reason),
       z as (select pg_sleep(0.5))
  select f.child_id, ingest_event(f.child_id, 'clock.wakeup', 'wake:'||f.dedupe, '{}') from f, z;
$$;
