// main 14.4 (4B's finding): spoken Devanagari fractions. "एक बटा दो" read as [1,2] and a right 1/2 answer earned no evidence;
// azure-speech writes बटा as बता, and "मुझे बता दो" ("tell me") read as 2. The rules (shared with 4B's numerals.ts and
// duplex/understand.js): "<n> बटा <n>" is a fraction; "<n> बता <n>" is one only between two numbers; a Devanagari दो right
// after a verb stem is the verb unless a fraction claims it. Measured: 52 fraction-key items x 4 Devanagari spoken forms of
// the key, classify(): 0/208 earned evidence before, 208/208 after; 0/208 wrong forms credited. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { numberPhrases, tailAgrees } from "../server/grading/spoken-number.js";
import { readUtterance } from "../server/learner/affect.js";
import { targetFor, classifyFast } from "../server/director/classify.js";
import { kit } from "./fixtures/kit.mjs";

test("Devanagari fractions read as fractions; बता only between two numbers; दो after a verb stem is the verb", () => {
  const cases = [["एक बटा दो", [0.5]], ["एक बता दो", [0.5]], ["तीन बटा चार", [0.75]], ["1 बटा 2", [0.5]], ["1 बता 2", [0.5]], ["दो बटा तीन", [2 / 3]],
    ["मुझे बता दो", []], ["समझा दो", []], ["दिखा दो", []], ["ek bata do", [0.5]], ["mujhe bata do", []], ["दो", [2]], ["सात घटा दो", [7, 2]]];
  for (const [t, want] of cases) assert.deepEqual(numberPhrases(t), want, t);
});

test("'एक बता दो' is a fraction, not a request for the answer; 'मुझे बता दो' and 'जवाब बता दो' still ask", () => {
  assert.equal(readUtterance("एक बता दो").asksForAnswer, false);
  assert.equal(readUtterance("तीन बता चार").asksForAnswer, false);
  assert.equal(readUtterance("मुझे बता दो").asksForAnswer, true);
  assert.equal(readUtterance("एक बता दो, जवाब बता दो").asksForAnswer, true);
  assert.equal(readUtterance("दीदी बता दो ना").asksForAnswer, true);
});

test("the tail check reads a spoken Devanagari fraction as the number itself; no other Devanagari tail verdict moves", () => {
  assert.equal(tailAgrees("1/2", "एक बटा दो"), true);
  assert.equal(tailAgrees("1/2", "एक बता दो"), true);
  assert.equal(tailAgrees("1/2", "एक बटा दो किताबें"), false, "a noun after the fraction is still judged");
  // main's check: over 2,008 Devanagari sim-lab lines x their item keys only the two fraction lines moved; these keep today's verdict
  for (const [t, k] of [["तीन कोने", "3 corners"], ["पाँच मीटर", "5 m"], ["दो किलो", "2 kg"]]) assert.equal(tailAgrees(k, t), true, t);
});

test("the code path grades a spoken Devanagari fraction against a 1/2 key; a wrong one is not credited", () => {
  const K = kit(); const it = K.items.find((i) => i.id === "i1");
  const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: it.id }, K, it);
  for (const t of ["एक बटा दो", "एक बता दो"]) assert.equal(classifyFast({ target, childText: t, asrConfidence: 0.9, typed: false, lang: "hindi" }).result?.outcome, "correct", t);
  assert.notEqual(classifyFast({ target, childText: "एक बटा तीन", asrConfidence: 0.9, typed: false, lang: "hindi" }).result?.outcome, "correct");
});
