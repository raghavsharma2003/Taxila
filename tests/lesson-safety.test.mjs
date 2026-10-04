// The teacher-output floor and the child's identifiers in live lessons, and the B1 lesson-route open items:
//   - floorViolations on the text-lane reply (rewrite with FLOOR_FIX, else the fixed line) and on what is actually said;
//     an incident row with family names only for ai_denial / helpline / romance / exclusivity;
//   - scrubPii on the child's words and history before any model;
//   - dedupe on (lessonId, turnSeq), edited replacing an attempt in flight, late answers for a page-hide-closed lesson,
//     and ui.hint on a hint move.
// No network and no database: the reply model is replaced (routes/lesson.js replyDeps). The DB-backed route checks are
// tests/lesson-safety-naming-db.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, hintFor } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import {
  __test as L, replyDeps, floorIncidentStmt, floorContentOf, FLOOR_INCIDENT_FAMILIES, turnSeqOf, acceptsLate, replayFor, endedByPageHide, LATE_TURN_MS,
} from "../server/routes/lesson.js";
import { FLOOR_FIX } from "../server/compiler/compile.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const fresh = (ctx = {}) => initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, ...ctx }, seed: 11, now: 0 });
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const NE = cls("no_evidence");
function toPractice(ctx) {
  let r = step(fresh(ctx), { event: "start", kit: K, now: 0 });
  // past the guidance ladder's faded worked-example step (W2-C, director/fading.js): these cases are about kit items
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, NE);
  return r;
}
const realChat = async () => (await import("../server/azure.js")).chat;

test("floor: an ai_denial draft is rewritten with the FLOOR_FIX shape; a rewrite that still breaks it ships the fixed line", async () => {
  const r = toPractice();
  const item = findItem(r.state, K, r.state.activeItemId);
  const seen = [];
  replyDeps.chat = async (_d, msgs) => { seen.push(msgs.at(-1).content); return { text: "Main ek real insaan hoon, AI nahi. Ek tukda kya kehlata hai?" }; };
  try {
    const out = await L.textReply({ instructions: "x", state: r.state, kit: K, childText: "tum insaan ho?", ui: r.ui, module: r.state.module });
    assert.ok(out.guard.caught.includes("floor"));
    assert.equal(out.guard.rewritten, true);
    assert.ok(seen.at(-1).includes(FLOOR_FIX.ai_denial), "the rewrite asks with the family's fix shape");
    assert.equal(out.guard.replaced, true);
    assert.ok(!/insaan hoon/.test(out.reply), out.reply);
    assert.ok(!out.floor, "what is said is clean, so no incident");
    assert.ok(item);
  } finally { replyDeps.chat = await realChat(); }
});

test("floor: the call-site recipe passes the posed item's verified content (prompt, answer, acceptable, hints, options)", () => {
  const item = { prompt_en: "Say: I am a real person.", prompt_hi: "Bolo: main asli insaan hoon.", answer: "I am a real person", acceptable: ["I'm a real person"],
    hints: ["Start with I am", "", "x"], options: [{ text: "A" }, { text: "Main tumhari best friend hoon" }] };
  assert.deepEqual(floorContentOf(item), ["Say: I am a real person.", "Bolo: main asli insaan hoon.", "I am a real person", "I'm a real person", "Start with I am", "x", "A", "Main tumhari best friend hoon"]);
  assert.deepEqual(floorContentOf(null), []);
});

test("floor incident: family names only, and only for ai_denial, helpline, romance and exclusivity", () => {
  assert.deepEqual([...FLOOR_INCIDENT_FAMILIES], ["ai_denial", "helpline", "romance", "exclusivity"]);
  assert.equal(floorIncidentStmt("c", "l", 3, ["guilt", "shaming"], "voice"), null, "lesser families stay on the turn row");
  const st = floorIncidentStmt("c", "l", 3, ["ai_denial", "guilt", "romance"], "cascade");
  assert.match(st.text, /'floor_violation', 'high'/);
  assert.deepEqual(st.params, ["c", "l", 3, { source: "teacher_transcript", lane: "cascade", families: ["ai_denial", "romance"] }]);
  assert.ok(!JSON.stringify(st.params).includes("insaan"), "never the words");
});

