// Patch request 10 (stream 3's files: src/lesson/realtime.ts, src/lesson/runtime.ts, src/lesson/link.ts, src/lesson/api.ts,
// shared/contracts.ts, server/voice/realtimeSession.js, server/brain/turn.js; main safety review): a realtime reply blocked
// by the content filter gets ONE fresh reply; a second block fails closed (helplines on screen, the lesson moves to the
// cascade lane, the resume turn carries replyFiltered: 2 and the server re-plans it as the safeguard). Kept out of tests/
// until applied:   node --test docs/design/round4/build/conversation/patches/10-realtime-filter.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { RealtimeProtocol, RATE_LIMITED } from "../src/lesson/realtime.ts";
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { withReplyFiltered, incidentOf } from "../server/brain/turn.js";
import { startModeOf } from "../server/routes/lesson.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "../tests/fixtures/kit.mjs";

// ───────────── the protocol ─────────────
function proto() {
  const sent = [], events = [];
  let t = 0;
  const p = new RealtimeProtocol({ send: (e) => sent.push(e), emit: (e) => events.push(e), now: () => (t += 10), setTimer: () => 0, clearTimer: () => {} });
  return { p, sent, events, creates: () => sent.filter((e) => e.type === "response.create").length };
}
const created = (p, id) => p.handle({ type: "response.created", response: { id } });
const done = (p, id, status, details = {}) => p.handle({ type: "response.done", response: { id, status, status_details: details, output: [] } });
const FILTERED = { type: "incomplete", reason: "content_filter" };

test("a filtered reply gets exactly ONE fresh response.create (the session's same instructions)", () => {
  const { p, events, creates } = proto();
  created(p, "r1"); done(p, "r1", "incomplete", FILTERED);
  assert.equal(creates(), 1, "one fresh reply asked for");
  assert.deepEqual(events.filter((e) => e.type === "reply_filtered").map((e) => e.count), [1]);
  created(p, "r2"); done(p, "r2", "completed");
  assert.equal(creates(), 1, "a clean retry asks for nothing more");
});

test("the retry blocked too: count 2, and no third response.create (never a loop)", () => {
  const { p, events, creates } = proto();
  created(p, "r1"); done(p, "r1", "incomplete", FILTERED);
  created(p, "r2"); done(p, "r2", "incomplete", FILTERED);
  assert.equal(creates(), 1);
  assert.deepEqual(events.filter((e) => e.type === "reply_filtered").map((e) => e.count), [1, 2]);
  // a later, unrelated filtered reply starts its own chain of at most one retry (per response, not per lesson)
  created(p, "r3"); done(p, "r3", "incomplete", FILTERED);
  assert.equal(creates(), 2);
});

test("other incomplete reasons and a rate-limited 'failed' response are unchanged (no retry, no reply_filtered)", () => {
  const { p, events, creates } = proto();
  created(p, "r1"); done(p, "r1", "incomplete", { type: "incomplete", reason: "max_output_tokens" });
  created(p, "r2"); done(p, "r2", "failed", { type: "failed", error: { code: "inference_rate_limit_exceeded", message: "rate limit" } });
  assert.equal(creates(), 0);
  assert.equal(events.filter((e) => e.type === "reply_filtered").length, 0);
  assert.equal(events.filter((e) => e.type === "error" && e.code === RATE_LIMITED).length, 1);
});

