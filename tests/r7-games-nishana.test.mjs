// r7 Games nishana2 (studio-play-coverage-expansion): two more hop kinds on the number line.
//   ÷ (c7-maths-ch10-t02): the dividend is a flag, the pod is the quotient, a chain of hops from 0 ends at pod × divisor.
//   decimals (c7-maths-ch03-t04): the pod starts on a decimal and hops a decimal on a tenths line.
// The existing nishana levels are pinned (served levelIds before this change). An independent plain-arithmetic checker
// (written without the family's hopValue) recomputes every served answer and judges a ≥ 2000-act random battery.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lineLogic, malHop, hopText } from "../src/play/families/nishana/line.logic.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import coverage from "../data/play/coverage.json" with { type: "json" };

const ROOT = new URL("../", import.meta.url).pathname;
const DIV = { grammar: { ops: ["÷"] }, misMap: { "div-neg-neg": "k-sign-mix", "div-by-size": "k-sign-mix" } };
const DEC = { grammar: { ops: ["+", "-"], decimals: 2 }, misMap: { "dec-right-align": "k1", "dec-separate-parts": "k2", "dec-smaller-from-larger": "k3" } };
const req = (seed, kind, fade = 1) => ({ family: "nishana", mode: "hop", goal: "hop", topicId: "t", skillId: "t-s1", classLevel: 7, fade, mis: {}, misMap: kind.misMap, grammar: kind.grammar, recent: [], seed });
const run = (level, acts) => { let s = lineLogic.init(level); const ms = []; acts.forEach((a, i) => { const r = lineLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); }); return { s, ms }; };

/** the independent checker: the answer by plain arithmetic, never the family's hopValue */
function truthOf(h) {
  if (h.op === "÷") { for (let q = -100; q <= 100; q++) if (q * h.b === h.a) return q; return NaN; }
  const c = (x) => Math.round(x * 100), r = h.op === "+" ? c(h.a) + c(h.b) : c(h.a) - c(h.b);
  return r / 100;
}

// ── 1. the existing levels are unchanged (served levelIds captured before nishana2)
const PINNED = [
  ["c4-maths-ch04-t02", "compare", "line-cmp:1,000,250_0-10000-8493909"],
  ["c5-maths-ch02-t01", "place", "line-fraction:11/10_0-2-518521328"],
  ["c6-maths-ch10-t01", "place", "line-integer:_1_-10-10-512121090"],
  ["c6-maths-ch10-t02", "compare", "line-cmp:_1,_5_-20-5-27742201"],
  ["c7-maths-ch03-t03", "compare", "line-cmp:0.06,0.081_0-1-617781006"],
  ["c7-maths-ch03-t01", "place", "line-decimal:0.17_0-1-981862295"],
  ["c4-maths-ch04-t03", "round", "line-round:1079_100-242906593"],
  ["c5-maths-ch01-t02", "round", "line-round:14735_10000-998635960"],
  ["c6-maths-ch10-t03", "hop", "line-hop:-10_-10-426608881"],
  ["c7-maths-ch10-t01", "hop", "line-hop:-2_-3-164595854"],
];
const serve = async (entry, child, fade = 1, n = 0) => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  const key = entryKey(entry);
  const s = { childId: child, key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
    mis: {}, pL: undefined, n, seed: seedOf(child, key, n), door: "garam", recent: [], hist: null };
  return currentLevel(s, entry);
};
test("nishana2: the existing nishana levels serve exactly as before (pinned levelIds)", async () => {
  for (const [topicId, goal, id] of PINNED) {
    const entry = coverage.entries.find((e) => e.family === "nishana" && e.topicId === topicId && e.goal === goal);
    assert.ok(entry, topicId);
    const lv = await serve(entry, "pin-0");
    assert.equal(lv?.levelId, id, `${topicId} ${goal}`);
  }
});

