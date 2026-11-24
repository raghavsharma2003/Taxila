// The play family registry: (family, mode) → its pure logic. Client and server import this one table.
import type { FamilyId, FamilyLogic, PlayActBody, PlayMode } from "../../../shared/play.ts";
import { atomsLogic } from "./todo-jodo/atoms.logic.ts";
import { stripsLogic } from "./todo-jodo/strips.logic.ts";
import { bundlesLogic } from "./todo-jodo/bundles.logic.ts";
import { balanceLogic } from "./taraazu/balance.logic.ts";
import { weighLogic } from "./taraazu/weigh.logic.ts";
import { lineLogic } from "./nishana/line.logic.ts";
import { labLogic } from "./kyun-lab/lab.logic.ts";
import { chumbakLogic } from "./kyun-lab/chumbak.logic.ts";   // r7 chumbak
import { konLogic } from "./kon/kon.logic.ts";
import { stambhLogic } from "./stambh/stambh.logic.ts";
import { tallyLogic } from "./stambh/tally.logic.ts";   // r8 stambh/tally
import { beamLogic } from "./yantra/beam.logic.ts";
import { pendulumLogic } from "./yantra/pendulum.logic.ts";
import { viewsLogic, arrayLogic, floorLogic, powersLogic, mirrorLogic, triLogic, solidLogic } from "./nazariya/index.ts";   // r4-khand
import { arenaLogic } from "./arena/arena.logic.ts";
import { circuitLogic } from "./yantra/circuit.logic.ts";
import { roshniLogic } from "./yantra/roshni.logic.ts";
import { kaalLogic } from "./kaal/kaal.logic.ts";
import { vakyaLogic } from "./vakya/vakya.logic.ts";
import { kilaLogic } from "./kila/kila.logic.ts";
import { ghadiLogic } from "./ghadi/ghadi.logic.ts";
import { nakshaLogic } from "./naksha/naksha.logic.ts";
import { gunaLogic } from "./guna/guna.logic.ts";
import { kramLogic } from "./kram/kram.logic.ts";
import { hissaLogic } from "./hissa/hissa.logic.ts";
import { koshtakLogic } from "./koshtak/koshtak.logic.ts";
import { parkarLogic } from "./parkar/parkar.logic.ts";
import { aankdeLogic } from "./aankde/aankde.logic.ts";
import { paheliLogic } from "./paheli/paheli.logic.ts";
import { galtiLogic } from "./galti-pakdo/galti.logic.ts";
import { chhaanoLogic } from "./chhaano/chhaano.logic.ts";
import { gatiLogic } from "./gati/gati.logic.ts";
import { bhaapLogic } from "./bhaap/bhaap.logic.ts";
import { aakashLogic } from "./aakash/aakash.logic.ts";
import { rangLogic } from "./rang/rang.logic.ts";
import { badlaavLogic } from "./badlaav/badlaav.logic.ts";
import { jaanchLogic } from "./jaanch/jaanch.logic.ts";
import { darpanLogic } from "./darpan/darpan.logic.ts";
import { tileLogic } from "./darpan/tile.logic.ts";   // r7 tilings2
import { feetaLogic } from "./feeta/feeta.logic.ts";
import { naapLogic } from "./feeta/naap.logic.ts";   // r7 naap

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
  // r7 chumbak: magnets, class 6 science (pins along a hidden magnet, a toy train, the sure test, a snapped magnet, the kit's
  // 20 pins against 8; a hung magnet and a map, a compass turned with her, a compass by the iron); never timed
  "kyun-lab/dhruv": asAny(chumbakLogic),
  "kyun-lab/disha": asAny(chumbakLogic),
  "kon/turn": asAny(konLogic),
  "kon/set": asAny(konLogic),
  "kon/zone": asAny(konLogic),
  "kon/pair": asAny(konLogic),
  "kon/close": asAny(konLogic),
  "kon/lines": asAny(konLogic),
  "kon/cross": asAny(konLogic),
  "kon/ends": asAny(konLogic),
  // r4-khand: Nazariya, drawn by the Khand block world
  "nazariya/views": asAny(viewsLogic),
  "nazariya/array": asAny(arrayLogic),
  "nazariya/floor": asAny(floorLogic),
  "nazariya/powers": asAny(powersLogic),
  "nazariya/mirror": asAny(mirrorLogic),
  "nazariya/tri": asAny(triLogic),       // r7 nazariya2: the cloth as half a rectangle (c6-maths-ch06-t03)
  "nazariya/solid": asAny(solidLogic),   // r7 nazariya2: faces, edges and corners of a solid turned in the hand (c4-maths-ch01-t01)
  "arena/pick": asAny(arenaLogic),
  // round 7: Stambh, bar graphs and pictographs
  "stambh/bars": asAny(stambhLogic),
  "stambh/picto": asAny(stambhLogic),
  "stambh/tally": asAny(tallyLogic),   // r8: tallies kept in fives (keep) and read (read)
  // round 7 E6: Yantra
  "yantra/beam": asAny(beamLogic),
  "yantra/pendulum": asAny(pendulumLogic),
  "yantra/roshni": asAny(roshniLogic),     // r7 roshni: switch kit-named sources, place kit-named screens, LOOK: what the eye sees
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
  "darpan/tile": asAny(tileLogic),   // r7 tilings2: copies round one point until the corner closes (c7-maths-ch14-t02)
  // round 7: Feeta, length and distance (a ruler, a cm tape, a garden fence, a trip meter, routes in order); never timed
  "feeta/measure": asAny(feetaLogic),
  "feeta/fence": asAny(feetaLogic),
  "feeta/trip": asAny(feetaLogic),
  "feeta/compare": asAny(feetaLogic),
  // r7 naap: science measuring, class 6 (a thread along a curve and a map road; thermometers picked, dipped and read; a
  // scale read from a full mark with the eye above, foot-rulers along metres; things on a warmth shelf); never timed
  "feeta/thread": asAny(naapLogic),
  "feeta/thermo": asAny(naapLogic),
  "feeta/scale": asAny(naapLogic),
  "feeta/touch": asAny(naapLogic),
  // round 7: Guna, multi-digit multiplication and division (a field cut into place-value pieces and a weighed truck, a godown
  // shared into equal trucks, stories whose leftovers decide); nothing runs on a clock
  "guna/field": asAny(gunaLogic),
  "guna/pack": asAny(gunaLogic),
  "guna/story": asAny(gunaLogic),
  "guna/yard": asAny(gunaLogic),
  // round 7: Kram, growing patterns and sequences (a figure grown a stage, a bag for a far stage, step / rule machines,
  // rhythms of short and long beats, L-pieces and staircases nested into a square); never timed
  "kram/grow": asAny(kramLogic),
  "kram/machine": asAny(kramLogic),
  "kram/beats": asAny(kramLogic),
  "kram/nest": asAny(kramLogic),
  // round 7: Hissa, multiplying and dividing fractions and decimals (a sheet folded twice, a jug poured into cups, a tenths
  // grid and a place-value slide, stories spent and scaled); nothing runs on a clock
  "hissa/fold": asAny(hissaLogic),
  "hissa/pour": asAny(hissaLogic),
  "hissa/grid": asAny(hissaLogic),
  "hissa/story": asAny(hissaLogic),
  // round 7: Koshtak, expressions (tray walls between terms, one lid to make a value, a bracket opened as jumps, like terms
  // in bins); nothing runs on a clock
  "koshtak/tray": asAny(koshtakLogic),
  "koshtak/bin": asAny(koshtakLogic),
  // round 7: Parkar, ruler-and-compass constructions (triangles from arcs and rays, bisectors, 60°, altitudes); never timed
  "parkar/build": asAny(parkarLogic),
  "parkar/bisect": asAny(parkarLogic),
  "parkar/drop": asAny(parkarLogic),
  // round 7: Aankde, data and statistics (tallies in bundles of five, a lost row, the mode; towers levelled to the mean, a
  // pour line; a line of cards folded to its median); never timed
  "aankde/tally": asAny(aankdeLogic),
  "aankde/stack": asAny(aankdeLogic),
  "aankde/line": asAny(aankdeLogic),
  // round 7: Paheli, number puzzles (parity by pairing, magic squares, letter sums, reverse-and-add); never timed
  "paheli/pairs": asAny(paheliLogic),
  "paheli/magic": asAny(paheliLogic),
  "paheli/cipher": asAny(paheliLogic),
  "paheli/mirror": asAny(paheliLogic),
  // round 7: Galti Pakdo, a friend's working of an equation checked on the taraazu, the first wrong line caught and mended
  "galti-pakdo/kaapi": asAny(galtiLogic),
  // round 7: Chhaano, separating mixtures (class 6 science): dry piles split by threshing, winnowing, handpicking and sieving;
  // a beaker of water settled, decanted, filtered and dried in the sun, every solid scooped into its jar
  "chhaano/sukha": asAny(chhaanoLogic),
  "chhaano/geela": asAny(chhaanoLogic),
  // round 7: Gati, motion (a reference point, the types of motion, speed on a marked track, uniform trails); never timed
  "gati/drishti": asAny(gatiLogic),
  "gati/raftaar": asAny(gatiLogic),
  "gati/nishaan": asAny(gatiLogic),
  // round 7: Bhaap, processes of water and air (class 6-7 science): the pot heated and cooled through its states, water
  // evaporating and condensing, convection on the beach and in a room, the water cycle and the ground; a step per tap
  "bhaap/avastha": asAny(bhaapLogic),
  "bhaap/bhaapan": asAny(bhaapLogic),
  "bhaap/hawa": asAny(bhaapLogic),
  "bhaap/chakra": asAny(bhaapLogic),
  // round 7: Aakash, the Earth's motions, seasons and eclipses (class 7 science): the Earth spun and moved round the Sun, its
  // axis kept, the Moon moved round the Earth; a step per tap
  "aakash/chakkar": asAny(aakashLogic),
  "aakash/ritu": asAny(aakashLogic),
  "aakash/grahan": asAny(aakashLogic),
  // round 7: Rang, acids, bases, indicators and neutralisation (class 7 science): drops onto indicators, cups sorted by their
  // colours, a base added drop by drop; a step per tap
  "rang/pehchaan": asAny(rangLogic),
  "rang/milao": asAny(rangLogic),
  // round 7: Badlaav, physical and chemical changes, rusting and combustion (class 7 science): changes run and undone, solids
  // melted or dissolved, a sigri's triangle, a fire burnt down, iron kept damp or dry; a step per tap
  "badlaav/palat": asAny(badlaavLogic),
  "badlaav/aag": asAny(badlaavLogic),
  // round 7: Jaanch, testing food for starch and fat (class 6 science): dilute iodine a drop at a time, a food rubbed on paper
  // left to dry a Wait at a time, both tests on one food; a step per tap
  "jaanch/neela": asAny(jaanchLogic),
  "jaanch/daag": asAny(jaanchLogic),
  "jaanch/thali": asAny(jaanchLogic),
};
export function logicFor(family: FamilyId, mode: PlayMode): AnyLogic | null { return LOGIC[`${family}/${mode}`] ?? null; }
