// Stambh · tally (round 8, c4-maths-ch14-t01 s1: organise data using tally marks and a table). Tallies drawn in fives.
//   keep  a small scene passes one thing at a time (bangles on a stall, vehicles at a crossing). For each thing the child
//         picks its row and makes one stroke there with one of two buttons, "|" (a standing line) or "╱" (the line across).
//         When the scene has passed she writes each row's total into the table, then checks.
//   read  a row of tallies stands; she writes how many it shows, then checks.
// PURE law + generator + solver + grader. The law:
//   - a bundle is four standing lines and one line across, worth 5; a row reads 5 × bundles + singles (one per stroke);
//   - every stroke is legal: a fifth standing line without a cross is a mark but no bundle, a line across after fewer or
//     more than four standing lines closes a group that is no bundle; nothing is refused for its shape, so trying the
//     line across until it "works" finds nothing out;
//   - at a check the law groups each row by fives (a group ends at a line across or at the fifth standing line) and shows
//     the groups; a row is kept right when it has one stroke per thing of its kind AND every group but the last open one
//     is a bundle; the table is right when every total is the row's count;
//   - keep: once the scene has passed she may keep it again from the start ("again": strokes and totals clear; undo
//     brings them back), which is how a tally is repaired after the strip has folded away.
// Mal-rule (deterministic malActs), named only where its answer differs from every one-bundle slip (one bundle skipped,
// one bundle counted twice, one single line off): the generator serves only such levels and the law re-checks it.
//   tally-four  read: a bundle read as its four standing lines (answer 4 × bundles + singles, short by the bundles);
//               keep, from the marks ("five"): one stroke per thing and no line across anywhere, whatever the totals
//               (five written as five standing lines, the kit's second sign; judges round 2, ruling 4);
//               keep, from the totals ("counted"): one stroke per thing, lines across drawn, and every total the row's
//               count less its bundles (each wrong total short by exactly its row's bundles)
import type { Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, StambhAct } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type TallyGoal = "keep" | "read";
export interface TallyParams {
  goal: TallyGoal;
  /** the scene (words only; never changes the maths) and its category ids, in row order */
  ctx: string;
  cats: string[];
  /** the true count per row (read: one row, the tally shown) */
  counts: number[];
  /** keep: the order the things pass, as row indices (each row's count of them); read: [] */
  seq: number[];
  /** the fade (1..3): sizes grow with it */
  labels: 1 | 2 | 3;
}
export interface TallyState extends Undoable<TallyState> {
  /** each row's strokes in order (true = the line across) */
  marks: boolean[][];
  /** keep: the next thing to pass (seq.length = the scene has passed) */
  at: number;
  /** what she wrote in each row's total cell (read: [her answer]) */
  totals: (number | null)[];
  checks: number; done: boolean; acts: number;
  /** the mal-rule the first check showed (a fact for the teacher), or null */
  mal: string | null;
  /** which of the kit's signs the first check showed: "counted" (lines across drawn, totals four per bundle), "five" (no
   *  line across anywhere: five written as five standing lines) */
  sign?: TallySign | null;
}
export type TallySign = "counted" | "five";
export const TALLY_MAL = ["tally-four"] as const;
/** scene id → its category ids (each has a word stambh.cat.<id>); each category has its own drawn shape */
export const TALLY_CONTEXTS: Record<string, string[]> = {
  bangles: ["kaanch", "kada", "moti"],
  traffic: ["car", "bus", "auto", "cycle"],
};
/** the most strokes a row holds (ten bundles and four: what the 360 px row is laid out for) */
export const MAX_COUNT = 54;
const MAX_SCENE = 30;
/** the largest cases the generator serves (the layout test and the packet's largest screens use them): a read row of
 *  READ_MAX strokes; a keep scene of KEEP_SCENE_MAX things across three rows, one row at KEEP_ROW_MAX */
export const READ_MAX = 49, KEEP_ROW_MAX = 14, KEEP_SCENE_MAX = 28;

