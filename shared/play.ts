// Play grammar `play@1` (round 3, stream "play"; docs/design/round3/play/GRAMMAR.md and DESIGN.md).
//
// THE contract between the play families (src/play/families/**), the play server (server/play/**), the lesson (the
// Director / Stagecraft seam, owned by other streams and reached through patches) and the forge stream (which targets this
// file for live composition). One module, imported by the client, the server (Node type stripping) and the tests.
//
// Erasable TypeScript only (no enums, namespaces or parameter properties: `rs4-erasable-ts`).
//
// The laws this contract encodes (DESIGN.md §0):
//   - a level is built by CODE (a family generator), solver-checked and shortcut-free before it is served; no model writes a
//     level, a key, a position, a count or an outcome;
//   - the child's input is an ACT on the idea (split, cut, take, place, set); the law answers; the SERVER replays the raw
//     acts through the same pure law and grades; a frame's claim is never an input;
//   - in-game evidence enters the learner model at GAME_WEIGHT; only a bare item outside the game can make a skill secure;
//   - the world is a pure view of the learner ledger (pencil / ink), drawn on real prerequisite edges only; no counters;
//   - the teacher reacts to MOMENTS with authored, guarded lines; she never speaks mid-drag and never judges the child.

// ───────────────────────────── identifiers ─────────────────────────────

export const PLAY_VERSION = "play@1" as const;
/** The four flagship families of round 3. The grammar is open: a new family adds its id here and registers its logic. */
export const FAMILIES = ["todo-jodo", "taraazu", "nishana", "kyun-lab",
  "kon",          // round 4 G1: angles as an amount of turning (E1 Antariksh angles)
  "nazariya",   // r4-khand: block world (views, arrays, area/perimeter, squares/cubes, mirror)
  "arena",        // round 4 G1: ITEM-ARENA, one verified kit item per level, graded against its verified key
  "stambh",     // round 7: bar graphs and pictographs built from falling crates / stacked icons
  "yantra",     // round 7 E6: science puzzle-physics (mirrors route a beam, circuits close a loop, a pendulum keeps a beat)
  "kaal",       // round 7: SST time — Kaal-nadi, events placed on a river of time (BCE left, CE right, no year 0)
  "vakya",      // round 7: English / Hindi grammar, a sentence built as a train of word wagons (one verified kit item per level)
  "kila",       // round 7 E4: turn-based tower defence on a numbered path (multiples, factors, LCM); a beat moves only on a press
  "naksha",     // round 7: maps and grids (lat / long, grid routes and directions, map scale, shapes on a dot grid)
  "ghadi",      // round 7: time and clocks (a geared clock set by hand, bus trips, a race podium, a month calendar); never timed
  "darpan",     // round 7: symmetry (mirror lines laid and folded; a turntable's smallest turn and order of turn symmetry)
  "feeta",      // round 7: length and distance (a ribbon cut against a ruler, a rope off a cm tape, a garden fence, a trip meter, routes in order)
  "guna",       // round 7: multi-digit multiplication and division (a field cut into place-value pieces, a godown shared into trucks, stories with leftovers)
  "kram",       // round 7: growing patterns and sequences (a figure grown a stage, a bag for a far stage, step / rule machines, rhythms, L-pieces)
  "hissa",      // round 7: multiplying and dividing fractions and decimals (a sheet folded twice, a jug poured into cups, a tenths grid, a place-value slide, stories)
  "koshtak",    // round 7: expressions (tray walls between terms, one lid to make a value, a bracket opened as jumps, like terms in bins)
  "parkar",     // round 7: ruler-and-compass constructions (triangles built from arcs and rays, bisectors, the 60° angle, altitudes by set-square)
  "aankde",     // round 7: data (slips tallied in bundles of five, a lost row, the size sold most; towers levelled, a pour line; a line of cards folded to its middle)
  "paheli",     // round 7: number puzzles (bags loaded by parity, magic squares, letter sums with carries, reverse-and-add palindromes)
  "galti-pakdo", // round 7: a friend's working of an equation checked on the taraazu; the first wrong line caught and mended
  "chhaano",    // round 7: separating mixtures (class 6 science): methods chosen and applied in turn until every part is recovered
  "gati",       // round 7: motion (a reference point, the types of motion, speed on a marked track, uniform trails); the child steps the clock
  "bhaap",      // round 7: processes of water and air (states, evaporation and condensation, convection and breezes, the water cycle and groundwater); the child runs them a step at a time
  "aakash",     // round 7: the Earth's motions, seasons and eclipses (class 7 science): a model the child spins and moves round, a step at a time
  "rang",       // round 7: acids, bases, indicators and neutralisation (class 7 science): a dropper the child works a drop at a time
  "badlaav",    // round 7: physical and chemical changes, rusting and combustion (class 7 science): changes the child runs, undoes and tends a step at a time
  "jaanch",     // round 7: testing food for starch and fat (class 6 science): iodine a drop at a time, a food rubbed on paper left to dry a Wait at a time
] as const;
export type FamilyId = (typeof FAMILIES)[number];
/** Family sub-worlds. A mode is one representation with its own law inside a family. */
export const MODES = {
  "todo-jodo": ["atoms", "strips", "bundles"],
  taraazu: ["equation", "equality", "weigh", "fill"],   // r7: weigh (kg / g on a pan balance), fill (l / ml with jugs)
  nishana: ["place", "compare", "hop"],
  "kyun-lab": ["fair-test", "dhruv", "disha"],   // r7 chumbak: magnets (dhruv: poles, push and pull; disha: finding directions)
  kon: ["turn", "set", "zone", "pair", "close", "lines", "cross", "ends", "place", "name"],
  nazariya: ["views", "array", "floor", "powers", "mirror", "tri", "solid"],   // r4-khand; r7 nazariya2: tri (a triangle's cloth as half a rectangle), solid (faces / edges / corners of a solid turned in the hand)
  arena: ["pick"],
  stambh: ["bars", "picto", "tally"],   // r8 tally: tallies kept in fives while a scene passes (keep) or read off a row (read)
  yantra: ["beam", "circuit", "pendulum", "roshni"],   // r7 roshni: sources of light and materials (a light bench, the eye on its right)
  kaal: ["place", "order"],
  vakya: ["rail"],
  kila: ["multiples", "factors", "lcm", "divisibility"],
  naksha: ["locate", "route", "scale", "shape"],
  ghadi: ["set", "run", "race", "calendar"],
  darpan: ["mirror", "turn", "tile"],   // r7 tilings2: tile (copies laid round one point until the corner closes)
  feeta: ["measure", "fence", "trip", "compare", "thread", "thermo", "scale", "touch"],   // r7 naap: science measuring (a thread along a curve, thermometers, a scale read right, touch against a thermometer)
  guna: ["field", "pack", "story", "yard"],   // r7 place2: yard (a truck loaded to a named number; comma posts set for lakhs and crores)
  kram: ["grow", "machine", "beats", "nest"],
  hissa: ["fold", "pour", "grid", "story"],
  koshtak: ["tray", "bin"],
  parkar: ["build", "bisect", "drop"],
  aankde: ["tally", "stack", "line"],
  paheli: ["pairs", "magic", "cipher", "mirror"],
  "galti-pakdo": ["kaapi"],   // the friend's notebook (kaapi)
  chhaano: ["sukha", "geela"], // dry mixtures (handpick, thresh, winnow, sieve); mixtures in water (settle, decant, filter, evaporate)
  gati: ["drishti", "raftaar", "nishaan"],   // the viewpoint (drishti), speed (raftaar), the marks (nishaan)
  bhaap: ["avastha", "bhaapan", "hawa", "chakra"],   // states of water (avastha), evaporation and condensation (bhaapan), convection (hawa), the water cycle (chakra)
  aakash: ["chakkar", "ritu", "grahan"],   // rotation and revolution (chakkar), seasons (ritu), eclipses (grahan)
  rang: ["pehchaan", "milao"],   // natural indicators (pehchaan), neutralisation (milao)
  badlaav: ["palat", "aag"],   // physical and chemical changes (palat), rusting and combustion (aag)
  jaanch: ["neela", "daag", "thali"],   // the iodine test for starch (neela), the paper test for fat (daag), both tests on one food (thali)
} as const satisfies Record<FamilyId, readonly string[]>;
export type ModeOf<F extends FamilyId> = (typeof MODES)[F][number];
export type PlayMode = (typeof MODES)[FamilyId][number];

