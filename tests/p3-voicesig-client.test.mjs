// ship5 p3-voicesig, client half: the ONE shared tap (src/voicesig/lessonTap.ts), the lesson wrapper
// (src/voicesig/lessonFeatures.ts) inside the real LessonRuntime, kv riding on the SAME turn POST, the never-delay rule,
// every fallback to the pre-voicesig path, the switches, and the filler detector through onnxruntime-web when installed.
// No DOM: FrontEndCore is the shipped pure core; the browser glue (AudioWorklet) is injected.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { FrameAnalyzer, RATE } from "../src/voice/dsp.ts";
import { UtteranceTracker } from "../src/voice/tracker.ts";
import { FrontEndCore } from "../src/voicesig/frontend/bus.ts";
import { acquireFrontEnd, tapStats, micClassOf, epochClock } from "../src/voicesig/lessonTap.ts";
import { VoicesigLessonFeatures } from "../src/voicesig/lessonFeatures.ts";
import { voicesigConfig, resetVoicesigConfig, voicesigDeviceAllows } from "../src/voicesig/flag.ts";
import { HEAD_BUDGET_MS, loadFillerModel } from "../src/voicesig/head.ts";
import { turn as seamTurn } from "../server/voicesig/lesson.js";
import { validateKv } from "../server/voicesig/adapter.js";

const ROOT = new URL("..", import.meta.url).pathname;
const flush = () => new Promise((r) => setImmediate(r));
const timers = { setTimeout: () => 0, clearTimeout: () => {} };
const OPEN = async () => ({ mode: "shadow", frontend: true, detector: true });

function synth(segments) {
  const n = segments.reduce((a, g) => a + Math.round((g.ms / 1000) * RATE), 0);
  const x = new Float32Array(n);
  let i = 0, ph = 0;
  for (const g of segments) for (let k = 0; k < Math.round((g.ms / 1000) * RATE); k++, i++) {
    ph += (2 * Math.PI * (g.f0 || 0)) / RATE;
    x[i] = g.f0 ? 0.2 * (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) : 0.0005 * Math.sin(i * 1.7);
  }
  return x;
}
const pushAll = (fe, x, t0) => { for (let i = 0; i + 320 <= x.length; i += 320) fe.push(t0 + (i / RATE) * 1000, x.slice(i, i + 320)); };

/** VoiceFeatures' runtime surface over the REAL tracker, with patch 04's attachFrames (frames from the shared tap). */
class FrameFedFeatures {
  constructor() { this.tracker = new UtteranceTracker(); this.tapped = 0; this.framed = 0; this.detached = 0; this.frames = []; this.off = null; }
  async attachTap() { this.tapped++; }
  attachFrames(_tap, _level, fe) {
    this.framed++;
    this.off = fe.onFrame((f) => { this.frames.push(f); this.tracker.addFrames([{ t: f.t, rmsDb: f.rmsDb, f0: f.f0, speech: f.speech }]); });
  }
  onLinkEvent(e) {
    const t = this.tracker;
    switch (e.type) {
      case "teacher_audio_start": t.teacherAudioStarted(); return null;
      case "teacher_audio_end": t.teacherAudioEnded(e.at ?? Date.now()); return null;
      case "child_speech_start": t.speechStart(e.at); return null;
      case "child_speech_end": t.speechEnd(e.at); return null;
      case "child_final": return t.finalize(e, e.now ?? Date.now());
      default: return null;
    }
  }
  setReadAloudTarget() {}
  detach() { this.detached++; this.off?.(); }
}

class TapLink {
  constructor(levels) { this.mode = "voice"; this.levels = levels; this.fns = new Set(); this.connected = false; this.stream = { getAudioTracks: () => [{ label: "Internal mic", getSettings: () => ({}) }] }; this.ctx = { currentTime: 0 }; }
  on(fn) { this.fns.add(fn); return () => this.fns.delete(fn); }
  emit(e) { for (const fn of [...this.fns]) fn(e); }
  async connect() { this.connected = true; this.emit({ type: "connection", state: "connected" }); }
  micTap() { return this.connected ? { stream: this.stream, ctx: this.ctx, teacherEnd: "local" } : null; }
  applyInstructions() {} sendChild(text) { this.emit({ type: "child_final", text, startedAt: Date.now(), typed: true }); }
  promptTeacher() {} interrupt() {} setPushToTalk() {} talkStart() {} talkEnd() {} close() { this.connected = false; }
}

