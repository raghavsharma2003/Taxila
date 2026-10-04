// W2-D (BUILD-PLAN §4): voice lanes and presence, everything that runs without a DOM or a model.
//   #1 the realtime seam (truncation, the mint fallback), the mid-sitting realtime → cascade switch, rate_limits logging,
//      the app-voice stall notice at 4.5 s;
//   #2 the pace knob → server VAD silence (600-1200 ms), the nudge timer's store field;
//   #3 lane A's delivery note (HV-13: never a sound word, nothing on safety turns, appended LAST, flagged off);
//   #4 the face producer (RELATIONAL-OS R4 face half): display → face, ReactionGate, AT-U12 (verdict-blind), gaze cues,
//      queued affect, voice events;
//   #5 the lip closure expander.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { realtimeSeam, endpointSilenceOf as serverSilence, isQuotaError, realtimeDeployment, RETENTION_RATIO, routes as laneRoutes } from "../server/voice/realtimeSession.js";
import { realtimeDeliveryLine, lintDeliveryLine, SOUND_WORDS, DELIVERY_LABEL } from "../server/voice/expressive/compile/realtime.js";
import { voiceLiveDelivery } from "../server/voice/expressive/compile/voicelive.js";
import { RealtimeProtocol, RATE_LIMITED, isRateLimit, endpointSilenceOf as clientSilence, withEndpointSilence, ENDPOINT_MIN_MS, ENDPOINT_MAX_MS } from "../src/lesson/realtime.ts";
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { ApiError } from "../src/lesson/api.ts";
import { classifyTrouble, T2_LINK_MS } from "../src/lesson/trouble.ts";
import { FaceProducer, faceAffectOf, faceUiOf, faceCues, gazeAngles, ReactionGate } from "../src/avatar/faceCues.ts";
import { Behaviour } from "../src/avatar/behaviour.ts";
import { LipDriver } from "../src/avatar/lip.ts";

const flush = () => new Promise((r) => setImmediate(r));

// ───────────── #1 / #2 the realtime seam ─────────────

const liveSession = () => ({
  type: "realtime", model: "taxila-realtime", instructions: "I", output_modalities: ["audio"],
  include: ["item.input_audio_transcription.logprobs"],
  audio: { input: { transcription: { model: "t" }, turn_detection: { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: 900, create_response: true, interrupt_response: true } }, output: { voice: "marin" } },
});

test("shapeSession: the live call gains truncation and keeps logprobs, instructions and voice; STT is untouched", () => {
  const base = liveSession();
  const out = realtimeSeam.shapeSession(base, { kind: "lesson", lessonId: "L" });
  assert.deepEqual(out.truncation, { type: "retention_ratio", retention_ratio: RETENTION_RATIO });
  assert.deepEqual(out.include, base.include);
  assert.equal(out.instructions, "I");
  assert.equal(out.audio.output.voice, "marin", "the voice stays the teacher config's");
  assert.equal(out.audio.input.turn_detection.silence_duration_ms, 900, "no pace knob: as minted");
  assert.equal(base.truncation, undefined, "the caller's object is not mutated");
  const stt = { type: "transcription", audio: { input: { turn_detection: { type: "server_vad", silence_duration_ms: 500 } } } };
  assert.equal(realtimeSeam.shapeSession(stt, { kind: "stt" }), stt);
  // never adds anything about the child
  assert.ok(!/child|name/i.test(JSON.stringify(out.truncation)));
});

test("pace: endpointSilenceMs → server VAD silence, clamped to 600-1200 ms, same rule on server and client", () => {
  for (const [ms, want] of [[300, 600], [600, 600], [850, 850], [1200, 1200], [4000, 1200], [undefined, null], [0, null], ["x", null]]) {
    assert.equal(serverSilence({ endpointSilenceMs: ms }), want, `server ${ms}`);
    assert.equal(clientSilence({ endpointSilenceMs: ms }), want, `client ${ms}`);
  }
  assert.equal(ENDPOINT_MIN_MS, 600);
  assert.equal(ENDPOINT_MAX_MS, 1200);
  const out = realtimeSeam.shapeSession(liveSession(), { kind: "lesson", pace: { waitNudgeSec: 9, endpointSilenceMs: 1500 } });
  assert.equal(out.audio.input.turn_detection.silence_duration_ms, 1200);
  assert.equal(out.audio.input.transcription.model, "t", "the rest of audio.input is kept");
  assert.deepEqual(withEndpointSilence({ type: "semantic_vad" }, 700), { type: "semantic_vad" }, "only server VAD takes a silence");
});