/**
 * Can the evidence tell tally-four from a one-bundle slip on these givens? The mix-up's totals (each row less its
 * bundles) must differ from every totals vector one slip away from the truth: one row with one bundle skipped (−5), one
 * bundle counted twice (+5), or one single line off (±1). Read: never when the bundles are 1 (n − 1) or 5 (n − 5).
 */
export function tellsApart(counts: readonly number[]): boolean {
  const mal = counts.map(four);
  if (mal.every((m, r) => m === counts[r])) return false;
  for (let r = 0; r < counts.length; r++) for (const d of [-5, 5, -1, 1]) {
    if (mal.every((m, k) => m === (k === r ? counts[k] + d : counts[k]))) return false;
  }
  return true;
}

/** the strokes a count is tallied in: bundles (four standing, the fifth across), then the loose standing lines */
export const tallyOf = (n: number): boolean[] => Array.from({ length: n }, (_, i) => i % 5 === 4);
/** a tally-four reader's number: each bundle read as its four standing lines */
export const four = (n: number) => 4 * Math.floor(n / 5) + (n % 5);
export interface TallyGroup { from: number; len: number; kind: "bundle" | "five" | "short" | "open" }
/**
 * The law's commit pass: a row's strokes in groups. A group ends at a line across (a bundle when it closes four standing
 * lines, else "short") or at its fifth standing line ("five": a fifth standing line, no bundle); what is left is "open".
 */
export function groupsOf(marks: readonly boolean[]): TallyGroup[] {
  const out: TallyGroup[] = [];
  let from = 0, standing = 0;
  marks.forEach((m, i) => {
    if (m) { out.push({ from, len: i - from + 1, kind: standing === 4 ? "bundle" : "short" }); from = i + 1; standing = 0; return; }
    standing++;
    if (standing === 5) { out.push({ from, len: 5, kind: "five" }); from = i + 1; standing = 0; }
  });
  if (from < marks.length) out.push({ from, len: marks.length - from, kind: "open" });
  return out;
}
/** a row is tallied as tallies are: every fifth stroke across, every other standing */
export const bundled = (marks: readonly boolean[]) => marks.every((m, i) => m === (i % 5 === 4));
export const bundlesIn = (marks: readonly boolean[]) => groupsOf(marks).filter((g) => g.kind === "bundle").length;
/** where a line across belongs and is missing: each group of five standing lines */
export const crossesMissingIn = (marks: readonly boolean[]) => groupsOf(marks).filter((g) => g.kind === "five").length;
/** values the teacher may not say before the child does (every row's count) */
export function tallyHidden(level: PlayLevel<unknown>): number[] {
  const p = level.params as Partial<TallyParams> | null;
  return p && Array.isArray(p.counts) ? [...new Set(p.counts.filter((x) => typeof x === "number"))] : [];
}

/**
 * Pure geometry of a row's strokes (the view draws them; a test proves ten bundles fit a 360 px row): strokes left to right
 * at spacing `sp`, a gap after each group, wrapping to a new line when the next group would cross the width. `grouped`:
 * the law's commit pass (a gap after every group, groupsOf); else the child's own (a gap after each line across only).
 * Returns each standing stroke's x and line, each line across's span, the lines used, and the sizes chosen.
 */
