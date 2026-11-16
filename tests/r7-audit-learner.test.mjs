// Whole-project audit 2026-11-09, learner area (docs/design/round7/audit/learner.md): LEARN-21, 24, 27, 31, 38, 48, 53, one
// block per fix, each failing before its fix (the other fixes have their own r7-audit-*.test.mjs files). Pure: no database.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../server/conductor/state.js";
import { decide } from "../server/conductor/decide.js";
import { recordingView } from "../server/conductor/view.js";
import { lessonBriefOf, lessonBriefFor } from "../server/conductor/slot.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const TZ = "Asia/Kolkata";
const ist = (s) => new Date(`${s}+05:30`);
const CHILD = "11111111-1111-4111-8111-111111111111";
/** Today's plan as the Conductor adopts it at the 05:20 day start. */
function planFor(classLevel, day = "2026-11-10") {
  const s = initialState({ childId: CHILD, classLevel, now: ist(`${day}T05:20:00`), consent: { core_tutoring: true } });
  const ev = { type: "clock.wakeup", reason: "day_start", wakeupId: `day_start:${day}` };
  return decide(s, ev, { now: ist(`${day}T05:20:00`), view: recordingView({}) }).commands.find((c) => c.kind === "plan.adopt").plan;
}
/** The first child turn's move of a lesson that starts `at` carrying `brief`. */
function firstMove(at, brief) {
  const K = kit(), now = at.getTime();
  const ctx = { ...CTX, ...(brief ? { lessonBrief: { wrapAt: brief.wrapAt ?? null, hardStopAt: brief.hardStopAt ?? null } } : {}) };
  const r0 = step(initLessonState({ topicId: K.topicId, kit: K, ctx, seed: 3, now }), { event: "start", kit: K, now });
  return step(r0.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: now + 20_000 }).move.kind;
}


// ───────────── parent notes (server/reports) ─────────────
const { previewReport, generateReport } = await import("../server/reports/index.js");
const { listReports } = await import("../server/reports/store.js");
const RCHILD = { id: "c1", first_name: "Riya", class_level: 4, language_pref: "english", guardian_id: "g1", tz: "Asia/Kolkata", bedtime: null };
const lessonRow = (id, day, min) => ({ id, topic_id: "c4-maths-01-a", started_at: new Date(`${day}T11:00:00Z`), ended_at: new Date(Date.parse(`${day}T11:00:00Z`) + min * 60000) });
let rseq = 0;
const ktRow = (sid, day, skill, c, outcome) => ({ id: `${sid}:${++rseq}:0`, seq: rseq, session_id: sid, occurred_at: new Date(`${day}T11:05:00Z`), skill_ids: [skill], cls: c, outcome,
  grader: "code", item_key: `i${rseq}`, teach: false, pre_attempt_help: false, entry_rung: 0, misconception_id: null, discriminates: null, via: null, contaminated: false, assisted: null });
const reportDb = ({ lessons = [], ev = [], skills = [] } = {}) => ({ q: async (text, p) => {
  if (/from child c left join/.test(text)) return [RCHILD];
  if (/from consent/.test(text)) return [{ purpose: "core_tutoring", granted: true }];
  if (/from lesson l/.test(text)) return lessons.filter((l) => l.started_at >= new Date(p[1]) && l.started_at < new Date(p[2]));
  if (/from kt_evidence/.test(text)) return ev;
  if (/from kt_skill_state/.test(text)) return skills.map((s) => ({ skill_id: s, display: "practising", next_review_at: null, refresh: false }));
  return [];
} });
const linesOf = (o) => o.report.renders.en.lines.filter((l) => !l.voiceOnly);





// ───────────── the ledger's mix-ups (server/learner/live.js) ─────────────
const live = await import("../server/learner/live.js");
const { fuseEvidence, newLearnerState } = await import("../server/comprehension/index.js");
const { misP } = await import("../server/learner/kt/misconception.js");


