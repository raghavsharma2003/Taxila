// ship5 p1-duplex: the cascade link with the duplex engine wired in (docs/design/ship5/p1-duplex/patches/03-cascade-duplex.diff,
// 01-link-duplex-field.diff). Proves, against fake browser audio and a fake transcription call:
//   - duplex "on": the engine's 1,500 ms server-VAD backstop is sent, a transcription FINAL is not a turn (captions only),
//     and a turn reaches the runtime only when the engine commits it (with TurnRequest.duplex);
//   - a quota refusal on the call steps the engine aside: the token's turn detection is restored, the next final IS a turn
//     (today's path), the UI hears { live: false, fallback: "stt_rate_limited" }, and no error reaches the child;
//   - no AudioWorklet in this browser → today's path at once, reported as a fallback;
//   - absent / "off" → byte-for-byte today's link (the whole of tests/voice-cascade.test.mjs keeps passing).
// Until patch 03 is applied this file SKIPS (the main tree carries the patch as a diff; the integrator applies it).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { LevelMeter } from "../src/lesson/level.ts";

const PATCHED = fs.readFileSync(new URL("../src/lesson/cascadeLink.ts", import.meta.url), "utf8").includes("ship5 p1-duplex");
const skip = PATCHED ? false : "patch docs/design/ship5/p1-duplex/patches/03-cascade-duplex.diff is not applied to src/lesson/cascadeLink.ts";
const { CascadeLink } = await import("../src/lesson/cascadeLink.ts");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class FakeParam { constructor(v) { this.value = v; } cancelScheduledValues() {} setTargetAtTime(v) { this.value = v; } }
class FakeNode { constructor(ctx) { this.ctx = ctx; } connect() {} disconnect() {} }
class FakeAudioContext {
  constructor() { this.t0 = performance.now(); this.destination = new FakeNode(this); this.sources = []; FakeAudioContext.last = this; }
  get currentTime() { return (performance.now() - this.t0) / 1000; }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
  createGain() { const n = new FakeNode(this); n.gain = new FakeParam(1); return n; }
  createAnalyser() { const n = new FakeNode(this); n.fftSize = 1024; n.getFloatTimeDomainData = (b) => b.fill(0); return n; }
  createMediaStreamSource() { return new FakeNode(this); }
  createBuffer(_ch, length, rate) { const data = new Float32Array(length); return { duration: length / rate, getChannelData: () => data }; }
  createBufferSource() {
    const ctx = this, s = new FakeNode(this);
    s.start = (at) => { s.timer = setTimeout(() => { s.done = true; s.onended?.(); }, Math.max(0, (at - ctx.currentTime) * 1000) + s.buffer.duration * 1000); };
    s.stop = () => { clearTimeout(s.timer); s.stopped = true; };
    this.sources.push(s);
    return s;
  }
}

function installBrowserFakes() {
  const saved = {};
  const set = (k, v) => { saved[k] = Object.getOwnPropertyDescriptor(globalThis, k); Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); };
  const track = { enabled: true, stop() {} };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  set("navigator", { mediaDevices: { getUserMedia: async () => stream } });
  set("AudioContext", FakeAudioContext);
  const pcs = [];
  set("RTCPeerConnection", class {
    constructor() { this.connectionState = "new"; pcs.push(this); }
    addTrack() {}
    createDataChannel() { this.dc = { readyState: "connecting", sent: [], send(m) { this.sent.push(JSON.parse(m)); }, close() { this.readyState = "closed"; } }; return this.dc; }
    async createOffer() { return { type: "offer", sdp: "v=0" }; }
    async setLocalDescription(d) { this.localDescription = d; }
    async setRemoteDescription() { setTimeout(() => { this.dc.readyState = "open"; this.connectionState = "connected"; this.dc.onopen?.(); }, 1); }
    close() { this.closed = true; }
  });
  const origFetch = globalThis.fetch;
  set("fetch", async (url, init) => (String(url).endsWith("/realtime/calls") ? new Response("v=0 answer", { status: 201 }) : origFetch(url, init)));
  return { pcs, restore() { for (const [k, d] of Object.entries(saved)) d ? Object.defineProperty(globalThis, k, d) : delete globalThis[k]; } };
}

const TOKEN = async () => ({ token: "ek_x", expiresAt: 0, base: "https://x.invalid/openai/v1", session: { audio: { input: { turn_detection: { type: "server_vad", silence_duration_ms: 900 } } } } });
const levels = () => ({ mic: new LevelMeter(), teacher: new LevelMeter() });
const pcm = (chunks = 4) => async (_req, signal) => new ReadableStream({ async start(c) { for (let i = 0; i < chunks; i++) { await sleep(i ? 2 : 5); if (signal.aborted) return c.close(); c.enqueue(new Uint8Array(12_000)); } c.close(); } });
const msg = (pc, e) => pc.dc.onmessage({ data: JSON.stringify(e) });

