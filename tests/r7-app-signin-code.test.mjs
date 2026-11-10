// r7 stream E app-auth-email-otp: guardian sign-in by an emailed code (server/signin/code.js, src/app/signin/).
// No database here: the pure parts, the refusals that answer before any read, the ACS email provider through a fake
// fetch, the client's error words, and the two patches that wire it in (Platform registers the routes, Learning links).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const S = await import("../server/signin/code.js");
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const status = async (p) => { try { await p; return null; } catch (e) { return { status: e.status, code: e.body?.code ?? e.extra?.code ?? e.details?.code ?? e.code }; } };

test("a code is 6 uniform digits and its key is scoped to the guardian, never a reset token's hash", () => {
  for (let i = 0; i < 200; i++) assert.match(S.newCode(), /^\d{6}$/);
  assert.notEqual(S.codeKey("g1", "123456"), S.codeKey("g2", "123456"));
  assert.equal(S.codeKey("g1", "123456"), S.codeKey("g1", "123456"));
  assert.match(S.codeKey("g1", "000001"), /^code:[0-9a-f]{64}$/); // a reset row's key is 64 hex with no prefix
});

test("one provider interface: email over ACS when configured, phone refuses (ACS SMS does not reach India)", async () => {
  assert.deepEqual(Object.keys(S.PROVIDERS).sort(), ["email", "phone"]);
  for (const p of Object.values(S.PROVIDERS)) { assert.equal(typeof p.ready, "function"); assert.equal(typeof p.send, "function"); }
  assert.equal(S.PROVIDERS.email.ready({}), false);
  assert.equal(S.PROVIDERS.email.ready({ ACS_CONNECTION_STRING: "x", ACS_SENDER: "y" }), true);
  assert.equal(S.PROVIDERS.phone.ready({ ACS_CONNECTION_STRING: "x", ACS_SENDER: "y" }), false);
  await assert.rejects(S.PROVIDERS.phone.send({ to: "+91", code: "1" }), /not built/);
  // channelOf: phone 501, email unconfigured 503, unknown 400 — all before any account is read
  const env = { ACS_CONNECTION_STRING: "x", ACS_SENDER: "y" };
  assert.equal(S.channelOf({ channel: "email" }, env).channel, "email");
  assert.equal(S.channelOf({}, env).channel, "email");
  assert.throws(() => S.channelOf({ channel: "phone" }, env), (e) => e.status === 501);
  assert.throws(() => S.channelOf({ channel: "email" }, {}), (e) => e.status === 503);
  assert.throws(() => S.channelOf({ channel: "fax" }, env), (e) => e.status === 400);
});

test("the email provider signs one ACS emails:send with the code in subject and body", async () => {
  const calls = [];
  const fakeFetch = async (url, init) => { calls.push({ url: String(url), init }); return { status: 202, ok: true, headers: new Map([["operation-location", "op-1"]]) }; };
  const env = { ACS_CONNECTION_STRING: `endpoint=https://taxila-acs.india.communication.azure.com/;accesskey=${Buffer.from("k").toString("base64")}`, ACS_SENDER: "DoNotReply@example.azurecomm.net" };
  const id = await S.PROVIDERS.email.send({ to: "a@b.in", name: "Asha", code: "042917" }, env, fakeFetch);
  assert.equal(id, "op-1");
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /^https:\/\/taxila-acs\.india\.communication\.azure\.com\/emails:send\?api-version=/);
  assert.match(calls[0].init.headers.authorization, /^HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=/);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.recipients.to[0].address, "a@b.in");
  assert.match(body.content.subject, /^042917 /);
  assert.match(body.content.plainText, /042917/);
  assert.match(body.content.plainText, new RegExp(`${S.CODE_MIN} minutes`));
});

