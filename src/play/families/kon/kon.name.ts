// Kon · name (r8, c6-maths-ch02-t02, docs/design/round8/games-engine-needs.md §2): naming an angle by three letters. A figure
// of three rays from one vertex, their end points lettered, two of the end points joined (a triangle with the vertex), so
// there are five angles: three at the vertex and two triangle corners. Two goals:
//   say   one angle is lit; the child taps three letters in order and says it is the name
//   find  a name such as ∠PQR is shown; the child taps the arc of the angle it names
// The law: a name is right when its MIDDLE letter is the angle's vertex and its outer letters lie on its two arms, in either
// order (ABC = CBA). Whatever three letters are given, the law lights the angle they actually denote: at the middle letter,
// between the rays to the outer two (solid when it is one of the figure's five angles, dashed when not).
// Mal-rule vertex-name: the vertex is not put in the middle (say: the right three letters with the vertex first or last; find:
// the angle at the name's first or last letter is taken). The child sees a different corner light up than the one she meant.
// Judging round 2 (dc-r8-game-modes-three-laws): find is one tap among five arcs, so a first-letter pick is a SIGN (`sign` in
// the facts, chance weight, nothing on her record); only say (a three-letter name she builds) names vertex-name. Figures: the
// two arcs at the vertex between neighbouring rays sit at different radii (a gap where they meet), the joined pair never
// crosses a ray, O and Q are never in one figure, and at fade 1 the vertex is O in the first level only.
// Shortcut-free: a say level whose letters, read left to right or top to bottom, put the vertex in the middle is never served
// (reading across the screen would pass it); a find level whose answer is the widest arc is never served. The letters are
// drawn at random, so the vertex is not always "O".
// PURE law + generator + solver on a fixed board (BW × BH board px, y up), as kon.place.ts.
import type { Facts, Moment } from "../../../../shared/play.ts";

export type NameGoal = "say" | "find";
export const NAME_GOALS: readonly NameGoal[] = ["say", "find"];
export const NAME_MAL = ["vertex-name"] as const;
export const isNameGoal = (g: string | undefined): g is NameGoal => NAME_GOALS.includes(g as NameGoal);

export const NBW = 320, NBH = 300;
/** the letters a figure may use (the vertex is any of them) */
export const LETTERS = "ABCDEOPQRS";
/** a letter's touch radius (board px): points stay 2 × HIT + 4 apart, so their touch squares (48-64 px) never overlap */
export const HIT = 32;
/** each angle's arc (and its handle) radius: the two at the vertex between neighbouring rays, the wide one, the two corners */
export const ARC_R = [50, 50, 84, 24, 24];
/** where each arc is DRAWN (board px): the two at the vertex between neighbouring rays at different radii, so where they meet
 *  on the shared ray there is a gap and they never read as one curve (judging round 2). The tap model stays ARC_R: a tap is
 *  taken by sector and band, and each drawn arc lies inside its own arc's band (|DRAW_R − ARC_R| ≤ 8 ≪ BAND) */
export const DRAW_R = [42, 58, 84, 24, 24];
/** the letters that look alike at 360 px: never served in one figure */
export const LOOKALIKE = ["OQ"];

export interface NameFields {
  /** four letters: the vertex, then the ends of rays 1, 2, 3 */
  lets?: string;
  /** the rays' headings and lengths */
  h1?: number; h2?: number; h3?: number; ln1?: number; ln2?: number; ln3?: number;
  /** which two ray ends are joined: 0 = rays 1-2, 1 = rays 2-3, 2 = rays 1-3 */
  tri?: number;
  /** say: the lit angle; find: the asked angle and which way round its name is written (0: arm, vertex, arm as listed) */
  ask?: number; ord?: number;
}
export interface NameParamsLike extends NameFields { goal: string; start: number; tol: number; scale: "10" | "30" | "landmarks"; vx?: number; vy?: number }
/** an angle of the figure: its vertex point and its two arm points (point 0 = the vertex V, 1..3 = the ray ends) */
export interface Corner { v: number; a: number; b: number }
export interface NameState { taps: number[]; picked: number | null; said: number[] | null }

