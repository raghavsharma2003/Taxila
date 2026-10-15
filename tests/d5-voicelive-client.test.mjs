// D5 (2026-10-11): the browser half of lane D5 — src/duplex/d5Stream.ts (stereo frames up, Voice Live events down),
// DuplexLive's server-VAD gate (her echo on a phone speaker never opens a burst; a burst Voice Live confirms is replayed
// from its true start), resolveDuplexLane, and CascadeLink choosing D5 (and falling back to D4 when it cannot open).
import { test } from "node:test";
import assert from "node:assert/strict";

import { D5Stream, d5Url, translateSend } from "../src/duplex/d5Stream.ts";
import { DuplexLive, D5_VAD_START_PAD_MS, D5_VAD_END_PAD_MS } from "../src/duplex/live.ts";
import { resolveDuplexLane, resetDuplexFlagCache } from "../src/duplex/flags.ts";
import { LevelMeter } from "../src/lesson/level.ts";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────────────────────────── d5Stream ─────────────────────────────

test("d5Stream: the same-origin ws URL, and only commit / VAD silence translate", () => {
  assert.equal(d5Url("L 1", { protocol: "https:", host: "taxila.dev" }), "wss://taxila.dev/api/duplex/voicelive?lessonId=L%201");
  assert.equal(d5Url("L1", { protocol: "http:", host: "localhost:8080" }), "ws://localhost:8080/api/duplex/voicelive?lessonId=L1");
  assert.deepEqual(translateSend({ type: "input_audio_buffer.commit" }), { type: "commit" });
  assert.deepEqual(translateSend({ type: "session.update", session: { type: "transcription", audio: { input: { turn_detection: { type: "server_vad", silence_duration_ms: 500 } } } } }), { type: "vad", silenceMs: 500 });
  assert.equal(translateSend({ type: "session.update", session: { audio: { input: { turn_detection: null } } } }), null);
  assert.equal(translateSend({ type: "response.create" }), null);
});

class FakeWS {
  constructor(url) {
    this.url = url; this.binaryType = ""; this.readyState = 0; this.bufferedAmount = 0; this.sent = [];
    FakeWS.last = this;
    FakeWS.all.push(this);
    setTimeout(() => FakeWS.behaviour(this), 1);
  }
  send(d) { this.sent.push(d); }
  close() { this.readyState = 3; }
  server(e) { this.onmessage?.({ data: JSON.stringify(e) }); }
}
FakeWS.all = [];
FakeWS.up = (ws) => {
  ws.readyState = 1; ws.onopen?.();
  ws.server({ type: "d5.session", phase: "created", aec: null });
  ws.server({ type: "d5.session", phase: "updated", aec: { type: "server_echo_cancellation", reference: "client", channels: 2 }, dns: "azure_deep_noise_suppression" });
};
FakeWS.refuse = (ws) => { ws.readyState = 3; ws.onclose?.({ code: 1006 }); };
FakeWS.behaviour = FakeWS.up;

class FakeNode { constructor(ctx) { this.ctx = ctx; this.links = []; } connect(n) { this.links.push(n); return n; } disconnect() { this.links = []; } }
function installWorkletFakes() {
  const nodes = [];
  globalThis.AudioWorkletNode = class extends FakeNode {
    constructor(ctx, name, opts) { super(ctx); this.name = name; this.opts = opts; this.port = { posted: [], postMessage: (m) => this.port.posted.push(m), onmessage: null }; nodes.push(this); }
  };
  return { nodes, restore() { delete globalThis.AudioWorkletNode; } };
}
const fakeCtx = () => {
  const ctx = { modules: [], destination: null, audioWorklet: { addModule: async (u) => { ctx.modules.push(u); } }, createMediaStreamSource: () => new FakeNode(ctx), createGain: () => Object.assign(new FakeNode(ctx), { gain: { value: 1 } }) };
  ctx.destination = new FakeNode(ctx);
  return ctx;
};

