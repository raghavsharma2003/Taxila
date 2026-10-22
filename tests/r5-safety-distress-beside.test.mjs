// 14.3.2 (main safety review; QA TEST lesson 6148384f t2): the words-only distress read BESIDE the label call.
// "aaj mera mann bilkul nahi lag raha, sab bekaar lagta hai, koi mujhse baat nahi karta" was read off-topic and not distress
// by the label call; no safeguard, no helplines. Replayed on production's classifier the label call caught such lines
// 0/6 to 6/6 by line; the words-only brief 30/30. Now either read saying distress is distress.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { classify, targetFor } from "../server/director/classify.js";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { distressOf } from "../server/brain/turn.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const blocked = (cats) => new Response(JSON.stringify({ error: { code: "content_filter", status: 400, message: "The response was filtered due to the prompt triggering Azure OpenAI's content management policy.",
  innererror: { code: "ResponsibleAIPolicyViolation", content_filter_result: Object.fromEntries(["hate", "sexual", "violence", "self_harm"].map((c) => [c, { filtered: cats.includes(c), severity: cats.includes(c) ? "medium" : "safe" }])) } } }), { status: 400 });
const json = (o) => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: typeof o === "string" ? o : JSON.stringify(o) } }] }), { status: 200 });
const kindOf = (body) => {
  const sys = body.messages?.[0]?.content ?? "";
  if (sys === "Answer with one word: ok") return "probe";
  if (body.response_format?.json_schema?.name === "distress_beside") return `beside@${body.model}`;
  if (/^A reply from an Indian school child/.test(sys)) return `distress@${body.model}`;
  return "labels";
};
const LOW = "aaj mera mann bilkul nahi lag raha, sab bekaar lagta hai, koi mujhse baat nahi karta";
const label = (o = {}) => ({ match: "no_attempt", confidence: 0.9, off_topic: true, distress: false, asks_for_answer: false, wants_to_stop: false, ...o });

describe("the distress read beside the labels (scoped: fetch and env stubs stay in this suite)", () => {
let realFetch, env;
beforeEach(() => {
  realFetch = globalThis.fetch; env = { ...process.env };
  process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
  process.env.AZURE_OPENAI_API_KEY = "test-key";
  process.env.DEPLOY_CLASSIFY = "grok-4-1-fast-non-reasoning";
  process.env.TAXILA_CLASSIFY_FALLBACK = "taxila-fast";
  process.env.TAXILA_CLASSIFY_HEDGE_MS = "0";
  process.env.TAXILA_DISTRESS_ACROSS = "grok-4-1-fast-non-reasoning,taxila-fast";
});
afterEach(() => { globalThis.fetch = realFetch; for (const k of ["DEPLOY_CLASSIFY", "TAXILA_CLASSIFY_FALLBACK", "TAXILA_CLASSIFY_HEDGE_MS", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "TAXILA_DISTRESS_ACROSS"]) if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k]; });

function practiceState() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 5; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (i + 1) * 20_000 });
  return r.state;
}
/** responses keyed by kindOf; "labels" defaults to a clean off-topic, not-distress label */
const run = async (responses, text = LOW, heard) => {
  const s = practiceState(), seen = [];
  globalThis.fetch = async (url, init) => {
    if (!new URL(url).host.endsWith("example.test")) return realFetch(url, init); // the trace writer's database driver, in one process
    const body = JSON.parse(init.body), k = kindOf(body);
    seen.push(k);
    const r = responses[k] ?? (k.startsWith("labels") ? () => json(label()) : null);
    return r ? r(body) : new Response("no stub", { status: 500 });
  };
  const out = await classify({ target: targetFor(s, K, findItem(s, K, s.activeItemId)), childText: text, typed: true, asrConfidence: 0.95, classLevel: 6, ...(heard ? { heard } : {}) });
  return { out, seen };
};

test("QA 6148384f t2: the labels read off-topic, the words alone read distress: distress (kind model), attributed to the words", async () => {
  const { out, seen } = await run({ "beside@grok-4-1-fast-non-reasoning": (body) => {
    assert.equal(body.messages[1].content, LOW, "the read carries the child's words and nothing of the lesson");
    return json({ distress: true });
  } });
  assert.ok(seen.includes("labels") && seen.includes("beside@grok-4-1-fast-non-reasoning"));
  assert.equal(out.flags.distress, true);
  assert.equal(out.flags.distressKind, "model", "a model read: the 14.3 model-episode release applies");
  assert.equal(out.distressBy, "words");
  assert.equal(out.flags.offTopic, true, "the label's other flags stay");
  assert.deepEqual(distressOf(["classify_words"], { move: "safeguard" }).sources, ["classify_words"]);
});

