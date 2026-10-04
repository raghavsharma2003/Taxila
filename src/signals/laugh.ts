// A15 laughter CANDIDATE detector — built for evaluation only and OFF (SIGNALS-SPEC §2.2: "off until a child-validated
// detector exists"). Laughter is a behaviour the Moment can license (childLaughed), not an emotion; but a detector that
// fires on rhythmic syllables ("ha-ha-ha" counting, "ta-ta-ta" stammer, TV laughter) would license a teacher laugh on the
// wrong turn, so it stays disabled until ES-2/E1 measure it. The transcript laugh token (L13) is the only live source.
// Shape (Bachorowski et al. 2001; Truong & van Leeuwen 2007): ≥ 3 short voiced bursts (60-250 ms) in a regular train at
// ~3.3-6.7 Hz (onset-to-onset 150-300 ms), louder/higher than the turn's own speech is NOT required (children vary).
// Sigh detection is deliberately NOT built: a sigh read is affect inference by another name (Tier X, SL-2).
import { HOP_MS, type Frame } from "../voice/dsp.ts";
import { rawSpeechRuns } from "./frames.ts";

export const LAUGH_DETECTOR_ENABLED = false;
export const LAUGH_MIN_BURSTS = 3;
export const BURST_MS: [number, number] = [60, 250];
export const IOI_MS: [number, number] = [150, 300];

/** True when the frames hold a regular train of short voiced bursts. Evaluation use only while disabled. */
export function laughCandidate(frames: Frame[], hopMs = HOP_MS): boolean {
  const runs = rawSpeechRuns(frames, 40, hopMs).filter(([a, b]) => {
    const ms = (b - a + 1) * hopMs;
    const voiced = frames.slice(a, b + 1).filter((f) => f.f0 != null).length / (b - a + 1);
    return ms >= BURST_MS[0] && ms <= BURST_MS[1] && voiced >= 0.5;
  });
  let train = 1;
  for (let i = 1; i < runs.length; i++) {
    const ioi = (runs[i][0] - runs[i - 1][0]) * hopMs;
    train = ioi >= IOI_MS[0] && ioi <= IOI_MS[1] ? train + 1 : 1;
    if (train >= LAUGH_MIN_BURSTS) return true;
  }
  return false;
}
