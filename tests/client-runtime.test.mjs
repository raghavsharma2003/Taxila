// Client live-lesson runtime: everything that runs without a DOM (Node strips the TS types on import).
// Covers the realtime protocol mapping + context pruning, push-to-talk commits, the four-state status rule,
// Director-turn attribution and ordering, module-event buffering and module-only turns, voicing what the
// Director says must be heard now (safeguarding, the goodbye), closing the lesson on every way out, the
// module command channel, the frame protocol, param resolution and the fraction-bars verdicts.
import { test } from "node:test";
import assert from "node:assert/strict";

import { ConversationLedger } from "../src/lesson/ledger.ts";
import { RealtimeProtocol, audioInputFrom, confidenceFromLogprobs, turnDetectionFrom, DEFAULT_TURN_DETECTION } from "../src/lesson/realtime.ts";
import { INITIAL_FLAGS, reduceStatus, statusOf } from "../src/lesson/status.ts";
import { ModuleEventBuffer, MAX_BUFFERED, MILESTONE_TYPES } from "../src/lesson/moduleEvents.ts";
import { ModuleChannel } from "../src/lesson/moduleChannel.ts";
import { TeacherTurns } from "../src/lesson/teacherTurns.ts";
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { ApiError } from "../src/lesson/api.ts";
import { LevelMeter, levelFromRms } from "../src/lesson/level.ts";
import { parseHostToModule, parseModuleToHost, toModuleEvent } from "../src/modules/frame/protocol.ts";
import { resolveParams } from "../src/modules/frame/params.ts";
import * as fb from "../src/modules/frame/engines/fractionBars.logic.ts";

// ───────────── helpers ─────────────

/** Manual clock for setTimeout-driven code. */
function fakeTimers() {
  let now = 0;
  let seq = 0;
  const pending = new Map();
  return {
    setTimeout: (fn, ms) => {
      const id = ++seq;
      pending.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimeout: (id) => pending.delete(id),
    advance(ms) {
      now += ms;
      for (const [id, t] of [...pending].sort((a, b) => a[1].at - b[1].at)) {
        if (t.at <= now && pending.has(id)) {
          pending.delete(id);
          t.fn();
        }
      }
    },
    get size() {
      return pending.size;
    },
  };
}

function protocol(opts = {}) {
  const sent = [];
  const events = [];
  let t = 1000;
  const p = new RealtimeProtocol({ send: (e) => sent.push(e), emit: (e) => events.push(e), now: () => (t += 10), ...opts });
  return { p, sent, events, types: () => events.map((e) => e.type) };
}

const flush = () => new Promise((r) => setImmediate(r));

class FakeLink {
  constructor(mode, levels) {
    this.mode = mode;
    this.levels = levels;
    this.listeners = new Set();
    this.instructions = [];
    this.prompts = [];
    this.replySeqs = [];
    this.interrupts = 0;
    this.sent = [];
    this.closed = false;
  }
  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(e) {
    for (const fn of [...this.listeners]) fn(e);
  }
  async connect() {
    this.emit({ type: "connection", state: "connected" });
  }
  applyInstructions(s) {
    this.instructions.push(s);
  }
  sendChild(text, opts = {}) {
    this.sent.push(text);
    this.emit({ type: "child_final", text, startedAt: Date.now(), typed: true, chipId: opts.chipId });
  }
  promptTeacher(reply) {
    this.prompts.push(reply?.text ?? null);
    this.replySeqs.push(reply?.seq ?? null);
  }
  /** Simulate a whole teacher turn. */
  speak(id, text, at = Date.now()) {
    this.emit({ type: "response_start", responseId: id, at });
    this.emit({ type: "teacher_audio_start" });
    this.emit({ type: "teacher_done", responseId: id, text });
    this.emit({ type: "teacher_audio_end" });
    this.emit({ type: "response_done", responseId: id, status: "completed" });
  }
  interrupt() {
    this.interrupts++;
  }
  setPushToTalk() {}
  talkStart() {}
  talkEnd() {}
  close() {
    this.closed = true;
  }
}

function fakeApi({ turn } = {}) {
  const calls = { start: [], turn: [], end: [] };
  const api = {
    calls,
    start: async (req) => {
      calls.start.push(req);
      return {
        lessonId: "L1",
        topic: { id: "c4-maths-fractions", title: "Fractions", chapter: "6" },
        instructions: "INSTR-0",
        teacher: { id: "asha", name: "Asha", voice: "marin" },
        moduleCommands: [],
        ui: { whiteboard: { kind: "text", value: "1/2" } },
        teacherOpening: "Namaste Aarav!",
        teacherOpeningSeq: 1,
      };
    },
    turn: async (req) => {
      calls.turn.push(req);
      if (turn) return turn(req, calls.turn.length);
      return { instructions: `INSTR-${calls.turn.length}`, move: { kind: "probe", shape: "ask why" }, moduleCommands: [], ui: {}, teacherReply: `reply ${calls.turn.length}`, teacherReplySeq: 10 + calls.turn.length };
    },
    end: async (lessonId) => {
      calls.end.push(lessonId);
      return { ok: true };
    },
    realtimeToken: async () => {
      throw new Error("not used");
    },
  };
  return api;
}

async function startRuntime(mode, apiOpts) {
  const api = fakeApi(apiOpts);
  const timers = fakeTimers();
  let link;
  const rt = new LessonRuntime({
    api,
    timers,
    createLink: (m, ctx) => (link = new FakeLink(m, ctx.levels)),
  });
  await rt.start("child-1", mode);
  return { rt, api, timers, link };
}

// ───────────── realtime protocol ─────────────

test("ledger keeps realtime ordering and reports only excess messages", () => {
  const l = new ConversationLedger();
  l.add({ id: "a", type: "message" });
  l.add({ id: "c", type: "message" }, "a");
  l.add({ id: "b", type: "message" }, "a"); // inserted after a, before c
  l.add({ id: "z", type: "message" }, null); // first
  l.add({ id: "f", type: "function_call" });
  l.add({ id: "a", type: "message" }); // duplicate ignored
  assert.deepEqual(l.ids(), ["z", "a", "b", "c", "f"]);
  assert.deepEqual(l.excess(2), ["z", "a"]);
  assert.deepEqual(l.excess(10), []);
});

test("protocol maps a voice turn: speech → transcript → captions → audio → done", () => {
  const { p, events, types } = protocol();
  p.handle({ type: "input_audio_buffer.speech_started", item_id: "u1" });
  p.handle({ type: "input_audio_buffer.speech_stopped", item_id: "u1" });
  p.handle({ type: "conversation.item.added", item: { id: "u1", type: "message", role: "user" }, previous_item_id: null });
  p.handle({ type: "response.created", response: { id: "r1" } });
  p.handle({ type: "conversation.item.input_audio_transcription.delta", item_id: "u1", delta: "teen " });
  p.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "u1", transcript: " teen chauthai ", logprobs: [{ logprob: -0.1 }, { logprob: -0.3 }] });
  p.handle({ type: "response.output_audio_transcript.delta", response_id: "r1", delta: "Bilkul! " });
  p.handle({ type: "output_audio_buffer.started", response_id: "r1" });
  p.handle({ type: "response.output_audio_transcript.done", response_id: "r1", transcript: "Bilkul! Kyun?" });
  p.handle({ type: "response.done", response: { id: "r1", status: "completed", output: [] } });
  p.handle({ type: "output_audio_buffer.stopped", response_id: "r1" });
  assert.deepEqual(types(), [
    "child_speech_start", "child_speech_end", "response_start", "child_partial", "child_final",
    "teacher_delta", "teacher_audio_start", "teacher_done", "response_done", "teacher_audio_end",
  ]);
  const start = events.find((e) => e.type === "child_speech_start");
  const final = events.find((e) => e.type === "child_final");
  assert.equal(final.text, "teen chauthai");
  assert.equal(final.typed, false);
  assert.equal(final.startedAt, start.at, "child turn is dated from its VAD onset, not transcript arrival");
  assert.ok(Math.abs(final.asrConfidence - Math.exp(-0.2)) < 1e-9);
  assert.equal(events.find((e) => e.type === "teacher_done").text, "Bilkul! Kyun?");
});

