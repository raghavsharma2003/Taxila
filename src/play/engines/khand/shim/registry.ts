// Khand's line for src/play/engines/registry.ts (G1's file; main hand-merges it). Kept here until G1 lands.
import type { EngineEntry } from "./api.ts";

export const KHAND_ENTRY: EngineEntry = {
  id: "khand",
  renders: (["views", "array", "floor", "powers", "mirror"] as const).map((mode) => ({ family: "nazariya" as const, mode })),
  load: () => import("../engine.ts"),
};
