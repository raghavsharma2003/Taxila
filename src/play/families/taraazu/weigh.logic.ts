// Taraazu · weigh and fill (round 7): measurement in kg / g and l / ml where the conversion IS the act. PURE law + generator +
// solver + grader. Exact integer arithmetic in grams / ml only (never a decimal kg).
//   weigh/balance  a pan balance: a parcel labelled "1 kg 250 g" (or "750 g", "3 kg", "1250 g") sits on the left pan; the
//                  child loads standard weights from the box onto the right pan (and takes them off). The beam stays LOCKED
//                  while loading; "Tolo" unlocks it and it swings to the heavier side, or stays level (solved).
//   fill/fill      a vessel labelled "1 l 250 ml"; measuring jugs (refilled from the tap, so any number of pours) poured in
//                  one at a time; "Dekho" checks the water against the label.
// Some boxes carry no 1 kg weight / no 1 l jug ("out on another counter"): then the big unit must be built from small
// weights, which is where kg = 1000 g has to be known. A level whose label equals ONE weight / jug (or nothing) is a
// shortcut and is never served.
//
// Mal-rules (each with a deterministic malActs that loads the believed amount and weighs / checks):
//   kg-is-100g     weigh: 1 kg 250 g loaded as 350 g (only when no 1 kg weight is in the box)
//   l-is-100ml     fill:  1 l 250 ml poured as 350 ml (only when no 1 l jug is on the counter)
//   mixed-concat   the numbers joined: 2 kg 50 g → 250 g, 2 l 50 ml → 250 ml (only a two-digit small part; no big weight)
//   fifty-as-half  weigh: 2 kg 50 g read as 2.50 kg = 2500 g (3 kg 20 g → 3200 g; a two-digit small part)
// Each is offered only where its amount is loadable, differs from the label by ≥ 100 and from every other mapped belief.
// Fractions of a measure (r7 maap, c4-maths-ch05-t02): the label is "¾ kg", "½ l" or a sum "½ kg + ¼ kg" (form "frac",
// big 0, small = the truth in g / ml; parts = the fractions). The box holds no weight / jug equal to the label (no 250 g at
// all), so the fraction of the big unit has to be made in the small one. Their mal-rules (the c4 kit's own beliefs):
//   half-is-50       every ½ in the label taken as 50 (½ kg → 50 g; ½ kg + ¼ kg → 300 g; ½ l → 50 ml)
//   quarter-is-4     every ¼ taken as 400 ("paav kilo is 400 g"; ¼ l → 400 ml; ½ kg + ¼ kg → 900 g)
//   pieces-not-size  ¾ taken as 3 pieces of 100 whatever the whole (¾ kg → 300 g; ¾ l → 300 ml); single ¾ labels only
// (number-only, "900 g is heavier than 1 kg", needs a compare goal; that goal is not built: see the round 7 report.)
import type { Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, WeighAct } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type WeighMode = "weigh" | "fill";
export interface WeighParams {
  goal: "balance" | "fill";
  /** the label: whole big units (kg / l) and small units (g / ml); the truth is big × 1000 + small */
  big: number; small: number;
  /** "mixed" writes "1 kg 250 g"; "small" writes the whole amount in the small unit ("1250 g"); "frac" writes `parts` */
  form: "mixed" | "small" | "frac";
  /** form "frac" only: the fractions of ONE big unit the label adds up ([[3, 4]] is "¾ kg"; [[1, 2], [1, 4]] "½ kg + ¼ kg") */
  parts?: [number, number][];
  /** weigh: the weights in the box (size in g → copies); fill: the jugs (size in ml, n = 0: refilled, unlimited) */
  box: { size: number; n: number }[];
  /** fill: what the vessel holds at the brim (ml); weigh: 0 */
  cap: number;
  /** the context skin id (words only; never changes the maths) */
  ctx: string;
}
export interface WeighState extends Undoable<WeighState> {
  /** the weights on the right pan / the jugs poured, in order (g / ml each) */
  pan: number[];
  /** the beam is locked (loading) / the water not yet checked */
  locked: boolean;
  weighs: number;
  done: boolean;
  acts: number;
}
export const WEIGH_MAL = ["kg-is-100g", "mixed-concat", "fifty-as-half", "l-is-100ml", "half-is-50", "quarter-is-4", "pieces-not-size"] as const;
const MAL_OF: Record<WeighMode, readonly string[]> = {
  weigh: ["kg-is-100g", "mixed-concat", "fifty-as-half", "half-is-50", "quarter-is-4", "pieces-not-size"],
  fill: ["l-is-100ml", "mixed-concat", "half-is-50", "quarter-is-4", "pieces-not-size"],
};
export const DENOMS: Record<WeighMode, readonly number[]> = { weigh: [1000, 500, 200, 100, 50, 20, 10], fill: [1000, 500, 200, 100, 50] };
export const UNITS: Record<WeighMode, { big: string; small: string }> = { weigh: { big: "kg", small: "g" }, fill: { big: "l", small: "ml" } };
export const CONTEXTS: Record<WeighMode, readonly string[]> = { weigh: ["kirana", "courier", "mandi"], fill: ["tanker", "dhaba", "chai"] };
/** the standard boxes: with the 1 kg weights, and without them (the 500 g weights stand in) */
export const BOX_KG = Object.freeze([{ size: 1000, n: 3 }, { size: 500, n: 1 }, { size: 200, n: 2 }, { size: 100, n: 1 }, { size: 50, n: 1 }, { size: 20, n: 2 }, { size: 10, n: 1 }]);
export const BOX_G = Object.freeze([{ size: 500, n: 8 }, { size: 200, n: 2 }, { size: 100, n: 1 }, { size: 50, n: 1 }, { size: 20, n: 2 }, { size: 10, n: 1 }]);
export const JUGS_L = Object.freeze([1000, 500, 200, 100, 50].map((size) => ({ size, n: 0 })));
export const JUGS_ML = Object.freeze([500, 200, 100, 50].map((size) => ({ size, n: 0 })));
/** the fraction boxes: never a weight / jug equal to a label; with and without the 500 (never on a ½ label) */
export const BOX_FR = Object.freeze([{ size: 200, n: 5 }, { size: 100, n: 3 }, { size: 50, n: 2 }, { size: 20, n: 2 }, { size: 10, n: 1 }]);
export const BOX_FR5 = Object.freeze([{ size: 500, n: 1 }, { size: 200, n: 3 }, { size: 100, n: 3 }, { size: 50, n: 2 }, { size: 20, n: 2 }, { size: 10, n: 1 }]);
export const JUGS_FR = Object.freeze([200, 100, 50].map((size) => ({ size, n: 0 })));
/** the fractions a label may carry, as written */
export const FRACS: Record<string, string> = { "1/2": "½", "1/4": "¼", "3/4": "¾" };
/** the most weights a pan holds / pours a level takes */
export const MAX_ON = 16;
const MAX_TOTAL = 3990;

