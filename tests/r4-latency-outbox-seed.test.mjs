// r4-latency: a new turn's turnSeq is CLAIMED: chosen and written with the record in one atomic store step
// (src/lesson/outbox.ts OutboxStore.claim). One store round trip before the turn's fetch, where there were three (each
// waited behind the page's frame work: 56-123 ms long tasks back to back with the puppet on). Two pages on one lesson
// never share a turnSeq: the server dedupes on (lessonId, turnSeq), so a shared one would replay the first turn's response
// to the second and its words would never be read (a disclosure among them). The real-IndexedDB, two-page version of the
// collision test is tests/r4-latency-outbox-tabs.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryOutboxStore, Outbox } from "../src/lesson/outbox.ts";

const req = (n, lessonId = "L1") => ({ lessonId, childText: `answer ${n}`, typed: true });
const netErr = () => new TypeError("Failed to fetch");

/** A memory store that logs every store call, and each put's completion ("put:<status>:done"). */
function countingStore() {
  const store = new MemoryOutboxStore(true);
  const calls = [];
  for (const k of ["list", "put", "delete", "claim"]) {
    const f = store[k].bind(store);
    store[k] = (...a) => {
      calls.push(k === "put" ? `put:${a[0].status}` : k);
      const p = f(...a);
      return k === "put" ? p.then((v) => (calls.push(`put:${a[0].status}:done`), v)) : p;
    };
  }
  return { store, calls };
}

test("before the fetch: ONE store step (the claim: turnSeq chosen and the answer written), nothing else", async () => {
  const { store, calls } = countingStore();
  const ob = new Outbox({ store, schedule: [] });
  const before = [];
  const seqs = [];
  for (const n of [1, 2, 3]) {
    calls.length = 0;
    await ob.send(req(n), async (r) => { before.push([...calls]); seqs.push(r.turnSeq); return {}; }, { onSeq: () => {} });
  }
  assert.deepEqual(before, [["claim", "put:inflight"], ["claim", "put:inflight"], ["claim", "put:inflight"]],
    "the inflight status write goes out WITH the request; it is not awaited before it");
  assert.deepEqual(seqs, [1, 2, 3]);
});

test("the claimed record is durable before the request, and carries its turnSeq on the wire", async () => {
  const store = new MemoryOutboxStore(true);
  const ob = new Outbox({ store, schedule: [] });
  let seen = null;
  let told = null;
  await ob.send(req(1), async (r) => { seen = { wire: r.turnSeq, held: (await store.list("L1")).map((x) => [x.turnSeq, x.req.turnSeq, x.req.childText]) }; return {}; }, { onSeq: (n) => { told = n; } });
  assert.deepEqual(seen, { wire: 1, held: [[1, 1, "answer 1"]] });
  assert.equal(told, 1);
  assert.deepEqual(await store.list("L1"), [], "acknowledged: gone");
});

test("the 'inflight' status write lands before the acknowledged record is deleted; a failed one is held as failed", async () => {
  const { store, calls } = countingStore();
  const ob = new Outbox({ store, schedule: [] });
  await ob.send(req(1), async () => ({}));
  const at = (c) => calls.indexOf(c);
  assert.ok(at("put:inflight:done") >= 0 && at("put:inflight:done") < at("delete"), calls.join(" "));
  assert.deepEqual(await store.list("L1"), []);
  await ob.send(req(2), async () => { throw netErr(); }).catch(() => {});
  assert.equal((await store.list("L1"))[0].status, "failed");
});

test("two pages on one lesson (two Outboxes, one store) never share a turnSeq, even after acknowledged records are deleted", async () => {
  const store = new MemoryOutboxStore(true);
  const a = new Outbox({ store, schedule: [] });
  const b = new Outbox({ store, schedule: [] });
  const wire = [];
  const post = async (r) => { wire.push(r.turnSeq); return {}; };
  // interleaved, each acknowledged (so its record is deleted before the other page's next turn)
  for (const n of [1, 2, 3, 4]) { await a.send(req(`a${n}`), post); await b.send(req(`b${n}`), post); }
  // and concurrent
  await Promise.all([a.send(req("a5"), post), b.send(req("b5"), post), a.send(req("a6"), post), b.send(req("b6"), post)]);
  assert.equal(new Set(wire).size, wire.length, `every turn has its own turnSeq: ${wire}`);
  // negative control: the old path (each page reserves from its own counter + the held records) collides once acks
  // have deleted the records
  const shared = new MemoryOutboxStore(true);
  const p1 = new Outbox({ store: shared, schedule: [] });
  const p2 = new Outbox({ store: shared, schedule: [] });
  const seqs = [];
  const t1 = await p1.reserve("L9");
  await p1.send(req(1, "L9"), async (r) => { seqs.push(r.turnSeq); return {}; }, { turnSeq: t1 });
  const t2 = await p2.reserve("L9");
  await p2.send(req(2, "L9"), async (r) => { seqs.push(r.turnSeq); return {}; }, { turnSeq: t2 });
  assert.deepEqual(seqs, [1, 1], "control: reserve() alone hands both pages turnSeq 1 (the collision the claim prevents)");
});

test("a reloaded page claims above the answers still held from the last one (never overwrites them)", async () => {
  const store = new MemoryOutboxStore(true);
  const a = new Outbox({ store, schedule: [] });
  await a.send(req(1), async () => { throw netErr(); }).catch(() => {});
  await a.send(req(2), async () => { throw netErr(); }).catch(() => {});
  const b = new Outbox({ store, schedule: [] }); // the page reloaded
  let seq = 0;
  await b.send(req(3), async (r) => { seq = r.turnSeq; return {}; });
  assert.equal(seq, 3);
  assert.deepEqual((await store.list("L1")).map((r) => r.req.childText), ["answer 1", "answer 2"], "the held answers are intact");
  // and above an acknowledged turn's seq too (the high-water mark survives the delete)
  await b.send(req(4), async (r) => { seq = r.turnSeq; return {}; });
  const c = new Outbox({ store, schedule: [] });
  await c.send(req(5), async (r) => { seq = r.turnSeq; return {}; });
  assert.equal(seq, 5);
});
