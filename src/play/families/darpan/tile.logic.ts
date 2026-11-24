// Darpan · tile (r7 tilings2: c7-maths-ch14-t02). A third world of the mirror family: copies of a tile laid round ONE
// point on a floor, the way a tiler fits paper tiles round a corner. Nothing moves on a clock: the child lays tiles from the
// tray, one after another round the point (each copy's corner at the point, its edge on the last copy's edge), then presses
// go; the law (plain angle arithmetic) adds the corners at the point and shows what is left: a gap, an overlap, or a closed
// corner (and, for one kind of tile, the floor it repeats into).
//   close   some tiles are already laid round the point; fill the rest with the tray's regular tiles (mixing allowed) so
//           the corner closes exactly (angles at a point make 360°; a mixed corner such as 3.4.6.4 is a real one)
//   alone   a tray of regular tiles, ONE of which floors on its own (60°, 90° or 120° divides 360°): close the corner with
//           copies of one kind only
//   any     a scalene triangle or an uneven four-sided tile and one regular tile that does not floor: close the corner with
//           copies of one kind only, choosing which corner of each copy goes to the point (each triangle corner twice; each
//           of the four corners once)
// Mal-rules (each a deterministic set-up; a level names one only where its set-up differs from every other one it maps):
//   gap-ok        close: the fill from the tray that leaves the smallest gap or overlap that a child can see (5° to 30°)
//   any-regular   alone: the first tray tile that does not floor, as many copies as come nearest to a full turn
//   only-regular  any: the regular tile (the uneven one "cannot tile"), as many copies as come nearest to a full turn
import type { Candidate, DarpanAct, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";
import type { V } from "./darpan.logic.ts";

export type TileGoal = "close" | "alone" | "any";
export type Labels = 1 | 2 | 3;
/** a tray tile: a regular polygon of n sides, or an uneven one by its corner angles (whole degrees, counter-clockwise; any whole number, so that no other mix of them makes a full turn) and,
 *  for four corners, the lengths of its first two sides */
export type Tile = { n: number } | { ang: number[]; s?: number[] };
export interface TileP { goal: TileGoal; labels: Labels; tray: Tile[]; laid: number[]; tilt: number }
/** one copy laid round the point: tray tile t with its corner c at the point */
export interface Put { t: number; c: number }
export interface TileState extends Undoable<TileState> { put: Put[]; ended: boolean; runs: number; done: boolean; acts: number }

export const TILE_MAL = ["gap-ok", "any-regular", "only-regular"] as const;
const MAL_OF: Record<TileGoal, readonly string[]> = { close: ["gap-ok"], alone: ["any-regular"], any: ["only-regular"] };
export const TILE_GOALS: readonly TileGoal[] = ["close", "alone", "any"];
/** the regular tiles on offer (whole-degree corners) and the ones that floor on their own */
export const REG = [3, 4, 5, 6, 8, 9, 10, 12] as const;
export const FLOORS = [3, 4, 6] as const;
const NOT_FLOOR = [5, 8, 9, 10, 12] as const;
/** a gap or an overlap this small is what a "nearly fine" corner leaves */
export const SMALL = 30;
const MAX_PUT = 12;

// ───────────────────────────── angles and shapes ─────────────────────────────

export const regAngle = (n: number) => 180 - 360 / n;
export const isReg = (t: Tile): t is { n: number } => "n" in t;
export const cornersOf = (t: Tile) => (isReg(t) ? 1 : t.ang.length);
export const angleOf = (t: Tile, c: number) => (isReg(t) ? regAngle(t.n) : t.ang[c]);
const laidSum = (p: TileP) => p.laid.reduce((s, n) => s + regAngle(n), 0);
export const sumOf = (p: TileP, put: readonly Put[]) => laidSum(p) + put.reduce((s, q) => s + angleOf(p.tray[q.t], q.c), 0);
/** 360 − the angles at the point: > 0 a gap, < 0 an overlap */
export const missOf = (p: TileP, put: readonly Put[]) => 360 - sumOf(p, put);

const RAD = Math.PI / 180;
const dir = (deg: number): V => [Math.cos(deg * RAD), Math.sin(deg * RAD)];
/** the tile's corner points, counter-clockwise (regular: side 1; uneven: longest side UNEVEN, a tile big enough to read) */
export const UNEVEN = 2.4;
export function shapeOf(t: Tile): V[] {
  if (isReg(t)) { const out: V[] = [[0, 0]]; let h = 0; for (let k = 1; k < t.n; k++) { const q = out[k - 1], d = dir(h); out.push([q[0] + d[0], q[1] + d[1]]); h += 360 / t.n; } return out; }
  const a = t.ang;
  if (a.length === 3) {
    // law of sines: the side opposite each corner ∝ sin(its angle); corner 0 at the origin, corner 1 along the x axis
    const c = Math.sin(a[2] * RAD), b = Math.sin(a[1] * RAD), k = UNEVEN / Math.max(Math.sin(a[0] * RAD), b, c);
    return [[0, 0], [c * k, 0], [b * k * Math.cos(a[0] * RAD), b * k * Math.sin(a[0] * RAD)]];
  }
  const [A, B, C] = a, s = t.s ?? [4, 4];
  const P1: V = [s[0], 0], d1 = dir(180 - B), P2: V = [P1[0] + s[1] * d1[0], P1[1] + s[1] * d1[1]];
  // P3 on the ray from P0 at angle A and on the ray from P2 heading 360 − B − C
  const u = dir(A), w = dir(360 - B - C), det = u[0] * -w[1] - u[1] * -w[0];
  if (Math.abs(det) < 1e-9) return [[0, 0], P1, P2, P2];
  const tt = (P2[0] * -w[1] - P2[1] * -w[0]) / det;
  const P3: V = [u[0] * tt, u[1] * tt], pts: V[] = [[0, 0], P1, P2, P3];
  const L = Math.max(...pts.map((q, i) => Math.hypot(pts[(i + 1) % 4][0] - q[0], pts[(i + 1) % 4][1] - q[1])));
  return pts.map((q) => [(q[0] * UNEVEN) / L, (q[1] * UNEVEN) / L] as V);
}
const signedArea = (pts: readonly V[]) => { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
const interior = (pts: readonly V[], i: number) => {
  const n = pts.length, p = pts[i], a = pts[(i + 1) % n], b = pts[(i + n - 1) % n];
  const t1 = Math.atan2(a[1] - p[1], a[0] - p[0]), t2 = Math.atan2(b[1] - p[1], b[0] - p[0]);
  return ((((t2 - t1) / RAD) % 360) + 360) % 360;
};
/** a copy of the tile with corner c at (0, 0), its edge to the next corner heading `from` degrees (its other edge then
 *  heads from + the corner's angle) */
export function placed(t: Tile, c: number, from: number): V[] {
  const pts = shapeOf(t), o = pts[c], n = pts.length, nx = pts[(c + 1) % n];
  const r = from * RAD - Math.atan2(nx[1] - o[1], nx[0] - o[0]), cs = Math.cos(r), sn = Math.sin(r);
  return Array.from({ length: n }, (_, k) => pts[(c + k) % n]).map((q) => { const x = q[0] - o[0], y = q[1] - o[1]; return [x * cs - y * sn, x * sn + y * cs] as V; });
}
/** every tile round the point in the order laid (the laid ones first), with the heading each starts at */
export function rosette(p: TileP, put: readonly Put[]): { pts: V[]; from: number; ang: number; laid: boolean; t: number; c: number }[] {
  const out: { pts: V[]; from: number; ang: number; laid: boolean; t: number; c: number }[] = [];
  let h = p.tilt;
  for (const n of p.laid) { const t = { n }; out.push({ pts: placed(t, 0, h), from: h, ang: regAngle(n), laid: true, t: -1, c: 0 }); h += regAngle(n); }
  for (const q of put) { const t = p.tray[q.t], a = angleOf(t, q.c); out.push({ pts: placed(t, q.c, h), from: h, ang: a, laid: false, t: q.t, c: q.c }); h += a; }
  return out;
}
/** the floor one kind of tile repeats into: copies turned half round on each side's middle, out to radius R */
export function floorOf(first: readonly V[], R: number, max = 420): V[][] {
  const key = (pts: readonly V[]) => { const c = pts.reduce((s, q) => [s[0] + q[0], s[1] + q[1]], [0, 0]); return `${Math.round((c[0] / pts.length) * 1e4)},${Math.round((c[1] / pts.length) * 1e4)}`; };
  const out: V[][] = [first.map((q) => [q[0], q[1]] as V)], seen = new Set([key(first)]);
  for (let i = 0; i < out.length && out.length < max; i++) {
    const t = out[i];
    for (let e = 0; e < t.length; e++) {
      const a = t[e], b = t[(e + 1) % t.length], m: V = [a[0] + b[0], a[1] + b[1]];
      const nb = t.map((q) => [m[0] - q[0], m[1] - q[1]] as V), k = key(nb);
      if (seen.has(k)) continue;
      seen.add(k);
      if (nb.every((q) => Math.hypot(q[0], q[1]) > R)) continue;
      out.push(nb);
    }
  }
  return out;
}
/** the farthest a tile reaches from the corner at the point (the view's scale) */
export function reachOf(p: TileP): number {
  const tiles: Tile[] = [...p.tray, ...p.laid.map((n) => ({ n }))];
  return Math.max(...tiles.flatMap((t) => { const pts = shapeOf(t); return pts.map((o) => Math.max(...pts.map((q) => Math.hypot(q[0] - o[0], q[1] - o[1])))); }));
}

// ───────────────────────────── the judgement ─────────────────────────────

const oneKind = (put: readonly Put[]) => put.every((q) => q.t === put[0]?.t);
/** THE judgement of a go: the angles at the point make exactly a full turn (one kind of tile where the goal says so) */
export function judge(p: TileP, put: readonly Put[]): boolean {
  if (!put.length) return false;
  if (p.goal !== "close" && !oneKind(put)) return false;
  return missOf(p, put) === 0;
}
const keyOf = (put: readonly Put[]) => put.map((q) => `${q.t}.${q.c}`).sort().join(" ");
const samePut = (a: readonly Put[], b: readonly Put[]) => keyOf(a) === keyOf(b);
/** can these copies be laid one after another (a copy is refused once the corner is already round)? lays the biggest last */
function legal(p: TileP, put: readonly Put[]): boolean {
  if (!put.length || put.length > MAX_PUT) return false;
  if (!put.every((q) => Number.isInteger(q.t) && q.t >= 0 && q.t < p.tray.length && Number.isInteger(q.c) && q.c >= 0 && q.c < cornersOf(p.tray[q.t]))) return false;
  if (p.goal !== "close" && !oneKind(put)) return false;
  const big = Math.max(...put.map((q) => angleOf(p.tray[q.t], q.c)));
  return sumOf(p, put) - big < 360;
}
/** the order a set-up is laid in: as given; an overlapping one with its biggest copy last (so it is still legal to lay) */
const layOrder = (p: TileP, put: readonly Put[]) => {
  if (sumOf(p, put) <= 360) return [...put];
  const out = [...put]; let bi = 0;
  out.forEach((q, i) => { if (angleOf(p.tray[q.t], q.c) > angleOf(p.tray[out[bi].t], out[bi].c)) bi = i; });
  const [b] = out.splice(bi, 1); return [...out, b];
};
/** do the copies of an uneven tile meet edge to edge round the point (each copy's corner the one before the last copy's,
 *  all the way round)? Then they are the floor's own copies, and the floor they repeat into can be drawn */
export function edgeToEdge(p: TileP, put: readonly Put[]): boolean {
  if (!put.length || !oneKind(put)) return false;
  const t = p.tray[put[0].t], k = cornersOf(t);
  if (k === 1) return true;
  return missOf(p, put) === 0 && put.every((q, i) => put[(i + 1) % put.length].c === (q.c + k - 1) % k);
}
/** a closing of one uneven tile laid edge to edge: corner 0, then k−1, k−2, … round the point */
const edgeOrder = (p: TileP, m: Put[]): Put[] => {
  const t = p.tray[m[0].t], k = cornersOf(t);
  if (k === 1 || !oneKind(m)) return m;
  return Array.from({ length: m.length }, (_, i) => ({ t: m[0].t, c: (k - (i % k)) % k }));
};

/** every multiset of the given (t, c) pieces of size 1..max, smallest first */
function multisets(pieces: readonly Put[], max: number): Put[][] {
  const out: Put[][] = [];
  const rec = (from: number, cur: Put[]) => { if (cur.length) out.push([...cur]); if (cur.length === max) return; for (let i = from; i < pieces.length; i++) { cur.push(pieces[i]); rec(i, cur); cur.pop(); } };
  rec(0, []);
  return out;
}
const piecesOf = (p: TileP): Put[] => p.tray.flatMap((t, i) => Array.from({ length: cornersOf(t) }, (_, c) => ({ t: i, c })));
/** the set-ups that close the corner (close: tray tiles of any mix, up to 6; alone / any: one kind, up to 12) */
export function closings(p: TileP): Put[][] {
  if (p.goal === "close") return multisets(piecesOf(p), 6).filter((m) => missOf(p, m) === 0);
  // one kind: the corner counts whose angles make exactly the turn left (pruned on the angle left, so it stays fast)
  const out: Put[][] = [], left0 = 360 - laidSum(p);
  p.tray.forEach((t, i) => {
    const k = cornersOf(t), cnt = new Array(k).fill(0);
    const rec = (c: number, left: number, used: number) => {
      if (c === k) { if (left === 0 && used > 0) out.push(cnt.flatMap((m, j) => Array.from({ length: m }, () => ({ t: i, c: j })))); return; }
      const a = angleOf(t, c);
      for (let m = 0; m * a <= left && used + m <= (isReg(t) ? 6 : MAX_PUT); m++) { cnt[c] = m; rec(c + 1, left - m * a, used + m); }
      cnt[c] = 0;
    };
    rec(0, left0, 0);
  });
  return out;
}
const rank = (m: Put[]) => [m.length, keyOf(m)] as const;
const better = (a: Put[], b: Put[]) => { const x = rank(a), y = rank(b); return x[0] - y[0] || (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0); };
/** the set-up the solver commits: the fewest copies, then the first by key */
export function solution(p: TileP): Put[] | null {
  const all = closings(p).sort(better);
  if (!all[0]) return null;
  const best = p.goal === "close" ? all[0] : edgeOrder(p, all[0]);
  return samePut(best, all[0]) && legal(p, best) && judge(p, best) ? best : null;
}
/** the near closing a "nearly fine" child stops at: the smallest gap or overlap one can see (gap before overlap) */
function nearest(p: TileP, pieces: readonly Put[], max: number): Put[] | null {
  let best: Put[] | null = null, bm = Infinity;
  for (const m of multisets(pieces, max)) {
    const miss = missOf(p, m);
    if (Math.abs(miss) < 5 || Math.abs(miss) > SMALL || !legal(p, m)) continue;
    const score = Math.abs(miss) * 2 + (miss < 0 ? 1 : 0);
    if (score < bm || (score === bm && best && better(m, best) < 0)) { best = m; bm = score; }
  }
  return best;
}
const nearCount = (p: TileP, t: number): Put[] => { const a = angleOf(p.tray[t], 0); return Array.from({ length: Math.max(2, Math.round((360 - laidSum(p)) / a)) }, () => ({ t, c: 0 })); };
function rawMal(p: TileP, mal: string): Put[] | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  if (mal === "gap-ok") return nearest(p, piecesOf(p), 5);
  if (mal === "any-regular") { const i = p.tray.findIndex((t) => isReg(t) && !(FLOORS as readonly number[]).includes(t.n)); return i < 0 ? null : nearCount(p, i); }
  if (mal === "only-regular") { const i = p.tray.findIndex((t) => isReg(t)); return i < 0 ? null : nearCount(p, i); }
  return null;
}
/** the set-up a child holding `mal` commits, or null (no change here, illegal, a win, or another mapped belief's set-up) */
export function malSetup(p: TileP, mal: string, among: readonly string[] = MAL_OF[p.goal]): Put[] | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  for (const other of among) {
    if (other === mal || !MAL_OF[p.goal].includes(other)) continue;
    const o = rawMal(p, other);
    if (o && samePut(o, m)) return null;
  }
  return m;
}
/** values the teacher may not say before the child produces them: the gap to fill, how many copies close the corner */
export function tileHidden(level: PlayLevel<unknown>): (string | number)[] {
  const p = level.params as TileP | null;
  if (!p || typeof p.goal !== "string" || !Array.isArray(p.tray)) return [];
  try {
    if (p.goal === "close") return [360 - laidSum(p)];
    const s = solution(p);
    return s ? [s.length] : [];
  } catch { return []; }
}

