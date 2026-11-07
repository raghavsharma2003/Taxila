// Round 7 F (PARENT-REPORT §2, §5; pipeline item learning-parent-report-sections, batch R1): the monthly report and its
// sections S4 holding up, S6 when it gets hard, S7 curiosity, S9 routine, S13 what's next, S16 fixed copy, plus the
// weekly exam line (S17). Pure: hand-built facts, the real claim builder, renderer, writer and gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dayFacts, SKILLS } from "./fixtures/report-facts.mjs";
import { windowOf } from "../server/reports/facts.js";
import { buildClaims } from "../server/reports/claims.js";
import { renderLang } from "../server/reports/render.js";
import { assemble, laneAOrder } from "../server/reports/writer.js";
import { gateReport } from "../server/reports/gate.js";
import { CAPS, LANGS } from "../server/reports/config.js";

const { A, B, C } = SKILLS;
const at = (day, min = 0) => new Date(Date.parse(`${day}T11:30:00.000Z`) + min * 60_000).toISOString();

/** The fixture child, re-windowed to October 2026, with a check after a two-week gap, hinted answers and kept questions. */
function monthFacts(over = {}) {
  const f = dayFacts({ cadence: "monthly", period: "2026-10", extra: [
    // S4 checks on 10-20: A and B last came up on 10-06, C on 10-05 (≥ 7 days); B's second answer follows the first (not a check)
    { sessionId: "S1", at: at("2026-10-05", 8), skillIds: [C], cls: "teach", outcome: -1, teach: true, itemKey: "" },
    { sessionId: "S3", at: at("2026-10-20", 1), skillIds: [A], cls: "item.open", outcome: 0 },
    { sessionId: "S3", at: at("2026-10-20", 4), skillIds: [C], cls: "item.open", outcome: 0 },
    { sessionId: "S3", at: at("2026-10-20", 2), skillIds: [B], cls: "item.open", outcome: 1 },    // B: hinted, solved (C1); last contact 10-06
    { sessionId: "S3", at: at("2026-10-20", 3), skillIds: [B], cls: "item.open", outcome: 4 },    // hinted, not solved (C4)
  ] });
  f.lessons = [
    { id: "L1", topicId: "c5-maths-ch01-t01", startedAt: at("2026-10-05", 0), endedAt: at("2026-10-05", 20) },
    { id: "L2", topicId: "c5-maths-ch01-t01", startedAt: at("2026-10-06", 0), endedAt: at("2026-10-06", 24) },
    { id: "L3", topicId: "c5-maths-ch02-t02", startedAt: at("2026-10-20", 0), endedAt: at("2026-10-20", 30) },
  ];
  f.jar = [
    { id: "j1", learning: true, createdAt: at("2026-10-05", 10), answeredAt: at("2026-10-06", 2) },
    { id: "j2", learning: true, createdAt: at("2026-10-20", 5), answeredAt: null },
    { id: "j3", learning: false, createdAt: at("2026-10-20", 6), answeredAt: null },   // a share, not a question
  ];
  f.skills[A].nextReviewAt = "2026-11-04T11:30:00.000Z";
  f.skills[B].nextReviewAt = "2026-11-02T11:30:00.000Z";
  f.testWindows = [];
  return Object.assign(f, over);
}
const NOW = "2026-11-01T00:00:00.000Z";

function assembled(facts) {
  const built = buildClaims(facts, { now: NOW });
  const cadence = facts.window.cadence;
  const renders = {};
  for (const L of LANGS) {
    const R = renderLang({ cadence, ...built }, facts.child, L);
    const o = laneAOrder(R.lines, L, cadence);
    R.voice = { order: o.order, text: assemble(o.order, R.lines, L) };
    renders[L] = R;
  }
  return { built, body: { cadence, claims: built.claims, renders } };
}
const bySection = (claims, s) => claims.filter((c) => c.section === s);

test("monthly window: the calendar month, learning days 04:00 → 04:00 local", () => {
  const w = windowOf("monthly", "2026-02", "Asia/Kolkata");
  assert.equal(w.firstDay, "2026-02-01");
  assert.equal(w.lastDay, "2026-02-28");
  assert.equal(w.from, "2026-01-31T22:30:00.000Z");
  assert.throws(() => windowOf("monthly", "2026-13", "Asia/Kolkata"));
});

