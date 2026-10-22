// 14.4.2 (QA on be9b766a): item 2, 3a1d1e60 "mujhe koi aur topic padhna hai" ×3 never got real topics (chips only "Lesson
// par wapas / Aaj ke liye bas"), and t1 said the topic was not in their class when none was named; and a P2, "chapter 1 se
// shuru karo" at the session's start got "page ya chapter ka naam bataiye". Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { requestOf } from "../server/director/requests.js";
import { intakeParse } from "../server/director/session/intake.js";
import { intakeCandidates } from "../server/director/session/candidates.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const NE = cls("no_evidence");
test("'mujhe koi aur topic padhna hai' is an ask for another topic: real topics of their class at once, never 'not in your class'", () => {
  assert.deepEqual(requestOf("mujhe koi aur topic padhna hai"), { type: "change_topic", topic: true, whole: true });
  assert.equal(requestOf("mujhe photosynthesis padhna hai")?.type, "switch", "a named subject is still a switch");
  const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed: 2, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 3; i++) r = step(r.state, { event: "turn", kit: K, cls: NE, now: (i + 1) * 20_000 });
  const text = "mujhe koi aur topic padhna hai";
  const b = step(r.state, { event: "turn", kit: K, cls: { ...NE, source: "request", request: requestOf(text) }, text, now: 100_000 });
  const topics = (b.ui.chips ?? []).filter((c) => String(c.id).startsWith("switch:"));
  assert.ok(topics.length >= 1 && topics.every((c) => getTopic(c.id.slice(7))?.classLevel === 6), JSON.stringify(b.ui.chips));
  assert.doesNotMatch(b.move.shape, /not in their class/);
});

test("'chapter 1 se shuru karo' at the session's start is chapter 1's first topic (or each subject's chapter 1 to choose)", () => {
  const t = "chapter 1 se shuru karo";
  assert.equal(intakeCandidates(intakeParse(t), t, { classLevel: 5, subjects: ["maths"] }).top?.topicId, "c5-maths-ch01-t01");
  const any = intakeCandidates(intakeParse(t), t, { classLevel: 5 });
  assert.ok(any.ask?.length >= 2 && any.ask.every((c) => /-ch01-/.test(c.topicId)), JSON.stringify(any.ask));
  assert.equal(intakeCandidates(intakeParse("maths ka chapter 3 padhna hai"), "maths ka chapter 3 padhna hai", { classLevel: 5 }).top?.topicId, "c5-maths-ch03-t01");
});
