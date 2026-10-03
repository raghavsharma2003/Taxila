// parent_report persistence (db/migrations/010_parent_report.sql). `db` is any { q(text, params) → rows } (the Conductor pool in
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

/** One entry per (cadence, period): after a RENDER_VERSION bump an operator re-render is a new row, and the newest wins. */
export async function listReports(db, childId, limit = 30, { since = null } = {}) {
  return db.q(`select * from (select distinct on (cadence, period) id, cadence, period, render_version, created_at from parent_report
      where child_id = $1 and ($3::timestamptz is null or created_at < $3) order by cadence, period, created_at desc, id desc) r
    order by period desc, cadence desc, created_at desc limit $2`, [childId, limit, since]);
}

/** `before`: only a report stored before this instant (the safety hold hides notes made after it began). */
export async function reportById(db, childId, id, { before = null } = {}) {
  return (await db.q(`select id, child_id, cadence, period, window_from, window_to, render_version, k7, claims, renders, meta, created_at
    from parent_report where id = $1 and child_id = $2 and ($3::timestamptz is null or created_at < $3)`, [id, childId, before]))[0] ?? null;
}
