// 14.4.2 (d; sim lab 1b3bb12c p66 / p68 stuck probes: "Maine toh bola tha na", the same card posed again after a right
// answer). A reply the model read as right but corroboration could not verify against the item's verified forms
// (unsupported_credit), twice on one card, is not posed a third time: a verdict-neutral line and the next card. No verdict,
// no evidence, never marked stuck: the card stays due for another day. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import * as SH from "../server/director/shapes.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const unverified = { ...NE, source: "model", corroboration: "unsupported_credit:low_cover" };
function toCard() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, NE);
  return r;
}

test("two unverified right-looking answers on one card: no third pose, a verdict-neutral line, the next card; the card stays due", () => {
  const r = toCard(); const card = r.move.itemId;
  const once = turn(r, unverified, { text: "taaki dhool aur machchar andar na jaayein" });
  assert.equal(once.move.itemId, card, "the first time it is asked again, as before");
  const twice = turn(once, unverified, { text: "maine toh bola tha na, dhool aur machchar" });
  assert.notEqual(twice.move.itemId, card, "never posed a third time");
  assert.ok(twice.move.shape.includes(SH.unverifiedMoveOn()), twice.move.shape);
  assert.doesNotMatch(SH.unverifiedMoveOn(), /\b(?:correct|right answer|well done|shabash)\b/i);
  assert.ok(twice.state.skipped.includes(card), "left with no verdict");
  assert.ok(!twice.state.itemsDone.includes(card), "never done");
  assert.ok(!(twice.state.stuckIds ?? []).includes(card), "never marked stuck: due again another day");
  assert.ok(!(twice.state.answers ?? []).some((a) => a.itemId === card), "no answer recorded for it");
});

test("control: plain unclear replies (no model 'correct') keep today's path", () => {
  const r = toCard(); const card = r.move.itemId;
  const a = turn(r, NE, { text: "hmm" });
  const b = turn(a, NE, { text: "umm" });
  assert.equal(a.move.itemId, card);
  assert.ok(!b.move.shape.includes(SH.unverifiedMoveOn()));
});