test("the premium-lane model is config: TAXILA_REALTIME_TIER=mini mints on DEPLOY_REALTIME_MINI", () => {
  assert.equal(realtimeDeployment({}), null);
  assert.equal(realtimeDeployment({ TAXILA_REALTIME_TIER: "mini" }), null, "no mini deployment configured: unchanged");
  assert.equal(realtimeDeployment({ TAXILA_REALTIME_TIER: "mini", DEPLOY_REALTIME_MINI: "taxila-realtime-mini" }), "taxila-realtime-mini");
});

test("onMintError: only a quota refusal moves the lesson to cascade; a bug rethrows", () => {
  const q = (status, message, code = "") => Object.assign(new Error(message), { status, code });
  assert.deepEqual(realtimeSeam.onMintError(q(429, "realtime_secret HTTP 429: too many requests"), { kind: "lesson" }), { fallback: "cascade" });
  assert.deepEqual(realtimeSeam.onMintError(q(400, 'HTTP 400: {"error":{"code":"rate_limit_exceeded"}}'), { kind: "lesson" }), { fallback: "cascade" });
  assert.equal(realtimeSeam.onMintError(q(400, "HTTP 400: unknown parameter truncation"), { kind: "lesson" }), null);
  assert.equal(realtimeSeam.onMintError(q(401, "HTTP 401"), { kind: "lesson" }), null);
  assert.equal(realtimeSeam.onMintError(q(429, "HTTP 429"), { kind: "stt" }), null, "the STT token keeps its own 502");
  assert.ok(isQuotaError({ code: "inference_rate_limit_exceeded" }));
  assert.ok(!isQuotaError(null));
});

test("POST /api/lesson/lane is registered (one route, owned by the realtime seam module)", () => {
  assert.deepEqual(Object.keys(laneRoutes), ["POST /api/lesson/lane"]);
  assert.ok(readFileSync(new URL("../server/index.js", import.meta.url), "utf8").includes("...lane }"));
});

// ───────────── #1 the client: rate limits, logging ─────────────

function protocol() {
  const sent = [], events = [];
  const p = new RealtimeProtocol({ send: (e) => sent.push(e), emit: (e) => events.push(e), now: () => 1000 });
  return { p, sent, events };
}

test("a rate-limited response (response.done failed, or an error event) is reported as rate_limited", () => {
  const { p, events } = protocol();
  p.handle({ type: "response.created", response: { id: "r1" } });
  p.handle({ type: "response.done", response: { id: "r1", status: "failed", status_details: { type: "failed", error: { type: "invalid_request_error", code: "inference_rate_limit_exceeded", message: "too many tokens" } } } });
  const err = events.find((e) => e.type === "error");
  assert.equal(err.code, RATE_LIMITED);
  assert.equal(err.fatal, false);
  p.handle({ type: "error", error: { type: "invalid_request_error", code: "rate_limit_exceeded", message: "Rate limit reached" } });
  assert.equal(events.filter((e) => e.code === RATE_LIMITED).length, 2);
  assert.equal(p.rateLimited, 2);
  // any other failure is today's plain non-fatal error
  p.handle({ type: "error", error: { code: "server_error", message: "boom" } });
  assert.equal(events.at(-1).code, "server_error");
  assert.ok(isRateLimit({ code: "inference_rate_limit_exceeded" }) && !isRateLimit({ code: "server_error" }));
});

