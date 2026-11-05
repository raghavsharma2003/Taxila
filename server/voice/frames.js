// Framed TTS v2 (HUMAN-VOICE §5.14, B4): `[type u8][len u24 big-endian][payload]` on one chunked response, so PCM and
// JSON travel together without a second request. Old clients never see it: a route frames only when the request says
// `Accept: application/x-taxila-pcm-frames;v=2`. The client parser is src/lesson/ttsStream.ts readFrames().
//   0 pcm     PCM s16le 24 kHz mono (any length ≤ 16 MiB; split larger)
//   1 event   JSON: {t: "clause", clause, part, atSample, atMs} (a part's first sample; the whiteboard's clause anchor),
//             or an AvatarVoiceEvent {kind, atMs} (none are emitted while clips are off)
//   2 header  JSON: {v: 2, format, sentences, firstMs?, engine, cache?, prewarmedMs?, seq?}
//   3 turn    JSON: the TurnResponse (POST /api/lesson/turn-audio only), always the first frame there
//   4 end     JSON: {t: "end", status: "ok" | "cut" | "empty", audio?: "none" | "rate_limited", bytes?, ms?}
//   5 adpcm   round 5 (QA D12): IMA ADPCM in place of type 0, only when the request's Accept carries `codec=adpcm` (a slow
//             link): [predictor i16 BE][step index u8][0][nibbles] (server/voice/adpcm.js); the header says `codec: "adpcm"`.
//             The client decodes it back to PCM inside readFrames, so nothing after the parser changes.
//   6 opus    round 7 (QA D12, voice-tts-transport): one raw Opus packet (20 ms, 24 kHz mono, server/voice/opus.js) in place
//             of type 0, only when the Accept's codec list names `opus` first and the server's encoder loaded; the header
//             says `codec: "opus"`. The client decodes with WebCodecs (src/lesson/opus.ts) in readFrames / pcmOfFrames. The
//             samples in equal the samples out (the last packet is zero-padded to 20 ms), so clause / viseme / word marks
//             keep their PCM sample clock.
import { adpcmEncoder, adpcmDecode } from "./adpcm.js";
import { opusEncoder, opusReady, OPUS } from "./opus.js";

export const FRAMES_CONTENT_TYPE = "application/x-taxila-pcm-frames;v=2";
export const FRAME = Object.freeze({ pcm: 0, event: 1, header: 2, turn: 3, end: 4, adpcm: 5, opus: 6 });
/**
 * The audio codec a framed request gets: the first of its Accept's `codec=` list (`opus+adpcm`, `adpcm`, …) this server
 * can encode now ("opus" needs the encoder loaded: server/voice/opus.js), else "pcm".
 */
export function codecOf(req, { opus = opusReady() } = {}) {
  const m = /x-taxila-pcm-frames[^,]*codec=([a-z0-9+]+)/i.exec(String(req?.headers?.accept ?? ""));
  for (const c of (m?.[1] ?? "").toLowerCase().split("+")) {
    if (c === "opus" && opus) return "opus";
    if (c === "adpcm") return "adpcm";
  }
  return "pcm";
}
export const MAX_FRAME = 0xffffff;

/** One frame as a Buffer. */
export function frame(type, payload) {
  const body = Buffer.isBuffer(payload) ? payload : payload instanceof Uint8Array ? Buffer.from(payload) : Buffer.from(JSON.stringify(payload), "utf8");
  if (body.length > MAX_FRAME) throw new Error(`frame too large (${body.length})`);
  const h = Buffer.alloc(4);
  h[0] = type;
  h.writeUIntBE(body.length, 1, 3);
  return Buffer.concat([h, body]);
}

/**
 * A writer over `res`: pcm(chunk) and json(type, obj) return res.write()'s backpressure flag. Unframed (an old client):
 * pcm writes the raw bytes and json frames are dropped.
 */