export const ARTS = ["kagaz", "chalk", "blueprint", "raat"] as const;
export type ArtId = (typeof ARTS)[number];
export type Lang = "en" | "hi" | "hinglish";
/** Fade stage inside the game (DESIGN.md §3): 1 concrete world · 2 world + live symbol · 3 the symbol is the controller.
 *  Stage 4, the bare item, is outside the game by definition and is the Director's, never a play level. */
export type Fade = 1 | 2 | 3;
export type Door = "garam" | "teekha";
export type Subject = "maths" | "science" | "evs";

// ───────────────────────────── layout floors (DESIGN.md §7; checked by the shot harness) ─────────────────────────────

export const FLOORS = Object.freeze({
  /** minimum rendered text height for labels and values, CSS px (class 4-5 labels use `textYoung`) */
  text: 14, textYoung: 16, numeral: 16,
  /** minimum hit area of anything the child touches, CSS px, and the gap between neighbours */
  target: 44, targetGap: 8,
  /** phone chrome rows (play mode): top bar, teacher strip, goal rail, controls */
  topBar: 44, teacherStrip: 64, rail: 52, controls: 64,
  /** wide layout side column */
  sideColumn: 340, wideAt: 900,
});

// ───────────────────────────── the game weight (DESIGN.md §8) ─────────────────────────────

/** In-game evidence weight into the learner model (the existing `game-evidence-into-kt-not-bayesnets` decision). */
export const GAME_WEIGHT = 0.5;
/**
 * The chance-adjusted weight (games audit GAMES-03): a CORRECT outcome on a one-decision goal (`FamilyLogic.oneDecision`:
 * one pick among a few lines, kinds, places or corners, which a lucky first tap lands 20 to 40 % of the time) enters the
 * learner model at the arena's weight, GAME_WEIGHT × the controllerEasy temper 0.5 (server/play/evidence.js, kt/bktr.js).
 * An incorrect or partial outcome on the same goal keeps GAME_WEIGHT: a miss is not luck.
 */
export const CHANCE_WEIGHT = 0.25;
export type GameWeight = typeof GAME_WEIGHT | typeof CHANCE_WEIGHT;

// ───────────────────────────── levels ─────────────────────────────

/** What the generator proved about a level before it could be served (P-O1/O3). */
export interface LevelProof {
  solvable: true;
  shortcutFree: true;
  /** the shortest solution in acts (a display budget, never a penalty) */
  minActs: number;
  /** how many distinct solutions the solver enumerated (capped) */
  solutions: number;
  /** misconception ids whose mal-rule act sequence differs observably from every correct one on this level */
  discriminates: string[];
  /** predicted first-try success for this child (band fit, 0..1) and the score the picker gave the level */
  pFirstTry: number; score: number;
  genMs: number;
}
/**
 * One level: fully specified, code-built, solver-checked. `params` is family-specific and validated by the family's
 * `validate()`. A level never carries child-facing prose: strings come from the authored bank by id.
 */
export interface PlayLevel<P = unknown> {
  v: typeof PLAY_VERSION;
  levelId: string;
  family: FamilyId;
  mode: PlayMode;
  topicId: string;
  skillId: string;
  fade: Fade;
  /** the level's goal predicate id (family-specific, closed list) */
  goal: string;
  params: P;
  /** misconception ids this level is meant to tell apart (kit ids) */
  targets: string[];
  /** the family's mal-rule id → the kit misconception id for this topic (from data/play/coverage.json) */
  mal: Record<string, string>;
  /** "spot the slip": the apprentice's bugged work is shown; the child finds and fixes it */
  slip?: { misconceptionId: string; by: "bittu" | "golu" } | null;
  /** which door produced it (absent on the first level of a segment) */
  door?: Door;
  /** a context skin id from data/play/contexts.json (fictional, no factual claim); never changes the maths */
  context: string;
  seed: number;
  proof: LevelProof;
  /** the generator's level signature (what novelty compares; the session keeps the recent ones) */
  sig?: string;
}

// ───────────────────────────── acts (the only input that can change game state) ─────────────────────────────

export type ActVia = "touch" | "voice" | "key";
/** The envelope every family act travels in. `t` = ms since the level mounted (device clock; never used to grade). */
export interface PlayActEnvelope<A = PlayActBody> { seq: number; t: number; via: ActVia; act: A }

// Todo-Jodo
export type AtomsAct =
  | { kind: "split"; node: string; by: number }          // divide block `node` by `by` (1 < by < value, or the law refuses)
  | { kind: "done" }                                    // declare every leaf an atom
  | { kind: "predict"; same: boolean }                  // two benches: will the two trees end in the same atoms?
  | { kind: "share"; atom: string; with: string }       // HCF/LCM: pair an atom of tree A with an equal atom of tree B
  | { kind: "unshare"; atom: string }
  | { kind: "name"; x: number }                         // fade 2-3 / HCF-LCM: name the value the world built
  | { kind: "undo" };
export type StripsAct =
  | { kind: "cut"; bar: number; k: number }             // re-cut every part of `bar` into k (2..6)
  | { kind: "join"; bar: number; k: number }            // join every k neighbours (only alike, aligned pieces)
  | { kind: "shade"; bar: number; part: number }        // toggle one part
  | { kind: "pour"; from: number; to: number }          // move the shaded pieces of `from` into `to`
  | { kind: "choose"; bar: number }                     // compare: "this one is more" (or -1 for "same")
  | { kind: "name"; bar: number; n: number; d: number } // fade 3: name a bar's amount (the symbol as the controller)
  | { kind: "done" }
  | { kind: "undo" };
export type BundlesAct =
  | { kind: "unbundle"; place: number }                 // 1 of place p → 10 of place p-1 (0 = ones)
  | { kind: "take"; place: number; n: number }          // take n blocks away from place p (subtraction goal)
  | { kind: "write"; place: number; digit: number }     // fade 3: write the answer digit of place p
  | { kind: "done" }
  | { kind: "undo" };
// Taraazu
export type BalanceAct =
  | { kind: "take"; side: "L" | "R"; what: "unit" | "bag" }
  | { kind: "group"; k: number }                        // split both pans into k equal groups, keep one each
  | { kind: "open" }                                    // open the lone bag (only on a level scale)
  | { kind: "drop"; n: number }                         // equality mode: put n cubes in the box (replaces its content)
  | { kind: "name"; x: number }                         // name the bag's value
  | { kind: "undo" };
// Taraazu weigh / fill (round 7, measurement): real weights onto the right pan, real jugs into the vessel; the beam stays
// locked while loading and only "weigh" (Tolo / Dekho) lets the law answer
export type WeighAct =
  | { kind: "load"; weight: number }                    // one weight of `weight` g from the box onto the right pan
  | { kind: "unload"; weight: number }                  // one weight of `weight` g off the pan, back into the box
  | { kind: "pour"; jug: number }                       // fill: one full jug of `jug` ml into the vessel
  | { kind: "weigh" }                                   // unlock the beam (weigh) / check the water (fill)
  | { kind: "undo" };
// Nishana
export type LineAct =
  | { kind: "place"; which: number; x: number }         // put marker `which` at line coordinate x (a number in [lo, hi])
  | { kind: "commit" }
  | { kind: "order"; first: number }                    // compare: which value is smaller (marker index), or -1 = equal
  | { kind: "round"; to: number }                       // round goal: the landmark (an end of the line) the value rounds to
  | { kind: "undo" };
// Kyun-Lab
export type LabAct =
  | { kind: "set"; setup: number; factor: string; level: string }
  | { kind: "predict"; choice: string }                 // "A" | "B" | "same" | a setup's outcome bucket
  | { kind: "run" }
  | { kind: "conclude"; factor: string }                // the factor that made the difference, or "cant_tell"
  | { kind: "undo" };
