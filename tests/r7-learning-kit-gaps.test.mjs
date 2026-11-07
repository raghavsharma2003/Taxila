// Round 7 F (main 2026-11-05): the next-30 script topics' kits carry a full worked example for every skill (the topic's
// workedExample, tagged with its skill, plus skillExamples for the rest), and every skill has a misconception it can be
// checked against (an item targets one, or one is tagged with the skill). Additions were authored and blind-verified by
// Claude in session (ms-r7-kit-gaps-blind); scripts/kits/kit-gaps.mjs lints shape and exact arithmetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { kitTopic, lint, wrongArithmetic } from "../scripts/kits/kit-gaps.mjs";
import { rankTopics } from "../scripts/lesson-scripts/next-topics.mjs";

const TOPICS = [
  "c4-maths-ch04-t01", "c4-maths-ch01-t02", "c5-maths-ch03-t01", "c4-maths-ch09-t01", "c6-maths-ch02-t01", "c4-maths-ch06-t01",
  "c5-maths-ch03-t02", "c6-maths-ch02-t02", "c6-maths-ch02-t03", "c4-maths-ch03-t01", "c4-maths-ch07-t01", "c6-maths-ch02-t04",
  "c5-maths-ch01-t01", "c5-maths-ch02-t03", "c5-maths-ch05-t01", "c6-maths-ch08-t01", "c5-maths-ch13-t01", "c6-maths-ch07-t01",
  "c6-maths-ch07-t03", "c4-maths-ch14-t01", "c5-maths-ch13-t02", "c6-maths-ch07-t04", "c7-maths-ch05-t01", "c4-maths-ch03-t02",
  "c4-maths-ch04-t02", "c6-maths-ch05-t01", "c6-maths-ch07-t05", "c7-maths-ch02-t01", "c7-maths-ch03-t01", "c7-maths-ch05-t02",
];

test("every skill of the 30 topics has a full worked example and a misconception to check", () => {
  for (const id of TOPICS) {
    const k = kitTopic(id);
    const covered = new Set([k.workedExample?.skillId, ...(k.skillExamples ?? []).map((x) => x.skillId)]);
    for (const s of k.skills) assert.ok(covered.has(s.id), `${s.id}: no worked example`);
    for (const x of k.skillExamples ?? []) {
      assert.ok(x.problem && x.givens?.length && x.steps.length >= 2 && x.answer && x.why, `${x.skillId}: incomplete example`);
      for (const st of x.steps) assert.deepEqual(wrongArithmetic(st.result), [], `${x.skillId}: ${st.result}`);
    }
    const misSkills = new Set([...k.items.filter((i) => i.targetsMisconception).map((i) => i.skillId), ...k.misconceptions.map((m) => m.skillId).filter(Boolean)]);
    for (const s of k.skills) assert.ok(misSkills.has(s.id), `${s.id}: no misconception`);
  }
});

test("the additions in the kits pass the gap lint (re-read from the kits themselves)", () => {
  for (const id of TOPICS) {
    const k = kitTopic(id);
    const before = { ...k, skillExamples: undefined, misconceptions: k.misconceptions.filter((m) => !m.skillId) };
    const add = { topicId: id, workedExampleSkill: k.workedExample.skillId, skillExamples: k.skillExamples ?? [], newMisconceptions: k.misconceptions.filter((m) => m.skillId) };
    assert.deepEqual(lint(add, before), [], id);
  }
});

test("the arithmetic check reads chains, lists and units, and skips mixed numbers", () => {
  assert.deepEqual(wrongArithmetic("2 × 55 + 3 × 20 = 110 + 60 = 170"), []);
  assert.deepEqual(wrongArithmetic("9 × 6 = 54, 9 × 7 = 63"), []);
  assert.deepEqual(wrongArithmetic("3 + 4/10 = 3 4/10 cm"), []);
  assert.equal(wrongArithmetic("24 + 18 = 43 m").length, 1);
  assert.equal(wrongArithmetic("9 × 6 = 54, 9 × 7 = 64").length, 1);
});

test("the list is still the top of the traffic ranking (scripted topics drop out of it)", () => {
  const ranked = rankTopics().map((t) => t.id);
  assert.ok(TOPICS.every((t) => ranked.includes(t)), "a listed topic got scripted: move it out of TOPICS");
});
