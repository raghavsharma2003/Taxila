// The Studio archetype library v1 (LIVE-STUDIO §3.3, BUILD-PLAN W2-F #3). An archetype is a pedagogically reviewed
// interaction pattern with a declared test seam, ideal states, gate checks, a params schema, string keys, a skeleton
// id, budgets and anti-patterns; a live build instantiates one (it never designs a mechanic from nothing). The JSON
// files next to this are the archetypes; this module loads them and does the code half of a plan:
//
//   archetype(id) / ARCHETYPES               the library (12 frame archetypes + the whiteboard)
//   validateParams(a, params)                → string[] errors (a small JSON-schema subset, plus each archetype's truth rules)
//   stringKeys(a, params)                    → the strings table's keys for these params ("$data.key" etc. expanded)
//   buildParams(a, params)                   → what the build sees as Studio.params (hostOnly truth removed)
//   minTarget(a, band)                       → the minimum tap target in DESIGN units (44 / 56 CSS px at the phone tray)
//   buildPrompt(a, { params, strings, band, craft, memory }) → { system, user }  (shapes, rules last)
//
// Stage (owner priority 4): every frame archetype is designed at 360 x 320 units, the aspect of the phone tray
// (328 x 290 CSS px at 360 x 800, tests/studio-stage-geometry), so the fitted scale there is ~0.86 and a 44 px target
// is 52 units (56 px for B1-B2 is 66 units). The gate renders the build at exactly the design size: no scrolling in
// either direction, nothing outside it.
import { readFileSync, readdirSync } from "node:fs";

const DIR = new URL("./", import.meta.url);
/** The phone tray the stage must fit (StudioStage at 360 x 800, 8 px inset each side): the binding case for targets. */
export const PHONE_TRAY = Object.freeze({ w: 328 - 16, h: 290 - 16 });
export const STUDIO_KIT = "studio-kit@1";

/** @type {Map<string, any>} */
export const ARCHETYPES = new Map();
for (const f of readdirSync(DIR).filter((n) => n.endsWith(".json")).sort()) {
  const a = JSON.parse(readFileSync(new URL(f, DIR), "utf8"));
  if (!a.id || a.id + ".json" !== f) throw new Error(`archetype file ${f} has id ${a.id}`);
  ARCHETYPES.set(a.id, Object.freeze(a));
}
export const FRAME_ARCHETYPES = [...ARCHETYPES.values()].filter((a) => a.build !== "script").map((a) => a.id);

/** @returns {any} the archetype, or throws (an unknown archetype is a planner bug, never a fallback). */
export function archetype(id) {
  const a = ARCHETYPES.get(id);
  if (!a) throw new Error(`unknown archetype ${id}`);
  return a;
}

/** CSS px per design unit at the phone tray (contain-fit). */
export function phoneScale(a) {
  const s = a.stage ?? { w: 360, h: 320 };
  return Math.min(PHONE_TRAY.w / s.w, PHONE_TRAY.h / s.h);
}
/** Minimum tap target in design units: 44 CSS px, 56 for B1-B2 (LIVE-STUDIO §3.6 G4), at the phone tray scale. */
export function minTarget(a, band = "B3") {
  const px = band === "B1" || band === "B2" ? 56 : 44;
  return Math.ceil(px / phoneScale(a));
}

// ───────────────────────────── params ─────────────────────────────

