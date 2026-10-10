// round 4 (stream 4A; K's audit B04-04 and stream 5's journey audit #10, 2026-10-10): the Question card showed
// "Chaliye screen-game: 6 marked parts mein se 15 total parts dekhiye; ab bataiye, 6/15 ko kis chhote fraction mein…"
// (the question cut off) and "5 mein 5 kis place par hai?" for "0.5 mein 5 kis place par hai?". The card is the turn's
// own words, a whole question: never cut mid-word, never a number broken at its decimal point. Pure.
// The B04-04 line is the card as the audit's screenshot shows it; its last words were hidden by the cut, so the ending
// here ("likh sakte hain?") is assumed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { askText, askFromReply, ASK_MAX, ASK_HARD } from "../server/director/say.js";

test("B04-04: a long one-sentence question keeps its question, cut at a clause, never mid-word", () => {
  const card = askText("Chaliye screen-game: 6 marked parts mein se 15 total parts dekhiye; ab bataiye, 6/15 ko kis chhote fraction mein likh sakte hain?");
  assert.equal(card, "6 marked parts mein se 15 total parts dekhiye; ab bataiye, 6/15 ko kis chhote fraction mein likh sakte hain?");
  assert.ok(!card.includes("…"));
  // a number list or a ratio is never split as a clause
  assert.equal(askText("Yeh numbers dekho aur socho ki inme se kaunsa sabse bada hai aur kaunsa sabse chhota, phir bolo: 1205, 1250, 1025 aur 1520 mein se sabse bada kaunsa?"),
    "phir bolo: 1205, 1250, 1025 aur 1520 mein se sabse bada kaunsa?");
  const ratio = "Agar Riya ke paas laddoo aur barfi ka ratio 2 : 3 hai aur kul milakar pandrah mithaiyan hain to barfi kitni hongi jab sab dabbe mein rakhi jaayengi?";
  assert.equal(askText(ratio), ratio, "no clause to drop: shown whole (≤ ASK_HARD), never cut");
  assert.ok(ratio.length > ASK_MAX && ratio.length <= ASK_HARD);
});

test("journey audit #10 (B5): '0.5 mein 5 kis place par hai?' keeps its '0.'", () => {
  assert.equal(askFromReply("Achha. 0.5 mein 5 kis place par hai?"), "0.5 mein 5 kis place par hai?");
  assert.equal(askFromReply("Bahut accha socha tumne, ab ek naya sawaal dekhte hain jo decimals ke baare mein hai aur place value samjhata hai. 0.5 mein 5 kis place par hai?"),
    "0.5 mein 5 kis place par hai?");
  assert.equal(askText("Bahut accha socha tumne, ab ek naya sawaal dekhte hain jo decimals ke baare mein hai aur place value samjhata hai. 0.25 mein 2 kis place par hai?"),
    "0.25 mein 2 kis place par hai?");
});

test("as before: short text whole; trailing sentences that hold the question; one endless clause cut from the front", () => {
  assert.equal(askText("Kitne faces hain?"), "Kitne faces hain?");
  assert.equal(askText("Ek taraazu 0 se 2 kg tak hai, har 100 g par mark. Sui 1 kg ke baad 3 marks par hai. Vajan kitna hai, kg-g mein aur sirf g mein?"),
    "Sui 1 kg ke baad 3 marks par hai. Vajan kitna hai, kg-g mein aur sirf g mein?");
  const endless = askText("x ".repeat(100) + "Which one?");
  assert.ok(endless.length <= ASK_MAX && endless.startsWith("…") && endless.endsWith("Which one?"));
});
