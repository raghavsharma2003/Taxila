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

// 38aad918 t9-t11: a picture was revealed, the same turn's board replaced it, the board failed, and the turn ended on an
// empty screen. A picture now stays under the board until the board draws; a board that fails gives the screen back to it.
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const wbAsk = (id, extra = {}) => ({ intent: { intentId: `${id}:wb:9`, lessonId: id, kind: "whiteboard", skillId: "s", need: "explain", beat: "explain", neededAtMs: 0, priority: "on_cue",
  request: { kind: "picture" }, style: { band: "B3", lang: "hinglish", motion: "lively" } }, line: { lessonId: id, text: "Dekhiye, ek triangle ke teen corners hote hain." }, mode: "fresh", ...extra });

test("38aad918 t9: a board that fails over a picture leaves the picture on screen, and the turn's slot is that picture", async () => {
  const prevSync = process.env.TAXILA_BOARD_SYNC_MS;
  process.env.TAXILA_BOARD_SYNC_MS = "300";
  try {
    const id = "r8-keep-pic";
    seam.studioSeam.prefetch({ lessonId: id, purpose: "practice" });
    seam._setDeps({ planWhiteboard: async () => ({ ok: false, usd: 0, why: "planner_error" }), q: async () => [] });
    const pic = seam.studioSeam.showImage(id, { src: PNG, alt: "triangle", subject: "triangle", jobId: "j9" });
    assert.equal(pic?.state, "revealed");
    const ack = seam.studioSeam.requestIntent(wbAsk(id, { kit: { topicId: "x", content: [] } }));
    assert.equal(ack?.state, "planning");
    const got = await ack.ready;
    const L = seam._lesson(id);
    assert.equal(L.onScreen, pic.intentId, "the screen went back to the picture");
    assert.equal(L.pieces.get(pic.intentId)?.state, "revealed");
    assert.equal(got?.intentId, pic.intentId, "the turn's slot is the picture");
    assert.equal(seam.slotSnapshot(id, `${id}:wb:9`)?.state, "failed");
  } finally { if (prevSync === undefined) delete process.env.TAXILA_BOARD_SYNC_MS; else process.env.TAXILA_BOARD_SYNC_MS = prevSync; }
});

test("38aad918: a board that draws over a picture still retires the picture (as before)", async () => {
  const prevSync = process.env.TAXILA_BOARD_SYNC_MS;
  process.env.TAXILA_BOARD_SYNC_MS = "300";
  try {
    const kit = kitFromFile(getTopic("c6-maths-ch06-t01"));
    let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX, classLevel: 6, ageBand: "10-12" }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    r = step(r.state, { event: "turn", kit, cls: { ...cls("no_evidence"), request: { type: "visual", kind: "picture", whole: true } }, text: "picture dikhao", now: 20000 });
    const id = "r8-draw-over-pic";
    seam.studioSeam.prefetch({ lessonId: id, purpose: "practice" });
    seam._setDeps({ planWhiteboard: async () => ({ ok: false, usd: 0, why: "planner_error" }), q: async () => [] });
    const pic = seam.studioSeam.showImage(id, { src: PNG, alt: "field", subject: "field", jobId: "j1" });
    const ack = seam.studioSeam.requestIntent(wbAsk(id, { kit, fallback: { script: r.state.module?.params?.script },
      line: { lessonId: id, text: "picture: ek rectangle ki opposite sides 50 metre aur 30 metre hain. Aap boundary ki chaar sides kaise likhenge?" } }));
    const got = await ack.ready;
    const L = seam._lesson(id);
    assert.equal(got?.intentId, `${id}:wb:9`, "the board drew");
    assert.equal(L.onScreen, `${id}:wb:9`);
    assert.equal(L.pieces.get(pic.intentId)?.retiredWhy, "replaced");
  } finally { if (prevSync === undefined) delete process.env.TAXILA_BOARD_SYNC_MS; else process.env.TAXILA_BOARD_SYNC_MS = prevSync; }
});

test("QA on be9b766a (459069d8 t5, 7461bc46 t2): a piece taken down is traced as studio.slot.retired with its reason, never as a failed slot", async () => {
  const { flushTrace, _setTraceDeps, _resetTrace } = await import("../server/trace/writer.js");
  const rows = [];
  _setTraceDeps({ off: false, insert: async (rs) => { rows.push(...rs); return rs.length; } });
  try {
    const id = "r8-retired-trace";
    seam.studioSeam.prefetch({ lessonId: id, purpose: "practice" });
    const a = seam.studioSeam.showImage(id, { src: PNG, alt: "a", subject: "a", jobId: "ja" });
    const b = seam.studioSeam.showImage(id, { src: PNG, alt: "b", subject: "b", jobId: "jb" });   // replaces a
    seam.studioSeam.clearBoard(id);                                                            // clears b
    await flushTrace();
    const of = (intentId) => rows.filter((r) => r.data?.intentId === intentId && String(r.kind).startsWith("studio.slot."));
    assert.deepEqual(of(a.intentId).map((r) => [r.kind, r.data.why]).filter(([k]) => k !== "studio.slot.revealed"), [["studio.slot.retired", "replaced"]]);
    assert.deepEqual(of(b.intentId).map((r) => [r.kind, r.data.why]).filter(([k]) => k !== "studio.slot.revealed"), [["studio.slot.retired", "cleared"]]);
  } finally { _setTraceDeps({ insert: null, off: null }); _resetTrace(); }
});

