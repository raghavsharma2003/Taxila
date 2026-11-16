// Koshtak (कोष्ठक, "bracket") · round 7, expressions: terms, brackets, the order of evaluation and simplifying (class 7).
// Nothing runs on a clock: every wall, lid, jump and card moves on the child's touch, and the law answers only on "run".
// One law per goal, each a real thing:
//   tray/terms  a row of numbers joined by + − × (23 − 4 × 3 + 6) stands on trays. The child snaps tray walls into the gaps.
//               On "run" the counter works each tray out on its own (left to right inside it), then joins the trays' values
//               left to right by the signs at the walls. The counter's total must be what the expression is worth, and the
//               level is built so that ONLY walls at the + and − gaps make it (so a wall IS splitting into terms)
//   tray/lid    the same kind of row and a value it must make; the child puts ONE lid (a bracket) over a run of numbers.
//               On "run" the lid's inside is worked out first, then the row as usual (terms first, then + and −); the
//               level is built so exactly one lid makes the value
//   tray/open   a − (b ± c …) ± d: the bracket is opened; its numbers fall onto the row as jumps along a number line, each
//               with the direction it had when written (the minus before the bracket stays on the first one). The child
//               turns jumps forward / back. On "run" two walks go: the bracketed one (the bracket as ONE big jump back)
//               and the child's opened one; they must land on the same number (built so only the true signs do)
//   bin/like    term cards with their signs printed (+5x, +3y, +2x, −y, +4) lie on a belt, and empty bins wait. The child
//               puts cards into bins. On "run" each bin tries to close into ONE term: cards with the same letter part
//               stack (their numbers add, a lone letter counting as one of it); cards with different letter parts cannot
//               stack, so the lid stays open. Then the shelf and the belt's expression are tried with numbers for the
//               letters (the pans must stay level for every try). Every card in a bin, every bin closed, one bin per kind
// Mal-rules (each a deterministic set-up; a level serves one only where it differs from the answer):
//   left-to-right     terms: one tray per number (the counter goes strictly left to right: 3 + 4 × 2 → 14);
//                     lid: no lid at all, where left to right would make the value (the row read 6 + 4 × 3 → 30)
//   minus-first-only  open: no jump turned (the minus taken by the first number only: 90 − (25 + 15) → 90 − 25 + 15)
//   unlike-combine    like: every letter card in one bin and the numbers in another (3a + 2b as one term, 5x + 2 as one)
//   lone-letter       like: every lone-letter card (k, −m) left on the belt as if it were nothing (6k − k → 6k)
import type { Candidate, Facts, FamilyLogic, GenRequest, KoshtakAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type KoshtakMode = "tray" | "bin";
export type KoshtakGoal = "terms" | "lid" | "open" | "like";
export type Op = "+" | "−" | "×";
/** a term card: its signed number part and its letter part ("" = a plain number) */
export interface Term { c: number; v: string }
export interface KoshtakParams {
  goal: KoshtakGoal;
  /** the fade: 1 every sign coloured by what it does and the trays / jumps drawn out · 2 fewer marks · 3 plain symbols */
  face: 1 | 2 | 3;
  /** tray: the numbers and the signs between them (ops[i] sits between n[i] and n[i + 1]); like: [] */
  n: number[]; ops: Op[];
  /** lid: the value the row must make; else 0 */
  target: number;
  /** open: the bracket's first and last number (the sign before it is −); else null */
  br: [number, number] | null;
  /** like: the cards as written; else [] */
  cards: Term[];
}
export interface KoshtakState extends Undoable<KoshtakState> {
  /** terms: the gaps that hold a wall, ascending */
  walls: number[];
  /** lid: the lid's first and last number, or null */
  lid: [number, number] | null;
  /** open: the gaps whose jump the child has turned, ascending */
  flips: number[];
  /** like: the bin each card is in (−1 = still on the belt) */
  where: number[];
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const KOSHTAK_MAL = ["left-to-right", "minus-first-only", "unlike-combine", "lone-letter"] as const;
const MAL_OF: Record<KoshtakGoal, readonly string[]> = { terms: ["left-to-right"], lid: ["left-to-right"], open: ["minus-first-only"], like: ["unlike-combine", "lone-letter"] };
const GOALS_OF: Record<KoshtakMode, readonly KoshtakGoal[]> = { tray: ["terms", "lid", "open"], bin: ["like"] };
export const MAX_BINS = 5;
const LETTER_PARTS = ["", "a", "b", "k", "m", "n", "p", "q", "x", "y", "ab", "mn", "pq", "xy"] as const;

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const isOp = (x: unknown): x is Op => x === "+" || x === "−" || x === "×";
const opOn = (a: number, op: Op, b: number) => (op === "+" ? a + b : op === "−" ? a - b : a * b);

// ───────────────────────────── the counter's arithmetic ─────────────────────────────
/** strictly left to right, every sign in the order written */
export function leftToRight(n: readonly number[], ops: readonly Op[]): number {
  let v = n[0];
  for (let i = 1; i < n.length; i++) v = opOn(v, ops[i - 1], n[i]);
  return v;
}
/** what the row is worth: split at + and −, each term's products first, then the terms added / taken left to right */
export function worth(n: readonly number[], ops: readonly Op[]): number {
  let total = 0, sign = 1, term = n[0];
  for (let i = 1; i < n.length; i++) {
    const op = ops[i - 1];
    if (op === "×") term *= n[i];
    else { total += sign * term; sign = op === "+" ? 1 : -1; term = n[i]; }
  }
  return total + sign * term;
}
/** the trays a wall set makes: [first, last] number of each tray */
export function traysOf(len: number, walls: readonly number[]): [number, number][] {
  const out: [number, number][] = []; let at = 0;
  for (const g of [...walls].sort((x, y) => x - y)) { out.push([at, g]); at = g + 1; }
  out.push([at, len - 1]);
  return out;
}
/** the counter's total for a wall set: each tray left to right on its own, then the trays joined left to right */
export function trayTotal(n: readonly number[], ops: readonly Op[], walls: readonly number[]): number {
  const trays = traysOf(n.length, walls);
  const val = trays.map(([a, b]) => leftToRight(n.slice(a, b + 1), ops.slice(a, b)));
  let v = val[0];
  for (let t = 1; t < trays.length; t++) v = opOn(v, ops[trays[t][0] - 1], val[t]);
  return v;
}
/** the gaps where the terms meet (every + and −) */
export const termGaps = (ops: readonly Op[]) => ops.map((o, i) => (o === "×" ? -1 : i)).filter((i) => i >= 0);
/** the row's value with a lid over numbers [a, b] (the inside first), or without one */
export function lidValue(n: readonly number[], ops: readonly Op[], lid: readonly [number, number] | null): number {
  if (!lid) return worth(n, ops);
  const [a, b] = lid, inner = worth(n.slice(a, b + 1), ops.slice(a, b));
  return worth([...n.slice(0, a), inner, ...n.slice(b + 1)], [...ops.slice(0, a), ...ops.slice(b)]);
}
/** every lid a row can take: a run of two or more numbers, never the whole row */
export function lidsOf(len: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 0; a < len; a++) for (let b = a + 1; b < len; b++) if (!(a === 0 && b === len - 1)) out.push([a, b]);
  return out;
}
/** open: the opened row's signs once the child's turns are made (the written signs, the bracket dropped) */
export const openedOps = (ops: readonly Op[], flips: readonly number[]): Op[] => ops.map((o, i) => (flips.includes(i) ? (o === "+" ? "−" : "+") : o));
/** open: what the bracketed row is worth (the bracket worked out first) */
export const bracketValue = (p: Pick<KoshtakParams, "n" | "ops" | "br">) => lidValue(p.n, p.ops, p.br);
/** open: the gaps inside the bracket (the jumps the minus turns) */
export const innerGaps = (br: readonly [number, number]) => Array.from({ length: br[1] - br[0] }, (_, k) => br[0] + k);
/** every subset of 0..k−1 (k ≤ 6) */
function subsets(k: number): number[][] {
  const out: number[][] = [];
  for (let m = 0; m < 1 << k; m++) out.push(Array.from({ length: k }, (_, i) => i).filter((i) => (m >> i) & 1));
  return out;
}
const sameList = (x: readonly number[], y: readonly number[]) => x.length === y.length && x.every((v, i) => v === y[i]);
const sameLid = (x: readonly number[] | null, y: readonly number[] | null) => (!x && !y) || (!!x && !!y && x[0] === y[0] && x[1] === y[1]);

// ───────────────────────────── like terms ─────────────────────────────
/** a term as written: 7x, −y, x, 4, −3ab (no sign for a positive one unless `signed`) */
export function termText(t: Term, signed = false): string {
  const mag = Math.abs(t.c), body = t.v ? `${mag === 1 ? "" : mag}${t.v}` : String(mag);
  return t.c < 0 ? `−${body}` : signed ? `+${body}` : body;
}
/** an expression from terms: 7x + 2y − 3 */
export function exprText(ts: readonly Term[]): string {
  if (!ts.length) return "0";
  return ts.map((t, i) => (i === 0 ? termText(t) : `${t.c < 0 ? "−" : "+"} ${termText({ ...t, c: Math.abs(t.c) })}`)).join(" ");
}
/** the kinds (letter parts) in the order they first appear */
export const kindsOf = (cards: readonly Term[]) => [...new Set(cards.map((t) => t.v))];
/** the bins a like level offers: one per kind and a spare (at most MAX_BINS) */
export const binsOf = (p: Pick<KoshtakParams, "cards">) => Math.min(MAX_BINS, kindsOf(p.cards).length + 1);
/** the simplest form: one term per kind, in the order the kinds first appear */
export function simplest(cards: readonly Term[]): Term[] {
  return kindsOf(cards).map((v) => ({ v, c: cards.filter((t) => t.v === v).reduce((s, t) => s + t.c, 0) }));
}
/** a lone letter: a letter term whose number part is one (k, −m) */
export const isLone = (t: Term) => t.v !== "" && Math.abs(t.c) === 1;
/** what one bin closes into: one term when every card in it has the same letter part, else null (the lid stays open) */
export function binTerm(cards: readonly Term[], where: readonly number[], bin: number): Term | null {
  const inIt = cards.filter((_, i) => where[i] === bin);
  if (!inIt.length || inIt.some((t) => t.v !== inIt[0].v)) return null;
  return { v: inIt[0].v, c: inIt.reduce((s, t) => s + t.c, 0) };
}
/** the value of terms for letter values (a letter part's letters multiplied) */
export function termsValue(ts: readonly Term[], vals: Record<string, number>): number {
  return ts.reduce((s, t) => s + t.c * [...t.v].reduce((m, ch) => m * (vals[ch] ?? 0), 1), 0);
}
/** the letter values the run tries (fixed per level: 1, 2, 3 … shifted per letter so no two letters agree) */
export function triesOf(cards: readonly Term[]): Record<string, number>[] {
  const letters = [...new Set(cards.flatMap((t) => [...t.v]))].sort();
  return [0, 1, 2].map((k) => Object.fromEntries(letters.map((ch, i) => [ch, ((k * 2 + i * 3) % 7) + 1 + k])));
}

// ───────────────────────────── the set-up and its judgement ─────────────────────────────
/** what the child commits before the run */
export interface Setup { walls?: number[]; lid?: [number, number] | null; flips?: number[]; where?: number[] }
const setupOf = (p: KoshtakParams, s: KoshtakState): Setup =>
  p.goal === "terms" ? { walls: s.walls } : p.goal === "lid" ? { lid: s.lid } : p.goal === "open" ? { flips: s.flips } : { where: s.where };
/** the value the run makes from a set-up (tray goals) */
export function madeOf(p: KoshtakParams, su: Setup): number {
  if (p.goal === "terms") return trayTotal(p.n, p.ops, su.walls ?? []);
  if (p.goal === "lid") return lidValue(p.n, p.ops, su.lid ?? null);
  if (p.goal === "open") return leftToRight(p.n, openedOps(p.ops, su.flips ?? []));
  return 0;
}
/** what the run must make (tray goals) */
export function want(p: KoshtakParams): number {
  if (p.goal === "terms") return worth(p.n, p.ops);
  if (p.goal === "lid") return p.target;
  if (p.goal === "open") return bracketValue(p);
  return 0;
}
/** like: is the shelf the simplest form? every card binned, every bin one kind, no kind in two bins */
export function shelfOk(p: KoshtakParams, where: readonly number[]): boolean {
  if (where.some((b) => b < 0)) return false;
  const kinds: string[] = [];
  for (let b = 0; b < binsOf(p); b++) {
    if (!where.includes(b)) continue;
    const t = binTerm(p.cards, where, b);
    if (!t || kinds.includes(t.v)) return false;
    kinds.push(t.v);
  }
  return true;
}
/** THE judgement of a run */
export function judge(p: KoshtakParams, su: Setup): boolean {
  if (p.goal === "like") return shelfOk(p, su.where ?? []);
  return madeOf(p, su) === want(p);
}

/** the like solution: each card into the bin of its kind (kinds in the order they first appear) */
const likeWhere = (p: KoshtakParams, skip: (t: Term) => boolean = () => false) => { const ks = kindsOf(p.cards); return p.cards.map((t) => (skip(t) ? -1 : ks.indexOf(t.v))); };
function rawMal(p: KoshtakParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  switch (mal) {
    case "left-to-right":
      if (p.goal === "terms") return { walls: p.ops.map((_, i) => i) };
      return leftToRight(p.n, p.ops) === p.target ? { lid: null } : null;
    case "minus-first-only": return { flips: [] };
    // every letter card in bin 0 (two letter kinds at least, so the bin is mixed), the plain numbers in bin 1
    case "unlike-combine": return { where: p.cards.map((t) => (t.v ? 0 : 1)) };
    case "lone-letter": return p.cards.some(isLone) ? { where: likeWhere(p, isLone) } : null;
  }
  return null;
}
/** like: the belief a run's shelf shows, or null */
function likeBelief(p: KoshtakParams, where: readonly number[]): string | null {
  if (where.every((b) => b < 0)) return null;
  const used = [...new Set(where.filter((b) => b >= 0))];
  if (where.every((b) => b >= 0) && used.some((b) => !binTerm(p.cards, where, b))) return "unlike-combine";
  if (used.every((b) => binTerm(p.cards, where, b))) {
    const left = p.cards.filter((_, i) => where[i] < 0);
    const kinds = used.map((b) => binTerm(p.cards, where, b)!.v);
    if (left.length && left.every(isLone) && new Set(kinds).size === kinds.length && p.cards.every((t, i) => where[i] >= 0 || isLone(t))) return "lone-letter";
  }
  return null;
}
/** like: one card from the simplest form (one card still on the belt, or one kind in two bins; every bin closes) */
function likeNear(p: KoshtakParams, where: readonly number[]): boolean {
  const used = [...new Set(where.filter((b) => b >= 0))], terms = used.map((b) => binTerm(p.cards, where, b));
  if (terms.some((t) => !t)) return false;
  const kinds = new Set(terms.map((t) => t!.v)).size, left = where.filter((b) => b < 0).length;
  return (left === 1 && kinds === used.length) || (left === 0 && used.length === kinds + 1);
}
/** does this run's set-up show the belief `mal`? */
function shows(p: KoshtakParams, su: Setup, mal: string): boolean {
  const m = rawMal(p, mal);
  if (!m) return false;
  if (p.goal === "like") return likeBelief(p, su.where ?? []) === mal;
  if (p.goal === "lid") return sameLid(su.lid ?? null, null);
  return madeOf(p, su) === madeOf(p, m);
}
function legal(p: KoshtakParams, su: Setup): boolean {
  if (p.goal === "terms") return (su.walls ?? []).every((g) => isInt(g) && g >= 0 && g < p.ops.length);
  if (p.goal === "lid") return !su.lid || lidsOf(p.n.length).some((l) => sameLid(l, su.lid!));
  if (p.goal === "open") return (su.flips ?? []).every((g) => isInt(g) && g >= 0 && g < p.ops.length);
  return (su.where ?? []).length === p.cards.length && (su.where ?? []).some((b) => b >= 0) && (su.where ?? []).every((b) => isInt(b) && b >= -1 && b < binsOf(p));
}
/** The set-up a child holding `mal` commits, or null (no reading here, not legal, or it would solve) */
export function malSetup(p: KoshtakParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  // a signature names ONE belief: another of the goal's beliefs may not show on the same set-up
  for (const other of MAL_OF[p.goal]) if (other !== mal && shows(p, m, other)) return null;
  return m;
}

/** the values the teacher may not say before the child makes them: the row's worth, the lid's run of numbers, the
 *  bracket's worth and its opened row, the simplest form */
export function koshtakHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as KoshtakParams | null;
  if (!p || typeof p.goal !== "string") return [];
  try {
    if (p.goal === "terms") return [String(worth(p.n, p.ops))];
    if (p.goal === "lid") {
      const l = lidsOf(p.n.length).find((x) => lidValue(p.n, p.ops, x) === p.target);
      return l ? [rowText(p.n.slice(l[0], l[1] + 1), p.ops.slice(l[0], l[1]))] : [];
    }
    if (p.goal === "open" && p.br) return [String(bracketValue(p)), rowText(p.n, openedOps(p.ops, innerGaps(p.br)))];
    if (p.goal === "like") return [exprText(simplest(p.cards))];
  } catch { /* a malformed level hides nothing */ }
  return [];
}
/** a row as written: 23 − 4 × 3 + 6 */
export const rowText = (n: readonly number[], ops: readonly Op[]) => n.map((x, i) => (i ? `${ops[i - 1]} ${x}` : String(x))).join(" ");

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── validation (the same rules the generator builds by) ─────────────────────────────
/** the wall sets that make the row's worth: must be only the + / − gaps */
function termsUnique(n: number[], ops: Op[]): boolean {
  const w = worth(n, ops), right = termGaps(ops);
  return subsets(ops.length).every((ws) => sameList(ws, right) === (trayTotal(n, ops, ws) === w));
}
/** the lids that make the target: exactly one */
const lidHits = (n: number[], ops: Op[], target: number) => lidsOf(n.length).filter((l) => lidValue(n, ops, l) === target);
/** the turn sets that land the opened walk on the bracket's worth: only the inside gaps */
function openUnique(p: Pick<KoshtakParams, "n" | "ops" | "br">): boolean {
  const w = bracketValue(p), right = innerGaps(p.br!);
  return subsets(p.ops.length).every((fs) => sameList(fs, right) === (leftToRight(p.n, openedOps(p.ops, fs)) === w));
}
function validate(level: PlayLevel<unknown>): PlayLevel<KoshtakParams> | null {
  const p = level.params as Partial<KoshtakParams> | null, mode = level.mode as KoshtakMode;
  if (!p || !GOALS_OF[mode] || !GOALS_OF[mode].includes(p.goal as KoshtakGoal)) return null;
  const goal = p.goal as KoshtakGoal;
  const face = p.face === 1 || p.face === 2 || p.face === 3 ? p.face : 0;
  if (!face || !Array.isArray(p.n) || !Array.isArray(p.ops) || !Array.isArray(p.cards)) return null;
  const n = p.n, ops = p.ops, cards = p.cards, target = p.target ?? 0, br = p.br ?? null;
  const out = (params: KoshtakParams) => ({ ...level, params }) as PlayLevel<KoshtakParams>;
  if (goal === "like") {
    if (n.length || ops.length || target !== 0 || br !== null) return null;
    if (cards.length < 4 || cards.length > 7) return null;
    for (const t of cards) if (!t || !isInt(t.c) || t.c === 0 || Math.abs(t.c) > 12 || !(LETTER_PARTS as readonly string[]).includes(t.v)) return null;
    const ks = kindsOf(cards), letters = ks.filter((v) => v);
    // a positive first card; two letter kinds at least; some kind of two cards or more; no kind adds to nothing; the bins fit
    if (cards[0].c < 0 || letters.length < 2 || ks.length + 1 > MAX_BINS) return null;
    if (!ks.some((v) => cards.filter((t) => t.v === v).length >= 2)) return null;
    if (simplest(cards).some((t) => t.c === 0)) return null;
    return out({ goal, face, n: [], ops: [], target: 0, br: null, cards: cards.map((t) => ({ c: t.c, v: t.v })) });
  }
  if (cards.length || n.length < 3 || n.length > 5 || ops.length !== n.length - 1 || !ops.every(isOp)) return null;
  if (!n.every((x) => isInt(x) && x >= 1 && x <= 99)) return null;
  if (goal === "terms") {
    // a × and a + / − both; the products are small facts; the worth never below zero; only the term walls make it
    if (target !== 0 || br !== null || !ops.includes("×") || termGaps(ops).length === 0) return null;
    if (ops.some((o, i) => o === "×" && (n[i] > 12 || n[i + 1] > 12))) return null;
    const w = worth(n, ops);
    if (w < 0 || w > 999 || leftToRight(n, ops) === w || !termsUnique(n, ops)) return null;
    return out({ goal, face, n: [...n], ops: [...ops], target: 0, br: null, cards: [] });
  }
  if (goal === "lid") {
    // 3 or 4 numbers; the target from exactly one lid, never the row's own worth
    if (br !== null || n.length > 4 || !isInt(target) || target < 0 || target > 999) return null;
    if (ops.some((o, i) => o === "×" && (n[i] > 12 || n[i + 1] > 12))) return null;
    if (worth(n, ops) === target || lidHits(n, ops, target).length !== 1) return null;
    return out({ goal, face, n: [...n], ops: [...ops], target, br: null, cards: [] });
  }
  // open: only + and −; a − right before the bracket; the bracket two numbers or three, never the first number; the
  // bracket and every walk position never below zero; only the true turns land the walk on the bracket's worth
  if (target !== 0 || !Array.isArray(br) || br.length !== 2 || !isInt(br[0]) || !isInt(br[1])) return null;
  if (ops.includes("×") || br[0] < 1 || br[1] <= br[0] || br[1] > n.length - 1 || br[1] - br[0] > 2 || ops[br[0] - 1] !== "−") return null;
  const q = { n, ops, br: [br[0], br[1]] as [number, number] };
  const inner = worth(n.slice(br[0], br[1] + 1), ops.slice(br[0], br[1]));
  if (inner <= 0 || bracketValue(q) < 0) return null;
  const right = openedOps(ops, innerGaps(q.br));
  const bn = [...n.slice(0, br[0]), inner, ...n.slice(br[1] + 1)], bo = [...ops.slice(0, br[0]), ...ops.slice(br[1])];
  for (let i = 1; i <= n.length; i++) if (leftToRight(n.slice(0, i), right.slice(0, i - 1)) < 0) return null;
  for (let i = 1; i <= bn.length; i++) if (leftToRight(bn.slice(0, i), bo.slice(0, i - 1)) < 0) return null;
  if (!openUnique(q)) return null;
  return out({ goal, face, n: [...n], ops: [...ops], target: 0, br: q.br, cards: [] });
}

