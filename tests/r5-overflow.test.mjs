// round 5 (14.2): a 429 on a CHAT deployment with a twin on the overflow account moves its one retry there at once
// (server/azure.js overflowFor). TEST lesson 5d18d152 and production at 06 UTC on 2026-10-15 (51 of 361 taxila-fast calls)
// were throttled by load sharing the eastus2 deployment, and a throttled reply is the fallback line the child hears.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { chat, chatStream, overflowFor, isContentFilter } from "../server/azure.js";

const PRIMARY = "https://primary.example.test/openai/v1", OVER = "https://overflow.example.test/openai/v1";
describe("429 overflow (scoped: the fetch and env stubs never leak into other files run in one process)", () => {
let realFetch, env, calls;
beforeEach(() => {
  realFetch = globalThis.fetch; env = { ...process.env }; calls = [];
  Object.assign(process.env, { AZURE_OPENAI_ENDPOINT: PRIMARY, AZURE_OPENAI_API_KEY: "k-primary", AZURE_OPENAI_ENDPOINT_OVERFLOW: OVER,
    AZURE_OPENAI_API_KEY_OVERFLOW: "k-over", TAXILA_OVERFLOW_DEPLOYMENTS: "taxila-fast, taxila-brain" });
});
afterEach(() => {
  globalThis.fetch = realFetch;
  for (const k of ["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT_OVERFLOW", "AZURE_OPENAI_API_KEY_OVERFLOW", "TAXILA_OVERFLOW_DEPLOYMENTS"])
    if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k];
});
const ok = (text = "ok") => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: text } }], usage: { prompt_tokens: 3, completion_tokens: 1 } }), { status: 200 });
const tooMany = () => new Response(JSON.stringify({ error: { code: "429", message: "Your requests to gpt-5.6-luna for taxila-fast in eastus2 have exceeded token rate limit." } }), { status: 429 });
const stub = (fn) => { globalThis.fetch = async (url, init) => { const c = { host: new URL(url).host.split(".")[0], key: init.headers["api-key"] }; calls.push(c); return fn(c, calls.length); }; };
const M = [{ role: "user", content: "x" }];

test("overflowFor: CHAT lane, a named twin and a configured account only", () => {
  assert.equal(overflowFor("CHAT", "taxila-fast"), "OVERFLOW");
  assert.equal(overflowFor("CHAT", "taxila-brain"), "OVERFLOW");
  assert.equal(overflowFor("CHAT", "grok-4-1-fast-non-reasoning"), null, "no twin named");
  assert.equal(overflowFor("TTS", "taxila-fast"), null, "other lanes never move");
  delete process.env.AZURE_OPENAI_ENDPOINT_OVERFLOW;
  assert.equal(overflowFor("CHAT", "taxila-fast"), null, "no overflow account: as before");
});

test("a 429 moves the retry to the twin at once, with the twin's own key", async () => {
  stub((c) => (c.host === "primary" ? tooMany() : ok("from the twin")));
  const t0 = Date.now();
  const r = await chat("taxila-fast", M);
  assert.equal(r.text, "from the twin");
  assert.deepEqual(calls, [{ host: "primary", key: "k-primary" }, { host: "overflow", key: "k-over" }]);
  assert.ok(Date.now() - t0 < 400, "no retry delay before the twin");
});

test("retries: 0 still gets the one move on a 429 (a 429 answers in milliseconds); never a third call", async () => {
  stub((c) => (c.host === "primary" ? tooMany() : ok()));
  assert.equal((await chat("taxila-fast", M, { retries: 0 })).text, "ok");
  calls = [];
  stub(() => tooMany());
  await assert.rejects(chat("taxila-fast", M), (e) => e.status === 429);
  assert.deepEqual(calls.map((c) => c.host), ["primary", "overflow"], "the twin's 429 is final");
});

test("no twin, another error, or a filter block: exactly as before (same account)", async () => {
  stub((_c, n) => (n === 1 ? tooMany() : ok()));
  await chat("grok-4-1-fast-non-reasoning", M);
  assert.deepEqual(calls.map((c) => c.host), ["primary", "primary"]);
  calls = [];
  stub((_c, n) => (n === 1 ? new Response("upstream", { status: 503 }) : ok()));
  await chat("taxila-fast", M);
  assert.deepEqual(calls.map((c) => c.host), ["primary", "primary"], "a 5xx retries where it was");
  calls = [];
  stub(() => new Response(JSON.stringify({ error: { code: "content_filter", message: "filtered" } }), { status: 400 }));
  await assert.rejects(chat("taxila-fast", M), (e) => isContentFilter(e));
  assert.deepEqual(calls.map((c) => c.host), ["primary"], "a filter block is never sent anywhere else");
});

test("chatStream: a 429 (before any delta) restarts the stream whole on the twin", async () => {
  const sse = (s) => new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(s)); c.close(); } }), { status: 200, headers: { "content-type": "text/event-stream" } });
  stub((c) => (c.host === "primary" ? tooMany() : sse(`data: ${JSON.stringify({ choices: [{ delta: { content: "namaste" } }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`)));
  const r = await chatStream("taxila-fast", [{ role: "system", content: "s" }, ...M], { quotaLane: "hot" });
  assert.equal(r.text, "namaste");
  assert.deepEqual(calls.map((c) => c.host), ["primary", "overflow"]);
  calls = [];
  stub(() => tooMany());
  await assert.rejects(chatStream("taxila-fast", [{ role: "system", content: "s" }, ...M], { quotaLane: "hot" }), (e) => e.status === 429);
  assert.equal(calls.length, 2, "one restart, no more");
});
test("stream 3's review: a 5xx then a 429 never makes a third call (only the first attempt's 429 moves)", async () => {
  stub((_c, n) => (n === 1 ? new Response("upstream", { status: 503 }) : tooMany()));
  await assert.rejects(chat("taxila-fast", M), (e) => e.status === 429);
  assert.deepEqual(calls.map((c) => c.host), ["primary", "primary"]);
});

test("stream 3's review: the arms of one hedged call move once between them (one twin call per throttled reply)", async () => {
  stub(async (c) => {
    if (c.host === "primary") return tooMany();
    await new Promise((r) => setTimeout(r, 250)); // the twin is slower than the hedge
    return ok("twin");
  });
  const r = await chat("taxila-fast", M, { hedgeMs: 60 });
  assert.equal(r.text, "twin");
  assert.equal(calls.filter((c) => c.host === "overflow").length, 1, JSON.stringify(calls));
  assert.equal(calls.filter((c) => c.host === "primary").length, 2, "the hedge still tried the primary (it may have recovered)");
});

test("stream 3's review: a speculative bet (overflow: false) and background work never take the overflow", async () => {
  stub(() => tooMany());
  await assert.rejects(chat("taxila-fast", M, { overflow: false }), (e) => e.status === 429);
  // background on a twin-listed deployment no hot lane shares (taxila-brain): lanes never queue it, so only the rule is tested
  await assert.rejects(chat("taxila-brain", M, { quotaLane: "background" }), (e) => e.status === 429);
  await assert.rejects(chatStream("taxila-brain", [{ role: "system", content: "s" }, ...M], { quotaLane: "background" }), (e) => e.status === 429);
  await assert.rejects(chatStream("taxila-fast", [{ role: "system", content: "s" }, ...M], { quotaLane: "hot", overflow: false }), (e) => e.status === 429);
  assert.equal(calls.filter((c) => c.host === "overflow").length, 0, JSON.stringify(calls));
});
});
