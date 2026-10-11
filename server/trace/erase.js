// Release 12 flight recorder: erasure and retention.
// Erasure: the parent corner's DELETE /api/children and DELETE /api/account delete the child / guardian, and trace_event
// rows go with them (029_trace.sql: cid and gid cascade). Their BLOBS cannot cascade, so the handlers ask
// traceBlobRefs() for the refs BEFORE the erasure transaction and eraseTraceBlobs() after it commits.
// Retention (the nightly ops job, server/conductor/ops.mjs --nightly): tier 1 kept 30 days, tier 2 kept 90 days; blobs of
// the expired rows are deleted first, then the rows.
import { deleteTraceBlob } from "./blob.js";

export const RETAIN_DAYS = { 1: 30, 2: 90 };

/** The blob refs of every trace row of this child (or of every child and the guardian itself). */
export async function traceBlobRefs({ childId = null, guardianId = null }) {
  try {
    const { q } = await import("../db.js");
    const rows = await q(`select distinct data->'blob'->>'ref' as ref from trace_event
      where (($1::uuid is not null and (cid = $1::uuid or sid in (select id::text from lesson where child_id = $1::uuid)))
          or ($2::uuid is not null and (gid = $2::uuid or cid in (select id from child where guardian_id = $2::uuid)
            or sid in (select l.id::text from lesson l join child c on c.id = l.child_id where c.guardian_id = $2::uuid))))
        and data ? 'blob'`, [childId, guardianId]);
    return rows.map((r) => r.ref).filter(Boolean);
  } catch (e) {
    if (e?.code === "42P01") return []; // trace_event not migrated yet
    throw e;
  }
}

/** The lesson ids (trace sids) of this child, or of every child of this guardian: read BEFORE the erasure deletes them. */
export async function traceLessonSids({ childId = null, guardianId = null }) {
  const { q } = await import("../db.js");
  const rows = await q(`select l.id::text as sid from lesson l join child c on c.id = l.child_id
    where ($1::uuid is not null and c.id = $1::uuid) or ($2::uuid is not null and c.guardian_id = $2::uuid)`, [childId, guardianId]);
  return rows.map((r) => r.sid);
}
/** After the erasure commits: the rows keyed only by those lessons (no cid / gid on them). Never throws; resolves the count. */
export async function eraseTraceRowsOfLessons(sids) {
  if (!sids?.length) return 0;
  try {
    const { q } = await import("../db.js");
    const r = await q("with gone as (delete from trace_event where sid = any($1::text[]) returning 1) select count(*)::int as n from gone", [sids]);
    return r[0]?.n ?? 0;
  } catch (e) {
    if (e?.code !== "42P01") console.warn("[trace] erase: lesson-keyed rows not deleted:", String(e?.message ?? e).slice(0, 120));
    return 0;
  }
}

/** Delete these blobs; resolves { deleted, failed }. Never throws. */
export async function eraseTraceBlobs(refs) {
  let deleted = 0, failed = 0;
  for (const ref of refs ?? []) {
    try { await deleteTraceBlob(ref); deleted++; } catch { failed++; }
  }
  if (failed) console.warn(`[trace] erase: ${failed} blob(s) not deleted (retry: the nightly retention also sweeps by age)`);
  return { deleted, failed };
}

/**
 * The nightly retention: per tier, blobs of rows older than the window, then the rows. Bounded per run.
 * @returns {Promise<{ rows: number, blobs: number, blobFailures: number }>}
 */
export async function traceRetention({ now = new Date(), limit = 200_000 } = {}) {
  const { q } = await import("../db.js");
  let rows = 0, blobs = 0, blobFailures = 0;
  for (const [tier, days] of Object.entries(RETAIN_DAYS)) {
    const cutoff = new Date(now.getTime() - days * 86_400_000).toISOString();
    const refs = await q(`select data->'blob'->>'ref' as ref from trace_event where tier = $1 and t < $2 and data ? 'blob' limit $3`, [Number(tier), cutoff, limit]);
    const r = await eraseTraceBlobs(refs.map((x) => x.ref).filter(Boolean));
    blobs += r.deleted; blobFailures += r.failed;
    const del = await q(`with gone as (delete from trace_event where id in (select id from trace_event where tier = $1 and t < $2 limit $3) returning 1)
      select count(*)::int as n from gone`, [Number(tier), cutoff, limit]);
    rows += del[0]?.n ?? 0;
  }
  return { rows, blobs, blobFailures };
}
