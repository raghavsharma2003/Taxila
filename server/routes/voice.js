// /api/voice/* — the cascade voice lane (context/decisions.md#voice-lane-cascade-default):
//   POST /api/voice/stt-token   ephemeral key for a realtime TRANSCRIPTION session (browser WebRTC)
//   POST /api/voice/transcribe  push-to-talk fallback: one recorded turn → text (+ confidence)
//   POST /api/voice/tts-stream  a stored teacher turn → streamed PCM, sentence-pipelined
// The child's turn itself goes through POST /api/lesson/turn like a text-lane turn: the Director writes the
// reply there (one compile() for every lane), and the client speaks it through tts-stream by seq.
// Like /api/tts, nothing here speaks free text: only lines the Director stored for that lesson.
import { one } from "../db.js";
import { requireChild, hasConsent, sessionTokenHash } from "../auth.js";
import { AzureError, endpoint, mintRealtimeSecret, realtimeLane } from "../azure.js";
import { bad, need, notFound, forbidden, unauthorized, HttpError } from "../http.js";
import { teacherFor, teacherForLesson } from "../compiler/characters/index.js";
import { allowSpeech, MAX_TTS_CHARS, DEFAULT_VOICE } from "./tts.js";
import { ageBandOf, sttPrompt, sttSession } from "../voice/stt.js";
import { PCM_RATE, speakChunk, speechStyle, transcribeClip } from "../voice/speech.js";
import { take as prewarmTake, deliveryFor, speakingEntry, PASSTHROUGH } from "../voice/prewarm.js";
import { renderParts, preludeRender } from "../voice/expressive/render.js";
import { edgeTrim, silence } from "../voice/expressive/pauses.js";
import { FRAME, FRAMES_CONTENT_TYPE, frameWriter } from "../voice/frames.js";
import { count } from "../voice/expressive/telemetry.js";
import { spokenOptsForChild } from "../voice/spoken.js";
import { routes as featureRoutes } from "../voice/features.js";
import { realtimeSeam } from "../voice/realtimeSession.js";
import { seamSafe } from "../seam-safe.js";
import { cascadeEngine, dhdVoiceFor } from "../voice/voices.js";

const VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"]);
/** A push-to-talk turn is a child's answer: 30 s of Opus at ~32 kbit/s is ~120 kB; 2 MB is a generous cap. */
export const MAX_CLIP_BYTES = 2_000_000;
/** Chunks generating ahead of the one playing (1 = the next sentence starts while this one plays). */
const LOOKAHEAD = 1;

async function lessonFor(req, lessonId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId))) throw bad("invalid lessonId");
  const lesson = await one("select id, child_id, state, ended_at from lesson where id = $1", [lessonId]);
  if (!lesson) throw notFound("lesson not found");
  const { guardian, child } = await requireChild(req, lesson.child_id);
  if (lesson.ended_at) throw new HttpError(409, "lesson has ended");
  return { lesson, guardian, child };
}

/**
 * Wait until `res` can take more bytes — or is gone. 'drain' never fires after the client disconnects with
 * the socket buffer full (a barge-in on a slow mobile link), so waiting on it alone hung the handler forever
 * and kept every prefetched sentence referenced.
 */
export function writable(res) {
  if (res.destroyed || res.writableEnded) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      res.off("drain", done);
      res.off("close", done);
      res.off("error", done);
      resolve();
    };
    res.once("drain", done);
    res.once("close", done);
    res.once("error", done);
  });
}

/** Sliding one-minute window per guardian: true while under `max`. */
function limiter(max) {
  const times = new Map();
  return (id, now = Date.now()) => {
    if (times.size > 5000) for (const [k, ts] of times) if (ts.at(-1) <= now - 60_000) times.delete(k);
    const ts = (times.get(id) ?? []).filter((t) => t > now - 60_000);
    const ok = ts.length < max;
    if (ok) ts.push(now);
    times.set(id, ts);
    return ok;
  };
}

