// The teacher affect engine (RELATIONAL-OS §7, R4 server half; BUILD-PLAN W2-I #3). appraise(event) → TeacherAffect, with
// the charter TA1-TA8 as STRUCTURE, not as prompt text:
//   TA1  affect never reads usage: the input is a CauseEvent from a closed set; there is no field for gaps, frequency,
//        session length, time of day or whether the child came back;
//   TA2  no self-negative display: the Display enum has no sadness, hurt, disappointment, loneliness or tiredness of hers;
//   TA3  nothing affective touches a goodbye: release → neutral_warm, intensity 1 (the policy also forces it);
//   TA4  no UI of its own: the only surface is the face (UiDirectives.teacherAffect) and the voice through the Brain's
//        Moment (Moment.teacherAffect → HUMAN-VOICE momentPlan); nothing here reaches a card, a report or a TTS hint;
//   TA5  no accumulated mood: one display per turn, a trail of at most 3, deleted with the session;
//   TA6  code decides whether and which display; the model never sees a feeling word (no affect row in any prompt);
//   TA7  never keyed to correctness: `correct` is not a cause and appraise() throws on it; delight and pride come only
//        from a method the child found (insight), persistence (effort), a milestone or a christened method;
//   TA8  safety outranks display: a safeguarding turn is calm_steady (face concerned 1, voice slow and low).

/** The closed cause → display table (§7.2). */
export const DISPLAY_OF = Object.freeze({
  insight: "delight", christened: "delight", effort: "warm_pride", milestone: "warm_pride", topic_hook: "enthusiasm",
  share_sad: "gentle_concern", tired: "gentle_concern", withdrawal: "gentle_concern", self_label: "gentle_concern",
  child_joke: "playful", flip_slip: "playful", confusion: "calm_curious", contest: "calm_curious",
  teacher_owned_verified: "sheepish_own", release: "neutral_warm", safety: "calm_steady", none: "neutral_warm",
});
export const CAUSES = Object.freeze(Object.keys(DISPLAY_OF));
/** Every display the engine can produce: none is a negative state about herself (TA2). */
export const DISPLAYS = Object.freeze(["delight", "warm_pride", "enthusiasm", "gentle_concern", "playful", "calm_curious", "sheepish_own", "neutral_warm", "calm_steady"]);
/** Display → the face's Emotion (src/avatar/behaviour.ts: warm | curious | excited | concerned | proud) and full intensity. */
export const FACE_OF = Object.freeze({
  delight: ["excited", 2], warm_pride: ["proud", 1], enthusiasm: ["curious", 2], gentle_concern: ["concerned", 1], playful: ["warm", 2],
  calm_curious: ["curious", 1], sheepish_own: ["warm", 1], neutral_warm: ["warm", 1], calm_steady: ["concerned", 1],
});
/** Displays toned down for older children (B3 one step lower, B4 lower again: never "cute"; §7.2). */
const LIVELY = new Set(["delight", "playful", "enthusiasm"]);

/**
 * @param {{ cause: string, turn?: number, band?: "B1"|"B2"|"B3"|"B4", causeFragment?: string }} event
 * @returns {import("../../shared/relational").TeacherAffect}
 */
export function appraise(event) {
  const cause = event?.cause;
  if (cause === "correct" || cause === "right" || cause === "verdict") throw new Error("appraise: a correct answer is never a cause (TA7)");
  if (!Object.hasOwn(DISPLAY_OF, cause)) throw new Error(`appraise: unknown cause ${cause} (the cause set is closed; TA1)`);
  for (const k of Object.keys(event)) if (!["cause", "turn", "band", "causeFragment"].includes(k)) throw new Error(`appraise: no field ${k} (TA1: affect never reads usage)`);
  const display = DISPLAY_OF[cause];
  let intensity = FACE_OF[display][1];
  if (event.band === "B4" || (event.band === "B3" && LIVELY.has(display))) intensity = 1;
  const out = { display, intensity: /** @type {1|2} */ (intensity === 2 ? 2 : 1), cause, turn: Number(event.turn) || 0 };
  // a cause fragment is a closed tag (a method or skill id), never words
  if (typeof event.causeFragment === "string" && /^[a-z0-9_.:-]{1,48}$/i.test(event.causeFragment)) out.causeFragment = event.causeFragment;
  return out;
}

/** The neutral display (most turns: no tail row, no face change). */
export const neutral = (turn = 0) => ({ display: "neutral_warm", intensity: 1, cause: "none", turn });

/** What the face receives: display and intensity only, never the cause (UiDirectives.teacherAffect). */
export const uiOf = (a) => ({ display: a.display, intensity: a.intensity });
