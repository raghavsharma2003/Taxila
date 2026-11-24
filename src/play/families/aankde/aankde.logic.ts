// Aankde (आँकड़े, "data") · round 7, data and statistics: collecting and organising data with tallies, and the representative
// values mean, median and mode (classes 6-7). Nothing runs on a clock: every slip, stroke, block, line, card and peg moves on
// the child's touch, and the law answers only on "run". The law reads only what the child built. One law per goal:
//   tally/sort     a pile of survey slips (a fruit stall's sales, the vehicles at the gate, favourite sports). The child takes
//                  the top slip into a row as ONE stroke: upright, or across the four before it. On "count" the table reads
//                  every row as a reader does (a stroke across closes a bundle that reads five, whatever it holds; loose
//                  uprights one each) and adds the total row against the slips the survey had. Solved: the pile empty,
//                  every slip in its own row, every row bundled (every fifth stroke across, no other)
//   tally/missing  N children chose one each; the tallies of every row but one stand; that row's slips were lost. The
//                  child strokes the lost row; on "count" the rows are read and the total row must make N (and the lost
//                  row must be bundled)
//   tally/mode     the shoe sizes a shop sold that day come as slips: the child tallies them by size as in sort, then puts
//                  the big stock crate on one size. Solved: the tally right and the crate on the size sold most (the mode)
//   stack/even     towers of blocks (runs in each match, books each week). The child moves a block from the top of one
//                  tower to another. On "level" the law checks that every tower stands at one height (blocks are never made
//                  or lost, so that height IS the mean)
//   stack/pour     the same towers and a level line the child sets. On "pour" every block above the line is lifted and
//                  dropped into the gaps below it: solved when they fill the gaps exactly (no block left over, no gap) —
//                  the line is then the mean, the balance of what stands above and what is missing below
//   line/middle    value cards lie as written. The child swaps cards into order and sets the peg on a card or in the gap
//                  between two. On "fold" the line is folded from both ends: solved when the line is in order (either way)
//                  and the peg is where the fold meets (the median; with an even count the gap, halfway between the two)
// Mal-rules (each a deterministic set-up; a level serves one only where it differs from the answer):
//   tally-five      sort / mode: every slip in its row but the fifth stroke drawn upright (no bundle closed);
//                   missing: each crossed bundle of the standing rows read as four (the lost row stroked too long)
//   total-mismatch  sort: "count" pressed with slips still on the pile (the total never checked against the survey)
//   mean-size       mode: the crate on the size nearest the mean size (the mean used where only a real size will do)
//   zero-dropped    even: the empty tower left out, the others levelled among themselves (no kit names it; never claimed)
//   middle-value    pour: the line at the data value nearest the mean (the mean taken as one of the data values)
//   outlier         pour: the line where the towers stand without the one far taller (the extreme value ignored)
//   unordered       middle: no card moved, the peg in the middle of the line as written
//   one-card        middle: an even count, the line in order, the peg on one of the two middle cards (no kit names it)
import type { AankdeAct, Candidate, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type AankdeMode = "tally" | "stack" | "line";
export type AankdeGoal = "sort" | "missing" | "mode" | "even" | "pour" | "middle";
export interface AankdeParams {
  goal: AankdeGoal;
  /** the fade: 1 the fifth stroke's place / the blocks above and the gaps below counted / the peg's slots drawn · 2 fewer
   *  marks · 3 plain */
  face: 1 | 2 | 3;
  /** the context skin (words only; never changes the maths) */
  ctx: string;
  /** tally: the rows' category word ids (mode: the sizes as text); else [] */
  cats: string[];
  /** sort / mode: the pile, top first (each slip its row's index); else [] */
  slips: number[];
  /** missing: the counts tallied in every row but the last (the lost row); else [] */
  given: number[];
  /** missing: the children asked; sort / mode: the slips in the pile; else 0 */
  total: number;
  /** stack: the towers' heights · line: the cards' values as written · mode: each row's size · else [] */
  h: number[];
}
export interface AankdeState extends Undoable<AankdeState> {
  /** tally: each row's strokes in order (true = across) */
  rows: boolean[][];
  /** sort / mode: the row each slip taken went to, in pile order */
  put: number[];
  /** mode: the row the stock crate is on (−1 none) */
  crown: number;
  /** stack: the towers now */
  h: number[];
  /** pour: the line's height (−1 not set) */
  line: number;
  /** line: the card (index into params.h) at each place */
  order: number[];
  /** line: the peg's slot (2i on card place i, 2i + 1 in the gap after it; −1 not set) */
  peg: number;
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const AANKDE_MAL = ["tally-five", "total-mismatch", "mean-size", "zero-dropped", "middle-value", "outlier", "unordered", "one-card"] as const;
const MAL_OF: Record<AankdeGoal, readonly string[]> = {
  sort: ["tally-five", "total-mismatch"], missing: ["tally-five"], mode: ["mean-size", "tally-five"],
  even: ["zero-dropped"], pour: ["middle-value", "outlier"], middle: ["unordered", "one-card"],
};
const GOALS_OF: Record<AankdeMode, readonly AankdeGoal[]> = { tally: ["sort", "missing", "mode"], stack: ["even", "pour"], line: ["middle"] };
/** the tallest a tower may stand (blocks) */
export const CAP = 15;
/** the most strokes a row may hold */
export const MAX_MARKS = 30;
export const CTX_CATS: Record<string, readonly string[]> = {
  fruit: ["mango", "apple", "banana", "guava"],
  vehicle: ["cycle", "bus", "car", "auto"],
  sport: ["cricket", "football", "kabaddi", "kho"],
};
const STACK_CTX = ["runs", "books"] as const;
const LINE_CTX = ["minutes", "runs"] as const;

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);

// ───────────────────────────── the reader's arithmetic ─────────────────────────────
/** what a row of strokes reads: a stroke across closes a bundle that reads five whatever it holds; loose uprights one each */
export function readRow(marks: readonly boolean[]): number {
  let n = 0, loose = 0;
  for (const m of marks) { if (m) { n += 5; loose = 0; } else loose++; }
  return n + loose;
}
/** is a row bundled as tallies are: every fifth stroke across, every other stroke upright */
export const bundled = (marks: readonly boolean[]) => marks.every((m, i) => m === (i % 5 === 4));
/** the strokes a count is tallied in: bundles of five (four upright, the fifth across), then the loose uprights */
export const tallyOf = (n: number): boolean[] => Array.from({ length: n }, (_, i) => i % 5 === 4);
/** the slips of each row in a pile */
export const countsOf = (p: Pick<AankdeParams, "cats" | "slips">) => p.cats.map((_, r) => p.slips.filter((s) => s === r).length);
/** the mean of values */
export const meanOf = (xs: readonly number[]) => sum(xs) / xs.length;
/** the median: the middle value of the values in order (an even count: halfway between the two middle ones) */
export function medianOf(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
/** mode: the row sold most (unique by validation) */
export const modeRow = (p: Pick<AankdeParams, "cats" | "slips">) => { const c = countsOf(p); return c.indexOf(Math.max(...c)); };
/** mode: the mean size of the slips */
export const meanSize = (p: Pick<AankdeParams, "cats" | "slips" | "h">) => meanOf(p.slips.map((r) => p.h[r]));
/** mode: the row whose size is nearest the mean size (−1 when two are equally near) */
export function meanRow(p: Pick<AankdeParams, "cats" | "slips" | "h">): number {
  const m = meanSize(p), d = p.h.map((x) => Math.abs(x - m)), lo = Math.min(...d);
  return d.filter((x) => Math.abs(x - lo) < 1e-9).length === 1 ? d.findIndex((x) => Math.abs(x - lo) < 1e-9) : -1;
}
/** the slot the fold meets at: the middle of the line (a card for an odd count, the gap between two for an even one) */
export const middleSlot = (n: number) => n - 1;
/** the values along the child's line */
export const lineValues = (p: Pick<AankdeParams, "h">, order: readonly number[]) => order.map((i) => p.h[i]);
/** in order, either way */
export function inOrder(xs: readonly number[]): boolean {
  let up = true, down = true;
  for (let i = 1; i < xs.length; i++) { if (xs[i] < xs[i - 1]) up = false; if (xs[i] > xs[i - 1]) down = false; }
  return up || down;
}
/** the value at a peg slot of a line: the card's value, or halfway between the two cards of a gap */
export const slotValue = (xs: readonly number[], slot: number) => (slot % 2 === 0 ? xs[slot / 2] : (xs[(slot - 1) / 2] + xs[(slot + 1) / 2]) / 2);
/** pour: the blocks standing above a line, and the gaps below it */
export const aboveOf = (h: readonly number[], line: number) => sum(h.map((x) => Math.max(0, x - line)));
export const gapsOf = (h: readonly number[], line: number) => sum(h.map((x) => Math.max(0, line - x)));
/** a number as the board writes it (6.5, never 6.50) */
export const numText = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10));