function init(level: PlayLevel<KoshtakParams>): KoshtakState {
  return { walls: [], lid: null, flips: [], where: level.params.cards.map(() => -1), ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}
const toggle = (xs: readonly number[], x: number) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x].sort((a, b) => a - b));

function apply(level: PlayLevel<KoshtakParams>, s: KoshtakState, act: KoshtakAct, seq: number): { state: KoshtakState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: KoshtakState): KoshtakState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const change = (patch: Partial<KoshtakState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  const gapOk = (g: number) => isInt(g) && g >= 0 && g < p.ops.length;
  switch (act.kind) {
    case "wall": {
      if (p.goal !== "terms") return no("no_wall");
      const g = Number(act.at);
      if (!gapOk(g)) return no("bad_gap");
      return change({ walls: toggle(s.walls, g) });
    }
    case "lid": {
      if (p.goal !== "lid") return no("no_lid");
      const a = Number(act.from), b = Number(act.to);
      const l: [number, number] = [Math.min(a, b), Math.max(a, b)];
      if (!isInt(a) || !isInt(b) || !lidsOf(p.n.length).some((x) => sameLid(x, l))) return no("bad_lid");
      return change({ lid: sameLid(s.lid, l) ? null : l });
    }
    case "flip": {
      if (p.goal !== "open") return no("no_jump");
      const g = Number(act.at);
      if (!gapOk(g)) return no("bad_gap");
      return change({ flips: toggle(s.flips, g) });
    }
    case "bin": {
      if (p.goal !== "like") return no("no_bin");
      const i = Number(act.card), b = Number(act.to);
      if (!isInt(i) || i < 0 || i >= p.cards.length || !isInt(b) || b < -1 || b >= binsOf(p)) return no("bad_bin");
      if (s.where[i] === b) return no("same_bin");
      const where = [...s.where]; where[i] = b;
      return change({ where });
    }
    case "run": {
      if (s.ended) return no("change_first");
      if (p.goal === "like" && s.where.every((b) => b < 0)) return no("bin_first");
      const su = setupOf(p, s), runs = s.runs + 1, ok = judge(p, su);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: p.goal, run: runs };
      if (p.goal !== "like") f.made = madeOf(p, su);
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) {
        if (malSetup(p, mal) && shows(p, su, mal)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      // near: one wall / one turn off; a lid one number off at one end; the shelf one card from the simplest form
      const sol = solveSetup(p);
      const off = (x: readonly number[], y: readonly number[]) => x.filter((v) => !y.includes(v)).length + y.filter((v) => !x.includes(v)).length;
      const near = p.goal === "terms" ? off(s.walls, sol.walls!) === 1
        : p.goal === "open" ? off(s.flips, sol.flips!) === 1
        : p.goal === "lid" ? !!s.lid && !!sol.lid && Math.abs(s.lid[0] - sol.lid[0]) + Math.abs(s.lid[1] - sol.lid[1]) === 1
        : likeNear(p, s.where);
      out.push(mom(near ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<KoshtakParams>, s: KoshtakState) => s.done;

/** the set-up that solves the level */
function solveSetup(p: KoshtakParams): Setup {
  if (p.goal === "terms") return { walls: termGaps(p.ops) };
  if (p.goal === "lid") return { lid: lidHits(p.n, p.ops, p.target)[0] ?? null };
  if (p.goal === "open") return { flips: p.br ? innerGaps(p.br) : [] };
  return { where: likeWhere(p) };
}
/** the acts that commit a set-up from the level's start, then run */
export function setupActs(p: KoshtakParams, su: Setup): KoshtakAct[] {
  const acts: KoshtakAct[] = [];
  if (p.goal === "terms") for (const g of su.walls ?? []) acts.push({ kind: "wall", at: g });
  if (p.goal === "lid" && su.lid) acts.push({ kind: "lid", from: su.lid[0], to: su.lid[1] });
  if (p.goal === "open") for (const g of su.flips ?? []) acts.push({ kind: "flip", at: g });
  if (p.goal === "like") (su.where ?? []).forEach((b, i) => { if (b >= 0) acts.push({ kind: "bin", card: i, to: b }); });
  acts.push({ kind: "run" });
  return acts;
}
function solve(level: PlayLevel<KoshtakParams>): KoshtakAct[] | null {
  const p = level.params, su = solveSetup(p);
  if (p.goal === "lid" && !su.lid) return null;
  return judge(p, su) ? setupActs(p, su) : null;
}
/**
 * Set-ups that win without the idea: no walls / a wall in every gap / walls only at the × gaps; no lid; no jump turned,
 * every jump turned, or only the one before the bracket; every card in one bin, each card in its own bin, the cards in
 * order filling the bins. A level any of them solves is never served.
 */
export function shortcutActs(p: KoshtakParams): KoshtakAct[][] {
  const all = (k: number) => Array.from({ length: k }, (_, i) => i);
  if (p.goal === "terms") return [[], all(p.ops.length), p.ops.map((o, i) => (o === "×" ? i : -1)).filter((i) => i >= 0)].map((walls) => setupActs(p, { walls }));
  if (p.goal === "lid") return [setupActs(p, { lid: null })];
  if (p.goal === "open") return [[], all(p.ops.length), p.br ? [p.br[0] - 1] : []].map((flips) => setupActs(p, { flips }));
  const B = binsOf(p);
  return [p.cards.map(() => 0), p.cards.map((_, i) => Math.min(i, B - 1)), p.cards.map((_, i) => i % B)].map((where) => setupActs(p, { where }));
}
function replayDone(level: PlayLevel<KoshtakParams>, acts: KoshtakAct[]): boolean {
  let s = init(level);
  for (const a of acts) s = apply(level, s, a, 1).state;
  return s.done;
}
function shortcut(level: PlayLevel<KoshtakParams>): KoshtakAct[] | null {
  for (const t of shortcutActs(level.params)) if (replayDone(level, t)) return t;
  return null;
}
function malActs(level: PlayLevel<KoshtakParams>, mal: string): KoshtakAct[] | null {
  const m = malSetup(level.params, mal);
  return m ? setupActs(level.params, m) : null;
}

// ───────────────────────────── the generator ─────────────────────────────
interface KoshtakGrammar {
  /** tray: how many numbers in the row (lo, hi) */
  len?: [number, number];
  /** like: how many letter kinds (lo, hi) and cards (lo, hi) */
  kinds?: [number, number]; cards?: [number, number];
}
const LETTER_SETS: readonly (readonly string[])[] = [["x", "y"], ["a", "b"], ["m", "n"], ["p", "q"], ["x", "xy"], ["a", "ab"], ["k", "m"]];
function difficultyOf(p: KoshtakParams): number {
  const f = 0.06 * (p.face - 1);
  if (p.goal === "like") return Math.min(1, 0.3 + f + 0.05 * p.cards.length + (p.cards.some((t) => t.v.length > 1) ? 0.1 : 0));
  return Math.min(1, 0.2 + f + 0.08 * p.n.length + (p.goal === "open" ? 0.1 : p.goal === "lid" ? 0.05 : 0));
}
function generate(req: GenRequest): Candidate<KoshtakParams>[] {
  const g = req.grammar as KoshtakGrammar;
  const mode = (["tray", "bin"] as const).find((m) => m === req.mode) ?? "tray";
  const goal = (GOALS_OF[mode].includes(req.goal as KoshtakGoal) ? req.goal : GOALS_OF[mode][0]) as KoshtakGoal;
  const rnd = mulberry32(req.seed), out: Candidate<KoshtakParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const face = req.fade as 1 | 2 | 3;
  const mk = (params: KoshtakParams, sig: string): Candidate<KoshtakParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `koshtak-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "koshtak", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "koshtak", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const [llo, lhi] = g.len ?? (goal === "lid" ? [3, 4] : [3, 5]);
  const lenLo = Math.max(3, llo), lenHi = Math.min(goal === "lid" ? 4 : 5, Math.max(lenLo, lhi));
  for (let k = 0; k < 220 && out.length < 24; k++) {
    let params: KoshtakParams | null = null, sig = "";
    if (goal === "like") {
      const [klo, khi] = g.kinds ?? [2, 3], [clo, chi] = g.cards ?? [4, 6];
      const letters = pickOf(LETTER_SETS), nk = int(Math.max(2, klo), Math.min(3, khi));
      // the kinds: two letter kinds, and a plain number as the third kind when three are asked
      const ks = nk >= 3 ? [...letters, ""] : [...letters];
      const nc = int(Math.max(4, clo, ks.length + 1), Math.min(7, chi));
      const cards: Term[] = ks.map((v) => ({ v, c: int(1, 9) }));
      while (cards.length < nc) {
        const v = pickOf(ks);
        // a lone letter most times (k, −m), else a number part 2..9; signs mixed
        const c = v && rnd() < 0.45 ? 1 : int(2, 9);
        cards.push({ v, c: rnd() < 0.45 ? -c : c });
      }
      // shuffle, so like cards are not side by side; the first card positive
      for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
      const first = cards.findIndex((t) => t.c > 0);
      if (first < 0) continue;
      [cards[0], cards[first]] = [cards[first], cards[0]];
      params = { goal, face, n: [], ops: [], target: 0, br: null, cards };
      sig = `like:${cards.map((t) => termText(t, true)).join("")}`;
    } else {
      const len = int(lenLo, lenHi);
      if (goal === "open") {
        // a − (b ± c [± d]) [± e]: the bracket after the first number (or a second one), a big start so the walk stays up
        const inner = int(2, Math.min(3, len - 1));
        const start = int(1, len - inner);
        const n: number[] = [], ops: Op[] = [];
        for (let i = 0; i < len; i++) n.push(i === 0 ? int(40, 99) : int(2, 30));
        for (let i = 0; i < len - 1; i++) ops.push(i === start - 1 ? "−" : rnd() < 0.5 ? "+" : "−");
        params = { goal, face, n, ops, target: 0, br: [start, start + inner - 1], cards: [] };
      } else {
        // + − × rows: a × in one place at least and a + / − in another; products of small facts
        const ops: Op[] = Array.from({ length: len - 1 }, () => pickOf(["+", "−", "×"] as const));
        if (!ops.includes("×")) ops[int(0, len - 2)] = "×";
        if (!ops.some((o) => o !== "×")) ops[int(0, len - 2)] = pickOf(["+", "−"] as const);
        const n = Array.from({ length: len }, (_, i) => (ops[i - 1] === "×" || ops[i] === "×" ? int(2, 9) : int(2, goal === "lid" ? 20 : 40)));
        let target = 0;
        if (goal === "lid") {
          // the target: left to right half the time (where the belief reads the row), else any one lid's value
          const lids = lidsOf(len);
          target = rnd() < 0.4 ? leftToRight(n, ops) : lidValue(n, ops, pickOf(lids));
        }
        params = { goal, face, n, ops, target, br: null, cards: [] };
      }
      sig = `${goal}:${rowText(params.n, params.ops)}${params.br ? `:${params.br.join("-")}` : ""}${goal === "lid" ? `=${params.target}` : ""}`;
    }
    if (seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig);
    const v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push({ ...cand, level: v });
  }
  return out;
}

function facts(level: PlayLevel<KoshtakParams>, s: KoshtakState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (p.goal === "terms") f.trays = s.walls.length + 1;
  if (p.goal === "lid") { f.target = p.target; if (s.lid) f.lid = rowText(p.n.slice(s.lid[0], s.lid[1] + 1), p.ops.slice(s.lid[0], s.lid[1])); }
  if (p.goal === "open") f.turned = s.flips.length;
  if (p.goal === "like") { f.binned = s.where.filter((b) => b >= 0).length; f.cards = p.cards.length; }
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<KoshtakParams>, s: KoshtakState) {
  const p = level.params, lines: string[] = [];
  if (p.goal === "terms") lines.push(`row: ${rowText(p.n, p.ops)}`, `trays: ${traysOf(p.n.length, s.walls).map(([a, b]) => `[${rowText(p.n.slice(a, b + 1), p.ops.slice(a, b))}]`).join(" ")}`);
  if (p.goal === "lid") lines.push(`row: ${rowText(p.n, p.ops)}`, `make: ${p.target}`, `lid: ${s.lid ? rowText(p.n.slice(s.lid[0], s.lid[1] + 1), p.ops.slice(s.lid[0], s.lid[1])) : "–"}`);
  if (p.goal === "open" && p.br) {
    const [a, b] = p.br;
    lines.push(`row: ${rowText(p.n.slice(0, a), p.ops.slice(0, a - 1))} − (${rowText(p.n.slice(a, b + 1), p.ops.slice(a, b))})${b < p.n.length - 1 ? ` ${rowText(p.n.slice(b), p.ops.slice(b)).replace(/^\d+ /, "")}` : ""}`);
    lines.push(`opened: ${rowText(p.n, openedOps(p.ops, s.flips))}`);
  }
  if (p.goal === "like") {
    lines.push(`cards: ${exprText(p.cards)}`);
    for (let b = 0; b < binsOf(p); b++) { const inIt = p.cards.filter((_, i) => s.where[i] === b); if (inIt.length) lines.push(`bin ${b + 1}: ${inIt.map((t) => termText(t, true)).join(" ")}`); }
  }
  return { title: "Koshtak", lines };
}
function grade(level: PlayLevel<KoshtakParams>, acts: PlayActEnvelope<KoshtakAct>[]): PlayGrade {
  return gradeLevel(koshtakLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const koshtakLogic: FamilyLogic<KoshtakParams, KoshtakState, KoshtakAct> = {
  family: "koshtak", modes: ["tray", "bin"], malRules: KOSHTAK_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
