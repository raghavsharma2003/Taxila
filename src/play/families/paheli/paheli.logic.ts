// Paheli (पहेली, "puzzle") · round 7, number puzzles (classes 6-7). Nothing here runs on a clock: the child loads, places,
// sets or picks, presses go, and the law answers by plain arithmetic: it pairs counters, sums every line of a grid, adds a
// letter-sum column by column with its carries, or reverses and adds until a palindrome appears. There is no answer box:
// the reasoning IS the move (which bags, which cell, which digit, which start).
// Modes and goals:
//   pairs/load    bags of counters (look 1: drawn as pairs, an odd bag's lone counter left over) on a dock; the boat has k
//                 seats and must carry exactly T counters. Load k bags, then sail: each bag pairs up inside, the lone
//                 counters pair up with each other, and the total is laid against T. The level is built so that the k odd
//                 bags nearest T can never make it (their parity is wrong): parity rules the bag mix out before any adding
//   pairs/trays   the same boat with trays of counters set out as rows × columns (a product); odd × odd is the only odd tray
//   magic/square  a 3 × 3 grid and the tiles 1-9 (some cells given: the centre and two at look 1, a corner and an edge at
//                 look 2, one edge at look 3). Place every tile, then add the lines: all 8 sums (3 rows, 3 columns, 2
//                 diagonals) are laid out and each one that differs is marked
//   magic/shift   the same grid with nine numbers in steps (3-11, 2-18 by 2, 11-19, ...): the magic sum and the centre move
//                 with the numbers; never told
//   cipher/letters a letter sum (AB + BA = CDC, A7 + 5B = 112): the same letter is the same digit, different letters different
//                 digits, no number starts with 0. Give each letter a digit tile, then add: the run adds column by column
//                 from the ones with its carry box and stops at the first column that does not write its letter
//   mirror/reach  a target palindrome (121, 363, 1111); set a 2-digit start (not itself a palindrome) and reverse-and-add
//                 until a palindrome appears: the first palindrome must be the target. AB + BA depends on A + B alone
// Mal-rules (each a deterministic set-up; a level serves one only where it differs from every other one of the goal's):
//   two-odds      load, k = 2, T odd: the two odd bags nearest T ("odd + odd = odd")
//   odd-count     load, k odd ≥ 3, T even: the k odd bags nearest T ("three odds can make 30")
//   like-sum      trays: the k trays nearest T whose parities, read by the sum rules (odd × odd even, odd × even odd), fit T
//   rows          square / shift: the first filling with every ROW on the magic sum, a column or diagonal off
//   rows-cols     square / shift: the first filling with every row and column on the sum, a diagonal off
//   ignore-carry  letters: the first digits that make every column alone write its letter, carries dropped (6□ + □8 = 121 →
//                 6 + 6 = 12)
//   big-carry     letters (a sum one digit longer than both numbers): the true digits but the leading letter as 2
import type { Candidate, Facts, FamilyLogic, GenRequest, Moment, PaheliAct, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type PaheliMode = "pairs" | "magic" | "cipher" | "mirror";
export type PaheliGoal = "load" | "trays" | "square" | "shift" | "letters" | "reach";
/** a bag of `a` counters (b = 1) or a tray of `a` rows of `b` (b ≥ 2) */
export interface Item { a: number; b: number }
/** a letter shown as its digit from the start */
export interface Known { l: string; d: number }
export interface PaheliParams {
  goal: PaheliGoal;
  /** the scaffold (fade) */
  look: 1 | 2 | 3;
  /** pairs: the dock, the boat's seats and the counters it must carry; else [] / 0 */
  items: Item[]; k: number; T: number;
  /** magic: the nine numbers (ascending, equal steps) and the givens by cell (row-major, 0 = empty); else [] */
  set: number[]; given: number[];
  /** cipher: two numbers and their sum as letter rows ("AB", "BA", "CDC"), the letters shown as digits; else [] */
  rows: string[]; known: Known[];
  /** mirror: the target palindrome; else 0 */
  P: number;
}
export interface PaheliState extends Undoable<PaheliState> {
  /** pairs: dock indices loaded, in loading order */
  on: number[];
  /** magic: each cell's number (0 = empty), givens included */
  cells: number[];
  /** cipher: the digit set on each letter (letters in alphabetical order; −1 = none), known letters included */
  dig: number[];
  /** mirror: the start set (0 = none) */
  start: number;
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const PAHELI_MAL = ["two-odds", "odd-count", "like-sum", "rows", "rows-cols", "ignore-carry", "big-carry"] as const;
const MAL_OF: Record<PaheliGoal, readonly string[]> = {
  load: ["two-odds", "odd-count"], trays: ["like-sum"], square: ["rows", "rows-cols"], shift: ["rows", "rows-cols"],
  letters: ["ignore-carry", "big-carry"], reach: [],
};
const GOALS_OF: Record<PaheliMode, readonly PaheliGoal[]> = { pairs: ["load", "trays"], magic: ["square", "shift"], cipher: ["letters"], mirror: ["reach"] };
const MODES: readonly PaheliMode[] = ["pairs", "magic", "cipher", "mirror"];
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);

// ── pairs ──
export const valueOfItem = (it: Item) => it.a * it.b;
export const itemText = (it: Item) => (it.b === 1 ? String(it.a) : `${it.a} × ${it.b}`);
/** the k-subsets of 0..n−1, in lexicographic order */
function subsets(n: number, k: number): number[][] {
  const out: number[][] = [], cur: number[] = [];
  const rec = (i: number) => {
    if (cur.length === k) { out.push([...cur]); return; }
    for (let j = i; j <= n - (k - cur.length); j++) { cur.push(j); rec(j + 1); cur.pop(); }
  };
  rec(0);
  return out;
}
const sumOf = (p: Pick<PaheliParams, "items">, idx: readonly number[]) => idx.reduce((t, i) => t + valueOfItem(p.items[i]), 0);
/** every k-subset of the dock that carries exactly T */
export function loadSolutions(p: Pick<PaheliParams, "items" | "k" | "T">): number[][] { return subsets(p.items.length, p.k).filter((s) => sumOf(p, s) === p.T); }

// ── magic ──
export const LINES: readonly (readonly [number, number, number])[] = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
/** the magic sum of a set: a third of its total */
export const magicSum = (set: readonly number[]) => set.reduce((a, b) => a + b, 0) / 3;
export const lineSums = (cells: readonly number[]) => LINES.map((l) => cells[l[0]] + cells[l[1]] + cells[l[2]]);
const LO_SHU = [2, 7, 6, 9, 5, 1, 4, 3, 8];
const SYM: ((r: number, c: number) => [number, number])[] = [
  (r, c) => [r, c], (r, c) => [c, 2 - r], (r, c) => [2 - r, 2 - c], (r, c) => [2 - c, r],
  (r, c) => [r, 2 - c], (r, c) => [2 - r, c], (r, c) => [c, r], (r, c) => [2 - c, 2 - r],
];
/** the 8 magic squares of a 9-number set in equal steps (Lo Shu's turns and flips) */
export function magicSquares(set: readonly number[]): number[][] {
  return SYM.map((f) => { const g = Array(9).fill(0); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const [rr, cc] = f(r, c); g[rr * 3 + cc] = set[LO_SHU[r * 3 + c] - 1]; } return g; });
}
export const magicFits = (sq: readonly number[], given: readonly number[]) => given.every((v, i) => !v || sq[i] === v);
/** the first filling of the empty cells (row-major, numbers ascending) that `ok` accepts, checking each row as it fills */
function firstFilling(set: readonly number[], given: readonly number[], rowOk: (row: number[]) => boolean, ok: (cells: number[]) => boolean): number[] | null {
  const free = set.filter((v) => !given.includes(v)), cells = [...given], used = new Set<number>();
  let found: number[] | null = null;
  const rec = (i: number): boolean => {
    if (i === 9) { if (ok(cells)) { found = [...cells]; return true; } return false; }
    if (i % 3 === 0 && i > 0 && !rowOk(cells.slice(i - 3, i))) return false;
    if (given[i]) return rec(i + 1);
    for (const v of free) {
      if (used.has(v)) continue;
      used.add(v); cells[i] = v;
      if (rec(i + 1)) return true;
      used.delete(v); cells[i] = 0;
    }
    return false;
  };
  rec(0);
  return found;
}
const isMagic = (cells: readonly number[]) => { const s = lineSums(cells); return cells.every((v) => v > 0) && s.every((x) => x === s[0]); };

