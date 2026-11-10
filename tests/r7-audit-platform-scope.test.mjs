// Whole-project audit 2026-11-09, platform (PLAT-12, PLAT-13).
// PLAT-12: requireChild passed any string to `child.id = $1` (a uuid column): a non-uuid id was Postgres 22P02 and a 500.
// PLAT-13: the flight recorder's routes were off the paired-device scope, so a device's trace rows had no guardian or
// child (a child erase missed them) and the answer said tier 1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { requireChild } from "../server/auth.js";
import { childScoped } from "../server/pair/scope.js";

test("PLAT-12: a child id that is not a uuid is 403 'not found' before any query; a uuid still asks for a session", async () => {
  for (const bad of ["abc", "", null, undefined, "1 or 1=1", "00000000-0000-0000-0000-00000000000z"]) {
    await assert.rejects(requireChild({ headers: {} }, bad), (e) => e.status === 403, String(bad));
  }
  await assert.rejects(requireChild({ headers: {} }, "00000000-0000-4000-8000-000000000000"), (e) => e.status === 401);
});

test("PLAT-13: a paired device may send its flight recording", () => {
  assert.equal(childScoped("POST /api/trace/batch"), true);
  assert.equal(childScoped("POST /api/trace/blob"), true);
  assert.equal(childScoped("GET /api/trace/batch"), false);
});
