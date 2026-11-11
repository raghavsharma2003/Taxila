// Nazariya · tri (r7 nazariya2: c6-maths-ch06-t03 area of a triangle). A triangle of cloth (a tent's side) lies on the
// floor plot with its corners on grid points and its base along a grid line. The floor tiles are the unit squares, so the
// cloth's area is measured in the same tiles the floor and fence game lays.
//   box   — lay the rectangle the cloth was cut from: its base is one side of the rectangle and its top corner touches
//           the opposite side, so the cloth is exactly half of it (s1). A right-angled cloth at every level.
//   match — lay a floor (one piece, anywhere on the plot) with exactly as much floor as the cloth (s2): b × h ÷ 2 tiles.
//           At fade 1 the turned copy is drawn, dashed, completing the rectangle (the half SEEN); later fades draw none.
//   more  — tent A stands with its top corner straight above one end of the base. Move tent B's top corner (same base)
//           so B's cloth is MORE than A's (s3): only the height counts; sliding the corner along A's top line keeps the
//           cloth exactly the same (the kit remediation: "a triangle whose top corner slides along the top side while its
//           area readout stays fixed").
// Mal-rules (kit c6-maths-ch06-t03): lxb (a floor of b × h tiles: the rectangle's floor, not halved) · slant-side (the
// slanted side used as a side: a slant × leg ÷ 2 floor in match; a rectangle with the slant as one side in box) ·
// shape-looks (more: B's corner slid along A's top line, "the middle one looks bigger").
// Not here: an obtuse triangle's outside height is not in the kit's skills, so no level asks for it (a corner B moves past
// the end of the base still holds base × height ÷ 2, and the law says so).
import type { Candidate, Facts, FamilyLogic, GenRequest, Moment, NazariyaAct, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { mulberry32 } from "../../core/rng.ts";
import { gradeLevel, popUndo, pushUndo } from "../../core/replay.ts";
import { boxActs, built, connected, DECISIVE_REFUSALS, inside, lvl, mom, plotOf, rectCells, solidBox, zeros, type NzState, type Plot } from "./grid.ts";

export type TriGoal = "box" | "match" | "more";
/** The cloth: base from grid point (x0, zb) to (x1, zb), the top corner at grid point (xa, za), za < zb (z grows down the plot). */
export interface Tri { x0: number; x1: number; zb: number; xa: number; za: number }
export interface TriParams extends Plot { goal: TriGoal; tri: Tri }
export interface TriState extends Omit<NzState, "prev"> { prev: TriState | null; pt: [number, number] | null }
export const TRI_MAL = ["lxb", "slant-side", "shape-looks"] as const;

export const baseOf = (t: Tri) => t.x1 - t.x0;
export const heightOf = (t: Tri) => t.zb - t.za;
/** twice the cloth's area (whole numbers only) */
export const area2 = (t: Tri) => baseOf(t) * heightOf(t);
export const isRight = (t: Tri) => t.xa === t.x0 || t.xa === t.x1;
/** the slanted side of a right-angled cloth when it is a whole number of units (3-4-5, 6-8-10), else null */
export function slantOf(t: Tri): number | null {
  if (!isRight(t)) return null;
  const s = Math.round(Math.hypot(baseOf(t), heightOf(t)));
  return s * s === baseOf(t) ** 2 + heightOf(t) ** 2 ? s : null;
}
/** match: the floor each belief lays (null when it says no whole number, or the same number as the key or another belief) */
export function matchMal(t: Tri, mal: string): number | null {
  const key = area2(t) / 2, s = slantOf(t), b = baseOf(t), h = heightOf(t);
  const cands = (m: string): number[] => (m === "lxb" ? [b * h] : m === "slant-side" && s !== null ? [s * h / 2, s * b / 2].filter((v) => Number.isInteger(v)) : []);
  const mine = cands(mal).filter((v) => v !== key && v >= 2);
  const others = TRI_MAL.filter((m) => m !== mal).flatMap(cands);
  return mine.find((v) => !others.includes(v)) ?? null;
}
/** box: the rectangle (sides along x and z) a belief lays, or null. slant-side: the slant as one side, either way round. */
export function boxMal(p: TriParams, mal: string): [number, number] | null {
  const s = slantOf(p.tri), b = baseOf(p.tri), h = heightOf(p.tri);
  if (mal !== "slant-side" || s === null) return null;
  const fits = (a: number, c: number) => a <= p.w && c <= p.d;
  for (const [a, c] of [[s, h], [b, s], [h, s], [s, b]] as [number, number][]) if (fits(a, c) && !(a === b && c === h)) return [a, c];
  return null;
}
/** box: the cells of the rectangle the cloth is half of */
export const boxCells = (p: TriParams) => rectCells(p, p.tri.x0, p.tri.za, p.tri.x1 - 1, p.tri.zb - 1) ?? [];
/** a point strictly inside the cloth (barycentric signs) */
function insideTri(t: Tri, x: number, z: number): boolean {
  const A: [number, number] = [t.x0, t.zb], B: [number, number] = [t.x1, t.zb], C: [number, number] = [t.xa, t.za];
  const cr = (p: [number, number], q: [number, number]) => (q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0]);
  const d1 = cr(A, B), d2 = cr(B, C), d3 = cr(C, A);
  return (d1 > 0 && d2 > 0 && d3 > 0) || (d1 < 0 && d2 < 0 && d3 < 0);
}
/** cells under the cloth: whole (every sample inside) and touched (any sample inside); a child counting only these is
 *  counting without the half (the shortcut search) */
