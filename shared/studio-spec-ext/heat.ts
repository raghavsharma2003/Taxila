// heat-lab@1 — Heat & Matter Lab (VALUES-100 V3.1: heat transfer and separating substances; c7-sci ch07-t01..t03,
// c6-sci ch09-t01/t02, c6-sci ch04-t01 magnetic materials in mixtures).
//   conduct  — rods of different materials with wax-stuck pins over one flame: rank which pin falls first, then HEAT and
//              watch the 1-D heat flow decide (the order comes from each material's measured diffusivity)
//   breeze   — a coast through the day: drag the sun to the asked hour, probe land and sea with the thermometer, set the
//              breeze; on LOCK the convection loop runs from the model (land heats and cools faster than the sea)
//   radiate  — pick the finish for a water tank on a roof (keep it cool or keep it warm); RUN shows the thermometers
//              climb by absorptivity
//   separate — run a mixture through real machines (pick out, sieve, winnow, magnet, water, filter, evaporate), choosing which
//              output to keep each time, until only the target is left
// Truth tables are physical constants; every key is computed by the model here.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

export const MATERIALS = ["copper", "aluminium", "iron", "steel", "glass", "wood", "plastic"] as const;
export type Material = (typeof MATERIALS)[number];
/** thermal diffusivity, mm²/s (room temperature handbook values, rounded) */
export const DIFFUSIVITY: Record<Material, number> = { copper: 111, aluminium: 97, iron: 23, steel: 4.2, glass: 0.34, wood: 0.12, plastic: 0.08 };
export const FINISHES = ["black", "dark", "white", "shiny"] as const;
export type Finish = (typeof FINISHES)[number];
/** solar absorptivity (fraction of sunlight absorbed) */
export const ABSORB: Record<Finish, number> = { black: 0.95, dark: 0.8, white: 0.25, shiny: 0.1 };
export const COMPONENTS = ["stones", "rice", "flour", "husk", "sand", "salt", "sugar", "iron", "sawdust", "chalk"] as const;
export type Comp = (typeof COMPONENTS)[number];
export const PROPS: Record<Comp, { big: boolean; light: boolean; magnetic: boolean; soluble: boolean; pick?: boolean }> = {
  stones: { big: true, light: false, magnetic: false, soluble: false, pick: true }, rice: { big: true, light: false, magnetic: false, soluble: false },
  flour: { big: false, light: false, magnetic: false, soluble: false }, husk: { big: false, light: true, magnetic: false, soluble: false },
  sand: { big: false, light: false, magnetic: false, soluble: false }, salt: { big: false, light: false, magnetic: false, soluble: true },
  sugar: { big: false, light: false, magnetic: false, soluble: true }, iron: { big: false, light: false, magnetic: true, soluble: false },
  sawdust: { big: false, light: true, magnetic: false, soluble: false }, chalk: { big: false, light: false, magnetic: false, soluble: false },
};
export const MACHINES = ["handpick", "sieve", "winnow", "magnet", "water", "filter", "evaporate"] as const;
export type Machine = (typeof MACHINES)[number];
const HL_STRINGS = { round: "Round", done: "right", heat: "HEAT", lock: "LOCK", run: "RUN", first: "falls first", last: "last", land: "land", sea: "sea", hour: "time", seaBreeze: "sea → land", landBreeze: "land → sea", keepCool: "keep it cool", keepWarm: "keep it warm", runDone: "Lab closed", caught: "caught", passed: "passed", keep: "keep which?", target: "get", steps: "steps", reset: "START AGAIN", black: "black", dark: "dark", white: "white", shiny: "shiny", copper: "copper", aluminium: "aluminium", iron: "iron", steel: "steel", glass: "glass", wood: "wood", plastic: "plastic", stones: "stones", rice: "rice", flour: "flour", husk: "husk", sand: "sand", salt: "salt", sugar: "sugar", sawdust: "sawdust", chalk: "chalk", handpick: "pick out", sieve: "sieve", winnow: "winnow", magnet: "magnet", water: "add water", filter: "filter", evaporate: "evaporate", wet: "in water" };
const HlRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("conduct"), title: z.string().min(1).max(22), sub: z.string().max(40), rods: z.array(z.enum(MATERIALS)).min(2).max(4), ...TargetsField }),
  z.object({ mode: z.literal("breeze"), title: z.string().min(1).max(22), sub: z.string().max(40), asks: z.array(z.number().int().min(0).max(23)).min(1).max(3), ...TargetsField }),
  z.object({ mode: z.literal("radiate"), title: z.string().min(1).max(22), sub: z.string().max(40), options: z.array(z.enum(FINISHES)).min(2).max(4), goal: z.enum(["cool", "warm"]), ...TargetsField }),
  z.object({ mode: z.literal("separate"), title: z.string().min(1).max(22), sub: z.string().max(40), mix: z.array(z.enum(COMPONENTS)).min(2).max(4), target: z.enum(COMPONENTS), maxSteps: z.number().int().min(1).max(6), ...TargetsField }),
]);
export type HlRoundT = z.infer<typeof HlRound>;
export const HeatSchema = z.object({ archetype: z.literal("heat-lab@1"), ...EnvelopeExt, strings: stringsSchema(HL_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(HlRound).min(1).max(4) });
export type HeatSpec = z.infer<typeof HeatSchema>;

// ---- conduction: explicit 1-D heat flow, pin at 80% of the rod falls when it passes 60 °C ----
export const ROD_N = 20, PIN_AT = 15, FLAME_C = 300, ROOM_C = 25, MELT_C = 60, ROD_T = 20;
const K_SCALE = 0.17; // maps mm²/s to cells²/s so copper's pin falls in ~2.5 s of screen time (time is sped up)
export function rodStep(T: number[], mat: Material, dt: number): number[] {
  const a = DIFFUSIVITY[mat] * K_SCALE, n = Math.max(1, Math.ceil((a * dt) / 0.2)), h = dt / n; let u = T.slice();
  for (let s = 0; s < n; s++) { const v = u.slice(); v[0] = FLAME_C; for (let i = 1; i < ROD_N - 1; i++) v[i] = u[i] + a * h * (u[i - 1] - 2 * u[i] + u[i + 1]); v[ROD_N - 1] = v[ROD_N - 2]; u = v; }
  return u;
}
/** seconds until each rod's pin falls (Infinity when it does not within ROD_T) */
export function fallTimes(rods: Material[]): number[] {
  return rods.map((m) => { let T = Array(ROD_N).fill(ROOM_C); T[0] = FLAME_C; for (let t = 0; t < ROD_T; t += 0.05) { T = rodStep(T, m, 0.05); if (T[PIN_AT] >= MELT_C) return +(t + 0.05).toFixed(2); } return Infinity; });
}
/** an order is right when every pair the model separates is in the model's order (pins that never fall tie) */
export function orderOk(rods: Material[], order: number[]): boolean {
  const ft = fallTimes(rods); if (order.length !== rods.length || new Set(order).size !== rods.length || order.some((i) => !(i >= 0 && i < rods.length))) return false;
  for (let a = 0; a < order.length; a++) for (let b = a + 1; b < order.length; b++) { const x = ft[order[a]], y = ft[order[b]]; if (Number.isFinite(x) || Number.isFinite(y)) if (x > y) return false; }
  return true;
}
// ---- sea and land breeze ----
export const landC = (h: number) => 26 + 9 * Math.sin((2 * Math.PI * (h - 9)) / 24);
export const seaC = (h: number) => 27 + 1.5 * Math.sin((2 * Math.PI * (h - 12)) / 24);
/** surface wind blows from the cooler surface toward the warmer one (warm air rises, cooler air flows in under it) */
export const breezeAt = (h: number): "sea" | "land" => (landC(h) > seaC(h) ? "sea" : "land");
export const breezeClear = (h: number) => Math.abs(landC(h) - seaC(h)) >= 1.5;
// ---- radiation: tank temperature after an hour in the sun ----
export const tankC = (f: Finish, minutes = 60) => 28 + ABSORB[f] * 22 * (1 - Math.exp(-minutes / 40));
export const bestFinish = (rd: Extract<HlRoundT, { mode: "radiate" }>) => [...rd.options].sort((a, b) => (rd.goal === "cool" ? ABSORB[a] - ABSORB[b] : ABSORB[b] - ABSORB[a]))[0];
// ---- separation ----
export interface Stream { items: Comp[]; wet: boolean }
/** run one machine: returns [caught, passed] streams, or null when the machine cannot run on this stream */
export function machine(m: Machine, s: Stream): [Stream, Stream] | null {
  const split = (f: (c: Comp) => boolean, wetA = s.wet, wetB = s.wet): [Stream, Stream] => [{ items: s.items.filter(f), wet: wetA }, { items: s.items.filter((c) => !f(c)), wet: wetB }];
  if (m === "handpick") return s.wet ? null : split((c) => !!PROPS[c].pick);
  if (m === "sieve") return s.wet ? null : split((c) => PROPS[c].big);
  if (m === "winnow") return s.wet ? null : split((c) => PROPS[c].light);
  if (m === "magnet") return split((c) => PROPS[c].magnetic);
  if (m === "water") return s.wet ? null : [{ items: s.items, wet: true }, { items: [], wet: true }];
  if (m === "filter") return s.wet ? split((c) => !PROPS[c].soluble, false, true) : null;
  if (m === "evaporate") return s.wet ? [{ items: s.items, wet: false }, { items: [], wet: false }] : null;
  return null;
}
export function runPipeline(mix: Comp[], steps: [string, number][]): { stream: Stream; valid: boolean } {
  let s: Stream = { items: [...mix], wet: false };
  for (const [m, keep] of steps) { if (!(MACHINES as readonly string[]).includes(m)) return { stream: s, valid: false }; const out = machine(m as Machine, s); if (!out) return { stream: s, valid: false }; s = out[keep === 1 ? 1 : 0]; }
  return { stream: s, valid: true };
}
export const isPure = (s: Stream, target: Comp) => !s.wet && s.items.length === 1 && s.items[0] === target;
/** the fewest machine runs that leave the target pure and dry (BFS), or null */
export function separatePlan(mix: Comp[], target: Comp, cap = 6): [Machine, number][] | null {
  const key = (s: Stream) => [...s.items].sort().join(",") + (s.wet ? "|w" : "|d");
  const q: { s: Stream; path: [Machine, number][] }[] = [{ s: { items: [...mix], wet: false }, path: [] }], seen = new Set([key(q[0].s)]);
  while (q.length) { const { s, path } = q.shift()!; if (isPure(s, target)) return path; if (path.length >= cap) continue; for (const m of MACHINES) { const out = machine(m, s); if (!out) continue; for (const k of [0, 1]) { const n = out[k]; if (!n.items.includes(target)) continue; const kk = key(n); if (seen.has(kk)) continue; seen.add(kk); q.push({ s: n, path: [...path, [m, k]] }); } } }
  return null;
}

const hlDefault: HeatSpec = {
  archetype: "heat-lab@1", skills: ["c7-science-ch07-t01", "c7-science-ch07-t02", "c6-science-ch09-t02", "c6-science-ch09-t01"], lang: "en", strings: { ...HL_STRINGS }, title: "Heat & Matter Lab",
  rounds: [
    { mode: "conduct", title: "Wax pin race", sub: "which pin falls first?", rods: ["iron", "copper", "glass"] },
    { mode: "breeze", title: "Coast breeze", sub: "which way does the breeze blow?", asks: [14, 3], targets: "c7-science-ch07-t02-m1" },
    { mode: "separate", title: "Get the salt back", sub: "salt, sand and iron filings", mix: ["sand", "salt", "iron"], target: "salt", maxSteps: 4 },
  ],
};
function repairHeat(raw: Record<string, unknown>, r: string[]): HeatSpec | null {
  const env = envelope(raw, hlDefault, r);
  const rounds: HlRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Heat", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["conduct", "breeze", "radiate", "separate"] as const, "conduct", "mode", r);
    if (mode === "conduct") { const rods = [...new Set(arr(x.rods, "rods", r).filter((m): m is Material => (MATERIALS as readonly string[]).includes(m as string)))].slice(0, 4); const ft = fallTimes(rods); if (rods.length < 2 || ft.filter(Number.isFinite).length < 1) { r.push("conduct:rods"); continue; } rounds.push({ mode, ...head, rods }); }
    else if (mode === "breeze") { const asks = [...new Set(arr(x.asks, "asks", r).filter((h): h is number => Number.isInteger(h) && (h as number) >= 0 && (h as number) <= 23))].filter((h) => { if (!breezeClear(h)) { r.push("breeze:hour-too-close-to-turnover"); return false; } return true; }).slice(0, 3); if (!asks.length) continue; rounds.push({ mode, ...head, asks }); }
    else if (mode === "radiate") { const options = [...new Set(arr(x.options, "options", r).filter((f): f is Finish => (FINISHES as readonly string[]).includes(f as string)))].slice(0, 4); if (options.length < 2) { r.push("radiate:options"); continue; } rounds.push({ mode, ...head, options, goal: oneOf(x.goal, ["cool", "warm"] as const, "cool", "goal", r) }); }
    else {
      const mix = [...new Set(arr(x.mix, "mix", r).filter((c): c is Comp => (COMPONENTS as readonly string[]).includes(c as string)))].slice(0, 4);
      const target = oneOf(x.target, COMPONENTS, mix[0] ?? "salt", "target", r);
      if (mix.length < 2 || !mix.includes(target)) { r.push("separate:mix"); continue; }
      const plan = separatePlan(mix, target); if (!plan) { r.push("separate:impossible"); continue; }
      rounds.push({ mode, ...head, mix, target, maxSteps: Math.max(plan.length, num(x.maxSteps, 1, 6, plan.length + 1, "maxSteps", r, true)) });
    }
  }
  if (!rounds.length) return null;
  return { archetype: "heat-lab@1", ...env, strings: strings(raw.strings, HL_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Heat & Matter Lab", rounds };
}
function gradeHeat(spec: HeatSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)(?::(\d+))?$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "conduct") { const order = Array.isArray(v.order) ? v.order.map(Number) : []; const ft = fallTimes(rd.rods); const truth = rd.rods.map((_, i) => i).sort((a, b) => ft[a] - ft[b]).map((i) => rd.rods[i]); return { verdict: orderOk(rd.rods, order) ? "right" : order[0] === rd.rods.indexOf(truth[0]) ? "partial" : "wrong", truth }; }
  if (rd.mode === "breeze") { const i = Number(m[2] ?? 0), h = rd.asks[i]; if (h === undefined) return UNGRADED; const key = breezeAt(h); return { verdict: v.from === key ? "right" : "wrong", truth: key === "sea" ? "sea → land" : "land → sea", detail: `land ${landC(h).toFixed(0)}°, sea ${seaC(h).toFixed(0)}°` }; }
  if (rd.mode === "radiate") { const best = bestFinish(rd), f = String(v.finish); if (!(rd.options as string[]).includes(f)) return { verdict: "wrong", truth: best, detail: "no-value" }; const sorted = [...rd.options].sort((a, b) => (rd.goal === "cool" ? ABSORB[a] - ABSORB[b] : ABSORB[b] - ABSORB[a])); return { verdict: f === best ? "right" : f === sorted[1] && rd.options.length > 2 ? "partial" : "wrong", truth: best, detail: `${tankC(f as Finish).toFixed(1)} °C` }; }
  const steps = Array.isArray(v.steps) ? v.steps.filter((s): s is [string, number] => Array.isArray(s) && s.length === 2 && typeof s[0] === "string" && typeof s[1] === "number").slice(0, 12) : [];
  const out = runPipeline(rd.mix, steps), pure = out.valid && isPure(out.stream, rd.target), plan = separatePlan(rd.mix, rd.target) ?? [];
  return { verdict: pure && steps.length <= rd.maxSteps ? "right" : pure ? "partial" : "wrong", truth: plan.map((p) => `${p[0]}:${p[1] ? "passed" : "caught"}`).join(" → "), detail: pure ? `${steps.length} steps` : out.stream.items.join("+") || "empty" };
}
function keysHeat(spec: HeatSpec) {
  return spec.rounds.flatMap((rd, k) => {
    if (rd.mode === "breeze") return rd.asks.map((h, i) => ({ itemId: `r${k + 1}:${i}`, key: breezeAt(h) === "sea" ? "sea → land" : "land → sea", prompt: `${h}:00` }));
    if (rd.mode === "conduct") { const ft = fallTimes(rd.rods); return [{ itemId: `r${k + 1}`, key: rd.rods.map((m, i) => [m, ft[i]] as const).sort((a, b) => a[1] - b[1]).map((x) => x[0]).join(" > "), prompt: rd.rods.join(", ") }]; }
    if (rd.mode === "radiate") return [{ itemId: `r${k + 1}`, key: bestFinish(rd), prompt: `${rd.goal}: ${rd.options.join("/")}` }];
    return [{ itemId: `r${k + 1}`, key: (separatePlan(rd.mix, rd.target) ?? []).map((p) => p[0]).join(" → "), prompt: `${rd.target} from ${rd.mix.join("+")}` }];
  });
}
export const heatDef: ExtSpecDef<HeatSpec> = {
  archetype: "heat-lab@1", title: "Heat & Matter Lab", kind: "simulation", subjects: ["science", "evs"],
  act: "rank conducting rods then watch a 1-D heat flow drop the wax pins, probe land and sea temperatures through the day and set the breeze before the convection loop runs, choose a tank finish and watch absorption heat it, run a mixture through pick-out / sieve / winnow / magnet / water / filter / evaporate choosing the output to keep",
  outcomes: { classes: [6, 7], subjects: ["science"], topics: ["c7-science-ch07-t01", "c7-science-ch07-t02", "c7-science-ch07-t03", "c6-science-ch09-t01", "c6-science-ch09-t02"], misconceptions: [] },
  schema: HeatSchema as unknown as z.ZodType<HeatSpec>, defaultSpec: hlDefault, repair: repairHeat, grade: gradeHeat, keys: keysHeat,
};
