// explainer@1 — Taxila's narrated explainer-animation DSL: reference implementation for animation-video.md (2026-10-02).
// One source of truth for the LIVE path (client GSAP player, seconds) and the PRE-RENDER path (same player captured
// frame-by-frame to MP4). Contents: schema (zod) · 6x6 anchor grid · 8 template expanders (geometry/arithmetic computed in
// code, never by the LLM) · lint E1–E12 · state simulator + MoVer-style checks · compiler to a flat render plan.
// No eval, no DOM. Builds on scene@1 tokens (COLORS, SPRITES, BANDS) from genui-scene-dsl.mjs.
import { z } from "zod";
import { COLORS, SPRITES, BANDS, toStrict } from "./genui-scene-dsl.mjs";

// ───────────── grid, stage, limits ─────────────
// Code2Video: discretising the canvas into a 6x6 anchor grid lifted element-layout 45.2 → 82.8 (8x8 was worse).
export const STAGE = { w: 960, h: 540 };                 // 16:9 logical units; rendered at 854x480 for video
export const GRID = { cols: 6, rows: 6 };
export const LIMITS = { cast: 24, beats: 8, acts: 5, repeat: 20, note: 120, checks: 10 };
export const BAND_CAPS = { B1: { words: 14, total_ms: 60000 }, B2: { words: 18, total_ms: 60000 }, B3: { words: 24, total_ms: 90000 }, B4: { words: 28, total_ms: 90000 } };
const MOVE_ACTS = new Set(["move", "follow", "grow", "shrink", "split", "merge"]);
const cellW = STAGE.w / GRID.cols, cellH = STAGE.h / GRID.rows;
export function anchorXY(a) {                             // "C4" or region "A1:C2" → centre, size
  const p = (s) => [s.charCodeAt(0) - 65, +s[1] - 1]; const [a0, a1] = a.split(":"); const [c0, r0] = p(a0); const [c1, r1] = a1 ? p(a1) : [c0, r0];
  const cx = ((Math.min(c0, c1) + Math.max(c0, c1) + 1) / 2) * cellW, cy = ((Math.min(r0, r1) + Math.max(r0, r1) + 1) / 2) * cellH;
  return { x: cx, y: cy, w: (Math.abs(c1 - c0) + 1) * cellW, h: (Math.abs(r1 - r0) + 1) * cellH };
}

// ───────────── schema ─────────────
const ID = z.string().regex(/^[a-z][a-z0-9_]{0,23}$/);
const S = (n = 80) => z.string().min(1).max(n).regex(/^[^<>]*$/);
const L10n = z.strictObject({ en: S(), hi: S(), hi_latn: S().optional() });
const Anchor = z.string().regex(/^[A-F][1-6]$/);
const Region = z.string().regex(/^[A-F][1-6](:[A-F][1-6])?$/);
const Color = z.enum(Object.keys(COLORS).filter((k) => k !== "none"));
const Lib = z.enum(SPRITES);
const ActorCore = {
  id: ID, at: Region, role: z.enum(["content", "label", "context"]),
  kind: z.enum(["sprite", "shape", "text", "math", "repeat", "arrow", "path", "axis"]),
  lib: Lib.optional(), shape: z.enum(["circle", "rect", "ring", "line"]).optional(), color: Color.optional(),
  size: z.enum(["s", "m", "l"]).optional(), text: L10n.optional(), tex: S(60).optional(),
  n: z.number().int().min(1).max(LIMITS.repeat).optional(), layout: z.enum(["row", "grid", "cluster"]).optional(),
  from: ID.optional(), to: ID.optional(), pts: z.array(Anchor).min(2).max(8).optional(),
  axis: z.strictObject({ from: z.number().int().min(-50).max(50), to: z.number().int().min(-50).max(100), step: z.number().int().min(1).max(10) }).optional(),
  hidden: z.boolean().optional(),                         // starts invisible; an `enter` act reveals it
};
export const ActorLLM = z.strictObject(ActorCore);
// Internal-only fields, set by template code: exact coordinates and computed SVG geometry (never LLM-authored).
export const Actor = z.strictObject({ ...ActorCore, xy: z.tuple([z.number(), z.number()]).optional(), d: z.string().max(2000).optional(),
  kind: z.enum(["sprite", "shape", "text", "math", "repeat", "arrow", "path", "axis", "svgpath"]) });
export const Act = z.strictObject({
  do: z.enum(["enter", "exit", "draw", "write", "move", "follow", "grow", "shrink", "split", "merge", "count", "morph", "pulse", "focus", "set"]),
  target: ID, to: Region.optional(), into: ID.optional(), n: z.number().int().min(1).max(LIMITS.repeat).optional(),
  ms: z.number().int().min(150).max(6000).optional(), with: z.boolean().optional(), text: L10n.optional(),
});
export const Beat = z.strictObject({ id: ID, note: S(LIMITS.note), tts: L10n.optional(), cue: z.enum(["auto", "turn", "tap"]),
  hold_ms: z.number().int().min(0).max(12000).optional(), acts: z.array(Act).min(1).max(LIMITS.acts) });