export function tallyFlow(marks: readonly boolean[], width: number, height: number, grouped: boolean, maxStroke = 34) {
  const groups: { from: number; len: number }[] = [];
  if (grouped) for (const g of groupsOf(marks)) groups.push({ from: g.from, len: g.len });
  else { let from = 0; marks.forEach((m, i) => { if (m) { groups.push({ from, len: i - from + 1 }); from = i + 1; } }); if (from < marks.length) groups.push({ from, len: marks.length - from }); }
  // one pass of the flow at stroke spacing sp: a group wraps whole when it fits a fresh line, else stroke by stroke
  const flow = (sp: number) => {
    const gap = sp * 1.4, x00 = sp * 0.6;
    const stand: { i: number; x: number; line: number }[] = [], across: { i: number; x0: number; x1: number; line: number }[] = [];
    let x = x00, line = 0, right = x00;
    for (const g of groups) {
      const units = Math.max(1, marks.slice(g.from, g.from + g.len).filter((m) => !m).length);
      if (x > x00 && x + units * sp > width && x00 + units * sp <= width) { line++; x = x00; }
      let x0 = x, l0 = line;
      for (let k = g.from; k < g.from + g.len; k++) {
        if (marks[k]) {
          // the line across lies over the standing lines of its group on this line (a lone one takes a place of its own)
          if (x === x0) x += sp;
          across.push({ i: k, x0: x0 - sp * 0.5, x1: x - sp * 0.5, line: l0 });
        } else {
          if (x + sp * 0.4 > width) { line++; x = x00; x0 = x; l0 = line; }
          stand.push({ i: k, x, line }); x += sp;
        }
      }
      right = Math.max(right, x);
      x += gap;
    }
    return { stand, across, lines: line + 1, right };
  };
  // the fewest lines whose strokes are still plainly legible (spacing ≥ 8 px, height ≥ 22 px): a row is read along one
  // line wherever it can be; only when no line count reaches that, the biggest strokes that fit the box
  const B = Math.max(1, Math.ceil(marks.length / 5));
  let best = null as null | { sp: number; sh: number; lineH: number; f: ReturnType<typeof flow> }, fewest = null as typeof best;
  const score = (b: { sp: number; sh: number }) => Math.min(b.sp * 2.4, b.sh);
  // one line's exact width in spacings: the lead-in, each group's standing lines (a lone line across takes one), the gaps
  const units1 = 0.6 + groups.reduce((a, g) => a + Math.max(1, marks.slice(g.from, g.from + g.len).filter((m) => !m).length), 0) + 1.4 * Math.max(0, groups.length - 1);
  for (let lines = 1; lines <= 8; lines++) {
    const perLine = Math.ceil(B / lines);
    const sp = Math.min(maxStroke * 0.4, width / (lines === 1 ? units1 + 0.01 : perLine * 5.4 + 0.6));
    const f = flow(sp);
    if (f.lines > lines) continue;
    const lineH = height / lines, sh = Math.min(maxStroke, lineH * 0.72, sp * 4.2);
    if (!fewest && sp >= 8 && sh >= 22) fewest = { sp, sh, lineH, f };
    if (!best || score({ sp, sh }) > score(best) + 0.01) best = { sp, sh, lineH, f };
  }
  if (fewest) best = fewest;
  if (!best) { const sp = Math.max(2, width / (B * 5.4 + 0.6)), f = flow(sp), lineH = height / f.lines; best = { sp, sh: Math.min(maxStroke, lineH * 0.72), lineH, f }; }
  return { sp: best.sp, sh: best.sh, lineH: best.lineH, lines: best.f.lines, stand: best.f.stand, across: best.f.across, right: best.f.right };
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);