/**
 * The lesson teacher's speech style (voice + delivery notes + the spoken-notation cell for the child's language
 * mode, school medium and age band) for a child row: one rule for tts-stream and /turn's prewarm. Every chunk
 * speakChunk() speaks with it is rendered by ttsInput(), so numerals and helplines reach the voice spoken.
 * @param {any} child  child row
 * @param {string} [ageBand]  the lesson's band (state.ctx.ageBand) when the caller has it; else from class_level
 * @param {string} [pinnedTeacherId]  the lesson's teacher (state.ctx.teacherId); else the child's current pick
 * @param {string} [pinnedName]  the lesson's pinned name (state.ctx.teacherName): one resolution of the name per lesson
 */
export function styleForChild(child, ageBand, pinnedTeacherId, pinnedName) {
  // The lesson's pinned teacher (state.ctx.teacherId) wins, so a tutor switch never changes an open lesson's voice.
  const teacher = pinnedTeacherId ? teacherForLesson(child, pinnedTeacherId, pinnedName) : teacherFor(child);
  const base = speechStyle(teacher, VOICES.has(teacher.voice) ? teacher.voice : DEFAULT_VOICE, spokenOptsForChild(child, ageBand));
  // HUMAN-VOICE B1: the cascade voice from config (server/voice/voices.js): DragonHD when Azure Speech is configured,
  // the character's gpt-4o-mini-tts voice as the fallback (and the only voice when it is not).
  if (cascadeEngine() !== "dhd") return base;
  const v = dhdVoiceFor(teacher.id);
  return { ...base, engine: "dhd", dhd: { voice: v.dhd, baseRate: v.baseRate }, version: `${base.version}:dhd` };
}

// ───────────── POST /api/voice/stt-token ─────────────

/**
 * Each token opens a billable transcription session that streams audio for as long as it is up; a lesson
 * needs one, plus a reconnect or two. 10 a minute per guardian covers reconnects and a sibling's lesson.
 */
export const STT_TOKENS_PER_MINUTE = 10;
export const allowSttToken = limiter(STT_TOKENS_PER_MINUTE);

/** @type {(req: any, res: any, body: { lessonId: string }) => Promise<void>} */
async function sttToken(req, res, body) {
  const { lesson, guardian, child } = await lessonFor(req, need(body, "lessonId").lessonId);
  // The child's voice goes to a model from here on: the same gate as the realtime call.
  if (!(await hasConsent(guardian.id, child.id, "core_tutoring"))) throw forbidden("core_tutoring consent is required for voice");
  if (!allowSttToken(guardian.id)) throw new HttpError(429, "too many voice sessions; wait a minute");
  // Seam (W2-D, server/voice/realtimeSession.js): the session config to mint; unchanged until W2-D fills it.
  const base = sttSession({ ageBand: ageBandOf(lesson, child) });
  const session = seamSafe("realtime.shapeSession", () => realtimeSeam.shapeSession(base, { kind: "stt", lessonId: lesson.id }), base);
  let secret;
  try {
    secret = await mintRealtimeSecret(session);
  } catch (e) {
    if (e instanceof AzureError) throw new HttpError(502, "transcription service unavailable");
    throw e;
  }
  /** @type {import("../../shared/contracts").RealtimeTokenResponse} */
  const out = { token: secret.value, expiresAt: secret.expires_at, base: endpoint(realtimeLane(session)), session };
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(out));
}

// ───────────── POST /api/voice/transcribe ─────────────

const CLIP_PER_MINUTE = 30;
const allowClip = limiter(CLIP_PER_MINUTE);

/**
 * Body is JSON { lessonId, audio: base64, mime }: the one router parses every POST body as JSON, so a
 * multipart upload cannot reach a route (server/router.js). Base64 costs a third more bytes on a ~100 kB clip.
 * @type {(req: any, res: any, body: { lessonId: string, audio: string, mime?: string }) => Promise<void>}
 */
