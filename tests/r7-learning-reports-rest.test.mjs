// Round 7 F, PARENT-REPORT S15 "A note about routine and rest" (MH-M12): after-bedtime starts and longer lessons behind
// absolute floors (server/reports/rest.js), admitted into weekly and monthly reports only, gate-clean in every
// language. Pure: hand-built facts and the real claim builder.
import { test } from "node:test";
import assert from "node:assert/strict";
import { afterBedtime, restSignals, REST } from "../server/reports/rest.js";
import { dayFacts } from "./fixtures/report-facts.mjs";
import { buildClaims } from "../server/reports/claims.js";
import { renderShape } from "../server/reports/templates.js";
import { lineViolations } from "../server/reports/gate.js";
import { CAPS, LANGS } from "../server/reports/config.js";

const TZ = "Asia/Kolkata";
const TO = "2026-10-12T18:30:00.000Z";                       // 2026-10-13 00:00 IST
/** A lesson on the given IST day and local time, `min` minutes long. */
const L = (id, day, hhmm, min = 20) => {
  const s = new Date(`${day}T${hhmm}:00+05:30`);
  return { id, startedAt: s.toISOString(), endedAt: min == null ? null : new Date(s.getTime() + min * 60_000).toISOString() };
};

test("after bedtime: local start at or past the bedtime set, or after midnight before 04:00; no bedtime, never", () => {
  assert.equal(afterBedtime(L("a", "2026-10-10", "21:30").startedAt, "21:00", TZ), true);
  assert.equal(afterBedtime(L("a", "2026-10-10", "20:59").startedAt, "21:00", TZ), false);
  assert.equal(afterBedtime(L("a", "2026-10-11", "00:40").startedAt, "21:00", TZ), true);
  assert.equal(afterBedtime(L("a", "2026-10-11", "06:10").startedAt, "21:00", TZ), false);
  assert.equal(afterBedtime(L("a", "2026-10-10", "23:00").startedAt, null, TZ), false);
});

test("after-bedtime line needs ≥ 3 in the last 14 days; older ones do not count", () => {
  const two = [L("1", "2026-10-05", "21:30"), L("2", "2026-10-08", "22:00"), L("3", "2026-10-09", "17:00")];
  assert.equal(restSignals(two, { bedtime: "21:00", tz: TZ, to: TO }).afterBed, null);
  const three = [...two, L("4", "2026-10-11", "21:10"), L("old", "2026-09-25", "22:00")];
  assert.deepEqual(restSignals(three, { bedtime: "21:00", tz: TZ, to: TO }).afterBed, { k: 3, d: REST.days, ids: ["1", "2", "4"] });
});

test("longer lessons need ≥ 4 closed lessons in each half and a rise of ≥ 10 min and ≥ 1.5×", () => {
  const prior = ["09-15", "09-17", "09-20", "09-25"].map((d, i) => L(`p${i}`, `2026-${d}`, "17:00", 15));
  const recentBig = ["10-01", "10-03", "10-06", "10-09"].map((d, i) => L(`r${i}`, `2026-${d}`, "17:00", 32));
  assert.deepEqual(restSignals([...prior, ...recentBig], { bedtime: null, tz: TZ, to: TO }).longer?.n1, 15);
  assert.equal(restSignals([...prior, ...recentBig], { bedtime: null, tz: TZ, to: TO }).longer.n2, 32);
  const recentSmall = recentBig.map((l) => ({ ...l, endedAt: new Date(Date.parse(l.startedAt) + 22 * 60_000).toISOString() }));
  assert.equal(restSignals([...prior, ...recentSmall], { bedtime: null, tz: TZ, to: TO }).longer, null, "+7 min is under the floor");
  assert.equal(restSignals([...prior.slice(1), ...recentBig], { bedtime: null, tz: TZ, to: TO }).longer, null, "3 earlier lessons is too few");
});

test("the two shapes are gate-clean in every language on any counts; no alarm words", () => {
  for (const [id, slots] of [["rest.afterbed", { k: 4, d: 14 }], ["rest.longer", { n1: 15, n2: 32 }]]) for (const lang of LANGS) {
    const t = renderShape(id, lang, slots);
    assert.deepEqual(lineViolations(t, { shapeId: id, slots, lang, firstName: "Riya" }), [], `${id}/${lang}: ${t}`);
    assert.doesNotMatch(t, /addict|screen time|sleep|neend|late night|too much/i);
  }
});

test("S15 in the report: weekly and monthly admit it when a threshold fires; daily and term never", () => {
  assert.equal(CAPS.weekly.rest, 1);
  assert.equal(CAPS.monthly.rest, 1);
  assert.equal(CAPS.daily.rest, 0);
  assert.equal(CAPS.term.rest, 0);
  const f = dayFacts({ cadence: "weekly", period: "2026-W41" });
  f.child.bedtime = "21:00";
  f.rest = [L("x1", "2026-10-01", "21:30"), L("x2", "2026-10-03", "22:10"), L("x3", "2026-10-05", "21:05")].map((l) => ({ ...l }));
  const out = buildClaims(f, { now: f.window.to });
  // the week 2026-W41 ends 2026-10-12 00:00 IST; its last 14 days hold all three late starts
  const rest = out.claims.filter((c) => c.section === "rest");
  assert.equal(rest.length, 1);
  assert.equal(rest[0].shapeId, "rest.afterbed");
  assert.deepEqual(rest[0].slots, { k: 3, d: 14 });
  assert.deepEqual(rest[0].factIds.sort(), ["lesson:x1", "lesson:x2", "lesson:x3"]);
  const daily = dayFacts({ cadence: "daily" });
  daily.child.bedtime = "21:00"; daily.rest = f.rest;
  assert.ok(!(buildClaims(daily, {})?.claims ?? []).some((c) => c.section === "rest"), "daily never");
});