async function duplexLink({ tap = "ok", mode = "on" } = {}) {
  const env = installBrowserFakes();
  const states = [];
  let feed = null;
  const link = new CascadeLink({
    lessonId: "L1", levels: levels(), speech: pcm(12), fetchToken: TOKEN, transcribe: async () => ({ text: "" }),
    duplex: mode, onDuplex: (s) => states.push(s),
    // the fake tap delivers no frames: the no-frames watchdog (3 s) is the one timer kept off, so a slow machine cannot trip it
    duplexOptions: tap === "ok" ? { startTap: async ({ live }) => { feed = live; return () => { feed = null; }; }, setTimeout: (fn, ms) => (ms >= 3000 ? 0 : setTimeout(fn, ms)) } : {},
  });
  const events = [];
  link.on((e) => events.push(e));
  await link.connect();
  await sleep(60);
  // round 4: the engine comes up asynchronously (data channel open → tap → backstop VAD); on a loaded machine (full npm test
  // beside other work) 60 ms was not always enough and the first assertion saw it still starting. Wait until it is live or
  // has stepped aside, never longer than 3 s (the no-frames watchdog is off in this rig).
  if (mode === "on") for (const t0 = Date.now(); Date.now() - t0 < 3000 && !(states.at(-1)?.live || states.at(-1)?.fallback);) await sleep(10);
  return { env, link, events, states, pc: env.pcs[0], feed: () => feed };
}

test("duplex on: the backstop VAD is sent, a final is NOT a turn, captions fold, the engine's commit is the turn", { skip }, async () => {
  const { env, link, events, states, pc, feed } = await duplexLink();
  try {
    assert.ok(feed(), "frames come from the shared tap");
    assert.equal(states.at(-1).live, true, JSON.stringify(states.at(-1)));
    const upd = pc.dc.sent.filter((m) => m.type === "session.update").at(-1);
    assert.equal(upd.session.audio.input.turn_detection.silence_duration_ms, 1500, "server VAD is only the backstop");
    // a pause sheet switches the mic off and on again: hands-free again means the backstop again, not the token's 900 ms
    link.setPushToTalk(true);
    link.setPushToTalk(false);
    const again = pc.dc.sent.filter((m) => m.type === "session.update").at(-1);
    assert.equal(again.session.audio.input.turn_detection.silence_duration_ms, 1500);
    msg(pc, { type: "input_audio_buffer.speech_started", item_id: "c1", audio_start_ms: 100 });
    msg(pc, { type: "conversation.item.input_audio_transcription.delta", item_id: "c1", delta: "बारह" });
    msg(pc, { type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "बारह" });
    assert.ok(events.some((e) => e.type === "child_speech_start"), "speech edges still reach the runtime (voice features, floor)");
    assert.ok(events.some((e) => e.type === "child_partial" && e.text === "बारह"), "the caption shows");
    assert.ok(!events.some((e) => e.type === "child_final"), "a transcription final is not a turn under duplex");
    // the engine commits (as its SPEAK would): the runtime gets child_final with the duplex summary
    link.duplex.live.o.port.commit({ turnId: 1, text: "बारह", startedAt: 1, duplex: { transcriptHash: "h", safetyPending: null } });
    const fin = events.find((e) => e.type === "child_final");
    assert.equal(fin.text, "बारह");
    assert.equal(fin.typed, false);
    assert.equal(fin.itemId, "c1");
    assert.equal(fin.duplex.transcriptHash, "h");
  } finally { link.close(); env.restore(); }
});

test("duplex on: a quota refusal on the call → today's path at once (VAD restored, finals are turns), no child-facing error", { skip }, async () => {
  const { env, link, events, states, pc } = await duplexLink();
  try {
    msg(pc, { type: "error", error: { code: "rate_limit_exceeded", message: "Rate limit reached for gpt-live-transcribe" } });
    assert.equal(states.at(-1).live, false);
    assert.equal(states.at(-1).fallback, "stt_rate_limited");
    assert.ok(!events.some((e) => e.type === "error"), "the child sees no error");
    const upd = pc.dc.sent.filter((m) => m.type === "session.update").at(-1);
    assert.equal(upd.session.audio.input.turn_detection.silence_duration_ms, 900, "the token's own turn detection is back");
    msg(pc, { type: "input_audio_buffer.speech_started", item_id: "c2" });
    msg(pc, { type: "conversation.item.input_audio_transcription.completed", item_id: "c2", transcript: "teen chauthai" });
    const fin = events.find((e) => e.type === "child_final");
    assert.ok(fin, "today's path: the final is the turn");
    assert.equal(fin.text, "teen chauthai");
    assert.equal(fin.duplex, undefined);
  } finally { link.close(); env.restore(); }
});

test("duplex on but no AudioWorklet here → today's path, reported as a fallback", { skip }, async () => {
  const { env, link, events, states, pc } = await duplexLink({ tap: "real" });
  try {
    assert.equal(states.at(-1)?.live, false);
    assert.ok(states.at(-1)?.fallback, JSON.stringify(states));
    msg(pc, { type: "input_audio_buffer.speech_started", item_id: "c1" });
    msg(pc, { type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "teen chauthai" });
    assert.ok(events.some((e) => e.type === "child_final" && e.text === "teen chauthai"));
  } finally { link.close(); env.restore(); }
});