export const Check = z.strictObject({ at: ID, expr: z.string().min(3).max(80) });
export const Probe = z.strictObject({ before: ID, kind: z.enum(["predict", "explain"]), ask: L10n });
const Meta = z.strictObject({ topic_id: z.string().regex(/^c[1-9]-[a-z]+-ch\d\d-t\d\d$/), band: z.enum(["B1", "B2", "B3", "B4"]), title: L10n, template: z.string().max(32).optional() });
const ExplainerShape = (A) => z.strictObject({ dsl: z.literal("explainer@1"), meta: Meta, bg: Color, cast: z.array(A).min(1).max(LIMITS.cast),
  beats: z.array(Beat).min(2).max(LIMITS.beats), checks: z.array(Check).max(LIMITS.checks), probe: Probe.optional() });
export const Explainer = ExplainerShape(Actor);
export const ExplainerLLM = ExplainerShape(ActorLLM);    // free arm: the model writes cast + beats itself

// ───────────── templates: the LLM fills slots + one note per beat; code computes everything checkable ─────────────
const Note = S(LIMITS.note);
const tcall = (name, slots) => z.strictObject({ template: z.literal(name), title: L10n, notes: z.array(Note).min(2).max(LIMITS.beats), slots: z.strictObject(slots),
  probe: z.strictObject({ before_beat: z.number().int().min(2).max(LIMITS.beats), kind: z.enum(["predict", "explain"]), ask: L10n }).optional() });
