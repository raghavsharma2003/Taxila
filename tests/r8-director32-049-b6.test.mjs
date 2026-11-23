// to-brain 049 B6 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md, carried from 047): each bullet's predicate pinned on
// the director32 rows (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director32, 0-based rows into `director`),
// replayed with that run's own script snapshot, and the walk's rule pinned where it can be in a unit.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PENDING, PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { flagged } from "./r8-director32-049.test.mjs";
import { VPC_MAX, L2_CAP } from "../server/director/state.js";

describe("B6.1: a turn of verdict, reason, point and card over 65 words is split at the point", () => {
  test("vpcUnlisted is gated, and the walk's limit is 65 under the 75 of a turn of parts", () => {
    assert.ok(PREDICATES.vpcUnlisted && !PENDING.has("vpcUnlisted"));
    assert.equal(VPC_MAX, 65); assert.equal(L2_CAP, 75);
  });
  test("vpcUnlisted reads director32 c4 steady 86; c5-t01 steady 14, offtopic 12, steering 26; c5-t03 steady 6, stuck 10, offtopic 8", () => {
    assert.ok(flagged("steady", "c4", "vpcUnlisted").has(86));
    for (const [p, n] of [["steady", 14], ["offtopic", 12], ["steering", 26]]) assert.ok(flagged(p, "c5t01", "vpcUnlisted").has(n), `${p} ${n}`);
    for (const [p, n] of [["steady", 6], ["stuck", 10], ["offtopic", 8]]) assert.ok(flagged(p, "c5t03", "vpcUnlisted").has(n), `${p} ${n}`);
  });
});
