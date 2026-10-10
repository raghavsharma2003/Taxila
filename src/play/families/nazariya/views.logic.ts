// Nazariya · views (c4-maths-ch02-t01 "top, front and side views"). Two goals:
//   build3 — three views of a hidden structure are given (top, front, side); build ANY structure whose own views match.
//            The law projects the build and lights each mismatched cell of each view.
//   same   — a structure A stands on the plot with one of its views; build a DIFFERENT structure with that same view.
//            (The kit belief "two different objects can never look the same from one side" copies A back.)
// Mal-rules (what a belief does to the build): top-flat (the footprint one block high: the top view read as the whole
// object) · front-wall (one row standing as the front view: a view read as the object itself) · view-swap (front and side
// read the other way round) · copy-same (rebuilds A exactly in the `same` goal).
import type { Candidate, Facts, GenRequest, NazariyaAct, PlayLevel } from "../../../../shared/play.ts";
import { mulberry32 } from "../../core/rng.ts";
import { buildActs, built, commit, frontView, intArr, lvl, makeLogic, mom, plotOf, rowsText, same, sideView, topView, zeros, type Applied, type NzState, type Plot } from "./grid.ts";

export type ViewName = "top" | "front" | "side";
export interface ViewsParams extends Plot {
  goal: "build3" | "same";
  /** build3: the three target views */
  top?: number[]; front?: number[]; side?: number[];
  /** same: the standing structure A (drawn as a ghost beside the plot) and which of its views must be kept */
  shown?: number[]; view?: ViewName;
}
export const VIEWS_MAL = ["top-flat", "front-wall", "view-swap", "copy-same"] as const;

export const viewOf = (p: { w: number; d: number }, h: readonly number[], v: ViewName) => (v === "top" ? topView(p, h) : v === "front" ? frontView(p, h) : sideView(p, h));
/** Cells of each view where the build disagrees with the target (the engine lights exactly these). */
export function viewMismatch(p: ViewsParams, h: readonly number[]): { top: number[]; front: number[]; side: number[]; total: number } {
  const diff = (a: number[], b: number[] | undefined) => (b ? a.map((v, i) => (v !== b[i] ? 1 : 0)) : a.map(() => 0));
  const top = diff(topView(p, h), p.top), front = diff(frontView(p, h), p.front), side = diff(sideView(p, h), p.side);
  return { top, front, side, total: [...top, ...front, ...side].reduce((s, v) => s + v, 0) };
}
/** The tallest build allowed by three views (each column as high as both profiles allow, on the top footprint). */
export const maximal = (p: { w: number; d: number }, top: number[], front: number[], side: number[]) =>
  top.map((t, i) => (t ? Math.min(front[i % p.w], side[Math.floor(i / p.w)]) : 0));
const matches3 = (p: ViewsParams, h: readonly number[]) => same(topView(p, h), p.top ?? []) && same(frontView(p, h), p.front ?? []) && same(sideView(p, h), p.side ?? []);

/** The build a child holding mal-rule `mal` makes on this level (null = the belief predicts nothing here). */
export function malBuild(p: ViewsParams, mal: string): number[] | null {
  const n = p.w * p.d;
  if (p.goal === "same") return mal === "copy-same" && p.shown ? [...p.shown] : null;
  if (!p.top || !p.front || !p.side) return null;
  if (mal === "top-flat") return p.top.some((t, i) => t && maximal(p, p.top!, p.front!, p.side!)[i] > 1) ? p.top.map((t) => (t ? 1 : 0)) : null;
  if (mal === "front-wall") { const h = zeros(n); p.front.forEach((v, x) => { h[x] = v; }); return h; }
  if (mal === "view-swap") {
    if (p.w !== p.d || same(p.front, p.side)) return null;
    const topT = p.top.map((_, i) => p.top![(i % p.w) * p.w + Math.floor(i / p.w)]);
    return maximal(p, topT, p.side, p.front);
  }
  return null;
}
const sigMatches = (p: ViewsParams, h: readonly number[], mal: string): boolean => {
  const mb = malBuild(p, mal);
  if (!mb) return false;
  if (mal === "copy-same" || mal === "top-flat" || mal === "front-wall") return same(h, mb);
  // view-swap: its front and side views are the target's swapped (any build that reads the views across)
  return same(frontView(p, h), p.side ?? []) && same(sideView(p, h), p.front ?? []);
};

