// scene-explainer@1 — the cinematic explainer for EVERY class 4-7 topic (VALUES-100 V3.1 "one cinematic explainer").
//
// A narration-locked, scrubbable explainer (state = f(t), QB-A8) built from a CLOSED set of computed primitives, so a
// model can author a piece per topic and the engine still owns truth, layout and craft:
//   scenes (shots) → elements (node, arrow, axis + mark, fraction bar, bar chart, grid, angle, polygon, counter, quote
//   with highlighted words, Hindi metre line whose मात्रा weights the ENGINE computes, myth card, particle field,
//   glyph, label, title) → beats (one narration line each) → cues (closed verbs) → one graded hands-on task.
//
// What the engine computes (a model cannot get it wrong): positions on an axis, shaded fractions of a bar, bar heights,
// angle arcs and their degree labels, polygon edges, counter tweens, matra weights, layout (no overlaps, safe zones).
// What the model writes: which elements, in which order, which words, which narration, which task and key.
// QB-A1/A6: a spec SHOULD carry a `myth` element (the kit misconception) and bust it on screen; the catalogue linter
// requires it for T3 (concept) topics.
import { z } from "zod";
import {
  EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, clampN, envelope, idOk, isObj, normText, num, oneOf, reqStr, src, str, targets, type ExtSpecDef,
} from "./common.ts";
import { estimateLine, type BeatT, type NarrationLine } from "../studio-spec.ts";

export const GLYPHS = [
  "sun", "moon", "star", "earth", "cloud", "rain", "drop", "wave", "mountain", "river", "tree", "leaf", "seed", "flower", "fish", "bird",
  "cow", "insect", "person", "group", "house", "school", "shop", "factory", "wheat", "coin", "note", "book", "scroll", "pen", "crown", "temple",
  "pillar", "wheel", "train", "ship", "car", "fire", "magnet", "bulb", "battery", "thermometer", "clock", "globe", "compass", "balance", "jug", "ruler",
  "beaker", "gear", "lungs", "stomach", "eye", "hand", "plate", "apple", "recycle", "phone", "letter", "music", "lightning", "wind", "shield", "ballot",
  "bank", "road", "tap", "pot", "question", "spark", "atom", "mirror", "torch", "map", "pick", "boat",
] as const;
export type Glyph = typeof GLYPHS[number];
export const ACCENTS = ["ion", "sci", "mint", "amber", "sun", "volt"] as const;
export type Accent = typeof ACCENTS[number];
export const LAYOUTS = ["row", "cycle", "column", "grid", "split", "free"] as const;
export const SCENE_VERBS = ["show", "hide", "move", "scale", "highlight", "flow", "count", "bust", "focus", "unfocus", "camera", "shade", "interactive"] as const;
export const EL_TYPES = ["title", "label", "node", "arrow", "axis", "mark", "bar", "bars", "grid", "angle", "poly", "counter", "quote", "meter", "myth", "particles", "glyph"] as const;
export type ElType = typeof EL_TYPES[number];
export const PARTICLE_MODES = ["solid", "liquid", "gas", "flow", "rise", "fall", "swirl"] as const;

