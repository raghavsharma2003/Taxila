// fraction-ops@1 — Fraction Works (VALUES-100 V3.1: operations on fractions and decimals as quantities;
// c4 ch5-t02, c5 ch2, c6 ch7-t05, c7 ch8, c7 ch12).
//   orchard — harvest a/b OF c/d of a field: cut it into columns and rows and shade them; the overlap is harvested
//   scoop   — how many scoops of `part` fill `whole`? scoop until it is full (division as measuring)
//   join    — add or take away two fractions: re-cut both bars into a number of equal parts that BOTH fit; only a
//             common multiple lines the cuts up, and then the pieces pour into the answer bar
// Truth is exact rational arithmetic; any equivalent construction that gives the right amount is right.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, gcdN, isObj, lcmN, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

const FO_STRINGS = { round: "Round", done: "right", cols: "columns", rows: "rows", shade: "shade", harvest: "HARVEST", scoop: "SCOOP", full: "FULL", cut: "parts", pour: "POUR", runDone: "Works closed", of: "of", the: "the field", scoops: "scoops", plus: "+", minus: "−" };
const Fr = z.tuple([z.number().int().min(0).max(24), z.number().int().min(1).max(24)]);
const FoRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("orchard"), title: z.string().min(1).max(22), sub: z.string().max(40), a: Fr, b: Fr, ...TargetsField }),
  z.object({ mode: z.literal("scoop"), title: z.string().min(1).max(22), sub: z.string().max(40), whole: Fr, part: Fr, unit: z.string().min(1).max(10), ...TargetsField }),
  z.object({ mode: z.literal("join"), title: z.string().min(1).max(22), sub: z.string().max(40), a: Fr, b: Fr, op: z.enum(["+", "-"]), ...TargetsField }),
]);
export type FoRoundT = z.infer<typeof FoRound>;
export const FracOpsSchema = z.object({ archetype: z.literal("fraction-ops@1"), ...EnvelopeExt, strings: stringsSchema(FO_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(FoRound).min(1).max(4) });
export type FracOpsSpec = z.infer<typeof FracOpsSchema>;
export type F = [number, number];
export const fmul = (x: F, y: F): F => { const n = x[0] * y[0], d = x[1] * y[1], g = gcdN(n, d); return [n / g, d / g]; };
export const fdiv = (x: F, y: F): number => (x[0] * y[1]) / (x[1] * y[0]);
export const fadd = (x: F, y: F, sgn = 1): F => { const d = lcmN(x[1], y[1]), n = x[0] * (d / x[1]) + sgn * y[0] * (d / y[1]), g = gcdN(Math.abs(n), d); return [n / g, d / g]; };
export const feq = (x: F, y: F) => x[0] * y[1] === y[0] * x[1];
export const fstr = (x: F) => (x[1] === 1 ? String(x[0]) : x[0] > x[1] && x[1] > 1 ? `${Math.floor(x[0] / x[1])} ${x[0] % x[1]}/${x[1]}` : `${x[0]}/${x[1]}`);

const foDefault: FracOpsSpec = {
  archetype: "fraction-ops@1", skills: ["c7-maths-ch08-t01", "c7-maths-ch08-t02", "c6-maths-ch07-t05"], lang: "en", strings: { ...FO_STRINGS }, title: "Fraction Works",
  rounds: [
    { mode: "orchard", title: "Orchard", sub: "harvest 2/3 of 3/4 of the field", a: [2, 3], b: [3, 4], targets: "c7-maths-ch08-t01-m1" },
    { mode: "scoop", title: "Scoops", sub: "how many 1/4-cup scoops in 3 cups?", whole: [3, 1], part: [1, 4], unit: "cups" },
    { mode: "join", title: "Join the bars", sub: "1/3 + 1/4", a: [1, 3], b: [1, 4], op: "+" },
  ],
};
const fr = (v: unknown, r: string[], k: string): F | null => (Array.isArray(v) && v.length === 2 && Number.isInteger(v[0]) && Number.isInteger(v[1]) && v[1] >= 1 && v[1] <= 24 && v[0] >= 0 && v[0] <= 24 ? [v[0], v[1]] : (r.push("frac:" + k), null));
function repairFo(raw: Record<string, unknown>, r: string[]): FracOpsSpec | null {
  const env = envelope(raw, foDefault, r);
  const rounds: FoRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Fractions", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["orchard", "scoop", "join"] as const, "orchard", "mode", r);
    if (mode === "orchard") { const a = fr(x.a, r, "a"), b = fr(x.b, r, "b"); if (!a || !b || a[0] === 0 || b[0] === 0 || a[0] > a[1] || b[0] > b[1] || a[1] > 12 || b[1] > 12) { r.push("orchard:proper-fractions-up-to-twelfths"); continue; } rounds.push({ mode, ...head, a, b }); }
    else if (mode === "scoop") { const w = fr(x.whole, r, "whole"), p = fr(x.part, r, "part"); if (!w || !p || p[0] === 0 || w[0] === 0) continue; const q = fdiv(w, p); if (!Number.isInteger(q) || q < 2 || q > 24) { r.push("scoop:needs-whole-number-of-scoops-2-24"); continue; } rounds.push({ mode, ...head, whole: w, part: p, unit: reqStr(x.unit, 10, "unit", r) ?? "cups" }); }
    else { const a = fr(x.a, r, "a"), b = fr(x.b, r, "b"), op = oneOf(x.op, ["+", "-"] as const, "+", "op", r); if (!a || !b || lcmN(a[1], b[1]) > 24) { r.push("join:denominators"); continue; } const res = fadd(a, b, op === "+" ? 1 : -1); if (res[0] < 0 || res[0] / res[1] > 2) { r.push("join:result-range"); continue; } rounds.push({ mode, ...head, a, b, op }); }
  }
  if (!rounds.length) return null;
  return { archetype: "fraction-ops@1", ...env, strings: strings(raw.strings, FO_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Fraction Works", rounds };
}
function gradeFo(spec: FracOpsSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "orchard") {
    const key = fmul(rd.a, rd.b), cols = Number(v.cols), cs = Number(v.colsShaded), rows = Number(v.rows), rs = Number(v.rowsShaded);
    if (![cols, cs, rows, rs].every((n) => Number.isInteger(n) && n >= 0 && n <= 12) || !cols || !rows) return { verdict: "wrong", truth: key, detail: "no-value" };
    const got: F = [cs * rs, cols * rows];
    const exact = feq(got, key), structural = (feq([cs, cols], rd.b) && feq([rs, rows], rd.a)) || (feq([cs, cols], rd.a) && feq([rs, rows], rd.b));
    return { verdict: exact ? "right" : structural ? "partial" : "wrong", truth: key, detail: fstr(got[1] ? [got[0], got[1]] : [0, 1]) };
  }
  if (rd.mode === "scoop") { const key = fdiv(rd.whole, rd.part), n = Number(v.scoops ?? value); return { verdict: n === key ? "right" : Math.abs(n - key) === 1 ? "partial" : "wrong", truth: key, error: Number.isFinite(n) ? Math.abs(n - key) : undefined }; }
  const key = fadd(rd.a, rd.b, rd.op === "+" ? 1 : -1), n = Number(v.parts ?? value);
  if (!Number.isInteger(n) || n < 1 || n > 24) return { verdict: "wrong", truth: key, detail: "no-value" };
  const common = n % rd.a[1] === 0 && n % rd.b[1] === 0;
  return { verdict: common ? "right" : "wrong", truth: key, detail: common ? `${(key[0] * n) / key[1]}/${n}` : "cuts do not line up" };
}
function keysFo(spec: FracOpsSpec) { return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "orchard" ? fstr(fmul(rd.a, rd.b)) : rd.mode === "scoop" ? String(fdiv(rd.whole, rd.part)) : fstr(fadd(rd.a, rd.b, rd.op === "+" ? 1 : -1)), prompt: rd.mode === "orchard" ? `${fstr(rd.a)} of ${fstr(rd.b)}` : rd.mode === "scoop" ? `${fstr(rd.whole)} ÷ ${fstr(rd.part)}` : `${fstr(rd.a)} ${rd.op} ${fstr(rd.b)}` })); }
export const fracOpsDef: ExtSpecDef<FracOpsSpec> = {
  archetype: "fraction-ops@1", title: "Fraction Works", kind: "game", subjects: ["maths"],
  act: "cut and shade a field to harvest a fraction of a fraction, scoop a measure until a container is full (division), re-cut two bars into parts that line up and pour them together (addition and subtraction)",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths"], topics: ["c7-maths-ch08-t01", "c7-maths-ch08-t02", "c6-maths-ch07-t05"], misconceptions: [] },
  schema: FracOpsSchema as unknown as z.ZodType<FracOpsSpec>, defaultSpec: foDefault, repair: repairFo, grade: gradeFo, keys: keysFo,
};