test("rate_limits.updated is kept (and logged when nearly spent), never dropped", () => {
  const { p } = protocol();
  const info = console.info;
  const logged = [];
  console.info = (m) => logged.push(m);
  try {
    p.handle({ type: "rate_limits.updated", rate_limits: [{ name: "requests", limit: 200, remaining: 199, reset_seconds: 0.3 }, { name: "tokens", limit: 100000, remaining: 4000, reset_seconds: 2.4 }] });
  } finally { console.info = info; }
  assert.deepEqual(p.rateLimits, [{ name: "requests", limit: 200, remaining: 199, resetSeconds: 0.3 }, { name: "tokens", limit: 100000, remaining: 4000, resetSeconds: 2.4 }]);
  assert.equal(logged.length, 1);
  assert.match(logged[0], /tokens 4000\/100000/);
});

test("the app-voice stall notice: T2 shows 4.5 s after the link reports itself down", () => {
  const base = { now: 0, offline: false, linkDownSince: 0, waitingSince: null, sendFailed: false, authExpired: false, startFailed: false, ttsFailed: false, sttDown: false, likelyMuted: false, dismissed: new Set(), recoveredAt: null, pttFallback: false };
  assert.equal(T2_LINK_MS, 4_500);
  assert.equal(classifyTrouble({ ...base, now: 4_499 }), null);
  assert.equal(classifyTrouble({ ...base, now: 4_500 }), "T2");
});

// ───────────── #1 the mid-sitting switch, in the runtime ─────────────

class FakeLink {
  constructor(mode, ctx) { Object.assign(this, { mode, ctx, levels: ctx.levels, listeners: new Set(), instructions: [], prompts: [], closed: false, pace: [], delivery: [] }); }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(e) { for (const fn of [...this.listeners]) fn(e); }
  async connect() { if (this.fail) throw this.fail; this.emit({ type: "connection", state: "connected" }); }
  applyInstructions(s) { this.instructions.push(s); }
  sendChild(text) { this.emit({ type: "child_final", text, startedAt: Date.now(), typed: true }); }
  promptTeacher(reply) { this.prompts.push(reply?.text ?? null); }
  interrupt() {}
  setPushToTalk() {}
  talkStart() {}
  talkEnd() {}
  close() { this.closed = true; }
  setPace(p) { this.pace.push(p); }
  setDelivery(line, apply) { this.delivery.push([line, apply]); }
}

function fakeApi({ turn, mintRefused = false } = {}) {
  const calls = { start: [], turn: [], end: [], lane: [] };
  return {
    calls,
    start: async (req) => {
      calls.start.push(req);
      const cascade = req.mode === "cascade";
      return { lessonId: `L${calls.start.length}`, topic: { id: "t", title: "Fractions", chapter: "6" }, ...(cascade ? { teacherOpening: "Namaste!", teacherOpeningSeq: 1 } : { instructions: "INSTR-0" }),
        teacher: { id: "asha", name: "Asha", voice: "marin" }, moduleCommands: [], ui: {} };
    },
    turn: async (req) => { calls.turn.push(req); return turn ? turn(req, calls.turn.length) : { instructions: `INSTR-${calls.turn.length}`, move: { kind: "probe", shape: "ask" }, moduleCommands: [], ui: {}, teacherReply: `reply ${calls.turn.length}`, teacherReplySeq: 10 + calls.turn.length }; },
    end: async (id) => { calls.end.push(id); return {}; },
    realtimeToken: async () => { if (mintRefused) throw new ApiError(503, "realtime lane unavailable", { error: "realtime lane unavailable", fallback: "cascade" }); return {}; },
    switchLane: async (lessonId, reason) => { calls.lane.push([lessonId, reason]); return { mode: "cascade", switched: true }; },
  };
}

function timers() {
  return { setTimeout: () => 0, clearTimeout: () => {} };
}