function validate(level: PlayLevel<unknown>): PlayLevel<TallyParams> | null {
  const p = level.params as Partial<TallyParams> | null;
  if (!p || level.mode !== "tally" || (p.goal !== "keep" && p.goal !== "read")) return null;
  const cats = typeof p.ctx === "string" ? TALLY_CONTEXTS[p.ctx] : undefined;
  if (!cats || !Array.isArray(p.cats) || !Array.isArray(p.counts) || !Array.isArray(p.seq)) return null;
  const n = p.cats.length;
  if (p.counts.length !== n || new Set(p.cats).size !== n || !p.cats.every((c) => typeof c === "string" && cats.includes(c))) return null;
  if (!p.counts.every((c) => isInt(c) && c >= 1 && c <= MAX_COUNT)) return null;
  const labels = p.labels === 2 || p.labels === 3 ? p.labels : 1;
  if (p.goal === "read") {
    // a row of bundles only is never served: always at least one single line
    if (n !== 1 || p.seq.length !== 0 || p.counts[0] < 5 || p.counts[0] % 5 === 0) return null;
  } else {
    if (n < 2 || n > 3 || p.seq.length > MAX_SCENE || !p.seq.every((r) => isInt(r) && r >= 0 && r < n)) return null;
    if (!p.counts.every((c, r) => (p.seq as number[]).filter((x) => x === r).length === c)) return null;
  }
  // the mix-up's answer must differ from every one-bundle slip, or the evidence cannot tell them apart
  if (!tellsApart(p.counts)) return null;
  return { ...level, params: { goal: p.goal, ctx: p.ctx as string, cats: [...p.cats], counts: [...p.counts], seq: [...p.seq], labels } };
}
function init(level: PlayLevel<TallyParams>): TallyState {
  const p = level.params;
  return { marks: p.goal === "read" ? [tallyOf(p.counts[0])] : p.cats.map(() => []), at: 0, totals: p.cats.map(() => null),
    checks: 0, done: false, acts: 0, mal: null, sign: null, prev: null, depth: 0 };
}
const sceneLeft = (p: TallyParams, s: TallyState) => (p.goal === "keep" ? p.seq.length - s.at : 0);
/** her keep is right row by row (one stroke per thing, bundled) and the table is right */
const rowRight = (p: TallyParams, s: TallyState, r: number) => (p.goal === "read" || (s.marks[r].length === p.counts[r] && bundled(s.marks[r])));
const totalRight = (p: TallyParams, s: TallyState, r: number) => s.totals[r] === p.counts[r];
/**
 * The tally-four signature on this state, or null. Only on givens where the mix-up differs from every one-bundle slip.
 *   read: the bundles read as four (4 × bundles + singles);
 *   keep "five": one stroke per thing in every row and no line across anywhere, whatever the totals (judges round 2,
 *        ruling 4: a tally kept with no line across is the kit's second sign however she then counts it);
 *   keep "counted": one stroke per thing in every row, lines across drawn, and every total the row's count less its
 *        bundles (each wrong total short by exactly its row's bundles, the rest right).
 */
export function tallyFourSign(p: TallyParams, s: Pick<TallyState, "marks" | "totals">): TallySign | null {
  if (!tellsApart(p.counts)) return null;
  if (p.goal === "read") return s.totals[0] === four(p.counts[0]) ? "counted" : null;
  if (!p.cats.every((_, r) => s.marks[r].length === p.counts[r])) return null;
  if (s.marks.every((m) => m.every((x) => !x))) return "five";
  if (p.counts.every((c, r) => s.totals[r] === four(c))) return "counted";
  return null;
}

