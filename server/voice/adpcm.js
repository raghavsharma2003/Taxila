// Round 5, stream 3 (QA D12): IMA ADPCM for the TTS stream on SLOW links. Raw PCM s16le 24 kHz mono is 48 KB/s (398-497 KB
// a line); on Slow 3G with a 4x CPU her first word came 17.4 s after navigation (QA pass 1, n = 1). IMA ADPCM is 4 bits a
// sample: 12 KB/s, a quarter of the bytes, decoded in a few lines of JS on the device (no dependency; Opus / MP3 would need
// one). It is lossy (audible hiss on a quiet voice), so the device asks for it only on a slow link and PCM stays the
// default everywhere else.
// Frame payload (frames.js FRAME.adpcm): [predictor i16 BE][step index u8][0][nibbles: low nibble first]. Every frame
// carries the codec state at its first sample, so each frame decodes on its own (a dropped or late frame never corrupts
// the next). The client decoder is src/lesson/adpcm.ts (the same tables; a test round-trips them).

export const STEPS = Object.freeze([7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97,
  107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411,
  1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
  15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767]);
export const INDEX = Object.freeze([-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8]);
const clamp16 = (v) => (v > 32767 ? 32767 : v < -32768 ? -32768 : v);

/** A streaming encoder: write(pcm s16le bytes, any length, odd included) → ADPCM frame payloads (Buffers). */
export function adpcmEncoder() {
  let pred = 0, index = 0, pending = Buffer.alloc(0);
  return {
    /** @param {Buffer|Uint8Array} pcm @returns {Buffer | null} one payload for this chunk (null when it held < 2 whole samples) */
    write(pcm) {
      // whole PAIRS of samples only (4 bytes: one byte of nibbles); the rest waits for the next chunk
      const buf = pending.length ? Buffer.concat([pending, Buffer.isBuffer(pcm) ? pcm : Buffer.from(pcm)]) : (Buffer.isBuffer(pcm) ? pcm : Buffer.from(pcm));
      const usable = buf.length - (buf.length % 4);
      pending = Buffer.from(buf.subarray(usable));
      if (!usable) return null;
      const n = usable >> 1;
      const out = Buffer.alloc(4 + (n >> 1));
      out.writeInt16BE(pred, 0); out[2] = index; out[3] = 0;
      for (let i = 0; i < n; i++) {
        const s = buf.readInt16LE(i * 2);
        let step = STEPS[index], diff = s - pred, code = 0;
        if (diff < 0) { code = 8; diff = -diff; }
        let delta = step >> 3;
        if (diff >= step) { code |= 4; diff -= step; delta += step; }
        step >>= 1;
        if (diff >= step) { code |= 2; diff -= step; delta += step; }
        step >>= 1;
        if (diff >= step) { code |= 1; delta += step; }
        pred = clamp16(code & 8 ? pred - delta : pred + delta);
        index = Math.max(0, Math.min(88, index + INDEX[code]));
        if (i & 1) out[4 + (i >> 1)] |= code << 4; else out[4 + (i >> 1)] = code;
      }
      return out;
    },
    /** The last 1-3 bytes (an odd tail): dropped at the end of a line (under a sample's worth of silence). */
    get pendingBytes() { return pending.length; },
  };
}

/** Decode one frame payload → PCM s16le bytes. (The server's own reference; the device has src/lesson/adpcm.ts.) */
export function adpcmDecode(payload) {
  let pred = payload.readInt16BE(0), index = payload[2];
  const n = (payload.length - 4) * 2;
  const out = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const b = payload[4 + (i >> 1)];
    const code = i & 1 ? b >> 4 : b & 15;
    const step = STEPS[index];
    let delta = step >> 3;
    if (code & 4) delta += step;
    if (code & 2) delta += step >> 1;
    if (code & 1) delta += step >> 2;
    pred = clamp16(code & 8 ? pred - delta : pred + delta);
    index = Math.max(0, Math.min(88, index + INDEX[code]));
    out.writeInt16LE(pred, i * 2);
  }
  return out;
}