export const modeOf = (p: { goal: string }): WeighMode => (p.goal === "fill" ? "fill" : "weigh");
export const truthOf = (p: WeighParams) => p.big * 1000 + p.small;
export const sumOf = (pan: number[]) => pan.reduce((a, b) => a + b, 0);
export const hasBig = (p: WeighParams) => p.box.some((b) => b.size === 1000);
/** a weight / jug as written on it: "1 kg", "500 g", "1 l", "200 ml" */
export function sizeLabel(size: number, mode: WeighMode): string {
  const u = UNITS[mode];
  return size === 1000 ? `1 ${u.big}` : `${size} ${u.small}`;
}
/** the label on the parcel / vessel, as the child reads it */
export function labelOf(p: WeighParams): string {
  const u = UNITS[modeOf(p)];
  if (p.form === "small") return `${truthOf(p)} ${u.small}`;
  if (p.form === "frac") return (p.parts ?? []).map(([n, d]) => `${FRACS[`${n}/${d}`]} ${u.big}`).join(" + ");
  if (p.big && p.small) return `${p.big} ${u.big} ${p.small} ${u.small}`;
  return p.big ? `${p.big} ${u.big}` : `${p.small} ${u.small}`;
}
/** values the teacher may not say before the child finds them (the label in the small unit) */
export function weighHidden(level: PlayLevel<unknown>): number[] {
  const p = level.params as Partial<WeighParams> | null;
  return p && Number.isInteger(p.big) && Number.isInteger(p.small) ? [(p.big as number) * 1000 + (p.small as number)] : [];
}

