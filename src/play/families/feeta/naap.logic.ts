// Feeta · naap (नाप, "a measurement") · round 7, science measuring for class 6 (NCERT ch 5 "Measurement of length and
// motion", ch 7 "Heat"). Same family, same law shape as feeta: the child sets things up, presses go, and the law answers;
// nothing runs on a clock (a column that rises or falls is SHOWN settling, never raced). Every fact here is one of the
// topic kit's own expectations; where a mechanic needs a number the kit does not give, the scene keeps it qualitative.
// Modes and goals:
//   thread/curve  a curved line on paper (one straight stretch, the rest bends) from a start dot to an end dot. Take the
//                 thread (it does not stretch), the rubber band or the ruler; press it at the start, at every bend and at
//                 the end; straighten it onto the scale (from 0) and set the reading. A thread pressed only at some points
//                 runs straight across the bends it skipped; a ruler can only lie straight between two points; a rubber
//                 band shrinks back once lifted (shown, its marks closer: a shorter reading that changes each time).
//                 Kit c6-science-ch05-t02: "lay a thread that doesn't stretch along the curve, mark the start and end, then
//                 straighten the thread and measure it with a scale"; "a curved path is longer than the straight line".
//   thread/map    the same on a map: a winding road between two towns, the map's scale (the kit's own form "1 cm = 10 km",
//                 or 20 km); the thread's cm read on the scale, the road's km set on the counter (cm × the scale)
//   thermo/jobs   three or four jobs (a child's temperature; boiling water, chai, fridge water, tap water at the kit's
//                 numbers) each put on the clinical (about 35-42 °C) or the lab thermometer (−10 to 110 °C); the run dips
//                 every one: on its scale the column shows the job, off it the column stops at the scale's end
//   thermo/read   a lab thermometer (1 °C a small division, numbers every 10) dipped into warm water: the column rises and
//                 settles; set the reading and write it down. Taken out first, the column moves away from the water's
//                 reading (shown, no number claimed: it is simply no longer the water's temperature)
//   thermo/fever  three or four children who feel well or not, each a clinical thermometer read in tenths (0.1 °C a small
//                 division); put each on the bench "normal" or "fever"; the run sets them on the class chart, healthy
//                 children around 37 °C (the kit's 36.8 and 37.2 both well; 38.5 °C a fever)
//   scale/ruler   an eraser laid on a ruler with a blank edge before its 0 (look 1-2) or a broken one whose first clear mark
//                 is 2-4 (look 3): slide it to a start, put the eye left of, above or right of its far end, set the length.
//                 The eraser stands up off the marks, so a sightline from the side meets the scale one mark away (shown)
//   scale/foot    a cloth of 1-3 m on the tailor's table and foot-rulers of 30 cm (the kit's "three 30 cm rulers plus a
//                 little extra" for a metre): set how many whole foot-rulers lie along it, then lay them
//   touch/feel    things on a warmth shelf, coldest step first (ties share a step): a steel and a wooden spoon (or the
//                 almirah handle and the door) lying in one room; a cup of hot chai and a bucket of warm water; a bowl both
//                 hands are in, one hand from cold water, one from warm. A hand can feel anything first (it says what it
//                 feels, which can mislead); the run puts a thermometer on each, the shelf takes the thermometers' order
// Mal-rules (verified kit misconception ids only; each a deterministic set-up that does not solve, and no two of a goal's
// beliefs commit the same set-up):
//   curve-cannot  ch05-t02 m1: only the straight stretch measured with the ruler, the bends given up
//   chord         ch05-t02 m2: the thread (or the ruler) straight from the start to the end, the bends skipped
//   band          ch05-t02 m3: the rubber band laid along the whole curve, its shrunk length read
//   clinical-hot  ch07-t02 m1: boiling water / hot chai given to the clinical thermometer
//   read-out      ch07-t02 m2: the lab thermometer taken out of the water, then read
//   exact-37      ch07-t02 m3: every child above 37.0 °C put on the fever bench
//   edge-start    ch05-t01 m1: the eraser lined up with the ruler's edge (not a full mark), its end mark read as the length
//   side-eye      ch05-t01 m3: read from the side: the mark the sideways sightline meets
//   metre-foot    ch05-t01 m2: one foot-ruler for each metre
//   metal-colder  ch07-t01 m1: the steel thing put on a colder step than the wooden thing in the same room
//   heat-temp     ch07-t01 m2: the bucket of warm water put warmer than the cup of hot chai (bigger, more heat)
//   touch-trust   ch07-t01 m3: the bowl put where one hand's feeling says (as warm as the warm bowl, or as cold as the cold)
import type { Candidate, Facts, FamilyLogic, FeetaAct, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type NaapMode = "thread" | "thermo" | "scale" | "touch";
export type NaapGoal = "curve" | "map" | "jobs" | "read" | "fever" | "ruler" | "foot" | "feel";
export const NAAP_MODES: readonly NaapMode[] = ["thread", "thermo", "scale", "touch"];
export const GOALS_OF: Record<NaapMode, readonly NaapGoal[]> = { thread: ["curve", "map"], thermo: ["jobs", "read", "fever"], scale: ["ruler", "foot"], touch: ["feel"] };
export const NAAP_MAL = ["curve-cannot", "chord", "band", "clinical-hot", "read-out", "exact-37", "edge-start", "side-eye", "metre-foot", "metal-colder", "heat-temp", "touch-trust"] as const;
export const MAL_OF: Record<NaapGoal, readonly string[]> = {
  curve: ["curve-cannot", "chord", "band"], map: ["curve-cannot", "chord", "band"],
  jobs: ["clinical-hot"], read: ["read-out"], fever: ["exact-37"],
  ruler: ["edge-start", "side-eye"], foot: ["metre-foot"],
  feel: ["metal-colder", "heat-temp", "touch-trust"],
};

// ── the kit's numbers (each from the topic kit's expectations / items; nothing else is claimed) ──
/** ch07-t02: "its range is about 35 °C to 42 °C"; "usually −10 °C to 110 °C" */
export const CLINICAL = { lo: 35, hi: 42 } as const;
export const LAB = { lo: -10, hi: 110 } as const;
/** thermo/jobs: a child's temperature (about 37 °C), boiling water (the kit's "can't show 100 °C"), chai (its
 *  remediation's "chai at ~80"), fridge water (its item's "about 5 °C"), tap water (its worked example's 26 °C) */
export const JOBS = { body: 37, boil: 100, chai: 80, fridge: 5, tap: 26 } as const;
export type JobId = keyof typeof JOBS;
const HOT: readonly JobId[] = ["boil", "chai"];
/** thermo/fever, in tenths of a degree: the kit's 36.8 and 37.2 (both feel well), about 37, and 38.5 (a fever) */
export const FEVER_TEMPS = [368, 370, 372, 385] as const;
export const isFever = (t: number) => t === 385;
/** scale/foot: "1 foot is about 30 cm" (the kit's three 30 cm rulers along a metre) */
export const FOOT = 30;
/** touch/feel things: g = the story they belong to; rank = the thermometers' order inside it (equal = the same reading) */
export const ITEMS = {
  steelSpoon: { g: "room", rank: 0, metal: true }, woodSpoon: { g: "room", rank: 0, metal: false },
  handle: { g: "room", rank: 0, metal: true }, door: { g: "room", rank: 0, metal: false },
  chai: { g: "chai", rank: 1, metal: false }, bucket: { g: "chai", rank: 0, metal: false },
  cold: { g: "bowls", rank: 0, metal: false }, mid: { g: "bowls", rank: 1, metal: false }, warm: { g: "bowls", rank: 2, metal: false },
} as const;
export type ItemId = keyof typeof ITEMS;
export type FeelKind = "room" | "chai" | "bowls";

// ── params ──
export interface CurveParams { goal: "curve" | "map"; look: 1 | 2 | 3; pts: [number, number][]; bend: number[]; perCm: number; max: number }
export interface JobsParams { goal: "jobs"; look: 1 | 2 | 3; jobs: JobId[] }
export interface ReadParams { goal: "read"; look: 1 | 2 | 3; T: number; lo: number }
export interface FeverParams { goal: "fever"; look: 1 | 2 | 3; temps: number[] }
export interface RulerParams { goal: "ruler"; look: 1 | 2 | 3; len: number; first: number; eye0: number }
export interface FootParams { goal: "foot"; look: 1 | 2 | 3; L: number }
export interface FeelParams { goal: "feel"; look: 1 | 2 | 3; kind: FeelKind; items: ItemId[] }
export type NaapParams = CurveParams | JobsParams | ReadParams | FeverParams | RulerParams | FootParams | FeelParams;

export interface NaapState extends Undoable<NaapState> {
  /** thread: the tool (0 thread, 1 rubber band, 2 ruler), the points pressed (ascending), straightened, how often */
  tool: number; pins: number[]; lifted: boolean; lifts: number;
  /** the reading / count set on the counter (0 = not set) */
  at: number;
  /** jobs / fever / feel: each lane's bin or step (−1 = not placed) */
  place: number[];
  /** read: the thermometer in the water now; ever dipped */
  dipped: boolean; ever: boolean;
  /** ruler: the eraser's left end (cm position; OFF = not on the ruler yet); the eye (−1 left, 0 above, 1 right) */
  start: number; eye: number;
  ended: boolean; runs: number; done: boolean; acts: number;
}
export const OFF = -99;
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const fin = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const r2 = (x: number) => Math.round(x * 100) / 100;

// ───────────────────────────── thread: the curve ─────────────────────────────
const dist = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
/** a piece's length (mm): straight, or a circular arc of sagitta |bend| over its chord */
export function pieceLen(p: Pick<CurveParams, "pts" | "bend">, i: number): number {
  const c = dist(p.pts[i], p.pts[i + 1]), s = Math.abs(p.bend[i]);
  if (s < 1e-9) return c;
  const r = (c * c / 4 + s * s) / (2 * s);
  return 2 * r * Math.asin(Math.min(1, c / (2 * r)));
}
export const curveLen = (p: Pick<CurveParams, "pts" | "bend">) => p.bend.reduce((t, _, i) => t + pieceLen(p, i), 0);
/** the straight stretch (exactly one piece has no bend) */
export const straightOf = (p: Pick<CurveParams, "bend">) => p.bend.findIndex((b) => b === 0);
/** points along piece i (k + 1 of them, from its start point to its end point) */
export function piecePts(p: Pick<CurveParams, "pts" | "bend">, i: number, k = 16): [number, number][] {
  const P = p.pts[i], Q = p.pts[i + 1], s = p.bend[i];
  if (!s) return [P, Q];
  const c = dist(P, Q), mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2;
  const ux = (Q[0] - P[0]) / c, uy = (Q[1] - P[1]) / c, nx = -uy, ny = ux;   // the left normal of P → Q (y down)
  const r = (c * c / 4 + s * s) / (2 * Math.abs(s)), off = s - Math.sign(s) * r;
  const cx = mx + nx * off, cy = my + ny * off;
  const a0 = Math.atan2(P[1] - cy, P[0] - cx), th = 2 * Math.asin(Math.min(1, c / (2 * r)));
  const apex: [number, number] = [mx + nx * s, my + ny * s];
  const at = (d: number, t: number): [number, number] => [cx + r * Math.cos(a0 + d * th * t), cy + r * Math.sin(a0 + d * th * t)];
  const d = dist(at(1, 0.5), apex) < dist(at(-1, 0.5), apex) ? 1 : -1;
  const out: [number, number][] = [];
  for (let j = 0; j <= k; j++) out.push(j === 0 ? P : j === k ? Q : at(d, j / k));
  return out;
}
/** what the tool laid on the pressed points measures (mm): the thread and the band follow the curve between neighbouring
 *  points and run straight across any they skip; the ruler lies straight from its first point to its last */
export function laidLen(p: Pick<CurveParams, "pts" | "bend">, tool: number, pins: readonly number[]): number {
  if (pins.length < 2) return 0;
  if (tool === 2) return dist(p.pts[pins[0]], p.pts[pins[pins.length - 1]]);
  let t = 0;
  for (let k = 1; k < pins.length; k++) { const a = pins[k - 1], b = pins[k]; t += b === a + 1 ? pieceLen(p, a) : dist(p.pts[a], p.pts[b]); }
  return t;
}
/** the rubber band, lifted off the curve, shrinks back: its marks come closer (a different reading each time it is lifted).
 *  Shown on the scale as whole cm so a reading of it is never in doubt; how much it shrinks is the scene's, never a claim */
const SHRINK = [0.8, 0.86, 0.74];
export const bandCm = (laidMm: number, lifts: number) => Math.max(1, Math.round((laidMm / 10) * SHRINK[(Math.max(1, lifts) - 1) % SHRINK.length]));
/** the length the lifted tool shows on the scale (mm) */
export function shownMm(p: CurveParams, s: Pick<NaapState, "tool" | "pins" | "lifts">): number {
  const laid = laidLen(p, s.tool, s.pins);
  return s.tool === 1 ? 10 * bandCm(laid, s.lifts) : laid;
}
const cmOf = (mm: number) => Math.round(mm / 10);
/** THE curve's length (cm) and the goal's answer (cm on paper; km on the map) */
export const curveCm = (p: CurveParams) => cmOf(curveLen(p));
const ans = (p: CurveParams, cm: number) => (p.goal === "map" ? cm * p.perCm : cm);
const allPins = (p: CurveParams) => p.pts.map((_, i) => i);
const same = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

// ───────────────────────────── thermo/read: the lab thermometer ─────────────────────────────
/** out of the water the column moves away from the water's reading (it falls: the water is warmer than the room, the kit's
 *  item); where it settles is the scene's, a few small divisions down, never a claimed number */
export const outOf = (p: ReadParams) => p.T - (3 + (p.T % 3));

// ───────────────────────────── scale/ruler ─────────────────────────────
/** the ruler's left edge (cm position): 1 cm of blank before the 0 of a whole ruler; the worn cm before a broken one's
 *  first clear mark */
export const edgeOf = (p: RulerParams) => (p.first ? p.first - 1 : -1);
export const RULER_TOP = 15;
/** the mark a sightline from the eye meets past the eraser's raised far end: one mark beyond on the far side */
export const sightShift = (eye: number) => -eye;

// ───────────────────────────── judging ─────────────────────────────
/** the answer the counter must show (thread: cm or km; read: °C; ruler: cm; foot: whole foot-rulers) */
export function want(p: NaapParams): number {
  switch (p.goal) {
    case "curve": case "map": return ans(p, curveCm(p));
    case "read": return p.T;
    case "ruler": return p.len;
    case "foot": return Math.floor(p.L / FOOT);
    default: return 0;
  }
}
/** the right bin / step for each lane (jobs: 0 clinical, 1 lab; fever: 0 normal, 1 fever; feel: the thermometers' ranks) */
export function rightPlace(p: JobsParams | FeverParams | FeelParams): number[] {
  if (p.goal === "jobs") return p.jobs.map((j) => (j === "body" ? 0 : 1));
  if (p.goal === "fever") return p.temps.map((t) => (isFever(t) ? 1 : 0));
  return p.items.map((i) => ITEMS[i].rank);
}
const sgn = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);
/** feel: the steps keep the ranks' order (ties for ties) */
const sameOrder = (steps: readonly number[], ranks: readonly number[]) => {
  for (let i = 0; i < ranks.length; i++) for (let j = i + 1; j < ranks.length; j++) if (sgn(steps[i] - steps[j]) !== sgn(ranks[i] - ranks[j])) return false;
  return true;
};
const placeGoal = (p: NaapParams): p is JobsParams | FeverParams | FeelParams => p.goal === "jobs" || p.goal === "fever" || p.goal === "feel";
const lanesOf = (p: NaapParams) => (p.goal === "jobs" ? p.jobs.length : p.goal === "fever" ? p.temps.length : p.goal === "feel" ? p.items.length : 0);
/** how many bins / steps the lanes go on */
export const binsOf = (p: NaapParams) => (p.goal === "feel" ? p.items.length : placeGoal(p) ? 2 : 0);