// ───────────────────────────── the set-up and its judgement ─────────────────────────────
/** what the child commits before the run */
export interface Setup { rows?: boolean[][]; put?: number[]; crown?: number; h?: number[]; line?: number; order?: number[]; peg?: number }
const setupOf = (s: AankdeState): Setup => ({ rows: s.rows, put: s.put, crown: s.crown, h: s.h, line: s.line, order: s.order, peg: s.peg });
const lostRow = (p: AankdeParams) => p.cats.length - 1;
/** sort / mode: every slip in its own row, the rows' strokes one per slip, every row bundled */
function tallyRight(p: AankdeParams, su: Setup): boolean {
  const put = su.put ?? [], rows = su.rows ?? [];
  if (put.length !== p.slips.length || put.some((r, k) => r !== p.slips[k])) return false;
  const c = countsOf(p);
  return rows.every((m, r) => m.length === c[r] && bundled(m));
}
/** missing: what the total row adds to (each row read) */
export const totalRead = (p: AankdeParams, rows: readonly (readonly boolean[])[]) => sum(rows.map(readRow));
/** THE judgement of a run */
export function judge(p: AankdeParams, su: Setup): boolean {
  switch (p.goal) {
    case "sort": return tallyRight(p, su);
    case "mode": return tallyRight(p, su) && su.crown === modeRow(p);
    case "missing": { const rows = su.rows ?? []; return !!rows[lostRow(p)] && bundled(rows[lostRow(p)]) && totalRead(p, rows) === p.total; }
    case "even": { const h = su.h ?? []; return h.length === p.h.length && h.every((x) => x === h[0]); }
    case "pour": return su.line === meanOf(p.h);
    case "middle": { const o = su.order ?? []; return inOrder(lineValues(p, o)) && su.peg === middleSlot(p.h.length); }
  }
  return false;
}

