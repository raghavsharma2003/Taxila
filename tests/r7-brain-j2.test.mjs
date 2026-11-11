// dc-r7-script-walk-v6-11 J2, replaced by dc-r8-director20 R1: after the child answers her return question about their aside, she says
// one of Learning's reply forms (data/lesson-aside-replies.json, chosen by brain/asideReplies.js) and then the unit's next unsaid part.
// The dry matrix's returnReply predicate reads the turn (tests/r7-dry-matrix).
import { test } from "node:test";
import assert from "node:assert/strict";
import { j2WordsOf } from "../server/brain/say.js";
import { PREDICATES, TWINS } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

// (retired 2026-11-11, dc-r8-director20 R1: the model's sentence and replyToReturnOk are gone; the reply is Learning's, chosen by code —
// tests/r8-aside-replies.test.mjs)

test("R1 predicate (was J2): a re-park, a form not Learning's or no lesson after the reply is flagged; a library form with their word is not", () => {
  const ctx = (child) => ({ prevT: { returnSaid: true, text: "Cricket mein tumhe sabse achha kya lagta hai?" }, prevChild: child });
  const f = (text, child = "jab Virat chauka maarta hai, woh") => PREDICATES.returnReply({}, { who: "teacher", text }, 0, ctx(child));
  assert.equal(f("Achha, theek hai. Do roti, bilkul ek jaisi. Kaunsa tukda bada hai?"), null);
  assert.equal(f("Achha, chauka! Theek hai. Do roti, bilkul ek jaisi."), null);
  assert.match(f("Yeh baantna poora hote hi Virat ki baat zaroor karenge. Ek pizza ke 4 barabar slice the."), /parked again/);
  assert.match(f("Virat wala pal sach mein zabardast lagta hoga. Do roti, bilkul ek jaisi."), /no form of Learning's/);
  assert.match(f("Achha, sixer! Theek hai. Do roti."), /no form of Learning's/, "a word they did not say");
  assert.match(f("Achha, chauka! Theek hai."), /no lesson/);
});

test("twins: the predicate reads Learning's one list (data/lesson-twins.json), multi-word forms included", () => {
  assert.ok(TWINS.length >= 30);
  const tw = (text) => PREDICATES.twins({}, { text });
  assert.ok(tw("Is number line par sankhya rekha ke nishaan dekho."));
  assert.match(tw("Yeh rectangle ek aayat hai."), /rectangle/);
  assert.equal(tw("Question mark ke baad rekha dekho."), null);
});

test("J2: the word picker (R1's {word}): the last noun-like word first, never a stop word, a verb form or a taste word", () => {
  // the words: the last noun-like word first, never a stop word, a verb form or a taste word; the topic when none is left
  assert.deepEqual(j2WordsOf("jab Virat chauka maarta hai, woh", "cricket"), ["chauka", "virat"]);
  assert.deepEqual(j2WordsOf("batting sabse achhi lagti hai", "cricket"), ["batting"]);
  assert.deepEqual(j2WordsOf("mujhe pasand hai", "cricket"), ["cricket"]);
});

// (retired 2026-11-11, R1: replyToReturnWhy is gone with the model's sentence)