function api() {
  const calls = { turn: [] };
  return {
    calls,
    start: async () => ({ lessonId: "L1", topic: { id: "t", title: "T", chapter: "1" }, instructions: "I", teacher: { id: "a", name: "A", voice: "marin" }, moduleCommands: [], ui: {} }),
    turn: async (req) => { calls.turn.push(JSON.parse(JSON.stringify(req))); return { instructions: "I2", move: { kind: "probe", shape: "s" }, moduleCommands: [], ui: {} }; },
    end: async () => ({ ok: true }),
    realtimeToken: async () => { throw new Error("unused"); },
  };
}

/** An injected "attach": the pure FrontEndCore, counted (the browser glue adds only the worklet). */
function fakeAttach(stats) {
  return async (o) => {
    stats.attaches++;
    const fe = new FrontEndCore({ herAudible: o.herAudible, micClass: o.micClass });
    stats.fe = fe;
    return { fe, rawTrack: null, detach() { stats.detaches++; } };
  };
}

async function lesson({ acquire, config = OPEN, loadDetector } = {}) {
  const a = api();
  let link;
  const inner = new FrameFedFeatures();
  const vf = new VoicesigLessonFeatures({ inner, config, acquire, loadDetector });
  const rt = new LessonRuntime({ api: a, timers, createLink: (_m, ctx) => (link = new TapLink(ctx.levels)), voiceFeatures: () => vf });
  await rt.start("child-1", "voice");
  await flush(); await flush();
  return { rt, a, link, vf, inner };
}

function speak(link, fe, t0) {
  pushAll(fe, synth([{ ms: 3800 }, { ms: 800, f0: 260 }, { ms: 600 }]), t0);
  link.emit({ type: "teacher_audio_start" });
  link.emit({ type: "teacher_audio_end", at: t0 + 3000 });
  link.emit({ type: "child_speech_start", at: t0 + 3800 });
  link.emit({ type: "child_speech_end", at: t0 + 4600 });
  link.emit({ type: "child_final", text: "paanch", startedAt: t0 + 3800, typed: false, asrConfidence: 0.9, itemId: "item_x", now: t0 + 5200 });
}

test("ONE tap: the utterance numbers and the voicesig head read the same front-end; kv rides on the SAME turn POST", async () => {
  const stats = { attaches: 0, detaches: 0 };
  const acquire = (o) => acquireFrontEnd({ ...o, workletUrl: "x", attach: fakeAttach(stats) });
  const { rt, a, link, vf, inner } = await lesson({ acquire });
  assert.equal(vf.path, "shared");
  assert.equal(inner.framed, 1, "src/voice fed from the shared tap");
  assert.equal(inner.tapped, 0, "src/voice's own worklet never opened (G-VS-ONE)");
  assert.equal(stats.attaches, 1);
  speak(link, stats.fe, Date.now() - 6000);
  await flush(); await flush();
  const req = a.calls.turn[0];
  assert.ok(req.voiceFeatures.features, "the shipped numbers still ride");
  assert.ok(Math.abs(req.voiceFeatures.features.onsetMs - 800) <= 40, `features onset ${req.voiceFeatures.features.onsetMs}`);
  const kv = req.voiceFeatures.kv;
  assert.ok(kv, "kv rides on the same turn");
  assert.ok(validateKv(kv), "the server's validator accepts it");
  assert.ok(Math.abs(kv.f.onsetMs - 800) <= 40, `kv onset ${kv.f.onsetMs}`);
  assert.equal(kv.stage, 0);
  assert.equal(kv.q.det, 0, "no detector loaded → stage-0 measurements");
  assert.ok(!JSON.stringify(kv).includes("paanch"), "numbers only: no words, no audio");
  assert.equal("kv" in req.voiceFeatures.features, false, "kv is top-level, never inside features (that would 400)");
  // ...and the server reads it end to end (shadow)
  const read = seamTurn({ kv, childText: "umm shayad paanch", cls: { outcome: "correct", flags: {} }, item: { id: "i", answer: "5" }, classLevel: 5, env: {} });
  assert.equal(read.read.state, "fragileCorrect");
  assert.deepEqual(read.hints, {}, "shadow");
  await rt.end();
  assert.equal(stats.detaches, 1, "the tap is released with the lesson");
  assert.deepEqual(tapStats(), { attached: false, refs: 0 });
});

