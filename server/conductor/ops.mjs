// The Conductor's scheduled detectors (CONDUCTOR.md §8.1, decision conductor-hosting-lanes: "ACA scheduled jobs run the
// canary and the nightly rollups/census, so the detectors outlive the worker"). BUILD-PLAN W1-D item 4.
// Runs as ACA jobs on the worker image (scripts/deploy-worker.mjs --jobs), never inside taxila-worker itself:
//   node server/conductor/ops.mjs --canary    every 15 min: is the background host doing its job? exit 1 if not
//   node server/conductor/ops.mjs --nightly   once a day (22:40 UTC = 04:10 IST): the day's rollup + the test sweep
// Each run writes ONE JSON line (kind "conductor_canary" / "conductor_rollup") that Log Analytics keeps; a failed
// canary also fails its job execution, which the "failed job executions" alert emails (infra/eyes.mjs).
// Read-only except --nightly's sweep of @taxila.test accounts older than 1 h (./sweep.js: inside server/, because the
// job runs on the worker image, which has no scripts/ or infra/; an import from there failed every night).
import { configure, closePool, directUrl, q } from "./pg.js";
import { dbUrl } from "../db.js";
import { sweepTestAccounts } from "./sweep.js";

/** Canary thresholds [U: design defaults; the worker polls 1-5 s and fires wakeups every 15 s]. */
export const CANARY = { dirtyStaleMin: 5, wakeupLateMin: 15, jobLateMin: 30, deadJobsDay: 10 };

/** → { ok, checks: {name: {n, ok}} } from four read-only counts. Exported for tests (pass a fake q). */
export async function canary(query = q) {
  const [dirty] = await query(`select count(*)::int n from child_seq where pending_since < now() - make_interval(mins => $1)`, [CANARY.dirtyStaleMin]);
  const [wake] = await query(`select count(*)::int n from wakeup where fired_at is null and due_at < now() - make_interval(mins => $1)`, [CANARY.wakeupLateMin]);
  // a job of a test child whose clock runs ahead is due on ITS clock (offsets.js): only real-clock lateness counts here
  const [late] = await query(`select count(*)::int n from job where status in ('queued','retry') and run_after < now() - make_interval(mins => $1)
      and not exists (select 1 from workspace w where w.child_id = job.child_id and w.state = 'erasing')`, [CANARY.jobLateMin]);
  const [dead] = await query(`select count(*)::int n from job where status = 'dead' and finished_at > now() - interval '1 day'`);
  const checks = {
    dirty_stale: { n: dirty.n, ok: dirty.n === 0 },
    wakeups_late: { n: wake.n, ok: wake.n === 0 },
    jobs_late: { n: late.n, ok: late.n === 0 },
    jobs_dead_24h: { n: dead.n, ok: dead.n <= CANARY.deadJobsDay },
  };
  return { ok: Object.values(checks).every((c) => c.ok), checks };
}

/** The last 24 h in numbers (no child ids, no content): the census a human reads when a parent asks "did it run?". */
export async function rollup(query = q) {
  const one = async (text) => (await query(text))[0] ?? {};
  const events = await query(`select type, count(*)::int n from student_event where received_at > now() - interval '1 day' group by type order by type`);
  const jobs = await query(`select kind, status, count(*)::int n from job where coalesce(finished_at, created_at) > now() - interval '1 day' group by kind, status order by kind, status`);
  const modes = await query(`select mode, count(*)::int n from conductor_state group by mode order by mode`);
  const reports = await one(`select count(*) filter (where cadence = 'daily')::int daily, count(*) filter (where cadence = 'weekly')::int weekly
      from parent_report where created_at > now() - interval '1 day'`).catch(() => ({}));
  const lessons = await one(`select count(*)::int started, count(*) filter (where ended_at is not null)::int ended from lesson where started_at > now() - interval '1 day'`);
  const plans = await one(`select count(*)::int n from day_plan where adopted_at > now() - interval '1 day'`).catch(() => ({}));
  return { events: Object.fromEntries(events.map((r) => [r.type, r.n])), jobs: jobs.map((r) => `${r.kind}:${r.status}=${r.n}`), modes: Object.fromEntries(modes.map((r) => [r.mode, r.n])),
    reports, lessons, dayPlans: plans.n ?? null };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = dbUrl(process.env, { direct: true });
  if (!raw) { console.error("[ops] DATABASE_URL not set"); process.exit(1); }
  await configure({ url: directUrl(raw), max: 2, statementTimeoutMs: 15_000 });
  const line = (o) => process.stdout.write(JSON.stringify({ at: new Date().toISOString(), rev: process.env.GIT_SHA || null, ...o }) + "\n");
  let code = 0;
  try {
    if (process.argv.includes("--canary")) {
      const r = await canary();
      line({ kind: "conductor_canary", ...r });
      if (!r.ok) { console.error(`[ops] CANARY FAILED: ${Object.entries(r.checks).filter(([, c]) => !c.ok).map(([k, c]) => `${k}=${c.n}`).join(" ")}`); code = 1; }
    }
    if (process.argv.includes("--nightly")) {
      line({ kind: "conductor_rollup", ...(await rollup()) });
      const s = await sweepTestAccounts({ url: raw, olderThanMin: 60, limit: 500, apply: true, log: () => {} });
      line({ kind: "test_account_sweep", ...s });
      if (s.failed) code = 1;
    }
  } catch (e) {
    console.error(`[ops] failed: ${e?.message ?? e}`);
    code = 1;
  } finally {
    await closePool();
  }
  process.exit(code);
}
