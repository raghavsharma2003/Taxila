// Kon · lines (r7 kon2: arena-only line topics moved onto kon's turning arm). Three modes, PURE law + generator:
//   lines/parallel  squared paper; line 1 is drawn short through O; turn line 2 about P (off line 1) so the two never
//                   meet; the run extends both past the page and zooms out to where they meet, if they do (c7-ch05-t02 s1, s3)
//   lines/perp      turn line 2 about O (on a tilted line 1) so it meets line 1 at a right angle; the run lays a set-square
//                   on the crossing (c7-ch05-t02 s2, s3)
//   cross/corr      a road (transversal) crosses canal 1 at X1 and canal 2 at X2. ∠1 at X1 is drawn with its number; the
//   cross/alt       protractor at X2 measures ∠2; open ∠2 so canal 2 runs parallel to canal 1. corr: ∠2 sits at the corner
//                   that corresponds to ∠1 or beside it on the same road ray; alt: ∠1 is between the canals, ∠2 is its
//                   alternate (Z) or its same-side interior angle (c7-ch05-t03 s1, s2, s3)
//   ends/ends       points on one straight track; slide two stops onto points or off the end of the track so that only the
//                   named segment / ray / line is left; the run sends every open end on forever (c6-ch02-t01 s1, s2)
// Lines are directions mod 180: line 2's arm at h and at h + 180 is the same line.
// Mal-rules: not-meet-on-page (parallel: a line ~7° off, whose crossing lies far off the page) · perp-upright (perp: line 2
// stood straight up whatever line 1 does) · corr-position (corr: ∠2 beside the corresponding corner given ∠1's number) ·
// same-side-equal (alt: the same-side interior angle made equal to ∠1) · alt-same-side (alt: the same-side angle taken as
// the alternate one, so the real alternate made 180° − ∠1) · ray-two-ends (a ray stopped at both points) · ray-order (ray XY
// started at Y) · line-ends (a line stopped at its two named points, as if it had a length).
import type { Facts } from "../../../../shared/play.ts";

export type LineGoal = "parallel" | "perp" | "corr" | "alt" | "ends";
export const LINE_GOALS: readonly LineGoal[] = ["parallel", "perp", "corr", "alt", "ends"];
export const LINE_MAL = ["not-meet-on-page", "perp-upright", "corr-position", "same-side-equal", "alt-same-side", "ray-two-ends", "ray-order", "line-ends"] as const;
export const isLineGoal = (g: string | undefined): g is LineGoal => LINE_GOALS.includes(g as LineGoal);
export type Fig = "seg" | "ray" | "line";
/** the line-goal fields of KonParams (kon.logic.ts spreads them in) */
export interface LineParams {
  goal: string; start: number; tol: number; mirror?: boolean; scale: "10" | "30" | "landmarks";
  /** lines: line 1's direction on the squared paper (through O), and the pivot P of line 2 (grid units; O for perp) */
  dx?: number; dy?: number; px?: number; py?: number; grid?: boolean;
  /** cross: the road runs up from X2 at `start`; canal 1's direction `lam`; ∠1 between road ray t1 and canal ray l1 at X1,
   *  ∠2 between road ray t2 and canal ray l2 at X2 (ray "up" = towards X1, l = +1 along lam, −1 against) */
  lam?: number; t1?: "up" | "down"; l1?: 1 | -1; t2?: "up" | "down"; l2?: 1 | -1; given?: number;
  /** ends: the letters along the track (left to right), the figure and its two named letters (indices) */
  names?: string; fig?: Fig; x?: number; y?: number;
}
/** a stop: −2 parked off the track, −1 off the end (that side open), else the index of the point it sits on */
export type Stops = { lo: number; hi: number };

export const norm = (d: number) => ((d % 360) + 360) % 360;
export const diff = (a: number, b: number) => { const d = Math.abs(norm(a) - norm(b)); return Math.min(d, 360 - d); };
/** the angle between two LINES (directions mod 180), 0 … 90 */
export const ldiff = (a: number, b: number) => { const d = norm(a - b) % 180; return Math.min(d, 180 - d); };
/** the angle between two rays, 0 … 180 */
export const rayAngle = (a: number, b: number) => diff(a, b);
const deg = (rad: number) => (rad * 180) / Math.PI;

