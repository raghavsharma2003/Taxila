// One function, one router: Vercel Hobby caps functions per deployment, and one cold start beats twelve.
//
// W1-D "eyes" (BUILD-PLAN W1-D item 2; smooth audit G2): every API request writes ONE JSON access-log line to stdout
// (route template, status, ms, revision, a hashed lesson id, the error class of a 5xx; never a body, a query value, an
// email or a child's words), which the Container Apps environment ships to Log Analytics (infra/eyes.mjs) where the
// alerts read it. POST /api/client-error is the browser's error beacon (src/app/beacon.ts): rate-limited, scrubbed of
// anything that could be child text. /api/health stays shallow for liveness; ?ready=1 adds one DB round trip for the
// readiness probe only (a Neon blip takes the replica out of rotation, never into a restart loop).
import { createHash } from "crypto";
import { HttpError, readJson, send } from "./http.js";
import * as account from "./routes/account.js";
// W1-C seam: each request runs on its session's clock (a @taxila.test account may hold an offset; everyone else: real time).
import { realNow, runRequestClock } from "./comprehension/testclock.js";

const REVISION = process.env.CONTAINER_APP_REVISION || null;
/** The operator key (a Container App secret, deploy-azure.mjs SECRET_ENV): fresh health numbers, the forced 500. */
const OPS_KEY = () => process.env.HEALTH_KEY || process.env.TAXILA_OPS_KEY || null;

// ───────────────────────────── health ─────────────────────────────

/** One `select 1` under a timeout (readiness). Cached 5 s so a probe storm is one query per replica per 5 s. */
let ready = { at: 0, ok: false, ms: null, p: null };
async function dbReady() {
  if (Date.now() - ready.at < 5_000) return ready;
  ready.p ??= (async () => {
    const t0 = performance.now();
    let ok = false;
    try {
      const { q } = await import("./db.js");
      await Promise.race([q("select 1"), new Promise((_, rej) => setTimeout(() => rej(new Error("db timeout")), 2_000).unref())]);
      ok = true;
    } catch (e) { console.warn("[health] readiness db check failed:", String(e?.message ?? e).slice(0, 120)); }
    ready = { at: Date.now(), ok, ms: Math.round(performance.now() - t0), p: null };
    return ready;
  })();
  return ready.p;
}

/**
 * ?db=1 (5 sequential `select 1`, scripts/live-probes.mjs) was an unauthenticated 5-query lever (smooth G10). Now: a
 * caller with the x-taxila-health key (HEALTH_KEY, else TAXILA_OPS_KEY) gets a fresh measurement; anyone else gets the last one, re-measured
 * at most every 30 s per replica. The probe still sees dbMs; a flood costs at most 5 queries / 30 s.
 */
let dbProbe = { at: 0, ms: null, p: null };
async function dbMs(fresh) {
  if (!fresh && dbProbe.ms && Date.now() - dbProbe.at < 30_000) return dbProbe.ms;
  dbProbe.p ??= (async () => {
    const { q } = await import("./db.js");
    const ms = [];
    for (let i = 0; i < 5; i++) { const t0 = performance.now(); await q("select 1"); ms.push(Math.round(performance.now() - t0)); }
    dbProbe = { at: Date.now(), ms, p: null };
    return ms;
  })().finally(() => { dbProbe.p = null; });
  return dbProbe.p;
}

async function health(req, res) {
  const url = new URL(req.url || "/", "http://x");
  const out = { ok: true, at: new Date().toISOString(), driver: process.env.DB_DRIVER || "neon-http", revision: REVISION, sha: process.env.GIT_SHA || null };
  if (url.searchParams.get("ready") === "1") {
    const r = await dbReady();
    out.db = r.ok ? "ok" : "down";
    if (!r.ok) return send(res, 503, { ...out, ok: false });
  }
  if (url.searchParams.get("db") === "1") {
    const key = OPS_KEY();
    out.dbMs = await dbMs(!!key && req.headers?.["x-taxila-health"] === key);
  }
  send(res, 200, out);
}

// ───────────────────────────── the client error beacon ─────────────────────────────

