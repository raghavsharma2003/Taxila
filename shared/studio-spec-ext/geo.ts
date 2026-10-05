// geo-forge@1 — Geo Forge (VALUES-100 V3.1: shapes, perimeter and area, triangles and their types, quadrilaterals,
// parallel and perpendicular lines, constructions and equidistant points, angles, rigidity; c4 ch1/ch6, c5 ch7/ch11,
// c6 ch2/ch6/ch8, c7 ch5/ch7/ch9/ch14).
// A pin-board under a blueprint clock. The child BUILDS: taps pins to place vertices (tapping the first pin closes the
// shape), or two pins for a line, or picks three sticks, or adds braces to a wobbling frame. Every predicate is code
// over the lattice coordinates (shoelace area, exact squared lengths, dot and cross products, a rigidity-matrix rank),
// so "is this a parallelogram" is never a model's opinion.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

export const GEO_COLS = 13, GEO_ROWS = 7;
export type P2 = [number, number];
const Pin = z.tuple([z.number().int().min(0).max(GEO_COLS - 1), z.number().int().min(0).max(GEO_ROWS - 1)]);
const Ch = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("polygon"), sides: z.number().int().min(3).max(8) }),
  z.object({ kind: z.literal("perimeter"), value: z.number().int().min(4).max(60) }),
  z.object({ kind: z.literal("area"), value: z.number().min(0.5).max(72).refine((v) => Number.isInteger(v * 2)), shape: z.enum(["any", "triangle", "rectangle"]) }),
  z.object({ kind: z.literal("triangle"), type: z.enum(["right", "isosceles", "scalene", "obtuse", "acute"]) }),
  z.object({ kind: z.literal("quad"), type: z.enum(["square", "rectangle", "parallelogram", "rhombus", "trapezium", "kite"]) }),
  z.object({ kind: z.literal("sticks"), sticks: z.array(z.number().int().min(1).max(12)).min(3).max(6), want: z.enum(["triangle", "no-triangle"]) }),
  z.object({ kind: z.literal("rigid"), frame: z.array(Pin).min(4).max(6) }),
  z.object({ kind: z.literal("parallel"), line: z.tuple([Pin, Pin]), through: Pin }),
  z.object({ kind: z.literal("perpendicular"), line: z.tuple([Pin, Pin]), through: Pin }),
  z.object({ kind: z.literal("equidistant"), points: z.array(Pin).min(2).max(3) }),
  z.object({ kind: z.literal("angle"), deg: z.number().int().min(10).max(170), tol: z.number().min(1).max(10) }),
]);
export type GeoCh = z.infer<typeof Ch>;
const GF_STRINGS = { round: "Round", built: "built", check: "CHECK", undo: "UNDO", coach: "Tap pins to place corners; tap the first pin to close", runDone: "Blueprints done", perimeter: "perimeter", area: "area", units: "units", sq: "sq units", polygon: "sides", sticks: "Pick three sticks", rigid: "Brace it: it must not wobble", parallel: "Through the dot, parallel to the line", perpendicular: "Through the dot, at right angles", equidistant: "Place a pin the same distance from each dot", angle: "Make an angle of", right: "right-angled triangle", isosceles: "isosceles triangle", scalene: "scalene triangle", obtuse: "obtuse-angled triangle", acute: "acute-angled triangle", square: "square", rectangle: "rectangle", parallelogram: "parallelogram", rhombus: "rhombus", trapezium: "trapezium", kite: "kite", any: "shape", triangle: "triangle", make: "Make a", withArea: "with area", withPerim: "with perimeter", noTriangle: "Pick three that CANNOT close", wobbles: "WOBBLES", holds: "HOLDS", closes: "CLOSES", gap: "GAP", time: "time" };
const GfRound = z.object({ title: z.string().min(1).max(22), sub: z.string().max(40), time: z.number().min(20).max(120), challenges: z.array(Ch).min(1).max(4), ...TargetsField });
export type GfRoundT = z.infer<typeof GfRound>;
export const GeoSchema = z.object({ archetype: z.literal("geo-forge@1"), ...EnvelopeExt, strings: stringsSchema(GF_STRINGS, 56), title: z.string().min(1).max(36), rounds: z.array(GfRound).min(1).max(4) });
export type GeoSpec = z.infer<typeof GeoSchema>;