test("protocol prunes all but the last 6 messages after each response.done", () => {
  const { p, sent } = protocol();
  let prev = null;
  for (let i = 1; i <= 9; i++) {
    p.handle({ type: "conversation.item.added", item: { id: `m${i}`, type: "message", role: i % 2 ? "user" : "assistant" }, previous_item_id: prev });
    prev = `m${i}`;
  }
  p.handle({ type: "response.created", response: { id: "r1" } });
  p.handle({ type: "response.done", response: { id: "r1", status: "completed" } });
  assert.deepEqual(sent.filter((e) => e.type === "conversation.item.delete").map((e) => e.item_id), ["m1", "m2", "m3"]);
  // already deleted ids are not re-sent next time
  p.handle({ type: "conversation.item.added", item: { id: "m10", type: "message" }, previous_item_id: "m9" });
  p.handle({ type: "response.created", response: { id: "r2" } });
  p.handle({ type: "response.done", response: { id: "r2", status: "completed" } });
  assert.deepEqual(sent.filter((e) => e.type === "conversation.item.delete").map((e) => e.item_id), ["m1", "m2", "m3", "m4"]);
});

test("protocol: barge-in during teacher audio marks the teacher turn interrupted once", () => {
  const { p, events } = protocol();
  p.handle({ type: "response.created", response: { id: "r1" } });
  p.handle({ type: "output_audio_buffer.started" });
  p.handle({ type: "input_audio_buffer.speech_started", item_id: "u2" });
  p.handle({ type: "response.done", response: { id: "r1", status: "cancelled", output: [{ content: [{ transcript: "Aadha matlab" }] }] } });
  p.handle({ type: "output_audio_buffer.cleared" });
  const cut = events.filter((e) => e.type === "teacher_interrupted");
  assert.equal(cut.length, 1);
  assert.equal(cut[0].responseId, "r1");
  assert.equal(events.find((e) => e.type === "teacher_done").text, "Aadha matlab", "falls back to response.done output");
  assert.equal(events.find((e) => e.type === "response_done").status, "cancelled");
});

test("protocol: interrupt() cancels generation and flushes WebRTC playback", () => {
  const { p, sent, events } = protocol();
  p.interrupt(); // nothing playing → nothing sent
  assert.equal(sent.length, 0);
  p.handle({ type: "response.created", response: { id: "r1" } });
  p.handle({ type: "output_audio_buffer.started" });
  p.sendUserText("mujhe nahi pata");
  assert.deepEqual(sent.map((e) => e.type), ["response.cancel", "output_audio_buffer.clear", "conversation.item.create", "response.create"]);
  assert.equal(sent[2].item.content[0].text, "mujhe nahi pata");
  assert.equal(events.filter((e) => e.type === "teacher_interrupted").length, 1);
});