// ── cipher ──
export const lettersOf = (rows: readonly string[]) => [...new Set(rows.join("").split(""))].sort();
/** the digit of each letter as a map */
const numOf = (row: string, m: Record<string, number>) => row.split("").reduce((t, l) => t * 10 + m[l], 0);
/** column c (0 = ones) of a row, or "" */
const colOf = (row: string, c: number) => (c < row.length ? row[row.length - 1 - c] : "");
export const leadLetters = (rows: readonly string[]) => new Set(rows.filter((r) => r.length > 1).map((r) => r[0]));
/** the letter sum holds: every letter a digit, all different, no leading 0, the addition true */
export function cipherTrue(rows: readonly string[], m: Record<string, number>): boolean {
  const ls = lettersOf(rows);
  if (ls.some((l) => !isInt(m[l]) || m[l] < 0 || m[l] > 9)) return false;
  if (new Set(ls.map((l) => m[l])).size !== ls.length) return false;
  for (const l of leadLetters(rows)) if (m[l] === 0) return false;
  return numOf(rows[0], m) + numOf(rows[1], m) === numOf(rows[2], m);
}
/** the believer's reading: each column alone writes its letter, the carry dropped; the top column's spill is the extra digit */
function cipherNoCarry(rows: readonly string[], m: Record<string, number>): boolean {
  const [a, b, r] = rows, n = Math.max(a.length, b.length);
  for (let c = 0; c < n; c++) {
    const s = (colOf(a, c) ? m[colOf(a, c)] : 0) + (colOf(b, c) ? m[colOf(b, c)] : 0);
    if (s % 10 !== m[colOf(r, c)]) return false;
    if (c === n - 1) { const spill = Math.floor(s / 10); if (r.length > n ? spill !== m[r[0]] : spill !== 0) return false; }
  }
  return r.length <= n + 1;
}
/**
 * Every assignment (letters alphabetical, digits ascending) consistent with the known letters, all digits different and
 * no leading 0, that `ok` accepts; at most `cap`. Letters are tried from the ones column up, and each column is checked as
 * soon as all its letters (and all lower ones) are set.
 */
