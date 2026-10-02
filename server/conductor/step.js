// step(childId): fold a child's unprocessed events through decide() and commit the result (CONDUCTOR.md §3.4).
// The lease (a per-invocation token on conductor_state) is the per-child mutex; the dirty set is
// child_seq.pending_since (X30, no conductor.step job). replay() is a different function with NO write handle
// (X31, I-R9): it reads, folds and compares.
import { randomUUID } from "crypto";
import { STATE_V } from "./config.js";
import { CasFailed, commit, logForm } from "./commit.js";
import { decide, decideOrFailSafe, isAuthority } from "./decide.js";
import { jcs } from "./ids.js";
import { RETRYABLE, one, q, withTx } from "./pg.js";
import { initialState, upgradeState } from "./state.js";
import { PURPOSES } from "./events.js";
import { loadView, recordingView, replayView } from "./view.js";

export class ChildNotFound extends Error {}

/**
 * Fold ONE event: authority events get the fail-safe on poison (§3.6); any other event that throws three times
 * is quarantined: the cursor advances, state is unchanged, and ops is told (console.error → App Insights).
 */
export function foldEvent(state, row, ctx) {
  const ev = row.body;
  if (isAuthority(state, ev)) return decideOrFailSafe(state, ev, ctx);
  let err;
  for (let i = 0; i < 3; i++) {
    try { return decide(state, ev, ctx); } catch (e) { err = e; }
  }
  return { state, commands: [], rulesFired: ["quarantined"], blocked: [], quarantined: String(err?.message || err).slice(0, 200), viewRead: ctx.view.recorded() };
}

/** Create the actor (state row, workspace row, decision_log v0 = the initial state, for replay) if missing. */
export async function ensureActor(childId, { now = new Date() } = {}) {
  const have = await one("select state, state_v from conductor_state where child_id = $1", [childId]);
  if (have) return upgradeState(have.state, have.state_v);
  const c = await one(`select c.id, c.guardian_id, c.class_level, cc.daily_minutes, cc.hours_start, cc.hours_end,
      cr.tz, cr.wake_time, cr.school_start, cr.school_end, cr.recovery_min, cr.bedtime, cr.anchor
    from child c left join child_controls cc on cc.child_id = c.id left join child_routine cr on cr.child_id = c.id
    where c.id = $1`, [childId]);
  if (!c) throw new ChildNotFound(`no child ${childId}`);
  const consentRows = await q(`select distinct on (purpose) purpose, granted from consent
      where guardian_id = $1 and (child_id = $2 or child_id is null) and purpose = any($3) order by purpose, created_at desc`,
    [c.guardian_id, childId, PURPOSES]);
  const state = initialState({
    childId, classLevel: c.class_level, now,
    controls: c.daily_minutes ? { dailyMinutes: c.daily_minutes, hoursStart: c.hours_start, hoursEnd: c.hours_end } : null,
    routine: c.tz ? { tz: c.tz, wakeTime: c.wake_time, schoolStart: c.school_start, schoolEnd: c.school_end, recoveryMin: c.recovery_min, bedtime: c.bedtime, anchor: c.anchor } : null,
    consent: Object.fromEntries(consentRows.map((r) => [r.purpose, r.granted])),
  });
  return withTx(async (t) => {
    const ins = await t.one(`insert into conductor_state (child_id, state_v, state, mode) values ($1, $2, $3, 'free')
      on conflict (child_id) do nothing returning child_id`, [childId, STATE_V, JSON.stringify(state)]);
    if (!ins) return (await t.one("select state from conductor_state where child_id = $1", [childId])).state;   // lost a race: theirs stands
    await t.q("insert into workspace (child_id) values ($1) on conflict do nothing", [childId]);
    await t.q(`insert into decision_log (child_id, version, now_used, state_v, build_sha, from_seq, to_seq, decisions, commands, correlation_id)
      values ($1, 0, $2, $3, $4, 0, 0, $5, $6, $7) on conflict do nothing`,
      [childId, now.toISOString(), STATE_V, process.env.GIT_SHA || process.env.CONTAINER_APP_REVISION || "dev",
        JSON.stringify([{ init: true }]), JSON.stringify([{ kind: "audit", code: "actor_created", state }]), `init:${childId}`]);
    return state;
  });
}

