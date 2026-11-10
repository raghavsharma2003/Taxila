// r7 audit (routed to learner): homework/match.js gave findTopic the whole sentence, and findTopic needs every long word to
// start a title word (rj-r4t-findtopic-as-intake), so "fractions ka homework hai" found only the subject. The caller now
// strips filler and activity words; findTopic is unchanged. Real curriculum, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { matchHomework } from "../server/homework/match.js";

const c5 = { classLevel: 5 };

test("a Hinglish sentence around a topic word finds the topic", () => {
  for (const t of ["fractions ka homework hai", "mujhe fractions ka homework karna hai", "Fractions ke sawal"]) {
    const m = matchHomework(t, c5);
    assert.equal(m?.rung, "topic", t);
    assert.match(m.topicTitle, /Fraction/, t);
  }
  assert.match(matchHomework("perimeter wala sawal", c5)?.topicTitle ?? "", /Perimeter/);
  assert.equal(matchHomework("area aur perimeter ka homework", c5)?.rung, "topic");
});

test("activity words alone still name nothing (rj-r4t-activity-word-as-topic)", () => {
  assert.equal(matchHomework("copy check ki", c5), null);
  assert.equal(matchHomework("test ki revision karni hai", c5), null);
});

test("a subject name alone gives the subject rung", () => {
  assert.equal(matchHomework("maths ka homework", c5)?.subject, "maths");
  assert.equal(matchHomework("maths ka homework", c5)?.rung, "subject");
});
