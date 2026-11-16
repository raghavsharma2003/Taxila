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
// Judging round 2 (dc-r8-game-modes-three-laws): find is one tap among five arcs, so its first-letter pick is graded at chance
// weight as chanceMis (the central law-3 rule: find is a oneDecision goal), never on her record from one tap. Gate 2 (night
// rulings 2026-11-11, rulings 2026-11-15): say's name is a pick too (three random taps give a vertex-first or vertex-last
// name 1 time in 6), so it names vertex-name only on a repeat, on levels with other figures and other letters (gate 2 per
// session, 2026-11-16: the third occurrence within the session's first four levels; konLogic.chanceRepeat; nameSurface);
// a faint solve (nameFaint) enters at chance weight and discriminates nothing. Figures: the
// two arcs at the vertex between neighbouring rays sit at different radii (a gap where they meet), the joined pair never
// crosses a ray, O and Q are never in one figure, and at fade 1 the vertex is O in the first level only.
// Shortcut-free: a say level whose letters, read left to right or top to bottom, put the vertex in the middle is never served
// (reading across the screen would pass it), unless EVERY such reading does (readsAcrossAll: gate 2, the discriminating
// level, dc-r8-gate2-discriminating-level): there reading across is the right name, a vertex at an end is the mix-up's alone,
// its solve is faint, and a session is steered to one after a first sighting. find's key is drawn evenly over all five arcs, the wide one included, so no rule
// that ignores the name (a small arc, a corner, the widest) beats 1 in 5 (night ruling kon/name 2). No two of a figure's
// angles are within 8° of each other in size (three different ray lengths; night ruling kon/name 1). The letters are drawn
// at random, so the vertex is not always "O".
// PURE law + generator + solver on a fixed board (BW × BH board px, y up), as kon.place.ts.
import type { Facts, Moment } from "../../../../shared/play.ts";

export type NameGoal = "say" | "find";
export const NAME_GOALS: readonly NameGoal[] = ["say", "find"];
export const NAME_MAL = ["vertex-name"] as const;
export const isNameGoal = (g: string | undefined): g is NameGoal => NAME_GOALS.includes(g as NameGoal);

export const NBW = 320, NBH = 300;
/** the wide arc's index among the five (at the vertex, between rays 1 and 3) */
export const WIDE = 2;
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
/** gate 1, ruling 2 (2026-11-15): the wide arc (drawn and tapped alike) runs WIDE_ROOM board px inside the figure's shortest
 *  ray, at most ARC_R[WIDE]: it never ends on a point (at 84 it ran into A, with BA 85, and close to P). find serves a figure
 *  only when that leaves the wide arc WIDE_MIN or more out, clear of the arcs at the vertex (58 drawn: a gap of 12) */
export const WIDE_ROOM = 16, WIDE_MIN = 70;
export function wideR(p: NameParamsLike): number {
  return Math.min(ARC_R[WIDE], Math.min(p.ln1 ?? 0, p.ln2 ?? 0, p.ln3 ?? 0) - WIDE_ROOM);
}
/** arc k's radius in the tap model (ARC_R, the wide one by the figure) */
export function arcR(p: NameParamsLike, k: number): number { return k === WIDE ? wideR(p) : ARC_R[k]; }
/** arc k's drawn radius (DRAW_R, the wide one by the figure, as tapped) */
export function drawR(p: NameParamsLike, k: number): number { return k === WIDE ? wideR(p) : DRAW_R[k]; }
/** find (gate 1, ruling 1): the band (board px) left above or below the figure's room box for the "≠" row at 360 (the phone's
 *  canvas adds about 27 board px on each side of the board, the row with its padding is about 31 high) */
export const ROW_GAP = 8;
/** the figure's room box in board y (low, high): its points (and dots), its letters each with one letter height round them
 *  (as the row keeps clear of them), and every arc as drawn */
export function rowExtent(p: NameParamsLike): [number, number] {
  const P = points(p), LP = labelPoints(p), ys: number[] = [];
  for (const q of P) ys.push(q[1] - 8, q[1] + 8);
  for (const q of LP) ys.push(q[1] - LETTER_ROOM, q[1] + LETTER_ROOM);
  corners(p).forEach((c, k) => {
    const v = P[c.v], ha = headingOf(P[c.a][0] - v[0], P[c.a][1] - v[1]), hb = headingOf(P[c.b][0] - v[0], P[c.b][1] - v[1]), r = drawR(p, k);
    let d = norm(hb - ha); if (d > 180) d -= 360;
    for (let i = 0; i <= 12; i++) { const y = v[1] + r * Math.sin(R(ha + (d * i) / 12)); ys.push(y - 4, y + 4); }
  });
  return [Math.min(...ys), Math.max(...ys)];
}
/** a letter's half height and one letter height of room round it, board px */
const LETTER_ROOM = 27;
export function rowRoom(p: NameParamsLike): boolean { const [lo, hi] = rowExtent(p); return NBH - hi >= ROW_GAP || lo >= ROW_GAP; }
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
/**
 * say, after a miss (dc-r8-gate2-shadow S3): `checks`, her missed names so far; `waits`, true from a missed name until her
 * next letter or "Mita do" (the check waits until her name changes); `tapAt`, for each tap, the `checks` it was made under
 * (a name all of whose taps carry the current count was built after the last miss: builtSinceMiss). "Wapas" keeps `checks`
 * and `waits` as they are (kon.logic.ts apply), as it keeps the count of checks; `tapAt` goes back with the taps.
 */