const releaseLease = (childId, token) =>
  q("update conductor_state set lease_token = null, lease_until = null where child_id = $1 and lease_token = $2", [childId, token]).catch(() => {});

/**
 * @param {string} childId
 * @param {{ maxEvents?: number, maxBatches?: number, now?: () => Date }} [o]  `now` is injectable for tests
 * @returns {Promise<{ skipped?: boolean, events: number, batches: number, version?: number, retries: number }>}
 */
export async function step(childId, { maxEvents = 50, maxBatches = 20, now = () => new Date() } = {}) {
  await ensureActor(childId, { now: now() });
  const token = randomUUID();                                   // per invocation, never per worker (orch R2.5)
  let retries = 0;
  for (;;) {
    try {
      return { ...(await stepOnce(childId, token, { maxEvents, maxBatches, now })), retries };
    } catch (e) {
      // CasFailed, 40001 and 40P01 abort the batch with nothing written: re-run from a fresh lease read, ≤ 3 times;
      // after that pending_since stays set and the worker's dirty-set loop picks the child up.
      if ((e instanceof CasFailed || RETRYABLE.has(e?.code)) && retries < 3) { retries++; continue; }
      await releaseLease(childId, token);
      throw e;
    }
  }
}

async function stepOnce(childId, token, { maxEvents, maxBatches, now }) {
  // The lease: free, expired, or already ours (a retry after a rolled-back commit).
  const lease = await one(`update conductor_state set lease_token = $2, lease_until = now() + interval '30 seconds'
      where child_id = $1 and (lease_until is null or lease_until < now() or lease_token = $2)
      returning version, cursor_seq, state_v, state`, [childId, token]);
  if (!lease) return { skipped: true, events: 0, batches: 0 };
  let version = Number(lease.version), cursor = Number(lease.cursor_seq);
  let state = upgradeState(lease.state, lease.state_v);
  let events = 0, batches = 0;
  for (;;) {
    const t = now();                                            // one recorded `now` per batch (decision_log.now_used)
    const rows = await q("select seq, id, type, body, correlation_id from student_event where child_id = $1 and seq > $2 order by seq limit $3",
      [childId, cursor, maxEvents]);
    if (!rows.length) {
      // nothing to fold: release the lease, then clear a stale dirty mark, in the X29 order every writer follows
      // (conductor_state → … → child_seq LAST). An ingest racing this either commits before the child_seq update
      // (last > cursor keeps pending_since) or waits on it and sets pending_since after: never lost.
      await withTx(async (tx) => {
        await tx.q("update conductor_state set lease_token = null, lease_until = null where child_id = $1 and lease_token = $2", [childId, token]);
        await tx.q("update child_seq set pending_since = case when last > $2 then pending_since else null end where child_id = $1", [childId, cursor]);
      });
      return { events, batches, version };
    }
    const view = recordingView(await loadView({ q }, childId, state.tz, t));
    const fromSeq = cursor;
    const commands = [], decisions = [];
    for (const row of rows) {
      const out = foldEvent(state, row, { now: t, view });
      state = out.state; cursor = Number(row.seq);
      commands.push(...out.commands);
      decisions.push({ seq: cursor, type: row.type, rules: out.rulesFired, blocked: out.blocked, ...(out.quarantined ? { quarantined: out.quarantined } : {}) });
      if (out.quarantined) console.error(`[conductor] quarantined ${childId} seq=${cursor} type=${row.type}: ${out.quarantined}`);
    }
    const res = await commit({ childId, token, expected: version, state, fromSeq, cursor, commands, decisions, view: view.recorded(), now: t,
      correlationId: rows[rows.length - 1].correlation_id || `step:${childId}` });
    version = res.version; events += rows.length; batches++;
    if (!res.hasMore) return { events, batches, version };
    if (batches >= maxBatches) { await releaseLease(childId, token); return { events, batches, version, more: true }; }
  }
}