// ───────────── Conductor slot, re-teach resolution, weave queue ─────────────
describe("LEARN-21: only a lesson takes today's lesson slot", () => {
  const wheel = [{ skillId: "c5-maths-ch03-t01-s1", topicId: "c5-maths-ch03-t01", opp: 12, prereq: { topicId: "c4-maths-ch02-t01", pL: 0.2, depth: 1 } }];
  const view = () => recordingView({ "kt.wheelSpin": { value: wheel, asOf: null, src: "kt_skill_state", stale: false } });
  const run = (s, ev, at) => decide(s, ev, { now: ist(at), view: view() });
  function day(kind) {
    let o = run(initialState({ childId: CHILD, classLevel: 5, now: ist("2026-11-10T16:00:00"), consent: { core_tutoring: true } }),
      { type: "app.opened", device: "web", replicaId: "lesson", bootId: "d2026-11-10" }, "2026-11-10T16:00:00");
    const slot = o.commands.find((c) => c.kind === "plan.adopt").plan.slots.find((x) => x.kind === "live_lesson");
    o = run(o.state, { type: "lesson.started", lessonId: "x-1", topicId: "c5-evs-ch01-t01", ...(kind ? { kind } : {}), lanes: ["tap"] }, "2026-11-10T16:01:00");
    o = run(o.state, { type: "lesson.ended", lessonId: "x-1", reason: "completed", minutes: 2 }, "2026-11-10T16:03:00");
    return { slot, plan: o.state.plan, adapt: o.state.adapt };
  }
  test("a homework (Ask) or practice start leaves the slot unstarted and the prerequisite check not run", () => {
    for (const kind of ["homework", "practice"]) {
      const d = day(kind);
      assert.ok(d.slot.prereqCheck, "the slot carries a prerequisite check");
      assert.deepEqual(d.plan.startedSlotIds, [], kind);
      assert.deepEqual(d.plan.doneSlotIds, [], kind);
      assert.deepEqual(d.adapt.prereqChecked ?? {}, {}, kind);
    }
  });
  test("a lesson (kind live, or none) still takes it and marks the check run", () => {
    for (const kind of ["live", undefined]) {
      const d = day(kind);
      assert.deepEqual(d.plan.doneSlotIds, [d.slot.id]);
      assert.equal(d.adapt.prereqChecked[d.slot.prereqCheck.skillId], "2026-11-10");
    }
  });
});

const RES = await import("../server/comprehension/resolve.js");
const { weaveStmts } = await import("../server/comprehension/store.js");
const WEAVE = await import("../server/comprehension/weave.js");

describe("LEARN-27: a re-teach nobody answered after is not a failed method", () => {
  const row = { id: 1, skill_id: "c5-maths-ch02-t01-s1", session_id: "L1", misconception_id: null, arm_id: "gen:pictorial", rep_class: "pictorial", at: "2026-10-08T10:00:00Z", outcome: null, reward: null, rewarded_at: null };
  const now = Date.parse("2026-11-09T10:00:00Z");
  test("no graded answer for 32 days: closed with no outcome and no reward", () => {
    const r = RES.resolveAttempts([row], [], { now, band: "B3" });
    assert.equal(r.updates.length, 1);
    assert.deepEqual({ outcome: r.updates[0].outcome, reward: r.updates[0].reward, final: r.updates[0].final }, { outcome: null, reward: null, final: true });
    assert.ok(!r.attempts.some((a) => a.outcome === "failed"), "it does not read as a failed class for the child");
  });
  test("a wrong answer in a later lesson is still a failure, and a right one in the lesson still counts", () => {
    const wrong = { id: "e", seq: 5, sessionId: "L2", at: "2026-10-10T10:02:00Z", skillIds: [row.skill_id], cls: "item.open", outcome: 4 };
    assert.equal(RES.resolveAttempts([row], [wrong], { now, band: "B3" }).updates[0].outcome, "failed");
    const right = { id: "e", seq: 5, sessionId: "L1", at: "2026-10-08T10:02:00Z", skillIds: [row.skill_id], cls: "item.open", outcome: 0 };
    const u = RES.resolveAttempts([row], [right], { now, band: "B3" }).updates[0];
    assert.equal(u.outcome, "repaired_now");
    assert.ok(u.reward > 0);
  });
});

describe("LEARN-48: a weave entry that expired but got no opener slot stays open", () => {
  test("six entries, three opener slots: the three left over are not closed", () => {
    let q = [];
    for (let i = 1; i <= 6; i++) q = WEAVE.enqueue(q, { childId: "c", skillId: `c5-maths-ch0${i}-t01-s1`, anchorAt: "2026-11-01T10:00:00Z" });
    // lesson start 1 (another chapter): nothing is due yet; lesson start 2: all six expire, three get an opener slot
    const first = WEAVE.onTopicPlanned(WEAVE.expire(q, "2026-11-03T10:00:00Z"), ["c5-maths-ch09-t01-s1"], "2026-11-03T10:00:00Z").q;
    const now = "2026-11-04T10:00:00Z";
    const e = WEAVE.expire(first, now);
    const checks = WEAVE.planChecks({ q: e, due: [], beliefs: {}, now, openers: 3 });
    assert.equal(checks.consumed.length, 3);
    const { q: planned } = WEAVE.onTopicPlanned(WEAVE.consumeExpired(e, checks.consumed), ["c5-maths-ch09-t01-s1"], now);
    const left = planned.filter((x) => x.status === "expired").map((x) => x.skillId);
    assert.equal(left.length, 3);
    const [close] = weaveStmts({ id: "c", legal_mode: "M1" }, planned);
    assert.match(close.text, /set status='done'/);
    for (const id of left) assert.ok(close.params[1].includes(id), `${id} is kept out of the closing update`);
    for (const id of checks.consumed) assert.ok(!close.params[1].includes(id), `${id} (asked as an opener) is closed`);
  });
});

