// The pause realiser (HUMAN-VOICE §5.8 without the clips; HV-5's successor). Plain DragonHD pauses are nearly uniform
// (pause SD 0.06 s, a robotic tell [M]); the planned pause between two TTS parts is therefore written as EXACT digital
// silence after trimming the engine's own edge silence, so the pause the plan chose is the pause the child hears.
// Owner 2026-10-04: no spliced breath/hum/laugh clips, so nothing but silence is ever inserted.
//
// edgeTrim() is a streaming transform over PCM s16le (24 kHz mono):
//   lead  drop the leading run below the threshold (keeping KEEP_MS before the onset; at most MAX_LEAD_MS is dropped,
//         so a soft onset is never eaten);
//   tail  hold back up to MAX_TAIL_MS and, at the end, drop the trailing run below the threshold (keeping KEEP_TAIL_MS).
// Odd byte boundaries are carried. Pure apart from the async iteration; tested on synthetic streams.
export const RATE = 24_000;
export const THRESH = Math.round(32768 * 10 ** (-50 / 20)); // -50 dBFS on a 10 ms frame's peak
export const FRAME = RATE / 100; // 10 ms
export const KEEP_MS = 30, KEEP_TAIL_MS = 40, MAX_LEAD_MS = 600, MAX_TAIL_MS = 800;

const samplesOf = (ms) => Math.round((RATE * ms) / 1000);
/** n ms of digital silence (PCM s16le). */
export const silence = (ms) => Buffer.alloc(samplesOf(Math.max(0, ms)) * 2);

/** Index (in samples) of the first 10 ms frame whose peak reaches the threshold, or -1. */
export function onsetOf(buf, from = 0) {
  const n = buf.length >> 1;
  for (let f = from; f < n; f += FRAME) {
    const end = Math.min(n, f + FRAME);
    for (let i = f; i < end; i++) if (Math.abs(buf.readInt16LE(i * 2)) >= THRESH) return f;
  }
  return -1;
}
/** Sample index just after the last frame reaching the threshold, or 0. */
export function offsetOf(buf) {
  const n = buf.length >> 1;
  for (let f = Math.floor((n - 1) / FRAME) * FRAME; f >= 0; f -= FRAME) {
    const end = Math.min(n, f + FRAME);
    for (let i = f; i < end; i++) if (Math.abs(buf.readInt16LE(i * 2)) >= THRESH) return end;
  }
  return 0;
}

/**
 * @param {AsyncIterable<Uint8Array>} src
 * @param {{ lead?: boolean, tail?: boolean }} o
 * @returns {AsyncGenerator<Buffer>}
 */
export async function* edgeTrim(src, { lead = false, tail = false } = {}) {
  let carry = Buffer.alloc(0);
  let leading = lead;
  let held = Buffer.alloc(0); // tail hold-back
  let dropped = 0;
  for await (const piece of src) {
    let buf = Buffer.concat([carry, Buffer.from(piece)]);
    const even = buf.length & ~1;
    carry = buf.subarray(even);
    buf = buf.subarray(0, even);
    if (leading) {
      const on = onsetOf(buf);
      if (on < 0 && dropped + (buf.length >> 1) <= samplesOf(MAX_LEAD_MS)) { dropped += buf.length >> 1; continue; }
      const cut = on < 0 ? 0 : Math.max(0, on - samplesOf(KEEP_MS));
      buf = buf.subarray(cut * 2);
      leading = false;
    }
    if (!tail) { if (buf.length) yield buf; continue; }
    held = Buffer.concat([held, buf]);
    const keep = samplesOf(MAX_TAIL_MS) * 2;
    if (held.length > keep) {
      const out = held.subarray(0, held.length - keep);
      held = held.subarray(held.length - keep);
      yield Buffer.from(out);
    }
  }
  if (tail && held.length) {
    const off = offsetOf(held);
    const end = off === 0 ? 0 : Math.min(held.length >> 1, off + samplesOf(KEEP_TAIL_MS));
    if (end) yield held.subarray(0, end * 2);
  }
  if (carry.length && !tail) yield Buffer.from(carry);
}
