// /api/voice/* — the cascade voice lane (context/decisions.md#voice-lane-cascade-default):
//   POST /api/voice/stt-token   ephemeral key for a realtime TRANSCRIPTION session (browser WebRTC)
//   POST /api/voice/transcribe  push-to-talk fallback: one recorded turn → text (+ confidence)
//   POST /api/voice/tts-stream  a stored teacher turn → streamed PCM, sentence-pipelined
// The child's turn itself goes through POST /api/lesson/turn like a text-lane turn: the Director writes the
// reply there (one compile() for every lane), and the client speaks it through tts-stream by seq.
// Like /api/tts, nothing here speaks free text: only lines the Director stored for that lesson.
import { takeAgentSpec, settleAgentSpec } from "../latency/agentSpec.js";
import { one } from "../db.js";
import { requireChild, hasConsent, sessionTokenHash } from "../auth.js";
import { AzureError, endpoint, mintRealtimeSecret, realtimeLane } from "../azure.js";
import { bad, need, notFound, forbidden, unauthorized, HttpError } from "../http.js";
import { teacherFor, teacherForLesson } from "../compiler/characters/index.js";
import { allowSpeech, MAX_TTS_CHARS, DEFAULT_VOICE } from "./tts.js";
import { ageBandOf, sttPrompt, sttSession } from "../voice/stt.js";
import { PCM_RATE, speakChunk, speechStyle, transcribeClip, voiceLane } from "../voice/speech.js";
import { take as prewarmTake, deliveryFor, speakingEntry, PASSTHROUGH } from "../voice/prewarm.js";
import { speakStreamed } from "../latency/speech-stream.js";
import { renderParts, preludeRender } from "../voice/expressive/render.js";
import { preludeTokenOk } from "../voice/expressive/prelude.js";
import { edgeTrim, silence } from "../voice/expressive/pauses.js";
import { FRAME, FRAMES_CONTENT_TYPE, frameWriter, codecOf } from "../voice/frames.js";
import { count } from "../voice/expressive/telemetry.js";
import { spokenOptsForChild } from "../voice/spoken.js";
import { routes as featureRoutes } from "../voice/features.js";
import { realtimeSeam } from "../voice/realtimeSession.js";
import { seamSafe } from "../seam-safe.js";
import { cascadeEngine, dhdVoiceFor, warnUnmeasuredOnce } from "../voice/voices.js";
import { traceIdentify, traceSet } from "../trace/context.js";
import { record } from "../trace/writer.js";

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
 * @param {{ laneSwitched?: boolean }} [opts]  laneSwitched: the lesson moved realtime → cascade mid-sitting (state.laneSwitch);
 *   the child has been hearing the character's realtime voice (teacher.voice), so the rest of the sitting keeps that same
 *   voice on gpt-4o-mini-tts instead of DragonHD (one teacher, one voice: W2-D fixer 2026-10-05)
 */
