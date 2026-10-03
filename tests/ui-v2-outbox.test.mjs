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
