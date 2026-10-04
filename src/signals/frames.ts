// Frame helpers shared by the on-device signal extractors (SIGNALS-SPEC §2.2). Pure; no DOM, no WebAudio; runs in Node
// tests. Input is the Frame track src/voice/dsp.ts already produces from the SAME mic tap that feeds STT, so no extra
// capture and no extra model. Nothing here names a state of the child: these are measurements of the audio.
import { HOP_MS, quantile, speechRuns, st, type Frame } from "../voice/dsp.ts";

/** A run of consecutive frames [a, b] (inclusive indexes). */
export type Run = [number, number];

/** The utterance region: first to last speech run (clicks dropped, sub-pause dips bridged), or null. */
export function region(frames: Frame[], hopMs = HOP_MS): Frame[] | null {
  const runs = speechRuns(frames, hopMs);
  if (!runs.length) return null;
  return frames.slice(runs[0][0], runs.at(-1)![1] + 1);
}

/** Runs of consecutive voiced frames (f0 present), at least minMs long. */
export function voicedRuns(frames: Frame[], minMs = 60, hopMs = HOP_MS): Run[] {
  const out: Run[] = [];
  let s = -1;
  frames.forEach((f, i) => {
    if (f.f0 != null && s < 0) s = i;
    if (f.f0 == null && s >= 0) { out.push([s, i - 1]); s = -1; }
  });
  if (s >= 0) out.push([s, frames.length - 1]);
  const need = Math.ceil(minMs / hopMs);
  return out.filter(([a, b]) => b - a + 1 >= need);
}

/** Runs of consecutive speech frames with NO bridging (raw bursts), at least minMs long. */
export function rawSpeechRuns(frames: Frame[], minMs = 40, hopMs = HOP_MS): Run[] {
  const out: Run[] = [];
  let s = -1;
  frames.forEach((f, i) => {
    if (f.speech && s < 0) s = i;
    if (!f.speech && s >= 0) { out.push([s, i - 1]); s = -1; }
  });
  if (s >= 0) out.push([s, frames.length - 1]);
  const need = Math.ceil(minMs / hopMs);
  return out.filter(([a, b]) => b - a + 1 >= need);
}

/** Semitone values of a voiced run, octave errors (> ~an octave from the run median) dropped. */
export function runSemitones(frames: Frame[], [a, b]: Run): number[] {
  const hz = frames.slice(a, b + 1).map((f) => f.f0).filter((x): x is number => x != null);
  if (!hz.length) return [];
  const m = quantile([...hz].sort((x, y) => x - y), 0.5);
  return hz.filter((x) => x > m / 1.8 && x < m * 1.8).map(st);
}

/** p90 − p10 spread in semitones (the A7 flatness measure). */
export function spreadSt(sts: number[]): number {
  if (sts.length < 2) return 0;
  const s = [...sts].sort((x, y) => x - y);
  return quantile(s, 0.9) - quantile(s, 0.1);
}

export const medianOf = (xs: number[]): number => (xs.length ? quantile([...xs].sort((a, b) => a - b), 0.5) : NaN);
