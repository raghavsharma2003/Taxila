// LANE D5 (2026-10-11, docs/research/duplex-2026-10/RECOMMENDATION.md, decision dc-r12dr-duplex-architecture): Azure AI
// Voice Live is the lesson's EAR, never its voice. The browser streams interleaved stereo PCM16 at 16 kHz to our server
// (channel 0 = the mic, channel 1 = what the phone actually PLAYED: her DragonHD line after ducking); this relay forwards
// it to Voice Live (centralindia), which runs Live-Reference echo cancellation against channel 1, deep noise suppression,
// azure_semantic_vad_multilingual (hi + en) and azure-speech hi-IN / en-IN transcription with create_response false: it
// never answers. Its VAD edges and transcripts come back to the browser in the realtime transcription event shape the
// D4 lane already speaks, so the duplex engine, the Director, the safety predicate and DragonHD are unchanged.
//
// Keys: server env only (TAXILA_VOICELIVE_ENDPOINT / _KEY, else AZURE_AI_CENTRALINDIA_ENDPOINT / _KEY); never sent to the
// client, never logged. Both directions are allowlisted: the client can append audio, commit, and set the VAD silence
// within bounds — nothing else reaches Voice Live (no instructions, no response.create); only VAD, transcription,
// session status and error events reach the client. Nothing is stored here (the "never stored" promise holds).
// Bake-off (simulated, phone-speaker echo): echo false barge-in 0/66, true barge-in 12/12 (BAKEOFF.md, arm e).

export const VOICELIVE_API_VERSION = "2026-07-15";
export const VOICELIVE_DEFAULT_MODEL = "gpt-4.1-mini";
export const VOICELIVE_VOICE = "hi-in-diya:DragonHDOmniIndicNeural";
/** One 20 ms stereo frame at 16 kHz, PCM16: 320 samples × 2 channels × 2 bytes. */
export const D5_FRAME_BYTES = 1280;
/** Frames batched per append (40 ms): fewer upstream messages, no audible latency. */
export const D5_FRAMES_PER_APPEND = 2;
/** A lesson stream may not outlive this (billing guard; a lesson is ≤ 40 min). */
export const D5_MAX_SESSION_MS = 90 * 60_000;
/** A stream whose browser sent no audio this long is gone (a backgrounded tab, a half-open socket): end it, free the slot. */
export const D5_IDLE_MS = 30_000;
/** Client VAD silence bounds (the engine's backstop asks for 1,500 ms; the bake-off ran 500). */
export const D5_SILENCE_MIN_MS = 200;
export const D5_SILENCE_MAX_MS = 3000;
export const D5_DEFAULT_SILENCE_MS = 500;

/** Voice Live from the env, or null when it is not configured (the lane then never offers D5). Pure. */
export function voiceLiveConfig(env = process.env) {
  const endpoint = String(env.TAXILA_VOICELIVE_ENDPOINT || env.AZURE_AI_CENTRALINDIA_ENDPOINT || "").trim();
  const key = String(env.TAXILA_VOICELIVE_KEY || env.AZURE_AI_CENTRALINDIA_KEY || "").trim();
  if (!endpoint || !key) return null;
  let host;
  try { host = new URL(endpoint).host; } catch { return null; }
  if (!host) return null;
  const model = String(env.TAXILA_VOICELIVE_MODEL || VOICELIVE_DEFAULT_MODEL).trim();
  return { host, key, model, apiVersion: VOICELIVE_API_VERSION };
}

/** The upstream URL (no key in it: the key goes in the api-key header). Pure. */
export function voiceLiveUrl(cfg) {
  return `wss://${cfg.host}/voice-live/realtime?api-version=${encodeURIComponent(cfg.apiVersion)}&model=${encodeURIComponent(cfg.model)}`;
}

/**
 * The session: the ear only. Server echo cancellation needs the audio modality and a voice even though nothing is ever
 * spoken (Voice Live refuses AEC with modalities text-only); create_response false keeps it silent. Pure.
 */
export function voiceLiveSession({ silenceMs = D5_DEFAULT_SILENCE_MS, reference = true, dns = true } = {}) {
  return {
    modalities: ["text", "audio"],
    instructions: "Listen only. Never respond.",
    voice: { type: "azure-standard", name: VOICELIVE_VOICE },
    input_audio_format: "pcm16",
    input_audio_sampling_rate: 16000,
    input_audio_echo_cancellation: reference ? { type: "server_echo_cancellation", reference_source: "client", channels: 2 } : { type: "server_echo_cancellation" },
    ...(dns ? { input_audio_noise_reduction: { type: "azure_deep_noise_suppression" } } : {}),
    input_audio_transcription: { model: "azure-speech", language: "hi-IN,en-IN" },
    turn_detection: turnDetection(silenceMs),
  };
}

