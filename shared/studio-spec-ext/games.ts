// The extension GAME and SIMULATION archetypes (one module each), collected for the registry in ./index.ts.
import type { ExtSpecDef } from "./common.ts";
import { railDef } from "./rail.ts";
import { beatDef } from "./beat.ts";
import { eraDef } from "./era.ts";
import { sortDef } from "./sort.ts";
import { fairDef } from "./fair.ts";

export const EXT_GAMES: ExtSpecDef<never>[] = [railDef, beatDef, eraDef, sortDef, fairDef] as unknown as ExtSpecDef<never>[];
