// Round 5, stream 3 (QA D12): the device's IMA ADPCM decoder for TTS frames type 5 (server/voice/adpcm.js encodes; the
// same tables, round-tripped in tests/r5-latency.test.mjs). A frame payload is
// [predictor i16 BE][step index u8][0][nibbles: low nibble first] → PCM s16le, decoded on its own.
// Asked for only on a slow link (adpcmWanted), because ADPCM is lossy: PCM stays the default everywhere else.
const STEPS = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97,
  107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411,
  1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
  15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
const INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];

/** One ADPCM frame payload → PCM s16le bytes. A payload shorter than its header decodes to nothing. */
export function decodeAdpcm(payload: Uint8Array): Uint8Array {
  if (payload.length < 4) return new Uint8Array(0);
  let pred = (payload[0] << 8) | payload[1];
  if (pred & 0x8000) pred -= 0x10000;
  let index = Math.min(88, payload[2]);
  const n = (payload.length - 4) * 2;
  const out = new Uint8Array(n * 2);
  for (let i = 0; i < n; i++) {
    const b = payload[4 + (i >> 1)];
    const code = i & 1 ? b >> 4 : b & 15;
    const step = STEPS[index];
    let delta = step >> 3;
    if (code & 4) delta += step;
    if (code & 2) delta += step >> 1;
    if (code & 1) delta += step >> 2;
    pred = code & 8 ? pred - delta : pred + delta;
    if (pred > 32767) pred = 32767; else if (pred < -32768) pred = -32768;
    index += INDEX[code];
    if (index < 0) index = 0; else if (index > 88) index = 88;
    out[i * 2] = pred & 0xff;
    out[i * 2 + 1] = (pred >> 8) & 0xff;
  }
  return out;
}

export const CODEC_KEY = "tx.flag.tts.codec";
/**
 * Ask for ADPCM? `?tts=adpcm|pcm|auto` (persisted to this device) wins; else only on a slow link: the Network Information
 * API's effectiveType slow-2g / 2g / 3g, or Save-Data. Unknown (Safari, Firefox): PCM, as before. Read per TTS request, so a
 * link that changes speed mid-lesson changes codec from the next line on (each line's frames are one codec).
 */
export function adpcmWanted(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("tts");
      if (v === "adpcm" || v === "pcm") localStorage.setItem(CODEC_KEY, v);
      else if (v === "auto") localStorage.removeItem(CODEC_KEY);
    }
    const s = typeof localStorage !== "undefined" ? localStorage.getItem(CODEC_KEY) : null;
    if (s === "adpcm") return true;
    if (s === "pcm") return false;
  } catch {
    /* storage blocked: decide by the link */
  }
  const c = typeof navigator !== "undefined" ? (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection : undefined;
  return !!c && (c.saveData === true || ["slow-2g", "2g", "3g"].includes(String(c.effectiveType ?? "")));
}
