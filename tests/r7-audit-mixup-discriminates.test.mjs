// r7 audit LEARN-03: a right answer on an item that targets a mix-up is evidence against it (kt/misconception.js
// discriminating_correct). live.js answerEvents never passed `discriminates`, so no lesson answer could clear a mix-up
// in the ledger. Kit items carry targetsMisconception; a script then-card carries scriptThen.targets. Pure, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { answerEvents } from "../server/learner/live.js";
import { misconceptionEffects } from "../server/learner/kt/misconception.js";

const kit = { topicType: "T3", verified: true };
const run = (activeItem, outcome = "correct") => answerEvents({
  lessonId: "L1", startedAt: 0, now: 1000, childSeq: 1, cls: { source: "number" }, prev: { activeItemId: activeItem.id }, kit, activeItem,
  evidence: [{ skillId: "s1", itemId: activeItem.id, probe: "P15", outcome, hintsUsed: 0, weight: 1 }],
}).events;

test("a first-try right answer on an item that targets a mix-up discriminates it", () => {
  const [e] = run({ id: "i1", skillId: "s1", targetsMisconception: "mis-a" });
  assert.equal(e.discriminates, "mis-a");
  assert.deepEqual(misconceptionEffects(e), [{ id: "mis-a", kind: "discriminating_correct" }]);
});

test("a script then-card discriminates the mix-up it names", () => {
  const [e] = run({ id: "script:s1:then:mis-b", skillId: "s1", scriptThen: { targets: "mis-b" } });
  assert.equal(e.discriminates, "mis-b");
});

test("an item with no mix-up carries none", () => {
  const [e] = run({ id: "i2", skillId: "s1" });
  assert.equal(e.discriminates, undefined);
});

test("choice items too", () => {
  const [e] = run({ id: "i3", skillId: "s1", targetsMisconception: "mis-c", options: [{ text: "a" }, { text: "b" }, { text: "c" }] });
  assert.equal(e.discriminates, "mis-c");
});
