// scene@1 — Taxila's T2 scene DSL: reference implementation for genui-reliability.md (2026-10-02).
// Single source of truth: the zod schema below. `node genui-scene-dsl.mjs --emit` writes the JSON Schema
// (genui-scene-dsl.schema.json) and the strict wire schema used for Azure structured outputs.
// Contents: schema · expression language (EXPR@1) · layout pass · lint (S1–S7) · goal solver · autofix ·
// T2a template expanders. No eval, no Function, no DOM: the same file runs in the server validator and,
// bundled, in the sandboxed frame runtime.
import { z } from "zod";

// ───────────────────────────── limits and band tokens ─────────────────────────────
export const LIMITS = { nodes: 80, instances: 100, vars: 8, derive: 8, timelines: 4, steps: 60, goals: 5, traps: 4,
  str: 80, expr: 160, timelineMs: 30000, options: 4, orderItems: 6, polyPts: 64 };
// dp per logical unit: stage is 1000 units wide; worst case = 300 dp of usable module width (360-dp phone, gutters,
// letterboxing). kids-ux-ages §4.1 supplies hit/type/choices; words-on-stage are [I] until measured.
export const DPU = 0.30;
export const BANDS = {
  B1: { hit: 64, tile: 112, gap: 16, choices: 2, words: 8, keypad: false, type: { label: [20, 22], caption: [22, 24], title: [28, 30], numeral: [34, 36] } },
  B2: { hit: 64, tile: 96, gap: 16, choices: 3, words: 20, keypad: false, type: { label: [18, 20], caption: [20, 22], title: [26, 28], numeral: [32, 34] } },
  B3: { hit: 48, tile: 64, gap: 8, choices: 4, words: 40, keypad: true, type: { label: [16, 18], caption: [18, 20], title: [24, 26], numeral: [30, 32] } },
  B4: { hit: 48, tile: 64, gap: 8, choices: 4, words: 60, keypad: true, type: { label: [15, 17], caption: [16, 18], title: [22, 24], numeral: [28, 30] } },
};
export const STAGES = { "4:3": 750, "1:1": 1000, "3:4": 1333 };
// Theme tokens (light). Text/UI tokens from kids-ux-ages §4.3; diagram tokens are a separate categorical set
// (tints for fills that carry ink text, darks for strokes). `turn` marigold is deliberately absent.
export const COLORS = {
  none: null, bg: "#FFF8EE", surface: "#FFFFFF", ink: "#1F1A14", ink2: "#5A5148", line: "#8C8478", done: "#1F7A4D",
  c1: "#FAD4C0", c2: "#CDE7B0", c3: "#BFDDF5", c4: "#F7E3A1", c5: "#E2CCF2", c6: "#E4DED3",
  c1d: "#B4532A", c2d: "#3F7A1E", c3d: "#1F5F99", c4d: "#8A6A00", c5d: "#6B3FA0", c6d: "#5A5148",
  water: "#7FB8E6", leaf: "#6DB35A", soil: "#A47551", sun: "#F5C542", sky: "#CFE8FA", fire: "#E8743B",
  ice: "#E3F4FB", metal: "#9AA3AF", wood: "#B98A5E",
};
// Sprite library (bench subset). Production: a manifest of flat, bland, verified sprites with {en,hi} alt text,
// semantic tags and a licence field; ids are stable and versioned (`obj.mango` → obj.mango@3 resolved server-side).
export const SPRITES = ("obj.mango obj.apple obj.banana obj.seed obj.roti obj.plate obj.matchstick obj.bundle10 obj.coin1 obj.note10 " +
  "obj.ball obj.bat obj.bus obj.book obj.pencil obj.basket obj.box obj.cup obj.bucket obj.pot obj.glass obj.spoon obj.ice_cube obj.ruler " +
  "animal.fish animal.frog animal.cow animal.camel animal.crow animal.duck animal.goat animal.snake animal.lizard animal.tiger " +
  "animal.whale animal.crab animal.dog animal.cat animal.hen animal.elephant animal.turtle animal.octopus animal.parrot animal.butterfly " +
  "plant.flower plant.tree plant.cactus plant.lotus plant.grass plant.seedling plant.leaf plant.root plant.sprout " +
  "flower.petal flower.sepal flower.stamen flower.pistil flower.stem " +
  "sky.sun sky.moon sky.cloud sky.star sky.rain sci.water_drop sci.bulb sci.battery sci.magnet sci.thermometer sci.beaker sci.candle " +
  "sci.pole sci.stick sci.soil_tray sci.cotton sci.puddle place.house place.school place.well place.river place.hill place.pond " +
  "people.child people.farmer people.shopkeeper shape.square shape.triangle shape.circle").split(" ");

// ───────────────────────────── schema ─────────────────────────────
const ID = z.string().regex(/^[a-z][a-z0-9_]{0,23}$/);
const S = z.string().min(1).max(LIMITS.str).regex(/^[^<>]*$/);          // no markup, ever
const L10n = z.strictObject({ en: S, hi: S, hi_latn: S.optional() });   // hi_latn = Hinglish in Roman script
const Expr = z.strictObject({ $: z.string().min(1).max(LIMITS.expr) });
const Num = z.union([z.number().finite(), Expr]);
const Bool = z.union([z.boolean(), Expr]);
const Color = z.enum(Object.keys(COLORS));
const Misc = z.string().regex(/^MC\.[A-Z0-9_.]{2,60}$/);
const Lib = z.string().regex(/^[a-z]+\.[a-z0-9_]{1,30}$/);
const Pt = z.tuple([z.number().finite(), z.number().finite()]);
const TextVal = z.union([L10n, z.strictObject({ fmt: L10n })]);         // fmt: "{shadow} m" interpolates vars/derives
const Layout = z.strictObject({
  type: z.enum(["row", "column", "grid", "circle", "free", "scatter"]),
  gap: z.number().min(0).max(400).optional(), cols: z.number().int().min(1).max(10).optional(),
  r: z.number().min(10).max(600).optional(), seed: z.number().int().min(0).max(1e6).optional(),
  w: z.number().min(10).max(1000).optional(), h: z.number().min(10).max(1333).optional(),
});
const Drag = z.strictObject({
  axis: z.enum(["xy", "x", "y"]), snap: z.enum(["zone", "grid", "none"]), grid: z.number().min(5).max(200).optional(),
  back: z.boolean(),                     // return to start if dropped outside an accepting zone
  in: ID.optional(),                     // initial zone (default: outside every zone)
});
const Tap = z.strictObject({ act: z.enum(["select", "toggle", "set", "say"]), var: ID.optional(),
  value: z.union([z.number(), z.string().max(24), z.boolean()]).optional() });
const Base = {
  id: ID, parent: ID.optional(), x: Num.optional(), y: Num.optional(), rot: Num.optional(), scale: Num.optional(), op: Num.optional(),
  fill: Color.optional(), stroke: Color.optional(), sw: z.number().min(0).max(24).optional(), dash: z.boolean().optional(),
  show: Bool.optional(), z: z.number().int().min(-10).max(10).optional(),
  role: z.enum(["content", "control", "label", "feedback", "context"]).optional(),
  tags: z.array(ID).max(4).optional(), tl: z.string().min(1).max(32).optional(), say: L10n.optional(),
  drag: Drag.optional(), tap: Tap.optional(),
};
const Size = z.enum(["label", "caption", "title", "numeral"]);
const Option = z.strictObject({ id: ID, label: L10n.optional(), sprite: Lib.optional(), tex: z.string().max(60).optional(), misc: Misc.optional() });
const RepeatItem = z.strictObject({ kind: z.enum(["circle", "rect", "sprite"]), w: z.number().min(4).max(400).optional(),
  h: z.number().min(4).max(400).optional(), r: z.number().min(2).max(200).optional(), lib: Lib.optional(), fill: Color.optional(),
  stroke: Color.optional(), tags: z.array(ID).max(4).optional(), drag: Drag.optional(), say: L10n.optional(), tl: z.string().max(32).optional() });
const k = (name, extra) => z.strictObject({ kind: z.literal(name), ...Base, ...extra });
export const Node = z.discriminatedUnion("kind", [
  k("rect", { w: Num, h: Num, r: z.number().min(0).max(200).optional() }),
  k("circle", { r: Num }),
  k("ellipse", { rx: Num, ry: Num }),
  k("wedge", { r: Num, a0: Num, a1: Num, r0: z.number().min(0).max(600).optional() }),
  k("line", { pts: z.array(Pt).min(2).max(2), head: z.enum(["none", "end", "both"]).optional() }),
  k("poly", { pts: z.array(Pt).min(3).max(LIMITS.polyPts), closed: z.boolean() }),
  k("text", { text: TextVal, size: Size, w: z.number().min(40).max(1000).optional(), align: z.enum(["start", "middle", "end"]).optional(), bold: z.boolean().optional() }),
  k("math", { tex: z.string().min(1).max(120).regex(/^[^<>]*$/), size: Size }),
  k("sprite", { lib: Lib, w: Num, h: Num, flip: z.boolean().optional() }),
  k("image", { asset: z.string().regex(/^ast_[a-z0-9]{8,32}$/), w: Num, h: Num }),
  k("group", { layout: Layout.optional() }),
  k("repeat", { count: Num, item: RepeatItem, layout: Layout }),
  k("axis", { from: z.number(), to: z.number(), step: z.number().positive(), every: z.number().int().min(1).max(20).optional(),
    len: z.number().min(100).max(1000), orient: z.enum(["h", "v"]) }),
  k("connector", { from: ID, to: ID, head: z.enum(["none", "end"]), label: L10n.optional() }),
  k("zone", { w: z.number().min(40).max(1000), h: z.number().min(40).max(1333), shape: z.enum(["rect", "circle"]),
    accepts: z.array(ID).min(1).max(8), cap: z.number().int().min(1).max(100).optional(), label: L10n.optional(),
    visible: z.boolean(), arrange: z.enum(["stack", "grid", "free"]) }),
  k("slider", { var: ID, len: z.number().min(200).max(1000), orient: z.enum(["h", "v"]), value: z.boolean() }),
  k("stepper", { var: ID }),
  k("toggle", { var: ID, label: L10n }),
  k("choice", { var: ID, options: z.array(Option).min(2).max(LIMITS.options), layout: z.enum(["row", "column", "grid"]), commit: z.boolean() }),
  k("button", { label: L10n, act: z.enum(["check", "reset", "play", "next"]), timeline: ID.optional() }),
  k("order", { items: z.array(z.strictObject({ id: ID, label: L10n.optional(), sprite: Lib.optional() })).min(2).max(LIMITS.orderItems),
    orient: z.enum(["row", "column"]), start: z.array(ID).optional() }),
  k("keypad", { var: ID, digits: z.number().int().min(1).max(4) }),
]);
const Var = z.strictObject({ id: ID, type: z.enum(["num", "int", "bool", "enum"]), init: z.union([z.number(), z.boolean(), z.string().max(24)]),
  min: z.number().optional(), max: z.number().optional(), step: z.number().positive().optional(), options: z.array(ID).max(8).optional(),
  tl: z.string().min(1).max(32), unit: z.string().max(8).optional() });
