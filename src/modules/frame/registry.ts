// Engine registry: engine id → lazy loader. Adding an engine = one file under engines/ that exports
// `engine: EngineModule`, plus one line here. Each engine is its own chunk, so a frame downloads only the
// engine it shows.
import type { EngineModule } from "./engine.ts";

const LOADERS: Record<string, () => Promise<{ engine: EngineModule }>> = {
  "fraction-bars@1": () => import("./engines/fractionBars.tsx"),
};

export function hasEngine(id: string): boolean {
  return Object.hasOwn(LOADERS, id);
}

export async function loadEngine(id: string): Promise<EngineModule> {
  if (!hasEngine(id)) throw new Error(`unknown engine ${id}`);
  const { engine } = await LOADERS[id]();
  if (engine.def.id !== id) throw new Error(`engine file for ${id} declares ${engine.def.id}`);
  return engine;
}
