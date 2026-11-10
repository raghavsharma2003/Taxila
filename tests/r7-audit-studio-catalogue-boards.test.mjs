// Audit studio-02 (2026-11-10): server/stagecraft/catalogue.js says an entry whose blind cross-check failed or never ran
// "is reported, never shown", and its game and explainer are withheld, but its whiteboard boards were still listed and
// served (board-first.js and board-sync.js read entry.boards). 13 topic files with a failed or missing check carried
// 102 boards. A record's boards are now shown only when its check passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { entryFromRecord, loadCatalogue } from "../server/stagecraft/catalogue.js";

// a real, passing record's boards (each one passes the strict shape and the stage lint)
const real = JSON.parse(readFileSync(new URL("../data/studio-catalogue/topics/c6-maths-ch05-t01.json", import.meta.url), "utf8"));
const rec = (verdict) => ({ ...real, check: verdict ? { ...real.check, verdict } : undefined });

test("a record whose cross-check failed or is missing lists no boards", () => {
  for (const v of ["fail", null]) {
    const e = entryFromRecord(rec(v));
    assert.equal(e.boards.length, 0, `check ${v}: ${e.boards.length} boards listed`);
    assert.equal(e.status.boardsTotal, real.whiteboard.beats.length);
  }
});

test("a passed record still lists its boards", () => {
  const e = entryFromRecord(rec("pass"));
  assert.ok(e.boards.length >= 1, "no board listed for a passed record");
});

test("in the shipped catalogue, no topic whose check did not pass serves a board", () => {
  const leaks = [...loadCatalogue({ fresh: true }).values()].filter((e) => e.status.check !== "pass" && e.boards.length).map((e) => e.topicId);
  assert.deepEqual(leaks, []);
});
