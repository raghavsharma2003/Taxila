// Lane B compiler (HUMAN-VOICE §5.9 `voicelive.js`, B6; BUILD-PLAN W2-D #3): Voice Live = gpt-realtime-2.1 hears the
// child and writes the words, the character's Azure (DragonHD) voice speaks them.
//
// HUMAN-VOICE: "If (a) [markers in the model's text are rendered silently], the clause aligner runs on the streamed
// text and markers are inserted by a Voice Live text-transform hook. If (b) [the server receives the audio], the
// splicer works as on the cascade. If neither, lane B gets the lane-A treatment."
// P-VL (evals/voice-live-probe.mjs, measured 2026-10-04, context/measurements.md#p-vl-voice-live-probe-2026-10-04)
// decides which. Until the owner turns lane B on (needs O17c and the blind round), and while clips are off for every
// voice (`voice-clips-off-and-numbers-normalised`), lane B gets exactly the lane-A note: one delivery row, last.
import { realtimeDeliveryLine } from "./realtime.js";

/**
 * @param {import("../../../../shared/brain").Moment | null | undefined} moment
 * @returns {string | null}
 */
export function voiceLiveDelivery(moment) {
  return realtimeDeliveryLine(moment);
}
