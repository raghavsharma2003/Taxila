// Round 7, stream B Voice → C1 Studio M4: server/duplex/childText.js, the child's words in-process.
//   onChildText / emitChildText: per lesson, seq across partials and finals, never a disclosure, a listener's throw contained;
//   childTextRoute (POST /api/duplex/child-text): nobody listening → 204 with no DB read; rate limit; the caller's own lesson;
//   /api/lesson/turn-audio emits the turn's final before the turn runs; /api/duplex/config says partialPost only when on.
import { test } from "node:test";
import assert from "node:assert/strict";

import { onChildText, emitChildText, childTextRoute, partialPostOn, CHILD_TEXT_MIN_MS, _resetChildText } from "../server/duplex/childText.js";

const L = "11111111-2222-3333-4444-555555555555";

test("onChildText: per lesson, seq across partials and finals, unsubscribe, a listener's throw never escapes", () => {
  _resetChildText();
  const got = [], other = [];
  const off = onChildText(L, (e) => got.push(e));
  onChildText("22222222-2222-3333-4444-555555555555", (e) => other.push(e));
  onChildText(L, () => { throw new Error("listener bug"); });
  emitChildText({ lessonId: L, itemId: "i1", text: "saat", final: false, t: 1200 });
  emitChildText({ lessonId: L, itemId: "turn:3", text: "  saat hai  ", final: true });
  assert.deepEqual(got.map((e) => [e.seq, e.text, e.final, e.t]), [[1, "saat", false, 1200], [2, "saat hai", true, null]]);
  assert.equal(other.length, 0, "another lesson hears nothing");
  assert.ok(Object.isFrozen(got[0]));
  off();
  assert.equal(emitChildText({ lessonId: "33333333-2222-3333-4444-555555555555", text: "x" }), null, "nobody listening: nothing built");
  assert.equal(emitChildText({ lessonId: L, text: "   " }), null, "empty: nothing");
  _resetChildText();
});

test("safety by predicate: text the shipped scanSafety reads as distress never reaches a listener", () => {
  _resetChildText();
  const got = [];
  onChildText(L, (e) => got.push(e));
  assert.equal(emitChildText({ lessonId: L, text: "mujhe marna hai", final: true }), null);
  assert.equal(got.length, 0);
  _resetChildText();
});

test("childTextRoute: nobody listening → 204 with no lookup; rate-limited; only the caller's own child's open lesson", async () => {
  _resetChildText();
  let lookups = 0;
  const deps = (o = {}) => ({ lookupLesson: async () => { lookups++; return { id: L, child_id: "c1", ended_at: null, ...o }; }, child: async () => ({}), now: () => clock });
  let clock = 1000;
  assert.equal(await childTextRoute({}, { lessonId: L, text: "saat" }, deps()), 204);
  assert.equal(lookups, 0, "no listener: no database read");
  const got = [];
  onChildText(L, (e) => got.push(e));
  await childTextRoute({}, { lessonId: L, itemId: "i1", text: "saat", t: 50 }, deps());
  clock += CHILD_TEXT_MIN_MS - 1;
  await childTextRoute({}, { lessonId: L, itemId: "i1", text: "saat hai", t: 60 }, deps());
  assert.deepEqual(got.map((e) => [e.text, e.final]), [["saat", false]], "the second post came too soon");
  clock += 10;
  await childTextRoute({}, { lessonId: L, itemId: "i1", text: "saat hai", t: 70 }, deps({ ended_at: new Date() }));
  assert.equal(got.length, 1, "an ended lesson: nothing");
  clock += 400;
  await assert.rejects(childTextRoute({}, { lessonId: L, text: "x" }, { ...deps(), child: async () => { throw Object.assign(new Error("forbidden"), { status: 403 }); } }));
  assert.equal(got.length, 1, "someone else's lesson: refused");
  assert.equal(await childTextRoute({}, { lessonId: "not-a-uuid", text: "x" }, deps()), 204);
  _resetChildText();
});

test("partialPostOn: off unless TAXILA_DUPLEX_PARTIAL_POST=on", () => {
  assert.equal(partialPostOn({}), false);
  assert.equal(partialPostOn({ TAXILA_DUPLEX_PARTIAL_POST: "on" }), true);
  assert.equal(partialPostOn({ TAXILA_DUPLEX_PARTIAL_POST: "1" }), false);
});

test("/api/lesson/turn-audio: the turn's words reach a listener as a final before the turn runs", async () => {
  _resetChildText();
  const { _turnAudio, turnAudioDeps } = await import("../server/routes/voice.js");
  const order = [];
  onChildText(L, (e) => order.push(["text", e.text, e.final, e.itemId]));
  Object.assign(turnAudioDeps, { style: () => ({}), synth: async function* () {}, lessonTurn: async () => { order.push(["turn"]); return { teacherReply: "", teacherReplySeq: 2 }; } });
  const res = { statusCode: 0, writableEnded: false, writeHead() {}, flushHeaders() {}, write() { return true; }, end() { this.writableEnded = true; }, on() {}, once() {}, off() {} };
  try {
    await _turnAudio({ headers: { cookie: "tx_session=t", accept: "application/x-taxila-pcm-frames;v=2" }, url: "/api/lesson/turn-audio" }, res, { lessonId: L, turnSeq: 4, childText: "chaar" });
    assert.deepEqual(order, [["text", "chaar", true, "turn:4"], ["turn"]]);
  } finally { Object.assign(turnAudioDeps, { lessonTurn: null, style: null, synth: null }); _resetChildText(); }
});
