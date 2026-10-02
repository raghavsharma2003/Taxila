// /api/voice/* — the cascade voice lane (context/decisions.md#voice-lane-cascade-default):
//   POST /api/voice/stt-token   ephemeral key for a realtime TRANSCRIPTION session (browser WebRTC)
//   POST /api/voice/transcribe  push-to-talk fallback: one recorded turn → text (+ confidence)
//   POST /api/voice/tts-stream  a stored teacher turn → streamed PCM, sentence-pipelined
// The child's turn itself goes through POST /api/lesson/turn like a text-lane turn: the Director writes the
// reply there (one compile() for every lane), and the client speaks it through tts-stream by seq.
// Like /api/tts, nothing here speaks free text: only lines the Director stored for that lesson.
import { one } from "../db.js";
import { requireChild, hasConsent } from "../auth.js";
import { AzureError, endpoint, mintRealtimeSecret } from "../azure.js";
import { bad, need, notFound, forbidden, HttpError } from "../http.js";
import { teacherFor } from "../compiler/characters/index.js";
import { allowSpeech, MAX_TTS_CHARS, DEFAULT_VOICE } from "./tts.js";
import { ageBandOf, sttPrompt, sttSession } from "../voice/stt.js";
import { PCM_RATE, speakChunk, speechStyle, transcribeClip } from "../voice/speech.js";
import { splitSentences } from "../voice/sentences.js";
import { routes as featureRoutes } from "../voice/features.js";

const VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"]);
/** A push-to-talk turn is a child's answer: 30 s of Opus at ~32 kbit/s is ~120 kB; 2 MB is a generous cap. */
export const MAX_CLIP_BYTES = 2_000_000;
/** Chunks generating ahead of the one playing (1 = the next sentence starts while this one plays). */
const LOOKAHEAD = 1;

async function lessonFor(req, lessonId, { live = true } = {}) {
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId))) throw bad("invalid lessonId");
  const lesson = await one("select id, child_id, state, ended_at from lesson where id = $1", [lessonId]);
  if (!lesson) throw notFound("lesson not found");
  const { guardian, child } = await requireChild(req, lesson.child_id);
  if (live && lesson.ended_at) throw new HttpError(409, "lesson has ended");
  return { lesson, guardian, child };
}

// ───────────── POST /api/voice/stt-token ─────────────

/** @type {(req: any, res: any, body: { lessonId: string }) => Promise<void>} */
async function sttToken(req, res, body) {
  const { lesson, guardian, child } = await lessonFor(req, need(body, "lessonId").lessonId);
  // The child's voice goes to a model from here on: the same gate as the realtime call.
  if (!(await hasConsent(guardian.id, child.id, "core_tutoring"))) throw forbidden("core_tutoring consent is required for voice");
  const session = sttSession({ ageBand: ageBandOf(lesson, child) });
  let secret;
  try {
    secret = await mintRealtimeSecret(session);
  } catch (e) {
    if (e instanceof AzureError) throw new HttpError(502, "transcription service unavailable");
    throw e;
  }
  /** @type {import("../../shared/contracts").RealtimeTokenResponse} */
  const out = { token: secret.value, expiresAt: secret.expires_at, base: endpoint(), session };
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(out));
}

// ───────────── POST /api/voice/transcribe ─────────────

const CLIP_PER_MINUTE = 30;
const clipTimes = new Map();
function allowClip(guardianId, now = Date.now()) {
  if (clipTimes.size > 5000) for (const [id, ts] of clipTimes) if (ts.at(-1) <= now - 60_000) clipTimes.delete(id);
  const ts = (clipTimes.get(guardianId) ?? []).filter((t) => t > now - 60_000);
  const ok = ts.length < CLIP_PER_MINUTE;
  if (ok) ts.push(now);
  clipTimes.set(guardianId, ts);
  return ok;
}

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
 * @type {(req: any, res: any, body: import("../../shared/contracts").TtsRequest) => Promise<void>}
 */
async function ttsStream(req, res, body) {
  const t0 = performance.now();
  const { lessonId, seq } = need(body, "lessonId", "seq");
  if (!Number.isInteger(seq) || seq < 1) throw bad("invalid seq");
  // An ended lesson's goodbye is still spoken (it is stored before the client hears it).
  const { lesson, guardian, child } = await lessonFor(req, lessonId, { live: false });
  if (!allowSpeech(guardian.id)) throw new HttpError(429, "too many speech requests");
  const turn = await one("select text from turn where lesson_id = $1 and seq = $2 and speaker = 'teacher'", [lesson.id, seq]);
  const text = turn?.text?.trim();
  if (!text) throw notFound("no teacher turn to speak");
  if (text.length > MAX_TTS_CHARS) throw bad(`teacher turn is longer than ${MAX_TTS_CHARS} characters`);
  const teacher = teacherFor(child);
  const style = speechStyle(teacher, VOICES.has(teacher.voice) ? teacher.voice : DEFAULT_VOICE);
  const parts = splitSentences(text);

  const abort = new AbortController();
  // The response's "close" (not the request's, which fires once the body is read) = the client went away.
  const onClose = () => { if (!res.writableEnded) abort.abort(); };
  res.on("close", onClose);
  const jobs = [];
  const startUpTo = (i) => { while (jobs.length <= Math.min(i, parts.length - 1)) jobs.push(speakChunk(parts[jobs.length], style, abort.signal)); };
  startUpTo(LOOKAHEAD);
  const setupMs = Math.round(performance.now() - t0);
  let wrote = 0;
  try {
    for (let i = 0; i < parts.length; i++) {
      startUpTo(i + LOOKAHEAD);
      for await (const chunk of jobs[i].read()) {
        if (abort.signal.aborted) return;
        if (!wrote) {
          res.writeHead(200, {
            "content-type": "audio/pcm",
            "x-audio-format": `pcm_s16le;rate=${PCM_RATE};channels=1`,
            "x-tts-sentences": String(parts.length),
            "x-tts-first-ms": String(Math.round(performance.now() - t0)),
            "x-tts-setup-ms": String(setupMs),
            "x-tts-cache": jobs[0].cached ? "hit" : "miss",
            "cache-control": "no-store",
          });
          res.flushHeaders?.();
        }
        wrote += chunk.length;
        if (!res.write(chunk)) await new Promise((r) => res.once("drain", r));
      }
    }
    res.end();
  } catch (e) {
    if (abort.signal.aborted) return;
    abort.abort();
    if (!wrote) {
      if (e instanceof AzureError) throw new HttpError(502, "speech service unavailable");
      throw e;
    }
    // Mid-reply failure: the caption is already on screen; end the audio where it stopped.
    console.warn(`[voice] tts-stream cut after ${wrote} bytes: ${e.message}`);
    res.end();
  } finally {
    res.off("close", onClose);
  }
}

export const routes = {
  "POST /api/voice/stt-token": sttToken,
  "POST /api/voice/transcribe": transcribe,
  "POST /api/voice/tts-stream": ttsStream,
  // On-device child voice features + longitudinal trends (server/voice/features.js).
  ...featureRoutes,
};