function apply(level: PlayLevel<TallyParams>, s: TallyState, act: StambhAct, seq: number): { state: TallyState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: TallyState): TallyState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const no = (why: string) => ({ state: bump(s), moments: out, refused: why });
  if (act.kind === "mark") {
    if (p.goal !== "keep") return no("given");
    const r = Number(act.row);
    if (!isInt(r) || r < 0 || r >= p.cats.length) return no("bad_row");
    if (s.at >= p.seq.length) return no("none_left");
    const marks = s.marks.map((m, i) => (i === r ? [...m, !!act.across] : m));
    return { state: bump(pushUndo(s, { ...s, marks, at: s.at + 1 })), moments: out };
  }
  if (act.kind === "total") {
    // (a cleared cell travels as n absent: the server's act sanitiser keeps numbers, strings and booleans only)
    const r = Number(act.row), n = act.n ?? null;
    if (!isInt(r) || r < 0 || r >= p.cats.length) return no("bad_row");
    if (n !== null && (!isInt(n) || n < 0 || n > 99)) return no("bad_number");
    if (sceneLeft(p, s) > 0) return no("scene_first");
    const totals = s.totals.map((t, i) => (i === r ? n : t));
    return { state: bump(pushUndo(s, { ...s, totals })), moments: out };
  }
  if (act.kind === "again") {
    // keep: the scene passes again from the start; what the first check showed stays (the evidence is the first check's)
    if (p.goal !== "keep") return no("given");
    if (sceneLeft(p, s) > 0) return no("scene_first");
    return { state: bump(pushUndo(s, { ...s, marks: p.cats.map(() => []), totals: p.cats.map(() => null), at: 0 })), moments: out };
  }
  if (act.kind === "check") {
    if (sceneLeft(p, s) > 0) return no("scene_first");
    if (s.totals.some((t) => t === null)) return no("fill_first");
    const rows = p.cats.map((_, r) => r);
    const bundles = s.marks.reduce((a, m) => a + bundlesIn(m), 0), crossesMissing = s.marks.reduce((a, m) => a + crossesMissingIn(m), 0);
    const answer = s.totals.join(",");
    const f: Facts = { bundles, goal: p.goal, answer, ...(p.goal === "keep" ? { crossesMissing } : {}) };
    const offRows = rows.filter((r) => !rowRight(p, s, r)), offTotals = rows.filter((r) => !totalRight(p, s, r));
    let next = bump(pushUndo(s, { ...s, checks: s.checks + 1 }));
    if (!offRows.length && !offTotals.length) { out.push(mom("solved", seq, f)); return { state: { ...next, done: true }, moments: out }; }
    const sign = Object.keys(level.mal).includes("tally-four") ? tallyFourSign(p, s) : null;
    if (sign) {
      if (s.checks === 0) next = { ...next, mal: "tally-four", sign };
      // the gap: what the mix-up leaves out (the bundles read as four, or the lines across not drawn)
      const gap = sign === "five" ? crossesMissing : p.counts.reduce((a, c) => a + Math.floor(c / 5), 0);
      out.push(mom("misconception_consequence", seq, { ...f, sign, gap }, "tally-four"));
      return { state: next, moments: out, refused: "missed" };
    }
    // one thing from the answer: one total one off (its row kept right), or one row one stroke off with its total its own
    const off = [...new Set([...offRows, ...offTotals])];
    const near = p.goal === "read" ? Math.abs((s.totals[0] ?? 0) - p.counts[0]) === 1
      : off.length === 1 && Math.abs(s.marks[off[0]].length - p.counts[off[0]]) <= 1 && Math.abs((s.totals[off[0]] ?? 0) - p.counts[off[0]]) <= 1;
    const why = p.goal === "read" ? "read_off" : offRows.some((r) => s.marks[r].length === p.counts[r]) ? "not_bundled" : offRows.length ? "tally_off" : "totals_off";
    out.push(mom(near ? "near_miss" : "law_refused", seq, { ...f, why }));
    return { state: next, moments: out, refused: "missed" };
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<TallyParams>, s: TallyState) => s.done;

/** the acts that keep the scene with `strokes` (one per thing: across or not) and write `totals`, then check */
function keepActs(p: TallyParams, across: (row: number, kth: number) => boolean, totals: number[]): StambhAct[] {
  const acts: StambhAct[] = [], seen = p.cats.map(() => 0);
  for (const r of p.seq) { acts.push({ kind: "mark", row: r, across: across(r, seen[r]) }); seen[r]++; }
  totals.forEach((n, r) => acts.push({ kind: "total", row: r, n }));
  acts.push({ kind: "check" });
  return acts;
}
const readActs = (n: number): StambhAct[] => [{ kind: "total", row: 0, n }, { kind: "check" }];
function solve(level: PlayLevel<TallyParams>): StambhAct[] {
  const p = level.params;
  return p.goal === "read" ? readActs(p.counts[0]) : keepActs(p, (_r, k) => k % 5 === 4, p.counts);
}
/**
 * The tally-four child's acts, in each of its forms: "counted" (keep: the bundles drawn as tallies are drawn, each row's
 * total counted off its standing lines; read: 4 × bundles + singles), "five" (keep: five written as five standing lines,
 * no line across anywhere, the totals counted right), "plain" (keep: five standing lines AND each group of them read as
 * four: named "five", as every tally with no line across is). Null where the givens cannot tell the mix-up from a
 * one-bundle slip.
 */
