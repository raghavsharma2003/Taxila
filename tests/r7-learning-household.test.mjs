// Round 7 F, household v1 (main 2026-11-04): siblings on one phone each get their own window, younger first.
// server/conductor/household.js (pure allocate), the household.window view key, the planner and V28, the sharedPhone
// setting. Pure: no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dayKindLookup, dayMin, learningDay } from "../server/conductor/clock.js";
import { buildPlannerInputs, planDay } from "../server/conductor/planner.js";
import { validatePlan } from "../server/conductor/validate.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView, replayView } from "../server/conductor/view.js";
import { decide } from "../server/conductor/decide.js";
import { validateEvent } from "../server/conductor/events.js";
import { HANDOVER_MIN, allocate, householdWindowOf, memberOf } from "../server/conductor/household.js";

const A = "11111111-2222-4333-8444-55555555555a", B = "11111111-2222-4333-8444-55555555555b", C = "11111111-2222-4333-8444-55555555555c";
const ist = (day, hhmm) => new Date(`${day}T${hhmm}:00+05:30`);
const DAY = "2026-10-05";   // a Monday
const NOW = ist(DAY, "16:00");
const stateOf = (childId, classLevel, over = {}) => ({
  ...initialState({ childId, classLevel, now: NOW, consent: { core_tutoring: true } }), learningDay: DAY, household: { shared: true }, ...over,
});
const m = (ref, classLevel, earliest, latestEnd, requestedMin, extra = {}) => ({ ref, classLevel, earliest: dayMin(earliest), latestEnd: dayMin(latestEnd), requestedMin, occupied: null, done: false, ...extra });

// ───────────── allocate ─────────────
test("allocate: younger first, a 5-minute hand-over, each clipped to her latest end; too short → none", () => {
  const out = allocate([m(B, 7, "16:00", "21:00", 35), m(A, 4, "16:00", "20:30", 25), m(C, 9, "16:00", "17:20", 45)], { nowDM: dayMin("16:00") });
  assert.deepEqual(out[A], { state: "planned", from: "16:00", to: "16:25" });
  assert.deepEqual(out[B], { state: "planned", from: "16:30", to: "17:05" });
  assert.deepEqual(out[C], { state: "planned", from: "17:10", to: "17:20" }, "clipped to her latest end");
  const tight = allocate([m(A, 4, "16:00", "20:30", 25), m(C, 9, "16:00", "16:31", 45)], { nowDM: dayMin("16:00") });
  assert.equal(tight[C].state, "none", "a window under 3 minutes is none");
});

test("allocate: a sitting in progress is fixed and the rest flow around it; a child done for the day gets nothing", () => {
  const out = allocate([
    m(A, 4, "16:00", "20:30", 25),
    m(B, 7, "16:00", "21:00", 35, { occupied: [dayMin("16:00"), dayMin("16:35")] }),
    m(C, 9, "16:00", "22:00", 45, { done: true }),
  ], { nowDM: dayMin("16:10") });
  assert.deepEqual(out[B], { state: "in_lesson", from: "16:00", to: "16:35" });
  assert.deepEqual(out[A], { state: "planned", from: "16:40", to: "17:05" });
  assert.deepEqual(out[C], { state: "done" });
  assert.equal(dayMin(out[A].from) - dayMin("16:35"), HANDOVER_MIN);
});

test("allocate: a child whose window opens later waits; the cursor jumps to the earliest who can start", () => {
  const out = allocate([m(A, 4, "18:00", "20:30", 25), m(B, 7, "16:00", "21:00", 35)], { nowDM: dayMin("16:00") });
  assert.deepEqual(out[B], { state: "planned", from: "16:00", to: "16:35" }, "the older child goes first when the younger is not free yet");
  assert.deepEqual(out[A], { state: "planned", from: "18:00", to: "18:25" });
});

test("allocate is deterministic in its input (same members in any order → the same windows)", () => {
  const ms = [m(B, 7, "16:00", "21:00", 35), m(A, 4, "16:00", "20:30", 25), m(C, 9, "16:00", "22:00", 45)];
  assert.deepEqual(allocate(ms, { nowDM: 960 }), allocate([...ms].reverse(), { nowDM: 960 }));
});

