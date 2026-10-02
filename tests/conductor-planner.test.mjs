// The Scheduler library, the code planner and the plan validator: pure, no database.
// Every validator rule built at M0 has a negative control (a plan that must be rejected).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { addDays, clockPhase, dayKindLookup, dayMin, isoWeek, jitterSec, learningDay, localTime, zonedToUtc } from "../server/conductor/clock.js";
import { buildPlannerInputs, fitSegments, inputsHash, planDay } from "../server/conductor/planner.js";
import { validatePlan } from "../server/conductor/validate.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView } from "../server/conductor/view.js";
import { BAND } from "../server/conductor/config.js";
import { jcs, ulid } from "../server/conductor/ids.js";
import { validateEvent, EventInvalid, idemKeyFor } from "../server/conductor/events.js";

const CHILD = "11111111-2222-4333-8444-555555555555";
const ist = (day, hhmm) => new Date(`${day}T${hhmm}:00+05:30`);
const view = (due = 0, used = 0) => recordingView({
  "kt.dueCount": { value: due, asOf: "x", src: "skill_state", stale: false },
  "usage.usedMin": { value: used, asOf: "x", src: "student_event", stale: false },
  "cal.days": { value: {}, asOf: "x", src: "calendar", stale: false },
});
function inputsFor({ classLevel = 4, now = ist("2026-10-05", "16:10"), due = 0, used = 0, mut = (s) => s } = {}) {
  const s = mut({ ...initialState({ childId: CHILD, classLevel, now, consent: { core_tutoring: true } }), learningDay: learningDay(now, "Asia/Kolkata") });
  return buildPlannerInputs(s, { now, view: view(due, used), cal: dayKindLookup(s.school.dayOverrides, {}) });
}

// ───────────── clock ─────────────
test("clock: IST local time, learning day, ISO week, zoned → UTC, jitter", () => {
  assert.equal(localTime(new Date("2026-10-05T10:40:00Z"), "Asia/Kolkata"), "16:10");
  assert.equal(learningDay(ist("2026-10-06", "03:59"), "Asia/Kolkata"), "2026-10-05");
  assert.equal(learningDay(ist("2026-10-06", "04:00"), "Asia/Kolkata"), "2026-10-06");
  assert.equal(isoWeek("2026-10-02"), "2026-W40");
  assert.equal(isoWeek("2027-01-01"), "2026-W53");
  assert.equal(zonedToUtc("2026-10-05", "05:00", "Asia/Kolkata").toISOString(), "2026-10-04T23:30:00.000Z");
  assert.equal(zonedToUtc("2026-03-08", "12:00", "America/New_York").toISOString(), "2026-03-08T16:00:00.000Z");   // DST day
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  const j = jitterSec(CHILD, "day_start", 3600);
  assert.ok(j >= 0 && j < 3600);
  assert.equal(j, jitterSec(CHILD, "day_start", 3600), "stable per child");
});

test("clockPhase: morning → at_school → recovery → learning_window → wind_down → night; off days are free_day", () => {
  const r = { tz: "Asia/Kolkata", wakeTime: "06:30", schoolStart: "08:00", schoolEnd: "14:00", recoveryMin: 60, bedtime: "21:30" };
  const l = { allowedFrom: "07:00", allowedTo: "20:30", dailyMinutes: 30 };
  const cal = dayKindLookup();
  const at = (hhmm, day = "2026-10-05") => clockPhase(r, l, ist(day, hhmm), cal);
  assert.equal(at("06:00"), "night");
  assert.equal(at("07:00"), "morning");
  assert.equal(at("10:00"), "at_school");
  assert.equal(at("14:30"), "recovery");
  assert.equal(at("16:00"), "learning_window");
  assert.equal(at("20:30"), "wind_down");       // bedtime − 60
  assert.equal(at("21:00"), "night");           // bedtime − 30
  assert.equal(at("11:00", "2026-10-04"), "free_day");   // Sunday
});

// ───────────── planner ─────────────
test("fitSegments keeps the minimum segment set and shrinks optional segments first", () => {
  const b2 = BAND.B2.segments;
  assert.equal(fitSegments(b2, 25).reduce((a, s) => a + s.minutes, 0), 25);
  const s16 = fitSegments(b2, 16);
  assert.equal(s16.reduce((a, s) => a + s.minutes, 0), 16);
  for (const k of ["retrieve", "teach", "teachback", "wrap"]) assert.ok(s16.some((s) => s.kind === k), k);
  assert.ok(!s16.some((s) => s.kind === "break"), "break goes first");
  assert.equal(fitSegments(b2, 7), null, "below the shrunk minimum set (2+3+2+1 = 8) nothing fits");
});

