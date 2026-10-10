// Round 4 G1 · E1 angles: the kon law (angles as an amount of turning). Pure law checks: every generated level is solved by
// its solver, each mal-rule's acts land on its own misconception moment (never on "solved"), the protractor levels are never
// passable by pointing at a landmark, and a verdict field in an act is ignored by replay.
import { test } from "node:test";
import assert from "node:assert/strict";
import { konLogic, targetOf, malHeading, diff } from "../src/play/families/kon/kon.logic.ts";

const req = (goal, seed, misMap) => ({ family: "kon", mode: goal, goal, topicId: "t", skillId: "t-s1", classLevel: 5, fade: 1, mis: {}, misMap, grammar: {}, recent: [], seed });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, act }));
const run = (level, acts) => { let s = konLogic.init(level); const ms = []; acts.forEach((a, i) => { const r = konLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); }); return { s, ms }; };

for (const [goal, misMap] of [["turn", { "cw-confuse": "k-cw", "half-is-quarter": "k-hq" }], ["set", { "wrong-scale": "k-ws" }]]) {
  test(`kon/${goal}: the solver solves every generated level; each mal-rule lands on its own misconception`, () => {
    let mals = 0;
    for (const seed of [1, 7, 42]) for (const c of konLogic.generate(req(goal, seed, misMap))) {
      const level = konLogic.validate(c.level);
      assert.ok(level, c.signature);
      const solved = run(level, konLogic.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      for (const mal of Object.keys(misMap)) {
        const acts = konLogic.malActs(level, mal);
        if (!acts) continue;
        mals++;
        const r = run(level, acts);
        assert.ok(!r.s.done, `${c.signature} ${mal} must not solve`);
        assert.ok(r.ms.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === mal), `${c.signature} ${mal} named`);
        assert.ok(diff(malHeading(level.params, mal), targetOf(level.params)) > level.params.tol);
      }
    }
    assert.ok(mals > 0);
  });
}

test("kon/set: no served protractor level is passable by pointing at 0 / 90 / 180", () => {
  for (const seed of [2, 3, 5, 11]) for (const c of konLogic.generate(req("set", seed, { "wrong-scale": "k-ws" }))) {
    assert.equal(konLogic.shortcut(konLogic.validate(c.level)), null, c.signature);
  }
});

test("kon: a verdict field in an act never decides; only the first commit's landing does", () => {
  const level = konLogic.validate(konLogic.generate(req("turn", 4, {}))[0].level);
  const wrong = (targetOf(level.params) + 180) % 360;
  const g = konLogic.grade(level, env([{ kind: "turn", deg: wrong, correct: true }, { kind: "commit", solved: true }]));
  assert.notEqual(g.evidence[0]?.outcome, "correct");
  const ok = konLogic.grade(level, env(konLogic.solve(level)));
  assert.equal(ok.evidence[0]?.outcome, "correct");
});
