// Round 7, stream B Voice, item voice-handsfree-from-first-line (B2): no tap-then-flip at lesson start.
//   flags.duplexExpected: hands-free is known at the first frame (device key, settled server answer, unknown = on);
//   handsFree.handsFreeDock: the one dock state App renders (the B ↔ App contract);
//   runtime.start: the microphone is asked for BESIDE POST /api/lesson/start and handed to the link; released if unused;
//   runtime.setMuted / CascadeLink.setMuted: the child's mute holds push-to-talk underneath and survives setPushToTalk.
import { test } from "node:test";
import assert from "node:assert/strict";

import { duplexExpected, resetDuplexFlagCache, serverDuplex, DUPLEX_KEY } from "../src/duplex/flags.ts";
import { handsFreeDock } from "../src/lesson/handsFree.ts";
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { CascadeLink } from "../src/lesson/cascadeLink.ts";
import { LevelMeter } from "../src/lesson/level.ts";

function withStorage(fn) {
  const store = new Map();
  const had = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } });
  return Promise.resolve(fn(store)).finally(() => {
    resetDuplexFlagCache();
    if (had) Object.defineProperty(globalThis, "localStorage", had); else delete globalThis.localStorage;
  });
}

test("B2 duplexExpected: hands-free at the first frame unless the device or a settled server answer says otherwise", () => withStorage(async (store) => {
  resetDuplexFlagCache();
  assert.equal(duplexExpected(), true, "nothing known yet: hands-free (D2: unknown runs on)");
  const answer = (duplex) => async () => ({ ok: true, json: async () => ({ duplex }) });
  await serverDuplex(answer("shadow"));
  assert.equal(duplexExpected(), false, "the server said shadow: today's tap path");
  resetDuplexFlagCache();
  await serverDuplex(answer("off"));
  assert.equal(duplexExpected(), false);
  resetDuplexFlagCache();
  await serverDuplex(answer("on"));
  assert.equal(duplexExpected(), true);
  resetDuplexFlagCache();
  await serverDuplex(async () => { throw new Error("offline"); });
  assert.equal(duplexExpected(), true, "unreadable: hands-free");
  store.set(DUPLEX_KEY, "0");
  assert.equal(duplexExpected(), false, "a device forced off wins");
  store.set(DUPLEX_KEY, "1");
  await serverDuplex(answer("off"));
  assert.equal(duplexExpected(), true, "a device forced on wins");
}));

test("B2 handsFreeDock: one state per moment; hands-free from the first frame; fallback is today's dock", () => {
  const base = { expected: true, live: false, fallback: null, phase: null, muted: false };
  assert.equal(handsFreeDock(base), "starting");
  assert.equal(handsFreeDock({ ...base, expected: false }), "fallback");
  assert.equal(handsFreeDock({ ...base, fallback: "stt_unavailable" }), "fallback");
  assert.equal(handsFreeDock({ ...base, muted: true }), "muted");
  const live = { ...base, live: true };
  assert.equal(handsFreeDock({ ...live, phase: "her_turn" }), "speaking");
  assert.equal(handsFreeDock({ ...live, phase: "overlap" }), "speaking");
  assert.equal(handsFreeDock({ ...live, phase: "handover" }), "listening");
  assert.equal(handsFreeDock({ ...live, phase: "idle" }), "listening");
  assert.equal(handsFreeDock({ ...live, phase: "child_turn" }), "hearing");
  assert.equal(handsFreeDock({ ...live, phase: "committed" }), "thinking");
  assert.equal(handsFreeDock({ ...live, phase: "handover", turnInFlight: true }), "thinking");
  assert.equal(handsFreeDock({ ...live, phase: "hold_requested" }), "waiting");
  assert.equal(handsFreeDock({ ...live, phase: "her_turn", muted: true }), "muted");
  assert.equal(handsFreeDock({ ...live, phase: "her_turn", fallback: "echo" }), "fallback", "a fallback beats everything");
});

class FakeLink {
  constructor(ctx) { this.ctx = ctx; this.listeners = new Set(); this.ptt = []; this.closed = false; }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  async connect() { for (const fn of this.listeners) fn({ type: "connection", state: "connected" }); }
  applyInstructions() {}
  sendChild() {}
  promptTeacher() {}
  interrupt() {}
  setPushToTalk(on) { this.ptt.push(on); }
  talkStart() {}
  talkEnd() {}
  close() { this.closed = true; }
}
const timers = () => ({ setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {} });
function api({ start } = {}) {
  return {
    start: start ?? (async () => ({ lessonId: "L1", topic: { id: "t", title: "T", chapter: "1" }, instructions: "", teacher: { id: "asha", name: "Asha", voice: "v" }, moduleCommands: [], ui: {}, teacherOpening: "Namaste!", teacherOpeningSeq: 1 })),
    turn: async () => ({}), end: async () => ({ ok: true }), realtimeToken: async () => { throw new Error("unused"); },
  };
}
function fakeMic() {
  const log = [];
  const tracks = [{ stop: () => log.push("stop"), enabled: true }];
  const stream = { getTracks: () => tracks, getAudioTracks: () => tracks };
  const had = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const nav = { ...(globalThis.navigator ?? {}), mediaDevices: { getUserMedia: async (c) => { log.push(["ask", c]); return stream; } } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: nav });
  return { log, stream, restore: () => (had ? Object.defineProperty(globalThis, "navigator", had) : delete globalThis.navigator) };
}

