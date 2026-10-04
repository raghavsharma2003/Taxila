// Policy invariants (prototype). Run: node --test prototypes/reset/conversation-v2/policy.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { decide, initState, dueParked } from "./policy.mjs";

const n = (intent, o = {}) => ({ intent, also: [], answer: "", topic: "", learning: false, inBounds: true, langTo: "", method: "", distress: false, confidence: 0.9, ...o });

test("a child's stop request never ends the lesson on the first ask; the second one inside the window pauses", () => {
  const a = decide(initState(), n("end_request"));
  assert.equal(a.move, "check_in"); assert.equal(a.end, false);
  const b = decide(a.state, n("end_request"));
  assert.equal(b.move, "pause"); assert.equal(b.end, true);
});
test("leaving lets the child go at once (NEVER MANIPULATE)", () => {
  const a = decide(initState(), n("leaving"));
  assert.equal(a.move, "pause"); assert.equal(a.end, true);
});
test("distress beats every other reading, including a stop or a diversion", () => {
  for (const i of ["end_request", "diversion", "joke", "answer_wrong"]) assert.equal(decide(initState(), n(i, { distress: true })).move, "safeguard");
});
test("diversion is parked with a promise; a push on it gets a bounded detour; the detour serves the park", () => {
  const a = decide(initState(), n("diversion", { topic: "favourite cricketer" }));
  assert.equal(a.move, "park"); assert.equal(a.state.later.length, 1); assert.equal(a.park.promise, "after this question");
  const b = decide(a.state, n("insistence"));
  assert.equal(b.move, "detour"); assert.ok(b.state.later[0].servedAt);
  assert.equal(dueParked(b.state, "before_wrap"), null);
});
test("a repeated diversion on the same topic is treated as insistence even if the model labels it diversion again", () => {
  const a = decide(initState(), n("diversion", { topic: "Virat or Rohit" }));
  assert.equal(decide(a.state, n("diversion", { topic: "Virat" })).move, "detour");
});
test("out-of-bounds is declined, never parked or served, even when insisted", () => {
  const a = decide(initState(), n("out_of_bounds"));
  assert.equal(a.move, "decline"); assert.equal(a.state.later.length, 0);
  assert.equal(decide(a.state, n("insistence_oob")).move, "decline");
  assert.equal(decide(initState(), n("diversion", { inBounds: false })).move, "decline");
});
test("a language switch rides on the content move and persists", () => {
  const a = decide(initState({ lang: "english" }), n("clarify", { also: ["language_switch"], langTo: "hindi" }));
  assert.equal(a.move, "rephrase"); assert.equal(a.mods.lang, "hindi"); assert.equal(a.state.lang, "hindi");
});
test("change of topic and boredom offer a choice, never an end", () => {
  for (const i of ["change_topic", "boredom"]) { const r = decide(initState(), n(i)); assert.equal(r.move, "offer_choice"); assert.equal(r.end, false); }
});
test("visual / game requests go to the stage with a child_request source", () => {
  assert.equal(decide(initState(), n("visual_request")).studio.source, "child_request");
  assert.equal(decide(initState(), n("game_request")).move, "play");
});
test("an answer plus a curiosity question: graded AND parked", () => {
  const r = decide(initState(), n("answer_wrong", { also: ["curiosity_offlesson"], topic: "sky blue" }));
  assert.equal(r.move, "grade"); assert.equal(r.state.later.length, 1);
});
test("parked questions come back when the item resolves, else before the wrap", () => {
  const a = decide(initState({ itemOnTable: false }), n("curiosity_offlesson", { topic: "black hole" }));
  assert.equal(dueParked(a.state, "item_resolved"), null);
  assert.equal(dueParked(a.state, "before_wrap").topic, "black hole");
});