/** the page: a square of half-side PAGE grid units about O (the view draws exactly this sheet before the run) */
export const PAGE = 5;
/** where line 2 (through P at heading h) meets line 1 (through O along (dx, dy)), or null when they are parallel */
export function crossing(p: LineParams, h: number): [number, number] | null {
  const ux = p.dx ?? 1, uy = p.dy ?? 0, vx = Math.cos((h * Math.PI) / 180), vy = Math.sin((h * Math.PI) / 180);
  const den = ux * vy - uy * vx;
  if (Math.abs(den) < 1e-9) return null;
  const px = p.px ?? 0, py = p.py ?? 0;
  const s = (px * vy - py * vx) / den;           // O + s·u = P + t·v
  return [ux * s, uy * s];
}
export const onPage = (pt: [number, number] | null) => !!pt && Math.abs(pt[0]) <= PAGE && Math.abs(pt[1]) <= PAGE;

// ── cross: headings of the road rays and canal rays
export const roadRay = (p: LineParams, t: "up" | "down" | undefined) => norm(p.start + (t === "down" ? 180 : 0));
export const canalRay = (p: LineParams, l: 1 | -1 | undefined) => norm((p.lam ?? 0) + (l === -1 ? 180 : 0));
/** ∠1 as the geometry makes it */
export const angle1 = (p: LineParams) => rayAngle(roadRay(p, p.t1), canalRay(p, p.l1));
/** ∠2 when canal 2 runs parallel: the reading the protractor at X2 must show */
export const angle2 = (p: LineParams) => rayAngle(roadRay(p, p.t2), canalRay(p, p.l2));
/** the side the protractor at X2 opens to (+1 anticlockwise from the road ray t2, −1 clockwise) */
export const crossSign = (p: LineParams) => (norm(canalRay(p, p.l2) - roadRay(p, p.t2)) < 180 ? 1 : -1);
/** canal 2's arm (ray l2) at the reading r on X2's protractor */
export const crossArm = (p: LineParams, r: number) => norm(roadRay(p, p.t2) + crossSign(p) * r);
/** what ∠2 is to ∠1: the corresponding angle, the one beside it on the same road ray, the alternate, the same-side interior */
export function relation(p: LineParams): "corr" | "beside" | "alt" | "co" {
  if (p.goal === "alt") return p.l2 === p.l1 ? "co" : "alt";
  return p.l2 === p.l1 ? "corr" : "beside";
}

// ── ends
const FIG_ENDS = (fig: Fig, x: number, y: number): Stops =>
  fig === "seg" ? { lo: Math.min(x, y), hi: Math.max(x, y) }
  : fig === "line" ? { lo: -1, hi: -1 }
  : x < y ? { lo: x, hi: -1 } : { lo: -1, hi: x };
export const endsTarget = (p: LineParams): Stops => FIG_ENDS(p.fig ?? "seg", p.x ?? 0, p.y ?? 1);
export const sameStops = (a: Stops, b: Stops) => a.lo === b.lo && a.hi === b.hi;
/** a placement is a figure only when both stops are placed and an open-or-point lo sits left of an open-or-point hi */
export const stopsOk = (s: Stops) => s.lo !== -2 && s.hi !== -2 && (s.lo < 0 || s.hi < 0 || s.lo < s.hi);

/** the heading (or the stops) the law accepts */
export function lineTarget(p: LineParams): number {
  if (p.goal === "parallel") return norm(p.start);
  if (p.goal === "perp") return norm(p.start + 90);
  if (p.goal === "corr" || p.goal === "alt") return canalRay(p, p.l2);
  return 0;
}
/** a line is a line both ways: canal 2's arm pointing back through X2 makes the same canal */
export const lineMeets = (p: LineParams, h: number): boolean => ldiff(h, lineTarget(p)) <= p.tol;
/** the arm of a child holding mal-rule `mal` (null: the belief says nothing different here) */
export function lineMalHeading(p: LineParams, mal: string): number | null {
  let h: number | null = null;
  const t = lineTarget(p);
  if (p.goal === "parallel" && mal === "not-meet-on-page") h = norm(p.start + 7);
  if (p.goal === "perp" && mal === "perp-upright" && norm(p.start) % 90 !== 0) h = 90;
  const a1 = angle1(p), rel = p.goal === "corr" || p.goal === "alt" ? relation(p) : null;
  if (rel === "beside" && mal === "corr-position") h = crossArm(p, a1);
  if (rel === "co" && mal === "same-side-equal") h = crossArm(p, a1);
  if (rel === "alt" && mal === "alt-same-side") h = crossArm(p, 180 - a1);
  if (h === null || lineMeets(p, h)) return null;
  return ldiff(h, t) > 3 * p.tol ? h : null;
}
export function endsMal(p: LineParams, mal: string): Stops | null {
  const x = p.x ?? 0, y = p.y ?? 1;
  let s: Stops | null = null;
  if (p.fig === "ray" && mal === "ray-two-ends") s = FIG_ENDS("seg", x, y);
  if (p.fig === "ray" && mal === "ray-order") s = FIG_ENDS("ray", y, x);
  if (p.fig === "line" && mal === "line-ends") s = FIG_ENDS("seg", x, y);
  return s && !sameStops(s, endsTarget(p)) ? s : null;
}
export function lineValueFacts(p: LineParams): Facts {
  if (p.goal === "parallel" || p.goal === "perp") return { lines: p.goal };
  if (p.goal === "corr" || p.goal === "alt") return { a1: `${p.given}°`, rel: p.goal };
  const n = p.names ?? "";
  return { fig: p.fig ?? "seg", name: `${n[p.x ?? 0] ?? ""}${n[p.y ?? 1] ?? ""}` };
}

