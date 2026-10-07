// round2 truth (VALUES-100 V1 "the delayed check leads the next lesson every time it is due"; patch 06): the session-open
// pipeline lesson.js runs (learner/live.js dueForChecks → comprehension/weave.js planChecks → learner/checks.js
// warmupItemsFor → the Director's warm-up). Before 06 a just-learned skill (high retention) sorted behind every mastered
// skill's FSRS review and lost its opener slot, and an opener with no item left its slot empty: evals/next-day-check/sim.mjs,
// 2,000 starts x 2 seeds, the opening move was the due check in 722/1,289 and 711/1,304 lessons (HEAD) → all (06).
// Real kits and the real ledger fold; no network, no DB.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { fold, newLedger, ktView } from "../server/learner/kt/ledger.js";
import { dueForChecks } from "../server/learner/live.js";
import { warmupItemsFor } from "../server/learner/checks.js";
import { planChecks } from "../server/comprehension/weave.js";
import { initLessonState, step } from "../server/director/state.js";
import { getKit } from "../server/content/index.js";

const H = 3600_000, DAY = 24 * H;
const NOW = Date.UTC(2026, 9, 20, 4, 30);   // 10:00 IST
const A = "c5-maths-ch01-t01-s1";   // learned 3 days ago on 2 of its items: certifiable (unseen items left)
const M = "c5-maths-ch02-t01-s1";   // learned 40 days ago, certified at +3 days: mastered, its FSRS review is due
const U = "c5-maths-ch02-t01-s3";   // learned 3 days ago on BOTH its check-kind items: nothing unseen, cannot be certified
const P = (s) => `${s.replace(/-s\d+$/, "")}-`;
let n = 0;
const ev = (sid, t, skillId, itemKey, o = {}) => ({ id: `${sid}-${++n}`, seq: n, sessionId: sid, sessionStartAt: new Date(t).toISOString(),
  at: new Date(t).toISOString(), episodeId: `${sid}-ep${n}`, skillIds: [skillId], target: skillId, itemKey, cls: "item.open", outcome: 0,
  grader: "code", graderVersion: "g", topicType: "T3", ...o });
const learn = (sid, t, sk, [a, b]) => [ev(sid, t, sk, P(sk) + a), ev(sid, t, sk, P(sk) + b), ev(sid, t, sk, P(sk) + a),
  ev(sid, t, sk, P(sk) + b, { cls: "probe.why", grader: "llm" }), ev(sid, t, sk, P(sk) + b)];

function ledgerOf(parts) {
  const evs = [];
  if (parts.includes("M")) evs.push(...learn("m0", NOW - 40 * DAY, M, ["i01", "i02"]), ev("m1", NOW - 37 * DAY, M, P(M) + "i13"));
  if (parts.includes("A")) evs.push(...learn("a0", NOW - 3 * DAY, A, ["i01", "i02"]));
  if (parts.includes("U")) evs.push(...learn("u0", NOW - 3 * DAY - H, U, ["i04", "i14"]));
  evs.forEach((e, k) => { e.seq = k + 1; });
  return fold(newLedger({ childId: "c", classLevel: 5 }), evs);
}

describe("round2 truth: the delayed check leads the next lesson", () => {
  test("preconditions: M is mastered with its FSRS review due; A and U are learned_today with no delayed pass", () => {
    const L = ledgerOf(["M", "A", "U"]);
    assert.equal(L.skills[M].display, "mastered");
    assert.ok(ktView(L, { now: NOW }).due(12).includes(M), "M's review is due");
    for (const s of [A, U]) { assert.equal(L.skills[s].display, "learned_today", s); assert.equal(L.skills[s].flags.delayed, false); }
    assert.ok(L.skills[M].retention < 1 && L.skills[A].retention > 0);
  });

  test("dueForChecks: a due delayed check (check: true) comes before any FSRS review, whatever the retentions", () => {
    const due = dueForChecks(ledgerOf(["M", "A"]), NOW);
    assert.deepEqual(due.map((d) => d.skillId), [A, M]);
    assert.equal(due[0].check, true);
    assert.equal(due[1].check, undefined);
  });

  test("planChecks: with one opener slot (band B1 has 2, this is the edge) the check takes it", () => {
    const due = dueForChecks(ledgerOf(["M", "A"]), NOW);
    assert.deepEqual(planChecks({ q: [], due, now: new Date(NOW).toISOString(), openers: 1 }).openers, [A]);
    // an expired weave entry with a low retention does not outrank it either
    const q = [{ skillId: "c5-maths-ch03-t01-s1", status: "expired" }];
    assert.equal(planChecks({ q, due, beliefs: { "c5-maths-ch03-t01-s1": { retention: 0.01 } }, now: new Date(NOW).toISOString(), openers: 1 }).openers[0], A);
  });

  test("warmupItemsFor: an opener with no item gives its slot to the next due check, never leaves it empty", async () => {
    const L = ledgerOf(["A"]);
    const w = await warmupItemsFor(["c9-maths-ch99-t99-s1", A].slice(0, 1), { ledger: L, now: NOW });
    assert.equal(w.length, 1);
    assert.equal(w[0].skillId, A);
    assert.ok(!w[0].review && !L.skills[A].items.includes(w[0].id), `A's certifying check, on an item never met (${w[0].id})`);
  });

  test("a skill that cannot be certified (no unseen item) never takes the slot of one that can; it only fills a spare slot, as a review", async () => {
    const L = ledgerOf(["A", "U"]);
    const due = dueForChecks(L, NOW);
    assert.equal(due[0].skillId, U, "U's anchor is older, so dueForChecks lists it first");
    const one = await warmupItemsFor(planChecks({ q: [], due, now: new Date(NOW).toISOString(), openers: 1 }).openers, { ledger: L, now: NOW });
    assert.deepEqual(one.map((x) => x.skillId), [A], "the one slot goes to the check that can certify");
    const two = await warmupItemsFor(planChecks({ q: [], due, now: new Date(NOW).toISOString(), openers: 2 }).openers, { ledger: L, now: NOW });
    assert.deepEqual(two.map((x) => x.skillId), [A, U]);
    assert.equal(two[1].review, true);
    assert.equal(two[1].uncertifiable, true);
    assert.ok(L.skills[U].items.includes(two[1].id), "the review is an item U has met (it can never count as the check)");
  });

  test("end to end through the Director: the lesson's opening move poses the due check, not the mastered review", async () => {
    const L = ledgerOf(["M", "A"]);
    const due = dueForChecks(L, NOW);
    const warm = await warmupItemsFor(planChecks({ q: [], due, now: new Date(NOW).toISOString(), openers: 2 }).openers, { ledger: L, now: NOW });
    const kit = await getKit("c5-maths-ch04-t01", { generate: false });
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Bittu", what: "a puppy" }, ageBand: "10-15", lang: "english",
      interests: [], firstMeeting: false, hasCallback: false, topicTitle: "Today", classLevel: 5, address: "tum", sessionId: "s" };
    const s0 = initLessonState({ topicId: kit.topicId, kit, warmupItems: warm, openers: warm.map((w) => w.skillId), ctx, seed: 7, now: NOW });
    const r0 = step(s0, { event: "start", kit, now: NOW });
    assert.equal(r0.move.kind, "greet");
    assert.equal(r0.move.itemId, warm[0].id);
    assert.equal(warm[0].skillId, A);
  });
});
