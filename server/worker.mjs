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
import { hostname } from "os";
import { configure, directUrl, q, sessionClient, closePool } from "./conductor/pg.js";
import { step } from "./conductor/step.js";
import { fireDue } from "./conductor/timers.js";
import { claimJobs, runJob } from "./conductor/jobs.js";
import "./conductor/handlers.js";

const ONCE = process.argv.includes("--once");
const ID = `${process.env.CONTAINER_APP_REPLICA_NAME || hostname()}:${process.pid}`;
const TICK_MS = 15_000, POLL_BUSY = 1_000, POLL_IDLE = 5_000, DIRTY_GRACE_S = 2, STEP_CONC = 8, SHUTDOWN_MS = 25_000;
const LANES = { fast: 4, slow: 2 };                    // concurrent jobs per lane per replica [U]
const TICKER_KEY = "taxila:ticker";

const raw = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!raw) { console.error("[worker] DATABASE_URL not set"); process.exit(1); }
const URL_ = directUrl(raw);                            // never the pooler: it drops session advisory locks
await configure({ url: URL_, max: Number(process.env.CONDUCTOR_POOL_MAX || 12) });

const log = (msg, extra = {}) => console.log(JSON.stringify({ at: new Date().toISOString(), worker: ID, msg, ...extra }));
let stopping = false;
const inflight = new Set();
const track = (p) => { inflight.add(p); p.finally(() => inflight.delete(p)); return p; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────────── ticker (leader) ─────────────
let leaderConn = null, leader = false;
async function ensureLeader() {
  if (leader && leaderConn) return true;
  try {
    leaderConn = leaderConn || (await sessionClient(URL_));
    leaderConn.on?.("error", (e) => { log("leader connection lost", { error: e.message }); leader = false; leaderConn = null; });
    const r = await leaderConn.query("select pg_try_advisory_lock(hashtext($1)) as ok", [TICKER_KEY]);
    leader = !!r.rows[0]?.ok;
    if (leader) log("ticker leader");
    return leader;
  } catch (e) {
    log("leader election failed", { error: e.message });
    leader = false; try { await leaderConn?.end(); } catch {} leaderConn = null;
    return false;
  }
}
async function tickOnce() {
  if (!(await ensureLeader())) return 0;
  const fired = await fireDue({ limit: 500 });
  if (fired.length) log("wakeups fired", { n: fired.length });
  return fired.length;
}
async function tickerLoop() {
  while (!stopping) {
    try { await tickOnce(); } catch (e) { log("tick failed", { error: e.message, code: e.code }); }
    await sleep(TICK_MS);
  }
}

// ───────────── dirty-set step loop (every replica) ─────────────
async function dirtyOnce() {
  const rows = await q(`select child_id from child_seq where pending_since is not null and pending_since < now() - make_interval(secs => $1)
    order by pending_since limit 50`, [DIRTY_GRACE_S]);
  let i = 0;
  const workers = Array.from({ length: Math.min(STEP_CONC, rows.length) }, async () => {
    while (i < rows.length && !stopping) {
      const { child_id } = rows[i++];
      try {
        const r = await track(step(child_id));
        if (r.events) log("stepped", { child: child_id.slice(0, 8), events: r.events, retries: r.retries });
      } catch (e) { log("step failed", { child: child_id.slice(0, 8), error: e.message, code: e.code }); }
    }
  });
  await Promise.all(workers);
  return rows.length;
}
async function dirtyLoop() {
  let wait = POLL_BUSY;
  while (!stopping) {
    let n = 0;
    try { n = await dirtyOnce(); } catch (e) { log("dirty scan failed", { error: e.message }); }
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
    try { n = await laneOnce(lane); } catch (e) { log("claim failed", { lane, error: e.message }); }
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
  try { await leaderConn?.end(); } catch {}
  await Promise.race([Promise.allSettled([...inflight]), sleep(SHUTDOWN_MS)]);
  await closePool();
  log("bye");
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

log("worker up", { once: ONCE, direct: !/-pooler\./.test(URL_), driver: process.env.DB_DRIVER || "neon-ws" });
if (ONCE) {
  const fired = await tickOnce().catch((e) => (log("tick failed", { error: e.message }), 0));
  const dirty = await dirtyOnce().catch((e) => (log("dirty failed", { error: e.message }), 0));
  const fast = await laneOnce("fast").catch((e) => (log("fast failed", { error: e.message }), 0));
  const slow = await laneOnce("slow").catch((e) => (log("slow failed", { error: e.message }), 0));
  log("once", { leader, fired, dirty, claimed: fast + slow });
  await shutdown("once");
} else {
  tickerLoop(); dirtyLoop(); laneLoop("fast"); laneLoop("slow");
}