const Stage = z.strictObject({ label: L10n, sprite: Lib });
export const TemplateCall = z.discriminatedUnion("template", [
  tcall("combine-count@1", { a: z.number().int().min(0).max(10), b: z.number().int().min(0).max(10), op: z.enum(["add", "take_away"]), sprite: Lib }),
  tcall("cycle@1", { stages: z.array(Stage).min(3).max(6), centre: L10n.optional() }),
  tcall("process-steps@1", { steps: z.array(z.strictObject({ label: L10n, sprite: Lib, change: z.enum(["appear", "grow", "move_down", "move_up", "shrink"]) })).min(2).max(6) }),
  tcall("split-share@1", { whole: z.enum(["roti", "bar", "circle"]), parts: z.number().int().min(2).max(12), take: z.number().int().min(1).max(12) }),
  tcall("number-line-hop@1", { start: z.number().int().min(-20).max(20), hops: z.array(z.number().int().min(-20).max(20)).min(1).max(4) }),
  tcall("sun-shadow@1", { object: z.enum(["sci.pole", "sci.stick", "plant.tree", "place.house"]), times: z.array(z.enum(["morning", "noon", "evening"])).min(2).max(3) }),
  tcall("moon-phase@1", { phases: z.array(z.enum(["new", "waxing_crescent", "first_quarter", "waxing_gibbous", "full", "waning_gibbous", "last_quarter", "waning_crescent"])).min(2).max(8) }),
  tcall("path-trace@1", { stations: z.array(z.strictObject({ label: L10n })).min(2).max(6), mover: Lib, route: z.enum(["down", "right", "winding"]) }),
]);
export const TEMPLATE_NAMES = TemplateCall.options.map((o) => o.shape.template.value);
const L = (en, hi, hi_latn) => ({ en, hi, ...(hi_latn ? { hi_latn } : {}) });
const deg = (d) => (d * Math.PI) / 180;
function beatsFrom(notes, actsList, cue = "turn") {        // one note per beat; extra notes are dropped, missing ones get a shape
  return actsList.map((acts, i) => ({ id: `b${i + 1}`, note: notes[i] ?? "describe what just changed; ask what comes next", cue, acts }));
}
export function expandTemplate(call, meta) {
  const s = call.slots; const base = (cast, actsList, checks, bg = "bg") => {
    const ex = { dsl: "explainer@1", meta: { ...meta, title: call.title, template: call.template }, bg, cast, beats: beatsFrom(call.notes, actsList), checks };
    if (call.probe && call.probe.before_beat <= ex.beats.length) ex.probe = { before: `b${call.probe.before_beat}`, kind: call.probe.kind, ask: call.probe.ask };
    return ex; };
  switch (call.template) {
    case "combine-count@1": {
      const c = s.op === "add" ? s.a + s.b : s.a - s.b; const sym = s.op === "add" ? `${s.a} + ${s.b} = ${c}` : `${s.a} − ${s.b} = ${c}`;
      const cast = [{ id: "ga", kind: "repeat", lib: s.sprite, n: Math.max(1, s.a), layout: "cluster", at: "B4", role: "content", hidden: true, color: "c1d" },
        { id: "gb", kind: "repeat", lib: s.sprite, n: Math.max(1, s.b), layout: "cluster", at: "E4", role: "content", hidden: true, color: "c3d" },
        { id: "sym", kind: "math", tex: sym, at: "C2:D2", role: "content", hidden: true, size: "l" }];
      const acts = s.op === "add"
        ? [[{ do: "enter", target: "ga", ms: 900 }, { do: "count", target: "ga", n: Math.max(1, s.a) }], [{ do: "enter", target: "gb", ms: 900 }, { do: "count", target: "gb", n: Math.max(1, s.b) }],
          [{ do: "merge", target: "gb", into: "ga", ms: 1500 }], [{ do: "count", target: "ga", n: c }], [{ do: "write", target: "sym", ms: 1500 }]]
        : [[{ do: "enter", target: "ga", ms: 900 }, { do: "count", target: "ga", n: s.a }], [{ do: "split", target: "ga", n: s.b, ms: 1200 }], [{ do: "count", target: "ga", n: c }], [{ do: "write", target: "sym", ms: 1500 }]];
      if (s.op === "take_away") cast.splice(1, 1);
      return base(cast, acts, [{ at: `b${acts.length - 1}`, expr: `count(ga)==${c}` }, { at: `b${acts.length}`, expr: "visible(sym)" }]);
    }
    case "cycle@1": {
      const n = s.stages.length; const R = 190, cx = STAGE.w / 2, cy = STAGE.h / 2 + 10;
      const cast = s.stages.flatMap((st, i) => { const a = deg(-90 + (360 * i) / n); const x = cx + R * 1.35 * Math.cos(a), y = cy + R * Math.sin(a);
        return [{ id: `s${i}`, kind: "sprite", lib: st.sprite, at: "C3", xy: [x, y - 14], role: "content", hidden: true },
          { id: `l${i}`, kind: "text", text: st.label, at: "C3", xy: [x, y + 44], role: "label", hidden: true, size: "s" }]; });
      for (let i = 0; i < n; i++) cast.push({ id: `a${i}`, kind: "arrow", from: `s${i}`, to: `s${(i + 1) % n}`, at: "C3", role: "content", hidden: true });
      if (s.centre) cast.push({ id: "ctr", kind: "text", text: s.centre, at: "C3:D4", role: "label", hidden: true, size: "m" });
      const acts = s.stages.map((_, i) => [{ do: "enter", target: `s${i}`, ms: 700 }, { do: "write", target: `l${i}`, ms: 700, with: true }, ...(i > 0 ? [{ do: "draw", target: `a${i - 1}`, ms: 900 }] : [])]);
      acts.push([{ do: "draw", target: `a${n - 1}`, ms: 900 }, ...(s.centre ? [{ do: "write", target: "ctr", ms: 900 }] : []), { do: "pulse", target: "s0", ms: 800 }]);
      return base(cast, acts, [{ at: `b${acts.length}`, expr: `visible(a${n - 1})` }]);
    }
    case "process-steps@1": {
      const n = s.steps.length; const cast = []; const acts = [];
      s.steps.forEach((st, i) => { const x = ((i + 0.5) * STAGE.w) / n; cast.push({ id: `p${i}`, kind: "sprite", lib: st.sprite, at: "A3", xy: [x, 250], role: "content", hidden: true },
        { id: `t${i}`, kind: "text", text: st.label, at: "A5", xy: [x, 400], role: "label", hidden: true, size: "s" });
        if (i > 0) cast.push({ id: `ar${i}`, kind: "arrow", from: `p${i - 1}`, to: `p${i}`, at: "A3", role: "content", hidden: true });
        const ch = { appear: [], grow: [{ do: "grow", target: `p${i}`, ms: 1200 }], shrink: [{ do: "shrink", target: `p${i}`, ms: 1200 }],
          move_down: [{ do: "move", target: `p${i}`, to: `${"ABCDEF"[Math.min(5, Math.floor((x / STAGE.w) * 6))]}4`, ms: 1200 }],
          move_up: [{ do: "move", target: `p${i}`, to: `${"ABCDEF"[Math.min(5, Math.floor((x / STAGE.w) * 6))]}2`, ms: 1200 }] }[st.change];
        acts.push([...(i > 0 ? [{ do: "draw", target: `ar${i}`, ms: 700 }] : []), { do: "enter", target: `p${i}`, ms: 700 }, { do: "write", target: `t${i}`, ms: 700, with: true }, ...ch]); });
      const checks = s.steps.flatMap((st, i) => st.change === "move_down" ? [{ at: `b${i + 1}`, expr: `moved(p${i},down)` }] : st.change === "move_up" ? [{ at: `b${i + 1}`, expr: `moved(p${i},up)` }] : []);
      return base(cast, acts, [...checks, { at: `b${n}`, expr: `visible(p${n - 1})` }]);
    }
    case "split-share@1": {
      const take = Math.min(s.take, s.parts); const cast = [{ id: "whole", kind: "shape", shape: s.whole === "bar" ? "rect" : "circle", color: s.whole === "roti" ? "c4" : "c3", at: "B2:C5", role: "content", hidden: true, n: 1 },
        { id: "frac", kind: "math", tex: `${take}/${s.parts}`, at: "E3:F4", role: "content", hidden: true, size: "l" }];
      const acts = [[{ do: "enter", target: "whole", ms: 900 }], [{ do: "split", target: "whole", n: s.parts, ms: 1500 }], [{ do: "focus", target: "whole", n: take, ms: 900 }], [{ do: "write", target: "frac", ms: 1200 }]];
      return base(cast, acts, [{ at: "b2", expr: `parts(whole)==${s.parts}` }, { at: "b4", expr: "visible(frac)" }]);
    }
    case "number-line-hop@1": {
      let pos = s.start; const ends = s.hops.map((h) => (pos += h)); const all = [s.start, ...ends]; const lo = Math.min(-2, ...all) - 1, hi2 = Math.max(2, ...all) + 1;
      const xOf = (v) => 60 + ((v - lo) / (hi2 - lo)) * (STAGE.w - 120);
      const cast = [{ id: "ax", kind: "axis", axis: { from: lo, to: hi2, step: 1 }, at: "A4:F4", role: "content" },
        { id: "mk", kind: "shape", shape: "circle", color: "c1d", at: "A4", xy: [xOf(s.start), 300], role: "content", hidden: true, size: "s" }];
      const acts = [[{ do: "enter", target: "mk", ms: 600 }]];
      ends.forEach((e, i) => { cast.push({ id: `h${i}`, kind: "svgpath", at: "A4", role: "content", hidden: true, d: `M${xOf(all[i])},290 Q${(xOf(all[i]) + xOf(e)) / 2},${190} ${xOf(e)},290` });
        acts.push([{ do: "draw", target: `h${i}`, ms: 900 }, { do: "move", target: "mk", to: "A4", ms: 900, with: true, _x: xOf(e) }]); });
      cast.push({ id: "eq", kind: "math", tex: `${s.start} ${s.hops.map((h) => (h < 0 ? `− ${-h}` : `+ ${h}`)).join(" ")} = ${pos}`, at: "B2:E2", role: "content", hidden: true, size: "l" });
      acts.push([{ do: "write", target: "eq", ms: 1400 }]);
      return base(cast, acts, [{ at: `b${acts.length - 1}`, expr: `x(mk)==${Math.round(xOf(pos))}` }]);
    }
    case "sun-shadow@1": {                                 // geometry computed: altitude → shadow length h/tan(alt), pointing away from the sun
      const ALT = { morning: { alt: 20, az: -1 }, noon: { alt: 70, az: 0.15 }, evening: { alt: 20, az: 1 } };
      const gx = STAGE.w / 2, gy = 400, hgt = 130; const cast = [{ id: "ground", kind: "shape", shape: "line", at: "A5:F5", xy: [gx, gy], role: "context" },
        { id: "obj", kind: "sprite", lib: s.object, at: "C4", xy: [gx, gy - hgt / 2], role: "content" }];
      const acts = []; const lens = [];
      s.times.forEach((t, i) => { const { alt, az } = ALT[t]; const len = Math.min(420, hgt / Math.tan(deg(alt))); lens.push(len); const dir = az === 0 ? 1 : -Math.sign(az);
        const sx = gx + az * 380, sy = gy - 40 - Math.sin(deg(alt)) * 300; const tip = gx + dir * len;
        cast.push({ id: `sun${i}`, kind: "shape", shape: "circle", color: "sun", at: "A1", xy: [sx, sy], role: "content", hidden: true, size: "m" },
          { id: `sh${i}`, kind: "svgpath", at: "C5", role: "content", hidden: true, d: `M${gx - 6},${gy} L${tip},${gy + 6} L${tip},${gy + 14} L${gx + 6},${gy + 10} Z` },
          { id: `tl${i}`, kind: "text", text: L(t, { morning: "सुबह", noon: "दोपहर", evening: "शाम" }[t], { morning: "subah", noon: "dopahar", evening: "shaam" }[t]), at: "A1", xy: [sx, sy + 48], role: "label", hidden: true, size: "s" });
        acts.push([...(i > 0 ? [{ do: "exit", target: `sun${i - 1}`, ms: 400 }, { do: "exit", target: `sh${i - 1}`, ms: 400, with: true }, { do: "exit", target: `tl${i - 1}`, ms: 400, with: true }] : []),
          { do: "enter", target: `sun${i}`, ms: 700 }, { do: "write", target: `tl${i}`, ms: 500, with: true }, { do: "draw", target: `sh${i}`, ms: 1100 }]); });
      return base(cast, acts, s.times.map((t, i) => ({ at: `b${i + 1}`, expr: `visible(sh${i})` })), "sky");
    }
    case "moon-phase@1": {                                 // lit fraction & side computed from the phase angle
      const PH = { new: 0, waxing_crescent: 45, first_quarter: 90, waxing_gibbous: 135, full: 180, waning_gibbous: 225, last_quarter: 270, waning_crescent: 315 };
      const R = 70, cx = STAGE.w / 2, cy = 250; const cast = [{ id: "disc", kind: "shape", shape: "circle", color: "ink2", at: "C3:D4", xy: [cx, cy], role: "content", size: "l" }];
      const acts = s.phases.map((p, i) => { const th = deg(PH[p]); const k = Math.cos(th); const waxing = PH[p] <= 180; const sweepOuter = waxing ? 1 : 0;
        const rx = Math.abs(k) * R; const inner = (k > 0) === waxing ? 0 : 1; // terminator ellipse bulges toward the dark side when <half lit
        const d = PH[p] === 0 ? `M${cx},${cy - R} Z` : `M${cx},${cy - R} A${R},${R} 0 0 ${sweepOuter} ${cx},${cy + R} A${rx.toFixed(1)},${R} 0 0 ${inner} ${cx},${cy - R} Z`;
        cast.push({ id: `ph${i}`, kind: "svgpath", d, at: "C3:D4", role: "content", hidden: true, color: "chalk" in COLORS ? "chalk" : "surface" },
          { id: `pl${i}`, kind: "text", text: L(p.replace(/_/g, " "), p.replace(/_/g, " "), p.replace(/_/g, " ")), at: "C5:D5", role: "label", hidden: true, size: "s" });
        return [...(i > 0 ? [{ do: "exit", target: `ph${i - 1}`, ms: 500 }, { do: "exit", target: `pl${i - 1}`, ms: 300, with: true }] : []), { do: "enter", target: `ph${i}`, ms: 900 }, { do: "write", target: `pl${i}`, ms: 600, with: true }]; });
      return base(cast, acts, s.phases.map((_, i) => ({ at: `b${i + 1}`, expr: `visible(ph${i})` })), "board" in COLORS ? "board" : "ink");
    }
    case "path-trace@1": {
      const n = s.stations.length; const pts = s.stations.map((_, i) => s.route === "down" ? [STAGE.w / 2, 70 + (i * 400) / Math.max(1, n - 1)]
        : s.route === "right" ? [80 + (i * 800) / Math.max(1, n - 1), 270] : [120 + (i * 720) / Math.max(1, n - 1), i % 2 ? 380 : 140]);
      const cast = [{ id: "route", kind: "svgpath", d: "M" + pts.map((p) => p.join(",")).join(" L"), at: "A1:F6", role: "content", hidden: true },
        ...s.stations.map((st, i) => ({ id: `st${i}`, kind: "text", text: st.label, at: "A1", xy: [pts[i][0] + (s.route === "down" ? 150 : 0), pts[i][1] + (s.route === "down" ? 0 : 42)], role: "label", hidden: true, size: "s" })),
        { id: "mv", kind: "sprite", lib: s.mover, at: "A1", xy: pts[0], role: "content", hidden: true, size: "s" }];
      const acts = [[{ do: "draw", target: "route", ms: 1500 }, { do: "enter", target: "mv", ms: 500 }, { do: "write", target: "st0", ms: 600, with: true }],
        ...pts.slice(1).map((p, i) => [{ do: "follow", target: "mv", ms: 1400, _xy: p }, { do: "write", target: `st${i + 1}`, ms: 600, with: true }])];
      return base(cast, acts, [{ at: `b${acts.length}`, expr: `visible(st${n - 1})` }]);
    }
  }
  throw new Error(`unknown template ${call.template}`);
}

