// Voice features wired into a real lesson: LessonRuntime attaches VoiceFeatures to the voice link's own mic
// (TeacherLink.micTap), feeds it every link event in order, and a spoken child_final's features ride on that
// SAME turn's POST /api/lesson/turn (TurnRequest.voiceFeatures). No DOM: the VoiceFeatures stand-in wraps the
// real UtteranceTracker over synthetic frames, so the windowing rules under test are the shipped ones.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { FrameAnalyzer, RATE } from "../src/voice/dsp.ts";
import { UtteranceTracker } from "../src/voice/tracker.ts";

const flush = () => new Promise((r) => setImmediate(r));
const timers = { setTimeout: () => 0, clearTimeout: () => {} };

/** 16 kHz audio from { ms, f0? } segments. */
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

/** The runtime-facing VoiceFeatures surface over the real tracker (the browser one adds only WebAudio). */
class TrackerFeatures {
  constructor() { this.tracker = new UtteranceTracker(); this.attached = null; this.detached = 0; this.target = null; }
  async attachTap(tap, level) { this.attached = { tap, level }; }
  feed(x, t0) {
    const fa = new FrameAnalyzer();
    for (let i = 0; i < x.length; i += 320) this.tracker.addFrames(fa.push(x.slice(i, i + 320), t0 + (i / RATE) * 1000));
  }
  onLinkEvent(e) {
    const t = this.tracker;
    switch (e.type) {
      case "teacher_audio_start": t.teacherAudioStarted(); return null;
      case "teacher_audio_end": t.teacherAudioEnded(e.at ?? Date.now()); return null;
      case "child_speech_start": t.speechStart(e.at); return null;
      case "child_speech_end": t.speechEnd(e.at); return null;
      case "child_silent": t.cancel(); return null;
      case "child_final": return t.finalize(e, e.now ?? Date.now());
      default: return null;
    }
  }
  setReadAloudTarget(text) { this.target = text; this.tracker.setReadAloudTarget(text); }
  detach() { this.detached++; }
}

class TapLink {
  constructor(levels) { this.mode = "voice"; this.levels = levels; this.fns = new Set(); this.connected = false; }
  on(fn) { this.fns.add(fn); return () => this.fns.delete(fn); }
  emit(e) { for (const fn of [...this.fns]) fn(e); }
  async connect() { this.connected = true; this.emit({ type: "connection", state: "connected" }); }
  micTap() { return this.connected ? { stream: { fake: true }, ctx: { fake: true }, teacherEnd: "local" } : null; }
  applyInstructions() {}
  sendChild(text) { this.emit({ type: "child_final", text, startedAt: Date.now(), typed: true }); }
  promptTeacher() {}
  interrupt() {}
  setPushToTalk() {}
  talkStart() {}
  talkEnd() {}
  close() { this.connected = false; }
}

function api(ui = {}) {
  const calls = { turn: [] };
  return {
    calls,
    start: async () => ({ lessonId: "L1", topic: { id: "t", title: "T", chapter: "1" }, instructions: "I", teacher: { id: "a", name: "A", voice: "marin" }, moduleCommands: [], ui }),
    turn: async (req) => { calls.turn.push(req); return { instructions: "I2", move: { kind: "probe", shape: "s" }, moduleCommands: [], ui: {} }; },
    end: async () => ({ ok: true }),
    realtimeToken: async () => { throw new Error("unused"); },
  };
}

async function lesson(ui) {
  const a = api(ui);
  let link;
  const vf = new TrackerFeatures();
  const rt = new LessonRuntime({ api: a, timers, createLink: (_m, ctx) => (link = new TapLink(ctx.levels)), voiceFeatures: () => vf });
  await rt.start("child-1", "voice");
  await flush();
  return { rt, a, link, vf };
}

