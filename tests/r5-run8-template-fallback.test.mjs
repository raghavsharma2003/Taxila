// QA on 14.4.1, run 8 (aadae80b t1), end to end through the seam: the child asks for a picture with no subject, the live
// board fails, and the kit's own template (c6-maths-ch06-t01: a field drawn as a rect, "50 m" / "30 m" outside it, arrows,
// a numwork) is the board left. Before cf25ca72 answersRequest refused it (isDrawing did not count a rect) and the slot
// failed with no line saying why ("[studio] template board refused: not_the_ask(picture)" since). The live board's
// failure is injected (planWhiteboard), so the fallback path runs on demand; a live run hits it only at random.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
const seam = await import("../server/studio/seam.js");

test("run 8: a picture ask whose live board fails gets the kit's template board, not a failed slot", async () => {
  // the board-sync deadline is set inside the test and restored (npm test runs every file in one process)
  const prevSync = process.env.TAXILA_BOARD_SYNC_MS;
  process.env.TAXILA_BOARD_SYNC_MS = "300";
  try {
    const kit = kitFromFile(getTopic("c6-maths-ch06-t01"));
    let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX, classLevel: 6, ageBand: "10-12" }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    r = step(r.state, { event: "turn", kit, cls: { ...cls("no_evidence"), request: { type: "visual", kind: "picture", whole: true } }, text: "picture dikhao", now: 20000 });
    const script = r.state.module?.params?.script;
    assert.ok(script?.ops?.some((o) => o.op === "rect"), "precondition: the Director's rung is the rect field board");
    const id = "r8-seam";
    seam.studioSeam.prefetch({ lessonId: id, purpose: "practice" });
    seam._setDeps({ planWhiteboard: async () => ({ ok: false, usd: 0, why: "planner_error" }), q: async () => [] });
    const line = "picture: ek rectangle ki opposite sides 50 metre aur 30 metre hain. Aap boundary ki chaar sides kaise likhenge?";
    const intent = { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", skillId: "s", need: "explain", beat: "explain", neededAtMs: 0, priority: "on_cue",
      request: { kind: "picture" }, style: { band: "B3", lang: "hinglish", motion: "lively" } };
    const ack = seam.studioSeam.requestIntent({ intent, line: { lessonId: id, text: line }, mode: "fresh", kit, fallback: { script } });
    assert.equal(ack?.state, "planning");
    await new Promise((res) => setTimeout(res, 1500));
    const s = seam.slotSnapshot(id, intent.intentId);
    assert.equal(s?.state, "revealed", `the slot ${s?.state ?? "?"}: the template was refused for the picture ask`);
    assert.equal(s?.artifact?.kind, "whiteboard");
  } finally { if (prevSync === undefined) delete process.env.TAXILA_BOARD_SYNC_MS; else process.env.TAXILA_BOARD_SYNC_MS = prevSync; }
});

test("38aad918: a board slot that fails says why (the live board's reason and the template's), never why: null", async () => {
  const prevSync = process.env.TAXILA_BOARD_SYNC_MS;
  process.env.TAXILA_BOARD_SYNC_MS = "300";
  try {
    const id = "r8-seam-why";
    seam.studioSeam.prefetch({ lessonId: id, purpose: "practice" });
    seam._setDeps({ planWhiteboard: async () => ({ ok: false, usd: 0, why: "planner_error" }), q: async () => [] });
    const intent = { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", skillId: "s", need: "explain", beat: "explain", neededAtMs: 0, priority: "on_cue",
      request: { kind: "picture" }, style: { band: "B3", lang: "hinglish", motion: "lively" } };
    seam.studioSeam.requestIntent({ intent, line: { lessonId: id, text: "Dekhiye, ek triangle ke teen corners hote hain." }, mode: "fresh", kit: { topicId: "x", content: [] } });
    await new Promise((res) => setTimeout(res, 1500));
    assert.equal(seam.slotSnapshot(id, intent.intentId)?.state, "failed");
    assert.equal(seam._lesson(id)?.pieces?.get(intent.intentId)?.failWhy, "live:planner_error template:none");
  } finally { if (prevSync === undefined) delete process.env.TAXILA_BOARD_SYNC_MS; else process.env.TAXILA_BOARD_SYNC_MS = prevSync; }
});
