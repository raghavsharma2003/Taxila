// Guardian auth: email + scrypt password, opaque session token in an httpOnly cookie (hash stored).
// A child acts inside a guardian session, and every child-scoped route checks the child belongs to that guardian
// (requireChild). Round 7 (stream G, child device pairing): a child's own device holds a CHILD-SCOPED session instead
// (cookie tx_child: an auth_session row plus a device_session row naming the child, migration 041). It reaches only the routes
// server/pair/scope.js lists (the router marks them), and only for its own child; every other route treats it as
// forbidden (403 scope.child_device). Identity stays the authenticated child id; the device holds a revocable session.
import { scryptSync, randomBytes, timingSafeEqual, createHash } from "crypto";
import { q, one } from "./db.js";
import { HttpError, parseCookies, unauthorized, forbidden } from "./http.js";
import { traceIdentify } from "./trace/context.js";

const COOKIE = "tx_session";
/** The child-scoped device session (server/pair/routes.js sets it on redeem). */
export const CHILD_COOKIE = "tx_child";
/** A device token is "d." + base64url: the "." is outside base64url, so one is never taken for a parent token. */
export const DEVICE_PREFIX = "d.";
const isDeviceToken = (t) => String(t).startsWith(DEVICE_PREFIX);
/** The router sets this on a request whose route a paired child device may use (server/pair/scope.js). */
export const CHILD_SCOPE = Symbol.for("taxila.childScope");
const parentToken = (req) => { const t = parseCookies(req)[COOKIE]; return t && !isDeviceToken(t) ? t : null; };
const deviceToken = (req) => { const t = parseCookies(req)[CHILD_COOKIE]; return t && isDeviceToken(t) ? t : null; };
/** A request signed in only as a paired child device (no parent session on this browser). */
export const deviceOnly = (req) => !parentToken(req) && !!deviceToken(req);
export const scopeRefused = () => new HttpError(403, "this device is paired to a child: the parent's own sign-in is needed", { code: "scope.child_device" });
const TTL_DAYS = 30;
const N = 16384, R = 8, P = 1, KEYLEN = 32;

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const h = scryptSync(pw, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${h.toString("base64")}`;
}
export function verifyPassword(pw, stored) {
  const [alg, n, r, p, salt, hash] = String(stored).split("$");
  if (alg !== "scrypt") return false;
  const want = Buffer.from(hash, "base64");
  const got = scryptSync(pw, Buffer.from(salt, "base64"), want.length, { N: +n, r: +r, p: +p });
  return want.length === got.length && timingSafeEqual(want, got);
}
const sha = (s) => createHash("sha256").update(s).digest("hex");

export async function createSession(res, guardianId, userAgent) {
  const token = randomBytes(32).toString("base64url");
  await q("insert into auth_session(token_hash, guardian_id, expires_at, user_agent) values ($1,$2, now() + ($3 || ' days')::interval, $4)",
    [sha(token), guardianId, String(TTL_DAYS), (userAgent || "").slice(0, 200)]);
  const secure = process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
  // HINT: a readable marker that a session MAY exist (never the token), so a public page skips GET /api/me (and its
  // 401) when nobody signed in on this browser, and child home can start its one boot read before the bundle parses.
  res.setHeader("set-cookie", [`${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL_DAYS * 86400}${secure}`,
    `${HINT}=1; Path=/; SameSite=Lax; Max-Age=${TTL_DAYS * 86400}${secure}`]);
}
/** The readable session marker cookie (value "1"; carries nothing). */
export const HINT = "tx_in";
export async function destroySession(req, res) {
  const t = parentToken(req);
  if (t) await q("delete from auth_session where token_hash = $1", [sha(t)]);
  res.setHeader("set-cookie", [`${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, `${HINT}=; Path=/; SameSite=Lax; Max-Age=0`]);
}
/**
 * → guardian row or throws 401. On a paired child device (tx_child only) it answers only on a child-scoped route, with
 * the child's guardian row plus `deviceChildId`; requireChild then admits that one child. Anywhere else: 403.
 */
export async function requireGuardian(req) {
  const t = parentToken(req);
  if (!t) {
    const d = deviceToken(req);
    if (!d) throw unauthorized();
    if (!req?.[CHILD_SCOPE]) throw scopeRefused();
    const g = await one(
      `select g.id, g.email, g.name, g.locale, d.child_id as "deviceChildId" from auth_session s join device_session d on d.token_hash = s.token_hash
         join guardian g on g.id = s.guardian_id where s.token_hash = $1 and s.expires_at > now()`, [sha(d)]);
    if (!g) throw unauthorized("device unpaired or expired");
    touchDevice(sha(d));
    traceIdentify({ guardian: g, child: { id: g.deviceChildId } });
    return g;
  }
  const g = await one(
    `select g.id, g.email, g.name, g.locale from auth_session s join guardian g on g.id = s.guardian_id
      where s.token_hash = $1 and s.expires_at > now() and not exists (select 1 from device_session d where d.token_hash = s.token_hash)`,
    [sha(t)]);
  if (!g) throw unauthorized("session expired");
  traceIdentify({ guardian: g }); // release 12 flight recorder: gid + tier for this request's events
  return g;
}
/** The signed-in session's token hash (what auth_session stores), or null: for routes that join it into one query. */
export function sessionTokenHash(req) {
  const t = parentToken(req);
  if (t) return sha(t);
  const d = deviceToken(req);
  return d && req?.[CHILD_SCOPE] ? sha(d) : null;
}
/** last_seen_at for the parent's device list: at most one write per device per 5 minutes, never awaited. */
const seenAt = new Map();
function touchDevice(hash, now = Date.now()) {
  if (now - (seenAt.get(hash) ?? 0) < 5 * 60_000) return;
  seenAt.set(hash, now);
  if (seenAt.size > 10_000) seenAt.clear();
  q("update device_session set last_seen_at = now() where token_hash = $1", [hash]).catch(() => {});
}
/** → { guardian, child } or throws 403 if the child is not this guardian's. */
export async function requireChild(req, childId) {
  const guardian = await requireGuardian(req);
  if (guardian.deviceChildId && guardian.deviceChildId !== childId) throw forbidden("child not found for this account");
  const child = await one("select * from child where id = $1 and guardian_id = $2", [childId, guardian.id]);
  if (!child) throw forbidden("child not found for this account");
  traceIdentify({ guardian, child });
  return { guardian, child };
}
/** Latest consent row per purpose decides. */
export async function hasConsent(guardianId, childId, purpose) {
  const row = await one(
    "select granted from consent where guardian_id = $1 and (child_id = $2 or child_id is null) and purpose = $3 order by created_at desc limit 1",
    [guardianId, childId, purpose]);
  return !!row?.granted;
}
