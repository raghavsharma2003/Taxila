// Release 13 integration (T-server's trace.mjs + T-client's beacon rebuild): --replay gathers the chunk a page sent by beacon
// at pagehide (no blob ref: the blob route stored it at traceBlobPath on the day it ARRIVED, which can be the next day),
// alongside the chunks that carry a ref; a chunk that never reached the store is reported missing, never fatal.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gatherReplay } from "../scripts/trace.mjs";

test("--replay gathers a beacon chunk by its rebuilt path (that day or the next) beside the chunks with a ref", async () => {
  const PID = "p-load-1";
  const rows = [
    { sid: PID, t: "2026-10-11T23:59:50Z", seq: 1, data: { seq: 1, blob: { ref: "2026-10-11/p-load-1/client-1.json" } } },
    { sid: PID, t: "2026-10-11T23:59:59Z", seq: 2, data: { seq: 2, beacon: true } }, // arrived after midnight
    { sid: PID, t: "2026-10-11T23:59:59Z", seq: 3, data: { seq: 3, beacon: true } }, // never stored
  ];
  const blobs = {
    "2026-10-11/p-load-1/client-1.json": JSON.stringify([{ type: 4, timestamp: 1, data: { href: "https://taxila.dev/c/x/lesson/new" } }]),
    "2026-10-12/p-load-1/client-2.json": JSON.stringify([{ type: 3, timestamp: 2 }]),
  };
  const q = async (sql) => (/rrweb\.chunk/.test(sql) ? rows : []);
  const get = async (ref) => { if (!(ref in blobs)) throw new Error(`404 ${ref}`); return Buffer.from(blobs[ref]); };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "r13-replay-"));
  try {
    const g = await gatherReplay(q, PID, dir, get);
    assert.equal(g.chunks, 3);
    assert.equal(g.files.length, 2, "the ref chunk and the next-day beacon chunk");
    assert.deepEqual(g.missing.map((m) => m.ref), ["2026-10-11/p-load-1/client-3.json"]);
    assert.equal(g.href, "https://taxila.dev/c/x/lesson/new");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
