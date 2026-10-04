// The realtime session seam (BUILD-PLAN §4 W2 seam commit; W2-D #1-#3). OWNED BY W2-D; call sites in
// server/routes/voice.js (the STT transcription session) and server/routes/lesson.js realtimeToken (the live-call
// session, W2-E's file). W2-D fills: truncation retention_ratio, turn detection from the pace knobs, the lane-A delivery
// line, and the 429 → cascade switch. Contract, binding on the owner:
//   - shapeSession(session, ctx) returns the session config to mint (a new object or the same one); synchronous, never
//     throws, never adds the child id or free text about the child, never removes the transcription logprobs include
//     (classify's low-ASR gate reads them) or the safety-relevant instructions;
//   - onMintError(err, ctx) → { fallback: "cascade" } to move the lesson to the cascade lane, or null to rethrow
//     (today's behaviour).
//
// Until W2-D fills it: shapeSession returns the session unchanged; onMintError returns null.

/** @typedef {{ kind: "lesson" | "stt", lessonId?: string, pace?: { waitNudgeSec: number, endpointSilenceMs: number } }} RealtimeCtx */

export const realtimeSeam = {
  /**
   * @param {Record<string, any>} session
   * @param {RealtimeCtx} _ctx
   * @returns {Record<string, any>}
   */
  shapeSession(session, _ctx) { return session; },

  /**
   * @param {unknown} _err
   * @param {RealtimeCtx} _ctx
   * @returns {{ fallback: "cascade" } | null}
   */
  onMintError(_err, _ctx) { return null; },
};