const Derive = z.strictObject({ id: ID, expr: z.string().min(1).max(LIMITS.expr), tl: z.string().min(1).max(32),
  unit: z.string().max(8).optional(), dp: z.number().int().min(0).max(3).optional() });
const Step = z.strictObject({ t: z.number().min(0).max(LIMITS.timelineMs), ms: z.number().min(0).max(5000),
  do: z.enum(["tween", "show", "hide", "pulse", "set", "cue", "trace", "count"]), target: ID.optional(),
  prop: z.enum(["x", "y", "rot", "scale", "op", "w", "h", "r"]).optional(), to: z.number().optional(), var: ID.optional(),
  value: z.union([z.number(), z.boolean(), z.string().max(24)]).optional(), cue: ID.optional(), ease: z.enum(["linear", "inout", "out"]).optional() });
const Timeline = z.strictObject({ id: ID, on: z.enum(["mount", "host", "button", "commit", "goal"]), ref: ID.optional(), steps: z.array(Step).min(1).max(40) });
const Goal = z.strictObject({ id: ID, when: z.string().min(1).max(LIMITS.expr), tl: z.string().min(1).max(48) });
const Probe = z.strictObject({
  id: ID, kind: z.enum(["predict", "diagnose", "classify", "sequence", "estimate", "construct"]), ask: L10n,
  commit: z.strictObject({ via: z.enum(["choice", "check", "order", "voice"]), node: ID.optional() }),
  correct: z.string().min(1).max(LIMITS.expr), traps: z.array(z.strictObject({ when: z.string().min(1).max(LIMITS.expr), misc: Misc })).max(LIMITS.traps),
  reveal: ID.optional(),
});
export const Scene = z.strictObject({
  dsl: z.literal("scene@1"),
  meta: z.strictObject({ band: z.enum(["B1", "B2", "B3", "B4"]), lang: z.enum(["en", "hi", "hi-Latn+en"]), title: L10n,
    objective_ids: z.array(z.string().max(64)).max(4), topic_ids: z.array(z.string().max(64)).max(4), template: z.string().max(40).optional() }),
  stage: z.strictObject({ aspect: z.enum(["4:3", "1:1", "3:4"]), bg: z.enum(["bg", "surface", "sky", "none"]) }),
  vars: z.array(Var).max(LIMITS.vars), derive: z.array(Derive).max(LIMITS.derive),
  nodes: z.array(Node).min(1).max(LIMITS.nodes),
  timelines: z.array(Timeline).max(LIMITS.timelines), goals: z.array(Goal).max(LIMITS.goals),
  probe: Probe.optional(), feedback: z.enum(["on_commit", "on_drop", "none"]),
});

// ───────────────────────────── EXPR@1: a tiny, total expression language ─────────────────────────────
// Grammar (Pratt): ternary > || > && > comparison > + - > * / % > unary ! - > ^ > call | ident | number | 'string' | (expr)
const FUNCS = {
  min: Math.min, max: Math.max, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, sqrt: (x) => Math.sqrt(Math.max(0, x)),
  round: (x, d = 0) => { const f = 10 ** d; return Math.round(x * f) / f; },
  sind: (d) => Math.sin((d * Math.PI) / 180), cosd: (d) => Math.cos((d * Math.PI) / 180), tand: (d) => Math.tan((d * Math.PI) / 180),
  atand: (x) => (Math.atan(x) * 180) / Math.PI, clamp: (x, a, b) => Math.min(b, Math.max(a, x)), lerp: (a, b, t) => a + (b - a) * t,
  // state functions are bound at evaluation time: count(zone[, tag]) · has(zone, node) · at(node) · order(list)
};
const STATE_FUNCS = new Set(["count", "has", "at", "order"]);
const EPS = 1e-9;
export const DSL_VERSION = "scene@1 validator v1.3";
function lex(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) { const m = src.slice(i).match(/^\d*\.?\d+(e[-+]?\d+)?/i); if (!m) throw new Error(`bad number at ${i}`); out.push({ t: "num", v: +m[0] }); i += m[0].length; continue; }
    if (/[A-Za-z_]/.test(c)) { const m = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/); out.push({ t: "id", v: m[0] }); i += m[0].length; continue; }
    if (c === "'" || c === '"') { const j = src.indexOf(c, i + 1); if (j < 0) throw new Error("unterminated string"); out.push({ t: "str", v: src.slice(i + 1, j) }); i = j + 1; continue; }
    const two = src.slice(i, i + 2);
    if (["==", "!=", "<=", ">=", "&&", "||"].includes(two)) { out.push({ t: "op", v: two }); i += 2; continue; }
    if ("+-*/%^<>!?:(),".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
    throw new Error(`unexpected '${c}' at ${i}`);
  }
  return out;
}
export function parseExpr(src) {
  if (src.length > LIMITS.expr) throw new Error("expression too long");
  const toks = lex(src); let p = 0, depth = 0;
  const peek = () => toks[p], eat = (v) => { const t = toks[p]; if (!t || (v && t.v !== v)) throw new Error(`expected ${v ?? "token"}`); p++; return t; };
  const BIN = [["||"], ["&&"], ["==", "!=", "<", "<=", ">", ">="], ["+", "-"], ["*", "/", "%"]];
  function prim() {
    if (++depth > 24) throw new Error("expression too deep");
    const t = eat();
    let node;
    if (t.t === "num") node = { k: "num", v: t.v };
    else if (t.t === "str") node = { k: "str", v: t.v };
    else if (t.t === "id") {
      if (peek()?.v === "(") { eat("("); const args = []; if (peek()?.v !== ")") { do { args.push(ternary()); } while (peek()?.v === "," && eat(",")); } eat(")");
        if (!(t.v in FUNCS) && !STATE_FUNCS.has(t.v)) throw new Error(`unknown function ${t.v}`); node = { k: "call", f: t.v, args }; }
      else if (t.v === "true" || t.v === "false") node = { k: "bool", v: t.v === "true" };
      else if (t.v === "PI") node = { k: "num", v: Math.PI };
      else node = { k: "id", v: t.v };
    } else if (t.v === "(") { node = ternary(); eat(")"); }
    else if (t.v === "-" || t.v === "!") node = { k: "un", op: t.v, a: unaryPow() };
    else throw new Error(`unexpected ${t.v}`);
    depth--; return node;
  }
  function unaryPow() { const a = prim(); if (peek()?.v === "^") { eat("^"); return { k: "bin", op: "^", a, b: unaryPow() }; } return a; }
  function level(n) { if (n >= BIN.length) return unaryPow(); let a = level(n + 1); while (peek() && BIN[n].includes(peek().v)) { const op = eat().v; a = { k: "bin", op, a, b: level(n + 1) }; } return a; }
  function ternary() { const c = level(0); if (peek()?.v === "?") { eat("?"); const a = ternary(); eat(":"); return { k: "tern", c, a, b: ternary() }; } return c; }
  const ast = ternary(); if (p !== toks.length) throw new Error(`trailing '${toks[p].v}'`); return ast;
}
export function identsOf(ast, acc = new Set()) {
  if (!ast) return acc;
  if (ast.k === "id") acc.add(ast.v);
  if (ast.k === "call") { const args = STATE_FUNCS.has(ast.f) ? ast.args.filter((a) => a.k !== "id") : ast.args; args.forEach((a) => identsOf(a, acc)); }
  for (const key of ["a", "b", "c"]) if (ast[key]) identsOf(ast[key], acc);
  return acc;
}
export function evalExpr(ast, env) {
  switch (ast.k) {
    case "num": case "str": case "bool": return ast.v;
    case "id": if (!(ast.v in env.vals)) throw new Error(`unknown name ${ast.v}`); return env.vals[ast.v];
    case "un": { const a = evalExpr(ast.a, env); return ast.op === "-" ? -a : !a; }
    case "tern": return evalExpr(ast.c, env) ? evalExpr(ast.a, env) : evalExpr(ast.b, env);
    case "call": {
      if (STATE_FUNCS.has(ast.f)) { const raw = ast.args.map((a) => (a.k === "id" || a.k === "str" ? a.v : evalExpr(a, env))); return env.state[ast.f](...raw); }
      const v = FUNCS[ast.f](...ast.args.map((a) => evalExpr(a, env))); if (typeof v === "number" && !Number.isFinite(v)) throw new Error(`${ast.f} not finite`); return v;
    }
    case "bin": {
      const a = evalExpr(ast.a, env); if (ast.op === "&&") return a && evalExpr(ast.b, env); if (ast.op === "||") return a || evalExpr(ast.b, env);
      const b = evalExpr(ast.b, env);
      switch (ast.op) { case "+": return a + b; case "-": return a - b; case "*": return a * b; case "/": if (b === 0) throw new Error("division by zero"); return a / b;
        case "%": return a % b; case "^": return a ** b; case "==": return typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-9 : a === b;
        case "!=": return !(typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-9 : a === b);
        // v1.1: tolerant ordering (bench 2026-10-02: 2/tand(45) = 2.0000000000000004 made 'shadow > 2' true at mount)
        case "<": return typeof a === "number" ? a < b - EPS : a < b; case "<=": return typeof a === "number" ? a <= b + EPS : a <= b;
        case ">": return typeof a === "number" ? a > b + EPS : a > b; case ">=": return typeof a === "number" ? a >= b - EPS : a >= b; }
    }
  }
  throw new Error("bad ast");
}

