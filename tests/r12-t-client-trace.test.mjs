// Release 12 · T-client: the flight recorder's client core, without a browser. Masking (gate-tested: never a password,
// PIN, email, phone, token, cookie or Authorization value), the bus (batches, the 256 KB cap, tier-2 events refused at
// tier 1, it never throws), and the /api fetch wrapper (X-Taxila-Rid on /api only, never on /api/trace/*; the app's
// response and rejection are returned untouched; a recorder fault falls back to the original call).
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { TRACE_MAX_BATCH_BYTES, TRACE_RID_HEADER } from "../shared/trace.ts";

describe("r12 T-client: masking", async () => {
  const { maskDeep, maskString, maskBody, maskedKey, fitData, MASK } = await import("../src/trace/mask.ts");
  it("secret keys are masked at any depth", () => {
    const m = maskDeep({ email: "a@b.co", phone: "9876543210", password: "x", pin: "1234", newPin: "9", nested: { token: "t", authorization: "Bearer abc", list: [{ apiKey: "k" }] }, childText: "seven" });
    assert.equal(m.email, MASK); assert.equal(m.phone, MASK); assert.equal(m.password, MASK); assert.equal(m.pin, MASK); assert.equal(m.newPin, MASK);
    assert.equal(m.nested.token, MASK); assert.equal(m.nested.authorization, MASK); assert.equal(m.nested.list[0].apiKey, MASK);
    assert.equal(m.childText, "seven", "an answer is kept");
    for (const k of ["guardianEmail", "newPassword", "pinHash", "mobile", "otpCode", "set-cookie", "x-api-key", "ephemeralKey"]) assert.ok(maskedKey(k), k);
    for (const k of ["text", "answer", "pinned", "spinner", "topic", "kind"]) assert.ok(!maskedKey(k), k);
  });
  it("emails, phone numbers and bearer tokens inside free text are masked", () => {
    const s = maskString("mail me at riya.k@example.in or call +91 98765 43210, Authorization: Bearer abcdef1234567890");
    assert.doesNotMatch(s, /example\.in|98765|abcdef1234567890/);
    assert.equal(maskString("half of 12 is 6, and 45236 has 5 places"), "half of 12 is 6, and 45236 has 5 places", "numbers in a lesson are not phone numbers");
  });
  it("a JSON body is parsed and masked; data is capped to 8 KB", () => {
    assert.deepEqual(maskBody('{"email":"a@b.co","text":"hi"}'), { email: MASK, text: "hi" });
    const big = fitData({ blob: "x".repeat(50_000), n: 1 });
    assert.ok(JSON.stringify(big).length <= 8 * 1024);
  });
  it("never throws on hostile data", () => {
    const evil = {}; Object.defineProperty(evil, "boom", { enumerable: true, get() { throw new Error("getter"); } });
    const cyc = { a: 1 }; cyc.self = cyc;
    assert.doesNotThrow(() => maskDeep(evil));
    assert.doesNotThrow(() => fitData({ cyc }));
  });
});

describe("r12 T-client: the bus and the fetch wrapper", async () => {
  // other test files in the same process replace globalThis.location concurrently (r4-kaksha-*): the wrapper reads it
  // synchronously at the call, so each call below sets it in the same tick
  const here = () => { globalThis.location = { href: "http://app.test/c/x", origin: "http://app.test", pathname: "/c/x", search: "" }; };
  here();
  const bus = await import("../src/trace/bus.ts");
  const { wrapFetch } = await import("../src/trace/net.ts");
  const sent = [];
  const send = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Response(JSON.stringify({ accepted: 1, rejected: 0, tier: 1 }), { headers: { "content-type": "application/json" } }); };
  const seen = [];
  before(() => { bus.start(send); bus.setSink((e) => seen.push(e)); });
  after(() => { bus.stop(); bus.setSink(null); });

  it("events carry v, pid, sid, seq, t, kind and masked data; tier-2 events are refused at tier 1", async () => {
    bus.emit("ui.tap", { label: "Start", email: "a@b.co" });
    bus.emit("rrweb.chunk", { n: 1 }, { tier: 2 });
    const tap = seen.find((e) => e.kind === "ui.tap");
    assert.equal(tap.v, 1); assert.equal(tap.src, "client"); assert.ok(tap.pid && tap.sid && tap.seq > 0 && tap.t > 0);
    assert.equal(tap.data.email, "[masked]");
    assert.ok(!seen.some((e) => e.kind === "rrweb.chunk"), "no tier-2 event from a tier-1 account");
    await bus.flush();
    assert.equal(sent.at(-1).url, "/api/trace/batch");
    assert.equal(sent.at(-1).body.v, 1);
  });
  it("a large backlog goes in batches each under 256 KB", async () => {
    sent.length = 0;
    for (let i = 0; i < 120; i++) bus.emit("net.res", { body: "y".repeat(7000), i });
    await bus.flush();
    assert.ok(sent.length >= 2, `${sent.length} batches`);
    for (const s of sent) assert.ok(JSON.stringify(s.body).length < TRACE_MAX_BATCH_BYTES, "under the cap");
    assert.equal(sent.reduce((n, s) => n + s.body.events.length, 0), 120);
  });
  it("the session follows the lesson", () => {
    bus.setSession("lesson-1");
    assert.equal(bus.sid(), "lesson-1");
    bus.emit("ui.state", { floor: "your_turn" });
    assert.equal(seen.at(-1).sid, "lesson-1");
    bus.setSession(null);
    assert.equal(bus.sid(), bus.pid());
  });
  it("emit never throws, even when its own sink does", () => {
    bus.setSink(() => { throw new Error("broken"); });
    assert.doesNotThrow(() => bus.emit("ui.tap", { label: "x" }));
    bus.setSink((e) => seen.push(e));
  });

  it("/api calls get X-Taxila-Rid; /api/trace/* and other origins do not; the response is the app's own", async () => {
    const calls = [];
    const resp = new Response('{"ok":true,"email":"a@b.co"}', { headers: { "content-type": "application/json" } });
    const orig = async (input, init) => { calls.push({ input, init }); return resp; };
    const f = wrapFetch(orig);
    here();
    const r = await f("/api/lesson/turn", { method: "POST", body: JSON.stringify({ childText: "two", password: "p" }) });
    assert.equal(r, resp, "the same Response object reaches the app");
    assert.ok(new Headers(calls[0].init.headers).get(TRACE_RID_HEADER));
    here();
    await f("/api/trace/batch", { method: "POST", body: "{}" });
    assert.equal(calls[1].init?.headers, undefined, "the recorder never tags or records itself");
    here();
    await f("https://elsewhere.test/api/x");
    assert.equal(calls[2].init, undefined);
    await new Promise((res) => setTimeout(res, 20));
    const req = seen.find((e) => e.kind === "net.req" && e.data.path === "/api/lesson/turn");
    assert.equal(req.data.body.password, "[masked]");
    assert.equal(req.data.body.childText, "two");
    const res = seen.find((e) => e.kind === "net.res" && e.data.path === "/api/lesson/turn");
    assert.equal(res.data.status, 200); assert.equal(res.data.body.email, "[masked]");
    assert.equal(res.rid, req.rid);
  });
  it("a failing call rejects exactly as without the recorder", async () => {
    const boom = new TypeError("Failed to fetch");
    const f = wrapFetch(async () => { throw boom; });
    here();
    await assert.rejects(f("/api/lesson/turn"), (e) => e === boom);
    await new Promise((res) => setTimeout(res, 5));
    assert.ok(seen.some((e) => e.kind === "net.err" && /Failed to fetch/.test(e.data.error)));
  });
  it("a recorder fault inside the wrapper falls back to the original call", async () => {
    const resp = new Response("ok");
    const f = wrapFetch(async () => resp);
    const weird = { get url() { throw new Error("hostile input"); } };
    here();
    assert.equal(await f(weird), resp);
  });
  it("the tier is learned from /api/me's trace.tier", async () => {
    const f = wrapFetch(async () => new Response(JSON.stringify({ guardian: {}, children: [], trace: { tier: 2 } }), { headers: { "content-type": "application/json" } }));
    here();
    await f("/api/me");
    await new Promise((res) => setTimeout(res, 20));
    assert.equal(bus.getTier(), 2);
    bus.setTier(1);
  });
});