const R = (d: number) => (d * Math.PI) / 180;
const norm = (d: number) => ((d % 360) + 360) % 360;
const headingOf = (dx: number, dy: number) => norm((Math.atan2(dy, dx) * 180) / Math.PI);

export function points(p: NameParamsLike): [number, number][] {
  const V: [number, number] = [p.vx ?? 0, p.vy ?? 0];
  const ray = (h = 0, l = 0): [number, number] => [V[0] + l * Math.cos(R(h)), V[1] + l * Math.sin(R(h))];
  return [V, ray(p.h1, p.ln1), ray(p.h2, p.ln2), ray(p.h3, p.ln3)];
}
export const TRI_PAIRS: [number, number][] = [[1, 2], [2, 3], [1, 3]];
/** the figure's five angles: at V between rays 1-2, 2-3, 1-3; and the two triangle corners */
export function corners(p: NameParamsLike): Corner[] {
  const [x, y] = TRI_PAIRS[p.tri ?? 0];
  return [{ v: 0, a: 1, b: 2 }, { v: 0, a: 2, b: 3 }, { v: 0, a: 1, b: 3 }, { v: x, a: 0, b: y }, { v: y, a: 0, b: x }];
}
/** the figure's segments (rays from V, and the joined pair) */
export const segments = (p: NameParamsLike): [number, number][] => [[0, 1], [0, 2], [0, 3], TRI_PAIRS[p.tri ?? 0]];
/** the size of the angle a name (three point indices) denotes, at its middle point; null when the points do not make one */
export function sizeOf(p: NameParamsLike, t: number[]): number | null {
  if (t.length !== 3 || new Set(t).size !== 3) return null;
  const P = points(p), [a, v, b] = t.map((i) => P[i]);
  const d = Math.abs(headingOf(a[0] - v[0], a[1] - v[1]) - headingOf(b[0] - v[0], b[1] - v[1])), s = Math.min(d, 360 - d);
  return s < 1 || s > 179 ? null : s;
}
/** the figure's angle a name denotes (index), or -1 (an angle not drawn: the law dashes it) */
export function denotes(p: NameParamsLike, t: number[]): number {
  if (t.length !== 3 || new Set(t).size !== 3) return -1;
  return corners(p).findIndex((c) => c.v === t[1] && ((c.a === t[0] && c.b === t[2]) || (c.a === t[2] && c.b === t[0])));
}
/** a corner's name as three point indices (ord 1: the other way round) */
export const nameOf = (c: Corner, ord = 0): number[] => (ord ? [c.b, c.v, c.a] : [c.a, c.v, c.b]);
export const spell = (p: NameParamsLike, t: number[]) => t.map((i) => (p.lets ?? "OABC")[i] ?? "?").join("");
/** the asked angle (say: lit; find: named) */
export const asked = (p: NameParamsLike): Corner => corners(p)[p.ask ?? 0];
/** find: the vertex-name belief's pick: the figure angle at the shown name's first (or last) letter, with the other two as arms */
export function vertexNamePick(p: NameParamsLike): number {
  const t = nameOf(asked(p), p.ord ?? 0);
  for (const tt of [[t[1], t[0], t[2]], [t[0], t[2], t[1]]]) { const k = denotes(p, tt); if (k >= 0) return k; }
  return -1;
}

export type NameAct = { kind: "letter"; at: number } | { kind: "arc"; at: number } | { kind: "clear" } | { kind: "commit" };
export const initName = (): NameState => ({ taps: [], picked: null, said: null });
export type NameStep = { nm?: NameState; refused?: string; commit?: { kind: Moment["kind"]; facts: Facts; mis?: string; done?: boolean } };

