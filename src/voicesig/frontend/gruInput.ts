// Per-frame input vector for the on-device prosody/filler GRU (SPEC §3.3 F11). Built from the SAME AudioFrame and log-mel
// the rest of the front-end computes (no second analysis), in Node for training and in the browser for inference, so the
// trained model sees in production exactly what it saw in training.
//
// Every channel is speaker- and gain-relative (rule: child-relative first): f0 is in semitones against a running
// session reference, level against a running speech-level reference, and the spectrum is a SHAPE (band minus the frame's
// band mean). No absolute pitch, no absolute level: those carry identity and age, not knowledge (RS §8 exclusions).
import { st } from "../../voice/dsp.ts";
import { N_MELS } from "./logmel.ts";
import type { AudioFrame } from "../types.ts";

export const GRU_BANDS = 16;
export const GRU_DIM = 6 + GRU_BANDS;
export const GRU_FEATURES_VER = "vsgru-in/1";
/** Running-reference rate per qualifying frame (≈ 1 s of speech at 50 frames/s to settle). */
const ALPHA = 0.02;

const clip = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export class GruInput {
  private f0Ref: number | null = null;
  private dbRef: number | null = null;
  private prevSt: number | null = null;
  private prevDb: number | null = null;

  /** One 22-dim vector for one hop. `mel` is the log10-mel frame nearest the hop centre (null → zero shape). */
  next(f: AudioFrame, mel: Float32Array | null, out = new Float32Array(GRU_DIM)): Float32Array {
    const voiced = f.f0 != null && f.speech;
    const s = voiced ? st(f.f0 as number) : null;
    if (s != null) this.f0Ref = this.f0Ref == null ? s : this.f0Ref + ALPHA * (s - this.f0Ref);
    if (f.speech) this.dbRef = this.dbRef == null ? f.rmsDb : this.dbRef + ALPHA * (f.rmsDb - this.dbRef);
    out[0] = f.speech ? 1 : 0;
    out[1] = voiced ? 1 : 0;
    out[2] = s != null && this.f0Ref != null ? clip(s - this.f0Ref, -12, 12) / 6 : 0;
    out[3] = s != null && this.prevSt != null ? clip(s - this.prevSt, -3, 3) / 3 : 0;
    out[4] = this.dbRef != null ? clip(f.rmsDb - this.dbRef, -40, 20) / 10 : -2;
    out[5] = this.prevDb != null ? clip(f.rmsDb - this.prevDb, -20, 20) / 10 : 0;
    this.prevSt = s;
    this.prevDb = f.rmsDb;
    if (mel) {
      const per = N_MELS / GRU_BANDS;
      let mean = 0;
      for (let b = 0; b < GRU_BANDS; b++) {
        let v = 0;
        for (let k = 0; k < per; k++) v += mel[b * per + k];
        out[6 + b] = v / per;
        mean += v / per;
      }
      mean /= GRU_BANDS;
      for (let b = 0; b < GRU_BANDS; b++) out[6 + b] = clip(out[6 + b] - mean, -4, 4);
    } else for (let b = 0; b < GRU_BANDS; b++) out[6 + b] = 0;
    return out;
  }
}

/** Filled-pause runs from per-frame detector probabilities (frames at 20 ms). */
export interface FillerRuns { runs: Array<[number, number]>; leadMs: number | null }

/** A run counts at ≥ this many ms of consecutive speech frames with p ≥ threshold (shorter is a long vowel). */
export const FILLER_MIN_MS = 200;

/**
 * Runs of p ≥ thr over speech frames; leadMs = the filled time before the first non-filler speech frame (null when the
 * turn has no speech). `hopMs` is 20 for AudioFrames.
 */
export function fillerRuns(frames: AudioFrame[], p: ArrayLike<number>, thr: number, hopMs = 20, minMs = FILLER_MIN_MS): FillerRuns {
  const runs: Array<[number, number]> = [];
  const need = Math.ceil(minMs / hopMs);
  let s = -1;
  for (let i = 0; i <= frames.length; i++) {
    const on = i < frames.length && frames[i].speech && p[i] >= thr;
    if (on && s < 0) s = i;
    if (!on && s >= 0) { if (i - s >= need) runs.push([s, i - 1]); s = -1; }
  }
  let leadMs: number | null = null;
  const firstSpeech = frames.findIndex((f) => f.speech);
  if (firstSpeech >= 0) {
    let lead = 0;
    let i = firstSpeech;
    for (const [a, b] of runs) {
      // Silence between leading filler runs is allowed ("umm … aaa … 5"); any non-filler speech frame ends the lead.
      let content = false;
      for (let k = i; k < a; k++) if (frames[k].speech) { content = true; break; }
      if (content) break;
      lead += (b - a + 1) * hopMs;
      i = b + 1;
    }
    leadMs = lead;
  }
  return { runs, leadMs };
}
