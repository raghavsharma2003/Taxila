// G2 browser gate, Q3.binding over the gate's two plays (server/forge/g2/qa.js bindingFindings), and the key-position minimum.
// Budget.slow_call is a wall-clock budget (50 ms per mechanic call, kit runtime) on a page the OS can preempt: one slow call is a
// note, and only the SAME call over budget in BOTH plays blocks. Contract refusals and throws block from either play as before.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bindingFindings, KEY_POSITION_MIN_ITEMS } from "../server/forge/g2/qa.js";

const slow = (name, ms) => ({ code: "Budget.slow_call", detail: `${name} ${ms}ms` });

test("a slow call in one play only is a note, not a blocker", () => {
  const r = bindingFindings([slow("grade", 61)], []);
  assert.deepEqual(r.blockers, []);
  assert.equal(r.notes.length, 1);
});

test("the same mechanic call over budget in both plays blocks, whatever its milliseconds", () => {
  const r = bindingFindings([slow("grade", 61)], [slow("grade", 140)]);
  assert.equal(r.blockers.length, 1);
  assert.deepEqual(r.notes, []);
});

test("different slow calls in the two plays are notes (a preempted page, not a slow mechanic)", () => {
  const r = bindingFindings([slow("grade", 61)], [slow("next", 70)]);
  assert.deepEqual(r.blockers, []);
  assert.equal(r.notes.length, 1);
});

test("contract refusals and throws still block from one play; other codes are ignored", () => {
  const r = bindingFindings([{ code: "ForgeContract.refused", detail: "x" }, { code: "Agent.threw", detail: "y" }, { code: "Seam.info", detail: "z" }], []);
  assert.deepEqual(r.blockers.map((f) => f.code), ["ForgeContract.refused", "Agent.threw"]);
  assert.deepEqual(r.notes, []);
});

test("key_position needs at least 3 graded items in a play", () => {
  // A play with fewer than 3 items never trips leak.key_position: with 1 or 2 items a constant position is what an honest
  // shuffle shows most of the time (2 items on 4 options: 1 in 4), so it is no evidence of a leak. A kit whose plays are all
  // that short is therefore not checked for this leak at all; the gate accepts that rather than fail correct games by chance.
  assert.equal(KEY_POSITION_MIN_ITEMS, 3);
});
