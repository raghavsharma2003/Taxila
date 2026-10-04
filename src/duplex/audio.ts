/**
 * The child's acoustic state at frame rate (ARCHITECTURE.md v2 §2.1 "frame" clock, §2.3 ChildAudio / ProsodyFrame).
 * 20 ms frames of RMS + YIN f0 (the shipped src/voice/dsp.ts / featureWorklet.ts produce them on the device) → voicing,
 * the silence run, voiced runs, pauses, prosody, and the VOICED LOG the lexical horizon needs (unseenVoicedMs).
 *
 * Supersedes server/duplex/ear.js for the v2 engine (ear.js stays frozen inside the v1 floor manager, baseline B3).
 * The noise floor is the shipped EnergyVad's (src/lesson/vad.ts, imported, never copied), so "loud" means what the
 * cascade lane's duck already means.
 *
 * Prosody is used for floor TIMING only. No affect label is computed, stored or returned (`ct-no-voice-emotion-inference`).
 * Erasable TypeScript.
 */
import { EnergyVad } from "../lesson/vad.ts";
import type { ChildAudio, Ms, ProsodyFrame } from "./engine.ts";
import { AUDIO } from "./config.ts";

const st = (hz: number): number => 12 * Math.log2(hz / 100);

/** OLS slope of y over x, per second (x in ms); null with fewer than `min` points. */
function slopePerS(pts: Array<[number, number]>, min = 3): number | null {
  if (pts.length < min) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const n = pts.length, d = n * sxx - sx * sx;
  return d === 0 ? null : ((n * sxy - sx * sy) / d) * 1000;
}

export type AudioEdge = "onset" | "offset" | null;

export interface FrameResult {
  edge: AudioEdge;
  loud: boolean;
  /** The edge's audio time (an onset is back-dated to its first loud frame; an offset to the last loud frame's end). */
  edgeAt: Ms | null;
}

export class ChildAudioTracker {
  private readonly vad = new EnergyVad();
  private readonly frameMs: Ms;
  /** voiced frames of the last 2 s: [t, dB, f0|null] */
  private hist: Array<[number, number, number | null]> = [];
  /** voiced f0 this session (Hz), capped, for the child's own range */
  private f0s: number[] = [];
  /** voiced runs (session clock), for the horizon: [start, end] */
  private runs: Array<[number, number]> = [];
  private runDurs: number[] = [];
  private loudRun = 0;
  private firstLoudOfRun: number | null = null;
  private lastLoudAt = -Infinity;
  private voicingNow = false;
  private runStart: number | null = null;
  private lastDb = -100;
  private turnStart: Ms = 0;
  private turnVoiced = 0;
  private pauses = 0;
  private firstOnset: Ms | null = null;
  private lastOnset: Ms | null = null;
  private lastOffset: Ms | null = null;
  /** her output level at the device (dBFS), for the double-talk threshold; null = unknown */
  private herDb: number | null = null;
  private herMarginDb = 6;
  t: Ms = 0;

  constructor(opts: { frameMs?: Ms; herMarginDb?: number } = {}) {
    this.frameMs = opts.frameMs ?? AUDIO.frameMs;
    if (opts.herMarginDb !== undefined) this.herMarginDb = opts.herMarginDb;
  }

  /** A new turn: per-turn counters reset; the session's pitch range and voiced log are kept. */
  beginTurn(t: Ms): void {
    this.turnStart = t;
    this.turnVoiced = 0;
    this.pauses = 0;
    this.firstOnset = this.voicingNow ? t : null;
    this.lastOnset = this.voicingNow ? t : null;
    this.lastOffset = null;
  }

  /** Her playback level at the device output while she speaks (null when silent or unknown). */
  setHerLevel(db: number | null): void { this.herDb = db; }

  /**
   * Minimum-statistics noise floor (Martin 2001, simplified): the 5th percentile of the last 5 s of frame levels. The shipped
   * EnergyVad adapts its floor only while it believes nobody speaks, so a mic that OPENS in a noisy room (fan, TV bed at
   * -40 dBFS) latches "speaking" on frame 1 and never learns the floor: no silence is ever seen and no turn ever ends
   * (TaxilaFDB noisy streams, 2026-10-04: 0 offsets in 8.4 s). This floor needs no speech/non-speech decision.
   */
  private lvl: number[] = [];
  private minStatFloor(): number {
    if (this.lvl.length < 10) return -90;
    const s = [...this.lvl].sort((a, b) => a - b);
    return s[Math.floor(0.05 * (s.length - 1))];
  }

