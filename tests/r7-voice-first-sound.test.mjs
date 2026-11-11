// Round 7, stream B Voice, item voice-first-sound-latency (B5):
//   (b) the turn-audio fold is the default (src/lesson/ttsStream.ts turnAudioEnabled);
//   (c) the continuer for every child on every lane (server/latency/ack.js continuerAllowed; cascadeLink no longer turns it
//       off on D5);
//   Brain A5 ↔ B: the Director's locked first clause (lessonTurn hooks.onClause) is spoken inside the turn-audio fold the
//       moment it is guarded; the rest of the reply follows the turn; a reply that no longer starts with it (failed closed
//       to safeguarding) is said in full.
import { test } from "node:test";
import assert from "node:assert/strict";

import { continuerAllowed } from "../server/latency/ack.js";
import { turnAudioEnabled, TURN_AUDIO_KEY } from "../src/lesson/ttsStream.ts";
import { _turnAudio, turnAudioDeps } from "../server/routes/voice.js";
import { parseFrames, FRAME } from "../server/voice/frames.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("B5 (c): the continuer is for every child by default; cohort and off narrow it", () => {
  assert.equal(continuerAllowed("anyone@example.com", {}), true);
  assert.equal(continuerAllowed("", {}), true, "no guardian email still gets it (the device asked)");
  assert.equal(continuerAllowed("anyone@example.com", { TAXILA_ACK_CONTINUER: "off" }), false);
  assert.equal(continuerAllowed("anyone@example.com", { TAXILA_ACK_CONTINUER: "cohort", TAXILA_ACK_CONTINUER_FOR: "owner@example.com" }), false);
  assert.equal(continuerAllowed("owner@example.com", { TAXILA_ACK_CONTINUER: "cohort", TAXILA_ACK_CONTINUER_FOR: "owner@example.com" }), true);
});

test("B5 (b): the turn-audio fold is on by default; the device key still turns it off", () => {
  const store = new Map();
  const had = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } });
  try {
    assert.equal(turnAudioEnabled(), true);
    store.set(TURN_AUDIO_KEY, "0");
    assert.equal(turnAudioEnabled(), false);
  } finally {
    if (had) Object.defineProperty(globalThis, "localStorage", had); else delete globalThis.localStorage;
  }
});

function fakeRes() {
  const chunks = [];
  return { chunks, statusCode: 0, writableEnded: false,
    writeHead(code) { this.statusCode = code; }, flushHeaders() {}, write(b) { chunks.push(Buffer.from(b)); return true; },
    end() { this.writableEnded = true; }, on() {}, once() {}, off() {} };
}
const fakeReq = () => ({ headers: { cookie: "tx_session=t", accept: "application/x-taxila-pcm-frames;v=2" }, url: "/api/lesson/turn-audio" });
const frames = (res) => parseFrames(Buffer.concat(res.chunks)).map((x) => (x.type === FRAME.header ? `header:${x.payload.audio}` : x.type === FRAME.turn ? "turn" : x.type === FRAME.end ? `end:${x.payload.status}` : x.type === FRAME.pcm ? `pcm:${x.payload.toString()}` : `say:${x.payload.text}`));

test("B5 ↔ Brain A5: the Director's first clause is spoken in the fold before the turn; the rest follows the turn", async () => {
  Object.assign(turnAudioDeps, { style: () => ({}), synth: async function* (clause) { yield Buffer.from(clause); },
    lessonTurn: async (req, body, hooks) => {
      hooks.onClause({ lessonId: "L1", seq: 9, i: 0, text: "Achha, saat bola tumne.", final: false });
      await wait(40);
      return { teacherReply: "Achha, saat bola tumne. Ab batao, 3 aur 4 kitne hue?", teacherReplySeq: 9 };
    } });
  try {
    const res = fakeRes();
    await _turnAudio(fakeReq(), res, { lessonId: "L1" });
    assert.deepEqual(frames(res), ["header:streaming", "say:Achha, saat bola tumne.", "pcm:Achha, saat bola tumne.", "turn",
      "say:Ab batao, 3 aur 4 kitne hue?", "pcm:Ab batao, 3 aur 4 kitne hue?", "end:ok"]);
  } finally { Object.assign(turnAudioDeps, { lessonTurn: null, style: null, synth: null }); }
});

