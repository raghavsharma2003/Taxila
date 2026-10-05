// life-lab@1 — Life Lab (VALUES-100 V3.1: life processes as working systems; c7-sci ch09-t01/t03, ch10-t01..t03,
// c6-sci ch03-t01, c4-evs ch05).
//   leaf   — run a leaf: open and close the stomata to make sugar from light and CO2 while the roots refill water; open
//            too wide in the heat and the leaf wilts. `transport` shows xylem lifting water and phloem carrying sugar.
//   breath — pull the diaphragm down to breathe (the lungs fill because the chest grows) and keep the blood's oxygen
//            up while the body rests, walks or runs
//   gut    — drop digestive juices on the meal as it travels the gut; only the right juice in the right organ
//            digests, and only what is digested by the end of the small intestine is absorbed
// Truth is a deterministic model computed here from the child's raw act (stomata samples, breath events, drops).
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

const LL_STRINGS = { round: "Round", done: "right", sugar: "sugar", water: "water", light: "light", co2: "CO2", stomata: "stomata", open: "open", closed: "closed", wilted: "WILTED", oxygen: "oxygen", pull: "Pull the diaphragm down", perMin: "per min", rest: "resting", walk: "walking", run: "running", mouth: "mouth", stomach: "stomach", small: "small intestine", large: "large intestine", saliva: "saliva", gastric: "gastric", bile: "bile", pancreatic: "pancreatic", absorbed: "absorbed", starch: "starch", protein: "protein", fat: "fat", runDone: "Lab closed", xylem: "xylem", phloem: "phloem", drops: "drops left" };
const LlRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("leaf"), title: z.string().min(1).max(22), sub: z.string().max(40), light: z.number().min(20).max(100), co2: z.number().min(20).max(100), heat: z.number().min(0.2).max(1.5), roots: z.number().min(0).max(1), water0: z.number().min(2).max(10), goal: z.number().min(1).max(30), time: z.number().min(15).max(40), transport: z.boolean(), ...TargetsField }),
  z.object({ mode: z.literal("breath"), title: z.string().min(1).max(22), sub: z.string().max(40), activity: z.enum(["rest", "walk", "run"]), dur: z.number().min(10).max(30), ...TargetsField }),
  z.object({ mode: z.literal("gut"), title: z.string().min(1).max(22), sub: z.string().max(40), meal: z.array(z.enum(["starch", "protein", "fat"])).min(1).max(3), drops: z.number().int().min(2).max(6), ...TargetsField }),
]);
export type LlRoundT = z.infer<typeof LlRound>;
export const LifeSchema = z.object({ archetype: z.literal("life-lab@1"), ...EnvelopeExt, strings: stringsSchema(LL_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(LlRound).min(1).max(4) });
export type LifeSpec = z.infer<typeof LifeSchema>;
type Leaf = Extract<LlRoundT, { mode: "leaf" }>;
type Breath = Extract<LlRoundT, { mode: "breath" }>;
type Gut = Extract<LlRoundT, { mode: "gut" }>;

// ---- leaf model ----
export const LEAF_DT = 0.25, WILT_S = 4, SUGAR_K = 0.5;
export interface LeafState { water: number; sugar: number; wilt: number }
export function leafStep(rd: Leaf, s: LeafState, open: number, dt: number): LeafState {
  const o = s.wilt > 0 ? 0 : Math.max(0, Math.min(1, open));
  const sugar = s.sugar + SUGAR_K * Math.min(rd.light / 100, o) * (rd.co2 / 100) * dt;
  let water = Math.min(rd.water0, s.water + (rd.roots - o * rd.heat) * dt), wilt = Math.max(0, s.wilt - dt);
  if (water <= 0 && s.wilt <= 0) { water = 0; wilt = WILT_S; }
  return { water: Math.max(0, water), sugar, wilt };
}
export function leafRun(rd: Leaf, opens: number[]): LeafState & { wilts: number } {
  let s: LeafState = { water: rd.water0, sugar: 0, wilt: 0 }, wilts = 0; const n = Math.round(rd.time / LEAF_DT);
  for (let i = 0; i < n; i++) { const was = s.wilt; s = leafStep(rd, s, opens[i] ?? 0, LEAF_DT); if (s.wilt > was + 1e-9 && s.wilt >= WILT_S - 1e-9) wilts++; }
  return { ...s, wilts };
}
/** the best a careful leaf can do: open to the light-limited cap while water lasts, then to what the roots supply */
export function leafBest(rd: Leaf): number[] {
  const cap = rd.light / 100, steady = Math.min(cap, rd.heat > 0 ? rd.roots / rd.heat : 1), out: number[] = []; const n = Math.round(rd.time / LEAF_DT);
  let s: LeafState = { water: rd.water0, sugar: 0, wilt: 0 };
  for (let i = 0; i < n; i++) { const o = s.water - cap * rd.heat * LEAF_DT > rd.heat * LEAF_DT * 0.5 ? cap : steady; out.push(+o.toFixed(3)); s = leafStep(rd, s, o, LEAF_DT); }
  return out;
}
// ---- breath model ----
export const DECAY = { rest: 0.02, walk: 0.035, run: 0.06 } as const, O2_GAIN = 0.13, O2_START = 0.85, O2_LOW = 0.4;
export function breathRun(rd: Breath, breaths: [number, number][]): { min: number; end: number; perMin: number } {
  const ev = breaths.filter((b) => b[0] >= 0 && b[0] <= rd.dur).sort((a, b) => a[0] - b[0]);
  let o = O2_START, t = 0, min = o;
  for (const [bt, d] of ev) { o -= DECAY[rd.activity] * (bt - t); min = Math.min(min, o); o = Math.min(1, o + O2_GAIN * Math.max(0, Math.min(1, d))); t = bt; }
  o -= DECAY[rd.activity] * (rd.dur - t); min = Math.min(min, o);
  return { min, end: o, perMin: (ev.length / rd.dur) * 60 };
}
export const breathsNeeded = (rd: Breath) => (DECAY[rd.activity] / O2_GAIN) * 60;
// ---- gut model ----
export const STATIONS = ["mouth", "pipe", "stomach", "small", "large"] as const;
export const STATION_T: Record<(typeof STATIONS)[number], [number, number]> = { mouth: [0, 3.5], pipe: [3.5, 4.5], stomach: [4.5, 9], small: [9, 14], large: [14, 17] };
export const GUT_END = 17;
export const JUICES = ["saliva", "gastric", "bile", "pancreatic"] as const;
export type Juice = (typeof JUICES)[number];
export const stationAt = (t: number) => STATIONS.find((s) => t >= STATION_T[s][0] && t < STATION_T[s][1]) ?? "large";
/** which nutrients end up digested (and so absorbed in the small intestine) for a list of [juice, time] drops */
export function gutRun(rd: Gut, drops: [string, number][]): { absorbed: string[]; missed: string[]; used: number } {
  const ev = drops.filter((d) => (JUICES as readonly string[]).includes(d[0]) && d[1] >= 0 && d[1] < GUT_END).sort((a, b) => a[1] - b[1]).slice(0, rd.drops);
  const dig = new Set<string>(); let bile = false;
  for (const [j, t] of ev) {
    const at = stationAt(t);
    if (j === "saliva" && at === "mouth") dig.add("starch");
    if (j === "gastric" && at === "stomach") dig.add("protein");
    if (j === "bile" && at === "small") bile = true;
    if (j === "pancreatic" && at === "small") { dig.add("starch"); dig.add("protein"); if (bile) dig.add("fat"); }
  }
  const absorbed = rd.meal.filter((n) => dig.has(n)), missed = rd.meal.filter((n) => !dig.has(n));
  return { absorbed, missed, used: ev.length };
}
/** the fewest drops that digest the meal */
export function gutPlan(rd: Gut): [Juice, number][] {
  const mid = (s: (typeof STATIONS)[number]) => (STATION_T[s][0] + STATION_T[s][1]) / 2;
  if (rd.meal.includes("fat")) return [["bile", STATION_T.small[0] + 1], ["pancreatic", mid("small")]];
  if (rd.meal.length === 1) return rd.meal[0] === "starch" ? [["saliva", mid("mouth")]] : [["gastric", mid("stomach")]];
  return [["pancreatic", mid("small")]];
}

const llDefault: LifeSpec = {
  archetype: "life-lab@1", skills: ["c7-science-ch10-t01", "c7-science-ch10-t02", "c7-science-ch09-t03", "c7-science-ch09-t01"], lang: "en", strings: { ...LL_STRINGS }, title: "Life Lab",
  rounds: [
    { mode: "leaf", title: "Run the leaf", sub: "make 5 sugar before sunset", light: 80, co2: 80, heat: 1, roots: 0.45, water0: 4, goal: 5, time: 24, transport: false, targets: "c7-science-ch10-t01-m1" },
    { mode: "breath", title: "Breathe for a run", sub: "keep the oxygen up while running", activity: "run", dur: 16 },
    { mode: "gut", title: "Digest a paratha", sub: "starch and fat: use 3 drops at most", meal: ["starch", "fat"], drops: 3 },
  ],
};
function repairLife(raw: Record<string, unknown>, r: string[]): LifeSpec | null {
  const env = envelope(raw, llDefault, r);
  const rounds: LlRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Life", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["leaf", "breath", "gut"] as const, "leaf", "mode", r);
    if (mode === "leaf") {
      const rd: Leaf = { mode, ...head, light: num(x.light, 20, 100, 80, "light", r), co2: num(x.co2, 20, 100, 80, "co2", r), heat: num(x.heat, 0.2, 1.5, 1, "heat", r), roots: num(x.roots, 0, 1, 0.45, "roots", r), water0: num(x.water0, 2, 10, 4, "water0", r), goal: num(x.goal, 1, 30, 6, "goal", r), time: num(x.time, 15, 40, 24, "time", r), transport: x.transport === true };
      const best = leafRun(rd, leafBest(rd)).sugar;
      if (best < rd.goal * 1.12) { r.push("leaf:goal-not-reachable"); continue; }
      rounds.push(rd);
    } else if (mode === "breath") rounds.push({ mode, ...head, activity: oneOf(x.activity, ["rest", "walk", "run"] as const, "rest", "activity", r), dur: num(x.dur, 10, 30, 16, "dur", r) });
    else {
      const meal = [...new Set(arr(x.meal, "meal", r).filter((m): m is "starch" | "protein" | "fat" => m === "starch" || m === "protein" || m === "fat"))];
      if (!meal.length) { r.push("gut:meal"); continue; }
      const rd: Gut = { mode, ...head, meal, drops: num(x.drops, 2, 6, 3, "drops", r, true) };
      if (gutPlan(rd).length > rd.drops) { r.push("gut:too-few-drops"); continue; }
      rounds.push(rd);
    }
  }
  if (!rounds.length) return null;
  return { archetype: "life-lab@1", ...env, strings: strings(raw.strings, LL_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Life Lab", rounds };
}
function gradeLife(spec: LifeSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "leaf") {
    const opens = Array.isArray(v.open) ? v.open.map(Number).map((x) => (Number.isFinite(x) ? x : 0)).slice(0, 200) : [];
    const out = leafRun(rd, opens);
    return { verdict: out.sugar >= rd.goal - 1e-6 ? "right" : out.sugar >= rd.goal * 0.7 ? "partial" : "wrong", truth: rd.goal, error: +Math.max(0, rd.goal - out.sugar).toFixed(2), detail: `${out.sugar.toFixed(1)} sugar, ${out.wilts} wilt` };
  }
  if (rd.mode === "breath") {
    const b = Array.isArray(v.breaths) ? v.breaths.filter((x): x is [number, number] => Array.isArray(x) && x.length === 2 && x.every((n) => typeof n === "number" && Number.isFinite(n))).slice(0, 120) : [];
    const out = breathRun(rd, b);
    return { verdict: out.min >= O2_LOW ? "right" : out.min >= O2_LOW - 0.1 ? "partial" : "wrong", truth: +breathsNeeded(rd).toFixed(1), detail: `${Math.round(out.perMin)} per min` };
  }
  const drops = Array.isArray(v.drops) ? v.drops.filter((x): x is [string, number] => Array.isArray(x) && x.length === 2 && typeof x[0] === "string" && typeof x[1] === "number" && Number.isFinite(x[1])).slice(0, 12) : [];
  const out = gutRun(rd, drops);
  return { verdict: !out.missed.length ? "right" : out.absorbed.length ? "partial" : "wrong", truth: gutPlan(rd).map((p) => `${p[0]}@${stationAt(p[1])}`).join(" → "), detail: out.missed.length ? `missed ${out.missed.join(", ")}` : "all absorbed" };
}
function keysLife(spec: LifeSpec) {
  return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "leaf" ? `best ${leafRun(rd, leafBest(rd)).sugar.toFixed(1)} sugar ≥ ${rd.goal}` : rd.mode === "breath" ? `≥ ${breathsNeeded(rd).toFixed(1)} full breaths per min` : gutPlan(rd).map((p) => `${p[0]}@${stationAt(p[1])}`).join(" → "), prompt: rd.mode === "leaf" ? `make ${rd.goal} sugar` : rd.mode === "breath" ? rd.activity : rd.meal.join("+") }));
}
export const lifeDef: ExtSpecDef<LifeSpec> = {
  archetype: "life-lab@1", title: "Life Lab", kind: "simulation", subjects: ["science", "evs"],
  act: "work a leaf's stomata in real time to make sugar without wilting (xylem and phloem shown), pull a diaphragm to breathe and keep blood oxygen up at rest or running, drop the right digestive juice on a meal in the right organ before it leaves the small intestine",
  outcomes: { classes: [4, 6, 7], subjects: ["science", "evs"], topics: ["c7-science-ch10-t01", "c7-science-ch10-t02", "c7-science-ch10-t03", "c7-science-ch09-t01", "c7-science-ch09-t03"], misconceptions: [] },
  schema: LifeSchema as unknown as z.ZodType<LifeSpec>, defaultSpec: llDefault, repair: repairLife, grade: gradeLife, keys: keysLife,
};
