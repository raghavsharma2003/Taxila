// Release 12, the flight recorder (T-server): the pure parts. Masking and size fitting (gate-tested: nothing secret is ever
// recorded), the tier-2 cohort, the buffered writer (never throws, never awaits, drops counted and recorded), the client batch
// row rules, and the rule that a BROKEN recorder leaves a request's response identical.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createHash } from "node:crypto";
import { mask, fit, isMaskedKey } from "../server/trace/mask.js";
import { tierForEmail, traceMeFor } from "../server/trace/tier.js";
import { record, flushTrace, _setTraceDeps, _resetTrace, traceStats, MAX_BUFFER } from "../server/trace/writer.js";
import { clientRow } from "../server/trace/routes.js";
import { runTrace, traceIdentify, traceCtx, ridOf, pidOf } from "../server/trace/context.js";
import { traceBlobPath } from "../server/trace/blob.js";
import { outputTextOf } from "../server/trace/model.js";
import { TRACE_MAX_DATA_BYTES } from "../shared/trace.ts";

/** Run `fn` with the writer's insert captured (rows) or failing, then restore. */
async function withWriter({ fail = false, off = false } = {}, fn) {
  const rows = [];
  _resetTrace();
  _setTraceDeps({ insert: async (r) => { if (fail) throw new Error("db down"); rows.push(...r); return r.length; }, off });
  try { return await fn(rows); } finally { await flushTrace(); _setTraceDeps({ insert: null, off: null }); _resetTrace(); }
}

test("masking: passwords, PINs, emails, phones, cookies, Authorization and keys are never recorded; usage token COUNTS are", () => {
  const m = mask({
    password: "hunter2", pin: "1234", newPin: "9999", email: "parent@example.com", phone: "+91 98765 43210",
    headers: { cookie: "tx_session=abc", authorization: "Bearer abcdefghijklmnop", "x-api-key": "k" },
    sttToken: "ek_123", apiKey: "sk-xyz", nested: [{ client_secret: "s" }],
    note: "mail me at someone@school.in, auth Bearer abcdefghijklmnopqrstu", key: "AAAA",
    tokens: { in: 120, out: 30 }, tokenHash: "deadbeef", childText: "teen chauthai",
  });
  for (const k of ["password", "pin", "newPin", "email", "phone", "sttToken", "apiKey", "key"]) assert.equal(m[k], "[masked]", k);
  assert.equal(m.headers.cookie, "[masked]");
  assert.equal(m.headers.authorization, "[masked]");
  assert.equal(m.headers["x-api-key"], "[masked]");
  assert.equal(m.nested[0].client_secret, "[masked]");
  assert.ok(!m.note.includes("someone@school.in") && m.note.includes("[email]"), m.note);
  assert.ok(!m.note.includes("abcdefghijklmnopqrstu"), m.note);
  assert.deepEqual(m.tokens, { in: 120, out: 30 }, "model usage counts are kept");
  assert.equal(m.tokenHash, "deadbeef");
  assert.equal(m.childText, "teen chauthai", "tier 1 records what the child said (the owner's ask)");
  assert.ok(isMaskedKey("PASSWORD") && isMaskedKey("currentPin") && !isMaskedKey("tokens"));
});

test("fit: data over 8 KB is cut until it fits, never dropped silently; a cycle never throws", () => {
  // real text (spaces): long letter runs with no space are masked as key-like before fitting
  const big = { reply: "ek do teen ".repeat(5000), list: Array.from({ length: 500 }, (_, i) => ({ i, s: "aath nau das ".repeat(9) })) };
  const r = fit(big);
  assert.ok(r.bytes <= TRACE_MAX_DATA_BYTES, `${r.bytes}`);
  assert.equal(r.truncated, true);
  const cyc = { a: 1 }; cyc.self = cyc;
  assert.doesNotThrow(() => fit(cyc));
  const small = fit({ a: 1 });
  assert.deepEqual(small.data, { a: 1 });
});