test("G-VS-DXEQ: the frames src/voice receives from the shared tap equal its own FrameAnalyzer's", async () => {
  const fe = new FrontEndCore();
  const got = [];
  fe.onFrame((f) => got.push({ t: f.t, rmsDb: f.rmsDb, f0: f.f0, speech: f.speech }));
  const x = synth([{ ms: 500 }, { ms: 900, f0: 220 }, { ms: 400 }]);
  pushAll(fe, x, 1_000_000);
  const fa = new FrameAnalyzer();
  const want = [];
  for (let i = 0; i + 320 <= x.length; i += 320) want.push(...fa.push(x.slice(i, i + 320), 1_000_000 + (i / RATE) * 1000));
  assert.equal(got.length, want.length);
  assert.deepEqual(got, want.map((f) => ({ t: f.t, rmsDb: f.rmsDb, f0: f.f0, speech: f.speech })));
});

test("G-VS-ONE: concurrent consumers (voice features + duplex glue) share one attach; the last release detaches", async () => {
  const stats = { attaches: 0, detaches: 0 };
  const tap = { ctx: { currentTime: 0 }, stream: { getAudioTracks: () => [] } };
  const o = { ...tap, workletUrl: "x", attach: fakeAttach(stats) };
  const [l1, l2] = await Promise.all([acquireFrontEnd(o), acquireFrontEnd(o)]);
  assert.equal(stats.attaches, 1);
  assert.equal(l1.fe, l2.fe);
  assert.deepEqual(tapStats(), { attached: true, refs: 2 });
  l1.release(); l1.release();
  assert.equal(stats.detaches, 0);
  l2.release();
  assert.equal(stats.detaches, 1);
  // a new link (new context) replaces the dead front-end instead of failing on "a second front-end"
  const l3 = await acquireFrontEnd(o);
  const l4 = await acquireFrontEnd({ ...o, ctx: { currentTime: 0 } });
  assert.notEqual(l3.fe, l4.fe);
  assert.equal(stats.detaches, 2);
  l3.release(); l4.release();
  assert.deepEqual(tapStats(), { attached: false, refs: 0 });
});

test("fallback: a shared tap that fails to attach leaves the lesson on the previous path (own worklet, no kv)", async () => {
  const acquire = async () => { throw new Error("worklet refused"); };
  const { rt, a, link, vf, inner } = await lesson({ acquire });
  assert.equal(vf.path, "fallback");
  assert.equal(inner.tapped, 1, "VoiceFeatures.attachTap, as before this stream");
  const fa = new FrameAnalyzer();
  const t0 = Date.now() - 6000;
  const x = synth([{ ms: 3800 }, { ms: 800, f0: 260 }, { ms: 600 }]);
  for (let i = 0; i + 320 <= x.length; i += 320) inner.tracker.addFrames(fa.push(x.slice(i, i + 320), t0 + (i / RATE) * 1000));
  link.emit({ type: "teacher_audio_start" }); link.emit({ type: "teacher_audio_end", at: t0 + 3000 });
  link.emit({ type: "child_speech_start", at: t0 + 3800 }); link.emit({ type: "child_speech_end", at: t0 + 4600 });
  link.emit({ type: "child_final", text: "paanch", startedAt: t0 + 3800, typed: false, asrConfidence: 0.9, now: t0 + 5200 });
  await flush(); await flush();
  assert.ok(a.calls.turn[0].voiceFeatures.features);
  assert.equal(a.calls.turn[0].voiceFeatures.kv, undefined);
  await rt.end();
});

