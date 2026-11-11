// Bhaap (भाप, "vapour") · round 7, the processes of water and air (class 6 and 7 science). Nothing here runs on a clock: every
// change waits for the child's tap (a heat, a cool, a wait, a sail, a rain); the law answers each one at once.
//
// avastha (states of water, c6-science-ch08-t01). A pot on the stove with a thermometer marked only at 0 °C and 100 °C (the
// kit's two numbers; the notches between and the freezer below are drawn with no number). Heat and Cool move the thermometer a
// notch; at the 0 °C mark heat melts the ice and cooling freezes the water; at the 100 °C mark heat boils the water into
// vapour (big bubbles; the vapour itself is invisible; the white cloud a little above the pot is tiny droplets). A cold lid on
// the pot turns the vapour back into water (drops on the lid that drip back). Sugar dissolves in the glass beside the stove.
//   badlo  (s2, s3) a card names changes (melting, freezing, boiling, condensation, dissolving) to make happen in turn
//   bachao (s3, s1) boil the water and keep every drop of it in the pot
// bhaapan (evaporation and condensation, c6-science-ch08-t02). One wait at a time: water evaporates from an open surface into
// the air with no heat (one unit a wait, a scene value); vapour in the air condenses into drops on a COLD thing put out from
// the fridge; the tissue wipes the drops into the cup (they are clear even beside a coloured drink).
//   os    (s2)     the air is full of vapour (a bath, the monsoon): get drops into the cup
//   wapas (s3, s1) the water of a wet plate, shirt or floor goes into the air: get all of it back into the cup
// hawa (convection, c7-science-ch07-t02).
//   naav  (s3)     a beach: by day the land warms faster than the sea, at night it cools faster (scene steps 2 : 1, never a
//                  temperature); the breeze near the ground blows from the cooler side to the warmer. The child sets day or
//                  night, waits, and raises the sail: the boat goes with the breeze, out to the fishing place and back.
//   kamra  (s4, s1) a room drawn as three layers of air (ceiling, middle, floor): an AC, a heater or a kitchen exhaust placed
//                  high or low; each wait the warmer layer below rises past the cooler one above (convection)
// chakra (the water cycle and groundwater, c7-science-ch07-t04).
//   baadal (s1)     the sun evaporates sea water into invisible vapour; it rises and cools into a cloud of droplets; the
//                  cloud rains on the field; (looks 2, 3) the field's water flows back to the sea
//   kuan  (s2, s3)  rain seeps into the gaps of soil, sand, gravel and cracked rock and fills them from the bottom (the water
//                  table rises); on concrete it runs off unless a recharge pit takes it in; the well gives water only while
//                  the water table is above its bottom; each pump takes one gap's water out
//
// The CHILD's beliefs (mal-rules; each mapped to the topic's own kit misconception, a deterministic act list with its own
// consequence):
//   air-bubbles  (ch08-t01 m1) "ho gaya" after boiling with the pot open (the bubbles "only air"): the pot has less water
//   cloud-gas    (ch08-t01 m2) the cold plate held up in the white cloud to catch "the vapour": the invisible vapour leaves
//                             through the clear gap below it; the pot loses water
//   sugar-melts  (ch08-t01 m3) sugar dissolved when the card says melting (or the ice melted when it says dissolving)
//   glass-leak   (ch08-t02 m1) a full glass of WARM coloured drink put out for the drops: no drop forms; nothing comes through
//   water-gone   (ch08-t02 m3) "ho gaya" with the plate dry and the water still in the air (the lens shows it there)
//   day-landward (c7 ch07-t02 m2) the sail raised in the day to go out to sea (or at night to come in): the breeze blows the
//                             other way
//   cold-rises   (c7 ch07-t02 m3) the AC fitted near the floor: the cool air stays at the floor; the room above stays warm
//   vapour-rains (c7 ch07-t04 m3) rain asked of vapour that has not risen and cooled: no cloud, no rain
//   never-dry    (c7 ch07-t04 m2) pumping on when the water table is below the well's bottom: the well is dry
// Every number on screen is the kit's (0 °C, 100 °C); every other number here is a scene value with no fact claimed (units of
// water, notches, waits, steps); tests/r7-games-bhaap.test.mjs checks both against the kits.
import type { BhaapAct, Candidate, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export const BHAAP_MODES = ["avastha", "bhaapan", "hawa", "chakra"] as const;
export type BhaapMode = (typeof BHAAP_MODES)[number];
export const GOALS_OF = { avastha: ["badlo", "bachao"], bhaapan: ["os", "wapas"], hawa: ["naav", "kamra"], chakra: ["baadal", "kuan"] } as const;
export type BhaapGoal = (typeof GOALS_OF)[BhaapMode][number];
export const BHAAP_MAL = ["air-bubbles", "cloud-gas", "sugar-melts", "glass-leak", "water-gone", "day-landward", "cold-rises", "vapour-rains", "never-dry"] as const;

/** the kit's own sentences each law rests on (tests read them out of data/kits/c6-science.json and c7-science.json) */
export const KIT_OF: Record<string, Record<string, string>> = {
  "c6-science-ch08-t01": {
    "melt and freeze at the 0 °C mark": "Ice melts into water at 0 °C, and water freezes into ice at 0 °C",
    "boil at the 100 °C mark": "water boils at about 100 °C and turns into vapour",
    "the cold lid": "vapour condenses back into water when it cools",
    "vapour invisible, the cloud droplets": "the white 'steam' cloud above boiling water or a pressure cooker is made of tiny droplets of condensed water",
    "the big bubbles": "The big bubbles that rise in boiling water are water vapour, not air",
    "vapour spreads": "a gas (water vapour, which is invisible and spreads to fill any space)",
    "the clear gap": "clear gap = vapour (invisible), cloud = droplets",
    "melting is not dissolving": "Melting (ice turning into water when warmed) is different from dissolving (sugar spreading into water to make a solution)",
    "a liquid keeps its amount": "takes the shape of its container but keeps its amount",
  },
  "c6-science-ch08-t02": {
    "evaporation with no heat": "it happens slowly at all temperatures from the water's surface, not only when water boils",
    "not destroyed": "the water evaporates into the air; the water is not destroyed",
    "condensation on a cool surface": "water vapour in the air cooling and turning into tiny water droplets on a cool surface",
    "the drops come from the air": "The drops on the outside of a cold glass come from the air around it, not through the glass",
    "the coloured drink": "Expects drops outside to be coloured if the drink is coloured",
    "a warm surface gets fewer drops": "On the chilled lid, because water vapour cools and condenses there",
  },
  "c7-science-ch07-t02": {
    "day": "During the day, land heats up faster than the sea; air over the land warms and rises, and cooler air from the sea moves in to take its place",
    "night": "At night, land cools faster than the sea; air over the warmer sea rises, and cooler air from the land moves out towards the sea",
    "convection": "the heated part expands, becomes lighter and rises, while cooler, heavier liquid or air sinks to take its place",
    "AC high, heater low": "ACs are fitted high and heaters work best low down because cool air sinks and warm air rises",
    "exhaust high": "Ventilators and kitchen exhausts are placed high to let hot air out",
    "boats": "The land breeze that blows from land to sea through the night and early morning helps push boats out",
  },
  "c7-science-ch07-t04": {
    "the cycle": "the vapour rises, cools and condenses into tiny droplets that form clouds; and it falls as rain",
    "collection": "Some rainwater flows over the ground into streams, rivers and the sea",
    "infiltration": "some seeps down through the soil (infiltration)",
    "the gaps": "Infiltrated water fills tiny gaps between grains of sand and gravel and cracks in rocks",
    "the water table": "The top of the water-filled layer is the water table",
    "wells dry": "when more is pumped out than rain puts back, the water table falls and wells dry up",
    "recharge": "Rainwater harvesting, recharge pits, ponds, open soil and trees help recharge groundwater; concrete and tarred surfaces stop rain from soaking in",
    "the well below the table": "The well is dug below the water table, so groundwater seeps into it",
  },
};

// ───────────────────────────── avastha: the pot ─────────────────────────────
/** scene value, no fact claimed: the units of water in the pot (the view draws them as a level) */
export const UNITS = 3;
/** the thermometer's notches: 0 the freezer (below 0 °C, no number), 1 the 0 °C mark, 2 and 3 unmarked, 4 the 100 °C mark */
export const MELT_AT = 1;
export const BOIL_AT = 4;
export type Change = "melt" | "freeze" | "boil" | "condense" | "dissolve";
interface AvRow { card: readonly Change[]; boils: number; pos: number; phase: "ice" | "water"; ctx: readonly string[]; look: 1 | 2 | 3 }
const AV_ROWS: Record<"badlo" | "bachao", readonly AvRow[]> = {
  badlo: [
    { card: ["melt", "freeze"], boils: 0, pos: 0, phase: "ice", ctx: ["kulfi", "fridge"], look: 1 },
    { card: ["freeze", "melt"], boils: 0, pos: 2, phase: "water", ctx: ["fridge", "ladakh"], look: 1 },
    { card: ["melt", "dissolve"], boils: 0, pos: 0, phase: "ice", ctx: ["kitchen"], look: 1 },
    { card: ["boil", "condense"], boils: 0, pos: 2, phase: "water", ctx: ["kitchen", "cooker"], look: 1 },
    { card: ["melt", "boil", "condense"], boils: 0, pos: 0, phase: "ice", ctx: ["ladakh", "kitchen"], look: 2 },
    { card: ["freeze", "melt", "dissolve"], boils: 0, pos: 2, phase: "water", ctx: ["fridge", "kitchen"], look: 2 },
    { card: ["melt", "freeze", "melt"], boils: 0, pos: 0, phase: "ice", ctx: ["kulfi"], look: 2 },
    { card: ["freeze", "melt", "boil", "condense"], boils: 0, pos: 3, phase: "water", ctx: ["fridge", "kitchen"], look: 3 },
    { card: ["melt", "boil", "condense", "dissolve"], boils: 0, pos: 0, phase: "ice", ctx: ["kitchen", "ladakh"], look: 3 },
    { card: ["melt", "freeze", "melt", "dissolve"], boils: 0, pos: 0, phase: "ice", ctx: ["kulfi"], look: 3 },
  ],
  bachao: [
    { card: [], boils: 1, pos: 2, phase: "water", ctx: ["kitchen", "cooker", "monsoon"], look: 1 },
    { card: [], boils: 1, pos: 3, phase: "water", ctx: ["kitchen", "monsoon"], look: 1 },
    { card: [], boils: 2, pos: 2, phase: "water", ctx: ["kitchen", "cooker", "monsoon"], look: 2 },
    { card: [], boils: 2, pos: 0, phase: "ice", ctx: ["ladakh", "kulfi", "fridge"], look: 3 },
  ],
};
interface AvW {
  pos: number; phase: "ice" | "water" | "none"; units: number; cover: "none" | "lid" | "plate";
  boils: number; lost: number; lostHow: "" | "open" | "plate"; drops: number; sugar: boolean; next: number; broke: string;
}

// ───────────────────────────── bhaapan: the kitchen air ─────────────────────────────
export type Item = "cold" | "coldDrink" | "warmDrink";
export const ITEMS: readonly Item[] = ["cold", "coldDrink", "warmDrink"];
/** cold: from the fridge (a cool surface); drink: full of coloured nimbu-paani */
export const ITEM: Record<Item, { cold: boolean; drink: boolean }> = { cold: { cold: true, drink: false }, coldDrink: { cold: true, drink: true }, warmDrink: { cold: false, drink: true } };
/** scene value, no fact claimed: the places on the bench */
export const SLOTS = 2;
interface BhRow { src: number; srcKind: "plate" | "clothes" | "floor" | ""; air: number; need: number; ctx: readonly string[]; look: 1 | 2 | 3 }
const BH_ROWS: Record<"os" | "wapas", readonly BhRow[]> = {
  os: [
    { src: 0, srcKind: "", air: 2, need: 2, ctx: ["nimbu", "monsoon", "bathroom"], look: 1 },
    { src: 0, srcKind: "", air: 3, need: 3, ctx: ["nimbu", "monsoon", "bathroom"], look: 2 },
    { src: 0, srcKind: "", air: 4, need: 4, ctx: ["nimbu", "monsoon", "bathroom", "dew"], look: 3 },
  ],
  wapas: [
    { src: 2, srcKind: "plate", air: 0, need: 2, ctx: ["kitchen"], look: 1 },
    { src: 2, srcKind: "clothes", air: 0, need: 2, ctx: ["clothesline", "monsoon"], look: 1 },
    { src: 3, srcKind: "plate", air: 0, need: 3, ctx: ["kitchen"], look: 2 },
    { src: 3, srcKind: "floor", air: 0, need: 3, ctx: ["kitchen", "monsoon"], look: 2 },
    { src: 3, srcKind: "clothes", air: 0, need: 3, ctx: ["clothesline"], look: 2 },
    { src: 4, srcKind: "plate", air: 0, need: 4, ctx: ["kitchen"], look: 3 },
    { src: 4, srcKind: "clothes", air: 0, need: 4, ctx: ["clothesline", "monsoon"], look: 3 },
    { src: 4, srcKind: "floor", air: 0, need: 4, ctx: ["kitchen"], look: 3 },
  ],
};
interface BhW { src: number; air: number; bench: { what: Item; drops: number }[]; cup: number; tissue: number }

// ───────────────────────────── hawa: the beach and the room ─────────────────────────────
/** scene values, no fact claimed: how much warmer or cooler a wait makes the land and the sea (the land "faster": 2 to the
 *  sea's 1), and the farthest they go; never shown as a number (the view draws warmer / cooler) */
export const LAND_STEP = 2;
export const SEA_STEP = 1;
export const LAND_MAX = 4;
export const SEA_MAX = 2;
/** the boat's places: 0 the shore, 2 the fishing place */
export const FAR = 2;
export type Trip = "out" | "back";
interface NaRow { trips: readonly Trip[]; day: boolean; land: number; sea: number; boat: number; ctx: readonly string[]; look: 1 | 2 | 3 }
const NA_ROWS: readonly NaRow[] = [
  { trips: ["out"], day: true, land: 0, sea: 0, boat: 0, ctx: ["kerala", "marina", "goa"], look: 1 },
  { trips: ["back"], day: false, land: 0, sea: 0, boat: 2, ctx: ["kerala", "marina", "goa"], look: 1 },
  { trips: ["out", "back"], day: true, land: 0, sea: 0, boat: 0, ctx: ["kerala", "marina", "goa"], look: 2 },
  { trips: ["back", "out"], day: false, land: 0, sea: 0, boat: 2, ctx: ["kerala", "marina"], look: 2 },
  { trips: ["out", "back"], day: true, land: 4, sea: 2, boat: 0, ctx: ["kerala", "marina", "goa"], look: 3 },
  { trips: ["back", "out"], day: false, land: -4, sea: -2, boat: 2, ctx: ["kerala", "goa"], look: 3 },
];
interface NaW { day: boolean; land: number; sea: number; boat: number; trip: number }
export type Task = "cool" | "warm" | "clear";
export type Device = "ac" | "heater" | "exhaust";
export const DEVICE_OF: Record<Task, Device> = { cool: "ac", warm: "heater", clear: "exhaust" };
/** scene value, no fact claimed: the kitchen's cooking waits */
export const COOK = 3;
interface KaRow { tasks: readonly Task[]; cells: readonly number[]; ctx: readonly string[]; look: 1 | 2 | 3 }
const KA_ROWS: readonly KaRow[] = [
  { tasks: ["cool"], cells: [1, 1, 1], ctx: ["bedroom", "classroom", "shop"], look: 1 },
  { tasks: ["warm"], cells: [-1, -1, -1], ctx: ["bedroom", "classroom"], look: 1 },
  { tasks: ["clear"], cells: [0, 0, 0], ctx: ["kitchen", "dhaba"], look: 2 },
  { tasks: ["cool"], cells: [1, 1, 1], ctx: ["hall"], look: 2 },
  { tasks: ["cool", "warm"], cells: [1, 1, 1], ctx: ["bedroom", "classroom", "shop"], look: 3 },
  { tasks: ["warm", "cool"], cells: [-1, -1, -1], ctx: ["bedroom", "classroom"], look: 3 },
];
/** cells: the air's warmth at the ceiling, the middle and the floor (−1 cool, 0 fresh, +1 warm: never a temperature) */
interface KaW { cells: number[]; smoke: boolean[]; dev: { what: Device; at: 0 | 1 } | null; task: number; cooked: number }

// ───────────────────────────── chakra: the cycle and the ground ─────────────────────────────
interface BaRow { need: number; flow: boolean; vap: number; ctx: readonly string[]; look: 1 | 2 | 3 }
const BA_ROWS: readonly BaRow[] = [
  { need: 1, flow: false, vap: 0, ctx: ["punjab", "monsoon", "bay"], look: 1 },
  { need: 2, flow: false, vap: 0, ctx: ["punjab", "monsoon", "bay"], look: 1 },
  { need: 2, flow: true, vap: 0, ctx: ["punjab", "monsoon", "bay"], look: 2 },
  { need: 2, flow: true, vap: 1, ctx: ["monsoon", "bay"], look: 2 },
  { need: 3, flow: true, vap: 1, ctx: ["punjab", "monsoon", "bay"], look: 3 },
  { need: 3, flow: true, vap: 2, ctx: ["punjab", "bay"], look: 3 },
];
/** scene value, no fact claimed: the most vapour the sky over the sea holds in one go */
export const VAP_MAX = 4;
interface BaW { vap: number; cloud: number; field: number; flowed: number }
/** the ground: `cap` gaps from the bottom (cracked rock, gravel, sand, soil), the well's bottom at gap `well` (it gives water
 *  while more than `well` gaps are full); rains: the monsoon's rains left; pumps: the summer's draws the village needs. All
 *  scene values, no fact claimed */
interface KuRow { cap: number; well: number; f0: number; rains: number; pumps: number; ctx: readonly string[]; look: 1 | 2 | 3 }
const KU_ROWS: readonly KuRow[] = [
  { cap: 6, well: 2, f0: 1, rains: 1, pumps: 1, ctx: ["village", "school", "borewell"], look: 1 },
  { cap: 6, well: 3, f0: 2, rains: 1, pumps: 1, ctx: ["village", "school"], look: 1 },
  { cap: 6, well: 2, f0: 3, rains: 2, pumps: 4, ctx: ["village", "school", "punjab"], look: 2 },
  { cap: 6, well: 2, f0: 3, rains: 2, pumps: 5, ctx: ["village", "school", "punjab"], look: 3 },
  { cap: 6, well: 3, f0: 4, rains: 2, pumps: 4, ctx: ["borewell", "punjab"], look: 3 },
];
interface KuW { filled: number; rains: number; pit: boolean; pumped: number }

// ───────────────────────────── params, state ─────────────────────────────
export interface BhaapParams {
  goal: BhaapGoal;
  /** the scaffold (fade): 1 the simplest rows; 3 the longest */
  look: 1 | 2 | 3;
  /** the row of the goal's table (everything the level starts with is that row's own) */
  row: number;
  /** the context drawn (one the row allows) */
  scene: string;
  /** bhaapan: the order of the fridge's things on screen (a seeded permutation, so place never hints) */
  order: string[];
  /** scene value: the seed of the particle layout the view draws (no fact claimed) */
  lay: number;
}
export type World = AvW | BhW | NaW | KaW | BaW | KuW;
export interface BhaapState extends Undoable<BhaapState> {
  w: World;
  /** the law's last answer for the view ("" when the last act just happened) */
  why: string;
  /** the changes / events the last act made (for the card and the view) */
  ev: string[];
  /** the tool or thing of the last act */
  m: string;
  /** a mal-rule consequence already shown on this level (each fires once) */
  seen: string[];
  done: boolean; acts: number;
}

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const uniq = <T>(xs: readonly T[]): T[] => [...new Set(xs)];
export const modeOfGoal = (g: string): BhaapMode | null => (BHAAP_MODES.find((m) => (GOALS_OF[m] as readonly string[]).includes(g)) ?? null);
export const avRow = (p: BhaapParams) => AV_ROWS[p.goal as "badlo" | "bachao"][p.row];
export const bhRow = (p: BhaapParams) => BH_ROWS[p.goal as "os" | "wapas"][p.row];
export const naRow = (p: BhaapParams) => NA_ROWS[p.row];
export const kaRow = (p: BhaapParams) => KA_ROWS[p.row];
export const baRow = (p: BhaapParams) => BA_ROWS[p.row];
export const kuRow = (p: BhaapParams) => KU_ROWS[p.row];
const rowsOf = (goal: BhaapGoal): readonly { ctx: readonly string[]; look: 1 | 2 | 3 }[] =>
  goal === "badlo" || goal === "bachao" ? AV_ROWS[goal] : goal === "os" || goal === "wapas" ? BH_ROWS[goal] : goal === "naav" ? NA_ROWS : goal === "kamra" ? KA_ROWS : goal === "baadal" ? BA_ROWS : KU_ROWS;
/** the near-ground breeze: "in" from the sea to the land (land warmer), "out" from the land to the sea, "" calm */
export const breeze = (land: number, sea: number): "in" | "out" | "" => (land > sea ? "in" : land < sea ? "out" : "");
/** the layer a device at `at` sits in: high → the ceiling layer (0), low → the floor layer (2) */
export const cellOf = (at: 0 | 1) => (at === 0 ? 0 : 2);

/** the tools on the strip (each mode's own; a device is placed with "put") */
export function toolsOf(p: BhaapParams): string[] {
  switch (p.goal) {
    case "badlo": return ["heat", "cool", "lid", "sugar"];
    case "bachao": return ["heat", "cool", "lid", "plate"];
    case "os": case "wapas": return ["wait", "wipe"];
    case "naav": return ["day", "night", "wait", "sail"];
    case "kamra": return ["wait"];
    case "baadal": return baRow(p).flow ? ["sun", "rise", "rain", "flow"] : ["sun", "rise", "rain"];
    case "kuan": return ["rain", "pit", "pump"];
  }
}

// ───────────────────────────── validate, init ─────────────────────────────
function validate(level: PlayLevel<unknown>): PlayLevel<BhaapParams> | null {
  const p = level.params as Partial<BhaapParams> | null;
  if (!p || !BHAAP_MODES.includes(level.mode as BhaapMode)) return null;
  const mode = level.mode as BhaapMode;
  if (!(GOALS_OF[mode] as readonly string[]).includes(p.goal as string)) return null;
  const goal = p.goal as BhaapGoal, look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || !isInt(p.row) || !isInt(p.lay) || p.lay < 0 || p.lay > 9999 || typeof p.scene !== "string" || !Array.isArray(p.order)) return null;
  const rows = rowsOf(goal), r = rows[p.row];
  if (!r || r.look !== look || !r.ctx.includes(p.scene)) return null;
  const order = [...p.order];
  if (goal === "os" || goal === "wapas") {
    if (order.length !== ITEMS.length || !ITEMS.every((x) => order.includes(x))) return null;
  } else if (order.length) return null;
  return { ...level, params: { goal, look, row: p.row, scene: p.scene, order, lay: p.lay } } as PlayLevel<BhaapParams>;
}

