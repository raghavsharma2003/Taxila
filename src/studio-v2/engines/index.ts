// The Studio v2 engine catalogue (client side). Every engine here has a zod spec schema, a reviewed default spec,
// NCERT outcome tags and a grader in shared/studio-spec.ts (ENGINE_SPECS); tests pin the two lists to each other.
import type { EngineDef } from "../core/types.ts";
import { landfall } from "./landfall.ts";
import { circuit } from "./circuit.ts";
import { moon } from "./moon.ts";
import { slice } from "./slice.ts";
import { runner } from "./runner.ts";
import { area } from "./area.ts";
import { vault } from "./vault.ts";
import { angle } from "./angle.ts";
import { data } from "./data.ts";
import { beam } from "./beam.ts";
import { foodweb } from "./foodweb.ts";
import { phase } from "./phase.ts";

const list: EngineDef<never>[] = [landfall, circuit, moon, slice, runner, area, vault, angle, data, beam, foodweb, phase] as EngineDef<never>[];
export const ENGINES: Record<string, EngineDef<never>> = Object.fromEntries(list.map((d) => [d.archetype, d]));
