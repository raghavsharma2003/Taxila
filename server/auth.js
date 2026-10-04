// Guardian auth: email + scrypt password, opaque session token in an httpOnly cookie (hash stored).
// Children never authenticate on their own: a child acts inside a guardian session, and every
// child-scoped route checks the child belongs to that guardian (requireChild).
import { scryptSync, randomBytes, timingSafeEqual, createHash } from "crypto";
import { q, one } from "./db.js";
import { parseCookies, unauthorized, forbidden } from "./http.js";

const COOKIE = "tx_session";
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
  const t = parseCookies(req)[COOKIE];
  if (t) await q("delete from auth_session where token_hash = $1", [sha(t)]);
  res.setHeader("set-cookie", [`${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, `${HINT}=; Path=/; SameSite=Lax; Max-Age=0`]);
}
/** → guardian row or throws 401. */
export async function requireGuardian(req) {
  const t = parseCookies(req)[COOKIE];
  if (!t) throw unauthorized();
  const g = await one(
    "select g.id, g.email, g.name, g.locale from auth_session s join guardian g on g.id = s.guardian_id where s.token_hash = $1 and s.expires_at > now()",
    [sha(t)]);
  if (!g) throw unauthorized("session expired");
  return g;
}
/** The signed-in session's token hash (what auth_session stores), or null: for routes that join it into one query. */
export function sessionTokenHash(req) {
  const t = parseCookies(req)[COOKIE];
  return t ? sha(t) : null;
}
/** → { guardian, child } or throws 403 if the child is not this guardian's. */
export async function requireChild(req, childId) {
  const guardian = await requireGuardian(req);
  const child = await one("select * from child where id = $1 and guardian_id = $2", [childId, guardian.id]);
  if (!child) throw forbidden("child not found for this account");
  return { guardian, child };
}
/** Latest consent row per purpose decides. */
export async function hasConsent(guardianId, childId, purpose) {
  const row = await one(
    "select granted from consent where guardian_id = $1 and (child_id = $2 or child_id is null) and purpose = $3 order by created_at desc limit 1",
    [guardianId, childId, purpose]);
  return !!row?.granted;
}
