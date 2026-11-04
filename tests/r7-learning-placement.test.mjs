// Round 7 F item 6: the placement round wiring (server/routes/placement.js, server/placement/store.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { placementSubjectFor, routes } from "../server/routes/placement.js";
import { summaryOf, startGEOf, placementResultsOf } from "../server/placement/store.js";
import { startPlacement, answerPlacement } from "../server/placement/index.js";
import { routes as childRoutes } from "../server/routes/child.js";

test("the placement routes are registered through the child route table", () => {
  for (const k of ["POST /api/placement/start", "POST /api/placement/answer", "GET /api/placement/result"]) {
    assert.equal(typeof routes[k], "function", k);
    assert.equal(childRoutes[k], routes[k], k);
  }
});

test("placementSubjectFor: maths, else EVS to class 5 and science from 6", () => {
  assert.equal(placementSubjectFor(undefined, 4), "maths");
  assert.equal(placementSubjectFor("science", 4), "evs");
  assert.equal(placementSubjectFor("evs", 7), "science");
});

test("a round to the end gives a summary with a chapter of the child's own book", () => {
  let { state, item } = startPlacement({ classLevel: 5, subject: "maths", seed: 42 });
  let out = null;
  for (let i = 0; i < 20 && item; i++) {
    out = answerPlacement(state, { itemId: item.id, response: "pata nahi" });
    state = out.state; item = out.item;
    if (out.result) break;
  }
  assert.ok(out?.result, "the round ends");
  const s = summaryOf(out.result, 5, "maths");
  assert.ok(["behind", "on_track", "ahead"].includes(s.level));
  assert.ok(s.chapter && s.chapter.number >= 1 && typeof s.chapter.title === "string");
  assert.deepEqual(startGEOf({ maths: out.result }), { maths: out.result.startGE });
});

test("placementResultsOf never throws (no table yet → {})", async () => {
  assert.deepEqual(await placementResultsOf("x", { q_: async () => { throw Object.assign(new Error("no table"), { code: "42P01" }); } }), {});
  assert.deepEqual(await placementResultsOf("x", { q_: async () => [{ subject: "maths", result: { startGE: 4.2 } }] }), { maths: { startGE: 4.2 } });
  assert.deepEqual(startGEOf({ maths: { startGE: "x" } }), {});
});
