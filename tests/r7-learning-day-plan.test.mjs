// Round 7 F, learning-conductor-day-plan: the cross-day rules R2, R5 and R9 (server/conductor/adapt.js), their
// planner wiring and validator negative controls. Pure: no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dayKindLookup, learningDay } from "../server/conductor/clock.js";
import { buildPlannerInputs, inputsHash, planDay } from "../server/conductor/planner.js";
import { validatePlan } from "../server/conductor/validate.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView, replayView } from "../server/conductor/view.js";
import { BAND } from "../server/conductor/config.js";
import { foundationShare, lateSittingLatch, prereqPick, wheelSpinView } from "../server/conductor/adapt.js";
import { placementGapOf } from "../server/placement/store.js";

const CHILD = "11111111-2222-4333-8444-555555555555";
const ist = (day, hhmm) => new Date(`${day}T${hhmm}:00+05:30`);
const live = (value, src = "test") => ({ value, asOf: "x", src, stale: false });
const view = (extra = {}) => recordingView({
  "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}),
  "school.subjects": live({ subjects: ["maths"], why: "rotation", timetable: [] }), ...extra,
});
function inputsFor({ classLevel = 7, now = ist("2026-10-05", "16:10"), extra = {}, mut = (s) => s } = {}) {
  const s = mut({ ...initialState({ childId: CHILD, classLevel, now, consent: { core_tutoring: true } }), learningDay: learningDay(now, "Asia/Kolkata") });
  return buildPlannerInputs(s, { now, view: view(extra), cal: dayKindLookup(s.school.dayOverrides, {}) });
}
const lessonOf = (plan) => plan.slots.find((s) => s.kind === "live_lesson");
const rulesOf = (plan) => plan.adapt.rules.map((r) => r.rule);

// ───────────── R2 ─────────────
const close = (localHour, vibeClose) => ({ day: "2026-10-01", localHour, vibeClose, endedBy: "complete", minutes: 20, plannedMin: 20 });

test("R2 latch: on at a .40 late-vs-early gap with ≥ 4 closes each side, off below .20 or with an arm < 4", () => {
  const early = Array.from({ length: 4 }, () => close(17, "fine"));
  const lateBad = [close(20, "tired"), close(20, "strained"), close(21, "fine"), close(20, "fine")];   // 50% bad vs 0%
  assert.equal(lateSittingLatch([...early, ...lateBad], false), true);
  assert.equal(lateSittingLatch([...early, ...lateBad.slice(0, 3)], false), false, "an arm < 4 never latches");
  const lateMild = [close(20, "tired"), close(20, "fine"), close(21, "fine"), close(20, "fine")];      // 25% gap
  assert.equal(lateSittingLatch([...early, ...lateMild], false), false, "below .40 does not switch on");
  assert.equal(lateSittingLatch([...early, ...lateMild], true), true, "but .25 ≥ .20 keeps it on (hysteresis)");
  assert.equal(lateSittingLatch([...early, ...lateBad.map((c) => ({ ...c, vibeClose: "fine" }))], true), false);
});

test("R2 in the plan: a latched child's sitting at or after 20:00 gets exactly the minimum segment set", () => {
  const minSet = BAND.B3.segments.filter((s) => s[3]).reduce((a, s) => a + s[1], 0);
  const late = inputsFor({ now: ist("2026-10-05", "20:00"), mut: (s) => ({ ...s, adapt: { ...s.adapt, lateMinSet: true } }) });
  const { plan } = planDay(late);
  assert.equal(lessonOf(plan).targetMin, minSet);
  assert.ok(rulesOf(plan).includes("R2"));
  assert.deepEqual(validatePlan(plan, late, { childId: CHILD }), []);
  // the same child earlier in the evening: the latch does not shorten it
  const early = inputsFor({ now: ist("2026-10-05", "17:00"), mut: (s) => ({ ...s, adapt: { ...s.adapt, lateMinSet: true } }) });
  assert.ok(lessonOf(planDay(early).plan).targetMin > minSet);
  assert.ok(!rulesOf(planDay(early).plan).includes("R2"));
});

