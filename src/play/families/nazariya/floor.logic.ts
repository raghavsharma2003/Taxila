// Nazariya · floor (area and perimeter: c5-maths-ch11, c6-maths-ch06). The child lays floor tiles on an open plot; the
// fence always runs round whatever floor stands, so floor (area, the tiles) and fence (perimeter, the unit lengths round
// the edge) are two different things the child can see grow differently.
//   area      — lay a floor (one piece) of exactly n tiles.
//   perimeter — lay a rectangular floor whose fence is exactly n long.
//   max       — the fence is n long: lay the rectangle with the MOST floor.
//   min       — n tiles of floor: lay the rectangle that needs the LEAST fence.
// Mal-rules (the rectangle a belief builds): area-for-perimeter (area = n when the fence was asked) · area-perimeter (fence
// = n when the area was asked) · l-plus-b (length + breadth once = n) · border-squares (the squares touching the edge = n)
// · same-perimeter-area (any rectangle with that fence, as if all held the same floor) · same-area-perimeter (any
// rectangle of that floor, as if all needed the same fence).
import type { Candidate, Facts, GenRequest, NazariyaAct, PlayLevel } from "../../../../shared/play.ts";
import { mulberry32 } from "../../core/rng.ts";
import { boxActs, built, commit, connected, lvl, makeLogic, mom, plotOf, solidBox, zeros, type Applied, type NzState, type Plot } from "./grid.ts";

export type FloorGoal = "area" | "perimeter" | "max" | "min";
export interface FloorParams extends Plot { goal: FloorGoal; n: number }
export const FLOOR_MAL = ["area-for-perimeter", "area-perimeter", "l-plus-b", "border-squares", "same-perimeter-area", "same-area-perimeter"] as const;

/** Floor tiles and the fence round them (unit edges between a tile and a non-tile), for any shape. */
export function areaPerimeter(p: { w: number; d: number }, h: readonly number[]): { area: number; perimeter: number } {
  let area = 0, perimeter = 0;
  const on = (x: number, z: number) => x >= 0 && z >= 0 && x < p.w && z < p.d && h[z * p.w + x] > 0;
  for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) if (on(x, z)) {
    area++;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!on(x + dx, z + dz)) perimeter++;
  }
  return { area, perimeter };
}
const fits = (p: { w: number; d: number }, a: number, b: number) => a >= 1 && b >= 1 && a <= p.w && b <= p.d;
/** Every a × b (a along x, b along z) that fits the plot. */
export function rects(p: { w: number; d: number }): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 1; a <= p.w; a++) for (let b = 1; b <= p.d; b++) out.push([a, b]);
  return out;
}
/** max: the largest area among fitting rectangles with perimeter n; min: the smallest perimeter among those of area n. */
const BEST = new Map<string, { value: number; next: number | null } | null>();
export function best(p: FloorParams): { value: number; next: number | null } | null {
  const key = `${p.goal}:${p.n}:${p.w}x${p.d}`;
  if (BEST.has(key)) return BEST.get(key) ?? null;
  const v = bestOf(p);
  if (BEST.size > 2000) BEST.clear();
  BEST.set(key, v);
  return v;
}
function bestOf(p: FloorParams): { value: number; next: number | null } | null {
  const vals = p.goal === "max" ? rects(p).filter(([a, b]) => 2 * (a + b) === p.n).map(([a, b]) => a * b)
    : p.goal === "min" ? rects(p).filter(([a, b]) => a * b === p.n).map(([a, b]) => 2 * (a + b)) : [];
  if (!vals.length) return null;
  const uniq = [...new Set(vals)].sort((x, y) => (p.goal === "max" ? y - x : x - y));
  return { value: uniq[0], next: uniq[1] ?? null };
}
/** Every mal-rule whose signature an a × b rectangle shows on this level (bst: the best value for max / min). */
export function hitsOf(p: FloorParams, a: number, b: number): string[] {
  const bst = best(p), A = a * b, P = 2 * (a + b), out: string[] = [];
  if (p.goal === "perimeter") {
    if (A === p.n && P !== p.n) out.push("area-for-perimeter");
    if (a + b === p.n) out.push("l-plus-b");
    if (a >= 2 && b >= 2 && P - 4 === p.n) out.push("border-squares");
  }
  if (p.goal === "area" && P === p.n && A !== p.n) out.push("area-perimeter");
  // any rectangle with the asked fence but not the most floor (as if every such field held the same floor)
  if (p.goal === "max" && bst && P === p.n && A !== bst.value) out.push("same-perimeter-area");
  if (p.goal === "min" && bst && A === p.n && P !== bst.value) out.push("same-area-perimeter");
  return out;
}
/** The rectangle a mal-rule builds here (a along x, b along z): one that shows that belief and no other, or null. */
export function malRect(p: FloorParams, mal: string): [number, number] | null {
  const sq = (u: [number, number]) => Math.abs(u[0] - u[1]);
  // the max / min beliefs build the least square field (the far end of "they are all the same"); the others the squarest
  const far = mal === "same-perimeter-area" || mal === "same-area-perimeter";
  return rects(p).filter(([a, b]) => { const h = hitsOf(p, a, b); return h.length === 1 && h[0] === mal; })
    .sort((u, v) => (far ? sq(v) - sq(u) : sq(u) - sq(v)) || u[0] - v[0])[0] ?? null;
}
/** Which of the level's mapped mal-rules this rectangle shows (exactly one, or none: an ambiguous one tells nothing apart). */
function malOf(level: PlayLevel<FloorParams>, a: number, b: number): string | null {
  const hits = hitsOf(level.params, a, b).filter((m) => m in level.mal);
  return hits.length === 1 ? hits[0] : null;
}