export function underCloth(p: Plot, t: Tri): { whole: number; touched: number } {
  let whole = 0, touched = 0;
  const K = 6;
  for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) {
    let n = 0;
    for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) if (insideTri(t, x + (i + 0.5) / K, z + (j + 0.5) / K)) n++;
    if (n === K * K) whole++;
    if (n > 0) touched++;
  }
  return { whole, touched };
}
/** more: twice B's cloth with its top corner at (x, z) on A's base */
const area2At = (t: Tri, z: number) => baseOf(t) * (t.zb - z);

function validate(raw: unknown): TriParams | null {
  const r = raw as Partial<TriParams> | null, plot = plotOf(raw);
  if (!r || !plot || plot.hmax !== 1 || plot.lock.some((v) => v) || plot.base.some((v) => v)) return null;
  if (r.goal !== "box" && r.goal !== "match" && r.goal !== "more") return null;
  const q = r.tri as Partial<Tri> | undefined;
  if (!q) return null;
  const t: Tri = { x0: Number(q.x0), x1: Number(q.x1), zb: Number(q.zb), xa: Number(q.xa), za: Number(q.za) };
  if (![t.x0, t.x1, t.zb, t.xa, t.za].every((v) => Number.isInteger(v))) return null;
  if (t.x0 < 0 || t.x1 > plot.w || t.x1 - t.x0 < 2 || t.za < 0 || t.zb > plot.d || t.zb - t.za < 2 || t.xa < 0 || t.xa > plot.w) return null;
  if (r.goal !== "match" && !isRight(t)) return null;          // box and more: a right-angled cloth (s1; tent A)
  if (r.goal === "match" && (area2(t) % 2 || t.xa < t.x0 || t.xa > t.x1)) return null;   // a whole number of tiles; the top corner over the base
  if (r.goal === "more" && t.za < 1) return null;               // room above A for a taller B
  return { ...plot, goal: r.goal, tri: t };
}

const mo = (kind: Moment["kind"], seq: number, f: Facts, mis?: string) => mom(kind, seq, f, mis);
function initTri(p: Plot): TriState { return { h: [...p.base], named: null, predicted: null, checks: 0, done: false, acts: 0, prev: null, depth: 0, pt: null }; }
const commitT = (s: TriState, next: Partial<TriState>): TriState => ({ ...pushUndo<TriState>(s, { ...s, ...next, acts: s.acts } as TriState), acts: s.acts + 1 });
type Out = { state: TriState; moments: Moment[]; refused?: string };

