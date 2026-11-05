// Darpan (दर्पण, "mirror") · round 7, symmetry. Two worlds, each a different law of a figure mapped onto itself; nothing
// moves on a clock: the child sets something up, presses go, and the law (plain geometry) answers.
//   mirror  lines     a rangoli / kite / flag / tile: the child lays mirror lines through the figure (a line through its
//                     centre and one of its corners or side-middles, the places a fold can run) and folds: the law reflects
//                     the whole figure (outline and pattern) across each line and shows whether it lands on itself. Solved
//                     when the lines laid are ALL the lines of symmetry and no other (the count matters).
//   turn    smallest  a pinwheel / wheel / tile on a turntable over its own traced outline: the child turns it (the dial
//                     moves in 15° steps, or 1° on a class-6 dial) to the smallest part turn that maps it onto itself, then
//                     spins; the law checks the image
//           order     the child marks every stop in one full turn where it looks the same (the full turn included, the
//                     start not), then spins: the law checks each mark and that none is missing (the count is the order)
// Mal-rules (each a deterministic set-up; a level serves one only where its set-up differs from every other mal-rule the
// level maps):
//   exactly-one      lines: one line only (the true line nearest to upright), on a figure with two or more
//   vertical-only    lines: only the upright line, on a figure whose lines include it and others
//   diagonals        lines: the true lines plus the corner-to-corner lines of a rectangle-like four-sided figure
//   equal-halves     lines: every line that cuts the outline into two halves of equal area
//   quarter-default  smallest: a quarter turn; order: a mark at every quarter turn
//   full-turn        smallest: the full turn; order: the start counted as well as the full turn (one mark too many)
//   mirror-only      a figure with no mirror line "has no symmetry": order: only the full turn marked; smallest: the full turn
//   angle-order      smallest (degree dial): the order dialled as degrees (a figure of order 3 turned 3°)
import type { Candidate, DarpanAct, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type DarpanMode = "mirror" | "turn";
export type DarpanGoal = "lines" | "smallest" | "order";
export type V = [number, number];
/** a closed polygon; kind 0 is the figure's body (the outline), 1-3 the pattern's colours */
export interface Piece { pts: V[]; kind: number }
export type Labels = 1 | 2 | 3;

export const MIRROR_FIGS = ["rect", "rhombus", "kite", "tri", "square", "pentagon", "hexagon", "octagon", "star"] as const;
export type MirrorFig = (typeof MIRROR_FIGS)[number];
export const MOTIFS = ["none", "dot", "arrow", "one", "two", "alt"] as const;
export type Motif = (typeof MOTIFS)[number];
/** mirror · a figure by name and whole-number sizes (a, b, c), its pattern, turned `tilt` degrees (a multiple of 15) */
export interface MirrorP { goal: "lines"; labels: Labels; fig: MirrorFig; a: number; b: number; c: number; motif: Motif; tilt: number }
export const TURN_FIGS = ["pinwheel", "parallelogram"] as const;
export const BLADES = ["petal", "hook", "flag"] as const;
export type Blade = (typeof BLADES)[number];
/** turn · a pinwheel of n blades (colours: one kind per blade) or a parallelogram (a, b, skew c); fine: a 1° dial (else 15°) */
export interface TurnP { goal: "smallest" | "order"; labels: Labels; fig: (typeof TURN_FIGS)[number]; n: number; blade: Blade; colours: number[]; a: number; b: number; c: number; start: number; fine: boolean }
export type DarpanParams = MirrorP | TurnP;

/** a set-up: the mirror lines laid (candidate indices, sorted), the turn on the dial, the marks (degrees, sorted) */
export interface Setup { lines: number[]; angle: number; marks: number[] }
export interface DarpanState extends Undoable<DarpanState>, Setup {
  /** the last go has been judged and nothing changed since */
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const DARPAN_MAL = ["exactly-one", "vertical-only", "diagonals", "equal-halves", "quarter-default", "full-turn", "mirror-only", "angle-order"] as const;
const MAL_OF: Record<DarpanGoal, readonly string[]> = {
  lines: ["exactly-one", "vertical-only", "diagonals", "equal-halves"],
  smallest: ["quarter-default", "full-turn", "mirror-only", "angle-order"],
  order: ["quarter-default", "full-turn", "mirror-only"],
};
const GOALS_OF: Record<DarpanMode, readonly DarpanGoal[]> = { mirror: ["lines"], turn: ["smallest", "order"] };
export const MAX_MARKS = 24;
/** two fold lines closer than this (degrees) would be one line to a finger: such a figure is never served */
export const MIN_GAP = 8;
const EPS = 1e-6;

// ───────────────────────────── geometry ─────────────────────────────

const RAD = Math.PI / 180;
export const rot = (v: V, deg: number): V => { const r = deg * RAD, c = Math.cos(r), s = Math.sin(r); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
const polar = (r: number, deg: number): V => [r * Math.cos(deg * RAD), r * Math.sin(deg * RAD)];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const near = (a: V, b: V) => Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS;
/** a small rhombus petal centred `d` out at angle phi, long axis radial (symmetric about its own radial and cross axes) */
const petal = (phi: number, d: number, L: number, W: number): V[] => { const c = polar(d, phi); return [add(c, polar(L, phi)), add(c, polar(W, phi + 90)), add(c, polar(-L, phi)), add(c, polar(-W, phi + 90))]; };
const regular = (n: number, R: number, start: number): V[] => Array.from({ length: n }, (_, k) => polar(R, start + (360 * k) / n));
/** signed area and area centroid of a polygon */
export function areaOf(pts: readonly V[]): number { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; }
export function centroidOf(pts: readonly V[]): V {
  let cx = 0, cy = 0;
  const A = areaOf(pts);
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length], k = p[0] * q[1] - q[0] * p[1]; cx += (p[0] + q[0]) * k; cy += (p[1] + q[1]) * k; }
  return [cx / (6 * A), cy / (6 * A)];
}

/** the mirror figure, turned by its tilt, its outline's centre moved to (0, 0): pieces[0] is the outline */
export function mirrorFigure(p: MirrorP): Piece[] {
  const { a, b, c } = p;
  let outline: V[];
  switch (p.fig) {
    case "rect": outline = [[-a, -b], [a, -b], [a, b], [-a, b]]; break;
    case "rhombus": outline = [[0, -b], [a, 0], [0, b], [-a, 0]]; break;
    case "kite": outline = [[0, -c], [a, 0], [0, b], [-a, 0]]; break;
    case "tri": outline = [[-a, 0], [a, 0], [0, b]]; break;
    case "square": outline = regular(4, a, 45); break;
    case "pentagon": outline = regular(5, a, 90); break;
    case "hexagon": outline = regular(6, a, 90); break;
    case "octagon": outline = regular(8, a, 90); break;
    case "star": outline = Array.from({ length: 10 }, (_, k) => polar(k % 2 ? a * 0.45 : a, 90 + 36 * k)); break;
  }
  const pieces: Piece[] = [{ pts: outline, kind: 0 }];
  const n = outline.length, R = Math.min(...outline.map((q) => Math.hypot(q[0], q[1])));
  const pet = (phi: number, kind: number) => pieces.push({ pts: petal(phi, R * 0.55, R * 0.22, R * 0.11), kind });
  switch (p.motif) {
    case "none": break;
    case "dot": { const s = Math.min(a, b) * 0.4; pieces.push({ pts: [[0, -s], [s, 0], [0, s], [-s, 0]], kind: 1 }); break; }
    case "arrow": { const s = Math.min(a, b) * 0.5; pieces.push({ pts: [[-s, -s * 0.7], [s, -s * 0.7], [0, s]], kind: 1 }); break; }
    case "one": pet(Math.atan2(outline[0][1], outline[0][0]) / RAD, 1); break;
    case "two": { const ph = Math.atan2(outline[0][1], outline[0][0]) / RAD; pet(ph, 1); pet(ph + 180, 1); break; }
    case "alt": for (let k = 0; k < n; k++) { const ph = Math.atan2(outline[k][1], outline[k][0]) / RAD; pet(ph, k % 2 ? 2 : 1); } break;
  }
  const ctr = centroidOf(outline);
  return pieces.map((pc) => ({ kind: pc.kind, pts: pc.pts.map((q) => rot(sub(q, ctr), p.tilt)) }));
}
/** the turn figure at rest (centred on the turntable's pin) */
export function turnFigure(p: TurnP): Piece[] {
  if (p.fig === "parallelogram") {
    const { a, b, c } = p;
    return [{ pts: [[-a - c, -b], [a - c, -b], [a + c, b], [-a + c, b]].map((q) => rot(q as V, p.start)), kind: 1 }];
  }
  const R = p.a, r0 = R * 0.22, w = R * (p.n >= 6 ? 0.22 : 0.32);
  const blade: V[] = p.blade === "petal" ? [[r0, 0], [R * 0.6, w], [R, 0], [R * 0.6, -w]]
    : p.blade === "hook" ? [[r0, 0], [R, -w * 0.2], [R * 0.82, w], [r0 * 1.6, w * 0.7]]
      : [[r0, 0], [R, 0], [r0 * 1.25, w * 1.2]];
  return Array.from({ length: p.n }, (_, k) => ({ kind: p.colours[k], pts: blade.map((q) => rot(q, p.start + (360 * k) / p.n)) }));
}
export const figureOf = (p: DarpanParams): Piece[] => (p.goal === "lines" ? mirrorFigure(p) : turnFigure(p));

/** reflect across the line through (0, 0) at angle `deg`; turn clockwise by `deg` (the dial turns the figure clockwise) */
export const reflectPt = (q: V, deg: number): V => { const u = polar(1, deg), d = q[0] * u[0] + q[1] * u[1]; return [2 * d * u[0] - q[0], 2 * d * u[1] - q[1]]; };
export const turnPt = (q: V, deg: number): V => rot(q, -deg);
/** THE match law: does the moved figure lie exactly on the figure (every piece's sides on a piece of the same colour)? */
export function lands(fig: readonly Piece[], move: (q: V) => V): boolean {
  const sides = (pts: readonly V[]) => pts.map((q, i) => [q, pts[(i + 1) % pts.length]] as [V, V]);
  const sameSides = (A: [V, V][], B: [V, V][]) => A.length === B.length && A.every(([p, q]) => B.some(([r, s]) => (near(p, r) && near(q, s)) || (near(p, s) && near(q, r))));
  const used = new Set<number>();
  for (const pc of fig) {
    const moved = sides(pc.pts.map(move));
    const j = fig.findIndex((o, k) => !used.has(k) && o.kind === pc.kind && sameSides(sides(o.pts), moved));
    if (j < 0) return false;
    used.add(j);
  }
  return true;
}

// ───────────────────────────── mirror: the fold lines ─────────────────────────────

const mod180 = (d: number) => ((d % 180) + 180) % 180;
export const lineGap = (a: number, b: number) => { const d = Math.abs(mod180(a) - mod180(b)); return Math.min(d, 180 - d); };
/** the fold lines a finger can lay: through the centre and a corner or the middle of a side (angles in [0, 180), sorted) */
export function candidates(fig: readonly Piece[]): number[] {
  const o = fig[0].pts, pegs = [...o, ...o.map((q, i) => { const r = o[(i + 1) % o.length]; return [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2] as V; })];
  const out: number[] = [];
  for (const q of pegs) {
    if (Math.hypot(q[0], q[1]) < 1e-9) continue;
    const a = mod180(Math.atan2(q[1], q[0]) / RAD);
    if (!out.some((x) => lineGap(x, a) < 1e-6)) out.push(a);
  }
  return out.map((x) => (180 - x < 1e-6 ? 0 : x)).sort((x, y) => x - y);
}
/** the candidate lines that ARE lines of symmetry (indices) */
export const symmetryLines = (fig: readonly Piece[], cands: readonly number[]) => cands.map((a, i) => (lands(fig, (q) => reflectPt(q, a)) ? i : -1)).filter((i) => i >= 0);
const minGap = (cands: readonly number[]) => { let m = 180; for (let i = 0; i < cands.length; i++) for (let j = i + 1; j < cands.length; j++) m = Math.min(m, lineGap(cands[i], cands[j])); return m; };
/** the area of the outline on the left of the line at `deg` through (0, 0) (half-plane clip) */
function leftArea(pts: readonly V[], deg: number): number {
  const u = polar(1, deg), side = (q: V) => u[0] * q[1] - u[1] * q[0];
  const out: V[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], sp = side(p), sq = side(q);
    if (sp >= 0) out.push(p);
    if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out.length >= 3 ? Math.abs(areaOf(out)) : 0;
}
export const halves = (fig: readonly Piece[], deg: number) => { const A = Math.abs(areaOf(fig[0].pts)); return Math.abs(2 * leftArea(fig[0].pts, deg) - A) < 1e-6 * Math.max(1, A); };
/** a mirror level's derived geometry */
export function mirrorWorld(p: MirrorP) {
  const fig = mirrorFigure(p), cands = candidates(fig), sym = symmetryLines(fig, cands);
  return { fig, cands, sym };
}
const findLine = (cands: readonly number[], deg: number) => { let best = -1, bd = 2; cands.forEach((a, i) => { const g = lineGap(a, deg); if (g <= bd) { bd = g; best = i; } }); return best; };

// ───────────────────────────── turn: the order ─────────────────────────────

/** the order of turn symmetry: how many times the figure lands on itself in one full turn (1..24) */
export function orderOf(fig: readonly Piece[]): number {
  for (let m = 24; m >= 2; m--) if (lands(fig, (q) => turnPt(q, 360 / m))) return m;
  return 1;
}
/** has the figure any mirror line? (a reflection takes the first corner to some corner at the same distance: the line is
 *  the bisector of the two directions, so testing those lines is exhaustive) */
export function hasMirror(fig: readonly Piece[]): boolean {
  const v0 = fig[0].pts[0], r0 = Math.hypot(v0[0], v0[1]), t0 = Math.atan2(v0[1], v0[0]) / RAD;
  for (const pc of fig) for (const w of pc.pts) {
    if (pc.kind !== fig[0].kind || Math.abs(Math.hypot(w[0], w[1]) - r0) > EPS) continue;
    const a = (t0 + Math.atan2(w[1], w[0]) / RAD) / 2;
    if (lands(fig, (q) => reflectPt(q, a))) return true;
  }
  return false;
}
export const unitOf = (p: TurnP) => (p.fine ? 1 : 15);
/** the smallest turn and every stop in one full turn where the figure lands on itself */
export const smallestOf = (p: TurnP) => 360 / orderOf(turnFigure(p));
export const stopsOf = (p: TurnP): number[] => { const n = orderOf(turnFigure(p)); return Array.from({ length: n }, (_, k) => (360 * (k + 1)) / n); };

// ───────────────────────────── the judgement ─────────────────────────────

const sameList = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
/** THE judgement of a go: does this set-up meet the goal? */
export function judge(p: DarpanParams, su: Setup): boolean {
  if (p.goal === "lines") return su.lines.length > 0 && sameList([...su.lines].sort((x, y) => x - y), mirrorWorld(p).sym);
  if (p.goal === "smallest") return su.angle === smallestOf(p);
  return sameList([...su.marks].sort((x, y) => x - y), stopsOf(p));
}
const emptySetup = (): Setup => ({ lines: [], angle: 0, marks: [] });
/** the part of a set-up the goal judges (an order go is its marks, wherever the dial was left) */
const keyOf = (g: DarpanGoal, su: Setup) => JSON.stringify(g === "lines" ? [...su.lines].sort((x, y) => x - y) : g === "smallest" ? su.angle : [...su.marks].sort((x, y) => x - y));
const sameSetup = (g: DarpanGoal, a: Setup, b: Setup) => keyOf(g, a) === keyOf(g, b);
function legal(p: DarpanParams, su: Setup): boolean {
  if (p.goal === "lines") { const n = mirrorWorld(p).cands.length; return su.lines.length >= 1 && new Set(su.lines).size === su.lines.length && su.lines.every((i) => Number.isInteger(i) && i >= 0 && i < n); }
  const u = unitOf(p);
  if (p.goal === "smallest") return Number.isInteger(su.angle) && su.angle > 0 && su.angle <= 360 && su.angle % u === 0;
  return su.marks.length >= 1 && su.marks.length <= MAX_MARKS && new Set(su.marks).size === su.marks.length && su.marks.every((m) => Number.isInteger(m) && m >= 0 && m <= 360 && m % u === 0);
}
/** the set-up the solver commits */
export function solution(p: DarpanParams): Setup | null {
  const su = emptySetup();
  if (p.goal === "lines") su.lines = mirrorWorld(p).sym;
  else if (p.goal === "smallest") su.angle = smallestOf(p);
  else su.marks = stopsOf(p);
  return legal(p, su) && judge(p, su) ? su : null;
}
function rawMal(p: DarpanParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  const su = emptySetup();
  if (p.goal === "lines") {
    const { fig, cands, sym } = mirrorWorld(p);
    const lines = (ls: number[]): Setup => ({ ...su, lines: [...new Set(ls)].sort((x, y) => x - y) });
    if (mal === "exactly-one") {
      if (sym.length < 2) return null;
      const best = [...sym].sort((i, j) => lineGap(cands[i], 90) - lineGap(cands[j], 90) || cands[i] - cands[j])[0];
      return lines([best]);
    }
    if (mal === "vertical-only") { const v = sym.find((i) => lineGap(cands[i], 90) < 1e-6); return v !== undefined && sym.length >= 2 ? lines([v]) : null; }
    if (mal === "diagonals") {
      if (!["rect", "rhombus", "square"].includes(p.fig)) return null;
      const corners = fig[0].pts.map((q) => findLine(cands, Math.atan2(q[1], q[0]) / RAD)).filter((i) => i >= 0);
      return lines([...sym, ...corners]);
    }
    if (mal === "equal-halves") return lines(cands.map((a, i) => (halves(fig, a) ? i : -1)).filter((i) => i >= 0));
    return null;
  }
  const fig = turnFigure(p), n = orderOf(fig), chiral = !hasMirror(fig);
  if (p.goal === "smallest") {
    if (mal === "quarter-default") return { ...su, angle: 90 };
    if (mal === "full-turn") return { ...su, angle: 360 };
    if (mal === "mirror-only") return chiral ? { ...su, angle: 360 } : null;
    if (mal === "angle-order") return p.fine ? { ...su, angle: n } : null;
    return null;
  }
  if (mal === "quarter-default") return { ...su, marks: [90, 180, 270, 360] };
  if (mal === "full-turn") return { ...su, marks: [0, ...stopsOf(p)] };
  if (mal === "mirror-only") return chiral ? { ...su, marks: [360] } : null;
  return null;
}
/**
 * The set-up a child holding mal-rule `mal` commits, or null when the belief changes nothing here, when its set-up is not a
 * legal one on this level, when it would win, or when another mal-rule among `among` (the level's mapped ones) commits the
 * very same set-up (a signature must name ONE belief).
 */
export function malSetup(p: DarpanParams, mal: string, among: readonly string[] = MAL_OF[p.goal]): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  for (const other of among) {
    if (other === mal || !MAL_OF[p.goal].includes(other)) continue;
    const o = rawMal(p, other);
    if (o && sameSetup(p.goal, o, m)) return null;
  }
  return m;
}
/** values the teacher may not say before the child produces them: the count of lines, the smallest turn, the order */
export function darpanHidden(level: PlayLevel<unknown>): (string | number)[] {
  const p = level.params as DarpanParams | null;
  if (!p || typeof p.goal !== "string") return [];
  try {
    if (p.goal === "lines") return [mirrorWorld(p).sym.length];
    const n = orderOf(turnFigure(p));
    return p.goal === "smallest" ? [360 / n, `1/${n}`] : [n];
  } catch { return []; }
}

