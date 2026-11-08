// Chhaano (छानो, "separate / sieve") · round 7, separating mixtures (class 6 science, c6-science-ch09-t01 and -t02). Nothing
// here runs on a clock: every change waits for the child's tap; settling advances one "ruko" (wait) at a time.
//
// sukha (dry mixtures, ch09-t01). A mixture lies on the tray as ONE pile. The child picks a pile and a method; the LAW splits
// it by the one difference that method uses (the kit's own expectations):
//   gahaai  (threshing)  harvested stalks with grain on them: the stalks come away, the grain joins the rest
//   phatko  (winnowing)  the mixture falls in the wind: the LIGHTER parts are carried farther, the heavier fall nearby
//                        (qualitative: "near" and "far", never a distance); the child first sets the grain sack near or far
//   chuno   (handpicking) the few, visible pieces that differ in colour or shape are picked out by hand (stones from dal)
//   chhaano (sieving)    parts smaller than the holes fall through, bigger stay; same-size parts stay together whatever
//                        their colour or weight
// A method that uses a difference the pile does not have separates nothing (the law says why). "Ho gaya" closes the level
// when every pile holds one part. Goals: farak (s2: two parts, the one method whose difference they have) and kram (s3: three
// or four parts, two or three methods in turn; threshing first when there are stalks).
//
// geela (mixtures in water, ch09-t02). A beaker of water with solids in it. Methods on a vessel:
//   ruko     (sedimentation) heavier insoluble particles settle while it is left undisturbed: one wait at a time
//   nithaaro (decantation)  once settled, the clearer liquid is poured gently into a glass; the settled layer stays (the
//                           poured liquid may still carry a little of a fine settled solid: "a little cloudy")
//   naali    (pour away)    the liquid down the drain (washing water); refused when it would lose a part the jars want
//   chhaano  (filtration)   insoluble solids stay on the filter paper; the liquid AND anything dissolved pass into a glass
//   dhoop    (evaporation)  the water goes; whatever was in it stays on the plate (dissolved salt or sugar comes back)
// A dry solid is scooped into its jar; "ho gaya" closes the level when every jar holds its own part. Goals: nithaar (s1:
// settle and decant), chhaan (s2: filter), namak (s3, s2: the dissolved solid back, the filter cannot take it).
//
// The CHILD's beliefs (mal-rules; the kit's own misconception ids, each a deterministic act list with its own consequence):
//   one-method    (t01 m1) "ho gaya" after a single method while a pile is still mixed: the mixed pile is shown
//   heavy-far     (t01 m2) the grain sack set FAR before winnowing: the husk lands in it, the grain falls near
//   same-size     (t01 m3) a pile sieved whose parts are all on one side of the holes: they pass (or stay) together
//   salt-gone     (t02 m1) a liquid holding the dissolved part the jars want poured away: the puddle dries, the salt shows
//   filter-salt   (t02 m2) the filter paper scooped into the salt / sugar jar: the paper holds none; a drop of the filtrate,
//                          dried, does
//   clear-pure    (t02 m3) "ho gaya" while a clear-looking liquid still holds the dissolved part: a drop of it, dried,
//                          leaves the salt (the "boil before drinking" line is the teacher's, never a mechanic)
// Every number here is a scene value with no fact claimed (the settling waits, the particle counts the view draws); no
// distance, time or amount is ever claimed (tests/r7-games-chhaano.test.mjs checks this against the kit).
import type { Candidate, ChhaanoAct, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export const CHHAANO_MODES = ["sukha", "geela"] as const;
export type ChhaanoMode = (typeof CHHAANO_MODES)[number];
export const CHHAANO_MAL = ["one-method", "heavy-far", "same-size", "salt-gone", "filter-salt", "clear-pure"] as const;
/** scene value, no fact claimed: how many waits the settling takes on screen (the kit gives no count; it is never a clock) */
export const SETTLE_WAITS = 3;

// ───────────────────────────── sukha: the dry parts (each property is the kit's own; see KIT_OF) ─────────────────────────────
export type DryPart = "bundle" | "stalks" | "wheat" | "bajra" | "rice" | "moong" | "dal" | "husk" | "stone" | "pebble" | "dust" | "atta" | "bran" | "sand" | "tilW" | "tilB";
export type DryMethod = "thresh" | "winnow" | "pick" | "sieve";
export const DRY_METHODS: readonly DryMethod[] = ["thresh", "winnow", "pick", "sieve"];
/** size: 1 fine (flour, dust, fine sand), 2 grain-sized (grain, husk, small stones, bran, til), 3 big (large pebbles, stalks).
 *  wt: light / heavy, only where the kit says (a part without one is never in a scene that winnows) */
export interface DryDef { size: 1 | 2 | 3; wt?: "light" | "heavy" }
export const DRY: Record<DryPart, DryDef> = {
  bundle: { size: 3 }, stalks: { size: 3 },
  wheat: { size: 2, wt: "heavy" }, bajra: { size: 2, wt: "heavy" }, rice: { size: 2, wt: "heavy" }, moong: { size: 2, wt: "heavy" }, dal: { size: 2 },
  husk: { size: 2, wt: "light" }, stone: { size: 2, wt: "heavy" }, pebble: { size: 3, wt: "heavy" }, dust: { size: 1, wt: "light" },
  atta: { size: 1 }, bran: { size: 2 }, sand: { size: 1 }, tilW: { size: 2 }, tilB: { size: 2 },
};
/** where each property comes from in the kit (ch09-t01): the tests read these texts out of data/kits/c6-science.json */
export const KIT_OF: Record<string, string> = {
  "husk light, grain heavy": "the lighter husk blows away and the heavier grain falls nearby",
  "husk grain-sized": "Dry husk pieces are nearly the same size as wheat grains but much lighter",
  "stones grain-sized and heavy": "rice grains from small stones of the same size",
  "stones picked by hand": "stones from dal or rice",
  "dust light": "winnow it (with a supa or in a breeze) to remove husk and dust",
  "dust fine": "sieve if fine dust remains",
  "flour fine, bran and pebbles stay": "The fine flour passes through; the pebbles (and any bran) stay in the sieve",
  "large pebbles sieved after winnowing": "Threshing frees grains; winnowing removes light husk; sieving removes large pebbles",
  "sand fine, pebbles stay": "fine sand passes through the mesh and pebbles and stones roll off",
  "til same size, picked by colour": "A sieve separates by size, and the seeds are the same size",
  "threshing": "beating or crushing harvested stalks to separate the grain from the stalks",
};
/** the scenes (the kit's interest contexts): the methods on the tray, the sieve's holes (parts of size ≤ hole fall through),
 *  the parts few and visible enough to pick by hand, the grain on the stalks */
export interface DryScene { tools: readonly DryMethod[]; hole: 1 | 2; pick: readonly DryPart[]; grains: readonly DryPart[] }
export const DRY_SCENES: Record<string, DryScene> = {
  khet: { tools: ["thresh", "winnow", "sieve", "pick"], hole: 2, pick: ["stone"], grains: ["wheat", "bajra"] },   // farm / harvest
  supa: { tools: ["winnow", "pick", "sieve"], hole: 1, pick: ["stone"], grains: ["rice"] },                       // grandmother's supa
  moong: { tools: ["winnow", "pick", "sieve"], hole: 1, pick: ["stone"], grains: ["moong"] },                     // a bag of moong
  dal: { tools: ["pick", "sieve"], hole: 1, pick: ["stone"], grains: ["dal"] },                                   // kitchen dal cleaning
  chakki: { tools: ["sieve", "pick"], hole: 1, pick: ["pebble"], grains: [] },                                    // flour mill
  site: { tools: ["sieve", "pick"], hole: 1, pick: [], grains: [] },                                              // construction site
  til: { tools: ["sieve", "pick"], hole: 1, pick: ["tilB"], grains: [] },
};
/** the mixtures per goal ("G" = the scene's grain), with the fewest parts they come apart into */
const DRY_MIX: Record<"farak" | "kram", [string, readonly (DryPart | "G")[]][]> = {
  farak: [["khet", ["G", "husk"]], ["khet", ["bundle"]], ["supa", ["G", "husk"]], ["moong", ["G", "dust"]], ["dal", ["G", "stone"]],
    ["chakki", ["atta", "bran"]], ["site", ["sand", "pebble"]], ["til", ["tilW", "tilB"]]],
  kram: [["khet", ["bundle", "husk"]], ["khet", ["bundle", "husk", "pebble"]], ["khet", ["bundle", "husk", "stone"]], ["supa", ["G", "husk", "stone"]],
    ["supa", ["G", "husk", "stone", "dust"]], ["moong", ["G", "husk", "stone"]], ["moong", ["G", "husk", "stone", "dust"]], ["dal", ["G", "stone", "dust"]],
    ["chakki", ["atta", "bran", "pebble"]]],
};

// ───────────────────────────── geela: the parts in water ─────────────────────────────
export type WetPart = "mitti" | "sand" | "paint" | "rice" | "chalk" | "charcoal" | "salt" | "sugar";
export type WetMethod = "wait" | "pour" | "drain" | "filter" | "dry";
export const WET_METHODS: readonly WetMethod[] = ["wait", "pour", "drain", "filter", "dry"];
/** settle: a heavier insoluble solid that settles when left undisturbed; fine: an insoluble powder the kit only filters (its
 *  settling is never claimed, so a scene with it offers no wait); dis: dissolved. trace: the decanted liquid may still be a
 *  little cloudy with it (the kit's "remaining sand", "may still be a little cloudy") */
export interface WetDef { kind: "settle" | "fine" | "dis"; trace?: boolean }
export const WET: Record<WetPart, WetDef> = {
  mitti: { kind: "settle", trace: true }, sand: { kind: "settle", trace: true }, paint: { kind: "settle" }, rice: { kind: "settle" },
  chalk: { kind: "fine" }, charcoal: { kind: "fine" }, salt: { kind: "dis" }, sugar: { kind: "dis" },
};
/** the mixtures per goal and the contexts each is drawn in (the kit's interest contexts and items) */
const WET_MIX: Record<"nithaar" | "chhaan" | "namak", [readonly WetPart[], readonly string[], 1 | 2 | 3][]> = {
  nithaar: [[["mitti"], ["baarish", "talaab"], 1], [["sand"], ["bucket"], 1], [["paint"], ["paint"], 1], [["rice"], ["chawal"], 1],
    [["sand", "salt"], ["lab"], 2], [["mitti", "salt"], ["lab"], 3]],
  chhaan: [[["chalk"], ["school"], 1], [["charcoal"], ["school"], 1], [["mitti"], ["talaab", "baarish"], 1], [["sand", "salt"], ["lab"], 2], [["charcoal", "salt"], ["school"], 3]],
  namak: [[["salt"], ["rann", "rasoi"], 1], [["sugar"], ["rasoi"], 1], [["sand", "salt"], ["lab"], 2], [["mitti", "salt"], ["lab"], 2], [["chalk", "salt"], ["school"], 3], [["sand", "sugar"], ["lab"], 3]],
};
export type DryGoal = "farak" | "kram";
export type WetGoal = "nithaar" | "chhaan" | "namak";
export type ChhaanoGoal = DryGoal | WetGoal;
export const GOALS_OF: Record<ChhaanoMode, readonly ChhaanoGoal[]> = { sukha: ["farak", "kram"], geela: ["nithaar", "chhaan", "namak"] };

export interface ChhaanoParams {
  goal: ChhaanoGoal;
  /** the scaffold (fade): 1 fewest parts; 3 the most */
  look: 1 | 2 | 3;
  /** sukha: a DRY_SCENES key; geela: the context drawn (a key the mixture allows) */
  scene: string;
  /** the mixture at the start (sukha: one pile on the tray; geela: what is in the beaker of water) */
  mix: string[];
  /** sukha: the grain on the stalks (a scene grain) or "" */
  grain: string;
  /** scene value: the seed of the particle layout the view draws (no fact claimed) */
  lay: number;
}
export interface Vessel { k: "beaker" | "glass" | "paper" | "plate"; wet: boolean; parts: WetPart[]; settle: number; cloudy: boolean; gone: boolean }
export interface ChhaanoState extends Undoable<ChhaanoState> {
  /** sukha: the piles (each a sorted list of parts); a split keeps the first part at its index and adds the rest at the end */
  piles: DryPart[][];
  /** geela: the vessels (indices never shift: a vessel emptied is `gone`) */
  ves: Vessel[];
  /** geela: what each jar holds */
  jars: WetPart[][];
  /** the methods that have separated something (distinct, in the order first used) */
  used: string[];
  /** the law's last answer, for the view: "" | pure | attached | no_stalks | same_weight | far | cannot_pick | same_size |
   *  mixed | not_settled | settled | nothing_settles | lost | salt_gone | only_water | wet | empty | not_there | not_it | not_yet
   *  | clear */
  why: string;
  /** the pile / vessel the last act was on (−1 = none) */
  on: number;
  /** the method of the last act ("" = none) */
  m: string;
  done: boolean; acts: number;
}

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const sortParts = <T extends string>(xs: T[]): T[] => [...xs].sort();
const uniq = <T>(xs: readonly T[]): T[] => [...new Set(xs)];
export const isDry = (p: ChhaanoParams) => p.goal === "farak" || p.goal === "kram";

// ───────────────────────────── the sukha law ─────────────────────────────
export interface DrySplit { stay: DryPart[]; out: DryPart[][] }
/** the law: method m on a pile (scene s, the stalks' grain g). A split, or the refusal code (why it separates nothing). */
export function drySplit(m: DryMethod, pile: readonly DryPart[], s: DryScene, g: DryPart | "", spot?: "near" | "far"): DrySplit | string {
  if (pile.length < 2 && !(pile.length === 1 && pile[0] === "bundle")) return "pure";
  const has = (x: DryPart) => pile.includes(x);
  if (m !== "thresh" && has("bundle")) return "attached";
  switch (m) {
    case "thresh": {
      if (!has("bundle") || !g) return "no_stalks";
      return { stay: sortParts(uniq([...pile.filter((x) => x !== "bundle"), g])), out: [["stalks"]] };
    }
    case "winnow": {
      const light = pile.filter((x) => DRY[x].wt === "light"), heavy = pile.filter((x) => DRY[x].wt === "heavy");
      if (!light.length || !heavy.length) return "same_weight";
      if (spot !== "near" && spot !== "far") return "no_spot";
      if (spot === "far") return "far";
      return { stay: sortParts(heavy), out: [sortParts(light)] };
    }
    case "pick": {
      const picked = pile.filter((x) => s.pick.includes(x));
      if (!picked.length) return "cannot_pick";
      let rest = pile.filter((x) => !s.pick.includes(x)), out = picked;
      if (!rest.length) { rest = [picked[0]]; out = picked.slice(1); }
      return { stay: sortParts(rest), out: out.map((x) => [x]) };
    }
    case "sieve": {
      const below = pile.filter((x) => DRY[x].size <= s.hole), top = pile.filter((x) => DRY[x].size > s.hole);
      if (!below.length || !top.length) return "same_size";
      return { stay: sortParts(top), out: [sortParts(below)] };
    }
  }
}
/** a pile still to separate: two parts or more, or harvested stalks with the grain still on them */
export const unseparated = (pile: readonly DryPart[]) => pile.length > 1 || pile.includes("bundle");
/** the parts a dry mixture comes apart into */
export const dryParts = (p: ChhaanoParams): DryPart[] => sortParts(uniq((p.mix as DryPart[]).flatMap((x) => (x === "bundle" ? ["stalks", p.grain as DryPart] : [x]))));

// ───────────────────────────── the geela law ─────────────────────────────
export const toolsOf = (p: Pick<ChhaanoParams, "goal" | "mix" | "scene">): string[] => {
  if (isDry(p as ChhaanoParams)) return [...(DRY_SCENES[p.scene]?.tools ?? [])];
  const mix = p.mix as WetPart[], settles = mix.some((x) => WET[x].kind === "settle");
  if (p.goal === "nithaar") return ["wait", "pour", "drain"];
  if (p.goal === "chhaan") return [...(settles ? ["wait", "pour"] : []), "drain", "filter"];
  return [...(settles ? ["wait", "pour"] : []), "drain", "filter", "dry"];
};
/** the jars a geela level fills: the insoluble solids, and (namak) the dissolved one */
export const jarsOf = (p: Pick<ChhaanoParams, "goal" | "mix">): WetPart[] => (p.mix as WetPart[]).filter((x) => WET[x].kind !== "dis" || p.goal === "namak");
const newVessel = (k: Vessel["k"], wet: boolean, parts: WetPart[], o: Partial<Vessel> = {}): Vessel => ({ k, wet, parts: sortParts(uniq(parts)), settle: 0, cloudy: false, gone: false, ...o });
/** a wet vessel looks clear: no insoluble solid in it (a dissolved one cannot be seen) */
export const looksClear = (v: Vessel) => v.wet && !v.parts.some((x) => WET[x].kind !== "dis");

// ───────────────────────────── hidden, validate, init ─────────────────────────────
const METHOD_WORDS: Record<string, string[]> = {
  thresh: ["thresh", "gahaai"], winnow: ["winnow", "phatak"], pick: ["handpick", "chun"], sieve: ["sieve", "chhaan"],
  wait: ["settle", "ruko"], pour: ["decant", "nithaar"], drain: ["pour away", "naali"], filter: ["filter", "chhaan"], dry: ["evaporat", "dhoop"],
};
/** the methods the child must find (their words) are never said first; the winnowed sack's place neither */
export function chhaanoHidden(level: PlayLevel<unknown>): string[] {
  try {
    const v = validate(level);
    if (!v) return [];
    const sol = solve(v) ?? [];
    const ms = uniq(sol.filter((a): a is Extract<ChhaanoAct, { kind: "use" }> => a.kind === "use").map((a) => a.m));
    return uniq([...ms.flatMap((m) => METHOD_WORDS[m] ?? []), ...(ms.includes("winnow") ? ["near", "paas"] : [])]);
  } catch { return []; }
}

function validate(level: PlayLevel<unknown>): PlayLevel<ChhaanoParams> | null {
  const p = level.params as Partial<ChhaanoParams> | null;
  if (!p || !CHHAANO_MODES.includes(level.mode as ChhaanoMode)) return null;
  const mode = level.mode as ChhaanoMode;
  if (!GOALS_OF[mode].includes(p.goal as ChhaanoGoal)) return null;
  const look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || typeof p.scene !== "string" || !Array.isArray(p.mix) || !p.mix.every((x) => typeof x === "string") || typeof p.grain !== "string") return null;
  if (!isInt(p.lay) || p.lay < 0 || p.lay > 9999) return null;
  const goal = p.goal as ChhaanoGoal, mix = [...p.mix];
  if (mode === "sukha") {
    const s = DRY_SCENES[p.scene];
    if (!s) return null;
    // the mixture is one of the goal's own (the grain is the scene's), never anything else smuggled in
    const row = DRY_MIX[goal as DryGoal].find(([sc, m]) => sc === p.scene && m.length === mix.length && m.every((x, i) => (x === "G" ? s.grains.includes(mix[i] as DryPart) : x === mix[i])));
    if (!row) return null;
    const needsG = mix.includes("bundle");
    if (needsG ? !s.grains.includes(p.grain as DryPart) : p.grain !== "") return null;
    const params: ChhaanoParams = { goal, look, scene: p.scene, mix, grain: p.grain, lay: p.lay };
    // a scene that winnows names a weight for every part that can reach the wind
    if (s.tools.includes("winnow") && dryParts(params).some((x) => x !== "stalks" && !DRY[x].wt)) return null;
    return { ...level, params } as PlayLevel<ChhaanoParams>;
  }
  const row = WET_MIX[goal as WetGoal].find(([m, ctx]) => m.length === mix.length && m.every((x, i) => x === mix[i]) && ctx.includes(p.scene as string));
  if (!row || p.grain !== "") return null;
  return { ...level, params: { goal, look, scene: p.scene, mix, grain: "", lay: p.lay } } as PlayLevel<ChhaanoParams>;
}

