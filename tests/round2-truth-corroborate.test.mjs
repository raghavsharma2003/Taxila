// round2 truth: server/grading/corroborate.js — a model label on a keyed item stands only when the child's words carry it.
// Cases are the three production owner-1 wrong grades (2026-10-06) plus the directions the rule must keep.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { corroborate, completeForms, supports } from "../server/grading/corroborate.js";

const ORDER = { mode: "item", key: "25, 38, 52", also: ["25 38 52"], item: { prompt_en: "Put these in order from smallest to biggest: 52, 25, 38." } };
const ALI = { mode: "item", key: "Wrong: 4/9 is less than 1/2 and 3/4 is more; with denominator 36, 16/36 < 27/36", also: ["wrong", "3/4 is bigger"],
  item: { prompt_en: "Ali says 4/9 > 3/4 because 4 > 3 and 9 > 4. Check." } };
const EIGHTH = { mode: "item", key: "An eighth is half the size of a quarter, so 3/4 is more (it is double 3/8)", also: ["3/4 is bigger", "the pieces are different sizes"],
  item: { prompt_en: "Compare 3/4 and 3/8 of a chocolate bar. Both have 3 pieces. What is different?" } };
const m = (outcome, extra = {}) => ({ outcome, source: "model", confidence: 0.9, flags: { wantsToStop: false, distress: false }, ...extra });
const run = (target, text, outcome, extra) => corroborate({ target, text, result: m(outcome, extra) });

describe("round2 truth: corroborate", () => {
  test("prod owner-1 false credits become no evidence", () => {
    assert.equal(run(ORDER, "tens first", "correct").outcome, "no_evidence");             // none of the key's numbers
    assert.equal(run(ALI, "10/15 and 9/15", "correct").outcome, "no_evidence");           // numbers nobody mentioned
    assert.match(run(ALI, "10/15 and 9/15", "correct").corroboration, /foreign_number/);
  });
  test("a sequence in the wrong order is never credited", () => {
    assert.equal(run(ORDER, "52, 38, 25", "correct").outcome, "no_evidence");
    assert.match(run(ORDER, "52, 38, 25", "correct").corroboration, /number_order/);
  });
  test("right answers in other words keep their credit", () => {
    for (const t of ["pehle 25 phir 38 phir 52", "25, 38 aur 52", "25 then 38 then 52", "twenty five, thirty eight, fifty two", "pachchees, adtees, baavan"]) assert.equal(run(ORDER, t, "correct").outcome, "correct", t);
    for (const t of ["Ali is wrong, 3/4 is bigger", "galat hai, 3/4 bada hai", "3/4 is bigger than 4/9"]) assert.equal(run(ALI, t, "correct").outcome, "correct", t);
    assert.equal(run(EIGHTH, "the pieces are different sizes so 3/4 is more", "correct").outcome, "correct");
  });
  test("opposite decisive words and a negated key are never credited", () => {
    assert.equal(run(ALI, "3/4 is smaller", "correct").outcome, "no_evidence");
    assert.equal(run(ALI, "not wrong", "correct").outcome, "no_evidence");
  });
  test("a number with another counted thing / era is never the key; a bare number the question does not name is not carried", () => {
    const CORN = { mode: "item", key: "14 corners", also: [], item: { prompt_en: "How many corners does the shape have?" } };
    assert.equal(run(CORN, "14 sides", "correct").outcome, "no_evidence");
    assert.equal(run(CORN, "14 corners", "correct").outcome, "correct");
    const COIN = { mode: "item", key: "320 BCE coin", also: [], item: { prompt_en: "Which is older?" } };
    assert.equal(run(COIN, "320 ce coin", "correct").outcome, "no_evidence");
    assert.equal(run(COIN, "320", "correct").outcome, "no_evidence");
    const LAKH = { mode: "item", key: "2,36,408", also: [], item: { prompt_en: "Write the number." } };
    assert.equal(run(LAKH, "two lakh thirty-six thousand four hundred eight", "correct").outcome, "correct");
  });
  test("a fail of words that ARE the key becomes no evidence (false_fail direction); a real miss stands", () => {
    assert.equal(run(ORDER, "25, 38, 52 hai", "incorrect").outcome, "no_evidence");
    assert.equal(run(ORDER, "52, 38, 25", "incorrect").outcome, "incorrect");
    assert.equal(run(ALI, "4/9 bada hai", "misconception", { misconceptionId: "m1" }).outcome, "misconception");
    assert.equal(run(ALI, "4/9 bada hai", "misconception", { misconceptionId: "m1" }).misconceptionId, "m1");
  });
  test("an abstained credit carries no misconception or reason, and keeps the flags", () => {
    const r = run(ORDER, "tens first", "correct", { reason: "right", flags: { wantsToStop: true, distress: false } });
    assert.equal(r.outcome, "no_evidence");
    assert.equal(r.reason, undefined);
    assert.equal(r.flags.wantsToStop, true);
  });
  test("non-model results and non-item targets pass through untouched", () => {
    const exact = { outcome: "correct", source: "exact", flags: {} };
    assert.equal(corroborate({ target: ORDER, text: "tens first", result: exact }), exact);
    const why = { mode: "why", key: null };
    const r = m("correct");
    assert.equal(corroborate({ target: why, text: "kyunki tens", result: r }), r);
    const ne = m("no_evidence");
    assert.equal(corroborate({ target: ORDER, text: "x", result: ne }), ne);
  });
  test("partial-labelled acceptable entries are not complete forms", () => {
    const t = { ...EIGHTH, alsoLabel: { "3/4 is bigger": "partial" } };
    assert.deepEqual(completeForms(t), [EIGHTH.key, "the pieces are different sizes"]);
    assert.equal(supports("25, 38, 52", "25 38 52", [25, 38, 52]).ok, true);
  });
});
