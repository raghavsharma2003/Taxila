// release 13 (A), r12 RCA failure 3 (owner lesson a95d2ff1 turns 18-25): "मेरे को आलू के बारे में पढ़ना है", "Different subject",
// the chip "Show me a picture", "आलू दिखाओ" — she offered "aloo par picture", then said "screen par aloo dekho" over a maths
// table. The floor: a picture nothing can make is never offered and never claimed; asked for, she says plainly she cannot
// show it and gives it in words, and no board is asked for. Pure (fixture kit; the classifier's bytes only).
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { requestOf, freeSubjectOf } from "../server/director/requests.js";
import { whiteboardAskOf } from "../server/brain/propose.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const said = (r, text, request) => {
  const fast = classifyFast({ target: targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId)), childText: text, typed: false });
  const c = fast.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: fast.flags, request: fast.request };
  return request && !c.request ? { ...c, request } : c;      // the model's UNDERSTAND note gave change_topic / visual in the lesson
};
const toTeach = () => turn(step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 }), NE);
const L18 = "मेरे को कुछ और पढ़ना है, मेरे को आलू के बारे में पढ़ना है। कुछ और पढ़ना है मेरे को। बहुत हो गया आपका अब";

test("the child's subject is read in either script; generic words are not subjects", () => {
  assert.equal(freeSubjectOf(L18), "आलू");
  assert.equal(freeSubjectOf("अरे नहीं दिख रहा कोई आलू दिखाओ भई आलू दिखाओ।"), "आलू");
  assert.equal(freeSubjectOf("aloo ki photo dikhao"), "aloo");
  assert.equal(freeSubjectOf("मेरे को उसके आप कोई फोटो दिखाओ ना"), null);
  assert.equal(freeSubjectOf("अरे मेरे को सोचना नहीं है यार, मेरे को इमेज दिखाओ यार"), null);
  // b08fe8a7 turn 4 (release-13 replay): "diagram" in Devanagari is the kind of picture, never a subject
  assert.equal(freeSubjectOf("नहीं, मेरे को आप डायग्राम दिखाओ, मुझे देखना है डायग्राम।"), null);
  assert.deepEqual(requestOf(L18), { type: "topic", subject: "आलू", whole: false });
});

// round 5 (stream 2, the board; brief: "aloo dikhao" must be drawn): a thing outside the kit that a plain labelled sketch can
// show is now sketched on the board for the ask, honestly (no photo promised, never pointed at before it is there); the floor
// (A) stands for anything else (director/state.js drawableSubject; tests/r5-board-request.test.mjs)
test("A → round 5: 'Different subject' after aloo offers no picture chip; the picture chip gets a board sketch of aloo, honestly", () => {
  let r = toTeach();
  r = turn(r, said(r, L18, { type: "change_topic", whole: true }), { text: L18 });   // turn 18 (trace: conv2.note.change_topic)
  assert.equal(r.state.offTopic?.subject, "आलू");
  const diff = turn(r, said(r, "Different subject, different subject.", { type: "change_topic", whole: true }), { text: "Different subject, different subject." });
  assert.ok(!(diff.ui.chips ?? []).some((c) => c.id === "req:visual"), "no 'Show me a picture' for a picture nothing can make");
  assert.match(diff.move.shape, /never offer a picture/);
  const pic = turn(diff, cls("no_evidence"), { chipId: "req:visual", text: "Show me a picture" });   // turn 22
  assert.equal(pic.move.request, "visual");
  assert.equal(pic.move.see?.subject, "आलू", "the board is told what to draw: the subject they named");
  assert.equal(pic.move.see?.off, true);
  assert.match(pic.move.shape, /board draws a simple sketch of it/);
  assert.match(pic.move.shape, /never send their eyes to the screen or the board/);
  assert.doesNotMatch(pic.move.shape, /it is on the screen now/, "never pointed at before it is there");
  // and the board IS asked for on that turn (brain/propose.js), on any lane
  assert.equal(whiteboardAskOf({ beat: { id: "b", type: "explain" }, lane: "cascade", late: false, strained: false, move: pic.move, requested: true }).proposals[0]?.kind, "ask_whiteboard");
});

test("A: a picture of today's idea is unchanged (the kit's subject, or no subject)", () => {
  const r = toTeach();
  const v = turn(r, said(r, "show me a diagram"), { text: "show me a diagram" });
  assert.equal(v.move.request, "visual");
  assert.equal(v.move.visual, "diagram");
});

test("A: the subject is forgotten after a few turns, and a subject the kit teaches is never off-topic", () => {
  let r = toTeach();
  r = turn(r, said(r, L18, { type: "change_topic", whole: true }), { text: L18 });
  for (let i = 0; i < 5; i++) r = turn(r, NE);
  const pic = turn(r, NE, { chipId: "req:visual", text: "Show me a picture" });
  assert.equal(pic.move.request, "visual", "five turns later the chip is a picture of today's idea again");
  const term = String(K.skills[0].title).split(/\s+/).find((w) => w.length > 4).toLowerCase();
  const on = toTeach();
  const v = turn(on, said(on, `${term} ki photo dikhao`), { text: `${term} ki photo dikhao` });
  assert.equal(v.move.request, "visual", `'${term}' is in the kit: the board answers it`);
});
