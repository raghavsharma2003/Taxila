// Rang (रंग, "colour") · round 7, acids, bases, indicators and neutralisation (class 7 science, c7-science-ch02). A dropper the
// child works a drop at a time. Nothing here runs on a clock: a drop lands, a cup is sorted or a glass is claimed only when the
// child taps, and the law answers each act at once.
//
// pehchaan (natural indicators, ch02-t01). A row of cups of the kit's own household liquids. The child drops a drop from a cup
//   onto an indicator, sees the colour it gives, and sorts the cup acidic, basic or neutral by its colours. A sort is taken
//   only when the colours seen so far leave one kind (a guess between two is refused, never marked right).
//   litmus (s2) blue and red litmus strips: an acid turns blue litmus red, a base turns red litmus blue, neutral changes
//                neither (so a neutral liquid needs both strips).
//   desi   (s3) turmeric (haldi) paper and hibiscus (gudhal) water: turmeric turns red in a base and stays yellow in acidic
//                and neutral liquids; hibiscus turns dark pink in an acid, green in a base and keeps its own colour in a
//                neutral one. At looks 2 and 3 the gudhal water is short (a scene value: one drop for each cup that is not a
//                base), so turmeric must find the bases first (the kit's own way: haldi paper first, then gudhal water).
// milao (neutralisation, ch02-t02). Hibiscus water in an acid is pink. The child adds a base a drop at a time: the pink fades,
//   goes (neutral), and turns green once there is extra base. The drops a glass takes are scene values (no fact claimed).
//   boond  (s2, s1) baking soda solution dropped into lemon juice or vinegar: "Done" when the pink has gone (or, at look 3, on
//                a card item asking for green, once it is green). Plain water is on the bench too: it only dilutes.
//   ilaaj  (s3, s1) the kit's uses: an ant bite's formic acid with baking soda, too much stomach acid with an antacid (milk of
//                magnesia), acidic soil with lime (chuna). Each case's sample, with hibiscus water, is pink; the bench holds
//                the case's own base, lemon juice (an acid: the pink stays) and plain water (it only dilutes).
//   In both, once a base has gone in, the glass is labelled with what neutralisation forms: a salt and water, heat given out.
//
// The CHILD's beliefs (mal-rules; each mapped to the topic's own kit misconception, a deterministic act list with its own
// consequence):
//   made-red   (t01 m3) a base sorted as acidic because turmeric went red on it (red read as "the indicator made it acid"):
//                       gudhal says the same liquid is basic too; the drop only showed what it already was
//   own-red    (t01 m3) a neutral liquid sorted as acidic on red litmus alone: the strip was red before the drop; blue litmus
//                       stays blue for it too
//   water-only (t02 m2) "Done" on a pink glass after plain water went in: water only dilutes; it stays pink, acidic
//   too-much   (t02 m3) "Done" for no pink after more base than it needed: it has turned green, basic
//   harm-mix   (t02 m1) the claim "Harmful!" ("Yeh nuksaan karega") once a base has gone into the acid: the label shows what forms, a salt and water (heat
//                       given out); nothing harmful is drawn
// Not admitted (by the lead's ruling, the teacher's lines, never a mechanic): t01 m1 (acids are dangerous and burn), t01 m2
// (tasting is fine; acids taste sour), t01 m4 (bases are always safe). No act here tastes, touches or drinks anything.
// Every colour and every liquid is the kit's (KIT_OF; tests/r7-games-rang.test.mjs reads them out of data/kits/c7-science.json);
// every number here is a scene value with no fact claimed.
import type { Candidate, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, RangAct } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export const RANG_MODES = ["pehchaan", "milao"] as const;
export type RangMode = (typeof RANG_MODES)[number];
export const GOALS_OF = { pehchaan: ["litmus", "desi"], milao: ["boond", "ilaaj"] } as const;
export type RangGoal = (typeof GOALS_OF)[RangMode][number];
export const RANG_MAL = ["made-red", "own-red", "water-only", "too-much", "harm-mix"] as const;

