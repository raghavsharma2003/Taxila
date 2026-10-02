// Client live-lesson runtime: everything that runs without a DOM (Node strips the TS types on import).
// Covers the realtime protocol mapping + context pruning, the four-state status rule, Director-turn
// attribution and ordering, module-event debouncing, the module command channel, the frame protocol,
// param resolution and the fraction-bars verdicts.
import { test } from "node:test";
import assert from "node:assert/strict";

import { ConversationLedger } from "../src/lesson/ledger.ts";
import { RealtimeProtocol, confidenceFromLogprobs, turnDetectionFrom, DEFAULT_TURN_DETECTION } from "../src/lesson/realtime.ts";
import { INITIAL_FLAGS, reduceStatus, statusOf } from "../src/lesson/status.ts";
import { ModuleEventBuffer, MAX_BUFFERED } from "../src/lesson/moduleEvents.ts";
import { ModuleChannel } from "../src/lesson/moduleChannel.ts";
import { TeacherTurns } from "../src/lesson/teacherTurns.ts";
import { LessonRuntime } from "../src/lesson/runtime.ts";
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
    this.prompts.push(reply ?? null);
  }
  /** Simulate a whole teacher turn. */
  speak(id, text, at = Date.now()) {
    this.emit({ type: "response_start", responseId: id, at });
    this.emit({ type: "teacher_audio_start" });
    this.emit({ type: "teacher_done", responseId: id, text });
    this.emit({ type: "teacher_audio_end" });
    this.emit({ type: "response_done", responseId: id, status: "completed" });
  }
  interrupt() {}
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
      };
    },
    turn: async (req) => {
      calls.turn.push(req);
      if (turn) return turn(req, calls.turn.length);
      return { instructions: `INSTR-${calls.turn.length}`, move: { kind: "probe", shape: "ask why" }, moduleCommands: [], ui: {}, teacherReply: `reply ${calls.turn.length}` };
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
  assert.deepEqual(sent.map((e) => e.type), ["input_audio_buffer.clear", "input_audio_buffer.commit", "response.create"]);
  const pressAt = 1010;
  p.handle({ type: "input_audio_buffer.committed", item_id: "u9" });
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

test("protocol client events have the GA session shape", () => {
  const { p, sent } = protocol();
  p.applyInstructions("X");
  p.setTurnDetection(null);
  assert.deepEqual(sent[0], { type: "session.update", session: { type: "realtime", instructions: "X" } });
  assert.deepEqual(sent[1], { type: "session.update", session: { type: "realtime", audio: { input: { turn_detection: null } } } });
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

test("teacher turns go to the child turn that followed them, once", () => {
  const t = new TeacherTurns();
  t.begin("r1", 100);
  t.done("r1", "Teen chauthai kaise?");
  t.begin("r2", 300); // reply to the child turn that started at 200, already streaming
  t.delta("r2", "Bahut ");
  assert.deepEqual(t.take(200), { text: "Teen chauthai kaise?", interrupted: false });
  assert.equal(t.take(200), null, "consumed");
  t.interrupted("r2");
  assert.deepEqual(t.take(), { text: "Bahut", interrupted: true });
});

// ───────────── module events ─────────────

test("module events batch every 3 s; milestones flush at once; drain cancels the batch", () => {
  const timers = fakeTimers();
  const flushes = [];
  const b = new ModuleEventBuffer((m) => flushes.push(m), { timers });
  const ev = (type, name) => ({ moduleId: "m1", engine: "fraction-bars@1", type, name, at: 0 });
  b.add(ev("interaction", "shade_changed"));
  b.add(ev("interaction", "shade_changed"));
  timers.advance(2999);
  assert.deepEqual(flushes, []);
  timers.advance(1);
  assert.deepEqual(flushes, [false]);
  b.drain();
  b.add(ev("interaction", "shade_changed"));
  b.add(ev("goal_met", "shade 3/4"));
  assert.deepEqual(flushes, [false, true]);
  assert.equal(b.drain().length, 2);
  assert.equal(timers.size, 0);
  for (let i = 0; i < MAX_BUFFERED + 5; i++) b.add(ev("interaction", "tap"));
  b.add(ev("stuck", "x"));
  const kept = b.drain();
  assert.equal(kept.length, MAX_BUFFERED);
  assert.equal(kept.at(-1).type, "stuck", "milestones survive the cap");
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

test("runtime text mode: opening, typed turn carries the teacher turn it answered, reply is spoken", async () => {
  const { rt, api, link } = await startRuntime("text");
  assert.equal(rt.state.phase, "live");
  assert.deepEqual(link.instructions, ["INSTR-0"]);
  assert.deepEqual(link.prompts, ["Namaste Aarav!"]);
  assert.deepEqual(rt.state.ui.whiteboard, { kind: "text", value: "1/2" });
  link.speak("t1", "Namaste Aarav!", 1);
  assert.equal(rt.state.status, "your_turn");

  rt.say("  teen chauthai  ");
  assert.equal(rt.state.status, "thinking");
  await flush();
  assert.equal(api.calls.turn.length, 1);
  assert.deepEqual(api.calls.turn[0], {
    lessonId: "L1", childText: "teen chauthai", teacherText: "Namaste Aarav!", teacherInterrupted: false, typed: true,
  });
  assert.deepEqual(link.instructions, ["INSTR-0", "INSTR-1"]);
  assert.deepEqual(link.prompts, ["Namaste Aarav!", "reply 1"]);
  assert.deepEqual(rt.state.move, { kind: "probe", shape: "ask why" });
  assert.deepEqual(rt.state.ui.whiteboard, { kind: "text", value: "1/2" }, "whiteboard persists when absent");
  assert.deepEqual(rt.state.captions.map((c) => [c.who, c.text]), [["teacher", "Namaste Aarav!"], ["child", "teen chauthai"]]);

  await rt.end();
  assert.equal(rt.state.phase, "ended");
  assert.deepEqual(api.calls.end, ["L1"]);
  assert.ok(link.closed);
});

test("runtime: module interactions ride with the next child turn; milestones call the Director at once", async () => {
  const { rt, api, link } = await startRuntime("text", {
    turn: (req, n) => ({
      instructions: `I${n}`, move: { kind: "show_module", shape: "s" }, ui: { chips: [{ id: "c1", label: "Cricket" }] }, teacherReply: "ok",
      moduleCommands: n === 1 ? [{ op: "mount", moduleId: "fb1", engine: "fraction-bars@1", params: { denominators: [4], target: "3/4" } }] : [],
    }),
  });
  link.speak("t1", "Namaste", 1);
  rt.say("haan");
  await flush();
  assert.deepEqual(rt.modules.mounted(), ["fb1"], "moduleCommands reach the module channel");
  assert.deepEqual(rt.state.ui.chips, [{ id: "c1", label: "Cricket" }]);

  const ev = (type, name) => ({ moduleId: "fb1", engine: "fraction-bars@1", type, name, at: 5 });
  rt.moduleEvent(ev("interaction", "shade_changed"));
  rt.moduleEvent(ev("interaction", "shade_changed"));
  await flush();
  assert.equal(api.calls.turn.length, 1, "interactions wait for a batch");
  rt.tapChip({ id: "c1", label: "Cricket" });
  await flush();
  assert.equal(api.calls.turn.length, 2);
  assert.equal(api.calls.turn[1].chipId, "c1");
  assert.equal(api.calls.turn[1].childText, "Cricket");
  assert.equal(api.calls.turn[1].moduleEvents.length, 2);
  assert.equal(rt.state.ui.chips?.length, 1, "new turn's chips shown");

  rt.moduleEvent(ev("goal_met", "shade 3/4"));
  await flush();
  assert.equal(api.calls.turn.length, 3);
  assert.equal(api.calls.turn[2].childText, "");
  assert.deepEqual(api.calls.turn[2].moduleEvents.map((e) => e.type), ["goal_met"]);
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

test("runtime: Director end waits for the teacher to finish speaking", async () => {
  const { rt, api, link } = await startRuntime("text", {
    turn: () => ({ instructions: "I", move: { kind: "wrap", shape: "s" }, moduleCommands: [], ui: {}, teacherReply: "Bye!", end: true }),
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