function initW(p: BhaapParams): World {
  switch (p.goal) {
    case "badlo": case "bachao": {
      const r = avRow(p);
      return { pos: r.pos, phase: r.phase, units: UNITS, cover: "none", boils: 0, lost: 0, lostHow: "", drops: 0, sugar: false, next: 0, broke: "" } satisfies AvW;
    }
    case "os": case "wapas": { const r = bhRow(p); return { src: r.src, air: r.air, bench: [], cup: 0, tissue: 0 } satisfies BhW; }
    case "naav": { const r = naRow(p); return { day: r.day, land: r.land, sea: r.sea, boat: r.boat, trip: 0 } satisfies NaW; }
    case "kamra": { const r = kaRow(p); return { cells: [...r.cells], smoke: [false, false, false], dev: null, task: 0, cooked: 0 } satisfies KaW; }
    case "baadal": return { vap: baRow(p).vap, cloud: 0, field: 0, flowed: 0 } satisfies BaW;
    case "kuan": { const r = kuRow(p); return { filled: r.f0, rains: r.rains, pit: false, pumped: 0 } satisfies KuW; }
  }
}
function init(level: PlayLevel<BhaapParams>): BhaapState {
  return { w: initW(level.params), why: "", ev: [], m: "", seen: [], done: false, acts: 0, prev: null, depth: 0 };
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── apply (THE LAW) ─────────────────────────────
type Out = { state: BhaapState; moments: Moment[]; refused?: string };
function apply(level: PlayLevel<BhaapParams>, s: BhaapState, act: BhaapAct, seq: number): Out {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const bump = (st: BhaapState): BhaapState => ({ ...st, acts: s.acts + 1 });
  /** refused: the state stays (only the law's answer for the view changes) */
  const no = (code: string, moment?: Moment, m = act.kind === "use" ? act.m : act.kind): Out => {
    if (moment) out.push(moment);
    const seen = moment?.kind === "misconception_consequence" && moment.misconceptionId ? [...s.seen, moment.misconceptionId] : s.seen;
    return { state: bump({ ...s, why: code, ev: [], m, seen }), moments: out, refused: code };
  };
  /** accepted: a new world (undoable) */
  const ok = (w: World, ev: string[] = [], o: Partial<BhaapState> = {}): Out => ({ state: bump(pushUndo(s, { ...s, w, why: "", ev, m: act.kind === "use" ? act.m : act.kind === "put" ? act.what : act.kind, ...o })), moments: out });
  /** a mal-rule's consequence (only when this level maps it; once per level), else the law's plain answer */
  const mal = (id: string, f: Facts, why: string): Moment | undefined => {
    if (!(id in level.mal) || s.seen.includes(id)) return why ? mom("law_refused", seq, { ...f, why }) : undefined;
    return mom("misconception_consequence", seq, f, id);
  };
  const seenWith = (m: Moment | undefined) => (m?.kind === "misconception_consequence" && m.misconceptionId ? { seen: [...s.seen, m.misconceptionId] } : {});
  const solved = (f: Facts): Out => { out.push(mom("solved", seq, f)); return ok(s.w, [], { done: true }); };

  switch (p.goal) {
    case "badlo": case "bachao": return applyAv();
    case "os": case "wapas": return applyBh();
    case "naav": return applyNa();
    case "kamra": return applyKa();
    case "baadal": return applyBa();
    case "kuan": return applyKu();
  }

  function applyAv(): Out {
    const w = s.w as AvW, r = avRow(p), badlo = p.goal === "badlo";
    if (act.kind === "done") {
      if (badlo) {
        if (!w.broke && w.next >= r.card.length) return solved({ changes: r.card.join("+") });
        return no(w.broke ? "off_card" : "not_yet", mom("law_refused", seq, { why: w.broke ? "off_card" : "not_yet", next: r.card[w.next] ?? "", broke: w.broke }));
      }
      if (w.lost === 0 && w.boils >= r.boils && w.phase === "water") return solved({ boils: w.boils, kept: w.units });
      if (w.lost > 0) {
        // the pot was boiled open: the bubbles carried the water away as vapour (the belief: they were only air)
        const m = w.lostHow === "open" ? mal("air-bubbles", { lost: w.lost, boils: w.boils }, "lost") : mom("law_refused", seq, { why: "lost", lost: w.lost });
        return no("lost", m);
      }
      return no("not_yet", mom("law_refused", seq, { why: "not_yet", boils: w.boils, of: r.boils }));
    }
    if (act.kind !== "use") return no("unknown_act");
    const tools = toolsOf(p);
    if (!tools.includes(act.m)) return no("no_tool");
    let nw: AvW = { ...w };
    const ev: Change[] = [];
    switch (act.m) {
      case "heat": {
        if (w.phase === "none") return no("empty");
        if (w.pos === MELT_AT && w.phase === "ice") { nw.phase = "water"; ev.push("melt"); break; }
        if (w.pos === BOIL_AT && w.phase === "water") {
          nw.boils = w.boils + 1; ev.push("boil");
          if (w.cover === "lid") { nw.drops = w.drops + 1; ev.push("condense"); break; }
          nw.units = w.units - 1; nw.lost = w.lost + 1; nw.lostHow = w.lostHow || (w.cover === "plate" ? "plate" : "open");
          if (w.cover === "plate") nw.drops = w.drops + 1;
          if (nw.units === 0) nw.phase = "none";
          break;
        }
        nw.pos = w.pos + 1;
        break;
      }
      case "cool": {
        if (w.phase === "none") return no("empty");
        if (w.pos === MELT_AT && w.phase === "water") { nw.phase = "ice"; ev.push("freeze"); break; }
        if (w.pos === 0) return no("coldest");
        nw.pos = w.pos - 1;
        break;
      }
      case "lid": nw.cover = w.cover === "lid" ? "none" : "lid"; break;
      case "plate": nw.cover = w.cover === "plate" ? "none" : "plate"; break;
      case "sugar": {
        if (w.sugar) return no("sugar_in");
        nw.sugar = true; ev.push("dissolve");
        break;
      }
    }
    const f: Facts = { tool: act.m, pos: nw.pos, phase: nw.phase, units: nw.units };
    if (ev.length) out.push(mom("progress", seq, { ...f, change: ev.join("+") }));
    let extra: Partial<BhaapState> = {};
    if (badlo && !w.broke) {
      // the card: each change is the next one named, or the same change going on; anything else is off the card
      let next = w.next, broke = "";
      for (const e of ev) {
        if (e === r.card[next]) next++;
        else if (next > 0 && e === r.card[next - 1]) continue;
        else { broke = e; break; }
      }
      if (broke) {
        const want = r.card[next] ?? "";
        // melting and dissolving taken for one change: sugar dissolved for "melt", the ice melted for "dissolve"
        const m3 = (broke === "dissolve" && want === "melt") || (broke === "melt" && want === "dissolve");
        const m = m3 ? mal("sugar-melts", { ...f, change: broke, card: want }, "off_card") : mom("law_refused", seq, { ...f, why: "off_card", change: broke, card: want });
        if (m) out.push(m);
        extra = { why: "off_card", ...seenWith(m) };
      }
      nw = { ...nw, next, broke };
    }
    if (!badlo && act.m === "heat" && ev.includes("boil") && w.cover === "plate") {
      // the cold plate held up in the white cloud: the invisible vapour leaves through the clear gap below it
      const m = mal("cloud-gas", { ...f, lost: nw.lost }, "");
      if (m) { out.push(m); extra = { why: "gap", ...seenWith(m) }; } else extra = { why: "gap" };
    }
    return ok(nw, ev, extra);
  }

  function applyBh(): Out {
    const w = s.w as BhW, r = bhRow(p);
    if (act.kind === "done") {
      if (w.cup >= r.need) return solved({ cup: w.cup });
      if (p.goal === "wapas" && w.src === 0 && w.air > 0) {
        // the plate is dry and the cup is short: the water is in the air, not gone (the lens shows it there)
        const m = mal("water-gone", { air: w.air, cup: w.cup }, "in_air");
        return no("in_air", m);
      }
      return no("not_yet", mom("law_refused", seq, { why: "not_yet", cup: w.cup, need: r.need }));
    }
    if (act.kind === "put") {
      const what = act.what as Item, at = Number(act.at);
      if (!ITEMS.includes(what) || w.bench.some((b) => b.what === what)) return no("not_there");
      if (!isInt(at) || at < 0 || at >= SLOTS || at !== w.bench.length) return no("bench_full");
      out.push(mom("progress", seq, { put: what }));
      return ok({ ...w, bench: [...w.bench, { what, drops: 0 }] }, ["put"]);
    }
    if (act.kind !== "use") return no("unknown_act");
    if (act.m === "wait") {
      let src = w.src, air = w.air;
      const ev: string[] = [];
      if (src > 0) { src--; air++; ev.push("evaporate"); }
      const bench = w.bench.map((b) => ({ ...b }));
      for (const b of bench) if (ITEM[b.what].cold && air > 0) { air--; b.drops++; if (!ev.includes("condense")) ev.push("condense"); }
      const warm = bench.some((b) => b.what === "warmDrink") && air > 0;
      // a full glass of warm coloured drink put out for the drops: none forms on it, nothing comes through
      if (!ev.length) return warm ? no("warm", mal("glass-leak", { air, glass: "warmDrink" }, "")) : no("still");
      out.push(mom("progress", seq, { evaporated: src < w.src ? 1 : 0, air, drops: bench.reduce((a, b) => a + b.drops, 0) }));
      let extra: Partial<BhaapState> = {};
      if (warm) {
        const m = mal("glass-leak", { air, glass: "warmDrink" }, "");
        if (m) { out.push(m); extra = { why: "warm", ...seenWith(m) }; } else extra = { why: "warm" };
      }
      return ok({ ...w, src, air, bench }, ev, extra);
    }
    if (act.m === "wipe") {
      const at = Number(act.at ?? w.bench.findIndex((b) => b.drops > 0));
      if (!isInt(at) || at < 0 || at >= w.bench.length) return no("no_drops");
      const b = w.bench[at];
      if (!b.drops) return no("no_drops");
      out.push(mom("progress", seq, { wiped: b.drops, cup: w.cup + b.drops }));
      return ok({ ...w, cup: w.cup + b.drops, tissue: w.tissue + b.drops, bench: w.bench.map((x, i) => (i === at ? { ...x, drops: 0 } : x)) }, ["wipe"]);
    }
    return no("no_tool");
  }

  function applyNa(): Out {
    const w = s.w as NaW, r = naRow(p);
    if (act.kind === "done") {
      if (w.trip >= r.trips.length) return solved({ trips: r.trips.join("+") });
      return no("not_yet", mom("law_refused", seq, { why: "not_yet", trip: r.trips[w.trip] }));
    }
    if (act.kind !== "use") return no("unknown_act");
    switch (act.m) {
      case "day": case "night": {
        const day = act.m === "day";
        if (w.day === day) return no("already");
        return ok({ ...w, day }, [act.m]);
      }
      case "wait": {
        const land = w.day ? Math.min(LAND_MAX, w.land + LAND_STEP) : Math.max(-LAND_MAX, w.land - LAND_STEP);
        const sea = w.day ? Math.min(SEA_MAX, w.sea + SEA_STEP) : Math.max(-SEA_MAX, w.sea - SEA_STEP);
        if (land === w.land && sea === w.sea) return no("steady");
        out.push(mom("progress", seq, { breeze: breeze(land, sea) || "calm" }));
        return ok({ ...w, land, sea }, ["wait"]);
      }
      case "sail": {
        const br = breeze(w.land, w.sea), want = r.trips[w.trip] ?? "";
        if (!br) return no("calm");
        const f: Facts = { breeze: br, boat: w.boat, want, time: w.day ? "day" : "night" };
        // the belief: by day the breeze blows from the land to the sea (and the other way at night)
        const swapped = (want === "out" && br === "in" && w.day) || (want === "back" && br === "out" && !w.day);
        const m = swapped ? mal("day-landward", f, "") : undefined;
        if (br === "out" && w.boat >= FAR) return no("far_out", m ?? mom("law_refused", seq, { ...f, why: "far_out" }));
        if (br === "in" && w.boat <= 0) return no("ashore", m ?? mom("law_refused", seq, { ...f, why: "ashore" }));
        const boat = w.boat + (br === "out" ? 1 : -1);
        let trip = w.trip;
        if ((want === "out" && boat === FAR) || (want === "back" && boat === 0)) trip++;
        if (m) out.push(m);
        out.push(mom("progress", seq, { ...f, boat }));
        return ok({ ...w, boat, trip }, [br === "out" ? "sail_out" : "sail_in"], m ? { why: "wrong_way", ...seenWith(m) } : {});
      }
    }
    return no("no_tool");
  }

  function applyKa(): Out {
    const w = s.w as KaW, r = kaRow(p), task = r.tasks[w.task];
    if (act.kind === "done") {
      if (w.task >= r.tasks.length) return solved({ tasks: r.tasks.join("+") });
      return no("not_yet", mom("law_refused", seq, { why: "not_yet", task: task ?? "" }));
    }
    if (act.kind === "put") {
      const what = act.what as Device, at = Number(act.at);
      if (!task || what !== DEVICE_OF[task]) return no("not_now");
      if (at !== 0 && at !== 1) return no("bad_place");
      if (w.dev && w.dev.what === what && w.dev.at === at) return no("there");
      out.push(mom("progress", seq, { put: what, at: at === 0 ? "high" : "low" }));
      return ok({ ...w, dev: { what, at } }, ["put"]);
    }
    if (act.kind !== "use" || act.m !== "wait") return no("no_tool");
    if (!task) return no("not_now");
    const kitchen = task === "clear";
    if (!w.dev && !kitchen) return no("no_device");
    const cells = [...w.cells], smoke = [...w.smoke];
    // 1. the sources: the AC cools its layer, the heater warms its layer, the stove makes hot, smoky air at the floor
    if (w.dev?.what === "ac") cells[cellOf(w.dev.at)] = -1;
    if (w.dev?.what === "heater") cells[cellOf(w.dev.at)] = 1;
    if (kitchen) { cells[2] = 1; smoke[2] = true; }
    // 2. convection: a warmer layer below a cooler one rises past it (the cooler sinks), from the floor up
    for (let i = 2; i >= 1; i--) if (cells[i] > cells[i - 1]) { [cells[i], cells[i - 1]] = [cells[i - 1], cells[i]]; [smoke[i], smoke[i - 1]] = [smoke[i - 1], smoke[i]]; }
    // 3. the exhaust takes out the hot, smoky air at its layer (fresh air comes in to take its place)
    if (w.dev?.what === "exhaust") { const c = cellOf(w.dev.at); if (smoke[c]) { smoke[c] = false; cells[c] = 0; } }
    const cooked = w.cooked + (kitchen ? 1 : 0);
    if (!kitchen && cells.every((x, i) => x === w.cells[i])) return no("steady");
    const met = task === "cool" ? cells.every((x) => x === -1) : task === "warm" ? cells.every((x) => x === 1) : cooked >= COOK && !smoke.some(Boolean);
    const f: Facts = { task, cells: cells.join(","), smoke: smoke.filter(Boolean).length };
    out.push(mom("progress", seq, f));
    let extra: Partial<BhaapState> = {};
    if (task === "cool" && w.dev?.what === "ac" && w.dev.at === 1) {
      // the AC near the floor: the cool air stays down there; the warm air above it has nowhere to sink from
      const m = mal("cold-rises", f, "");
      if (m) { out.push(m); extra = { why: "stays_warm", ...seenWith(m) }; } else extra = { why: "stays_warm" };
    }
    return ok({ ...w, cells, smoke, cooked, task: met ? w.task + 1 : w.task }, met ? ["wait", "task"] : ["wait"], extra);
  }

  function applyBa(): Out {
    const w = s.w as BaW, r = baRow(p);
    if (act.kind === "done") {
      if ((r.flow ? w.flowed : w.field) >= r.need) return solved({ rain: w.field + w.flowed });
      return no("not_yet", mom("law_refused", seq, { why: "not_yet", field: w.field, flowed: w.flowed, need: r.need }));
    }
    if (act.kind !== "use" || !toolsOf(p).includes(act.m)) return no("no_tool");
    switch (act.m) {
      case "sun": {
        if (w.vap >= VAP_MAX) return no("full");
        out.push(mom("progress", seq, { vap: w.vap + 1 }));
        return ok({ ...w, vap: w.vap + 1 }, ["evaporate"]);
      }
      case "rise": {
        if (!w.vap) return no("no_vapour");
        out.push(mom("progress", seq, { cloud: w.cloud + w.vap }));
        return ok({ ...w, cloud: w.cloud + w.vap, vap: 0 }, ["condense"]);
      }
      case "rain": {
        if (!w.cloud) {
          // vapour that has not risen and cooled is no cloud: it cannot rain
          if (w.vap > 0) return no("no_cloud", mal("vapour-rains", { vap: w.vap, cloud: 0 }, "no_cloud"));
          return no("no_cloud", mom("law_refused", seq, { why: "no_cloud", vap: 0 }));
        }
        out.push(mom("progress", seq, { field: w.field + w.cloud }));
        return ok({ ...w, field: w.field + w.cloud, cloud: 0 }, ["rain"]);
      }
      case "flow": {
        if (!w.field) return no("dry_field");
        out.push(mom("progress", seq, { flowed: w.flowed + w.field }));
        return ok({ ...w, flowed: w.flowed + w.field, field: 0 }, ["flow"]);
      }
    }
    return no("no_tool");
  }

  function applyKu(): Out {
    const w = s.w as KuW, r = kuRow(p);
    if (act.kind === "done") {
      if (w.pumped >= r.pumps) return solved({ filled: w.filled, pumped: w.pumped });
      return no("not_yet", mom("law_refused", seq, { why: "not_yet", filled: w.filled, pumped: w.pumped }));
    }
    if (act.kind !== "use" || !toolsOf(p).includes(act.m)) return no("no_tool");
    switch (act.m) {
      case "rain": {
        if (!w.rains) return no("no_rain");
        // the open soil takes one gap's water in; the concrete's runs off, unless the recharge pit takes it in too
        const filled = Math.min(r.cap, w.filled + (w.pit ? 2 : 1));
        out.push(mom("progress", seq, { filled }));
        return ok({ ...w, filled, rains: w.rains - 1 }, w.pit ? ["seep", "pit"] : ["seep", "runoff"]);
      }
      case "pit": {
        if (w.pit) return no("there");
        return ok({ ...w, pit: true }, ["pit"]);
      }
      case "pump": {
        if (w.filled <= r.well) {
          // the water table is below the well's bottom: the well is dry
          return no("dry", mal("never-dry", { filled: w.filled, well: r.well, pumped: w.pumped }, "dry"));
        }
        out.push(mom("progress", seq, { filled: w.filled - 1, pumped: w.pumped + 1 }));
        return ok({ ...w, filled: w.filled - 1, pumped: w.pumped + 1 }, ["pump"]);
      }
    }
    return no("no_tool");
  }
}
const goalMet = (_l: PlayLevel<BhaapParams>, s: BhaapState) => s.done;

// ───────────────────────────── solve, shortcut, malActs ─────────────────────────────
const run = (level: PlayLevel<BhaapParams>, acts: BhaapAct[]) => { let s = init(level); for (const a of acts) s = apply(level, s, a, 1).state; return s; };
/** every act the law could be asked for in this state (the solver's moves; the driver's taps) */
export function movesOf(p: BhaapParams, s: BhaapState): BhaapAct[] {
  const out: BhaapAct[] = [{ kind: "done" }];
  if (p.goal === "os" || p.goal === "wapas") {
    const w = s.w as BhW;
    if (w.bench.length < SLOTS) for (const x of ITEMS) if (!w.bench.some((b) => b.what === x)) out.push({ kind: "put", what: x, at: w.bench.length });
    out.push({ kind: "use", m: "wait" });
    w.bench.forEach((b, i) => { if (b.drops) out.push({ kind: "use", m: "wipe", at: i }); });
    return out;
  }
  if (p.goal === "kamra") {
    const w = s.w as KaW, task = kaRow(p).tasks[w.task];
    if (task) for (const at of [0, 1] as const) out.push({ kind: "put", what: DEVICE_OF[task], at });
    out.push({ kind: "use", m: "wait" });
    return out;
  }
  for (const m of toolsOf(p)) out.push({ kind: "use", m });
  return out;
}
const keyOf = (s: BhaapState) => JSON.stringify(s.w);
/** the shortest act list (breadth first over the acts the law accepts; the state spaces are a few hundred at most) */
function solve(level: PlayLevel<BhaapParams>): BhaapAct[] | null {
  const p = level.params;
  let frontier: { s: BhaapState; acts: BhaapAct[] }[] = [{ s: init(level), acts: [] }];
  const seen = new Set([keyOf(frontier[0].s)]);
  for (let depth = 0; depth < 22 && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const { s, acts } of frontier) for (const a of movesOf(p, s)) {
      const r = apply(level, s, a, acts.length + 1);
      if (r.refused) continue;
      // a solution never passes through a mal-rule's consequence
      if (r.moments.some((m) => m.kind === "misconception_consequence")) continue;
      if (r.state.done) return [...acts, a];
      const k = keyOf(r.state);
      if (seen.has(k)) continue;
      seen.add(k); next.push({ s: r.state, acts: [...acts, a] });
    }
    frontier = next;
  }
  return null;
}
/** idea-free play: "ho gaya" at once; one tool tapped over and over (then "ho gaya"); the pot all the way hot, then cold */
function shortcut(level: PlayLevel<BhaapParams>): BhaapAct[] | null {
  const p = level.params, tools = toolsOf(p), tries: BhaapAct[][] = [[{ kind: "done" }]];
  for (const m of tools) tries.push([...Array.from({ length: 12 }, (): BhaapAct => ({ kind: "use", m })), { kind: "done" }]);
  if (p.goal === "badlo" || p.goal === "bachao") {
    // all the way hot, then all the way cold (and the other way)
    const h = Array.from({ length: 12 }, (): BhaapAct => ({ kind: "use", m: "heat" })), c = Array.from({ length: 12 }, (): BhaapAct => ({ kind: "use", m: "cool" }));
    tries.push([...h, ...c, { kind: "done" }], [...c, ...h, { kind: "done" }]);
  }
  for (const t of tries) if (run(level, t).done) return t;
  return null;
}
/** the acts that solve the level up to the first state where `want` holds (the law's own accepted acts, breadth first) */
function reach(level: PlayLevel<BhaapParams>, want: (s: BhaapState) => boolean): BhaapAct[] | null {
  const p = level.params;
  let frontier: { s: BhaapState; acts: BhaapAct[] }[] = [{ s: init(level), acts: [] }];
  const seen = new Set([keyOf(frontier[0].s)]);
  for (let depth = 0; depth < 12 && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const { s, acts } of frontier) {
      if (want(s)) return acts;
      for (const a of movesOf(p, s)) {
        if (a.kind === "done") continue;
        const r = apply(level, s, a, 1);
        if (r.refused || r.moments.some((m) => m.kind === "misconception_consequence")) continue;
        const k = keyOf(r.state);
        if (seen.has(k)) continue;
        seen.add(k); next.push({ s: r.state, acts: [...acts, a] });
      }
    }
    frontier = next;
  }
  return null;
}
function malActs(level: PlayLevel<BhaapParams>, malId: string): BhaapAct[] | null {
  const p = level.params, H: BhaapAct = { kind: "use", m: "heat" };
  switch (malId) {
    case "air-bubbles": {
      if (p.goal !== "bachao") return null;
      // heated open until it boils once, then "ho gaya"
      const pre = reach(level, (s) => { const w = s.w as AvW; return w.pos === BOIL_AT && w.phase === "water" && w.cover === "none"; });
      return pre ? [...pre, H, { kind: "done" }] : null;
    }
    case "cloud-gas": {
      if (p.goal !== "bachao") return null;
      const pre = reach(level, (s) => { const w = s.w as AvW; return w.pos === BOIL_AT && w.phase === "water" && w.cover === "none"; });
      return pre ? [...pre, { kind: "use", m: "plate" }, H] : null;
    }
    case "sugar-melts": {
      if (p.goal !== "badlo") return null;
      const card = avRow(p).card;
      // on the way through the card, the sugar spooned when the next change named is melting
      const pre = reach(level, (s) => { const w = s.w as AvW; return !w.broke && !w.sugar && card[w.next] === "melt"; });
      return pre ? [...pre, { kind: "use", m: "sugar" }] : null;
    }
    case "glass-leak": {
      if (p.goal !== "os" && p.goal !== "wapas") return null;
      const wait: BhaapAct = { kind: "use", m: "wait" };
      return [{ kind: "put", what: "warmDrink", at: 0 }, wait];
    }
    case "water-gone": {
      if (p.goal !== "wapas") return null;
      return [...Array.from({ length: bhRow(p).src }, (): BhaapAct => ({ kind: "use", m: "wait" })), { kind: "done" }];
    }
    case "day-landward": {
      if (p.goal !== "naav") return null;
      // waited in the time the level starts in until a breeze blows, then the sail raised the way the belief says it blows
      const pre = reach(level, (s) => { const w = s.w as NaW, br = breeze(w.land, w.sea), want = naRow(p).trips[w.trip]; return w.trip === 0 && ((want === "out" && br === "in" && w.day) || (want === "back" && br === "out" && !w.day)); });
      return pre ? [...pre, { kind: "use", m: "sail" }] : null;
    }
    case "cold-rises": {
      if (p.goal !== "kamra") return null;
      const pre = reach(level, (s) => kaRow(p).tasks[(s.w as KaW).task] === "cool" && !(s.w as KaW).dev);
      return pre ? [...pre, { kind: "put", what: "ac", at: 1 }, { kind: "use", m: "wait" }] : null;
    }
    case "vapour-rains": {
      if (p.goal !== "baadal") return null;
      return baRow(p).vap ? [{ kind: "use", m: "rain" }] : [{ kind: "use", m: "sun" }, { kind: "use", m: "rain" }];
    }
    case "never-dry": {
      if (p.goal !== "kuan") return null;
      // pumped on, never recharging, until the well is dry
      const r = kuRow(p);
      return Array.from({ length: Math.max(1, r.f0 - r.well + 1) }, (): BhaapAct => ({ kind: "use", m: "pump" }));
    }
  }
  return null;
}

