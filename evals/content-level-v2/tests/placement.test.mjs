// server/placement (RS-6 F2): code grader, CAT, session, bank invariants, and the ability.js initialBase hand-off.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNumber, gradePlacement, loadBank, poolFor, startPlacement, answerPlacement, publicItem, itemParams, pCorrect,
  nextItem, result, priorFor, startChapter, schoolYearFraction, LIMITS } from "../../../server/placement/index.js";
import { prng } from "../../../server/placement/cat.js";
import { initialBase, combine, newEpoch } from "../../../server/learner/kt/ability.js";

test("parseNumber: Indian grouping, units, fractions, mixed numbers, words; two numbers is unclear", () => {
  assert.equal(parseNumber("3,45,000"), 345000);
  assert.equal(parseNumber("₹1,585"), 1585);
  assert.equal(parseNumber("36 minutes"), 36);
  assert.equal(parseNumber("11/8"), 1.375);
  assert.equal(parseNumber("1 3/8 litres"), 1.375);
  assert.equal(parseNumber("0.6"), 0.6);
  assert.equal(parseNumber("twelve"), 12);
  assert.equal(parseNumber("teen"), 3);
  assert.equal(parseNumber("3 kg 250 g"), null);
  assert.equal(parseNumber("hmm"), null);
});

test("gradePlacement: numeric and choice items, by text, letter, index or tap; IDK and unclear are null", () => {
  const num = { format: "numeric", answer: "3250", acceptable: [] };
  assert.equal(gradePlacement(num, "3250 g"), true);
  assert.equal(gradePlacement(num, "3,250"), true);
  assert.equal(gradePlacement(num, "3205"), false);
  assert.equal(gradePlacement(num, "pata nahi"), null);
  const frac = { format: "numeric", answer: "11/8", acceptable: ["1 3/8"] };
  assert.equal(gradePlacement(frac, "1.375"), true);
  const mcq = { format: "mcq", answer: "Obtuse angle", options: [{ text: "Acute angle", correct: false }, { text: "Obtuse angle", correct: true }, { text: "Right angle", correct: false }, { text: "Reflex angle", correct: false }] };
  const shown = ["Reflex angle", "Obtuse angle", "Acute angle", "Right angle"];
  assert.equal(gradePlacement(mcq, "obtuse", shown), true);
  assert.equal(gradePlacement(mcq, "B", shown), true);
  assert.equal(gradePlacement(mcq, "a", shown), false);
  assert.equal(gradePlacement(mcq, { option: 1 }, shown), true);
  assert.equal(gradePlacement(mcq, "angle", shown), null);
});

test("bank: every usable item has a blind-solved (or adjudicated) key; classes 3-8 x maths/EVS/science each >= 30", () => {
  const bank = loadBank();
  assert.ok(bank.length >= 400, `bank ${bank.length}`);
  for (const it of bank) {
    assert.ok(it.verified?.agrees === true || it.adjudicated?.keyCorrect === true, it.id);
    assert.ok(!it.anchorMismatch);
    if (it.format === "mcq") assert.equal(it.options.filter((o) => o.correct).length, 1, it.id);
  }
  const bins = {};
  for (const it of bank) bins[`c${it.class}-${it.subject}`] = (bins[`c${it.class}-${it.subject}`] ?? 0) + 1;
  for (const c of [3, 4, 5, 6, 7, 8]) assert.ok(bins[`c${c}-maths`] >= 30, `c${c}-maths ${bins[`c${c}-maths`]}`);
  for (const c of [3, 4, 5]) assert.ok(bins[`c${c}-evs`] >= 30, `c${c}-evs`);
  for (const c of [6, 7, 8]) assert.ok(bins[`c${c}-science`] >= 30, `c${c}-science`);
});

test("public item never carries the key or the correct flag", () => {
  const { item } = startPlacement({ classLevel: 6, subject: "science", seed: 3 });
  const s = JSON.stringify(item);
  assert.ok(!("answer" in item) && !s.includes("correct"));
});