/**
 * The caller's address: the RIGHTMOST x-forwarded-for hop, the one ACA's ingress appended from the connection it saw.
 * The leftmost is whatever the client sent, so keying a rate limit on it let anyone pick a fresh address per request.
 */
export const ipOf = (req) => {
  const hops = String(req.headers?.["x-forwarded-for"] || "").split(",").map((h) => h.trim()).filter(Boolean);
  return hops.at(-1) || req.socket?.remoteAddress || "?";
};
/** Fixed-window rate limits: 10 beacons / min per address, 300 / min per replica. Over the limit: 204, dropped. */
const BEACON = { perIp: 10, global: 300, windowMs: 60_000 };
let beaconWin = { start: 0, total: 0, byIp: new Map() };
export function beaconAllowed(ip, now = Date.now()) {
  if (now - beaconWin.start >= BEACON.windowMs) beaconWin = { start: now, total: 0, byIp: new Map() };
  const n = (beaconWin.byIp.get(ip) || 0) + 1;
  if (n > BEACON.perIp || beaconWin.total + 1 > BEACON.global) return false;
  beaconWin.byIp.set(ip, n); beaconWin.total++;
  return true;
}

/**
 * Nothing a child typed or said may ride an error report into the logs. A message keeps its shape and loses its
 * values: quoted spans, numbers of 3+ digits, emails and URLs become placeholders, non-ASCII letters (Devanagari,
 * any typed name in a script) are dropped, and it is cut to 160 characters. A stack keeps only bundle frames
 * (file:line:col of /assets/*.js). A path keeps its route and loses its ids.
 */
