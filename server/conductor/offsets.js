// Test-clock offsets for the Conductor's background work (W1-D item 4, on W1-C's test clock).
//
// A @taxila.test guardian may run its own clock ahead (server/comprehension/testclock.js; the offset lives in
// test_clock, 012_pending_grade.sql). Requests of that session already run on the shifted clock; the worker does not
// run inside a request, so without this a test child's job would be claimed on the REAL clock (its report.daily, due
// "04:10 tomorrow" in shifted time, would wait a real day) and its step() would fold with a real `now` that runs
// BEHIND the events it already folded. Here the worker reads every live offset (one small query per loop pass, cached
// 5 s), claims a test child's job against now() + offset, and runs that child's step() and job handler inside
// runWithOffset. Every real child has no row: offset 0, the real clock, the exact pre-W1 SQL.
//
// NOT covered, by design (W1-D fixer review): WAKEUPS. fire_wakeups (004 SQL, `due_at <= now()`) runs on the REAL
// clock for everyone, so a test child's 04:10 night fold / day_start wakeup does not fire when its shifted clock
// passes 04:10. A test-clock day advances by EVENTS and READS instead: the next shifted-day event (a lesson, an
// app.opened) or the parent reports read folds the night and writes report.daily (w1d-conductor folds it with a
// next-day lesson). The real-clock timer path is exercised by real children and watched by the canary
// (wakeups_late). An offset-aware fire_wakeups is the fix if a test ever needs the timer itself.
import { runWithOffset } from "../comprehension/testclock.js";

const TTL_MS = 5_000;
let cache = { at: 0, map: new Map(), table: null };

/** Is test_clock present (012 applied)? Checked once per process; a missing table means "no offsets", never an error. */
export async function hasTestClock(q) {
  if (cache.table === null) {
    cache.table = await q("select to_regclass('public.test_clock') is not null as ok").then((r) => !!r[0]?.ok, () => false);
  }
  return cache.table;
}

/** childId → offsetMs for every child whose guardian holds a positive offset. */
export async function childOffsets(q, { now = Date.now() } = {}) {
  if (now - cache.at < TTL_MS) return cache.map;
  if (!(await hasTestClock(q))) { cache.at = now; return cache.map; }
  try {
    const rows = await q("select c.id as child_id, t.offset_ms from test_clock t join child c on c.guardian_id = t.guardian_id where t.offset_ms > 0");
    cache = { ...cache, at: now, map: new Map(rows.map((r) => [r.child_id, Number(r.offset_ms)])) };
  } catch (e) {
    cache.at = now;
    console.warn("[conductor] test-clock offsets unavailable:", String(e?.message ?? e).slice(0, 160));
  }
  return cache.map;
}

/** Run fn on a child's clock (its guardian's offset; the real clock for every real child). */
export async function onChildClock(q, childId, fn) {
  const off = childId ? (await childOffsets(q)).get(childId) || 0 : 0;
  return off ? runWithOffset(off, fn) : fn();
}

/**
 * SQL for "this job's run_after has passed on its child's clock", for claimJobs. `alias` is the job row's alias.
 * Without test_clock it is the original `run_after <= now()`.
 */
export const dueSql = (alias, withClock) => withClock
  ? `${alias}.run_after <= now() + coalesce((select make_interval(secs => t.offset_ms / 1000.0) from test_clock t
       join child tc on tc.guardian_id = t.guardian_id where tc.id = ${alias}.child_id), interval '0')`
  : `${alias}.run_after <= now()`;

/** Tests: forget the cache. */
export function _resetOffsets() { cache = { at: 0, map: new Map(), table: null }; }
