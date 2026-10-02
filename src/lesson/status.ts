// The four-state status rule (listening · thinking · speaking · your turn), inherited from Gurukul's design
// law: every state has a word, and "your turn" is lit only when the floor really is the child's.
// Derived from link events, never set from a literal; at most one state holds by construction.
import type { LinkEvent, TeacherStatus } from "./link.ts";

export interface StatusFlags {
  childSpeaking: boolean;
  teacherSpeaking: boolean;
  /** The child has finished a turn (or the lesson is opening) and no response has started yet. */
  awaiting: boolean;
  /** Responses created and not yet done (a response can outlive its audio and vice versa). */
  activeResponses: number;
}

/** Runtime-originated inputs: "settle" clears a wait that will never be answered (failed turn, watchdog). */
export type StatusInput = LinkEvent | { type: "settle" } | { type: "reset"; awaiting: boolean };

export const INITIAL_FLAGS: StatusFlags = { childSpeaking: false, teacherSpeaking: false, awaiting: true, activeResponses: 0 };

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
      return { ...INITIAL_FLAGS, awaiting: e.awaiting };
    default:
      return f;
  }
}

export function statusOf(f: StatusFlags): TeacherStatus {
  if (f.childSpeaking) return "listening";
  if (f.teacherSpeaking) return "speaking";
  if (f.awaiting || f.activeResponses > 0) return "thinking";
  return "your_turn";
}
