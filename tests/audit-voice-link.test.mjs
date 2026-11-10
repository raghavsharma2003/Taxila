// Audit 2026-11-09, voice (docs/design/round7/audit/voice.md): the hangs and the bridge. Each test fails on int/r6 at 21a.
// (V-01 and V-02 are tested in tests/r7-audit-voice-server.test.mjs and r7-audit-voice-client.test.mjs.)
//   V-03 the transcription call's token and connection requests are time-limited (the link falls back to the talk button)
//   V-04 a tap that silences her tells the hands-free engine her line is over
//   V-13 the bridge passes the player's sink to the speech fetch (lip-sync, board timing)
//   V-14 the typed lane's streamed voice goes through the bridge (pause hold, replay buffer)
// No network, no database. Globals are swapped inside each test and restored (tests/test-isolation.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { frame, FRAME } from "../server/voice/frames.js";
import { CascadeLink } from "../src/lesson/cascadeLink.ts";
import { UiBridge } from "../src/lesson/uiBridge.ts";
import { LevelMeter } from "../src/lesson/level.ts";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class FakeParam { constructor(v) { this.value = v; } cancelScheduledValues() {} setTargetAtTime(v) { this.value = v; } }
class FakeNode { connect() {} disconnect() {} }
class FakeAudioContext {
  constructor() { this.t0 = performance.now(); this.destination = new FakeNode(); this.state = "running"; }
  get currentTime() { return (performance.now() - this.t0) / 1000; }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
  createGain() { const n = new FakeNode(); n.gain = new FakeParam(1); return n; }
  createAnalyser() { const n = new FakeNode(); n.fftSize = 1024; n.getFloatTimeDomainData = (b) => b.fill(0); return n; }
  createMediaStreamSource() { return new FakeNode(); }
  createBuffer(_ch, length, rate) { const data = new Float32Array(length); return { duration: length / rate, getChannelData: () => data }; }
  createBufferSource() {
    const ctx = this;
    const s = new FakeNode();
    s.start = (at) => { s.timer = setTimeout(() => s.onended?.(), Math.max(0, (at - ctx.currentTime) * 1000) + s.buffer.duration * 1000); };
    s.stop = () => clearTimeout(s.timer);
    return s;
  }
}

/** Browser fakes for a CascadeLink whose WebRTC call can come up. `sdp`: "ok" | "hang" (the connection request never answers). */
function browser({ sdp = "ok" } = {}) {
  const saved = {};
  const set = (k, v) => { saved[k] = Object.getOwnPropertyDescriptor(globalThis, k); Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); };
  const track = { enabled: true, stop() {} };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  set("navigator", { mediaDevices: { getUserMedia: async () => stream } });
  set("AudioContext", FakeAudioContext);
  set("RTCPeerConnection", class {
    constructor() { this.connectionState = "new"; }
    addTrack() {}
    createDataChannel() { this.dc = { readyState: "connecting", send() {}, close() { this.readyState = "closed"; } }; return this.dc; }
    async createOffer() { return { type: "offer", sdp: "v=0" }; }
    async setLocalDescription(d) { this.localDescription = d; }
    async setRemoteDescription() { setTimeout(() => { this.dc.readyState = "open"; this.connectionState = "connected"; this.dc.onopen?.(); }, 1); }
    close() {}
  });
  let sdpAborted = false;
  set("fetch", (url, init) => {
    if (!String(url).endsWith("/realtime/calls")) return Promise.reject(new Error("no network in this test"));
    if (sdp === "ok") return Promise.resolve(new Response("v=0 answer", { status: 201 }));
    return new Promise((_res, rej) => init?.signal?.addEventListener("abort", () => { sdpAborted = true; rej(new DOMException("aborted", "AbortError")); }));
  });
  set("MediaRecorder", class { static isTypeSupported() { return true; } constructor() { this.state = "inactive"; } start() { this.state = "recording"; } stop() { this.state = "inactive"; this.onstop?.(); } });
  return { sdpAborted: () => sdpAborted, restore() { for (const [k, d] of Object.entries(saved)) d ? Object.defineProperty(globalThis, k, d) : delete globalThis[k]; } };
}
const token = async () => ({ token: "ek_x", expiresAt: 0, base: "https://x.invalid/openai/v1", session: {} });

// ───────────── V-03 ─────────────

test("V-03 CascadeLink: a token request that never answers falls back to the talk button", async () => {
  const env = browser();
  const transports = [];
  const link = new CascadeLink({ lessonId: "L1", levels: { mic: new LevelMeter(), teacher: new LevelMeter() }, speech: async () => new ReadableStream({ start(c) { c.close(); } }),
    fetchToken: () => new Promise(() => {}), openTimeoutMs: 30, maxReconnects: 0, ack: false, prefetch: false, onTransport: (t) => transports.push(t) });
  try {
    await link.connect();
    await sleep(200);
    assert.deepEqual(transports, ["recording"], "the link gave up on the call and told the UI (before the fix: nothing, for good)");
    assert.equal(link.transport, "recording");
  } finally { link.close(); env.restore(); }
});

test("V-03 CascadeLink: a connection request that never answers is abandoned and falls back", async () => {
  const env = browser({ sdp: "hang" });
  const transports = [];
  const link = new CascadeLink({ lessonId: "L1", levels: { mic: new LevelMeter(), teacher: new LevelMeter() }, speech: async () => new ReadableStream({ start(c) { c.close(); } }),
    fetchToken: token, openTimeoutMs: 30, maxReconnects: 0, ack: false, prefetch: false, onTransport: (t) => transports.push(t) });
  try {
    await link.connect();
    await sleep(200);
    assert.deepEqual(transports, ["recording"]);
    assert.equal(env.sdpAborted(), true, "the stalled request was aborted");
  } finally { link.close(); env.restore(); }
});