test("a rate-limited realtime response moves the lesson to cascade mid-sitting and she speaks again", async () => {
  const api = fakeApi();
  const links = [];
  const rt = new LessonRuntime({ api, timers: timers(), voiceFeatures: false, outboxStore: () => Promise.reject(new Error("no idb")),
    createLink: (m, ctx) => { const l = new FakeLink(m, ctx); if (m === "voice") l.fail = null; links.push(l); return l; } });
  await rt.start("child-1", "voice");
  const voice = links[0];
  assert.equal(voice.mode, "voice");
  voice.emit({ type: "error", message: "the realtime lane is full", code: RATE_LIMITED, fatal: false });
  for (let i = 0; i < 10; i++) await flush();
  assert.deepEqual(api.calls.lane, [["L1", "rate_limit"]], "the server is told once");
  assert.ok(voice.closed, "the realtime call is closed");
  const cascade = links[1];
  assert.equal(cascade.mode, "text");
  assert.equal(cascade.ctx.cascade, true, "the new link is the cascade lane, through the same factory");
  assert.equal(rt.state.mode, "text");
  assert.equal(rt.state.phase, "live", "the lesson carries on");
  assert.equal(rt.state.laneSwitch?.reason, "rate_limit");
  // she speaks again: a "the line dropped" repair turn (empty, ASR confidence 0: no evidence either way)
  assert.equal(api.calls.turn.length, 1);
  assert.equal(api.calls.turn[0].childText, "");
  assert.equal(api.calls.turn[0].asrConfidence, 0);
  assert.deepEqual(cascade.prompts, ["reply 1"]);
  // a second refusal does nothing more
  voice.emit({ type: "error", code: RATE_LIMITED, message: "x", fatal: false });
  cascade.emit({ type: "error", code: RATE_LIMITED, message: "x", fatal: false });
  await flush();
  assert.equal(api.calls.lane.length, 1);
  rt.dispose();
});

test("a safeguarding hand-off the realtime lane never voiced opens the Help sheet when the lane switches", async () => {
  const api = fakeApi({ turn: () => ({ instructions: "SAFE", move: { kind: "safeguard", shape: "x" }, speakNow: "interrupt", moduleCommands: [], ui: {} }) });
  const links = [];
  const rt = new LessonRuntime({ api, timers: timers(), voiceFeatures: false, outboxStore: () => Promise.reject(new Error("no idb")), createLink: (m, ctx) => { const l = new FakeLink(m, ctx); links.push(l); return l; } });
  await rt.start("child-1", "voice");
  links[0].emit({ type: "child_final", text: "something worrying", startedAt: Date.now(), typed: false });
  for (let i = 0; i < 10; i++) await flush();
  assert.equal(rt.state.lateSafeguard, null);
  links[0].emit({ type: "error", code: RATE_LIMITED, message: "full", fatal: false });
  for (let i = 0; i < 10; i++) await flush();
  assert.ok(rt.state.lateSafeguard, "the helplines are on screen whatever the switch does");
  rt.dispose();
});

test("a realtime start refused for quota (503 fallback) runs the same lesson on the cascade lane", async () => {
  const api = fakeApi({ mintRefused: true });
  const links = [];
  const rt = new LessonRuntime({ api, timers: timers(), voiceFeatures: false, outboxStore: () => Promise.reject(new Error("no idb")),
    createLink: (m, ctx) => { const l = new FakeLink(m, ctx); if (m === "voice") l.fail = new ApiError(503, "realtime lane unavailable", { fallback: "cascade" }); links.push(l); return l; } });
  await rt.start("child-1", "voice", "t");
  assert.deepEqual(api.calls.start.map((r) => r.mode), ["voice", "cascade"]);
  assert.equal(api.calls.start[1].topicId, "t");
  assert.deepEqual(api.calls.end, ["L1"], "the empty realtime lesson is closed");
  assert.equal(rt.state.phase, "live");
  assert.equal(rt.state.laneSwitch?.reason, "mint_refused");
  assert.deepEqual(links[1].prompts, ["Namaste!"], "the cascade lane greets the child itself");
  rt.dispose();
});

test("a non-quota start failure is still today's error", async () => {
  const api = fakeApi();
  const rt = new LessonRuntime({ api, timers: timers(), voiceFeatures: false, outboxStore: () => Promise.reject(new Error("no idb")),
    createLink: (m, ctx) => { const l = new FakeLink(m, ctx); l.fail = new ApiError(502, "bad gateway", null); return l; } });
  await assert.rejects(rt.start("child-1", "voice"));
  assert.equal(rt.state.phase, "error");
  assert.equal(api.calls.start.length, 1);
});

