// r7 Games, E4 Kila · turn-based tower defence on a numbered path (a tower on square p fires on p, 2p, 3p, …; the wave
// moves only on a press). Pure law checks: every generated level validates, its solver solves it, no idea-free set-up wins
// (shortcut null); an INDEPENDENT brute simulator (a plain loop over the beats, counting which towers fire on each square,
// and its own reading of each goal; none of the law's helpers) agrees with the law over random play; each mal-rule's acts
// land on its OWN misconception moment; tampered params are refused; a claim in an act never decides; the set-up is locked
// while a wave rolls; the generator is fast; and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { kilaLogic, KILA_MAL, malSetup } from "../src/play/families/kila/kila.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ALL = Object.fromEntries(KILA_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "kila", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = kilaLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = kilaLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["multiples", "mark", { periods: [2], n: [12, 24] }],
  ["multiples", "mark", { periods: [3, 4, 5, 6], n: [16, 36] }],
  ["multiples", "guard", { periods: [2, 3, 4, 5, 6, 7, 8, 9], n: [16, 36] }],
  ["multiples", "common", { periods: [2, 3, 4, 5, 6], menu: [2, 3, 4, 5, 6, 7, 8, 9], n: [14, 36] }],
  ["factors", "all", { gates: 1, g: [8, 36] }],
  ["factors", "all", { gates: 2, g: [8, 36] }],
  ["lcm", "meet", { periods: [2, 3, 4, 5, 6, 8, 9, 10, 12], n: [12, 36] }],
];
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of kilaLogic.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

/** THE ORACLE. A wave rolled beat by beat over squares 1..n: on beat b every tower whose period divides b fires on square
 *  b. Returns whether the set-up meets the goal, read from the params' plain meaning (independent of the law's code). */
function oracle(p, towers, marks) {
  const standing = [...p.fixed, ...towers];
  const shots = new Array(p.n + 1).fill(0);
  for (let b = 1; b <= p.n; b++) for (const t of standing) { let k = t; while (k < b) k += t; if (k === b) shots[b]++; }
  const hit = []; for (let b = 1; b <= p.n; b++) if (shots[b] > 0) hit.push(b);
  const same = (a, b) => a.length === b.length && [...a].sort((x, y) => x - y).every((x, i) => x === [...b].sort((u, v) => u - v)[i]);
  if (p.goal === "mark") return same(marks, hit);
  if (p.goal === "meet") { let first = 0; for (let b = 1; b <= p.n && !first; b++) if (shots[b] >= 2) first = b; return marks.length === 1 && marks[0] === first; }
  if (p.goal === "all") {
    // every square-tower that lands a shot on every gate when built alone (a separate little wave per square)
    const want = [];
    for (let q = 1; q <= p.n; q++) if (p.targets.every((g) => { let k = q; while (k < g) k += q; return k === g; })) want.push(q);
    return same(towers, want);
  }
  return p.targets.every((t) => shots[t] >= 1) && p.armoured.every((t) => shots[t] >= 2) && p.decoys.every((t) => shots[t] === 0);
}

