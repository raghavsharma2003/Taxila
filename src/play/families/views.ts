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
import { makeTriView } from "./nazariya/tri.view.ts";     // r7 nazariya2
import { makeSolidView } from "./nazariya/solid.view.ts"; // r7 nazariya2
import { makeArenaView } from "./arena/arena.view.ts";
import { makeCircuitView } from "./yantra/circuit.view.ts";
import { makeKaalView } from "./kaal/kaal.view.ts";
import { makeVakyaView } from "./vakya/vakya.view.ts";
import { makeKilaView } from "./kila/kila.view.ts";
import { makeGhadiView } from "./ghadi/ghadi.view.ts";
import { makeNakshaView } from "./naksha/naksha.view.ts";
import { makeGunaView } from "./guna/guna.view.ts";
import { makeKramView } from "./kram/kram.view.ts";
import { makeHissaView } from "./hissa/hissa.view.ts";
import { makeKoshtakView } from "./koshtak/koshtak.view.ts";
import { makeParkarView } from "./parkar/parkar.view.ts";
import { makeAankdeView } from "./aankde/aankde.view.ts";
import { makePaheliView } from "./paheli/paheli.view.ts";
import { makeGaltiView } from "./galti-pakdo/galti.view.ts";
import { makeChhaanoView } from "./chhaano/chhaano.view.ts";
import { makeDarpanView } from "./darpan/darpan.view.ts";
import { makeTileView } from "./darpan/tile.view.ts";   // r7 tilings2
import { makeFeetaView } from "./feeta/feeta.view.ts";
import { makeNaapView } from "./feeta/naap.view.ts";   // r7 naap

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
  "kon/lines": makeKonView,
  "kon/cross": makeKonView,
  "kon/ends": makeKonView,
  "nazariya/views": makePlotView,
  "nazariya/array": makePlotView,
  "nazariya/floor": makePlotView,
  "nazariya/powers": makePlotView,
  "nazariya/mirror": makePlotView,
  "nazariya/tri": makeTriView,
  "nazariya/solid": makeSolidView,
  "arena/pick": makeArenaView,
  "stambh/bars": makeStambhView,
  "stambh/picto": makeStambhView,
  "yantra/beam": makeBeamView,
  "yantra/pendulum": makePendulumView,
  "yantra/circuit": makeCircuitView,
  "kaal/place": makeKaalView,
  "kaal/order": makeKaalView,
  "vakya/rail": makeVakyaView,
  "kila/multiples": makeKilaView,
  "kila/factors": makeKilaView,
  "kila/lcm": makeKilaView,
  "kila/divisibility": makeKilaView,
  "naksha/locate": makeNakshaView,
  "naksha/route": makeNakshaView,
  "naksha/scale": makeNakshaView,
  "naksha/shape": makeNakshaView,
  "ghadi/set": makeGhadiView,
  "ghadi/run": makeGhadiView,
  "ghadi/race": makeGhadiView,
  "ghadi/calendar": makeGhadiView,
  "darpan/mirror": makeDarpanView,
  "darpan/turn": makeDarpanView,
  "darpan/tile": makeTileView,
  "feeta/measure": makeFeetaView,
  "feeta/fence": makeFeetaView,
  "feeta/trip": makeFeetaView,
  "feeta/compare": makeFeetaView,
  "feeta/thread": makeNaapView,
  "feeta/thermo": makeNaapView,
  "feeta/scale": makeNaapView,
  "feeta/touch": makeNaapView,
  "guna/field": makeGunaView,
  "guna/pack": makeGunaView,
  "guna/story": makeGunaView,
  "guna/yard": makeGunaView,
  "kram/grow": makeKramView,
  "kram/machine": makeKramView,
  "kram/beats": makeKramView,
  "kram/nest": makeKramView,
  "hissa/fold": makeHissaView,
  "hissa/pour": makeHissaView,
  "hissa/grid": makeHissaView,
  "hissa/story": makeHissaView,
  "koshtak/tray": makeKoshtakView,
  "koshtak/bin": makeKoshtakView,
  "parkar/build": makeParkarView,
  "parkar/bisect": makeParkarView,
  "parkar/drop": makeParkarView,
  "aankde/tally": makeAankdeView,
  "aankde/stack": makeAankdeView,
  "aankde/line": makeAankdeView,
  "paheli/pairs": makePaheliView,
  "paheli/magic": makePaheliView,
  "paheli/cipher": makePaheliView,
  "paheli/mirror": makePaheliView,
  "galti-pakdo/kaapi": makeGaltiView,
  "chhaano/sukha": makeChhaanoView,
  "chhaano/geela": makeChhaanoView,
};
export function viewFor(family: FamilyId, mode: PlayMode): MakeView | null { return VIEWS[`${family}/${mode}`] ?? null; }
