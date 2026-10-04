// W1-D eyes (server/router.js): the access-log line, the client error beacon's scrubbing and rate limit, and the
// readiness split of /api/health. No database: readiness is exercised with DATABASE_URL unset (it must answer 503).
import { test } from "node:test";
import assert from "node:assert/strict";
import { beaconAllowed, hashId, register, handle, scrubMessage, scrubPath, scrubStack } from "../server/router.js";

function fakeRes() {
  const res = { statusCode: 200, headers: {}, body: "", headersSent: false, listeners: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    writeHead(s, h) { this.statusCode = s; Object.assign(this.headers, h || {}); this.headersSent = true; return this; },
    end(b) { if (b) this.body += b; this.headersSent = true; (this.listeners.finish || []).forEach((f) => f()); },
    once(ev, f) { (this.listeners[ev] ||= []).push(f); }, on(ev, f) { (this.listeners[ev] ||= []).push(f); } };
  return res;
}
const req = (method, url, body, headers = {}) => Object.assign((async function* () { if (body) yield Buffer.from(JSON.stringify(body)); })(),
  { method, url, headers: { "content-type": "application/json", ...headers }, socket: { remoteAddress: "10.0.0.1" } });

test("beacon scrub: no quoted text, numbers, emails, URLs or non-ASCII script survives; stacks keep bundle frames only", () => {
  const m = scrubMessage(`Cannot read 'Riya ka jawab 12345' of undefined at riya@example.com https://x.y/z?q=1 बारह`);
  assert.ok(!/Riya|12345|example|x\.y|बारह/.test(m), m);
  assert.match(m, /^Cannot read “…” of undefined at <email> <url>/);
  assert.ok(scrubMessage("x".repeat(500)).length <= 160);
  const st = scrubStack(`TypeError: boom\n at f (https://taxila.x/assets/main-W1OdjGXm.js:1:2345)\n at g (https://taxila.x/assets/LessonScreen-abc12345.js:9:10)\n at h (chrome-extension://zzz/inject.js:1:1)`);
  assert.deepEqual(st, ["assets/main-W1OdjGXm.js:1:2345", "assets/LessonScreen-abc12345.js:9:10"]);
  assert.equal(scrubPath("/c/7b0c5d3e-1111-4222-8333-444455556666/lesson?mode=text#x"), "/c/:id/lesson");
});

test("beacon rate limit: 10 per address per minute, 300 per replica", () => {
  const t = 1_000_000_000;
  let ok = 0;
  for (let i = 0; i < 15; i++) if (beaconAllowed("1.1.1.1", t)) ok++;
  assert.equal(ok, 10);
  let all = 0;
  for (let i = 0; i < 400; i++) if (beaconAllowed(`2.2.${Math.floor(i / 5)}.${i % 5}`, t + 1)) all++;
  assert.equal(all, 290, "the per-replica window holds 300 including the first address's 10");
  assert.equal(beaconAllowed("1.1.1.1", t + 60_000), true, "a new window");
});

test("POST /api/client-error answers 204 and writes one scrubbed JSON line", async () => {
  const lines = [];
  const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s, ...a) => { if (String(s).includes('"client_error"')) { lines.push(String(s)); return true; } return orig(s, ...a); };
  try {
    const res = fakeRes();
    await handle(req("POST", "/api/client-error", { kind: "error", name: "TypeError", message: "bad 'Aarav said hi'", stack: "at x (https://h/assets/a-12345678.js:1:2)", path: "/c/123e4567-e89b-12d3-a456-426614174000" }, { "x-forwarded-for": "9.9.9.9" }), res);
    assert.equal(res.statusCode, 204);
  } finally { process.stdout.write = orig; }
  assert.equal(lines.length, 1);
  const l = JSON.parse(lines[0]);
  assert.equal(l.kind, "client_error"); assert.equal(l.name, "TypeError"); assert.equal(l.path, "/c/:id");
  assert.ok(!lines[0].includes("Aarav"));
});

test("access log: one line per API request with route template, status, ms, hashed lesson id and the 5xx error class", async () => {
  process.env.ACCESS_LOG = "on";
  const { handle: h2, register: r2 } = await import("../server/router.js?accesslog=1");
  r2({ "POST /api/x/fail": async () => { const e = new RangeError("child text here: Meera ne kaha"); e.code = "E42"; throw e; } });
  const lines = [];
  const orig = process.stdout.write.bind(process.stdout);
  const origErr = console.error;
  process.stdout.write = (s, ...a) => { if (String(s).includes('"kind":"access"')) { lines.push(JSON.parse(String(s))); return true; } return orig(s, ...a); };
  console.error = () => {};
  try {
    await h2(req("POST", "/api/x/fail", { lessonId: "9b0c5d3e-1111-4222-8333-444455556666" }), fakeRes());
    await h2(req("GET", "/api/nope/7b0c5d3e-1111-4222-8333-444455556666"), fakeRes());
  } finally { process.stdout.write = orig; console.error = origErr; delete process.env.ACCESS_LOG; }
  assert.equal(lines.length, 2);
  assert.deepEqual({ route: lines[0].route, status: lines[0].status, err: lines[0].err, lesson: lines[0].lesson },
    { route: "POST /api/x/fail", status: 500, err: "RangeError:E42", lesson: hashId("9b0c5d3e-1111-4222-8333-444455556666") });
  assert.ok(Number.isInteger(lines[0].ms));
  assert.equal(lines[1].route, "GET (unmatched)", "an unknown path is never logged verbatim");
  assert.ok(!JSON.stringify(lines).includes("Meera"));
  assert.equal(hashId("a").length, 12);
});

test("health: shallow by default; ?ready=1 checks the database and answers 503 without one", async () => {
  const saved = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const origWarn = console.warn; console.warn = () => {};
  try {
    const a = fakeRes(); await handle(req("GET", "/api/health"), a);
    assert.equal(a.statusCode, 200);
    assert.equal(JSON.parse(a.body).ok, true);
    const b = fakeRes(); await handle(req("GET", "/api/health?ready=1"), b);
    assert.equal(b.statusCode, 503);
    assert.equal(JSON.parse(b.body).db, "down");
  } finally { if (saved !== undefined) process.env.DATABASE_URL = saved; console.warn = origWarn; }
  assert.equal(typeof register, "function");
});
