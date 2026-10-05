// The Studio v2 EXTENSION engine catalogue (client side): one engine per archetype in shared/studio-spec-ext.
// evals/studio-catalogue/ext.test.mjs pins the two lists to each other.
import type { EngineDef } from "../../core/types.ts";
import { scene } from "./scene.ts";
import { rail } from "./rail.ts";
import { beat } from "./beat.ts";
import { era } from "./era.ts";
import { sort } from "./sort.ts";
import { fair } from "./fair.ts";
import { dukaan } from "./dukaan.ts";
import { instrument } from "./instrument.ts";
import { sieve } from "./sieve.ts";
import { rule } from "./rule.ts";
import { geo } from "./geo.ts";
import { mirror } from "./mirror.ts";
import { picto } from "./picto.ts";
import { fracops } from "./fracops.ts";
import { zero } from "./zero.ts";
import { map } from "./map.ts";
import { motion } from "./motion.ts";
import { life } from "./life.ts";
import { heat } from "./heat.ts";
import { sky } from "./sky.ts";
import { ray } from "./ray.ts";
import { land } from "./land.ts";
import { town } from "./town.ts";
import { solid } from "./solid.ts";
import { pattern } from "./pattern.ts";
import { field } from "./field.ts";

const list: EngineDef<never>[] = [scene, rail, beat, era, sort, fair, dukaan, instrument, sieve, rule, geo, mirror, picto, fracops, zero, map, motion, life, heat, sky, ray, land, town, solid, pattern, field] as EngineDef<never>[];
export const ENGINES_EXT: Record<string, EngineDef<never>> = Object.fromEntries(list.map((d) => [d.archetype, d]));
