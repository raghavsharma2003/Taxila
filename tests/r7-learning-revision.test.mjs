// Round 7 F, learning-test-window-revision: a school test window with chapters revises only those chapters, and in its
// last two days never starts a new topic (content/next-topic.js revisionPick); the parent's window reaches the Conductor
// (school.test_announced with its own first day; school.test_cleared). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { revisionPick } from "../server/content/next-topic.js";
import { activeWindow } from "../server/reports/truth.js";
import { validateEvent, idemKeyFor } from "../server/conductor/events.js";
import { decide } from "../server/conductor/decide.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView } from "../server/conductor/view.js";

// a book of 4 chapters, 2 topics each
const order = ["c5-maths-ch01-t01", "c5-maths-ch01-t02", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch03-t01", "c5-maths-ch03-t02", "c5-maths-ch04-t01", "c5-maths-ch04-t02"];
const chapterOf = (id) => Number(/ch(\d+)/.exec(id)[1]);
const pick = (status, chapters, review = false, prereqs = {}) => revisionPick(order, (id) => status[id] ?? "unseen", (id) => prereqs[id] ?? [], { chapterOf, chapters, review });

test("before the last two days: the first topic of the test chapters not done yet; never one outside them", () => {
  assert.deepEqual(pick({}, [3, 4]), { id: "c5-maths-ch03-t01", mode: "teach" });
  assert.deepEqual(pick({ "c5-maths-ch03-t01": "learned" }, [3, 4]), { id: "c5-maths-ch03-t02", mode: "teach" });
  // a weak prerequisite is taught first only when it is inside the chapters
  assert.deepEqual(pick({ "c5-maths-ch03-t01": "weak", "c5-maths-ch01-t01": "weak" }, [3], false, { "c5-maths-ch03-t01": ["c5-maths-ch01-t01"] }), { id: "c5-maths-ch03-t01", mode: "teach" });
  // every test topic done → a review
  const allDone = Object.fromEntries(order.filter((t) => chapterOf(t) === 2).map((t) => [t, "learned"]));
  assert.deepEqual(pick(allDone, [2]), { id: "c5-maths-ch02-t01", mode: "review" });
  assert.equal(pick({}, [9]), null, "chapters not in the book → no pick (the usual choice runs)");
});

test("in the last two days: retrieval only, a topic already met, weak first, then in progress, then learned", () => {
  const st = { "c5-maths-ch03-t02": "learned", "c5-maths-ch04-t01": "in_progress", "c5-maths-ch04-t02": "weak" };
  assert.deepEqual(pick(st, [3, 4], true), { id: "c5-maths-ch04-t02", mode: "review" });
  assert.deepEqual(pick({ "c5-maths-ch03-t02": "learned" }, [3, 4], true), { id: "c5-maths-ch03-t02", mode: "review" });
  assert.deepEqual(pick({}, [3, 4], true), { id: "c5-maths-ch03-t01", mode: "teach" }, "nothing met in the chapters: the first topic is still taught");
});

test("activeWindow carries the chapters; a window without them is unchanged", () => {
  assert.deepEqual(activeWindow({ subject: "maths", from: "2026-11-01", to: "2026-11-06", chapters: [3, 4] }, "2026-11-04"), { subject: "maths", from: "2026-11-01", to: "2026-11-06", chapters: [3, 4] });
  assert.deepEqual(activeWindow({ subject: "maths", from: "2026-11-01", to: "2026-11-06" }, "2026-11-04"), { subject: "maths", from: "2026-11-01", to: "2026-11-06" });
});

test("the parent's window reaches the Conductor with its own first day and chapters; a clear removes it", () => {
  const ann = { type: "school.test_announced", subject: "maths", on: "2026-11-10", from: "2026-11-02", chapters: ["3", "4"], via: "parent" };
  assert.doesNotThrow(() => validateEvent(ann));
  assert.notEqual(idemKeyFor(ann), idemKeyFor({ ...ann, chapters: ["3"] }), "a changed chapter list is a new fact");
  assert.doesNotThrow(() => validateEvent({ type: "school.test_cleared", subject: "maths", via: "parent" }));
  const live = (value) => ({ value, asOf: "x", src: "t", stale: false });
  const view = () => recordingView({ "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}) });
  const now = new Date("2026-11-04T10:00:00Z");
  const s0 = initialState({ childId: "11111111-2222-4333-8444-555555555555", classLevel: 5, now, consent: { core_tutoring: true } });
  const s1 = decide(s0, ann, { now, view: view() }).state;
  assert.deepEqual(s1.school.testWindows, [{ subject: "maths", from: "2026-11-02", to: "2026-11-10", chapters: ["3", "4"] }]);
  const s2 = decide(s1, { type: "school.test_cleared", subject: "maths", via: "parent" }, { now, view: view() }).state;
  assert.deepEqual(s2.school.testWindows, []);
  // an announcement without `from` keeps the old 4-day window
  const s3 = decide(s0, { ...ann, from: undefined }, { now, view: view() }).state;
  assert.equal(s3.school.testWindows[0].from, "2026-11-06");
});
