// parentState / foldDelayedChecks (server/routes/parent.js): the parent's ledger word from skill_state + evidence.
// Review fix: "Pakka · dobara jaanch" only after a MISSED delayed check (§6.4.1, R25), never because the
// scheduled re-check time passed (bkt "due"): elapsed time alone must not change what the parent sees (R13).
import { test } from "node:test";
import assert from "node:assert/strict";
import { parentState, foldDelayedChecks } from "../server/routes/parent.js";

const H = 3600_000, DAY = 24 * H;
const t0 = Date.parse("2026-09-01T10:00:00Z");
const at = (ms) => new Date(t0 + ms).toISOString();
const row = (o) => ({ at: at(o.t), probe: o.probe ?? "P15", outcome: o.outcome ?? "correct", hints_used: o.hints ?? 0, lesson_id: o.lesson });
// Day 0: learned in lesson A. Day 1: delayed pass in lesson B (Pakka).
const learned = [row({ t: 0, lesson: "A" }), row({ t: 10 * 60_000, probe: "P1", lesson: "A" })];
const passB = row({ t: DAY, probe: "P10", lesson: "B" });

test("due on a Pakka skill (review time passed, no check missed) stays Pakka with no tag", () => {
  const dc = foldDelayedChecks([...learned, passB]);
  assert.deepEqual(dc, { passed: true, misses: 0 });
  assert.deepEqual(parentState({ status: "due", delayed_pass: true }, dc), { level: 3, key: "mastered", recheck: false });
  assert.deepEqual(parentState({ status: "due", delayed_pass: true }), { level: 3, key: "mastered", recheck: false });
});

test("due on an Aa gaya skill stays Aa gaya (its date shows), no tag", () => {
  const dc = foldDelayedChecks(learned);
  assert.deepEqual(dc, { passed: false, misses: 0 });
  assert.deepEqual(parentState({ status: "due", delayed_pass: false }, dc), { level: 2, key: "learned_today", recheck: false });
});

test("one missed delayed check after a delayed pass: Pakka · re-check due, with the evidence row behind it", () => {
  const miss = row({ t: 4 * DAY, probe: "P10", outcome: "incorrect", lesson: "C" });
  const dc = foldDelayedChecks([...learned, passB, miss]);
  assert.deepEqual(dc, { passed: true, misses: 1 });
  // bkt clears delayed_pass on the miss, so the row alone reads Aa gaya; the evidence decides.
  assert.deepEqual(parentState({ status: "learned_today", delayed_pass: false }, dc), { level: 3, key: "mastered", recheck: true });
});

test("two consecutive misses: Aa gaya; a later delayed pass clears the tag", () => {
  const m1 = row({ t: 4 * DAY, probe: "P10", outcome: "incorrect", lesson: "C" });
  const m2 = row({ t: 6 * DAY, probe: "P10", outcome: "correct", hints: 1, lesson: "D" });
  const dc2 = foldDelayedChecks([...learned, passB, m1, m2]);
  assert.deepEqual(dc2, { passed: true, misses: 2 });
  assert.deepEqual(parentState({ status: "learned_today" }, dc2), { level: 2, key: "learned_today", recheck: false });
  const p = row({ t: 8 * DAY, probe: "P10", lesson: "E" });
  const dc3 = foldDelayedChecks([...learned, passB, m1, p]);
  assert.deepEqual(dc3, { passed: true, misses: 0 });
  assert.deepEqual(parentState({ status: "mastered", delayed_pass: true }, dc3), { level: 3, key: "mastered", recheck: false });
});

test("a P10 in the same lesson, or under 20 h after the last contact, is not a delayed check", () => {
  const sameLesson = row({ t: 30 * 60_000, probe: "P10", outcome: "incorrect", lesson: "A" });
  const tooSoon = row({ t: 10 * H, probe: "P10", outcome: "incorrect", lesson: "B" });
  assert.deepEqual(foldDelayedChecks([...learned, passB, { ...sameLesson, at: at(DAY + 20 * 60_000), lesson_id: "B" }]), { passed: true, misses: 0 });
  assert.deepEqual(foldDelayedChecks([...learned, tooSoon]), { passed: false, misses: 0 });
  // A miss with no earlier delayed pass is not "re-check due": that skill was never Pakka.
  const missFirst = row({ t: DAY, probe: "P10", outcome: "incorrect", lesson: "B" });
  const dc = foldDelayedChecks([...learned, missFirst]);
  assert.deepEqual(dc, { passed: false, misses: 0 });
  assert.deepEqual(parentState({ status: "learned_today" }, dc), { level: 2, key: "learned_today", recheck: false });
});

test("no_evidence rows are skipped; non-learned states never get the tag", () => {
  const ne = row({ t: 2 * DAY, probe: "P15", outcome: "no_evidence", lesson: "X" });
  const miss = row({ t: 2 * DAY + H, probe: "P10", outcome: "incorrect", lesson: "B" }); // same lesson as passB's
  assert.deepEqual(foldDelayedChecks([...learned, passB, ne, miss]), { passed: true, misses: 0 });
  assert.deepEqual(parentState({ status: "practising" }, { passed: true, misses: 1 }), { level: 1, key: "practising", recheck: false });
  assert.deepEqual(parentState(null), { level: 0, key: "unseen", recheck: false });
  // W2-A (flows G7): taught but never tried is Not started, never a sprout; tried once it is Practising
  assert.deepEqual(parentState({ status: "introduced" }), { level: 0, key: "unseen", recheck: false });
  assert.deepEqual(parentState({ status: "introduced", attempts: 1 }), { level: 1, key: "practising", recheck: false });
});
