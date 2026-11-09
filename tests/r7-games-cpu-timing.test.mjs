// r7 Games: every speed bar in the games tests times CPU, never the wall clock (tests/_cpu-ms.mjs). A wall-clock p95 under
// CI's four-files-at-once runner measured the scheduler and failed twice (kram on PR #78; nazariya2's picker bar, which
// arrived after the first sweep). This keeps a new family's test from bringing the wall clock back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

test("no r7-games test times with performance.now()", () => {
  const dir = new URL("./", import.meta.url);
  const offenders = readdirSync(dir).filter((f) => /^r7-games-.*\.test\.mjs$/.test(f) && f !== "r7-games-cpu-timing.test.mjs")
    .filter((f) => readFileSync(new URL(f, dir), "utf8").includes("performance.now()"));
  assert.deepEqual(offenders, [], "use cpuNow() from ./_cpu-ms.mjs for speed bars");
});
