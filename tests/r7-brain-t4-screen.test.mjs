// round 7 T4 (dc-r7-teaching-scripts, the screen contract): a scripted beat's board is on its way this turn, so her pointing
// at it is not a false screen claim; with the board on the ui, what she names is checked against what it shows. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { screenProblem } from "../server/director/say.js";

const board = { tray: "studio", studioSlot: { artifact: { kind: "whiteboard", archetype: "whiteboard", script: { ops: [{ text: "10 m" }, { text: "6 m" }, { text: "rectangle" }], facts: { onScreen: { shape: "rectangle" } } } } } };

test("a scripted board on its way: pointing at it is not a screen problem", () => {
  assert.equal(screenProblem("Screen par rectangle dekho: upar 10 m.", {}, null, { coming: true }), false);
  assert.equal(screenProblem("Screen par rectangle dekho: upar 10 m.", {}, null, { coming: false }), true, "nothing on screen and nothing coming");
});

test("with the board on the ui her words are checked against it", () => {
  assert.equal(screenProblem("Board par rectangle dekho: upar 10 m.", board, null), false);
  assert.equal(screenProblem("Board par triangle aur circle dekho.", board, null), true, "names what is not there");
});
