// Child-safety floor: the Azure content filter blocking a child's turn is a distress signal, and every model path
// that reads the child's words fails CLOSED on it — the classifier (grok and taxila-fast deployments), its hedged
// duplicate, the low-ASR distress backup, and the teacher-reply call. A block never reads as "safe" and never
// becomes a normal reply: the turn is a safeguard move (Childline 1098 / Tele-MANAS 14416) with an incident row.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { bodyIsContentFilter, isContentFilter, chat, AzureError } from "../server/azure.js";
import { classify, classifyFast, hedged, targetFor } from "../server/director/classify.js";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { __test } from "../server/routes/lesson.js";
import { kit, CTX, BRIEF, cls } from "./fixtures/kit.mjs";

const K = kit();
const { planTurn, textReply } = __test;

// The three shapes a block arrives in (context/rejected.md#router-s-filter-artifact for the non-OpenAI one).
const SHAPES = {
  "400 error.code content_filter (OpenAI deployment)": () => new Response(JSON.stringify({ error: { code: "content_filter", message: "The response was filtered due to the prompt triggering Azure OpenAI's content management policy.", innererror: { code: "ResponsibleAIPolicyViolation" } } }), { status: 400 }),
  "400 choices[0].finish_reason content_filter (non-OpenAI Foundry model)": () => new Response(JSON.stringify({ choices: [{ finish_reason: "content_filter", message: { content: "" } }] }), { status: 400 }),
  "200 finish_reason content_filter (filtered completion)": () => new Response(JSON.stringify({ choices: [{ finish_reason: "content_filter", message: { content: "" } }] }), { status: 200 }),
};

describe("content filter fails closed", () => {
let realFetch, env;
beforeEach(() => {
  realFetch = globalThis.fetch;
  env = { ...process.env };
  process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
  process.env.AZURE_OPENAI_API_KEY = "test-key";
});
afterEach(() => { globalThis.fetch = realFetch; for (const k of ["DEPLOY_CLASSIFY", "DEPLOY_REPLY", "TAXILA_CLASSIFY_HEDGE_MS"]) if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k]; });

const safe = () => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ match: "other_wrong", reason: "none", confidence: 0.9, off_topic: false, distress: false, asks_for_answer: false, wants_to_stop: false }) } }] }), { status: 200 });

function practiceState() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 5; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (i + 1) * 20_000 });
  return { ...r.state, brief: BRIEF, mode: "cascade" };
}
// Words the deterministic predicate does NOT catch (so the model path is what is under test).
const TEXT = "mujhe kuch accha nahi lag raha, sab bekaar hai";
const argsFor = (s) => ({ target: targetFor(s, K, findItem(s, K, s.activeItemId)), childText: TEXT, typed: false, asrConfidence: 0.9, classLevel: 4 });

test("azure: every content-filter shape surfaces as a content_filter AzureError", async () => {
  assert.ok(bodyIsContentFilter(JSON.stringify({ error: { code: "content_filter" } })));
  assert.ok(bodyIsContentFilter(JSON.stringify({ error: { code: "invalid", innererror: { code: "ResponsibleAIPolicyViolation" } } })));
  assert.ok(bodyIsContentFilter(JSON.stringify({ choices: [{ finish_reason: "content_filter" }] })));
  assert.ok(!bodyIsContentFilter(JSON.stringify({ error: { code: "invalid_request", message: "bad max_tokens" } })));
  for (const [name, res] of Object.entries(SHAPES)) {
    globalThis.fetch = async () => res();
    await assert.rejects(chat("taxila-fast", [{ role: "user", content: "x" }], { schema: { type: "object" } }), (e) => isContentFilter(e), name);
    await assert.rejects(chat("taxila-fast", [{ role: "user", content: "x" }]), (e) => isContentFilter(e), `${name} (plain reply)`);
  }
});

test("the deterministic predicate runs before any model call: a plain disclosure never reaches the model", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return SHAPES["400 error.code content_filter (OpenAI deployment)"](); };
  const s = practiceState();
  const fast = classifyFast({ ...argsFor(s), childText: "mujhe khud ko hurt karna hai, main marna chahta hoon" });
  assert.equal(fast.result?.flags.distress, true, "the predicate decides without the model");
  const out = await classify({ ...argsFor(s), childText: "mujhe khud ko hurt karna hai, main marna chahta hoon" });
  assert.equal(out.flags.distress, true);
  assert.equal(calls, 0);
});