// ───────────────────────────── layout pass ─────────────────────────────
const isDevanagari = (s) => /[ऀ-ॿ]/.test(s);
const visibleChars = (s) => [...s].filter((ch) => !/[ऀ-ःऺ-ॏ॑-ॗॢॣ]/.test(ch)).length;
export function textSize(size, band, deva) { return BANDS[band].type[size][deva ? 1 : 0] / DPU; }  // units
export function textBox(str, size, band, wrapW) {
  const deva = isDevanagari(str); const em = textSize(size, band, deva); const adv = em * (deva ? 0.62 : 0.55);
  const full = visibleChars(str) * adv; const lh = em * (deva ? 1.6 : 1.35);
  if (!wrapW || full <= wrapW) return { w: full, h: lh, lines: 1 };
  const lines = Math.ceil(full / (wrapW * 0.92)); return { w: wrapW, h: lines * lh, lines };
}
const num = (v, env, dflt = 0) => (v === undefined ? dflt : typeof v === "number" ? v : Number(evalExpr(parseExpr(v.$), env)));
function displayText(n, scene) {
  const t = n.text.fmt ?? n.text; const lang = scene.meta.lang;
  return lang === "en" ? t.en : lang === "hi" ? t.hi : (t.hi_latn ?? t.en);
}
export function measure(n, scene, env, band) {
  const B = BANDS[band];
  switch (n.kind) {
    case "rect": case "sprite": case "image": return { w: num(n.w, env), h: num(n.h, env) };
    case "circle": case "wedge": { const r = num(n.r, env); return { w: 2 * r, h: 2 * r }; }
    case "ellipse": return { w: 2 * num(n.rx, env), h: 2 * num(n.ry, env) };
    case "zone": return { w: n.w, h: n.h };
    case "text": return textBox(displayText(n, scene).replace(/\{[a-z0-9_]+\}/g, "0000"), n.size, band, n.w);
    case "math": return { w: n.tex.length * textSize(n.size, band) * 0.45, h: textSize(n.size, band) * 1.4 };
    case "axis": return n.orient === "h" ? { w: n.len, h: 90 } : { w: 90, h: n.len };
    case "slider": { const t = B.hit / DPU; return n.orient === "h" ? { w: n.len, h: t } : { w: t, h: n.len }; }
    case "stepper": { const t = B.hit / DPU; return { w: 3 * t, h: t }; }
    case "toggle": { const t = B.hit / DPU; return { w: 2 * t, h: t }; }
    case "button": { const t = B.hit / DPU; const tb = textBox(n.label.en, "label", band); return { w: Math.max(t * 1.5, tb.w + 60), h: t }; }
    case "keypad": { const t = B.hit / DPU; return { w: 3 * t + 2 * 20, h: 4 * t + 3 * 20 }; }
    case "choice": {
      const t = B.tile / DPU; const g = B.gap / DPU; const nI = n.options.length;
      const cols = n.layout === "grid" ? 2 : n.layout === "row" ? nI : 1; const rows = Math.ceil(nI / cols);
      return { w: cols * t + (cols - 1) * g, h: rows * t + (rows - 1) * g };
    }
    case "order": { // cards: column = wide strips one hit-height tall; row = square tiles
      const g = B.gap / DPU; const nI = n.items.length; const hh = B.hit / DPU;
      return n.orient === "column" ? { w: 760, h: nI * hh + (nI - 1) * g } : { w: nI * (B.tile / DPU) + (nI - 1) * g, h: B.tile / DPU };
    }
    default: return { w: 0, h: 0 };
  }
}
/** Absolute boxes (centre-anchored) for every node, plus instance boxes for repeats. */
export function layout(scene, env) {
  const band = scene.meta.band; const W = 1000, H = STAGES[scene.stage.aspect];
  const byId = new Map(scene.nodes.map((n) => [n.id, n])); const kids = new Map();
  for (const n of scene.nodes) { const p = n.parent ?? "root"; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n); }
  const boxes = new Map(); const instances = [];
  function place(n, cx, cy) {
    if (n.kind === "group") {
      const ch = kids.get(n.id) ?? []; const L = n.layout ?? { type: "free" }; const gap = L.gap ?? 20;
      const sizes = ch.map((c) => (c.kind === "group" || c.kind === "repeat" ? groupSize(c) : measure(c, scene, env, band)));
      positions(L, sizes, gap).forEach((pt, i) => { const c = ch[i]; const fx = L.type === "free" ? num(c.x, env) : 0, fy = L.type === "free" ? num(c.y, env) : 0; place(c, cx + pt[0] + fx, cy + pt[1] + fy); });
      const u = union([...ch.map((c) => boxes.get(c.id))].filter(Boolean)); boxes.set(n.id, u ?? { x: cx, y: cy, w: 0, h: 0 }); return;
    }
    if (n.kind === "repeat") {
      const count = Math.round(num(n.count, env)); const s = repeatItemSize(n.item); const sizes = Array.from({ length: Math.max(0, count) }, () => s);
      const pts = positions(n.layout, sizes, n.layout.gap ?? 12);
      pts.forEach((pt, i) => { const b = { x: cx + pt[0], y: cy + pt[1], w: s.w, h: s.h }; instances.push({ id: `${n.id}_${i}`, of: n.id, item: n.item, box: b }); });
      boxes.set(n.id, union(instances.filter((q) => q.of === n.id).map((q) => q.box)) ?? { x: cx, y: cy, w: 0, h: 0 }); return;
    }
    if (n.kind === "line" || n.kind === "poly") {
      const xs = n.pts.map((q) => q[0] + cx), ys = n.pts.map((q) => q[1] + cy); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      boxes.set(n.id, { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }); return;
    }
    if (n.kind === "connector") return;
    const m = measure(n, scene, env, band); const sc = num(n.scale, env, 1); boxes.set(n.id, { x: cx, y: cy, w: m.w * sc, h: m.h * sc });
  }
  function repeatItemSize(it) { return it.kind === "circle" ? { w: 2 * (it.r ?? 20), h: 2 * (it.r ?? 20) } : { w: it.w ?? 60, h: it.h ?? 60 }; }
  function groupSize(g) {
    if (g.kind === "repeat") { const c = Math.round(num(g.count, env)); const s = repeatItemSize(g.item); return union(positions(g.layout, Array(Math.max(0, c)).fill(s), g.layout.gap ?? 12).map((p) => ({ x: p[0], y: p[1], w: s.w, h: s.h }))) ?? { w: 0, h: 0 }; }
    const ch = kids.get(g.id) ?? []; const L = g.layout ?? { type: "free" };
    const sizes = ch.map((c) => (c.kind === "group" || c.kind === "repeat" ? groupSize(c) : measure(c, scene, env, band)));
    const pts = positions(L, sizes, L.gap ?? 20);
    return union(pts.map((p, i) => ({ x: p[0] + (L.type === "free" ? num(ch[i].x, env) : 0), y: p[1] + (L.type === "free" ? num(ch[i].y, env) : 0), w: sizes[i].w, h: sizes[i].h }))) ?? { w: 0, h: 0 };
  }
  for (const n of kids.get("root") ?? []) { const lp = n.kind === "line" || n.kind === "poly"; place(n, num(n.x, env, lp ? 0 : W / 2), num(n.y, env, lp ? 0 : H / 2)); }
  return { boxes, instances, W, H, byId, kids };
}
function positions(L, sizes, gap) {
  const n = sizes.length; if (!n) return [];
  if (L.type === "row" || L.type === "column") {
    const main = L.type === "row" ? "w" : "h"; const total = sizes.reduce((a, s) => a + s[main], 0) + gap * (n - 1); let cur = -total / 2;
    return sizes.map((s) => { const c = cur + s[main] / 2; cur += s[main] + gap; return L.type === "row" ? [c, 0] : [0, c]; });
  }
  if (L.type === "grid") {
    const cols = L.cols ?? Math.ceil(Math.sqrt(n)); const rows = Math.ceil(n / cols); const cw = Math.max(...sizes.map((s) => s.w)), chh = Math.max(...sizes.map((s) => s.h));
    return sizes.map((_, i) => [((i % cols) - (cols - 1) / 2) * (cw + gap), (Math.floor(i / cols) - (rows - 1) / 2) * (chh + gap)]);
  }
  if (L.type === "circle") { const r = L.r ?? 200; return sizes.map((_, i) => [r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2), r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)]); }
  if (L.type === "scatter") { // seeded, rejection-sampled inside w×h without overlap where possible
    let s = (L.seed ?? 7) >>> 0; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); const w = L.w ?? 600, h = L.h ?? 300; const out = [];
    for (const sz of sizes) { let best = null; for (let t = 0; t < 60; t++) { const p = [(rnd() - 0.5) * (w - sz.w), (rnd() - 0.5) * (h - sz.h)];
      if (out.every((q, j) => Math.abs(q[0] - p[0]) > (sz.w + sizes[j].w) / 2 + 4 || Math.abs(q[1] - p[1]) > (sz.h + sizes[j].h) / 2 + 4)) { best = p; break; } best ??= p; } out.push(best); }
    return out;
  }
  return sizes.map(() => [0, 0]); // free
}
function union(bs) { if (!bs.length) return null; const x0 = Math.min(...bs.map((b) => b.x - b.w / 2)), x1 = Math.max(...bs.map((b) => b.x + b.w / 2)), y0 = Math.min(...bs.map((b) => b.y - b.h / 2)), y1 = Math.max(...bs.map((b) => b.y + b.h / 2)); return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }; }
const overlap = (a, b, pad = 0) => Math.abs(a.x - b.x) * 2 < a.w + b.w - pad && Math.abs(a.y - b.y) * 2 < a.h + b.h - pad;
const inside = (a, b) => Math.abs(a.x - b.x) * 2 <= b.w - a.w + 1 && Math.abs(a.y - b.y) * 2 <= b.h - a.h + 1;