test("send and verify refuse a bad request before reading any account", async () => {
  const res = { setHeader() {}, end() {} };
  const req = { headers: { "x-forwarded-for": "203.0.113.9" }, socket: {} };
  const prev = { cs: process.env.ACS_CONNECTION_STRING, s: process.env.ACS_SENDER };
  try {
    delete process.env.ACS_CONNECTION_STRING; delete process.env.ACS_SENDER;
    assert.equal((await status(S.sendCode(req, res, { email: "a@b.in" })))?.status, 503);
    assert.equal((await status(S.sendCode(req, res, { channel: "phone", email: "a@b.in" })))?.status, 501);
    process.env.ACS_CONNECTION_STRING = "x"; process.env.ACS_SENDER = "y";
    assert.equal((await status(S.sendCode(req, res, { email: "not-an-email" })))?.status, 400);
    assert.equal((await status(S.verifyCode(req, res, { email: "a@b.in", code: "12345" })))?.status, 400);
    assert.equal((await status(S.verifyCode(req, res, { email: "a@b.in", code: "abcdef" })))?.status, 400);
  } finally {
    if (prev.cs === undefined) delete process.env.ACS_CONNECTION_STRING; else process.env.ACS_CONNECTION_STRING = prev.cs;
    if (prev.s === undefined) delete process.env.ACS_SENDER; else process.env.ACS_SENDER = prev.s;
  }
});

test("the server never says whether an email has an account, and reuses password_reset (no migration)", () => {
  const src = read("server/signin/code.js");
  assert.match(src, /if \(!g\) return send\(res, 200, out\)/);
  assert.match(src, /if \(!g\) throw badCode\(\)/);
  assert.match(src, /insert into password_reset\(token_hash, guardian_id, expires_at\)/);
  assert.match(src, /createSession\(res, g\.id/);
  assert.deepEqual(Object.keys(S.routes), ["POST /api/auth/code", "POST /api/auth/code/verify"]);
});

test("the client words every refusal and keeps only 6 digits of a paste", async () => {
  const { codeErrorOf, cleanCode } = await import("../src/app/signin/codeErrors.ts");
  const { ApiError } = await import("../src/lesson/api.ts");
  assert.equal(cleanCode("Code: 042 917"), "042917");
  assert.equal(cleanCode("1234567890"), "123456");
  assert.deepEqual(codeErrorOf(new ApiError(400, "x", { field: "code", code: "code.bad" })).field, "code");
  assert.match(codeErrorOf(new ApiError(429, "x", { code: "code.tries" })).text, /new one/);
  assert.match(codeErrorOf(new ApiError(501, "x", { code: "phone.unavailable" })).text, /phone/);
  assert.match(codeErrorOf(new ApiError(503, "x", { code: "email.unavailable" })).text, /password/);
  assert.match(codeErrorOf(new ApiError(429, "too many tries; wait a minute", {})).text, /Wait a minute/);
  assert.match(codeErrorOf(new ApiError(500, "boom", {})).text, /^Something went wrong/);
  const page = read("src/app/signin/CodeSignIn.tsx");
  assert.match(page, /autoComplete="one-time-code"/);
  assert.match(read("src/app/routes.tsx"), /\{ path: "\/signin", element: s\(<CodeSignIn \/>\) \}/);
});

test("the wiring patches apply (or are already applied)", () => {
  for (const p of ["docs/patches/to-platform/002-signin-code-routes.patch", "docs/patches/to-learning/004-signin-code-links.patch"]) {
    const at = new URL("..", import.meta.url).pathname;
    let ok = false;
    try { execFileSync("git", ["apply", "--check", p], { cwd: at, stdio: "pipe" }); ok = true; } catch { /* maybe applied */ }
    if (!ok && p.includes("002-signin-code-routes")) {
      // applied and since edited around (platform owns server/index.js; the audit removed the empty modules table from
      // the same register line), so a reverse apply no longer matches: check what the patch did instead
      const idx = fs.readFileSync(at + "server/index.js", "utf8");
      ok = /import \{ routes as signin \} from "\.\/signin\/code\.js";/.test(idx) && /register\(\{[^}]*\.\.\.signin[^}]*\}\)/.test(idx);
    }
    if (!ok) { execFileSync("git", ["apply", "--check", "--reverse", p], { cwd: at, stdio: "pipe" }); ok = true; }
    assert.ok(ok, p);
  }
});
