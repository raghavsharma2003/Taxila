// scripts/verify-release.mjs is the single release gate (harvest port task 1). These tests check the gate LIST
// and its verdict logic without running the gates: a gate missing from the list is a check nobody runs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GATES, KNOWN_SKIPS, tapVerdict } from "../scripts/verify-release.mjs";

test("the release list runs tsc, both budgets, the safety evals, the build and npm test — vite before npm test", () => {
  const ids = GATES.map((g) => g[0]);
  for (const id of ["typecheck", "prompt-budget", "kit-budget", "persona-invariants", "never-rules", "pii", "spoken", "web-build", "npm-test"]) assert.ok(ids.includes(id), id);
  assert.ok(ids.indexOf("web-build") < ids.indexOf("npm-test"), "tests/engines-browser reads dist/");
  assert.deepEqual(GATES.find((g) => g[0] === "typecheck").slice(2), ["npx", ["tsc", "-b"]]);
  assert.deepEqual(GATES.find((g) => g[0] === "npm-test").slice(2, 4), ["npm", ["test"]]);
});

test("every gate's script exists, and package.json's verify points here", () => {
  for (const [id, , cmd, args] of GATES) if (cmd === "node") { const f = args.find((a) => /\.m?js$/.test(a)); assert.ok(readFileSync(new URL(`../${f}`, import.meta.url)), `${id}: ${f}`); }
  assert.equal(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts.verify, "node scripts/verify-release.mjs");
});

test("skips are red unless named: a known skip passes, an unknown one is counted", () => {
  const tap = "ok 1 - a\nok 2 - learner writer on Neon # SKIP no TEST_DATABASE_URL (a Neon branch)\nok 3 - browser: x # SKIP set VOICE_BROWSER=1\nok 4 - new suite # SKIP flaky\n# tests 4\n# pass 1\n# fail 0\n";
  const v = tapVerdict(tap);
  assert.equal(v.skips.length, 3);
  assert.deepEqual(v.unknown, ["ok 4 - new suite # SKIP flaky"]);
  assert.ok(KNOWN_SKIPS.every(([re, why]) => re instanceof RegExp && why.length > 10));
});

test("a failing test is read from the TAP, not the tail of a pipe", () => {
  const v = tapVerdict("not ok 7 - broke\n# tests 9\n# pass 8\n# fail 1\n");
  assert.equal(v.fail, 1);
  assert.deepEqual(v.fails, ["not ok 7 - broke"]);
});

test("TODO tests are listed and counted, never hidden and never red (an unwired guard shows in the verdict)", () => {
  const v = tapVerdict("ok 1 - a\nnot ok 2 - lesson.js reply guards call floorViolations # TODO not wired yet\nok 3 - b # TODO later\n# tests 3\n# pass 1\n# fail 0\n# todo 2\n");
  assert.equal(v.todos.length, 2);
  assert.match(v.todos[0], /floorViolations/);
  assert.deepEqual(v.fails, [], "a TODO is not a failure");
  assert.equal(v.fail, 0);
});
