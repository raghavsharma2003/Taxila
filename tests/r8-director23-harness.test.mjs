// dc-r8-director23 harness (main's 033 item 8): cardWholeAgain reads a one-sentence card that has a shorter question (c5-t01 steady 10,
// stuck 14, steering 10); hindiNewWords reads a Hindi request answered with the switch line and the card only (c4 stuck 10, steering 8);
// a question states no answer, so its numbers are no false key (c5-t02 steady 132).
import { test } from "node:test";
import assert from "node:assert/strict";
import { PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { falseAnswerNumbers } from "../evals/hybrid-side-by-side/checks.mjs";

test("a question's numbers are its givens, never a false key", () => {
  assert.deepEqual(falseAnswerNumbers("Abhi yeh sahi nahi hai. Anjali ke paas ribbon ka 5/12 hai aur Imran ke paas 5/6, toh kiska ribbon lamba hai?", { keys: new Set(["5/6"]) }), []);
  assert.deepEqual(falseAnswerNumbers("Iska jawab 7/9 hai.", { keys: new Set(["5/6"]) }), ["7/9"]);
});

test("cardWholeAgain: a one-sentence card with a question clause after its colon, said whole again after help, is flagged", () => {
  const card = "Neeche ki line par sadak 6 barabar gaps mein hai, aur khilona pehle mark par ruka: woh 0 se kitne kilometre par hai?";
  const ctx = { prevCls: "no_evidence", prevT: { text: card }, prevPrevT: null, script: {}, o: {} };
  const r = { who: "teacher", card, text: `Neeche ki line bhi wahi sadak hai. ${card}`, pageParts: [{ part: "simpler" }, { part: "card" }] };
  assert.match(PREDICATES.cardWholeAgain("L", r, 1, ctx) ?? "", /whole card said again/);
  // (a card that is only its question is said as its question)
  const q = "Poore hexagon ka parimap kitna hua?";
  assert.equal(PREDICATES.cardWholeAgain("L", { who: "teacher", card: q, text: `Har bhuja jodo. ${q}`, pageParts: [{ part: "simpler" }, { part: "card" }] }, 1, { ...ctx, prevT: { text: q } }), null);
});

test("hindiNewWords: the switch line and the card only is a Hindi request with no new words", () => {
  const ctx = { prevRead: "no_evidence · language", o: { teacherTexts: ["Yeh roti dekho.", "Neeche wala number."] } };
  const card = "Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda 1/2 hai ya 1/1?";
  assert.match(PREDICATES.hindiNewWords("L", { who: "teacher", card, text: `Haan, Hindi mein samjhaati hoon. ${card}` }, 1, ctx) ?? "", /no new words/);
});

// (dc-r8-director24 item 8: "8/8 = 1" names a whole and "1/1 ka matlab hota poori roti" explains a term — no false key: c5-t01 steady 92,
// c4 stuck 26)
test("director24: a whole and an explained term are no false key", () => {
  assert.deepEqual(falseAnswerNumbers("8/8 = 1, matlab 0 se 1 bhar gaya.", { keys: new Set(["7/6"]) }), []);
  assert.deepEqual(falseAnswerNumbers("1/1 ka matlab hota poori roti, par rangin tukda toh roti ka sirf ek aadha hai.", { keys: new Set(["1/2"]) }), []);
  assert.deepEqual(falseAnswerNumbers("Iska jawab 7/9 hai.", { keys: new Set(["5/6"]) }), ["7/9"]);
});