// ───────────────────────────── generate ─────────────────────────────
interface BhaapGrammar { scenes?: string[] }
const JITTER = 0.24;
function difficultyOf(p: BhaapParams, steps: number): number {
  return Math.max(0, Math.min(1, 0.18 + 0.025 * (steps - 4) + 0.1 * (p.look - 1)));
}
function generate(req: GenRequest): Candidate<BhaapParams>[] {
  const mode = (BHAAP_MODES.includes(req.mode as BhaapMode) ? req.mode : "avastha") as BhaapMode;
  const goals = GOALS_OF[mode] as readonly BhaapGoal[];
  const goal = (goals.includes(req.goal as BhaapGoal) ? req.goal : goals[0]) as BhaapGoal;
  const g = req.grammar as BhaapGrammar, rnd = mulberry32(req.seed);
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const scenes = Array.isArray(g.scenes) && g.scenes.length ? g.scenes : null;
  const rows: { row: number; scene: string }[] = [];
  rowsOf(goal).forEach((r, i) => { if (r.look === look) for (const ctx of r.ctx) if (!scenes || scenes.includes(ctx)) rows.push({ row: i, scene: ctx }); });
  // the seed orders the rows (the picker's band and the nudge below then choose among them)
  for (let i = rows.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [rows[i], rows[k]] = [rows[k], rows[i]]; }
  const out: Candidate<BhaapParams>[] = [];
  for (const { row, scene } of rows) {
    let order: string[] = [];
    if (goal === "os" || goal === "wapas") { order = [...ITEMS]; for (let i = order.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [order[i], order[k]] = [order[k], order[i]]; } }
    const params: BhaapParams = { goal, look, row, scene, order, lay: Math.floor(rnd() * 10000) };
    const sig = `${mode}:${goal}:${row}:${scene}`;
    const level = {
      v: "play@1", levelId: `bhaap-${sig}-${req.seed}`.replace(/[^a-z0-9:=+._-]/gi, "_"), family: "bhaap", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: scene, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    } as PlayLevel<BhaapParams>;
    const v = validate(level as PlayLevel<unknown>);
    if (!v) continue;
    const sol = solve(v);
    if (!sol || shortcut(v)) continue;
    // a seeded nudge (± JITTER / 2) so the picker's nearest-to-band level differs from child to child
    const difficulty = Math.max(0, Math.min(1, difficultyOf(v.params, sol.length) + (rnd() - 0.5) * JITTER));
    out.push({ signature: sig, difficulty, level: v });
  }
  return out;
}

