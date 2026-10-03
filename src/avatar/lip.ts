// Lip driver, phase 1 (AVATAR.md §3.1, M0): pure DSP on the teacher tap's time-domain window, read once per
// render tick on the main thread. Nothing here creates an audio node; the caller owns one analysis-only
// AnalyserNode hung off the existing teacher meter (src/avatar/tap.ts), which never reaches a destination.
//
//   jaw   = RMS over the last 512 samples → level-normalised gate/gain → one-pole τ (the benched 50 ms) → × jawCeiling
//   VAD   = voiced ≥ 2 frames → her onset; unvoiced ≥ 250 ms → her offset (the canonical speaking signal, §3.5)
//   shape = a cheap spectral tilt (one-pole low/high split): bright → "wide", dark → "round", at reduced weight,
//           gated by jaw energy. M0 only; M1 replaces it with Hindi-retrained HeadAudio classes + lipMatrix.
//
// Level normalisation (§3.1, GR-9): the received level after Opus/AGC/TTS gain is unknown, so the gate and gain
// track a running voiced-level reference (p90 of voiced-frame RMS over the last ~10 s).

export interface LipFrame {
  /** Seconds on the caller's clock (the tap's AudioContext.currentTime, or performance.now()/1000). */
  t: number;
  rms: number;
  /** 0..jawCeiling, smoothed. */
  jaw: number;
  /** Frame-level voicing (raw, before the onset/offset hysteresis). */
  voiced: boolean;
  /** Her speech state after hysteresis: true from onset until ≥ 250 ms of silence. */
  speaking: boolean;
  /** Ms since the last voiced frame (0 while voiced). */
  silenceMs: number;
  /** Mouth-shape cues 0..1 (already × shapeGain). */
  wide: number;
  round: number;
}

export interface LipOptions {
  /** Symmetric one-pole time constant for the jaw (ms). 50 = the bench's (bench/bench.mjs smooth()). */
  tauMs?: number;
  jawCeiling?: number;
  /** < 1: shapes are a hint on top of the jaw, never the driver (M1 decides the real weight). */
  shapeGain?: number;
  /** Starting voiced reference RMS before any speech is seen (full-scale float). */
  initialRef?: number;
  /** Gate as a fraction of the voiced reference. */
  gateFrac?: number;
  /** Full openness at refScale × the voiced reference. */
  refScale?: number;
  /** Exponent on the normalised openness (1 = linear). */
  curve?: number;
}

const RMS_N = 512;
const SHAPE_N = 1024;
const ONSET_FRAMES = 2;
const OFFSET_MS = 250;
const REF_WINDOW = 300; // voiced frames kept for the p90 reference (~10 s at 30 Hz)

export function rmsOf(buf: Float32Array, n = RMS_N): number {
  const start = Math.max(0, buf.length - n);
  let s = 0;
  for (let i = start; i < buf.length; i++) s += buf[i] * buf[i];
  const len = buf.length - start;
  return len > 0 ? Math.sqrt(s / len) : 0;
}

