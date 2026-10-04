// The re-teach loop on the academic record (BUILD-PLAN W1-C #5; comprehension audit G9; personalisation 1): attempts
// resolve from the child's own later answers, a final outcome pays the arm's population posterior exactly once, the
// lesson start loads the child's attempts / fluency / posteriors / prerequisites, and in-lesson failed arms reach
// selectReteach so prerequisite descent and park can fire. No network, no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAttempt, resolveAttempts, clusterOf, DELAY_MS, HORIZON_MS } from "../server/comprehension/resolve.js";
import { selectReteach, reteachSessionInputs, noteReteach, UNSEEN_PREREQ_PL } from "../server/comprehension/reteach.js";
import { readContext, resolutionStmt, _setSessionQuery } from "../server/comprehension/session.js";
import { outcomeIndex } from "../server/learner/kt/outcomes.js";

const SK = "c5-maths-ch02-t01-s1";
const T = Date.parse("2026-10-05T05:00:00.000Z");
const iso = (ms) => new Date(ms).toISOString();
let n = 0;
const item = (sessionId, at, name, o = {}) => ({ id: `e${++n}`, seq: n, sessionId, at: iso(at), skillIds: [SK], target: SK, cls: "item.open", outcome: outcomeIndex("item.open", name), ...o });
const row = (o = {}) => ({ id: ++n, skill_id: SK, session_id: "L1", misconception_id: "m1", arm_id: "gen:pictorial", rep_class: "pictorial", representation_id: "diagram",
  at: iso(T), outcome: null, reward: null, rewarded_at: null, ...o });
const A = { id: 1, skillId: SK, sessionId: "L1", misId: "m1", at: iso(T) };

test("resolution ladder: repaired_now → resolved_next → resolved_delayed (final), with the RT7 reward", () => {
  const now1 = resolveAttempt(A, [item("L1", T + 60_000, "C0")], [], T + 120_000);
  assert.deepEqual([now1.outcome, now1.final, now1.reward], ["repaired_now", false, 0.3]);
  const next = resolveAttempt(A, [item("L1", T + 60_000, "C1"), item("L2", T + 3 * 3600_000, "C0")], [], T + 4 * 3600_000);
  assert.deepEqual([next.outcome, next.final], ["resolved_next", false], "a later lesson the same day is not a delayed check");
  const del = resolveAttempt(A, [item("L1", T + 60_000, "C0"), item("L2", T + DELAY_MS + 60_000, "C0")], [], T + 2 * DELAY_MS);
  assert.deepEqual([del.outcome, del.final], ["resolved_delayed", true]);
  assert.ok(Math.abs(del.reward - 1.0) < 1e-12, "0.3 + 0.3 + 0.4");
});

test("failures: a wrong re-check, another re-teach before any success, a different misconception, a helped answer", () => {
  assert.deepEqual(pick(resolveAttempt(A, [item("L1", T + 60_000, "C4")])), ["failed", true, 0]);
  assert.deepEqual(pick(resolveAttempt(A, [], [{ skillId: SK, sessionId: "L1", at: iso(T + 30_000) }])), ["failed", true, 0], "re-taught again in the lesson");
  assert.deepEqual(pick(resolveAttempt(A, [item("L1", T + 60_000, "C4", { misconceptionId: "m2" })])), ["induced_bug", true, 0]);
  assert.deepEqual(pick(resolveAttempt(A, [item("L1", T + 60_000, "C0", { assisted: "parent" })])), ["contaminated", true, null]);
  const lost = resolveAttempt(A, [item("L1", T + 60_000, "C0"), item("L2", T + DELAY_MS + 60_000, "C4")]);
  assert.deepEqual(pick(lost), ["repaired_now", true, 0.3], "repaired, then the next lesson's answer was wrong: final with the stage reached");
  assert.deepEqual(pick(resolveAttempt(A, [], [], T + HORIZON_MS + 1)), ["failed", true, 0], "the 30-day horizon closes an attempt nothing ever answered");
  assert.equal(resolveAttempt(A, [item("L1", T - 60_000, "C0")], [], T + 1000).outcome, null, "evidence BEFORE the re-teach says nothing");
  assert.equal(resolveAttempt(A, [{ ...item("L1", T + 60_000, "C0"), via: "late" }], [], T + 1000).outcome, null, "a late correction is not an answer");
});
const pick = (x) => [x.outcome, x.final, x.reward];

test("resolveAttempts: only changed rows are written, a rewarded row is never touched again, attempts carry resolved outcomes", () => {
  const rows = [row({ id: 101 }), row({ id: 102, arm_id: "gen:story", rep_class: "story", at: iso(T + 30_000) })];
  const evs = [item("L1", T + 20_000, "C4"), item("L1", T + 90_000, "C0")];
  const { attempts, updates } = resolveAttempts(rows, evs, { now: T + 100_000, band: "B3" });
  assert.deepEqual(updates.map((u) => [u.id, u.outcome, u.final, u.cluster]), [[101, "failed", true, "maths:B3"], [102, "repaired_now", false, "maths:B3"]]);
  assert.deepEqual(attempts.map((a) => a.outcome), ["failed", "repaired_now"]);
  const again = resolveAttempts([{ ...rows[0], outcome: "failed", reward: 0, rewarded_at: iso(T) }, { ...rows[1], outcome: "repaired_now", reward: 0.3 }], evs, { now: T + 200_000, band: "B3" });
  assert.deepEqual(again.updates, [], "nothing new: no write");
  assert.equal(clusterOf(SK, "B2"), "maths:B2");
});

