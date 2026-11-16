// round 7 (F Learning patch to-brain/001-003, PIPELINE §A Brain item 4): the learner view reaches the Director. θ / weak pick
// the practice queue's level and the family's minutes left is kept for the mid-lesson limit; no view → today's default. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState } from "../server/director/state.js";
import { kit, CTX } from "./fixtures/kit.mjs";

const K = kit();
const init = (level) => initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX }, seed: 3, now: 0, level });

test("no learner view: the on-track queue, no minutes left", () => {
  const s = init(null);
  assert.ok(Array.isArray(s.queue) && s.queue.length > 0);
  assert.equal(s.minutesLeft, undefined);
});

test("a learner view is read: a queue is still built, minutes left kept only when limits are on", () => {
  const s = init({ theta: 2.5, weak: true, minutesLeft: { today: 12 } });
  assert.ok(Array.isArray(s.queue) && s.queue.length > 0);
  assert.deepEqual(s.minutesLeft, { today: 12 });
  assert.equal(init({ theta: null, weak: false, minutesLeft: { today: null } }).minutesLeft, undefined);
});
