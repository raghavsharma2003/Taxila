// Round 7 · taraazu weigh (kg / g on a pan balance) and fill (l / ml with jugs). Pure law checks: every generated level is
// solved by its solver and is shortcut-free (never a label equal to ONE weight / jug, never an empty pan); goal met ⇔ an
// independent integer oracle (the LABEL TEXT parsed here into grams / ml, never the law's helpers) over thousands of random
// acts; each mal-rule's acts land on its OWN misconception moment and never solve; tampered params are refused; a verdict
// field in an act never decides; the generator's p95 stays fast; and every coverage entry serves a level through the play
// server's currentLevel, as the server would.
import { test } from "node:test";
import assert from "node:assert/strict";
import { weighLogic, malAmount, labelOf, decompose, BOX_KG, BOX_G, JUGS_L, JUGS_ML, BOX_FR, BOX_FR5, JUGS_FR, WEIGH_MAL } from "../src/play/families/taraazu/weigh.logic.ts";
import { balanceLogic } from "../src/play/families/taraazu/balance.logic.ts";
import { proveLevel } from "../src/play/core/pick.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf, playCheck } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, MODES, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const C4W = { "kg-is-100g": "k-kg100" }, C5W = { "mixed-concat": "k-concat", "fifty-as-half": "k-half" };
const C4F = { "l-is-100ml": "k-l100" }, C5F = { "mixed-concat": "k-concat-ml" };
const FR = { "half-is-50": "k-half50", "quarter-is-4": "k-q4", "pieces-not-size": "k-pieces" };
const CASES = [
  ["weigh", { smalls: "simple" }, C4W],
  ["weigh", { smalls: "mixed" }, C5W],
  ["fill", { smalls: "simple" }, C4F],
  ["fill", { smalls: "mixed" }, C5F],
  ["weigh", { frac: "sum" }, FR],
  ["fill", { frac: "sum" }, FR],
  ["fill", { frac: "one" }, FR],
];
const nameOf = (g) => g.smalls ?? `frac-${g.frac}`;
const req = (mode, seed, misMap, o = {}) => ({ family: "taraazu", mode, goal: mode === "fill" ? "fill" : "balance", topicId: "t", skillId: "t-s1", classLevel: 5, fade: 1, mis: {}, misMap, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = weighLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = weighLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
/** THE ORACLE: the label as the child reads it, parsed to an integer of grams / ml (independent of the law's arithmetic) */
const OF = { "½": [1, 2], "¼": [1, 4], "¾": [3, 4] };
function oracle(level) {
  const txt = labelOf(level.params);
  if (/[½¼¾]/.test(txt)) {
    // "¾ kg" / "½ kg + ¼ kg": each written fraction of 1000 (a kg in g, a litre in ml), added in plain integers
    let sum = 0;
    for (const part of txt.split(" + ")) {
      const f = /^([½¼¾]) (kg|l)$/.exec(part);
      assert.ok(f, `unparseable fraction label ${txt}`);
      const [n, d] = OF[f[1]];
      assert.equal((1000 * n) % d, 0);
      sum += (1000 * n) / d;
    }
    return sum;
  }
  const m = /^(?:(\d+) (kg|l))?(?: ?(\d+) (g|ml))?$/.exec(labelOf(level.params));
  assert.ok(m && (m[1] || m[3]), `unparseable label ${labelOf(level.params)}`);
  return (m[1] ? Number(m[1]) * 1000 : 0) + (m[3] ? Number(m[3]) : 0);
}
const loadOf = (s) => s.pan.reduce((a, b) => a + b, 0);
const levelOf = (mode, params, mal = {}, fade = 1) => weighLogic.validate({ v: "play@1", levelId: "x", family: "taraazu", mode, topicId: "t", skillId: "t-s1", fade, goal: params.goal, params, targets: [], mal, slip: null, context: params.ctx, seed: 1, proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } });
const P = (o) => ({ goal: "balance", big: 1, small: 250, form: "mixed", box: BOX_G.map((b) => ({ ...b })), cap: 0, ctx: "kirana", ...o });
const F = (o) => ({ goal: "fill", big: 1, small: 250, form: "mixed", box: JUGS_ML.map((b) => ({ ...b })), cap: 3000, ctx: "tanker", ...o });

for (const [mode, grammar, misMap] of CASES) {
  test(`taraazu/${mode} ${nameOf(grammar)}: solvable, shortcut-free, never a single weight / jug, each mal-rule lands on its own misconception`, () => {
    const seen = new Set();
    let n = 0;
    for (const seed of [1, 7, 42, 99, 123]) for (const fade of [1, 2, 3]) for (const c of weighLogic.generate(req(mode, seed, misMap, { grammar, fade }))) {
      const level = weighLogic.validate(c.level);
      assert.ok(level, c.signature);
      n++;
      assert.equal(level.mode, mode);
      const t = oracle(level);
      assert.ok(t > 0, "the empty pan never balances");
      assert.ok(!level.params.box.some((b) => b.size === t), `${c.signature}: the label is one ${mode === "fill" ? "jug" : "weight"}`);
      assert.equal(weighLogic.shortcut(level), null, `${c.signature} shortcut`);
      const solved = run(level, weighLogic.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.equal(loadOf(solved.s), t, "the solver's load is the label");
      if (grammar.smalls === "simple") assert.ok([0, 100, 200, 250, 300, 400, 500, 600, 700, 750, 800, 900].includes(level.params.small), `c4: simple grams only (${labelOf(level.params)})`);
      for (const mal of WEIGH_MAL) {
        const acts = weighLogic.malActs(level, mal);
        if (!acts) continue;
        if (!(mal in misMap)) {
          // an unmapped belief is acted out but never named: the level only names the misconceptions its topic maps
          assert.ok(!run(level, acts).ms.some((m) => m.kind === "misconception_consequence"), `${mal} named on a level that does not map it`);
          continue;
        }
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: loaded legally, then missed`);
        assert.ok(!r.s.done, `${c.signature} ${mal} must not solve`);
        assert.ok(Math.abs(loadOf(r.s) - t) >= 100, `${c.signature} ${mal}: the belief is well away from the truth`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal, `${c.signature} ${mal} named as ${mc[0].misconceptionId}`);
        const g = weighLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, misMap[mal]);
      }
    }
    assert.ok(n >= 40, `only ${n} levels`);
    for (const m of Object.keys(misMap)) assert.ok(seen.has(m), `${mode}/${nameOf(grammar)}: mal-rule ${m} never discriminated`);
  });
}

test("taraazu weigh / fill: the mal-rule amounts are the beliefs (1 kg 250 g → 350 g; 2 kg 50 g → 250 g and 2500 g; 1 l 250 ml → 350 ml)", () => {
  assert.equal(malAmount(P({ big: 1, small: 250 }), "kg-is-100g"), 350);
  assert.equal(malAmount(P({ big: 3, small: 0 }), "kg-is-100g"), 300);
  assert.equal(malAmount(P({ big: 1, small: 250, box: BOX_KG.map((b) => ({ ...b })) }), "kg-is-100g"), null, "with a 1 kg weight in the box the child uses it");
  assert.equal(malAmount(P({ big: 2, small: 50 }), "mixed-concat"), 250);
  assert.equal(malAmount(P({ big: 2, small: 50 }), "fifty-as-half"), 2500);
  assert.equal(malAmount(P({ big: 3, small: 20 }), "fifty-as-half"), 3200);
  assert.equal(malAmount(P({ big: 3, small: 10 }), "fifty-as-half"), null, "3100 is under 100 g from 3010: not well away");
  assert.equal(malAmount(P({ big: 1, small: 250 }), "mixed-concat"), null, "1 kg 250 g joined is 1250 g: the belief says nothing different");
  assert.equal(malAmount(P({ big: 0, small: 750 }), "kg-is-100g"), null, "no kg in the label");
  assert.equal(malAmount(P({ big: 2, small: 50 }), "mixed-concat", ["mixed-concat", "kg-is-100g"]), null, "250 g is also 2 × 100 + 50: one signature must name one belief");
  assert.equal(malAmount(F({ big: 1, small: 250 }), "l-is-100ml"), 350);
  assert.equal(malAmount(F({ big: 2, small: 50 }), "mixed-concat"), 250);
  assert.equal(malAmount(F({ big: 1, small: 250, box: JUGS_L.map((b) => ({ ...b })) }), "l-is-100ml"), null, "with a 1 l jug the child pours it");
  assert.equal(malAmount(F({ big: 2, small: 50 }), "fifty-as-half"), null, "fifty-as-half is a weigh belief only");
  assert.equal(malAmount(P({ big: 1, small: 250 }), "l-is-100ml"), null, "a capacity belief never fires on the balance");
  // the decomposition is exact and respects the copies
  assert.deepEqual(decompose(1250, BOX_G, false), [500, 500, 200, 50]);
  assert.deepEqual(decompose(2500, BOX_KG, false), [1000, 1000, 500]);
  assert.deepEqual(decompose(4000, BOX_KG, false), [1000, 1000, 1000, 500, 200, 200, 100]);
  assert.equal(decompose(4200, BOX_KG, false), null, "the whole box weighs 4100 g");
  assert.equal(decompose(1000, [{ size: 500, n: 1 }, { size: 200, n: 2 }], false), null, "copies are finite");
  assert.deepEqual(decompose(1250, JUGS_ML, true), [500, 500, 200, 50]);
  assert.equal(decompose(1225, JUGS_ML, true), null);
});

// r7 maap: fractions of a measure. The kit's beliefs as loads (½ → 50, ¼ → 400, a lone ¾ → 3 small pieces); never a weight
// or jug equal to the label (the box has no 250 g at all, and no 500 on a ½ label); tampered fraction params refused
const FP = (parts, small, o = {}) => P({ big: 0, small, form: "frac", parts, box: BOX_FR.map((b) => ({ ...b })), ...o });
test("taraazu frac: ½ / ¼ / ¾ of a kg or l made in g / ml; each kit belief is its own load; the box never holds the label", () => {
  const ALL = Object.keys(FR);
  assert.equal(labelOf(FP([[3, 4]], 750)), "¾ kg");
  assert.equal(labelOf(FP([[1, 2], [1, 4]], 750)), "½ kg + ¼ kg");
  assert.equal(labelOf({ ...FP([[1, 4]], 250), goal: "fill", cap: 2000, box: JUGS_FR.map((b) => ({ ...b })), ctx: "chai" }), "¼ l");
  assert.equal(malAmount(FP([[1, 2]], 500), "half-is-50", ALL), 50);
  assert.equal(malAmount(FP([[1, 4]], 250), "quarter-is-4", ALL), 400);
  assert.equal(malAmount(FP([[3, 4]], 750), "pieces-not-size", ALL), 300);
  assert.equal(malAmount(FP([[1, 2], [1, 4]], 750), "half-is-50", ALL), 300, "50 + 250");
  assert.equal(malAmount(FP([[1, 2], [1, 4]], 750), "quarter-is-4", ALL), 900, "500 + 400");
  assert.equal(malAmount(FP([[1, 2], [1, 4]], 750), "pieces-not-size", ALL), null, "pieces only on a lone ¾");
  assert.equal(malAmount(FP([[3, 4]], 750), "quarter-is-4", ALL), null, "no ¼ written: the belief says nothing here");
  assert.equal(malAmount(FP([[1, 4]], 250), "half-is-50", ALL), null);
  assert.equal(malAmount(FP([[3, 4]], 750), "kg-is-100g"), null, "the c4 kg belief never fires on a fraction label");
  assert.equal(malAmount(P({ big: 1, small: 500 }), "half-is-50"), null, "a fraction belief never fires on a mixed label");
  assert.equal(malAmount({ ...FP([[1, 2]], 500), goal: "fill", cap: 2000, box: JUGS_FR.map((b) => ({ ...b })), ctx: "chai" }, "half-is-50", ALL), 50);
  for (const b of [BOX_FR, BOX_FR5, JUGS_FR]) assert.ok(!b.some((x) => x.size === 250 || x.size === 750 || x.size === 1000), "no weight / jug is a quarter, three-quarter or whole");
  assert.ok(BOX_FR.find((b) => b.size === 100).n >= 3, "three 100 g weights: the pieces belief can be loaded as the kit says it");
  // ½ kg with the 500 g weight is a lookup: a shortcut, never proved
  const half5 = levelOf("weigh", FP([[1, 2]], 500, { box: BOX_FR5.map((b) => ({ ...b })) }));
  assert.ok(half5 && weighLogic.shortcut(half5)); assert.equal(proveLevel(weighLogic, half5), null);
  const ok = levelOf("weigh", FP([[1, 2], [1, 4]], 750));
  assert.ok(ok);
  for (const patch of [{ small: 700 }, { big: 1 }, { parts: [[2, 3]] }, { parts: [[1, 2], [1, 4], [1, 4]] }, { parts: [] }, { parts: "¾" }, { parts: [[1.5, 2]] }, { form: "mixed" }, { small: 1010, parts: [[1, 2], [1, 2]] }])
    assert.equal(weighLogic.validate({ ...ok, params: { ...ok.params, ...patch } }), null, JSON.stringify(patch));
  assert.equal(weighLogic.validate({ ...ok, params: { ...P({ big: 1, small: 250 }), parts: [[1, 4]] } }), null, "parts only with the fraction form");
});

test("taraazu weigh / fill: a label equal to one weight or jug is a shortcut and is never proved; the picker never serves it", () => {
  for (const [mode, params] of [["weigh", P({ big: 1, small: 0, box: BOX_KG.map((b) => ({ ...b })) })], ["weigh", P({ big: 0, small: 500 })], ["weigh", P({ big: 0, small: 200 })], ["fill", F({ big: 1, small: 0, box: JUGS_L.map((b) => ({ ...b })) })], ["fill", F({ big: 0, small: 500 })]]) {
    const level = levelOf(mode, params);
    assert.ok(level, labelOf(params));
    assert.ok(weighLogic.shortcut(level), `${labelOf(params)} is a lookup`);
    assert.equal(proveLevel(weighLogic, level), null);
  }
  // without the 1 kg weight, "1 kg" is two 500 g weights: the conversion is the act
  assert.equal(weighLogic.shortcut(levelOf("weigh", P({ big: 1, small: 0 }))), null);
});

test("taraazu weigh: the beam stays locked while loading; Tolo answers; the law's physical rules", () => {
  const lv = levelOf("weigh", P({ big: 1, small: 250 }), C4W, 1);
  let s = weighLogic.init(lv);
  const ap = (a) => { const r = weighLogic.apply(lv, s, a, 1); s = r.state; return r; };
  assert.equal(ap({ kind: "weigh" }).refused, "load_first", "an empty pan is never weighed");
  for (let i = 0; i < 2; i++) assert.equal(ap({ kind: "load", weight: 500 }).refused, undefined);
  assert.ok(s.locked, "loading never tips the beam");
  assert.equal(ap({ kind: "load", weight: 1000 }).refused, "bad_weight", "no 1 kg weight in this box");
  assert.equal(ap({ kind: "load", weight: 50 }).refused, undefined);
  assert.equal(ap({ kind: "load", weight: 50 }).refused, "none_left", "the box holds one 50 g weight");
  assert.equal(ap({ kind: "unload", weight: 100 }).refused, "not_on_pan");
  assert.equal(ap({ kind: "pour", jug: 500 }).refused, "no_jugs_here");
  // 1050 g against 1250 g: the parcel is heavier; fade 1 says by how much
  const miss = ap({ kind: "weigh" });
  assert.equal(miss.refused, "missed"); assert.ok(!s.locked);
  const f = miss.moments.find((m) => m.kind === "law_refused").facts;
  assert.equal(f.heavier, "parcel"); assert.equal(f.gap, "200 g");
  assert.equal(ap({ kind: "load", weight: 200 }).refused, undefined);
  assert.ok(s.locked, "a new weight locks the beam again");
  const ok = ap({ kind: "weigh" });
  assert.ok(ok.moments.some((m) => m.kind === "solved")); assert.ok(s.done);
  assert.equal(ap({ kind: "load", weight: 10 }).refused, "level_over");
  // fade 2-3: only the direction
  const l2 = levelOf("weigh", P({ big: 1, small: 250 }), C4W, 2);
  const r2 = run(l2, [{ kind: "load", weight: 500 }, { kind: "load", weight: 500 }, { kind: "load", weight: 500 }, { kind: "weigh" }]);
  const f2 = r2.ms.find((m) => m.kind === "law_refused").facts;
  assert.equal(f2.heavier, "weights"); assert.equal(f2.gap, undefined, "no amount at fade 2");
  // one 10 g / 20 g off is a near miss (partial), never a misconception
  const near = run(lv, [{ kind: "load", weight: 500 }, { kind: "load", weight: 500 }, { kind: "load", weight: 200 }, { kind: "load", weight: 20 }, { kind: "load", weight: 20 }, { kind: "weigh" }]);
  assert.ok(near.ms.some((m) => m.kind === "near_miss"));
  // undo takes the last weight back and re-locks
  let u = weighLogic.init(lv);
  for (const a of [{ kind: "load", weight: 500 }, { kind: "load", weight: 200 }, { kind: "weigh" }, { kind: "undo" }]) u = weighLogic.apply(lv, u, a, 1).state;
  assert.deepEqual(u.pan, [500]); assert.ok(u.locked); assert.equal(u.weighs, 1);
});

test("taraazu fill: jugs refill from the tap; the vessel overflows past its brim; Dekho checks", () => {
  const lv = levelOf("fill", F({ big: 1, small: 250, cap: 2000 }), C4F, 1);
  assert.ok(lv);
  const r = run(lv, [{ kind: "pour", jug: 500 }, { kind: "pour", jug: 500 }, { kind: "pour", jug: 500 }, { kind: "pour", jug: 500 }, { kind: "pour", jug: 500 }]);
  assert.deepEqual(r.refused, ["overflow"], "the fifth 500 ml jug would spill over a 2 l brim");
  assert.equal(loadOf(r.s), 2000);
  const r2 = run(lv, [{ kind: "pour", jug: 1000 }, { kind: "load", weight: 500 }, { kind: "pour", jug: 200 }, { kind: "weigh" }]);
  assert.deepEqual(r2.refused, ["bad_jug", "no_weights_here", "missed"]);
  assert.equal(r2.ms.find((m) => m.kind === "law_refused").facts.water, "below");
  assert.equal(r2.ms.find((m) => m.kind === "law_refused").facts.gap, "1050 ml");
  const ok = run(lv, weighLogic.solve(lv));
  assert.ok(ok.s.done);
});

test("taraazu weigh / fill: tampered params are refused", () => {
  const base = weighLogic.generate(req("weigh", 6, C4W, { grammar: { smalls: "simple" } }))[0].level;
  const fillL = weighLogic.generate(req("fill", 6, C4F, { grammar: { smalls: "simple" } }))[0].level;
  assert.ok(weighLogic.validate(base)); assert.ok(weighLogic.validate(fillL));
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [base, { small: 255 }], [base, { small: -10 }], [base, { big: 9 }], [base, { big: 0, small: 0 }], [base, { big: 1.5 }],
    [base, { form: "decimal" }], [base, { goal: "fill" }], [base, { goal: "win" }], [base, { ctx: "casino" }], [base, { cap: 500 }],
    [base, { box: [{ size: 333, n: 1 }, { size: 10, n: 1 }] }], [base, { box: [{ size: 500, n: 1 }, { size: 500, n: 1 }] }], [base, { box: [{ size: 500, n: 99 }, { size: 10, n: 1 }] }],
    [base, { box: [{ size: 1000, n: 1 }, { size: 500, n: 1 }], big: 3, small: 0 }],
    [base, { box: null }], [base, { small: "250" }],
    [fillL, { small: 120 }], [fillL, { cap: 100 }], [fillL, { cap: 9000 }], [fillL, { cap: 2750 }], [fillL, { box: [{ size: 500, n: 2 }, { size: 50, n: 0 }] }],
    [fillL, { box: [{ size: 10, n: 0 }, { size: 50, n: 0 }] }], [fillL, { ctx: "kirana" }],
  ]) assert.equal(weighLogic.validate(bad(lv, patch)), null, JSON.stringify(patch).slice(0, 90));
  assert.equal(weighLogic.validate({ ...base, mode: "fill" }), null, "a balance level is not a fill level");
  assert.equal(weighLogic.validate({ ...base, mode: "equation" }), null);
  assert.equal(weighLogic.validate({ ...base, params: null }), null);
});

test("taraazu weigh / fill: a verdict field in an act never decides; the first weigh decides the evidence; grade replays", () => {
  const level = weighLogic.validate(weighLogic.generate(req("weigh", 4, C4W, { grammar: { smalls: "simple" } }))[0].level);
  const forged = weighLogic.grade(level, env([{ kind: "load", weight: 10, correct: true }, { kind: "weigh", solved: true, verdict: "solved", grade: "A" }]));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  // through the sanitizer (what the server replays): the claim keys are gone, the result is the same
  const san = sanitizeActs(env([{ kind: "weigh", solved: true, correct: true }]));
  assert.deepEqual(Object.keys(san[0].act), ["kind"]);
  const ok = weighLogic.grade(level, env(weighLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "load", weight: 10 }, { kind: "weigh" }, { kind: "unload", weight: 10 }, ...weighLogic.solve(level)];
  const g = weighLogic.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.notEqual(g.evidence[0].outcome, "correct");
  assert.deepEqual(weighLogic.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per mode: the law never throws; every weigh / Dekho solves exactly when the oracle says the load is the
// label; the generator's p95 (best of 3) stays ≤ 50 ms.
for (const [mode, grammar, misMap] of CASES) {
  test(`taraazu/${mode} ${nameOf(grammar)}: ≥ 2000 random acts; goal met ⇔ the integer oracle; generator p95 ≤ 50 ms`, () => {
    let seed = 17, acts = 0, solved = 0, missed = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let g = 0; g < 40; g++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); cands = weighLogic.generate(req(mode, 300 + g, misMap, { grammar })); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 4)) {
        const level = weighLogic.validate(c.level), sol = weighLogic.solve(level), t = oracle(level);
        const sizes = level.params.box.map((b) => b.size);
        let s = weighLogic.init(level), k = 0;
        const pursue = rnd() < 0.4;
        for (let i = 0; i < 60 && !s.done; i++) {
          const r = rnd(), size = rnd() < 0.9 ? sizes[Math.floor(rnd() * sizes.length)] : 30;
          const a = pursue ? (r < 0.75 && k < sol.length ? sol[k++] : r < 0.9 ? { kind: mode === "fill" ? "pour" : "load", weight: 77, jug: 77, correct: true } : { kind: "weigh", solved: true })
            : r < 0.45 ? (mode === "fill" ? { kind: "pour", jug: size } : { kind: "load", weight: size }) : r < 0.65 ? { kind: "unload", weight: size } : r < 0.85 ? { kind: "weigh", ...(rnd() < 0.3 ? { correct: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = weighLogic.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "weigh" && out.refused !== "load_first") {
            assert.equal(out.state.done, loadOf(before) === t, `${level.levelId}: law and oracle disagree on ${before.pan}`);
            if (!out.state.done) missed++;
          }
          s = out.state;
        }
        if (weighLogic.goalMet(level, s)) { solved++; assert.equal(loadOf(s), t); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(solved > 0 && missed > 0, `solved ${solved}, missed ${missed}`);
    const p95 = times[Math.floor(times.length * 0.95)];
    assert.ok(p95 <= 50, `generator p95 ${p95} ms`);
  });
}

test("taraazu: the equation / equality modes are untouched (their logic, modes and mal-rules)", () => {
  assert.deepEqual([...balanceLogic.modes], ["equation", "equality"]);
  assert.equal(LOGIC["taraazu/equation"], balanceLogic); assert.equal(LOGIC["taraazu/equality"], balanceLogic);
  assert.equal(LOGIC["taraazu/weigh"], weighLogic); assert.equal(LOGIC["taraazu/fill"], weighLogic);
  assert.deepEqual([...MODES.taraazu], ["equation", "equality", "weigh", "fill"]);
  for (const m of ["weigh", "fill"]) {
    const a = playActOf("taraazu", m);
    assert.ok(a && a.hi && a.en && a.act !== "choose", m);
    assert.doesNotMatch(a.hi, /chun/); assert.doesNotMatch(a.en, /\b(choose|pick)\b/);
    assert.match(playCheck({ family: "taraazu", mode: m }), /never a choosing verb/);
    assert.doesNotMatch(`${a.hi} ${a.en}`, /\bbas\b/i, "'bas' belongs to the lesson's stop check-in");
  }
});

// the play server: every weigh / fill coverage entry serves a proven level (currentLevel, as /api/play does) for several
// children at every fade; the solver's acts grade solved through the server; a mal-rule the level discriminates folds its kit
// id into the evidence; the teacher may not say the label in grams / ml before it is found
const MINE = () => coverage().entries.filter((e) => e.family === "taraazu" && (e.mode === "weigh" || e.mode === "fill"));

test("taraazu weigh / fill coverage: the six authored entries, mapped to the verified kit misconceptions", () => {
  assert.deepEqual(MINE().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    "c4-maths-ch08-t01|weigh|balance|c4-maths-ch08-t01-s1,c4-maths-ch08-t01-s3",
    "c5-maths-ch08-t01|weigh|balance|c5-maths-ch08-t01-s2,c5-maths-ch08-t01-s3",
    "c4-maths-ch08-t02|fill|fill|c4-maths-ch08-t02-s1",
    "c5-maths-ch08-t02|fill|fill|c5-maths-ch08-t02-s2",
    "c4-maths-ch05-t02|weigh|balance|c4-maths-ch05-t02-s1,c4-maths-ch05-t02-s3",
    "c4-maths-ch05-t02|fill|fill|c4-maths-ch05-t02-s1,c4-maths-ch05-t02-s3",
  ]);
  assert.deepEqual(MINE().map((e) => e.misMap), [
    { "kg-is-100g": "c4-maths-ch08-t01-m-kg-is-100g" },
    { "mixed-concat": "c5-maths-ch08-t01-m-mixed-concat", "fifty-as-half": "c5-maths-ch08-t01-m-fifty-as-half" },
    { "l-is-100ml": "c4-maths-ch08-t02-m-l-is-100ml" },
    { "mixed-concat": "c5-maths-ch08-t02-m-mixed-concat" },
    ...[0, 1].map(() => ({ "half-is-50": "c4-maths-ch05-t02-m-half-is-50", "quarter-is-4": "c4-maths-ch05-t02-m-quarter-is-4", "pieces-not-size": "c4-maths-ch05-t02-m-pieces-not-size" })),
  ]);
});

for (const e of MINE()) {
  test(`taraazu server ${e.topicId} ${e.mode}/${e.goal}: currentLevel serves a proven level at every fade; solve grades solved; claims never solve`, () => {
    const kits = new Set();
    for (const fade of [1, 2, 3]) for (let n = 0; n < 4; n++) {
      const child = `w-${n}`, key = entryKey(e);
      const s = { childId: child, key, skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
        mis: {}, pL: undefined, n: 0, seed: seedOf(child, key, 0), door: "garam", recent: [], hist: null };
      const level = currentLevel(s, e);
      assert.ok(level, `${e.topicId} fade ${fade} served nothing`);
      assert.equal(level.family, "taraazu"); assert.equal(level.mode, e.mode); assert.equal(level.params.goal, e.goal); assert.equal(level.fade, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      assert.deepEqual(hiddenOf(level), [oracle(level)], "the label in the small unit is the key");
      const g = gradeActs(level, env(weighLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "weigh", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        kits.add(kitId);
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && weighLogic.malActs(level, m));
        const mg = gradeActs(level, env(weighLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
        assert.notEqual(mg.grade.verdict, "solved");
      }
    }
    // the picker prefers a level that can show a misconception: across these children it served at least one
    assert.ok(kits.size > 0, `${e.topicId}: no served level discriminated any mapped misconception`);
  });
}
