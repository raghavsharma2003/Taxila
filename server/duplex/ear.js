// LISTEN, the fast ear (ARCHITECTURE.md §2.1): acoustic features at frame rate (20 ms), on the device. It times
// everything (onset, silence run, candidate endpoint, backchannel opportunities); the STT final decides content.
// Pure and browser-safe. Onset uses the SHIPPED EnergyVad (src/lesson/vad.ts, imported, never copied) so duck/pause keep
// today's measured ~90 ms; the silence run is counted here from the same loud/quiet rule because EnergyVad's own offset
// waits 400 ms, longer than a backchannel dip.
//
// Prosody is used ONLY for floor timing (pitch slope, energy slope, the child's own pitch tercile). No affect label is
// computed, stored or returned (`ct-no-voice-emotion-inference`).
import { EnergyVad } from "../../src/lesson/vad.ts";

export const FRAME_MS = 20;

/** Least-squares slope of y over x (per second), or 0 with fewer than 3 points. */
function slope(pts) {
  if (pts.length < 3) return 0;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const n = pts.length, d = n * sxx - sx * sx;
  return d === 0 ? 0 : ((n * sxy - sx * sy) / d) * 1000;
}

export class Ear {
  constructor(opts = {}) {
    this.vad = new EnergyVad(opts.vad || {});
    this.frameMs = opts.frameMs || FRAME_MS;
    /** voiced-frame history for slopes: [t, dB, f0|null], last 600 ms */
    this.hist = [];
    /** every voiced f0 this session (semitone-free Hz), capped, for the child's own tercile */
    this.f0s = [];
    this.lastLoudAt = -Infinity;
    this.voicedMsTurn = 0;
    this.speaking = false;
    this.lastT = null;
  }

  /** Reset the per-turn counters (a new child turn starts; the session pitch range is kept). */
  newTurn() { this.voicedMsTurn = 0; }

  /** Is this frame loud by EnergyVad's own rule (floor + onsetDb, absolute minimum)? Reads the VAD's floor after push. */
  isLoud(db) { const o = this.vad.opts; return db >= Math.max(o.minDb, this.vad.floorDb + o.offsetDb + 2); }

  /**
   * One frame. `rms` linear 0..1, `f0` Hz or null.
   * @returns {{ t:number, edge: "onset"|"sustain"|"offset"|null, loud:boolean, silenceMs:number, voicedMsTurn:number }}
   */
  push(t, rms, f0) {
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;
    const edge = this.vad.push(rms, this.frameMs);
    if (edge === "onset") this.speaking = true;
    if (edge === "offset") this.speaking = false;
    const loud = this.isLoud(db);
    if (loud) {
      this.lastLoudAt = t;
      this.voicedMsTurn += this.frameMs;
      this.hist.push([t, db, f0 ?? null]);
      if (f0) { this.f0s.push(f0); if (this.f0s.length > 3000) this.f0s.splice(0, 1000); }
    }
    while (this.hist.length && this.hist[0][0] < t - 600) this.hist.shift();
    this.lastT = t;
    return { t, edge, loud, silenceMs: loud ? 0 : t - this.lastLoudAt, voicedMsTurn: this.voicedMsTurn };
  }

  /** The child's lower pitch tercile boundary (Hz), or null before 1.5 s of voiced pitch. */
  lowTercile() {
    if (this.f0s.length < 75) return null;
    const s = [...this.f0s].sort((a, b) => a - b);
    return s[Math.floor(s.length / 3)];
  }

  /**
   * Prosody of the last 300 ms of voice before the current silence: pitch slope (Hz/s), energy slope (dB/s), whether the
   * final pitch sits in the child's low tercile, whether the contour rose. Timing cues only.
   */
  prosody() {
    const end = this.lastLoudAt;
    const win = this.hist.filter(([t]) => t > end - 300 && t <= end);
    const pf = win.filter(([, , f]) => f).map(([t, , f]) => [t, f]);
    const pe = win.map(([t, d]) => [t, d]);
    const pitchSlope = slope(pf), energySlope = slope(pe);
    const lt = this.lowTercile();
    const lastF0 = pf.length ? pf.slice(-3).reduce((a, [, f]) => a + f, 0) / Math.min(3, pf.length) : null;
    return {
      pitchSlope, energySlope, n: pf.length,
      lowPitch: lt !== null && lastF0 !== null && lastF0 <= lt,
      falling: pitchSlope < -40 && energySlope < -10,
      rising: pitchSlope > 60,
    };
  }
}
