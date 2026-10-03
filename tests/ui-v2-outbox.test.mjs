// B1-A3 (PRODUCT-DESIGN-V2 §4.7): write before send; retries at 1/3/6 s; ordered flush; removal only on ack;
// the memory fallback. A fake clock drives the retries; the negative control (no outbox write) loses the answer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryOutboxStore, Outbox, OutboxHeld, RETRY_SCHEDULE_MS, isRetryable, openOutboxStore } from "../src/lesson/outbox.ts";

function fakeTimers() {
  const q = [];
  let now = 0;
  return {
    now: () => now,
    timers: { setTimeout: (fn, ms) => { q.push({ at: now + ms, fn }); return q.at(-1); }, clearTimeout: (h) => { const i = q.indexOf(h); if (i >= 0) q.splice(i, 1); } },
    async advance(ms) {
      const until = now + ms;
      for (;;) {
        await new Promise((r) => setImmediate(r));
        q.sort((a, b) => a.at - b.at);
        if (!q.length || q[0].at > until) break;
        const t = q.shift();
        now = t.at;
        t.fn();
      }
      now = until;
      await new Promise((r) => setImmediate(r));
    },
  };
}
const req = (n) => ({ lessonId: "L1", childText: `answer ${n}`, typed: true });
const netErr = () => new TypeError("Failed to fetch");

test("outbox: the record is written BEFORE the request is sent, and removed only on the server's ack", async () => {
  const store = new MemoryOutboxStore(true);
  const ob = new Outbox({ store, timers: fakeTimers().timers });
  let seenAtSend = null;
  const res = await ob.send(req(1), async (r) => { seenAtSend = (await store.list("L1")).length; return { ok: r.childText }; });
  assert.equal(seenAtSend, 1, "written before send");
  assert.deepEqual(res, { ok: "answer 1" });
  assert.equal((await store.list("L1")).length, 0, "removed on ack");
});

test("outbox: retries at 1 s, 3 s and 6 s (network errors), then held with status failed", async () => {
  const ft = fakeTimers();
  const store = new MemoryOutboxStore(true);
  const ob = new Outbox({ store, timers: ft.timers, now: ft.now });
  const attempts = [];
  const p = ob.send(req(1), async (r) => { attempts.push({ at: ft.now(), retried: !!r.retried }); throw netErr(); });
  let err = null;
  p.catch((e) => (err = e));
  await ft.advance(20_000);
  assert.deepEqual(attempts.map((a) => a.at), [0, 1000, 4000, 10000], "1 s, then 3 s, then 6 s after the previous attempt");
  assert.deepEqual(RETRY_SCHEDULE_MS, [1000, 3000, 6000]);
  assert.deepEqual(attempts.map((a) => a.retried), [false, true, true, true], "resends carry retried");
  assert.ok(err instanceof OutboxHeld && err.retryable);
  const held = await store.list("L1");
  assert.equal(held.length, 1);
  assert.equal(held[0].status, "failed");
});

test("outbox: a 500 or 409 is NOT retried automatically (it may already be written); 502/503/504 are", async () => {
  assert.equal(isRetryable({ status: 500 }), false);
  assert.equal(isRetryable({ status: 409 }), false);
  for (const s of [502, 503, 504, 429, 408, 0]) assert.equal(isRetryable({ status: s }), true, String(s));
  assert.equal(isRetryable(netErr()), true);
  const ob = new Outbox({ store: new MemoryOutboxStore(true), timers: fakeTimers().timers });
  let n = 0;
  await assert.rejects(ob.send(req(1), async () => { n++; throw Object.assign(new Error("boom"), { status: 500 }); }), OutboxHeld);
  assert.equal(n, 1);
});

test("outbox: ordered flush on reconnect; 0 answers lost; the negative control (send without the outbox) loses them", async () => {
  const ft = fakeTimers();
  const store = new MemoryOutboxStore(true);
  const ob = new Outbox({ store, timers: ft.timers, now: ft.now, schedule: [] });
  let online = false;
  const server = [];
  const send = async (r) => { if (!online) throw netErr(); server.push(r.childText); return {}; };
  for (let i = 1; i <= 3; i++) await ob.send(req(i), send).catch(() => {});
  assert.equal((await ob.pending("L1")).length, 3);
  online = true;
  for (const rec of await ob.pending("L1")) await ob.resend(rec.key, "L1", send);
  assert.deepEqual(server, ["answer 1", "answer 2", "answer 3"], "flushed in order");
  assert.equal((await ob.pending("L1")).length, 0);
  // negative control: no outbox → the three offline answers are simply gone
  const lost = [];
  online = false;
  for (let i = 1; i <= 3; i++) await send(req(i)).catch(() => lost.push(i));
  online = true;
  assert.equal(lost.length, 3);
});

