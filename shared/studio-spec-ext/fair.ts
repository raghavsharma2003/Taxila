// fair-test@1 — Fair Test Lab (VALUES-100 V3.1: the science process itself — germination, rusting, food spoilage,
// curd, drying, dissolving, floating, burning, neutralisation; NCERT 6.1, 6.10, 7.4, 7.5, 5-EVS-3, 4-EVS-7 ...).
// A bench of 2-4 setups. The child sets each setup's conditions, runs a time-lapse, and the MODEL (code, below) grows
// the sprouts, the rust, the mould, sets the curd, dries the cloth, dissolves the sugar, floats or sinks the clay, keeps
// or kills the flame. Rounds:
//   predict  — given setups: tap every setup that will show the outcome, then watch it happen
//   design   — "test whether X matters": make the setups differ in X and NOTHING else, then run (graded fair / unfair)
//   conclude — after running: tap the factor that matters (or does not)
//   drip     — neutralisation: hold to add drops of base to the acid with an indicator, stop at the colour change
// Every key is computed by the model from the setups; the spec only chooses the model, the setups and the question.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, src, strings, stringsSchema, targets, SrcField, type ExtSpecDef, type Graded } from "./common.ts";

export interface FtVar { id: string; label: string; values: { id: string; label: string }[] }
export interface FtModel { id: string; days: number; outcome: string; vars: FtVar[]; matters: string[]; result(cfg: Record<string, string>, day: number): number }
const yes = (v: string) => v === "yes";
export const FT_MODELS: Record<string, FtModel> = {
  germination: { id: "germination", days: 6, outcome: "sprouts", matters: ["water", "air", "warmth"],
    vars: [{ id: "water", label: "water", values: [{ id: "dry", label: "dry" }, { id: "moist", label: "moist" }] }, { id: "air", label: "air", values: [{ id: "yes", label: "air" }, { id: "no", label: "flooded" }] },
      { id: "warmth", label: "warmth", values: [{ id: "warm", label: "warm" }, { id: "cold", label: "fridge" }] }, { id: "light", label: "light", values: [{ id: "light", label: "light" }, { id: "dark", label: "dark" }] }],
    result: (c, d) => (c.water === "moist" && c.air === "yes" && c.warmth === "warm" ? Math.min(1, Math.max(0, (d - 1.5) / 3.5)) : 0) },
  rusting: { id: "rusting", days: 6, outcome: "rusts", matters: ["water", "air", "coat"],
    vars: [{ id: "water", label: "water", values: [{ id: "yes", label: "wet" }, { id: "no", label: "dry" }] }, { id: "air", label: "air", values: [{ id: "yes", label: "air" }, { id: "no", label: "no air" }] },
      { id: "coat", label: "coat", values: [{ id: "none", label: "bare" }, { id: "paint", label: "painted" }] }, { id: "salt", label: "salt", values: [{ id: "no", label: "no salt" }, { id: "yes", label: "salt" }] }],
    result: (c, d) => (yes(c.water) && yes(c.air) && c.coat === "none" ? Math.min(1, Math.max(0, d - 1) / (yes(c.salt) ? 2.5 : 4.5)) : 0) },
  spoilage: { id: "spoilage", days: 6, outcome: "spoils", matters: ["moisture", "temp", "salt"],
    vars: [{ id: "temp", label: "place", values: [{ id: "warm", label: "warm" }, { id: "cold", label: "fridge" }] }, { id: "moisture", label: "moisture", values: [{ id: "moist", label: "moist" }, { id: "dry", label: "dried" }] },
      { id: "salt", label: "salt", values: [{ id: "no", label: "plain" }, { id: "yes", label: "salted" }] }, { id: "lid", label: "cover", values: [{ id: "open", label: "open" }, { id: "covered", label: "covered" }] }],
    result: (c, d) => (c.moisture === "moist" && !yes(c.salt) ? Math.min(1, Math.max(0, d - 1) / (c.temp === "warm" ? 2.5 : 9)) : 0) },
  curd: { id: "curd", days: 2, outcome: "sets", matters: ["starter", "temp"],
    vars: [{ id: "starter", label: "curd added", values: [{ id: "yes", label: "+ curd" }, { id: "no", label: "none" }] }, { id: "temp", label: "milk", values: [{ id: "warm", label: "warm" }, { id: "cold", label: "cold" }, { id: "boiling", label: "boiling" }] }],
    result: (c, d) => (yes(c.starter) ? (c.temp === "warm" ? Math.min(1, d / 1) : c.temp === "cold" ? Math.min(0.25, d * 0.1) : 0) : 0) },
  drying: { id: "drying", days: 1, outcome: "dries", matters: ["spread", "wind", "sun", "humid"],
    vars: [{ id: "spread", label: "cloth", values: [{ id: "spread", label: "spread" }, { id: "folded", label: "folded" }] }, { id: "wind", label: "wind", values: [{ id: "yes", label: "breeze" }, { id: "no", label: "still" }] },
      { id: "sun", label: "sun", values: [{ id: "yes", label: "sunny" }, { id: "no", label: "shade" }] }, { id: "humid", label: "air", values: [{ id: "no", label: "dry air" }, { id: "yes", label: "humid" }] }],
    result: (c, d) => { const rate = (c.spread === "spread" ? 2 : 1) * (yes(c.wind) ? 1.6 : 1) * (yes(c.sun) ? 1.8 : 1) * (yes(c.humid) ? 0.5 : 1); return Math.min(1, (d * rate) / 4); } },
  dissolving: { id: "dissolving", days: 1, outcome: "dissolves", matters: ["stir", "temp", "grain"],
    vars: [{ id: "stir", label: "stir", values: [{ id: "yes", label: "stirred" }, { id: "no", label: "still" }] }, { id: "temp", label: "water", values: [{ id: "hot", label: "hot" }, { id: "cold", label: "cold" }] },
      { id: "grain", label: "sugar", values: [{ id: "powder", label: "powder" }, { id: "lump", label: "cube" }] }],
    result: (c, d) => { const rate = (yes(c.stir) ? 2 : 1) * (c.temp === "hot" ? 2 : 1) * (c.grain === "powder" ? 2 : 1); return Math.min(1, (d * rate) / 5); } },
  float: { id: "float", days: 1, outcome: "floats", matters: ["shape", "liquid"],
    vars: [{ id: "shape", label: "clay", values: [{ id: "ball", label: "ball" }, { id: "boat", label: "boat" }] }, { id: "liquid", label: "water", values: [{ id: "fresh", label: "plain" }, { id: "salt", label: "salty" }] },
      { id: "colour", label: "colour", values: [{ id: "red", label: "red" }, { id: "grey", label: "grey" }] }],
    // a clay ball sinks in both (clay is much denser than salt water); a hollow boat floats in both
    result: (c) => (c.shape === "boat" ? 1 : 0) },
  combustion: { id: "combustion", days: 1, outcome: "keeps burning", matters: ["air", "fuel", "flame"],
    vars: [{ id: "air", label: "air", values: [{ id: "yes", label: "open" }, { id: "no", label: "jar on" }] }, { id: "fuel", label: "wick", values: [{ id: "yes", label: "candle" }, { id: "no", label: "no wick" }] },
      { id: "flame", label: "lit", values: [{ id: "yes", label: "lit" }, { id: "no", label: "unlit" }] }],
    result: (c, d) => (yes(c.fuel) && yes(c.flame) ? (yes(c.air) ? 1 : Math.max(0, 1 - d * 3)) : 0) },
};
export const FT_MODEL_IDS = Object.keys(FT_MODELS);
/** The outcome at the end of the run, as a yes/no (≥ 0.6 counts as shown). */
export const ftShows = (m: FtModel, cfg: Record<string, string>) => m.result(cfg, m.days) >= 0.6;
const FT_STRINGS = { round: "Round", run: "RUN", day: "day", predict: "Tap every setup that will show it", design: "Make it a fair test", conclude: "Which factor matters?", notMatter: "Which factor does NOT matter?", fair: "FAIR TEST", unfair: "NOT FAIR", runDone: "Lab closed", correct: "right calls", drip: "Hold to add drops; stop when it turns", drops: "drops", neutral: "NEUTRAL", hint: "change only one thing" };
const Cfg = z.record(z.string(), z.string());
const FtRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("predict"), title: z.string().min(1).max(22), sub: z.string().max(40), setups: z.array(Cfg).min(2).max(4), ...SrcField, ...TargetsField }),
  z.object({ mode: z.literal("design"), title: z.string().min(1).max(22), sub: z.string().max(40), vary: z.string(), start: z.array(Cfg).length(2), ...TargetsField }),
  z.object({ mode: z.literal("conclude"), title: z.string().min(1).max(22), sub: z.string().max(40), ask: z.enum(["matters", "not"]), options: z.array(z.string()).min(2).max(4), ...SrcField, ...TargetsField }),
  z.object({ mode: z.literal("drip"), title: z.string().min(1).max(22), sub: z.string().max(40), acid: z.number().int().min(4).max(30), indicator: z.enum(["phenolphthalein", "rose", "turmeric"]), ...TargetsField }),
]);
export type FtRoundT = z.infer<typeof FtRound>;
export const FairSchema = z.object({ archetype: z.literal("fair-test@1"), ...EnvelopeExt, strings: stringsSchema(FT_STRINGS, 44), title: z.string().min(1).max(36), model: z.enum(FT_MODEL_IDS as [string, ...string[]]), rounds: z.array(FtRound).min(1).max(4) });
export type FairSpec = z.infer<typeof FairSchema>;

