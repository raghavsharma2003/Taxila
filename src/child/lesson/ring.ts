// The single marigold ring (PRODUCT-DESIGN §3.9): exactly one element holds it, and inside a live lesson only
// in YOUR TURN. Pure, so the "at most one target" rule is unit-tested (tests/child-lesson-pure.test.mjs).
export type RingTarget = "chips" | "mic" | "input" | "finish" | "start" | null;

export interface RingInput {
  phase: "idle" | "starting" | "live" | "ending" | "ended" | "error";
  yourTurn: boolean;
  paused: boolean;
  /** Director choice chips are on screen. */
  chipsLive: boolean;
  /** The talk button is shown (a spoken lane in tap-to-talk). */
  tapToTalk: boolean;
  /** Young opened "type instead". */
  youngTyping: boolean;
}

export function ringTarget(i: RingInput): RingTarget {
  if (i.phase === "ended") return "finish";
  if (i.phase !== "live") return i.phase === "idle" || i.phase === "error" ? "start" : null;
  if (!i.yourTurn || i.paused) return null;
  if (i.chipsLive) return "chips";
  return i.tapToTalk && !i.youngTyping ? "mic" : "input";
}
