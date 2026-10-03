// Lesson phase (PRODUCT-DESIGN-V2 §3.5): warmup · teach · practice · teachback · wrap. The Director's ui.phase
// wins when it sends one (§4.10); until then the phase is derived from the move kind, and moves that live inside
// any phase (hint, repair, reteach, celebrate, safeguard) never change it. The Desk geometry changes only at a
// phase boundary (deskLayout.ts geometryForTray), so a phase is the unit of layout stability.
import type { Move } from "../../../shared/contracts.ts";
import type { DeskPhase } from "./model.ts";

const PHASE_OF: Partial<Record<Move["kind"], DeskPhase>> = {
  greet: "warmup",
  retrieval: "warmup",
  hook: "teach",
  explain: "teach",
  worked_example: "teach",
  show_module: "teach",
  probe: "practice",
  practice: "practice",
  teachback: "teachback",
  wrap: "wrap",
};

const PHASES: readonly DeskPhase[] = ["warmup", "teach", "practice", "teachback", "wrap"];
export const isDeskPhase = (p: unknown): p is DeskPhase => typeof p === "string" && (PHASES as readonly string[]).includes(p);

/** The phase after this move: the server's ui.phase when present, else the move's phase, else unchanged. */
export function deskPhaseOf(current: DeskPhase | null, move: Move | null | undefined, serverPhase?: string): DeskPhase | null {
  if (isDeskPhase(serverPhase)) return serverPhase;
  if (!move) return current;
  return PHASE_OF[move.kind] ?? current;
}