// ───────────────────────────── hidden, facts, board, grade ─────────────────────────────
const TOOL_WORDS: Record<string, string[]> = {
  heat: ["heat", "garam"], cool: ["cool", "thanda"], lid: ["lid", "dhakkan"], sugar: ["sugar", "cheeni"], plate: ["plate"],
  wait: ["wait", "ruko"], wipe: ["wipe", "ponchho"], cold: ["cold glass", "thanda gilaas"], coldDrink: ["cold nimbu"], warmDrink: ["warm nimbu"],
  day: ["day", "din"], night: ["night", "raat"], sail: ["sail", "paal"], ac: ["ac"], heater: ["heater"], exhaust: ["exhaust"],
  sun: ["sun", "dhoop"], rise: ["rise", "upar"], rain: ["rain", "baarish"], flow: ["flow", "bah"], pit: ["recharge pit", "gaddha"], pump: ["pump"],
};
/** the tools the solution needs (their words) are never said first; for a device, where it goes neither */
export function bhaapHidden(level: PlayLevel<unknown>): string[] {
  try {
    const v = validate(level);
    if (!v) return [];
    const sol = solve(v) ?? [];
    const words = sol.flatMap((a) => (a.kind === "use" ? TOOL_WORDS[a.m] ?? [] : a.kind === "put" ? [...(TOOL_WORDS[a.what] ?? []), ...(v.params.goal === "kamra" ? (a.at === 0 ? ["high", "upar"] : ["low", "neeche"]) : [])] : []));
    return uniq(words);
  } catch { return []; }
}
function facts(level: PlayLevel<BhaapParams>, s: BhaapState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  const w = s.w as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(w)) if (typeof v === "number" || typeof v === "string") f[k] = v as number | string;
  if (s.why) f.why = s.why;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<BhaapParams>, s: BhaapState) {
  const p = level.params, w = s.w as unknown as Record<string, unknown>;
  const lines = Object.entries(w).map(([k, v]) => `${k}: ${Array.isArray(v) ? JSON.stringify(v) : typeof v === "object" && v ? JSON.stringify(v) : String(v)}`);
  if (p.goal === "badlo") lines.unshift(`card: ${avRow(p).card.join(" → ")}`);
  return { title: "Bhaap", lines };
}
function grade(level: PlayLevel<BhaapParams>, acts: PlayActEnvelope<BhaapAct>[]): PlayGrade {
  return gradeLevel(bhaapLogic, level, acts, { decisiveRefusals: ["not_yet", "off_card", "lost", "in_air", "ashore", "far_out", "no_cloud", "dry"], final: true });
}

export const bhaapLogic: FamilyLogic<BhaapParams, BhaapState, BhaapAct> = {
  family: "bhaap", modes: BHAAP_MODES, malRules: BHAAP_MAL,
  // round 8 law 3 (dc-r8-game-modes-three-laws): mix-ups these goals see from ONE pick among five or fewer (a tool, a
  // bin, a lane, a claim; server/forge3/qa/laws.mjs found each): reported at chance weight, named only on a repeat
  chancePicks: ["bachao:cloud-gas", "badlo:sugar-melts", "baadal:vapour-rains", "kuan:never-dry", "kamra:cold-rises"],
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