test("outbox: the memory fallback when IndexedDB is unavailable says so (durable: false)", async () => {
  const s = await openOutboxStore(); // Node has no indexedDB
  assert.equal(s.durable, false);
  const ob = new Outbox({ store: s, timers: fakeTimers().timers });
  await ob.send(req(1), async () => ({}));
  assert.equal(ob.durable, false);
});

// ───────────── fixer pass (review 2026-10-03): seq seeding, turnSeq always, deadline, kick, edit, cross-lesson ─────────────

test("outbox: EVERY attempt carries turnSeq (the first too), so the server can dedupe a retry against it", async () => {
  const ft = fakeTimers();
  const ob = new Outbox({ store: new MemoryOutboxStore(true), timers: ft.timers, now: ft.now });
  const seen = [];
  let n = 0;
  const p = ob.send(req(1), async (r) => { seen.push({ seq: r.turnSeq, retried: !!r.retried }); if (++n < 2) throw netErr(); return {}; });
  await ft.advance(2000);
  await p;
  assert.deepEqual(seen, [{ seq: 1, retried: false }, { seq: 1, retried: true }]);
});

test("outbox: a reloaded page (a new Outbox over the same store) never reuses a held record's turnSeq", async () => {
  const store = new MemoryOutboxStore(true);
  const a = new Outbox({ store, timers: fakeTimers().timers, schedule: [] });
  await a.send(req(1), async () => { throw netErr(); }).catch(() => {});
  await a.send(req(2), async () => { throw netErr(); }).catch(() => {});
  const b = new Outbox({ store, timers: fakeTimers().timers, schedule: [] }); // the page reloaded
  const seq = await b.reserve("L1");
  assert.equal(seq, 3, "seeded from max(turnSeq) in the store");
  await b.send(req(3), async () => ({}), { turnSeq: seq });
  assert.deepEqual((await store.list("L1")).map((r) => r.req.childText), ["answer 1", "answer 2"], "the held answers were not overwritten");
  // negative control: an unseeded counter (turnSeq 1 again, the old bug) overwrites the held "answer 1"
  await b.send(req(9), async () => { throw netErr(); }, { turnSeq: 1 }).catch(() => {});
  assert.equal((await store.list("L1")).find((r) => r.turnSeq === 1).req.childText, "answer 9", "the control loses answer 1");
});

test("outbox: an attempt that hangs past its deadline is aborted and retried (marked retried), never stuck", async () => {
  const ft = fakeTimers();
  const ob = new Outbox({ store: new MemoryOutboxStore(true), timers: ft.timers, now: ft.now, deadlineMs: 5000 });
  const attempts = [];
  const p = ob.send(req(1), (r, signal) => {
    attempts.push({ at: ft.now(), retried: !!r.retried, signal });
    return attempts.length === 1 ? new Promise(() => {}) : Promise.resolve({ ok: true }); // the first never answers
  });
  await ft.advance(7000);
  assert.deepEqual(await p, { ok: true });
  assert.deepEqual(attempts.map((a) => [a.at, a.retried]), [[0, false], [6000, true]], "aborted at 5 s, retried 1 s later");
  assert.equal(attempts[0].signal.aborted, true, "the hung request's signal was aborted");
});

test("outbox: kick() ('Try again' on T1) abandons the attempt in flight and resends at once, same turnSeq", async () => {
  const ft = fakeTimers();
  const ob = new Outbox({ store: new MemoryOutboxStore(true), timers: ft.timers, now: ft.now });
  const attempts = [];
  const p = ob.send(req(1), (r) => {
    attempts.push({ at: ft.now(), seq: r.turnSeq, retried: !!r.retried });
    return attempts.length === 1 ? new Promise(() => {}) : Promise.resolve({});
  });
  await ft.advance(8000);
  assert.equal(ob.kick(), true);
  await ft.advance(0);
  await p;
  assert.deepEqual(attempts, [{ at: 0, seq: 1, retried: false }, { at: 8000, seq: 1, retried: true }]);
  assert.equal(ob.kick(), false, "nothing in flight any more");
});

test("outbox: edit() ('Fix') re-sends the turn in flight with the corrected words under the same turnSeq, marked edited", async () => {
  const ft = fakeTimers();
  const store = new MemoryOutboxStore(true);
  const ob = new Outbox({ store, timers: ft.timers, now: ft.now });
  const wire = [];
  const p = ob.send(req(1), (r) => {
    wire.push({ text: r.childText, seq: r.turnSeq, edited: !!r.edited });
    return wire.length === 1 ? new Promise(() => {}) : Promise.resolve({});
  });
  await ft.advance(500);
  assert.equal(await ob.edit("fifty six"), true);
  await ft.advance(0);
  await p;
  assert.deepEqual(wire, [{ text: "answer 1", seq: 1, edited: false }, { text: "fifty six", seq: 1, edited: true }]);
  assert.equal((await store.list("L1")).length, 0, "one answer, acknowledged once: not two");
});

