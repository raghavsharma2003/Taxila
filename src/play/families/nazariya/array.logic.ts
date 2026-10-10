// Nazariya · array (c4-maths-ch09-t01 multiplication facts). A courtyard of paving has a rectangular pit r rows × c
// columns, one block deep. The array of blocks that fills it IS r × c.
//   fill — fade 1-2: fill the pit (a drag lays a whole row run), then say how many blocks it took. Fade 3: say the number
//          first; the cart pours exactly that many, row after row: too few leaves a hole, too many piles up beside.
//   turn — a filled r × c pit stands beside an empty c × r pit (the same array turned). Predict: same number of blocks,
//          or not? Then fill it; the two counts stand side by side.
// Mal-rules: add-for-times (r + c) · one-row (only one row's blocks) · order-changes (the turned array holds a different count).
import type { Candidate, Facts, GenRequest, Moment, NazariyaAct, PlayLevel } from "../../../../shared/play.ts";
import { mulberry32 } from "../../core/rng.ts";
import { built, commit, idx, lvl, makeLogic, mom, plotOf, zeros, type Applied, type NzState, type Plot } from "./grid.ts";

export interface Pit { x0: number; z0: number; r: number; c: number }
export interface ArrayParams extends Plot { goal: "fill" | "turn"; r: number; c: number; pit: Pit; given?: Pit | null }
export const ARRAY_MAL = ["add-for-times", "one-row", "order-changes"] as const;

export const pitCells = (p: { w: number }, q: Pit) => { const out: number[] = []; for (let z = q.z0; z < q.z0 + q.r; z++) for (let x = q.x0; x < q.x0 + q.c; x++) out.push(idx(p, x, z)); return out; };
export const pitFilled = (p: ArrayParams, h: readonly number[]) => pitCells(p, p.pit).filter((i) => h[i] >= 1).length;
const full = (p: ArrayParams, h: readonly number[]) => pitFilled(p, h) === p.r * p.c;
/** The cart's pour: n blocks into the pit, row after row from the front row (z0), left to right. */
export function pour(p: ArrayParams, n: number): number[] {
  const h = [...p.base];
  pitCells(p, p.pit).forEach((i, k) => { h[i] = k < n ? 1 : 0; });
  return h;
}
const malCount = (p: ArrayParams, mal: string): number | null => (mal === "add-for-times" ? p.r + p.c : mal === "one-row" ? p.c : null);

function validate(raw: unknown): ArrayParams | null {
  const r = raw as Partial<ArrayParams> | null, plot = plotOf(raw);
  if (!r || !plot || (r.goal !== "fill" && r.goal !== "turn") || plot.hmax !== 1) return null;
  const pitOk = (q: Partial<Pit> | null | undefined, rr: number, cc: number): Pit | null => {
    if (!q) return null;
    const v = { x0: Number(q.x0), z0: Number(q.z0), r: Number(q.r), c: Number(q.c) };
    if (![v.x0, v.z0].every((n) => Number.isInteger(n) && n >= 0) || v.r !== rr || v.c !== cc || v.x0 + v.c > plot.w || v.z0 + v.r > plot.d) return null;
    return v;
  };
  const R = Number(r.r), C = Number(r.c);
  if (!Number.isInteger(R) || !Number.isInteger(C) || R < 1 || C < 1 || R > 12 || C > 12) return null;
  const pit = r.goal === "fill" ? pitOk(r.pit, R, C) : pitOk(r.pit, C, R);
  if (!pit) return null;
  const given = r.goal === "turn" ? pitOk(r.given, R, C) : null;
  if (r.goal === "turn" && (!given || R === C)) return null;
  // the plot: the pit is the only open ground; everything else is paving (locked, one block high)
  const cells = new Set(pitCells(plot, pit));
  for (let i = 0; i < plot.w * plot.d; i++) {
    if (cells.has(i)) { if (plot.lock[i] || plot.base[i] !== 0) return null; }
    else if (!plot.lock[i] || plot.base[i] !== 1) return null;
  }
  return { ...plot, goal: r.goal, r: R, c: C, pit, given };
}