/**
 * The fewest weights / pours that make `amount` exactly (sizes, largest first), or null. Weigh: each size at most its copies
 * (0/1 knapsack over the copies); fill: every jug any number of times.
 */
export function decompose(amount: number, box: readonly { size: number; n: number }[], unlimited: boolean): number[] | null {
  if (!Number.isInteger(amount) || amount <= 0) return null;
  const key = `${amount}|${unlimited ? "u" : ""}|${box.map((b) => `${b.size}x${b.n}`).join(",")}`;
  const hit = MEMO.get(key);
  if (hit !== undefined) return hit && [...hit];
  const r = decomposeRaw(amount, box, unlimited);
  if (MEMO.size > 4000) MEMO.clear();
  MEMO.set(key, r);
  return r && [...r];
}
/** a pure function's cache (same inputs, same output): never state the law reads */
const MEMO = new Map<string, number[] | null>();
function decomposeRaw(amount: number, box: readonly { size: number; n: number }[], unlimited: boolean): number[] | null {
  const g = box.reduce((a, b) => gcd(a, b.size), 0);
  if (!g || amount % g) return null;
  const N = amount / g;
  const best: (number[] | null)[] = new Array(N + 1).fill(null);
  best[0] = [];
  const sizes = [...box].sort((a, b) => b.size - a.size);
  if (unlimited) {
    for (let a = 1; a <= N; a++) for (const b of sizes) {
      const k = b.size / g;
      if (k <= a && best[a - k] && (!best[a] || best[a - k]!.length + 1 < best[a]!.length)) best[a] = [...best[a - k]!, b.size];
    }
  } else {
    for (const b of sizes) for (let c = 0; c < b.n; c++) {
      const k = b.size / g;
      for (let a = N; a >= k; a--) if (best[a - k] && (!best[a] || best[a - k]!.length + 1 < best[a]!.length)) best[a] = [...best[a - k]!, b.size];
    }
  }
  const out = best[N];
  return out && out.length <= MAX_ON ? [...out].sort((x, y) => y - x) : null;
}
function gcd(a: number, b: number): number { while (b) [a, b] = [b, a % b]; return a; }

/** the amount a child holding `mal` loads / pours (before checking it differs, fits and is unique), or null */
function rawMal(p: WeighParams, mal: string): number | null {
  const mode = modeOf(p);
  if (!MAL_OF[mode].includes(mal)) return null;
  if (p.form === "frac") return fracMal(p.parts ?? [], mal);
  if (p.form !== "mixed" || p.big === 0) return null;
  switch (mal) {
    case "kg-is-100g": case "l-is-100ml":
      return hasBig(p) ? null : 100 * p.big + p.small;
    case "mixed-concat":
      return hasBig(p) || p.small < 1 || p.small > 99 ? null : Number(`${p.big}${p.small}`);
    case "fifty-as-half":
      return p.small < 10 || p.small > 99 ? null : p.big * 1000 + p.small * 10;
  }
  return null;
}
/** a fraction label as a child holding `mal` makes it: every ½ as 50, every ¼ as 400, a lone ¾ as 3 × 100; else null */
function fracMal(parts: readonly [number, number][], mal: string): number | null {
  const as = (f: (n: number, d: number) => number | null) => {
    let hit = false, sum = 0;
    for (const [n, d] of parts) { const v = f(n, d); if (v === null) sum += (1000 * n) / d; else { hit = true; sum += v; } }
    return hit ? sum : null;
  };
  switch (mal) {
    case "half-is-50": return as((n, d) => (n === 1 && d === 2 ? 50 : null));
    case "quarter-is-4": return as((n, d) => (n === 1 && d === 4 ? 400 : null));
    case "pieces-not-size": return parts.length === 1 && parts[0][0] === 3 && parts[0][1] === 4 ? 300 : null;
  }
  return null;
}
const loadable = (p: WeighParams, v: number) => (modeOf(p) === "fill" ? v <= p.cap : true) && decompose(v, p.box, modeOf(p) === "fill") !== null;
/**
 * What a child holding mal-rule `mal` loads / pours on this level, or null when the belief says nothing different here
 * (< 100 away from the label), cannot be loaded from this box, or names the same amount as another belief in `others`
 * (a signature must name ONE belief).
 */
