// The home-grown job queue on Neon (CONDUCTOR.md §3.8, X6). Enqueue happens inside the Conductor commit
// (commit.js uses enqueueSql); the worker claims with FOR UPDATE SKIP LOCKED, fences every write by
// `attempts`, and finishes through complete_job(), which ingests job.done / job.failed atomically.
import { JOB_KINDS } from "./config.js";
import { consentGrantedSql } from "./consent.js";
import { one, q, withTx } from "./pg.js";

/**
 * What job.failed carries into the append-only log: a CODE, never exception text (§2.3: events carry no free
 * text; a Postgres or handler message can echo a child's words). The raw text goes only to job.last_error,
 * which is mutable and erased with the child.
 */
export const JOB_ERROR_CODES = ["handler_error", "timeout", "final", "no_handler", "poison", "consent", "erasing"];
export function jobErrorCode(e) {
  if (e?.jobCode && JOB_ERROR_CODES.includes(e.jobCode)) return e.jobCode;
  if (e?.code === "57014" || /\btime(d ?out|out)\b/i.test(String(e?.message || ""))) return "timeout";
  if (e?.final) return "final";
  return "handler_error";
}

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
 * (the previous worker died) with attempts left. attempts + 1 is the new fencing token. A not_before_lesson_end job waits while its
 * child is in a lesson. `kinds` / `childIds` narrow the claim (tests; a worker serving only some kinds).
 */
export async function claimJobs(lane, { limit = 4, worker = "worker", kinds = null, childIds = null } = {}) {
  await sweepCancelled(lane, { kinds, childIds });
  await sweepPoison(lane, { kinds, childIds });
  // Never re-claimed: a dead worker's job that was asked to cancel (sweepCancelled finalises it), and any job of
  // a child being erased (ws SW6; complete_job would fence it anyway, but the handler must not even run).
  return q(`with c as (
      select j.id from job j
       where j.lane = $1
         and ((j.status in ('queued','retry') and j.run_after <= now())
              or (j.status = 'running' and j.lease_until < now() and j.attempts < j.max_attempts and not j.cancel_requested))
         and (j.child_id is null or not exists (select 1 from workspace w where w.child_id = j.child_id and w.state = 'erasing'))
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

/**
 * A running job whose worker died after a cancel was requested (consent revoked, safety hold) is finalised as
 * cancelled, never re-run: one extra run would be revoked-purpose work. One statement over job rows only (no
 * child_seq, X29), and no event: decide() already dropped it from pending.jobs when it asked for the cancel.
 * @returns {Promise<number>}
 */
export async function sweepCancelled(lane, { kinds = null, childIds = null } = {}) {
  const r = await q(`update job set status = 'cancelled', finished_at = now(), lease_until = null
      where lane = $1 and status = 'running' and lease_until < now() and cancel_requested
        and ($2::text[] is null or kind = any($2)) and ($3::uuid[] is null or child_id = any($3)) returning id`, [lane, kinds, childIds]);
  return r.length;
}

/**
 * A running job whose lease expired on its LAST attempt killed its worker (OOM, segfault: complete_job never ran).
 * It is never re-claimed (a poison job would loop across restarts forever): complete_job(final) marks it dead and
 * ingests job.failed{final} atomically, exactly like a handler's final failure. One row per statement, so this is
 * never a multi-child_seq writer (X29: fire_wakeups stays the only one).
 * @returns {Promise<number>} jobs declared dead
 */
export async function sweepPoison(lane, { kinds = null, childIds = null, max = 20 } = {}) {
  let n = 0;
  for (; n < max; n++) {
    const r = await one(`select complete_job(j.id, j.attempts, false, null, 'poison', true) as ok
        from (select id, attempts from job
               where lane = $1 and status = 'running' and lease_until < now() and attempts >= max_attempts and not cancel_requested
                 and ($2::text[] is null or kind = any($2)) and ($3::uuid[] is null or child_id = any($3))
               order by id for update skip locked limit 1) j`, [lane, kinds, childIds]);
    if (!r) break;
    console.error(`[conductor] poison job declared dead on lane ${lane}`);
  }
  return n;
}

/** Extend the lease (every lease_sec/3), fenced by attempt. → { alive, cancelRequested }. */
export async function heartbeat(jobId, attempt) {
  const r = await one(`update job set lease_until = now() + make_interval(secs => lease_sec)
    where id = $1 and attempts = $2 and status = 'running' returning cancel_requested`, [jobId, attempt]);
  return { alive: !!r, cancelRequested: !!r?.cancel_requested };
}

/** Finish an attempt through complete_job (job → workspace → child_seq). false = a zombie attempt or a fenced child. */
export async function completeJob(jobId, attempt, { ok, result = null, error = null, code = null, final = false }) {
  if (ok) return !!(await one("select complete_job($1, $2, true, $3, null, $4) as ok", [jobId, attempt, result, final]))?.ok;
  // complete_job copies p_error into the job.failed body: hand it the code only, then put the raw text in
  // last_error in the same transaction (the job row is already locked by complete_job; X29 order unchanged).
  const c = JOB_ERROR_CODES.includes(code) ? code : "handler_error";
  return withTx(async (t) => {
    const r = await t.one("select complete_job($1, $2, false, $3, $4, $5) as ok", [jobId, attempt, result, c, final]);
    if (r?.ok && error) await t.q("update job set last_error = $3 where id = $1 and attempts = $2", [jobId, attempt, `${c}: ${String(error).slice(0, 500)}`]);
    return !!r?.ok;
  });
}

/** Mark a claimed attempt cancel_requested and finish it (→ cancelled, no event). Fenced by attempt. */
async function cancelClaimed(job, why) {
  await q("update job set cancel_requested = true where id = $1 and attempts = $2 and status = 'running'", [job.id, job.attempts]);
  return completeJob(job.id, job.attempts, { ok: false, code: why, error: why });
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
  if (!fn) return completeJob(job.id, job.attempts, { ok: false, code: "no_handler", error: `no handler for ${job.kind}`, final: true });
  // §8.2: the job's consent purpose is re-checked at claim, for EVERY kind (not left to each handler)
  const purpose = JOB_KINDS[job.kind]?.purpose;
  if (purpose && job.child_id) {
    const g = await one(`select ${consentGrantedSql("j", "$2")} as ok from job j where j.id = $1`, [job.id, purpose]);
    if (!g?.ok) return cancelClaimed(job, "consent");
  }
  const hbEvery = Math.max(1000, (job.lease_sec * 1000) / 3);
  const timer = setInterval(() => { heartbeat(job.id, job.attempts).catch(() => {}); }, hbEvery);
  try {
    const result = await fn(job, { heartbeat: () => heartbeat(job.id, job.attempts) });
    return await completeJob(job.id, job.attempts, { ok: true, result: result ?? null });
  } catch (e) {
    return await completeJob(job.id, job.attempts, { ok: false, code: jobErrorCode(e), error: e?.message || String(e), final: !!e?.final });
  } finally {
    clearInterval(timer);
  }
}