// ───────────── simulator + checks (MoVer-style predicates over per-beat end states) ─────────────
export function simulate(ex) {
  const st = Object.fromEntries(ex.cast.map((a) => { const p = a.xy ? { x: a.xy[0], y: a.xy[1] } : anchorXY(a.at); return [a.id, { vis: !a.hidden, x: p.x, y: p.y, s: 1, n: a.n ?? 1, parts: 1, x0: p.x, y0: p.y }]; }));
  const ends = {}; const durations = {};
  for (const b of ex.beats) {
    let t = 0, cursor = 0; for (const k of Object.values(st)) { k.bx = k.x; k.by = k.y; }
    for (const a of b.acts) { const o = st[a.target]; const ms = a.ms ?? 800; const start = a.with ? cursor : t; cursor = start; t = Math.max(t, start + ms);
      if (!o) continue;
      if (a.do === "enter" || a.do === "draw" || a.do === "write") o.vis = true; else if (a.do === "exit") o.vis = false;
      else if (a.do === "move" && a._x !== undefined) o.x = a._x; else if (a.do === "move" && a.to) { const p = anchorXY(a.to); o.x = p.x; o.y = p.y; }
      else if (a.do === "follow" && (a._xy || a.to)) { const q = a._xy ? { x: a._xy[0], y: a._xy[1] } : anchorXY(a.to); o.x = q.x; o.y = q.y; }
      else if (a.do === "grow") o.s *= 1.6; else if (a.do === "shrink") o.s *= 0.6;
      else if (a.do === "split" && ex.cast.find((c) => c.id === a.target)?.kind === "repeat") o.n = Math.max(0, o.n - (a.n ?? 0));
      else if (a.do === "split") o.parts = a.n ?? 2;
      else if (a.do === "merge" && a.into && st[a.into]) { st[a.into].n += o.n; o.vis = false; o.n = 0; } }
    durations[b.id] = Math.max(t, b.hold_ms ?? 0);
    ends[b.id] = JSON.parse(JSON.stringify(st));
  }
  return { ends, durations, total_ms: Object.values(durations).reduce((x, y) => x + y, 0) };
}
const CHECK_RE = /^(count|parts|visible|moved|grew|x|above|below)\((\w+)(?:,(\w+))?\)(?:(==|<|>)(-?\d+))?$/;
export function evalCheck(c, sim) {
  const s = sim.ends[c.at]; if (!s) return { ok: false, why: `unknown beat ${c.at}` };
  const m = c.expr.replace(/\s+/g, "").match(CHECK_RE); if (!m) return { ok: false, why: `unparsed '${c.expr}'` };
  const [, fn, a, b, op, v] = m; const o = s[a]; if (!o) return { ok: false, why: `unknown actor ${a}` };
  const cmp = (x) => op === "==" ? x === +v : op === "<" ? x < +v : op === ">" ? x > +v : !!x;
  const val = { count: o.n, parts: o.parts, visible: o.vis, x: Math.round(o.x), grew: o.s > 1,
    moved: b === "down" ? o.y > o.by : b === "up" ? o.y < o.by : b === "left" ? o.x < o.bx : o.x > o.bx,
    above: s[b] ? o.y < s[b].y : false, below: s[b] ? o.y > s[b].y : false }[fn];
  return { ok: fn === "visible" || fn === "moved" || fn === "grew" || fn === "above" || fn === "below" ? !!val : cmp(val), got: val };
}