test("protocol: push-to-talk turns are dated from the press; failures and benign errors", () => {
  const { p, sent, events } = protocol();
  p.beginTalk();
  p.endTalk();
  assert.deepEqual(sent.map((e) => e.type), ["input_audio_buffer.clear", "input_audio_buffer.commit"], "no reply asked before the commit lands");
  const pressAt = 1010;
  p.handle({ type: "input_audio_buffer.committed", item_id: "u9" });
  assert.equal(sent.at(-1).type, "response.create", "the reply is asked once the server confirms the commit");
  p.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "u9", transcript: "paanch" });
  assert.equal(events.at(-1).startedAt, pressAt);
  p.handle({ type: "conversation.item.input_audio_transcription.failed", item_id: "u10" });
  assert.deepEqual([events.at(-1).text, events.at(-1).asrConfidence], ["", 0]);
  const before = events.length;
  p.handle({ type: "error", error: { code: "response_cancel_not_active", message: "x" } });
  assert.equal(events.length, before, "benign race errors are not surfaced");
  p.handle({ type: "error", error: { code: "invalid_value", message: "bad" } });
  assert.deepEqual(events.at(-1), { type: "error", message: "bad", code: "invalid_value", fatal: false });
});

test("protocol: an accidental push-to-talk tap (empty commit) asks no reply and reports child_silent", () => {
  const { p, sent, events } = protocol();
  p.beginTalk();
  p.endTalk();
  p.handle({ type: "error", error: { code: "input_audio_buffer_commit_empty", message: "buffer too small" } });
  assert.ok(!sent.some((e) => e.type === "response.create"));
  assert.deepEqual(events.map((e) => e.type), ["child_silent"]);
  // a later VAD commit (push-to-talk off again) does not pick up the stale request
  p.setTurnDetection(DEFAULT_TURN_DETECTION);
  p.handle({ type: "input_audio_buffer.committed", item_id: "u1" });
  assert.ok(!sent.some((e) => e.type === "response.create"));
  const s = [{ type: "child_speech_end" }, { type: "child_silent" }].reduce(reduceStatus, reduceStatus(INITIAL_FLAGS, { type: "settle" }));
  assert.equal(statusOf(s), "your_turn", "nobody waits for a reply that is not coming");
});

test("protocol client events have the GA session shape", () => {
  const { p, sent } = protocol();
  p.applyInstructions("X");
  p.setTurnDetection(null);
  assert.deepEqual(sent[0], { type: "session.update", session: { type: "realtime", instructions: "X" } });
  assert.deepEqual(sent[1], { type: "session.update", session: { type: "realtime", audio: { input: { turn_detection: null } } } });
  // A push-to-talk toggle re-sends the whole minted audio.input with only turn_detection swapped.
  const minted = { audio: { input: { transcription: { model: "taxila-transcribe" }, noise_reduction: { type: "near_field" }, turn_detection: { type: "server_vad" } } } };
  p.setTurnDetection(null, audioInputFrom(minted));
  assert.deepEqual(sent[2].session.audio.input, { transcription: { model: "taxila-transcribe" }, noise_reduction: { type: "near_field" }, turn_detection: null });
  assert.equal(minted.audio.input.turn_detection.type, "server_vad", "the minted session is not mutated");
  assert.deepEqual(turnDetectionFrom({ audio: { input: { turn_detection: { type: "semantic_vad" } } } }), { type: "semantic_vad" });
  assert.equal(turnDetectionFrom({}), DEFAULT_TURN_DETECTION);
  assert.equal(confidenceFromLogprobs(undefined), undefined);
});

// ───────────── status ─────────────

test("status: four states derived from link events, at most one at a time", () => {
  const run = (...evs) => evs.reduce(reduceStatus, INITIAL_FLAGS);
  assert.equal(statusOf(INITIAL_FLAGS), "thinking", "the lesson opens with the teacher to speak");
  assert.equal(statusOf(run({ type: "settle" })), "your_turn");
  const s1 = run({ type: "settle" }, { type: "child_speech_start" });
  assert.equal(statusOf(s1), "listening");
  const s2 = reduceStatus(s1, { type: "child_speech_end" });
  assert.equal(statusOf(s2), "thinking");
  const s3 = [{ type: "response_start" }, { type: "teacher_audio_start" }].reduce(reduceStatus, s2);
  assert.equal(statusOf(s3), "speaking");
  // response.done before playback ends: still speaking
  const s4 = reduceStatus(s3, { type: "response_done" });
  assert.equal(statusOf(s4), "speaking");
  assert.equal(statusOf(reduceStatus(s4, { type: "teacher_audio_end" })), "your_turn");
  // barge-in: child voice wins over teacher voice
  assert.equal(statusOf(reduceStatus(s3, { type: "child_speech_start" })), "listening");
  // a late voice transcript does not start a new wait; a typed turn does
  const idle = run({ type: "settle" });
  assert.equal(statusOf(reduceStatus(idle, { type: "child_final", typed: false })), "your_turn");
  assert.equal(statusOf(reduceStatus(idle, { type: "child_final", typed: true })), "thinking");
});

test("level meter maps RMS to a 0..1 scale and is inert without an analyser", () => {
  assert.equal(levelFromRms(0), 0);
  assert.equal(levelFromRms(1e-4), 0);
  assert.equal(levelFromRms(1), 1);
  assert.ok(Math.abs(levelFromRms(0.01) - 0.4) < 1e-9);
  const m = new LevelMeter();
  m.tick();
  assert.equal(m.value, 0);
});

// ───────────── turn attribution ─────────────

test("teacher turns go to the child turn that followed them, once, and only when finished", () => {
  const t = new TeacherTurns();
  t.begin("r1", 100);
  t.done("r1", "Teen chauthai kaise?");
  t.begin("r2", 300); // reply to the child turn that started at 200, already streaming
  t.delta("r2", "Bahut ");
  assert.deepEqual(t.take(200), { text: "Teen chauthai kaise?", interrupted: false });
  assert.equal(t.take(200), null, "consumed");
  assert.ok(t.streaming() && !t.streaming(200));
  assert.equal(t.take(), null, "a turn still streaming is never taken half-said");
  t.interrupted("r2");
  t.done("r2", "Bahut badhiya, ab answer hai teen chauthai");
  assert.deepEqual(t.take(), { text: "Bahut badhiya, ab answer hai teen chauthai", interrupted: true });
  t.begin("r3", 400);
  t.finish("r3"); // a response that ended with no text
  assert.equal(t.take(), null);
  assert.ok(!t.streaming());
});

