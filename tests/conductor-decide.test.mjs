// decide() is pure: (state, event, ctx) → { state', commands }. These tests drive the reducer with explicit
// clocks and a recorded view, with no database. Times are IST (Asia/Kolkata, UTC+5:30).
import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, decideOrFailSafe, isAuthority } from "../server/conductor/decide.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView, replayView, ReplayMiss } from "../server/conductor/view.js";
import { jcs } from "../server/conductor/ids.js";
import { foldEvent } from "../server/conductor/step.js";

const CHILD = "11111111-2222-4333-8444-555555555555";
const ist = (day, hhmm) => new Date(`${day}T${hhmm}:00+05:30`);
const viewOf = (over = {}) => recordingView({
  "kt.dueCount": { value: 0, asOf: "x", src: "skill_state", stale: false },
  "usage.usedMin": { value: 0, asOf: "x", src: "student_event", stale: false },
  "cal.days": { value: {}, asOf: "x", src: "calendar", stale: false },
  ...over,
});
const fresh = (over = {}) => initialState({ childId: CHILD, classLevel: 4, now: ist("2026-10-05", "06:00"),
  consent: { core_tutoring: true, memory: true }, ...over });
const run = (state, ev, now, view = viewOf()) => decide(state, ev, { now, view });
const kinds = (out) => out.commands.map((c) => c.kind);
const opened = { type: "app.opened", device: "web", replicaId: "r1", bootId: "b1" };

test("app.opened with no plan builds the code plan now (v1, first_open) and arms the day clock", () => {
  const s0 = fresh();
  const out = run(s0, opened, ist("2026-10-05", "16:10"));       // Monday, after school
  const adopt = out.commands.find((c) => c.kind === "plan.adopt");
  assert.ok(adopt, "a plan is adopted");
  assert.equal(adopt.version, 1);
  assert.equal(adopt.reason, "first_open");
  assert.equal(adopt.day, "2026-10-05");
  assert.equal(adopt.plan.mode, "school_day");
  const lesson = adopt.plan.slots.find((s) => s.kind === "live_lesson");
  assert.ok(lesson, "one live lesson slot");
  assert.ok(adopt.plan.plannedMin <= adopt.plan.capMin, "V1");
  assert.equal(out.state.plan.version, 1);
  assert.equal(out.state.learningDay, "2026-10-05");
  const wakes = out.commands.filter((c) => c.kind === "wakeup").map((c) => c.dedupe).sort();
  assert.deepEqual(wakes, ["day_start:2026-10-06", "night:2026-10-05", "night:2026-10-06"]);
  // the input state is never mutated
  assert.equal(s0.plan, undefined);
  assert.equal(s0.learningDay, null);
});

test("decide is deterministic: equal inputs give byte-equal outputs", () => {
  const a = run(fresh(), opened, ist("2026-10-05", "16:10"));
  const b = run(fresh(), opened, ist("2026-10-05", "16:10"));
  assert.equal(jcs(a.commands), jcs(b.commands));
  assert.equal(jcs(a.state), jcs(b.state));
});

test("a second open the same day does not re-plan; a new learning day does", () => {
  const s1 = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  const again = run(s1, { ...opened, bootId: "b2" }, ist("2026-10-05", "17:00"));
  assert.ok(!kinds(again).includes("plan.adopt"));
  const tomorrow = run(s1, { ...opened, bootId: "b3" }, ist("2026-10-06", "16:00"));
  const adopt = tomorrow.commands.find((c) => c.kind === "plan.adopt");
  assert.equal(adopt.day, "2026-10-06");
  assert.equal(adopt.version, 1);
  assert.ok(tomorrow.rulesFired.includes("fold_night"), "the missed night is caught up once on the new day");
});

test("learningDay = localDate(now − 4 h): a 01:30 open belongs to yesterday", () => {
  const out = run(fresh(), opened, ist("2026-10-06", "01:30"));
  assert.equal(out.state.learningDay, "2026-10-05");
});

