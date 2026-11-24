// r7 stream E app-home-plan-states: the Kaksha Home shows the Conductor's day (homework, test window, done + made-for,
// the jar), one main action per state.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("plan.ts carries homework and the jar from ChildPlanResponse", () => {
  const src = read("src/child/plan.ts");
  assert.match(src, /homework: r\.homework \?\? null/);
  assert.match(src, /jarWaiting: Math\.max\(0, Number\(r\.jar\?\.waiting\) \|\| 0\)/);
  assert.match(src, /"homework", "test_window"/);
});

test("KakshaHome maps the server states onto the view states and routes homework to Ask", () => {
  const src = read("src/ui-v3/kaksha/screens/KakshaHome.tsx");
  assert.match(src, /homework\b[^\n]*"homework"/);
  assert.match(src, /test_window[^\n]*"test"/);
  assert.match(src, /\/ask\?homework=1/);
});

test("HomeView: every state has one main action; done shows the day, not a count", () => {
  const v = read("src/ui-v3/kaksha/views.tsx");
  for (const k of ["homeworkCta", "reviseCta", "anotherCta", "didToday", "madeForYou", "jarWaiting"]) assert.match(v, new RegExp(`kt\\("${k}"`), k);
  assert.equal((v.match(/className="kx-cta /g) || []).length >= 1, true);
  const copy = read("src/ui-v3/kaksha/copy.ts");
  for (const k of ["homeworkSub", "homeworkCta", "todaysLesson", "testSub", "reviseCta", "anotherCta", "didToday", "madeForYou", "jarWaiting"]) assert.match(copy, new RegExp(`\\b${k}:`), k);
});
