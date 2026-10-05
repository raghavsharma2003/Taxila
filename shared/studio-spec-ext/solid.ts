// solid-view@1 — Solid Studio (VALUES-100 V3.1: 3D shapes and their views; c4-maths ch01-t01 faces/edges/corners,
// c4-maths ch02-t01 top/front/side views, c5-maths ch07 polygons as faces).
//   count — a solid floats in 3D; drag to turn it, tap every corner (or edge, or face) to mark it; the hidden ones only
//           appear when you turn it round. LOCK when every one is marked.
//   build — the top, front and side views of a hidden block model are drawn; build stacks on the plan grid (tap a cell
//           to raise it) until your model's views match. Any model with the same three views is right.
// Truth: polyhedron vertex / edge / face sets and orthographic projections, computed here.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

export const SOLIDS = ["cube", "cuboid", "triangularPrism", "squarePyramid", "tetrahedron", "pentagonalPrism", "hexagonalPrism"] as const;
export type SolidName = (typeof SOLIDS)[number];
const SV_STRINGS = { round: "Round", done: "right", lock: "LOCK", corners: "corners", edges: "edges", faces: "faces", marked: "marked", turn: "Drag to turn it", top: "top", front: "front", side: "side", target: "views to match", yours: "yours", plan: "tap a cell to stack", runDone: "Studio closed", cube: "cube", cuboid: "cuboid", triangularPrism: "triangular prism", squarePyramid: "square pyramid", tetrahedron: "triangular pyramid", pentagonalPrism: "pentagonal prism", hexagonalPrism: "hexagonal prism" };
const SvRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("count"), title: z.string().min(1).max(22), sub: z.string().max(40), solid: z.enum(SOLIDS), feature: z.enum(["corners", "edges", "faces"]), ...TargetsField }),
  z.object({ mode: z.literal("build"), title: z.string().min(1).max(22), sub: z.string().max(40), heights: z.array(z.array(z.number().int().min(0).max(3)).min(2).max(4)).min(2).max(4), ...TargetsField }),
]);
export type SolidRoundT = z.infer<typeof SvRound>;
export const SolidSchema = z.object({ archetype: z.literal("solid-view@1"), ...EnvelopeExt, strings: stringsSchema(SV_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(SvRound).min(1).max(4) });
export type SolidSpec = z.infer<typeof SolidSchema>;

export type V3 = [number, number, number];
export interface Poly { v: V3[]; f: number[][] }
function prism(n: number, r = 1, h = 1.2, rot = 0): Poly { const v: V3[] = []; for (const y of [-h / 2, h / 2]) for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; v.push([r * Math.cos(a), y, r * Math.sin(a)]); } const f = [Array.from({ length: n }, (_, i) => n - 1 - i), Array.from({ length: n }, (_, i) => n + i)]; for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n + (i + 1) % n, n + i]); return { v, f }; }
function pyramid(n: number, r = 1, h = 1.4, rot = 0): Poly { const v: V3[] = []; for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; v.push([r * Math.cos(a), -h / 2, r * Math.sin(a)]); } v.push([0, h / 2, 0]); const f = [Array.from({ length: n }, (_, i) => n - 1 - i)]; for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n]); return { v, f }; }
export const POLY: Record<SolidName, Poly> = {
  cube: prism(4, 1, 1.414, Math.PI / 4), cuboid: (() => { const p = prism(4, 1, 1, Math.PI / 4); p.v = p.v.map(([x, y, z]) => [x * 1.4, y, z * 0.75]); return p; })(),
  triangularPrism: prism(3, 1, 1.4, -Math.PI / 2), squarePyramid: pyramid(4, 1, 1.4, Math.PI / 4), tetrahedron: pyramid(3, 1.1, 1.5, -Math.PI / 2),
  pentagonalPrism: prism(5, 1, 1.2, -Math.PI / 2), hexagonalPrism: prism(6, 1, 1.1, 0),
};
export function edgesOf(p: Poly): [number, number][] { const seen = new Set<string>(), out: [number, number][] = []; for (const f of p.f) for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], k = a < b ? `${a}-${b}` : `${b}-${a}`; if (!seen.has(k)) { seen.add(k); out.push(a < b ? [a, b] : [b, a]); } } return out; }
/** feature ids: "v3", "e1-5", "f2" */
export function featureIds(s: SolidName, feature: "corners" | "edges" | "faces"): string[] { const p = POLY[s]; return feature === "corners" ? p.v.map((_, i) => `v${i}`) : feature === "edges" ? edgesOf(p).map(([a, b]) => `e${a}-${b}`) : p.f.map((_, i) => `f${i}`); }
// ---- block models ----
export type Heights = number[][]; // heights[z][x] — z is depth (row 0 at the back), x left to right
export const viewTop = (h: Heights) => h.map((row) => row.map((v) => (v > 0 ? 1 : 0)));
export const viewFront = (h: Heights) => h[0].map((_, x) => Math.max(...h.map((row) => row[x])));
export const viewSide = (h: Heights) => h.map((row) => Math.max(...row));
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export function viewsMatch(target: Heights, h: Heights): { top: boolean; front: boolean; side: boolean } { return { top: same(viewTop(target), viewTop(h)), front: same(viewFront(target), viewFront(h)), side: same(viewSide(target), viewSide(h)) }; }