// ───────────── module events ─────────────

test("module events: interactions and errors only ride along; milestones call at once; drops are counted", () => {
  let calls = 0;
  const b = new ModuleEventBuffer(() => calls++);
  const ev = (type, name) => ({ moduleId: "m1", engine: "fraction-bars@1", type, name, at: 0 });
  b.add(ev("interaction", "shade_changed"));
  b.add(ev("error", "error"));
  assert.equal(calls, 0, "no timer flush, and an engine error is not a milestone");
  assert.deepEqual([...MILESTONE_TYPES].sort(), ["answer", "goal_met", "stuck"]);
  b.add(ev("goal_met", "shade 3/4"));
  assert.equal(calls, 1);
  assert.deepEqual(b.drain(), { events: [ev("interaction", "shade_changed"), ev("error", "error"), ev("goal_met", "shade 3/4")], dropped: 0 });
  for (let i = 0; i < MAX_BUFFERED + 5; i++) b.add(ev("interaction", "tap"));
  b.add(ev("stuck", "x"));
  const kept = b.drain();
  assert.equal(kept.events.length, MAX_BUFFERED);
  assert.equal(kept.dropped, 6, "the Director is told how many events were dropped");
  assert.equal(kept.events.at(-1).type, "stuck", "milestones survive the cap");
  b.add(ev("interaction", "late"));
  b.restore(kept);
  const back = b.drain();
  assert.equal(back.events.at(-1).name, "late", "a failed call's events go back in front of newer ones");
  assert.equal(back.events.length, MAX_BUFFERED);
  assert.equal(back.dropped, 6 + 1, "the restored count plus the one event the cap dropped on restore");
});

test("module channel replays live commands to late subscribers and validates them", () => {
  const ch = new ModuleChannel();
  const dropped = ch.push([
    { op: "mount", moduleId: "a", engine: "fraction-bars@1", params: { denominators: [4] } },
    { op: "set_param", moduleId: "a", name: "target", value: "3/4" },
    { op: "highlight", moduleId: "nope", target: "bar:0" },
    { op: "explode", moduleId: "a" },
    { op: "mount", moduleId: "b", engine: "x@1", params: {} },
    { op: "unmount", moduleId: "b" },
  ]);
  assert.equal(dropped, 2);
  const seen = [];
  ch.subscribe((c) => seen.push(`${c.op}:${c.moduleId}`));
  assert.deepEqual(seen, ["mount:a", "set_param:a"]);
  ch.push([{ op: "mount", moduleId: "a", engine: "fraction-bars@1", params: {} }]); // remount replaces history
  const late = [];
  ch.subscribe((c) => late.push(c.op));
  assert.deepEqual(late, ["mount"]);
  assert.deepEqual(ch.mounted(), ["a"]);
  ch.clear();
  assert.deepEqual(ch.mounted(), []);
});

// ───────────── frame protocol + params ─────────────

test("frame protocol rejects malformed messages and maps events for the Director", () => {
  assert.equal(parseModuleToHost({ type: "ready" }), null, "moduleId required");
  assert.equal(parseModuleToHost({ type: "goal_met", moduleId: "m" }), null);
  assert.equal(parseModuleToHost("ready"), null);
  assert.deepEqual(parseModuleToHost({ type: "answer", moduleId: "m", value: 3, correct: "yes" }), { type: "answer", moduleId: "m", value: 3 });
  assert.deepEqual(parseHostToModule({ type: "init", moduleId: "m", engine: "e", params: {} }), {
    type: "init", moduleId: "m", engine: "e", params: {}, lang: "english", ageBand: "10-15",
  });
  assert.equal(parseHostToModule({ type: "init", moduleId: "m", engine: "e", params: [] }), null);
  assert.equal(toModuleEvent({ type: "ready", moduleId: "m" }, "e", 1), null);
  assert.deepEqual(toModuleEvent({ type: "answer", moduleId: "m", value: "same", correct: false }, "e", 1), {
    moduleId: "m", engine: "e", type: "answer", at: 1, name: "answer", data: { value: "same", correct: false },
  });
});

test("params resolve against the EngineDef: defaults, clamps, enums, unknowns", () => {
  const def = {
    id: "t@1", title: "t", subjects: [], emits: [],
    params: {
      n: { type: "number", min: 1, max: 12, default: 4, doc: "" },
      mode: { type: "string", enum: ["a", "b"], default: "a", doc: "" },
      list: { type: "array", default: [], doc: "" },
      opt: { type: "string", doc: "" },
    },
  };
  assert.deepEqual(resolveParams(def, {}), { params: { n: 4, mode: "a", list: [] }, issues: [] });
  const r = resolveParams(def, { n: 40, mode: "c", list: "x", extra: 1, opt: "ok" });
  assert.deepEqual(r.params, { n: 12, mode: "a", list: [], opt: "ok" });
  assert.equal(r.issues.length, 4);
});

// ───────────── fraction-bars verdicts ─────────────

test("fraction-bars: config normalisation and goal checks are exact", () => {
  const cfg = fb.normalizeConfig({ denominators: [4, 40, 3, 2], numerators: [9], target: "1/2", locked: [true] });
  assert.deepEqual(cfg.denominators, [4, 12, 3]);
  assert.deepEqual(cfg.numerators, [4, 0, 0]);
  assert.equal(cfg.targetBar, 1, "target goes to the first unlocked bar");
  assert.equal(fb.partsForTarget(cfg), 6);
  let s = fb.initialShading(cfg);
  for (let k = 0; k < 6; k++) s = fb.step(s, 1, 1);
  assert.ok(fb.goalReached(cfg, s), "6/12 is 1/2 with equivalence on");
  assert.ok(!fb.goalReached({ ...cfg, equivalentOk: false }, s));
  assert.equal(fb.partsForTarget({ ...cfg, targetBar: 2 }), null, "1/2 cannot be shown in thirds");
  assert.deepEqual(fb.step(fb.toggle(s, 1, 0), 1, -1)[1].filter(Boolean).length, 4);
  assert.equal(fb.parseFraction("3 / 4").n, 3);
  assert.equal(fb.parseFraction("3/0"), null);
  assert.ok(fb.normalizeConfig({ target: "abc" }).issues.length);
});

