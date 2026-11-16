// Learning patch 004b (round 7 F item 8, the Question jar): what she parked and did not get back to reaches the jar at lesson
// end; the next lesson OPENS on it; serving it marks it kept and closes the Conductor's promise.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { parkEntry, pushLater } from "../server/conversation/policy.js";
import { jarItemsFromLesson, jarLaterEntries, jarServed, jarWriteStmts } from "../server/learner/jar.js";
import { initialState } from "../server/conductor/state.js";
import { decide } from "../server/conductor/decide.js";
import { recordingView } from "../server/conductor/view.js";
import { kit as kitOf, CTX } from "./fixtures/kit.mjs";
const kit = kitOf();

const CHILD = { id: "11111111-2222-4333-8444-555555555555", class_level: 5 };
const J = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

test("1. a parked question she did not get back to reaches the jar at lesson end, with a Conductor promise", () => {
  const s = { topicId: kit.topicId, later: pushLater([], parkEntry({ topic: "why the moon changes shape", learning: true, turn: 3, itemOnTable: true })) };
  const { stmts, events } = jarWriteStmts(CHILD, "L1", s, { teacherId: "asha" });
  assert.equal(stmts.length, 1);
  assert.match(stmts[0].text, /insert into question_jar/);
  assert.deepEqual(stmts[0].params.slice(0, 4), [CHILD.id, "L1", "p3", "why the moon changes shape"]);
  assert.deepEqual(events, [{ type: "teacher.promise", promiseId: "jar:L1:p3", what: { kind: "revisit", ref: "L1:p3" }, by: "asha" }]);
  // wired: endLesson writes them in its own transaction, never from a safeguarded lesson, and emits after the commit
  const src = readFileSync(new URL("../server/routes/lesson.js", import.meta.url), "utf8");
  assert.match(src, /held \? \{ stmts: \[\], events: \[\] \} : jarWriteStmts\(child, lesson\.id, state/);
  assert.match(src, /tx\(\[\.\.\.writes, \.\.\.relStmts, \.\.\.jar\.stmts, \.\.\.hookStmts\]\)/);
});

test("2. the next lesson opens on it: the greeting comes back to last time's question first, and the entry is served", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: CTX, seed: 1, now: 0 });
  s0.later = jarLaterEntries([{ id: J, topic: "why the moon changes shape", learning: true, share: false, lessonId: "L1", laterId: "p3" }]);
  const r = step(s0, { event: "start", kit, now: 0 });
  assert.equal(r.move.kind, "greet");
  assert.match(JSON.stringify(r.move), /come back to what they asked last time \(why the moon changes shape\)/);
  assert.equal(r.state.later.find((p) => p.jarId === J).servedAt, 0);
  // no jar → the greeting is unchanged
  const plain = step(initLessonState({ topicId: kit.topicId, kit, ctx: CTX, seed: 1, now: 0 }), { event: "start", kit, now: 0 });
  assert.doesNotMatch(JSON.stringify(plain.move), /last time/);
  // and an unserved carried entry is never written into the jar a second time at this lesson's end
  assert.deepEqual(jarItemsFromLesson({ topicId: kit.topicId, later: s0.later }), []);
});

test("3. serving it marks the jar row kept and teacher.promise_kept closes the Conductor's promise", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: CTX, seed: 1, now: 0 });
  s0.later = jarLaterEntries([{ id: J, topic: "why the moon changes shape", learning: true, lessonId: "L1", laterId: "p3" }]);
  const r = step(s0, { event: "start", kit, now: 0 });
  const kept = jarServed(s0.later, r.state.later, CHILD.id, "L2");
  assert.match(kept.stmts[0].text, /update question_jar set answered_at = now\(\)/);
  assert.deepEqual(kept.stmts[0].params, [CHILD.id, [J], "L2"]);
  assert.deepEqual(kept.events, [{ type: "teacher.promise_kept", promiseId: "jar:L1:p3", lessonId: "L2" }]);
  // the Conductor: the promise from lesson 1 is held until lesson 2 keeps it
  const live = (value) => ({ value, asOf: "x", src: "t", stale: false });
  const view = () => recordingView({ "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}) });
  const now = new Date("2026-11-05T10:00:00+05:30");
  let c = initialState({ childId: CHILD.id, classLevel: 5, now, consent: { core_tutoring: true } });
  c = decide(c, { type: "teacher.promise", promiseId: "jar:L1:p3", what: { kind: "revisit", ref: "L1:p3" }, by: "asha" }, { now, view: view() }).state;
  assert.deepEqual(c.promises.map((p) => p.id), ["jar:L1:p3"]);
  c = decide(c, kept.events[0], { now, view: view() }).state;
  assert.deepEqual(c.promises, []);
  // wired: the start and the turn put the kept statements in their own transactions and emit after the commit
  const lesson = readFileSync(new URL("../server/routes/lesson.js", import.meta.url), "utf8");
  const turn = readFileSync(new URL("../server/brain/turn.js", import.meta.url), "utf8");
  assert.match(lesson, /const jarKept = jarServed\(state0\.later, first\.state\.later, child\.id, lessonId\)/);
  assert.match(turn, /const jarKept = jarServed\(prev\.later, next\.later, child\.id, lesson\.id\)/);
  for (const src of [lesson, turn]) assert.match(src, /\.\.\.jarKept\.stmts/);
});
