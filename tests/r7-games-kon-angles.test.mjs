// r7 Games (studio-play-coverage-expansion): kon's new modes. zone/kind (make an angle of a kind from a base that may tilt),
// zone/match (equal to a long-armed reference), pair/linear (∠COB from a stated ∠AOC) and close/tri, close/iso (open ∠B so the
// triangle closes). Pure law checks, plus every new coverage entry serving a level as the play server would.
import { test } from "node:test";
import assert from "node:assert/strict";
import { konLogic, targetOf, malHeading, meets, openingOf, openingAt, KIND_ZONE } from "../src/play/families/kon/kon.logic.ts";
import coverage from "../data/play/coverage.json" with { type: "json" };

const MODE = { kind: "zone", match: "zone", linear: "pair", tri: "close", iso: "close" };
const req = (goal, seed, misMap, grammar = {}) => ({ family: "kon", mode: MODE[goal], goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap, grammar, recent: [], seed });
const run = (level, acts) => { let s = konLogic.init(level); const ms = []; acts.forEach((a, i) => { const r = konLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); }); return { s, ms }; };
const ALL_KINDS = { kinds: ["acute", "right", "obtuse", "straight", "reflex"] };

const CASES = [
  ["kind", { orientation: "k-or", "reflex-missing": "k-rm" }, ALL_KINDS],
  ["match", {}, {}],
  ["linear", { "linear-90": "k-l90" }, {}],
  ["tri", {}, {}],
  ["iso", { "wrong-pair": "k-wp" }, {}],
];

for (const [goal, misMap, grammar] of CASES) {
  test(`kon/${MODE[goal]}/${goal}: every generated level validates, is solved by its solver, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    let n = 0, mals = 0;
    for (const seed of [1, 7, 42, 99]) for (const c of konLogic.generate(req(goal, seed, misMap, grammar))) {
      const level = konLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, MODE[goal]);
      n++;
      const solved = run(level, konLogic.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.equal(konLogic.shortcut(level), null, `${c.signature} has a shortcut`);
      for (const mal of Object.keys(misMap)) {
        const acts = konLogic.malActs(level, mal);
        if (!acts) continue;
        mals++;
        const r = run(level, acts);
        assert.ok(!r.s.done, `${c.signature} ${mal} must not solve`);
        assert.ok(r.ms.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === mal), `${c.signature} ${mal} named`);
        assert.ok(!meets(level.params, malHeading(level.params, mal)));
      }
    }
    assert.ok(n >= 5, `only ${n} levels`);
    if (Object.keys(misMap).length) assert.ok(mals > 0, "no mal-rule ever applied");
  });
}

test("kon/zone/kind: any opening inside the kind's zone is accepted, in either sense, from any tilt; outside it is not", () => {
  for (const c of konLogic.generate(req("kind", 3, {}, ALL_KINDS))) {
    const p = konLogic.validate(c.level).params, z = KIND_ZONE[p.kind];
    const at = (a) => (p.start + (p.mirror ? -a : a) + 720) % 360;
    if (z.hi > 0) {
      for (const a of [z.lo, (z.lo + z.hi) / 2, z.hi]) { assert.ok(meets(p, at(a)), `${p.kind} ${a}`); assert.equal(Math.round(openingAt(p, at(a))), Math.round(a)); }
      assert.ok(!meets(p, at(z.lo - 6)) && !meets(p, at(z.hi + 6)), `${p.kind} edges`);
    } else {
      assert.ok(meets(p, at(z.make)) && !meets(p, at(z.make + p.tol + 2)), p.kind);
    }
  }
});

test("kon/zone/kind: a tilted base's right angle is never the upright L (orientation), and the upright L on a flat base IS right", () => {
  const tilted = konLogic.generate(req("kind", 5, { orientation: "x" }, { kinds: ["right"] })).map((c) => konLogic.validate(c.level).params).filter((p) => p.start % 90);
  assert.ok(tilted.length);
  for (const p of tilted) assert.ok(malHeading(p, "orientation") === null || !meets(p, malHeading(p, "orientation")));
  assert.ok(meets({ goal: "kind", kind: "right", start: 0, mirror: false, tol: 4 }, 90));
});

test("kon/pair and close: the opening is the relation (180 − ∠AOC; 180 − ∠A − top; isosceles base angles equal)", () => {
  assert.equal(openingOf({ goal: "linear", given: 130 }), 50);
  assert.equal(openingOf({ goal: "tri", given: 60, apex: 70 }), 50);
  assert.equal(openingOf({ goal: "iso", given: 40, isoBy: "base" }), 40);
  assert.equal(openingOf({ goal: "iso", apex: 40, isoBy: "apex" }), 70);
  // the arm at B opens upward from the base arm pointing back at A
  assert.equal(targetOf({ goal: "tri", start: 180, mirror: true, given: 60, apex: 70, tol: 3 }), 130);
});

test("kon: tampered r7 params are refused (a triangle that cannot close, an odd isosceles top, an unknown kind)", () => {
  const base = { v: "play@1", levelId: "x", family: "kon", topicId: "t", skillId: "t-s1", fade: 1, targets: [], mal: {}, slip: null, seed: 1 };
  for (const params of [
    { goal: "tri", start: 180, mirror: true, given: 100, apex: 90, tol: 3 },
    { goal: "iso", start: 180, mirror: true, apex: 51, isoBy: "apex", tol: 3 },
    { goal: "kind", start: 0, kind: "huge", tol: 4 },
    { goal: "linear", start: 0, given: 200, tol: 3 },
    { goal: "match", start: 0, ref: 45, tol: 99 },
  ]) assert.equal(konLogic.validate({ ...base, mode: MODE[params.goal], goal: params.goal, params }), null, JSON.stringify(params));
});

test("kon: every r7 coverage entry serves a level as the play server would", async () => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  const mine = coverage.entries.filter((e) => e.family === "kon" && ["zone", "pair", "close"].includes(e.mode));
  assert.ok(mine.length >= 8, `${mine.length} entries`);
  for (const entry of mine) for (let n = 0; n < 3; n++) {
    const key = entryKey(entry);
    const s = { childId: `t-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
      mis: {}, pL: undefined, n: 0, seed: seedOf(`t-${n}`, key, 0), door: "garam", recent: [], hist: null };
    const lv = currentLevel(s, entry);
    assert.ok(lv, `${entry.topicId} ${entry.mode}/${entry.goal} served nothing`);
    assert.equal(lv.mode, entry.mode);
    assert.equal(lv.params.goal, entry.goal);
  }
});