export function stepName(p: NameParamsLike, s: NameState, a: NameAct, mal: Record<string, string>): NameStep {
  if (p.goal === "find") {
    if (a.kind !== "arc") return { refused: "unknown_act" };
    const k = Number(a.at);
    if (!Number.isInteger(k) || k < 0 || k > 4) return { refused: "bad_arc" };
    return commitFind(p, { ...s, picked: k }, mal);
  }
  if (a.kind === "letter") {
    const i = Number(a.at);
    if (!Number.isInteger(i) || i < 0 || i > 3) return { refused: "bad_letter" };
    if (s.taps.length >= 3) return { refused: "three_already" };
    return { nm: { ...s, taps: [...s.taps, i] } };
  }
  if (a.kind === "clear") return s.taps.length ? { nm: { ...s, taps: [] } } : { refused: "nothing" };
  if (a.kind === "commit") {
    if (s.taps.length !== 3) return { refused: "three_first" };
    return commitSay(p, { ...s, said: s.taps.slice() }, mal);
  }
  return { refused: "unknown_act" };
}
const yn = (b: boolean) => (b ? "yes" : "no");
function shownFacts(p: NameParamsLike, t: number[]): Facts {
  const k = denotes(p, t);
  return { shown: k >= 0 ? "figure" : sizeOf(p, t) === null ? "none" : "dashed" };
}
function commitSay(p: NameParamsLike, s: NameState, mal: Record<string, string>): NameStep {
  const t = s.said as number[], c = asked(p);
  const vertexOk = t[1] === c.v, armsOk = new Set([t[0], t[2]]).size === 2 && [t[0], t[2]].every((i) => i === c.a || i === c.b);
  const f: Facts = { name: spell(p, t), vertex_ok: yn(vertexOk), arms_ok: yn(armsOk) };
  if (vertexOk && armsOk) return { nm: s, commit: { kind: "solved", done: true, facts: f } };
  const sameLetters = new Set(t).size === 3 && t.every((i) => i === c.v || i === c.a || i === c.b);
  if ("vertex-name" in mal && sameLetters && !vertexOk) return { nm: s, commit: { kind: "misconception_consequence", mis: "vertex-name", facts: { ...f, ...shownFacts(p, t) } } };
  return { nm: s, commit: { kind: "law_refused", facts: { ...f, ...shownFacts(p, t), why: "other_angle" } } };
}
function commitFind(p: NameParamsLike, s: NameState, mal: Record<string, string>): NameStep {
  const k = s.picked as number, want = p.ask ?? 0, c = corners(p)[k], w = asked(p);
  const f: Facts = { name: spell(p, nameOf(w, p.ord ?? 0)), picked: spell(p, nameOf(c)), vertex_ok: yn(c.v === w.v), arms_ok: yn(new Set([c.a, c.b, w.a, w.b]).size === 2) };
  if (k === want) return { nm: s, commit: { kind: "solved", done: true, facts: f } };
  // one tap among five: never a named mix-up (law 3); the first-letter pick is reported as a sign, at chance weight
  void mal;
  return { nm: s, commit: { kind: "law_refused", facts: { ...f, why: "other_angle", shown: "her_arc", ...(k === vertexNamePick(p) ? { sign: "vertex-name" } : {}) } } };
}

export function solveName(p: NameParamsLike): NameAct[] {
  if (p.goal === "find") return [{ kind: "arc", at: p.ask ?? 0 }];
  return [...nameOf(asked(p)).map((i): NameAct => ({ kind: "letter", at: i })), { kind: "commit" }];
}
export function malName(p: NameParamsLike, mal: string): NameAct[] | null {
  if (mal !== "vertex-name") return null;
  if (p.goal === "find") { const k = vertexNamePick(p); return k >= 0 && k !== p.ask ? [{ kind: "arc", at: k }] : null; }
  const c = asked(p);
  // the right three letters, the vertex first
  return [c.v, c.a, c.b].map((i): NameAct => ({ kind: "letter", at: i })).concat([{ kind: "commit" }]);
}
/** reading the lit angle's letters across the screen (left to right, or top to bottom) / taking the widest arc */
export function shortcutName(p: NameParamsLike): NameAct[] | null {
  const P = points(p);
  if (p.goal === "find") {
    const sizes = corners(p).map((c) => sizeOf(p, nameOf(c)) ?? 0), widest = sizes.indexOf(Math.max(...sizes));
    return widest === (p.ask ?? 0) ? [{ kind: "arc", at: widest }] : null;
  }
  const c = asked(p), three = [c.a, c.v, c.b];
  for (const axis of [0, 1]) {
    const order = [...three].sort((i, j) => (axis === 0 ? P[i][0] - P[j][0] : P[j][1] - P[i][1]));
    if (order[1] === c.v) return [...order.map((i): NameAct => ({ kind: "letter", at: i })), { kind: "commit" }];
  }
  return null;
}