test("fraction-bars: compare answers", () => {
  const f = [{ n: 3, d: 4 }, { n: 2, d: 3 }];
  assert.ok(fb.compareCorrect(f, "bigger", 0));
  assert.ok(!fb.compareCorrect(f, "bigger", 1));
  assert.ok(fb.compareCorrect(f, "smaller", 1));
  assert.ok(!fb.compareCorrect(f, "bigger", "same"));
  const eq = [{ n: 1, d: 2 }, { n: 2, d: 4 }];
  assert.ok(fb.compareCorrect(eq, "bigger", "same"));
  assert.ok(!fb.compareCorrect(eq, "bigger", 0));
  assert.deepEqual(fb.correctBars(f, "bigger"), [0]);
  assert.deepEqual(fb.correctBars(eq, "bigger"), []);
  const cfg = fb.normalizeConfig({ mode: "compare", denominators: [4, 3], numerators: [3, 2], target: "1/2" });
  assert.deepEqual(cfg.locked, [true, true]);
  assert.equal(cfg.target, null);
});

// ───────────── runtime (fake link + fake API) ─────────────

test("runtime text mode: opening, typed turn, reply is spoken from its stored turn", async () => {
  const { rt, api, link } = await startRuntime("text");
  assert.equal(rt.state.phase, "live");
  assert.deepEqual(link.instructions, ["INSTR-0"]);
  assert.deepEqual(link.prompts, ["Namaste Aarav!"]);
  assert.deepEqual(link.replySeqs, [1], "the opening is spoken by its stored turn seq, never as free text");
  assert.deepEqual(rt.state.ui.whiteboard, { kind: "text", value: "1/2" });
  link.speak("t1", "Namaste Aarav!", 1);
  assert.equal(rt.state.status, "your_turn");

  rt.say("  teen chauthai  ");
  assert.equal(rt.state.status, "thinking");
  await flush();
  assert.equal(api.calls.turn.length, 1);
  // The server wrote and stored the teacher's lines in text mode: echoing them back stored each one twice.
  assert.deepEqual(api.calls.turn[0], { lessonId: "L1", childText: "teen chauthai", typed: true });
  assert.deepEqual(link.instructions, ["INSTR-0", "INSTR-1"]);
  assert.deepEqual(link.prompts, ["Namaste Aarav!", "reply 1"]);
  assert.deepEqual(link.replySeqs, [1, 11]);
  assert.deepEqual(rt.state.move, { kind: "probe", shape: "ask why" });
  assert.deepEqual(rt.state.ui.whiteboard, { kind: "text", value: "1/2" }, "whiteboard persists when absent");
  assert.deepEqual(rt.state.captions.map((c) => [c.who, c.text]), [["teacher", "Namaste Aarav!"], ["child", "teen chauthai"]]);

  // Typing over the teacher: only the fact that she was cut off travels.
  link.emit({ type: "response_start", responseId: "t2", at: 2 });
  link.emit({ type: "teacher_done", responseId: "t2", text: "reply 1" });
  link.emit({ type: "teacher_audio_start" });
  link.emit({ type: "teacher_interrupted", responseId: "t2" });
  rt.say("ruko");
  await flush();
  assert.deepEqual(api.calls.turn[1], { lessonId: "L1", childText: "ruko", teacherInterrupted: true, typed: true });

  await rt.end();
  assert.equal(rt.state.phase, "ended");
  assert.deepEqual(api.calls.end, ["L1"]);
  assert.ok(link.closed);
});