// ───────────────────────────── contrast (WCAG 2) ─────────────────────────────
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// ───────────────────────────── state model and solver ─────────────────────────────
/** Draggable classes: interchangeable draggables (same repeat) collapse to one class with a count. */
function draggables(scene, L) {
  const out = [];
  for (const n of scene.nodes) if (n.drag && n.kind !== "repeat") out.push({ cls: n.id, ids: [n.id], tags: new Set([n.id, ...(n.tags ?? [])]), start: n.drag.in ?? null });
  for (const n of scene.nodes) if (n.kind === "repeat" && n.item.drag) { const ids = L.instances.filter((q) => q.of === n.id).map((q) => q.id); if (ids.length) out.push({ cls: n.id, ids, tags: new Set([n.id, ...(n.item.tags ?? [])]), start: n.item.drag.in ?? null }); }
  return out;
}
function makeEnv(scene, assign, extra = {}) {
  const vals = {}; for (const v of scene.vars) vals[v.id] = extra[v.id] ?? v.init;
  const zones = scene.nodes.filter((n) => n.kind === "zone");
  const state = {
    count: (zone, tag) => { let c = 0; for (const [cls, per] of assign.entries()) { const t = assign.tags.get(cls); if (tag && !t.has(tag)) continue; c += per[zone] ?? 0; } return c; },
    has: (zone, id) => { for (const [cls, per] of assign.entries()) if (assign.tags.get(cls).has(id) && (per[zone] ?? 0) > 0) return true; return false; },
    at: (id) => { for (const [cls, per] of assign.entries()) if (assign.tags.get(cls).has(id)) for (const z of zones) if ((per[z.id] ?? 0) > 0) return z.id; return ""; },
    order: (list) => extra.__order?.[list] ?? (scene.nodes.find((n) => n.id === list)?.start ?? scene.nodes.find((n) => n.id === list)?.items.map((i) => i.id) ?? []).join(","),
  };
  const env = { vals, state };
  for (const d of scene.derive) { try { vals[d.id] = evalExpr(parseExpr(d.expr), env); } catch { vals[d.id] = NaN; } }
  return env;
}
class Assign extends Map { constructor(tags) { super(); this.tags = tags; } }
function initialAssign(scene, drs) { const a = new Assign(new Map(drs.map((d) => [d.cls, d.tags]))); for (const d of drs) a.set(d.cls, d.start ? { [d.start]: d.ids.length } : {}); return a; }
function* compositions(nItems, bins) { // all ways to put nItems identical items into bins (last bin = "outside")
  if (bins === 1) { yield [nItems]; return; } for (let i = 0; i <= nItems; i++) for (const rest of compositions(nItems - i, bins - 1)) yield [i, ...rest];
}
/** Search reachable states for a predicate. Exact when the state space ≤ cap, else seeded random sampling. */
export function solve(scene, L, pred, { cap = 200000 } = {}) {
  const drs = draggables(scene, L); const zones = scene.nodes.filter((n) => n.kind === "zone");
  const accepting = (d) => zones.filter((zn) => zn.accepts.some((t) => d.tags.has(t)));
  const varDomains = scene.vars.map((v) => {
    if (v.type === "bool") return [true, false]; if (v.type === "enum") return v.options ?? [v.init];
    const lo = v.min ?? v.init, hi = v.max ?? v.init, st = v.step ?? (v.type === "int" ? 1 : (hi - lo) / 100 || 1); const out = [];
    for (let x = lo; x <= hi + 1e-9 && out.length < 400; x += st) out.push(+x.toFixed(6)); return out;
  });
  const orders = scene.nodes.filter((n) => n.kind === "order");
  const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));
  const orderDomains = orders.map((o) => perms(o.items.map((i) => i.id)).map((p) => p.join(",")));
  const dragDomains = drs.map((d) => { const zs = accepting(d).filter((zn) => !zn.cap || zn.cap >= 0); const comps = [...compositions(d.ids.length, zs.length + 1)].slice(0, 60000);
    return comps.map((c) => Object.fromEntries(zs.map((zn, i) => [zn.id, c[i]]).filter(([, v]) => v))); });
  const domains = [...varDomains, ...orderDomains, ...dragDomains]; const size = domains.reduce((a, d) => a * Math.max(1, d.length), 1);
  const check = (pick) => {
    const extra = {}; scene.vars.forEach((v, i) => (extra[v.id] = pick[i])); const ord = {}; orders.forEach((o, i) => (ord[o.id] = pick[scene.vars.length + i])); extra.__order = ord;
    const a = new Assign(new Map(drs.map((d) => [d.cls, d.tags]))); drs.forEach((d, i) => a.set(d.cls, pick[scene.vars.length + orders.length + i]));
    for (const zn of zones) if (zn.cap && [...a.values()].reduce((s, per) => s + (per[zn.id] ?? 0), 0) > zn.cap) return false;
    try { return !!pred(makeEnv(scene, a, extra)); } catch { return false; }
  };
  if (size <= cap) { const idx = domains.map(() => 0); for (let n = 0; n < size; n++) { if (check(idx.map((j, i) => domains[i][j]))) return { found: true, exact: true, tried: n + 1 };
      for (let i = 0; i < idx.length; i++) { idx[i]++; if (idx[i] < domains[i].length) break; idx[i] = 0; } } return { found: false, exact: true, tried: size }; }
  let s = 12345; const rnd = (m) => ((s = (s * 1103515245 + 12345) >>> 0) % m);
  for (let n = 0; n < 50000; n++) if (check(domains.map((d) => d[rnd(d.length)]))) return { found: true, exact: false, tried: n + 1 };
  return { found: false, exact: false, tried: 50000 };
}