async function transcribe(req, res, body) {
  const { lessonId, audio } = need(body, "lessonId", "audio");
  const { lesson, guardian, child } = await lessonFor(req, lessonId);
  if (!(await hasConsent(guardian.id, child.id, "core_tutoring"))) throw forbidden("core_tutoring consent is required for voice");
  if (!allowClip(guardian.id)) throw new HttpError(429, "too many transcription requests");
  if (typeof audio !== "string" || audio.length > (MAX_CLIP_BYTES * 4) / 3 + 4) throw bad("audio missing or too large");
  const clip = Buffer.from(audio, "base64");
  if (clip.length < 200) throw bad("audio clip is empty");
  const mime = typeof body.mime === "string" && /^audio\/[a-z0-9.+-]+(;.*)?$/i.test(body.mime) ? body.mime : "audio/webm";
  let out;
  try {
    out = await transcribeClip(clip, { mime, prompt: sttPrompt(ageBandOf(lesson, child)) });
  } catch (e) {
    if (e instanceof AzureError) throw new HttpError(502, "transcription service unavailable");
    throw e;
  }
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  // "" with confidence 0 = the child spoke and ASR returned nothing (the runtime's repair-move signal).
  res.end(JSON.stringify(out.text ? { text: out.text, asrConfidence: out.confidence } : { text: "", asrConfidence: 0 }));
}

// ───────────── POST /api/voice/tts-stream ─────────────

/**
 * Streams one stored teacher turn as raw PCM (s16le, 24 kHz, mono) over a chunked response. The reply is
 * split into sentences; the first is requested at once and the next starts generating while it plays, so the
 * first audio waits only on the first sentence. Headers go out with the first audio byte (a failure before
 * it is still a clean JSON error), carrying the server-side first-byte time for the latency eval.
 * Framed TTS v2 (HUMAN-VOICE §5.14, B4): a client that sends `Accept: application/x-taxila-pcm-frames;v=2` gets frames
 * (frames.js: a JSON header, PCM, clause events, an end frame) instead of raw PCM; every other client is unchanged.
 * @type {(req: any, res: any, body: import("../../shared/contracts").TtsRequest) => Promise<void>}
 */