// Kon (round 4 G1, angles)
export type KonAct =
  | { kind: "turn"; deg: number }                       // point the arm at heading `deg` (degrees, 0 = right, anticlockwise +)
  | { kind: "stop"; side: "lo" | "hi"; at: number }      // r7 kon2 ends: a stop on point `at`, −1 off the track's end (open), −2 parked
  // r8 kon/place: the loose protractor (board px, y up): its centre moved, turned to `deg` (1° steps), locked / freed; then
  // measure reads `n` off the scale, draw puts a dot at rim angle `r` and joins it to O ("v") or A ("e"); size picks an angle
  | { kind: "move"; x: number; y: number }
  | { kind: "spin"; deg: number }
  | { kind: "lock" }
  | { kind: "free" }
  | { kind: "read"; n: number }
  | { kind: "mark"; r: number }
  | { kind: "join"; end: "v" | "e" }
  | { kind: "pick"; which: "a" | "b" | "same" }
  // r8 kon/name: say taps a lettered point (`at`: 0 = the vertex, 1..3 = the ray ends) or clears the name; find taps an arc
  | { kind: "letter"; at: number }
  | { kind: "arc"; at: number }
  | { kind: "clear" }
  | { kind: "commit" }
  | { kind: "undo" };
// Nazariya (r4-khand): the block plot. A build act changes column heights (gravity: a block rests on the ground or a block).
export type NazariyaAct =
  | { kind: "place"; x: number; z: number }             // one block on top of column (x, z)
  | { kind: "remove"; x: number; z: number }            // the top block of column (x, z)
  | { kind: "layer"; x0: number; z0: number; x1: number; z1: number }   // one block on every open column of the rectangle
  | { kind: "clear"; x0: number; z0: number; x1: number; z1: number }   // the top block off every open column of the rectangle
  | { kind: "name"; n: number }                         // say how many blocks (array count; the next square / cube number)
  | { kind: "predict"; same: boolean }                  // array "turn": the turned array takes the same number of blocks?
  | { kind: "check" }                                   // commit the build: the law compares it with the goal
  | { kind: "apex"; x: number; z: number }              // tri "more": the second tent's top corner to grid point (x, z)
  | { kind: "turn"; dir: "left" | "right" | "over" }    // solid: turn the solid a quarter round, or tip it over
  | { kind: "mark"; el: "face" | "edge" | "corner"; i: number }   // solid: stamp face i / run along edge i / pin corner i
  | { kind: "undo" };
// ITEM-ARENA (round 4 G1)
export type ArenaAct =
  | { kind: "aim"; option: string }                     // point at a target (an option id)
  | { kind: "fire" }                                    // the shot: graded against the verified key
  | { kind: "undo" };
// Stambh (round 7, bar graphs and pictographs): one crate / icon at a time on a column (bars) or a row (picto)
export type StambhAct =
  | { kind: "drop"; col: number; half?: boolean }       // a crate (or, where the level allows, a half crate) onto column `col`
  | { kind: "lift"; col: number }                       // the top crate off column `col`
  | { kind: "check" }                                   // the law compares every bar with the data
  | { kind: "mark"; row: number; across?: boolean }     // tally keep: one stroke (standing, or the line across) for the thing passing, on row `row`
  | { kind: "total"; row: number; n: number | null }    // tally: the number written in row `row`'s total cell (null clears it)
  | { kind: "undo" };
// Yantra (round 7 E6, science puzzle-physics). Parts sit on a board; the child places and turns them, wires terminals or sets
// knobs, then RUNs: the law (never a physics engine) decides what happens, and the view animates it.
export type YantraAct =
  | { kind: "place"; part: string; x: number; y: number; rot?: number }   // beam: a part (a mirror) onto a board cell, at `rot` degrees
  | { kind: "rotate"; id: string; rot: number }                         // beam: turn a placed part to `rot` degrees
  | { kind: "remove"; id: string }                                      // beam: take a placed part off
  | { kind: "wire"; a: string; b: string }                              // circuit: join terminal `a` to terminal `b`
  | { kind: "unwire"; a: string; b: string }                            // circuit: cut that wire
  | { kind: "toggle"; id: string }                                      // circuit: open / close a switch
  | { kind: "set"; knob: string; value: number }                        // pendulum: a knob (length, mass, swing) to a value
  | { kind: "run" }                                                     // run the machine: the law answers
  | { kind: "count"; at: number }                                       // pendulum (oscillation): "one more", `at` s after the release
  | { kind: "undo" };
// Kaal (round 7, SST time): the boat carries a stone along the river of time; `year` is a real year (negative = BCE, never 0)
export type KaalAct =
  | { kind: "place"; which: number; year: number }      // bring the boat with stone `which` to `year` (the law refuses year 0)
  | { kind: "check" }                                   // RUN: drop the stone; the law compares it with the event's verified year
  | { kind: "undo" };
// Vakya (round 7, grammar): word wagons coupled into a sentence train; a form wagon turns on its turntable; RUN checks it
export type VakyaAct =
  | { kind: "couple"; wagon: string; at: number }       // couple wagon `wagon` onto the track at position `at` (0 = right behind the engine); a coupled wagon moves
  | { kind: "uncouple"; wagon: string }                 // send a coupled wagon back to the yard
  | { kind: "turn"; wagon: string; form: number }       // turn a form wagon's turntable to its form `form` (an index into the wagon's forms)
  | { kind: "run" }                                     // the train rolls through the signal: the law compares it with the verified key
  | { kind: "undo" };
// Kila (round 7 E4, turn-based tower defence): a numbered path 1..n; a tower standing on square p fires on p, 2p, 3p, …; the
// wave moves one square per "next" (or to the end on "run") and never on a clock; the law judges the wave at its end
export type KilaAct =
  | { kind: "place"; at: number }                       // a tower onto square `at` (its period is `at`)
  | { kind: "remove"; at: number }                      // take the tower on square `at` down
  | { kind: "mark"; at: number }                        // a net on square `at` (toggle) / the trap moved to square `at`
  | { kind: "next" }                                    // the wave moves one square
  | { kind: "run" }                                     // the wave runs to the end of the path
  | { kind: "undo" };
// Naksha (round 7, maps and grids): set something up on the map (a spot, a program of steps, the fuel, fence corners), then
// go; the law (a plain simulation) answers and nothing moves on a clock
export type NakshaAct =
  | { kind: "put"; x: number; y: number }                // locate: the drone to (longitude x, latitude y); scale: the pump x cm along the road; shape: a fence corner at dot (x, y)
  | { kind: "step"; dir: "n" | "e" | "s" | "w" | "f" | "l" | "r" }   // route: one more step of the program (a direction, or forward / turn left / turn right)
  | { kind: "set"; value: number }                       // scale: the fuel in the tank (real units)
  | { kind: "run" }                                      // go: the law answers
  | { kind: "undo" };
// Ghadi (round 7, time and clocks): a geared clock (t = minutes since midnight; the hour hand follows the minute hand, and
// passing 12 turns a.m. into p.m.), a trip ticket, a podium, a calendar flag; nothing moves on a clock, "run" lets the law answer
export type GhadiAct =
  | { kind: "wind"; by: number }                         // turn the minute hand by `by` minutes (signed; the hour hand follows)
  | { kind: "hour"; h: number }                          // the hour hand dropped in hour sector h (0..11, 0 = 12): the minutes stay
  | { kind: "half"; pm: boolean }                        // the day strip: a.m. (midnight to noon) or p.m. (noon to midnight)
  | { kind: "ticket"; h: number; m: number }             // trip: the ticket's hours and minutes
  | { kind: "put"; lane: number; at: number }            // race: runner `lane` onto podium step `at` (0 = first; swaps)
  | { kind: "pick"; day: number }                        // calendar: the flag onto date `day`
  | { kind: "run" }                                      // ring the bell / run the bus / run the race / hop the days: the law answers
  | { kind: "undo" };