test("lesson.started → in_lesson and freezes the slot; lesson.ended → free, memory job, debounced re-plan", () => {
  let s = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  const slotId = s.plan.slots.find((x) => x.kind === "live_lesson").id;
  let out = run(s, { type: "lesson.started", lessonId: "L-1", topicId: "c4-maths-fractions", kind: "live", lanes: ["realtime"] }, ist("2026-10-05", "16:20"));
  s = out.state;
  assert.equal(s.mode, "in_lesson");
  assert.ok(s.plan.startedSlotIds.includes(slotId));
  out = run(s, { type: "lesson.ended", lessonId: "L-1", reason: "completed", minutes: 22, outcomeDigest: { vibeClose: "tired" } }, ist("2026-10-05", "16:45"));
  s = out.state;
  assert.equal(s.mode, "free");
  const job = out.commands.find((c) => c.kind === "enqueue");
  assert.equal(job.job.kind, "memory.consolidate");
  assert.equal(job.job.idemKey, "memory.consolidate:L-1");
  assert.ok(s.pending.jobs["memory.consolidate:L-1"]);
  const replan = out.commands.find((c) => c.kind === "wakeup" && c.reason === "replan");
  assert.equal(replan.dedupe, "replan:2026-10-05");
  assert.equal(replan.at, new Date(ist("2026-10-05", "16:45").getTime() + 5 * 60_000).toISOString());
  assert.equal(s.adapt.successFirstNext, true, "X45: one bad close → success-first only");
  assert.equal(s.counters.lastActiveDay, "2026-10-05");
  // the debounced re-plan keeps the started slot verbatim (V10) and adds no second lesson
  out = run(s, { type: "clock.wakeup", reason: "replan", wakeupId: "replan:2026-10-05" }, ist("2026-10-05", "16:50"));
  const adopt = out.commands.find((c) => c.kind === "plan.adopt");
  if (adopt) {
    assert.equal(adopt.version, 2);
    assert.equal(adopt.plan.slots.filter((x) => x.kind === "live_lesson").length, 1);
    assert.equal(jcs(adopt.plan.slots.find((x) => x.id === slotId)), jcs(s.plan.slots.find((x) => x.id === slotId)));
  }
  // job.done clears pending
  out = run(out.state, { type: "job.done", jobId: "9", kind: "memory.consolidate", idemKey: "memory.consolidate:L-1" }, ist("2026-10-05", "16:51"));
  assert.deepEqual(out.state.pending.jobs, {});
});

test("network ending → resumable 15 min with a resume_window_end timer; reopening asks for a brief.refresh", () => {
  let s = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  s = run(s, { type: "lesson.started", lessonId: "L-2", topicId: "t", kind: "live", lanes: ["realtime"] }, ist("2026-10-05", "16:20")).state;
  const out = run(s, { type: "lesson.ended", lessonId: "L-2", reason: "network", minutes: 6 }, ist("2026-10-05", "16:26"));
  assert.equal(out.state.resumable.lessonId, "L-2");
  assert.ok(out.commands.some((c) => c.kind === "wakeup" && c.dedupe === "resume:L-2"));
  const re = run(out.state, { ...opened, bootId: "b9" }, ist("2026-10-05", "16:30"));
  assert.ok(re.commands.some((c) => c.kind === "brief.refresh" && c.resumeOf === "L-2"));
  const late = run(out.state, { ...opened, bootId: "b10" }, ist("2026-10-05", "16:45"));
  assert.ok(!late.commands.some((c) => c.kind === "brief.refresh"), "the window closed at +15 min");
});

test("safety.incident pre-empts everything: safety_hold, jobs cancelled, rest plan, guard drops new work", () => {
  let s = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  s = run(s, { type: "lesson.started", lessonId: "L-3", topicId: "t", kind: "live", lanes: ["realtime"] }, ist("2026-10-05", "16:20")).state;
  s = run(s, { type: "lesson.ended", lessonId: "L-3", reason: "completed", minutes: 20 }, ist("2026-10-05", "16:40")).state;
  const out = run(s, { type: "safety.incident", incidentId: "inc-1", severity: "high", category: "self_harm" }, ist("2026-10-05", "16:41"));
  assert.equal(out.state.mode, "safety_hold");
  assert.deepEqual(out.state.hold, { incidentId: "inc-1", level: "high" });
  assert.ok(out.commands.some((c) => c.kind === "cancel" && c.idemKey === "memory.consolidate:L-3"));
  const adopt = out.commands.find((c) => c.kind === "plan.adopt");
  assert.equal(adopt.plan.mode, "rest_day");
  // while held, a new lesson end's memory job is dropped by safetyGuard and logged
  const s2 = run(out.state, { type: "lesson.ended", lessonId: "L-4", reason: "safety", minutes: 1 }, ist("2026-10-05", "16:42"));
  assert.ok(!s2.commands.some((c) => c.kind === "enqueue"));
  assert.ok(s2.blocked.some((b) => b.guard === "safety" && b.reason === "safety_hold"));
  assert.equal(s2.state.mode, "safety_hold", "a lesson end never clears a hold");
  // only the protocol clears it, and only for the same incident
  const wrong = run(s2.state, { type: "safety.cleared", incidentId: "inc-other", by: "human-1" }, ist("2026-10-05", "17:00"));
  assert.equal(wrong.state.mode, "safety_hold");
  const ok = run(s2.state, { type: "safety.cleared", incidentId: "inc-1", by: "human-1" }, ist("2026-10-05", "17:00"));
  assert.equal(ok.state.mode, "free");
  assert.equal(ok.state.hold, undefined);
});