  /** Loud by the shipped EnergyVad's floor (floor + offsetDb + 2, absolute minimum), and above her echo while she speaks. */
  private isLoud(db: number): boolean {
    const o = this.vad.opts;
    const base = Math.max(o.minDb, Math.max(this.vad.floorDb, this.minStatFloor()) + o.offsetDb + 2);
    return db >= base && (this.herDb === null || db >= this.herDb + this.herMarginDb);
  }

  push(t: Ms, rms: number, f0: number | null): FrameResult {
    this.t = t;
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;
    this.lastDb = db;
    this.lvl.push(db);
    if (this.lvl.length > 5000 / this.frameMs) this.lvl.shift();
    this.vad.push(rms, this.frameMs);
    const loud = this.isLoud(db);
    let edge: AudioEdge = null;
    let edgeAt: Ms | null = null;
    if (loud) {
      if (this.firstLoudOfRun === null) this.firstLoudOfRun = t;
      this.loudRun += this.frameMs;
      this.lastLoudAt = t;
      this.hist.push([t, db, f0]);
      if (f0) { this.f0s.push(f0); if (this.f0s.length > 3000) this.f0s.splice(0, 1000); }
      // onset: 2 loud frames (40 ms) after a quiet spell longer than the hangover; back-dated to the first loud frame
      if (!this.voicingNow && this.loudRun >= 2 * this.frameMs) {
        this.voicingNow = true;
        edge = "onset";
        edgeAt = this.firstLoudOfRun;
        this.runStart = this.firstLoudOfRun;
        if (this.firstOnset === null) this.firstOnset = edgeAt;
        else if (this.lastOffset !== null && edgeAt - this.lastOffset >= AUDIO.pauseMs) this.pauses++;
        this.lastOnset = edgeAt;
        this.turnVoiced += this.loudRun;
      } else if (this.voicingNow) this.turnVoiced += this.frameMs;
    } else {
      this.loudRun = 0;
      this.firstLoudOfRun = null;
      if (this.voicingNow && t - this.lastLoudAt >= AUDIO.hangoverMs) {
        this.voicingNow = false;
        edge = "offset";
        edgeAt = this.lastLoudAt + this.frameMs;
        this.lastOffset = edgeAt;
        if (this.runStart !== null) {
          this.runs.push([this.runStart, edgeAt]);
          this.runDurs.push(edgeAt - this.runStart);
          if (this.runDurs.length > 200) this.runDurs.shift();
        }
        this.runStart = null;
      }
    }
    while (this.hist.length && this.hist[0][0] < t - 2000) this.hist.shift();
    while (this.runs.length && this.runs[0][1] < t - 30_000) this.runs.shift();
    return { edge, loud, edgeAt };
  }

  get voicing(): boolean { return this.voicingNow; }

  /** Child voiced ms after `fromMs` (the lexical horizon's unseen voice). Counts the open run up to now. */
  voicedAfter(fromMs: Ms): Ms {
    let s = 0;
    for (const [a, b] of this.runs) if (b > fromMs) s += b - Math.max(a, fromMs);
    if (this.voicingNow && this.runStart !== null) s += Math.max(0, this.t + this.frameMs - Math.max(this.runStart, fromMs));
    return s;
  }

  /** Time since the child's last voiced frame; 0 while voicing; null before any child voice this turn. */
  silenceRunMs(): Ms | null {
    if (this.voicingNow) return 0;
    if (this.firstOnset === null) return null;
    return this.t - this.lastLoudAt;
  }

  /** The child's f0 position in their own session range (5th-95th percentile): 0 bottom, 1 top. */
  private rel(f0: number | null): number | null {
    if (f0 === null || this.f0s.length < 50) return null;
    const s = [...this.f0s].sort((a, b) => a - b);
    const lo = st(s[Math.floor(s.length * 0.05)]), hi = st(s[Math.floor(s.length * 0.95)]);
    if (hi - lo < 0.5) return 0.5;
    return Math.max(0, Math.min(1, (st(f0) - lo) / (hi - lo)));
  }

