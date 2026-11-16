// Round 7 games audit GAMES-01: four kit misconceptions were mapped to a mal-rule that no served level could tell apart, so a
// child holding the belief was never flagged. With the Director's focus on each belief, the served level now discriminates
// it: the law's answer differs from the belief's, malActs returns the belief's acts, those acts never reach the goal and land
// on THAT mal-rule's moment (proof.discriminates lists the kit id), and the solver's acts still win. Per family:
//   todo-jodo strips/equal  more-pieces-more  two strips with the same amount, one in more, smaller pieces (judged)
//   kyun-lab fair-test      light-only (m3)   two leaves with no CO2, one in sunlight, one under black paper: neither makes starch
//   stambh picto/draw       key-ignored       a small key the kit uses (2, 4): one icon per item builds a different row
//   stambh bars/draw, diff  scale-as-one      scale 4 (the kit's "each square represents 4 km"): one crate per unit is too tall
// Unfocused levels are unchanged (the new shapes appear only under focus), and the shapes vary across seeds.
import { test } from "node:test";
import assert from "node:assert/strict";
import { logicFor } from "../src/play/families/index.ts";
import { focusMal } from "../src/play/core/pick.ts";
import { LABS, outcomeOf } from "../src/play/families/kyun-lab/labs.ts";
import { malHalves, buildable } from "../src/play/families/stambh/stambh.logic.ts";
import { coverage, entryByKey, genRequest, levelsFor, seedOf } from "../server/play/levels.js";
import { gradeActs } from "../server/play/grade.js";

const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: 100 * (i + 1), via: "touch", act }));
const play = (L, level, acts) => { let s = L.init(level); const ms = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); }); return { s, ms }; };
const CASES = [
  { family: "todo-jodo", key: "c5-maths-ch02-t03|todo-jodo/strips|equal", mal: "more-pieces-more", kit: "c5-maths-ch02-t03-m-more-pieces-more" },
  { family: "kyun-lab", key: "c7-science-ch10-t01|kyun-lab/fair-test|predict", mal: "light-only", kit: "c7-science-ch10-t01-m3" },
  { family: "stambh", key: "c6-maths-ch04-t02|stambh/picto|draw", mal: "key-ignored", kit: "c6-maths-ch04-t02-m-ignore-key" },
  { family: "stambh", key: "c6-maths-ch04-t03|stambh/bars|draw", mal: "scale-as-one", kit: "c6-maths-ch04-t03-m-count-units" },
  { family: "stambh", key: "c6-maths-ch04-t03|stambh/bars|diff", mal: "scale-as-one", kit: "c6-maths-ch04-t03-m-count-units" },
];
const body = (e, skillId, fade, n, o = {}) => ({ childId: "c-audit", key: e.key, skillId, classLevel: e.classLevel, fade, lang: "hinglish", mis: {}, n, seed: seedOf("c-audit", e.key, n), door: "garam", recent: [], ...o });

for (const c of CASES) {
  test(`${c.key} :: ${c.mal}: under focus every served level discriminates the belief; its acts never win; the right acts do`, () => {
    const e = entryByKey(c.key);
    assert.ok(e, c.key);
    assert.equal(e.misMap[c.mal], c.kit, "the belief stays mapped");
    const L = logicFor(e.family, e.mode);
    let served = 0;
    for (const skillId of e.skillIds) for (const fade of [1, 2, 3]) for (let n = 0; n < 4; n++) {
      const r = levelsFor(body(e, skillId, fade, n, { focus: c.kit, mis: { [c.kit]: 0.7 } }), e);
      assert.ok(r, `${c.key} serves`);
      const lv = L.validate(r.garam);
      assert.ok(lv, "the served level validates");
      served++;
      assert.ok(lv.proof.discriminates.includes(c.kit), `${lv.levelId} discriminates ${c.kit} (has ${lv.proof.discriminates})`);
      const ma = L.malActs(lv, c.mal);
      assert.ok(ma?.length, `${lv.levelId}: malActs non-empty`);
      const m = play(L, lv, ma);
      assert.ok(!L.goalMet(lv, m.s), `${lv.levelId}: the belief's acts must not win`);
      const mc = m.ms.filter((x) => x.kind === "misconception_consequence");
      assert.deepEqual(mc.map((x) => x.misconceptionId), [c.mal], `${lv.levelId}: named as ${c.mal} alone`);
      const g = gradeActs(lv, env(ma), { final: true });
      assert.notEqual(g.grade.verdict, "solved");
      assert.ok(g.grade.evidence.some((x) => x.misconceptionId === c.kit || x.chanceMis === c.kit), `${lv.levelId}: evidence folds the kit id (round 8 law 3: from one pick, as chanceMis)`);
      const sol = L.solve(lv);
      assert.ok(L.goalMet(lv, play(L, lv, sol).s), `${lv.levelId}: the right acts win`);
      assert.equal(gradeActs(lv, env(sol), { final: true }).grade.verdict, "solved");
    }
    assert.ok(served >= 6);
  });
}

