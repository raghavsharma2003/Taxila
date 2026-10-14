// Release 13 integration review (ms-r13-clear-board-adjective, ms-r13-meta-subjects): the clear-the-board request is a
// COMMAND, never the adjective "saaf / clear / khali" ("I can't see the screen clearly" must never wipe the board), and the
// meta / pointing words a child uses for today's work are never a subject named outside it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { requestOf, clearBoardAsk, freeSubjectOf, genericSubject } from "../server/director/requests.js";

test("clear the board: the asks, in both scripts and either order", () => {
  for (const said of ["board clear karo", "ye board hatao", "board saaf karo", "थोड़ा बैकग्राउंड क्लियर करो", "screen saaf kar do",
    "board pe jo likha hai mita do", "hatao ye board", "please clear the board", "can you erase the board", "board clear kar sakti ho?",
    "recursive rules जो कचरा आ रहा है, हटाओ उसको", "board saaf karo na"]) {
    assert.equal(clearBoardAsk(said), true, said);
    assert.equal(requestOf(said)?.type, "clear_board", said);
  }
});

test("clear the board: never the adjective, a negation, or the sound", () => {
  for (const said of ["screen saaf nahi dikh raha", "board saaf nahi dikh raha didi", "background mein noise hai, saaf nahi sunai de raha",
    "screen clear nahi hai", "mujhe board clear nahi samajh aaya", "board pe likha hua saaf saaf dikh raha hai",
    "aapki awaaz saaf nahi aa rahi, background mein shor hai", "screen pe kuch saaf nahi hai", "board khali hai", "screen khaali kyun hai",
    "board pe kuch nahi hai, khali hai", "is it clear on the board", "the screen is not clear", "board mat hatao", "abhi board mat mitao",
    "mat hatao board", "don't clear the board", "background noise hatao", "board ko abhi nahi hatana"]) {
    assert.equal(clearBoardAsk(said), false, said);
    assert.notEqual(requestOf(said)?.type, "clear_board", said);
  }
});

test("a subject: meta and pointing words are not one; a real thing named is", () => {
  for (const said of ["is cheez ke baare mein batao", "pichle wale ke baare mein batao", "aaj ke topic ke baare mein batao"]) {
    assert.equal(freeSubjectOf(said), null, said);
    assert.notEqual(requestOf(said)?.type, "topic", said);
  }
  for (const [said, subject] of [["mujhe aloo ke baare mein padhna hai", "aloo"], ["cricket ke baare mein baat karo", "cricket"], ["mere dost ke baare mein baat karni hai", "dost"]]) {
    assert.equal(requestOf(said)?.subject, subject, said);
  }
  assert.equal(freeSubjectOf("आलू दिखाओ"), "आलू");
  for (const g of ["is cheez", "pichle wale", "ke topic", "iske", "सवाल", ""]) assert.equal(genericSubject(g), true, g);
  for (const r of ["aloo", "आलू", "cricket", "dinosaurs"]) assert.equal(genericSubject(r), false, r);
});