  /** Floor-timing prosody over the last voiced stretch before now (timing only, never affect). */
  prosody(): ProsodyFrame {
    const end = this.lastLoudAt;
    const w300 = this.hist.filter(([t]) => t > end - 300 && t <= end);
    const w200 = this.hist.filter(([t]) => t > end - 200 && t <= end);
    const pf = w300.filter(([, , f]) => f !== null).map(([t, , f]) => [t, st(f as number)] as [number, number]);
    const lastF0s = w300.filter(([, , f]) => f !== null).slice(-3).map(([, , f]) => f as number);
    const lastF0 = lastF0s.length ? lastF0s.reduce((a, b) => a + b, 0) / lastF0s.length : null;
    const med = this.runDurs.length >= 3 ? [...this.runDurs].sort((a, b) => a - b)[Math.floor(this.runDurs.length / 2)] : null;
    const lastRun = this.voicingNow && this.runStart !== null ? this.t - this.runStart : this.runDurs.length ? this.runDurs[this.runDurs.length - 1] : null;
    // energy-peak rate over the last 2 s of voicing (a syllable-rate proxy)
    let peaks = 0;
    for (let i = 1; i + 1 < this.hist.length; i++) {
      const [ta, a] = this.hist[i - 1], [tb, b] = this.hist[i], [tc, c] = this.hist[i + 1];
      if (b > a && b >= c && tb - ta <= 40 && tc - tb <= 40 && b - Math.min(a, c) >= 1.5) peaks++;
    }
    const voicedS = (this.hist.length * this.frameMs) / 1000;
    return {
      f0Hz: lastF0,
      f0SlopeStPerS: slopePerS(pf),
      f0RelRange: this.rel(lastF0),
      energyDb: this.lastDb,
      energySlopeDbPerS: slopePerS(w200.map(([t, d]) => [t, d] as [number, number])),
      finalLengthening: med && lastRun !== null ? lastRun / med : null,
      speechRateSylPerS: voicedS >= 0.5 ? peaks / voicedS : null,
    };
  }

  /** The onset's pitch position (first 100 ms of the current run): a raised onset is a competitive turn-taking cue. */
  onsetF0Rel(): number | null {
    if (this.runStart === null) return null;
    const f = this.hist.filter(([t, , f0]) => t >= (this.runStart as number) && t < (this.runStart as number) + 120 && f0 !== null).map(([, , f0]) => f0 as number);
    if (!f.length) return null;
    return this.rel(f.reduce((a, b) => a + b, 0) / f.length);
  }

  /** dB of the current frame over her echo estimate (null when she is silent or her level is unknown). */
  levelOverEchoDb(): number | null { return this.herDb === null ? null : this.lastDb - this.herDb; }

  /** The current voiced run (or the last one while silent). */
  voicedRunMs(): Ms {
    if (this.voicingNow && this.runStart !== null) return this.t + this.frameMs - this.runStart;
    return this.runDurs.length ? this.runDurs[this.runDurs.length - 1] : 0;
  }

  /** Voicing probability: the margin above the floor mapped to [0, 1] (energy VAD; a pVAD replaces it once enrolled, X3). */
  voicedProb(): number {
    const m = this.lastDb - (this.vad.floorDb + this.vad.opts.offsetDb);
    return Math.max(0, Math.min(1, m / 12));
  }

  snapshot(): ChildAudio {
    return {
      voicing: this.voicingNow,
      voicedProb: this.voicedProb(),
      silenceRunMs: this.silenceRunMs(),
      voicedRunMs: this.voicedRunMs(),
      turnVoicedMs: this.turnVoiced,
      pausesThisTurn: this.pauses,
      firstOnsetAt: this.firstOnset,
      lastOnsetAt: this.lastOnset,
      lastOffsetAt: this.lastOffset,
      prosody: this.prosody(),
      targetSpeaker: null,
    };
  }

  get turnStartedAt(): Ms { return this.turnStart; }
}