export function malAmount(p: WeighParams, mal: string, others: readonly string[] = []): number | null {
  const v = rawMal(p, mal);
  if (v === null || v <= 0 || Math.abs(v - truthOf(p)) < 100 || !loadable(p, v)) return null;
  for (const o of others) if (o !== mal && rawMal(p, o) === v) return null;
  return v;
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);

function validate(level: PlayLevel<unknown>): PlayLevel<WeighParams> | null {
  const p = level.params as Partial<WeighParams> | null;
  const mode = level.mode as string;
  if (!p || (mode !== "weigh" && mode !== "fill")) return null;
  if (mode === "weigh" ? p.goal !== "balance" : p.goal !== "fill") return null;
  const big = p.big, small = p.small;
  const frac = p.form === "frac";
  if (!isInt(big) || !isInt(small) || big < 0 || big > 3 || small < 0 || small > (frac ? 1000 : 999)) return null;
  const step = mode === "weigh" ? 10 : 50;
  if (small % step) return null;
  const total = big * 1000 + small;
  if (total <= 0 || total > MAX_TOTAL) return null;
  const form = p.form === "small" ? "small" : p.form === "mixed" ? "mixed" : frac ? "frac" : null;
  if (!form) return null;
  let parts: [number, number][] | null = null;
  if (frac) {
    // the label is the fractions; big 0 and small their sum in g / ml (checked, never trusted)
    if (!Array.isArray(p.parts) || p.parts.length < 1 || p.parts.length > 2 || big !== 0) return null;
    parts = [];
    for (const q of p.parts) {
      if (!Array.isArray(q) || q.length !== 2 || !isInt(q[0]) || !isInt(q[1]) || !FRACS[`${q[0]}/${q[1]}`]) return null;
      parts.push([q[0], q[1]]);
    }
    if (parts.reduce((a, [n, d]) => a + (1000 * n) / d, 0) !== small) return null;
  } else if (p.parts !== undefined) return null;
  if (!Array.isArray(p.box) || p.box.length < 2 || p.box.length > 7) return null;
  const sizes = new Set<number>();
  const box: { size: number; n: number }[] = [];
  for (const b of p.box) {
    const size = (b as { size?: unknown })?.size, n = (b as { n?: unknown })?.n;
    if (!isInt(size) || !DENOMS[mode].includes(size) || sizes.has(size) || !isInt(n)) return null;
    if (mode === "weigh" ? n < 1 || n > 8 : n !== 0) return null;
    sizes.add(size); box.push({ size, n });
  }
  box.sort((a, b) => b.size - a.size);
  const cap = p.cap;
  if (!isInt(cap) || (mode === "fill" ? cap <= total || cap > 5000 || cap % 500 : cap !== 0)) return null;
  if (typeof p.ctx !== "string" || !CONTEXTS[mode].includes(p.ctx)) return null;
  const params: WeighParams = { goal: p.goal as WeighParams["goal"], big, small, form, box, cap, ctx: p.ctx, ...(parts ? { parts } : {}) };
  if (!decompose(total, box, mode === "fill")) return null;     // solvable from this box
  return { ...level, params } as PlayLevel<WeighParams>;
}
function init(_level: PlayLevel<WeighParams>): WeighState {
  return { pan: [], locked: true, weighs: 0, done: false, acts: 0, prev: null, depth: 0 };
}

