// collections@1 — counting, making and comparing sets (maths M02). Pure config + verdicts.
import { clampInt, numbersFrom, rng } from "../kit/math.ts";

export type Mode = "count" | "make" | "compare";
export const MAX_N = 50;

export interface ColConfig {
  mode: Mode;
  n: number;
  left: number;
  right: number;
  question: "more" | "fewer";
  layout: "ten_frame" | "loose";
  glyph: string;
  showCount: "never" | "after_commit" | "live";
  hideAnswer: boolean;
  issues: string[];
}

const GLYPHS: Record<string, string> = { counter: "", seed: "🌰", stick: "🥢", dot: "", mango: "🥭", apple: "🍎", ball: "⚽", star: "⭐" };
export const glyphOf = (k: string) => GLYPHS[k] ?? "";

export function normalize(p: Record<string, unknown>): ColConfig {
  const issues: string[] = [];
  const nums = numbersFrom(p.numbers).filter((x) => Number.isInteger(x) && x >= 0);
  let mode: Mode = p.mode === "count" || p.mode === "make" || p.mode === "compare" ? p.mode : "count";
  if ((p.mode === "show" || p.mode === "predict" || p.mode === undefined) && typeof p.left !== "number" && nums.length >= 2) mode = "compare";
  const cap = (v: number, name: string) => {
    if (v > MAX_N) issues.push(`${name}: ${v} > ${MAX_N} counters; use place-value@1 for big numbers`);
    return Math.min(MAX_N, v);
  };
  const n = cap(clampInt(p.n ?? nums[0], 0, 1000, 10), "n");
  const left = cap(clampInt(p.left ?? nums[0], 0, 1000, 7), "left");
  const right = cap(clampInt(p.right ?? nums[1], 0, 1000, 5), "right");
  return {
    mode,
    n,
    left,
    right,
    question: p.question === "fewer" ? "fewer" : "more",
    layout: p.layout === "loose" || p.layout === "scatter" ? "loose" : "ten_frame",
    glyph: typeof p.item === "string" && p.item in GLYPHS ? p.item : "counter",
    showCount: p.showCount === "live" || p.showCount === "never" ? p.showCount : "after_commit",
    hideAnswer: p.mode === "predict" || p.predict === true,
    issues,
  };
}

/** Compare verdict: "left" | "right" | "same". */
export function compareCorrect(c: Pick<ColConfig, "left" | "right" | "question">, choice: string): boolean {
  if (c.left === c.right) return choice === "same";
  const leftWins = c.question === "more" ? c.left > c.right : c.left < c.right;
  return choice === (leftWins ? "left" : "right");
}
export const compareAnswer = (c: Pick<ColConfig, "left" | "right" | "question">): string =>
  ["left", "right", "same"].find((x) => compareCorrect(c, x))!;

export const countCorrect = (c: Pick<ColConfig, "n">, claimed: number) => claimed === c.n;

/**
 * "Spread side" for compare: the set that is drawn more spread out. A child who picks it when it is not
 * bigger shows the length-for-number (CONSERVATION) confusion; the fact rides on the answer.
 */
export const spreadSide = (c: Pick<ColConfig, "left" | "right">): "left" | "right" => (c.left <= c.right ? "left" : "right");

/** Seeded loose layout positions in a 0..100 box (percent), for compare sets. */
export function loosePositions(count: number, seed: number, spread: boolean): [number, number][] {
  const r = rng(seed);
  const out: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const span = spread ? 88 : 52;
    out.push([6 + r() * span, 6 + r() * (spread ? 80 : 50)]);
  }
  return out;
}
