// fractions@1 — make, compare, find equivalent and add fractions on bars or circles (maths M04).
// Every verdict is cross-multiplication on small integers.
import { fmtQ, fractionsRaw, parseFracRaw, q, qAdd, qCmp, qEq, type Q } from "../kit/math.ts";

export type Mode = "make" | "compare" | "equivalent" | "add";
export const MAX_D = 24;

export interface FrConfig {
  mode: Mode;
  model: "bar" | "circle";
  fractions: Q[]; // compare: the shown fractions; add: the operands; equivalent: [the given]
  target: Q | null; // make: the target; add: the sum; equivalent: the given
  parts: number; // make: parts of the one shape; add: parts of each result shape; equivalent: fixed parts (0 = child picks)
  wholes: number; // add: result shapes
  question: "bigger" | "smaller";
  equivalentOk: boolean;
  hideAnswer: boolean;
  issues: string[];
  error: string | null;
}

const gcdN = (a: number, b: number): number => (b ? gcdN(b, a % b) : a);
const lcm = (a: number, b: number) => (a * b) / gcdN(a, b);

export function normalize(p: Record<string, unknown>): FrConfig {
  const issues: string[] = [];
  const given = fractionsRaw(p.operands ?? p.fractions);
  const target = p.target !== undefined ? parseFracRaw(p.target) : null;
  if (p.target !== undefined && !target) issues.push(`target: ${JSON.stringify(p.target)} is not a fraction`);
  let mode: Mode = ["make", "compare", "equivalent", "add"].includes(p.mode as string) ? (p.mode as Mode) : "make";
  if (p.mode === "show" || p.mode === "predict" || p.mode === undefined) mode = given.length >= 2 ? "compare" : "make";
  const rep = String(p.representation ?? "").toLowerCase();
  const model = p.model === "circle" || p.model === "bar" ? p.model : /circle|pizza|roti|chapati|cake|pie|circular/.test(rep) ? "circle" : "bar";
  const fr = given.filter((f) => f.n >= 0 && f.d >= 1 && f.d <= MAX_D).slice(0, mode === "compare" ? 3 : 2);
  if (given.length > fr.length) issues.push(`fractions: kept ${fr.length} of ${given.length} (denominators 1-${MAX_D}, ≤ 3 shown)`);
  let error: string | null = null;
  let t: Q | null = null;
  let parts = typeof p.parts === "number" ? Math.round(p.parts) : 0;
  let wholes = 1;
  if (mode === "make") {
    t = target ?? fr[0] ?? q(3, 4);
    if (!parts) parts = t.d;
    if (parts < 1 || parts > MAX_D) {
      issues.push(`parts: ${parts} outside 1-${MAX_D}`);
      parts = Math.min(MAX_D, Math.max(1, t.d));
    }
    if ((t.n * parts) % t.d !== 0 || qCmp(t, q(1)) > 0 || t.n < 0) error = `target ${fmtQ(t)} cannot be shown on one shape of ${parts} parts`;
  } else if (mode === "compare") {
    if (fr.length < 2) {
      error = "compare needs two fractions";
    }
    if (fr.some((f) => qCmp(f, q(1)) > 0)) error = "compare shows proper fractions only (≤ 1)";
  } else if (mode === "equivalent") {
    t = target ?? fr[0] ?? q(1, 2);
    if (qCmp(t, q(1)) > 0) error = "equivalent: the given fraction must be ≤ 1";
    if (parts && (parts > MAX_D || parts === t.d || (t.n * parts) % t.d !== 0)) error = `equivalent: ${fmt(t)} cannot be shown in ${parts} parts`;
  } else {
    if (fr.length < 2) error = "add needs two operands";
    else {
      t = qAdd(fr[0], fr[1]);
      parts = lcm(fr[0].d, fr[1].d);
      if (parts > MAX_D) error = `add: common denominator ${parts} > ${MAX_D}`;
      wholes = Math.max(1, Math.ceil(t.n / t.d));
      if (wholes > 2) error = "add: the sum must be ≤ 2";
    }
  }
  return {
    mode,
    model,
    fractions: fr,
    target: t,
    parts: mode === "equivalent" ? Math.max(0, parts) : Math.max(1, parts),
    wholes,
    question: p.question === "smaller" ? "smaller" : "bigger",
    equivalentOk: p.equivalentOk !== false,
    hideAnswer: p.mode === "predict" || p.predict === true,
    issues,
    error,
  };
}

/** make: shaded of parts shows the target. */
export function makeCorrect(c: Pick<FrConfig, "target" | "equivalentOk">, shaded: number, parts: number): boolean {
  if (!c.target || parts < 1) return false;
  return c.equivalentOk ? qEq(q(shaded, parts), c.target) : shaded === c.target.n && parts === c.target.d;
}

/** compare: index or "same". */
export function compareCorrect(fr: Q[], question: "bigger" | "smaller", pick: string): boolean {
  const allEq = fr.every((f) => qEq(f, fr[0]));
  if (pick === "same") return allEq;
  const i = Number(pick);
  if (!Number.isInteger(i) || !fr[i] || allEq) return false;
  return fr.every((f) => (question === "bigger" ? qCmp(fr[i], f) >= 0 : qCmp(fr[i], f) <= 0));
}

/**
 * Wrong-compare facts: picking the fraction with the bigger denominator as bigger (BIGGER_DENOM) or the
 * one with more pieces shaded regardless of piece size (COUNT_PIECES).
 */
export function compareMisc(fr: Q[], question: "bigger" | "smaller", pick: string): string | null {
  if (compareCorrect(fr, question, pick) || pick === "same") return null;
  const i = Number(pick);
  const f = fr[i];
  if (!f) return null;
  if (question !== "bigger") return null;
  const maxD = Math.max(...fr.map((x) => x.d));
  const maxN = Math.max(...fr.map((x) => x.n));
  // More pieces yet smaller means smaller pieces, so a count_pieces pick always has the bigger denominator
  // too; it is only bigger_denominator on its own when the numerators match (1/4 vs 1/8).
  if (f.n === maxN && fr.filter((x) => x.n === maxN).length === 1) return "count_pieces";
  if (f.d === maxD && fr.every((x) => x.n === f.n)) return "bigger_denominator";
  return null;
}

/** equivalent: a different partition that shows the same value. */
export function equivalentCorrect(given: Q, shaded: number, parts: number): boolean {
  return parts >= 1 && qEq(q(shaded, parts), given) && parts !== given.d;
}

/** add: the shaded result equals the sum; "add_across" = (a+b)/(c+d). */
export const addCorrect = (c: Pick<FrConfig, "target">, shaded: number, parts: number) => !!c.target && qEq(q(shaded, parts), c.target);
export function addMisc(c: Pick<FrConfig, "fractions">, shaded: number, parts: number): string | null {
  const [a, b] = c.fractions;
  if (!a || !b) return null;
  const across = q(a.n + b.n, a.d + b.d);
  return qEq(q(shaded, parts), across) ? "add_across" : null;
}

export const fmt = (f: Q) => `${f.n}/${f.d}`;