test("runtime: module interactions ride with the next child turn; a milestone calls at once and carries no teacher turn", async () => {
  const { rt, api, link } = await startRuntime("text", {
    turn: (req, n) => ({
      instructions: `I${n}`, move: { kind: n === 1 ? "show_module" : "celebrate", shape: "s" }, ui: n === 1 ? { chips: [{ id: "c1", label: "Cricket" }] } : {},
      teacherReply: `reply ${n}`, teacherReplySeq: 20 + n,
      moduleCommands: n === 1 ? [{ op: "mount", moduleId: "fb1", engine: "fraction-bars@1", params: { denominators: [4], target: "3/4" } }] : [],
    }),
  });
  link.speak("t1", "Namaste", 1);
  rt.say("haan");
  await flush();
  link.speak("t2", "reply 1", 2);
  assert.deepEqual(rt.modules.mounted(), ["fb1"], "moduleCommands reach the module channel");
  assert.deepEqual(rt.state.ui.chips, [{ id: "c1", label: "Cricket" }]);

  const ev = (type, name) => ({ moduleId: "fb1", engine: "fraction-bars@1", type, name, at: 5 });
  rt.moduleEvent(ev("interaction", "shade_changed"));
  rt.moduleEvent(ev("interaction", "shade_changed"));
  rt.moduleEvent(ev("error", "error"));
  await flush();
  assert.equal(api.calls.turn.length, 1, "plain interactions and errors never call the Director on their own");
  rt.tapChip({ id: "c1", label: "Cricket" });
  await flush();
  assert.equal(api.calls.turn.length, 2);
  assert.equal(api.calls.turn[1].chipId, "c1");
  assert.equal(api.calls.turn[1].childText, "Cricket");
  assert.deepEqual(api.calls.turn[1].moduleEvents.map((e) => e.type), ["interaction", "interaction", "error"]);
  link.speak("t3", "reply 2", 3);
  assert.equal(rt.state.status, "your_turn");

  rt.moduleEvent(ev("goal_met", "shade 3/4"));
  await flush();
  assert.equal(api.calls.turn.length, 3);
  assert.deepEqual(api.calls.turn[2], { lessonId: "L1", childText: "", moduleEvents: [ev("goal_met", "shade 3/4")] }, "a module-only turn");
  assert.equal(link.prompts.at(-1), "reply 3", "the floor was free: the reaction is spoken");
  link.speak("t4", "reply 3", 4);

  // A milestone while the teacher is speaking: its reply waits for the floor instead of cutting her off.
  link.emit({ type: "response_start", responseId: "t5", at: 5 });
  link.emit({ type: "teacher_audio_start" });
  rt.moduleEvent(ev("stuck", "many_changes_without_goal"));
  await flush();
  assert.equal(api.calls.turn.length, 4);
  assert.equal(link.prompts.at(-1), "reply 3", "not spoken over her");
  link.emit({ type: "teacher_audio_end" });
  link.emit({ type: "response_done", responseId: "t5", status: "completed" });
  assert.equal(link.prompts.at(-1), "reply 4", "spoken once the floor is free");
  assert.equal(link.replySeqs.at(-1), 24);

  // ...and is dropped if the child takes the floor first.
  link.emit({ type: "response_start", responseId: "t6", at: 6 });
  link.emit({ type: "teacher_audio_start" });
  rt.moduleEvent(ev("goal_met", "shade 3/4"));
  await flush();
  rt.say("aur ek");
  link.emit({ type: "teacher_audio_end" });
  link.emit({ type: "response_done", responseId: "t6", status: "cancelled" });
  await flush();
  assert.ok(!link.prompts.includes("reply 5"), "a reaction the child talked over is never voiced late");
});

test("runtime voice mode: a transcript that lands after the reply started still carries the previous teacher turn", async () => {
  const { rt, api, link } = await startRuntime("voice");
  assert.deepEqual(link.prompts, [null], "voice teacher opens via response.create");
  link.speak("r1", "Batao, 3/4 bada hai ya 2/3?", 100);
  link.emit({ type: "child_speech_start", at: 200, itemId: "u1" });
  link.emit({ type: "child_speech_end", at: 900 });
  link.emit({ type: "response_start", responseId: "r2", at: 1000 }); // teacher already answering
  link.emit({ type: "teacher_delta", responseId: "r2", delta: "Kyun?" });
  link.emit({ type: "child_final", text: "teen chauthai", startedAt: 200, typed: false, itemId: "u1", asrConfidence: 0.9 });
  await flush();
  assert.deepEqual(api.calls.turn[0], {
    lessonId: "L1", childText: "teen chauthai", asrConfidence: 0.9, teacherText: "Batao, 3/4 bada hai ya 2/3?", teacherInterrupted: false,
  });
  assert.equal(link.prompts.length, 1, "voice mode does not speak teacherReply");
  assert.deepEqual(link.instructions, ["INSTR-0", "INSTR-1"]);
});

test("runtime voice mode: a milestone during a streaming reply; the child turn then carries her whole turn and the cut", async () => {
  const { rt, api, link } = await startRuntime("voice", {
    turn: (req, n) => ({ instructions: `I${n}`, move: { kind: "celebrate", shape: "s" }, moduleCommands: [], ui: {}, ...(req.childText ? {} : { speakNow: "when_free" }) }),
  });
  link.speak("r1", "Batao, kitne hisse?", 100);
  link.emit({ type: "response_start", responseId: "r2", at: 300 });
  link.emit({ type: "teacher_audio_start" });
  link.emit({ type: "teacher_delta", responseId: "r2", delta: "Bahut badhiya, ab" });
  rt.moduleEvent({ moduleId: "m1", engine: "fraction-bars@1", type: "goal_met", name: "shade 3/4", at: 350 });
  await flush();
  assert.deepEqual(api.calls.turn[0], { lessonId: "L1", childText: "", moduleEvents: [{ moduleId: "m1", engine: "fraction-bars@1", type: "goal_met", name: "shade 3/4", at: 350 }] });
  assert.equal(link.prompts.length, 1, "she is talking: the reaction waits");
  // The child barges in; the transcript lands before her cut-off turn is final.
  link.emit({ type: "child_speech_start", at: 500, itemId: "u1" });
  link.emit({ type: "teacher_interrupted", responseId: "r2" });
  link.emit({ type: "child_speech_end", at: 900 });
  link.emit({ type: "child_final", text: "teen chauthai", startedAt: 500, typed: false, itemId: "u1", asrConfidence: 0.9 });
  await flush();
  assert.equal(api.calls.turn.length, 1, "the child turn waits for her turn to finish streaming");
  link.emit({ type: "teacher_done", responseId: "r2", text: "Bahut badhiya, ab answer hai teen chauthai" });
  link.emit({ type: "response_done", responseId: "r2", status: "cancelled" });
  link.emit({ type: "teacher_audio_end" });
  await flush();
  assert.deepEqual(api.calls.turn[1], {
    lessonId: "L1", childText: "teen chauthai", asrConfidence: 0.9,
    teacherText: "Batao, kitne hisse? Bahut badhiya, ab answer hai teen chauthai", teacherInterrupted: true,
  });
  assert.equal(link.prompts.length, 1, "the deferred reaction was dropped: the child took the floor");
});

