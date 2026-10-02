import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeKit } from "../server/content/kits.js";
import { compareAnswers } from "../server/content/minikit.js";
import { pickTopic, topicStatus } from "../server/content/next-topic.js";
import { getTopic, topicSequence, topicIdByPrefix } from "../server/content/curriculum.js";
import { RAW_KIT } from "./fixtures/kit.mjs";

test("normalizeKit drops items whose key a blind solver disputed, pads hints, keeps the rest", () => {
  const k = normalizeKit(structuredClone(RAW_KIT), { topicId: RAW_KIT.topicId, verified: true });
  assert.ok(!k.items.some((i) => i.id === "bad"), "verified.agrees === false is dropped");
  assert.equal(k.items.length, RAW_KIT.items.length - 1);
  assert.equal(k.verified, true);
  const raw = structuredClone(RAW_KIT);
  raw.items[0].hints = ["pump: one only"];
  assert.equal(normalizeKit(raw, { topicId: raw.topicId, verified: true }).items[0].hints.length, 4);
});

test("normalizeKit returns null for a partial kit that cannot run a practice phase", () => {
  const raw = structuredClone(RAW_KIT);
  raw.items = raw.items.slice(0, 2);
  assert.equal(normalizeKit(raw, { topicId: raw.topicId, verified: true }), null);
  assert.equal(normalizeKit(null, { topicId: "x", verified: true }), null);
  const noWorked = structuredClone(RAW_KIT);
  delete noWorked.workedExample;
  assert.equal(normalizeKit(noWorked, { topicId: raw.topicId, verified: true }).workedExample, null);
});

test("compareAnswers: only a provable numeric disagreement is 'different'", () => {
  assert.equal(compareAnswers("1/2", ["half"], "half"), "same");
  assert.equal(compareAnswers("1/2", [], "0.5"), "same");
  assert.equal(compareAnswers("4", [], "5"), "different");
  assert.equal(compareAnswers("the parts are equal", [], "equal parts"), "unclear");
});

test("curriculum: topics load in teaching order and mini-kit ids trace back to their topic", () => {
  const t = getTopic("c4-maths-ch05-t01");
  assert.equal(t.title, "Fractions as equal shares");
  assert.equal(t.classLevel, 4);
  const seq = topicSequence(4, "maths");
  assert.ok(seq.indexOf("c4-maths-ch05-t01") < seq.indexOf("c4-maths-ch05-t02"));
  assert.equal(topicIdByPrefix("c4-maths-ch05-t01-s2"), "c4-maths-ch05-t01");
});

test("topicStatus: learned needs every kit skill; weak needs repeated low evidence", () => {
  const learned = { status: "learned_today", pKnown: 0.7, attempts: 4 };
  assert.equal(topicStatus([], 2), "unseen");
  assert.equal(topicStatus([learned], 2), "in_progress", "one of two skills learned is not the topic learned");
  assert.equal(topicStatus([learned, learned], 2), "learned");
  assert.equal(topicStatus([{ status: "practising", pKnown: 0.2, attempts: 5 }], 2), "weak");
});

test("pickTopic: first unfinished topic, back-chained to a weak prerequisite (TaRL)", () => {
  const order = ["a", "b", "c"];
  const prereqs = { a: [], b: ["a"], c: ["b", "x"], x: [] };
  const st = (m) => (id) => m[id] ?? "unseen";
  assert.equal(pickTopic(order, st({}), (id) => prereqs[id]), "a");
  assert.equal(pickTopic(order, st({ a: "learned", b: "mastered" }), (id) => prereqs[id]), "c");
  // c is next but its prerequisite x (an earlier class) is weak → teach x first.
  assert.equal(pickTopic(order, st({ a: "learned", b: "learned", x: "weak" }), (id) => prereqs[id]), "x");
  // c itself is weak → go down to an unseen prerequisite.
  assert.equal(pickTopic(order, st({ a: "learned", b: "learned", c: "weak" }), (id) => prereqs[id]), "x");
  assert.equal(pickTopic(order, st({ a: "learned", b: "learned", c: "learned" }), (id) => prereqs[id]), null);
});
