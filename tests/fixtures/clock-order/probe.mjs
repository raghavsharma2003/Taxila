import test from "node:test";
import assert from "node:assert/strict";
test("probe: performance.now is the real clock after the virtual-clock files ran", async () => {
  const a = performance.now(); await new Promise((r) => setTimeout(r, 30)); const b = performance.now();
  assert.ok(b - a >= 25, `performance.now advanced ${b - a} ms`);
});
