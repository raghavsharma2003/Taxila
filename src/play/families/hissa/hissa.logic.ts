// Hissa (हिस्सा, "a share, a part") · round 7, multiplying and dividing fractions and decimals (class 7). Nothing runs on a
// clock: every fold, shade, pour, slide and tag is the child's act, and the law answers only on "run". One law per goal,
// each a real thing (exact integer numerators and denominators throughout; the law never rounds):
//   fold/of     a unit sheet a/b × c/d: the child folds it into strips across and shades some (the first fraction), then into
//               strips down and takes some of the shaded part (the second); the overlap IS the product, and the child tags it
//               by counting: pieces taken twice over pieces in the whole sheet (any equal tag; the folds may be finer)
//   fold/times  w × a/b: w rope pieces, each a/b of a metre, laid end to end on a metre track marked in b parts; the child
//               lays them and tags the rope's whole length in metres (pieces of 1/b over b)
//   pour/fit    w litres ÷ a cup of c/d litre · pour/part a/b litre ÷ c/d · pour/deci a decimal jug ÷ a decimal glass: the
//               child first SAYS how many full cups the jug will fill (a committed count, before the first pour, held
//               until the run answers: games audit GAMES-08, pouring to the brim was the whole answer), then pours full cups
//               one at a time (the jug refuses a cup it cannot fill) and tags the part-cup that is left as a fraction OF A
//               CUP; on "run" the rest goes into the last cup: the count said must be the cups that fit, the jug must be
//               empty and the tag must be what that cup holds. Pouring alone never wins: the count is what is graded
//   grid/mul    a/10 × c/10 on a grid of units cut in tenths: the child shades a tenths across and c tenths down; the overlap's
//               small squares (hundredths) are counted onto a label and the child slides the decimal point into place
//   grid/shift  × / ÷ 10, 100, 1000 (and × 0.1, 0.01): the digits sit on a place-value chart and the child slides them,
//               one place per push (the point stays put); a zero may be written at the end (it moves nothing)
//   story/rest  a bar (₹ or a ribbon) of w: the first spend is a/b of it; then c/d of WHAT IS LEFT: the child folds the
//               whole bar and shades the first spend, picks the bar the second fold lies on (the piece left, or the whole
//               bar again) and folds and shades it
//   story/scale a recipe uses a/b cup for c people; cook for d: the child folds the cup's amount into equal shares (one per
//               person it was for) and lays one share per person now eating
// Mal-rules (each a deterministic set-up; a level serves one only where it differs from every other one of the goal's):
//   keep-den       of: a shared denominator kept (2/5 × 3/5 tagged 6/5)
//   whole-both     times: the whole number multiplies the top and the bottom (3 × 2/5 tagged 6/15)
//   mult-bigger    times (a unit piece): the product taken as bigger (3 × 1/4 tagged 12)
//   div-smaller    fit: ÷ taken as making smaller, the cup count is jug × cup (6 ÷ 1/2 → 3 cups) · deci: jug × glass
//   no-flip        part: ÷ done as × (3/4 ÷ 1/2 → 3/8 of a cup)
//   flip-first     part: the first fraction flipped (2/3 ÷ 1/6 → 1/4)
//   div-half       deci: ÷ 0.5 taken as halving (10 ÷ 0.5 → 5)
//   scale-one      deci: only the glass scaled by 10 (4.8 ÷ 0.6 → 4.8 ÷ 6 = 0.8)
//   point-one      mul: one decimal place kept (0.3 × 0.2 → 0.6)
//   append-zero    shift: × 10 as a zero written at the end (3.45 → 3.450)
//   of-original    rest: the second fraction taken of the whole bar, not of what is left
//   scale-flip     scale: the shares folded for the new people and laid for the old (4/6 instead of 6/4)
import type { Candidate, Facts, FamilyLogic, GenRequest, HissaAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type HissaMode = "fold" | "pour" | "grid" | "story";
export type HissaGoal = "of" | "times" | "fit" | "part" | "deci" | "mul" | "shift" | "rest" | "scale";
export interface HissaParams {
  goal: HissaGoal;
  /** the fade: 1 every part marked and named · 2 marks, fewer names · 3 the sheet / jug / chart bare */
  face: 1 | 2 | 3;
  /** of: a/b × c/d · times: w × a/b · fit: w ÷ c/d · part: a/b ÷ c/d · deci: a/b ÷ c/d (b, d powers of 10) · mul: a/10 × c/10 ·
   *  shift: a / 10^b moved by 10^c (d = 1: shown as × 0.1 / 0.01) · rest: w, then a/b, then c/d of the rest · scale: a/b cup
   *  for c people, cook for d */
  a: number; b: number; c: number; d: number; w: number;
  /** story: which story (0..2); else 0 */
  ctx: number;
}
export interface HissaState extends Undoable<HissaState> {
  /** folds (parts) on side 0 / side 1 (1 = not folded) and the parts shaded / taken on each (mul: tenths across / down) */
  f: number[]; k: number[];
  /** rest: what the second fold lies on (0 not yet, 1 the piece left, 2 the whole bar) */
  on: number;
  /** times: rope pieces laid · scale: shares laid */
  lay: number;
  /** pour: full cups poured */
  cups: number;
  /** pour: the count of full cups the child said the jug will fill (−1 = not said); `lock`: a cup has been poured since it
   *  was said, so it stands (an undo keeps it) until a run answers */
  say: number; lock: boolean;
  /** the tag: top and bottom (bottom 0 = not set; top 0 = nothing) */
  tag: number[];
  /** shift: places slid (+ to the left, × 10 each); a zero written at the end */
  sh: number; zero: boolean;
  /** mul: the point's place counted from the right of the label's digits */
  pt: number;
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const HISSA_MAL = ["keep-den", "whole-both", "mult-bigger", "div-smaller", "no-flip", "flip-first", "div-half", "scale-one", "point-one", "append-zero", "of-original", "scale-flip"] as const;
const MAL_OF: Record<HissaGoal, readonly string[]> = {
  of: ["keep-den"], times: ["whole-both", "mult-bigger"], fit: ["div-smaller"], part: ["no-flip", "flip-first"],
  deci: ["div-half", "div-smaller", "scale-one"], mul: ["point-one"], shift: ["append-zero"], rest: ["of-original"], scale: ["scale-flip"],
};
export const GOALS_OF: Record<HissaMode, readonly HissaGoal[]> = { fold: ["of", "times"], pour: ["fit", "part", "deci"], grid: ["mul", "shift"], story: ["rest", "scale"] };
export const MAX_FOLD = 12, MAX_TAG = 99, MAX_LAY = 16, MAX_CUPS = 20, CHART_HI = 2, CHART_LO = -3;

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
export function gcd(x: number, y: number): number { x = Math.abs(x); y = Math.abs(y); while (y) [x, y] = [y, x % y]; return x || 1; }
/** an exact fraction n/d (d > 0), always reduced */
export interface Q { n: number; d: number }
export const q = (n: number, d = 1): Q => { const g = gcd(n, d), s = d < 0 ? -1 : 1; return { n: (s * n) / g, d: (s * d) / g }; };
export const qMul = (x: Q, y: Q) => q(x.n * y.n, x.d * y.d);
export const qDiv = (x: Q, y: Q) => q(x.n * y.d, x.d * y.n);
export const qSub = (x: Q, y: Q) => q(x.n * y.d - y.n * x.d, x.d * y.d);
export const qEq = (x: Q, y: Q) => x.n * y.d === y.n * x.d;
export const qLt = (x: Q, y: Q) => x.n * y.d < y.n * x.d;
export const qFloor = (x: Q) => Math.floor(x.n / x.d);
export const qStr = (x: Q) => (x.d === 1 ? String(x.n) : `${x.n}/${x.d}`);
/** decimal places of a power of ten (100 → 2); -1 when not one */
export const placesOf10 = (d: number) => { const s = String(d); return /^10*$/.test(s) ? s.length - 1 : -1; };
/** an exact decimal as text (n / 10^p), or null when it does not end within 6 places */
export function decStr(x: Q): string | null {
  const r = q(x.n, x.d);
  for (let pl = 0; pl <= 6; pl++) {
    const t = 10 ** pl;
    if (t % r.d !== 0) continue;
    const n = (r.n * t) / r.d, neg = n < 0, s = String(Math.abs(n)).padStart(pl + 1, "0");
    return (neg ? "-" : "") + (pl ? `${s.slice(0, s.length - pl)}.${s.slice(s.length - pl)}` : s);
  }
  return null;
}
/** the tag as a value: top 0 is nothing (0); a top with no bottom is not a value */
export const tagVal = (tag: readonly number[]): Q | null => (tag[0] === 0 ? q(0) : tag[1] > 0 ? q(tag[0], tag[1]) : null);

/** the jug and the cup (pour goals) */
export const jugOf = (p: HissaParams): Q => (p.goal === "fit" ? q(p.w) : q(p.a, p.b));
export const cupOf = (p: HissaParams): Q => q(p.c, p.d);
/** shift: the number on the chart and the move (× 10^c) */
export const shiftX = (p: HissaParams): Q => q(p.a, 10 ** p.b);
/** shift: the value the chart shows after sliding `sh` places */
export const shiftVal = (p: HissaParams, sh: number): Q => (p.b - sh >= 0 ? q(p.a, 10 ** (p.b - sh)) : q(p.a * 10 ** (sh - p.b)));
/** mul: grid units across / down */
export const unitsOf = (t: number) => Math.max(1, Math.ceil(t / 10));
/** rest: what is left after the first spend, and the second spend */
export const restLeft = (p: HissaParams): Q => qMul(q(p.w), q(p.b - p.a, p.b));

/** THE ANSWER: the value the run must show */
export function want(p: HissaParams): Q {
  switch (p.goal) {
    case "of": return q(p.a * p.c, p.b * p.d);
    case "times": return q(p.w * p.a, p.b);
    case "fit": case "part": case "deci": return qDiv(jugOf(p), cupOf(p));
    case "mul": return q(p.a * p.c, 100);
    case "shift": return shiftVal(p, p.c);
    case "rest": return qMul(restLeft(p), q(p.c, p.d));
    case "scale": return qMul(q(p.a, p.b), q(p.d, p.c));
  }
}
/** the answer said aloud the way the level shows it (decimals as decimals) */
export function wantStr(p: HissaParams): string {
  const v = want(p);
  if (p.goal === "deci" || p.goal === "mul" || p.goal === "shift") return decStr(v) ?? qStr(v);
  if (p.goal === "fit" || p.goal === "part") { const wh = qFloor(v), r = qSub(v, q(wh)); return r.n === 0 ? String(wh) : wh ? `${wh} ${qStr(r)}` : qStr(r); }
  return qStr(v);
}

/** a set-up: what the child commits before the run (only the goal's own fields matter) */
export interface Setup { f0?: number; k0?: number; f1?: number; k1?: number; on?: number; lay?: number; cups?: number; say?: number; tag?: number[]; sh?: number; zero?: boolean; pt?: number }
const FIELDS: Record<HissaGoal, readonly (keyof Setup)[]> = {
  of: ["f0", "k0", "f1", "k1", "tag"], times: ["lay", "tag"], fit: ["say", "tag"], part: ["say", "tag"], deci: ["say", "tag"],
  mul: ["k0", "k1", "pt"], shift: ["sh", "zero"], rest: ["f0", "k0", "on", "f1", "k1"], scale: ["f0", "lay"],
};
const sameField = (x: Setup, y: Setup, k: keyof Setup) => {
  if (k === "tag") { const a = tagVal(x.tag ?? [0, 0]), b = tagVal(y.tag ?? [0, 0]); return !!a && !!b && qEq(a, b); }
  return x[k] === y[k];
};
/** does set-up `x` hold every field belief `m` fixes? */
const holds = (p: HissaParams, x: Setup, m: Setup) => FIELDS[p.goal].every((k) => sameField(x, m, k));

/** THE judgement of a run */
export function judge(p: HissaParams, s: Setup): boolean {
  const f0 = s.f0 ?? 1, k0 = s.k0 ?? 0, f1 = s.f1 ?? 1, k1 = s.k1 ?? 0;
  const t = tagVal(s.tag ?? [0, 0]);
  switch (p.goal) {
    case "of": return f0 > 1 && f1 > 1 && k0 * p.b === p.a * f0 && k1 * p.d === p.c * f1 && !!t && qEq(t, want(p));
    case "times": return s.lay === p.w && !!t && qEq(t, want(p));
    case "fit": case "part": case "deci": { const v = want(p), wh = qFloor(v); return s.say === wh && s.cups === wh && !!t && qEq(t, qSub(v, q(wh))); }
    case "mul": return k0 === p.a && k1 === p.c && s.pt === 2;
    case "shift": return s.sh === p.c;
    case "rest": return f0 > 1 && f1 > 1 && k0 * p.b === p.a * f0 && s.on === 1 && k1 * p.d === p.c * f1;
    case "scale": return (s.lay ?? 0) > 0 && f0 > 0 && (s.lay ?? 0) * p.c === p.d * f0;
  }
}

/** a value as whole cups (said, and poured) and a part-cup tag */
const asCups = (v: Q): Setup => { const wh = qFloor(v), r = qSub(v, q(wh)); return { say: wh, cups: wh, tag: r.n === 0 ? [0, 0] : [r.n, r.d] }; };
function rawMal(p: HissaParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  switch (mal) {
    case "keep-den": return p.b === p.d ? { f0: p.b, k0: p.a, f1: p.d, k1: p.c, tag: [p.a * p.c, p.b] } : null;
    case "whole-both": return { lay: p.w, tag: [p.w * p.a, p.w * p.b] };
    case "mult-bigger": return p.a === 1 ? { lay: p.w, tag: [p.w * p.b, 1] } : null;
    // deci: a glass of 0.5 is the halving belief's (div-half) set-up, never this one's
    case "div-smaller": return p.goal === "deci" && p.c * 2 === p.d ? null : asCups(qMul(jugOf(p), cupOf(p)));
    case "no-flip": return asCups(qMul(jugOf(p), cupOf(p)));
    case "flip-first": return asCups(qMul(q(p.b, p.a), cupOf(p)));
    case "div-half": return p.c * 2 === p.d ? asCups(qMul(jugOf(p), q(1, 2))) : null;
    case "scale-one": { const pl = placesOf10(p.d); return pl > 0 ? asCups(qDiv(jugOf(p), q(p.c))) : null; }
    case "point-one": return { k0: p.a, k1: p.c, pt: 1 };
    case "append-zero": return p.c > 0 ? { sh: 0, zero: true } : null;
    case "of-original": return { f0: p.b, k0: p.a, on: 2, f1: p.d, k1: p.c };
    case "scale-flip": return { f0: p.d, lay: p.c };
  }
  return null;
}
function legal(p: HissaParams, s: Setup): boolean {
  const okTag = (t?: number[]) => !t || (isInt(t[0]) && isInt(t[1]) && t[0] >= 0 && t[1] >= 0 && t[0] <= MAX_TAG && t[1] <= MAX_TAG && (t[0] === 0 || t[1] > 0));
  if (!okTag(s.tag)) return false;
  const inF = (f?: number, k?: number) => f === undefined || (isInt(f) && f >= 1 && f <= MAX_FOLD && isInt(k ?? 0) && (k ?? 0) >= 0 && (k ?? 0) <= f);
  if (!inF(s.f0, s.k0) || !inF(s.f1, s.k1)) return false;
  if (s.lay !== undefined && (!isInt(s.lay) || s.lay < 0 || s.lay > MAX_LAY)) return false;
  if (s.cups !== undefined && (!isInt(s.cups) || s.cups < 0 || s.cups > qFloor(qDiv(jugOf(p), cupOf(p))))) return false;
  if (s.say !== undefined && (!isInt(s.say) || s.say < 0 || s.say > MAX_CUPS)) return false;
  if (p.goal === "mul" && (!isInt(s.pt) || s.pt < 0 || s.pt > 3)) return false;
  return true;
}
/** The set-up a child holding `mal` commits, or null (no reading here, not legal, would solve, or another of the goal's
 *  beliefs commits the very same set-up: a signature names ONE belief) */
export function malSetup(p: HissaParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  for (const other of MAL_OF[p.goal]) {
    if (other === mal) continue;
    const o = rawMal(p, other);
    if (o && legal(p, o) && holds(p, o, m)) return null;
  }
  return m;
}

/** the values the teacher may not say before the child produces them: the product, the quotient (and its part-cup), the
 *  slid number, the second spend, the scaled amount */
export function hissaHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as HissaParams | null;
  if (!p || typeof p.goal !== "string" || !MAL_OF[p.goal] || ![p.a, p.b, p.c, p.d, p.w].every(isInt)) return [];
  try {
    const out = [wantStr(p)], v = want(p), s = qStr(v);
    if (!out.includes(s)) out.push(s);
    const dec = decStr(v);
    if (dec && !out.includes(dec)) out.push(dec);
    return out;
  } catch { return []; }
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
/** the goal of a mode, or null */
const goalIn = (mode: string, goal: unknown): HissaGoal | null => {
  const gs = GOALS_OF[mode as HissaMode];
  return gs && gs.includes(goal as HissaGoal) ? (goal as HissaGoal) : null;
};
/** shift: the digits' highest and lowest places after sliding `sh` */
export function shiftSpan(p: HissaParams, sh: number, zero = false): [number, number] {
  const len = String(p.a).length + (zero ? 1 : 0);
  const lo = -p.b - (zero ? 1 : 0) + sh;
  return [lo + len - 1, lo];
}

function validate(level: PlayLevel<unknown>): PlayLevel<HissaParams> | null {
  const p = level.params as Partial<HissaParams> | null;
  if (!p) return null;
  const goal = goalIn(level.mode, p.goal);
  if (!goal) return null;
  const face = p.face === 1 || p.face === 2 || p.face === 3 ? p.face : 0;
  const { a, b, c, d } = p, w = p.w ?? 0, ctx = p.ctx ?? 0;
  if (!face || ![a, b, c, d, w, ctx].every(isInt)) return null;
  const A = a as number, B = b as number, C = c as number, D = d as number;
  const out = { ...level, params: { goal, face, a: A, b: B, c: C, d: D, w, ctx } } as PlayLevel<HissaParams>;
  const pr = out.params;
  const frac = (n: number, dd: number, hi: number) => n >= 1 && n < dd && dd >= 2 && dd <= hi;
  switch (goal) {
    case "of":
      // two proper fractions of at most fifths (the tag stays countable), never the same fraction twice
      if (w !== 0 || ctx !== 0 || !frac(A, B, 5) || !frac(C, D, 5) || A * D === B * C) return null;
      return out;
    case "times":
      // 2..6 pieces of a proper fraction of a metre (at most eighths), the rope at most 4 m and never whole metres only
      if (ctx !== 0 || C !== 0 || D !== 0 || w < 2 || w > 6 || !frac(A, B, 8) || (w * A) % B === 0 || w * A > 4 * B || gcd(A, B) !== 1) return null;
      return out;
    case "fit": {
      // a whole jug (1..6 litres) and a cup less than a litre; 2..16 full cups
      if (ctx !== 0 || A !== 0 || B !== 0 || w < 1 || w > 6 || !frac(C, D, 8) || gcd(C, D) !== 1) return null;
      const v = want(pr);
      if (qFloor(v) < 2 || qFloor(v) > 16) return null;
      return out;
    }
    case "part": {
      // a jug a/b (less than 2 litres, not whole) and a cup c/d less than the jug; 1..8 full cups
      if (ctx !== 0 || w !== 0 || A < 1 || B < 2 || B > 8 || A >= 2 * B || A % B === 0 || gcd(A, B) !== 1 || !frac(C, D, 8) || gcd(C, D) !== 1) return null;
      if (!qLt(cupOf(pr), jugOf(pr))) return null;
      const v = want(pr);
      if (qFloor(v) < 1 || qFloor(v) > 8 || v.d > 12) return null;
      return out;
    }
    case "deci": {
      // a decimal jug and glass (tenths or hundredths), the glass less than 1 litre; a whole number of glasses, 2..16
      const pb = placesOf10(B), pd = placesOf10(D);
      if (ctx !== 0 || w !== 0 || pb < 1 || pb > 2 || pd < 1 || pd > 2 || A < 1 || C < 1 || C >= D || (B === 100 && A % 10 === 0) || (D === 100 && C % 10 === 0)) return null;
      const v = want(pr);
      if (v.d !== 1 || v.n < 2 || v.n > 16) return null;
      return out;
    }
    case "mul":
      // tenths × tenths, at most 1.9 each, one of them less than 1; never a whole number of tenths × 10
      if (ctx !== 0 || w !== 0 || B !== 10 || D !== 10 || A < 1 || C < 1 || A > 19 || C > 19 || A % 10 === 0 || C % 10 === 0 || (A >= 10 && C >= 10)) return null;
      return out;
    case "shift": {
      // a decimal (1..3 places, no trailing zero) moved by 10, 100, 1000 (or × 0.1, 0.01: d = 1); every digit stays on the chart
      if (ctx !== 0 || w !== 0 || B < 1 || B > 3 || A < 11 || A > 9999 || A % 10 === 0 || C === 0 || Math.abs(C) > 3 || (D !== 0 && D !== 1) || (D === 1 && (C > -1 || C < -2))) return null;
      const [hi0, lo0] = shiftSpan(pr, 0, true), [hi1, lo1] = shiftSpan(pr, C, true);
      if (hi0 > CHART_HI || lo0 < CHART_LO || hi1 > CHART_HI || lo1 < CHART_LO) return null;
      return out;
    }
    case "rest": {
      // a bar of w (₹ or cm), two proper fractions of at most fifths; every amount whole
      if (ctx < 0 || ctx > 1 || !frac(A, B, 5) || !frac(C, D, 5) || w < 12 || w > 600 || w % (B * D) !== 0) return null;
      return out;
    }
    case "scale": {
      // a/b cup (halves, thirds, quarters) for c people; cook for d (2..8, d ≠ c); the new amount never the same
      if (ctx < 0 || ctx > 2 || w !== 0 || !frac(A, B, 4) || C < 2 || C > 8 || D < 2 || D > 8 || C === D) return null;
      return out;
    }
  }
  return null;
}

function init(level: PlayLevel<HissaParams>): HissaState {
  return { f: [1, 1], k: [0, 0], on: 0, lay: 0, cups: 0, say: -1, lock: false, tag: [0, 0], sh: 0, zero: false, pt: 0, ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}
export const setupOf = (s: HissaState): Setup => ({ f0: s.f[0], k0: s.k[0], f1: s.f[1], k1: s.k[1], on: s.on, lay: s.lay, cups: s.cups, say: s.say, tag: s.tag, sh: s.sh, zero: s.zero, pt: s.pt });
/** pour: what the jug still holds */
export const jugLeft = (p: HissaParams, cups: number): Q => qSub(jugOf(p), qMul(q(cups), cupOf(p)));
/** mul: how many tenths the grid can take on a side */
export const gridMax = (p: HissaParams, side: number) => 10 * unitsOf(side === 0 ? p.a : p.c);

function apply(level: PlayLevel<HissaParams>, s: HissaState, act: HissaAct, seq: number): { state: HissaState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [], g = p.goal;
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: HissaState): HissaState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  // a count that a pour has already tested stands through an undo (taking the pours back never un-says it)
  if (act.kind === "undo") { const back = popUndo(s); return { state: { ...back, ...(s.lock ? { say: s.say, lock: true } : {}), acts: s.acts + 1 }, moments: [] }; }
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const change = (patch: Partial<HissaState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  const pour = g === "fit" || g === "part" || g === "deci";
  switch (act.kind) {
    case "fold": {
      if (g !== "of" && g !== "rest" && g !== "scale") return no("no_fold");
      const side = Number(act.side), n = Number(act.n);
      if (!(side === 0 || (side === 1 && g !== "scale")) || !isInt(n) || n < 1 || n > MAX_FOLD) return no("bad_fold");
      if (side === 1 && g === "rest" && !s.on) return no("pick_first");
      if (s.f[side] === n) return no("same_fold");
      const f = [...s.f], k = [...s.k]; f[side] = n; k[side] = n < 2 ? 0 : Math.min(k[side], n);   // an unfolded side has no strips shaded
      return change({ f, k });
    }
    case "shade": {
      if (g !== "of" && g !== "rest" && g !== "mul") return no("no_shade");
      const side = Number(act.side), n = Number(act.k);
      if ((side !== 0 && side !== 1) || !isInt(n) || n < 0) return no("bad_shade");
      const hi = g === "mul" ? gridMax(p, side) : s.f[side];
      if (n > hi || (g !== "mul" && s.f[side] < 2)) return no("bad_shade");
      if (s.k[side] === n) return no("same_shade");
      const k = [...s.k]; k[side] = n;
      return change({ k });
    }
    case "base": {
      if (g !== "rest") return no("no_base");
      const on = Number(act.on);
      if (on !== 1 && on !== 2) return no("bad_base");
      if (s.on === on) return no("same_base");
      return change({ on });
    }
    case "lay": {
      if (g !== "times" && g !== "scale") return no("no_lay");
      const n = Number(act.n);
      if (!isInt(n) || n < 0 || n > MAX_LAY) return no("bad_lay");
      if (n === s.lay) return no("same_lay");
      return change({ lay: n });
    }
    case "count": {
      if (!pour) return no("no_count");
      const n = Number(act.n);
      if (!isInt(n) || n < 0 || n > MAX_CUPS) return no("bad_count");
      if (s.lock) return no("said");                                    // the jug is testing it: the run answers first
      if (n === s.say) return no("same_count");
      out.push(mom("prediction_committed", seq, { count: n }));
      return change({ say: n });
    }
    case "pour": {
      if (!pour) return no("no_jug");
      if (s.say < 0) return no("count_first");                         // say how many first; the jug then shows it
      if (qLt(jugLeft(p, s.cups), cupOf(p))) return no("not_full");   // a full cup, or none
      if (s.cups >= MAX_CUPS) return no("no_cups");
      return change({ cups: s.cups + 1, lock: true });
    }
    case "tag": {
      if (g !== "of" && g !== "times" && !pour) return no("no_tag");
      const part = Number(act.part), v = Number(act.v);
      if ((part !== 0 && part !== 1) || !isInt(v) || v < 0 || v > MAX_TAG) return no("bad_tag");
      if (s.tag[part] === v) return no("same_tag");
      const tag = [...s.tag]; tag[part] = v;
      return change({ tag });
    }
    case "slide": {
      if (g !== "shift") return no("no_chart");
      const by = Number(act.by);
      if (by !== 1 && by !== -1) return no("bad_slide");
      const [hi, lo] = shiftSpan(p, s.sh + by, s.zero);
      if (hi > CHART_HI || lo < CHART_LO) return no("off_chart");
      return change({ sh: s.sh + by });
    }
    case "zero": {
      if (g !== "shift") return no("no_chart");
      const [, lo] = shiftSpan(p, s.sh, !s.zero);
      if (lo < CHART_LO) return no("off_chart");
      return change({ zero: !s.zero });
    }
    case "point": {
      if (g !== "mul") return no("no_point");
      const at = Number(act.at);
      if (!isInt(at) || at < 0 || at > 3) return no("bad_point");
      if (at === s.pt) return no("same_point");
      return change({ pt: at });
    }
    case "run": {
      if (s.ended) return no("change_first");
      if (g === "of" && (s.f[0] < 2 || s.f[1] < 2 || !s.k[0] || !s.k[1])) return no("fold_first");
      if (g === "rest" && (s.f[0] < 2 || !s.k[0] || !s.on || s.f[1] < 2 || !s.k[1])) return no("fold_first");
      if ((g === "of" || g === "times") && (!s.tag[1] || !tagVal(s.tag))) return no("tag_first");
      if (g === "times" && !s.lay) return no("lay_first");
      if (g === "scale" && !s.lay) return no("lay_first");
      if (pour && s.say < 0) return no("count_first");
      if (pour && !s.cups && !s.tag[0]) return no("pour_first");
      if (pour && !tagVal(s.tag)) return no("tag_first");
      if (g === "mul" && (!s.k[0] || !s.k[1])) return no("shade_first");
      if (g === "shift" && !s.sh && !s.zero) return no("slide_first");
      const su = setupOf(s), runs = s.runs + 1, ok = judge(p, su);
      // the law has answered: a count the jug tested may be said again
      const end = bump({ ...s, ended: true, runs, done: ok, lock: false });
      const f: Facts = { goal: g, run: runs };
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) {
        const m = malSetup(p, mal);
        if (m && holds(p, su, m)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      // near: the right folds / pours / shading with the tag or point one step off; one share or one place off
      const t = tagVal(s.tag), w = want(p);
      const near = g === "of" || g === "times" ? !!t && t.d === w.d && Math.abs(t.n - w.n) === 1
        : pour ? (s.say === qFloor(w) && s.cups === qFloor(w)) || (qFloor(w) > 0 && Math.abs(s.say - qFloor(w)) === 1 && s.tag[0] === 0)
        : g === "mul" ? s.k[0] === p.a && s.k[1] === p.c
        : g === "shift" ? Math.abs(s.sh - p.c) === 1
        : g === "rest" ? s.on === 1 && s.k[0] * p.b === p.a * s.f[0]
        : Math.abs(s.lay * p.c - p.d * s.f[0]) === p.c;
      out.push(mom(near ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<HissaParams>, s: HissaState) => s.done;

/** the acts that commit a set-up from the level's start, then run */
export function setupActs(p: HissaParams, su: Setup): HissaAct[] {
  const acts: HissaAct[] = [];
  const g = p.goal;
  if (g === "rest") {
    acts.push({ kind: "fold", side: 0, n: su.f0 ?? 1 }, { kind: "shade", side: 0, k: su.k0 ?? 0 }, { kind: "base", on: su.on ?? 1 },
      { kind: "fold", side: 1, n: su.f1 ?? 1 }, { kind: "shade", side: 1, k: su.k1 ?? 0 });
  } else if (g === "of") {
    acts.push({ kind: "fold", side: 0, n: su.f0 ?? 1 }, { kind: "shade", side: 0, k: su.k0 ?? 0 }, { kind: "fold", side: 1, n: su.f1 ?? 1 }, { kind: "shade", side: 1, k: su.k1 ?? 0 });
  } else if (g === "scale") {
    if ((su.f0 ?? 1) !== 1) acts.push({ kind: "fold", side: 0, n: su.f0 ?? 1 });
    acts.push({ kind: "lay", n: su.lay ?? 0 });
  } else if (g === "times") acts.push({ kind: "lay", n: su.lay ?? 0 });
  else if (g === "mul") {
    acts.push({ kind: "shade", side: 0, k: su.k0 ?? 0 }, { kind: "shade", side: 1, k: su.k1 ?? 0 });
    if (su.pt) acts.push({ kind: "point", at: su.pt });
  } else if (g === "shift") {
    if (su.zero) acts.push({ kind: "zero" });
    const sh = su.sh ?? 0;
    for (let i = 0; i < Math.abs(sh); i++) acts.push({ kind: "slide", by: sh > 0 ? 1 : -1 });
  } else {
    // pour: the count is said first; the pours test it
    if (su.say !== undefined && su.say >= 0) acts.push({ kind: "count", n: su.say });
    for (let i = 0; i < (su.cups ?? 0); i++) acts.push({ kind: "pour" });
  }
  const t = su.tag ?? [0, 0];
  if (t[1]) acts.push({ kind: "tag", part: 1, v: t[1] });
  if (t[0]) acts.push({ kind: "tag", part: 0, v: t[0] });
  acts.push({ kind: "run" });
  return acts.filter((a) => !((a.kind === "fold" && a.n === 1) || (a.kind === "shade" && a.k === 0) || (a.kind === "lay" && a.n === 0)));
}
function answerSetup(p: HissaParams): Setup {
  const v = want(p);
  switch (p.goal) {
    case "of": return { f0: p.b, k0: p.a, f1: p.d, k1: p.c, tag: [p.a * p.c, p.b * p.d] };
    case "times": return { lay: p.w, tag: [p.w * p.a, p.b] };
    case "fit": case "part": case "deci": return asCups(v);
    case "mul": return { k0: p.a, k1: p.c, pt: 2 };
    case "shift": return { sh: p.c, zero: false };
    case "rest": return { f0: p.b, k0: p.a, on: 1, f1: p.d, k1: p.c };
    case "scale": return { f0: p.c, lay: p.d };
  }
}
function solve(level: PlayLevel<HissaParams>): HissaAct[] | null {
  const su = answerSetup(level.params);
  return legal(level.params, su) ? setupActs(level.params, su) : null;
}
/**
 * Set-ups that win without the idea: the sheet tagged with the first (or the second) fraction alone; the rope tagged as one
 * piece or as whole metres; every cup poured and the part-cup left untagged, the cup count read as the jug's number, the part
 * left named in litres; the grid's count read as a whole number or with one place; the digits slid the wrong way; the second spend folded
 * on the whole bar with the first fraction; the recipe laid one share for one. A level any of them solves is never served.
 */
export function shortcutActs(p: HissaParams): HissaAct[][] {
  const tries: Setup[] = [];
  const g = p.goal;
  if (g === "of") for (const tag of [[p.a, p.b], [p.c, p.d], [p.a + p.c, p.b + p.d]]) tries.push({ f0: p.b, k0: p.a, f1: p.d, k1: p.c, tag });
  if (g === "times") for (const tag of [[p.a, p.b], [p.w, 1], [p.w * p.a, p.w * p.b]]) tries.push({ lay: p.w, tag });
  if (g === "fit" || g === "part" || g === "deci") {
    // the count said first is how many fit (the division); the part-cup is the idea after it. A count of the jug's own
    // number, or the right count with the part-cup left untagged or named in litres, never wins
    const all = qFloor(want(p));
    if (want(p).d > 1) tries.push({ say: all, cups: all, tag: [0, 0] });
    const jugN = qFloor(jugOf(p));
    if (jugN !== all) tries.push({ say: jugN, cups: all, tag: [0, 0] }, { say: jugN, cups: Math.min(all, jugN), tag: [0, 0] });
    const left = jugLeft(p, all);
    if (left.n) tries.push({ say: all, cups: all, tag: [left.n, left.d] });
  }
  if (g === "mul") for (const pt of [0, 1, 3]) tries.push({ k0: p.a, k1: p.c, pt });
  if (g === "shift") tries.push({ sh: -p.c, zero: false });
  if (g === "rest") tries.push({ f0: p.b, k0: p.a, on: 2, f1: p.b, k1: p.a }, { f0: p.b, k0: p.a, on: 1, f1: p.b, k1: p.a });
  if (g === "scale") tries.push({ f0: 1, lay: 1 }, { f0: p.c, lay: p.c });
  return tries.filter((su) => legal(p, su)).map((su) => setupActs(p, su));
}
function replayDone(level: PlayLevel<HissaParams>, acts: HissaAct[]): boolean {
  let s = init(level);
  for (const a of acts) s = apply(level, s, a, 1).state;
  return s.done;
}
function shortcut(level: PlayLevel<HissaParams>): HissaAct[] | null {
  for (const t of shortcutActs(level.params)) if (replayDone(level, t)) return t;
  return null;
}
function malActs(level: PlayLevel<HissaParams>, mal: string): HissaAct[] | null {
  const m = malSetup(level.params, mal);
  return m ? setupActs(level.params, m) : null;
}

interface HissaGrammar {
  /** of: same denominators share (0..1) · fit / part: unit cups only (1) · shift: the moves allowed (exponents) */
  same?: number; unit?: number; moves?: number[]; form?: "times" | "div";
  /** deci: the glasses, in hundredths of a litre (50 = 0.5) */
  glasses?: number[];
}
function difficultyOf(p: HissaParams): number {
  const f = 0.06 * (p.face - 1), v = want(p);
  switch (p.goal) {
    case "of": return Math.min(1, 0.3 + f + 0.02 * p.b * p.d);
    case "times": return Math.min(1, 0.25 + f + 0.03 * p.b + 0.03 * p.w);
    case "fit": case "part": case "deci": return Math.min(1, 0.3 + f + 0.02 * qFloor(v) + (v.d > 1 ? 0.03 : 0) /* a part-cup left over: a small step only (at 0.15 the normal door never served one: 0 of 180 for pour/part) */ + (p.goal === "part" ? 0.1 : 0));
    case "mul": return Math.min(1, 0.3 + f + (p.a >= 10 || p.c >= 10 ? 0.15 : 0));
    case "shift": return Math.min(1, 0.25 + f + 0.06 * Math.abs(p.c) + (p.c < 0 ? 0.08 : 0));
    case "rest": return Math.min(1, 0.35 + f + 0.02 * p.b * p.d);
    case "scale": return Math.min(1, 0.35 + f + 0.02 * (p.c + p.d) + (p.d < p.c ? 0.08 : 0));
  }
}
const GLASSES: readonly [number, number][] = [[5, 10], [25, 100], [2, 10], [4, 10], [6, 10], [75, 100], [3, 10], [15, 100], [8, 10]];
function generate(req: GenRequest): Candidate<HissaParams>[] {
  const g = req.grammar as HissaGrammar;
  const mode = (["fold", "pour", "grid", "story"] as const).find((m) => m === req.mode) ?? "fold";
  const goal = goalIn(mode, req.goal) ?? GOALS_OF[mode][0];
  const rnd = mulberry32(req.seed), out: Candidate<HissaParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const face = req.fade as 1 | 2 | 3;
  const mk = (params: HissaParams, sig: string): Candidate<HissaParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `hissa-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "hissa", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "hissa", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const coprime = (lo: number, hi: number): [number, number] => { for (;;) { const dd = int(lo, hi), n = int(1, dd - 1); if (gcd(n, dd) === 1) return [n, dd]; } };
  for (let tries = 0; tries < 160 && out.length < 24; tries++) {
    let a = 0, b = 0, c = 0, d = 0, w = 0, ctx = 0;
    if (goal === "of") {
      [a, b] = coprime(2, 5);
      if (rnd() < (g.same ?? 0.5)) { d = b; c = int(1, d - 1); } else [c, d] = coprime(2, 5);
    } else if (goal === "times") {
      [a, b] = coprime(2, 8); w = int(2, 6);
      if (rnd() < 0.4) a = 1;
    } else if (goal === "fit") {
      w = int(1, 6);
      [c, d] = g.unit ? [1, int(2, 8)] : coprime(2, 8);
      if (!g.unit && rnd() < 0.35) c = 1;
    } else if (goal === "part") {
      [a, b] = coprime(2, 6); if (rnd() < 0.4) a += b; if (gcd(a, b) !== 1) continue;
      [c, d] = coprime(2, 8);
    } else if (goal === "deci") {
      const gl = GLASSES.filter(([n, dd]) => !g.glasses?.length || g.glasses.includes((n * 100) / dd));
      [c, d] = pickOf(gl.length ? gl : GLASSES);
      // the jug in the glass's own places, then tenths when the hundredths are round
      a = int(2, 16) * c; b = d;
      if (b === 100 && a % 10 === 0) { a /= 10; b = 10; }
    } else if (goal === "mul") {
      a = int(1, 9); c = int(1, 9);
      if (rnd() < 0.35) { if (rnd() < 0.5) a += 10; else c += 10; }
      b = 10; d = 10;
    } else if (goal === "shift") {
      const moves = g.moves?.length ? g.moves : [1, 2, 3];
      // the form a move is written in: "times" writes × 0.1 / × 0.01 for a move right, "div" writes ÷ 10 …
      c = pickOf(moves);
      d = c >= 0 || c < -2 || g.form === "div" ? 0 : g.form === "times" ? 1 : rnd() < 0.4 ? 1 : 0;
      // a 2- or 3-digit number with 1..3 decimal places (0.13, 4.07, 56.3, 0.508), never a trailing zero
      b = int(1, 3);
      const nd = int(2, 3);
      a = int(10 ** (nd - 1), 10 ** nd - 1);
    } else if (goal === "rest") {
      [a, b] = coprime(2, 5); [c, d] = coprime(2, 5);
      w = b * d * pickOf([2, 4, 5, 10, 20]); ctx = int(0, 1);
      if (w > 600 || w < 12) continue;
    } else {
      [a, b] = coprime(2, 4);
      c = int(2, 8); d = int(2, 8); ctx = int(0, 2);
      if (c === d) continue;
    }
    const params: HissaParams = { goal, face, a, b, c, d, w, ctx };
    const sig = `${goal}:${a}:${b}:${c}:${d}:${w}:${ctx}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig);
    const v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push(cand);
  }
  return out;
}

function facts(level: PlayLevel<HissaParams>, s: HissaState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (p.goal === "of" || p.goal === "rest") { f.folds = `${s.f[0]} · ${s.f[1]}`; f.shaded = `${s.k[0]} · ${s.k[1]}`; }
  if (p.goal === "rest" && s.on) f.on = s.on === 1 ? "left" : "whole";
  if (p.goal === "times" || p.goal === "scale") f.laid = s.lay;
  if (p.goal === "scale") f.shares = s.f[0];
  if (p.goal === "fit" || p.goal === "part" || p.goal === "deci") { f.cups = s.cups; if (s.say >= 0) f.said = s.say; }
  if (p.goal === "mul") { f.tenths = `${s.k[0]} × ${s.k[1]}`; f.point = s.pt; }
  if (p.goal === "shift") { f.slid = s.sh; if (s.zero) f.zero = "yes"; }
  const t = tagVal(s.tag);
  if (s.tag[0] || s.tag[1]) f.tag = t ? `${s.tag[0]}/${s.tag[1]}` : `${s.tag[0]}/–`;
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<HissaParams>, s: HissaState) {
  const p = level.params, lines: string[] = [], t = `${s.tag[0]}/${s.tag[1] || "–"}`;
  if (p.goal === "of") lines.push(`${p.a}/${p.b} × ${p.c}/${p.d}`, `folds: ${s.f[0]} × ${s.f[1]}`, `shaded: ${s.k[0]} · ${s.k[1]}`, `tag: ${t}`);
  if (p.goal === "times") lines.push(`${p.w} × ${p.a}/${p.b}`, `laid: ${s.lay}`, `tag: ${t}`);
  if (p.goal === "fit" || p.goal === "part" || p.goal === "deci") lines.push(`jug ÷ cup`, `said: ${s.say < 0 ? "?" : s.say}`, `cups: ${s.cups}`, `part cup: ${t}`);
  if (p.goal === "mul") lines.push(`${p.a / 10} × ${p.c / 10}`, `shaded: ${s.k[0]} × ${s.k[1]}`, `point: ${s.pt}`);
  if (p.goal === "shift") lines.push(`${decStr(shiftX(p))} × 10^${p.c}`, `slid: ${s.sh}`);
  if (p.goal === "rest") lines.push(`${p.w}: ${p.a}/${p.b}, then ${p.c}/${p.d} of the rest`, `folds: ${s.f[0]} · ${s.f[1]}`, `on: ${s.on}`);
  if (p.goal === "scale") lines.push(`${p.a}/${p.b} for ${p.c} → ${p.d}`, `shares: ${s.f[0]}`, `laid: ${s.lay}`);
  return { title: "Hissa", lines };
}
function grade(level: PlayLevel<HissaParams>, acts: PlayActEnvelope<HissaAct>[]): PlayGrade {
  return gradeLevel(hissaLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const hissaLogic: FamilyLogic<HissaParams, HissaState, HissaAct> = {
  family: "hissa", modes: ["fold", "pour", "grid", "story"], malRules: HISSA_MAL,
  // grid/shift: one slide count wins (a lucky tap 14 to 22 %, games audit GAMES-03): its correct enters at CHANCE_WEIGHT. Pour
  // is not here: its count is said before the jug shows it, among 0..20, and the part-cup tag must be right too (GAMES-08)
  oneDecision: ["shift"],
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