test("planDay is pure: equal inputs → byte-equal plans; the hash moves with included fields only", () => {
  const a = inputsFor(), b = inputsFor();
  assert.equal(jcs(planDay(a)), jcs(planDay(b)));
  assert.equal(inputsHash(a), inputsHash(b));
  // excluded: the raw now inside the same 15-min floor, the view's asOf
  assert.equal(inputsHash(inputsFor({ now: ist("2026-10-05", "16:14") })), inputsHash(inputsFor({ now: ist("2026-10-05", "16:01") })));
  assert.equal(inputsHash(inputsFor({ now: ist("2026-10-05", "09:00") })), inputsHash(inputsFor({ now: ist("2026-10-05", "11:40") })), "before the window opens, the clock is not an input");
  // included: usage, due reviews, the band
  assert.notEqual(inputsHash(inputsFor({ used: 10 })), inputsHash(a));
  assert.notEqual(inputsHash(inputsFor({ due: 3 })), inputsHash(a));
  assert.notEqual(inputsHash(inputsFor({ classLevel: 7 })), inputsHash(a));
  // negative control: an unsorted array would change the hash, so the builder sorts
  const p1 = inputsFor({ mut: (s) => ({ ...s, promises: [{ id: "b", kind: "game", ref: "x", by: "d" }, { id: "a", kind: "game", ref: "y", by: "d" }] }) });
  const p2 = inputsFor({ mut: (s) => ({ ...s, promises: [{ id: "a", kind: "game", ref: "y", by: "d" }, { id: "b", kind: "game", ref: "x", by: "d" }] }) });
  assert.equal(inputsHash(p1), inputsHash(p2));
});

test("plans per band stay inside the cap and the 70% aim, with the minimum segment set", () => {
  for (const cl of [1, 3, 6, 9]) {
    const inp = inputsFor({ classLevel: cl });
    const { plan } = planDay(inp);
    assert.deepEqual(validatePlan(plan, inp, { childId: CHILD }), [], `class ${cl}`);
    const l = plan.slots.find((s) => s.kind === "live_lesson");
    assert.ok(l, `class ${cl} has a lesson`);
    assert.ok(plan.plannedMin <= plan.capMin);
  }
});

test("a late open shortens the sitting by time left before bedtime − 60, never by lateness itself", () => {
  const late = planDay(inputsFor({ now: ist("2026-10-05", "20:10") })).plan;     // B2: window ends 20:30
  const l = late.slots.find((s) => s.kind === "live_lesson");
  assert.ok(l && l.targetMin <= 15, "fits in the 15 min left (20:10 ceiled to 20:15)");
  assert.equal(l.window[0], "20:15");
  const none = planDay(inputsFor({ now: ist("2026-10-05", "20:40") })).plan;
  assert.equal(none.slots.length, 0, "wind_down: nothing new");
});

test("no catch-up debt: minutes already used today shrink the plan, never grow it", () => {
  const full = planDay(inputsFor()).plan.plannedMin;
  const used = planDay(inputsFor({ used: 20 })).plan.plannedMin;
  assert.ok(used < full);
});

