// round 5 (14.4, main's GO 2026-10-21): the hot reply's hedge twin goes to the overflow account (server/azure.js chat twin).
// 2026-10-16 08-10 UTC the primary reply account stood at the 6 s cap on 29% of taxila-fast calls, and a twin on the SAME
// deployment hit the same wall; evals/latency/reply-hedge-arm.mjs: hung primary 0/12 answered vs 12/12 on the twin.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { chat } from "../server/azure.js";
import { _setTraceDeps, _resetTrace, flushTrace } from "../server/trace/writer.js";

const PRIMARY = "https://primary.example.test/openai/v1", OVER = "https://overflow.example.test/openai/v1";
describe("reply twin on the overflow account (scoped: fetch and env stubs restored after each test)", () => {
let realFetch, env, calls;
const KEYS = ["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT_OVERFLOW", "AZURE_OPENAI_API_KEY_OVERFLOW", "TAXILA_OVERFLOW_DEPLOYMENTS", "TAXILA_REPLY_TWIN"];
beforeEach(() => {
  realFetch = globalThis.fetch; env = { ...process.env }; calls = [];
  Object.assign(process.env, { AZURE_OPENAI_ENDPOINT: PRIMARY, AZURE_OPENAI_API_KEY: "k-primary", AZURE_OPENAI_ENDPOINT_OVERFLOW: OVER,
    AZURE_OPENAI_API_KEY_OVERFLOW: "k-over", TAXILA_OVERFLOW_DEPLOYMENTS: "taxila-fast" });
  delete process.env.TAXILA_REPLY_TWIN;
});
afterEach(() => { globalThis.fetch = realFetch; for (const k of KEYS) if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k]; });
const ok = (text) => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: text } }], usage: { prompt_tokens: 3, completion_tokens: 1 } }), { status: 200 });
/** primary: "hang" (answers only when aborted: never) | ms to answer after; the overflow answers at once */
const stub = (primary) => { globalThis.fetch = async (url, init) => {
  const host = new URL(url).host;
  if (!host.endsWith(".example.test")) return realFetch(url, init);
  calls.push(host.split(".")[0]);
  if (host.startsWith("overflow")) return ok("from the twin");
  return new Promise((resolve, reject) => {
    if (primary !== "hang") setTimeout(() => resolve(ok("from the primary")), primary);
    init.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true });
  });
}; };
const M = [{ role: "user", content: "x" }];
const REPLY = { hedgeMs: 60, timeoutMs: 2000, twin: "overflow" };

test("a hung primary: the reply answers from the twin on the overflow account, at the hedge point", async () => {
  stub("hang");
  const t0 = Date.now();
  const r = await chat("taxila-fast", M, REPLY);
  assert.equal(r.text, "from the twin");
  assert.deepEqual(calls, ["primary", "overflow"]);
  assert.ok(Date.now() - t0 < 1000, "long before the timeout");
});

test("every firing leaves a reply.twin trace code: which arm answered and when (codes only)", async () => {
  const rows = [];
  _resetTrace();
  _setTraceDeps({ off: false, insert: async (r) => { rows.push(...r); } });
  try {
    stub("hang");
    await chat("taxila-fast", M, REPLY);
    await new Promise((res) => setTimeout(res, 20));
    await flushTrace();
    const tw = rows.filter((r) => r.kind === "reply.twin");
    assert.equal(tw.length, 1);
    assert.equal(tw[0].data.winner, "twin");
    assert.equal(tw[0].data.deployment, "taxila-fast");
    assert.ok(Number.isFinite(tw[0].data.firedAtMs) && Number.isFinite(tw[0].data.ms));
    assert.deepEqual(Object.keys(tw[0].data).sort(), ["deployment", "firedAtMs", "ms", "winner"]);
  } finally { _setTraceDeps({ off: null, insert: null }); _resetTrace(); }
});

test("the twin never fires on a call that answers before the hedge point", async () => {
  stub(10);
  const r = await chat("taxila-fast", M, REPLY);
  assert.equal(r.text, "from the primary");
  await new Promise((res) => setTimeout(res, 120)); // past the hedge point: nothing more may start
  assert.deepEqual(calls, ["primary"]);
});

test("never for a speculative bet (overflow: false), a background call, a call that did not opt in, or with the switch off", async () => {
  for (const opts of [{ ...REPLY, overflow: false }, { ...REPLY, quotaLane: "background" }, { hedgeMs: 60, timeoutMs: 2000 }]) {
    stub(150); calls = [];
    const r = await chat("taxila-fast", M, opts);
    assert.equal(r.text, "from the primary", JSON.stringify(opts));
    assert.deepEqual(calls, ["primary", "primary"], `the twin stays on the same deployment: ${JSON.stringify(opts)}`);
  }
  process.env.TAXILA_REPLY_TWIN = "off";
  stub(150); calls = [];
  await chat("taxila-fast", M, REPLY);
  assert.deepEqual(calls, ["primary", "primary"], "switched off: as before");
});

test("a deployment with no named twin keeps today's same-deployment hedge", async () => {
  stub(150);
  const r = await chat("taxila-brain", M, REPLY);
  assert.equal(r.text, "from the primary");
  assert.deepEqual(calls, ["primary", "primary"]);
});
});
