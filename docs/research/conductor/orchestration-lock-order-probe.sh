#!/usr/bin/env bash
# Lock-order probe for the Conductor substrate (orchestration-architecture.md, Architect review R10.1).
# Reproduces the deadlock between the Conductor commit and complete_job / fire_wakeups when the commit
# locks child_seq FIRST (CONDUCTOR.md §3.4 order), and shows none when child_seq is locked LAST (orch R2.4 order)
# or when complete_job takes child_seq before the job row.
# Needs a scratch Postgres 16 reachable as: psql -h $PGHOST -p $PGPORT -U postgres. Sleeps widen the race window
# deterministically; in production the same cycle occurs with lower probability and PG aborts one side after
# deadlock_timeout (default 1 s). Run: PGHOST=/path PGPORT=54329 bash orchestration-lock-order-probe.sh
set -u
DIR=$(cd "$(dirname "$0")" && pwd)
P="psql -h ${PGHOST:-localhost} -p ${PGPORT:-5432} -U postgres -q -X -t"
$P -f "$DIR/orchestration-lock-order-probe.schema.sql" >/dev/null 2>&1
$P -c "create or replace function complete_job(p_job bigint, p_attempt int) returns boolean language plpgsql as \$\$
declare j job%rowtype;
begin
  select * into j from job where id=p_job and attempts=p_attempt and status='running' for update;
  if not found then return false; end if;
  perform pg_sleep(1.0);
  update job set status = case when j.cancel_requested then 'cancelled' else 'done' end where id=p_job;
  if not j.cancel_requested then perform ingest_event(j.child_id, 'job.done', 'job:'||j.id||':done', '{}'); end if;
  return true;
end \$\$;" >/dev/null
C=00000000-0000-0000-0000-000000000001
WK="insert into wakeup values ('$C','day_start:2026-10-03', now()+interval '1 day','day_start',null) on conflict (child_id,dedupe) do update set due_at=excluded.due_at where wakeup.fired_at is null;"
JB="update job set cancel_requested=true where child_id='$C' and kind='memory.consolidate' and status='running';"
COMMIT_SEQ_FIRST="begin; update child_seq set pending_since=null where child_id='$C'; select pg_sleep(0.2); update conductor_state set version=version+1 where child_id='$C'; $JB $WK commit;"
COMMIT_SEQ_LAST="begin; update conductor_state set version=version+1 where child_id='$C'; select pg_sleep(0.2); $JB $WK update child_seq set pending_since=null where child_id='$C'; commit;"
for other in "select complete_job(1,1);" "select * from fire_wakeups(500);" "select complete_job_fixed(1,1);"; do
  for lab in SEQ_FIRST SEQ_LAST; do
    eval CS=\$COMMIT_$lab; n=0
    for t in 1 2 3 4 5; do
      $P -f "$DIR/orchestration-lock-order-probe.reset.sql" >/dev/null
      ( $P -c "$other" > /tmp/lop_b.out 2>&1 ) & sleep 0.3
      $P -c "$CS" > /tmp/lop_a.out 2>&1; wait 2>/dev/null
      n=$((n + $(cat /tmp/lop_a.out /tmp/lop_b.out | grep -c "deadlock detected")))
    done
    echo "commit($lab) vs [$other]: deadlocks $n/5"
  done
done
