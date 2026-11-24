// round 7 (C1 studio-board-timing): her first clause may wait a moment for a board that is milliseconds away. The turn's
// studio slot says so (etaMs: a board still planning whose wait a passing code board bounds, server/studio/seam.js). The
// voice applies the hold to her FIRST sample only (patch to Voice: docs/patches/to-voice/001-first-clause-board-hold.patch).
import type { StudioSlot } from "../../shared/studio";

/** The longest she ever waits for a board: a beat a listener does not hear as a stall. */
export const BOARD_HOLD_MAX_MS = 300;

/** How long her first sample waits for this turn's board (ms, 0 = no hold). */
export function boardHoldMs(slot: StudioSlot | null | undefined, max: number = BOARD_HOLD_MAX_MS): number {
  if (!slot || slot.artifact) return 0;                              // already drawn on this response, or no board
  if (slot.state !== "planning" && slot.state !== "building") return 0;
  const eta = slot.etaMs;
  return typeof eta === "number" && Number.isFinite(eta) && eta > 0 && eta <= max ? Math.round(eta) : 0;
}
