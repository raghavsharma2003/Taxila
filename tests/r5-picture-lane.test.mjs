// Round 5, stream 2 (owner decision 14.2): real pictures on the Director lane for the picture cohort. Who gets them
// (picturesFor), the honest words (drawAsked / pictureNote: "being made", "cannot come right now", never "it is there"), the
// lane's limits (pictures in flight, the 429 back-off) and the reveal staying on screen into the next turn (seam showImage →
// slotFor). Pure apart from the in-memory seam; the network layer is stubbed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { picturesFor, startPicture, _setPictureDeps, _resetPictures, MAX_IN_FLIGHT } from "../server/studio/picture.js";
import { drawAsked, pictureNote } from "../server/director/shapes.js";
import { studioSeam } from "../server/studio/seam.js";
import { boardShow } from "../server/studio/tools.js";

let k = 0;
const lesson = () => `00000000-0000-4000-8000-${String(900 + ++k).padStart(12, "0")}`;

test("picturesFor: the cohort by email or its sha256, everyone with TAXILA_PICTURES=all, nobody with off", () => {
  const g = { email: "Owner@Example.com" };
  const h = createHash("sha256").update("owner@example.com").digest("hex");
  assert.equal(picturesFor(g, {}), false, "no cohort: no pictures");
  assert.equal(picturesFor(g, { TAXILA_PICTURES_FOR: "owner@example.com" }), true);
  assert.equal(picturesFor(g, { TAXILA_PICTURES_FOR: `x@y.z, ${h}` }), true);
  assert.equal(picturesFor({ email: "other@example.com" }, { TAXILA_PICTURES_FOR: h }), false);
  assert.equal(picturesFor(null, { TAXILA_PICTURES_FOR: h }), false);
  assert.equal(picturesFor({ email: "anyone@example.com" }, { TAXILA_PICTURES: "all" }), true);
  assert.equal(picturesFor(g, { TAXILA_PICTURES: "off", TAXILA_PICTURES_FOR: h }), false, "the kill switch wins");
});

test("her words: a picture being made is never said to be there; a busy lane says it cannot come now; no photo stays honest", () => {
  const coming = drawAsked({ subject: "aloo", show: "picture", photo: "coming" });
  assert.match(coming, /a real picture of aloo comes in a few seconds: say so plainly/);
  assert.doesNotMatch(coming, /there is no photo/);
  assert.match(drawAsked({ subject: "aloo", show: "picture", photo: "busy" }), /a photo cannot come right now/);
  assert.match(drawAsked({ subject: "aloo", show: "picture" }), /there is no photo/);
  assert.match(pictureNote({ subject: "hathi", photo: "coming" }), /never that it is there$/);
  assert.match(pictureNote({ subject: "hathi", photo: "busy" }), /cannot come right now/);
  assert.match(pictureNote({ subject: "hathi", photo: "failed" }), /could not come/);
});

test("the lane's limits: at most MAX_IN_FLIGHT pictures in the making; a full lane answers 'busy' at once, then frees", async () => {
  _resetPictures();
  const waits = [];
  _setPictureDeps({ generate: () => new Promise((res) => waits.push(() => res({ b64: Buffer.from("jpeg").toString("base64"), deployment: "stub" }))), moderate: async () => 0 });
  const subjects = ["aloo", "tamatar", "gajar", "pyaaz", "bhindi"];
  const out = subjects.map((s) => startPicture(lesson(), s, { reveal: () => {} }));
  assert.equal(out.filter((o) => o.ok).length, MAX_IN_FLIGHT);
  assert.deepEqual(out.slice(MAX_IN_FLIGHT).map((o) => o.check), subjects.slice(MAX_IN_FLIGHT).map(() => "busy"));
  waits.forEach((w) => w());
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(startPicture(lesson(), "bhindi", { reveal: () => {} }).ok, true, "a freed lane takes the next ask");
  _resetPictures();
});

test("a picture that fails after 'it is coming' is owned up to once (takeFailedPicture), never revealed", async () => {
  const { takeFailedPicture } = await import("../server/studio/picture.js");
  _resetPictures();
  _setPictureDeps({ generate: async () => ({ b64: Buffer.from("jpeg").toString("base64"), deployment: "stub" }), moderate: async () => 4 });
  const id = lesson();
  let shown = false;
  await new Promise((res) => startPicture(id, "gajar", { reveal: () => { shown = true; }, fail: res }));
  assert.equal(shown, false, "severity 4: never revealed");
  assert.equal(takeFailedPicture(id), "gajar");
  assert.equal(takeFailedPicture(id), null, "told once");
  _resetPictures();
});

