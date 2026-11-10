// r7 audit, parent Home: LEARN-31 (Try at home for an empty week), LEARN-32 ("can now" above "Lessons this week: 0"),
// LEARN-33 (an open lesson with no answer ran to "now"), LEARN-34 (Recent lessons without the short title), LEARN-38 (an
// unanswered consent showed the "yes" effect). Pure, plus source checks where the code sits in a DB-backed route.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { homeHeadline } from "../server/routes/parent.js";
import { lessonEndMs, lessonTally } from "../server/reports/truth.js";
import { lessonEndMs as claimsEndMs } from "../server/reports/claims.js";
import { OPEN_SO_FAR_MAX_MIN } from "../server/reports/config.js";

const src = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");

test("LEARN-32: no lessons this calendar week → 'No lessons this week', never a claim from last week", () => {
  const now = new Date("2026-11-09T05:00:00Z");   // a Monday morning
  const s = { skillId: "s1", level: 2, lastSeen: "2026-11-07T11:00:00Z" };
  const rows = Array.from({ length: 6 }, (_, i) => ({ scored: true, result: "right", firstTryUnaided: true, at: `2026-11-0${1 + i}T11:00:00Z` }));
  const h = homeHeadline({ skills: [s], rowsBySkill: new Map([["s1", rows]]), totalRows: 20, lessonsEver: 5, lessonsThisWeek: 0, now });
  assert.equal(h.kind, "no_week");
  assert.equal(h.canNow, null);
});

test("LEARN-33: an open lesson with no answer counts at most OPEN_SO_FAR_MAX_MIN in a 'so far' view, in both rules", () => {
  const l = { id: "L", startedAt: "2026-11-02T11:00:00Z", endedAt: null };
  const friday = "2026-11-06T11:00:00Z";
  for (const f of [lessonEndMs, claimsEndMs]) {
    assert.equal((f(l, [], friday) - Date.parse(l.startedAt)) / 60_000, OPEN_SO_FAR_MAX_MIN);
    assert.equal(f(l, [], "2026-11-02T11:10:00Z") - Date.parse(l.startedAt), 10 * 60_000, "a lesson running now: so far");
  }
  const t = lessonTally([{ ...l, abandoned: false, did: true }], { from: "2026-11-02T00:00:00Z", to: "2026-11-09T00:00:00Z" }, [], friday);
  assert.ok(t.minutes <= OPEN_SO_FAR_MAX_MIN, `week minutes ${t.minutes}`);
});

test("LEARN-31: Try at home is withheld for a week with no lessons", async () => {
  const { tryAtHomeFrom } = await import("../server/routes/parent.js");
  const home = { section: "home", text: "Count spoons together.", claimId: null };
  assert.equal(tryAtHomeFrom({ claims: [{ section: "header", shapeId: "header.zero" }], renders: { en: { lines: [home] } } }, "2026-W46"), null);
  assert.ok(tryAtHomeFrom({ claims: [{ section: "header", shapeId: "header.weekly" }], renders: { en: { lines: [home] } } }, "2026-W46"));
});

test("LEARN-34: Home's recent lessons use the Lessons list's topic mapper (with the short title)", () => {
  assert.match(src("server/routes/parent.js"), /const topicOut = topicOf_;/);
});

test("LEARN-38: an unanswered consent shows the 'no' effect", () => {
  assert.match(src("src/parent/Pages.tsx"), /consentEffect\(now, c\.effectYes, c\.effectNo\(teacherName\)\)/);
});

test("LEARN-22: the home card keeps the class length once today's lesson slot has been used", async () => {
  const { cardMinutes, lessonMinutes } = await import("../server/routes/child.js");
  const plan = { slots: [{ id: "L1", kind: "live_lesson", targetMin: 22 }] };
  assert.equal(cardMinutes(plan, 5, 60, false), 22, "the next lesson takes the slot");
  assert.equal(cardMinutes(plan, 5, 60, true), lessonMinutes(5, 60), "after a start today: the class length, as before the plan");
  assert.equal(cardMinutes(null, 5, 60, false), lessonMinutes(5, 60));
});
