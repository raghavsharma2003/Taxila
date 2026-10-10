// Round 4 stream 5 (open-r4lat-puppet-delays-turn-post): TURN FIRST. When the child's turn is sent, the puppet stage
// draws nothing for TURN_HOLD_MS, so the outbox's IndexedDB steps and the turn POST are never queued behind a frame
// (a 50-170 ms main-thread task on a software-GL page). Measured on the r4-timeline driver, tap-to-talk, n = 12 per arm:
// final -> POST p50 322 / p90 538 ms before, 17 / 23 after, 11 / 14 with the puppet off (RESULTS.md).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("stage: the turn hold is short, never while she speaks, and its gap is not a stall", () => {
  const stage = read("src/face-puppet/stage.ts");
  const hold = Number(stage.match(/export const TURN_HOLD_MS = (\d+);/)?.[1]);
  assert.ok(hold >= 150 && hold <= 400, `TURN_HOLD_MS ${hold}: long enough for the outbox + fetch, short enough to be unseen`);
  const stall = Number(stage.match(/export const STALL_MS = (\d+);/)?.[1]);
  assert.ok(hold > stall, "the hold is longer than a stall, so its gap must be exempt (below)");
  assert.match(stage, /export const TURN_EVENTS = \["taxila:play-heard", "taxila:turn-sending"\] as const;/);
  assert.match(stage, /for \(const t of TURN_EVENTS\) window\.addEventListener\(t, onTurn\);/);
  assert.match(stage, /for \(const t of TURN_EVENTS\) window\.removeEventListener\(t, onTurn\);/, "removed on dispose");
  assert.match(stage, /holdForTurn\(now = performance\.now\(\)\): void \{\s*if \(this\.status === "speaking"\) return;/, "her mouth never freezes mid-sentence");
  assert.match(stage, /if \(!force && now < this\.holdUntil && this\.status !== "speaking"\) return;/);
  assert.match(stage, /if \(this\.holdUntil\) \{ this\.holdUntil = 0; this\.lastNow = 0; \} \/\/ a held gap is not a stall/);
});

test("runtime: the page event the hold rides on fires on child_final BEFORE the turn is queued", () => {
  // the face may not edit the lesson runtime: this pins the coupling, so a change there fails here, not silently in a lesson
  const rt = read("src/lesson/runtime.ts");
  const fin = rt.indexOf('case "child_final": {');
  assert.ok(fin > 0);
  const block = rt.slice(fin, rt.indexOf("return;\n      }", fin));
  const ev = block.indexOf('new CustomEvent("taxila:play-heard"');
  const q = block.indexOf("this.queueTurn(");
  assert.ok(ev > 0 && q > 0 && ev < q, "taxila:play-heard is dispatched synchronously before queueTurn");
  // patch request 08 (docs/design/round4/build/asha/patches/) adds taxila:turn-sending inside queueTurn; either is enough
});