// ───────────── parent corner routes (server/routes/parent.js) ─────────────
const PARENT = await import("../server/routes/parent.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { engineRow } = await import("../server/reports/truth.js");
const { outcomeIndex } = await import("../server/learner/kt/outcomes.js");
const erow = (c, name, extra = {}) => ({ id: "L1:4:0", seq: 4, session_id: "L1", occurred_at: "2026-11-03T11:05:00Z", skill_ids: ["sA"], cls: c, outcome: outcomeIndex(c, name),
  grader: "code", item_key: "i1", teach: false, pre_attempt_help: false, entry_rung: 0, misconception_id: null, via: null, contaminated: false, assisted: null, ...extra });


describe("LEARN-24: the skill sheet finds the question of a script-walk card", () => {
  const K = kitFromFile(getTopic("c5-maths-ch02-t01"));
  const SK = K.skills[0].id;
  test("an explain beat's question, a check and a remediation follow-up resolve to their authored prompt", async () => {
    const { skillScriptOf } = await import("../server/director/script.js");
    const script = skillScriptOf(K, SK);
    assert.ok(script, "the pilot topic has a walkable script");
    const beat = script.explain.find((b) => b.ask);
    const ask = PARENT.scriptCardOf(K, `script:${SK}:ask:${beat.id}`, "Riya");
    assert.ok(ask.prompt && ask.prompt.length > 5);
    assert.doesNotMatch(ask.prompt, /\{friend/);
    const check = script.checks[0];
    assert.ok(PARENT.scriptCardOf(K, `script:${SK}:${check.id}`).prompt);
    const rem = script.remediation.find((r) => r.then);
    assert.ok(PARENT.scriptCardOf(K, `script:${SK}:then:${rem.targets}`).prompt);
  });
  test("a kit item id, an unknown card and a teach row are not script cards", () => {
    assert.equal(PARENT.scriptCardOf(K, K.items[0].id), null);
    assert.equal(PARENT.scriptCardOf(K, `script:${SK}:ask:nope`), null);
    assert.equal(PARENT.scriptCardOf(K, `teach:${SK}`), null);
  });
});

describe("LEARN-31: no Try at home card for a week with no lesson", () => {
  test("an empty week's preview gives no card; a week with a home line still does", async () => {
    const empty = await previewReport("c1", { cadence: "weekly", period: "2026-W46" }, { db: reportDb(), now: new Date("2026-11-10T12:00:00Z") });
    assert.ok(linesOf(empty).some((l) => l.section === "home"), "the empty week's note still carries the generic home line");
    assert.equal(PARENT.tryAtHomeFrom(empty.report, "2026-W46"), null);
    const ev = [ktRow("r2", "2026-11-03", "sB", "item.open", 0), ktRow("r2", "2026-11-03", "sB", "item.open", 0)];
    const full = await previewReport("c1", { cadence: "weekly", period: "2026-W45" },
      { db: reportDb({ lessons: [lessonRow("r2", "2026-11-03", 20)], ev, skills: ["sB"] }), lookup: { skillTitle: async () => "Quarters", belief: async () => null }, now: new Date("2026-11-08T12:00:00Z") });
    const card = PARENT.tryAtHomeFrom(full.report, "2026-W45");
    assert.ok(card?.text, "a week with lessons has a card");
    assert.equal(card.period, "2026-W45");
  });
});

// ───────────── set-up and placement routes ─────────────


// ───────────── parent corner copy (src/parent) ─────────────
describe("LEARN-38: an unanswered privacy choice", () => {
  test("an unanswered privacy choice shows what happens WITHOUT it", async () => {
    const { consentEffect } = await import("../src/parent/copy.ts");
    assert.equal(consentEffect(null, "kept", "not kept"), "not kept");
    assert.equal(consentEffect(false, "kept", "not kept"), "not kept");
    assert.equal(consentEffect(true, "kept", "not kept"), "kept");
  });
});

describe("LEARN-53: shared/learner.ts names what the server writes", () => {
  test("every `via` the server stamps on an event is in the EvidenceEvent type; Ledger carries placementPending", async () => {
    const { readFileSync } = await import("node:fs");
    const ts = readFileSync(new URL("../shared/learner.ts", import.meta.url), "utf8");
    const via = /^\s*via\?: ([^;]+);/m.exec(ts)[1];
    const { PLACEMENT_VIA } = await import("../server/learner/kt/placement.js");
    for (const v of ["dialogue", "game", "module", "studio", "late", PLACEMENT_VIA]) assert.ok(via.includes(`"${v}"`), `via lacks "${v}"`);
    assert.match(ts.slice(ts.indexOf("export interface Ledger")), /placementPending\?:/);
  });
});
