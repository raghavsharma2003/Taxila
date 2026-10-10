// Nazariya · the block plot every Khand mode shares (round 4, stream G2; docs/design/round4/build/khand/DESIGN.md).
//
// The world is a bounded plot of w × d columns. A build is a HEIGHT MAP: blocks rest on the ground or on a block (the law
// keeps gravity, so a build is never a floating set; Khand drops a block placed on a side face onto that column's top).
// Some columns are LOCKED: given scenery the child cannot change (the paving round a pit, the given half of a mirror build,
// the cubes of a sequence already built). Every number, view and key is computed here, by code; the engine only draws it.
//
// PURE: no clock, no RNG after generation (generators take a seeded mulberry32), runs in node and the browser.
import type { Facts, FamilyLogic, GenRequest, Candidate, Moment, NazariyaAct, PlayActEnvelope, PlayGrade, PlayLevel, PlayMode } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";

export const MAX_SIDE = 16;
export const MAX_H = 6;

/** The plot every mode carries in its params. `base` = the starting heights; `lock[i] = 1` = column i is scenery. */
export interface Plot { w: number; d: number; hmax: number; base: number[]; lock: number[] }
export interface NzState extends Undoable<NzState> {
  h: number[];
  /** the last number the child named (array count, a square / cube number) */
  named: number | null;
  /** the child's prediction (array "turn": the turned pit takes the same number of blocks?) */
  predicted: boolean | null;
  checks: number;
  done: boolean;
  acts: number;
}

export const idx = (p: { w: number }, x: number, z: number) => z * p.w + x;
export const inside = (p: { w: number; d: number }, x: number, z: number) => Number.isInteger(x) && Number.isInteger(z) && x >= 0 && z >= 0 && x < p.w && z < p.d;
export const sum = (a: readonly number[]) => a.reduce((s, v) => s + v, 0);
export const same = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
export const zeros = (n: number) => new Array<number>(n).fill(0);
/** Blocks the child added (heights above the locked scenery are never counted twice: locked columns never change). */
export const built = (p: Plot, h: readonly number[]) => sum(h.map((v, i) => (p.lock[i] ? 0 : v - p.base[i])));

// ───────────────────────────── projections (the law's "views") ─────────────────────────────

/** Top view: which columns hold at least one block (row-major, z rows of w). */
export const topView = (p: { w: number; d: number }, h: readonly number[]) => h.map((v) => (v > 0 ? 1 : 0));
/** Front view, seen from in front of row z = 0 looking along +z: the silhouette height over each x. */
export function frontView(p: { w: number; d: number }, h: readonly number[]): number[] {
  const out = zeros(p.w);
  for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) out[x] = Math.max(out[x], h[z * p.w + x]);
  return out;
}
/** Side view, seen from beyond column x = w - 1 looking along −x: the silhouette height over each z. */
export function sideView(p: { w: number; d: number }, h: readonly number[]): number[] {
  const out = zeros(p.d);
  for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) out[z] = Math.max(out[z], h[z * p.w + x]);
  return out;
}

/** The cells the child built on, as an axis-aligned box if they form one exactly: every listed column at height `hgt`. */
export interface Box { x0: number; z0: number; a: number; b: number; hgt: number }
/** The child's columns (unlocked, above base) as one solid box, or null. a = extent along x, b = along z. */
export function solidBox(p: Plot, h: readonly number[]): Box | null {
  let x0 = Infinity, z0 = Infinity, x1 = -1, z1 = -1, hgt = -1, n = 0;
  for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) {
    const i = z * p.w + x; if (p.lock[i]) continue;
    const v = h[i] - p.base[i]; if (v <= 0) continue;
    if (hgt === -1) hgt = v; else if (v !== hgt) return null;
    x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); n++;
  }
  if (n === 0) return null;
  const a = x1 - x0 + 1, b = z1 - z0 + 1;
  return a * b === n ? { x0, z0, a, b, hgt } : null;
}
/** Is the set of columns with height > 0 (unlocked) one piece (4-connected)? */
export function connected(p: Plot, h: readonly number[]): boolean {
  const cells: number[] = [];
  for (let i = 0; i < h.length; i++) if (!p.lock[i] && h[i] - p.base[i] > 0) cells.push(i);
  if (!cells.length) return false;
  const on = new Set(cells), seen = new Set([cells[0]]), q = [cells[0]];
  while (q.length) {
    const i = q.pop() as number, x = i % p.w, z = (i - x) / p.w;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz; if (!inside(p, nx, nz)) continue;
      const j = nz * p.w + nx; if (on.has(j) && !seen.has(j)) { seen.add(j); q.push(j); }
    }
  }
  return seen.size === cells.length;
}

