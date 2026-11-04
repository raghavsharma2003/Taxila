// Yantra · circuit (round 7 E6, c7-science-ch03-t01 / t02). A board of parts with labelled terminals: a cell (+ cap,
// − flat end), a torch bulb on a holder (two screw terminals), sometimes a switch (two terminals, open or closed) and
// sometimes a stray part (a metal clip, which conducts, or a rubber eraser, which does not). The child draws wires from
// terminal to terminal, cuts them, flips the switch, then RUNS. The law decides; the view animates the answer.
// Goals:
//   light   make the bulb glow (t01). At fade 3 some boards start with a broken torch (a pre-wired slip) to fix.
//   switch  the bulb glows AND the switch controls it: the switch sits on the only path (t02). At fade 2-3 the level asks
//           for the switch AFTER the bulb (between the bulb and −).
// THE LAW (on RUN). Terminals are nodes; wires, a closed switch and the clip join nodes with no load between them. Then:
//   short           the cell's + and − are joined without the bulb between them: never glows (a wire straight across
//                   the cell, both cell ends on one bulb terminal, a wire across the bulb with the loop closed, …)
//   glow            + reaches one bulb terminal and − reaches the other (and no short)
//   switch_open     no glow now, but closing the switch would make it glow (a near miss)
//   not_controlled  switch goal: it glows with the switch taken out too (the switch is not on the only path)
//   switch_before   the level asked for the switch after the bulb; it sits between + and the bulb
//   open_loop       anything else that stays dark
// PURE law + generator + solver + grader. No timers, no clock, no RNG outside generate().
// Mal-rules (each a deterministic act sequence with its own signature in the run's state):
//   one-wire              one cell terminal reaches exactly one bulb terminal; the other cell end and bulb end are bare
//   both-terminals-clash  both cell terminals reach the SAME bulb terminal; the other bulb terminal is bare (a short)
//   switch-before-only    glowing and controlled, but the switch is before the bulb on a level that asked for after
//   switch-source         the bulb in a loop with the closed switch only; neither cell terminal reaches the bulb
import type { Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, YantraAct } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32, shuffle } from "../../core/rng.ts";

export type CircuitGoal = "light" | "switch";
export type PartKind = "cell" | "bulb" | "switch" | "clip" | "eraser";
export type CircuitCtx = "torch" | "cycle" | "cut";
export const CIRCUIT_CTX: readonly CircuitCtx[] = ["torch", "cycle", "cut"];
export interface CircuitPart { kind: PartKind; slot: number; flip: boolean }
export interface CircuitParams {
  goal: CircuitGoal;
  /** the context skin (words only) */
  ctx: CircuitCtx;
  /** the parts, each in a board slot 0..5 (the view lays the slots out as a 2×3 or 3×2 grid); flip = terminals swapped */
  parts: CircuitPart[];
  /** switch goal: where the switch must sit ("after" = between the bulb and −) */
  at: "any" | "after";
  /** draw the parts as circuit symbols (switch goal, fade 3) */
  sym: boolean;
  /** wires already on the board at the start (a broken torch to fix); the child may cut them */
  pre: [string, string][];
}
export type RunWhy = "short" | "open_loop" | "no_cell" | "switch_open" | "not_controlled" | "switch_before";
export interface RunResult { why: RunWhy | "glow"; wires: string[]; sw: boolean }
export interface CircuitState extends Undoable<CircuitState> {
  /** wire keys "a|b" (terminal ids sorted) */
  wires: string[];
  /** the switch is closed */
  sw: boolean;
  runs: number; done: boolean; acts: number;
  /** the last run's outcome and the board it ran on (what the view shows until the board changes) */
  last: RunResult | null;
}
export const CIRCUIT_MAL = ["one-wire", "both-terminals-clash", "switch-before-only", "switch-source"] as const;
export const TERMS: Record<PartKind, [string, string]> = { cell: ["c+", "c-"], bulb: ["b1", "b2"], switch: ["s1", "s2"], clip: ["x1", "x2"], eraser: ["x1", "x2"] };
export const MAX_WIRES = 16;
export const SLOTS = 6;

