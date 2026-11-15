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

/** a 2D context that draws nothing and measures text at 0.6 em (the chips' mono face; the letters' measure is near it) */
function fakeCtx() {
  const st = { font: "16px x" };
  return new Proxy(st, {
    get(t, k) {
      if (k === "measureText") return (s) => ({ width: 0.6 * Number(/(\d+(?:\.\d+)?)px/.exec(t.font)?.[1] ?? 16) * [...s].length });
      if (k in t) return t[k];
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
const req = (goal, seed, fade) => ({ family: "kon", mode: "name", goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade, mis: {}, misMap: { "vertex-name": "k-vn" }, grammar: {}, recent: [], seed });
const levels = (goal) => [1, 2, 3].flatMap((f) => [1, 7, 42, 99, 123, 2026].flatMap((sd) => konLogic.generate(req(goal, sd, f)).map((c) => konLogic.validate(c.level)).filter(Boolean)));

/** mount the view at w × h, play `acts`, and return the audit of a frame drawn 2 s after the last act (every play-out done) */
function screen(level, acts, w, h) {
  const audit = newAudit("kagaz", false), P = new Painter(ART.kagaz, audit, false), c = fakeCtx();
  const api = { w, h, dpr: 1, t: 0, P, art: ART.kagaz, tw: null, fx: { burst() {}, shake() {} }, reduced: true, young: false, sfx() {}, target() {}, hit: () => null, invalidate() {}, layer() {} };
  const ctl = { state: konLogic.init(level), acts: [], finger() {}, dispatch() {} };
  const view = makeNameView(api, { level, ctl, lang: "hinglish", changed() {} });
  view.layout(w, h);
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