// ───────────────────────────── validate ─────────────────────────────

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const inR = (x: unknown, lo: number, hi: number): x is number => isInt(x) && x >= lo && x <= hi;
const isRegN = (n: unknown) => (REG as readonly unknown[]).includes(n);
/** an uneven tile that is honest: scalene / uneven, convex, its corner angles the drawing's, no corner (or other mix of its
 *  corners) closing a full turn but the one the idea gives (each triangle corner twice; each four-sided corner once) */
export function unevenOk(t: { ang: number[]; s?: number[] }): boolean {
  const a = t.ang, k = a.length;
  if ((k !== 3 && k !== 4) || !a.every((x) => inR(x, 40, 140)) || new Set(a).size < k - (k === 4 ? 1 : 0)) return false;
  if (a.reduce((s, x) => s + x, 0) !== (k === 3 ? 180 : 360)) return false;
  if (k === 4 && (!Array.isArray(t.s) || t.s.length !== 2 || !t.s.every((x) => inR(x, 2, 6)))) return false;
  if (k === 3 && t.s !== undefined) return false;
  if (a.some((x) => 360 % x === 0)) return false;
  const pts = shapeOf(t);
  if (signedArea(pts) <= 0.05) return false;
  for (let i = 0; i < k; i++) if (Math.abs(interior(pts, i) - a[i]) > 1e-6) return false;
  const sides = pts.map((q, i) => Math.hypot(pts[(i + 1) % k][0] - q[0], pts[(i + 1) % k][1] - q[1]));
  if (Math.min(...sides) < 0.36 * UNEVEN) return false;
  // the only whole-turn mix of its corners (up to 12 copies) is the idea's own
  const want = k === 3 ? [2, 2, 2] : [1, 1, 1, 1];
  const rec = (i: number, left: number, used: number, cnt: number[]): boolean => {
    if (i === k) return left === 0 ? cnt.every((x, j) => x === want[j]) : true;
    for (let m = 0; m * a[i] <= left && used + m <= 12; m++) { cnt[i] = m; if (!rec(i + 1, left - m * a[i], used + m, cnt)) return false; }
    return true;
  };
  return rec(0, 360, 0, new Array(k).fill(0));
}
function validParams(raw: Record<string, unknown>): TileP | null {
  const goal = raw.goal as TileGoal;
  if (!TILE_GOALS.includes(goal)) return null;
  const labels: Labels = raw.labels === 2 || raw.labels === 3 ? raw.labels : 1;
  const { tilt } = raw, trayRaw = raw.tray, laidRaw = raw.laid;
  if (!inR(tilt, 0, 345) || tilt % 15 || !Array.isArray(trayRaw) || !Array.isArray(laidRaw)) return null;
  const tray: Tile[] = [];
  for (const t of trayRaw as unknown[]) {
    if (!t || typeof t !== "object") return null;
    const o = t as Record<string, unknown>;
    if ("n" in o) { if (!isRegN(o.n) || Object.keys(o).length !== 1) return null; tray.push({ n: o.n as number }); continue; }
    if (!Array.isArray(o.ang) || !o.ang.every(isInt) || Object.keys(o).some((k) => k !== "ang" && k !== "s")) return null;
    const u: { ang: number[]; s?: number[] } = { ang: [...(o.ang as number[])], ...(Array.isArray(o.s) ? { s: [...(o.s as number[])] } : {}) };
    if (o.s !== undefined && !Array.isArray(o.s)) return null;
    if (!unevenOk(u)) return null;
    tray.push(u);
  }
  if (!laidRaw.every(isRegN)) return null;
  const laid = [...(laidRaw as number[])];
  const regs = tray.filter(isReg).map((t) => t.n), uneven = tray.filter((t) => !isReg(t));
  if (new Set(regs).size !== regs.length) return null;
  if (goal === "close") {
    if (tray.length < 2 || tray.length > 3 || uneven.length || laid.length < 1 || laid.length > 3) return null;
    const left = 360 - laid.reduce((s, n) => s + regAngle(n), 0);
    if (left < 60 || left > 300) return null;
  } else if (laid.length) return null;
  if (goal === "alone" && (tray.length !== 3 || uneven.length || regs.filter((n) => (FLOORS as readonly number[]).includes(n)).length !== 1)) return null;
  if (goal === "any" && (tray.length !== 2 || uneven.length !== 1 || regs.length !== 1 || (FLOORS as readonly number[]).includes(regs[0]))) return null;
  const p: TileP = { goal, labels, tray, laid, tilt };
  if (!closings(p).length) return null;
  return p;
}
function validate(level: PlayLevel<unknown>): PlayLevel<TileP> | null {
  const raw = level.params as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object" || level.mode !== "tile") return null;
  try {
    const params = validParams(raw);
    if (!params || (params.goal !== level.goal && level.goal !== undefined)) return null;
    return { ...level, params } as PlayLevel<TileP>;
  } catch { return null; }
}
function init(_level: PlayLevel<TileP>): TileState {
  return { put: [], ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}

// ───────────────────────────── the law ─────────────────────────────

function apply(level: PlayLevel<TileP>, s: TileState, act: DarpanAct, seq: number): { state: TileState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: TileState): TileState => ({ ...st, acts: s.acts + 1 });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const no = (why: string) => ({ state: bump(s), moments: out, refused: why });
  const change = (put: Put[]) => ({ state: bump(pushUndo(s, { ...s, put, ended: false })), moments: out });
  switch (act.kind) {
    case "lay": {
      const t = Number(act.t), c = Number(act.c ?? 0);
      if (!isInt(t) || t < 0 || t >= p.tray.length) return no("no_tile");
      if (!isInt(c) || c < 0 || c >= cornersOf(p.tray[t])) return no("no_corner");
      if (p.goal !== "close" && s.put.length && s.put[0].t !== t) return no("one_kind");
      if (s.put.length >= MAX_PUT || sumOf(p, s.put) >= 360) return no("round");
      return change([...s.put, { t, c }]);
    }
    case "lift": {
      const j = Number(act.j);
      if (!isInt(j) || j < 0 || j >= s.put.length) return no("no_copy");
      return change(s.put.filter((_, i) => i !== j));
    }
    case "run": {
      if (s.ended) return no("change_first");
      if (!s.put.length) return no("tiles_first");
      const runs = s.runs + 1, ok = judge(p, s.put);
      const end: TileState = bump({ ...s, ended: true, runs, done: ok });
      const miss = missOf(p, s.put);
      const base: Facts = { goal: p.goal, go: runs };
      if (ok) { out.push(mom("solved", seq, base)); return { state: end, moments: out }; }
      const among = Object.keys(level.mal);
      for (const mal of among) {
        const m = malSetup(p, mal, among);
        if (m && samePut(m, s.put)) { out.push(mom("misconception_consequence", seq, base, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      out.push(mom(Math.abs(miss) <= SMALL ? "near_miss" : "law_refused", seq, { ...base, why: miss > 0 ? "gap" : "overlap" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<TileP>, s: TileState) => s.done;

/** the acts that lay a set-up, then go */
export function setupActs(p: TileP, put: readonly Put[]): DarpanAct[] {
  return [...layOrder(p, put).map((q): DarpanAct => (cornersOf(p.tray[q.t]) > 1 ? { kind: "lay", t: q.t, c: q.c } : { kind: "lay", t: q.t })), { kind: "run" }];
}
function solve(level: PlayLevel<TileP>): DarpanAct[] | null {
  const su = solution(level.params);
  return su ? setupActs(level.params, su) : null;
}
/**
 * Set-ups that win without the idea. close: one of each tray tile; any one tray tile laid until the corner is round.
 * alone: the first tray tile laid until round; four of the first (a floor of four). any: the regular tile laid until
 * round; a triangle's three corners once each; its biggest or its smallest corner laid until round. A level any of them
 * wins is never served.
 */
function shortcutSetups(p: TileP): Put[][] {
  const tries: Put[][] = [];
  const until = (pieces: Put[]) => { const out: Put[] = []; let k = 0; while (sumOf(p, out) < 360 && out.length < MAX_PUT) out.push(pieces[k++ % pieces.length]); return out; };
  if (p.goal === "close") { tries.push(p.tray.map((_, t) => ({ t, c: 0 }))); p.tray.forEach((_, t) => tries.push(until([{ t, c: 0 }]))); }
  else if (p.goal === "alone") tries.push(until([{ t: 0, c: 0 }]), Array.from({ length: 4 }, () => ({ t: 0, c: 0 })));
  else {
    const r = p.tray.findIndex(isReg), u = 1 - r, ut = p.tray[u] as { ang: number[] }, k = ut.ang.length;
    const big = ut.ang.indexOf(Math.max(...ut.ang)), small = ut.ang.indexOf(Math.min(...ut.ang));
    tries.push(until([{ t: r, c: 0 }]), until([{ t: u, c: big }]), until([{ t: u, c: small }]));
    if (k === 3) tries.push([0, 1, 2].map((c) => ({ t: u, c })));
  }
  return tries;
}
function shortcut(level: PlayLevel<TileP>): DarpanAct[] | null {
  const p = level.params;
  for (const t of shortcutSetups(p)) if (legal(p, t) && judge(p, t)) return setupActs(p, t);
  return null;
}
function malActs(level: PlayLevel<TileP>, mal: string): DarpanAct[] | null {
  if (!Object.keys(level.mal ?? {}).includes(mal)) return null;
  const m = malSetup(level.params, mal, Object.keys(level.mal ?? {}));
  return m ? setupActs(level.params, m) : null;
}

// ───────────────────────────── the generator ─────────────────────────────

interface TileGrammar {
  /** close: the regular tiles that may be laid or offered; any: "tri" / "quad" (the uneven tiles on offer) */
  ns?: number[]; shapes?: string[];
}
function difficultyOf(p: TileP): number {
  const lab = 0.07 * (p.labels - 1), sol = solution(p) ?? [];
  if (p.goal === "close") {
    const kinds = new Set(sol.map((q) => q.t)).size, left = 360 - laidSum(p);
    return Math.min(1, 0.3 + lab + 0.04 * sol.length + 0.04 * (kinds - 1) + 0.03 * (p.laid.length - 1) + 0.0002 * left + (closings(p).length > 1 ? -0.03 : 0));
  }
  // alone / any: the kind of tile that closes (triangle, square or hexagon; three-cornered or four-cornered) never moves the
  // estimate much, so the picker's choice follows the seed's tray, not one favourite shape
  if (p.goal === "alone") return Math.min(1, 0.33 + lab + 0.006 * p.tray.reduce((s, t) => s + (isReg(t) && !(FLOORS as readonly number[]).includes(t.n) ? t.n : 0), 0));
  const u = p.tray.find((t) => !isReg(t)) as { ang: number[] };
  return Math.min(1, 0.4 + lab + (0.03 * u.ang.filter((a) => a % 5).length) / u.ang.length);
}
/** every corner of regular tiles from `ns` whose angles make 360° (3 to 6 tiles), as side counts */
const CORNERS = new Map<string, number[][]>();
function cornersFrom(ns: readonly number[]): number[][] {
  const key = [...ns].sort((a, b) => a - b).join(",");
  if (!CORNERS.has(key)) {
    const out: number[][] = [], ks = [...new Set(ns)].sort((a, b) => a - b);
    const rec = (from: number, left: number, cur: number[]) => {
      if (left === 0) { if (cur.length >= 3) out.push([...cur]); return; }
      if (cur.length === 6) return;
      for (let i = from; i < ks.length; i++) { const a = regAngle(ks[i]); if (a > left) break; cur.push(ks[i]); rec(i, left - a, cur); cur.pop(); }
    };
    rec(0, 360, []);
    CORNERS.set(key, out);
  }
  return CORNERS.get(key)!;
}
function shuffle<T>(xs: T[], rnd: () => number): T[] { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function generate(req: GenRequest): Candidate<TileP>[] {
  const g = (req.grammar ?? {}) as TileGrammar;
  const goal = (TILE_GOALS.includes(req.goal as TileGoal) ? req.goal : "close") as TileGoal;
  const rnd = mulberry32(req.seed), out: Candidate<TileP>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const labels = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as Labels;
  const ns = (g.ns ?? [...REG]).filter((n) => isRegN(n));
  const shapes = (g.shapes ?? ["tri", "quad"]).filter((x) => x === "tri" || x === "quad");
  const mk = (params: TileP, sig: string): Candidate<TileP> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `darpan-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_").slice(0, 120), family: "darpan", mode: "tile", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "darpan", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const tagOf = (t: Tile) => (isReg(t) ? `${t.n}` : `${t.ang.join("/")}${t.s ? `~${t.s.join("/")}` : ""}`);
  let corners: number[][] | null = null;
  for (let k = 0; k < 160 && out.length < 16; k++) {
    const tilt = 15 * int(0, 5);
    let raw: TileP;
    if (goal === "close") {
      // a real corner of regular tiles (its angles make 360°), split into the tiles already laid and the fill; the tray is
      // the fill's kinds and, where there is room, one more kind
      // (three corner kinds per request, so the seed decides which corners a child meets, never one favourite)
      // (and the rest only if those three give nothing: a corner of one kind, or one any single kind can also fill, never does)
      if (!corners) corners = shuffle(cornersFrom(ns).filter((c) => new Set(c).size > 1), rnd);
      if (!corners.length) break;
      const cn = shuffle(corners[k < 100 || out.length ? k % Math.min(3, corners.length) : k % corners.length], rnd), cut = int(1, Math.min(3, cn.length - 2));
      const laid = cn.slice(0, cut).sort((a, b) => a - b), kinds = [...new Set(cn.slice(cut))];
      if (kinds.length > 3) continue;
      const extra = shuffle(ns.filter((n) => !kinds.includes(n)), rnd).slice(0, rnd() < 0.7 ? 3 - kinds.length : 0);
      const tray = [...kinds, ...extra].sort((a, b) => a - b).map((n) => ({ n }));
      if (tray.length < 2) continue;
      raw = { goal, labels, tray, laid, tilt };
    } else if (goal === "alone") {
      const fl = pickOf(FLOORS.filter((n) => ns.includes(n)).length ? FLOORS.filter((n) => ns.includes(n)) : FLOORS);
      const nf = shuffle(NOT_FLOOR.filter((n) => ns.includes(n)).length >= 2 ? NOT_FLOOR.filter((n) => ns.includes(n)) : [...NOT_FLOOR], rnd).slice(0, 2);
      raw = { goal, labels, tray: shuffle([fl, ...nf], rnd).map((n) => ({ n })), laid: [], tilt };
    } else {
      const shape = pickOf(shapes.length ? shapes : ["tri"]);
      let u: { ang: number[]; s?: number[] };
      if (shape === "tri") { const a = int(40, 100), b = int(40, 100), c = 180 - a - b; u = { ang: [a, b, c] }; }
      else { const a = int(62, 128), b = int(62, 128), c = int(62, 128), d = 360 - a - b - c; u = { ang: [a, b, c, d], s: [int(3, 6), int(3, 6)] }; }
      const r = pickOf([5, 8, 10, 12].filter((n) => ns.includes(n)).length ? [5, 8, 10, 12].filter((n) => ns.includes(n)) : [5, 8]);
      raw = { goal, labels, tray: rnd() < 0.5 ? [u, { n: r }] : [{ n: r }, u], laid: [], tilt };
    }
    const sig = `${goal}:${raw.laid.join(".")}|${raw.tray.map(tagOf).join(",")}:${tilt}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(raw, sig);
    const v = validate(cand.level);
    if (!v || !solution(v.params) || shortcut(v)) continue;
    out.push({ ...mk(v.params, sig), level: v });
  }
  return out;
}

// ───────────────────────────── facts and the board twin ─────────────────────────────

export const TILE_NAMES: Record<number, string> = { 3: "triangle", 4: "square", 5: "pentagon", 6: "hexagon", 8: "octagon", 9: "nonagon", 10: "decagon", 12: "dodecagon" };
const nameOf = (t: Tile) => (isReg(t) ? TILE_NAMES[t.n] : t.ang.length === 3 ? "uneven triangle" : "uneven four-sided tile");
function facts(level: PlayLevel<TileP>, s: TileState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, tiles: s.put.length };
  if (s.put.length) f.tile = nameOf(p.tray[s.put[s.put.length - 1].t]);
  if (s.runs) f.goes = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<TileP>, s: TileState) {
  const p = level.params, lines: string[] = [];
  lines.push(`tray: ${p.tray.map(nameOf).join(", ")}`);
  if (p.laid.length) lines.push(`already round the point: ${p.laid.map((n) => TILE_NAMES[n]).join(", ")}`);
  lines.push(`laid: ${s.put.length ? s.put.map((q) => `${nameOf(p.tray[q.t])}${cornersOf(p.tray[q.t]) > 1 ? ` (corner ${"abcd"[q.c]})` : ""}`).join(", ") : "–"}`);
  if (s.ended) { const m = missOf(p, s.put); lines.push(m === 0 ? "the corner closes" : m > 0 ? `gap: ${m}°` : `overlap: ${-m}°`); }
  return { title: "Darpan", lines };
}
function grade(level: PlayLevel<TileP>, acts: PlayActEnvelope<DarpanAct>[]): PlayGrade {
  return gradeLevel(tileLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const tileLogic: FamilyLogic<TileP, TileState, DarpanAct> = {
  family: "darpan", modes: ["tile"], malRules: TILE_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
