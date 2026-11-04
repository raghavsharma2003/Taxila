// The play family registry: (family, mode) → its pure logic. Client and server import this one table.
import type { FamilyId, FamilyLogic, PlayActBody, PlayMode } from "../../../shared/play.ts";
import { atomsLogic } from "./todo-jodo/atoms.logic.ts";
import { stripsLogic } from "./todo-jodo/strips.logic.ts";
import { bundlesLogic } from "./todo-jodo/bundles.logic.ts";
import { balanceLogic } from "./taraazu/balance.logic.ts";
import { lineLogic } from "./nishana/line.logic.ts";
import { labLogic } from "./kyun-lab/lab.logic.ts";
import { konLogic } from "./kon/kon.logic.ts";
import { stambhLogic } from "./stambh/stambh.logic.ts";
import { beamLogic } from "./yantra/beam.logic.ts";
import { pendulumLogic } from "./yantra/pendulum.logic.ts";
import { viewsLogic, arrayLogic, floorLogic, powersLogic, mirrorLogic } from "./nazariya/index.ts";   // r4-khand
import { arenaLogic } from "./arena/arena.logic.ts";
import { circuitLogic } from "./yantra/circuit.logic.ts";
import { vakyaLogic } from "./vakya/vakya.logic.ts";

type AnyLogic = FamilyLogic<unknown, unknown, PlayActBody>;
const asAny = (l: unknown) => l as AnyLogic;
export const LOGIC: Record<string, AnyLogic> = {
  "todo-jodo/atoms": asAny(atomsLogic),
  "todo-jodo/strips": asAny(stripsLogic),
  "todo-jodo/bundles": asAny(bundlesLogic),
  "taraazu/equation": asAny(balanceLogic),
  "taraazu/equality": asAny(balanceLogic),
  "nishana/place": asAny(lineLogic),
  "nishana/compare": asAny(lineLogic),
  "nishana/hop": asAny(lineLogic),
  "kyun-lab/fair-test": asAny(labLogic),
  "kon/turn": asAny(konLogic),
  "kon/set": asAny(konLogic),
  "kon/zone": asAny(konLogic),
  "kon/pair": asAny(konLogic),
  "kon/close": asAny(konLogic),
  // r4-khand: Nazariya, drawn by the Khand block world
  "nazariya/views": asAny(viewsLogic),
  "nazariya/array": asAny(arrayLogic),
  "nazariya/floor": asAny(floorLogic),
  "nazariya/powers": asAny(powersLogic),
  "nazariya/mirror": asAny(mirrorLogic),
  "arena/pick": asAny(arenaLogic),
  // round 7: Stambh, bar graphs and pictographs
  "stambh/bars": asAny(stambhLogic),
  "stambh/picto": asAny(stambhLogic),
  // round 7 E6: Yantra
  "yantra/beam": asAny(beamLogic),
  "yantra/pendulum": asAny(pendulumLogic),
  "yantra/circuit": asAny(circuitLogic),   // round 7 E6: wire a cell, a bulb and a switch; RUN closes the loop or not
  // round 7: Vakya, English / Hindi grammar as a sentence train of word wagons
  "vakya/rail": asAny(vakyaLogic),
};
export function logicFor(family: FamilyId, mode: PlayMode): AnyLogic | null { return LOGIC[`${family}/${mode}`] ?? null; }
