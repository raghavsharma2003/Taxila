// number-line@1 — pure configuration and verdicts. Positions are integer tick indexes k on a line from
// `min` in steps of `unit` (a rational), so "is the marker on 3/4?" is integer arithmetic, never pixels.
import { fmtQ, fractionsRaw, numbersFrom, parseFracRaw, parseQ, q, qAdd, qCmp, qEq, qMul, qSub, qVal, type Q } from "../kit/math.ts";

export type Kind = "whole" | "fraction" | "decimal" | "integer";
export type Mode = "place" | "read" | "jump";
export const MAX_TICKS = 40;

export interface NLConfig {
  kind: Kind;
  mode: Mode;
  min: Q;
  max: Q;
  unit: Q;
  ticks: number; // number of spaces; positions 0..ticks
  target: Q | null;
  start: Q;
  jumps: Q[];
  labels: "all" | "units" | "ends" | "none";
  /** A labelled point drawn on the line (the number being rounded / compared); never the target. */
  point: Q | null;
  /** Rounding task: the target is `point` rounded (half up) to this unit, computed here — not passed in. */
  roundTo: number | null;
  /** The question as the child sees it ("46 + 25", "2, 5, 8, 11, …"); when set, the target is never shown. */
  question: string | null;
  hideAnswer: boolean;
  issues: string[];
  error: string | null;
}

const lcm = (a: number, b: number) => (a * b) / gcdN(a, b);
const gcdN = (a: number, b: number): number => (b ? gcdN(b, a % b) : a);

