// Jaanch (जाँच, "test") · round 7, testing food for starch and fat (class 6 science, c6-science-ch03-t02). The child runs the
// two tests herself, on a bench in the teacher's lab, and the result is what she sees: dilute iodine from a labelled dropper
// bottle a drop at a time on a food (blue-black, or iodine's own brown), a food rubbed on paper, the paper left to dry a Wait at
// a time and held to the light (a patch that stays, or one that dries and goes). She records a result only after she has seen
// it. Nothing here runs on a clock: every step is a tap, and the paper dries only when she taps Wait.
//
// neela  / iodine (s1)       a card of foods, one at a time: drop iodine on it a drop at a time (a few drops before a
//                            result can be said), then mark "shows starch" or "no starch shown". Sugar solution is on every
//                            card (iodine shows starch, not every carbohydrate).
// daag   / kaagaz (s2)       a card of foods, one at a time: rub it on the paper (a liquid: a drop on it), Wait till the
//                            paper is dry, hold it to the light, then mark "shows fat" or "no fat shown". Water or a tomato is
//                            on every card (a water patch dries and goes).
// thali  / dono (s3, s1, s2) a card of foods each with both tests on the bench; the results go into a grid (foods down the
//                            side, starch and fat across) and "Next food" moves on only once both are said. The kit's new
//                            snack is on every card (blue-black AND a patch on the dry paper).
// The protein test is out of this game entirely (the owner's scope): skill s2's protein half is not covered (see
// server/play/tools/rules/jaanch.mjs).
//
// The CHILD's beliefs (mal-rules; each mapped to the topic's own kit misconception, a deterministic act list with its own
// consequence):
//   sugar-starch (m2) sugar solution marked "shows starch" after its drops stayed brown (sugar is a carbohydrate, so iodine
//                     must show it): the dish stays iodine's own brown, and the carbohydrate tree shows iodine pointing only at
//                     starch
//   wet-fat      (m3) "shows fat" marked for water or a tomato while its patch is still wet (any wet patch means fat): decided
//                     before the paper dried; Wait and see whether it stays
//   one-only     (m1) "Next food" after one test showed something and the other test not done (one food, one nutrient): the
//                     grid's empty cell for that food is ringed
// Safety lines (tested food is never eaten; chemicals only with the teacher; a peanut allergy) are the teacher's, never a
// mechanic: no act eats, tastes or touches anything, and no hand is drawn. The iodine is a labelled bottle on the lab bench.
// Every food's result is the kit's (KIT_OF; tests/r7-games-jaanch.test.mjs reads them out of data/kits/c6-science.json);
// every number here is a scene value with no fact claimed.
import type { Candidate, Facts, FamilyLogic, GenRequest, JaanchAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export const JAANCH_MODES = ["neela", "daag", "thali"] as const;
export type JaanchMode = (typeof JAANCH_MODES)[number];
export const GOALS_OF = { neela: ["iodine"], daag: ["kaagaz"], thali: ["dono"] } as const;
export type JaanchGoal = (typeof GOALS_OF)[JaanchMode][number];
export const JAANCH_MAL = ["sugar-starch", "wet-fat", "one-only"] as const;
export const TOPIC = "c6-science-ch03-t02";

/** the kit's own sentences each law rests on (tests read them out of data/kits/c6-science.json; a sentence from an item is
 *  from a verified item) */
export const KIT_OF: Record<string, Record<string, string>> = {
  [TOPIC]: {
    "the starch test": "a few drops of dilute iodine solution turn blue-black where starch is present (potato, rice, roti)",
    "the fat test": "rubbing a food on paper leaves an oily, translucent patch that does not dry away if fat is present (groundnut, coconut); a water patch dries and disappears",
    "not sugar": "Iodine shows starch, not every carbohydrate: sugar does not turn blue-black",
    "several": "One food can contain several nutrients",
    "the teacher": "chemicals are handled only with a teacher",
    "iodine's brown": "Point to iodine's own brown colour as the 'no' result",
    "stays brown": "sample B stays brown",
    "potato": "The potato turns blue-black (it has starch)",
    "cucumber": "the cucumber shows little or no blue-black and stays the brownish-yellow colour of iodine",
    "rice water": "Only the rice water. Iodine shows starch; sugar is a carbohydrate but not starch, so it does not turn blue-black",
    "rice water is": "rice water (the starchy water from cooking rice)",
    "idli": "you want to test an idli for starch",
    "idli blue-black": "Dilute iodine turns blue-black when starch is present",
    "milk": "Milk does not turn blue-black with iodine",
    "paneer": "iodine shows no blue-black, the paper shows an oily patch",
    "coconut": "The coconut oil and the crushed coconut (both contain fat); the water patch dries and disappears",
    "cashew": "You press a roasted cashew on paper and let the paper dry",
    "cashew patch": "A translucent oily patch remains",
    "chips": "Crush a chip and rub it on paper, let it dry, and hold it to the light; an oily translucent patch that stays means the chips contain fat",
    "tomato": "A slice of tomato rubbed on paper makes a wet patch",
    "tomato dries": "Let it dry; if the patch goes, it was only water",
    "wait to dry": "Water also makes a wet patch, but it dries and disappears; only an oily patch stays translucent after drying",
    "groundnut": "Crush and rub the groundnut on the paper and let it dry",
    "groundnut table": "Groundnut: starch ✗, fat ✓",
    "boiled potato": "Observe: the slice turns blue-black, so starch is present",
    "potato no fat": "Observe: no oily translucent patch remains, so there is little or no fat",
    "a few drops": "put 2-3 drops of dilute iodine solution on a potato slice",
    "a table": "Record both results in a table",
    "the snack": "A new snack gives blue-black with iodine, leaves a patch on dry paper",
    "the grid": "Result grid: foods down the side",
    "the ticks": "ticks in several columns per food",
    "one positive": "Stops after one positive test",
    "decides early": "Decides before the paper dries",
    "sugar predicted": "Predicts sugar solution will turn blue-black",
    "the tree": "Carbohydrate family tree: starch and sugar as two branches, iodine pointing only at starch",
  },
};

// ───────────────────────────── the kit's foods and their results ─────────────────────────────
/** a food on the bench: what iodine shows on it (starch) and whether its patch stays on dry paper (fat); a test the kit gives
 *  no result for is undefined and the food is never on that test's card. `liquid`: a drop goes on the paper, not a rub.
 *  KIT_OF: potato (i03, the worked example's boiled potato: blue-black, no oily patch); rice, roti (the starch test); rice
 *  water (i04, i07); idli (rl-o1); cucumber (i03: little or no blue-black); sugar solution (not sugar, i04); milk (i07);
 *  paneer (i08: no blue-black, an oily patch); groundnut (the fat test, i02, i10: starch ✗); coconut and coconut oil (i05);
 *  roasted cashew (rl-o2); chips (i09); water (the fat test, i05); tomato (m3); the new snack (rl-h3) */
export interface Food { starch?: boolean; fat?: boolean; liquid?: boolean }
export const FOODS = {
  potato: { starch: true, fat: false },
  rice: { starch: true },
  roti: { starch: true },
  ricewater: { starch: true, liquid: true },
  idli: { starch: true },
  cucumber: { starch: false },
  sugar: { starch: false, liquid: true },
  milk: { starch: false, liquid: true },
  paneer: { starch: false, fat: true },
  groundnut: { starch: false, fat: true },
  coconut: { fat: true },
  oil: { fat: true, liquid: true },
  cashew: { fat: true },
  chips: { fat: true },
  water: { fat: false, liquid: true },
  tomato: { fat: false },
  snack: { starch: true, fat: true },
} as const satisfies Record<string, Food>;
export type FoodId = keyof typeof FOODS;
export const foodOf = (id: FoodId): Food => FOODS[id];
export const TESTS = ["starch", "fat"] as const;
export type Test = (typeof TESTS)[number];
/** scene value, no fact claimed: the drops before a result can be said (the kit's "a few drops") */
export const FEW = 2;
/** scene value, no fact claimed: the most drops on one food */
export const DROPMAX = 4;
/** scene value, no fact claimed: the Waits until the paper is dry */
export const DRY = 2;

// ───────────────────────────── the rows of each goal ─────────────────────────────
type Look = 1 | 2 | 3;
interface Row { card: readonly FoodId[]; ctx: readonly string[]; look: Look }
const CTX = ["lab", "kaksha"] as const;
const r = (look: Look, ...card: FoodId[]): Row => ({ card, ctx: CTX, look });
/** iodine: sugar solution and a blue-black food on every card */
const IODINE_ROWS: readonly Row[] = [
  r(1, "potato", "sugar"), r(1, "ricewater", "sugar"), r(1, "sugar", "roti"), r(1, "idli", "sugar"), r(1, "sugar", "rice"),
  r(2, "potato", "cucumber", "sugar"), r(2, "ricewater", "milk", "sugar"), r(2, "roti", "sugar", "cucumber"), r(2, "sugar", "idli", "milk"), r(2, "rice", "sugar", "paneer"),
  r(3, "potato", "cucumber", "sugar", "ricewater"), r(3, "milk", "ricewater", "sugar", "idli"), r(3, "sugar", "roti", "cucumber", "rice"), r(3, "idli", "sugar", "paneer", "potato"), r(3, "rice", "milk", "sugar", "roti"),
];
/** kaagaz: water or a tomato, and a food whose patch stays, on every card */
const KAAGAZ_ROWS: readonly Row[] = [
  r(1, "groundnut", "water"), r(1, "tomato", "oil"), r(1, "cashew", "tomato"), r(1, "water", "chips"), r(1, "coconut", "tomato"),
  r(2, "groundnut", "water", "coconut"), r(2, "tomato", "chips", "oil"), r(2, "paneer", "tomato", "water"), r(2, "water", "cashew", "tomato"), r(2, "chips", "water", "paneer"),
  r(3, "groundnut", "tomato", "oil", "water"), r(3, "coconut", "water", "chips", "tomato"), r(3, "paneer", "cashew", "tomato", "groundnut"), r(3, "oil", "water", "chips", "coconut"), r(3, "tomato", "cashew", "water", "paneer"),
];
/** dono: the new snack on every card, beside foods that show one of the two */
const DONO_ROWS: readonly Row[] = [
  r(1, "snack", "potato"), r(1, "paneer", "snack"), r(1, "snack", "groundnut"),
  r(2, "snack", "potato", "paneer"), r(2, "groundnut", "snack", "potato"), r(2, "paneer", "groundnut", "snack"), r(2, "potato", "snack", "groundnut"),
  r(3, "snack", "potato", "paneer", "groundnut"), r(3, "groundnut", "snack", "potato", "paneer"), r(3, "paneer", "groundnut", "snack", "potato"), r(3, "potato", "paneer", "groundnut", "snack"),
];

// ───────────────────────────── params, state ─────────────────────────────
export interface JaanchParams {
  goal: JaanchGoal;
  /** the scaffold (fade): 1 the fewest foods on the card; 3 the most */
  look: Look;
  /** the row of the goal's table (everything the level starts with is that row's own) */
  row: number;
  /** the context drawn (one the row allows) */
  scene: string;
  /** scene value, no fact claimed: the seed of the order the card's foods stand in */
  lay: number;
}
export interface JW {
  /** the card's food in front of the child */
  next: number;
  /** what each food ended as ("" not yet): neela / daag "yes" | "no"; dono "<starch>,<fat>" */
  res: string[];
  /** iodine: the drops on the food in front */
  drops: number;
  /** paper: rubbed on (a drop for a liquid), the Waits it has dried, held to the light */
  rubbed: boolean; dry: number; lit: boolean;
  /** what the child has said of the food in front ("" not yet, "yes", "no") */
  said: { starch: string; fat: string };
}
export interface JaanchState extends Undoable<JaanchState> {
  w: JW;
  /** the law's last answer for the view ("" when the last act just happened) */
  why: string;
  /** the food the last act was about */
  at: number;
  /** the tool or mark of the last act */
  m: string;
  /** a mal-rule consequence already shown on this level (each fires once) */
  seen: string[];
  done: boolean; acts: number;
}

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
export const modeOfGoal = (g: string): JaanchMode | null => (JAANCH_MODES.find((m) => (GOALS_OF[m] as readonly string[]).includes(g)) ?? null);
const rowsOf = (goal: JaanchGoal): readonly Row[] => (goal === "iodine" ? IODINE_ROWS : goal === "kaagaz" ? KAAGAZ_ROWS : DONO_ROWS);
/** the tests on the bench for a goal */
export const testsOf = (goal: JaanchGoal): readonly Test[] => (goal === "iodine" ? ["starch"] : goal === "kaagaz" ? ["fat"] : TESTS);
/** a seeded order (the lay) of n things: the same for a level every time */
function order(n: number, lay: number): number[] {
  const rnd = mulberry32(lay + 41), ix = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [ix[i], ix[k]] = [ix[k], ix[i]]; }
  return ix;
}
/** the card's foods in the order they stand */
export function cardOf(p: JaanchParams): FoodId[] {
  const row = rowsOf(p.goal)[p.row];
  return order(row.card.length, p.lay).map((i) => row.card[i]);
}
/** the food in front of the child (clamped to the card) */
export const foodAt = (p: JaanchParams, w: JW): FoodId => { const c = cardOf(p); return c[Math.min(w.next, c.length - 1)]; };
/** the kit's result for a food under a test, as "yes" / "no" */
export const truthOf = (id: FoodId, t: Test): "yes" | "no" => ((foodOf(id) as Food)[t] ? "yes" : "no");
/** the patch on the paper right now: none (not rubbed), wet, gone (a water patch dried away) or stays (an oily patch) */
export function patchOf(id: FoodId, w: Pick<JW, "rubbed" | "dry">): "none" | "wet" | "gone" | "stays" {
  if (!w.rubbed) return "none";
  if ((foodOf(id) as Food).fat) return w.dry >= DRY ? "stays" : "wet";
  return w.dry >= DRY ? "gone" : "wet";
}