function apply(level: PlayLevel<WeighParams>, s: WeighState, act: WeighAct, seq: number): { state: WeighState; moments: Moment[]; refused?: string } {
  const p = level.params, mode = modeOf(p), out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") {
    if (!s.prev) return { state: { ...s, acts: s.acts + 1 }, moments: [] };
    return { state: { ...popUndo(s), weighs: s.weighs, locked: true, acts: s.acts + 1 }, moments: [] };
  }
  const bump = (st: WeighState): WeighState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  switch (act.kind) {
    case "load": case "unload": {
      if (mode !== "weigh") return { state: bump(s), moments: out, refused: "no_weights_here" };
      const w = Number(act.weight), slot = p.box.find((b) => b.size === w);
      if (!slot) return { state: bump(s), moments: out, refused: "bad_weight" };
      const on = s.pan.filter((x) => x === w).length;
      if (act.kind === "load") {
        if (on >= slot.n) return { state: bump(s), moments: out, refused: "none_left" };
        if (s.pan.length >= MAX_ON) return { state: bump(s), moments: out, refused: "pan_full" };
        return { state: bump(pushUndo(s, { ...s, pan: [...s.pan, w], locked: true })), moments: out };
      }
      if (!on) return { state: bump(s), moments: out, refused: "not_on_pan" };
      const i = s.pan.lastIndexOf(w), pan = [...s.pan.slice(0, i), ...s.pan.slice(i + 1)];
      return { state: bump(pushUndo(s, { ...s, pan, locked: true })), moments: out };
    }
    case "pour": {
      if (mode !== "fill") return { state: bump(s), moments: out, refused: "no_jugs_here" };
      const j = Number(act.jug);
      if (!p.box.some((b) => b.size === j)) return { state: bump(s), moments: out, refused: "bad_jug" };
      if (s.pan.length >= MAX_ON * 2) return { state: bump(s), moments: out, refused: "pan_full" };
      if (sumOf(s.pan) + j > p.cap) { out.push(mom("law_refused", seq, { why: "overflow" })); return { state: bump(s), moments: out, refused: "overflow" }; }
      return { state: bump(pushUndo(s, { ...s, pan: [...s.pan, j], locked: true })), moments: out };
    }
    case "weigh": {
      if (!s.pan.length) return { state: bump(s), moments: out, refused: "load_first" };
      const next = bump({ ...s, locked: false, weighs: s.weighs + 1 });
      const d = sumOf(s.pan) - truthOf(p);
      const base: Facts = { goal: p.goal, n: s.pan.length };
      if (d === 0) { out.push(mom("solved", seq, base)); return { state: { ...next, done: true }, moments: out }; }
      const u = UNITS[mode].small;
      const f: Facts = { ...base, ...(mode === "weigh" ? { heavier: d < 0 ? "parcel" : "weights" } : { water: d < 0 ? "below" : "above" }), ...(level.fade === 1 ? { gap: `${Math.abs(d)} ${u}` } : {}) };
      const keys = Object.keys(level.mal);
      for (const mal of keys) {
        const v = malAmount(p, mal, keys);
        if (v !== null && v === sumOf(s.pan)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: next, moments: out, refused: "missed" }; }
      }
      const near = Math.abs(d) <= (mode === "weigh" ? 20 : 50);
      out.push(mom(near ? "near_miss" : "law_refused", seq, { ...f, why: "not_level" }));
      return { state: next, moments: out, refused: "missed" };
    }
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<WeighParams>, s: WeighState) => s.done;