// ───────────── from conductor states ─────────────
test("memberOf / householdWindowOf: from each sibling's state; null when she shares with nobody; only her window", () => {
  const sa = stateOf(A, 4), sb = stateOf(B, 7);
  const mm = memberOf(sa, { day: DAY, now: NOW });
  assert.equal(mm.ref, A);
  assert.equal(mm.requestedMin, 25, "no plan yet: the band template's session");
  const wa = householdWindowOf(A, [sa, sb], { day: DAY, now: NOW });
  const wb = householdWindowOf(B, [sa, sb], { day: DAY, now: NOW });
  assert.equal(wa.state, "planned");
  assert.ok(dayMin(wb.from) >= dayMin(wa.to) + HANDOVER_MIN, "the older sibling after the younger, after the hand-over");
  assert.deepEqual(Object.keys(wb).sort(), ["from", "state", "to"], "no sibling id, name, band, length or count (V30)");
  assert.equal(householdWindowOf(A, [sa, { ...sb, household: undefined }], { day: DAY, now: NOW }), null, "nobody else shares");
  assert.equal(householdWindowOf(A, [{ ...sa, household: undefined }, sb], { day: DAY, now: NOW }), null, "she does not share");
});

// ───────────── planner and V28 ─────────────
const live = (value) => ({ value, asOf: "x", src: "test", stale: false });
function inputsFor(childId, classLevel, hhWindow, now = NOW) {
  const s = { ...initialState({ childId, classLevel, now, consent: { core_tutoring: true } }), learningDay: learningDay(now, "Asia/Kolkata") };
  const view = recordingView({ "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}),
    ...(hhWindow ? { "household.window": live(hhWindow) } : {}) });
  return buildPlannerInputs(s, { now, view, cal: dayKindLookup({}, {}) });
}

test("planner: a future household window becomes the sitting's window and can only shorten it; V28 rejects a slot outside it", () => {
  const inp = inputsFor(B, 7, { state: "planned", from: "16:32", to: "17:00" });
  assert.deepEqual(inp.household, { state: "planned", from: "16:30", to: "17:00" }, "floored to 5 minutes inside the hash");
  const { plan } = planDay(inp);
  const l = plan.slots.find((s) => s.kind === "live_lesson");
  assert.deepEqual(l.window, ["16:30", "17:00"]);
  assert.ok(l.targetMin <= 30);
  assert.ok(plan.adapt.rules.some((r) => r.rule === "HH"));
  assert.deepEqual(validatePlan(plan, inp, { childId: B }), []);
  const moved = { ...plan, slots: plan.slots.map((s) => (s.kind === "live_lesson" ? { ...s, window: ["16:10", "16:40"] } : s)) };
  assert.ok(validatePlan(moved, inp, { childId: B }).some((x) => x.rule === "V28"));
});

test("planner: no window (or none / a window already past) plans exactly as a single child", () => {
  const alone = inputsFor(B, 7, null);
  assert.equal(alone.household, null);
  assert.equal(inputsFor(B, 7, { state: "none" }).household, null);
  const past = inputsFor(B, 7, { state: "planned", from: "15:00", to: "15:30" });
  const p = planDay(past).plan.slots.find((s) => s.kind === "live_lesson");
  assert.equal(p.window[0], planDay(alone).plan.slots.find((s) => s.kind === "live_lesson").window[0], "a past window: her own routine window");
});

test("old snapshots replay household.window as its fallback (late key)", () => {
  assert.equal(replayView({}).get("household.window").stale, true);
});

// ───────────── the parent's setting ─────────────
test("parent.setting_changed{sharedPhone} is validated and folds into state.household", () => {
  const ev = { type: "parent.setting_changed", key: "sharedPhone", value: true, by: "owner", settingsVersion: 1 };
  assert.doesNotThrow(() => validateEvent(ev));
  assert.throws(() => validateEvent({ ...ev, value: "yes" }));
  const view = recordingView({ "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}) });
  const s0 = initialState({ childId: A, classLevel: 4, now: NOW, consent: { core_tutoring: true } });
  const on = decide(s0, ev, { now: NOW, view }).state;
  assert.deepEqual(on.household, { shared: true });
  const off = decide(on, { ...ev, value: false, settingsVersion: 2 }, { now: NOW, view }).state;
  assert.equal(off.household, undefined);
});