/** the kit's own sentences each law rests on (tests read them out of data/kits/c7-science.json) */
export const KIT_OF: Record<string, Record<string, string>> = {
  "c7-science-ch02-t01": {
    "an indicator": "An indicator is a substance that shows a different colour in acidic and in basic solutions",
    "litmus": "acids turn blue litmus red; bases turn red litmus blue; neutral solutions change neither",
    "turmeric": "Turmeric turns red in a base such as soap solution and stays yellow in acidic and neutral solutions",
    "hibiscus": "Hibiscus (china rose) extract turns dark pink or magenta in acids and green in bases",
    "hibiscus in neutral": "no change from its own colour means neutral",
    "haldi first": "Put a drop on haldi paper: if it turns red, the liquid is basic. If it stays yellow, it is acidic or neutral, so test with gudhal water",
    "the neutral liquids": "Solutions that are neither acidic nor basic, like pure water, sugar solution and common salt solution, are neutral",
    "the sorted liquids": "Acidic: lemon juice and vinegar (turn blue litmus red, hibiscus pink). Basic: soap solution and baking soda solution (turn red litmus blue, turmeric red, hibiscus green)",
    "only showed it": "The lemon juice was already acidic; the litmus only showed it",
    "two indicators": "Test the same lemon juice twice with two different indicators",
  },
  "c7-science-ch02-t02": {
    "neutralisation": "When an acid and a base are mixed in the right amounts, they cancel each other's effect; this is called neutralisation",
    "what forms": "Neutralisation forms a salt and water, and heat is given out",
    "the pink goes": "hibiscus water that is pink in an acid loses its pink as a base is added, and turns green once there is extra base",
    "water dilutes": "Adding water only dilutes an acid; it stays acidic. A base is needed to neutralise it",
    "the uses": "antacids (mild bases such as milk of magnesia) for too much stomach acid; baking soda on an ant bite (ants inject formic acid); lime (chuna) on acidic soil",
    "lemon is an acid": "lemon juice is itself an acid and would not neutralise it",
    "into lemon juice": "Add a few drops of hibiscus water to some lemon juice: it turns pink. Now add baking soda solution little by little",
    "vinegar": "Meera carefully adds a base to vinegar",
    "plain water": "Adding plain water to an acid neutralises it",
  },
};

// ───────────────────────────── the bench (the kit's liquids and indicators) ─────────────────────────────
export type Kind = "acid" | "base" | "neutral";
export const KINDS: readonly Kind[] = ["acid", "base", "neutral"];
/** the kit's household liquids and what each is (KIT_OF "the sorted liquids", "the neutral liquids") */
export const LIQUIDS = { lemon: "acid", vinegar: "acid", soap: "base", soda: "base", water: "neutral", sugar: "neutral", salt: "neutral" } as const satisfies Record<string, Kind>;
export type Liquid = keyof typeof LIQUIDS;
export const INDS = ["blue", "red", "haldi", "gudhal"] as const;
export type Ind = (typeof INDS)[number];
export type Colour = "red" | "blue" | "yellow" | "pink" | "green" | "own";
/** the colour an indicator shows for a kind (KIT_OF "litmus", "turmeric", "hibiscus", "hibiscus in neutral") */
export function colourOf(ind: Ind, kind: Kind): Colour {
  switch (ind) {
    case "blue": return kind === "acid" ? "red" : "blue";
    case "red": return kind === "base" ? "blue" : "red";
    case "haldi": return kind === "base" ? "red" : "yellow";
    case "gudhal": return kind === "acid" ? "pink" : kind === "base" ? "green" : "own";
  }
}
/** the indicator's own colour before any drop */
export const OWN: Record<Ind, Colour> = { blue: "blue", red: "red", haldi: "yellow", gudhal: "own" };
const bit = (ind: Ind) => 1 << INDS.indexOf(ind);
export const tested = (mask: number, ind: Ind) => (mask & bit(ind)) !== 0;
/** the kinds the colours seen so far still allow */
export function fits(liq: Liquid, mask: number): Kind[] {
  const truth = LIQUIDS[liq];
  return KINDS.filter((k) => INDS.every((ind) => !tested(mask, ind) || colourOf(ind, k) === colourOf(ind, truth)));
}

// milao: the acids in the glass, the bases on the bench, the kit's three uses
export type Acid = "lemon" | "vinegar";
export type Case = "ant" | "stomach" | "soil";
/** each use's own base, as the kit pairs them (KIT_OF "the uses") */
export const CASE_BASE: Record<Case, string> = { ant: "soda", stomach: "antacid", soil: "lime" };
export const BASES = ["soda", "antacid", "lime"] as const;
/** scene value, no fact claimed: drops of base past the right amount before the glass is full */
export const OVER = 3;
/** scene value, no fact claimed: drops of plain water a glass holds */
export const WATER_MAX = 3;
/** scene value, no fact claimed: drops of lemon juice a sample holds */
export const LEMON_MAX = 2;