// ───────────── R5 ─────────────
const topics = {
  "c5-maths-ch05-t01": { prerequisites: ["c5-maths-ch03-t01"] },
  "c5-maths-ch03-t01": { prerequisites: ["c4-maths-ch02-t01"] },
  "c4-maths-ch02-t01": { prerequisites: [] },
};
const getTopic = (id) => topics[id];

test("wheelSpinView: ≥ 10 opportunities, the first prerequisite below .4 by depth (≤ 3), unseen prerequisites skipped", () => {
  const rows = [
    { skill_id: "c5-maths-ch05-t01-s1", p_l: 0.3, opp: 12 },
    { skill_id: "c5-maths-ch03-t01-s1", p_l: 0.6, opp: 2 },
    { skill_id: "c4-maths-ch02-t01-s2", p_l: 0.22, opp: 0 },
    { skill_id: "c5-maths-ch04-t01-s1", p_l: 0.2, opp: 9 },
  ];
  assert.deepEqual(wheelSpinView(rows, getTopic), [
    { skillId: "c5-maths-ch05-t01-s1", topicId: "c5-maths-ch05-t01", opp: 12, prereq: { topicId: "c4-maths-ch02-t01", pL: 0.2, depth: 2 } },
  ]);
  assert.deepEqual(wheelSpinView(rows.slice(0, 1), getTopic)[0].prereq, null, "no seen weak prerequisite → nothing to check");
});

const wheel = [{ skillId: "c7-maths-ch05-t01-s1", topicId: "c7-maths-ch05-t01", opp: 11, prereq: { topicId: "c6-maths-ch02-t01", pL: 0.3, depth: 1 } }];

test("R5 in the plan: a wheel-spinning skill with a weak prerequisite gets a prereq check, a why and a firing", () => {
  const inp = inputsFor({ extra: { "kt.wheelSpin": live(wheel, "kt_skill_state") } });
  const { plan } = planDay(inp);
  const l = lessonOf(plan);
  assert.deepEqual(l.prereqCheck, { skillId: "c7-maths-ch05-t01-s1", forTopicId: "c7-maths-ch05-t01", prereqTopicId: "c6-maths-ch02-t01" });
  assert.ok(l.why.some((w) => w.code === "prereq_gap" && w.ref === "c6-maths-ch02-t01"));
  assert.ok(rulesOf(plan).includes("R5"));
  assert.deepEqual(validatePlan(plan, inp, { childId: CHILD }), []);
  // checked 1 day ago → not again (3-day gap)
  const again = inputsFor({ extra: { "kt.wheelSpin": live(wheel) }, mut: (s) => ({ ...s, adapt: { ...s.adapt, prereqChecked: { "c7-maths-ch05-t01-s1": "2026-10-04" } } }) });
  assert.equal(lessonOf(planDay(again).plan).prereqCheck, undefined);
  assert.equal(prereqPick(wheel, ["c7-maths-ch05-t01-s1"]), null);
  // a stale key never fires (V25)
  const stale = inputsFor({ extra: { "kt.wheelSpin": { value: wheel, asOf: null, src: "fallback", stale: true } } });
  assert.equal(lessonOf(planDay(stale).plan).prereqCheck, undefined);
});

// ───────────── R9 ─────────────
test("R9: foundation share min(.6, .2 + .15·gap), halved in a test window; placementGapOf keeps subjects ≥ .5 below", () => {
  assert.equal(foundationShare(0, false), null);
  assert.equal(foundationShare(1, false), 0.35);
  assert.equal(foundationShare(4, false), 0.6);
  assert.equal(foundationShare(4, true), 0.3);
  assert.deepEqual(placementGapOf({ maths: { expected: 4.6, startGE: 3.1 }, science: { expected: 4.6, startGE: 4.4 }, english: { startGE: 2 } }), { maths: 1.5 });
  const inp = inputsFor({ extra: { "learner.placementGap": live({ maths: 2 }, "placement") } });
  const { plan } = planDay(inp);
  assert.equal(lessonOf(plan).foundationShare, 0.5);
  assert.ok(rulesOf(plan).includes("R9"));
  assert.deepEqual(validatePlan(plan, inp, { childId: CHILD }), []);
});