function validate(raw: unknown): FloorParams | null {
  const r = raw as Partial<FloorParams> | null, plot = plotOf(raw);
  if (!r || !plot || plot.hmax !== 1 || plot.lock.some((v) => v) || plot.base.some((v) => v)) return null;
  if (r.goal !== "area" && r.goal !== "perimeter" && r.goal !== "max" && r.goal !== "min") return null;
  const n = Number(r.n);
  if (!Number.isInteger(n) || n < 2 || n > plot.w * plot.d * 2) return null;
  const p: FloorParams = { ...plot, goal: r.goal, n };
  if (p.goal === "area" && n > plot.w * plot.d) return null;
  if (p.goal === "perimeter" && !rects(p).some(([a, b]) => 2 * (a + b) === n)) return null;
  if ((p.goal === "max" || p.goal === "min") && !best(p)?.next) return null;    // one kind of rectangle only: nothing to compare
  return p;
}

function check(level: PlayLevel<FloorParams>, s: NzState, seq: number): Applied {
  const p = level.params, ap = areaPerimeter(p, s.h), box = solidBox(p, s.h), bumped = { ...s, acts: s.acts + 1 };
  const facts: Facts = { floor: ap.area, fence: ap.perimeter };
  const won = () => ({ state: commit(s, { ...s, done: true }), moments: [mom("solved", seq, { ...facts, ...(box ? { sides: `${box.a}x${box.b}` } : {}) })] });
  const miss = (kind: "near_miss" | "law_refused", why: string): Applied => ({ state: bumped, moments: [mom(kind, seq, { ...facts, why })], refused: "mismatch" });
  if (p.goal === "area") {
    if (!connected(p, s.h)) return { state: bumped, moments: [mom("law_refused", seq, { ...facts, why: "one_floor" })], refused: "one_floor" };
    if (ap.area === p.n) return won();
    const mal = box ? malOf(level, box.a, box.b) : null;
    if (mal) return { state: bumped, moments: [mom("misconception_consequence", seq, facts, mal)], refused: "mismatch" };
    return miss(Math.abs(ap.area - p.n) === 1 ? "near_miss" : "law_refused", "floor_count");
  }
  if (!box) return { state: bumped, moments: [mom("law_refused", seq, { ...facts, why: "rectangle" })], refused: "rectangle" };
  const mal = malOf(level, box.a, box.b);
  if (p.goal === "perimeter") {
    if (ap.perimeter === p.n) return won();
    if (mal) return { state: bumped, moments: [mom("misconception_consequence", seq, facts, mal)], refused: "mismatch" };
    return miss(Math.abs(ap.perimeter - p.n) === 2 ? "near_miss" : "law_refused", "fence_length");
  }
  const bst = best(p)!;
  if (p.goal === "max") {
    if (ap.perimeter !== p.n) return miss("law_refused", "fence_length");
    if (ap.area === bst.value) return won();
    if (mal) return { state: bumped, moments: [mom("misconception_consequence", seq, facts, mal)], refused: "mismatch" };
    return miss("law_refused", "more_floor");
  }
  if (ap.area !== p.n) return miss("law_refused", "floor_count");
  if (ap.perimeter === bst.value) return won();
  if (mal) return { state: bumped, moments: [mom("misconception_consequence", seq, facts, mal)], refused: "mismatch" };
  return miss("law_refused", "less_fence");
}

