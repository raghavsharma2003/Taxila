// r8 Games, kon/name gate 1 (night rulings 2026-11-11, kon/name 3 and 4), HEADLESS on every generated level: the name view is
// mounted with the real painter on a canvas stand-in (no drawing; text measured at 0.6 em, the mono chips' own width) at the
// world boxes of 360 × 640 and 1366 × 768, and played to each screen a ruling is about. Ruling 3: the name chip (say: the
// name she builds; find: the asked name) and find's "≠" row (after every wrong arc) keep one letter height clear of every
// letter: the room between a chip's box (or the "≠") and a letter's box is at least the letter's own size. Ruling 4: on say's
// vertex-first play-out, a dashed ray drawn beside a solid line it lies on runs at least 8 px from it, centre to centre (it was
// 4.5 board px, about 4 px at 360: one thick line). The browser check (tests/r8-games-kon-layout.test.mjs) holds the same two
// on the served levels as the browser draws them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { konLogic } from "../src/play/families/kon/kon.logic.ts";
import { Painter, ART, newAudit } from "../src/play/core/styles.ts";
import { register } from "node:module";

// the view imports the words as JSON (a load hook adds the import attribute, as tests/r7-games-aakash.test.mjs does)
register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) { if (url.endsWith(".json")) return next(url, { ...ctx, importAttributes: { ...ctx.importAttributes, type: "json" } }); return next(url, ctx); }`));
const { makeNameView, RAY_OFF } = await import("../src/play/families/kon/kon.name.view.ts");

/** the world boxes kon/name is drawn in (CSS px), measured in the browser (tests/r8-games-kon-layout.test.mjs refuses a box
 *  that differs), and a spread of heights round the phone's, so a few px of chrome either way changes nothing */
export const NAME_WORLD = { "360x640": { say: { w: 360, h: 399 }, find: { w: 360, h: 399 } }, "1366x768": { say: { w: 1005, h: 768 }, find: { w: 1005, h: 768 } } };
const BOXES = (goal) => [NAME_WORLD["360x640"][goal], NAME_WORLD["1366x768"][goal], ...[300, 330, 370, 420].map((h) => ({ w: 360, h }))];

/** a 2D context that draws nothing and measures text at 0.6 em (the chips' mono face; the letters' measure is near it). It
 *  keeps every circular arc it is asked to stroke or fill (centre, radius, start and end in canvas radians, and the line dash
 *  in force when it was stroked), in `ctx.arcs` */
function fakeCtx() {
  const st = { font: "16px x" }, stack = [];
  let dash = [], path = [];
  const arcs = [];
  return new Proxy(st, {
    get(t, k) {
      if (k === "measureText") return (s) => ({ width: 0.6 * Number(/(\d+(?:\.\d+)?)px/.exec(t.font)?.[1] ?? 16) * [...s].length });
      if (k === "arcs") return arcs;
      if (k === "setLineDash") return (d) => { dash = [...d]; };
      if (k === "save") return () => stack.push(dash);
      if (k === "restore") return () => { dash = stack.pop() ?? []; };
      if (k === "beginPath") return () => { path = []; };
      if (k === "arc") return (x, y, r, a0, a1, ccw) => path.push({ x, y, r, a0, a1, ccw: !!ccw });
      if (k === "stroke" || k === "fill") return () => { for (const a of path) arcs.push({ ...a, op: k, dash: k === "stroke" ? dash : [] }); };
      if (k in t) return t[k];
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
const req = (goal, seed, fade) => ({ family: "kon", mode: "name", goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade, mis: {}, misMap: { "vertex-name": "k-vn" }, grammar: {}, recent: [], seed });
// (say: and the levels a session is steered to once vertex-name is suspected: dc-r8-gate2-discriminating-level, the focus)
const levels = (goal) => [1, 2, 3].flatMap((f) => [1, 7, 42, 99, 123, 2026].flatMap((sd) => [req(goal, sd, f), ...(goal === "say" ? [{ ...req(goal, sd, f), focus: "k-vn" }] : [])].flatMap((r) => konLogic.generate(r).map((c) => konLogic.validate(c.level)).filter(Boolean))));

/** mount the view at w × h, play `acts`, and return the audit of a frame drawn 2 s after the last act (every play-out done) */
function screen(level, acts, w, h, out = {}) {
  const audit = newAudit("kagaz", false), P = new Painter(ART.kagaz, audit, false), c = fakeCtx();
  out.ctx = c;
  const api = { w, h, dpr: 1, t: 0, P, art: ART.kagaz, tw: null, fx: { burst() {}, shake() {} }, reduced: true, young: false, sfx() {}, target() {}, hit: () => null, invalidate() {}, layer() {} };
  const ctl = { state: konLogic.init(level), acts: [], finger() {}, dispatch() {} };
  const view = makeNameView(api, { level, ctl, lang: "hinglish", changed() {} });
  view.layout(w, h);
  out.view = view;
  acts.forEach((a, i) => {
    const r = konLogic.apply(level, ctl.state, a, i + 1);
    ctl.state = r.state; ctl.acts.push({ seq: i + 1, t: 0, via: "touch", act: a });
    view.react(r.moments, r.refused);
  });
  api.t = 2;
  audit.texts = []; audit.marks = []; audit.segs = []; audit.uses = []; audit.targets = [];
  view.draw(c);
  return audit;
}
const isLetter = (t) => /^[A-Z]$/.test(t.s);
const box = (t) => ({ x: t.x - (t.align === "left" ? -t.w / 2 : t.align === "right" ? t.w / 2 : 0), y: t.y, w: t.w, h: t.px * 1.2 });
/** the room between two boxes given by centre and size (negative: they overlap) */
const room = (a, b) => Math.max(Math.abs(a.x - b.x) - (a.w + b.w) / 2, Math.abs(a.y - b.y) - (a.h + b.h) / 2);
/** ruling 3: every chip and the "≠" keep one letter height clear of every letter */
function letterFaults(audit, tag, only = () => true) {
  const out = [], L = audit.texts.filter(isLetter);
  const things = [...audit.marks.filter((m) => m.kind === "chip").filter(only).map((m) => ({ s: "chip", x: m.x + m.w / 2, y: m.y + m.h / 2, w: m.w, h: m.h })),
    ...audit.texts.filter((t) => t.s === "≠").map((t) => ({ s: "≠", ...box(t) }))];
  for (const k of things) for (const l of L) { const g = room(k, box(l)); if (g < l.px - 0.01) out.push(`${tag}: ${k.s} ${g.toFixed(1)} px from letter ${l.s} (one letter height is ${l.px})`); }
  return out;
}

test("night ruling kon/name 3: the name chip keeps one letter height clear of every letter (say and find, every generated level, 360 and 1366)", () => {
  const faults = [];
  let n = 0;
  for (const goal of ["say", "find"]) for (const level of levels(goal)) for (const { w, h } of BOXES(goal)) {
    const sol = konLogic.solve(level);
    // say: the name half built (the chip shows); find: the first screen (the asked name)
    const acts = goal === "say" ? sol.slice(0, 2) : [];
    const a = screen(level, acts, w, h);
    assert.ok(a.marks.some((m) => m.kind === "chip"), `${level.levelId} ${w}x${h}: no name chip`);
    faults.push(...letterFaults(a, `${level.levelId} ${goal} ${w}x${h}`));
    n++;
  }
  assert.ok(n >= 200, `${n} screens`);
  assert.deepEqual(faults.slice(0, 20), [], `${faults.length} faults`);
});

test("night ruling kon/name 3: find's \"≠\" row keeps one letter height clear of every letter, after every wrong arc (every generated level, 360 and 1366)", () => {
  const faults = [];
  let n = 0;
  for (const level of levels("find")) for (const { w, h } of BOXES("find")) for (let k = 0; k < 5; k++) {
    if (k === level.params.ask) continue;
    const a = screen(level, [{ kind: "arc", at: k }], w, h);
    assert.ok(a.texts.some((t) => t.s === "≠"), `${level.levelId} arc ${k}: no "≠" row`);
    faults.push(...letterFaults(a, `${level.levelId} arc ${k} ${w}x${h}`));
    n++;
  }
  assert.ok(n >= 400, `${n} screens`);
  assert.deepEqual(faults.slice(0, 20), [], `${faults.length} faults`);
});

/** the perpendicular distance between two near-parallel segments' lines, or null when they are not parallel (within 2°) */
function apart(g, a) {
  const u = [g.x1 - g.x0, g.y1 - g.y0], v = [a.x1 - a.x0, a.y1 - a.y0], lu = Math.hypot(...u), lv = Math.hypot(...v);
  if (lu < 1 || lv < 1) return null;
  if (Math.abs(u[0] * v[1] - u[1] * v[0]) / (lu * lv) > Math.sin((2 * Math.PI) / 180)) return null;
  // the ray's mid point to the arm's line
  const mx = (g.x0 + g.x1) / 2, my = (g.y0 + g.y1) / 2;
  return Math.abs((mx - a.x0) * v[1] - (my - a.y0) * v[0]) / lv;
}
test("night ruling kon/name 4: a dashed ray beside a solid line it lies on is at least 8 px from it (say's vertex-first play-out, every generated level, 360 and 1366)", () => {
  assert.ok(RAY_OFF >= 8);
  const faults = [];
  let beside = 0;
  for (const level of levels("say")) for (const { w, h } of BOXES("say")) {
    const m = konLogic.malActs(level, "vertex-name");
    if (!m) continue;
    const a = screen(level, m, w, h), arms = a.segs.filter((g) => g.kind === "arm");
    for (const g of a.segs.filter((s) => s.kind === "ray")) for (const arm of arms) {
      const d = apart(g, arm);
      if (d === null || d > 20) continue;
      beside++;
      if (d < 8) faults.push(`${level.levelId} ${w}x${h}: a dashed ray ${d.toFixed(1)} px from its line`);
    }
  }
  assert.ok(beside >= 20, `${beside} dashed rays beside a line`);
  assert.deepEqual(faults.slice(0, 20), [], `${faults.length} faults`);
});

// ── gate 1, final fixes (RULINGS-2026-11-15, "kon/name at the play gate"): held on every generated level and on every level
// the play server serves (a spread of children at each fade), with the arcs as the canvas was asked to draw them (the
// stand-in context keeps every arc), not as the view declares them
const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
const { default: coverage } = await import("../data/play/coverage.json", { with: { type: "json" } });
const { points, angleSizes, NBW, NBH } = await import("../src/play/families/kon/kon.name.ts");
function served(goal, k = 24) {
  const entry = coverage.entries.find((e) => e.family === "kon" && e.mode === "name" && e.goal === goal), key = entryKey(entry), out = [];
  for (const fade of [1, 2, 3]) for (let n = 0; n < k; n++) {
    const lv = currentLevel({ childId: `g1-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: 6, fade, lang: "hinglish", childArt: null, lastArt: null, mis: {}, pL: undefined, n: 0, seed: seedOf(`g1-${n}`, key, 0), door: "garam", recent: [], hist: null }, entry);
    if (lv && !out.some((x) => x.levelId === lv.levelId)) out.push(lv);
  }
  return out;
}
const allLevels = (goal) => { const out = [...served(goal)]; for (const l of levels(goal)) if (!out.some((x) => x.levelId === l.levelId)) out.push(l); return out; };
const W360 = NAME_WORLD["360x640"].find, W1366 = NAME_WORLD["1366x768"].find;
/** the view's board-to-screen map at w × h (the layout every kon/name board uses: the board fitted and centred) */
const mapAt = (w, h) => { const s = Math.min(w / NBW, h / NBH), ox = (w - NBW * s) / 2, oy = (h - NBH * s) / 2; return { s, S: (x, y) => [ox + x * s, oy + (NBH - y) * s] }; };
/** an arc's sweep (canvas radians, as the canvas draws it) */
const sweepOf = (a) => { const T = 2 * Math.PI; return a.ccw ? ((a.a0 - a.a1) % T + T) % T : ((a.a1 - a.a0) % T + T) % T; };
/** the arcs drawn (a point's dot, a whole circle, is not one) */
const arcsOf = (ctx) => ctx.arcs.filter((a) => Math.abs(a.a1 - a.a0) < 2 * Math.PI - 1e-6);
/** points along a drawn arc, ends included */
const along = (a, n = 32) => Array.from({ length: n + 1 }, (_, i) => { const t = a.a0 + ((a.ccw ? -1 : 1) * sweepOf(a) * i) / n; return [a.x + a.r * Math.cos(t), a.y + a.r * Math.sin(t)]; });
/** the figure's whole box on screen: its points, its letters and every arc drawn (the lines run between the points) */
function figureBox(level, audit, ctx, w, h) {
  const { S } = mapAt(w, h), xs = [], ys = [];
  for (const q of points(level.params).map((pt) => S(...pt))) { xs.push(q[0]); ys.push(q[1]); }
  for (const a of arcsOf(ctx)) for (const q of along(a)) { xs.push(q[0]); ys.push(q[1]); }
  for (const t of audit.texts.filter(isLetter)) { xs.push(t.x - t.w / 2, t.x + t.w / 2); ys.push(t.y - t.px * 0.6, t.y + t.px * 0.6); }
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
/** the "≠" row's pieces (the asked name, the "≠", her arc's names), as boxes */
const rowPieces = (audit) => [...audit.marks.filter((m) => m.kind === "chip").map((m) => ({ s: "chip", x0: m.x, y0: m.y, x1: m.x + m.w, y1: m.y + m.h })),
  ...audit.texts.filter((t) => t.s === "≠").map((t) => ({ s: "≠", x0: t.x - t.w / 2, y0: t.y - t.px * 0.6, x1: t.x + t.w / 2, y1: t.y + t.px * 0.6 }))];

test("gate 1, ruling 1: after every wrong arc the \"≠\" row lies above or below the figure's whole box, arcs included, at 360; at 1366 it crosses no arc or line (every served find level)", () => {
  const faults = [];
  let n = 0;
  assert.ok(served("find").length >= 20, "served find levels");
  for (const level of allLevels("find")) for (const [tag, { w, h }] of [["360", W360], ["1366", W1366]]) for (let k = 0; k < 5; k++) {
    if (k === level.params.ask) continue;
    const o = {}, a = screen(level, [{ kind: "arc", at: k }], w, h, o), F = figureBox(level, a, o.ctx, w, h), R = rowPieces(a);
    assert.ok(R.some((r) => r.s === "≠") && R.filter((r) => r.s === "chip").length === 2, `${level.levelId} arc ${k}: the row`);
    assert.ok(arcsOf(o.ctx).length >= 5, `${level.levelId}: the five arcs drawn`);
    const arms = a.segs.filter((g) => g.kind === "arm"), samples = [...arcsOf(o.ctx).flatMap((x) => along(x, 64)),
      ...arms.flatMap((g) => Array.from({ length: 41 }, (_, i) => [g.x0 + ((g.x1 - g.x0) * i) / 40, g.y0 + ((g.y1 - g.y0) * i) / 40]))];
    for (const r of R) {
      const above = r.y1 <= F.y0 + 0.01, below = r.y0 >= F.y1 - 0.01, on = samples.some(([x, y]) => x > r.x0 - 3 && x < r.x1 + 3 && y > r.y0 - 3 && y < r.y1 + 3);
      if (on) faults.push(`${tag} ${level.levelId} arc ${k}: ${r.s} on an arc or a line`);
      if (tag === "360" && !(above || below)) faults.push(`${tag} ${level.levelId} arc ${k}: ${r.s} at ${r.x0.toFixed(0)},${r.y0.toFixed(0)}-${r.x1.toFixed(0)},${r.y1.toFixed(0)} inside the figure ${F.x0.toFixed(0)},${F.y0.toFixed(0)}-${F.x1.toFixed(0)},${F.y1.toFixed(0)}`);
    }
    n++;
  }
  assert.ok(n >= 400, `${n} screens`);
  assert.deepEqual(faults.slice(0, 20), [], `${faults.length} faults`);
});

test("gate 1, ruling 1: the name chip (find's asked name, say's name as built) crosses no arc and no line (every served level, 360 and 1366)", () => {
  const faults = [];
  for (const goal of ["find", "say"]) for (const level of allLevels(goal)) for (const { w, h } of [W360, W1366]) {
    const o = {}, a = screen(level, goal === "say" ? konLogic.solve(level).slice(0, 2) : [], w, h, o);
    const chips = a.marks.filter((m) => m.kind === "chip");
    assert.equal(chips.length, 1, `${level.levelId}: the name chip`);
    const segs = a.segs.filter((g) => g.kind === "arm").map((g) => [[g.x0, g.y0], [g.x1, g.y1]]);
    for (const m of chips) {
      const inBox = ([x, y]) => x > m.x - 3 && x < m.x + m.w + 3 && y > m.y - 3 && y < m.y + m.h + 3;
      for (const arc of arcsOf(o.ctx)) if (along(arc, 64).some(inBox)) faults.push(`${w} ${level.levelId}: name chip on an arc`);
      for (const [p0, p1] of segs) if (Array.from({ length: 41 }, (_, i) => [p0[0] + ((p1[0] - p0[0]) * i) / 40, p0[1] + ((p1[1] - p0[1]) * i) / 40]).some(inBox)) faults.push(`${w} ${level.levelId}: name chip on a line`);
    }
  }
  assert.deepEqual(faults.slice(0, 20), [], `${faults.length} faults`);
});

test("gate 1, ruling 2: the wide arc is clearly shorter than the shortest ray (15 board px or more), and no arc ends on a point (every served level, say and find)", () => {
  const faults = [];
  let wide = 0;
  for (const goal of ["find", "say"]) for (const level of allLevels(goal)) {
    const { w, h } = W360, { s, S } = mapAt(w, h), o = {}, p = level.params;
    screen(level, [], w, h, o);
    const P = points(p).map((q) => S(...q)), shortest = Math.min(p.ln1, p.ln2, p.ln3);
    for (const a of arcsOf(o.ctx)) {
      const atV = Math.hypot(a.x - P[0][0], a.y - P[0][1]) < 0.5;
      // (the wide arc: at the vertex, between rays 1 and 3, the widest of the five)
      const isWide = atV && Math.abs(sweepOf(a) - (Math.max(...angleSizes(p)) * Math.PI) / 180) < 1e-3;
      if (isWide) { wide++; if (a.r / s > shortest - 15 + 1e-6) faults.push(`${level.levelId}: the wide arc's radius ${(a.r / s).toFixed(1)}, the shortest ray ${shortest}`); }
      const q = along(a, 1);
      for (const e of [q[0], q[q.length - 1]]) for (const pt of P) {
        if (Math.hypot(pt[0] - a.x, pt[1] - a.y) < 0.5) continue;
        const d = Math.hypot(e[0] - pt[0], e[1] - pt[1]) / s;
        if (d < 12 - 1e-6) faults.push(`${level.levelId}: an arc ends ${d.toFixed(1)} board px from a point`);
      }
    }
  }
  assert.ok(wide >= 20, `${wide} wide arcs`);
  assert.deepEqual(faults.slice(0, 20), [], `${faults.length} faults`);
});

test("gate 1, ruling 3: say's play-out arc for an angle not drawn is one stroke (or dashes ≥ 12 px) long enough to read at 360, and its dashed rays run outside the lit sector (every served say level)", () => {
  const faults = [];
  let n = 0;
  for (const level of allLevels("say")) for (const [tag, { w, h }] of [["360", NAME_WORLD["360x640"].say], ["1366", NAME_WORLD["1366x768"].say]]) {
    const m = konLogic.malActs(level, "vertex-name");
    if (!m) continue;
    const o = {}, a = screen(level, m, w, h, o);
    const lit = arcsOf(o.ctx).find((x) => x.op === "fill");
    assert.ok(lit, `${level.levelId}: the lit sector`);
    const rays = a.segs.filter((g) => g.kind === "ray");
    if (!rays.length) continue;   // her name is one of the figure's angles: a solid arc, no dashed rays
    n++;
    const outs = arcsOf(o.ctx).filter((x) => x.op === "stroke" && !(Math.abs(x.x - lit.x) < 0.5 && Math.abs(x.y - lit.y) < 0.5 && Math.abs(x.r - lit.r) < 0.5));
    assert.ok(outs.length, `${level.levelId}: the play-out arc`);
    for (const x of outs) {
      if (x.dash.length && Math.min(...x.dash.filter((_, i) => i % 2 === 0)) < 12) faults.push(`${tag} ${level.levelId}: the play-out arc dashed [${x.dash}]`);
      if (tag === "360" && x.r * sweepOf(x) < 27 - 0.01) faults.push(`${tag} ${level.levelId}: the play-out arc ${(x.r * sweepOf(x)).toFixed(1)} px long`);
    }
    // inside the lit sector: nearer its centre than its radius, and between its two arms
    const inside = ([px, py]) => {
      const d = Math.hypot(px - lit.x, py - lit.y);
      if (d >= lit.r - 1 || d < 1) return false;
      const T = 2 * Math.PI, t = Math.atan2(py - lit.y, px - lit.x), rel = lit.ccw ? ((lit.a0 - t) % T + T) % T : ((t - lit.a0) % T + T) % T;
      return rel > 0.02 && rel < sweepOf(lit) - 0.02;
    };
    for (const g of rays) if (Array.from({ length: 41 }, (_, i) => [g.x0 + ((g.x1 - g.x0) * i) / 40, g.y0 + ((g.y1 - g.y0) * i) / 40]).some(inside)) faults.push(`${tag} ${level.levelId}: a dashed ray through the lit sector`);
  }
  assert.ok(n >= 20, `${n} play-outs with dashed rays`);
  assert.deepEqual(faults.slice(0, 20), [], `${faults.length} faults`);
});

test("dc-r8-gate2-shadow S3, say: after a miss \"Yahi naam\" is off until her name changes (a letter or Mita do); Wapas does not switch it on; before any miss it is on with three letters", () => {
  let n = 0;
  for (const level of levels("say")) {
    const m = konLogic.malActs(level, "vertex-name");
    if (!m) continue;
    n++;
    const commitOf = (acts) => { const out = {}; screen(level, acts, 360, 399, out); return out.view.controls().find((c) => c.id === "commit"); };
    const letters = m.filter((a) => a.kind === "letter");
    const before = commitOf(letters);
    assert.equal(before.disabled, false); assert.equal(before.you, true);
    for (const acts of [m, [...m, { kind: "undo" }]]) { const c = commitOf(acts); assert.equal(c.disabled, true, `${level.levelId}: waits after the miss`); assert.equal(c.you, false); }
    // Mita do and three letters again (the same name, built afresh): on
    assert.equal(commitOf([...m, { kind: "clear" }, ...letters]).disabled, false);
    // Wapas twice (her last letter gone) and a letter: on
    assert.equal(commitOf([...m, { kind: "undo" }, { kind: "undo" }, letters[2]]).disabled, false);
  }
  assert.ok(n >= 10, `${n} say levels`);
});