// Darpan (round 7, symmetry): lay mirror lines and fold, or turn a figure on a turntable and spin; the law (plain geometry)
// answers on the go and nothing moves on a clock
export type DarpanAct =
  | { kind: "line"; deg: number }                        // mirror: lay (or lift) the fold line through the centre at this angle
  | { kind: "turn"; by: number }                         // turn: move the dial by this many degrees (clockwise +)
  | { kind: "mark" }                                     // turn (order): mark (or unmark) the dial's present stop
  | { kind: "lay"; t: number; c?: number }               // tile: lay a copy of tray tile t round the point (its corner c there)
  | { kind: "lift"; j: number }                          // tile: lift the j-th copy laid
  | { kind: "run" }                                      // fold / spin / tile the floor: the law answers
  | { kind: "undo" };
// Feeta (round 7, length and distance): set a measuring instrument (a ribbon's cut on a ruler from 0, a cm tape, a fence
// roll, a trip meter) or put lengths in order; the law (plain arithmetic in one unit) answers on "run", never on a clock.
// r7 naap (science measuring, class 6): a thread laid along a curve and straightened on a scale, thermometers matched to
// jobs, dipped and read, a scale read from its zero with the eye above, things put on a warmth shelf before a thermometer
// checks them; the reading set on the same counter wheels
export type FeetaAct =
  | { kind: "mark"; at: number }                         // the instrument set to `at` of its own unit (cm, m): the cut / the meter
  | { kind: "put"; lane: number; at: number }            // compare: item `lane` onto slot `at` (0 = shortest; swaps); naap: onto bin / step `at`
  | { kind: "tool"; t: number }                          // thread: take the thread (0), the rubber band (1) or the ruler (2)
  | { kind: "pin"; i: number }                           // thread: press the tool at point i of the curve (again = lifted off it)
  | { kind: "lift" }                                     // thread: straighten what is laid onto the scale (again = lay it again)
  | { kind: "dip" }                                      // thermo/read: the thermometer into the liquid (again = taken out)
  | { kind: "slide"; at: number }                        // scale/ruler: the object's left end lined up at cm position `at`
  | { kind: "eye"; at: number }                          // scale/ruler: the eye left of (−1), above (0) or right of (1) the end
  | { kind: "run" }                                    // lay the ribbon / fence the garden / ride the trip / ride the routes: the law answers
  | { kind: "undo" };
// Guna (round 7, multi-digit multiplication and division): a field a × b cut into place-value pieces (each fills with its
// tiles) and a truck loaded with place-value crates; a godown of crates shared one round at a time into equal trucks (a
// crate opened into ten of the next place when it cannot be shared); a story's vehicles / packets / jar set, then run
export type GunaAct =
  | { kind: "cut"; side: number; at: number }            // field: a cut on side 0 (a, across) or 1 (b, down) at unit `at` (again = lifted)
  | { kind: "round"; side: number; to: number }          // field (round): the side stretched / shrunk to a round length
  | { kind: "crate"; place: number; by: number }         // field: one crate of 10^place on (+1) or off (−1) the truck
  | { kind: "open"; place: number }                      // pack: one crate of 10^place opened into ten of the next place down
  | { kind: "deal"; place: number }                      // pack: one crate of 10^place into every truck (one round)
  | { kind: "count"; n: number }                         // story: the vehicles / packets set out, or the jar's count
  | { kind: "stamp"; i: number; to: number }             // field (check): docket i marked 1 (could be right) or 2 (send back)
  | { kind: "post"; at: number }                         // yard (commas): a comma post left of place `at` (again = lifted)
  | { kind: "run" }                                      // drive onto the weighbridge / send the trucks / run the story: the law answers
  | { kind: "undo" };
// Kram (round 7, growing patterns and sequences): tiles laid to grow a figure a stage, a bag filled for a far stage, a step
// or rule machine's dials set, rhythms laid on a shelf, L-pieces / staircases picked for a frame; the law answers on "run"
export type KramAct =
  | { kind: "cell"; x: number; y: number }                // next: a tile laid on (or lifted off) the build board at (x, y)
  | { kind: "bag"; place: number; by: number }            // far / count: one piece of 10^place into (+1) or out of (−1) the bag
  | { kind: "dial"; which: number; to: number }           // machine: dial 0 (step: the sign · rule: a) or 1 (the number · b) set to `to`
  | { kind: "lay"; r: string }                            // lay: a rhythm of S / L laid on the new shelf (again = lifted)
  | { kind: "pick"; i: number }                           // nest: tray piece i picked (again = put back)
  | { kind: "run" }                                       // grow it / run the machine / play the rhythms / nest the pieces: the law answers
  | { kind: "undo" };
// Parkar (round 7, ruler-and-compass constructions): open the compass on its ruler, swing arcs from spots, lay the
// protractor or the set-square, join two spots with the ruler, pin where two marks cross; the law (plain coordinate geometry)
// answers on "run", never on a clock. A spot exists only where tool marks put it: nothing is dragged into place
export type ParkarAct =
  | { kind: "open"; r: number }                          // the compass opened to r cm on its ruler
  | { kind: "arc"; at: string }                          // an arc swung round spot `at` at the present opening
  | { kind: "ray"; at: string; deg: number }             // the protractor at vertex `at`, zero on its arm: a ray at `deg`
  | { kind: "square"; at: string; on: number }           // the set-square along mark `on` (−1: the page's edge), its edge through `at`
  | { kind: "join"; p: string; q: string }               // the ruler through two spots
  | { kind: "pin"; a: number; b: number; k: number }     // a spot pinned at crossing k of marks a and b
  | { kind: "run" }                                      // lay the tracing / walk the line / measure: the law answers
  | { kind: "undo" };
// Aankde (round 7, data and statistics): survey slips stroked into tally rows (upright, or across the four before it), a
// lost row stroked, the stock crate put on a size; a block moved between towers, a level line set; value cards swapped and
// the peg set on a card or a gap; the law answers on "run", never on a clock
export type AankdeAct =
  | { kind: "mark"; row: number; across: boolean }       // tally: the top slip (missing: one stroke) into row `row`, upright or across
  | { kind: "crown"; row: number }                       // mode: the stock crate on row `row` (again = lifted)
  | { kind: "move"; from: number; to: number }           // even: the top block of tower `from` onto tower `to`
  | { kind: "line"; at: number }                         // pour: the level line at `at` blocks
  | { kind: "swap"; i: number; j: number }               // middle: the cards at places i and j swapped
  | { kind: "peg"; at: number }                          // middle: the peg at slot `at` (2i on card i, 2i + 1 in the gap after it)
  | { kind: "run" }                                      // count / level / pour / fold: the law answers
  | { kind: "undo" };
export type PlayActBody = AtomsAct | StripsAct | BundlesAct | BalanceAct | LineAct | LabAct | KonAct | NazariyaAct | ArenaAct | StambhAct | YantraAct | KaalAct | WeighAct | VakyaAct | KilaAct | NakshaAct | GhadiAct | DarpanAct | FeetaAct | GunaAct | KramAct | HissaAct | KoshtakAct | ParkarAct | AankdeAct | PaheliAct | GaltiAct | ChhaanoAct | GatiAct | ChumbakAct | BhaapAct | AakashAct | RangAct | BadlaavAct | JaanchAct;
// Kyun-Lab chumbak (round 7, magnets, class 6 science): a pin touched along a hidden magnet and its poles flagged; carriages
// turned round and pushed together; a marked magnet's pole brought to an end; a snapped magnet's new ends labelled; magnets
// dipped into pins; a hung magnet twisted and let go, a map turned; she turns, the compass box turns, she walks off the iron;
// the law answers on "run" (or on a claim), never on a clock
export type ChumbakAct =
  | { kind: "probe"; at: number }                        // dhruv/sira: a pin touched to spot `at` along the cover
  | { kind: "mark"; at: number }                         // dhruv/sira: spot `at` flagged as a pole (again = off)
  | { kind: "flip"; i: number }                          // dhruv/jodo: carriage i turned round
  | { kind: "near"; i: number; end: number; p: string }  // dhruv/pakka, todo: the marked magnet's pole p ("N" / "S") to thing i's end (0 left, 1 right)
  | { kind: "label"; i: number; end: number; v: string } // dhruv/todo: piece i's end labelled "N", "S" or "-" (no pole)
  | { kind: "claim"; i: number }                         // dhruv/pakka: bar i is the magnet; taakat: magnet i is the stronger
  | { kind: "dip"; i: number }                           // dhruv/taakat: magnet i dipped into the pins and lifted
  | { kind: "twist"; by: number }                        // disha/latkao: the hung magnet turned a quarter (±1) in the hand
  | { kind: "let" }                                      // disha/latkao: let go; it hangs free
  | { kind: "spin"; by: number }                         // disha/latkao: the map turned a quarter (±1)
  | { kind: "turn"; by: number }                         // disha: she turns a quarter (±1), the compass in her hands with her
  | { kind: "dial"; by: number }                         // disha: the compass box turned a quarter (±1) in her hands
  | { kind: "go"; to: number }                           // disha/loha: she walks to spot `to` (0 by the iron, 1 away)
  | { kind: "run" }                                      // lift the cover / push the train / check the labels / the map is set / read the compass
  | { kind: "undo" };