/** the rows a pile's slips (taken up to `upto`) make when every stroke is drawn by the reader's rule */
function rowsFor(p: AankdeParams, upto: number, stroke: (i: number) => boolean): boolean[][] {
  const rows: boolean[][] = p.cats.map(() => []);
  for (let k = 0; k < upto; k++) { const r = p.slips[k]; rows[r].push(stroke(rows[r].length)); }
  return rows;
}
const givenRows = (p: AankdeParams) => p.given.map(tallyOf);
/** missing: the lost row's count the standing tallies leave */
export const lostCount = (p: AankdeParams) => p.total - sum(p.given);
/** missing: the lost count a reader of each crossed bundle as `b` would stroke */
const lostIf = (p: AankdeParams, b: number) => p.total - sum(p.given.map((g) => Math.floor(g / 5) * b + (g % 5)));
/** pour: the data value nearest the mean (−1 when two are equally near) */
export function nearestValue(h: readonly number[]): number {
  const m = meanOf(h), vals = [...new Set(h)], d = vals.map((x) => Math.abs(x - m)), lo = Math.min(...d);
  return d.filter((x) => x === lo).length === 1 ? vals[d.indexOf(lo)] : -1;
}
/** pour: the one tower far taller than the rest (its index), or −1 */
export function outlierOf(h: readonly number[]): number {
  const s = [...h].sort((a, b) => a - b), top = s[s.length - 1], next = s[s.length - 2];
  if (h.filter((x) => x === top).length !== 1 || top - next < 5 || top < 2 * medianOf(h)) return -1;
  return h.indexOf(top);
}
/** pour: where the towers stand without the outlier (their mean, rounded to a whole block) */
export function withoutOutlier(h: readonly number[]): number {
  const o = outlierOf(h);
  return o < 0 ? -1 : Math.round(meanOf(h.filter((_, i) => i !== o)));
}
const identity = (n: number) => Array.from({ length: n }, (_, i) => i);
const sortedOrder = (p: AankdeParams) => identity(p.h.length).sort((a, b) => p.h[a] - p.h[b] || a - b);

function rawMal(p: AankdeParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  switch (mal) {
    case "tally-five":
      if (p.goal === "missing") { const m = lostIf(p, 4); return m >= 1 && m <= MAX_MARKS ? { rows: [...givenRows(p), tallyOf(m)] } : null; }
      if (Math.max(...countsOf(p)) < 5) return null;
      return { put: [...p.slips], rows: rowsFor(p, p.slips.length, () => false), crown: p.goal === "mode" ? modeRow(p) : -1 };
    case "total-mismatch": return { put: p.slips.slice(0, -1), rows: rowsFor(p, p.slips.length - 1, (i) => i % 5 === 4) };
    case "mean-size": { const r = meanRow(p); return r >= 0 ? { put: [...p.slips], rows: rowsFor(p, p.slips.length, (i) => i % 5 === 4), crown: r } : null; }
    case "zero-dropped": {
      const z = p.h.filter((x) => x === 0).length, left = p.h.length - z;
      if (!z || left < 2 || sum(p.h) % left) return null;
      const lv = p.h.map((x) => (x === 0 ? 0 : sum(p.h) / left));
      return lv.every((x, i) => x === p.h[i]) ? null : { h: lv };
    }
    case "middle-value": { const v = nearestValue(p.h); return v >= 0 ? { line: v } : null; }
    case "outlier": { const v = withoutOutlier(p.h); return v >= 0 ? { line: v } : null; }
    case "unordered": return { order: identity(p.h.length), peg: middleSlot(p.h.length) };
    case "one-card": return p.h.length % 2 === 0 ? { order: sortedOrder(p), peg: middleSlot(p.h.length) - 1 } : null;
  }
  return null;
}
/** does this run's set-up show the belief `mal`? */
function shows(p: AankdeParams, su: Setup, mal: string): boolean {
  const m = rawMal(p, mal);
  if (!m) return false;
  const put = su.put ?? [], rows = su.rows ?? [];
  const putRight = put.every((r, k) => r === p.slips[k]);
  switch (mal) {
    case "tally-five": {
      if (p.goal === "missing") {
        const lost = rows[lostRow(p)] ?? [], n = readRow(lost), need = lostCount(p);
        // the bundles read as four or as six; or the right count with its fifth stroke upright
        if (bundled(lost) && n !== need && (n === lostIf(p, 4) || n === lostIf(p, 6))) return true;
        return !bundled(lost) && lost.length === need && need >= 5 && lost[4] === false;
      }
      if (put.length !== p.slips.length || !putRight) return false;
      const c = countsOf(p);
      return rows.every((r, i) => r.length === c[i]) && rows.some((r) => !bundled(r));
    }
    case "total-mismatch":
      return put.length < p.slips.length && put.length * 2 >= p.slips.length && putRight && rows.every((r) => bundled(r));
    case "mean-size": return su.crown === m.crown && tallyRight(p, su);
    case "zero-dropped": return !!su.h && su.h.every((x, i) => x === m.h![i]);
    case "middle-value": case "outlier": return su.line === m.line;
    case "unordered": return !inOrder(lineValues(p, su.order ?? [])) && su.peg === middleSlot(p.h.length);
    case "one-card": {
      const n = p.h.length;
      return n % 2 === 0 && inOrder(lineValues(p, su.order ?? [])) && (su.peg === n - 2 || su.peg === n);
    }
  }
  return false;
}
/** The set-up a child holding `mal` commits, or null (no reading here, or it would solve) */
export function malSetup(p: AankdeParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m) return null;
  const full = { ...setupOf(init({ params: p } as PlayLevel<AankdeParams>)), ...m };
  if (judge(p, full)) return null;
  // a signature names ONE belief: another of the goal's beliefs may not show on the same set-up
  for (const other of MAL_OF[p.goal]) if (other !== mal && shows(p, full, other)) return null;
  return m;
}