/** where each angle's arc handle sits: on its bisector, nearer the vertex for the three at V's adjacent pairs */
export function handles(p: NameParamsLike): [number, number][] {
  const P = points(p);
  return corners(p).map((c, k) => {
    const v = P[c.v], ha = headingOf(P[c.a][0] - v[0], P[c.a][1] - v[1]), hb = headingOf(P[c.b][0] - v[0], P[c.b][1] - v[1]);
    let d = norm(hb - ha); if (d > 180) d -= 360;
    const mid = ha + d / 2, r = ARC_R[k];
    return [v[0] + r * Math.cos(R(mid)), v[1] + r * Math.sin(R(mid))];
  });
}

/** find: a tap within BAND board px of an arc is a tap on that arc (the nearest arc wins, so no two arcs share a point) */
export const BAND = 44;
/** the distance from (x, y) to corner k's arc (radius ARC_R[k] about its vertex, between its two arms) */
export function arcDist(p: NameParamsLike, k: number, x: number, y: number): number { return arcGeo(p)[k](x, y); }
/** each arc's distance function (the figure's geometry worked out once) */
function arcGeo(p: NameParamsLike): ((x: number, y: number) => number)[] {
  const P = points(p);
  return corners(p).map((c, k) => {
    const v = P[c.v], r = ARC_R[k];
    const ha = headingOf(P[c.a][0] - v[0], P[c.a][1] - v[1]), hb = headingOf(P[c.b][0] - v[0], P[c.b][1] - v[1]);
    let d = norm(hb - ha); if (d > 180) d -= 360;
    const e1: [number, number] = [v[0] + r * Math.cos(R(ha)), v[1] + r * Math.sin(R(ha))], e2: [number, number] = [v[0] + r * Math.cos(R(ha + d)), v[1] + r * Math.sin(R(ha + d))];
    // the sector test by cross products, not atan2 (the generator's touch-disc search calls this tens of thousands of times per
    // level; tests/r8-games-kon-name.test.mjs holds the picker to 50 ms of CPU): inside when the point lies on the arm-a side
    // turning towards arm b and not past arm b. Exact for |d| < 180, which every served corner is (each is 20°..160°)
    const ua = [Math.cos(R(ha)), Math.sin(R(ha))], ub = [Math.cos(R(ha + d)), Math.sin(R(ha + d))], sg = d >= 0 ? 1 : -1;
    const wide = Math.abs(d) >= 179.999;
    const dist = (dx: number, dy: number) => Math.sqrt(dx * dx + dy * dy);
    return (x: number, y: number) => {
      const wx = x - v[0], wy = y - v[1];
      let inside: boolean;
      if (wide) { const phi = headingOf(wx, wy), rel = d >= 0 ? norm(phi - ha) : norm(ha - phi); inside = rel <= Math.abs(d); }
      else inside = sg * (ua[0] * wy - ua[1] * wx) >= 0 && sg * (wx * ub[1] - wy * ub[0]) >= 0;
      if (inside) return Math.abs(dist(wx, wy) - r);
      return Math.min(dist(x - e1[0], y - e1[1]), dist(x - e2[0], y - e2[1]));
    };
  });
}
const hitWith = (G: ((x: number, y: number) => number)[], x: number, y: number) => {
  let best = -1, bd = BAND;
  for (let k = 0; k < G.length; k++) { const d = G[k](x, y); if (d <= bd) { bd = d; best = k; } }
  return best;
};
/** find: which arc a tap at board point (x, y) is on (-1: none within BAND) */
export function arcHit(p: NameParamsLike, x: number, y: number): number { return hitWith(arcGeo(p), x, y); }
/**
 * find: each arc's touch disc (board px, centre and diameter `side`, 48 or 56): a round target that lies wholly in the arc's
 * own tap region, so no two discs overlap and each is ≥ 48 CSS px across wherever 1 board px ≥ 1 CSS px (a phone). null when
 * an arc has none (the generator never serves that figure). Squares do not fit beside a short corner arc; discs do.
 */