for (const deployment of ["grok-4-1-fast-non-reasoning", "taxila-fast"]) {
  for (const [name, res] of Object.entries(SHAPES)) {
    test(`classify on ${deployment}: ${name} → distress (fails closed), safeguard move, incident row`, async () => {
      process.env.DEPLOY_CLASSIFY = deployment;
      process.env.TAXILA_CLASSIFY_HEDGE_MS = "0";
      let calls = 0;
      globalThis.fetch = async () => { calls += 1; return res(); };
      const s = practiceState();
      const out = await classify(argsFor(s));
      assert.equal(out.flags.distress, true, "a filter block is never read as safe");
      assert.equal(out.source, "content_filter");
      assert.equal(calls, 1, "no second call on the same blocked words");
      const plan = await planTurn(s, out, planCtxFor(s));
      assert.equal(plan.r.move.kind, "safeguard");
      assert.ok(plan.incident && plan.incident.source === "content_filter");
      assert.ok(plan.writes.some((w) => /insert into incident/.test(w.text)), "an incident row is staged in the turn's transaction");
      assert.match(JSON.stringify(plan.r.ui.whiteboard), /1098/);
    });
  }
}

test("hedged duplicate: a block on EITHER request wins over a 'safe' answer from the other", async () => {
  // First request hangs past the hedge, the duplicate is blocked → rejects with the filter, at once.
  let n = 0;
  const slowSafe = () => new Promise((r) => setTimeout(() => r("safe"), 200));
  const blocked = () => Promise.reject(new AzureError("blocked", 400, "content_filter"));
  await assert.rejects(hedged(() => (n++ === 0 ? slowSafe() : blocked()), 10), (e) => isContentFilter(e));
  // First request is blocked AFTER the duplicate went out, and the duplicate would answer safe: still the block.
  n = 0;
  const lateBlock = () => new Promise((_, j) => setTimeout(() => j(new AzureError("blocked", 400, "content_filter")), 30));
  await assert.rejects(hedged(() => (n++ === 0 ? lateBlock() : slowSafe()), 10), (e) => isContentFilter(e));
  // Through classify with the hedge on: first call slow-safe, duplicate blocked.
  process.env.DEPLOY_CLASSIFY = "grok-4-1-fast-non-reasoning";
  process.env.TAXILA_CLASSIFY_HEDGE_MS = "15";
  let c = 0;
  globalThis.fetch = async () => (c++ === 0 ? new Promise((r) => setTimeout(() => r(safe()), 300)) : SHAPES["400 error.code content_filter (OpenAI deployment)"]());
  const out = await classify(argsFor(practiceState()));
  assert.equal(out.flags.distress, true);
});

test("low-ASR turn: the distress backup blocked by the filter → distress", async () => {
  process.env.DEPLOY_CLASSIFY = "taxila-fast";
  globalThis.fetch = async () => SHAPES["400 choices[0].finish_reason content_filter (non-OpenAI Foundry model)"]();
  const out = await classify({ ...argsFor(practiceState()), asrConfidence: 0.2 });
  assert.equal(out.source, "asr");
  assert.equal(out.flags.distress, true);
});

test("a classifier OUTAGE (not a filter) is still not distress: only the block fails closed", async () => {
  process.env.DEPLOY_CLASSIFY = "taxila-fast";
  globalThis.fetch = async () => new Response("upstream", { status: 503 });
  const out = await classify(argsFor(practiceState()));
  assert.equal(out.source, "error");
  assert.equal(out.flags.distress, false);
});

for (const deployment of ["taxila-fast", "grok-4-1-fast-non-reasoning"]) {
  test(`teacher reply on ${deployment} blocked by the filter → filtered (the route re-plans as safeguard)`, async () => {
    process.env.DEPLOY_REPLY = deployment;
    globalThis.fetch = async () => SHAPES["200 finish_reason content_filter (filtered completion)"]();
    const s = practiceState();
    const p = await planTurn(s, cls("incorrect"), planCtxFor(s));
    const out = await textReply({ instructions: p.instructions, state: p.r.state, kit: K, childText: TEXT });
    assert.equal(out.filtered, true);
    assert.ok(out.guard.caught.includes("content_filter"));
    // What turn() does with it: the same staged state, re-planned as a disclosure.
    const blockedCls = { ...cls("incorrect"), source: "content_filter", flags: { ...cls("incorrect").flags, distress: true, distressKind: "content_filter" } };
    const again = await planTurn(s, blockedCls, planCtxFor(s));
    assert.equal(again.r.move.kind, "safeguard");
    assert.ok(again.writes.some((w) => /insert into incident/.test(w.text)));
  });
}

function planCtxFor(s) {
  return { kit: K, child: { id: "child-1", legal_mode: "M1" }, lesson: { id: "lesson-1", started_at: new Date(0) }, activeItem: findItem(s, K, s.activeItemId),
    moduleOnly: false, moduleEvents: [], answer: TEXT, leaked: false, loadSkills: async () => ({}), now: 200_000 };
}
});
