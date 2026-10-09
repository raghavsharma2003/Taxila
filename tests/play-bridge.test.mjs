// Play → lesson bridge (src/play/lessonBridge.ts): only signed tokens cross, as module events of engine "play"; a level
// end is a milestone (the teacher takes a full turn), an impasse or a misconception asks for her nudge, acts stay home.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playToLesson } from "../src/play/lessonBridge.ts";

describe("play → lesson bridge", () => {
  const sent = [], send = (e) => sent.push(e);
  it("evidence rides along; seams map to milestones; acts and unnamed events are dropped", () => {
    assert.equal(playToLesson({ type: "interaction", name: "play_evidence", data: { token: "a.b" } }, "intent-1", send), true);
    assert.equal(playToLesson({ type: "interaction", name: "play_seam", data: { token: "c.d", seam: "level_end" } }, "intent-1", send), true);
    assert.equal(playToLesson({ type: "interaction", name: "play_seam", data: { token: "e.f", seam: "impasse" } }, "intent-1", send), true);
    assert.equal(playToLesson({ type: "interaction", name: "play_seam", data: { token: "g.h", seam: "prediction" } }, "intent-1", send), true);
    assert.equal(playToLesson({ type: "interaction", name: "play_act", data: { kind: "split" } }, "intent-1", send), false);
    assert.equal(playToLesson({ type: "interaction", name: "play_seam", data: {} }, "intent-1", send), false);
    assert.equal(playToLesson({ type: "graded" }, "intent-1", send), false);
    assert.equal(playToLesson({ type: "interaction", name: "play_evidence", data: { token: "a.b" } }, undefined, send), false);
    assert.deepEqual(sent.map((e) => [e.type, e.name, e.engine, Object.keys(e.data)[0]]), [
      ["interaction", "play_evidence", "play", "ev"], ["goal_met", "level_end", "play", "seam"], ["stuck", "impasse", "play", "seam"], ["interaction", "prediction", "play", "seam"]]);
  });
});