test("TurnResponse.pace reaches the store (nudge timer) and the link (server VAD)", async () => {
  const api = fakeApi({ turn: () => ({ instructions: "I2", move: { kind: "probe", shape: "x" }, moduleCommands: [], ui: {}, pace: { waitNudgeSec: 12, endpointSilenceMs: 1100 } }) });
  const links = [];
  const rt = new LessonRuntime({ api, timers: timers(), voiceFeatures: false, outboxStore: () => Promise.reject(new Error("no idb")), createLink: (m, ctx) => { const l = new FakeLink(m, ctx); links.push(l); return l; } });
  await rt.start("child-1", "voice");
  links[0].emit({ type: "child_final", text: "teen", startedAt: Date.now(), typed: false });
  for (let i = 0; i < 10; i++) await flush();
  assert.deepEqual(rt.state.pace, { waitNudgeSec: 12, endpointSilenceMs: 1100 });
  assert.deepEqual(links[0].pace, [{ waitNudgeSec: 12, endpointSilenceMs: 1100 }]);
  assert.equal(links[0].delivery.length, 0, "lane A's delivery note is flagged off by default");
  rt.dispose();
});

// ───────────── #3 lane A delivery ─────────────

const DISPLAYS = ["delight", "warm_pride", "enthusiasm", "gentle_concern", "playful", "calm_curious", "sheepish_own", "neutral_warm", "calm_steady"];
const MOVES = ["greet", "retrieval", "hook", "explain", "worked_example", "probe", "hint", "reteach", "show_module", "practice", "teachback", "celebrate", "break", "wrap", "repair", "safeguard"];
const moment = (o = {}) => ({ move: "explain", verdict: "ungraded", engagement: "engaged", teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 1 },
  bondStage: "regular", safety: false, childLaughed: false, thinkAloud: false, band: "B3", lang: "hinglish", ...o });

test("HV-13: no delivery note ever carries a sound word, a bracket or a second line", () => {
  let lines = 0;
  for (const display of DISPLAYS) for (const move of MOVES) for (const verdict of ["correct", "not_yet", "partial", "ungraded"]) for (const band of ["B1", "B2", "B3", "B4"]) {
    const line = realtimeDeliveryLine(moment({ move, verdict, band, teacherAffect: { display, intensity: 1, cause: "none", turn: 1 } }));
    if (line === null) continue;
    lines++;
    assert.ok(line.startsWith(DELIVERY_LABEL));
    assert.ok(!SOUND_WORDS.test(line.slice(DELIVERY_LABEL.length)), line);
    assert.ok(!line.includes("\n") && line.length <= 240, line);
  }
  assert.ok(lines > 100);
  assert.ok(!lintDeliveryLine(`${DELIVERY_LABEL} warm · a soft laugh first`));
  assert.ok(!lintDeliveryLine(`${DELIVERY_LABEL} [laughter] warm`));
});

test("lane A: no note on safety turns or without a moment; the verdict picks only the correction licence", () => {
  assert.equal(realtimeDeliveryLine(null), null);
  assert.equal(realtimeDeliveryLine(moment({ safety: true, move: "explain" })), null);
  assert.equal(realtimeDeliveryLine(moment({ move: "safeguard" })), null);
  assert.match(realtimeDeliveryLine(moment({ move: "probe", verdict: "not_yet" })), /calm → reassuring/);
  assert.match(realtimeDeliveryLine(moment({ move: "probe", verdict: "correct" })), /curious/);
  // affect comes only from teacherAffect, and a delight display shapes the note whatever the verdict
  const a = realtimeDeliveryLine(moment({ verdict: "correct", teacherAffect: { display: "delight", intensity: 2, cause: "insight", turn: 2 } }));
  assert.match(a, /bright on the method/);
  assert.match(realtimeDeliveryLine(moment({ band: "B4" })), /understated/);
});

test("lane B (Voice Live) gets the lane-A treatment until P-VL says markers are rendered silently", () => {
  const m = moment({ teacherAffect: { display: "gentle_concern", intensity: 1, cause: "tired", turn: 1 } });
  assert.equal(voiceLiveDelivery(m), realtimeDeliveryLine(m));
  assert.equal(voiceLiveDelivery(moment({ safety: true })), null);
});