export interface NameState { taps: number[]; picked: number | null; said: number[] | null; checks?: number; waits?: boolean; tapAt?: number[] }

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
/** night ruling kon/name 1: no two of the figure's five angles are within MIN_APART degrees of each other in size, so find's
 *  "∠ABC ≠ ∠BCA" is true whether "≠" is read as "another angle" or as "not equal in size" */
export const MIN_APART = 8;
/** the sizes of the figure's five angles (degrees; 0 where three points are in line) */
export const angleSizes = (p: NameParamsLike): number[] => corners(p).map((c) => sizeOf(p, nameOf(c)) ?? 0);
export function anglesApart(p: NameParamsLike, min = MIN_APART): boolean {
  const z = angleSizes(p);
  return z.every((a, i) => z.every((b, j) => j <= i || Math.abs(a - b) >= min));
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
    return { nm: { ...s, taps: [...s.taps, i], tapAt: [...tapsAt(s), s.checks ?? 0], waits: false } };
  }
  if (a.kind === "clear") return s.taps.length ? { nm: { ...s, taps: [], tapAt: [], waits: false } } : { refused: "nothing" };
  if (a.kind === "commit") {
    if (s.taps.length !== 3) return { refused: "three_first" };
    // dc-r8-gate2-shadow S3: after a miss the check waits until her name has changed (a letter or "Mita do" since it); the
    // view's "Yahi naam" is off until then, so a second press on the same wrong name neither plays the miss out again nor
    // costs her a check
    if (s.waits) return { refused: "unchanged" };
    const r = commitSay(p, { ...s, said: s.taps.slice() }, mal);
    return r.commit && !r.commit.done && r.nm ? { ...r, nm: { ...r.nm, checks: (s.checks ?? 0) + 1, waits: true } } : r;
  }
  return { refused: "unknown_act" };
}
/** each tap's `checks` count (a state with none: every tap made before any miss) */
const tapsAt = (s: NameState): number[] => s.taps.map((_, i) => s.tapAt?.[i] ?? 0);
/** say (dc-r8-gate2-shadow S3): was the name she now has built after her last miss (every tap made since it)? Before any
 *  miss, every name is. */
export const builtSinceMiss = (s: NameState): boolean => tapsAt(s).every((k) => k === (s.checks ?? 0));
/** say: is a name (three point indices) the vertex-name mix-up's: exactly the lit angle's three letters, the vertex not in
 *  the middle (vertex first or last: four of the six orders) */
