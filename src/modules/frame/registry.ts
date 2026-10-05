// Engine registry: engine id → lazy loader. Adding an engine = one file under engines/ that exports
// `engine: EngineModule`, plus one line here (and its id in shared/engine-catalog.js, which the Director's
// planner reads). Each engine is its own chunk, so a frame downloads only the engine it shows.
import type { EngineModule } from "./engine.ts";

const LOADERS: Record<string, () => Promise<{ engine: EngineModule }>> = {
  "fraction-bars@1": () => import("./engines/fractionBars.tsx"),
  "number-line@1": () => import("./engines/numberLine.tsx"),
  "collections@1": () => import("./engines/collections.tsx"),
  "place-value@1": () => import("./engines/placeValue.tsx"),
  "fractions@1": () => import("./engines/fractions.tsx"),
  "multiply-divide@1": () => import("./engines/multiplyDivide.tsx"),
  "geoboard@1": () => import("./engines/geoboard.tsx"),
  "data-graphs@1": () => import("./engines/dataGraphs.tsx"),
  "patterns@1": () => import("./engines/patterns.tsx"),
  "measure@1": () => import("./engines/measure.tsx"),
  "sky@1": () => import("./engines/sky.tsx"),
  "motion-lab@1": () => import("./engines/motionLab.tsx"),
  "water-cycle@1": () => import("./engines/waterCycle.tsx"),
  "scene@1": () => import("./scene/scene.tsx"),
  "explainer@1": () => import("./engines/explainer.tsx"),
};

export const ENGINE_IDS: readonly string[] = Object.keys(LOADERS);

export function hasEngine(id: string): boolean {
  return Object.hasOwn(LOADERS, id);
}

const LOADED = new Map<string, EngineModule>();

export async function loadEngine(id: string): Promise<EngineModule> {
  if (!hasEngine(id)) throw new Error(`unknown engine ${id}`);
  const { engine } = await LOADERS[id]();
  if (engine.def.id !== id) throw new Error(`engine file for ${id} declares ${engine.def.id}`);
  LOADED.set(id, engine);
  return engine;
}

/** An engine this document already imported (a spare frame's pre-loaded engines), synchronously; else null. */
export function loadedEngine(id: string): EngineModule | null {
  return LOADED.get(id) ?? null;
}