test("monthly report: header, up to 3 strengths, S4, S6, S7, S9, S13, one home activity; passes the gate in every language", () => {
  const { built, body } = assembled(monthFacts());
  const c = built.claims;
  assert.equal(c[0].shapeId, "header.monthly");
  assert.deepEqual(c[0].slots, { lessons: 3, days: 3, min: 74 });
  assert.ok(bySection(c, "strength").length >= 1 && bySection(c, "strength").length <= CAPS.monthly.strength);
  // S4: A, B (its first answer) and C on 10-20; first-try right: A and C
  assert.deepEqual(bySection(c, "hold")[0].slots, { n: 3, k: 2 });
  // S6: hinted answers in the month: the fixture's C2 (10-05), C4, C4, C3 (10-06) and C1, C4 (10-20); solved: C2 and C1
  assert.deepEqual(bySection(c, "hard")[0].slots, { h: 6, k: 2 });
  // S7: two learning questions kept, one answered; the share is not counted
  const cur = bySection(c, "curious")[0];
  assert.equal(cur.shapeId, "curious.asked");
  assert.deepEqual({ q: cur.slots.q, k: cur.slots.k }, { q: 2, k: 1 });
  assert.deepEqual(cur.factIds.sort(), ["question_jar:j1", "question_jar:j2"]);
  // S9: 3 lesson days of 31, median of 20 / 24 / 30 min
  assert.deepEqual(bySection(c, "routine")[0].slots, { n: 3, d: 31, m: 24 });
  // S13: the earliest re-check still ahead (B on 2 Nov)
  const nx = bySection(c, "next")[0];
  assert.equal(nx.skillId, B);
  assert.deepEqual(nx.slots.date, { y: 2026, m: 11, d: 2 });
  assert.equal(bySection(c, "home").length, 1);
  assert.doesNotThrow(() => gateReport(body, { firstName: "Riya" }));
  // S16 fixed copy once, app-only; the spoken script fits the single-request budget
  for (const L of LANGS) {
    assert.equal(body.renders[L].lines.filter((l) => l.fixedId === "footer.context").length, 1);
    assert.equal(body.renders[L].title.fixedId, "title.monthly");
    assert.ok(body.renders[L].voice.text.length <= 1200);
  }
});

test("monthly: few after-a-gap answers → the 'still learning how it holds up' line; none → no S4; no re-check → the fixed S13 line", () => {
  const few = monthFacts();
  few.events = few.events.filter((e) => !(e.at.startsWith("2026-10-20") && e.skillIds.includes(B)));   // two S4 checks left (A, C)
  const c1 = buildClaims(few, { now: NOW }).claims;
  assert.equal(bySection(c1, "hold")[0].shapeId, "hold.few");
  const none = monthFacts();
  none.events = none.events.filter((e) => !e.at.startsWith("2026-10-20"));
  none.skills[A].nextReviewAt = "2026-10-09T11:30:00.000Z";
  none.skills[B].nextReviewAt = null;
  const b2 = buildClaims(none, { now: NOW });
  assert.equal(bySection(b2.claims, "hold").length, 0);
  assert.equal(b2.fixedNext, true);
  const R = renderLang({ cadence: "monthly", ...b2 }, none.child, "en");
  assert.ok(R.lines.some((l) => l.fixedId === "next.generic" && l.section === "next"));
});

test("weekly in a test window: the exam line (S17) takes one row's place and avoids pressure words", () => {
  const f = dayFacts({ cadence: "weekly", period: "2026-W41" });
  f.testWindows = [{ subject: "maths", from: "2026-10-08", to: "2026-10-12" }];
  const { built, body } = assembled(f);
  const ex = bySection(built.claims, "exam");
  assert.equal(ex.length, 1);
  assert.deepEqual(ex[0].factIds, ["test_window:maths:2026-10-08:2026-10-12"]);
  assert.ok(bySection(built.claims, "row").length <= CAPS.weekly.row - 1);
  assert.doesNotThrow(() => gateReport(body, { firstName: "Riya" }));
  for (const L of LANGS) assert.ok(!/test|exam|परीक्षा|marks/i.test(body.renders[L].lines.find((l) => l.section === "exam").text));
});