// ───────────── #4 the face ─────────────

test("RELATIONAL-OS §7.2 display → face, stepped down by band", () => {
  assert.deepEqual(faceAffectOf("delight", "b1"), { emotion: "excited", intensity: 2 });
  assert.deepEqual(faceAffectOf("delight", "b3"), { emotion: "excited", intensity: 1 });
  assert.deepEqual(faceAffectOf("warm_pride", "b2"), { emotion: "proud", intensity: 1 });
  assert.deepEqual(faceAffectOf("enthusiasm", "b3"), { emotion: "curious", intensity: 2 });
  assert.deepEqual(faceAffectOf("enthusiasm", "b4"), { emotion: "curious", intensity: 1 });
  assert.deepEqual(faceAffectOf("gentle_concern", "b4"), { emotion: "concerned", intensity: 1 });
  assert.deepEqual(faceAffectOf("calm_steady", "b2"), { emotion: "concerned", intensity: 1 }, "TA8: the safety face");
  assert.equal(faceAffectOf("neutral_warm", "b2"), null, "the default display is the warm rest pose, not an expression");
  assert.equal(faceAffectOf(undefined), null);
});

test("AT-U12 / G-MOMENT: the face program after a correct and after a wrong commit, same turn context, is identical", () => {
  const shared = { teacherAffect: { display: "calm_curious", intensity: 1 }, cues: { program: "point", target: "board" } };
  const right = { ...shared, verdict: "correct", pendingVerdict: "correct", chips: [{ id: "a", label: "3" }], withHelp: false, affect: "insight" };
  const wrong = { ...shared, verdict: "incorrect", pendingVerdict: "not_yet", chips: [{ id: "b", label: "4" }], withHelp: true };
  const a = new FaceProducer().program(faceUiOf(right), 3);
  const b = new FaceProducer().program(faceUiOf(wrong), 3);
  assert.deepEqual(a, b);
  assert.deepEqual(Object.keys(faceUiOf(right)).sort(), ["cues", "studioSlot", "teacherAffect", "whiteboard"]);
});

test("ReactionGate: delight and warm_pride share one big expression per 5 child turns; others are not gated", () => {
  const p = new FaceProducer();
  const at = (display, turn) => p.program({ teacherAffect: { display, intensity: 2 } }, turn).filter((c) => c.kind === "affect").length;
  assert.equal(at("delight", 1), 1);
  assert.equal(at("warm_pride", 3), 0, "shared cap");
  assert.equal(at("gentle_concern", 4), 1, "concern is never capped");
  assert.equal(at("delight", 6), 1);
  assert.equal(at("neutral_warm", 20), 0);
  const g = new ReactionGate();
  assert.deepEqual([1, 2, 6, 10, 11].map((t) => g.allow(t)), [true, false, true, false, true]);
});

test("gaze: a Studio reveal looks at the tray once per slot; a cue at its target; a new board line at the board", () => {
  const p = new FaceProducer();
  const gaze = (ui) => p.program(ui, 1).filter((c) => c.kind === "gaze").map((c) => `${c.target}:${c.reason}`);
  const slot = { slotId: "s1", kind: "frame" };
  assert.deepEqual(gaze({ studioSlot: slot }), ["tray:studio_reveal"]);
  assert.deepEqual(gaze({ studioSlot: slot }), [], "the same slot does not re-draw her eyes");
  assert.deepEqual(gaze({ cues: { program: "demo", target: "board" } }), ["board:cue"]);
  assert.deepEqual(gaze({ whiteboard: { kind: "text", value: "1/2" } }), ["board:board"]);
  assert.deepEqual(gaze({ whiteboard: { kind: "text", value: "1/2" } }), []);
  assert.deepEqual(gaze({}), []);
});

test("gazeAngles: a tray to the child's right is her left (+yaw); below is down (-pitch); clamped", () => {
  const face = { x: 0, y: 0, w: 200, h: 200 };
  const [yaw, pitch] = gazeAngles(face, { x: 400, y: 50, w: 200, h: 100 });
  assert.ok(yaw > 15 && yaw <= 25, `yaw ${yaw}`);
  const [, down] = gazeAngles(face, { x: 0, y: 500, w: 200, h: 200 });
  assert.ok(down < -15 && down >= -25, `pitch ${down}`);
});

