// round 5 (14.3, stream 3's overflow prod query): the model.call row carries the ACCOUNT lane when it is not CHAT, so a
// call the 429 overflow moved reads endpoint = 'OVERFLOW' directly (its `lane` is the quota lane, "hot" either way).
import { test } from "node:test";
import assert from "node:assert/strict";
import { flushTrace, _setTraceDeps, _resetTrace } from "../server/trace/writer.js";
import { runTrace } from "../server/trace/context.js";
import { recordModelCall } from "../server/trace/model.js";

test("an overflowed call records endpoint OVERFLOW; a CHAT call records no endpoint; lane stays the quota lane", async () => {
  const rows = [];
  _resetTrace();
  _setTraceDeps({ insert: async (r) => { rows.push(...r); return r.length; }, off: false });
  try {
    await runTrace({ rid: "rid-ovf", sid: "44444444-4444-4444-8444-444444444444", tier: 1 }, async () => {
      recordModelCall({ kind: "chat", deployment: "taxila-fast", lane: "OVERFLOW", quotaLane: "hot", status: 200, ms: 900 });
      recordModelCall({ kind: "chat", deployment: "taxila-fast", lane: "CHAT", quotaLane: "hot", status: 429, ms: 120 });
    });
    await flushTrace();
  } finally { _setTraceDeps({ insert: null, off: null }); _resetTrace(); }
  const calls = rows.filter((r) => r.kind === "model.call").map((r) => r.data ?? r);
  assert.equal(calls.length, 2);
  const moved = calls.find((d) => d.status === 200), first = calls.find((d) => d.status === 429);
  assert.equal(moved.endpoint, "OVERFLOW");
  assert.equal(moved.lane, "hot");
  assert.equal(first.endpoint, undefined);
});