function init(level: PlayLevel<ChhaanoParams>): ChhaanoState {
  const p = level.params;
  const base = { used: [], why: "", on: -1, m: "", done: false, acts: 0, prev: null, depth: 0 };
  if (isDry(p)) return { ...base, piles: [sortParts(p.mix as DryPart[])], ves: [], jars: [] };
  return { ...base, piles: [], ves: [newVessel("beaker", true, p.mix as WetPart[])], jars: jarsOf(p).map(() => []) };
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── apply (THE LAW) ─────────────────────────────
function apply(level: PlayLevel<ChhaanoParams>, s: ChhaanoState, act: ChhaanoAct, seq: number): { state: ChhaanoState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const bump = (st: ChhaanoState): ChhaanoState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string, patch: Partial<ChhaanoState> = {}, moment?: Moment) => {
    if (moment) out.push(moment);
    return { state: bump({ ...s, ...patch }), moments: out, refused: code };
  };
  const ok = (next: Partial<ChhaanoState>) => ({ state: bump(pushUndo(s, { ...s, why: "", ...next })), moments: out });
  const mal = (id: string, f: Facts, why: string) => (id in level.mal ? mom("misconception_consequence", seq, f, id) : mom("law_refused", seq, { ...f, why }));
  return isDry(p) ? applyDry() : applyWet();

  function applyDry() {
    const sc = DRY_SCENES[p.scene];
    if (act.kind === "take") return no("no_jars");
    if (act.kind === "done") {
      const mixed = s.piles.findIndex(unseparated);
      if (mixed < 0) { out.push(mom("solved", seq, { piles: s.piles.length, methods: s.used.length })); return ok({ done: true, on: -1, m: "" }); }
      const f: Facts = { pile: mixed, parts: s.piles[mixed].join("+"), methods: s.used.length };
      // one method used, a pile still mixed: the belief that one method separates any mixture
      return no("mixed", { why: "mixed", on: mixed, m: "" }, s.used.length === 1 ? mal("one-method", f, "mixed") : mom("law_refused", seq, { ...f, why: "mixed" }));
    }
    if (act.kind !== "use") return no("unknown_act");
    const m = act.m as DryMethod, j = Number(act.at);
    if (!DRY_METHODS.includes(m) || !sc.tools.includes(m)) return no("no_tool");
    if (!isInt(j) || j < 0 || j >= s.piles.length) return no("bad_pile");
    const pile = s.piles[j], r = drySplit(m, pile, sc, p.grain as DryPart | "", act.spot);
    const f: Facts = { pile: j, method: m, parts: pile.join("+") };
    if (typeof r === "string") {
      if (r === "far") return no("far", { why: "far", on: j, m }, mal("heavy-far", { ...f, spot: "far" }, "far"));
      if (r === "same_size") return no("same_size", { why: "same_size", on: j, m }, mal("same-size", f, "same_size"));
      if (r === "no_spot") return no("no_spot");
      return no(r, { why: r, on: j, m }, mom("law_refused", seq, { ...f, why: r }));
    }
    const piles = s.piles.map((x, i) => (i === j ? r.stay : x)).concat(r.out);
    out.push(mom("progress", seq, { ...f, piles: piles.length }));
    return ok({ piles, used: uniq([...s.used, m]), on: j, m });
  }

  function applyWet() {
    const tools = toolsOf(p), wanted = jarsOf(p);
    if (act.kind === "done") {
      if (s.jars.every((jr) => jr.length > 0)) { out.push(mom("solved", seq, { jars: s.jars.length })); return ok({ done: true, on: -1, m: "" }); }
      // a clear-looking liquid still holds the dissolved part the jars want
      const k = s.ves.findIndex((v) => !v.gone && looksClear(v) && v.parts.some((x) => WET[x].kind === "dis" && wanted.includes(x) && !s.jars[wanted.indexOf(x)].length));
      if (k >= 0) return no("not_yet", { why: "clear", on: k, m: "" }, mal("clear-pure", { vessel: k, parts: s.ves[k].parts.join("+") }, "not_yet"));
      return no("not_yet", { why: "not_yet", on: -1, m: "" }, mom("law_refused", seq, { why: "not_yet", empty: s.jars.filter((jr) => !jr.length).length }));
    }
    if (act.kind === "take") {
      const j = Number(act.at), q = Number(act.jar);
      if (!isInt(j) || j < 0 || j >= s.ves.length || s.ves[j].gone) return no("bad_vessel");
      if (!isInt(q) || q < 0 || q >= wanted.length) return no("bad_jar");
      const v = s.ves[j], want = wanted[q], f: Facts = { vessel: j, jar: want, parts: v.parts.join("+") };
      // the filter paper scooped for the dissolved part: it is not there (it passed with the liquid)
      if (v.k === "paper" && WET[want].kind === "dis" && !v.parts.includes(want)) return no("not_there", { why: "not_there", on: j, m: "take" }, mal("filter-salt", f, "not_there"));
      if (v.wet) return no("wet", { why: "wet", on: j, m: "take" });
      if (!v.parts.length) return no("empty", { why: "empty", on: j, m: "take" });
      if (v.parts.length === 1 && v.parts[0] === want) {
        out.push(mom("progress", seq, f));
        return ok({ ves: s.ves.map((x, i) => (i === j ? { ...x, gone: true } : x)), jars: s.jars.map((jr, i) => (i === q ? uniq([...jr, want]) : jr)), on: j, m: "take" });
      }
      const code = v.parts.includes(want) ? "mixed" : "not_it";
      return no(code, { why: code, on: j, m: "take" }, mom("law_refused", seq, { ...f, why: code }));
    }
    if (act.kind !== "use") return no("unknown_act");
    const m = act.m as WetMethod, j = Number(act.at);
    if (!WET_METHODS.includes(m) || !tools.includes(m)) return no("no_tool");
    if (!isInt(j) || j < 0 || j >= s.ves.length || s.ves[j].gone) return no("bad_vessel");
    const v = s.ves[j], f: Facts = { vessel: j, method: m, parts: v.parts.join("+") };
    const refuse = (code: string) => no(code, { why: code, on: j, m }, mom("law_refused", seq, { ...f, why: code }));
    if (!v.wet) return refuse("dry");
    // a decanted glass has already stood: what clouds it is the little the pouring carried (it is filtered, never settled
    // again: the kit's "filter the liquid to catch the remaining sand")
    const settles = v.cloudy ? [] : v.parts.filter((x) => WET[x].kind === "settle"), settled = v.settle >= SETTLE_WAITS;
    const swap = (nv: Vessel, add: Vessel[] = []) => s.ves.map((x, i) => (i === j ? nv : x)).concat(add);
    switch (m) {
      case "wait": {
        if (v.cloudy) return refuse("settled");
        if (!settles.length) return refuse("nothing_settles");
        if (settled) return refuse("settled");
        out.push(mom("progress", seq, { ...f, settle: v.settle + 1 }));
        return ok({ ves: swap({ ...v, settle: v.settle + 1 }), on: j, m });
      }
      case "pour": {
        if (v.cloudy) return refuse("settled");
        if (!settles.length) return refuse("nothing_settles");
        if (!settled) return refuse("not_settled");
        const top = v.parts.filter((x) => WET[x].kind !== "settle"), trace = settles.filter((x) => WET[x].trace);
        out.push(mom("progress", seq, f));
        return ok({ ves: swap(newVessel(v.k, false, settles), [newVessel("glass", true, [...top, ...trace], { settle: SETTLE_WAITS, cloudy: trace.length > 0 })]), used: uniq([...s.used, m]), on: j, m });
      }
      case "drain": {
        const stays = settles.length && settled ? settles : [], lost = v.parts.filter((x) => !stays.includes(x));
        const lostDis = lost.filter((x) => WET[x].kind === "dis" && wanted.includes(x));
        if (lostDis.length) return no("lost", { why: "salt_gone", on: j, m }, mal("salt-gone", { ...f, lost: lostDis.join("+") }, "lost"));
        if (lost.some((x) => wanted.includes(x) && !stays.includes(x) && !(v.cloudy && WET[x].trace))) return refuse("lost");
        out.push(mom("progress", seq, f));
        return ok({ ves: swap(stays.length ? newVessel(v.k, false, stays) : { ...v, wet: false, parts: [], gone: true }), used: uniq([...s.used, m]), on: j, m });
      }
      case "filter": {
        const ins = v.parts.filter((x) => WET[x].kind !== "dis"), dis = v.parts.filter((x) => WET[x].kind === "dis");
        out.push(mom("progress", seq, { ...f, paper: ins.join("+") || "none" }));
        return ok({ ves: swap({ ...v, gone: true }, [newVessel("paper", false, ins), newVessel("glass", true, dis, { settle: SETTLE_WAITS })]), used: uniq([...s.used, m]), on: j, m });
      }
      case "dry": {
        if (!v.parts.length) return refuse("only_water");
        out.push(mom("progress", seq, f));
        return ok({ ves: swap(newVessel("plate", false, v.parts)), used: uniq([...s.used, m]), on: j, m });
      }
    }
    return no("unknown_act");
  }
}
const goalMet = (_l: PlayLevel<ChhaanoParams>, s: ChhaanoState) => s.done;