// ───────────────────────────── validation ─────────────────────────────

export function plotOf(raw: unknown): Plot | null {
  const p = raw as Partial<Plot> | null;
  if (!p) return null;
  const w = Number(p.w), d = Number(p.d), hmax = Number(p.hmax);
  if (!Number.isInteger(w) || !Number.isInteger(d) || w < 1 || d < 1 || w > MAX_SIDE || d > MAX_SIDE) return null;
  if (!Number.isInteger(hmax) || hmax < 1 || hmax > MAX_H) return null;
  const n = w * d;
  if (!Array.isArray(p.base) || !Array.isArray(p.lock) || p.base.length !== n || p.lock.length !== n) return null;
  const base = p.base.map(Number), lock = p.lock.map(Number);
  if (base.some((v) => !Number.isInteger(v) || v < 0 || v > MAX_H) || lock.some((v) => v !== 0 && v !== 1)) return null;
  // an unlocked column starts within the cap (the child must be able to work on it)
  if (base.some((v, i) => !lock[i] && v > hmax)) return null;
  return { w, d, hmax, base, lock };
}
export const intArr = (a: unknown, n: number, lo: number, hi: number): number[] | null => {
  if (!Array.isArray(a) || a.length !== n) return null;
  const out = a.map(Number);
  return out.every((v) => Number.isInteger(v) && v >= lo && v <= hi) ? out : null;
};

// ───────────────────────────── the factory: one law for every mode ─────────────────────────────

export type Applied = { state: NzState; moments: Moment[]; refused?: string };
export const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

/** What a mode adds to the shared build law. */
export interface ModeSpec<P extends Plot> {
  mode: PlayMode;
  malRules: readonly string[];
  validate(raw: unknown, level: PlayLevel<unknown>): P | null;
  /** the outcome of a "check" (the commit): solved, a mal-rule's signature, a near miss, or a plain mismatch */
  check(level: PlayLevel<P>, s: NzState, seq: number): Applied;
  /** a named number (array count, square / cube number); absent = the mode refuses "name" */
  name?(level: PlayLevel<P>, s: NzState, n: number, seq: number): Applied;
  /** a same / not-same prediction; absent = refused */
  predict?(level: PlayLevel<P>, s: NzState, same: boolean, seq: number): Applied;
  /** a build act the mode refuses in this state (e.g. "predict first"), or null */
  gate?(level: PlayLevel<P>, s: NzState, act: NazariyaAct): string | null;
  /** after a legal build act (e.g. the array pit filled → solved at fade 1-2 needs a name; nothing by default) */
  afterBuild?(level: PlayLevel<P>, s: NzState, seq: number): Moment[];
  solve(level: PlayLevel<P>): NazariyaAct[] | null;
  shortcut(level: PlayLevel<P>): NazariyaAct[] | null;
  malActs(level: PlayLevel<P>, mal: string): NazariyaAct[] | null;
  generate(req: GenRequest): Candidate<P>[];
  facts(level: PlayLevel<P>, s: NzState): Facts;
  board(level: PlayLevel<P>, s: NzState): { title: string; lines: string[] };
}

export const DECISIVE_REFUSALS = ["mismatch", "wrong_count", "wrong_prediction"] as const;