test("runtime voice mode: a module milestone with the floor free is voiced; a hold (no speakNow) is not", async () => {
  let speak = true;
  const { rt, api, link } = await startRuntime("voice", {
    turn: () => ({ instructions: "I", move: { kind: "celebrate", shape: "s" }, moduleCommands: [], ui: {}, ...(speak ? { speakNow: "when_free" } : {}) }),
  });
  link.speak("r1", "Namaste", 100);
  assert.equal(rt.state.status, "your_turn");
  rt.moduleEvent({ moduleId: "m1", engine: "e", type: "goal_met", name: "g", at: 1 });
  await flush();
  assert.deepEqual(link.prompts, [null, null]);
  speak = false;
  rt.moduleEvent({ moduleId: "m1", engine: "e", type: "answer", name: "answer", at: 2 });
  await flush();
  assert.equal(api.calls.turn.length, 2);
  assert.deepEqual(link.prompts, [null, null], "nothing changed, nothing said");
});

test("runtime voice mode: a safeguarding move is voiced at once, cutting off a reply from the old instructions", async () => {
  const { rt, link } = await startRuntime("voice", {
    turn: () => ({
      instructions: "SAFEGUARD", move: { kind: "safeguard", shape: "s" }, moduleCommands: [], speakNow: "interrupt",
      ui: { whiteboard: { kind: "text", value: "Childline 1098 · Tele-MANAS 14416" } },
    }),
  });
  link.speak("r1", "Namaste", 100);
  link.emit({ type: "child_speech_start", at: 200, itemId: "u1" });
  link.emit({ type: "child_speech_end", at: 900 });
  link.emit({ type: "response_start", responseId: "r2", at: 1000 });
  link.emit({ type: "teacher_audio_start" });
  link.emit({ type: "teacher_delta", responseId: "r2", delta: "Chalo, fractions dekhte hain!" });
  link.emit({ type: "child_final", text: "papa mujhe maarte hain", startedAt: 200, typed: false, itemId: "u1", asrConfidence: 0.9 });
  await flush();
  assert.equal(link.instructions.at(-1), "SAFEGUARD");
  assert.equal(link.interrupts, 1, "the reply from the old instructions is cut off");
  assert.deepEqual(link.prompts, [null, null], "and the hand-off is voiced now, not on the child's next turn");
  assert.match(rt.state.ui.whiteboard.value, /1098/, "the helplines are on screen too");
});

test("runtime voice mode: the Director's end is voiced as a goodbye once the floor is free, then the call ends", async () => {
  const { rt, api, link } = await startRuntime("voice", {
    turn: () => ({ instructions: "WRAP", move: { kind: "wrap", shape: "s" }, moduleCommands: [], ui: {}, end: true }),
  });
  link.speak("r1", "Namaste!", 100);
  link.emit({ type: "child_speech_start", at: 200, itemId: "u1" });
  link.emit({ type: "child_speech_end", at: 900 });
  link.emit({ type: "response_start", responseId: "r2", at: 1000 }); // she answers from the old instructions
  link.emit({ type: "teacher_audio_start" });
  link.emit({ type: "child_final", text: "mujhe band karna hai", startedAt: 200, typed: false, itemId: "u1", asrConfidence: 0.9 });
  await flush();
  assert.equal(link.instructions.at(-1), "WRAP");
  assert.deepEqual(link.prompts, [null], "not while she is still talking");
  link.emit({ type: "teacher_done", responseId: "r2", text: "Achha, 3/4 bada hai ya 2/3?" });
  link.emit({ type: "teacher_audio_end" });
  link.emit({ type: "response_done", responseId: "r2", status: "completed" });
  assert.deepEqual(link.prompts, [null, null], "floor free: the goodbye is asked for, once");
  assert.equal(api.calls.end.length, 0, "the call is not dropped before the goodbye is heard");
  link.speak("r3", "Theek hai, aaj ke liye bas. Bye!", 2000);
  await flush();
  await flush();
  assert.deepEqual(api.calls.end, ["L1"]);
  assert.equal(rt.state.phase, "ended");
  assert.ok(link.closed);
  assert.deepEqual(link.prompts, [null, null], "exactly one goodbye");
});

test("runtime voice mode: a teacher who holds the floor past the grace is cut off for the goodbye", async () => {
  const { rt, api, link, timers } = await startRuntime("voice", {
    turn: () => ({ instructions: "WRAP", move: { kind: "wrap", shape: "s" }, moduleCommands: [], ui: {}, end: true }),
  });
  link.speak("r1", "Namaste!", 100);
  link.emit({ type: "child_speech_start", at: 200, itemId: "u1" });
  link.emit({ type: "child_speech_end", at: 900 });
  link.emit({ type: "response_start", responseId: "r2", at: 1000 });
  link.emit({ type: "teacher_audio_start" });
  link.emit({ type: "child_final", text: "bye", startedAt: 200, typed: false, itemId: "u1", asrConfidence: 0.9 });
  await flush();
  timers.advance(11_999);
  assert.equal(link.interrupts, 0);
  timers.advance(1);
  assert.equal(link.interrupts, 1);
  assert.deepEqual(link.prompts, [null, null]);
  timers.advance(12_000); // the goodbye never finished: end anyway
  await flush();
  await flush();
  assert.deepEqual(api.calls.end, ["L1"]);
  assert.equal(rt.state.phase, "ended");
});

test("runtime: a failed Director call in text mode clears 'thinking'; ASR failure still reaches the Director", async () => {
  const { rt, api, link } = await startRuntime("text", { turn: () => Promise.reject(new Error("boom")) });
  link.speak("t1", "Namaste", 1);
  rt.say("hello");
  assert.equal(rt.state.status, "thinking");
  await flush();
  await flush();
  assert.equal(rt.state.status, "your_turn");
  assert.equal(rt.state.error, "boom");
  assert.equal(rt.state.phase, "live");
  link.emit({ type: "child_final", text: "", startedAt: 5, typed: false, itemId: "u3", asrConfidence: 0 });
  await flush();
  assert.equal(api.calls.turn.at(-1).asrConfidence, 0);
  link.emit({ type: "child_final", text: "", startedAt: 6, typed: false, itemId: "u4" }); // empty = noise
  await flush();
  assert.equal(api.calls.turn.length, 2);
});