function assignments(rows: readonly string[], known: readonly Known[], cap: number, ok: (m: Record<string, number>) => boolean, carry: boolean): Record<string, number>[] {
  const [a, b, r] = rows, n = r.length, order: string[] = [];
  for (let c = 0; c < n; c++) for (const row of [a, b, r]) { const l = colOf(row, c); if (l && !order.includes(l)) order.push(l); }
  const m: Record<string, number> = {}, used = new Set<number>(), lead = leadLetters(rows), out: Record<string, number>[] = [];
  for (const k of known) { m[k.l] = k.d; used.add(k.d); }
  // the column a letter completes: the highest column holding a letter at or before it in `order`
  const doneAt = order.map((_, i) => { let c = -1; for (let cc = 0; cc < n; cc++) if ([a, b, r].every((row) => !colOf(row, cc) || order.indexOf(colOf(row, cc)) <= i)) c = cc; else break; return c; });
  const nA = Math.max(a.length, b.length);
  // carry: the true addition; no carry: each column alone, the top column's spill written as the extra digit
  const prefixOk = (upTo: number) => {
    let cy = 0;
    for (let c = 0; c <= upTo; c++) {
      if (c >= nA) { if (m[colOf(r, c)] !== cy) return false; continue; }
      const s = (colOf(a, c) ? m[colOf(a, c)] : 0) + (colOf(b, c) ? m[colOf(b, c)] : 0) + (carry ? cy : 0);
      if (s % 10 !== m[colOf(r, c)]) return false;
      cy = Math.floor(s / 10);
    }
    return upTo < n - 1 || n > nA || cy === 0;
  };
  const rec = (i: number) => {
    if (out.length >= cap) return;
    if (i === order.length) { if (ok(m)) out.push({ ...m }); return; }
    const l = order[i];
    if (l in m && known.some((k) => k.l === l)) { if (prefixOk(doneAt[i])) rec(i + 1); return; }
    for (let d = 0; d <= 9; d++) {
      if (used.has(d) || (d === 0 && lead.has(l))) continue;
      used.add(d); m[l] = d;
      if (prefixOk(doneAt[i])) rec(i + 1);
      used.delete(d); delete m[l];
      if (out.length >= cap) return;
    }
  };
  rec(0);
  return out;
}
export function cipherSolutions(p: Pick<PaheliParams, "rows" | "known">, cap = 2): Record<string, number>[] { return assignments(p.rows, p.known, cap, (m) => cipherTrue(p.rows, m), true); }

// ── mirror ──
export const reverseNum = (n: number) => Number(String(n).split("").reverse().join(""));
export const isPal = (n: number) => { const s = String(n); return s === s.split("").reverse().join(""); };
export const MAX_STEPS = 8;
/** reverse-and-add from a start until the first palindrome (at most MAX_STEPS steps): the numbers met, start first */
export function chainOf(start: number): number[] {
  const out = [start];
  let n = start;
  for (let k = 0; k < MAX_STEPS; k++) { n = n + reverseNum(n); out.push(n); if (isPal(n)) break; }
  return out;
}
const startOk = (n: number) => isInt(n) && n >= 10 && n <= 99 && !isPal(n);
/** every start that reaches the target first */
export function reachStarts(P: number): number[] { const out: number[] = []; for (let s = 10; s <= 99; s++) if (startOk(s)) { const c = chainOf(s); if (c[c.length - 1] === P && isPal(P)) out.push(s); } return out; }

// ── the judgement ──
/** a set-up: what the child commits before the run */
export interface Setup { on?: number[]; cells?: number[]; dig?: Record<string, number>; start?: number }
export function judge(p: PaheliParams, s: Setup): boolean {
  switch (p.goal) {
    case "load": case "trays": return !!s.on && s.on.length === p.k && new Set(s.on).size === p.k && sumOf(p, s.on) === p.T;
    case "square": case "shift": return !!s.cells && isMagic(s.cells);
    case "letters": return !!s.dig && cipherTrue(p.rows, s.dig);
    case "reach": { if (!s.start || !startOk(s.start)) return false; const c = chainOf(s.start); return c[c.length - 1] === p.P; }
  }
}
function legal(p: PaheliParams, s: Setup): boolean {
  switch (p.goal) {
    case "load": case "trays": return !!s.on && s.on.length === p.k && new Set(s.on).size === p.k && s.on.every((i) => isInt(i) && i >= 0 && i < p.items.length);
    case "square": case "shift": {
      if (!s.cells || s.cells.length !== 9) return false;
      if (!p.given.every((v, i) => !v || s.cells![i] === v)) return false;
      return [...s.cells].sort((x, y) => x - y).join() === p.set.join();
    }
    case "letters": {
      if (!s.dig) return false;
      const ls = lettersOf(p.rows);
      if (!ls.every((l) => isInt(s.dig![l]) && s.dig![l] >= 0 && s.dig![l] <= 9) || new Set(ls.map((l) => s.dig![l])).size !== ls.length) return false;
      return p.known.every((k) => s.dig![k.l] === k.d);
    }
    case "reach": return !!s.start && startOk(s.start);
  }
}
const nearest = (p: PaheliParams, cands: number[][]) => {
  let best: number[] | null = null, bd = Infinity;
  for (const c of cands) { const d = Math.abs(sumOf(p, c) - p.T); if (d < bd) { bd = d; best = c; } }
  return best;
};
const parityRead = (it: Item) => (it.b === 1 ? it.a % 2 : (it.a + it.b) % 2);
function rawMal(p: PaheliParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  switch (mal) {
    case "two-odds": case "odd-count": {
      if (mal === "two-odds" ? p.k !== 2 || p.T % 2 !== 1 : p.k < 3 || p.k % 2 !== 1 || p.T % 2 !== 0) return null;
      const odd = p.items.map((it, i) => [it, i] as const).filter(([it]) => valueOfItem(it) % 2 === 1).map(([, i]) => i);
      if (odd.length < p.k) return null;
      const pick = nearest(p, subsets(odd.length, p.k).map((s) => s.map((j) => odd[j])));
      return pick ? { on: pick } : null;
    }
    case "like-sum": {
      const fits = subsets(p.items.length, p.k).filter((s) => s.reduce((t, i) => t + parityRead(p.items[i]), 0) % 2 === p.T % 2);
      const pick = nearest(p, fits.filter((s) => sumOf(p, s) !== p.T));
      return pick ? { on: pick } : null;
    }
    case "rows": case "rows-cols": {
      const S = magicSum(p.set);
      const cells = firstFilling(p.set, p.given, (row) => row[0] + row[1] + row[2] === S, (c) => {
        const ls = lineSums(c);
        if (isMagic(c) || !ls.slice(0, 3).every((x) => x === S)) return false;
        return mal === "rows" ? !ls.slice(3, 6).every((x) => x === S) : ls.slice(3, 6).every((x) => x === S);
      });
      return cells ? { cells } : null;
    }
    case "ignore-carry": {
      const m = assignments(p.rows, p.known, 1, (mm) => cipherNoCarry(p.rows, mm) && !cipherTrue(p.rows, mm), false)[0];
      return m ? { dig: m } : null;
    }
    case "big-carry": {
      const [a, b, r] = p.rows;
      if (r.length <= Math.max(a.length, b.length) || p.known.some((k) => k.l === r[0])) return null;
      const sol = cipherSolutions(p, 1)[0];
      if (!sol || Object.entries(sol).some(([l, d]) => d === 2 && l !== r[0])) return null;
      return { dig: { ...sol, [r[0]]: 2 } };
    }
  }
  return null;
}
const sameSetup = (a: Setup, b: Setup) => JSON.stringify([a.on ? [...a.on].sort() : null, a.cells ?? null, a.dig ? Object.entries(a.dig).sort() : null, a.start ?? null])
  === JSON.stringify([b.on ? [...b.on].sort() : null, b.cells ?? null, b.dig ? Object.entries(b.dig).sort() : null, b.start ?? null]);
