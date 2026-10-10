// games-core patch 01 (docs/design/round4/build/games-core/patches/01-teacher-speaking-event.diff): the lesson runtime
// tells a play piece when the teacher starts and stops speaking, so the game's music bed ducks under her voice (O-G2).
// One window event per flip of teacherSpeaking; never a repeat for the same state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { TEACHER_SPEAKING } from "../src/play/engines/core3d/host.ts";

class FakeLink {
  constructor() { this.listeners = new Set(); }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(e) { for (const fn of [...this.listeners]) fn(e); }
  async connect() { this.emit({ type: "connection", state: "connected" }); }
  applyInstructions() {} sendChild() {} promptTeacher() {} interrupt() {} setPushToTalk() {} talkStart() {} talkEnd() {} close() {}
}
const timers = { setTimeout: () => 0, clearTimeout: () => {} };
const api = {
  start: async () => ({ lessonId: "L1", topic: { id: "c5-maths-ch02-t01", title: "Fractions", chapter: "2" }, instructions: "I", teacher: { id: "asha", name: "Asha", voice: "marin" }, moduleCommands: [], ui: {}, teacherOpening: "Namaste", teacherOpeningSeq: 1 }),
  turn: async () => ({ instructions: "I", move: { kind: "probe" }, moduleCommands: [], ui: {}, teacherReply: "r", teacherReplySeq: 2 }),
  end: async () => ({ ok: true }),
  realtimeToken: async () => { throw new Error("not used"); },
};

test("patch 01: the runtime dispatches taxila:teacher-speaking on each flip of her voice, once per flip", async () => {
  const seen = [];
  const hadWindow = "window" in globalThis;
  const prev = globalThis.window;
  const target = new EventTarget();
  globalThis.window = target;
  target.addEventListener(TEACHER_SPEAKING, (e) => seen.push(e.detail.on));
  try {
    let link;
    const rt = new LessonRuntime({ api, timers, createLink: () => (link = new FakeLink()) });
    await rt.start("child-1", "voice");
    link.emit({ type: "response_start", responseId: "r1", at: Date.now() });
    link.emit({ type: "teacher_audio_start" });
    link.emit({ type: "teacher_audio_start" });          // the same state again: no second event
    link.emit({ type: "teacher_done", responseId: "r1", text: "x" });
    link.emit({ type: "teacher_audio_end" });
    link.emit({ type: "response_done", responseId: "r1", status: "completed" });
    assert.deepEqual(seen, [true, false]);
  } finally {
    if (hadWindow) globalThis.window = prev; else delete globalThis.window;
  }
});