describe("r12 T-client: the voice sink (globalThis.__taxilaTrace, T-voice's src/voice/trace.ts)", async () => {
  const { voiceSink } = await import("../src/trace/index.ts");
  it("has the shape T-voice looks for, and never throws", async () => {
    assert.equal(typeof voiceSink.emit, "function");
    assert.equal(typeof voiceSink.full, "function");
    assert.equal(typeof voiceSink.blob, "function");
    assert.equal(voiceSink.full(), false, "tier 1 by default");
    assert.doesNotThrow(() => voiceSink.emit("asr.final", { text: "two" }, { tier: 1, turn: 3 }));
    assert.equal(await voiceSink.blob("audio.mic.chunk", new Blob(["x"], { type: "audio/webm" }), {}), false, "no audio below tier 2");
  });
});

describe("r12 T-client: the replay reads the recorder's store (scripts/trace.mjs --replay → scripts/trace-replay.mjs)", async () => {
  const { eventsForSession, resolveSession } = await import("../scripts/trace-replay.mjs");
  const SID = "3f2b6c1e-8a4d-4c2e-9b7f-1a2b3c4d5e6f", PID = "p-load-1";
  const rows = [
    { sid: PID, pid: PID, t: "2026-10-11T23:59:58Z", data: { seq: 1, blob: { ref: "2026-10-11/p-load-1/client-1.json" } } },
    { sid: SID, pid: PID, t: "2026-10-11T23:59:59Z", data: { seq: 2, beacon: true } }, // no ref: rebuilt, and it arrived the next day
    { sid: SID, pid: PID, t: "2026-10-12T00:00:05Z", data: { seq: 3, failed: 503 } }, // never stored
  ];
  const blobs = { "2026-10-11/p-load-1/client-1.json": JSON.stringify([{ type: 4, timestamp: 2, data: { href: "http://x/" } }, { type: 2, timestamp: 3 }]),
    [`2026-10-12/${SID}/client-2.json`]: JSON.stringify([{ type: 3, timestamp: 9 }, { type: 3, timestamp: 1 }]) };
  const q = async (sql, params) => {
    if (/select distinct pid/.test(sql)) return params[0] === SID ? [{ pid: PID }] : [];
    if (/cid::text like/.test(sql)) return [];
    if (/rrweb\.chunk/.test(sql)) return rows.filter((r) => params[0].includes(r.sid) || params[1].includes(r.pid));
    throw new Error(sql);
  };
  it("a lesson id brings the page loads that led into it; a pid is its own key", async () => {
    assert.deepEqual(await resolveSession(q, SID), { sids: [SID], pids: [PID] });
    assert.deepEqual(await resolveSession(q, PID), { sids: [PID], pids: [PID] });
  });
  it("chunks by ref, a beacon chunk by its rebuilt path, a missing one skipped; events in time order", async () => {
    const log = [];
    const ev = await eventsForSession(SID, { q, read: async (ref) => blobs[ref] ?? null, log: (m) => log.push(m) });
    assert.deepEqual(ev.map((e) => e.timestamp), [1, 2, 3, 9]);
    assert.match(log.at(-1), /3 chunks, 1 missing, 4 events/);
  });
});