// ───────────────────────────── validate ─────────────────────────────

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const inR = (x: unknown, lo: number, hi: number): x is number => isInt(x) && x >= lo && x <= hi;
const MOTIFS_OF: Record<MirrorFig, readonly Motif[]> = {
  rect: ["none", "dot", "arrow"], rhombus: ["none", "arrow"], kite: ["none"], tri: ["none"],
  square: ["one", "two"], pentagon: ["one"], hexagon: ["one", "two", "alt"], octagon: ["one", "two", "alt"], star: ["none"],
};
function validParams(mode: DarpanMode, raw: Record<string, unknown>): DarpanParams | null {
  const goal = raw.goal as DarpanGoal;
  if (!GOALS_OF[mode]?.includes(goal)) return null;
  const labels: Labels = raw.labels === 2 || raw.labels === 3 ? raw.labels : 1;
  if (goal === "lines") {
    const fig = raw.fig as MirrorFig, motif = raw.motif as Motif, { a, b, c, tilt } = raw;
    if (!MIRROR_FIGS.includes(fig) || !MOTIFS_OF[fig]?.includes(motif) || !inR(a, 2, 6) || !inR(b, 0, 7) || !inR(c, 0, 7) || !inR(tilt, 0, 165) || tilt % 15) return null;
    if (fig === "rect" && (b < 1 || a === b)) return null;
    if (fig === "rhombus" && (b < 2 || a === b)) return null;
    if (fig === "kite" && (b < 1 || c <= b)) return null;
    if (fig === "tri" && b < 2) return null;
    if (!["rect", "rhombus", "kite", "tri"].includes(fig) && (b !== 0 || c !== 0 || a < 3)) return null;
    if (["rect", "rhombus", "tri"].includes(fig) && c !== 0) return null;
    const p: MirrorP = { goal, labels, fig, a, b, c, motif, tilt };
    const { cands, sym } = mirrorWorld(p);
    if (cands.length < 2 || minGap(cands) < MIN_GAP || !sym.length) return null;
    return p;
  }
  const fig = raw.fig as TurnP["fig"], blade = raw.blade as Blade, { n, a, b, c, start } = raw, fine = raw.fine === true, colours = raw.colours;
  if (!TURN_FIGS.includes(fig) || !BLADES.includes(blade) || !inR(start, 0, 345) || start % 15 || !Array.isArray(colours)) return null;
  if (fig === "pinwheel") {
    if (!inR(n, 2, 8) || n === 7 || colours.length !== n || !colours.every((k) => inR(k, 1, 3)) || !inR(a, 3, 6) || b !== 0 || c !== 0) return null;
  } else if (n !== 2 || colours.length !== 0 || blade !== "petal" || !inR(a, 2, 4) || !inR(b, 1, 3) || !inR(c, 1, 2)) return null;
  const p: TurnP = { goal, labels, fig, n, blade, colours: [...(colours as number[])], a, b, c, start, fine };
  const ord = orderOf(turnFigure(p));
  if (ord < 2 || (360 / ord) % unitOf(p)) return null;
  return p;
}
function validate(level: PlayLevel<unknown>): PlayLevel<DarpanParams> | null {
  const raw = level.params as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return null;
  try {
    const params = validParams(level.mode as DarpanMode, raw);
    if (!params || (params.goal !== level.goal && level.goal !== undefined)) return null;
    return { ...level, params } as PlayLevel<DarpanParams>;
  } catch { return null; }
}
function init(_level: PlayLevel<DarpanParams>): DarpanState {
  return { ...emptySetup(), ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}

// ───────────────────────────── the law ─────────────────────────────

function apply(level: PlayLevel<DarpanParams>, s: DarpanState, act: DarpanAct, seq: number): { state: DarpanState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: DarpanState): DarpanState => ({ ...st, acts: s.acts + 1 });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const no = (why: string) => ({ state: bump(s), moments: out, refused: why });
  const change = (patch: Partial<Setup>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  switch (act.kind) {
    case "line": {
      if (p.goal !== "lines") return no("no_line");
      const d = Number(act.deg);
      if (!Number.isFinite(d)) return no("no_fold");
      const i = findLine(mirrorWorld(p).cands, d);
      if (i < 0) return no("no_fold");
      return change({ lines: s.lines.includes(i) ? s.lines.filter((x) => x !== i) : [...s.lines, i].sort((x, y) => x - y) });
    }
    case "turn": {
      if (p.goal === "lines") return no("no_turn");
      const by = Number(act.by), u = unitOf(p);
      if (!isInt(by) || by === 0 || by % u) return no("no_such_turn");
      const to = s.angle + by;
      if (to < 0 || to > 360) return no("off_dial");
      return change({ angle: to });
    }
    case "mark": {
      if (p.goal !== "order") return no("no_mark");
      if (s.marks.includes(s.angle)) return change({ marks: s.marks.filter((m) => m !== s.angle) });
      if (s.marks.length >= MAX_MARKS) return no("full");
      return change({ marks: [...s.marks, s.angle].sort((x, y) => x - y) });
    }
    case "run": {
      if (s.ended) return no("change_first");
      const su: Setup = { lines: s.lines, angle: s.angle, marks: s.marks };
      const empty = p.goal === "lines" ? !s.lines.length : p.goal === "smallest" ? s.angle <= 0 : !s.marks.length;
      if (empty) return no(p.goal === "lines" ? "lines_first" : p.goal === "smallest" ? "turn_first" : "marks_first");
      const runs = s.runs + 1, ok = judge(p, su);
      const end: DarpanState = bump({ ...s, ended: true, runs, done: ok });
      const base: Facts = { goal: p.goal, go: runs };
      if (ok) { out.push(mom("solved", seq, base)); return { state: end, moments: out }; }
      const among = Object.keys(level.mal);
      for (const mal of among) {
        const m = malSetup(p, mal, among);
        if (m && sameSetup(p.goal, m, su)) { out.push(mom("misconception_consequence", seq, base, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      out.push(mom(nearMiss(p, su) ? "near_miss" : "law_refused", seq, { ...base, why: "missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
/** every line laid folds true but one is missing; a turn one step off; the marks one short or one over */
function nearMiss(p: DarpanParams, su: Setup): boolean {
  if (p.goal === "lines") { const { sym } = mirrorWorld(p); return su.lines.every((i) => sym.includes(i)) && su.lines.length === sym.length - 1; }
  if (p.goal === "smallest") return Math.abs(su.angle - smallestOf(p)) === unitOf(p);
  const want = stopsOf(p);
  return Math.abs(su.marks.length - want.length) === 1 && (su.marks.every((m) => want.includes(m)) || want.every((m) => su.marks.includes(m)));
}
const goalMet = (_l: PlayLevel<DarpanParams>, s: DarpanState) => s.done;

/** what a fold / a spin shows: per line laid (or per mark) whether the figure lands on itself */
export function foldsOf(p: DarpanParams, su: Setup): boolean[] {
  if (p.goal === "lines") { const { fig, cands } = mirrorWorld(p); return su.lines.map((i) => lands(fig, (q) => reflectPt(q, cands[i]))); }
  const fig = turnFigure(p);
  if (p.goal === "smallest") return [lands(fig, (q) => turnPt(q, su.angle))];
  return su.marks.map((m) => m > 0 && lands(fig, (q) => turnPt(q, m)));
}

/** the acts that commit a set-up, then go */
export function setupActs(p: DarpanParams, su: Setup): DarpanAct[] {
  const go: DarpanAct = { kind: "run" };
  if (p.goal === "lines") { const { cands } = mirrorWorld(p); return [...su.lines.map((i): DarpanAct => ({ kind: "line", deg: Math.round(cands[i] * 10) / 10 })), go]; }
  if (p.goal === "smallest") return [{ kind: "turn", by: su.angle }, go];
  const out: DarpanAct[] = [];
  let at = 0;
  for (const m of su.marks) { if (m !== at) out.push({ kind: "turn", by: m - at }); at = m; out.push({ kind: "mark" }); }
  return [...out, go];
}
function solve(level: PlayLevel<DarpanParams>): DarpanAct[] | null {
  const su = solution(level.params);
  return su ? setupActs(level.params, su) : null;
}
/**
 * Set-ups that win without the idea: the upright line, the level line, both (the "plus" guess), every line a fold can run;
 * one press of the dial, a quarter turn, the full turn; a mark at every quarter, at the full turn only, at every step. A
 * level any of them wins is never served.
 */
function shortcutSetups(p: DarpanParams): Setup[] {
  const su = emptySetup(), tries: Setup[] = [];
  if (p.goal === "lines") {
    const { cands } = mirrorWorld(p), v = cands.findIndex((a) => lineGap(a, 90) < 1e-6), h = cands.findIndex((a) => lineGap(a, 0) < 1e-6);
    for (const ls of [[v], [h], [v, h], cands.map((_, i) => i)]) if (ls.every((i) => i >= 0)) tries.push({ ...su, lines: [...ls].sort((x, y) => x - y) });
  } else if (p.goal === "smallest") for (const a of [unitOf(p), 15, 90, 360]) tries.push({ ...su, angle: a });
  else {
    tries.push({ ...su, marks: [90, 180, 270, 360] }, { ...su, marks: [360] });
    if (!p.fine) tries.push({ ...su, marks: Array.from({ length: 24 }, (_, k) => 15 * (k + 1)) });
  }
  return tries;
}
function shortcut(level: PlayLevel<DarpanParams>): DarpanAct[] | null {
  const p = level.params;
  for (const t of shortcutSetups(p)) if (legal(p, t) && judge(p, t)) return setupActs(p, t);
  return null;
}
function malActs(level: PlayLevel<DarpanParams>, mal: string): DarpanAct[] | null {
  if (!Object.keys(level.mal ?? {}).includes(mal)) return null;
  const m = malSetup(level.params, mal, Object.keys(level.mal ?? {}));
  return m ? setupActs(level.params, m) : null;
}

// ───────────────────────────── the generator ─────────────────────────────

interface DarpanGrammar {
  /** lines: the figures on offer; `upright` the share of untilted figures (where the upright line can be a true one) */
  figs?: string[]; upright?: number;
  /** turn: the blade counts on offer, the share of pinwheels with no mirror line (hooks, sails, parallelograms), a 1° dial */
  ns?: number[]; chiral?: number; fine?: boolean;
}
function difficultyOf(p: DarpanParams): number {
  const lab = 0.06 * (p.labels - 1);
  if (p.goal === "lines") { const { cands, sym } = mirrorWorld(p); return Math.min(1, 0.25 + lab + 0.02 * cands.length + 0.06 * sym.length + (p.tilt ? 0.08 : 0)); }
  const fig = turnFigure(p), n = orderOf(fig);
  return Math.min(1, 0.3 + lab + 0.04 * n + (p.fig === "pinwheel" && n !== p.n ? 0.12 : 0) + (hasMirror(fig) ? 0 : 0.08) + (p.goal === "order" ? 0.05 : 0));
}
function generate(req: GenRequest): Candidate<DarpanParams>[] {
  const g = req.grammar as DarpanGrammar;
  const mode = (["mirror", "turn"] as const).find((m) => m === req.mode) ?? "mirror";
  const goal = (GOALS_OF[mode].includes(req.goal as DarpanGoal) ? req.goal : GOALS_OF[mode][0]) as DarpanGoal;
  const rnd = mulberry32(req.seed), out: Candidate<DarpanParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const labels = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as Labels;
  const mk = (params: DarpanParams, sig: string): Candidate<DarpanParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `darpan-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_").slice(0, 120), family: "darpan", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "darpan", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const figs = (g.figs ?? MIRROR_FIGS).filter((f): f is MirrorFig => MIRROR_FIGS.includes(f as MirrorFig));
  for (let k = 0; k < 80 && out.length < 20; k++) {
    let raw: Record<string, unknown>, sig: string;
    if (goal === "lines") {
      const fig = pickOf(figs.length ? figs : MIRROR_FIGS), motif = pickOf(MOTIFS_OF[fig]);
      let a = 0, b = 0, c = 0;
      if (fig === "rect") { a = int(2, 5); b = int(1, 4); if (a === b) continue; if (rnd() < 0.5) [a, b] = [b, a]; if (a < 2) continue; }
      else if (fig === "rhombus") { a = int(2, 5); b = int(2, 6); if (a === b) continue; }
      else if (fig === "kite") { a = int(2, 4); b = int(1, 3); c = int(b + 2, 6); }
      else if (fig === "tri") { a = int(2, 4); b = int(2, 6); }
      else a = int(4, 6);
      const tilt = rnd() < (g.upright ?? 0.3) ? 0 : 15 * int(1, 11);
      raw = { goal, labels, fig, a, b, c, motif, tilt }; sig = `lines:${fig}:${a},${b},${c}:${motif}:${tilt}`;
    } else {
      const chiral = rnd() < (g.chiral ?? 0.4), fine = g.fine === true;
      const start = pickOf([0, 15, 30, 45, 90]);
      if (chiral && rnd() < 0.3) {
        raw = { goal, labels, fig: "parallelogram", n: 2, blade: "petal", colours: [], a: int(2, 4), b: int(1, 3), c: int(1, 2), start, fine };
      } else {
        const ns = (g.ns ?? [2, 3, 4, 6, 8]).filter((x) => [2, 3, 4, 5, 6, 8].includes(x)), n = pickOf(ns.length ? ns : [3, 6]);
        // a colour pattern repeating every p blades: 6 blades in 2 colours land every third of a turn, 4 in 2 every half
        const ps = [1, 2, 3].filter((q) => n % q === 0 && n / q >= 2), per = pickOf(ps), pal = [1, 2, 3].sort(() => rnd() - 0.5).slice(0, per);
        raw = { goal, labels, fig: "pinwheel", n, blade: chiral ? pickOf(["hook", "flag"] as const) : "petal", colours: Array.from({ length: n }, (_, i) => pal[i % per]), a: int(4, 6), b: 0, c: 0, start, fine };
      }
      sig = `${goal}:${raw.fig}:${raw.n}:${raw.blade}:${(raw.colours as number[]).join("")}:${raw.a},${raw.b},${raw.c}:${start}:${fine ? 1 : 15}`;
    }
    if (seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(raw as unknown as DarpanParams, sig);
    const v = validate(cand.level);
    if (!v || !solution(v.params) || shortcut(v)) continue;
    out.push({ ...mk(v.params, sig), level: v });
  }
  return out;
}

// ───────────────────────────── facts and the board twin ─────────────────────────────

const NAMES: Record<string, string> = { rect: "rectangle", rhombus: "rhombus", kite: "kite", tri: "triangle", square: "square tile", pentagon: "five-sided rangoli", hexagon: "six-sided rangoli", octagon: "eight-sided rangoli", star: "star", pinwheel: "pinwheel", parallelogram: "tile" };
function facts(level: PlayLevel<DarpanParams>, s: DarpanState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, figure: NAMES[p.fig] ?? p.fig };
  if (p.goal === "lines") f.lines = s.lines.length;
  else { f.turn = s.angle; if (p.goal === "order") f.marks = s.marks.length; }
  if (s.runs) f.goes = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<DarpanParams>, s: DarpanState) {
  const p = level.params, lines: string[] = [];
  if (p.goal === "lines") {
    const { cands } = mirrorWorld(p);
    lines.push(`figure: ${NAMES[p.fig]}`, `mirror lines laid: ${s.lines.length ? s.lines.map((i) => `${Math.round(cands[i])}°`).join(", ") : "–"}`);
  } else {
    lines.push(`figure: ${NAMES[p.fig]}${p.fig === "pinwheel" ? ` with ${p.n} blades` : ""}`, `turn: ${s.angle}°`);
    if (p.goal === "order") lines.push(`marks: ${s.marks.length ? s.marks.map((m) => `${m}°`).join(", ") : "–"}`);
  }
  return { title: "Darpan", lines };
}
function grade(level: PlayLevel<DarpanParams>, acts: PlayActEnvelope<DarpanAct>[]): PlayGrade {
  return gradeLevel(darpanLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const darpanLogic: FamilyLogic<DarpanParams, DarpanState, DarpanAct> = {
  family: "darpan", modes: ["mirror", "turn"], malRules: DARPAN_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
