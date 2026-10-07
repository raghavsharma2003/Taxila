// POST /api/duplex/shadow — the duplex engine's SHADOW telemetry (duplex-real, round 2, 2026-10-07).
//
// One content-blind summary per lesson (src/duplex/shadowTelemetry.ts: numbers and closed codes, never words, never audio),
// posted by the device when a shadow (or live) duplex lesson closes. Written as ONE JSON line to stdout (kind
// "duplex_shadow"), the same channel as the access log and client errors, so Azure Container Apps' Log Analytics keeps it
// with no migration. The lesson id is salted-hashed exactly like the access log (router.js hashId): lines of one lesson
// correlate with its access rows; the id itself never reaches the log.
//
// No auth on purpose (like POST /api/client-error): it carries nothing about the child, it is rate-limited by the same
// beacon limiter, and an unparseable or off-schema body is dropped with a 204. The report reader is
// evals/duplex-real/shadow-report.mjs; the switch criteria it scores are docs/design/round2/duplex-real/CRITERIA.md.
// Registered by docs/design/round2/duplex-real/patches/01-register-shadow-route.diff (server/index.js is shared).
import { send } from "../http.js";
import { beaconAllowed, ipOf, hashId } from "../router.js";
import { sanitizeShadowSummary } from "../../src/duplex/shadowTelemetry.ts";

/** Build the log line (exported for tests). null = drop. */
export function shadowLine(body, { now = Date.now(), rev = process.env.CONTAINER_APP_REVISION || null } = {}) {
  const b = body && typeof body === "object" ? body : null;
  if (!b) return null;
  const s = sanitizeShadowSummary(b.summary);
  if (!s) return null;
  const lesson = typeof b.lessonId === "string" && /^[0-9a-f-]{36}$/i.test(b.lessonId) ? hashId(b.lessonId) : null;
  return { kind: "duplex_shadow", at: new Date(now).toISOString(), rev, lesson, ...s };
}

async function shadow(req, res, body) {
  if (!beaconAllowed(ipOf(req))) return send(res, 204);
  const line = shadowLine(body);
  if (line) process.stdout.write(JSON.stringify(line) + "\n");
  send(res, 204);
}

export const duplexShadowRoutes = { "POST /api/duplex/shadow": shadow };