test("consent revoked: queued jobs of that purpose are cancelled; consentGuard drops new ones", () => {
  let s = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  s = run(s, { type: "lesson.ended", lessonId: "L-5", reason: "completed", minutes: 20 }, ist("2026-10-05", "16:40")).state;
  const out = run(s, { type: "parent.consent_changed", purpose: "memory", granted: false, consentVersion: 2 }, ist("2026-10-05", "16:41"));
  assert.ok(out.commands.some((c) => c.kind === "cancel" && c.jobKind === "memory.consolidate"));
  const next = run(out.state, { type: "lesson.ended", lessonId: "L-6", reason: "completed", minutes: 5 }, ist("2026-10-05", "17:10"));
  assert.ok(!next.commands.some((c) => c.kind === "enqueue"));
  assert.ok(next.blocked.some((b) => b.guard === "consent" && b.reason === "consent:memory"));
  assert.equal(next.state.pending.jobs["memory.consolidate:L-6"], undefined, "a dropped job is not pending");
  // core_tutoring revoked → a rest day
  const core = run(out.state, { type: "parent.consent_changed", purpose: "core_tutoring", granted: false, consentVersion: 3 }, ist("2026-10-05", "17:11"));
  assert.equal(core.commands.find((c) => c.kind === "plan.adopt").plan.mode, "rest_day");
});

test("parent.pause → paused + pause_end timer; mid-lesson it waits for the lesson to end; resume → free", () => {
  let s = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  const until = "2026-10-07T00:00:00.000Z";
  let out = run(s, { type: "parent.pause", until }, ist("2026-10-05", "16:15"));
  assert.equal(out.state.mode, "paused");
  assert.ok(out.commands.some((c) => c.kind === "wakeup" && c.reason === "pause_end" && c.at === until));
  assert.equal(out.commands.find((c) => c.kind === "plan.adopt").plan.mode, "rest_day");
  assert.equal(run(out.state, { type: "parent.resume" }, ist("2026-10-05", "16:30")).state.mode, "free");
  // mid-lesson
  s = run(s, { type: "lesson.started", lessonId: "L-7", topicId: "t", kind: "live", lanes: ["tap"] }, ist("2026-10-05", "16:20")).state;
  out = run(s, { type: "parent.pause", until }, ist("2026-10-05", "16:25"));
  assert.equal(out.state.mode, "in_lesson");
  out = run(out.state, { type: "lesson.ended", lessonId: "L-7", reason: "completed", minutes: 10 }, ist("2026-10-05", "16:35"));
  assert.equal(out.state.mode, "paused");
  // pause_end wakeup frees it
  const fin = run(out.state, { type: "clock.wakeup", reason: "pause_end", wakeupId: `pause_end:${until}` }, new Date(until));
  assert.equal(fin.state.mode, "free");
});

test("parent lowers the daily cap: limits apply at once, a live lesson gets brief.refresh, the plan shrinks", () => {
  let s = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  const before = s.plan.slots.reduce((a, x) => a + x.targetMin, 0);
  s = run(s, { type: "lesson.started", lessonId: "L-8", topicId: "t", kind: "live", lanes: ["realtime"] }, ist("2026-10-05", "16:20")).state;
  const ev = { type: "parent.setting_changed", key: "dailyMinutes", value: 10, by: "owner", settingsVersion: 4 };
  assert.equal(isAuthority(s, ev), true, "a lowered limit is an authority event");
  const out = run(s, ev, ist("2026-10-05", "16:22"));
  assert.equal(out.state.limits.dailyMinutes, 10);
  assert.ok(out.commands.some((c) => c.kind === "brief.refresh" && c.lessonId === "L-8"));
  assert.ok(before > 10);
  assert.equal(isAuthority(s, { ...ev, value: 60 }), false, "raising is not");
});