export function arcTargets(p: NameParamsLike, min = 48): ({ x: number; y: number; side: number } | null)[] {
  const one = arcTarget(p, min);
  return [0, 1, 2, 3, 4].map(one);
}
/** does every arc have its touch disc? (the generator's check: the short corner arcs, which fail most, first) */
export const arcTargetsOk = (p: NameParamsLike, min = 48) => { const one = arcTarget(p, min); return [3, 4, 0, 1, 2].every((k) => one(k) !== null); };
function arcTarget(p: NameParamsLike, min: number): (k: number) => { x: number; y: number; side: number } | null {
  const P = points(p), G = arcGeo(p), C = corners(p);
  // the rim first (where a disc usually leaves its arc's region), then half way out, then the centre
  const ring = [[1, 16], [0.5, 8], [0, 1]].flatMap(([f, n]) => Array.from({ length: n }, (_, i) => [f * Math.cos((2 * Math.PI * i) / n), f * Math.sin((2 * Math.PI * i) / n)]));
  return (k: number) => {
    const c = C[k], v = P[c.v], ha = headingOf(P[c.a][0] - v[0], P[c.a][1] - v[1]), hb = headingOf(P[c.b][0] - v[0], P[c.b][1] - v[1]);
    let d = norm(hb - ha); if (d > 180) d -= 360;
    // centres on a 7 px grid around the arc, nearest the arc's middle first; a disc passes when its centre, 8 points half way
    // out and 16 on its rim are all on this arc
    const r0 = ARC_R[k], hm = ha + d / 2, mx = v[0] + r0 * Math.cos(R(hm)), my = v[1] + r0 * Math.sin(R(hm)), ext = r0 + BAND;
    const cands: [number, number, number][] = [];
    for (let x = v[0] - ext; x <= v[0] + ext; x += 7) for (let y = v[1] - ext; y <= v[1] + ext; y += 7) {
      if (x < 0 || x > NBW || y < 0 || y > NBH || G[k](x, y) > BAND / 2) continue;
      cands.push([x, y, Math.hypot(x - mx, y - my)]);
    }
    cands.sort((a, b) => a[2] - b[2]);
    // (checked 4 px wider than it is said to be, so the region between the sample points holds too)
    const fits = (x: number, y: number, side: number) => ring.every(([u, w]) => hitWith(G, x + (u * (side + 8)) / 2, y + (w * (side + 8)) / 2) === k);
    for (const [x, y] of cands) if (fits(x, y, min)) return { x, y, side: fits(x, y, min + 8) ? min + 8 : min };
    return null;
  };
}

export function nameValueFacts(p: NameParamsLike): Facts {
  return p.goal === "find" ? { name: `∠${spell(p, nameOf(asked(p), p.ord ?? 0))}` } : { lit: "angle" };
}
export function nameFacts(p: NameParamsLike, s: NameState | undefined, base: Facts): Facts {
  const f: Facts = { ...base };
  if (s?.said) f.said = spell(p, s.said);
  else if (s?.taps.length) f.taps = spell(p, s.taps);
  if (s?.picked !== null && s?.picked !== undefined) f.picked = spell(p, nameOf(corners(p)[s.picked]));
  // the evidence: whether the vertex is in the middle, and the outer letters on its two arms (her latest decision)
  const ev = nameEvidence(p, s);
  if (ev.name !== null) { f.vertex_ok = ev.vertexOk ? "yes" : "no"; f.arms_ok = ev.armsOk ? "yes" : "no"; }
  return f;
}
export function nameEvidence(p: NameParamsLike, s: NameState | undefined): { name: string | null; vertexOk: boolean | null; armsOk: boolean | null } {
  if (!s) return { name: null, vertexOk: null, armsOk: null };
  const c = asked(p);
  if (p.goal === "find") {
    if (s.picked === null) return { name: null, vertexOk: null, armsOk: null };
    const k = corners(p)[s.picked];
    return { name: spell(p, nameOf(k)), vertexOk: k.v === c.v, armsOk: new Set([k.a, k.b, c.a, c.b]).size === 2 };
  }
  const t = s.said;
  if (!t) return { name: null, vertexOk: null, armsOk: null };
  return { name: spell(p, t), vertexOk: t[1] === c.v, armsOk: [t[0], t[2]].every((i) => i === c.a || i === c.b) && t[0] !== t[2] };
}