async function ttsStream(req, res, body) {
  const t0 = performance.now();
  const { lessonId, seq } = need(body, "lessonId", "seq");
  if (!Number.isInteger(seq) || seq < 1) throw bad("invalid seq");
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId))) throw bad("invalid lessonId");
  const framed = wantsFrames(req);
  // This route is on the latency path (child stops → first audio), so it is ONE query, not requireChild's
  // chain (each round trip to Neon over HTTP is ~0.2-0.4 s): the turn joined to its lesson's child and to the
  // caller's session. The ownership check is the one requireChild makes (the child is this guardian's). An
  // ended lesson's goodbye is still spoken (it is stored before the client hears it).
  const tokenHash = sessionTokenHash(req);
  if (!tokenHash) throw unauthorized();
  // Prewarmed by /turn for this same session (server/voice/prewarm.js): its sentences are already generating
  // and its ownership was checked by that request, so no query here.
  const warm = prewarmTake(lessonId, seq, tokenHash);
  if (warm) {
    if (!allowSpeech(warm.guardianId)) { warm.abort.abort(); throw new HttpError(429, "too many speech requests"); }
    return streamParts(res, { entry: warm, t0, setupMs: Math.round(performance.now() - t0), prewarmed: Math.round(performance.now() - warm.at), framed });
  }
  // Driven from the session, so an expired session is a 401 before anything about the turn is revealed.
  const row = await one(`select s.guardian_id as session_guardian, t.text as turn_text, t.seq as turn_seq, l.state->'ctx'->>'teacherId' as lesson_teacher, l.state->'ctx'->>'teacherName' as lesson_teacher_name, c.*
      from (select $3::text as h) k
      left join auth_session s on s.token_hash = k.h and s.expires_at > now()
      left join lesson l on l.id = $1
      left join turn t on t.lesson_id = l.id and t.seq = $2 and t.speaker = 'teacher'
      left join child c on c.id = l.child_id`, [lessonId, seq, tokenHash]);
  if (!row?.session_guardian) throw unauthorized("session expired");
  if (row.turn_seq == null) throw notFound("no teacher turn to speak");
  if (row.guardian_id !== row.session_guardian) throw forbidden("child not found for this account");
  const guardian = { id: row.session_guardian };
  if (!allowSpeech(guardian.id)) throw new HttpError(429, "too many speech requests");
  const { turn_text: turnText, session_guardian: _sg, turn_seq: _seq, lesson_teacher: lessonTeacher, lesson_teacher_name: lessonTeacherName, ...child } = row;
  const text = String(turnText ?? "").trim();
  if (!text) throw notFound("no teacher turn to speak");
  if (text.length > MAX_TTS_CHARS) throw bad(`teacher turn is longer than ${MAX_TTS_CHARS} characters`);
  const style = styleForChild(child, undefined, lessonTeacher, lessonTeacherName ?? undefined);
  // the plan /turn made for this turn in this process (a prewarm another request took, prewarm off), else plain
  const d = deliveryFor(lessonId, seq);
  const r = renderParts({ lessonId, seq, text, style, delivery: d?.plan, gov: d?.governed ? PASSTHROUGH : undefined, log: !d?.governed });
  const abort = new AbortController();
  const entry = speakingEntry({ parts: r.parts, prelude: null, style, abort });
  entry.startUpTo(LOOKAHEAD);
  return streamParts(res, { entry, t0, setupMs: Math.round(performance.now() - t0), framed });
}

/** Does the client take framed TTS v2? */
export const wantsFrames = (req) => /application\/x-taxila-pcm-frames\s*;\s*v=2/i.test(String(req?.headers?.accept ?? ""));

/** Gap between the uptake prelude and the reply (a breath's worth; the reply's own edge silence is trimmed). */
const PRELUDE_GAP_MS = 220;

/**
 * Write a turn's parts to `res` in order, the next generating while this one plays. With a delivery plan, the engine's
 * edge silence is trimmed and the planned pause is written as exact silence (expressive/pauses.js); an uptake prelude
 * (TEACHER-BRAIN §5.4 L3) plays first when its audio exists. Framed: a header frame, PCM frames, one clause event per
 * part (sample-exact: the whiteboard's clause anchor), and an end frame. `headersSent` = the caller (turn-audio) already
 * wrote the HTTP head and its own frames.
 */