// Bhaap (round 7, processes of water and air, class 6-7 science): a tool used once (heat, cool, a wait, a sail, a rain; `at` the
// bench place it acts on), a thing put out (a glass from the fridge, a device high or low on the wall), or "ho gaya"; the law
// answers each at once, never on a clock
export type BhaapAct =
  | { kind: "use"; m: string; at?: number }      // tool m (heat, cool, lid, sugar, plate, wait, wipe, day, night, sail, sun, rise, rain, flow, pit, pump)
  | { kind: "put"; what: string; at: number }    // bhaapan: a thing from the fridge onto bench place `at`; kamra: a device high (0) or low (1)
  | { kind: "done" }
  | { kind: "undo" };
// Aakash (round 7, the Earth's motions, seasons and eclipses, class 7 science): the model moved a step (the Earth spun an eighth
// of a turn or moved a quarter of the way round, the Moon moved on, months passed, a day of sunshine, the Sun or the axis
// tried), or the card's moment claimed ("Now!", "Here!", "Eclipse!"); the law answers each at once, never on a clock
export type AakashAct =
  | { kind: "use"; m: string }                   // spin, round, sun, tilt, shine, moon, months
  | { kind: "done" }
  | { kind: "undo" };
// Rang (round 7, acids, bases, indicators and neutralisation, class 7 science): a drop from a cup onto an indicator, a cup
// sorted acidic / basic / neutral by its colours (pehchaan), or a dropper's drop into the glass, "Danger!" or "Done" (milao);
// the law answers each at once, never on a clock
export type RangAct =
  | { kind: "drop"; at: number; ind: string }    // pehchaan: a drop from cup `at` onto indicator `ind` (blue, red, haldi, gudhal)
  | { kind: "sort"; at: number; bin: string }    // pehchaan: cup `at` sorted (acid, base, neutral)
  | { kind: "use"; m: string }                   // milao: soda, antacid, lime, lemon, water, danger
  | { kind: "done" }
  | { kind: "undo" };
// Badlaav (round 7, physical and chemical changes, rusting and combustion, class 7 science): a change run, marked, undone and
// filed (palat); a solid put on the tawa or into the water; a side of a sigri's fire triangle taken away or given more; a fire
// let burn down a wait at a time and what it became placed; iron put somewhere damp or dry and another day (aag). The law answers
// each at once, never on a clock; no act lights a fire
export type BadlaavAct =
  | { kind: "run" }                              // palat: run the card's change
  | { kind: "mark"; s: string }                  // nishaan: a sign it showed (gas, colour, heat, smell, solid) or "same"
  | { kind: "file"; bin: string }                // ulta: back, same, new
  | { kind: "put"; at: number; to: string }      // ghol: the solid to tawa / water (at 0); jang: piece `at` to damp / dry
  | { kind: "place"; p: string; to: string }     // raakh: a product (co2, vapour, smoke, ash) to air / left
  | { kind: "use"; m: string; at?: number }      // cool, warm, wait, stir, gone, fuel, lid, unlid, fan, look, day, wipe (at)
  | { kind: "done" }
  | { kind: "undo" };
// Jaanch (round 7, testing food for starch and fat, class 6 science): a drop of dilute iodine from the lab bench's labelled
// bottle; a food rubbed on paper, the paper left to dry a Wait at a time and held to the light; a result said once seen; Next
// food (thali). The law answers each at once, never on a clock; no act eats, tastes or touches anything
export type JaanchAct =
  | { kind: "drop" }                             // one drop of dilute iodine on the food in front
  | { kind: "use"; m: string }                   // rub (a drop for a liquid), wait, light
  | { kind: "mark"; t: string; v: string }       // a result said: t starch | fat, v yes | no
  | { kind: "next" }                             // thali: Next food, once both are said
  | { kind: "done" }
  | { kind: "undo" };
// Chhaano (round 7, separating mixtures, class 6 science): a method applied to one pile (sukha) or one vessel (geela), a dry
// solid scooped into its jar, or "ho gaya"; the law answers at once, never on a clock (settling advances one wait at a time)
export type ChhaanoAct =
  | { kind: "use"; m: string; at: number; spot?: "near" | "far" }   // method m on pile / vessel `at` (winnow: the sack near or far)
  | { kind: "take"; at: number; jar: number }                       // geela: the dry solid at `at` scooped into jar `jar`
  | { kind: "done" }                                                // "ho gaya": every part is separated / recovered
  | { kind: "undo" };
// Paheli (round 7, number puzzles): load bags onto the boat, put number tiles on the grid, give letters digit tiles, set a
// start; the law (plain arithmetic: pairing, line sums, column addition with carries, reverse-and-add) answers on "run"
export type PaheliAct =
  | { kind: "load"; i: number }                           // pairs: dock item i onto the boat (again = off)
  | { kind: "put"; v: number; cell: number }              // magic: tile v on cell 0..8 (a filled cell swaps; −1 = back to the tray)
  | { kind: "digit"; l: string; d: number }               // cipher: letter l takes digit tile d (−1 = none)
  | { kind: "start"; n: number }                          // mirror: the 2-digit start
  | { kind: "run" }                                       // sail / add the lines / add it up / reverse and add: the law answers
  | { kind: "undo" };
// Galti Pakdo (round 7, checking a friend's working of an equation): the claim weighed in a line on the taraazu, the first
// line that breaks flagged, its fix taken from three offers, or "sab sahi"; the law answers at once, never on a clock
export type GaltiAct =
  | { kind: "check"; line: number }                       // the claim x = v weighed in line `line` (0 = the question)
  | { kind: "flag"; line: number }                        // line `line` is the first that breaks (the flagged line again: the offers reopen)
  | { kind: "fix"; i: number }                            // mend: offer i takes the flagged line's place; the law rewrites below it
  | { kind: "sab" }                                       // "sab sahi": every line follows
  | { kind: "undo" };
// Gati (round 7, motion): the clock steps only when the child taps it; watch from a reference (or ride along), put things
// on bins, tick types, flag the faster mover, set the speedometer; the law answers on "run"
export type GatiAct =
  | { kind: "tick" }                                      // the clock steps one interval (never on its own)
  | { kind: "view"; ref: number }                         // watch from reference `ref` (do-gati: 0 the ground, 1 riding along)
  | { kind: "put"; lane: number; at: number }             // lane `lane` onto bin `at` (at rest / moving; a type; uniform / not)
  | { kind: "tag"; lane: number; at: number }             // do-gati: type `at` ticked on (or off) for lane `lane`
  | { kind: "chalk"; lane: number }                       // raftaar/aage: a mark where lane `lane`'s mover is, at the clock's time
  | { kind: "pick"; lane: number }                        // raftaar/aage: the lane flagged faster (both marks for the same time first)
  | { kind: "mark"; at: number }                          // the speedometer / m/s counter set to `at`
  | { kind: "run" }                                       // the law answers the set-up
  | { kind: "undo" };