export function initState(p: Plot): NzState {
  return { h: [...p.base], named: null, predicted: null, checks: 0, done: false, acts: 0, prev: null, depth: 0 };
}
export const bumpOf = (s: NzState) => (st: NzState): NzState => ({ ...st, acts: s.acts + 1 });
/** The next state after a change (undoable). */
export const commit = (s: NzState, next: Omit<NzState, "prev" | "depth" | "acts">): NzState => ({ ...pushUndo(s, { ...next, acts: s.acts } as NzState), acts: s.acts + 1 });

/** Rectangle cells (inclusive corners, any order), bounded to the plot. */
export function rectCells(p: Plot, x0: number, z0: number, x1: number, z1: number): number[] | null {
  if (![x0, z0, x1, z1].every((v) => Number.isInteger(v))) return null;
  const ax = Math.max(0, Math.min(x0, x1)), bx = Math.min(p.w - 1, Math.max(x0, x1));
  const az = Math.max(0, Math.min(z0, z1)), bz = Math.min(p.d - 1, Math.max(z0, z1));
  if (ax > bx || az > bz) return null;
  const out: number[] = [];
  for (let z = az; z <= bz; z++) for (let x = ax; x <= bx; x++) out.push(z * p.w + x);
  return out;
}

export function makeLogic<P extends Plot>(spec: ModeSpec<P>): FamilyLogic<P, NzState, NazariyaAct> {
  function apply(level: PlayLevel<P>, s: NzState, act: NazariyaAct, seq: number): Applied {
    const p = level.params, out: Moment[] = [];
    if (s.done) return { state: s, moments: [], refused: "level_over" };
    const bump = bumpOf(s);
    if (!act || typeof act !== "object") return { state: bump(s), moments: [], refused: "bad_act" };
    if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
    if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
    const gate = spec.gate?.(level, s, act) ?? null;
    if (gate) { out.push(mom("law_refused", seq, { why: gate })); return { state: bump(s), moments: out, refused: gate }; }
    const built1 = (h: number[], why: string): Applied => {
      const next = commit(s, { ...s, h });
      out.push(mom("progress", seq, { blocks: built(p, h), act: why }));
      out.push(...(spec.afterBuild?.(level, next, seq) ?? []));
      return { state: next, moments: out };
    };
    switch (act.kind) {
      case "place": case "remove": {
        const x = Number(act.x), z = Number(act.z);
        if (!inside(p, x, z)) return { state: bump(s), moments: out, refused: "bad_cell" };
        const i = idx(p, x, z);
        if (p.lock[i]) { out.push(mom("law_refused", seq, { why: "locked" })); return { state: bump(s), moments: out, refused: "locked" }; }
        if (act.kind === "place") {
          if (s.h[i] >= p.hmax) { out.push(mom("law_refused", seq, { why: "too_high", hmax: p.hmax })); return { state: bump(s), moments: out, refused: "too_high" }; }
          const h = [...s.h]; h[i]++; return built1(h, "place");
        }
        if (s.h[i] <= 0) return { state: bump(s), moments: out, refused: "empty" };
        const h = [...s.h]; h[i]--; return built1(h, "remove");
      }
      case "layer": case "clear": {
        const cells = rectCells(p, Number(act.x0), Number(act.z0), Number(act.x1), Number(act.z1));
        if (!cells) return { state: bump(s), moments: out, refused: "bad_rect" };
        const h = [...s.h]; let n = 0;
        for (const i of cells) {
          if (p.lock[i]) continue;
          if (act.kind === "layer" && h[i] < p.hmax) { h[i]++; n++; }
          if (act.kind === "clear" && h[i] > 0) { h[i]--; n++; }
        }
        if (!n) { out.push(mom("law_refused", seq, { why: act.kind === "layer" ? "nothing_to_lay" : "nothing_to_clear" })); return { state: bump(s), moments: out, refused: "no_change" }; }
        return built1(h, act.kind);
      }
      case "check": {
        if (built(p, s.h) === 0 && !spec.name) { out.push(mom("law_refused", seq, { why: "build_first" })); return { state: bump(s), moments: out, refused: "build_first" }; }
        const r = spec.check(level, { ...s, checks: s.checks + 1 }, seq);
        return { ...r, moments: [...out, ...r.moments] };
      }
      case "name": {
        if (!spec.name) return { state: bump(s), moments: out, refused: "no_name_here" };
        const n = Math.round(Number(act.n));
        if (!Number.isInteger(n) || n < 0 || n > 9999) return { state: bump(s), moments: out, refused: "bad_number" };
        const r = spec.name(level, s, n, seq);
        return { ...r, moments: [...out, ...r.moments] };
      }
      case "predict": {
        if (!spec.predict || typeof act.same !== "boolean") return { state: bump(s), moments: out, refused: "no_predict_here" };
        const r = spec.predict(level, s, act.same, seq);
        return { ...r, moments: [...out, ...r.moments] };
      }
    }
    return { state: bump(s), moments: out, refused: "unknown_act" };
  }
  const logic: FamilyLogic<P, NzState, NazariyaAct> = {
    family: "nazariya", modes: [spec.mode], malRules: spec.malRules,
    validate(level) {
      if (!level || level.family !== "nazariya" || level.mode !== spec.mode) return null;
      const p = spec.validate(level.params, level);
      return p ? ({ ...level, params: p } as PlayLevel<P>) : null;
    },
    init: (level) => initState(level.params),
    apply, goalMet: (_l, s) => s.done,
    generate: spec.generate, solve: spec.solve, shortcut: spec.shortcut, malActs: spec.malActs,
    grade(level: PlayLevel<P>, acts: PlayActEnvelope<NazariyaAct>[]): PlayGrade {
      return gradeLevel(logic, level, acts, { decisiveRefusals: DECISIVE_REFUSALS, final: true });
    },
    facts: spec.facts, board: spec.board,
  };
  return logic;
}

