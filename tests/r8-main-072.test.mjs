// main, integration 72 (dc-r8-director23 C): an authored caption is written against one view of its board. It is said only when that
// is the view this turn draws. Found on the merged tree by tests/r7-brain-v6-altview.test.mjs: a bar card whose second view was a
// number line got the caption written for its circle ("Is gol ko …").
import { test } from "node:test";
import assert from "node:assert/strict";
import { viewCaptionOf, viewKindOf } from "../server/brain/say.js";
import { altCall } from "../server/stagecraft/board-first.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const T = "c5-maths-ch02-t02";
// (d29 final: Learning 017 redrew c5-t02's boards part by part — the bar board whose own second view is its circle is now the 4-part one)
const board = { template: "fraction-parts@1", params: { parts: 4, shade: 1, whole: "bar" } };

test("a caption is said over the view it was written for, and not over another kind of view", () => {
  const kit = kitFromFile(getTopic(T));
  const state = { heldUp: { board }, lastMove: {} };
  const own = viewKindOf(altCall(board));
  assert.equal(own, "round", "this bar board's own second view is its circle");
  const cap = viewCaptionOf(kit, state, "hinglish");
  assert.ok(cap && /gol/.test(cap), `the board has a caption about the circle: ${cap}`);
  assert.equal(viewCaptionOf(kit, state, "hinglish", { drawn: "round" }), cap);
  assert.equal(viewCaptionOf(kit, state, "hinglish", { drawn: "line" }), null, "a number line is drawn: the circle's caption is not said");
  assert.equal(viewCaptionOf(kit, state, "hinglish", { drawn: null }), cap, "the kind is not known: as before");
});

test("the kind of a view: a call's or a hint's view; bars with none are parts", () => {
  assert.equal(viewKindOf("line"), "line");
  assert.equal(viewKindOf("bars"), "parts");
  assert.equal(viewKindOf({ view: "wholes" }), "wholes");
  assert.equal(viewKindOf({ template: "fraction-bars@1", bars: [] }), "parts");
  assert.equal(viewKindOf("held"), null);
  assert.equal(viewKindOf(null), null);
});
