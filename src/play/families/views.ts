// The play view registry (client only): (family, mode) → its view. The server never imports this file.
import type { FamilyId, PlayMode } from "../../../shared/play.ts";
import type { MakeView } from "../core/viewkit.ts";
import { makeAtomsView } from "./todo-jodo/atoms.view.ts";
import { makeStripsView } from "./todo-jodo/strips.view.ts";
import { makeBundlesView } from "./todo-jodo/bundles.view.ts";
import { makeBalanceView } from "./taraazu/balance.view.ts";
import { makeWeighView } from "./taraazu/weigh.view.ts";
import { makeLineView } from "./nishana/line.view.ts";
import { makeLabView } from "./kyun-lab/lab.view.ts";
import { makeKonView } from "./kon/kon.view.ts";
import { makeStambhView } from "./stambh/stambh.view.ts";
import { makeBeamView } from "./yantra/beam.view.ts";
import { makePendulumView } from "./yantra/pendulum.view.ts";
import { makePlotView } from "./nazariya/plot.view.ts";   // r4-khand: the 2D board twin of the Khand engine
import { makeArenaView } from "./arena/arena.view.ts";
import { makeCircuitView } from "./yantra/circuit.view.ts";
import { makeKaalView } from "./kaal/kaal.view.ts";

export const VIEWS: Record<string, MakeView> = {
  "todo-jodo/atoms": makeAtomsView,
  "todo-jodo/strips": makeStripsView,
  "todo-jodo/bundles": makeBundlesView,
  "taraazu/equation": makeBalanceView,
  "taraazu/equality": makeBalanceView,
  "taraazu/weigh": makeWeighView,
  "taraazu/fill": makeWeighView,
  "nishana/place": makeLineView,
  "nishana/compare": makeLineView,
  "nishana/hop": makeLineView,
  "kyun-lab/fair-test": makeLabView,
  "kon/turn": makeKonView,
  "kon/set": makeKonView,
  "kon/zone": makeKonView,
  "kon/pair": makeKonView,
  "kon/close": makeKonView,
  "nazariya/views": makePlotView,
  "nazariya/array": makePlotView,
  "nazariya/floor": makePlotView,
  "nazariya/powers": makePlotView,
  "nazariya/mirror": makePlotView,
  "arena/pick": makeArenaView,
  "stambh/bars": makeStambhView,
  "stambh/picto": makeStambhView,
  "yantra/beam": makeBeamView,
  "yantra/pendulum": makePendulumView,
  "yantra/circuit": makeCircuitView,
  "kaal/place": makeKaalView,
  "kaal/order": makeKaalView,
};
export function viewFor(family: FamilyId, mode: PlayMode): MakeView | null { return VIEWS[`${family}/${mode}`] ?? null; }