/** The set-up a child holding `mal` commits, or null (no reading here, not legal, would solve, or another of the goal's
 *  beliefs commits the very same set-up: a signature names ONE belief) */
export function malSetup(p: PaheliParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  for (const other of MAL_OF[p.goal]) {
    if (other === mal) continue;
    const o = rawMal(p, other);
    if (o && sameSetup(o, m)) return null;
  }
  return m;
}

/** the values the teacher may not say before the child produces them */
export function paheliHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as PaheliParams | null;
  if (!p || typeof p.goal !== "string") return [];
  try {
    switch (p.goal) {
      // the bags that make it (as written on the dock), never said first
      case "load": case "trays": return [...new Set((loadSolutions(p)[0] ?? []).map((i) => itemText(p.items[i])))];
      // the magic sum and the centre
      case "square": case "shift": return [String(magicSum(p.set)), String(p.set[4])];
      // the solved numbers and each hidden letter's digit
      case "letters": {
        const m = cipherSolutions(p, 1)[0];
        if (!m) return [];
        return [...p.rows.map((r) => String(numOf(r, m))), ...lettersOf(p.rows).filter((l) => !p.known.some((k) => k.l === l)).map((l) => `${l} = ${m[l]}`)];
      }
      case "reach": return reachStarts(p.P).map(String);
    }
  } catch { return []; }
  return [];
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const ZERO = { items: [] as Item[], k: 0, T: 0, set: [] as number[], given: [] as number[], rows: [] as string[], known: [] as Known[], P: 0 };
type ZeroKey = keyof typeof ZERO;
const ROW_RE = /^[A-J]{1,4}$/;

