// r7 Games, E4 Kila · HCF × LCM = product (c7-maths-ch11-t03), mode lcm: balance (build the wall = the HCF, set the trap = the
// LCM; the scale lays wall × trap beside a × b), missing (the one hidden value of tower b / wall / trap), three (three towers:
// the trap where all three first meet; h × L is not a × b × c), coprime (a composite tower's partner that shares no stride
// but 1; the pads' one prime divides the tower), mend (wall × trap = the stones, the wall's bricks landing on the trap; the
// draft wall cannot). Pure law checks: every generated level validates, solves, is shortcut-free; an INDEPENDENT checker
// (a plain wave over the squares counting shots, strides found by trial division; none of the law's helpers) agrees with the
// law over random play; each mal-rule's acts land on its OWN misconception and commit the belief's own set-up; the levels
// vary across seeds; tampered params are refused; the set-up is locked while a wave rolls; the generator is fast; every new
// coverage entry serves a proven level through the play server; and the existing kila levels are unchanged (pinned).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { kilaLogic, KILA_MAL, malSetup } from "../src/play/families/kila/kila.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { GAME_WEIGHT } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const words = JSON.parse(readFileSync(new URL("../data/play/engine-words.json", import.meta.url), "utf8"));
const ALL = Object.fromEntries(KILA_MAL.map((m) => [m, `k-${m}`]));
const req = (goal, seed, o = {}) => ({ family: "kila", mode: "lcm", goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = kilaLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = kilaLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const P = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18];
const CASES = [
  ["balance", { periods: P, n: [16, 72] }],
  ["missing", { periods: P, n: [16, 72], hides: ["b", "wall", "trap"] }],
  ["missing", { periods: P, n: [16, 72], hides: ["b"] }],
  ["three", { periods: [2, 3, 4, 5, 6, 8, 9, 10, 12], n: [12, 72] }],
  ["coprime", { periods: [4, 8, 9, 15], n: [30, 72] }],
  ["mend", { n: [16, 60] }],
];
const EXPECT = { balance: ["product", "low-wall"], missing: ["lcm-over-a", "low-wall"], three: ["three-numbers", "pair-only"], coprime: ["prime-partner"], mend: ["any-pair"] };
const levelsOf = (goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) out.push(...kilaLogic.generate(req(goal, seed, { grammar, fade })));
  return out;
};

/** THE INDEPENDENT CHECKER. A wave over squares 1..n: a tower t fires on square s when stepping t, 2t, 3t, … lands on s.
 *  The biggest shared stride is found by trying every stride from the smallest number down. */
const lands = (t, s) => { let k = t; while (k < s) k += t; return k === s; };
const firstAll = (towers, upto) => { for (let s = 1; s <= upto; s++) if (towers.every((t) => lands(t, s))) return s; return 0; };
const bigStride = (xs) => { for (let d = Math.min(...xs); d >= 1; d--) if (xs.every((x) => lands(d, x))) return d; return 1; };
function checker(p, towers, marks) {
  const childWall = p.goal === "balance" || p.goal === "mend" || (p.goal === "missing" && p.hide === "wall");
  const fire = [...p.fixed, ...(childWall ? [] : towers)];
  const wall = p.wall || (childWall ? towers[0] : 0), trap = p.trap || marks[0];
  if (p.goal === "three") return trap === firstAll(fire, 10000);
  if (p.goal === "coprime") return fire.length === 2 && bigStride(fire) === 1;
  if (p.goal === "mend") return !!wall && !!trap && wall * trap === p.stones && lands(wall, trap);
  return fire.length === 2 && wall === bigStride(fire) && trap === firstAll(fire, 10000);
}

