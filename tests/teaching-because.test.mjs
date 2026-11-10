// round 8 (docs/patches/to-learning, r8-loop): the parent's teaching page turns a lesson's knows.<choice> decision rows
// into plain "because" lines in the child's language, titled from the kit, with no ids and nothing for unknown rows.
import test from "node:test";
import assert from "node:assert/strict";
import { becauseOf } from "../server/reports/teaching.js";

const kit = { skills: [{ id: "c5-maths-ch02-t01-s1", title: "Mark unit fractions on a number line" }], misconceptions: [{ id: "c5-maths-ch02-t01-m-count-marks", belief: "count the marks, not the gaps" }] };
const rows = [
  { point_id: "knows.compress", options: { on: "c5-maths-ch02-t01-s1", fact: { kind: "learned_delayed_check", skillId: "c5-maths-ch02-t01-s1" }, source: "x" } },
  { point_id: "knows.checkOrder", options: JSON.stringify({ on: "c5-maths-ch02-t01-s1", fact: { kind: "open_mixup", misconceptionId: "c5-maths-ch02-t01-m-count-marks", skillId: "c5-maths-ch02-t01-s1" } }) },
  { point_id: "knows.prereqCheck", options: { on: "c4-maths-ch05-t01", fact: { kind: "wheel_spin", skillId: "c5-maths-ch02-t01-s1", prereqTopicId: "c4-maths-ch05-t01" } } },
  { point_id: "explain_format", options: {} },
  { point_id: "knows.nope", options: { on: "x", fact: { kind: "x" } } },
];

test("knows rows become the parent's lines, titled, in the child's language", () => {
  const en = becauseOf(rows, { name: "Riya", lang: "english", kit, seed: "L1" });
  assert.equal(en.length, 3);
  assert.match(en[0], /Mark unit fractions on a number line/);
  assert.match(en[1], /count the marks, not the gaps/);
  for (const t of en) assert.doesNotMatch(t, /c\d-maths|script:|-m-|undefined/);
  const hi = becauseOf(rows, { name: "Riya", lang: "hinglish", kit, seed: "L1" });
  assert.equal(hi.length, 3);
  assert.notDeepEqual(hi, en);
  assert.deepEqual(becauseOf([], { name: "Riya", lang: "english", kit }), []);
});
