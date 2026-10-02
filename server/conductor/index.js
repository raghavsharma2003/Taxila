// The Conductor's integration surface (CONDUCTOR.md §2.4 ingest paths, §3.3). Other code talks to the
// Conductor ONLY by emitting events; it never writes conductor_state, day_plan, job or wakeup rows itself.
//
//   emit(childId, event, opts)      validate → ingest_event (idempotent) → one inline step() attempt
//   ingestStmt(childId, event, o)   the same ingest as a { text, params } statement, to put LAST inside a caller's
//                                   own server/db.js tx([...]) so domain write + event commit together (X29)
//   kick(childId)                   the inline step() after a caller's own tx committed an ingestStmt
//   planToday(childId, opts)        drain due wakeups (piggyback), record the open, return today's plan
import { idemKeyFor, SOURCE_OF, validateEvent } from "./events.js";
import { ulid } from "./ids.js";
import { one } from "./pg.js";
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

/**
 * Today's plan for a child, built if missing. Runs the child's due wakeups first (piggyback, §3.9), records the
 * open as app.opened (once per replica boot), folds it inline, and reads the adopted day_plan.
 * @param {{ device?: 'web' | 'android', replicaId?: string, bootId?: string, now?: Date }} [o]
 * @returns {Promise<{ day: string, version: number, mode: string, plan: any } | null>}
 */
export async function planToday(childId, { device = "web", replicaId = "server", bootId, now = new Date() } = {}) {
  const state = await ensureActor(childId, { now });
  const day = learningDay(now, state.tz);
  await fireDue({ limit: 50, only: [childId], maxBatches: 2 });
  await emit(childId, { type: "app.opened", device, replicaId, bootId: bootId || `d${day}` }, { step: false });
  await kick(childId);
  const row = await one("select version, plan from day_plan where child_id = $1 and day = $2 order by version desc limit 1", [childId, day]);
  return row ? { day, version: row.version, mode: row.plan.mode, plan: row.plan } : null;
}

export { step, replay, ensureActor } from "./step.js";
export { fireDue } from "./timers.js";
export { enqueueJob, claimJobs, completeJob, heartbeat, runJob, registerHandler, FinalJobError } from "./jobs.js";
export { decide } from "./decide.js";
export { EventInvalid, EVENT_TYPES } from "./events.js";
export { configure, closePool, directUrl } from "./pg.js";
