// dc-r8-director22 J2: backTo is said when, and only when, a card comes back after another unit (both directions on the rows); a miss
// verdict and its remediation always have their joint.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRun } from "../evals/hybrid-side-by-side/check-run.mjs";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const D22 = new URL("./fixtures/eval-results/director22", import.meta.url).pathname;

test("the miss → remediation joint is gated, and director22's steady rows are missing it", () => {
  assert.ok(!PENDING.has("missRemediationJoint"));
  assert.ok(checkRun(D22).filter((x) => x.predicate === "missRemediationJoint").length >= 3);
});

test("backTo both ways: said after another unit, never after a hint on the same card", () => {
  const card = "Neeche kitne chalk ke marks hain?";
  const ctx = (prevUnit) => ({ prevT: { text: "Pehle wala sawaal", held: { unit: prevUnit } }, saidCards: new Set([card.toLowerCase().slice(0, 40)]), jointHeads: { backTo: ["chalo, pehle wale sawaal ki taraf wapas aate hain"] } });
  const row = (text) => ({ who: "teacher", text, card, held: { unit: "s1:c2" } });
  const back = row(`Chalo, pehle wale sawaal ki taraf wapas aate hain. ${card}`);
  assert.equal(PREDICATES.backToJoint("L", back, 1, ctx("s1:rem:m1")), null);
  assert.match(PREDICATES.backToJoint("L", back, 1, ctx("s1:c2")), /no return/);
  assert.match(PREDICATES.backToJoint("L", row(card), 1, ctx("s1:rem:m1")), /no backTo/);
});