// ───────────────────────────── solve, shortcut, malActs ─────────────────────────────
const run = (level: PlayLevel<ChhaanoParams>, acts: ChhaanoAct[]) => { let s = init(level); for (const a of acts) s = apply(level, s, a, 1).state; return s; };
/** the shortest act list (breadth first over the acts the law accepts; the state space is a few dozen) */
function solve(level: PlayLevel<ChhaanoParams>): ChhaanoAct[] | null {
  const p = level.params;
  const key = (s: ChhaanoState) => JSON.stringify([s.piles.map((x) => x.join("+")).sort(), s.ves.map((v) => (v.gone ? "-" : `${v.k}${v.wet ? "~" : ""}${v.settle}${v.parts.join("+")}`)), s.jars]);
  const moves = (s: ChhaanoState): ChhaanoAct[] => {
    const out: ChhaanoAct[] = [{ kind: "done" }];
    if (isDry(p)) s.piles.forEach((_, i) => { for (const m of DRY_SCENES[p.scene].tools) out.push(m === "winnow" ? { kind: "use", m, at: i, spot: "near" } : { kind: "use", m, at: i }); });
    else s.ves.forEach((v, i) => { if (v.gone) return; for (const m of toolsOf(p)) out.push({ kind: "use", m, at: i }); jarsOf(p).forEach((_, q) => out.push({ kind: "take", at: i, jar: q })); });
    return out;
  };
  let frontier: { s: ChhaanoState; acts: ChhaanoAct[] }[] = [{ s: init(level), acts: [] }];
  const seen = new Set([key(frontier[0].s)]);
  for (let depth = 0; depth < 14 && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const { s, acts } of frontier) for (const a of moves(s)) {
      const r = apply(level, s, a, acts.length + 1);
      if (r.refused) continue;
      if (r.state.done) return [...acts, a];
      const k = key(r.state);
      if (seen.has(k)) continue;
      seen.add(k); next.push({ s: r.state, acts: [...acts, a] });
    }
    frontier = next;
  }
  return null;
}
/** idea-free play: "ho gaya" at once; one method on every pile again and again; scooping straight from the beaker */
function shortcut(level: PlayLevel<ChhaanoParams>): ChhaanoAct[] | null {
  const p = level.params, tries: ChhaanoAct[][] = [[{ kind: "done" }]];
  if (isDry(p) && p.goal === "kram") for (const m of DRY_SCENES[p.scene].tools) {
    const acts: ChhaanoAct[] = [];
    for (let k = 0; k < 6; k++) for (let i = 0; i < 6; i++) acts.push(m === "winnow" ? { kind: "use", m, at: i, spot: "near" } : { kind: "use", m, at: i });
    tries.push([...acts, { kind: "done" }]);
  }
  if (!isDry(p)) tries.push([...jarsOf(p).map((_, q): ChhaanoAct => ({ kind: "take", at: 0, jar: q })), { kind: "done" }]);
  for (const t of tries) if (run(level, t).done) return t;
  return null;
}
/** the acts that bring the state to one where `want` holds, by the law's own accepted acts (breadth first, shallow) */
function reach(level: PlayLevel<ChhaanoParams>, want: (s: ChhaanoState) => number): { acts: ChhaanoAct[]; at: number } | null {
  const p = level.params;
  let frontier: { s: ChhaanoState; acts: ChhaanoAct[] }[] = [{ s: init(level), acts: [] }];
  for (let depth = 0; depth < 4; depth++) {
    const next: typeof frontier = [];
    for (const { s, acts } of frontier) {
      const at = want(s);
      if (at >= 0) return { acts, at };
      s.piles.forEach((_, i) => { for (const m of DRY_SCENES[p.scene].tools) {
        const a: ChhaanoAct = m === "winnow" ? { kind: "use", m, at: i, spot: "near" } : { kind: "use", m, at: i };
        const r = apply(level, s, a, 1);
        if (!r.refused) next.push({ s: r.state, acts: [...acts, a] });
      } });
    }
    frontier = next;
  }
  return null;
}
function malActs(level: PlayLevel<ChhaanoParams>, malId: string): ChhaanoAct[] | null {
  const p = level.params;
  if (isDry(p)) {
    const sc = DRY_SCENES[p.scene];
    if (malId === "one-method") {
      if (p.goal !== "kram") return null;
      const sol = solve(level);
      if (!sol) return null;
      const first = sol[0], s = run(level, [first]);
      return s.piles.some(unseparated) ? [first, { kind: "done" }] : null;
    }
    if (malId === "heavy-far") {
      if (!sc.tools.includes("winnow")) return null;
      const r = reach(level, (s) => s.piles.findIndex((x) => !x.includes("bundle") && x.some((y) => DRY[y].wt === "light") && x.some((y) => DRY[y].wt === "heavy")));
      return r ? [...r.acts, { kind: "use", m: "winnow", at: r.at, spot: "far" }] : null;
    }
    if (malId === "same-size") {
      if (!sc.tools.includes("sieve")) return null;
      const r = reach(level, (s) => s.piles.findIndex((x) => x.length > 1 && drySplit("sieve", x, sc, p.grain as DryPart | "") === "same_size"));
      return r ? [...r.acts, { kind: "use", m: "sieve", at: r.at }] : null;
    }
    return null;
  }
  if (p.goal !== "namak") return null;
  const hasIns = (p.mix as WetPart[]).some((x) => WET[x].kind !== "dis");
  if (malId === "salt-gone") return [{ kind: "use", m: "drain", at: 0 }];
  // filtering makes vessel 1 (the paper) and vessel 2 (the glass); the dissolved part's jar is the last
  if (malId === "filter-salt") return [{ kind: "use", m: "filter", at: 0 }, { kind: "take", at: 1, jar: jarsOf(p).length - 1 }];
  if (malId === "clear-pure") return hasIns ? [{ kind: "use", m: "filter", at: 0 }, { kind: "done" }] : [{ kind: "done" }];
  return null;
}