// reviewed default: c6-science-ch10-t02 conditions for germination (NCERT: seeds need water, air and warmth; light is not
// needed for germination — the kit's "seeds need light/soil to sprout" misconception)
const fairDefault: FairSpec = {
  archetype: "fair-test@1", skills: ["c6-science-ch10-t02"], lang: "en", strings: { ...FT_STRINGS }, title: "What does a seed need?", model: "germination",
  rounds: [
    { mode: "predict", title: "Predict", sub: "which dishes will sprout?", setups: [
      { water: "dry", air: "yes", warmth: "warm", light: "light" }, { water: "moist", air: "yes", warmth: "warm", light: "light" },
      { water: "moist", air: "no", warmth: "warm", light: "light" }, { water: "moist", air: "yes", warmth: "cold", light: "light" } ] },
    { mode: "design", title: "Does light matter?", sub: "change only the light", vary: "light", start: [{ water: "moist", air: "yes", warmth: "warm", light: "light" }, { water: "dry", air: "yes", warmth: "warm", light: "light" }] },
    { mode: "conclude", title: "Conclude", sub: "what did the test show?", ask: "not", options: ["water", "air", "warmth", "light"] },
  ],
};
function cfg(raw: unknown, m: FtModel, r: string[]): Record<string, string> | null {
  if (!isObj(raw)) { r.push("setup"); return null; }
  const out: Record<string, string> = {};
  for (const v of m.vars) { const x = raw[v.id]; out[v.id] = typeof x === "string" && v.values.some((vv) => vv.id === x) ? x : (x !== undefined && r.push("setup:" + v.id), v.values[0].id); }
  return out;
}
function repairFair(raw: Record<string, unknown>, r: string[]): FairSpec | null {
  const env = envelope(raw, fairDefault, r);
  const modelId = oneOf(raw.model, FT_MODEL_IDS, "", "model", r); const m = FT_MODELS[modelId];
  const rounds: FtRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Lab", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["predict", "design", "conclude", "drip"] as const, "predict", "mode", r);
    if (mode === "drip") { rounds.push({ mode, ...head, acid: num(x.acid, 4, 30, 12, "acid", r, true), indicator: oneOf(x.indicator, ["phenolphthalein", "rose", "turmeric"] as const, "rose", "indicator", r) }); continue; }
    if (!m) { r.push("round:needs-model"); continue; }
    if (mode === "predict") {
      const setups = arr(x.setups, "setups", r).slice(0, 4).map((c) => cfg(c, m, r)).filter((c): c is Record<string, string> => !!c);
      if (setups.length >= 2) rounds.push({ mode, ...head, setups, ...src(x.src, r) }); else r.push("round:setups");
    } else if (mode === "design") {
      if (typeof x.vary !== "string" || !m.vars.some((v) => v.id === x.vary)) { r.push("design:vary"); continue; }
      const start = arr(x.start, "start", r).slice(0, 2).map((c) => cfg(c, m, r)).filter((c): c is Record<string, string> => !!c);
      while (start.length < 2) start.push(Object.fromEntries(m.vars.map((v) => [v.id, v.values[0].id])));
      rounds.push({ mode, ...head, vary: x.vary, start });
    } else {
      const options = [...new Set(arr(x.options, "options", r).filter((o): o is string => typeof o === "string" && m.vars.some((v) => v.id === o)))].slice(0, 4);
      const ask = oneOf(x.ask, ["matters", "not"] as const, "matters", "ask", r);
      const keys = options.filter((o) => (ask === "matters") === m.matters.includes(o));
      if (options.length < 2 || keys.length !== 1) { r.push("conclude:needs-exactly-one-key"); continue; }
      rounds.push({ mode, ...head, ask, options, ...src(x.src, r) });
    }
  }
  if (!rounds.length) return null;
  if (!m && rounds.some((rd) => rd.mode !== "drip")) return null;
  return { archetype: "fair-test@1", ...env, strings: strings(raw.strings, FT_STRINGS, 44, r), title: reqStr(raw.title, 36, "title", r) ?? "Fair Test Lab", model: m ? modelId : "germination", rounds };
}
/** Neutralisation: drops of base needed to neutralise `acid` drops of acid of equal strength. */
export const dripKey = (acid: number) => acid;
function gradeFair(spec: FairSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const M = FT_MODELS[spec.model];
  if (rd.mode === "predict") {
    const truth = rd.setups.map((c, i) => (ftShows(M, c) ? i : -1)).filter((i) => i >= 0);
    if (!Array.isArray(value)) return { verdict: "wrong", truth, detail: "no-value" };
    const pick = [...new Set(value.filter((v): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < rd.setups.length))].sort();
    const same = pick.length === truth.length && pick.every((v, i) => v === truth[i]);
    const wrongCount = rd.setups.reduce((a, _, i) => a + (pick.includes(i) !== truth.includes(i) ? 1 : 0), 0);
    return { verdict: same ? "right" : wrongCount === 1 && rd.setups.length >= 3 ? "partial" : "wrong", truth, error: wrongCount };
  }
  if (rd.mode === "design") {
    const setups = Array.isArray(value) ? value : isObj(value) && Array.isArray(value.setups) ? value.setups : null;
    if (!setups || setups.length !== 2 || !setups.every(isObj)) return { verdict: "wrong", truth: rd.vary, detail: "no-value" };
    const diff = M.vars.filter((v) => (setups[0] as Record<string, unknown>)[v.id] !== (setups[1] as Record<string, unknown>)[v.id]).map((v) => v.id);
    const fair = diff.length === 1 && diff[0] === rd.vary;
    return { verdict: fair ? "right" : diff.includes(rd.vary) ? "partial" : "wrong", truth: rd.vary, detail: fair ? "fair" : diff.length ? "differs:" + diff.join(",") : "no-difference" };
  }
  if (rd.mode === "conclude") {
    const key = rd.options.find((o) => (rd.ask === "matters") === M.matters.includes(o))!;
    return { verdict: value === key ? "right" : "wrong", truth: key };
  }
  const drops = typeof value === "number" ? value : NaN; const key = dripKey(rd.acid);
  if (!Number.isFinite(drops)) return { verdict: "wrong", truth: key, detail: "no-value" };
  const e = Math.abs(drops - key);
  return { verdict: e === 0 ? "right" : e <= 1 ? "partial" : "wrong", truth: key, error: e };
}
function keysFair(spec: FairSpec) {
  const M = FT_MODELS[spec.model];
  return spec.rounds.map((rd, k) => {
    const id = `r${k + 1}`;
    if (rd.mode === "predict") return { itemId: id, key: rd.setups.map((c, i) => `${i + 1}:${ftShows(M, c) ? M.outcome : "no"}`).join(" "), prompt: `${spec.model}: ${rd.setups.map((c) => JSON.stringify(c)).join(" | ")}`, ...(rd.src ? { src: rd.src } : {}) };
    if (rd.mode === "design") return { itemId: id, key: `vary only ${rd.vary}`, prompt: `fair test for ${rd.vary}` };
    if (rd.mode === "conclude") return { itemId: id, key: rd.options.find((o) => (rd.ask === "matters") === M.matters.includes(o))!, prompt: `${rd.ask === "matters" ? "which matters" : "which does not matter"} for ${M.outcome}: ${rd.options.join(", ")}`, ...(rd.src ? { src: rd.src } : {}) };
    return { itemId: id, key: `${dripKey(rd.acid)} drops`, prompt: `neutralise ${rd.acid} drops acid` };
  });
}
export const fairDef: ExtSpecDef<FairSpec> = {
  archetype: "fair-test@1", title: "Fair Test Lab", kind: "simulation", subjects: ["science", "evs"],
  act: "set up experiments, predict, run a time-lapse the model computes, design a fair test (change one thing), conclude; or drip to neutral",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["science", "evs"], topics: ["c6-science-ch10-t02"], misconceptions: [] },
  schema: FairSchema as unknown as z.ZodType<FairSpec>, defaultSpec: fairDefault, repair: repairFair, grade: gradeFair, keys: keysFair,
};