/** the acts that load / pour `amount` from empty and then weigh / check, or null when it cannot be made */
function actsFor(p: WeighParams, amount: number): WeighAct[] | null {
  const fill = modeOf(p) === "fill", parts = decompose(amount, p.box, fill);
  if (!parts) return null;
  return [...parts.map((x): WeighAct => (fill ? { kind: "pour", jug: x } : { kind: "load", weight: x })), { kind: "weigh" }];
}
const solve = (level: PlayLevel<WeighParams>): WeighAct[] | null => actsFor(level.params, truthOf(level.params));
/**
 * Without the conversion a child can still match what is on screen: a label equal to ONE weight / jug ("1 kg" with a 1 kg
 * weight, "500 g" with a 500 g weight) is a lookup, not a measurement. Such a level is never served.
 */
function shortcut(level: PlayLevel<WeighParams>): WeighAct[] | null {
  const p = level.params, t = truthOf(p);
  if (t <= 0) return [{ kind: "weigh" }];
  if (p.box.some((b) => b.size === t)) return actsFor(p, t);
  return null;
}
function malActs(level: PlayLevel<WeighParams>, mal: string): WeighAct[] | null {
  const p = level.params, v = malAmount(p, mal, Object.keys(level.mal));
  if (v === null) return null;
  // the pieces belief is acted as the kit sees it: three small 100 g / 100 ml pieces, one by one (when the box has them)
  if (mal === "pieces-not-size" && p.box.some((b) => b.size === 100 && (b.n === 0 || b.n >= 3))) {
    const fill = modeOf(p) === "fill";
    return [...[0, 1, 2].map((): WeighAct => (fill ? { kind: "pour", jug: 100 } : { kind: "load", weight: 100 })), { kind: "weigh" }];
  }
  return actsFor(p, v);
}