// ───────────────────────────── lint (S1–S7) ─────────────────────────────
/** @returns {{ ok: boolean, errors: {code:string, path:string, msg:string}[], warnings: {code:string, path:string, msg:string}[], stats: object }} */
export function lint(scene, { sprites = SPRITES, words = true } = {}) {
  const errors = [], warnings = []; const E = (code, path, msg) => errors.push({ code, path, msg }); const Wn = (code, path, msg) => warnings.push({ code, path, msg });
  const band = scene.meta.band; const B = BANDS[band]; const ids = new Map();
  // S1 references and identity
  const all = [...scene.vars.map((v) => ["var", v.id]), ...scene.derive.map((d) => ["derive", d.id]), ...scene.nodes.map((n) => ["node", n.id]),
    ...scene.timelines.map((t) => ["timeline", t.id]), ...scene.goals.map((g) => ["goal", g.id])];
  for (const [kind, id] of all) { if (ids.has(id)) E("S1.dup_id", id, `id '${id}' used twice`); ids.set(id, kind); }
  const nodeIds = new Set(scene.nodes.map((n) => n.id)); const varIds = new Set(scene.vars.map((v) => v.id)); const valueIds = new Set([...varIds, ...scene.derive.map((d) => d.id)]);
  scene.nodes.forEach((n, i) => {
    const P = `/nodes/${i}`;
    if (n.parent && !(nodeIds.has(n.parent) && scene.nodes.find((q) => q.id === n.parent).kind === "group")) E("S1.parent", P, `parent '${n.parent}' is not a group`);
    for (const key of ["var"]) if (n[key] && !varIds.has(n[key])) E("S1.var_ref", P, `${n.kind} binds unknown var '${n[key]}'`);
    if (n.tap?.var && !varIds.has(n.tap.var)) E("S1.var_ref", P, `tap sets unknown var '${n.tap.var}'`);
    if (n.kind === "connector") for (const e of [n.from, n.to]) if (!nodeIds.has(e)) E("S1.node_ref", P, `connector end '${e}' missing`);
    if (n.drag?.in && !scene.nodes.some((q) => q.kind === "zone" && q.id === n.drag.in)) E("S1.zone_ref", P, `drag.in '${n.drag.in}' is not a zone`);
    if (n.kind === "sprite" && !sprites.includes(n.lib)) E("S6.sprite", P, `sprite '${n.lib}' not in library`);
    if (n.kind === "repeat" && n.item.kind === "sprite" && !sprites.includes(n.item.lib ?? "")) E("S6.sprite", P, `repeat sprite '${n.item.lib}' not in library`);
    if (n.kind === "choice") { const v = scene.vars.find((q) => q.id === n.var); if (v && v.type !== "enum") E("S1.choice_var", P, `choice var '${v.id}' must be enum`);
      if (v && n.options.some((o) => !(v.options ?? []).includes(o.id))) E("S1.choice_opts", P, "choice options must equal the enum var's options");
      if (n.options.length > B.choices) E("S5.choices", P, `${n.options.length} options > ${B.choices} allowed in ${band}`);
      n.options.forEach((o, j) => { if (o.sprite && !sprites.includes(o.sprite)) E("S6.sprite", `${P}/options/${j}`, `sprite '${o.sprite}' not in library`); }); }
    if (n.kind === "order") n.items.forEach((o, j) => { if (o.sprite && !sprites.includes(o.sprite)) E("S6.sprite", `${P}/items/${j}`, `sprite '${o.sprite}' not in library`); });
    if (n.kind === "keypad" && !B.keypad) E("S5.keypad", P, `keypad not allowed in ${band}`);
    if (n.kind === "button" && n.timeline && !scene.timelines.some((t) => t.id === n.timeline)) E("S1.timeline_ref", P, `button plays unknown timeline '${n.timeline}'`);
    if (n.kind === "text" && n.text.fmt) for (const m of JSON.stringify(n.text.fmt).matchAll(/\{([a-z0-9_]+)\}/g)) if (!valueIds.has(m[1])) E("S1.fmt_ref", P, `text interpolates unknown '${m[1]}'`);
  });
  // cycles in parent chain
  for (const n of scene.nodes) { let cur = n, hops = 0; while (cur?.parent && hops < 100) { cur = scene.nodes.find((q) => q.id === cur.parent); hops++; } if (hops >= 100) E("S1.cycle", n.id, "parent cycle"); }
  // S2 expressions: parse, resolve names, evaluate at init
  const known = new Set([...valueIds]); const exprs = [];
  scene.derive.forEach((d, i) => exprs.push([`/derive/${i}/expr`, d.expr, "num"]));
  scene.goals.forEach((g, i) => exprs.push([`/goals/${i}/when`, g.when, "bool"]));
  if (scene.probe) { exprs.push(["/probe/correct", scene.probe.correct, "bool"]); scene.probe.traps.forEach((t, i) => exprs.push([`/probe/traps/${i}/when`, t.when, "bool"])); }
  scene.nodes.forEach((n, i) => { for (const [key, v] of Object.entries(n)) if (v && typeof v === "object" && "$" in v) exprs.push([`/nodes/${i}/${key}`, v.$, key === "show" ? "bool" : "num"]); });
  const L0 = (() => { try { return layout(scene, makeEnv(scene, initialAssign(scene, []))); } catch (e) { E("S2.layout", "/", String(e.message)); return null; } })();
  const drs0 = L0 ? draggables(scene, L0) : []; const env0 = makeEnv(scene, initialAssign(scene, drs0));
  for (const [path, src, want] of exprs) {
    let ast; try { ast = parseExpr(src); } catch (e) { E("S2.parse", path, `${e.message} in '${src}'`); continue; }
    for (const id of identsOf(ast)) if (!known.has(id)) E("S2.name", path, `unknown name '${id}' in '${src}'`);
    try { const v = evalExpr(ast, env0); if (want === "bool" && typeof v !== "boolean") E("S2.type", path, `'${src}' must be boolean`); if (want === "num" && typeof v !== "number") E("S2.type", path, `'${src}' must be a number`); }
    catch (e) { if (!errors.some((x) => x.path === path)) E("S2.eval", path, `${e.message} in '${src}'`); }
  }
  for (const v of scene.vars) { if ((v.type === "num" || v.type === "int") && (v.min === undefined || v.max === undefined)) E("S1.var_range", v.id, `var '${v.id}' needs min and max`);
    if (v.type === "enum" && !(v.options ?? []).includes(v.init)) E("S1.var_init", v.id, `enum init '${v.init}' not in options`);
    if ((v.type === "num" || v.type === "int") && typeof v.init === "number" && (v.init < v.min || v.init > v.max)) E("S1.var_init", v.id, "init outside [min,max]"); }
  // timelines
  let totalSteps = 0;
  scene.timelines.forEach((t, i) => { totalSteps += t.steps.length; let end = 0;
    if (t.on === "goal" && !scene.goals.some((g) => g.id === t.ref)) E("S1.timeline_ref", `/timelines/${i}`, `timeline waits on unknown goal '${t.ref}'`);
    t.steps.forEach((s, j) => { end = Math.max(end, s.t + s.ms); const P = `/timelines/${i}/steps/${j}`;
      if (["tween", "show", "hide", "pulse", "trace", "count"].includes(s.do) && !nodeIds.has(s.target ?? "")) E("S1.step_target", P, `step targets unknown node '${s.target}'`);
      if (s.do === "tween" && (s.prop === undefined || s.to === undefined)) E("S1.step_tween", P, "tween needs prop and to");
      if (s.do === "set" && !varIds.has(s.var ?? "")) E("S1.step_var", P, `step sets unknown var '${s.var}'`);
      const tgt = scene.nodes.find((q) => q.id === s.target); if (tgt?.role === "context" && s.do === "tween") E("S5.decor_motion", P, "context/decoration may not animate (R6)"); });
    if (end > LIMITS.timelineMs) E("S7.timeline_len", `/timelines/${i}`, `timeline runs ${end} ms > ${LIMITS.timelineMs}`); });
  if (totalSteps > LIMITS.steps) E("S7.steps", "/timelines", `${totalSteps} steps > ${LIMITS.steps}`);
  if (scene.probe?.reveal && !scene.timelines.some((t) => t.id === scene.probe.reveal)) E("S1.timeline_ref", "/probe/reveal", `unknown timeline '${scene.probe.reveal}'`);
  if (scene.probe?.commit.node && !nodeIds.has(scene.probe.commit.node)) E("S1.node_ref", "/probe/commit/node", `unknown node '${scene.probe.commit.node}'`);
  // S3 geometry (only if layout succeeded)
  const stats = { nodes: scene.nodes.length, instances: L0?.instances.length ?? 0 };
  if (L0) {
    if (L0.instances.length > LIMITS.instances) E("S7.instances", "/nodes", `${L0.instances.length} repeat instances > ${LIMITS.instances}`);
    const stage = { x: L0.W / 2, y: L0.H / 2, w: L0.W, h: L0.H };
    const interactive = [];
    scene.nodes.forEach((n, i) => { const b = L0.boxes.get(n.id); if (!b || n.kind === "group") return; const P = `/nodes/${i}`;
      if (!inside({ ...b, w: Math.max(0, b.w - 4), h: Math.max(0, b.h - 4) }, stage)) E("S3.off_stage", P, `${n.kind} '${n.id}' extends outside the stage (box ${fmtBox(b)}, stage ${L0.W}×${L0.H})`);
      const isCtl = ["slider", "stepper", "toggle", "choice", "button", "order", "keypad"].includes(n.kind) || n.drag || n.tap;
      if (isCtl || n.kind === "zone") interactive.push({ id: n.id, kind: n.kind, b, P, zone: n.kind === "zone", start: n.drag?.in });
      if ((n.drag || n.tap) && Math.min(b.w, b.h) * DPU < B.hit - 0.5) E("S3.hit_small", P, `'${n.id}' is ${Math.round(Math.min(b.w, b.h) * DPU)} dp; ${band} needs ≥ ${B.hit} dp (${Math.ceil(B.hit / DPU)} units)`);
      if (n.kind === "text" && !n.w && b.w > L0.W - 20) E("S3.text_wide", P, `text '${n.id}' ≈ ${Math.round(b.w)} units wide; give it w (wrap) or shorten`); });
    for (const q of L0.instances) { const r = scene.nodes.find((n) => n.id === q.of);
      if (!inside({ ...q.box, w: q.box.w - 4, h: q.box.h - 4 }, stage)) { E("S3.off_stage", q.id, `repeat instance '${q.id}' outside the stage`); break; }
      if (r.item.drag) { if (Math.min(q.box.w, q.box.h) * DPU < B.hit - 0.5) { E("S3.hit_small", q.id, `repeat item ${Math.round(Math.min(q.box.w, q.box.h) * DPU)} dp; ${band} needs ≥ ${B.hit} dp`); }
        interactive.push({ id: q.id, kind: "drag", b: q.box, zone: false, start: r.item.drag.in }); } }
    for (let a = 0; a < interactive.length; a++) for (let b = a + 1; b < interactive.length; b++) { const p = interactive[a], q = interactive[b];
      if (p.zone && q.zone) { if (overlap(p.b, q.b)) E("S3.overlap", p.P ?? p.id, `zones '${p.id}' and '${q.id}' overlap`); continue; }
      if (p.zone || q.zone) { const d = p.zone ? q : p, zn = p.zone ? p : q; if (d.start === zn.id) continue; if (overlap(p.b, q.b, 8)) E("S3.overlap", d.P ?? d.id, `'${d.id}' starts on top of zone '${zn.id}'`); continue; }
      if (overlap(p.b, q.b, 4)) { E("S3.overlap", p.P ?? p.id, `interactive '${p.id}' overlaps '${q.id}'`); } }
    // texts must not collide with each other
    const texts = scene.nodes.filter((n) => n.kind === "text" || n.kind === "math").map((n) => [n, L0.boxes.get(n.id)]).filter(([, b]) => b);
    for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) if (overlap(texts[a][1], texts[b][1], 6)) E("S3.text_overlap", texts[a][0].id, `texts '${texts[a][0].id}' and '${texts[b][0].id}' overlap`);
    // S5 contrast: text fill vs the fill of the topmost shape under its centre, else the stage bg
    for (const [n, b] of texts) { const ink = COLORS[n.fill ?? "ink"]; if (!ink) continue;
      const under = scene.nodes.filter((q) => q !== n && ["rect", "circle", "ellipse", "zone", "wedge"].includes(q.kind) && q.fill && COLORS[q.fill] && L0.boxes.get(q.id) && inside({ x: b.x, y: b.y, w: 1, h: 1 }, L0.boxes.get(q.id))).pop();
      const bg = COLORS[under?.fill ?? (scene.stage.bg === "none" ? "bg" : scene.stage.bg)]; const cr = contrast(ink, bg);
      if (cr < 4.5) E("S5.contrast", n.id, `text '${n.id}' contrast ${cr.toFixed(2)} < 4.5 (${n.fill ?? "ink"} on ${under?.fill ?? scene.stage.bg})`); }
    // S5 words on stage
    if (words) { const w = scene.nodes.filter((n) => n.kind === "text").map((n) => displayText(n, scene).split(/\s+/).filter(Boolean).length).reduce((a, c) => a + c, 0);
      stats.words = w; if (w > B.words) E("S5.words", "/nodes", `${w} words on stage > ${B.words} for ${band} (the teacher speaks; the stage shows)`); }
    // S4 behaviour: goals reachable and not already met; probe has a reachable correct state not true at mount
    const t0 = performance.now();
    for (const [i, g] of scene.goals.entries()) { let ast; try { ast = parseExpr(g.when); } catch { continue; }
      let init; try { init = evalExpr(ast, env0); } catch { continue; } if (init === true) E("S4.goal_trivial", `/goals/${i}`, `goal '${g.id}' is already true at mount`);
      const r = solve(scene, L0, (env) => evalExpr(ast, env) === true); stats[`goal_${g.id}`] = r;
      if (!r.found) (r.exact ? E : Wn)("S4.goal_unreachable", `/goals/${i}`, `goal '${g.id}' (${g.when}) is ${r.exact ? "unreachable" : "not found by sampling"}`); }
    if (scene.probe) { const P = scene.probe; let ast; try { ast = parseExpr(P.correct); } catch { ast = null; }
      if (ast) { try { if (evalExpr(ast, env0) === true && P.kind !== "predict" && P.kind !== "diagnose") E("S4.probe_trivial", "/probe/correct", "probe is already correct at mount"); } catch { /* reported above */ }
        const r = solve(scene, L0, (env) => evalExpr(ast, env) === true); stats.probe = r; if (!r.found) (r.exact ? E : Wn)("S4.probe_unreachable", "/probe/correct", `no reachable state satisfies '${P.correct}'`);
        P.traps.forEach((t, i) => { let ta; try { ta = parseExpr(t.when); } catch { return; }
          const both = solve(scene, L0, (env) => evalExpr(ta, env) === true && evalExpr(ast, env) === true); if (both.found) E("S4.trap_overlaps_correct", `/probe/traps/${i}`, `trap ${t.misc} can be true together with the correct answer`);
          const rt = solve(scene, L0, (env) => evalExpr(ta, env) === true); if (!rt.found && rt.exact) Wn("S4.trap_unreachable", `/probe/traps/${i}`, `trap ${t.misc} can never fire`); });
        if (P.commit.via === "choice") { const ch = scene.nodes.find((n) => n.id === P.commit.node && n.kind === "choice");
          if (!ch) E("S4.commit_node", "/probe/commit", "commit via choice needs commit.node = a choice node");
          else { const v = ch.var; const right = ch.options.filter((o) => { try { return evalExpr(ast, makeEnv(scene, initialAssign(scene, drs0), { [v]: o.id })) === true; } catch { return false; } });
            if (right.length !== 1) E("S4.choice_key", "/probe/correct", `exactly one option must be correct; found ${right.length}`);
            ch.options.forEach((o, j) => { if (!right.includes(o) && !o.misc && !P.traps.length) Wn("S4.distractor_untagged", `/nodes/${scene.nodes.indexOf(ch)}/options/${j}`, `distractor '${o.id}' has no misconception tag (LR7)`); }); } } } }
    stats.solverMs = Math.round(performance.now() - t0);
  }
  // S5 kid-UX rules that are not geometric
  const ctl = scene.nodes.filter((n) => ["slider", "stepper", "toggle", "keypad"].includes(n.kind));
  for (const n of ctl) if (!n.say && !scene.nodes.some((q) => q.kind === "text" && q.parent === n.parent)) Wn("S5.unlabelled_control", n.id, `control '${n.id}' has no say/label`);
  if (!scene.goals.length && !scene.probe) E("S5.unguided", "/", "every scene needs a goal or a probe (R3: no unguided free play)");
  if (scene.nodes.filter((n) => n.drag || n.kind === "repeat" && n.item.drag).length && !scene.nodes.some((n) => n.kind === "zone")) Wn("S5.drag_no_zone", "/", "draggables but no zones: drag has no meaning");
  return { ok: errors.length === 0, errors, warnings, stats };
}
const fmtBox = (b) => `${Math.round(b.x - b.w / 2)},${Math.round(b.y - b.h / 2)} ${Math.round(b.w)}×${Math.round(b.h)}`;

