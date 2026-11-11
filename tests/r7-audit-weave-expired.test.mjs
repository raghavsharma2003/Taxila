// r7 audit LEARN-48 (latent: no kit has weave hosts yet): an expired weave entry that lost the opener-slot race is kept
// open in the table, so it competes again at the next lesson start instead of being closed unasked. Pure statement check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { weaveStmts } from "../server/comprehension/store.js";

test("weaveStmts never closes an unconsumed expired entry", () => {
  const child = { id: "c1", legal_mode: "M1" };
  const q = [
    { skillId: "a", kind: "woven", status: "queued" },
    { skillId: "b", kind: "woven", status: "expired" },
    { skillId: "c", kind: "woven", status: "done" },
  ];
  const [close] = weaveStmts(child, q);
  assert.match(close.text, /set status='done'/);
  assert.deepEqual([...close.params[1]].sort(), ["a", "b"], "b (expired, not consumed) is excluded from the close");
});
