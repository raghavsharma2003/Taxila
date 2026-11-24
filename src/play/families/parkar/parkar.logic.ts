// Parkar (परकार, "the compass") · round 7, ruler-and-compass constructions (classes 6-7). Nothing here runs on a clock and
// nothing is dragged into place by eye: a spot exists only where tool marks put it (an arc crossing an arc, a ray or a
// line). The child opens the compass on its ruler, swings arcs from spots, lays the protractor or the set-square, joins two
// spots with the ruler and pins crossings; then presses go, and the law checks the construction by plain coordinate
// geometry (cm, y up).
// Modes and goals:
//   build/sss    AB is laid; BC and CA are given: two arcs (one from each end) cross at C. Run lays a tracing of the
//                triangle over the child's: it fits or it does not
//   build/sas    AB, CA and the angle at A: the protractor's ray at A, an arc from A along it
//   build/asa    AB and the angles at A and B: two protractor rays cross at C
//   build/rhs    a right angle at B (the set-square on AB), the hypotenuse CA as an arc from A
//   build/long   AB is laid and an arc of CA swung from A: open the compass for the LONGEST whole-cm third stick that still
//   build/short  closes the triangle (or the SHORTEST), swing it from B. Run hinges the three sticks: they close, lie flat
//                or leave a gap
//   build/ssa    AB, the ray at A at a given angle and BC (opposite the angle, shorter than AB): an arc from B cuts the ray
//                twice; pin EVERY triangle with these parts. Run lays both tracings
//   bisect/perp  the perpendicular bisector of AB: equal arcs from A and B cross twice; join the crossings. Run walks a
//                spot along the line with a string to A and to B (equal or not)
//   bisect/equi  two houses A and B and a road: the water tank goes on the road, as far from one house as from the other.
//                Equal arcs, the line of equal distances, and its crossing with the road. Run measures both pipes
//   bisect/angle bisect the angle at O: an arc from O cuts both arms; equal arcs from those cut-spots cross; join O to it.
//                Run measures the two halves
//   bisect/sixty construct 60° at O on OA: an arc from O cuts OA at P; the same opening from P cuts the first arc; join.
//                Run measures the angle
//   drop/alt     the altitude from A: lay the set-square along the opposite side (extended when needed), its other edge
//                through A (or join A to a spot with the ruler). Run checks the corner with a square
// Mal-rules (a level serves one only where its canonical set-up misses and no other belief of the goal reads the same):
//   swap           sss: BC's length swung from A and CA's from B (the mirror image; no kit belief: never claimed)
//   wrong-vertex   sas: the angle built at B, not between the given sides (the SSA set-up: "does not check where the angle is")
//   equal-sum      long / short: the third stick exactly the sum (or difference) of the other two: the frame lies flat
//   any-three      long / short: any length taken (the compass's top / its smallest opening): the sticks never meet
//   ssa            ssa: only one of the two triangles pinned
//   compass-change perp / equi / angle / sixty: the compass opening changed between arcs that must be equal
//   median         alt: A joined to the midpoint M of BC
//   vertical       alt: the set-square along the page's edge (straight down the page), not along BC
//   inside-only    alt (foot outside BC): A joined to the end of BC nearest the foot (the side is never extended)
import type { Candidate, Facts, FamilyLogic, GenRequest, Moment, ParkarAct, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type ParkarMode = "build" | "bisect" | "drop";
export type ParkarGoal = "sss" | "sas" | "asa" | "rhs" | "long" | "short" | "ssa" | "perp" | "equi" | "angle" | "sixty" | "alt";
export type Tool = "compass" | "protractor" | "square" | "ruler";
export interface ParkarParams {
  goal: ParkarGoal;
  /** the scaffold (fade): which shapes the generator draws (tilt, obtuse, angle size); the tools stay the same */
  look: 1 | 2 | 3;
  /** the goal's numbers (cm, degrees):
   *  sss [a, b, c] · sas [b, c, A] · asa [c, A, B] · rhs [h, c] · long / short [b, c] · ssa [a, c, A] · perp [d, rot] ·
   *  equi [d, y1, y2] · angle [th, rot] · sixty [rot] · alt [base, fx, hgt, rot] (a = BC, b = CA, c = AB) */
  n: number[];
  /** the compass's top opening (cm) */
  max: number;
}
export type XY = [number, number];
/** a straight mark: p + t·d (d a unit vector), t in [lo, hi] */
export interface LineG { k: "line"; p: XY; d: XY; lo: number; hi: number }
export interface CircleG { k: "circle"; c: XY; r: number }
export type Geo = LineG | CircleG;
/** a child's mark */
export type Mark =
  | { t: "arc"; c: string; r: number }                    // the compass swung round spot c at opening r
  | { t: "ray"; at: string; deg: number }                 // the protractor's ray at a vertex, deg from its arm
  | { t: "sq"; at: string; on: number }                   // the set-square along mark `on` (−1: the page's edge), its edge through `at`
  | { t: "join"; p: string; q: string };                  // the ruler through two spots
export interface Pin { id: string; x: number; y: number; a: number; b: number }
export interface ParkarState extends Undoable<ParkarState> {
  /** the compass opening (cm), 0 = closed */
  r: number;
  marks: Mark[];
  pins: Pin[];
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const PARKAR_MAL = ["swap", "wrong-vertex", "equal-sum", "any-three", "ssa", "compass-change", "median", "vertical", "inside-only"] as const;
const MAL_OF: Record<ParkarGoal, readonly string[]> = {
  sss: ["swap"], sas: ["wrong-vertex"], asa: [], rhs: [], long: ["equal-sum", "any-three"], short: ["equal-sum", "any-three"], ssa: ["ssa"],
  perp: ["compass-change"], equi: ["compass-change"], angle: ["compass-change"], sixty: ["compass-change"], alt: ["median", "vertical", "inside-only"],
};
const GOALS_OF: Record<ParkarMode, readonly ParkarGoal[]> = { build: ["sss", "sas", "asa", "rhs", "long", "short", "ssa"], bisect: ["perp", "equi", "angle", "sixty"], drop: ["alt"] };
const NUMS: Record<ParkarGoal, number> = { sss: 3, sas: 3, asa: 3, rhs: 2, long: 2, short: 2, ssa: 3, perp: 2, equi: 3, angle: 2, sixty: 1, alt: 4 };
export const TOOLS: Record<ParkarGoal, readonly Tool[]> = {
  sss: ["compass"], sas: ["protractor", "compass"], asa: ["protractor"], rhs: ["square", "compass"], long: ["compass"], short: ["compass"], ssa: ["compass"],
  perp: ["compass", "ruler"], equi: ["compass", "ruler"], angle: ["compass", "ruler"], sixty: ["compass", "ruler"], alt: ["square", "ruler"],
};
export const TRI_GOALS: readonly ParkarGoal[] = ["sss", "sas", "asa", "rhs"];
/** the compass's top (cm) */
export const MAXR = 12;
const EPS = 1e-6;
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const dist = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const same = (a: XY, b: XY, e = 1e-4) => dist(a, b) < e;
const rot = (p: XY, d: number): XY => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
const unit = (a: XY, b: XY): XY => { const L = dist(a, b); return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; };
const seg = (a: XY, b: XY): LineG => ({ k: "line", p: a, d: unit(a, b), lo: 0, hi: dist(a, b) });
const rayAt = (a: XY, dirDeg: number, hi = Infinity): LineG => ({ k: "line", p: a, d: [Math.cos(rad(dirDeg)), Math.sin(rad(dirDeg))], lo: 0, hi });
const lineThru = (a: XY, d: XY): LineG => ({ k: "line", p: a, d, lo: -Infinity, hi: Infinity });
const r1 = (x: number) => Math.round(x * 10) / 10;

// ── the board a level draws: given spots, given lines and arcs, the protractor's arms, the card, the true answer ──
export interface Board {
  pts: Record<string, XY>;
  /** given spots in drawing order (the ones the child may use) */
  ids: string[];
  lines: { g: LineG; role: "side" | "road" | "arm" | "ray" }[];
  arcs: { c: string; r: number }[];
  /** protractor: each vertex's zero arm (the direction it measures from) and its sense (+1 anticlockwise) */
  arms: Record<string, { zero: number; sense: 1 | -1 }>;
  /** what the run compares with: the vertex / the two vertices / the tank */
  want: XY[];
  /** long / short: the third stick's length */
  stick: number;
  /** extra spots the frame must hold (for fitting the view) */
  extent: XY[];
}
const BOARDS = new Map<string, Board>();
export function boardOf(p: ParkarParams): Board {
  const key = `${p.goal}:${p.n.join(",")}`;
  const hit = BOARDS.get(key); if (hit) return hit;
  const b = makeBoard(p);
  if (BOARDS.size > 500) BOARDS.clear();
  BOARDS.set(key, b);
  return b;
}
function triC(a: number, b: number, c: number): XY {
  // A = (0, 0), B = (c, 0), CA = b, BC = a, C above AB
  const x = (b * b - a * a + c * c) / (2 * c), y2 = b * b - x * x;
  return [x, Math.sqrt(Math.max(0, y2))];
}
function makeBoard(p: ParkarParams): Board {
  const n = p.n, g = p.goal;
  const out: Board = { pts: {}, ids: [], lines: [], arcs: [], arms: {}, want: [], stick: 0, extent: [] };
  const put = (id: string, xy: XY) => { out.pts[id] = xy; out.ids.push(id); };
  if (g === "sss" || g === "sas" || g === "asa" || g === "rhs" || g === "long" || g === "short" || g === "ssa") {
    const c = g === "sss" ? n[2] : g === "asa" ? n[0] : n[1];
    put("A", [0, 0]); put("B", [c, 0]);
    out.lines.push({ g: seg([0, 0], [c, 0]), role: "side" });
    out.arms = { A: { zero: 0, sense: 1 }, B: { zero: 180, sense: -1 } };
    if (g === "sss") out.want = [triC(n[0], n[1], c)];
    if (g === "sas") { const [bb, , A] = n; out.want = [[bb * Math.cos(rad(A)), bb * Math.sin(rad(A))]]; }
    if (g === "asa") {
      const [, A, B] = n, C = 180 - A - B, bb = (c * Math.sin(rad(B))) / Math.sin(rad(C));
      out.want = [[bb * Math.cos(rad(A)), bb * Math.sin(rad(A))]];
    }
    if (g === "rhs") { const [h] = n; out.want = [[c, Math.sqrt(h * h - c * c)]]; }
    if (g === "long" || g === "short") {
      const bb = n[0];
      out.arcs.push({ c: "A", r: bb });
      out.stick = g === "long" ? bb + c - 1 : Math.abs(c - bb) + 1;
      out.want = [triC(out.stick, bb, c)];
      out.extent.push([-bb, bb], [c + bb, -1]);
    }
    if (g === "ssa") {
      const [a, , A] = n, s = Math.sqrt(a * a - (c * Math.sin(rad(A))) ** 2), m = c * Math.cos(rad(A));
      const L = m + s + 1.5;
      out.lines.push({ g: rayAt([0, 0], A, L), role: "ray" });
      out.want = [m - s, m + s].map((t) => [t * Math.cos(rad(A)), t * Math.sin(rad(A))] as XY);
      out.extent.push([L * Math.cos(rad(A)), L * Math.sin(rad(A))]);
    }
    out.extent.push(...out.want, [0, -1.5], [c, -1.5]);
    // where the beliefs put the vertex is on the board too (a missed run's magnifier sits there)
    for (const mal of MAL_OF[g]) { const m = malPoint(p, mal); if (m) out.extent.push(m); }
    return out;
  }
  if (g === "perp") {
    const [d, r] = n, A: XY = rot([-d / 2, 0], r), B: XY = rot([d / 2, 0], r);
    put("A", A); put("B", B);
    out.lines.push({ g: seg(A, B), role: "side" });
    out.want = [[0, 0]];
    const h = Math.sqrt(Math.max(0, (Math.floor(d / 2) + 2) ** 2 - (d / 2) ** 2)) + 0.5;
    out.extent.push(rot([0, h], r), rot([0, -h], r), rot([-d / 2 - 1, 0], r), rot([d / 2 + 1, 0], r));
    return out;
  }
  if (g === "equi") {
    const [d, y1, y2] = n;
    put("A", [0, 0]); put("B", [d, 0]);
    out.lines.push({ g: lineThru([-1, y1], unit([-1, y1], [d + 1, y2])), role: "road" });
    out.want = [[d / 2, (y1 + y2) / 2]];
    const h = Math.sqrt(Math.max(0, (Math.floor(d / 2) + 2) ** 2 - (d / 2) ** 2));
    out.extent.push([-1.5, y1], [d + 1.5, y2], [d / 2, -h - 0.3], [d / 2, Math.max(y1, y2) + 0.8]);
    return out;
  }
  if (g === "angle") {
    const [th, r] = n, A: XY = rot([7, 0], r), B: XY = rot([7, 0], r + th);
    put("O", [0, 0]); put("A", A); put("B", B);
    out.lines.push({ g: rayAt([0, 0], r, 7), role: "arm" }, { g: rayAt([0, 0], r + th, 7), role: "arm" });
    out.want = [rot([1, 0], r + th / 2)];
    out.extent.push([0, 0], A, B, rot([7.5, 0], r + th / 2), [-1, -1]);
    return out;
  }
  if (g === "sixty") {
    const [r] = n, A: XY = rot([8, 0], r);
    put("O", [0, 0]); put("A", A);
    out.lines.push({ g: rayAt([0, 0], r, 8), role: "arm" });
    out.want = [rot([1, 0], r + 60)];
    out.extent.push([0, 0], A, rot([6, 0], r + 60), rot([5, 0], r - 60), [-1.5, 0]);
    return out;
  }
  // alt: B = (0, 0), C = (base, 0), A = (fx, hgt), all turned by rot; M is BC's midpoint
  const [base, fx, hgt, r] = n;
  const B: XY = [0, 0], C: XY = rot([base, 0], r), A: XY = rot([fx, hgt], r), M: XY = rot([base / 2, 0], r), F: XY = rot([fx, 0], r);
  put("A", A); put("B", B); put("C", C); put("M", M);
  out.lines.push({ g: seg(B, C), role: "side" }, { g: seg(C, A), role: "side" }, { g: seg(A, B), role: "side" });
  out.want = [F];
  out.extent.push(A, B, C, F, rot([Math.min(0, fx) - 1, -0.8], r), rot([Math.max(base, fx) + 1, -0.8], r));
  return out;
}

// ── the geometry of marks ──
/** every mark on the board as geometry: the given lines, the given arcs, then the child's marks in order */
export function geoms(p: ParkarParams, s: Pick<ParkarState, "marks" | "pins">): Geo[] {
  const b = boardOf(p), out: Geo[] = b.lines.map((l) => l.g);
  for (const a of b.arcs) out.push({ k: "circle", c: b.pts[a.c], r: a.r });
  for (const m of s.marks) out.push(geoOf(p, s, m, out));
  return out;
}
export function spot(p: ParkarParams, s: Pick<ParkarState, "pins">, id: string): XY | null {
  const b = boardOf(p);
  if (b.pts[id]) return b.pts[id];
  const pin = s.pins.find((x) => x.id === id);
  return pin ? [pin.x, pin.y] : null;
}
function geoOf(p: ParkarParams, s: Pick<ParkarState, "pins">, m: Mark, prior: Geo[]): Geo {
  if (m.t === "arc") return { k: "circle", c: spot(p, s, m.c)!, r: m.r };
  if (m.t === "ray") { const arm = boardOf(p).arms[m.at]; return rayAt(spot(p, s, m.at)!, arm.zero + arm.sense * m.deg, 14); }
  if (m.t === "sq") {
    const at = spot(p, s, m.at)!;
    if (m.on < 0) return lineThru(at, [0, 1]);
    const L = prior[m.on] as LineG;
    return lineThru(at, [-L.d[1], L.d[0]]);
  }
  const a = spot(p, s, m.p)!, q = spot(p, s, m.q)!;
  return lineThru(a, unit(a, q));
}
const onLine = (L: LineG, t: number) => t >= L.lo - 1e-7 && t <= L.hi + 1e-7;
/** where two marks cross, sorted (x, then y) so a crossing's index is stable */
export function crossings(A: Geo, B: Geo): XY[] {
  let out: XY[] = [];
  if (A.k === "circle" && B.k === "circle") {
    const d = dist(A.c, B.c);
    if (d < EPS || d > A.r + B.r + EPS || d < Math.abs(A.r - B.r) - EPS) return [];
    const a = (A.r * A.r - B.r * B.r + d * d) / (2 * d), h = Math.sqrt(Math.max(0, A.r * A.r - a * a));
    const ux = (B.c[0] - A.c[0]) / d, uy = (B.c[1] - A.c[1]) / d, mx = A.c[0] + a * ux, my = A.c[1] + a * uy;
    out = h < 1e-7 ? [[mx, my]] : [[mx - h * uy, my + h * ux], [mx + h * uy, my - h * ux]];
  } else if (A.k === "line" && B.k === "line") {
    const den = A.d[0] * B.d[1] - A.d[1] * B.d[0];
    if (Math.abs(den) < 1e-9) return [];
    const dx = B.p[0] - A.p[0], dy = B.p[1] - A.p[1];
    const t = (dx * B.d[1] - dy * B.d[0]) / den, u = (dx * A.d[1] - dy * A.d[0]) / den;
    if (onLine(A, t) && onLine(B, u)) out = [[A.p[0] + t * A.d[0], A.p[1] + t * A.d[1]]];
  } else {
    const L = (A.k === "line" ? A : B) as LineG, C = (A.k === "circle" ? A : B) as CircleG;
    const fx = L.p[0] - C.c[0], fy = L.p[1] - C.c[1], bb = fx * L.d[0] + fy * L.d[1], cc = fx * fx + fy * fy - C.r * C.r, disc = bb * bb - cc;
    if (disc < -EPS) return [];
    const sq = Math.sqrt(Math.max(0, disc)), ts = sq < 1e-7 ? [-bb] : [-bb - sq, -bb + sq];
    out = ts.filter((t) => onLine(L, t)).map((t) => [L.p[0] + t * L.d[0], L.p[1] + t * L.d[1]] as XY);
  }
  return out.sort((a, b) => (Math.abs(a[0] - b[0]) > 1e-7 ? a[0] - b[0] : a[1] - b[1]));
}
/** a spot already on the board at xy (a given spot or a pin) */
function spotAt(p: ParkarParams, s: Pick<ParkarState, "pins">, xy: XY): string | null {
  const b = boardOf(p);
  for (const id of b.ids) if (same(b.pts[id], xy)) return id;
  for (const pin of s.pins) if (same([pin.x, pin.y], xy)) return pin.id;
  return null;
}
const lineDist = (L: LineG, x: XY) => Math.abs((x[0] - L.p[0]) * L.d[1] - (x[1] - L.p[1]) * L.d[0]);
const lastOf = <T extends Mark["t"]>(s: Pick<ParkarState, "marks">, ...ts: T[]) => { for (let i = s.marks.length - 1; i >= 0; i--) if ((ts as string[]).includes(s.marks[i].t)) return i; return -1; };

// ── THE judgement of a run ──
export function judge(p: ParkarParams, s: Pick<ParkarState, "marks" | "pins">): boolean {
  const b = boardOf(p), G = geoms(p, s), base = b.lines.length + b.arcs.length;
  const last = s.pins[s.pins.length - 1];
  switch (p.goal) {
    // the vertex where the card's triangle has it, or its mirror image across AB (a tracing turned over fits the same)
    case "sss": case "sas": case "asa": case "rhs": return !!last && (same([last.x, last.y], b.want[0]) || same([last.x, -last.y], b.want[0]));
    case "long": case "short": { const i = stickOf(s); return i >= 0 && Math.abs((s.marks[i] as { r: number }).r - b.stick) < EPS; }
    case "ssa": return b.want.every((w) => s.pins.some((q) => same([q.x, q.y], w)));
    case "equi": return !!last && lineDist(b.lines[0].g, [last.x, last.y]) < 1e-4 && Math.abs(dist([last.x, last.y], b.pts.A) - dist([last.x, last.y], b.pts.B)) < 1e-4;
    case "perp": {
      const i = lastOf(s, "join"); if (i < 0) return false;
      const L = G[base + i] as LineG, AB = unit(b.pts.A, b.pts.B), mid: XY = [(b.pts.A[0] + b.pts.B[0]) / 2, (b.pts.A[1] + b.pts.B[1]) / 2];
      return lineDist(L, mid) < 1e-4 && Math.abs(L.d[0] * AB[0] + L.d[1] * AB[1]) < 1e-6;
    }
    case "angle": case "sixty": {
      const i = lastOf(s, "join"); if (i < 0) return false;
      // sixty: 60° on either side of OA is a 60° angle
      const L = G[base + i] as LineG, ws = p.goal === "sixty" ? [b.want[0], rot([1, 0], p.n[0] - 60)] : b.want;
      return lineDist(L, b.pts.O) < 1e-4 && ws.some((w) => Math.abs(L.d[0] * w[1] - L.d[1] * w[0]) < 1e-6);
    }
    case "alt": {
      const i = lastOf(s, "join", "sq"); if (i < 0) return false;
      const L = G[base + i] as LineG, BC = unit(b.pts.B, b.pts.C);
      return lineDist(L, b.pts.A) < 1e-4 && Math.abs(L.d[0] * BC[0] + L.d[1] * BC[1]) < 1e-6;
    }
  }
}
/** long / short: the last arc swung from B (the third stick) */
const stickOf = (s: Pick<ParkarState, "marks">) => { for (let i = s.marks.length - 1; i >= 0; i--) { const m = s.marks[i]; if (m.t === "arc" && m.c === "B") return i; } return -1; };

/** a pin's two parent marks when both are arcs: [centre id, r] each */
function pinArcs(p: ParkarParams, s: Pick<ParkarState, "marks" | "pins">, pin: Pin): [string, number][] | null {
  const b = boardOf(p), base = b.lines.length + b.arcs.length;
  const arcOf = (i: number): [string, number] | null => {
    if (i >= b.lines.length && i < base) { const a = b.arcs[i - b.lines.length]; return [a.c, a.r]; }
    const m = s.marks[i - base];
    return m && m.t === "arc" ? [m.c, m.r] : null;
  };
  const x = arcOf(pin.a), y = arcOf(pin.b);
  return x && y ? [x, y] : null;
}
const pinOf = (s: Pick<ParkarState, "pins">, id: string) => s.pins.find((q) => q.id === id);
/** a join's line made from crossings of arcs round c1 and c2, with an opening changed between them */
function unequalPair(p: ParkarParams, s: Pick<ParkarState, "marks" | "pins">, m: Mark | undefined, c1: string, c2: string): boolean {
  if (!m || m.t !== "join") return false;
  let unequal = false;
  for (const id of [m.p, m.q]) {
    const pin = pinOf(s, id); if (!pin) return false;
    const pa = pinArcs(p, s, pin); if (!pa) return false;
    const cs = pa.map((x) => x[0]).sort().join(), want = [c1, c2].sort().join();
    if (cs !== want) return false;
    if (pa[0][1] !== pa[1][1]) unequal = true;
  }
  return unequal;
}
/** does the child's construction read as this belief (only asked when the run missed) */
function reads(p: ParkarParams, s: Pick<ParkarState, "marks" | "pins">, mal: string): boolean {
  if (!MAL_OF[p.goal].includes(mal)) return false;
  const b = boardOf(p), last = s.pins[s.pins.length - 1];
  if (mal === "swap" || mal === "wrong-vertex") { const w = malPoint(p, mal); return !!w && !!last && (same([last.x, last.y], w) || same([last.x, -last.y], w)); }
  if (mal === "equal-sum" || mal === "any-three") { const i = stickOf(s); return i >= 0 && (s.marks[i] as { r: number }).r === malStick(p, mal); }
  if (mal === "ssa") return b.want.filter((w) => s.pins.some((q) => same([q.x, q.y], w))).length === 1;
  if (mal === "compass-change") {
    const j = lastOf(s, "join"), m = s.marks[j];
    if (p.goal === "perp") return unequalPair(p, s, m, "A", "B");
    if (p.goal === "equi") {
      if (!last) return false;
      const base = b.lines.length + b.arcs.length, line = [last.a, last.b].find((i) => i >= base && s.marks[i - base].t === "join");
      if (line === undefined || ![last.a, last.b].includes(0)) return false;
      return unequalPair(p, s, s.marks[line - base], "A", "B");
    }
    if (!m || m.t !== "join" || ![m.p, m.q].includes("O")) return false;
    const R = pinOf(s, m.p === "O" ? m.q : m.p); if (!R) return false;
    const pa = pinArcs(p, s, R); if (!pa) return false;
    if (p.goal === "angle") {
      // R from arcs round two cut-spots, one on each arm, with different openings
      if (pa[0][1] === pa[1][1]) return false;
      const arms = pa.map(([c]) => { const q = pinOf(s, c); return q ? [q.a, q.b].find((i) => i === 0 || i === 1) : undefined; });
      return arms[0] !== undefined && arms[1] !== undefined && arms[0] !== arms[1];
    }
    // sixty: R from an arc round O and an arc round a cut-spot P on OA, the openings not all the same
    const o = pa.find(([c]) => c === "O"), q = pa.find(([c]) => c !== "O");
    if (!o || !q) return false;
    const P = pinOf(s, q[0]); if (!P || ![P.a, P.b].includes(0)) return false;
    const op = dist([P.x, P.y], b.pts.O);
    return !(Math.abs(o[1] - q[1]) < EPS && Math.abs(op - q[1]) < EPS);
  }
  const i = lastOf(s, "join", "sq"), m = s.marks[i];
  if (!m) return false;
  if (mal === "median") return m.t === "join" && [m.p, m.q].sort().join() === "A,M";
  if (mal === "vertical") return m.t === "sq" && m.at === "A" && m.on === -1;
  if (mal === "inside-only") { const e = nearEnd(p); return !!e && m.t === "join" && [m.p, m.q].sort().join() === ["A", e].sort().join(); }
  return false;
}
/** alt: the end of BC nearest the foot when the foot falls outside BC, else null */
function nearEnd(p: ParkarParams): string | null {
  const [base, fx] = p.n;
  return fx < 0 ? "B" : fx > base ? "C" : null;
}
/** sss swap / sas wrong-vertex: the vertex the belief builds (above AB), or null */
function malPoint(p: ParkarParams, mal: string): XY | null {
  if (p.goal === "sss" && mal === "swap") { const [a, bb, c] = p.n; return triC(bb, a, c); }
  if (p.goal === "sas" && mal === "wrong-vertex") {
    const [bb, c, A] = p.n, ray = rayAt([c, 0], 180 - A, 14), xs = crossings({ k: "circle", c: [0, 0], r: bb }, ray).filter((x) => x[1] > 0.3);
    return xs.length ? xs[xs.length - 1] : null;
  }
  return null;
}
function malStick(p: ParkarParams, mal: string): number {
  const [bb, c] = p.n;
  if (mal === "equal-sum") return p.goal === "long" ? bb + c : Math.abs(c - bb);
  return p.goal === "long" ? p.max : 1;
}

/** the values the teacher may not say before the child produces them */
export function parkarHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as ParkarParams | null;
  if (!p || typeof p.goal !== "string" || !Array.isArray(p.n)) return [];
  try {
    const b = boardOf(p), n = p.n;
    switch (p.goal) {
      case "sss": { const C = b.want[0]; return [String(Math.round(deg(Math.atan2(C[1], C[0]))))]; }
      case "sas": return [String(r1(dist(b.want[0], b.pts.B)))];
      case "asa": return [String(r1(dist(b.want[0], b.pts.A))), String(r1(dist(b.want[0], b.pts.B)))];
      case "rhs": return [String(r1(b.want[0][1]))];
      case "long": case "short": return [String(b.stick)];
      case "ssa": return ["2"];
      case "perp": return [String(n[0] / 2)];
      case "equi": return [String(r1(dist(b.want[0], b.pts.A)))];
      case "angle": return [String(n[0] / 2)];
      case "sixty": return ["60"];
      case "alt": return [String(r1(n[2]))];
    }
  } catch { return []; }
  return [];
}

// ── the law ──
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const MAX_MARKS = 24;

function coreOk(goal: ParkarGoal, look: number, n: number[]): boolean {
  if (n.length !== NUMS[goal] || !n.every(isInt)) return false;
  const tilt = (r: number) => (look === 1 ? r === 0 : r === 0 || (Math.abs(r) >= 10 && Math.abs(r) <= 45));
  switch (goal) {
    case "sss": {
      const [a, b, c] = n;
      if ([a, b, c].some((x) => x < 3 || x > 10) || a === b) return false;
      return triC(a, b, c)[1] >= 2 && a + b > c && a + c > b && b + c > a;
    }
    case "sas": { const [b, c, A] = n; return b >= 3 && b <= 10 && c >= 4 && c <= 10 && A >= 30 && A <= 120 && A % 5 === 0 && b * Math.sin(rad(A)) >= 2; }
    case "asa": { const [c, A, B] = n; return c >= 4 && c <= 10 && A >= 30 && B >= 30 && A % 5 === 0 && B % 5 === 0 && A !== B && A + B <= 130 && c * Math.sin(rad(A)) * Math.sin(rad(B)) / Math.sin(rad(A + B)) <= 9; }
    case "rhs": { const [h, c] = n; return c >= 3 && c <= 8 && h > c && h <= Math.min(10, c + 5) && Math.sqrt(h * h - c * c) >= 2; }
    case "long": { const [b, c] = n; return b >= 2 && c >= 3 && b !== c && b + c <= MAXR - 1 && b + c - 1 !== b && b + c - 1 !== c; }
    case "short": { const [b, c] = n, t = Math.abs(c - b) + 1; return b >= 2 && c >= 3 && b <= 9 && c <= 10 && Math.abs(c - b) >= 2 && t !== b && t !== c; }
    case "ssa": {
      const [a, c, A] = n, h = c * Math.sin(rad(A));
      return c >= 6 && c <= 10 && A >= 25 && A <= 50 && A % 5 === 0 && a > h + 0.8 && a < c - 0.8 && 2 * Math.sqrt(a * a - h * h) >= 1.5;
    }
    case "perp": { const [d, r] = n; return d >= 4 && d <= 9 && tilt(r) && (look === 1 || r !== 0); }
    case "equi": { const [d, y1, y2] = n; return d >= 4 && d <= 8 && y1 >= 3 && y1 <= 7 && y2 >= 3 && y2 <= 7 && Math.abs(y1 - y2) >= 2 && (y1 + y2) % 2 === 0; }
    case "angle": { const [th, r] = n; return th >= 40 && th <= 140 && th % 10 === 0 && tilt(r); }
    case "sixty": { const [r] = n; return tilt(r); }
    case "alt": {
      const [base, fx, hgt, r] = n;
      if (base < 5 || base > 9 || hgt < 3 || hgt > 6 || r === 0 || Math.abs(r) < 10 || Math.abs(r) > 45) return false;
      if (fx === 0 || fx === base || Math.abs(2 * fx - base) < 2) return false;
      return look === 3 ? (fx >= -3 && fx <= -1) || (fx >= base + 1 && fx <= base + 3) : fx >= 1 && fx <= base - 1;
    }
  }
}
function validate(level: PlayLevel<unknown>): PlayLevel<ParkarParams> | null {
  const p = level.params as Partial<ParkarParams> | null, mode = level.mode as ParkarMode;
  if (!p || !GOALS_OF[mode] || !GOALS_OF[mode].includes(p.goal as ParkarGoal)) return null;
  const goal = p.goal as ParkarGoal, look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || p.max !== MAXR || !Array.isArray(p.n)) return null;
  // nothing but the goal, the look, its numbers and the compass's top (a tampered level never smuggles a second puzzle in)
  if (Object.keys(p).some((k) => !["goal", "look", "n", "max"].includes(k))) return null;
  const n = [...p.n];
  if (!coreOk(goal, look, n)) return null;
  return { ...level, params: { goal, look, n, max: MAXR } } as PlayLevel<ParkarParams>;
}
function init(_level: PlayLevel<ParkarParams>): ParkarState {
  return { r: 0, marks: [], pins: [], ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}
const sameMark = (a: Mark, b: Mark) => JSON.stringify(a) === JSON.stringify(b);

function apply(level: PlayLevel<ParkarParams>, s: ParkarState, act: ParkarAct, seq: number): { state: ParkarState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [], tools = TOOLS[p.goal];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: ParkarState): ParkarState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const change = (patch: Partial<ParkarState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  const addMark = (m: Mark) => {
    if (s.marks.length >= MAX_MARKS) return no("board_full");
    if (s.marks.some((x) => sameMark(x, m))) return no("same_mark");
    return change({ marks: [...s.marks, m] });
  };
  const isSpot = (id: unknown): id is string => typeof id === "string" && !!spot(p, s, id);
  switch (act.kind) {
    case "open": {
      if (!tools.includes("compass")) return no("no_compass");
      const r = Number(act.r);
      if (!isInt(r) || r < 1 || r > p.max) return no("off_ruler");
      if (r === s.r) return no("same_opening");
      return change({ r });
    }
    case "arc": {
      if (!tools.includes("compass")) return no("no_compass");
      if (!s.r) return no("open_first");
      if (!isSpot(act.at)) return no("no_spot");
      return addMark({ t: "arc", c: act.at, r: s.r });
    }
    case "ray": {
      if (!tools.includes("protractor")) return no("no_protractor");
      const d = Number(act.deg);
      if (typeof act.at !== "string" || !boardOf(p).arms[act.at]) return no("no_arm");
      if (!isInt(d) || d < 1 || d > 179) return no("off_protractor");
      return addMark({ t: "ray", at: act.at, deg: d });
    }
    case "square": {
      if (!tools.includes("square")) return no("no_square");
      const on = Number(act.on);
      if (!isSpot(act.at) || !isInt(on)) return no("no_spot");
      if (on === -1 ? p.goal !== "alt" : on < 0 || on >= geoms(p, s).length || geoms(p, s)[on].k !== "line") return no("no_edge");
      return addMark({ t: "sq", at: act.at, on });
    }
    case "join": {
      if (!tools.includes("ruler")) return no("no_ruler");
      if (!isSpot(act.p) || !isSpot(act.q) || act.p === act.q) return no("no_spot");
      if (same(spot(p, s, act.p)!, spot(p, s, act.q)!)) return no("same_spot");
      const [a, q] = [act.p, act.q].sort();
      return addMark({ t: "join", p: a, q });
    }
    case "pin": {
      const G = geoms(p, s), a = Number(act.a), b = Number(act.b), k = Number(act.k);
      if (!isInt(a) || !isInt(b) || !isInt(k) || a < 0 || b < 0 || a >= G.length || b >= G.length || a === b) return no("no_crossing");
      const xs = crossings(G[a], G[b]);
      if (k < 0 || k >= xs.length) return no("no_crossing");
      const xy = xs[k];
      if (spotAt(p, s, xy)) return no("same_spot");
      if (s.pins.length >= MAX_MARKS) return no("board_full");
      const [lo, hi] = a < b ? [a, b] : [b, a];
      return change({ pins: [...s.pins, { id: `P${s.pins.length + 1}`, x: xy[0], y: xy[1], a: lo, b: hi }] });
    }
    case "run": {
      if (s.ended) return no("change_first");
      const g = p.goal;
      if ((TRI_GOALS.includes(g) || g === "ssa" || g === "equi") && !s.pins.length) return no("pin_first");
      if ((g === "long" || g === "short") && stickOf(s) < 0) return no("arc_first");
      if ((g === "perp" || g === "angle" || g === "sixty") && lastOf(s, "join") < 0) return no("join_first");
      if (g === "alt" && lastOf(s, "join", "sq") < 0) return no("line_first");
      const runs = s.runs + 1, ok = judge(p, s);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: g, run: runs };
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) if (reads(p, s, mal)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      out.push(mom(nearly(p, s) ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
/** one cm off (a stick, a vertex), or one of the two SSA triangles: near */
function nearly(p: ParkarParams, s: ParkarState): boolean {
  const b = boardOf(p), last = s.pins[s.pins.length - 1];
  if (TRI_GOALS.includes(p.goal)) return !!last && Math.min(dist([last.x, last.y], b.want[0]), dist([last.x, -last.y], b.want[0])) <= 1;
  if (p.goal === "long" || p.goal === "short") { const i = stickOf(s); return i >= 0 && Math.abs((s.marks[i] as { r: number }).r - b.stick) === 1; }
  return false;
}
const goalMet = (_l: PlayLevel<ParkarParams>, s: ParkarState) => s.done;

// ── scripts: the solver's and the beliefs' constructions, turned into acts against the live law ──
type Step = ParkarAct | { kind: "pinNear"; a: number; b: number; near: XY };
/** run steps through the law; a pinNear step becomes the pin of the crossing nearest `near`; null if any step is refused */
function script(level: PlayLevel<ParkarParams>, steps: Step[]): ParkarAct[] | null {
  let s = init(level);
  const acts: ParkarAct[] = [];
  for (const st of steps) {
    let a: ParkarAct;
    if (st.kind === "pinNear") {
      const G = geoms(level.params, s);
      if (st.a >= G.length || st.b >= G.length) return null;
      const xs = crossings(G[st.a], G[st.b]);
      if (!xs.length) return null;
      let k = 0;
      xs.forEach((x, i) => { if (dist(x, st.near) < dist(xs[k], st.near)) k = i; });
      a = { kind: "pin", a: st.a, b: st.b, k };
    } else a = st;
    const r = apply(level, s, a, acts.length + 1);
    if (r.refused && !(a.kind === "run" && r.refused === "missed")) return null;
    s = r.state; acts.push(a);
  }
  return acts;
}
/** the steps of a construction (the solver's when mal is null) */
function stepsOf(p: ParkarParams, mal: string | null): Step[] | null {
  const b = boardOf(p), n = p.n, G0 = b.lines.length + b.arcs.length, W = b.want[0], run: Step = { kind: "run" };
  const up = (x: XY): XY => [x[0], x[1] + 0.01];
  switch (p.goal) {
    case "sss": {
      const [a, bb] = n, [ra, rb] = mal === "swap" ? [a, bb] : [bb, a];
      const at = mal === "swap" ? malPoint(p, "swap")! : W;
      return [{ kind: "open", r: ra }, { kind: "arc", at: "A" }, { kind: "open", r: rb }, { kind: "arc", at: "B" }, { kind: "pinNear", a: G0, b: G0 + 1, near: up(at) }, run];
    }
    case "sas": {
      const [bb, , A] = n;
      if (mal === "wrong-vertex") { const w = malPoint(p, mal); if (!w) return null; return [{ kind: "ray", at: "B", deg: A }, { kind: "open", r: bb }, { kind: "arc", at: "A" }, { kind: "pinNear", a: G0, b: G0 + 1, near: w }, run]; }
      return [{ kind: "ray", at: "A", deg: A }, { kind: "open", r: bb }, { kind: "arc", at: "A" }, { kind: "pinNear", a: G0, b: G0 + 1, near: W }, run];
    }
    case "asa": return [{ kind: "ray", at: "A", deg: n[1] }, { kind: "ray", at: "B", deg: n[2] }, { kind: "pinNear", a: G0, b: G0 + 1, near: W }, run];
    case "rhs": return [{ kind: "square", at: "B", on: 0 }, { kind: "open", r: n[0] }, { kind: "arc", at: "A" }, { kind: "pinNear", a: G0, b: G0 + 1, near: W }, run];
    case "long": case "short": return [{ kind: "open", r: mal ? malStick(p, mal) : b.stick }, { kind: "arc", at: "B" }, run];
    case "ssa": {
      const steps: Step[] = [{ kind: "open", r: n[0] }, { kind: "arc", at: "B" }, { kind: "pinNear", a: 1, b: G0, near: b.want[1] }];
      if (!mal) steps.push({ kind: "pinNear", a: 1, b: G0, near: b.want[0] });
      return [...steps, run];
    }
    case "perp": case "equi": {
      const d = dist(b.pts.A, b.pts.B), r = Math.floor(d / 2) + 1, r2 = mal ? r + 1 : r;
      const mid: XY = [(b.pts.A[0] + b.pts.B[0]) / 2, (b.pts.A[1] + b.pts.B[1]) / 2], nrm = unit(b.pts.A, b.pts.B);
      const above: XY = [mid[0] - nrm[1] * 9, mid[1] + nrm[0] * 9], below: XY = [mid[0] + nrm[1] * 9, mid[1] - nrm[0] * 9];
      const steps: Step[] = [{ kind: "open", r }, { kind: "arc", at: "A" }, ...(mal ? [{ kind: "open", r: r2 } as Step] : []), { kind: "arc", at: "B" },
        { kind: "pinNear", a: G0, b: G0 + 1, near: above }, { kind: "pinNear", a: G0, b: G0 + 1, near: below }, { kind: "join", p: "P1", q: "P2" }];
      if (p.goal === "equi") steps.push({ kind: "pinNear", a: 0, b: G0 + 2, near: W });
      return [...steps, run];
    }
    case "angle": {
      const far = rot([9, 0], n[1] + n[0] / 2);
      return [{ kind: "open", r: 4 }, { kind: "arc", at: "O" }, { kind: "pinNear", a: 0, b: G0, near: b.pts.A }, { kind: "pinNear", a: 1, b: G0, near: b.pts.B },
        { kind: "arc", at: "P1" }, ...(mal ? [{ kind: "open", r: 5 } as Step] : []), { kind: "arc", at: "P2" },
        { kind: "pinNear", a: G0 + 1, b: G0 + 2, near: far }, { kind: "join", p: "O", q: "P3" }, run];
    }
    case "sixty": {
      const near = rot([4, 0], n[0] + 60);
      return [{ kind: "open", r: 4 }, { kind: "arc", at: "O" }, { kind: "pinNear", a: 0, b: G0, near: b.pts.A }, ...(mal ? [{ kind: "open", r: 5 } as Step] : []),
        { kind: "arc", at: "P1" }, { kind: "pinNear", a: G0, b: G0 + 1, near }, { kind: "join", p: "O", q: "P2" }, run];
    }
    case "alt": {
      if (mal === "median") return [{ kind: "join", p: "A", q: "M" }, run];
      if (mal === "vertical") return [{ kind: "square", at: "A", on: -1 }, run];
      if (mal === "inside-only") { const e = nearEnd(p); return e ? [{ kind: "join", p: "A", q: e }, run] : null; }
      return [{ kind: "square", at: "A", on: 0 }, run];
    }
  }
}
/** replay acts; the run's state */
function after(level: PlayLevel<ParkarParams>, acts: ParkarAct[]): ParkarState {
  let s = init(level);
  acts.forEach((a, i) => { s = apply(level, s, a, i + 1).state; });
  return s;
}
function solve(level: PlayLevel<ParkarParams>): ParkarAct[] | null {
  const st = stepsOf(level.params, null);
  const acts = st ? script(level, st) : null;
  return acts && after(level, acts).done ? acts : null;
}
/** the set-up a belief commits: legal, missing, and read as that belief and no other of the goal's */
function malActs(level: PlayLevel<ParkarParams>, mal: string): ParkarAct[] | null {
  const p = level.params;
  if (!MAL_OF[p.goal].includes(mal)) return null;
  const st = stepsOf(p, mal);
  const acts = st ? script(level, st) : null;
  if (!acts) return null;
  const s = after(level, acts);
  if (s.done || !reads(p, s, mal)) return null;
  for (const other of MAL_OF[p.goal]) if (other !== mal && reads(p, s, other)) return null;
  return acts;
}
/**
 * Constructions that win without the idea: the base's own length for every arc (an equilateral guess), the lengths swung
 * from the wrong ends, both rays at one angle, the hypotenuse swung from the right angle, the stick as long as a side given,
 * the compass's top or its smallest opening, only one SSA triangle, A joined to B, the tank where an arc of AB from A cuts
 * the road, the angle's own arm, A joined to M or the square along the page. A level any of them solves is never served.
 */
export function shortcutSteps(p: ParkarParams): Step[][] {
  const b = boardOf(p), n = p.n, G0 = b.lines.length + b.arcs.length, run: Step = { kind: "run" }, hi: XY = [b.want[0][0], b.want[0][1] + 20];
  const c = dist(b.pts.A ?? [0, 0], b.pts.B ?? [0, 0]);
  switch (p.goal) {
    case "sss": return [[{ kind: "open", r: n[2] }, { kind: "arc", at: "A" }, { kind: "arc", at: "B" }, { kind: "pinNear", a: G0, b: G0 + 1, near: hi }, run], stepsOf(p, "swap")!];
    case "sas": return [[{ kind: "ray", at: "A", deg: n[2] }, { kind: "open", r: n[1] }, { kind: "arc", at: "A" }, { kind: "pinNear", a: G0, b: G0 + 1, near: hi }, run],
      [{ kind: "ray", at: "A", deg: 90 }, { kind: "open", r: n[0] }, { kind: "arc", at: "A" }, { kind: "pinNear", a: G0, b: G0 + 1, near: hi }, run]];
    case "asa": return [[{ kind: "ray", at: "A", deg: n[1] }, { kind: "ray", at: "B", deg: n[1] }, { kind: "pinNear", a: G0, b: G0 + 1, near: hi }, run],
      [{ kind: "ray", at: "A", deg: n[2] }, { kind: "ray", at: "B", deg: n[1] }, { kind: "pinNear", a: G0, b: G0 + 1, near: hi }, run]];
    case "rhs": return [[{ kind: "square", at: "B", on: 0 }, { kind: "open", r: n[0] }, { kind: "arc", at: "B" }, { kind: "pinNear", a: G0, b: G0 + 1, near: hi }, run]];
    case "long": case "short": return [n[0], n[1], p.max, 1].map((r) => [{ kind: "open", r }, { kind: "arc", at: "B" }, run] as Step[]);
    case "ssa": return [stepsOf(p, "ssa")!, [{ kind: "open", r: n[0] }, { kind: "arc", at: "B" }, { kind: "pinNear", a: 1, b: G0, near: b.want[0] }, run]];
    case "perp": return [[{ kind: "open", r: Math.ceil(c) }, { kind: "arc", at: "A" }, { kind: "pinNear", a: 0, b: G0, near: b.pts.B }, run]];
    case "equi": return [[{ kind: "open", r: Math.min(p.max, Math.ceil(c)) }, { kind: "arc", at: "A" }, { kind: "pinNear", a: 0, b: G0, near: b.want[0] }, run]];
    case "angle": return [[{ kind: "join", p: "O", q: "A" }, run], [{ kind: "join", p: "A", q: "B" }, run]];
    case "sixty": return [[{ kind: "join", p: "O", q: "A" }, run]];
    case "alt": return [[{ kind: "join", p: "A", q: "M" }, run], [{ kind: "square", at: "A", on: -1 }, run], [{ kind: "square", at: "A", on: 2 }, run]];
  }
}
function shortcut(level: PlayLevel<ParkarParams>): ParkarAct[] | null {
  for (const st of shortcutSteps(level.params)) {
    const acts = script(level, st);
    if (acts && after(level, acts).done) return acts;
  }
  return null;
}

function difficultyOf(p: ParkarParams): number {
  const f = 0.07 * (p.look - 1);
  const base: Record<ParkarGoal, number> = { sss: 0.3, sas: 0.38, asa: 0.36, rhs: 0.42, long: 0.4, short: 0.45, ssa: 0.5, perp: 0.3, equi: 0.45, angle: 0.4, sixty: 0.42, alt: 0.35 };
  return Math.min(1, base[p.goal] + f + (p.goal === "alt" && p.look === 3 ? 0.1 : 0));
}
function generate(req: GenRequest): Candidate<ParkarParams>[] {
  const mode = (["build", "bisect", "drop"] as const).find((m) => m === req.mode) ?? "build";
  const goal = (GOALS_OF[mode].includes(req.goal as ParkarGoal) ? req.goal : GOALS_OF[mode][0]) as ParkarGoal;
  const rnd = mulberry32(req.seed), out: Candidate<ParkarParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const tilt = () => (look === 1 ? 0 : (rnd() < 0.5 ? -1 : 1) * 5 * int(2, 8));
  for (let k = 0; k < 160 && out.length < 24; k++) {
    let n: number[] = [];
    switch (goal) {
      case "sss": n = [int(3, 9), int(3, 9), int(look === 1 ? 5 : 4, 10)]; break;
      case "sas": n = [int(3, 8), int(4, 10), 5 * int(look === 3 ? 18 : 6, look === 1 ? 18 : 24)]; break;
      case "asa": n = [int(4, 10), 5 * int(6, 16), 5 * int(6, 16)]; break;
      case "rhs": { const c = int(3, 7); n = [int(c + 1, Math.min(10, c + 5)), c]; break; }
      case "long": n = [int(2, 6), int(3, 8)]; break;
      case "short": n = [int(2, 8), int(3, 10)]; break;
      case "ssa": n = [int(4, 9), int(6, 10), 5 * int(5, 10)]; break;
      case "perp": n = [int(4, 9), tilt()]; break;
      case "equi": { const y1 = int(3, 7); n = [int(4, 8), y1, y1 + (rnd() < 0.5 ? -1 : 1) * 2 * int(1, 2)]; break; }
      case "angle": n = [10 * int(look === 3 ? 9 : 4, look === 1 ? 9 : 14), tilt()]; break;
      case "sixty": n = [tilt()]; break;
      case "alt": {
        const base = int(5, 9), fx = look === 3 ? (rnd() < 0.5 ? -int(1, 3) : base + int(1, 3)) : int(1, base - 1);
        n = [base, fx, int(3, 6), (rnd() < 0.5 ? -1 : 1) * 5 * int(3, 8)];
        break;
      }
    }
    const sig = `${goal}:${look}:${n.join(",")}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const params: ParkarParams = { goal, look, n, max: MAXR };
    const level = {
      v: "play@1", levelId: `parkar-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "parkar", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "parkar", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    } as PlayLevel<ParkarParams>;
    const v = validate(level as PlayLevel<unknown>);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push({ signature: sig, difficulty: difficultyOf(params), level: v });
  }
  return out;
}

function facts(level: PlayLevel<ParkarParams>, s: ParkarState): Facts {
  const f: Facts = { goal: level.params.goal };
  if (s.r) f.opening = `${s.r} cm`;
  f.marks = s.marks.length;
  if (s.pins.length) f.pins = s.pins.length;
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<ParkarParams>, s: ParkarState) {
  const p = level.params, lines = [`${p.goal}: ${p.n.join(", ")}`, `compass: ${s.r || "closed"}`];
  for (const m of s.marks) lines.push(m.t === "arc" ? `arc from ${m.c}, ${m.r} cm` : m.t === "ray" ? `ray at ${m.at}, ${m.deg}°` : m.t === "sq" ? `set-square at ${m.at} on ${m.on}` : `ruler ${m.p}–${m.q}`);
  for (const q of s.pins) lines.push(`${q.id}: (${r1(q.x)}, ${r1(q.y)})`);
  return { title: "Parkar", lines };
}
function grade(level: PlayLevel<ParkarParams>, acts: PlayActEnvelope<ParkarAct>[]): PlayGrade {
  return gradeLevel(parkarLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const parkarLogic: FamilyLogic<ParkarParams, ParkarState, ParkarAct> = {
  family: "parkar", modes: ["build", "bisect", "drop"], malRules: PARKAR_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