test("CAT starts mid-class: the first item is near GE C-0.7", () => {
  for (const C of [4, 5, 6, 7]) {
    const { item } = startPlacement({ classLevel: C, subject: "maths", seed: C });
    const it = loadBank().find((x) => x.id === item.id);
    assert.ok(Math.abs(it.ge - (C - 0.7)) <= 0.4, `class ${C} first item ge ${it.ge}`);
  }
});

function simulate(C, subject, theta, seed) {
  const bank = loadBank();
  const r = prng(seed);
  let { state, item } = startPlacement({ classLevel: C, subject, seed, date: "2026-10-04" });
  const seen = [];
  let res = null;
  while (item) {
    const it = bank.find((x) => x.id === item.id);
    seen.push(it.ge);
    const right = r() < pCorrect(theta, itemParams(it));
    const resp = right ? (it.format === "mcq" ? { option: item.options.indexOf(it.options.find((o) => o.correct).text) } : it.answer) : (it.format === "mcq" ? { option: item.options.indexOf(it.options.find((o) => !o.correct).text) } : "0");
    ({ state, item, result: res } = answerPlacement(state, { itemId: item.id, response: resp }));
  }
  return { res, seen, state };
}

test("CAT moves DOWN for a child two classes behind and UP for a child ahead; stops within 12", () => {
  let down = 0, up = 0;
  for (let k = 0; k < 20; k++) {
    const lo = simulate(6, "maths", 3.4, 100 + k);
    const hi = simulate(6, "maths", 6.6, 200 + k);
    assert.ok(lo.seen.length <= LIMITS.maxTotal && hi.seen.length <= LIMITS.maxTotal);
    if (Math.min(...lo.seen) < 6 - 1.5) down++;
    if (Math.max(...hi.seen) >= 6) up++;
    assert.ok(lo.res.mean < hi.res.mean);
  }
  assert.ok(down >= 17, `moved down in ${down}/20`);
  assert.ok(up >= 17, `moved up in ${up}/20`);
});

test("result: level, start rule and skip-ahead are sensible for clear cases", () => {
  const behind = simulate(5, "maths", 2.4, 7).res;
  assert.equal(behind.level, "behind");
  assert.ok(behind.startGE < 4);
  let ahead = 0;
  for (let k = 0; k < 10; k++) if (simulate(5, "maths", 6.3, 50 + k).res.skipAhead) ahead++;
  assert.ok(ahead >= 6, `skip-ahead in ${ahead}/10`);
});

test("result.placement feeds ability.js initialBase and moves the strand mean toward the evidence", () => {
  const { res } = simulate(5, "maths", 2.6, 11);
  const strands = ["maths:core"];
  const plain = initialBase({ strands, classLevel: 5, openedAt: "2026-10-04", epochId: "e0" });
  const placed = initialBase({ strands, classLevel: 5, openedAt: "2026-10-04", epochId: "e0", placement: res.placement });
  const m0 = combine(newEpoch(plain))?.m?.[0] ?? plain.m[0];
  const m1 = combine(newEpoch(placed))?.m?.[0] ?? placed.m[0];
  assert.ok(m1 < m0, `placement did not move the prior down (${m0} -> ${m1})`);
});

test("answers are replayable: same seed and answers give the same items and result", () => {
  const a = simulate(7, "science", 6.2, 999), b = simulate(7, "science", 6.2, 999);
  assert.deepEqual(a.seen, b.seen);
  assert.equal(a.res.mean, b.res.mean);
});

test("an answer for a stale item is refused; IDK is half an observation", () => {
  const { state, item } = startPlacement({ classLevel: 4, subject: "maths", seed: 5 });
  assert.throws(() => answerPlacement(state, { itemId: "nope", response: "1" }));
  const { state: s2 } = answerPlacement(state, { itemId: item.id, response: "pata nahi" });
  assert.deepEqual({ y: s2.asked[0].y, w: s2.asked[0].w }, { y: 0, w: 0.5 });
});

