// Release 13.1 (ms-r13-server-rows-lost-live): one row Postgres refuses never costs the chunk; characters jsonb refuses are
// replaced before an event is buffered; a connection failure still drops the chunk (no retry storm on a dead database).
import { test } from "node:test";
import assert from "node:assert/strict";
import { record, flushTrace, _setTraceDeps, _resetTrace, traceStats, scrubUnstorable, isDataError } from "../server/trace/writer.js";

const dataError = () => Object.assign(new Error('invalid input syntax for type json'), { code: "22P02" });

test("a data error on one row: the chunk is split, every other row is written, the refused row is dropped and counted", async () => {
  _resetTrace();
  const written = [];
  _setTraceDeps({ off: false, insert: async (rows) => { if (rows.some((r) => r.kind === "bad")) throw dataError(); written.push(...rows); return rows.length; } });
  try {
    for (let i = 0; i < 9; i++) record(i === 4 ? "bad" : "good", { i });
    await flushTrace();
    assert.equal(written.length, 8);
    assert.ok(written.every((r) => r.kind === "good"));
    const s = traceStats();
    assert.equal(s.dropped, 1); assert.equal(s.badRows, 1); assert.equal(s.written, 8);
  } finally { _setTraceDeps({ insert: null, off: null }); _resetTrace(); }
});

test("a connection error drops the chunk as before (no split, no retry storm)", async () => {
  _resetTrace();
  let calls = 0;
  _setTraceDeps({ off: false, insert: async () => { calls++; throw Object.assign(new Error("Connection terminated unexpectedly"), { code: "ECONNRESET" }); } });
  try {
    for (let i = 0; i < 9; i++) record("x", { i });
    await flushTrace();
    assert.equal(calls, 1);
    assert.equal(traceStats().dropped, 9); assert.equal(traceStats().badRows, 0);
  } finally { _setTraceDeps({ insert: null, off: null }); _resetTrace(); }
});

test("characters jsonb refuses are replaced before an event is buffered (a cut mid-emoji, a NUL)", async () => {
  assert.deepEqual(scrubUnstorable({ a: "x\u0000y", b: "ok \ud83d", c: ["\udc00z", "😊 whole"] }), { a: "x�y", b: "ok �", c: ["�z", "😊 whole"] });
  assert.equal(isDataError(dataError()), true);
  assert.equal(isDataError(Object.assign(new Error("trace insert timed out after 8000 ms"), {})), false);
  _resetTrace();
  const written = [];
  _setTraceDeps({ off: false, insert: async (rows) => { written.push(...rows); return rows.length; } });
  try {
    record("cut", { text: "Shabash 😊".slice(0, 9) }); // the slice leaves a lone high surrogate
    await flushTrace();
    assert.equal(written[0].data.text, "Shabash �");
  } finally { _setTraceDeps({ insert: null, off: null }); _resetTrace(); }
});
