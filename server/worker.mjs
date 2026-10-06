// taxila-worker: the Conductor's background host (CONDUCTOR.md §8.1, X1, X30, X35). A separate Azure Container
// App (min 1, no ingress) on the DIRECT (unpooled) Neon URL, same code as taxila-web. Three loops:
//   ticker      leader only (session pg_try_advisory_lock on a dedicated connection): fire_wakeups(500) every 15 s
//   dirty set   every replica: children with child_seq.pending_since older than 2 s → step(), ≤ 8 at a time;
//               the lease is the mutex, so two replicas never fold one child twice
//   job lanes   fast + slow: claim (SKIP LOCKED) → handler → complete_job (attempt-fenced)
// Loops poll 1 s while they find work and back off to 5 s when idle; NOTIFY is never a correctness path.
// Shutdown (SIGTERM; ACA SIGKILLs 30 s later): stop claiming, release the ticker lock, let in-flight work
// finish for ≤ 25 s, exit. Anything still running is recovered by lease expiry.
//
// Usage: node server/worker.mjs            (production: env from the Container App)
//        node --env-file=.env.local server/worker.mjs --once   (local: one pass of every loop, then exit)
import { createServer } from "http";
import { hostname } from "os";
import { configure, directUrl, q, sessionClient, closePool } from "./conductor/pg.js";
import { dbUrl } from "./db.js";
import { step } from "./conductor/step.js";
import { fireDue } from "./conductor/timers.js";
import { claimJobs, runJob } from "./conductor/jobs.js";
import { stepBackoff } from "./conductor/backoff.js";
import { unappliedMigrations } from "./conductor/migrations.js";
import { onChildClock } from "./conductor/offsets.js";
import "./conductor/handlers.js";
// ship5 p3-voicesig: the consent backstop for stored answering-pace rows (server/voicesig/lesson.js sweep).
import { sweep as voicesigSweep } from "./voicesig/lesson.js";

const ONCE = process.argv.includes("--once");
const ID = `${process.env.CONTAINER_APP_REPLICA_NAME || hostname()}:${process.pid}`;
const TICK_MS = 15_000, POLL_BUSY = 1_000, POLL_IDLE = 5_000, DIRTY_GRACE_S = 2, STEP_CONC = 8, SHUTDOWN_MS = 25_000;
const LANES = { fast: 4, slow: 2 };                    // concurrent jobs per lane per replica [U]
const TICKER_KEY = "taxila:ticker";
const STATEMENT_TIMEOUT_MS = Number(process.env.CONDUCTOR_STATEMENT_TIMEOUT_MS || 15_000);
const LOCK_CHECK_MS = 60_000;                          // a leader re-confirms it still holds the advisory lock
// Watchdog: a loop that has not completed an iteration in this long is wedged (a hung query, a dead socket).
// The process exits and ACA restarts it; the /healthz liveness probe reports the same thing first.
const STALL_MS = { ticker: 6 * TICK_MS, dirty: 180_000, fast: 120_000, slow: 120_000 };
const HEALTH_PORT = Number(process.env.WORKER_HEALTH_PORT || 8081);

const raw = dbUrl(process.env, { direct: true });   // TAXILA_DB=test → the test branch (server/db.js)
if (!raw) { console.error("[worker] DATABASE_URL not set"); process.exit(1); }
const URL_ = directUrl(raw);                            // never the pooler: it drops session advisory locks
// statement_timeout on every pool connection and the session client: one hung query can never block a loop forever
await configure({ url: URL_, max: Number(process.env.CONDUCTOR_POOL_MAX || 12), statementTimeoutMs: STATEMENT_TIMEOUT_MS });
// A schema older than this code would make every commit that touches a missing column fail non-retryably and
// wedge children one by one; refuse to run instead (ACA restarts it; the log line says which file to apply).
{
  const missing = await unappliedMigrations((text) => q(text));
  if (missing.length) {
    console.error(`[worker] REFUSING TO START: migrations not applied: ${missing.join(", ")} (node scripts/migrate.mjs)`);
    await closePool();
    process.exit(1);
  }
}

