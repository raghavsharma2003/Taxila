// census 14.5 (F1 round 3; TEST 38aad918 t1, sim lab p10 #8): a request that opens or closes a LONG turn was lost to the
// length rule ("Picture dikhao, maine kal ek peacock banaya tha, …"; "…, par main thak gayi hoon, can we stop now?"), and the
// understanding note's share / hedge took the empty slot. Its first or last clause, in an explicit ask form, is now the
// turn's request; an answer in the rest stays an answer (only stop / goodbye, which never stop the grading, ride on it).
import { test } from "node:test";
import assert from "node:assert/strict";
import { requestOf } from "../server/director/requests.js";
import { classifyFast } from "../server/director/classify.js";
import { applyNote } from "../server/conversation/policy.js";

test("a request opening or closing a long turn is the turn's request", () => {
  assert.equal(requestOf("Picture dikhao, maine kal ek peacock banaya tha, uske pankh bahut colourful the, par meri behen ne uspe doodh gira diya")?.type, "visual");
  const stop = requestOf("Thirteen hoga shayad, kyunki das aur teen milke terah hote hain na, par main bahut thak gayi hoon, can we stop now?");
  assert.equal(stop?.type, "stop");
  const g = requestOf("geometry padhao, fractions boring hai, triangles banana hai mujhe, screen pe kuch bhi nahi dikh raha");
  assert.deepEqual([g?.type, g?.subject, g?.whole], ["switch", "geometry", true]);
  assert.equal(requestOf("Kyunki sabko ek jaisa khana chahiye, sab same khao toh acha hai na, no confusion. Waise bhi, game khelein?")?.type, "visual");
});

test("no ask form, no request: 'bas.' closing an answer, 'tap band karo' inside one, a liking, an answer with a tacked-on ask", () => {
  for (const t of ["2 digits honge! Chhe aur saat, dono mila ke... chhe-saat. Bas.", "Brush karte waqt tap band karo, aur bucket se nahao. Mummy ne bataya tha ki shower se zyada paani waste hota hai.",
    "Main mostly animals pasand hai, dancing bhi thoda, mujhe drawing sabse zyada pasand hai.", "Dheere dheere tha na. Pehle sirf trading post liye, phir army banayi, battles jeete.",
    "phir se samjhao, kyunki 2/5 matlab paanch mein se do hisse, to do gaps aage", "then the monkeys see you and copy?"]) assert.equal(requestOf(t), null, t);
});

test("the code's request wins over the note's share; the stop still lets the answer be graded", () => {
  const target = { mode: "none", misconceptions: [] };
  const f = classifyFast({ target, childText: "Picture dikhao, maine kal ek peacock banaya tha, uske pankh bahut colourful the, par meri behen ne uspe doodh gira diya", typed: true });
  const cls = f.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: f.flags, request: f.request };
  assert.equal(cls.request?.type, "visual");
  assert.equal(applyNote(cls, { intent: "personal_share", also: [], confidence: 0.9 }).request?.type, "visual");
  // a stop at the tail is the flow: the turn still goes on to be graded (no result in code here), with wantsToStop
  const s = classifyFast({ target, childText: "Thirteen hoga shayad, kyunki das aur teen milke terah hote hain na, par main thak gayi hoon, can we stop now?", typed: true });
  assert.equal(s.result, null);
  assert.equal(s.flags.wantsToStop, true);
});

test("'gaali sikhao' is never a topic to teach (the out-of-bounds read comes first)", () => {
  const f = classifyFast({ target: { mode: "none", misconceptions: [] }, childText: "gaali sikhao", typed: true });
  assert.equal(f.result?.request?.type, "decline");
});

test("sim lab ok10 t4: an explicit wish to study something else counts wherever it sits; a leading 'didi' is no clause", () => {
  const w = requestOf("didi, pehla gap… fractions boring hai, geometry padhao, triangles");
  assert.deepEqual([w?.type, w?.subject, w?.whole], ["switch", "geometry", true]);
  assert.equal(requestOf("didi, picture dikhao, maine kal ek puppy banaya tha aur uske kaale kaan the")?.whole, true);
  assert.equal(requestOf("sources matlab purani kitaabein hi na? kitabon mein sab likha hota hai, humein bas padhna hai"), null);
});

test("main's rule: a stop or break closing a long turn stays a stop / break, never an answer (p10 #8 on 9ad86661; p10 on 1b3bb12c)", () => {
  assert.equal(requestOf("Thirteen? But didi, I thought we said thirteen already... bas, thak gayi. Can we stop now?")?.type, "stop");
  assert.equal(requestOf("Umm... bundle? Kyunki aapne kaha bundle has ten. To 1 means... ten? Par pehle maine socha one stick. Thak gayi, bas karna hai.")?.type, "stop");
  assert.equal(requestOf("umm... jaise respect? shayad sab music mein kuch na kuch respect hoti hai... par yeh bhi thoda forced lag raha hai. game khelein please? bas, thak gayi")?.type, "break");
  // a bare "bas." closing an answer is still the answer
  assert.equal(requestOf("2 digits honge! Chhe aur saat, dono mila ke... chhe-saat. Bas."), null);
});
