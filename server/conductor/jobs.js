// The home-grown job queue on Neon (CONDUCTOR.md §3.8, X6). Enqueue happens inside the Conductor commit
// (commit.js uses enqueueSql); the worker claims with FOR UPDATE SKIP LOCKED, fences every write by
// `attempts`, and finishes through complete_job(), which ingests job.done / job.failed atomically.
import { one, q } from "./pg.js";

/** Insert-or-revive (orch R2.7): a duplicate is a no-op unless the old row is dead/cancelled and input.revive. */
export const enqueueSql = `insert into job (kind, child_id, idem_key, input, lane, priority, budget_micro_usd, max_attempts, lease_sec,
    not_before_lesson_end, run_after, deadline_at, correlation_id, causation_id)
  values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, coalesce($11::timestamptz, now()), $12, $13, $14)
  on conflict (kind, idem_key) do update set status = 'queued', attempts = 0, run_after = now(), last_error = null,
    cancel_requested = false, finished_at = null
  where job.status in ('dead','cancelled') and excluded.input->>'revive' = 'true'
  returning id`;

export const enqueueParams = (childId, j, correlationId, causationId = null) => [j.kind, childId, j.idemKey, JSON.stringify(j.input ?? {}),
  j.lane, j.priority ?? 2, j.budgetMicroUsd ?? 0, j.maxAttempts ?? 5, j.leaseSec ?? 60, !!j.notBeforeLessonEnd, j.runAfter ?? null,
  j.deadlineAt ?? null, correlationId, causationId];

/** Cancel by (child, kind, idem): queued/retry → cancelled now; running → cancel_requested (checked at every step). */
export const cancelSql = `update job set cancel_requested = true,
    status = case when status in ('queued','retry') then 'cancelled' else status end,
    finished_at = case when status in ('queued','retry') then now() else finished_at end
  where child_id = $1 and kind = $2 and idem_key = $3 and status in ('queued','retry','running') returning id`;

/** Enqueue outside a Conductor commit (library-level work, tests). Child-scoped work should come from decide(). */
export async function enqueueJob(childId, job, { correlationId = "direct", causationId = null } = {}) {
  return (await one(enqueueSql, enqueueParams(childId, job, correlationId, causationId)))?.id ?? null;
}

/**
 * Claim up to `limit` ready jobs on a lane: queued/retry whose run_after passed, or running whose lease expired
 * (the previous worker died). attempts + 1 is the new fencing token. A not_before_lesson_end job waits while its
 * child is in a lesson. `kinds` / `childIds` narrow the claim (tests; a worker serving only some kinds).
 */
export async function claimJobs(lane, { limit = 4, worker = "worker", kinds = null, childIds = null } = {}) {
  return q(`with c as (
      select j.id from job j
       where j.lane = $1
         and ((j.status in ('queued','retry') and j.run_after <= now()) or (j.status = 'running' and j.lease_until < now()))
         and ($4::text[] is null or j.kind = any($4))
         and ($5::uuid[] is null or j.child_id = any($5))
         and (not j.not_before_lesson_end or j.child_id is null
              or not exists (select 1 from conductor_state s where s.child_id = j.child_id and s.mode = 'in_lesson'))
       order by j.priority, j.run_after
       for update of j skip locked limit $2)
    update job j set status = 'running', attempts = j.attempts + 1, worker = $3,
           lease_until = now() + make_interval(secs => j.lease_sec)
      from c where j.id = c.id
    returning j.*`, [lane, limit, worker, kinds, childIds]);
}

/** Extend the lease (every lease_sec/3), fenced by attempt. → { alive, cancelRequested }. */
export async function heartbeat(jobId, attempt) {
  const r = await one(`update job set lease_until = now() + make_interval(secs => lease_sec)
    where id = $1 and attempts = $2 and status = 'running' returning cancel_requested`, [jobId, attempt]);
  return { alive: !!r, cancelRequested: !!r?.cancel_requested };
}

/** Finish an attempt through complete_job (job → workspace → child_seq). false = a zombie attempt or a fenced child. */
export async function completeJob(jobId, attempt, { ok, result = null, error = null, final = false }) {
  const r = await one("select complete_job($1, $2, $3, $4, $5, $6) as ok", [jobId, attempt, ok, result, error ? String(error).slice(0, 500) : null, final]);
  return !!r?.ok;
}

/** Thrown by a handler to stop retrying (→ dead + job.failed{final:true}). */
export class FinalJobError extends Error { constructor(msg) { super(msg); this.final = true; } }

const HANDLERS = new Map();
/** @param {(job: any, ctx: { heartbeat: () => Promise<{alive: boolean, cancelRequested: boolean}> }) => Promise<string|null>} fn  → result_ref */
export function registerHandler(kind, fn) { HANDLERS.set(kind, fn); }
export const handlerFor = (kind) => HANDLERS.get(kind);

/** Run one claimed job to completion (heartbeating while it runs). → the complete_job result. */
export async function runJob(job) {
  const fn = HANDLERS.get(job.kind);
  if (!fn) return completeJob(job.id, job.attempts, { ok: false, error: `no handler for ${job.kind}`, final: true });
  const hbEvery = Math.max(1000, (job.lease_sec * 1000) / 3);
  const timer = setInterval(() => { heartbeat(job.id, job.attempts).catch(() => {}); }, hbEvery);
  try {
    const result = await fn(job, { heartbeat: () => heartbeat(job.id, job.attempts) });
    return await completeJob(job.id, job.attempts, { ok: true, result: result ?? null });
  } catch (e) {
    return await completeJob(job.id, job.attempts, { ok: false, error: e?.message || String(e), final: !!e?.final });
  } finally {
    clearInterval(timer);
  }
}
