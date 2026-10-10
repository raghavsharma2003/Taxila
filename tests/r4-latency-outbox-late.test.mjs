// r4-latency (main-session ask on the outbox change): the late-disclosure path end to end on the CLAIMING outbox. A child
// types a disclosure; the page dies before the server answers (the turn is held, claimed under its turnSeq); the next page
// load flushes it to the closed lesson; the server takes it late and safeguards; the client raises lateSafeguard (the
// Desk opens the Help sheet: src/child/lesson/useDesk.ts). The fake server decides with the REAL server functions:
// scanSafety (the predicate), acceptsLate (a page-hide-closed lesson still takes held answers) and replayFor (dedupe on
// (lessonId, turnSeq)).
import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryOutboxStore } from "../src/lesson/outbox.ts";
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { scanSafety } from "../server/director/safety.js";
import { acceptsLate, replayFor } from "../server/brain/turn.js";

const DISCLOSURE = "papa mujhe roz maarte hain";

class QuietLink {
  constructor(levels) { this.mode = "text"; this.levels = levels; this.fns = new Set(); }
  on(fn) { this.fns.add(fn); return () => this.fns.delete(fn); }
  emit(e) { for (const f of [...this.fns]) f(e); }
  async connect() { this.emit({ type: "connection", state: "connected" }); }
  sendChild(text) { this.emit({ type: "child_final", text, startedAt: Date.now(), typed: true }); }
  applyInstructions() {} promptTeacher() {} interrupt() {} setPushToTalk() {} talkStart() {} talkEnd() {} close() {}
}
const until = async (f, ms = 2000) => { const t0 = Date.now(); while (!f()) { if (Date.now() - t0 > ms) throw new Error("timed out"); await new Promise((r) => setTimeout(r, 5)); } };
const startOf = (lessonId) => async () => ({ lessonId, topic: { id: "t", title: "T", chapter: "1" }, teacher: { id: "asha", name: "Asha", voice: "v" }, moduleCommands: [], ui: {} });

test("late disclosure on the claiming outbox: held when the page dies, flushed on the next load, safeguarded, lateSafeguard raised", async () => {
  const store = new MemoryOutboxStore(true); // the browser's durable store, shared by both page loads
  // ── page 1: the child types a disclosure; the server never answers before the page dies
  const sent1 = [];
  const page1 = new LessonRuntime({
    outboxStore: store, createLink: (_m, c) => new QuietLink(c.levels),
    api: { start: startOf("OLD"), turn: (r) => { sent1.push(r); return new Promise(() => {}); }, end: async () => ({}), realtimeToken: async () => { throw new Error("no"); } },
  });
  await page1.start("c1", "text");
  page1.say(DISCLOSURE);
  await until(() => sent1.length === 1);
  const seq = sent1[0].turnSeq;
  assert.ok(Number.isInteger(seq) && seq > 0, "the turn went out under its claimed turnSeq");
  page1.dispose(); // the page dies before the ack (the beacon closes the lesson as "pagehide")
  const held = await store.list("OLD");
  assert.deepEqual(held.map((r) => [r.turnSeq, r.req.childText]), [[seq, DISCLOSURE]], "the answer is held, under the turnSeq it was sent with");

  // ── the server: OLD was closed by the page-hide beacon a minute ago; the held answer has not landed
  const OLD = { id: "OLD", ended_at: new Date(Date.now() - 60_000).toISOString(), state: { endedBy: "pagehide", acks: [] } };
  const seen = [];
  const server = async (r) => {
    if (r.lessonId !== "OLD") return { move: { kind: "probe", shape: "x" }, moduleCommands: [], ui: {} };
    seen.push(r);
    const replay = replayFor(OLD.state, r.turnSeq);
    if (replay) return { ...replay, moduleCommands: [], ui: {} };
    assert.ok(acceptsLate(OLD, r.turnSeq), "a page-hide-closed lesson still takes a held answer");
    OLD.state.acks.push({ turnSeq: r.turnSeq });
    return scanSafety(r.childText).distress
      ? { move: { kind: "safeguard", shape: "x" }, teacherReply: "Yeh sunke main chinta mein hoon. Childline 1098 ya Tele-MANAS 14416.", teacherReplySeq: 1, moduleCommands: [], ui: {}, end: true, late: true }
      : { move: { kind: "hold", shape: "" }, moduleCommands: [], ui: {}, end: true, late: true };
  };

  // ── page 2: the next load flushes the held answer to OLD
  const page2 = new LessonRuntime({ outboxStore: store, createLink: (_m, c) => new QuietLink(c.levels),
    api: { start: startOf("NEW"), turn: server, end: async () => ({}), realtimeToken: async () => { throw new Error("no"); } } });
  await page2.start("c1", "text");
  await until(() => !!page2.store.get().lateSafeguard);
  assert.equal(seen.length, 1, "flushed once");
  assert.equal(seen[0].childText, DISCLOSURE, "the child's own words reached the server");
  assert.equal(seen[0].turnSeq, seq, "under the SAME turnSeq (a resend the server can dedupe), marked retried");
  assert.equal(seen[0].retried, true);
  assert.deepEqual(await store.list("OLD"), [], "acknowledged: no longer held");
  // a new turn on page 2 claims its own turnSeq for its own lesson and never touches OLD's
  page2.say("teen chauthai");
  await new Promise((r) => setTimeout(r, 20));
  page2.dispose();
});

test("control: the same flush of a held answer that is NOT a disclosure raises nothing", async () => {
  const store = new MemoryOutboxStore(true);
  const page1 = new LessonRuntime({ outboxStore: store, createLink: (_m, c) => new QuietLink(c.levels),
    api: { start: startOf("OLD"), turn: () => new Promise(() => {}), end: async () => ({}), realtimeToken: async () => { throw new Error("no"); } } });
  await page1.start("c1", "text");
  page1.say("teen chauthai");
  await new Promise((r) => setTimeout(r, 20));
  page1.dispose();
  let flushed = 0;
  const page2 = new LessonRuntime({ outboxStore: store, createLink: (_m, c) => new QuietLink(c.levels),
    api: { start: startOf("NEW"), end: async () => ({}), realtimeToken: async () => { throw new Error("no"); },
      turn: async (r) => (r.lessonId === "OLD" ? (flushed++, { move: { kind: "hold", shape: "" }, moduleCommands: [], ui: {}, end: true, late: true }) : { move: { kind: "probe", shape: "x" }, moduleCommands: [], ui: {} }) } });
  await page2.start("c1", "text");
  await until(() => flushed === 1);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(page2.store.get().lateSafeguard, null);
  page2.dispose();
});