const intIn = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
const LETTERS = /^[A-Z]{3,4}$/;
/** each line goal's params from untrusted input, or null */
export function validateLine(p: Partial<LineParams>): LineParams | null {
  const tol = Number(p.tol);
  if (!(tol >= 1 && tol <= 15)) return null;
  const scale = p.scale === "30" || p.scale === "landmarks" ? p.scale : "10";
  const base = { goal: p.goal as LineGoal, tol, scale, mirror: false } as const;
  if (p.goal === "parallel" || p.goal === "perp") {
    const dx = intIn(p.dx, -4, 4), dy = intIn(p.dy, -4, 4), px = intIn(p.px, -4, 4), py = intIn(p.py, -4, 4);
    if (dx === null || dy === null || px === null || py === null || (dx === 0 && dy === 0)) return null;
    const start = norm(deg(Math.atan2(dy, dx))) % 180;
    const q: LineParams = { ...base, start, dx, dy, px, py, grid: !!p.grid };
    // parallel: P off line 1; perp: P is O
    if (p.goal === "parallel" && dx * py - dy * px === 0) return null;
    if (p.goal === "perp" && (px !== 0 || py !== 0)) return null;
    return q;
  }
  if (p.goal === "corr" || p.goal === "alt") {
    const start = intIn(p.start, 0, 359), lam = intIn(p.lam, -90, 359), given = intIn(p.given, 10, 170);
    const ud = (v: unknown) => (v === "up" || v === "down" ? v : null), pm = (v: unknown) => (v === 1 || v === -1 ? v : null);
    const t1 = ud(p.t1), t2 = ud(p.t2), l1 = pm(p.l1), l2 = pm(p.l2);
    if (start === null || lam === null || given === null || !t1 || !t2 || !l1 || !l2) return null;
    const q: LineParams = { ...base, start, lam, t1, t2, l1, l2, given };
    // ∠1's number is the geometry's; corr: ∠2 on ∠1's road ray; alt: ∠1 between the canals (road ray down at X1), ∠2 too
    if (Math.abs(angle1(q) - given) > 0.5 || ldiff(start, lam) < 15) return null;
    if (p.goal === "corr" && t2 !== t1) return null;
    if (p.goal === "alt" && (t1 !== "down" || t2 !== "up")) return null;
    return q;
  }
  if (p.goal === "ends") {
    const names = typeof p.names === "string" && LETTERS.test(p.names) && new Set(p.names).size === p.names.length ? p.names : null;
    const fig = p.fig === "seg" || p.fig === "ray" || p.fig === "line" ? p.fig : null;
    if (!names || !fig) return null;
    const x = intIn(p.x, 0, names.length - 1), y = intIn(p.y, 0, names.length - 1), start = intIn(p.start, 0, 179);
    if (x === null || y === null || x === y || start === null) return null;
    return { ...base, start, names, fig, x, y };
  }
  return null;
}