// ───────────────────────────── the rows of each goal ─────────────────────────────
interface CupRow { cups: readonly Liquid[]; ctx: readonly string[]; look: 1 | 2 | 3 }
const LITMUS_ROWS: readonly CupRow[] = [
  { cups: ["lemon", "soap", "sugar"], ctx: ["rasoi", "lab"], look: 1 },
  { cups: ["vinegar", "soda", "salt"], ctx: ["rasoi", "lab"], look: 1 },
  { cups: ["lemon", "soda", "water"], ctx: ["rasoi", "lab"], look: 1 },
  { cups: ["vinegar", "soap", "sugar"], ctx: ["rasoi", "lab"], look: 1 },
  { cups: ["lemon", "vinegar", "soap", "sugar"], ctx: ["rasoi", "lab"], look: 2 },
  { cups: ["lemon", "soda", "soap", "salt"], ctx: ["rasoi", "lab"], look: 2 },
  { cups: ["vinegar", "soda", "water", "sugar"], ctx: ["rasoi", "lab"], look: 2 },
  { cups: ["lemon", "soap", "salt", "water"], ctx: ["rasoi", "lab"], look: 2 },
  { cups: ["lemon", "vinegar", "soap", "soda", "sugar"], ctx: ["rasoi", "lab"], look: 3 },
  { cups: ["lemon", "soap", "soda", "water", "salt"], ctx: ["rasoi", "lab"], look: 3 },
  { cups: ["vinegar", "lemon", "soda", "sugar", "salt"], ctx: ["rasoi", "lab"], look: 3 },
  { cups: ["lemon", "vinegar", "soap", "water", "salt"], ctx: ["rasoi", "lab"], look: 3 },
];
const DESI_ROWS: readonly CupRow[] = [
  { cups: ["lemon", "soap", "salt"], ctx: ["rasoi", "lab"], look: 1 },
  { cups: ["vinegar", "soda", "sugar"], ctx: ["rasoi", "lab"], look: 1 },
  { cups: ["lemon", "soda", "water"], ctx: ["rasoi", "lab"], look: 1 },
  { cups: ["vinegar", "soap", "salt"], ctx: ["rasoi", "lab"], look: 1 },
  { cups: ["lemon", "soap", "soda", "sugar"], ctx: ["rasoi", "lab"], look: 2 },
  { cups: ["vinegar", "soda", "salt", "lemon"], ctx: ["rasoi", "lab"], look: 2 },
  { cups: ["soap", "water", "vinegar", "soda"], ctx: ["rasoi", "lab"], look: 2 },
  { cups: ["lemon", "soap", "water", "sugar"], ctx: ["rasoi", "lab"], look: 2 },
  { cups: ["lemon", "soap", "soda", "vinegar", "salt"], ctx: ["rasoi", "lab"], look: 3 },
  { cups: ["soda", "sugar", "soap", "lemon", "water"], ctx: ["rasoi", "lab"], look: 3 },
  { cups: ["vinegar", "soap", "salt", "soda", "sugar"], ctx: ["rasoi", "lab"], look: 3 },
  { cups: ["soap", "lemon", "soda", "water", "vinegar"], ctx: ["rasoi", "lab"], look: 3 },
];
/** a glass: its acid, the drops of base it takes (a scene value, no fact claimed), and what the card asks for */
export interface Glass { acid: Acid; n: number; want: "neutral" | "green" }
interface BoondRow { card: readonly Glass[]; ctx: readonly string[]; look: 1 | 2 | 3 }
const BOOND_ROWS: readonly BoondRow[] = [
  { card: [{ acid: "lemon", n: 3, want: "neutral" }], ctx: ["rasoi", "lab"], look: 1 },
  { card: [{ acid: "vinegar", n: 4, want: "neutral" }], ctx: ["rasoi", "lab"], look: 1 },
  { card: [{ acid: "lemon", n: 5, want: "neutral" }], ctx: ["rasoi", "lab"], look: 1 },
  { card: [{ acid: "vinegar", n: 3, want: "neutral" }], ctx: ["rasoi", "lab"], look: 1 },
  { card: [{ acid: "lemon", n: 4, want: "neutral" }], ctx: ["rasoi", "lab"], look: 1 },
  { card: [{ acid: "lemon", n: 3, want: "neutral" }, { acid: "vinegar", n: 5, want: "neutral" }], ctx: ["rasoi", "lab"], look: 2 },
  { card: [{ acid: "vinegar", n: 4, want: "neutral" }, { acid: "lemon", n: 2, want: "neutral" }], ctx: ["rasoi", "lab"], look: 2 },
  { card: [{ acid: "lemon", n: 5, want: "neutral" }, { acid: "vinegar", n: 3, want: "neutral" }], ctx: ["rasoi", "lab"], look: 2 },
  { card: [{ acid: "vinegar", n: 2, want: "neutral" }, { acid: "lemon", n: 4, want: "neutral" }], ctx: ["rasoi", "lab"], look: 2 },
  { card: [{ acid: "lemon", n: 3, want: "neutral" }, { acid: "vinegar", n: 4, want: "green" }, { acid: "lemon", n: 5, want: "neutral" }], ctx: ["rasoi", "lab"], look: 3 },
  { card: [{ acid: "vinegar", n: 3, want: "neutral" }, { acid: "lemon", n: 4, want: "neutral" }, { acid: "vinegar", n: 2, want: "green" }], ctx: ["rasoi", "lab"], look: 3 },
  { card: [{ acid: "lemon", n: 4, want: "green" }, { acid: "vinegar", n: 3, want: "neutral" }, { acid: "lemon", n: 2, want: "neutral" }], ctx: ["rasoi", "lab"], look: 3 },
  { card: [{ acid: "vinegar", n: 5, want: "neutral" }, { acid: "lemon", n: 3, want: "green" }, { acid: "vinegar", n: 4, want: "neutral" }], ctx: ["rasoi", "lab"], look: 3 },
];
/** a use: its case and the drops of its base the sample takes (a scene value, no fact claimed) */
export interface Use { cse: Case; n: number }
interface IlaajRow { card: readonly Use[]; ctx: readonly string[]; look: 1 | 2 | 3 }
const ILAAJ_ROWS: readonly IlaajRow[] = [
  { card: [{ cse: "ant", n: 3 }], ctx: ["ghar", "khet"], look: 1 },
  { card: [{ cse: "stomach", n: 4 }], ctx: ["ghar", "khet"], look: 1 },
  { card: [{ cse: "soil", n: 3 }], ctx: ["ghar", "khet"], look: 1 },
  { card: [{ cse: "ant", n: 4 }], ctx: ["ghar", "khet"], look: 1 },
  { card: [{ cse: "soil", n: 5 }], ctx: ["ghar", "khet"], look: 1 },
  { card: [{ cse: "stomach", n: 2 }], ctx: ["ghar", "khet"], look: 1 },
  { card: [{ cse: "ant", n: 3 }, { cse: "soil", n: 4 }], ctx: ["ghar", "khet"], look: 2 },
  { card: [{ cse: "stomach", n: 3 }, { cse: "ant", n: 2 }], ctx: ["ghar", "khet"], look: 2 },
  { card: [{ cse: "soil", n: 4 }, { cse: "stomach", n: 3 }], ctx: ["ghar", "khet"], look: 2 },
  { card: [{ cse: "ant", n: 5 }, { cse: "stomach", n: 2 }], ctx: ["ghar", "khet"], look: 2 },
  { card: [{ cse: "ant", n: 2 }, { cse: "stomach", n: 4 }, { cse: "soil", n: 3 }], ctx: ["ghar", "khet"], look: 3 },
  { card: [{ cse: "soil", n: 3 }, { cse: "ant", n: 4 }, { cse: "stomach", n: 2 }], ctx: ["ghar", "khet"], look: 3 },
  { card: [{ cse: "stomach", n: 3 }, { cse: "soil", n: 2 }, { cse: "ant", n: 4 }], ctx: ["ghar", "khet"], look: 3 },
];