function validate(level: PlayLevel<unknown>): PlayLevel<PaheliParams> | null {
  const p = level.params as Partial<PaheliParams> | null, mode = level.mode as PaheliMode;
  if (!p || !GOALS_OF[mode] || !GOALS_OF[mode].includes(p.goal as PaheliGoal)) return null;
  const goal = p.goal as PaheliGoal;
  const look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look) return null;
  const base: PaheliParams = { goal, look, ...ZERO, items: [], set: [], given: [], rows: [], known: [] };
  const ALL = Object.keys(ZERO) as ZeroKey[];
  // every field a goal does not use stays empty (a tampered level never smuggles a second puzzle in)
  const others = (used: ZeroKey[]) => ALL.filter((k) => !used.includes(k)).every((k) => Array.isArray(ZERO[k]) ? Array.isArray(p[k]) && !(p[k] as unknown[]).length : p[k] === ZERO[k]);
  if (goal === "load" || goal === "trays") {
    const { items, k, T } = p;
    if (!Array.isArray(items) || !isInt(k) || !isInt(T) || !others(["items", "k", "T"])) return null;
    if (items.length < 4 || items.length > 8 || k < 2 || k > 5 || k >= items.length) return null;
    const its: Item[] = [];
    for (const it of items) {
      if (!it || !isInt(it.a) || !isInt(it.b)) return null;
      if (goal === "load" ? it.b !== 1 || it.a < 2 || it.a > 59 : it.a < 2 || it.a > 9 || it.b < 2 || it.b > 9) return null;
      its.push({ a: it.a, b: it.b });
    }
    // look 1 draws every counter: small bags only
    if (goal === "load" && look === 1 && its.some((it) => it.a > 21)) return null;
    if (new Set(its.map(itemText)).size !== its.length) return null;
    const q = { items: its, k, T };
    if (!loadSolutions(q).length) return null;
    return { ...level, params: { ...base, items: its, k, T } } as PlayLevel<PaheliParams>;
  }
  if (goal === "square" || goal === "shift") {
    const { set, given } = p;
    if (!Array.isArray(set) || !Array.isArray(given) || set.length !== 9 || given.length !== 9 || !others(["set", "given"])) return null;
    if (!set.every(isInt) || !given.every(isInt)) return null;
    const d = set[1] - set[0];
    if (d < 1 || d > 3 || set[0] < 1 || set.some((v, i) => v !== set[0] + d * i) || set[8] > 40) return null;
    if (goal === "square" ? set[0] !== 1 || d !== 1 : set[0] === 1 && d === 1) return null;
    const gv = given.filter((v) => v > 0);
    if (!given.every((v) => v === 0 || set.includes(v)) || new Set(gv).size !== gv.length) return null;
    // the givens per look: look 1 two or three, look 2 two (never the centre), look 3 one
    const nG = gv.length;
    if (look === 1 ? nG < 2 || nG > 3 : look === 2 ? nG !== 2 || given[4] !== 0 : nG !== 1 || given[4] !== 0) return null;
    if (!magicSquares(set).some((sq) => magicFits(sq, given))) return null;
    return { ...level, params: { ...base, set: [...set], given: [...given] } } as PlayLevel<PaheliParams>;
  }
  if (goal === "letters") {
    const { rows, known } = p;
    if (!Array.isArray(rows) || rows.length !== 3 || !rows.every((r) => typeof r === "string" && ROW_RE.test(r)) || !Array.isArray(known) || !others(["rows", "known"])) return null;
    const [a, b, r] = rows as string[];
    if (a.length < 2 || b.length < 2 || a.length > 3 || b.length > 3 || r.length < Math.max(a.length, b.length) || r.length > Math.max(a.length, b.length) + 1) return null;
    const ls = lettersOf(rows as string[]);
    if (ls.length > 7) return null;
    const kn: Known[] = [];
    for (const k of known) {
      if (!k || typeof k.l !== "string" || !ls.includes(k.l) || !isInt(k.d) || k.d < 0 || k.d > 9) return null;
      kn.push({ l: k.l, d: k.d });
    }
    if (new Set(kn.map((k) => k.l)).size !== kn.length || new Set(kn.map((k) => k.d)).size !== kn.length) return null;
    // at least one letter to find; at look 1 at most two, so a hidden digit is found from its column
    const hid = ls.length - kn.length;
    if (hid < 1 || (look === 1 && hid > 2)) return null;
    const q = { rows: rows as string[], known: kn.sort((x, y) => (x.l < y.l ? -1 : 1)) };
    // exactly one way to crack it
    if (cipherSolutions(q, 2).length !== 1) return null;
    return { ...level, params: { ...base, rows: [...q.rows], known: q.known } } as PlayLevel<PaheliParams>;
  }
  // reach: a palindrome some 2-digit start reaches first
  const { P } = p;
  if (!isInt(P) || !others(["P"]) || !isPal(P) || P < 11 || !reachStarts(P).length) return null;
  return { ...level, params: { ...base, P } } as PlayLevel<PaheliParams>;
}

