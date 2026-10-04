// The test clock's runtime (BUILD-PLAN W1-C #3; comprehension audit G8). OWNED BY W1-C.
//
// A guardian whose email is @taxila.test may move ITS OWN clock forward (POST /api/test/clock). Every request of
// that guardian's session then runs inside an AsyncLocalStorage context carrying the offset, and `Date.now()` and
// `new Date()` (no arguments) read the shifted instant there — in every route, the Director, the learner fold, the
// parent corner and the Conductor's inline step alike, with no call site changed. The database's own now() is not
// shifted; the one place it matters (lesson.started_at / ended_at, which the ledger uses as the session time) is
// shifted by a trigger in 012_pending_grade.sql.
//
// Safety of the global Date patch: it is installed only the first time a NON-ZERO offset is entered, and outside
// such a context (every real account, every background job) it returns the real time — a real account cannot get
// an offset (the route refuses with 403, and only the route writes test_clock). Instances stay real Dates
// (`instanceof Date` holds both ways, util.types.isDate holds), and Date called with arguments is untouched.
//
// Wiring: server/router.js wraps each request in runRequestClock (a one-line seam the main loop applies; see
// server/comprehension/seam-patches/w1c-router-clock.patch). GET /api/test/clock reports `wired` so a probe can
// tell an unwired server from a broken clock.
import { AsyncLocalStorage } from "node:async_hooks";
import { isTestAccount, nextTestOffset, shiftNow } from "../conductor/clock.js";

const als = new AsyncLocalStorage();
const RealDate = globalThis.Date;
let installed = false;

/** Install the offset-aware Date once (idempotent). Exported for tests. */
export function installClock() {
  if (installed) return;
  installed = true;
  const offset = () => als.getStore()?.offsetMs || 0;
  class ClockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) { const o = offset(); if (o) super(RealDate.now() + o); else super(); } else super(...args);
    }
    static now() { return RealDate.now() + offset(); }
    static [Symbol.hasInstance](x) { return x instanceof RealDate; }
  }
  // Date() called without `new` returns a string of the (shifted) now, as the real one does.
  const DateFn = new Proxy(ClockDate, { apply: () => new ClockDate().toString() });
  globalThis.Date = DateFn;
}

/** The offset (ms) of the current request context: 0 outside a test clock. */
export const currentOffsetMs = () => als.getStore()?.offsetMs || 0;
/** The real instant, whatever context this runs in. */
export const realNow = () => RealDate.now();
/** Is this code running inside runRequestClock / runWithOffset (the router seam is applied)? */
export const clockWired = () => !!als.getStore()?.wired;

/** Run fn with the clock shifted by offsetMs (background jobs of a test child; tests). */
export function runWithOffset(offsetMs, fn) {
  const o = Math.max(0, Number(offsetMs) || 0);
  if (o) installClock();
  return als.run({ offsetMs: o, wired: true }, fn);
}

// ───────────── offsets by session token (one small query per second per replica, never per request) ─────────────

const REFRESH_MS = 1000;
const cache = { at: 0, byToken: new Map(), loading: null, warned: false };
let dbq = null;
async function defaultQ(text, params) {
  const { q } = await import("../db.js");
  return q(text, params);
}
/** Tests: swap the query function and clear the cache. */
export function _setTestQuery(fn) { dbq = fn; cache.at = 0; cache.byToken = new Map(); cache.loading = null; }
const query = (text, params = []) => (dbq ?? defaultQ)(text, params);

function refresh() {
  cache.loading ??= query(`select s.token_hash, t.offset_ms from test_clock t join auth_session s on s.guardian_id = t.guardian_id
      where t.offset_ms > 0 and s.expires_at > now()`)
    .then((rows) => { cache.byToken = new Map(rows.map((r) => [r.token_hash, Number(r.offset_ms)])); cache.at = RealDate.now(); })
    .catch((e) => {
      cache.at = RealDate.now();                     // no table yet (012 unapplied) or a blip: no offsets, retry in 1 s
      if (!cache.warned) { cache.warned = true; console.warn("[test-clock] offsets unavailable:", String(e?.message ?? e).slice(0, 160)); }
    })
    .finally(() => { cache.loading = null; });
  return cache.loading;
}