// ───────────────────────────── params, state ─────────────────────────────
export interface RangParams {
  goal: RangGoal;
  /** the scaffold (fade): 1 the fewest cups or glasses; 3 the most */
  look: 1 | 2 | 3;
  /** the row of the goal's table (everything the level starts with is that row's own) */
  row: number;
  /** the context drawn (one the row allows) */
  scene: string;
  /** scene value, no fact claimed: the seed of the order the cups or droppers stand in */
  lay: number;
}
export interface RangW {
  /** pehchaan: the indicators each cup has been dropped on (a bit per indicator) */
  tested: number[];
  /** pehchaan: the kind each cup was sorted into ("" not yet) */
  bins: string[];
  /** pehchaan/desi: the drops of gudhal water used */
  gud: number;
  /** milao: the card's next glass, and in it the drops of base, of plain water and of lemon juice so far */
  next: number; k: number; wd: number; a: number;
}
export interface RangState extends Undoable<RangState> {
  w: RangW;
  /** the law's last answer for the view ("" when the last act just happened) */
  why: string;
  /** the cup the last act was about (pehchaan), else −1 */
  at: number;
  /** the tool of the last act */
  m: string;
  /** a mal-rule consequence already shown on this level (each fires once) */
  seen: string[];
  done: boolean; acts: number;
}

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
export const modeOfGoal = (g: string): RangMode | null => (RANG_MODES.find((m) => (GOALS_OF[m] as readonly string[]).includes(g)) ?? null);
const rowsOf = (goal: RangGoal): readonly { ctx: readonly string[]; look: 1 | 2 | 3 }[] =>
  goal === "litmus" ? LITMUS_ROWS : goal === "desi" ? DESI_ROWS : goal === "boond" ? BOOND_ROWS : ILAAJ_ROWS;
