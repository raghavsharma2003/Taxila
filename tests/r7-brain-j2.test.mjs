// dc-r7-script-walk-v6-11 J2 (main's step 2): after the child answers her return question about their aside, she says ONE sentence of
// the reply model's (≤ 14 words, no question, no taste of hers, a content word of theirs), else a neutral joint, then the unit's next
// unsaid part. The sentence is held by replyToReturnOk; the dry matrix's returnReply predicate reads the turn (tests/r7-dry-matrix).
import { test } from "node:test";
import assert from "node:assert/strict";
import { replyToReturnOk, replyToReturnNoteOf } from "../server/brain/say.js";
import { PREDICATES, TWINS } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

test("J2: her one sentence on their answer passes only in its shape", () => {
  const said = "sixer, jab ball seedha bahar jaati hai";
  assert.ok(replyToReturnOk("Sixer wala pal sach mein zabardast lagta hoga.", said));
  for (const bad of [
    "Sixer kaun maarta hai?",                                         // a question
    "Mujhe bhi sixer bahut pasand hai.",                              // her own taste
    "Sixer ke baare mein hum baad mein baat karenge.",                // a promise
    "Ek sixer mein 6 run hote hain.",                                 // a number
    "Ball seedha bahar jaati hai, wah.",                              // their words said back
    "Yeh toh bahut mazedaar baat hai.",                               // none of their words
    "Sixer wala pal sach mein itna zabardast hota hoga ki poora stadium khade hokar taali bajata hoga.", // > 14 words
  ]) assert.equal(replyToReturnOk(bad, said), false, bad);
  assert.match(replyToReturnNoteOf(said, "cricket"), /and the child answered: "sixer/);
});

test("J2 predicate: a re-park, a question or no lesson after the reply is flagged; the joint or one sentence of theirs is not", () => {
  const ctx = (child) => ({ prevT: { returnSaid: true, text: "Ab tumhari cricket wali baat, usmein tumhe sabse achha kya lagta hai?" }, prevChild: child });
  const f = (text, child = "jab Virat chauka maarta hai, woh") => PREDICATES.returnReply({}, { who: "teacher", text }, 0, ctx(child));
  assert.equal(f("Theek hai. Do roti, bilkul ek jaisi. Kaunsa tukda bada hai?"), null);
  assert.equal(f("Virat wala pal sach mein zabardast lagta hoga. Do roti, bilkul ek jaisi."), null);
  assert.match(f("Yeh baantna poora hote hi Virat ki baat zaroor karenge. Ek pizza ke 4 barabar slice the."), /parked again/);
  assert.match(f("Virat kaun hai? Do roti, bilkul ek jaisi."), /a question/);
  assert.match(f("Virat wala pal sach mein zabardast lagta hoga."), /no lesson/);
});

test("twins: the predicate reads Learning's one list (data/lesson-twins.json), multi-word forms included", () => {
  assert.ok(TWINS.length >= 30);
  const tw = (text) => PREDICATES.twins({}, { text });
  assert.ok(tw("Is number line par sankhya rekha ke nishaan dekho."));
  assert.match(tw("Yeh rectangle ek aayat hai."), /rectangle/);
  assert.equal(tw("Question mark ke baad rekha dekho."), null);
});
