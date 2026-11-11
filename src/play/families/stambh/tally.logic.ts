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
// Mal-rule (deterministic malActs), named only on givens where its answer is no slip's and no other reading's (TALLY_SLIPS:
// read needs two of them, keep three, to reach it; tellsApart): the generator serves only such levels and the law
// re-checks it.
//   tally-four  read: a bundle read as its four standing lines (answer 4 × bundles + singles, short by the bundles);
//               keep, from the marks ("five"): one stroke per thing and no line across anywhere, whatever the totals
//               (five written as five standing lines, the kit's second sign; judges round 2, ruling 4), on a level of at
//               least three groups of five (evening ruling 1);
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
 * The ways a child reaches a row's number WITHOUT the mix-up (evening ruling 5, 2026-11-11: worked out from the law and
 * listed in the packet). A row holds n = 5b + s strokes: b bundles, s loose lines (0 ≤ s ≤ 4).
 *   slips (one thing, by accident): a loose line missed or counted twice (n ∓ 1), a bundle skipped or counted twice
 *         (n ∓ 5), a bundle's line across missed or counted again (that bundle as 4 or 6: n ∓ 1);
 *   readings (a way of reading the whole tally that is not the mix-up's): the loose lines dropped (5b), the loose lines
 *         counted twice (n + s), the line across as a sixth line (6b + s), the lines across alone (b), each group as one
 *         (b + s), each bundle as ten (10b + s), the loose lines alone (s).
 */
export const TALLY_SLIPS: readonly { id: string; kind: "slip" | "reading"; of: (b: number, s: number) => number | null }[] = [
  { id: "loose-missed", kind: "slip", of: (b, s) => (s >= 1 ? 5 * b + s - 1 : null) },
  { id: "loose-twice", kind: "slip", of: (b, s) => (s >= 1 ? 5 * b + s + 1 : null) },
  { id: "bundle-skipped", kind: "slip", of: (b, s) => (b >= 1 ? 5 * b + s - 5 : null) },
  { id: "bundle-twice", kind: "slip", of: (b, s) => (b >= 1 ? 5 * b + s + 5 : null) },
  { id: "bundle-as-4", kind: "slip", of: (b, s) => (b >= 1 ? 5 * b + s - 1 : null) },
  { id: "bundle-as-6", kind: "slip", of: (b, s) => (b >= 1 ? 5 * b + s + 1 : null) },
  { id: "loose-dropped", kind: "reading", of: (b, s) => (s >= 1 ? 5 * b : null) },
  { id: "loose-doubled", kind: "reading", of: (b, s) => (s >= 1 ? 5 * b + 2 * s : null) },
  { id: "cross-as-sixth", kind: "reading", of: (b, s) => (b >= 1 ? 6 * b + s : null) },
  { id: "crosses-only", kind: "reading", of: (b) => (b >= 1 ? b : null) },
  { id: "groups", kind: "reading", of: (b, s) => (b >= 1 ? b + s : null) },
  { id: "bundle-as-ten", kind: "reading", of: (b, s) => (b >= 1 ? 10 * b + s : null) },
  { id: "loose-only", kind: "reading", of: (b, s) => (b >= 1 ? s : null) },
];
/** a slip's own change to a number (a line or a bundle missed or counted twice), applied after a first slip or reading */
const SLIP_DELTAS = [-1, 1, -5, 5];
/** the fewest steps (one slip or one reading each; a reading reads the tally as drawn, so it comes first) from a row of n
 *  to `target`: 0, 1, 2, or 3 meaning "three or more" */
export function slipsTo(n: number, target: number): number {
  if (target === n) return 0;
  const b = Math.floor(n / 5), s = n % 5, one = new Set<number>();
  for (const sl of TALLY_SLIPS) { const v = sl.of(b, s); if (v !== null && v !== n) one.add(v); }
  if (one.has(target)) return 1;
  for (const v of one) for (const d of SLIP_DELTAS) if (v + d === target) return 2;
  return 3;
}
/** the fewest steps, summed over the rows, that give the mix-up's totals without it: read 2, keep 3 */
export const MIN_SLIPS = { read: 2, keep: 3 } as const;
/**
 * Can the evidence tell tally-four from the slips and readings above? The level law (evening ruling 1):
 *   - no row holding a bundle has as many loose lines as bundles (2 bundles + 2 lines = 12: the mix-up reads 10, and so
 *     does counting the bundles right and dropping the loose lines);
 *   - read: at least three bundles, never five (n − 5 is a bundle skipped), at least one loose line;
 *   - keep: bundles in at least two rows;
 *   - the mix-up's totals are at least MIN_SLIPS steps from the truth (read 2, keep 3), summed over the rows, and some row
 *     is two steps away (no choice of one slip or reading per row gives them; in keep, a row of two bundles).
 */
export function tellsApart(counts: readonly number[]): boolean {
  const read = counts.length === 1;
  if (counts.some((c) => c >= 5 && c % 5 === Math.floor(c / 5))) return false;
  if (read) { const b = Math.floor(counts[0] / 5); if (b < 3 || b === 5 || counts[0] % 5 === 0) return false; }
  else if (counts.filter((c) => c >= 5).length < 2) return false;
  // (some row two steps away: no choice of one slip or reading per row gives her totals)
  const steps = counts.map((c) => slipsTo(c, four(c)));
  return Math.max(...steps) >= 2 && steps.reduce((a, x) => a + x, 0) >= MIN_SLIPS[read ? "read" : "keep"];
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
export function tallyFlow(marks: readonly boolean[], width: number, height: number, grouped: boolean, maxStroke = 34, band = 0) {
  const groups: { from: number; len: number }[] = [];
  if (grouped) for (const g of groupsOf(marks)) groups.push({ from: g.from, len: g.len });
  else { let from = 0; marks.forEach((m, i) => { if (m) { groups.push({ from, len: i - from + 1 }); from = i + 1; } }); if (from < marks.length) groups.push({ from, len: marks.length - from }); }
  const unitsOf = (g: { from: number; len: number }) => Math.max(1, marks.slice(g.from, g.from + g.len).filter((m) => !m).length);
  // one pass of the flow at stroke spacing sp: a group wraps whole when it fits a fresh line, else stroke by stroke; with a
  // plan (lineOf: each group's line), each group goes on its planned line
  const flow = (sp: number, lineOf?: (gi: number) => number) => {
    const gap = sp * 1.4, x00 = sp * 0.6;
    const stand: { i: number; x: number; line: number }[] = [], across: { i: number; x0: number; x1: number; line: number }[] = [];
    let x = x00, line = 0, right = x00;
    for (const [gi, g] of groups.entries()) {
      const units = unitsOf(g);
      if (lineOf) { if (lineOf(gi) !== line) { line = lineOf(gi); x = x00; } }
      else if (x > x00 && x + units * sp > width && x00 + units * sp <= width) { line++; x = x00; }
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
  // on two lines or more, loose lines after the last line across are never put under a closed group (evening ruling 4):
  // the closed groups fill the first lines q at a time and the rest, with the loose lines last, take the last line, so the
  // loose lines stand beyond the end of the line above
  const last = groups[groups.length - 1], loose = !!last && !marks.slice(last.from, last.from + last.len).some((m) => m);
  const closed = groups.length - (loose ? 1 : 0);
  // the strokes' height and the pitch from one line to the next: one line takes the box; on two or more, between two lines
  // of strokes at least half a stroke's height and at least `band` (room for the play-out's count) (evening ruling 4)
  const vert = (lines: number, sp: number) => {
    if (lines === 1) return { sh: Math.min(maxStroke, height * 0.72, sp * 4.2), lineH: height };
    const sh = Math.max(1, Math.min(maxStroke, sp * 4.2, height / (1.5 * lines - 0.5), (height - (lines - 1) * band) / lines));
    return { sh, lineH: sh + Math.max(sh / 2, band) };
  };
  const plan = (lines: number) => {
    if (!loose || closed < lines) return null;
    const q = Math.floor(closed / lines), lineOf = (gi: number) => (gi < q * (lines - 1) ? Math.floor(gi / q) : lines - 1);
    const widths = Array.from({ length: lines }, () => 0.6 - 1.4);
    groups.forEach((g, gi) => { widths[lineOf(gi)] += unitsOf(g) + 1.4; });
    return { lineOf, units: Math.max(...widths) };
  };
  for (let lines = 1; lines <= 8; lines++) {
    const perLine = Math.ceil(B / lines), pl = lines > 1 ? plan(lines) : null;
    const sp = Math.min(maxStroke * 0.4, width / (lines === 1 ? units1 + 0.01 : pl ? pl.units + 0.01 : perLine * 5.4 + 0.6));
    const f = flow(sp, pl?.lineOf);
    if (f.lines > lines) continue;
    const { sh, lineH } = vert(lines, sp);
    if (!fewest && sp >= 8 && sh >= 22) fewest = { sp, sh, lineH, f };
    if (!best || score({ sp, sh }) > score(best) + 0.01) best = { sp, sh, lineH, f };
  }
  if (fewest) best = fewest;
  if (!best) { const sp = Math.max(2, width / (B * 5.4 + 0.6)), f = flow(sp); best = { sp, ...vert(f.lines, sp), f }; }
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
  // "five": no line across in any row, and the level holds at least three groups of five (evening ruling 1)
  if (s.marks.every((m) => m.every((x) => !x))) return p.counts.reduce((a, c) => a + Math.floor(c / 5), 0) >= 3 ? "five" : null;
  // "counted": every row holding bundles short by exactly its own bundles, every other row right
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
  // the sizes by fade: read 16-19 / 16-34 / 21-49 (three to nine bundles, never five); keep a scene of 15-18 / 17-23 /
  // 20-28 things. Served only where the law tells tally-four from every slip and reading (tellsApart): read with at least
  // three bundles and a loose line; keep with bundles in at least two rows; no row with as many loose lines as bundles
  const RANGE = { 1: [16, 19], 2: [16, 34], 3: [21, READ_MAX] }[labels] as [number, number];
  const SCENE = { 1: [15, 18], 2: [17, 23], 3: [20, KEEP_SCENE_MAX] }[labels] as [number, number];
  for (let k = 0; k < 400 && out.length < 16; k++) {
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
    // each row 2..KEEP_ROW_MAX things; the scene's size by fade; the law decides (tellsApart)
    const counts = cats.map(() => int(2, KEEP_ROW_MAX)), total = counts.reduce((a, c) => a + c, 0);
    if (total < SCENE[0] || total > SCENE[1] || !tellsApart(counts)) continue;
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