test("switches: the server kill (config frontend:false / mode off) and an inner without attachFrames take the old path", async () => {
  for (const config of [async () => ({ mode: "off", frontend: false, detector: false }), async () => ({ mode: "shadow", frontend: false, detector: true })]) {
    let acquired = 0;
    const { rt, vf, inner } = await lesson({ config, acquire: async () => { acquired++; throw new Error("unused"); } });
    assert.equal(vf.path, "fallback");
    assert.equal(acquired, 0);
    assert.equal(inner.tapped, 1);
    await rt.end();
  }
  const old = { tapped: 0, async attachTap() { this.tapped++; }, onLinkEvent: () => null, setReadAloudTarget() {}, detach() {} };
  const vf = new VoicesigLessonFeatures({ inner: old, config: OPEN, acquire: async () => { throw new Error("unused"); } });
  await vf.attachTap({ ctx: {}, stream: { getAudioTracks: () => [] }, teacherEnd: "local" });
  assert.equal(vf.path, "fallback");
  assert.equal(old.tapped, 1);
});

test("config: fails OPEN on a network error or a non-200; a kill is honoured; one request per page", async () => {
  resetVoicesigConfig();
  assert.deepEqual(await voicesigConfig(async () => { throw new Error("net"); }), { mode: "shadow", frontend: true, detector: true });
  resetVoicesigConfig();
  assert.deepEqual(await voicesigConfig(async () => ({ ok: false })), { mode: "shadow", frontend: true, detector: true });
  resetVoicesigConfig();
  assert.deepEqual(await voicesigConfig(async () => ({ ok: true, json: async () => ({ mode: "off", frontend: false, detector: false }) })), { mode: "off", frontend: false, detector: false });
  resetVoicesigConfig();
  let calls = 0;
  const f = async () => { calls++; return { ok: true, json: async () => ({ mode: "shadow" }) }; };
  await voicesigConfig(f); await voicesigConfig(f);
  assert.equal(calls, 1, "once per page");
  resetVoicesigConfig();
  assert.equal(voicesigDeviceAllows(), true, "ships on");
});

test("never delay the turn: a detector slower than the budget leaves stage-0 kv on the request", async () => {
  const stats = { attaches: 0, detaches: 0 };
  const acquire = (o) => acquireFrontEnd({ ...o, workletUrl: "x", attach: fakeAttach(stats) });
  // a session that never answers within the budget
  const slow = { session: { run: () => new Promise((r) => setTimeout(() => r({ p: { data: new Float32Array(0) } }), 400)) }, ort: { Tensor: class { constructor() {} } }, thr: 0.44, ver: "slow" };
  const { rt, a, link, vf } = await lesson({ acquire, loadDetector: async () => slow });
  await flush();
  const t0 = Date.now() - 6000;
  const sentAt = Date.now();
  speak(link, stats.fe, t0);
  await flush(); await flush();
  assert.ok(Date.now() - sentAt < 200, "the request went out without waiting");
  assert.equal(a.calls.turn[0].voiceFeatures.kv.q.det, 0);
  await new Promise((r) => setTimeout(r, HEAD_BUDGET_MS + 30));
  assert.equal(vf.stats.detectorLate, 1, "the late detector was dropped for that turn");
  await rt.end();
});

