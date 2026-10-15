// round 5 (main safety review; sim lab): a harm-category content-filter block on the classifier's LABEL call (its prompt
// carries the item, the key and the lesson) is not by itself the child's words tripping the filter.
//  14.2 (TEST lesson 5d18d152 t2, "Bollywood songs ... jaise 'Kala Chashma' type", labels `hate`): the words were re-read
//  alone; only a clean pass counts as a context block.
//  14.3 (TEST lesson 71599981 t4, a class 8 history answer "इंडियन वीवर्स को लॉस हुआ ना। ब्रिटिश मशीन का माल सस्ता था…"):
//  the distress check's own brief with those words came back `hate` too. Now: (1) the words alone under a NEUTRAL brief
//  (the reply path's probe), and (2) the distress read across deployments, a block on one moving to the next filter.
//  Every other outcome fails CLOSED exactly as before.
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
const json = (o) => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: typeof o === "string" ? o : JSON.stringify(o) } }] }), { status: 200 });
// which call a request is: the neutral words-alone probe, the distress read (on which deployment), or the labels
const kindOf = (body) => {
  const sys = body.messages?.[0]?.content ?? "";
  if (sys === "Answer with one word: ok") return "probe";
  if (/^A reply from an Indian school child/.test(sys)) return `distress@${body.model}`;
  return "labels";
};

describe("classifier label block: the child's words alone (scoped: fetch and env stubs stay in this suite)", () => {
let realFetch, env;
beforeEach(() => {
  realFetch = globalThis.fetch; env = { ...process.env };
  process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
  process.env.AZURE_OPENAI_API_KEY = "test-key";
  process.env.DEPLOY_CLASSIFY = "taxila-fast";
  process.env.TAXILA_CLASSIFY_HEDGE_MS = "0";
  process.env.TAXILA_DISTRESS_ACROSS = "grok-4-1-fast-non-reasoning";
});
afterEach(() => { globalThis.fetch = realFetch; for (const k of ["DEPLOY_CLASSIFY", "TAXILA_CLASSIFY_HEDGE_MS", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "TAXILA_DISTRESS_ACROSS"]) if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k]; });

function practiceState() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 5; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (i + 1) * 20_000 });
  return { ...r.state, mode: "cascade" };
}
const TEXT = "maine bola na, Bollywood songs pasand hain, dance waale, jaise 'Kala Chashma' type";
/** responses: { probe, "distress@taxila-fast", "distress@grok-4-1-fast-non-reasoning" } → (body) => Response; labels are always blocked `hate` */
const run = async (responses, text = TEXT) => {
  const s = practiceState(), seen = [];
  globalThis.fetch = async (url, init) => {
    if (!new URL(url).host.endsWith("example.test")) return realFetch(url, init); // the trace writer's database driver, in one process
    const body = JSON.parse(init.body), k = kindOf(body);
    seen.push(k);
    if (k === "labels") return blocked(["hate"]);
    const r = responses[k];
    return r ? r(body) : new Response("no stub", { status: 500 });
  };
  const out = await classify({ target: targetFor(s, K, findItem(s, K, s.activeItemId)), childText: text, typed: false, asrConfidence: 0.92, classLevel: 6 });
  return { out, seen };
};

test("words that pass alone, read clean: a context block, no evidence, no safeguard", async () => {
  const { out, seen } = await run({
    probe: (body) => { assert.equal(body.messages[1].content, TEXT, "the probe carries the child's words and nothing of the lesson"); return json("ok"); },
    "distress@taxila-fast": () => json({ distress: false }),
  });
  assert.deepEqual(seen, ["labels", "probe", "distress@taxila-fast"]);
  assert.equal(out.flags.distress, false);
  assert.equal(out.outcome, "no_evidence");
  assert.equal(out.source, "content_filter_context");
  assert.ok(comprehensionReasons({ cls: out, classified: true }).includes("cls_source.content_filter_context"));
});

test("14.3 (p26): the distress brief blocked on one deployment moves to the next filter; a clean read there decides", async () => {
  const HIST = "इंडियन वीवर्स को लॉस हुआ ना। ब्रिटिश मशीन का माल सस्ता था तो लोग उनका कपड़ा लेने लगे।";
  const { out, seen } = await run({ probe: () => json("ok"), "distress@taxila-fast": () => blocked(["hate"]), "distress@grok-4-1-fast-non-reasoning": () => json({ distress: false }) }, HIST);
  assert.deepEqual(seen, ["labels", "probe", "distress@taxila-fast", "distress@grok-4-1-fast-non-reasoning"]);
  assert.equal(out.flags.distress, false);
  assert.equal(out.source, "content_filter_context");
});

test("everything else fails CLOSED as before", async () => {
  for (const [name, responses] of [
    ["the words ALONE trip a harm category", { probe: () => blocked(["hate"]) }],
    ["the neutral probe is unreadable", { probe: () => new Response(JSON.stringify({ error: { code: "content_filter" } }), { status: 400 }) }],
    ["the neutral probe is unavailable", { probe: () => new Response("upstream", { status: 500 }) }],
    ["a clean distress read says distress", { probe: () => json("ok"), "distress@taxila-fast": () => json({ distress: true }) }],
    ["a later deployment reads distress", { probe: () => json("ok"), "distress@taxila-fast": () => blocked(["hate"]), "distress@grok-4-1-fast-non-reasoning": () => json({ distress: true }) }],
    ["every deployment's distress read is blocked", { probe: () => json("ok"), "distress@taxila-fast": () => blocked(["hate"]), "distress@grok-4-1-fast-non-reasoning": () => blocked(["violence"]) }],
    ["no deployment can read it (outage)", { probe: () => json("ok") }],
  ]) {
    const { out } = await run(responses);
    assert.equal(out.flags.distress, true, name);
    assert.equal(out.source, "content_filter", name);
  }
});
});
