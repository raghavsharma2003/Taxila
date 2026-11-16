// Stambh (स्तंभ, "pillar") · bar graphs and pictographs built, not read off a card (round 7). The child gets a small data
// set and an axis (bars) or a key (picto) and BUILDS the graph: every bar is a stack of crates that fall and settle, one
// crate = one scale step; every pictograph row a row of icons, one icon = the key. Checking compares every bar with the law.
// Two goals:
//   draw  build every bar / row from the table (c4-maths-ch14, c5-maths-ch15, c6-maths-ch04)
//   diff  two bars stand built; build the third so it is exactly "N more / fewer than X" (c6-maths-ch04-t03)
// PURE law + generator + solver + grader. Heights are counted in HALF crates (a whole crate = 2), so a half crate is an
// integer; a half crate exists only when the level allows it (an even step) and is always the top of its stack.
// Mal-rules (each with a deterministic malActs):
//   scale-as-one    bars: one crate per unit (the bar too tall by the scale factor; only when that fits the axis)
//   gridline-count  bars: counts the lines, not the gaps (every bar one crate too tall)
//   half-ignored    a half step rounded down (the leftover half crate / half icon left out)
//   half-whole      a half step drawn as a whole crate / icon (the leftover rounded up)
//   key-ignored     picto: one icon per item (the key ignored; only when that fits the row)
import type { Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, StambhAct } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";
import { focusMal } from "../../core/pick.ts";

export type StambhMode = "bars" | "picto";
export interface StambhParams {
  goal: "draw" | "diff";
  /** units per crate (bars) or per icon (picto, the key): 1, 2, 4, 5, 10, 50, 100 */
  step: number;
  /** a half crate / half icon exists (only for an even step) */
  half: boolean;
  /** the context skin (words only; never changes the maths) and its category ids, in order */
  ctx: string;
  cats: string[];
  /** the data, units, one per category (diff: values[build] is the target, never shown) */
  values: number[];
  /** crates on the axis (bars) / icon slots in a row (picto) */
  cap: number;
  /** diff: the two bars that stand built, the bar to build, and its relation: values[build] = values[of] ± n */
  given?: number[]; build?: number; of?: number; n?: number; more?: boolean;
  /** axis labels (fade): 1 every step, 2 every other step, 3 only 0 and the top */
  labels: 1 | 2 | 3;
}
export interface StambhState extends Undoable<StambhState> { h: number[]; checks: number; done: boolean; acts: number }
export const STAMBH_MAL = ["scale-as-one", "gridline-count", "half-ignored", "half-whole", "key-ignored"] as const;
const MAL_OF: Record<StambhMode, readonly string[]> = {
  bars: ["scale-as-one", "gridline-count", "half-ignored", "half-whole"],
  picto: ["key-ignored", "half-ignored", "half-whole"],
};
export const STEPS = [1, 2, 4, 5, 10, 50, 100] as const;
/** context id → its category ids (each has a word stambh.cat.<id>) and the step sizes the numbers make sense at */
export const CONTEXTS: Record<string, { cats: string[]; small: boolean; big: boolean }> = {
  sport: { cats: ["cricket", "kabaddi", "hockey", "chess", "tennis"], small: true, big: true },
  mango: { cats: ["mon", "tue", "wed", "thu", "fri"], small: true, big: true },
  trees: { cats: ["6a", "6b", "6c", "6d", "6e"], small: true, big: false },
  books: { cats: ["jul", "aug", "sep", "oct", "nov"], small: true, big: true },
  house: { cats: ["agni", "vayu", "jal", "prithvi", "akash"], small: false, big: true },
};
const MAX_CAP = 12;

/** the halves a value takes (a whole crate = 2 halves) */
export const halvesOf = (v: number, step: number) => (2 * v) / step;
/** the value a stack of `h` halves reads on the scale */
export const valueOf = (h: number, step: number) => (h * step) / 2;
/** the column indices the child builds (diff: only `build`; the given bars are fixed) */
export const buildable = (p: StambhParams): number[] => (p.goal === "diff" ? [p.build ?? 0] : p.values.map((_, i) => i));
/** the law's heights, halves per column */
export const targetHalves = (p: StambhParams): number[] => p.values.map((v) => halvesOf(v, p.step));
/** values the teacher may not say before the child builds them (the diff target) */
export function stambhHidden(level: PlayLevel<unknown>): number[] {
  const p = level.params as Partial<StambhParams> | null;
  return p && p.goal === "diff" && Array.isArray(p.values) && typeof p.build === "number" ? [p.values[p.build]] : [];
}