const Num = z.number().refine(Number.isFinite);
const XY = { x: Num.min(0).max(1000).optional(), y: Num.min(0).max(625).optional() };
const Id = z.string().regex(/^[A-Za-z0-9_-]{1,16}$/);
const Color = z.enum(ACCENTS).optional();
const Text = (n: number) => z.string().min(1).max(n).refine((s) => !MARKUP.test(s), "markup");
const El = z.discriminatedUnion("type", [
  z.object({ id: Id, type: z.literal("title"), text: Text(40) }),
  z.object({ id: Id, type: z.literal("label"), text: Text(34), ...XY, color: Color }),
  z.object({ id: Id, type: z.literal("node"), text: Text(16), sub: Text(18).optional(), glyph: z.enum(GLYPHS).optional(), ...XY, color: Color }),
  z.object({ id: Id, type: z.literal("arrow"), from: Id, to: Id, text: Text(14).optional(), bend: Num.min(-1).max(1).optional() }),
  z.object({ id: Id, type: z.literal("axis"), min: Num, max: Num, step: Num.positive(), unit: Text(10).optional(), scale: z.enum(["linear", "year"]), y: Num.min(200).max(560).optional() }),
  z.object({ id: Id, type: z.literal("mark"), axis: Id, value: Num, text: Text(14).optional(), color: Color }),
  z.object({ id: Id, type: z.literal("bar"), parts: z.number().int().min(1).max(24), shaded: z.number().int().min(0).max(24), ...XY, w: Num.min(200).max(800).optional(), text: Text(14).optional() }),
  z.object({ id: Id, type: z.literal("bars"), values: z.array(Num.min(0).max(1e9)).min(2).max(8), labels: z.array(Text(8)).min(2).max(8), unit: Text(10).optional() }),
  z.object({ id: Id, type: z.literal("grid"), cols: z.number().int().min(1).max(14), rows: z.number().int().min(1).max(8), shaded: z.number().int().min(0).max(112), ...XY }),
  z.object({ id: Id, type: z.literal("angle"), deg: Num.min(1).max(359), rot: Num.min(-180).max(180).optional(), ...XY, r: Num.min(60).max(220).optional() }),
  z.object({ id: Id, type: z.literal("poly"), points: z.array(z.tuple([Num.min(60).max(940), Num.min(170).max(560)])).min(2).max(8), closed: z.boolean(), ...XY }),
  z.object({ id: Id, type: z.literal("counter"), from: Num.min(-1e9).max(1e9), to: Num.min(-1e9).max(1e9), unit: Text(10).optional(), decimals: z.number().int().min(0).max(2), ...XY }),
  z.object({ id: Id, type: z.literal("quote"), text: Text(64), hi: z.array(z.number().int().min(0).max(20)).max(6), hi2: z.array(z.number().int().min(0).max(20)).max(6), ...XY }),
  z.object({ id: Id, type: z.literal("meter"), text: Text(40), ...XY }),
  z.object({ id: Id, type: z.literal("myth"), text: Text(64), ...XY }),
  z.object({ id: Id, type: z.literal("particles"), mode: z.enum(PARTICLE_MODES), n: z.number().int().min(10).max(160), ...XY, w: Num.min(120).max(860).optional(), h: Num.min(80).max(380).optional(), color: Color }),
  z.object({ id: Id, type: z.literal("glyph"), name: z.enum(GLYPHS), ...XY, size: Num.min(80).max(260).optional(), color: Color }),
]);
export type SceneEl = z.infer<typeof El>;
const Scene = z.object({ id: Id, layout: z.enum(LAYOUTS), els: z.array(El).min(1).max(12) });
export type SceneT = z.infer<typeof Scene>;
const NarrLine = z.object({ text: z.string().max(240), dur: z.number().min(0.4).max(30), lead: z.number().min(0).max(5), tail: z.number().min(0).max(5), pauses: z.array(z.tuple([z.number(), z.number()])).max(30) });
const Cue = z.object({ at: z.union([z.number(), z.string()]), do: z.enum(SCENE_VERBS), dur: z.number().min(0).max(12).optional() }).catchall(z.unknown());
const SBeat = z.object({ line: Id, gap: z.number().min(0).max(3), scene: Id.optional(), cues: z.array(Cue).max(16) });
export type SBeatT = z.infer<typeof SBeat>;
const Task = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("tap"), prompt: Text(90), options: z.array(Id).min(2).max(6), answer: Id, src: z.string().optional() }),
  z.object({ kind: z.literal("order"), prompt: Text(90), items: z.array(Id).min(3).max(6), src: z.string().optional() }),
  z.object({ kind: z.literal("place"), prompt: Text(90), axis: Id, answer: Num, tol: Num.positive(), src: z.string().optional() }),
]);
export type SceneTask = z.infer<typeof Task>;
const SC_STRINGS = { again: "Show again", yourTurn: "Your turn", check: "Check", right: "Got it", look: "Look again", myth: "MYTH", busted: "NOT TRUE", order: "Tap them in order" };
export const SceneSchema = z.object({
  archetype: z.literal("scene-explainer@1"), ...EnvelopeExt,
  strings: z.object(Object.fromEntries(Object.keys(SC_STRINGS).map((k) => [k, Text(28)]))),
  title: Text(40), accent: z.enum(ACCENTS), ...TargetsField,
  scenes: z.array(Scene).min(1).max(6),
  text: z.record(z.string(), z.string().max(240)), narration: z.record(z.string(), NarrLine),
  beats: z.array(SBeat).min(2).max(18),
  task: Task,
});
export type SceneSpec = z.infer<typeof SceneSchema>;

