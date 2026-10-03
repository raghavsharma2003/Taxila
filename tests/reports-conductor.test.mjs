// The end-of-day report jobs in the Conductor (decide.js foldNight → report.daily / parent.letter): enqueued once per
// learning day, only for an active day (daily) or a Sunday (weekly), after the day's window closes, through the same
// guards as every job (consent, safety hold), and handled idempotently by server/reports/jobs.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decide } from "../server/conductor/decide.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView } from "../server/conductor/view.js";
import { JOB_KINDS } from "../server/conductor/config.js";
import { handlerFor } from "../server/conductor/jobs.js";
import "../server/conductor/handlers.js";
import { runReportJob } from "../server/reports/jobs.js";
import { JOB_BUDGET } from "../server/reports/config.js";

const CHILD = "11111111-2222-4333-8444-555555555555";
const ist = (day, hhmm) => new Date(`${day}T${hhmm}:00+05:30`);
const view = () => recordingView({
  "kt.dueCount": { value: 0, asOf: "x", src: "skill_state", stale: false },
  "usage.usedMin": { value: 0, asOf: "x", src: "student_event", stale: false },
  "cal.days": { value: {}, asOf: "x", src: "calendar", stale: false },
});
const run = (s, ev, now) => decide(s, ev, { now, view: view() });
const fresh = (consent = { core_tutoring: true, memory: true }) => initialState({ childId: CHILD, classLevel: 5, now: ist("2026-10-05", "06:00"), consent });
const opened = { type: "app.opened", device: "web", replicaId: "r1", bootId: "b1" };
const enq = (out) => out.commands.filter((c) => c.kind === "enqueue").map((c) => c.job);

/** A child who opened the app and had one lesson on `day` (17:00 IST). */
function activeOn(day, s = fresh()) {
  s = run(s, { ...opened, bootId: `b-${day}` }, ist(day, "16:30")).state;
  s = run(s, { type: "lesson.started", lessonId: `L-${day}`, topicId: "c5-maths-ch01-t01", kind: "live", lanes: ["cascade"] }, ist(day, "17:00")).state;
  return run(s, { type: "lesson.ended", lessonId: `L-${day}`, reason: "completed", minutes: 24 }, ist(day, "17:24")).state;
}

test("job kinds are registered with a consent purpose, a budget and handlers", () => {
  for (const [k, b] of [["report.daily", JOB_BUDGET.daily], ["parent.letter", JOB_BUDGET.weekly]]) {
    assert.equal(JOB_KINDS[k].purpose, "core_tutoring");
    assert.equal(JOB_KINDS[k].budgetMicroUsd, b);
    assert.ok(b > 0);
    assert.ok(!JOB_KINDS[k].allowedIn.includes("safety_hold"));
    assert.equal(typeof handlerFor(k), "function");
  }
});

test("night fold of an active day enqueues its daily note once, to run after the learning day closes (04:10 IST next day)", () => {
  const s = activeOn("2026-10-06");                                   // a Tuesday
  const night = { type: "clock.wakeup", reason: "night", wakeupId: "night:2026-10-06" };
  const out = run(s, night, ist("2026-10-07", "02:20"));
  const jobs = enq(out);
  const d = jobs.find((j) => j.kind === "report.daily");
  assert.ok(d, "report.daily enqueued");
  assert.equal(d.idemKey, `report.daily:${CHILD}:2026-10-06`);
  assert.deepEqual(d.input, { day: "2026-10-06" });
  assert.equal(d.runAfter, ist("2026-10-07", "04:10").toISOString());
  assert.equal(d.budgetMicroUsd, JOB_BUDGET.daily);
  assert.ok(!jobs.some((j) => j.kind === "parent.letter"), "not a Sunday: no letter");
  assert.ok(out.state.pending.jobs[d.idemKey]);
  assert.ok(out.rulesFired.includes("report_daily"));
  const again = run(out.state, night, ist("2026-10-07", "02:21"));
  assert.ok(!enq(again).length, "the fold runs once per learning day, so the job is asked for once");
});

test("a quiet day gets no daily note; a Sunday fold asks for the ISO week's letter whatever the lessons", () => {
  let s = activeOn("2026-10-05");
  s = run(s, { type: "clock.wakeup", reason: "night", wakeupId: "night:2026-10-05" }, ist("2026-10-06", "02:10")).state;
  // nothing on Tue-Sat; the Sunday 2026-10-11 night fires at Mon 02:30
  for (const d of ["2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"]) {
    const next = new Date(Date.parse(d + "T00:00:00Z") + 86_400_000).toISOString().slice(0, 10);
    const o = run(s, { type: "clock.wakeup", reason: "night", wakeupId: `night:${d}` }, ist(next, "02:10"));
    assert.ok(!enq(o).some((j) => j.kind === "report.daily"), `no daily for quiet ${d}`);
    s = o.state;
  }
  const sun = run(s, { type: "clock.wakeup", reason: "night", wakeupId: "night:2026-10-11" }, ist("2026-10-12", "02:30"));
  const letter = enq(sun).find((j) => j.kind === "parent.letter");
  assert.ok(letter);
  assert.equal(letter.idemKey, `parent.letter:${CHILD}:2026-W41`);
  assert.deepEqual(letter.input, { isoWeek: "2026-W41" });
  assert.equal(letter.runAfter, ist("2026-10-12", "04:10").toISOString());
});

test("guards: no consent → the report jobs are blocked (logged); a safety hold drops them", () => {
  const s = activeOn("2026-10-06", fresh({ core_tutoring: false }));
  const out = run(s, { type: "clock.wakeup", reason: "night", wakeupId: "night:2026-10-06" }, ist("2026-10-07", "02:20"));
  assert.ok(!enq(out).length);
  assert.ok(out.blocked.some((b) => b.cmd.job === "report.daily" && b.reason === "consent:core_tutoring"));
  const h = { ...activeOn("2026-10-06"), mode: "safety_hold", hold: { incidentId: "i1", level: "high" } };
  const held = run(h, { type: "clock.wakeup", reason: "night", wakeupId: "night:2026-10-06" }, ist("2026-10-07", "02:20"));
  assert.ok(held.blocked.some((b) => b.cmd.job === "report.daily" && b.reason === "safety_hold"));
});

test("a missed night is caught up by the next day's first event: the daily note is still asked for, once", () => {
  const s = activeOn("2026-10-06");
  const out = run(s, { ...opened, bootId: "next" }, ist("2026-10-07", "16:00"));   // no night wakeup ran
  assert.ok(enq(out).some((j) => j.idemKey === `report.daily:${CHILD}:2026-10-06`));
});

test("handler: a bad period is final; an existing stored report short-circuits with no model call and no spend", async () => {
  const job = { id: 7, attempts: 1, child_id: CHILD, input: { day: "2026-13-99x" }, budget_micro_usd: 20000, spent_micro_usd: 0 };
  await assert.rejects(runReportJob(job, { heartbeat: async () => ({ alive: true, cancelRequested: false }) }, "daily", { db: { q: async () => [] } }), (e) => e.final === true);
  const calls = [];
  const db = { q: async (text, params) => { calls.push(text); return /from parent_report/.test(text) ? [{ id: 42 }] : []; } };
  let llm = 0;
  const r = await runReportJob({ ...job, input: { day: "2026-10-06" } }, { heartbeat: async () => ({ alive: true, cancelRequested: false }) }, "daily",
    { db, llm: { chat: async () => { llm++; return {}; } } });
  assert.equal(r, "parent_report:42:existing");
  assert.equal(llm, 0);
  assert.ok(!calls.some((t) => /update job set spent/.test(t)));
});
