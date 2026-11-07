// The lesson floor → the face's status input (round 7: out of Teacher.tsx so the unit tests can import it).
import type { FloorStatus } from "../../avatar/behaviour.ts";
import { faceReactEnabled } from "../../face-puppet/flag.ts";

export type TeacherFloor = "idle" | "speaking" | "showing" | "yielding" | "your_turn" | "listening" | "heard" | "thinking";

/**
 * Floor → the face's status input. yielding leans in on her offset frame like your_turn (TV §7.1); heard holds the
 * listening face (the one 2° nod is identical for every answer); showing talks with her gaze on the tray.
 * Round 7 face-reacts (`react`, TAXILA_R7_FACE_REACT): heard is THINKING instead, so her thinking face starts the moment
 * the child stops talking (~0.4 s before the transcript lands and the floor reads thinking) and never at the answer:
 * heard is the same for every answer, right or wrong.
 */
export function faceStatusOf(floor: TeacherFloor | null | undefined, react = faceReactEnabled()): FloorStatus | null {
  switch (floor) {
    case "speaking":
    case "showing":
      return "speaking";
    case "yielding":
    case "your_turn":
      return "your_turn";
    case "listening":
      return "listening";
    case "heard":
      return react ? "thinking" : "listening";
    case "thinking":
      return "thinking";
    default:
      return null;
  }
}
