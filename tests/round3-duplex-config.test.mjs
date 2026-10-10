// Round 3, stream duplex: the owner-test cohort on GET /api/duplex/config (server/duplex/config.js). Production stays
// "shadow" for everyone; a signed-in guardian listed in TAXILA_DUPLEX_LIVE_FOR gets "on"; the kill switch always wins; a
// slow or failing lookup answers the global mode. No database: the guardian lookup is injected.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { duplexMode, liveCohort, inCohort, modeFor, duplexConfigRoutes } from "../server/duplex/config.js";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const OWNER = "owner@example.com";
const withCookie = { headers: { cookie: "a=1; tx_session=abc; tx_in=1" } };
const lookupAs = (email) => async () => ({ id: "g1", email });

describe("round3 duplex owner-test cohort", () => {
  test("the global switch is unchanged (on / shadow / off)", () => {
    assert.equal(duplexMode({}), "on");
    assert.equal(duplexMode({ TAXILA_DUPLEX: "shadow" }), "shadow");
    assert.equal(duplexMode({ TAXILA_DUPLEX: "off" }), "off");
  });

  test("the cohort reads plain emails and sha256 hashes, case-blind", () => {
    const c = liveCohort({ TAXILA_DUPLEX_LIVE_FOR: ` ${OWNER.toUpperCase()} , ${sha("second@example.com")},, ` });
    assert.equal(c.size, 2);
    assert.ok(inCohort({ email: "Owner@Example.com" }, c));
    assert.ok(inCohort({ email: "second@example.com" }, c));
    assert.ok(!inCohort({ email: "child-parent@example.com" }, c));
    assert.ok(!inCohort(null, c));
  });

  test("shadow for everyone, on for a signed-in cohort guardian", async () => {
    const env = { TAXILA_DUPLEX: "shadow", TAXILA_DUPLEX_LIVE_FOR: sha(OWNER) };
    assert.deepEqual(await modeFor(withCookie, { env, lookup: lookupAs(OWNER) }), { duplex: "on", cohort: "owner" });
    assert.deepEqual(await modeFor(withCookie, { env, lookup: lookupAs("someone@else.com") }), { duplex: "shadow" });
    assert.deepEqual(await modeFor({ headers: {} }, { env, lookup: lookupAs(OWNER) }), { duplex: "shadow" }, "no session cookie: never looked up");
    assert.deepEqual(await modeFor({}, { env, lookup: lookupAs(OWNER) }), { duplex: "shadow" });
  });

  test("a failing or slow lookup answers the global mode (never a cohort by accident)", async () => {
    const env = { TAXILA_DUPLEX: "shadow", TAXILA_DUPLEX_LIVE_FOR: OWNER };
    assert.deepEqual(await modeFor(withCookie, { env, lookup: async () => { throw new Error("401"); } }), { duplex: "shadow" });
    const t0 = Date.now();
    const slow = await modeFor(withCookie, { env, lookup: () => new Promise((r) => setTimeout(() => r({ email: OWNER }), 400)), timeoutMs: 50 });
    // round 3 fix (experience B9): too slow to tell is the global mode AND a retry, never a silent final "shadow"
    assert.deepEqual(slow, { duplex: "shadow", retry: true });
    assert.ok(Date.now() - t0 < 350, "the timeout bounds the route");
  });

  test("the kill switch wins over the cohort; a global 'on' needs no cohort", async () => {
    let looked = 0;
    const lookup = async () => { looked++; return { email: OWNER }; };
    assert.deepEqual(await modeFor(withCookie, { env: { TAXILA_DUPLEX: "off", TAXILA_DUPLEX_LIVE_FOR: OWNER }, lookup }), { duplex: "off" });
    assert.deepEqual(await modeFor(withCookie, { env: { TAXILA_DUPLEX_LIVE_FOR: OWNER }, lookup }), { duplex: "on" });
    assert.equal(looked, 0, "the database is only read when the cohort can change the answer");
  });

  test("the route answers no-store, varies on the cookie and never names the list", async () => {
    const prev = { m: process.env.TAXILA_DUPLEX, l: process.env.TAXILA_DUPLEX_LIVE_FOR };
    process.env.TAXILA_DUPLEX = "shadow";
    process.env.TAXILA_DUPLEX_LIVE_FOR = OWNER;
    try {
      const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
      await duplexConfigRoutes["GET /api/duplex/config"]({ headers: {} }, res);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.body), { duplex: "shadow" });
      assert.equal(res.headers["cache-control"], "no-store");
      assert.equal(res.headers.vary, "cookie");
      assert.ok(!res.body.includes("example.com"));
    } finally {
      if (prev.m === undefined) delete process.env.TAXILA_DUPLEX; else process.env.TAXILA_DUPLEX = prev.m;
      if (prev.l === undefined) delete process.env.TAXILA_DUPLEX_LIVE_FOR; else process.env.TAXILA_DUPLEX_LIVE_FOR = prev.l;
    }
  });
});