test("daily and weekly reports are unchanged by the monthly sections", () => {
  const f = dayFacts({});
  const built = buildClaims(f, {});
  for (const s of ["hold", "hard", "curious", "routine", "next", "exam"]) assert.equal(bySection(built.claims, s).length, 0, s);
});

// ───────────── the independent checker (check.js) on the new shapes ─────────────
import { checkReport } from "../server/reports/check.js";
import { OUTCOMES } from "../server/learner/kt/outcomes.js";

/** A fake db over the same facts, answering check.js's reads by their shape (db row names, raw outcomes). */
function fakeDb(f, { testWindows = [] } = {}) {
  const ev = f.events.map((e) => ({ id: e.id, seq: e.seq, child_id: f.child.id, session_id: e.sessionId, occurred_at: e.at, skill_ids: e.skillIds, cls: e.cls,
    outcome: e.outcome, teach: e.teach, pre_attempt_help: e.preAttemptHelp, entry_rung: e.entryRung, contaminated: e.contaminated, assisted: e.assisted, via: e.via,
    misconception_id: e.misconceptionId, discriminates: e.discriminates, item_key: e.itemKey }));
  const lessons = f.lessons.map((l) => ({ id: l.id, started_at: l.startedAt, ended_at: l.endedAt, state: { did: ["x"] } }));
  const jar = (f.jar ?? []).map((j) => ({ id: j.id, learning: j.learning, created_at: j.createdAt, answered_at: j.answeredAt }));
  const sks = Object.entries(f.skills).map(([id, x]) => ({ skill_id: id, display: x.display, next_review_at: x.nextReviewAt }));
  return { q: async (t, p) => {
    if (/from child c/.test(t)) return [{ id: f.child.id, first_name: f.child.firstName, tz: f.child.tz }];
    if (/conductor_state/.test(t)) return [{ tw: testWindows }];
    if (/from decision_record/.test(t)) return (f.ways ?? []).map((d) => ({ id: d.id, lesson_id: d.lessonId, chosen: d.format }));
    if (/from question_jar/.test(t)) return jar.filter((j) => j.created_at >= p[1] && j.created_at < p[2]);
    if (/from kt_skill_state/.test(t)) return sks.filter((x) => p[1].includes(x.skill_id));
    if (/from lesson/.test(t)) return /any\(\$2/.test(t) ? lessons.filter((l) => p[1].includes(String(l.id))) : lessons.filter((l) => l.started_at >= p[1] && l.started_at < p[2]);
    if (/from kt_evidence/.test(t)) {
      if (/id = any\(\$2/.test(t)) return ev.filter((r) => p[1].includes(r.id));
      if (/\$2 = any\(skill_ids\)/.test(t)) return ev.filter((r) => r.skill_ids.includes(p[1]) && r.occurred_at < p[2]);
      if (/occurred_at >= \$2/.test(t)) return ev.filter((r) => r.occurred_at >= p[1] && r.occurred_at < p[2]);
      if (/occurred_at < \$2/.test(t)) return ev.filter((r) => r.occurred_at < p[1]);
    }
    throw new Error(`fake db: unexpected query ${t.slice(0, 80)}`);
  } };
}
const stored = (f, body) => ({ child_id: f.child.id, cadence: body.cadence, window_from: f.window.from, window_to: f.window.to, claims: body.claims, renders: body.renders,
  created_at: NOW, k7: false });
const lookup = (f) => ({ skillTitle: async (id) => f.titles[id] ?? null, belief: async (id) => f.beliefs[id] ?? null });

test("checker: every monthly claim re-derives from raw rows; a tampered count or a missing row is caught", async () => {
  assert.ok(OUTCOMES["item.open"][1] === "C1");
  const f = monthFacts();
  const { body } = assembled(f);
  const r = await checkReport(fakeDb(f), stored(f, body), lookup(f));
  const bad = r.claims.filter((c) => !c.ok);
  assert.deepEqual(bad, [], JSON.stringify(bad));
  for (const [shape, slot, v] of [["hold.week", "n", 9], ["hard.hint", "h", 1], ["curious.asked", "k", 2], ["routine.days", "m", 99], ["header.monthly", "days", 1]]) {
    const claims = body.claims.map((c) => (c.shapeId === shape ? { ...c, slots: { ...c.slots, [slot]: v } } : c));
    const t = await checkReport(fakeDb(f), stored(f, { ...body, claims }), lookup(f));
    assert.ok(t.claims.some((c) => c.shapeId === shape && !c.ok), `tampered ${shape}.${slot} not caught`);
  }
  const dropped = body.claims.map((c) => (c.shapeId === "curious.asked" ? { ...c, factIds: c.factIds.slice(0, 1) } : c));
  assert.ok((await checkReport(fakeDb(f), stored(f, { ...body, claims: dropped }), lookup(f))).claims.some((c) => c.shapeId === "curious.asked" && !c.ok));
});

test("checker: the exam line needs a parent-entered window overlapping the week", async () => {
  const f = dayFacts({ cadence: "weekly", period: "2026-W41" });
  const tw = [{ subject: "maths", from: "2026-10-08", to: "2026-10-12" }];
  f.testWindows = tw;
  const { body } = assembled(f);
  const ok = await checkReport(fakeDb(f, { testWindows: tw }), stored(f, body), lookup(f));
  assert.ok(ok.claims.find((c) => c.shapeId === "exam.review").ok);
  const gone = await checkReport(fakeDb(f, { testWindows: [] }), stored(f, body), lookup(f));
  assert.equal(gone.claims.find((c) => c.shapeId === "exam.review").ok, false);
});

// ───────────── the Conductor enqueues it ─────────────
import { decide } from "../server/conductor/decide.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView } from "../server/conductor/view.js";

test("the night fold of a month's last learning day enqueues parent.monthly once (idem key per child and month)", () => {
  const live = (value) => ({ value, asOf: "x", src: "t", stale: false });
  const view = () => recordingView({ "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}) });
  const id = "11111111-2222-4333-8444-555555555555";
  const s = { ...initialState({ childId: id, classLevel: 5, now: new Date("2026-10-31T10:00:00Z"), consent: { core_tutoring: true } }), learningDay: "2026-10-31" };
  const out = decide(s, { type: "app.opened", device: "web", replicaId: "r1", bootId: "b1" }, { now: new Date("2026-11-01T10:30:00Z"), view: view() });
  const jobs = out.commands.filter((c) => c.kind === "enqueue").map((c) => c.job);
  const m = jobs.find((j) => j.kind === "parent.monthly");
  assert.ok(m, JSON.stringify(jobs.map((j) => j.kind)));
  assert.equal(m.idemKey, `parent.monthly:${id}:2026-10`);
  assert.deepEqual(m.input, { month: "2026-10" });
  const mid = decide({ ...s, learningDay: "2026-10-14" }, { type: "app.opened", device: "web", replicaId: "r1", bootId: "b1" }, { now: new Date("2026-10-15T10:30:00Z"), view: view() });
  assert.ok(!mid.commands.some((c) => c.kind === "enqueue" && c.job.kind === "parent.monthly"));
});

test("S5 ways: counts of Taxila's own explain choices in the month, held below the minimum, re-derived by the checker", async () => {
  const ways = [["w1", "L1", "F3"], ["w2", "L1", "F2"], ["w3", "L2", "F3"], ["w4", "L3", "F3"], ["w5", "Lx", "F1"]]
    .map(([id, lessonId, format]) => ({ id, lessonId, format, skillId: "s" }));
  const f = monthFacts({ ways });
  const { body } = assembled(f);
  const c = body.claims.find((x) => x.shapeId === "ways.used");
  assert.deepEqual(c.slots, { n: 4, k: 2, way: "F3", t: 3 }, "a decision outside the month's lessons (Lx) is not counted");
  assert.equal(c.factIds.length, 4);
  for (const lang of LANGS) assert.ok(!/\bF[1-8]\b/.test(JSON.stringify(body.renders[lang])), "F-codes never render");
  const r = await checkReport(fakeDb(f), stored(f, body), lookup(f));
  assert.deepEqual(r.claims.filter((x) => !x.ok), []);
  const claims = body.claims.map((x) => (x.shapeId === "ways.used" ? { ...x, slots: { ...x.slots, t: 2 } } : x));
  assert.ok((await checkReport(fakeDb(f), stored(f, { ...body, claims }), lookup(f))).claims.some((x) => x.shapeId === "ways.used" && !x.ok));
  const few = monthFacts({ ways: ways.slice(0, 3) });
  assert.ok(!buildClaims(few, { now: NOW }).claims.some((x) => x.shapeId === "ways.used"), "3 explains are not a pattern");
});