function check(level: PlayLevel<TriParams>, s: TriState, seq: number): Out {
  const p = level.params, t = p.tri, bumped = { ...s, acts: s.acts + 1 }, has = (m: string) => m in level.mal;
  const won = (f: Facts): Out => ({ state: commitT(s, { done: true }), moments: [mo("solved", seq, f)] });
  if (p.goal === "more") {
    if (!s.pt) return { state: bumped, moments: [mo("law_refused", seq, { why: "set_the_corner" })], refused: "set_first" };
    const [x, z] = s.pt, mine = area2At(t, z), theirs = area2(t), f: Facts = { base: baseOf(t), height_a: heightOf(t), height_b: t.zb - z };
    if (mine > theirs) return won({ ...f, cloth_a: theirs / 2, cloth_b: mine / 2 });
    if (mine === theirs && x !== t.xa && has("shape-looks")) return { state: bumped, moments: [mo("misconception_consequence", seq, { ...f, cloth_same: "yes" }, "shape-looks")], refused: "mismatch" };
    return { state: bumped, moments: [mo("law_refused", seq, { ...f, why: mine === theirs ? "same_cloth" : "less_cloth" })], refused: "mismatch" };
  }
  const tiles = built(p, s.h);
  if (tiles === 0) return { state: bumped, moments: [mo("law_refused", seq, { why: "build_first" })], refused: "build_first" };
  if (p.goal === "box") {
    const box = solidBox(p, s.h), b = baseOf(t), h = heightOf(t);
    if (!box) return { state: bumped, moments: [mo("law_refused", seq, { tiles, why: "rectangle" })], refused: "rectangle" };
    const f: Facts = { tiles, rect: `${box.a} by ${box.b}` };
    if (box.a === b && box.b === h && box.x0 === t.x0 && box.z0 === t.za) return won({ ...f, cloth_half_of: tiles });
    const mal = boxMal(p, "slant-side");
    if (mal && has("slant-side") && ((box.a === mal[0] && box.b === mal[1]) || (box.a === mal[1] && box.b === mal[0])) && !(box.a === b && box.b === h) && !(box.a === h && box.b === b)) {
      return { state: bumped, moments: [mo("misconception_consequence", seq, f, "slant-side")], refused: "mismatch" };
    }
    const off = Math.abs(box.a - b) + Math.abs(box.b - h);
    const why = off === 0 ? "round_the_cloth" : box.a === h && box.b === b ? "turned" : "box_size";
    return { state: bumped, moments: [mo(off === 1 ? "near_miss" : "law_refused", seq, { ...f, why })], refused: "mismatch" };
  }
  // match: one piece of floor, as much as the cloth
  if (!connected(p, s.h)) return { state: bumped, moments: [mo("law_refused", seq, { tiles, why: "one_floor" })], refused: "one_floor" };
  const key = area2(t) / 2;
  if (tiles === key) return won({ tiles, cloth: key, half_of: area2(t) });
  for (const m of ["lxb", "slant-side"]) if (has(m) && matchMal(t, m) === tiles) return { state: bumped, moments: [mo("misconception_consequence", seq, { tiles }, m)], refused: "mismatch" };
  return { state: bumped, moments: [mo(Math.abs(tiles - key) === 1 ? "near_miss" : "law_refused", seq, { tiles, why: tiles > key ? "more_than_cloth" : "less_than_cloth" })], refused: "mismatch" };
}

