// The Conductor commit (CONDUCTOR.md §3.4): ONE interactive transaction in the X29 lock order
//   conductor_state (CAS) → job → wakeup → notification → [new rows: day_plan, brief_snapshot, decision_log]
//   → child_seq LAST → conductor_state again (already held).
// Correctness rests on the child_seq row lock plus has_more (orch B2): an ingest in flight holds child_seq, so
// the has_more UPDATE waits and re-reads `last`; an ingest after it waits for COMMIT and then finds the lease
// released (or extended to us when has_more), so no event is ever left unfolded with pending_since cleared.
import { jcs, sha256hex } from "./ids.js";
import { cancelSql, enqueueParams, enqueueSql } from "./jobs.js";
import { withTx } from "./pg.js";
import { STATE_V } from "./config.js";
import { upsertWakeupSql } from "./timers.js";

export class CasFailed extends Error { constructor() { super("conductor_state CAS failed"); this.code = "CAS"; } }

const BUILD_SHA = () => process.env.GIT_SHA || process.env.CONTAINER_APP_REVISION || "dev";

/** The decision_log form of a command: plan bodies live in day_plan, so the log keeps their identity only. */
export const logForm = (c) => (c.kind === "plan.adopt"
  ? { kind: c.kind, day: c.day, version: c.version, source: c.source, inputsHash: c.inputsHash, reason: c.reason, mode: c.plan.mode, plannedMin: c.plan.plannedMin }
  : c);

export const snapshotDigest = (view) => "v1:" + sha256hex(jcs(view)).slice(0, 40);

/**
 * @returns {Promise<{ version: number, hasMore: boolean }>}
 */
export function commit({ childId, token, expected, state, fromSeq, cursor, commands, decisions, view, now, correlationId }) {
  return withTx(async (t) => {
    // 1. CAS on version AND this invocation's lease token; the row stays locked until COMMIT.
    const r = await t.one(`update conductor_state set state = $4, state_v = $5, cursor_seq = $6, mode = $7, learning_day = $8,
          plan_day = $9, plan_version = $10, version = version + 1, updated_at = now()
        where child_id = $1 and version = $2 and lease_token = $3 returning version`,
      [childId, expected, token, JSON.stringify(state), STATE_V, cursor, state.mode, state.learningDay, state.plan?.day ?? null, state.plan?.version ?? null]);
    if (!r) throw new CasFailed();
    const version = Number(r.version);

    // 2. job rows (enqueue, then cancel), sorted so two commits touching shared rows lock them in one order.
    const byKey = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    const enq = commands.filter((c) => c.kind === "enqueue").sort((a, b) => byKey(a.job.kind + a.job.idemKey, b.job.kind + b.job.idemKey));
    for (const c of enq) await t.q(enqueueSql, enqueueParams(childId, c.job, correlationId, `decision:${childId}:${version}`));
    const can = commands.filter((c) => c.kind === "cancel").sort((a, b) => byKey(a.jobKind + a.idemKey, b.jobKind + b.idemKey));
    for (const c of can) await t.q(cancelSql, [childId, c.jobKind, c.idemKey]);

    // 3. wakeups: the last upsert per dedupe wins (a batch may move one row twice).
    const wakes = new Map();
    for (const c of commands) if (c.kind === "wakeup") wakes.set(c.dedupe, c);
    for (const c of [...wakes.values()].sort((a, b) => byKey(a.dedupe, b.dedupe))) await t.q(upsertWakeupSql, [childId, c.dedupe, c.at, c.reason]);

    // 4. notification outbox (only safety/account intents pass the M0 guards; the Notifier is M1).
    for (const c of commands.filter((x) => x.kind === "notify")) {
      // §4.10.3 columns (db/migrations/004_conductor_notification.sql); the window defaults to now → +7 days
      await t.q(`insert into notification (child_id, guardian_id, dedupe, cls, intent, not_before, not_after, correlation_id)
        select $1, c.guardian_id, $2, $3, $4, coalesce($5::timestamptz, now()), coalesce($6::timestamptz, now() + interval '7 days'), $7
          from child c where c.id = $1 on conflict (guardian_id, dedupe) do nothing`,
        [childId, c.dedupe, c.intent.class, JSON.stringify(c.intent), c.notBefore ?? null, c.notAfter ?? null, correlationId]);
    }

    // 5. brand-new rows (wait on nothing): plans, the recorded view, the decision record.
    for (const c of commands.filter((x) => x.kind === "plan.adopt")) {
      const dayPlan = { childId, day: c.day, version: c.version, inputsHash: c.inputsHash, ...c.plan };
      await t.q(`insert into day_plan (child_id, day, version, source, inputs_hash, reason, plan) values ($1, $2, $3, $4, $5, $6, $7)`,
        [childId, c.day, c.version, c.source, c.inputsHash, c.reason, JSON.stringify(dayPlan)]);
    }
    const digest = snapshotDigest(view);
    await t.q("insert into brief_snapshot (child_id, digest, value) values ($1, $2, $3) on conflict do nothing", [childId, digest, JSON.stringify(view)]);
    await t.q(`insert into decision_log (child_id, version, now_used, state_v, build_sha, from_seq, to_seq, brief_digest, arms,
        decisions, commands, correlation_id) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [childId, version, now.toISOString(), STATE_V, BUILD_SHA(), fromSeq, cursor, digest, [], JSON.stringify(decisions),
        JSON.stringify(commands.map(logForm)), correlationId]);

    // 6. LAST lock: child_seq.
    const m = await t.one(`update child_seq set pending_since = case when last > $2 then pending_since else null end
        where child_id = $1 returning (last > $2) as has_more`, [childId, cursor]);
    const hasMore = !!m?.has_more;
    // 7. keep the lease while there is more to fold, else release it (same row, already held).
    await t.q(`update conductor_state set lease_token = case when $3 then lease_token end,
          lease_until = case when $3 then now() + interval '30 seconds' end
        where child_id = $1 and lease_token = $2`, [childId, token, hasMore]);
    return { version, hasMore };
  });
}
