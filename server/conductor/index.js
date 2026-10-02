// The Conductor's integration surface (CONDUCTOR.md §2.4 ingest paths, §3.3). Other code talks to the
// Conductor ONLY by emitting events; it never writes conductor_state, day_plan, job or wakeup rows itself.
//
//   emit(childId, event, opts)      validate → ingest_event (idempotent) → one inline step() attempt
//   ingestStmt(childId, event, o)   the same ingest as a { text, params } statement, to put LAST inside a caller's
//                                   own server/db.js tx([...]) so domain write + event commit together (X29)
//   kick(childId)                   the inline step() after a caller's own tx committed an ingestStmt
//   planToday(childId, opts)        drain due wakeups (piggyback), sync parent facts, record the open, return today's plan
//
// CALL SITES the Conductor depends on (each ingestStmt goes LAST in the writer's own tx, then kick()):
//   lesson start / end            → lesson.started / lesson.ended (Director)
//   account.js setConsent         → consentChangedStmts(childIds, { purpose, granted, consentVersion: <a ulid minted
//                                   for this write> }), one per child (EVERY child of the guardian when child_id is null)
//   parent.js controls save       → settingChangedStmts(childId, { dailyMinutes, hoursStart, hoursEnd, … changed keys },
//                                   settingsVersion: Date.parse(saved.updated_at))
//   account.js createChild        → actorRowStmts(childId) in the child-creation tx (child_seq + workspace rows;
//                                   conductor_state + decision_log v0 are built by ensureActor from those facts)
// Until those are wired, syncParentFacts() (run by every planToday) diffs consent / child_controls / child_routine
// against the folded state and ingests the missing facts with keys derived from the source rows, so a revoked
// consent or a lowered limit can never stay a stale snapshot for longer than one app open.
import { idemKeyFor, PURPOSES, SOURCE_OF, validateEvent } from "./events.js";
import { ulid } from "./ids.js";
import { one, q } from "./pg.js";
import { ensureActor, step } from "./step.js";
import { fireDue } from "./timers.js";
import { learningDay } from "./clock.js";

const INLINE_BUDGET_MS = 10_000;

/** Build the ingest_event call for an event → { text, params, idemKey }. Throws EventInvalid on a bad body. */
export function ingestStmt(childId, event, { idemKey, source, occurredAt, correlationId, causationId = null, traceparent = null } = {}) {
  const body = validateEvent(event);
  const key = idemKey || idemKeyFor(body);
  if (!key) throw new Error(`emit ${body.type}: no natural idempotency key; pass opts.idemKey derived from the fact`);
  const id = ulid();
  return {
    text: "select ingest_event($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) as seq",
    params: [childId, id, body.type, source || SOURCE_OF(body.type), key, occurredAt || new Date().toISOString(),
      correlationId || id, causationId, JSON.stringify(body), traceparent],
    idemKey: key, id,
  };
}

/** One inline step() attempt (≤ 10 s); a miss is fine, the worker's dirty-set loop folds it within seconds. */
export async function kick(childId) {
  let timer;
  try {
    return await Promise.race([step(childId), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("inline step budget")), INLINE_BUDGET_MS); })]);
  } catch (e) {
    console.warn(`[conductor] inline step ${childId}: ${e.message}`);
    return null;
  } finally { clearTimeout(timer); }
}

/**
 * @param {string} childId  the authenticated child (never from a request body)
 * @param {{ type: string } & Record<string, unknown>} event
 * @param {{ idemKey?: string, source?: string, occurredAt?: string, correlationId?: string, causationId?: string,
 *   step?: 'await' | 'background' | false }} [opts]  default 'background' (do not add latency to the caller)
 * @returns {Promise<{ seq: number | null, duplicate: boolean, idemKey: string, id: string, stepped?: unknown }>}
 */
export async function emit(childId, event, opts = {}) {
  const st = ingestStmt(childId, event, opts);
  const r = await one(st.text, st.params);
  const seq = r?.seq == null ? null : Number(r.seq);
  const out = { seq, duplicate: seq === null, idemKey: st.idemKey, id: st.id };
  const mode = opts.step === undefined ? "background" : opts.step;
  if (mode === "await") out.stepped = await kick(childId);
  else if (mode === "background") kick(childId);
  return out;
}

/** parent.consent_changed for one consent write, one statement per affected child (put LAST in the writer's tx). */
export function consentChangedStmts(childIds, { purpose, granted, consentVersion }) {
  return childIds.map((id) => ingestStmt(id, { type: "parent.consent_changed", purpose, granted: !!granted, consentVersion }));
}

/** parent.setting_changed per changed key of one controls/routine save. `changes`: { key: value } (SETTING_KEYS). */
export function settingChangedStmts(childId, changes, settingsVersion) {
  return Object.entries(changes).map(([key, value]) => ingestStmt(childId, { type: "parent.setting_changed", key, value, by: "owner", settingsVersion }));
}

/** The actor's always-present rows, for the child-creation tx (§10.1 item 2). Idempotent. */
export const actorRowStmts = (childId) => [
  { text: "insert into child_seq (child_id) values ($1) on conflict do nothing", params: [childId] },
  { text: "insert into workspace (child_id) values ($1) on conflict do nothing", params: [childId] },
];

