// Nazariya · solid (r7 nazariya2: c4-maths-ch01-t01 faces, edges and corners of 3D shapes). A solid (a cube, a cuboid
// biscuit box, a square pyramid, a triangular prism) stands on the table, drawn the way a picture shows it: only the faces
// turned towards the child. The child turns it a quarter round either way, or tips it over to see the underneath, and
// works it with three tools: a STAMP for each flat face, a FINGER run along each edge (where two faces meet) and a PIN in
// each corner (where edges meet). Only what is in sight can be touched; a mark stays on the solid as it turns; a second
// stamp on a face is refused. "Done" asks the law whether every face (edge, corner) of the solid carries its mark.
//   faces   — stamp every face (s2: cube and cuboid, the hidden back, bottom and far side too)
//   edges   — run a finger along every edge (s1: an edge is the line where two faces meet; s2)
//   corners — pin every corner (s3: a pyramid, a prism)
// Mal-rules (kit c4-maths-ch01-t01): visible-only (marks exactly what the first picture shows and nothing hidden) ·
// edges-corners (asked for the edges, pins every corner and runs along no edge; asked for the corners, runs along every
// edge and pins none). Not here: cuboid-different (a dice and a box side by side would need two solids worked pair by
// pair; one solid at a time never shows that belief), and the curved solids (cylinder, cone, sphere: the kit's skills and
// beliefs are about flat faces only).
import type { Candidate, Facts, FamilyLogic, GenRequest, Moment, NazariyaAct, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { mulberry32 } from "../../core/rng.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { DECISIVE_REFUSALS, lvl, mom } from "./grid.ts";

export type SolidKind = "cube" | "cuboid" | "pyramid" | "prism";
export type SolidGoal = "faces" | "edges" | "corners";
export type El = "face" | "edge" | "corner";
export interface SolidParams { goal: SolidGoal; solid: SolidKind; dims: [number, number, number]; start: number }
export interface SolidState extends Undoable<SolidState> {
  /** orientation: yaw quarter k (0..3) + 4 × tipped (0 = seen from above, 1 = tipped over, seen from below) */
  o: number;
  face: number[]; edge: number[]; corner: number[];
  checks: number; done: boolean; acts: number;
}
export const SOLID_MAL = ["visible-only", "edges-corners"] as const;
export const SOLIDS: readonly SolidKind[] = ["cube", "cuboid", "pyramid", "prism"];
const ELS: readonly El[] = ["face", "edge", "corner"];
export const elOf = (g: SolidGoal): El => (g === "faces" ? "face" : g === "edges" ? "edge" : "corner");

export type V3 = [number, number, number];
export interface Geo { verts: V3[]; faces: number[][]; edges: [number, number][]; normals: V3[] }

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** The solid's corners (x right, y up, z towards the child), faces (corner loops) and edges, centred on the origin. */
const GEO = new Map<string, Geo>();
export function geoOf(p: Pick<SolidParams, "solid" | "dims">): Geo {
  const key = `${p.solid}:${p.dims.join(",")}`, hit = GEO.get(key);
  if (hit) return hit;
  const [a, b, c] = p.dims;
  let verts: V3[] = [], faces: number[][] = [];
  if (p.solid === "cube" || p.solid === "cuboid") {
    for (let i = 0; i < 8; i++) verts.push([(i & 1 ? 1 : -1) * a / 2, (i & 2 ? 1 : -1) * b / 2, (i & 4 ? 1 : -1) * c / 2]);
    faces = [[2, 6, 7, 3], [4, 5, 7, 6], [1, 3, 7, 5], [0, 4, 6, 2], [0, 2, 3, 1], [0, 1, 5, 4]];   // top, front, right, left, back, bottom
  } else if (p.solid === "pyramid") {
    verts = [[-a / 2, -b / 3, -a / 2], [a / 2, -b / 3, -a / 2], [a / 2, -b / 3, a / 2], [-a / 2, -b / 3, a / 2], [0, (2 * b) / 3, 0]];
    faces = [[3, 2, 4], [2, 1, 4], [1, 0, 4], [0, 3, 4], [0, 1, 2, 3]];                                  // four sides, the base
  } else {
    const r = a / Math.sqrt(3);
    const tri = [90, 210, 330].map((deg) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)]);
    for (const y of [-b / 2, b / 2]) for (const [x, z] of tri) verts.push([x, y, z]);
    faces = [[3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5], [0, 1, 2]];                            // top, three sides, bottom
  }
  verts = verts.map((v) => v.map((q) => Math.round(q * 1e6) / 1e6) as V3);
  const centre: V3 = [0, 0, 0];
  verts.forEach((v) => { centre[0] += v[0] / verts.length; centre[1] += v[1] / verts.length; centre[2] += v[2] / verts.length; });
  const normals = faces.map((f) => {
    let n = norm(cross(sub(verts[f[1]], verts[f[0]]), sub(verts[f[2]], verts[f[0]])));
    const fc = f.reduce<V3>((s, i) => [s[0] + verts[i][0] / f.length, s[1] + verts[i][1] / f.length, s[2] + verts[i][2] / f.length], [0, 0, 0]);
    if (dot(n, sub(fc, centre)) < 0) n = [-n[0], -n[1], -n[2]];
    return n;
  });
  const seen = new Set<string>(), edges: [number, number][] = [];
  for (const f of faces) for (let k = 0; k < f.length; k++) {
    const u = Math.min(f[k], f[(k + 1) % f.length]), v = Math.max(f[k], f[(k + 1) % f.length]);
    if (!seen.has(`${u}-${v}`)) { seen.add(`${u}-${v}`); edges.push([u, v]); }
  }
  edges.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const g = { verts, faces, edges, normals };
  GEO.set(key, g);
  return g;
}
export const countOf = (g: Geo, el: El) => (el === "face" ? g.faces.length : el === "edge" ? g.edges.length : g.verts.length);

