// Round 7, stream G (child device pairing): the parts that need no database. A paired device's session (tx_child) is
// refused on every parent route before any query; codes, the limiter and the cookie shapes. The database half (code TTL
// and single use against Postgres, a device on child routes, unpair ending the session) is tests/pair-db.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { childScoped } from "../server/pair/scope.js";
import { ALPHABET, CODE_LEN, LIMITS, newCode, normalizeCode, limiter, deviceLabel, deviceCookies, _resetLimitsForTests } from "../server/pair/routes.js";
import { requireGuardian, sessionTokenHash, CHILD_SCOPE, deviceOnly } from "../server/auth.js";

const DEVICE = "d.Zm9vYmFyYmF6cXV4cXV1eHF1dXhxdXV4cXV1eHF1dXg";
const reqWith = (cookie, scoped) => ({ headers: { cookie }, ...(scoped ? { [CHILD_SCOPE]: true } : {}) });

test("codes: 6 characters from an alphabet without 0/O/1/I; typing is forgiven, nothing else is", () => {
  assert.equal(ALPHABET.length, 32);
  for (const c of "0O1I") assert.ok(!ALPHABET.includes(c), c);
  for (let i = 0; i < 500; i++) { const c = newCode(); assert.equal(c.length, CODE_LEN); assert.ok([...c].every((x) => ALPHABET.includes(x)), c); }
  assert.equal(normalizeCode("ab c-2d9"), "ABC2D9");
  for (const bad of ["", "ABC2D", "ABC2D99", "ABC0D9", "ABCID9", "AB C2D!", null, 123456]) assert.equal(normalizeCode(bad), null, String(bad));
});

test("limiter: max tries per key per window, then refused until the window turns", () => {
  const lim = limiter({ windowMs: 1000, max: 3 });
  assert.deepEqual([1, 2, 3, 4].map(() => lim("a", 0)), [true, true, true, false]);
  assert.equal(lim("b", 10), true, "another key has its own count");
  assert.equal(lim("a", 1000), true, "a new window");
  assert.ok(LIMITS.perIp >= LIMITS.perCode && LIMITS.perCode >= 3);
});

test("scope: child routes in, every parent and pairing-admin route out (deny by default)", () => {
  for (const k of ["GET /api/child/boot", "POST /api/lesson/turn", "POST /api/lesson/start", "POST /api/realtime/token", "POST /api/play/act",
    "GET /api/studio/notebook", "POST /api/voice/transcribe", "POST /api/duplex/her", "GET /api/tutors/name", "POST /api/placement/answer", "POST /api/tts"])
    assert.equal(childScoped(k), true, k);
  for (const k of ["GET /api/parent/overview", "POST /api/parent/unlock", "POST /api/parent/controls", "GET /api/placement/note", "POST /api/children",
    "POST /api/pair/code", "GET /api/pair/devices", "DELETE /api/pair/devices", "GET /api/me", "POST /api/consent", "DELETE /api/children", "DELETE /api/account",
    "POST /api/studio/made-for/hide", "GET /api/ops", "GET /api/whatever"])
    assert.equal(childScoped(k), false, k);
});

test("a device-only session is refused (403 scope.child_device) off its scope, before any query; a device token never counts as a parent's", async () => {
  await assert.rejects(requireGuardian(reqWith(`tx_child=${DEVICE}`)), (e) => e.status === 403 && e.extra?.code === "scope.child_device");
  await assert.rejects(requireGuardian(reqWith(`tx_session=${DEVICE}`)), (e) => e.status === 401, "a device token in the parent cookie is no session");
  await assert.rejects(requireGuardian(reqWith("tx_child=not-a-device-token")), (e) => e.status === 401);
  assert.equal(sessionTokenHash(reqWith(`tx_child=${DEVICE}`)), null, "off scope, no token hash for the joins");
  assert.match(sessionTokenHash(reqWith(`tx_child=${DEVICE}`, true)), /^[0-9a-f]{64}$/);
  assert.equal(sessionTokenHash(reqWith(`tx_session=${DEVICE}`, true)), null);
  assert.equal(deviceOnly(reqWith(`tx_child=${DEVICE}`)), true);
  assert.equal(deviceOnly(reqWith(`tx_child=${DEVICE}; tx_session=abc`)), false, "the parent signed in on this device: the parent session wins");
});

test("through the router: a paired device gets 403 scope.child_device on parent routes and the pairing admin; redeem rate-limits", async () => {
  const { handle } = await import("../server/index.js");
  const server = http.createServer(handle);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (path, method = "GET", body, cookie = `tx_child=${DEVICE}`) => fetch(base + path, { method,
    headers: { cookie, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined })
    .then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  try {
    for (const [p, m, b] of [["/api/parent/overview?childId=00000000-0000-0000-0000-000000000000", "GET"], ["/api/parent/unlock", "POST", { pin: "1234" }],
      ["/api/placement/note?childId=00000000-0000-0000-0000-000000000000", "GET"], ["/api/pair/devices", "GET"], ["/api/pair/devices?id=00000000-0000-0000-0000-000000000000", "DELETE"],
      ["/api/pair/code", "POST", { childId: "00000000-0000-0000-0000-000000000000" }], ["/api/me", "GET"]]) {
      const r = await call(p, m, b);
      assert.ok(r.status === 403 || r.status === 401, `${m} ${p}: ${r.status}`);
      if (p !== "/api/me") assert.equal(r.body?.code, "scope.child_device", `${m} ${p}: ${JSON.stringify(r.body)}`);
    }
    _resetLimitsForTests();
    const bad = [];
    for (let i = 0; i < LIMITS.perCode + 1; i++) bad.push(await call("/api/pair/redeem", "POST", { code: "nope!!" }, ""));
    assert.ok(bad.slice(0, LIMITS.perCode).every((r) => r.status === 400 && r.body?.code === "pair.invalid"), JSON.stringify(bad[0]));
    assert.equal(bad.at(-1).status, 429);
    assert.equal(bad.at(-1).body?.code, "pair.rate_limited");
    _resetLimitsForTests();
    const many = [];
    for (let i = 0; i < LIMITS.perIp + 1; i++) many.push(await call("/api/pair/redeem", "POST", { code: `x${i}` }, ""));
    assert.equal(many.at(-1).status, 429, "per address, whatever the codes");
  } finally { _resetLimitsForTests(); server.close(); }
});

test("device label and cookie shapes", () => {
  assert.equal(deviceLabel("  Riya's tablet ", ""), "Riya's tablet");
  assert.equal(deviceLabel("", "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit"), "Android tablet");
  assert.equal(deviceLabel("", "Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile Safari"), "Android phone");
  assert.equal(deviceLabel("", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"), "iOS phone");
  assert.equal(deviceLabel("", ""), "Computer");
  const [s, p] = deviceCookies("d.tok", "11111111-2222-3333-4444-555555555555", { NODE_ENV: "production" });
  assert.equal(s, "tx_child=d.tok; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000; Secure");
  assert.equal(p, "tx_paired=11111111-2222-3333-4444-555555555555; Path=/; SameSite=Lax; Max-Age=15552000; Secure");
});