// ───────────────────────────── autofix (deterministic, before any LLM repair) ─────────────────────────────
// v0's lesson: most failures are a small set of mechanical slips; fix them in code, in milliseconds.
export const stripNulls = (o) => { if (Array.isArray(o)) return o.map(stripNulls); if (o && typeof o === "object") { for (const k of Object.keys(o)) { if (o[k] === null) delete o[k]; else o[k] = stripNulls(o[k]); } } return o; };
export function autofix(raw) {
  const fixes = []; const s = stripNulls(structuredClone(raw));              // strict wire nulls → absent
  for (const key of ["vars", "derive", "timelines", "goals"]) if (!Array.isArray(s[key])) { s[key] = []; }
  s.feedback ??= "on_commit"; s.dsl = "scene@1";
  const near = (id) => { if (!id || SPRITES.includes(id)) return id; const leaf = id.split(".").pop(); const hit = SPRITES.find((q) => q.split(".").pop() === leaf) ?? SPRITES.find((q) => q.includes(leaf) || leaf.includes(q.split(".").pop()));
    if (hit) fixes.push(`sprite ${id} → ${hit}`); return hit ?? id; };
  const colorMap = { red: "c1d", orange: "fire", yellow: "c4", green: "leaf", blue: "c3d", purple: "c5d", brown: "soil", grey: "metal", gray: "metal", black: "ink", white: "surface", pink: "c1" };
  // v1.1: a lone '=' in an expression is always a typo for '==' (bench 2026-10-02, b8 'side*side=4*side')
  const eq = (src, where) => { if (typeof src !== "string") return src; const out = src.replace(/(?<![=!<>])=(?!=)/g, "=="); if (out !== src) fixes.push(`${where}: '=' → '=='`); return out; };
  for (const d of s.derive ?? []) d.expr = eq(d.expr, `derive ${d.id}`);
  for (const g of s.goals ?? []) g.when = eq(g.when, `goal ${g.id}`);
  if (s.probe) { s.probe.correct = eq(s.probe.correct, "probe.correct"); for (const t of s.probe.traps ?? []) t.when = eq(t.when, "trap"); }
  for (const n of s.nodes ?? []) for (const [k2, v] of Object.entries(n)) if (v && typeof v === "object" && typeof v.$ === "string") v.$ = eq(v.$, `${n.id}.${k2}`);
  // v1.2: probe.reveal names a timeline; models put option ids there (bench: 4/7 first T2b scenes)
  if (s.probe?.reveal && !(s.timelines ?? []).some((t) => t.id === s.probe.reveal)) { const c = (s.timelines ?? []).filter((t) => t.on === "commit");
    if (c.length === 1) { fixes.push(`probe.reveal ${s.probe.reveal} → ${c[0].id}`); s.probe.reveal = c[0].id; } else { fixes.push(`probe.reveal ${s.probe.reveal} dropped`); delete s.probe.reveal; } }
  for (const n of s.nodes ?? []) {
    if (n.lib) n.lib = near(n.lib); if (n.item?.lib) n.item.lib = near(n.item.lib); for (const o of n.options ?? []) if (o.sprite) o.sprite = near(o.sprite); for (const o of n.items ?? []) if (o.sprite) o.sprite = near(o.sprite);
    // v1.3: text is ink or ink2, always (bench: tints c1–c4 and `done` used as text colours failed 4.5:1). scene@1.1 makes this a schema rule.
    if ((n.kind === "text" || n.kind === "math") && n.fill && !["ink", "ink2"].includes(n.fill)) { fixes.push(`${n.id}.fill ${n.fill} → ink (text)`); n.fill = "ink"; }
    for (const c of ["fill", "stroke"]) if (n[c] && !(n[c] in COLORS)) { const m = colorMap[String(n[c]).toLowerCase()] ?? "c6"; fixes.push(`${n.id}.${c} ${n[c]} → ${m}`); n[c] = m; }
    for (const key of ["x", "y", "w", "h", "r"]) if (typeof n[key] === "string" && /^-?\d+(\.\d+)?$/.test(n[key])) { n[key] = +n[key]; fixes.push(`${n.id}.${key} string → number`); }
  }
  return { scene: s, fixes };
}
/** Geometry autofix after a lint pass: grow undersized hit targets and pull off-stage nodes back in (root nodes only). */
export function geomFix(scene, report) {
  const fixes = []; const s = structuredClone(scene); const B = BANDS[s.meta.band]; const minU = Math.ceil(B.hit / DPU);
  for (const e of report.errors) {
    const m = e.path.match(/^\/nodes\/(\d+)$/); if (!m) continue; const n = s.nodes[+m[1]];
    if (e.code === "S3.hit_small" && (n.kind === "sprite" || n.kind === "rect") && typeof n.w === "number" && typeof n.h === "number") { const f = minU / Math.min(n.w, n.h); n.w = Math.ceil(n.w * f); n.h = Math.ceil(n.h * f); fixes.push(`${n.id} scaled to ${n.w}×${n.h}`); }
    if (e.code === "S3.hit_small" && n.kind === "circle" && typeof n.r === "number") { n.r = Math.ceil(minU / 2); fixes.push(`${n.id} r → ${n.r}`); }
  }
  for (const n of s.nodes) if (n.kind === "repeat" && n.item.drag) { const it = n.item; if (it.kind === "circle" && (it.r ?? 20) * 2 < minU) { it.r = Math.ceil(minU / 2); fixes.push(`${n.id}.item r → ${it.r}`); }
    else if (it.kind !== "circle" && Math.min(it.w ?? 60, it.h ?? 60) < minU) { const f = minU / Math.min(it.w ?? 60, it.h ?? 60); it.w = Math.ceil((it.w ?? 60) * f); it.h = Math.ceil((it.h ?? 60) * f); fixes.push(`${n.id}.item scaled`); } }
  // v1.2: nudge root-level nodes back on stage when the overflow is small (≤ 80 units) and the node fits
  const W = 1000, H = STAGES[s.meta.aspect ?? s.stage.aspect]; const env = makeEnv(s, initialAssign(s, [])); let Lb; try { Lb = layout(s, env); } catch { Lb = null; }
  const offIds = new Set(); for (const e of report.errors) if (e.code === "S3.off_stage") { const m = e.path.match(/^\/nodes\/(\d+)$/); if (m) offIds.add(s.nodes[+m[1]].id); else { const r = s.nodes.find((n) => n.kind === "repeat" && e.path.startsWith(n.id + "_")); if (r) offIds.add(r.id); } }
  for (const id of offIds) { const n = s.nodes.find((q) => q.id === id); const b = Lb?.boxes.get(id); if (!n || !b || n.parent || typeof (n.x ?? 0) !== "number" || typeof (n.y ?? 0) !== "number") continue;
    if (b.w > W || b.h > H) continue; const dx = Math.max(0, b.w / 2 - b.x + 4) - Math.max(0, b.x + b.w / 2 - W + 4); const dy = Math.max(0, b.h / 2 - b.y + 4) - Math.max(0, b.y + b.h / 2 - H + 4);
    if (Math.abs(dx) > 80 || Math.abs(dy) > 80 || (!dx && !dy)) continue; n.x = Math.round((n.x ?? W / 2) + dx); n.y = Math.round((n.y ?? H / 2) + dy); fixes.push(`${id} nudged ${Math.round(dx)},${Math.round(dy)}`); }
  return { scene: s, fixes };
}

// ───────────────────────────── full pipeline ─────────────────────────────
export function validate(raw, opts = {}) {
  const { scene: fixed, fixes } = autofix(raw);
  const parsed = Scene.safeParse(fixed);
  if (!parsed.success) return { ok: false, stage: "schema", fixes, errors: parsed.error.issues.slice(0, 12).map((i) => ({ code: "S0.schema", path: "/" + i.path.join("/"), msg: i.message })), warnings: [] };
  let scene = parsed.data; let rep = lint(scene, opts);
  if (!rep.ok && rep.errors.some((e) => e.code === "S3.hit_small" || e.code === "S3.off_stage")) { const g = geomFix(scene, rep); if (g.fixes.length) { const r2 = lint(g.scene, opts); fixes.push(...g.fixes); if (r2.errors.length < rep.errors.length) { scene = g.scene; rep = r2; } } }
  return { ok: rep.ok, stage: rep.ok ? "pass" : "lint", fixes, errors: rep.errors, warnings: rep.warnings, stats: rep.stats, scene };
}

