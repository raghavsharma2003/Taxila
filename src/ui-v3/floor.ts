// Duplex floor → what the screen shows (DESIGN-V3 §5.3; duplex ARCHITECTURE v2 §2.6; owner correction
// owner-duplex-no-silence-gate-2026-10-04). The UI shows the floor, never the machinery: no "AI is thinking…", no dots,
// no spinner, no talk button. The input is the governor's real FloorPhase (src/duplex/engine.ts), plus the two
// presentation facts the governor does not own: "yielding" (her line just handed over; the cue fades in) and "watching"
// (a game is running in the stage). Erasable TypeScript, pure; TurnIndicator.tsx and TeacherTile.tsx render it.
import type { FloorPhase } from "../duplex/engine.ts";
import type { FloorStatus } from "../avatar/behaviour.ts";

export type V3Floor = FloorPhase | "yielding";

export type WaveMode = "ion" | "volt" | "volt-low" | "idle" | "settle";

export interface FloorView {
  /** The teacher's state tag (text plus the ring), e.g. "Talking". */
  tag: "Talking" | "Listening" | "Thinking" | "Watching" | "With you";
  /** Speaking ring pulse on the tile / PiP. */
  ring: boolean;
  /** Mic readout lines. */
  title: string;
  sub: string;
  wave: WaveMode;
  /** The your-move cue on the stage rail is lit (the screen's one volt). */
  cue: boolean;
  /** Nothing new may enter the stage (child holds the floor; DESIGN-V3 §4 rule 3). */
  frozen: boolean;
  /** What the in-house face is told (src/avatar FloorStatus). */
  face: FloorStatus;
}

export interface FloorOpts {
  /** A game is running in the stage: she watches and reacts at turn boundaries only. */
  watching?: boolean;
  /** The child muted the mic (a privacy control, never push-to-talk). */
  muted?: boolean;
}

const BASE: Record<V3Floor, FloorView> = {
  her_turn: { tag: "Talking", ring: true, title: "Speak anytime", sub: "She pauses for you", wave: "ion", cue: false, frozen: false, face: "speaking" },
  yielding: { tag: "Listening", ring: false, title: "Speak anytime", sub: "She pauses for you", wave: "settle", cue: true, frozen: false, face: "your_turn" },
  handover: { tag: "Listening", ring: false, title: "Your move", sub: "Hands-free", wave: "idle", cue: true, frozen: false, face: "your_turn" },
  child_turn: { tag: "Listening", ring: false, title: "Listening", sub: "Hands-free", wave: "volt", cue: false, frozen: true, face: "listening" },
  overlap: { tag: "Listening", ring: false, title: "Listening", sub: "Hands-free", wave: "volt", cue: false, frozen: true, face: "listening" },
  hold_requested: { tag: "With you", ring: false, title: "Take your time", sub: "She's waiting with you", wave: "volt-low", cue: false, frozen: true, face: "listening" },
  committed: { tag: "Thinking", ring: false, title: "Got it", sub: "Hands-free", wave: "settle", cue: false, frozen: true, face: "thinking" },
  // Safety: calm, no expression change, readout unchanged from a neutral listen; non-safety reveals are quarantined.
  safety_attend: { tag: "Listening", ring: false, title: "Speak anytime", sub: "She's listening", wave: "idle", cue: false, frozen: true, face: "listening" },
  idle: { tag: "Listening", ring: false, title: "Speak anytime", sub: "She pauses for you", wave: "idle", cue: false, frozen: false, face: "your_turn" },
};

export function floorView(floor: V3Floor, opts: FloorOpts = {}): FloorView {
  let v = { ...BASE[floor] };
  if (opts.watching && (floor === "idle" || floor === "handover" || floor === "yielding")) {
    v = { ...v, tag: "Watching", title: "Speak anytime", sub: "Watching you play", cue: false };
  }
  if (opts.muted) {
    // Muted: she cannot hear, so the readout says so plainly and offers the keyboard; never a talk button.
    v = { ...v, title: "Mic off", sub: "Type, or turn the mic on", wave: "idle", cue: v.cue };
  }
  return v;
}

export const ALL_FLOORS: V3Floor[] = ["her_turn", "yielding", "handover", "child_turn", "overlap", "hold_requested", "committed", "safety_attend", "idle"];
