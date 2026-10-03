// multiply-divide@1 — arrays, fair sharing and factor rectangles (maths M05). Pure config + verdicts.
import { clampInt, numbersFrom } from "../kit/math.ts";

export type Mode = "array" | "share" | "factors";
export const MAX_SIDE = 12;
export const MAX_SHARE = 100;

export interface MDConfig {
  mode: Mode;
  a: number | null; // rows (array)
  b: number | null; // cols (array)
  product: number | null; // array goal when only the product is given
  n: number; // share / factors
  k: number; // share: plates
  orderMatters: boolean;
  /** array: "product" = the child builds the array and TYPES the total; the verdict is on that number alone. */
  ask: "array" | "product";
  /** array/product: show "a × b" in the prompt (false for a word problem, where choosing to multiply is the task). */
  showExpr: boolean;
  hideAnswer: boolean;
  issues: string[];
  error: string | null;
}

export function normalize(p: Record<string, unknown>): MDConfig {
  const issues: string[] = [];
  const nums = numbersFrom(p.numbers).filter((x) => Number.isInteger(x) && x > 0);
  let mode: Mode = p.mode === "array" || p.mode === "share" || p.mode === "factors" ? p.mode : "array";
  if (p.mode === "show" || p.mode === "predict" || p.mode === undefined) mode = nums.length === 1 && typeof p.a !== "number" ? "factors" : "array";
  const has = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  let a = has(p.a) ? clampInt(p.a, 1, MAX_SIDE, 3) : mode === "array" && nums.length >= 2 ? clampInt(nums[0], 1, MAX_SIDE, 3) : null;
  let b = has(p.b) ? clampInt(p.b, 1, MAX_SIDE, 4) : mode === "array" && nums.length >= 2 ? clampInt(nums[1], 1, MAX_SIDE, 4) : null;
  const product = has(p.product) ? clampInt(p.product, 1, MAX_SIDE * MAX_SIDE, 12) : null;
  if (mode === "array" && a === null && b === null && product === null) {
    a = 3;
    b = 4;
  }
  if ((has(p.a) && (p.a as number) > MAX_SIDE) || (has(p.b) && (p.b as number) > MAX_SIDE)) issues.push(`a/b: sides are capped at ${MAX_SIDE}`);
  const n = clampInt(p.n ?? nums[0], 1, MAX_SHARE, 12);
  const k = clampInt(p.k ?? nums[1], 1, 10, 3);
  if (mode === "share" && typeof p.n === "number" && p.n > MAX_SHARE) issues.push(`n: sharing is capped at ${MAX_SHARE}`);
  let error: string | null = null;
  if (mode === "array" && product !== null && a === null && b === null && !factorPairs(product).some(([r, c]) => r <= MAX_SIDE && c <= MAX_SIDE)) error = `no array up to ${MAX_SIDE}×${MAX_SIDE} makes ${product}`;
  if (mode === "factors" && factorPairs(n).some(([, c]) => c > MAX_SIDE * 5)) issues.push("factors: large factor pairs are drawn as thin strips");
  const ask = mode === "array" && p.ask === "product" && a !== null && b !== null ? "product" : "array";
  if (p.ask === "product" && ask !== "product") issues.push("ask: product needs array mode with a and b");
  return { mode, a, b, product, n, k, orderMatters: p.orderMatters === true, ask, showExpr: p.showExpr !== false, hideAnswer: p.mode === "predict" || p.predict === true, issues, error };
}

export function arrayCorrect(c: Pick<MDConfig, "a" | "b" | "product" | "orderMatters">, rows: number, cols: number): boolean {
  if (c.a !== null && c.b !== null) return (rows === c.a && cols === c.b) || (!c.orderMatters && rows === c.b && cols === c.a);
  if (c.product !== null) return rows * cols === c.product;
  if (c.a !== null) return rows === c.a;
  return false;
}

/** Product entry: the typed total must be a × b exactly (digits only). */
export function productCorrect(c: Pick<MDConfig, "a" | "b">, entry: string): boolean {
  return c.a !== null && c.b !== null && /^\d+$/.test(entry) && Number(entry) === c.a * c.b;
}

/** Share: each plate holds floor(n/k) and the leftover is n mod k. */
export function shareCorrect(c: Pick<MDConfig, "n" | "k">, plates: number[]): boolean {
  const each = Math.floor(c.n / c.k);
  const given = plates.reduce((s, x) => s + x, 0);
  return plates.length === c.k && plates.every((x) => x === each) && c.n - given === c.n % c.k;
}
export const shareUnequal = (plates: number[]) => plates.some((x) => x !== plates[0]);

/** All unordered factor pairs [r, c] with r ≤ c and r·c = n. */
export function factorPairs(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 1; r * r <= n; r++) if (n % r === 0) out.push([r, n / r]);
  return out;
}
export const pairKey = (r: number, c: number) => (r <= c ? `${r}x${c}` : `${c}x${r}`);
export function factorsCorrect(n: number, found: Set<string>): boolean {
  const all = factorPairs(n).map(([r, c]) => pairKey(r, c));
  return all.length === found.size && all.every((k) => found.has(k));
}