/** Orientation o → the turn the child sees: a quarter round (plus a slant so three faces show) and above / below. */
export const YAW0 = 32, PITCH = 26;
export const anglesOf = (o: number): [number, number] => [YAW0 + 90 * (o % 4), o >= 4 ? -PITCH : PITCH];
export function rotate(o: number, v: V3): V3 { const [y, p] = anglesOf(o); return rotateBy(y, p, v); }
/** the turn by yaw / pitch in degrees (the view also draws the in-between frames of a turn with it) */
export function rotateBy(yawDeg: number, pitchDeg: number, v: V3): V3 {
  const yaw = (yawDeg * Math.PI) / 180, pitch = (pitchDeg * Math.PI) / 180;
  const x1 = v[0] * Math.cos(yaw) - v[2] * Math.sin(yaw), z1 = v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw);
  const y2 = v[1] * Math.cos(pitch) - z1 * Math.sin(pitch), z2 = v[1] * Math.sin(pitch) + z1 * Math.cos(pitch);
  return [x1, y2, z2];
}
/** What is in sight in orientation o: faces turned to the child, and the edges and corners of those faces. */
export function visibleAt(g: Geo, o: number): { face: number[]; edge: number[]; corner: number[] } {
  const face = g.normals.map((n, i) => (rotate(o, n)[2] > 0.12 ? i : -1)).filter((i) => i >= 0);
  const vs = new Set(face.flatMap((f) => g.faces[f]));
  const onFace = (u: number, v: number) => face.some((f) => { const L = g.faces[f]; return L.some((q, k) => (q === u && L[(k + 1) % L.length] === v) || (q === v && L[(k + 1) % L.length] === u)); });
  const edge = g.edges.map(([u, v], i) => (onFace(u, v) ? i : -1)).filter((i) => i >= 0);
  return { face, edge, corner: [...vs].sort((x, y) => x - y) };
}
/** the next orientation after a turn */
export function turned(o: number, dir: "left" | "right" | "over"): number {
  const k = o % 4, t = o >= 4 ? 1 : 0;
  if (dir === "over") return k + 4 * (1 - t);
  return ((k + (dir === "right" ? 1 : 3)) % 4) + 4 * t;
}