export function scrubMessage(s) {
  return String(s ?? "").replace(/(["'`]).*?\1/g, "“…”").replace(/\S+@\S+/g, "<email>").replace(/https?:\/\/\S+/g, "<url>")
    .replace(/\d{3,}/g, "<n>").replace(/[^\x20-\x7E“”…]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
}
/** Server stack frames as `server/…/file.js:line` only (no absolute paths, no message text). */
export function serverFrames(s) {
  return [...String(s ?? "").matchAll(/(server\/[\w./-]+\.m?js):(\d+)/g)].slice(0, 6).map((m) => `${m[1]}:${m[2]}`);
}
export function scrubStack(s) {
  return [...String(s ?? "").matchAll(/\/(assets\/[\w.-]+\.(?:m?js)):(\d+):(\d+)/g)].slice(0, 8).map((m) => `${m[1]}:${m[2]}:${m[3]}`);
}
export const scrubPath = (p) => String(p ?? "").split("?")[0].split("#")[0]
  .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ":id").replace(/\/[A-Za-z0-9_-]{16,}/g, "/:id")
  .replace(/[^\w/:.-]/g, "").slice(0, 120);
const KINDS = new Set(["error", "unhandledrejection", "react", "resource", "manual"]);

async function clientError(req, res, body) {
  if (!beaconAllowed(ipOf(req))) return send(res, 204, {});
  const b = body && typeof body === "object" ? body : {};
  const line = {
    kind: "client_error", at: new Date(realNow()).toISOString(), rev: REVISION,
    type: KINDS.has(b.kind) ? b.kind : "error",
    name: String(b.name ?? "Error").replace(/[^\w]/g, "").slice(0, 40) || "Error",
    msg: scrubMessage(b.message), stack: scrubStack(b.stack), path: scrubPath(b.path),
    bundle: String(b.bundle ?? "").replace(/[^\w.-]/g, "").slice(0, 60) || null,
    mobile: b.mobile === true,
  };
  process.stdout.write(JSON.stringify(line) + "\n");
  send(res, 204, {});
}

// ───────────────────────────── a forced 500 (test accounts only) ─────────────────────────────

/**
 * GET /api/test/boom: throws, so the 5xx path (access log, alert email) can be proven on prod. Three locks, because
 * signup is open to any …@taxila.test address and every 500 can email the owner: an @taxila.test session, the
 * operator key in x-taxila-ops (TAXILA_OPS_KEY; no key configured = refused), and at most BOOM.max per hour per
 * replica (over it: 429, no 500).
 */
const BOOM = { max: 4, windowMs: 3_600_000 };
let boomWin = { start: 0, n: 0 };
export function boomAllowed(now = Date.now()) {
  if (now - boomWin.start >= BOOM.windowMs) boomWin = { start: now, n: 0 };
  if (boomWin.n >= BOOM.max) return false;
  boomWin.n++;
  return true;
}
async function boom(req) {
  const { requireGuardian } = await import("./auth.js");
  const g = await requireGuardian(req);
  if (!/@taxila\.test$/i.test(String(g.email ?? ""))) throw new HttpError(403, "test accounts only");
  const key = OPS_KEY();
  if (!key || req.headers?.["x-taxila-ops"] !== key) throw new HttpError(403, "operator key required");
  if (!boomAllowed()) throw new HttpError(429, "forced-500 budget used up for this hour");
  throw new Error("forced test error (GET /api/test/boom)");
}

const ROUTES = {
  "POST /api/auth/signup": account.signup,
  "POST /api/auth/login": account.login,
  "POST /api/auth/logout": account.logout,
  "GET /api/me": account.me,
  "POST /api/consent": account.setConsent,
  "POST /api/children": account.createChild,
  "PATCH /api/children": account.updateChild,
  "DELETE /api/children": account.deleteChild,
  "GET /api/health": health,
  "POST /api/client-error": clientError,
  "GET /api/test/boom": boom,
};

export function register(table) { Object.assign(ROUTES, table); }

// ───────────────────────────── the access log ─────────────────────────────

const LOG_SALT = process.env.LOG_HASH_SALT || "taxila-access-log";
/** A lesson id as a short salted hash: requests of one lesson correlate; the id itself never reaches the log. */
export const hashId = (id) => (id ? createHash("sha256").update(`${LOG_SALT}:${id}`).digest("hex").slice(0, 12) : null);
const ACCESS_LOG = process.env.ACCESS_LOG ? process.env.ACCESS_LOG !== "off" : process.env.NODE_ENV === "production";
/** The error class of a 5xx: a constructor name and a code, never the message (it can carry a child's words). */
const errClass = (e) => (e ? `${e.constructor?.name || "Error"}${e.code ? `:${String(e.code).slice(0, 24)}` : ""}` : null);

function accessLog(req, res, key, known, t0, ctx) {
  const lesson = ctx.body?.lessonId ?? (() => { try { return new URL(req.url || "/", "http://x").searchParams.get("lessonId"); } catch { return null; } })();
  // `at` is the REAL instant: a test account's request runs on its shifted clock, the log must not
  const line = { kind: "access", at: new Date(realNow()).toISOString(), route: known ? key : `${req.method} (unmatched)`, status: res.statusCode,
    ms: Math.round(performance.now() - t0), rev: REVISION, lesson: hashId(typeof lesson === "string" ? lesson : null),
    ...(res.statusCode >= 500 ? { err: ctx.err ? errClass(ctx.err) : "status" } : {}) };
  process.stdout.write(JSON.stringify(line) + "\n");
}

export async function handle(req, res) {
  const t0 = performance.now();
  const path = (req.url || "/").split("?")[0].replace(/\/+$/, "");
  const key = `${req.method} ${path}`;
  const fn = ROUTES[key];
  const ctx = { body: null, err: null };
  if (ACCESS_LOG && path !== "/api/health") res.once?.("finish", () => accessLog(req, res, key, !!fn, t0, ctx));
  try {
    if (!fn) return send(res, 404, { error: `no route ${key}` });
    const body = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) ? await readJson(req) : {};
    ctx.body = body;
    await runRequestClock(req, () => fn(req, res, body));
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...(e.extra || {}) });
    ctx.err = e;
    // the class (+ code) and server frames only, never the message: this line ships to Log Analytics like the access
    // log, and a model or DB error message can quote a child's words, romanised Hinglish included, which no scrubber
    // can tell from code text. TAXILA_LOG_FULL_ERRORS=1 (refused under NODE_ENV=production) prints the whole error.
    if (process.env.TAXILA_LOG_FULL_ERRORS === "1" && process.env.NODE_ENV !== "production") console.error("route error", key, e);
    else console.error("route error", key, errClass(e), serverFrames(e?.stack).join(" < "));
    if (!res.headersSent) send(res, 500, { error: "internal error" });
    else res.end?.();
  }
}

