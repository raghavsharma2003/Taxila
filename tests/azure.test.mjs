// server/azure.js request shape per deployment family (ROUTER-CHANGES A1, 2026-10-04). A gpt-6 deployment that
// falls outside REASONING_FAMILY is sent max_tokens and every call is HTTP 400 — classify then returned 40/40 model
// errors and the distress backup failed open (rejected gpt6-reasoning-family-regex-400). These pin the body sent.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chat, effortFor, isReasoningFamily, DEPLOY, IMAGE } from "../server/azure.js";
import { classifyHedgeMs } from "../server/director/classify.js";

test("reasoning family: OpenAI reasoning deployments incl. every gpt-6 name; open models are not", () => {
  for (const d of ["taxila-fast", "taxila-brain", "taxila-codex", "taxila-gpt6", "taxila-gpt6-luna", "taxila-gpt6-astra", "taxila-gpt61-sol",
    "gpt-5.6-luna", "gpt-6", "gpt-6-luna", "gpt-6.1-sol", "o4-mini"]) assert.equal(isReasoningFamily(d), true, d);
  for (const d of ["grok-4-1-fast-non-reasoning", "DeepSeek-V4-Pro", "taxila-ds41", "taxila-mistral-m35", "taxila-oss120", "Kimi-K2.6", "taxila-transcribe"])
    assert.equal(isReasoningFamily(d), false, d);
});

test("effort floor: 'none' becomes 'low' on gpt-6.1-sol and gpt-6-astra only", () => {
  assert.equal(effortFor("taxila-gpt61-sol", "none"), "low");
  assert.equal(effortFor("taxila-gpt6-astra", "none"), "low");
  assert.equal(effortFor("gpt-6.1-sol", "none"), "low");
  assert.equal(effortFor("gpt-6-astra", "none"), "low");
  assert.equal(effortFor("taxila-gpt61-sol", "medium"), "medium");   // only "none" is raised
  assert.equal(effortFor("taxila-gpt6-luna", "none"), "none");
  assert.equal(effortFor("taxila-gpt6", "none"), "none");
  assert.equal(effortFor("taxila-fast", "none"), "none");
  assert.equal(effortFor("grok-4-1-fast-non-reasoning", "none"), undefined);  // open models never get reasoning_effort
  assert.equal(effortFor("taxila-fast", undefined), undefined);
});

test("gpt-6 deployments get no classify hedge, like taxila-fast; open models keep 1500 ms", () => {
  const saved = process.env.TAXILA_CLASSIFY_HEDGE_MS;
  delete process.env.TAXILA_CLASSIFY_HEDGE_MS;
  try {
    assert.equal(classifyHedgeMs("taxila-gpt6-luna"), 0);
    assert.equal(classifyHedgeMs("taxila-fast"), 0);
    assert.equal(classifyHedgeMs("grok-4-1-fast-non-reasoning"), 1500);
  } finally { if (saved !== undefined) process.env.TAXILA_CLASSIFY_HEDGE_MS = saved; }
});

test("image lane (A4): gpt-image-2.5-flare by default, quality always low, gpt-image-2 then sunburst as fallbacks", () => {
  const saved = process.env.DEPLOY_IMAGE;
  delete process.env.DEPLOY_IMAGE;
  try {
    assert.equal(DEPLOY.image, "taxila-image25-flare");
    process.env.DEPLOY_IMAGE = "taxila-image";
    assert.equal(DEPLOY.image, "taxila-image");          // env still overrides, like every other role
  } finally { if (saved === undefined) delete process.env.DEPLOY_IMAGE; else process.env.DEPLOY_IMAGE = saved; }
  assert.equal(IMAGE.quality, "low");
  assert.deepEqual([...IMAGE.fallback], ["taxila-image"]);
  assert.deepEqual([...IMAGE.diagramFallback], ["taxila-image", "taxila-image25-sunburst"]);
  assert.ok(Object.isFrozen(IMAGE));
});

// No top-level hooks: `npm test` imports every file into ONE process (tests/index.js), where a file's top-level
// beforeEach would run around every other file's tests too. The stub lives inside the test.
test("chat() body: gpt-6 gets max_completion_tokens + reasoning_effort, never max_tokens", async () => {
  const realFetch = globalThis.fetch;
  const keys = ["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT_CHAT"];
  const env = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
  process.env.AZURE_OPENAI_API_KEY = "test-key";
  delete process.env.AZURE_OPENAI_ENDPOINT_CHAT;
  const sent = [];
  globalThis.fetch = async (_url, init) => {
    sent.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: "ok" } }] }), { status: 200 });
  };
  try {
    await chat("taxila-gpt6-luna", [{ role: "user", content: "x" }], { maxTokens: 40, effort: "none" });
    await chat("taxila-gpt61-sol", [{ role: "user", content: "x" }], { maxTokens: 40, effort: "none" });
    await chat("grok-4-1-fast-non-reasoning", [{ role: "user", content: "x" }], { maxTokens: 40, effort: "none" });
  } finally {
    globalThis.fetch = realFetch;
    for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
  assert.equal(sent.length, 3);
  assert.deepEqual([sent[0].max_completion_tokens, sent[0].max_tokens, sent[0].reasoning_effort], [40, undefined, "none"]);
  assert.deepEqual([sent[1].max_completion_tokens, sent[1].max_tokens, sent[1].reasoning_effort], [40, undefined, "low"]);
  assert.deepEqual([sent[2].max_completion_tokens, sent[2].max_tokens, sent[2].reasoning_effort], [undefined, 40, undefined]);
});
