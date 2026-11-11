// Round 7, stream G (platform-d5-relay-in-india): a short-lived signed ticket that lets a relay on ANOTHER host (the
// India D5 relay, taxila-d5-sin) accept a socket without the taxila.dev session cookie and without a database.
// taxila-web authorizes the child exactly as today (authorizeD5: their own open lesson, consent, rate, lane) and then
// mints a ticket for THAT lesson; the relay only verifies the HMAC, the expiry and the lesson id it is asked for.
//   ticket = base64url(JSON payload) + "." + base64url(HMAC-SHA256(key, payload part))
//   payload = { v: 1, l: lessonId, c: childId, g: guardianId, m: mode, e: expiry ms }
// Key: TAXILA_D5_TICKET_KEY (≥ 32 bytes, the same secret on taxila-web and the relay; never in a URL or a log). The
// ticket rides in the WebSocket URL's query (a browser cannot set headers on a WebSocket), so it is short-lived (60 s by
// default, used once at the upgrade) and bound to one lesson. A relay seeing a reused ticket in its own memory refuses it.
import { createHmac, timingSafeEqual } from "node:crypto";

const b64u = (b) => Buffer.from(b).toString("base64url");
const keyOf = (env) => {
  const k = String(env.TAXILA_D5_TICKET_KEY ?? "");
  if (k.length < 32) throw new Error("TAXILA_D5_TICKET_KEY is missing or shorter than 32 characters");
  return k;
};

/**
 * @param {{ lessonId: string, childId: string, guardianId: string, mode?: string }} who
 * @param {{ env?: NodeJS.ProcessEnv, ttlMs?: number, now?: number }} [o]
 * @returns {string}
 */
export function mintRelayTicket(who, { env = process.env, ttlMs = 60_000, now = Date.now() } = {}) {
  for (const k of ["lessonId", "childId", "guardianId"]) if (!who?.[k]) throw new Error(`relay ticket: ${k} is required`);
  const body = b64u(JSON.stringify({ v: 1, l: who.lessonId, c: who.childId, g: who.guardianId, m: who.mode ?? "on", e: now + ttlMs }));
  return `${body}.${b64u(createHmac("sha256", keyOf(env)).update(body).digest())}`;
}

/**
 * → { ok: true, lessonId, childId, guardianId, mode } | { ok: false, reason }. Never throws on a bad ticket.
 * @param {string} ticket @param {{ lessonId: string, env?: NodeJS.ProcessEnv, now?: number, seen?: Set<string> }} o
 */
export function verifyRelayTicket(ticket, { lessonId, env = process.env, now = Date.now(), seen } = {}) {
  let key;
  try { key = keyOf(env); } catch { return { ok: false, reason: "no_key" }; }
  const [body, sig, extra] = String(ticket ?? "").split(".");
  if (!body || !sig || extra !== undefined) return { ok: false, reason: "malformed" };
  const want = createHmac("sha256", key).update(body).digest();
  let got;
  try { got = Buffer.from(sig, "base64url"); } catch { return { ok: false, reason: "malformed" }; }
  if (got.length !== want.length || !timingSafeEqual(got, want)) return { ok: false, reason: "signature" };
  let p;
  try { p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); } catch { return { ok: false, reason: "malformed" }; }
  if (p?.v !== 1 || typeof p.e !== "number") return { ok: false, reason: "malformed" };
  if (now > p.e) return { ok: false, reason: "expired" };
  if (!lessonId || p.l !== lessonId) return { ok: false, reason: "lesson" };
  if (seen) {
    if (seen.has(sig)) return { ok: false, reason: "reused" };
    seen.add(sig);
    if (seen.size > 10_000) seen.delete(seen.values().next().value);   // bounded: a ticket lives 60 s
  }
  return { ok: true, lessonId: p.l, childId: p.c, guardianId: p.g, mode: p.m };
}