export function normalize(p: Record<string, unknown>): NLConfig {
  const point = p.point !== undefined ? parseQ(p.point as string) : null;
  const roundTo = typeof p.round === "number" && [10, 100, 1000, 10000, 100000].includes(p.round) ? p.round : null;
  if (point && roundTo && point.d === 1) return roundingLine(p, point, roundTo);
  const issues: string[] = [];
  const fr = fractionsRaw(p.fractions);
  const nums = numbersFrom(p.numbers);
  const generic = p.mode === "show" || p.mode === "predict" || p.mode === undefined;
  let target = p.target !== undefined ? parseFracRaw(p.target) : null;
  if (p.target !== undefined && !target) issues.push(`target: ${JSON.stringify(p.target)} is not a number`);
  if (!target && generic) target = fr[0] ?? (nums.length ? parseQ(nums[0]) : null);

  let kind: Kind = (["whole", "fraction", "decimal", "integer"] as Kind[]).includes(p.numberKind as Kind) ? (p.numberKind as Kind) : "whole";
  if (p.numberKind === undefined && target) {
    if (target.n < 0) kind = "integer";
    else if (target.d !== 1) kind = String(p.target ?? (fr.length ? "" : nums[0] ?? "")).includes(".") ? "decimal" : "fraction";
  }

  let mode: Mode = p.mode === "read" || p.mode === "jump" || p.mode === "place" ? p.mode : "place";
  const startIn = parseQ(p.start as string);
  const jumpsIn = Array.isArray(p.jumps) ? p.jumps.map((j) => parseQ(j as string)).filter((j): j is Q => !!j && j.n > 0) : [];
  if (p.mode === undefined && startIn) mode = "jump";
  const minIn = parseQ(p.min as string);
  if (p.numberKind === undefined && [target, startIn, minIn].some((v) => v && v.n < 0)) kind = "integer";

  // The unit between ticks.
  let unit: Q;
  if (typeof p.partition === "number" && p.partition >= 1) unit = q(1, Math.min(24, Math.round(p.partition)));
  else if (kind === "fraction") {
    const dens = [target?.d ?? 1, ...fr.map((f) => f.d), ...jumpsIn.map((j) => j.d)].filter((d) => d > 1);
    unit = q(1, Math.min(24, dens.reduce(lcm, 1) || 4));
  } else if (kind === "decimal") unit = q(1, target && target.d > 10 ? 100 : 10);
  else {
    const s = typeof p.step === "number" && p.step >= 1 ? Math.round(p.step) : 1;
    unit = q(s, 1);
  }

  // Range.
  let min = parseQ(p.min as string);
  let max = parseQ(p.max as string);
  const vals = [target, startIn].filter((v): v is Q => !!v);
  if (!min) min = kind === "integer" ? q(Math.min(-5, ...vals.map((v) => Math.floor(qVal(v)) - 1)), 1) : q(Math.min(0, ...vals.map((v) => Math.floor(qVal(v)))), 1);
  if (!max) {
    const top = Math.max(...vals.map((v) => Math.ceil(qVal(v))), kind === "fraction" || kind === "decimal" ? 1 : kind === "integer" ? 5 : 10);
    max = q(kind === "whole" && unit.n === 1 && top > 10 && top <= 20 ? 20 : top, 1);
  }
  if (qCmp(max, min) <= 0) {
    issues.push("max: must be above min; using min + 10");
    max = qAdd(min, q(10, 1));
  }
  // Too many ticks: widen the unit (whole numbers) or shrink the range around the target.
  let span = qSub(max, min);
  let ticksQ = qMul(span, q(unit.d, unit.n));
  if (ticksQ.d !== 1) {
    issues.push(`partition: ${fmtQ(unit)} does not divide the range; snapping max`);
    max = qAdd(min, qMul(unit, q(Math.ceil(qVal(ticksQ)), 1)));
    span = qSub(max, min);
    ticksQ = qMul(span, q(unit.d, unit.n));
  }
  if (ticksQ.n > MAX_TICKS) {
    if (unit.d === 1) {
      const s = [1, 2, 5, 10, 20, 25, 50, 100, 250, 500, 1000].find((k) => qVal(span) / k <= MAX_TICKS) ?? 1000;
      unit = q(s, 1);
      const lo = Math.floor(qVal(min) / s) * s;
      const hi = Math.ceil(qVal(max) / s) * s;
      min = q(lo, 1);
      max = q(hi, 1);
    } else {
      issues.push(`range: ${ticksQ.n} ticks > ${MAX_TICKS}; shrinking to one unit around the target`);
      const base = target ? Math.floor(qVal(target)) : Math.floor(qVal(min));
      min = q(base, 1);
      max = q(base + 1, 1);
    }
    span = qSub(max, min);
    ticksQ = qMul(span, q(unit.d, unit.n));
  }
  const ticks = ticksQ.n;

  let start = startIn ?? min;
  if (qCmp(start, min) < 0 || qCmp(start, max) > 0) {
    issues.push("start: outside the line; using min");
    start = min;
  }
  let jumps = jumpsIn.length ? jumpsIn.slice(0, 4) : [unit];
  if (mode === "jump" && !jumpsIn.length && target && startIn) {
    const diff = qSub(target, startIn);
    const mag = diff.n < 0 ? q(-diff.n, diff.d) : diff;
    if (mag.n !== 0 && !qEq(mag, unit)) jumps = [unit, mag];
  }
  const labels = ["all", "units", "ends", "none"].includes(p.labels as string) ? (p.labels as NLConfig["labels"]) : ticks <= 12 ? "all" : "units";

  let error: string | null = null;
  if (target && indexOf({ min, unit, ticks } as NLConfig, target) === null) error = `target ${fmtQ(target)} is not on this line (${fmtQ(min)}..${fmtQ(max)} in steps of ${fmtQ(unit)})`;
  if (mode === "jump" && target && indexOf({ min, unit, ticks } as NLConfig, start) === null) error = `start ${fmtQ(start)} is not on a tick`;
  if (mode === "jump" && target && jumps.some((j) => qMul(j, q(unit.d, unit.n)).d !== 1)) error = "jumps must be whole numbers of ticks";
  let pt = point;
  if (pt && indexOf({ min, unit, ticks } as NLConfig, pt) === null) {
    issues.push(`point: ${fmtQ(pt)} is not on a tick`);
    pt = null;
  }
  const question = typeof p.question === "string" && /^[0-9\s+\-−×÷*/.,()?…_=]{1,32}$/.test(p.question) ? p.question.trim() : null;
  if (typeof p.question === "string" && !question) issues.push("question: only digits, operators, commas and blanks are shown");
  return { kind, mode, min, max, unit, ticks, target, start, jumps, labels, point: pt, roundTo: null, question, hideAnswer: p.mode === "predict" || p.predict === true, issues, error };
}

/** Round half up to `u` (exact on integers). */
export const roundHalfUp = (n: number, u: number) => Math.floor(n / u + 0.5) * u;

/**
 * Rounding line: from the multiple of `u` below the point to the one above, ticked finely enough that the
 * point sits on a tick (≤ MAX_TICKS); the target is the nearer end, computed here from the point.
 */