function apply(level: PlayLevel<TriParams>, s: TriState, act: NazariyaAct, seq: number): Out {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: TriState) => ({ ...st, acts: s.acts + 1 });
  if (!act || typeof act !== "object") return { state: bump(s), moments: [], refused: "bad_act" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mo("first_act", seq, { act: act.kind }));
  const tiles = act.kind === "place" || act.kind === "remove" || act.kind === "layer" || act.kind === "clear";
  if (tiles && p.goal === "more") { out.push(mo("law_refused", seq, { why: "move_the_corner" })); return { state: bump(s), moments: out, refused: "no_tiles_here" }; }
  const laid = (h: number[], why: string): Out => { const next = commitT(s, { h }); out.push(mo("progress", seq, { tiles: built(p, h), act: why })); return { state: next, moments: out }; };
  switch (act.kind) {
    case "place": case "remove": {
      const x = Number(act.x), z = Number(act.z);
      if (!inside(p, x, z)) return { state: bump(s), moments: out, refused: "bad_cell" };
      const i = z * p.w + x, h = [...s.h];
      if (act.kind === "place") { if (h[i] >= 1) { out.push(mo("law_refused", seq, { why: "tile_there" })); return { state: bump(s), moments: out, refused: "too_high" }; } h[i] = 1; return laid(h, "place"); }
      if (h[i] <= 0) return { state: bump(s), moments: out, refused: "empty" };
      h[i] = 0; return laid(h, "remove");
    }
    case "layer": case "clear": {
      const cells = rectCells(p, Number(act.x0), Number(act.z0), Number(act.x1), Number(act.z1));
      if (!cells) return { state: bump(s), moments: out, refused: "bad_rect" };
      const h = [...s.h]; let n = 0;
      for (const i of cells) { if (act.kind === "layer" && h[i] < 1) { h[i] = 1; n++; } if (act.kind === "clear" && h[i] > 0) { h[i] = 0; n++; } }
      if (!n) { out.push(mo("law_refused", seq, { why: act.kind === "layer" ? "nothing_to_lay" : "nothing_to_clear" })); return { state: bump(s), moments: out, refused: "no_change" }; }
      return laid(h, act.kind);
    }
    case "apex": {
      if (p.goal !== "more") return { state: bump(s), moments: out, refused: "no_corner_here" };
      const x = Number(act.x), z = Number(act.z);
      if (!Number.isInteger(x) || !Number.isInteger(z) || x < 0 || z < 0 || x > p.w || z > p.d) return { state: bump(s), moments: out, refused: "bad_point" };
      if (z >= p.tri.zb) { out.push(mo("law_refused", seq, { why: "above_the_base" })); return { state: bump(s), moments: out, refused: "below_base" }; }
      if (s.pt && s.pt[0] === x && s.pt[1] === z) return { state: bump(s), moments: out, refused: "no_change" };
      const next = commitT(s, { pt: [x, z] });
      out.push(mo("progress", seq, { act: "corner", height_b: p.tri.zb - z }));
      return { state: next, moments: out };
    }
    case "check": {
      const r = check(level, { ...s, checks: s.checks + 1 }, seq);
      return { ...r, moments: [...out, ...r.moments] };
    }
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}

const layAll = (p: Plot, n: number): NazariyaAct[] => {
  // n tiles as one piece from the far corner of the plot: full rows of w, then the rest
  const acts: NazariyaAct[] = [], full = Math.floor(n / p.w), rest = n % p.w;
  if (full) acts.push({ kind: "layer", x0: 0, z0: p.d - full, x1: p.w - 1, z1: p.d - 1 });
  if (rest) acts.push({ kind: "layer", x0: 0, z0: p.d - full - 1, x1: rest - 1, z1: p.d - full - 1 });
  return acts;
};
/** n tiles as a near-square block at the plot's free corner (a floor a child lays), else rows */
function floorActs(p: TriParams, n: number): NazariyaAct[] {
  for (let a = Math.ceil(Math.sqrt(n)); a <= p.w; a++) if (n % a === 0 && n / a <= p.d) return [...boxActs({ x0: p.w - a, z0: p.d - n / a, a, b: n / a, hgt: 1 })];
  return layAll(p, n);
}
function solve(level: PlayLevel<TriParams>): NazariyaAct[] | null {
  const p = level.params, t = p.tri;
  if (p.goal === "more") return [{ kind: "apex", x: Math.round((t.x0 + t.x1) / 2), z: t.za - 1 }, { kind: "check" }];
  if (p.goal === "box") return [{ kind: "layer", x0: t.x0, z0: t.za, x1: t.x1 - 1, z1: t.zb - 1 }, { kind: "check" }];
  const n = area2(t) / 2;
  return n <= p.w * p.d ? [...floorActs(p, n), { kind: "check" }] : null;
}
/** Without the half: count only the whole tiles under the cloth, every tile it touches, the base and height added, the
 *  whole plot (match); the cells it touches as the box, the whole plot (box); slide A's corner or keep it (more). None may
 *  win. */
