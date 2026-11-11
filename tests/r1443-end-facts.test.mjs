// 14.4.3 (QA TEST on ac4e8e88: 765d3c47, 54569fb1, 4aa87fed): a teach-back never asked was written to the parent as "Teach-back
// was not passed" (the FACTS always carried teachbackPassed: false), and an all-safeguarding lesson's record said "Kabir practised
// perimeter". The FACTS now carry a teach-back only when one was asked, and say when nothing was graded.
import { test } from "node:test";
import assert from "node:assert/strict";
import { __test } from "../server/routes/lesson.js";
import { kit } from "./fixtures/kit.mjs";

const K = kit();
const base = { topicId: K.topicId, minutes: 9, teachbackAsked: false, teachbackPassed: false, agent: {} };
const ev = [{ skill_id: K.skills[0].id, item_id: "x", outcome: "correct", hints_used: 0 }];

test("a teach-back never asked is no fact; one asked is, passed or not", () => {
  const none = __test.lessonFacts(base, ev, K);
  assert.equal("teachback" in none, false);
  assert.equal("teachbackPassed" in none, false);
  assert.equal(__test.lessonFacts({ ...base, teachbackAsked: true, teachbackPassed: true }, ev, K).teachback, "asked and passed");
  assert.equal(__test.lessonFacts({ ...base, teachbackAsked: true }, ev, K).teachback, "asked, not passed yet");
});

test("nothing graded: the FACTS say the topic is only what the lesson was about", () => {
  assert.match(__test.lessonFacts(base, [], K).practised, /nothing graded/);
  assert.equal("practised" in __test.lessonFacts(base, ev, K), false);
});