const sameOn = (a: number[], b: number[], cols: number[]) => cols.every((i) => a[i] === b[i]);
/** the heights a child holding `mal` builds (halves per column), before checking fit / difference / ambiguity */
function rawMal(mode: StambhMode, p: StambhParams, mal: string): number[] | null {
  if (!MAL_OF[mode].includes(mal)) return null;
  const t = targetHalves(p), cols = buildable(p), out = [...t];
  const odd = cols.filter((i) => t[i] % 2 === 1);
  switch (mal) {
    case "scale-as-one": case "key-ignored":
      if (p.step === 1) return null;
      for (const i of cols) out[i] = 2 * p.values[i];
      return out;
    case "gridline-count":
      for (const i of cols) out[i] = t[i] + 2;
      return out;
    case "half-ignored":
      if (!odd.length) return null;
      for (const i of odd) out[i] = t[i] - 1;
      return out;
    case "half-whole":
      if (!odd.length) return null;
      for (const i of odd) out[i] = t[i] + 1;
      return out;
  }
  return null;
}
/**
 * Where a child holding mal-rule `mal` stacks (halves per column), or null when the belief says nothing different here,
 * when its stacks would not fit the axis / row, or when another of the mode's mal-rules builds the very same stacks
 * (a signature must name ONE belief).
 */
export function malHalves(mode: StambhMode, p: StambhParams, mal: string): number[] | null {
  const m = rawMal(mode, p, mal);
  if (!m) return null;
  const t = targetHalves(p), cols = buildable(p);
  if (sameOn(m, t, cols)) return null;
  if (cols.some((i) => m[i] < 1 || m[i] > 2 * p.cap)) return null;
  for (const other of MAL_OF[mode]) {
    if (other === mal) continue;
    const o = rawMal(mode, p, other);
    if (o && sameOn(o, m, cols)) return null;
  }
  return m;
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);

function validate(level: PlayLevel<unknown>): PlayLevel<StambhParams> | null {
  const p = level.params as Partial<StambhParams> | null;
  const mode = level.mode as string;
  if (!p || (mode !== "bars" && mode !== "picto")) return null;
  if (p.goal !== "draw" && p.goal !== "diff") return null;
  if (mode === "picto" && p.goal !== "draw") return null;
  const step = Number(p.step);
  if (!(STEPS as readonly number[]).includes(step)) return null;
  const half = !!p.half;
  if (half && step % 2 !== 0) return null;
  const ctx = typeof p.ctx === "string" ? CONTEXTS[p.ctx] : undefined;
  if (!ctx || !Array.isArray(p.cats) || !Array.isArray(p.values)) return null;
  const n = p.cats.length;
  if (n < 3 || n > 5 || p.values.length !== n) return null;
  if (new Set(p.cats).size !== n || !p.cats.every((c) => typeof c === "string" && ctx.cats.includes(c))) return null;
  const cap = Number(p.cap);
  if (!isInt(cap) || cap < 3 || cap > MAX_CAP) return null;
  for (const v of p.values) {
    if (!isInt(v) || v <= 0) return null;
    const h = halvesOf(v, step);
    if (!Number.isInteger(h) || h > 2 * cap || (h % 2 === 1 && !half)) return null;
  }
  const labels = p.labels === 2 || p.labels === 3 ? p.labels : 1;
  const base = { goal: p.goal, step, half, ctx: p.ctx as string, cats: [...p.cats], values: [...p.values], cap, labels } as StambhParams;
  if (p.goal === "diff") {
    if (n !== 3 || !Array.isArray(p.given) || p.given.length !== 2) return null;
    const given = p.given.map(Number), build = Number(p.build), of = Number(p.of), d = Number(p.n);
    if (!given.every((g) => isInt(g) && g >= 0 && g < n) || given[0] === given[1]) return null;
    if (!isInt(build) || build < 0 || build >= n || given.includes(build) || !given.includes(of)) return null;
    if (!isInt(d) || d <= 0) return null;
    const want = p.values[of] + (p.more ? d : -d);
    if (p.values[build] !== want) return null;
    // the gap itself must be buildable (a whole number of half steps when halves exist, of whole steps when not)
    const dh = halvesOf(d, step);
    if (!Number.isInteger(dh) || (dh % 2 === 1 && !half)) return null;
    Object.assign(base, { given, build, of, n: d, more: !!p.more });
  }
  return { ...level, params: base } as PlayLevel<StambhParams>;
}
function init(level: PlayLevel<StambhParams>): StambhState {
  const p = level.params, t = targetHalves(p);
  const h = p.values.map((_, i) => (p.goal === "diff" && p.given?.includes(i) ? t[i] : 0));
  return { h, checks: 0, done: false, acts: 0, prev: null, depth: 0 };
}