/** THE judgement of a run */
export function judge(p: NaapParams, s: NaapState): boolean {
  switch (p.goal) {
    case "curve": case "map": return s.tool === 0 && same(s.pins, allPins(p)) && s.lifted && s.at === want(p);
    case "read": return s.dipped && s.at === p.T;
    case "ruler": return s.start !== OFF && s.start >= p.first && s.eye === 0 && s.at === p.len;
    case "foot": return s.at === want(p);
    case "jobs": case "fever": return same(s.place, rightPlace(p));
    case "feel": return s.place.every((x) => x >= 0) && sameOrder(s.place, rightPlace(p));
  }
}
/** does the set-up commit this belief (a matcher, so the same belief is named however the child got there) */
export function holds(p: NaapParams, s: NaapState, mal: string): boolean {
  switch (p.goal) {
    case "curve": case "map": {
      if (!s.lifted) return false;
      const k = straightOf(p), n = p.pts.length - 1;
      if (mal === "chord") return s.tool !== 1 && same(s.pins, [0, n]) && s.at === ans(p, cmOf(dist(p.pts[0], p.pts[n])));
      if (mal === "curve-cannot") return k >= 0 && s.tool === 2 && same(s.pins, [k, k + 1]) && s.at === ans(p, cmOf(pieceLen(p, k)));
      if (mal === "band") return s.tool === 1 && same(s.pins, allPins(p)) && s.at === ans(p, cmOf(shownMm(p, s)));
      return false;
    }
    case "read": return mal === "read-out" && !s.dipped && s.ever && s.at === outOf(p);
    case "jobs": return mal === "clinical-hot" && p.jobs.some((j) => HOT.includes(j)) && same(s.place, p.jobs.map((j) => (j === "body" || HOT.includes(j) ? 0 : 1)));
    case "fever": return mal === "exact-37" && p.temps.some((t) => t > 370 && !isFever(t)) && same(s.place, p.temps.map((t) => (t > 370 ? 1 : 0)));
    case "ruler": {
      if (s.start === OFF) return false;
      if (mal === "edge-start") return s.start === edgeOf(p) && s.eye === 0 && s.at === edgeOf(p) + p.len;
      if (mal === "side-eye") return s.start >= p.first && s.eye !== 0 && s.at === p.len + sightShift(s.eye);
      return false;
    }
    case "foot": return mal === "metre-foot" && p.L % 100 === 0 && s.at === p.L / 100;
    case "feel": {
      if (s.place.some((x) => x < 0)) return false;
      const st = (id: ItemId) => s.place[p.items.indexOf(id)];
      if (mal === "metal-colder" && p.kind === "room") {
        const metal = p.items.filter((i) => ITEMS[i].metal), wood = p.items.filter((i) => !ITEMS[i].metal);
        return metal.every((m) => wood.every((w) => st(m) < st(w))) && metal.every((a) => metal.every((b) => st(a) === st(b))) && wood.every((a) => wood.every((b) => st(a) === st(b)));
      }
      if (mal === "heat-temp" && p.kind === "chai") return st("bucket") > st("chai");
      if (mal === "touch-trust" && p.kind === "bowls") return st("cold") < st("warm") && (st("mid") === st("warm") || st("mid") === st("cold"));
      return false;
    }
  }
}