test("resolutionStmt: the posterior is paid inside the guarded update (once per attempt, only when final, no child id)", () => {
  const s = resolutionStmt({ id: 7, armId: "a", outcome: "resolved_delayed", reward: 1, final: true, cluster: "maths:B3" });
  assert.match(s.text, /where id = \$1 and rewarded_at is null returning arm_id, reward/);
  assert.match(s.text, /insert into arm_posteriors \(arm_id, cluster, a, b, n\)\s+select arm_id, \$5, 1 \+ reward, 2 - reward, 1 from u where \$4::boolean/);
  assert.ok(!/child_id/.test(s.text.split("insert into arm_posteriors")[1]), "arm_posteriors never carries a child id");
  assert.deepEqual(s.params, [7, "resolved_delayed", 1, true, "maths:B3"]);
});

test("in-lesson inputs: the arm tried last on a skill counts as failed when the trigger fires again; two → descent, three → park", () => {
  const kit = { skills: [{ id: SK, prereqSkillIds: ["c5-maths-ch01-t01-s1"] }] };
  const s = { comp: { "c5-maths-ch01-t01-s1": { belief: { pL: 0.35 } } }, ctx: { reteach: { prereqs: { [SK]: [{ skillId: "c4-maths-ch05-t01-s1", pL: UNSEEN_PREREQ_PL, seen: false }] } } } };
  const base = { skillId: SK, misId: null, kitArms: [], band: "B3", seed: "x", pL: 0.6, hindiObserved: false, now: iso(T) };
  const go = (trigger) => {
    const inputs = reteachSessionInputs(s, SK, kit);
    const d = selectReteach({ ...base, trigger, lessonArmsUsed: s.armsUsed ?? [], failedArmsThisSession: inputs.failedArmsThisSession, prereqs: inputs.prereqs });
    noteReteach(s, SK, d, inputs);
    if (d.armId) s.armsUsed = [...(s.armsUsed ?? []), d.armId];
    return { d, inputs };
  };
  const first = go("u_low_after_practice");
  assert.equal(first.d.move, "reteach"); assert.deepEqual(first.inputs.failedArmsThisSession, []);
  assert.deepEqual(first.inputs.prereqs.map((p) => p.skillId), ["c5-maths-ch01-t01-s1", "c4-maths-ch05-t01-s1"], "the kit's own prerequisite, then the cross-topic one");
  const second = go("two_fails_post_rung3");
  assert.equal(second.d.move, "reteach"); assert.deepEqual(second.inputs.failedArmsThisSession, [first.d.armId]);
  assert.notEqual(second.d.armId, first.d.armId, "a different arm");
  const third = go("two_fails_post_rung3");
  assert.equal(third.d.move, "prereq_descent", "two failed arms → descend to the weakest prerequisite");
  assert.equal(third.d.prereqSkillId, "c4-maths-ch05-t01-s1", "the weakest (unseen, 0.3) before the kit's (0.35)");
  const fourth = go("two_fails_post_rung3");
  assert.equal(fourth.d.move, "park", "still failing after the descent → park and tell the Conductor");
});

test("readContext: resolves, writes in the background, and pins attempts / fluency / posteriors / prerequisites for the lesson", async () => {
  const writes = [];
  const q = async (text) => {
    if (/from child where id/.test(text)) return [{ class_level: 5, legal_mode: "M1" }];
    if (/from reteach_attempts where child_id/.test(text)) return [row({ id: 201 }), row({ id: 202, skill_id: "c9-other-s1" })];
    if (/from kt_evidence/.test(text)) return [{ id: "k1", seq: 5, session_id: "L1", occurred_at: iso(T + 60_000), skill_ids: [SK], cls: "item.open", outcome: outcomeIndex("item.open", "C0"), target: SK }];
    if (/from rep_fluency/.test(text)) return [{ representation_id: "diagram", p_read: 0.8 }];
    if (/from arm_posteriors/.test(text)) return [{ arm_id: "gen:pictorial", cluster: "maths:B3", a: 3, b: 2 }, { arm_id: "gen:story", cluster: "maths:B2", a: 9, b: 1 }];
    if (/from kt_skill_state/.test(text)) return [];
    throw new Error(`unexpected ${text.slice(0, 40)}`);
  };
  _setSessionQuery(q, async (stmts) => { writes.push(...stmts); return []; });
  const info = console.info; console.info = () => {};
  try {
    const { reteach } = await readContext("child-1", { skillIds: [SK], now: T + 120_000 });
    await new Promise((r) => setTimeout(r, 10));
    assert.deepEqual(reteach.attempts.map((a) => [a.skillId, a.outcome]), [[SK, "repaired_now"]], "only this lesson's skills, resolved");
    assert.deepEqual(reteach.repFluency, { diagram: 0.8 });
    assert.deepEqual(reteach.posteriors, { "gen:pictorial": { a: 3, b: 2 } }, "this subject × band only (class 5 = B3)");
    assert.deepEqual(reteach.prereqs[SK], [{ skillId: "c4-maths-ch05-t01-s1", pL: UNSEEN_PREREQ_PL, seen: false }], "the curriculum's prerequisite topic, unseen");
    assert.equal(writes.length, 1, "one resolution written (the other attempt's skill has no evidence yet)");
    assert.deepEqual(writes[0].params.slice(0, 2), [201, "repaired_now"]);
  } finally { console.info = info; _setSessionQuery(null); }
});
