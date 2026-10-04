// Framed TTS v2 (HUMAN-VOICE §5.14, B4): `[type u8][len u24 big-endian][payload]` on one chunked response, so PCM and
// JSON travel together without a second request. Old clients never see it: a route frames only when the request says
// `Accept: application/x-taxila-pcm-frames;v=2`. The client parser is src/lesson/ttsStream.ts readFrames().
//   0 pcm     PCM s16le 24 kHz mono (any length ≤ 16 MiB; split larger)
//   1 event   JSON: {t: "clause", clause, part, atSample, atMs} (a part's first sample; the whiteboard's clause anchor),
//             or an AvatarVoiceEvent {kind, atMs} (none are emitted while clips are off)
//   2 header  JSON: {v: 2, format, sentences, firstMs?, engine, cache?, prewarmedMs?, seq?}
//   3 turn    JSON: the TurnResponse (POST /api/lesson/turn-audio only), always the first frame there
//   4 end     JSON: {t: "end", status: "ok" | "cut" | "empty", audio?: "none" | "rate_limited", bytes?, ms?}
export const FRAMES_CONTENT_TYPE = "application/x-taxila-pcm-frames;v=2";
export const FRAME = Object.freeze({ pcm: 0, event: 1, header: 2, turn: 3, end: 4 });
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
export function frameWriter(res, framed) {
  return {
    pcm(chunk) {
      if (!framed) return res.write(chunk);
      let ok = true;
      for (let i = 0; i < chunk.length; i += MAX_FRAME) ok = res.write(frame(FRAME.pcm, chunk.subarray(i, i + MAX_FRAME))) && ok;
      return ok;
    },
    json(type, obj) { return framed ? res.write(frame(type, obj)) : true; },
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
    out.push({ type, payload: type === FRAME.pcm ? body : JSON.parse(body.toString("utf8")) });
    i += 4 + len;
  }
  return out;
}