const DIMS: Record<SolidKind, [number, number, number][]> = {
  cube: [[1, 1, 1]],
  cuboid: [[1.8, 0.7, 1.1], [1.1, 1.6, 0.8], [2, 0.9, 0.6]],
  pyramid: [[1.4, 1.3, 1.4], [1.6, 1.0, 1.6]],
  prism: [[1.3, 1.5, 1.3], [1.2, 1.0, 1.2]],
};
function validate(raw: unknown): SolidParams | null {
  const r = raw as Partial<SolidParams> | null;
  if (!r || (r.goal !== "faces" && r.goal !== "edges" && r.goal !== "corners") || !SOLIDS.includes(r.solid as SolidKind)) return null;
  const solid = r.solid as SolidKind, start = Number(r.start);
  if (!Number.isInteger(start) || start < 0 || start > 7 || !Array.isArray(r.dims) || r.dims.length !== 3) return null;
  const dims = r.dims.map(Number) as [number, number, number];
  // the shapes are the law's own: only the authored sizes (a cube is a cube)
  if (!DIMS[solid].some((d) => d.every((v, i) => v === dims[i]))) return null;
  return { goal: r.goal, solid, dims, start };
}

const init = (p: SolidParams): SolidState => ({ o: p.start, face: [], edge: [], corner: [], checks: 0, done: false, acts: 0, prev: null, depth: 0 });
const commitS = (s: SolidState, next: Partial<SolidState>): SolidState => ({ ...pushUndo<SolidState>(s, { ...s, ...next, acts: s.acts } as SolidState), acts: s.acts + 1 });
type Out = { state: SolidState; moments: Moment[]; refused?: string };
const sameSet = (a: readonly number[], b: readonly number[]) => a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);

function check(level: PlayLevel<SolidParams>, s: SolidState, seq: number): Out {
  const p = level.params, g = geoOf(p), el = elOf(p.goal), all = countOf(g, el), mine = s[el], bumped = { ...s, acts: s.acts + 1 };
  const others = ELS.filter((e) => e !== el), stray = others.reduce((n, e) => n + s[e].length, 0), has = (m: string) => m in level.mal;
  const f: Facts = { marked: mine.length, solid: p.solid };
  if (!mine.length && !stray) return { state: bumped, moments: [mom("law_refused", seq, { why: "mark_first" })], refused: "build_first" };
  if (mine.length === all && !stray) return { state: commitS(s, { done: true }), moments: [mom("solved", seq, { ...f, [`${el}s`]: all })] };
  if (has("edges-corners") && !mine.length && el !== "face") {
    const swap: El = el === "edge" ? "corner" : "edge";
    if (s[swap].length === countOf(g, swap) && !s.face.length) return { state: bumped, moments: [mom("misconception_consequence", seq, { ...f, [`${swap}s_marked`]: s[swap].length }, "edges-corners")], refused: "mismatch" };
  }
  const v = visibleAt(g, p.start)[el];
  if (has("visible-only") && !stray && v.length < all && sameSet(mine, v)) return { state: bumped, moments: [mom("misconception_consequence", seq, { ...f, seen_first: v.length }, "visible-only")], refused: "mismatch" };
  if (stray) return { state: bumped, moments: [mom("law_refused", seq, { ...f, why: "other_marks" })], refused: "mismatch" };
  return { state: bumped, moments: [mom(all - mine.length === 1 ? "near_miss" : "law_refused", seq, { ...f, why: "some_unmarked" })], refused: "mismatch" };
}

