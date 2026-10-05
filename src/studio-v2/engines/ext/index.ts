// The Studio v2 EXTENSION engine catalogue (client side): one engine per archetype in shared/studio-spec-ext.
// evals/studio-catalogue/ext.test.mjs pins the two lists to each other.
import type { EngineDef } from "../../core/types.ts";
import { scene } from "./scene.ts";
import { rail } from "./rail.ts";
import { beat } from "./beat.ts";
import { era } from "./era.ts";
import { sort } from "./sort.ts";
import { fair } from "./fair.ts";

const list: EngineDef<never>[] = [scene, rail, beat, era, sort, fair] as EngineDef<never>[];
export const ENGINES_EXT: Record<string, EngineDef<never>> = Object.fromEntries(list.map((d) => [d.archetype, d]));