/** the values the teacher may not say before the child makes them: each row's count, the lost row's count, the mode, the
 *  mean (the level), the median */
export function aankdeHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as AankdeParams | null;
  if (!p || typeof p.goal !== "string") return [];
  try {
    if (p.goal === "sort") return [...new Set(countsOf(p).map(String))];
    if (p.goal === "missing") return [String(lostCount(p))];
    if (p.goal === "mode") return [p.cats[modeRow(p)]];
    if (p.goal === "even" || p.goal === "pour") return [numText(meanOf(p.h))];
    if (p.goal === "middle") return [numText(medianOf(p.h))];
  } catch { /* a malformed level hides nothing */ }
  return [];
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── validation (the same rules the generator builds by) ─────────────────────────────
function validate(level: PlayLevel<unknown>): PlayLevel<AankdeParams> | null {
  const p = level.params as Partial<AankdeParams> | null, mode = level.mode as AankdeMode;
  if (!p || !GOALS_OF[mode] || !GOALS_OF[mode].includes(p.goal as AankdeGoal)) return null;
  const goal = p.goal as AankdeGoal;
  const face = p.face === 1 || p.face === 2 || p.face === 3 ? p.face : 0;
  if (!face || typeof p.ctx !== "string" || !Array.isArray(p.cats) || !Array.isArray(p.slips) || !Array.isArray(p.given) || !Array.isArray(p.h) || !isInt(p.total)) return null;
  const { ctx, cats, slips, given, total, h } = p as AankdeParams;
  if (!cats.every((c) => typeof c === "string") || ![slips, given, h].every((xs) => xs.every(isInt))) return null;
  const keep = (): PlayLevel<AankdeParams> => ({ ...level, params: { goal, face, ctx, cats: [...cats], slips: [...slips], given: [...given], total, h: [...h] } });
  if (goal === "sort" || goal === "missing") {
    const words = CTX_CATS[ctx];
    if (!words || cats.length < 3 || cats.length > 4 || new Set(cats).size !== cats.length || !cats.every((c) => words.includes(c)) || h.length) return null;
  }
  if (goal === "sort" || goal === "mode") {
    const k = cats.length;
    if (given.length || total !== slips.length || slips.some((s) => s < 0 || s >= k)) return null;
    const c = countsOf({ cats, slips });
    if (c.some((x) => x < 1 || x > 14)) return null;
    if (goal === "sort") {
      // 8..30 slips; some row reaches a bundle
      if (slips.length < 8 || slips.length > 30 || Math.max(...c) < 5) return null;
      return keep();
    }
    // mode: shoe sizes in a row (3..5 consecutive sizes); one size sold most, never the first or the last slip's size; the
    // size nearest the mean size is one size and not the mode
    if (ctx !== "shoe" || k < 3 || k > 5 || h.length !== k || slips.length < 7 || slips.length > 20) return null;
    if (h[0] < 3 || h[k - 1] > 12 || h.some((x, i) => i > 0 && x !== h[i - 1] + 1) || cats.some((cat, i) => cat !== String(h[i]))) return null;
    const top = Math.max(...c);
    if (c.filter((x) => x === top).length !== 1) return null;
    const mr = modeRow({ cats, slips });
    if (slips[0] === mr || slips[slips.length - 1] === mr) return null;
    const nr = meanRow({ cats, slips, h });
    if (nr < 0 || nr === mr) return null;
    return keep();
  }
  if (goal === "missing") {
    // the standing rows 1..14 each (some reach a bundle); the lost row 2..14, not the count of a standing row; the survey's
    // total is theirs added
    if (slips.length || given.length !== cats.length - 1 || given.some((g) => g < 1 || g > 14) || Math.max(...given) < 5) return null;
    const m = total - sum(given);
    if (m < 2 || m > 14 || given.includes(m)) return null;
    return keep();
  }
  if (cats.length || slips.length || given.length || total !== 0) return null;
  if (goal === "even") {
    // 3..5 towers of 0..12; a whole-block level of 1 or more; not level yet; at most 14 blocks to move
    if (!(STACK_CTX as readonly string[]).includes(ctx) || h.length < 3 || h.length > 5 || h.some((x) => x < 0 || x > 12)) return null;
    if (sum(h) % h.length || sum(h) / h.length < 1 || h.every((x) => x === h[0])) return null;
    const M = sum(h) / h.length;
    if (sum(h.map((x) => Math.max(0, x - M))) > 14) return null;
    return keep();
  }
  if (goal === "pour") {
    // 4..6 towers of 1..CAP; a whole-block mean that is none of the towers; the line at half the tallest never makes it
    if (!(STACK_CTX as readonly string[]).includes(ctx) || h.length < 4 || h.length > 6 || h.some((x) => x < 1 || x > CAP)) return null;
    if (sum(h) % h.length) return null;
    const M = sum(h) / h.length;
    if (h.includes(M) || Math.round(Math.max(...h) / 2) === M) return null;
    return keep();
  }
  // middle: 5..8 different values 1..60, not in order either way; the middle of the line as written is not the median
  if (!(LINE_CTX as readonly string[]).includes(ctx) || h.length < 5 || h.length > 8 || h.some((x) => x < 1 || x > 60) || new Set(h).size !== h.length) return null;
  if (inOrder(h) || slotValue(h, middleSlot(h.length)) === medianOf(h)) return null;
  return keep();
}

