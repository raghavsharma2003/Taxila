/**
 * The listening face and the clip channel (ARCHITECTURE.md v2 §2.4, §11.1): governed decisions → avatar cues (seam S7)
 * and the shipped 8-state floor (seam S11). Floor behaviours only: never affect, never keyed to correctness (the Moment
 * stays the only affect producer, TEACHER-BRAIN TB6; `design-v2-rejected-correctness-face`). Nods are content-blind
 * (their timing comes from prosody and the floor, never from what the child said). In safety_attend even floor
 * behaviour is calm (`calm_attend` → calm_steady, TA8). Audio while the child speaks is never produced here: an "mm" is
 * only legal in a pause, behind its flag, and the governor already enforced that (HUMAN-VOICE S4: visual-only by default).
 * Erasable TypeScript, pure.
 */
import type { EngineDecision, FloorPhase, ReactKind } from "./engine.ts";
import type { Floor } from "../lesson/floor.ts";

/** Avatar seam S7 names (src/avatar/behaviour.ts public API requested in INTEGRATION.md). */
export type AvatarPose = "listening" | "listen_lean" | "still_with_you" | "thinking" | "hold_pose" | "checkin_look" | "your_turn" | "calm_steady" | "speaking";

export type FaceCue =
  | { kind: "pose"; pose: AvatarPose; why: ReactKind | FloorPhase }
  /** A single continuer nod (listenerNod(peakDeg)); content-blind. */
  | { kind: "nod"; peakDeg: number }
  /** A same-voice non-lexical clip (the "mm" bank) or a lexical continuer (chit-chat only, flagged). */
  | { kind: "clip"; clip: "mm" | "haan" | "acchha" };

const REACT_POSE: Record<ReactKind, AvatarPose> = {
  listen_lean: "listen_lean",
  still_with_you: "still_with_you",
  thinking_glance: "thinking",
  hold_pose: "hold_pose",
  checkin_look: "checkin_look",
  calm_attend: "calm_steady",
  nudge_face: "your_turn",
};

const PHASE_POSE: Record<FloorPhase, AvatarPose> = {
  her_turn: "speaking",
  overlap: "listening",
  committed: "thinking",
  handover: "your_turn",
  child_turn: "listening",
  hold_requested: "hold_pose",
  safety_attend: "calm_steady",
  idle: "listening",
};

/** The face cue a governed decision asks for (null = no visible change). */
export function faceCue(d: EngineDecision, phase: FloorPhase): FaceCue | null {
  const det = d.detail;
  if (d.action === "REACT" && det?.action === "REACT") {
    if (phase === "safety_attend" && det.kind !== "calm_attend") return { kind: "pose", pose: "calm_steady", why: "safety_attend" };
    return { kind: "pose", pose: REACT_POSE[det.kind], why: det.kind };
  }
  if (d.action === "BACKCHANNEL" && det?.action === "BACKCHANNEL") {
    if (det.kind === "nod") return { kind: "nod", peakDeg: 4 };
    return { kind: "clip", clip: det.kind };
  }
  return null;
}

/** The pose a phase change shows (one producer owns the listening face; Puppet2D's mic-level nods are replaced). */
export function phasePose(phase: FloorPhase): FaceCue {
  return { kind: "pose", pose: PHASE_POSE[phase], why: phase };
}

/** FloorPhase → the shipped floor (src/lesson/floor.ts), seam S11. */
export function shippedFloor(phase: FloorPhase): Floor {
  switch (phase) {
    case "her_turn": return "speaking";
    case "overlap": return "listening";
    case "committed": return "thinking";
    case "handover": return "your_turn";
    case "child_turn": return "listening";
    case "hold_requested": return "listening";
    case "safety_attend": return "listening";
    case "idle": return "idle";
  }
}
