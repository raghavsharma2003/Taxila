// round 7 (S4, director3 prep): a picture asked for in the teach phase (no card up) is drawn from the worked example's faded
// step, so the board shows the lesson's own shape: c6 perimeter gets Studio's measured@1 (the 50 m × 30 m park), not nothing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { boardItemOf, whiteboardIntentOf } from "../server/brain/propose.js";
import { preselect } from "../server/stagecraft/board-first.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
import { kitPath } from "./fixtures/kit-path.mjs";
import { describe } from "node:test";

describe("r7-brain-board-item (kit path: lesson scripts off)", () => {
kitPath();
test("a teach-phase picture ask is drawn from the worked example's faded step; the move's own card wins when there is one", () => {
  const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: 20_000 });
  r = step(r.state, { event: "turn", kit: K, cls: { ...cls("no_evidence"), request: { type: "visual", kind: "diagram", whole: true } }, text: "picture dikhao", now: 40_000 });
  assert.equal(r.move.request, "visual");
  const item = boardItemOf(r.state, K, findItem);
  assert.equal(item?.id, r.state.fadeItem.id);
  const pick = preselect(whiteboardIntentOf({ lessonId: "L-board-item", turn: r.state.turn, beat: { id: "visual", type: "explain" }, next: r.state, kit: K, item, line: { text: "" } }), { kit: K });
  assert.equal(pick?.template, "measured@1");
  // no picture ask, no card: no item (the board as before)
  assert.equal(boardItemOf({ lastMove: { kind: "explain" }, fadeItem: r.state.fadeItem }, K, findItem), null);
});
});