// ── 2. law: valid, solved by the solver, shortcut-free when served, each mal-rule named; the checker agrees
for (const [name, kind] of [["÷", DIV], ["decimal", DEC]]) {
  test(`nishana2 ${name}: valid, the value is the plain-arithmetic answer, solved by the solver, each mal-rule lands on its own misconception`, () => {
    let n = 0;
    const seen = new Set();
    for (const seed of [1, 2, 3, 9, 31]) for (const fade of [1, 2, 3]) for (const c of lineLogic.generate(req(seed, kind, fade))) {
      const level = lineLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, "hop");
      const p = level.params, h = p.hop, v = p.values[0];
      assert.ok(Math.abs(v.num / v.den - truthOf(h)) < 1e-9, `${c.signature}: ${v.num}/${v.den} vs ${truthOf(h)}`);
      assert.equal(v.text, hopText(h));
      assert.ok(v.text.length <= 12, v.text);
      assert.ok(h.a >= p.lo && h.a <= p.hi && v.num / v.den >= p.lo && v.num / v.den <= p.hi);
      if (name === "÷") { assert.ok(p.lo <= 0 && p.hi >= 0, "the chain starts at 0"); assert.ok(p.tol < 0.5); assert.ok(h.a < 0 || h.b < 0); }
      else { assert.ok(p.tol < 0.05, "a tenth off is a different answer"); assert.ok(p.hi - p.lo <= 4 && p.lo >= 0); assert.equal(v.form, "decimal"); }
      const solved = run(level, lineLogic.solve(level));
      assert.ok(solved.s.done, `${c.signature} solves`);
      if (lineLogic.shortcut(level)) continue;
      n++;
      for (const mal of Object.keys(kind.misMap)) {
        const acts = lineLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.ok(!r.s.done, `${c.signature} ${mal}`);
        const named = r.ms.filter((m) => m.kind === "misconception_consequence").map((m) => m.misconceptionId);
        assert.deepEqual(named, [mal], `${c.signature} ${mal} named alone`);
      }
    }
    assert.ok(n >= 40, `${n} served`);
    assert.deepEqual([...seen].sort(), Object.keys(kind.misMap).sort(), "every mal-rule has levels that tell it apart");
  });

  test(`nishana2 ${name}: the picker serves proven levels (shortcut null) and the generator's p95 ≤ 50 ms`, () => {
    const times = [];
    for (let seed = 1; seed <= 40; seed++) {
      const fade = 1 + (seed % 3);
      let best = Infinity, r = null;
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); r = pickLevels(lineLogic, req(seed, kind, fade)); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      assert.ok(r, `seed ${seed}`);
      for (const lv of [r.garam, r.teekha].filter(Boolean)) {
        assert.equal(lineLogic.shortcut(lv), null, lv.levelId);
        assert.ok(lineLogic.validate(lv), lv.levelId);
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(times[Math.floor(times.length * 0.95)] < 50, `p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });

  test(`nishana2 ${name}: ≥ 2000 random acts; solved ⇔ the pod sits on the independent checker's answer; never throws`, () => {
    let seed = 7, acts = 0, solved = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    for (let gi = 0; gi < 60; gi++) {
      const cands = lineLogic.generate(req(200 + gi, kind, 1 + (gi % 3)));
      for (const c of cands.slice(0, 3)) {
        const level = lineLogic.validate(c.level), p = level.params, t = truthOf(p.hop);
        let s = lineLogic.init(level);
        for (let k = 0; k < 14 && !s.done; k++) {
          const r0 = rnd();
          const a = r0 < 0.08 ? { kind: "undo" } : r0 < 0.4 ? { kind: "commit" } : { kind: "place", which: 0, x: rnd() < 0.35 ? t + (rnd() - 0.5) * 4 * p.tol : p.lo + rnd() * (p.hi - p.lo) };
          const r = lineLogic.apply(level, s, a, k + 1);
          acts++;
          s = r.state;
          if (lineLogic.goalMet(level, s)) { solved++; assert.ok(Math.abs(s.marks[0] - t) <= p.tol + 1e-9, `${level.levelId}: solved off the answer`); }
          else if (a.kind === "commit" && !r.refused) assert.fail(`${level.levelId}: a commit that neither solved nor missed`);
          if (a.kind === "commit" && s.marks[0] !== null && Math.abs(s.marks[0] - t) <= p.tol) assert.ok(s.done, `${level.levelId}: on the answer but not solved`);
        }
      }
    }
    assert.ok(acts >= 2000, `${acts} acts`);
    assert.ok(solved >= 20, `${solved} solved`);
  });
}

// ── 3. the beliefs land where the kit's own examples say
test("nishana2: the beliefs land where the kit says", () => {
  // c7-maths-ch10-t02: m-sign-mix ((−20) ÷ (−5) = −4; its diagnostic tags 12 ÷ (−3) = 4 too)
  assert.equal(malHop({ a: -20, b: -5, op: "÷" }, "div-neg-neg"), -4);
  assert.equal(malHop({ a: 12, b: -3, op: "÷" }, "div-by-size"), 4);
  assert.equal(malHop({ a: -12, b: 3, op: "÷" }, "div-neg-neg"), null);
  assert.equal(malHop({ a: -12, b: 3, op: "÷" }, "div-by-size"), null);
  assert.equal(malHop({ a: -20, b: -5, op: "÷" }, "div-by-size"), null, "one belief per level");
  // c7-maths-ch03-t04: right-align (2.5 + 1.25 = 1.50; 12.5 + 3.75 = 5.00; 0.5 + 0.25 = 0.30), separate-parts
  // (2.7 + 1.5 = 3.12; 4.8 + 3.7 = 7.15), smaller-from-larger (5.3 − 2.8 = 3.5; 7.4 − 2.9 = 5.5)
  assert.equal(malHop({ a: 2.5, b: 1.25, op: "+" }, "dec-right-align"), 1.5);
  assert.equal(malHop({ a: 12.5, b: 3.75, op: "+" }, "dec-right-align"), 5);
  assert.equal(malHop({ a: 0.5, b: 0.25, op: "+" }, "dec-right-align"), 0.3);
  assert.equal(malHop({ a: 2.7, b: 1.5, op: "+" }, "dec-separate-parts"), 3.12);
  assert.equal(malHop({ a: 4.8, b: 3.7, op: "+" }, "dec-separate-parts"), 7.15);
  assert.equal(malHop({ a: 5.3, b: 2.8, op: "-" }, "dec-smaller-from-larger"), 3.5);
  assert.equal(malHop({ a: 7.4, b: 2.9, op: "-" }, "dec-smaller-from-larger"), 5.5);
  assert.equal(malHop({ a: 8.2, b: 3.65, op: "-" }, "dec-smaller-from-larger"), 5.45);
  assert.equal(malHop({ a: 5, b: 1.25, op: "-" }, "dec-smaller-from-larger"), 4.25, "5 = 5.00");
  // a belief that agrees with the truth says nothing
  assert.equal(malHop({ a: 2.3, b: 1.4, op: "+" }, "dec-separate-parts"), null);
  assert.equal(malHop({ a: 5.8, b: 2.3, op: "-" }, "dec-smaller-from-larger"), null);
  assert.equal(malHop({ a: 2.5, b: 1.5, op: "+" }, "dec-right-align"), null);
  // integer hops are untouched by the new beliefs
  assert.equal(malHop({ a: -3, b: -4, op: "+" }, "dec-right-align"), null);
  assert.equal(hopText({ a: -12, b: -3, op: "÷" }), "−12 ÷ (−3)");
  assert.equal(hopText({ a: 2.5, b: 1.25, op: "+" }), "2.5 + 1.25");
});

test("nishana2: forged levels are refused (value from the operands, whole quotients, 2-place non-negative decimals)", () => {
  const lv = lineLogic.validate(lineLogic.generate(req(4, DIV))[0].level);
  const forge = (base, hop, value) => ({ ...base, params: { ...base.params, hop: { ...base.params.hop, ...hop }, ...(value ? { values: [{ ...base.params.values[0], ...value }] } : {}) } });
  assert.equal(lineLogic.validate(forge(lv, {}, { num: lv.params.values[0].num + 1 })), null, "a wrong quotient");
  assert.equal(lineLogic.validate(forge(lv, { a: 7, b: 2 }, { num: 3 })), null, "a divisor that does not divide");
  assert.equal(lineLogic.validate(forge(lv, { a: 6, b: 0 }, { num: 0 })), null, "÷ 0");
  const dl = lineLogic.validate(lineLogic.generate(req(4, DEC))[0].level);
  assert.ok(dl);
  assert.equal(lineLogic.validate(forge(dl, {}, { num: dl.params.values[0].num + 1 })), null, "a wrong sum");
  assert.equal(lineLogic.validate(forge(dl, { a: 2.125, b: 1, op: "+" }, { num: 3125, den: 1000 })), null, "3 places");
  assert.equal(lineLogic.validate(forge(dl, { b: 0.5, op: "×" })), null, "decimal × is not a hop here");
});

// ── 4. every new coverage entry serves through currentLevel, with its kit ids
test("nishana2: every new coverage entry serves a level as the play server would, its misMap the kit's ids", async () => {
  const kit = JSON.parse(readFileSync(`${ROOT}data/kits/c7-maths.json`, "utf8"));
  const kitMis = new Set(JSON.stringify(kit).match(/c7-maths-ch(10-t02|03-t04)-m-[a-z-]+/g));
  const mine = coverage.entries.filter((e) => e.family === "nishana" && ["c7-maths-ch10-t02", "c7-maths-ch03-t04"].includes(e.topicId));
  assert.equal(mine.length, 2);
  for (const entry of mine) {
    assert.equal(entry.mode, "hop");
    for (const id of Object.values(entry.misMap)) assert.ok(kitMis.has(id), id);
    for (const fade of [1, 2, 3]) for (let n = 0; n < 3; n++) {
      const lv = await serve(entry, `t-${n}`, fade, n);
      assert.ok(lv && lv.mode === "hop", `${entry.topicId} fade ${fade}`);
      assert.equal(lineLogic.shortcut(lv), null);
      assert.ok(run(lv, lineLogic.solve(lv)).s.done);
      if (entry.topicId === "c7-maths-ch10-t02") assert.equal(lv.params.hop.op, "÷");
      else assert.equal(lv.params.values[0].form, "decimal");
    }
  }
});

test("nishana2: the hop's answer stays hidden from the reaction lines", async () => {
  const { hiddenOf } = await import("../server/play/react.js");
  const entry = coverage.entries.find((e) => e.family === "nishana" && e.topicId === "c7-maths-ch03-t04");
  const lv = await serve(entry, "h-1");
  const v = lv.params.values[0];
  assert.deepEqual(hiddenOf(lv), [v.num / v.den]);
});

test("nishana2: every word the view uses exists in all three languages; vakya's words stay last; no clock, randomness or colour literal", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/nishana/line.view.ts`, "utf8");
  const used = [...view.matchAll(/"(nishana\.[a-zA-Z.]+)"/g)].map((m) => m[1]);
  for (const k of ["nishana.goal.div", "nishana.goal.divNeg", "nishana.reach"]) assert.ok(used.includes(k), k);
  for (const k of used) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/nishana/line.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