// ───────────── V-04 ─────────────

/** A stand-in for the duplex engine on the link's private field: records the calls the link makes to it. */
function engineStub() {
  const calls = [];
  const stub = new Proxy({}, { get: (_t, k) => (k === "deciding" ? false : k === "fallback" ? null : (...a) => { calls.push(String(k)); return k === "verdictHoldUntil" ? null : k === "onSttEvent" || k === "onServerError" || k === "shouldDropReply" || k === "replyDropPending" ? false : undefined; }) });
  return { stub, calls };
}
const second = async () => new ReadableStream({ start(c) { c.enqueue(new Uint8Array(24_000 * 2)); c.close(); } });

test("V-04 CascadeLink: a tap that silences her mid-line tells the engine her line is over, once", async () => {
  const env = browser();
  const link = new CascadeLink({ lessonId: "L1", levels: { mic: new LevelMeter(), teacher: new LevelMeter() }, speech: second, fetchToken: token, ack: false, prefetch: false });
  const events = [];
  link.on((e) => events.push(e.type));
  try {
    await link.connect();
    const { stub, calls } = engineStub();
    link.duplex = stub;
    link.promptTeacher({ text: "Chalo batao, saat aur paanch kitne hote hain?", seq: 3 });
    for (let i = 0; i < 100 && !events.includes("teacher_audio_start"); i++) await sleep(5);
    assert.ok(calls.includes("replyAudible"), "the engine was told she is audible");
    link.interrupt(); // pause, hear again, a typed answer: UiBridge.quietStop / sendChild
    await sleep(20);
    assert.equal(calls.filter((c) => c === "replyEnded").length, 1, "…and that her line is over (before the fix: never)");
    assert.ok(events.includes("teacher_audio_end"));
    link.duplex = null;
  } finally { link.close(); env.restore(); }
});

test("V-04 CascadeLink: a line that plays to its end is reported once; a reply still loading is not reported", async () => {
  const env = browser();
  const short = async () => new ReadableStream({ start(c) { c.enqueue(new Uint8Array(24_000 * 2 * 0.05)); c.close(); } });
  const link = new CascadeLink({ lessonId: "L1", levels: { mic: new LevelMeter(), teacher: new LevelMeter() }, speech: short, fetchToken: token, ack: false, prefetch: false });
  const done = [];
  link.on((e) => { if (e.type === "response_done") done.push(e.status); });
  try {
    await link.connect();
    const { stub, calls } = engineStub();
    link.duplex = stub;
    link.promptTeacher({ text: "Shabash!", seq: 4 });
    for (let i = 0; i < 100 && !done.length; i++) await sleep(5);
    assert.deepEqual(done, ["completed"]);
    assert.equal(calls.filter((c) => c === "replyEnded").length, 1);
    assert.equal(calls.filter((c) => c === "replyStopped").length, 0);
    calls.length = 0;
    link.speech = () => new Promise(() => {}); // her next reply never starts
    link.promptTeacher({ text: "Ab agla sawaal.", seq: 5 });
    link.interrupt();
    await sleep(10);
    assert.equal(calls.filter((c) => c === "replyEnded" || c === "replyStopped").length, 0, "nothing was audible, so there is nothing to end");
    link.duplex = null;
  } finally { link.close(); env.restore(); }
});

// ───────────── V-13, V-14 ─────────────

const L = "00000000-0000-0000-0000-00000000c11e";
const framedReply = () => new Response(new Blob([
  frame(FRAME.header, { v: 2 }),
  frame(FRAME.event, { t: "clause", clause: 0, part: 0, atSample: 0, atMs: 0 }),
  frame(FRAME.event, { t: "visemes", part: 0, atSample: 0, leadMs: 0, v: [[0, 80, "aa"]], w: [[0, 80, "hi"]] }),
  frame(FRAME.pcm, Buffer.alloc(24_000)),
  frame(FRAME.end, { t: "end", status: "ok" }),
]), { status: 200, headers: { "content-type": "application/x-taxila-pcm-frames;v=2" } });

test("V-13 UiBridge: the cascade speech fetch hands the player's sink its clause onsets and visemes", async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => framedReply();
  const bridge = new UiBridge();
  try {
    const got = { clause: 0, visemes: 0 };
    const body = await bridge.cachingStream({ lessonId: L, seq: 2 }, new AbortController().signal, { clause: () => got.clause++, visemes: () => got.visemes++ });
    const reader = body.getReader();
    for (;;) { const { done } = await reader.read(); if (done) break; }
    assert.deepEqual(got, { clause: 1, visemes: 1 }, "before the fix the bridge dropped the sink: 0 and 0");
  } finally { globalThis.fetch = orig; bridge.dispose?.(); }
});

test("V-14 UiBridge: the typed lane's streamed voice goes through the bridge's stream", () => {
  const bridge = new UiBridge();
  try {
    const link = bridge.deps.createLink("text", { lessonId: L, voice: "", levels: { mic: new LevelMeter(), teacher: new LevelMeter() }, api: bridge.deps.api });
    assert.equal(link.mode, "text");
    assert.equal(link.stream, bridge.cachingStream, "before the fix: the default fetch, which skips the pause hold and the replay buffer");
    link.close();
  } finally { bridge.dispose?.(); }
});
