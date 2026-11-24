// Round 7, stream G (child device pairing): a child's own device, paired by a one-time code the parent makes.
//
//   POST   /api/pair/code     {childId}            parent  → { code, expiresAt }       6 chars, 10 min, single use; replaces
//                                                                                    any earlier code for that child
//   POST   /api/pair/redeem   {code, label?}       none    → { childId, name }          sets the tx_child cookie (+ tx_paired)
//   GET    /api/pair/devices  [?childId=]          parent  → { devices: [{ id, childId, childName, label, pairedAt, lastSeenAt }] }
//   DELETE /api/pair/devices  ?id= (or {id})       parent  → { ok: true }               ends that device's session at once
//
// A wrong, used or expired code answers the same 400 pair.invalid (nothing about which children exist); redeem is
// rate-limited per address and per code (429 pair.rate_limited). The device session is an auth_session row
// plus a device_session row naming the child (migration 041), scoped to child routes by server/auth.js + server/pair/scope.js.
import { randomBytes, randomInt, createHash } from "crypto";
import { q, one, tx } from "../db.js";
import { HttpError, bad, notFound, send } from "../http.js";
import { requireChild, requireGuardian, CHILD_COOKIE, DEVICE_PREFIX } from "../auth.js";
import { ipOf } from "../router.js";

/** No 0/O/1/I: read off a parent's screen by a child. 32 symbols, 6 of them: ~1.07e9 codes. */
export const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CODE_LEN = 6;
export const CODE_TTL_MIN = 10;
export const DEVICE_TTL_DAYS = 180;
/** Fixed windows of 10 min: 10 redeem tries per address, 5 per code. */
export const LIMITS = { windowMs: 10 * 60_000, perIp: 10, perCode: 5 };

const sha = (s) => createHash("sha256").update(s).digest("hex");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid = () => new HttpError(400, "that code did not work: ask for a new one", { code: "pair.invalid" });

export const newCode = (rand = randomInt) => Array.from({ length: CODE_LEN }, () => ALPHABET[rand(0, ALPHABET.length)]).join("");
/** What the child typed → the code, or null. Case, spaces and dashes are forgiven; nothing else. */
export function normalizeCode(v) {
  const s = String(v ?? "").toUpperCase().replace(/[\s-]/g, "");
  return s.length === CODE_LEN && [...s].every((c) => ALPHABET.includes(c)) ? s : null;
}

/** Fixed-window limiter, in memory per replica (a guess costs a try on every replica it reaches, never zero). */
export function limiter({ windowMs, max }) {
  let start = 0, seen = new Map();
  return (key, now = Date.now()) => {
    if (now - start >= windowMs) { start = now; seen = new Map(); }
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    return n <= max;
  };
}
let byIp = limiter({ windowMs: LIMITS.windowMs, max: LIMITS.perIp });
let byCode = limiter({ windowMs: LIMITS.windowMs, max: LIMITS.perCode });
/** Tests only: fresh limiters. */
export function _resetLimitsForTests() {
  byIp = limiter({ windowMs: LIMITS.windowMs, max: LIMITS.perIp });
  byCode = limiter({ windowMs: LIMITS.windowMs, max: LIMITS.perCode });
}

/** A short device name for the parent's list, from what the device said or its user agent. */
export function deviceLabel(label, ua) {
  const l = String(label ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 60);
  if (l) return l;
  const u = String(ua ?? "");
  const kind = /iPad|Tablet|Android(?!.*Mobile)/i.test(u) ? "tablet" : /Mobi|iPhone|Android/i.test(u) ? "phone" : "computer";
  const os = /Android/i.test(u) ? "Android" : /iPhone|iPad|iOS/i.test(u) ? "iOS" : /Windows/i.test(u) ? "Windows" : /Mac OS/i.test(u) ? "Mac" : /CrOS/i.test(u) ? "Chromebook" : /Linux/i.test(u) ? "Linux" : "";
  return os ? `${os} ${kind}` : kind[0].toUpperCase() + kind.slice(1);
}