test("runtime attaches voice features to the link's own mic and teacher meter", async () => {
  const { rt, link, vf } = await lesson();
  assert.ok(vf.attached, "attachTap was called");
  assert.deepEqual(vf.attached.tap, link.micTap());
  assert.equal(vf.attached.level, rt.levels.teacher);
  await rt.end();
  assert.equal(vf.detached, 1, "detached on close (before the link closes its context)");
});

test("a spoken turn carries its own features on the SAME turn POST; a cough before it changes nothing", async () => {
  const { rt, a, link, vf } = await lesson();
  const t0 = Date.now() - 6000;
  vf.feed(synth([{ ms: 3800 }, { ms: 800, f0: 260 }, { ms: 600 }]), t0);
  link.emit({ type: "teacher_audio_start" });
  link.emit({ type: "child_speech_start", at: t0 + 500 });     // a cough over the teacher
  link.emit({ type: "child_silent" });
  link.emit({ type: "teacher_audio_end", at: t0 + 3000 });
  link.emit({ type: "child_speech_start", at: t0 + 3800 });
  link.emit({ type: "child_speech_end", at: t0 + 4600 });
  link.emit({ type: "child_final", text: "paanch", startedAt: t0 + 3800, typed: false, asrConfidence: 0.9, itemId: "item_x", now: t0 + 5200 });
  await flush(); await flush();
  assert.equal(a.calls.turn.length, 1);
  const req = a.calls.turn[0];
  assert.equal(req.childText, "paanch");
  assert.ok(req.voiceFeatures, "features ride on the turn");
  assert.equal(req.voiceFeatures.bargeIn, false);
  assert.ok(Math.abs(req.voiceFeatures.features.onsetMs - 800) <= 40, `onset ${req.voiceFeatures.features.onsetMs}`);
  assert.ok(!JSON.stringify(req.voiceFeatures).includes("paanch"), "numbers only");
  // A typed turn has no voice features.
  rt.say("6");
  await flush(); await flush();
  assert.equal(a.calls.turn.length, 2);
  assert.equal(a.calls.turn[1].voiceFeatures, undefined);
  await rt.end();
});

test("ui.readAloud from the Director sets the read-aloud target; the next answer clears it", async () => {
  const { rt, vf } = await lesson({ readAloud: "Raju ke paas teen aam hain" });
  assert.equal(vf.target, "Raju ke paas teen aam hain");
  rt.say("ok");
  await flush(); await flush();
  assert.equal(vf.target, null);
  await rt.end();
});

test("no micTap (text link) or voiceFeatures:false → no features, lesson unaffected", async () => {
  const a = api();
  let made = 0;
  const rt = new LessonRuntime({ api: a, timers, createLink: (_m, ctx) => { const l = new TapLink(ctx.levels); l.micTap = undefined; return l; }, voiceFeatures: () => { made++; return new TrackerFeatures(); } });
  await rt.start("child-1", "voice");
  await flush();
  assert.equal(made, 0);
  await rt.end();
  const rt2 = new LessonRuntime({ api: api(), timers, createLink: (_m, ctx) => new TapLink(ctx.levels), voiceFeatures: false });
  await rt2.start("child-1", "voice");
  await rt2.end();
});

test("a factory that fails never breaks the lesson", async () => {
  const a = api();
  let link;
  const rt = new LessonRuntime({ api: a, timers, createLink: (_m, ctx) => (link = new TapLink(ctx.levels)), voiceFeatures: async () => { throw new Error("no AudioWorklet"); } });
  const warn = console.warn;
  console.warn = () => {};
  try {
    await rt.start("child-1", "voice");
    await flush();
    link.emit({ type: "child_final", text: "paanch", startedAt: Date.now(), typed: false, asrConfidence: 0.9 });
    await flush(); await flush();
  } finally {
    console.warn = warn;
  }
  assert.equal(a.calls.turn.length, 1);
  assert.equal(a.calls.turn[0].voiceFeatures, undefined);
  await rt.end();
});
