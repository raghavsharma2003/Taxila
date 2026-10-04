// Pins every scheduling rule behind the v3 date strip, time grid and time rail (owner reset R11).
// Run: node --test src/ui-v3/__tests__/*.test.mjs   (PATCH 02 adds these files to `npm test` after integration.)
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../schedule.ts";

const LESSONS = [
  { id: "a", date: "2026-10-05", start: 17 * 60 + 30, length: 20 },
  { id: "b", date: "2026-10-07", start: 17 * 60 + 30, length: 20 },
  { id: "c", date: "2026-10-10", start: 11 * 60, length: 30 },
];

test("time formatting", () => {
  assert.equal(S.fmtTime(990), "4:30 PM");
  assert.equal(S.fmtTime(0), "12:00 AM");
  assert.equal(S.fmtTime(720), "12:00 PM");
  assert.equal(S.fmtTime(1439), "11:59 PM");
  assert.equal(S.fmtTimeCompact(1260), "9 PM");
  assert.equal(S.fmtTimeCompact(1290), "9:30 PM");
  assert.equal(S.partOfDay(9 * 60), "Morning");
  assert.equal(S.partOfDay(13 * 60), "Afternoon");
  assert.equal(S.partOfDay(17 * 60), "Evening");
});

test("calendar arithmetic is time-zone proof", () => {
  assert.equal(S.weekday("2026-10-04"), 0, "Sun 4 Oct 2026");
  assert.equal(S.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(S.addDays("2026-03-28", 2), "2026-03-30", "across an EU DST change");
  assert.equal(S.fmtDate("2026-10-05"), "Mon 5 Oct");
  assert.equal(S.fmtDateLong("2026-10-05"), "Monday 5 October");
});

test("time rail: 15-minute slots that never let a lesson end after lesson hours", () => {
  const s20 = S.railSlots(S.DEFAULT_RAIL, 20);
  assert.equal(s20[0], 6 * 60);
  assert.equal(s20.at(-1), 21 * 60 + 30, "9:30 PM is the last 20-min start before 10 PM");
  assert.ok(s20.every((m, i) => i === 0 || m - s20[i - 1] === 15));
  assert.equal(S.railSlots(S.DEFAULT_RAIL, 45).at(-1), 21 * 60 + 15);
  assert.equal(S.snapToRail(17 * 60 + 37), 17 * 60 + 30);
  assert.equal(S.snapToRail(17 * 60 + 38), 17 * 60 + 45);
  assert.equal(S.snapToRail(2 * 60), 6 * 60, "clamped to the first slot");
  assert.equal(S.snapToRail(23 * 60, S.DEFAULT_RAIL, 20), 21 * 60 + 30, "clamped to the last slot");
  const parent = { from: 6 * 60, until: 21 * 60, step: 15 };
  assert.equal(S.railSlots(parent, 30).at(-1), 20 * 60 + 30, "a parent's 9 PM limit narrows the rail");
});

test("weekly summary reads as plain English; zero days disables Save", () => {
  assert.deepEqual(S.weeklySummary({ days: [], start: 1050, length: 20 }).ok, false);
  assert.equal(S.weeklySummary({ days: [], start: 1050, length: 20 }).line1, "Pick at least one day");
  const w = S.weeklySummary({ days: [4, 0, 2], start: 17 * 60 + 30, length: 20 });
  assert.equal(w.line1, "Mon, Wed, Fri · 5:30 PM");
  assert.equal(w.line2, "20 min · done by 5:50 PM · reminder 10 min before");
  assert.match(S.weeklySummary({ days: [0, 1, 2, 3, 4], start: 990, length: 30 }).line1, /^Weekdays · 4:30 PM$/);
  assert.match(S.weeklySummary({ days: [5, 6], start: 660, length: 30 }).line1, /^Weekends/);
  assert.match(S.weeklySummary({ days: [0, 1, 2, 3, 4, 5, 6], start: 660, length: 30 }).line1, /^Every day/);
});

test("14-day strip: today first, clash and day-off days disabled with a spoken reason", () => {
  const d = S.dateStrip({ today: "2026-10-04", lessons: LESSONS, moving: LESSONS[0], daysOff: ["2026-10-12"] });
  assert.equal(d.length, 14);
  assert.equal(d[0].label, "Today");
  assert.equal(d[1].label, "Mon", "tomorrow prints its weekday");
  assert.match(d[1].aria, /^Tomorrow, Monday 5 October/);
  assert.equal(d[2].label, "Tue");
  assert.equal(d[1].disabled, false, "the lesson being moved does not block its own day");
  assert.equal(d[3].iso, "2026-10-07");
  assert.equal(d[3].disabled, true);
  assert.equal(d[3].reason, "clash");
  assert.match(d[3].aria, /Wednesday 7 October, already has a lesson/);
  assert.equal(d.find((x) => x.iso === "2026-10-12").reason, "day_off");
  assert.equal(d.filter((x) => x.disabled).length, 3);
});

test("time grid: past, outside lesson hours and clash rules, first hit wins", () => {
  const base = { today: "2026-10-04", nowMin: 19 * 60 + 15, hours: { start: 7 * 60, end: 21 * 60 }, length: 20, lessons: LESSONS, moving: LESSONS[0] };
  const opts = [6 * 60 + 30, 7 * 60, 17 * 60 + 15, 17 * 60 + 30, 19 * 60, 19 * 60 + 30, 20 * 60 + 30, 21 * 60];
  const today = S.timeGrid({ ...base, date: "2026-10-04", options: opts });
  const r = (g, m) => g.find((o) => o.min === m).reason ?? "ok";
  assert.equal(r(today, 19 * 60), "past");
  assert.equal(r(today, 19 * 60 + 30), "ok", "exactly 15 min ahead is allowed");
  assert.equal(r(today, 7 * 60), "past");
  assert.equal(r(today, 20 * 60 + 30), "ok");
  assert.equal(r(today, 21 * 60), "outside_hours", "a 9 PM start would end at 9:20, past lesson hours");
  const wed = S.timeGrid({ ...base, date: "2026-10-07", options: opts });
  assert.equal(r(wed, 6 * 60 + 30), "outside_hours");
  assert.equal(r(wed, 7 * 60), "ok");
  assert.equal(r(wed, 17 * 60 + 15), "clash", "17:15-17:35 overlaps 17:30-17:50");
  assert.equal(r(wed, 17 * 60 + 30), "clash");
  assert.equal(r(wed, 19 * 60), "ok");
  const wedMoving = S.timeGrid({ ...base, date: "2026-10-07", moving: LESSONS[1], options: opts });
  assert.equal(r(wedMoving, 17 * 60 + 30), "ok", "moving that lesson frees its own slot");
  const past = S.timeGrid({ ...base, date: "2026-10-03", options: opts });
  assert.ok(past.every((o) => o.reason === "past"));
  const gap = S.timeGrid({ ...base, date: "2026-10-07", options: [17 * 60], gapMin: 15 });
  assert.equal(gap[0].reason, "clash", "17:00-17:20 is within a 15-min gap of 17:30");
  assert.match(today.find((o) => o.min === 19 * 60).aria, /7:00 PM, already past/);
});

test("move summary", () => {
  const g = S.timeGrid({ date: "2026-10-05", today: "2026-10-04", nowMin: 0, hours: { start: 420, end: 1260 }, length: 20, lessons: LESSONS, moving: LESSONS[0], options: [990, 1260] });
  assert.deepEqual(S.moveSummary("2026-10-05", 990, g, "Aarav"), { ok: true, text: "Mon 5 Oct · 4:30 PM · Aarav gets a heads-up" });
  assert.equal(S.moveSummary("2026-10-05", 1260, g, "Aarav").ok, false);
  assert.equal(S.moveSummary(null, null, g, "Aarav").text, "Pick a day and a time");
});

test("keyboard model: arrows skip disabled options, Home/End, grid rows", () => {
  const dis = [false, true, false, false, true, false];
  assert.equal(S.nextIndex("ArrowRight", 0, dis), 2);
  assert.equal(S.nextIndex("ArrowLeft", 2, dis), 0);
  assert.equal(S.nextIndex("ArrowRight", 5, dis), 5, "stops at the end, no wrap");
  assert.equal(S.nextIndex("Home", 3, dis), 0);
  assert.equal(S.nextIndex("End", 0, dis), 5);
  assert.equal(S.nextIndex("ArrowDown", 0, [false, false, false, false, false, false, false, false], 4), 4);
  assert.equal(S.nextIndex("ArrowUp", 5, [false, false, false, false, false, false, false, false], 4), 1);
  assert.equal(S.nextIndex("Enter", 0, dis), null);
  assert.equal(S.nextIndex("ArrowRight", 0, [true, true]), null, "nothing selectable");
});
