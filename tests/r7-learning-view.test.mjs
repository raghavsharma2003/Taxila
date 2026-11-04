// Round 7 F item 4: the learner-view exports Brain consumes (server/learner/view.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { strandTheta, allThetas, weakOn, minutesLeft, learnerView, THETA_MIN_OBS } from "../server/learner/view.js";
import { initialBase, newEpoch, addObs, A_GE, C_OPEN, S_SLIP } from "../server/learner/kt/ability.js";
import { newLedger } from "../server/learner/kt/ledger.js";

const NOW = Date.parse("2026-11-04T10:00:00Z");

function ledgerWith({ classLevel = 5, obs = [], skills = {} } = {}) {
  const L = newLedger({ childId: "c1", classLevel });
  const e = newEpoch(initialBase({ strands: ["maths:core"], classLevel, openedAt: NOW - 86400_000, epochId: "e1" }));
  obs.forEach(([y, b], i) => addObs(e, { evId: `ev${i}`, strand: "maths:core", y, b, a: A_GE, c: C_OPEN, s: S_SLIP, w: 1 }));
  L.ability.maths = e;
  for (const [id, s] of Object.entries(skills)) L.skills[id] = { skillId: id, pL: s.pL, n: s.n, mem: null, display: "practising", refresh: false, nextReviewAt: null };
  return L;
}

test("strandTheta: null without an epoch; value withheld until THETA_MIN_OBS", () => {
  assert.equal(strandTheta(newLedger({ childId: "c", classLevel: 5 }), "maths"), null);
  const t0 = strandTheta(ledgerWith(), "maths");
  assert.equal(t0.strand, "maths:core");
  assert.equal(t0.nObs, 0);
  assert.equal(t0.value, null);
  assert.ok(t0.mu > 3 && t0.mu < 5.5, `class-5 prior near GE 4.5, got ${t0.mu}`);
  const t1 = strandTheta(ledgerWith({ obs: Array.from({ length: THETA_MIN_OBS }, () => [1, 4.5]) }), "maths");
  assert.equal(t1.nObs, THETA_MIN_OBS);
  assert.equal(t1.value, t1.mu);
});

test("strandTheta moves with evidence: all wrong is lower than all right", () => {
  const hard = Array.from({ length: 6 }, () => [0, 3.5]);
  const easy = Array.from({ length: 6 }, () => [1, 5.5]);
  assert.ok(strandTheta(ledgerWith({ obs: hard }), "maths").mu < strandTheta(ledgerWith({ obs: easy }), "maths").mu);
  assert.deepEqual(Object.keys(allThetas(ledgerWith())), ["maths"]);
});

test("weakOn: topic skill, prerequisite skill and θ far below class", () => {
  const L = ledgerWith({ skills: { "c5-maths-ch02-t01-s1": { pL: 0.2, n: 4 }, "c4-maths-ch01-t01-s1": { pL: 0.3, n: 3 }, "c5-maths-ch02-t01-s2": { pL: 0.2, n: 1 } } });
  const w = weakOn(L, ["c5-maths-ch02-t01-s1", "c5-maths-ch02-t01-s2"], ["c4-maths-ch01-t01-s1"], { classLevel: 5, now: NOW });
  assert.equal(w.weak, true);
  assert.deepEqual(w.reasons, ["topic", "prereq"]);
  assert.deepEqual(w.skills, ["c4-maths-ch01-t01-s1", "c5-maths-ch02-t01-s1"]);
  // one observation is not weakness
  assert.equal(weakOn(L, ["c5-maths-ch02-t01-s2"], [], { classLevel: 5, now: NOW }).weak, false);
  // θ well under the class start (GE 4 for class 5) on evidence
  const low = ledgerWith({ obs: Array.from({ length: 8 }, () => [0, 2]) });
  const wl = weakOn(low, ["c5-maths-ch02-t01-s1"], [], { classLevel: 5, now: NOW });
  assert.deepEqual(wl.reasons, ["theta"]);
});

test("minutesLeft: limits off → no limit; cap and hours both bind", () => {
  assert.deepEqual(minutesLeft({ limitsOn: false, capMin: 30, usedMin: 10, slotTargetMin: 25 }), { limitsOn: false, today: null, slot: 25, by: null, deadlineAt: null });
  const cap = minutesLeft({ limitsOn: true, capMin: 30, usedMin: 12, to: "21:30", localNow: "17:00", now: NOW });
  assert.equal(cap.today, 18);
  assert.equal(cap.by, "cap");
  assert.equal(cap.deadlineAt, new Date(NOW + 18 * 60000).toISOString());
  const hrs = minutesLeft({ limitsOn: true, capMin: 30, usedMin: 0, to: "21:30", localNow: "21:20", now: NOW });
  assert.equal(hrs.today, 10);
  assert.equal(hrs.by, "hours");
  // "Open now for 1 hour" lifts the hours end; the cap still holds
  const open = minutesLeft({ limitsOn: true, capMin: 30, usedMin: 0, to: "21:30", localNow: "22:00", openUntil: new Date(NOW + 45 * 60000).toISOString(), now: NOW });
  assert.equal(open.today, 30);
  assert.equal(minutesLeft({ limitsOn: true, capMin: 30, usedMin: 40, to: "21:30", localNow: "17:00", now: NOW }).today, 0);
});

test("learnerView: one object for a lesson start", () => {
  const L = ledgerWith({ obs: [[1, 4.5], [1, 4.8], [0, 5.5]] });
  const v = learnerView({ ledger: L, topicId: "c5-maths-ch02-t01", classLevel: 5, skillIds: ["c5-maths-ch02-t01-s1"],
    limits: { limitsOn: false, capMin: 30, usedMin: 0 }, now: NOW });
  assert.equal(v.subject, "maths");
  assert.equal(v.theta.nObs, 3);
  assert.equal(typeof v.theta.value, "number");
  assert.equal(v.weak.weak, false);
  assert.equal(v.minutesLeft.today, null);
});