test("duplex on: a reply to a revoked commit is never voiced (interrupted, no audio)", { skip }, async () => {
  const { env, link, events } = await duplexLink();
  try {
    link.duplex.live.o.port.dropReply(1);
    events.length = 0;
    link.promptTeacher({ text: "Bahut badhiya!", seq: 7 });
    await sleep(40);
    assert.deepEqual(events.map((e) => e.type), ["response_start", "teacher_interrupted", "response_done"]);
    link.promptTeacher({ text: "Achha, aur batao.", seq: 8 });
    await sleep(40);
    assert.ok(events.some((e) => e.type === "teacher_audio_start"), "the next reply plays");
  } finally { link.close(); env.restore(); }
});

test("duplex on: the engine's pause / resume / stop drive her playback; today's server-VAD pause stands aside", { skip }, async () => {
  const { env, link, events, pc } = await duplexLink();
  try {
    link.promptTeacher({ text: "Dekho, ek roti ke chaar barabar hisse karo. Har hissa ek chauthai hai.", seq: 5 });
    await sleep(40);
    assert.ok(events.some((e) => e.type === "teacher_audio_start"));
    events.length = 0;
    msg(pc, { type: "input_audio_buffer.speech_started", item_id: "c9" });
    assert.ok(!events.some((e) => e.type === "teacher_audio_end"), "server speech_started no longer pauses her (the engine decides)");
    const port = link.duplex.live.o.port;
    assert.equal(port.pause(), true);
    assert.ok(events.some((e) => e.type === "teacher_audio_end"));
    port.resume();
    await sleep(30);
    assert.equal(events.filter((e) => e.type === "teacher_audio_start").length, 1, "resumed");
    port.stop();
    assert.ok(events.some((e) => e.type === "teacher_interrupted"));
  } finally { link.close(); env.restore(); }
});

test("duplex off (or absent): today's link — a final is the turn, server speech_started pauses her", { skip }, async () => {
  const { env, link, events, states, pc } = await duplexLink({ mode: "off" });
  try {
    assert.deepEqual(states, [], "no engine, no duplex state");
    assert.equal(link.duplex, null);
    msg(pc, { type: "input_audio_buffer.speech_started", item_id: "c1" });
    msg(pc, { type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "teen chauthai" });
    assert.ok(events.some((e) => e.type === "child_final" && e.text === "teen chauthai"));
  } finally { link.close(); env.restore(); }
});

// ───────────── the runtime carries the engine's summary as TurnRequest.duplex (patch 02) ─────────────

const RT_PATCHED = fs.readFileSync(new URL("../src/lesson/runtime.ts", import.meta.url), "utf8").includes("ship5 p1-duplex");
const { LessonRuntime } = await import("../src/lesson/runtime.ts");

test("runtime: a spoken child_final carrying `duplex` posts TurnRequest.duplex; a typed turn carries none", { skip: RT_PATCHED ? false : "patch 02-runtime-duplex-summary.diff is not applied" }, async () => {
  const listeners = new Set();
  const link = {
    mode: "text", lane: "cascade", levels: null,
    on: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    emit: (e) => { for (const fn of [...listeners]) fn(e); },
    async connect() { this.emit({ type: "connection", state: "connected" }); },
    applyInstructions() {}, sendChild(text) { this.emit({ type: "child_final", text, startedAt: Date.now(), typed: true }); },
    promptTeacher() {}, interrupt() {}, setPushToTalk() {}, talkStart() {}, talkEnd() {}, close() {},
  };
  const calls = [];
  const api = {
    start: async () => ({ lessonId: "L1", topic: { id: "t", title: "T", chapter: "1" }, instructions: "", teacher: { id: "asha", name: "Asha", voice: "x" }, moduleCommands: [], ui: {} }),
    turn: async (req) => { calls.push(req); return { move: { kind: "probe" }, moduleCommands: [], ui: {}, teacherReply: "ok", teacherReplySeq: 2 }; },
    end: async () => ({ ok: true }), realtimeToken: async () => { throw new Error("unused"); },
  };
  let n = 0;
  const timers = { setTimeout: (fn) => (++n, setTimeout(fn, 0)), clearTimeout: (h) => clearTimeout(h) };
  const rt = new LessonRuntime({ api, timers, createLink: (_m, ctx) => ((link.levels = ctx.levels), link) });
  await rt.start("child-1", "cascade");
  const duplex = { transcriptHash: "7f3a", safetyPending: { kind: "self_harm", source: "predicate" }, engineSummary: { engine: "stage-a/live", reasons: ["turn_end"], pComplete: [], decidedAfterEndMs: 320 } };
  link.emit({ type: "child_final", text: "theek hai", startedAt: Date.now() - 900, typed: false, itemId: "i1", asrConfidence: 0.9, duplex });
  await sleep(30);
  link.sendChild("baarah");
  await sleep(30);
  assert.equal(calls.length, 2, JSON.stringify(calls));
  assert.deepEqual(calls[0].duplex, duplex, "the sticky safety state reaches the server with the turn");
  assert.equal(calls[1].duplex, undefined);
  await rt.end().catch(() => {});
});