function roundingLine(p: Record<string, unknown>, point: Q, u: number): NLConfig {
  const issues: string[] = [];
  const v = qVal(point);
  const lo = Math.floor(v / u) * u;
  const step = [u / 10, u / 20, u / 40].find((s) => Number.isInteger(s) && Number.isInteger((v - lo) / s)) ?? null;
  const unit = q(step ?? u / 10, 1);
  const target = q(roundHalfUp(v, u), 1);
  const error = step === null || point.d !== 1 ? `point ${fmtQ(point)} does not sit on a tick of a ${u}-wide line` : null;
  return {
    kind: "whole", mode: "place", min: q(lo, 1), max: q(lo + u, 1), unit, ticks: Math.round(u / qVal(unit)), target, start: q(lo, 1), jumps: [unit],
    labels: "ends", point, roundTo: u, question: null, hideAnswer: p.mode === "predict" || p.predict === true, issues, error,
  };
}

/** Value at tick k. */
export const valueAt = (c: Pick<NLConfig, "min" | "unit">, k: number): Q => qAdd(c.min, qMul(c.unit, q(k, 1)));

/** Tick index of value v, or null if it is not on a tick of this line. */
export function indexOf(c: Pick<NLConfig, "min" | "unit" | "ticks">, v: Q): number | null {
  const k = qMul(qSub(v, c.min), q(c.unit.d, c.unit.n));
  return k.d === 1 && k.n >= 0 && k.n <= c.ticks ? k.n : null;
}

export function fmtValue(c: Pick<NLConfig, "kind">, v: Q): string {
  return fmtQ(v, c.kind === "decimal" ? "decimal" : "fraction");
}

/** Label text at tick k ("2/4" stays unreduced on a quarters line, as the book draws it). */
export function labelAt(c: NLConfig, k: number): string | null {
  const v = valueAt(c, k);
  const isUnit = v.d === 1;
  if (c.labels === "none") return null;
  if (c.labels === "ends") return k === 0 || k === c.ticks ? fmtValue(c, v) : null;
  if (c.labels === "units") {
    if (c.unit.d === 1) return k % Math.max(1, Math.ceil(c.ticks / 10)) === 0 ? String(v.n) : null;
    return isUnit ? String(v.n) : null;
  }
  if (isUnit || c.kind !== "fraction") return fmtValue(c, v);
  const num = qMul(v, q(c.unit.d, 1));
  return `${num.n}/${c.unit.d}`;
}

/** The verdict for a committed position (place / jump). */
export const placeCorrect = (c: NLConfig, k: number): boolean => !!c.target && qEq(valueAt(c, k), c.target);

/** The verdict for a typed reading (read mode): any equivalent form of the target counts. */
export function readCorrect(c: NLConfig, entry: string): boolean {
  const v = parseQ(entry);
  return !!v && !!c.target && qEq(v, c.target);
}

/**
 * Misconception signals for a wrong placement (facts only; the Director's detectors decide):
 * - frac_as_whole: a fraction placed at its numerator or denominator as a whole number (FRAC_NOT_NUMBER)
 * - off_by_one_tick: one tick away (counting ticks instead of spaces, JUMP_COUNTS_START)
 */
export function placeMisc(c: NLConfig, k: number): string | null {
  if (!c.target || placeCorrect(c, k)) return null;
  const v = valueAt(c, k);
  if (c.target.d !== 1 && v.d === 1 && (v.n === c.target.n || v.n === c.target.d)) return "frac_as_whole";
  const tk = indexOf(c, c.target);
  if (tk !== null && Math.abs(tk - k) === 1) return "off_by_one_tick";
  return null;
}

export const absErr = (c: NLConfig, k: number): number => (c.target ? Math.abs(qVal(valueAt(c, k)) - qVal(c.target)) : 0);

/** Solve: a script that reaches the goal (place: the target tick; jump: a jump sequence). */
export function solve(c: NLConfig): { k: number; jumps: number[] } | null {
  if (!c.target) return null;
  const tk = indexOf(c, c.target);
  if (tk === null) return null;
  if (c.mode !== "jump") return { k: tk, jumps: [] };
  const sk = indexOf(c, c.start);
  if (sk === null) return null;
  const sizes = c.jumps.map((j) => qMul(j, q(c.unit.d, c.unit.n)).n);
  // BFS over positions with ± each size.
  const prev = new Map<number, [number, number]>([[sk, [sk, 0]]]);
  const queue = [sk];
  while (queue.length) {
    const at = queue.shift()!;
    if (at === tk) break;
    for (const s of sizes)
      for (const dir of [1, -1]) {
        const nx = at + dir * s;
        if (nx < 0 || nx > c.ticks || prev.has(nx)) continue;
        prev.set(nx, [at, dir * s]);
        queue.push(nx);
      }
  }
  if (!prev.has(tk)) return null;
  const path: number[] = [];
  for (let at = tk; at !== sk; at = prev.get(at)![0]) path.unshift(prev.get(at)![1]);
  return { k: tk, jumps: path };
}
