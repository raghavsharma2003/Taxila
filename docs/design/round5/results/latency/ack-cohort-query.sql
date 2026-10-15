-- Round 5, stream 3 -> main (14.3): the acknowledgement on the owner cohort's REAL lessons, read-only, from trace_event.
-- Server rows `ack.decision` (one per decision: kind = echo | continuer, or none = the gate's reason) and device rows
-- `ack.outcome` (what became of a decided clip: played | reply_first | late | mismatched | interrupted, with afterStopMs).
-- Codes only: no child's words, no phrase. Children only: every row's sid is a lesson id (dc-r143-prod-numbers-need-a-lesson-sid).
-- :since / :until = the window (e.g. the 14.3 deploy and a day later). Run against production by the main loop only.

-- 1) the decisions: what the server decided, by reason, for continuer-asking turns of the cohort and for everyone
with d as (
  select e.sid, e.turn, e.data from trace_event e
  where e.kind = 'ack.decision' and e.t >= :since and e.t < :until
    and exists (select 1 from lesson l where l.id::text = e.sid)
)
select coalesce(data->>'kind', 'none:' || (data->>'none')) as decision,
       count(*)                                                        as all_turns,
       count(*) filter (where (data->>'cohort')::boolean)              as cohort_turns,
       percentile_cont(0.5) within group (order by (data->>'decidedMs')::int) filter (where data ? 'decidedMs') as decided_ms_p50
from d group by 1 order by 2 desc;

-- 2) the outcomes on the device: of the clips decided, how many sounded, and how long after the child stopped
with o as (
  select e.sid, e.data from trace_event e
  where e.kind = 'ack.outcome' and e.t >= :since and e.t < :until
    and exists (select 1 from lesson l where l.id::text = e.sid)
)
select data->>'kind' as kind, data->>'outcome' as outcome, count(*) as n,
       percentile_cont(0.5) within group (order by (data->>'afterStopMs')::int) filter (where data ? 'afterStopMs')  as after_stop_ms_p50,
       percentile_cont(0.9) within group (order by (data->>'afterStopMs')::int) filter (where data ? 'afterStopMs')  as after_stop_ms_p90
from o group by 1, 2 order by 1, 3 desc;

-- 3) the echo's fixed instant: share of spoken answer turns where the echo was refused as "late" (classify not settled at
-- per.at + ACK_AT_MS). This is the number that decides whether the fixed instant needs work.
select count(*) filter (where e.data->>'none' = 'late')::float / nullif(count(*), 0) as late_share, count(*) as n
from trace_event e
where e.kind = 'ack.decision' and e.t >= :since and e.t < :until
  and exists (select 1 from lesson l where l.id::text = e.sid)
  and (e.data->>'kind' = 'echo' or e.data->>'none' in ('late', 'refused', 'window', 'consecutive', 'token_screen'));
