// Round 7 F, app-parent-schedule: the parent's lesson days, time and length reach the day plan (parent.setting_changed
// anchor / lessonMin / restDays → planner), and the child Home sees the time (scheduleOf). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dayKindLookup, learningDay } from "../server/conductor/clock.js";
import { buildPlannerInputs, inputsHash, planDay } from "../server/conductor/planner.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView } from "../server/conductor/view.js";
import { decide } from "../server/conductor/decide.js";
import { validateEvent } from "../server/conductor/events.js";
import { BAND } from "../server/conductor/config.js";
import { scheduleOf } from "../server/routes/child.js";

const CHILD = "11111111-2222-4333-8444-555555555555";
const ist = (day, hhmm) => new Date(`${day}T${hhmm}:00+05:30`);
const live = (value) => ({ value, asOf: "x", src: "t", stale: false });
const view = () => recordingView({ "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}) });
function inputsFor({ classLevel = 7, now = ist("2026-10-05", "16:10"), routine = {} } = {}) {
  const s0 = initialState({ childId: CHILD, classLevel, now, consent: { core_tutoring: true } });
  const s = { ...s0, learningDay: learningDay(now, "Asia/Kolkata"), routine: { ...s0.routine, ...routine } };
  return buildPlannerInputs(s, { now, view: view(), cal: dayKindLookup({}, {}) });
}
const lessonOf = (inp) => planDay(inp).plan.slots.find((x) => x.kind === "live_lesson");

test("a future lesson time starts the sitting there; the length caps it, never below the band's minimum set", () => {
  const inp = inputsFor({ routine: { anchor: "18:30", lessonMin: 25 } });
  assert.deepEqual(inp.schedule, { anchor: "18:30", lessonMin: 25 });
  const l = lessonOf(inp);
  assert.equal(l.window[0], "18:30");
  assert.equal(l.targetMin, 25);
  assert.ok(planDay(inp).plan.adapt.rules.some((r) => r.rule === "SCH"));
  const minSet = BAND.B3.segments.filter((s) => s[3]).reduce((a, s) => a + s[1], 0);
  assert.equal(lessonOf(inputsFor({ routine: { lessonMin: 15 } })).targetMin, minSet, "15 min is below B3's minimum set: the minimum set is planned");
});

test("a lesson time already past (or none) plans from now as before; an unscheduled child hashes exactly as before", () => {
  assert.equal(lessonOf(inputsFor({ routine: { anchor: "15:00" } })).window[0], lessonOf(inputsFor()).window[0]);
  const plain = inputsFor();
  assert.equal(plain.schedule, undefined);
  assert.equal(inputsHash(plain), inputsHash(inputsFor({ routine: {} })));
});

test("the parent's settings fold into the Conductor's routine and limits", () => {
  for (const [key, value] of [["anchor", "18:30"], ["lessonMin", 25], ["restDays", [0, 6]]]) {
    assert.doesNotThrow(() => validateEvent({ type: "parent.setting_changed", key, value, by: "owner", settingsVersion: 1 }));
  }
  assert.throws(() => validateEvent({ type: "parent.setting_changed", key: "lessonMin", value: 5, by: "owner", settingsVersion: 1 }));
  const now = ist("2026-10-05", "10:00");
  let s = initialState({ childId: CHILD, classLevel: 7, now, consent: { core_tutoring: true } });
  for (const [key, value] of [["anchor", "18:30"], ["lessonMin", 25], ["restDays", [0, 6]]]) {
    s = decide(s, { type: "parent.setting_changed", key, value, by: "owner", settingsVersion: 2 }, { now, view: view() }).state;
  }
  assert.equal(s.routine.anchor, "18:30");
  assert.equal(s.routine.lessonMin, 25);
  assert.deepEqual(s.limits.restDays, [0, 6]);
});

test("scheduleOf: the time for Home, and whether today is a lesson day", () => {
  assert.equal(scheduleOf(null, "2026-10-05"), null);
  assert.deepEqual(scheduleOf({ anchor: "17:00", lesson_days: [1, 3, 5], lesson_min: 25 }, "2026-10-05"), { time: "17:00", minutes: 25, today: true });   // a Monday
  assert.equal(scheduleOf({ anchor: "17:00", lesson_days: [1, 3, 5] }, "2026-10-06").today, false);
  assert.deepEqual(scheduleOf({ anchor: "17:00" }, "2026-10-06"), { time: "17:00", minutes: null, today: true });
});
