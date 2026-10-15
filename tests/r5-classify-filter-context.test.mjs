// round 5 (14.2, main safety review; sim lab 14.1 text lane, TEST lesson 5d18d152 turn 2): the labeller's prompt for
// "maine bola na, Bollywood songs pasand hain, dance waale, jaise 'Kala Chashma' type" (class 6, Unity in Diversity) came back
// `hate` while the reader passed the same words twice, and the child got the helpline script. A harm block on the labels
// now probes the child's words ALONE (the distress check); only a clean pass reads as a block of the context.
// Every other probe outcome fails CLOSED exactly as before.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { classify, targetFor } from "../server/director/classify.js";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { comprehensionReasons } from "../server/brain/trace.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const blocked = (cats) => new Response(JSON.stringify({ error: { code: "content_filter", status: 400, message: "The response was filtered due to the prompt triggering Azure OpenAI's content management policy.",
  innererror: { code: "ResponsibleAIPolicyViolation", content_filter_result: Object.fromEntries(["hate", "sexual", "violence", "self_harm"].map((c) => [c, { filtered: cats.includes(c), severity: cats.includes(c) ? "medium" : "safe" }])) } } }), { status: 400 });
const json = (o) => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(o) } }] }), { status: 200 });
const isProbe = (body) => /^A reply from an Indian school child/.test(body.messages?.[0]?.content ?? "");

describe("classifier label block: the child's words alone (scoped: fetch and env stubs stay in this suite)", () => {
let realFetch, env;
beforeEach(() => {
  realFetch = globalThis.fetch; env = { ...process.env };
  process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
  process.env.AZURE_OPENAI_API_KEY = "test-key";
  process.env.DEPLOY_CLASSIFY = "taxila-fast";
  process.env.TAXILA_CLASSIFY_HEDGE_MS = "0";
});
afterEach(() => { globalThis.fetch = realFetch; for (const k of ["DEPLOY_CLASSIFY", "TAXILA_CLASSIFY_HEDGE_MS", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY"]) if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k]; });

function practiceState() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 5; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (i + 1) * 20_000 });
  return { ...r.state, mode: "cascade" };
}
const TEXT = "maine bola na, Bollywood songs pasand hain, dance waale, jaise 'Kala Chashma' type";
const run = async (probe) => {
  const s = practiceState(), seen = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    seen.push(isProbe(body) ? "probe" : "labels");
    return isProbe(body) ? probe(body) : blocked(["hate"]);
  };
  const out = await classify({ target: targetFor(s, K, findItem(s, K, s.activeItemId)), childText: TEXT, typed: false, asrConfidence: 0.92, classLevel: 6 });
  return { out, seen };
};

test("a harm block on the labels whose words pass alone is a context block: no evidence, no safeguard", async () => {
  const { out, seen } = await run((body) => {
    assert.equal(body.messages.length, 2);
    assert.equal(body.messages[1].content, TEXT, "the probe carries the child's words and nothing of the lesson");
    return json({ distress: false });
  });
  assert.deepEqual(seen, ["labels", "probe"]);
  assert.equal(out.flags.distress, false);
  assert.equal(out.outcome, "no_evidence");
  assert.equal(out.source, "content_filter_context");
  assert.ok(comprehensionReasons({ cls: out, classified: true }).includes("cls_source.content_filter_context"));
});

test("the words alone tripping the filter, read as distress, or not checkable at all: fails CLOSED as before", async () => {
  for (const [name, probe] of [
    ["probe blocked on a harm category", () => blocked(["hate"])],
    ["probe blocked, categories unreadable", () => new Response(JSON.stringify({ error: { code: "content_filter" } }), { status: 400 })],
    ["probe reads distress", () => json({ distress: true })],
    ["probe unavailable (500)", () => new Response("upstream", { status: 500 })],
    ["probe throttled (429)", () => new Response(JSON.stringify({ error: { code: "429", message: "rate limit" } }), { status: 429, headers: { "retry-after": "0" } })],
  ]) {
    const { out } = await run(probe);
    assert.equal(out.flags.distress, true, name);
    assert.equal(out.source, "content_filter", name);
  }
});
});