/** the line goals' generator (the mulberry32 stream the caller made from the seed) */
export function generateLine(goal: LineGoal, g: { tol?: number; figs?: Fig[]; grid?: boolean }, rnd: () => number, fade: number): { params: LineParams; sig: string }[] {
  const all = generateLineAll(goal, g, rnd, fade), seen = new Set<string>();
  return all.filter((c) => !seen.has(c.sig) && !!seen.add(c.sig));
}
function generateLineAll(goal: LineGoal, g: { tol?: number; figs?: Fig[]; grid?: boolean }, rnd: () => number, fade: number): { params: LineParams; sig: string }[] {
  const out: { params: LineParams; sig: string }[] = [];
  const scale: LineParams["scale"] = fade === 1 ? "10" : fade === 2 ? "30" : "landmarks";
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  if (goal === "parallel" || goal === "perp") {
    // line 1 on squared paper, at least ~18° off flat and upright (so pointing flat or upright never passes)
    const DIRS: [number, number][] = [[3, 1], [2, 1], [3, 2], [1, 1], [2, 3], [1, 2], [1, 3], [-3, 1], [-2, 1], [-3, 2], [-1, 1], [-2, 3], [-1, 2], [-1, 3]];
    const grid = g.grid ?? fade < 3;
    for (let k = 0; k < 24; k++) {
      const [dx, dy] = pick(DIRS);
      let px = 0, py = 0;
      if (goal === "parallel") {
        // P a grid point 1.5 … 3.2 units off line 1, within the page's middle
        px = Math.floor(rnd() * 7) - 3; py = Math.floor(rnd() * 7) - 3;
        const gap = Math.abs(dx * py - dy * px) / Math.hypot(dx, dy);
        if (gap < 1.5 || gap > 3.2) continue;
      }
      const params = validateLine({ goal, dx, dy, px, py, grid, tol: g.tol ?? (goal === "parallel" ? 2 : 3), scale })!;
      out.push({ params, sig: `${goal}:${dx},${dy}:${px},${py}` });
    }
    return out;
  }
  if (goal === "corr" || goal === "alt") {
    // the road climbs at 55° … 125° (never upright); canal 1 within 30° of flat; ∠1 a multiple of 5 well away from 90°
    for (let k = 0; k < 40; k++) {
      const start = 55 + 5 * Math.floor(rnd() * 15), lam = norm(-30 + 5 * Math.floor(rnd() * 13));
      if (Math.abs(start - 90) < 10) continue;
      const t1 = goal === "alt" ? "down" : pick(["up", "down"] as const), l1 = pick([1, -1] as const);
      const t2 = goal === "alt" ? "up" : t1, l2 = pick([1, -1] as const);
      const q = { goal, start, lam, t1, l1, t2, l2, given: 0, tol: g.tol ?? 3, scale } as LineParams;
      const a1 = angle1(q);
      if (Math.abs(a1 - 90) < 12 || a1 < 25 || a1 > 155) continue;
      const params = validateLine({ ...q, given: Math.round(a1) });
      if (!params) continue;
      out.push({ params, sig: `${goal}:${start}:${lam}:${t1}${l1}:${t2}${l2}` });
    }
    return out;
  }
  // ends: 3 or 4 letters on a gently tilted track; the figure named by two of them
  const ABC = "ABCDEFGHKLMNPQRSTXYZ";   // no I or O (a stroke and a ring read as marks)
  for (let k = 0; k < 24; k++) {
    const n = rnd() < 0.5 ? 3 : 4;
    let names = "";
    while (names.length < n) { const c = ABC[Math.floor(rnd() * ABC.length)]; if (!names.includes(c)) names += c; }
    const fig = pick(g.figs ?? (["seg", "ray", "ray", "line"] as Fig[]));
    const x = Math.floor(rnd() * n), y = Math.floor(rnd() * n);
    if (x === y) continue;
    const start = pick([0, 10, 20, 160, 170]);
    const params = validateLine({ goal: "ends", start, names, fig, x, y, tol: 1, scale })!;
    out.push({ params, sig: `ends:${fig}:${names}:${x}${y}:${start}` });
  }
  return out;
}

export function lineDifficulty(p: LineParams): number {
  if (p.goal === "parallel" || p.goal === "perp") return Math.min(1, 0.4 + (p.goal === "perp" ? 0.1 : 0) + (p.grid ? 0 : 0.25) + (Math.abs(p.dx ?? 0) + Math.abs(p.dy ?? 0) > 3 ? 0.1 : 0));
  if (p.goal === "corr" || p.goal === "alt") { const r = relation(p); return Math.min(1, 0.45 + (r === "beside" || r === "co" ? 0.2 : 0) + (p.goal === "alt" ? 0.1 : 0)); }
  const n = p.names?.length ?? 3;
  return Math.min(1, 0.25 + (p.fig === "ray" ? 0.2 : 0) + (n === 4 ? 0.1 : 0) + (p.fig === "ray" && Math.min(p.x ?? 0, p.y ?? 0) > 0 ? 0.1 : 0));
}
