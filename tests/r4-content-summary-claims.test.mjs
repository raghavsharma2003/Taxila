// Round 4 · stream 2, journey audit #13 (A31 vs A40): the child's summary said "On your own" for the pad answer the
// parent's evidence page called "Right, with a hint". One claim source: with the lesson's engine rows read, the
// summary's tick and "with a hint" are engineTick of the card's own turn, as on the parent page (patch request 04).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lessonSummary } from "../server/routes/lesson.js";
import { engineTick } from "../server/routes/parent.js";

const state = { did: [{ kind: "item", itemId: "i1", ask: "3/4 ka aadha?", answer: "3/8", verdict: "correct", verified: true, withHelp: false, seq: 7, turn: 4 }] };
const row = (over) => ({ turnSeq: 7, cls: "item.open", result: "right", firstTryUnaided: true, scored: true, skillIds: [], ...over });

describe("r4: the child's summary and the parent's evidence make one claim", () => {
  it("a right answer that was not first-try-unaided reads 'with a hint' on both", () => {
    const rows = [row({ result: "right_hint", firstTryUnaided: false })];
    const card = lessonSummary(state, { topic: null, teacher: null, rows }).cards[0];
    assert.deepEqual({ tick: card.tick, withHelp: card.withHelp }, engineTick(rows, 7));
    assert.equal(card.withHelp, true);
  });
  it("first try, unaided: 'on your own' on both", () => {
    const rows = [row({})];
    const card = lessonSummary(state, { topic: null, teacher: null, rows }).cards[0];
    assert.equal(card.tick, true); assert.equal(card.withHelp, false);
  });
  it("no engine row for the turn (rows not read, or the row not written yet): the lesson's own record stands", () => {
    assert.equal(lessonSummary(state, { topic: null, teacher: null }).cards[0].withHelp, false);
    assert.equal(lessonSummary(state, { topic: null, teacher: null, rows: [row({ turnSeq: 99, firstTryUnaided: false })] }).cards[0].withHelp, false);
  });
});
