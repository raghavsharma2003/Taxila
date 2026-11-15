// Laws audit open list, ruling of 2026-11-15 (kaal/order, "3601 saal door"): while a try remains, kaal's play-out says what
// her drop did, never where the stone belongs. After her first miss on a stone: a direction only ("Isse pehle" / "Isse
// baad mein", toward the true place). From her second miss on that stone: her mark and nothing else. No distance chip, no
// stone floated to its true place, no true year, no true century band. HEADLESS on every served kaal level (every goal):
// the real view is mounted with the real painter on a canvas stand-in and played to a miss on its first stone; what the
// miss adds to the screen is exactly the direction word, once.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { kaalLogic, kaalHelpers as H } from "../src/play/families/kaal/kaal.logic.ts";
import { Painter, ART, newAudit } from "../src/play/core/styles.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";

register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) { if (url.endsWith(".json")) return next(url, { ...ctx, importAttributes: { ...ctx.importAttributes, type: "json" } }); return next(url, ctx); }`));
const { makeKaalView } = await import("../src/play/families/kaal/kaal.view.ts");
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
const sessionOf = (e, fade) => ({ childId: "c1", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(e), fade), door: "garam", recent: [], hist: null });

/** mount at 360 × 400, play `acts`, draw a frame 2 s on; → the texts on screen */
function screen(level, acts) {
  const audit = newAudit("kagaz", false), P = new Painter(ART.kagaz, audit, false);
  const api = { w: 360, h: 400, dpr: 1, t: 0, P, art: ART.kagaz, tw: null, fx: { burst() {}, shake() {}, flash() {} }, reduced: true, young: false, sfx() {}, target() {}, hit: () => null, invalidate() {}, layer() {} };
  const ctl = { state: kaalLogic.init(level), acts: [], finger() {}, dispatch() {} };
  const view = makeKaalView(api, { level, ctl, lang: "hinglish", changed() {} });
  view.layout(360, 400);
  acts.forEach((a, i) => {
    const r = kaalLogic.apply(level, ctl.state, a, i + 1);
    ctl.state = r.state; ctl.acts.push({ seq: i + 1, t: 0, via: "touch", act: a });
    api.t = i * 0.1; view.react(r.moments, r.refused);
  });
  api.t = acts.length * 0.1 + 2;
  view.update?.(0.016);
  audit.texts = []; audit.marks = []; audit.segs = []; audit.uses = [];
  view.draw(fakeCtx());
  return audit.texts.map((t) => t.s);
}
/** a year on the river that misses stone 0 (well off it, inside the river), and the word that points to the stone */
function wrongYear(level) {
  const p = level.params, st = p.stones[0], span = p.hi - p.lo;
  for (const f of [0.15, 0.85, 0.3, 0.7, 0.5]) {
    const y = H.yearAt(p.lo + f * span);
    if (y === 0) continue;
    const r = kaalLogic.apply(level, kaalLogic.apply(level, kaalLogic.init(level), { kind: "place", which: 0, year: y }, 1).state, { kind: "check" }, 2);
    if (r.refused === "missed") return { y, later: H.xOf(y) < H.xOf(st.year) };
  }
  return null;
}
const multiset = (a) => a.reduce((m, s) => m.set(s, (m.get(s) ?? 0) + 1), new Map());
const added = (after, before) => { const b = multiset(before), out = []; for (const s of after) { const n = b.get(s) ?? 0; if (n > 0) b.set(s, n - 1); else out.push(s); } return out; };

test("kaal: a miss shows a direction once, then only her mark; never a distance, the true place or the true year (laws audit 2026-11-15)", () => {
  const EARLIER = word("hinglish", "kaal.earlier"), LATER = word("hinglish", "kaal.later");
  let levels = 0;
  for (const e of coverage().entries.filter((x) => x.family === "kaal")) for (const fade of [1, 2, 3]) {
    const level = currentLevel(sessionOf(e, fade), e);
    if (!level) continue;
    const miss = wrongYear(level);
    assert.ok(miss, `${level.levelId}: a missing drop on stone 0`);
    levels++;
    const place = { kind: "place", which: 0, year: miss.y }, check = { kind: "check" };
    const before = screen(level, [place]);
    const one = added(screen(level, [place, check]), before);
    assert.deepEqual(one, [miss.later ? LATER : EARLIER], `${level.levelId}: after the first miss, the direction alone (${one})`);
    const two = added(screen(level, [place, check, check]), before);
    assert.deepEqual(two, [], `${level.levelId}: after the second miss, her mark and nothing else (${two})`);
  }
  assert.ok(levels >= 6, `${levels} kaal levels`);
});