// Hissa (round 7, multiplying and dividing fractions and decimals): a sheet folded across and down (the overlap tagged by
// counting pieces); rope pieces laid on a metre track; a jug poured into full cups, the part-cup tagged as a fraction of a
// cup; a tenths grid shaded both ways and the label's point placed; digits slid on a place-value chart; a bar spent twice
// (the second fold laid on the piece left or the whole bar); a recipe's cup folded into shares and laid per person
export type HissaAct =
  | { kind: "fold"; side: number; n: number }            // fold side 0 (across / the whole bar / the cup's amount) or 1 (down / the second bar) into n parts
  | { kind: "shade"; side: number; k: number }           // shade / take k of that side's parts (grid: k tenths)
  | { kind: "base"; on: number }                         // story (rest): the second fold lies on the piece left (1) or the whole bar (2)
  | { kind: "lay"; n: number }                           // rope pieces laid / recipe shares laid
  | { kind: "count"; n: number }                        // pour: how many full cups the jug will fill, said before the first pour
  | { kind: "pour" }                                     // one full cup from the jug (a cup it cannot fill is refused)
  | { kind: "tag"; part: number; v: number }             // the tag's top (0) or bottom (1)
  | { kind: "slide"; by: number }                        // the chart's digits one place left (+1, × 10) or right (−1)
  | { kind: "zero" }                                     // a zero written at the end of the digits (again = rubbed out)
  | { kind: "point"; at: number }                        // the label's decimal point, `at` digits from the right
  | { kind: "run" }                                      // cut / pour / read the chart / run the story: the law answers
  | { kind: "undo" };
// Koshtak (round 7, expressions): tray walls snapped between the numbers of a row (the counter works each tray, then joins
// them); one lid laid over a run of numbers; an opened bracket's jumps turned forward / back; term cards put into bins
// (each bin closes into one term); the law answers on "run"
export type KoshtakAct =
  | { kind: "wall"; at: number }                         // terms: a tray wall in gap `at` (between number at and at + 1; again = lifted)
  | { kind: "lid"; from: number; to: number }            // lid: the lid over numbers from..to (the same lid again = lifted)
  | { kind: "flip"; at: number }                         // open: the jump after gap `at` turned forward / back
  | { kind: "bin"; card: number; to: number }            // like: card `card` into bin `to` (−1 = back on the belt)
  | { kind: "run" }                                      // run the counter / walk both / close the bins: the law answers
  | { kind: "undo" };

/** Field names that look like a verdict claim. Stripped from every act before replay (rj-ot-frame-claim-as-grade). */
export const CLAIM_KEYS = Object.freeze(["correct", "verdict", "right", "isCorrect", "score", "pass", "solved", "grade"]);
const MAX_ACTS = 400;
/** PURE. A device's act list → envelopes the server will replay: bounded, claim fields dropped, malformed dropped. */
export function sanitizeActs(raw: unknown): PlayActEnvelope[] {
  if (!Array.isArray(raw)) return [];
  const out: PlayActEnvelope[] = [];
  for (const e of raw.slice(0, MAX_ACTS)) {
    if (!e || typeof e !== "object") continue;
    const env = e as Record<string, unknown>;
    const a = env.act as Record<string, unknown> | undefined;
    if (!a || typeof a !== "object" || typeof a.kind !== "string" || a.kind.length > 16) continue;
    const act: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(a)) {
      if (CLAIM_KEYS.includes(k)) continue;
      if (typeof v === "number" ? Number.isFinite(v) : typeof v === "string" ? v.length <= 40 : typeof v === "boolean") act[k] = v;
    }
    const via = env.via === "voice" || env.via === "key" ? env.via : "touch";
    out.push({ seq: Number.isFinite(env.seq) ? Number(env.seq) : out.length, t: Number.isFinite(env.t) ? Number(env.t) : 0, via, act: act as unknown as PlayActBody });
  }
  return out.sort((x, y) => x.seq - y.seq);
}

// ───────────────────────────── moments (what the teacher and the juice react to) ─────────────────────────────

export const MOMENT_KINDS = [
  "first_act",                  // the child's first act on the level
  "progress",                   // a legal act that moved the world toward the goal (a split, a cut, a level set)
  "law_refused",                // the law refused an act (a prime will not split; pieces do not fit; bag will not open)
  "misconception_consequence",  // an act matched a mal-rule's signature and the world showed its consequence
  "near_miss",                  // close but not met (Nishana within 2× tolerance; Taraazu one cube off)
  "prediction_committed",
  "prediction_violated",        // the run contradicted the child's prediction
  "prediction_confirmed",
  "new_strategy",               // a different first move from the child's last level of this mode
  "impasse",                    // no productive act for the child's own hesitation p75 (client-detected; floor 8 s)
  "solved",
  "slip_found",                 // the child found the apprentice's mistake
] as const;
export type MomentKind = (typeof MOMENT_KINDS)[number];
/** On-screen facts only: what the child can see right now (values, never sentences). */
export type Facts = Record<string, string | number>;
export interface Moment { kind: MomentKind; seq: number; facts: Facts; misconceptionId?: string }

// ───────────────────────────── grading and evidence ─────────────────────────────

export type PlayVerdict = "solved" | "partial" | "not_yet" | "ungraded";
export interface PlayEvidence {
  skillId: string;
  outcome: "correct" | "incorrect" | "partial";
  /** a mal-rule signature matched (a misconception HIT at the game weight) */
  misconceptionId?: string;
  /** a correct act on a level built to discriminate this misconception */
  discriminates?: string;
  via: "game"; weight: GameWeight;
  levelId: string; actSeq: number;
}
export interface PlayGrade {
  levelId: string;
  verdict: PlayVerdict;
  /** acts replayed, how many the law refused, and whether the level was solved without a mal-rule signature */
  acts: number; refused: number; clean: boolean;
  evidence: PlayEvidence[];
  moments: Moment[];
  /** what is on screen at the end (for the Director's PLAY facts row) */
  facts: Facts;
}

// ───────────────────────────── the family contract ─────────────────────────────

/** What the server's picker hands a generator. Nothing here identifies the child to a model (no model is called). */
export interface GenRequest {
  family: FamilyId; mode: PlayMode; topicId: string; skillId: string; classLevel: number; fade: Fade; goal?: string;
  /** misconception id → P(holds), from the learner model (server/learner/kt/misconception.js) */
  mis: Record<string, number>;
  /** the family's mal-rule id → the kit misconception id for this topic (data/play/coverage.json) */
  misMap: Record<string, string>;
  /** the topic's grammar knobs from data/play/coverage.json (ranges, goals) */
  grammar: Record<string, unknown>;
  /** recent level signatures for this child and mode (novelty) */
  recent: string[];
  seed: number;
  harder?: boolean;
  /** P(the child does the target skill unaided now), from the learner model; absent = the class default */
  pL?: number;
  /** the kit misconception the lesson just saw (`misconception_seen`): the picker prefers a level that discriminates it */
  focus?: string;
}
/** A generated level before the picker scores it. `difficulty` 0..1 is the family's own estimate (size, steps, form). */
export interface Candidate<P = unknown> { level: PlayLevel<P>; signature: string; difficulty: number }

/**
 * A family's pure logic half (src/play/families/<f>/logic.ts). Both the client (instant consequences) and the server
 * (grading) import it. Everything is deterministic in (level, acts).
 */
