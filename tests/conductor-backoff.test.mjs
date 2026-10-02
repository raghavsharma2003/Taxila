// The worker's step-level poison accounting (server/conductor/backoff.js): a child whose step() keeps throwing
// is excluded from the dirty scan with exponential backoff and paged, so it never starves healthy children.
import { test } from "node:test";
import assert from "node:assert/strict";
import { stepBackoff } from "../server/conductor/backoff.js";

test("a failing child is blocked with doubling backoff, paged every 5th failure, and cleared on success", () => {
  let t = 0;
  const b = stepBackoff({ baseMs: 1000, maxMs: 8000, pageAfter: 5 }, () => t);
  const seen = [];
  for (let i = 0; i < 10; i++) seen.push(b.failed("kid"));
  assert.deepEqual(seen.map((f) => f.delayMs), [1000, 2000, 4000, 8000, 8000, 8000, 8000, 8000, 8000, 8000]);
  assert.deepEqual(seen.filter((f) => f.page).map((f) => f.n), [5, 10]);
  assert.deepEqual(b.blocked(), ["kid"]);
  t = 8001;
  assert.deepEqual(b.blocked(), [], "eligible again once the delay elapses");
  b.ok("kid");
  assert.equal(b.size(), 0);
  assert.equal(b.failed("kid").delayMs, 1000, "success resets the count");
});

test("50 poisoned children never block a healthy one: the scan exclusion covers all of them", () => {
  const b = stepBackoff(undefined, () => 0);
  for (let i = 0; i < 50; i++) b.failed(`p${i}`);
  const blocked = new Set(b.blocked());
  const scan = [...Array.from({ length: 50 }, (_, i) => `p${i}`), "healthy"].filter((id) => !blocked.has(id)).slice(0, 50);
  assert.deepEqual(scan, ["healthy"]);
});
