// Laws audit open list, ruling of 2026-11-15 (aankde/tally sort): "Counting the tally is the skill. The game does not print
// a row's count at any time before the solve. She types each row's total, with the component stambh/tally read uses."
// HEADLESS on every served aankde/tally sort level (each fade's current level and the play cert's levels, the Director's
// focus on each mapped misconception among them): the real view is mounted with the real painter on a canvas stand-in and
// played through the law.
//   - before the solve no number is added to the screen by a run: not after a mal-rule's miss, not after a wrong total,
//     not after a second miss (the counts she typed are hers and were on screen before she pressed "Gino");
//   - the solver types the totals (one total act per row, each the row's count) and the pad of the shared typed total
//     (src/play/core/typedtotal.ts) writes them; the solved screen shows every count and the survey's total;
//   - a wrong total does not solve, whatever else is right; mending it does.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { aankdeLogic as L, countsOf } from "../src/play/families/aankde/aankde.logic.ts";
import { Painter, ART, newAudit } from "../src/play/core/styles.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";

register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) { if (url.endsWith(".json")) return next(url, { ...ctx, importAttributes: { ...ctx.importAttributes, type: "json" } }); return next(url, ctx); }`));
const { makeAankdeView } = await import("../src/play/families/aankde/aankde.view.ts");
const { coverageLevels } = await import("../server/forge3/qa/cert-levels.mjs");

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
const sessionOf = (e, fade) => ({ childId: "c1", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(e), fade), door: "garam", recent: [], hist: null });

/** every served sort level: each fade's current level and the cert's levels (seeds and the misconception focus) */
async function servedSort() {
  const out = new Map();
  for (const e of coverage().entries.filter((x) => x.family === "aankde" && x.mode === "tally")) {
    for (const fade of [1, 2, 3]) { const lv = currentLevel(sessionOf(e, fade), e); if (lv) out.set(lv.levelId, lv); }
    for (const lv of await coverageLevels(e, 3, { focus: true })) out.set(lv.levelId, lv);
  }
  return [...out.values()].filter((lv) => lv.params.goal === "sort");
}

/** mount the real view at 360 × 560 (reduced motion: a run plays out at once; the stage clock starts at 20, as the
 *  view's reduced run is stamped 10 s back); dispatch goes through the law */
function mount(level) {
  const audit = newAudit("kagaz", false), P = new Painter(ART.kagaz, audit, false);
  let hitId = null;
  const api = { w: 360, h: 560, dpr: 1, t: 20, P, art: ART.kagaz, tw: null, fx: { burst() {}, shake() {}, flash() {} }, reduced: true, young: false, sfx() {}, target() {}, hit: () => hitId, invalidate() {}, layer() {} };
  const ctl = { state: L.init(level), acts: [], finger() {},
    dispatch(a) { const seq = ctl.acts.length + 1, r = L.apply(level, ctl.state, a, seq); ctl.state = r.state; ctl.acts.push({ seq, t: 0, via: "touch", act: a }); api.t += 0.1; view.react(r.moments, r.refused); return r; } };
  const view = makeAankdeView(api, { level, ctl, lang: "hinglish", changed() {} });
  view.layout(360, 560);
  const screen = () => {
    api.t += 2; view.update?.(0.016);
    audit.texts = []; audit.marks = []; audit.segs = []; audit.uses = [];
    view.draw(fakeCtx());
    return audit.texts.map((t) => t.s);
  };
  /** a touch on the target `id` */
  const tap = (id) => { hitId = id; view.pointer("down", 0, 0); hitId = null; };
  return { ctl, view, screen, tap, play: (acts) => acts.map((a) => ctl.dispatch(a)) };
}
const multiset = (a) => a.reduce((m, s) => m.set(s, (m.get(s) ?? 0) + 1), new Map());
const added = (after, before) => { const b = multiset(before), out = []; for (const s of after) { const n = b.get(s) ?? 0; if (n > 0) b.set(s, n - 1); else out.push(s); } return out; };
const numeric = (xs) => xs.filter((s) => /\d/.test(s));
/** play `acts` up to their run; → what the run added to the screen, and the law's answer to the run */
function runAdds(level, acts) {
  const m = mount(level), i = acts.findIndex((a) => a.kind === "run");
  m.play(acts.slice(0, i));
  const before = m.screen(), r = m.ctl.dispatch(acts[i]);
  return { r, adds: added(m.screen(), before), m };
}

test("aankde/tally sort: no row's count is printed before the solve, after any run or miss (laws ruling 2026-11-15)", async () => {
  const levels = await servedSort();
  assert.ok(levels.length >= 6, `${levels.length} sort levels`);
  let misses = 0;
  for (const level of levels) {
    const p = level.params, counts = countsOf(p);
    // every mal-rule's miss
    for (const mal of Object.keys(level.mal)) {
      const acts = L.malActs(level, mal);
      if (!acts) continue;
      const { r, adds } = runAdds(level, acts);
      assert.equal(r.refused, "missed", `${level.levelId} ${mal}`);
      assert.deepEqual(numeric(adds), [], `${level.levelId} ${mal}: the run printed ${JSON.stringify(numeric(adds))}`);
      misses++;
    }
    // a right tally with one total one off: a miss, and the run prints nothing; a second run after another wrong total too
    const sol = L.solve(level), t0 = sol.findIndex((a) => a.kind === "total");
    const wrong = sol.map((a, i) => (i === t0 ? { ...a, n: a.n + 1 } : a));
    const { r, adds, m } = runAdds(level, wrong);
    assert.equal(r.refused, "missed", `${level.levelId}: a wrong total is a miss`);
    assert.ok(!m.ctl.state.done, `${level.levelId}: a wrong total does not solve`);
    assert.deepEqual(numeric(adds), [], `${level.levelId}: after a wrong total the run printed ${JSON.stringify(numeric(adds))}`);
    m.ctl.dispatch({ kind: "total", row: 0, n: counts[0] + 2 });
    const before2 = m.screen(), r2 = m.ctl.dispatch({ kind: "run" });
    assert.equal(r2.refused, "missed");
    assert.deepEqual(numeric(added(m.screen(), before2)), [], `${level.levelId}: the second miss printed a number`);
    misses += 2;
  }
  assert.ok(misses >= 18, `${misses} misses looked at`);
});

test("aankde/tally sort: the solver types each row's total, through the shared pad; the solved screen shows the counts", async () => {
  for (const level of await servedSort()) {
    const p = level.params, counts = countsOf(p), sol = L.solve(level);
    const totals = sol.filter((a) => a.kind === "total");
    assert.deepEqual(totals.map((a) => [a.row, a.n]), counts.map((c, r) => [r, c]), `${level.levelId}: one typed total per row, each its count`);
    // the view: the slips stroked, then each count typed on the pad (the typed total's keys k0..k9) into the picked cell
    const m = mount(level);
    m.play(sol.filter((a) => a.kind === "mark"));
    assert.ok(!m.view.controls().find((c) => c.id === "run").you, `${level.levelId}: "Gino" waits for the totals`);
    for (let r = 0; r < counts.length; r++) {
      if (r) m.tap(`tot-${r}`);
      for (const d of String(counts[r])) m.view.controls().find((c) => c.id === `k${d}`).onPress();
    }
    assert.deepEqual(m.ctl.state.totals, counts, `${level.levelId}: the pad wrote the totals`);
    const run = m.view.controls().find((c) => c.id === "run");
    assert.ok(run.you && !run.disabled);
    run.onPress();
    assert.ok(m.ctl.state.done, `${level.levelId}: solved`);
    const shown = m.screen();
    for (const c of new Set(counts)) assert.ok(shown.includes(String(c)), `${level.levelId}: the count ${c} on the solved screen`);
    assert.ok(shown.includes(String(p.total)), `${level.levelId}: the total ${p.total} on the solved screen`);
    // mending a wrong total solves
    const t0 = sol.findIndex((a) => a.kind === "total"), m2 = mount(level);
    m2.play(sol.map((a, i) => (i === t0 ? { ...a, n: a.n + 1 } : a)));
    assert.ok(!m2.ctl.state.done);
    m2.play([{ kind: "total", row: sol[t0].row, n: sol[t0].n }, { kind: "run" }]);
    assert.ok(m2.ctl.state.done, `${level.levelId}: the mended total solves`);
  }
});