function shortcut(level: PlayLevel<TriParams>): NazariyaAct[] | null {
  const p = level.params, t = p.tri;
  if (p.goal === "more") {
    for (const x of [Math.round((t.x0 + t.x1) / 2), t.xa, t.xa === t.x0 ? t.x1 : t.x0]) if (area2At(t, t.za) > area2(t)) return [{ kind: "apex", x, z: t.za }, { kind: "check" }];
    return null;
  }
  if (p.goal === "box") {
    // the tiles the cloth touches, laid as they are: a rectangle only if the cloth fills its box (never for a triangle)
    const h = zeros(p.w * p.d);
    for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) {
      let any = false; for (let i = 0; i < 4 && !any; i++) for (let j = 0; j < 4 && !any; j++) any = insideTri(t, x + (i + 0.5) / 4, z + (j + 0.5) / 4);
      if (any) h[z * p.w + x] = 1;
    }
    const b = solidBox(p, h);
    if (b && b.a === baseOf(t) && b.b === heightOf(t) && b.x0 === t.x0 && b.z0 === t.za) return [{ kind: "layer", x0: b.x0, z0: b.z0, x1: b.x0 + b.a - 1, z1: b.z0 + b.b - 1 }, { kind: "check" }];
    if (baseOf(t) === p.w && heightOf(t) === p.d) return [{ kind: "layer", x0: 0, z0: 0, x1: p.w - 1, z1: p.d - 1 }, { kind: "check" }];
    return null;
  }
  const key = area2(t) / 2, u = underCloth(p, t);
  for (const n of [u.whole, u.touched, baseOf(t) + heightOf(t), p.w * p.d]) if (n === key) return [...floorActs(p, n), { kind: "check" }];
  return null;
}
function malActs(level: PlayLevel<TriParams>, mal: string): NazariyaAct[] | null {
  const p = level.params, t = p.tri;
  if (p.goal === "more") {
    if (mal !== "shape-looks") return null;
    const mid = Math.round((t.x0 + t.x1) / 2);
    return mid === t.xa ? null : [{ kind: "apex", x: mid, z: t.za }, { kind: "check" }];
  }
  if (p.goal === "box") {
    const r = boxMal(p, mal);
    return r ? [...boxActs({ x0: p.w - r[0], z0: p.d - r[1], a: r[0], b: r[1], hgt: 1 }), { kind: "check" }] : null;
  }
  const n = matchMal(t, mal);
  return n !== null && n <= p.w * p.d ? [...floorActs(p, n), { kind: "check" }] : null;
}

