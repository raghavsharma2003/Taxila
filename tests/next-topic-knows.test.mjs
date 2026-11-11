// round 8 K5 + K8 at the topic choice (docs/patches/to-learning, r8-loop): content/next-topic.js knowsPick around pickTopic.
import test from "node:test";
import assert from "node:assert/strict";
import { knowsPick, scriptedTopicIds } from "../server/content/next-topic.js";

const order = ["c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03"];
const none = () => [];

test("K8: among equally due topics of the chapter, a scripted one first (prerequisites done), with its because", () => {
  const st = { "c5-maths-ch02-t01": "unseen", "c5-maths-ch02-t02": "unseen", "c5-maths-ch02-t03": "unseen" };
  const r = knowsPick("c5-maths-ch02-t03", order, (t) => st[t] ?? "unseen", none, { scripted: new Set(["c5-maths-ch02-t02"]) });
  assert.equal(r.id, "c5-maths-ch02-t02");
  assert.deepEqual(r.because.map((b) => [b.choice, b.fact.insteadOf]), [["topic", "c5-maths-ch02-t03"]]);
  const blocked = knowsPick("c5-maths-ch02-t03", order, (t) => st[t] ?? "unseen", (t) => (t === "c5-maths-ch02-t02" ? ["c5-maths-ch02-t01"] : []), { scripted: new Set(["c5-maths-ch02-t02"]) });
  assert.equal(blocked.id, "c5-maths-ch02-t03", "a prerequisite not done: no jump");
  assert.deepEqual(knowsPick("c5-maths-ch02-t01", order, (t) => st[t] ?? "unseen", none, { scripted: new Set(["c5-maths-ch02-t01"]) }).because, []);
});

test("K5: no new skill today → a topic she has met, review mode, with its because", () => {
  const st = { "c5-maths-ch02-t01": "in_progress", "c5-maths-ch02-t02": "unseen" };
  const r = knowsPick("c5-maths-ch02-t02", order, (t) => st[t] ?? "unseen", none, { brief: { newSkillBudget: 0, adaptTrace: ["R15"] }, scripted: new Set() });
  assert.equal(r.id, "c5-maths-ch02-t01"); assert.equal(r.mode, "review");
  assert.equal(r.because[0].choice, "revision"); assert.equal(r.because[0].fact.kind, "first_week");
  assert.equal(knowsPick("c5-maths-ch02-t02", order, (t) => st[t] ?? "unseen", none, { brief: { newSkillBudget: 1 }, scripted: new Set() }).id, "c5-maths-ch02-t02");
});

test("the scripted set is the live scripts", () => {
  assert.ok(scriptedTopicIds().has("c5-maths-ch02-t01"));
});

test("K5 revises the topic she is still working on before a finished one, and the nearest finished one before the oldest", () => {
  const brief = { newSkillBudget: 0, adaptTrace: ["R15"] };
  const st = { "c5-maths-ch02-t01": "mastered", "c5-maths-ch02-t02": "in_progress" };
  assert.equal(knowsPick("c5-maths-ch02-t03", order, (t) => st[t] ?? "unseen", none, { brief, scripted: new Set() }).id, "c5-maths-ch02-t02");
  const o2 = ["c5-maths-ch01-t01", "c5-maths-ch01-t02", "c5-maths-ch02-t01", "c5-maths-ch02-t02"];
  const s2 = { "c5-maths-ch01-t01": "mastered", "c5-maths-ch01-t02": "learned", "c5-maths-ch02-t01": "learned" };
  assert.equal(knowsPick("c5-maths-ch02-t02", o2, (t) => s2[t] ?? "unseen", none, { brief, scripted: new Set() }).id, "c5-maths-ch02-t01");
});
