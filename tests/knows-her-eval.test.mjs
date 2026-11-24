// evals/knows-her in the gate (round 8, PLAN.md "the aim, as a test"): on each pilot topic, two simulated children with
// different histories get lessons that differ in at least four named ways, each traced to a learner fact; a child with no
// history gets exactly the script's default with an empty because; every walk passes the because predicate, and dropping
// any applied record makes it fail. Deterministic: no model, no network, no database.
import test from "node:test";
import assert from "node:assert/strict";
import { runEval } from "../evals/knows-her/run.mjs";

test("knows-her: four pilot topics, the named differences and the default child", () => {
  const r = runEval();
  assert.deepEqual(r.failures, []);
  assert.equal(r.topics.length, 4);
  for (const t of r.topics) {
    assert.ok(t.newIsDefault, t.topicId);
    assert.ok(t.differences.length >= 4, `${t.topicId}: ${t.differences.length}`);
    for (const d of t.differences) assert.ok([...d.meera, ...d.kabir].every((x) => x.fact?.kind && x.source), `${t.topicId} ${d.choice}`);
    for (const l of Object.values(t.lessons)) assert.ok(l.explained);
  }
});
