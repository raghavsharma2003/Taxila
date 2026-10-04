// Studio v2 spec contract (`studio-spec@2`, STUDIO-V2 §5) — RS-4 pre-work, 2026-10-04.
//
// One module, three jobs, imported by the client engines, the host grader and (later) server/studio/spec.js:
//   1. SCHEMAS: one zod schema per archetype for a *repaired* spec (the planner's structured output target too:
//      `specJsonSchema(archetype)`).
//   2. REPAIR: `validateSpec(archetype, raw)` never throws. It keeps every valid field, clamps numbers, drops bad
//      items, defaults bad strings, and when nothing playable is left it returns the archetype's REVIEWED DEFAULT
//      spec (kit-seeded, hand-checked). The result always passes the strict schema (tested by fuzz).
//   3. TRUTH + GRADING: the pure functions an engine draws from (exact rationals, the circuit solver, the
//      ecosystem and water-energy models, shadow geometry, number words) and `gradeAnswer(archetype, spec, itemId,
//      value)`, which grades the child's RAW act against the key derived from the validated spec. A frame's own
//      `correct` claim is never an input (rj-ot-frame-claim-as-grade).
//
// Erasable TypeScript only (no enums/namespaces), so plain Node (type stripping) and the server can import it.
import { z } from "zod";

// ───────────────────────────── common ─────────────────────────────
export type Lang = "en" | "hi" | "hinglish";
export type StudioKindV2 = "game" | "simulation" | "explainer";
export type Verdict = "right" | "partial" | "wrong" | "ungraded";
export interface Graded { verdict: Verdict; truth: unknown; error?: number; detail?: string }
export interface Repaired<S> { spec: S; repairs: string[]; fellBack: boolean }
export interface Outcomes { classes: number[]; topics: string[]; misconceptions: string[] }
export interface EngineSpecDef<S> {
  archetype: string; title: string; kind: StudioKindV2; subject: "maths" | "science";
  outcomes: Outcomes;
  schema: z.ZodType<S>;
  defaultSpec: S;
  repair(raw: Record<string, unknown>, r: string[]): S | null;   // null = nothing playable → default
  grade(spec: S, itemId: string, value: unknown): Graded;
}