const fin = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
export function validateName<P extends NameParamsLike>(q: Partial<P>): P | null {
  const tol = Number(q.tol), scale = q.scale === "30" || q.scale === "landmarks" ? q.scale : "10";
  if (!(tol >= 1 && tol <= 15)) return null;
  const lets = String(q.lets ?? "");
  if (lets.length !== 4 || new Set(lets).size !== 4 || [...lets].some((ch) => !LETTERS.includes(ch))) return null;
  const vx = fin(q.vx, 0, NBW), vy = fin(q.vy, 0, NBH), tri = Number(q.tri), ask = Number(q.ask), ord = Number(q.ord ?? 0);
  const hs = [q.h1, q.h2, q.h3].map((h) => fin(h, 0, 360)), ls = [q.ln1, q.ln2, q.ln3].map((l) => fin(l, 40, 200));
  if (vx === null || vy === null || hs.some((h) => h === null) || ls.some((l) => l === null)) return null;
  if (![0, 1, 2].includes(tri) || !Number.isInteger(ask) || ask < 0 || ask > 4 || (ord !== 0 && ord !== 1)) return null;
  const out = { goal: q.goal, start: 0, tol, scale, lets, vx, vy, h1: hs[0], h2: hs[1], h3: hs[2], ln1: ls[0], ln2: ls[1], ln3: ls[2], tri, ask, ord } as unknown as P;
  // every angle of the figure is a real angle (no three points in line)
  if (corners(out).some((c) => sizeOf(out, nameOf(c)) === null)) return null;
  return out;
}

/** does segment a-b cross segment c-d away from their end points? */
function crosses(a: [number, number], b: [number, number], c: [number, number], d: [number, number]): boolean {
  const o = (p: [number, number], q: [number, number], r: [number, number]) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d), e = 1e-6;
  return ((d1 > e && d2 < -e) || (d1 < -e && d2 > e)) && ((d3 > e && d4 < -e) || (d3 < -e && d4 > e));
}
/** the figure's joined pair crosses none of its rays (a crossing would make a corner the figure does not name) */
export function noCrossing(p: NameParamsLike): boolean {
  const P = points(p), [i, j] = TRI_PAIRS[p.tri ?? 0];
  return [1, 2, 3].every((r) => r === i || r === j || !crosses(P[i], P[j], P[0], P[r]));
}
/** say: the angle a vertex-first name (the mix-up) denotes, when it is not one of the figure's: its size (its dashed arc must
 *  be long enough to see at 360) */
export function sayMalSize(p: NameParamsLike): number | null {
  const c = asked(p), t = [c.v, c.a, c.b];
  return denotes(p, t) >= 0 ? null : sizeOf(p, t);
}
/** the radius of the dashed play-out arc of an angle of `deg` degrees: ≥ 30 board px and long enough to run ≥ 24 board px
 *  (≥ 20 CSS px at 360, where 1 board px ≥ 1 CSS px) */
export const dashR = (deg: number) => Math.min(72, Math.max(30, 24 / ((Math.max(deg, 1) * Math.PI) / 180)));
/** the first level a child meets at fade 1 has vertex O (as the book first does); every later one does not, so "O in the
 *  middle" cannot pass the fade */
