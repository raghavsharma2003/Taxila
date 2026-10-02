// Cascade-lane latency mechanisms (no network, no database): the server-side TTS prewarm a /turn hands to
// tts-stream, the deterministic drift repair that replaces a guard rewrite, the one-clock rule that keeps
// speculative plans identical to the real one, the low-ASR speculation, and the outbound keep-alive.
import { test } from "node:test";
import assert from "node:assert/strict";

import { prewarm, take, drop, __test as warm } from "../server/voice/prewarm.js";
import { setCacheStore } from "../server/voice/speech.js";
import { repairDrift, __test } from "../server/routes/lesson.js";
import { revealsAnswer, posesItem, handsBack, findItem } from "../server/director/items.js";
import { initLessonState, step } from "../server/director/state.js";
import { targetFor } from "../server/director/classify.js";
import { keepConnectionsWarm } from "../server/net.js";
import { kit, CTX, BRIEF, cls } from "./fixtures/kit.mjs";

const K = kit();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fake streaming /audio/speech: echoes `<input>`; records each call and whether it was aborted. */
function stubSpeech() {
  const orig = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    const call = { input: body.input, aborted: false };
    calls.push(call);
    init.signal?.addEventListener("abort", () => { call.aborted = true; });
    const bytes = new TextEncoder().encode(`<${body.input}>`);
    return new Response(new ReadableStream({ async start(c) { await sleep(5); c.enqueue(bytes); c.close(); } }), { status: 200 });
  };
  return { calls, restore: () => { globalThis.fetch = orig; } };
}
const style = { voice: "marin", instructions: "", version: "t" };
const readAll = async (job) => { const out = []; for await (const c of job.read()) out.push(Buffer.from(c)); return Buffer.concat(out).toString(); };

test("prewarm: speaking starts at once (first sentence + one ahead); only the same session can take it, once", async () => {
  process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.invalid/openai/v1";
  process.env.AZURE_OPENAI_API_KEY ||= "test-key";
  setCacheStore({ get: async () => null, put: async () => {} });
  const f = stubSpeech();
  try {
    const text = "Bilkul sahi, do faces jahan milte hain wahi edge hai. Ab matchbox ke corners gino. Kitne hain?";
    assert.equal(prewarm({ lessonId: "L1", seq: 7, text, tokenHash: "tok-a", guardianId: "g1", style }), true);
    await sleep(1);
    assert.equal(f.calls.length, 2, "the first sentence and the one after it are already generating");
    assert.equal(take("L1", 7, "tok-b"), null, "another session never gets it");
    assert.equal(take("L1", 8, "tok-a"), null, "another turn never gets it");
    const e = take("L1", 7, "tok-a");
    assert.ok(e);
    assert.equal(e.text, text);
    assert.equal(await readAll(e.jobs[0]), `<${e.parts[0]}>`);
    e.startUpTo(e.parts.length - 1);
    assert.equal(f.calls.length, e.parts.length);
    assert.equal(take("L1", 7, "tok-a"), null, "taken once");
  } finally {
    f.restore();
    warm.clear();
  }
});

test("prewarm: a turn that was not stored drops it (the speech request is aborted); off switch; no token, no prewarm", async () => {
  const f = stubSpeech();
  const prev = process.env.TAXILA_TTS_PREWARM;
  try {
    prewarm({ lessonId: "L2", seq: 3, text: "Ek baar aur gino, dhyan se. Kitne faces hain?", tokenHash: "tok", guardianId: "g", style });
    drop("L2", 3);
    assert.equal(take("L2", 3, "tok"), null);
    await sleep(10);
    assert.ok(f.calls.every((c) => c.aborted), "dropped speech is aborted upstream, or never requested");
    assert.equal(prewarm({ lessonId: "L3", seq: 1, text: "Haan.", tokenHash: undefined, guardianId: "g", style }), false);
    process.env.TAXILA_TTS_PREWARM = "0";
    assert.equal(prewarm({ lessonId: "L3", seq: 1, text: "Haan, bilkul sahi.", tokenHash: "tok", guardianId: "g", style }), false);
    assert.equal(warm.entries.size, 0);
  } finally {
    if (prev === undefined) delete process.env.TAXILA_TTS_PREWARM;
    else process.env.TAXILA_TTS_PREWARM = prev;
    f.restore();
    warm.clear();
  }
});

/** A stored lesson state after `n` unclear turns (the fifth reaches the first practice item). */
function lessonAt(n) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < n; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (i + 1) * 20_000 });
  return { ...r.state, brief: BRIEF, mode: "cascade" };
}

test("drift repair: the draft's acknowledgement, then the item's own question — and it passes the guards it must", () => {
  const s = lessonAt(5);
  const item = findItem(s, K, s.activeItemId);
  assert.ok(item);
  const draft = "Achha, tumne dhyan se socha. Ab batao, ek pizza ke kitne tukde hote hain? Socho.";
  const fixed = repairDrift(draft, item, "hinglish");
  assert.ok(fixed.startsWith("Achha, tumne dhyan se socha."), "keeps what came before the drifted question");
  assert.ok(!fixed.includes("pizza"), "drops the drifted question and everything after it");
  assert.ok(posesItem(fixed, item, "hinglish"), "poses the item");
  assert.ok(handsBack(fixed), "hands the floor back");
  assert.ok(!revealsAnswer(fixed, item), "does not state the key");
  assert.equal(repairDrift("Pizza ke kitne tukde?", item, "hinglish"), repairDrift("", item, "hinglish"), "a draft that opens with the wrong question becomes the question alone");
});