// ───────────────────────────── validate, init ─────────────────────────────
function validate(level: PlayLevel<unknown>): PlayLevel<JaanchParams> | null {
  const p = level.params as Partial<JaanchParams> | null;
  if (!p || !JAANCH_MODES.includes(level.mode as JaanchMode)) return null;
  const mode = level.mode as JaanchMode;
  if (!(GOALS_OF[mode] as readonly string[]).includes(p.goal as string)) return null;
  const goal = p.goal as JaanchGoal, look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || !isInt(p.row) || !isInt(p.lay) || p.lay < 0 || p.lay > 9999 || typeof p.scene !== "string") return null;
  const row = rowsOf(goal)[p.row];
  if (!row || row.look !== look || !row.ctx.includes(p.scene)) return null;
  return { ...level, params: { goal, look, row: p.row, scene: p.scene, lay: p.lay } } as PlayLevel<JaanchParams>;
}
const fresh = (): Pick<JW, "drops" | "rubbed" | "dry" | "lit" | "said"> => ({ drops: 0, rubbed: false, dry: 0, lit: false, said: { starch: "", fat: "" } });
function initW(p: JaanchParams): JW { return { next: 0, res: Array(cardOf(p).length).fill(""), ...fresh() }; }
/** the world for the card's next food (what carries over: the results so far) */
function nextItem(w: JW, result: string): JW {
  const res = w.res.slice(); res[w.next] = result;
  return { ...w, ...fresh(), next: w.next + 1, res };
}
function init(level: PlayLevel<JaanchParams>): JaanchState {
  return { w: initW(level.params), why: "", at: -1, m: "", seen: [], done: false, acts: 0, prev: null, depth: 0 };
}
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── apply (THE LAW) ─────────────────────────────
type Out = { state: JaanchState; moments: Moment[]; refused?: string };
function toolOf(a: JaanchAct): string {
  switch (a.kind) {
    case "use": return a.m;
    case "mark": return `${a.t}:${a.v}`;
    default: return a.kind;
  }
}
function apply(level: PlayLevel<JaanchParams>, s: JaanchState, act: JaanchAct, seq: number): Out {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const tool = toolOf(act);
  if (s.acts === 0) out.push(mom("first_act", seq, { act: tool }));
  const w = s.w, at = w.next, id = foodAt(p, w), food = foodOf(id) as Food, tests = testsOf(p.goal), f: Facts = { food: id };
  const bump = (st: JaanchState): JaanchState => ({ ...st, acts: s.acts + 1 });
  /** a mal-rule's consequence (only when this level maps it; once per level), else the law's plain answer */
  const mal = (mid: string, g: Facts, why: string): Moment => (!(mid in level.mal) || s.seen.includes(mid) ? mom("law_refused", seq, { ...g, why }) : mom("misconception_consequence", seq, g, mid));
  /** refused: the state stays (only the law's answer for the view changes) */
  const no = (code: string, moment?: Moment): Out => {
    const m = moment ?? mom("law_refused", seq, { ...f, why: code, tool });
    out.push(m);
    const seen = m.kind === "misconception_consequence" && m.misconceptionId ? [...s.seen, m.misconceptionId] : s.seen;
    return { state: bump({ ...s, why: code, at, m: tool, seen }), moments: out, refused: code };
  };
  /** accepted: a new world (undoable) */
  const ok = (w2: JW, g: Facts = {}): Out => {
    const done = w2.next >= cardOf(p).length;
    out.push(mom(done ? "solved" : "progress", seq, { tool, ...f, ...g }));
    return { state: bump(pushUndo(s, { ...s, w: w2, why: "", at, m: tool, done })), moments: out };
  };
  /** neela / daag: a food is over once its one test is said; dono waits for Next food */
  const said = (t: Test, v: string): Out => {
    if (p.goal !== "dono") return ok(nextItem(w, v), { test: t, said: v });
    return ok({ ...w, said: { ...w.said, [t]: v } }, { test: t, said: v });
  };

  switch (act.kind) {
    // ── iodine: a drop at a time from the labelled bottle ──
    case "drop": {
      if (!tests.includes("starch")) return no("no_iodine");
      if (w.said.starch) return no("said_already");
      if (w.drops >= DROPMAX) return no("enough");
      return ok({ ...w, drops: w.drops + 1 }, { drops: w.drops + 1 });
    }
    // ── paper: rub (a drop for a liquid), Wait a step at a time, hold it to the light ──
    case "use": {
      if (act.m !== "rub" && act.m !== "wait" && act.m !== "light") return no("no_tool");
      if (!tests.includes("fat")) return no("no_paper");
      if (w.said.fat) return no("said_already");
      if (act.m === "rub") return w.rubbed ? no("rubbed") : ok({ ...w, rubbed: true });
      if (!w.rubbed) return no("rub_first");
      if (act.m === "wait") return w.dry >= DRY ? no("dry_already") : ok({ ...w, dry: w.dry + 1 }, { dry: w.dry + 1 });
      if (w.dry < DRY) return no("dry_first");
      return w.lit ? no("lit") : ok({ ...w, lit: true }, { patch: patchOf(id, w) });
    }
    // ── a result said, only once it has been seen ──
    case "mark": {
      const t = act.t as Test, v = act.v;
      if (!(tests as readonly string[]).includes(t) || (v !== "yes" && v !== "no")) return no("no_mark");
      if (w.said[t]) return no("said_already");
      const g: Facts = { ...f, test: t, said: v };
      if (t === "starch") {
        if (w.drops < FEW) return no("few_drops");
        if (v === truthOf(id, "starch")) return said(t, v);
        // sugar solution said to show starch after it stayed brown: iodine shows starch, not every carbohydrate
        if (id === "sugar") return no("not_sugar", mal("sugar-starch", g, "not_sugar"));
        return no(v === "yes" ? "stayed_brown" : "blue_black", mom("law_refused", seq, { ...g, why: v === "yes" ? "stayed_brown" : "blue_black" }));
      }
      if (!w.rubbed) return no("rub_first");
      if (w.dry < DRY) {
        // a wet patch said to show fat before the paper dried, on a food whose patch dries away
        if (v === "yes" && !food.fat) return no("wet_patch", mal("wet-fat", g, "wet_patch"));
        return no("not_dry");
      }
      if (!w.lit) return no("hold_light");
      if (v === truthOf(id, "fat")) return said(t, v);
      return no(v === "yes" ? "patch_gone" : "patch_stays", mom("law_refused", seq, { ...g, why: v === "yes" ? "patch_gone" : "patch_stays" }));
    }
    // ── dono: Next food, once both are said ──
    case "next": {
      if (p.goal !== "dono") return no("no_next");
      if (w.said.starch && w.said.fat) return ok(nextItem(w, `${w.said.starch},${w.said.fat}`));
      // stopped after one test showed something (one food, one nutrient)
      if (w.said.starch === "yes" || w.said.fat === "yes") return no("test_other", mal("one-only", { ...f, starch: w.said.starch || "none", fat: w.said.fat || "none" }, "test_other"));
      return no("test_both");
    }
    case "done": return no("no_claim");
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<JaanchParams>, s: JaanchState) => s.done;

// ───────────────────────────── solve, shortcut, malActs ─────────────────────────────
const DROP: JaanchAct = { kind: "drop" };
const U = (m: string): JaanchAct => ({ kind: "use", m });
const MARK = (t: Test, v: string): JaanchAct => ({ kind: "mark", t, v });
const NEXT: JaanchAct = { kind: "next" };
const times = (n: number, a: JaanchAct): JaanchAct[] => Array.from({ length: n }, () => a);
const run = (level: PlayLevel<JaanchParams>, acts: JaanchAct[]) => { let s = init(level); for (const a of acts) s = apply(level, s, a, 1).state; return s; };
const iodineActs = (v: string): JaanchAct[] => [...times(FEW, DROP), MARK("starch", v)];
const paperActs = (v: string): JaanchAct[] => [U("rub"), ...times(DRY, U("wait")), U("light"), MARK("fat", v)];
/** the law's own accepted acts for card food i */
function planItem(p: JaanchParams, i: number): JaanchAct[] {
  const id = cardOf(p)[i];
  if (p.goal === "iodine") return iodineActs(truthOf(id, "starch"));
  if (p.goal === "kaagaz") return paperActs(truthOf(id, "fat"));
  return [...iodineActs(truthOf(id, "starch")), ...paperActs(truthOf(id, "fat")), NEXT];
}
const planUpTo = (p: JaanchParams, upTo: number) => Array.from({ length: upTo }, (_, i) => planItem(p, i)).flat();
function solve(level: PlayLevel<JaanchParams>): JaanchAct[] | null {
  const acts = planUpTo(level.params, cardOf(level.params).length);
  return run(level, acts).done ? acts : null;
}
/** idea-free play: one answer for every food; an answer without the test; Next at once */
function shortcut(level: PlayLevel<JaanchParams>): JaanchAct[] | null {
  const p = level.params, n = cardOf(p).length, tries: JaanchAct[][] = [];
  const each = (f: () => JaanchAct[]) => Array.from({ length: n }, () => f()).flat();
  for (const v of ["yes", "no"]) {
    if (p.goal === "iodine") tries.push(each(() => iodineActs(v)), each(() => [MARK("starch", v)]));
    else if (p.goal === "kaagaz") tries.push(each(() => paperActs(v)), each(() => [U("rub"), MARK("fat", v)]));
    else for (const v2 of ["yes", "no"]) tries.push(each(() => [...iodineActs(v), ...paperActs(v2), NEXT]));
  }
  if (p.goal === "dono") tries.push(times(n, NEXT));
  for (const t of tries) if (run(level, t).done) return t;
  return null;
}
function malActs(level: PlayLevel<JaanchParams>, malId: string): JaanchAct[] | null {
  const p = level.params, card = cardOf(p);
  switch (malId) {
    case "sugar-starch": {
      if (p.goal !== "iodine") return null;
      const i = card.indexOf("sugar");
      return i < 0 ? null : [...planUpTo(p, i), ...iodineActs("yes")];
    }
    case "wet-fat": {
      if (p.goal !== "kaagaz") return null;
      const i = card.findIndex((x) => !(foodOf(x) as Food).fat);
      return i < 0 ? null : [...planUpTo(p, i), U("rub"), MARK("fat", "yes")];
    }
    case "one-only": {
      if (p.goal !== "dono") return null;
      const id = card[0], food = foodOf(id) as Food;
      // the first test that shows something, then Next food without the other
      return food.starch ? [...iodineActs("yes"), NEXT] : food.fat ? [...paperActs("yes"), NEXT] : null;
    }
  }
  return null;
}

// ───────────────────────────── generate ─────────────────────────────
interface JaanchGrammar { scenes?: string[] }
const JITTER = 0.24;
function difficultyOf(p: JaanchParams, steps: number): number {
  return Math.max(0, Math.min(1, 0.2 + 0.01 * (steps - 6) + 0.1 * (p.look - 1)));
}
function generate(req: GenRequest): Candidate<JaanchParams>[] {
  const mode = (JAANCH_MODES.includes(req.mode as JaanchMode) ? req.mode : "neela") as JaanchMode;
  const goals = GOALS_OF[mode] as readonly JaanchGoal[];
  const goal = (goals.includes(req.goal as JaanchGoal) ? req.goal : goals[0]) as JaanchGoal;
  const g = req.grammar as JaanchGrammar, rnd = mulberry32(req.seed);
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as Look;
  const scenes = Array.isArray(g.scenes) && g.scenes.length ? g.scenes : null;
  const rows: { row: number; scene: string }[] = [];
  rowsOf(goal).forEach((row, i) => { if (row.look === look) for (const ctx of row.ctx) if (!scenes || scenes.includes(ctx)) rows.push({ row: i, scene: ctx }); });
  // the seed orders the rows (the picker's band and the nudge below then choose among them)
  for (let i = rows.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [rows[i], rows[k]] = [rows[k], rows[i]]; }
  const out: Candidate<JaanchParams>[] = [];
  for (const { row, scene } of rows) {
    const params: JaanchParams = { goal, look, row, scene, lay: Math.floor(rnd() * 10000) };
    const sig = `${mode}:${goal}:${row}:${scene}`;
    const level = {
      v: "play@1", levelId: `jaanch-${sig}-${req.seed}`.replace(/[^a-z0-9:=+._-]/gi, "_"), family: "jaanch", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: scene, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    } as PlayLevel<JaanchParams>;
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
const HIDDEN: Record<JaanchGoal, string[]> = {
  iodine: ["not sugar", "cheeni nahi", "starch only", "only starch"],
  kaagaz: ["dries away", "sookh jaata", "only water", "sirf paani", "stays"],
  dono: ["more than one", "ek se zyada", "several nutrients", "kai poshak"],
};
export function jaanchHidden(level: PlayLevel<unknown>): string[] {
  try { const v = validate(level); return v ? [...HIDDEN[v.params.goal]] : []; } catch { return []; }
}
function facts(level: PlayLevel<JaanchParams>, s: JaanchState): Facts {
  const p = level.params, w = s.w, n = cardOf(p).length, f: Facts = { goal: p.goal, of: n, next: Math.min(w.next, n), food: foodAt(p, w) };
  if (p.goal !== "kaagaz") f.drops = w.drops;
  if (p.goal !== "iodine") { f.patch = patchOf(foodAt(p, w), w); f.lit = w.lit ? "yes" : "no"; }
  if (w.said.starch) f.starch = w.said.starch;
  if (w.said.fat) f.fat = w.said.fat;
  if (s.why) f.why = s.why;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<JaanchParams>, s: JaanchState) {
  return { title: "Jaanch", lines: [`card: ${JSON.stringify(cardOf(level.params))}`, ...Object.entries(s.w).map(([k, v]) => `${k}: ${JSON.stringify(v)}`)] };
}
function grade(level: PlayLevel<JaanchParams>, acts: PlayActEnvelope<JaanchAct>[]): PlayGrade {
  return gradeLevel(jaanchLogic, level, acts, {
    decisiveRefusals: ["not_sugar", "stayed_brown", "blue_black", "wet_patch", "patch_gone", "patch_stays", "test_other"], final: true,
  });
}

export const jaanchLogic: FamilyLogic<JaanchParams, JaanchState, JaanchAct> = {
  family: "jaanch", modes: JAANCH_MODES, malRules: JAANCH_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