test("B5 ↔ Brain A5: a turn that failed closed to safeguarding after the first clause says the safeguarding reply in full", async () => {
  Object.assign(turnAudioDeps, { style: () => ({}), synth: async function* (clause) { yield Buffer.from(clause); },
    lessonTurn: async (req, body, hooks) => {
      hooks.onClause({ lessonId: "L2", seq: 3, i: 0, text: "Achha.", final: false });
      await wait(20);
      return { teacherReply: "Yeh sunke mujhe chinta hui. Kya tum abhi theek ho?", teacherReplySeq: 3 };
    } });
  try {
    const res = fakeRes();
    await _turnAudio(fakeReq(), res, { lessonId: "L2" });
    const says = frames(res).filter((x) => x.startsWith("say:")).map((x) => x.slice(4));
    assert.equal(says[0], "Achha.");
    assert.equal(says.slice(1).join(" "), "Yeh sunke mujhe chinta hui. Kya tum abhi theek ho?", "the whole safeguarding reply, never skipped");
  } finally { Object.assign(turnAudioDeps, { lessonTurn: null, style: null, synth: null }); }
});

test("B5 ↔ Brain A5: a reply exactly equal to the early clause adds nothing; no early clause keeps today's prewarm path", async () => {
  Object.assign(turnAudioDeps, { style: () => ({}), synth: async function* (clause) { yield Buffer.from(clause); },
    lessonTurn: async (req, body, hooks) => { hooks.onClause({ text: "Bahut accha." }); await wait(10); return { teacherReply: "Bahut accha.", teacherReplySeq: 2 }; } });
  try {
    const res = fakeRes();
    await _turnAudio(fakeReq(), res, { lessonId: "L3" });
    assert.deepEqual(frames(res).filter((x) => x.startsWith("say:")), ["say:Bahut accha."]);
    turnAudioDeps.lessonTurn = async () => ({ teacherReply: "Hold on.", teacherReplySeq: 5, late: true });
    const r2 = fakeRes();
    await _turnAudio(fakeReq(), r2, { lessonId: "L4" });
    assert.deepEqual(frames(r2), ["header:none", "turn", "end:ok"], "no early clause: the fold as before (here: nothing prewarmed)");
  } finally { Object.assign(turnAudioDeps, { lessonTurn: null, style: null, synth: null }); }
});

test("B5: a server without the turn-audio fold (404 or an unframed 2xx) gets the turn on /api/lesson/turn, once per page", async () => {
  const { httpLessonApi } = await import("../src/lesson/api.ts");
  const orig = globalThis.fetch;
  const calls = [];
  let foldStatus = 200;
  globalThis.fetch = async (url, init) => {
    const p = String(url);
    calls.push(p);
    if (p.endsWith("/api/lesson/turn-audio")) return new Response(JSON.stringify(foldStatus === 409 ? { error: "late" } : {}), { status: foldStatus, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ teacherReply: "ok", teacherReplySeq: 3 }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const r = await httpLessonApi.turn({ lessonId: "L1", turnSeq: 1, childText: "x" });
    assert.equal(r.teacherReply, "ok");
    assert.deepEqual(calls, ["/api/lesson/turn-audio", "/api/lesson/turn"]);
    await httpLessonApi.turn({ lessonId: "L1", turnSeq: 2, childText: "y" });
    assert.deepEqual(calls.slice(2), ["/api/lesson/turn"], "the page stops asking the fold");
  } finally { globalThis.fetch = orig; }
});