test("a revealed picture stays on screen into the next turn and is taken down when the lesson moves to another item", async () => {
  _resetPictures();
  _setPictureDeps({ generate: async () => ({ b64: Buffer.from("jpeg").toString("base64"), deployment: "stub" }), moderate: async () => 0 });
  const id = lesson();
  await boardShow(id, { kind: "write", lines: ["Aloo"] }, { say: "Aloo ek tuber hai." });
  const shown = await new Promise((res) => startPicture(id, "aloo", { reveal: (pic) => res(studioSeam.showImage(id, { ...pic, itemId: "q1", skillId: "s1" })) }));
  assert.equal(shown.artifact.kind, "image");
  const next = studioSeam.slotFor(id, null, { beat: "explain", tray: null });
  assert.equal(next?.artifact?.kind, "image", "the next turn's ui carries the picture (the early slot is not dropped)");
  assert.deepEqual({ ...studioSeam.boardFor(id), turn: 0 }, { skillId: "s1", itemId: "q1", turn: 0 }, "turn.js leftBoard reads the picture's item");
  studioSeam.clearBoard(id);
  assert.equal(studioSeam.slotFor(id, null, { beat: "explain", tray: null }), null);
  _resetPictures();
});

test("14.2 persistent misses: a clock's 1-12 may be written, a game is never announced over nothing, an example is a worked page", async () => {
  const { askedNumbers, announcesGame, ungame, answersRequest, workedPage } = await import("../server/studio/request.js");
  assert.deepEqual(askedNumbers({ kind: "draw", subject: "ghadi" }), Array.from({ length: 12 }, (_, i) => String(i + 1)));
  assert.equal(askedNumbers({ kind: "show", subject: "घड़ी" }).length, 12, "Devanagari (with its nukta) too");
  assert.deepEqual(askedNumbers({ kind: "number_line", said: ["1/4"] }), ["1/4", "0", "1"]);
  assert.deepEqual(askedNumbers({ kind: "draw", subject: "aloo" }), []);
  assert.equal(ungame("Chalo “mirror line” game: imaginary fold socho."), "Chalo “mirror line” activity: imaginary fold socho.");
  assert.equal(announcesGame("Abhi iska game ready nahi hai; chalo kaagaz mod kar dekhte hain."), false, "the honest line stays as it is");
  const page = (...texts) => ({ ops: texts.map((text, i) => ({ id: `t${i}`, op: "text", text })) });
  assert.equal(workedPage(page("1/2 = 2/4", "same amount")), false, "a bare fact is not a worked example");
  assert.equal(workedPage(page("Find each", "change", "Check")), false, "steps with no numbers are not the example");
  assert.equal(workedPage(page("4 tukde, 2 khaaye", "2/4", "= 1/2")), true);
  assert.equal(answersRequest(page("1/2 = 2/4", "same amount"), { kind: "example" }), false);
});

test("a clock's hands are radii, not cuts of a whole: W8 lets them through only for a face drawing", async () => {
  const { gateWhiteboard } = await import("../server/studio/qa/whiteboard.js");
  const clock = { v: 1, scriptId: "t-clock", line: { lessonId: "x" }, anchor: "line_audio_start", board: { w: 400, h: 300 }, mode: "fresh", durationMs: 3000,
    ops: [{ id: "c", op: "circle", c: [200, 150], r: 100, startMs: 0, endMs: 800 },
      { id: "h", op: "line", from: [200, 150], to: [200, 75], startMs: 900, endMs: 1300 },
      { id: "m", op: "line", from: [200, 150], to: [270, 150], startMs: 1400, endMs: 1800 },
      { id: "t", op: "text", at: [200, 66], text: "12", size: "m", startMs: 1900, endMs: 2100 }] };
  const ctx = { reply: "Ghadi gol hoti hai: upar 12, chhota hand ghante batata hai, bada hand minute.", speechMs: 6000 };
  const w8 = (g) => g.checks.find((c) => c.id === "W8.counts_match_line");
  assert.equal(w8(gateWhiteboard(clock, ctx)).pass, false, "without the ask, a circle cut from its centre is refused (unchanged)");
  assert.equal(w8(gateWhiteboard(clock, { ...ctx, face: true })).pass, true);
});