const CONTROL_COLS = [["dailyMinutes", "daily_minutes"], ["hoursStart", "hours_start"], ["hoursEnd", "hours_end"]];
const ROUTINE_COLS = [["tz", "tz"], ["wakeTime", "wake_time"], ["schoolStart", "school_start"], ["schoolEnd", "school_end"], ["bedtime", "bedtime"]];
const stateValue = (st, key) => ({ dailyMinutes: st.limits.dailyMinutes, hoursStart: st.limits.allowedFrom, hoursEnd: st.limits.allowedTo,
  tz: st.tz, wakeTime: st.routine.wakeTime, schoolStart: st.routine.schoolStart, schoolEnd: st.routine.schoolEnd, bedtime: st.routine.bedtime })[key];

/**
 * Bring the actor in line with the parent-owned sources of truth (consent, child_controls, child_routine): every
 * value that differs from the folded state is ingested as the event its writer should have emitted, keyed by the
 * source row (consent row id; the row's updated_at), so a re-run, or a writer that DID emit, is a duplicate no-op.
 * A value the event schema refuses (out of range) is logged and skipped, never clamped.
 * @returns {Promise<number>} events ingested
 */
export async function syncParentFacts(childId) {
  const cs = await one("select state from conductor_state where child_id = $1", [childId]);
  if (!cs) return 0;
  const st = cs.state;
  const c = await one(`select c.guardian_id, cc.daily_minutes, cc.hours_start, cc.hours_end,
      floor(extract(epoch from cc.updated_at) * 1000)::bigint as cc_v, cr.tz, cr.wake_time, cr.school_start, cr.school_end, cr.bedtime,
      floor(extract(epoch from cr.updated_at) * 1000)::bigint as cr_v
    from child c left join child_controls cc on cc.child_id = c.id left join child_routine cr on cr.child_id = c.id where c.id = $1`, [childId]);
  if (!c) return 0;
  const consent = await q(`select distinct on (purpose) id, purpose, granted from consent
      where guardian_id = $1 and (child_id = $2 or child_id is null) and purpose = any($3) order by purpose, created_at desc, id desc`,
    [c.guardian_id, childId, PURPOSES]);
  const evs = [];
  for (const r of consent) {
    if (!!st.consent?.[r.purpose] !== !!r.granted) evs.push({ type: "parent.consent_changed", purpose: r.purpose, granted: !!r.granted, consentVersion: `c${r.id}` });
  }
  for (const [cols, v] of [[CONTROL_COLS, c.cc_v], [ROUTINE_COLS, c.cr_v]]) {
    if (v == null) continue;
    for (const [key, col] of cols) {
      if (c[col] == null || c[col] === stateValue(st, key)) continue;
      evs.push({ type: "parent.setting_changed", key, value: c[col], by: "owner", settingsVersion: Number(v) });
    }
  }
  let n = 0;
  for (const e of evs) {
    try { if (!(await emit(childId, e, { step: false })).duplicate) n++; }
    catch (err) { console.warn(`[conductor] syncParentFacts ${childId.slice(0, 8)} ${e.type}${e.key ? ":" + e.key : ""}: ${err.message}`); }
  }
  return n;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PLAN_WAIT_MS = 2_000, PLAN_POLL_MS = 200;

/**
 * Today's plan for a child, built if missing. Runs the child's due wakeups first (piggyback, §3.9), syncs the
 * parent-owned facts, records the open as app.opened (once per replica boot), folds it inline, and reads the
 * adopted day_plan. When the inline fold was skipped (another invocation, e.g. the worker's dirty loop, holds the
 * lease) or failed, it polls day_plan for up to 2 s for that holder's commit.
 * @param {{ device?: 'web' | 'android', replicaId?: string, bootId?: string, now?: Date }} [o]
 * @returns {Promise<{ day: string, version: number, mode: string, plan: any } | null>}  null = no plan YET:
 *   the caller retries shortly or shows its cached plan; it never means "no plan today".
 */
export async function planToday(childId, { device = "web", replicaId = "server", bootId, now = new Date() } = {}) {
  const state = await ensureActor(childId, { now });
  const day = learningDay(now, state.tz);
  await fireDue({ limit: 50, only: [childId], maxBatches: 2 });
  await syncParentFacts(childId).catch((e) => console.warn(`[conductor] syncParentFacts ${childId.slice(0, 8)}: ${e.message}`));
  await emit(childId, { type: "app.opened", device, replicaId, bootId: bootId || `d${day}` }, { step: false });
  const stepped = await kick(childId);
  const read = () => one("select version, plan from day_plan where child_id = $1 and day = $2 order by version desc limit 1", [childId, day]);
  let row = await read();
  if (!row && (!stepped || stepped.skipped || stepped.more)) {
    for (let waited = 0; !row && waited < PLAN_WAIT_MS; waited += PLAN_POLL_MS) { await sleep(PLAN_POLL_MS); row = await read(); }
  }
  return row ? { day, version: row.version, mode: row.plan.mode, plan: row.plan } : null;
}

export { step, replay, ensureActor, writeCountingReader } from "./step.js";
export { fireDue } from "./timers.js";
export { enqueueJob, claimJobs, completeJob, heartbeat, runJob, registerHandler, sweepPoison, FinalJobError } from "./jobs.js";
export { decide } from "./decide.js";
export { EventInvalid, EVENT_TYPES } from "./events.js";
export { configure, closePool, directUrl } from "./pg.js";