test("tier 2 is the TAXILA_TRACE_FULL_FOR cohort only (email or its sha256), everyone else tier 1", () => {
  const env = { TAXILA_TRACE_FULL_FOR: `owner@taxila.dev, ${createHash("sha256").update("second@x.in").digest("hex")}` };
  assert.equal(tierForEmail("Owner@Taxila.dev", env), 2);
  assert.equal(tierForEmail("second@x.in", env), 2);
  assert.equal(tierForEmail("someone@else.in", env), 1);
  assert.equal(tierForEmail(null, env), 1);
  assert.equal(tierForEmail("owner@taxila.dev", {}), 1, "unset = nobody");
  assert.deepEqual(traceMeFor({ email: "owner@taxila.dev" }, env), { tier: 2 });
});

test("writer: record() is synchronous and never throws; rows carry the request's rid/sid/cid/gid; tier 2 only for the cohort", async () => {
  await withWriter({}, async (rows) => {
    const kid = "11111111-1111-4111-8111-111111111111", g = "22222222-2222-4222-8222-222222222222";
    await runTrace({ rid: "rid-abc", sid: "33333333-3333-4333-8333-333333333333", tier: 1 }, async () => {
      traceIdentify({ guardian: { id: g, email: "plain@x.in" }, child: { id: kid } });
      assert.equal(record("director.turn", { move: "hint" }), undefined);
      record("model.call.full", { prompt: "secret prompt" }, { tier: 2 }); // not the cohort: dropped silently
      const getterBomb = Object.defineProperty({}, "boom", { enumerable: true, get() { throw new Error("getter"); } });
      assert.doesNotThrow(() => record("weird", getterBomb));
    });
    record("outside", { x: 1 });
    await flushTrace();
    const turn = rows.find((r) => r.kind === "director.turn");
    assert.equal(turn.rid, "rid-abc");
    assert.equal(turn.sid, "33333333-3333-4333-8333-333333333333");
    assert.equal(turn.cid, kid);
    assert.equal(turn.gid, g);
    assert.equal(turn.src, "server");
    assert.ok(!rows.some((r) => r.kind === "model.call.full"), "tier-2 detail never recorded for a tier-1 account");
    assert.ok(rows.some((r) => r.kind === "outside" && r.sid === "server"));
  });
});

test("writer: a dead database drops (counted), never grows without bound, and records trace.dropped once it can write", async () => {
  await withWriter({ fail: true }, async () => {
    for (let i = 0; i < 50; i++) record("x", { i });
    await flushTrace();
    assert.equal(traceStats().dropped, 50);
    assert.equal(traceStats().buffered, 0);
  });
  // the cap: over MAX_BUFFER events are dropped at once (no allocation), counted
  _resetTrace();
  _setTraceDeps({ insert: () => new Promise(() => {}), off: false }); // a hung insert
  for (let i = 0; i < MAX_BUFFER + 25; i++) record("y", { i });
  assert.ok(traceStats().dropped >= 25, JSON.stringify(traceStats()));
  _setTraceDeps({ insert: null, off: null }); _resetTrace();
  // the counter is itself recorded when the writer can write again
  await withWriter({}, async (rows) => {
    _setTraceDeps({ insert: async () => { throw new Error("down"); } });
    record("z", {}); await flushTrace();
    _setTraceDeps({ insert: async (r) => { rows.push(...r); return r.length; } });
    record("after", {}); await flushTrace();
    const d = rows.find((r) => r.kind === "trace.dropped");
    assert.ok(d && d.data.dropped >= 1, JSON.stringify(rows.map((r) => r.kind)));
  });
});

