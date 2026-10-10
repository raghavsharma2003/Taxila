// Round 4 stream 5 (5b prep): a look for the OWNER COHORT only, server-side (TAXILA_FACE_LOOK_FOR + TAXILA_FACE_COHORT_LOOK,
// the duplex cohort's pattern), never a URL switch in production. Inert until a cohort-only look is keyed (lamp2 on the
// owner's yes): COHORT_FACE_LOOKS is empty, so the server tests inject one.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
let search = "";
globalThis.location = { get search() { return search; } };
const { faceConfigFor, cohortLookOf, COHORT_FACE_LOOKS, routes } = await import("../server/face-puppet/config.js");
const A = await import("../src/face-puppet/assets.ts");
const F = await import("../src/face-puppet/flag.ts");
const L = await import("../src/face-puppet/look.ts");

const OWNER = "owner@example.test";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const req = (cookie) => ({ headers: cookie ? { cookie } : {} });
const env = (over = {}) => ({ TAXILA_FACE_LOOK_FOR: OWNER, TAXILA_FACE_COHORT_LOOK: "cand", ...over });
const opts = (lookup, more = {}) => ({ lookup, cohortLooks: ["cand"], timeoutMs: 200, ...more });
const asOwner = async () => ({ email: "Owner@Example.test" });

test("server: only a signed-in guardian on the list gets the cohort look; everyone else the global one", async () => {
  assert.deepEqual([...COHORT_FACE_LOOKS], [], "inert until a cohort-only look is approved");
  const base = { puppet2d: true, visemes: true, rev: "r8", look: "r8" };
  assert.deepEqual(await faceConfigFor(req("tx_session=abc"), { env: env(), ...opts(asOwner) }), { ...base, look: "cand", cohort: "owner" });
  assert.deepEqual(await faceConfigFor(req("tx_session=abc"), { env: env({ TAXILA_FACE_LOOK_FOR: sha(OWNER) }), ...opts(asOwner) }), { ...base, look: "cand", cohort: "owner" }, "a hashed list works");
  assert.deepEqual(await faceConfigFor(req(""), { env: env(), ...opts(asOwner) }), base, "no session cookie");
  assert.deepEqual(await faceConfigFor(req("tx_session=abc"), { env: env(), ...opts(async () => ({ email: "someone@else.test" })) }), base, "another account");
  assert.deepEqual(await faceConfigFor(req("tx_session=abc"), { env: env(), ...opts(async () => { throw new Error("401"); }) }), base, "expired session");
  assert.deepEqual(await faceConfigFor(req("tx_session=abc"), { env: env(), ...opts(() => new Promise(() => {})) }), base, "a slow database: the global look");
  assert.deepEqual(await faceConfigFor(req("tx_session=abc"), { env: env({ TAXILA_FACE_LOOK_FOR: "" }), ...opts(asOwner) }), base, "no list");
  assert.deepEqual(await faceConfigFor(req("tx_session=abc"), { env: env({ TAXILA_FACE_COHORT_LOOK: "" }), ...opts(asOwner) }), base, "no cohort look");
});

test("server: a held or unknown look is never the cohort look; the kill switch still applies", async () => {
  for (const v of ["lamp1", "LAMP1", "nope"]) assert.equal(cohortLookOf({ TAXILA_FACE_COHORT_LOOK: v }, ["cand"]), null, v);
  assert.equal(cohortLookOf({ TAXILA_FACE_COHORT_LOOK: " Cand " }, ["cand"]), "cand");
  const r = await faceConfigFor(req("tx_session=abc"), { env: env({ TAXILA_FACE_PUPPET2D: "0" }), ...opts(asOwner) });
  assert.equal(r.puppet2d, false, "the kill switch is unchanged for the cohort");
});

test("route: an answer that depends on the cookie is private and uncached; otherwise short-cached; never reveals the list", async () => {
  const run = async (cookie, list) => {
    const was = process.env.TAXILA_FACE_LOOK_FOR;
    if (list) process.env.TAXILA_FACE_LOOK_FOR = list; else delete process.env.TAXILA_FACE_LOOK_FOR;
    const headers = {};
    let body = "";
    const res = { setHeader: (k, v) => { headers[k.toLowerCase()] = v; }, end: (b) => { body = b ?? ""; }, statusCode: 0 };
    try { await routes["GET /api/face/config"](req(cookie), res); } finally { if (was === undefined) delete process.env.TAXILA_FACE_LOOK_FOR; else process.env.TAXILA_FACE_LOOK_FOR = was; }
    return { headers, body };
  };
  const a = await run("tx_session=abc", OWNER);
  assert.match(a.headers["cache-control"], /private, no-store/);
  assert.equal(a.headers.vary, "cookie");
  assert.ok(!a.body.includes("owner@") && !a.body.includes(sha(OWNER)), "the list never leaves the server");
  assert.match((await run("", OWNER)).headers["cache-control"], /public, max-age=60/);
  assert.match((await run("tx_session=abc", "")).headers["cache-control"], /public, max-age=60/);
});

test("client: a cohort-only look is never taken from ?look=; a cohort answer is not remembered; a cohort never un-holds lamp1", async () => {
  assert.deepEqual([...A.COHORT_LOOKS], [...COHORT_FACE_LOOKS], "client and server key the same cohort-only looks");
  const answer = (body) => async () => ({ ok: true, status: 200, json: async () => body });
  const fresh = (q = "") => { store.clear(); search = q; F.resetPuppetServerFlag(); L.resetLookForTests(); };
  fresh();
  assert.equal(await L.faceLook(answer({ puppet2d: true, look: "r8", cohort: "owner" })), "r8");
  assert.equal(store.get(L.LOOK_SERVER_KEY), undefined, "a cohort answer is not remembered for the next page");
  fresh();
  assert.equal(await L.faceLook(answer({ puppet2d: true, look: "lamp1", cohort: "owner" })), "r8", "held stays held, cohort or not");
  // the gate itself, with a cohort-only look name (none is keyed yet, so the predicate is checked on its rules)
  const src = (await import("node:fs")).readFileSync(new URL("../src/face-puppet/assets.ts", import.meta.url), "utf8");
  assert.match(src, /&& \(held \|\| cohort \|\| !\(COHORT_LOOKS as readonly string\[\]\)\.includes\(v\)\)/, "?look= (no cohort flag) never admits a cohort-only look");
  const look = (await import("node:fs")).readFileSync(new URL("../src/face-puppet/look.ts", import.meta.url), "utf8");
  assert.match(look, /const fromServer = \(v: string \| null, cohort: boolean\): boolean => isPuppetLook\(v, \{ cohort \}\);/);
  assert.match(look, /else if \(isPuppetLook\(v, \{ held: heldTrial \}\)\) setDeviceLook\(v\);/, "the URL path passes no cohort flag");
});