function apply(level: PlayLevel<StambhParams>, s: StambhState, act: StambhAct, seq: number): { state: StambhState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [], mode = level.mode as StambhMode;
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: StambhState): StambhState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const cols = buildable(p);
  if (act.kind === "drop" || act.kind === "lift") {
    const col = Number(act.col);
    if (!isInt(col) || col < 0 || col >= p.values.length) return { state: bump(s), moments: out, refused: "bad_col" };
    if (!cols.includes(col)) return { state: bump(s), moments: out, refused: "fixed" };
    const cur = s.h[col], h = [...s.h];
    if (act.kind === "drop") {
      if (cur % 2 === 1) return { state: bump(s), moments: out, refused: "half_on_top" };
      const size = act.half ? 1 : 2;
      if (act.half && !p.half) return { state: bump(s), moments: out, refused: "no_half" };
      if (cur + size > 2 * p.cap) return { state: bump(s), moments: out, refused: "over_top" };
      h[col] = cur + size;
    } else {
      if (cur <= 0) return { state: bump(s), moments: out, refused: "empty" };
      h[col] = cur - (cur % 2 === 1 ? 1 : 2);
    }
    return { state: bump(pushUndo(s, { ...s, h })), moments: out };
  }
  if (act.kind === "check") {
    if (cols.every((i) => s.h[i] === 0)) return { state: bump(s), moments: out, refused: "build_first" };
    const t = targetHalves(p), next = bump(pushUndo(s, { ...s, checks: s.checks + 1 }));
    const wrong = cols.filter((i) => s.h[i] !== t[i]);
    const base: Facts = { goal: p.goal, bars: cols.length };
    if (!wrong.length) { out.push(mom("solved", seq, base)); return { state: { ...next, done: true }, moments: out }; }
    const f: Facts = { ...base, wrong: wrong.length };
    if (wrong.length === 1) f.gap = valueOf(Math.abs(s.h[wrong[0]] - t[wrong[0]]), p.step);
    for (const mal of Object.keys(level.mal)) {
      const mh = malHalves(mode, p, mal);
      if (mh && sameOn(mh, s.h, cols)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: next, moments: out, refused: "missed" }; }
    }
    const near = wrong.every((i) => Math.abs(s.h[i] - t[i]) <= 2) && wrong.length <= Math.max(1, Math.floor(cols.length / 2));
    out.push(mom(near ? "near_miss" : "law_refused", seq, { ...f, why: "bars_off" }));
    return { state: next, moments: out, refused: "missed" };
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<StambhParams>, s: StambhState) => s.done;

/** the acts that build `halves` on the buildable columns from empty, then check */
function buildActs(p: StambhParams, halves: number[]): StambhAct[] {
  const acts: StambhAct[] = [];
  for (const i of buildable(p)) {
    for (let k = 0; k < Math.floor(halves[i] / 2); k++) acts.push({ kind: "drop", col: i });
    if (halves[i] % 2 === 1) acts.push({ kind: "drop", col: i, half: true });
  }
  acts.push({ kind: "check" });
  return acts;
}
const solve = (level: PlayLevel<StambhParams>): StambhAct[] => buildActs(level.params, targetHalves(level.params));
/**
 * Without the concept a child can still copy what stands on screen. In diff, a third bar the same height as the OTHER given
 * bar would pass by copying it, so such a level is never served. Draw has no such move: every bar's height comes only from
 * reading its value against the scale (step 1 is the c4 first rung, where that reading IS counting crates).
 */