// ───────────────────────────── helpers shared by the modes ─────────────────────────────

/** Run an act list from the start (the shortcut and mal-rule searches; never on the live path). */
export function runActs<P extends Plot>(logic: FamilyLogic<P, NzState, NazariyaAct>, level: PlayLevel<P>, acts: NazariyaAct[]): NzState {
  let s = logic.init(level);
  acts.forEach((a, i) => { s = logic.apply(level, s, a, i + 1).state; });
  return s;
}
/** The acts that turn the plot's start into heights `target` (unlocked columns only): one layer per full rectangle row
 *  run where possible, else single places / removes. The shortest is not needed: a solution, deterministic. */
export function buildActs(p: Plot, target: readonly number[]): NazariyaAct[] {
  const acts: NazariyaAct[] = [], h = [...p.base];
  for (let i = 0; i < h.length; i++) {
    if (p.lock[i]) continue;
    const x = i % p.w, z = (i - x) / p.w;
    while (h[i] < target[i]) { acts.push({ kind: "place", x, z }); h[i]++; }
    while (h[i] > target[i]) { acts.push({ kind: "remove", x, z }); h[i]--; }
  }
  return acts;
}
/** A solid box as layer acts (one rectangle per layer). */
export const boxActs = (b: Box): NazariyaAct[] => Array.from({ length: b.hgt }, () => ({ kind: "layer", x0: b.x0, z0: b.z0, x1: b.x0 + b.a - 1, z1: b.z0 + b.b - 1 }) as NazariyaAct);
export const lvl = <P>(req: GenRequest, mode: PlayMode, goal: string, params: P, sig: string, context = "khand"): PlayLevel<P> => ({
  v: "play@1", levelId: `nz-${mode}-${sig}-${req.seed}`.replace(/[^a-z0-9:=+._x-]/gi, "_").slice(0, 120), family: "nazariya", mode, topicId: req.topicId, skillId: req.skillId,
  fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context, seed: req.seed,
  proof: { solvable: true, shortcutFree: true, minActs: 0, solutions: 0, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
});
/** Heights as a short row text for the board twin: "2 0 1 / 1 1 0". */
export const rowsText = (p: { w: number; d: number }, h: readonly number[]) => Array.from({ length: p.d }, (_, z) => h.slice(z * p.w, z * p.w + p.w).join(" ")).join(" / ");