export function turnDetection(silenceMs) {
  return { type: "azure_semantic_vad_multilingual", silence_duration_ms: clampSilence(silenceMs), create_response: false, interrupt_response: false, remove_filler_words: false, languages: ["hi", "en"] };
}

// D5 review #1: only a finite number is a silence; anything else a client sends (an object whose toString / valueOf are not
// functions threw in Number() and took the Node process down) is the default. Never coerces.
const clampSilence = (ms) => Math.max(D5_SILENCE_MIN_MS, Math.min(D5_SILENCE_MAX_MS, Math.round(typeof ms === "number" && Number.isFinite(ms) ? ms : D5_DEFAULT_SILENCE_MS)));

const PASS = new Set([
  "input_audio_buffer.speech_started",
  "input_audio_buffer.speech_stopped",
  "input_audio_buffer.committed",
  "input_audio_buffer.cleared",
  "conversation.item.input_audio_transcription.delta",
  "conversation.item.input_audio_transcription.completed",
  "conversation.item.input_audio_transcription.failed",
]);

/**
 * One upstream event → what the browser may see (or null). Only the fields the D4 tap and the flight recorder read, so
 * nothing else Voice Live sends (session internals, any response) ever leaves the server. Pure.
 */
export function toClientEvent(raw) {
  const e = raw && typeof raw === "object" ? raw : {};
  const type = typeof e.type === "string" ? e.type : "";
  if (PASS.has(type)) {
    const out = { type };
    if (typeof e.item_id === "string") out.item_id = e.item_id;
    if (Number.isFinite(e.audio_start_ms)) out.audio_start_ms = e.audio_start_ms;
    if (Number.isFinite(e.audio_end_ms)) out.audio_end_ms = e.audio_end_ms;
    if (typeof e.delta === "string") out.delta = e.delta;
    if (typeof e.transcript === "string") out.transcript = e.transcript;
    if (Array.isArray(e.logprobs)) out.logprobs = e.logprobs.slice(0, 64).map((l) => ({ token: String(l?.token ?? ""), logprob: Number(l?.logprob) }));
    if (e.error && typeof e.error === "object") out.error = { code: String(e.error.code ?? ""), message: String(e.error.message ?? "").slice(0, 200) };
    return out;
  }
  if (type === "session.updated" || type === "session.created") {
    const s = e.session && typeof e.session === "object" ? e.session : {};
    return {
      type: "d5.session",
      phase: type === "session.created" ? "created" : "updated",
      aec: s.input_audio_echo_cancellation ? { type: String(s.input_audio_echo_cancellation.type ?? ""), reference: String(s.input_audio_echo_cancellation.reference_source ?? "server"), channels: Number(s.input_audio_echo_cancellation.channels ?? 1) } : null,
      dns: s.input_audio_noise_reduction ? String(s.input_audio_noise_reduction.type ?? "") : null,
      vad: s.turn_detection ? { type: String(s.turn_detection.type ?? ""), silenceMs: Number(s.turn_detection.silence_duration_ms ?? 0) } : null,
      asr: s.input_audio_transcription ? { model: String(s.input_audio_transcription.model ?? ""), language: String(s.input_audio_transcription.language ?? "") } : null,
      rate: Number(s.input_audio_sampling_rate ?? 0) || null,
    };
  }
  if (type === "error") {
    const err = e.error && typeof e.error === "object" ? e.error : {};
    const message = String(err.message ?? "").slice(0, 200);
    // the D4 lane's code for "nothing new to commit" (CascadeDuplex.onServerError → commitEmpty); Voice Live words it
    // "Error committing input audio buffer: buffer too small."
    const code = /buffer too small|commit.*empty/i.test(message) ? "input_audio_buffer_commit_empty" : String(err.code ?? err.type ?? "error");
    return { type: "error", error: { code, message } };
  }
  return null;
}

/** One client text message → the upstream message, or null (dropped). Pure. */
export function fromClientText(text, { silenceMs } = {}) {
  let m;
  try { m = JSON.parse(String(text)); } catch { return null; }
  if (!m || typeof m !== "object") return null;
  if (m.type === "commit") return { type: "input_audio_buffer.commit" };
  if (m.type === "vad") return { type: "session.update", session: { turn_detection: turnDetection(typeof m.silenceMs === "number" && Number.isFinite(m.silenceMs) ? m.silenceMs : silenceMs) } };
  return null;
}

/**
 * The relay for one lesson stream. Transport-injected so the tests run it without sockets:
 *   client: { send(text), close(code, reason) }
 *   openUpstream(url, headers) → a WebSocket-like { send, close, readyState, onopen, onmessage, onclose, onerror }
 */