const rectActs = (a: number, b: number): NazariyaAct[] => [...boxActs({ x0: 0, z0: 0, a, b, hgt: 1 }), { kind: "check" }];
/** One solution: a rectangle when one fits (area: the squarest a × b = n, else n tiles in rows). */
export function solutionRect(p: FloorParams): [number, number] | null {
  const R = rects(p), sq = (u: [number, number]) => Math.abs(u[0] - u[1]);
  const bst = best(p);
  const pool = p.goal === "area" ? R.filter(([a, b]) => a * b === p.n) : p.goal === "perimeter" ? R.filter(([a, b]) => 2 * (a + b) === p.n)
    : p.goal === "max" ? R.filter(([a, b]) => 2 * (a + b) === p.n && a * b === bst?.value) : R.filter(([a, b]) => a * b === p.n && 2 * (a + b) === bst?.value);
  return pool.sort((u, v) => sq(u) - sq(v) || u[0] - v[0])[0] ?? null;
}
function solve(level: PlayLevel<FloorParams>): NazariyaAct[] | null {
  const p = level.params, r = solutionRect(p);
  if (r) return rectActs(r[0], r[1]);
  if (p.goal !== "area") return null;
  // rows of w, then the rest in the next row (one piece)
  const acts: NazariyaAct[] = [], full = Math.floor(p.n / p.w), rest = p.n % p.w;
  if (full) acts.push({ kind: "layer", x0: 0, z0: 0, x1: p.w - 1, z1: full - 1 });
  if (rest) acts.push({ kind: "layer", x0: 0, z0: full, x1: rest - 1, z1: full });
  return [...acts, { kind: "check" }];
}
/** Shapes a child could lay without the idea: the whole plot, one long row, a square of side n / 4. */
function shortcut(level: PlayLevel<FloorParams>): NazariyaAct[] | null {
  const p = level.params;
  const tries: [number, number][] = [[p.w, p.d], [Math.min(p.w, p.n), 1], [Math.max(1, Math.round(p.n / 4)), Math.max(1, Math.round(p.n / 4))]];
  if (p.goal === "max" || p.goal === "min") tries.push([1, Math.min(p.d, p.n)]);
  for (const [a, b] of tries) {
    if (!fits(p, a, b)) continue;
    const h = zeros(p.w * p.d);
    for (let z = 0; z < b; z++) for (let x = 0; x < a; x++) h[z * p.w + x] = 1;
    const ap = areaPerimeter(p, h), bst = best(p);
    const ok = p.goal === "area" ? ap.area === p.n : p.goal === "perimeter" ? ap.perimeter === p.n
      : p.goal === "max" ? ap.perimeter === p.n && ap.area === bst?.value : ap.area === p.n && ap.perimeter === bst?.value;
    // a square of side n/4 IS the max-area answer for a fence n: that is the concept, not a shortcut
    // a square of side n/4 IS the concept for a fence n (4 × side; the most floor), and so is the squarest field of n
    if (ok && !((p.goal === "max" || p.goal === "perimeter") && a === b) && !(p.goal === "min" && Math.abs(a - b) <= 1)) return rectActs(a, b);
  }
  return null;
}
function malActs(level: PlayLevel<FloorParams>, mal: string): NazariyaAct[] | null {
  const r = malRect(level.params, mal);
  return r ? rectActs(r[0], r[1]) : null;
}

function generate(req: GenRequest): Candidate<FloorParams>[] {
  const g = req.grammar as { goal?: FloorGoal; plot?: [number, number]; lo?: number; hi?: number };
  const goal = (req.goal as FloorGoal) ?? g.goal ?? "area";
  const rnd = mulberry32(req.seed), out: Candidate<FloorParams>[] = [];
  const [w, d] = g.plot ?? (req.classLevel <= 5 ? [10, 8] : [12, 9]);
  const plot: Plot = { w, d, hmax: 1, base: zeros(w * d), lock: zeros(w * d) };
  const lo = g.lo ?? (goal === "area" ? 6 : goal === "perimeter" ? 8 : goal === "max" ? 10 : 8);
  const hi = g.hi ?? (goal === "area" ? (req.classLevel <= 5 ? 24 : 36) : goal === "perimeter" ? 26 : goal === "max" ? 28 : 36);
  for (let n = lo; n <= hi; n++) {
    if ((goal === "perimeter" || goal === "max") && n % 2) continue;
    for (let k = 0; k < 2; k++) {
      if (rnd() > 0.7) continue;
      const params: FloorParams = { ...plot, goal, n };
      out.push({ signature: `${goal}:${n}`, difficulty: Math.min(1, n / 40 + (goal === "max" || goal === "min" ? 0.2 : goal === "perimeter" ? 0.1 : 0)), level: lvl(req, "floor", goal, params, `${goal}-${n}-${k}`) });
    }
  }
  return out;
}

function facts(level: PlayLevel<FloorParams>, s: NzState): Facts {
  const p = level.params, ap = areaPerimeter(p, s.h), f: Facts = { goal: p.goal, target: p.n };
  // the live counts are on screen at fade 1 only; later fades show them after a check
  if (level.fade === 1 || s.checks > 0 || s.done) { f.floor = ap.area; f.fence = ap.perimeter; }
  const box = solidBox(p, s.h);
  if (box && (level.fade === 1 || s.done)) f.sides = `${box.a}x${box.b}`;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<FloorParams>, s: NzState) {
  const p = level.params, ap = areaPerimeter(p, s.h);
  const ask = p.goal === "area" ? `floor = ${p.n}` : p.goal === "perimeter" ? `fence = ${p.n}` : p.goal === "max" ? `fence = ${p.n}, most floor` : `floor = ${p.n}, least fence`;
  return { title: "Floor and fence", lines: [ask, `yours: floor ${ap.area}, fence ${ap.perimeter}`] };
}

export const floorLogic = makeLogic<FloorParams>({ mode: "floor", malRules: FLOOR_MAL, validate, check, solve, shortcut, malActs, generate, facts, board });
export const floorHelpers = { areaPerimeter, best, malRect, solutionRect, built };