export interface FamilyLogic<P = unknown, S = unknown, A extends PlayActBody = PlayActBody> {
  family: FamilyId;
  modes: readonly PlayMode[];
  /** never throws: a bad params object returns null (the server then serves another candidate) */
  validate(level: PlayLevel<unknown>): PlayLevel<P> | null;
  init(level: PlayLevel<P>): S;
  /** THE LAW. Returns the next state and the moments the act produced; a refused act returns the same state. */
  apply(level: PlayLevel<P>, state: S, act: A, seq: number): { state: S; moments: Moment[]; refused?: string };
  goalMet(level: PlayLevel<P>, state: S): boolean;
  /** candidate levels for a request (the server filters, scores and picks) */
  generate(req: GenRequest): Candidate<P>[];
  /** the shortest act sequence that solves the level, or null (solvability) */
  solve(level: PlayLevel<P>): A[] | null;
  /** an act sequence that reaches the goal WITHOUT the target concept, or null (must be null to serve: shortcut-free) */
  shortcut(level: PlayLevel<P>): A[] | null;
  /** the act sequence a child holding mal-rule `malId` would make on this level */
  malActs(level: PlayLevel<P>, malId: string): A[] | null;
  /** replay → verdict + evidence (the server's grade) */
  grade(level: PlayLevel<P>, acts: PlayActEnvelope<A>[]): PlayGrade;
  /** on-screen values for the teacher and the Director (never sentences) */
  facts(level: PlayLevel<P>, state: S): Facts;
  /** the board twin: the same values, drawn plainly (the last rung of the ladder) */
  board(level: PlayLevel<P>, state: S): { title: string; lines: string[] };
  /** the family's mal-rule ids (the coverage file maps them to kit misconception ids per topic) */
  malRules: readonly string[];
  /** goals decided by ONE pick a lucky first tap can land (games audit GAMES-03): their correct evidence enters at
   *  CHANCE_WEIGHT (gradeLevel reads this), never a second decision bolted on */
  oneDecision?: readonly string[];
}

// ───────────────────────────── art direction (DESIGN.md §4) ─────────────────────────────

export interface ArtTokens {
  id: ArtId;
  dark: boolean;
  ground: string; ground2: string;     // stage ground and its second tone
  panel: string; panelEdge: string;    // trays, pans, set-up cards
  ink: string; ink2: string; ink3: string;
  /** the relevant-object hues, in role order: primary quantity, secondary quantity, structure, highlight */
  q1: string; q2: string; q3: string; q4: string;
  good: string;                        // "goal met": always with a tick shape
  look: string;                        // "look again": always with a magnifier shape; never red, never a cross
  you: string;                         // the reserved "your move" hue (one element per state)
  shadow: string;
  /** stroke character: 0 = machine-clean, 1 = chalk / hand */
  jitter: number;
  font: { display: string; ui: string; mono: string; deva: string };
  sound: "paper" | "chalk" | "blip" | "glass";
}
/** Which art directions a family can wear (each family's view implements all of these). */
export const FAMILY_ARTS: Record<FamilyId, readonly ArtId[]> = {
  "todo-jodo": ["kagaz", "chalk", "blueprint", "raat"],
  taraazu: ["kagaz", "chalk", "blueprint", "raat"],
  nishana: ["blueprint", "kagaz", "chalk", "raat"],
  "kyun-lab": ["kagaz", "blueprint", "raat", "chalk"],
  kon: ["blueprint", "raat", "kagaz", "chalk"],
  nazariya: ["kagaz", "blueprint", "chalk", "raat"],
  arena: ["raat", "blueprint", "kagaz", "chalk"],
  stambh: ["kagaz", "chalk", "blueprint", "raat"],
  yantra: ["blueprint", "raat", "chalk", "kagaz"],
  kaal: ["kagaz", "chalk", "blueprint", "raat"],
  vakya: ["kagaz", "chalk", "blueprint", "raat"],
  kila: ["kagaz", "blueprint", "chalk", "raat"],
  naksha: ["kagaz", "blueprint", "chalk", "raat"],
  ghadi: ["kagaz", "chalk", "blueprint", "raat"],
  darpan: ["kagaz", "blueprint", "chalk", "raat"],
  feeta: ["kagaz", "chalk", "blueprint", "raat"],
  guna: ["kagaz", "chalk", "blueprint", "raat"],
  kram: ["kagaz", "chalk", "blueprint", "raat"],
  hissa: ["kagaz", "chalk", "blueprint", "raat"],
  koshtak: ["kagaz", "chalk", "blueprint", "raat"],
  parkar: ["kagaz", "blueprint", "chalk", "raat"],
  aankde: ["kagaz", "chalk", "blueprint", "raat"],
  paheli: ["kagaz", "chalk", "blueprint", "raat"],
  "galti-pakdo": ["kagaz", "chalk", "blueprint", "raat"],
  chhaano: ["kagaz", "chalk", "blueprint", "raat"],
  gati: ["kagaz", "chalk", "blueprint", "raat"],
  bhaap: ["kagaz", "chalk", "blueprint", "raat"],
  aakash: ["kagaz", "chalk", "blueprint", "raat"],
  rang: ["kagaz", "chalk", "blueprint", "raat"],
  badlaav: ["kagaz", "chalk", "blueprint", "raat"],
  jaanch: ["kagaz", "chalk", "blueprint", "raat"],
};
export interface ArtPickInput {
  family: FamilyId; subject: Subject; topicId: string; classLevel: number;
  /** the topic's preferred directions (data/play/coverage.json `arts`), best first */
  topicArts?: readonly ArtId[];
  /** the child's own choice (play settings), if any */
  childArt?: ArtId | null;
  /** the last art direction this child saw in this subject */
  lastArt?: ArtId | null;
}
export interface ArtPick { art: ArtId; reason: "child" | "topic" | "rotation" | "band" }
/**
 * PURE. The art direction for a level: the child's choice when the family can wear it (and it is not a repeat that the
 * child did not choose); else the topic's first preference that is not the last one shown in this subject; class 4-5
 * prefer light grounds. Never the same direction twice in a row for one child and subject unless the child chose it.
 */
export function pickArt(i: ArtPickInput): ArtPick {
  const can = FAMILY_ARTS[i.family];
  if (i.childArt && can.includes(i.childArt)) return { art: i.childArt, reason: "child" };
  const young = i.classLevel <= 5;
  const pref = (i.topicArts?.length ? i.topicArts : can).filter((a) => can.includes(a));
  const order = young ? [...pref.filter((a) => a !== "raat"), ...pref.filter((a) => a === "raat")] : pref;
  const fresh = order.filter((a) => a !== i.lastArt);
  if (fresh.length) return { art: fresh[0], reason: fresh[0] === order[0] ? (young && order[0] !== pref[0] ? "band" : "topic") : "rotation" };
  return { art: order[0] ?? can[0], reason: "topic" };
}

// ───────────────────────────── the teacher's lines (DESIGN.md §5) ─────────────────────────────

export interface Reaction {
  /** stable id: `<moment>.<lang>.<n>` from data/play/reactions.json; the TTS cache key with the filled text hash */
  id: string;
  moment: MomentKind;
  lang: Lang;
  text: string;
  channel: "micro";
}
/**
 * Words a micro-reaction may never contain: verdicts on the child (her face and her micro-lines are verdict-neutral; the
 * verdict lives on the work), praise of the person, and pressure. Matched on word boundaries, case-folded.
 */
