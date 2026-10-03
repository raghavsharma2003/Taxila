// evals/floor-relational.mjs (live, not a gate) measures the quote-free floor against the quoted one. Its arms
// are built by swapping the reworded lines inside the REAL compiled voice prompt; this pins that both lines are
// still there, so a later floor edit cannot silently turn the A/B into an A/A.
import { test } from "node:test";
import assert from "node:assert/strict";
import { arms, REWORDED, SCEN } from "../evals/floor-relational.mjs";

test("the floor A/B differs only in the reworded lines, and the NEW arm is quote-free there", () => {
  const { OLD, NEW } = arms();
  assert.notEqual(OLD, NEW);
  for (const [now, before] of REWORDED) { assert.ok(NEW.includes(now)); assert.ok(OLD.includes(before)); assert.ok(!/(?<!\p{L})'|'(?!\p{L})/u.test(now), "no quote marks (an apostrophe inside a word is fine)"); }
  let back = OLD;
  for (const [now, before] of REWORDED) back = back.replace(before, now);
  assert.equal(back, NEW);
  assert.equal(SCEN.length, 12);
});