export function tallyFourActs(p: TallyParams, form: "counted" | "five" | "plain"): StambhAct[] | null {
  if (!tellsApart(p.counts)) return null;
  if (p.goal === "read") return form === "counted" ? readActs(four(p.counts[0])) : null;
  if (form === "counted") return keepActs(p, (_r, k) => k % 5 === 4, p.counts.map(four));
  if (form === "five") return keepActs(p, () => false, p.counts);
  return keepActs(p, () => false, p.counts.map(four));
}
function malActs(level: PlayLevel<TallyParams>, mal: string): StambhAct[] | null {
  // the main form: the bundles are drawn right and counted by their standing lines
  return mal === "tally-four" ? tallyFourActs(level.params, "counted") : null;
}
/**
 * The idea-free ways through, tried on the law (a level any of them passes is never served):
 *   read: the standing lines alone, the groups, the groups and the loose lines, the bundles read as four;
 *   keep: every stroke standing with each row's strokes counted (a table right, no bundle drawn: tally-four's "five"
 *         form); every stroke a line across; the bundles read as four.
 */
export function idleWays(p: TallyParams): StambhAct[][] {
  if (p.goal === "read") {
    const n = p.counts[0], b = Math.floor(n / 5), s = n % 5, groups = b + (s ? 1 : 0);
    return [4 * b + s, b, groups, b + s, s].filter((x) => x >= 0 && x <= 99).map(readActs);
  }
  return [keepActs(p, () => false, p.counts), keepActs(p, () => true, p.counts), keepActs(p, () => false, p.counts.map(four))];
}
function shortcut(level: PlayLevel<TallyParams>): StambhAct[] | null {
  for (const acts of idleWays(level.params)) {
    let s = init(level);
    for (let i = 0; i < acts.length; i++) s = apply(level, s, acts[i], i + 1).state;
    if (s.done) return acts;
  }
  return null;
}

