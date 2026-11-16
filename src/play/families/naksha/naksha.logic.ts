// Naksha (नक्शा, "map") · round 7, maps and grids. Four worlds, each a different use of a map's law; nothing moves on a
// clock: the child sets something up, presses go, and the law (a plain simulation) answers.
//   locate  fix      a rescue drone is sent to a ship's latitude / longitude: the child drags it to a crossing of the
//                    graticule (degrees N / S of the Equator, E / W of the Prime Meridian) and drops the kit there
//   route   steps    a delivery rider on a lettered / numbered street grid: the child programs screen-direction steps
//                    (up, right, …) to the house at a grid reference; ponds block cells, so the order of moves matters
//           compass  the same with N / E / S / W buttons; the map's north arrow may point anywhere (north is not "up")
//           turns    the rider has a heading: forward, turn left, turn right (left and right are the RIDER's)
//   scale    fuel     a truck stops where its fuel runs out: fill exactly enough for the town at the road's end
//                    (the road measured in cm squares × the scale 1 cm = k km)
//           reach    the truck has fuel for D km: put the pump on the road exactly where the fuel runs out (D ÷ k cm)
//   shape    copy     fence a garden on your dot plot exactly like the plan (same shape and size; turned is the same)
// Mal-rules (each a deterministic set-up; a level serves one only where its set-up differs from every other's):
//   swap-latlong    fix: the two numbers read on the wrong lines (20°S, 30°E → 30°S, 20°E)
//   flip-ns         fix: north and south swapped;  flip-ew  fix: east and west swapped
//   order-swap      steps: the across and up counts swapped (3 right, 2 up → 2 right, 3 up)
//   counts-start    steps: every run counts the start square too (one step too many in each run)
//   east-west-swap  compass: E pressed for W and W for E
//   north-is-up     compass: N pressed for "up the screen" whatever the north arrow says
//   own-left-right  turns: left and right swapped while the rider faces down the page (the child's own left / right)
//   map-is-real     fuel: the map length in cm read as the real distance; reach: the pump at D cm
//   add-scale       fuel: map length + k; reach: the pump at (D − k) cm (adds the scale instead of multiplying)
//   straight-line   fuel: the straight-line distance × k, though the road bends
//   count-dots      copy: every side joins as many dots as it has units (one unit short), on a rectangle
import type { Candidate, Facts, FamilyLogic, GenRequest, Moment, NakshaAct, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type NakshaMode = "locate" | "route" | "scale" | "shape";
export type NakshaGoal = "fix" | "steps" | "compass" | "turns" | "fuel" | "reach" | "copy";
export type Pt = [number, number];
export type Dir = "n" | "e" | "s" | "w";
export type Step = Dir | "f" | "l" | "r";
export type Labels = 1 | 2 | 3;

/** locate · the graticule: lines every `step` degrees; x = longitude (E +, W −), y = latitude (N +, S −) */
export interface LocateP { goal: "fix"; labels: Labels; lon: Pt; lat: Pt; step: number; target: Pt }
/** route · cells (c, r): c = 0 is column A (left), r = 0 is row 1 (bottom); `north` = where the map's north arrow points */
export interface RouteP { goal: "steps" | "compass" | "turns"; labels: Labels; cols: number; rows: number; start: Pt; heading: Dir; home: Pt; rocks: Pt[]; north: Dir }
/** scale · a road on cm squared paper (vertices on the grid), 1 cm = k units; fuel (reach) the truck's fuel; max the pump's top */
export interface ScaleP { goal: "fuel" | "reach"; labels: Labels; cols: number; rows: number; road: Pt[]; k: number; unit: "km" | "m"; fuel: number; max: number }
/** shape · the plan's corners (lattice points) and the child's dot plot (cols × rows dots) */
export interface ShapeP { goal: "copy"; labels: Labels; model: Pt[]; cols: number; rows: number }
export type NakshaParams = LocateP | RouteP | ScaleP | ShapeP;

/** a set-up: the drone / pump spot, the program, the fuel, the fence corners */
export interface Setup { at: Pt | null; prog: Step[]; value: number; corners: Pt[] }
export interface NakshaState extends Undoable<NakshaState>, Setup {
  /** the last go has been judged and nothing changed since */
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const NAKSHA_MAL = ["swap-latlong", "flip-ns", "flip-ew", "order-swap", "counts-start", "east-west-swap", "north-is-up", "own-left-right",
  "map-is-real", "add-scale", "straight-line", "count-dots"] as const;
const MAL_OF: Record<NakshaGoal, readonly string[]> = {
  fix: ["swap-latlong", "flip-ns", "flip-ew"], steps: ["order-swap", "counts-start"], compass: ["east-west-swap", "north-is-up"], turns: ["own-left-right"],
  fuel: ["map-is-real", "add-scale", "straight-line"], reach: ["map-is-real", "add-scale"], copy: ["count-dots"],
};
const GOALS_OF: Record<NakshaMode, readonly NakshaGoal[]> = { locate: ["fix"], route: ["steps", "compass", "turns"], scale: ["fuel", "reach"], shape: ["copy"] };
export const MAX_PROG = 30;
export const MAX_CORNERS = 12;

export const DIRS: readonly Dir[] = ["n", "e", "s", "w"];
export const VEC: Record<Dir, Pt> = { n: [0, 1], e: [1, 0], s: [0, -1], w: [-1, 0] };
const turn = (d: Dir, k: number): Dir => DIRS[(DIRS.indexOf(d) + k + 400) % 4];
/** compass: the screen direction a true direction (a letter pressed) moves in, on a map whose north arrow points `north` */
export const screenOf = (letter: Dir, north: Dir): Dir => turn(letter, DIRS.indexOf(north));
/** compass: the letter that moves in screen direction d */
export const letterOf = (d: Dir, north: Dir): Dir => turn(d, -DIRS.indexOf(north));
const eq = (a: Pt | null | undefined, b: Pt | null | undefined) => !!a && !!b && a[0] === b[0] && a[1] === b[1];
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const isPt = (x: unknown): x is Pt => Array.isArray(x) && x.length === 2 && isInt(x[0]) && isInt(x[1]);
const range = (lo: number, hi: number, st = 1) => { const out: number[] = []; for (let v = lo; v <= hi; v += st) out.push(v); return out; };
export const colName = (c: number) => String.fromCharCode(65 + c);
export const refOf = (p: Pt) => `${colName(p[0])}${p[1] + 1}`;

// ───────────────────────────── route: the rider ─────────────────────────────

export interface RouteRun { cells: Pt[]; heads: Dir[]; bump: boolean; bumpAt: Pt | null }
const blocked = (p: RouteP, c: Pt) => c[0] < 0 || c[1] < 0 || c[0] >= p.cols || c[1] >= p.rows || p.rocks.some((r) => eq(r, c));
/** THE route law: the rider follows the program from the start; a step into a pond or off the map stops it there */
export function runRoute(p: RouteP, prog: readonly Step[]): RouteRun {
  let at: Pt = [...p.start] as Pt, head: Dir = p.heading;
  const cells: Pt[] = [at], heads: Dir[] = [head];
  for (const st of prog) {
    let d: Dir;
    if (st === "l" || st === "r") { head = turn(head, st === "l" ? -1 : 1); cells.push(at); heads.push(head); continue; }
    if (st === "f") d = head;
    else { d = p.goal === "compass" ? screenOf(st, p.north) : st; head = d; }
    const nx: Pt = [at[0] + VEC[d][0], at[1] + VEC[d][1]];
    if (blocked(p, nx)) return { cells, heads, bump: true, bumpAt: nx };
    at = nx; cells.push(at); heads.push(head);
  }
  return { cells, heads, bump: false, bumpAt: null };
}
const stepVocab = (g: RouteP["goal"]): readonly Step[] => (g === "turns" ? ["f", "l", "r"] : DIRS);
/** a shortest path of screen directions (an L when one is clear: across first, else up first; else breadth-first) */
function screenPath(p: RouteP): Dir[] | null {
  const dx = p.home[0] - p.start[0], dy = p.home[1] - p.start[1];
  const hx: Dir[] = Array(Math.abs(dx)).fill(dx > 0 ? "e" : "w"), hy: Dir[] = Array(Math.abs(dy)).fill(dy > 0 ? "n" : "s");
  const clear = (ds: Dir[]) => { const q: RouteP = { ...p, goal: "steps" }; const r = runRoute(q, ds); return !r.bump && eq(r.cells[r.cells.length - 1], p.home); };
  for (const ds of [[...hx, ...hy], [...hy, ...hx]]) if (clear(ds)) return ds;
  const key = (c: Pt) => c[0] * 64 + c[1], prev = new Map<number, [number, Dir]>(), seen = new Set([key(p.start)]);
  let frontier: Pt[] = [p.start];
  while (frontier.length) {
    const next: Pt[] = [];
    for (const c of frontier) for (const d of DIRS) {
      const n: Pt = [c[0] + VEC[d][0], c[1] + VEC[d][1]];
      if (blocked(p, n) || seen.has(key(n))) continue;
      seen.add(key(n)); prev.set(key(n), [key(c), d]); next.push(n);
      if (eq(n, p.home)) {
        const out: Dir[] = [];
        for (let k = key(n); k !== key(p.start);) { const [pk, pd] = prev.get(k)!; out.unshift(pd); k = pk; }
        return out;
      }
    }
    frontier = next;
  }
  return null;
}
/** turns: the shortest program of forward / left / right (breadth-first over cell × heading) */
function turnsProgram(p: RouteP): Step[] | null {
  const key = (c: Pt, h: Dir) => (c[0] * 64 + c[1]) * 4 + DIRS.indexOf(h);
  const prev = new Map<number, [number, Step]>(), k0 = key(p.start, p.heading), seen = new Set([k0]);
  let frontier: [Pt, Dir][] = [[p.start, p.heading]];
  while (frontier.length) {
    const next: [Pt, Dir][] = [];
    for (const [c, h] of frontier) for (const st of ["f", "l", "r"] as const) {
      const n: Pt = st === "f" ? [c[0] + VEC[h][0], c[1] + VEC[h][1]] : c, nh = st === "f" ? h : turn(h, st === "l" ? -1 : 1);
      if (blocked(p, n) || seen.has(key(n, nh))) continue;
      seen.add(key(n, nh)); prev.set(key(n, nh), [key(c, h), st]); next.push([n, nh]);
      if (eq(n, p.home)) {
        const out: Step[] = [];
        for (let k = key(n, nh); k !== k0;) { const [pk, ps] = prev.get(k)!; out.unshift(ps); k = pk; }
        return out;
      }
    }
    frontier = next;
  }
  return null;
}
/** the solver's program for a route level */
export function routeProgram(p: RouteP): Step[] | null {
  if (p.goal === "turns") return turnsProgram(p);
  const ds = screenPath(p);
  if (!ds) return null;
  return p.goal === "compass" ? ds.map((d) => letterOf(d, p.north)) : ds;
}
/** runs of equal steps: [step, count][] */
export function runsOf(prog: readonly Step[]): [Step, number][] {
  const out: [Step, number][] = [];
  for (const s of prog) { const last = out[out.length - 1]; if (last && last[0] === s) last[1]++; else out.push([s, 1]); }
  return out;
}
const unruns = (rs: [Step, number][]): Step[] => rs.flatMap(([s, n]) => Array(n).fill(s) as Step[]);

// ───────────────────────────── scale: the road ─────────────────────────────

const segLen = (a: Pt, b: Pt) => Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
/** the road's length in cm (its squares) */
export const roadLen = (road: readonly Pt[]) => road.slice(1).reduce((s, b, i) => s + segLen(road[i], b), 0);
/** the point `d` cm along the road (d may be fractional; clamped to the road) */
export function pointAt(road: readonly Pt[], d: number): [number, number] {
  let left = Math.max(0, d);
  for (let i = 1; i < road.length; i++) {
    const a = road[i - 1], b = road[i], l = segLen(a, b);
    if (left <= l) { const u = l ? left / l : 0; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }
    left -= l;
  }
  return [...road[road.length - 1]] as [number, number];
}
/** the straight-line cm between the road's two ends when it is a whole number, else null */
export function straightCm(road: readonly Pt[]): number | null {
  const a = road[0], b = road[road.length - 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return Math.abs(d - Math.round(d)) < 1e-9 ? Math.round(d) : null;
}
/** fuel: the fuel that stops the truck exactly at the town; reach: the pump's cm along the road */
export const fuelWant = (p: ScaleP) => roadLen(p.road) * p.k;
export const reachWant = (p: ScaleP) => p.fuel / p.k;

// ───────────────────────────── shape: the fence ─────────────────────────────

const cross = (a: Pt, b: Pt, c: Pt) => (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
const dot3 = (a: Pt, b: Pt, c: Pt) => (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]);
/** a closed fence's side vectors (straight-through corners merged), or null when it is not a fence (folds back, no area) */
export function sidesOf(poly: readonly Pt[]): Pt[] | null {
  const v = poly.filter((q, i) => i === 0 || !eq(q, poly[i - 1]));
  if (v.length > 1 && eq(v[0], v[v.length - 1])) v.pop();
  for (let changed = true; changed && v.length >= 3;) {
    changed = false;
    for (let i = 0; i < v.length; i++) {
      const a = v[(i + v.length - 1) % v.length], b = v[i], c = v[(i + 1) % v.length];
      if (cross(a, b, c) !== 0) continue;
      if (dot3(a, b, c) <= 0) return null;   // the fence turns straight back on itself
      v.splice(i, 1); changed = true; break;
    }
  }
  if (v.length < 3) return null;
  const area = v.reduce((s, q, i) => { const r = v[(i + 1) % v.length]; return s + q[0] * r[1] - r[0] * q[1]; }, 0);
  if (area === 0) return null;
  return v.map((q, i) => { const r = v[(i + 1) % v.length]; return [r[0] - q[0], r[1] - q[1]] as Pt; });
}
/** THE shape law: the same shape and size (moved or turned, never flipped) */
export function sameShape(a: readonly Pt[], b: readonly Pt[]): boolean {
  const ea = sidesOf(a), eb = sidesOf(b);
  if (!ea || !eb || ea.length !== eb.length) return false;
  const n = eb.length;
  const rev = [...ea].reverse().map(([x, y]) => [-x, -y] as Pt);
  for (const base of [ea, rev]) {
    let cur = base;
    for (let r = 0; r < 4; r++) {
      for (let s = 0; s < n; s++) if (cur.every((e, i) => eq(e, eb[(i + s) % n]))) return true;
      cur = cur.map(([x, y]) => [-y, x] as Pt);
    }
  }
  return false;
}
const bbox = (pts: readonly Pt[]) => {
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};
/** the plan's corners moved to start one dot in from the plot's corner */
const placed = (model: readonly Pt[], ox = 1, oy = 1): Pt[] => { const b = bbox(model); return model.map(([x, y]) => [x - b.x0 + ox, y - b.y0 + oy] as Pt); };
/** a rectangle's width and height, or null */
export function rectOf(model: readonly Pt[]): Pt | null {
  const e = sidesOf(model);
  if (!e || e.length !== 4) return null;
  const b = bbox(model);
  return [b.x1 - b.x0, b.y1 - b.y0];
}

// ───────────────────────────── the judgement ─────────────────────────────

/** THE judgement of a go: does this set-up meet the goal? */
export function judge(p: NakshaParams, su: Setup): boolean {
  switch (p.goal) {
    case "fix": return eq(su.at, p.target);
    case "steps": case "compass": case "turns": {
      const r = runRoute(p, su.prog);
      return !r.bump && eq(r.cells[r.cells.length - 1], p.home);
    }
    case "fuel": return su.value === fuelWant(p);
    case "reach": return !!su.at && su.at[0] === reachWant(p);
    case "copy": return su.corners.length >= 3 && sameShape(su.corners, p.model);
  }
}
const emptySetup = (): Setup => ({ at: null, prog: [], value: 0, corners: [] });
const sameSetup = (a: Setup, b: Setup) => JSON.stringify([a.at, a.prog, a.value, a.corners]) === JSON.stringify([b.at, b.prog, b.value, b.corners]);
const onGraticule = (p: LocateP, q: Pt) => q[0] >= p.lon[0] && q[0] <= p.lon[1] && q[1] >= p.lat[0] && q[1] <= p.lat[1] && (q[0] - p.lon[0]) % p.step === 0 && (q[1] - p.lat[0]) % p.step === 0;
function legal(p: NakshaParams, su: Setup): boolean {
  switch (p.goal) {
    case "fix": return !!su.at && onGraticule(p, su.at);
    case "steps": case "compass": case "turns": { const v = stepVocab(p.goal); return su.prog.length >= 1 && su.prog.length <= MAX_PROG && su.prog.every((s) => v.includes(s)); }
    case "fuel": return isInt(su.value) && su.value >= 1 && su.value <= p.max;
    case "reach": return !!su.at && isInt(su.at[0]) && su.at[0] >= 1 && su.at[0] <= roadLen(p.road) && su.at[1] === 0;
    case "copy": return su.corners.length >= 3 && su.corners.length <= MAX_CORNERS && su.corners.every((q) => q[0] >= 0 && q[1] >= 0 && q[0] < p.cols && q[1] < p.rows);
  }
}
/** the set-up the solver commits */
export function solution(p: NakshaParams): Setup | null {
  const su = emptySetup();
  switch (p.goal) {
    case "fix": su.at = [...p.target] as Pt; break;
    case "steps": case "compass": case "turns": { const prog = routeProgram(p); if (!prog) return null; su.prog = prog; break; }
    case "fuel": su.value = fuelWant(p); break;
    case "reach": su.at = [reachWant(p), 0]; break;
    case "copy": su.corners = placed(p.model); break;
  }
  return legal(p, su) && judge(p, su) ? su : null;
}
function rawMal(p: NakshaParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  const su = emptySetup();
  const at = (q: Pt): Setup => ({ ...su, at: q }), prog = (s: Step[]): Setup => ({ ...su, prog: s }), val = (v: number): Setup => ({ ...su, value: v });
  switch (p.goal) {
    case "fix": {
      const [x, y] = p.target, sg = (v: number) => (v < 0 ? -1 : 1);
      if (mal === "swap-latlong") return Math.abs(x) === Math.abs(y) ? null : at([sg(x) * Math.abs(y), sg(y) * Math.abs(x)]);
      if (mal === "flip-ns") return at([x, -y]);
      if (mal === "flip-ew") return at([-x, y]);
      return null;
    }
    case "steps": case "compass": case "turns": {
      const sol = routeProgram(p);
      if (!sol) return null;
      const rs = runsOf(sol);
      if (mal === "counts-start") return prog(unruns(rs.map(([s, n]) => [s, n + 1])));
      if (mal === "order-swap") return rs.length === 2 && rs[0][1] !== rs[1][1] ? prog(unruns([[rs[0][0], rs[1][1]], [rs[1][0], rs[0][1]]])) : null;
      if (mal === "east-west-swap") return prog(sol.map((s) => (s === "e" ? "w" : s === "w" ? "e" : s)));
      if (mal === "north-is-up") return p.goal === "compass" ? prog(sol.map((s) => screenOf(s as Dir, p.north))) : null;
      if (mal === "own-left-right") {
        // replay the solution: every turn made while the rider faces down the page (towards the child) is mirrored
        let h = p.heading;
        const out: Step[] = [];
        for (const s of sol) {
          if (s === "l" || s === "r") { out.push(h === "s" ? (s === "l" ? "r" : "l") : s); h = turn(h, s === "l" ? -1 : 1); }
          else out.push(s);
        }
        return prog(out);
      }
      return null;
    }
    case "fuel": {
      const L = roadLen(p.road), S = straightCm(p.road);
      if (mal === "map-is-real") return val(L);
      if (mal === "add-scale") return val(L + p.k);
      if (mal === "straight-line") return S !== null && S < L ? val(S * p.k) : null;
      return null;
    }
    case "reach": {
      if (mal === "map-is-real") return at([p.fuel, 0]);
      if (mal === "add-scale") return at([p.fuel - p.k, 0]);
      return null;
    }
    case "copy": {
      const r = rectOf(p.model);
      if (mal !== "count-dots" || !r || r[0] < 2 || r[1] < 2) return null;
      return { ...su, corners: [[1, 1], [r[0], 1], [r[0], r[1]], [1, r[1]]] };
    }
  }
}
/**
 * The set-up a child holding mal-rule `mal` commits, or null when the belief changes nothing here, when its set-up is not a
 * legal one on this level, when it would win, or when another of the goal's mal-rules commits the very same set-up (a
 * signature must name ONE belief).
 */
export function malSetup(p: NakshaParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  for (const other of MAL_OF[p.goal]) {
    if (other === mal) continue;
    const o = rawMal(p, other);
    if (o && sameSetup(o, m)) return null;
  }
  return m;
}
/** values the teacher may not say before the child produces them: the run lengths, the fuel, the pump's cm, the sides */
export function nakshaHidden(level: PlayLevel<unknown>): (string | number)[] {
  const p = level.params as NakshaParams | null;
  if (!p || typeof p.goal !== "string") return [];
  try {
    switch (p.goal) {
      case "fix": return [];   // the ship's coordinates are the given; where it is on the map is the child's to find
      case "steps": case "compass": case "turns": { const sol = routeProgram(p); return sol ? [...new Set(runsOf(sol).filter(([s]) => s !== "l" && s !== "r").map(([, n]) => n))] : []; }
      case "fuel": return [fuelWant(p)];
      case "reach": return [reachWant(p)];
      case "copy": { const e = sidesOf(p.model); return e ? [...new Set(e.map(([x, y]) => Math.abs(x) + Math.abs(y)))] : []; }
    }
  } catch { return []; }
  return [];
}

// ───────────────────────────── validate ─────────────────────────────

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const ptList = (x: unknown, lo: Pt, hi: Pt): Pt[] | null => (Array.isArray(x) && x.every((q) => isPt(q) && q[0] >= lo[0] && q[1] >= lo[1] && q[0] <= hi[0] && q[1] <= hi[1]) ? (x as Pt[]).map((q) => [q[0], q[1]] as Pt) : null);
const isDir = (x: unknown): x is Dir => DIRS.includes(x as Dir);

function validParams(mode: NakshaMode, raw: Record<string, unknown>): NakshaParams | null {
  const goal = raw.goal as NakshaGoal;
  if (!GOALS_OF[mode]?.includes(goal)) return null;
  const labels: Labels = raw.labels === 2 || raw.labels === 3 ? raw.labels : 1;
  switch (goal) {
    case "fix": {
      const step = Number(raw.step), lon = raw.lon, lat = raw.lat, target = raw.target;
      if (![5, 10, 15].includes(step) || !isPt(lon) || !isPt(lat) || !isPt(target)) return null;
      for (const [lo, hi, cap] of [[lon[0], lon[1], 180], [lat[0], lat[1], 80]]) {
        const n = (hi - lo) / step + 1;
        if (lo % step || hi % step || lo < -cap || hi > cap || !isInt(n) || n < 4 || n > 9) return null;
      }
      if (lat[0] >= 0 || lat[1] <= 0) return null;   // the Equator is always on the map (north and south both)
      const p: LocateP = { goal, labels, lon: [lon[0], lon[1]], lat: [lat[0], lat[1]], step, target: [target[0], target[1]] };
      if (!onGraticule(p, p.target) || p.target[0] === 0 || p.target[1] === 0) return null;
      return p;
    }
    case "steps": case "compass": case "turns": {
      const cols = Number(raw.cols), rows = Number(raw.rows);
      if (!isInt(cols) || !isInt(rows) || cols < 4 || cols > 8 || rows < 4 || rows > 7) return null;
      const hi: Pt = [cols - 1, rows - 1];
      const start = ptList([raw.start], [0, 0], hi)?.[0], home = ptList([raw.home], [0, 0], hi)?.[0], rocks = ptList(raw.rocks, [0, 0], hi);
      if (!start || !home || !rocks || !isDir(raw.heading) || !isDir(raw.north)) return null;
      if (eq(start, home) || rocks.length > 8 || rocks.some((r) => eq(r, start) || eq(r, home)) || new Set(rocks.map((r) => r.join())).size !== rocks.length) return null;
      if (goal !== "compass" && raw.north !== "n") return null;
      if (goal !== "turns" && raw.heading !== "n") return null;
      if (start[0] === home[0] || start[1] === home[1]) return null;   // never a straight line to the house
      return { goal, labels, cols, rows, start, heading: raw.heading, home, rocks, north: raw.north };
    }
    case "fuel": case "reach": {
      const cols = Number(raw.cols), rows = Number(raw.rows), k = Number(raw.k), fuel = Number(raw.fuel), max = Number(raw.max);
      if (!isInt(cols) || !isInt(rows) || cols < 4 || cols > 14 || rows < 3 || rows > 10) return null;
      if (!isInt(k) || k < 2 || k > 500 || (raw.unit !== "km" && raw.unit !== "m")) return null;
      const road = ptList(raw.road, [0, 0], [cols, rows]);
      if (!road || road.length < 2 || road.length > 10) return null;
      for (let i = 1; i < road.length; i++) if ((road[i][0] !== road[i - 1][0]) === (road[i][1] !== road[i - 1][1])) return null;   // straight squares only
      const L = roadLen(road);
      if (L < 3 || L > 24) return null;
      if (goal === "fuel") { if (fuel !== 0 || !isInt(max) || max <= L * k || max > 999) return null; }
      else { const n = fuel / k; if (max !== 0 || !isInt(fuel) || !isInt(n) || n < 2 || n >= L) return null; }
      return { goal, labels, cols, rows, road, k, unit: raw.unit, fuel, max };
    }
    case "copy": {
      const cols = Number(raw.cols), rows = Number(raw.rows);
      if (!isInt(cols) || !isInt(rows) || cols < 4 || cols > 10 || rows < 4 || rows > 9) return null;
      const model = ptList(raw.model, [0, 0], [8, 8]);
      if (!model || model.length < 4 || model.length > 8 || !sidesOf(model) || sidesOf(model)!.length !== model.length) return null;
      if (model.some((q, i) => { const r = model[(i + 1) % model.length]; return q[0] !== r[0] && q[1] !== r[1]; })) return null;   // along the grid lines
      const b = bbox(model);
      if (b.x1 - b.x0 + 2 > cols || b.y1 - b.y0 + 2 > rows) return null;
      return { goal, labels, model, cols, rows };
    }
  }
}
function validate(level: PlayLevel<unknown>): PlayLevel<NakshaParams> | null {
  const raw = level.params as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return null;
  const params = validParams(level.mode as NakshaMode, raw);
  if (!params || params.goal !== level.goal && level.goal !== undefined) return null;
  return { ...level, params } as PlayLevel<NakshaParams>;
}
function init(_level: PlayLevel<NakshaParams>): NakshaState {
  return { ...emptySetup(), ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}

// ───────────────────────────── the law ─────────────────────────────

const DIRS_ALL: readonly Step[] = ["n", "e", "s", "w", "f", "l", "r"];
function apply(level: PlayLevel<NakshaParams>, s: NakshaState, act: NakshaAct, seq: number): { state: NakshaState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: NakshaState): NakshaState => ({ ...st, acts: s.acts + 1 });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const no = (why: string) => ({ state: bump(s), moments: out, refused: why });
  // a change after a go starts a fresh go
  const change = (patch: Partial<Setup>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  switch (act.kind) {
    case "put": {
      const x = Number(act.x), y = Number(act.y);
      if (!isInt(x) || !isInt(y)) return no("off_map");
      if (p.goal === "fix") return onGraticule(p, [x, y]) ? change({ at: [x, y] }) : no("off_map");
      if (p.goal === "reach") return y === 0 && x >= 1 && x <= roadLen(p.road) ? change({ at: [x, 0] }) : no("off_road");
      if (p.goal === "copy") {
        if (x < 0 || y < 0 || x >= p.cols || y >= p.rows) return no("off_map");
        if (s.corners.some((q) => eq(q, [x, y]))) return no("used");
        if (s.corners.length >= MAX_CORNERS) return no("full");
        return change({ corners: [...s.corners, [x, y]] });
      }
      return no("no_put");
    }
    case "step": {
      if (p.goal !== "steps" && p.goal !== "compass" && p.goal !== "turns") return no("no_step");
      const d = act.dir;
      if (!DIRS_ALL.includes(d) || !stepVocab(p.goal).includes(d)) return no("no_such_step");
      if (s.prog.length >= MAX_PROG) return no("full");
      return change({ prog: [...s.prog, d] });
    }
    case "set": {
      if (p.goal !== "fuel") return no("no_set");
      const v = Number(act.value);
      if (!isInt(v) || v < 0 || v > p.max) return no("off_gauge");
      if (v === s.value) return no("same");
      return change({ value: v });
    }
    case "run": {
      if (s.ended) return no("change_first");
      const su: Setup = { at: s.at, prog: s.prog, value: s.value, corners: s.corners };
      const empty = p.goal === "fix" || p.goal === "reach" ? !s.at : p.goal === "fuel" ? s.value < 1 : p.goal === "copy" ? s.corners.length < 3 : !s.prog.length;
      if (empty) return no(p.goal === "copy" ? "corners_first" : p.goal === "fuel" ? "fuel_first" : p.goal === "fix" || p.goal === "reach" ? "put_first" : "steps_first");
      const runs = s.runs + 1, ok = judge(p, su);
      const end: NakshaState = bump({ ...s, ended: true, runs, done: ok });
      const base: Facts = { goal: p.goal, go: runs };
      if (ok) { out.push(mom("solved", seq, base)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) {
        const m = malSetup(p, mal);
        if (m && sameSetup(m, su)) { out.push(mom("misconception_consequence", seq, base, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      out.push(mom(nearMiss(p, su) ? "near_miss" : "law_refused", seq, { ...base, why: "missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
/** one grid line / one square / one cm off (never on a fence: a near fence is a different shape) */
function nearMiss(p: NakshaParams, su: Setup): boolean {
  switch (p.goal) {
    case "fix": return !!su.at && Math.abs(su.at[0] - p.target[0]) + Math.abs(su.at[1] - p.target[1]) === p.step;
    case "steps": case "compass": case "turns": {
      const r = runRoute(p, su.prog), e = r.cells[r.cells.length - 1];
      return !r.bump && Math.abs(e[0] - p.home[0]) + Math.abs(e[1] - p.home[1]) === 1;
    }
    case "reach": return !!su.at && Math.abs(su.at[0] - reachWant(p)) === 1;
    default: return false;
  }
}
const goalMet = (_l: PlayLevel<NakshaParams>, s: NakshaState) => s.done;

/** the acts that commit a set-up, then go */
export function setupActs(p: NakshaParams, su: Setup): NakshaAct[] {
  const go: NakshaAct = { kind: "run" };
  switch (p.goal) {
    case "fix": case "reach": return su.at ? [{ kind: "put", x: su.at[0], y: su.at[1] }, go] : [go];
    case "steps": case "compass": case "turns": return [...su.prog.map((dir): NakshaAct => ({ kind: "step", dir })), go];
    case "fuel": return [{ kind: "set", value: su.value }, go];
    case "copy": return [...su.corners.map(([x, y]): NakshaAct => ({ kind: "put", x, y })), go];
  }
}
function solve(level: PlayLevel<NakshaParams>): NakshaAct[] | null {
  const su = solution(level.params);
  return su ? setupActs(level.params, su) : null;
}
/**
 * Set-ups that win without the idea: the drone on a corner of the map or on the 0° crossing; one straight run in any one
 * direction (the house in line with the rider); the scale's own number, the map length or a full tank as the fuel; the
 * pump at the road's start or its end; a small square for the fence. A level any of them wins is never served.
 */
function shortcutSetups(p: NakshaParams): Setup[] {
  const su = emptySetup(), tries: Setup[] = [];
  switch (p.goal) {
    case "fix": for (const x of [p.lon[0], 0, p.lon[1]]) for (const y of [p.lat[0], 0, p.lat[1]]) if (x === 0 ? y === 0 : y !== 0) tries.push({ ...su, at: [x, y] }); break;
    case "steps": case "compass": case "turns":
      for (const d of p.goal === "turns" ? (["f"] as Step[]) : DIRS) for (let n = 1; n <= Math.max(p.cols, p.rows); n++) tries.push({ ...su, prog: Array(n).fill(d) });
      break;
    case "fuel": for (const v of [p.k, p.max, roadLen(p.road)]) tries.push({ ...su, value: v }); break;
    case "reach": for (const x of [1, roadLen(p.road)]) tries.push({ ...su, at: [x, 0] }); break;
    case "copy": for (const s of [1, 2]) tries.push({ ...su, corners: [[1, 1], [1 + s, 1], [1 + s, 1 + s], [1, 1 + s]] }); break;
  }
  return tries;
}
function shortcut(level: PlayLevel<NakshaParams>): NakshaAct[] | null {
  const p = level.params;
  for (const t of shortcutSetups(p)) if (legal(p, t) && judge(p, t)) return setupActs(p, t);
  return null;
}
function malActs(level: PlayLevel<NakshaParams>, mal: string): NakshaAct[] | null {
  const m = malSetup(level.params, mal);
  return m ? setupActs(level.params, m) : null;
}

// ───────────────────────────── the generator ─────────────────────────────

interface NakshaGrammar {
  /** fix: lines every `step` degrees (default 10); `east` true: a window east of the Prime Meridian only (India's side) */
  step?: number; east?: boolean;
  /** route: grid size ranges; compass: `rotate` false keeps north up */
  cols?: [number, number]; rows?: [number, number]; rotate?: boolean;
  /** scale: the scales on offer, the unit, the largest fuel answer */
  ks?: number[]; unit?: "km" | "m"; cap?: number;
  /** copy: the plan shapes on offer */
  shapes?: ("rect" | "L")[];
}
function difficultyOf(p: NakshaParams): number {
  const lab = 0.06 * (p.labels - 1);
  switch (p.goal) {
    case "fix": return Math.min(1, 0.3 + lab + (p.lon[0] < 0 ? 0.1 : 0) + 0.01 * (Math.abs(p.target[0]) + Math.abs(p.target[1])) / p.step);
    case "steps": case "compass": case "turns": {
      const sol = routeProgram(p) ?? [];
      return Math.min(1, 0.25 + lab + 0.03 * sol.length + 0.05 * runsOf(sol).length + (p.goal === "compass" && p.north !== "n" ? 0.15 : 0) + (p.goal === "turns" ? 0.1 : 0));
    }
    case "fuel": case "reach": return Math.min(1, 0.3 + lab + 0.02 * roadLen(p.road) + (p.k >= 10 ? 0.08 : 0) + 0.03 * (p.road.length - 2));
    case "copy": return Math.min(1, 0.25 + lab + 0.06 * p.model.length + (rectOf(p.model) ? 0 : 0.1));
  }
}
function generate(req: GenRequest): Candidate<NakshaParams>[] {
  const g = req.grammar as NakshaGrammar;
  const mode = (["locate", "route", "scale", "shape"] as const).find((m) => m === req.mode) ?? "route";
  const goal = (GOALS_OF[mode].includes(req.goal as NakshaGoal) ? req.goal : GOALS_OF[mode][0]) as NakshaGoal;
  const rnd = mulberry32(req.seed), out: Candidate<NakshaParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const labels = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as Labels;
  const mk = (params: NakshaParams, sig: string): Candidate<NakshaParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `naksha-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_").slice(0, 120), family: "naksha", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "naksha", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const cell = (cols: number, rows: number): Pt => [int(0, cols - 1), int(0, rows - 1)];
  for (let k = 0; k < 90 && out.length < 24; k++) {
    let params: NakshaParams | null = null, sig = "";
    if (goal === "fix") {
      const step = [5, 10, 15].includes(Number(g.step)) ? Number(g.step) : 10;
      const lat: Pt = [-step * int(2, 3), step * int(2, 3)];
      const east = g.east ?? rnd() < 0.4;
      let lon: Pt;
      if (east) { const lo = step * int(Math.ceil(50 / step), Math.floor(80 / step)); lon = [lo, lo + step * int(4, 6)]; }
      else { const c = int(2, 4), d = int(2, Math.min(4, 7 - c)); lon = [-step * c, step * d]; }
      const xs = range(lon[0], lon[1], step).filter((x) => x !== 0 && x !== lon[0] && x !== lon[1]);
      const ys = range(lat[0], lat[1], step).filter((y) => y !== 0);
      const target: Pt = [pickOf(xs), pickOf(ys)];
      params = { goal, labels, lon, lat, step, target }; sig = `fix:${lon}:${lat}:${target}`;
    } else if (goal === "steps" || goal === "compass" || goal === "turns") {
      const [cLo, cHi] = (g.cols ?? [5, 7]).map((x) => Math.max(4, Math.min(8, x))), [rLo, rHi] = (g.rows ?? [5, 6]).map((x) => Math.max(4, Math.min(7, x)));
      const cols = int(cLo, cHi), rows = int(rLo, rHi);
      let start: Pt, home: Pt, heading: Dir = "n";
      if (goal === "turns" && rnd() < 0.7) {
        // the rider comes down the page towards the child: a turn made facing down is where "my left" and "her left" part
        heading = "s"; start = [int(0, cols - 1), int(Math.ceil(rows / 2), rows - 1)]; home = [int(0, cols - 1), int(0, start[1] - 2)];
      } else {
        if (goal === "turns") heading = pickOf(DIRS);
        start = cell(cols, rows); home = cell(cols, rows);
      }
      if (start[0] === home[0] || start[1] === home[1] || Math.abs(start[0] - home[0]) + Math.abs(start[1] - home[1]) < 3) continue;
      const rocks: Pt[] = [];
      const free = (c: Pt) => !eq(c, start) && !eq(c, home) && !rocks.some((r) => eq(r, c));
      // half the time a pond sits on the across-first L, so the order of the moves matters
      if (rnd() < 0.5) { const dx = home[0] - start[0], sx = Math.sign(dx), c: Pt = [start[0] + sx * int(1, Math.abs(dx)), start[1]]; if (free(c)) rocks.push(c); }
      for (let n = int(1, 3); n > 0; n--) { const c = cell(cols, rows); if (free(c)) rocks.push(c); }
      const north: Dir = goal === "compass" && g.rotate !== false && rnd() < 0.45 ? pickOf(["e", "s", "w"] as Dir[]) : "n";
      params = { goal, labels, cols, rows, start, heading, home, rocks: rocks.sort((a, b) => a[0] - b[0] || a[1] - b[1]), north };
      const sol = routeProgram(params);
      if (!sol || sol.length > MAX_PROG - 6) continue;
      if (goal === "turns" && !sol.some((s) => s === "l" || s === "r")) continue;
      sig = `${goal}:${cols}x${rows}:${start}>${home}:${heading}:${north}:${rocks.join(";")}`;
    } else if (goal === "fuel" || goal === "reach") {
      const ks = (g.ks ?? [2, 5, 10]).filter((x) => isInt(x) && x >= 2 && x <= 500), unit = g.unit ?? "km", cap = g.cap ?? 150;
      const k2 = pickOf(ks);
      // the road: a detour (ends level, bends around), a staircase (a 3-4-5 straight line), or a zigzag
      const kind = goal === "reach" ? "zig" : pickOf(["detour", "detour", "stair", "zig"] as const);
      const pts: Pt[] = [[0, 0]];
      const go = (dx: number, dy: number) => { const [x, y] = pts[pts.length - 1]; pts.push([x + dx, y + dy]); };
      const up = rnd() < 0.5 ? 1 : -1;
      if (kind === "detour") { const b = int(1, 2); go(int(1, 3), 0); go(0, up * b); go(int(1, 3), 0); go(0, -up * b); go(int(1, 3), 0); }
      else if (kind === "stair") {
        const [dx, dy] = pickOf([[4, 3], [3, 4], [8, 6], [6, 8]] as Pt[]);
        const a = int(1, dx - 1), b = int(1, dy - 1);
        if (rnd() < 0.5) { go(a, 0); go(0, up * dy); go(dx - a, 0); } else { go(0, up * b); go(dx, 0); go(0, up * (dy - b)); }
      } else {
        const n = goal === "reach" ? int(4, 6) : int(3, 4);
        for (let i = 0; i < n; i++) i % 2 === 0 ? go(int(goal === "reach" ? 2 : 1, 4), 0) : go(0, (rnd() < 0.5 ? 1 : -1) * int(1, 3));
      }
      const b = bbox(pts), road = pts.map(([x, y]) => [x - b.x0 + 1, y - b.y0 + 1] as Pt);
      const cols = b.x1 - b.x0 + 2, rows = b.y1 - b.y0 + 2, L = roadLen(road);
      if (cols > 14 || rows > 10 || L < 4 || L > 20) continue;
      if (goal === "fuel") {
        const A = L * k2;
        if (A > cap) continue;
        params = { goal, labels, cols, rows, road, k: k2, unit, fuel: 0, max: Math.max(A + 10, Math.ceil((1.5 * A) / 10) * 10) };
      } else {
        // the pump's square: a third of the time where D cm (the map-is-real belief) is still on the road
        const nMax = L - 2, nReal = Math.floor(L / k2);
        if (nMax < 2) continue;
        const n = nReal >= 2 && rnd() < 0.6 ? int(2, Math.min(nReal, nMax)) : int(2, nMax);
        if (n * k2 > cap) continue;
        params = { goal, labels, cols, rows, road, k: k2, unit, fuel: n * k2, max: 0 };
      }
      sig = `${goal}:${k2}${unit}:${road.join(";")}`;
    } else {
      const kinds = (g.shapes ?? ["rect", "L"]).filter((x) => x === "rect" || x === "L");
      const kind = pickOf(kinds.length ? kinds : ["rect"]);
      let model: Pt[];
      if (kind === "rect") {
        const w = int(2, 4), h = int(2, 3);
        if (w === h) continue;
        model = [[0, 0], [w, 0], [w, h], [0, h]];
      } else {
        const W = int(3, 4), H = int(2, 3), nw = int(1, W - 1), nh = int(1, H - 1);
        model = [[0, 0], [W, 0], [W, H - nh], [W - nw, H - nh], [W - nw, H], [0, H]];
      }
      for (let r = int(0, 3); r > 0; r--) model = model.map(([x, y]) => [-y, x] as Pt);
      const mb = bbox(model);
      model = model.map(([x, y]) => [x - mb.x0, y - mb.y0] as Pt);
      const big = Math.max(mb.x1 - mb.x0, mb.y1 - mb.y0);
      const cols = Math.min(8, big + int(2, 3)), rows = Math.min(7, big + 2);
      params = { goal, labels, model, cols, rows }; sig = `copy:${model.join(";")}:${cols}x${rows}`;
    }
    if (!params || seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig);
    const v = validate(cand.level);
    if (!v || !solution(v.params) || shortcut(v)) continue;
    out.push({ ...cand, level: v });
  }
  return out;
}

// ───────────────────────────── facts and the board twin ─────────────────────────────

/** a degree reading with its hemisphere letter key: [degrees, "N" | "S" | "E" | "W"] */
export const deg = (v: number, axis: "lat" | "lon"): [number, string] => [Math.abs(v), v === 0 ? "" : axis === "lat" ? (v > 0 ? "N" : "S") : v > 0 ? "E" : "W"];
const degStr = (v: number, axis: "lat" | "lon") => { const [a, h] = deg(v, axis); return `${a}°${h}`; };
function facts(level: PlayLevel<NakshaParams>, s: NakshaState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (p.goal === "fix" && s.at) f.at = `${degStr(s.at[1], "lat")} ${degStr(s.at[0], "lon")}`;
  if (p.goal === "reach" && s.at) f.pump = s.at[0];
  if (p.goal === "fuel") f.fuel = s.value;
  if (p.goal === "steps" || p.goal === "compass" || p.goal === "turns") f.steps = s.prog.length;
  if (p.goal === "copy") f.corners = s.corners.length;
  if (s.runs) f.goes = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
const ARROW: Record<Step, string> = { n: "↑", e: "→", s: "↓", w: "←", f: "↑", l: "↶", r: "↷" };
function board(level: PlayLevel<NakshaParams>, s: NakshaState) {
  const p = level.params, lines: string[] = [];
  switch (p.goal) {
    case "fix":
      lines.push(`ship: ${degStr(p.target[1], "lat")}, ${degStr(p.target[0], "lon")}`, `lines every ${p.step}°`, `drone: ${s.at ? `${degStr(s.at[1], "lat")}, ${degStr(s.at[0], "lon")}` : "–"}`);
      break;
    case "steps": case "compass": case "turns":
      lines.push(`grid A–${colName(p.cols - 1)} × 1–${p.rows}`, `rider ${refOf(p.start)}${p.goal === "turns" ? ` facing ${p.heading.toUpperCase()}` : ""}`, `house ${refOf(p.home)}`);
      if (p.rocks.length) lines.push(`ponds ${p.rocks.map(refOf).join(", ")}`);
      if (p.goal === "compass") lines.push(`north arrow points ${({ n: "up", e: "right", s: "down", w: "left" } as const)[p.north]}`);
      lines.push(`program: ${s.prog.length ? s.prog.map((x) => (p.goal === "compass" ? x.toUpperCase() : ARROW[x])).join(" ") : "–"}`);
      break;
    case "fuel": case "reach":
      lines.push(`1 cm = ${p.k} ${p.unit}`, `road: ${p.road.slice(1).map((b, i) => `${segLen(p.road[i], b)} cm`).join(" + ")}`);
      lines.push(p.goal === "fuel" ? `fuel: ${s.value} ${p.unit}` : `fuel for ${p.fuel} ${p.unit}; pump at ${s.at ? `${s.at[0]} cm` : "–"}`);
      break;
    case "copy":
      lines.push(`plan sides: ${(sidesOf(p.model) ?? []).map(([x, y]) => Math.abs(x) + Math.abs(y)).join(", ")}`, `fence corners: ${s.corners.length ? s.corners.map(([x, y]) => `(${x},${y})`).join(" ") : "–"}`);
      break;
  }
  return { title: "Naksha", lines };
}
function grade(level: PlayLevel<NakshaParams>, acts: PlayActEnvelope<NakshaAct>[]): PlayGrade {
  return gradeLevel(nakshaLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const nakshaLogic: FamilyLogic<NakshaParams, NakshaState, NakshaAct> = {
  family: "naksha", modes: ["locate", "route", "scale", "shape"], malRules: NAKSHA_MAL,
  // round 8 law 3 (dc-r8-game-modes-three-laws): mix-ups these goals see from ONE pick among five or fewer (a tool, a
  // bin, a lane, a claim; server/forge3/qa/laws.mjs found each): reported at chance weight, named only on a repeat
  chancePicks: ["steps:order-swap", "turns:own-left-right"],
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
