// The play session token (stateless across replicas, no migration): a base64url JSON body + HMAC-SHA256. It carries
// what the server needs to REGENERATE the current level deterministically (the picker is pure in its request) and to
// re-grade the raw acts it is sent: the child, the coverage entry, the learner inputs captured at start (P(misconception),
// pL), the seed and the door. Nothing in it is a verdict and nothing the client could change survives the signature.
//
// Key: TAXILA_PLAY_KEY (the secret store), else derived from DATABASE_URL (stable across the replicas of one
// environment, never logged), else a per-process random key (dev: tokens do not survive a restart).
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const TOKEN_V = 1;
export const TOKEN_TTL_MS = 6 * 3600_000;
let devKey = null;
export function playKey(env = process.env) {
  if (env.TAXILA_PLAY_KEY && env.TAXILA_PLAY_KEY.length >= 16) return Buffer.from(env.TAXILA_PLAY_KEY);
  if (env.DATABASE_URL) return createHash("sha256").update(`taxila-play:${env.DATABASE_URL}`).digest();
  devKey ??= randomBytes(32);
  return devKey;
}
const b64 = (b) => Buffer.from(b).toString("base64url");

/** @param {Record<string, unknown>} body @param {{ key?: Buffer, now?: number }} [o] */
export function signSession(body, { key = playKey(), now = Date.now() } = {}) {
  const payload = b64(JSON.stringify({ ...body, v: TOKEN_V, exp: now + TOKEN_TTL_MS }));
  const mac = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}
/** → the body, or null (bad shape, bad signature, expired, wrong version). Never throws. */
export function verifySession(token, { key = playKey(), now = Date.now() } = {}) {
  try {
    if (typeof token !== "string" || token.length > 8192) return null;
    const [payload, mac] = token.split(".");
    if (!payload || !mac) return null;
    const want = createHmac("sha256", key).update(payload).digest();
    const got = Buffer.from(mac, "base64url");
    if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (body?.v !== TOKEN_V || typeof body.exp !== "number" || body.exp < now) return null;
    return body;
  } catch { return null; }
}
