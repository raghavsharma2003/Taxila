// Delete leftover TEST accounts (BUILD-PLAN W1-D item 6): `@taxila.test` guardians older than 1 h. Every prod test
// deletes its own account in a `finally`; a run killed mid-way (a timeout, a container restart) leaves one behind, and
// those pile up (6 on prod at the audit, 146 on the test branch). Only the `@taxila.test` domain is ever touched: the
// selection is `email like '%@taxila.test'` AND created_at older than the age, re-checked inside each delete.
//
//   node scripts/sweep-test-accounts.mjs [--db test|prod] [--older-than-min 60] [--limit 500] [--apply]
//
// Default is a DRY RUN on the TEST branch (prints what would go). --apply deletes. --db prod needs --apply to do
// anything and prints the count first. Each account goes the way DELETE /api/account sends it (server/routes/account.js):
// one transaction: the safeguarding guard (SAFETY_OPEN_SQL: an open safety matter defers the erasure; such an account is
// skipped and reported, never forced), incident rows detached, `delete from guardian` (cascades every child-keyed
// table, Conductor rows included), the guardian's audit rows, one content-free receipt row.
// Also run nightly by the Conductor ops job (server/conductor/ops.mjs --sweep).
import { loadEnv } from "../infra/azure.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

/**
 * @param {{ url: string, olderThanMin?: number, limit?: number, apply?: boolean, log?: (s: string) => void }} o
 * @returns {Promise<{ found: number, deleted: number, deferred: number, failed: number }>}
 */
export async function sweepTestAccounts({ url, olderThanMin = 60, limit = 500, apply = false, log = console.log }) {
  const { neon } = await import("@neondatabase/serverless");
  const { SAFETY_OPEN_SQL } = await import("../server/routes/account.js");
  const sql = neon(url);
  const age = Math.max(60, Math.floor(olderThanMin * 60));            // never younger than 1 min: a running test owns it
  const rows = await sql.query(`select id, email, created_at from guardian where email like '%@taxila.test'
      and created_at < now() - make_interval(secs => $1) order by created_at limit $2`, [age, limit]);
  const out = { found: rows.length, deleted: 0, deferred: 0, failed: 0 };
  log(`${rows.length} @taxila.test guardian(s) older than ${Math.round(age / 60)} min${apply ? "" : " (dry run: nothing deleted)"}`);
  if (!apply) { for (const r of rows.slice(0, 10)) log(`  would delete ${r.email.replace(/^(.{6}).*(@.*)$/, "$1…$2")} (${new Date(r.created_at).toISOString()})`); return out; }
  for (const g of rows) {
    const receipt = `SWEEP-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    try {
      await sql.transaction((t) => [
        t.query("select id from child where guardian_id = $1 for update", [g.id]),
        t.query(`select 1 / (case when ${SAFETY_OPEN_SQL} then 0 else 1 end) as ok`, [g.id, null]),
        t.query(`update incident set child_id = null, detail = detail || jsonb_build_object('erased', $2::text)
                  where child_id in (select id from child where guardian_id = $1)`, [g.id, receipt]),
        // the selection again, inside the transaction: only a test-domain guardian past the age is ever deleted
        t.query(`with d as (delete from guardian where id = $1 and email like '%@taxila.test' and created_at < now() - make_interval(secs => $2) returning id)
                  select 1 / count(*) as ok from d`, [g.id, age]),
        t.query("delete from audit where guardian_id = $1", [g.id]),
        t.query("insert into audit(guardian_id, action, detail) values ($1, 'account_erase', $2)", [g.id, { receipt, by: "sweep-test-accounts" }]),
      ]);
      out.deleted++;
    } catch (e) {
      if (e?.code === "22012") { out.deferred++; log(`  skipped ${g.id.slice(0, 8)}: safety matter open or no longer eligible`); }
      else { out.failed++; log(`  failed ${g.id.slice(0, 8)}: ${String(e?.message ?? e).slice(0, 160)}`); }
    }
  }
  log(`deleted ${out.deleted}, deferred ${out.deferred}, failed ${out.failed}`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  const db = opt("--db", "test");
  const url = db === "prod" ? process.env.DATABASE_URL : (process.env.CONDUCTOR_TEST_DATABASE_URL || process.env.TEST_DATABASE_URL);
  if (!url) throw new Error(`no database url for --db ${db}`);
  const r = await sweepTestAccounts({ url, olderThanMin: Number(opt("--older-than-min", "60")), limit: Number(opt("--limit", "500")), apply: argv.includes("--apply") });
  process.exitCode = r.failed ? 1 : 0;
}