// ───────────── validator negative controls ─────────────
function rejects(rule, mutate, opts = {}) {
  const inp = inputsFor(opts);
  const { plan } = planDay(inp);
  const bad = mutate(structuredClone(plan), inp);
  const v = validatePlan(bad, inp, { childId: CHILD });
  assert.ok(v.some((x) => x.rule === rule), `${rule} must reject; got ${JSON.stringify(v)}`);
}
test("V1 rejects plannedMin above the cap and homework above the band sub-cap", () => {
  rejects("V1", (p) => { p.slots[0].targetMin = 200; p.plannedMin = 200; return p; });
  rejects("V1", (p) => { p.slots.push({ id: "hw", kind: "homework_help", targetMin: 20, window: p.slots[0].window, segments: [], voiceSecWanted: {} }); p.plannedMin += 20; return p; });
});
test("V2 rejects a slot outside the learning window or after bedtime − 60", () => {
  rejects("V2", (p) => { p.slots[0].window = ["21:00", "21:30"]; return p; });
  rejects("V2", (p) => { p.slots[0].window = ["06:00", "07:00"]; return p; });
});
test("V3 rejects realtime above the voice budget", () => rejects("V3", (p) => { p.voiceBudgetSec = { realtime: 10 }; return p; }));
test("V4 rejects homework help on realtime", () => rejects("V4", (p) => {
  p.slots.push({ id: "hw", kind: "homework_help", targetMin: 5, window: p.slots[0].window, segments: [{ kind: "teach", minutes: 5, laneWanted: "realtime" }], voiceSecWanted: {} });
  p.plannedMin += 5; return p;
}));
test("V10 rejects changing or dropping a frozen (shown/started) slot", () => {
  const now = ist("2026-10-05", "16:10");
  const base = inputsFor();
  const first = planDay(base).plan;
  const frozenSlot = first.slots[0];
  const mut = (s) => ({ ...s, plan: { day: "2026-10-05", version: 1, source: "code", inputsHash: "x", mode: "school_day", slots: first.slots,
    shownSlotIds: [frozenSlot.id], startedSlotIds: [], doneSlotIds: [] } });
  const inp = inputsFor({ now, mut });
  const { plan } = planDay(inp);
  assert.deepEqual(validatePlan(plan, inp, { childId: CHILD }), [], "the planner itself keeps it verbatim");
  const changed = structuredClone(plan); changed.slots[0].targetMin -= 1; changed.plannedMin -= 1;
  assert.ok(validatePlan(changed, inp, { childId: CHILD }).some((v) => v.rule === "V10"));
  const dropped = structuredClone(plan); dropped.slots = []; dropped.plannedMin = 0;
  assert.ok(validatePlan(dropped, inp, { childId: CHILD }).some((v) => v.rule === "V10"));
});
test("V12 rejects a plan above a normal day", () => rejects("V12", (p) => {
  p.capMin = 500; p.slots.push({ ...p.slots[0], id: "x2", targetMin: 30 }); p.plannedMin += 30; return p;
}));
test("V15 rejects out-of-bounds knobs and a lesson missing its minimum set", () => {
  rejects("V15", (p) => { p.slots[0].pace = { newSkillBudget: 3 }; return p; });
  rejects("V15", (p) => { p.slots[0].pace = { newSkillBudget: 2 }; return p; }, { classLevel: 1 });
  rejects("V15", (p) => { p.slots[0].segments = p.slots[0].segments.filter((g) => g.kind !== "wrap"); return p; });
});
test("V30 rejects another child's id anywhere in the plan", () => rejects("V30", (p) => {
  p.slots[0].why.push({ code: "level_path", ref: "99999999-2222-4333-8444-555555555555" }); return p;
}));

// ───────────── events ─────────────
test("events: zod refuses unknown types, unknown keys and free text; idem keys come from the fact", () => {
  assert.throws(() => validateEvent({ type: "lesson.chat", text: "hi" }), EventInvalid);
  assert.throws(() => validateEvent({ type: "app.closed", reason: "background", note: "she cried" }), EventInvalid);
  assert.throws(() => validateEvent({ type: "teacher.promise", promiseId: "p1", what: { kind: "game", ref: "next time we play cricket" }, by: "asha" }), EventInvalid);
  const e = validateEvent({ type: "lesson.ended", lessonId: "L-1", reason: "completed", minutes: 12, outcomeDigest: { vibeClose: "fine" } });
  assert.equal(idemKeyFor(e), "lesson.ended:L-1");
  assert.equal(idemKeyFor(validateEvent({ type: "parent.setting_changed", key: "dailyMinutes", value: 20, by: "owner", settingsVersion: 3 })), "setting:dailyMinutes:3");
});

