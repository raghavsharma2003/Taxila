// Phase → geometry (PRODUCT-DESIGN §3.2). The Director does not yet send `ui.phase`/`ui.layout` (§3.15), so
// the client derives the lesson-arc phase from the Director's move kind, and geometry changes ONLY when that
// derived phase changes (PD-G3): moves that live inside any phase (hint, repair, reteach, celebrate,
// safeguard) never move the layout. When the Director starts sending ui.phase this file reads it instead.
import type { Move } from "../../../shared/contracts.ts";
import type { Family } from "../band.ts";
import type { Geometry } from "./layout.ts";

export type ArcPhase = "P0" | "P1" | "P2" | "P3" | "BREAK" | "P5" | "P6" | "P7" | "DOUBT";

const PHASE_OF: Partial<Record<Move["kind"], ArcPhase>> = {
  greet: "P0",
  retrieval: "P1",
  hook: "P3",
  explain: "P3",
  worked_example: "P3",
  show_module: "P3",
  probe: "P5",
  practice: "P5",
  teachback: "P6",
  break: "BREAK",
  wrap: "P7",
};

/** The phase after this move: a move that names no phase keeps the current one. */
export function nextPhase(current: ArcPhase, move: Move | null | undefined, serverPhase?: string): ArcPhase {
  if (serverPhase && isArcPhase(serverPhase)) return serverPhase;
  if (!move) return current;
  return PHASE_OF[move.kind] ?? current;
}

function isArcPhase(p: string): p is ArcPhase {
  return ["P0", "P1", "P2", "P3", "BREAK", "P5", "P6", "P7", "DOUBT"].includes(p);
}

/** §3.2 geometry column; P6 is Duo for Young (B1-B2), Work with an explain panel for Older. */
export function geometryOf(phase: ArcPhase, family: Family): Geometry {
  switch (phase) {
    case "P0":
    case "P2":
    case "BREAK":
      return "L1";
    case "P1":
      return "L2";
    case "P3":
    case "P5":
    case "DOUBT":
      return "L3";
    case "P6":
      return family === "young" ? "L4" : "L3";
    case "P7":
      return "L5";
  }
}

/** Older top bar: the phase word beside the skill name (never a meter, R7). */
export function phaseWord(phase: ArcPhase, lang: string): string {
  const hi = lang === "hindi";
  const words: Record<ArcPhase, [string, string]> = {
    P0: ["shuru", "शुरू"],
    P1: ["yaad karna", "याद करना"],
    P2: ["aaj ka lakshya", "आज का लक्ष्य"],
    P3: ["seekhna", "सीखना"],
    BREAK: ["break", "आराम"],
    P5: ["abhyaas", "अभ्यास"],
    P6: ["samjhaana", "समझाना"],
    P7: ["wrap-up", "समापन"],
    DOUBT: ["doubt", "सवाल"],
  };
  return words[phase][hi ? 1 : 0];
}
