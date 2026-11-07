// Round 7 F batch R2 (PARENT-REPORT §2, §5 S14, §4.3 RP-D6): the term report. The monthly sections over a term, plus
// Then → now (a row only when a skill's first-try rate ROSE between the term's first and last full months, by the
// pre-declared rule) and the still-learning count. Pure: hand-built facts, the real builder, renderer, writer, gate and
// the independent checker over a fake db; the Conductor enqueue on the term's last night fold.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dayFacts, SKILLS } from "./fixtures/report-facts.mjs";
import { isTermEnd, termOf, windowOf } from "../server/reports/facts.js";
import { buildClaims } from "../server/reports/claims.js";
import { renderLang } from "../server/reports/render.js";
import { assemble, laneAOrder } from "../server/reports/writer.js";
import { gateReport } from "../server/reports/gate.js";
import { checkReport } from "../server/reports/check.js";
import { CAPS, LANGS } from "../server/reports/config.js";
import { betaGreater, monthsApart, pRose } from "../server/reports/stats.js";
import { HOW } from "../server/reports/templates.js";
import { bannedHits, lockedHits } from "../server/reports/lexicon.js";

const { A, B, C } = SKILLS;
const at = (day, min = 0) => new Date(Date.parse(`${day}T11:30:00.000Z`) + min * 60_000).toISOString();
const NOW = "2027-04-01T06:00:00.000Z";
/** n answers on a skill in one session on one day, the first `right` of them first-try right (C0), the rest C4. */
const answers = (sessionId, day, skill, n, right) => Array.from({ length: n }, (_, i) => ({ sessionId, at: at(day, 30 + i), skillIds: [skill], cls: "item.open", outcome: i < right ? 0 : 4 }));

/** Term 2026-T2 (Oct 2026 – Mar 2027). A: Oct 3/12 → Dec 11/12 (a clear rise). B: Oct and Nov only (one month apart: no
 *  comparison). C: Oct 8/10 → Jan 5/10 (a fall: never a row). */
function termFacts() {
  const f = dayFacts({ cadence: "term", period: "2026-T2", extra: [
    ...answers("S1", "2026-10-05", A, 8, 0),          // A in October: the fixture's 4 (3 first-try) + 8 wrong = 3 of 12
    ...answers("S2", "2026-10-06", B, 6, 0),          // B in October: the fixture's 4 (1 first-try) + 6 wrong = 1 of 10
    ...answers("S2", "2026-10-06", C, 10, 8),
    ...answers("S4", "2026-11-10", B, 10, 4),
    ...answers("S5", "2026-12-08", A, 12, 11),
    ...answers("S6", "2027-01-12", C, 10, 5),
  ] });
  f.lessons = [["L1", "S1", "2026-10-05"], ["L2", "S2", "2026-10-06"], ["L4", "S4", "2026-11-10"], ["L5", "S5", "2026-12-08"], ["L6", "S6", "2027-01-12"]]
    .map(([id, , day]) => ({ id, topicId: "c5-maths-ch01-t01", startedAt: at(day, 0), endedAt: at(day, 50) }));
  for (const e of f.events) e.sessionId = { S1: "L1", S2: "L2", S4: "L4", S5: "L5", S6: "L6" }[e.sessionId];
  f.jar = []; f.ways = []; f.testWindows = [];
  return f;
}

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

test("term window and naming: T1 Apr-Sep, T2 Oct-Mar (named by its first year); the last day of each is a term end", () => {
  const t2 = windowOf("term", "2026-T2", "Asia/Kolkata");
  assert.deepEqual([t2.firstDay, t2.lastDay], ["2026-10-01", "2027-03-31"]);
  assert.equal(t2.from, "2026-09-30T22:30:00.000Z");
  const t1 = windowOf("term", "2027-T1", "Asia/Kolkata");
  assert.deepEqual([t1.firstDay, t1.lastDay], ["2027-04-01", "2027-09-30"]);
  assert.throws(() => windowOf("term", "2026-T3", "Asia/Kolkata"));
  assert.deepEqual(["2026-04-01", "2026-09-30", "2026-10-01", "2027-03-31"].map(termOf), ["2026-T1", "2026-T1", "2026-T2", "2026-T2"]);
  assert.deepEqual(["2026-09-30", "2027-03-31", "2026-10-31"].map(isTermEnd), [true, true, false]);
  assert.equal(monthsApart("2026-11", "2027-01"), 2);
});

