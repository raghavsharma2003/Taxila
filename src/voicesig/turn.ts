// Per-turn acoustic measurements (SPEC §3.1 F1, F3, F5-F8) from the shared front-end's frames. Pure: no DOM, no clock.
// Uses the shipped dsp.ts utteranceStats / speechRuns (imported, never copied), so pause/voiced/flat-run numbers mean what
// src/voice and server/signals already mean by them. Raw physical units only; the server z-scores against the child.
import { HOP_MS, quantile, utteranceStats, type Frame } from "../voice/dsp.ts";
import { fillerRuns } from "./frontend/gruInput.ts";
import type { AudioFrame, TurnAcoustics } from "./types.ts";

/** F7 window: the last voiced 300 ms of the turn. */
export const FINAL_MS = 300;
/** Onsets beyond this are not answers to her turn (src/voice/tracker.ts MAX_ONSET_MS). */
export const MAX_ONSET_MS = 20_000;

export interface TurnInput {
  frames: AudioFrame[];
  /** End of her audio at this device (clock ms); null on barge-in or unknown. */
  teacherEndAt: number | null;
  /** ASR words of the turn (count only; the text never reaches this module). */
  words?: number;
  /** Filler-detector per-frame probabilities aligned with `frames` (stage 2 detector), and its operating threshold. */
  /** minMs: the model card's minimum run (round 3: the operating point is a threshold AND a run length). */
  filler?: { p: ArrayLike<number>; thr: number; minMs?: number };
}

export function turnAcoustics(t: TurnInput): TurnAcoustics | null {
  const fr: Frame[] = t.frames.map((f) => ({ t: f.t, rmsDb: f.rmsDb, f0: f.f0, speech: f.speech }));
  const ac = utteranceStats(fr, HOP_MS);
  if (!ac) return null;
  const out: TurnAcoustics = {
    durationMs: ac.durationMs,
    voicedFrac: ac.voicedFrac,
    pauseFrac: ac.pauseFrac,
    longestPauseMs: ac.longestPauseMs,
    flatVoicedRuns: ac.flatVoicedRuns,
  };
  if (t.teacherEndAt != null) {
    const onset = ac.speechStartAt - t.teacherEndAt;
    if (onset >= 0 && onset <= MAX_ONSET_MS) out.onsetMs = Math.round(onset);
  }
  if (t.filler) {
    const fr2 = fillerRuns(t.frames, t.filler.p, t.filler.thr, HOP_MS, t.filler.minMs);
    out.fillerRuns = fr2.runs.length;
    if (fr2.leadMs != null) out.fillerLeadMs = fr2.leadMs;
    if (out.onsetMs != null && fr2.leadMs != null) out.contentOnsetMs = Math.round(Math.min(out.onsetMs + fr2.leadMs, out.onsetMs + ac.durationMs));
  }
  if (t.words != null && t.words > 0) {
    const speaking = ac.durationMs - ac.pauseTotalMs;
    if (speaking >= 300) {
      const art = t.words / (speaking / 1000);
      if (art <= 15) out.articulationWps = Math.round(art * 100) / 100;
    }
  }
  const fin = finalRelDb(t.frames, ac.speechStartAt, ac.speechEndAt);
  if (fin != null) out.finalRelDb = fin;
  return out;
}

/** F7: raw dB of the last voiced FINAL_MS minus the turn's raw voiced median. Null without enough raw voiced frames. */
export function finalRelDb(frames: AudioFrame[], from: number, to: number): number | null {
  const voiced = frames.filter((f) => f.t >= from && f.t <= to && f.speech && f.f0 != null && f.rawDb != null);
  const need = Math.ceil(FINAL_MS / HOP_MS);
  if (voiced.length < need * 2) return null;
  const all = voiced.map((f) => f.rawDb as number).sort((a, b) => a - b);
  const tail = voiced.slice(-need).map((f) => f.rawDb as number).sort((a, b) => a - b);
  return Math.round((quantile(tail, 0.5) - quantile(all, 0.5)) * 100) / 100;
}

/**
 * Device-side audio quality in [0, 1] (the server takes the min with SIGNALS quality()): enough speech, not clipped,
 * speech level clear of the noise floor. [U] thresholds until SY-3.
 */
export function audioQuality(frames: AudioFrame[], ac: TurnAcoustics | null, floorDb: number): number {
  if (!ac || ac.durationMs < 300) return 0;
  const sp = frames.filter((f) => f.speech);
  if (!sp.length) return 0;
  const db = sp.map((f) => f.rmsDb).sort((a, b) => a - b);
  const snr = quantile(db, 0.5) - floorDb;
  const clip = sp.filter((f) => (f.rawClip ?? 0) > 0.01 || f.rmsDb > -0.5).length / sp.length;
  let q = 1;
  if (snr < 15) q = Math.min(q, 0.5);
  if (snr < 8) q = 0;
  if (clip > 0.05) q = Math.min(q, 0.5);
  if (clip > 0.2) q = 0;
  return q;
}