// ───────────────────────────── T2a templates ─────────────────────────────
const L = (en, hi, hi_latn) => (hi_latn ? { en, hi, hi_latn } : { en, hi });
const Slot = { L10n, Lib, Misc, ID };
const T = {};
T["sort-bins@1"] = {
  slots: z.strictObject({ title: L10n, bins: z.array(z.strictObject({ id: ID, label: L10n, fill: z.enum(["c1", "c2", "c3", "c4", "c5", "water", "soil", "leaf", "sky"]) })).min(2).max(4),
    items: z.array(z.strictObject({ id: ID, sprite: Lib, say: L10n, bin: ID, misc: Misc.optional() })).min(2).max(8) }),
  expand(sl, meta) {
    const B = BANDS[meta.band]; const it = Math.ceil(B.hit / DPU) + 10; const nb = sl.bins.length; const zw = Math.min(440, Math.floor((1000 - 40 - (nb - 1) * 20) / nb));
    const cols = Math.min(4, Math.floor((1000 + 24) / (it + 24))); if (Math.ceil(sl.items.length / cols) * (it + 24) - 24 > 520) throw new Error(`${sl.items.length} items do not fit ${meta.band} hit size; max ${2 * cols}`);
    const nodes = [{ kind: "group", id: "items", x: 500, y: 300, layout: { type: "grid", cols: Math.min(cols, sl.items.length), gap: 24 } },
      ...sl.items.map((x) => ({ kind: "sprite", id: x.id, parent: "items", lib: x.sprite, w: it, h: it, say: x.say, tl: x.say.en.slice(0, 32), tags: ["item"], drag: { axis: "xy", snap: "zone", back: true } })),
      { kind: "group", id: "bins", x: 500, y: 800, layout: { type: "row", gap: 20 } },
      ...sl.bins.map((b) => ({ kind: "zone", id: b.id, parent: "bins", w: zw, h: 360, shape: "rect", accepts: ["item"], visible: true, arrange: "grid", fill: b.fill, label: b.label, tl: b.label.en.slice(0, 32) })),
      { kind: "group", id: "lbls", x: 500, y: 1045, layout: { type: "row", gap: 20 } },
      ...sl.bins.map((b) => ({ kind: "text", id: `${b.id}_t`, parent: "lbls", text: b.label, size: "label", w: zw, align: "middle" })),
      { kind: "button", id: "check", x: 500, y: 1215, label: L("Check", "जाँचो", "Check karo"), act: "check" }];
    const correct = sl.items.map((x) => `has(${x.bin}, ${x.id})`).join(" && ");
    const traps = sl.items.filter((x) => x.misc).slice(0, LIMITS.traps).map((x) => ({ when: sl.bins.filter((b) => b.id !== x.bin).map((b) => `has(${b.id}, ${x.id})`).join(" || "), misc: x.misc }));
    return { dsl: "scene@1", meta: { ...meta, title: sl.title, template: "sort-bins@1" }, stage: { aspect: "3:4", bg: "bg" }, vars: [], derive: [], nodes, timelines: [],
      goals: [{ id: "all_placed", when: `count(${sl.bins.map((b) => b.id).join(") + count(")}) == ${sl.items.length}`, tl: "every item placed" }],
      probe: { id: "p_sort", kind: "classify", ask: sl.title, commit: { via: "check", node: "check" }, correct, traps }, feedback: "on_commit" };
  },
};
T["count-group@1"] = {
  slots: z.strictObject({ title: L10n, groups: z.number().int().min(2).max(5), per: z.number().int().min(1).max(6), sprite: Lib, say: L10n,
    container: z.enum(["obj.plate", "obj.basket", "obj.box"]), misc_unequal: Misc.optional() }),
  expand(sl, meta) {
    const B = BANDS[meta.band]; const it = Math.ceil(B.hit / DPU) + 6; const total = sl.groups * sl.per;
    const zw = Math.floor((1000 - 40 - (sl.groups - 1) * 16) / sl.groups); const cols = Math.min(total, Math.floor((1000 + 12) / (it + 12)));
    const pileH = Math.ceil(total / cols) * (it + 12) - 12; if (pileH > 690) throw new Error(`${total} draggables do not fit ${meta.band} hit size; max ${cols * Math.floor(702 / (it + 12))}`);
    const nodes = [{ kind: "repeat", id: "pile", x: 500, y: 20 + pileH / 2, count: total, layout: { type: "grid", cols, gap: 12 },
        item: { kind: "sprite", lib: sl.sprite, w: it, h: it, tags: ["thing"], drag: { axis: "xy", snap: "zone", back: true }, say: sl.say, tl: sl.say.en.slice(0, 32) } },
      { kind: "group", id: "zs", x: 500, y: 900, layout: { type: "row", gap: 16 } },
      ...Array.from({ length: sl.groups }, (_, i) => ({ kind: "zone", id: `g${i + 1}`, parent: "zs", w: zw, h: 360, shape: "rect", accepts: ["thing"], visible: true, arrange: "grid", fill: "c6", tl: `group ${i + 1}` })),
    ];
    const zs = Array.from({ length: sl.groups }, (_, i) => `g${i + 1}`);
    const correct = zs.map((zn) => `count(${zn}) == ${sl.per}`).join(" && ");
    const allIn = `${zs.map((zn) => `count(${zn})`).join(" + ")} == ${total}`;
    return { dsl: "scene@1", meta: { ...meta, title: sl.title, template: "count-group@1" }, stage: { aspect: "3:4", bg: "bg" }, vars: [], derive: [], nodes, timelines: [],
      goals: [{ id: "equal_groups", when: correct, tl: `${sl.groups} groups of ${sl.per}` }],
      probe: { id: "p_groups", kind: "construct", ask: sl.title, commit: { via: "voice" }, correct,
        traps: sl.misc_unequal ? [{ when: `${allIn} && !(${correct})`, misc: sl.misc_unequal }] : [] }, feedback: "on_commit" };
  },
};
T["slider-explore@1"] = {
  slots: z.strictObject({ title: L10n, input: z.strictObject({ id: ID, tl: z.string().max(32), min: z.number(), max: z.number(), step: z.number().positive(), init: z.number(), unit: z.string().max(8), label: L10n }),
    readouts: z.array(z.strictObject({ id: ID, expr: z.string().max(LIMITS.expr), tl: z.string().max(32), unit: z.string().max(8), dp: z.number().int().min(0).max(2), label: L10n })).min(1).max(2),
    visual: z.strictObject({ kind: z.enum(["bar", "count", "needle"]), of: ID, max: z.number().positive(), sprite: Lib.optional() }),
    goal: z.strictObject({ tl: z.string().max(48), when: z.string().max(LIMITS.expr) }) }),
  expand(sl, meta) {
    const v = sl.visual; const nodes = [];
    if (v.kind === "bar") nodes.push({ kind: "rect", id: "bar_bg", x: 500, y: 250, w: 800, h: 70, fill: "c6", role: "context" },
      { kind: "rect", id: "bar", x: { $: `100 + 400 * clamp(${v.of} / ${v.max}, 0, 1)` }, y: 250, w: { $: `max(2, 800 * clamp(${v.of} / ${v.max}, 0, 1))` }, h: 70, fill: "c3d", tl: sl.readouts[0].tl });
    if (v.kind === "count") nodes.push({ kind: "repeat", id: "things", x: 500, y: 260, count: { $: `clamp(round(${v.of}), 0, ${Math.min(30, v.max)})` }, layout: { type: "grid", cols: 10, gap: 8 }, item: { kind: "sprite", lib: v.sprite ?? "obj.seed", w: 60, h: 60 } });
    if (v.kind === "needle") nodes.push({ kind: "wedge", id: "dial", x: 500, y: 330, r: 190, a0: 180, a1: 360, fill: "c6", role: "context" },
      { kind: "line", id: "needle", x: 500, y: 330, pts: [[0, 0], [0, -170]], rot: { $: `-90 + 180 * clamp(${v.of} / ${v.max}, 0, 1)` }, stroke: "ink", sw: 8, tl: sl.readouts[0].tl });
    nodes.push({ kind: "group", id: "reads", x: 500, y: 620, layout: { type: "row", gap: 60 } },
      ...sl.readouts.map((r) => ({ kind: "text", id: `${r.id}_t`, parent: "reads", size: "label", align: "middle", w: 420,
        text: { fmt: { en: `${r.label.en}: {${r.id}} ${r.unit}`, hi: `${r.label.hi}: {${r.id}} ${r.unit}`, ...(r.label.hi_latn ? { hi_latn: `${r.label.hi_latn}: {${r.id}} ${r.unit}` } : {}) } } })),
      { kind: "slider", id: "s_in", x: 500, y: 780, var: sl.input.id, len: 800, orient: "h", value: true, say: sl.input.label, tl: sl.input.tl },
      { kind: "text", id: "s_in_t", x: 500, y: 945, text: sl.input.label, size: "caption", align: "middle", w: 900 });
    return { dsl: "scene@1", meta: { ...meta, title: sl.title, template: "slider-explore@1" }, stage: { aspect: "1:1", bg: "surface" },
      vars: [{ id: sl.input.id, type: "num", init: sl.input.init, min: sl.input.min, max: sl.input.max, step: sl.input.step, tl: sl.input.tl, unit: sl.input.unit }],
      derive: sl.readouts.map((r) => ({ id: r.id, expr: r.expr, tl: r.tl, unit: r.unit, dp: r.dp })), nodes, timelines: [],
      goals: [{ id: "target", when: sl.goal.when, tl: sl.goal.tl }], feedback: "none" };
  },
};
T["sequence-steps@1"] = {
  slots: z.strictObject({ title: L10n, steps: z.array(z.strictObject({ id: ID, label: L10n, sprite: Lib.optional() })).min(3).max(6),
    start: z.array(ID).min(3).max(6), traps: z.array(z.strictObject({ order: z.array(ID).min(3).max(6), misc: Misc })).max(2) }),
  expand(sl, meta) {
    const B = BANDS[meta.band]; const hh = B.hit / DPU, g = B.gap / DPU; const colH = sl.steps.length * hh + (sl.steps.length - 1) * g;
    if (colH > 1100) throw new Error(`${sl.steps.length} steps do not fit ${meta.band} hit size; max ${Math.floor((1100 + g) / (hh + g))}`);
    if (new Set(sl.start).size !== sl.steps.length || sl.start.some((x) => !sl.steps.some((q) => q.id === x))) throw new Error("start must be a permutation of the step ids");
    return { dsl: "scene@1", meta: { ...meta, title: sl.title, template: "sequence-steps@1" }, stage: { aspect: "3:4", bg: "bg" }, vars: [], derive: [],
      nodes: [{ kind: "order", id: "steps", x: 500, y: 20 + colH / 2, items: sl.steps, orient: "column", start: sl.start, tl: "step order" },
        { kind: "button", id: "check", x: 500, y: 1333 - 20 - hh / 2, label: L("Check", "जाँचो", "Check karo"), act: "check" }], timelines: [],
      goals: [], probe: { id: "p_seq", kind: "sequence", ask: sl.title, commit: { via: "check", node: "check" }, correct: `order(steps) == '${sl.steps.map((x) => x.id).join(",")}'`,
        traps: sl.traps.map((t) => ({ when: `order(steps) == '${t.order.join(",")}'`, misc: t.misc })) }, feedback: "on_commit" };
  },
};
T["compare-choice@1"] = {
  slots: z.strictObject({ title: L10n, question: L10n, left: z.strictObject({ label: L10n, sprite: Lib, count: z.number().int().min(0).max(12) }),
    right: z.strictObject({ label: L10n, sprite: Lib, count: z.number().int().min(0).max(12) }), ask: z.enum(["more", "fewer"]), misc_wrong: Misc.optional() }),
  expand(sl, meta) {
    const H = STAGES["3:4"]; const B = BANDS[meta.band]; const sz = 80;
    const ans = (sl.ask === "more") === (sl.left.count > sl.right.count) ? "left" : "right"; const wrong = ans === "left" ? "right" : "left";
    const panel = (side, p, x) => [{ kind: "rect", id: `${side}_bg`, x, y: 360, w: 440, h: 520, r: 24, fill: "c6", role: "context" },
      { kind: "repeat", id: `${side}_n`, x, y: 360, count: p.count, layout: { type: "grid", cols: 3, gap: 16 }, item: { kind: "sprite", lib: p.sprite, w: sz, h: sz } }];
    const opts = [{ id: "left", label: sl.left.label, ...(ans === "left" ? {} : sl.misc_wrong ? { misc: sl.misc_wrong } : {}) }, { id: "right", label: sl.right.label, ...(ans === "right" ? {} : sl.misc_wrong ? { misc: sl.misc_wrong } : {}) }];
    return { dsl: "scene@1", meta: { ...meta, title: sl.title, template: "compare-choice@1" }, stage: { aspect: "3:4", bg: "bg" },
      vars: [{ id: "pick", type: "enum", init: "none", options: ["none", "left", "right"], tl: "child's pick" }], derive: [],
      nodes: [...panel("left", sl.left, 260), ...panel("right", sl.right, 740), { kind: "choice", id: "ch", x: 500, y: H - 40 - B.tile / DPU / 2, var: "pick", options: opts, layout: "row", commit: true }],
      timelines: [], goals: [], probe: { id: "p_cmp", kind: "diagnose", ask: sl.question, commit: { via: "choice", node: "ch" }, correct: `pick == '${ans}'`,
        traps: sl.misc_wrong ? [{ when: `pick == '${wrong}'`, misc: sl.misc_wrong }] : [] }, feedback: "on_commit" };
  },
};
T["predict-reveal@1"] = {
  slots: z.strictObject({ title: L10n, question: L10n, subject: z.strictObject({ sprite: Lib, say: L10n }),
    options: z.array(z.strictObject({ id: ID, label: L10n, misc: Misc.optional() })).min(2).max(3), correct: ID,
    effect: z.enum(["shrink", "grow", "sink", "rise", "fade"]), after: z.strictObject({ sprite: Lib.optional(), say: L10n }) }),
  expand(sl, meta) {
    const H = STAGES["3:4"]; const B = BANDS[meta.band]; const ids = sl.options.map((o) => o.id);
    const fx = { shrink: [["scale", 0.35]], grow: [["scale", 1.6]], sink: [["y", 480]], rise: [["y", 160]], fade: [["op", 0.1]] }[sl.effect];
    const steps = [...fx.map(([prop, to]) => ({ t: 0, ms: 2500, do: "tween", target: "subj", prop, to, ease: "inout" })), { t: 2600, ms: 0, do: "cue", cue: "observed" }];
    if (sl.after.sprite) steps.push({ t: 2600, ms: 400, do: "show", target: "after" });
    const nodes = [{ kind: "sprite", id: "subj", x: 500, y: 300, lib: sl.subject.sprite, w: 260, h: 260, say: sl.subject.say, tl: sl.subject.say.en.slice(0, 32) }];
    if (sl.after.sprite) nodes.push({ kind: "sprite", id: "after", x: 500, y: 450, lib: sl.after.sprite, w: 240, h: 120, show: false, say: sl.after.say, tl: sl.after.say.en.slice(0, 32) });
    const chH = sl.options.length > 2 ? 2 * B.tile / DPU + B.gap / DPU : B.tile / DPU;
    nodes.push({ kind: "choice", id: "ch", x: 500, y: H - 40 - chH / 2, var: "guess", options: sl.options.map((o) => ({ id: o.id, label: o.label, ...(o.misc ? { misc: o.misc } : {}) })), layout: sl.options.length > 2 ? "grid" : "row", commit: true });
    return { dsl: "scene@1", meta: { ...meta, title: sl.title, template: "predict-reveal@1" }, stage: { aspect: "3:4", bg: "sky" },
      vars: [{ id: "guess", type: "enum", init: "none", options: ["none", ...ids], tl: "prediction" }], derive: [], nodes,
      timelines: [{ id: "reveal", on: "commit", steps }], goals: [],
      probe: { id: "p_poe", kind: "predict", ask: sl.question, commit: { via: "choice", node: "ch" }, correct: `guess == '${sl.correct}'`,
        traps: sl.options.filter((o) => o.misc && o.id !== sl.correct).map((o) => ({ when: `guess == '${o.id}'`, misc: o.misc })), reveal: "reveal" }, feedback: "on_commit" };
  },
};
export const TEMPLATES = T;
export function expandTemplate(id, slots, meta) {
  const t = T[id]; if (!t) return { ok: false, errors: [{ code: "T.unknown", path: "/template", msg: `unknown template ${id}` }] };
  const p = t.slots.safeParse(stripNulls(structuredClone(slots)));
  if (!p.success) return { ok: false, errors: p.error.issues.slice(0, 10).map((i) => ({ code: "T.slots", path: "/slots/" + i.path.join("/"), msg: i.message })) };
  try { return { ok: true, scene: t.expand(p.data, meta) }; } catch (e) { return { ok: false, errors: [{ code: "T.expand", path: "/slots", msg: String(e.message) }] }; }
}