/**
 * The offset for a session token hash. Never adds a round trip to a real user's request after the first load: a stale
 * table is refreshed in the background (another replica sees a new offset within ~1 s; the setter's replica at once).
 */
export async function offsetForToken(tokenHash) {
  if (!tokenHash) return 0;
  if (!cache.at) await refresh();
  else if (RealDate.now() - cache.at > REFRESH_MS) refresh();
  return cache.byToken.get(tokenHash) || 0;
}

/**
 * The router seam: run one request with its session's clock. Real accounts (no row) run at offset 0, which is the
 * real clock. The token is read from the cookie the same way server/auth.js does.
 * @param {any} req @param {() => Promise<any>} fn
 */
export async function runRequestClock(req, fn) {
  let off = 0;
  try {
    const { sessionTokenHash } = await import("../auth.js");
    off = await offsetForToken(sessionTokenHash(req));
  } catch { off = 0; }
  if (off) installClock();
  return als.run({ offsetMs: off, wired: true }, fn);
}

// ───────────── the route: GET / POST /api/test/clock ─────────────

/** Logged on every set and every refusal (no email: guardian id only). */
function logClock(line) { console.info(`[test-clock] ${line}`); }

async function guardianOf(req) {
  const { requireGuardian } = await import("../auth.js");
  return requireGuardian(req);
}

async function offsetOfGuardian(guardianId) {
  const rows = await query("select offset_ms from test_clock where guardian_id = $1", [guardianId]);
  return rows[0] ? Number(rows[0].offset_ms) : 0;
}

/** The offset of a child's guardian (Conductor jobs that run outside a request: shiftNow(real, offset)). */
export async function offsetForChild(childId) {
  const rows = await query("select t.offset_ms from test_clock t join child c on c.guardian_id = t.guardian_id where c.id = $1", [childId]).catch(() => []);
  return rows[0] ? Number(rows[0].offset_ms) : 0;
}

function view(offsetMs) {
  const real = RealDate.now();
  return { offsetMs, offsetDays: Math.round((offsetMs / 86400_000) * 1000) / 1000, realNow: new RealDate(real).toISOString(),
    now: new RealDate(shiftNow(real, offsetMs)).toISOString(), wired: clockWired(), settleMs: REFRESH_MS + 500 };
}

async function getClock(req, res) {
  const { send, forbidden } = await import("../http.js");
  const g = await guardianOf(req);
  if (!isTestAccount(g.email)) { logClock(`refused read guardian=${g.id}`); throw forbidden("the test clock is for test accounts only"); }
  send(res, 200, view(await offsetOfGuardian(g.id)));
}

async function setClock(req, res, body) {
  const { send, forbidden, bad } = await import("../http.js");
  const g = await guardianOf(req);
  if (!isTestAccount(g.email)) { logClock(`refused set guardian=${g.id}`); throw forbidden("the test clock is for test accounts only"); }
  const was = await offsetOfGuardian(g.id);
  let next;
  try { next = nextTestOffset(body, was); } catch (e) { throw bad(e.message); }
  await query(`insert into test_clock (guardian_id, offset_ms, set_at) values ($1, $2, now())
    on conflict (guardian_id) do update set offset_ms = excluded.offset_ms, set_at = now()`, [g.id, next]);
  await query("insert into audit(guardian_id, action, detail) values ($1, 'test_clock', $2)", [g.id, { from: was, to: next }]).catch(() => {});
  logClock(`set guardian=${g.id} offset=${next}ms (was ${was}ms)`);
  cache.at = 0;                                    // this replica: the next request reads the new offset
  await refresh();
  send(res, 200, view(next));
}

export const routes = {
  "GET /api/test/clock": getClock,
  "POST /api/test/clock": setClock,
};