test("both reads clean and not distress: nothing changes", async () => {
  const { out } = await run({ "beside@grok-4-1-fast-non-reasoning": () => json({ distress: false }) }, "50 plus 30 plus 50 plus 30, 160");
  assert.equal(out.flags.distress, false);
  assert.equal(out.distressBy, undefined);
});

test("the labels read distress: distress, never attributed to the words", async () => {
  const { out } = await run({ labels: () => json(label({ distress: true })), "beside@grok-4-1-fast-non-reasoning": () => json({ distress: false }) });
  assert.equal(out.flags.distress, true);
  assert.equal(out.flags.distressKind, "model");
  assert.equal(out.distressBy, undefined);
});

test("it starts WITH the labels (order, not time): the label call is answered only after the words' read has been asked", async () => {
  let asked; const besideAsked = new Promise((r) => { asked = r; });
  const { out } = await run({
    labels: async () => {
      const ok = await Promise.race([besideAsked.then(() => true), new Promise((r) => setTimeout(() => r(false), 2000))]);
      assert.ok(ok, "the words' read was not asked while the label call was open");
      return json(label());
    },
    "beside@grok-4-1-fast-non-reasoning": () => { asked(); return json({ distress: true }); },
  });
  assert.equal(out.flags.distress, true);
});

test("a block on its brief moves to the next deployment; a clean read there decides", async () => {
  const { out, seen } = await run({ "beside@grok-4-1-fast-non-reasoning": () => blocked(["hate"]), "beside@taxila-fast": () => json({ distress: true }) });
  assert.deepEqual(seen.filter((k) => k.startsWith("beside")), ["beside@grok-4-1-fast-non-reasoning", "beside@taxila-fast"]);
  assert.equal(out.flags.distress, true);
});

test("blocked on every deployment: the child's words ALONE decide (a harm block is distress; a clean probe is no reading)", async () => {
  const harm = await run({ "beside@grok-4-1-fast-non-reasoning": () => blocked(["self_harm"]), "beside@taxila-fast": () => blocked(["self_harm"]), probe: () => blocked(["self_harm"]) });
  assert.equal(harm.out.flags.distress, true, "the words alone trip a harm category");
  const p26 = await run({ "beside@grok-4-1-fast-non-reasoning": () => blocked(["hate"]), "beside@taxila-fast": () => blocked(["hate"]), probe: () => json("ok") },
    "इंडियन वीवर्स को लॉस हुआ ना। ब्रिटिश मशीन का माल सस्ता था तो लोग उनका कपड़ा लेने लगे।");
  assert.equal(p26.out.flags.distress, false, "the 14.3 p26 shape: the brief with these words reads hate, the words alone do not");
  assert.equal(p26.out.distressBy, undefined);
});

test("unavailable on both deployments: no reading, the label call's read stands (it never fails a turn)", async () => {
  const { out } = await run({});
  assert.equal(out.flags.distress, false);
  assert.equal(out.outcome, "no_evidence");
  assert.equal(out.source, "model");
});

test("the label call's own fail-closed paths are untouched: a harm block on the labels with the words tripping alone is still the content filter's safeguard", async () => {
  const { out } = await run({ labels: () => blocked(["violence"]), probe: () => blocked(["violence"]), "beside@grok-4-1-fast-non-reasoning": () => json({ distress: false }) });
  assert.equal(out.flags.distress, true);
  assert.equal(out.source, "content_filter");
  assert.equal(out.distressBy, undefined);
});

test("14.4 (sim lab p67 #14, 'वो... वो डूबेगी...'): her last words go first as context, framed as context only; the child's words follow", async () => {
  const Q = "Kaanch ki goli ko paani mein daal kar kya hoga?";
  let seenBody;
  const { out } = await run({ "beside@grok-4-1-fast-non-reasoning": (body) => { seenBody = body; return json({ distress: false }); } }, "वो... वो डूबेगी...", Q);
  assert.equal(seenBody.messages[1].content, `TEACHER: ${Q}\nCHILD: वो... वो डूबेगी...`);
  assert.match(seenBody.messages[0].content, /teacher's last words come first only so you can tell an answer to the lesson's own question from a disclosure/);
  assert.equal(out.flags.distress, false);
});