/** A JSON-schema subset (type, enum, pattern, min/max, minItems/maxItems, maxLength, required, properties, items). */
function check(schema, v, path, errs) {
  if (!schema) return;
  const t = schema.type;
  const typeOk = t === "integer" ? Number.isInteger(v) : t === "number" ? typeof v === "number" && Number.isFinite(v)
    : t === "array" ? Array.isArray(v) : t === "object" ? !!v && typeof v === "object" && !Array.isArray(v) : t ? typeof v === t : true;
  if (!typeOk) { errs.push(`${path}:type`); return; }
  if (schema.enum && !schema.enum.includes(v)) errs.push(`${path}:enum`);
  if (typeof v === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(v)) errs.push(`${path}:pattern`);
    if (schema.maxLength && v.length > schema.maxLength) errs.push(`${path}:maxLength`);
  }
  if (typeof v === "number") {
    if (schema.minimum !== undefined && v < schema.minimum) errs.push(`${path}:minimum`);
    if (schema.maximum !== undefined && v > schema.maximum) errs.push(`${path}:maximum`);
  }
  if (Array.isArray(v)) {
    if (schema.minItems !== undefined && v.length < schema.minItems) errs.push(`${path}:minItems`);
    if (schema.maxItems !== undefined && v.length > schema.maxItems) errs.push(`${path}:maxItems`);
    v.forEach((x, i) => check(schema.items, x, `${path}[${i}]`, errs));
  }
  if (t === "object") {
    for (const k of schema.required ?? []) if (v[k] === undefined) errs.push(`${path}.${k}:required`);
    for (const [k, s] of Object.entries(schema.properties ?? {})) if (v[k] !== undefined) check(s, v[k], `${path}.${k}`, errs);
  }
}

const near = (a, b) => Math.abs(a - b) < 1e-9;
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const unique = (xs) => new Set(xs).size === xs.length;

/** Truth rules beyond the schema (what makes an instance answerable and correct). → string[] */
function truthRules(a, p) {
  const e = [];
  switch (a.id) {
    case "shade_fraction":
      for (const it of p.items) if (!(it.n >= 1 && it.n <= it.d)) e.push(`item ${it.id}: n out of 1..d`);
      if (!unique(p.items.map((i) => i.id))) e.push("item ids repeat");
      break;
    case "bar_chart_read": {
      const vs = p.data.map((d) => d.value), ext = p.question === "most" ? Math.max(...vs) : Math.min(...vs);
      if (vs.filter((v) => v === ext).length !== 1) e.push("the asked extreme is not unique");
      if (!unique(p.data.map((d) => d.key))) e.push("keys repeat");
      break;
    }
    case "hub_flows":
      if (!p.answer || !p.options.includes(p.answer)) e.push("answer not among options");
      if (!unique(p.options)) e.push("options repeat");
      break;
    case "number_line_jump": {
      if (!(p.max > p.min)) e.push("max <= min");
      const n = (p.max - p.min) / p.step;
      if (!near(n, Math.round(n)) || n < 2 || n > 20) e.push("(max-min)/step must be a whole number 2..20");
      const onTick = (v) => v >= p.min - 1e-9 && v <= p.max + 1e-9 && near((v - p.min) / p.step, Math.round((v - p.min) / p.step));
      if (!onTick(p.start)) e.push("start not on a tick");
      for (const it of p.items) { if (!onTick(it.target)) e.push(`item ${it.id}: target not on a tick`); if (near(it.target, p.start)) e.push(`item ${it.id}: target = start`); }
      if (p.format === "fraction" && !p.den) e.push("fraction format needs den");
      break;
    }
    case "balance_scale":
      for (const it of p.items) {
        const miss = sum(it.left) - sum(it.right);
        if (!(miss > 0)) e.push(`item ${it.id}: left must outweigh right`);
        if (it.options.filter((o) => o === miss).length !== 1) e.push(`item ${it.id}: the missing weight must be exactly one option`);
        if (!unique(it.options)) e.push(`item ${it.id}: options repeat`);
      }
      break;
    case "sort_bins":
      if (!p.binOf || p.cards.some((c) => !p.bins.includes(p.binOf[c]))) e.push("every card needs a bin (binOf)");
      if (!unique(p.cards) || !unique(p.bins)) e.push("keys repeat");
      break;
    case "sequence_steps":
      if (!Array.isArray(p.order) || [...p.order].sort().join() !== [...p.shown].sort().join()) e.push("order must be a permutation of shown");
      else if (p.order.join() === p.shown.join()) e.push("shown must not already be in order");
      break;
    case "slider_law": {
      const { min, max, step, start } = p.x;
      const n = (max - min) / step;
      if (!(max > min) || !near(n, Math.round(n)) || n > 30) e.push("x range must be whole steps (<= 30)");
      if (start < min || start > max) e.push("start outside range");
      const y = (x) => p.law.k * x + p.law.b;
      const yMax = Math.max(y(min), y(max)) * p.y.unitsPer;
      if (yMax > 180 || Math.min(y(min), y(max)) < 0) e.push("y * unitsPer must stay in 0..180 units");
      const ans = y(p.ask.x);
      if (p.ask.options.filter((o) => near(o, ans)).length !== 1) e.push("the asked y must be exactly one option");
      break;
    }
    case "process_chain": {
      if (!unique(p.stages)) e.push("stages repeat");
      const i = p.stages.indexOf(p.askAfter);
      if (i < 0 || (!p.cycle && i === p.stages.length - 1)) e.push("askAfter must have a next stage");
      else { const next = p.stages[(i + 1) % p.stages.length]; if (!p.options.includes(next) || !unique(p.options)) e.push("the next stage must be an option"); }
      break;
    }
    case "labelled_parts":
      if (!p.parts.includes(p.ask) || !unique(p.parts)) e.push("ask must be one of the parts");
      break;
    case "pictograph": {
      for (const r of p.rows) { const n = r.value / p.symbolValue; if (!Number.isInteger(n) || n < 1 || n > 8) e.push(`row ${r.key}: value/symbolValue must be 1..8`); }
      const vs = p.rows.map((r) => r.value), ext = p.question === "most" ? Math.max(...vs) : Math.min(...vs);
      if (vs.filter((v) => v === ext).length !== 1) e.push("the asked extreme is not unique");
      break;
    }
    case "timeline": {
      const ys = p.events.map((x) => x.year);
      if (!unique(ys) || !unique(p.events.map((x) => x.key))) e.push("years and keys must be unique");
      break;
    }
  }
  return e;
}

