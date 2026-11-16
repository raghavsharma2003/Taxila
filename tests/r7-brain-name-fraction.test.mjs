// Learning (staged batch): a comparison card keyed by a NAME ("Zyada kisne khaya: Gopi ne ya Anjali ne?") answered with the
// fraction the prompt states beside a name is that name's answer (graded in code, like "the bigger one" to a choice).
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyFast, nameFractions } from "../server/director/classify.js";

const item = { id: "x", kind: "practice", answer: "Anjali", acceptable: ["Anjali ne"],
  prompt_hi: "Gopi ne ek roti ka 5/6 hissa khaya aur Anjali ne 6/7 hissa. Zyada kisne khaya: Gopi ne ya Anjali ne?",
  scriptCheck: { checkId: "c1", targets: "m1", wrongIfMis: "Gopi" } };
const grade = (t) => classifyFast({ target: { mode: "item", item, key: item.answer, also: item.acceptable }, childText: t, asrConfidence: 0.95, lang: "hinglish" })?.result?.outcome;

test("nameFractions reads each name with the fraction beside it", () => {
  assert.deepEqual(nameFractions(item.prompt_hi).map((x) => x.name), ["Gopi", "Anjali"]);
});

test("the fraction beside the key's name is right; beside the listed wrong name is that misconception; any other is wrong", () => {
  assert.equal(grade("6/7"), "correct");
  assert.equal(grade("12/14"), "correct", "by value");
  assert.equal(grade("5/6"), "misconception");
  assert.equal(grade("1/2"), "incorrect");
  assert.equal(grade("Anjali"), "correct");
});

test("a number key is never mapped through names", () => {
  const n = { ...item, answer: "6/7", acceptable: [] };
  const r = classifyFast({ target: { mode: "item", item: n, key: n.answer, also: [] }, childText: "5/6", asrConfidence: 0.95, lang: "hinglish" })?.result?.outcome;
  assert.notEqual(r, "correct");
});