// ── the reviewed default (c5-evs-ch01-t01 water: kit-seeded; every value hand-checked)
const scDefault: SceneSpec = {
  archetype: "scene-explainer@1", skills: ["c6-science-ch08-t02"], lang: "en", strings: { ...SC_STRINGS },
  title: "Where does the puddle go?", accent: "sci", targets: "c6-science-ch08-t02-m3",
  scenes: [
    { id: "s1", layout: "row", els: [
      { id: "t", type: "title", text: "Where does the puddle go?" },
      { id: "myth", type: "myth", text: "The water is used up and gone" },
    ] },
    { id: "s2", layout: "cycle", els: [
      { id: "sea", type: "node", text: "Puddle", glyph: "drop", color: "sci" },
      { id: "air", type: "node", text: "Vapour in air", glyph: "wind", color: "ion" },
      { id: "cloud", type: "node", text: "Cloud", glyph: "cloud", color: "ion" },
      { id: "rain", type: "node", text: "Rain", glyph: "rain", color: "sci" },
      { id: "a1", type: "arrow", from: "sea", to: "air", text: "evaporates" },
      { id: "a2", type: "arrow", from: "air", to: "cloud", text: "condenses" },
      { id: "a3", type: "arrow", from: "cloud", to: "rain", text: "falls" },
      { id: "a4", type: "arrow", from: "rain", to: "sea", text: "collects" },
    ] },
  ],
  text: {
    L1: "A puddle on the road is gone by the afternoon. Did the water vanish?",
    L2: "Many people think so. Watch that idea fail.",
    L3: "The Sun warms the surface. The fastest water particles escape into the air as vapour.",
    L4: "Vapour is a gas, and you cannot see it. The water is still there, just spread out in the air.",
    L5: "Higher up the air is colder. Vapour condenses into tiny droplets, and droplets make a cloud.",
    L6: "Droplets join, grow heavy and fall as rain, back into puddles, rivers and the sea.",
    L7: "Same water, round and round. Nothing was used up.",
  },
  narration: {},
  beats: [
    { line: "L1", gap: 0.4, scene: "s1", cues: [{ at: 0, do: "show", target: "t", dur: 1 }] },
    { line: "L2", gap: 0.5, cues: [{ at: 0, do: "hide", target: "t", dur: 0.5 }, { at: 0.3, do: "show", target: "myth", dur: 0.6 }, { at: "s2", do: "bust", target: "myth", dur: 1 }] },
    { line: "L3", gap: 0.4, scene: "s2", cues: [{ at: 0, do: "show", target: "sea", dur: 0.6 }, { at: "s2", do: "show", target: ["a1", "air"], dur: 0.9 }, { at: "s2", do: "flow", target: "a1", to: 1, dur: 0.6 }] },
    { line: "L4", gap: 0.4, cues: [{ at: 0, do: "highlight", target: "air", dur: 1.2 }] },
    { line: "L5", gap: 0.4, cues: [{ at: 0, do: "show", target: ["a2", "cloud"], dur: 0.9 }, { at: 0.4, do: "flow", target: "a2", to: 1, dur: 0.6 }] },
    { line: "L6", gap: 0.4, cues: [{ at: 0, do: "show", target: ["a3", "rain"], dur: 0.9 }, { at: "s2", do: "show", target: "a4", dur: 0.9 }, { at: "s2", do: "flow", target: ["a3", "a4"], to: 1, dur: 0.6 }] },
    { line: "L7", gap: 0, cues: [{ at: 0, do: "camera", zoom: 1.05, dur: 2 }, { at: "end", do: "interactive" }] },
  ],
  task: { kind: "tap", prompt: "Where is the puddle's water right after it disappears?", options: ["sea", "air", "cloud", "rain"], answer: "air", src: "c6-science-ch08-t02-i01" },
};

