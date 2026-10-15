-- Round 5, stream 3 -> main (14.3 ask 1): the 429 overflow on production traffic, READ-ONLY, from trace_event.
-- Gap: server/trace/model.js records data.lane = quotaLane ?? lane, and every overflowed call carries quotaLane "hot", so
-- no row says OVERFLOW. Until the recorder adds the endpoint lane, a moved call is INFERRED: a 429 on a deployment
-- followed, in the same request (rid) or session (sid) within 15 s, by the next call of the same deployment and kind (the move;
-- moved_failed counts a move that 429'd or failed again on southindia).
-- :since / :until = the window (e.g. the 14.2 rollout instant and now). Run against production by the main loop only.

with calls as (
  select id, sid, rid, t, data->>'deployment' as dep, data->>'kind' as kind, data->>'status' as status,
         nullif(data->>'ms', '')::int as ms, nullif(data->>'ttftMs', '')::int as ttft, coalesce((data->>'attempt')::int, 0) as attempt
  from trace_event
  where kind = 'model.call' and t >= :since and t < :until
),
throttled as (select * from calls where status = '429'),
moved as (
  select distinct on (th.id) th.id as throttled_id, c.id as answer_id, c.dep, c.kind, c.status, c.ms, c.ttft,
         extract(epoch from (c.t - th.t)) * 1000 as gap_ms
  from throttled th
  -- the next call of this deployment and kind in the request is the move (14.2: one move, after the first attempt's 429)
  join calls c on c.dep = th.dep and c.kind = th.kind and c.id > th.id
   and (c.rid = th.rid or (th.rid is null and c.sid = th.sid)) and c.t between th.t and th.t + interval '15 seconds'
  order by th.id, c.id
)
select
  (select count(*) from calls)                                              as calls,
  (select count(*) from throttled)                                          as throttled_429,
  round(100.0 * (select count(*) from throttled) / nullif((select count(*) from calls), 0), 2) as pct_429,
  (select count(*) from moved where status = '200')                         as moved_answered,
  (select count(*) from moved where status <> '200')                        as moved_failed,
  (select percentile_cont(0.5) within group (order by ms) from moved where status = '200')  as moved_ms_p50,
  (select percentile_cont(0.95) within group (order by ms) from moved where status = '200') as moved_ms_p95,
  (select percentile_cont(0.5) within group (order by c.ms) from calls c where c.status = '200'
     and not exists (select 1 from moved m where m.answer_id = c.id))      as unmoved_ms_p50,
  (select percentile_cont(0.95) within group (order by c.ms) from calls c where c.status = '200'
     and not exists (select 1 from moved m where m.answer_id = c.id))      as unmoved_ms_p95;
-- Per deployment: add "group by dep" to the moved / calls selects. Compare the same query on a window BEFORE the rollout
-- for the 429 rate before vs after (the overflow does not lower the primary's 429 count; it turns a 429 into an answer).

-- ── Alarm view (main, 2026-10-15): moved calls per 5-minute bucket, and how many of them FAILED after the move (a 429 or
-- an error on the southindia twin, which TEST chat traffic now shares). Put the TEST-load windows beside it.
-- Once server/trace/model.js records the endpoint lane (main, int/r5-rel143), replace the inferred `moved` with
-- `select ... from calls_raw where data->>'endpoint' = 'OVERFLOW'`.
with calls as (
  select id, sid, rid, t, data->>'deployment' as dep, data->>'kind' as kind, data->>'status' as status, nullif(data->>'ms', '')::int as ms
  from trace_event
  where kind = 'model.call' and t >= :since and t < :until
),
throttled as (select * from calls where status = '429'),
moved as (
  select distinct on (th.id) th.id as throttled_id, th.t as at, c.status, c.ms
  from throttled th
  -- after a 429 the ONLY retry is the overflow (14.2: first attempt's 429 only), so the next call of the same deployment
  -- and kind in that request is the moved one, whatever it returned
  join calls c on c.dep = th.dep and c.kind = th.kind and c.id > th.id
   and (c.rid = th.rid or (th.rid is null and c.sid = th.sid)) and c.t between th.t and th.t + interval '15 seconds'
  order by th.id, c.id
)
select date_bin(interval '5 minutes', at, timestamptz '2026-01-01') as bucket,
       count(*)                                   as moved,
       count(*) filter (where status = '200')     as moved_answered,
       count(*) filter (where status <> '200')    as moved_failed,
       count(*) filter (where status = '429')     as moved_429_on_overflow,
       percentile_cont(0.5) within group (order by ms) filter (where status = '200') as moved_ms_p50
from moved
group by 1
order by 1;
