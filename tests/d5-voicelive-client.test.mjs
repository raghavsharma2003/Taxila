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
    stop: () => acts.push([clock, "stop"]), commit: (t) => acts.push([clock, "commit", t.text, t.duplex?.unheard ?? null]), sttCommit: () => acts.push([clock, "probe"]),
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

// D5 review #6 (CRITICAL): an empty turn on D5 only from Voice Live's own item; a burst only the device heard is never a turn
function afterQuestion(opts = {}) {
  const r = rig({ source: "voicelive", vadGate: "server", supportsCommit: false, ...opts });
  r.live.audioOrigin(0);
  r.live.setUi({ answerForm: "number", beat: "check" });
  r.live.herStart("सात गुणा आठ कितना होता है?");
  r.run(2500, () => ({ rms: 0.001, f0: null, her: -20 }));
  r.live.herEnd();
  return r;
}
const burst = (from, to) => (t) => (t >= from && t < to ? { rms: 0.3, f0: 290, her: null } : { rms: 0.001, f0: null, her: null });

test("D5 #6: a burst only the device heard (Voice Live opened no item) is never a child turn; the floor returns and the next answer is clean", () => {
  const r = afterQuestion();
  r.run(15000, burst(3000, 3260));
  assert.equal(r.acts.filter((a) => a[1] === "probe").length, 0, "no micro-commit probes on D5");
  assert.equal(r.acts.filter((a) => a[1] === "commit").length, 0, `no empty turn from a device-only burst: ${JSON.stringify(r.acts)}`);
  // the child then answers and Voice Live hears it: that answer is the turn, alone
  const f = burst(16000, 16600);
  r.run(16700, f);
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "v9", audio_start_ms: 16000 - 210 });
  r.run(17200, f);
  r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "v9", audio_end_ms: 16600 + 596 });
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "v9", transcript: "छप्पन" });
  r.run(20000, f);
  assert.deepEqual(r.acts.filter((a) => a[1] === "commit").map((c) => c[2]), ["छप्पन"]);
});

test("census F5: the hold offer after 'wait' is the floor's own wordless move; the hold request's words are never re-sent", () => {
  const r = afterQuestion();
  const f = burst(3000, 3500);
  r.run(3600, f);
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "w1", audio_start_ms: 3000 - 210 });
  r.run(3900, f);
  r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "w1", audio_end_ms: 3500 + 340 });
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "w1", transcript: "रुको" });
  r.run(30000, f);
  const c = r.acts.filter((a) => a[1] === "commit");
  assert.ok(c.length >= 1, `the hold offer came: ${JSON.stringify(r.acts.filter((a) => a[1] !== "duck"))}`);
  assert.deepEqual(c.map((x) => x[2]), c.map(() => ""), "no commit carries the hold request's words");
});

for (const ending of ["failed", "empty"]) {
  test(`D5 #6: Voice Live opened an item and its final was ${ending}: the ear covered the burst → the Director's re-ask (an empty turn)`, () => {
    const r = afterQuestion();
    const f = burst(3000, 3260);
    r.run(3700, f);
    r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "v3", audio_start_ms: 3000 - 210 });
    r.run(4000, f);
    r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "v3", audio_end_ms: 3260 + 340 });
    r.live.stt(ending === "failed"
      ? { type: "conversation.item.input_audio_transcription.failed", item_id: "v3", error: { message: "x" } }
      : { type: "conversation.item.input_audio_transcription.completed", item_id: "v3", transcript: "" });
    r.run(15000, f);
    const c = r.acts.filter((a) => a[1] === "commit");
    assert.equal(c.length, 1, JSON.stringify(r.acts));
    assert.equal(c[0][2], "");
    assert.ok(c[0][0] - 3260 <= 2500, `at the closed backstop: ${c[0][0] - 3260} ms after the burst`);
    assert.ok(r.live.d5.reasks >= 1);
    // census F5: the child spoke and the ear found no words: the turn says so (the server reads it as a re-ask, not silence)
    assert.equal(c[0][3], true, "an unheard turn, never silence");
  });
}

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
    const { D5_SERVER_VAD_MS } = await import("../src/duplex/cascadeDuplex.ts");
    assert.ok(texts.some((m) => m.type === "vad" && m.silenceMs === D5_SERVER_VAD_MS), `the D5 silence: ${JSON.stringify(texts)}`);
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

