// The realtime session seam (BUILD-PLAN §4 W2 seam commit; W2-D #1-#3). OWNED BY W2-D; call sites in
// server/routes/voice.js (the STT transcription session) and server/routes/lesson.js realtimeToken (the live-call
// session, W2-E's file). Contract, binding on the owner:
//   - shapeSession(session, ctx) returns the session config to mint (a new object or the same one); synchronous, never
//     throws, never adds the child id or free text about the child, never removes the transcription logprobs include
//     (classify's low-ASR gate reads them) or the safety-relevant instructions;
//   - onMintError(err, ctx) → { fallback: "cascade" } to move the lesson to the cascade lane, or null to rethrow.
//
// What W2-D fills (2026-10-04):
//   1. truncation: the live-call session gets `truncation: { type: "retention_ratio", retention_ratio }` so a long
//      lesson drops its oldest turns in one cut instead of re-reading (and re-billing against the 100k TPM quota) the
//      whole conversation on every response (smooth-reliability G7).
//   2. pace: the Director's vibe knob `endpointSilenceMs` can only ADD end-of-turn silence on top of the measured base:
//      server VAD `silence_duration_ms` = max(minted base (900 ms), knob), clamped to 900-1200 ms. The knob defaults to
//      700 ms (server/persona/adapter.js), and decision `voice-turn-config` measured that 600 ms cut a child's mid-thought
//      pause where 900 ms did not, so a knob below the base never shortens it (fixer W2-D, 2026-10-05). The client
//      re-applies the same rule when TurnResponse.pace moves mid-lesson.
//   3. the premium-lane model is config: TAXILA_REALTIME_TIER=mini mints on DEPLOY_REALTIME_MINI (gpt-realtime-2.1-mini,
//      30/30 quota) instead of DEPLOY_REALTIME, the fallback BUILD-PLAN W2-D #1 names if the 4-wide soak fails. The
//      voice stays whatever the teacher config says (voice choice is config-driven, never chosen here).
//   4. onMintError: a refused mint for quota (HTTP 429, or a rate-limit / quota code in the body) → cascade; anything
//      else rethrows (a misconfiguration must stay loud).
//   5. the mid-sitting switch: POST /api/lesson/lane moves a live realtime lesson to the cascade lane when the browser
//      sees the realtime model rate-limit a response (src/lesson/realtime.ts isRateLimit). Allowed only voice →
//      cascade (never back inside a sitting: `voice-lane-budget` allows a lane change "for an outage" only).
import { one } from "../db.js";
import { requireChild } from "../auth.js";
import { bad, need, notFound, HttpError } from "../http.js";

/** @typedef {{ kind: "lesson" | "stt", lessonId?: string, pace?: { waitNudgeSec: number, endpointSilenceMs: number } }} RealtimeCtx */

/**
 * Server VAD end-of-turn silence bounds for the pace knob (BUILD-PLAN W2-D #2). The floor is the measured base
 * (decision voice-turn-config: 600 ms cut children off mid-thought, 900 ms did not): the knob only ever adds time.
 */
export const ENDPOINT_MIN_MS = 900;
export const ENDPOINT_MAX_MS = 1200;
/** The share of the conversation kept when the context is truncated (the oldest turns go first). */
export const RETENTION_RATIO = 0.8;

/** The pace knob → server VAD silence (ms), clamped to 900-1200; null when the knob is missing or not a number. */
export function endpointSilenceOf(pace) {
  const ms = Number(pace?.endpointSilenceMs);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.round(Math.min(ENDPOINT_MAX_MS, Math.max(ENDPOINT_MIN_MS, ms)));
}

/** Which realtime deployment to mint on (config only). */
export function realtimeDeployment(env = process.env) {
  if (env.TAXILA_REALTIME_TIER === "mini" && env.DEPLOY_REALTIME_MINI) return env.DEPLOY_REALTIME_MINI;
  return null; // keep the session's own model (DEPLOY.realtime)
}

/**
 * Is this a quota refusal (the realtime lane is full), as opposed to a bug? HTTP 429, or a body code/message naming a
 * rate limit or quota. Pure; exported for tests and for the client's twin (src/lesson/realtime.ts isRateLimit).
 */