export function init(level: PlayLevel<AankdeParams>): AankdeState {
  const p = level.params;
  const rows: boolean[][] = p.goal === "missing" ? [...givenRows(p), []] : p.cats.map(() => []);
  return { rows, put: [], crown: -1, h: [...p.h], line: -1, order: identity(p.h.length), peg: -1, ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}

function apply(level: PlayLevel<AankdeParams>, s: AankdeState, act: AankdeAct, seq: number): { state: AankdeState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: AankdeState): AankdeState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const change = (patch: Partial<AankdeState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  const tally = p.goal === "sort" || p.goal === "missing" || p.goal === "mode";
  switch (act.kind) {
    case "mark": {
      if (!tally) return no("no_tally");
      const r = Number(act.row);
      if (!isInt(r) || r < 0 || r >= p.cats.length) return no("bad_row");
      if (p.goal === "missing" && r !== lostRow(p)) return no("row_stands");
      if (p.goal !== "missing" && s.put.length >= p.slips.length) return no("pile_empty");
      if (s.rows[r].length >= MAX_MARKS) return no("row_full");
      const rows = s.rows.map((m, i) => (i === r ? [...m, act.across === true] : m));
      return change({ rows, put: p.goal === "missing" ? s.put : [...s.put, r] });
    }
    case "crown": {
      if (p.goal !== "mode") return no("no_crate");
      const r = Number(act.row);
      if (!isInt(r) || r < 0 || r >= p.cats.length) return no("bad_row");
      return change({ crown: s.crown === r ? -1 : r });
    }
    case "move": {
      if (p.goal !== "even") return no("no_move");
      const a = Number(act.from), b = Number(act.to), n = p.h.length;
      if (!isInt(a) || !isInt(b) || a < 0 || b < 0 || a >= n || b >= n || a === b) return no("bad_tower");
      if (s.h[a] < 1) return no("tower_empty");
      if (s.h[b] >= CAP) return no("tower_full");
      const h = [...s.h]; h[a]--; h[b]++;
      return change({ h });
    }
    case "line": {
      if (p.goal !== "pour") return no("no_line");
      const v = Number(act.at);
      if (!isInt(v) || v < 0 || v > CAP) return no("bad_line");
      if (v === s.line) return no("same_line");
      return change({ line: v });
    }
    case "swap": {
      if (p.goal !== "middle") return no("no_card");
      const i = Number(act.i), j = Number(act.j), n = p.h.length;
      if (!isInt(i) || !isInt(j) || i < 0 || j < 0 || i >= n || j >= n || i === j) return no("bad_card");
      const order = [...s.order]; [order[i], order[j]] = [order[j], order[i]];
      return change({ order });
    }
    case "peg": {
      if (p.goal !== "middle") return no("no_peg");
      const v = Number(act.at);
      if (!isInt(v) || v < 0 || v > 2 * p.h.length - 2) return no("bad_slot");
      if (v === s.peg) return no("same_slot");
      return change({ peg: v });
    }
    case "run": {
      if (s.ended) return no("change_first");
      if ((p.goal === "sort" || p.goal === "mode") && !s.put.length) return no("mark_first");
      if (p.goal === "missing" && !s.rows[lostRow(p)].length) return no("mark_first");
      if (p.goal === "mode" && s.crown < 0) return no("crate_first");
      if (p.goal === "even" && s.h.every((x, i) => x === p.h[i])) return no("move_first");
      if (p.goal === "pour" && s.line < 0) return no("line_first");
      if (p.goal === "middle" && s.peg < 0) return no("peg_first");
      const su = setupOf(s), runs = s.runs + 1, ok = judge(p, su);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: p.goal, run: runs };
      if (tally) f.total = totalRead(p, s.rows);
      if (p.goal === "pour") { f.above = aboveOf(p.h, s.line); f.gaps = gapsOf(p.h, s.line); }
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) {
        if (malSetup(p, mal) && shows(p, su, mal)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      out.push(mom(nearOf(p, s) ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
/** one thing from the answer: one slip in the wrong row or one row unbundled; the lost row one off; one block off level;
 *  the line one block off; the peg one slot off on a line in order */
function nearOf(p: AankdeParams, s: AankdeState): boolean {
  if (p.goal === "sort" || p.goal === "mode") {
    if (s.put.length !== p.slips.length) return false;
    const wrong = s.put.filter((r, k) => r !== p.slips[k]).length, unb = s.rows.filter((m) => !bundled(m)).length;
    return wrong + unb === 1 || (p.goal === "mode" && wrong + unb === 0);
  }
  if (p.goal === "missing") return Math.abs(totalRead(p, s.rows) - p.total) === 1;
  if (p.goal === "even") { const M = meanOf(p.h); return sum(s.h.map((x) => Math.abs(x - M))) === 2; }
  if (p.goal === "pour") return Math.abs(s.line - meanOf(p.h)) === 1;
  return inOrder(lineValues(p, s.order)) && Math.abs(s.peg - middleSlot(p.h.length)) === 1;
}
const goalMet = (_l: PlayLevel<AankdeParams>, s: AankdeState) => s.done;

/** the set-up that solves the level */
function solveSetup(p: AankdeParams): Setup {
  if (p.goal === "sort" || p.goal === "mode") return { put: [...p.slips], rows: rowsFor(p, p.slips.length, (i) => i % 5 === 4), crown: p.goal === "mode" ? modeRow(p) : -1 };
  if (p.goal === "missing") return { rows: [...givenRows(p), tallyOf(lostCount(p))] };
  if (p.goal === "even") return { h: p.h.map(() => meanOf(p.h)) };
  if (p.goal === "pour") return { line: meanOf(p.h) };
  return { order: sortedOrder(p), peg: middleSlot(p.h.length) };
}
/** even: the moves that take a set of towers to `to` (each block from the tallest over its target to the first short one) */
function movesTo(from: readonly number[], to: readonly number[]): AankdeAct[] {
  const h = [...from], acts: AankdeAct[] = [];
  for (let guard = 0; guard < 200; guard++) {
    const a = h.findIndex((x, i) => x > to[i]), b = h.findIndex((x, i) => x < to[i]);
    if (a < 0 || b < 0) break;
    h[a]--; h[b]++; acts.push({ kind: "move", from: a, to: b });
  }
  return acts;
}
/** line: the swaps that take the written line to an order (selection: each place gets its card) */
function swapsTo(order: readonly number[]): AankdeAct[] {
  const cur = identity(order.length), acts: AankdeAct[] = [];
  for (let i = 0; i < order.length; i++) {
    const j = cur.indexOf(order[i]);
    if (j !== i) { [cur[i], cur[j]] = [cur[j], cur[i]]; acts.push({ kind: "swap", i, j }); }
  }
  return acts;
}
/** the acts that commit a set-up from the level's start, then run */
export function setupActs(p: AankdeParams, su: Setup): AankdeAct[] {
  const acts: AankdeAct[] = [];
  if (p.goal === "sort" || p.goal === "mode") {
    const seen = p.cats.map(() => 0);
    for (const r of su.put ?? []) { const m = su.rows?.[r]?.[seen[r]] ?? false; seen[r]++; acts.push({ kind: "mark", row: r, across: m }); }
    if (p.goal === "mode" && (su.crown ?? -1) >= 0) acts.push({ kind: "crown", row: su.crown! });
  }
  if (p.goal === "missing") for (const m of su.rows?.[lostRow(p)] ?? []) acts.push({ kind: "mark", row: lostRow(p), across: m });
  if (p.goal === "even") acts.push(...movesTo(p.h, su.h ?? p.h));
  if (p.goal === "pour" && (su.line ?? -1) >= 0) acts.push({ kind: "line", at: su.line! });
  if (p.goal === "middle") { acts.push(...swapsTo(su.order ?? identity(p.h.length))); if ((su.peg ?? -1) >= 0) acts.push({ kind: "peg", at: su.peg! }); }
  acts.push({ kind: "run" });
  return acts;
}
function solve(level: PlayLevel<AankdeParams>): AankdeAct[] | null {
  const p = level.params, su = solveSetup(p);
  return judge(p, { ...setupOf(init(level)), ...su }) ? setupActs(p, su) : null;
}
/**
 * Set-ups that win without the idea: every slip into the first row, the slips dealt round the rows; the lost row stroked
 * for the whole survey or copied from the longest standing row; the crate on the first or the last slip's size; no block
 * moved; the line at the first tower's top or at half the tallest; the written line pegged in its middle, the line in order
 * pegged at its first card. A level any of them solves is never served.
 */
export function shortcutActs(p: AankdeParams): AankdeAct[][] {
  const n = p.slips.length, k = p.cats.length, bund = (rs: number[]) => {
    const seen = p.cats.map(() => 0);
    return rs.map((r) => ({ kind: "mark", row: r, across: seen[r]++ % 5 === 4 }) as AankdeAct);
  };
  if (p.goal === "sort" || p.goal === "mode") {
    const lists = [Array.from({ length: n }, () => 0), Array.from({ length: n }, (_, i) => i % k)].map((rs) => [...bund(rs), { kind: "run" } as AankdeAct]);
    if (p.goal === "mode") {
      const right = setupActs(p, { ...solveSetup(p), crown: -1 }).filter((a) => a.kind === "mark");
      for (const r of [p.slips[0], p.slips[n - 1]]) lists.push([...right, { kind: "crown", row: r }, { kind: "run" }]);
    }
    return lists;
  }
  if (p.goal === "missing") return [p.total, Math.max(...p.given)].map((m) => setupActs(p, { rows: [...givenRows(p), tallyOf(Math.min(m, MAX_MARKS))] }));
  if (p.goal === "even") return [[{ kind: "run" }]];
  if (p.goal === "pour") return [p.h[0], Math.round(Math.max(...p.h) / 2)].map((line) => setupActs(p, { line }));
  return [setupActs(p, { order: identity(p.h.length), peg: middleSlot(p.h.length) }), setupActs(p, { order: sortedOrder(p), peg: 0 })];
}
function replayDone(level: PlayLevel<AankdeParams>, acts: AankdeAct[]): boolean {
  let s = init(level);
  for (const a of acts) s = apply(level, s, a, 1).state;
  return s.done;
}
function shortcut(level: PlayLevel<AankdeParams>): AankdeAct[] | null {
  for (const t of shortcutActs(level.params)) if (replayDone(level, t)) return t;
  return null;
}
function malActs(level: PlayLevel<AankdeParams>, mal: string): AankdeAct[] | null {
  const m = malSetup(level.params, mal);
  return m ? setupActs(level.params, m) : null;
}

// ───────────────────────────── the generator ─────────────────────────────
interface AankdeGrammar {
  /** tally: rows (lo, hi) and slips (lo, hi) */
  cats?: [number, number]; slips?: [number, number];
  /** stack / line: towers or cards (lo, hi) */
  n?: [number, number];
}
function difficultyOf(p: AankdeParams): number {
  const f = 0.06 * (p.face - 1);
  if (p.goal === "sort" || p.goal === "mode") return Math.min(1, 0.2 + f + 0.02 * p.slips.length + 0.04 * p.cats.length);
  if (p.goal === "missing") return Math.min(1, 0.3 + f + 0.02 * p.total);
  if (p.goal === "middle") return Math.min(1, 0.25 + f + 0.06 * p.h.length + (p.h.length % 2 ? 0 : 0.1));
  return Math.min(1, 0.25 + f + 0.06 * p.h.length + 0.01 * sum(p.h));
}
function generate(req: GenRequest): Candidate<AankdeParams>[] {
  const g = req.grammar as AankdeGrammar;
  const mode = (["tally", "stack", "line"] as const).find((m) => m === req.mode) ?? "tally";
  const goal = (GOALS_OF[mode].includes(req.goal as AankdeGoal) ? req.goal : GOALS_OF[mode][0]) as AankdeGoal;
  const rnd = mulberry32(req.seed), out: Candidate<AankdeParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const shuffle = <T>(xs: T[]): T[] => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
  const face = req.fade as 1 | 2 | 3;
  const mk = (params: AankdeParams, sig: string): Candidate<AankdeParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `aankde-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_").slice(0, 120), family: "aankde", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "aankde", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const range = (r: [number, number] | undefined, lo: number, hi: number): [number, number] => {
    const a = Math.max(lo, Math.min(hi, r?.[0] ?? lo)), b = Math.max(a, Math.min(hi, r?.[1] ?? hi));
    return [a, b];
  };
  for (let k = 0; k < 260 && out.length < 24; k++) {
    let params: AankdeParams;
    if (goal === "sort" || goal === "missing") {
      const ctx = pickOf(Object.keys(CTX_CATS)), [clo, chi] = range(g.cats, 3, 4), nk = int(clo, chi);
      const cats = shuffle([...CTX_CATS[ctx]]).slice(0, nk);
      if (goal === "sort") {
        const [slo, shi] = range(g.slips, 8, 30), N = int(slo, shi);
        // one row reaches a bundle (5..12); the rest share what is left, 1 at least each
        const counts = cats.map(() => 1);
        counts[int(0, nk - 1)] = int(5, Math.min(12, N - (nk - 1)));
        let left = N - sum(counts);
        while (left > 0) { const r = int(0, nk - 1); if (counts[r] < 14) { counts[r]++; left--; } }
        const slips = shuffle(counts.flatMap((c, r) => Array.from({ length: c }, () => r)));
        params = { goal, face, ctx, cats, slips, given: [], total: N, h: [] };
      } else {
        const given = cats.slice(1).map(() => int(1, 14));
        if (Math.max(...given) < 5) given[int(0, given.length - 1)] = int(5, 14);
        const m = int(2, 14);
        params = { goal, face, ctx, cats, slips: [], given, total: sum(given) + m, h: [] };
      }
    } else if (goal === "mode") {
      const [clo, chi] = range(g.cats, 3, 5), nk = int(clo, chi), first = int(3, 12 - nk + 1);
      const h = Array.from({ length: nk }, (_, i) => first + i), cats = h.map(String);
      const [slo, shi] = range(g.slips, 7, 20), N = int(slo, shi);
      const counts = cats.map(() => 1);
      let left = N - nk;
      // the sales lean towards one size, not always the middle one
      const lean = int(0, nk - 1);
      while (left > 0) { const r = rnd() < 0.35 ? lean : int(0, nk - 1); if (counts[r] < 9) { counts[r]++; left--; } }
      const slips = shuffle(counts.flatMap((c, r) => Array.from({ length: c }, () => r)));
      params = { goal, face, ctx: "shoe", cats, slips, given: [], total: N, h };
    } else if (goal === "even" || goal === "pour") {
      const [nlo, nhi] = goal === "even" ? range(g.n, 3, 5) : range(g.n, 4, 6), n = int(nlo, nhi);
      const top = goal === "even" ? 12 : 11;
      const M = int(3, goal === "even" ? 7 : 8);
      // towers spread round a whole-block level M (the last one makes the total n × M); an empty tower now and then; a
      // far taller one now and then (pour)
      const h = Array.from({ length: n - 1 }, () => Math.max(goal === "even" ? 0 : 1, Math.min(top, M + int(-4, 4))));
      if (goal === "even" && rnd() < 0.35) h[int(0, n - 2)] = 0;
      if (goal === "pour" && rnd() < 0.5) h[int(0, n - 2)] = Math.min(CAP, M + int(6, 9));
      h.push(n * M - sum(h));
      shuffle(h);
      params = { goal, face, ctx: pickOf(STACK_CTX), cats: [], slips: [], given: [], total: 0, h };
    } else {
      const [nlo, nhi] = range(g.n, 5, 8), n = int(nlo, nhi), ctx = pickOf(LINE_CTX);
      const vals = new Set<number>();
      while (vals.size < n) vals.add(int(ctx === "minutes" ? 5 : 2, ctx === "minutes" ? 40 : 60));
      params = { goal, face, ctx, cats: [], slips: [], given: [], total: 0, h: shuffle([...vals]) };
    }
    const sig = `${goal}:${params.ctx}:${params.cats.join(",")}:${params.slips.join("")}:${params.given.join(",")}:${params.total}:${params.h.join(",")}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig.slice(0, 90));
    const v = validate(cand.level);
    if (!v) continue;
    const sol = solve(v);
    if (!sol || shortcut(v)) continue;
    out.push({ ...cand, level: { ...v, proof: { ...v.proof, minActs: sol.length } } });
  }
  return out;
}

function facts(level: PlayLevel<AankdeParams>, s: AankdeState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (p.goal === "sort" || p.goal === "mode") { f.slips = p.slips.length; f.taken = s.put.length; }
  if (p.goal === "missing") { f.asked = p.total; f.strokes = s.rows[lostRow(p)]?.length ?? 0; }
  if (p.goal === "mode" && s.crown >= 0) f.crate = p.cats[s.crown];
  if (p.goal === "even" || p.goal === "pour") f.towers = p.h.join(",");
  if (p.goal === "pour" && s.line >= 0) f.line = s.line;
  if (p.goal === "middle") { f.cards = p.h.length; if (s.peg >= 0) f.peg = s.peg; }
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
const tallyText = (m: readonly boolean[]) => m.map((x) => (x ? "/" : "|")).join("") || "–";
function board(level: PlayLevel<AankdeParams>, s: AankdeState) {
  const p = level.params, lines: string[] = [];
  if (p.goal === "sort" || p.goal === "mode" || p.goal === "missing") {
    if (p.goal === "missing") lines.push(`asked: ${p.total}`); else lines.push(`pile: ${p.slips.length - s.put.length} left of ${p.slips.length}`);
    p.cats.forEach((c, r) => lines.push(`${c}: ${tallyText(s.rows[r])}${s.crown === r ? " (crate)" : ""}`));
  }
  if (p.goal === "even") lines.push(`towers: ${s.h.join(" ")}`);
  if (p.goal === "pour") lines.push(`towers: ${p.h.join(" ")}`, `line: ${s.line < 0 ? "–" : s.line}`);
  if (p.goal === "middle") lines.push(`line: ${lineValues(p, s.order).join(" ")}`, `peg: ${s.peg < 0 ? "–" : s.peg % 2 ? `between ${(s.peg + 1) / 2} and ${(s.peg + 3) / 2}` : `card ${s.peg / 2 + 1}`}`);
  return { title: "Aankde", lines };
}
function grade(level: PlayLevel<AankdeParams>, acts: PlayActEnvelope<AankdeAct>[]): PlayGrade {
  return gradeLevel(aankdeLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const aankdeLogic: FamilyLogic<AankdeParams, AankdeState, AankdeAct> = {
  family: "aankde", modes: ["tally", "stack", "line"], malRules: AANKDE_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