// ── repair
function xy(e: Record<string, unknown>, r: string[]): { x?: number; y?: number } {
  const out: { x?: number; y?: number } = {};
  if (e.x !== undefined) out.x = num(e.x, 0, 1000, 500, "x", r);
  if (e.y !== undefined) out.y = num(e.y, 0, 625, 330, "y", r);
  return out;
}
const accent = (v: unknown, r: string[]) => (v === undefined ? undefined : oneOf(v, ACCENTS, "ion", "color", r));
function repairEl(e: unknown, r: string[], ids: Set<string>): SceneEl | null {
  if (!isObj(e)) { r.push("el:not-an-object"); return null; }
  const id = idOk(e.id) && !ids.has(e.id) ? e.id : null;
  if (!id) { r.push("el:id"); return null; }
  const type = oneOf(e.type, EL_TYPES, "label", "el.type", r);
  if (e.type !== type) return null;
  const T = (k: string, n: number) => reqStr(e[k], n, `${id}.${k}`, r);
  const opt = (k: string, n: number) => (e[k] === undefined ? {} : (() => { const s = reqStr(e[k], n, `${id}.${k}`, r); return s ? { [k]: s } : {}; })());
  const col = accent(e.color, r), c = col ? { color: col } : {};
  switch (type) {
    case "title": { const t = T("text", 40); return t ? { id, type, text: t } : null; }
    case "label": { const t = T("text", 34); return t ? { id, type, text: t, ...xy(e, r), ...c } : null; }
    case "node": {
      const t = T("text", 16); if (!t) return null;
      const g = e.glyph === undefined ? {} : (GLYPHS as readonly string[]).includes(e.glyph as string) ? { glyph: e.glyph as Glyph } : (r.push("glyph"), {});
      return { id, type, text: t, ...opt("sub", 18), ...g, ...xy(e, r), ...c };
    }
    case "arrow": {
      if (!idOk(e.from) || !idOk(e.to) || e.from === e.to) { r.push("arrow:ends"); return null; }
      return { id, type, from: e.from, to: e.to, ...opt("text", 14), ...(e.bend !== undefined ? { bend: num(e.bend, -1, 1, 0, "bend", r) } : {}) };
    }
    case "axis": {
      const min = typeof e.min === "number" && Number.isFinite(e.min) ? e.min : null, max = typeof e.max === "number" && Number.isFinite(e.max) ? e.max : null;
      if (min === null || max === null || max <= min) { r.push("axis:range"); return null; }
      let step = typeof e.step === "number" && Number.isFinite(e.step) && e.step > 0 ? e.step : (max - min) / 5;
      if ((max - min) / step > 20) { r.push("axis:step"); step = (max - min) / 10; }
      if ((max - min) / step < 1) { r.push("axis:step"); step = max - min; }
      return { id, type, min, max, step, ...opt("unit", 10), scale: oneOf(e.scale, ["linear", "year"] as const, "linear", "scale", r), ...(e.y !== undefined ? { y: num(e.y, 200, 560, 380, "y", r) } : {}) };
    }
    case "mark": {
      if (!idOk(e.axis) || typeof e.value !== "number" || !Number.isFinite(e.value)) { r.push("mark"); return null; }
      return { id, type, axis: e.axis, value: e.value, ...opt("text", 14), ...c };
    }
    case "bar": {
      const parts = num(e.parts, 1, 24, 4, "parts", r, true);
      return { id, type, parts, shaded: num(e.shaded, 0, parts, 0, "shaded", r, true), ...xy(e, r), ...(e.w !== undefined ? { w: num(e.w, 200, 800, 600, "w", r) } : {}), ...opt("text", 14) };
    }
    case "bars": {
      const values = arr(e.values, "values", r).filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e9).slice(0, 8);
      const labels = arr(e.labels, "labels", r).filter((v): v is string => typeof v === "string" && v.length >= 1 && v.length <= 8 && !MARKUP.test(v)).slice(0, 8);
      const n = Math.min(values.length, labels.length);
      if (n < 2) { r.push("bars:n"); return null; }
      return { id, type, values: values.slice(0, n), labels: labels.slice(0, n), ...opt("unit", 10) };
    }
    case "grid": {
      const cols = num(e.cols, 1, 14, 5, "cols", r, true), rows = num(e.rows, 1, 8, 4, "rows", r, true);
      return { id, type, cols, rows, shaded: num(e.shaded, 0, cols * rows, 0, "shaded", r, true), ...xy(e, r) };
    }
    case "angle": return { id, type, deg: num(e.deg, 1, 359, 60, "deg", r), ...(e.rot !== undefined ? { rot: num(e.rot, -180, 180, 0, "rot", r) } : {}), ...xy(e, r), ...(e.r !== undefined ? { r: num(e.r, 60, 220, 150, "r", r) } : {}) };
    case "poly": {
      const pts = arr(e.points, "points", r).filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === "number" && Number.isFinite(v)))
        .map(([a, b]) => [clampN(a, 60, 940), clampN(b, 170, 560)] as [number, number]).slice(0, 8);
      if (pts.length < 2) { r.push("poly:points"); return null; }
      return { id, type, points: pts, closed: typeof e.closed === "boolean" ? e.closed : pts.length > 2, ...xy(e, r) };
    }
    case "counter": {
      if (typeof e.from !== "number" || typeof e.to !== "number" || !Number.isFinite(e.from) || !Number.isFinite(e.to)) { r.push("counter"); return null; }
      return { id, type, from: clampN(e.from, -1e9, 1e9), to: clampN(e.to, -1e9, 1e9), ...opt("unit", 10), decimals: num(e.decimals, 0, 2, 0, "decimals", r, true), ...xy(e, r) };
    }
    case "quote": {
      const t = T("text", 64); if (!t) return null;
      const nW = t.split(/\s+/).length;
      const ix = (k: string) => arr(e[k], k, r).filter((v): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < nW).slice(0, 6) as number[];
      return { id, type, text: t, hi: ix("hi"), hi2: ix("hi2"), ...xy(e, r) };
    }
    case "meter": { const t = T("text", 40); if (!t) return null; if (!/[ऀ-ॿ]/.test(t)) { r.push("meter:not-devanagari"); return null; } return { id, type, text: t, ...xy(e, r) }; }
    case "myth": { const t = T("text", 64); return t ? { id, type, text: t, ...xy(e, r) } : null; }
    case "particles": return { id, type, mode: oneOf(e.mode, PARTICLE_MODES, "gas", "mode", r), n: num(e.n, 10, 160, 60, "n", r, true), ...xy(e, r), ...(e.w !== undefined ? { w: num(e.w, 120, 860, 400, "w", r) } : {}), ...(e.h !== undefined ? { h: num(e.h, 80, 380, 220, "h", r) } : {}), ...c };
    case "glyph": {
      if (!(GLYPHS as readonly string[]).includes(e.name as string)) { r.push("glyph:name"); return null; }
      return { id, type, name: e.name as Glyph, ...xy(e, r), ...(e.size !== undefined ? { size: num(e.size, 80, 260, 160, "size", r) } : {}), ...c };
    }
  }
  return null;
}
function repairScenes(raw: unknown, r: string[]): SceneT[] {
  const out: SceneT[] = [];
  const ids = new Set<string>(), sids = new Set<string>();
  for (const s of arr(raw, "scenes", r).slice(0, 6)) {
    if (!isObj(s) || !idOk(s.id) || sids.has(s.id)) { r.push("scene:id"); continue; }
    const els: SceneEl[] = [];
    for (const e of arr(s.els, "els", r).slice(0, 12)) { const x = repairEl(e, r, ids); if (x) { els.push(x); ids.add(x.id); } }
    if (!els.length) { r.push("scene:empty"); continue; }
    sids.add(s.id);
    out.push({ id: s.id, layout: oneOf(s.layout, LAYOUTS, "row", "layout", r), els });
  }
  // referential integrity: arrows need both ends (nodes/glyphs/labels in the SAME scene); marks need an axis in the scene
  for (const s of out) {
    const here = new Map(s.els.map((e) => [e.id, e]));
    s.els = s.els.filter((e) => {
      if (e.type === "arrow") { const a = here.get(e.from), b = here.get(e.to); const ok = !!a && !!b && ["node", "glyph", "label"].includes(a.type) && ["node", "glyph", "label"].includes(b.type); if (!ok) r.push("arrow:dangling"); return ok; }
      if (e.type === "mark") { const ax = here.get(e.axis); const ok = !!ax && ax.type === "axis" && e.value >= ax.min && e.value <= ax.max; if (!ok) r.push("mark:off-axis"); return ok; }
      return true;
    });
  }
  return out.filter((s) => s.els.length);
}
function repairText(raw: unknown, r: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isObj(raw)) { if (raw !== undefined) r.push("text:not-an-object"); return out; }
  for (const [k, v] of Object.entries(raw).slice(0, 18)) {
    if (!/^[A-Za-z0-9_-]{1,16}$/.test(k)) { r.push("text-key"); continue; }
    if (typeof v === "string" && v.trim() && v.length <= 240 && !MARKUP.test(v)) out[k] = v.trim(); else r.push("text:" + k);
  }
  return out;
}
function repairNarration(raw: unknown, r: string[]): Record<string, NarrationLine> {
  const out: Record<string, NarrationLine> = {};
  if (!isObj(raw)) { if (raw !== undefined) r.push("narration:not-an-object"); return out; }
  for (const [k, v] of Object.entries(raw).slice(0, 18)) {
    const p = NarrLine.safeParse(v);
    if (p.success && /^[A-Za-z0-9_-]{1,16}$/.test(k)) out[k] = p.data as NarrationLine; else r.push("narration:" + k);
  }
  return out;
}
function repairBeatsS(raw: unknown, scenes: SceneT[], text: Record<string, string>, narr: Record<string, NarrationLine>, r: string[]): SBeatT[] {
  const sceneOf = new Map<string, string>();
  for (const s of scenes) for (const e of s.els) sceneOf.set(e.id, s.id);
  const sids = new Set(scenes.map((s) => s.id));
  const out: SBeatT[] = [];
  let cur = scenes[0]?.id;
  for (const b of arr(raw, "beats", r).slice(0, 18)) {
    if (!isObj(b)) { r.push("beat:not-an-object"); continue; }
    const id = typeof b.line === "string" ? b.line : "";
    if (!id || (!text[id] && !narr[id])) { r.push("line:" + id); continue; }
    let scene: string | undefined;
    if (b.scene !== undefined) { if (typeof b.scene === "string" && sids.has(b.scene)) { scene = b.scene; } else r.push("beat:scene"); }
    if (!out.length && !scene) scene = cur;
    if (scene) cur = scene;
    const cues: SBeatT["cues"] = [];
    for (const c of arr(b.cues, "cues", r).slice(0, 16)) {
      if (!isObj(c) || typeof c.do !== "string" || !(SCENE_VERBS as readonly string[]).includes(c.do)) { r.push("verb:" + (isObj(c) ? String(c.do) : "?")); continue; }
      const at = typeof c.at === "number" && Number.isFinite(c.at) ? clampN(c.at, 0, 30) : typeof c.at === "string" && /^(s\d{1,2}|end)$/.test(c.at) ? c.at : 0;
      const clean: Record<string, unknown> = { at, do: c.do };
      if (c.dur !== undefined) clean.dur = num(c.dur, 0, 12, 0.8, "cue.dur", r);
      if (c.do !== "camera" && c.do !== "interactive" && c.do !== "unfocus") {
        const tg = ([] as unknown[]).concat(c.target ?? []).filter((t): t is string => typeof t === "string" && sceneOf.get(t) === cur).slice(0, 8);
        if (!tg.length) { r.push("cue:target"); continue; }
        clean.target = tg.length === 1 ? tg[0] : tg;
      }
      if (c.do === "move") { clean.x = num(c.x, 60, 940, 500, "move.x", r); clean.y = num(c.y, 170, 560, 330, "move.y", r); }
      if (c.do === "scale") clean.to = num(c.to, 0.5, 2, 1, "scale.to", r);
      if (c.do === "flow" || c.do === "count") clean.to = num(c.to, 0, 1, 1, c.do + ".to", r);
      if (c.do === "shade") clean.to = num(c.to, 0, 112, 1, "shade.to", r, true);
      if (c.do === "camera") { clean.zoom = num(c.zoom, 0.8, 1.6, 1, "camera.zoom", r); if (c.x !== undefined) clean.x = num(c.x, 300, 700, 500, "camera.x", r); if (c.y !== undefined) clean.y = num(c.y, 200, 430, 312, "camera.y", r); }
      cues.push(clean as SBeatT["cues"][number]);
    }
    out.push({ line: id, gap: num(b.gap, 0, 3, 0.4, "gap", r), ...(scene ? { scene } : {}), cues });
  }
  // the last beat hands over to the task
  if (out.length && !out.some((b) => b.cues.some((c) => c.do === "interactive"))) { out[out.length - 1].cues.push({ at: "end", do: "interactive" }); r.push("beat:interactive-added"); }
  return out;
}
function repairTask(raw: unknown, scenes: SceneT[], r: string[]): SceneTask | null {
  if (!isObj(raw)) { r.push("task"); return null; }
  const last = scenes[scenes.length - 1];
  const inLast = new Map(last.els.map((e) => [e.id, e]));
  const label = (id: string) => { const e = inLast.get(id) as { text?: string } | undefined; return e?.text ?? ""; };
  const prompt = reqStr(raw.prompt, 90, "task.prompt", r); if (!prompt) return null;
  const s = src(raw.src, r);
  const pickable = (id: unknown): id is string => typeof id === "string" && inLast.has(id) && ["node", "glyph", "label", "mark", "myth"].includes(inLast.get(id)!.type);
  if (raw.kind === "tap") {
    const options = arr(raw.options, "task.options", r).filter(pickable).slice(0, 6);
    if (options.length < 2 || !pickable(raw.answer) || !options.includes(raw.answer)) { r.push("task:answer"); return null; }
    const ans = normText(label(raw.answer));
    if (ans.length >= 3 && normText(prompt).includes(ans)) { r.push("task:prompt-shows-answer"); return null; }   // rj-engine-prompt-shows-target
    return { kind: "tap", prompt, options, answer: raw.answer, ...s };
  }
  if (raw.kind === "order") {
    const items = arr(raw.items, "task.items", r).filter(pickable).slice(0, 6);
    if (items.length < 3 || new Set(items).size !== items.length) { r.push("task:items"); return null; }
    return { kind: "order", prompt, items, ...s };
  }
  if (raw.kind === "place") {
    const ax = typeof raw.axis === "string" ? inLast.get(raw.axis) : undefined;
    if (!ax || ax.type !== "axis" || typeof raw.answer !== "number" || !Number.isFinite(raw.answer) || raw.answer < ax.min || raw.answer > ax.max) { r.push("task:place"); return null; }
    if (prompt.includes(String(raw.answer))) { r.push("task:prompt-shows-answer"); return null; }
    const span = ax.max - ax.min;
    return { kind: "place", prompt, axis: ax.id, answer: raw.answer, tol: num(raw.tol, span / 200, span / 8, span / 40, "task.tol", r), ...s };
  }
  r.push("task:kind"); return null;
}
function repairScene(raw: Record<string, unknown>, r: string[]): SceneSpec | null {
  const env = envelope(raw, scDefault, r);
  const scenes = repairScenes(raw.scenes, r);
  if (!scenes.length) return null;
  const text = repairText(raw.text, r), narration = repairNarration(raw.narration, r);
  const beats = repairBeatsS(raw.beats, scenes, text, narration, r);
  if (beats.length < 2 || beats.length < 0.5 * (Array.isArray(raw.beats) ? raw.beats.length : 1)) { r.push("beats:too-few"); return null; }
  const task = repairTask(raw.task, scenes, r);
  if (!task) return null;
  const used = new Set(beats.map((b) => b.line));
  for (const k of Object.keys(text)) if (!used.has(k)) delete text[k];
  const strs: Record<string, string> = { ...SC_STRINGS };
  if (isObj(raw.strings)) for (const k of Object.keys(SC_STRINGS)) if (k in raw.strings) strs[k] = str(raw.strings[k], 28, strs[k], k, r);
  return {
    archetype: "scene-explainer@1", ...env, strings: strs as SceneSpec["strings"], title: str(raw.title, 40, "Explainer", "title", r), accent: oneOf(raw.accent, ACCENTS, "ion", "accent", r),
    ...targets(raw.targets, r), scenes, text, narration, beats, task,
  };
}
function gradeScene(spec: SceneSpec, itemId: string, value: unknown): import("./common.ts").Graded {
  if (itemId !== "task") return UNGRADED;
  const t = spec.task;
  if (t.kind === "tap") return { verdict: value === t.answer ? "right" : "wrong", truth: t.answer };
  if (t.kind === "order") {
    if (!Array.isArray(value) || value.length !== t.items.length || value.some((v) => typeof v !== "string")) return { verdict: "wrong", truth: t.items, detail: "no-value" };
    if (value.every((v, i) => v === t.items[i])) return { verdict: "right", truth: t.items };
    // one adjacent swap away = partial
    let swaps = 0; const pos = new Map(t.items.map((x, i) => [x, i]));
    const seq = value.map((v) => pos.get(v as string) ?? -1);
    if (seq.includes(-1) || new Set(seq).size !== seq.length) return { verdict: "wrong", truth: t.items };
    for (let i = 0; i < seq.length; i++) for (let j = i + 1; j < seq.length; j++) if (seq[i] > seq[j]) swaps++;
    return { verdict: swaps === 1 ? "partial" : "wrong", truth: t.items, error: swaps };
  }
  const v = typeof value === "number" ? value : isObj(value) && typeof value.value === "number" ? value.value : NaN;
  if (!Number.isFinite(v)) return { verdict: "wrong", truth: t.answer, detail: "no-value" };
  const e = Math.abs(v - t.answer);
  return { verdict: e <= t.tol ? "right" : e <= t.tol * 2.5 ? "partial" : "wrong", truth: t.answer, error: +e.toFixed(3) };
}
function keysScene(spec: SceneSpec) {
  const t = spec.task, last = spec.scenes[spec.scenes.length - 1];
  const lab = (id: string) => { const e = last.els.find((x) => x.id === id) as { text?: string } | undefined; return e?.text ?? id; };
  const key = t.kind === "tap" ? lab(t.answer) : t.kind === "order" ? t.items.map(lab).join(" → ") : String(t.answer);
  return [{ itemId: "task", key, prompt: t.prompt, ...(t.src ? { src: t.src } : {}) }];
}
/** Total narration seconds at 141 wpm (the paced bar QA-A10), for the catalogue's 45-120 s pace lint. */
export function sceneSeconds(spec: SceneSpec): number {
  return spec.beats.reduce((a, b) => a + (spec.narration[b.line]?.dur ?? estimateLine(spec.text[b.line] ?? "").dur) + b.gap, 0.8);
}
export type { BeatT };
export const sceneDef: ExtSpecDef<SceneSpec> = {
  archetype: "scene-explainer@1", title: "Cinematic explainer", kind: "explainer", subjects: ["maths", "science", "evs", "english", "hindi", "sst"],
  act: "watch one idea built and a wrong idea fail on screen, then do it: tap the right part, put steps in order, or place a value on a scale",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths", "science", "evs", "english", "hindi", "sst"], topics: ["c6-science-ch08-t02"], misconceptions: ["c6-science-ch08-t02-m3"] },
  schema: SceneSchema as unknown as z.ZodType<SceneSpec>, defaultSpec: scDefault, repair: repairScene, grade: gradeScene, keys: keysScene,
};