test("ulid: 26 Crockford chars, time-ordered", () => {
  const a = ulid(1_700_000_000_000), b = ulid(1_700_000_000_001);
  assert.match(a, /^[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.ok(a.slice(0, 10) < b.slice(0, 10));
});

// ───────────── the migration under scripts/migrate.mjs's splitter ─────────────
test("004_conductor.sql survives migrate.mjs's split: every $$ body stays one statement", () => {
  const body = readFileSync(new URL("../db/migrations/004_conductor.sql", import.meta.url), "utf8");
  // the exact split scripts/migrate.mjs uses
  const stmts = body.split(/;\s*$/m).map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
  for (const s of stmts) assert.equal((s.match(/\$\$/g) || []).length % 2, 0, `unbalanced $$ in: ${s.slice(0, 80)}`);
  const fns = stmts.filter((s) => /^create or replace function/i.test(s)).map((s) => s.match(/function (\w+)/)[1]);
  assert.deepEqual(fns.sort(), ["complete_job", "fire_wakeups", "gen_ulid", "ingest_event"]);
});

test("004_conductor_notification.sql survives the same split and aligns notification with §4.10.3", () => {
  const body = readFileSync(new URL("../db/migrations/004_conductor_notification.sql", import.meta.url), "utf8");
  const stmts = body.split(/;\s*$/m).map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
  for (const s of stmts) assert.equal((s.match(/\$\$/g) || []).length % 2, 0, `unbalanced $$ in: ${s.slice(0, 80)}`);
  assert.ok(stmts.some((s) => /references child\(id\) on delete cascade/.test(s)), "child_id cascades");
  assert.ok(stmts.some((s) => /guardian_id set not null/.test(s)));
});

// ───────────── after midnight: the learning day runs 04:00 → 04:00 ─────────────
test("planner: an open at 23:50, 00:30 or 03:59 IST (same learning day, past the window) plans NO new slot", () => {
  assert.ok(dayMin("00:30") > dayMin("20:30"), "00:30 is after 20:30 in a learning day");
  assert.ok(dayMin("03:59") > dayMin("00:30") && dayMin("04:00") === 0);
  for (const [day, hhmm] of [["2026-10-05", "23:50"], ["2026-10-06", "00:30"], ["2026-10-06", "03:59"]]) {
    const now = ist(day, hhmm);
    const inp = inputsFor({ now, due: 5 });
    assert.equal(inp.day.learningDay, "2026-10-05");
    assert.equal(inp.window.effFrom, inp.window.to, `${hhmm}: effFrom clamps to the window end`);
    const { plan } = planDay(inp);
    assert.deepEqual(plan.slots, [], `${hhmm}: no slot offered past bedtime`);
    assert.deepEqual(validatePlan(plan, inp, { childId: CHILD, now, tz: "Asia/Kolkata" }), []);
  }
  // after the window closes the clock is not an input either: no replan churn every quarter hour
  assert.equal(inputsHash(inputsFor({ now: ist("2026-10-05", "23:50") })), inputsHash(inputsFor({ now: ist("2026-10-06", "03:59") })));
});

test("V2 checks the real current instant: a 16:10 plan validated at 00:30 is rejected (negative control)", () => {
  const plan = planDay(inputsFor({ now: ist("2026-10-05", "16:10") })).plan;
  assert.ok(plan.slots.length, "a lesson was planned at 16:10");
  const late = inputsFor({ now: ist("2026-10-06", "00:30") });
  const v = validatePlan(plan, late, { childId: CHILD, now: ist("2026-10-06", "00:30"), tz: "Asia/Kolkata" });
  assert.ok(v.some((x) => x.rule === "V2" && /already past/.test(x.detail)), JSON.stringify(v));
  // and the same plan is fine at the moment it was made
  assert.deepEqual(validatePlan(plan, inputsFor({ now: ist("2026-10-05", "16:10") }), { childId: CHILD, now: ist("2026-10-05", "16:10"), tz: "Asia/Kolkata" }), []);
});

test("events: parent.setting_changed values are per-key and refused at ingest (never clamped or quarantined later)", () => {
  const sc = (key, value) => ({ type: "parent.setting_changed", key, value, by: "owner", settingsVersion: 1 });
  for (const [k, v] of [["tz", "Asia/Kolkata"], ["tz", "America/Argentina/Buenos_Aires"], ["dailyMinutes", 10], ["dailyMinutes", 120], ["hoursEnd", "20:30"], ["bedtime", "00:15"], ["restDays", [0, 6]]]) {
    assert.doesNotThrow(() => validateEvent(sc(k, v)), `${k}=${JSON.stringify(v)}`);
  }
  for (const [k, v] of [["tz", "Mars/Olympus"], ["tz", "Asia/Kolkata; drop"], ["dailyMinutes", "07:00"], ["dailyMinutes", 9], ["dailyMinutes", 121], ["dailyMinutes", 20.5],
    ["hoursEnd", 20], ["hoursEnd", "24:00"], ["restDays", [7]], ["restDays", "0"], ["wakeTime", "6:30"]]) {
    assert.throws(() => validateEvent(sc(k, v)), EventInvalid, `${k}=${JSON.stringify(v)} must be refused`);
  }
});
