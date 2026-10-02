import { test } from "node:test";
import assert from "node:assert/strict";
import {
  update, applyEvidence, newSkillState, deriveStatus, withDue, PARAMS, MIN_DELAY_MS, REVIEW_DAYS,
} from "../server/learner/bkt.js";

const P = PARAMS.T3;
const ev = (outcome, probe = "P15", hintsUsed = 0, weight = 1) => ({ skillId: "s", probe, outcome, hintsUsed, weight });
const H = 3600_000, DAY = 24 * H;

test("update: correct raises, wrong lowers, no_evidence is a no-op", () => {
  assert.ok(update(0.3, "correct", 0, 1, P) > 0.3);
  assert.ok(update(0.6, "incorrect", 0, 1, P) < 0.6);
  assert.ok(update(0.6, "misconception", 0, 1, P) < 0.6);
  assert.equal(update(0.42, "no_evidence", 0, 1, P), 0.42);
  assert.equal(update(0.42, "correct", 0, 0, P), 0.42, "zero weight carries no evidence");
});

test("update: every hint rung weakens a success; at the assertion it is almost no evidence", () => {
  const gains = [0, 1, 2, 3, 4].map((h) => update(0.3, "correct", h, 1, P) - 0.3);
  for (let i = 1; i < gains.length; i++) assert.ok(gains[i] < gains[i - 1], `rung ${i} should gain less than rung ${i - 1}`);
  // At rung 4 the posterior barely moves past the plain learn transition.
  const learnOnly = 0.3 * (1 - P.pForget) + 0.7 * P.pLearn;
  assert.ok(Math.abs(update(0.3, "correct", 4, 1, P) - learnOnly) < 0.03);
});

test("update: hints do not soften a wrong answer, weight scales the move, partial is half a success", () => {
  assert.equal(update(0.6, "incorrect", 3, 1, P), update(0.6, "incorrect", 0, 1, P));
  assert.ok(update(0.3, "correct", 0, 1.5, P) > update(0.3, "correct", 0, 1, P));
  assert.ok(update(0.3, "correct", 0, 0.5, P) < update(0.3, "correct", 0, 1, P));
  const partial = update(0.3, "partial", 0, 1, P);
  assert.ok(partial > 0.3 && partial < update(0.3, "correct", 0, 1, P));
});

test("status ladder: practice alone never reaches learned_today; a generative pass does", () => {
  const ctx = { topicType: "T3", now: new Date(0), lessonStartedAt: new Date(0) };
  let s = newSkillState("s", "T3", new Date(0));
  for (let i = 0; i < 6; i++) s = applyEvidence(s, ev("correct"), ctx);
  assert.equal(s.status, "practising", "unaided practice without a why/transfer stays practising");
  assert.ok(s.pKnown >= 0.6);
  s = applyEvidence(s, ev("correct", "P2"), ctx);
  assert.equal(s.generativePass, true);
  assert.equal(s.status, "learned_today");
  assert.ok(s.nextReview, "a learned skill is scheduled for review");
});

test("mastery needs a delayed retrieval pass in a LATER session", () => {
  const lesson1 = new Date(10 * DAY);
  const ctx1 = { topicType: "T3", now: lesson1, lessonStartedAt: lesson1 };
  let s = newSkillState("s", "T3", lesson1);
  for (const e of [ev("correct"), ev("correct"), ev("correct", "P3"), ev("correct", "P2"), ev("correct"), ev("correct")]) s = applyEvidence(s, e, ctx1);
  assert.equal(s.status, "learned_today");
  // Same session: a retrieval-shaped probe is NOT delayed retrieval.
  const same = applyEvidence(s, ev("correct", "P10", 0, 1.5), { ...ctx1, now: new Date(lesson1.getTime() + 20 * 60_000) });
  assert.equal(same.delayedPass, false);
  assert.notEqual(same.status, "mastered");
  // A later session, too soon after the last contact, does not count either.
  const soonStart = new Date(lesson1.getTime() + MIN_DELAY_MS / 2);
  const soon = applyEvidence(s, ev("correct", "P10", 0, 1.5), { topicType: "T3", now: soonStart, lessonStartedAt: soonStart });
  assert.equal(soon.delayedPass, false);
  // Next day, new lesson, unaided correct retrieval → mastered.
  const lesson2 = new Date(lesson1.getTime() + DAY);
  const later = applyEvidence(s, ev("correct", "P10", 0, 1.5), { topicType: "T3", now: lesson2, lessonStartedAt: lesson2 });
  assert.equal(later.delayedPass, true);
  assert.equal(later.status, "mastered");
  // Hinted delayed retrieval is not a pass.
  const hinted = applyEvidence(s, ev("correct", "P10", 1, 1.5), { topicType: "T3", now: lesson2, lessonStartedAt: lesson2 });
  assert.equal(hinted.delayedPass, false);
});

test("review schedule expands on delayed success and restarts on failure", () => {
  const t0 = new Date(0);
  let s = { ...newSkillState("s", "T3", t0), pKnown: 0.9, attempts: 5, correctUnaided: 3, generativePass: true, status: "learned_today",
    lastSeen: t0.toISOString(), nextReview: new Date(REVIEW_DAYS[0] * DAY).toISOString() };
  const day = (n) => new Date(n * DAY);
  s = applyEvidence(s, ev("correct", "P10", 0, 1.5), { topicType: "T3", now: day(1), lessonStartedAt: day(1) });
  assert.equal((new Date(s.nextReview) - day(1)) / DAY, REVIEW_DAYS[1]);
  s = applyEvidence(s, ev("correct", "P10", 0, 1.5), { topicType: "T3", now: day(4), lessonStartedAt: day(4) });
  assert.equal((new Date(s.nextReview) - day(4)) / DAY, REVIEW_DAYS[2]);
  const failed = applyEvidence(s, ev("incorrect", "P10", 0, 1.5), { topicType: "T3", now: day(11), lessonStartedAt: day(11) });
  assert.equal(failed.delayedPass, false, "a failed delayed retrieval takes mastery back");
  assert.notEqual(failed.status, "mastered");
});

test("no decay by absence: time alone never lowers pKnown; it only makes a skill due", () => {
  const s = { ...newSkillState("s", "T3"), pKnown: 0.85, status: "mastered", nextReview: new Date(5 * DAY).toISOString() };
  const monthLater = withDue(s, new Date(35 * DAY));
  assert.equal(monthLater.pKnown, 0.85);
  assert.equal(monthLater.status, "due");
  assert.equal(withDue(s, new Date(2 * DAY)).status, "mastered");
  assert.equal(deriveStatus({ ...s, attempts: 0, status: "unseen" }), "unseen");
});

test("legacy delayed retrieval uses the 20 h rule (PRODUCT-DESIGN §6.4.1): 19 h later is not delayed, 20 h is", () => {
  assert.equal(MIN_DELAY_MS, 20 * H);
  const t1 = new Date(10 * DAY);
  let s = { ...newSkillState("s", "T3", t1), pKnown: 0.9, attempts: 5, correctUnaided: 3, generativePass: true, status: "learned_today", lastSeen: t1.toISOString() };
  const at = (h) => new Date(t1.getTime() + h * H);
  assert.equal(applyEvidence(s, ev("correct", "P10", 0, 1.5), { topicType: "T3", now: at(19), lessonStartedAt: at(19) }).delayedPass, false);
  assert.equal(applyEvidence(s, ev("correct", "P10", 0, 1.5), { topicType: "T3", now: at(20), lessonStartedAt: at(20) }).delayedPass, true);
});
