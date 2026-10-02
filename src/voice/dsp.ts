// Pure signal math for on-device child voice features (decision voice-features-longitudinal). No DOM, no
// WebAudio: the worklet only decimates and posts samples; everything here runs on the main thread and in Node
// tests. Input is mono 16 kHz float PCM. Nothing computed here is ever an emotion label: these are acoustic
// measurements that the server z-scores against the child's OWN baseline (learning-science rule 7).

/** Analysis rate the worklet decimates to. Child f0 sits ~200-450 Hz; 16 kHz is plenty for f0 and energy. */
export const RATE = 16_000;
/** 40 ms analysis window, 20 ms hop. */
export const FRAME = 640;
export const HOP = 320;
export const HOP_MS = (HOP / RATE) * 1000;

/** f0 search range. Children ~180-500 Hz; the floor admits adults and a deep-voiced 15-year-old. */
export const F0_MIN = 70;
export const F0_MAX = 600;
/** YIN cumulative-mean-normalised-difference threshold (de Cheveigné & Kawahara 2002 use 0.10-0.15). */
export const YIN_THRESHOLD = 0.15;
/** Above this aperiodicity even the best dip is not a pitch period. */
const YIN_UNVOICED = 0.35;

/** A gap in speech at least this long is a pause; shorter dips are inter-syllable (child-reading convention). */
export const MIN_PAUSE_MS = 250;
/** A speech run shorter than this is a click or a breath, not speech (a 40 ms window smears a 30 ms click over 3 frames; a syllable is ≥100 ms). */
export const MIN_RUN_MS = 100;
/** Speech gate: this far above the adaptive noise floor, and never below the absolute floor. */
export const SPEECH_ABOVE_FLOOR_DB = 12;
export const SPEECH_ABS_MIN_DB = -50;
/** A voiced run at least this long with less than this pitch spread looks like a filled pause ("ummm"). */
export const FLAT_RUN_MS = 300;
export const FLAT_RUN_ST = 1.0;
/** Window for the terminal pitch slope (rising-intonation cue, Brennan & Williams 1995). */
export const END_SLOPE_MS = 500;

export interface Frame {
  /** Epoch ms of the window's centre. */
  t: number;
  rmsDb: number;
  /** Fundamental frequency in Hz, null when unvoiced or not speech. */
  f0: number | null;
  speech: boolean;
}

export const toDb = (rms: number): number => 20 * Math.log10(Math.max(rms, 1e-6));
/** Semitones relative to 100 Hz. */
export const st = (hz: number): number => 12 * Math.log2(hz / 100);

export function rmsOf(x: ArrayLike<number>, from = 0, to = x.length): number {
  let s = 0;
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, to - from));
}

/**
 * YIN pitch estimate for one window. Returns f0 (Hz) or null, plus the aperiodicity of the chosen lag
 * (0 = perfectly periodic). Cost ~ tauMax × (N - tauMax) multiply-adds; at 16 kHz / 640 samples ≈ 94k.
 */
export function yin(x: ArrayLike<number>, sr = RATE, fMin = F0_MIN, fMax = F0_MAX, threshold = YIN_THRESHOLD): { f0: number | null; aperiodicity: number } {
  const tauMin = Math.max(2, Math.floor(sr / fMax));
  const tauMax = Math.min(Math.ceil(sr / fMin), Math.floor(x.length / 2));
  const W = x.length - tauMax;
  if (W <= 0 || tauMax <= tauMin) return { f0: null, aperiodicity: 1 };
  const d = new Float64Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    for (let j = 0; j < W; j++) {
      const v = x[j] - x[j + tau];
      s += v * v;
    }
    d[tau] = s;
  }
  const c = new Float64Array(tauMax + 1);
  c[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    run += d[tau];
    c[tau] = run > 0 ? (d[tau] * tau) / run : 1;
  }
  let best = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (c[tau] < threshold) {
      while (tau + 1 <= tauMax && c[tau + 1] < c[tau]) tau++;
      best = tau;
      break;
    }
  }
  if (best < 0) {
    let min = Infinity;
    for (let tau = tauMin; tau <= tauMax; tau++) if (c[tau] < min) { min = c[tau]; best = tau; }
    if (min > YIN_UNVOICED) return { f0: null, aperiodicity: min };
  }
  // Parabolic interpolation on the normalised difference around the chosen lag.
  let tauF = best;
  if (best > 1 && best < tauMax) {
    const a = c[best - 1], b = c[best], e = c[best + 1];
    const den = a - 2 * b + e;
    if (den > 0) tauF = best + (a - e) / (2 * den);
  }
  const f0 = sr / tauF;
  if (!(f0 >= fMin * 0.95 && f0 <= fMax * 1.05)) return { f0: null, aperiodicity: c[best] };
  return { f0, aperiodicity: c[best] };
}

