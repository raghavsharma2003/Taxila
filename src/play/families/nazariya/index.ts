// Nazariya (F8, perspective and space) as five block-world modes. One law (grid.ts) under every mode; Khand
// (src/play/engines/khand) is its 3D view. Registered in src/play/families/index.ts LOGIC.
import type { PlayLevel } from "../../../../shared/play.ts";
import { viewsLogic } from "./views.logic.ts";
import { arrayLogic, type ArrayParams } from "./array.logic.ts";
import { floorLogic, best, type FloorParams } from "./floor.logic.ts";
import { powersLogic, termOf, type PowersParams } from "./powers.logic.ts";
import { mirrorLogic } from "./mirror.logic.ts";

export { viewsLogic, arrayLogic, floorLogic, powersLogic, mirrorLogic };
export const NAZARIYA_LOGIC = { views: viewsLogic, array: arrayLogic, floor: floorLogic, powers: powersLogic, mirror: mirrorLogic } as const;

/** Values her micro-lines may never say before the child produces them (the key), per mode. */
export function nazariyaHidden(level: PlayLevel<unknown>): (string | number)[] {
  const p = level.params as Record<string, unknown>;
  switch (level.mode) {
    case "array": { const a = p as unknown as ArrayParams; return [a.r * a.c]; }
    case "powers": { const a = p as unknown as PowersParams; return [termOf(a.goal, a.s)]; }
    case "floor": { const a = p as unknown as FloorParams; if (a.goal !== "max" && a.goal !== "min") return []; const b = best(a); return b ? [b.value] : []; }
    default: return [];
  }
}