// ───────────────────────────── generate ─────────────────────────────
interface ChhaanoGrammar { scenes?: string[] }
const JITTER = 0.24;
function difficultyOf(p: ChhaanoParams, steps: number): number {
  const n = isDry(p) ? dryParts(p).length : p.mix.length;
  return Math.max(0, Math.min(1, 0.16 + 0.07 * (n - 2) + 0.05 * (steps - 2) + 0.08 * (p.look - 1) + (p.goal === "kram" || p.goal === "namak" ? 0.08 : 0)));
}
function generate(req: GenRequest): Candidate<ChhaanoParams>[] {
  const mode = (CHHAANO_MODES.includes(req.mode as ChhaanoMode) ? req.mode : "sukha") as ChhaanoMode;
  const goal = (GOALS_OF[mode].includes(req.goal as ChhaanoGoal) ? req.goal : GOALS_OF[mode][0]) as ChhaanoGoal;
  const g = req.grammar as ChhaanoGrammar, rnd = mulberry32(req.seed);
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const scenes = Array.isArray(g.scenes) && g.scenes.length ? g.scenes : null;
  const rows: { scene: string; mix: string[]; grain: string }[] = [];
  if (mode === "sukha") {
    for (const [scene, mix] of DRY_MIX[goal as DryGoal]) {
      if (scenes && !scenes.includes(scene)) continue;
      const sc = DRY_SCENES[scene], n0 = mix.length + (mix.includes("bundle") ? 1 : 0);
      // look 1: the fewest parts; look 3: the most (a farak pair is two parts at every look)
      if (goal === "kram" && (look === 1 ? n0 > 3 : look === 3 ? n0 < 4 : false)) continue;
      const grains = sc.grains.length ? sc.grains : [""];
      for (const gr of grains) {
        const m = mix.map((x) => (x === "G" ? gr : x));
        rows.push({ scene, mix: m, grain: m.includes("bundle") ? gr : "" });
      }
    }
  } else {
    for (const [mix, ctxs, lk] of WET_MIX[goal as WetGoal]) {
      if (lk > look) continue;
      for (const ctx of ctxs) if (!scenes || scenes.includes(ctx)) rows.push({ scene: ctx, mix: [...mix], grain: "" });
    }
  }
  // the seed orders the rows (the picker's band and the nudge below then choose among them)
  for (let i = rows.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [rows[i], rows[k]] = [rows[k], rows[i]]; }
  const out: Candidate<ChhaanoParams>[] = [];
  for (const row of rows) {
    const params: ChhaanoParams = { goal, look, scene: row.scene, mix: row.mix, grain: row.grain, lay: Math.floor(rnd() * 10000) };
    const sig = `${mode}:${goal}:${row.scene}:${row.mix.join("+")}${row.grain ? `:${row.grain}` : ""}`;
    const level: PlayLevel<ChhaanoParams> = {
      v: "play@1", levelId: `chhaano-${sig}-${req.seed}`.replace(/[^a-z0-9:=+._-]/gi, "_"), family: "chhaano", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: row.scene, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    } as PlayLevel<ChhaanoParams>;
    const v = validate(level as PlayLevel<unknown>);
    if (!v) continue;
    const sol = solve(v);
    if (!sol || shortcut(v)) continue;
    // kram is two methods at least (a one-method mixture is farak's)
    if (goal === "kram" && uniq(sol.filter((a) => a.kind === "use").map((a) => (a as { m: string }).m)).length < 2) continue;
    // a seeded nudge (± JITTER / 2) so the picker's nearest-to-band level differs from child to child
    const difficulty = Math.max(0, Math.min(1, difficultyOf(v.params, sol.length) + (rnd() - 0.5) * JITTER));
    out.push({ signature: sig, difficulty, level: v });
  }
  return out;
}

