// Round 7 F, learning-homework-help: the match ladder (server/homework/match.js) behind POST /api/homework/match.
// Pure apart from reading the class kits.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEM_MIN, matchHomework, overlap, tokens } from "../server/homework/match.js";

test("tokens: lower case, Devanagari digits, thousands separators, stop words dropped", () => {
  assert.deepEqual(tokens("What is 1,250 + २५?"), ["1250", "25"]);
  assert.deepEqual(tokens("Write the NOUN in this sentence"), ["noun", "sentence"]);
});

test("overlap: different numbers are a different question, whatever the words", () => {
  assert.equal(overlap(tokens("add 3 and 4"), tokens("add 3 and 5")), 0);
  assert.equal(overlap(tokens("add 3 and 4"), tokens("add 4 and 3")), 1);
});

test("rung kit_item: a kit question of the child's class, as typed or reworded", () => {
  const m = matchHomework("Write in numerals: twenty-four thousand three hundred sixty.", { classLevel: 5 });
  assert.equal(m.rung, "kit_item");
  assert.equal(m.topicId, "c5-maths-ch01-t01");
  assert.equal(m.chapter, 1);
  assert.ok(m.itemId && m.score >= ITEM_MIN);
  assert.equal(matchHomework("write in numerals twenty four thousand three hundred sixty", { classLevel: 5 }).rung, "kit_item");
});

test("rung topic: words naming a topic or chapter of the class book; rung subject: subject words only", () => {
  const t = matchHomework("tell me about the water cycle", { classLevel: 5 });
  assert.equal(t.rung, "topic");
  assert.equal(t.subject, "evs");
  const s = matchHomework("what is a noun", { classLevel: 5 });
  assert.deepEqual(s, { rung: "subject", topicId: null, subject: "english", chapter: null, topicTitle: null });
});

test("the subject rung offers only subjects the class has (no EVS in class 7)", () => {
  const m = matchHomework("questions about animals and plants", { classLevel: 7 });
  if (m) assert.notEqual(m.subject, "evs");
});

test("nothing recognisable → null; bad input → null", () => {
  assert.equal(matchHomework("hello", { classLevel: 5 }), null);
  assert.equal(matchHomework("", { classLevel: 5 }), null);
  assert.equal(matchHomework("add 2 and 3", { classLevel: 12 }), null);
});
