// Round 7 · the stambh law (bar graphs and pictographs built from falling crates / stacked icons). Pure law checks: every
// generated level is solved by its solver and is shortcut-free; goal met ⇔ an independent oracle (every bar's height in
// half crates × step / 2 equals its value, computed here without the law's helpers); each mal-rule's acts land on its OWN
// misconception moment (never "solved", never another mal-rule's); tampered params are refused; a verdict field in an act
// never decides; the generator's work stays bounded (counted); and every coverage entry serves a proven level at every fade.
import { test } from "node:test";
import assert from "node:assert/strict";
import { stambhLogic, malHalves, targetHalves, STAMBH_MAL } from "../src/play/families/stambh/stambh.logic.ts";
import { coverage, entryFor, entryKey, levelsFor, seedOf, hasPlay } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { GAME_WEIGHT } from "../shared/play.ts";

const ALL = Object.fromEntries(STAMBH_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "stambh", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = stambhLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = stambhLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const MODES = [["bars", "draw", { steps: [1, 2, 5, 10] }], ["bars", "diff", { steps: [2, 5, 10, 50, 100] }], ["picto", "draw", { steps: [2, 5, 10] }], ["bars", "draw", { steps: [50, 100] }]];
/** the oracle: every bar the law checks reads its value on the scale (independent of the law's helpers) */
const oracle = (level, h) => level.params.values.every((v, i) => h[i] * level.params.step === 2 * v);

for (const [mode, goal, grammar] of MODES) {
  test(`stambh/${mode}/${goal} ${grammar.steps}: solvable, shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set();
    for (const seed of [1, 7, 42, 99]) for (const fade of [1, 2, 3]) for (const c of stambhLogic.generate(req(mode, goal, seed, { grammar, fade }))) {
      const level = stambhLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(stambhLogic.shortcut(level), null, `${c.signature} shortcut`);
      const solved = run(level, stambhLogic.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(oracle(level, solved.s.h));
      for (const mal of STAMBH_MAL) {
        const acts = stambhLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: built legally, then missed`);
        assert.ok(!r.s.done, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal, `${c.signature} ${mal} named as ${mc[0].misconceptionId}`);
        const g = stambhLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    const expect = mode === "picto" ? ["key-ignored", "half-ignored", "half-whole"] : grammar.steps.includes(2) ? ["scale-as-one", "gridline-count", "half-ignored", "half-whole"] : ["gridline-count", "half-ignored", "half-whole"];
    for (const m of expect) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("stambh: mal-rule signatures — scale-as-one is too tall by the step, gridline-count one crate, the halves round down / up", () => {
  for (const seed of [3, 5, 8, 13]) for (const c of stambhLogic.generate(req("bars", "draw", seed, { grammar: { steps: [2, 5] } }))) {
    const level = stambhLogic.validate(c.level), p = level.params, t = targetHalves(p);
    const s1 = malHalves("bars", p, "scale-as-one");
    if (s1) p.values.forEach((v, i) => assert.equal(s1[i], 2 * v));
    const gc = malHalves("bars", p, "gridline-count");
    if (gc) t.forEach((x, i) => assert.equal(gc[i], x + 2));
    const hi = malHalves("bars", p, "half-ignored"), hw = malHalves("bars", p, "half-whole");
    if (hi) t.forEach((x, i) => assert.equal(hi[i], x % 2 ? x - 1 : x));
    if (hw) t.forEach((x, i) => assert.equal(hw[i], x % 2 ? x + 1 : x));
    if (!t.some((x) => x % 2)) { assert.equal(hi, null); assert.equal(hw, null); }
    // one per unit never shown when it would not fit the axis
    if (p.values.some((v) => v > p.cap)) assert.equal(s1, null);
  }
  // step 1: one crate per unit IS the scale, so the belief says nothing different
  const one = stambhLogic.validate(stambhLogic.generate(req("bars", "draw", 4, { grammar: { steps: [1] } }))[0].level);
  assert.equal(stambhLogic.malActs(one, "scale-as-one"), null);
  assert.equal(stambhLogic.malActs(one, "key-ignored"), null, "a picto mal-rule never fires on bars");
});

test("stambh/diff: the third bar is exactly N more / fewer than X, never the copy of a given bar; given bars are fixed", () => {
  let n = 0;
  for (const seed of [1, 2, 3, 4, 5]) for (const c of stambhLogic.generate(req("bars", "diff", seed, { grammar: { steps: [5, 10, 50, 100] } }))) {
    const level = stambhLogic.validate(c.level), p = level.params;
    assert.equal(p.values[p.build], p.values[p.of] + (p.more ? p.n : -p.n));
    for (const g of p.given) assert.notEqual(p.values[g], p.values[p.build]);
    const s = stambhLogic.init(level);
    for (const g of p.given) {
      assert.equal(s.h[g] * p.step, 2 * p.values[g], "given bars stand built");
      assert.equal(stambhLogic.apply(level, s, { kind: "drop", col: g }, 1).refused, "fixed");
      assert.equal(stambhLogic.apply(level, s, { kind: "lift", col: g }, 1).refused, "fixed");
    }
    assert.deepEqual(hiddenOf(level), [p.values[p.build]], "the teacher never says the target");
    n++;
  }
  assert.ok(n > 20);
});

test("stambh: the law's physical rules (half on top only, no half where the step is odd, nothing above the axis, lift)", () => {
  const lv = stambhLogic.validate(stambhLogic.generate(req("bars", "draw", 11, { grammar: { steps: [10] } }))[0].level);
  let s = stambhLogic.init(lv);
  const ap = (a) => { const r = stambhLogic.apply(lv, s, a, 1); if (!r.refused) s = r.state; return r.refused; };
  assert.equal(ap({ kind: "check" }), "build_first");
  assert.equal(lv.params.half, true, "an even step allows a half crate");
  assert.equal(ap({ kind: "drop", col: 0, half: true }), undefined);
  assert.equal(s.h[0], 1);
  const odd = stambhLogic.validate(stambhLogic.generate(req("bars", "draw", 11, { grammar: { steps: [5] } }))[0].level);
  assert.equal(odd.params.half, false);
  assert.equal(stambhLogic.apply(odd, stambhLogic.init(odd), { kind: "drop", col: 0, half: true }, 1).refused, "no_half");
  const ev = stambhLogic.validate(stambhLogic.generate(req("bars", "draw", 11, { grammar: { steps: [2] } }))[0].level);
  assert.equal(ev.params.half, true);
  let t = stambhLogic.init(ev);
  t = stambhLogic.apply(ev, t, { kind: "drop", col: 1, half: true }, 1).state;
  assert.equal(t.h[1], 1);
  assert.equal(stambhLogic.apply(ev, t, { kind: "drop", col: 1 }, 2).refused, "half_on_top");
  t = stambhLogic.apply(ev, t, { kind: "lift", col: 1 }, 3).state;
  assert.equal(t.h[1], 0);
  assert.equal(stambhLogic.apply(ev, t, { kind: "lift", col: 1 }, 4).refused, "empty");
  for (let k = 0; k < ev.params.cap; k++) t = stambhLogic.apply(ev, t, { kind: "drop", col: 2 }, 5 + k).state;
  assert.equal(stambhLogic.apply(ev, t, { kind: "drop", col: 2 }, 99).refused, "over_top");
  assert.equal(stambhLogic.apply(ev, t, { kind: "drop", col: 9 }, 99).refused, "bad_col");
  assert.equal(stambhLogic.apply(ev, t, { kind: "undo" }, 100).state.h[2], 2 * ev.params.cap - 2);
});

test("stambh: tampered params are refused", () => {
  const base = stambhLogic.generate(req("bars", "draw", 6, { grammar: { steps: [2] } }))[0].level;
  const diffL = stambhLogic.generate(req("bars", "diff", 6, { grammar: { steps: [10] } }))[0].level;
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  assert.ok(stambhLogic.validate(base));
  assert.ok(stambhLogic.validate(diffL));
  for (const [lv, patch] of [
    [base, { step: 3 }], [base, { step: 5, half: true }], [base, { values: base.params.values.map((v) => v + 0.5) }],
    [base, { values: [1, ...base.params.values.slice(1)], step: 2, half: false }], [base, { cap: 40 }], [base, { cap: 2 }],
    [base, { values: base.params.values.map(() => 2 * base.params.cap * base.params.step) }], [base, { cats: ["x", "y", "z"].slice(0, base.params.cats.length) }],
    [base, { ctx: "casino" }], [base, { goal: "win" }], [base, { values: [-2, ...base.params.values.slice(1)] }], [base, { values: base.params.values.slice(0, 2), cats: base.params.cats.slice(0, 2) }],
    [diffL, { n: diffL.params.n + diffL.params.step }], [diffL, { build: diffL.params.given[0] }], [diffL, { given: [0, 0] }], [diffL, { of: diffL.params.build }],
  ]) assert.equal(stambhLogic.validate(bad(lv, patch)), null, JSON.stringify(patch).slice(0, 80));
  assert.equal(stambhLogic.validate({ ...base, mode: "picto", params: { ...base.params, goal: "diff" } }), null, "picto has no diff goal");
  assert.equal(stambhLogic.validate({ ...base, params: null }), null);
});

test("stambh: a verdict field in an act never decides; the first check decides the evidence; grade replays", () => {
  const level = stambhLogic.validate(stambhLogic.generate(req("bars", "draw", 4, { grammar: { steps: [5] } }))[0].level);
  const forged = stambhLogic.grade(level, env([{ kind: "drop", col: 0, correct: true }, { kind: "check", solved: true, verdict: "solved" }]));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = stambhLogic.grade(level, env(stambhLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  // a wrong check, then recovery: solved at the end, the evidence keeps the first check
  const wrong = [{ kind: "drop", col: 0 }, { kind: "check" }, { kind: "lift", col: 0 }, ...stambhLogic.solve(level)];
  const g = stambhLogic.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.notEqual(g.evidence[0].outcome, "correct");
  // the same acts replay to the same grade
  assert.deepEqual(stambhLogic.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per mode: the law never throws, goal met ⇒ the oracle agrees (and an oracle-true check ⇒ solved);
// the generator's CPU p95 ≤ 50 ms.
for (const [mode, goal, grammar] of MODES.slice(0, 3)) {
  test(`stambh/${mode}/${goal}: ≥ 2000 random acts; goal met ⇔ the oracle on the checked stacks; never throws; generator work bounded (counted, not timed)`, () => {
    let seed = 9, acts = 0, solved = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const candCounts = []; // candidates per generate/pick: a count, not a clock (tests/_work.mjs)
    for (let g = 0; g < 40; g++) {
      // best of 3 (the generator is deterministic; a neighbour's load spike on a shared runner is not its cost)
      let cands = [];
      cands = stambhLogic.generate(req(mode, goal, 100 + g, { grammar }));
      candCounts.push(cands.length);
      for (const c of cands.slice(0, 4)) {
        const level = stambhLogic.validate(c.level), sol = stambhLogic.solve(level);
        let s = stambhLogic.init(level);
        // half the levels: the solver's own acts with refused junk and early checks interleaved (reaches the goal);
        // the other half: random acts
        const pursue = rnd() < 0.5;
        let k = 0;
        for (let i = 0; i < 90 && !s.done; i++) {
          const r = rnd(), col = Math.floor(rnd() * (level.params.values.length + 1));
          const a = pursue ? (r < 0.7 && k < sol.length ? sol[k++] : r < 0.85 ? { kind: "drop", col: 99, correct: true } : { kind: "check", solved: true })
            : r < 0.6 ? { kind: "drop", col, ...(rnd() < 0.3 ? { half: true } : {}) } : r < 0.8 ? { kind: "lift", col } : r < 0.93 ? { kind: "check", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = stambhLogic.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "check" && !out.refused?.startsWith("build")) {
            assert.equal(out.state.done, oracle(level, before.h), `${level.levelId}: law and oracle disagree on ${before.h}`);
          }
          s = out.state;
        }
        if (stambhLogic.goalMet(level, s)) { solved++; assert.ok(oracle(level, s.h)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(solved > 0, "the battery never solved a level");
    assert.ok(Math.max(...candCounts) <= 72, `${Math.max(...candCounts)} candidates per call (measured 2026-11-10: 24; bound is 3x)`);
  });
}

// the play server: every stambh coverage entry serves a proven level at every fade; the solver's acts grade solved
// through the server; a mal-rule the level discriminates folds its kit id into the evidence
// (r8 stambh/tally has its own logic and its own suite: tests/r8-games-stambh-tally.test.mjs)
const ST = () => coverage().entries.filter((e) => e.family === "stambh" && e.mode !== "tally");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, classLevel: entry.classLevel, fade: 1, lang: "hinglish", mis: {}, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], ...over });

test("stambh coverage: the seven authored entries, mapped to real kit misconceptions, admitted by skill", () => {
  const entries = ST();
  assert.deepEqual(entries.map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c4-maths-ch14-t01|picto|draw", "c4-maths-ch14-t02|bars|draw", "c5-maths-ch15-t01|picto|draw", "c5-maths-ch15-t02|bars|draw",
    "c6-maths-ch04-t02|picto|draw", "c6-maths-ch04-t03|bars|draw", "c6-maths-ch04-t03|bars|diff"]);
  for (const e of entries) {
    assert.ok(Object.keys(e.misMap).length > 0, e.topicId);
    for (const sk of e.skillIds) { assert.ok(hasPlay(sk)); assert.ok(entryFor({ skillId: sk }).skillIds.includes(sk), sk); }
  }
});

for (const e of ST()) for (const fade of [1, 2, 3]) {
  test(`stambh server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const r = levelsFor(s, e);
      assert.ok(r?.garam, "no level");
      const level = r.garam;
      assert.equal(level.family, "stambh"); assert.equal(level.mode, e.mode); assert.equal(level.params.labels, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(stambhLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "check", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && stambhLogic.malActs(level, m));
        const mg = gradeActs(level, env(stambhLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
    }
  });
}