test("writer: a HUNG insert never stalls the recorder: past its deadline the chunk is dropped (counted) and later events are written", async () => {
  const { INSERT_DEADLINE_MS } = await import("../server/trace/writer.js");
  assert.ok(INSERT_DEADLINE_MS > 0);
  await withWriter({}, async (rows) => {
    process.env.TAXILA_TRACE_INSERT_MS = "50";
    let hang = true;
    _setTraceDeps({ insert: (r) => (hang ? new Promise(() => {}) : (rows.push(...r), Promise.resolve(r.length))) });
    record("first", {});
    const t0 = Date.now();
    await flushTrace();
    assert.ok(Date.now() - t0 < INSERT_DEADLINE_MS + 2000, "the flush returned (no hang)");
    hang = false;
    record("second", {});
    await flushTrace();
    assert.ok(rows.some((r) => r.kind === "second"), rows.map((r) => r.kind).join(","));
    delete process.env.TAXILA_TRACE_INSERT_MS;
  });
});

test("TAXILA_TRACE=off (or the off switch) records nothing", async () => {
  await withWriter({ off: true }, async (rows) => {
    record("x", { a: 1 }); await flushTrace();
    assert.equal(rows.length, 0);
  });
});

test("client batch rows: src must be client, tier 2 needs the cohort, cid only from a lesson this guardian owns", () => {
  const lesson = "44444444-4444-4444-8444-444444444444", child = "55555555-5555-4555-8555-555555555555";
  const childOf = new Map([[lesson, child]]);
  const base = { kind: "ui.tap", seq: 1, t: 1_700_000_000_000, sid: lesson, tier: 1, data: { label: "Done", password: "x" } };
  const r = clientRow({ ...base, cid: "attacker-chosen" }, { pid: "pid-123456", gid: "g", tier: 1, childOf, skewMs: 250 });
  assert.equal(r.cid, child, "the server's mapping, never the client's cid");
  assert.equal(r.t, base.t - 250, "client clock corrected by the measured skew");
  assert.equal(r.data.password, "[masked]");
  assert.equal(clientRow({ ...base, src: "server" }, { pid: "pid-123456", childOf }), null, "a client cannot write server events");
  assert.equal(clientRow({ ...base, tier: 2 }, { pid: "pid-123456", tier: 1, childOf }), null, "tier 2 refused outside the cohort");
  assert.ok(clientRow({ ...base, tier: 2 }, { pid: "pid-123456", tier: 2, childOf }));
  assert.equal(clientRow({ ...base, t: "soon" }, { pid: "pid-123456", childOf }), null);
  assert.equal(clientRow({ ...base, sid: "someone-elses-lesson" }, { pid: "pid-123456", childOf }).cid, null);
});

test("model.call output text from chat completions and the responses API", () => {
  assert.equal(outputTextOf({ choices: [{ message: { content: "hi" } }] }), "hi");
  assert.equal(outputTextOf({ output_text: "yo" }), "yo");
  assert.equal(outputTextOf({ output: [{ content: [{ text: "a" }, { text: "b" }] }] }), "ab");
  assert.equal(outputTextOf(null), null);
});

test("a BROKEN recorder leaves a request identical: same status, body and headers (bar the rid), and nothing thrown", async () => {
  const { handle, register } = await import("../server/router.js");
  const { send } = await import("../server/http.js");
  register({ "POST /api/r12-recorder-probe": (req, res, body) => send(res, 200, { echo: body.n * 2, path: "probe", list: [1, 2, 3] }) });
  const server = http.createServer(handle);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async () => {
    const r = await fetch(`${base}/api/r12-recorder-probe`, { method: "POST", headers: { "content-type": "application/json", "x-taxila-rid": "rid-fixed-123" }, body: JSON.stringify({ n: 21 }) });
    const h = Object.fromEntries([...r.headers].filter(([k]) => !["date", "x-taxila-rid", "connection", "keep-alive"].includes(k)));
    return { status: r.status, body: await r.text(), h };
  };
  try {
    const off = await withWriter({ off: true }, call);
    const broken = await withWriter({ fail: true }, async () => {
      const out = await call();
      await new Promise((r) => setTimeout(r, 20)); // the finish listener ran
      return out;
    });
    // a recorder whose fit throws on every event (a bug in it) changes nothing either
    const mod = await import("../server/trace/mask.js");
    assert.deepEqual(broken, off);
    assert.equal(off.status, 200);
    assert.equal(JSON.parse(off.body).echo, 42);
    assert.equal(typeof mod.fit, "function");
  } finally { server.close(); }
});