/** the values the teacher may not say before the child produces them */
export function naapHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as NaapParams | null;
  if (!p || typeof p.goal !== "string") return [];
  try {
    switch (p.goal) {
      case "curve": return [String(curveCm(p))];
      case "map": return [String(want(p)), String(curveCm(p))];
      case "read": case "ruler": case "foot": return [String(want(p))];
      case "fever": return [...new Set(p.temps.map((t) => (t / 10).toFixed(1)))];
      case "jobs": return p.look > 1 ? [...new Set(p.jobs.filter((j) => j !== "body").map((j) => String(JOBS[j])))] : [];
      default: return [];
    }
  } catch { return []; }
}

// ───────────────────────────── validate ─────────────────────────────
const LOOKS = [1, 2, 3];
function validate(level: PlayLevel<unknown>): PlayLevel<NaapParams> | null {
  const q = level.params as Record<string, unknown> | null, mode = level.mode as NaapMode;
  if (!q || !GOALS_OF[mode] || !GOALS_OF[mode].includes(q.goal as NaapGoal)) return null;
  const goal = q.goal as NaapGoal, look = q.look as 1 | 2 | 3;
  if (!LOOKS.includes(look)) return null;
  const keys = (ks: string[]) => Object.keys(q).length === ks.length + 2 && ks.every((k) => k in q);
  const ok = (params: NaapParams) => ({ ...level, params } as PlayLevel<NaapParams>);
  switch (goal) {
    case "curve": case "map": {
      if (!keys(["pts", "bend", "perCm", "max"])) return null;
      const { pts, bend, perCm, max } = q as unknown as CurveParams;
      if (!Array.isArray(pts) || !Array.isArray(bend) || pts.length < 4 || pts.length > 7 || bend.length !== pts.length - 1) return null;
      if (!pts.every((x) => Array.isArray(x) && x.length === 2 && fin(x[0]) && fin(x[1]) && x[0] >= 0 && x[0] <= 220 && x[1] >= 0 && x[1] <= 90)) return null;
      if (!bend.every((b) => fin(b))) return null;
      if (bend.filter((b) => b === 0).length !== 1) return null;
      // each bend at most a half circle; neighbouring points far enough apart to be pressed one at a time
      for (let i = 0; i < bend.length; i++) { const c = dist(pts[i], pts[i + 1]); if (c < 34 || Math.abs(bend[i]) > c / 2) return null; }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (dist(pts[i], pts[j]) < 34) return null;
      if (goal === "curve" ? perCm !== 0 || max !== CURVE_MAX : (perCm !== 10 && perCm !== 20) || max !== MAP_MAX) return null;
      const p: CurveParams = { goal, look, pts: pts.map(([x, y]) => [x, y] as [number, number]), bend: [...bend], perCm, max };
      const L = curveLen(p);
      // the curve is a whole number of cm (to half a mm), between 12 and 20 cm
      if (Math.abs(L - 10 * Math.round(L / 10)) > 0.5 || L < 120 || L > 200) return null;
      return ok(p);
    }
    case "jobs": {
      if (!keys(["jobs"])) return null;
      const { jobs } = q as unknown as JobsParams;
      if (!Array.isArray(jobs) || jobs.length < 3 || jobs.length > 4 || !jobs.every((j) => typeof j === "string" && j in JOBS)) return null;
      const bodies = jobs.filter((j) => j === "body").length, liquids = jobs.filter((j) => j !== "body");
      if (bodies < 1 || bodies > 2 || !liquids.length || new Set(liquids).size !== liquids.length) return null;
      return ok({ goal, look, jobs: [...jobs] });
    }
    case "read": {
      if (!keys(["T", "lo"])) return null;
      const { T, lo } = q as unknown as ReadParams;
      // warm water: a reading between two numbered marks (never on one), the window numbered every 10 around it
      if (!isInt(T) || !isInt(lo) || T < 31 || T > 49 || T % 10 === 0 || lo % 10 !== 0 || T - lo < 6 || T - lo > 19) return null;
      return ok({ goal, look, T, lo });
    }
    case "fever": {
      if (!keys(["temps"])) return null;
      const { temps } = q as unknown as FeverParams;
      if (!Array.isArray(temps) || temps.length < 3 || temps.length > 4 || !temps.every((t) => (FEVER_TEMPS as readonly number[]).includes(t as number))) return null;
      const f = temps.filter(isFever).length;
      if (f < 1 || f > 2 || f === temps.length) return null;
      return ok({ goal, look, temps: [...temps] });
    }
    case "ruler": {
      if (!keys(["len", "first", "eye0"])) return null;
      const { len, first, eye0 } = q as unknown as RulerParams;
      if (!isInt(len) || !isInt(first) || (eye0 !== -1 && eye0 !== 1)) return null;
      // look 1-2 a whole ruler (blank before its 0); look 3 a broken one from 2-4
      if (look < 3 ? first !== 0 : first < 2 || first > 4) return null;
      if (len < 3 || len > 9 || first + len > RULER_TOP) return null;
      return ok({ goal, look, len, first, eye0 });
    }
    case "foot": {
      if (!keys(["L"])) return null;
      const { L } = q as unknown as FootParams;
      if (!isInt(L) || L < 100 || L > 300 || L % 50 !== 0) return null;
      return ok({ goal, look, L });
    }
    case "feel": {
      if (!keys(["kind", "items"])) return null;
      const { kind, items } = q as unknown as FeelParams;
      if (kind !== "room" && kind !== "chai" && kind !== "bowls") return null;
      if (!Array.isArray(items) || !items.every((i) => typeof i === "string" && i in ITEMS && ITEMS[i as ItemId].g === kind) || new Set(items).size !== items.length) return null;
      const need = kind === "room" ? [2, 4] : kind === "chai" ? [2] : [3];
      if (!need.includes(items.length)) return null;
      if (kind === "room") {
        // pairs from one room: a metal thing and a wooden thing each time
        const metal = items.filter((i) => ITEMS[i as ItemId].metal).length;
        if (metal * 2 !== items.length) return null;
      }
      return ok({ goal, look, kind, items: [...items] as ItemId[] });
    }
  }
  return null;
}
export const CURVE_MAX = 22, MAP_MAX = 999;

