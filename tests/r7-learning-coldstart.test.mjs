// Round 7 F cold-start placement (main 2026-11-07 (c)): onboarding answers → a start per subject with no quiz
// (server/placement/coldstart.js), covert refinement from live θ (store.js refinedResultsOf), the conductor's first-week
// rule R15 (planner.js), the parent's checked placement note (placement/note.js) and the answer merge of the route.
// Pure: no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { coldStartResult, siteOf, refinedStart, settled, firstWeekView, firstWeekRule, PARENT_VIEWS, CHILD_PICKS, SETTLE_SD, WARM_LESSONS, FIRST_WEEK_LESSONS } from "../server/placement/coldstart.js";
import { refinedResultsOf, startGEOf, placementGapOf } from "../server/placement/store.js";
import { placementEvents, siteOf as ledgerSiteOf } from "../server/learner/kt/placement.js";
import { placementClaims, checkPlacementNote, placementNote } from "../server/placement/note.js";
import { mergeAnswers, coldSubjectsFor } from "../server/routes/placement.js";
import { dayKindLookup, learningDay } from "../server/conductor/clock.js";
import { buildPlannerInputs, inputsHash, planDay } from "../server/conductor/planner.js";
import { validatePlan } from "../server/conductor/validate.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView, replayView } from "../server/conductor/view.js";

const DATE = "2026-11-07T10:00:00+05:30";
const at = (C, o = {}) => coldStartResult({ subject: "maths", classLevel: C, date: DATE, ...o });

test("no answer, no estimate: a child known only by class keeps today's start rule (school chapter, then the calendar)", () => {
  assert.equal(at(6), null);
  assert.equal(at(6, { parentView: "unsure" }), null);
  assert.deepEqual(siteOf({ classLevel: 6, date: DATE }).used, ["class"]);
});

test("only a below-level answer sets a start (audit LEARN-07): hard and tricky move it back; fine, easy and okay keep the calendar's", () => {
  for (const C of [1, 3, 5, 6, 8, 9]) {
    const [h, f, e] = ["hard", "fine", "easy"].map((parentView) => at(C, { parentView }));
    const [t, o, y] = ["tricky", "okay", "easy"].map((childPick) => at(C, { childPick }));
    for (const r of [f, e, o, y]) { assert.equal(r.startGE, null, `class ${C}`); assert.equal(r.startRule, "calendar"); assert.ok(r.placement, "still seeds the estimate"); }
    for (const r of [h, t]) assert.ok(r.startGE <= r.expected && r.startGE >= 0, `class ${C} ${r.startGE} vs ${r.expected}`);
    // with a below-level answer, the other answer still orders the start: hard + easy pick sits above hard + tricky pick
    const he = at(C, { parentView: "hard", childPick: "easy" }), ht = at(C, { parentView: "hard", childPick: "tricky" });
    assert.ok(C === 1 ? ht.startGE <= he.startGE : ht.startGE < he.startGE, `class ${C}: ${ht.startGE} ${he.startGE}`);
  }
});

test("the result is a placement row: one site per strand, sd floored at 1.0, read by the ledger and by topic choice", () => {
  const r = at(5, { parentView: "hard", childPick: "tricky" });
  assert.equal(r.source, "onboarding");
  assert.deepEqual(r.used, ["parent_view", "child_pick", "class"]);
  assert.deepEqual(r.answers, { parentView: "hard", childPick: "tricky" });
  const site = r.placement["maths:core"];
  assert.ok(site.sd >= 1.0, "an answer never weighs like evidence");
  const [ev] = placementEvents({ placementId: "p1", completedAt: DATE, result: r });
  assert.deepEqual(ledgerSiteOf(ev), { subject: "maths", strand: "maths:core", mu: site.mu, sd: site.sd });
  assert.equal(startGEOf({ maths: r }).maths, r.startGE);
  assert.ok(placementGapOf({ maths: r }).maths >= 0.5, "a 'hard' answer gives the foundation share (R9)");
});

test("a young child's own pick weighs less (classes 1-2)", () => {
  const young = siteOf({ classLevel: 2, childPick: "tricky", date: DATE }), older = siteOf({ classLevel: 4, childPick: "tricky", date: DATE });
  assert.ok(young.site.sd > older.site.sd);
});