const planCtx = (s, now) => ({
  kit: K, child: { id: "child-1", legal_mode: "M1" }, lesson: { id: "lesson-1", started_at: new Date(0) }, activeItem: findItem(s, K, s.activeItemId),
  moduleOnly: false, moduleEvents: [], answer: "teen chauthai", leaked: false, loadSkills: async () => ({}), now,
});

test("speculation runs on the turn's one clock: a later real plan at the same `now` has the same reply key", async () => {
  const s = lessonAt(5);
  const { planTurn, replyKey, speculate } = __test;
  const target = targetFor(s, K, findItem(s, K, s.activeItemId));
  const now = 200_000;
  const orig = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("offline"); }; // the speculative replies fail; only their keys matter here
  try {
    const specs = speculate(s, target, {}, planCtx(s, now), { said: "x", historyOf: (n) => n.recent.slice(0, -1) });
    const keys = await Promise.all(specs.map(async (p) => (await p)?.key));
    // The classifier answered 7 s later: the real plan still steps at `now` (it used to read the clock again,
    // and the compiled "minute" line made every speculation miss across a 6 s boundary).
    const real = await planTurn(s, { ...cls("incorrect"), source: "model" }, planCtx(s, now));
    const key = replyKey(real.r.state, K, real.r, real.instructions, "x", real.r.state.recent.slice(0, -1));
    assert.ok(keys.includes(key), "the speculation for the classifier's outcome matches");
    const late = await planTurn(s, { ...cls("incorrect"), source: "model" }, planCtx(s, now + 7_000));
    assert.notEqual(replyKey(late.r.state, K, late.r, late.instructions, "x", late.r.state.recent.slice(0, -1)), key, "a second clock read would have missed");
    // A low-ASR turn: one speculation, the no-evidence plan the gate decides (source "asr").
    const low = speculate(s, target, {}, planCtx(s, now), { said: "x", historyOf: (n) => n.recent.slice(0, -1) }, { outcomes: ["no_evidence"], source: "asr" });
    assert.equal(low.length, 1);
    const asr = await planTurn(s, { ...cls("no_evidence"), source: "asr" }, planCtx(s, now));
    assert.equal((await low[0]).key, replyKey(asr.r.state, K, asr.r, asr.instructions, "x", asr.r.state.recent.slice(0, -1)));
  } finally {
    globalThis.fetch = orig;
  }
});

test("keep-alive: the global fetch dispatcher holds idle connections 30 s (same dispatcher class), and is applied once", async () => {
  const d = globalThis[Symbol.for("undici.globalDispatcher.1")];
  assert.ok(d, "a dispatcher is installed");
  assert.equal(d.__taxilaKeepAlive, 30_000);
  assert.equal(await keepConnectionsWarm(), "unchanged");
  assert.equal(await keepConnectionsWarm(0), "node default");
});

test("classifier hedge: a second request after `ms` wins when the first hangs; a fast first answer sends only one", async () => {
  const { hedged, classifyHedgeMs } = await import("../server/director/classify.js");
  let calls = 0;
  const slowThenFast = () => (++calls === 1 ? new Promise((r) => setTimeout(() => r("slow"), 200)) : Promise.resolve("fast"));
  assert.equal(await hedged(slowThenFast, 20), "fast");
  assert.equal(calls, 2);
  calls = 0;
  assert.equal(await hedged(async () => { calls += 1; return "one"; }, 20), "one");
  await sleep(40);
  assert.equal(calls, 1, "no hedge after an answer");
  await assert.rejects(hedged(async () => { throw new Error("down"); }, 50), /down/, "a first failure before the hedge fails at once");
  calls = 0;
  await assert.rejects(hedged(() => { calls += 1; return new Promise((_, j) => setTimeout(() => j(new Error(`fail${calls}`)), 30)); }, 10), /fail/);
  assert.equal(calls, 2, "both out, both failed");
  assert.equal(await hedged(async () => "plain", 0), "plain");
  const prev = process.env.TAXILA_CLASSIFY_HEDGE_MS;
  delete process.env.TAXILA_CLASSIFY_HEDGE_MS;
  try {
    assert.equal(classifyHedgeMs("grok-4-1-fast-non-reasoning"), 1500);
    assert.equal(classifyHedgeMs("taxila-fast"), 0, "reasoning family: off");
    process.env.TAXILA_CLASSIFY_HEDGE_MS = "0";
    assert.equal(classifyHedgeMs("grok-4-1-fast-non-reasoning"), 0);
  } finally {
    if (prev === undefined) delete process.env.TAXILA_CLASSIFY_HEDGE_MS;
    else process.env.TAXILA_CLASSIFY_HEDGE_MS = prev;
  }
});