test("14.4: her words are cut to their last 240 characters and masked like the child's ('teen' as 3)", async () => {
  const long = `${"Socho aur batao. ".repeat(30)}Teen aur teen kitne?`;
  let seenBody;
  await run({ "beside@grok-4-1-fast-non-reasoning": (body) => { seenBody = body; return json({ distress: false }); } }, "6", long);
  const teacher = seenBody.messages[1].content.split("\nCHILD: ")[0].replace(/^TEACHER: /, "");
  assert.ok(teacher.length <= 240, `teacher context ${teacher.length} chars`);
  assert.match(teacher, /3 aur 3 kitne\?$/);
});

// 14.4 tiered safeguard: the words-only read names what the distress is about (state.js checkTier reads it)
test("14.4: the words read names the kind; the labels' distress takes the words read's kind, or 'none' when it read none", async () => {
  const a = await run({ "beside@grok-4-1-fast-non-reasoning": () => json({ distress: true, about: "sad_or_lonely" }) });
  assert.equal(a.out.flags.distress, true);
  assert.equal(a.out.flags.distressAbout, "sad_or_lonely");
  const b = await run({ labels: () => json(label({ distress: true })), "beside@grok-4-1-fast-non-reasoning": () => json({ distress: false, about: "none" }) });
  assert.equal(b.out.flags.distress, true);
  assert.equal(b.out.flags.distressAbout, "none", "the reads disagree: a check-in first");
  const c = await run({ labels: () => json(label({ distress: true })), "beside@grok-4-1-fast-non-reasoning": () => json({ distress: true, about: "hurt_by_person" }) });
  assert.equal(c.out.flags.distressAbout, "hurt_by_person");
  const d = await run({ "beside@grok-4-1-fast-non-reasoning": () => json({ distress: true, about: "an unknown kind" }) });
  assert.equal(d.out.flags.distress, true);
  assert.equal(d.out.flags.distressAbout, null, "a kind outside the list is unnamed: the full script");
});
// 14.4 (QA TEST 1ebf31b4, supersedes "the turn does not wait"): a slow words read is waited for, so a timeout under load
// never turns a low mood into the full script; a read with no answer at all within the cap is still unnamed
test("14.4: the labels read distress and the words read is slow: the turn waits for its name (QA TEST 1ebf31b4)", async () => {
  const { out } = await run({ labels: () => json(label({ distress: true })),
    "beside@grok-4-1-fast-non-reasoning": () => new Promise((r) => setTimeout(() => r(json({ distress: true, about: "sad_or_lonely" })), 2500)) });
  assert.equal(out.flags.distress, true);
  assert.equal(out.flags.distressAbout, "sad_or_lonely", "named: a check-in, as on an unloaded turn");
});
test("14.4: a words read with no answer within the cap is unnamed: the full script", async () => {
  process.env.TAXILA_BESIDE_CAP_MS = "300";
  try {
    const t0 = Date.now();
    const { out } = await run({ labels: () => json(label({ distress: true })),
      "beside@grok-4-1-fast-non-reasoning": () => new Promise((r) => setTimeout(() => r(json({ distress: false, about: "none" })), 2500)) });
    assert.equal(out.flags.distress, true);
    assert.equal(out.flags.distressAbout, undefined, "no name: never a check-in");
    assert.ok(Date.now() - t0 < 2400, `waited ${Date.now() - t0} ms`);
  } finally { delete process.env.TAXILA_BESIDE_CAP_MS; }
});

test("14.4: a self-harm read on the lesson's own frustration idiom is a check-in kind, never the full script (QA TEST d3c1ab60)", async () => {
  const { out } = await run({ "beside@grok-4-1-fast-non-reasoning": () => json({ distress: true, about: "self_harm" }) }, "160 metre, mar gaya main toh ye sawaal karke");
  assert.equal(out.flags.distress, true, "never nothing");
  assert.equal(out.flags.distressAbout, "none");
  assert.equal(out.flags.idiom, "lesson_frustration");
  const real = await run({ "beside@grok-4-1-fast-non-reasoning": () => json({ distress: true, about: "self_harm" }) }, "kabhi kabhi lagta hai sab khatam kar doon, ye padhai bhi");
  assert.equal(real.out.flags.distressAbout, "self_harm", "a wish or the self keeps the sure read");
});
});
