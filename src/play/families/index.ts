// The play family registry: (family, mode) → its pure logic. Client and server import this one table.
import type { FamilyId, FamilyLogic, PlayActBody, PlayMode } from "../../../shared/play.ts";
import { atomsLogic } from "./todo-jodo/atoms.logic.ts";
import { stripsLogic } from "./todo-jodo/strips.logic.ts";
import { bundlesLogic } from "./todo-jodo/bundles.logic.ts";
import { balanceLogic } from "./taraazu/balance.logic.ts";
import { weighLogic } from "./taraazu/weigh.logic.ts";
import { lineLogic } from "./nishana/line.logic.ts";
import { labLogic } from "./kyun-lab/lab.logic.ts";
import { konLogic } from "./kon/kon.logic.ts";
import { stambhLogic } from "./stambh/stambh.logic.ts";
import { beamLogic } from "./yantra/beam.logic.ts";
import { pendulumLogic } from "./yantra/pendulum.logic.ts";
import { viewsLogic, arrayLogic, floorLogic, powersLogic, mirrorLogic } from "./nazariya/index.ts";   // r4-khand
import { arenaLogic } from "./arena/arena.logic.ts";
import { circuitLogic } from "./yantra/circuit.logic.ts";
import { kaalLogic } from "./kaal/kaal.logic.ts";
import { vakyaLogic } from "./vakya/vakya.logic.ts";
import { kilaLogic } from "./kila/kila.logic.ts";
import { ghadiLogic } from "./ghadi/ghadi.logic.ts";
import { nakshaLogic } from "./naksha/naksha.logic.ts";
import { darpanLogic } from "./darpan/darpan.logic.ts";

type AnyLogic = FamilyLogic<unknown, unknown, PlayActBody>;
const asAny = (l: unknown) => l as AnyLogic;
export const LOGIC: Record<string, AnyLogic> = {
  "todo-jodo/atoms": asAny(atomsLogic),
  "todo-jodo/strips": asAny(stripsLogic),
  "todo-jodo/bundles": asAny(bundlesLogic),
  "taraazu/equation": asAny(balanceLogic),
  "taraazu/equality": asAny(balanceLogic),
  // round 7: measurement on the balance (kg / g) and with jugs (l / ml)
  "taraazu/weigh": asAny(weighLogic),
  "taraazu/fill": asAny(weighLogic),
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
  // round 7 SST: Kaal-nadi, events placed on the river of time (BCE left, CE right, no year 0)
  "kaal/place": asAny(kaalLogic),
  "kaal/order": asAny(kaalLogic),
  // round 7: Vakya, English / Hindi grammar as a sentence train of word wagons
  "vakya/rail": asAny(vakyaLogic),
  // round 7 E4: Kila, turn-based tower defence on a numbered path (a tower on square p fires on every multiple of p)
  "kila/multiples": asAny(kilaLogic),
  "kila/factors": asAny(kilaLogic),
  "kila/lcm": asAny(kilaLogic),
  "kila/divisibility": asAny(kilaLogic),
  // round 7: Naksha, maps and grids (latitude / longitude, routes and directions, map scale, shapes on a dot grid)
  "naksha/locate": asAny(nakshaLogic),
  "naksha/route": asAny(nakshaLogic),
  "naksha/scale": asAny(nakshaLogic),
  "naksha/shape": asAny(nakshaLogic),
  // round 7: Ghadi, time and clocks (a geared clock, bus trips, a race podium, a month calendar); nothing runs on a clock
  "ghadi/set": asAny(ghadiLogic),
  "ghadi/run": asAny(ghadiLogic),
  "ghadi/race": asAny(ghadiLogic),
  "ghadi/calendar": asAny(ghadiLogic),
  // round 7: Darpan, symmetry (lines of symmetry laid and folded; the smallest turn and the order of turn symmetry)
  "darpan/mirror": asAny(darpanLogic),
  "darpan/turn": asAny(darpanLogic),
};
export function logicFor(family: FamilyId, mode: PlayMode): AnyLogic | null { return LOGIC[`${family}/${mode}`] ?? null; }
