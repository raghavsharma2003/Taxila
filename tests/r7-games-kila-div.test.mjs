// r7 Games, E4 Kila · divisibility mode (c6-maths-ch05-t05 Divisibility tests). A wave of numbered foes (3-5 digits) stands
// on the path; the fort's ÷d tower breaks exactly the foes d divides; the child nets every foe it will break BEFORE the
// wave runs. Pure law checks: every generated level validates, solves, is shortcut-free (netting everything, either half,
// the foes ending in d all lose); an INDEPENDENT checker (plain `n % d === 0` over the foes, none of the law's helpers)
// agrees with the law over random play; each mal-rule's acts land on its OWN misconception moment and its nets are the
// belief's (ends in 4, last digit 3 / 6 / 9, every multiple of 3 for 9, 2 OR 3 for 6, …); the decoys that break each wrong
// test are there; tampered params are refused; a claim never decides; the numbers to net are hidden from the teacher; the
// generator is fast; and every divisibility coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { kilaLogic, KILA_MAL, DIV_MAL, DIVS_OF, malSetup } from "../src/play/families/kila/kila.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { readFileSync } from "node:fs";

const words = JSON.parse(readFileSync(new URL("../data/play/engine-words.json", import.meta.url), "utf8"));

const ALL = Object.fromEntries(KILA_MAL.map((m) => [m, `k-${m}`]));
const req = (goal, seed, o = {}) => ({ family: "kila", mode: "divisibility", goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = kilaLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = kilaLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [["ones", { divisors: [2, 5, 10] }], ["tail", { divisors: [4, 8] }], ["sum", { divisors: [3, 9] }], ["sum", { divisors: [6] }], ["ones", {}], ["tail", { digits: [5, 5], foes: [12, 12] }]];
const levelsOf = (goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) out.push(...kilaLogic.generate(req(goal, seed, { grammar, fade })));
  return out;
};

/** THE INDEPENDENT CHECKER: the squares (1-based) whose foe d divides, by plain remainder, and the goal read from it. */
const breaksOf = (p) => p.foes.map((x, i) => (x % p.d === 0 ? i + 1 : 0)).filter(Boolean);
function oracle(p, marks) {
  const want = breaksOf(p), got = [...marks].sort((a, b) => a - b);
  return got.length === want.length && got.every((x, i) => x === want[i]);
}
// each belief read straight from its words (independent of DIV_MAL's predicates)
const BELIEF = {
  "ends-in-four": (x) => String(x).endsWith("4"),
  "even-for-4": (x) => "02468".includes(String(x).slice(-1)),
  "digit-sum-for-4": (x) => [...String(x)].reduce((a, c) => a + +c, 0) % 4 === 0,
  "four-test-for-8": (x) => Number(String(x).slice(-2)) % 4 === 0,
  "last-digit-for-3": (x) => "369".includes(String(x).slice(-1)),
  "last-digit-for-9": (x) => String(x).endsWith("9"),
  "three-for-nine": (x) => [...String(x)].reduce((a, c) => a + +c, 0) % 3 === 0,
  "either-for-6": (x) => "02468".includes(String(x).slice(-1)) || [...String(x)].reduce((a, c) => a + +c, 0) % 3 === 0,
  "five-for-ten": (x) => "05".includes(String(x).slice(-1)),
  "only-zero-for-5": (x) => String(x).endsWith("0"),
  "any-odd-digit": (x) => "02468".includes(String(x).slice(-1)) && !/[13579]/.test(String(x)),
};
const EXPECT = { 2: ["any-odd-digit"], 5: ["only-zero-for-5"], 10: ["five-for-ten"], 4: ["ends-in-four", "even-for-4", "digit-sum-for-4"], 8: ["four-test-for-8"],
  3: ["last-digit-for-3"], 9: ["last-digit-for-9", "three-for-nine"], 6: ["either-for-6"] };

test("kila/divisibility: registered (MODES via logic + view), a verb that never chooses, the goal word exists, vakya's words stay last", () => {
  assert.equal(LOGIC["kila/divisibility"], kilaLogic);
  assert.ok(readFileSync(new URL("../src/play/families/views.ts", import.meta.url), "utf8").includes(`"kila/divisibility": makeKilaView`), "the 2D view serves the mode");
  const v = playActOf("kila", "divisibility");
  assert.ok(v && v.hi && v.en && v.act !== "choose");
  assert.ok(words.words["kila.goal.div"]?.en.includes("{d}"));
  const keys = Object.keys(words.words);
  assert.ok(keys[keys.length - 1].startsWith("vakya."), "vakya's words stay last");
  assert.deepEqual(Object.keys(DIV_MAL).sort(), Object.keys(BELIEF).sort());
});

for (const [goal, grammar] of CASES) {
  test(`kila/divisibility/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; the decoys break every wrong test; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    const ds = new Set();
    for (const c of cands) {
      const level = kilaLogic.validate(c.level);
      assert.ok(level, c.signature);
      const p = level.params;
      ds.add(p.d);
      assert.equal(level.mode, "divisibility"); assert.equal(p.goal, goal);
      assert.ok(DIVS_OF[goal].includes(p.d) && (!grammar.divisors || grammar.divisors.includes(p.d)));
      assert.equal(p.n, p.foes.length);
      assert.ok(p.foes.every((x) => x >= 100 && x <= 99999), "3-5 digit foes");
      if (grammar.digits) assert.ok(p.foes.every((x) => String(x).length === 5));
      const want = breaksOf(p);
      assert.ok(want.length >= 2 && p.n - want.length >= 2, `${c.signature}: two break, two survive`);
      assert.equal(kilaLogic.shortcut(level), null, `${c.signature} shortcut`);
      // idea-free nets lose: everything, either half, the foes ending in d
      const all = p.foes.map((_, i) => i + 1);
      for (const m of [all, all.filter((s) => s % 2), all.filter((s) => !(s % 2)), all.slice(0, Math.ceil(p.n / 2))]) assert.ok(!oracle(p, m), `${c.signature}: idea-free nets win`);
      const solved = run(level, kilaLogic.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, []);
      assert.ok(oracle(p, solved.s.marks), `${c.signature}: the checker disagrees with the solver`);
      for (const mal of KILA_MAL) {
        const acts = kilaLogic.malActs(level, mal);
        if (!acts) { assert.ok(!(EXPECT[p.d] ?? []).includes(mal), `${c.signature}: ${mal} not discriminated`); continue; }
        assert.ok(EXPECT[p.d].includes(mal), `${c.signature}: ${mal} is not a belief about ÷${p.d}`);
        seen.add(mal);
        const su = malSetup(p, mal);
        assert.deepEqual(su.marks, all.filter((s) => BELIEF[mal](p.foes[s - 1])), `${c.signature} ${mal}: the nets are the belief's`);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"]);
        assert.ok(!r.s.done && !oracle(p, r.s.marks));
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1); assert.equal(mc[0].misconceptionId, mal);
        const g = kilaLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const d of ds) for (const m of EXPECT[d]) assert.ok(seen.has(m), `÷${d}: ${m} never discriminated`);
    for (const d of grammar.divisors ?? DIVS_OF[goal]) assert.ok(ds.has(d), `÷${d} never served`);
  });
}