test("the request store is per request: concurrent requests never see each other's context", async () => {
  const seen = [];
  await Promise.all([1, 2, 3].map((i) => runTrace({ rid: `r${i}`, tier: 1 }, async () => {
    await new Promise((r) => setTimeout(r, 5 * (4 - i)));
    seen.push([i, traceCtx().rid]);
  })));
  for (const [i, rid] of seen) assert.equal(rid, `r${i}`);
});

test("EventSource ids ride the query (_rid / _pid) when no header can; audio blob seqs like b3 keep their name", () => {
  assert.equal(ridOf({ url: "/api/studio/stream?lessonId=x&_rid=r-abc123", headers: {} }), "r-abc123");
  assert.equal(ridOf({ url: "/api/x?_rid=r-abc123", headers: { "x-taxila-rid": "hdr-99999" } }), "hdr-99999"); // the header wins
  assert.match(ridOf({ url: "/api/x?_rid=<script>", headers: {} }), /^[0-9a-f-]{36}$/); // junk → a fresh one
  assert.equal(pidOf({ url: "/api/studio/stream?_pid=page-123456", headers: {} }), "page-123456");
  assert.equal(pidOf({ url: "/api/x", headers: {} }), "");
  const t = Date.UTC(2026, 9, 11);
  assert.equal(traceBlobPath({ sid: "lesson-1", src: "client", seq: "b3", ext: "webm", t }), "2026-10-11/lesson-1/client-b3.webm");
  assert.equal(traceBlobPath({ sid: "lesson-1", src: "client", seq: 7, ext: "json", t }), "2026-10-11/lesson-1/client-7.json");
});

test("an event too big to fit keeps its own small fields: srv.res never renders as '← undefined undefined undefinedms'", async () => {
  const huge = { route: "GET /api/parent/report", status: 200, ms: 41,
    body: { weeks: Array.from({ length: 150 }, (_, i) => ({ i, notes: Array.from({ length: 30 }, () => ({ s: "ek do teen ".repeat(8) })) })) } };
  const a = fit(huge);
  assert.ok(Buffer.byteLength(JSON.stringify(a.data)) <= TRACE_MAX_DATA_BYTES);
  assert.deepEqual([a.data.route, a.data.status, a.data.ms, a.truncated], ["GET /api/parent/report", 200, 41, true]);
  const wide = { route: "GET /api/x", status: 500, ms: 7, body: Object.fromEntries(Array.from({ length: 3000 }, (_, i) => [`k${i}`, "v ".repeat(20)])) };
  const b = fit(wide);
  assert.deepEqual([b.data.route, b.data.status, b.data.ms, b.data._truncated], ["GET /api/x", 500, 7, true]);
  const { lineFor } = await import("../scripts/trace.mjs");
  const t = Date.UTC(2026, 9, 11, 12);
  assert.match(lineFor({ kind: "srv.res", src: "server", t, data: b.data }), /← GET \/api\/x 500 7ms \(body cut\)/);
  const bare = lineFor({ kind: "srv.res", src: "server", t, data: { _truncated: true } });
  assert.doesNotMatch(bare, /undefined/);
  assert.doesNotMatch(lineFor({ kind: "srv.req", src: "server", t, data: {} }), /undefined/);
  assert.match(lineFor({ kind: "tts.end", src: "server", t, data: { status: "ok", bytes: 9600, ms: 800, engines: ["dhd"] } }), /audio stream ok 9600 bytes/);
});
