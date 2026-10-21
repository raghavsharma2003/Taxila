// r1441 (sim lab 38aad918, "Asha practised …"): the end record names the child as the learner, and a safeguarded
// lesson's record never carries the child's words. TEST replay, old → new (60 lessons, 30 with an incident):
// teacher-as-learner notes 30/60 → 0/60, disclosure in the note 8/30 → 0/30. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { endMessages, recordFence, safeguardedRecord } from "../server/routes/lesson.js";

const child = { first_name: "Riya", class_level: 5 }, teacher = { name: "Asha", pronouns: { subject: "she", object: "her" } };
const turns = [{ text: "2/5 matlab 5 mein se 2" }];

test("endMessages: the child is the learner and the parent note's subject; the teacher's pronouns are hers alone", () => {
  const sys = endMessages({ child, teacher, facts: { topic: "T", skills: [] }, childTurns: turns })[0].content;
  assert.match(sys, /The learner is Riya \(class 5\): everything practised, tried, said or mixed up .* is Riya's/);
  assert.match(sys, /never he\/she/);
  assert.match(sys, /The teacher is Asha, an AI teacher \(she\/her\): the one who taught, never the learner/);
  assert.match(sys, /parentNote: to Riya's parent, with Riya as its subject/);
  assert.doesNotMatch(sys, /lesson with Riya/);
});

test("endMessages: the check rule stays last; no child turns reads (none)", () => {
  const m = endMessages({ child, teacher, facts: { topic: "T", skills: [{ skill: "a", attempts: 1, unaidedCorrect: 1, check: "shown: x" }] }, childTurns: [] });
  assert.match(m[0].content.split("\n").at(-1), /worded only as far as its check/);
  assert.match(m[1].content, /CHILD TURNS:\n\(none\)$/);
});

test("safeguardedRecord: an incident, a safeguard move, an open or released check-in each hold the record", () => {
  assert.equal(safeguardedRecord({}, 0), false);
  assert.equal(safeguardedRecord(null, 0), false);
  assert.equal(safeguardedRecord({}, 2), true);
  assert.equal(safeguardedRecord({ safeguardedAt: 7 }, 0), true);
  assert.equal(safeguardedRecord({ safeguard: { quiet: 1 } }, 0), true);
  assert.equal(safeguardedRecord({ checkReleased: 0 }, 0), true);
});

test("recordFence: a disclosure or a safeguarding referral is dropped; lesson safety words are kept", () => {
  const note = "Myra practised naming quadrilaterals. Myra said that her father hits her when angry and that she is afraid to go home. "
    + "Please check on Myra’s immediate safety and arrange support from a trusted safeguarding professional. At home, sort shapes by their sides.";
  assert.equal(recordFence(note), "Myra practised naming quadrilaterals. At home, sort shapes by their sides.");
  assert.equal(recordFence("Krish also said, “Sometimes I feel it would be better if I weren’t here”; please check in warmly."), "");
  for (const keep of ["Riya still needs practice describing acids and bases and their safety rule.", "Aarav named the lab safety rules.",
    "At home, Yash can test safe household objects in a bowl of water.", "Asha supported the activity."]) assert.equal(recordFence(keep), keep);
});

test("recordFence lines: a summary line with a flagged sentence is dropped whole", () => {
  const sum = "Riya practised unit fractions.\nRiya said she wants to die. She then said she was okay.\nTeach-back was not passed.";
  assert.equal(recordFence(sum, { lines: true }), "Riya practised unit fractions.\nTeach-back was not passed.");
  assert.equal(recordFence(undefined, { lines: true }), "");
});