function name(level: PlayLevel<ArrayParams>, s: NzState, n: number, seq: number): Applied {
  const p = level.params, key = p.r * p.c, bumped = { ...s, acts: s.acts + 1 };
  if (p.goal === "turn") return { state: bumped, moments: [], refused: "no_name_here" };
  const fade3 = level.fade === 3;
  if (!fade3 && !full(p, s.h)) return { state: bumped, moments: [mom("law_refused", seq, { why: "fill_first" })], refused: "fill_first" };
  const h = fade3 ? pour(p, n) : s.h;
  const shown: Facts = fade3 ? { ordered: n, ...(n < key ? { empty: key - n } : n > key ? { extra: n - key } : {}) } : { said: n };
  if (n === key) return { state: commit(s, { ...s, h, named: n, done: true }), moments: [mom("solved", seq, { rows: p.r, cols: p.c, blocks: key })] };
  const next = commit(s, { ...s, h, named: n });
  for (const mal of Object.keys(level.mal)) if (malCount(p, mal) === n) return { state: next, moments: [mom("misconception_consequence", seq, { ...shown, rows: p.r, cols: p.c }, mal)], refused: "wrong_count" };
  const slip = Math.abs(n - key) === p.c || Math.abs(n - key) === p.r || Math.abs(n - key) === 1;
  return { state: next, moments: [mom(slip ? "near_miss" : "law_refused", seq, { ...shown, rows: p.r, cols: p.c, why: "count_again" })], refused: "wrong_count" };
}
function predict(level: PlayLevel<ArrayParams>, s: NzState, sameN: boolean, seq: number): Applied {
  const p = level.params;
  if (p.goal !== "turn") return { state: { ...s, acts: s.acts + 1 }, moments: [], refused: "no_predict_here" };
  const next = commit(s, { ...s, predicted: sameN });
  if (sameN) {
    const out: Moment[] = [mom("prediction_committed", seq, { same: "yes" })];
    if (full(p, s.h)) { out.push(mom("prediction_confirmed", seq, { rows: p.r, cols: p.c }), mom("solved", seq, { rows: p.r, cols: p.c, blocks: p.r * p.c })); return { state: { ...next, done: true }, moments: out }; }
    return { state: next, moments: out };
  }
  const mis = Object.keys(level.mal).find((m) => m === "order-changes");
  return { state: next, moments: [mis ? mom("misconception_consequence", seq, { same: "no", rows: p.r, cols: p.c }, mis) : mom("prediction_committed", seq, { same: "no" })], refused: mis ? "wrong_prediction" : undefined };
}
function gate(level: PlayLevel<ArrayParams>, s: NzState, act: NazariyaAct): string | null {
  const p = level.params, build = act.kind === "place" || act.kind === "remove" || act.kind === "layer" || act.kind === "clear";
  if (!build) return null;
  if (p.goal === "turn" && s.predicted === null) return "predict_first";
  if (p.goal === "fill" && level.fade === 3) return "say_how_many";
  return null;
}
function afterBuild(level: PlayLevel<ArrayParams>, s: NzState, seq: number): Moment[] {
  const p = level.params;
  if (!full(p, s.h)) return [];
  if (p.goal === "turn") return s.predicted === true ? [] : [mom("prediction_violated", seq, { rows: p.c, cols: p.r, same: "yes" })];
  return [mom("progress", seq, { full: "yes", rows: p.r, cols: p.c })];
}
/** "check" finishes a turn level (filled + predicted same); a fill level finishes on the named count. */
function check(level: PlayLevel<ArrayParams>, s: NzState, seq: number): Applied {
  const p = level.params, bumped = { ...s, acts: s.acts + 1 };
  if (p.goal === "turn" && full(p, s.h) && s.predicted === true) return { state: commit(s, { ...s, done: true }), moments: [mom("solved", seq, { rows: p.r, cols: p.c, blocks: p.r * p.c })] };
  return { state: bumped, moments: [mom("law_refused", seq, { why: p.goal === "turn" ? (full(p, s.h) ? "predict_again" : "fill_first") : "say_how_many" })], refused: "not_yet" };
}

