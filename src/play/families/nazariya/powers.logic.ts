// Nazariya · powers (c6-maths-ch01-t01 square and cube numbers). The first k terms stand built in a row: floors 1 × 1,
// 2 × 2, … (squares) or cubes 1, 2 × 2 × 2, … (cubes). The child says how many blocks the NEXT one takes, then builds it
// in the open bay; the world counts what was built and sets it beside the prediction.
//   square — the next square floor (s × s, one block high), s = k + 1.
//   cube   — the next cube (s × s × s).
// Fade 1: building first is allowed (the count is then read off the build). Fade 2-3: the number comes first.
// Mal-rule: square-double (squaring read as doubling: 2s; cubing as tripling: 3s), the kit's m-square-double.
import type { Candidate, Facts, GenRequest, Moment, NazariyaAct, PlayLevel } from "../../../../shared/play.ts";
import { boxActs, built, commit, idx, lvl, makeLogic, mom, plotOf, solidBox, type Applied, type NzState, type Plot } from "./grid.ts";

export interface PowersParams extends Plot { goal: "square" | "cube"; k: number; s: number; bay: { x0: number; z0: number; size: number } }
export const POWERS_MAL = ["square-double"] as const;
export const termOf = (goal: "square" | "cube", s: number) => (goal === "square" ? s * s : s * s * s);
const malCount = (p: PowersParams) => (p.goal === "square" ? 2 * p.s : 3 * p.s);
/** The child's build in the bay is exactly the next term. */
export function builtRight(p: PowersParams, h: readonly number[]): boolean {
  const b = solidBox(p, h);
  return !!b && b.a === p.s && b.b === p.s && b.hgt === (p.goal === "square" ? 1 : p.s);
}

/** The plot: terms 1..k built left to right (locked), then the open bay of side s + 1 (the only ground that takes blocks). */
export function powersPlot(goal: "square" | "cube", k: number): PowersParams {
  const s = k + 1, size = s + 1;
  let x = 1;
  const cols: { x0: number; t: number }[] = [];
  for (let t = 1; t <= k; t++) { cols.push({ x0: x, t }); x += t + 1; }
  const bay = { x0: x, z0: 1, size };
  const w = x + size + 1, d = Math.max(size, k) + 2, n = w * d;
  const base = Array<number>(n).fill(0), lock = Array<number>(n).fill(1);
  for (const c of cols) for (let z = 1; z <= c.t; z++) for (let xx = c.x0; xx < c.x0 + c.t; xx++) base[idx({ w }, xx, z)] = goal === "square" ? 1 : c.t;
  for (let z = bay.z0; z < bay.z0 + size; z++) for (let xx = bay.x0; xx < bay.x0 + size; xx++) lock[idx({ w }, xx, z)] = 0;
  return { w, d, hmax: goal === "square" ? 1 : s, base, lock, goal, k, s, bay };
}

function validate(raw: unknown): PowersParams | null {
  const r = raw as Partial<PowersParams> | null, plot = plotOf(raw);
  if (!r || !plot || (r.goal !== "square" && r.goal !== "cube")) return null;
  const k = Number(r.k);
  if (!Number.isInteger(k) || k < 1 || k > 5) return null;
  // rebuild the plot from (goal, k) and require the level's to be exactly it: the scenery is never the device's
  const p = powersPlot(r.goal, k);
  if (p.w !== plot.w || p.d !== plot.d || p.hmax !== plot.hmax || p.base.some((v, i) => v !== plot.base[i]) || p.lock.some((v, i) => v !== plot.lock[i])) return null;
  if (p.w > 16 || p.d > 16 || malCount(p) === termOf(p.goal, p.s)) return null;
  return p;
}