const log = (msg, extra = {}) => console.log(JSON.stringify({ at: new Date().toISOString(), worker: ID, msg, ...extra }));
let stopping = false;
const inflight = new Set();
// the bookkeeping branch must swallow: p.finally() returns a NEW promise that re-rejects, and an unhandled rejection
// kills the process (seen: a child erased between the dirty scan and its step crashed the whole worker). Callers still
// get `p` and handle its rejection themselves.
const track = (p) => { inflight.add(p); p.finally(() => inflight.delete(p)).catch(() => {}); return p; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────────── liveness ─────────────
const lastOk = { ticker: Date.now(), dirty: Date.now(), fast: Date.now(), slow: Date.now() };
const beat = (loop) => { lastOk[loop] = Date.now(); };
const stalled = () => Object.entries(STALL_MS).filter(([k, ms]) => Date.now() - lastOk[k] > ms).map(([k]) => k);

// ───────────── ticker (leader) ─────────────
// The session client gets its listeners ONCE, when it is created ('error' AND 'end': a session that dies quietly
// must also drop leadership). A leader re-confirms the lock every LOCK_CHECK_MS against pg_locks.
let leaderConn = null, leader = false, lockCheckedAt = 0;
function dropLeader(why, extra = {}) {
  if (leader) log("ticker leadership lost", { why, ...extra });
  const c = leaderConn;
  leader = false; leaderConn = null;
  if (c) c.end?.().catch?.(() => {});
}
async function newSession() {
  const c = await sessionClient(URL_);
  c.on?.("error", (e) => { if (leaderConn === c) dropLeader("connection error", { error: e.message }); });
  c.on?.("end", () => { if (leaderConn === c) dropLeader("connection ended"); });
  await c.query(`set statement_timeout = ${Math.floor(STATEMENT_TIMEOUT_MS)}`);
  return c;
}
async function ensureLeader() {
  try {
    if (leader && leaderConn) {
      if (Date.now() - lockCheckedAt < LOCK_CHECK_MS) return true;
      const r = await leaderConn.query(`select 1 from pg_locks where locktype = 'advisory' and pid = pg_backend_pid()
          and objsubid = 1 and objid = (hashtext($1)::bigint & 4294967295)::oid and granted`, [TICKER_KEY]);
      lockCheckedAt = Date.now();
      if (r.rows.length) return true;
      dropLeader("advisory lock not held");
      return false;
    }
    leaderConn = leaderConn || (await newSession());
    const r = await leaderConn.query("select pg_try_advisory_lock(hashtext($1)) as ok", [TICKER_KEY]);
    leader = !!r.rows[0]?.ok; lockCheckedAt = Date.now();
    if (leader) log("ticker leader");
    return leader;
  } catch (e) {
    log("leader election failed", { error: e.message });
    dropLeader("election error", { error: e.message });
    return false;
  }
}
const VS_SWEEP_MS = 6 * 3600_000;
let vsSweptAt = 0;
async function tickOnce() {
  if (!(await ensureLeader())) return 0;
  const fired = await fireDue({ limit: 500 });
  if (fired.length) log("wakeups fired", { n: fired.length });
  // ship5 p3-voicesig: leader only, every VS_SWEEP_MS (and on --once): delete stored answering-pace rows whose child's
  // latest voice_pace_memory consent is not a grant (withdrawal is already synchronous; this catches a failed delete).
  // Never throws; -1 = could not run (logged inside), retried next time.
  if (Date.now() - vsSweptAt >= VS_SWEEP_MS) {
    vsSweptAt = Date.now();
    const n = await voicesigSweep(q);
    if (n > 0) log("voicesig consent sweep", { deleted: n });
  }
  return fired.length;
}
async function tickerLoop() {
  while (!stopping) {
    try { await tickOnce(); beat("ticker"); } catch (e) { log("tick failed", { error: e.message, code: e.code }); }
    await sleep(TICK_MS);
  }
}

// ───────────── dirty-set step loop (every replica) ─────────────
// A child whose step() keeps throwing is backed off (5 s doubling to 10 min) and paged every 5th consecutive
// failure, so it can never pin the head of the scan and starve healthy children (backoff.js).
const backoff = stepBackoff();
async function dirtyOnce() {
  const rows = await q(`select child_id from child_seq where pending_since is not null and pending_since < now() - make_interval(secs => $1)
      and not (child_id = any($2::uuid[]))
    order by pending_since limit 50`, [DIRTY_GRACE_S, backoff.blocked()]);
  let i = 0;
  const workers = Array.from({ length: Math.min(STEP_CONC, rows.length) }, async () => {
    while (i < rows.length && !stopping) {
      const { child_id } = rows[i++];
      try {
        // a test child folds on its own (shifted) clock, never behind the events it already folded (offsets.js)
        const r = await track(onChildClock(q, child_id, () => step(child_id)));
        backoff.ok(child_id);
        if (r.events) log("stepped", { child: child_id.slice(0, 8), events: r.events, retries: r.retries });
      } catch (e) {
        const f = backoff.failed(child_id);
        log("step failed", { child: child_id.slice(0, 8), error: e.message, code: e.code, failures: f.n, retryInMs: f.delayMs });
        if (f.page) console.error(`[conductor] STEP POISON ${child_id.slice(0, 8)}: ${f.n} consecutive step failures (${e.code || ""} ${String(e.message).slice(0, 200)})`);
      }
    }
  });
  await Promise.all(workers);
  return rows.length;
}
async function dirtyLoop() {
  let wait = POLL_BUSY;
  while (!stopping) {
    let n = 0;
    try { n = await dirtyOnce(); beat("dirty"); } catch (e) { log("dirty scan failed", { error: e.message }); }
    wait = n ? POLL_BUSY : Math.min(POLL_IDLE, wait + 1000);
    await sleep(wait);
  }
}

// ───────────── job lanes ─────────────
const running = { fast: 0, slow: 0 };
async function laneOnce(lane) {
  const free = LANES[lane] - running[lane];
  if (free <= 0 || stopping) return 0;
  const jobs = await claimJobs(lane, { limit: free, worker: ID });
  for (const j of jobs) {
    running[lane]++;
    track(runJob(j).then((ok) => log("job finished", { id: String(j.id), kind: j.kind, attempt: j.attempts, ok }))
      .catch((e) => log("job crashed", { id: String(j.id), kind: j.kind, error: e.message }))
      .finally(() => { running[lane]--; }));
  }
  return jobs.length;
}
async function laneLoop(lane) {
  let wait = POLL_BUSY;
  while (!stopping) {
    let n = 0;
    try { n = await laneOnce(lane); beat(lane); } catch (e) { log("claim failed", { lane, error: e.message }); }
    wait = n ? POLL_BUSY : Math.min(POLL_IDLE, wait + 1000);
    await sleep(wait);
  }
}

// ───────────── shutdown ─────────────
async function shutdown(sig) {
  if (stopping) return;
  stopping = true;
  log("shutting down", { sig, inflight: inflight.size });
  try { if (leader && leaderConn) await leaderConn.query("select pg_advisory_unlock(hashtext($1))", [TICKER_KEY]); } catch {}
  const c = leaderConn; leaderConn = null; leader = false;     // before end(): its 'end' listener must not log a loss
  try { await c?.end(); } catch {}
  await Promise.race([Promise.allSettled([...inflight]), sleep(SHUTDOWN_MS)]);
  await closePool();
  log("bye");
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

function startLiveness() {
  // /healthz for the ACA liveness probe (no ingress: the probe reaches the container port directly)
  const srv = createServer((req, res) => {
    const bad = stalled();
    res.writeHead(bad.length ? 503 : 200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: !bad.length, stalled: bad, leader }));
  });
  srv.on("error", (e) => log("health server failed", { error: e.message }));
  srv.listen(HEALTH_PORT);
  srv.unref();
  // the heartbeat the "worker liveness" alert reads (infra/eyes.mjs: no heartbeat line for 10 min → email the owner)
  setInterval(() => log("worker heartbeat", { kind: "heartbeat", leader, stalled: stalled(), inflight: inflight.size, running }), 60_000).unref();
  // the watchdog: exit on a wedged loop so ACA restarts the replica even if the probe is misconfigured
  setInterval(() => {
    const bad = stalled();
    if (!bad.length || stopping) return;
    console.error(`[worker] watchdog: loop(s) ${bad.join(",")} stalled; exiting for a restart`);
    process.exit(2);
  }, 10_000).unref();
}

log("worker up", { once: ONCE, direct: !/-pooler\./.test(URL_), driver: process.env.DB_DRIVER || "neon-ws" });
if (ONCE) {
  const fired = await tickOnce().catch((e) => (log("tick failed", { error: e.message }), 0));
  const dirty = await dirtyOnce().catch((e) => (log("dirty failed", { error: e.message }), 0));
  const fast = await laneOnce("fast").catch((e) => (log("fast failed", { error: e.message }), 0));
  const slow = await laneOnce("slow").catch((e) => (log("slow failed", { error: e.message }), 0));
  log("once", { leader, fired, dirty, claimed: fast + slow });
  await shutdown("once");
} else {
  startLiveness();
  tickerLoop(); dirtyLoop(); laneLoop("fast"); laneLoop("slow");
}
