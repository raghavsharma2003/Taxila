// data-graphs@1 core — tables, tally marks, pictographs and bar graphs; build one from a table or read one
// (maths M08). Pure config + verdicts.
import { clampInt, isNum } from "../kit/math.ts";

export type Mode = "build" | "read";
export type View = "bar" | "pictograph" | "tally" | "table";
export type Question = "most" | "least" | "value" | "total" | "difference";

export interface Cat {
  label: string;
  value: number;
}
export interface DGConfig {
  mode: Mode;
  view: View;
  cats: Cat[];
  scale: number;
  icon: string;
  question: Question;
  ask: number; // index
  askB: number; // index (difference)
  max: number;
  hideAnswer: boolean;
  issues: string[];
  error: string | null;
}

const ICONS: Record<string, string> = { star: "⭐", smile: "🙂", apple: "🍎", book: "📘", ball: "⚽", tree: "🌳", car: "🚗", sun: "☀️", fish: "🐟", flower: "🌼" };
export const iconOf = (k: string) => ICONS[k] ?? "⭐";
const clean = (s: unknown) => String(s ?? "").replace(/[<>{}]/g, "").trim().slice(0, 16);

export function normalize(p: Record<string, unknown>): DGConfig {
  const issues: string[] = [];
  let cats: Cat[] = [];
  if (Array.isArray(p.data)) {
    cats = p.data
      .filter((d): d is { label: unknown; value: unknown } => !!d && typeof d === "object")
      .map((d) => ({ label: clean(d.label), value: Number(d.value) }));
  } else if (Array.isArray(p.labels) && Array.isArray(p.values)) {
    cats = p.labels.map((l, i) => ({ label: clean(l), value: Number((p.values as unknown[])[i]) }));
  }
  const bad = cats.filter((c) => !c.label || !Number.isInteger(c.value) || c.value < 0);
  if (bad.length) issues.push(`data: dropped ${bad.length} rows without a label or a whole-number value`);
  cats = cats.filter((c) => c.label && Number.isInteger(c.value) && c.value >= 0).slice(0, 6);
  if (!cats.length) {
    issues.push("data: none given; using a sample");
    cats = [{ label: "A", value: 4 }, { label: "B", value: 7 }, { label: "C", value: 2 }];
  }
  const scale = clampInt(p.scale, 1, 100, 1);
  const view: View = ["bar", "pictograph", "tally", "table"].includes(p.view as string) ? (p.view as View) : "bar";
  const mode: Mode = p.mode === "build" ? "build" : p.mode === "read" ? "read" : "read";
  const question: Question = ["most", "least", "value", "total", "difference"].includes(p.question as string) ? (p.question as Question) : "most";
  const idx = (v: unknown, d: number) => {
    if (isNum(v)) return clampInt(v, 0, cats.length - 1, d);
    const i = cats.findIndex((c) => c.label.toLowerCase() === String(v ?? "").toLowerCase());
    return i >= 0 ? i : d;
  };
  const ask = idx(p.ask, 0);
  const askB = idx(p.askB, cats.length > 1 ? 1 : 0);
  let error: string | null = null;
  if (mode === "build" && cats.some((c) => c.value % scale !== 0) && view !== "pictograph") error = `build: every value must be a multiple of the scale ${scale}`;
  if (view === "pictograph" && cats.some((c) => (c.value * 2) % scale !== 0)) error = `pictograph: values must be whole or half icons of ${scale}`;
  if (mode === "read" && (question === "most" || question === "least")) {
    const target = question === "most" ? Math.max(...cats.map((c) => c.value)) : Math.min(...cats.map((c) => c.value));
    if (cats.filter((c) => c.value === target).length > 1) error = `read: two categories tie for ${question}`;
  }
  const max = Math.max(scale * 5, Math.ceil(Math.max(...cats.map((c) => c.value)) / scale) * scale);
  return { mode, view, cats, scale, icon: typeof p.icon === "string" ? p.icon : "star", question, ask, askB, max, hideAnswer: p.mode === "predict" || p.predict === true, issues, error };
}

/** The machine answer to a read question: a category index (most/least) or a number. */
export function answerOf(c: Pick<DGConfig, "cats" | "question" | "ask" | "askB">): number {
  const v = c.cats.map((x) => x.value);
  switch (c.question) {
    case "most":
      return v.indexOf(Math.max(...v));
    case "least":
      return v.indexOf(Math.min(...v));
    case "value":
      return v[c.ask];
    case "total":
      return v.reduce((a, b) => a + b, 0);
    case "difference":
      return Math.abs(v[c.ask] - v[c.askB]);
  }
}

export function readCorrect(c: DGConfig, entry: string): boolean {
  if (c.question === "most" || c.question === "least") return Number(entry) === answerOf(c);
  return /^\d+$/.test(entry) && Number(entry) === answerOf(c);
}

/** ICON_IGNORES_KEY: the icons were counted and the key (each icon = scale) ignored. */
export function readMisc(c: DGConfig, entry: string): string | null {
  if (readCorrect(c, entry) || c.question === "most" || c.question === "least" || c.view !== "pictograph" || c.scale === 1) return null;
  return Number(entry) * c.scale === answerOf(c) ? "icon_ignores_key" : null;
}

export const buildCorrect = (c: Pick<DGConfig, "cats">, values: number[]) => c.cats.every((x, i) => values[i] === x.value);

/**
 * Bar view gridline spacing: the smallest of scale × (1, 2, 5, 10, 20, 25, 50, 100) that gives at most 10
 * gridlines up to `max`. A value is readable off the graph iff it is a multiple of this step (shared/engine-catalog.js
 * binds a bar read item only then; tests/engine-catalog.test.mjs pins the two copies together).
 */
export function gridStep(max: number, scale: number): number {
  for (const m of [1, 2, 5, 10, 20, 25, 50, 100]) if (max / (scale * m) <= 10) return scale * m;
  return scale * 100;
}