// ───────────────────────────── facts, board, grade ─────────────────────────────
function facts(level: PlayLevel<ChhaanoParams>, s: ChhaanoState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, methods: s.used.join("+") || "none" };
  if (isDry(p)) { f.piles = s.piles.length; f.mixed = s.piles.filter((x) => x.length > 1).length; }
  else { f.vessels = s.ves.filter((v) => !v.gone).length; f.jars = s.jars.filter((jr) => jr.length).length; f.of = s.jars.length; }
  if (s.why) f.why = s.why;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<ChhaanoParams>, s: ChhaanoState) {
  const p = level.params;
  if (isDry(p)) return { title: "Chhaano", lines: s.piles.map((x, i) => `${i + 1}: ${x.join(" + ")}`) };
  const lines = s.ves.map((v, i) => (v.gone ? "" : `${i + 1} ${v.k}${v.wet ? " (paani)" : ""}: ${v.parts.join(" + ") || "—"}${v.wet && v.parts.some((x) => WET[x].kind === "settle") ? ` ${v.settle}/${SETTLE_WAITS}` : ""}`)).filter(Boolean);
  jarsOf(p).forEach((x, q) => lines.push(`[${x}] ${s.jars[q].length ? "✓" : "—"}`));
  return { title: "Chhaano", lines };
}
function grade(level: PlayLevel<ChhaanoParams>, acts: PlayActEnvelope<ChhaanoAct>[]): PlayGrade {
  return gradeLevel(chhaanoLogic, level, acts, { decisiveRefusals: ["mixed", "attached", "no_stalks", "same_weight", "cannot_pick", "far", "same_size", "not_settled", "lost", "not_it", "not_there", "not_yet"], final: true });
}

export const chhaanoLogic: FamilyLogic<ChhaanoParams, ChhaanoState, ChhaanoAct> = {
  family: "chhaano", modes: CHHAANO_MODES, malRules: CHHAANO_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