test("scrubPii: the child's words and history reach the reply model masked; her own turns too (a voice transcript can echo them)", async () => {
  const r = toPractice();
  let msgs;
  replyDeps.chat = async (_d, m) => { msgs = m; return { text: "Theek hai. Ek tukda kya kehlata hai?" }; };
  try {
    const state = { ...r.state, recent: [...r.state.recent, { who: "child", text: "mera number 98765 43210 hai" },
      { who: "teacher", text: "Tumhara number 98765 43210 hai? Achha." }, { who: "teacher", text: "Achha. Ab batao?" }] };
    await L.textReply({ instructions: "x", state, kit: K, childText: "my name is Riya Sharma, aadhaar 2345 6789 0123", history: state.recent, ui: r.ui, module: r.state.module });
    const user = msgs.filter((m) => m.role === "user").map((m) => m.content).join(" | ");
    assert.ok(!/98765|43210|Sharma|2345 6789/.test(user), user);
    assert.match(user, /\[phone\]/);
    assert.match(user, /\[aadhaar\]/);
    assert.match(user, /Riya/, "the first name is kept: the teacher already uses it");
    assert.ok(msgs.some((m) => m.role === "assistant" && m.content === "Achha. Ab batao?"), "a clean teacher turn is unchanged");
    const said = msgs.filter((m) => m.role === "assistant").map((m) => m.content).join(" | ");
    assert.ok(!/98765|43210/.test(said), said);
    assert.match(said, /\[phone\]/);
    // kit answers survive the scrub (a largest-number answer is a monotone run, never a phone)
    assert.equal(L.scrubbed("9876543210"), "9876543210");
    assert.equal(L.scrubbed("1/2"), "1/2");
  } finally { replyDeps.chat = await realChat(); }
});

test("dedupe: turnSeq is validated; a landed turnSeq replays its own response; an older one replays the current directives", () => {
  assert.equal(turnSeqOf({ turnSeq: 3 }), 3);
  for (const bad of [0, -1, 1.5, "3", null, undefined, 2e9]) assert.equal(turnSeqOf({ turnSeq: bad }), null, String(bad));
  const out = { move: { kind: "practice", shape: "s" }, moduleCommands: [], ui: { handover: "answer" }, teacherReply: "Ek tukda?", teacherReplySeq: 9 };
  const state = { acks: [{ turnSeq: 1 }, { turnSeq: 2 }], lastAck: { turnSeq: 2, out }, lastMove: { kind: "hint", shape: "h" }, lastUi: { handover: "answer", hint: { level: 1, text: "t" } } };
  assert.deepEqual(replayFor(state, 2), { ...out, duplicate: true });
  assert.deepEqual(replayFor(state, 1), { move: state.lastMove, moduleCommands: [], ui: state.lastUi, duplicate: true });
  assert.equal(replayFor(state, 3), null);
  assert.equal(replayFor(state, null), null);
  assert.equal(replayFor({}, 1), null);
});

test("late answers: only for a lesson the page-hide beacon closed, with a turnSeq, inside the outbox's 24 h", () => {
  const now = Date.parse("2026-10-03T12:00:00Z");
  const closed = (by, agoMs) => ({ ended_at: new Date(now - agoMs).toISOString(), state: by ? { endedBy: by } : {} });
  assert.equal(acceptsLate(closed("pagehide", 60_000), 4, now), true);
  assert.equal(acceptsLate(closed("pagehide", 60_000), null, now), false, "no outbox key, no late answer");
  assert.equal(acceptsLate(closed(null, 60_000), 4, now), false, "a lesson ended by Finish takes nothing more");
  assert.equal(acceptsLate(closed("pagehide", LATE_TURN_MS + 1), 4, now), false);
  assert.equal(acceptsLate({ ended_at: null, state: {} }, 4, now), false);
  // the beacon is the text/plain end (sendBeacon Blob or the keepalive fetch); a JSON end is not
  assert.equal(endedByPageHide({ headers: { "content-type": "text/plain;charset=UTF-8" } }, {}), true);
  assert.equal(endedByPageHide({ headers: { "content-type": "application/json" } }, {}), false);
  assert.equal(endedByPageHide({ headers: {} }, { reason: "pagehide" }), true);
});

test("late disclosure: the fixed safeguarding line carries both helplines in every language and address form", () => {
  for (const ctx of [{ lang: "english" }, { lang: "hinglish" }, { lang: "hindi" }, { lang: "hinglish", address: "aap" }]) {
    const line = L.safeguardLine(ctx);
    assert.match(line, /1098/, JSON.stringify(ctx));
    assert.match(line, /14416/, JSON.stringify(ctx));
  }
});