test("D5 review #2/#7: D5 lost mid-lesson and the reconnect lands on D4 → the engine is REBUILT for D4 (no D5 settings on a D4 call)", async () => {
  FakeWS.behaviour = FakeWS.up;
  const { env, link, states } = await d5Link();
  try {
    const d5Engine = link.duplex;
    assert.equal(d5Engine.live.o.vadGate, "server");
    // her gain ducked and the mic gated by the D5 engine: none of it may outlive it
    link.player?.duck(0.2);
    link["micGated"] = true;
    FakeWS.behaviour = FakeWS.refuse;
    FakeWS.all[0].readyState = 3;
    FakeWS.all[0].onclose?.({ code: 1006 });
    for (const t0 = Date.now(); Date.now() - t0 < 5000 && !(link.duplex && link.duplex !== d5Engine && states.at(-1)?.live);) await sleep(10);
    assert.equal(env.pcs.length, 1, "the D4 call is up");
    assert.notEqual(link.duplex, d5Engine, "a new engine");
    assert.equal(d5Engine.closed, true, "the D5 engine is closed");
    assert.equal(link.duplex.live.o.vadGate, undefined, "no server-VAD gate on D4");
    assert.equal(link.duplex.live.o.source, "live_transcribe");
    assert.equal(link.duplex.live.o.supportsCommit, true);
    assert.equal(link["duplexLaneBuilt"], "d4");
  } finally { link.close(); env.restore(); FakeWS.behaviour = FakeWS.up; }
});

test("D5 review #5: Voice Live's audio clock is anchored across dropped frames and capture gaps (no drift)", async () => {
  const wf = installWorkletFakes();
  FakeWS.behaviour = FakeWS.up;
  let now = 10_000;
  try {
    const s = new D5Stream({ WebSocket: FakeWS, workletUrl: "/d5.js", location: { protocol: "https:", host: "taxila.dev" }, now: () => now });
    await s.start({ lessonId: "L1", ctx: fakeCtx(), mic: {}, herOutput: null, onEvent: () => {}, onLost: () => {} });
    const node = wf.nodes.find((n) => n.name === "taxila-d5-stereo");
    // the AudioContext clock starts at 2.0 s; each chunk arrives 25 ms after its capture began (one chunk + 5 ms)
    const ctx0 = 2.0, wall0 = 10_000 - 2000;
    const post = (k) => { const t = ctx0 + k * 0.02; now = wall0 + t * 1000 + 25; node.port.onmessage({ data: { t, pcm: new Int16Array(640).buffer } }); };
    for (let k = 0; k < 50; k++) post(k); // 1 s sent: audio 0..1000 ms
    assert.equal(s.anchorCount, 1);
    // client time of audio 500 ms = capture at ctx 2.5 s
    assert.equal(Math.round(s.toClient(500)), Math.round(wall0 + 2500 + 5));
    // a stalled uplink drops 10 chunks (200 ms of capture never reach Voice Live)
    FakeWS.last.bufferedAmount = 1 << 20;
    for (let k = 50; k < 60; k++) post(k);
    FakeWS.last.bufferedAmount = 0;
    for (let k = 60; k < 110; k++) post(k);
    // the context suspended for 3 s
    for (let k = 260; k < 300; k++) post(k);
    assert.equal(s.anchorCount, 3, "one anchor per discontinuity");
    // Voice Live's audio 1500 ms is the 25th chunk after the drop: capture chunk 60 + 25 = 85
    assert.equal(Math.round(s.toClient(1500)), Math.round(wall0 + (ctx0 + 85 * 0.02) * 1000 + 5));
    // audio 2100 ms is chunk 260 + 5 (after the suspend); the naive origin + 2100 would be ~3.2 s early
    assert.equal(Math.round(s.toClient(2100)), Math.round(wall0 + (ctx0 + 265 * 0.02) * 1000 + 5));
    // the engine reads Voice Live's events through this clock
    const live = new DuplexLive({ lessonId: "t", port: { duck() {}, pause: () => true, resume() {}, stop() {}, commit() {}, sttCommit() {}, dropReply() {}, fallback() {}, state() {} }, now: () => now, setInterval: () => 1, clearInterval: () => {}, source: "voicelive", vadGate: "server" });
    live.audioOrigin(s.firstFrameAt);
    live.audioClock((ms) => s.toClient(ms));
    assert.equal(live["tap"].fromAudio(2100), s.toClient(2100));
    s.close();
  } finally { wf.restore(); }
});