/**
 * Replay (§3.11): fold the log again from decision_log v0 using only recorded inputs (now_used, brief_snapshot)
 * and compare every batch's commands and the final state. Pure: it is handed recorded rows, never a handle
 * (X31, I-R9); replay() below loads those rows in a read-only transaction.
 * @param {{ decisions: any[], events: any[], snapshots: Record<string, any>, current?: any }} rec
 */
export function replayRecorded({ decisions, events, snapshots, current }) {
  const v0 = decisions.find((d) => Number(d.version) === 0);
  if (!v0) throw new Error("replay: no decision_log v0 (initial state)");
  let state = v0.commands[0].state;
  const mismatches = [];
  const bySeq = new Map(events.map((e) => [Number(e.seq), e]));
  for (const d of decisions.filter((x) => Number(x.version) > 0).sort((a, b) => a.version - b.version)) {
    const view = replayView(snapshots[d.brief_digest] || {});
    const ctx = { now: new Date(d.now_used), view };
    const cmds = [];
    for (let s = Number(d.from_seq) + 1; s <= Number(d.to_seq); s++) {
      const row = bySeq.get(s);
      if (!row) continue;                                        // a harmless gap (none expected since the re-check in ingest_event)
      const out = foldEvent(state, row, ctx);
      state = out.state; cmds.push(...out.commands);
    }
    if (jcs(cmds.map(logForm)) !== jcs(d.commands)) mismatches.push({ version: Number(d.version), kind: "commands" });
  }
  if (current && jcs(current) !== jcs(state)) mismatches.push({ version: "final", kind: "state" });
  return { state, mismatches };
}

/**
 * Load a child's replay record, then replay it. The loads run in ONE `begin transaction read only` transaction
 * (Postgres refuses any write in it, 25006), so replay has no write path even by accident (X31, I-R9). Tests pass
 * `reader` (a write-counting shim) to assert it issues zero writes.
 * @param {string} childId
 * @param {{ reader?: { q: (text: string, params?: unknown[]) => Promise<any[]> } }} [o]
 */
export async function replay(childId, { reader } = {}) {
  const load = async (r) => {
    const rows = async (text, params) => r.q(text, params);
    // sequential: one connection, one snapshot
    const decisions = await rows("select version, now_used, from_seq, to_seq, brief_digest, commands from decision_log where child_id = $1 order by version", [childId]);
    const events = await rows("select seq, type, body from student_event where child_id = $1 order by seq", [childId]);
    const snaps = await rows("select digest, value from brief_snapshot where child_id = $1", [childId]);
    const cur = (await rows("select state from conductor_state where child_id = $1", [childId]))[0] ?? null;
    return { decisions, events, snaps, cur };
  };
  const { decisions, events, snaps, cur } = reader ? await load(reader) : await withTx(load, { readOnly: true });
  return replayRecorded({ decisions, events, snapshots: Object.fromEntries(snaps.map((r) => [r.digest, r.value])), current: cur?.state });
}

/** A reader wrapper that counts statements that could write (tests, I-R9). */
export function writeCountingReader(inner) {
  const WRITE = /^\s*(insert|update|delete|merge|truncate|create|alter|drop|grant|lock|copy|call|do)\b|\b(ingest_event|fire_wakeups|complete_job|nextval|setval|pg_advisory\w*)\s*\(|\bfor\s+update\b/i;
  const r = { writes: 0, reads: 0, q: async (text, params) => { if (WRITE.test(text)) r.writes++; else r.reads++; return inner.q(text, params); } };
  return r;
}