export const wireKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const wireEnds = (k: string) => k.split("|") as [string, string];
export const terminalsOf = (p: CircuitParams): string[] => p.parts.flatMap((x) => TERMS[x.kind]);
export const partOf = (p: CircuitParams, t: string): CircuitPart | undefined => p.parts.find((x) => TERMS[x.kind].includes(t));
const hasSwitch = (p: CircuitParams) => p.parts.some((x) => x.kind === "switch");
const hasClip = (p: CircuitParams) => p.parts.some((x) => x.kind === "clip");

/** the nodes joined with no load between them: wires, a closed switch (unless taken out), a clip */
function rootsOf(p: CircuitParams, wires: string[], sw: boolean, dropSwitch = false): (t: string) => string {
  const parent = new Map<string, string>();
  for (const t of terminalsOf(p)) parent.set(t, t);
  const find = (t: string): string => { let r = t; while (parent.get(r) !== r) r = parent.get(r) as string; parent.set(t, r); return r; };
  const join = (a: string, b: string) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
  for (const k of wires) { const [a, b] = wireEnds(k); if (parent.has(a) && parent.has(b)) join(a, b); }
  if (hasSwitch(p) && sw && !dropSwitch) join("s1", "s2");
  if (hasClip(p)) join("x1", "x2");
  return find;
}
const glows = (r: (t: string) => string) => r("c+") !== r("c-") && ((r("c+") === r("b1") && r("c-") === r("b2")) || (r("c+") === r("b2") && r("c-") === r("b1")));