// ───────────────────────────── strict wire schema (Azure structured outputs) ─────────────────────────────
// Measured 2026-10-02 on taxila-fast/taxila-brain: 400 properties accepted; nesting > 10 levels rejected;
// minimum/maximum/pattern/maxLength/minItems accepted. Strict mode needs every key required → optional ⇒ nullable.
export function toStrict(js) {
  const walk = (s) => {
    if (Array.isArray(s)) return s.map(walk); if (!s || typeof s !== "object") return s;
    const o = {}; for (const [k2, v] of Object.entries(s)) { if (["$schema", "default", "$id", "id"].includes(k2) && typeof v !== "object") continue; o[k2] = walk(v); }
    if (o.oneOf) { o.anyOf = o.oneOf; delete o.oneOf; }
    if (o.const !== undefined) { o.enum = [o.const]; delete o.const; }
    if (o.type === "object" && o.properties) { const req = new Set(o.required ?? []); for (const [k2, v] of Object.entries(o.properties)) if (!req.has(k2)) o.properties[k2] = { anyOf: [v, { type: "null" }] };
      o.required = Object.keys(o.properties); o.additionalProperties = false; }
    if (o.prefixItems) { o.items = { type: "number" }; delete o.prefixItems; }  // tuples → number arrays (length checked by zod)
    return o;
  };
  return hoist(walk(js));
}
/** Azure counts enum values across the whole schema (cap 1000, measured): hoist repeated subschemas into $defs. */
function hoist(root) {
  const seen = new Map(); const count = (s) => { if (!s || typeof s !== "object") return; if (Array.isArray(s)) return s.forEach(count);
    if (s.enum || (s.type === "object" && s.properties)) { const k2 = JSON.stringify(s); seen.set(k2, (seen.get(k2) ?? 0) + 1); } Object.values(s).forEach(count); };
  count(root); const defs = {}; let n = 0; const name = new Map();
  for (const [k2, c] of seen) if (c >= 2 && k2.length > 40) name.set(k2, `d${n++}`);
  const rewrite = (s, top = false) => { if (!s || typeof s !== "object") return s; if (Array.isArray(s)) return s.map((x) => rewrite(x));
    const k2 = JSON.stringify(s); if (!top && name.has(k2)) { const id = name.get(k2); if (!defs[id]) { defs[id] = null; defs[id] = rewrite(JSON.parse(k2), true); } return { $ref: `#/$defs/${id}` }; }
    const o = {}; for (const [kk, v] of Object.entries(s)) o[kk] = rewrite(v); return o; };
  const out = rewrite(root, true); if (Object.keys(defs).length) out.$defs = defs; return out;
}
export function jsonSchemas() {
  const canonical = z.toJSONSchema(Scene, { target: "draft-2020-12" });
  return { canonical, strict: toStrict(z.toJSONSchema(Scene, { target: "draft-2020-12", io: "input" })) };
}

if (process.argv[1]?.endsWith("genui-scene-dsl.mjs") && process.argv.includes("--emit")) {
  const fs = await import("node:fs"); const path = await import("node:path"); const here = path.dirname(new URL(import.meta.url).pathname);
  const { canonical } = jsonSchemas(); canonical.$id = "https://taxila.app/schemas/scene@1.json"; canonical.title = "Taxila scene@1 (T2 scene DSL)";
  fs.writeFileSync(path.join(here, "genui-scene-dsl.schema.json"), JSON.stringify(canonical, null, 1) + "\n");
  console.log("wrote genui-scene-dsl.schema.json", JSON.stringify(canonical).length, "bytes");
}