/** a seeded order (the lay) of n things: a fixed rotation and swap, the same for a level every time */
function order(n: number, lay: number): number[] {
  const rnd = mulberry32(lay + 17), ix = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [ix[i], ix[k]] = [ix[k], ix[i]]; }
  return ix;
}
/** pehchaan: the cups in the order they stand */
export const cupsOf = (p: RangParams): Liquid[] => {
  const row = (p.goal === "litmus" ? LITMUS_ROWS : DESI_ROWS)[p.row];
  return order(row.cups.length, p.lay).map((i) => row.cups[i]);
};
export const isCups = (p: RangParams) => p.goal === "litmus" || p.goal === "desi";
/** pehchaan: the indicators on the bench */
export const indsOf = (p: RangParams): Ind[] => (p.goal === "litmus" ? ["blue", "red"] : ["haldi", "gudhal"]);
/** desi: the drops of gudhal water on the bench (looks 2 and 3: one for each cup that is not a base; a scene value) */
export const gudOf = (p: RangParams): number => {
  const cups = cupsOf(p);
  return p.goal !== "desi" ? 0 : p.look === 1 ? cups.length : cups.filter((c) => LIQUIDS[c] !== "base").length;
};
export const boondRow = (p: RangParams) => BOOND_ROWS[p.row];
export const ilaajRow = (p: RangParams) => ILAAJ_ROWS[p.row];
/** milao: the card's glasses (boond) or uses (ilaaj) */
export const cardOf = (p: RangParams): readonly unknown[] => (p.goal === "boond" ? boondRow(p).card : p.goal === "ilaaj" ? ilaajRow(p).card : cupsOf(p));
/** milao: the glass in front of the child (its acid units: the scene's drops plus any lemon juice) */
export function glassOf(p: RangParams, w: RangW): { n: number; want: "neutral" | "green"; acid: Acid | null; cse: Case | null } {
  if (p.goal === "boond") { const g = boondRow(p).card[Math.min(w.next, boondRow(p).card.length - 1)]; return { n: g.n, want: g.want, acid: g.acid, cse: null }; }
  const u = ilaajRow(p).card[Math.min(w.next, ilaajRow(p).card.length - 1)];
  return { n: u.n, want: "neutral", acid: null, cse: u.cse };
}
/** milao: what the hibiscus water shows now (pink while acid is left, its own colour at the right amount, green past it) */
export function shade(p: RangParams, w: RangW): "pink" | "own" | "green" {
  const need = glassOf(p, w).n + w.a;
  return w.k < need ? "pink" : w.k === need ? "own" : "green";
}

/** the tools on the bench (each goal's own; ilaaj: the use's own base, lemon juice and plain water, in the lay's order) */
export function toolsOf(p: RangParams, w?: RangW): string[] {
  switch (p.goal) {
    case "litmus": case "desi": return indsOf(p);
    case "boond": return ["soda", "water"];
    case "ilaaj": {
      const g = glassOf(p, w ?? initW(p)), set = [CASE_BASE[g.cse as Case], "lemon", "water"];
      return order(3, p.lay + (w?.next ?? 0)).map((i) => set[i]);
    }
  }
}