/** THE LAW of a run: "glow" or why the bulb stays dark / the goal is not met */
export function judge(p: CircuitParams, wires: string[], sw: boolean): RunWhy | "glow" {
  const r = rootsOf(p, wires, sw);
  if (r("c+") === r("c-")) return "short";
  const g = glows(r);
  const isSw = p.goal === "switch";
  if (!g) {
    if (isSw && !sw) { const r1 = rootsOf(p, wires, true); if (r1("c+") !== r1("c-") && glows(r1)) return "switch_open"; }
    // no wire reaches the cell at all: the bulb has nothing to light it ("bijli kahan se aayegi?"), whatever the switch does
    if (!wires.some((w) => w.split("|").some((t) => t === "c+" || t === "c-"))) return "no_cell";
    return "open_loop";
  }
  if (isSw) {
    const r0 = rootsOf(p, wires, sw, true);
    if (glows(r0)) return "not_controlled";
    const before = r0("c-") === r0("b1") || r0("c-") === r0("b2");
    if (p.at === "after" && before) return "switch_before";
  }
  return "glow";
}
/** wires at a terminal */
const deg = (wires: string[], t: string) => wires.filter((k) => wireEnds(k).includes(t)).length;
/** does the board (as it is at a run) carry mal-rule `mal`'s signature? */
export function malSignature(p: CircuitParams, wires: string[], sw: boolean, mal: string): boolean {
  const r = rootsOf(p, wires, sw);
  const cells: [string, string][] = [["c+", "c-"], ["c-", "c+"]], bulbs: [string, string][] = [["b1", "b2"], ["b2", "b1"]];
  switch (mal) {
    case "one-wire":
      return cells.some(([x, ox]) => bulbs.some(([y, oy]) => r(x) === r(y) && deg(wires, ox) === 0 && deg(wires, oy) === 0 && r(x) !== r(oy) && r(x) !== r(ox)));
    case "both-terminals-clash":
      return bulbs.some(([y, oy]) => r("c+") === r(y) && r("c-") === r(y) && deg(wires, oy) === 0);
    case "switch-before-only":
      return p.goal === "switch" && p.at === "after" && judge(p, wires, sw) === "switch_before";
    case "switch-source":
      return p.goal === "switch" && sw && r("b1") === r("b2") && r("s1") === r("b1") && r("c+") !== r("b1") && r("c-") !== r("b1");
  }
  return false;
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
/** the refusal code of each dark outcome (decisive ones are a committed wrong run) */
const CODE: Record<RunWhy, string> = { short: "short", open_loop: "open", no_cell: "open", switch_open: "switch_open", not_controlled: "uncontrolled", switch_before: "wrong_side" };
export const DECISIVE = ["short", "open", "uncontrolled", "wrong_side"] as const;

function validate(level: PlayLevel<unknown>): PlayLevel<CircuitParams> | null {
  const p = level.params as Partial<CircuitParams> | null;
  if (!p || level.mode !== "circuit") return null;
  if (p.goal !== "light" && p.goal !== "switch") return null;
  if (!CIRCUIT_CTX.includes(p.ctx as CircuitCtx)) return null;
  if (!Array.isArray(p.parts) || p.parts.length < 2 || p.parts.length > 4) return null;
  const parts: CircuitPart[] = [];
  for (const x of p.parts as unknown[]) {
    const q = x as Partial<CircuitPart> | null;
    if (!q || !Object.prototype.hasOwnProperty.call(TERMS, String(q.kind)) ||!isInt(q.slot) || q.slot < 0 || q.slot >= SLOTS) return null;
    parts.push({ kind: q.kind as PartKind, slot: q.slot, flip: !!q.flip });
  }
  const kinds = parts.map((x) => x.kind);
  if (new Set(kinds).size !== kinds.length || new Set(parts.map((x) => x.slot)).size !== parts.length) return null;
  if (!kinds.includes("cell") || !kinds.includes("bulb")) return null;
  if (kinds.includes("switch") !== (p.goal === "switch")) return null;
  if (kinds.filter((k) => k === "clip" || k === "eraser").length > 1) return null;
  const at = p.goal === "switch" && p.at === "after" ? "after" : "any";
  if (p.at !== undefined && p.at !== "any" && p.at !== "after") return null;
  const base: CircuitParams = { goal: p.goal, ctx: p.ctx as CircuitCtx, parts, at, sym: p.goal === "switch" && !!p.sym, pre: [] };
  const terms = new Set(terminalsOf(base));
  const pre = p.pre ?? [];
  if (!Array.isArray(pre) || pre.length > 3) return null;
  const keys = new Set<string>();
  for (const w of pre as unknown[]) {
    if (!Array.isArray(w) || w.length !== 2) return null;
    const [a, b] = w as unknown[];
    if (typeof a !== "string" || typeof b !== "string" || a === b || !terms.has(a) || !terms.has(b)) return null;
    const k = wireKey(a, b);
    if (keys.has(k)) return null;
    keys.add(k);
    base.pre.push([a, b]);
  }
  const lv = { ...level, params: base } as PlayLevel<CircuitParams>;
  // a level that starts solved, or that its own solver cannot solve, is never served
  if (judge(base, [...keys], false) === "glow") return null;
  if (!goalMet(lv, simulate(lv, solve(lv)))) return null;
  return lv;
}
function init(level: PlayLevel<CircuitParams>): CircuitState {
  return { wires: level.params.pre.map(([a, b]) => wireKey(a, b)), sw: false, runs: 0, done: false, acts: 0, last: null, prev: null, depth: 0 };
}

function apply(level: PlayLevel<CircuitParams>, s: CircuitState, act: YantraAct, seq: number): { state: CircuitState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: CircuitState): CircuitState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const terms = terminalsOf(p);
  if (act.kind === "wire" || act.kind === "unwire") {
    const a = String(act.a), b = String(act.b);
    if (!terms.includes(a) || !terms.includes(b)) return { state: bump(s), moments: out, refused: "bad_terminal" };
    if (a === b) return { state: bump(s), moments: out, refused: "same_terminal" };
    const k = wireKey(a, b), has = s.wires.includes(k);
    if (act.kind === "wire") {
      if (has) return { state: bump(s), moments: out, refused: "already" };
      if (s.wires.length >= MAX_WIRES) return { state: bump(s), moments: out, refused: "too_many" };
      return { state: bump(pushUndo(s, { ...s, wires: [...s.wires, k] })), moments: out };
    }
    if (!has) return { state: bump(s), moments: out, refused: "no_wire" };
    return { state: bump(pushUndo(s, { ...s, wires: s.wires.filter((x) => x !== k) })), moments: out };
  }
  if (act.kind === "toggle") {
    if (!hasSwitch(p) || act.id !== "s") return { state: bump(s), moments: out, refused: "no_switch" };
    return { state: bump(pushUndo(s, { ...s, sw: !s.sw })), moments: out };
  }
  if (act.kind === "run") {
    if (!s.wires.length) return { state: bump(s), moments: out, refused: "wire_first" };
    const why = judge(p, s.wires, s.sw);
    const last: RunResult = { why, wires: [...s.wires], sw: s.sw };
    const next = bump(pushUndo(s, { ...s, runs: s.runs + 1, last }));
    const f: Facts = { goal: p.goal, wires: s.wires.length, ...(hasSwitch(p) ? { sw: s.sw ? "closed" : "open" } : {}) };
    if (why === "glow") { out.push(mom("solved", seq, { ...f, bulb: "glows" })); return { state: { ...next, done: true }, moments: out }; }
    const code = CODE[why];
    for (const mal of Object.keys(level.mal)) {
      if (malSignature(p, s.wires, s.sw, mal)) { out.push(mom("misconception_consequence", seq, { ...f, why }, mal)); return { state: next, moments: out, refused: code }; }
    }
    out.push(mom(why === "switch_open" ? "near_miss" : "law_refused", seq, { ...f, why }));
    return { state: next, moments: out, refused: code };
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<CircuitParams>, s: CircuitState) => s.done;
function simulate(level: PlayLevel<CircuitParams>, acts: YantraAct[]): CircuitState {
  let s = init(level);
  acts.forEach((a, i) => { s = apply(level, s, a, i + 1).state; });
  return s;
}

/** every wire set that solves the level from an empty board (the loop + → parts → −, each part either way round) */
function solutions(p: CircuitParams): string[][] {
  const orders: PartKind[][] = p.goal === "light" ? [["bulb"]] : p.at === "after" ? [["bulb", "switch"]] : [["switch", "bulb"], ["bulb", "switch"]];
  const out: string[][] = [];
  for (const order of orders) {
    const n = order.length;
    for (let m = 0; m < 1 << n; m++) {
      const chain = ["c+"];
      order.forEach((k, i) => { const [t0, t1] = TERMS[k]; chain.push(...((m >> i) & 1 ? [t1, t0] : [t0, t1])); });
      chain.push("c-");
      const ws: string[] = [];
      for (let i = 0; i < chain.length; i += 2) ws.push(wireKey(chain[i], chain[i + 1]));
      out.push(ws);
    }
  }
  return out;
}
/** cut what does not belong, wire what is missing, close the switch, run (the target nearest the board as it starts) */
function solve(level: PlayLevel<CircuitParams>): YantraAct[] {
  const p = level.params, start = p.pre.map(([a, b]) => wireKey(a, b));
  let best: YantraAct[] | null = null;
  for (const t of solutions(p)) {
    const acts: YantraAct[] = [];
    for (const k of start) if (!t.includes(k)) { const [a, b] = wireEnds(k); acts.push({ kind: "unwire", a, b }); }
    for (const k of t) if (!start.includes(k)) { const [a, b] = wireEnds(k); acts.push({ kind: "wire", a, b }); }
    if (hasSwitch(p)) acts.push({ kind: "toggle", id: "s" });
    acts.push({ kind: "run" });
    if (!best || acts.length < best.length) best = acts;
  }
  return best as YantraAct[];
}
const wires = (pairs: [string, string][]): YantraAct[] => pairs.map(([a, b]) => ({ kind: "wire", a, b }));
/**
 * Blind sequences a child could make without the idea of a closed loop: run as it stands; wire every terminal to every
 * other; join every terminal to the next in the order they are drawn (a ring); on a switch level, the plain bulb loop with
 * the switch left out. Each closes the switch before it runs. The law refuses all of them (a short or a switch that does
 * not control); if one ever passed, the level would not be served.
 */
function shortcut(level: PlayLevel<CircuitParams>): YantraAct[] | null {
  const p = level.params;
  const drawn = [...p.parts].sort((a, b) => a.slot - b.slot).flatMap((x) => (x.flip ? [...TERMS[x.kind]].reverse() : TERMS[x.kind]));
  const tail: YantraAct[] = [...(hasSwitch(p) ? [{ kind: "toggle", id: "s" } as YantraAct] : []), { kind: "run" }];
  const all: [string, string][] = [];
  for (let i = 0; i < drawn.length; i++) for (let j = i + 1; j < drawn.length; j++) all.push([drawn[i], drawn[j]]);
  const ring: [string, string][] = drawn.map((t, i) => [t, drawn[(i + 1) % drawn.length]]);
  const tries: YantraAct[][] = [[...tail], [...wires(all), ...tail], [...wires(ring), ...tail]];
  if (p.goal === "switch") tries.push([...wires([["c+", "b1"], ["b2", "c-"]]), ...tail], [...wires([["c+", "b2"], ["b1", "c-"]]), ...tail]);
  for (const acts of tries) if (goalMet(level, simulate(level, acts))) return acts;
  return null;
}
function malActs(level: PlayLevel<CircuitParams>, mal: string): YantraAct[] | null {
  const p = level.params, sw = hasSwitch(p), close: YantraAct[] = sw ? [{ kind: "toggle", id: "s" }] : [];
  const run: YantraAct = { kind: "run" };
  let acts: YantraAct[] | null = null;
  if (p.pre.length) {
    // a broken torch: the child holding the belief the slip shows runs it as it stands
    acts = malSignature(p, init(level).wires, sw, mal) ? [...close, run] : null;
  } else if (mal === "one-wire") acts = sw ? [...wires([["c+", "s1"], ["s2", "b1"]]), ...close, run] : [...wires([["c+", "b1"]]), run];
  else if (mal === "both-terminals-clash") acts = sw ? [...wires([["c+", "s1"], ["s2", "b1"], ["c-", "b1"]]), ...close, run] : [...wires([["c+", "b1"], ["c-", "b1"]]), run];
  else if (mal === "switch-before-only") acts = sw && p.at === "after" ? [...wires([["c+", "s1"], ["s2", "b1"], ["b2", "c-"]]), ...close, run] : null;
  else if (mal === "switch-source") acts = sw ? [...wires([["s1", "b1"], ["s2", "b2"]]), ...close, run] : null;
  if (!acts) return null;
  const end = simulate(level, acts.slice(0, -1));
  return malSignature(p, end.wires, end.sw, mal) && judge(p, end.wires, end.sw) !== "glow" ? acts : null;
}

/** the loop the current runs round when the bulb glows: terminals from + through the bulb to − (consecutive pairs are a
 *  wire or a part's own inside: a closed switch, the clip, the bulb's filament), or null when it does not glow */
export function currentLoop(p: CircuitParams, ws: string[], sw: boolean): string[] | null {
  if (judge({ ...p, goal: "light" }, ws, sw) !== "glow") return null;
  const adj = new Map<string, string[]>();
  const link = (a: string, b: string) => { adj.set(a, [...(adj.get(a) ?? []), b]); adj.set(b, [...(adj.get(b) ?? []), a]); };
  for (const k of ws) link(...wireEnds(k));
  if (hasSwitch(p) && sw) link("s1", "s2");
  if (hasClip(p)) link("x1", "x2");
  const path = (from: string, to: string): string[] | null => {
    const prev = new Map<string, string>([[from, from]]), q = [from];
    while (q.length) { const u = q.shift() as string; if (u === to) break; for (const v of adj.get(u) ?? []) if (!prev.has(v)) { prev.set(v, u); q.push(v); } }
    if (!prev.has(to)) return null;
    const out = [to]; while (out[0] !== from) out.unshift(prev.get(out[0]) as string);
    return out;
  };
  for (const [bx, by] of [["b1", "b2"], ["b2", "b1"]]) {
    const a = path("c+", bx), b = path(by, "c-");
    if (a && b) return [...a, ...b];
  }
  return null;
}

interface CircuitGrammar { goal?: CircuitGoal }
function difficultyOf(p: CircuitParams): number {
  const stray = p.parts.length > (p.goal === "switch" ? 3 : 2);
  return Math.min(1, (p.goal === "light" ? 0.25 : 0.4) + (stray ? 0.1 : 0) + (p.pre.length ? 0.15 : 0) + (p.at === "after" ? 0.15 : 0) + (p.sym ? 0.1 : 0));
}
function generate(req: GenRequest): Candidate<CircuitParams>[] {
  const g = req.grammar as CircuitGrammar;
  const goal: CircuitGoal = ((req.goal as CircuitGoal) ?? g.goal) === "switch" ? "switch" : "light";
  const rnd = mulberry32(req.seed), out: Candidate<CircuitParams>[] = [], seen = new Set<string>();
  const mk = (params: CircuitParams, sig: string): Candidate<CircuitParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `yantra-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "yantra", mode: "circuit", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: params.ctx, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  for (let k = 0; k < 60 && out.length < 18; k++) {
    const kinds: PartKind[] = goal === "switch" ? ["cell", "bulb", "switch"] : ["cell", "bulb"];
    const strayP = req.fade === 1 ? 0.4 : 0.75;
    if (rnd() < strayP) kinds.push(rnd() < 0.5 ? "clip" : "eraser");
    const slots = shuffle([0, 1, 2, 3, 4, 5], rnd);
    const parts = kinds.map((kind, i) => ({ kind, slot: slots[i], flip: rnd() < 0.5 }));
    const ctx = CIRCUIT_CTX[Math.floor(rnd() * CIRCUIT_CTX.length)];
    const at = goal === "switch" && req.fade >= 2 ? "after" : "any";
    const sym = goal === "switch" && req.fade === 3;
    let pre: [string, string][] = [];
    // fade 3 light: half the boards are a broken torch to fix (one wire only, or both cell ends on one bulb terminal)
    if (goal === "light" && req.fade === 3 && rnd() < 0.5) {
      const y = rnd() < 0.5 ? "b1" : "b2", x = rnd() < 0.5 ? "c+" : "c-";
      pre = rnd() < 0.5 ? [[x, y]] : [["c+", y], ["c-", y]];
    }
    const params: CircuitParams = { goal, ctx, parts, at, sym, pre };
    const sig = `circuit:${goal}:${at}${sym ? ":sym" : ""}:${parts.map((x) => `${x.kind[0]}${x.slot}${x.flip ? "f" : ""}`).join(",")}:${pre.map((w) => w.join("-")).join(",")}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(mk(params, sig));
  }
  return out;
}
function facts(level: PlayLevel<CircuitParams>, s: CircuitState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, wires: s.wires.length };
  if (hasSwitch(p)) f.sw = s.sw ? "closed" : "open";
  if (p.at === "after") f.at = "after";
  if (s.runs) f.runs = s.runs;
  if (s.last && s.last.why !== "glow") f.why = s.last.why;
  if (s.done) f.done = "yes";
  return f;
}
const NAME: Record<string, string> = { "c+": "cell +", "c-": "cell −", b1: "bulb 1", b2: "bulb 2", s1: "switch 1", s2: "switch 2", x1: "", x2: "" };
function board(level: PlayLevel<CircuitParams>, s: CircuitState) {
  const p = level.params, stray = p.parts.find((x) => x.kind === "clip" || x.kind === "eraser")?.kind ?? "";
  const nm = (t: string) => NAME[t] || `${stray} ${t.slice(1)}`;
  const lines = [p.parts.map((x) => x.kind).join(", ")];
  if (p.goal === "switch") lines.push(p.at === "after" ? "switch after the bulb, before −" : "the switch turns the bulb on and off");
  lines.push(...(s.wires.length ? s.wires.map((k) => wireEnds(k).map(nm).join(" — ")) : ["no wires"]));
  if (hasSwitch(p)) lines.push(`switch: ${s.sw ? "closed" : "open"}`);
  if (s.last) lines.push(`run: ${s.last.why === "glow" ? "the bulb glows" : s.last.why.replace("_", " ")}`);
  return { title: "Circuit", lines };
}
function grade(level: PlayLevel<CircuitParams>, acts: PlayActEnvelope<YantraAct>[]): PlayGrade {
  return gradeLevel(circuitLogic, level, acts, { decisiveRefusals: DECISIVE, final: true });
}

export const circuitLogic: FamilyLogic<CircuitParams, CircuitState, YantraAct> = {
  family: "yantra", modes: ["circuit"], malRules: CIRCUIT_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