function validate(raw: unknown): ViewsParams | null {
  const r = raw as Partial<ViewsParams> | null;
  const plot = plotOf(raw);
  if (!r || !plot || (r.goal !== "build3" && r.goal !== "same")) return null;
  if (plot.lock.some((v) => v) || plot.base.some((v) => v)) return null;     // views build on an empty plot
  if (r.goal === "build3") {
    const top = intArr(r.top, plot.w * plot.d, 0, 1), front = intArr(r.front, plot.w, 0, plot.hmax), side = intArr(r.side, plot.d, 0, plot.hmax);
    if (!top || !front || !side) return null;
    const p: ViewsParams = { ...plot, goal: "build3", top, front, side };
    // consistent views only: the tallest build they allow must show exactly these views (else no build can)
    if (!matches3(p, maximal(p, top, front, side))) return null;
    return p;
  }
  const shown = intArr(r.shown, plot.w * plot.d, 0, plot.hmax), view = r.view;
  if (!shown || (view !== "top" && view !== "front" && view !== "side") || !shown.some((v) => v)) return null;
  return { ...plot, goal: "same", shown, view };
}

function check(level: PlayLevel<ViewsParams>, s: NzState, seq: number): Applied {
  const p = level.params, h = s.h;
  const bumped = { ...s, acts: s.acts + 1 };
  if (p.goal === "build3") {
    const mm = viewMismatch(p, h);
    if (mm.total === 0) return { state: { ...commit(s, { ...s, done: true }) }, moments: [mom("solved", seq, { blocks: built(p, h), views: "top,front,side" })] };
    for (const mal of Object.keys(level.mal)) if (sigMatches(p, h, mal)) return { state: bumped, moments: [mom("misconception_consequence", seq, { off: mm.total, ...offBy(mm) }, mal)], refused: "mismatch" };
    return { state: bumped, moments: [mom(mm.total === 1 ? "near_miss" : "law_refused", seq, { off: mm.total, ...offBy(mm), why: "views_differ" })], refused: "mismatch" };
  }
  const v = p.view as ViewName, mine = viewOf(p, h, v), theirs = viewOf(p, p.shown ?? [], v);
  const sameView = same(mine, theirs), sameBuild = same(h, p.shown ?? []);
  if (sameView && !sameBuild) return { state: commit(s, { ...s, done: true }), moments: [mom("solved", seq, { view: v, blocks: built(p, h) })] };
  if (sameBuild) {
    for (const mal of Object.keys(level.mal)) if (sigMatches(p, h, mal)) return { state: bumped, moments: [mom("misconception_consequence", seq, { view: v, why: "same_build" }, mal)], refused: "mismatch" };
    return { state: bumped, moments: [mom("law_refused", seq, { view: v, why: "same_build" })], refused: "mismatch" };
  }
  const off = mine.reduce((a, x, i) => a + (x !== theirs[i] ? 1 : 0), 0);
  return { state: bumped, moments: [mom(off === 1 ? "near_miss" : "law_refused", seq, { view: v, off, why: "views_differ" })], refused: "mismatch" };
}
const offBy = (mm: ReturnType<typeof viewMismatch>): Facts => {
  const f: Facts = {};
  const t = mm.top.reduce((a, b) => a + b, 0), fr = mm.front.reduce((a, b) => a + b, 0), si = mm.side.reduce((a, b) => a + b, 0);
  if (t) f.top_off = t; if (fr) f.front_off = fr; if (si) f.side_off = si;
  return f;
};

