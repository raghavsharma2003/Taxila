// W2 integration (2026-10-05): the cross-stream fixes made when the nine Wave 2 streams were merged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { countsAsDone } from "../server/routes/child.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

test("a Practice or an Ask never uses up the day's Learn lesson ('never one more' counts lessons only)", () => {
  const graded = { minutes: 12, did: ["i1"] };
  assert.equal(countsAsDone({ ...graded, ctx: { purpose: "lesson" } }), true);
  assert.equal(countsAsDone({ ...graded, ctx: {} }), true, "a row from before purposes were stored is a lesson");
  assert.equal(countsAsDone({ ...graded, ctx: { purpose: "practice" } }), false);
  assert.equal(countsAsDone({ ...graded, ctx: { purpose: "doubt" } }), false);
});

test("a number item whose verified key is written with commas gets a ',' on the pad (ui.padComma); others do not", () => {
  const base = kit();
  const run = (answer) => {
    const K = { ...base, items: base.items.map((it) => ({ ...it, answer, acceptable: [] })) };
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 30 && !(r.ui?.ask?.itemId && !r.ui.ask.itemId.startsWith("fade:") && r.ui.answerForm === "number"); i++) {
      r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (r.state.turn + 1) * 20_000 });
    }
    return r.ui;
  };
  const comma = run("1,25,000");
  assert.equal(comma.answerForm, "number");
  assert.equal(comma.padComma, true);
  const plain = run("125");
  assert.equal(plain.answerForm, "number");
  assert.equal(plain.padComma, undefined);
});
