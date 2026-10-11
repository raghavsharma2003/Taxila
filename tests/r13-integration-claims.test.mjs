// Release 13 integration (ms-r13-claims-in-flight): the screen-claim predicate (4A, r4c-dc-screen-claims-by-predicate)
// checks a pointing sentence against what is mounted. Packaged owner-5 / round2 batteries showed it flagging legitimate
// pointing in two cases, which then lost their pointing in the repair (V2.no_reference x5): (1) the piece the child asked
// for THIS turn is still in flight when her line is checked (the board is drawn in sync with her line, a game lands
// seconds later); (2) an interactive engine is mounted whose labels the guard cannot read. A drawn board (whiteboard, the
// explainer@1 rung) is still held to its words, so the owner's failures stay caught.
import { test } from "node:test";
import assert from "node:assert/strict";
import { screenProblem } from "../server/director/say.js";

const TABLE = { studioSlot: { slotId: "s", intentId: "i", artifact: { kind: "whiteboard", script: { ops: ["Recursive rule", "Explicit rule", "First term", "Nth term"].map((text, i) => ({ id: `t${i}`, op: "text", text })) } } } };

test("a piece in flight for this turn's request: pointing at it is not a false claim", () => {
  const line = "Chaliye, screen par game dekho: har sahi jawab par ek run milega!";
  assert.equal(screenProblem(line, { chips: [] }, { id: "m", engine: "explainer@1" }), true, "without the request a game claim with no play piece is false");
  assert.equal(screenProblem(line, { chips: [] }, { id: "m", engine: "explainer@1" }, { coming: true }), false);
});

test("an interactive engine's labels are unknown: a pointing sentence about it passes, as before release 13", () => {
  assert.equal(screenProblem("Screen par number line dekho: 0 se 1 ke beech 5 barabar gaps hain.", { chips: [] }, { id: "nl", engine: "numberline@1" }), false);
});

test("a board of shapes only carries no words to disprove a claim: pointing at its dots passes (ms-r13-claims-after-board)", () => {
  const dots = { studioSlot: { slotId: "s", intentId: "i", artifact: { kind: "whiteboard", script: { ops: Array.from({ length: 15 }, (_, i) => ({ id: `d${i}`, op: "circle", c: [20 + i * 20, 50], r: 6 })) } } } };
  assert.equal(screenProblem("Meher, look at the screen: 15 dots split into 3 equal groups, with 5 dots in each.", { chips: [], ...dots }, null), false);
});

test("a drawn board is still held to its words: the owner's 'board par aloo' over the rules table, and a game with nothing coming", () => {
  assert.equal(screenProblem("Kiko, screen par aloo dekho: mitti ke neeche gol tuber.", { chips: [], ...TABLE }, null), true);
  assert.equal(screenProblem("Kiko, board par dekhiye: Recursive rule aur Explicit rule.", { chips: [], ...TABLE }, null), false);
  assert.equal(screenProblem("Screen par game: left Recursive, right Explicit.", { chips: [{ id: "x" }] }, { id: "rung-s1", engine: "explainer@1" }), true);
});
