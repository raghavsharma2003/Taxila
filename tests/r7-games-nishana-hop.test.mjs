// r7 Games (studio-play-coverage-expansion): nishana/hop. The pod starts on an integer drawn on the line and lands where the
// expression ends ("−3 + (−4)", "5 − (−2)", "−3 × 4"). The law takes the value from the operands, never from the level.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lineLogic, hopValue, hopText, malHop } from "../src/play/families/nishana/line.logic.ts";
import coverage from "../data/play/coverage.json" with { type: "json" };

const req = (seed, ops, misMap, fade = 1) => ({ family: "nishana", mode: "hop", goal: "hop", topicId: "t", skillId: "t-s1", classLevel: 6, fade, mis: {}, misMap, grammar: { ops }, recent: [], seed });
const run = (level, acts) => { let s = lineLogic.init(level); const ms = []; acts.forEach((a, i) => { const r = lineLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); }); return { s, ms }; };

for (const [ops, misMap] of [[["+", "-"], { "subtract-smaller": "k1", "two-neg-positive": "k2", "sign-of-bigger": "k3" }], [["×"], { "neg-neg": "k4" }]]) {
  test(`nishana/hop ${ops.join("")}: valid, solved by the solver, shortcut-free when served, each mal-rule named`, () => {
    let n = 0;
    const seen = new Set();
    for (const seed of [1, 2, 3, 9, 31]) for (const fade of [1, 3]) for (const c of lineLogic.generate(req(seed, ops, misMap, fade))) {
      const level = lineLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, "hop");
      const { a, b, op } = level.params.hop;
      assert.ok(a >= level.params.lo && a <= level.params.hi && level.params.values[0].num >= level.params.lo && level.params.values[0].num <= level.params.hi);
      assert.ok(level.params.tol < 0.5, "a neighbouring integer is a different answer");
      assert.equal(level.params.values[0].num, hopValue({ a, b, op }));
      const solved = run(level, lineLogic.solve(level));
      assert.ok(solved.s.done, `${c.signature} solves`);
      if (lineLogic.shortcut(level)) continue;   // a landmark answer is not served (the picker drops it)
      n++;
      for (const mal of Object.keys(misMap)) {
        const acts = lineLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.ok(!r.s.done, `${c.signature} ${mal}`);
        assert.ok(r.ms.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === mal), `${c.signature} ${mal} named`);
      }
    }
    assert.ok(n >= 20, `${n} served`);
    assert.deepEqual([...seen].sort(), Object.keys(misMap).sort(), "every mal-rule has levels that tell it apart");
  });
}

test("nishana/hop: the beliefs land where the kit says", () => {
  assert.equal(malHop({ a: 3, b: -2, op: "-" }, "subtract-smaller"), 1);
  assert.equal(malHop({ a: -3, b: -4, op: "+" }, "two-neg-positive"), 7);
  assert.equal(malHop({ a: -8, b: 3, op: "+" }, "sign-of-bigger"), 5);
  assert.equal(malHop({ a: -3, b: -4, op: "×" }, "neg-neg"), -12);
  assert.equal(hopText({ a: -3, b: -4, op: "+" }), "−3 + (−4)");
  assert.equal(hopText({ a: 5, b: -2, op: "-" }), "5 − (−2)");
});

test("nishana/hop: a level whose value disagrees with its operands is refused", () => {
  const lv = lineLogic.validate(lineLogic.generate(req(4, ["+", "-"], {}))[0].level);
  const forged = { ...lv, params: { ...lv.params, values: [{ ...lv.params.values[0], num: lv.params.values[0].num + 1 }] } };
  assert.equal(lineLogic.validate(forged), null);
});

test("nishana/hop: every coverage entry serves a level as the play server would", async () => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  const mine = coverage.entries.filter((e) => e.family === "nishana" && e.mode === "hop");
  assert.equal(mine.length, 2);
  for (const entry of mine) for (let n = 0; n < 3; n++) {
    const key = entryKey(entry);
    const s = { childId: `t-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
      mis: {}, pL: undefined, n: 0, seed: seedOf(`t-${n}`, key, 0), door: "garam", recent: [], hist: null };
    const lv = currentLevel(s, entry);
    assert.ok(lv && lv.mode === "hop", entry.topicId);
  }
});
