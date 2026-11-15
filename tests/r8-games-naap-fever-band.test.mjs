// Laws audit open list, ruling of 2026-11-15 (feeta/thermo fever, the healthy band): the band is not drawn on the
// thermometers while a try remains (it turns "read and compare" into "see which mark is outside the stripe"); the normal
// range is a given in the task line, as numbers; the band is drawn on the solved screen. HEADLESS on every served
// thermo/fever level: the real view with the real painter on a canvas stand-in, played to a wrong run and to the solve.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { naapLogic, rightPlace } from "../src/play/families/feeta/naap.logic.ts";
import { Painter, ART, newAudit } from "../src/play/core/styles.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";

register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) { if (url.endsWith(".json")) return next(url, { ...ctx, importAttributes: { ...ctx.importAttributes, type: "json" } }); return next(url, ctx); }`));
const { makeNaapView } = await import("../src/play/families/feeta/naap.view.ts");
const { word } = await import("../src/play/engines/words.ts");

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
// (the stage clock starts at 20 s: under reduced motion a run within the first 10 s of a stage is never shown, a separate
// bug in ten views reported to main 2026-11-15)
/** the band is the one q2 body wider than tall on a thermometer row; → how many are drawn after `acts` (2 s on) */
function bands(level, acts) {
  const audit = newAudit("kagaz", false), P = new Painter(ART.kagaz, audit, false);
  const drawn = [];
  const orig = P.body.bind(P);
  P.body = (c, x, y, w, h, o = {}) => { if (o.role === "q2" && h === 18 && o.fill !== undefined) drawn.push(w); return orig(c, x, y, w, h, o); };
  const api = { w: 360, h: 400, dpr: 1, t: 20, P, art: ART.kagaz, tw: null, fx: { burst() {}, shake() {}, flash() {} }, reduced: true, young: false, sfx() {}, target() {}, hit: () => null, invalidate() {}, layer() {} };
  const ctl = { state: naapLogic.init(level), acts: [], finger() {}, dispatch() {} };
  const view = makeNaapView(api, { level, ctl, lang: "hinglish", changed() {} });
  view.layout(360, 400);
  acts.forEach((a, i) => {
    const r = naapLogic.apply(level, ctl.state, a, i + 1);
    ctl.state = r.state; ctl.acts.push({ seq: i + 1, t: 0, via: "touch", act: a });
    api.t = 20 + i * 0.1; view.react(r.moments, r.refused);
  });
  api.t = 20 + acts.length * 0.1 + 3;
  view.update?.(0.016);
  view.draw(fakeCtx());
  return { n: drawn.length, done: ctl.state.done };
}

test("feeta fever: no healthy band while a try remains; the range is in the task line; the band on the solved screen (laws ruling 2026-11-15)", () => {
  assert.match(word("hinglish", "feeta.goal.fever"), /36\.8.*37\.2/, "the normal range is a given in the task line");
  let levels = 0;
  for (const e of coverage().entries.filter((x) => x.family === "feeta" && x.mode === "thermo")) for (const fade of [1, 2, 3]) {
    const level = currentLevel({ childId: "c1", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", mis: {}, n: 0, seed: seedOf("c1", entryKey(e), fade), recent: [], hist: null }, e);
    if (!level || level.params.goal !== "fever") continue;
    levels++;
    const sol = naapLogic.solve(level), right = rightPlace(level.params);
    // a wrong run: every child on the other bench, then the run (the solver's last act)
    const wrong = [...right.map((b, i) => ({ kind: "put", lane: i, at: 1 - b })), sol[sol.length - 1]];
    const miss = bands(level, wrong);
    assert.equal(miss.done, false, `${level.levelId}: the wrong run does not solve`);
    assert.equal(miss.n, 0, `${level.levelId}: a healthy band is drawn while a try remains`);
    const solved = bands(level, sol);
    assert.equal(solved.done, true, `${level.levelId}: the solver solves`);
    assert.ok(solved.n >= level.params.temps.length, `${level.levelId}: the band on every thermometer once solved (${solved.n})`);
  }
  assert.ok(levels >= 2, `${levels} fever levels`);
});
