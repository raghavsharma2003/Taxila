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

// C2 / C3 for kon (the round-3 battery in tests/play-logic.test.mjs lists its own modes): ≥ 2000 random acts per mode, the
// law never throws, goal met ⇒ an independent check agrees (the last commit's heading within tolerance of the target,
// computed here without the law's helpers), and the generator's CPU p95 stays ≤ 50 ms.
const indepTarget = (p) => (((p.goal === "turn" ? p.start + (p.dir === "acw" ? 90 : -90) * p.q : p.start + (p.mirror ? -p.theta : p.theta)) % 360) + 360) % 360;
const indepDiff = (a, b) => { const d = Math.abs((((a - b) % 360) + 360) % 360); return Math.min(d, 360 - d); };
for (const goal of ["turn", "set"]) {
  test(`kon/${goal}: ≥ 2000 random acts; goal met ⇒ the independent check agrees; the law never throws; generator p95 ≤ 50 ms`, () => {
    let seed = 9, acts = 0, solved = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let g = 0; g < 40; g++) {
      const t0 = performance.now();
      const cands = konLogic.generate(req(goal, 100 + g, goal === "turn" ? { "cw-confuse": "k-cw" } : { "wrong-scale": "k-ws" }));
      times.push(performance.now() - t0);
      for (const c of cands.slice(0, 5)) {
        const level = konLogic.validate(c.level);
        let s = konLogic.init(level), lastHeading = null;
        for (let i = 0; i < 25 && !s.done; i++) {
          const r = rnd();
          const a = r < 0.55 ? { kind: "turn", deg: r < 0.15 ? indepTarget(level.params) + (rnd() - 0.5) * 2 * level.params.tol : rnd() * 720 - 360, ...(rnd() < 0.2 ? { correct: true } : {}) }
            : r < 0.85 ? { kind: "commit", ...(rnd() < 0.2 ? { solved: true } : {}) } : { kind: "undo" };
          const out = konLogic.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "commit" && s.heading !== null) lastHeading = s.heading;
          s = out.state;
        }
        if (konLogic.goalMet(level, s)) { solved++; assert.ok(indepDiff(lastHeading, indepTarget(level.params)) <= level.params.tol, `${level.levelId}: law says solved at ${lastHeading}`); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(solved > 0, "the battery never solved a level (not exercising the goal)");
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}