// ───────────────────────────── validate, init ─────────────────────────────
function validate(level: PlayLevel<unknown>): PlayLevel<RangParams> | null {
  const p = level.params as Partial<RangParams> | null;
  if (!p || !RANG_MODES.includes(level.mode as RangMode)) return null;
  const mode = level.mode as RangMode;
  if (!(GOALS_OF[mode] as readonly string[]).includes(p.goal as string)) return null;
  const goal = p.goal as RangGoal, look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || !isInt(p.row) || !isInt(p.lay) || p.lay < 0 || p.lay > 9999 || typeof p.scene !== "string") return null;
  const r = rowsOf(goal)[p.row];
  if (!r || r.look !== look || !r.ctx.includes(p.scene)) return null;
  return { ...level, params: { goal, look, row: p.row, scene: p.scene, lay: p.lay } } as PlayLevel<RangParams>;
}
function initW(p: RangParams): RangW {
  const n = isCups(p) ? cupsOf(p).length : 0;
  return { tested: Array(n).fill(0), bins: Array(n).fill(""), gud: 0, next: 0, k: 0, wd: 0, a: 0 };
}
function init(level: PlayLevel<RangParams>): RangState {
  return { w: initW(level.params), why: "", at: -1, m: "", seen: [], done: false, acts: 0, prev: null, depth: 0 };
}
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── apply (THE LAW) ─────────────────────────────
type Out = { state: RangState; moments: Moment[]; refused?: string };
function apply(level: PlayLevel<RangParams>, s: RangState, act: RangAct, seq: number): Out {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const tool = act.kind === "use" ? act.m : act.kind === "drop" ? act.ind : act.kind === "sort" ? act.bin : act.kind;
  if (s.acts === 0) out.push(mom("first_act", seq, { act: tool }));
  const at = act.kind === "drop" || act.kind === "sort" ? act.at : -1;
  const bump = (st: RangState): RangState => ({ ...st, acts: s.acts + 1 });
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
  const ok = (w: RangW, done: boolean, f: Facts = {}): Out => {
    out.push(mom(done ? "solved" : "progress", seq, { tool, ...f }));
    return { state: bump(pushUndo(s, { ...s, w, why: "", at, m: tool, done })), moments: out };
  };
  const w = s.w;

  if (isCups(p)) {
    const cups = cupsOf(p);
    if (act.kind !== "drop" && act.kind !== "sort") return no(act.kind === "done" || act.kind === "use" ? "no_claim" : "unknown_act");
    if (!isInt(at) || at < 0 || at >= cups.length) return no("no_cup");
    const liq = cups[at], truth = LIQUIDS[liq];
    if (w.bins[at]) return no("sorted");
    if (act.kind === "drop") {
      const ind = act.ind as Ind;
      if (!indsOf(p).includes(ind)) return no("no_tool");
      if (tested(w.tested[at], ind)) return no("again");
      if (ind === "gudhal" && w.gud >= gudOf(p)) return no("no_gud");
      const tested2 = w.tested.slice(); tested2[at] |= bit(ind);
      return ok({ ...w, tested: tested2, gud: w.gud + (ind === "gudhal" ? 1 : 0) }, false, { cup: liq, colour: colourOf(ind, truth) });
    }
    const bin = act.bin as Kind;
    if (!KINDS.includes(bin)) return no("no_bin");
    const mask = w.tested[at], f: Facts = { cup: liq, bin };
    if (mask === 0) return no("untested");
    // a base sorted as acidic once turmeric went red on it: red read as "the indicator made it an acid"
    if (p.goal === "desi" && bin === "acid" && truth === "base" && tested(mask, "haldi")) return no("made_red", mal("made-red", f, "made_red"));
    // a neutral liquid sorted as acidic on red litmus alone: the strip was red before the drop
    if (p.goal === "litmus" && bin === "acid" && truth === "neutral" && tested(mask, "red") && !tested(mask, "blue")) return no("own_red", mal("own-red", f, "own_red"));
    const can = fits(liq, mask);
    if (can.length > 1) return no("not_sure", mom("law_refused", seq, { ...f, why: "not_sure", fits: can.join("|") }));
    if (bin !== truth) return no("wrong_bin", mom("law_refused", seq, { ...f, why: "wrong_bin" }));
    const bins = w.bins.slice(); bins[at] = bin;
    return ok({ ...w, bins }, bins.every((b) => b), f);
  }

  // milao
  const g = glassOf(p, w), need = g.n + w.a, card = cardOf(p);
  if (act.kind === "drop" || act.kind === "sort") return no("unknown_act");
  if (act.kind === "use" && act.m === "danger") {
    // the belief that mixing an acid and a base always makes something harmful: the label shows what forms
    if (w.k === 0) return no("nothing_mixed");
    return no("salt_water", mal("harm-mix", { k: w.k }, "salt_water"));
  }
  if (act.kind === "use") {
    if (!toolsOf(p, w).includes(act.m)) return no("no_tool");
    if ((BASES as readonly string[]).includes(act.m)) {
      if (w.k >= need + OVER) return no("full");
      const w2 = { ...w, k: w.k + 1 };
      return ok(w2, false, { k: w2.k, shade: shade(p, w2) });
    }
    if (act.m === "water") { if (w.wd >= WATER_MAX) return no("full"); const w2 = { ...w, wd: w.wd + 1 }; return ok(w2, false, { wd: w2.wd, shade: shade(p, w2) }); }
    if (act.m === "lemon") { if (w.a >= LEMON_MAX) return no("full"); const w2 = { ...w, a: w.a + 1 }; return ok(w2, false, { a: w2.a, shade: shade(p, w2) }); }
    return no("no_tool");
  }
  if (act.kind !== "done") return no("unknown_act");
  const now = shade(p, w), f: Facts = { shade: now, want: g.want, k: w.k, wd: w.wd };
  if ((g.want === "neutral" && now === "own") || (g.want === "green" && now === "green")) {
    const next = w.next + 1;
    return ok({ ...w, next, k: 0, wd: 0, a: 0 }, next >= card.length, f);
  }
  // still pink after plain water: it only dilutes; it stays acidic
  if (now === "pink" && w.wd > 0) return no("diluted", mal("water-only", f, "diluted"));
  if (now === "pink") return no("still_pink", mom("law_refused", seq, { ...f, why: "still_pink" }));
  // more base than it needed: never "still neutral", it has turned green
  if (now === "green") return no("too_much", mal("too-much", f, "too_much"));
  return no("no_green", mom("law_refused", seq, { ...f, why: "no_green" }));
}
const goalMet = (_l: PlayLevel<RangParams>, s: RangState) => s.done;