function solve(level: PlayLevel<ArrayParams>): NazariyaAct[] | null {
  const p = level.params, q = p.pit, lay: NazariyaAct = { kind: "layer", x0: q.x0, z0: q.z0, x1: q.x0 + q.c - 1, z1: q.z0 + q.r - 1 };
  if (p.goal === "turn") return [{ kind: "predict", same: true }, lay, { kind: "check" }];
  return level.fade === 3 ? [{ kind: "name", n: p.r * p.c }] : [lay, { kind: "name", n: p.r * p.c }];
}
/** Counting without the array: one row's worth, the two sides added, the paving's own count. None may finish the level. */
function shortcut(level: PlayLevel<ArrayParams>): NazariyaAct[] | null {
  const p = level.params;
  if (p.goal === "turn") return null;
  const lay: NazariyaAct = { kind: "layer", x0: p.pit.x0, z0: p.pit.z0, x1: p.pit.x0 + p.pit.c - 1, z1: p.pit.z0 + p.pit.r - 1 };
  for (const n of [p.r + p.c, p.c, p.r, p.w * p.d - p.r * p.c]) if (n === p.r * p.c) return level.fade === 3 ? [{ kind: "name", n }] : [lay, { kind: "name", n }];
  return null;
}
function malActs(level: PlayLevel<ArrayParams>, mal: string): NazariyaAct[] | null {
  const p = level.params;
  if (p.goal === "turn") return mal === "order-changes" ? [{ kind: "predict", same: false }] : null;
  const n = malCount(p, mal);
  if (n === null || n === p.r * p.c) return null;
  const lay: NazariyaAct = { kind: "layer", x0: p.pit.x0, z0: p.pit.z0, x1: p.pit.x0 + p.pit.c - 1, z1: p.pit.z0 + p.pit.r - 1 };
  return level.fade === 3 ? [{ kind: "name", n }] : [lay, { kind: "name", n }];
}

/** The plot for a pit (and, for "turn", the filled pit beside it). */
export function arrayPlot(goal: "fill" | "turn", r: number, c: number): ArrayParams {
  const pit: Pit = goal === "fill" ? { x0: 1, z0: 1, r, c } : { x0: c + 2, z0: 1, r: c, c: r };
  const given: Pit | null = goal === "turn" ? { x0: 1, z0: 1, r, c } : null;
  const w = goal === "fill" ? c + 2 : c + r + 3, d = (goal === "fill" ? r : Math.max(r, c)) + 2, n = w * d;
  const base = Array<number>(n).fill(1), lock = Array<number>(n).fill(1);
  for (const i of pitCells({ w }, pit)) { base[i] = 0; lock[i] = 0; }
  return { w, d, hmax: 1, base, lock, goal, r, c, pit, given };
}
function generate(req: GenRequest): Candidate<ArrayParams>[] {
  const g = req.grammar as { goal?: "fill" | "turn"; max?: number; min?: number };
  const goal = (req.goal as "fill" | "turn") ?? g.goal ?? "fill";
  const rnd = mulberry32(req.seed), out: Candidate<ArrayParams>[] = [];
  const max = g.max ?? (req.classLevel <= 4 ? 9 : 10), min = g.min ?? 2;
  for (let r = min; r <= max; r++) for (let c = min; c <= max; c++) {
    if (r === 2 && c === 2) continue;                       // 2 + 2 = 2 × 2 tells nothing apart
    if (goal === "turn" && (r === c || r + c + 3 > 16)) continue;
    if (rnd() > 0.45) continue;
    const params = arrayPlot(goal, r, c);
    out.push({ signature: `${goal}:${r}x${c}`, difficulty: Math.min(1, (r * c) / 90 + (goal === "turn" ? 0.1 : 0)), level: lvl(req, "array", goal, params, `${goal}-${r}x${c}`) });
  }
  return out;
}

function facts(level: PlayLevel<ArrayParams>, s: NzState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, rows: p.goal === "turn" ? p.c : p.r, cols: p.goal === "turn" ? p.r : p.c, blocks: built(p, s.h) };
  if (p.goal === "turn") { f.given = `${p.r}x${p.c}`; f.given_blocks = p.r * p.c; if (s.predicted !== null) f.predicted = s.predicted ? "same" : "different"; }
  if (s.named !== null) f.said = s.named;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<ArrayParams>, s: NzState) {
  const p = level.params;
  if (p.goal === "turn") return { title: "Turned array", lines: [`${p.r} rows of ${p.c} = ${p.r * p.c}`, `${p.c} rows of ${p.r} = ?`, `filled: ${pitFilled(p, s.h)}`] };
  return { title: "Fill the pit", lines: [`${p.r} rows of ${p.c}`, `filled: ${pitFilled(p, s.h)}`, ...(s.named !== null ? [`said: ${s.named}`] : [])] };
}

export const arrayLogic = makeLogic<ArrayParams>({ mode: "array", malRules: ARRAY_MAL, validate, check, name, predict, gate, afterBuild, solve, shortcut, malActs, generate, facts, board });
export const arrayHelpers = { pitCells, pitFilled, pour, zeros };