test("d5Stream: waits for Voice Live's configured session, then sends stereo frames; her output feeds input 1", async () => {
  const wf = installWorkletFakes();
  FakeWS.behaviour = FakeWS.up;
  try {
    const events = [];
    let first = null;
    const s = new D5Stream({ WebSocket: FakeWS, workletUrl: "/d5.js", location: { protocol: "https:", host: "taxila.dev" }, now: () => 5000 });
    const her = new FakeNode(null);
    await s.start({ lessonId: "L1", ctx: fakeCtx(), mic: {}, herOutput: her, onEvent: (e) => events.push(e), onLost: () => {}, onFirstFrame: (t) => { first = t; } });
    assert.equal(s.open, true);
    assert.equal(FakeWS.last.binaryType, "arraybuffer");
    const node = wf.nodes.find((n) => n.name === "taxila-d5-stereo");
    assert.ok(node, "the stereo worklet");
    assert.deepEqual([node.opts.numberOfInputs, node.opts.channelCount], [2, 1]);
    assert.ok(her.links.includes(node), "her played audio is channel 1");
    assert.equal(s.session.aec.reference, "client");
    const pcm = new Int16Array(640).buffer;
    node.port.onmessage({ data: { t: 0, pcm } });
    node.port.onmessage({ data: { t: 0.02, pcm: new Int16Array(640).buffer } });
    assert.equal(FakeWS.last.sent.filter((d) => d instanceof ArrayBuffer).length, 2);
    assert.equal(first, 4980, "first frame → the server's audio time 0 (captured ~20 ms before it went out)");
    s.send({ type: "input_audio_buffer.commit" });
    assert.equal(FakeWS.last.sent.at(-1), '{"type":"commit"}');
    // a stalled uplink drops audio instead of queueing it
    FakeWS.last.bufferedAmount = 1 << 20;
    node.port.onmessage({ data: { t: 0.04, pcm: new Int16Array(640).buffer } });
    assert.equal(s.stats.framesDropped, 1);
    s.close();
    assert.equal(s.open, false);
  } finally { wf.restore(); }
});

test("d5Stream: a refused socket rejects (the link opens D4 instead)", async () => {
  const wf = installWorkletFakes();
  FakeWS.behaviour = FakeWS.refuse;
  try {
    const s = new D5Stream({ WebSocket: FakeWS, workletUrl: "/d5.js", location: { protocol: "https:", host: "x" } });
    await assert.rejects(s.start({ lessonId: "L1", ctx: fakeCtx(), mic: {}, herOutput: null, onEvent: () => {}, onLost: () => {} }), /refused/);
    assert.equal(wf.nodes.length, 0, "no capture without a session");
  } finally { wf.restore(); FakeWS.behaviour = FakeWS.up; }
});

// ───────────────────────────── DuplexLive: the server-VAD gate ─────────────────────────────

/** A lesson clock driving DuplexLive like the link does: 20 ms frames, the 100 ms timer. */
function rig(opts) {
  let clock = 0, tick = null;
  const acts = [];
  const port = {
    duck: (lv) => acts.push([clock, "duck", lv]), pause: () => { acts.push([clock, "pause"]); return true; }, resume: () => acts.push([clock, "resume"]),
    stop: () => acts.push([clock, "stop"]), commit: (t) => acts.push([clock, "commit", t.text]), sttCommit: () => acts.push([clock, "probe"]),
    dropReply: () => {}, fallback: (w) => acts.push([clock, "fallback", w]), state: () => {},
  };
  const live = new DuplexLive({ lessonId: "t", port, now: () => clock, setInterval: (fn) => { tick = fn; return 1; }, clearInterval: () => {}, band: "B2", ...opts });
  live.start();
  return {
    live, acts,
    run(untilMs, frameAt) {
      for (; clock < untilMs; clock += 20) {
        const f = frameAt(clock);
        live.frame(clock, f.rms, f.f0, f.her);
        if (clock % 100 === 80) tick?.();
      }
    },
    get t() { return clock; },
  };
}
const yields = (acts) => acts.filter((a) => a[1] === "pause" || a[1] === "stop");
const ducks = (acts) => acts.filter((a) => a[1] === "duck" && a[2] < 1);
const HER = "चार गुणा तीन का मतलब है चार को तीन बार जोड़ना, यानी चार और चार और चार, जो बारह होता है, और यही गुणा का असली मतलब है।";
// her echo on a phone speaker with no device AEC: as loud as the child, pitched
const echo = () => ({ rms: 0.1, f0: 210, her: -20 });

test("D5 gate: her loud echo never opens a burst (no duck, no yield) — on D4 the same audio ducks her", () => {
  for (const [opts, wantDuck] of [[{ source: "voicelive", vadGate: "server" }, false], [{}, true]]) {
    const r = rig(opts);
    r.live.herStart(HER);
    r.run(4000, echo);
    assert.equal(yields(r.acts).length, 0, `${JSON.stringify(opts)} no yield on echo`);
    assert.equal(ducks(r.acts).length > 0, wantDuck, `${JSON.stringify(opts)}: ${JSON.stringify(r.acts)}`);
    if (opts.vadGate) assert.ok(r.live.d5.gatedFrames > 150);
  }
});