test("covert refinement: the settled live θ replaces the onboarding start; an unsettled one changes nothing", () => {
  const r = at(6, { parentView: "hard" });
  assert.deepEqual(refinedStart(r, null), { startGE: r.startGE, from: "placement" });
  assert.deepEqual(refinedStart(r, { mu: 5.9, sd: SETTLE_SD + 0.2, n_obs: 3 }), { startGE: r.startGE, from: "placement" });
  const st = refinedStart(r, { mu: 5.9, sd: 0.5, n_obs: 2 });
  assert.equal(st.from, "theta");
  assert.ok(st.startGE > r.startGE && st.startGE < 5.9, "a settled θ above the expected level may start the child higher");
  const out = refinedResultsOf({ maths: r, science: at(6, { parentView: "fine" }) }, { maths: { mu: 5.9, sd: 0.5, n_obs: 2 } });
  assert.equal(out.maths.refined, true);
  assert.equal(out.maths.startGE, st.startGE);
  assert.equal(out.science.refined, undefined, "a subject without settled θ is unchanged");
  assert.equal(settled({ mu: 5, sd: 0.65 }), true);
  assert.equal(settled({ mu: 5, sd: 0.9 }), false);
  assert.equal(settled(null), false);
});

test("first week: two warm lessons (success-first, no new skill), then success-first until θ settles, then nothing", () => {
  const r = { maths: at(5, { parentView: "hard" }), evs: { source: "cat", startGE: 3 } };
  const v0 = firstWeekView(r, {}, []);
  assert.deepEqual(v0, { maths: { lessons: 0, settled: false } }, "only onboarding-started subjects");
  assert.deepEqual(firstWeekRule(v0.maths), { successFirst: true, newSkillBudget: 0 });
  const v2 = firstWeekView(r, {}, Array.from({ length: WARM_LESSONS }, () => "c5-maths-ch01-t01"));
  assert.deepEqual(firstWeekRule(v2.maths), { successFirst: true });
  const v3 = firstWeekView(r, { maths: { mu: 4, sd: 0.5 } }, ["c5-maths-ch01-t01", "c5-maths-ch01-t02", "c5-evs-ch01-t01"]);
  assert.equal(firstWeekRule(v3.maths), null, "settled after the warm lessons: no rule");
  const done = firstWeekView(r, { maths: { mu: 4, sd: 0.5 } }, Array.from({ length: FIRST_WEEK_LESSONS }, () => "c5-maths-ch02-t01"));
  assert.deepEqual(done, {}, "settled and past the first week: left out");
});

// ───────────── R15 in the planner ─────────────
const CHILD = "11111111-2222-4333-8444-555555555555";
const ist = (day, hhmm) => new Date(`${day}T${hhmm}:00+05:30`);
const live = (value, src = "test") => ({ value, asOf: "x", src, stale: false });
const view = (extra = {}) => recordingView({
  "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}),
  "school.subjects": live({ subjects: ["maths"], why: "rotation", timetable: [] }), ...extra,
});
function inputsFor(extra = {}) {
  const now = ist("2026-11-09", "16:10");
  const s = { ...initialState({ childId: CHILD, classLevel: 5, now, consent: { core_tutoring: true } }), learningDay: learningDay(now, "Asia/Kolkata") };
  return buildPlannerInputs(s, { now, view: view(extra), cal: dayKindLookup(s.school.dayOverrides, {}) });
}
const lessonOf = (plan) => plan.slots.find((s) => s.kind === "live_lesson");

test("R15: a first-week subject's lesson is success-first with no new skill; validated; absent when the view is empty", () => {
  const inp = inputsFor({ "learner.firstWeek": live({ maths: { lessons: 0, settled: false } }, "placement") });
  const { plan } = planDay(inp);
  const L = lessonOf(plan);
  assert.equal(L.successFirst, true);
  assert.equal(L.pace.newSkillBudget, 0);
  assert.ok(plan.adapt.rules.some((r) => r.rule === "R15" && r.knob === "successFirst"));
  assert.ok(plan.adapt.rules.some((r) => r.rule === "R15" && r.knob === "newSkillBudget"));
  assert.deepEqual(validatePlan(plan, inp, { childId: CHILD }), []);
  const later = lessonOf(planDay(inputsFor({ "learner.firstWeek": live({ maths: { lessons: 3, settled: false } }) })).plan);
  assert.equal(later.successFirst, true);
  assert.equal(later.pace.newSkillBudget, 1);
  const base = inputsFor();
  assert.equal(base.view["learner.firstWeek"], undefined);
  assert.equal(inputsHash(base), inputsHash(inputsFor({ "learner.firstWeek": live({}) })), "an empty view hashes as before");
  assert.equal(lessonOf(planDay(base).plan).successFirst, false);
});

test("old snapshots without learner.firstWeek replay with its fallback (late key)", () => {
  assert.deepEqual(replayView({ "kt.dueCount": live(0) }).get("learner.firstWeek").value, {});
});

