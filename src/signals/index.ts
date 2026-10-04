// On-device signal extras (SIGNALS-SPEC §2.2, §4): A2 onsetContentMs, A13 echoRisk, A14 speakerShift, A16 nucleiPerSec,
// and the qDur / qLevel terms, computed from the frame window the UtteranceTracker already holds for a finished turn.
// ≤ 1 ms per utterance target [U]; no audio, no text and no state name leaves the device — only these numbers, riding on
// TurnRequest.voiceFeatures once server/voice/features.js FEATURE_RANGES admits them (integration step 13: SERVER FIRST,
// because validateUtterance rejects unknown features and the whole utterance would be lost).
import type { SignalExtras } from "../../shared/signals.ts";
import { HOP_MS, type Frame } from "../voice/dsp.ts";
import { onsetContentMs } from "./onset.ts";
import { durQ, echoRisk, levelQ, speakerShift, type OutputRoute } from "./q.ts";
import { nucleiPerSec } from "./rate.ts";

export { leadingFilledMs, onsetContentMs } from "./onset.ts";
export { echoRisk, speakerShift, durQ, levelQ } from "./q.ts";
export { nucleiPerSec } from "./rate.ts";
export { laughCandidate, LAUGH_DETECTOR_ENABLED } from "./laugh.ts";

export interface ExtrasContext {
  /** The tracker's A1 for this utterance (undefined on barge-in or no teacher end). */
  onsetMs?: number;
  durationMs: number;
  rmsMeanDb: number;
  rmsP90Db: number;
  teacherAudibleAtOnset?: boolean;
  route?: OutputRoute;
  /** The child's f0 baseline (median Hz and n) when the client holds it; A14 is off without it. */
  baselineF0Hz?: number;
  baselineN?: number;
  band?: string;
}

/** Feature ranges the server must admit before the client sends these (for server/voice/features.js FEATURE_RANGES). */
export const EXTRA_RANGES: Record<keyof SignalExtras, [number, number]> = {
  onsetContentMs: [0, 140_000], echoRisk: [0, 1], speakerShift: [0, 1], nucleiPerSec: [0, 20], qDur: [0, 1], qLevel: [0, 1],
};

/** Compute the extras for one utterance window (the same frames utteranceStats() read). */
export function signalExtras(window: Frame[], ctx: ExtrasContext, hopMs = HOP_MS): SignalExtras {
  const out: SignalExtras = {
    echoRisk: echoRisk({ onsetMs: ctx.onsetMs, teacherAudibleAtOnset: ctx.teacherAudibleAtOnset, route: ctx.route }),
    speakerShift: speakerShift(window, { baselineF0Hz: ctx.baselineF0Hz, baselineN: ctx.baselineN, band: ctx.band }, hopMs),
    qDur: durQ(ctx.durationMs),
    qLevel: levelQ(ctx),
  };
  const oc = onsetContentMs(ctx.onsetMs, window, ctx.durationMs, hopMs);
  if (oc != null) out.onsetContentMs = oc;
  const n = nucleiPerSec(window, hopMs);
  if (n != null) out.nucleiPerSec = Math.round(n * 100) / 100;
  return out;
}