function apply(level: PlayLevel<SolidParams>, s: SolidState, act: NazariyaAct, seq: number): Out {
  const p = level.params, g = geoOf(p), out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = { ...s, acts: s.acts + 1 };
  if (!act || typeof act !== "object") return { state: bump, moments: [], refused: "bad_act" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  switch (act.kind) {
    case "turn": {
      if (act.dir !== "left" && act.dir !== "right" && act.dir !== "over") return { state: bump, moments: out, refused: "bad_turn" };
      const o = turned(s.o, act.dir);
      out.push(mom("progress", seq, { act: act.dir === "over" ? "tip" : "turn", in_sight: visibleAt(g, o).face.length }));
      return { state: commitS(s, { o }), moments: out };
    }
    case "mark": {
      const el = act.el, i = Number(act.i);
      if (!ELS.includes(el) || !Number.isInteger(i) || i < 0 || i >= countOf(g, el)) return { state: bump, moments: out, refused: "bad_mark" };
      if (!visibleAt(g, s.o)[el].includes(i)) { out.push(mom("law_refused", seq, { why: "out_of_sight" })); return { state: bump, moments: out, refused: "hidden" }; }
      if (s[el].includes(i)) { out.push(mom("law_refused", seq, { why: "marked_already" })); return { state: bump, moments: out, refused: "already" }; }
      const next = commitS(s, { [el]: [...s[el], i] } as Partial<SolidState>);
      out.push(mom("progress", seq, { act: el, marked: next[el].length }));
      return { state: next, moments: out };
    }
    case "check": {
      const r = check(level, { ...s, checks: s.checks + 1 }, seq);
      return { ...r, moments: [...out, ...r.moments] };
    }
  }
  return { state: bump, moments: out, refused: "unknown_act" };
}

/** Acts that mark `want` (sets per kind), turning through the orientations in a fixed order and marking what is in sight. */
export function markActs(p: SolidParams, want: Partial<Record<El, number[]>>): NazariyaAct[] | null {
  const g = geoOf(p), acts: NazariyaAct[] = [], left = Object.fromEntries(ELS.map((e) => [e, new Set(want[e] ?? [])])) as Record<El, Set<number>>;
  let o = p.start;
  const route: ("right" | "over")[] = ["right", "right", "right", "over", "right", "right", "right", "over"];
  for (let k = 0; k <= route.length; k++) {
    const v = visibleAt(g, o);
    for (const e of ELS) for (const i of v[e]) if (left[e].has(i)) { acts.push({ kind: "mark", el: e, i }); left[e].delete(i); }
    if (ELS.every((e) => left[e].size === 0)) return acts;
    if (k < route.length) { acts.push({ kind: "turn", dir: route[k] }); o = turned(o, route[k]); }
  }
  return null;
}
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
function solve(level: PlayLevel<SolidParams>): NazariyaAct[] | null {
  const p = level.params, el = elOf(p.goal), m = markActs(p, { [el]: range(countOf(geoOf(p), el)) });
  return m ? [...m, { kind: "check" }] : null;
}
/** Without counting each kind apart: everything marked (every face, edge and corner), or only what the first picture
 *  shows. Neither may win. */
function shortcut(level: PlayLevel<SolidParams>): NazariyaAct[] | null {
  const p = level.params, g = geoOf(p), el = elOf(p.goal);
  const tries = [{ face: range(g.faces.length), edge: range(g.edges.length), corner: range(g.verts.length) }, { [el]: visibleAt(g, p.start)[el] }];
  for (const want of tries) {
    const acts = markActs(p, want);
    if (!acts) continue;
    let s = init(p); let n = 0;
    for (const a of [...acts, { kind: "check" } as NazariyaAct]) s = apply(level, s, a, ++n).state;
    if (s.done) return [...acts, { kind: "check" }];
  }
  return null;
}
function malActs(level: PlayLevel<SolidParams>, mal: string): NazariyaAct[] | null {
  const p = level.params, g = geoOf(p), el = elOf(p.goal);
  if (mal === "visible-only") { const v = visibleAt(g, p.start)[el]; return v.length && v.length < countOf(g, el) ? [...(markActs(p, { [el]: v }) ?? []), { kind: "check" }] : null; }
  if (mal === "edges-corners" && el !== "face") { const sw: El = el === "edge" ? "corner" : "edge"; const m = markActs(p, { [sw]: range(countOf(g, sw)) }); return m ? [...m, { kind: "check" }] : null; }
  return null;
}

const JITTER = 0.2, clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function generate(req: GenRequest): Candidate<SolidParams>[] {
  const g = req.grammar as { solids?: SolidKind[] };
  const goal = (req.goal as SolidGoal) ?? "faces", solids = (g.solids ?? ["cube", "cuboid"]).filter((x) => SOLIDS.includes(x));
  const rnd = mulberry32(req.seed), out: Candidate<SolidParams>[] = [];
  for (const solid of solids) DIMS[solid].forEach((dims, di) => {
    for (let start = 0; start < 8; start++) {
      if (start >= 4 && rnd() < 0.6) continue;   // most start seen from above, as a picture of a box on a table is
      const params: SolidParams = { goal, solid, dims, start };
      const geo = geoOf(params), n = countOf(geo, elOf(goal)), seen = visibleAt(geo, start)[elOf(goal)].length;
      // a seeded nudge (± JITTER / 2) so the picker's nearest-to-band level differs from child to child; without it every
      // child met the same solid from the same view first (one pyramid, one cube)
      out.push({ signature: `${goal}:${solid}:${di}:${start}`, difficulty: clamp01(n / 16 + (n - seen) / 16 + (solid === "pyramid" || solid === "prism" ? 0.1 : 0) + (rnd() - 0.5) * JITTER), level: lvl(req, "solid", goal, params, `${goal}-${solid}-${di}-${start}`, "khand") });
    }
  });
  return out;
}

function facts(level: PlayLevel<SolidParams>, s: SolidState): Facts {
  const p = level.params, g = geoOf(p), el = elOf(p.goal), f: Facts = { goal: p.goal, solid: p.solid, in_sight: visibleAt(g, s.o)[el].length };
  if (level.fade === 1 || s.checks > 0 || s.done) f.marked = s[el].length;
  if (s.checks) f.checks = s.checks;
  if (s.done) { f.done = "yes"; f[`${el}s`] = countOf(g, el); }
  return f;
}
function board(level: PlayLevel<SolidParams>, s: SolidState) {
  const p = level.params;
  return { title: `Mark every ${elOf(p.goal)} of the ${p.solid}`, lines: [`faces stamped: ${s.face.length}`, `edges run: ${s.edge.length}`, `corners pinned: ${s.corner.length}`, `seen from: ${s.o >= 4 ? "below" : "above"}, turn ${s.o % 4}`] };
}

export const solidLogic: FamilyLogic<SolidParams, SolidState, NazariyaAct> = {
  family: "nazariya", modes: ["solid"], malRules: SOLID_MAL,
  validate(level) {
    if (!level || level.family !== "nazariya" || level.mode !== "solid") return null;
    const p = validate(level.params);
    return p && level.goal === p.goal ? ({ ...level, params: p } as PlayLevel<SolidParams>) : null;
  },
  init: (level) => init(level.params),
  apply, goalMet: (_l, s) => s.done,
  generate, solve, shortcut, malActs,
  grade(level: PlayLevel<SolidParams>, acts: PlayActEnvelope<NazariyaAct>[]): PlayGrade {
    return gradeLevel(solidLogic, level, acts, { decisiveRefusals: DECISIVE_REFUSALS, final: true });
  },
  facts, board,
};
/** her micro-lines never say how many faces / edges / corners the solid has before the child has marked them all */
export const solidHidden = (p: SolidParams): number[] => [countOf(geoOf(p), elOf(p.goal))];