async function makeCode(req, res, body) {
  const childId = String(body?.childId ?? "");
  if (!UUID.test(childId)) throw bad("invalid childId");
  const { guardian, child } = await requireChild(req, childId);
  if (guardian.deviceChildId) throw new HttpError(403, "the parent's own sign-in is needed", { code: "scope.child_device" });
  await q("delete from pair_code where expires_at < now()");
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const row = await one(
      `insert into pair_code (child_id, guardian_id, code_hash, expires_at) values ($1, $2, $3, now() + ($4 || ' minutes')::interval)
       on conflict (child_id) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, created_at = now()
       returning expires_at`, [child.id, guardian.id, sha(code), String(CODE_TTL_MIN)]).catch((e) => (e?.code === "23505" ? null : Promise.reject(e)));
    if (row) return send(res, 200, { code, expiresAt: new Date(row.expires_at).toISOString() });
  }
  throw new HttpError(503, "could not make a code: try again");
}

async function redeem(req, res, body) {
  const ip = ipOf(req);
  const code = normalizeCode(body?.code);
  const okIp = byIp(ip), okCode = byCode(code ?? `bad:${String(body?.code ?? "").slice(0, 16)}`);
  if (!okIp || !okCode) throw new HttpError(429, "too many tries: wait a few minutes", { code: "pair.rate_limited" });
  if (!code) throw invalid();
  // single use: the row is deleted by the redeem that finds it, whatever its age (an expired one is just gone)
  const hit = await one("delete from pair_code where code_hash = $1 returning child_id, guardian_id, expires_at > now() as live", [sha(code)]);
  if (!hit?.live) throw invalid();
  const child = await one("select id, first_name from child where id = $1 and guardian_id = $2", [hit.child_id, hit.guardian_id]);
  if (!child) throw invalid();
  const token = DEVICE_PREFIX + randomBytes(32).toString("base64url");
  const ua = String(req.headers?.["user-agent"] ?? "");
  await tx([
    { text: "insert into auth_session (token_hash, guardian_id, expires_at, user_agent) values ($1, $2, now() + ($3 || ' days')::interval, $4)",
      params: [sha(token), hit.guardian_id, String(DEVICE_TTL_DAYS), ua.slice(0, 200)] },
    { text: "insert into device_session (token_hash, child_id, label, last_seen_at) values ($1, $2, $3, now())",
      params: [sha(token), child.id, deviceLabel(body?.label, ua)] },
  ]);
  res.setHeader("set-cookie", deviceCookies(token, child.id));
  return send(res, 200, { childId: child.id, name: child.first_name });
}

/** tx_child: the session (httpOnly). tx_paired: the child id, readable, so the app boots child mode (not a credential). */
export function deviceCookies(token, childId, env = process.env) {
  const secure = env.VERCEL || env.NODE_ENV === "production" ? "; Secure" : "";
  const age = DEVICE_TTL_DAYS * 86400;
  return [`${CHILD_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure}`,
    `tx_paired=${childId}; Path=/; SameSite=Lax; Max-Age=${age}${secure}`];
}

const queryOf = (req) => new URL(req.url || "/", "http://x").searchParams;

async function devices(req, res) {
  const g = await requireGuardian(req);
  const childId = queryOf(req).get("childId");
  if (childId != null && !UUID.test(childId)) throw bad("invalid childId");
  const rows = await q(
    `select d.id, d.child_id as "childId", c.first_name as "childName", d.label, d.created_at as "pairedAt", d.last_seen_at as "lastSeenAt"
       from device_session d join auth_session s on s.token_hash = d.token_hash join child c on c.id = d.child_id
      where s.guardian_id = $1 and s.expires_at > now() and ($2::uuid is null or d.child_id = $2::uuid)
      order by d.created_at desc`, [g.id, childId]);
  return send(res, 200, { devices: rows.map((r) => ({ ...r, pairedAt: iso(r.pairedAt), lastSeenAt: iso(r.lastSeenAt) })) });
}
const iso = (t) => (t ? new Date(t).toISOString() : null);

async function unpair(req, res, body) {
  const g = await requireGuardian(req);
  const id = String(queryOf(req).get("id") ?? body?.id ?? "");
  if (!UUID.test(id)) throw bad("invalid id");
  const gone = await one(`delete from auth_session s using device_session d
    where d.token_hash = s.token_hash and d.id = $1 and s.guardian_id = $2 returning d.id`, [id, g.id]);
  if (!gone) throw notFound("no such paired device");
  return send(res, 200, { ok: true });
}

export const routes = {
  "POST /api/pair/code": makeCode,
  "POST /api/pair/redeem": redeem,
  "GET /api/pair/devices": devices,
  "DELETE /api/pair/devices": unpair,
};
