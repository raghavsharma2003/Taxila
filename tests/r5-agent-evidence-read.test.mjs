// round 5 (stream 4A): the candidate evidence read (server/agent/read.js), not wired into the lane yet: its bar is fitted
// offline against the sim lab's decided-truth gate before it replaces earnedRead. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { evidenceRead, posteriorOf, depthOf } from "../server/agent/read.js";

const C = (kind, g = "correct") => ({ kind, g });

test("the posterior moves the right way and sums to 1; no answers → no read", () => {
  const p = posteriorOf([C("practice")]);
  assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.ok(posteriorOf([C("why")])[2] > posteriorOf([C("practice")])[2], "a deep right says more than a plain one");
  assert.ok(posteriorOf([C("practice", "wrong")])[0] > posteriorOf([C("practice")])[0]);
  assert.equal(evidenceRead([]), null);
  assert.equal(depthOf("why"), "deep"); assert.equal(depthOf("contrast"), "mid"); assert.equal(depthOf("practice"), "plain");
});

test("one plain right is never understood; a plain miss with nothing else reads not; a deep miss holds it at partly", () => {
  assert.equal(evidenceRead([C("practice")]), "partly");
  assert.equal(evidenceRead([C("practice", "wrong")]), "not");
  assert.equal(evidenceRead([C("why", "wrong"), C("practice")]), "partly");
  assert.equal(evidenceRead([C("practice"), C("why")], { bar: 0.75 }), "understood");
});
