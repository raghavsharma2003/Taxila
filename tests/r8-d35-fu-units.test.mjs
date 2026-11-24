// d35 follow-up 3: a compound quantity's units are matched to their numbers, not compared as a set (staged c4-maths-ch06-t01 s3's own
// step: "7 metre 50 metre" met the accepted "7 metre 50" and graded right; the key is 7 metre 50 cm).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scriptAskItem } from "../server/director/script.js";
import { classifyFast } from "../server/director/classify.js";
import { canon, sameAnswer } from "../server/grading/script-answer.js";

const T = "c4-maths-ch06-t01";
const script = JSON.parse(readFileSync(new URL(`../data/lesson-scripts-staged/${T}.json`, import.meta.url), "utf8"));
const sk = script.skills.find((k) => k.skillId === `${T}-s3`);
const item = scriptAskItem(sk.skillId, "worked", sk.workedExample.yourStep);
const grade = (say) => classifyFast({ target: { mode: "item", item, key: item.answer, also: item.acceptable || [] }, childText: say, typed: false, asrConfidence: 0.95 })?.result?.outcome ?? "model";

test("the real card: right forms stay right; a said unit that contradicts the key's unit for that number is not right", () => {
  assert.equal(item.answer, "7 metre 50 cm");
  for (const f of ["7 metre 50 centimetre", "7 metre 50", "750 centimetre", "7 m 50 cm", "saat metre pachaas"]) assert.equal(grade(f), "correct", f);
  for (const f of ["7 metre 50 metre", "7 centimetre 50 metre", "saat metre pachaas metre", "7 m 50 m"]) assert.notEqual(grade(f), "correct", f);
});

test("sameAnswer: units matched to their numbers; a number said with no unit still matches", () => {
  const same = (a, b) => sameAnswer(canon(a), canon(b));
  assert.equal(same("7 metre 50 centimetre", "7 m 50 cm"), true);
  assert.equal(same("7 metre 50", "7 metre 50"), true);
  assert.equal(same("7 metre 50", "7 metre 50 metre"), false, "the bare 50 of a form that names metre for 7 is not metres");
  assert.equal(same("7 metre 50 centimetre", "7 centimetre 50 metre"), false, "the same units, swapped between the numbers");
  assert.equal(same("7 metre 50", "7 centimetre 50"), false);
  assert.equal(same("40 cm", "40"), true, "one number, no unit said: as before");
  assert.equal(same("3 cm aur 4 cm", "3 cm aur 4 cm"), true);
});
