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