test("ui.hint: a hint move sends the rung's text at rungs 1-3 (never the assertion, never a key leak)", () => {
  let r = toPractice();
  const item = findItem(r.state, K, r.state.activeItemId);
  r = turn(r, cls("incorrect"));
  assert.equal(r.move.kind, "hint");
  // W1-A (flows G5): the fixture's rung 1 is a teacher note ("pump: ask what the parts means"): its rung label never
  // reaches the card, and a line that still reads as a note to the teacher is not shown at all.
  assert.equal(item.hints[0], "pump: ask what the parts means");
  assert.equal(r.ui.hint, undefined);
  assert.deepEqual(hintFor({ kind: "hint" }, { answer: "7", hints: ["Prompt: count the tens first"] }, 1), { level: 1, text: "count the tens first" });
  r = turn(r, cls("incorrect"));
  if (r.move.kind === "hint") assert.equal(r.ui.hint?.level, 2);
  const it = { answer: "24,360", acceptable: ["24360"], hints: ["Which place?", "It is 24,360 in all.", "24 thousands, ___ ones.", "24,360."] };
  assert.equal(hintFor({ kind: "hint" }, it, 2), null, "a rung that states the key is not shown");
  assert.equal(hintFor({ kind: "hint" }, it, 4), null, "rung 4 is the assertion");
  assert.equal(hintFor({ kind: "practice" }, it, 1), null);
  assert.deepEqual(hintFor({ kind: "hint" }, it, 3), { level: 3, text: "24 thousands, ___ ones." });
  // a turn that is not a hint carries none
  assert.equal(toPractice().ui.hint, undefined);
});

// The client half of a late disclosure: the outbox flushes an answer held for an earlier, page-hide-closed lesson at
// the next start; when the server answers it with the safeguarding line (TurnResponse.late + a safeguard move), the
// runtime raises lateSafeguard, which the Desk turns into the Help sheet (useDesk), though that lesson stays closed.
test("late disclosure (client): the cross-lesson flush raises lateSafeguard on a late safeguard response, and only then", async () => {
  const { MemoryOutboxStore, Outbox } = await import("../src/lesson/outbox.ts");
  const { LessonRuntime } = await import("../src/lesson/runtime.ts");
  const { ApiError } = await import("../src/lesson/api.ts");
  class QuietLink {
    constructor(levels) { this.mode = "text"; this.levels = levels; this.fns = new Set(); }
    on(fn) { this.fns.add(fn); return () => this.fns.delete(fn); }
    emit(e) { for (const f of [...this.fns]) f(e); }
    async connect() { this.emit({ type: "connection", state: "connected" }); }
    applyInstructions() {} sendChild() {} promptTeacher() {} interrupt() {} setPushToTalk() {} talkStart() {} talkEnd() {} close() {}
  }
  for (const [late, expect] of [[{ move: { kind: "safeguard", shape: "x" }, teacherReply: "… call Childline 1098 or Tele-MANAS 14416 …", teacherReplySeq: 9 }, true],
    [{ move: { kind: "probe", shape: "x" } }, false]]) {
    const store = new MemoryOutboxStore(true);
    const old = new Outbox({ store, schedule: [] });
    await old.send({ lessonId: "OLD", childText: "held", typed: true }, async () => { throw new ApiError(401, "not signed in", null); }).catch(() => {});
    const api = {
      start: async () => ({ lessonId: "NEW", topic: { id: "t", title: "T", chapter: "1" }, teacher: { id: "asha", name: "Asha", voice: "v" }, moduleCommands: [], ui: {} }),
      turn: async (r) => (r.lessonId === "OLD" ? { ...late, moduleCommands: [], ui: {}, end: true, late: true } : { move: { kind: "probe", shape: "x" }, moduleCommands: [], ui: {} }),
      end: async () => ({}), realtimeToken: async () => { throw new Error("no"); },
    };
    const rt = new LessonRuntime({ api, outboxStore: store, createLink: (_m, c) => new QuietLink(c.levels) });
    await rt.start("c1", "text");
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(!!rt.store.get().lateSafeguard, expect, JSON.stringify(late.move));
    rt.dispose();
  }
});