// ───────────── the parent's note ─────────────
const CH = { first_name: "Riya", class_level: 5, school_chapter: {} };
function resultsFor(answers) {
  const out = {};
  for (const s of ["maths", "evs"]) {
    const r = coldStartResult({ subject: s, classLevel: CH.class_level, parentView: answers.parentView?.[s], childPick: answers.childPicks?.[s], date: DATE });
    if (r) out[s] = r;
  }
  return out;
}

test("note: every answer combination renders gate-clean in every language and passes its own check", () => {
  for (const pv of PARENT_VIEWS) for (const cp of [...CHILD_PICKS, undefined]) for (const C of [3, 5, 6, 8]) {
    const child = { ...CH, class_level: C };
    const answers = { parentView: { maths: pv }, childPicks: cp ? { maths: cp } : {} };
    const results = { maths: coldStartResult({ subject: "maths", classLevel: C, parentView: pv, childPick: cp, date: DATE }) };
    if (!results.maths) continue;
    const n = placementNote({ child, results, answers, date: DATE });
    assert.deepEqual(n.checked.dropped, [], `${pv}/${cp}/c${C}`);
    assert.ok(n.lines.en.some((l) => l.shapeId === "place.start"));
    assert.equal(n.lines.en.length, n.lines.hi.length);
  }
});

test("note: what we think and what we used, in order; never a level word or a class number", () => {
  const answers = { parentView: { maths: "hard" }, childPicks: { maths: "tricky" } };
  const n = placementNote({ child: CH, results: resultsFor(answers), answers, date: DATE });
  assert.deepEqual(n.lines.en.map((l) => l.shapeId), ["place.start", "place.easier", "place.parent_hard", "place.child_tricky", "place.firstweek"]);
  for (const L of Object.values(n.lines)) for (const l of L) assert.doesNotMatch(l.text, /\bclass \d|behind|on track|level|peeche/i);
});

test("note check: a tampered stored start, a changed answer or a wrong name drops that subject's lines, never shows them", () => {
  const answers = { parentView: { maths: "hard", evs: "fine" }, childPicks: {} };
  const results = resultsFor(answers);
  const bad = { ...results, maths: { ...results.maths, startGE: results.maths.startGE + 1 } };
  const n = placementNote({ child: CH, results: bad, answers, date: DATE });
  assert.ok(!n.lines.en.some((l) => l.subject === "maths"));
  assert.ok(n.lines.en.some((l) => l.subject === "evs"), "the other subject still shows");
  const changed = { ...answers, parentView: { ...answers.parentView, maths: "easy" } };
  assert.ok(checkPlacementNote(placementClaims({ child: CH, results, date: DATE }), { child: CH, results, answers: changed, date: DATE })
    .some((v) => !v.ok && /answers/.test(v.why.join())));
  const claims = placementClaims({ child: CH, results, date: DATE }).map((c) => (c.slots.name ? { ...c, slots: { ...c.slots, name: "Aman" } } : c));
  assert.ok(checkPlacementNote(claims, { child: CH, results, answers, date: DATE }).some((v) => !v.ok && /name/.test(v.why.join())));
  assert.deepEqual(placementNote({ child: CH, results: {}, answers: {}, date: DATE }).lines.en, [], "no answers, no note");
});

test("route merge: only the class's subjects and known values; 'unsure' clears a parent view; absent subjects keep theirs", () => {
  assert.ok(coldSubjectsFor(5).includes("evs") && !coldSubjectsFor(5).includes("science"));
  assert.ok(coldSubjectsFor(7).includes("science") && !coldSubjectsFor(7).includes("evs"));
  const m = mergeAnswers({ parentView: { maths: "hard", english: "fine" } }, { parentView: { maths: "unsure", evs: "easy", science: "hard", art: "fine" }, childPicks: { maths: "tricky", evs: "loud" } }, 5);
  assert.deepEqual(m, { parentView: { english: "fine", evs: "easy" }, childPicks: { maths: "tricky" } });
});

test("the offline sim runs on the real θ engine and onboarding answers settle no slower than the class rule (model children)", () => {
  const out = join(mkdtempSync(join(tmpdir(), "coldstart-")), "o.json");
  execFileSync(process.execPath, ["evals/placement-coldstart/sim.mjs", "--n", "40", "--lessons", "12", "--out", out], { stdio: "pipe" });
  const { rows } = JSON.parse(readFileSync(out, "utf8"));
  const row = (cond) => rows.find((r) => r.pop === "model" && r.answers === "model" && r.cond === cond);
  assert.ok(row("onboarding").high1 < row("class").high1, "fewer too-hard first lessons");
  assert.ok(row("onboarding").err5 < row("class").err5, "closer by lesson 5");
});