export function frameWriter(res, framed, { codec = "pcm" } = {}) {
  const op = framed && codec === "opus" ? opusSlicer(res) : null;
  const enc = framed && !op && codec === "adpcm" ? adpcmEncoder() : null;
  return {
    codec: op ? "opus" : enc ? "adpcm" : "pcm",
    pcm(chunk) {
      if (!framed) return res.write(chunk);
      if (op) return op.pcm(chunk);
      if (enc) { const p = enc.write(chunk); return p ? res.write(frame(FRAME.adpcm, p)) : true; }
      let ok = true;
      for (let i = 0; i < chunk.length; i += MAX_FRAME) ok = res.write(frame(FRAME.pcm, chunk.subarray(i, i + MAX_FRAME))) && ok;
      return ok;
    },
    json(type, obj) { if (!framed) return true; return op ? op.frame(type, frame(type, obj)) : res.write(frame(type, obj)); },
  };
}

/** Opus is encoded OPUS_SLICE_FRAMES at a time (~200 ms of audio, a few ms of CPU), yielding between slices. */
export const OPUS_SLICE_FRAMES = 10;
/**
 * Round 7 (voice-tts-transport): the Opus side of frameWriter. Encoding a whole cached sentence (or a 14 s line) in one
 * synchronous loop held the socket ~300 ms before its first byte, and blocked every other lesson on the replica
 * (evals/tts-transport/first-audio.mjs, before this). So PCM and JSON frames go through one ordered queue; Opus is encoded
 * a slice at a time with setImmediate between slices; the reply's end frame flushes the last (zero-padded) packet first;
 * and `res.end()` called while the queue still holds frames waits for it to drain (the routes call it right after `end`).
 */
function opusSlicer(res) {
  const enc = opusEncoder();
  const FB = OPUS.frameSamples * 2;
  /** @type {({ pcm: Buffer } | { out: Buffer } | { flush: true })[]} */
  const q = [];
  let pumping = false, scheduled = false, endArgs = null;
  const realEnd = typeof res.end === "function" ? res.end.bind(res) : () => res;
  res.end = (...a) => { if (q.length || pumping || scheduled) { endArgs = a; return res; } return realEnd(...a); };
  const pump = () => {
    scheduled = false;
    pumping = true;
    // the client went away (barge-in, a closed tab): drop what is queued, write nothing more
    if (res.destroyed || res.writableEnded) { q.length = 0; pumping = false; return; }
    let budget = OPUS_SLICE_FRAMES * FB;
    while (q.length) {
      const it = q[0];
      if ("out" in it) { res.write(it.out); q.shift(); continue; }
      if ("flush" in it) { for (const p of enc.flush()) res.write(frame(FRAME.opus, p)); q.shift(); continue; }
      if (budget <= 0) { scheduled = true; setImmediate(pump); return; } // yield: other lessons' sockets and timers run
      const take = Math.min(it.pcm.length, budget);
      for (const p of enc.write(it.pcm.subarray(0, take))) res.write(frame(FRAME.opus, p));
      budget -= take;
      if (take === it.pcm.length) q.shift(); else it.pcm = it.pcm.subarray(take);
    }
    pumping = false;
    if (endArgs) { const a = endArgs; endArgs = null; realEnd(...a); }
  };
  // always on the next turn of the loop, never inside the caller: a route pushing a cached sentence chunk by chunk would
  // otherwise re-enter the pump per chunk and encode the whole line before its first byte left (measured: 199 ms for 14 s)
  const kick = () => { if (!pumping && !scheduled) { scheduled = true; setImmediate(pump); } };
  return {
    pcm(chunk) { q.push({ pcm: Buffer.from(chunk) }); kick(); return true; },
    frame(type, buf) {
      // the last partial Opus packet goes out (zero-padded) before the reply's end frame
      if (type === FRAME.end) q.push({ flush: true });
      q.push({ out: buf });
      kick();
      return true;
    },
  };
}

/** Parse a complete framed body (tests, the acceptance harness). → [{type, payload: Buffer | object}] */
export function parseFrames(buf) {
  const out = [];
  let i = 0;
  while (i + 4 <= buf.length) {
    const type = buf[i];
    const len = buf.readUIntBE(i + 1, 3);
    if (i + 4 + len > buf.length) break;
    const body = buf.subarray(i + 4, i + 4 + len);
    out.push(type === FRAME.adpcm ? { type: FRAME.pcm, payload: adpcmDecode(body), adpcm: body.length }
      : { type, payload: type === FRAME.pcm || type === FRAME.opus ? body : JSON.parse(body.toString("utf8")) });
    i += 4 + len;
  }
  return out;
}