// ───────────── lint E1–E12 ─────────────
export function lint(ex) {
  const errs = []; const E = (code, path, msg) => errs.push({ code, path, msg }); const ids = new Set(ex.cast.map((a) => a.id));
  const byId = Object.fromEntries(ex.cast.map((a) => [a.id, a])); const caps = BAND_CAPS[ex.meta.band];
  if (ids.size !== ex.cast.length) E("E1.dup_id", "/cast", "duplicate actor id");
  ex.cast.forEach((a, i) => { if (a.kind === "arrow" && (!ids.has(a.from ?? "") || !ids.has(a.to ?? ""))) E("E1.ref", `/cast/${i}`, "arrow endpoints must be actors");
    if (a.kind === "sprite" && !a.lib) E("E1.sprite_lib", `/cast/${i}`, "sprite needs lib"); if (a.kind === "repeat" && (!a.n || !a.lib)) E("E1.repeat", `/cast/${i}`, "repeat needs n and lib");
    if ((a.kind === "text") && !a.text) E("E1.text", `/cast/${i}`, "text actor needs text"); if (a.kind === "math" && !a.tex) E("E1.math", `/cast/${i}`, "math needs tex"); });
  const firstUse = {};
  ex.beats.forEach((b, i) => { const P = `/beats/${i}`; let movers = 0;
    b.acts.forEach((a, j) => { if (!ids.has(a.target)) E("E1.target", `${P}/acts/${j}`, `unknown target '${a.target}'`);
      const t = byId[a.target]; if (t?.role === "context" && MOVE_ACTS.has(a.do)) E("E4.decor_motion", `${P}/acts/${j}`, "context/decoration may not move (seductive detail)");
      if (MOVE_ACTS.has(a.do) && (a.with || j === 0 || movers === 0)) movers++; if (a.do === "pulse" && (a.ms ?? 800) < 333) E("E9.flash", `${P}/acts/${j}`, "pulse faster than 3 Hz");
      if (a.do === "merge" && !ids.has(a.into ?? "")) E("E1.merge_into", `${P}/acts/${j}`, "merge needs into");
      if (a.do === "count" && t?.kind !== "repeat") E("E6.count_kind", `${P}/acts/${j}`, "count only on repeat actors");
      firstUse[a.target] ??= i; });
    if (movers > 2) E("E3.movers", P, `${movers} simultaneous movers > 2 (apprehension)`);
    if (!b.acts.some((a) => byId[a.target]?.role === "content")) E("E5.empty_beat", P, "beat changes no content actor (narration without a visual anchor)");
    const words = b.note.trim().split(/\s+/).length; if (words > caps.words) E("E7.note_len", `${P}/note`, `${words} words > ${caps.words} for ${ex.meta.band}`);
    if (/["“][^"”]{3,}["”]|(^|\s)['‘][^'’]{3,}['’](\s|$)/.test(b.note)) E("E8.note_is_a_line", `${P}/note`, "notes are shapes, not quotable lines (sentence-shaped text gets recited)"); });
  ex.cast.forEach((a) => { if (a.hidden && firstUse[a.id] === undefined && a.role !== "context") E("E10.never_shown", `/cast/${a.id}`, "hidden actor is never revealed"); });
  let sim = null; try { sim = simulate(ex); } catch (e) { E("E11.sim", "/", String(e.message)); }
  if (sim) { const seen = new Set();                         // E2: two visible content actors on one anchor cell at a beat end
    for (const [bid, st] of Object.entries(sim.ends)) { const cells = new Map();
      for (const a of ex.cast) if (a.role === "content" && !a.xy && a.kind !== "arrow" && a.kind !== "svgpath" && /^[A-F][1-6]$/.test(a.at) && st[a.id]?.vis) {
        const k2 = `${a.at}`; if (cells.has(k2) && !seen.has(a.id)) { seen.add(a.id); E("E2.overlap", `/cast/${a.id}`, `'${a.id}' and '${cells.get(k2)}' share anchor ${a.at} at ${bid}`); } else cells.set(k2, a.id); } }
    if (sim.total_ms > caps.total_ms) E("E7.duration", "/beats", `${sim.total_ms} ms > ${caps.total_ms}`);
    ex.beats.forEach((b, i) => b.acts.forEach((a, j) => { if (a.do === "count" && a.n !== undefined) { const end = sim.ends[b.id][a.target]; if (end && end.n !== a.n) E("E6.count_mismatch", `/beats/${i}/acts/${j}`, `count says ${a.n} but ${end.n} are on stage`); } }));
    ex.checks.forEach((c, i) => { const r = evalCheck(c, sim); if (!r.ok) E("E12.check", `/checks/${i}`, `${c.expr} @${c.at} failed (${r.why ?? JSON.stringify(r.got)})`); }); }
  if (ex.probe && (ex.probe.before === ex.beats[0].id || !ex.beats.some((b) => b.id === ex.probe.before))) E("E11.probe", "/probe", "predict probe must precede a later reveal beat");
  return { errs, sim };
}
const stripNulls = (v) => Array.isArray(v) ? v.map(stripNulls) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null).map(([k2, x]) => [k2, stripNulls(x)])) : v;
export function validateCall(raw, meta) {
  const p = TemplateCall.safeParse(stripNulls(raw)); if (!p.success) return { ok: false, stage: "schema", errs: p.error.issues.slice(0, 6).map((i) => ({ code: "E0.schema", path: "/" + i.path.join("/"), msg: i.message })) };
  const ex = expandTemplate(p.data, meta); const { errs, sim } = lint(ex); return { ok: errs.length === 0, stage: "lint", errs, ex, sim };
}
export function validateFree(raw) {
  const p = ExplainerLLM.safeParse(stripNulls(raw)); if (!p.success) return { ok: false, stage: "schema", errs: p.error.issues.slice(0, 6).map((i) => ({ code: "E0.schema", path: "/" + i.path.join("/"), msg: i.message })) };
  const { errs, sim } = lint(p.data); return { ok: errs.length === 0, stage: "lint", errs, ex: p.data, sim };
}
export const TemplateEnvelope = z.strictObject({ call: TemplateCall });   // Azure strict mode rejects a top-level anyOf (measured)
export const jsonSchemas = () => ({ templateCall: toStrict(z.toJSONSchema(TemplateEnvelope, { target: "draft-2020-12", io: "input" })),
  explainerLLM: toStrict(z.toJSONSchema(ExplainerLLM, { target: "draft-2020-12", io: "input" })) });

// ───────────── compiler → flat render plan (consumed by the GSAP player, live and for frame capture) ─────────────
const SIZE = { s: 0.7, m: 1, l: 1.4 };
export function compile(ex, { lang = "hi_latn", retime = null } = {}) {
  const txt = (l) => (l ? l[lang] ?? l.en : "");
  const els = []; const pos = {};
  for (const a of ex.cast) { const p = a.xy ? { x: a.xy[0], y: a.xy[1], w: 160, h: 90 } : anchorXY(a.at); pos[a.id] = p; const k = SIZE[a.size ?? "m"];
    const col = COLORS[a.color ?? (a.role === "label" ? "ink" : "c3d")] ?? "#1F1A14"; const base = { id: a.id, op: a.hidden ? 0 : 1, x: p.x, y: p.y };
    if (a.kind === "repeat") { const n = a.n ?? 1; const per = a.layout === "row" ? n : Math.ceil(Math.sqrt(n)); const gap = 42 * k;
      els.push({ ...base, t: "g", kids: Array.from({ length: n }, (_, i) => ({ t: "circle", cx: ((i % per) - (per - 1) / 2) * gap, cy: (Math.floor(i / per) - (Math.ceil(n / per) - 1) / 2) * gap, r: 16 * k, fill: col, lib: a.lib })) }); }
    else if (a.kind === "sprite") els.push({ ...base, t: "g", kids: [{ t: "circle", cx: 0, cy: 0, r: 34 * k, fill: COLORS.c2, stroke: COLORS.c2d }, { t: "text", x: 0, y: 6, s: 14 * k, txt: a.lib.split(".")[1] }] });
    else if (a.kind === "text" || a.kind === "math") els.push({ ...base, t: "text", s: (a.kind === "math" ? 40 : 22) * k, txt: a.kind === "math" ? a.tex : txt(a.text), wipe: true });
    else if (a.kind === "shape") els.push({ ...base, t: a.shape === "rect" ? "rect" : a.shape === "line" ? "line" : "circle", w: p.w * 0.8, h: p.h * 0.5, r: Math.min(p.w, p.h) * 0.4 * (a.size ? SIZE[a.size] / 2 : 1), fill: col });
    else if (a.kind === "arrow") els.push({ id: a.id, op: a.hidden ? 0 : 1, t: "arrow", from: a.from, to: a.to, dash: true });
    else if (a.kind === "svgpath") els.push({ id: a.id, op: a.hidden ? 0 : 1, t: "path", d: a.d, fill: a.d.endsWith("Z") ? (COLORS[a.color] ?? COLORS.line) : "none", stroke: COLORS.ink2, dash: true, x: 0, y: 0 });
    else if (a.kind === "axis") els.push({ ...base, t: "axis", from: a.axis.from, to: a.axis.to, step: a.axis.step, len: STAGE.w - 120 });
    else if (a.kind === "path") els.push({ id: a.id, op: a.hidden ? 0 : 1, t: "path", d: "M" + a.pts.map((q) => { const z2 = anchorXY(q); return `${z2.x},${z2.y}`; }).join(" L"), fill: "none", stroke: COLORS.ink2, dash: true, x: 0, y: 0 }); }
  const tw = []; const labels = {}; let T = 0;
  for (const b of ex.beats) { labels[b.id] = T / 1000; let t = 0, cursor = 0;
    for (const a of b.acts) { const ms = a.ms ?? 800; const start = a.with ? cursor : t; cursor = start; t = Math.max(t, start + ms); const at = (T + start) / 1000, d = ms / 1000; const p = pos[a.target];
      const push = (to, extra = {}) => tw.push({ at, d, id: a.target, to, ...extra });
      if (!p) continue;                                    // unknown target: lint E1 already reports it; the compiler stays total
      if (a.do === "enter" || a.do === "write") push({ opacity: 1 }, a.do === "write" ? { wipe: true } : {}); else if (a.do === "exit") push({ opacity: 0 });
      else if (a.do === "draw") push({ opacity: 1 }, { draw: true });
      else if (a.do === "move" && a._x !== undefined) push({ x: a._x - p.x }); else if ((a.do === "move" || a.do === "follow") && (a.to || a._xy)) { const q = a._xy ? { x: a._xy[0], y: a._xy[1] } : anchorXY(a.to); push({ x: q.x - p.x, y: q.y - p.y }); } else if (a.do === "grow") push({ scale: 1.6 }); else if (a.do === "shrink") push({ scale: 0.6 });
      else if (a.do === "pulse") push({ scale: 1.15 }, { yoyo: true }); else if (a.do === "count") push({}, { count: a.n });
      else if (a.do === "merge" && pos[a.into]) { const q = pos[a.into]; push({ x: q.x - p.x + 60, y: q.y - p.y }); }
      else if (a.do === "split") push({}, { split: a.n }); else if (a.do === "focus") push({}, { focus: a.n ?? 1 }); }
    const natural = Math.max(t, b.hold_ms ?? 0); const span = retime?.[b.id] ? Math.max(natural, retime[b.id]) : natural; T += span + 250; }
  return { stage: STAGE, bg: COLORS[ex.bg] ?? COLORS.bg, els, tweens: tw, labels, duration: T / 1000 };
}
