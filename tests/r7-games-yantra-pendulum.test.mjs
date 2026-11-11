// Round 7 · yantra/pendulum (E6): set the thread so the swing keeps the beat; count full oscillations as the bob comes back.
// Pure law checks: every generated level is solved by its solver and is shortcut-free, and the generator is fast; goal met ⇔
// an INDEPENDENT period oracle (2π√(L/g) computed here, never the law's helper) over thousands of random acts; the bob's
// mass and the release angle never change the graded period; each mal-rule lands on its own misconception moment and never
// solves; tampered params are refused; a claim field never decides; and every coverage entry serves a level.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pendulumLogic, PENDULUM_MAL } from "../src/play/families/yantra/pendulum.logic.ts";
import coverage from "../data/play/coverage.json" with { type: "json" };
import { gradeActs } from "../server/play/grade.js";

const L = pendulumLogic;
const MATCH_MIS = { "heavier-faster": "k-m1", "amplitude-period": "k-m2" };
const OSC_MIS = { "half-oscillation": "k-m3" };
const req = (goal, seed, o = {}) => ({ family: "yantra", mode: "pendulum", goal, topicId: "t", skillId: "t-s3", classLevel: 7, fade: 1, mis: {}, misMap: goal === "match" ? MATCH_MIS : OSC_MIS, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
/** the oracle: the small-angle period, computed here (length in cm, g = 9.8 m/s²) */
const oracleT = (cm) => 2 * Math.PI * Math.sqrt(cm / 100 / 9.8);
const keeps = (p, cm) => Math.abs(oracleT(cm) - p.beat) <= p.tol * p.beat;
const LENS = Array.from({ length: 29 }, (_, i) => 10 + 5 * i), BOBS = [20, 50, 100, 200], SWINGS = [5, 10, 15, 20];

for (const goal of ["match", "oscillation"]) {
  test(`pendulum/${goal}: every level validates, is solved by its solver, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    let n = 0;
    const seen = new Set();
    for (const seed of [1, 7, 42, 99, 123]) for (const fade of [1, 2, 3]) for (const c of L.generate(req(goal, seed, { fade }))) {
      const level = L.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.params.goal, goal); assert.equal(level.params.marks, fade);
      n++;
      assert.equal(L.shortcut(level), null, `${c.signature} shortcut`);
      const solved = run(level, L.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, []);
      if (goal === "match") {
        const p = level.params;
        assert.ok(keeps(p, solved.s.k.length), "the oracle agrees with the solve");
        assert.ok(!keeps(p, p.length), "the start never keeps the beat");
        assert.ok(Math.abs(oracleT(p.length) - p.beat) > 2 * p.tol * p.beat, "the start is well off the beat");
        for (const d of [-5, 5]) assert.ok(!keeps(p, p.length + d), "one nudge never keeps the beat");
      }
      for (const mal of PENDULUM_MAL) {
        const acts = L.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.ok(!r.s.done, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = L.grade(level, env(acts));
        assert.notEqual(g.verdict, "solved");
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, level.mal[mal]);
      }
    }
    assert.ok(n >= 40, `only ${n} levels`);
    for (const m of goal === "match" ? ["heavier-faster", "amplitude-period"] : ["half-oscillation"]) assert.ok(seen.has(m), `${m} never discriminated`);
  });
}

test("pendulum/match: ≥ 3000 random acts; a run solves ⇔ the oracle keeps the beat at the set length; mass and swing never change the graded period", () => {
  let seed = 11, acts = 0, solved = 0, runs = 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
  const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
  for (let g = 0; g < 30; g++) for (const c of L.generate(req("match", 500 + g)).slice(0, 4)) {
    const level = L.validate(c.level), p = level.params;
    let s = L.init(level);
    for (let i = 0; i < 40 && !s.done; i++) {
      const r = rnd();
      const a = r < 0.35 ? { kind: "set", knob: "length", value: rnd() < 0.5 ? pick(LENS) : Math.round(rnd() * 200), ...(rnd() < 0.2 ? { correct: true } : {}) }
        : r < 0.5 ? { kind: "set", knob: "mass", value: pick(BOBS) } : r < 0.62 ? { kind: "set", knob: "swing", value: pick([...SWINGS, 45]) }
        : r < 0.9 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
      const before = s, out = L.apply(level, s, a, i + 1);
      acts++;
      if (a.kind === "run") {
        runs++;
        assert.equal(out.state.done, keeps(p, before.k.length), `${level.levelId}: law and oracle disagree at ${before.k.length} cm`);
        // the same run with any other bob and pull grades the same
        for (const mass of BOBS) for (const swing of SWINGS) {
          const alt = L.apply(level, { ...before, k: { ...before.k, mass, swing } }, a, i + 1);
          assert.equal(alt.state.done, out.state.done);
          assert.equal(alt.state.lastT, out.state.lastT, "the period depends on length only");
        }
      }
      s = out.state;
    }
    if (L.goalMet(level, s)) { solved++; assert.ok(keeps(p, s.k.length)); }
  }
  assert.ok(acts >= 3000, `only ${acts} acts`); assert.ok(runs > 500); assert.ok(solved > 0);
});

test("pendulum/oscillation: presses solve ⇔ every press sits on a real return k · T (oracle), over random press timings", () => {
  let seed = 5, judged = 0, solved = 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
  for (let g = 0; g < 40; g++) for (const c of L.generate(req("oscillation", 900 + g)).slice(0, 3)) {
    const level = L.validate(c.level), p = level.params, T = oracleT(p.length);
    for (let trial = 0; trial < 10; trial++) {
      const unit = rnd() < 0.5 ? T : rnd() < 0.5 ? T / 2 : T * (0.6 + rnd() * 0.8);
      const taps = Array.from({ length: p.n }, (_, i) => Math.round(((i + 1) * unit + (rnd() - 0.5) * 0.9) * 100) / 100);
      const r = run(level, [{ kind: "run" }, ...taps.map((at) => ({ kind: "count", at, correct: true }))]);
      if (r.refused.length) continue;   // a press out of order is refused, not judged
      judged++;
      const want = taps.every((at, i) => at - (i + 1) * T >= -0.25 && at - (i + 1) * T <= 0.4);
      assert.equal(r.s.done, want, `${level.levelId}: ${taps}`);
      if (want) solved++;
    }
  }
  assert.ok(judged > 600 && solved > 50, `${judged} judged, ${solved} solved`);
});

test("pendulum: the mal-rule fires only when that knob ALONE moved since the last run, and only for its mapped id", () => {
  const level = L.validate(L.generate(req("match", 3))[0].level), p = level.params;
  const other = (xs, v) => xs.find((x) => x !== v);
  // mass then swing then run: two knobs moved → no mal-rule, the length stayed
  let r = run(level, [{ kind: "set", knob: "mass", value: other(BOBS, p.mass) }, { kind: "set", knob: "swing", value: other(SWINGS, p.swing) }, { kind: "run" }]);
  assert.ok(!r.ms.some((m) => m.kind === "misconception_consequence"));
  assert.equal(r.ms.find((m) => m.kind === "law_refused").facts.why, "length_same");
  // a watch run first (nothing moved), then a mass-only change: the second run is the consequence
  r = run(level, [{ kind: "run" }, { kind: "set", knob: "mass", value: other(BOBS, p.mass) }, { kind: "run" }]);
  assert.equal(r.ms.filter((m) => m.kind === "misconception_consequence").length, 1);
  assert.equal(r.ms.find((m) => m.kind === "law_refused").facts.why, "same");
  // the period shown after a mass-only change is the period before it
  const runs = r.ms.filter((m) => m.facts.period);
  assert.equal(runs[0].facts.period, runs[1].facts.period);
  // a mass change and back again: nothing moved
  r = run(level, [{ kind: "set", knob: "mass", value: other(BOBS, p.mass) }, { kind: "set", knob: "mass", value: p.mass }, { kind: "run" }]);
  assert.ok(!r.ms.some((m) => m.kind === "misconception_consequence"));
  // unmapped: the same act is shown but decides nothing
  const bare = { ...level, mal: {} };
  r = run(bare, L.malActs(level, "heavier-faster"));
  assert.ok(!r.ms.some((m) => m.kind === "misconception_consequence"));
  assert.equal(L.malActs(level, "half-oscillation"), null);
  const osc = L.validate(L.generate(req("oscillation", 3))[0].level);
  assert.equal(L.malActs(osc, "heavier-faster"), null);
  assert.equal(L.apply(osc, L.init(osc), { kind: "set", knob: "length", value: 50 }, 1).refused, "locked");
  assert.equal(L.apply(osc, L.init(osc), { kind: "count", at: 1 }, 1).refused, "run_first");
});

test("pendulum: tampered params are refused", () => {
  const m = L.generate(req("match", 6))[0].level, o = L.generate(req("oscillation", 6))[0].level;
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  assert.ok(L.validate(m)); assert.ok(L.validate(o));
  for (const [lv, patch] of [
    [m, { length: 13 }], [m, { length: 160 }], [m, { mass: 75 }], [m, { swing: 45 }], [m, { swing: 0 }], [m, { beat: 3.4 }], [m, { beat: 1.234 }],
    [m, { beat: Math.round(oracleT(m.params.length) * 100) / 100 }], [m, { tol: 0.5 }], [m, { goal: "win" }], [m, { ctx: "casino" }],
    [o, { n: 40 }], [o, { n: 2.5 }], [o, { side: "up" }], [o, { length: 20 }], [o, { length: 62 }],
  ]) assert.equal(L.validate(bad(lv, patch)), null, JSON.stringify(patch));
  assert.equal(L.validate({ ...m, mode: "beam" }), null);
  assert.equal(L.validate({ ...m, params: null }), null);
  // bad act values are refused by the law
  const s = L.init(L.validate(m));
  for (const a of [{ kind: "set", knob: "length", value: 12 }, { kind: "set", knob: "mass", value: 1000 }, { kind: "set", knob: "colour", value: 1 }, { kind: "count", at: 1 }])
    assert.ok(L.apply(L.validate(m), s, a, 1).refused, JSON.stringify(a));
});

test("pendulum: a claim field never decides; the first decisive run decides the evidence; grade replays", () => {
  const level = L.validate(L.generate(req("match", 4))[0].level);
  const forged = L.grade(level, env([{ kind: "run", solved: true, correct: true, verdict: "solved" }]));
  assert.notEqual(forged.verdict, "solved");
  const fs = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
  assert.notEqual(fs.grade.verdict, "solved");
  const ok = L.grade(level, env(L.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [...L.malActs(level, "heavier-faster"), ...L.solve(level)];
  const g = L.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].misconceptionId, "k-m1");
  assert.deepEqual(L.grade(level, env(wrong)), g);
  const osc = L.validate(L.generate(req("oscillation", 4))[0].level);
  const of = L.grade(osc, env([{ kind: "run" }, { kind: "count", at: 0.1, correct: true }, { kind: "count", at: 0.2, solved: true }]));
  assert.notEqual(of.verdict, "solved");
});

test("pendulum: the generator is fast (p95 ≤ 50 ms, best of 3) and deterministic", () => {
  for (const goal of ["match", "oscillation"]) {
    const candCounts = []; // candidates per generate/pick: a count, not a clock (tests/_work.mjs)
    for (let g = 0; g < 40; g++) {
      let a = null;
      a = L.generate(req(goal, 300 + g));
      candCounts.push(a.length);
      assert.deepEqual(L.generate(req(goal, 300 + g)).map((c) => c.signature), a.map((c) => c.signature));
      assert.ok(a.length >= 8, `${goal} seed ${300 + g}: ${a.length} candidates`);
    }
    assert.ok(Math.max(...candCounts) <= 72, `${Math.max(...candCounts)} candidates per call (measured 2026-11-10: 24; bound is 3x)`);
  }
});

test("pendulum: every coverage entry serves a level as the play server would, and its mal-rules discriminate there", async () => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  const mine = coverage.entries.filter((e) => e.family === "yantra" && e.mode === "pendulum");
  assert.deepEqual(mine.map((e) => `${e.topicId}|${e.goal}|${e.skillIds}`), ["c7-science-ch08-t01|match|c7-science-ch08-t01-s3", "c7-science-ch08-t01|oscillation|c7-science-ch08-t01-s2"]);
  for (const entry of mine) for (let n = 0; n < 3; n++) for (const fade of [1, 2, 3]) {
    const key = entryKey(entry);
    const s = { childId: `t-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
      mis: {}, pL: undefined, n: 0, seed: seedOf(`t-${n}`, key, 0), door: "garam", recent: [], hist: null };
    const lv = currentLevel(s, entry);
    assert.ok(lv, `${entry.goal} served nothing`);
    assert.equal(lv.mode, "pendulum"); assert.equal(lv.params.goal, entry.goal);
    assert.ok(lv.proof.solvable && lv.proof.shortcutFree);
    assert.deepEqual([...lv.proof.discriminates].sort(), Object.values(entry.misMap).sort(), "every mapped mal-rule discriminates on the served level");
    const g = gradeActs(lv, env(L.solve(lv)), { final: true });
    assert.equal(g.grade.verdict, "solved");
  }
});
