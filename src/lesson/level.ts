// Audio levels for meters and lip-sync. An AnalyserNode is read once per animation frame on the main
// thread; nothing here runs on the audio thread (inherited constraint: rendering work on the audio thread
// is the CPU-contention failure class on mid-range Android). One shared rAF loop serves every meter.

/** Map RMS amplitude to a 0..1 perceptual level: -60 dBFS → 0, -10 dBFS → 1. */
export function levelFromRms(rms: number): number {
  if (!(rms > 0)) return 0;
  const db = 20 * Math.log10(rms);
  return Math.min(1, Math.max(0, (db + 60) / 50));
}

const ATTACK = 0.55; // fast rise so mouth opens on the syllable
const RELEASE = 0.18; // slower fall so it does not flicker between syllables

const active = new Set<LevelMeter>();
let raf = 0;

function frame(): void {
  for (const m of active) m.tick();
  raf = active.size ? requestAnimationFrame(frame) : 0;
}

export class LevelMeter {
  /** Smoothed level 0..1, updated every animation frame while attached. */
  value = 0;
  private analyser: AnalyserNode | null = null;
  private buf: Float32Array<ArrayBuffer> | null = null;
  private listeners = new Set<(v: number) => void>();
  private taps = new Set<(a: AnalyserNode | null) => void>();

  attach(analyser: AnalyserNode): void {
    this.analyser = analyser;
    this.buf = new Float32Array(analyser.fftSize);
    active.add(this);
    if (!raf && typeof requestAnimationFrame === "function") raf = requestAnimationFrame(frame);
    for (const fn of [...this.taps]) fn(analyser);
  }

  detach(): void {
    this.analyser = null;
    this.buf = null;
    active.delete(this);
    this.value = 0;
    this.notify();
    for (const fn of [...this.taps]) fn(null);
  }

  /**
   * The audio tap behind this meter, for the 3D tutor's lip driver (AVATAR.md §2.2 "LevelMeter.onTap"): fires now
   * with the current analyser (if attached) and again on every attach (each reconnect / new stream makes a new
   * one) and with null on detach. A consumer may connect its OWN analysis-only node to the analyser's output (an
   * AnalyserNode passes its input through); it must never connect anything to a destination.
   */
  onTap(fn: (a: AnalyserNode | null) => void): () => void {
    this.taps.add(fn);
    if (this.analyser) fn(this.analyser);
    return () => this.taps.delete(fn);
  }

  /** Per-frame callback; use it to drive a mouth or meter without re-rendering React. */
  subscribe = (fn: (v: number) => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  /** One sample; called by the shared animation-frame loop. */
  tick(): void {
    if (!this.analyser || !this.buf) return;
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const target = levelFromRms(Math.sqrt(sum / this.buf.length));
    this.value += (target - this.value) * (target > this.value ? ATTACK : RELEASE);
    this.notify();
  }

  private notify(): void {
    for (const fn of [...this.listeners]) fn(this.value);
  }
}

/** An analyser tuned for level reading (no FFT smoothing; ~21 ms window at 48 kHz). */
export function createLevelAnalyser(ctx: AudioContext, source: AudioNode): AnalyserNode {
  const a = ctx.createAnalyser();
  a.fftSize = 1024;
  a.smoothingTimeConstant = 0;
  source.connect(a);
  return a;
}