test("B2 runtime: the microphone is asked for beside POST /api/lesson/start and handed to the cascade link", async () => {
  const m = fakeMic();
  try {
    let askedBeforeStartReturned = false;
    let link;
    const rt = new LessonRuntime({
      api: api({ start: async (req) => { askedBeforeStartReturned = m.log.some((x) => x[0] === "ask"); return api().start(req); } }),
      timers: timers(),
      createLink: (_m, ctx) => (link = new FakeLink(ctx)),
    });
    await rt.start("child-1", "cascade");
    assert.equal(askedBeforeStartReturned, true, "the ask went out before the lesson start answered");
    assert.ok(link.ctx.mic, "the link gets the early microphone");
    assert.equal(await link.ctx.mic, m.stream);
    assert.equal(m.log.filter((x) => x[0] === "ask").length, 1, "asked once");
    assert.deepEqual(m.log[0][1], { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }, "the link's own constraints");
    rt.end?.();
  } finally {
    m.restore();
  }
});

test("B2 runtime: a typed (text) lesson never asks; a failed start releases the early microphone", async () => {
  const m = fakeMic();
  try {
    const rt = new LessonRuntime({ api: api(), timers: timers(), createLink: (_m, ctx) => new FakeLink(ctx) });
    await rt.start("child-1", "text");
    assert.equal(m.log.length, 0, "text lane: no microphone ask");
    const bad = new LessonRuntime({ api: api({ start: async () => { throw new Error("boom"); } }), timers: timers(), createLink: (_m, ctx) => new FakeLink(ctx) });
    await assert.rejects(bad.start("child-1", "cascade"));
    await new Promise((r) => setTimeout(r, 0));
    assert.ok(m.log.includes("stop"), "the unused microphone is stopped");
  } finally {
    m.restore();
  }
});

test("B2 runtime.setMuted: uses the link's mute, else push-to-talk; state.muted follows", async () => {
  const rt = new LessonRuntime({ api: api(), timers: timers(), createLink: (_m, ctx) => { const l = new FakeLink(ctx); l.muted = []; l.setMuted = (on) => l.muted.push(on); return (rt.l = l); } });
  await rt.start("child-1", "text");
  rt.setMuted(true);
  rt.setMuted(true);
  assert.deepEqual(rt.l.muted, [true], "idempotent");
  assert.equal(rt.state.muted, true);
  rt.setMuted(false);
  assert.deepEqual(rt.l.muted, [true, false]);
  assert.equal(rt.state.muted, false);
  const plain = new LessonRuntime({ api: api(), timers: timers(), createLink: (_m, ctx) => (plain.l = new FakeLink(ctx)) });
  await plain.start("child-1", "text");
  plain.l.ptt.length = 0;
  plain.setMuted(true);
  assert.deepEqual(plain.l.ptt, [true], "no link mute: push-to-talk");
});

test("B2 CascadeLink.setMuted: push-to-talk underneath, no tap opens the mic, a setPushToTalk meanwhile lands on unmute", () => {
  const link = new CascadeLink({ lessonId: "L1", levels: { mic: new LevelMeter(), teacher: new LevelMeter() } });
  const tracks = [{ enabled: true, stop() {} }];
  link.mic = { getAudioTracks: () => tracks, getTracks: () => tracks };
  link.setPushToTalk(false);
  assert.equal(link.pushToTalk, false, "hands-free");
  link.setMuted(true);
  assert.equal(link.pushToTalk, true, "muted: push-to-talk underneath (the engine stands aside)");
  assert.equal(tracks[0].enabled, false, "no audio leaves the device");
  link.talkStart();
  assert.equal(link.talking, false, "a tap does not open a muted mic");
  link.setPushToTalk(false); // the Desk re-asserts hands-free while muted (useDesk effect): remembered, not applied
  assert.equal(link.pushToTalk, true);
  assert.equal(tracks[0].enabled, false);
  link.setMuted(false);
  assert.equal(link.pushToTalk, false, "unmute: hands-free again");
  assert.equal(tracks[0].enabled, true);
  link.setPushToTalk(true);
  link.setMuted(true);
  link.setMuted(false);
  assert.equal(link.pushToTalk, true, "unmute restores what was wanted (push-to-talk)");
  link.close();
});
