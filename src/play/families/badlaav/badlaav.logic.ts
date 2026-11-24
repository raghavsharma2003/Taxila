// Badlaav (बदलाव, "change") · round 7, physical and chemical changes, rusting and combustion (class 7 science, c7-science-ch05).
// The child runs a change, tries to undo it, puts a solid where it changes, works a sigri's fire triangle, lets a fire burn down
// a piece at a time, or keeps iron in a damp or a dry place day by day. Nothing here runs on a clock: every step is a tap
// (slow changes advance by the child's own "wait" or "another day" taps), and the law answers each act at once.
//
// palat (physical and chemical changes, ch05-t01). A card of the kit's own changes, one at a time.
//   nishaan (s2, s1) run the change ("Karo"), watch it, and mark what it showed: one of the kit's signs of a chemical change
//                    (gas bubbles, a change of colour, heat or light given out, a new smell, a new solid) or "nothing new: only
//                    its form changed". A sign is taken only if this change shows it; "nothing new" only if no new substance
//                    formed. The card's change is then filed physical or chemical by the law.
//   ulta    (s3, s1) run the change, try to undo it (cool it or warm it), then say what happened: it came back, it did not come
//                    back but is still the same stuff, or a new substance formed. Torn paper is on every card: it does not
//                    come back and it is still paper (reversibility is a clue, not the rule).
//   ghol    (s4)     put each solid where it changes: on a warm tawa (no water) or into a glass of cold water standing on a
//                    kitchen scale. Ghee and wax melt on the tawa (a wait a step); sugar and salt dissolve in the water (a stir
//                    a step), the scale's pointer staying where it went when the solid went in.
// aag (rusting and combustion, ch05-t02). A fire is only ever a PICTURE that responds: no child act lights anything, and no hand
//   is drawn near the flame. The child only takes a side of the fire triangle away or gives it more.
//   trikon  (s2, s1) a burning sigri and its fire triangle (fuel, oxygen (air), heat). Take the wood away, put the lid on (it
//                    goes out a wait at a time as its air is used up), take the lid off, fan the sigri (more oxygen-rich air:
//                    it burns more strongly). Each card item asks for the fire out (perhaps keeping the wood, or with no lid on
//                    the bench) or burning more strongly (perhaps starting under a lid).
//   raakh   (s4, s1) a fire burns its wood or straw down a piece a wait; smoke rises and ash falls, and a closer look at the air
//                    shows the carbon dioxide and water vapour. The child says where each went (into the air, or left behind)
//                    and says Done once all of the fuel is accounted for.
//   jang    (s3)     iron nails and a piece of railing, each to be rusted or kept bright: the child puts each in a damp place
//                    (air and water) or a dry one (air, no water) and taps "another day". Rust grows a little a day, only where
//                    there is water as well as air; no flame, ever.
//
// The CHILD's beliefs (mal-rules; each mapped to the topic's own kit misconception, a deterministic act list with its own
// consequence):
//   looks-new   (t01 m2) a change of state (melting ghee, ice or wax; freezing water) marked with a sign of a new substance
//                        (nishaan) or said to make a new substance (ulta): cooled or warmed back it is the same stuff
//   undo-all    (t01 m1) "it came back" said of a change that did not come back (a cooked egg cooled, curd, a roasted chapati,
//                        torn paper): the card shows it as it still is
//   sugar-melts (t01 m3) sugar or salt put on the warm tawa to make it go: dissolving needs a liquid, not heat
//   gone        (t01 m4) "Gone!" said of sugar or salt dissolving in the water: the scale still reads what it did once it went in
//   fan-heat    (t02 m2) the sigri fanned with its lid on (fanning taken to blow heat in): the lid keeps the air out; a fan sends
//                        air, and the air's oxygen is what makes it burn more strongly
//   vanished    (t02 m1) Done said after the fire burnt all of its fuel without looking for what went into the air: it became
//                        carbon dioxide and water vapour (and smoke) in the air and ash left behind
//   just-dirt   (t02 m4) a rusted nail wiped as if rust were dirt: rust is a new substance; it needed oxygen and water
// Not admitted (by the lead's ruling, a fire-safety line and the teacher's, never a mechanic): t02 m3 (water can put out every
// kind of fire). No act here puts water on a fire, and no act lights one.
// Every change, sign, fuel, product and condition is the kit's (KIT_OF; tests/r7-games-badlaav.test.mjs reads them out of
// data/kits/c7-science.json); every number here is a scene value with no fact claimed.
import type { BadlaavAct, Candidate, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export const BADLAAV_MODES = ["palat", "aag"] as const;
export type BadlaavMode = (typeof BADLAAV_MODES)[number];
export const GOALS_OF = { palat: ["nishaan", "ulta", "ghol"], aag: ["trikon", "raakh", "jang"] } as const;
export type BadlaavGoal = (typeof GOALS_OF)[BadlaavMode][number];
export const BADLAAV_MAL = ["looks-new", "undo-all", "sugar-melts", "gone", "fan-heat", "vanished", "just-dirt"] as const;

/** the kit's own sentences each law rests on (tests read them out of data/kits/c7-science.json; a sentence from an item is
 *  from a verified item) */
export const KIT_OF: Record<string, Record<string, string>> = {
  "c7-science-ch05-t01": {
    "physical": "In a physical change, a substance changes its shape, size or state (solid, liquid, gas) but no new substance is formed",
    "the physical changes": "for example melting ghee, freezing water, tearing paper and dissolving sugar",
    "chemical": "In a chemical change, one or more new substances with different properties are formed",
    "the chemical changes": "for example burning a wick, curdling milk, cooking an egg, rusting and fruit ripening",
    "the signs": "Signs of a chemical change include gas bubbles, a change of colour, heat or light given out, a new smell, or a new solid forming",
    "undoing": "Many physical changes are easy to reverse (melting, freezing), but some are not (tearing paper, breaking glass); most chemical changes cannot be reversed easily",
    "the clue": "So reversibility is a clue, not the rule; the real test is whether a new substance forms",
    "melting": "Melting is a solid turning into a liquid when heated",
    "dissolving": "dissolving is a substance spreading into a liquid to form a solution",
    "still there": "a dissolved substance is still there and still has mass",
    "melting ice": "Melting ice is a chemical change because it looks different",
    "freeze it again": "Freeze the melted water again in the animation and ask whether anything new appeared",
    "ghee cools back": "it becomes solid again when it cools",
    "still paper": "the torn pieces are still paper",
    "wax": "Melting wax is physical: the liquid wax cools back into solid wax",
    "the wick": "Burning is chemical: heat and light are given out",
    "the curd": "there is a new sour smell and taste and lumps form",
    "the curd stays": "Says curd can be turned back into milk",
    "the egg stays": "Thinks a cooked egg can become raw again if cooled",
    "baking soda": "Put half a spoon of baking soda into a cup and add a few spoons of lemon juice or vinegar",
    "the bubbles": "It fizzes and bubbles with a hissing sound as carbon dioxide gas forms",
    "the chapati": "Check for signs of a chemical change: there is a colour change and a new smell",
    "the raw dough": "Ask: can you get the raw dough back? No",
    "the rust": "develops a reddish-brown coating after months of rain. The coating has different properties from iron",
    "heat and a liquid": "Two-panel contrast: ghee melting in a warm pan with no water, sugar dissolving in cold water",
    "which needs which": "Ask which panel needs heat and which needs a liquid",
    "dissolving needs heat": "Thinks dissolving needs heat like melting",
    "salt dissolves": "Dissolving is the salt spreading into the water to form a solution",
    "the scale": "Kitchen-scale animation with the reading staying at 220 g as the sugar crystals vanish from view",
    "it goes up": "It goes up by the weight of the sugar; the sugar has dissolved but it is still in the water",
  },
  "c7-science-ch05-t02": {
    "combustion": "Combustion (burning) is a chemical change in which a substance (the fuel) reacts with oxygen and gives out heat and usually light",
    "the triangle": "Burning needs three things: fuel, oxygen (air) and enough heat to reach the ignition temperature; removing any one of them puts the fire out",
    "fanning and covering": "Fanning a sigri pushes more oxygen-rich air to the fuel so it burns more strongly; covering a flame cuts off oxygen and it goes out",
    "slowly": "If the sigri were covered instead, the oxygen would be cut off and it would slowly go out",
    "not destroyed": "Burning does not destroy matter: wood, wax or oil turn into carbon dioxide, water vapour, smoke and ash, which go into the air or stay behind",
    "into the air": "most of it turned into gases (carbon dioxide and water vapour) and smoke that went into the air. Only a small part was left as ash",
    "the straw": "Burning turns the straw into carbon dioxide, water vapour, smoke particles and ash",
    "rusting": "Rusting is also a chemical change that needs oxygen, and water too, but it is slow and gives no flame",
    "the nail": "the rusting of an iron nail",
    "both take oxygen": "Same: both are chemical changes in which a substance combines with oxygen",
    "remove a side": "Fuel: remove the fuel, for example turn off the gas. Oxygen: cut off air with a lid",
  },
};

// ───────────────────────────── the kit's changes, solids, fuels, products ─────────────────────────────
export const SIGNS = ["gas", "colour", "heat", "smell", "solid"] as const;
export type Sign = (typeof SIGNS)[number];
/** a change on the bench: physical (and whether it is a change of state, and what undoes it) or chemical (and the kit's signs
 *  it shows; KIT_OF "the wick", "the curd", "the bubbles", "the chapati", "the rust") */
export interface Change { kind: "physical" | "chemical"; state?: boolean; undo?: "cool" | "warm" | ""; signs?: readonly Sign[] }
export const CHANGES = {
  ghee: { kind: "physical", state: true, undo: "cool" },        // melting ghee: it becomes solid again when it cools
  freeze: { kind: "physical", state: true, undo: "warm" },      // freezing water: melting undoes it
  ice: { kind: "physical", state: true, undo: "cool" },         // melting ice: freeze the melted water again
  wax: { kind: "physical", state: true, undo: "cool" },         // melting wax: it cools back into solid wax
  paper: { kind: "physical", state: false, undo: "" },          // tearing paper: not easy to reverse; still paper
  wick: { kind: "chemical", signs: ["heat"] },                  // burning a wick: heat and light given out
  curd: { kind: "chemical", signs: ["smell", "solid"] },        // curdling milk: a new smell, lumps form
  soda: { kind: "chemical", signs: ["gas"] },                   // baking soda in lemon juice or vinegar: bubbles of gas
  chapati: { kind: "chemical", signs: ["colour", "smell"] },    // roasting a chapati: a colour change and a new smell
  rust: { kind: "chemical", signs: ["colour"] },                // rusting: a reddish-brown coating
  egg: { kind: "chemical", signs: [] },                         // cooking an egg (ulta only: it does not come back when cooled)
} as const satisfies Record<string, Change>;
export type ChangeId = keyof typeof CHANGES;
export const changeOf = (id: ChangeId): Change => CHANGES[id];
/** ghol: what each solid needs: heat (it melts) or a liquid (it dissolves) (KIT_OF "melting", "dissolving", "heat and a liquid") */
export const SOLIDS = { ghee: "melt", wax: "melt", sugar: "dissolve", salt: "dissolve" } as const;
export type SolidId = keyof typeof SOLIDS;
/** raakh: the fuels (KIT_OF "not destroyed": wood; "the straw") and what burning turns them into, and where each goes
 *  (KIT_OF "into the air": the gases and smoke into the air, ash left behind) */
export const FUELS = ["wood", "straw"] as const;
export type Fuel = (typeof FUELS)[number];
export const PRODUCTS = ["co2", "vapour", "smoke", "ash"] as const;
export type Product = (typeof PRODUCTS)[number];
export const GOES: Record<Product, "air" | "left"> = { co2: "air", vapour: "air", smoke: "air", ash: "left" };
/** the products seen without a closer look (smoke rising, ash falling); the gases need one */
export const SEEN: Record<Product, boolean> = { co2: false, vapour: false, smoke: true, ash: true };
/** jang: where iron is kept (air is everywhere; water only in the damp place) (KIT_OF "rusting": needs oxygen and water) */
export const PLACES = ["damp", "dry"] as const;
export type Place = (typeof PLACES)[number];
export const WATER: Record<Place, boolean> = { damp: true, dry: false };
/** scene value, no fact claimed: waits (melting) or stirs (dissolving) until a solid has gone over */
export const STEPS = 2;
/** scene value, no fact claimed: the sigri's glow at the start of a card item (3 is "burning strongly") */
export const GLOW0 = 2;
/** scene value, no fact claimed: the days a card's nails are watched */
export const DAYS = 3;
/** scene value, no fact claimed: the rust a nail to be rusted must reach */
export const RUSTED = 2;
/** scene value, no fact claimed: the most days on the bench */
export const DAYMAX = 6;

// ───────────────────────────── the rows of each goal ─────────────────────────────
type Look = 1 | 2 | 3;
interface ChangeRow { card: readonly ChangeId[]; ctx: readonly string[]; look: Look }
const NISHAAN_ROWS: readonly ChangeRow[] = [
  { card: ["ghee", "wick", "paper"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["freeze", "curd", "soda"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["ice", "chapati", "paper"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["wax", "soda", "rust"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["paper", "curd", "ghee"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["ghee", "soda", "paper", "curd"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["freeze", "wick", "chapati", "ice"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["wax", "rust", "paper", "soda"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["ice", "curd", "freeze", "wick"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["ghee", "soda", "paper", "curd", "rust"], ctx: ["rasoi", "lab"], look: 3 },
  { card: ["freeze", "wick", "chapati", "ice", "soda"], ctx: ["rasoi", "lab"], look: 3 },
  { card: ["wax", "rust", "paper", "curd", "chapati"], ctx: ["rasoi", "lab"], look: 3 },
  { card: ["ice", "soda", "freeze", "wick", "paper"], ctx: ["rasoi", "lab"], look: 3 },
];
const ULTA_ROWS: readonly ChangeRow[] = [
  { card: ["ghee", "egg", "paper"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["freeze", "curd", "paper"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["ice", "chapati", "paper"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["wax", "egg", "paper"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["ghee", "freeze", "egg", "paper"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["ice", "curd", "chapati", "paper"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["wax", "freeze", "curd", "paper"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["ghee", "egg", "chapati", "paper"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["ghee", "freeze", "egg", "curd", "paper"], ctx: ["rasoi", "lab"], look: 3 },
  { card: ["ice", "wax", "chapati", "egg", "paper"], ctx: ["rasoi", "lab"], look: 3 },
  { card: ["freeze", "ghee", "curd", "chapati", "paper"], ctx: ["rasoi", "lab"], look: 3 },
  { card: ["wax", "ice", "egg", "chapati", "paper"], ctx: ["rasoi", "lab"], look: 3 },
];
interface SolidRow { card: readonly SolidId[]; ctx: readonly string[]; look: Look }
const GHOL_ROWS: readonly SolidRow[] = [
  { card: ["ghee", "sugar"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["salt", "wax"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["sugar", "wax"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["ghee", "salt"], ctx: ["rasoi", "lab"], look: 1 },
  { card: ["ghee", "sugar", "salt"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["wax", "salt", "sugar"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["sugar", "ghee", "wax"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["salt", "wax", "ghee"], ctx: ["rasoi", "lab"], look: 2 },
  { card: ["ghee", "sugar", "wax", "salt"], ctx: ["rasoi", "lab"], look: 3 },
  { card: ["salt", "ghee", "sugar", "wax"], ctx: ["rasoi", "lab"], look: 3 },
  { card: ["sugar", "wax", "salt", "ghee"], ctx: ["rasoi", "lab"], look: 3 },
  { card: ["wax", "salt", "ghee", "sugar"], ctx: ["rasoi", "lab"], look: 3 },
];
/** a sigri card item: what it asks for, and whether the lid starts on */
export type Want = "out" | "keep" | "nolid" | "strong";
export interface Fire { want: Want; lid: boolean }
interface FireRow { card: readonly Fire[]; ctx: readonly string[]; look: Look }
const S = (lid = false): Fire => ({ want: "strong", lid });
const O: Fire = { want: "out", lid: false }, K: Fire = { want: "keep", lid: false }, N: Fire = { want: "nolid", lid: false };
const TRIKON_ROWS: readonly FireRow[] = [
  { card: [S(), K], ctx: ["sigri", "chulha"], look: 1 },
  { card: [O, S()], ctx: ["sigri", "chulha"], look: 1 },
  { card: [K, S()], ctx: ["sigri", "chulha"], look: 1 },
  { card: [S(), N], ctx: ["sigri", "chulha"], look: 1 },
  { card: [N, S()], ctx: ["sigri", "chulha"], look: 1 },
  { card: [S(true), K], ctx: ["sigri", "chulha"], look: 2 },
  { card: [N, S(true)], ctx: ["sigri", "chulha"], look: 2 },
  { card: [K, S(true)], ctx: ["sigri", "chulha"], look: 2 },
  { card: [S(true), N], ctx: ["sigri", "chulha"], look: 2 },
  { card: [S(true), K, N], ctx: ["sigri", "chulha"], look: 3 },
  { card: [K, S(true), O], ctx: ["sigri", "chulha"], look: 3 },
  { card: [N, K, S(true)], ctx: ["sigri", "chulha"], look: 3 },
  { card: [S(true), N, K], ctx: ["sigri", "chulha"], look: 3 },
];
/** a fire to burn down: its fuel and the pieces it has (a scene value, no fact claimed) */
export interface Burn { fuel: Fuel; k: number }
interface BurnRow { card: readonly Burn[]; ctx: readonly string[]; look: Look }
const RAAKH_ROWS: readonly BurnRow[] = [
  { card: [{ fuel: "wood", k: 2 }], ctx: ["sigri", "khet"], look: 1 },
  { card: [{ fuel: "straw", k: 2 }], ctx: ["sigri", "khet"], look: 1 },
  { card: [{ fuel: "wood", k: 3 }], ctx: ["sigri", "khet"], look: 1 },
  { card: [{ fuel: "straw", k: 3 }], ctx: ["sigri", "khet"], look: 1 },
  { card: [{ fuel: "wood", k: 4 }], ctx: ["sigri", "khet"], look: 2 },
  { card: [{ fuel: "straw", k: 4 }], ctx: ["sigri", "khet"], look: 2 },
  { card: [{ fuel: "wood", k: 3 }, { fuel: "straw", k: 2 }], ctx: ["sigri", "khet"], look: 2 },
  { card: [{ fuel: "straw", k: 3 }, { fuel: "wood", k: 2 }], ctx: ["sigri", "khet"], look: 2 },
  { card: [{ fuel: "wood", k: 3 }, { fuel: "straw", k: 3 }], ctx: ["sigri", "khet"], look: 3 },
  { card: [{ fuel: "straw", k: 4 }, { fuel: "wood", k: 2 }], ctx: ["sigri", "khet"], look: 3 },
  { card: [{ fuel: "wood", k: 4 }, { fuel: "straw", k: 3 }], ctx: ["sigri", "khet"], look: 3 },
  { card: [{ fuel: "straw", k: 3 }, { fuel: "wood", k: 4 }], ctx: ["sigri", "khet"], look: 3 },
];
/** a piece of iron and what the card asks for it */
export interface Iron { thing: "nail" | "railing"; want: "rust" | "keep" }
interface IronRow { card: readonly Iron[]; ctx: readonly string[]; look: Look }
const nR: Iron = { thing: "nail", want: "rust" }, nK: Iron = { thing: "nail", want: "keep" }, rR: Iron = { thing: "railing", want: "rust" }, rK: Iron = { thing: "railing", want: "keep" };
const JANG_ROWS: readonly IronRow[] = [
  { card: [nR, nK], ctx: ["ghar", "school"], look: 1 },
  { card: [nK, nR], ctx: ["ghar", "school"], look: 1 },
  { card: [rR, nK], ctx: ["ghar", "school"], look: 1 },
  { card: [nR, rK], ctx: ["ghar", "school"], look: 1 },
  { card: [nR, nK, rR], ctx: ["ghar", "school"], look: 2 },
  { card: [nK, rR, nK], ctx: ["ghar", "school"], look: 2 },
  { card: [rK, nR, nR], ctx: ["ghar", "school"], look: 2 },
  { card: [nK, rK, nR], ctx: ["ghar", "school"], look: 2 },
  { card: [nR, nK, rK, nR], ctx: ["ghar", "school"], look: 3 },
  { card: [rR, nK, nR, nK], ctx: ["ghar", "school"], look: 3 },
  { card: [nK, rR, nK, nR], ctx: ["ghar", "school"], look: 3 },
  { card: [rK, nR, rR, nK], ctx: ["ghar", "school"], look: 3 },
];

// ───────────────────────────── params, state ─────────────────────────────
export interface BadlaavParams {
  goal: BadlaavGoal;
  /** the scaffold (fade): 1 the fewest items on the card; 3 the most */
  look: Look;
  /** the row of the goal's table (everything the level starts with is that row's own) */
  row: number;
  /** the context drawn (one the row allows) */
  scene: string;
  /** scene value, no fact claimed: the seed of the order the card's items stand in */
  lay: number;
}
export interface BadW {
  /** the card's item in front of the child (the jang card is one bench: always 0) */
  next: number;
  /** what each item ended as ("" not yet) */
  res: string[];
  /** palat (nishaan, ulta): the change has been run; ulta: the undo tries, and whether it came back */
  ran: boolean; tried: number; back: boolean;
  /** ghol: where the solid was put ("" not yet, "tawa", "water") and its steps over */
  at: string; step: number;
  /** trikon: the wood is in, the lid is on, the glow (0 out, 1 dim, 2 burning, 3 burning strongly) */
  fuel: boolean; lid: boolean; glow: number;
  /** raakh: pieces burnt, a closer look taken, where each product was said to go ("" not yet) */
  burnt: number; looked: boolean; placed: string[];
  /** jang: each piece's place ("" not yet), its rust, the days gone */
  where: string[]; rust: number[]; day: number;
}
export interface BadState extends Undoable<BadState> {
  w: BadW;
  /** the law's last answer for the view ("" when the last act just happened) */
  why: string;
  /** the item (jang: the piece) the last act was about, else −1 */
  at: number;
  /** the tool, mark or bin of the last act */
  m: string;
  /** a mal-rule consequence already shown on this level (each fires once) */
  seen: string[];
  done: boolean; acts: number;
}

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
export const modeOfGoal = (g: string): BadlaavMode | null => (BADLAAV_MODES.find((m) => (GOALS_OF[m] as readonly string[]).includes(g)) ?? null);
type AnyRow = { card: readonly unknown[]; ctx: readonly string[]; look: Look };
const rowsOf = (goal: BadlaavGoal): readonly AnyRow[] =>
  goal === "nishaan" ? NISHAAN_ROWS : goal === "ulta" ? ULTA_ROWS : goal === "ghol" ? GHOL_ROWS : goal === "trikon" ? TRIKON_ROWS : goal === "raakh" ? RAAKH_ROWS : JANG_ROWS;
/** a seeded order (the lay) of n things: the same for a level every time */
function order(n: number, lay: number): number[] {
  const rnd = mulberry32(lay + 29), ix = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [ix[i], ix[k]] = [ix[k], ix[i]]; }
  return ix;
}
/** the card's items in the order they stand (trikon's and raakh's cards keep the row's order: it is the card's story) */
export function cardOf(p: BadlaavParams): readonly unknown[] {
  const row = rowsOf(p.goal)[p.row];
  if (p.goal === "trikon" || p.goal === "raakh") return row.card;
  return order(row.card.length, p.lay).map((i) => row.card[i]);
}
export const changesOf = (p: BadlaavParams) => cardOf(p) as ChangeId[];
export const solidsOf = (p: BadlaavParams) => cardOf(p) as SolidId[];
export const firesOf = (p: BadlaavParams) => cardOf(p) as Fire[];
export const burnsOf = (p: BadlaavParams) => cardOf(p) as Burn[];
export const ironsOf = (p: BadlaavParams) => cardOf(p) as Iron[];
export const isChanges = (p: BadlaavParams) => p.goal === "nishaan" || p.goal === "ulta";
/** the item in front of the child (clamped to the card) */
export const itemAt = (p: BadlaavParams, w: BadW) => cardOf(p)[Math.min(w.next, cardOf(p).length - 1)];
/** the sigri's state at the start of a card item */
function fireStart(f: Fire): Pick<BadW, "fuel" | "lid" | "glow"> { return { fuel: true, lid: f.lid, glow: GLOW0 }; }
/** the tools on the sigri's bench for an item (no lid on a "no lid" item) */
export function fireTools(f: Fire): string[] { return f.want === "nolid" ? ["fuel", "fan"] : ["fuel", "lid", "fan"]; }

// ───────────────────────────── validate, init ─────────────────────────────
function validate(level: PlayLevel<unknown>): PlayLevel<BadlaavParams> | null {
  const p = level.params as Partial<BadlaavParams> | null;
  if (!p || !BADLAAV_MODES.includes(level.mode as BadlaavMode)) return null;
  const mode = level.mode as BadlaavMode;
  if (!(GOALS_OF[mode] as readonly string[]).includes(p.goal as string)) return null;
  const goal = p.goal as BadlaavGoal, look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || !isInt(p.row) || !isInt(p.lay) || p.lay < 0 || p.lay > 9999 || typeof p.scene !== "string") return null;
  const r = rowsOf(goal)[p.row];
  if (!r || r.look !== look || !r.ctx.includes(p.scene)) return null;
  return { ...level, params: { goal, look, row: p.row, scene: p.scene, lay: p.lay } } as PlayLevel<BadlaavParams>;
}
function initW(p: BadlaavParams): BadW {
  const n = cardOf(p).length, f = p.goal === "trikon" ? fireStart(firesOf(p)[0]) : { fuel: true, lid: false, glow: GLOW0 };
  return {
    next: 0, res: Array(p.goal === "jang" ? 1 : n).fill(""), ran: false, tried: 0, back: false, at: "", step: 0, ...f,
    burnt: 0, looked: false, placed: PRODUCTS.map(() => ""), where: p.goal === "jang" ? Array(n).fill("") : [], rust: p.goal === "jang" ? Array(n).fill(0) : [], day: 0,
  };
}
/** the world for the card's next item (what carries over: the results so far) */
function nextItem(p: BadlaavParams, w: BadW, result: string): BadW {
  const res = w.res.slice(); res[w.next] = result;
  const next = w.next + 1, fresh = initW(p);
  const f = p.goal === "trikon" && next < firesOf(p).length ? fireStart(firesOf(p)[next]) : {};
  return { ...fresh, ...f, next, res };
}
function init(level: PlayLevel<BadlaavParams>): BadState {
  return { w: initW(level.params), why: "", at: -1, m: "", seen: [], done: false, acts: 0, prev: null, depth: 0 };
}
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── apply (THE LAW) ─────────────────────────────
type Out = { state: BadState; moments: Moment[]; refused?: string };
function toolOf(a: BadlaavAct): string {
  switch (a.kind) {
    case "use": return a.m;
    case "mark": return a.s;
    case "file": return a.bin;
    case "put": return a.to;
    case "place": return `${a.p}:${a.to}`;
    default: return a.kind;
  }
}
function apply(level: PlayLevel<BadlaavParams>, s: BadState, act: BadlaavAct, seq: number): Out {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const tool = toolOf(act);
  if (s.acts === 0) out.push(mom("first_act", seq, { act: tool }));
  const w = s.w;
  const at = p.goal !== "jang" ? w.next : act.kind === "put" ? act.at : act.kind === "use" && isInt(act.at) ? act.at : -1;
  const bump = (st: BadState): BadState => ({ ...st, acts: s.acts + 1 });
  /** a mal-rule's consequence (only when this level maps it; once per level), else the law's plain answer */
  const mal = (id: string, f: Facts, why: string): Moment => (!(id in level.mal) || s.seen.includes(id) ? mom("law_refused", seq, { ...f, why }) : mom("misconception_consequence", seq, f, id));
  /** refused: the state stays (only the law's answer for the view changes) */
  const no = (code: string, moment?: Moment): Out => {
    const m = moment ?? mom("law_refused", seq, { why: code, tool });
    out.push(m);
    const seen = m.kind === "misconception_consequence" && m.misconceptionId ? [...s.seen, m.misconceptionId] : s.seen;
    return { state: bump({ ...s, why: code, at, m: tool, seen }), moments: out, refused: code };
  };
  /** accepted: a new world (undoable) */
  const ok = (w2: BadW, f: Facts = {}): Out => {
    const done = w2.next >= items(p);
    out.push(mom(done ? "solved" : "progress", seq, { tool, ...f }));
    return { state: bump(pushUndo(s, { ...s, w: w2, why: "", at, m: tool, done })), moments: out };
  };
  if (act.kind === "done" && p.goal !== "ghol" && p.goal !== "raakh") return no("no_claim");

  switch (p.goal) {
    // ── nishaan: run it, then mark a sign it showed, or "nothing new" ──
    case "nishaan": {
      const id = itemAt(p, w) as ChangeId, c = changeOf(id), f: Facts = { change: id };
      if (act.kind === "run") return w.ran ? no("ran") : ok({ ...w, ran: true }, f);
      if (act.kind !== "mark") return no("unknown_act");
      if (!w.ran) return no("not_run");
      if (act.s === "same") {
        if (c.kind === "physical") return ok(nextItem(p, w, "physical"), { ...f, mark: "same" });
        return no("look_new", mom("law_refused", seq, { ...f, why: "look_new" }));
      }
      if (!(SIGNS as readonly string[]).includes(act.s)) return no("no_mark");
      if (c.kind === "chemical" && (c.signs ?? []).includes(act.s as Sign)) return ok(nextItem(p, w, "chemical"), { ...f, mark: act.s });
      // a change of state marked as making something new (it only looks different)
      if (c.kind === "physical" && c.state) return no("looks_new", mal("looks-new", { ...f, mark: act.s }, "looks_new"));
      return no("not_seen", mom("law_refused", seq, { ...f, mark: act.s, why: "not_seen" }));
    }
    // ── ulta: run it, try to undo it, then say what happened ──
    case "ulta": {
      const id = itemAt(p, w) as ChangeId, c = changeOf(id), f: Facts = { change: id };
      if (act.kind === "run") return w.ran ? no("ran") : ok({ ...w, ran: true }, f);
      if (act.kind === "use") {
        if (act.m !== "cool" && act.m !== "warm") return no("no_tool");
        if (!w.ran) return no("not_run");
        if (w.back) return no("back_already");
        const back = c.kind === "physical" && c.undo === act.m;
        return ok({ ...w, tried: w.tried + 1, back }, { ...f, back: back ? "yes" : "no" });
      }
      if (act.kind !== "file") return no("unknown_act");
      if (!w.ran) return no("not_run");
      if (!w.tried) return no("not_tried");
      const bin = act.bin;
      if (bin === "back") {
        if (w.back) return ok(nextItem(p, w, "back"), { ...f, bin });
        // "it came back" of a change that can come back but has not yet
        if (c.kind === "physical" && c.undo) return no("not_back", mom("law_refused", seq, { ...f, bin, why: "not_back" }));
        // "it came back" of a change that does not come back (a cooked egg cooled, curd, torn paper)
        return no("stays", mal("undo-all", { ...f, bin }, "stays"));
      }
      if (bin !== "same" && bin !== "new") return no("no_bin");
      if (w.back) return no("is_back");
      if (bin === "same") {
        if (c.kind === "physical" && !c.undo) return ok(nextItem(p, w, "same"), { ...f, bin });
        if (c.kind === "physical") return no("can_back", mom("law_refused", seq, { ...f, bin, why: "can_back" }));
        return no("same_no", mom("law_refused", seq, { ...f, bin, why: "same_no" }));
      }
      if (c.kind === "chemical") return ok(nextItem(p, w, "new"), { ...f, bin });
      if (c.state) return no("looks_new", mal("looks-new", { ...f, bin }, "looks_new"));
      return no("still_paper", mom("law_refused", seq, { ...f, bin, why: "still_paper" }));
    }
    // ── ghol: heat or a liquid; then a wait or a stir a step; Done (or "Gone!") ──
    case "ghol": {
      const id = itemAt(p, w) as SolidId, needs = SOLIDS[id], f: Facts = { solid: id };
      if (act.kind === "put") {
        if (act.to !== "tawa" && act.to !== "water") return no("no_place");
        if (w.at) return no("put_already");
        if (needs === "melt" && act.to === "water") return no("needs_heat", mom("law_refused", seq, { ...f, to: act.to, why: "needs_heat" }));
        // sugar or salt put on the warm tawa, to make it melt: dissolving needs a liquid, not heat
        if (needs === "dissolve" && act.to === "tawa") return no("needs_liquid", mal("sugar-melts", { ...f, to: act.to }, "needs_liquid"));
        return ok({ ...w, at: act.to }, { ...f, to: act.to });
      }
      if (act.kind === "use") {
        if (act.m === "gone") {
          if (!w.at) return no("put_first");
          // "Gone!" of sugar or salt spreading into the water: the scale reads what it did once it went in
          if (w.at === "water" && w.step > 0) return no("still_there", mal("gone", { ...f, step: w.step }, "still_there"));
          return no(w.at === "water" ? "not_stirred" : "in_view");
        }
        if (act.m !== "wait" && act.m !== "stir") return no("no_tool");
        if (!w.at) return no("put_first");
        if (act.m === "stir" && w.at === "tawa") return no("no_water");
        if (act.m === "wait" && w.at === "water") return no("stir_it");
        if (w.step >= STEPS) return no("over");
        return ok({ ...w, step: w.step + 1 }, { ...f, step: w.step + 1 });
      }
      if (act.kind !== "done") return no("unknown_act");
      if (!w.at) return no("put_first");
      if (w.step < STEPS) return no("not_yet");
      return ok(nextItem(p, w, needs === "melt" ? "melted" : "dissolved"), f);
    }
    // ── trikon: take a side away or give it more; the item is met the moment the fire is as asked ──
    case "trikon": {
      const fire = itemAt(p, w) as Fire, f: Facts = { want: fire.want };
      if (act.kind !== "use") return no("unknown_act");
      const met = (w2: BadW) => (fire.want === "strong" ? w2.glow === 3 : w2.glow === 0 && (fire.want !== "keep" || w2.fuel));
      const take = (w2: BadW, g: Facts) => (met(w2) ? ok(nextItem(p, w2, "met"), { ...f, ...g }) : ok(w2, { ...f, ...g }));
      switch (act.m) {
        case "fuel":
          if (!w.fuel) return no("no_wood");
          if (fire.want === "keep") return no("keep_wood");
          return take({ ...w, fuel: false, glow: 0 }, { glow: 0 });
        case "lid":
          if (fire.want === "nolid") return no("no_lid");
          if (w.lid) return no("lid_already");
          return take({ ...w, lid: true }, { lid: "on" });
        case "unlid":
          if (!w.lid) return no("lid_off");
          return take({ ...w, lid: false }, { lid: "off" });
        case "fan":
          if (w.glow === 0) return no("out");
          // the sigri fanned with its lid on: the fan's air cannot reach the fuel (fanning sends air, not heat)
          if (w.lid) return no("lid_air", mal("fan-heat", { ...f, lid: "on" }, "lid_air"));
          if (w.glow === 3) return no("strong_already");
          return take({ ...w, glow: 3 }, { glow: 3 });
        case "wait":
          // under the lid the air inside is used up a wait at a time; with air, nothing to wait for
          if (!w.lid || w.glow === 0) return no("nothing_changes");
          return take({ ...w, glow: w.glow - 1 }, { glow: w.glow - 1 });
      }
      return no("no_tool");
    }
    // ── raakh: a piece burns a wait; look closely at the air; say where each went; Done ──
    case "raakh": {
      const b = itemAt(p, w) as Burn, f: Facts = { fuel: b.fuel };
      if (act.kind === "use") {
        if (act.m === "wait") return w.burnt >= b.k ? no("burnt_all") : ok({ ...w, burnt: w.burnt + 1 }, { ...f, burnt: w.burnt + 1 });
        if (act.m === "look") {
          if (!w.burnt) return no("nothing_yet");
          if (w.looked) return no("looked");
          return ok({ ...w, looked: true }, { ...f, looked: "yes" });
        }
        return no("no_tool");
      }
      if (act.kind === "place") {
        const i = (PRODUCTS as readonly string[]).indexOf(act.p);
        if (i < 0 || (act.to !== "air" && act.to !== "left")) return no("no_place");
        const pr = PRODUCTS[i];
        if (!w.burnt || (!SEEN[pr] && !w.looked)) return no("not_found");
        if (w.placed[i]) return no("placed");
        if (GOES[pr] !== act.to) return no("wrong_place", mom("law_refused", seq, { ...f, product: pr, to: act.to, why: "wrong_place" }));
        const placed = w.placed.slice(); placed[i] = act.to;
        return ok({ ...w, placed }, { ...f, product: pr, to: act.to });
      }
      if (act.kind !== "done") return no("unknown_act");
      if (w.burnt < b.k) return no("still_fuel");
      // Done once the fuel is gone, without looking for what went into the air: it is not destroyed
      if (!w.looked) return no("into_air", mal("vanished", { ...f, placed: w.placed.filter((x) => x).length }, "into_air"));
      if (w.placed.some((x) => !x)) return no("not_all");
      return ok(nextItem(p, w, "found"), f);
    }
    // ── jang: put each piece somewhere; another day; rust only where there is water as well as air ──
    case "jang": {
      const irons = ironsOf(p);
      if (act.kind === "put") {
        if (!isInt(act.at) || act.at < 0 || act.at >= irons.length) return no("no_piece");
        if (!(PLACES as readonly string[]).includes(act.to)) return no("no_place");
        if (w.where[act.at] === act.to) return no("there_already");
        const where = w.where.slice(); where[act.at] = act.to;
        return ok({ ...w, where }, { piece: act.at, to: act.to });
      }
      if (act.kind !== "use") return no("unknown_act");
      if (act.m === "wipe") {
        if (!isInt(act.at) || act.at < 0 || act.at >= irons.length) return no("no_piece");
        if (!w.rust[act.at]) return no("clean");
        // rust wiped as if it were dirt: it is a new substance, and it needed oxygen and water
        return no("not_dirt", mal("just-dirt", { piece: act.at, rust: w.rust[act.at] }, "not_dirt"));
      }
      if (act.m !== "day") return no("no_tool");
      if (w.where.some((x) => !x)) return no("place_all");
      if (w.day >= DAYMAX) return no("enough");
      const rust = w.rust.map((r, i) => (WATER[w.where[i] as Place] ? Math.min(r + 1, DAYMAX) : r)), day = w.day + 1;
      const met = day >= DAYS && irons.every((x, i) => (x.want === "rust" ? rust[i] >= RUSTED : rust[i] === 0));
      const w2 = { ...w, rust, day };
      return ok(met ? { ...w2, next: 1, res: ["met"] } : w2, { day });
    }
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<BadlaavParams>, s: BadState) => s.done;

// ───────────────────────────── solve, shortcut, malActs ─────────────────────────────
const U = (m: string, at?: number): BadlaavAct => (at === undefined ? { kind: "use", m } : { kind: "use", m, at });
const D: BadlaavAct = { kind: "done" };
const RUN: BadlaavAct = { kind: "run" };
const MARK = (s: string): BadlaavAct => ({ kind: "mark", s });
const FILE = (bin: string): BadlaavAct => ({ kind: "file", bin });
const PUT = (at: number, to: string): BadlaavAct => ({ kind: "put", at, to });
const PLACE = (p: string, to: string): BadlaavAct => ({ kind: "place", p, to });
const run = (level: PlayLevel<BadlaavParams>, acts: BadlaavAct[]) => { let s = init(level); for (const a of acts) s = apply(level, s, a, 1).state; return s; };
const times = (n: number, a: BadlaavAct): BadlaavAct[] => Array.from({ length: n }, () => a);
/** the law's own accepted acts for card item i */
function planItem(p: BadlaavParams, i: number): BadlaavAct[] {
  switch (p.goal) {
    case "nishaan": { const c = changeOf(changesOf(p)[i]); return [RUN, MARK(c.kind === "physical" ? "same" : (c.signs as readonly Sign[])[0])]; }
    case "ulta": {
      const c = changeOf(changesOf(p)[i]);
      return [RUN, U(c.kind === "physical" && c.undo ? c.undo : "cool"), FILE(c.kind === "chemical" ? "new" : c.undo ? "back" : "same")];
    }
    case "ghol": { const melt = SOLIDS[solidsOf(p)[i]] === "melt"; return [PUT(0, melt ? "tawa" : "water"), ...times(STEPS, U(melt ? "wait" : "stir")), D]; }
    case "trikon": {
      const f = firesOf(p)[i];
      if (f.want === "strong") return [...(f.lid ? [U("unlid")] : []), U("fan")];
      if (f.want === "keep") return [U("lid"), ...times(GLOW0, U("wait"))];
      return [U("fuel")];
    }
    case "raakh": { const b = burnsOf(p)[i]; return [...times(b.k, U("wait")), U("look"), ...PRODUCTS.map((x) => PLACE(x, GOES[x])), D]; }
    case "jang": return [...ironsOf(p).map((x, j) => PUT(j, x.want === "rust" ? "damp" : "dry")), ...times(DAYS, U("day"))];
  }
}
const planUpTo = (p: BadlaavParams, upTo: number) => Array.from({ length: upTo }, (_, i) => planItem(p, i)).flat();
const items = (p: BadlaavParams) => (p.goal === "jang" ? 1 : cardOf(p).length);
function solve(level: PlayLevel<BadlaavParams>): BadlaavAct[] | null {
  const acts = planUpTo(level.params, items(level.params));
  return run(level, acts).done ? acts : null;
}
/** idea-free play: one mark, one bin, one place or one tool for every item; Done at once; every tool in turn */
function shortcut(level: PlayLevel<BadlaavParams>): BadlaavAct[] | null {
  const p = level.params, n = cardOf(p).length, tries: BadlaavAct[][] = [];
  const each = (f: (i: number) => BadlaavAct[]) => Array.from({ length: n }, (_, i) => f(i)).flat();
  switch (p.goal) {
    case "nishaan": for (const m of [...SIGNS, "same"]) tries.push(each(() => [RUN, MARK(m)])); break;
    case "ulta": for (const b of ["back", "same", "new"]) for (const t of [[U("cool")], [U("warm")], [U("cool"), U("warm")]]) tries.push(each(() => [RUN, ...t, FILE(b)])); break;
    case "ghol": for (const to of ["tawa", "water"]) tries.push(each(() => [PUT(0, to), ...times(STEPS, U("wait")), ...times(STEPS, U("stir")), D])); break;
    case "trikon": {
      const tools = ["fuel", "lid", "unlid", "fan", "wait"];
      for (const m of tools) tries.push(times(12, U(m)));
      tries.push(tools.flatMap((m) => times(4, U(m))));
      break;
    }
    case "raakh": for (const to of ["air", "left"]) tries.push(each(() => [...times(6, U("wait")), U("look"), ...PRODUCTS.map((x) => PLACE(x, to)), D])); tries.push([D], each(() => [...times(6, U("wait")), D])); break;
    case "jang": for (const to of PLACES) tries.push([...ironsOf(p).map((_, j) => PUT(j, to)), ...times(DAYMAX, U("day"))]); break;
  }
  for (const t of tries) if (run(level, t).done) return t;
  return null;
}
function malActs(level: PlayLevel<BadlaavParams>, malId: string): BadlaavAct[] | null {
  const p = level.params;
  const first = (pred: (x: unknown) => boolean) => cardOf(p).findIndex(pred);
  switch (malId) {
    case "looks-new": {
      if (!isChanges(p)) return null;
      const i = first((x) => !!changeOf(x as ChangeId).state);
      if (i < 0) return null;
      const c = changeOf(changesOf(p)[i]);
      // nishaan: "it looks different" marked as a change of colour; ulta: undone the wrong way, then said to be new
      return p.goal === "nishaan" ? [...planUpTo(p, i), RUN, MARK("colour")] : [...planUpTo(p, i), RUN, U(c.undo === "cool" ? "warm" : "cool"), FILE("new")];
    }
    case "undo-all": {
      if (p.goal !== "ulta") return null;
      const i = first((x) => !changeOf(x as ChangeId).undo);
      return i < 0 ? null : [...planUpTo(p, i), RUN, U("cool"), FILE("back")];
    }
    case "sugar-melts": case "gone": {
      if (p.goal !== "ghol") return null;
      const i = first((x) => SOLIDS[x as SolidId] === "dissolve");
      if (i < 0) return null;
      return malId === "sugar-melts" ? [...planUpTo(p, i), PUT(0, "tawa")] : [...planUpTo(p, i), PUT(0, "water"), U("stir"), U("gone")];
    }
    case "fan-heat": {
      if (p.goal !== "trikon") return null;
      const i = first((x) => (x as Fire).want === "strong");
      if (i < 0) return null;
      return [...planUpTo(p, i), ...(firesOf(p)[i].lid ? [] : [U("lid")]), U("fan")];
    }
    case "vanished": {
      if (p.goal !== "raakh") return null;
      return [...times(burnsOf(p)[0].k, U("wait")), PLACE("smoke", "air"), PLACE("ash", "left"), D];
    }
    case "just-dirt": {
      if (p.goal !== "jang") return null;
      const irons = ironsOf(p), i = irons.findIndex((x) => x.want === "rust");
      if (i < 0) return null;
      return [...irons.map((x, j) => PUT(j, x.want === "rust" ? "damp" : "dry")), ...times(RUSTED, U("day")), U("wipe", i)];
    }
  }
  return null;
}

// ───────────────────────────── generate ─────────────────────────────
interface BadlaavGrammar { scenes?: string[] }
const JITTER = 0.24;
function difficultyOf(p: BadlaavParams, steps: number): number {
  return Math.max(0, Math.min(1, 0.2 + 0.012 * (steps - 6) + 0.1 * (p.look - 1)));
}
function generate(req: GenRequest): Candidate<BadlaavParams>[] {
  const mode = (BADLAAV_MODES.includes(req.mode as BadlaavMode) ? req.mode : "palat") as BadlaavMode;
  const goals = GOALS_OF[mode] as readonly BadlaavGoal[];
  const goal = (goals.includes(req.goal as BadlaavGoal) ? req.goal : goals[0]) as BadlaavGoal;
  const g = req.grammar as BadlaavGrammar, rnd = mulberry32(req.seed);
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as Look;
  const scenes = Array.isArray(g.scenes) && g.scenes.length ? g.scenes : null;
  const rows: { row: number; scene: string }[] = [];
  rowsOf(goal).forEach((r, i) => { if (r.look === look) for (const ctx of r.ctx) if (!scenes || scenes.includes(ctx)) rows.push({ row: i, scene: ctx }); });
  // the seed orders the rows (the picker's band and the nudge below then choose among them)
  for (let i = rows.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [rows[i], rows[k]] = [rows[k], rows[i]]; }
  const out: Candidate<BadlaavParams>[] = [];
  for (const { row, scene } of rows) {
    const params: BadlaavParams = { goal, look, row, scene, lay: Math.floor(rnd() * 10000) };
    const sig = `${mode}:${goal}:${row}:${scene}`;
    const level = {
      v: "play@1", levelId: `badlaav-${sig}-${req.seed}`.replace(/[^a-z0-9:=+._-]/gi, "_"), family: "badlaav", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: scene, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    } as PlayLevel<BadlaavParams>;
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
/** the words that would give the idea away are never said first (the teacher's line waits for the child's act) */
const HIDDEN: Record<BadlaavGoal, string[]> = {
  nishaan: ["new substance", "nayi cheez", "chemical", "physical", "only its state"],
  ulta: ["cannot be reversed", "wapas nahi", "still paper", "new substance", "nayi cheez"],
  ghol: ["dissolves", "ghulta", "needs heat", "still there", "still has mass"],
  trikon: ["oxygen", "cuts off", "more air", "zyada hawa"],
  raakh: ["carbon dioxide", "water vapour", "into the air", "not destroyed"],
  jang: ["needs water", "oxygen and water", "paani chahiye", "not dirt"],
};
export function badlaavHidden(level: PlayLevel<unknown>): string[] {
  try { const v = validate(level); return v ? [...HIDDEN[v.params.goal]] : []; } catch { return []; }
}
function facts(level: PlayLevel<BadlaavParams>, s: BadState): Facts {
  const p = level.params, w = s.w, f: Facts = { goal: p.goal, of: items(p), next: Math.min(w.next, items(p)) };
  switch (p.goal) {
    case "nishaan": case "ulta": f.change = String(itemAt(p, w)); f.ran = w.ran ? "yes" : "no"; if (p.goal === "ulta") f.back = w.back ? "yes" : "no"; break;
    case "ghol": f.solid = String(itemAt(p, w)); f.at = w.at || "none"; f.step = w.step; break;
    case "trikon": f.want = (itemAt(p, w) as Fire).want; f.glow = w.glow; f.lid = w.lid ? "on" : "off"; f.wood = w.fuel ? "in" : "out"; break;
    case "raakh": f.fuel = (itemAt(p, w) as Burn).fuel; f.burnt = w.burnt; f.looked = w.looked ? "yes" : "no"; f.placed = w.placed.filter((x) => x).length; break;
    case "jang": f.day = w.day; f.rusty = w.rust.filter((r) => r > 0).length; break;
  }
  if (s.why) f.why = s.why;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<BadlaavParams>, s: BadState) {
  const p = level.params;
  return { title: "Badlaav", lines: [`card: ${JSON.stringify(cardOf(p))}`, ...Object.entries(s.w).map(([k, v]) => `${k}: ${JSON.stringify(v)}`)] };
}
function grade(level: PlayLevel<BadlaavParams>, acts: PlayActEnvelope<BadlaavAct>[]): PlayGrade {
  return gradeLevel(badlaavLogic, level, acts, {
    decisiveRefusals: ["look_new", "not_seen", "looks_new", "not_back", "stays", "can_back", "same_no", "still_paper", "needs_heat", "needs_liquid", "still_there", "lid_air", "wrong_place", "into_air", "not_dirt"], final: true,
  });
}

export const badlaavLogic: FamilyLogic<BadlaavParams, BadState, BadlaavAct> = {
  family: "badlaav", modes: BADLAAV_MODES, malRules: BADLAAV_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
