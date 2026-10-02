// The cascade lane on the server (no network, no database): a cascade lesson's child turns are SPOKEN — they
// keep their ASR confidence and go through classify's low-ASR gate, never graded as typed — while the
// Director still writes every reply (text-lane instructions, nothing sent to the client). Also the
// speculative reply's identity rule, the tts-stream backpressure wait, the body-size cap and the STT-token
// rate limit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";

import { turnLane, childTurnRow, clientInstructions, __test } from "../server/routes/lesson.js";
import { classify, targetFor } from "../server/director/classify.js";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { writable, allowSttToken, STT_TOKENS_PER_MINUTE } from "../server/routes/voice.js";
import { readJson, MAX_BODY_BYTES } from "../server/http.js";
import { kit, CTX, BRIEF, cls } from "./fixtures/kit.mjs";

const K = kit();

test("lane rules: cascade is a text lane whose turns are spoken; only the text lane is typed", () => {
  assert.deepEqual(turnLane("cascade", {}), { lane: "cascade", textLane: true, typed: false });
  assert.deepEqual(turnLane("cascade", { typed: true }), { lane: "cascade", textLane: true, typed: true }, "a typed or tapped turn in a cascade lesson");
  assert.deepEqual(turnLane("text", {}), { lane: "text", textLane: true, typed: true });
  assert.deepEqual(turnLane("voice", {}), { lane: "voice", textLane: false, typed: false });
  assert.deepEqual(turnLane(undefined, {}), { lane: "voice", textLane: false, typed: false }, "a lesson stored before lanes");
  assert.deepEqual(clientInstructions("cascade", "KEY"), {}, "the answer key never reaches a cascade client");
  assert.deepEqual(clientInstructions("text", "KEY"), {});
  assert.deepEqual(clientInstructions("voice", "KEY"), { instructions: "KEY" });
});

test("a cascade turn with asrConfidence 0.3 is stored with asr_conf 0.3, typed:false — and is not graded", async () => {
  const { typed } = turnLane("cascade", {});
  const row = childTurnRow({ childText: "teen chauthai", asrConfidence: 0.3, typed });
  assert.equal(row.asrConf, 0.3);
  assert.equal(row.meta.typed, false);
  assert.equal(childTurnRow({ childText: "teen chauthai", asrConfidence: 0.3, typed: turnLane("text", {}).typed }).asrConf, null);
  // The same turn through classify: the low-ASR gate fires (no evidence), where the old typed:true graded it.
  const s = lessonAt(5);
  const target = targetFor(s, K, findItem(s, K, s.activeItemId));
  const orig = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("offline"); }; // the distress backup fails closed to the predicate
  try {
    process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.invalid/openai/v1";
    process.env.AZURE_OPENAI_API_KEY ||= "test-key";
    const out = await classify({ target, childText: "teen chauthai", asrConfidence: 0.3, typed, classLevel: 4 });
    assert.equal(out.outcome, "no_evidence");
    assert.equal(out.source, "asr");
  } finally {
    globalThis.fetch = orig;
  }
});

/** A stored lesson state after `n` unclear turns (the fifth reaches the first practice item). */
function lessonAt(n, mode = "cascade") {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < n; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (i + 1) * 20_000 });
  return { ...r.state, brief: BRIEF, mode };
}

test("a cascade lesson compiles text-lane instructions (the Director writes the reply)", () => {
  assert.equal(instructionsFor(lessonAt(5, "cascade"), K), instructionsFor(lessonAt(5, "text"), K));
  assert.notEqual(instructionsFor(lessonAt(5, "cascade"), K), instructionsFor(lessonAt(5, "voice"), K));
});

const planCtx = (s) => ({
  kit: K, child: { id: "child-1" }, lesson: { id: "lesson-1", started_at: new Date(0) }, activeItem: findItem(s, K, s.activeItemId),
  moduleOnly: false, moduleEvents: [], answer: "teen chauthai", leaked: false, loadSkills: async () => ({}), now: 200_000,
});

test("speculation: a speculative plan for the outcome the classifier returns has the real plan's reply key; another outcome does not", async () => {
  const s = lessonAt(5);
  assert.ok(s.activeItemId, "on a practice item");
  const { planTurn, replyKey } = __test;
  const key = async (c) => {
    const p = await planTurn(s, c, planCtx(s));
    return replyKey(p.r.state, K, p.r, p.instructions, "teen chauthai", p.r.state.recent.slice(0, -1));
  };
  const spec = await key({ ...cls("correct"), source: "speculative" });
  assert.equal(await key({ ...cls("correct"), source: "model" }), spec, "same inputs to the reply ⇒ the speculative reply is the reply");
  assert.notEqual(await key(cls("incorrect")), spec);
  // planTurn never mutates the staged state it is given (speculative and real plans share it).
  const before = JSON.stringify(s);
  await planTurn(s, cls("incorrect"), planCtx(s));
  assert.equal(JSON.stringify(s), before);
});

test("speculation fan-out: TAXILA_SPECULATE bounds it (0 = off), default 3", () => {
  const { specFanout } = __test;
  const prev = process.env.TAXILA_SPECULATE;
  try {
    delete process.env.TAXILA_SPECULATE;
    assert.equal(specFanout(), 3);
    process.env.TAXILA_SPECULATE = "0";
    assert.equal(specFanout(), 0);
    process.env.TAXILA_SPECULATE = "9";
    assert.equal(specFanout(), 4);
  } finally {
    if (prev === undefined) delete process.env.TAXILA_SPECULATE;
    else process.env.TAXILA_SPECULATE = prev;
  }
});

test("tts-stream backpressure: a client that disconnects with the buffer full releases the handler", async () => {
  const res = new EventEmitter();
  let done = false;
  const p = writable(res).then(() => (done = true));
  await new Promise((r) => setImmediate(r));
  assert.equal(done, false, "waits while the buffer is full");
  res.emit("close"); // 'drain' never comes after a disconnect
  await p;
  assert.equal(done, true);
  assert.equal(res.listenerCount("drain") + res.listenerCount("close") + res.listenerCount("error"), 0, "no listeners left behind");
  const d = new EventEmitter();
  const q = writable(d);
  d.emit("drain");
  await q;
  await writable(Object.assign(new EventEmitter(), { destroyed: true })); // already gone: no wait
});

test("readJson: a body over the cap is refused with 413 as it arrives (or from content-length)", async () => {
  const chunks = function* () { for (let i = 0; i < 4; i++) yield Buffer.alloc(1_000_000, 0x20); };
  const req = Object.assign(chunks(), { headers: {} });
  await assert.rejects(readJson(req), (e) => e.status === 413);
  await assert.rejects(readJson({ headers: { "content-length": String(MAX_BODY_BYTES + 1) }, [Symbol.iterator]: chunks }), (e) => e.status === 413);
  const ok = Object.assign((function* () { yield Buffer.from('{"a":1}'); })(), { headers: {} });
  assert.deepEqual(await readJson(ok), { a: 1 });
});

test("stt-token: at most STT_TOKENS_PER_MINUTE per guardian a minute", () => {
  const t = 1_000_000;
  for (let i = 0; i < STT_TOKENS_PER_MINUTE; i++) assert.ok(allowSttToken("g-1", t + i));
  assert.equal(allowSttToken("g-1", t + 100), false);
  assert.ok(allowSttToken("g-2", t + 100), "per guardian");
  assert.ok(allowSttToken("g-1", t + 61_000), "the window slides");
});