function solve(level: PlayLevel<ViewsParams>): NazariyaAct[] | null {
  const p = level.params;
  if (p.goal === "build3") return [...buildActs(p, maximal(p, p.top!, p.front!, p.side!)), { kind: "check" }];
  const alt = sameAlternative(p);
  return alt ? [...buildActs(p, alt), { kind: "check" }] : null;
}
/** A different build with the same chosen view as A (the tallest one with that view, else one block more or less). */
export function sameAlternative(p: ViewsParams): number[] | null {
  const A = p.shown!, v = p.view!, n = p.w * p.d;
  const tries: number[][] = [];
  if (v === "front") { const f = frontView(p, A); tries.push(Array.from({ length: n }, (_, i) => f[i % p.w])); tries.push(Array.from({ length: n }, (_, i) => (i < p.w ? f[i] : 0))); }
  if (v === "side") { const sd = sideView(p, A); tries.push(Array.from({ length: n }, (_, i) => sd[Math.floor(i / p.w)])); tries.push(Array.from({ length: n }, (_, i) => (i % p.w === p.w - 1 ? sd[Math.floor(i / p.w)] : 0))); }
  if (v === "top") { tries.push(A.map((x) => (x ? Math.min(p.hmax, x + 1) : 0))); tries.push(A.map((x) => (x ? 1 : 0))); tries.push(A.map((x) => (x ? Math.max(1, x - 1) : 0))); }
  return tries.find((t) => !same(t, A) && same(viewOf(p, t, v), viewOf(p, A, v))) ?? null;
}
/** Builds a child could make without reading the views: fill the plot, the footprint flat, one standing wall. */
function shortcut(level: PlayLevel<ViewsParams>): NazariyaAct[] | null {
  const p = level.params, n = p.w * p.d;
  if (p.goal === "same") {
    // any other build with that view would be the concept; a lazy "anything different" must fail: an empty-ish plot
    const one = zeros(n); one[0] = 1;
    return same(viewOf(p, one, p.view!), viewOf(p, p.shown!, p.view!)) && !same(one, p.shown!) ? [...buildActs(p, one), { kind: "check" }] : null;
  }
  const H = Math.max(...p.front!, ...p.side!);
  const tries = [Array<number>(n).fill(H), p.top!.map((t) => (t ? H : 0)), p.top!.map((t) => (t ? 1 : 0)), Array<number>(n).fill(1)];
  const f = zeros(n); p.front!.forEach((v, x) => { f[x] = v; }); tries.push(f);
  for (const t of tries) if (matches3(p, t)) return [...buildActs(p, t), { kind: "check" }];
  return null;
}
function malActs(level: PlayLevel<ViewsParams>, mal: string): NazariyaAct[] | null {
  const b = malBuild(level.params, mal);
  if (!b || !b.some((v) => v)) return null;
  return [...buildActs(level.params, b), { kind: "check" }];
}

function generate(req: GenRequest): Candidate<ViewsParams>[] {
  const g = req.grammar as { goal?: "build3" | "same"; views?: ViewName[]; maxSide?: number; hmax?: number };
  const goal = (req.goal as "build3" | "same") ?? g.goal ?? "build3";
  const rnd = mulberry32(req.seed), out: Candidate<ViewsParams>[] = [];
  const maxSide = g.maxSide ?? (req.classLevel <= 4 ? 3 : 4), hmax = g.hmax ?? (req.classLevel <= 4 ? 3 : 4);
  for (let k = 0; k < 36; k++) {
    const w = 2 + Math.floor(rnd() * (maxSide - 1)), d = goal === "build3" && rnd() < 0.6 ? w : 2 + Math.floor(rnd() * (maxSide - 1));
    const n = w * d;
    const h = Array.from({ length: n }, () => (rnd() < 0.3 ? 0 : 1 + Math.floor(rnd() * hmax)));
    if (h.filter((v) => v).length < 3) continue;
    const plot: Plot = { w, d, hmax, base: zeros(n), lock: zeros(n) };
    let params: ViewsParams;
    if (goal === "build3") params = { ...plot, goal, top: topView(plot, h), front: frontView(plot, h), side: sideView(plot, h) };
    else { const vs = g.views ?? ["front", "side", "top"]; params = { ...plot, goal, shown: h, view: vs[k % vs.length] }; }
    const blocks = h.reduce((a, b) => a + b, 0);
    const difficulty = Math.min(1, 0.08 * n + 0.04 * blocks / Math.max(1, n) * 4 + (goal === "same" ? 0.1 : 0) - 0.15);
    const sig = goal === "build3" ? `${w}x${d}:${params.top!.join("")}:${params.front!.join("")}:${params.side!.join("")}` : `${w}x${d}:${params.view}:${h.join("")}`;
    out.push({ signature: sig, difficulty: Math.max(0, difficulty), level: lvl(req, "views", goal, params, `${goal}-${w}x${d}-${k}`) });
  }
  return out;
}

function facts(level: PlayLevel<ViewsParams>, s: NzState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, plot: `${p.w}x${p.d}`, blocks: built(p, s.h) };
  if (p.goal === "same") f.view = p.view as string;
  if (s.checks) f.checks = s.checks;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<ViewsParams>, s: NzState) {
  const p = level.params;
  if (p.goal === "same") return { title: `Same ${p.view} view, different build`, lines: [`A: ${rowsText(p, p.shown!)}`, `yours: ${rowsText(p, s.h)}`] };
  return { title: "Build from three views", lines: [`top: ${rowsText(p, p.top!)}`, `front: ${p.front!.join(" ")}`, `side: ${p.side!.join(" ")}`, `yours: ${rowsText(p, s.h)}`] };
}

export const viewsLogic = makeLogic<ViewsParams>({ mode: "views", malRules: VIEWS_MAL, validate, check, solve, shortcut, malActs, generate, facts, board });