/** Validate an instance against the archetype (schema + truth rules). → string[] (empty = valid) */
export function validateParams(a, params) {
  if (a.build === "script") return [];
  const errs = [];
  check(a.paramsSchema, params, "params", errs);
  if (errs.length) return errs;
  return truthRules(a, params);
}

const get = (o, path) => path.split(".").reduce((v, k) => (v == null ? v : v[k]), o);
/** The strings table keys for an instance: fixed keys plus "$path" expansions (array of objects → .field; array of
 * strings → each; a string → itself; an integer n at "steps" → step1..stepN). */
export function stringKeys(a, params) {
  const out = [];
  for (const k of a.stringsKeys ?? []) {
    if (!k.startsWith("$")) { out.push(k); continue; }
    const [head, field] = k.slice(1).split(".");
    const v = get(params, head);
    if (Array.isArray(v)) for (const x of v) out.push(field ? x?.[field] : x);
    else if (typeof v === "string") out.push(v);
    else if (Number.isInteger(v)) for (let i = 1; i <= v; i++) out.push(`${head.replace(/s$/, "")}${i}`);
  }
  return [...new Set(out.filter((x) => typeof x === "string" && x))];
}

/** Studio.params as the build sees it: hostOnly truth (answers, bin assignments, the true order) removed. */
export function buildParams(a, params) {
  const p = { ...params };
  for (const k of a.hostOnly ?? []) delete p[k];
  return p;
}

// ───────────────────────────── the build prompt (shapes, rules last) ─────────────────────────────