async function streamParts(res, { entry, t0, setupMs, prewarmed, framed = false, headersSent = false }) {
  const { parts, jobs, abort } = entry;
  const realise = Array.isArray(entry.pauses) && entry.pauses.some((p) => p !== undefined);
  // The response's "close" (not the request's, which fires once the body is read) = the client went away.
  const onClose = () => { if (!res.writableEnded) abort.abort(); };
  res.on("close", onClose);
  const out = frameWriter(res, framed);
  let wrote = 0;
  let headed = headersSent;
  let headerFramed = headersSent; // turn-audio wrote its own header frame
  const ensureHeader = () => {
    if (!headed) {
      headed = true;
      res.writeHead(200, {
        "content-type": framed ? FRAMES_CONTENT_TYPE : "audio/pcm",
        "x-audio-format": `pcm_s16le;rate=${PCM_RATE};channels=1`,
        "x-tts-sentences": String(parts.length),
        "x-tts-first-ms": String(Math.round(performance.now() - t0)),
        "x-tts-setup-ms": String(setupMs),
        "x-tts-cache": jobs[0]?.cached ? "hit" : "miss",
        ...(entry.renders?.[0]?.engine ? { "x-tts-engine": entry.renders[0].engine } : {}),
        ...(prewarmed !== undefined ? { "x-tts-prewarmed-ms": String(prewarmed) } : {}),
        "cache-control": "no-store",
      });
      res.flushHeaders?.();
    }
    if (!headerFramed) {
      headerFramed = true;
      out.json(FRAME.header, { v: 2, format: `pcm_s16le;rate=${PCM_RATE};channels=1`, sentences: parts.length, firstMs: Math.round(performance.now() - t0), setupMs,
        cache: jobs[0]?.cached ? "hit" : "miss", engine: entry.renders?.[0]?.engine ?? "oai", ...(prewarmed !== undefined ? { prewarmedMs: prewarmed } : {}) });
    }
  };
  const sendPcm = async (chunk) => {
    if (!chunk?.length) return;
    ensureHeader();
    wrote += chunk.length;
    if (!out.pcm(chunk)) await writable(res);
  };
  try {
    entry.startUpTo(LOOKAHEAD);
    // the uptake prelude: the child's own token, before the reply (fail-silent: no audio, no prelude)
    if (entry.prelude) {
      let said = 0;
      try {
        for await (const c of edgeTrim(entry.prelude.read(), { lead: true, tail: true })) { if (abort.signal.aborted) return; said += c.length; await sendPcm(c); }
      } catch (e) { if (abort.signal.aborted) return; console.warn("[voice] prelude failed:", e.message); }
      if (said) { count("prelude"); await sendPcm(silence(PRELUDE_GAP_MS)); } else count("prelude_miss");
    }
    for (let i = 0; i < parts.length; i++) {
      entry.startUpTo(i + LOOKAHEAD);
      if (realise && i > 0 && entry.pauses[i] > 0) await sendPcm(silence(entry.pauses[i]));
      let evented = false;
      const src = realise ? edgeTrim(jobs[i].read(), { lead: true, tail: i < parts.length - 1 }) : jobs[i].read();
      for await (const chunk of src) {
        if (abort.signal.aborted) return;
        if (!evented && framed) {
          evented = true;
          ensureHeader();
          const atSample = wrote >> 1;
          out.json(FRAME.event, { t: "clause", clause: entry.clauses?.[i] ?? i, part: i, atSample, atMs: Math.round((atSample / PCM_RATE) * 1000) });
        }
        await sendPcm(chunk);
        if (abort.signal.aborted) return;
      }
    }
    if (headed) out.json(FRAME.end, { t: "end", status: "ok", bytes: wrote, ms: Math.round(performance.now() - t0) });
    else if (headersSent) out.json(FRAME.end, { t: "end", status: "empty" });
    res.end();
  } catch (e) {
    if (abort.signal.aborted) return;
    abort.abort();
    if (!headed) {
      if (e instanceof AzureError) throw new HttpError(502, "speech service unavailable");
      throw e;
    }
    // Mid-reply failure: the caption is already on screen; end the audio where it stopped.
    console.warn(`[voice] tts-stream cut after ${wrote} bytes: ${e.message}`);
    if (framed) out.json(FRAME.end, { t: "end", status: "cut", bytes: wrote });
    res.end();
  } finally {
    res.off("close", onClose);
  }
}

// ───────────── POST /api/lesson/turn-audio (the round-trip fold) ─────────────

/**
 * BUILD-PLAN W2-G #7: one request carries the child's turn in and the teacher's reply out. It calls W2-E's exported turn
 * handler (server/brain/turn.js lessonTurn: every auth, replay, late-turn and outbox rule is the turn route's own), then
 * answers in framed TTS v2: a `turn` frame (the TurnResponse JSON, exactly what POST /api/lesson/turn returns), then the
 * reply's audio from the prewarm that turn started, then an end frame. 3 India round trips (turn, tts-stream, and its
 * auth) become 1. A turn with nothing to speak (a hold, a replay, another replica's prewarm) ends with
 * `{audio: "none"}` and the client speaks it by seq through /api/voice/tts-stream as before. Refusals before any byte
 * are the turn route's own JSON errors.
 * @type {(req: any, res: any, body: import("../../shared/contracts").TurnRequest) => Promise<void>}
 */