test("the cue bus reaches every listener, and one failing listener does not stop the rest", () => {
  const got = [];
  const off1 = faceCues.on(() => { throw new Error("x"); });
  const off2 = faceCues.on((c) => got.push(c.kind));
  const warn = console.warn;
  console.warn = () => {};
  try { faceCues.emit({ kind: "affect", display: "delight", seq: 1 }); } finally { console.warn = warn; off1(); off2(); }
  assert.deepEqual(got, ["affect"]);
});

test("the runtime produces the face program from each turn's ui (teacherAffect → affect cue)", async () => {
  const api = fakeApi({ turn: () => ({ move: { kind: "probe", shape: "x" }, moduleCommands: [], ui: { teacherAffect: { display: "warm_pride", intensity: 1 } }, teacherReply: "r", teacherReplySeq: 3 }) });
  const cues = [];
  const off = faceCues.on((c) => cues.push(c));
  const links = [];
  const rt = new LessonRuntime({ api, timers: timers(), voiceFeatures: false, outboxStore: () => Promise.reject(new Error("no idb")), createLink: (m, ctx) => { const l = new FakeLink(m, ctx); links.push(l); return l; } });
  try {
    await rt.start("child-1", "cascade");
    links[0].sendChild("teen");
    for (let i = 0; i < 10; i++) await flush();
    assert.deepEqual(cues.filter((c) => c.kind === "affect").map((c) => c.display), ["warm_pride"]);
  } finally { off(); rt.dispose(); }
});

test("behaviour: a look at the work returns to the child; never while the child talks; voice events move the body", () => {
  const b = new Behaviour({ seed: 3 });
  b.update(0);
  b.setState("speaking");
  b.lookAt(20, -10, 1.0, "tray");
  let f = b.update(0.2);
  assert.equal(f.gazeMode, "avert");
  assert.ok(f.gaze[0] > 10 && f.gaze[1] < 0, `gaze ${f.gaze}`);
  f = b.update(1.3);
  assert.ok(b.log.some((e) => e.type === "gaze" && e.detail === "look:tray"));
  assert.ok(b.log.some((e) => e.type === "gaze" && e.detail === "return"), "back to the child after the hold");
  const l = new Behaviour({ seed: 3 });
  l.update(0);
  l.setState("listening");
  l.lookAt(20, -10, 1, "tray");
  assert.ok(!l.log.some((e) => e.detail === "look:tray"), "she keeps her eyes on a talking child");
  b.voiceEvent("laugh");
  assert.ok(b.log.some((e) => e.type === "emote" && e.detail === "warm"));
});

// ───────────── #5 lip closures ─────────────

test("closure expander: a 70 ms dip inside a vowel closes the mouth; the same vowel without the dip stays open", () => {
  const SR = 48000;
  const run = (dip) => {
    const d = new LipDriver(SR), jaws = [];
    for (let i = 0; i < 90; i++) { // 1.5 s at 60 fps
      const t = i / 60;
      const inDip = dip && t >= 0.8 && t < 0.87;
      const amp = inDip ? 0.01 : 0.12;
      const buf = new Float32Array(2048);
      for (let k = 0; k < buf.length; k++) buf[k] = amp * Math.sin((2 * Math.PI * (inDip ? 120 : 220) * k) / SR);
      jaws.push(d.step(buf, t).jaw);
    }
    return jaws;
  };
  const withDip = run(true), plain = run(false);
  assert.ok(Math.min(...withDip.slice(48, 54)) < 0.2 * 0.85, `closed in the dip: ${Math.min(...withDip.slice(48, 54)).toFixed(3)}`);
  assert.ok(Math.min(...plain.slice(30, 90)) > 0.5, "an even vowel stays open");
  const off = new LipDriver(SR, { expandRatio: 0 });
  assert.ok(off.step(new Float32Array(2048).fill(0.1), 0).jaw >= 0, "the expander can be turned off");
});
