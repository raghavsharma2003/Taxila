// Kram ("sequence", "order") · round 7, growing patterns and number sequences (classes 4-7). Nothing runs on a clock: every
// tile, bag, dial, rhythm and piece is the child's act, and the law answers only on "run". One law per goal, each a real
// thing the child builds:
//   grow/next    stages of a growing tile figure stand built (a square, a staircase, an oblong, an L, a plus). The build
//                board starts as a copy of the last stage; the child lays / lifts tiles to grow it into the NEXT stage. The
//                run holds the figure against the pattern (any turn or flip of it, anywhere on the board, is the same figure)
//   grow/far     the first stages of a figure stand built (matchstick houses, a row of squares / triangles, tile squares,
//                points joined in every pair, a snowflake whose every side splits into four). The child fills a bag with
//                exactly the pieces stage N (10, 20 …) needs (racks of 1, 10, 100, 1000; nine to a rack). The run grows the
//                figure stage by stage out of the bag: it runs short, or pieces are left over, or it comes out exact
//   machine/step a number list (going up, going down, doubling, halving, a calendar column, a stick figure's counts) and
//                a step machine: the child sets its sign (+ − × ÷) and its number; the run walks the machine from the first
//                number along every given step, then fills the two blanks. It must reproduce every step
//   machine/rule a stage table (stage 1..4 and its count) and a rule machine "× a + b" fed the STAGE NUMBER (not the last
//                count). The child sets a and b; the run feeds stages 1..4, then the far stage
//   beats/lay    the rhythms of 1, 2, … n−1 beats (S = short, 1 beat; L = long, 2 beats) stand on their shelves. The child
//                lays every rhythm of n beats on the empty shelf (a tap on a rhythm one shelf up lays it with S in front; a
//                tap on one two shelves up lays it with L in front; the pads compose one by hand). The run plays them: every
//                rhythm of n beats must be there, once
//   beats/count  the shelves 1..4 stand; fill the bag with exactly the number of rhythms of N beats; the run lays the
//                shelves on to N
//   nest/odd     an empty k × k square frame and a tray of L-pieces 1, 3, 5, 7 … dots: pick the pieces that fill it exactly;
//                the run nests them round the corner, smallest first
//   nest/pair    the same frame and a tray of dot staircases 1, 3, 6, 10 …: pick the TWO that fill it (one is turned)
// Mal-rules (each a deterministic set-up; a level serves one only where it differs from the answer and from every other
// one of the goal's):
//   copy          next: the last stage run as it is (the next shape guessed to be the same)
//   corner        next (squares): a row and a column added without their shared corner
//   rows-only     next (squares): only a row added (k rows of k + 1 called the next square)
//   times-first   far: stage N as N × stage 1 (10 houses as 10 × 5)
//   step-only     far: stage N as N × the step (the starting piece forgotten)
//   same-step     far: the last step added again and again (a line pattern assumed)
//   sides-plus    far (snowflake): the sides grow by adding the last step, not by × 4
//   double        far (points joined): every line counted from both its ends
//   add-one       far (rhythms): the count goes up by one each beat
//   doubling      far (rhythms): the count doubles each beat
//   only-increase step: a going-down list continued upward (+ for −, × for ÷)
//   first-step    step: only the first step read (+ (t2 − t1) for a doubling list)
//   plus-one      step (calendar): one row down a calendar column as + 1
//   recursive     rule: the step-to-step change written as the rule (n + d)
//   proportional  rule: stage n as n × stage 1 (a × b with b = 0)
//   order-ignored lay: one rhythm per mix of S and L (SL and LS taken as the same)
//   skip-start    odd: a run of odd pieces that does not start at 1
import type { Candidate, Facts, FamilyLogic, GenRequest, KramAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type KramMode = "grow" | "machine" | "beats" | "nest";
export type KramGoal = "next" | "far" | "step" | "rule" | "lay" | "count" | "odd" | "pair";
/** tile figures (built on the board) and drawn figures (sticks, points, snowflake, rhythms) */
export const TILE_SEQS = ["square", "stair", "oblong", "ell", "plus"] as const;
export const FAR_SEQS = ["houses", "sqrow", "trirow", "square", "stair", "lines", "koch", "virahanka"] as const;
export type SeqId = (typeof FAR_SEQS)[number] | (typeof TILE_SEQS)[number];
export type StepKind = "add" | "sub" | "mul" | "div" | "cal" | "fig";
export const OPS = ["+", "-", "x", "/"] as const;
export type Op = (typeof OPS)[number];

export interface KramParams {
  goal: KramGoal;
  /** the fade: 1 every stage drawn and counted · 2 drawn, fewer counts · 3 the counts only */
  face: 1 | 2 | 3;
  /** grow / beats count: the figure; machine/step: the list's kind ("fig" lists carry their figure here too); else "" */
  seq: string;
  /** next: the stage to build · far / count: the far stage · rule: the far stage the machine runs to · lay: the beats ·
   *  odd / pair: the frame's side · step: the list's length (the given numbers) */
  n: number;
  /** stages shown (far / count / rule: 1..shown; next: n−3 .. n−1) */
  shown: number;
  /** step: the first number, the op and its number · rule: a (× a) and b (+ b) */
  a: number; op: Op; v: number; b: number;
}
export interface KramState extends Undoable<KramState> {
  /** next: the board's tiles (index y * grid + x), ascending */
  cells: number[];
  /** far / count: the bag per rack (index 0 = ones), 0..9 each */
  bag: number[];
  /** machine: the two dials (step: op index, number · rule: a, b) */
  d0: number; d1: number;
  /** lay: the rhythms on the new shelf · odd / pair: the pieces picked (tray indices, ascending) */
  laid: string[]; picked: number[];
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const KRAM_MAL = ["copy", "corner", "rows-only", "times-first", "step-only", "same-step", "sides-plus", "double", "add-one", "doubling",
  "only-increase", "first-step", "plus-one", "recursive", "proportional", "order-ignored", "skip-start"] as const;
const MAL_OF: Record<KramGoal, readonly string[]> = {
  next: ["copy", "corner", "rows-only"],
  far: ["times-first", "step-only", "same-step", "sides-plus", "double"],
  count: ["add-one", "doubling"],
  step: ["only-increase", "first-step", "plus-one"],
  rule: ["recursive", "proportional"],
  lay: ["order-ignored"],
  odd: ["skip-start"],
  pair: [],
};
export const GOALS_OF: Record<KramMode, readonly KramGoal[]> = { grow: ["next", "far"], machine: ["step", "rule"], beats: ["lay", "count"], nest: ["odd", "pair"] };
export const RACK = 9, MAX_RACKS = 5, DIAL_A = [0, 12] as const, DIAL_B = [-10, 20] as const, STEP_V = [1, 20] as const;

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
export const digits = (x: number) => String(Math.abs(Math.trunc(x))).length;

// ── the sequences (plain counting; the checker in the tests counts them its own way) ──
/** Virahanka numbers: the rhythms of n beats (1, 2, 3, 5, 8 …) */
export function vira(n: number): number { let a = 1, b = 1; for (let i = 1; i < n; i++) [a, b] = [b, a + b]; return n < 1 ? 0 : b; }
/** the count of stage n of a figure */
export function countOf(seq: string, n: number): number {
  switch (seq) {
    case "square": return n * n;
    case "stair": return (n * (n + 1)) / 2;
    case "oblong": return n * (n + 1);
    case "ell": return 2 * n - 1;
    case "plus": return 4 * n - 3;
    case "houses": return 4 * n + 1;
    case "sqrow": return 3 * n + 1;
    case "trirow": return 2 * n + 1;
    case "lines": return ((n + 1) * n) / 2;        // stage n: n + 1 points on a ring, every pair joined
    case "koch": return 3 * 4 ** (n - 1);
    case "virahanka": return vira(n);
  }
  return NaN;
}
/** a stage's tiles as [x, y] (anchored so each stage holds the one before) */
export function tilesOf(seq: string, n: number): [number, number][] {
  const out: [number, number][] = [];
  if (seq === "square") { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) out.push([x, y]); }
  else if (seq === "stair") { for (let y = 0; y < n; y++) for (let x = 0; x <= y; x++) out.push([x, y]); }
  else if (seq === "oblong") { for (let y = 0; y < n; y++) for (let x = 0; x <= n; x++) out.push([x, y]); }
  else if (seq === "ell") { for (let y = 0; y < n; y++) out.push([0, y]); for (let x = 1; x < n; x++) out.push([x, n - 1]); }
  else if (seq === "plus") {
    // centred at (6, 6): arms n − 1 long
    out.push([6, 6]);
    for (let k = 1; k < n; k++) out.push([6 + k, 6], [6 - k, 6], [6, 6 + k], [6, 6 - k]);
  }
  return out;
}
/** the build board for a next level: its side and where the figure stands (one free row / column all round) */
export function boardOf(p: Pick<KramParams, "seq" | "n">): { grid: number; dx: number; dy: number } {
  if (p.seq === "plus") return { grid: 2 * p.n + 1, dx: p.n - 6, dy: p.n - 6 };
  const t = tilesOf(p.seq, p.n), w = Math.max(...t.map((c) => c[0])) + 1, h = Math.max(...t.map((c) => c[1])) + 1;
  return { grid: Math.max(w, h) + 2, dx: 1, dy: 1 };
}
/** the tiles of stage m on the board of a next level, as board indices */
export function boardTiles(p: Pick<KramParams, "seq" | "n">, m: number): number[] {
  const { grid, dx, dy } = boardOf(p);
  return tilesOf(p.seq, m).map(([x, y]) => (y + dy) * grid + x + dx).sort((a, b) => a - b);
}
/** a figure's canonical form: the same under any turn, flip or slide */
export function shapeKey(cells: readonly number[], grid: number): string {
  const pts = cells.map((i) => [i % grid, Math.floor(i / grid)] as [number, number]);
  let best = "";
  const T: ((x: number, y: number) => [number, number])[] = [(x, y) => [x, y], (x, y) => [-y, x], (x, y) => [-x, -y], (x, y) => [y, -x],
    (x, y) => [-x, y], (x, y) => [y, x], (x, y) => [x, -y], (x, y) => [-y, -x]];
  for (const t of T) {
    const q = pts.map(([x, y]) => t(x, y)), mx = Math.min(...q.map((c) => c[0])), my = Math.min(...q.map((c) => c[1]));
    const s = q.map(([x, y]) => `${x - mx},${y - my}`).sort().join(";");
    if (!best || s < best) best = s;
  }
  return best;
}

// ── the step machine ──
export function stepOf(op: Op, v: number, x: number): number {
  switch (op) { case "+": return x + v; case "-": return x - v; case "x": return x * v; case "/": return x / v; }
}
/** the step list's numbers: the given ones then the two blanks */
export function listOf(p: Pick<KramParams, "a" | "op" | "v" | "n">, extra = 2): number[] {
  const out = [p.a];
  for (let i = 1; i < p.n + extra; i++) out.push(stepOf(p.op, p.v, out[i - 1]));
  return out;
}
/** what the child's machine makes from the first number (one per given number and blank) */
export const machineList = (p: KramParams, op: Op, v: number, extra = 2) => listOf({ a: p.a, op, v, n: p.n }, extra);
/** the rule machine: stage k → a·k + b */
export const ruleOut = (a: number, b: number, k: number) => a * k + b;
/** the far stages a rule level feeds after the table: 1..4 then n */
export const RULE_SHOWN = 4;

// ── rhythms ──
/** every rhythm of n beats (S = 1, L = 2), S-first order */
export function rhythms(n: number): string[] {
  if (n === 0) return [""];
  if (n < 0) return [];
  return [...rhythms(n - 1).map((r) => `S${r}`), ...rhythms(n - 2).map((r) => `L${r}`)];
}
export const beatsOf = (r: string) => [...r].reduce((s, c) => s + (c === "L" ? 2 : 1), 0);
const isRhythm = (r: unknown): r is string => typeof r === "string" && /^[SL]{1,12}$/.test(r);

// ── the nest tray ──
/** the tray: L-pieces 1, 3, 5 … (odd) or staircases 1, 3, 6 … (pair); piece i of each */
export const trayOf = (p: Pick<KramParams, "goal" | "n">) => Array.from({ length: p.n + 2 }, (_, i) => (p.goal === "odd" ? 2 * i + 1 : ((i + 1) * (i + 2)) / 2));

// ── THE ANSWER ──
/** the bag's racks: one more place than the count needs (so the bag never tells the size) */
export function racksOf(p: KramParams): number { return Math.min(MAX_RACKS, digits(countOf(p.seq, p.n)) + 1); }
export function want(p: KramParams): number {
  switch (p.goal) {
    case "next": return countOf(p.seq, p.n);
    case "far": case "count": return countOf(p.seq, p.n);
    case "step": return listOf(p)[p.n];
    case "rule": return ruleOut(p.a, p.b, p.n);
    case "lay": return vira(p.n);
    case "odd": case "pair": return p.n * p.n;
  }
}

/** a set-up: what the child commits before the run */
export interface Setup { cells?: number[]; load?: number; d0?: number; d1?: number; laid?: string[]; picked?: number[] }
const sameList = <T>(x: readonly T[] = [], y: readonly T[] = []) => x.length === y.length && x.every((v, i) => v === y[i]);
const sortedSet = (x: readonly string[]) => [...x].sort();
function sameSetup(p: KramParams, x: Setup, y: Setup): boolean {
  if (p.goal === "next") return shapeKey(x.cells ?? [], boardOf(p).grid) === shapeKey(y.cells ?? [], boardOf(p).grid);
  if (p.goal === "lay") return sameList(sortedSet(x.laid ?? []), sortedSet(y.laid ?? []));
  return x.load === y.load && x.d0 === y.d0 && x.d1 === y.d1 && sameList(x.picked, y.picked);
}
/** THE judgement of a run */
export function judge(p: KramParams, s: Setup): boolean {
  switch (p.goal) {
    case "next": return !!s.cells && shapeKey(s.cells, boardOf(p).grid) === shapeKey(boardTiles(p, p.n), boardOf(p).grid);
    case "far": case "count": return s.load === want(p);
    case "step": {
      const op = OPS[s.d0 ?? -1], v = s.d1 ?? 0;
      if (!op) return false;
      const mine = machineList(p, op, v, 0), real = listOf(p, 0);
      return mine.every((x, i) => x === real[i]);
    }
    case "rule": for (let k = 1; k <= RULE_SHOWN; k++) if (ruleOut(s.d0 ?? 0, s.d1 ?? 0, k) !== ruleOut(p.a, p.b, k)) return false; return true;
    case "lay": return sameList(sortedSet(s.laid ?? []), sortedSet(rhythms(p.n)));
    case "odd": return sameList(s.picked, Array.from({ length: p.n }, (_, i) => i));
    case "pair": return sameList(s.picked, [p.n - 2, p.n - 1]);
  }
}

function rawMal(p: KramParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  const f = (k: number) => countOf(p.seq, k), N = p.n, s = p.shown;
  switch (mal) {
    case "copy": return { cells: boardTiles(p, N - 1) };
    case "corner": case "rows-only": {
      if (p.seq !== "square") return null;
      const { grid, dx, dy } = boardOf(p), k = N - 1, out = boardTiles(p, k);
      for (let x = 0; x < k; x++) out.push((k + dy) * grid + x + dx);                          // a new row of k
      if (mal === "corner") for (let y = 0; y < k; y++) out.push((y + dy) * grid + k + dx);    // and a new column of k, no corner
      return { cells: out.sort((a, b) => a - b) };
    }
    case "times-first": return ["houses", "sqrow", "trirow"].includes(p.seq) ? { load: N * f(1) } : null;
    case "step-only": return ["houses", "sqrow", "trirow"].includes(p.seq) ? { load: N * (f(2) - f(1)) } : null;
    case "same-step": return p.seq === "koch" || s < 2 ? null : { load: f(s) + (N - s) * (f(s) - f(s - 1)) };
    case "sides-plus": return p.seq === "koch" && s >= 2 ? { load: f(s) + (N - s) * (f(s) - f(s - 1)) } : null;
    case "double": return p.seq === "lines" ? { load: 2 * f(N) } : null;
    case "add-one": return { load: f(s) + (N - s) };
    case "doubling": return { load: f(s) * 2 ** (N - s) };
    case "only-increase":
      if (p.op === "-") return { d0: OPS.indexOf("+"), d1: p.v };
      if (p.op === "/") return { d0: OPS.indexOf("x"), d1: p.v };
      return null;
    case "first-step": {
      if (p.op !== "x" && p.op !== "/") return null;
      const [t1, t2] = listOf(p);
      return t2 > t1 ? { d0: OPS.indexOf("+"), d1: t2 - t1 } : { d0: OPS.indexOf("-"), d1: t1 - t2 };
    }
    case "plus-one": return p.seq === "cal" ? { d0: OPS.indexOf("+"), d1: 1 } : null;
    case "recursive": return { d0: 1, d1: p.a };
    case "proportional": return { d0: ruleOut(p.a, p.b, 1), d1: 0 };
    case "order-ignored": {
      const out: string[] = [];
      for (let l = 0; 2 * l <= N; l++) out.push("S".repeat(N - 2 * l) + "L".repeat(l));
      return { laid: out };
    }
    case "skip-start": return { picked: Array.from({ length: N }, (_, i) => i + 1) };
  }
  return null;
}
function legal(p: KramParams, s: Setup): boolean {
  if (p.goal === "far" || p.goal === "count") return isInt(s.load) && s.load > 0 && s.load < 10 ** racksOf(p);
  if (p.goal === "step") return isInt(s.d0) && s.d0 >= 0 && s.d0 < OPS.length && isInt(s.d1) && s.d1 >= STEP_V[0] && s.d1 <= STEP_V[1];
  if (p.goal === "rule") return isInt(s.d0) && isInt(s.d1) && s.d0 >= DIAL_A[0] && s.d0 <= DIAL_A[1] && s.d1 >= DIAL_B[0] && s.d1 <= DIAL_B[1];
  if (p.goal === "odd" || p.goal === "pair") return !!s.picked && s.picked.every((i) => isInt(i) && i >= 0 && i < p.n + 2) && (p.goal === "odd" || s.picked.length === 2);
  if (p.goal === "next") { const g = boardOf(p).grid; return !!s.cells && s.cells.length > 0 && s.cells.every((i) => isInt(i) && i >= 0 && i < g * g); }
  return !!s.laid && s.laid.every((r) => beatsOf(r) === p.n);
}
/** The set-up a child holding `mal` commits, or null (no reading here, not legal, would solve, or another of the goal's
 *  beliefs commits the very same set-up: a signature names ONE belief) */
export function malSetup(p: KramParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  for (const other of MAL_OF[p.goal]) {
    if (other === mal) continue;
    const o = rawMal(p, other);
    if (o && legal(p, o) && sameSetup(p, o, m)) return null;
  }
  return m;
}

/** the values the teacher may not say before the child produces them: the next / far count, the next numbers, the rule's
 *  far output and its parts, the rhythm count, the square the pieces fill */
export function kramHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as KramParams | null;
  if (!p || typeof p.goal !== "string" || !isInt(p.n)) return [];
  try {
    if (p.goal === "step") { const l = listOf(p); return [String(l[p.n]), String(l[p.n + 1]), `${p.op} ${p.v}`]; }
    if (p.goal === "rule") return [String(want(p)), `${p.a}n + ${p.b}`, `${p.a} × n + ${p.b}`];
    const w = want(p);
    return Number.isFinite(w) ? [String(w)] : [];
  } catch { return []; }
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const BASE: Omit<KramParams, "goal" | "face"> = { seq: "", n: 0, shown: 0, a: 0, op: "+", v: 0, b: 0 };

function validate(level: PlayLevel<unknown>): PlayLevel<KramParams> | null {
  const q = level.params as Partial<KramParams> | null, mode = level.mode as KramMode;
  if (!q || !GOALS_OF[mode] || !GOALS_OF[mode].includes(q.goal as KramGoal)) return null;
  const goal = q.goal as KramGoal, face = q.face === 1 || q.face === 2 || q.face === 3 ? q.face : 0;
  if (!face || !isInt(q.n) || !isInt(q.shown)) return null;
  const p: KramParams = { goal, face, seq: String(q.seq ?? ""), n: q.n, shown: q.shown, a: isInt(q.a) ? q.a : NaN, op: (OPS as readonly string[]).includes(q.op as string) ? (q.op as Op) : "+", v: isInt(q.v) ? q.v : NaN, b: isInt(q.b) ? q.b : NaN };
  const out = { ...level, params: p } as PlayLevel<KramParams>;
  const plain = () => p.a === 0 && p.v === 0 && p.b === 0 && p.op === "+";
  if (goal === "next") {
    // build stage n from n − 1, with n − 3 .. n − 1 shown; small enough for the board
    if (!(TILE_SEQS as readonly string[]).includes(p.seq) || p.shown !== 3 || p.n < 4 || p.n > 6 || !plain()) return null;
    if (p.seq === "plus" && p.n > 5) return null;
    return out;
  }
  if (goal === "far" || goal === "count") {
    if (goal === "count" ? p.seq !== "virahanka" : !(FAR_SEQS as readonly string[]).includes(p.seq) || p.seq === "virahanka") return null;
    if (!plain() || p.shown < 2 || p.shown > 4 || p.n < p.shown + 2 || p.n > 30) return null;
    const w = countOf(p.seq, p.n);
    // the bag: at most five racks; the far stage never one the pictures already show
    if (!isInt(w) || digits(w) + 1 > MAX_RACKS) return null;
    if (p.seq === "koch" && (p.n > 6 || p.shown !== 2)) return null;
    if (p.seq === "lines" && p.shown !== 4) return null;
    if (goal === "count" && (p.shown !== 4 || p.n > 12)) return null;
    return out;
  }
  if (goal === "step") {
    // 4-5 numbers given; whole numbers all the way through the blanks; one machine only makes the list
    // (a calendar column: three dates given, a month has room for two more)
    if (!isInt(p.a) || !isInt(p.v) || p.b !== 0 || p.n < (p.seq === "cal" ? 3 : 4) || p.n > (p.seq === "cal" ? 3 : 5) || p.shown !== p.n) return null;
    if (!["add", "sub", "mul", "div", "cal", "fig"].includes(p.seq)) return null;
    if (p.v < STEP_V[0] || p.v > STEP_V[1] || p.a < 1 || p.a > 999) return null;
    const kindOp: Record<string, Op> = { add: "+", sub: "-", mul: "x", div: "/", cal: "+", fig: "+" };
    if (kindOp[p.seq] !== p.op) return null;
    if ((p.op === "x" || p.op === "/") && (p.v < 2 || p.v > 5)) return null;
    if (p.seq === "cal" && (p.v !== 7 || listOf(p).at(-1)! > 31)) return null;
    const l = listOf(p);
    if (l.some((x) => !isInt(x) || x < 0 || x > 9999)) return null;
    let makes = 0;
    for (let o = 0; o < OPS.length; o++) for (let v = STEP_V[0]; v <= STEP_V[1]; v++) if (judge(p, { d0: o, d1: v })) makes++;
    if (makes !== 1) return null;
    return out;
  }
  if (goal === "rule") {
    // a in 2..7, b in 1..7 (never a plain table, never the step alone); the far stage 10..100
    if (p.seq !== "" || p.op !== "+" || p.v !== 0 || p.shown !== RULE_SHOWN || !isInt(p.a) || !isInt(p.b)) return null;
    if (p.a < 2 || p.a > 7 || p.b < 1 || p.b > 7 || p.n < 10 || p.n > 100) return null;
    return out;
  }
  if (!plain() || p.seq !== "" || p.shown !== 0) return null;
  if (goal === "lay") return p.n >= 3 && p.n <= 6 ? out : null;
  // nest: a frame 3..6 (pair: 3..7)
  return p.n >= 3 && p.n <= (goal === "pair" ? 7 : 6) ? out : null;
}

function init(level: PlayLevel<KramParams>): KramState {
  const p = level.params;
  return { cells: p.goal === "next" ? boardTiles(p, p.n - 1) : [], bag: p.goal === "far" || p.goal === "count" ? new Array(racksOf(p)).fill(0) : [],
    d0: p.goal === "step" ? 0 : 0, d1: p.goal === "step" ? 1 : 0, laid: [], picked: [], ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}
export const loadOf = (bag: readonly number[]) => bag.reduce((s, c, i) => s + c * 10 ** i, 0);
const setupOf = (s: KramState): Setup => ({ cells: s.cells, load: loadOf(s.bag), d0: s.d0, d1: s.d1, laid: s.laid, picked: s.picked });

function apply(level: PlayLevel<KramParams>, s: KramState, act: KramAct, seq: number): { state: KramState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: KramState): KramState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const change = (patch: Partial<KramState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  switch (act.kind) {
    case "cell": {
      if (p.goal !== "next") return no("no_board");
      const g = boardOf(p).grid, x = Number(act.x), y = Number(act.y);
      if (!isInt(x) || !isInt(y) || x < 0 || y < 0 || x >= g || y >= g) return no("bad_cell");
      const i = y * g + x;
      const cells = s.cells.includes(i) ? s.cells.filter((c) => c !== i) : [...s.cells, i].sort((a, b) => a - b);
      return change({ cells });
    }
    case "bag": {
      if (p.goal !== "far" && p.goal !== "count") return no("no_bag");
      const pl = Number(act.place), by = Number(act.by);
      if (!isInt(pl) || pl < 0 || pl >= s.bag.length || (by !== 1 && by !== -1)) return no("bad_rack");
      const c = s.bag[pl] + by;
      if (c > RACK) return no("rack_full");
      if (c < 0) return no("rack_empty");
      const bag = [...s.bag]; bag[pl] = c;
      return change({ bag });
    }
    case "dial": {
      if (p.goal !== "step" && p.goal !== "rule") return no("no_machine");
      const which = Number(act.which), to = Number(act.to);
      if ((which !== 0 && which !== 1) || !isInt(to)) return no("bad_dial");
      const [lo, hi] = p.goal === "step" ? (which === 0 ? [0, OPS.length - 1] : STEP_V) : which === 0 ? DIAL_A : DIAL_B;
      if (to < lo || to > hi) return no("bad_dial");
      if ((which === 0 ? s.d0 : s.d1) === to) return no("same_dial");
      return change(which === 0 ? { d0: to } : { d1: to });
    }
    case "lay": {
      if (p.goal !== "lay") return no("no_shelf");
      const r = act.r;
      if (!isRhythm(r)) return no("bad_rhythm");
      if (beatsOf(r) !== p.n) return no("not_n_beats");
      const laid = s.laid.includes(r) ? s.laid.filter((x) => x !== r) : [...s.laid, r];
      return change({ laid });
    }
    case "pick": {
      if (p.goal !== "odd" && p.goal !== "pair") return no("no_tray");
      const i = Number(act.i);
      if (!isInt(i) || i < 0 || i >= p.n + 2) return no("bad_piece");
      const had = s.picked.includes(i);
      if (!had && p.goal === "pair" && s.picked.length >= 2) return no("two_only");
      const picked = had ? s.picked.filter((x) => x !== i) : [...s.picked, i].sort((a, b) => a - b);
      return change({ picked });
    }
    case "run": {
      if (s.ended) return no("change_first");
      if ((p.goal === "far" || p.goal === "count") && loadOf(s.bag) === 0) return no("fill_first");
      if (p.goal === "next" && s.cells.length === 0) return no("build_first");
      if (p.goal === "lay" && s.laid.length === 0) return no("lay_first");
      if ((p.goal === "odd" && s.picked.length === 0) || (p.goal === "pair" && s.picked.length !== 2)) return no("pick_first");
      const su = setupOf(s), runs = s.runs + 1, ok = judge(p, su);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: p.goal, run: runs };
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) {
        const m = malSetup(p, mal);
        if (m && sameSetup(p, { ...su, ...m }, su)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      out.push(mom(nearOf(p, s) ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
/** near: one tile / one piece / one rhythm off; the bag within a step; the machine's sign right and its number one off */
function nearOf(p: KramParams, s: KramState): boolean {
  switch (p.goal) {
    case "next": { const t = boardTiles(p, p.n); return Math.abs(s.cells.length - t.length) === 1 && (s.cells.every((c) => t.includes(c)) || t.every((c) => s.cells.includes(c))); }
    case "far": case "count": { const d = Math.abs(loadOf(s.bag) - want(p)); return d > 0 && d <= Math.max(1, Math.abs(countOf(p.seq, p.shown) - countOf(p.seq, p.shown - 1))); }
    case "step": return OPS[s.d0] === p.op && Math.abs(s.d1 - p.v) === 1;
    case "rule": return s.d0 === p.a && Math.abs(s.d1 - p.b) === 1;
    case "lay": { const all = rhythms(p.n); return s.laid.length === all.length - 1 && s.laid.every((r) => all.includes(r)); }
    case "odd": return s.picked.length === p.n - 1 && s.picked.every((i, k) => i === k);
    case "pair": return s.picked.includes(p.n - 1) || s.picked.includes(p.n - 2);
  }
}
const goalMet = (_l: PlayLevel<KramParams>, s: KramState) => s.done;

/** the acts that turn the level's start into a set-up, then run */
export function setupActs(p: KramParams, su: Setup): KramAct[] {
  const acts: KramAct[] = [];
  if (p.goal === "next") {
    const g = boardOf(p).grid, start = boardTiles(p, p.n - 1), cells = su.cells ?? [];
    for (const i of start) if (!cells.includes(i)) acts.push({ kind: "cell", x: i % g, y: Math.floor(i / g) });
    for (const i of cells) if (!start.includes(i)) acts.push({ kind: "cell", x: i % g, y: Math.floor(i / g) });
  } else if (p.goal === "far" || p.goal === "count") {
    const v = su.load ?? 0;
    for (let place = 0; place < racksOf(p); place++) for (let k = 0; k < Math.floor(v / 10 ** place) % 10; k++) acts.push({ kind: "bag", place, by: 1 });
  } else if (p.goal === "step" || p.goal === "rule") {
    const d00 = 0, d10 = p.goal === "step" ? 1 : 0;
    if ((su.d0 ?? d00) !== d00) acts.push({ kind: "dial", which: 0, to: su.d0! });
    if ((su.d1 ?? d10) !== d10) acts.push({ kind: "dial", which: 1, to: su.d1! });
  } else if (p.goal === "lay") for (const r of su.laid ?? []) acts.push({ kind: "lay", r });
  else for (const i of su.picked ?? []) acts.push({ kind: "pick", i });
  acts.push({ kind: "run" });
  return acts;
}
function answerSetup(p: KramParams): Setup {
  switch (p.goal) {
    case "next": return { cells: boardTiles(p, p.n) };
    case "far": case "count": return { load: want(p) };
    case "step": return { d0: OPS.indexOf(p.op), d1: p.v };
    case "rule": return { d0: p.a, d1: p.b };
    case "lay": return { laid: [...rhythms(p.n - 1).map((r) => `S${r}`), ...rhythms(p.n - 2).map((r) => `L${r}`)] };
    case "odd": return { picked: Array.from({ length: p.n }, (_, i) => i) };
    case "pair": return { picked: [p.n - 2, p.n - 1] };
  }
}
function solve(level: PlayLevel<KramParams>): KramAct[] | null {
  const p = level.params, su = answerSetup(p);
  return legal(p, su) && judge(p, su) ? setupActs(p, su) : null;
}
/**
 * Set-ups that win without the idea: the last stage run unchanged or the whole board filled; the bag filled with the last
 * stage shown or with the stage number; the machine left as it stands; every tray piece picked. A level any of them solves
 * is never served.
 */
export function shortcutActs(p: KramParams): KramAct[][] {
  const tries: Setup[] = [];
  if (p.goal === "next") { const g = boardOf(p).grid; tries.push({ cells: Array.from({ length: g * g }, (_, i) => i) }); }
  if (p.goal === "far" || p.goal === "count") tries.push({ load: countOf(p.seq, p.shown) }, { load: p.n });
  if (p.goal === "step") tries.push({ d0: 0, d1: 1 });
  if (p.goal === "rule") tries.push({ d0: 1, d1: 0 }, { d0: 0, d1: ruleOut(p.a, p.b, 1) });
  if (p.goal === "odd") tries.push({ picked: Array.from({ length: p.n + 2 }, (_, i) => i) });
  return tries.filter((su) => legal(p, su)).map((su) => setupActs(p, su));
}
function replayDone(level: PlayLevel<KramParams>, acts: KramAct[]): boolean {
  let s = init(level);
  for (const a of acts) s = apply(level, s, a, 1).state;
  return s.done;
}
function shortcut(level: PlayLevel<KramParams>): KramAct[] | null {
  for (const t of shortcutActs(level.params)) if (replayDone(level, t)) return t;
  return null;
}
function malActs(level: PlayLevel<KramParams>, mal: string): KramAct[] | null {
  const m = malSetup(level.params, mal);
  return m ? setupActs(level.params, m) : null;
}

interface KramGrammar {
  /** grow (next / far): the figures a level draws from */
  seqs?: string[];
  /** far / count / rule: the far stage (lo, hi) */
  far?: [number, number];
  /** next: the stage to build (lo, hi); lay: the beats; odd / pair: the frame's side */
  n?: [number, number];
  /** step: the list kinds */
  kinds?: string[];
}
function difficultyOf(p: KramParams): number {
  const f = 0.06 * (p.face - 1);
  switch (p.goal) {
    case "next": return Math.min(1, 0.2 + f + 0.05 * p.n + (p.seq === "square" || p.seq === "stair" ? 0.05 : 0));
    case "far": case "count": return Math.min(1, 0.3 + f + 0.02 * p.n + (["koch", "lines", "virahanka", "square", "stair"].includes(p.seq) ? 0.15 : 0));
    case "step": return Math.min(1, 0.2 + f + (p.op === "x" || p.op === "/" ? 0.15 : 0) + (p.op === "-" ? 0.08 : 0));
    case "rule": return Math.min(1, 0.4 + f + 0.03 * p.a);
    case "lay": return Math.min(1, 0.2 + f + 0.08 * p.n);
    default: return Math.min(1, 0.2 + f + 0.06 * p.n);
  }
}
const FIG_STEP: Record<string, [number, number]> = { houses: [5, 4], sqrow: [4, 3], trirow: [3, 2] };
function generate(req: GenRequest): Candidate<KramParams>[] {
  const g = req.grammar as KramGrammar;
  const mode = (["grow", "machine", "beats", "nest"] as const).find((m) => m === req.mode) ?? "grow";
  const goal = (GOALS_OF[mode].includes(req.goal as KramGoal) ? req.goal : GOALS_OF[mode][0]) as KramGoal;
  const rnd = mulberry32(req.seed), out: Candidate<KramParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const face = req.fade as 1 | 2 | 3;
  const range = (r: unknown, d: [number, number]): [number, number] => (Array.isArray(r) && r.length === 2 && isInt(r[0]) && isInt(r[1]) && r[0] <= r[1] ? [r[0], r[1]] : d);
  const mk = (params: KramParams, sig: string): Candidate<KramParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `kram-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "kram", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "kram", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const seqsIn = (allow: readonly string[], d: string[]) => { const s = (g.seqs ?? d).filter((x) => allow.includes(x)); return s.length ? s : d; };
  for (let k = 0; k < 120 && out.length < 24; k++) {
    const p: KramParams = { goal, face, ...BASE };
    if (goal === "next") {
      p.seq = pickOf(seqsIn(TILE_SEQS, ["square", "stair", "ell", "plus", "oblong"]));
      const [lo, hi] = range(g.n, [4, 6]);
      p.n = int(Math.max(4, lo), Math.min(p.seq === "plus" ? 5 : 6, hi)); p.shown = 3;
    } else if (goal === "far") {
      p.seq = pickOf(seqsIn(FAR_SEQS, ["houses", "sqrow", "trirow"]));
      p.shown = p.seq === "koch" ? 2 : p.seq === "lines" ? 4 : 3;
      const [lo, hi] = p.seq === "koch" ? [4, 6] : range(g.far, p.seq === "lines" ? [7, 12] : [8, 20]);
      p.n = int(Math.max(p.shown + 2, lo), hi);
    } else if (goal === "count") {
      p.seq = "virahanka"; p.shown = 4;
      const [lo, hi] = range(g.far, [6, 10]);
      p.n = int(Math.max(6, lo), Math.min(12, hi));
    } else if (goal === "step") {
      const kinds = (g.kinds ?? ["add", "sub", "mul", "div", "cal"]).filter((x) => ["add", "sub", "mul", "div", "cal", "fig"].includes(x));
      p.seq = pickOf(kinds.length ? kinds : ["add"]);
      p.n = int(4, 5); p.shown = p.n;
      if (p.seq === "add") { p.op = "+"; p.v = int(2, 12); p.a = int(1, 40); }
      else if (p.seq === "sub") { p.op = "-"; p.v = int(2, 12); p.a = p.v * (p.n + 2) + int(0, 40); }
      else if (p.seq === "mul") { p.op = "x"; p.v = pickOf([2, 2, 3]); p.a = int(1, p.v === 2 ? 6 : 3); }
      else if (p.seq === "div") { p.op = "/"; p.v = 2; p.a = int(1, 5) * 2 ** (p.n + 1); }
      else if (p.seq === "cal") { p.op = "+"; p.v = 7; p.a = int(1, 3); p.n = 3; p.shown = 3; }
      else { const fig = pickOf(Object.keys(FIG_STEP)); p.op = "+"; [p.a, p.v] = FIG_STEP[fig]; p.n = int(3, 4) + 1; p.shown = p.n; p.seq = "fig"; }
    } else if (goal === "rule") {
      p.a = int(2, 7); p.b = int(1, 7); p.shown = RULE_SHOWN;
      const [lo, hi] = range(g.far, [10, 50]);
      p.n = pickOf([10, 20, 25, 30, 50, 100].filter((x) => x >= lo && x <= hi).concat([int(Math.max(10, lo), Math.min(100, hi))]));
    } else {
      const [lo, hi] = range(g.n, goal === "lay" ? [4, 5] : [3, 6]);
      p.n = int(Math.max(3, lo), Math.min(goal === "pair" ? 7 : 6, hi));
    }
    const sig = `${goal}:${p.seq}:${p.n}:${p.a}:${p.op}${p.v}:${p.b}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(p, sig);
    const v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push(cand);
  }
  return out;
}

function facts(level: PlayLevel<KramParams>, s: KramState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (p.goal === "next") { f.stage = p.n; f.tiles = s.cells.length; }
  if (p.goal === "far" || p.goal === "count") { f.stage = p.n; const v = loadOf(s.bag); if (v) f.bag = v; }
  if (p.goal === "step") { f.list = listOf(p, 0).join(", "); f.machine = `${OPS[s.d0]} ${s.d1}`; }
  if (p.goal === "rule") f.machine = `${s.d0} × n + ${s.d1}`;
  if (p.goal === "lay") { f.beats = p.n; f.laid = s.laid.length; }
  if (p.goal === "odd" || p.goal === "pair") { f.frame = `${p.n} × ${p.n}`; f.picked = s.picked.length; }
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<KramParams>, s: KramState) {
  const p = level.params, lines: string[] = [];
  if (p.goal === "next") lines.push(`stages: ${[p.n - 3, p.n - 2, p.n - 1].map((k) => countOf(p.seq, k)).join(", ")}`, `build stage ${p.n}`, `tiles: ${s.cells.length}`);
  if (p.goal === "far" || p.goal === "count") lines.push(`stages: ${Array.from({ length: p.shown }, (_, i) => countOf(p.seq, i + 1)).join(", ")}`, `stage ${p.n}`, `bag: ${loadOf(s.bag)}`);
  if (p.goal === "step") lines.push(`list: ${listOf(p, 0).join(", ")}, _, _`, `machine: ${OPS[s.d0]} ${s.d1}`);
  if (p.goal === "rule") lines.push(`stages: ${Array.from({ length: RULE_SHOWN }, (_, i) => ruleOut(p.a, p.b, i + 1)).join(", ")}`, `machine: ${s.d0} × n + ${s.d1}`, `stage ${p.n}`);
  if (p.goal === "lay") lines.push(`beats: ${p.n}`, `laid: ${s.laid.join(" ")}`);
  if (p.goal === "odd" || p.goal === "pair") lines.push(`frame: ${p.n} × ${p.n}`, `picked: ${s.picked.map((i) => trayOf(p)[i]).join(" + ")}`);
  return { title: "Kram", lines };
}
function grade(level: PlayLevel<KramParams>, acts: PlayActEnvelope<KramAct>[]): PlayGrade {
  return gradeLevel(kramLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const kramLogic: FamilyLogic<KramParams, KramState, KramAct> = {
  family: "kram", modes: ["grow", "machine", "beats", "nest"], malRules: KRAM_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
