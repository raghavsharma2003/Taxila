// fraction-bars@1 — pure state and checking rules (no React), so the verdicts the engine reports can be
// tested exactly. Every `correct` / goal decision here is integer arithmetic on the bars, never a guess.

export interface Fraction {
  n: number;
  d: number;
}
export type Question = "bigger" | "smaller";
export type Choice = number | "same";

export const MAX_BARS = 3;
export const MAX_PARTS = 12;
/** Shade changes without reaching the target before the engine reports `stuck`. */
export const STUCK_AFTER_CHANGES = 12;
/** Wrong compare answers before the engine reports `stuck`. */
export const STUCK_AFTER_WRONG = 2;

export interface BarsConfig {
  denominators: number[];
  numerators: number[];
  locked: boolean[];
  mode: "shade" | "compare";
  target: Fraction | null;
  targetBar: number;
  equivalentOk: boolean;
  question: Question;
  showLabels: boolean;
  issues: string[];
}

export const fmt = (f: Fraction): string => `${f.n}/${f.d}`;

export function parseFraction(s: unknown): Fraction | null {
  if (typeof s !== "string") return null;
  const m = s.trim().match(/^(\d{1,3})\s*\/\s*(\d{1,3})$/);
  if (!m) return null;
  const f = { n: Number(m[1]), d: Number(m[2]) };
  return f.d >= 1 ? f : null;
}

/** a ≡ b by cross-multiplication (exact for the small integers bars use). */
export const sameValue = (a: Fraction, b: Fraction): boolean => a.n * b.d === b.n * a.d;
const cmp = (a: Fraction, b: Fraction): number => a.n * b.d - b.n * a.d;

const int = (v: unknown, lo: number, hi: number, dflt: number): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : dflt;

/** Turn resolved params into a bar configuration, recording anything that had to be corrected. */
export function normalizeConfig(p: Record<string, unknown>): BarsConfig {
  const issues: string[] = [];
  const rawD = Array.isArray(p.denominators) ? p.denominators : [];
  let denominators = rawD.slice(0, MAX_BARS).map((d) => int(d, 1, MAX_PARTS, 4));
  if (rawD.length > MAX_BARS) issues.push(`denominators: only ${MAX_BARS} bars are shown`);
  if (!denominators.length) {
    denominators = [4];
    issues.push("denominators: none given, using [4]");
  }
  const rawN = Array.isArray(p.numerators) ? p.numerators : [];
  const numerators = denominators.map((d, i) => int(rawN[i], 0, d, 0));
  const mode = p.mode === "compare" ? "compare" : "shade";
  const rawL = Array.isArray(p.locked) ? p.locked : [];
  // In compare mode the bars are the question, so none of them can be re-shaded.
  const locked = denominators.map((_, i) => mode === "compare" || rawL[i] === true);

  let target = parseFraction(p.target);
  if (p.target && !target) issues.push(`target: ${JSON.stringify(p.target)} is not a fraction like "3/4"`);
  if (mode === "compare") target = null;
  const firstOpen = locked.findIndex((l) => !l);
  let targetBar = typeof p.targetBar === "number" ? int(p.targetBar, 0, denominators.length - 1, 0) : Math.max(0, firstOpen);
  if (target && locked[targetBar]) {
    issues.push(`targetBar: bar ${targetBar + 1} is locked`);
    targetBar = Math.max(0, firstOpen);
  }
  return {
    denominators,
    numerators,
    locked,
    mode,
    target,
    targetBar,
    equivalentOk: p.equivalentOk !== false,
    question: p.question === "smaller" ? "smaller" : "bigger",
    showLabels: p.showLabels !== false,
    issues,
  };
}

/** Parts shaded from the left, per bar. */
export function initialShading(cfg: BarsConfig): boolean[][] {
  return cfg.denominators.map((d, i) => Array.from({ length: d }, (_, k) => k < cfg.numerators[i]));
}

export const countShaded = (row: readonly boolean[]): number => row.filter(Boolean).length;

export function toggle(shading: boolean[][], bar: number, part: number): boolean[][] {
  return shading.map((row, b) => (b === bar ? row.map((v, k) => (k === part ? !v : v)) : row));
}

/** +1 shades the leftmost empty part, -1 clears the rightmost shaded one. */
export function step(shading: boolean[][], bar: number, dir: 1 | -1): boolean[][] {
  const row = shading[bar];
  const k = dir > 0 ? row.indexOf(false) : row.lastIndexOf(true);
  return k < 0 ? shading : toggle(shading, bar, k);
}

/** Parts the target bar needs shaded to show the target, or null if it cannot show it. */
export function partsForTarget(cfg: BarsConfig): number | null {
  const t = cfg.target;
  if (!t) return null;
  const d = cfg.denominators[cfg.targetBar];
  if (!cfg.equivalentOk) return t.d === d && t.n <= d ? t.n : null;
  return (t.n * d) % t.d === 0 && (t.n * d) / t.d <= d ? (t.n * d) / t.d : null;
}

export function goalReached(cfg: BarsConfig, shading: boolean[][]): boolean {
  const t = cfg.target;
  if (!t) return false;
  const d = cfg.denominators[cfg.targetBar];
  const n = countShaded(shading[cfg.targetBar]);
  return cfg.equivalentOk ? sameValue({ n, d }, t) : n === t.n && d === t.d;
}

/** Is `choice` a right answer to "which is bigger/smaller?" ("same" is right iff all bars are equal). */
export function compareCorrect(fractions: Fraction[], question: Question, choice: Choice): boolean {
  const allEqual = fractions.every((f) => sameValue(f, fractions[0]));
  if (choice === "same") return allEqual;
  const pick = fractions[choice];
  if (!pick || allEqual) return false;
  return fractions.every((f) => (question === "bigger" ? cmp(pick, f) >= 0 : cmp(pick, f) <= 0));
}

/** The bars that are right answers (for reveal). Empty when "same" is the answer. */
export function correctBars(fractions: Fraction[], question: Question): number[] {
  return fractions.map((_, i) => i).filter((i) => compareCorrect(fractions, question, i));
}