function name(level: PlayLevel<PowersParams>, s: NzState, n: number, seq: number): Applied {
  const p = level.params, key = termOf(p.goal, p.s);
  if (n === key) {
    const out: Moment[] = [mom("prediction_committed", seq, { said: n })];
    if (builtRight(p, s.h)) { out.push(mom("solved", seq, { side: p.s, blocks: key })); return { state: commit(s, { ...s, named: n, done: true }), moments: out }; }
    return { state: commit(s, { ...s, named: n }), moments: out };
  }
  const next = commit(s, { ...s, named: n });
  if (Object.keys(level.mal).includes("square-double") && n === malCount(p)) return { state: next, moments: [mom("misconception_consequence", seq, { said: n, side: p.s, goal: p.goal }, "square-double")], refused: "wrong_count" };
  return { state: next, moments: [mom("law_refused", seq, { said: n, side: p.s, why: "count_again" })], refused: "wrong_count" };
}
function check(level: PlayLevel<PowersParams>, s: NzState, seq: number): Applied {
  const p = level.params, key = termOf(p.goal, p.s), bumped = { ...s, acts: s.acts + 1 };
  const b = solidBox(p, s.h), blocks = built(p, s.h);
  if (!builtRight(p, s.h)) return { state: bumped, moments: [mom("law_refused", seq, { blocks, why: b ? "not_the_next" : "not_solid" })], refused: "mismatch" };
  if (s.named === key) return { state: commit(s, { ...s, done: true }), moments: [mom("prediction_confirmed", seq, { said: key, blocks: key }), mom("solved", seq, { side: p.s, blocks: key })] };
  if (s.named === null) return { state: bumped, moments: [mom("law_refused", seq, { blocks, why: "say_how_many" })], refused: "say_first" };
  return { state: bumped, moments: [mom("prediction_violated", seq, { said: s.named, blocks: key })], refused: "say_again" };
}
function gate(level: PlayLevel<PowersParams>, s: NzState, act: NazariyaAct): string | null {
  const build = act.kind === "place" || act.kind === "remove" || act.kind === "layer" || act.kind === "clear";
  return build && level.fade >= 2 && s.named === null ? "say_first" : null;
}

const bayBox = (p: PowersParams) => ({ x0: p.bay.x0, z0: p.bay.z0, a: p.s, b: p.s, hgt: p.goal === "square" ? 1 : p.s });
function solve(level: PlayLevel<PowersParams>): NazariyaAct[] | null {
  const p = level.params;
  return [{ kind: "name", n: termOf(p.goal, p.s) }, ...boxActs(bayBox(p)), { kind: "check" }];
}
/** Without the idea: the last term again, the bay filled to the brim. Neither may pass. */
function shortcut(level: PlayLevel<PowersParams>): NazariyaAct[] | null {
  const p = level.params, key = termOf(p.goal, p.s);
  const tries = [{ ...bayBox(p), a: p.k, b: p.k, hgt: p.goal === "square" ? 1 : p.k }, { ...bayBox(p), a: p.bay.size, b: p.bay.size, hgt: p.hmax }];
  for (const t of tries) {
    const acts: NazariyaAct[] = [{ kind: "name", n: termOf(p.goal, t.a) }, ...boxActs(t), { kind: "check" }];
    let st = powersLogic.init(level);
    acts.forEach((a, i) => { st = powersLogic.apply(level, st, a, i + 1).state; });
    if (st.done && t.a !== p.s && key) return acts;
  }
  return null;
}
function malActs(level: PlayLevel<PowersParams>, mal: string): NazariyaAct[] | null {
  return mal === "square-double" ? [{ kind: "name", n: malCount(level.params) }] : null;
}
function generate(req: GenRequest): Candidate<PowersParams>[] {
  const g = req.grammar as { goal?: "square" | "cube"; ks?: number[] };
  const goal = (req.goal as "square" | "cube") ?? g.goal ?? "square";
  const ks = g.ks ?? (goal === "square" ? [2, 3, 4] : [1, 2, 3]);
  return ks.filter((k) => { const p = powersPlot(goal, k); return p.w <= 16 && p.d <= 16; }).map((k) => {
    const params = powersPlot(goal, k);
    return { signature: `${goal}:${k}`, difficulty: Math.min(1, (goal === "cube" ? 0.25 : 0.05) + 0.15 * k), level: lvl(req, "powers", goal, params, `${goal}-${k}`) };
  });
}
function facts(level: PlayLevel<PowersParams>, s: NzState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, terms: Array.from({ length: p.k }, (_, i) => termOf(p.goal, i + 1)).join(","), next_side: p.s };
  if (s.named !== null) f.said = s.named;
  if (level.fade === 1 || s.done) f.blocks = built(p, s.h);
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<PowersParams>, s: NzState) {
  const p = level.params, seq = Array.from({ length: p.k }, (_, i) => termOf(p.goal, i + 1));
  return { title: p.goal === "square" ? "Square numbers" : "Cube numbers", lines: [`${seq.join(", ")}, ?`, `next side: ${p.s}`, ...(s.named !== null ? [`said: ${s.named}`] : [])] };
}

export const powersLogic = makeLogic<PowersParams>({ mode: "powers", malRules: POWERS_MAL, validate, check, name, gate, solve, shortcut, malActs, generate, facts, board });
