// The Studio v2 EXTENSION engine catalogue (client side): one engine per archetype in shared/studio-spec-ext.
// evals/studio-catalogue/ext.test.mjs pins the two lists to each other.
import type { EngineDef } from "../../core/types.ts";
import { scene } from "./scene.ts";

const list: EngineDef<never>[] = [scene] as EngineDef<never>[];
export const ENGINES_EXT: Record<string, EngineDef<never>> = Object.fromEntries(list.map((d) => [d.archetype, d]));
