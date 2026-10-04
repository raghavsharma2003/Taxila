// On-device reliability terms (SIGNALS-SPEC §2.6) and the q-only acoustic flags A13 echoRisk and A14 speakerShift.
// q only: these never become a derived state; they mark an utterance as unfit for baselines or for the onset read.
// A14 is never identity (Microsoft Code of Conduct r.15) and never shown to anyone.
import { HOP_MS, st, type Frame } from "../voice/dsp.ts";
import { medianOf, region, runSemitones, voicedRuns } from "./frames.ts";

/** server/voice/features.js MIN_RELIABLE_MS: shorter than this, rate and pause statistics are noise. */
export const MIN_RELIABLE_MS = 300;
/** An onset this short with echo risk may be the teacher's tail, not the child (§2.6 qEcho). */
export const ECHO_ONSET_MS = 400;
/** A14 thresholds [U]: utterance median vs the child's f0 baseline, and a within-utterance jump between voiced runs. */
export const SPEAKER_BASELINE_ST = 5;
export const SPEAKER_JUMP_ST = 4;
export const SPEAKER_MIN_N = 8;
/** Level gates on the AGC output [U]: near-silence (the mic barely heard anything) and clipping (p90 at full scale). */
export const NEAR_SILENCE_DB = -55;
export const CLIP_P90_DB = -0.5;

export type OutputRoute = "speaker" | "earpiece" | "headset" | "bluetooth" | "unknown";

/**
 * A13: 1 when echo could colour the onset — the teacher was still audible at this device's mic meter when the child
 * started, or the route is the loudspeaker and the onset is short. Echo cancellation is on in both links; this flags the
 * residual case, it does not detect echo.
 */
export function echoRisk(o: { onsetMs?: number; teacherAudibleAtOnset?: boolean; route?: OutputRoute }): 0 | 1 {
  if (o.teacherAudibleAtOnset) return 1;
  if (o.route === "speaker" && o.onsetMs != null && o.onsetMs < ECHO_ONSET_MS) return 1;
  return 0;
}

/**
 * A14: 1 when the utterance median f0 sits > 5 st from the child's own baseline median AND the utterance holds a > 4 st
 * jump between consecutive voiced runs (a second voice inside the turn). Needs a baseline of ≥ 8; off for B4 (class 8+:
 * puberty moves f0, SIGNALS-SPEC §2.5.2).
 */
export function speakerShift(frames: Frame[], o: { baselineF0Hz?: number; baselineN?: number; band?: string }, hopMs = HOP_MS): 0 | 1 {
  if (!o.baselineF0Hz || (o.baselineN ?? 0) < SPEAKER_MIN_N || o.band === "B4") return 0;
  const r = region(frames, hopMs);
  if (!r) return 0;
  const runs = voicedRuns(r, 100, hopMs);
  const meds = runs.map((run) => medianOf(runSemitones(r, run))).filter((x) => Number.isFinite(x));
  if (meds.length < 2) return 0;
  const all = medianOf(runs.flatMap((run) => runSemitones(r, run)));
  const far = Math.abs(all - st(o.baselineF0Hz)) > SPEAKER_BASELINE_ST;
  let jump = 0;
  for (let i = 1; i < meds.length; i++) jump = Math.max(jump, Math.abs(meds[i] - meds[i - 1]));
  return far && jump > SPEAKER_JUMP_ST ? 1 : 0;
}

/** qDur: 0 under MIN_RELIABLE_MS, else 1 (the server halves it for pause features under 1500 ms). */
export const durQ = (durationMs: number): number => (durationMs >= MIN_RELIABLE_MS ? 1 : 0);

/** qLevel: 0 on near-silence or clipping (triggers "could not hear you" handling, never a reading of the child). */
export function levelQ(s: { rmsMeanDb: number; rmsP90Db: number }): number {
  if (!Number.isFinite(s.rmsMeanDb) || s.rmsMeanDb < NEAR_SILENCE_DB) return 0;
  if (Number.isFinite(s.rmsP90Db) && s.rmsP90Db > CLIP_P90_DB) return 0;
  return 1;
}
