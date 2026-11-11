// round 7 A6 brain-teaching-question-evidence (PIPELINE §A Brain item 3; QA ac4e8e88: "160?" to her own question was praised
// and moved on, no credit): the question that ends a worked part is a code-chosen keyed micro-item (the next kit step, its
// result the key), pinned as the card and graded by the classifier like any card. A right answer, "160?" included, is
// confirmed and counted; a wrong or stuck one is shown in the next part. TAXILA_ACK_CLOSE is on by default. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, stepCheckItem, ackCloseOn } from "../server/director/state.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { findItem } from "../server/director/items.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
import { kitPath } from "./fixtures/kit-path.mjs";
import { describe } from "node:test";

const RANI = kitFromFile(getTopic("c6-maths-ch06-t01"));
// the full worked example (no faded step planned), so the worked parts hand steps to the child
const K = { ...RANI, workedExample: { ...RANI.workedExample, fadedVersion: undefined } };
const toCheck = (seed = 3) => {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 8 && !(r.move.kind === "worked_example" && r.move.itemId); i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "x", now: (r.state.turn + 1) * 20_000 });
  return r;
};
const reply = (r, text) => {
  const item = findItem(r.state, K, r.state.activeItemId);
  const c = classifyFast({ target: targetFor(r.state, K, item), childText: text });
  // a wrong bare number has no fast result: the full classifier marks it incorrect (classify.js number floor), as here
  const res = c.result ?? (c.bareWrongNumber ? cls("incorrect") : c.result === null ? cls("no_evidence") : c);
  return { r: step(r.state, { event: "turn", kit: K, cls: res, text, now: 999_000 }), item, outcome: res.outcome };
};

describe("r7-brain-step-check (kit path: lesson scripts off)", () => {
kitPath();
test("the keyed step: the next kit step's result is the key; a step with no result in code is not a check", () => {
  const we = RANI.workedExample;
  assert.equal(stepCheckItem(RANI, "s1", we, 0), null, "'One round is the perimeter of the park.' has no result");
  const c1 = stepCheckItem(RANI, "s1", we, 1);
  assert.equal(c1.answer, "160");
  assert.match(c1.prompt_en, /= ___/);
  assert.doesNotMatch(c1.prompt_en, /160 m/);
  assert.equal(stepCheckItem(RANI, "s1", we, 3).answer, "480");
});

test("a worked part hands the next step to them as the card, never a free question", () => {
  const r = toCheck();
  assert.equal(r.move.kind, "worked_example");
  assert.match(String(r.move.itemId), /^check:/);
  assert.equal(r.ui.ask?.itemId, r.move.itemId);
  assert.match(r.ui.ask.text, /___/);
  assert.equal(r.state.phase, "teach", "the lesson is still teaching");
});

test("'480?' (QA's '160?' case) is credited: counted, confirmed, and the worked example goes on", () => {
  const { r, item, outcome } = reply(toCheck(), "480?");
  assert.equal(outcome, "correct");
  assert.ok(r.state.itemsDone.includes(item.id), "counted");
  assert.match(r.move.shape, /they worked out that step right: confirm it plainly/);
  assert.equal(r.state.activeItemId, undefined);
  assert.equal(r.state.phase, "teach");
});

test("a wrong or stuck reply is not counted and the next part SHOWS the step", () => {
  for (const [text, missed] of [["300", true], ["pata nahi", false]]) {
    // ("pata nahi" is a don't-know read in code; "300" a wrong number)
    const { r, item } = reply(toCheck(), text);
    assert.ok(!r.state.itemsDone.includes(item.id), text);
    assert.match(r.move.shape, /show this part's steps yourself/, text);
    if (missed) assert.match(r.move.shape, /that step is not there yet: no verdict words/);
  }
});

test("kill switch TAXILA_R7_STEP_CHECK=off: the worked part asks in her own words (no card); ACK_CLOSE is on by default", () => {
  process.env.TAXILA_R7_STEP_CHECK = "off";
  try {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 8 && r.move.kind !== "worked_example"; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "x", now: (r.state.turn + 1) * 20_000 });
    assert.equal(r.move.kind, "worked_example");
    assert.equal(r.move.itemId, undefined);
  } finally { delete process.env.TAXILA_R7_STEP_CHECK; }
  assert.equal(ackCloseOn({}), true);
});
});