test("QA on be9b766a (897a7453): triangle board, then a rocket board, then her line goes back to the triangle: the triangle board comes back", () => {
  const id = "r8-board-back";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  const page = (texts) => ({ v: 1, scriptId: texts[0], line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
    ops: [{ id: "p", op: "polygon", startMs: 0, endMs: 800, points: [[200, 300], [340, 100], [480, 300]] }, ...texts.map((t, i) => ({ id: `t${i}`, op: "text", startMs: 800 + i * 300, endMs: 1100 + i * 300, at: [120 + i * 200, 360], text: t, size: "m" }))] });
  L.pieces.set("wb-1", { intentId: "wb-1", slotId: "wb-1:slot", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script: page(["triangle", "corners"]) }, revealedTurn: 1, lines: ["Triangle ke teen corners hote hain."] });
  L.pieces.set("wb-2", { intentId: "wb-2", slotId: "wb-2:slot", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script: page(["rocket", "flame"]) }, revealedTurn: 2, prevBoard: "wb-1", lines: ["Rocket ki flame neeche hoti hai."] });
  L.onScreen = "wb-2";
  // a line about neither board: nothing comes back (the rocket board goes, as before)
  assert.equal(seam.studioSeam.keepBoardSlot(id, "Theek hai, ab ek naya sawaal karte hain.", [], {}), null);
  L.onScreen = "wb-2"; L.pieces.get("wb-2").state = "revealed"; L.pieces.get("wb-2").retired = false;
  const back = seam.studioSeam.keepBoardSlot(id, "Ab triangle par lautte hain. Iske corners gino.", [], {});
  assert.equal(back?.intentId, "wb-1", "the triangle board is back on the response");
  assert.equal(L.onScreen, "wb-1");
  assert.equal(L.pieces.get("wb-2").retiredWhy, "replaced");
  // a number the earlier board never had is a new problem: it does not come back for it
  L.pieces.set("wb-3", { intentId: "wb-3", slotId: "wb-3:slot", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script: page(["rocket", "flame"]) }, revealedTurn: 3, prevBoard: "wb-1", lines: [] });
  L.onScreen = "wb-3";
  assert.equal(seam.studioSeam.keepBoardSlot(id, "Ab triangle par lautte hain: iske 7 corners?", [], {}), null);
});

test("QA on ac4e8e88 (c07175b4, a12e757b): a late rocket board under 'Ab triangle par lautte hain' is never shown; the triangle board comes back", () => {
  const id = "r8-late-left";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  const page = (texts) => ({ v: 1, scriptId: texts[0], line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
    ops: [{ id: "p", op: "polygon", startMs: 0, endMs: 800, points: [[200, 300], [340, 100], [480, 300]] }, ...texts.map((t, i) => ({ id: `t${i}`, op: "text", startMs: 800 + i * 300, endMs: 1100 + i * 300, at: [120 + i * 200, 360], text: t, size: "m" }))] });
  L.pieces.set("wb-1", { intentId: "wb-1", slotId: "wb-1:slot", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script: page(["triangle", "corners"]) }, revealedTurn: 1, lines: ["Triangle ke teen corners hote hain."] });
  // t2's rocket board, asked over the triangle and still being drawn at the end of t2, has landed (late) before t3
  L.pieces.set("wb-2", { intentId: "wb-2", slotId: "wb-2:slot", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script: page(["rocket", "flame"]) }, revealedTurn: 2, prevBoard: "wb-1", lines: [] });
  L.onScreen = "wb-2";
  const t3 = "Ab triangle par lautte hain. Triangle ke corners gino.";
  assert.equal(seam.studioSeam.onScreenSlot(id, "wb-2", [], {}, t3), null, "the late rocket board is not shown under a triangle line");
  assert.equal(seam.studioSeam.keepBoardSlot(id, t3, [], {})?.intentId, "wb-1", "the triangle board comes back");
  // a late board her line IS about is shown, as before
  L.pieces.set("wb-3", { intentId: "wb-3", slotId: "wb-3:slot", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script: page(["rocket", "flame"]) }, revealedTurn: 3, lines: [] });
  L.onScreen = "wb-3";
  assert.equal(seam.studioSeam.onScreenSlot(id, "wb-3", [], {}, "Rocket ki flame neeche hoti hai.")?.intentId, "wb-3");
});