async function turnAudio(req, res, body) {
  const t0 = performance.now();
  const { lessonTurn } = await import("../brain/turn.js");
  const tokenHash = sessionTokenHash(req);
  if (!tokenHash) throw unauthorized();
  warmPrelude(req, body, tokenHash);
  const out = await lessonTurn(req, body);
  const lessonId = String(body.lessonId);
  const seq = out?.teacherReplySeq;
  let warm = Number.isInteger(seq) && !out.late ? prewarmTake(lessonId, seq, tokenHash) : null;
  let audio = warm ? "follows" : "none";
  if (warm && !allowSpeech(warm.guardianId)) { warm.abort.abort(); warm = null; audio = "rate_limited"; }
  res.writeHead(200, { "content-type": FRAMES_CONTENT_TYPE, "x-turn-ms": String(Math.round(performance.now() - t0)), "cache-control": "no-store" });
  res.flushHeaders?.();
  const w = frameWriter(res, true);
  // the header first (does audio follow?), then the turn, so the client knows whether to wait for this response's audio
  w.json(FRAME.header, { v: 2, audio, format: `pcm_s16le;rate=${PCM_RATE};channels=1`, ...(warm ? { seq, sentences: warm.parts.length, prewarmedMs: Math.round(performance.now() - warm.at),
    engine: warm.renders?.[0]?.engine ?? "oai" } : {}) });
  w.json(FRAME.turn, out);
  if (!warm) { w.json(FRAME.end, { t: "end", status: "ok", audio }); res.end(); return; }
  return streamParts(res, { entry: warm, t0, setupMs: Math.round(performance.now() - t0), framed: true, headersSent: true });
}

/**
 * The uptake prelude (TEACHER-BRAIN §5.4 L3, behind TAXILA_UPTAKE_PRELUDE=1 until HV-16): at receipt, synthesise the
 * child's key token in the lesson's voice into the MEMORY cache, so the prewarm's prelude job is a hit by the time the
 * reply is ready. Nothing is played here: whether a prelude is spoken is the Brain's Moment's decision (never on a safety
 * turn, never a verdict). Never awaited; never written to the database.
 */
function warmPrelude(req, body, tokenHash) {
  if (process.env.TAXILA_UPTAKE_PRELUDE !== "1" || typeof body?.text !== "string" || !body.text.trim()) return;
  if (!/^[0-9a-f-]{36}$/i.test(String(body.lessonId))) return;
  void (async () => {
    const { keyTokenOf } = await import("../brain/moment.js");
    const token = keyTokenOf(body.text);
    if (!token) return;
    const row = await one(`select l.state->'ctx'->>'teacherId' as lesson_teacher, l.state->'ctx'->>'teacherName' as lesson_teacher_name, c.*
        from auth_session s join lesson l on l.id = $1 join child c on c.id = l.child_id and c.guardian_id = s.guardian_id
        where s.token_hash = $2 and s.expires_at > now()`, [body.lessonId, tokenHash]);
    if (!row) return;
    const { lesson_teacher: t, lesson_teacher_name: n, ...child } = row;
    const style = styleForChild(child, undefined, t, n ?? undefined);
    const render = preludeRender(token, style);
    if (!render) return;
    const job = speakChunk(token, style, undefined, render);
    for await (const _ of job.read()) { /* drain into the memory cache */ }
  })().catch((e) => console.warn("[voice] prelude warm failed:", e?.message));
}

export const routes = {
  "POST /api/lesson/turn-audio": turnAudio,
  "POST /api/voice/stt-token": sttToken,
  "POST /api/voice/transcribe": transcribe,
  "POST /api/voice/tts-stream": ttsStream,
  // On-device child voice features + longitudinal trends (server/voice/features.js).
  ...featureRoutes,
};