/**
 * Streaming framer + per-frame analysis. push() 16 kHz samples with the epoch time of their first sample;
 * complete frames come back. Keeps an adaptive noise floor (fast down, slow up) for the speech gate, so a
 * fan or a TV raises the bar instead of reading as continuous speech.
 */
export class FrameAnalyzer {
  private buf = new Float32Array(FRAME * 4);
  private len = 0;
  /** Epoch ms of buf[0]. */
  private t0 = 0;
  floorDb = -60;

  push(samples: Float32Array, startMs: number): Frame[] {
    if (this.len === 0) this.t0 = startMs;
    else {
      // Re-anchor if the stream jumped (a dropped chunk): never let frame times drift from the clock.
      const expected = this.t0 + (this.len / RATE) * 1000;
      if (Math.abs(startMs - expected) > 100) { this.len = 0; this.t0 = startMs; }
    }
    if (this.len + samples.length > this.buf.length) {
      const nb = new Float32Array(Math.max(this.buf.length * 2, this.len + samples.length));
      nb.set(this.buf.subarray(0, this.len));
      this.buf = nb;
    }
    this.buf.set(samples, this.len);
    this.len += samples.length;
    const out: Frame[] = [];
    let off = 0;
    while (this.len - off >= FRAME) {
      out.push(this.analyse(this.buf.subarray(off, off + FRAME), this.t0 + ((off + FRAME / 2) / RATE) * 1000));
      off += HOP;
    }
    if (off > 0) {
      this.buf.copyWithin(0, off, this.len);
      this.len -= off;
      this.t0 += (off / RATE) * 1000;
    }
    return out;
  }

  private analyse(x: Float32Array, t: number): Frame {
    const rmsDb = toDb(rmsOf(x));
    this.floorDb = rmsDb < this.floorDb ? 0.8 * this.floorDb + 0.2 * rmsDb : this.floorDb + Math.min(0.05, (rmsDb - this.floorDb) * 0.005);
    this.floorDb = Math.min(-35, Math.max(-90, this.floorDb));
    const speech = rmsDb > Math.max(this.floorDb + SPEECH_ABOVE_FLOOR_DB, SPEECH_ABS_MIN_DB);
    // Pitch only on speech frames: most of a lesson is silence, so this is most of the CPU saving.
    const f0 = speech ? yin(x).f0 : null;
    return { t, rmsDb, f0, speech };
  }
}

// ───────────── utterance statistics ─────────────

export interface AcousticStats {
  /** Epoch ms of the first / last speech frame (window centres ± half a hop). */
  speechStartAt: number;
  speechEndAt: number;
  durationMs: number;
  voicedFrac: number;
  f0MedianHz?: number;
  f0IqrSt?: number;
  f0SlopeStPerS?: number;
  f0EndSlopeStPerS?: number;
  rmsMeanDb: number;
  rmsStdDb: number;
  rmsP90Db: number;
  pauseCount: number;
  pauseTotalMs: number;
  longestPauseMs: number;
  pauseFrac: number;
  flatVoicedRuns: number;
}

export function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
const median = (xs: number[]) => quantile([...xs].sort((a, b) => a - b), 0.5);

/** Ordinary least-squares slope of y on x; null with fewer than `min` points or no x spread. */
export function olsSlope(xs: number[], ys: number[], min = 3): number | null {
  const n = xs.length;
  if (n < min) return null;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
  mx /= n; my /= n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  return sxx > 0 ? sxy / sxx : null;
}