const MARKUP = /[<>{}\\`]|https?:|www\.|javascript:|data:/i;
export const TOPIC_RE = /^c[4-7]-(maths|science|evs)-ch\d{2}-t\d{2}$/;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const clampN = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const safeStr = (max: number) => z.string().min(1).max(max).refine((s) => !MARKUP.test(s), "markup");
const UNGRADED: Graded = { verdict: "ungraded", truth: null, detail: "unknown-item" };

function str(v: unknown, max: number, dflt: string, key: string, r: string[]): string {
  if (typeof v === "string" && v.trim().length > 0 && v.length <= max && !MARKUP.test(v)) return v;
  if (v !== undefined) r.push("string:" + key);
  return dflt;
}
function num(v: unknown, lo: number, hi: number, dflt: number, key: string, r: string[], int = false): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    let x = int ? Math.round(v) : v;
    if (x < lo || x > hi) { r.push("clamp:" + key); x = clampN(x, lo, hi); }
    return x;
  }
  if (v !== undefined) r.push("num:" + key);
  return dflt;
}
function bool(v: unknown, dflt: boolean): boolean { return typeof v === "boolean" ? v : dflt; }
function arr(v: unknown, key: string, r: string[]): unknown[] {
  if (Array.isArray(v)) return v;
  if (v !== undefined) r.push("array:" + key);
  return [];
}
function oneOf<T extends string>(v: unknown, list: readonly T[], dflt: T, key: string, r: string[]): T {
  if (typeof v === "string" && (list as readonly string[]).includes(v)) return v as T;
  if (v !== undefined) r.push("enum:" + key);
  return dflt;
}
function strings<T extends Record<string, string>>(raw: unknown, defaults: T, max: number, r: string[]): T {
  const out = { ...defaults };
  if (raw === undefined) return out;
  if (!isObj(raw)) { r.push("strings:not-an-object"); return out; }
  for (const k of Object.keys(defaults)) if (k in raw) (out as Record<string, string>)[k] = str(raw[k], max, defaults[k], k, r);
  return out;
}
function envelope(raw: Record<string, unknown>, def: { skills: string[]; lang: Lang }, r: string[]) {
  const sk = arr(raw.skills, "skills", r).filter((s): s is string => typeof s === "string" && TOPIC_RE.test(s)).slice(0, 6);
  return { skills: sk.length ? sk : def.skills, lang: oneOf(raw.lang, ["en", "hi", "hinglish"] as const, def.lang, "lang", r) };
}
const Envelope = { skills: z.array(z.string().regex(TOPIC_RE)).min(1).max(6), lang: z.enum(["en", "hi", "hinglish"]) };
function within(v: unknown, key: number, rightTol: number, partialTol: number): Graded {
  if (typeof v !== "number" || !Number.isFinite(v)) return { verdict: "wrong", truth: key, detail: "no-value" };
  const e = Math.abs(v - key);
  return { verdict: e <= rightTol ? "right" : e <= partialTol ? "partial" : "wrong", truth: key, error: +e.toFixed(4) };
}
function misconceptionOk(v: unknown, allowed: string[]): string | undefined {
  return typeof v === "string" && allowed.includes(v) ? v : undefined;
}

// ───────────────────────────── exact rationals and decimals ─────────────────────────────
export interface Frac { num: number; den: number; w: number; n: number; d: number; mixed: boolean; whole: boolean; decimal: boolean; label: string }
export function gcd(a: number, b: number): number { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
export function parseFrac(input: unknown): Frac | null {
  if (typeof input !== "string" && typeof input !== "number") return null;
  const s = String(input).trim();
  let m = s.match(/^(\d{1,2})\s+(\d{1,2})\/(\d{1,2})$/);
  if (m) { const w = +m[1], n = +m[2], d = +m[3]; if (!d || n >= d || n === 0) return null; return { w, n, d, num: w * d + n, den: d, mixed: true, whole: false, decimal: false, label: s }; }
  m = s.match(/^(\d{1,3})\/(\d{1,2})$/);
  if (m) { const n = +m[1], d = +m[2]; if (!d) return null; return { w: 0, n, d, num: n, den: d, mixed: false, whole: false, decimal: false, label: s }; }
  m = s.match(/^(\d{1,2})\.(\d{1,3})$/);
  if (m) { const den = 10 ** m[2].length, num = +m[1] * den + +m[2]; return { w: 0, n: num, d: den, num, den, mixed: false, whole: false, decimal: true, label: s }; }
  m = s.match(/^\d{1,3}$/);
  if (m) return { w: +s, n: 0, d: 1, num: +s, den: 1, mixed: false, whole: true, decimal: false, label: s };
  return null;
}
export const fracValue = (f: Frac) => f.num / f.den;
export const sameValue = (a: Frac, b: Frac) => a.num * b.den === b.num * a.den;
/** "~1/8" style nearest simple fraction for feedback ("off by ~1/8"); null when nothing simple is close. */
export function nearestSimple(x: number): string | null {
  let best: { n: number; d: number; err: number } | null = null;
  for (const d of [2, 3, 4, 5, 6, 8, 10, 12]) {
    const n = Math.round(x * d);
    if (n <= 0) continue;
    const err = Math.abs(x - n / d);
    if (!best || err < best.err - 1e-9) { const g = gcd(n, d); best = { n: n / g, d: d / g, err }; }
  }
  return best && best.err <= 0.015 ? (best.d === 1 ? `${best.n}` : `${best.n}/${best.d}`) : null;
}
/** A signed decimal or integer call ("-3", "0.45", "-2.5"); fractions allowed for the runner too. */
export function parseNum(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input !== "string") return null;
  const s = input.trim().replace("−", "-");
  if (/^-?\d{1,4}(\.\d{1,3})?$/.test(s)) return +s;
  const neg = s.startsWith("-"), f = parseFrac(neg ? s.slice(1) : s);
  return f ? (neg ? -1 : 1) * fracValue(f) : null;
}

// ───────────────────────────── number words (Indian and international) ─────────────────────────────
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function under100(n: number): string { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""); }
function under1000(n: number): string {
  const h = Math.floor(n / 100), rest = n % 100;
  return [h ? ONES[h] + " hundred" : "", rest ? under100(rest) : ""].filter(Boolean).join(" ");
}
export function numberWords(n: number, system: "indian" | "international" = "indian"): string {
  if (!Number.isInteger(n) || n < 0 || n > 999999999) return String(n);
  if (n === 0) return "zero";
  const parts: string[] = [];
  if (system === "indian") {
    const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), th = Math.floor((n % 1e5) / 1000), rest = n % 1000;
    if (crore) parts.push(under1000(crore) + " crore");
    if (lakh) parts.push(under100(lakh) + " lakh");
    if (th) parts.push(under100(th) + " thousand");
    if (rest) parts.push(under1000(rest));
  } else {
    const mil = Math.floor(n / 1e6), th = Math.floor((n % 1e6) / 1000), rest = n % 1000;
    if (mil) parts.push(under1000(mil) + " million");
    if (th) parts.push(under1000(th) + " thousand");
    if (rest) parts.push(under1000(rest));
  }
  return parts.join(" ");
}
export function groupDigits(n: number, system: "indian" | "international" = "indian"): string {
  const s = String(Math.abs(Math.trunc(n)));
  if (system === "international" || s.length <= 3) return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const last3 = s.slice(-3), head = s.slice(0, -3);
  return head.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
}

// ═════════════════════════════ 1. catch-on-line@1 — Landfall ═════════════════════════════
const LF_STRINGS = { coach: "Drag to move the dock", wave: "Wave", of: "of", clear: "clear", landed: "landed", precision: "precision", chain: "chain", bestChain: "best chain", exact: "EXACT", close: "CLOSE", inside: "IN", offBy: "off by", same: "SAME SPOT", runDone: "Run complete", toughest: "Toughest" };
const LF_MISC = ["c6-maths-ch07-t03-m-bigger-numbers-bigger", "c6-maths-ch07-t02-m-less-than-one", "c6-maths-ch07-t02-m-mixed-wrong", "c6-maths-ch07-t02-m-count-marks", "c7-maths-ch03-t03-m-longer-bigger", "c7-maths-ch03-t03-m-shorter-bigger"];
const LandfallWave = z.object({
  title: z.string().max(22), sub: z.string().max(40), line: z.tuple([z.number().int().min(0), z.number().int().max(3)]),
  ticks: z.number().int().min(0).max(12), scaffoldTicks: z.number().int().min(2).max(12),
  speed: z.number().min(60).max(170), gap: z.number().min(1.1).max(4),
  items: z.array(z.array(z.string()).min(1).max(3)).min(1).max(12), targets: z.string().optional(),
});
const LandfallSchema = z.object({
  archetype: z.literal("catch-on-line@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(LF_STRINGS).map((k) => [k, safeStr(48)]))),
  waves: z.array(LandfallWave).min(1).max(6),
  adapt: z.object({ slowAfterMisses: z.number(), slowFactor: z.number(), fastAfterChain: z.number(), fastFactor: z.number(), minScale: z.number(), maxScale: z.number(), scaffoldPods: z.number() }),
});
export type LandfallSpec = z.infer<typeof LandfallSchema>;
const LF_ADAPT = { slowAfterMisses: 2, slowFactor: 0.86, fastAfterChain: 4, fastFactor: 1.07, minScale: 0.7, maxScale: 1.3, scaffoldPods: 3 };
const landfallDefault: LandfallSpec = {
  archetype: "catch-on-line@1", skills: ["c5-maths-ch02-t01", "c6-maths-ch07-t02", "c6-maths-ch07-t03"], lang: "en", strings: { ...LF_STRINGS },
  waves: [
    { title: "Quarters", sub: "0 to 1 · quarter marks on", line: [0, 1], ticks: 4, scaffoldTicks: 4, speed: 88, gap: 2.5, items: [["1/2"], ["1/4"], ["3/4"], ["2/4"]] },
    { title: "Eighths", sub: "only the half is marked", line: [0, 1], ticks: 2, scaffoldTicks: 8, speed: 96, gap: 1.9, items: [["3/8"], ["7/8"], ["5/8"], ["1/8"], ["6/8"]], targets: "c6-maths-ch07-t02-m-count-marks" },
    { title: "Same spot?", sub: "two pods · one place, or two?", line: [0, 1], ticks: 0, scaffoldTicks: 4, speed: 92, gap: 3.1, items: [["1/2", "4/8"], ["3/4", "6/8"], ["2/3", "4/6"]], targets: "c6-maths-ch07-t03-m-bigger-numbers-bigger" },
    { title: "Past one", sub: "the line runs to 2 now", line: [0, 2], ticks: 0, scaffoldTicks: 4, speed: 100, gap: 2.6, items: [["5/4"], ["3/2", "1 1/2"], ["7/4"], ["9/8", "1 1/8"]], targets: "c6-maths-ch07-t02-m-less-than-one" },
  ],
  adapt: { ...LF_ADAPT },
};
function repairLandfall(raw: Record<string, unknown>, r: string[]): LandfallSpec | null {
  const env = envelope(raw, landfallDefault, r);
  const adapt = { ...LF_ADAPT };
  if (isObj(raw.adapt)) for (const k of Object.keys(LF_ADAPT) as (keyof typeof LF_ADAPT)[]) {
    if (k in raw.adapt) { const d = LF_ADAPT[k]; adapt[k] = num(raw.adapt[k], d * 0.5, d * 2, d, "adapt." + k, r, Number.isInteger(d)); }
  }
  const waves: LandfallSpec["waves"] = [];
  for (const w of arr(raw.waves, "waves", r).slice(0, 6)) {
    if (!isObj(w)) { r.push("wave:not-an-object"); continue; }
    const line = Array.isArray(w.line) && w.line.length === 2 && Number.isInteger(w.line[0]) && Number.isInteger(w.line[1]) && (w.line[0] as number) >= 0 && (w.line[1] as number) > (w.line[0] as number) && (w.line[1] as number) <= 3 ? [w.line[0] as number, w.line[1] as number] as [number, number] : null;
    if (!line) { r.push("wave-line"); continue; }
    const items: string[][] = [];
    for (const it of arr(w.items, "items", r).slice(0, 12)) {
      const labels = (Array.isArray(it) ? it : [it]);
      const group = labels.map(parseFrac);
      if (!group.length || group.length > 3 || group.some((f) => !f || (!f.decimal && f.den > 12))) { r.push("item:bad"); continue; }
      const g = group as Frac[];
      if (g.some((f) => fracValue(f) <= line[0] || fracValue(f) >= line[1])) { r.push("item:range"); continue; }
      if (g.length > 1 && !g.every((f) => sameValue(f, g[0]))) { r.push("item:pair-not-equal"); continue; }
      items.push(g.map((f) => f.label));
    }
    if (!items.length) { r.push("wave-empty"); continue; }
    waves.push({
      title: str(w.title, 22, "Wave", "title", r), sub: typeof w.sub === "string" && w.sub.length <= 40 && !MARKUP.test(w.sub) ? w.sub : "", line,
      ticks: num(w.ticks, 0, 12, 0, "ticks", r, true), scaffoldTicks: num(w.scaffoldTicks, 2, 12, 4, "scaffoldTicks", r, true),
      speed: num(w.speed, 60, 170, 95, "speed", r), gap: num(w.gap, 1.1, 4, 2.4, "gap", r), items,
      ...(misconceptionOk(w.targets, LF_MISC) ? { targets: w.targets as string } : {}),
    });
  }
  if (!waves.length) return null;
  return { archetype: "catch-on-line@1", ...env, strings: strings(raw.strings, LF_STRINGS, 48, r), waves, adapt };
}
function gradeLandfall(spec: LandfallSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^w(\d+):(.+)$/);
  if (!m) return UNGRADED;
  const wave = spec.waves[+m[1] - 1];
  if (!wave || !wave.items.some((g) => g.includes(m[2]))) return UNGRADED;
  const f = parseFrac(m[2]);
  if (!f) return UNGRADED;
  const range = wave.line[1] - wave.line[0], truth = fracValue(f);
  if (typeof value !== "number" || !Number.isFinite(value)) return { verdict: "wrong", truth, detail: "no-value" };
  const pae = (Math.abs(value - truth) / range) * 100;   // percent absolute error (Siegler & Booth 2004)
  return { verdict: pae <= 6.6 ? "right" : pae <= 12 ? "partial" : "wrong", truth, error: +pae.toFixed(2), detail: "pae" };
}

// ═════════════════════════════ 2. circuit-bench@1 — Circuit Lab (shared solver) ═════════════════════════════
export const CIRCUIT = {
  COLS: [320, 475, 630, 785, 940], ROWS: [282, 472],
  PHYS: { cellV: 1.5, cellR: 0.4, bulbR: 5, wireR: 0.02, switchR: 0.02, leak: 1e-6 },
  MATERIALS: {
    coin: { name: "Coin", R: 0.03, kind: "metal" }, nail: { name: "Nail", R: 0.08, kind: "metal" },
    pencil: { name: "Pencil", R: 7, kind: "graphite" }, ruler: { name: "Ruler", R: Infinity, kind: "plastic" },
    eraser: { name: "Eraser", R: Infinity, kind: "rubber" }, glass: { name: "Glass", R: Infinity, kind: "glass" },
  } as Record<string, { name: string; R: number; kind: string }>,
  TOOLS: { wire: "Wire", bulb: "Bulb", switch: "Switch", cell: "Cell", meter: "Meter" } as Record<string, string>,
  PREDICATES: ["bulbLit", "meters", "switchCycle", "tested", "brightness"] as const,
};
export const CIRCUIT_NC = CIRCUIT.COLS.length, CIRCUIT_NR = CIRCUIT.ROWS.length, CIRCUIT_N = CIRCUIT_NC * CIRCUIT_NR;
export const circuitPREF = Math.pow(CIRCUIT.PHYS.cellV / (CIRCUIT.PHYS.bulbR + CIRCUIT.PHYS.cellR), 2) * CIRCUIT.PHYS.bulbR;
export type CompType = "wire" | "bulb" | "switch" | "cell" | "tester";
export interface CircuitComp { type: CompType; plus?: number; closed?: boolean; material?: string | null }
export interface CircuitEdgeIn { a: number; b: number; comp: CircuitComp | null }
export const circuitNid = (c: number, r: number) => c + r * CIRCUIT_NC;
export function circuitParseNode(s: unknown): number {
  const [c, r] = String(s).split(",").map(Number);
  return Number.isInteger(c) && Number.isInteger(r) && c >= 0 && c < CIRCUIT_NC && r >= 0 && r < CIRCUIT_NR ? circuitNid(c, r) : -1;
}
/** "c,r-c,r" → [a, b] with a < b, only for grid-adjacent nodes; null otherwise. */
export function circuitEdgeKey(spec: unknown): [number, number] | null {
  const [p, q] = String(spec).split("-");
  const a = circuitParseNode(p), b = circuitParseNode(q);
  if (a < 0 || b < 0 || a === b) return null;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const adj = (hi - lo === 1 && Math.floor(lo / CIRCUIT_NC) === Math.floor(hi / CIRCUIT_NC)) || hi - lo === CIRCUIT_NC;
  return adj ? [lo, hi] : null;
}
export function circuitNodeName(i: number): string { return `${i % CIRCUIT_NC},${Math.floor(i / CIRCUIT_NC)}`; }
function resistanceOf(c: CircuitComp | null): number {
  if (!c) return Infinity;
  const P = CIRCUIT.PHYS;
  if (c.type === "wire") return P.wireR;
  if (c.type === "bulb") return P.bulbR;
  if (c.type === "switch") return c.closed ? P.switchR : Infinity;
  if (c.type === "tester") return c.material && CIRCUIT.MATERIALS[c.material] ? CIRCUIT.MATERIALS[c.material].R : Infinity;
  return Infinity;
}
function gaussSolve(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    if (Math.abs(d) < 1e-15) continue;
    for (let r = col + 1; r < n; r++) { const f = M[r][col] / d; if (f) for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = Math.abs(M[r][r]) < 1e-15 ? 0 : s / M[r][r]; }
  return x;
}
/** Modified nodal analysis on the bench grid. Returns per-edge conventional current a→b and bulb powers. */
export function solveCircuit(edges: CircuitEdgeIn[]): { I: number[]; P: number[]; v: number[] } {
  const N = CIRCUIT_N, PH = CIRCUIT.PHYS;
  const G = Array.from({ length: N }, () => new Array(N).fill(0)), J = new Array(N).fill(0);
  const add = (a: number, b: number, g: number) => { G[a][a] += g; G[b][b] += g; G[a][b] -= g; G[b][a] -= g; };
  for (const e of edges) {
    const c = e.comp;
    if (!c) continue;
    if (c.type === "cell") { const g = 1 / PH.cellR, plus = c.plus === e.a ? e.a : e.b, minus = plus === e.a ? e.b : e.a; add(e.a, e.b, g); J[plus] += PH.cellV * g; J[minus] -= PH.cellV * g; }
    else { const R = resistanceOf(c); if (Number.isFinite(R)) add(e.a, e.b, 1 / R); }
  }
  for (let i = 0; i < N; i++) G[i][i] += PH.leak;
  const v = gaussSolve(G, J);
  const I: number[] = [], P: number[] = [];
  for (const e of edges) {
    const c = e.comp;
    let cur = 0;
    if (c && c.type === "cell") { const g = 1 / PH.cellR, s = (c.plus === e.a ? e.a : e.b) === e.b ? 1 : -1; cur = g * (v[e.a] - v[e.b]) + s * PH.cellV * g; }
    else if (c) { const R = resistanceOf(c); cur = Number.isFinite(R) ? (v[e.a] - v[e.b]) / R : 0; }
    if (Math.abs(cur) < 1e-4) cur = 0;
    I.push(cur); P.push(c && c.type === "bulb" ? cur * cur * PH.bulbR : 0);
  }
  return { I, P, v };
}
const CL_STRINGS = { stepOf: "of", short: "Short circuit: the cell is heating up", fight: "Cells pushing against each other? Tap the new cell to flip it", conducts: "Let current through", blocks: "Blocked it", flow: "FLOW", labDone: "Lab complete", free: "Free build: drag parts in, tap to flip or switch" };
const CL_MISC = ["c7-science-ch03-t01-m1", "c7-science-ch03-t01-m2", "c7-science-ch03-t02-m1", "c7-science-ch03-t02-m2", "c7-science-ch03-t03-m3"];
const CircuitStep = z.object({
  id: z.string().min(1).max(24), goal: z.string().max(70), done: z.string().max(80), then: z.array(z.string().max(70)).max(3),
  tray: z.array(z.string()).max(8), preset: z.array(z.object({ at: z.string(), put: z.enum(["wire", "bulb", "switch", "cell", "tester", "empty"]), plus: z.string().optional(), locked: z.boolean() })).max(12),
  cue: z.string().nullable(), check: z.record(z.string(), z.unknown()), hint: z.string().max(70),
});
const CircuitSchema = z.object({
  archetype: z.literal("circuit-bench@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(CL_STRINGS).map((k) => [k, safeStr(70)]))),
  steps: z.array(CircuitStep).min(1).max(8),
});
export type CircuitSpec = z.infer<typeof CircuitSchema>;
const circuitDefault: CircuitSpec = {
  archetype: "circuit-bench@1", skills: ["c7-science-ch03-t01", "c7-science-ch03-t02", "c7-science-ch03-t03"], lang: "en", strings: { ...CL_STRINGS },
  steps: [
    { id: "close", goal: "Make the bulb glow", done: "Closed loop. Current flows all the way round.", then: [], tray: ["wire"], hint: "",
      preset: [{ at: "0,0-0,1", put: "cell", plus: "0,0", locked: true }, { at: "0,0-1,0", put: "wire", locked: false }, { at: "1,0-2,0", put: "bulb", locked: false }, { at: "2,0-3,0", put: "wire", locked: false }, { at: "3,0-3,1", put: "wire", locked: false }, { at: "2,1-3,1", put: "wire", locked: false }, { at: "0,1-1,1", put: "wire", locked: false }],
      cue: "1,1-2,1", check: { bulbLit: true } },
    { id: "same", goal: "Put a meter before the bulb and one after it", done: "Same reading on both sides. The bulb doesn't use current up.", then: [], tray: ["meter"], preset: [], cue: null, check: { meters: 2 }, hint: "" },
    { id: "switch", goal: "Add a switch anywhere in the loop", then: ["Now tap the switch to turn it off", "Tap it again to turn it on"], done: "Off anywhere means off everywhere.", tray: ["switch"], preset: [], cue: null, check: { switchCycle: true }, hint: "" },
    { id: "test", goal: "Drop things in the gap. Which let current through?", done: "Metals let current through. So does pencil lead, a little.", then: [], tray: ["coin", "nail", "pencil", "ruler", "eraser", "glass"], preset: [{ at: "1,1-2,1", put: "tester", locked: false }], cue: "1,1-2,1", check: { tested: { n: 4, must: ["pencil"] } }, hint: "" },
    { id: "bright", goal: "Make the bulb brighter", hint: "Cells pushing against each other? Tap the new cell to flip it", done: "Two cells, + to −: a bigger push, a brighter bulb.", then: [], tray: ["cell"], preset: [{ at: "1,1-2,1", put: "wire", locked: false }], cue: null, check: { brightness: 2 } },
  ],
};
function repairCircuit(raw: Record<string, unknown>, r: string[]): CircuitSpec | null {
  const env = envelope(raw, circuitDefault, r);
  const steps: CircuitSpec["steps"] = [];
  const s = (x: unknown, n: number) => (typeof x === "string" && x.length <= n && !MARKUP.test(x) ? x : "");
  for (const st of arr(raw.steps, "steps", r).slice(0, 8)) {
    if (!isObj(st)) { r.push("step:not-an-object"); continue; }
    const check = isObj(st.check) ? st.check : null;
    const pred = check ? Object.keys(check)[0] : undefined;
    if (!check || !pred || !(CIRCUIT.PREDICATES as readonly string[]).includes(pred)) { r.push("predicate:" + String(pred)); continue; }
    let arg = check[pred];
    if (pred === "meters" || pred === "brightness") arg = num(arg, 1, pred === "meters" ? 4 : 4, pred === "meters" ? 2 : 2, "check." + pred, r);
    if (pred === "tested") { const a = isObj(arg) ? arg : {}; arg = { n: num(a.n, 1, 6, 4, "tested.n", r, true), must: arr(a.must, "tested.must", r).filter((m): m is string => typeof m === "string" && !!CIRCUIT.MATERIALS[m]) }; }
    if (pred === "bulbLit" || pred === "switchCycle") arg = true;
    const tray = arr(st.tray, "tray", r).filter((t): t is string => typeof t === "string" && (!!CIRCUIT.TOOLS[t] || !!CIRCUIT.MATERIALS[t])).slice(0, 8);
    const preset: CircuitSpec["steps"][number]["preset"] = [];
    for (const p of arr(st.preset, "preset", r).slice(0, 12)) {
      if (!isObj(p)) { r.push("preset:not-an-object"); continue; }
      const e = circuitEdgeKey(p.at);
      const put = oneOf(p.put, ["wire", "bulb", "switch", "cell", "tester", "empty"] as const, "empty", "preset.put", r);
      if (!e) { r.push("preset:" + String(p.at)); continue; }
      if (put === "cell") { const plus = circuitParseNode(p.plus); if (plus !== e[0] && plus !== e[1]) { r.push("cell-plus:" + String(p.at)); continue; } }
      preset.push({ at: `${circuitNodeName(e[0])}-${circuitNodeName(e[1])}`, put, ...(put === "cell" ? { plus: String(p.plus) } : {}), locked: bool(p.locked, false) });
    }
    if (!tray.length && !preset.length) { r.push("step:no-tools"); continue; }
    const cueE = st.cue != null ? circuitEdgeKey(st.cue) : null;
    steps.push({ id: s(st.id, 24) || pred, goal: s(st.goal, 70) || "Make the bulb glow", done: s(st.done, 80) || "Done.", then: arr(st.then, "then", r).slice(0, 3).map((x) => s(x, 70)),
      tray, preset, cue: cueE ? `${circuitNodeName(cueE[0])}-${circuitNodeName(cueE[1])}` : null, check: { [pred]: arg }, hint: s(st.hint, 70) });
  }
  if (!steps.length) return null;
  return { archetype: "circuit-bench@1", ...env, strings: strings(raw.strings, CL_STRINGS, 70, r), steps };
}
/** Value submitted by the bench: the circuit as built (not a verdict). */
interface CircuitAnswer { edges?: { at: string; type: CompType; plus?: string; closed?: boolean; material?: string | null }[]; meters?: string[]; tested?: string[] }
function circuitFromAnswer(v: CircuitAnswer): { edges: CircuitEdgeIn[]; keys: string[] } | null {
  if (!Array.isArray(v.edges)) return null;
  const edges: CircuitEdgeIn[] = [], keys: string[] = [];
  for (const e of v.edges.slice(0, 13)) {
    const k = isObj(e) ? circuitEdgeKey(e.at) : null;
    if (!k || !["wire", "bulb", "switch", "cell", "tester"].includes(String(e.type))) continue;
    const comp: CircuitComp = { type: e.type };
    if (e.type === "cell") { const plus = circuitParseNode(e.plus); comp.plus = plus === k[0] || plus === k[1] ? plus : k[1]; }
    if (e.type === "switch") comp.closed = e.closed !== false;
    if (e.type === "tester") comp.material = typeof e.material === "string" && CIRCUIT.MATERIALS[e.material] ? e.material : null;
    edges.push({ a: k[0], b: k[1], comp }); keys.push(`${circuitNodeName(k[0])}-${circuitNodeName(k[1])}`);
  }
  return { edges, keys };
}
export function circuitBrightness(edges: CircuitEdgeIn[]): number {
  const s = solveCircuit(edges);
  return s.P.reduce((m, p) => Math.max(m, p / circuitPREF), 0);
}
function gradeCircuit(spec: CircuitSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^step:(.+)$/);
  const step = m ? spec.steps.find((s) => s.id === m[1]) : null;
  if (!step || !isObj(value)) return step ? { verdict: "wrong", truth: null, detail: "no-value" } : UNGRADED;
  const pred = Object.keys(step.check)[0], arg = step.check[pred];
  const v = value as CircuitAnswer;
  if (pred === "tested") {
    const tested = (Array.isArray(v.tested) ? v.tested : []).filter((x): x is string => typeof x === "string" && !!CIRCUIT.MATERIALS[x]);
    const truth = Object.fromEntries(tested.map((t) => [t, Number.isFinite(CIRCUIT.MATERIALS[t].R) ? "conducts" : "blocks"]));
    const a = arg as { n: number; must: string[] };
    const ok = new Set(tested).size >= a.n && a.must.every((x) => tested.includes(x));
    return { verdict: ok ? "right" : "wrong", truth };
  }
  const built = circuitFromAnswer(v);
  if (!built) return { verdict: "wrong", truth: null, detail: "no-circuit" };
  const sol = solveCircuit(built.edges);
  const bright = sol.P.reduce((mx, p) => Math.max(mx, p / circuitPREF), 0);
  if (pred === "bulbLit") return { verdict: bright > 0.2 ? "right" : "wrong", truth: { brightness: +bright.toFixed(3) } };
  if (pred === "brightness") return { verdict: bright >= (arg as number) ? "right" : "wrong", truth: { brightness: +bright.toFixed(3) } };
  if (pred === "meters") {
    const meters = (Array.isArray(v.meters) ? v.meters : []).map((k) => built.keys.indexOf(String(k))).filter((i) => i >= 0);
    const live = meters.filter((i) => Math.abs(sol.I[i]) > 0.01);
    const same = live.length >= 2 && live.every((i) => Math.abs(Math.abs(sol.I[i]) - Math.abs(sol.I[live[0]])) < 1e-3);
    return { verdict: live.length >= (arg as number) ? "right" : "wrong", truth: { readings: live.map((i) => +Math.abs(sol.I[i]).toFixed(3)), same } };
  }
  if (pred === "switchCycle") {
    const swIdx = built.edges.findIndex((e) => e.comp && e.comp.type === "switch");
    if (swIdx < 0) return { verdict: "wrong", truth: { switch: false } };
    const on = built.edges.map((e, i) => (i === swIdx ? { ...e, comp: { ...e.comp!, closed: true } } : e));
    const off = built.edges.map((e, i) => (i === swIdx ? { ...e, comp: { ...e.comp!, closed: false } } : e));
    const litOn = circuitBrightness(on) > 0.2, litOff = circuitBrightness(off) > 0.2;
    return { verdict: litOn && !litOff ? "right" : "wrong", truth: { litOn, litOff } };
  }
  return UNGRADED;
}

// ═════════════════════════════ shared timeline grammar (explainers) ═════════════════════════════
export interface NarrationLine { text: string; dur: number; lead: number; tail: number; pauses: [number, number][] }
const NarrLine = z.object({ text: z.string().max(240), dur: z.number().min(0.4).max(30), lead: z.number().min(0).max(5), tail: z.number().min(0).max(5), pauses: z.array(z.tuple([z.number(), z.number()])).max(30) });
const Cue = z.object({ at: z.union([z.number(), z.string()]), do: z.string(), dur: z.number().optional() }).catchall(z.unknown());
const Beat = z.object({ line: z.string().min(1).max(12), gap: z.number().min(0).max(3), cues: z.array(Cue).max(16) });
export type BeatT = z.infer<typeof Beat>;
/** Estimated narration timing for a line that has no measured audio yet (141 wpm, the paced bar of STUDIO-V2 QA-A10). */
export function estimateLine(text: string): NarrationLine {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const dur = Math.max(1.4, (words / 141) * 60 + 0.35);
  return { text, dur: +dur.toFixed(2), lead: 0.1, tail: 0.25, pauses: [] };
}
function repairBeats(raw: Record<string, unknown>, verbs: readonly string[], text: Record<string, string>, narration: Record<string, NarrationLine>, r: string[]): BeatT[] {
  const out: BeatT[] = [];
  for (const b of arr(raw.beats, "beats", r).slice(0, 40)) {
    if (!isObj(b)) { r.push("beat:not-an-object"); continue; }
    const id = typeof b.line === "string" ? b.line : "";
    if (!id || (!text[id] && !narration[id])) { r.push("line:" + id); continue; }
    const cues: BeatT["cues"] = [];
    for (const c of arr(b.cues, "cues", r).slice(0, 16)) {
      if (!isObj(c) || typeof c.do !== "string" || !verbs.includes(c.do)) { r.push("verb:" + (isObj(c) ? String(c.do) : "?")); continue; }
      const at = typeof c.at === "number" && Number.isFinite(c.at) ? clampN(c.at, 0, 30) : typeof c.at === "string" && /^(s\d{1,2}|end)$/.test(c.at) ? c.at : 0;
      const clean: Record<string, unknown> = { ...c, at, do: c.do };
      if (c.dur !== undefined) clean.dur = num(c.dur, 0, 12, 0.8, "cue.dur", r);
      for (const [k, v] of Object.entries(clean)) if (typeof v === "number" && !Number.isFinite(v)) delete clean[k];
      cues.push(clean as BeatT["cues"][number]);
    }
    out.push({ line: id.slice(0, 12), gap: num(b.gap, 0, 3, 0.35, "gap", r), cues });
  }
  return out;
}
function repairText(raw: unknown, dflt: Record<string, string>, r: string[]): Record<string, string> {
  const out: Record<string, string> = { ...dflt };
  if (raw === undefined) return out;
  if (!isObj(raw)) { r.push("text:not-an-object"); return out; }
  for (const [k, v] of Object.entries(raw).slice(0, 40)) {
    if (!/^[A-Za-z0-9_-]{1,12}$/.test(k)) { r.push("text-key"); continue; }
    if (typeof v === "string" && v.trim() && v.length <= 240 && !MARKUP.test(v)) out[k] = v; else r.push("text:" + k);
  }
  return out;
}
function repairNarration(raw: unknown, dflt: Record<string, NarrationLine>, r: string[]): Record<string, NarrationLine> {
  const out: Record<string, NarrationLine> = { ...dflt };
  if (raw === undefined) return out;
  if (!isObj(raw)) { r.push("narration:not-an-object"); return out; }
  for (const [k, v] of Object.entries(raw).slice(0, 40)) {
    const p = NarrLine.safeParse(v);
    if (p.success && /^[A-Za-z0-9_-]{1,12}$/.test(k)) out[k] = p.data as NarrationLine; else r.push("narration:" + k);
  }
  return out;
}

// ═════════════════════════════ 3. orbital-explainer@1 — Moon phases ═════════════════════════════
export const MOON_VERBS = ["show", "hide", "set", "camera", "orbit", "skyPhase", "ghosts", "strip", "eclipse", "interactive"] as const;
const MOON_STRINGS = { fromEarth: "FROM EARTH", sun: "SUN", earth: "EARTH", moon: "MOON", light: "SUNLIGHT", scale: "NOT TO SCALE", eclipse: "LUNAR ECLIPSE", shadow: "EARTH'S SHADOW", title: "Why the Moon has phases" };
const MOON_PHASES = ["NEW · AMAVASYA", "WAXING CRESCENT", "FIRST QUARTER", "WAXING GIBBOUS", "FULL · PURNIMA", "WANING GIBBOUS", "THIRD QUARTER", "WANING CRESCENT"];
// Measured narration (prototypes/reset/studio/03-moon-phases/narration.js: gpt-4o-mini-tts "marin", tempo 0.9,
// ffprobe + silencedetect, 2026-10-04). Engine-owned data for the reviewed default.
const MOON_NARR: Record<string, NarrationLine> = {
  L01: { text: "Every evening, the Moon looks a little different.", dur: 3.84, lead: 0, tail: 0.397, pauses: [[1.23,1.551]] },
  L02: { text: "A thin curve. Half a circle. A full disc. Then back again.", dur: 7.176, lead: 0, tail: 0, pauses: [[0.722,0.901],[1.461,2.009],[3.073,3.532],[4.655,5.478],[5.886,6.285],[6.89,7.112]] },
  L03: { text: "But the Moon itself never changes shape. So what's going on?", dur: 5.616, lead: 0, tail: 0.283, pauses: [[0.293,0.448],[1.518,1.845],[3.146,3.668],[4.05,4.471]] },
  L04: { text: "Let's go up, and look down from above the North Pole.", dur: 3.624, lead: 0, tail: 0, pauses: [[0.802,1.22],[3.181,3.559]] },
  L05: { text: "Sunlight comes in from one side.", dur: 2.784, lead: 0, tail: 0, pauses: [[2.408,2.716]] },
  L06: { text: "The Moon makes no light of its own. The Sun lights up half of it, always the half facing the Sun.", dur: 6.912, lead: 0, tail: 0, pauses: [[2.344,2.868],[4.434,4.799],[6.654,6.845]] },
  L07: { text: "As the Moon travels around the Earth, that lit half keeps facing the Sun.", dur: 5.736, lead: 0, tail: 0, pauses: [[2.56,3.171],[4.031,4.326],[5.551,5.666]] },
  L08: { text: "But from Earth, we only see the half that faces us.", dur: 4.848, lead: 0, tail: 0.294, pauses: [[0.218,0.436],[1.323,1.825],[3.285,3.566]] },
  L09: { text: "New moon. Amavasya. The lit half faces away, so we see almost nothing.", dur: 6.672, lead: 0, tail: 0, pauses: [[0.854,1.399],[2.169,2.686],[4.201,4.671],[6.321,6.606]] },
  L10: { text: "A few days on, a thin crescent.", dur: 3.168, lead: 0, tail: 0.327, pauses: [[1.324,1.702]] },
  L11: { text: "About a week in, first quarter. We see half of the lit half.", dur: 4.56, lead: 0, tail: 0, pauses: [[1.009,1.35],[2.149,2.478],[4.322,4.498]] },
  L12: { text: "Two weeks: full moon. Purnima. The whole lit half faces us.", dur: 7.176, lead: 0.255, tail: 0, pauses: [[0.974,1.269],[2.089,2.749],[3.317,4.018],[5.344,5.627],[6.469,7.115]] },
  L13: { text: "Then it shrinks back the same way. One full cycle takes about twenty-nine and a half days.", dur: 7.128, lead: 0, tail: 0, pauses: [[2.549,3.303],[4.386,4.597],[6.907,7.058]] },
  L14: { text: "And no, it isn't Earth's shadow.", dur: 3.792, lead: 0, tail: 0, pauses: [[0.383,0.737],[1.074,1.784],[1.929,2.094],[2.495,2.739],[3.515,3.728]] },
  L15: { text: "Earth's shadow points away from the Sun. At first quarter the Moon is nowhere near it, and half of it is still dark.", dur: 8.04, lead: 0, tail: 0.662, pauses: [[2.167,2.718],[5.346,5.871]] },
  L16: { text: "The Moon slips into that shadow only now and then, at a full moon. That's a lunar eclipse.", dur: 7.68, lead: 0, tail: 0, pauses: [[2.121,2.297],[3.335,3.666],[4.627,5.303],[5.716,5.918],[6.897,7.614]] },
  L17: { text: "Your turn. Drag the Moon to where it would look like a half moon in the evening sky.", dur: 6, lead: 0.333, tail: 0.392, pauses: [[0.913,1.323],[4.292,4.554]] },
  L18: { text: "That's it. First quarter.", dur: 2.448, lead: 0, tail: 0.385, pauses: [[0.75,1.253]] },
  L19: { text: "Now make it a full moon.", dur: 2.616, lead: 0, tail: 0, pauses: [[0.531,0.691],[2.243,2.555]] },
  L20: { text: "Full moon. Purnima.", dur: 3.624, lead: 0.174, tail: 0, pauses: [[1.211,1.751],[2.412,3.56]] },
  L21: { text: "That's a half moon too, but a morning one. Try the other side.", dur: 4.896, lead: 0, tail: 0.415, pauses: [[1.672,2.004],[2.905,3.405]] },
};
const MoonSchema = z.object({
  archetype: z.literal("orbital-explainer@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(MOON_STRINGS).map((k) => [k, safeStr(k === "title" ? 40 : 24)]))),
  phases: z.array(safeStr(24)).length(8), text: z.record(z.string(), z.string().max(240)), narration: z.record(z.string(), NarrLine),
  beats: z.array(Beat).min(1).max(40),
});
export type MoonSpec = z.infer<typeof MoonSchema>;
const moonBeats: BeatT[] = [
  { line: "L01", gap: 0.3, cues: [] },
  { line: "L02", gap: 0.4, cues: [{ at: "s2", do: "skyPhase", to: 90, dur: 0.9 }, { at: "s3", do: "skyPhase", to: 180, dur: 0.9 }, { at: "s4", do: "skyPhase", to: 320, dur: 2.0 }] },
  { line: "L03", gap: 1.3, cues: [{ at: "s2", do: "show", target: "title", dur: 0.9 }, { at: "end", do: "skyPhase", to: 400, dur: 1.6 }] },
  { line: "L04", gap: 0.5, cues: [{ at: 0, do: "hide", target: "title", dur: 0.6 }, { at: 0.3, do: "hide", target: "sky", dur: 1.8 }, { at: 0.3, do: "show", target: "space", dur: 1.4 }, { at: 0.3, do: "camera", zoom: 1, dur: 2.8, ease: "outCubic" }, { at: "end", do: "show", target: ["lbl.earth", "lbl.scale"], dur: 0.6 }] },
  { line: "L05", gap: 0.4, cues: [{ at: 0, do: "show", target: ["sun", "rays"], dur: 1.2 }, { at: 0.4, do: "show", target: ["lbl.light", "lbl.sun"], dur: 0.6 }] },
  { line: "L06", gap: 0.5, cues: [{ at: 0, do: "show", target: ["moon", "orbit", "lbl.moon"], dur: 0.8 }, { at: "s2", do: "show", target: "arcSun", dur: 0.6 }, { at: "s2", do: "ghosts", n: 8, dur: 2.6 }] },
  { line: "L07", gap: 0.6, cues: [{ at: 0, do: "orbit", to: 900, dur: 5.0, ease: "inOutSine" }, { at: 0, do: "hide", target: "lbl.moon", dur: 0.4 }, { at: 0, do: "set", prop: "ghosts.a", to: 0.45, dur: 1.0 }, { at: "end", do: "hide", target: "lbl.light", dur: 0.5 }] },
  { line: "L08", gap: 0.5, cues: [{ at: 0, do: "camera", x: 640, y: 320, dur: 1.6 }, { at: 0, do: "hide", target: ["ghosts", "lbl.sun"], dur: 0.8 }, { at: 0.3, do: "show", target: ["inset", "sight"], dur: 0.9 }, { at: 1.3, do: "show", target: "arcNear", dur: 0.6 }] },
  { line: "L09", gap: 0.4, cues: [{ at: 0, do: "show", target: ["phase", "strip"], dur: 0.6 }, { at: 0, do: "strip", n: 1, dur: 0.4 }] },
  { line: "L10", gap: 0.3, cues: [{ at: 0, do: "orbit", to: 945, dur: 2.0 }, { at: 0.6, do: "strip", n: 2, dur: 0.4 }] },
  { line: "L11", gap: 0.5, cues: [{ at: 0, do: "orbit", to: 990, dur: 1.8 }, { at: 0.6, do: "strip", n: 3, dur: 0.4 }, { at: "s2", do: "show", target: "overlap", dur: 0.4 }] },
  { line: "L12", gap: 0.5, cues: [{ at: 0, do: "hide", target: "overlap", dur: 0.3 }, { at: 0, do: "orbit", to: 1080, dur: 2.6 }, { at: 0.3, do: "strip", n: 5, dur: 1.6 }] },
  { line: "L13", gap: 0.7, cues: [{ at: 0, do: "orbit", to: 1260, dur: 4.6 }, { at: 0.2, do: "strip", n: 8, dur: 3.6 }, { at: "end", do: "hide", target: ["arcSun", "arcNear", "sight"], dur: 0.6 }] },
  { line: "L14", gap: 0.4, cues: [{ at: 0, do: "show", target: "shadow", dur: 1.0 }] },
  { line: "L15", gap: 0.5, cues: [{ at: "s2", do: "orbit", to: 1350, dur: 1.8 }, { at: "s2", do: "show", target: "arcSun", dur: 0.5 }] },
  { line: "L16", gap: 0.8, cues: [{ at: 0, do: "hide", target: "arcSun", dur: 0.4 }, { at: 0, do: "orbit", to: 1440, dur: 2.2 }, { at: "s2", do: "eclipse", k: 1, dur: 1.2 }, { at: "s2", do: "show", target: "lbl.eclipse", dur: 0.6 }] },
  { line: "L17", gap: 0, cues: [{ at: 0, do: "eclipse", k: 0, dur: 0.8 }, { at: 0, do: "hide", target: ["shadow", "lbl.eclipse"], dur: 0.8 }, { at: 0.2, do: "orbit", to: 1640, dur: 2.4 }, { at: "end", do: "interactive" }] },
];
const moonDefault: MoonSpec = {
  archetype: "orbital-explainer@1", skills: ["c4-evs-ch10-t02", "c7-science-ch12-t03"], lang: "en", strings: { ...MOON_STRINGS }, phases: [...MOON_PHASES],
  text: Object.fromEntries(Object.entries(MOON_NARR).map(([k, v]) => [k, v.text])), narration: MOON_NARR, beats: moonBeats,
};
function repairMoon(raw: Record<string, unknown>, r: string[]): MoonSpec | null {
  const env = envelope(raw, moonDefault, r);
  const text = repairText(raw.text, {}, r);
  const narration = repairNarration(raw.narration, MOON_NARR, r);
  for (const k of Object.keys(narration)) if (!text[k]) text[k] = narration[k].text;
  const beats = repairBeats(raw, MOON_VERBS, text, narration, r);
  const asked = Array.isArray(raw.beats) ? raw.beats.length : 1;
  if (!beats.length || beats.length < 0.5 * asked) return null;
  const st = isObj(raw.strings) ? raw.strings : {};
  const out: MoonSpec["strings"] = { ...MOON_STRINGS };
  for (const k of Object.keys(MOON_STRINGS) as (keyof typeof MOON_STRINGS)[]) if (k in st) out[k] = str(st[k], k === "title" ? 40 : 24, MOON_STRINGS[k], k, r);
  const ph = Array.isArray(st.phases) && st.phases.length === 8 && st.phases.every((x) => typeof x === "string" && x.length <= 24 && x.trim() && !MARKUP.test(x)) ? st.phases as string[] : (st.phases !== undefined && r.push("string:phases"), [...MOON_PHASES]);
  return { archetype: "orbital-explainer@1", ...env, strings: out, phases: ph, text, narration, beats };
}
const angDist = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
function gradeMoon(_s: MoonSpec, itemId: string, value: unknown): Graded {
  const key = itemId === "evening_half_moon" ? 90 : itemId === "full_moon" ? 180 : null;
  if (key == null) return UNGRADED;
  if (typeof value !== "number" || !Number.isFinite(value)) return { verdict: "wrong", truth: key, detail: "no-value" };
  const e = angDist(value, key);
  const detail = itemId === "evening_half_moon" && angDist(value, 270) <= 15 ? "morning-half-moon" : undefined;
  return { verdict: e <= 15 ? "right" : e <= 30 ? "partial" : "wrong", truth: key, error: +e.toFixed(1), ...(detail ? { detail } : {}) };
}

// ═════════════════════════════ 4. slice-at@1 — Fraction Slice ═════════════════════════════
const SL_STRINGS = { coach: "Swipe through the bar", wave: "Wave", cut: "Cut", parts: "Equal parts", exact: "CLEAN CUT", close: "CLOSE", offBy: "off by", runDone: "Run complete", accuracy: "accuracy", sliced: "sliced", chain: "chain", smaller: "smaller piece" };
const SL_MISC = ["c4-maths-ch05-t01-m-unequal-parts", "c4-maths-ch05-t01-m-bigger-denominator-bigger", "c6-maths-ch07-t01-m-unequal-parts", "c6-maths-ch07-t01-m-bigger-denominator", "c4-maths-ch05-t01-m-part-part"];
const SliceItem = z.union([z.object({ cut: z.string() }), z.object({ parts: z.number().int().min(2).max(6) })]);
const SliceSchema = z.object({
  archetype: z.literal("slice-at@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(SL_STRINGS).map((k) => [k, safeStr(40)]))),
  waves: z.array(z.object({ title: z.string().max(22), sub: z.string().max(44), items: z.array(SliceItem).min(1).max(8), gravity: z.number().min(0.6).max(1.4), gap: z.number().min(1.4).max(4.5), marks: z.boolean(), targets: z.string().optional() })).min(1).max(6),
});
export type SliceSpec = z.infer<typeof SliceSchema>;
const sliceDefault: SliceSpec = {
  archetype: "slice-at@1", skills: ["c4-maths-ch05-t01", "c6-maths-ch07-t01", "c5-maths-ch02-t01"], lang: "en", strings: { ...SL_STRINGS },
  waves: [
    { title: "Halves and quarters", sub: "cut where the fraction says", items: [{ cut: "1/2" }, { cut: "1/4" }, { cut: "3/4" }], gravity: 0.85, gap: 2.6, marks: true },
    { title: "Thirds and sixths", sub: "no marks this time", items: [{ cut: "1/3" }, { cut: "2/3" }, { cut: "1/6" }, { cut: "5/6" }], gravity: 0.95, gap: 2.4, marks: false },
    { title: "Equal shares", sub: "several cuts · every piece the same", items: [{ parts: 3 }, { parts: 4 }], gravity: 0.8, gap: 3.4, marks: false, targets: "c6-maths-ch07-t01-m-unequal-parts" },
    { title: "Bigger bottom?", sub: "1/3, then 1/5, then 1/8", items: [{ cut: "1/3" }, { cut: "1/5" }, { cut: "1/8" }], gravity: 1.0, gap: 2.4, marks: false, targets: "c6-maths-ch07-t01-m-bigger-denominator" },
  ],
};
function repairSlice(raw: Record<string, unknown>, r: string[]): SliceSpec | null {
  const env = envelope(raw, sliceDefault, r);
  const waves: SliceSpec["waves"] = [];
  for (const w of arr(raw.waves, "waves", r).slice(0, 6)) {
    if (!isObj(w)) { r.push("wave:not-an-object"); continue; }
    const items: SliceSpec["waves"][number]["items"] = [];
    for (const it of arr(w.items, "items", r).slice(0, 8)) {
      if (isObj(it) && "parts" in it) { const p = it.parts; if (typeof p === "number" && Number.isInteger(p) && p >= 2 && p <= 6) items.push({ parts: p }); else r.push("item:parts"); continue; }
      const f = parseFrac(isObj(it) ? it.cut : it);
      if (!f || f.decimal || f.whole || f.mixed || f.num <= 0 || f.num >= f.den || f.den > 12) { r.push("item:cut"); continue; }
      items.push({ cut: f.label });
    }
    if (!items.length) { r.push("wave-empty"); continue; }
    waves.push({ title: str(w.title, 22, "Wave", "title", r), sub: typeof w.sub === "string" && w.sub.length <= 44 && !MARKUP.test(w.sub) ? w.sub : "", items,
      gravity: num(w.gravity, 0.6, 1.4, 0.9, "gravity", r), gap: num(w.gap, 1.4, 4.5, 2.6, "gap", r), marks: bool(w.marks, false),
      ...(misconceptionOk(w.targets, SL_MISC) ? { targets: w.targets as string } : {}) });
  }
  if (!waves.length) return null;
  return { archetype: "slice-at@1", ...env, strings: strings(raw.strings, SL_STRINGS, 40, r), waves };
}
function gradeSlice(spec: SliceSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^w(\d+):(\d+)$/);
  const item = m ? spec.waves[+m[1] - 1]?.items[+m[2]] : undefined;
  if (!item) return UNGRADED;
  if ("cut" in item) { const f = parseFrac(item.cut)!; return within(value, fracValue(f), 0.035, 0.07); }
  const n = item.parts;
  if (!Array.isArray(value) || value.some((x) => typeof x !== "number" || !Number.isFinite(x))) return { verdict: "wrong", truth: n, detail: "no-value" };
  const cuts = [...(value as number[])].map((x) => clampN(x, 0, 1)).sort((a, b) => a - b);
  if (cuts.length !== n - 1) return { verdict: "wrong", truth: n, detail: `pieces:${cuts.length + 1}` };
  const edges = [0, ...cuts, 1], pieces = edges.slice(1).map((x, i) => x - edges[i]);
  const dev = Math.max(...pieces.map((p) => Math.abs(p - 1 / n)));
  return { verdict: dev <= 0.04 ? "right" : dev <= 0.08 ? "partial" : "wrong", truth: n, error: +dev.toFixed(3), detail: "max-piece-deviation" };
}

// ═════════════════════════════ 5. line-runner@1 — Gate Runner ═════════════════════════════
const LR_STRINGS = { coach: "Tap or press space to jump", round: "Round", jumpAt: "JUMP AT", through: "THROUGH", close: "CLOSE", offBy: "off by", runDone: "Run complete", gates: "gates", accuracy: "accuracy", chain: "chain" };
const LR_MISC = ["c6-maths-ch10-t02-m-neg-magnitude", "c6-maths-ch10-t02-m-neg-order-line", "c6-maths-ch10-t02-m-zero-smallest", "c7-maths-ch03-t03-m-longer-bigger", "c7-maths-ch03-t03-m-shorter-bigger"];
const RunnerSchema = z.object({
  archetype: z.literal("line-runner@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(LR_STRINGS).map((k) => [k, safeStr(32)]))),
  rounds: z.array(z.object({ title: z.string().max(22), sub: z.string().max(44), range: z.tuple([z.number(), z.number()]), step: z.number(), labels: z.enum(["all", "ends", "zero"]), calls: z.array(z.string()).min(1).max(8), speed: z.number().min(0.5).max(1.8), dir: z.union([z.literal(1), z.literal(-1)]), targets: z.string().optional() })).min(1).max(6),
});
export type RunnerSpec = z.infer<typeof RunnerSchema>;
const runnerDefault: RunnerSpec = {
  archetype: "line-runner@1", skills: ["c6-maths-ch10-t02", "c7-maths-ch03-t03"], lang: "en", strings: { ...LR_STRINGS },
  rounds: [
    { title: "Below zero", sub: "−10 to 10 · every mark labelled", range: [-10, 10], step: 1, labels: "all", calls: ["-3", "4", "-7", "-1"], speed: 0.8, dir: 1 },
    { title: "Which is colder?", sub: "only 0 is labelled", range: [-10, 10], step: 1, labels: "zero", calls: ["-2", "-7", "-5", "-9"], speed: 0.95, dir: 1, targets: "c6-maths-ch10-t02-m-neg-magnitude" },
    { title: "Backwards", sub: "running right to left", range: [-10, 10], step: 1, labels: "zero", calls: ["6", "-4", "0", "-8"], speed: 1.0, dir: -1, targets: "c6-maths-ch10-t02-m-neg-order-line" },
    { title: "Beyond the point", sub: "0 to 1 · tenths marked", range: [0, 1], step: 0.1, labels: "ends", calls: ["0.4", "0.45", "0.125", "0.5"], speed: 0.85, dir: 1, targets: "c7-maths-ch03-t03-m-longer-bigger" },
  ],
};
function repairRunner(raw: Record<string, unknown>, r: string[]): RunnerSpec | null {
  const env = envelope(raw, runnerDefault, r);
  const rounds: RunnerSpec["rounds"] = [];
  for (const w of arr(raw.rounds, "rounds", r).slice(0, 6)) {
    if (!isObj(w)) { r.push("round:not-an-object"); continue; }
    const rg = Array.isArray(w.range) && w.range.length === 2 && typeof w.range[0] === "number" && typeof w.range[1] === "number" && Number.isFinite(w.range[0]) && Number.isFinite(w.range[1]) ? [w.range[0], w.range[1]] as [number, number] : null;
    if (!rg || rg[1] <= rg[0] || rg[0] < -1000 || rg[1] > 1000 || rg[1] - rg[0] > 1000) { r.push("round-range"); continue; }
    const span = rg[1] - rg[0];
    const steps = [0.01, 0.1, 0.25, 0.5, 1, 2, 5, 10, 50, 100];
    let step = typeof w.step === "number" && steps.includes(w.step) ? w.step : NaN;
    if (!Number.isFinite(step) || span / step > 40 || span / step < 2) { if (w.step !== undefined) r.push("round-step"); step = steps.find((s) => span / s <= 20 && span / s >= 2) ?? span / 10; }
    const calls: string[] = [];
    for (const c of arr(w.calls, "calls", r).slice(0, 8)) {
      const v = parseNum(c);
      if (v == null || v <= rg[0] + span * 0.04 || v >= rg[1] - span * 0.04) { r.push("call:" + String(c).slice(0, 8)); continue; }
      calls.push(String(c).trim().replace("−", "-"));
    }
    if (!calls.length) { r.push("round-empty"); continue; }
    rounds.push({ title: str(w.title, 22, "Round", "title", r), sub: typeof w.sub === "string" && w.sub.length <= 44 && !MARKUP.test(w.sub) ? w.sub : "", range: rg, step,
      labels: oneOf(w.labels, ["all", "ends", "zero"] as const, "all", "labels", r), calls, speed: num(w.speed, 0.5, 1.8, 0.9, "speed", r), dir: w.dir === -1 ? -1 : 1,
      ...(misconceptionOk(w.targets, LR_MISC) ? { targets: w.targets as string } : {}) });
  }
  if (!rounds.length) return null;
  return { archetype: "line-runner@1", ...env, strings: strings(raw.strings, LR_STRINGS, 32, r), rounds };
}
function gradeRunner(spec: RunnerSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^r(\d+):(\d+)$/);
  const round = m ? spec.rounds[+m[1] - 1] : undefined;
  const call = round ? round.calls[+m![2]] : undefined;
  if (!round || call === undefined) return UNGRADED;
  const key = parseNum(call)!, span = round.range[1] - round.range[0];
  const g = within(value, key, span * 0.025, span * 0.05);
  return { ...g, detail: g.verdict === "wrong" && typeof value === "number" && key < 0 && Math.abs(value + key) <= span * 0.03 ? "mirror-sign" : undefined };
}

// ═════════════════════════════ 6. area-claim@1 — Plot (area and perimeter) ═════════════════════════════
const AC_STRINGS = { coach: "Drag across the grid to stake a plot", round: "Plot", area: "area", perimeter: "perimeter", claim: "CLAIMED", need: "need", sq: "sq", units: "units", newShape: "a new shape this time", maxArea: "most area for", runDone: "Field complete", timeUp: "drift took it" };
const AC_MISC = ["c5-maths-ch11-t01-m-area-perimeter", "c5-maths-ch11-t01-m-same-perimeter-same-area", "c6-maths-ch06-t02-m-same-perimeter-area", "c5-maths-ch11-t02-m-once-only", "c6-maths-ch06-t01-m-area-perimeter"];
const AreaSchema = z.object({
  archetype: z.literal("area-claim@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(AC_STRINGS).map((k) => [k, safeStr(40)]))),
  grid: z.object({ cols: z.number().int().min(8).max(18), rows: z.number().int().min(6).max(10) }),
  drift: z.number().min(0).max(1.5),
  rounds: z.array(z.object({ goal: z.enum(["area", "perimeter", "maxArea"]), target: z.number().int().min(1), seconds: z.number().min(10).max(60), different: z.boolean(), targets: z.string().optional() })).min(1).max(8),
});
export type AreaSpec = z.infer<typeof AreaSchema>;
export function maxAreaForPerimeter(p: number): number { const s = Math.floor(p / 2), w = Math.floor(s / 2); return w * (s - w); }
function areaFeasible(goal: string, t: number, cols: number, rows: number): boolean {
  if (goal === "area") { for (let w = 1; w <= cols; w++) if (t % w === 0 && t / w <= rows) return true; return false; }
  if (t % 2 || t < 4) return false;
  const s = t / 2;
  if (goal === "perimeter") { for (let w = 1; w < s; w++) if (w <= cols && s - w <= rows) return true; return false; }
  const w = Math.floor(s / 2);
  return Math.max(w, s - w) <= cols && Math.min(w, s - w) <= rows;
}
const areaDefault: AreaSpec = {
  archetype: "area-claim@1", skills: ["c5-maths-ch11-t01", "c5-maths-ch11-t03", "c6-maths-ch06-t01", "c6-maths-ch06-t02"], lang: "en", strings: { ...AC_STRINGS },
  grid: { cols: 14, rows: 8 }, drift: 0.7,
  rounds: [
    { goal: "area", target: 12, seconds: 30, different: false },
    { goal: "area", target: 12, seconds: 26, different: true, targets: "c5-maths-ch11-t01-m-area-perimeter" },
    { goal: "perimeter", target: 16, seconds: 28, different: false, targets: "c5-maths-ch11-t02-m-once-only" },
    { goal: "perimeter", target: 16, seconds: 26, different: true, targets: "c6-maths-ch06-t02-m-same-perimeter-area" },
    { goal: "maxArea", target: 20, seconds: 34, different: false, targets: "c5-maths-ch11-t01-m-same-perimeter-same-area" },
  ],
};
function repairArea(raw: Record<string, unknown>, r: string[]): AreaSpec | null {
  const env = envelope(raw, areaDefault, r);
  const g = isObj(raw.grid) ? raw.grid : {};
  const grid = { cols: num(g.cols, 8, 18, 14, "grid.cols", r, true), rows: num(g.rows, 6, 10, 8, "grid.rows", r, true) };
  const rounds: AreaSpec["rounds"] = [];
  for (const w of arr(raw.rounds, "rounds", r).slice(0, 8)) {
    if (!isObj(w)) { r.push("round:not-an-object"); continue; }
    const goal = oneOf(w.goal, ["area", "perimeter", "maxArea"] as const, "area", "goal", r);
    const t = typeof w.target === "number" && Number.isInteger(w.target) ? w.target : NaN;
    if (!Number.isFinite(t) || !areaFeasible(goal, t, grid.cols, grid.rows)) { r.push("round-infeasible"); continue; }
    rounds.push({ goal, target: t, seconds: num(w.seconds, 10, 60, 30, "seconds", r), different: bool(w.different, false), ...(misconceptionOk(w.targets, AC_MISC) ? { targets: w.targets as string } : {}) });
  }
  if (!rounds.length) return null;
  return { archetype: "area-claim@1", ...env, strings: strings(raw.strings, AC_STRINGS, 40, r), grid, drift: num(raw.drift, 0, 1.5, 0.7, "drift", r), rounds };
}
function gradeArea(spec: AreaSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^r(\d+)$/);
  const round = m ? spec.rounds[+m[1] - 1] : undefined;
  if (!round) return UNGRADED;
  const v = isObj(value) ? value : {};
  const w = v.w, h = v.h;
  if (typeof w !== "number" || typeof h !== "number" || !Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1) return { verdict: "wrong", truth: round.target, detail: "no-value" };
  const area = w * h, per = 2 * (w + h);
  if (round.goal === "area") return { verdict: area === round.target ? "right" : "wrong", truth: { area: round.target }, detail: area !== round.target && per === round.target ? "used-perimeter" : `area:${area}` };
  if (round.goal === "perimeter") return { verdict: per === round.target ? "right" : "wrong", truth: { perimeter: round.target }, detail: per !== round.target && w + h === round.target ? "added-once" : per !== round.target && area === round.target ? "used-area" : `perimeter:${per}` };
  const best = maxAreaForPerimeter(round.target);
  return { verdict: per === round.target && area === best ? "right" : per === round.target ? "partial" : "wrong", truth: { perimeter: round.target, maxArea: best }, detail: `area:${area},perimeter:${per}` };
}

// ═════════════════════════════ 7. vault-heist@1 — Place-value heist ═════════════════════════════
const VH_STRINGS = { coach: "Tap blocks on the belt to load the vault", round: "Vault", target: "TARGET", loaded: "loaded", over: "over by", under: "short by", cracked: "VAULT OPEN", regroup: "REGROUPED", runDone: "Heist complete", words: "say it", time: "laser" };
const VH_MISC = ["c4-maths-ch04-t01-m-concat", "c4-maths-ch04-t01-m-drop-zero", "c4-maths-ch04-t01-m-face-value", "c7-maths-ch01-t01-m-zero-placeholder", "c7-maths-ch01-t01-m-intl-commas"];
const DENOMS = [1, 10, 100, 1000, 10000, 100000] as const;
const VaultSchema = z.object({
  archetype: z.literal("vault-heist@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(VH_STRINGS).map((k) => [k, safeStr(40)]))),
  system: z.enum(["indian", "international"]), belt: z.number().min(0.6).max(1.6),
  rounds: z.array(z.object({ target: z.number().int().min(1).max(999999), seconds: z.number().min(15).max(70), show: z.enum(["digits", "words"]), denoms: z.array(z.number()).min(2).max(6), targets: z.string().optional() })).min(1).max(6),
});
export type VaultSpec = z.infer<typeof VaultSchema>;
const vaultDefault: VaultSpec = {
  archetype: "vault-heist@1", skills: ["c4-maths-ch04-t01", "c7-maths-ch01-t01"], lang: "en", strings: { ...VH_STRINGS }, system: "indian", belt: 1,
  rounds: [
    { target: 3152, seconds: 40, show: "digits", denoms: [1, 10, 100, 1000] },
    { target: 4050, seconds: 40, show: "words", denoms: [1, 10, 100, 1000], targets: "c4-maths-ch04-t01-m-drop-zero" },
    { target: 2300, seconds: 45, show: "digits", denoms: [10, 100], targets: "c4-maths-ch04-t01-m-face-value" },
    { target: 7006, seconds: 42, show: "words", denoms: [1, 10, 100, 1000], targets: "c4-maths-ch04-t01-m-concat" },
  ],
};
function repairVault(raw: Record<string, unknown>, r: string[]): VaultSpec | null {
  const env = envelope(raw, vaultDefault, r);
  const rounds: VaultSpec["rounds"] = [];
  for (const w of arr(raw.rounds, "rounds", r).slice(0, 6)) {
    if (!isObj(w)) { r.push("round:not-an-object"); continue; }
    const t = typeof w.target === "number" && Number.isInteger(w.target) && w.target >= 1 && w.target <= 999999 ? w.target : NaN;
    if (!Number.isFinite(t)) { r.push("round-target"); continue; }
    let denoms = arr(w.denoms, "denoms", r).filter((d): d is number => typeof d === "number" && (DENOMS as readonly number[]).includes(d));
    denoms = [...new Set(denoms)].sort((a, b) => a - b);
    const top = DENOMS.filter((d) => d <= t);
    if (denoms.length < 2) denoms = top.slice(-4);
    // the target must be buildable within ~60 blocks from these denominations (greedy over available ones)
    let rest = t, blocks = 0;
    for (const d of [...denoms].reverse()) { blocks += Math.floor(rest / d); rest %= d; }
    if (rest !== 0 || blocks > 60) { r.push("round-unbuildable"); continue; }
    rounds.push({ target: t, seconds: num(w.seconds, 15, 70, 40, "seconds", r), show: oneOf(w.show, ["digits", "words"] as const, "digits", "show", r), denoms, ...(misconceptionOk(w.targets, VH_MISC) ? { targets: w.targets as string } : {}) });
  }
  if (!rounds.length) return null;
  return { archetype: "vault-heist@1", ...env, strings: strings(raw.strings, VH_STRINGS, 40, r), system: oneOf(raw.system, ["indian", "international"] as const, "indian", "system", r), belt: num(raw.belt, 0.6, 1.6, 1, "belt", r), rounds };
}
function gradeVault(spec: VaultSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^r(\d+)$/);
  const round = m ? spec.rounds[+m[1] - 1] : undefined;
  if (!round) return UNGRADED;
  const counts = isObj(value) && isObj(value.counts) ? value.counts : null;
  if (!counts) return { verdict: "wrong", truth: round.target, detail: "no-value" };
  let total = 0;
  for (const d of DENOMS) { const c = counts[String(d)]; if (typeof c === "number" && Number.isInteger(c) && c >= 0 && c < 1000) total += c * d; }
  const t = round.target;
  const detail = total === t ? undefined : String(total) === String(t).replace(/0/g, "") ? "c4-maths-ch04-t01-m-drop-zero" : `total:${total}`;
  return { verdict: total === t ? "right" : "wrong", truth: t, error: Math.abs(total - t), ...(detail ? { detail } : {}) };
}

// ═════════════════════════════ 8. angle-cannon@1 — Turret (angles as turns) ═════════════════════════════
const AN_STRINGS = { coach: "Drag to turn the turret · release to fire", wave: "Wave", threat: "THREAT AT", copy: "COPY THIS TURN", only: "HIT ONLY", hit: "DIRECT HIT", close: "CLOSE", offBy: "off by", runDone: "Sector clear", accuracy: "accuracy", hits: "hits", acute: "ACUTE", right: "RIGHT", obtuse: "OBTUSE", reflex: "REFLEX" };
const AN_MISC = ["c5-maths-ch03-t01-m-angle-is-length", "c5-maths-ch03-t01-m-half-is-quarter", "c6-maths-ch02-t03-m-wrong-scale", "c6-maths-ch02-t03-m-tool-size", "c5-maths-ch03-t01-m-cw-confuse"];
const AngleSchema = z.object({
  archetype: z.literal("angle-cannon@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(AN_STRINGS).map((k) => [k, safeStr(44)]))),
  waves: z.array(z.object({ title: z.string().max(22), sub: z.string().max(44), mode: z.enum(["call", "copy", "classify"]), items: z.array(z.number().min(3).max(357)).min(1).max(8), kind: z.enum(["acute", "right", "obtuse", "reflex"]).optional(), range: z.union([z.literal(180), z.literal(360)]), scaffold: z.enum(["none", "tens", "protractor"]), speed: z.number().min(0.5).max(1.6), targets: z.string().optional() })).min(1).max(6),
});
export type AngleSpec = z.infer<typeof AngleSchema>;
export function angleKind(a: number): "acute" | "right" | "obtuse" | "straight" | "reflex" { return a < 89.5 ? "acute" : a <= 90.5 ? "right" : a < 179.5 ? "obtuse" : a <= 180.5 ? "straight" : "reflex"; }
const angleDefault: AngleSpec = {
  archetype: "angle-cannon@1", skills: ["c5-maths-ch03-t01", "c6-maths-ch02-t03", "c6-maths-ch02-t04"], lang: "en", strings: { ...AN_STRINGS },
  waves: [
    { title: "Calibrate", sub: "turn from the zero arm, anticlockwise", mode: "call", items: [90, 45, 135, 30], range: 180, scaffold: "tens", speed: 0.8 },
    { title: "Copy the turn", sub: "long arms or short, the turn is the angle", mode: "copy", items: [60, 120, 25, 150], range: 180, scaffold: "none", speed: 0.85, targets: "c5-maths-ch03-t01-m-angle-is-length" },
    { title: "Obtuse only", sub: "bigger than a right angle, less than straight", mode: "classify", items: [40, 110, 95, 150, 70, 125], kind: "obtuse", range: 180, scaffold: "none", speed: 0.9 },
    { title: "Past straight", sub: "the full turn is open now", mode: "call", items: [200, 270, 315, 160], range: 360, scaffold: "none", speed: 0.9, targets: "c5-maths-ch03-t01-m-half-is-quarter" },
  ],
};
function repairAngle(raw: Record<string, unknown>, r: string[]): AngleSpec | null {
  const env = envelope(raw, angleDefault, r);
  const waves: AngleSpec["waves"] = [];
  for (const w of arr(raw.waves, "waves", r).slice(0, 6)) {
    if (!isObj(w)) { r.push("wave:not-an-object"); continue; }
    const mode = oneOf(w.mode, ["call", "copy", "classify"] as const, "call", "mode", r);
    const range = w.range === 360 ? 360 : 180;
    const items = arr(w.items, "items", r).filter((a): a is number => typeof a === "number" && Number.isFinite(a) && a >= 3 && a <= (range === 180 ? 177 : 357)).map((a) => Math.round(a)).slice(0, 8);
    if (arr(w.items, "items", []).length > items.length) r.push("items:dropped");
    if (!items.length) { r.push("wave-empty"); continue; }
    const kind = mode === "classify" ? oneOf(w.kind, ["acute", "right", "obtuse", "reflex"] as const, "obtuse", "kind", r) : undefined;
    if (kind && !items.some((a) => angleKind(a) === kind)) { r.push("classify-no-match"); continue; }
    waves.push({ title: str(w.title, 22, "Wave", "title", r), sub: typeof w.sub === "string" && w.sub.length <= 44 && !MARKUP.test(w.sub) ? w.sub : "", mode, items, ...(kind ? { kind } : {}), range,
      scaffold: oneOf(w.scaffold, ["none", "tens", "protractor"] as const, "none", "scaffold", r), speed: num(w.speed, 0.5, 1.6, 0.9, "speed", r),
      ...(misconceptionOk(w.targets, AN_MISC) ? { targets: w.targets as string } : {}) });
  }
  if (!waves.length) return null;
  return { archetype: "angle-cannon@1", ...env, strings: strings(raw.strings, AN_STRINGS, 44, r), waves };
}
function gradeAngle(spec: AngleSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^w(\d+):(\d+)$/);
  const wave = m ? spec.waves[+m[1] - 1] : undefined;
  const key = wave ? wave.items[+m![2]] : undefined;
  if (!wave || key === undefined) return UNGRADED;
  if (wave.mode === "classify") {
    const fired = isObj(value) ? value.fired === true : false;
    const should = angleKind(key) === wave.kind;
    return { verdict: fired === should ? "right" : "wrong", truth: { angle: key, kind: angleKind(key), shouldFire: should } };
  }
  const g = within(value, key, 5, 12);
  const scale = typeof value === "number" && key !== 90 && wave.range === 180 && Math.abs(value - (180 - key)) <= 5 && g.verdict === "wrong";
  return scale ? { ...g, detail: "c6-maths-ch02-t03-m-wrong-scale" } : g;
}

// ═════════════════════════════ 9. food-web@1 — Balance the Forest (shared population model) ═════════════════════════════
export const SPECIES = {
  grass: { name: "Grass", eats: [] as string[], color: "#7BD389" },
  insects: { name: "Insects", eats: ["grass"], color: "#D8E070" },
  deer: { name: "Deer", eats: ["grass"], color: "#E0B07A" },
  frog: { name: "Frogs", eats: ["insects"], color: "#4FD1A5" },
  snake: { name: "Snakes", eats: ["frog"], color: "#B9A2FF" },
  tiger: { name: "Tigers", eats: ["deer"], color: "#FFB547" },
} as const;
export type SpeciesId = keyof typeof SPECIES;
export const SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[];
/** Model: Beddington-DeAngelis feeding (predator interference stabilises), logistic grass, mortality solved so that
 *  ECO_EQ is an equilibrium of the full web. Tuned 2026-10-04 (scratch sweep R x interference): baseline stays within
 *  ±3% of ECO_EQ over 150 days; removing snakes raises frogs and lowers insects; removing tigers multiplies deer and
 *  lowers grass (the textbook cascades, c4-evs-ch03-t02-m4). */
export const ECO_EQ: Record<SpeciesId, number> = { grass: 600, insects: 240, deer: 48, frog: 60, snake: 12, tiger: 5 };
export const ECO_INIT: Record<SpeciesId, number> = { grass: 820, insects: 260, deer: 60, frog: 70, snake: 14, tiger: 6 };
const ECO_LINKS: [SpeciesId, SpeciesId, number, number][] = [["grass", "insects", 0.0035, 0.45], ["grass", "deer", 0.004, 0.10], ["insects", "frog", 0.008, 0.35], ["frog", "snake", 0.012, 0.22], ["deer", "tiger", 0.03, 0.14]];
const ECO_H = 0.4, ECO_INTERF = 0.6, ECO_R = 0.8, ECO_DROUGHT = 0.8;
/** A species below 10% of its equilibrium counts as lost in keep-alive (12-day drought: doing nothing loses frogs and
 *  insects; easing grazing and supporting the middle of the chain wins — scratch sweep 2026-10-04). */
export const ECO_DANGER = 0.1;
const ecoFeed = (x: Record<SpeciesId, number>, prey: SpeciesId, pred: SpeciesId, a: number) => (a * x[prey]) / (1 + a * ECO_H * x[prey] + (ECO_INTERF * x[pred]) / ECO_EQ[pred]);
const { ECO_M, ECO_K } = (() => {
  const x = ECO_EQ, M = {} as Record<SpeciesId, number>;
  for (const id of SPECIES_IDS) {
    if (id === "grass") { M[id] = 0; continue; }
    const gain = ECO_LINKS.filter((l) => l[1] === id).reduce((s, l) => s + l[3] * ecoFeed(x, l[0], l[1], l[2]), 0);
    const loss = ECO_LINKS.filter((l) => l[0] === id).reduce((s, l) => s + x[l[1]] * ecoFeed(x, l[0], l[1], l[2]), 0) / x[id];
    M[id] = gain - loss;
  }
  const eaten = ECO_LINKS.filter((l) => l[0] === "grass").reduce((s, l) => s + x[l[1]] * ecoFeed(x, l[0], l[1], l[2]), 0);
  return { ECO_M: M, ECO_K: x.grass / (1 - eaten / (ECO_R * x.grass)) };
})();
export interface EcoState { day: number; pop: Record<SpeciesId, number>; drought: number }
export interface EcoAction { day: number; species: SpeciesId; kind: "remove" | "add" | "cull" | "extinct" }
/** One day = 4 fixed sub-steps. Deterministic: the engine animates exactly these numbers and the host re-runs them. */
export function ecoStep(s: EcoState, present: SpeciesId[], droughtLevel = 0): EcoState {
  let x = { ...s.pop };
  for (let k = 0; k < 4; k++) {
    const d = { grass: 0, insects: 0, deer: 0, frog: 0, snake: 0, tiger: 0 } as Record<SpeciesId, number>;
    for (const [prey, pred, a, e] of ECO_LINKS) {
      if (!present.includes(prey) || !present.includes(pred) || x[prey] <= 0 || x[pred] <= 0) continue;
      const f = ecoFeed(x, prey, pred, a) * x[pred];
      d[prey] -= f; d[pred] += e * f;
    }
    const K = ECO_K * (1 - ECO_DROUGHT * droughtLevel);
    d.grass += ECO_R * (1 - 0.5 * droughtLevel) * x.grass * (1 - x.grass / K) + 2;
    for (const id of SPECIES_IDS) if (id !== "grass") d[id] -= ECO_M[id] * x[id];
    const n = { ...x };
    for (const id of SPECIES_IDS) { n[id] = present.includes(id) ? Math.max(0, x[id] + d[id] * 0.25) : 0; if (id !== "grass" && n[id] < 0.5) n[id] = 0; }
    x = n;
  }
  return { day: s.day + 1, pop: x, drought: droughtLevel };
}
export function ecoRun(present: SpeciesId[], days: number, actions: EcoAction[] = [], drought?: { from: number; to: number }, init?: Record<SpeciesId, number>): EcoState[] {
  let pres = [...present];
  const pop = { ...(init ?? ECO_INIT) };
  for (const id of SPECIES_IDS) if (!pres.includes(id)) pop[id] = 0;
  let s: EcoState = { day: 0, pop, drought: 0 };
  const out = [s];
  for (let d = 0; d < days; d++) {
    for (const a of actions) {
      if (a.day !== d) continue;
      if (a.kind === "extinct") { pres = pres.filter((x) => x !== a.species); s = { ...s, pop: { ...s.pop, [a.species]: 0 } }; }
      else if ((a.kind === "remove" || a.kind === "cull") && pres.includes(a.species)) s = { ...s, pop: { ...s.pop, [a.species]: s.pop[a.species] * 0.7 } };
      else if (a.kind === "add" && present.includes(a.species)) { if (!pres.includes(a.species)) pres.push(a.species); s = { ...s, pop: { ...s.pop, [a.species]: s.pop[a.species] + Math.max(2, ECO_EQ[a.species] * 0.25) } }; }
    }
    const dl = drought && d >= drought.from && d < drought.to ? 1 : 0;
    s = ecoStep(s, pres, dl);
    out.push(s);
  }
  return out;
}
export function ecoTrend(present: SpeciesId[], remove: SpeciesId, watch: SpeciesId, days: number): "up" | "down" | "same" {
  const run = ecoRun(present, days, [{ day: 0, species: remove, kind: "extinct" }]);
  const base = ecoRun(present, days);
  const a = run[run.length - 1].pop[watch], b = base[base.length - 1].pop[watch];
  const rel = (a - b) / Math.max(1, b);
  return rel > 0.15 ? "up" : rel < -0.15 ? "down" : "same";
}
const FW_STRINGS = { step: "Step", predict: "First, predict", up: "Goes up", down: "Goes down", same: "About the same", remove: "Remove", add: "Bring in", relocate: "Relocate", day: "DAY", alive: "all alive", lost: "lost", drought: "DROUGHT", arrows: "Drag from the food to the one that eats it", done: "Forest steady", watch: "watch" };
const FW_MISC = ["c4-evs-ch03-t02-m3", "c4-evs-ch03-t02-m4", "c4-evs-ch03-t02-m1"];
const FoodStep = z.union([
  z.object({ kind: z.literal("predict-remove"), remove: z.enum(SPECIES_IDS as [SpeciesId, ...SpeciesId[]]), watch: z.enum(SPECIES_IDS as [SpeciesId, ...SpeciesId[]]), days: z.number().int().min(30).max(120), targets: z.string().optional() }),
  z.object({ kind: z.literal("keep-alive"), days: z.number().int().min(30).max(120), droughtFrom: z.number().int().min(0).max(100), droughtDays: z.number().int().min(0).max(40), targets: z.string().optional() }),
  z.object({ kind: z.literal("arrows"), targets: z.string().optional() }),
]);
const FoodSchema = z.object({
  archetype: z.literal("food-web@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(FW_STRINGS).map((k) => [k, safeStr(48)]))),
  species: z.array(z.enum(SPECIES_IDS as [SpeciesId, ...SpeciesId[]])).min(3).max(6),
  steps: z.array(FoodStep).min(1).max(5),
});
export type FoodSpec = z.infer<typeof FoodSchema>;
const foodDefault: FoodSpec = {
  archetype: "food-web@1", skills: ["c4-evs-ch03-t02", "c6-science-ch02-t03"], lang: "en", strings: { ...FW_STRINGS },
  species: ["grass", "insects", "deer", "frog", "snake", "tiger"],
  steps: [
    { kind: "arrows", targets: "c4-evs-ch03-t02-m3" },
    { kind: "predict-remove", remove: "snake", watch: "insects", days: 70, targets: "c4-evs-ch03-t02-m4" },
    { kind: "predict-remove", remove: "tiger", watch: "grass", days: 90, targets: "c4-evs-ch03-t02-m1" },
    { kind: "keep-alive", days: 80, droughtFrom: 25, droughtDays: 12 },
  ],
};
function repairFood(raw: Record<string, unknown>, r: string[]): FoodSpec | null {
  const env = envelope(raw, foodDefault, r);
  let species = [...new Set(arr(raw.species, "species", r).filter((s): s is SpeciesId => typeof s === "string" && (SPECIES_IDS as string[]).includes(s)))];
  // every consumer needs at least one food present; grass is always the base of the web
  if (!species.includes("grass")) species.unshift("grass");
  species = species.filter((s) => s === "grass" || (SPECIES[s].eats as readonly string[]).some((f) => species.includes(f as SpeciesId)));
  if (species.length < 3) { if (raw.species !== undefined) r.push("species:too-few"); species = [...foodDefault.species]; }
  species = species.slice(0, 6);
  const steps: FoodSpec["steps"] = [];
  for (const s of arr(raw.steps, "steps", r).slice(0, 5)) {
    if (!isObj(s)) { r.push("step:not-an-object"); continue; }
    const tg = misconceptionOk(s.targets, FW_MISC);
    if (s.kind === "arrows") { steps.push({ kind: "arrows", ...(tg ? { targets: tg } : {}) }); continue; }
    if (s.kind === "predict-remove") {
      const rem = s.remove as SpeciesId, wat = s.watch as SpeciesId;
      if (!species.includes(rem) || !species.includes(wat) || rem === wat || rem === "grass") { r.push("step:species"); continue; }
      steps.push({ kind: "predict-remove", remove: rem, watch: wat, days: num(s.days, 30, 120, 70, "days", r, true), ...(tg ? { targets: tg } : {}) });
      continue;
    }
    if (s.kind === "keep-alive") { steps.push({ kind: "keep-alive", days: num(s.days, 30, 120, 80, "days", r, true), droughtFrom: num(s.droughtFrom, 0, 100, 25, "droughtFrom", r, true), droughtDays: num(s.droughtDays, 0, 40, 15, "droughtDays", r, true), ...(tg ? { targets: tg } : {}) }); continue; }
    r.push("step:kind");
  }
  if (!steps.length) return null;
  return { archetype: "food-web@1", ...env, strings: strings(raw.strings, FW_STRINGS, 48, r), species, steps };
}
export function foodLinks(species: SpeciesId[]): [SpeciesId, SpeciesId][] {
  const out: [SpeciesId, SpeciesId][] = [];
  for (const e of species) for (const f of SPECIES[e].eats as readonly SpeciesId[]) if (species.includes(f)) out.push([f, e]);
  return out;
}
function gradeFood(spec: FoodSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^s(\d+)$/);
  const step = m ? spec.steps[+m[1] - 1] : undefined;
  if (!step) return UNGRADED;
  if (step.kind === "predict-remove") {
    const truth = ecoTrend(spec.species, step.remove, step.watch, step.days);
    const pick = isObj(value) ? value.predict : value;
    return { verdict: pick === truth ? "right" : "wrong", truth };
  }
  if (step.kind === "arrows") {
    const want = foodLinks(spec.species).map(([f, e]) => `${f}>${e}`).sort();
    const got = (Array.isArray(value) ? value : []).filter((x): x is string => typeof x === "string").map((x) => x.trim());
    const reversed = got.filter((g) => want.includes(g.split(">").reverse().join(">"))).length;
    const ok = want.every((w) => got.includes(w)) && got.every((g) => want.includes(g));
    return { verdict: ok ? "right" : got.filter((g) => want.includes(g)).length >= want.length / 2 ? "partial" : "wrong", truth: want, detail: reversed ? `reversed:${reversed}` : undefined };
  }
  const acts = (Array.isArray(value) ? value : []).filter(isObj).slice(0, 200).map((a) => ({ day: Math.round(Number(a.day)), species: a.species as SpeciesId, kind: a.kind as EcoAction["kind"] }))
    .filter((a) => Number.isFinite(a.day) && spec.species.includes(a.species) && ["remove", "add", "cull"].includes(a.kind));
  const run = ecoRun(spec.species, step.days, acts, { from: step.droughtFrom, to: step.droughtFrom + step.droughtDays });
  const lost = spec.species.filter((s) => run.some((st) => st.pop[s] < ECO_DANGER * ECO_EQ[s]));
  return { verdict: lost.length === 0 ? "right" : "wrong", truth: { lost } };
}

// ═════════════════════════════ 10. phase-shift@1 — States of water (shared energy model) ═════════════════════════════
export interface WaterState { t: number; T: number; ice: number; liquid: number; vapour: number; escaped: number; droplets: number }
export interface WaterInput { heat: number; fan: number; lid: number }  // heat −1..1 (cool..heat), fan 0..1, lid 0|1 (cold lid on)
export const WATER = { cIce: 2.1, cWater: 4.2, cSteam: 2.0, Lf: 334, Lv: 2260, P: 60, loss: 0.2, room: 25, dt: 1 / 60 };
export function waterInit(T0 = -12): WaterState { return { t: 0, T: T0, ice: T0 < 0 ? 1 : 0, liquid: T0 < 0 ? 0 : 1, vapour: 0, escaped: 0, droplets: 0 }; }
/** One fixed step of the macro model: sensible heat, latent plateaus at 0 °C and 100 °C, evaporation below boiling
 *  (faster with heat and a fan, and it cools what is left), and condensation on a cold lid. */
export function waterStep(s: WaterState, u: WaterInput, dt = WATER.dt): WaterState {
  const W = WATER; const n = { ...s, t: s.t + dt };
  const mass = n.ice + n.liquid;
  if (mass > 1e-4) {
    let Q = W.P * clampN(u.heat, -1, 1) * dt - W.loss * (n.T - W.room) * dt * (u.heat < 0 ? 0.2 : 1);
    if (n.ice > 0 && n.T >= 0 && Q > 0) { const m = Math.min(n.ice, Q / W.Lf); n.ice -= m; n.liquid += m; Q -= m * W.Lf; if (n.ice <= 1e-6) n.ice = 0; else Q = 0; }
    if (n.liquid > 0 && n.T <= 0 && Q < 0) { const m = Math.min(n.liquid, -Q / W.Lf); n.liquid -= m; n.ice += m; Q += m * W.Lf; if (n.liquid > 1e-6) Q = 0; }
    if (n.liquid > 0 && n.T >= 100 && Q > 0) { const m = Math.min(n.liquid, Q / W.Lv); n.liquid -= m; n.vapour += m; Q -= m * W.Lv; if (n.liquid > 1e-6) Q = 0; }
    const c = (n.ice * W.cIce + n.liquid * W.cWater) / Math.max(1e-6, n.ice + n.liquid);
    n.T += Q / (c * Math.max(0.05, n.ice + n.liquid));
    if (n.ice > 0 && n.liquid > 0) n.T = 0;
    if (n.liquid > 0) n.T = Math.min(n.T, 100);
    if (n.T < 100 && n.T > 0 && n.liquid > 0) {                 // evaporation below boiling
      const rate = (0.004 + 0.04 * clampN(u.fan, 0, 1)) * Math.exp((n.T - 100) / 32);   // fraction of the liquid per second
      const m = Math.min(n.liquid, rate * n.liquid * dt);
      n.liquid -= m; n.vapour += m;
      n.T -= (m * W.Lv * 0.18) / (W.cWater * Math.max(0.05, n.liquid));   // evaporation cools what is left
    }
  } else n.T = Math.min(n.T + 2 * dt, 140);
  if (u.lid > 0.5) { const m = n.vapour * 0.9 * dt; n.vapour -= m; n.droplets += m; }
  else { const m = n.vapour * 0.45 * dt; n.vapour -= m; n.escaped += m; }
  return n;
}
export interface WaterLog { t: number; heat: number; fan: number; lid: number }
/** Re-simulates a control log (piecewise constant inputs, sim time) exactly as the engine stepped it. */
export function waterReplay(log: WaterLog[], until: number, T0 = -12): WaterState[] {
  let s = waterInit(T0); const out = [s];
  const sorted = [...log].filter((l) => Number.isFinite(l.t)).sort((a, b) => a.t - b.t);
  let k = 0, u: WaterInput = { heat: 0, fan: 0, lid: 0 };
  const steps = Math.min(Math.round(until / WATER.dt), 60 * 600);
  for (let i = 0; i < steps; i++) {
    while (k < sorted.length && sorted[k].t <= s.t + 1e-9) { u = { heat: clampN(+sorted[k].heat || 0, -1, 1), fan: clampN(+sorted[k].fan || 0, 0, 1), lid: sorted[k].lid ? 1 : 0 }; k++; }
    s = waterStep(s, u);
    if (i % 15 === 0) out.push(s);
  }
  out.push(s);
  return out;
}
export const WATER_PROBES = {
  bubbles: { q: "The bubbles in boiling water are made of…", options: ["air", "water vapour", "heat"], key: "water vapour", misconception: "c6-science-ch08-t01-m1" },
  steam: { q: "The white cloud above a kettle is…", options: ["water vapour", "tiny water droplets", "smoke"], key: "tiny water droplets", misconception: "c6-science-ch08-t01-m2" },
  glass: { q: "Drops on the outside of a cold glass came from…", options: ["inside the glass", "the air around it"], key: "the air around it", misconception: "c6-science-ch08-t02-m1" },
} as const;
export type WaterProbe = keyof typeof WATER_PROBES;
export type WaterGoal = "melt" | "boil" | "evaporate" | "condense";
const waterGone = (s: WaterState) => s.vapour + s.escaped + s.droplets;
/** Goal predicates over a step: `base` is the exact state when the step began, `s` the state now. */
export function waterGoalMet(goal: WaterGoal, s: WaterState, base: WaterState, arg: number): boolean {
  if (goal === "melt") return s.ice <= 0.01 && s.liquid > 0.5;
  if (goal === "boil") return s.T >= 99.9 && waterGone(s) - waterGone(base) >= arg;
  if (goal === "evaporate") return waterGone(s) - waterGone(base) >= arg;
  return s.droplets - base.droplets >= arg;
}
const PS_STRINGS = { step: "Step", heat: "HEAT", cool: "COOL", fan: "FAN", lid: "COLD LID", temp: "TEMP", ice: "ice", water: "water", vapour: "vapour", plateau: "Still 0 °C: the heat is breaking the solid apart", boiling: "100 °C and holding: the heat makes vapour", invisible: "water vapour: invisible", predict: "First, predict", done: "Done", noBoil: "keep it under" };
const PS_MISC = ["c6-science-ch08-t01-m1", "c6-science-ch08-t01-m2", "c6-science-ch08-t02-m1", "c6-science-ch08-t02-m2", "c6-science-ch08-t02-m3", "c5-evs-ch01-t01-m3", "c5-evs-ch01-t01-m4"];
const PhaseStep = z.union([
  z.object({ kind: z.literal("goal"), goal: z.enum(["melt", "boil", "evaporate", "condense"]), arg: z.number().min(0).max(0.6), tMax: z.number().min(30).max(100), text: z.string().max(70), targets: z.string().optional() }),
  z.object({ kind: z.literal("probe"), probe: z.enum(Object.keys(WATER_PROBES) as [WaterProbe, ...WaterProbe[]]), targets: z.string().optional() }),
]);
const PhaseSchema = z.object({
  archetype: z.literal("phase-shift@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(PS_STRINGS).map((k) => [k, safeStr(60)]))),
  start: z.number().min(-20).max(40), steps: z.array(PhaseStep).min(1).max(6),
});
export type PhaseSpec = z.infer<typeof PhaseSchema>;
const phaseDefault: PhaseSpec = {
  archetype: "phase-shift@1", skills: ["c6-science-ch08-t01", "c6-science-ch08-t02", "c6-science-ch08-t03"], lang: "en", strings: { ...PS_STRINGS }, start: -12,
  steps: [
    { kind: "goal", goal: "melt", arg: 0, tMax: 100, text: "Melt the ice. Watch the thermometer." },
    { kind: "goal", goal: "evaporate", arg: 0.12, tMax: 70, text: "Make 12% of it evaporate without boiling", targets: "c6-science-ch08-t02-m2" },
    { kind: "probe", probe: "bubbles", targets: "c6-science-ch08-t01-m1" },
    { kind: "goal", goal: "boil", arg: 0.3, tMax: 100, text: "Boil it until 30% has gone to vapour" },
    { kind: "goal", goal: "condense", arg: 0.08, tMax: 100, text: "Catch the vapour back as water", targets: "c6-science-ch08-t02-m3" },
  ],
};
function repairPhase(raw: Record<string, unknown>, r: string[]): PhaseSpec | null {
  const env = envelope(raw, phaseDefault, r);
  const steps: PhaseSpec["steps"] = [];
  for (const s of arr(raw.steps, "steps", r).slice(0, 6)) {
    if (!isObj(s)) { r.push("step:not-an-object"); continue; }
    const tg = misconceptionOk(s.targets, PS_MISC);
    if (s.kind === "probe") { if (typeof s.probe === "string" && s.probe in WATER_PROBES) steps.push({ kind: "probe", probe: s.probe as WaterProbe, ...(tg ? { targets: tg } : {}) }); else r.push("probe:unknown"); continue; }
    if (s.kind === "goal") {
      const goal = oneOf(s.goal, ["melt", "boil", "evaporate", "condense"] as const, "melt", "goal", r);
      const dflt = goal === "melt" ? 0 : goal === "boil" ? 0.3 : goal === "evaporate" ? 0.12 : 0.08;
      steps.push({ kind: "goal", goal, arg: num(s.arg, 0, 0.6, dflt, "arg", r), tMax: num(s.tMax, 30, 100, goal === "evaporate" ? 70 : 100, "tMax", r), text: str(s.text, 70, "Change the state of the water", "text", r), ...(tg ? { targets: tg } : {}) });
      continue;
    }
    r.push("step:kind");
  }
  if (!steps.length) return null;
  return { archetype: "phase-shift@1", ...env, strings: strings(raw.strings, PS_STRINGS, 60, r), start: num(raw.start, -20, 40, -12, "start", r), steps };
}
function gradePhase(spec: PhaseSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^s(\d+)$/);
  const step = m ? spec.steps[+m[1] - 1] : undefined;
  if (!step) return UNGRADED;
  if (step.kind === "probe") { const key = WATER_PROBES[step.probe].key; const pick = isObj(value) ? value.pick : value; return { verdict: pick === key ? "right" : "wrong", truth: key }; }
  // value: { log, until, from }: the whole control log (sim seconds) and the step's window; the host replays it with the
  // same fixed step count as the engine, so the states at `from` and `until` are exact
  const v = isObj(value) ? value : {};
  const log = (Array.isArray(v.log) ? v.log : []).filter(isObj).slice(0, 8000).map((l) => ({ t: Number(l.t), heat: Number(l.heat), fan: Number(l.fan), lid: Number(l.lid) }));
  const until = typeof v.until === "number" && Number.isFinite(v.until) ? clampN(v.until, 0, 600) : 0;
  const from = typeof v.from === "number" && Number.isFinite(v.from) ? clampN(v.from, 0, until) : 0;
  const states = waterReplay(log, until, spec.start), last = states[states.length - 1];
  const baseRun = waterReplay(log, from, spec.start), base = baseRun[baseRun.length - 1];
  const okTemp = step.goal !== "evaporate" || states.filter((s) => s.t >= from - 1e-9).every((s) => s.T <= step.tMax + 0.5);
  const met = waterGoalMet(step.goal, last, base, step.arg) && okTemp;
  return { verdict: met ? "right" : "wrong", truth: { T: +last.T.toFixed(1), ice: +last.ice.toFixed(3), liquid: +last.liquid.toFixed(3), gone: +(waterGone(last) - waterGone(base)).toFixed(3), droplets: +(last.droplets - base.droplets).toFixed(3), underTMax: okTemp } };
}

// ═════════════════════════════ 11. balance-beam@1 — Tilt (torque) ═════════════════════════════
const BB_STRINGS = { coach: "Drag weights onto the pegs", round: "Round", balanced: "BALANCED", leftHeavy: "left side heavier", rightHeavy: "right side heavier", reveal: "the crate weighs", sameBoth: "Take the same off both sides", kg: "kg", g: "g", runDone: "All level", hold: "hold it level" };
const BB_MISC = ["c7-maths-ch15-t02-m-one-side", "c7-maths-ch15-t02-m-move-no-change", "c7-maths-ch15-t01-m-letter-label", "c4-maths-ch08-t01-m-kg-is-100g", "c4-maths-ch08-t01-m-number-only"];
const Placed = z.object({ w: z.number().int().min(1).max(2000), d: z.number().int().min(1).max(5) });
const BeamSchema = z.object({
  archetype: z.literal("balance-beam@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(BB_STRINGS).map((k) => [k, safeStr(40)]))),
  rounds: z.array(z.object({ mode: z.enum(["lever", "unknown", "sameBoth", "pans"]), title: z.string().max(24), sub: z.string().max(48), unit: z.enum(["kg", "g"]), left: z.array(Placed).max(8), right: z.array(Placed).max(8), tray: z.array(z.number().int().min(1).max(2000)).max(8), unknown: z.object({ w: z.number().int().min(1).max(50), d: z.number().int().min(1).max(5), n: z.number().int().min(1).max(4) }).optional(), targets: z.string().optional() })).min(1).max(6),
});
export type BeamSpec = z.infer<typeof BeamSchema>;
type BeamRound = BeamSpec["rounds"][number];
export function torque(left: { w: number; d: number }[], right: { w: number; d: number }[]): number { return right.reduce((a, p) => a + p.w * p.d, 0) - left.reduce((a, p) => a + p.w * p.d, 0); }
function beamSolvable(r0: BeamRound): boolean {
  // is there any placement of tray weights (each used at most once, pegs 1..5, pans at d=4) that balances?
  const L = r0.left.reduce((a, p) => a + p.w * p.d, 0) + (r0.unknown ? r0.unknown.n * r0.unknown.w * r0.unknown.d : 0);
  const Rr = r0.right.reduce((a, p) => a + p.w * p.d, 0);
  if (r0.mode === "sameBoth") return L === Rr;
  const need = L - Rr;
  const ds = r0.mode === "pans" ? [4] : [1, 2, 3, 4, 5];
  const reach = new Set<number>([0]);
  for (const w of r0.tray) { const add: number[] = []; for (const s of reach) for (const d of ds) { add.push(s + w * d); add.push(s - w * d); } for (const a of add) if (Math.abs(a) <= 4000) reach.add(a); }
  return reach.has(need);
}
const beamDefault: BeamSpec = {
  archetype: "balance-beam@1", skills: ["c7-maths-ch15-t02", "c7-maths-ch15-t01", "c4-maths-ch08-t01"], lang: "en", strings: { ...BB_STRINGS },
  rounds: [
    { mode: "lever", title: "Level it", sub: "a weight further out turns harder", unit: "kg", left: [{ w: 3, d: 2 }], right: [], tray: [1, 2, 6], },
    { mode: "lever", title: "Further out", sub: "weight × distance, both sides", unit: "kg", left: [{ w: 4, d: 3 }], right: [], tray: [3, 5, 2] },
    { mode: "unknown", title: "Mystery crate", sub: "balance it and the crate gives itself away", unit: "kg", left: [], right: [], tray: [1, 2, 4, 5], unknown: { w: 7, d: 2, n: 1 }, targets: "c7-maths-ch15-t01-m-letter-label" },
    { mode: "sameBoth", title: "Same to both sides", sub: "2 crates + 3 = 11 · keep it level", unit: "kg", left: [{ w: 1, d: 2 }, { w: 1, d: 2 }, { w: 1, d: 2 }], right: [{ w: 1, d: 2 }, { w: 1, d: 2 }, { w: 1, d: 2 }, { w: 8, d: 2 }], tray: [], unknown: { w: 4, d: 2, n: 2 }, targets: "c7-maths-ch15-t02-m-one-side" },
    { mode: "pans", title: "1 kg, in grams", sub: "how many grams balance one kilogram?", unit: "g", left: [{ w: 1000, d: 4 }], right: [], tray: [500, 200, 200, 100, 50], targets: "c4-maths-ch08-t01-m-kg-is-100g" },
  ],
};
function repairBeam(raw: Record<string, unknown>, r: string[]): BeamSpec | null {
  const env = envelope(raw, beamDefault, r);
  const rounds: BeamSpec["rounds"] = [];
  const placed = (v: unknown, key: string, pans: boolean) => arr(v, key, r).filter(isObj).map((p) => ({ w: Math.round(Number(p.w)), d: pans ? 4 : Math.round(Number(p.d)) })).filter((p) => p.w >= 1 && p.w <= 2000 && p.d >= 1 && p.d <= 5).slice(0, 8);
  for (const w of arr(raw.rounds, "rounds", r).slice(0, 6)) {
    if (!isObj(w)) { r.push("round:not-an-object"); continue; }
    const mode = oneOf(w.mode, ["lever", "unknown", "sameBoth", "pans"] as const, "lever", "mode", r);
    const pans = mode === "pans";
    const unknown = isObj(w.unknown) && Number.isInteger(w.unknown.w) && Number.isInteger(w.unknown.d) && (w.unknown.w as number) >= 1 && (w.unknown.w as number) <= 50 && (w.unknown.d as number) >= 1 && (w.unknown.d as number) <= 5 ? { w: w.unknown.w as number, d: w.unknown.d as number, n: Number.isInteger(w.unknown.n) ? clampN(w.unknown.n as number, 1, 4) : 1 } : undefined;
    if ((mode === "unknown" || mode === "sameBoth") && !unknown) { r.push("round:unknown-missing"); continue; }
    const round: BeamRound = { mode, title: str(w.title, 24, "Level it", "title", r), sub: typeof w.sub === "string" && w.sub.length <= 48 && !MARKUP.test(w.sub) ? w.sub : "", unit: oneOf(w.unit, ["kg", "g"] as const, pans ? "g" : "kg", "unit", r),
      left: placed(w.left, "left", pans), right: placed(w.right, "right", pans), tray: arr(w.tray, "tray", r).filter((x): x is number => typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= 2000).slice(0, 8),
      ...(unknown ? { unknown } : {}), ...(misconceptionOk(w.targets, BB_MISC) ? { targets: w.targets as string } : {}) };
    if (mode !== "sameBoth" && !round.tray.length) { r.push("round:empty-tray"); continue; }
    if (!beamSolvable(round)) { r.push("round:unsolvable"); continue; }
    rounds.push(round);
  }
  if (!rounds.length) return null;
  return { archetype: "balance-beam@1", ...env, strings: strings(raw.strings, BB_STRINGS, 40, r), rounds };
}
function gradeBeam(spec: BeamSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^r(\d+)$/);
  const round = m ? spec.rounds[+m[1] - 1] : undefined;
  if (!round) return UNGRADED;
  const v = isObj(value) ? value : {};
  const side = (k: string) => (Array.isArray(v[k]) ? (v[k] as unknown[]) : []).filter(isObj).map((p) => ({ w: Number(p.w), d: round.mode === "pans" ? 4 : Number(p.d) })).filter((p) => Number.isInteger(p.w) && Number.isInteger(p.d) && p.d >= 1 && p.d <= 5);
  const added = { left: side("left"), right: side("right") };
  // tray weights may be used once each (multiset check)
  const pool = [...round.tray];
  for (const p of [...added.left, ...added.right]) { const i = pool.indexOf(p.w); if (i < 0) return { verdict: "wrong", truth: null, detail: "weight-not-in-tray" }; pool.splice(i, 1); }
  if (round.mode === "sameBoth") {
    const removed = { left: side("removedLeft"), right: side("removedRight") };
    const L = [...round.left], R = [...round.right];
    for (const p of removed.left) { const i = L.findIndex((q) => q.w === p.w && q.d === p.d); if (i < 0) return { verdict: "wrong", truth: null, detail: "bad-removal" }; L.splice(i, 1); }
    for (const p of removed.right) { const i = R.findIndex((q) => q.w === p.w && q.d === p.d); if (i < 0) return { verdict: "wrong", truth: null, detail: "bad-removal" }; R.splice(i, 1); }
    const crates = Array.from({ length: round.unknown!.n }, () => ({ w: round.unknown!.w, d: round.unknown!.d }));
    const level = torque([...L, ...crates], R) === 0;
    const isolated = L.length === 0;
    return { verdict: level && isolated ? "right" : level ? "partial" : "wrong", truth: { unknown: round.unknown!.w }, detail: level ? undefined : "c7-maths-ch15-t02-m-one-side" };
  }
  const crates = round.unknown ? Array.from({ length: round.unknown.n }, () => ({ w: round.unknown!.w, d: round.unknown!.d })) : [];
  const L = [...round.left, ...added.left, ...crates], R = [...round.right, ...added.right];
  const t = torque(L, R);
  return { verdict: t === 0 ? "right" : "wrong", truth: round.unknown ? { unknown: round.unknown.w } : { torque: 0 }, error: Math.abs(t) };
}

// ═════════════════════════════ 12. shadow-play@1 — Shadow catcher (shared geometry) ═════════════════════════════
export const SHADOW = { bench: 520, objX: 690, screenX: 900, objH: 120, torchMin: 60, torchMax: 620, torchY: 460 };
/** Shadow height on the screen for a point source at torch x (similar triangles). */
export function shadowFactor(torchX: number): number { const S = SHADOW; return (S.screenX - torchX) / Math.max(1e-6, S.objX - torchX); }
/** Torch x that gives magnification f (inverse of shadowFactor). */
export function torchForFactor(f: number): number { const S = SHADOW; return (S.screenX - f * S.objX) / (1 - f); }
export const SHADOW_MATERIALS = {
  card: { name: "Cardboard", kind: "opaque", pass: 0 }, redcard: { name: "Red card", kind: "opaque", pass: 0 },
  tracing: { name: "Tracing paper", kind: "translucent", pass: 0.55 }, glass: { name: "Clear glass", kind: "transparent", pass: 0.95 },
  wood: { name: "Wooden block", kind: "opaque", pass: 0 }, frosted: { name: "Frosted glass", kind: "translucent", pass: 0.6 },
} as const;
export type ShadowMat = keyof typeof SHADOW_MATERIALS;
/** The moving target band for "catch" rounds: centre factor and half-width, a pure function of time. */
export function shadowBand(t: number, lo: number, hi: number): { f: number; half: number } {
  const mid = (lo + hi) / 2, amp = (hi - lo) / 2;
  return { f: mid + amp * Math.sin(t * 0.55) * Math.cos(t * 0.21), half: 0.12 };
}
const SP_STRINGS = { step: "Step", torch: "Drag the torch", tall: "TALL", times: "× the object", hold: "hold it", got: "Locked", band: "Keep the shadow's top in the band", opaque: "Opaque", translucent: "Translucent", transparent: "Transparent", sort: "Drop each one in the light, then sort it", done: "Light done", shadowColour: "shadow colour" };
const SP_MISC = ["c7-science-ch11-t02-m1", "c7-science-ch11-t02-m2", "c7-science-ch11-t02-m3", "c4-evs-ch10-t01-m1", "c4-evs-ch10-t01-m2"];
const ShadowStep = z.union([
  z.object({ kind: z.literal("size"), factor: z.number().min(1.15).max(3.5), targets: z.string().optional() }),
  z.object({ kind: z.literal("catch"), lo: z.number().min(1.15).max(3.5), hi: z.number().min(1.2).max(3.6), seconds: z.number().min(2).max(8), targets: z.string().optional() }),
  z.object({ kind: z.literal("materials"), items: z.array(z.enum(Object.keys(SHADOW_MATERIALS) as [ShadowMat, ...ShadowMat[]])).min(2).max(6), targets: z.string().optional() }),
]);
const ShadowSchema = z.object({
  archetype: z.literal("shadow-play@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(SP_STRINGS).map((k) => [k, safeStr(52)]))),
  steps: z.array(ShadowStep).min(1).max(6),
});
export type ShadowSpec = z.infer<typeof ShadowSchema>;
const shadowDefault: ShadowSpec = {
  archetype: "shadow-play@1", skills: ["c7-science-ch11-t02", "c7-science-ch11-t01", "c4-evs-ch10-t01"], lang: "en", strings: { ...SP_STRINGS },
  steps: [
    { kind: "size", factor: 2, targets: "c7-science-ch11-t02-m3" },
    { kind: "size", factor: 1.5 },
    { kind: "catch", lo: 1.4, hi: 2.8, seconds: 4 },
    { kind: "materials", items: ["card", "tracing", "glass", "redcard"], targets: "c7-science-ch11-t02-m2" },
  ],
};
function repairShadow(raw: Record<string, unknown>, r: string[]): ShadowSpec | null {
  const env = envelope(raw, shadowDefault, r);
  const steps: ShadowSpec["steps"] = [];
  const minF = shadowFactor(SHADOW.torchMin), maxF = shadowFactor(SHADOW.torchMax);
  for (const s of arr(raw.steps, "steps", r).slice(0, 6)) {
    if (!isObj(s)) { r.push("step:not-an-object"); continue; }
    const tg = misconceptionOk(s.targets, SP_MISC);
    if (s.kind === "size") { const f = num(s.factor, Math.max(1.15, minF + 0.02), Math.min(3.5, maxF - 0.05), 2, "factor", r); steps.push({ kind: "size", factor: +f.toFixed(2), ...(tg ? { targets: tg } : {}) }); continue; }
    if (s.kind === "catch") { let lo = num(s.lo, 1.15, 3.5, 1.4, "lo", r), hi = num(s.hi, 1.2, 3.6, 2.8, "hi", r); if (hi < lo + 0.3) { r.push("catch:band"); hi = Math.min(3.6, lo + 0.8); } steps.push({ kind: "catch", lo, hi, seconds: num(s.seconds, 2, 8, 4, "seconds", r), ...(tg ? { targets: tg } : {}) }); continue; }
    if (s.kind === "materials") { const items = [...new Set(arr(s.items, "items", r).filter((m): m is ShadowMat => typeof m === "string" && m in SHADOW_MATERIALS))].slice(0, 6); if (items.length >= 2) steps.push({ kind: "materials", items, ...(tg ? { targets: tg } : {}) }); else r.push("materials:too-few"); continue; }
    r.push("step:kind");
  }
  if (!steps.length) return null;
  return { archetype: "shadow-play@1", ...env, strings: strings(raw.strings, SP_STRINGS, 52, r), steps };
}
function gradeShadow(spec: ShadowSpec, itemId: string, value: unknown): Graded {
  const m = itemId.match(/^s(\d+)$/);
  const step = m ? spec.steps[+m[1] - 1] : undefined;
  if (!step) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (step.kind === "size") {
    const x = Number(v.torchX);
    if (!Number.isFinite(x)) return { verdict: "wrong", truth: step.factor, detail: "no-value" };
    const f = shadowFactor(clampN(x, SHADOW.torchMin, SHADOW.torchMax)), rel = Math.abs(f - step.factor) / step.factor;
    return { verdict: rel <= 0.04 ? "right" : rel <= 0.09 ? "partial" : "wrong", truth: step.factor, error: +rel.toFixed(3) };
  }
  if (step.kind === "catch") {
    // value.samples: [[t, torchX], ...] at ~10 Hz; the host recomputes in-band time from geometry
    const samples = (Array.isArray(v.samples) ? v.samples : []).filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === "number" && Number.isFinite(x))).slice(0, 2000);
    let inBand = 0;
    for (let i = 1; i < samples.length; i++) { const [t, x] = samples[i], dt = clampN(t - samples[i - 1][0], 0, 0.25); const b = shadowBand(t, step.lo, step.hi); if (Math.abs(shadowFactor(clampN(x, SHADOW.torchMin, SHADOW.torchMax)) - b.f) <= b.half) inBand += dt; }
    return { verdict: inBand >= step.seconds - 0.15 ? "right" : inBand >= step.seconds / 2 ? "partial" : "wrong", truth: step.seconds, error: +inBand.toFixed(2) };
  }
  const sorted = isObj(v.sorted) ? v.sorted : {};
  const wrong = step.items.filter((it) => sorted[it] !== SHADOW_MATERIALS[it].kind);
  return { verdict: wrong.length === 0 ? "right" : wrong.length <= 1 ? "partial" : "wrong", truth: Object.fromEntries(step.items.map((it) => [it, SHADOW_MATERIALS[it].kind])), detail: wrong.length ? `wrong:${wrong.join(",")}` : undefined };
}

// ═════════════════════════════ 13. water-cycle@1 — explainer ═════════════════════════════
export const WC_VERBS = ["show", "hide", "set", "camera", "sun", "evaporate", "wind", "condense", "rain", "flow", "zoom", "interactive"] as const;
export const WC_VAPOUR_REGION = { x: 140, y: 150, w: 520, h: 230 };   // where the (invisible) vapour is in the interactive frame
const WC_STRINGS = { title: "Where does rain come from?", sea: "SEA", vapour: "WATER VAPOUR · INVISIBLE", cloud: "CLOUD = TINY DROPLETS", rain: "RAIN", ground: "GROUNDWATER", river: "RIVER", cool: "COOLER HIGHER UP", task: "Tap where the water you can't see is", steam: "STEAM YOU SEE = DROPLETS", gap: "CLEAR GAP = VAPOUR" };
const WC_TEXT: Record<string, string> = {
  W01: "Every day, the Sun lifts tonnes of water off the sea. You never see it go.",
  W02: "Heated water at the surface escapes as vapour: a gas, and completely invisible.",
  W03: "Look at a kettle. The gap just above the spout looks empty. That gap is the vapour.",
  W04: "The white cloud further up is not vapour. It is tiny droplets, already cooled back into liquid.",
  W05: "Warm, wet air rises. Higher up it is colder, and the vapour condenses onto specks of dust.",
  W06: "Billions of droplets make a cloud. Wind pushes it inland, against the hills.",
  W07: "Forced higher still, droplets bump, join and grow until they are too heavy to float.",
  W08: "That is rain. Some runs off into rivers. Some soaks down between the grains of soil and rock.",
  W09: "Groundwater is not an underground lake. It fills the tiny gaps, like water in a sponge.",
  W10: "Rivers and groundwater flow back to the sea, and the Sun starts again. Same water, round and round.",
};
const WaterCycleSchema = z.object({
  archetype: z.literal("water-cycle@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(WC_STRINGS).map((k) => [k, safeStr(44)]))),
  text: z.record(z.string(), z.string().max(240)), narration: z.record(z.string(), NarrLine), beats: z.array(Beat).min(1).max(40),
});
export type WaterCycleSpec = z.infer<typeof WaterCycleSchema>;
const wcBeats: BeatT[] = [
  { line: "W01", gap: 0.4, cues: [{ at: 0, do: "show", target: ["sea", "sun", "land"], dur: 1.2 }, { at: 0.2, do: "show", target: "title", dur: 0.8 }, { at: "end", do: "hide", target: "title", dur: 0.6 }] },
  { line: "W02", gap: 0.4, cues: [{ at: 0, do: "sun", to: 1, dur: 1.4 }, { at: 0.6, do: "evaporate", to: 1, dur: 2.2 }, { at: "s2", do: "show", target: "lbl.vapour", dur: 0.6 }] },
  { line: "W03", gap: 0.4, cues: [{ at: 0, do: "zoom", to: 1, dur: 1.2 }, { at: 0.8, do: "show", target: ["kettle", "lbl.gap"], dur: 0.8 }] },
  { line: "W04", gap: 0.6, cues: [{ at: 0, do: "show", target: "lbl.steam", dur: 0.6 }, { at: "end", do: "zoom", to: 0, dur: 1.2 }, { at: "end", do: "hide", target: ["kettle", "lbl.gap", "lbl.steam"], dur: 0.6 }] },
  { line: "W05", gap: 0.4, cues: [{ at: 0, do: "show", target: "lbl.cool", dur: 0.6 }, { at: "s2", do: "condense", to: 1, dur: 2.6 }] },
  { line: "W06", gap: 0.4, cues: [{ at: 0, do: "show", target: "lbl.cloud", dur: 0.6 }, { at: "s2", do: "wind", to: 1, dur: 3.2 }, { at: "end", do: "hide", target: ["lbl.cool", "lbl.vapour"], dur: 0.5 }] },
  { line: "W07", gap: 0.3, cues: [{ at: 0, do: "camera", x: 640, zoom: 1.25, dur: 2.2 }] },
  { line: "W08", gap: 0.5, cues: [{ at: 0, do: "rain", to: 1, dur: 1.0 }, { at: 0, do: "show", target: "lbl.rain", dur: 0.5 }, { at: "s2", do: "flow", to: 1, dur: 2.4 }, { at: "s2", do: "show", target: "lbl.river", dur: 0.5 }, { at: "s3", do: "show", target: "ground", dur: 1.2 }] },
  { line: "W09", gap: 0.5, cues: [{ at: 0, do: "camera", x: 600, y: 470, zoom: 2.2, dur: 1.8 }, { at: 0.6, do: "show", target: "lbl.ground", dur: 0.6 }] },
  { line: "W10", gap: 0, cues: [{ at: 0, do: "camera", x: 500, y: 312, zoom: 1, dur: 2.2 }, { at: 0, do: "rain", to: 0, dur: 1.4 }, { at: 0.3, do: "hide", target: ["lbl.rain", "lbl.ground", "lbl.cloud", "lbl.river"], dur: 0.6 }, { at: "end", do: "interactive" }] },
];
const wcDefault: WaterCycleSpec = { archetype: "water-cycle@1", skills: ["c7-science-ch07-t04", "c6-science-ch08-t02", "c5-evs-ch01-t01"], lang: "en", strings: { ...WC_STRINGS }, text: { ...WC_TEXT }, narration: {}, beats: wcBeats };
function repairWaterCycle(raw: Record<string, unknown>, r: string[]): WaterCycleSpec | null {
  const env = envelope(raw, wcDefault, r);
  const text = repairText(raw.text, raw.text === undefined ? WC_TEXT : {}, r), narration = repairNarration(raw.narration, {}, r);
  const beats = repairBeats(raw, WC_VERBS, text, narration, r);
  if (!beats.length || beats.length < 0.5 * (Array.isArray(raw.beats) ? raw.beats.length : 1)) return null;
  return { archetype: "water-cycle@1", ...env, strings: strings(raw.strings, WC_STRINGS, 44, r), text, narration, beats };
}
function gradeWaterCycle(_s: WaterCycleSpec, itemId: string, value: unknown): Graded {
  if (itemId !== "tap_vapour") return UNGRADED;
  const v = isObj(value) ? value : {}; const x = Number(v.x), y = Number(v.y), R = WC_VAPOUR_REGION;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { verdict: "wrong", truth: R, detail: "no-value" };
  return { verdict: x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h ? "right" : "wrong", truth: R };
}

// ═════════════════════════════ 14. scale-cinematic@1 — Solar system to scale ═════════════════════════════
export const PLANETS = [
  { id: "mercury", name: "Mercury", au: 0.39, km: 2440, color: "#A9A6A0" }, { id: "venus", name: "Venus", au: 0.72, km: 6052, color: "#E8C98A" },
  { id: "earth", name: "Earth", au: 1.0, km: 6371, color: "#4F8FEA" }, { id: "mars", name: "Mars", au: 1.52, km: 3390, color: "#D9774A" },
  { id: "jupiter", name: "Jupiter", au: 5.2, km: 69911, color: "#D7B48A" }, { id: "saturn", name: "Saturn", au: 9.58, km: 58232, color: "#E6D29A" },
  { id: "uranus", name: "Uranus", au: 19.2, km: 25362, color: "#9FDCE6" }, { id: "neptune", name: "Neptune", au: 30.05, km: 24622, color: "#5B7BEA" },
] as const;
export const SUN_KM = 695700;
export const SS_VERBS = ["show", "hide", "set", "camera", "scale", "travel", "orbit", "interactive"] as const;
const SS_STRINGS = { title: "How big is the solar system?", notToScale: "TEXTBOOK VIEW · NOT TO SCALE", toScale: "DISTANCES TO SCALE", sun: "SUN", au: "1 AU = 15 crore km", light: "LIGHT TIME", task: "Drag Mars to where it really sits", july: "JULY · FARTHEST", jan: "JANUARY · CLOSEST", seasons: "Distance changes by only 3%" };
const SS_TEXT: Record<string, string> = {
  P01: "Most diagrams squeeze the planets into a neat row, almost touching. Let's fix that.",
  P02: "Put the distances to scale. Earth sits one unit from the Sun: about fifteen crore kilometres.",
  P03: "Mercury, Venus, Earth and Mars crowd close in. Then a huge gap before Jupiter.",
  P04: "Saturn is nearly ten units out. Neptune, thirty. Light from the Sun takes four hours to get there.",
  P05: "Sizes too: if the Sun were a football, Earth would be a peppercorn, twenty-five steps away.",
  P06: "Earth's path is almost a circle. Our distance from the Sun changes by about three percent.",
  P07: "We are closest in January, during India's winter. So distance can't be what makes summer.",
  P08: "Your turn. Drag Mars to where it really sits on this scale.",
};
const ScaleSchema = z.object({
  archetype: z.literal("scale-cinematic@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(SS_STRINGS).map((k) => [k, safeStr(44)]))),
  text: z.record(z.string(), z.string().max(240)), narration: z.record(z.string(), NarrLine), beats: z.array(Beat).min(1).max(40),
  ask: z.enum(PLANETS.map((p) => p.id) as [string, ...string[]]),
});
export type ScaleSpec = z.infer<typeof ScaleSchema>;
const ssBeats: BeatT[] = [
  { line: "P01", gap: 0.5, cues: [{ at: 0, do: "show", target: ["title", "row", "lbl.notToScale"], dur: 1.0 }, { at: "end", do: "hide", target: "title", dur: 0.5 }] },
  { line: "P02", gap: 0.5, cues: [{ at: 0, do: "scale", to: 1, dur: 3.2 }, { at: 0.2, do: "hide", target: "lbl.notToScale", dur: 0.5 }, { at: 1.4, do: "show", target: ["lbl.toScale", "lbl.au", "axis"], dur: 0.6 }] },
  { line: "P03", gap: 0.4, cues: [{ at: 0, do: "camera", x: 120, zoom: 3.2, dur: 2.0 }, { at: "s2", do: "camera", x: 300, zoom: 1.4, dur: 2.2 }] },
  { line: "P04", gap: 0.5, cues: [{ at: 0, do: "camera", x: 500, zoom: 1, dur: 2.0 }, { at: "s2", do: "travel", to: 1, dur: 4.0 }, { at: "s2", do: "show", target: "lbl.light", dur: 0.5 }] },
  { line: "P05", gap: 0.6, cues: [{ at: 0, do: "hide", target: ["lbl.light", "axis", "lbl.au", "lbl.toScale"], dur: 0.6 }, { at: 0, do: "show", target: "sizes", dur: 1.2 }] },
  { line: "P06", gap: 0.4, cues: [{ at: 0, do: "hide", target: ["sizes", "row"], dur: 0.8 }, { at: 0.2, do: "show", target: "orbit", dur: 1.2 }, { at: 0.6, do: "orbit", to: 1, dur: 4.5 }, { at: "s2", do: "show", target: "lbl.seasons", dur: 0.6 }] },
  { line: "P07", gap: 0.5, cues: [{ at: 0, do: "show", target: ["lbl.jan", "lbl.july"], dur: 0.6 }] },
  { line: "P08", gap: 0, cues: [{ at: 0, do: "hide", target: ["orbit", "lbl.jan", "lbl.july", "lbl.seasons"], dur: 0.6 }, { at: 0.3, do: "show", target: ["axis", "lbl.au"], dur: 0.6 }, { at: "end", do: "interactive" }] },
];
const ssDefault: ScaleSpec = { archetype: "scale-cinematic@1", skills: ["c6-science-ch12-t02", "c7-science-ch12-t02"], lang: "en", strings: { ...SS_STRINGS }, text: { ...SS_TEXT }, narration: {}, beats: ssBeats, ask: "mars" };
function repairScale(raw: Record<string, unknown>, r: string[]): ScaleSpec | null {
  const env = envelope(raw, ssDefault, r);
  const text = repairText(raw.text, raw.text === undefined ? SS_TEXT : {}, r), narration = repairNarration(raw.narration, {}, r);
  const beats = repairBeats(raw, SS_VERBS, text, narration, r);
  if (!beats.length || beats.length < 0.5 * (Array.isArray(raw.beats) ? raw.beats.length : 1)) return null;
  const ask = oneOf(raw.ask, PLANETS.map((p) => p.id), "mars", "ask", r);
  return { archetype: "scale-cinematic@1", ...env, strings: strings(raw.strings, SS_STRINGS, 44, r), text, narration, beats, ask };
}
function gradeScale(spec: ScaleSpec, itemId: string, value: unknown): Graded {
  if (itemId !== "place_planet") return UNGRADED;
  const p = PLANETS.find((q) => q.id === spec.ask)!;
  // value: the AU the child placed it at (the engine maps x to AU on its linear axis 0..12 AU or 0..32 AU)
  const au = isObj(value) ? Number(value.au) : Number(value);
  if (!Number.isFinite(au)) return { verdict: "wrong", truth: p.au, detail: "no-value" };
  const span = p.au <= 10 ? 12 : 32, e = Math.abs(au - p.au) / span;
  return { verdict: e <= 0.04 ? "right" : e <= 0.09 ? "partial" : "wrong", truth: p.au, error: +(e * 100).toFixed(1) };
}

// ═════════════════════════════ 15. angle-sum@1 — Tear and align (explainer) ═════════════════════════════
export const AS_VERBS = ["show", "hide", "set", "camera", "tear", "align", "morph", "interactive"] as const;
const AS_STRINGS = { title: "Why 180°?", straight: "STRAIGHT LINE = 180°", sum: "SUM", task: "Drag the last corner to fill the line", tryObtuse: "Try to make two obtuse angles", never: "Two obtuse angles never close" };
const AS_TEXT: Record<string, string> = {
  T01: "Draw any triangle. Big, small, thin, it doesn't matter.",
  T02: "Tear off its three corners.",
  T03: "Now put the three corners side by side, points together.",
  T04: "They make a straight line. And a straight line is exactly 180 degrees.",
  T05: "Stretch the triangle. One angle grows, the others shrink. The total never moves.",
  T06: "A giant triangle and a tiny one: still 180. Size changes the sides, not the turn.",
  T07: "Your turn. Two corners are on the line. Drag the third one in.",
};
const AngleSumSchema = z.object({
  archetype: z.literal("angle-sum@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(AS_STRINGS).map((k) => [k, safeStr(44)]))),
  text: z.record(z.string(), z.string().max(240)), narration: z.record(z.string(), NarrLine), beats: z.array(Beat).min(1).max(30),
  triangle: z.tuple([z.number().min(15).max(130), z.number().min(15).max(130)]), task: z.tuple([z.number().min(20).max(120), z.number().min(20).max(120)]),
});
export type AngleSumSpec = z.infer<typeof AngleSumSchema>;
const asBeats: BeatT[] = [
  { line: "T01", gap: 0.4, cues: [{ at: 0, do: "show", target: ["title", "triangle"], dur: 1.0 }, { at: "end", do: "hide", target: "title", dur: 0.5 }] },
  { line: "T02", gap: 0.4, cues: [{ at: 0, do: "tear", to: 1, dur: 1.6 }] },
  { line: "T03", gap: 0.3, cues: [{ at: 0, do: "align", to: 1, dur: 2.4 }] },
  { line: "T04", gap: 0.6, cues: [{ at: 0.4, do: "show", target: "lbl.straight", dur: 0.6 }] },
  { line: "T05", gap: 0.5, cues: [{ at: 0, do: "align", to: 0, dur: 1.2 }, { at: 0, do: "tear", to: 0, dur: 1.2 }, { at: 0.2, do: "hide", target: "lbl.straight", dur: 0.4 }, { at: 0.8, do: "show", target: "sum", dur: 0.6 }, { at: 0.8, do: "morph", to: 1, dur: 4.0 }] },
  { line: "T06", gap: 0.5, cues: [{ at: 0, do: "camera", zoom: 0.6, dur: 1.6 }, { at: "s2", do: "camera", zoom: 1.6, dur: 1.6 }, { at: "end", do: "camera", zoom: 1, dur: 1.0 }] },
  { line: "T07", gap: 0, cues: [{ at: 0, do: "hide", target: ["triangle", "sum"], dur: 0.6 }, { at: "end", do: "interactive" }] },
];
const asDefault: AngleSumSpec = { archetype: "angle-sum@1", skills: ["c7-maths-ch07-t03"], lang: "en", strings: { ...AS_STRINGS }, text: { ...AS_TEXT }, narration: {}, beats: asBeats, triangle: [62, 48], task: [55, 70] };
function repairAngleSum(raw: Record<string, unknown>, r: string[]): AngleSumSpec | null {
  const env = envelope(raw, asDefault, r);
  const text = repairText(raw.text, raw.text === undefined ? AS_TEXT : {}, r), narration = repairNarration(raw.narration, {}, r);
  const beats = repairBeats(raw, AS_VERBS, text, narration, r);
  if (!beats.length || beats.length < 0.5 * (Array.isArray(raw.beats) ? raw.beats.length : 1)) return null;
  const pair = (v: unknown, lo: number, hi: number, d: [number, number], key: string): [number, number] => {
    if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi) && (v[0] as number) + (v[1] as number) <= 160) return [Math.round(v[0] as number), Math.round(v[1] as number)];
    if (v !== undefined) r.push(key); return d;
  };
  return { archetype: "angle-sum@1", ...env, strings: strings(raw.strings, AS_STRINGS, 44, r), text, narration, beats, triangle: pair(raw.triangle, 15, 130, asDefault.triangle, "triangle"), task: pair(raw.task, 20, 120, asDefault.task, "task") };
}
function gradeAngleSum(spec: AngleSumSpec, itemId: string, value: unknown): Graded {
  if (itemId !== "third_angle") return UNGRADED;
  const key = 180 - spec.task[0] - spec.task[1];
  const g = within(isObj(value) ? Number(value.angle) : value, key, 4, 10);
  return g;
}

// ═════════════════════════════ 16. data-rush@1 — Traffic census ═════════════════════════════
export const DATA_THEMES = {
  traffic: { target: "car", kinds: ["car", "bus", "bike", "auto", "truck"], unit: "cars", per: "minute" },
} as const;
const DR_STRINGS = { coach: "Tap every car as it passes", minute: "MINUTE", tally: "tally", census: "CENSUS CHECK", mean: "Drag the line to the mean", level: "levelled out", runDone: "Census done", cars: "cars", scale: "each square =", missed: "missed", extra: "not a car", right: "Got it", per: "per minute" };
const DR_MISC = ["c7-maths-ch13-t02-m-mean-in-data", "c7-maths-ch13-t02-m-outlier", "c4-maths-ch14-t02-m-count-squares", "c5-maths-ch15-t02-m-count-gridlines", "c6-maths-ch04-t03-m-count-units"];
const DataSchema = z.object({
  archetype: z.literal("data-rush@1"), ...Envelope,
  strings: z.object(Object.fromEntries(Object.keys(DR_STRINGS).map((k) => [k, safeStr(40)]))),
  theme: z.literal("traffic"), counts: z.array(z.number().int().min(0).max(14)).min(3).max(6), distractors: z.number().int().min(0).max(14),
  scaleStep: z.union([z.literal(1), z.literal(2)]), speed: z.number().min(0.6).max(1.5), seed: z.number().int().min(1).max(99999), targets: z.string().optional(),
});
export type DataSpec = z.infer<typeof DataSchema>;
export interface Vehicle { minute: number; kind: string; at: number; lane: number; speed: number }
/** Deterministic stream: when (seconds into the minute) each vehicle enters, from the spec's counts and seed. */
export function dataStream(spec: DataSpec, minuteSeconds = 7): Vehicle[] {
  let s = spec.seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const kinds = DATA_THEMES[spec.theme].kinds.filter((k) => k !== DATA_THEMES[spec.theme].target);
  const out: Vehicle[] = [];
  spec.counts.forEach((c, m) => {
    const n = c + spec.distractors;
    const slots = Array.from({ length: n }, (_, i) => (i + 0.2 + rnd() * 0.6) * (minuteSeconds - 1) / n);
    const order = Array.from({ length: n }, (_, i) => i < c);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    slots.forEach((t, i) => out.push({ minute: m, kind: order[i] ? DATA_THEMES[spec.theme].target : kinds[Math.floor(rnd() * kinds.length)], at: t, lane: rnd() < 0.5 ? 0 : 1, speed: (0.9 + rnd() * 0.3) * spec.speed }));
  });
  return out;
}
export const dataMean = (counts: number[]) => counts.reduce((a, b) => a + b, 0) / counts.length;
const dataDefault: DataSpec = {
  archetype: "data-rush@1", skills: ["c7-maths-ch13-t02", "c4-maths-ch14-t02", "c6-maths-ch04-t03"], lang: "en", strings: { ...DR_STRINGS },
  theme: "traffic", counts: [4, 7, 3, 5, 11], distractors: 3, scaleStep: 2, speed: 1, seed: 4117, targets: "c7-maths-ch13-t02-m-outlier",
};
function repairData(raw: Record<string, unknown>, r: string[]): DataSpec | null {
  const env = envelope(raw, dataDefault, r);
  const counts = arr(raw.counts, "counts", r).filter((c): c is number => typeof c === "number" && Number.isInteger(c) && c >= 0 && c <= 14).slice(0, 6);
  if (counts.length < 3 || counts.every((c) => c === 0)) { r.push("counts"); return null; }
  return { archetype: "data-rush@1", ...env, strings: strings(raw.strings, DR_STRINGS, 40, r), theme: "traffic", counts, distractors: num(raw.distractors, 0, 14, 3, "distractors", r, true),
    scaleStep: raw.scaleStep === 1 ? 1 : 2, speed: num(raw.speed, 0.6, 1.5, 1, "speed", r), seed: num(raw.seed, 1, 99999, 4117, "seed", r, true), ...(misconceptionOk(raw.targets, DR_MISC) ? { targets: raw.targets as string } : {}) };
}
function gradeData(spec: DataSpec, itemId: string, value: unknown): Graded {
  let m = itemId.match(/^m(\d+)$/);
  if (m) { const k = +m[1] - 1; if (k < 0 || k >= spec.counts.length) return UNGRADED; const v = Number(isObj(value) ? value.tally : value); const key = spec.counts[k]; return { verdict: v === key ? "right" : Math.abs(v - key) <= 1 ? "partial" : "wrong", truth: key, error: Number.isFinite(v) ? Math.abs(v - key) : undefined }; }
  m = itemId.match(/^mean$/);
  if (m) {
    const key = dataMean(spec.counts), v = Number(isObj(value) ? value.mean : value);
    const g = within(v, key, 0.35, 0.8);
    const dataVal = g.verdict !== "right" && spec.counts.some((c) => Math.abs(c - v) < 0.2) && !spec.counts.some((c) => Math.abs(c - key) < 0.2) ? "c7-maths-ch13-t02-m-mean-in-data" : undefined;
    return { ...g, truth: +key.toFixed(2), ...(dataVal ? { detail: dataVal } : {}) };
  }
  return UNGRADED;
}

// ═════════════════════════════ registry ═════════════════════════════
const def = <S>(d: EngineSpecDef<S>) => d as unknown as EngineSpecDef<unknown>;
export const ENGINE_SPECS: Record<string, EngineSpecDef<unknown>> = {
  "catch-on-line@1": def<LandfallSpec>({ archetype: "catch-on-line@1", title: "Landfall", kind: "game", subject: "maths", schema: LandfallSchema, defaultSpec: landfallDefault, repair: repairLandfall, grade: gradeLandfall,
    outcomes: { classes: [5, 6, 7], topics: ["c5-maths-ch02-t01", "c6-maths-ch07-t02", "c6-maths-ch07-t03", "c6-maths-ch07-t04", "c7-maths-ch03-t03"], misconceptions: LF_MISC } }),
  "circuit-bench@1": def<CircuitSpec>({ archetype: "circuit-bench@1", title: "Circuit Lab", kind: "simulation", subject: "science", schema: CircuitSchema, defaultSpec: circuitDefault, repair: repairCircuit, grade: gradeCircuit,
    outcomes: { classes: [7], topics: ["c7-science-ch03-t01", "c7-science-ch03-t02", "c7-science-ch03-t03"], misconceptions: CL_MISC } }),
  "orbital-explainer@1": def<MoonSpec>({ archetype: "orbital-explainer@1", title: "Why the Moon has phases", kind: "explainer", subject: "science", schema: MoonSchema, defaultSpec: moonDefault, repair: repairMoon, grade: gradeMoon,
    outcomes: { classes: [4, 7], topics: ["c4-evs-ch10-t02", "c7-science-ch12-t03", "c7-science-ch12-t01"], misconceptions: ["c4-evs-ch10-t02-m1", "c4-evs-ch10-t02-m2", "c4-evs-ch10-t02-m3", "c7-science-ch12-t03-m2"] } }),
  "slice-at@1": def<SliceSpec>({ archetype: "slice-at@1", title: "Fraction Slice", kind: "game", subject: "maths", schema: SliceSchema, defaultSpec: sliceDefault, repair: repairSlice, grade: gradeSlice,
    outcomes: { classes: [4, 5, 6], topics: ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c6-maths-ch07-t01"], misconceptions: SL_MISC } }),
  "line-runner@1": def<RunnerSpec>({ archetype: "line-runner@1", title: "Gate Runner", kind: "game", subject: "maths", schema: RunnerSchema, defaultSpec: runnerDefault, repair: repairRunner, grade: gradeRunner,
    outcomes: { classes: [6, 7], topics: ["c6-maths-ch10-t02", "c7-maths-ch03-t03", "c4-maths-ch04-t02"], misconceptions: LR_MISC } }),
  "area-claim@1": def<AreaSpec>({ archetype: "area-claim@1", title: "Plot", kind: "game", subject: "maths", schema: AreaSchema, defaultSpec: areaDefault, repair: repairArea, grade: gradeArea,
    outcomes: { classes: [5, 6], topics: ["c5-maths-ch11-t01", "c5-maths-ch11-t02", "c5-maths-ch11-t03", "c6-maths-ch06-t01", "c6-maths-ch06-t02"], misconceptions: AC_MISC } }),
  "vault-heist@1": def<VaultSpec>({ archetype: "vault-heist@1", title: "Vault Heist", kind: "game", subject: "maths", schema: VaultSchema, defaultSpec: vaultDefault, repair: repairVault, grade: gradeVault,
    outcomes: { classes: [4, 5, 7], topics: ["c4-maths-ch04-t01", "c5-maths-ch01-t01", "c7-maths-ch01-t01"], misconceptions: VH_MISC } }),
  "angle-cannon@1": def<AngleSpec>({ archetype: "angle-cannon@1", title: "Turret", kind: "game", subject: "maths", schema: AngleSchema, defaultSpec: angleDefault, repair: repairAngle, grade: gradeAngle,
    outcomes: { classes: [5, 6], topics: ["c5-maths-ch03-t01", "c5-maths-ch03-t02", "c6-maths-ch02-t02", "c6-maths-ch02-t03", "c6-maths-ch02-t04"], misconceptions: AN_MISC } }),
  "food-web@1": def<FoodSpec>({ archetype: "food-web@1", title: "Balance the Forest", kind: "simulation", subject: "science", schema: FoodSchema, defaultSpec: foodDefault, repair: repairFood, grade: gradeFood,
    outcomes: { classes: [4, 6], topics: ["c4-evs-ch03-t02", "c6-science-ch02-t03"], misconceptions: FW_MISC } }),
  "phase-shift@1": def<PhaseSpec>({ archetype: "phase-shift@1", title: "Phase Shift", kind: "simulation", subject: "science", schema: PhaseSchema, defaultSpec: phaseDefault, repair: repairPhase, grade: gradePhase,
    outcomes: { classes: [5, 6], topics: ["c6-science-ch08-t01", "c6-science-ch08-t02", "c6-science-ch08-t03", "c5-evs-ch01-t01"], misconceptions: PS_MISC } }),
  "balance-beam@1": def<BeamSpec>({ archetype: "balance-beam@1", title: "Tilt", kind: "game", subject: "maths", schema: BeamSchema, defaultSpec: beamDefault, repair: repairBeam, grade: gradeBeam,
    outcomes: { classes: [4, 7], topics: ["c7-maths-ch15-t01", "c7-maths-ch15-t02", "c4-maths-ch08-t01"], misconceptions: BB_MISC } }),
  "shadow-play@1": def<ShadowSpec>({ archetype: "shadow-play@1", title: "Shadow Play", kind: "simulation", subject: "science", schema: ShadowSchema, defaultSpec: shadowDefault, repair: repairShadow, grade: gradeShadow,
    outcomes: { classes: [4, 7], topics: ["c7-science-ch11-t01", "c7-science-ch11-t02", "c4-evs-ch10-t01"], misconceptions: SP_MISC } }),
  "water-cycle@1": def<WaterCycleSpec>({ archetype: "water-cycle@1", title: "Where rain comes from", kind: "explainer", subject: "science", schema: WaterCycleSchema, defaultSpec: wcDefault, repair: repairWaterCycle, grade: gradeWaterCycle,
    outcomes: { classes: [5, 6, 7], topics: ["c7-science-ch07-t04", "c6-science-ch08-t01", "c6-science-ch08-t02", "c5-evs-ch01-t01"], misconceptions: ["c7-science-ch07-t04-m1", "c7-science-ch07-t04-m3", "c6-science-ch08-t01-m2", "c5-evs-ch01-t01-m3"] } }),
  "scale-cinematic@1": def<ScaleSpec>({ archetype: "scale-cinematic@1", title: "The solar system to scale", kind: "explainer", subject: "science", schema: ScaleSchema, defaultSpec: ssDefault, repair: repairScale, grade: gradeScale,
    outcomes: { classes: [6, 7], topics: ["c6-science-ch12-t02", "c7-science-ch12-t02"], misconceptions: ["c6-science-ch12-t02-m3"] } }),
  "angle-sum@1": def<AngleSumSpec>({ archetype: "angle-sum@1", title: "Why a triangle makes 180°", kind: "explainer", subject: "maths", schema: AngleSumSchema, defaultSpec: asDefault, repair: repairAngleSum, grade: gradeAngleSum,
    outcomes: { classes: [7], topics: ["c7-maths-ch07-t03"], misconceptions: ["c7-maths-ch07-t03-m-bigger-more", "c7-maths-ch07-t03-m-two-obtuse"] } }),
  "data-rush@1": def<DataSpec>({ archetype: "data-rush@1", title: "Traffic Census", kind: "game", subject: "maths", schema: DataSchema, defaultSpec: dataDefault, repair: repairData, grade: gradeData,
    outcomes: { classes: [4, 5, 6, 7], topics: ["c7-maths-ch13-t02", "c4-maths-ch14-t02", "c5-maths-ch15-t02", "c6-maths-ch04-t03"], misconceptions: DR_MISC } }),
};
export const ARCHETYPES_V2 = Object.keys(ENGINE_SPECS);

/** Never throws. Returns a spec that passes the archetype's strict schema: the repaired spec, or the reviewed default. */
export function validateSpec<S = unknown>(archetype: string, raw: unknown): Repaired<S> & { archetype: string } {
  const d = ENGINE_SPECS[archetype];
  if (!d) throw new Error("unknown archetype " + archetype);   // a programming error on the host side, never a child-visible one
  const repairs: string[] = [];
  let v: unknown = raw;
  if (typeof v === "string") { try { v = JSON.parse(v); } catch { repairs.push("spec_unparseable:json"); v = null; } }
  if (!isObj(v)) { if (v !== undefined) repairs.push("spec_unparseable:not-an-object"); return { archetype, spec: structuredClone(d.defaultSpec) as S, repairs: [...repairs, "fallback-default"], fellBack: true }; }
  if (v.archetype !== undefined && v.archetype !== archetype) repairs.push("archetype-mismatch");
  let out: unknown = null;
  try { out = d.repair(v, repairs); } catch (e) { repairs.push("repair-threw:" + String((e as Error)?.message ?? e).slice(0, 60)); out = null; }
  if (out) {
    const p = d.schema.safeParse(out);
    if (p.success) return { archetype, spec: p.data as S, repairs, fellBack: false };
    repairs.push("schema:" + p.error.issues.slice(0, 3).map((i) => i.path.join(".")).join("|"));
  }
  return { archetype, spec: structuredClone(d.defaultSpec) as S, repairs: [...repairs, "fallback-default"], fellBack: true };
}
/** The host's grade of a raw act. The frame's own verdict is never an input. */
export function gradeAnswer(archetype: string, spec: unknown, itemId: string, value: unknown): Graded {
  const d = ENGINE_SPECS[archetype];
  if (!d || typeof itemId !== "string" || itemId.length > 64) return UNGRADED;
  try { return d.grade(spec, itemId, value); } catch { return UNGRADED; }
}
export function specJsonSchema(archetype: string): unknown { const d = ENGINE_SPECS[archetype]; return d ? z.toJSONSchema(d.schema as z.ZodType, { unrepresentable: "any" }) : null; }