const svDefault: SolidSpec = {
  archetype: "solid-view@1", skills: ["c4-maths-ch01-t01", "c4-maths-ch02-t01"], lang: "en", strings: { ...SV_STRINGS }, title: "Solid Studio",
  rounds: [
    { mode: "count", title: "Corner hunt", sub: "mark every corner of the prism", solid: "triangularPrism", feature: "corners", targets: "c4-maths-ch01-t01-m-visible-only" },
    { mode: "count", title: "Edge hunt", sub: "mark every edge of the pyramid", solid: "squarePyramid", feature: "edges" },
    { mode: "build", title: "Match the views", sub: "build a model with these 3 views", heights: [[2, 1, 0], [1, 1, 0], [1, 0, 0]] },
  ],
};
function repairSolid(raw: Record<string, unknown>, r: string[]): SolidSpec | null {
  const env = envelope(raw, svDefault, r);
  const rounds: SolidRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Solids", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["count", "build"] as const, "count", "mode", r);
    if (mode === "count") rounds.push({ mode, ...head, solid: oneOf(x.solid, SOLIDS, "cube", "solid", r), feature: oneOf(x.feature, ["corners", "edges", "faces"] as const, "corners", "feature", r) });
    else {
      const rows = arr(x.heights, "heights", r).filter((row): row is number[] => Array.isArray(row)).slice(0, 4).map((row) => row.slice(0, 4).map((v) => (Number.isInteger(v) ? Math.max(0, Math.min(3, v as number)) : 0)));
      const w = Math.min(...rows.map((row) => row.length));
      if (rows.length < 2 || !(w >= 2)) { r.push("build:heights"); continue; }
      const heights = rows.map((row) => row.slice(0, w)); const n = heights.flat().filter((v) => v > 0).length;
      if (n < 2) { r.push("build:too-few-blocks"); continue; }
      rounds.push({ mode, ...head, heights });
    }
  }
  if (!rounds.length) return null;
  return { archetype: "solid-view@1", ...env, strings: strings(raw.strings, SV_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Solid Studio", rounds };
}
function gradeSolid(spec: SolidSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "count") {
    const all = new Set(featureIds(rd.solid, rd.feature)), marked = new Set(Array.isArray(v.marked) ? v.marked.filter((s): s is string => typeof s === "string" && all.has(s)) : []);
    return { verdict: marked.size === all.size ? "right" : marked.size >= Math.ceil(all.size * 0.7) ? "partial" : "wrong", truth: all.size, detail: `${marked.size} of ${all.size} ${spec.strings[rd.feature]}` };
  }
  const h = Array.isArray(v.heights) ? (v.heights as unknown[]).map((row) => (Array.isArray(row) ? row.map((x) => (Number.isInteger(x) ? Math.max(0, Math.min(3, x as number)) : 0)) : [])) : [];
  if (h.length !== rd.heights.length || h.some((row, i) => row.length !== rd.heights[i].length)) return { verdict: "wrong", truth: rd.heights, detail: "no-value" };
  const mt = viewsMatch(rd.heights, h), n = [mt.top, mt.front, mt.side].filter(Boolean).length;
  return { verdict: n === 3 ? "right" : n === 2 ? "partial" : "wrong", truth: rd.heights, detail: `${n}/3 views` };
}
function keysSolid(spec: SolidSpec) {
  return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "count" ? `${featureIds(rd.solid, rd.feature).length} ${rd.feature}` : `front ${viewFront(rd.heights).join(",")} side ${viewSide(rd.heights).join(",")}`, prompt: rd.mode === "count" ? `${rd.feature} of a ${rd.solid}` : "match top/front/side" }));
}
export const solidDef: ExtSpecDef<SolidSpec> = {
  archetype: "solid-view@1", title: "Solid Studio", kind: "game", subjects: ["maths"],
  act: "turn a 3D solid by dragging and tap every corner, edge or face (the hidden ones only show when it is turned), build block stacks on a plan until the model's top, front and side views match the drawings",
  outcomes: { classes: [4, 5], subjects: ["maths"], topics: ["c4-maths-ch01-t01", "c4-maths-ch02-t01"], misconceptions: [] },
  schema: SolidSchema as unknown as z.ZodType<SolidSpec>, defaultSpec: svDefault, repair: repairSolid, grade: gradeSolid, keys: keysSolid,
};