function shortcut(level: PlayLevel<StambhParams>): StambhAct[] | null {
  const p = level.params;
  if (p.goal !== "diff") return null;
  const t = targetHalves(p), b = p.build ?? 0;
  for (const g of p.given ?? []) if (t[g] === t[b]) { const h = [...t]; return buildActs(p, h); }
  return null;
}
function malActs(level: PlayLevel<StambhParams>, mal: string): StambhAct[] | null {
  const m = malHalves(level.mode as StambhMode, level.params, mal);
  return m ? buildActs(level.params, m) : null;
}

interface StambhGrammar { steps?: number[]; half?: boolean; goal?: "draw" | "diff"; focusSteps?: number[] }
function difficultyOf(p: StambhParams): number {
  const t = targetHalves(p), cols = buildable(p);
  const odd = cols.filter((i) => t[i] % 2 === 1).length;
  return Math.min(1, 0.2 + (p.step > 1 ? 0.1 : 0) + (p.step >= 50 ? 0.05 : 0) + 0.08 * odd + 0.05 * (p.values.length - 3)
    + 0.08 * (p.labels - 1) + (p.goal === "diff" ? 0.2 + (p.more ? 0 : 0.05) : 0));
}
function generate(req: GenRequest): Candidate<StambhParams>[] {
  const g = req.grammar as StambhGrammar;
  const mode: StambhMode = req.mode === "picto" ? "picto" : "bars";
  const goal: "draw" | "diff" = mode === "picto" ? "draw" : ((req.goal as "draw" | "diff") ?? g.goal ?? "draw");
  const steps = (g.steps ?? (mode === "picto" ? [2, 5, 10] : [1, 2, 5, 10])).filter((x) => (STEPS as readonly number[]).includes(x));
  if (!steps.length) return [];
  const rnd = mulberry32(req.seed), out: Candidate<StambhParams>[] = [], seen = new Set<string>();
  const labels = req.fade as 1 | 2 | 3;
  const maxCats = req.classLevel <= 5 ? 4 : 5;
  const mk = (params: StambhParams, sig: string): Candidate<StambhParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `stambh-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "stambh", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: params.ctx, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  /** one candidate: `fitAll` keeps every value within the axis / row in UNITS (so one crate / icon per unit fits) */
  const attempt = (rnd: () => number, step: number, fitAll: boolean | null, shows?: string): void => {
    const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
    const half = g.half !== false && step % 2 === 0;
    const ctxIds = Object.keys(CONTEXTS).filter((id) => (step >= 10 ? CONTEXTS[id].big : CONTEXTS[id].small));
    const ctxId = ctxIds[Math.floor(rnd() * ctxIds.length)];
    const n = goal === "diff" ? 3 : int(3, maxCats);
    const cap = mode === "bars" ? int(6, 10) : int(8, 10);
    // a third of the small-step levels keep every value within the axis / row in UNITS, so the one-per-unit belief can show
    const fit = fitAll ?? (step > 1 && step <= 5 && rnd() < 0.4);
    const hi = fit ? Math.floor((2 * cap) / step) : 2 * cap;
    if (hi < 4) return;
    const pool: number[] = [];
    for (let h = 2; h <= hi; h++) if (half || h % 2 === 0) pool.push(h);
    if (pool.length < n) return;
    const hs: number[] = [];
    while (hs.length < n) { const h = pool[Math.floor(rnd() * pool.length)]; if (!hs.includes(h)) hs.push(h); }
    if (half && !hs.some((h) => h % 2 === 1) && rnd() < 0.7) { const i = Math.floor(rnd() * n), h = hs[i] + (hs[i] < hi ? 1 : -1); if (!hs.includes(h) && h >= 2) hs[i] = h; }
    const allCats = CONTEXTS[ctxId].cats, start = Math.floor(rnd() * (allCats.length - n + 1));
    const cats = allCats.slice(start, start + n);
    let params: StambhParams = { goal, step, half, ctx: ctxId, cats, values: hs.map((h) => valueOf(h, step)), cap, labels };
    let sig = `${mode}:${goal}:${step}:${cap}:${params.values.join(",")}`;
    if (goal === "diff") {
      const build = Math.floor(rnd() * 3), given = [0, 1, 2].filter((i) => i !== build);
      const of = given[Math.floor(rnd() * 2)], other = given.find((i) => i !== of) as number;
      const more = rnd() < 0.55;
      const dh = half ? int(1, 6) : 2 * int(1, 3);
      const th = hs[of] + (more ? dh : -dh);
      if (th < 2 || th > 2 * cap || th === hs[other] || (th % 2 === 1 && !half)) return;
      hs[build] = th;
      params = { ...params, values: hs.map((h) => valueOf(h, step)), given, build, of, n: valueOf(dh, step), more };
      sig = `${mode}:diff:${step}:${cap}:${params.values.join(",")}:${of}${more ? "+" : "-"}${build}`;
    }
    if (seen.has(sig)) return;
    // a focus level must actually show its belief (diff: the bar to build can end past the axis in units)
    if (shows && !malHalves(mode, params, shows)) return;
    seen.add(sig);
    out.push(mk(params, sig));
  };
  for (let k = 0; k < 60 && out.length < 24; k++) attempt(rnd, steps[Math.floor(rnd() * steps.length)], null);
  // GAMES-01: when the Director's focus is the one-per-unit belief (c6 "ignores the key" / "counts the squares, ignores the
  // scale") and the topic's own steps are too big for one crate / icon per unit to fit (5 and up at c6), add levels at the
  // entry's `focusSteps` (small keys / scales its kit uses, cited in the rules file) with every value within the axis / row
  // in units, so that belief's stacks differ from the law's. A separate seed stream: unfocused levels stay as they were.
  const fm = focusMal(req);
  const fsteps = (Array.isArray(g.focusSteps) ? g.focusSteps : []).filter((x) => x > 1 && (STEPS as readonly number[]).includes(x));
  if ((fm === "scale-as-one" || fm === "key-ignored") && MAL_OF[mode].includes(fm) && fsteps.length) {
    const frnd = mulberry32((req.seed ^ 0x5f0c) >>> 0), before = out.length;
    for (let k = 0; k < 40 && out.length < before + 8; k++) attempt(frnd, fsteps[Math.floor(frnd() * fsteps.length)], true, fm);
  }
  return out;
}
function facts(level: PlayLevel<StambhParams>, s: StambhState): Facts {
  const p = level.params, cols = buildable(p);
  const f: Facts = { goal: p.goal, bars: cols.length, built: cols.filter((i) => s.h[i] > 0).length };
  if (level.mode === "picto") f.key = p.step;
  if (p.goal === "diff") { f.n = p.n ?? 0; f.rel = p.more ? "more" : "fewer"; }
  if (s.checks) f.checks = s.checks;
  if (s.done) f.done = "yes";
  return f;
}
const crates = (h: number) => `${Math.floor(h / 2)}${h % 2 ? "½" : ""}`;
function board(level: PlayLevel<StambhParams>, s: StambhState) {
  const p = level.params, picto = level.mode === "picto";
  const head = picto ? `1 = ${p.step}` : `0 … ${p.cap * p.step}`;
  const rows = p.cats.map((c, i) => {
    const shown = p.goal === "diff" && i === p.build ? "?" : p.goal === "diff" ? "" : String(p.values[i]);
    return `${c}${shown ? ` ${shown}` : ""}: ${crates(s.h[i])}`;
  });
  const rel = p.goal === "diff" ? [`${p.cats[p.build ?? 0]} = ${p.cats[p.of ?? 0]} ${p.more ? "+" : "−"} ${p.n}`] : [];
  return { title: picto ? "Pictograph" : "Bar graph", lines: [head, ...rel, ...rows] };
}
function grade(level: PlayLevel<StambhParams>, acts: PlayActEnvelope<StambhAct>[]): PlayGrade {
  return gradeLevel(stambhLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const stambhLogic: FamilyLogic<StambhParams, StambhState, StambhAct> = {
  family: "stambh", modes: ["bars", "picto"], malRules: STAMBH_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
