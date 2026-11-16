// Round 7 (stream B Voice ↔ E App contract, 2026-11-04): what the hands-free dock shows. One pure function from the bridge's
// state (src/lesson/uiBridge.ts) to ONE dock state; App renders it and never reads the engine's floor phases itself.
//
//   starting   hands-free is expected (the switch said on, or is still unknown) but the ear is not up yet: show the
//              hands-free dock already (no talk button flip), a quiet "getting ready to listen"; the mic is held meanwhile
//   listening  her line is done, the floor is the child's, nothing heard yet
//   hearing    the child is talking (or has talked and holds the floor)
//   thinking   she has decided to answer and her first sound is on its way (also: a turn is with the server)
//   speaking   her voice is audible (a child voicing over her is still "speaking": she stops herself when it is a barge-in)
//   waiting    the child asked for time ("ruko", "ek minute"): she waits, no timer pressure shown
//   muted      the child (or a sheet) switched the mic off: runtime.setMuted(true); the dock shows unmute
//   fallback   the engine stepped aside (no ear, quota, echo, kill switch): App shows today's tap-to-talk dock; the reason
//              is in `fallback` for the trace only, never shown as an error to the child
//
// Mute API (runtime.ts): runtime.setMuted(on) / runtime.state.muted. Muting holds the mic (no audio leaves the device) and
// puts the link on push-to-talk so the engine never reads the quiet as the child's silence; unmuting restores hands-free.
import type { FloorPhase } from "../duplex/engine.ts";

export type HandsFreeDock = "starting" | "listening" | "hearing" | "thinking" | "speaking" | "waiting" | "muted" | "fallback";

export interface HandsFreeInputs {
  /** Hands-free is expected for this lesson (bridge.duplexExpected). */
  expected: boolean;
  /** The engine is deciding the floor (bridge.duplexLive). */
  live: boolean;
  /** Why the engine stepped aside (bridge.duplexFallback). */
  fallback: string | null;
  /** The engine's floor phase (bridge.duplexPhase). */
  phase: FloorPhase | null;
  /** runtime.state.muted */
  muted: boolean;
  /** A child turn is with the server (runtime.state.pending or the bridge's in-flight flag). */
  turnInFlight?: boolean;
}

export function handsFreeDock(i: HandsFreeInputs): HandsFreeDock {
  if (i.fallback) return "fallback";
  if (i.muted && (i.live || i.expected)) return "muted";
  if (!i.live) return i.expected ? "starting" : "fallback";
  switch (i.phase) {
    case "her_turn":
    case "overlap":
      return "speaking";
    case "committed":
      return "thinking";
    case "child_turn":
      return "hearing";
    case "hold_requested":
      return "waiting";
    case "safety_attend":
      return i.turnInFlight ? "thinking" : "listening";
    case "handover":
    case "idle":
    default:
      return i.turnInFlight ? "thinking" : "listening";
  }
}