test("kila/divisibility: tampered params are refused", () => {
  const g = (goal, grammar) => kilaLogic.generate(req(goal, 6, { grammar }))[0].level;
  const ones = g("ones", { divisors: [5] }), tail = g("tail", { divisors: [4] }), sum = g("sum", { divisors: [9] });
  for (const lv of [ones, tail, sum]) assert.ok(kilaLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  const f = tail.params.foes, d = tail.params.d;
  for (const [lv, patch] of [
    [tail, { d: 7 }], [tail, { d: 3 }], [ones, { d: 4 }], [sum, { d: 2 }], [tail, { d: 4.5 }],
    [tail, { foes: [...f.slice(1), f[0] + 0.5] }], [tail, { foes: [...f.slice(1), f[1]] }], [tail, { foes: f.slice(1) }], [tail, { n: f.length + 1 }],
    [tail, { foes: f.map((x) => x * d), n: f.length }], [tail, { foes: f.map((x) => x * d + 1) }], [tail, { foes: [...f.slice(1), 44] }], [tail, { foes: [...f.slice(1), 123456] }],
    [tail, { foes: [...f, ...f.map((x) => x + 1)].slice(0, 13), n: 13 }], [tail, { foes: f.slice(0, 5), n: 5 }],
    [tail, { fixed: [4] }], [tail, { menu: [2] }], [tail, { budget: 1 }], [tail, { decoys: [3] }], [tail, { targets: [1] }], [tail, { foes: "123,456" }], [tail, { goal: "mark" }],
  ]) assert.equal(kilaLogic.validate(bad(lv, patch)), null, JSON.stringify(patch).slice(0, 80));
  assert.equal(kilaLogic.validate({ ...tail, mode: "multiples" }), null, "a goal belongs to its mode");
  assert.equal(kilaLogic.validate({ ...tail, params: { ...tail.params, goal: "sum" } }), null, "÷4 is not a digit-sum goal");
});

test("kila/divisibility: the law's rules (nets only, locked while the wave rolls, a net on a survivor misses, near miss on one); a claim never decides; hidden numbers", () => {
  const level = kilaLogic.validate(kilaLogic.generate(req("sum", 11, { grammar: { divisors: [9] } }))[0].level), p = level.params;
  const want = breaksOf(p), surv = p.foes.map((_, i) => i + 1).filter((s) => !want.includes(s));
  let s = kilaLogic.init(level);
  const ap = (a) => { const r = kilaLogic.apply(level, s, a, 1); s = r.state; return r; };
  assert.equal(ap({ kind: "run" }).refused, "net_first");
  assert.equal(ap({ kind: "place", at: 2 }).refused, "no_tower");
  assert.equal(ap({ kind: "mark", at: p.n + 1 }).refused, "off_path");
  for (const q of want) assert.equal(ap({ kind: "mark", at: q }).refused, undefined);
  assert.equal(ap({ kind: "mark", at: surv[0] }).refused, undefined);
  assert.equal(ap({ kind: "next" }).refused, undefined);
  assert.equal(ap({ kind: "mark", at: surv[1] }).refused, "wave_rolling");
  const r = ap({ kind: "run" });
  assert.equal(r.refused, "missed", "a net on a survivor is a miss");
  assert.ok(r.moments.some((m) => m.kind === "near_miss"), "one wrong net is a near miss");
  assert.equal(ap({ kind: "mark", at: surv[0] }).refused, undefined);
  assert.equal(ap({ kind: "run" }).refused, undefined);
  assert.ok(s.done);
  // a claim never decides
  const forged = kilaLogic.grade(level, env([{ kind: "mark", at: surv[0], correct: true }, { kind: "run", solved: true, verdict: "solved" }]));
  assert.notEqual(forged.verdict, "solved"); assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = kilaLogic.grade(level, env(kilaLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct");
  // the teacher never says the numbers to net (and only those)
  assert.deepEqual([...hiddenOf(level)].sort((a, b) => a - b), want.map((q) => p.foes[q - 1]).sort((a, b) => a - b));
  // facts / board never carry the key
  const f = kilaLogic.facts(level, kilaLogic.init(level)), b = kilaLogic.board(level, kilaLogic.init(level));
  assert.equal(f.divisor, p.d);
  assert.ok(!JSON.stringify(f).includes(String(p.foes[want[0] - 1])));
  assert.ok(b.lines.some((l) => l.includes(`÷ ${p.d}`)) && b.lines.some((l) => l.startsWith("nets: –")));
});

// ≥ 2000 random acts per goal: the law never throws; whenever a wave reaches the gate the law's verdict equals the
// independent checker on the nets that rolled; the generator's CPU p95 ≤ 50 ms
for (const [goal, grammar] of CASES.slice(0, 4)) {
  test(`kila/divisibility/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the wave's verdict ⇔ n % d === 0; generator p95 ≤ 50 ms`, () => {
    let seed = 23, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let gi = 0; gi < 40; gi++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); cands = kilaLogic.generate(req(goal, 300 + gi, { grammar })); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 4)) {
        const level = kilaLogic.validate(c.level), p = level.params, sol = kilaLogic.solve(level);
        let s = kilaLogic.init(level), k = 0;
        const pursue = rnd() < 0.4;
        for (let i = 0; i < 80 && !s.done; i++) {
          const r = rnd(), at = 1 + Math.floor(rnd() * (p.n + 1));
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.45 ? { kind: "mark", at, ...(rnd() < 0.2 ? { correct: true } : {}) } : r < 0.55 ? { kind: "place", at }
            : r < 0.75 ? { kind: "next" } : r < 0.9 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s, out = kilaLogic.apply(level, s, a, i + 1);
          acts++;
          if ((a.kind === "next" || a.kind === "run") && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, oracle(p, before.marks), `${level.levelId}: law and checker disagree on nets ${before.marks}`);
          }
          s = out.state;
        }
        if (kilaLogic.goalMet(level, s)) { solved++; assert.ok(oracle(p, s.marks)); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

// the play server: every divisibility coverage entry serves a proven level at every fade; solve grades solved; a claim
// never solves; a mal-rule the level discriminates folds its kit id; the hidden values are the numbers to net
const DE = () => coverage().entries.filter((e) => e.family === "kila" && e.mode === "divisibility");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("kila/divisibility coverage: three entries (one per kit skill), mapped to the topic's verified kit misconceptions; each skill is kila's", () => {
  assert.deepEqual(DE().map((e) => `${e.topicId}|${e.goal}|${e.skillIds.join(",")}`), [
    "c6-maths-ch05-t05|ones|c6-maths-ch05-t05-s1", "c6-maths-ch05-t05|tail|c6-maths-ch05-t05-s2", "c6-maths-ch05-t05|sum|c6-maths-ch05-t05-s3"]);
  assert.deepEqual(DE().map((e) => e.misMap), [{}, { "ends-in-four": "c6-maths-ch05-t05-m-four-last-digit" },
    { "last-digit-for-3": "c6-maths-ch05-t05-m-three-last-digit", "three-for-nine": "c6-maths-ch05-t05-m-nine-implies" }]);
  for (const sk of ["c6-maths-ch05-t05-s1", "c6-maths-ch05-t05-s2", "c6-maths-ch05-t05-s3"]) {
    assert.ok(hasPlay(sk), sk); const e = entryFor({ skillId: sk });
    assert.equal(e.family, "kila", sk); assert.equal(e.mode, "divisibility");
  }
});

for (const e of DE()) for (const fade of [1, 2, 3]) {
  test(`kila server ${e.topicId} divisibility/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    const folded = new Set();
    for (const child of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "kila" && cur.mode === "divisibility" && cur.params.goal === e.goal, "currentLevel serves");
      assert.ok(e.grammar.divisors.includes(cur.params.d));
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.labels, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(kilaLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && kilaLogic.malActs(level, m));
        const mg = gradeActs(level, env(kilaLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId); folded.add(kitId);
      }
      const hidden = hiddenOf(level), p = level.params;
      assert.deepEqual([...hidden].sort((a, b) => a - b), p.foes.filter((x) => x % p.d === 0).sort((a, b) => a - b), "the numbers to net are hidden");
    }
    if (Object.keys(e.misMap).length) assert.ok(folded.size > 0, "some served level discriminates a kit misconception");
  });
}