// ───────────── unchanged without evidence; replay ─────────────
test("a child with none of the new evidence plans and hashes exactly as before", () => {
  const base = inputsFor();
  assert.equal(base.adapt.lateMinSet, undefined);
  assert.equal(base.view["kt.wheelSpin"], undefined);
  assert.equal(base.view["learner.placementGap"], undefined);
  assert.equal(inputsHash(base), inputsHash(inputsFor({ extra: { "kt.wheelSpin": live([]) } })));
});

test("old decision snapshots without the new keys replay with their fallbacks (late keys)", () => {
  const r = replayView({ "kt.dueCount": live(0) });
  assert.equal(r.get("kt.wheelSpin").stale, true);
  assert.deepEqual(r.get("learner.placementGap").value, {});
});

// ───────────── validator negative controls ─────────────
test("V15 / V16 / V18 / V20 reject knobs out of bounds, without a firing, re-checked too soon or new skills before a test", () => {
  const inp = inputsFor({ extra: { "kt.wheelSpin": live(wheel), "learner.placementGap": live({ maths: 2 }) } });
  const { plan } = planDay(inp);
  const rules = (p, i = inp) => validatePlan(p, i, { childId: CHILD }).map((x) => x.rule);
  const withSlot = (patch, adapt = plan.adapt) => ({ ...plan, adapt, slots: plan.slots.map((s) => (s.kind === "live_lesson" ? { ...s, ...patch } : s)) });
  assert.ok(rules(withSlot({ foundationShare: 0.8 })).includes("V15"));
  assert.ok(rules(withSlot({}, { rules: [] })).includes("V16"));
  const recent = { ...inp, adapt: { ...inp.adapt, prereqChecked: ["c7-maths-ch05-t01-s1"] } };
  assert.ok(rules(plan, recent).includes("V18"));
  const testSoon = { ...inp, school: { ...inp.school, testWindows: [{ subject: "maths", from: "2026-10-01", to: "2026-10-06", chapters: [5] }] } };
  assert.ok(rules(withSlot({ pace: { newSkillBudget: 1 } }), testSoon).includes("V20"));
});

// ───────────── the fold (decide.js) ─────────────
import { decide } from "../server/conductor/decide.js";
const opened = { type: "app.opened", device: "web", replicaId: "r1", bootId: "b1" };
const freshS = () => initialState({ childId: CHILD, classLevel: 7, now: ist("2026-10-05", "06:00"), consent: { core_tutoring: true, memory: true } });

test("decide: a lesson that ran its prerequisite check records the skill; the night fold expires it after 3 days and latches R2", () => {
  const v = () => view({ "kt.wheelSpin": live(wheel) });
  let s = decide(freshS(), opened, { now: ist("2026-10-05", "16:10"), view: v() }).state;
  const slot = s.plan.slots.find((x) => x.kind === "live_lesson");
  assert.ok(slot.prereqCheck);
  s = decide(s, { type: "lesson.started", lessonId: "L-1", topicId: "c7-maths-ch05-t01", kind: "live", lanes: ["realtime"] }, { now: ist("2026-10-05", "16:20"), view: v() }).state;
  s = decide(s, { type: "lesson.ended", lessonId: "L-1", reason: "completed", minutes: 20, outcomeDigest: { vibeClose: "fine" } }, { now: ist("2026-10-05", "16:45"), view: v() }).state;
  assert.deepEqual(s.adapt.prereqChecked, { "c7-maths-ch05-t01-s1": "2026-10-05" });
  // seed a ring that latches R2, then the next day's open folds the night
  s = { ...s, adapt: { ...s.adapt, closes: [...Array.from({ length: 4 }, () => ({ ...close(17, "fine"), day: "2026-10-05" })),
    ...Array.from({ length: 4 }, () => ({ ...close(20, "tired"), day: "2026-10-05" }))] } };
  const d1 = decide(s, opened, { now: ist("2026-10-06", "16:10"), view: v() });
  assert.equal(d1.state.adapt.lateMinSet, true);
  assert.deepEqual(d1.state.adapt.prereqChecked, { "c7-maths-ch05-t01-s1": "2026-10-05" }, "still inside the 3-day gap");
  assert.equal(d1.state.plan.slots.find((x) => x.kind === "live_lesson").prereqCheck, undefined, "not re-checked the next day");
  const d4 = decide(d1.state, opened, { now: ist("2026-10-09", "16:10"), view: v() });
  assert.equal(d4.state.adapt.prereqChecked, undefined, "expired after 3 days");
});