/** Speech runs [startIdx, endIdx] after dropping clicks and bridging dips shorter than a pause. */
export function speechRuns(frames: Frame[], hopMs = HOP_MS): Array<[number, number]> {
  const raw: Array<[number, number]> = [];
  let s = -1;
  frames.forEach((f, i) => {
    if (f.speech && s < 0) s = i;
    if (!f.speech && s >= 0) { raw.push([s, i - 1]); s = -1; }
  });
  if (s >= 0) raw.push([s, frames.length - 1]);
  const minRun = Math.ceil(MIN_RUN_MS / hopMs);
  const kept = raw.filter(([a, b]) => b - a + 1 >= minRun);
  const merged: Array<[number, number]> = [];
  const minGap = Math.ceil(MIN_PAUSE_MS / hopMs);
  for (const r of kept) {
    const last = merged.at(-1);
    if (last && r[0] - last[1] - 1 < minGap) last[1] = r[1];
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

/** Statistics over a window of frames; null when the window holds no speech. */
export function utteranceStats(frames: Frame[], hopMs = HOP_MS): AcousticStats | null {
  const runs = speechRuns(frames, hopMs);
  if (!runs.length) return null;
  const a = runs[0][0], b = runs.at(-1)![1];
  const region = frames.slice(a, b + 1);
  const durationMs = region.length * hopMs;

  let pauseTotalMs = 0, longestPauseMs = 0;
  for (let i = 1; i < runs.length; i++) {
    const gap = (runs[i][0] - runs[i - 1][1] - 1) * hopMs;
    pauseTotalMs += gap;
    longestPauseMs = Math.max(longestPauseMs, gap);
  }

  const speechFrames = region.filter((f) => f.speech);
  const db = speechFrames.map((f) => f.rmsDb);
  const mean = db.reduce((s, v) => s + v, 0) / db.length;
  const sd = Math.sqrt(db.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, db.length - 1));

  // Pitch track with octave-error cleanup: drop estimates more than ~an octave from the median.
  const raw = region.filter((f) => f.f0 != null);
  const m0 = median(raw.map((f) => f.f0!));
  const voiced = raw.filter((f) => f.f0! > m0 / 1.8 && f.f0! < m0 * 1.8);
  const out: AcousticStats = {
    speechStartAt: region[0].t - hopMs / 2,
    speechEndAt: region.at(-1)!.t + hopMs / 2,
    durationMs,
    voicedFrac: voiced.length / region.length,
    rmsMeanDb: mean,
    rmsStdDb: sd,
    rmsP90Db: quantile([...db].sort((x, y) => x - y), 0.9),
    pauseCount: runs.length - 1,
    pauseTotalMs,
    longestPauseMs,
    pauseFrac: pauseTotalMs / durationMs,
    flatVoicedRuns: 0,
  };
  if (voiced.length >= 3) {
    const sts = voiced.map((f) => st(f.f0!));
    const sorted = [...sts].sort((x, y) => x - y);
    out.f0MedianHz = median(voiced.map((f) => f.f0!));
    out.f0IqrSt = quantile(sorted, 0.75) - quantile(sorted, 0.25);
    const slope = olsSlope(voiced.map((f) => f.t / 1000), sts, 5);
    if (slope != null) out.f0SlopeStPerS = slope;
    const tail = voiced.filter((f) => f.t >= out.speechEndAt - END_SLOPE_MS);
    const endSlope = olsSlope(tail.map((f) => f.t / 1000), tail.map((f) => st(f.f0!)), 5);
    if (endSlope != null) out.f0EndSlopeStPerS = endSlope;
  }
  out.flatVoicedRuns = flatVoicedRuns(region, hopMs);
  return out;
}

/** Voiced runs long enough and flat enough to look like a filled pause. An ASR-independent filler proxy. */
export function flatVoicedRuns(frames: Frame[], hopMs = HOP_MS): number {
  const need = Math.ceil(FLAT_RUN_MS / hopMs);
  let count = 0;
  let run: number[] = [];
  const close = () => {
    if (run.length >= need) {
      const s = [...run].sort((x, y) => x - y);
      if (quantile(s, 0.9) - quantile(s, 0.1) < FLAT_RUN_ST) count++;
    }
    run = [];
  };
  for (const f of frames) {
    if (f.f0 != null) run.push(st(f.f0));
    else close();
  }
  close();
  return count;
}