test("P(now > then) is exact: symmetric, 1/2 for equal evidence, and agrees with a seeded Monte Carlo", () => {
  assert.ok(Math.abs(pRose(0, 0, 0, 0) - 0.5) < 1e-12);
  assert.ok(Math.abs(pRose(3, 10, 3, 10) - 0.5) < 1e-9);
  assert.ok(Math.abs(pRose(2, 9, 6, 11) + pRose(6, 11, 2, 9) - 1) < 1e-9);
  // Beta sampling by order statistics of uniforms (integer parameters): Beta(a, b) = the a-th smallest of a+b−1 uniforms
  let s = 7; const u = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const beta = (a, b) => { const xs = Array.from({ length: a + b - 1 }, u).sort((x, y) => x - y); return xs[a - 1]; };
  for (const [a1, b1, a2, b2] of [[4, 10, 12, 2], [2, 9, 6, 5], [5, 5, 7, 4]]) {
    let w = 0; const N = 20000;
    for (let i = 0; i < N; i++) if (beta(a2, b2) > beta(a1, b1)) w++;
    assert.ok(Math.abs(w / N - betaGreater(a1, b1, a2, b2)) < 0.015, `${[a1, b1, a2, b2]}: mc ${w / N} vs ${betaGreater(a1, b1, a2, b2)}`);
  }
});

test("term report: Then → now only for the clear rise; the fall and the one-month gap are counted as still learning; gate passes", () => {
  const f = termFacts();
  const { built, body } = assembled(f);
  const c = built.claims;
  assert.equal(c[0].shapeId, "header.term");
  const ch = c.filter((x) => x.section === "change");
  assert.equal(ch.length, 1);
  assert.equal(ch[0].skillId, A);
  assert.deepEqual(ch[0].slots, { skill: f.titles[A], m1: { y: 2026, m: 10 }, n1: 12, k1: 3, m2: { y: 2026, m: 12 }, n2: 12, k2: 11 });
  assert.equal(ch[0].factIds.length, 24);
  const still = c.find((x) => x.section === "still");
  assert.deepEqual(still.slots, { n: 2 }, "B (no two full months 2 apart) and C (fell) are still learning");
  assert.ok(c.filter((x) => x.section === "change").length <= CAPS.term.change);
  gateReport(body, { firstName: f.child.firstName });
  for (const L of LANGS) {
    const R = body.renders[L];
    assert.equal(R.title.fixedId, "title.term");
    assert.ok(R.lines.some((l) => l.fixedId === "footer.context"), "S16 once per term report");
    assert.ok(R.lines.some((l) => l.section === "next"), "S13 required");
    const row = R.lines.find((l) => l.section === "change").text;
    assert.match(row, /12/);
    assert.ok(!/improv|better|behtar|sabse|सबसे/i.test(row), row);
  }
  assert.match(body.renders.en.lines.find((l) => l.section === "change").text, /in Oct, 3 of 12 .* in Dec, 11 of 12\.$/);
});

test("S14 copy: HOW lines pass the full lexicon and the locked list", () => {
  for (const id of ["change.row", "still.count", "header.term", "header.zero_term", "routine.days_term", "ways.used_term"]) for (const L of LANGS) {
    assert.ok(HOW[id]?.[L], `${id}/${L}`);
    assert.deepEqual([...bannedHits(HOW[id][L]), ...lockedHits(HOW[id][L])], [], `${id}/${L}`);
  }
});

test("Then → now holds back a rise that is too small or too uncertain", () => {
  // A: Oct 3/12 → Dec 5/12: a rise of 0.17 (< 0.2)
  const f = termFacts();
  const dec = f.events.filter((e) => e.sessionId === "L5");
  dec.forEach((e, i) => { e.outcome = i < 5 ? 0 : 4; });
  assert.ok(!buildClaims(f, { now: NOW }).claims.some((x) => x.section === "change"));
  // P too low: 1 of 10 → 4 of 10 is a rise of 0.3 but P(now > then) ≈ .93 (< .95)
  assert.ok(pRose(1, 10, 4, 10) < 0.95 && 0.4 - 0.1 >= 0.2);
});