// ───────────────────────────── solve, shortcut, malActs ─────────────────────────────
const U = (m: string): RangAct => ({ kind: "use", m });
const D: RangAct = { kind: "done" };
const DROP = (at: number, ind: Ind): RangAct => ({ kind: "drop", at, ind });
const SORT = (at: number, bin: Kind): RangAct => ({ kind: "sort", at, bin });
const run = (level: PlayLevel<RangParams>, acts: RangAct[]) => { let s = init(level); for (const a of acts) s = apply(level, s, a, 1).state; return s; };
const times = (n: number, a: RangAct): RangAct[] => Array.from({ length: n }, () => a);
/** the fewest drops that decide a cup (the solver knows the truth; the child finds it out) */
function dropsFor(p: RangParams, liq: Liquid): Ind[] {
  const k = LIQUIDS[liq];
  if (p.goal === "litmus") return k === "acid" ? ["blue"] : k === "base" ? ["red"] : ["blue", "red"];
  return k === "base" ? ["haldi"] : ["gudhal"];
}
/** milao: the acts that bring glass `upTo`'s predecessors to the card's colour (the law's own accepted acts) */
function planGlasses(p: RangParams, upTo: number): RangAct[] {
  const acts: RangAct[] = [];
  for (let i = 0; i < upTo; i++) {
    const w = { ...initW(p), next: i }, g = glassOf(p, w);
    const base = p.goal === "boond" ? "soda" : CASE_BASE[g.cse as Case];
    acts.push(...times(g.n + (g.want === "green" ? 1 : 0), U(base)), D);
  }
  return acts;
}
function solve(level: PlayLevel<RangParams>): RangAct[] | null {
  const p = level.params, acts: RangAct[] = [];
  if (isCups(p)) cupsOf(p).forEach((liq, i) => { for (const ind of dropsFor(p, liq)) acts.push(DROP(i, ind)); acts.push(SORT(i, LIQUIDS[liq])); });
  else acts.push(...planGlasses(p, cardOf(p).length));
  return run(level, acts).done ? acts : null;
}
/** idea-free play: every cup into one bin (with or without every drop first); "done" at once; one dropper over and over;
 *  every dropper in turn */
function shortcut(level: PlayLevel<RangParams>): RangAct[] | null {
  const p = level.params, tries: RangAct[][] = [];
  if (isCups(p)) {
    const n = cupsOf(p).length, all = Array.from({ length: n }, (_, i) => i);
    for (const bin of KINDS) {
      tries.push(all.map((i) => SORT(i, bin)));
      tries.push([...all.flatMap((i) => indsOf(p).map((ind) => DROP(i, ind))), ...all.map((i) => SORT(i, bin))]);
    }
  } else {
    const tools = [...new Set(cardOf(p).flatMap((_, i) => toolsOf(p, { ...initW(p), next: i })))];
    tries.push([D]);
    for (const m of tools) tries.push([...times(12, U(m)), D], [...times(12, U(m)), D, ...times(12, U(m)), D]);
    tries.push([...tools.flatMap((m) => times(12, U(m))), D]);
  }
  for (const t of tries) if (run(level, t).done) return t;
  return null;
}
function malActs(level: PlayLevel<RangParams>, malId: string): RangAct[] | null {
  const p = level.params;
  switch (malId) {
    case "made-red": {
      if (p.goal !== "desi") return null;
      const i = cupsOf(p).findIndex((c) => LIQUIDS[c] === "base");
      return i < 0 ? null : [DROP(i, "haldi"), SORT(i, "acid")];
    }
    case "own-red": {
      if (p.goal !== "litmus") return null;
      const i = cupsOf(p).findIndex((c) => LIQUIDS[c] === "neutral");
      return i < 0 ? null : [DROP(i, "red"), SORT(i, "acid")];
    }
    case "water-only": return isCups(p) ? null : [U("water"), D];
    case "too-much": {
      if (isCups(p)) return null;
      // the first glass the card asks to make neutral: the right drops, one more, then "Done"
      const card = cardOf(p), i = card.findIndex((_, j) => glassOf(p, { ...initW(p), next: j }).want === "neutral");
      if (i < 0) return null;
      const g = glassOf(p, { ...initW(p), next: i }), base = p.goal === "boond" ? "soda" : CASE_BASE[g.cse as Case];
      return [...planGlasses(p, i), ...times(g.n + 1, U(base)), D];
    }
    case "harm-mix": {
      if (isCups(p)) return null;
      const g = glassOf(p, initW(p));
      return [U(p.goal === "boond" ? "soda" : CASE_BASE[g.cse as Case]), U("danger")];
    }
  }
  return null;
}