test("kila HCF × LCM: the goals belong to lcm, the 2D view serves them, every goal word exists in three languages before vakya's", () => {
  assert.equal(LOGIC["kila/lcm"], kilaLogic);
  assert.ok(readFileSync(new URL("../src/play/families/views.ts", import.meta.url), "utf8").includes(`"kila/lcm": makeKilaView`));
  const keys = Object.keys(words.words), firstVakya = keys.findIndex((k) => k.startsWith("vakya."));
  for (const k of ["kila.goal.balance", "kila.goal.missing.b", "kila.goal.missing.wall", "kila.goal.missing.trap", "kila.goal.three", "kila.goal.coprime", "kila.goal.mend", "kila.tool.wall", "kila.tool.trap"]) {
    for (const l of ["hinglish", "en", "hi"]) assert.ok(words.words[k]?.[l], `${k} ${l}`);
    assert.ok(keys.indexOf(k) < firstVakya, `${k} before vakya`);
  }
  assert.ok(keys[keys.length - 1].startsWith("vakya."));
  const src = readFileSync(new URL("../src/play/families/kila/kila.logic.ts", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
});

for (const [goal, grammar] of CASES) {
  test(`kila/lcm/${goal} ${JSON.stringify(grammar.hides ?? "")}: every level validates, solves, is shortcut-free; the checker agrees; each mal-rule lands on its own misconception with the belief's set-up`, () => {
    const seen = new Set(), cands = levelsOf(goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = kilaLogic.validate(c.level);
      assert.ok(level, c.signature);
      const p = level.params;
      assert.equal(level.mode, "lcm"); assert.equal(p.goal, goal);
      if (grammar.hides) assert.ok(grammar.hides.includes(p.hide));
      assert.equal(kilaLogic.shortcut(level), null, `${c.signature} shortcut`);
      const solved = run(level, kilaLogic.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, []);
      assert.ok(checker(p, solved.s.towers, solved.s.marks), `${c.signature}: the checker disagrees with the solver`);
      // the limit of the law shows on every three level: h × L is not a × b × c (the solved scale never balances)
      if (goal === "three") { const [a, b, x] = p.fixed; assert.notEqual(p.wall * solved.s.marks[0], a * b * x, c.signature); }
      // coprime: the right partner is never prime and the pads' one prime divides the tower
      if (goal === "coprime") {
        const primes = p.menu.filter((q) => bigStride([q, q - 1]) === 1 && [...Array(q).keys()].slice(2).every((d) => q % d));
        assert.equal(primes.length, 1); assert.ok(lands(primes[0], p.fixed[0]));
        assert.ok(solved.s.towers.every((q) => !primes.includes(q)));
      }
      for (const mal of KILA_MAL) {
        const acts = kilaLogic.malActs(level, mal);
        if (!acts) continue;
        assert.ok(EXPECT[goal].includes(mal) || (goal === "missing" && mal === "product") || (goal === "balance" && mal === "product"), `${c.signature}: ${mal} is not this goal's`);
        seen.add(mal);
        const su = malSetup(p, mal), [a, b, x] = p.fixed;
        if (mal === "three-numbers") assert.deepEqual(su.marks, [(a * b * x) / p.wall]);
        if (mal === "pair-only") assert.deepEqual(su.marks, [firstAll([a, b], 10000)]);
        if (mal === "prime-partner") assert.ok(lands(su.towers[0], a) && su.towers[0] > 1);
        if (mal === "any-pair") { assert.deepEqual(su.towers, [p.draft]); assert.deepEqual(su.marks, [p.stones / p.draft]); assert.ok(!lands(p.draft, p.stones / p.draft)); }
        if (mal === "lcm-over-a") assert.deepEqual(su.towers, [p.trap / a]);
        if (mal === "product") assert.ok(su.marks[0] === a * b);
        if (mal === "low-wall") { assert.ok(lands(su.towers[0], a) && lands(su.towers[0], b) && su.towers[0] < bigStride([a, b])); }
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}`);
        assert.ok(!r.s.done && !checker(p, r.s.towers, r.s.marks));
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1); assert.equal(mc[0].misconceptionId, mal);
        const g = kilaLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of EXPECT[goal]) if (!(goal === "missing" && grammar.hides?.length === 1 && m !== "lcm-over-a")) assert.ok(seen.has(m), `${goal}: ${m} never discriminated`);
  });
}

test("kila HCF × LCM: real variety across seeds (the first level of 16 seeds; distinct pairs, paths and hidden values)", () => {
  for (const [goal, grammar] of CASES) {
    const firsts = [], shapes = new Set();
    for (let seed = 1; seed <= 16; seed++) {
      const c = kilaLogic.generate(req(goal, seed, { grammar }))[0];
      firsts.push(c.signature);
      const p = c.level.params;
      shapes.add(goal === "mend" ? `${p.stones}` : goal === "coprime" ? `${p.fixed}|${p.menu}` : `${p.fixed}`);
    }
    assert.ok(new Set(firsts).size >= 13, `${goal}: only ${new Set(firsts).size} distinct first levels in 16 seeds`);
    assert.ok(shapes.size >= 5, `${goal}: only ${shapes.size} distinct numbers in 16 seeds`);
  }
  const hides = new Set();
  for (let seed = 1; seed <= 16; seed++) hides.add(kilaLogic.generate(req("missing", seed, { grammar: CASES[1][1] }))[0].level.params.hide);
  assert.deepEqual([...hides].sort(), ["b", "trap", "wall"], "missing hides each of tower b, the wall and the trap");
});

test("kila HCF × LCM: tampered params are refused", () => {
  const g = (goal, grammar, seed = 6) => kilaLogic.generate(req(goal, seed, { grammar }))[0].level;
  const bal = g("balance", CASES[0][1]), mb = g("missing", { ...CASES[1][1], hides: ["b"] }), mw = g("missing", { ...CASES[1][1], hides: ["wall"] }), mt = g("missing", { ...CASES[1][1], hides: ["trap"] });
  const three = g("three", CASES[3][1]), cop = g("coprime", CASES[4][1]), mend = g("mend", CASES[5][1]);
  for (const lv of [bal, mb, mw, mt, three, cop, mend]) assert.ok(kilaLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  const [a, b] = bal.params.fixed;
  for (const [lv, patch] of [
    [bal, { n: 80 }], [bal, { fixed: [a, 2 * a] }], [bal, { wall: 2 }], [bal, { trap: lv0(bal) }], [bal, { budget: 0 }], [bal, { menu: bal.params.menu.filter((q) => q !== gcdOf(a, b)) }], [bal, { decoys: [5] }], [bal, { n: lcmOf(a, b) - 1 }],
    [mb, { wall: mb.params.wall + 1 }], [mb, { trap: mb.params.trap + 1 }], [mb, { wall: 0 }], [mb, { hide: "both" }], [mb, { fixed: [mb.params.fixed[0], 5] }],
    [mw, { trap: mw.params.trap * 2 }], [mw, { wall: 1 }], [mt, { wall: mt.params.wall * 2 }], [mt, { trap: 5 }], [mt, { budget: 1, menu: [2] }],
    [three, { wall: three.params.wall + 1 }], [three, { fixed: three.params.fixed.slice(0, 2) }], [three, { trap: 4 }], [three, { fixed: [2, 3, 5], wall: 1 }],
    [cop, { fixed: [7] }], [cop, { menu: [...cop.params.menu, 1].sort((x, y) => x - y) }], [cop, { menu: cop.params.menu.filter((q) => bigStride([q, cop.params.fixed[0]]) > 1) }], [cop, { budget: 2 }],
    [mend, { stones: mend.params.n - 1 }], [mend, { draft: 1 }], [mend, { draft: mend.params.stones + 1 }], [mend, { fixed: [4] }], [mend, { stones: 7919 }],
  ]) assert.equal(kilaLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  assert.equal(kilaLogic.validate({ ...bal, mode: "multiples" }), null, "a goal belongs to its mode");
  function lv0(lv) { return lcmOf(lv.params.fixed[0], lv.params.fixed[1]); }
  function gcdOf(x, y) { return bigStride([x, y]); }
  function lcmOf(x, y) { return firstAll([x, y], 10000); }
});

test("kila HCF × LCM: the law's rules (one wall / tower that moves, one trap, standing squares fixed, locked while the wave rolls; a claim never decides; hidden values)", () => {
  const level = kilaLogic.validate(kilaLogic.generate(req("balance", 3, { grammar: { periods: [12, 18], n: [40, 40] } }))[0].level), p = level.params;
  assert.deepEqual(p.fixed, [12, 18]);
  let s = kilaLogic.init(level);
  const ap = (a) => { const r = kilaLogic.apply(level, s, a, 1); s = r.state; return r.refused; };
  assert.equal(ap({ kind: "run" }), "build_first");
  assert.equal(ap({ kind: "place", at: 12 }), "fixed");
  assert.equal(ap({ kind: "place", at: 3 }), undefined);
  assert.equal(ap({ kind: "place", at: 6 }), undefined);
  assert.deepEqual(s.towers, [6], "building the wall elsewhere moves it");
  assert.equal(ap({ kind: "run" }), "trap_first");
  ap({ kind: "mark", at: 72 > p.n ? 30 : 30 }); ap({ kind: "mark", at: 36 });
  assert.deepEqual(s.marks, [36], "one trap: setting it again moves it");
  assert.equal(ap({ kind: "next" }), undefined);
  assert.equal(ap({ kind: "place", at: 2 }), "wave_rolling");
  assert.equal(ap({ kind: "mark", at: 2 }), "wave_rolling");
  assert.equal(ap({ kind: "undo" }), "wave_rolling");
  assert.equal(ap({ kind: "run" }), undefined);
  assert.ok(s.done, "6 × 36 = 12 × 18: the wall 6 and the trap 36 hold");
  assert.deepEqual(hiddenOf(level), [6, 36], "the teacher never says the wall or the trap");
  const three = kilaLogic.validate(kilaLogic.generate(req("three", 2, { grammar: CASES[3][1] }))[0].level);
  s = kilaLogic.init(three);
  const ap3 = (a) => { const r = kilaLogic.apply(three, s, a, 1); s = r.state; return r.refused; };
  assert.equal(ap3({ kind: "place", at: 5 }), "no_tower");
  const cop = kilaLogic.validate(kilaLogic.generate(req("coprime", 2, { grammar: CASES[4][1] }))[0].level);
  s = kilaLogic.init(cop);
  const apc = (a) => { const r = kilaLogic.apply(cop, s, a, 1); s = r.state; return r.refused; };
  assert.equal(apc({ kind: "mark", at: 5 }), "no_net");
  assert.equal(apc({ kind: "place", at: cop.params.n }), "no_pad");
  const forged = kilaLogic.grade(level, env([{ kind: "place", at: 2, correct: true }, { kind: "mark", at: 3 }, { kind: "run", solved: true, verdict: "solved" }]));
  assert.notEqual(forged.verdict, "solved");
});

// ≥ 2000 random acts per goal: the law never throws; whenever a wave reaches the gate the law's verdict equals the checker on
// the set-up that rolled; the generator's CPU p95 ≤ 50 ms
for (const [goal, grammar] of CASES) {
  test(`kila/lcm/${goal}: ≥ 2000 random acts; the wave's verdict ⇔ the checker; generator work bounded (counted, not timed)`, () => {
    let seed = 23, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const candCounts = []; // candidates per generate/pick: a count, not a clock (tests/_work.mjs)
    for (let gi = 0; gi < 40; gi++) {
      let cands = [];
      cands = kilaLogic.generate(req(goal, 200 + gi, { grammar }));
      candCounts.push(cands.length);
      for (const c of cands.slice(0, 4)) {
        const level = kilaLogic.validate(c.level), p = level.params, sol = kilaLogic.solve(level);
        let s = kilaLogic.init(level), k = 0;
        const pursue = rnd() < 0.4;
        for (let i = 0; i < 80 && !s.done; i++) {
          const r = rnd(), at = rnd() < 0.5 && p.menu.length ? p.menu[Math.floor(rnd() * p.menu.length)] : 1 + Math.floor(rnd() * (p.n + 1));
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.3 ? { kind: "mark", at } : r < 0.55 ? { kind: "place", at } : r < 0.65 ? { kind: "remove", at }
            : r < 0.78 ? { kind: "next" } : r < 0.92 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = kilaLogic.apply(level, s, a, i + 1);
          acts++;
          if ((a.kind === "next" || a.kind === "run") && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, checker(p, before.towers, before.marks), `${level.levelId}: law and checker disagree on ${before.towers} / ${before.marks}`);
          }
          s = out.state;
        }
        if (kilaLogic.goalMet(level, s)) { solved++; assert.ok(checker(p, s.towers, s.marks)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(Math.max(...candCounts) <= 72, `${Math.max(...candCounts)} candidates per call (measured 2026-11-10: 24; bound is 3x)`);
  });
}

// the play server: the five new entries serve a proven level at every fade; solve grades solved; a claim never solves; a
// mal-rule the level discriminates folds its kit id; the teacher never says the answer
const NEW = () => coverage().entries.filter((e) => e.family === "kila" && e.topicId === "c7-maths-ch11-t03");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("kila HCF × LCM coverage: five entries on c7-maths-ch11-t03, mapped only to the topic's own kit misconceptions; every skill is kila's now", () => {
  assert.deepEqual(NEW().map((e) => `${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    "lcm|balance|c7-maths-ch11-t03-s1", "lcm|missing|c7-maths-ch11-t03-s2", "lcm|three|c7-maths-ch11-t03-s3", "lcm|coprime|c7-maths-ch11-t03-s3", "lcm|mend|c7-maths-ch11-t03-s3"]);
  assert.deepEqual(NEW().map((e) => e.misMap), [{}, {}, { "three-numbers": "c7-maths-ch11-t03-m-three-numbers" }, { "prime-partner": "c7-maths-ch11-t03-m-coprime-prime" }, { "any-pair": "c7-maths-ch11-t03-m-any-pair" }]);
  for (const sk of ["c7-maths-ch11-t03-s1", "c7-maths-ch11-t03-s2", "c7-maths-ch11-t03-s3"]) { assert.ok(hasPlay(sk)); assert.equal(entryFor({ skillId: sk }).family, "kila", sk); }
});

for (const e of NEW()) for (const fade of [1, 2, 3]) {
  test(`kila server ${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id; hidden values`, () => {
    const ids = new Set();
    for (const child of ["c1", "c2", "c3", "c4"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "kila" && cur.mode === "lcm" && cur.params.goal === e.goal, "currentLevel serves");
      ids.add(cur.levelId);
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
      assert.ok(hiddenOf(level).length > 0, "hidden values");
    }
    assert.ok(ids.size >= 3, `${e.goal}: four children were served only ${ids.size} distinct levels`);
  });
}

test("kila HCF × LCM: the mapped beliefs are served (some served level discriminates each kit misconception)", () => {
  for (const e of NEW()) for (const kitId of Object.values(e.misMap)) {
    let found = false;
    for (let k = 0; k < 12 && !found; k++) for (const fade of [1, 2, 3]) {
      const s = sessionOf(e, { fade, childId: `m${k}`, seed: seedOf(`m${k}`, entryKey(e), 0) });
      if (levelsFor(s, e).garam.proof.discriminates.includes(kitId)) { found = true; break; }
    }
    assert.ok(found, `${e.goal}: ${kitId} is never served`);
  }
});

// The existing kila levels are the very same: before r7 kila2 the generator over every existing kila entry (20 seeds, three
// fades, classes 4-7: 53,940 candidates) hashed as below, and the play server served these levelIds (two children each, fade 1)
test("kila2: existing kila entries generate and serve the same levels as before (pinned)", () => {
  const OLD = coverage().entries.filter((x) => x.family === "kila" && x.topicId !== "c7-maths-ch11-t03");
  const h = createHash("sha256"); let n = 0;
  for (const e of OLD) { const logic = LOGIC[`kila/${e.mode}`];
    for (let seed = 0; seed < 20; seed++) for (const fade of [1, 2, 3]) for (const cls of [4, 5, 6, 7]) {
      for (const c of logic.generate({ family: "kila", mode: e.mode, goal: e.goal, topicId: e.topicId, skillId: e.skillId, classLevel: cls, fade, mis: {}, misMap: e.misMap, grammar: e.grammar, recent: [], seed })) { h.update(JSON.stringify(c)); n++; }
    } }
  assert.equal(n, 53940);
  assert.equal(h.digest("hex"), "8cc728455df23420efacc8219dfb6f27249be18d6bf70e872fdc38f3f3f18d72");
  const PIN = ["kila-mark:2:16-60131924", "kila-mark:2:16-79537", "kila-mark:3:35-483343672", "kila-mark:3:33-811223282", "kila-guard:3:34:9,24:34-451128617", "kila-guard:3:26:15,21:20-791223935",
    "kila-common:4_6:12:15:3,10-495251395", "kila-common:4_6:12:36:14,15-156762213", "kila-meet:4,6:32-869326172", "kila-meet:4,6:29-524382621", "kila-all:35-728697165", "kila-all:35-889201791",
    "kila-all:12,32-247597", "kila-all:12,16-635278510", "kila-meet:6,9:32-737187824", "kila-meet:3,5:23-521454662",
    "kila-ones:2:837,8284,633,5945,1192,357,558,375,8090-65916164", "kila-ones:2:2385,695,4062,9477,6758,1844,6071,631,437-385335429",
    "kila-tail:4:337,9296,27957,81308,53238,2794,2082,64556-716149627", "kila-tail:4:154,2326,472,858,78676,292,226,929-92493102",
    "kila-sum:3:315,4898,566,125,87476,117,36798,1492-736550242", "kila-sum:3:458,28902,2699,409,57850,30648,7809,468-191077893", "kila-meet:4,6:30-63696603", "kila-meet:4,6:25-464402304"];
  const ids = [];
  for (const e of OLD) for (let k = 0; k < 2; k++) ids.push(currentLevel(sessionOf(e, { childId: `pin${k}`, seed: seedOf(`pin${k}`, entryKey(e), 0) }), e)?.levelId);
  assert.deepEqual(ids, PIN);
});