export function styleForChild(child, ageBand, pinnedTeacherId, pinnedName, opts = {}) {
  // The lesson's pinned teacher (state.ctx.teacherId) wins, so a tutor switch never changes an open lesson's voice.
  const teacher = pinnedTeacherId ? teacherForLesson(child, pinnedTeacherId, pinnedName) : teacherFor(child);
  const base = speechStyle(teacher, VOICES.has(teacher.voice) ? teacher.voice : DEFAULT_VOICE, spokenOptsForChild(child, ageBand));
  // HUMAN-VOICE B1: the cascade voice from config (server/voice/voices.js): DragonHD when Azure Speech is configured,
  // the character's gpt-4o-mini-tts voice as the fallback (and the only voice when it is not).
  if (cascadeEngine() !== "dhd" || opts?.laneSwitched) return base;
  warnUnmeasuredOnce();
  const v = dhdVoiceFor(teacher.id);
  if (!v.usable) return base; // an unprobed DragonHD row: the character's own voice, every turn (voices.js)
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
  const codec = framed ? codecOf(req) : "pcm"; // round 5 (QA D12): ADPCM on a slow link, when the device asks
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
    traceIdentify({ guardian: { id: warm.guardianId, email: null }, child: warm.childId ? { id: warm.childId } : undefined });
    if (!allowSpeech(warm.guardianId)) { warm.abort.abort(); throw new HttpError(429, "too many speech requests"); }
    return streamParts(res, { entry: warm, t0, setupMs: Math.round(performance.now() - t0), prewarmed: Math.round(performance.now() - warm.at), framed, codec });
  }
  // Driven from the session, so an expired session is a 401 before anything about the turn is revealed.
  const row = await one(`select s.guardian_id as session_guardian, t.text as turn_text, t.seq as turn_seq, l.state->'ctx'->>'teacherId' as lesson_teacher, l.state->'ctx'->>'teacherName' as lesson_teacher_name, (l.state ? 'laneSwitch') as lane_switched, c.*
      from (select $3::text as h) k
      left join auth_session s on s.token_hash = k.h and s.expires_at > now()
      left join lesson l on l.id = $1
      left join turn t on t.lesson_id = l.id and t.seq = $2 and t.speaker = 'teacher'
      left join child c on c.id = l.child_id`, [lessonId, seq, tokenHash]);
  if (!row?.session_guardian) throw unauthorized("session expired");
  if (row.turn_seq == null) throw notFound("no teacher turn to speak");
  if (row.guardian_id !== row.session_guardian) throw forbidden("child not found for this account");
  const guardian = { id: row.session_guardian };
  traceIdentify({ guardian: { id: guardian.id, email: null }, child: { id: row.id } }); // release 12 flight recorder
  if (!allowSpeech(guardian.id)) throw new HttpError(429, "too many speech requests");
  const { turn_text: turnText, session_guardian: _sg, turn_seq: _seq, lesson_teacher: lessonTeacher, lesson_teacher_name: lessonTeacherName, lane_switched: laneSwitched, ...child } = row;
  const text = String(turnText ?? "").trim();
  if (!text) throw notFound("no teacher turn to speak");
  if (text.length > MAX_TTS_CHARS) throw bad(`teacher turn is longer than ${MAX_TTS_CHARS} characters`);
  const style = styleForChild(child, undefined, lessonTeacher, lessonTeacherName ?? undefined, { laneSwitched: !!laneSwitched });
  // the plan /turn made for this turn in this process (a prewarm another request took, prewarm off), else plain
  const d = deliveryFor(lessonId, seq);
  // no prelude on this path, so the reply keeps the child's echo (renderParts prelude: false)
  const r = renderParts({ lessonId, seq, text, style, delivery: d?.plan, gov: d?.governed ? PASSTHROUGH : undefined, log: !d?.governed, prelude: false });
  const abort = new AbortController();
  const entry = speakingEntry({ parts: r.parts, prelude: null, style, abort, lessonId });
  entry.startUpTo(LOOKAHEAD);
  return streamParts(res, { entry, t0, setupMs: Math.round(performance.now() - t0), framed, codec });
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
async function streamParts(res, { entry, t0, setupMs, prewarmed, framed = false, headersSent = false, codec = "pcm" }) {
  const { parts, jobs, abort } = entry;
  const realise = Array.isArray(entry.pauses) && entry.pauses.some((p) => p !== undefined);
  // The response's "close" (not the request's, which fires once the body is read) = the client went away.
  const onClose = () => { if (!res.writableEnded) abort.abort(); };
  res.on("close", onClose);
  const out = frameWriter(res, framed, { codec });
  let wrote = 0;
  let traced = "aborted"; // release 12 flight recorder: how this stream ended (tts.end)
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
      out.json(FRAME.header, { v: 2, format: `pcm_s16le;rate=${PCM_RATE};channels=1`, ...(out.codec === "adpcm" ? { codec: "adpcm" } : {}), sentences: parts.length, firstMs: Math.round(performance.now() - t0), setupMs,
        cache: jobs[0]?.cached ? "hit" : "miss", engine: entry.renders?.[0]?.engine ?? "oai", ...(prewarmed !== undefined ? { prewarmedMs: prewarmed } : {}) });
      record("tts.first", { sentences: parts.length, firstMs: Math.round(performance.now() - t0), setupMs,
        cache: jobs[0]?.cached ? "hit" : "miss", engine: entry.renders?.[0]?.engine ?? "oai", framed, ...(prewarmed !== undefined ? { prewarmedMs: prewarmed } : {}) });
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
      if (said) { count("prelude"); await sendPcm(silence(PRELUDE_GAP_MS)); } else {
        // no prelude audio: part 0 is spoken WITH the child's echo, never silently without it (HV-2)
        count("prelude_miss");
        entry.useFull0?.();
      }
    }
    for (let i = 0; i < parts.length; i++) {
      entry.startUpTo(i + LOOKAHEAD);
      if (realise && i > 0 && entry.pauses[i] > 0) await sendPcm(silence(entry.pauses[i]));
      let evented = false;
      // V4: Diya's viseme batches for this part (patch 01), framed next to its audio: anchored at the part's first sample
      // (the clause anchor), with the edge-trimmed lead so the client can shift the synthesis offsets
      let leadMs = 0, partAt = -1, offMarks = null;
      const vq = [];
      const flushVis = () => {
        if (!framed || partAt < 0 || !vq.length) return;
        const v = [], w = [];
        for (const m of vq.splice(0)) { v.push(...m.visemes); w.push(...(m.words ?? [])); }
        if (v.length || w.length) out.json(FRAME.event, { t: "visemes", part: i, atSample: partAt, leadMs, v, ...(w.length ? { w } : {}) });
      };
      const src = realise ? edgeTrim(jobs[i].read(), { lead: true, tail: i < parts.length - 1, onLead: (n) => { leadMs = Math.round((n / PCM_RATE) * 1000); } }) : jobs[i].read();
      try {
        for await (const chunk of src) {
          if (abort.signal.aborted) return;
          if (!evented && framed) {
            evented = true;
            ensureHeader();
            const atSample = wrote >> 1;
            out.json(FRAME.event, { t: "clause", clause: entry.clauses?.[i] ?? i, part: i, atSample, atMs: Math.round((atSample / PCM_RATE) * 1000) });
            partAt = atSample;
            offMarks = jobs[i].marks?.onMarks?.((m) => vq.push(m)) ?? null;
          }
          flushVis();
          await sendPcm(chunk);
          if (abort.signal.aborted) return;
        }
        flushVis();
      } finally {
        offMarks?.();
      }
    }
    traced = headed ? "ok" : "empty";
    if (headed) out.json(FRAME.end, { t: "end", status: "ok", bytes: wrote, ms: Math.round(performance.now() - t0) });
    else if (headersSent) out.json(FRAME.end, { t: "end", status: "empty" });
    res.end();
  } catch (e) {
    if (abort.signal.aborted) return;
    abort.abort();
    traced = headed ? "cut" : "failed";
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
    // every part's engine (a DragonHD → gpt-4o-mini-tts fallback shows here), the prelude, how the stream ended
    record(traced === "cut" || traced === "failed" ? "tts.failed" : "tts.end", { status: traced, bytes: wrote,
      ms: Math.round(performance.now() - t0), parts: parts.length, prelude: entry.prelude ? true : false,
      engines: (entry.renders ?? []).map((r) => r?.engine ?? "oai"), cached: jobs.map((j) => !!j?.cached) });
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
  const lessonTurn = turnAudioDeps.lessonTurn ?? (await import("../brain/turn.js")).lessonTurn;
  const tokenHash = sessionTokenHash(req);
  if (!tokenHash) throw unauthorized();
  if (!turnAudioDeps.lessonTurn) warmPrelude(req, body, tokenHash);
  // r5-latency (4A's agent lane): her words stream to TTS clause by clause WHILE the agent writes them; the response opens
  // at her first clause (header {audio: "streaming"}, then {t: "say"} events and audio), and the turn frame follows when
  // the turn has committed. Errors before that first byte are the turn route's own JSON, as before.
  const early = streamingSay(req, res, body, t0);
  // round 5 (stream 3): her call speculated on this turn's prefetch (server/latency/agentSpec.js); adopted by agentTurn only
  // on identical inputs, aborted when the turn is done either way (a no-op once adopted and finished)
  // the take may wait for the same classify the turn adopts: the turn never waits on it (the spec lands on `hooks` when it is
  // handed over; turn.js reads hooks.agentSpec only after its own classify, so a late hand-over is simply unused and aborted)
  const hooks = { onAgentSay: early.onAgentSay };
  const specP = !body?.typed && !body?.chipId ? Promise.resolve((turnAudioDeps.takeAgentSpec ?? takeAgentSpec)(body?.lessonId, body?.childText)).catch(() => null) : null;
  specP?.then((s) => { if (s) hooks.agentSpec = s; });
  const settleSpec = async (why) => settleAgentSpec(body?.lessonId, await specP, why);
  let out;
  try {
    out = await lessonTurn(req, body, hooks);
  } catch (e) {
    await settleSpec("turn failed");
    if (!early.opened) throw e;
    await early.done().catch(() => {});
    early.w.json(FRAME.end, { t: "end", status: "error", error: e instanceof HttpError ? e.message : "turn failed" });
    res.end();
    return;
  }
  await settleSpec("turn done");
  if (early.opened) return early.finish(out);
  const lessonId = String(body.lessonId);
  const seq = out?.teacherReplySeq;
  let warm = Number.isInteger(seq) && !out.late ? prewarmTake(lessonId, seq, tokenHash) : null;
  let audio = warm ? "follows" : "none";
  if (warm && !allowSpeech(warm.guardianId)) { warm.abort.abort(); warm = null; audio = "rate_limited"; }
  res.writeHead(200, { "content-type": FRAMES_CONTENT_TYPE, "x-turn-ms": String(Math.round(performance.now() - t0)), "cache-control": "no-store" });
  res.flushHeaders?.();
  const codec = codecOf(req); // round 5 (QA D12)
  const w = frameWriter(res, true, { codec });
  // the header first (does audio follow?), then the turn, so the client knows whether to wait for this response's audio
  w.json(FRAME.header, { v: 2, audio, format: `pcm_s16le;rate=${PCM_RATE};channels=1`, ...(w.codec === "adpcm" ? { codec: "adpcm" } : {}), ...(warm ? { seq, sentences: warm.parts.length, prewarmedMs: Math.round(performance.now() - warm.at),
    engine: warm.renders?.[0]?.engine ?? "oai" } : {}) });
  w.json(FRAME.turn, out);
  if (!warm) { w.json(FRAME.end, { t: "end", status: "ok", audio }); res.end(); return; }
  return streamParts(res, { entry: warm, t0, setupMs: Math.round(performance.now() - t0), framed: true, headersSent: true, codec });
}

