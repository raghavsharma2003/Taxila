// Round 7, stream G (platform-gate-speed): the shard planner must cover every suite exactly once, deterministically.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { GROUPS, groupOf, parseShard, planShards, tapFileDurations } from "../scripts/test-shard-core.mjs";

const DIR = new URL("./", import.meta.url).pathname;

test("planShards: every file in exactly one shard, for any n; same input → same partition", () => {
  const files = Array.from({ length: 37 }, (_, k) => `f${String(k).padStart(2, "0")}.test.mjs`);
  const weights = Object.fromEntries(files.map((f, k) => [f, (k * 7919) % 97]));
  for (const n of [1, 2, 3, 4, 6, 50]) {
    const shards = planShards(files, weights, n);
    assert.equal(shards.length, n);
    assert.deepEqual(shards.flat().sort(), files);
    assert.deepEqual(planShards([...files].reverse(), weights, n), shards, "order of input does not matter");
  }
});

test("planShards: longest first balances the load (max shard ≤ ideal + the longest file)", () => {
  const weights = { a: 100, b: 60, c: 50, d: 40, e: 30, f: 20, g: 10, h: 5 };
  const shards = planShards(Object.keys(weights), weights, 3);
  const loads = shards.map((s) => s.reduce((x, f) => x + weights[f], 0));
  const total = Object.values(weights).reduce((x, y) => x + y, 0);
  assert.ok(Math.max(...loads) <= total / 3 + 100, String(loads));
  assert.ok(shards.some((s) => s.includes("a") && s.length <= 3), "the longest file is not piled on");
});

test("planShards: unmeasured files weigh the median; no weights at all → an even split by count", () => {
  const even = planShards(["a", "b", "c", "d", "e", "f"], {}, 3);
  assert.deepEqual(even.map((s) => s.length), [2, 2, 2]);
  const mixed = planShards(["big", "w", "x", "y", "z"], { big: 100, w: 1, x: 1 }, 2);   // y, z weigh the median, 1
  assert.deepEqual(mixed.find((s) => s.includes("big")), ["big"]);
});

test("parseShard: i/N with 1 ≤ i ≤ N only", () => {
  assert.deepEqual(parseShard("2/4"), { i: 2, n: 4 });
  for (const bad of ["0/4", "5/4", "2", "a/b", "", undefined]) assert.throws(() => parseShard(bad), /expected i\/N/);
});

test("groupOf: browser beats db; -db suites and test-url readers are db; the rest unit", () => {
  assert.equal(groupOf("x.test.mjs", 'const { chromium } = await import("playwright");'), "browser");
  assert.equal(groupOf("x-db.test.mjs", "chromium.launch()"), "browser");
  assert.equal(groupOf("x-db.test.mjs", ""), "db");
  assert.equal(groupOf("x.test.mjs", "process.env.CONDUCTOR_TEST_DATABASE_URL"), "db");
  assert.equal(groupOf("x.test.mjs", "assert.equal(1, 1)"), "unit");
});

test("the real suites: the three groups partition tests/*.test.mjs, and every group shards without loss", () => {
  const files = readdirSync(DIR).filter((n) => n.endsWith(".test.mjs")).sort();
  const by = Object.fromEntries(GROUPS.map((g) => [g, []]));
  for (const f of files) by[groupOf(f, readFileSync(DIR + f, "utf8"))].push(f);
  assert.deepEqual(Object.values(by).flat().sort(), files);
  assert.ok(by.browser.includes("engines-browser.test.mjs"));
  assert.ok(by.db.includes("learner-db.test.mjs"));
  let weights = {};
  try { weights = JSON.parse(readFileSync(DIR + "shard-weights.json", "utf8")).seconds; } catch { /* not measured yet */ }
  assert.deepEqual(planShards(by.unit, weights, 4).flat().sort(), by.unit);
});

test("tapFileDurations: top-level file points with their duration; nested tests ignored", () => {
  const tap = [
    "TAP version 13",
    "# Subtest: /repo/tests/a.test.mjs",
    "    ok 1 - inner test",
    "      ---",
    "      duration_ms: 5",
    "      ...",
    "ok 1 - /repo/tests/a.test.mjs",
    "  ---",
    "  duration_ms: 1234.5",
    "  ...",
    "not ok 2 - /repo/tests/b.test.mjs",
    "  ---",
    "  duration_ms: 10",
    "  ...",
  ].join("\n");
  assert.deepEqual(tapFileDurations(tap), { "a.test.mjs": { s: 1.2345, ok: true }, "b.test.mjs": { s: 0.01, ok: false } });
});

test("ciVerdict: `gates` green AND build AND every shard green (any attempt); pre-matrix shas judged on `gates` alone", async () => {
  const { ciVerdict } = await import("../infra/gate.mjs");
  const ok = (name) => ({ name, conclusion: "success" }), bad = (name) => ({ name, conclusion: "failure" });
  assert.equal(ciVerdict([ok("gates")]), "GitHub Actions gates: success");
  assert.match(ciVerdict([ok("gates"), ok("build"), ok("test (unit 1/4)"), ok("test (db 1/1)")]), /build \+ 2 test shards/);
  assert.equal(ciVerdict([ok("gates"), ok("build"), bad("test (unit 1/4)")]), null, "a red shard");
  assert.equal(ciVerdict([bad("test (unit 1/4)"), ok("test (unit 1/4)"), ok("gates"), ok("build")]) !== null, true, "a shard re-run green");
  assert.equal(ciVerdict([bad("gates"), ok("build")]), null);
  assert.equal(ciVerdict([ok("gates"), { name: "build", conclusion: "pending" }]), null);
  assert.equal(ciVerdict([]), null);
});
