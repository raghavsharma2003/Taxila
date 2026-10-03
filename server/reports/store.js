// parent_report persistence (sql/009_parent_report.sql). `db` is any { q(text, params) → rows } (the Conductor pool in
// the worker, server/db.js in the web app, a fake in tests).
import { RENDER_VERSION } from "./config.js";

export async function findReport(db, childId, cadence, period, renderVersion = RENDER_VERSION) {
  return (await db.q(`select id, child_id, cadence, period, window_from, window_to, render_version, k7, claims, renders, meta, facts_digest, created_at
      from parent_report where child_id = $1 and cadence = $2 and period = $3 and render_version = $4`, [childId, cadence, period, renderVersion]))[0] ?? null;
}

/** Insert once; a second writer of the same key gets the first row's id (the job's idempotency, X8). */
export async function saveReport(db, r) {
  const ins = await db.q(`insert into parent_report (child_id, cadence, period, window_from, window_to, render_version, k7, claims, renders, meta, facts_digest)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (child_id, cadence, period, render_version) do nothing returning id`,
  [r.childId, r.cadence, r.period, r.window.from, r.window.to, r.renderVersion, r.k7, JSON.stringify(r.claims), JSON.stringify(r.renders), JSON.stringify(r.meta), r.factsDigest]);
  if (ins[0]) return { id: String(ins[0].id), created: true };
  const have = await findReport(db, r.childId, r.cadence, r.period, r.renderVersion);
  return { id: String(have.id), created: false };
}

export async function listReports(db, childId, limit = 30) {
  return db.q(`select id, cadence, period, render_version, created_at from parent_report where child_id = $1
    order by period desc, cadence desc, created_at desc limit $2`, [childId, limit]);
}

export async function reportById(db, childId, id) {
  return (await db.q(`select id, child_id, cadence, period, window_from, window_to, render_version, k7, claims, renders, meta, created_at
    from parent_report where id = $1 and child_id = $2`, [id, childId]))[0] ?? null;
}
