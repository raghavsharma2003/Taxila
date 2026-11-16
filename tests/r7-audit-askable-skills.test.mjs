// r7 audit CD-01 (content-data) and its parent-page copy (learner): a skill with no item a child answers can never be
// "learned", so a topic decided on every kit skill could never be finished. The lesson side (nextTopicFor → topicStatus)
// and the parent's Progress page (topicTruth) both decide a topic on its askable skills, through one helper.
// Real kits, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { getTopic } from "../server/content/curriculum.js";
import { kitFromFile } from "../server/content/kits.js";
import { askableSkillIds, decidingStates, topicStatus } from "../server/content/next-topic.js";
import { topicTruth } from "../server/reports/truth.js";

const TOPIC = "c5-hindi-ch05-t01";   // s1 (reading aloud) has no item in the kit
const kit = kitFromFile(getTopic(TOPIC));

test("a reading-aloud skill with no item is not askable", () => {
  assert.equal(kit.skills.length, 5);
  assert.ok(!askableSkillIds(kit).has(`${TOPIC}-s1`));
  assert.equal(askableSkillIds(kit).size, 4);
});

test("lesson side: every askable skill mastered → the topic is mastered, not in progress for ever", () => {
  const states = [2, 3, 4, 5].map((n) => ({ skillId: `${TOPIC}-s${n}`, status: "mastered", pKnown: 0.95, attempts: 4 }));
  assert.equal(topicStatus(states, kit.skills.length), "in_progress");   // the old count
  const d = decidingStates(states, kit);
  assert.equal(topicStatus(d.states, d.skillCount), "mastered");
});

test("lesson side: a taught-but-unanswerable skill row does not hold the topic back", () => {
  const states = [1, 2, 3, 4, 5].map((n) => ({ skillId: `${TOPIC}-s${n}`, status: n === 1 ? "practising" : "learned_today", pKnown: 0.8, attempts: 2 }));
  const d = decidingStates(states, kit);
  assert.equal(topicStatus(d.states, d.skillCount), "learned");
});

test("parent page: the same topic reads as secure", () => {
  const sk = [2, 3, 4, 5].map((n) => ({ skillId: `${TOPIC}-s${n}`, level: 3 }));
  assert.equal(topicTruth(sk, kit.skills.length).key, "practising");   // the old count
  const d = decidingStates(sk, kit);
  assert.equal(topicTruth(d.states, d.skillCount).key, "mastered");
});

test("no kit: every state decides, as before", () => {
  const states = [{ skillId: "x-s1", status: "mastered", pKnown: 1, attempts: 3 }];
  const d = decidingStates(states, null);
  assert.equal(d.states, states);
  assert.equal(d.skillCount, 0);
});