test("budget.threshold narrows realtime to cascade (R10 / governorGuard); the child is never told", () => {
  let s = run(fresh(), { type: "budget.threshold", scope: "child_month", pct: 80 }, ist("2026-10-05", "06:00")).state;
  assert.equal(s.budget.low, true);
  const out = run(s, opened, ist("2026-10-05", "16:10"));
  const lesson = out.commands.find((c) => c.kind === "plan.adopt").plan.slots.find((x) => x.kind === "live_lesson");
  assert.ok(lesson.segments.every((g) => g.laneWanted !== "realtime"));
  assert.ok(lesson.segments.some((g) => g.laneWanted === "cascade"));
  assert.equal(lesson.voiceSecWanted.realtime, undefined);
});

test("night fold: once per learning day; a dormant child (>14 d) is not re-armed (X36), an open re-arms", () => {
  let s = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  const night = { type: "clock.wakeup", reason: "night", wakeupId: "night:2026-10-05" };
  const out = run(s, night, ist("2026-10-06", "02:20"));
  assert.equal(out.state.adapt.foldedDay, "2026-10-05");
  assert.ok(out.commands.some((c) => c.kind === "wakeup" && c.dedupe === "day_start:2026-10-06"));
  const twice = run(out.state, night, ist("2026-10-06", "02:21"));
  assert.ok(twice.rulesFired.includes("fold_night_already"));
  // dormant: last active/open 20 days before the folded day
  s = { ...out.state, counters: { activeDays: [], lastOpenDay: "2026-09-15" }, adapt: { ...out.state.adapt, foldedDay: "2026-10-04" } };
  const d = run(s, { type: "clock.wakeup", reason: "night", wakeupId: "night:2026-10-05" }, ist("2026-10-06", "02:30"));
  assert.ok(d.rulesFired.includes("dormant_not_rearmed"));
  assert.ok(!d.commands.some((c) => c.kind === "wakeup"));
  const back = run(d.state, { ...opened, bootId: "zz" }, ist("2026-10-06", "16:00"));
  assert.ok(back.commands.some((c) => c.kind === "wakeup" && c.reason === "day_start"));
});

test("day_start re-plans only when inputsHash changed (X43)", () => {
  const s = run(fresh(), opened, ist("2026-10-05", "05:10")).state;     // a 05:10 open: plan built before the window
  const out = run(s, { type: "clock.wakeup", reason: "day_start", wakeupId: "day_start:2026-10-05" }, ist("2026-10-05", "05:20"));
  assert.ok(!out.commands.some((c) => c.kind === "plan.adopt"));
  assert.ok(out.rulesFired.some((r) => r.startsWith("plan_unchanged")));
});

test("Sunday is a free day; a parent 'off' override for today is a rest-free day; a holiday rests", () => {
  const sun = run(fresh(), opened, ist("2026-10-04", "11:00"));
  assert.equal(sun.commands.find((c) => c.kind === "plan.adopt").plan.mode, "free_day");
  const hol = run(fresh(), opened, ist("2026-10-05", "16:10"),
    viewOf({ "cal.days": { value: { "2026-10-05": "holiday" }, asOf: "x", src: "calendar", stale: false } }));
  assert.equal(hol.commands.find((c) => c.kind === "plan.adopt").plan.mode, "rest_day");
});

test("test window: lesson why carries the test, the last 2 days have newSkillBudget 0", () => {
  let s = fresh();
  s = run(s, { type: "school.test_announced", subject: "maths", on: "2026-10-07", chapters: ["ch4"], via: "parent" }, ist("2026-10-05", "08:00")).state;
  const out = run(s, opened, ist("2026-10-06", "16:10"));
  const plan = out.commands.find((c) => c.kind === "plan.adopt").plan;
  assert.equal(plan.mode, "test_window");
  const l = plan.slots.find((x) => x.kind === "live_lesson");
  assert.ok(l.why.some((w) => w.code === "test_window" && w.ref === "maths"));
  assert.equal(l.pace.newSkillBudget, 0);
  assert.deepEqual(plan.splitLevelVsSchool, [30, 70]);
});