export const REACTION_BANNED = Object.freeze([
  // verdicts
  "sahi", "galat", "right", "wrong", "correct", "incorrect", "galti", "glat", "शाबाश", "सही", "गलत",
  // person praise / babyish register (DESIGN-V3 §1.2)
  "shabash", "smart", "genius", "superstar", "awesome", "yay", "oops", "oopsie", "good job", "well done", "great job",
  // pressure and manipulation (NEVER MANIPULATE)
  "hurry", "jaldi karo", "quick", "streak", "points", "coins", "reward", "lose", "haar", "last chance", "don't stop", "mat ruko",
]);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BANNED_RE = new RegExp(`(^|[^\\p{L}\\p{N}])(${REACTION_BANNED.map(escapeRe).join("|")})(?=$|[^\\p{L}\\p{N}])`, "iu");
/** PURE. The play guard on one filled line (the server also runs the never-rules floor on it). */
export function reactionProblems(text: string, opts: { hidden?: (string | number)[] } = {}): string[] {
  const out: string[] = [];
  if (!text || text.length > 80) out.push("length");
  if (BANNED_RE.test(text)) out.push("banned_word");
  if (/[{}<>\\`]|\bundefined\b|\bNaN\b|\[object /.test(text)) out.push("template_bug");
  if (/!{2,}|\?{2,}/.test(text)) out.push("punctuation");
  for (const h of opts.hidden ?? []) {
    const s = String(h);
    if (s && new RegExp(`(^|[^0-9/.])${escapeRe(s)}(?=$|[^0-9/.])`).test(text)) out.push("reveals_hidden");
  }
  return out;
}

// ───────────────────────────── session wire (server/play/routes.js) ─────────────────────────────

/** POST /api/play/start */
export interface PlayStartRequest {
  childId: string;
  /** one of: a skill (the Director's admission), a topic (dev / Practice), or neither (next due play topic) */
  skillId?: string; topicId?: string;
  lessonId?: string;                 // inside a lesson: the session is tied to it (seam facts, evidence)
  lang?: Lang; art?: ArtId | null; fade?: Fade;
  /** round 8 follow-up C: the fade is the Director's deliberate choice (honoured inside a lesson only): it beats her history */
  fadeFrom?: "director";
  /** round 8 follow-up F: her previous play session token (the server verifies it): what she just played, for novelty */
  prev?: string;
}
/** Round 8 H: the child's "why this game" line (server/play/why.js; display only, never a grade). `speak`: the first time
 *  this reason is shown in the session (the client still does not speak it while the lesson's teacher is speaking). */
export interface PlayWhy { text: string; speak: boolean; reason: "mixup" | "up" | "down" | "switch" }
/** Round 8: why a game / level / fade was chosen (server/play/choose.js). */
export interface PlayBecause { choice: string; fact: string; source: string; kind?: string; when?: "earlier" | "now"; mis?: string }
export interface PlayStartResponse {
  sessionId: string;
  level: PlayLevel;
  art: ArtPick;
  /** the reaction lines pre-filled for this level's likely moments (ids + text; audio by /api/play/say) */
  bank: Reaction[];
  /** the family's world map for this child (DESIGN.md §6) */
  world: PlayWorldFamily | null;
  /** round 4: the base dress when a real-game engine renders this level (the model's delta comes from /api/play/dress) */
  dress?: import("../src/play/engines/core3d/api.ts").DressedSpec | null;
  because?: PlayBecause[];
  why?: PlayWhy;
}
/** Round 8 P3: a level's trail (server/play/trail.js buildTrail). Child-free, fixed shape, bounded. */
export interface PlayTrail {
  v: 1; levelId: string | null; skillId: string | null; game: string | null; fade: Fade;
  solved: boolean; firstTry: boolean;
  /** mal-rule signatures + near misses before the win */
  misses: number; refused: number;
  /** ≤ 4: the family mal-rule id and the kit misconception id it maps to */
  mal: { rule: string | null; mis: string | null }[];
  undos: number; hints: number;
  /** acts to the win, the solver's minimum, and the difference (null when unsolved or unknown) */
  acts: number; minActs: number | null; extra: number | null;
}
/** POST /api/play/act: the acts since the last post (the server replays ALL acts of the level each time). */
export interface PlayActRequest { sessionId: string; levelId: string; acts: PlayActEnvelope[]; final?: boolean; impasse?: boolean;
  /** round 4: the real-game engine on the child's screen, if any (chooses which authored words describe it; never graded) */
  engine?: string | null }
export interface PlayActResponse {
  levelId: string;
  moments: Moment[];
  /** at most one micro-reaction for this post (floor rules are the client's: it may drop it) */
  reaction: Reaction | null;
  /** present when the level ended (goal met or final post) */
  grade?: PlayGrade;
  /** present with a grade: the two doors for the next level */
  doors?: { door: Door; level: PlayLevel; hint: string }[];
  /** the seam the lesson should take now, if any (the client forwards it as a module event) */
  seam?: PlaySeam | null;
  /** present with a grade: the lesson evidence rows the server derived from its own replay (source "game", weight 0.5) */
  evidence?: { skillId: string; outcome: "correct" | "incorrect" | "partial"; misconceptionId?: string; discriminates?: string; source: "game"; itemId: string; probe: `P${number}`; hintsUsed: 0; weight: number }[];
  /** inside a lesson, with a grade: the server's evidence rows signed for this child and lesson (server/play/evidence.js).
   *  The lesson turn folds ONLY a verified token, once per level; the plain `evidence` rows above are for display. */
  evidenceToken?: string;
  /** round 8 P3, with a grade: how the level went, from the server's own replay (server/play/trail.js); a report only */
  trail?: PlayTrail;
  /** round 8 P3, home play (no lesson), with a grade: the same rows as source "home" plus the trail, signed for the child
   *  (server/play/evidence.js signHomeEvidence). Nothing folds it yet (server/play/home.js, TAXILA_HOME_PLAY_FOLD off). */
  homeToken?: string;
  /** inside a lesson, with a seam: the seam's telegraphic facts row signed for this child and lesson (the Director's PLAY row
   *  is read only from a verified token, never from words or values the device sends) */
  seamToken?: string;
  /** the refreshed session token (her reaction history rides in it); send it on the next post */
  sessionId: string;
}
/** POST /api/play/next */
export interface PlayNextRequest { sessionId: string; door: Door }
export interface PlayNextResponse { sessionId: string; level: PlayLevel; art: ArtPick; bank: Reaction[]; dress?: import("../src/play/engines/core3d/api.ts").DressedSpec | null;
  because?: PlayBecause[]; why?: PlayWhy;
  /** round 8 follow-up B: the session switched family (once at most): the new family's world, to remount */
  switched?: { from: string; to: string }; world?: PlayWorldFamily | null }
/** POST /api/play/dress { sessionId } → the validated dress for the current level (base when late / invalid / off) */
export interface PlayDressResponse { dress: import("../src/play/engines/core3d/api.ts").DressedSpec; source: "model" | "base"; ms: number }
/** GET /api/play/world?childId= */
export interface PlayWorldResponse { classLevel: number; families: PlayWorldFamily[] }

/** When the lesson's Director should take a full turn (DESIGN.md §5 seam turn). */
export interface PlaySeam {
  kind: "level_end" | "impasse" | "prediction" | "misconception" | "segment_end";
  /** telegraphic values for her line (the PLAY facts row) */
  facts: Facts;
  /** the bare kit item the Director should pose after the segment (fade 4), if the segment is over */
  bareItem?: { skillId: string } | null;
}

// ───────────────────────────── the world (DESIGN.md §6) ─────────────────────────────

/** Drawn states: ahead (not started) · hatched (practising) · pencil (got it today) · ink (secure). */
export type InkState = "ahead" | "hatched" | "pencil" | "ink";
export interface PlayStation {
  topicId: string; title: string; skillIds: string[];
  state: InkState;
  /** the server scheduled a re-check (never from time alone) */
  recheck: boolean;
  /** this is the topic the child's class is on now */
  here: boolean;
  mode: PlayMode;
}
export interface PlayRoute { from: string; to: string; cite: "curriculum" | "kit"; edge: string }
export interface PlayWorldFamily { family: FamilyId; stations: PlayStation[]; routes: PlayRoute[] }
/** PURE. The drawn state of a station from its skills' map states (the Garden/Sky map's own states). */
export function inkOf(states: ("not_started" | "practising" | "got_it" | "secure")[]): InkState {
  if (!states.length || states.every((s) => s === "not_started")) return "ahead";
  if (states.every((s) => s === "secure")) return "ink";
  if (states.every((s) => s === "secure" || s === "got_it")) return "pencil";
  return "hatched";
}

// ───────────────────────────── the lesson seam (patches; GRAMMAR.md §6) ─────────────────────────────

/** The Studio artifact a play segment rides in the lesson (shared/studio.ts gains `| PlayArtifact` by patch). */
export interface PlayArtifact {
  kind: "play";
  play: { sessionId: string; family: FamilyId; mode: PlayMode; skillId: string; topicId: string; art: ArtId; levelId: string };
}
/** PURE. The Director's PLAY facts row: telegraphic key=value pairs, never a sentence (the recitation law). */
export function playFactsRow(f: Facts, max = 12): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(f)) {
    if (parts.length >= max) break;
    const val = String(v).replace(/[\n\r|]/g, " ").slice(0, 32);
    if (/^[a-z][a-z0-9_]{0,23}$/i.test(k) && val) parts.push(`${k}=${val}`);
  }
  return parts.join(" ");
}