export function isVertexNameSaid(p: NameParamsLike, t: number[]): boolean {
  const c = asked(p);
  return t.length === 3 && new Set(t).size === 3 && t.every((i) => i === c.v || i === c.a || i === c.b) && t[1] !== c.v;
}
function shownFacts(p: NameParamsLike, t: number[]): Facts {
  const k = denotes(p, t);
  return { shown: k >= 0 ? "figure" : sizeOf(p, t) === null ? "none" : "dashed" };
}
function commitSay(p: NameParamsLike, s: NameState, mal: Record<string, string>): NameStep {
  const t = s.said as number[], c = asked(p);
  const vertexOk = t[1] === c.v, armsOk = new Set([t[0], t[2]]).size === 2 && [t[0], t[2]].every((i) => i === c.a || i === c.b);
  // gate 2 (night rulings 2026-11-11, rulings 2026-11-15 "kept for gate 2"): a say name is a pick too (konLogic.chancePicks
  // "say:vertex-name": three random taps give a vertex-first or vertex-last name 1 time in 6 at worst), so like find's tap it
  // reports the name she gave only: whether her vertex was in the middle is the mix-up's content (no vertex_ok / arms_ok)
  const f: Facts = { name: spell(p, t) };
  if (vertexOk && armsOk) return { nm: s, commit: { kind: "solved", done: true, facts: f } };
  if ("vertex-name" in mal && isVertexNameSaid(p, t)) return { nm: s, commit: { kind: "misconception_consequence", mis: "vertex-name", facts: { ...f, ...shownFacts(p, t) } } };
  return { nm: s, commit: { kind: "law_refused", facts: { ...f, ...shownFacts(p, t), why: "other_angle" } } };
}
function commitFind(p: NameParamsLike, s: NameState, mal: Record<string, string>): NameStep {
  const k = s.picked as number, want = p.ask ?? 0, c = corners(p)[k], w = asked(p);
  // (find reports the name and her arc only: whether her vertex was right is the mix-up's content, and one tap tells the
  // lesson nothing about it; evening ruling kon/name 3)
  const f: Facts = { name: spell(p, nameOf(w, p.ord ?? 0)), picked: spell(p, nameOf(c)) };
  if (k === want) return { nm: s, commit: { kind: "solved", done: true, facts: f } };
  // one tap among five (law 3): the first-letter pick plays out its signature, and the grade (find is a oneDecision goal)
  // keeps it at chance weight as chanceMis, never on her record from one tap; the server names it on a repeat (the third, gate
  // 2 per session) on levels with other letters (server/play/levels.js nameOnRepeat, kon surfaceOf). Until then nothing about it reaches the
  // lesson: no sign in the facts, no seam, no trail entry (server/play/routes.js, grade.js)
  if ("vertex-name" in mal && k === vertexNamePick(p)) return { nm: s, commit: { kind: "misconception_consequence", mis: "vertex-name", facts: { ...f, shown: "her_arc" } } };
  return { nm: s, commit: { kind: "law_refused", facts: { ...f, why: "other_angle", shown: "her_arc" } } };
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
/** where each point's letter is drawn (board px): 18 out from the point, away from the vertex (the vertex's opposite its
 *  rays); the view draws them here */
export const LABEL_OUT = 18;
export function labelPoints(p: NameParamsLike): [number, number][] {
  const P = points(p), V = P[0];
  return P.map((q, i) => {
    let ux: number, uy: number;
    if (i === 0) { ux = 0; uy = 0; for (const j of [1, 2, 3]) { const L = Math.hypot(P[j][0] - V[0], P[j][1] - V[1]) || 1; ux -= (P[j][0] - V[0]) / L; uy -= (P[j][1] - V[1]) / L; } }
    else { ux = q[0] - V[0]; uy = q[1] - V[1]; }
    const L = Math.hypot(ux, uy) || 1;
    return [q[0] + (LABEL_OUT * ux) / L, q[1] + (LABEL_OUT * uy) / L];
  });
}
/** one letter's height and width on the board (18 px letters, 1 board px ≥ 1 CSS px on a phone), with a little slack: two
 *  letters this close in y read as one row, this close in x as one column (evening ruling kon/name 1) */
export const LETTER_H = 22, LETTER_W = 16;
/** the points in reading order: rows (letters within LETTER_H in y; chained) top to bottom or bottom to top, each row left
 *  to right or right to left; or columns (within LETTER_W in x) left to right or right to left, each top to bottom or bottom
 *  to top. Eight orders */
function readingOrders(Q: [number, number][]): number[][] {
  const groups = (axis: 0 | 1, tol: number): number[][] => {
    const idx = Q.map((_, i) => i).sort((i, j) => Q[i][axis] - Q[j][axis]), out: number[][] = [];
    for (const i of idx) { const g = out[out.length - 1]; if (g && Q[i][axis] - Q[g[g.length - 1]][axis] <= tol) g.push(i); else out.push([i]); }
    return out;
  };
  const orders: number[][] = [];
  // rows: y up on the board, so the top row has the largest y
  const rows = groups(1, LETTER_H).reverse(), cols = groups(0, LETTER_W);
  for (const outer of [rows, [...rows].reverse()]) for (const dir of [1, -1]) orders.push(outer.flatMap((g) => [...g].sort((i, j) => dir * (Q[i][0] - Q[j][0]))));
  for (const outer of [cols, [...cols].reverse()]) for (const dir of [1, -1]) orders.push(outer.flatMap((g) => [...g].sort((i, j) => dir * (Q[j][1] - Q[i][1]))));
  return orders;
}
/** the asked angle's three letters read off the screen by rows or by columns, either way, with the vertex in the middle
 *  (by the points or by where their letters are drawn), or null */
export function readsAcross(p: NameParamsLike): number[] | null {
  const c = asked(p), three = new Set([c.a, c.v, c.b]);
  for (const Q of [points(p), labelPoints(p)]) for (const o of readingOrders(Q)) {
    const t = o.filter((i) => three.has(i));
    if (t[1] === c.v) return t;
  }
  return null;
}
/**
 * Gate 2, dc-r8-gate2-discriminating-level (main's answer 2, 2026-11-16): a say level on which EVERY reading of the lit
 * angle's letters across the screen (by rows or by columns, either way, by the points or by where their letters are drawn:
 * all sixteen) puts the vertex in the middle. There a child who reads across gives the right name and a child who puts the
 * vertex first or last still does not, so a name with the vertex at an end there is the mix-up's and no reading habit's: the
 * discriminating level, served on purpose (shortcutName lets it through, its solve is faint: nameFaint) and steered to after
 * a first sighting (konLogic generate). The vertex must lie between the arms' ends both across and up the screen, in rows
 * and columns of their own: an angle over 90° facing a diagonal.
 */
export function readsAcrossAll(p: NameParamsLike): boolean {
  const c = asked(p), three = new Set([c.a, c.v, c.b]);
  for (const Q of [points(p), labelPoints(p)]) for (const o of readingOrders(Q)) if (o.filter((i) => three.has(i))[1] !== c.v) return false;
  return true;
}
/** reading the asked angle's letters across the screen by rows or columns (both goals). find's key is no longer kept off
 *  the wide arc (night ruling kon/name 2: the keys are spread evenly over all five, so "the widest" wins 1 time in 5, as a
 *  blind tap does). The wide arc is the one key exempt from the reading check: it is over 90°, and the vertex of any angle
 *  over 90° lies between its arms' ends across the screen by rows or by columns, so no wide-arc level could pass it. Reading
 *  across then finds the key on those levels only: 1 time in 5, the rate find's first tap is weighted at.
 *  say (dc-r8-gate2-discriminating-level): a level where every reading puts the vertex in the middle (readsAcrossAll) is the
 *  discriminating level and is served; a level where some readings do and some do not stays a shortcut, never served */
export function shortcutName(p: NameParamsLike): NameAct[] | null {
  if (p.goal === "find") return (p.ask ?? 0) !== WIDE && readsAcross(p) ? [{ kind: "arc", at: p.ask ?? 0 }] : null;
  const across = readsAcross(p);
  return across && !readsAcrossAll(p) ? [...across.map((i): NameAct => ({ kind: "letter", at: i })), { kind: "commit" }] : null;
}

/** where each angle's arc handle sits: on its bisector, nearer the vertex for the three at V's adjacent pairs */
export function handles(p: NameParamsLike): [number, number][] {
  const P = points(p);
  return corners(p).map((c, k) => {
    const v = P[c.v], ha = headingOf(P[c.a][0] - v[0], P[c.a][1] - v[1]), hb = headingOf(P[c.b][0] - v[0], P[c.b][1] - v[1]);
    let d = norm(hb - ha); if (d > 180) d -= 360;
    const mid = ha + d / 2, r = arcR(p, k);
    return [v[0] + r * Math.cos(R(mid)), v[1] + r * Math.sin(R(mid))];
  });
}

/** find: a tap within BAND board px of an arc is a tap on that arc (the nearest arc wins, so no two arcs share a point) */
export const BAND = 44;
/** the distance from (x, y) to corner k's arc (radius arcR(p, k) about its vertex, between its two arms) */
export function arcDist(p: NameParamsLike, k: number, x: number, y: number): number { return arcGeo(p)[k](x, y); }
/** each arc's distance function (the figure's geometry worked out once) */
function arcGeo(p: NameParamsLike): ((x: number, y: number) => number)[] {
  const P = points(p);
  return corners(p).map((c, k) => {
    const v = P[c.v], r = arcR(p, k);
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
/** hitWith(G, x, y) === k, stopping at the first arc that rules it out (the touch-disc search's inner test): k is within
 *  BAND, no arc before it is nearer, and none after it as near (hitWith keeps the last of equals) */
const hitIs = (G: ((x: number, y: number) => number)[], k: number, x: number, y: number) => {
  const dk = G[k](x, y);
  if (dk > BAND) return false;
  for (let j = 0; j < G.length; j++) if (j !== k) { const d = G[j](x, y); if (j < k ? d < dk : d <= dk) return false; }
  return true;
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
/** does every arc have its touch disc? (the generator's check: the corner arcs, which fail most, first) */
export const arcTargetsOk = (p: NameParamsLike, min = 48) => { const one = arcTarget(p, min); return [4, 3, 0, 1, 2].every((k) => one(k) !== null); };
function arcTarget(p: NameParamsLike, min: number): (k: number) => { x: number; y: number; side: number } | null {
  const P = points(p), G = arcGeo(p), C = corners(p);
  // the rim first (where a disc usually leaves its arc's region), then half way out, then the centre
  const ring = [[1, 24], [0.5, 8], [0, 1]].flatMap(([f, n]) => Array.from({ length: n }, (_, i) => [f * Math.cos((2 * Math.PI * i) / n), f * Math.sin((2 * Math.PI * i) / n)]));
  return (k: number) => {
    const c = C[k], v = P[c.v], ha = headingOf(P[c.a][0] - v[0], P[c.a][1] - v[1]), hb = headingOf(P[c.b][0] - v[0], P[c.b][1] - v[1]);
    let d = norm(hb - ha); if (d > 180) d -= 360;
    // centres on a 7 px grid around the arc, nearest the arc's middle first; a disc passes when its centre, 8 points half way
    // out and 24 on its rim are all on this arc
    const r0 = arcR(p, k), hm = ha + d / 2, mx = v[0] + r0 * Math.cos(R(hm)), my = v[1] + r0 * Math.sin(R(hm)), ext = r0 + BAND;
    const cands: [number, number, number][] = [];
    // (only the grid points in the box round the arc's band are looked at: a point farther than BAND / 2 from the arc is never
    // a centre, so the centres, and their order, are those of the whole grid; the picker's speed bar)
    const bx: number[] = [], by: number[] = [];
    for (const t of [0, 1, ...[0, 90, 180, 270, 360, 450].map((a) => (d >= 0 ? norm(a - ha) : norm(ha - a)) / Math.abs(d)).filter((t) => t > 0 && t < 1)]) {
      bx.push(v[0] + r0 * Math.cos(R(ha + d * t))); by.push(v[1] + r0 * Math.sin(R(ha + d * t)));
    }
    const lo = (a: number[], o: number) => Math.max(0, Math.ceil((Math.min(...a) - BAND / 2 - 1 - o) / 7)), hi = (a: number[], o: number) => Math.floor((Math.max(...a) + BAND / 2 + 1 - o) / 7);
    const x0 = v[0] - ext, y0 = v[1] - ext, n = Math.floor((2 * ext) / 7 + 1e-9);
    for (let i = lo(bx, x0), i1 = Math.min(n, hi(bx, x0)); i <= i1; i++) for (let j = lo(by, y0), j1 = Math.min(n, hi(by, y0)); j <= j1; j++) {
      const x = x0 + 7 * i, y = y0 + 7 * j;
      if (x < 0 || x > NBW || y < 0 || y > NBH || G[k](x, y) > BAND / 2) continue;
      cands.push([x, y, Math.hypot(x - mx, y - my)]);
    }
    cands.sort((a, b) => a[2] - b[2]);
    // (checked 2 px wider all round than it is said to be, so the region between its 24 rim points holds too (a gap of 15°
    // there bows in by under 1 px); the sample point that ruled out the last centre is tried first, since neighbouring
    // centres fail on the same side: the picker's speed bar)
    const SLACK = 4;
    let bad = 0;
    const fits = (x: number, y: number, side: number) => {
      const at = (i: number) => hitIs(G, k, x + (ring[i][0] * (side + SLACK)) / 2, y + (ring[i][1] * (side + SLACK)) / 2);
      if (!at(bad)) return false;
      for (let i = 0; i < ring.length; i++) if (i !== bad && !at(i)) { bad = i; return false; }
      return true;
    };
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
  // (whether the vertex is in the middle is the mix-up's content: neither goal reports it, since a find tap and a say name
  // are both picks (evening ruling kon/name 3; gate 2 for say); nameEvidence keeps it for the tests)
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
/**
 * Gate 1, ruling 3 (2026-11-15), for the discriminating say levels (dc-r8-gate2-discriminating-level): the play-out of a name
 * with the vertex first or last, when it is not one of the figure's angles, draws its two rays dashed; a ray that does not
 * lie on a drawn line (the view sets those beside the line, away from the lit sector) must run outside the lit sector (the
 * asked angle, filled to arcR). The wide angle's chord between its arms' ends runs through it, so such a level is not served.
 */
export function sayPlayoutClear(p: NameParamsLike): boolean {
  const c = asked(p), P = points(p), segs = segments(p), lv = P[c.v], R0 = arcR(p, p.ask ?? 0);
  const ha = headingOf(P[c.a][0] - lv[0], P[c.a][1] - lv[1]), hb = headingOf(P[c.b][0] - lv[0], P[c.b][1] - lv[1]);
  let sw = norm(hb - ha); if (sw > 180) sw -= 360;
  const inside = (x: number, y: number) => {
    const d = Math.hypot(x - lv[0], y - lv[1]);
    if (d >= R0 - 1 || d < 1) return false;
    const rel = sw > 0 ? norm(headingOf(x - lv[0], y - lv[1]) - ha) : norm(ha - headingOf(x - lv[0], y - lv[1]));
    return rel > 1 && rel < Math.abs(sw) - 1;
  };
  for (const t of [[c.v, c.a, c.b], [c.a, c.b, c.v]]) {
    if (denotes(p, t) >= 0 || sizeOf(p, t) === null) continue;
    for (const e of [t[0], t[2]]) {
      if (segs.some(([i, j]) => (i === t[1] && j === e) || (j === t[1] && i === e))) continue;
      const v = P[t[1]];
      for (let i = 0; i <= 40; i++) if (inside(v[0] + ((P[e][0] - v[0]) * i) / 40, v[1] + ((P[e][1] - v[1]) * i) / 40)) return false;
    }
  }
  return true;
}
/** the radius of the dashed play-out arc of an angle of `deg` degrees: ≥ 30 board px and long enough to run ≥ 24 board px
 *  (≥ 20 CSS px at 360, where 1 board px ≥ 1 CSS px) */
export const dashR = (deg: number) => Math.min(72, Math.max(30, 24 / ((Math.max(deg, 1) * Math.PI) / 180)));
/** find: the largest asked angle (but the wide one) the generator draws: under it the angle can face a diagonal with its arms
 *  clear of the vertex's row and column */
const KEY_MAX = 65;
/** the first level a child meets at fade 1 has vertex O (as the book first does); every later one does not, so "O in the
 *  middle" cannot pass the fade */
export function generateName(goal: NameGoal, rnd: () => number, fade: number, first = true, o: { need?: (p: NameParamsLike) => boolean; tries?: number; disc?: boolean } = {}): { params: NameParamsLike; sig: string }[] {
  const out: { params: NameParamsLike; sig: string }[] = [], seen = new Set<string>();
  // (find: 8 figures are enough for the picker, and each passing figure costs a full touch-disc search; say: 20)
  const want = goal === "find" ? 8 : 20;
  // (find: more figures are tried, since the touch discs refuse many of them; the touch-disc search, the costly check, runs
  // last)
  const tries = o.tries ?? (goal === "find" ? 1000 : 200);
  // find (night ruling kon/name 2): one key arc per request, and one joined pair, drawn first: the key is each of the five
  // arcs 1 time in 5 (the wide one included), and the angle at the vertex inside the triangle as often as the one outside
  // it, so whatever the picker prefers among the figures, no rule that ignores the name (a small arc, an arc inside the
  // triangle, a corner, the widest) wins a first tap more than 1 time in 5
  const findAsk = goal === "find" ? Math.floor(rnd() * 5) : null, findTri = goal === "find" ? Math.floor(rnd() * 2) : null;
  for (let k = 0; k < tries && out.length < want; k++) {
    // the joined pair: two NEIGHBOURING ray ends (1-2 or 2-3); joining 1-3 would cross ray 2
    const tri = findTri ?? Math.floor(rnd() * 2);
    // night ruling kon/name 1: the five angles are chosen first, on a 5° grid, every two at least MIN_APART + 2 apart in size
    // (the triangle's angle at the vertex gT, the other gap gO, the wide one gT + gO, the triangle's corners cX and cY); the
    // two joined rays then take the lengths that make those corners (VX : VY = sin cY : sin cX), so the triangle is never
    // isosceles, and the third ray a length of its own. anglesApart below checks the figure as drawn
    // (find: the asked angle, unless it is the wide one, is at most KEY_MAX, so it can face a diagonal; see below)
    const keyAt = findAsk === null || findAsk === WIDE ? null : findAsk >= 3 ? findAsk : findAsk === tri ? 0 : 1;
    let sizes: number[] | null = null, long = 0;
    for (let g = 0; g < 24 && !sizes; g++) {
      const cX = 25 + 5 * Math.floor(rnd() * 10), cY = 25 + 5 * Math.floor(rnd() * 10), gT = 180 - cX - cY, gO = 45 + 5 * Math.floor(rnd() * 12);
      const z = [gT, gO, gT + gO, cX, cY];
      if (gT + gO > 165 || (o.disc && gT < 100) || (keyAt !== null && z[keyAt] > KEY_MAX) || !z.every((x, i) => z.every((y, j) => j <= i || Math.abs(x - y) >= MIN_APART + 2))) continue;
      // the joined rays: the longer 110..150, the shorter (in proportion) at least 70
      const lo = Math.max(110, 70 / (Math.min(Math.sin(R(cX)), Math.sin(R(cY))) / Math.max(Math.sin(R(cX)), Math.sin(R(cY)))));
      if (lo > 150) continue;
      long = Math.min(150, Math.ceil(lo / 5) * 5 + 5 * Math.floor(rnd() * 9));
      // (and the two at least 12 apart: the three lengths a child sees differ)
      if ((long * Math.abs(Math.sin(R(cX)) - Math.sin(R(cY)))) / Math.max(Math.sin(R(cX)), Math.sin(R(cY))) < 13) continue;
      sizes = z;
    }
    if (!sizes) continue;
    const [gT, gO, , cX, cY] = sizes, g1 = tri === 0 ? gT : gO, g2 = tri === 0 ? gO : gT;
    // (X is the first of the joined pair, Y the second)
    const sX = Math.sin(R(cY)), sY = Math.sin(R(cX)), kk = long / Math.max(sX, sY), lX = Math.round(kk * sX), lY = Math.round(kk * sY);
    // the third: 80..150, at least 12 from both
    let lZ = 0;
    for (let g = 0; g < 8 && !lZ; g++) { const l = 80 + 5 * Math.floor(rnd() * 15); if (Math.abs(l - lX) >= 12 && Math.abs(l - lY) >= 12) lZ = l; }
    if (!lZ) continue;
    const ls = tri === 0 ? [lX, lY, lZ] : [lZ, lX, lY];
    // which way the figure faces. find: the asked angle (at most KEY_MAX) faces a diagonal (its arms in one quarter of the screen,
    // clear of the vertex's row and column), so reading its letters across the screen does not put the vertex in the middle
    // and the figure is not refused for it (most were); say, and find's wide arc: any way
    let base = 5 * Math.floor(rnd() * 72);
    // say, a discriminating level asked for (dc-r8-gate2-discriminating-level, `disc`): the angle at the vertex inside the
    // triangle (100° or more: the sizes above), its bisector on a diagonal give or take 10°, so its arms' ends lie on either
    // side of the vertex both across and up the screen (readsAcrossAll checks it below)
    if (o.disc) { const bis = tri === 0 ? g1 / 2 : g1 + g2 / 2; base = norm(5 * Math.round((45 + 90 * Math.floor(rnd() * 4) - bis + (rnd() * 2 - 1) * 10) / 5)); }
    if (goal === "find" && findAsk !== WIDE) {
      const P0 = points({ goal, start: 0, tol: 3, scale: "10", vx: 0, vy: 0, h1: 0, h2: g1, h3: g1 + g2, ln1: ls[0], ln2: ls[1], ln3: ls[2], tri, ask: findAsk ?? 0 });
      const c = corners({ goal, start: 0, tol: 3, scale: "10", tri })[findAsk ?? 0], v = P0[c.v];
      const ha = headingOf(P0[c.a][0] - v[0], P0[c.a][1] - v[1]), hb = headingOf(P0[c.b][0] - v[0], P0[c.b][1] - v[1]);
      let d = norm(hb - ha); if (d > 180) d -= 360;
      const bis = ha + d / 2, room = 45 - Math.abs(d) / 2 - 12;
      if (room >= 0) base = norm(5 * Math.round((45 + 90 * Math.floor(rnd() * 4) - bis + (rnd() * 2 - 1) * room) / 5));
    }
    const hs = [base, norm(base + g1), norm(base + g1 + g2)];
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
    const ask = findAsk ?? (o.disc ? tri : Math.floor(rnd() * 5)), ord = rnd() < 0.5 ? 0 : 1;
    // the figure centred on the board
    const place = (L: number[]): NameParamsLike => {
      const ends = [[0, 0], ...hs.map((h, i) => [L[i] * Math.cos(R(h)), L[i] * Math.sin(R(h))])];
      const xs = ends.map((e) => e[0]), ys = ends.map((e) => e[1]);
      const vx = Math.round(NBW / 2 - (Math.min(...xs) + Math.max(...xs)) / 2), vy = Math.round(NBH / 2 - (Math.min(...ys) + Math.max(...ys)) / 2);
      return { goal, start: 0, tol: 3, scale: fade === 1 ? "10" : fade === 2 ? "30" : "landmarks", lets: pick.join(""), vx, vy, h1: hs[0], h2: hs[1], h3: hs[2], ln1: L[0], ln2: L[1], ln3: L[2], tri, ask, ord };
    };
    let params = place(ls);
    // find (gate 1, ruling 1): the "≠" row needs a band ROW_GAP deep above or below the whole figure, arcs and letters
    // included. A figure that leaves neither is moved up or down (the smaller move that keeps its points on the board); one
    // too tall for that is drawn smaller (its rays shortened alike, so its angles stay), at most twice, down to 0.8
    if (goal === "find") {
      let ok = false;
      for (let g = 0; g < 3 && !ok; g++) {
        const [lo, hi] = rowExtent(params), up = ROW_GAP - (NBH - hi), dn = ROW_GAP - lo;
        if (up <= 0 || dn <= 0) { ok = true; break; }
        const ys = points(params).map((q) => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const move = [-Math.ceil(up), Math.ceil(dn)].sort((m1, m2) => Math.abs(m1) - Math.abs(m2)).find((m) => y0 + m >= 26 && y1 + m <= NBH - 26);
        if (move !== undefined) { params = { ...params, vy: (params.vy ?? 0) + move }; ok = true; break; }
        if (g === 2) break;
        const over = Math.min(26 - (y0 - Math.ceil(up)), y1 + Math.ceil(dn) - (NBH - 26)), k = 1 - (over + 2) / Math.max(1, y1 - y0);
        if (k < 0.8) break;
        const L = [params.ln1 ?? 0, params.ln2 ?? 0, params.ln3 ?? 0].map((l) => Math.round(l * k));
        // (still three lengths a child sees differ)
        if (L.some((l, i) => L.some((m, j) => j > i && Math.abs(l - m) < 12))) break;
        params = place(L);
      }
      if (!ok || !rowRoom(params)) continue;
    }
    const sig = `name:${goal}:${base}:${g1}:${g2}:${cX}:${tri}:${ask}${goal === "find" ? `:${ord}` : ""}`;
    if (seen.has(sig)) continue;
    // fits, with room for the letters; every two points (and, for find, every two arc handles) a touch apart
    const P = points(params);
    if (!P.every(([x, y]) => x >= 26 && x <= NBW - 26 && y >= 26 && y <= NBH - 26)) continue;
    const apart = (Q: [number, number][], d: number) => Q.every((a, i) => Q.every((b, j) => j <= i || Math.hypot(a[0] - b[0], a[1] - b[1]) >= d));
    if (!apart(P, 2 * HIT + 4)) continue;
    // find: the wide arc, WIDE_ROOM inside the shortest ray, stays clear of the arcs at the vertex (gate 1, ruling 2)
    if (goal === "find" && wideR(params) < WIDE_MIN) continue;
    if (corners(params).some((c) => (sizeOf(params, nameOf(c)) ?? 0) < 20)) continue;
    if (!anglesApart(params)) continue;
    if (!noCrossing(params)) continue;
    if (shortcutName(params)) continue;
    // (a discriminating say level: its play-out's dashed rays clear of the lit sector, gate 1 ruling 3)
    if (goal === "say" && readsAcrossAll(params) && !sayPlayoutClear(params)) continue;
    // say: the vertex-first name's dashed angle (when it is not one of the five) is ≥ 20°, so its arc can be seen
    if (goal === "say") { const m = sayMalSize(params); if (m !== null && m < 20) continue; }
    // (find: a key whose first- or last-letter reading is not one of the figure's angles (the wide one, the angle at the
    // vertex outside the triangle) is served all the same, night ruling kon/name 2; its miss is a plain miss)
    // find: every arc has a touch square of its own (≥ 48 board px, wholly in its own tap band)
    if (goal === "find" && !arcTargetsOk(params)) continue;
    if (o.need && !o.need(params)) continue;
    seen.add(sig); out.push({ params, sig });
  }
  return out;
}
/**
 * Gate 2 (law 3): what a level shows, in two parts: the figure (the goal, the rays' headings, the joined pair, the asked
 * angle) and its letters. A second sighting of vertex-name counts only on a level where BOTH differ (levels.js
 * surfacesDiffer), so "differ" means another figure with other letters.
 */
export const nameSurface = (p: NameParamsLike): string[] => [`${p.goal}:${p.h1}:${p.h2}:${p.h3}:${p.tri}:${p.ask}`, `lets:${p.lets}`];
/**
 * Gate 2: a right answer on this level says less than the goal's usual one (konLogic.faintSolve: CHANCE_WEIGHT, no
 * discriminates): the first fade-1 level with O at the vertex of the asked angle (the book's first figure: "O in the
 * middle" passes it without the rule; rulings 2026-11-11 night and 2026-11-15), and a find level where no arc but the key
 * has a named vertex with arms to the other two letters (the wide key, and the angle at the vertex outside the triangle: 2
 * levels in 5; the any-order belief finds the key there too, rulings 2026-11-15).
 */
export function nameFaint(p: NameParamsLike, fade: number): boolean {
  if (fade === 1 && (p.lets ?? "")[0] === "O" && asked(p).v === 0) return true;
  // (dc-r8-gate2-discriminating-level: a say level where reading across gives the right name says no more by its solve)
  if (p.goal === "say" && readsAcrossAll(p)) return true;
  return p.goal === "find" && vertexNamePick(p) < 0;
}
export function nameDifficulty(p: NameParamsLike): number {
  return Math.min(1, (p.goal === "find" ? 0.35 : 0.4) + ((p.ask ?? 0) >= 3 ? 0.15 : 0) + ((p.ask ?? 0) === 2 ? 0.1 : 0) + ((p.lets ?? "O")[0] !== "O" ? 0.1 : 0));
}
