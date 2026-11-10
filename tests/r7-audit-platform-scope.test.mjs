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

test("PLAT-07: a paired device may save the child's own picks, and nothing else on those routes, refused before any query", async () => {
  const { deviceFieldsRefused } = await import("../server/pair/scope.js");
  assert.equal(childScoped("PATCH /api/children"), true);
  assert.equal(childScoped("POST /api/placement/onboarding"), true);
  assert.deepEqual(deviceFieldsRefused("PATCH /api/children", { childId: "x", avatar: "a", interests: ["cricket"] }), []);
  assert.deepEqual(deviceFieldsRefused("PATCH /api/children", { childId: "x", firstName: "Z", classLevel: 9 }), ["firstName", "classLevel"]);
  assert.deepEqual(deviceFieldsRefused("POST /api/placement/onboarding", { childId: "x", childPicks: {} }), []);
  assert.deepEqual(deviceFieldsRefused("POST /api/placement/onboarding", { childId: "x", parentView: { maths: "ahead" } }), ["parentView"]);
  assert.deepEqual(deviceFieldsRefused("POST /api/lesson/turn", { anything: 1 }), [], "routes without a list are not narrowed");

  const http = await import("node:http");
  const { handle } = await import("../server/index.js");
  const server = http.createServer(handle);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const DEVICE = "d.Zm9vYmFyYmF6cXV4cXV1eHF1dXhxdXV4cXV1eHF1dXg";
  const call = (path, method, body, cookie = `tx_child=${DEVICE}`) => fetch(base + path, { method, headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body) })
    .then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  const kid = "00000000-0000-4000-8000-000000000000";
  try {
    const name = await call("/api/children", "PATCH", { childId: kid, firstName: "Someone" });
    assert.equal(name.status, 403); assert.equal(name.body?.code, "scope.child_device");
    const view = await call("/api/placement/onboarding", "POST", { childId: kid, parentView: { maths: "ahead" } });
    assert.equal(view.status, 403); assert.equal(view.body?.code, "scope.child_device");
    // the child's own picture passes the scope (and then needs the database, absent here: not a scope refusal)
    const pic = await call("/api/children", "PATCH", { childId: kid, avatar: "owl" });
    assert.notEqual(pic.body?.code, "scope.child_device");
    // a parent's own session is never narrowed by the device list
    const parent = await call("/api/children", "PATCH", { childId: kid, firstName: "Someone" }, `tx_session=abc; tx_child=${DEVICE}`);
    assert.notEqual(parent.body?.code, "scope.child_device");
  } finally { server.close(); }
});