// ───────────── the independent checker on the term shapes ─────────────
function fakeDb(f) {
  const ev = f.events.map((e) => ({ id: e.id, seq: e.seq, child_id: f.child.id, session_id: e.sessionId, occurred_at: e.at, skill_ids: e.skillIds, cls: e.cls,
    outcome: e.outcome, teach: e.teach, pre_attempt_help: e.preAttemptHelp, entry_rung: e.entryRung, contaminated: e.contaminated, assisted: e.assisted, via: e.via,
    misconception_id: e.misconceptionId, discriminates: e.discriminates, item_key: e.itemKey }));
  const lessons = f.lessons.map((l) => ({ id: l.id, started_at: l.startedAt, ended_at: l.endedAt, state: { did: ["x"] } }));
  const sks = Object.entries(f.skills).map(([id, x]) => ({ skill_id: id, display: x.display, next_review_at: x.nextReviewAt }));
  return { q: async (t, p) => {
    if (/from child c/.test(t)) return [{ id: f.child.id, first_name: f.child.firstName, tz: f.child.tz }];
    if (/from decision_record/.test(t)) return [];
    if (/from question_jar/.test(t)) return [];
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
const stored = (f, body) => ({ child_id: f.child.id, cadence: body.cadence, window_from: f.window.from, window_to: f.window.to, claims: body.claims, renders: body.renders, created_at: NOW, k7: false });
const lookup = (f) => ({ skillTitle: async (id) => f.titles[id] ?? null, belief: async (id) => f.beliefs[id] ?? null });

test("checker: every term claim re-derives from raw rows; a tampered month, count or cited set is caught", async () => {
  const f = termFacts();
  const { body } = assembled(f);
  const r = await checkReport(fakeDb(f), stored(f, body), lookup(f));
  assert.deepEqual(r.claims.filter((x) => !x.ok), []);
  const tamper = async (shape, fn) => {
    const claims = body.claims.map((x) => (x.shapeId === shape ? fn(x) : x));
    return (await checkReport(fakeDb(f), stored(f, { ...body, claims }), lookup(f))).claims.find((x) => x.shapeId === shape).ok;
  };
  assert.equal(await tamper("change.row", (x) => ({ ...x, slots: { ...x.slots, k1: 2 } })), false);
  assert.equal(await tamper("change.row", (x) => ({ ...x, slots: { ...x.slots, m2: { y: 2026, m: 11 } } })), false);
  assert.equal(await tamper("change.row", (x) => ({ ...x, factIds: x.factIds.slice(1) })), false);
  assert.equal(await tamper("still.count", (x) => ({ ...x, slots: { n: 3 } })), false);
  // a "fall" dressed as a row: C's months fail the rise rule
  assert.equal(await tamper("change.row", (x) => ({ ...x, skillId: C })), false);
});

// ───────────── the Conductor enqueues it ─────────────
import { decide } from "../server/conductor/decide.js";
import { initialState } from "../server/conductor/state.js";
import { recordingView } from "../server/conductor/view.js";
import { JOB_KINDS } from "../server/conductor/config.js";

test("the night fold of a term's last learning day enqueues parent.term once (idem key per child and term)", () => {
  assert.ok(JOB_KINDS["parent.term"]);
  const live = (value) => ({ value, asOf: "x", src: "t", stale: false });
  const view = () => recordingView({ "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}) });
  const id = "11111111-2222-4333-8444-555555555555";
  const fold = (day, now) => {
    const s = { ...initialState({ childId: id, classLevel: 5, now: new Date(`${day}T10:00:00Z`), consent: { core_tutoring: true } }), learningDay: day };
    return decide(s, { type: "app.opened", device: "web", replicaId: "r1", bootId: "b1" }, { now: new Date(now), view: view() }).commands
      .filter((c) => c.kind === "enqueue" && c.job.kind === "parent.term").map((c) => c.job);
  };
  const t2 = fold("2027-03-31", "2027-04-01T10:30:00Z");
  assert.equal(t2.length, 1);
  assert.equal(t2[0].idemKey, `parent.term:${id}:2026-T2`);
  assert.deepEqual(t2[0].input, { term: "2026-T2" });
  assert.deepEqual(fold("2026-09-30", "2026-10-01T10:30:00Z").map((j) => j.input.term), ["2026-T1"]);
  assert.deepEqual(fold("2026-10-30", "2026-10-31T10:30:00Z"), []);
});