export function isQuotaError(err) {
  if (!err || typeof err !== "object") return false;
  if (err.status === 429) return true;
  const text = `${err.code ?? ""} ${err.message ?? ""}`;
  return /rate[_ ]?limit|too many (requests|tokens)|quota|insufficient_quota/i.test(text);
}

export const realtimeSeam = {
  /**
   * @param {Record<string, any>} session
   * @param {RealtimeCtx} ctx
   * @returns {Record<string, any>}
   */
  shapeSession(session, ctx) {
    if (!session || typeof session !== "object" || ctx?.kind !== "lesson" || session.type !== "realtime") return session;
    const out = { ...session, truncation: { type: "retention_ratio", retention_ratio: RETENTION_RATIO } };
    const model = realtimeDeployment();
    if (model) out.model = model;
    const td = session.audio?.input?.turn_detection;
    const knob = endpointSilenceOf(ctx.pace);
    // the knob adds time on top of the minted base, never takes it away
    const base = Number(td?.silence_duration_ms) > 0 ? Number(td.silence_duration_ms) : ENDPOINT_MIN_MS;
    const silence = knob === null ? null : Math.max(base, knob);
    if (silence !== null && silence !== td?.silence_duration_ms && td && typeof td === "object" && td.type === "server_vad") {
      out.audio = { ...session.audio, input: { ...session.audio.input, turn_detection: { ...td, silence_duration_ms: silence } } };
    }
    return out;
  },

  /**
   * @param {unknown} err
   * @param {RealtimeCtx} ctx
   * @returns {{ fallback: "cascade" } | null}
   */
  onMintError(err, ctx) {
    if (ctx?.kind !== "lesson" || !isQuotaError(err)) return null;
    console.warn(`[realtime] mint refused for quota (${String(/** @type {any} */ (err)?.status ?? "")}); lesson → cascade`);
    return { fallback: "cascade" };
  },
};

// ───────────── POST /api/lesson/lane ─────────────

/** Why the client may move a lesson off the realtime lane. */
const SWITCH_REASONS = new Set(["rate_limit", "mint_refused", "unavailable"]);

/**
 * Move a live realtime lesson to the cascade lane, mid-sitting. Idempotent: a lesson already on cascade answers 200
 * with `switched: false`. Only voice → cascade: a text lesson has no voice lane to leave, and the switch never goes back
 * within a sitting. The update is one statement guarded on the mode, so two tabs racing it switch once. The client
 * runs it on its ordered turn chain, so no Director turn of this lesson is between its read and its write.
 * @type {(req: any, res: any, body: { lessonId: string, to?: string, reason?: string }) => Promise<void>}
 */
async function switchLane(req, res, body) {
  const { lessonId } = need(body, "lessonId");
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId))) throw bad("invalid lessonId");
  if ((body.to ?? "cascade") !== "cascade") throw bad("a lesson can only move to the cascade lane");
  const reason = SWITCH_REASONS.has(body.reason) ? body.reason : "unavailable";
  const lesson = await one("select id, child_id, ended_at, state->>'mode' as mode from lesson where id = $1", [lessonId]);
  if (!lesson) throw notFound("lesson not found");
  await requireChild(req, lesson.child_id);
  if (lesson.ended_at) throw new HttpError(409, "lesson has ended");
  if (lesson.mode === "cascade") return send(res, { mode: "cascade", switched: false });
  if (lesson.mode && lesson.mode !== "voice") throw new HttpError(409, "only a realtime lesson can move to the cascade lane");
  const row = await one(
    `update lesson set state = jsonb_set(state, '{mode}', '"cascade"') || jsonb_build_object('laneSwitch', jsonb_build_object('from', 'voice', 'reason', $2::text, 'at', now()))
      where id = $1 and ended_at is null and coalesce(state->>'mode', 'voice') = 'voice' returning id`, [lessonId, reason]);
  console.info(`[realtime] lesson ${String(lessonId).slice(0, 8)} → cascade (${reason})${row ? "" : " (already moved)"}`);
  send(res, { mode: "cascade", switched: !!row });
}

function send(res, body) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

export const routes = {
  "POST /api/lesson/lane": switchLane,
};