function init(level: PlayLevel<NaapParams>): NaapState {
  const p = level.params;
  return { tool: -1, pins: [], lifted: false, lifts: 0, at: 0, place: Array(lanesOf(p)).fill(-1), dipped: false, ever: false,
    start: OFF, eye: p.goal === "ruler" ? p.eye0 : 0, ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}

/** the counter's top for a goal */
export function counterMax(p: NaapParams): number {
  switch (p.goal) {
    case "curve": case "map": return p.max;
    case "read": return 99;   // warm water reads below 50: two wheels
    case "ruler": return RULER_TOP;
    case "foot": return 20;
    default: return 0;
  }
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

function apply(level: PlayLevel<NaapParams>, s: NaapState, act: FeetaAct, seq: number): { state: NaapState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: NaapState): NaapState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const change = (patch: Partial<NaapState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  const thread = p.goal === "curve" || p.goal === "map";
  switch (act.kind) {
    case "tool": {
      if (!thread) return no("no_tool");
      const t = Number(act.t);
      if (!isInt(t) || t < 0 || t > 2) return no("bad_tool");
      if (s.lifted) return no("lay_again_first");
      if (t === s.tool) return no("same_tool");
      return change({ tool: t, pins: [] });
    }
    case "pin": {
      if (!thread) return no("no_curve");
      const cp = p as CurveParams, i = Number(act.i);
      if (!isInt(i) || i < 0 || i >= cp.pts.length) return no("off_curve");
      if (s.tool < 0) return no("tool_first");
      if (s.lifted) return no("lay_again_first");
      const has = s.pins.includes(i);
      // a ruler is straight: it rests on two points only
      if (!has && s.tool === 2 && s.pins.length >= 2) return no("ruler_straight");
      const pins = has ? s.pins.filter((x) => x !== i) : [...s.pins, i].sort((a, b) => a - b);
      return change({ pins });
    }
    case "lift": {
      if (!thread) return no("no_curve");
      if (!s.lifted && s.pins.length < 2) return no("press_first");
      return s.lifted ? change({ lifted: false, at: 0 }) : change({ lifted: true, lifts: s.lifts + 1, at: 0 });
    }
    case "dip": {
      if (p.goal !== "read") return no("no_liquid");
      return change({ dipped: !s.dipped, ever: true });
    }
    case "slide": {
      if (p.goal !== "ruler") return no("no_ruler");
      const at = Number(act.at);
      if (!isInt(at) || at < edgeOf(p) || at > RULER_TOP - p.len) return no("off_ruler");
      if (at === s.start) return no("same_place");
      return change({ start: at });
    }
    case "eye": {
      if (p.goal !== "ruler") return no("no_ruler");
      const at = Number(act.at);
      if (at !== -1 && at !== 0 && at !== 1) return no("bad_eye");
      if (at === s.eye) return no("same_eye");
      return change({ eye: at });
    }
    case "mark": {
      const top = counterMax(p);
      if (!top) return no("no_counter");
      if (thread && !s.lifted) return no("lift_first");
      const at = Number(act.at);
      if (!isInt(at) || at < 1 || at > top) return no("off_counter");
      if (at === s.at) return no("same_mark");
      return change({ at });
    }
    case "put": {
      if (!placeGoal(p)) return no("no_bins");
      const lane = Number(act.lane), at = Number(act.at);
      if (!isInt(lane) || !isInt(at) || lane < 0 || lane >= lanesOf(p) || at < 0 || at >= binsOf(p)) return no("bad_slot");
      if (s.place[lane] === at) return no("same_slot");
      const place = [...s.place]; place[lane] = at;
      return change({ place });
    }
    case "run": {
      if (s.ended) return no("change_first");
      if (thread && !s.lifted) return no("lift_first");
      if (p.goal === "read" && !s.ever) return no("dip_first");
      if (p.goal === "ruler" && s.start === OFF) return no("place_first");
      if (counterMax(p) && !s.at) return no("mark_first");
      if (placeGoal(p) && s.place.some((x) => x < 0)) return no("place_all_first");
      const runs = s.runs + 1, ok = judge(p, s);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: p.goal, run: runs };
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) if (MAL_OF[p.goal].includes(mal) && holds(p, s, mal)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      out.push(mom(nearOf(p, s) ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
/** one step off: the counter one unit away (a map: one scale step) with the method right; one lane misplaced */
function nearOf(p: NaapParams, s: NaapState): boolean {
  switch (p.goal) {
    case "curve": case "map": return s.tool === 0 && same(s.pins, allPins(p)) && Math.abs(s.at - want(p)) <= (p.goal === "map" ? p.perCm : 1);
    case "read": return s.dipped && Math.abs(s.at - p.T) <= 1;
    case "ruler": return s.start >= p.first && s.eye === 0 && Math.abs(s.at - p.len) <= 1;
    case "foot": return Math.abs(s.at - want(p)) <= 1;
    case "jobs": case "fever": { const r = rightPlace(p); return s.place.filter((x, i) => x !== r[i]).length === 1; }
    case "feel": return false;
  }
}
const goalMet = (_l: PlayLevel<NaapParams>, s: NaapState) => s.done;

// ───────────────────────────── set-ups as acts ─────────────────────────────
/** a set-up the child commits (only the fields its goal uses) */
export interface Setup { tool?: number; pins?: number[]; at?: number; place?: number[]; out?: boolean; start?: number; eye?: number }
export function setupActs(p: NaapParams, su: Setup): FeetaAct[] {
  const acts: FeetaAct[] = [];
  switch (p.goal) {
    case "curve": case "map":
      acts.push({ kind: "tool", t: su.tool ?? 0 });
      for (const i of su.pins ?? []) acts.push({ kind: "pin", i });
      acts.push({ kind: "lift" });
      break;
    case "read":
      acts.push({ kind: "dip" });
      if (su.out) acts.push({ kind: "dip" });
      break;
    case "ruler":
      acts.push({ kind: "slide", at: su.start ?? p.first });
      if ((su.eye ?? 0) !== p.eye0) acts.push({ kind: "eye", at: su.eye ?? 0 });
      break;
    case "jobs": case "fever": case "feel":
      (su.place ?? []).forEach((at, lane) => acts.push({ kind: "put", lane, at }));
      break;
  }
  if (su.at !== undefined) acts.push({ kind: "mark", at: su.at });
  acts.push({ kind: "run" });
  return acts;
}
/** replay a set-up's acts from the start (no refusal but the run's own "missed") */
function replay(level: PlayLevel<NaapParams>, acts: FeetaAct[]): { s: NaapState; ms: Moment[]; refused: string[] } {
  let s = init(level); const ms: Moment[] = [], refused: string[] = [];
  acts.forEach((a, i) => { const r = apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); });
  return { s, ms, refused };
}
function solveSetup(p: NaapParams): Setup {
  switch (p.goal) {
    case "curve": case "map": return { tool: 0, pins: allPins(p), at: want(p) };
    case "read": return { at: p.T };
    case "ruler": return { start: p.first, eye: 0, at: p.len };
    case "foot": return { at: want(p) };
    default: return { place: rightPlace(p) };
  }
}
function solve(level: PlayLevel<NaapParams>): FeetaAct[] | null {
  const acts = setupActs(level.params, solveSetup(level.params)), r = replay(level, acts);
  return r.s.done && !r.refused.length ? acts : null;
}
/** the set-up a child holding `mal` commits (before checking it lands on that belief alone) */
function rawMal(p: NaapParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  switch (p.goal) {
    case "curve": case "map": {
      const n = p.pts.length - 1, k = straightOf(p);
      if (mal === "chord") return { tool: 0, pins: [0, n], at: ans(p, cmOf(dist(p.pts[0], p.pts[n]))) };
      if (mal === "curve-cannot") return k < 0 ? null : { tool: 2, pins: [k, k + 1], at: ans(p, cmOf(pieceLen(p, k))) };
      if (mal === "band") return { tool: 1, pins: allPins(p), at: ans(p, bandCm(curveLen(p), 1)) };
      return null;
    }
    case "read": return { out: true, at: outOf(p) };
    case "jobs": return p.jobs.some((j) => HOT.includes(j)) ? { place: p.jobs.map((j) => (j === "body" || HOT.includes(j) ? 0 : 1)) } : null;
    case "fever": return { place: p.temps.map((t) => (t > 370 ? 1 : 0)) };
    case "ruler":
      if (mal === "edge-start") return { start: edgeOf(p), eye: 0, at: edgeOf(p) + p.len };
      return { start: p.first, eye: p.eye0, at: p.len + sightShift(p.eye0) };
    case "foot": return p.L % 100 === 0 ? { at: p.L / 100 } : null;
    case "feel": {
      const r = rightPlace(p);
      if (mal === "metal-colder") return p.kind === "room" ? { place: p.items.map((i) => (ITEMS[i].metal ? 0 : 1)) } : null;
      if (mal === "heat-temp") return p.kind === "chai" ? { place: p.items.map((i) => (i === "bucket" ? 1 : 0)) } : null;
      // the hand from the cold water says the bowl is warm: as warm as the warm bowl
      if (mal === "touch-trust") return p.kind === "bowls" ? { place: p.items.map((i, j) => (i === "mid" ? r[p.items.indexOf("warm")] : r[j])) } : null;
      return null;
    }
  }
}
/** the acts of a child holding `mal`, or null: no reading here, not legal, would solve, or another of the goal's beliefs
 *  holds for the very same set-up (a signature names ONE belief) */
export function naapMalActs(level: PlayLevel<NaapParams>, mal: string): FeetaAct[] | null {
  const p = level.params, su = rawMal(p, mal);
  if (!su) return null;
  const acts = setupActs(p, su);
  const r = replay({ ...level, mal: { [mal]: "x" } }, acts);
  if (r.s.done || r.refused.length !== 1 || r.refused[0] !== "missed") return null;
  if (!r.ms.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === mal)) return null;
  if (MAL_OF[p.goal].some((o) => o !== mal && holds(p, r.s, o))) return null;
  return acts;
}
/**
 * Set-ups that win without the idea; a level any of them solves is never served: the thread straight end to end or on the
 * straight stretch; the counter at the scale's top; read: a numbered mark; ruler: a broken ruler's far-end mark, the end
 * mark from the edge; foot: the metres, ten a metre; jobs / fever: everything on one bin; feel: everything on one step
 * (except in a room story, where that is the answer).
 */
export function shortcutSetups(p: NaapParams): Setup[] {
  switch (p.goal) {
    case "curve": case "map": {
      const n = p.pts.length - 1, k = straightOf(p), out: Setup[] = [{ tool: 0, pins: [0, n], at: ans(p, cmOf(dist(p.pts[0], p.pts[n]))) }, { tool: 0, pins: allPins(p), at: p.goal === "map" ? 100 : p.max }];
      if (k >= 0) out.push({ tool: 0, pins: [k, k + 1], at: ans(p, cmOf(pieceLen(p, k))) });
      return out;
    }
    case "read": return [p.lo, p.lo + 10, p.lo + 20].map((at) => ({ at }));
    // a broken ruler's far-end mark read as the length (on a whole ruler from 0 that IS the reading, so it is no shortcut)
    case "ruler": return [...(p.first ? [{ start: p.first, eye: 0, at: p.first + p.len }] : []), { start: edgeOf(p), eye: 0, at: p.len + edgeOf(p) }];
    case "foot": return [{ at: Math.round(p.L / 100) }, { at: p.L / 10 }].filter((x) => isInt(x.at) && x.at >= 1 && x.at <= 20);
    case "jobs": case "fever": { const n = lanesOf(p); return [{ place: Array(n).fill(0) }, { place: Array(n).fill(1) }]; }
    case "feel": return [{ place: Array(lanesOf(p)).fill(0) }];
  }
}
function shortcut(level: PlayLevel<NaapParams>): FeetaAct[] | null {
  const p = level.params;
  for (const su of shortcutSetups(p)) {
    // "everything on one step" is the answer of a room story (the idea itself), never its shortcut
    if (p.goal === "feel" && p.kind === "room" && su.place?.every((x) => x === su.place?.[0])) continue;
    const acts = setupActs(p, su);
    if (replay(level, acts).s.done) return acts;
  }
  return null;
}

// ───────────────────────────── generate ─────────────────────────────
interface NaapGrammar { kinds?: FeelKind[]; scales?: number[] }
const JITTER = 0.2, clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function shuffle<T>(xs: T[], rnd: () => number): T[] { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/** a curve from left to right: n pieces, one of them (the first or the last) straight, the rest bending to alternate sides;
 *  scaled so it is a whole number of cm */
function makeCurve(rnd: () => number, int: (a: number, b: number) => number): { pts: [number, number][]; bend: number[] } | null {
  const n = int(3, 4), st = rnd() < 0.5 ? 0 : n - 1;
  const pts: [number, number][] = [[0, int(30, 60)]];
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    pts.push([x + (n === 3 ? int(40, 56) : int(36, 46)), Math.max(10, Math.min(80, y + (rnd() < 0.5 ? -1 : 1) * int(0, 22)))]);
  }
  let side = rnd() < 0.5 ? 1 : -1;
  const bend = pts.slice(1).map((q, i) => { if (i === st) return 0; side = -side; return side * dist(pts[i], q) * (0.22 + 0.2 * rnd()); });
  const L0 = curveLen({ pts, bend }), target = Math.round(L0 / 10) * 10, f = target / L0;
  const sp = pts.map(([x, y]) => [r2(x * f), r2(y * f)] as [number, number]), sb = bend.map((b) => r2(b * f));
  // centre the curve in its 0..220 × 0..90 paper, bulges included
  const all = sb.flatMap((_, i) => piecePts({ pts: sp, bend: sb }, i, 12));
  const minX = Math.min(...all.map((q) => q[0])), maxX = Math.max(...all.map((q) => q[0])), minY = Math.min(...all.map((q) => q[1])), maxY = Math.max(...all.map((q) => q[1]));
  if (maxX - minX > 200 || maxY - minY > 78) return null;
  const dx = (220 - (maxX + minX)) / 2, dy = (90 - (maxY + minY)) / 2;
  const out = sp.map(([x, y]) => [r2(x + dx), r2(y + dy)] as [number, number]);
  // the two ends in the paper's middle band (their labels go above or below them)
  if ([out[0], out[out.length - 1]].some(([, y]) => y < 25 || y > 65)) return null;
  return { pts: out, bend: sb };
}
/** a probe value read off the scale must sit clear of a half cm (so its reading is never in doubt) */
const clear = (mm: number) => Math.abs(((mm / 10) % 1) - 0.5) > 0.15;

function difficultyOf(p: NaapParams): number {
  const f = 0.08 * (p.look - 1);
  switch (p.goal) {
    case "curve": return 0.3 + f + 0.04 * p.pts.length;
    case "map": return 0.4 + f + 0.04 * p.pts.length + (p.perCm === 20 ? 0.05 : 0);
    case "jobs": return 0.3 + f + 0.05 * p.jobs.length;
    case "read": return 0.3 + f + ((p.T % 10) >= 4 && (p.T % 10) <= 6 ? 0.1 : 0);
    case "fever": return 0.3 + f + 0.05 * p.temps.length;
    case "ruler": return 0.3 + f + 0.02 * p.len;
    case "foot": return 0.3 + f + 0.03 * (p.L / 50);
    case "feel": return 0.3 + f + (p.kind === "bowls" ? 0.1 : 0) + 0.03 * p.items.length;
  }
}
function generate(req: GenRequest): Candidate<NaapParams>[] {
  const g = (req.grammar ?? {}) as NaapGrammar;
  const mode = NAAP_MODES.find((m) => m === req.mode) ?? "thread";
  const goal = (GOALS_OF[mode].includes(req.goal as NaapGoal) ? req.goal : GOALS_OF[mode][0]) as NaapGoal;
  const rnd = mulberry32(req.seed), out: Candidate<NaapParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const mk = (params: NaapParams, sig: string): Candidate<NaapParams> => ({
    signature: sig,
    // a seeded nudge (± JITTER / 2): the picker takes the level nearest its band, so without it every child met the same
    // first level
    difficulty: clamp01(difficultyOf(params) + (rnd() - 0.5) * JITTER),
    level: { v: "play@1", levelId: `feeta-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_").slice(0, 120), family: "feeta", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "feeta", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const kinds = (g.kinds ?? ["room", "chai", "bowls"]).filter((k) => k === "room" || k === "chai" || k === "bowls");
  const scales = (g.scales ?? [10, 20]).filter((x) => x === 10 || x === 20);
  for (let k = 0; k < 160 && out.length < 24; k++) {
    let params: NaapParams | null = null, sig = "";
    if (goal === "curve" || goal === "map") {
      const c = makeCurve(rnd, int);
      if (!c) continue;
      const p: CurveParams = { goal, look, ...c, perCm: goal === "map" ? scales[int(0, scales.length - 1)] ?? 10 : 0, max: goal === "map" ? MAP_MAX : CURVE_MAX };
      const n = p.pts.length - 1, chord = dist(p.pts[0], p.pts[n]), stLen = pieceLen(p, straightOf(p)), L = curveCm(p);
      // the beliefs read apart: the chord, the straight stretch and the shrunk band all clear of a half cm and distinct
      const vals = [L, cmOf(chord), cmOf(stLen), bandCm(curveLen(p), 1)];
      if (!clear(chord) || !clear(stLen) || new Set(vals).size !== 4 || L - cmOf(chord) < 2) continue;
      params = p; sig = `${goal}:${p.perCm}:${p.pts.map((q) => q.map(Math.round).join(".")).join("-")}`;
    } else if (goal === "jobs") {
      const liquids = shuffle(["boil", "chai", "fridge", "tap"] as JobId[], rnd);
      const n = int(3, 4), bodies = n === 4 && rnd() < 0.4 ? 2 : 1;
      let ls = liquids.slice(0, n - bodies);
      // most levels carry a hot job (boiling water or chai), where the clinical-for-everything belief shows
      if (!ls.some((j) => HOT.includes(j)) && rnd() < 0.85) ls = [liquids.find((j) => HOT.includes(j)) as JobId, ...ls.slice(1)];
      const jobs = shuffle([...Array(bodies).fill("body"), ...ls] as JobId[], rnd);
      params = { goal, look, jobs }; sig = `jobs:${jobs.join(",")}`;
    } else if (goal === "read") {
      const T = int(31, 49);
      if (T % 10 === 0) continue;
      const los = [T - 19, T - 6].map((x) => Math.ceil(x / 10) * 10).filter((lo, i, a) => a.indexOf(lo) === i && T - lo >= 6 && T - lo <= 19);
      const lo = los[int(0, los.length - 1)];
      if (lo === undefined) continue;
      params = { goal, look, T, lo }; sig = `read:${T}:${lo}`;
    } else if (goal === "fever") {
      const n = int(3, 4), f = n === 4 && rnd() < 0.35 ? 2 : 1, well = [370, 368, 372];
      const temps: number[] = [...Array(f).fill(385)];
      // most levels carry a well child just above 37.0 (where the exactly-37 belief shows)
      if (rnd() < 0.85) temps.push(372);
      while (temps.length < n) temps.push(well[int(0, 2)]);
      const ts = shuffle(temps, rnd);
      params = { goal, look, temps: ts }; sig = `fever:${ts.join(",")}`;
    } else if (goal === "ruler") {
      const first = look === 3 ? int(2, 4) : 0, len = int(3, Math.min(9, RULER_TOP - first)), eye0 = rnd() < 0.5 ? -1 : 1;
      params = { goal, look, len, first, eye0 }; sig = `ruler:${first}:${len}:${eye0}`;
    } else if (goal === "foot") {
      // whole metres mostly (where one-foot-a-metre shows), half metres sometimes
      const L = rnd() < 0.75 ? 100 * int(1, 3) : 50 * (2 * int(1, 2) + 1);
      params = { goal, look, L }; sig = `foot:${L}:${look}`;
    } else {
      const kind = kinds[int(0, kinds.length - 1)] ?? "room";
      let items: ItemId[];
      if (kind === "room") items = rnd() < 0.3 ? ["steelSpoon", "woodSpoon", "handle", "door"] : rnd() < 0.6 ? ["steelSpoon", "woodSpoon"] : ["handle", "door"];
      else if (kind === "chai") items = ["chai", "bucket"];
      else items = ["cold", "mid", "warm"];
      items = shuffle(items, rnd);
      params = { goal, look, kind, items }; sig = `feel:${kind}:${items.join(",")}`;
    }
    if (!params || seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig), v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push(cand);
  }
  return out;
}

// ───────────────────────────── facts / board / grade ─────────────────────────────
export const TOOLS = ["thread", "band", "ruler"] as const;
function facts(level: PlayLevel<NaapParams>, s: NaapState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if ((p.goal === "curve" || p.goal === "map") && s.tool >= 0) { f.tool = TOOLS[s.tool]; f.pressed = s.pins.length; if (s.lifted) f.on_scale = `${Math.round(shownMm(p, s)) / 10} cm`; }
  if (p.goal === "read") f.in_water = s.dipped ? "yes" : "no";
  if (p.goal === "ruler" && s.start !== OFF) { f.start = s.start; f.eye = ["left", "above", "right"][s.eye + 1]; }
  if (s.at) f.reading = s.at;
  if (placeGoal(p)) f.placed = s.place.filter((x) => x >= 0).length;
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<NaapParams>, s: NaapState) {
  const p = level.params, lines: string[] = [];
  switch (p.goal) {
    case "curve": case "map":
      lines.push(`a curve from the start dot to the end dot${p.goal === "map" ? `; map scale 1 cm = ${p.perCm} km` : ""}`, `tool: ${s.tool >= 0 ? TOOLS[s.tool] : "–"}; pressed at ${s.pins.length} of ${p.pts.length} points`);
      if (s.lifted) lines.push(`on the scale: ${Math.round(shownMm(p, s)) / 10} cm`);
      lines.push(`reading: ${s.at || "–"} ${p.goal === "map" ? "km" : "cm"}`);
      break;
    case "jobs": lines.push(...p.jobs.map((j, i) => `${i + 1}: ${j} → ${s.place[i] < 0 ? "–" : s.place[i] ? "lab" : "clinical"}`)); break;
    case "read": lines.push(`lab thermometer, 1 °C a small division; ${s.dipped ? "in the water" : "out of the water"}`, `reading: ${s.at || "–"} °C`); break;
    case "fever": lines.push(...p.temps.map((_, i) => `child ${i + 1} → ${s.place[i] < 0 ? "–" : s.place[i] ? "fever" : "normal"}`)); break;
    case "ruler": lines.push(`eraser on ${p.first ? `a broken ruler from ${p.first}` : "a ruler with an edge before 0"}; at ${s.start === OFF ? "–" : s.start}`, `eye: ${["left", "above", "right"][s.eye + 1]}; length: ${s.at || "–"} cm`); break;
    case "foot": lines.push(`cloth: ${p.L % 100 ? `${p.L / 100} m` : `${p.L / 100} m`}; foot-rulers of ${FOOT} cm`, `rulers: ${s.at || "–"}`); break;
    case "feel": lines.push(...p.items.map((it, i) => `${it} → step ${s.place[i] < 0 ? "–" : s.place[i] + 1}`)); break;
  }
  return { title: "Naap", lines };
}
function grade(level: PlayLevel<NaapParams>, acts: PlayActEnvelope<FeetaAct>[]): PlayGrade {
  return gradeLevel(naapLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const naapLogic: FamilyLogic<NaapParams, NaapState, FeetaAct> = {
  family: "feeta", modes: NAAP_MODES, malRules: NAAP_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs: naapMalActs, grade, facts, board,
};