test("a detector that answers inside the budget upgrades kv on the same utterance object (det = 1, filler fields)", async () => {
  const stats = { attaches: 0, detaches: 0 };
  const acquire = (o) => acquireFrontEnd({ ...o, workletUrl: "x", attach: fakeAttach(stats) });
  // a fast stand-in session: P(filler) high for the first 300 ms of speech, low after
  const fast = { session: { run: async (feeds) => { const T = feeds.x.dims[1]; return { p: { data: Float32Array.from({ length: T }, (_, i) => (i > 190 && i < 205 ? 0.9 : 0.05)) } }; } },
    ort: { Tensor: class { constructor(_t, d, dims) { this.data = d; this.dims = dims; } } }, thr: 0.44, ver: "fake" };
  const inner = new FrameFedFeatures();
  const vf = new VoicesigLessonFeatures({ inner, config: OPEN, acquire, loadDetector: async () => fast });
  await vf.attachTap({ ctx: { currentTime: 0 }, stream: { getAudioTracks: () => [] }, teacherEnd: "local" });
  await flush(); await flush();
  const t0 = Date.now() - 6000;
  pushAll(stats.fe, synth([{ ms: 3800 }, { ms: 800, f0: 260 }, { ms: 600 }]), t0);
  vf.onLinkEvent({ type: "teacher_audio_start" });
  vf.onLinkEvent({ type: "teacher_audio_end", at: t0 + 3000 });
  vf.onLinkEvent({ type: "child_speech_start", at: t0 + 3800 });
  vf.onLinkEvent({ type: "child_speech_end", at: t0 + 4600 });
  const u = vf.onLinkEvent({ type: "child_final", text: "paanch", startedAt: t0 + 3800, typed: false, now: t0 + 5200 });
  assert.equal(u.kv.q.det, 0, "stage-0 kv is there synchronously");
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(u.kv.q.det, 1, "upgraded in place");
  assert.ok(typeof u.kv.f.fillerRuns === "number");
  assert.ok(validateKv(u.kv));
  vf.detach();
  assert.deepEqual(tapStats(), { attached: false, refs: 0 });
});

test("micClass from the track label; epoch clock = src/voice's formula", () => {
  assert.equal(micClassOf({ label: "Bluetooth headset (HFP)" }), "bt");
  assert.equal(micClassOf({ label: "AirPods Pro" }), "bt");
  assert.equal(micClassOf({ label: "Wired headset" }), "wired");
  assert.equal(micClassOf({ label: "Default - Microphone (Realtek)" }), "builtin");
  assert.equal(micClassOf({ label: "" }), "unknown");
  const clk = epochClock({ currentTime: 10 }, { getSettings: () => ({ latency: 0.02 }) }, () => 50_000);
  assert.equal(clk(9.5), 50_000 - 500 - 20);
});

// The real detector through onnxruntime-web (patch 08 adds the dependency). Skipped, with a reason, until it is installed.
const require = createRequire(import.meta.url);
let ortPath = null;
try { ortPath = require.resolve("onnxruntime-web"); } catch { ortPath = process.env.VS_ORT ? require.resolve("onnxruntime-web", { paths: [process.env.VS_ORT] }) : null; }
test("filler detector: the shipped AMI graph loads in onnxruntime-web and runs one 30 s turn (latency printed, not gated on a shared box)", { skip: ortPath ? false : "onnxruntime-web not installed (patch 08)" }, async () => {
  const ort = await import(ortPath);
  ort.env.wasm.numThreads = 1;
  const card = JSON.parse(readFileSync(`${ROOT}models/voicesig/filler-gru.json`, "utf8"));
  const m = await loadFillerModel(ort, new Uint8Array(readFileSync(`${ROOT}models/voicesig/filler-gru.onnx`)), card.threshold, card.ver);
  assert.ok(m, "loaded");
  const T = 1500, x = new Float32Array(T * 22).map((_, i) => Math.sin(i / 7) * 0.5);
  const { detect } = await import("../src/voicesig/head.ts");
  const ms = [];
  let p;
  for (let k = 0; k < 7; k++) { const t = performance.now(); p = await detect(m, x, T); ms.push(performance.now() - t); }
  assert.equal(p.length, T);
  assert.ok(p.every((v) => v >= 0 && v <= 1));
  ms.sort((a, b) => a - b);
  console.log(`# filler detector, 30 s turn, onnxruntime-web node wasm 1 thread: p50 ${ms[3].toFixed(2)} ms (n=7)`);
});