/** The studio-kit@1 contract every build writes against (LIVE-STUDIO D2). Structure, not lines: no example code. */
export function kitApi(a, band) {
  const s = a.stage;
  return [
    "RUNTIME (loaded before your code; the only API besides the DOM):",
    "  Studio.params            this build's truth (read-only JSON). Never hard-code a value from it: the same file must work for other params.",
    "  Studio.t(key)            child-visible words, ONLY through this, ONLY with the keys listed. No other words anywhere (numbers come from params).",
    "  Studio.answer(value)     the child's committed answer; the host grades it. You never decide right or wrong yourself.",
    "  Studio.onVerdict(cb)     cb({correct}) after the host grades: feedback from this; advance only on correct.",
    "  Studio.event(name, data) small interaction telemetry ({} of numbers / short words).",
    "  Studio.ready()           once, when the first screen is interactive.  Studio.done()  once, when the activity is complete.",
    "OUTPUT: one HTML body fragment, in this ORDER so it paints while streaming:",
    "  1) one <style> (all CSS)  2) the complete static markup of the first screen (inline SVG for pictures)  3) ONE <script> at the end.",
    "  No <html>/<head>/<body>, no markdown fences, no comments outside code, no explanations.",
    `STAGE: the fragment fills a fixed box of exactly ${s.w} x ${s.h} CSS px (the body is that size). Nothing may scroll in either direction or sit outside it.`,
    `  Every tappable thing is at least ${minTarget(a, band)} x ${minTarget(a, band)} px and fully inside the box.`,
    "SANDBOX: no network of any kind (no CDN, fonts, images by URL, fetch, XHR, WebSocket), no eval/Function, no storage, no alert/confirm,",
    "  no external libraries; inline SVG/CSS/JS only. Event handlers via addEventListener (inline on*= attributes are blocked by the CSP).",
    "QUALITY BAR: shown to a child by a warm human teacher who is talking while it appears. Crafted: a coherent palette, rounded friendly",
    "  shapes, smooth CSS/SVG transitions, satisfying tap feedback (scale / pulse), gentle motion. No points, coins, scores, streaks or timers.",
  ].join("\n");
}

/** Craft direction (the planner's one line) → a shape for the prompt. */
function craftLine(craft) {
  if (!craft) return "";
  const parts = [`mood ${craft.mood ?? "warm"}`, `motion ${craft.motion ?? "calm"}`];
  if (craft.interest) parts.push(`a light ${craft.interest} theme in the decoration only (never in the words or the numbers)`);
  return `CRAFT: ${parts.join("; ")}.`;
}

/**
 * The builder prompt: role → kit API → archetype (brief, seam, states, strings keys, params) → craft → output → negative
 * memory → binding rules LAST (position is mechanism).
 * @param {any} a archetype
 * @param {{ params: object, band?: string, craft?: object, memory?: string[], strings?: Record<string,string> }} o
 */
export function buildPrompt(a, { params, band = "B3", craft, memory = [] }) {
  const keys = stringKeys(a, params);
  const system = [
    "You build one self-contained interactive learning artifact for an Indian child (classes 4-7), rendered live in a sandboxed frame while their teacher talks.",
    kitApi(a, band),
    "RULES (binding, last): words only via Studio.t with the listed keys; numbers only from Studio.params (or values you compute from them); never grade; keep every test-seam attribute exactly as specified and current; output only the fragment.",
  ].join("\n");
  const user = [
    ...a.brief,
    `TEST SEAM (required, exact):\n${a.seam.map((s) => `  - ${s}`).join("\n")}`,
    `STRINGS keys: ${keys.join(", ")} (values arrive at runtime through Studio.t; do not type them yourself).`,
    `Studio.params = ${JSON.stringify(buildParams(a, params))}`,
    craftLine(craft),
    ...(a.antiPatterns?.length || memory.length ? [`AVOID (failures seen before):\n${[...(a.antiPatterns ?? []), ...memory].map((m) => `  - ${m}`).join("\n")}`] : []),
    "Return the fragment now.",
  ].filter(Boolean).join("\n\n");
  return { system, user };
}
