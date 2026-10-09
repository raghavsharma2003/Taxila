// Taraazu · balance (DESIGN.md §3.2). Two pans; unit cubes; mystery bags each holding x cubes (x hidden; the beam's tilt
// comes from the true x). Taking from one side tips the beam; the bag opens only when it sits alone on a level scale.
// Equality mode (c4-c5, the relational "="): fill the empty box so the beam levels. PURE law + generator + solver + grader.
//
// Scope (RESEARCH.md §3.5): positive terms, positive integer solutions. Mal-rules: one-side · move-no-change ·
// answer-next · use-all-numbers.
import type { BalanceAct, Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export interface Pan { bags: number; units: number }
/** equation: L = a·x + b, R = c·x + d. equality: L = sum of `parts`, R = box + `units`. */
export interface BalanceParams { goal: "solve" | "fill"; L: Pan; R: Pan; x: number; parts?: number[] }
export interface BalanceState extends Undoable<BalanceState> {
  L: Pan; R: Pan;
  box: number | null;                 // fill mode
  opened: boolean;
  named: number | null;
  oneSided: boolean;                  // the last take left the scale tipped (a one-sided change)
  done: boolean;
  acts: number;
}
export const BALANCE_MAL = ["one-side", "move-no-change", "answer-next", "use-all-numbers"] as const;

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
export const weight = (p: Pan, x: number) => p.bags * x + p.units;
export function tilt(level: PlayLevel<BalanceParams>, s: BalanceState): number {
  const x = level.params.x;
  if (level.params.goal === "fill") { const l = (level.params.parts ?? []).reduce((a, b) => a + b, 0); return Math.sign((s.box ?? 0) + s.R.units - l) * -1; }
  return Math.sign(weight(s.L, x) - weight(s.R, x));   // +1 = left heavier (left pan down)
}
export const eqText = (p: Pan, v = "x") => [p.bags ? `${p.bags === 1 ? "" : p.bags}${v}` : "", p.units ? String(p.units) : ""].filter(Boolean).join(" + ") || "0";
const lone = (s: BalanceState) => (s.L.bags === 1 && s.L.units === 0 && s.R.bags === 0) || (s.R.bags === 1 && s.R.units === 0 && s.L.bags === 0);

function validate(level: PlayLevel<unknown>): PlayLevel<BalanceParams> | null {
  const p = level.params as Partial<BalanceParams> | null;
  if (!p || (p.goal !== "solve" && p.goal !== "fill")) return null;
  const pan = (q: unknown): Pan | null => { const o = q as Pan; return o && Number.isInteger(o.bags) && Number.isInteger(o.units) && o.bags >= 0 && o.units >= 0 && o.bags <= 4 && o.units <= 30 ? { bags: o.bags, units: o.units } : null; };
  const L = pan(p.L), R = pan(p.R), x = Number(p.x);
  if (!L || !R || !Number.isInteger(x) || x < 1 || x > 20) return null;
  if (p.goal === "solve") {
    if (weight(L, x) !== weight(R, x) || L.bags + R.bags === 0 || L.bags === R.bags) return null;
    return { ...level, params: { goal: "solve", L, R, x } } as PlayLevel<BalanceParams>;
  }
  const parts = Array.isArray(p.parts) ? p.parts.map(Number).filter((v) => Number.isInteger(v) && v > 0 && v <= 30) : [];
  if (parts.length < 2 || L.bags || R.bags) return null;
  if (parts.reduce((a, b) => a + b, 0) !== x + R.units) return null;     // x is the box's value
  return { ...level, params: { goal: "fill", L: { bags: 0, units: parts.reduce((a, b) => a + b, 0) }, R, x, parts } } as PlayLevel<BalanceParams>;
}
function init(level: PlayLevel<BalanceParams>): BalanceState {
  const p = level.params;
  return { L: { ...p.L }, R: { ...p.R }, box: p.goal === "fill" ? null : null, opened: false, named: null, oneSided: false, done: false, acts: 0, prev: null, depth: 0 };
}

function apply(level: PlayLevel<BalanceParams>, s: BalanceState, act: BalanceAct, seq: number): { state: BalanceState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: BalanceState): BalanceState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const facts = (st: BalanceState): Facts => ({ left: eqText(st.L), right: eqText(st.R), tilt: tilt(level, st) });
  switch (act.kind) {
    case "take": {
      if (p.goal !== "solve") return { state: bump(s), moments: out, refused: "no_take_here" };
      const side = act.side === "L" ? "L" : act.side === "R" ? "R" : null;
      if (!side || (act.what !== "unit" && act.what !== "bag")) return { state: bump(s), moments: out, refused: "bad_take" };
      const pan = s[side], key = act.what === "unit" ? "units" : "bags";
      if (pan[key] <= 0) return { state: bump(s), moments: out, refused: "empty" };
      const nextPan = { ...pan, [key]: pan[key] - 1 };
      const next = { ...s, [side]: nextPan } as BalanceState;
      const t = tilt(level, next), was = tilt(level, s);
      next.oneSided = t !== 0;
      if (t !== 0 && was === 0) out.push(mom("law_refused", seq, { ...facts(next), why: "tipped" }));
      else out.push(mom("progress", seq, facts(next)));
      return { state: bump(pushUndo(s, next)), moments: out };
    }
    case "group": {
      if (p.goal !== "solve") return { state: bump(s), moments: out, refused: "no_group_here" };
      const k = Math.round(Number(act.k));
      const all = [s.L.bags, s.L.units, s.R.bags, s.R.units];
      if (!Number.isInteger(k) || k < 2 || all.some((v) => v % k !== 0)) { out.push(mom("law_refused", seq, { why: "not_equal_groups", k })); return { state: bump(s), moments: out, refused: "not_equal_groups" }; }
      const next = { ...s, L: { bags: s.L.bags / k, units: s.L.units / k }, R: { bags: s.R.bags / k, units: s.R.units / k } };
      out.push(mom("progress", seq, { ...facts(next), groups: k }));
      return { state: bump(pushUndo(s, next)), moments: out };
    }
    case "open": {
      if (p.goal !== "solve") return { state: bump(s), moments: out, refused: "no_bag" };
      if (tilt(level, s) !== 0) {
        if (s.oneSided) { out.push(mom("misconception_consequence", seq, { ...facts(s), why: "tipped_scale" }, "one-side")); return { state: bump(s), moments: out, refused: "tipped" }; }
        out.push(mom("law_refused", seq, { ...facts(s), why: "tipped" })); return { state: bump(s), moments: out, refused: "tipped" };
      }
      if (!lone(s)) { out.push(mom("law_refused", seq, { ...facts(s), why: "not_alone" })); return { state: bump(s), moments: out, refused: "not_alone" }; }
      out.push(mom("progress", seq, { opened: "yes", inside: p.x }));
      return { state: bump(pushUndo(s, { ...s, opened: true })), moments: out };
    }
    case "name": {
      if (p.goal !== "solve") return { state: bump(s), moments: out, refused: "no_name_here" };
      const v = Math.round(Number(act.x));
      if (level.fade === 1 && !s.opened) return { state: bump(s), moments: out, refused: "open_first" };
      if (v === p.x) { out.push(mom("solved", seq, { x: v, equation: `${eqText(p.L)} = ${eqText(p.R)}` })); return { state: bump(pushUndo(s, { ...s, named: v, done: true })), moments: out }; }
      // transposition without changing the operation: a·x + b = d → x = (d + b) / a  (or c·x moved as +)
      const a = p.L.bags - p.R.bags, b = p.L.units, d = p.R.units;
      const moved = a !== 0 ? (d + b) / Math.abs(a) : NaN;
      if (Number.isInteger(moved) && v === moved && moved !== p.x) out.push(mom("misconception_consequence", seq, { named: v }, "move-no-change"));
      else out.push(mom("law_refused", seq, { named: v, why: "check_it" }));
      return { state: bump(s), moments: out, refused: "wrong_value" };
    }
    case "drop": {
      if (p.goal !== "fill") return { state: bump(s), moments: out, refused: "no_box" };
      const n = Math.round(Number(act.n));
      if (!Number.isInteger(n) || n < 0 || n > 60) return { state: bump(s), moments: out, refused: "bad_drop" };
      const next = { ...s, box: n };
      const t = tilt(level, next), sum = (p.parts ?? []).reduce((q, r) => q + r, 0);
      if (t === 0) { out.push(mom("solved", seq, { box: n, left: (p.parts ?? []).join(" + "), right: `${n} + ${p.R.units}` })); return { state: bump(pushUndo(s, { ...next, done: true })), moments: out }; }
      if (n === sum && sum !== p.x) out.push(mom("misconception_consequence", seq, { box: n }, "answer-next"));
      else if (n === sum + p.R.units) out.push(mom("misconception_consequence", seq, { box: n }, "use-all-numbers"));
      else out.push(mom(Math.abs(n - p.x) === 1 ? "near_miss" : "law_refused", seq, { box: n, tilt: t, why: "not_level" }));
      return { state: bump(pushUndo(s, next)), moments: out, refused: "not_level" };
    }
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<BalanceParams>, s: BalanceState) => s.done;

/** Breadth-first search over (L, R) with the legal both-side moves; returns the shortest act list. */
function solve(level: PlayLevel<BalanceParams>): BalanceAct[] | null {
  const p = level.params;
  if (p.goal === "fill") return [{ kind: "drop", n: p.x }];
  type N = { L: Pan; R: Pan; path: BalanceAct[] };
  const key = (n: N) => `${n.L.bags},${n.L.units},${n.R.bags},${n.R.units}`;
  const q: N[] = [{ L: p.L, R: p.R, path: [] }], seen = new Set([key(q[0])]);
  while (q.length) {
    const n = q.shift()!;
    const st = { L: n.L, R: n.R } as BalanceState;
    if (lone(st)) return [...n.path, { kind: "open" }, { kind: "name", x: p.x }];
    const moves: { L: Pan; R: Pan; acts: BalanceAct[] }[] = [];
    if (n.L.units > 0 && n.R.units > 0) moves.push({ L: { ...n.L, units: n.L.units - 1 }, R: { ...n.R, units: n.R.units - 1 }, acts: [{ kind: "take", side: "L", what: "unit" }, { kind: "take", side: "R", what: "unit" }] });
    if (n.L.bags > 0 && n.R.bags > 0) moves.push({ L: { ...n.L, bags: n.L.bags - 1 }, R: { ...n.R, bags: n.R.bags - 1 }, acts: [{ kind: "take", side: "L", what: "bag" }, { kind: "take", side: "R", what: "bag" }] });
    for (let k = 2; k <= 6; k++) if ([n.L.bags, n.L.units, n.R.bags, n.R.units].every((v) => v % k === 0)) moves.push({ L: { bags: n.L.bags / k, units: n.L.units / k }, R: { bags: n.R.bags / k, units: n.R.units / k }, acts: [{ kind: "group", k }] });
    for (const m of moves) { const nn = { L: m.L, R: m.R, path: [...n.path, ...m.acts] }; const k = key(nn); if (!seen.has(k)) { seen.add(k); q.push(nn); } }
  }
  return null;
}
/** Shortcuts: opening or naming before isolating (fade 1), dropping the left side's sum (fill). */
function shortcut(level: PlayLevel<BalanceParams>): BalanceAct[] | null {
  const p = level.params;
  const tries: BalanceAct[][] = p.goal === "fill" ? [[{ kind: "drop", n: (p.parts ?? []).reduce((a, b) => a + b, 0) }]] : [[{ kind: "open" }, { kind: "name", x: p.x }]];
  for (const t of tries) { let s = init(level); for (const a of t) s = apply(level, s, a, 1).state; if (s.done && !(p.goal === "solve" && level.fade >= 2)) return t; }
  return null;
}
function malActs(level: PlayLevel<BalanceParams>, mal: string): BalanceAct[] | null {
  const p = level.params;
  if (p.goal === "fill") {
    const sum = (p.parts ?? []).reduce((a, b) => a + b, 0);
    if (mal === "answer-next") return [{ kind: "drop", n: sum }];
    if (mal === "use-all-numbers") return [{ kind: "drop", n: sum + p.R.units }];
    return null;
  }
  if (mal === "one-side") {
    const side = p.L.units > 0 ? "L" : p.R.units > 0 ? "R" : null;
    return side ? [{ kind: "take", side, what: "unit" }, { kind: "open" }] : null;
  }
  if (mal === "move-no-change" && level.fade >= 2) {
    const a = p.L.bags - p.R.bags, moved = a !== 0 ? (p.R.units + p.L.units) / Math.abs(a) : NaN;
    return Number.isInteger(moved) && moved !== p.x ? [{ kind: "name", x: moved }] : null;
  }
  return null;
}

function difficultyOf(p: BalanceParams): number {
  if (p.goal === "fill") return Math.min(1, 0.1 + 0.02 * (p.parts ?? []).reduce((a, b) => a + b, 0));
  const steps = (p.L.bags > 1 || p.R.bags > 1 ? 0.25 : 0) + (p.R.bags > 0 && p.L.bags > 0 ? 0.25 : 0) + (p.L.units > 0 && p.R.units > 0 ? 0.15 : 0);
  return Math.min(1, 0.1 + steps + 0.015 * (p.L.units + p.R.units));
}
function generate(req: GenRequest): Candidate<BalanceParams>[] {
  const g = req.grammar as { maxX?: number; maxBags?: number; bothSides?: boolean; goal?: "solve" | "fill" };
  const goal = (req.goal as "solve" | "fill") ?? g.goal ?? "solve";
  const rnd = mulberry32(req.seed), out: Candidate<BalanceParams>[] = [];
  const mk = (params: BalanceParams, sig: string): Candidate<BalanceParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `bal-${sig}-${req.seed}`.replace(/[^a-z0-9:=+._-]/gi, "_"), family: "taraazu", mode: goal === "fill" ? "equality" : "equation", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "taraazu", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 0, solutions: 0, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  if (goal === "fill") {
    for (let a = 2; a <= 9; a++) for (let b = 1; b <= 9; b++) for (let c = 1; c <= 9; c++) {
      const x = a + b - c;
      if (x < 1 || rnd() > 0.4) continue;
      out.push(mk({ goal, L: { bags: 0, units: a + b }, R: { bags: 0, units: c }, x, parts: [a, b] }, `fill:${a}+${b}=_+${c}`));
    }
    return out;
  }
  const maxX = g.maxX ?? (req.classLevel <= 6 ? 9 : 12), maxBags = g.maxBags ?? (req.classLevel <= 6 ? 2 : 3);
  for (let x = 2; x <= maxX; x++) for (let a = 1; a <= maxBags; a++) for (let c = 0; c < a; c++) {
    if (g.bothSides === false && c > 0) continue;
    for (let b = 0; b <= 12; b++) {
      const d = (a - c) * x + b;
      if (d > 30 || d === 0 || rnd() > 0.35) continue;
      const params: BalanceParams = { goal, L: { bags: a, units: b }, R: { bags: c, units: d }, x };
      out.push(mk(params, `${a}x+${b}=${c}x+${d}`));
    }
  }
  return out;
}
function facts(level: PlayLevel<BalanceParams>, s: BalanceState): Facts {
  const p = level.params;
  if (p.goal === "fill") return { left: (p.parts ?? []).join(" + "), right: `${s.box ?? "□"} + ${p.R.units}`, tilt: tilt(level, s), ...(s.done ? { done: "yes" } : {}) };
  const f: Facts = { left: eqText(s.L), right: eqText(s.R), tilt: tilt(level, s) };
  if (level.fade >= 2) f.equation = `${eqText(s.L)} = ${eqText(s.R)}`;
  if (s.opened) f.bag = p.x;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<BalanceParams>, s: BalanceState) {
  const p = level.params;
  return p.goal === "fill" ? { title: "Barabar karo", lines: [`${(p.parts ?? []).join(" + ")} = □ + ${p.R.units}`] }
    : { title: "Taraazu", lines: [`${eqText(p.L)} = ${eqText(p.R)}`, `abhi: ${eqText(s.L)} = ${eqText(s.R)}`] };
}
function grade(level: PlayLevel<BalanceParams>, acts: PlayActEnvelope<BalanceAct>[]): PlayGrade {
  return gradeLevel(balanceLogic, level, acts, { decisiveRefusals: ["wrong_value", "not_level"], final: true });
}

export const balanceLogic: FamilyLogic<BalanceParams, BalanceState, BalanceAct> = {
  family: "taraazu", modes: ["equation", "equality"], malRules: BALANCE_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
export const balanceHelpers = { weight, tilt, eqText, lone };
