// server/azure.js request shape per deployment family (ROUTER-CHANGES A1, 2026-10-04). A gpt-6 deployment that
// falls outside REASONING_FAMILY is sent max_tokens and every call is HTTP 400 — classify then returned 40/40 model
// errors and the distress backup failed open (rejected gpt6-reasoning-family-regex-400). These pin the body sent.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { chat, effortFor, isReasoningFamily } from "../server/azure.js";
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

let realFetch, env, sent;
beforeEach(() => {
  realFetch = globalThis.fetch;
  env = { AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT_CHAT: process.env.AZURE_OPENAI_ENDPOINT_CHAT };
  process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
  process.env.AZURE_OPENAI_API_KEY = "test-key";
  delete process.env.AZURE_OPENAI_ENDPOINT_CHAT;
  sent = [];
  globalThis.fetch = async (_url, init) => {
    sent.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: "ok" } }] }), { status: 200 });
  };
});
afterEach(() => { globalThis.fetch = realFetch; for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k]; else process.env[k] = v; });

test("chat() body: gpt-6 gets max_completion_tokens + reasoning_effort, never max_tokens", async () => {
  await chat("taxila-gpt6-luna", [{ role: "user", content: "x" }], { maxTokens: 40, effort: "none" });
  assert.deepEqual([sent[0].max_completion_tokens, sent[0].max_tokens, sent[0].reasoning_effort], [40, undefined, "none"]);
  await chat("taxila-gpt61-sol", [{ role: "user", content: "x" }], { maxTokens: 40, effort: "none" });
  assert.deepEqual([sent[1].max_completion_tokens, sent[1].max_tokens, sent[1].reasoning_effort], [40, undefined, "low"]);
  await chat("grok-4-1-fast-non-reasoning", [{ role: "user", content: "x" }], { maxTokens: 40, effort: "none" });
  assert.deepEqual([sent[2].max_completion_tokens, sent[2].max_tokens, sent[2].reasoning_effort], [undefined, 40, undefined]);
});
