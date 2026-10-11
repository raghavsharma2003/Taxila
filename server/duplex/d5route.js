// GET /api/duplex/voicelive?lessonId=… (WebSocket upgrade): the D5 lesson stream (server/duplex/voicelive.js). The same
// gates as POST /api/voice/stt-token (the child's own open lesson, core_tutoring consent, a per-guardian rate) plus the
// cohort: only a request whose /api/duplex/config answer is { lane: "d5" } may open it. Served by server/serve.mjs
// (Azure Container Apps); the Vercel shim cannot hold a socket, and the client falls back to D4 when this refuses.
import { one } from "../db.js";
import { requireChild, hasConsent } from "../auth.js";
import { HttpError } from "../http.js";
import { acceptWebSocket, refuseUpgrade, upgradeProblem } from "../ws.js";
import { modeFor } from "./config.js";
import { VoiceLiveRelay, voiceLiveConfig } from "./voicelive.js";

export const D5_PATH = "/api/duplex/voicelive";
export const D5_OPENS_PER_MINUTE = 10;
export const D5_CONCURRENT_PER_GUARDIAN = 2;

const opens = new Map(); // guardianId → open timestamps (last minute)
const live = new Map(); // guardianId → open streams

/** Rate and concurrency for one guardian; `now` injectable. Mutates the maps only when allowed. */
export function allowD5(guardianId, now = Date.now()) {
  const ts = (opens.get(guardianId) ?? []).filter((t) => now - t < 60_000);
  if (ts.length >= D5_OPENS_PER_MINUTE || (live.get(guardianId) ?? 0) >= D5_CONCURRENT_PER_GUARDIAN) { opens.set(guardianId, ts); return false; }
  ts.push(now);
  opens.set(guardianId, ts);
  return true;
}

/** Who may open the stream → { guardian, child, lesson } or throws HttpError. Dependencies injectable for the tests. */
export async function authorizeD5(req, { lessonId, env = process.env, lookupLesson = defaultLesson, child = requireChild, consent = hasConsent, mode = modeFor } = {}) {
  if (!voiceLiveConfig(env)) throw new HttpError(503, "voice live not configured");
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId ?? ""))) throw new HttpError(400, "invalid lessonId");
  const lesson = await lookupLesson(lessonId);
  if (!lesson) throw new HttpError(404, "lesson not found");
  const { guardian, child: kid } = await child(req, lesson.child_id);
  if (lesson.ended_at) throw new HttpError(409, "lesson has ended");
  if (!(await consent(guardian.id, kid.id, "core_tutoring"))) throw new HttpError(403, "core_tutoring consent is required for voice");
  const m = await mode(req, { env });
  if (m?.lane !== "d5") throw new HttpError(403, "not on lane d5");
  return { guardian, child: kid, lesson };
}

const defaultLesson = (id) => one("select id, child_id, state, ended_at from lesson where id = $1", [id]);

/**
 * The upgrade handler. `openUpstream` defaults to Node's global WebSocket (undici; it takes a headers option), so the
 * Voice Live key travels only in the upstream upgrade header.
 */
export async function handleD5Upgrade(req, socket, head, deps = {}) {
  const env = deps.env ?? process.env;
  const problem = upgradeProblem(req);
  if (problem) return refuseUpgrade(socket, 400, `bad upgrade: ${problem}`);
  // same-origin only: a page on another origin must not stream a signed-in child's mic through the cookie
  const origin = String(req.headers.origin ?? "");
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "");
  if (origin && host && new URL(origin, "http://x").host !== host) return refuseUpgrade(socket, 403, "cross-origin");
  const lessonId = new URL(req.url ?? "/", "http://x").searchParams.get("lessonId");
  let who;
  try {
    who = await authorizeD5(req, { lessonId, env, ...(deps.authorize ?? {}) });
  } catch (e) {
    return refuseUpgrade(socket, e instanceof HttpError ? e.status : 401, e instanceof HttpError ? e.message : "not signed in");
  }
  if (!allowD5(who.guardian.id)) return refuseUpgrade(socket, 429, "too many voice sessions; wait a minute");
  const cfg = voiceLiveConfig(env);
  const ws = acceptWebSocket(req, socket, head);
  live.set(who.guardian.id, (live.get(who.guardian.id) ?? 0) + 1);
  const openUpstream = deps.openUpstream ?? ((url, headers) => new WebSocket(url, { headers }));
  const relay = new VoiceLiveRelay({
    cfg,
    client: { send: (t) => ws.send(t), close: (c, r) => ws.close(c, r) },
    openUpstream,
    onEnd: (s) => {
      live.set(who.guardian.id, Math.max(0, (live.get(who.guardian.id) ?? 1) - 1));
      // numbers only: never words, never audio, never the key
      console.log(`[d5] stream ended ${s.reason} ms=${s.ms} frames=${s.framesIn} appends=${s.appends} events=${s.eventsOut} dropped=${s.dropped}`);
    },
  });
  ws.on("message", (data, binary) => (binary ? relay.clientBinary(data) : relay.clientText(data)));
  ws.on("close", () => relay.end(1000, "client_closed"));
  return relay;
}