test("focusMal: the kit id the focus names → its mal-rule; none without focus or for an unmapped id", () => {
  const misMap = { a: "k-a", b: "k-b" };
  assert.equal(focusMal({ focus: "k-b", misMap }), "b");
  assert.equal(focusMal({ misMap }), null);
  assert.equal(focusMal({ focus: "k-z", misMap }), null);
});

test("todo-jodo strips: the judging levels are equal amounts in more, smaller pieces, vary across seeds, and appear only under focus", () => {
  const e = entryByKey(CASES[0].key), L = logicFor("todo-jodo", "strips");
  const pairs = new Set();
  for (let n = 0; n < 12; n++) {
    const lv = L.validate(levelsFor(body(e, e.skillId, 1, n, { focus: CASES[0].kit }), e).garam);
    assert.equal(lv.goal, "compare"); assert.equal(lv.params.goal, "compare");
    const [a, b] = lv.params.bars;
    assert.ok(a.d !== b.d && a.shaded.length * b.d === b.shaded.length * a.d, `${lv.levelId}: same amount, different pieces`);
    assert.ok(e.grammar.dens === undefined || [a.d, b.d].every((d) => e.grammar.dens.includes(d)));
    pairs.add(lv.sig);
  }
  assert.ok(pairs.size >= 3, `variety across seeds: ${[...pairs]}`);
  for (const fade of [1, 2, 3]) for (const seed of [1, 7, 42]) {
    const cands = L.generate({ ...genRequest(body(e, e.skillId, fade, 0, { seed }), e) });
    assert.ok(cands.every((x) => x.level.goal === "equal" && !x.signature.startsWith("same:")), "unfocused: equal levels only");
  }
});

test("kyun-lab patta: the light-only level is no CO2 in both, light differs, the law says neither makes starch; only under focus", () => {
  const e = entryByKey(CASES[1].key), L = logicFor("kyun-lab", "fair-test"), lab = LABS.patta;
  const sigs = new Set();
  for (const skillId of e.skillIds) for (let n = 0; n < 6; n++) {
    const lv = L.validate(levelsFor(body(e, skillId, 1, n, { focus: CASES[1].kit }), e).garam);
    const [a, b] = lv.params.setups;
    assert.equal(lv.params.test, "light");
    assert.equal(a.co2, "none"); assert.equal(b.co2, "none");
    assert.equal(outcomeOf(lab, a), 0); assert.equal(outcomeOf(lab, b), 0);
    assert.deepEqual(L.malActs(lv, "food-from-soil"), null, "food-from-soil predicts the truth here: this level is light-only's alone");
    sigs.add(lv.sig);
  }
  assert.ok(sigs.size >= 2, `the A/B order varies: ${[...sigs]}`);
  const plain = L.generate(genRequest(body(e, e.skillId, 1, 0), e));
  assert.ok(plain.every((x) => x.level.params.setups.some((s) => outcomeOf(lab, s) > 0)), "unfocused: every test shows the law (a visible difference)");
});

test("stambh c6: focus levels use the kit's small keys / scale, fit one per unit, vary across seeds; unfocused c6 keeps steps 5 and up", () => {
  for (const c of CASES.slice(2)) {
    const e = entryByKey(c.key), L = logicFor("stambh", e.mode);
    const shapes = new Set();
    for (const fade of [1, 2, 3]) for (let n = 0; n < 6; n++) {
      const lv = L.validate(levelsFor(body(e, e.skillId, fade, n, { focus: c.kit }), e).garam);
      // draw at c6 steps never fits one per unit; diff can (only the bar to build counts), so a topic step may win there
      assert.ok(e.grammar.focusSteps.includes(lv.params.step) || (e.goal === "diff" && e.grammar.steps.includes(lv.params.step)), `${lv.levelId} step ${lv.params.step}`);
      const mh = malHalves(e.mode, lv.params, c.mal);
      assert.ok(mh, "one per unit fits the axis / row");
      for (const i of buildable(lv.params)) assert.equal(mh[i], 2 * lv.params.values[i], "the belief builds one crate / icon per unit");
      shapes.add(`${lv.params.step}:${lv.params.values.join(",")}`);
    }
    assert.ok(shapes.size >= 5, `${c.key}: variety across seeds (${shapes.size})`);
    if (e.mode === "picto") assert.ok([...shapes].some((s) => s.startsWith("2:")) && [...shapes].some((s) => s.startsWith("4:")), "both kit keys appear");
    for (const seed of [1, 7, 42, 99]) for (const x of L.generate(genRequest(body(e, e.skillId, 1, 0, { seed }), e))) assert.ok(x.level.params.step >= 5, "unfocused c6 levels keep the topic's own steps");
  }
});

test("coverage: the four beliefs stay in their entries' misMap", () => {
  for (const c of CASES) assert.equal(coverage().entries.find((x) => `${x.topicId}|${x.family}/${x.mode}|${x.goal}` === c.key)?.misMap[c.mal], c.kit);
});