test("the recorded view: only keys decide read are recorded; replay serves them and throws on a miss", () => {
  const v = viewOf();
  decide(fresh(), { type: "app.closed", reason: "background" }, { now: ist("2026-10-05", "16:00"), view: v });
  assert.deepEqual(Object.keys(v.recorded()), ["cal.days"]);
  const rv = replayView(v.recorded());
  assert.throws(() => rv.get("kt.dueCount"), ReplayMiss);
});

test("a stale view key never fires a rule (V25): stale due count → no review burst", () => {
  const staleDue = { "kt.dueCount": { value: 9, asOf: "x", src: "fallback", stale: true } };
  const fine = run(fresh(), opened, ist("2026-10-05", "16:10"), viewOf({ "kt.dueCount": { value: 9, asOf: "x", src: "skill_state", stale: false } }));
  const stale = run(fresh(), opened, ist("2026-10-05", "16:10"), viewOf(staleDue));
  const has = (o) => o.commands.find((c) => c.kind === "plan.adopt").plan.slots.some((x) => x.kind === "burst");
  assert.equal(has(fine), true);
  assert.equal(has(stale), false);
});

test("poison: an authority event that throws gets the fail-safe; a non-authority one is quarantined", () => {
  const boom = { get() { throw new Error("view down"); }, recorded: () => ({}) };
  const s = fresh();
  const fs = decideOrFailSafe(s, { type: "safety.incident", incidentId: "i9", severity: "critical", category: "abuse" }, { now: ist("2026-10-05", "16:00"), view: boom });
  assert.equal(fs.state.mode, "safety_hold");
  assert.ok(fs.state.failSafe);
  const q = foldEvent(s, { body: opened }, { now: ist("2026-10-05", "16:00"), view: boom });
  assert.ok(q.quarantined);
  assert.equal(q.state, s, "state unchanged");
});

test("guards never add commands: every kept command was proposed (drop/narrow only)", () => {
  let s = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  s = run(s, { type: "parent.pause", until: "2026-10-08T00:00:00.000Z" }, ist("2026-10-05", "16:11")).state;
  const out = run(s, { type: "lesson.ended", lessonId: "L-9", reason: "completed", minutes: 3 }, ist("2026-10-05", "16:30"));
  // memory.consolidate is allowed while paused (§3.2: consolidation and erase only)
  assert.ok(out.commands.some((c) => c.kind === "enqueue" && c.job.kind === "memory.consolidate"));
});

// ───────────── fail-safe is sticky and paged (§3.6) ─────────────
test("fail-safe: paged, sticky (rest plans, no enqueues) until ops.fail_safe_cleared; a fail-safe pause still ends", () => {
  const boom = { get() { throw new Error("view down"); }, recorded: () => ({}) };
  const errs = [];
  const orig = console.error; console.error = (...a) => errs.push(a.join(" "));
  let fs;
  try { fs = decideOrFailSafe(fresh(), { type: "parent.pause", until: "2026-10-05T14:00:00.000Z" }, { now: ist("2026-10-05", "16:00"), view: boom }); }
  finally { console.error = orig; }
  assert.ok(errs.some((e) => /FAIL-SAFE/.test(e)), "ops is paged");
  assert.equal(fs.state.mode, "paused");
  const pe = fs.commands.find((c) => c.kind === "wakeup" && c.reason === "pause_end");
  assert.ok(pe, "the fail-safe pause arms pause_end");
  assert.equal(pe.at, "2026-10-05T14:00:00.000Z");
  // the pause ends normally, but the actor stays conservative: rest plan, enqueue dropped
  const o = run(fs.state, { type: "clock.wakeup", reason: "pause_end", wakeupId: pe.dedupe }, ist("2026-10-05", "19:31"));
  assert.equal(o.state.mode, "free");
  const adopt = o.commands.find((c) => c.kind === "plan.adopt");
  assert.equal(adopt.plan.mode, "rest_day");
  assert.ok(o.blocked.some((b) => b.guard === "failSafe"));
  const le = run(o.state, { type: "lesson.ended", lessonId: "L-fs", reason: "completed", minutes: 3 }, ist("2026-10-05", "19:40"));
  assert.ok(!le.commands.some((c) => c.kind === "enqueue"), "no work queued while fail-safe");
  // an operator clears it → a normal plan again
  const cl = run(le.state, { type: "ops.fail_safe_cleared", by: "ops", ticket: "T-1" }, ist("2026-10-05", "19:45"));
  assert.equal(cl.state.failSafe, undefined);
  assert.equal(cl.commands.find((c) => c.kind === "plan.adopt")?.plan.mode, "school_day", "normal planning resumes");
  assert.ok(cl.commands.some((c) => c.kind === "audit" && c.code === "fail_safe_cleared:T-1"));
});