// ───────────── the runtime ─────────────
class FakeLink {
  constructor(mode, ctx) { Object.assign(this, { mode, ctx, levels: ctx.levels, listeners: new Set(), instructions: [], prompts: [], closed: false }); }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(e) { for (const fn of [...this.listeners]) fn(e); }
  async connect() { this.emit({ type: "connection", state: "connected" }); }
  applyInstructions(s) { this.instructions.push(s); }
  promptTeacher(reply) { this.prompts.push(reply?.text ?? null); }
  interrupt() {} setPushToTalk() {} talkStart() {} talkEnd() {} setPace() {} setDelivery() {}
  close() { this.closed = true; }
}
function fakeApi({ refuse = false, safeguardFirst = false } = {}) {
  const calls = { start: [], turn: [], lane: [] };
  return { calls,
    start: async (req) => { calls.start.push(req); return { lessonId: "L1", topic: { id: "t", title: "Fractions", chapter: "6" }, ...(req.mode === "cascade" ? { teacherOpening: "Namaste!", teacherOpeningSeq: 1 } : { instructions: "INSTR-0" }), teacher: { id: "asha", name: "Asha", voice: "marin" }, moduleCommands: [], ui: {} }; },
    turn: async (req) => { calls.turn.push(req); const sg = req.replyFiltered || (safeguardFirst && calls.turn.length === 1);
      return { move: { kind: sg ? "safeguard" : "probe", shape: "x" }, ...(sg && safeguardFirst ? { speakNow: "interrupt" } : {}), moduleCommands: [], ui: {}, teacherReply: "line", teacherReplySeq: 10 }; },
    end: async () => ({}), realtimeToken: async () => ({}),
    switchLane: async (lessonId, reason) => { calls.lane.push([lessonId, reason]); if (refuse) throw new Error("network blip"); return { mode: "cascade", switched: true }; } };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

test("a second block: the helplines are on screen now, the lesson moves to cascade, and the resume turn carries replyFiltered: 2", async () => {
  const api = fakeApi(), links = [];
  const rt = new LessonRuntime({ api, timers: { setTimeout: () => 0, clearTimeout: () => {} }, voiceFeatures: false, outboxStore: () => Promise.reject(new Error("no idb")),
    createLink: (m, ctx) => { const l = new FakeLink(m, ctx); links.push(l); return l; } });
  await rt.start("child-1", "voice");
  links[0].emit({ type: "reply_filtered", responseId: "r1", count: 1 });
  for (let i = 0; i < 5; i++) await flush();
  assert.equal(rt.state.lateSafeguard, null, "one block is only a retry");
  assert.deepEqual(api.calls.lane, []);
  links[0].emit({ type: "reply_filtered", responseId: "r2", count: 2 });
  for (let i = 0; i < 10; i++) await flush();
  assert.ok(rt.state.lateSafeguard, "the helplines are on screen");
  assert.deepEqual(api.calls.lane, [["L1", "content_filter"]]);
  const resume = api.calls.turn.find((t) => t.laneResume);
  assert.ok(resume, "a resume turn was sent");
  assert.equal(resume.replyFiltered, 2);
  assert.equal(api.calls.turn.filter((t) => t.replyFiltered === 2).length, 1, "exactly one turn carries it");
  assert.equal(rt.state.mode, "text", "the cascade lane speaks the server's line");
  rt.dispose();
});

const runtimeFor = (api, links) => new LessonRuntime({ api, timers: { setTimeout: () => 0, clearTimeout: () => {} }, voiceFeatures: false,
  outboxStore: () => Promise.reject(new Error("no idb")), createLink: (m, ctx) => { const l = new FakeLink(m, ctx); links.push(l); return l; } });

test("main review change 1: a REFUSED switch still reaches the server: one signal turn with replyFiltered 2 on the voice lane, no stale pending", async () => {
  const api = fakeApi({ refuse: true }), links = [];
  const rt = runtimeFor(api, links);
  await rt.start("child-1", "voice");
  links[0].emit({ type: "reply_filtered", responseId: "r1", count: 1 });
  links[0].emit({ type: "reply_filtered", responseId: "r2", count: 2 });
  for (let i = 0; i < 12; i++) await flush();
  assert.ok(rt.state.lateSafeguard, "the helplines are on screen");
  assert.deepEqual(api.calls.lane, [["L1", "content_filter"]], "the switch was asked for");
  assert.equal(rt.state.mode, "voice", "the refused switch left the lesson on the realtime link");
  const sig = api.calls.turn.filter((t) => t.replyFiltered === 2);
  assert.equal(sig.length, 1, "exactly one turn carries the hint");
  assert.equal(sig[0].laneResume, undefined, "on the current lane, not a resume turn");
  assert.equal(sig[0].childText, "");
  rt.dispose();
});

test("main review change 1: when the blocked reply was itself the safeguarding hand-off, no second safeguard POST (switch ok or refused)", async () => {
  for (const refuse of [false, true]) {
    const api = fakeApi({ refuse, safeguardFirst: true }), links = [];
    const rt = runtimeFor(api, links);
    await rt.start("child-1", "voice");
    links[0].emit({ type: "child_final", text: "something worrying", startedAt: Date.now(), typed: false });
    for (let i = 0; i < 10; i++) await flush();
    const before = api.calls.turn.length;
    links[0].emit({ type: "reply_filtered", responseId: "r2", count: 2 });
    for (let i = 0; i < 12; i++) await flush();
    assert.ok(rt.state.lateSafeguard, `helplines on screen (refuse ${refuse})`);
    assert.equal(api.calls.turn.filter((t) => t.replyFiltered).length, 0, `no replyFiltered POST (refuse ${refuse})`);
    assert.ok(api.calls.turn.length <= before + 1, `at most the plain resume turn (refuse ${refuse})`);
    rt.dispose();
  }
});

// ───────────── the server ─────────────
test("server: replyFiltered: 2 yields the safeguard move with the helplines; it only ever adds", () => {
  const K = kit();
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: 20_000 });
  // the resume turn has no classification: the hint gives it one carrying the flag
  const c = withReplyFiltered(null, { replyFiltered: 2 });
  assert.equal(c.flags.distress, true);
  assert.equal(c.flags.distressKind, "content_filter");
  const s = step(r.state, { event: "turn", kit: K, cls: c, now: 40_000 });
  assert.equal(s.move.kind, "safeguard");
  assert.match(JSON.stringify(s.ui), /1098/);
  assert.match(JSON.stringify(s.ui), /14416/);
  // never subtracts, never changes a clean turn, never a hint of 1
  const clean = cls("correct");
  assert.equal(withReplyFiltered(clean, {}), clean);
  assert.equal(withReplyFiltered(clean, { replyFiltered: 1 }), clean);
  const already = { ...clean, flags: { ...clean.flags, distress: true, distressKind: "self_harm" } };
  assert.equal(withReplyFiltered(already, { replyFiltered: 2 }), already, "an existing distress kind is kept");
  assert.equal(withReplyFiltered(clean, { replyFiltered: 2 }).outcome, "correct", "only the flag is added");
  // main review change 2: the incident and the trace name the content filter, never "classifier"
  assert.equal(c.source, "content_filter");
  assert.deepEqual(incidentOf(c), { source: "content_filter", family: "content_filter" });
  assert.equal(incidentOf(withReplyFiltered(clean, { replyFiltered: 2 })).source, "content_filter");
  assert.equal(incidentOf(already).source, "classifier", "an existing distress keeps its own source");
});

test("10b: a start with no mode (or an unknown one) runs on the cascade lane; only an explicit 'voice' mints realtime", () => {
  assert.equal(startModeOf(undefined), "cascade");
  assert.equal(startModeOf(""), "cascade");
  assert.equal(startModeOf("realtime"), "cascade");
  assert.equal(startModeOf("cascade"), "cascade");
  assert.equal(startModeOf("text"), "text");
  assert.equal(startModeOf("voice"), "voice");
});