export function generateName(goal: NameGoal, rnd: () => number, fade: number, first = true): { params: NameParamsLike; sig: string }[] {
  const out: { params: NameParamsLike; sig: string }[] = [], seen = new Set<string>();
  for (let k = 0; k < 160 && out.length < 20; k++) {
    const base = 5 * Math.floor(rnd() * 72), g1 = 50 + 5 * Math.floor(rnd() * 7), g2 = 50 + 5 * Math.floor(rnd() * 7);
    const hs = [base, norm(base + g1), norm(base + g1 + g2)];
    const ls = [0, 1, 2].map(() => 105 + 5 * Math.floor(rnd() * 5));
    // the letters: four of LETTERS at random, never two that look alike (O and Q); fade 1: the vertex is "O" in her first
    // level only, never after (any other point may be O then)
    const oFirst = fade === 1 && first, pick: string[] = oFirst ? ["O"] : [];
    const notO = fade === 1 && !first;
    for (let g = 0; pick.length < 4 && g < 64; g++) {
      const ch = LETTERS[Math.floor(rnd() * LETTERS.length)];
      if (pick.includes(ch) || (notO && pick.length === 0 && ch === "O")) continue;
      if (LOOKALIKE.some((pair) => pair.includes(ch) && pick.some((x) => x !== ch && pair.includes(x)))) continue;
      pick.push(ch);
    }
    if (pick.length < 4) continue;
    // the joined pair: two NEIGHBOURING ray ends (1-2 or 2-3); joining 1-3 would cross ray 2
    const tri = Math.floor(rnd() * 2), ask = Math.floor(rnd() * 5), ord = rnd() < 0.5 ? 0 : 1;
    // the figure centred on the board
    const ends = [[0, 0], ...hs.map((h, i) => [ls[i] * Math.cos(R(h)), ls[i] * Math.sin(R(h))])];
    const xs = ends.map((e) => e[0]), ys = ends.map((e) => e[1]);
    const vx = Math.round(NBW / 2 - (Math.min(...xs) + Math.max(...xs)) / 2), vy = Math.round(NBH / 2 - (Math.min(...ys) + Math.max(...ys)) / 2);
    const params: NameParamsLike = { goal, start: 0, tol: 3, scale: fade === 1 ? "10" : fade === 2 ? "30" : "landmarks", lets: pick.join(""), vx, vy, h1: hs[0], h2: hs[1], h3: hs[2], ln1: ls[0], ln2: ls[1], ln3: ls[2], tri, ask, ord };
    const sig = `name:${goal}:${base}:${g1}:${g2}:${tri}:${ask}${goal === "find" ? `:${ord}` : ""}`;
    if (seen.has(sig)) continue;
    // fits, with room for the letters; every two points (and, for find, every two arc handles) a touch apart
    const P = points(params);
    if (!P.every(([x, y]) => x >= 26 && x <= NBW - 26 && y >= 26 && y <= NBH - 26)) continue;
    const apart = (Q: [number, number][], d: number) => Q.every((a, i) => Q.every((b, j) => j <= i || Math.hypot(a[0] - b[0], a[1] - b[1]) >= d));
    if (!apart(P, 2 * HIT + 4)) continue;
    if (corners(params).some((c) => (sizeOf(params, nameOf(c)) ?? 0) < 20)) continue;
    if (!noCrossing(params)) continue;
    if (shortcutName(params)) continue;
    // say: the vertex-first name's dashed angle (when it is not one of the five) is ≥ 20°, so its arc can be seen
    if (goal === "say") { const m = sayMalSize(params); if (m !== null && m < 20) continue; }
    // find: only names whose first- or last-letter reading is one of the figure's angles (the belief shows somewhere real)
    if (goal === "find" && vertexNamePick(params) < 0) continue;
    // find: every arc has a touch square of its own (≥ 48 board px, wholly in its own tap band)
    if (goal === "find" && !arcTargetsOk(params)) continue;
    seen.add(sig); out.push({ params, sig });
  }
  return out;
}
export function nameDifficulty(p: NameParamsLike): number {
  return Math.min(1, (p.goal === "find" ? 0.35 : 0.4) + ((p.ask ?? 0) >= 3 ? 0.15 : 0) + ((p.ask ?? 0) === 2 ? 0.1 : 0) + ((p.lets ?? "O")[0] !== "O" ? 0.1 : 0));
}
