// The four-state status rule (listening · thinking · speaking · your turn), inherited from Gurukul's design
// law: every state has a word, and "your turn" is lit only when the floor really is the child's.
// Derived from link events, never set from a literal; at most one state holds by construction.
// PRODUCT-DESIGN-V2 §4.1 fix: YOUR TURN requires a pending hand-over. `handover` is null until the Director sends
// ui.handover (legacy: nothing pending = your turn, as before); once it does, a turn whose hand-over is closed
// ("chain", or none) is honestly THINKING, never YOUR TURN. The eight-state floor lives in src/lesson/floor.ts;
// this four-state status stays for the runtime's own bookkeeping and for older callers.
import type { LinkEvent, TeacherStatus } from "./link.ts";

export interface StatusFlags {
  childSpeaking: boolean;
  teacherSpeaking: boolean;
  /** The child has finished a turn (or the lesson is opening) and no response has started yet. */
  awaiting: boolean;
  /** Responses created and not yet done (a response can outlive its audio and vice versa). */
  activeResponses: number;
  /** The current teacher turn hands the floor to the child (null = the Director has not said; legacy). */
  handover: boolean | null;
}

/** Runtime-originated inputs: "settle" clears a wait that will never be answered (failed turn, watchdog). */
export type StatusInput = LinkEvent | { type: "settle" } | { type: "reset"; awaiting: boolean } | { type: "handover"; open: boolean };

export const INITIAL_FLAGS: StatusFlags = { childSpeaking: false, teacherSpeaking: false, awaiting: true, activeResponses: 0, handover: null };

export function reduceStatus(f: StatusFlags, e: StatusInput): StatusFlags {
  switch (e.type) {
    case "child_speech_start":
      return { ...f, childSpeaking: true };
    case "child_speech_end":
      return { ...f, childSpeaking: false, awaiting: true };
    case "child_silent":
      return { ...f, childSpeaking: false, awaiting: false };
    case "child_final":
      // Voice transcripts often land after the teacher has already started answering; only a typed turn
      // starts a wait of its own.
      return e.typed ? { ...f, childSpeaking: false, awaiting: true } : f;
    case "response_start":
      return { ...f, awaiting: false, activeResponses: f.activeResponses + 1 };
    case "response_done":
      return { ...f, activeResponses: Math.max(0, f.activeResponses - 1) };
    case "teacher_audio_start":
      return { ...f, teacherSpeaking: true, awaiting: false };
    case "teacher_audio_end":
      return { ...f, teacherSpeaking: false };
    case "settle":
      return { ...f, awaiting: false, activeResponses: 0 };
    case "reset":
      return { ...INITIAL_FLAGS, awaiting: e.awaiting, handover: f.handover };
    case "handover":
      return { ...f, handover: e.open };
    default:
      return f;
  }
}

export function statusOf(f: StatusFlags): TeacherStatus {
  if (f.childSpeaking) return "listening";
  if (f.teacherSpeaking) return "speaking";
  if (f.awaiting || f.activeResponses > 0) return "thinking";
  if (f.handover === false) return "thinking"; // no pending hand-over: never YOUR TURN (§4.1 fix)
  return "your_turn";
}

/** Nobody holds the floor (nothing pending, nobody speaking), whatever the hand-over says. The runtime's
 *  "may she speak now" check: a deferred reply or the goodbye waits for this, not for YOUR TURN. */
export function isFree(f: StatusFlags): boolean {
  return !f.childSpeaking && !f.teacherSpeaking && !f.awaiting && f.activeResponses === 0;
}
