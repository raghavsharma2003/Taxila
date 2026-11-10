// r7 audit LEARN-53: shared/learner.ts lagged the server: `via` had no "late" (comprehension/later.js LATE_VIA) and
// `Ledger` had no `placementPending` (kt/ledger.js). Source check against the server's own values.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LATE_VIA } from "../server/comprehension/later.js";

const ts = readFileSync(new URL("../shared/learner.ts", import.meta.url), "utf8");

test("the shared types carry what the server writes", () => {
  const via = /via\?: ([^;]+);/.exec(ts)?.[1] ?? "";
  assert.ok(via.includes(`"${LATE_VIA}"`), via);
  const ledger = ts.slice(ts.indexOf("export interface Ledger"), ts.indexOf("}", ts.indexOf("export interface Ledger")));
  assert.match(ledger, /placementPending\?:/);
});