/**
 * r5-latency: the streamed-speech half of turn-audio (server/latency/speech-stream.js speakStreamed). onAgentSay(deltas,
 * gate) is what the agent lane (server/agent, 4A) calls when its model call starts: the response opens, every clause the
 * gate passes is synthesised (the child's style, the lesson's voice lane) while the next is written. finish(out) writes the
 * turn frame once the turn committed, then the rest: the code-appended card question (out.agentStream.tail), or, on a
 * fallback (no agentStream: the agent timed out or broke the floor, the Director wrote the reply), the Director's reply
 * in full after what was already said. The caption is always out.teacherReply.
 */
/** Tests only: the turn, the voice style and the synthesis behind streamed turn-audio (null = production). */
export const turnAudioDeps = { lessonTurn: null, style: null, synth: null, takeAgentSpec: null };
export { turnAudio as _turnAudio };

function streamingSay(req, res, body, t0) {
  const lessonId = String(body.lessonId ?? "");
  let w = null, spoke = null, ctl = new AbortController();
  res.on?.("close", () => { if (!res.writableEnded) ctl.abort(); });
  // the child's voice style: one read beside the turn (the turn route's own rows are not exposed to this route)
  let styleP = null;
  const style = () => (styleP ??= turnAudioDeps.style ? Promise.resolve(turnAudioDeps.style()) : one(`select c.*, l.state->'ctx'->>'teacherId' as lesson_teacher, l.state->'ctx'->>'teacherName' as lesson_teacher_name,
      (l.state ? 'laneSwitch') as lane_switched from lesson l join child c on c.id = l.child_id where l.id = $1`, [lessonId])
    .then((row) => styleForChild(row, undefined, row?.lesson_teacher, row?.lesson_teacher_name ?? undefined, { laneSwitched: !!row?.lane_switched })));
  const synth = turnAudioDeps.synth ?? async function* (clause, signal) {
    const job = speakChunk(clause, await style(), signal, undefined, voiceLane(lessonId));
    yield* job.read();
  };
  const open = () => {
    if (w) return w;
    res.writeHead(200, { "content-type": FRAMES_CONTENT_TYPE, "cache-control": "no-store" });
    res.flushHeaders?.();
    w = frameWriter(res, true, { codec: codecOf(req) });
    w.json(FRAME.header, { v: 2, audio: "streaming", format: `pcm_s16le;rate=${PCM_RATE};channels=1`, ...(w.codec === "adpcm" ? { codec: "adpcm" } : {}) });
    return w;
  };
  const say = (clauses, signal) => speakStreamed({ deltas: (async function* () { for (const c of clauses) yield `${c} `; })(), synth, signal,
    emit: (e) => (e.type === "clause" ? w.json(FRAME.event, { t: "say", i: e.i, text: e.text }) : (w.pcm(e.chunk) ? undefined : writable(res))) });
  const self = {
    get opened() { return !!w; },
    get w() { return w; },
    onAgentSay(deltas, gate) {
      if (spoke || ctl.signal.aborted) return;
      open();
      // the agent lane is reached only when the predicate, the classifier and the distress read were clean (4A)
      spoke = speakStreamed({ deltas, gate, before: Promise.resolve({ ok: true }), synth, signal: ctl.signal,
        emit: (e) => (e.type === "clause" ? w.json(FRAME.event, { t: "say", i: e.i, text: e.text }) : (w.pcm(e.chunk) ? undefined : writable(res))) });
      spoke.catch((err) => console.warn("[voice] streamed say failed:", String(err?.message ?? err).slice(0, 120)));
    },
    done: () => spoke ?? Promise.resolve(null),
    async finish(out) {
      const r = await self.done().catch(() => null);
      w.json(FRAME.turn, out);
      try {
        if (out?.agentStream) {
          const tail = String(out.agentStream.tail ?? "").trim();
          if (tail && !ctl.signal.aborted) await say([tail], ctl.signal);
        } else if (out?.teacherReply && !ctl.signal.aborted) {
          // a fallback: the Director's reply follows whatever of hers was already said
          await say([String(out.teacherReply)], ctl.signal);
        }
        w.json(FRAME.end, { t: "end", status: "ok", streamed: true, clauses: r?.spoken?.length ?? 0, firstAudioMs: r?.firstAudioMs ?? null, ms: Math.round(performance.now() - t0) });
      } catch (e) {
        w.json(FRAME.end, { t: "end", status: "cut", error: String(e?.message ?? e).slice(0, 80) });
      }
      res.end();
    },
  };
  return self;
}