test("runtime: a failed call's module events ride with the next call; drops at the cap are reported", async () => {
  let fail = true;
  const { rt, api, link } = await startRuntime("text", {
    turn: () => {
      if (fail) {
        fail = false;
        return Promise.reject(new Error("boom"));
      }
      return { instructions: "I", move: { kind: "probe", shape: "s" }, moduleCommands: [], ui: {} };
    },
  });
  link.speak("t1", "Namaste", 1);
  for (let i = 0; i < MAX_BUFFERED + 3; i++) rt.moduleEvent({ moduleId: "m1", engine: "e", type: "interaction", name: `tap${i}`, at: i });
  rt.say("a");
  await flush();
  await flush();
  assert.equal(api.calls.turn[0].moduleEvents.length, MAX_BUFFERED);
  assert.equal(api.calls.turn[0].droppedEvents, 3);
  rt.say("b");
  await flush();
  assert.equal(api.calls.turn[1].moduleEvents.length, MAX_BUFFERED, "restored after the failure");
  assert.equal(api.calls.turn[1].moduleEvents[0].name, "tap3");
  assert.equal(api.calls.turn[1].droppedEvents, 3);
});

test("runtime: 'lesson has ended' (409) is terminal and does not end the lesson twice", async () => {
  const { rt, api, link } = await startRuntime("text", { turn: () => Promise.reject(new ApiError(409, "lesson has ended", {})) });
  link.speak("t1", "Namaste", 1);
  rt.say("hello");
  await flush();
  await flush();
  assert.equal(rt.state.phase, "ended");
  assert.ok(link.closed);
  rt.say("still there?");
  await rt.end();
  assert.equal(api.calls.turn.length, 1);
  assert.deepEqual(api.calls.end, [], "it was closed elsewhere");
});

test("runtime: Director end waits for the teacher to finish speaking", async () => {
  const { rt, api, link } = await startRuntime("text", {
    turn: () => ({ instructions: "I", move: { kind: "wrap", shape: "s" }, moduleCommands: [], ui: {}, teacherReply: "Bye!", teacherReplySeq: 9, end: true }),
  });
  link.speak("t1", "Namaste", 1);
  rt.say("bye");
  await flush();
  link.emit({ type: "response_start", responseId: "t2", at: 10 });
  link.emit({ type: "teacher_audio_start" });
  assert.equal(api.calls.end.length, 0);
  link.emit({ type: "teacher_audio_end" });
  link.emit({ type: "response_done", responseId: "t2", status: "completed" });
  await flush();
  await flush();
  assert.deepEqual(api.calls.end, ["L1"]);
  assert.equal(rt.state.phase, "ended");
});

test("runtime: end() lets the Director call in flight land before closing (up to the server's worst case)", async () => {
  let release;
  const { rt, api, link, timers } = await startRuntime("text", {
    turn: () => new Promise((r) => (release = () => r({ instructions: "I", move: { kind: "probe", shape: "s" }, moduleCommands: [], ui: {} }))),
  });
  link.speak("t1", "Namaste", 1);
  rt.say("teen chauthai");
  await flush();
  const ending = rt.end();
  assert.ok(link.closed, "the teacher stops at once");
  timers.advance(5_000);
  await flush();
  assert.deepEqual(api.calls.end, [], "a 5 s turn is still landing");
  release();
  await ending;
  assert.deepEqual(api.calls.end, ["L1"]);
  assert.equal(rt.state.phase, "ended");
  assert.equal(rt.state.pendingTurns, 0);
});

test("runtime: unmount, a fatal link error and ending while starting all close the lesson on the server", async () => {
  // unmount mid-lesson
  {
    const { rt, api } = await startRuntime("text");
    rt.dispose();
    await flush();
    assert.deepEqual(api.calls.end, ["L1"]);
    assert.equal(rt.state.phase, "ended");
  }
  // voice reconnects exhausted
  {
    const { rt, api, link } = await startRuntime("voice");
    link.emit({ type: "error", message: "the voice call dropped and could not reconnect", fatal: true });
    await flush();
    assert.equal(rt.state.phase, "error");
    assert.ok(link.closed);
    assert.deepEqual(api.calls.end, ["L1"]);
  }
  // end() while api.start is still in flight
  {
    const api = fakeApi();
    let resolveStart;
    const realStart = api.start;
    api.start = (req) => new Promise((r) => (resolveStart = () => r(realStart(req))));
    let created = 0;
    const rt = new LessonRuntime({ api, timers: fakeTimers(), createLink: (m, ctx) => (created++, new FakeLink(m, ctx.levels)) });
    const starting = rt.start("child-1", "text");
    await rt.end();
    resolveStart();
    await starting;
    await flush();
    assert.equal(rt.state.phase, "ended");
    assert.equal(created, 0, "no link for a lesson that was ended while starting");
    assert.deepEqual(api.calls.end, ["L1"]);
  }
});

test("runtime: a lesson whose link cannot connect is closed on the server and reported", async () => {
  const api = fakeApi();
  const rt = new LessonRuntime({
    api,
    timers: fakeTimers(),
    createLink: (m, ctx) => {
      const link = new FakeLink(m, ctx.levels);
      link.connect = async () => {
        throw new Error("voice channel did not open");
      };
      return link;
    },
  });
  await assert.rejects(rt.start("child-1", "voice"), /did not open/);
  await flush();
  assert.equal(rt.state.phase, "error");
  assert.equal(rt.state.error, "voice channel did not open");
  assert.deepEqual(api.calls.end, ["L1"]);
});
