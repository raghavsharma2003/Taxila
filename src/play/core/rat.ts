// Exact rationals and small number theory for the play laws (the law never rounds). Pure; client and server import it.

export interface Rat { n: number; d: number }
export function gcd(a: number, b: number): number { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
export function rat(n: number, d = 1): Rat {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`bad rational ${n}/${d}`);
  const s = d < 0 ? -1 : 1, g = gcd(n, d);
  return { n: (s * n) / g, d: (s * d) / g };
}
export const add = (a: Rat, b: Rat) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rat, b: Rat) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rat, b: Rat) => rat(a.n * b.n, a.d * b.d);
export const div = (a: Rat, b: Rat) => rat(a.n * b.d, a.d * b.n);
export const cmp = (a: Rat, b: Rat) => Math.sign(a.n * b.d - b.n * a.d);
export const eq = (a: Rat, b: Rat) => a.n * b.d === b.n * a.d;
export const num = (a: Rat) => a.n / a.d;
export const ratStr = (a: Rat) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
/** "3/4" → {3,4}; "1 1/2" → {3,2}; "0.35" → {7,20}; "-3" → {-3,1}; null when unreadable. */
export function parseRat(s: string): Rat | null {
  const t = s.trim().replace(/−/g, "-");
  let m = /^(-?\d+)\s+(\d+)\/(\d+)$/.exec(t);
  if (m) { const w = +m[1], n = +m[2], d = +m[3]; if (!d) return null; return rat((Math.abs(w) * d + n) * (w < 0 ? -1 : 1), d); }
  m = /^(-?\d+)\/(\d+)$/.exec(t); if (m) return +m[2] ? rat(+m[1], +m[2]) : null;
  m = /^(-?)(\d*)\.(\d+)$/.exec(t); if (m) { const d = 10 ** m[3].length; return rat((m[1] ? -1 : 1) * (+(m[2] || "0") * d + +m[3]), d); }
  m = /^-?\d+$/.exec(t); if (m) return rat(+t, 1);
  return null;
}

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}
/** Prime factors with multiplicity, ascending. */
export function primeFactors(n: number): number[] {
  const out: number[] = []; let m = n;
  for (let p = 2; p * p <= m; p++) while (m % p === 0) { out.push(p); m /= p; }
  if (m > 1) out.push(m);
  return out;
}
/** Ω(n): number of prime factors with multiplicity. */
export const bigOmega = (n: number) => primeFactors(n).length;
/** Factor pairs a ≤ b with a·b = n, 1 < a. */
export function factorPairs(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 2; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]);
  return out;
}
/** The pair nearest √n (the "natural" first split a child reaches for). */
export function naturalPair(n: number): [number, number] | null { const ps = factorPairs(n); return ps.length ? ps[ps.length - 1] : null; }
/** Multiset intersection of two ascending prime lists. */
export function commonPrimes(a: number[], b: number[]): number[] {
  const out: number[] = []; let i = 0, j = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { out.push(a[i]); i++; j++; } else if (a[i] < b[j]) i++; else j++; }
  return out;
}
export const product = (xs: number[]) => xs.reduce((p, x) => p * x, 1);
