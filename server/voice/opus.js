// Round 7, stream B Voice (QA D12, voice-tts-transport): Opus for her speech on phones. Raw PCM s16le 24 kHz mono is
// 48 KB/s (398-497 KB a line); IMA ADPCM (./adpcm.js) is 12 KB/s and lossy; Opus at OPUS.bitrate is ~3 KB/s and sounds
// clean. Encoded HERE, at the frame writer (frames.js FRAME.opus), so every stage before it (cache, DragonHD, mini-tts,
// viseme / word / clause marks on the PCM sample clock) is unchanged; the device decodes with WebCodecs (src/lesson/opus.ts).
//
// The encoder is libopus compiled to WASM (`opusscript`), loaded lazily and only once. Until it has loaded — or when it
// cannot load (not installed, TAXILA_TTS_OPUS=off) — opusReady() is false and codecOf() hands the request the next codec in
// its list (ADPCM on a slow link, else PCM): the device always gets audio it can play.
// Packets: one per OPUS.frameSamples of PCM; write() keeps the remainder for the next chunk; flush() zero-pads the last
// partial frame, so the samples decoded equal the samples sent rounded up to 20 ms (never fewer: the marks stay aligned).
export const OPUS = Object.freeze({ rate: 24_000, frameSamples: 480, bitrate: 24_000 });
const FRAME_BYTES = OPUS.frameSamples * 2;

/** @type {null | (() => { encode(pcm: Int16Array): Uint8Array })} */
let factory = null;
let loading = null;
/** the factory the WASM load produced (kept: setOpusFactory(null) in a test must not unload it for good) */
let loaded = null;

/** Tests (and the loader): the encoder factory, or null to turn Opus off. */
export function setOpusFactory(f) { factory = f; }
export const opusReady = () => !!factory;

/** Load the WASM encoder once (fire and forget at first use). Resolves true when Opus can be served. */
export function loadOpus(env = process.env) {
  if (String(env.TAXILA_TTS_OPUS ?? "").toLowerCase() === "off") return Promise.resolve(false);
  if (factory) return Promise.resolve(true);
  if (loaded) { factory = loaded; return Promise.resolve(true); }
  loading ??= import(/* @vite-ignore */ "opusscript").then((m) => {
    const OpusScript = m.default ?? m;
    loaded = factory = () => {
      const enc = new OpusScript(OPUS.rate, 1, OpusScript.Application?.VOIP ?? 2048);
      try { enc.setBitrate?.(OPUS.bitrate); } catch { /* the library's default bitrate */ }
      return { encode: (pcm) => new Uint8Array(enc.encode(Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength), OPUS.frameSamples)) };
    };
    return true;
  }).catch(() => false);
  return loading;
}

/** A streaming encoder over PCM s16le bytes (any chunking) → Opus packets. Requires opusReady(). */
export function opusEncoder() {
  if (!factory) throw new Error("opus encoder not loaded");
  const enc = factory();
  let pending = Buffer.alloc(0);
  const packet = (bytes) => enc.encode(new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + FRAME_BYTES)));
  return {
    /** @param {Uint8Array} pcm @returns {Uint8Array[]} */
    write(pcm) {
      const buf = pending.length ? Buffer.concat([pending, Buffer.from(pcm)]) : Buffer.from(pcm);
      const out = [];
      let i = 0;
      for (; i + FRAME_BYTES <= buf.length; i += FRAME_BYTES) out.push(packet(buf.subarray(i, i + FRAME_BYTES)));
      pending = Buffer.from(buf.subarray(i));
      return out;
    },
    /** The last partial frame, zero-padded to 20 ms (or nothing). */
    flush() {
      if (!pending.length) return [];
      const last = Buffer.alloc(FRAME_BYTES);
      pending.copy(last, 0, 0, Math.min(pending.length, FRAME_BYTES));
      pending = Buffer.alloc(0);
      return [packet(last)];
    },
  };
}

// start loading at import: the first framed request after boot usually finds it ready
void loadOpus();
