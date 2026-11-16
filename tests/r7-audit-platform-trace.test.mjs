// Whole-project audit 2026-11-09, platform: the flight recorder (PLAT-30, 31, 32, 33, 43, 44).
import { test } from "node:test";
import assert from "node:assert/strict";
import { TRACE_PID_HEADER } from "../shared/trace.ts";

test("PLAT-30: the client already stamps server time, so the server stores t as sent (skew applied once)", async () => {
  const { clientRow } = await import("../server/trace/routes.js");
  const t = 1_700_000_000_000;
  const r = clientRow({ kind: "ui.tap", t, sid: "page-123456" }, { pid: "page-123456", skewMs: 300_000 });
  assert.equal(r.t, t);
});

test("PLAT-32: a string cut mid-emoji is stored with a replacement character, not refused by jsonb", async () => {
  const { clientRow } = await import("../server/trace/routes.js");
  const r = clientRow({ kind: "ui.tap", t: 1, sid: "page-123456", data: { label: "a\ud83d", list: ["\udc4d"] } }, { pid: "page-123456" });
  assert.equal(r.data.label, "a�");
  assert.equal(r.data.list[0], "�");
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(r)));
});

test("PLAT-31: two model-call blobs in the same 10 ms get different names, inside the 12 characters the path keeps", async () => {
  const { blobSeqOf } = await import("../server/trace/model.js");
  const { traceBlobPath } = await import("../server/trace/blob.js");
  const now = Date.UTC(2026, 10, 10, 23, 59, 59, 997);
  const a = blobSeqOf(now, 1, 5), b = blobSeqOf(now + 3, 2, 5), c = blobSeqOf(now, 2, 5), d = blobSeqOf(now, 1, 6);
  for (const s of [a, b, c, d]) assert.equal(s.length, 12, s);
  assert.equal(new Set([a, b, c, d]).size, 4);
  const p = (seq) => traceBlobPath({ sid: "s", src: "server", seq, ext: "json", t: now });
  assert.notEqual(p(a), p(c), "the same millisecond, a different counter");
});

test("PLAT-43: batches are cut by UTF-8 bytes (Hindi text is 3 bytes a character)", async () => {
  const { chunks, byteLen } = await import("../src/trace/bus.ts");
  assert.equal(byteLen("कक"), 6);
  const ev = (i) => ({ v: 1, sid: "s", pid: "p", src: "client", seq: i, t: 1, kind: "net.res", tier: 1, data: { body: "क".repeat(3000) } });
  const parts = chunks(Array.from({ length: 30 }, (_, i) => ev(i)), 60_000);
  for (const part of parts) assert.ok(byteLen(JSON.stringify(part)) < 60_000, `${byteLen(JSON.stringify(part))} bytes`);
  assert.equal(parts.flat().length, 30);
});

test("PLAT-33 and PLAT-44: /api calls carry the page-load id; leaving a lesson returns the session to it", async () => {
  globalThis.location = { href: "http://app.test/c/x", origin: "http://app.test", pathname: "/c/x", search: "" };
  const bus = await import("../src/trace/bus.ts");
  const { wrapFetch } = await import("../src/trace/net.ts");
  const { followLesson } = await import("../src/trace/lesson.ts");
  const calls = [];
  const f = wrapFetch(async (input, init) => { calls.push(init); return new Response("{}", { headers: { "content-type": "application/json" } }); });
  globalThis.location = { href: "http://app.test/c/x", origin: "http://app.test", pathname: "/c/x", search: "" };
  await f("/api/child/boot");
  assert.equal(new Headers(calls[0].headers).get(TRACE_PID_HEADER), bus.pid());
  const cleanup = followLesson("lesson-abc");
  assert.equal(bus.sid(), "lesson-abc");
  cleanup();
  assert.equal(bus.sid(), bus.pid());
  assert.equal(followLesson(null), undefined);
});