// ── exact lattice geometry
const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const cross = (a: P2, b: P2) => a[0] * b[1] - a[1] * b[0], dot = (a: P2, b: P2) => a[0] * b[0] + a[1] * b[1], d2 = (a: P2, b: P2) => dot(sub(a, b), sub(a, b));
export function area2(pts: P2[]): number { let s = 0; for (let i = 0; i < pts.length; i++) s += cross(pts[i], pts[(i + 1) % pts.length]); return Math.abs(s); }
function segX(a: P2, b: P2, c: P2, d: P2): boolean { const o = (p: P2, q: P2, r: P2) => Math.sign(cross(sub(q, p), sub(r, p))); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; }
/** A simple polygon: ≥ 3 distinct vertices, no zero-length or collinear-consecutive edges, no self-crossing. */
export function simple(pts: P2[]): boolean {
  const n = pts.length; if (n < 3 || new Set(pts.map((p) => p.join(","))).size !== n) return false;
  for (let i = 0; i < n; i++) if (cross(sub(pts[(i + 1) % n], pts[i]), sub(pts[(i + 2) % n], pts[(i + 1) % n])) === 0) return false;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue; if (segX(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return false; }
  return area2(pts) > 0;
}
export const rectilinear = (pts: P2[]) => pts.every((p, i) => { const q = pts[(i + 1) % pts.length]; return p[0] === q[0] || p[1] === q[1]; });
export const perimeterRect = (pts: P2[]) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]); }, 0);
export function triType(pts: P2[]): Record<string, boolean> {
  const [a, b, c] = pts, s = [d2(b, c), d2(a, c), d2(a, b)].sort((x, y) => x - y);
  return { right: s[0] + s[1] === s[2], obtuse: s[0] + s[1] < s[2], acute: s[0] + s[1] > s[2], isosceles: s[0] === s[1] || s[1] === s[2], scalene: s[0] !== s[1] && s[1] !== s[2] };
}
export function quadType(p: P2[]): Record<string, boolean> {
  const e = [0, 1, 2, 3].map((i) => sub(p[(i + 1) % 4], p[i])), L = e.map((v) => dot(v, v));
  const par = (u: P2, v: P2) => cross(u, v) === 0, perp = (u: P2, v: P2) => dot(u, v) === 0;
  const pp = [par(e[0], e[2]), par(e[1], e[3])], parallelogram = pp[0] && pp[1];
  const rect = parallelogram && perp(e[0], e[1]), rhombus = parallelogram && L.every((x) => x === L[0]);
  const kite = !parallelogram && ((L[0] === L[1] && L[2] === L[3]) || (L[1] === L[2] && L[3] === L[0]));
  return { parallelogram, rectangle: rect, rhombus, square: rect && rhombus, trapezium: (pp[0] || pp[1]) && !parallelogram, kite: kite || rhombus };
}
export const canTriangle = (a: number, b: number, c: number) => a + b > c && a + c > b && b + c > a;
/** Generic infinitesimal rigidity in the plane: rank of the rigidity matrix == 2V − 3 (evaluated at the pin layout). */
export function rigid(pts: P2[], edges: [number, number][]): boolean {
  const V = pts.length, rows = edges.map(([i, j]) => { const r = new Array(2 * V).fill(0), dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1]; r[2 * i] = dx; r[2 * i + 1] = dy; r[2 * j] = -dx; r[2 * j + 1] = -dy; return r; });
  let rank = 0; const m = rows.map((r) => [...r]);
  for (let c = 0; c < 2 * V && rank < m.length; c++) {
    let piv = -1; for (let r = rank; r < m.length; r++) if (Math.abs(m[r][c]) > 1e-9) { piv = r; break; }
    if (piv < 0) continue; [m[rank], m[piv]] = [m[piv], m[rank]];
    for (let r = 0; r < m.length; r++) if (r !== rank && Math.abs(m[r][c]) > 1e-9) { const f = m[r][c] / m[rank][c]; for (let k = c; k < 2 * V; k++) m[r][k] -= f * m[rank][k]; }
    rank++;
  }
  return rank >= 2 * V - 3;
}
export function angleAt(o: P2, a: P2, b: P2): number { const u = sub(a, o), v = sub(b, o); const c = dot(u, v) / Math.sqrt(dot(u, u) * dot(v, v)); return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI; }
/** Grade one challenge from the child's raw construction. */
export function judgeGeo(ch: GeoCh, v: { pts?: P2[]; pick?: number[]; edges?: [number, number][] }): { ok: boolean; detail: string } {
  const pts = (v.pts ?? []).filter((p) => Array.isArray(p) && p.length === 2 && p.every((x) => Number.isInteger(x) && x >= 0) && p[0] < GEO_COLS && p[1] < GEO_ROWS) as P2[];
  switch (ch.kind) {
    case "polygon": return { ok: simple(pts) && pts.length === ch.sides, detail: `${pts.length} corners${simple(pts) ? "" : ", not a simple shape"}` };
    case "perimeter": { const ok = simple(pts) && rectilinear(pts) && perimeterRect(pts) === ch.value; return { ok, detail: rectilinear(pts) ? `perimeter ${perimeterRect(pts)}` : "sides must run along the grid" }; }
    case "area": { const shapeOk = ch.shape === "any" ? true : ch.shape === "triangle" ? pts.length === 3 : pts.length === 4 && quadType(pts).rectangle; const a = area2(pts) / 2; return { ok: simple(pts) && shapeOk && a === ch.value, detail: `area ${a}` }; }
    case "triangle": { if (pts.length !== 3 || !simple(pts)) return { ok: false, detail: "not a triangle" }; const t = triType(pts); return { ok: t[ch.type], detail: Object.keys(t).filter((k) => t[k]).join(", ") }; }
    case "quad": { if (pts.length !== 4 || !simple(pts)) return { ok: false, detail: "not a quadrilateral" }; const q = quadType(pts); return { ok: q[ch.type], detail: Object.keys(q).filter((k) => q[k]).join(", ") || "a general quadrilateral" }; }
    case "sticks": { const p = [...new Set(v.pick ?? [])].filter((i) => Number.isInteger(i) && i >= 0 && i < ch.sticks.length); if (p.length !== 3) return { ok: false, detail: "pick three" }; const [a, b, c] = p.map((i) => ch.sticks[i]); const t = canTriangle(a, b, c); return { ok: ch.want === "triangle" ? t : !t, detail: t ? "they close" : `${Math.min(a + b, a + c, b + c)} ≤ ${Math.max(a, b, c)}: a gap` }; }
    case "rigid": { const n = ch.frame.length, base: [number, number][] = ch.frame.map((_, i) => [i, (i + 1) % n]); const extra = (v.edges ?? []).filter((e) => Array.isArray(e) && e.length === 2 && e.every((x) => Number.isInteger(x) && x >= 0 && x < n) && e[0] !== e[1]); const ok = rigid(ch.frame as P2[], [...base, ...extra]); return { ok, detail: `${extra.length} braces` }; }
    case "parallel": case "perpendicular": {
      if (pts.length !== 2 || d2(pts[0], pts[1]) === 0) return { ok: false, detail: "two pins" };
      const dl = sub(ch.line[1], ch.line[0]), dm = sub(pts[1], pts[0]), through = pts.some((p) => p[0] === ch.through[0] && p[1] === ch.through[1]) || cross(sub(ch.through, pts[0]), dm) === 0;
      const rel = ch.kind === "parallel" ? cross(dl, dm) === 0 : dot(dl, dm) === 0;
      return { ok: rel && through, detail: !through ? "misses the dot" : rel ? ch.kind : "not " + ch.kind };
    }
    case "equidistant": { if (pts.length !== 1) return { ok: false, detail: "one pin" }; const ds = ch.points.map((q) => d2(pts[0], q as P2)); return { ok: ds.every((x) => x === ds[0]), detail: ds.map((x) => Math.sqrt(x).toFixed(2)).join(" / ") }; }
    case "angle": { if (pts.length !== 3) return { ok: false, detail: "arm, corner, arm" }; const a = angleAt(pts[1], pts[0], pts[2]); return { ok: Math.abs(a - ch.deg) <= ch.tol, detail: `${a.toFixed(1)}°` }; }
  }
}
/** A challenge is admissible only if it can be done on this board (searched exhaustively where cheap). */
export function feasible(ch: GeoCh): boolean {
  if (ch.kind === "perimeter") return ch.value % 2 === 0 && ch.value <= 2 * (GEO_COLS - 1 + GEO_ROWS - 1);
  if (ch.kind === "area") return ch.value <= (GEO_COLS - 1) * (GEO_ROWS - 1);
  if (ch.kind === "sticks") { const s = ch.sticks; let any = false; for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) for (let k = j + 1; k < s.length; k++) if (canTriangle(s[i], s[j], s[k]) === (ch.want === "triangle")) any = true; return any; }
  if (ch.kind === "rigid") return simple(ch.frame as P2[]) && !rigid(ch.frame as P2[], ch.frame.map((_, i) => [i, (i + 1) % ch.frame.length] as [number, number]));
  if (ch.kind === "parallel" || ch.kind === "perpendicular") { const d = sub(ch.line[1], ch.line[0]); return d2(ch.line[0], ch.line[1]) > 0 && !(cross(sub(ch.through, ch.line[0]), d) === 0); }
  if (ch.kind === "equidistant") { for (let c = 0; c < GEO_COLS; c++) for (let r = 0; r < GEO_ROWS; r++) { const ds = ch.points.map((q) => d2([c, r], q as P2)); if (ds.every((x) => x === ds[0]) && !ch.points.some((q) => q[0] === c && q[1] === r)) return true; } return false; }
  if (ch.kind === "angle") { for (let a = 1; a < GEO_COLS; a++) for (let b = -(GEO_ROWS - 1); b < GEO_ROWS; b++) { const ang = (Math.atan2(b, a) * 180) / Math.PI; if (Math.abs(Math.abs(ang) - ch.deg) <= ch.tol || Math.abs(180 - Math.abs(ang) - ch.deg) <= ch.tol) return true; } return false; }
  return true;
}
const gfDefault: GeoSpec = {
  archetype: "geo-forge@1", skills: ["c6-maths-ch06-t03", "c7-maths-ch07-t01", "c6-maths-ch06-t01"], lang: "en", strings: { ...GF_STRINGS }, title: "Geo Forge",
  rounds: [
    { title: "Blueprints", sub: "build to the spec", time: 60, challenges: [{ kind: "perimeter", value: 14 }, { kind: "area", value: 6, shape: "triangle" }, { kind: "quad", type: "parallelogram" }] },
    { title: "Can they close?", sub: "the longest stick decides", time: 45, challenges: [{ kind: "sticks", sticks: [2, 3, 6, 4, 9], want: "triangle" }, { kind: "sticks", sticks: [3, 4, 8, 5], want: "no-triangle" }] },
    { title: "Make it rigid", sub: "squares wobble, triangles hold", time: 45, challenges: [{ kind: "rigid", frame: [[3, 1], [7, 1], [7, 5], [3, 5]] }] },
  ],
};
function pin(v: unknown): P2 | null { return Array.isArray(v) && v.length === 2 && Number.isInteger(v[0]) && Number.isInteger(v[1]) && v[0] >= 0 && v[0] < GEO_COLS && v[1] >= 0 && v[1] < GEO_ROWS ? [v[0], v[1]] : null; }
function repairCh(c: unknown, r: string[]): GeoCh | null {
  if (!isObj(c)) return null;
  const kind = oneOf(c.kind, ["polygon", "perimeter", "area", "triangle", "quad", "sticks", "rigid", "parallel", "perpendicular", "equidistant", "angle"] as const, "polygon", "kind", r);
  let ch: GeoCh | null = null;
  if (kind === "polygon") ch = { kind, sides: num(c.sides, 3, 8, 4, "sides", r, true) };
  if (kind === "perimeter") ch = { kind, value: num(c.value, 4, 60, 12, "value", r, true) };
  if (kind === "area") { const v = num(c.value, 0.5, 72, 6, "value", r); ch = { kind, value: Math.round(v * 2) / 2, shape: oneOf(c.shape, ["any", "triangle", "rectangle"] as const, "any", "shape", r) }; }
  if (kind === "triangle") ch = { kind, type: oneOf(c.type, ["right", "isosceles", "scalene", "obtuse", "acute"] as const, "right", "type", r) };
  if (kind === "quad") ch = { kind, type: oneOf(c.type, ["square", "rectangle", "parallelogram", "rhombus", "trapezium", "kite"] as const, "rectangle", "type", r) };
  if (kind === "sticks") { const s = arr(c.sticks, "sticks", r).filter((x): x is number => Number.isInteger(x) && (x as number) >= 1 && (x as number) <= 12).slice(0, 6); if (s.length >= 3) ch = { kind, sticks: s, want: oneOf(c.want, ["triangle", "no-triangle"] as const, "triangle", "want", r) }; }
  if (kind === "rigid") { const f = arr(c.frame, "frame", r).map(pin).filter((p): p is P2 => !!p).slice(0, 6); if (f.length >= 4) ch = { kind, frame: f }; }
  if (kind === "parallel" || kind === "perpendicular") { const l = arr(c.line, "line", r).map(pin).filter((p): p is P2 => !!p), t = pin(c.through); if (l.length === 2 && t) ch = { kind, line: [l[0], l[1]], through: t }; }
  if (kind === "equidistant") { const p = arr(c.points, "points", r).map(pin).filter((x): x is P2 => !!x).slice(0, 3); if (p.length >= 2) ch = { kind, points: p }; }
  if (kind === "angle") ch = { kind, deg: num(c.deg, 10, 170, 45, "deg", r, true), tol: num(c.tol, 1, 10, 3, "tol", r) };
  if (!ch || !feasible(ch)) { r.push("challenge:infeasible"); return null; }
  return ch;
}
function repairGeo(raw: Record<string, unknown>, r: string[]): GeoSpec | null {
  const env = envelope(raw, gfDefault, r);
  const rounds: GfRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const challenges = arr(x.challenges, "challenges", r).slice(0, 4).map((c) => repairCh(c, r)).filter((c): c is GeoCh => !!c);
    if (!challenges.length) { r.push("round:challenges"); continue; }
    rounds.push({ title: reqStr(x.title, 22, "round.title", r) ?? "Build", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", time: num(x.time, 20, 120, 60, "time", r), challenges, ...targets(x.targets, r) });
  }
  if (!rounds.length) return null;
  return { archetype: "geo-forge@1", ...env, strings: strings(raw.strings, GF_STRINGS, 56, r), title: reqStr(raw.title, 36, "title", r) ?? "Geo Forge", rounds };
}
function gradeGeo(spec: GeoSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+):(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const ch = spec.rounds[+m[1] - 1]?.challenges[+m[2]]; if (!ch) return UNGRADED;
  if (!isObj(value)) return { verdict: "wrong", truth: ch.kind, detail: "no-value" };
  const j = judgeGeo(ch, value as { pts?: P2[]; pick?: number[]; edges?: [number, number][] });
  return { verdict: j.ok ? "right" : "wrong", truth: ch.kind, detail: j.detail };
}
function keysGeo(spec: GeoSpec) { return spec.rounds.flatMap((rd, k) => rd.challenges.map((c, i) => ({ itemId: `r${k + 1}:${i}`, key: JSON.stringify(c), prompt: c.kind }))); }
export const geoDef: ExtSpecDef<GeoSpec> = {
  archetype: "geo-forge@1", title: "Geo Forge", kind: "game", subjects: ["maths"],
  act: "against a blueprint clock, build on a pin-board: shapes with a given perimeter or area, triangle and quadrilateral types, parallel or perpendicular lines through a point, equidistant pins, angles, three sticks that close, braces that stop a frame wobbling",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths"], topics: ["c6-maths-ch06-t03", "c7-maths-ch07-t01", "c6-maths-ch06-t01"], misconceptions: [] },
  schema: GeoSchema as unknown as z.ZodType<GeoSpec>, defaultSpec: gfDefault, repair: repairGeo, grade: gradeGeo, keys: keysGeo,
};
