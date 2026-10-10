// Round 4 stream 5 (5b prep): a look for the OWNER COHORT only, server-side (TAXILA_FACE_LOOK_FOR + TAXILA_FACE_COHORT_LOOK,
// the duplex cohort's pattern), never a URL switch in production. 5b (2026-10-10): lamp2, rig2's painted-key Asha, is that
// look; everyone else stays on r8. The first tests inject a stand-in cohort look ("cand"); the lamp2 tests use the real list.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";

const store = new Map();
// this file's page globals, (re)installed by every reset: another test file run in the same process installs its own
const stub = (name, value) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
let search = "";
const where = { get search() { return search; } };
const ownGlobals = () => { stub("localStorage", storage); stub("location", where); };
ownGlobals();
const { faceConfigFor, faceLookOf, cohortLookOf, COHORT_FACE_LOOKS, routes } = await import("../server/face-puppet/config.js");
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
  const fresh = (q = "") => { ownGlobals(); store.clear(); search = q; F.resetPuppetServerFlag(); L.resetLookForTests(); };
  fresh();
  assert.equal(await L.faceLook(answer({ puppet2d: true, look: "r8", cohort: "owner" })), "r8");
  assert.equal(store.get(L.LOOK_SERVER_KEY), undefined, "a cohort answer is not remembered for the next page");
  fresh();
  assert.equal(await L.faceLook(answer({ puppet2d: true, look: "lamp1", cohort: "owner" })), "r8", "held stays held, cohort or not");
  // the gate's source: the URL path never passes the cohort flag
  const src = readFileSync(new URL("../src/face-puppet/assets.ts", import.meta.url), "utf8");
  assert.match(src, /&& \(held \|\| cohort \|\| !\(COHORT_LOOKS as readonly string\[\]\)\.includes\(v\)\)/, "?look= (no cohort flag) never admits a cohort-only look");
  const look = readFileSync(new URL("../src/face-puppet/look.ts", import.meta.url), "utf8");
  assert.match(look, /const fromServer = \(v: string \| null, cohort: boolean\): boolean => isPuppetLook\(v, \{ cohort \}\);/);
  assert.match(look, /else if \(isPuppetLook\(v, \{ held: heldTrial \}\)\) setDeviceLook\(v\);/, "the URL path passes no cohort flag");
});

// 5b: lamp2 for the owner's accounts only (TAXILA_FACE_COHORT_LOOK=lamp2, TAXILA_FACE_LOOK_FOR=<owner hash> at deploy)
const lamp2Env = (over = {}) => ({ TAXILA_FACE_LOOK_FOR: sha(OWNER), TAXILA_FACE_COHORT_LOOK: "lamp2", ...over });

test("lamp2: the owner cohort's look; every other account (and a URL) gets r8, though the pack ships in public/", async () => {
  assert.deepEqual([...COHORT_FACE_LOOKS], ["lamp2"]);
  assert.ok(existsSync(new URL("../public/face-puppet/lamp2/geom.json", import.meta.url)), "the pack ships");
  const base = { puppet2d: true, visemes: true, rev: "r8", look: "r8" };
  const lamp2 = (lookup, cookie = "tx_session=abc", env = lamp2Env()) => faceConfigFor(req(cookie), { env, lookup, timeoutMs: 200 });
  assert.deepEqual(await lamp2(asOwner), { ...base, look: "lamp2", cohort: "owner" }, "a cohort account gets lamp2");
  assert.deepEqual(await lamp2(async () => ({ email: "parent@else.test" })), base, "a non-cohort account gets r8");
  assert.deepEqual(await lamp2(asOwner, ""), base, "signed out: r8");
  assert.deepEqual(await lamp2(asOwner, "tx_session=abc", lamp2Env({ TAXILA_FACE_LOOK_FOR: "" })), base, "no cohort configured: r8");
  assert.equal(faceLookOf({ TAXILA_FACE_LOOK: "lamp2" }), "r8", "the global look can never be lamp2 (cohort-only)");
  // a non-cohort browser asking for lamp2 by URL (and with it stored from an older build) still paints r8
  const page = (q, stored = {}) => { ownGlobals(); store.clear(); for (const [k, v] of Object.entries(stored)) store.set(k, v); search = q; F.resetPuppetServerFlag(); L.resetLookForTests(); };
  const says = (body) => async () => ({ ok: true, status: 200, json: async () => body });
  for (const q of ["?look=lamp2", "?look=lamp2&heldlook=1"]) {
    page(q);
    assert.equal(L.faceLookNow(), null, `${q}: ignored`);
    page(q, { [L.LOOK_DEVICE_KEY]: "lamp2", [L.LOOK_SERVER_KEY]: "lamp2" });
    assert.equal(L.faceLookNow(), null, `${q}: a stored lamp2 is ignored`);
    assert.equal(await L.faceLook(says(base)), "r8", `${q}: the server says r8`);
    page(q);
    assert.equal(await L.faceLook(says({ ...base, look: "lamp2" })), "r8", `${q}: lamp2 without the cohort mark`);
  }
  // the owner's browser: the server's cohort answer paints lamp2 on this page and is not remembered for the next
  page("");
  assert.equal(await L.faceLook(says({ ...base, look: "lamp2", cohort: "owner" })), "lamp2");
  assert.equal(L.faceLookNow(), "lamp2", "the rest of the page");
  assert.equal(store.get(L.LOOK_SERVER_KEY), undefined, "never remembered");
});

test("lamp2: the key rig runs on the stage (no WebGL needed), calm in a safety turn, and never falls back to the vector", () => {
  const stage = readFileSync(new URL("../src/face-puppet/stage.ts", import.meta.url), "utf8");
  assert.match(stage, /if \(rig instanceof KeyRig\) rig\.calm = this\.driver\.inSafety;/, "the safety turn's calm face, every frame");
  assert.match(stage, /if \(pack\.rig !== "keys" && typeof WebGL2RenderingContext === "undefined"\) throw/);
  assert.match(stage, /if \(lookPack\(o\.look\)\.rig === "keys"\) \{ this\.driver\.visemes\.lead \+= KEY_LEAD_MS; this\.driver\.visemes\.extendedBilabials = true; \}/);
  const face = readFileSync(new URL("../src/face-puppet/PuppetFace.tsx", import.meta.url), "utf8");
  assert.match(face, /holdsOwnStill = \(look: PuppetLook \| null\): boolean => look === "lamp1" \|\| look === "lamp2";/);
  for (const f of ["rest-medium", "rest-close", "body", "head"]) assert.ok(existsSync(new URL(`../public/face-puppet/lamp2/${f}.webp`, import.meta.url)), f);
  const g = JSON.parse(readFileSync(new URL("../public/face-puppet/lamp2/geom.json", import.meta.url), "utf8"));
  for (const k of Object.keys(g.keys)) assert.ok(existsSync(new URL(`../public/face-puppet/lamp2/${k}.webp`, import.meta.url)), `key ${k}`);
  assert.ok(g.keys.calm, "the calm neutral mouth is in the pack");
  const bytes = ["body", "head", ...Object.keys(g.keys)].reduce((n, k) => n + statSync(new URL(`../public/face-puppet/lamp2/${k}.webp`, import.meta.url)).size, 0);
  assert.ok(bytes < 200_000, `lamp2 pack ${bytes} B: at most r8's weight class`);
});
