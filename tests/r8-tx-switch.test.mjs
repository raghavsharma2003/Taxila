// Round 8: the ?tx= switch (src/ui-v3/r8/tx.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { txDecision, TX_DEFAULT } from "../src/ui-v3/r8/tx.ts";

test("the switch: ?tx=a|b opts a device in, ?tx=off out, ?tx=default forgets; the shipped default is the current look", () => {
  assert.equal(TX_DEFAULT, null, "production renders today's look until the owner approves");
  const d = (url, stored, def = null) => txDecision({ url, stored, def });
  assert.deepEqual(d(null, null), { store: null, theme: null });
  assert.deepEqual(d("a", null), { store: "a", theme: "a" });
  assert.deepEqual(d("b", "a"), { store: "b", theme: "b" });
  assert.deepEqual(d(null, "b"), { store: "b", theme: "b" }, "the device keeps its choice on later pages");
  assert.deepEqual(d("off", "a", "a"), { store: "off", theme: null }, "off beats a shipped default");
  assert.deepEqual(d("default", "b"), { store: null, theme: null });
  assert.deepEqual(d("default", "off", "a"), { store: null, theme: "a" });
  assert.deepEqual(d("zzz", "junk"), { store: null, theme: null }, "unknown values are ignored");
});

// Release 22 (2026-11-11): the switch was read only when a themed screen mounted. A link such as /who?tx=a redirects
// (to /start/class) before any themed screen exists, so the device never kept the choice and the link did nothing.
test("the switch is read at boot, before the router renders, so ?tx= on any landing URL is kept", async () => {
  const { readFileSync } = await import("node:fs");
  const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
  const call = main.search(/^txTheme\(\);/m);
  const render = main.indexOf("createRoot(");
  assert.ok(call > 0, "src/main.tsx calls txTheme() at module level");
  assert.ok(render > 0 && call < render, "and before the router is rendered (a redirect drops the query)");
});