export class VoiceLiveRelay {
  constructor({ cfg, client, openUpstream, now = () => Date.now(), setTimer = setTimeout, clearTimer = clearTimeout, maxSessionMs = D5_MAX_SESSION_MS, silenceMs = D5_DEFAULT_SILENCE_MS, onEnd = () => {} }) {
    this.cfg = cfg;
    this.client = client;
    this.now = now;
    this.onEnd = onEnd;
    this.clearTimer = clearTimer;
    this.silenceMs = silenceMs;
    this.pending = [];
    this.queue = [];
    this.ended = false;
    this.ready = false;
    this.stats = { framesIn: 0, bytesIn: 0, appends: 0, eventsOut: 0, dropped: 0, startedAt: now() };
    this.up = openUpstream(voiceLiveUrl(cfg), { "api-key": cfg.key });
    this.up.onopen = () => {};
    this.up.onmessage = (m) => { try { this.upstreamMessage(m?.data); } catch { this.end(1011, "relay_error"); } };
    this.up.onerror = () => this.end(1011, "upstream_error");
    this.up.onclose = () => this.end(1011, "upstream_closed");
    this.limit = setTimer(() => this.end(1000, "max_session"), maxSessionMs);
    this.lastIn = now();
    const idle = () => {
      if (this.ended) return;
      if (this.now() - this.lastIn >= D5_IDLE_MS) this.end(1001, "client_idle");
      else this.idle = setTimer(idle, D5_IDLE_MS / 3);
    };
    this.idle = setTimer(idle, D5_IDLE_MS / 3);
  }

  upstreamMessage(data) {
    let e;
    try { e = JSON.parse(typeof data === "string" ? data : Buffer.from(data).toString("utf8")); } catch { return; }
    if (e?.type === "session.created" && !this.ready) {
      this.upSend({ type: "session.update", session: voiceLiveSession({ silenceMs: this.silenceMs }) });
    }
    if (e?.type === "session.updated" && !this.ready) {
      this.ready = true;
      for (const m of this.queue) this.upSend(m);
      this.queue = [];
    }
    const out = toClientEvent(e);
    if (!out) return;
    this.stats.eventsOut++;
    this.client.send(JSON.stringify(out));
  }

  upSend(m) {
    if (this.ended) return;
    try { this.up.send(JSON.stringify(m)); } catch { this.end(1011, "upstream_send"); }
  }

  /** One binary message from the browser: whole 20 ms stereo frames (a partial tail is dropped, never misaligned). */
  clientBinary(buf) {
    if (this.ended) return;
    this.lastIn = this.now();
    const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
    const whole = b.length - (b.length % D5_FRAME_BYTES);
    if (whole !== b.length) this.stats.dropped++;
    if (whole <= 0) return;
    for (let o = 0; o < whole; o += D5_FRAME_BYTES) this.pending.push(b.subarray(o, o + D5_FRAME_BYTES));
    this.stats.framesIn += whole / D5_FRAME_BYTES;
    this.stats.bytesIn += whole;
    while (this.pending.length >= D5_FRAMES_PER_APPEND) this.flush(D5_FRAMES_PER_APPEND);
  }

  flush(n) {
    const frames = this.pending.splice(0, n);
    const msg = { type: "input_audio_buffer.append", audio: Buffer.concat(frames).toString("base64") };
    this.stats.appends++;
    if (!this.ready) {
      // audio before the session is configured would be read as mono 24 kHz: hold it (bounded: 2 s)
      this.queue.push(msg);
      if (this.queue.length > 50) { this.queue.shift(); this.stats.dropped++; }
      return;
    }
    this.upSend(msg);
  }

  /** One text message from the browser: commit / vad, else dropped. */
  clientText(text) {
    if (this.ended) return;
    const m = fromClientText(text, { silenceMs: this.silenceMs });
    if (!m) { this.stats.dropped++; return; }
    if (m.type === "session.update") this.silenceMs = m.session.turn_detection.silence_duration_ms;
    if (!this.ready) {
      this.queue.push(m);
      if (this.queue.length > 50) { this.queue.shift(); this.stats.dropped++; }
      return;
    }
    this.upSend(m);
  }

  end(code = 1000, reason = "") {
    if (this.ended) return;
    this.ended = true;
    this.clearTimer(this.limit);
    this.clearTimer(this.idle);
    try { this.client.send(JSON.stringify({ type: "d5.closed", reason })); } catch { /* gone */ }
    try { this.client.close(code, reason); } catch { /* gone */ }
    try { this.up.close(); } catch { /* gone */ }
    this.onEnd({ reason, ...this.stats, ms: this.now() - this.stats.startedAt });
  }
}
