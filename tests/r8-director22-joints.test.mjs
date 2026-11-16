// dc-r8-director22 J2, rewritten for dc-r8-director23 S: backTo is said when, and only when, a card comes back after another unit, and a
// miss verdict and its remediation always have their joint — read from the seam pass's record (`seams`) on each row, nothing else.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRun } from "../evals/hybrid-side-by-side/check-run.mjs";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const D22 = new URL("./fixtures/eval-results/director22", import.meta.url).pathname;
const row = (seams) => ({ who: "teacher", text: "x", seams });

test("the miss → remediation joint is gated and reads the seams list; director22's rows, which have none, are flagged as unread", () => {
  assert.ok(!PENDING.has("missRemediationJoint"));
  assert.match(PREDICATES.missRemediationJoint("L", row([{ left: "missVerdict", right: "remediation", joint: null }])), /no joint/);
  assert.equal(PREDICATES.missRemediationJoint("L", row([{ left: "missVerdict", right: "remediation", joint: "beforeRemediation", form: "Ise ek alag tareeke se dekhte hain." }])), null);
  assert.ok(checkRun(D22).some((x) => x.predicate === "seamJoints" && /no seams record/.test(x.why)));
});

test("backTo both ways: said at a return, never at a seam that is no return", () => {
  assert.equal(PREDICATES.backToJoint("L", row([{ left: "verdict", right: "returnCard", joint: "backTo", form: "Chalo." }])), null);
  assert.match(PREDICATES.backToJoint("L", row([{ left: "start", right: "returnCard", joint: null }])), /no joint/);
  assert.match(PREDICATES.backToJoint("L", row([{ left: "point", right: "card", joint: "backTo", form: "Chalo." }])), /no return/);
  // (one joint a seam: a return out of her aside reply takes the after-aside joint, not backTo as well)
  assert.equal(PREDICATES.backToJoint("L", row([{ left: "asideReply", right: "returnCard", joint: "afterAside", form: "Ab." }])), null);
});
