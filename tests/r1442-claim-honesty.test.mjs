// QA 14.4.1 (P2): "nahi nahi, 160" (right, to her own "2 × 80?" in a worked step) got "Aapne jodne ki jagah kuch aur
// operation kiya": a mistake nothing graded. (1) director/say.js claimsMistake: a turn naming a mistake of theirs is caught
// on every verdict that is not a graded wrong (ungraded, attempt, unverified; a deny on a right one). (2) brain/say.js checks
// her own sum also when the next move poses a card, as long as no kit item was on the table (state.js priorItemId).
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { praiseProblem, claimsMistake, stripClaim } from "../server/director/say.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const CLAIM = "Aapne jodne ki jagah kuch aur operation kiya.";
afterEach(() => { replyDeps.chat = chat; });

test("a mistake of theirs named on an ungraded, attempt or unverified turn is a claim; on a right answer it is a deny", () => {
  for (const t of [CLAIM, "Aapne numerator aur denominator ki jagah badal di.", "Tumne galat operation lagaya, isliye answer badal gaya.", "You added instead of multiplying.", "Aapse yahan galti ho gayi."]) {
    for (const v of ["ungraded", "attempt", "unverified"]) assert.equal(praiseProblem(t, v), "claims", `${v}: ${t}`);
    assert.equal(praiseProblem(t, "correct"), "contradicts", t);
  }
  // a graded wrong answer may be named as wrong (the hint ladder's own business)
  assert.equal(praiseProblem(CLAIM, "not_yet"), null);
});

test("teaching lines, negations, questions and general rules are not claims", () => {
  for (const t of ["Yahan jodne ki jagah guna karte hain, kyunki har round same hai.", "Aapne koi galti nahi ki, chaliye aage.", "Aapne kaunsa operation kiya?",
    "Agar aapse galti ho jaye toh koi baat nahi.", "Bahut bachche yahan galti karte hain: woh sirf ek round lete hain.", "Your answer is not wrong, let us see why.",
    "Ek round = 2 × (50 + 30) = 160 m. Ab 3 rounds ke liye kya karenge?",
    // TEST, a repair turn: "jagah" is a place here, not "instead of"
    "Theek hai. Aapne 0 se 2 wali number line mein 1/2 ki jagah samajhne ki koshish ki."]) {
    assert.equal(claimsMistake(t), false, t);
    for (const v of ["ungraded", "attempt", "unverified"]) assert.notEqual(praiseProblem(t, v), "claims", `${v}: ${t}`);
  }
  assert.equal(stripClaim(`${CLAIM} Ek round 160 m hai. Ab 3 rounds?`), "Ek round 160 m hai. Ab 3 rounds?");
});

const posed = () => {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 12 && !r.move.itemId; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "x", now: (r.state.turn + 1) * 20_000 });
  assert.ok(r.move.itemId, "a card is posed");
  return r;
};

test("state.js keeps whether a kit item was on the table when the child spoke", () => {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  const firstHadItem = !!r.move.itemId;
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "x", now: 20_000 });
  assert.equal(r.state.priorItemId === null, !firstHadItem);
});

test("her own sum answered right, then the next card: 'jodne ki jagah kuch aur operation' never ships", async () => {
  const r = posed();
  replyDeps.chat = async () => ({ text: `${CLAIM} Chaliye agla sawaal dekhte hain.` });
  const out = await textReply({ instructions: "x", state: { ...r.state, priorItemId: null }, kit: K, childText: "nahi nahi, 160", verdict: "attempt",
    history: [{ who: "teacher", text: "Ek round ka perimeter: 2 × 80 = ___?" }], ui: r.ui, module: null });
  assert.ok(out.guard.caught.includes("deny"), JSON.stringify(out.guard));
  assert.doesNotMatch(out.reply, /jodne ki jagah|operation/);
});

test("an answer nothing graded (no sum of hers): the claim is caught and taken out", async () => {
  const r = posed();
  replyDeps.chat = async () => ({ text: `${CLAIM} Chaliye agla sawaal dekhte hain.` });
  const out = await textReply({ instructions: "x", state: { ...r.state, priorItemId: null }, kit: K, childText: "nahi nahi, 160 hoga", verdict: "attempt",
    history: [{ who: "teacher", text: "Ab socho, ek round mein kitna chalegi." }], ui: r.ui, module: null });
  assert.ok(out.guard.caught.includes("claim"), JSON.stringify(out.guard));
  assert.doesNotMatch(out.reply, /jodne ki jagah|operation/);
});
