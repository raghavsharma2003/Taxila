// r7 Voice: no voice/duplex test bars its speed against the wall clock (main 2026-11-09). Under CI's four-files-at-once
// runner a wall-clock bound measures the scheduler: voice-cascade "lone 'hmm'" and voice-expressive-plan's 3 ms budget both
// failed on PRs that touched no voice code. Speed bars time CPU (cpuNow, tests/_cpu-ms.mjs); a test about NOT WAITING on
// something asserts the event (a dependency that never answers, a trace that never fires), never "< N ms".
// Lower bounds stay allowed (load can only lengthen a wait: "held >= 680 ms"); this guard flags upper bounds only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

/** The voice / duplex stream's test files. */
export const VOICE_TESTS = /^(voice-|r7-voice-|duplex-|d5-|r4-latency-|r5-latency|r5-duplex|p3-voicesig|round3-voicesig|voicesig|r12-trace)/;
const WALL = String.raw`(?:performance\.now\(\)|Date\.now\(\))`;

/** Upper-bound wall-clock bars in one file's text: [line, text][] */
export function wallClockBars(src) {
  const out = [];
  const lines = src.split("\n");
  // (1) inline: assert…(performance.now() - t0) < N
  const inline = new RegExp(String.raw`assert[^\n]*${WALL}\s*-\s*\w+\)?\s*(?:\/\s*[\d.]+\s*)?<=?\s*[\d.]`);
  // (2) via a variable: const ms = performance.now() - t0; … assert.ok(ms < N)
  const names = new Set();
  const assign = new RegExp(String.raw`(?:const|let)\s+(\w+)\s*=\s*\(?${WALL}\s*-\s*\w+`);
  // (3) samples pushed into an array, then a percentile asserted: t.push(performance.now() - t0); … assert.ok(t[k] <= 3)
  const push = new RegExp(String.raw`(\w+)\.push\(\s*\(?${WALL}\s*-\s*\w+`);
  lines.forEach((l) => { const m = assign.exec(l) ?? push.exec(l); if (m) names.add(m[1]); });
  lines.forEach((l, i) => {
    if (inline.test(l)) out.push([i + 1, l.trim()]);
    for (const n of names) if (new RegExp(String.raw`assert[^\n]*\b${n}\b[^\n]*<=?\s*[\d.]`).test(l) && !/>=?/.test(l.split(n)[1]?.split(/[,)]/)[0] ?? "")) out.push([i + 1, l.trim()]);
  });
  return out;
}

test("no voice/duplex test bars its speed against the wall clock (upper bounds use cpuNow or an event)", () => {
  const dir = new URL("./", import.meta.url);
  const offenders = readdirSync(dir).filter((f) => VOICE_TESTS.test(f) && /\.(test|run)\.mjs$/.test(f) && f !== "r7-voice-cpu-timing.test.mjs")
    .flatMap((f) => wallClockBars(readFileSync(new URL(f, dir), "utf8")).map(([n, l]) => `${f}:${n}: ${l}`));
  assert.deepEqual(offenders, [], "use cpuNow() from ./_cpu-ms.mjs for speed bars, or assert the event for 'did not wait'");
});

test("the guard itself catches both shapes and leaves CPU bars and lower bounds alone", () => {
  assert.equal(wallClockBars("assert.ok(performance.now() - t0 < 200, 'x');").length, 1);
  assert.equal(wallClockBars("assert.ok((performance.now() - t0) / 500 < 1);").length, 1);
  assert.equal(wallClockBars("const ms = Date.now() - t0;\nassert.ok(ms < 150);").length, 1);
  assert.equal(wallClockBars("const ms = cpuNow() - t0;\nassert.ok(ms < 150);").length, 0);
  assert.equal(wallClockBars("const held = Date.now() - t;\nassert.ok(held >= 680);").length, 0);
  assert.equal(wallClockBars("t.push(performance.now() - t0);\nassert.ok(t[Math.floor(t.length * 0.95)] <= 3);").length, 1);
  assert.equal(wallClockBars("t.push(cpuNow() - t0);\nassert.ok(t[Math.floor(t.length * 0.95)] <= 3);").length, 0);
});
