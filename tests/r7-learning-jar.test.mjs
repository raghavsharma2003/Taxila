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

// Patch 004b: the hook carried into the next lesson as Later entries, served by the opening and marked kept.
import { jarLaterEntries, jarServed, jarItemsFromLesson as fromLesson } from "../server/learner/jar.js";

test("004b: the hook becomes Later entries; serving one yields its kept statement and teacher.promise_kept, once", () => {
  const J1 = "11111111-1111-4111-8111-111111111111", J2 = "22222222-2222-4222-8222-222222222222";
  const hook = [{ id: J1, topic: "why the moon changes shape", learning: true, share: false, lessonId: "L0", laterId: "p3" },
    { id: J2, topic: "my new cycle", learning: false, share: true, lessonId: "L0", laterId: "p5" }, { id: "x", topic: " " }];
  const later = jarLaterEntries(hook);
  assert.deepEqual(later.map((p) => [p.id, p.jarId, p.promise, p.at]), [["j0", J1, "after_question", 0], ["j1", J2, "after_question", 0]]);
  assert.equal(later[1].share, true);
  const served = later.map((p) => (p.id === "j0" ? { ...p, servedAt: 0 } : p));
  const r = jarServed(later, served, "child-1", "L1");
  assert.equal(r.stmts.length, 1);
  assert.deepEqual(r.stmts[0].params, ["child-1", [J1], "L1"]);
  assert.deepEqual(r.events, [{ type: "teacher.promise_kept", promiseId: "jar:L0:p3", lessonId: "L1" }]);
  assert.deepEqual(jarServed(served, served, "child-1", "L1"), { stmts: [], events: [] }, "a served entry is kept once");
  // an unserved carried entry is never written into the jar again at this lesson's end
  assert.deepEqual(fromLesson({ topicId: "c5-maths-ch02-t01", later: [...served, { id: "p9", topic: "fractions of money", learning: true, at: 4 }] })
    .map((x) => x.laterId), ["p9"]);
});
