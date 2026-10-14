// round 5 (main, 2026-10-14; sim lab evals/simlab/results/r5-voice-base-vs-combo: on the voice lane correct verdicts fell
// 77 → 51): spoken Hindi numbers as the ASR writes them. ONE reader (server/grading/spoken-number.js) for the comprehension
// grader, R-KEY and the Director's fast path; the ASR's fused hundreds ("छेसो"); working aloud graded on the last result.
// Every case here failed on the base reader (comprehension/grade/numbers.js before this commit). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { numbersIn, matchNumber } from "../server/comprehension/grade/numbers.js";
import { rKey } from "../server/comprehension/grade/ops.js";
import { numberPhrases, spokenNumber } from "../server/grading/spoken-number.js";
import { classifyFast } from "../server/director/classify.js";

const WORKING = "तीस टाइम्स चालीस है, तीन टाइम्स चार बारह, दो जीरो बारह सौ";

test("Devanagari hundreds and thousands read whole (base: बारह सौ → 100, आठ हजार छह सौ चौदह → 8600)", () => {
  assert.deepEqual(numbersIn("बारह सौ"), [1200]);
  assert.deepEqual(numbersIn("आठ हजार छह सौ चौदह"), [8614]);
  assert.equal(matchNumber("बारह सौ", 1200), "correct");
  assert.equal(matchNumber("आठ हजार छह सौ चौदह", 8614), "correct");
  // the rest of 1-99 as the ASR writes them, with or without the nukta / candrabindu
  for (const [w, v] of [["चौंसठ", 64], ["अड़तीस", 38], ["अडतीस", 38], ["निन्यानवे", 99], ["सैंतालीस", 47], ["छे", 6]]) assert.equal(spokenNumber(w), v, w);
});

test("the ASR's fused hundreds: छेसो = छह सौ, and its kin in both scripts (base: तीन लाख एक हज़ार छेसो → 301000)", () => {
  assert.deepEqual(numbersIn("तीन लाख एक हज़ार छेसो"), [301600]);
  for (const [w, v] of [["पाँचसो", 500], ["पांचसो", 500], ["सातसो", 700], ["आठसो", 800], ["नौसो", 900], ["दोसो", 200], ["तीनसो", 300], ["चारसो", 400],
    ["छह सो", 600], ["chheso", 600], ["paanchso", 500], ["teensau", 300]]) assert.equal(spokenNumber(w), v, w);
  // a bare Roman "so" is English, never a hundred
  assert.equal(spokenNumber("paanch so"), 5);
});

test("working aloud is graded on the LAST stated result; the operands never count, never make it wrong", () => {
  assert.deepEqual(numbersIn(WORKING), [30, 40, 3, 4, 12, 2, 0, 1200]);
  assert.equal(matchNumber(WORKING, 1200), "correct");
  assert.equal(rKey(WORKING, 1200), "correct");
  assert.equal(rKey(WORKING, 1300), "wrong");
  const target = { mode: "item", key: "1200", also: [], item: { id: "w1", prompt_en: "What is 30 × 40?" } };
  const fast = classifyFast({ target, childText: WORKING, asrConfidence: 0.92, lang: "hindi" });
  assert.equal(fast.result?.outcome, "correct", JSON.stringify(fast.result ?? fast));
  const wrong = classifyFast({ target: { ...target, key: "1300" }, childText: WORKING, asrConfidence: 0.92, lang: "hindi" });
  assert.notEqual(wrong.result?.outcome, "correct");
});

test("controls: the one-number reader still refuses two numbers back to back; split mode is opt-in", () => {
  assert.equal(numberPhrases("two three"), null);
  assert.deepEqual(numberPhrases("two three", { split: true }), [2, 3]);
  assert.equal(spokenNumber("12 ya 13"), null, "a hedge is still no one number");
  assert.equal(matchNumber("3... nahi nahi, 4", 4), "correct");
  assert.deepEqual(numbersIn("I do not know", { lang: "en" }), []);
});
