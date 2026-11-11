// r7 stream E (main's calls on LESSON-REPLAY-d10, 2026-11-08): when the question card changes against the board.
// (3a) A paged turn's new card pins when the LAST page turns, chip or not: the director10 shapes T9-0 (verdict on the
//      triangle, then the hexagon card's board) and T81-0 (verdict on the 60 m square, then the rectangle's board).
// (3b) While the board is marked `ofCard: false` (placeholder until Brain names the field), the open card waits.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const C = await import("../src/child/lesson/cardTiming.ts");
const { boardOnTray } = await import("../src/child/lesson/boardPage.ts");

// the paged scripts as the server writes them (board-first.js pagesBoard: page 1 turns at the then-prompt's clause)
const T9 = { switches: [{ clause: 2, atMs: 6500 }] };            // "…method use kiya." | "Iski chhah bhujayein…"
const T81 = { switches: [{ clause: 1, atMs: 5250 }] };           // "Aadha parimap," | "Teen vikalp hain:…"
const triangleCard = { text: "Toh is triangle ka parimap kitna hai?" };
const hexagonCard = { text: "Toh is hexagon ka parimap kitna hai?" };
const squareCard = { text: "Toh is varg ki ek bhuja kitni lambi hai?" };
const rectCard = { text: "Toh is aayat ki chaudai kitni hai?" };

function walk(board, start, newAsk, verdict) {
  const steps = [];
  let it = C.cardOnAsk(start, newAsk, { paged: C.isPaged(board), verdict });
  steps.push(["first frame", it.ask?.text, it.answer]);
  const last = C.lastPage(board);
  const turn = C.pageTurnMs(board.switches[0]);
  for (const ms of [0, turn - 1, turn, turn + 4000]) {
    it = C.cardOnPage(it, C.pageAt(board, ms), last);
    steps.push([ms, it.ask?.text, it.answer]);
  }
  it = C.cardOnHandover(it);
  steps.push(["hand-over", it.ask?.text, it.answer]);
  return steps;
}

test("T9-0 with the child's answer on the card: the old card and its chip stay through the verdict page, the hexagon card pins at the page turn", () => {
  const steps = walk(T9, { ask: triangleCard, answer: { text: "15 cm", verdict: "correct" } }, hexagonCard, true);
  assert.deepEqual(steps.map((s) => s[1]), [triangleCard.text, triangleCard.text, triangleCard.text, hexagonCard.text, hexagonCard.text, hexagonCard.text]);
  assert.equal(steps[2][2].text, "15 cm", "the verdict lands on THEIR answer before the switch");
  assert.equal(steps[3][2], null, "the new card starts with no answer");
});

test("T9-0 with no chip: the new card waits for the last page too (never over the old triangle)", () => {
  const steps = walk(T9, { ask: triangleCard, answer: null }, hexagonCard, false);
  assert.deepEqual(steps.map((s) => s[1]), [triangleCard.text, triangleCard.text, triangleCard.text, hexagonCard.text, hexagonCard.text, hexagonCard.text]);
});

test("T81-0, chip and no chip: the rectangle card pins at the page turn, not at her first frame and not at the hand-over", () => {
  for (const answer of [{ text: "15 m", verdict: "correct" }, null]) {
    const steps = walk(T81, { ask: squareCard, answer }, rectCard, !!answer);
    assert.equal(steps[0][1], squareCard.text, "first frame: still the square's card");
    assert.equal(steps[2][1], squareCard.text, "1 ms before the switch");
    assert.equal(steps[3][1], rectCard.text, "at the switch");
  }
});

test("a real clause onset moves the card's switch with the board (the player's own rule)", () => {
  assert.equal(C.pageTurnMs(T81.switches[0], [0, 6100]), 6100);
  assert.equal(C.pageAt(T81, 5600, [0, 6100]), 0);
  assert.equal(C.pageAt(T81, 6100, [0, 6100]), 1);
  assert.equal(C.pageTurnMs(T81.switches[0], [0, undefined]), 5250);
});

test("a last page that never turns: the hand-over still gives the new card", () => {
  let it = C.cardOnAsk({ ask: squareCard, answer: null }, rectCard, { paged: true, verdict: false });
  it = C.cardOnPage(it, 0, 1);
  assert.equal(it.ask.text, squareCard.text);
  assert.equal(C.cardOnHandover(it).ask.text, rectCard.text);
});

test("unpaged turns keep today's rule: at once, or at the hand-over when a verdict grades the answer", () => {
  assert.equal(C.newAskWhen({ paged: false, verdict: false, hasAnswer: false }), "now");
  assert.equal(C.newAskWhen({ paged: false, verdict: true, hasAnswer: true }), "handover");
  assert.equal(C.newAskWhen({ paged: false, verdict: true, hasAnswer: false }), "now");
  assert.equal(C.newAskWhen({ paged: true, verdict: true, hasAnswer: true }), "lastPage");
  const it = C.cardOnAsk({ ask: squareCard, answer: null }, rectCard, { paged: false, verdict: false });
  assert.equal(it.ask.text, rectCard.text);
});

test("(3b) the card waits only while an open question meets a board marked not its own, before the hand-over", () => {
  const board = { ofCard: true, switches: [{ clause: 1, atMs: 4000, ofCard: false }] };
  assert.equal(C.pageOfCard(board, 0), true);
  assert.equal(C.pageOfCard(board, 1), false);
  assert.equal(C.pageOfCard({ switches: [] }, 0), undefined, "no flag on the wire: today's behaviour");
  const base = { hasAsk: true, hasAnswer: false, handedOver: false };
  assert.equal(C.cardWaiting({ ...base, ofCard: false }), true);
  assert.equal(C.cardWaiting({ ...base, ofCard: true }), false);
  assert.equal(C.cardWaiting({ ...base, ofCard: undefined }), false);
  assert.equal(C.cardWaiting({ ...base, ofCard: false, handedOver: true }), false, "restores at the hand-over");
  assert.equal(C.cardWaiting({ ...base, ofCard: false, hasAnswer: true }), false, "an answered card is not waiting");
});

test("boardOnTray reads switches and the placeholder flag from the studio slot, and nothing from other pieces", () => {
  const slot = { artifact: { kind: "whiteboard", script: { scriptId: "s1", line: { lessonId: "L", teacherReplySeq: 4 }, ofCard: false, switches: [{ clause: 1, atMs: 5250, ofCard: true }, { bad: 1 }] } } };
  const b = boardOnTray(slot);
  assert.equal(b.ofCard, false);
  assert.deepEqual(b.switches, [{ clause: 1, atMs: 5250, ofCard: true }]);
  assert.equal(b.key, "s1:L:4");
  assert.equal(boardOnTray({ artifact: { kind: "play" } }), null);
  assert.equal(boardOnTray(null), null);
  assert.equal(boardOnTray({ artifact: { kind: "whiteboard", script: { scriptId: "x" } } }).ofCard, undefined);
});

test("the Desk uses these rules (no second copy of the card timing)", () => {
  const src = fs.readFileSync(new URL("../src/child/lesson/useDesk.ts", import.meta.url), "utf8");
  assert.match(src, /cardOnAsk\(it, ask, \{ paged: isPaged\(cardBoard\), verdict: !!ui\.verdict \}\)/);
  assert.match(src, /cardOnPage\(it, boardPage, lastPage\(cardBoard\)\)/);
  assert.match(src, /cardOnHandover\(it\)/);
  assert.match(src, /askWaiting: cardWaiting\(/);
});