const JITTER = 0.35;
const goal0 = (req: GenRequest): TriGoal => (req.goal as TriGoal) ?? "match";
function generate(req: GenRequest): Candidate<TriParams>[] {
  // match also lays cloths whose top corner is anywhere over the base (s3), beside the right-angled ones (s2); `any: false`
  // keeps them right-angled. (audit GAMES-02: this was a second coverage entry, { any: true }, under the same key as the
  // first, so entryByKey always took the first and the any-apex cloths were never served.)
  const g = req.grammar as { plot?: [number, number]; any?: boolean };
  const any = goal0(req) === "match" && g.any !== false;
  const goal = goal0(req);
  const rnd = mulberry32(req.seed), out: Candidate<TriParams>[] = [];
  const [w, d] = g.plot ?? [12, 9];
  const plot: Plot = { w, d, hmax: 1, base: zeros(w * d), lock: zeros(w * d) };
  const maxB = Math.min(w - 1, 8), maxH = Math.min(d - (goal === "more" ? 2 : 1), 8);
  for (let b = 2; b <= maxB; b++) for (let h = 2; h <= maxH; h++) {
    const triple = Number.isInteger(Math.hypot(b, h));
    if (!triple && rnd() > 0.45) continue;
    for (const right of any ? [0, 1, 2] : [0, 1]) {
      const x0 = Math.floor(rnd() * (w - b + 1)), zb = (goal === "more" ? h + 1 : h) + Math.floor(rnd() * (d - h - (goal === "more" ? 1 : 0) + 1));
      if (zb > d) continue;
      const x1 = x0 + b, za = zb - h;
      const xa = right === 2 ? x0 + 1 + Math.floor(rnd() * (b - 1)) : right ? x1 : x0;
      const params: TriParams = { ...plot, goal, tri: { x0, x1, zb, xa, za } };
      if (!validate(params)) continue;
      // a seeded nudge (± JITTER / 2): without it the picker's nearest-to-band triangle was the same for every child (3-4-5)
      const diff = Math.max(0, Math.min(1, (b * h) / 70 + (goal === "more" ? 0.15 : goal === "match" ? 0.1 : 0) + (right === 2 ? 0.1 : 0) + (rnd() - 0.5) * JITTER));
      out.push({ signature: `${goal}:${b}x${h}:${xa - x0}`, difficulty: diff, level: lvl(req, "tri", goal, params, `${goal}-${b}x${h}-${right}-${x0}-${za}`, "khand") });
    }
  }
  return out;
}

function facts(level: PlayLevel<TriParams>, s: TriState): Facts {
  const p = level.params, t = p.tri, f: Facts = { goal: p.goal, base: baseOf(t) };
  if (isRight(t)) f.upright_side = heightOf(t);
  const sl = slantOf(t); if (sl !== null) f.slant_side = sl;
  if (p.goal === "more") { f.height_a = heightOf(t); if (s.pt) f.height_b = t.zb - s.pt[1]; }
  else if (level.fade === 1 || s.checks > 0 || s.done) f.tiles = built(p, s.h);
  if (s.checks) f.checks = s.checks;
  if (s.done) { f.done = "yes"; f.cloth = area2(t) / 2; }
  return f;
}
function board(level: PlayLevel<TriParams>, s: TriState) {
  const p = level.params, t = p.tri, sl = slantOf(t);
  const sides = `base ${baseOf(t)}${isRight(t) ? `, upright ${heightOf(t)}` : ""}${sl !== null ? `, slant ${sl}` : ""}`;
  if (p.goal === "more") return { title: "A taller tent", lines: [`tent A: ${sides}`, `tent B corner: ${s.pt ? `${s.pt[0]}, ${s.pt[1]}` : "?"}`] };
  return { title: p.goal === "box" ? "The cloth's rectangle" : "A floor like the cloth", lines: [`cloth: ${sides}`, `tiles laid: ${built(p, s.h)}`] };
}

export const triLogic: FamilyLogic<TriParams, TriState, NazariyaAct> = {
  family: "nazariya", modes: ["tri"], malRules: TRI_MAL,
  // more: one corner placed above A's top line wins (a lucky tap 26 %, games audit GAMES-03): its correct enters at CHANCE_WEIGHT
  oneDecision: ["more"],
  validate(level) {
    if (!level || level.family !== "nazariya" || level.mode !== "tri") return null;
    const p = validate(level.params);
    return p && level.goal === p.goal ? ({ ...level, params: p } as PlayLevel<TriParams>) : null;
  },
  init: (level) => initTri(level.params),
  apply, goalMet: (_l, s) => s.done,
  generate, solve, shortcut, malActs,
  grade(level: PlayLevel<TriParams>, acts: PlayActEnvelope<NazariyaAct>[]): PlayGrade {
    return gradeLevel(triLogic, level, acts, { decisiveRefusals: DECISIVE_REFUSALS, final: true });
  },
  facts, board,
};
/** her micro-lines never say the cloth's area (match) before the child lays it */
export const triHidden = (p: TriParams): number[] => (p.goal === "match" ? [area2(p.tri) / 2] : p.goal === "box" ? [area2(p.tri)] : []);