test("D5 gate: a burst Voice Live confirms is replayed from its true start, and a real barge-in yields", () => {
  const r = rig({ source: "voicelive", vadGate: "server" });
  r.live.audioOrigin(0);
  r.live.herStart(HER);
  const childFrom = 2000, childTo = 3200;
  const frameAt = (t) => (t >= childFrom && t < childTo ? { rms: 0.3, f0: 290, her: -20 } : echo());
  r.run(2580, frameAt);
  assert.equal(ducks(r.acts).length, 0, "nothing before Voice Live confirms");
  // Voice Live: speech_started ~0.58 s after the onset, back-dated by its prefix padding
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "v1", audio_start_ms: childFrom - D5_VAD_START_PAD_MS });
  r.run(3800, frameAt);
  r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "v1", audio_end_ms: childTo + D5_VAD_END_PAD_MS });
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "v1", transcript: "रुको रुको, मुझे एक बात पूछनी है" });
  r.run(6000, frameAt);
  const d = ducks(r.acts)[0];
  assert.ok(d && d[0] >= 2580 && d[0] < 2800, `duck right after the confirmation: ${JSON.stringify(r.acts)}`);
  assert.ok(yields(r.acts).length >= 1, `the barge-in yields: ${JSON.stringify(r.acts)}`);
  assert.equal(r.live.d5.serverStarts, 1);
});

test("D5 gate: with her silent the device frames drive the engine as on D4 (a turn ends on device timing)", () => {
  const r = rig({ source: "voicelive", vadGate: "server" });
  r.live.audioOrigin(0);
  r.live.setUi({ answerForm: "number", beat: "check" });
  r.live.herStart("सात गुणा आठ कितना होता है?");
  r.run(2500, () => echo());
  r.live.herEnd();
  const from = 3000, to = 3600;
  const frameAt = (t) => (t >= from && t < to ? { rms: 0.3, f0: 290, her: null } : { rms: 0.001, f0: null, her: null });
  r.run(3700, frameAt);
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "v2", audio_start_ms: from - 210 });
  r.run(4200, frameAt);
  r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "v2", audio_end_ms: to + 596 });
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "v2", transcript: "छप्पन" });
  r.run(7000, frameAt);
  const c = r.acts.find((a) => a[1] === "commit");
  assert.ok(c, JSON.stringify(r.acts));
  assert.equal(c[2], "छप्पन");
  assert.equal(r.live.d5.gatedFrames > 0, true);
});

test("D5: a spoken turn Voice Live never heard (no item at all) is the Director's re-ask (asrConfidence 0)", () => {
  const r = rig({ source: "voicelive", vadGate: "server", supportsCommit: false });
  r.live.setUi({ answerForm: "number", beat: "check" });
  r.live.herStart("सात गुणा आठ कितना होता है?");
  r.run(2500, () => ({ rms: 0.001, f0: null, her: -20 }));
  r.live.herEnd();
  // a lone short "haan" Voice Live never heard: device voicing, no transcript at all
  const frameAt = (t) => (t >= 3000 && t < 3260 ? { rms: 0.3, f0: 290, her: null } : { rms: 0.001, f0: null, her: null });
  // no probes on D5; Voice Live opens no item for the burst: 1 s after it the engine hears an empty final over it
  r.run(15000, frameAt);
  assert.equal(r.acts.filter((a) => a[1] === "probe").length, 0, "no micro-commit probes on D5");
  const c = r.acts.find((a) => a[1] === "commit");
  assert.ok(c, `the engine still ends the turn: ${JSON.stringify(r.acts)}`);
  assert.equal(c[2], "");
  assert.ok(c[0] - 3260 <= 2500, `the re-ask comes at the closed backstop, not +2 s: ${c[0] - 3260} ms after the burst`);
  assert.ok(r.live.d5.reasks >= 1);
});

// ───────────────────────────── lane resolution ─────────────────────────────

test("resolveDuplexLane: d5 only when the server says so", async () => {
  const answer = (j) => async () => new Response(JSON.stringify(j), { status: 200, headers: { "content-type": "application/json" } });
  resetDuplexFlagCache();
  assert.equal(await resolveDuplexLane(answer({ duplex: "on", cohort: "owner", lane: "d5" })), "d5");
  resetDuplexFlagCache();
  assert.equal(await resolveDuplexLane(answer({ duplex: "on", cohort: "owner" })), "d4");
  resetDuplexFlagCache();
  assert.equal(await resolveDuplexLane(answer({ duplex: "shadow" })), "d4");
  resetDuplexFlagCache();
});

// ───────────────────────────── CascadeLink on D5 ─────────────────────────────

const { CascadeLink } = await import("../src/lesson/cascadeLink.ts");

