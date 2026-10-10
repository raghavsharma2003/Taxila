// The pause realiser (HUMAN-VOICE §5.8 without the clips; HV-5's successor). Plain DragonHD pauses are nearly uniform
// (pause SD 0.06 s, a robotic tell [M]); the planned pause between two TTS parts is therefore written as EXACT digital
// silence after trimming the engine's own edge silence, so the pause the plan chose is the pause the child hears.
// Owner 2026-10-04: no spliced breath/hum/laugh clips, so nothing but silence is ever inserted.
//
// edgeTrim() is a streaming transform over PCM s16le (24 kHz mono):
//   lead  drop the leading run below the threshold (keeping KEEP_MS before the onset; at most MAX_LEAD_MS is dropped,
//         so a soft onset is never eaten);
//   tail  hold back the quiet run after the last loud frame (at most MAX_TAIL_MS of it) and, at the end, drop it
//         (keeping KEEP_TAIL_MS); loud audio is never held, so the first byte is not delayed.
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
export async function* edgeTrim(src, { lead = false, tail = false, onLead } = {}) {
  let carry = Buffer.alloc(0);
  let consumed = 0; // samples taken from src while leading (V4: onLead reports how many the trim removed)
  let leading = lead;
  let held = Buffer.alloc(0); // tail hold-back: the quiet run after the last loud frame
  let loudSeen = false, quietTail = false; // quietTail: the held run starts right after a loud frame (keep KEEP_TAIL_MS of it)
  let dropped = 0;
  let pre = Buffer.alloc(0);
  for await (const piece of src) {
    let buf = Buffer.concat([carry, Buffer.from(piece)]);
    const even = buf.length & ~1;
    carry = buf.subarray(even);
    buf = buf.subarray(0, even);
    if (leading) {
      consumed += buf.length >> 1;
      // the dropped audio's last KEEP_MS rides along, so the pre-roll survives any chunk boundary
      const all = Buffer.concat([pre, buf]);
      const on = onsetOf(all);
      if (on < 0 && dropped + (buf.length >> 1) <= samplesOf(MAX_LEAD_MS)) {
        dropped += buf.length >> 1;
        pre = all.subarray(Math.max(0, all.length - samplesOf(KEEP_MS) * 2));
        continue;
      }
      const cut = on < 0 ? 0 : Math.max(0, on - samplesOf(KEEP_MS));
      buf = all.subarray(cut * 2);
      leading = false;
      // samples removed before the first kept one = consumed - kept (V4: the face shifts the part's viseme offsets by it)
      try { onLead?.(consumed - (buf.length >> 1)); } catch { /* a listener never stops the voice */ }
    }
    if (!tail) { if (buf.length) yield buf; continue; }
    // r4-latency: only the QUIET run after the last loud frame is held back (at most MAX_TAIL_MS of it); everything up to
    // that frame goes out at once. The old rule held back the last MAX_TAIL_MS of ALL audio, so part 0 of every multi-part
    // reply waited for 800 ms of synthesis before its first byte (+250-350 ms of first sound, evals/latency/dhd-ttfb-region.mjs
    // 2026-10-10). The bytes written are the same rule's: the trailing quiet run is cut to KEEP_TAIL_MS at the end, and a
    // quiet run longer than MAX_TAIL_MS is only ever trimmed in its last MAX_TAIL_MS.
    held = Buffer.concat([held, buf]);
    const off = offsetOf(held);
    if (off > 0) {
      yield Buffer.from(held.subarray(0, off * 2));
      held = held.subarray(off * 2);
      loudSeen = true;
      quietTail = true;
    }
    const keep = samplesOf(MAX_TAIL_MS) * 2;
    if (held.length > keep) {
      yield Buffer.from(held.subarray(0, held.length - keep));
      held = held.subarray(held.length - keep);
      quietTail = false; // the last loud frame is now more than MAX_TAIL_MS back: the window holds no loud audio
    }
  }
  if (tail && held.length && loudSeen && quietTail) {
    const end = Math.min(held.length >> 1, samplesOf(KEEP_TAIL_MS));
    if (end) yield held.subarray(0, end * 2);
  }
  if (carry.length && !tail) yield Buffer.from(carry);
}
