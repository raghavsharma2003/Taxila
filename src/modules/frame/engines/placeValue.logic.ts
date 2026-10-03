// place-value@1 — build, read and compare numbers by place (maths M03). Pure config + verdicts.
import { clampInt, numbersFrom } from "../kit/math.ts";
import { tri, type Tri } from "../kit/i18n.ts";

export type Mode = "build" | "read" | "compare";
export const MAX_PLACES = 7;

export const PLACE_NAMES_IN: Tri[] = [
  tri("Ones", "Ikai", "इकाई"),
  tri("Tens", "Dahai", "दहाई"),
  tri("Hundreds", "Saikda", "सैकड़ा"),
  tri("Thousands", "Hazaar", "हज़ार"),
  tri("Ten thousands", "Das hazaar", "दस हज़ार"),
  tri("Lakhs", "Lakh", "लाख"),
  tri("Ten lakhs", "Das lakh", "दस लाख"),
];
export const PLACE_NAMES_INTL: Tri[] = [
  ...PLACE_NAMES_IN.slice(0, 5),
  tri("Hundred thousands", "Sau hazaar", "सौ हज़ार"),
  tri("Millions", "Million", "मिलियन"),
];

export interface PVConfig {
  mode: Mode;
  value: number;
  a: number;
  b: number;
  question: "bigger" | "smaller";
  places: number;
  grouping: "indian" | "international";
  readout: "live" | "after";
  /** build: the number as the child is asked it (its name in words, from the kit prompt); hides the numeral. */
  name: string | null;
  /** read: the pieces shown per place (ones first), when the item gives them ("3 tens 14 ones"); may exceed 9. */
  counts: number[] | null;
  hideAnswer: boolean;
  issues: string[];
}

const digits = (n: number) => String(Math.abs(Math.trunc(n))).length;

export function normalize(p: Record<string, unknown>): PVConfig {
  const issues: string[] = [];
  const nums = numbersFrom(p.numbers).filter((x) => Number.isInteger(x) && x >= 0);
  let mode: Mode = p.mode === "build" || p.mode === "read" || p.mode === "compare" ? p.mode : "build";
  if ((p.mode === "show" || p.mode === "predict" || p.mode === undefined) && typeof p.a !== "number" && nums.length >= 2) mode = "compare";
  if (p.mode === "predict" && nums.length < 2) mode = "read";
  const maxV = 10 ** MAX_PLACES - 1;
  const countsIn = Array.isArray(p.counts) && p.counts.length >= 1 && p.counts.length <= MAX_PLACES && p.counts.every((n) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 19)
    ? (p.counts as number[]) : null;
  if (p.counts !== undefined && !countsIn) issues.push("counts: 1-7 places of 0-19 pieces (ones first)");
  if (countsIn && p.mode === undefined) mode = "read";
  const counts = countsIn && mode === "read" ? countsIn : null;
  const value = counts ? total(counts) : clampInt(p.value ?? nums[0], 0, maxV, 345);
  if (typeof p.value === "number" && p.value > maxV) issues.push(`value: above ${maxV}`);
  const a = clampInt(p.a ?? nums[0], 0, maxV, 305);
  const b = clampInt(p.b ?? nums[1], 0, maxV, 350);
  const need = mode === "compare" ? Math.max(digits(a), digits(b)) : Math.max(digits(value), counts?.length ?? 0);
  let places = clampInt(p.places, 1, MAX_PLACES, Math.max(need, mode === "build" ? 3 : 1));
  if (places < need) {
    issues.push(`places: ${places} cannot show ${need} digits`);
    places = need;
  }
  return {
    mode,
    value,
    a,
    b,
    question: p.question === "smaller" ? "smaller" : "bigger",
    places,
    grouping: p.grouping === "international" ? "international" : "indian",
    readout: p.readout === "live" ? "live" : "after",
    name: typeof p.name === "string" && /^[\p{L}\p{M}\s,'-]{2,80}$/u.test(p.name) ? p.name.trim() : null,
    counts,
    hideAnswer: p.mode === "predict" || p.predict === true,
    issues,
  };
}

/** counts[p] = how many pieces in place p (ones = 0); may exceed 9 before an exchange. */
export const total = (counts: number[]): number => counts.reduce((s, c, p) => s + c * 10 ** p, 0);
export const digitsOf = (n: number, places: number): number[] => Array.from({ length: places }, (_, p) => Math.floor(n / 10 ** p) % 10);

/** Trade 10 pieces of place p for 1 of place p+1 (up) or 1 of p for 10 of p−1 (down). */
export function exchange(counts: number[], p: number, dir: "up" | "down"): number[] | null {
  const c = [...counts];
  if (dir === "up") {
    if (p + 1 >= c.length || c[p] < 10) return null;
    c[p] -= 10;
    c[p + 1] += 1;
  } else {
    if (p === 0 || c[p] < 1) return null;
    c[p] -= 1;
    c[p - 1] += 10;
  }
  return c;
}

export const buildCorrect = (c: Pick<PVConfig, "value">, counts: number[]) => total(counts) === c.value;

export function readCorrect(c: Pick<PVConfig, "value">, entry: string): boolean {
  return /^\d+$/.test(entry.replace(/,/g, "")) && Number(entry.replace(/,/g, "")) === c.value;
}

/**
 * Facts for a wrong reading:
 * - concat_expanded: the place values written side by side (305 → "3005", "30005") — CONCAT_EXPANDED
 * - zero_dropped: the zero placeholder left out (305 → "35") — ZERO_PLACEHOLDER
 */
export function readMisc(c: Pick<PVConfig, "value">, entry: string): string | null {
  const v = String(c.value);
  const e = entry.replace(/,/g, "");
  if (e === v) return null;
  const parts = [...v].map((d, i) => (d === "0" ? "" : d + "0".repeat(v.length - 1 - i))).filter(Boolean);
  if (parts.length > 1 && e === parts.join("")) return "concat_expanded";
  if (v.includes("0") && e === v.replace(/0/g, "")) return "zero_dropped";
  return null;
}

export function compareCorrect(c: Pick<PVConfig, "a" | "b" | "question">, pick: string): boolean {
  if (c.a === c.b) return pick === "same";
  const aWins = c.question === "bigger" ? c.a > c.b : c.a < c.b;
  return pick === (aWins ? "a" : "b");
}
