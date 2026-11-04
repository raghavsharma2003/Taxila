// Round 7 F item 8: the Question jar (server/learner/jar.js) and its Conductor promise events.
import { test } from "node:test";
import assert from "node:assert/strict";
import { jarItemsFromLesson, jarWriteStmts, jarHook, answerStmts, jarSummary, keptEvents, openJar, JAR_HOOK_MAX } from "../server/learner/jar.js";
import { validateEvent, idemKeyFor } from "../server/conductor/events.js";

const STATE = {
  topicId: "c5-maths-ch02-t01",
  later: [
    { id: "p3", topic: "cricket match", learning: false, share: true, at: 3 },
    { id: "p5", topic: "why is zero not a counting number", learning: true, at: 5 },
    { id: "p7", topic: "volcanoes", learning: true, at: 7, servedAt: 9 },
    { id: "p8", topic: "their question", learning: true, at: 8 },
  ],
};

test("jarItemsFromLesson: only unserved, real topics; questions before shares; subject from the lesson", () => {
  const items = jarItemsFromLesson(STATE);
  assert.deepEqual(items.map((i) => i.laterId), ["p5", "p3"]);
  assert.equal(items[0].subject, "maths");
  assert.equal(items[1].share, true);
  assert.deepEqual(jarItemsFromLesson({}), []);
});

test("jarWriteStmts: idempotent inserts and one valid teacher.promise per item", () => {
  const { stmts, events } = jarWriteStmts({ id: "c1" }, "L1", STATE, { teacherId: "asha" });
  assert.equal(stmts.length, 2);
  assert.match(stmts[0].text, /on conflict \(lesson_id, later_id\) do nothing/);
  for (const e of events) {
    const v = validateEvent(e);
    assert.equal(v.what.kind, "revisit");
    assert.match(idemKeyFor(v), /^promise:jar:L1:p\d$/);
  }
});

test("jarHook: learning questions first, the lesson's subject next, at most JAR_HOOK_MAX", () => {
  const items = [
    { id: "a", topic: "x", learning: false, share: true, subject: "maths", createdAt: "2026-11-01" },
    { id: "b", topic: "y", learning: true, share: false, subject: "science", createdAt: "2026-11-02" },
    { id: "c", topic: "z", learning: true, share: false, subject: "maths", createdAt: "2026-11-03" },
  ];
  const h = jarHook(items, { subject: "maths" });
  assert.equal(h.length, JAR_HOOK_MAX);
  assert.deepEqual(h.map((x) => x.id), ["c", "b"]);
});

test("answerStmts, keptEvents, jarSummary", () => {
  const id = "11111111-2222-3333-4444-555555555555";
  assert.equal(answerStmts("c1", [id, "bad"], "L2")[0].params[1].length, 1);
  assert.deepEqual(answerStmts("c1", [], "L2"), []);
  const [k] = keptEvents([{ lessonId: "L1", laterId: "p5" }], "L2");
  assert.equal(idemKeyFor(validateEvent(k)), "promise_kept:jar:L1:p5");
  assert.equal(jarSummary([]), null);
  assert.deepEqual(jarSummary([{}, {}]), { waiting: 2 });
});

test("openJar never throws (no table → [])", async () => {
  assert.deepEqual(await openJar("c1", { q: async () => { throw Object.assign(new Error("x"), { code: "42P01" }); } }), []);
});