test("helpers: startChapter and schoolYearFraction", () => {
  assert.equal(startChapter(3.55, 4, 14), 6);
  assert.equal(startChapter(2.0, 4, 14), 1);
  assert.equal(startChapter(9, 4, 14), 14);
  assert.ok(Math.abs(schoolYearFraction("2026-10-04") - 0.61) < 0.02);
  assert.equal(schoolYearFraction("2026-04-01") < 0.01, true);
});

// Review 2026-10-05 (adversarial pass on RS-6): each case below graded a child wrongly or crashed before the fix.
test("review: option words beat letter/index; hedges and refusals are never credited", () => {
  const mcq = { format: "mcq", options: [{ text: "a square", correct: false }, { text: "a rectangle", correct: true }, { text: "a circle", correct: false }] };
  assert.equal(gradePlacement(mcq, "a rectangle"), true);
  assert.equal(gradePlacement(mcq, "A rectangle!"), true);
  assert.equal(gradePlacement(mcq, "b"), true);
  assert.equal(gradePlacement(mcq, "B) a rectangle"), true);
  const nums = { format: "mcq", options: [{ text: "3", correct: true }, { text: "1", correct: false }, { text: "4", correct: false }, { text: "2", correct: false }] };
  assert.equal(gradePlacement(nums, "3"), true);
  const pct = { format: "mcq", options: [{ text: "July had 10 fewer.", correct: true }, { text: "July had 10% fewer.", correct: false }] };
  assert.equal(gradePlacement(pct, "July had 10 fewer.", ["July had 10% fewer.", "July had 10 fewer."]), true);
  const two = { format: "numeric", answer: "2" };
  assert.equal(gradePlacement(two, "i do not know"), null);
  assert.equal(gradePlacement(two, "I do not know maybe"), null);
  assert.equal(gradePlacement(two, "do"), true);
  assert.equal(gradePlacement({ format: "numeric", answer: "0.5" }, "1/2 or 3/4"), null);
  assert.equal(gradePlacement({ format: "numeric", answer: "12" }, "12 or 13"), null);
  assert.equal(parseNumber("one or two"), null);
  assert.equal(parseNumber("two thousand"), 2000);
  assert.equal(parseNumber("do sau bees"), 220);
  assert.equal(parseNumber("4 out of 4"), 4);
});

test("review: every usable bank item grades its own key true, and every option by text, tap and letter as keyed", () => {
  for (const it of loadBank()) {
    const shown = publicItem(it, 11).options;
    if (it.format === "numeric") { for (const a of [it.answer, ...(it.acceptable ?? [])]) assert.equal(gradePlacement(it, a), true, it.id); continue; }
    shown.forEach((t, i) => {
      const want = it.options.find((o) => o.text === t).correct;
      assert.equal(gradePlacement(it, t, shown), want, `${it.id} text`);
      assert.equal(gradePlacement(it, { option: i }, shown), want, `${it.id} tap`);
      assert.equal(gradePlacement(it, "abcd"[i], shown), want, `${it.id} letter`);
    });
  }
});

test("review: a retried answer is idempotent; junk input never throws mid-round", () => {
  const { state, item } = startPlacement({ classLevel: 6, subject: "science", seed: 9 });
  const r1 = answerPlacement(state, { itemId: item.id, response: "x" });
  const again = answerPlacement(r1.state, { itemId: item.id, response: "x" });
  assert.equal(again.repeat, true);
  assert.equal(again.item.id, r1.item.id);
  assert.equal(again.state.asked.length, 1);
  let s = r1.state, cur = r1.item;
  for (const junk of [{}, [], { option: 99 }, "z".repeat(5000), 42, "", "   ", null, { option: -1 }, "🙂"]) {
    if (!cur) break;
    const out = answerPlacement(s, { itemId: cur.id, response: junk, ms: "abc" });
    assert.ok(!("ms" in out.state.asked.at(-1)));
    s = out.state; cur = out.item;
  }
  assert.throws(() => answerPlacement(null, { itemId: "x" }), /no state/);
  assert.throws(() => answerPlacement(s.done ? state : s, { itemId: "nope" }), (e) => e.code === "PLACEMENT_STALE");
});