class FakeParam { constructor(v) { this.value = v; } cancelScheduledValues() {} setTargetAtTime(v) { this.value = v; } }
class FakeAudioContext {
  constructor() { this.t0 = performance.now(); this.destination = new FakeNode(this); this.audioWorklet = { addModule: async () => {} }; this.sampleRate = 48000; }
  get currentTime() { return (performance.now() - this.t0) / 1000; }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
  createGain() { const n = new FakeNode(this); n.gain = new FakeParam(1); return n; }
  createAnalyser() { const n = new FakeNode(this); n.fftSize = 1024; n.getFloatTimeDomainData = (b) => b.fill(0); return n; }
  createMediaStreamSource() { return new FakeNode(this); }
  createBuffer(_ch, length, rate) { const data = new Float32Array(length); return { duration: length / rate, getChannelData: () => data }; }
  createBufferSource() { const s = new FakeNode(this); s.start = () => {}; s.stop = () => {}; return s; }
}

function installLinkFakes() {
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
  const wf = installWorkletFakes();
  return { pcs, restore() { wf.restore(); for (const [k, d] of Object.entries(saved)) d ? Object.defineProperty(globalThis, k, d) : delete globalThis[k]; } };
}

const TOKEN = async () => ({ token: "ek_x", expiresAt: 0, base: "https://x.invalid/openai/v1", session: { audio: { input: { turn_detection: { type: "server_vad", silence_duration_ms: 900 } } } } });
const pcm = async () => new ReadableStream({ start(c) { c.close(); } });

async function d5Link() {
  const env = installLinkFakes();
  FakeWS.all = [];
  const states = [];
  const link = new CascadeLink({
    lessonId: "L1", levels: { mic: new LevelMeter(), teacher: new LevelMeter() }, speech: pcm, fetchToken: TOKEN, transcribe: async () => ({ text: "" }),
    duplex: "on", duplexLane: async () => "d5", onDuplex: (s) => states.push(s),
    d5: { WebSocket: FakeWS, workletUrl: "/d5.js", location: { protocol: "https:", host: "taxila.dev" } },
    duplexOptions: { startTap: async () => () => {}, setTimeout: (fn, ms) => (ms >= 3000 ? 0 : setTimeout(fn, ms)) },
  });
  const events = [];
  link.on((e) => events.push(e));
  await link.connect();
  for (const t0 = Date.now(); Date.now() - t0 < 3000 && !(states.at(-1)?.live || states.at(-1)?.fallback);) await sleep(10);
  return { env, link, events, states };
}

test("CascadeLink on D5: no WebRTC call; Voice Live's events reach the engine; the engine's VAD and commits go up the socket", async () => {
  FakeWS.behaviour = FakeWS.up;
  const { env, link, events, states } = await d5Link();
  try {
    assert.equal(env.pcs.length, 0, "no transcription call on D5");
    assert.equal(states.at(-1)?.live, true, JSON.stringify(states.at(-1)));
    const ws = FakeWS.all[0];
    assert.match(ws.url, /^wss:\/\/taxila\.dev\/api\/duplex\/voicelive\?lessonId=L1$/);
    const texts = ws.sent.filter((d) => typeof d === "string").map((d) => JSON.parse(d));
    assert.ok(texts.some((m) => m.type === "vad" && m.silenceMs === 500), `the D5 silence: ${JSON.stringify(texts)}`);
    assert.equal(link.duplex.live.o.vadGate, "server");
    assert.equal(link.duplex.live.o.source, "voicelive");
    ws.server({ type: "input_audio_buffer.speech_started", item_id: "c1", audio_start_ms: 100 });
    ws.server({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "बारह" });
    assert.ok(!events.some((e) => e.type === "child_final"), "a final is not a turn under duplex");
    assert.ok(events.some((e) => e.type === "child_partial" && e.text === "बारह"), "the caption shows");
    link.duplex.live.o.port.sttCommit();
    assert.equal(ws.sent.at(-1), '{"type":"commit"}');
    // round 5: no continuer on D5 until its gate covers it
    assert.ok(link.ack, "the ack client is on");
    assert.equal(link.ack.o.continuer(), false, "no continuer on D5");
  } finally { link.close(); env.restore(); }
});

test("CascadeLink on D5: a refused stream falls back to the D4 call for the lesson", async () => {
  FakeWS.behaviour = FakeWS.refuse;
  const { env, link, states } = await d5Link();
  try {
    assert.equal(env.pcs.length, 1, "the WebRTC call is up instead");
    assert.equal(states.at(-1)?.live, true);
    assert.equal(link.duplex.live.o.vadGate, undefined, "D4 engine options");
    assert.equal(link.ack?.o.continuer(), true, "the D4 fallback keeps the continuer (server cohort decides)");
  } finally { link.close(); env.restore(); FakeWS.behaviour = FakeWS.up; }
});