test("outbox: lessons() lists the OTHER lessons that still hold answers (the cross-lesson flush)", async () => {
  const store = new MemoryOutboxStore(true);
  const ob = new Outbox({ store, timers: fakeTimers().timers, schedule: [] });
  await ob.send({ ...req(1), lessonId: "OLD" }, async () => { throw netErr(); }).catch(() => {});
  await ob.send(req(2), async () => { throw netErr(); }).catch(() => {});
  assert.deepEqual(await ob.lessons("L1"), ["OLD"]);
  await ob.dropLesson("OLD");
  assert.deepEqual(await ob.lessons("L1"), []);
});

// The runtime: answers held for an earlier lesson (T8 expired session → sign-in → a new lesson; a reload) are sent
// when the next lesson starts, marked retried, and that lesson is then closed. A 409 "lesson has ended" drops them.
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { ApiError } from "../src/lesson/api.ts";

class QuietLink {
  constructor(levels) { this.mode = "text"; this.levels = levels; this.fns = new Set(); }
  on(fn) { this.fns.add(fn); return () => this.fns.delete(fn); }
  emit(e) { for (const f of [...this.fns]) f(e); }
  async connect() { this.emit({ type: "connection", state: "connected" }); }
  applyInstructions() {}
  sendChild(text) { this.emit({ type: "child_final", text, startedAt: Date.now(), typed: true }); }
  promptTeacher() {}
  interrupt() {}
  setPushToTalk() {}
  talkStart() {}
  talkEnd() {}
  close() {}
}
function api(turn) {
  const calls = { turn: [], end: [] };
  return {
    calls,
    start: async () => ({ lessonId: "NEW", topic: { id: "t", title: "T", chapter: "1" }, teacher: { id: "asha", name: "Asha", voice: "v" }, moduleCommands: [], ui: {} }),
    turn: async (r) => { calls.turn.push(r); return turn ? turn(r) : { move: { kind: "probe", shape: "x" }, moduleCommands: [], ui: {} }; },
    end: async (id) => { calls.end.push(id); return {}; },
    realtimeToken: async () => { throw new Error("no"); },
  };
}
const settle = () => new Promise((r) => setTimeout(r, 20));

test("runtime: answers held for an EARLIER lesson are sent at the next start (retried, same turnSeq), then that lesson is closed", async () => {
  const store = new MemoryOutboxStore(true);
  const old = new Outbox({ store, timers: fakeTimers().timers, schedule: [] });
  await old.send({ lessonId: "OLD", childText: "held while signed out", typed: true }, async () => { throw new ApiError(401, "not signed in", null); }).catch(() => {});
  const a = api();
  const rt = new LessonRuntime({ api: a, outboxStore: store, createLink: (_m, c) => new QuietLink(c.levels) });
  await rt.start("c1", "text");
  await settle();
  const sent = a.calls.turn.find((r) => r.lessonId === "OLD");
  assert.ok(sent, "the earlier lesson's answer reached the server");
  assert.equal(sent.childText, "held while signed out");
  assert.equal(sent.turnSeq, 1);
  assert.equal(sent.retried, true);
  assert.deepEqual(a.calls.end, ["OLD"], "the abandoned lesson is closed once its answers landed");
  assert.equal((await store.list("OLD")).length, 0);
  rt.dispose();
});

test("runtime: a 409 'lesson has ended' on the cross-lesson flush drops that lesson's records (it can never take them)", async () => {
  const store = new MemoryOutboxStore(true);
  const old = new Outbox({ store, timers: fakeTimers().timers, schedule: [] });
  await old.send({ lessonId: "OLD", childText: "x", typed: true }, async () => { throw netErr(); }).catch(() => {});
  const a = api((r) => { if (r.lessonId === "OLD") throw new ApiError(409, "this lesson has ended", null); return { move: { kind: "probe", shape: "x" }, moduleCommands: [], ui: {} }; });
  const rt = new LessonRuntime({ api: a, outboxStore: store, createLink: (_m, c) => new QuietLink(c.levels) });
  await rt.start("c1", "text");
  await settle();
  assert.equal((await store.all()).length, 0);
  assert.deepEqual(a.calls.end, []);
  rt.dispose();
});

test("runtime: a held child turn settles the wait on every lane (after pendingTurns drops), so the floor is not stuck in thinking", async () => {
  const a = api(() => { throw new ApiError(500, "boom", null); });
  const rt = new LessonRuntime({ api: a, outboxStore: new MemoryOutboxStore(true), createLink: (_m, c) => new QuietLink(c.levels) });
  const signals = [];
  rt.events.on((e) => signals.push({ type: e.type, pending: rt.state.pendingTurns }));
  await rt.start("c1", "text");
  rt.say("one half");
  await settle();
  const s = signals.filter((x) => x.type === "settle").at(-1);
  assert.ok(s, "a settle was emitted");
  assert.equal(s.pending, 0, "…after the call stopped counting as in flight (the floor ignores a settle while one is)");
  assert.equal(rt.state.failure?.kind, "send");
  rt.dispose();
});