// ───────────────────────────── generate ─────────────────────────────
interface RangGrammar { scenes?: string[] }
const JITTER = 0.24;
function difficultyOf(p: RangParams, steps: number): number {
  return Math.max(0, Math.min(1, 0.2 + 0.015 * (steps - 6) + 0.1 * (p.look - 1)));
}
function generate(req: GenRequest): Candidate<RangParams>[] {
  const mode = (RANG_MODES.includes(req.mode as RangMode) ? req.mode : "pehchaan") as RangMode;
  const goals = GOALS_OF[mode] as readonly RangGoal[];
  const goal = (goals.includes(req.goal as RangGoal) ? req.goal : goals[0]) as RangGoal;
  const g = req.grammar as RangGrammar, rnd = mulberry32(req.seed);
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const scenes = Array.isArray(g.scenes) && g.scenes.length ? g.scenes : null;
  const rows: { row: number; scene: string }[] = [];
  rowsOf(goal).forEach((r, i) => { if (r.look === look) for (const ctx of r.ctx) if (!scenes || scenes.includes(ctx)) rows.push({ row: i, scene: ctx }); });
  // the seed orders the rows (the picker's band and the nudge below then choose among them)
  for (let i = rows.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [rows[i], rows[k]] = [rows[k], rows[i]]; }
  const out: Candidate<RangParams>[] = [];
  for (const { row, scene } of rows) {
    const params: RangParams = { goal, look, row, scene, lay: Math.floor(rnd() * 10000) };
    const sig = `${mode}:${goal}:${row}:${scene}`;
    const level = {
      v: "play@1", levelId: `rang-${sig}-${req.seed}`.replace(/[^a-z0-9:=+._-]/gi, "_"), family: "rang", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: scene, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    } as PlayLevel<RangParams>;
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
const HIDDEN: Record<RangGoal, string[]> = {
  litmus: ["turns red", "turns blue", "laal ho", "neela ho", "change neither"],
  desi: ["turns red", "green", "hara", "dark pink", "haldi pehle"],
  boond: ["green", "hara", "too much", "zyada base", "dilute"],
  ilaaj: ["baking soda", "antacid", "milk of magnesia", "chuna", "lime"],
};
export function rangHidden(level: PlayLevel<unknown>): string[] {
  try { const v = validate(level); return v ? [...HIDDEN[v.params.goal]] : []; } catch { return []; }
}
function facts(level: PlayLevel<RangParams>, s: RangState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (isCups(p)) { f.sorted = s.w.bins.filter((b) => b).length; f.of = s.w.bins.length; if (p.goal === "desi") f.gudhal = gudOf(p) - s.w.gud; }
  else { f.next = s.w.next; f.of = cardOf(p).length; f.shade = shade(p, s.w); f.drops = s.w.k; }
  if (s.why) f.why = s.why;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<RangParams>, s: RangState) {
  const p = level.params;
  return { title: "Rang", lines: [`card: ${JSON.stringify(cardOf(p))}`, ...Object.entries(s.w).map(([k, v]) => `${k}: ${JSON.stringify(v)}`)] };
}
function grade(level: PlayLevel<RangParams>, acts: PlayActEnvelope<RangAct>[]): PlayGrade {
  return gradeLevel(rangLogic, level, acts, {
    decisiveRefusals: ["not_sure", "wrong_bin", "untested", "still_pink", "no_green", "diluted", "too_much", "salt_water", "made_red", "own_red"], final: true,
  });
}

export const rangLogic: FamilyLogic<RangParams, RangState, RangAct> = {
  family: "rang", modes: RANG_MODES, malRules: RANG_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
