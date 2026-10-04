// The expressive-voice seam into the turn (BUILD-PLAN §4, W2 seam commit). OWNED BY W2-G; call site owned by W2-E.
// HUMAN-VOICE B5: the layer reads ONLY the Brain's Moment (never the verdict for affect: HV-17) and the guarded reply,
// and returns a DeliveryPlan the TTS path speaks. Contract, binding on the owner:
//   - pure and synchronous (code only, ≤ 3 ms; TEACHER-BRAIN §5.1 stage 7), never throws into the turn;
//   - aligner identity: the plan's clause texts minus inserted fillers equal the reply byte for byte (HV-2); on any
//     mismatch return null and the plain reply is spoken (fail closed);
//   - safety turns (moment.safety) bypass the layer: calm, no fillers, no clips, plain digits (HV-3);
//   - owner 2026-10-04 (voice-clips-off-and-numbers-normalised): no spliced breath/hum clips; numbers are normalised to
//     spoken words before TTS; the voice choice stays config-driven (server/voice/voices.js), never hard-coded here.
//
// Until W2-G fills it: planDelivery → null (the reply is spoken exactly as today). The call site passes moment = null
// until W2-E's momentOf (server/brain/moment.js) exists, so null in → null out.

export const expressiveSeam = {
  /**
   * @param {import("../../../shared/brain").Moment | null} _moment
   * @param {string} _reply the guarded reply text (exactly what will be spoken)
   * @returns {import("../../../shared/contracts").DeliveryPlan | null}
   */
  planDelivery(_moment, _reply) { return null; },
};
