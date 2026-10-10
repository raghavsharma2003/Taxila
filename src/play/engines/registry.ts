// The real-game engine registry (core3d@1, CORE-API §12): (family, mode, goal) → the 3D engine that renders that law.
// Each engine is its own chunk (dynamic import). One block per engine; lanes add only their own (hand-merged by main).
// No entry = the round-3 2D view renders the level, as before.
import type { FamilyId, PlayMode } from "../../../shared/play.ts";
import type { EngineEntry } from "./core3d/api.ts";
import { detectTier, tierFacts } from "./core3d/tier.ts";

export const ENGINE_ENTRIES: EngineEntry[] = [
  // E1 Antariksh · the Nishana law (place, compare, round) as aim → fire → decloak, and fly-into-gate commits (G1)
  { id: "antariksh", renders: [{ family: "nishana", mode: "place" }, { family: "nishana", mode: "compare" }], load: () => import("./antariksh/index.ts") },
];

export function engineFor(family: FamilyId, mode: PlayMode, goal?: string): EngineEntry | null {
  return ENGINE_ENTRIES.find((e) => e.renders.some((r) => r.family === family && r.mode === mode && (!r.goals || (goal !== undefined && r.goals.includes(goal))))) ?? null;
}

/** Warm an engine's chunk and the 3D stage (three.js) while the level is fetched (both are cached module imports).
 *  Never throws; a 2D-only device simply never uses them. */
export function prefetchEngine(family: FamilyId, mode: PlayMode, goal?: string): void {
  const e = engineFor(family, mode, goal) ?? ENGINE_ENTRIES.find((x) => x.renders.some((r) => r.family === family && r.mode === mode)) ?? null;
  if (!e || detectTier(tierFacts()).tier === "2d") return;
  void e.load().catch(() => {});
  void import("./core3d/stage3d.ts").catch(() => {});
}
