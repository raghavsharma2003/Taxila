-- Round 5, stream 3 -> main (14.3 ask 1): the 429 overflow on production traffic, READ-ONLY, from trace_event.
-- Gap: server/trace/model.js records data.lane = quotaLane ?? lane, and every overflowed call carries quotaLane "hot", so
-- no row says OVERFLOW. Until the recorder adds the endpoint lane, a moved call is INFERRED: a 429 on a deployment
-- followed, in the same request (rid) or session (sid) within 15 s, by a call of the same deployment and kind that answered.
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
  join calls c on c.dep = th.dep and c.kind = th.kind and c.id > th.id and c.status <> '429'
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
