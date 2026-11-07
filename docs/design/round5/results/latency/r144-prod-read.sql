-- Round 5, stream 3 -> main: the 14.4 production read (read-only; run by the main loop; children only: every row's sid is a
-- real lesson, dc-r143-prod-numbers-need-a-lesson-sid). :since = the 14.4 deploy, :until = now. Baseline: 2026-10-16
-- 08:30-09:45Z (taxila-fast CHAT at the 6 s cap on 29% of calls). Model calls are told apart by their prompt's opening
-- (data.promptId): reply 'WHO YOU ARE: Asha', classify label 'You label one reply', the words-only distress read
-- 'A reply from an Indian school child', the understanding read 'You read ONE turn'.

-- 1) the reply twin: how often it fired, which arm answered, how long the turn's reply took when it did
select data->>'winner' as winner, count(*) as n,
       percentile_cont(0.5) within group (order by (data->>'ms')::int) as ms_p50,
       percentile_cont(0.9) within group (order by (data->>'ms')::int) as ms_p90
from trace_event e
where e.kind = 'reply.twin' and e.t >= :since and e.t < :until and exists (select 1 from lesson l where l.id::text = e.sid)
group by 1 order by 2 desc;

-- 2) the timeout share by lane (reply / classify label / words-only distress read / understanding read), by deployment
with c as (
  select case when data->>'promptId' like 'WHO YOU ARE: Asha%' then 'reply'
              when data->>'promptId' like 'You label one reply%' then 'classify_label'
              when data->>'promptId' like 'A reply from an Indian school child%' then 'distress_words'
              when data->>'promptId' like 'You read ONE turn%' then 'understand'
              else 'other' end as lane,
         data->>'deployment' as dep, data->>'status' as status, nullif(data->>'ms', '')::int as ms
  from trace_event e
  where e.kind = 'model.call' and e.t >= :since and e.t < :until and exists (select 1 from lesson l where l.id::text = e.sid)
)
select lane, dep, count(*) as calls,
       count(*) filter (where status = 'timeout') as timeouts,
       round(100.0 * count(*) filter (where status = 'timeout') / nullif(count(*), 0), 1) as timeout_pct,
       percentile_cont(0.5) within group (order by ms) filter (where status = '200' and ms > 2) as ok_ms_p50,
       percentile_cont(0.9) within group (order by ms) filter (where status = '200' and ms > 2) as ok_ms_p90
from c where lane <> 'other' group by 1, 2 order by 1, 3 desc;

-- 3) safety-relevant turns (safety.scan with sources): did the classify / understanding reads arrive inside their budget on
-- THAT turn? (same lesson sid and turn). A 'timeout' here is a safety read that did not arrive; the turn then opened (or not)
-- on what did: the sources column says which read decided it.
with s as (
  select e.sid, e.turn, e.data->'sources' as sources, (e.data->>'safeguardMove')::boolean as safeguard_move
  from trace_event e
  where e.kind = 'safety.scan' and e.t >= :since and e.t < :until and jsonb_array_length(coalesce(e.data->'sources', '[]'::jsonb)) > 0
    and exists (select 1 from lesson l where l.id::text = e.sid)
),
m as (
  select e.sid, e.turn,
         case when e.data->>'promptId' like 'You label one reply%' then 'classify_label'
              when e.data->>'promptId' like 'A reply from an Indian school child%' then 'distress_words'
              when e.data->>'promptId' like 'You read ONE turn%' then 'understand' end as lane,
         e.data->>'deployment' as dep, e.data->>'status' as status, nullif(e.data->>'ms', '')::int as ms
  from trace_event e
  where e.kind = 'model.call' and e.t >= :since and e.t < :until and exists (select 1 from lesson l where l.id::text = e.sid)
)
select m.lane, m.dep, count(*) as calls_on_safety_turns,
       count(*) filter (where m.status = 'timeout') as timeouts,
       percentile_cont(0.5) within group (order by m.ms) filter (where m.status = '200') as ok_ms_p50,
       max(m.ms) filter (where m.status = '200') as ok_ms_max,
       count(distinct (s.sid, s.turn)) as safety_turns,
       count(distinct (s.sid, s.turn)) filter (where s.safeguard_move) as safeguard_turns
from s join m on m.sid = s.sid and m.turn = s.turn
where m.lane is not null
group by 1, 2 order by 1, 2;