/** Share of energy above a one-pole ~1.2 kHz split, over the last `n` samples: 0 dark … 1 bright. */
export function brightness(buf: Float32Array, sampleRate: number, n = SHAPE_N): number {
  const start = Math.max(0, buf.length - n);
  const a = 1 - Math.exp((-2 * Math.PI * 1200) / sampleRate);
  let lp = 0, lo = 0, hi = 0;
  for (let i = start; i < buf.length; i++) {
    const x = buf[i];
    lp += a * (x - lp);
    const h = x - lp;
    lo += lp * lp;
    hi += h * h;
  }
  const tot = lo + hi;
  return tot > 1e-12 ? hi / tot : 0;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export class LipDriver {
  readonly sampleRate: number;
  private tau: number;
  private ceiling: number;
  private shapeGain: number;
  private ref: number;
  private gateFrac: number;
  private refScale: number;
  private curve: number;
  private refRing: number[] = [];
  private refDirty = 0;
  private jaw = 0;
  private wide = 0;
  private round = 0;
  private lastT = -1;
  private voicedRun = 0;
  private lastVoicedT = -Infinity;
  private speaking = false;

  constructor(sampleRate: number, o: LipOptions = {}) {
    this.sampleRate = sampleRate;
    this.tau = (o.tauMs ?? 50) / 1000;
    this.ceiling = o.jawCeiling ?? 0.85;
    this.shapeGain = o.shapeGain ?? 0.35;
    this.ref = o.initialRef ?? 0.06;
    // Defaults chosen on evals/avatar/lip-bench.mjs (2026-10-03): {gateFrac 0.06, refScale 0.7, curve 1} keeps
    // r(open) within 0.005 of the fixed-gain RMS arm at the bench's level while staying level-normalised.
    this.gateFrac = o.gateFrac ?? 0.06;
    this.refScale = o.refScale ?? 0.7;
    this.curve = o.curve ?? 1;
  }

  /** The current voiced-level reference (for tests and telemetry). */
  get reference(): number {
    return this.ref;
  }

  /** Flush on reconnect (a new stream): the face holds rest pose, the level reference is kept. */
  reset(): void {
    this.jaw = this.wide = this.round = 0;
    this.voicedRun = 0;
    this.speaking = false;
    this.lastT = -1;
    this.lastVoicedT = -Infinity;
  }

  private gate(): number {
    return Math.max(0.004, this.ref * this.gateFrac);
  }

  /** One analysis step. `buf` is the latest time-domain window (≥ 512 samples), `t` seconds. */
  step(buf: Float32Array, t: number): LipFrame {
    const dt = this.lastT < 0 ? 1 / 30 : Math.max(0, Math.min(0.25, t - this.lastT));
    this.lastT = t;
    const rms = rmsOf(buf);
    const gate = this.gate();
    const voiced = rms > Math.max(gate * 1.6, 0.006);

    // Reference: p90 of voiced RMS, recomputed every 15 voiced frames (cheap; 300-entry sort).
    if (voiced) {
      this.refRing.push(rms);
      if (this.refRing.length > REF_WINDOW) this.refRing.shift();
      if (++this.refDirty >= 15 && this.refRing.length >= 15) {
        this.refDirty = 0;
        const s = [...this.refRing].sort((x, y) => x - y);
        this.ref = Math.max(0.01, s[Math.floor(0.9 * (s.length - 1))]);
      }
    }

    // Hysteresis VAD.
    this.voicedRun = voiced ? this.voicedRun + 1 : 0;
    if (voiced) this.lastVoicedT = t;
    const silenceMs = voiced ? 0 : Math.max(0, (t - this.lastVoicedT) * 1000);
    if (!this.speaking && this.voicedRun >= ONSET_FRAMES) this.speaking = true;
    else if (this.speaking && !voiced && silenceMs >= OFFSET_MS) this.speaking = false;

    // Jaw: normalised openness, gentle compressive curve, one-pole.
    const open = clamp01((rms - gate) / Math.max(1e-4, this.ref * this.refScale - gate));
    const target = this.ceiling * Math.pow(open, this.curve);
    const a = 1 - Math.exp(-dt / this.tau);
    this.jaw += a * (target - this.jaw);
    if (this.jaw < 0.005) this.jaw = 0;

    // Shape hint, gated by the jaw so silence and closures never carry a shape.
    const g = clamp01((this.jaw - 0.05) / 0.25);
    const b = voiced ? brightness(buf, this.sampleRate) : 0;
    const wideT = voiced ? clamp01((b - 0.3) / 0.3) * g : 0;
    const roundT = voiced ? clamp01((0.12 - b) / 0.1) * g : 0;
    const as = 1 - Math.exp(-dt / 0.06);
    this.wide += as * (wideT - this.wide);
    this.round += as * (roundT - this.round);

    return {
      t, rms, jaw: this.jaw, voiced, speaking: this.speaking, silenceMs,
      wide: this.wide * this.shapeGain, round: this.round * this.shapeGain,
    };
  }
}

/** ARKit lip keys from one frame. The lip layer owns these keys (§4.5); mouthClose stays ≤ jawOpen by construction. */
export function lipKeys(f: Pick<LipFrame, "jaw" | "wide" | "round">): Record<string, number> {
  return {
    jawOpen: f.jaw,
    mouthClose: 0,
    mouthFunnel: f.round * 0.9,
    mouthPucker: f.round * 0.6,
    mouthStretchLeft: f.wide * 0.7,
    mouthStretchRight: f.wide * 0.7,
  };
}

/**
 * A short delay line on the FACE stream (never the audio): `faceDelayMs` per output route (§3.3). M0 ships the
 * {speaker 0, wired 0} defaults; A2DP's 150 ms waits for E-P8. Reads the newest frame at or before t − delay.
 */
export class LipRing {
  private ring: LipFrame[] = [];
  private readonly size: number;
  constructor(size = 64) {
    this.size = size;
  }
  push(f: LipFrame): void {
    this.ring.push(f);
    if (this.ring.length > this.size) this.ring.shift();
  }
  flush(): void {
    this.ring = [];
  }
  read(t: number, delayMs: number): LipFrame | null {
    const at = t - delayMs / 1000;
    for (let i = this.ring.length - 1; i >= 0; i--) if (this.ring[i].t <= at + 1e-6) return this.ring[i];
    return this.ring[0] ?? null;
  }
}