function init(level: PlayLevel<PaheliParams>): PaheliState {
  const p = level.params, ls = lettersOf(p.rows);
  return { on: [], cells: p.given.length ? [...p.given] : [], dig: ls.map((l) => p.known.find((k) => k.l === l)?.d ?? -1), start: 0,
    ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}
export const digMap = (p: Pick<PaheliParams, "rows">, s: Pick<PaheliState, "dig">): Record<string, number> => Object.fromEntries(lettersOf(p.rows).map((l, i) => [l, s.dig[i]]));
const setupOf = (p: PaheliParams, s: PaheliState): Setup => {
  switch (p.goal) {
    case "load": case "trays": return { on: s.on };
    case "square": case "shift": return { cells: s.cells };
    case "letters": return { dig: digMap(p, s) };
    case "reach": return { start: s.start };
  }
};
const ready = (p: PaheliParams, s: PaheliState): string | null => {
  switch (p.goal) {
    case "load": case "trays": return s.on.length === p.k ? null : "fill_seats";
    case "square": case "shift": return s.cells.every((v) => v > 0) ? null : "fill_grid";
    case "letters": return s.dig.every((d) => d >= 0) ? null : "set_letters";
    case "reach": return s.start ? null : "set_start";
  }
};

function apply(level: PlayLevel<PaheliParams>, s: PaheliState, act: PaheliAct, seq: number): { state: PaheliState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: PaheliState): PaheliState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  // any change of the set-up makes the next run a fresh one
  const change = (patch: Partial<PaheliState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  switch (act.kind) {
    case "load": {
      if (p.goal !== "load" && p.goal !== "trays") return no("no_dock");
      const i = Number(act.i);
      if (!isInt(i) || i < 0 || i >= p.items.length) return no("bad_bag");
      if (s.on.includes(i)) return change({ on: s.on.filter((j) => j !== i) });
      if (s.on.length >= p.k) return no("boat_full");
      return change({ on: [...s.on, i] });
    }
    case "put": {
      if (p.goal !== "square" && p.goal !== "shift") return no("no_grid");
      const v = Number(act.v), cell = Number(act.cell);
      if (!isInt(v) || !p.set.includes(v) || p.given.includes(v)) return no("bad_tile");
      if (!isInt(cell) || cell < -1 || cell > 8) return no("bad_cell");
      if (cell >= 0 && p.given[cell]) return no("given");
      const cells = [...s.cells], from = cells.indexOf(v);
      if (from === cell) return no("same_cell");
      if (cell < 0) { if (from < 0) return no("same_cell"); cells[from] = 0; return change({ cells }); }
      // a number put on a filled cell swaps with it (or sends it back to the tray)
      const there = cells[cell];
      if (from >= 0) cells[from] = there;
      cells[cell] = v;
      return change({ cells });
    }
    case "digit": {
      if (p.goal !== "letters") return no("no_letters");
      const ls = lettersOf(p.rows), li = ls.indexOf(String(act.l)), d = Number(act.d);
      if (li < 0) return no("bad_letter");
      if (p.known.some((k) => k.l === act.l)) return no("given");
      if (!isInt(d) || d < -1 || d > 9) return no("bad_digit");
      if (s.dig[li] === d) return no("same_digit");
      // each digit tile once: a tile taken from another letter leaves it empty
      if (d >= 0 && p.known.some((k) => k.d === d)) return no("given");
      const dig = s.dig.map((x, i) => (i === li ? d : x === d && d >= 0 ? -1 : x));
      return change({ dig });
    }
    case "start": {
      if (p.goal !== "reach") return no("no_wheels");
      const n = Number(act.n);
      if (!isInt(n) || n < 10 || n > 99) return no("off_wheels");
      if (n === s.start) return no("same_start");
      return change({ start: n });
    }
    case "run": {
      if (s.ended) return no("change_first");
      const wait = ready(p, s);
      if (wait) return no(wait);
      // a start that is already a palindrome has nothing to do
      if (p.goal === "reach" && isPal(s.start)) return no("already_palindrome");
      const su = setupOf(p, s), runs = s.runs + 1, ok = judge(p, su);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: p.goal, run: runs };
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) {
        const m = malSetup(p, mal);
        if (m && sameSetup(m, su)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      out.push(mom(nearMiss(p, s) ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
/** one off: the load one counter off T; the grid with 7 of 8 lines on; one column of the letter sum wrong */
function nearMiss(p: PaheliParams, s: PaheliState): boolean {
  switch (p.goal) {
    case "load": case "trays": return Math.abs(sumOf(p, s.on) - p.T) === 1;
    case "square": case "shift": { const S = magicSum(p.set); return lineSums(s.cells).filter((x) => x !== S).length === 1; }
    case "letters": { const r = columnRun(p.rows, digMap(p, s)); return r.filter((c) => !c.ok).length === 1; }
    case "reach": return false;
  }
}
/** the run of a letter sum, column by column from the ones: carry in, the column's total, the digit it writes, ok */
export function columnRun(rows: readonly string[], m: Record<string, number>): { cin: number; sum: number; write: number; ok: boolean }[] {
  const [a, b, r] = rows, n = Math.max(a.length, b.length), out: { cin: number; sum: number; write: number; ok: boolean }[] = [];
  let cy = 0;
  for (let c = 0; c < n; c++) {
    const s = (colOf(a, c) ? m[colOf(a, c)] : 0) + (colOf(b, c) ? m[colOf(b, c)] : 0) + cy;
    out.push({ cin: cy, sum: s, write: s % 10, ok: s % 10 === m[colOf(r, c)] });
    cy = Math.floor(s / 10);
  }
  if (r.length > n) out.push({ cin: cy, sum: cy, write: cy, ok: cy === m[r[0]] });
  else if (cy) out.push({ cin: cy, sum: cy, write: cy, ok: false });
  return out;
}
const goalMet = (_l: PlayLevel<PaheliParams>, s: PaheliState) => s.done;

/** the acts that commit a set-up from the level's start, then run */
export function setupActs(p: PaheliParams, su: Setup): PaheliAct[] {
  const acts: PaheliAct[] = [];
  if (su.on) for (const i of su.on) acts.push({ kind: "load", i });
  if (su.cells) su.cells.forEach((v, cell) => { if (!p.given[cell]) acts.push({ kind: "put", v, cell }); });
  if (su.dig) for (const l of lettersOf(p.rows)) if (!p.known.some((k) => k.l === l)) acts.push({ kind: "digit", l, d: su.dig[l] });
  if (su.start) acts.push({ kind: "start", n: su.start });
  acts.push({ kind: "run" });
  return acts;
}
function solveSetup(p: PaheliParams): Setup | null {
  switch (p.goal) {
    case "load": case "trays": { const s = loadSolutions(p)[0]; return s ? { on: s } : null; }
    case "square": case "shift": { const sq = magicSquares(p.set).find((q) => magicFits(q, p.given)); return sq ? { cells: sq } : null; }
    case "letters": { const m = cipherSolutions(p, 1)[0]; return m ? { dig: m } : null; }
    case "reach": { const s = reachStarts(p.P)[0]; return s ? { start: s } : null; }
  }
}
function solve(level: PlayLevel<PaheliParams>): PaheliAct[] | null {
  const su = solveSetup(level.params);
  return su && legal(level.params, su) ? setupActs(level.params, su) : null;
}
/**
 * Set-ups that win without the idea: the first / last k bags, the k smallest / largest; the free tiles in order or
 * reversed into the empty cells; the letters given 1, 2, 3 … or 9, 8, 7 … in turn (the given digits skipped); the start
 * as 10, 12, 21, 98 or the target's own first or last two digits. A level any of them solves is never served.
 */
export function shortcutSetups(p: PaheliParams): Setup[] {
  const tries: Setup[] = [];
  if (p.goal === "load" || p.goal === "trays") {
    const n = p.items.length, idx = [...Array(n).keys()], byVal = [...idx].sort((x, y) => valueOfItem(p.items[x]) - valueOfItem(p.items[y]));
    tries.push({ on: idx.slice(0, p.k) }, { on: idx.slice(n - p.k) }, { on: byVal.slice(0, p.k) }, { on: byVal.slice(n - p.k) });
  } else if (p.goal === "square" || p.goal === "shift") {
    const free = p.set.filter((v) => !p.given.includes(v));
    for (const order of [free, [...free].reverse()]) { let j = 0; tries.push({ cells: p.given.map((v) => v || order[j++]) }); }
  } else if (p.goal === "letters") {
    const taken = new Set(p.known.map((k) => k.d));
    for (const digits of [[1, 2, 3, 4, 5, 6, 7, 8, 9, 0], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]]) {
      const free = digits.filter((d) => !taken.has(d)), dig: Record<string, number> = {};
      let j = 0;
      for (const l of lettersOf(p.rows)) dig[l] = p.known.find((k) => k.l === l)?.d ?? free[j++];
      tries.push({ dig });
    }
  } else {
    const s = String(p.P);
    for (const n of [10, 12, 21, 98, Number(s.slice(0, 2)), Number(s.slice(-2))]) tries.push({ start: n });
  }
  return tries;
}
function shortcut(level: PlayLevel<PaheliParams>): PaheliAct[] | null {
  const p = level.params;
  for (const t of shortcutSetups(p)) if (legal(p, t) && judge(p, t)) return setupActs(p, t);
  return null;
}
function malActs(level: PlayLevel<PaheliParams>, mal: string): PaheliAct[] | null {
  const m = malSetup(level.params, mal);
  return m ? setupActs(level.params, m) : null;
}

interface PaheliGrammar {
  /** load: the seats a boat may have */
  ks?: number[];
  /** shift: the number sets (first number, step) */
  sets?: [number, number][];
  /** letters: the shapes of the sum ("2+2=3", "2+2=2", "rev", "3+3=4", "3+3=3") */
  forms?: string[];
}
function difficultyOf(p: PaheliParams): number {
  const f = 0.08 * (p.look - 1);
  switch (p.goal) {
    case "load": case "trays": return Math.min(1, 0.25 + f + 0.06 * p.k + 0.02 * p.items.length);
    case "square": return Math.min(1, 0.3 + f);
    case "shift": return Math.min(1, 0.4 + f + (p.set[1] - p.set[0] > 1 ? 0.05 : 0));
    case "letters": return Math.min(1, 0.3 + f + 0.04 * (lettersOf(p.rows).length - p.known.length));
    case "reach": return Math.min(1, 0.25 + f + 0.08 * (chainOf(reachStarts(p.P)[0] ?? 10).length - 2));
  }
}
/** the palindromes a 2-digit start reaches, by how many steps the quickest start takes */
const REACH: Record<1 | 2 | 3, number[]> = { 1: [55, 66, 77, 88, 99, 121], 2: [121, 363, 484], 3: [1111, 4884, 44044] };

function generate(req: GenRequest): Candidate<PaheliParams>[] {
  const g = req.grammar as PaheliGrammar;
  const mode = MODES.find((m) => m === req.mode) ?? "pairs";
  const goal = (GOALS_OF[mode].includes(req.goal as PaheliGoal) ? req.goal : GOALS_OF[mode][0]) as PaheliGoal;
  const rnd = mulberry32(req.seed), out: Candidate<PaheliParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const shuffle = <T>(xs: T[]): T[] => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const base: PaheliParams = { goal, look, ...ZERO, items: [], set: [], given: [], rows: [], known: [] };
  const mk = (params: PaheliParams, sig: string): Candidate<PaheliParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `paheli-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "paheli", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "paheli", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const ks = (g.ks ?? [2, 3]).filter((k) => isInt(k) && k >= 2 && k <= 5);
  const sets = (g.sets ?? [[2, 1], [3, 1], [11, 1], [2, 2], [1, 2]]).filter((s) => Array.isArray(s) && isInt(s[0]) && isInt(s[1]));
  const forms = (g.forms ?? ["2+2=3", "rev", "2+2=2"]);
  for (let tries = 0; tries < 160 && out.length < 24; tries++) {
    let params: PaheliParams | null = null, sig = "";
    if (goal === "load" || goal === "trays") {
      const k = pickOf(ks.length ? ks : [2]);
      // the trap: T's parity is never the parity of k odd bags (two odds for an odd T, three or five odds for an even T)
      const Tpar = goal === "trays" ? int(0, 1) : k % 2 === 0 ? 1 : 0;
      const n = Math.min(8, k + int(3, 4));
      const lo = look === 1 ? 3 : look === 2 ? 7 : 11, hi = look === 1 ? 21 : look === 2 ? 35 : 59;
      const mkItem = (odd: boolean): Item => {
        if (goal === "trays") {
          const a = int(2, 9);
          if (odd) return { a: 2 * int(1, 4) + 1, b: 2 * int(1, 4) + 1 };
          return rnd() < 0.5 ? { a, b: 2 * int(1, 4) } : { a: 2 * int(1, 4), b: int(2, 9) };
        }
        const v = int(lo, hi);
        return { a: (v % 2 === 1) === odd ? v : v + 1 > hi ? v - 1 : v + 1, b: 1 };
      };
      const items: Item[] = [];
      // mostly odd bags: at least k + 1 of them, so the all-odd loads are many and near
      const nOdd = goal === "trays" ? int(Math.ceil(n / 2), n - 1) : int(k + 1, n - 1);
      let guard = 0;
      while (items.length < n && guard++ < 60) {
        const it = mkItem(items.length < nOdd);
        if (items.some((x) => itemText(x) === itemText(it))) continue;
        items.push(it);
      }
      if (items.length !== n) continue;
      shuffle(items);
      // T: a load with the right parity, never all-odd bags
      const subs = subsets(n, k).filter((s) => sumOf({ items }, s) % 2 === Tpar && !s.every((i) => valueOfItem(items[i]) % 2 === 1));
      if (!subs.length) continue;
      const T = sumOf({ items }, pickOf(subs));
      params = { ...base, items, k, T }; sig = `${goal}:${k}:${T}:${items.map(itemText).join(",")}`;
      // few ways to make it, and the trap set-up exists
      if (loadSolutions(params).length > 2) continue;
      const trap = goal === "trays" ? "like-sum" : k === 2 ? "two-odds" : k % 2 ? "odd-count" : "";
      if (trap && !malSetup(params, trap)) continue;
    } else if (goal === "square" || goal === "shift") {
      const [a, d] = goal === "square" ? [1, 1] : pickOf(sets.length ? sets : [[2, 1]]);
      const set = [...Array(9).keys()].map((i) => a + d * i);
      const sq = pickOf(magicSquares(set));
      const given = Array(9).fill(0);
      const corners = shuffle([0, 2, 6, 8]), edges = shuffle([1, 3, 5, 7]);
      if (look === 1) { given[4] = sq[4]; given[corners[0]] = sq[corners[0]]; if (goal === "square") given[edges[0]] = sq[edges[0]]; }
      else if (look === 2) { given[corners[0]] = sq[corners[0]]; given[edges[0]] = sq[edges[0]]; }
      else given[edges[0]] = sq[edges[0]];
      params = { ...base, set, given }; sig = `${goal}:${a}+${d}:${given.join("")}`;
    } else if (goal === "letters") {
      const form = pickOf(forms);
      let x = 0, y = 0;
      if (form === "rev") { const A = int(1, 9), B = int(1, 9); if (A === B) continue; x = 10 * A + B; y = 10 * B + A; }
      else if (form.startsWith("2+2")) { x = int(12, 98); y = int(12, 98); }
      else { x = int(102, 987); y = int(102, 987); }
      const z = x + y, la = String(x).length, lz = String(z).length;
      const wantLen = Number(form.slice(-1)) || (form === "rev" ? lz : 0);
      if (form !== "rev" && lz !== wantLen) continue;
      // at least one carry
      if (columnRun([String(x), String(y), String(z)].map((s) => s.replace(/\d/g, (c) => "ABCDEFGHIJ"[Number(c)])), Object.fromEntries("ABCDEFGHIJ".split("").map((l, i) => [l, i]))).every((c) => c.cin === 0)) continue;
      const map = new Map<string, string>();
      const letter = (c: string) => { if (!map.has(c)) map.set(c, "ABCDEFGHIJ"[map.size]); return map.get(c)!; };
      const rows = [String(x), String(y), String(z)].map((s) => s.split("").map(letter).join(""));
      if (map.size > 7 || la > 3) continue;
      const truth: Record<string, number> = {};
      for (const [dch, l] of map) truth[l] = Number(dch);
      // reveal letters until one way remains; look 1 leaves at most two letters to find, look 2 at most four
      const ls = lettersOf(rows), known: Known[] = [];
      const order = shuffle([...ls]);
      const cap = look === 1 ? 2 : look === 2 ? 4 : 9;
      const cnt = () => cipherSolutions({ rows, known }, 2).length;
      for (const l of order) {
        if (ls.length - known.length <= cap && cnt() === 1) break;
        if (ls.length - known.length <= 1) break;
        known.push({ l, d: truth[l] });
      }
      known.sort((p1, p2) => (p1.l < p2.l ? -1 : 1));
      params = { ...base, rows, known }; sig = `letters:${rows.join("+")}:${known.map((k) => `${k.l}${k.d}`).join("")}`;
    } else {
      const P = pickOf(REACH[look]);
      params = { ...base, P }; sig = `reach:${P}:${look}`;
      // reach has few targets per look: the same one may come back with another seed
    }
    if (!params || seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig);
    const v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push(cand);
  }
  return out;
}

function facts(level: PlayLevel<PaheliParams>, s: PaheliState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (p.goal === "load" || p.goal === "trays") { f.loaded = s.on.length; f.seats = p.k; f.target = p.T; }
  if (p.goal === "square" || p.goal === "shift") f.placed = s.cells.filter((v, i) => v && !p.given[i]).length;
  if (p.goal === "letters") f.set = s.dig.filter((d) => d >= 0).length - p.known.length;
  if (p.goal === "reach") { f.target = p.P; if (s.start) f.start = s.start; }
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<PaheliParams>, s: PaheliState) {
  const p = level.params, lines: string[] = [];
  if (p.goal === "load" || p.goal === "trays") lines.push(`boat: ${p.k} seats, ${p.T} counters`, `dock: ${p.items.map(itemText).join(", ")}`, `loaded: ${s.on.map((i) => itemText(p.items[i])).join(", ") || "–"}`);
  if (p.goal === "square" || p.goal === "shift") { lines.push(`numbers: ${p.set.join(", ")}`); for (let r = 0; r < 3; r++) lines.push(s.cells.slice(r * 3, r * 3 + 3).map((v) => v || "·").join(" ")); }
  if (p.goal === "letters") { const m = digMap(p, s); lines.push(`${p.rows[0]} + ${p.rows[1]} = ${p.rows[2]}`, lettersOf(p.rows).map((l) => `${l}=${m[l] >= 0 ? m[l] : "?"}`).join(" ")); }
  if (p.goal === "reach") lines.push(`target: ${p.P}`, `start: ${s.start || "–"}`);
  return { title: "Paheli", lines };
}
function grade(level: PlayLevel<PaheliParams>, acts: PlayActEnvelope<PaheliAct>[]): PlayGrade {
  return gradeLevel(paheliLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const paheliLogic: FamilyLogic<PaheliParams, PaheliState, PaheliAct> = {
  family: "paheli", modes: ["pairs", "magic", "cipher", "mirror"], malRules: PAHELI_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