test("kila: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("kila"));
  assert.deepEqual([...MODES.kila], ["multiples", "factors", "lcm", "divisibility"]);
  assert.ok(FAMILY_ARTS.kila.length === 4);
  for (const m of MODES.kila) {
    assert.equal(LOGIC[`kila/${m}`], kilaLogic);
    const v = playActOf("kila", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

for (const [mode, goal, grammar] of CASES) {
  test(`kila/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = kilaLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(kilaLogic.shortcut(level), null, `${c.signature} shortcut`);
      const sol = kilaLogic.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(oracle(level.params, solved.s.towers, solved.s.marks), `${c.signature}: the oracle disagrees with the solver`);
      for (const mal of KILA_MAL) {
        const acts = kilaLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !oracle(level.params, r.s.towers, r.s.marks), `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = kilaLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    const expect = { mark: grammar.periods?.includes(2) ? ["factor-for-multiple", "any-odd-digit", "finite-multiples"] : ["factor-for-multiple", "finite-multiples"],
      guard: [], common: ["product"], all: grammar.gates === 1 ? ["one-and-self", "miss-pairs"] : ["one-and-self"], meet: ["product", "gcd-for-lcm", "sum"] }[goal];
    for (const m of expect) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("kila: mal-rule signatures are the beliefs (factors for multiples, stop at 10 × p, odd digit, product, common factor, ends left out, pairs from 1-3)", () => {
  for (const c of levelsOf("multiples", "mark", { periods: [2, 3] , n: [12, 36] })) {
    const p = kilaLogic.validate(c.level).params, a = p.fixed[0];
    const f = malSetup(p, "factor-for-multiple");
    assert.deepEqual(f.marks, [1, 2, 3, 4, 6, 12].filter((d) => d <= a && a % d === 0));
    const fm = malSetup(p, "finite-multiples");
    if (p.n >= 11 * a) assert.deepEqual(fm.marks, Array.from({ length: 10 }, (_, i) => (i + 1) * a)); else assert.equal(fm, null);
    const od = malSetup(p, "any-odd-digit");
    if (a === 2) assert.ok(od.marks.every((s) => s % 2 === 0 && !/[13579]/.test(String(s))) && od.marks.includes(2) && !od.marks.includes(12)); else assert.equal(od, null);
  }
  for (const c of levelsOf("lcm", "meet", { periods: [2, 3, 4, 5, 6, 8, 9, 10, 12], n: [12, 36] })) {
    const p = kilaLogic.validate(c.level).params, [a, b] = p.fixed;
    const pr = malSetup(p, "product"); if (pr) assert.deepEqual(pr.marks, [a * b]);
    const gc = malSetup(p, "gcd-for-lcm"); if (gc) { assert.ok(a % gc.marks[0] === 0 && b % gc.marks[0] === 0 && gc.marks[0] > 1); }
    const su = malSetup(p, "sum"); if (su) assert.deepEqual(su.marks, [a + b]);
  }
  for (const c of levelsOf("factors", "all", { gates: 1, g: [8, 36] })) {
    const p = kilaLogic.validate(c.level).params, G = p.targets[0];
    const os = malSetup(p, "one-and-self");
    if (os) assert.ok(!os.towers.includes(1) && !os.towers.includes(G) && os.towers.every((q) => G % q === 0));
    const mp = malSetup(p, "miss-pairs");
    if (mp) for (const q of mp.towers) assert.ok(G % q === 0 && (q <= 3 || G / q <= 3), `${G}: ${q}`);
  }
  for (const c of levelsOf("multiples", "common", { periods: [2, 3, 4, 5, 6], menu: [2, 3, 4, 5, 6, 7, 8, 9], n: [14, 36] })) {
    const p = kilaLogic.validate(c.level).params, pr = malSetup(p, "product");
    if (pr) assert.deepEqual(pr.towers, [p.armoured[0] / p.fixed[0]]);
  }
});

test("kila: no idea-free set-up wins (a period-1 tower, every square, the flags' own squares, the last square)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const level = kilaLogic.validate(c.level), p = level.params;
    if (p.menu.includes(1) && p.budget >= 1) assert.ok(!oracle(p, [1], []), `${c.signature}: tower 1 wins`);
    if (goal === "mark") assert.ok(!oracle(p, [], Array.from({ length: p.n }, (_, i) => i + 1)), `${c.signature}: netting everything wins`);
    if (goal === "meet") for (const x of [...p.fixed, p.n]) assert.ok(!oracle(p, [], [x]), `${c.signature}: trap on ${x} wins`);
    if (goal === "guard" || goal === "common") assert.ok(p.decoys.length >= 1, "a flower rules out hitting everything");
    if (goal === "all") assert.ok(p.budget < p.n, "the budget rules out building everywhere");
  }
});

test("kila: the law's rules (set-up locked while the wave rolls, undo too; budget; fixed towers; nets / towers only where the goal has them)", () => {
  const mark = kilaLogic.validate(kilaLogic.generate(req("multiples", "mark", 11, { grammar: { periods: [3], n: [18, 30] } }))[0].level);
  let s = kilaLogic.init(mark);
  const ap = (lv, a) => { const r = kilaLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  assert.equal(ap(mark, { kind: "run" }), "net_first");
  assert.equal(ap(mark, { kind: "place", at: 4 }), "no_tower");
  assert.equal(ap(mark, { kind: "mark", at: 0 }), "off_path");
  assert.equal(ap(mark, { kind: "mark", at: 3 }), undefined);
  assert.equal(ap(mark, { kind: "next" }), undefined);
  assert.equal(s.beat, 1);
  assert.equal(ap(mark, { kind: "mark", at: 6 }), "wave_rolling", "the nets are locked while the wave rolls");
  assert.equal(ap(mark, { kind: "undo" }), "wave_rolling", "no undo of a rolling wave");
  assert.equal(ap(mark, { kind: "run" }), "missed");
  assert.ok(s.ended && !s.done && s.beat === mark.params.n);
  assert.equal(ap(mark, { kind: "run" }), "change_first");
  assert.equal(ap(mark, { kind: "mark", at: 6 }), undefined);
  assert.equal(s.beat, 0, "a new set-up starts a fresh wave");
  const all = kilaLogic.validate(kilaLogic.generate(req("factors", "all", 4, { grammar: { gates: 1, g: [12, 12] } }))[0].level);
  s = kilaLogic.init(all);
  assert.equal(ap(all, { kind: "mark", at: 2 }), "no_net");
  assert.equal(ap(all, { kind: "run" }), "build_first");
  assert.equal(ap(all, { kind: "remove", at: 2 }), "no_tower_here");
  for (let q = 1; q <= all.params.budget; q++) assert.equal(ap(all, { kind: "place", at: q }), undefined);
  assert.equal(ap(all, { kind: "place", at: all.params.budget + 1 }), "budget");
  assert.equal(ap(all, { kind: "place", at: 1 }), "built");
  const common = kilaLogic.validate(kilaLogic.generate(req("multiples", "common", 4, { grammar: { periods: [4], n: [14, 36] } }))[0].level);
  s = kilaLogic.init(common);
  assert.equal(ap(common, { kind: "place", at: common.params.fixed[0] }), "fixed");
  const meet = kilaLogic.validate(kilaLogic.generate(req("lcm", "meet", 4, { grammar: { periods: [4, 6], n: [14, 36] } }))[0].level);
  s = kilaLogic.init(meet);
  assert.equal(ap(meet, { kind: "run" }), "trap_first");
  ap(meet, { kind: "mark", at: 5 }); ap(meet, { kind: "mark", at: 12 });
  assert.deepEqual(s.marks, [12], "one trap: placing it again moves it");
  assert.equal(ap(meet, { kind: "run" }), undefined);
  assert.ok(s.done, "4 and 6 first fire together on 12");
  assert.deepEqual(hiddenOf(meet), [12], "the teacher never says the meeting square");
});

test("kila: tampered params are refused", () => {
  const g = (mode, goal, grammar) => kilaLogic.generate(req(mode, goal, 6, { grammar }))[0].level;
  const mark = g("multiples", "mark", { periods: [3], n: [16, 36] }), meet = g("lcm", "meet", { periods: [4, 6], n: [16, 36] });
  const all = g("factors", "all", { gates: 1, g: [12, 24] }), common = g("multiples", "common", { periods: [3, 4], n: [14, 36] }), guard = g("multiples", "guard", {});
  for (const lv of [mark, meet, all, common, guard]) assert.ok(kilaLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [mark, { n: 40 }], [mark, { n: 5 }], [mark, { fixed: [1] }], [mark, { fixed: [3, 4] }], [mark, { menu: [2] }], [mark, { budget: 1 }], [mark, { goal: "win" }], [mark, { n: 2.5 }],
    [meet, { fixed: [4, 8] }], [meet, { n: 12 }], [meet, { fixed: [4] }], [meet, { decoys: [7] }],
    [all, { budget: 1 }], [all, { budget: 99 }], [all, { menu: [1, 2, 3] }], [all, { targets: [5, 7, 11] }], [all, { decoys: [5] }],
    [common, { menu: [...common.params.menu, common.params.fixed[0]].sort((a, b) => a - b) }], [common, { decoys: [common.params.fixed[0] * 2] }], [common, { budget: 2 }], [common, { armoured: [] }],
    [guard, { decoys: [] }], [guard, { targets: [] }], [guard, { budget: guard.params.menu.length }], [guard, { targets: [guard.params.decoys[0]] }],
  ]) assert.equal(kilaLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  assert.equal(kilaLogic.validate({ ...mark, mode: "lcm" }), null, "a goal belongs to its mode");
  assert.equal(kilaLogic.validate({ ...mark, params: null }), null);
});

test("kila: a claim in an act never decides; the first wave decides the evidence; grade replays", () => {
  const level = kilaLogic.validate(kilaLogic.generate(req("lcm", "meet", 4, { grammar: { periods: [4, 6], n: [16, 36] } }))[0].level);
  const forged = kilaLogic.grade(level, env([{ kind: "mark", at: 1, correct: true }, { kind: "run", solved: true, verdict: "solved" }]));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = kilaLogic.grade(level, env(kilaLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "mark", at: 1 }, { kind: "run" }, ...kilaLogic.solve(level)];
  const g = kilaLogic.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(kilaLogic.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per goal: the law never throws; whenever a wave reaches the gate the law's verdict equals the oracle on
// the set-up that rolled; a solved level always agrees with the oracle; the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`kila/${mode}/${goal}: ≥ 2000 random acts; the wave's verdict ⇔ the brute oracle; never throws; generator p95 ≤ 50 ms`, () => {
    let seed = 17, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let gi = 0; gi < 40; gi++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); cands = kilaLogic.generate(req(mode, goal, 100 + gi, { grammar })); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 4)) {
        const level = kilaLogic.validate(c.level), p = level.params, sol = kilaLogic.solve(level);
        let s = kilaLogic.init(level), k = 0;
        const pursue = rnd() < 0.4;
        for (let i = 0; i < 80 && !s.done; i++) {
          const r = rnd(), at = 1 + Math.floor(rnd() * (p.n + 1));
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.35 ? { kind: "mark", at, ...(rnd() < 0.2 ? { correct: true } : {}) } : r < 0.6 ? { kind: "place", at } : r < 0.7 ? { kind: "remove", at }
            : r < 0.82 ? { kind: "next" } : r < 0.93 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = kilaLogic.apply(level, s, a, i + 1);
          acts++;
          if ((a.kind === "next" || a.kind === "run") && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, oracle(p, before.towers, before.marks), `${level.levelId}: law and oracle disagree on towers ${before.towers} marks ${before.marks}`);
          }
          s = out.state;
        }
        if (kilaLogic.goalMet(level, s)) { solved++; assert.ok(oracle(p, s.towers, s.marks)); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

// the play server: every kila coverage entry serves a proven level at every fade (levelsFor and currentLevel); the
// solver's acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const KE = () => coverage().entries.filter((e) => e.family === "kila");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("kila coverage: the twelve authored entries, mapped to real kit misconceptions; new topics admitted by skill", () => {
  assert.deepEqual(KE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c4-maths-ch03-t01|multiples|mark", "c5-maths-ch13-t01|multiples|mark", "c5-maths-ch13-t01|multiples|guard", "c5-maths-ch13-t01|multiples|common",
    "c5-maths-ch13-t01|lcm|meet", "c5-maths-ch13-t02|factors|all", "c6-maths-ch05-t01|factors|all", "c6-maths-ch05-t01|lcm|meet",
    "c6-maths-ch05-t05|divisibility|ones", "c6-maths-ch05-t05|divisibility|tail", "c6-maths-ch05-t05|divisibility|sum", "c7-maths-ch11-t02|lcm|meet"]);
  for (const e of KE()) for (const kit of Object.values(e.misMap)) assert.ok(kit.startsWith(`${e.topicId}-m-`), kit);
  // the topics no law family had before (ITEM-ARENA alone, or nothing) are kila's now
  for (const sk of ["c4-maths-ch03-t01-s1", "c4-maths-ch03-t01-s2", "c5-maths-ch13-t01-s1", "c5-maths-ch13-t01-s2", "c5-maths-ch13-t01-s3", "c5-maths-ch13-t02-s2", "c5-maths-ch13-t02-s3"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "kila", sk);
  }
});

for (const e of KE()) for (const fade of [1, 2, 3]) {
  test(`kila server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "kila" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
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
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      // the teacher never says a value the child has not produced yet
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}
