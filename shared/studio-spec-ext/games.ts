// The extension GAME and SIMULATION archetypes (one module each), collected for the registry in ./index.ts.
import type { ExtSpecDef } from "./common.ts";
import { railDef } from "./rail.ts";
import { beatDef } from "./beat.ts";
import { eraDef } from "./era.ts";
import { sortDef } from "./sort.ts";
import { fairDef } from "./fair.ts";
import { dukaanDef } from "./dukaan.ts";
import { instrumentDef } from "./instrument.ts";
import { sieveDef } from "./sieve.ts";
import { ruleDef } from "./rule.ts";
import { geoDef } from "./geo.ts";
import { mirrorDef } from "./mirror.ts";
import { pictoDef } from "./picto.ts";
import { fracOpsDef } from "./fracops.ts";
import { zeroDef } from "./zero.ts";
import { mapDef } from "./map.ts";
import { motionDef } from "./motion.ts";

export const EXT_GAMES: ExtSpecDef<never>[] = [railDef, beatDef, eraDef, sortDef, fairDef, dukaanDef, instrumentDef, sieveDef, ruleDef, geoDef, mirrorDef, pictoDef, fracOpsDef, zeroDef, mapDef, motionDef] as unknown as ExtSpecDef<never>[];
