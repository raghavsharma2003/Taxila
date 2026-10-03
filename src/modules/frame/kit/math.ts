// Exact arithmetic for engine verdicts. Every `correct` an engine reports is computed here on integers
// (rationals n/d), so "0.5", "1/2", "2/4" and "½" compare equal and no float rounding decides a grade.

export interface Q {
  n: number; // numerator (sign lives here)
  d: number; // denominator > 0
}

export const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

export function q(n: number, d = 1): Q {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`bad rational ${n}/${d}`);
  if (d < 0) [n, d] = [-n, -d];
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export const qEq = (a: Q, b: Q): boolean => a.n * b.d === b.n * a.d;
export const qCmp = (a: Q, b: Q): number => a.n * b.d - b.n * a.d;
export const qAdd = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const qSub = (a: Q, b: Q): Q => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const qMul = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d);
export const qVal = (a: Q): number => a.n / a.d;
export const qIsInt = (a: Q): boolean => a.d === 1;

/** A finite JS number as an exact rational (decimals up to 6 places). */
export function qFromNumber(x: number): Q | null {
  if (!Number.isFinite(x)) return null;
  for (let p = 0; p <= 6; p++) {
    const s = x * 10 ** p;
    if (Math.abs(s - Math.round(s)) < 1e-9) return q(Math.round(s), 10 ** p);
  }
  return null;
}

const VULGAR: Record<string, string> = { "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4", "⅕": "1/5", "⅛": "1/8" };
const DEVA = "०१२३४५६७८९";

/**
 * A MathValue string → exact rational: "3/4", "-3", "0.25", "1 1/2", "₹37", "12 cm", "−5", "३/४".
 * Returns null for anything that is not one number.
 */
export function parseQ(raw: unknown): Q | null {
  if (typeof raw === "number") return qFromNumber(raw);
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  for (const [k, v] of Object.entries(VULGAR)) s = s.replace(k, ` ${v}`);
  s = s.replace(/[०-९]/g, (c) => String(DEVA.indexOf(c))).replace(/[−–]/g, "-").replace(/,/g, "");
  s = s.replace(/^(?:₹|rs\.?)\s*/i, "").replace(/\s*(?:°\s*c|cm|mm|km|kg|g|ml|l|m|s|units?|sq\.?\s*(?:cm|m|units?))\s*$/i, "").trim();
  let m = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/); // mixed number
  if (m) {
    const d = Number(m[4]);
    if (!d) return null;
    const v = q(Number(m[2]) * d + Number(m[3]), d);
    return m[1] ? q(-v.n, v.d) : v;
  }
  m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[2]) ? q(Number(m[1]), Number(m[2])) : null;
  m = s.match(/^-?\d*\.?\d+$/);
  if (m) return qFromNumber(Number(s));
  return null;
}

export function fmtQ(a: Q, kind: "fraction" | "decimal" | "mixed" = "fraction"): string {
  if (a.d === 1) return String(a.n);
  if (kind === "decimal") {
    const v = a.n / a.d;
    return String(Math.round(v * 1e6) / 1e6);
  }
  if (kind === "mixed" && Math.abs(a.n) > a.d) {
    const whole = Math.trunc(a.n / a.d);
    return `${whole} ${Math.abs(a.n % a.d)}/${a.d}`;
  }
  return `${a.n}/${a.d}`;
}

/** Same value? Accepts anything parseQ accepts on either side. */
export function sameValue(a: unknown, b: unknown): boolean {
  const x = parseQ(a as string);
  const y = parseQ(b as string);
  return !!x && !!y && qEq(x, y);
}

export const clampInt = (v: unknown, lo: number, hi: number, dflt: number): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : dflt;

export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** "Fractions" from the Director's extractValues ([[n, d], …]) or strings ("3/4"). */
export function fractionsFrom(v: unknown): Q[] {
  if (!Array.isArray(v)) return [];
  const out: Q[] = [];
  for (const f of v) {
    if (Array.isArray(f) && f.length === 2 && Number.isInteger(f[0]) && Number.isInteger(f[1]) && f[1] > 0) out.push(q(f[0], f[1]));
    else {
      const p = parseQ(f);
      if (p) out.push(p);
    }
  }
  return out;
}

export function numbersFrom(v: unknown): number[] {
  return Array.isArray(v) ? v.filter(isNum) : [];
}

/** Deterministic PRNG (mulberry32) for seeded layouts. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** "2/4" or [2, 4] as written (NOT reduced: a quarters bar must show 2/4, not 1/2); else parseQ's value. */
export function parseFracRaw(v: unknown): Q | null {
  if (Array.isArray(v) && v.length === 2 && Number.isInteger(v[0]) && Number.isInteger(v[1]) && v[1] > 0) return { n: v[0], d: v[1] };
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m && Number(m[2]) > 0) return { n: Number(m[1]), d: Number(m[2]) };
  }
  return parseQ(v as string);
}
export function fractionsRaw(v: unknown): Q[] {
  return Array.isArray(v) ? v.map(parseFracRaw).filter((f): f is Q => !!f) : [];
}
