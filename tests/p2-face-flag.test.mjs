// ship5 p2-face: the face's switches on the client. face.puppet2d ships ON; the device switch (?puppet / localStorage)
// and the server's RUNTIME kill switch (GET /api/face/config ← TAXILA_FACE_PUPPET2D) both land on the old face, and an
// unreachable / missing route fails OPEN (the route 404s until patch 03 is applied, and the puppet must still ship).
import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const F = await import("../src/face-puppet/flag.ts");

const answer = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("face.puppet2d ships on; the device switch turns it off and back; 'default' forgets", () => {
  store.clear();
  assert.equal(F.puppet2dEnabled(), true);
  F.setPuppet2d(false);
  assert.equal(F.puppet2dEnabled(), false);
  F.setPuppet2d(true);
  assert.equal(F.puppet2dEnabled(), true);
  assert.equal(F.puppetForcedOn(), true);
  F.setPuppet2d(null);
  assert.equal(F.puppet2dEnabled(), true);
  assert.equal(F.puppetForcedOn(), false);
});

test("server kill switch: puppet2d false → not allowed, and known-off for the rest of the page", async () => {
  store.clear();
  F.resetPuppetServerFlag();
  assert.equal(F.puppetServerKnownOff(), false, "unknown before the answer");
  assert.equal(await F.puppetServerAllows(answer(200, { puppet2d: false, visemes: true, rev: "r8" })), false);
  assert.equal(F.puppetServerKnownOff(), true);
  // a device the owner forced on (?puppet=1) is not overridden
  F.setPuppet2d(true);
  assert.equal(F.puppetServerKnownOff(), false);
  F.setPuppet2d(null);
});

test("server kill switch fails open: allowed, 404 (seam not applied), 500, bad JSON, network error, timeout", async () => {
  const cases = [
    ["allowed", answer(200, { puppet2d: true })],
    ["404", answer(404, { error: "no route" })],
    ["500", answer(500, {})],
    ["bad json", async () => ({ ok: true, status: 200, json: async () => { throw new Error("bad"); } })],
    ["network", async () => { throw new TypeError("fetch failed"); }],
    ["timeout", (_u, o) => new Promise((_, rej) => o.signal.addEventListener("abort", () => rej(new Error("aborted"))))],
  ];
  for (const [name, f] of cases) {
    F.resetPuppetServerFlag();
    const t0 = Date.now();
    assert.equal(await F.puppetServerAllows(f, 120), true, name);
    assert.ok(Date.now() - t0 < 1000, `${name} resolves promptly`);
    assert.equal(F.puppetServerKnownOff(), false, name);
  }
});

test("one request per page: the answer is shared by every face", async () => {
  F.resetPuppetServerFlag();
  let calls = 0;
  const f = async (url) => { calls++; assert.equal(url, F.FACE_CONFIG_URL); return { ok: true, status: 200, json: async () => ({ puppet2d: true }) }; };
  await Promise.all([F.puppetServerAllows(f), F.puppetServerAllows(f), F.puppetServerAllows(f)]);
  await F.puppetServerAllows(f);
  assert.equal(calls, 1);
});
