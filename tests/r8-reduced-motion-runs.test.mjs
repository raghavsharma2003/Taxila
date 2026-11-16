// Ruling of 2026-11-15 ("To Games, on the reduced-motion play-out"): under reduced motion a run in the stage's first 10
// seconds must draw its play-out's end state. The run views used to start a run at `api.t - 10` when reduced and read a
// negative start as "no run", so a run at stage time 0-10 s drew no play-out and no end marks. HEADLESS, for every mode
// of the eleven run views (aankde, feeta, naap, gati, ghadi, guna, hissa, koshtak, kram, paheli, parkar): the real view
// is mounted with the real painter on a canvas stand-in (reduced: true), a served level is played (its solver, and a
// bare run where the logic takes one) with the stage clock at 0 and again at 20, and the frame drawn right after must be
// the same, call for call and audit for audit. At 20 the old code drew the end state; at 0 it drew none.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { Painter, ART, newAudit } from "../src/play/core/styles.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";
import { logicFor } from "../src/play/families/index.ts";

register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) { if (url.endsWith(".json")) return next(url, { ...ctx, importAttributes: { ...ctx.importAttributes, type: "json" } }); return next(url, ctx); }`));
const { VIEWS } = await import("../src/play/families/views.ts");

const FAMILIES = ["aankde", "feeta", "gati", "ghadi", "guna", "hissa", "koshtak", "kram", "paheli", "parkar"];

/** a 2D context stand-in that records every call (numbers rounded), so two frames can be compared */
function fakeCtx(log) {
  const st = { font: "16px x" };
  const norm = (v) => (typeof v === "number" ? Math.round(v * 100) / 100 : typeof v === "string" ? v : typeof v);
  return new Proxy(st, {
    get(t, k) {
      if (k === "measureText") return (s) => ({ width: 0.6 * Number(/(\d+(?:\.\d+)?)px/.exec(t.font)?.[1] ?? 16) * [...s].length });
      if (k === "createLinearGradient" || k === "createRadialGradient" || k === "createPattern") return () => ({ addColorStop() {} });
      if (k === "getTransform") return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      if (k in t) return t[k];
      return (...a) => { log.push(String(k) + "(" + a.map(norm).join(",") + ")"); };
    },
    set(t, k, v) { t[k] = v; log.push(String(k) + "=" + norm(v)); return true; },
  });
}
const sessionOf = (e, fade) => ({ childId: "c1", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(e), fade), door: "garam", recent: [], hist: null });

/** mount at 360 × 640 under reduced motion with the stage clock at `t0`, play `acts` 0.05 s apart, draw 0.5 s on → the frame */
function frame(e, level, acts, t0) {
  const logic = logicFor(e.family, e.mode), make = VIEWS[`${e.family}/${e.mode}`];
  const audit = newAudit("kagaz", false), P = new Painter(ART.kagaz, audit, false);
  const api = { w: 360, h: 640, dpr: 1, t: t0, P, art: ART.kagaz, tw: null, fx: { burst() {}, shake() {}, flash() {} }, reduced: true, young: false, sfx() {}, target() {}, hit: () => null, invalidate() {}, layer() {} };
  const ctl = { state: logic.init(level), acts: [], finger() {}, dispatch() {} };
  const view = make(api, { level, ctl, lang: "hinglish", changed() {} });
  view.layout(360, 640);
  acts.forEach((a, i) => {
    const r = logic.apply(level, ctl.state, a, i + 1);
    ctl.state = r.state; ctl.acts.push({ seq: i + 1, t: t0 + i * 0.05, via: "touch", act: a });
    api.t = t0 + i * 0.05; view.react(r.moments, r.refused);
  });
  api.t = t0 + acts.length * 0.05 + 0.5;
  view.update?.(0.016);
  audit.texts = []; audit.marks = []; audit.segs = []; audit.uses = []; audit.targets = [];
  const log = [];
  view.draw(fakeCtx(log));
  const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k === "seq" ? undefined : typeof v === "number" ? Math.round(v * 100) / 100 : v)));
  return { log, texts: strip(audit.texts), marks: strip(audit.marks), segs: strip(audit.segs), uses: strip(audit.uses), ended: !!ctl.state.ended, line: view.line?.() };
}

/** a bare run from the start, when the logic takes it and it ends the level (a miss, mostly) */
function bareRun(logic, level) {
  for (const a of [{ kind: "run" }]) {
    try { const r = logic.apply(level, logic.init(level), a, 1); if (!r.refused && r.state.ended) return [a]; } catch { /* not this family's act */ }
  }
  return null;
}

test("reduced motion: a run in the stage's first 10 s draws the same play-out end state as one at 20 s (ruling 2026-11-15)", () => {
  const seen = new Map(), compared = new Set();
  for (const e of coverage().entries.filter((x) => FAMILIES.includes(x.family))) {
    const key = `${e.family}/${e.mode}`;
    if (seen.has(key) && seen.get(key) >= 2) continue;
    const logic = logicFor(e.family, e.mode);
    assert.ok(logic && VIEWS[key], `${key}: logic and view`);
    const level = currentLevel(sessionOf(e, 1), e);
    if (!level) continue;
    const plays = [logic.solve(level), bareRun(logic, level)].filter(Boolean);
    assert.ok(plays.length, `${level.levelId}: a solver`);
    for (const acts of plays) {
      const late = frame(e, level, acts, 20), early = frame(e, level, acts, 0);
      if (!late.ended) continue;
      assert.deepEqual(early.texts, late.texts, `${key} ${level.levelId} [${acts.map((a) => a.kind)}]: texts at t=0 vs t=20`);
      assert.deepEqual(early.marks, late.marks, `${key} ${level.levelId}: end marks at t=0 vs t=20`);
      assert.deepEqual(early.segs, late.segs, `${key} ${level.levelId}: noted lines at t=0 vs t=20`);
      assert.deepEqual(early.uses, late.uses, `${key} ${level.levelId}: colour roles at t=0 vs t=20`);
      assert.deepEqual(early.log, late.log, `${key} ${level.levelId}: canvas calls at t=0 vs t=20`);
      assert.equal(early.line, late.line, `${key} ${level.levelId}: the line at t=0 vs t=20`);
      compared.add(e.family);
    }
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  assert.deepEqual([...compared].sort(), [...FAMILIES].sort(), "every run view compared at least once");
});