test("fail-safe limits are validated, clamped and never loosened", () => {
  const boom = { get() { throw new Error("view down"); }, recorded: () => ({}) };
  const orig = console.error; console.error = () => {};
  try {
    const ctx = { now: ist("2026-10-05", "16:00"), view: boom };
    const st = fresh();                                                      // dailyMinutes 30
    assert.equal(decideOrFailSafe(st, { type: "parent.setting_changed", key: "dailyMinutes", value: "07:00", by: "owner", settingsVersion: 1 }, ctx).state.limits.dailyMinutes, 10, "NaN → the floor");
    assert.equal(decideOrFailSafe(st, { type: "parent.setting_changed", key: "dailyMinutes", value: 5, by: "owner", settingsVersion: 1 }, ctx).state.limits.dailyMinutes, 10);
    assert.equal(decideOrFailSafe(st, { type: "parent.setting_changed", key: "dailyMinutes", value: 20, by: "owner", settingsVersion: 1 }, ctx).state.limits.dailyMinutes, 20);
    assert.equal(decideOrFailSafe(st, { type: "parent.setting_changed", key: "hoursEnd", value: 20, by: "owner", settingsVersion: 1 }, ctx).state.limits.allowedTo, st.limits.allowedTo, "a non-HH:MM value is ignored");
    assert.equal(decideOrFailSafe(st, { type: "parent.pause", until: "2026-10-05T00:00:00.000Z" }, ctx).state.mode, "free", "a pause in the past does nothing");
  } finally { console.error = orig; }
});

test("lowersLimit orders times by the learning day: bedtime 23:30 → 00:15 is later, 21:30 → 21:00 earlier", () => {
  const s = { ...fresh(), routine: { ...fresh().routine, bedtime: "23:30" } };
  assert.equal(isAuthority(s, { type: "parent.setting_changed", key: "bedtime", value: "00:15", by: "owner", settingsVersion: 1 }), false);
  assert.equal(isAuthority(s, { type: "parent.setting_changed", key: "bedtime", value: "21:00", by: "owner", settingsVersion: 1 }), true);
});

// ───────────── replay has no write path (I-R9) ─────────────
test("replay: loads through a reader that a write-counting shim proves issues 0 writes, and reproduces the log", async () => {
  const { replay, writeCountingReader } = await import("../server/conductor/step.js");
  const { logForm } = await import("../server/conductor/commit.js");
  const s0 = fresh();
  const now = ist("2026-10-05", "16:10");
  const view = viewOf();
  const out = foldEvent(s0, { body: opened }, { now, view });
  const rows = {
    decision_log: [{ version: 0, now_used: now.toISOString(), from_seq: 0, to_seq: 0, brief_digest: null, commands: [{ kind: "audit", code: "actor_created", state: s0 }] },
      { version: 1, now_used: now.toISOString(), from_seq: 0, to_seq: 1, brief_digest: "d1", commands: JSON.parse(JSON.stringify(out.commands.map(logForm))) }],
    student_event: [{ seq: 1, type: "app.opened", body: opened }],
    brief_snapshot: [{ digest: "d1", value: view.recorded() }],
    conductor_state: [{ state: JSON.parse(JSON.stringify(out.state)) }],
  };
  const inner = { q: async (text) => rows[text.match(/from (\w+)/)[1]] };
  const shim = writeCountingReader(inner);
  const r = await replay(CHILD, { reader: shim });
  assert.deepEqual(r.mismatches, []);
  assert.equal(shim.writes, 0);
  assert.equal(shim.reads, 4);
  // negative control: the shim does count writes
  const ctl = writeCountingReader({ q: async () => [] });
  for (const t of ["insert into job values (1)", "update conductor_state set x = 1", "select ingest_event($1)", "select * from job for update skip locked"]) await ctl.q(t);
  assert.equal(ctl.writes, 4);
});

