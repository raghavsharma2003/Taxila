// The shared per-hop computation (SPEC §2.2 frames.ts). For each 20 ms hop: ONE call into the shipped dsp.ts
// FrameAnalyzer on P (YIN f0, RMS, adaptive-floor speech flag), plus rmsOf() on the same window of R when the raw track is
// on. The DSP is IMPORTED, never copied: duplex (via EngineHost.frame) and src/voice read exactly these frames, so the
// G-VS-DXEQ byte-equality holds by construction (tests/voicesig.test.mjs proves it).
//
// No DOM, no WebAudio, no clock: chunk times come from the caller, so the whole thing runs in Node over a wav file
// (evals/voicesig/train/extract.mjs uses this exact class to build training features: pilot features == product features).
import { FRAME, HOP, RATE, FrameAnalyzer, rmsOf, toDb } from "../../voice/dsp.ts";
import type { AudioFrame } from "../types.ts";

/** Ring length: matches src/voice/tracker.ts HISTORY_MS (longer than any child turn + the ASR delay). */
export const RING_MS = 90_000;
/** A raw sample at or above this magnitude counts as clipped. */
export const CLIP_LEVEL = 0.99;
/** Same re-anchor rule as FrameAnalyzer.push (a dropped chunk): the R framer must cut where P cuts. */
const REANCHOR_MS = 100;

export interface Chunk {
  /** Clock of the chunk's first sample, ms. */
  t: number;
  /** P samples at 16 kHz. */
  p: Float32Array;
  /** R samples at 16 kHz, same length and clock as p; absent when the raw track is off. */
  r?: Float32Array;
}

/** Mirrors FrameAnalyzer's buffer bookkeeping for R, so R window k is exactly the samples of P window k. */
class RawFramer {
  private buf = new Float32Array(FRAME * 4);
  private len = 0;
  private t0 = 0;

  push(x: Float32Array, startMs: number): Array<{ t: number; db: number; peak: number; clip: number }> {
    if (this.len === 0) this.t0 = startMs;
    else {
      const expected = this.t0 + (this.len / RATE) * 1000;
      if (Math.abs(startMs - expected) > REANCHOR_MS) { this.len = 0; this.t0 = startMs; }
    }
    if (this.len + x.length > this.buf.length) {
      const nb = new Float32Array(Math.max(this.buf.length * 2, this.len + x.length));
      nb.set(this.buf.subarray(0, this.len));
      this.buf = nb;
    }
    this.buf.set(x, this.len);
    this.len += x.length;
    const out: Array<{ t: number; db: number; peak: number; clip: number }> = [];
    let off = 0;
    while (this.len - off >= FRAME) {
      const w = this.buf.subarray(off, off + FRAME);
      let peak = 0, clipped = 0;
      for (let i = 0; i < w.length; i++) {
        const a = Math.abs(w[i]);
        if (a > peak) peak = a;
        if (a >= CLIP_LEVEL) clipped++;
      }
      out.push({ t: this.t0 + ((off + FRAME / 2) / RATE) * 1000, db: toDb(rmsOf(w)), peak, clip: clipped / FRAME });
      off += HOP;
    }
    if (off > 0) {
      this.buf.copyWithin(0, off, this.len);
      this.len -= off;
      this.t0 += (off / RATE) * 1000;
    }
    return out;
  }

  reset(): void { this.len = 0; }
}

export interface FrameCoreOptions {
  /**
   * True while her (the teacher's) audio is audible at this device or echo risk is set. R is analysed only on child
   * frames (SPEC §2.1 rule 2): in config R2 (AEC off on R) her voice leaks into R, so those frames carry no raw values.
   */
  herAudible?: (t: number) => boolean;
}

/** Counts every analysis call, so the "one YIN per hop" invariant is testable (G-VS-ONE). */
export const frameStats = { analyzerCalls: 0, hops: 0 };

export class FrameCore {
  private readonly fa = new FrameAnalyzer();
  private readonly raw = new RawFramer();
  private readonly herAudible: (t: number) => boolean;
  private ring: AudioFrame[] = [];
  private rawOn = false;

  constructor(o: FrameCoreOptions = {}) {
    this.herAudible = o.herAudible ?? (() => false);
  }

  /** The adaptive noise floor of P (dB), for q terms. */
  get floorDb(): number { return this.fa.floorDb; }
  get rawActive(): boolean { return this.rawOn; }

  push(c: Chunk): AudioFrame[] {
    frameStats.analyzerCalls++;
    const pf = this.fa.push(c.p, c.t);
    frameStats.hops += pf.length;
    let rf: ReturnType<RawFramer["push"]> = [];
    if (c.r && c.r.length === c.p.length) {
      this.rawOn = true;
      rf = this.raw.push(c.r, c.t);
    } else if (this.rawOn) {
      this.rawOn = false;
      this.raw.reset();
    }
    const out: AudioFrame[] = new Array(pf.length);
    for (let i = 0; i < pf.length; i++) {
      const p = pf[i];
      const f: AudioFrame = { t: p.t, rmsDb: p.rmsDb, f0: p.f0, speech: p.speech };
      // Zip by index only when the two framers agree on the window time (they cut identically unless a chunk was ragged).
      const r = rf.length === pf.length ? rf[i] : undefined;
      if (r && Math.abs(r.t - p.t) < 1e-6 && !this.herAudible(p.t)) {
        f.rawDb = r.db;
        f.rawPeak = r.peak;
        f.rawClip = r.clip;
      }
      out[i] = f;
      this.ring.push(f);
    }
    if (this.ring.length) {
      const cut = this.ring[this.ring.length - 1].t - RING_MS;
      let k = 0;
      while (k < this.ring.length && this.ring[k].t < cut) k++;
      if (k) this.ring.splice(0, k);
    }
    return out;
  }

  /** Frames with fromT ≤ t ≤ toT from the 90 s ring. */
  frames(fromT: number, toT: number): AudioFrame[] {
    return this.ring.filter((f) => f.t >= fromT && f.t <= toT);
  }
}
