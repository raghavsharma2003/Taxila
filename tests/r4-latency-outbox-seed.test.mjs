// r4-latency: the outbox reads its store once per lesson per page (the turnSeq seed), not before every turn. Each
// IndexedDB round trip before the turn's fetch waits behind the page's frame work (with the puppet face on, 56-123 ms
// long tasks back to back, measured in tests/prod/r4-timeline). The write still comes before the send; a reloaded page
// still never reuses a held record's turnSeq (tests/ui-v2-outbox.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryOutboxStore, Outbox } from "../src/lesson/outbox.ts";

const req = (n) => ({ lessonId: "L1", childText: `answer ${n}`, typed: true });
const netErr = () => new TypeError("Failed to fetch");

/** A memory store that logs every store call, and each put's completion ("put:done"). */
function countingStore() {
  const store = new MemoryOutboxStore(true);
  const calls = [];
  for (const k of ["list", "put", "delete"]) {
    const f = store[k].bind(store);
    store[k] = (...a) => {
      calls.push(k === "put" ? `put:${a[0].status}` : k);
      const p = f(...a);
      return k === "put" ? p.then((v) => (calls.push(`put:${a[0].status}:done`), v)) : p;
    };
  }
  return { store, calls };
}

test("before the fetch: the seed read (first turn of a lesson only) and the durable 'queued' write, nothing else", async () => {
  const { store, calls } = countingStore();
  const ob = new Outbox({ store, schedule: [] });
  const before = [];
  for (const n of [1, 2, 3]) {
    calls.length = 0;
    const seq = await ob.reserve("L1");
    await ob.send(req(n), async (r) => { before.push(calls.filter((c) => c === "list" || c === "put:queued:done")); return { seq: r.turnSeq }; }, { turnSeq: seq });
  }
  assert.deepEqual(before, [["list", "put:queued:done"], ["put:queued:done"], ["put:queued:done"]], "one seed read; the answer is written before every send");
});

test("the 'inflight' status write goes out with the request and lands before the acknowledged record is deleted", async () => {
  const { store, calls } = countingStore();
  const ob = new Outbox({ store, schedule: [] });
  await ob.send(req(1), async () => ({}));
  const at = (c) => calls.indexOf(c);
  assert.ok(at("put:inflight:done") >= 0 && at("put:inflight:done") < at("delete"), calls.join(" "));
  assert.deepEqual(await store.list("L1"), [], "an acknowledged turn is gone");
  // and a failed attempt's status writes stay in order: the record is held as failed, not inflight
  await ob.send(req(2), async () => { throw netErr(); }).catch(() => {});
  assert.equal((await store.list("L1"))[0].status, "failed");
});

test("a page that seeded from held records keeps counting above them without reading again", async () => {
  const { store, calls } = countingStore();
  const a = new Outbox({ store, schedule: [] });
  await a.send(req(1), async () => { throw netErr(); }).catch(() => {});
  await a.send(req(2), async () => { throw netErr(); }).catch(() => {});
  const b = new Outbox({ store, schedule: [] }); // the page reloaded
  assert.equal(await b.reserve("L1"), 3);
  calls.length = 0;
  assert.equal(await b.reserve("L1"), 4);
  assert.deepEqual(calls, [], "no store read after the seed");
  assert.equal(await b.reserve("L2"), 1, "another lesson seeds on its own");
});

test("a seed read that failed is tried again on the next turn (never skipped on a broken read)", async () => {
  const { store } = countingStore();
  await store.put({ key: "L1:5", lessonId: "L1", turnSeq: 5, req: req(5), at: 0, attempts: 0, status: "failed" });
  const real = store.list.bind(store);
  let fail = true;
  store.list = (id) => (fail ? Promise.reject(new Error("blocked")) : real(id));
  const ob = new Outbox({ store, schedule: [] });
  assert.equal(await ob.reserve("L1"), 1);
  fail = false;
  assert.equal(await ob.reserve("L1"), 6, "seeded once the store answers: above the held turnSeq 5");
});
