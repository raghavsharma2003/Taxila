// Round 4 (journey audit #11, main session 2026-10-10): (1) a child's FIRST lesson right after set-up always opens,
// whatever the hours: the parent is there and has just handed over; from the second lesson the hours hold again.
// (2) The default lesson hours are 06:30-21:30 IST (Indian homework time runs past 20:30; was 07:00-20:30), in every
// place that holds the default: the parent controls, the Conductor's limits and the set-up screen.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { homeStateOf } from "../server/routes/child.js";
import { startRefusal } from "../server/routes/lesson.js";
import { defaultControls } from "../server/routes/parent.js";
import { LIMITS_DEFAULT } from "../server/conductor/config.js";

const night = { resumable: false, usedMin: 0, capMin: 30, doneToday: false, now: "23:10", from: "06:30", to: "21:30" };

test("the first lesson after set-up opens at any hour; the second waits for the hours", () => {
  assert.equal(homeStateOf({ ...night, anyLesson: false }), "first", "23:10, no lesson yet: the first lesson opens");
  assert.equal(startRefusal(homeStateOf({ ...night, anyLesson: false }), "lesson"), null, "and the start route does not refuse it");
  assert.equal(homeStateOf({ ...night, now: "05:00", anyLesson: false }), "first", "before the window too");
  assert.equal(homeStateOf({ ...night, anyLesson: true }), "resting", "after the first lesson the hours hold");
  assert.ok(startRefusal("resting", "lesson"), "a later lesson outside the hours is refused");
  // the first lesson does not lift the other rules
  assert.equal(homeStateOf({ ...night, anyLesson: false, safetyHold: true }), "safety_hold", "a safety hold still wins");
  assert.equal(homeStateOf({ ...night, anyLesson: false, usedMin: 30 }), "capped", "the daily limit still holds");
});

test("the default lesson hours are 06:30-21:30 everywhere the default lives", () => {
  for (const cl of [1, 4, 7, 9]) {
    const c = defaultControls(cl);
    assert.deepEqual([c.hoursStart, c.hoursEnd], ["06:30", "21:30"], `parent controls, class ${cl}`);
    const l = LIMITS_DEFAULT(cl);
    assert.deepEqual([l.allowedFrom, l.allowedTo], ["06:30", "21:30"], `Conductor limits, class ${cl}`);
  }
  const setup = readFileSync(new URL("../src/onboarding/Setup.tsx", import.meta.url), "utf8");
  assert.match(setup, /hoursStart: "06:30", hoursEnd: "21:30"/, "the set-up screen's default");
  assert.ok(!/hoursStart: "07:00"|hoursEnd: "20:30"/.test(setup));
  // homework time: 21:00 is inside the default window, 21:30 is not
  assert.equal(homeStateOf({ ...night, now: "21:00", anyLesson: true }), "start");
  assert.equal(homeStateOf({ ...night, now: "21:30", anyLesson: true }), "resting");
  assert.equal(homeStateOf({ ...night, now: "06:30", anyLesson: true }), "start");
});
