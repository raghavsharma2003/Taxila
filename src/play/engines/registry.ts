// The real-game engine registry (core3d@1, CORE-API §12): (family, mode, goal) → the 3D engine that renders that law.
// Each engine is its own chunk (dynamic import). One block per engine; lanes add only their own (hand-merged by main).
// No entry = the round-3 2D view renders the level, as before.
import type { FamilyId, PlayMode } from "../../../shared/play.ts";
import type { EngineEntry } from "./core3d/api.ts";

export const ENGINE_ENTRIES: EngineEntry[] = [
];

export function engineFor(family: FamilyId, mode: PlayMode, goal?: string): EngineEntry | null {
  return ENGINE_ENTRIES.find((e) => e.renders.some((r) => r.family === family && r.mode === mode && (!r.goals || (goal !== undefined && r.goals.includes(goal))))) ?? null;
}
