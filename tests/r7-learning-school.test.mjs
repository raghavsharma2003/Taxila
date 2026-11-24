// Round 7 F item 2: the "school is here" picker data and the Conductor school events.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chaptersOf } from "../server/routes/parent.js";
import { validateEvent, idemKeyFor } from "../server/conductor/events.js";

test("chaptersOf: every class subject with its chapters in order", () => {
  const c6 = chaptersOf(6);
  assert.deepEqual(Object.keys(c6), ["maths", "science", "english", "hindi", "sst"]);
  for (const list of Object.values(c6)) {
    assert.ok(list.length > 0);
    assert.deepEqual(list.map((c) => c.number), [...list.map((c) => c.number)].sort((a, b) => a - b));
    assert.ok(list.every((c) => typeof c.title === "string" && c.title));
  }
  assert.ok(!("sst" in chaptersOf(4)));
});

test("school.pointer_set / school.timetable_set validate and key on the fact", () => {
  const p = validateEvent({ type: "school.pointer_set", subject: "maths", chapter: 6, on: "2026-11-04", via: "parent" });
  assert.equal(idemKeyFor(p), "pointer:maths:6:2026-11-04:parent");
  const t = validateEvent({ type: "school.timetable_set", weekday: 1, subjects: ["maths", "science"], rev: 1, via: "parent" });
  assert.equal(idemKeyFor(t), "timetable:parent:1:1");
  assert.throws(() => validateEvent({ type: "school.timetable_set", weekday: 7, subjects: [], rev: 1, via: "parent" }));
  assert.throws(() => validateEvent({ type: "school.pointer_set", subject: "maths", chapter: 0, on: "2026-11-04", via: "parent" }));
});