// ───────────── POST /api/lesson/start-audio (r5-latency: the start's round-trip fold) ─────────────

/**
 * The lesson start and her opening line's audio on ONE response, as turn-audio does for a turn. Measured on a phone
 * profile (evals/latency/start-phone.mjs, 2026-10-14, n = 30): tap -> her first sound p50 2619 ms, of which the second
 * round trip (the start's response, then POST /api/voice/tts-stream, then its first byte) was ~0.4-0.5 s. It calls the
 * start route's own function (server/routes/lesson.js lessonStart: every rule, refusal and write is the route's), then
 * answers in framed TTS v2: a header ({audio: "follows" | "none"}), a `turn` frame carrying the LessonStartResponse, then
 * the opening's audio from the prewarm the start began, then an end frame. A start with nothing to speak here (the realtime
 * lane, a fixed safeguard line with no prewarm, another replica) ends with {audio: "none"} and the client speaks the
 * opening by seq through /api/voice/tts-stream as before. Refusals (409 hours / cap, 403 consent) are the start's own JSON.
 */
async function startAudio(req, res, body) {
  const t0 = performance.now();
  const { lessonStart } = await import("./lesson.js");
  const tokenHash = sessionTokenHash(req);
  if (!tokenHash) throw unauthorized();
  const { body: out } = await lessonStart(req, body);
  traceSet({ sid: out?.lessonId }); // release 12 recorder: send() names the lesson for a JSON start; this response streams
  const seq = out?.teacherOpeningSeq;
  let warm = Number.isInteger(seq) ? prewarmTake(String(out.lessonId), seq, tokenHash) : null;
  let audio = warm ? "follows" : "none";
  if (warm && !allowSpeech(warm.guardianId)) { warm.abort.abort(); warm = null; audio = "rate_limited"; }
  res.writeHead(201, { "content-type": FRAMES_CONTENT_TYPE, "x-start-ms": String(Math.round(performance.now() - t0)), "cache-control": "no-store" });
  res.flushHeaders?.();
  const codec = codecOf(req);
  const w = frameWriter(res, true, { codec });
  w.json(FRAME.header, { v: 2, audio, format: `pcm_s16le;rate=${PCM_RATE};channels=1`, ...(w.codec === "adpcm" ? { codec: "adpcm" } : {}), ...(warm ? { seq, sentences: warm.parts.length, prewarmedMs: Math.round(performance.now() - warm.at),
    engine: warm.renders?.[0]?.engine ?? "oai" } : {}) });
  w.json(FRAME.turn, out);
  if (!warm) { w.json(FRAME.end, { t: "end", status: "ok", audio }); res.end(); return; }
  return streamParts(res, { entry: warm, t0, setupMs: Math.round(performance.now() - t0), framed: true, headersSent: true, codec });
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
    const row = await one(`select l.state->'ctx'->>'teacherId' as lesson_teacher, l.state->'ctx'->>'teacherName' as lesson_teacher_name, (l.state ? 'laneSwitch') as lane_switched, c.*
        from auth_session s join lesson l on l.id = $1 join child c on c.id = l.child_id and c.guardian_id = s.guardian_id
        where s.token_hash = $2 and s.expires_at > now()`, [body.lessonId, tokenHash]);
    if (!row) return;
    const { lesson_teacher: t, lesson_teacher_name: n, lane_switched: ls, ...child } = row;
    // the same screen align() applies, plus the child's own name (never echoed): prelude.js
    if (!preludeTokenOk(token, { names: [child.first_name] })) return;
    const style = styleForChild(child, undefined, t, n ?? undefined, { laneSwitched: !!ls });
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
  "POST /api/lesson/start-audio": startAudio,
  // On-device child voice features + longitudinal trends (server/voice/features.js).
  ...featureRoutes,
};