interface WeighGrammar { smalls?: "simple" | "mixed"; maxBig?: number; frac?: "one" | "sum" }
const SIMPLE = [0, 100, 200, 250, 300, 400, 500, 600, 700, 750, 800, 900];
function difficultyOf(p: WeighParams): number {
  const parts = decompose(truthOf(p), p.box, modeOf(p) === "fill")?.length ?? 6;
  if (p.form === "frac") return Math.min(1, 0.2 + 0.05 * parts + 0.1 * ((p.parts?.length ?? 1) - 1) + (p.parts?.some(([n]) => n === 3) ? 0.08 : 0));
  return Math.min(1, 0.12 + 0.05 * parts + (hasBig(p) ? 0 : 0.15) + (p.form === "small" ? 0.12 : 0) + (p.small > 0 && p.small < 100 ? 0.12 : 0) + 0.04 * p.big);
}
/** the fraction labels: one fraction of a kg / l, or (grammar "sum") also two added */
const ONE: [number, number][][] = [[[1, 2]], [[1, 4]], [[3, 4]]];
const SUMS: [number, number][][] = [[[1, 2], [1, 4]], [[1, 4], [1, 2]], [[1, 4], [1, 4]], [[1, 2], [1, 2]], [[3, 4], [1, 4]], [[1, 4], [3, 4]]];
function generateFrac(req: GenRequest, g: WeighGrammar, mode: WeighMode, goal: WeighParams["goal"], mk: (p: WeighParams, sig: string) => Candidate<WeighParams>): Candidate<WeighParams>[] {
  const rnd = mulberry32(req.seed), out: Candidate<WeighParams>[] = [], seen = new Set<string>();
  const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
  const labels = g.frac === "sum" ? [...ONE, ...SUMS] : ONE;
  for (let k = 0; k < 60 && out.length < 24; k++) {
    const parts = pick(labels).map(([n, d]) => [n, d] as [number, number]);
    const small = parts.reduce((a, [n, d]) => a + (1000 * n) / d, 0);
    const five = rnd() < 0.5;
    const box = mode === "fill" ? (five ? JUGS_ML : JUGS_FR) : (five ? BOX_FR5 : BOX_FR);
    const params: WeighParams = { goal, big: 0, small, form: "frac", parts, box: box.map((b) => ({ ...b })), cap: mode === "fill" ? 2000 : 0, ctx: pick(CONTEXTS[mode]) };
    if (box.some((b) => b.size === small) || !decompose(small, params.box, mode === "fill")) continue;
    // one candidate per label (its box drawn at random), so "recent" steers the child to a new fraction, not a new box
    const sig = `${mode}:${parts.map(([n, d]) => `${n}/${d}`).join("+")}${UNITS[mode].big}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(mk(params, sig));
  }
  return out;
}
function generate(req: GenRequest): Candidate<WeighParams>[] {
  const g = req.grammar as WeighGrammar;
  const mode: WeighMode = req.mode === "fill" ? "fill" : "weigh";
  const goal: WeighParams["goal"] = mode === "fill" ? "fill" : "balance";
  const mixed = g.smalls === "mixed", maxBig = Math.max(1, Math.min(3, g.maxBig ?? 3));
  const rnd = mulberry32(req.seed), out: Candidate<WeighParams>[] = [], seen = new Set<string>();
  const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
  const mk = (params: WeighParams, sig: string): Candidate<WeighParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `weigh-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "taraazu", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: params.ctx, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  if (g.frac) return generateFrac(req, g, mode, goal, mk);
  for (let k = 0; k < 80 && out.length < 24; k++) {
    const withBig = rnd() < 0.45;
    let big = Math.floor(rnd() * (maxBig + 1));
    if (big === 0 && rnd() < 0.6) big = 1 + Math.floor(rnd() * maxBig);   // most labels carry a big unit
    let small: number;
    if (mode === "fill") small = mixed && rnd() < 0.5 ? 50 : mixed ? 50 + 100 * Math.floor(rnd() * 10) : pick(SIMPLE);
    else small = mixed && rnd() < 0.55 ? 10 * (1 + Math.floor(rnd() * 9)) : mixed ? 10 * Math.floor(rnd() * 100) : pick(SIMPLE);
    const total = big * 1000 + small;
    if (total <= 0 || total > MAX_TOTAL) continue;
    const form: WeighParams["form"] = withBig && big > 0 && small > 0 && rnd() < 0.25 ? "small" : "mixed";
    const box = mode === "fill" ? (withBig ? JUGS_L : JUGS_ML) : (withBig ? BOX_KG : BOX_G);
    const cap = mode === "fill" ? (Math.floor(total / 1000) + 2) * 1000 : 0;
    const params: WeighParams = { goal, big, small, form, box: box.map((b) => ({ ...b })), cap, ctx: pick(CONTEXTS[mode]) };
    if (box.some((b) => b.size === total) || !decompose(total, params.box, mode === "fill")) continue;
    const sig = `${mode}:${labelOf(params)}:${withBig ? "B" : "s"}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(mk(params, sig));
  }
  return out;
}
function facts(level: PlayLevel<WeighParams>, s: WeighState): Facts {
  const p = level.params;
  const f: Facts = { goal: p.goal, label: labelOf(p), n: s.pan.length };
  if (s.weighs) f.weighs = s.weighs;
  if (s.done) { f.done = "yes"; f.total = sumOf(s.pan); }
  return f;
}
function board(level: PlayLevel<WeighParams>, s: WeighState) {
  const p = level.params, mode = modeOf(p);
  const on = s.pan.length ? s.pan.map((x) => sizeLabel(x, mode)).join(" + ") : "—";
  return mode === "fill" ? { title: "Naap", lines: [`${labelOf(p)}`, `jug: ${on}`] } : { title: "Taraazu", lines: [`parcel: ${labelOf(p)}`, `baat: ${on}`] };
}
function grade(level: PlayLevel<WeighParams>, acts: PlayActEnvelope<WeighAct>[]): PlayGrade {
  return gradeLevel(weighLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const weighLogic: FamilyLogic<WeighParams, WeighState, WeighAct> = {
  family: "taraazu", modes: ["weigh", "fill"], malRules: WEIGH_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