// ───────────── slot.js: the LessonBrief ─────────────
import { lessonBriefOf, lessonBriefFor } from "../server/conductor/slot.js";

test("lessonBriefOf: the lesson slot's knobs, wrap at the planned length (never past the window), no levels", () => {
  const inp = inputsFor({ extra: { "kt.wheelSpin": live(wheel), "learner.placementGap": live({ maths: 2 }) } });
  const { plan } = planDay(inp);
  const at = ist("2026-10-05", "16:20");
  const b = lessonBriefOf(plan, { version: 3, lessonId: "L-9", at, tz: "Asia/Kolkata", day: "2026-10-05" });
  const slot = lessonOf(plan);
  assert.equal(b.slotId, slot.id);
  assert.equal(b.planVersion, 3);
  assert.equal(b.subject, "maths");
  assert.equal(b.targetMin, slot.targetMin);
  assert.equal(b.wrapAt, new Date(at.getTime() + slot.targetMin * 60_000).toISOString());
  assert.equal(b.opener, "standard_retrieval");
  assert.equal(b.newSkillBudget, 1);
  assert.equal(b.holdNewTopics, false);
  assert.deepEqual(b.prereqCheck, slot.prereqCheck);
  assert.equal(b.foundationShare, 0.5);
  assert.deepEqual(b.adaptTrace, ["R0", "R5", "R9"]);
  assert.equal(b.segments.reduce((a, g) => a + g.minutes, 0), slot.targetMin);
  const keys = JSON.stringify(b).match(/"[A-Za-z]+":/g).join(" ");
  assert.ok(!/"(theta|eta|gap|placementGap|level|ge|sibling\w*)":/i.test(keys), `no level, gap or sibling key in a brief (V26, V30): ${keys}`);
  // with the family's limits on, a start near the window's end wraps at the window end
  const late = lessonBriefOf(plan, { at: ist("2026-10-05", "20:50"), tz: "Asia/Kolkata", day: "2026-10-05", limits: true });
  assert.equal(late.wrapAt, late.hardStopAt);
  // audit LEARN-01: limits off (the default) → no hard stop; a start after the window wraps at its planned length
  const after = ist("2026-10-05", "21:40");
  const free = lessonBriefOf(plan, { at: after, tz: "Asia/Kolkata", day: "2026-10-05" });
  assert.equal(free.hardStopAt, null);
  assert.equal(free.wrapAt, new Date(after.getTime() + slot.targetMin * 60_000).toISOString());
  assert.ok(Date.parse(free.wrapAt) > after.getTime(), "never a wrap time already past at the start");
  assert.equal(lessonBriefOf({ ...plan, slots: [] }, { at, tz: "Asia/Kolkata", day: "2026-10-05" }), null);
});

test("lessonBriefFor: today's latest plan version, or null without one (or on any read error)", async () => {
  const inp = inputsFor();
  const { plan } = planDay(inp);
  const q = async (t) => (/child_routine/.test(t) ? [{ tz: "Asia/Kolkata" }] : /day_plan/.test(t) ? [{ version: 2, plan }] : []);
  const r = await lessonBriefFor(CHILD, { now: ist("2026-10-05", "16:20"), lessonId: "L-1", q });
  assert.equal(r.brief.planVersion, 2);
  assert.equal(r.brief.lessonId, "L-1");
  assert.equal(r.plan, plan);
  assert.equal(r.brief.hardStopAt, null, "no limits row → no clock gate (LEARN-01)");
  const qOn = async (t) => (/child_controls/.test(t) ? [{ limits_on: true }] : q(t));
  assert.ok((await lessonBriefFor(CHILD, { now: ist("2026-10-05", "16:20"), q: qOn })).brief.hardStopAt, "the family's limit on → the window binds");
  assert.equal(await lessonBriefFor(CHILD, { q: async (t) => (/day_plan/.test(t) ? [] : []) }), null);
  assert.equal(await lessonBriefFor(CHILD, { q: async () => { throw new Error("down"); } }), null);
});