test("r5 merge: her EARLY reply (turn-audio, before its text) is announced to the engine at first sound; a revoked turn's reply is parked, not voiced", async () => {
  FakeWS.behaviour = FakeWS.up;
  const { env, link } = await d5Link();
  try {
    const live = link.duplex.live;
    const pcmStream = () => new ReadableStream({ start(c) { c.enqueue(new Uint8Array(24000 * 2 * 0.5)); c.close(); } });
    // the engine just saw the child go on after its commit: the reply to that commit must not play
    link.duplex["dropUntil"] = Date.now() + 5000;
    assert.equal(link["playEarly"](pcmStream()), null, "parked");
    assert.equal(link.duplex.replyDropPending(), true, "not consumed: promptTeacher still drops it");
    link.duplex["dropUntil"] = 0;
    const say = link["playEarly"](pcmStream());
    assert.ok(say);
    say.say("आठ गुणा सात।");
    for (const t0 = Date.now(); Date.now() - t0 < 2000 && !live["her"];) await sleep(10);
    assert.ok(live["her"], "the engine knows she is speaking before her turn's text arrives");
    assert.equal(live["her"].text, "आठ गुणा सात।");
    const id = live["her"].id;
    link.promptTeacher({ text: "आठ गुणा सात छप्पन होता है। अब बताओ, नौ गुणा सात?" });
    assert.equal(live["her"]?.id, id, "adoption does not restart her (the overlap epoch stays)");
    // the whole line reached the engine: its closing question hands the floor over at her end
    assert.equal(live["host"]["her"].text, "आठ गुणा सात छप्पन होता है। अब बताओ, नौ गुणा सात?");
    assert.equal(live["host"]["her"].handsOver, true, "hand-over read from the whole line");
  } finally { link.close(); env.restore(); }
});

test("D5 EOT step 1: a closed answer whose covering final carries its value commits AT that final (not ~400 ms later)", () => {
  const r = afterQuestion();
  const f = burst(3000, 3600);
  r.run(3700, f);
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "v1", audio_start_ms: 3000 - 210 });
  r.run(4300, f);
  r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "v1", audio_end_ms: 3600 + 340 });
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "v1", transcript: "8 कॉर्नर्स होते हैं" });
  const finalAt = r.t;
  r.run(8000, f);
  const c = r.acts.find((a) => a[1] === "commit");
  assert.ok(c, JSON.stringify(r.acts));
  assert.ok(c[0] - finalAt <= 120, `at the final: ${c[0] - finalAt} ms after it`);
});

test("D5 EOT step 2: an empty final on a closed question re-asks D5_EMPTY_FINAL_REASK_MS after it", async () => {
  const { D5_EMPTY_FINAL_REASK_MS } = await import("../src/duplex/config.ts");
  const r = afterQuestion();
  const f = burst(3000, 3260);
  r.run(3700, f);
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "v3", audio_start_ms: 3000 - 210 });
  r.run(4060, f);
  r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "v3", audio_end_ms: 3260 + 340 });
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "v3", transcript: "" });
  const finalAt = r.t;
  r.run(8000, f);
  const c = r.acts.find((a) => a[1] === "commit");
  assert.ok(c && c[2] === "", JSON.stringify(r.acts));
  const after = c[0] - finalAt;
  assert.ok(after >= D5_EMPTY_FINAL_REASK_MS - 20 && after <= D5_EMPTY_FINAL_REASK_MS + 120, `${after} ms after the empty final`);
});

test("D5 review follow-up: an idle-closed stream (no audio >30 s: phone locked) reconnects only once audio can flow, then cleanly", async () => {
  FakeWS.behaviour = FakeWS.up;
  const { env, link } = await d5Link();
  try {
    const ctx = link["ctx"];
    const listeners = new Set();
    ctx.state = "suspended";
    ctx.addEventListener = (k, fn) => { if (k === "statechange") listeners.add(fn); };
    ctx.removeEventListener = (k, fn) => { if (k === "statechange") listeners.delete(fn); };
    const engine = link.duplex;
    const first = FakeWS.all.at(-1);
    // the server ends the idle stream: its reason, then the close
    first.server({ type: "d5.closed", reason: "client_idle" });
    first.readyState = 3;
    first.onclose?.({ code: 1001 });
    await sleep(1500);
    assert.equal(FakeWS.all.at(-1), first, "no reconnect while the context is suspended (it would idle out again)");
    assert.ok(listeners.size >= 1, "waiting for the context to run");
    // the child comes back: the context runs again
    ctx.state = "running";
    for (const fn of [...listeners]) fn();
    for (const t0 = Date.now(); Date.now() - t0 < 4000 && !(FakeWS.all.at(-1) !== first && link["d5"]);) await sleep(10);
    assert.notEqual(FakeWS.all.at(-1), first, "one new stream");
    assert.equal(FakeWS.all.length, 2, "exactly one reconnect");
    assert.equal(listeners.size, 0, "the wait is cleared");
    assert.equal(link.duplex, engine, "the same lane: the engine is kept");
  } finally { link.close(); env.restore(); }
});

