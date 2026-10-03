// patterns@1 core — repeating patterns, growing number sequences and number-grid rules (maths M10).
import { clampInt, numbersFrom } from "../kit/math.ts";

export type Mode = "repeat" | "grow" | "grid";
export type Rule = { kind: "add" | "mul"; k: number } | { kind: "quad"; a: number; b: number; c: number };

export interface PTConfig {
  mode: Mode;
  core: string[];
  shown: number;
  blanks: number;
  tray: string[];
  terms: number[]; // grow: the given terms
  rule: Rule | null;
  gridStart: number;
  gridCount: number;
  gridRule: { kind: "multiples" | "even" | "odd" | "ends"; k: number };
  hideAnswer: boolean;
  issues: string[];
  error: string | null;
}

export const SHAPES = ["circle", "square", "triangle", "star", "diamond", "heart"] as const;
export const COLOURS = ["red", "blue", "green", "yellow", "orange", "purple"] as const;
const TOKEN_RE = /^(?:(red|blue|green|yellow|orange|purple)-)?(circle|square|triangle|star|diamond|heart)$|^[A-Za-z0-9]{1,3}$/;

/** Fit a rule to the given terms: constant difference, constant integer ratio, or constant second difference. */
export function inferRule(t: number[]): Rule | null {
  if (t.length < 3) return t.length === 2 ? { kind: "add", k: t[1] - t[0] } : null;
  const d = t.slice(1).map((x, i) => x - t[i]);
  if (d.every((x) => x === d[0])) return { kind: "add", k: d[0] };
  if (t.every((x) => x !== 0)) {
    const r = t[1] / t[0];
    if (Number.isInteger(r) && t.slice(1).every((x, i) => x === t[i] * r)) return { kind: "mul", k: r };
  }
  const dd = d.slice(1).map((x, i) => x - d[i]);
  if (dd.length >= 1 && dd[0] !== 0 && dd.every((x) => x === dd[0])) {
    // t(n) = a n² + b n + c with n from 0
    const a = dd[0] / 2;
    const b = d[0] - a;
    return { kind: "quad", a, b, c: t[0] };
  }
  return null;
}

export function termAt(rule: Rule, terms: number[], n: number): number {
  if (rule.kind === "quad") return rule.a * n * n + rule.b * n + rule.c;
  return rule.kind === "add" ? terms[0] + rule.k * n : terms[0] * rule.k ** n;
}

function parseRule(v: unknown): Rule | null {
  if (typeof v !== "string") return null;
  const m = v.match(/^(add|mul):(-?\d+)$/);
  if (m) return { kind: m[1] as "add" | "mul", k: Number(m[2]) };
  if (v === "square") return { kind: "quad", a: 1, b: 2, c: 1 }; // 1, 4, 9 … from n = 0
  if (v === "triangular") return { kind: "quad", a: 0.5, b: 1.5, c: 1 }; // 1, 3, 6 …
  return null;
}

export function normalize(p: Record<string, unknown>): PTConfig {
  const issues: string[] = [];
  const nums = numbersFrom(p.numbers).filter(Number.isInteger);
  let mode: Mode = p.mode === "repeat" || p.mode === "grow" || p.mode === "grid" ? p.mode : "repeat";
  if ((p.mode === "show" || p.mode === "predict" || p.mode === undefined) && !Array.isArray(p.core)) mode = nums.length >= 3 || Array.isArray(p.sequence) ? "grow" : "repeat";
  let core = Array.isArray(p.core) ? p.core.map(String).filter((x) => TOKEN_RE.test(x)).slice(0, 4) : [];
  if (Array.isArray(p.core) && core.length !== p.core.length) issues.push("core: tokens must be shapes ('red-circle') or ≤ 3 letters/digits");
  if (!core.length) core = ["red-circle", "blue-square"];
  const blanks = clampInt(p.blanks, 1, 6, mode === "repeat" ? Math.min(4, core.length * 2) : 2);
  const shown = clampInt(p.shown, 1, 12, mode === "repeat" ? core.length * 2 : 4);
  const distract = Array.isArray(p.distractors) ? p.distractors.map(String).filter((x) => TOKEN_RE.test(x)).slice(0, 2) : [];
  const tray = [...new Set([...core, ...distract])];
  const seq = (Array.isArray(p.sequence) ? numbersFrom(p.sequence) : nums).slice(0, 10);
  let rule = parseRule(p.rule) ?? (seq.length ? inferRule(seq) : null);
  let terms = seq.length ? seq : rule ? [] : [2, 4, 6, 8];
  if (!rule && mode === "grow") rule = inferRule(terms);
  if (rule && !terms.length) terms = Array.from({ length: shown }, (_, n) => termAt(rule!, [rule!.kind === "quad" ? rule!.c : 1], n));
  let error: string | null = null;
  if (mode === "grow" && !rule) error = `grow: no add / multiply / square rule fits ${terms.join(", ")}`;
  if (mode === "grow" && rule && terms.some((x, n) => termAt(rule!, terms, n) !== x)) error = `grow: the rule does not fit ${terms.join(", ")}`;
  const gr = String(p.gridRule ?? "");
  const gm = gr.match(/^(multiples|ends):(\d+)$/);
  const gridRule = gm ? { kind: gm[1] as "multiples" | "ends", k: Number(gm[2]) } : gr === "even" || gr === "odd" ? { kind: gr as "even" | "odd", k: 2 } : { kind: "multiples" as const, k: nums[0] && nums[0] <= 12 ? nums[0] : 3 };
  return {
    mode,
    core,
    shown,
    blanks,
    tray,
    terms,
    rule,
    gridStart: clampInt(p.gridStart, 0, 1000, 1),
    gridCount: clampInt(p.gridCount, 6, 36, 30),
    gridRule,
    hideAnswer: p.mode === "predict" || p.predict === true,
    issues,
    error,
  };
}

/** repeat: the expected token for blank i. */
export const repeatAt = (c: Pick<PTConfig, "core" | "shown">, i: number) => c.core[(c.shown + i) % c.core.length];
export function repeatCorrect(c: Pick<PTConfig, "core" | "shown" | "blanks">, slots: (string | null)[]): boolean {
  return slots.length === c.blanks && slots.every((s, i) => s === repeatAt(c, i));
}
export const firstWrong = (c: Pick<PTConfig, "core" | "shown">, slots: (string | null)[]) => slots.findIndex((s, i) => s !== repeatAt(c, i));

/** grow: blank i is term number terms.length + i. */
export const growAt = (c: Pick<PTConfig, "rule" | "terms">, i: number) => (c.rule ? termAt(c.rule, c.terms, c.terms.length + i) : NaN);
export function growCorrect(c: Pick<PTConfig, "rule" | "terms" | "blanks">, entries: string[]): boolean {
  return entries.length === c.blanks && entries.every((e, i) => /^-?\d+$/.test(e) && Number(e) === growAt(c, i));
}

export function gridMember(rule: PTConfig["gridRule"], n: number): boolean {
  switch (rule.kind) {
    case "multiples":
      return n % rule.k === 0;
    case "even":
      return n % 2 === 0;
    case "odd":
      return n % 2 !== 0;
    case "ends":
      return n % 10 === rule.k;
  }
}
export function gridCorrect(c: Pick<PTConfig, "gridRule" | "gridStart" | "gridCount">, marked: Set<number>): boolean {
  for (let n = c.gridStart; n < c.gridStart + c.gridCount; n++) if (gridMember(c.gridRule, n) !== marked.has(n)) return false;
  return true;
}