function difficultyOf(p: TallyParams): number {
  if (p.goal === "read") { const n = p.counts[0]; return Math.min(1, 0.25 + 0.035 * Math.floor(n / 5) + (n % 5 ? 0.05 : 0) + 0.06 * (p.labels - 1)); }
  return Math.min(1, 0.3 + 0.015 * p.seq.length + 0.08 * (p.cats.length - 2) + 0.05 * (p.labels - 1));
}
interface TallyGrammar { goal?: TallyGoal }
function generate(req: GenRequest): Candidate<TallyParams>[] {
  const g = req.grammar as TallyGrammar;
  const goal: TallyGoal = req.goal === "read" || req.goal === "keep" ? req.goal : g.goal ?? "keep";
  const rnd = mulberry32(req.seed), out: Candidate<TallyParams>[] = [], seen = new Set<string>();
  const labels = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const ctxIds = Object.keys(TALLY_CONTEXTS);
  const mk = (params: TallyParams, sig: string): Candidate<TallyParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `stambh-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "stambh", mode: "tally", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: params.ctx, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  // the sizes by fade: read 11-19 / 11-34 / 21-49 (at most nine bundles and four); keep a scene of 10-14 / 12-22 / 16-28
  // things. Served only where tally-four's answer differs from every one-bundle slip (tellsApart): read never with one or
  // five bundles, never bundles only (at least one single line); keep with at least two bundles across the rows.
  const RANGE = { 1: [11, 19], 2: [11, 34], 3: [21, READ_MAX] }[labels] as [number, number];
  const SCENE = { 1: [10, 14], 2: [12, 22], 3: [16, KEEP_SCENE_MAX] }[labels] as [number, number];
  for (let k = 0; k < 60 && out.length < 16; k++) {
    const ctx = ctxIds[Math.floor(rnd() * ctxIds.length)], all = TALLY_CONTEXTS[ctx];
    if (goal === "read") {
      const n = int(RANGE[0], RANGE[1]);
      if (n % 5 === 0 || !tellsApart([n])) continue;
      const cat = all[Math.floor(rnd() * all.length)];
      const params: TallyParams = { goal, ctx, cats: [cat], counts: [n], seq: [], labels };
      const sig = `tally:read:${n}`;
      if (seen.has(sig)) continue;
      seen.add(sig); out.push(mk(params, sig));
      continue;
    }
    const nc = labels === 1 ? 2 : Math.min(3, all.length);
    const start = Math.floor(rnd() * (all.length - nc + 1)), cats = all.slice(start, start + nc);
    const total = int(SCENE[0], SCENE[1]);
    // every row at least 2; two bundles across the rows (two rows reach 5, or one row 10); the rest share what is left
    const counts = cats.map(() => 2);
    const big = Math.floor(rnd() * nc);
    if (rnd() < 0.3) counts[big] = 10;
    else { counts[big] = 5; counts[(big + 1 + Math.floor(rnd() * (nc - 1))) % nc] = 5; }
    let left = total - counts.reduce((a, c) => a + c, 0);
    if (left < 0) continue;
    while (left > 0) { const r = Math.floor(rnd() * nc); if (counts[r] < KEEP_ROW_MAX) { counts[r]++; left--; } else if (counts.every((c) => c >= KEEP_ROW_MAX)) break; }
    if (!tellsApart(counts)) continue;
    const seq: number[] = [];
    counts.forEach((c, r) => { for (let i = 0; i < c; i++) seq.push(r); });
    for (let i = seq.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [seq[i], seq[j]] = [seq[j], seq[i]]; }
    const params: TallyParams = { goal, ctx, cats, counts, seq, labels };
    const sig = `tally:keep:${ctx}:${counts.join(",")}`;
    if (seen.has(sig)) continue;
    seen.add(sig); out.push(mk(params, sig));
  }
  return out;
}
function facts(level: PlayLevel<TallyParams>, s: TallyState): Facts {
  const p = level.params;
  // the evidence first (the lesson's PLAY row keeps 12 pairs, six of them its lead): bundles, the mal-rule, the lines
  // across missing, her answer; then the goal and the progress
  const f: Facts = { bundles: s.marks.reduce((a, m) => a + bundlesIn(m), 0) };
  if (s.mal) f.mal = s.mal;
  if (s.mal && s.sign && p.goal === "keep") f.sign = s.sign;
  const cm = s.marks.reduce((a, m) => a + crossesMissingIn(m), 0);
  if (p.goal === "keep" && cm) f.crossesMissing = cm;
  if (s.checks) f.answer = s.totals.map((t) => (t === null ? "-" : String(t))).join(",");
  f.goal = p.goal;
  if (sceneLeft(p, s) > 0) f.left = sceneLeft(p, s);
  if (s.checks) f.checks = s.checks;
  if (s.done) f.done = "yes";
  return f;
}
const tallyText = (m: readonly boolean[]) => groupsOf(m).map((g) => m.slice(g.from, g.from + g.len).map((x) => (x ? "/" : "|")).join("")).join(" ") || "–";
function board(level: PlayLevel<TallyParams>, s: TallyState) {
  const p = level.params;
  const rows = p.cats.map((c, r) => `${c}: ${tallyText(s.marks[r])} = ${s.totals[r] ?? "?"}`);
  return { title: "Tally", lines: [p.ctx, ...(p.goal === "keep" ? [`${sceneLeft(p, s)} left`] : []), ...rows] };
}
function grade(level: PlayLevel<TallyParams>, acts: PlayActEnvelope<StambhAct>[]): PlayGrade {
  return gradeLevel(tallyLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const tallyLogic: FamilyLogic<TallyParams, TallyState, StambhAct> = {
  family: "stambh", modes: ["tally"], malRules: TALLY_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