// ───────────────────────────── round 5 truth bar: the verdict hold ─────────────────────────────

const audioBytes = () => new ReadableStream({ start(c) { c.enqueue(new Uint8Array(24000)); c.close(); } });
async function firstSoundAfter(link, events, start) {
  for (const t0 = Date.now(); Date.now() - t0 < 4000 && !events.some((e) => e.type === "teacher_audio_start");) await sleep(10);
  const ev = events.some((e) => e.type === "teacher_audio_start");
  return ev ? Date.now() - start : null;
}

for (const path of ["promptTeacher", "early audio"]) {
  test(`truth bar: her reply to a closed-value turn does not sound before the verdict hold (${path}); with no hold it sounds at once`, async () => {
    FakeWS.behaviour = FakeWS.up;
    const { env, link, events } = await d5Link();
    try {
      link["speech"] = async () => audioBytes();
      const play = () => (path === "promptTeacher" ? link.promptTeacher({ text: "दो बटा दो? चलो देखते हैं।", seq: 3 }) : link["playEarly"](audioBytes()));
      // no hold: sounds at once
      let t = Date.now();
      play();
      const free = await firstSoundAfter(link, events, t);
      assert.ok(free !== null && free < 450, `no hold: ${free} ms`);
      link.interrupt();
      events.length = 0;
      // a closed-value commit's hold 700 ms ahead
      link.duplex["verdictHold"] = Date.now() + 700;
      t = Date.now();
      play();
      const held = await firstSoundAfter(link, events, t);
      assert.ok(held !== null && held >= 680, `held: ${held} ms`);
    } finally { link.close(); env.restore(); }
  });
}

test("truth bar: the child's correction during the hold stops her reply before any of it sounds", async () => {
  FakeWS.behaviour = FakeWS.up;
  const { env, link, events } = await d5Link();
  try {
    link["speech"] = async () => audioBytes();
    link.duplex["verdictHold"] = Date.now() + 800;
    link.promptTeacher({ text: "दो बटा दो, बहुत अच्छा!", seq: 4 });
    await sleep(200);
    // the engine revokes on the child's "नहीं…": its yield stops the reply (port.stop) inside the hold
    link.duplex.live.o.port.stop();
    await sleep(1200);
    assert.ok(!events.some((e) => e.type === "teacher_audio_start"), "nothing of the reply sounded");
  } finally { link.close(); env.restore(); }
});

test("truth bar: the engine's commit carries the verdict hold (value end + VERDICT_HOLD_MS or later) only on a closed answer with a value", async () => {
  const { VERDICT_HOLD_MS } = await import("../src/duplex/config.ts");
  const turns = [];
  const say = (ui, from, to, text) => {
    const r = rig({ source: "voicelive", vadGate: "server", supportsCommit: false });
    r.live.o.port.commit = (t) => { turns.push({ ...t, at: r.t }); r.acts.push([r.t, "commit", t.text]); };
    r.live.audioOrigin(0);
    r.live.setUi(ui);
    r.live.herStart("बताओ?");
    r.run(2500, () => ({ rms: 0.001, f0: null, her: -20 }));
    r.live.herEnd();
    const f = burst(from, to);
    r.run(from + 700, f);
    r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "v", audio_start_ms: from - 210 });
    r.run(to + 500, f);
    r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "v", audio_end_ms: to + 340 });
    r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "v", transcript: text });
    r.run(to + 9000, f);
    return turns.at(-1);
  };
  const closed = say({ answerForm: "number", beat: "check" }, 3000, 3600, "छप्पन");
  assert.ok(closed && typeof closed.verdictHoldUntil === "number", JSON.stringify(closed));
  assert.ok(closed.verdictHoldUntil >= 3600 + VERDICT_HOLD_MS - 100, `hold ${closed.verdictHoldUntil - 3600} ms after the value's end`);
  const empty = say({ answerForm: "number", beat: "check" }, 3000, 3260, "");
  assert.equal(empty?.verdictHoldUntil, undefined, "no value (a re-ask): no hold");
  const open = say({ answerForm: "explanation", beat: "explain" }, 3000, 4600, "क्योंकि दोनों में उतने ही हिस्से हैं");
  assert.equal(open?.verdictHoldUntil, undefined, "an open answer: no hold");
});