test("crashed client + pending pause: the stale-lesson close applies the pause, and pause_end frees the child", () => {
  // review conductor-m0 #1: the clock close used to set paused without pauseUntil, so pause_end no-oped forever
  let s = run(fresh(), opened, ist("2026-10-05", "15:25")).state;
  s = run(s, { type: "lesson.started", lessonId: "L-crash", topicId: "t", kind: "live", lanes: ["tap"] }, new Date("2026-10-05T10:01:00Z")).state;
  const until = "2026-10-05T11:00:00.000Z";
  s = run(s, { type: "parent.pause", until }, new Date("2026-10-05T10:05:00Z")).state;
  assert.equal(s.mode, "in_lesson");
  assert.equal(s.pendingPause, until);
  // the client never sends lesson.ended; the next event arrives > 3 h later, after the pause is already over
  const late = run(s, { type: "app.closed" }, new Date("2026-10-05T14:30:00Z"));
  assert.equal(late.state.mode, "free", "a pause that already ended lapses");
  assert.equal(late.state.pendingPause, undefined);
  assert.equal(late.state.pauseUntil, undefined);
  // and when the pause is still running at the clock close, it becomes the real pause that pause_end ends
  const until2 = "2026-10-05T16:00:00.000Z";
  s = run(s, { type: "parent.pause", until: until2 }, new Date("2026-10-05T10:06:00Z")).state;
  const close = run(s, { type: "app.closed" }, new Date("2026-10-05T14:30:00Z"));
  assert.equal(close.state.mode, "paused");
  assert.equal(close.state.pauseUntil, until2);
  assert.equal(close.state.pendingPause, undefined);
  const fin = run(close.state, { type: "clock.wakeup", reason: "pause_end", wakeupId: `pause_end:${until2}` }, new Date(until2));
  assert.equal(fin.state.mode, "free");
  assert.ok(!fin.rulesFired.includes("pause_end_noop"));
  // the next day is a normal day, not rest_day
  const next = run(fin.state, { ...opened, bootId: "n1" }, ist("2026-10-06", "16:10"));
  assert.notEqual(next.commands.find((c) => c.kind === "plan.adopt").plan.mode, "rest_day");
});

test("day rollover after days away re-arms today's clock even when the first event is not app.opened", () => {
  let s = run(fresh(), opened, ist("2026-10-05", "16:10")).state;
  s = run(s, { type: "lesson.ended", lessonId: "L-x", reason: "completed", minutes: 10 }, ist("2026-10-05", "16:40")).state;
  // four days later the first event is a job result, not an open
  const out = run(s, { type: "job.done", jobId: "1", kind: "memory.consolidate", idemKey: "memory.consolidate:L-x" }, ist("2026-10-09", "12:00"));
  assert.ok(out.rulesFired.includes("fold_night"));
  const wakes = out.commands.filter((c) => c.kind === "wakeup").map((c) => c.dedupe).sort();
  assert.deepEqual(wakes, ["day_start:2026-10-10", "night:2026-10-09", "night:2026-10-10"]);
});

test("V3 uses the month's REMAINING realtime: near-exhausted → the lesson steps down to cascade, never rejected", () => {
  const tier = 600 * 60;
  const view = viewOf({ "usage.voiceSecMonth": { value: { realtime: tier - 30 }, asOf: "x", src: "conductor_usage", stale: false } });
  const out = run(fresh(), opened, ist("2026-10-05", "16:10"), view);
  const adopt = out.commands.find((c) => c.kind === "plan.adopt");
  assert.ok(!out.commands.some((c) => c.kind === "audit" && String(c.code).startsWith("plan.rejected")));
  assert.equal(adopt.plan.voiceBudgetSec.realtime, 0);
  const lesson = adopt.plan.slots.find((x) => x.kind === "live_lesson");
  assert.ok(lesson && lesson.segments.every((g) => g.laneWanted !== "realtime" && g.laneWanted !== "realtime_mini"));
  assert.ok(out.rulesFired.some((r) => r.startsWith("R10")));
  // a fresh month (nothing used) keeps the full tier budget
  const full = run(fresh(), opened, ist("2026-10-05", "16:10"));
  assert.equal(full.commands.find((c) => c.kind === "plan.adopt").plan.voiceBudgetSec.realtime, tier);
});

test("replay of a snapshot recorded before usage.voiceSecMonth existed serves its fallback; other misses still throw", () => {
  const v = replayView({ "kt.dueCount": { value: 0 } });
  assert.deepEqual(v.get("usage.voiceSecMonth").value, {});
  assert.throws(() => v.get("cal.days"), ReplayMiss);
});
