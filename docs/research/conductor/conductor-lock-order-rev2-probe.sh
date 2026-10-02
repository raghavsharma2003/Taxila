#!/usr/bin/env bash
# Lock-order probe for the REV-2 Conductor commit (CONDUCTOR.md §3.4, ruling X29: child_seq is the LAST row any
# multi-table writer locks). Reuses orchestration-lock-order-probe.schema.sql (orch R10.1) and adds: the rev-2 commit
# shape (CAS conductor_state -> job -> wakeup -> child_seq -> lease decision on the held state row), both race
# directions, a create_commitment() that takes child_seq first, an in-flight ingest (has_more must be true), and a
# multi-child ticker batch racing two commits. Controls: the rev-1 child_seq-first commit must deadlock.
# Needs a scratch Postgres 16: PGHOST=/socket/dir PGPORT=5432 bash conductor-lock-order-rev2-probe.sh  (~55 s)
set -u
DIR=$(cd "$(dirname "$0")" && pwd); H=$(mktemp -d)
P="psql -h ${PGHOST:-localhost} -p ${PGPORT:-5432} -U postgres -q -X -t -A"
$P -f "$DIR/orchestration-lock-order-probe.schema.sql" >/dev/null 2>&1
$P -f "$DIR/conductor-lock-order-rev2-probe.extra.sql" >/dev/null
# complete_job with a 1.0 s hold, exactly as the R10 probe redefines it
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
A=00000000-0000-0000-0000-000000000001; Bc=00000000-0000-0000-0000-000000000002
wk() { echo "insert into wakeup values ('$1','day_start:2026-10-03', now()+interval '1 day','day_start',null) on conflict (child_id,dedupe) do update set due_at=excluded.due_at where wakeup.fired_at is null;"; }
jb() { echo "update job set cancel_requested=true where child_id='$1' and kind='memory.consolidate' and status='running';"; }
# rev-2 shape: CAS state -> job -> wakeup -> child_seq LAST -> lease decision on the already-held state row
spec() { echo "begin; update conductor_state set version=version+1 where child_id='$1'; select pg_sleep($2); $(jb $1) $(wk $1) select pg_sleep($3); with u as (update child_seq set pending_since = case when last > 5 then pending_since else null end where child_id='$1' returning last) select 'HAS_MORE='||(last>5) from u; update conductor_state set state=state where child_id='$1'; commit;"; }
first() { echo "begin; update child_seq set pending_since=null where child_id='$1'; select pg_sleep(0.2); update conductor_state set version=version+1 where child_id='$1'; $(jb $1) $(wk $1) commit;"; }
cell() { # $1 label, $2 other-writer SQL, $3 commit SQL, $4 other-first delay, $5 commit-first(1)/other-first(0)
  local n=0 hm=0 ev=0
  for t in 1 2 3 4 5; do
    $P -f "$DIR/conductor-lock-order-rev2-probe.reset.sql" >/dev/null
    if [ "$5" = 0 ]; then ( $P -c "$2" > $H/b.out 2>&1 ) & sleep $4; $P -c "$3" > $H/a.out 2>&1; wait
    else ( $P -c "$3" > $H/a.out 2>&1 ) & sleep $4; $P -c "$2" > $H/b.out 2>&1; wait; fi
    n=$((n + $(cat $H/a.out $H/b.out | grep -c "deadlock detected")))
    hm=$((hm + $(grep -c "HAS_MORE=t" $H/a.out)))
    ev=$($P -c "select count(*) from student_event")
  done
  echo "$1: deadlocks $n/5; has_more=true $hm/5; events after last run $ev"
}
cell "control: commit child_seq FIRST vs complete_job" "select complete_job(1,1);" "$(first $A)" 0.3 0
cell "control: commit child_seq FIRST vs fire_wakeups" "select count(*) from fire_wakeups(500);" "$(first $A)" 0.3 0
cell "rev2 commit vs complete_job (job first)" "select complete_job(1,1);" "$(spec $A 0.2 0)" 0.3 0
cell "rev2 commit vs fire_wakeups (wakeups first)" "select count(*) from fire_wakeups(500);" "$(spec $A 0.2 0)" 0.3 0
cell "rev2 commit first, then complete_job" "select complete_job(1,1);" "$(spec $A 0 0.8)" 0.3 1
cell "rev2 commit first, then fire_wakeups" "select count(*) from fire_wakeups(500);" "$(spec $A 0 0.8)" 0.3 1
cell "rev2 commit vs create_commitment (child_seq mutex first)" "select create_commitment('$A');" "$(spec $A 0.2 0)" 0.3 0
cell "rev2 commit vs in-flight ingest (has_more must be t)" "begin; select ingest_event('$A','x','idem-x','{}'); select pg_sleep(0.8); commit;" "$(spec $A 0.2 0)" 0.2 0
# multi-child: one ticker batch over A and B racing commits for both children
mc=0
for t in 1 2 3 4 5; do
  $P -f "$DIR/conductor-lock-order-rev2-probe.reset.sql" >/dev/null
  ( $P -c "select count(*) from fire_wakeups(500);" > $H/b.out 2>&1 ) & sleep 0.2
  ( $P -c "$(spec $A 0.1 0)" > $H/a.out 2>&1 ) & ( $P -c "$(spec $Bc 0.1 0)" > $H/c.out 2>&1 ) & wait
  mc=$((mc + $(cat $H/a.out $H/b.out $H/c.out | grep -c "deadlock detected")))
  fired=$($P -c "select count(*) from wakeup where fired_at is not null"); evs=$($P -c "select count(*) from student_event where type='clock.wakeup'")
done
echo "multi-child ticker batch (A,B) vs 2 concurrent rev2 commits: deadlocks $mc/5; last run fired=$fired clock.wakeup events=$evs"
