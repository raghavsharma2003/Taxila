// Feeta (फ़ीता, "measuring tape / ribbon") · round 7, length and distance (classes 4-5). Nothing here runs on a clock: the
// child sets a measuring instrument (or puts lengths in order), presses go, and the law answers: plain arithmetic in ONE
// unit (cm for ribbons and ropes, m for fences and trips). Every length the child meets is written as a person writes it
// (2 m 8 cm, 1 km 50 m, 150 cm); the instrument the child sets counts in one unit only, so changing units IS the act.
// Modes and goals:
//   measure/ribbon  a pencil / leaf / key lies along a ruler, from one mark to another (a broken ruler at look 2-3 starts
//                   past 0); cut a ribbon just as long on a whole ruler that starts at 0 (the scissors snap to the cm
//                   marks). Run lays the ribbon beside the object, its end at the object's end: it matches, sticks out or
//                   falls short
//   measure/rope    a rope is ordered as m + cm (2 m 8 cm); pull it off a reel along a tape marked in cm only and cut it.
//                   Run hangs the rope beside a metre stick: whole metres and the rest
//   fence/fence     a garden (a rectangle, a square, an L) on 1 m squares (look 1: only the squares; look 2: the squares
//                   and some side lengths; look 3: only some side lengths, the rest follow from equal sides). Cut the
//                   fence off its roll (a tape in m); run walks the fence round the garden from the gate: it closes, leaves
//                   a gap, or a piece is left over
//   trip/odo        a cycle trip to a place written as km + m (2 km 5 m); the trip meter counts metres only: set it, then
//                   ride. The cycle stops where the meter runs out: at the place, short of it or past it
//   compare/order   three or four ribbons (cm / m) or routes (m / km), each written in its own unit; put them shortest
//                   first on the rack, then run: all are rolled out side by side to one scale (the same speed), so the
//                   order is the law's
// Mal-rules (each a deterministic set-up; a level serves one only where it differs from every other one of the goal's):
//   end-number      ribbon: the length read as the number at the object's end (a broken ruler's start ignored)
//   count-marks     ribbon: the marks under the object counted, not the spaces (one cm too long)
//   m-is-10         rope: 1 m taken as 10 cm (2 m 8 cm → 28 cm)
//   km-100          odo: 1 km taken as 100 m (2 km 350 m → 550 m)
//   concat          odo: the numbers joined side by side (2 km 5 m → 25 m); order: a mixed length read joined (1 km 50 m
//                   as 150 m)
//   labelled-only   fence: only the sides with a number added (a 5 by 3 rectangle → 8 m)
//   area            fence: the squares inside counted (length × width) for the distance around
//   border-squares  fence: the squares along the edge counted, not the unit edges (each corner once, 4 short on a rectangle)
//   ignore-units    order: the bare numbers compared, units ignored (2 km < 500 m; 2 m < 90 cm)
import type { Candidate, Facts, FamilyLogic, FeetaAct, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type FeetaMode = "measure" | "fence" | "trip" | "compare";
export type FeetaGoal = "ribbon" | "rope" | "fence" | "odo" | "order";
/** a pair of units a length is written in: "m" = m + cm (counted in cm), "km" = km + m (counted in m) */
export type UnitPair = "m" | "km";
/** a length as written: `big` of the big unit and `small` of the small one (either may be 0, never both) */
export interface Len { big: number; small: number }
export interface FeetaParams {
  goal: FeetaGoal;
  /** the scaffold (fade): ribbon 1 a whole ruler, 2-3 a broken one; fence 1 squares only, 2 squares + lengths, 3 lengths
   *  only; rope / odo / order: how densely the tape is numbered */
  look: 1 | 2 | 3;
  /** ribbon: the ruler's first mark, the object from mark a to mark b; else 0 */
  from: number; a: number; b: number;
  /** rope / odo / order: the unit pair; else "" */
  u: UnitPair | "";
  /** rope / odo: the length ordered (as written); else 0 */
  big: number; small: number;
  /** the instrument's top (ribbon: the cutting ruler in cm; rope: the tape in cm; fence: the roll in m; odo: the meter in m) */
  max: number;
  /** fence: the plot W × H metres with a notch nw × nh cut from its top-right corner (0 × 0 = a rectangle), the sides
   *  that carry their length, and whether the 1 m squares are drawn; else 0 / [] / false */
  W: number; H: number; nw: number; nh: number; labels: number[]; grid: boolean;
  /** order: the lengths in their lanes (lane = index) */
  items: Len[];
}
export interface FeetaState extends Undoable<FeetaState> {
  /** the instrument's setting (cm / m), 0 = not set */
  at: number;
  /** order: the lane on each slot (shortest first), −1 = empty */
  order: number[];
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const FEETA_MAL = ["end-number", "count-marks", "m-is-10", "km-100", "concat", "labelled-only", "area", "border-squares", "ignore-units"] as const;
const MAL_OF: Record<FeetaGoal, readonly string[]> = {
  ribbon: ["end-number", "count-marks"],
  rope: ["m-is-10", "concat"],
  odo: ["km-100", "concat"],
  fence: ["labelled-only", "area", "border-squares"],
  order: ["ignore-units", "concat"],
};
const GOALS_OF: Record<FeetaMode, readonly FeetaGoal[]> = { measure: ["ribbon", "rope"], fence: ["fence"], trip: ["odo"], compare: ["order"] };
const STRIP_GOALS: readonly FeetaGoal[] = ["ribbon", "rope", "fence", "odo"];
export const stripGoal = (g: FeetaGoal) => STRIP_GOALS.includes(g);
/** the cutting ruler's length (cm) */
export const RULER = 15;

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
/** how many of the small unit make one big unit */
export const per = (u: UnitPair | "") => (u === "km" ? 1000 : 100);
/** the small unit's name, the big unit's name */
export const unitsOf = (u: UnitPair | ""): [string, string] => (u === "km" ? ["km", "m"] : ["m", "cm"]);
/** a length in the small unit */
export const valueOf = (l: Len, u: UnitPair | "") => l.big * per(u) + l.small;
/** "2 km 5 m" · "2 km" · "900 m" (unit words are symbols, the same in every language) */
export function lenText(l: Len, u: UnitPair | ""): string {
  const [B, S] = unitsOf(u);
  if (l.big && l.small) return `${l.big} ${B} ${l.small} ${S}`;
  return l.big ? `${l.big} ${B}` : `${l.small} ${S}`;
}
/** the instrument's unit */
export const stripUnit = (p: Pick<FeetaParams, "goal" | "u">) => (p.goal === "ribbon" || p.goal === "rope" ? "cm" : "m");

// ── the fence's plot ──
/** the plot's corners, clockwise from the top-left (y down); a notch is cut from the top-right corner */
export function corners(p: Pick<FeetaParams, "W" | "H" | "nw" | "nh">): [number, number][] {
  const { W, H, nw, nh } = p;
  if (!nw) return [[0, 0], [W, 0], [W, H], [0, H]];
  return [[0, 0], [W - nw, 0], [W - nw, nh], [W, nh], [W, H], [0, H]];
}
/** each side's length, in the corners' order (side i runs from corner i to corner i + 1) */
export function sideLens(p: Pick<FeetaParams, "W" | "H" | "nw" | "nh">): number[] {
  const c = corners(p);
  return c.map(([x, y], i) => { const [x2, y2] = c[(i + 1) % c.length]; return Math.abs(x2 - x) + Math.abs(y2 - y); });
}
/** is the 1 m square (i, j) part of the plot */
export const inPlot = (p: Pick<FeetaParams, "W" | "H" | "nw" | "nh">, i: number, j: number) => i >= 0 && j >= 0 && i < p.W && j < p.H && !(i >= p.W - p.nw && j < p.nh);
const cellsOf = (p: Pick<FeetaParams, "W" | "H" | "nw" | "nh">) => p.W * p.H - p.nw * p.nh;
/** the squares with at least one side on the boundary */
function borderCells(p: Pick<FeetaParams, "W" | "H" | "nw" | "nh">): number {
  let n = 0;
  for (let i = 0; i < p.W; i++) for (let j = 0; j < p.H; j++) {
    if (!inPlot(p, i, j)) continue;
    if (!inPlot(p, i - 1, j) || !inPlot(p, i + 1, j) || !inPlot(p, i, j - 1) || !inPlot(p, i, j + 1)) n++;
  }
  return n;
}
/** can every side's length be told from the labelled ones (a rectangle's opposite sides are equal; a square's are all) */
function determined(p: Pick<FeetaParams, "W" | "H" | "nw" | "nh" | "labels">): boolean {
  const has = (i: number) => p.labels.includes(i);
  if (!p.nw) return p.W === p.H ? p.labels.length >= 1 : (has(0) || has(2)) && (has(1) || has(3));
  const two = (xs: number[]) => xs.filter(has).length >= 2;
  // the notch's two sides are never both labelled (their labels would share the notch's corner)
  return two([0, 2, 4]) && two([1, 3, 5]) && !(has(1) && has(2));
}

/** the true order: lanes by length, shortest first */
export const lenOrder = (p: Pick<FeetaParams, "items" | "u">) => p.items.map((_, i) => i).sort((a, b) => valueOf(p.items[a], p.u) - valueOf(p.items[b], p.u));

/** THE ANSWER the law compares with: the instrument's setting (cm / m) */
export function want(p: FeetaParams): number {
  switch (p.goal) {
    case "ribbon": return p.b - p.a;
    case "rope": case "odo": return valueOf(p, p.u);
    case "fence": return 2 * (p.W + p.H);
    case "order": return 0;
  }
}
/** a set-up: what the child commits before the run */
export interface Setup { at?: number; order?: number[] }
const sameOrder = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
/** THE judgement of a run */
export function judge(p: FeetaParams, s: Setup): boolean {
  if (stripGoal(p.goal)) return s.at === want(p);
  return !!s.order && sameOrder(s.order, lenOrder(p));
}
function legal(p: FeetaParams, s: Setup): boolean {
  if (stripGoal(p.goal)) return isInt(s.at) && s.at >= 1 && s.at <= p.max;
  return !!s.order && s.order.length === p.items.length && new Set(s.order).size === s.order.length && s.order.every((l) => isInt(l) && l >= 0 && l < p.items.length);
}

/** order mal-rules: the number each belief reads a length as, or null when it has no reading */
function belief(mal: string, l: Len, u: UnitPair | ""): number | null {
  if (mal === "ignore-units") return l.big && l.small ? null : l.big || l.small;
  if (mal === "concat") return l.big && l.small ? Number(`${l.big}${l.small}`) : valueOf(l, u);
  return null;
}
function rawMal(p: FeetaParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  switch (mal) {
    case "end-number": return { at: p.b };
    case "count-marks": return { at: p.b - p.a + 1 };
    case "m-is-10": return p.u === "m" ? { at: p.big * 10 + p.small } : null;
    case "km-100": return p.u === "km" ? { at: p.big * 100 + p.small } : null;
    case "labelled-only": return p.labels.length && p.labels.length < sideLens(p).length ? { at: p.labels.reduce((t, i) => t + sideLens(p)[i], 0) } : null;
    case "area": return { at: cellsOf(p) };
    case "border-squares": return p.grid ? { at: borderCells(p) } : null;
    case "concat": case "ignore-units": {
      if (p.goal !== "order") return p.big && p.small ? { at: Number(`${p.big}${p.small}`) } : null;
      const keys = p.items.map((l) => belief(mal, l, p.u));
      if (keys.some((k) => k === null)) return null;
      const ks = keys as number[];
      const order = p.items.map((_, i) => i).sort((a, b) => ks[a] - ks[b]);
      // a belief that cannot rank two lengths apart names no order
      for (let i = 1; i < order.length; i++) if (ks[order[i]] === ks[order[i - 1]]) return null;
      return { order };
    }
  }
  return null;
}
const sameSetup = (a: Setup, b: Setup) => a.at === b.at && sameOrder(a.order ?? [], b.order ?? []);
/** The set-up a child holding `mal` commits, or null (no reading here, not legal, would solve, or another of the goal's
 *  beliefs commits the very same set-up: a signature names ONE belief) */
export function malSetup(p: FeetaParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  for (const other of MAL_OF[p.goal]) {
    if (other === mal) continue;
    const o = rawMal(p, other);
    if (o && sameSetup(o, m)) return null;
  }
  return m;
}

/** the values the teacher may not say before the child produces them */
export function feetaHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as FeetaParams | null;
  if (!p || typeof p.goal !== "string") return [];
  try {
    if (stripGoal(p.goal)) return [String(want(p))];
    // order: the shortest's lane number, and what each mixed length comes to in one unit
    return [String(lenOrder(p)[0] + 1), ...p.items.filter((l) => l.big && l.small).map((l) => String(valueOf(l, p.u)))];
  } catch { return []; }
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const ZERO = { from: 0, a: 0, b: 0, u: "" as const, big: 0, small: 0, max: 0, W: 0, H: 0, nw: 0, nh: 0, labels: [] as number[], grid: false, items: [] as Len[] };
type ZeroKey = keyof typeof ZERO;
const ROPE_MAX = 400, FENCE_MAX = 60, ODO_MAX = 5000;

function validate(level: PlayLevel<unknown>): PlayLevel<FeetaParams> | null {
  const p = level.params as Partial<FeetaParams> | null, mode = level.mode as FeetaMode;
  if (!p || !GOALS_OF[mode] || !GOALS_OF[mode].includes(p.goal as FeetaGoal)) return null;
  const goal = p.goal as FeetaGoal;
  const look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look) return null;
  const base: FeetaParams = { goal, look, ...ZERO, labels: [], items: [] };
  // every field a goal does not use stays empty (a tampered level never smuggles a second puzzle in)
  const unused = (keys: ZeroKey[]) => keys.every((k) => Array.isArray(ZERO[k]) ? Array.isArray(p[k]) && !(p[k] as unknown[]).length : p[k] === ZERO[k]);
  const ALL: ZeroKey[] = Object.keys(ZERO) as ZeroKey[];
  const others = (used: ZeroKey[]) => unused(ALL.filter((k) => !used.includes(k)));
  if (goal === "ribbon") {
    const { from, a, b, max } = p;
    if (!isInt(from) || !isInt(a) || !isInt(b) || max !== RULER || !others(["from", "a", "b", "max"])) return null;
    // look 1: a whole ruler from 0; look 2-3: a broken one from 1..5. The object never starts at 0 (reading the end
    // number would then be right) and lies on the ruler; 3..12 cm long
    if (look === 1 ? from !== 0 : from < 1 || from > 5) return null;
    if (a < Math.max(1, from) || b > from + RULER || b - a < 3 || b - a > 12) return null;
    return { ...level, params: { ...base, from, a, b, max } } as PlayLevel<FeetaParams>;
  }
  if (goal === "rope" || goal === "odo") {
    const { u, big, small, max } = p;
    if (u !== (goal === "rope" ? "m" : "km") || !isInt(big) || !isInt(small) || !others(["u", "big", "small", "max"])) return null;
    if (max !== (goal === "rope" ? ROPE_MAX : ODO_MAX)) return null;
    // a mixed length: both parts, the small one below one big unit; the whole on the instrument
    if (big < 1 || small < 1 || small >= per(u) || big * per(u) + small >= max) return null;
    return { ...level, params: { ...base, u, big, small, max } } as PlayLevel<FeetaParams>;
  }
  if (goal === "fence") {
    const { W, H, nw, nh, labels, grid, max } = p;
    if (!isInt(W) || !isInt(H) || !isInt(nw) || !isInt(nh) || !Array.isArray(labels) || typeof grid !== "boolean" || max !== FENCE_MAX) return null;
    if (!others(["W", "H", "nw", "nh", "labels", "grid", "max"])) return null;
    if (W < 2 || H < 2 || W > 10 || H > 8 || (nw === 0) !== (nh === 0) || nw < 0 || nh < 0 || nw >= W || nh >= H) return null;
    const n = nw ? 6 : 4;
    if (!labels.every((i) => isInt(i) && i >= 0 && i < n) || new Set(labels).size !== labels.length) return null;
    const ls = [...labels].sort((x, y) => x - y);
    // look 1: the squares alone; look 2: squares and lengths; look 3: lengths alone. With lengths, at least one side is
    // unlabelled (its length follows from the others) and every side can be told
    if (grid !== (look < 3)) return null;
    if (look === 1 ? ls.length !== 0 : !ls.length || ls.length >= n || !determined({ W, H, nw, nh, labels: ls })) return null;
    return { ...level, params: { ...base, W, H, nw, nh, labels: ls, grid, max } } as PlayLevel<FeetaParams>;
  }
  // order: 3-4 lengths in one unit pair, distinct, never already in order
  const { u, items } = p;
  if ((u !== "m" && u !== "km") || !Array.isArray(items) || items.length < 3 || items.length > 4 || !others(["u", "items"])) return null;
  const its: Len[] = [];
  for (const l of items) {
    if (!l || !isInt(l.big) || !isInt(l.small) || l.big < 0 || l.small < 0 || (!l.big && !l.small)) return null;
    if (l.big && l.small >= per(u)) return null;          // a mixed length's small part is below one big unit
    if (l.big > 9 || l.small >= 5 * per(u)) return null;
    its.push({ big: l.big, small: l.small });
  }
  const vals = its.map((l) => valueOf(l, u));
  if (new Set(vals).size !== vals.length) return null;
  if (sameOrder(lenOrder({ items: its, u }), its.map((_, i) => i))) return null;
  return { ...level, params: { ...base, u, items: its } } as PlayLevel<FeetaParams>;
}

function init(level: PlayLevel<FeetaParams>): FeetaState {
  return { at: 0, order: level.params.items.map(() => -1), ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}
const setupOf = (s: FeetaState): Setup => ({ at: s.at, order: s.order });

function apply(level: PlayLevel<FeetaParams>, s: FeetaState, act: FeetaAct, seq: number): { state: FeetaState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: FeetaState): FeetaState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  // any change of the set-up makes the next run a fresh one
  const change = (patch: Partial<FeetaState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  switch (act.kind) {
    case "mark": {
      if (!stripGoal(p.goal)) return no("no_tape");
      const at = Number(act.at);
      if (!isInt(at) || at < 1 || at > p.max) return no("off_tape");
      if (at === s.at) return no("same_mark");
      return change({ at });
    }
    case "put": {
      if (p.goal !== "order") return no("no_rack");
      const lane = Number(act.lane), at = Number(act.at), n = p.items.length;
      if (!isInt(lane) || !isInt(at) || lane < 0 || lane >= n || at < 0 || at >= n) return no("bad_slot");
      const order = [...s.order], from = order.indexOf(lane);
      if (from === at) return no("same_slot");
      if (from >= 0) order[from] = order[at];   // a length already on the rack swaps with the one in that slot
      order[at] = lane;
      return change({ order });
    }
    case "run": {
      if (s.ended) return no("change_first");
      if (stripGoal(p.goal) && !s.at) return no("mark_first");
      if (p.goal === "order" && s.order.some((l) => l < 0)) return no("rack_first");
      const su = setupOf(s), runs = s.runs + 1, ok = judge(p, su);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: p.goal, run: runs };
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) {
        const m = malSetup(p, mal);
        if (m && sameSetup({ ...su, ...m }, su)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      // one unit off (ten metres on a trip) / two neighbours swapped: near
      const off = stripGoal(p.goal) ? Math.abs(s.at - want(p)) <= (p.goal === "odo" ? 10 : 1)
        : s.order.filter((l, i) => l !== lenOrder(p)[i]).length === 2;
      out.push(mom(off ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<FeetaParams>, s: FeetaState) => s.done;

/** the acts that commit a set-up from the level's start, then run */
export function setupActs(p: FeetaParams, su: Setup): FeetaAct[] {
  const acts: FeetaAct[] = [];
  if (stripGoal(p.goal)) acts.push({ kind: "mark", at: su.at ?? 0 });
  else (su.order ?? []).forEach((lane, at) => acts.push({ kind: "put", lane, at }));
  acts.push({ kind: "run" });
  return acts;
}
function solveSetup(p: FeetaParams): Setup { return stripGoal(p.goal) ? { at: want(p) } : { order: lenOrder(p) }; }
function solve(level: PlayLevel<FeetaParams>): FeetaAct[] | null {
  const su = solveSetup(level.params);
  return legal(level.params, su) ? setupActs(level.params, su) : null;
}
/**
 * Set-ups that win without the idea: the ribbon cut at the object's start mark or at the ruler's end; the rope / trip as
 * the big number alone, the small number alone, the two added, the big part alone in the small unit, the instrument's
 * top; the fence as the labelled lengths added, the squares inside, the squares along the edge, twice the longest
 * label; the lanes as they stand, or reversed. A level any of them solves is never served.
 */
export function shortcutSetups(p: FeetaParams): Setup[] {
  const tries: Setup[] = [{ at: p.max }];
  if (p.goal === "ribbon") tries.push({ at: p.a }, { at: p.b - p.from });
  else if (p.goal === "rope" || p.goal === "odo") tries.push({ at: p.big }, { at: p.small }, { at: p.big + p.small }, { at: p.big * per(p.u) });
  else if (p.goal === "fence") {
    const L = sideLens(p);
    tries.push({ at: p.labels.reduce((t, i) => t + L[i], 0) }, { at: cellsOf(p) }, { at: borderCells(p) });
    if (p.labels.length) tries.push({ at: 2 * Math.max(...p.labels.map((i) => L[i])) }, { at: 4 * Math.max(...p.labels.map((i) => L[i])) * (p.W === p.H && !p.nw ? 0 : 1) });
  } else {
    const lanes = p.items.map((_, i) => i);
    tries.push({ order: lanes }, { order: [...lanes].reverse() });
  }
  return tries;
}
function shortcut(level: PlayLevel<FeetaParams>): FeetaAct[] | null {
  const p = level.params;
  for (const t of shortcutSetups(p)) {
    if (stripGoal(p.goal) ? t.at === undefined : !t.order) continue;
    if (legal(p, t) && judge(p, t)) return setupActs(p, t);
  }
  return null;
}
function malActs(level: PlayLevel<FeetaParams>, mal: string): FeetaAct[] | null {
  const m = malSetup(level.params, mal);
  return m ? setupActs(level.params, m) : null;
}

interface FeetaGrammar {
  /** fence: the plots drawn from */
  shapes?: ("rect" | "square" | "L")[];
  /** order: the unit pair and how the lengths are written (big unit only, small unit only, mixed) */
  u?: UnitPair; forms?: ("big" | "small" | "mixed")[];
}
function difficultyOf(p: FeetaParams): number {
  const f = 0.08 * (p.look - 1);
  switch (p.goal) {
    case "ribbon": return Math.min(1, 0.2 + f + (p.from ? 0.1 : 0));
    case "rope": return Math.min(1, 0.3 + f + (p.small < 10 ? 0.1 : 0));
    case "odo": return Math.min(1, 0.35 + f + (p.small < 100 ? 0.1 : 0) + 0.03 * p.big);
    case "fence": return Math.min(1, 0.25 + f + (p.nw ? 0.15 : 0) + 0.01 * (p.W + p.H));
    case "order": return Math.min(1, 0.25 + 0.08 * p.items.length + (p.items.some((l) => l.big && l.small) ? 0.1 : 0));
  }
}
function generate(req: GenRequest): Candidate<FeetaParams>[] {
  const g = req.grammar as FeetaGrammar;
  const mode = (["measure", "fence", "trip", "compare"] as const).find((m) => m === req.mode) ?? "measure";
  const goal = (GOALS_OF[mode].includes(req.goal as FeetaGoal) ? req.goal : GOALS_OF[mode][0]) as FeetaGoal;
  const rnd = mulberry32(req.seed), out: Candidate<FeetaParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const base: FeetaParams = { goal, look, ...ZERO, labels: [], items: [] };
  const mk = (params: FeetaParams, sig: string): Candidate<FeetaParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `feeta-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "feeta", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "feeta", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const shapes = (g.shapes ?? ["rect", "square", "L"]).filter((x) => ["rect", "square", "L"].includes(x));
  const forms = (g.forms ?? ["big", "small"]).filter((x) => ["big", "small", "mixed"].includes(x));
  const ou: UnitPair = g.u === "km" ? "km" : "m";
  for (let k = 0; k < 140 && out.length < 24; k++) {
    let params: FeetaParams | null = null, sig = "";
    if (goal === "ribbon") {
      const from = look === 1 ? 0 : int(1, 5), len = int(3, 12);
      // the object's end mostly inside the cutting ruler's 15 (so the end-number belief can be cut and shows)
      const a = int(Math.max(1, from), Math.min(from + RULER - len, rnd() < 0.75 ? RULER - len : from + RULER - len));
      params = { ...base, from, a, b: a + len, max: RULER }; sig = `ribbon:${from}:${a}:${a + len}`;
    } else if (goal === "rope" || goal === "odo") {
      const u: UnitPair = goal === "rope" ? "m" : "km", r = rnd();
      const big = goal === "rope" ? int(1, 3) : int(1, 4);
      // the probes: a small part below 10 (2 m 8 cm, 2 km 5 m: joining shows), 10..99, and (trip) 100 and up
      const small = goal === "rope" ? (r < 0.2 ? int(1, 9) : int(10, 99)) : r < 0.4 ? int(1, 9) : r < 0.55 ? int(10, 99) : int(100, 999);
      params = { ...base, u, big, small, max: goal === "rope" ? ROPE_MAX : ODO_MAX }; sig = `${goal}:${big}:${small}`;
    } else if (goal === "fence") {
      const shape = pickOf(shapes);
      let W = int(3, look === 3 ? 10 : 8), H = int(2, look === 3 ? 8 : 6), nw = 0, nh = 0;
      if (shape === "square") H = W = int(3, 6);
      if (shape === "L") { W = Math.max(W, 4); H = Math.max(H, 3); nw = int(1, W - 2); nh = int(1, H - 2); }
      if (shape === "rect" && W === H) continue;
      const n = nw ? 6 : 4;
      let labels: number[] = [];
      if (look > 1) {
        // the fewest labels that tell every side (two for a rectangle, one for a square, four for an L), sometimes one more
        const idx = [...Array(n).keys()];
        for (let tries = 0; tries < 30; tries++) {
          const want = shape === "square" ? 1 : shape === "rect" ? 2 : 4;
          const pick = idx.filter(() => rnd() < 0.5).slice(0, want + (rnd() < 0.25 ? 1 : 0));
          if (pick.length >= want && pick.length < n && determined({ W, H, nw, nh, labels: pick })) { labels = pick.sort((x, y) => x - y); break; }
        }
        if (!labels.length) continue;
      }
      params = { ...base, W, H, nw, nh, labels, grid: look < 3, max: FENCE_MAX }; sig = `fence:${W}x${H}:${nw}x${nh}:${labels.join("")}`;
    } else {
      const n = int(3, 4), items: Len[] = [], F = per(ou);
      const mkLen = (form: string): Len => {
        if (form === "big") return { big: int(1, 4), small: 0 };
        if (form === "small") return { big: 0, small: ou === "km" ? (rnd() < 0.6 ? 10 * int(10, 99) : 10 * int(100, 250)) : (rnd() < 0.6 ? int(20, 99) : 5 * int(20, 70)) };
        return { big: int(1, 3), small: ou === "km" ? pickOf([int(5, 9), 10 * int(1, 9), 10 * int(10, 95)]) : pickOf([int(1, 9), int(10, 95)]) };
      };
      // the probes first: a big-unit length with a small number and a small-unit one with a big number but shorter
      // (2 km / 900 m); a mixed length that joined reads short (1 km 50 m / 900 m)
      // one probe per level: a level with a mixed length has no bare-number reading, so the two beliefs take turns
      const mixedProbe = forms.includes("mixed") && (!forms.includes("big") || !forms.includes("small") || rnd() < 0.5);
      const fill = mixedProbe ? forms : forms.filter((x) => x !== "mixed");
      if (!mixedProbe && forms.includes("big") && forms.includes("small")) { const b = int(1, 3); items.push({ big: b, small: 0 }, { big: 0, small: ou === "km" ? 10 * int(30, 95) : int(30, 95) }); }
      if (mixedProbe) { const b = int(1, 2), s = ou === "km" ? 10 * int(1, 9) : int(1, 9); items.push({ big: b, small: s }, { big: 0, small: ou === "km" ? 10 * int(Math.ceil((Number(`${b}${s}`) + 10) / 10), Math.floor((b * F - 10) / 10)) : int(Number(`${b}${s}`) + 1, b * F - 1) }); }
      let guard = 0;
      while (items.length < n && guard++ < 40) {
        const l = mkLen(pickOf(fill.length ? fill : forms));
        if (items.some((x) => valueOf(x, ou) === valueOf(l, ou))) continue;
        items.push(l);
      }
      if (items.length > n) items.length = n;
      if (items.length !== n || new Set(items.map((l) => valueOf(l, ou))).size !== n) continue;
      for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
      params = { ...base, u: ou, items }; sig = `order:${ou}:${items.map((l) => `${l.big}.${l.small}`).join(",")}`;
    }
    if (!params || seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig);
    const v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push(cand);
  }
  return out;
}

function facts(level: PlayLevel<FeetaParams>, s: FeetaState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (stripGoal(p.goal) && s.at) f.mark = `${s.at} ${stripUnit(p)}`;
  if (p.goal === "order") f.placed = s.order.filter((l) => l >= 0).length;
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<FeetaParams>, s: FeetaState) {
  const p = level.params, lines: string[] = [], U = stripUnit(p);
  if (p.goal === "ribbon") lines.push(`object: ${p.a} to ${p.b} on a ruler from ${p.from}`, `ribbon: ${s.at || "–"} ${U}`);
  if (p.goal === "rope" || p.goal === "odo") lines.push(`${p.goal === "rope" ? "rope" : "trip"}: ${lenText(p, p.u)}`, `set: ${s.at || "–"} ${U}`);
  if (p.goal === "fence") { const L = sideLens(p); lines.push(`plot: ${p.W} × ${p.H}${p.nw ? ` less ${p.nw} × ${p.nh}` : ""} m`, `labels: ${p.labels.map((i) => `${L[i]} m`).join(", ") || "squares"}`, `fence: ${s.at || "–"} m`); }
  if (p.goal === "order") { p.items.forEach((l, i) => lines.push(`${i + 1}: ${lenText(l, p.u)}`)); lines.push(`rack: ${s.order.map((l) => (l < 0 ? "–" : l + 1)).join(", ")}`); }
  return { title: "Feeta", lines };
}
function grade(level: PlayLevel<FeetaParams>, acts: PlayActEnvelope<FeetaAct>[]): PlayGrade {
  return gradeLevel(feetaLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const feetaLogic: FamilyLogic<FeetaParams, FeetaState, FeetaAct> = {
  family: "feeta", modes: ["measure", "fence", "trip", "compare"], malRules: FEETA_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
