import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { classify, parseClassification, targetFor } from "../server/director/classify.js";
import { initLessonState } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { kit, CTX } from "./fixtures/kit.mjs";

const K = kit();
const M1 = "c4-maths-ch05-t01-m1";

function stateOn(itemId, over = {}) {
  return { ...initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 1, now: 0 }), phase: "practice", activeItemId: itemId, ...over };
}
const targetOn = (itemId, over) => { const s = stateOn(itemId, over); return targetFor(s, K, findItem(s, K, itemId)); };

// ── mock fetch: records the request, answers with a chat-completions body ──
// Everything sits in one describe: `npm test` runs all files in one process, and top-level hooks would wrap every
// other file's tests too (they did: studio-router's loopback chatStream test got this canned reply, 2026-10-05).
let calls, realFetch, reply;
describe("classify", () => {
beforeEach(() => {
  calls = []; realFetch = globalThis.fetch;
  process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
  process.env.AZURE_OPENAI_API_KEY = "test-key";
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    if (reply instanceof Error) throw reply;
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200 });
  };
});
afterEach(() => { globalThis.fetch = realFetch; reply = undefined; });

const flags = { off_topic: false, distress: false, asks_for_answer: false, wants_to_stop: false };

test("parse: key → correct, a misconception tag → its real id, other_wrong → incorrect", () => {
  const t = targetOn("i3");
  assert.equal(t.misconceptions[0].id, M1, "the item's targeted misconception is listed first");
  assert.equal(parseClassification({ match: "key", confidence: 0.9, ...flags }, t).outcome, "correct");
  const m = parseClassification({ match: "m1", confidence: 0.8, ...flags }, t);
  assert.equal(m.outcome, "misconception");
  assert.equal(m.misconceptionId, M1);
  assert.equal(parseClassification({ match: "other_wrong", confidence: 0.9, ...flags }, t).outcome, "incorrect");
});

test("parse: don't-know and low confidence are no evidence (never scored wrong)", () => {
  const t = targetOn("i3");
  const dk = parseClassification({ match: "dont_know", confidence: 0.95, ...flags }, t);
  assert.equal(dk.outcome, "no_evidence");
  assert.equal(dk.modelFlags.dontKnow, true);
  assert.equal(parseClassification({ match: "key", confidence: 0.3, ...flags }, t).outcome, "no_evidence");
});

test("parse: teach-back passes at ≥60% of expectations with no misconception", () => {
  const s = stateOn(undefined, { phase: "teachback", teachbackAsked: true });
  const t = targetFor(s, K, null);
  assert.equal(t.mode, "teachback");
  const pass = parseClassification({ covered: ["e1", "e3"], misconceptions: [], confidence: 0.9, ...flags }, t);
  assert.equal(pass.outcome, "correct");
  assert.deepEqual(pass.missing, [K.expectations[1]]);
  assert.equal(parseClassification({ covered: ["e1"], misconceptions: [], confidence: 0.9, ...flags }, t).outcome, "partial");
  const mis = parseClassification({ covered: ["e1", "e2", "e3"], misconceptions: ["m1"], confidence: 0.9, ...flags }, t);
  assert.equal(mis.outcome, "misconception");
});

test("classify: calls taxila-fast with a strict json_schema keyed to the item, and maps the answer", async () => {
  reply = { match: "m1", confidence: 0.85, ...flags };
  const r = await classify({ target: targetOn("i3"), childText: "teen wala bada hai kyunki teen bada number hai", typed: true, classLevel: 4 });
  assert.equal(calls.length, 1);
  const body = calls[0].body;
  assert.equal(calls[0].url, "https://example.test/openai/v1/chat/completions");
  assert.equal(body.model, "taxila-fast");
  assert.equal(body.response_format.type, "json_schema");
  assert.equal(body.response_format.json_schema.strict, true);
  assert.deepEqual(body.response_format.json_schema.schema.properties.match.enum, ["key", "m1", "m2", "other_wrong", "dont_know", "no_attempt"]);
  assert.match(body.messages[1].content, /KEY: 1\/2/);
  assert.equal(r.outcome, "misconception");
  assert.equal(r.misconceptionId, M1);
  assert.equal(r.source, "model");
});

test("classify: deterministic paths never call the model", async () => {
  reply = { match: "other_wrong", confidence: 1, ...flags };
  const t = targetOn("i3");
  assert.equal((await classify({ target: t, childText: "1/2", typed: true, classLevel: 4 })).outcome, "correct");
  assert.equal((await classify({ target: t, childText: "aadha", typed: true, classLevel: 4 })).source, "exact");
  const dk = await classify({ target: t, childText: "pata nahi", typed: true, classLevel: 4 });
  assert.equal(dk.outcome, "no_evidence");
  assert.equal(dk.flags.dontKnow, true);
  const diag = targetOn(`diag:${M1}`);
  const chip = await classify({ target: diag, childText: "", chipId: "opt:1", classLevel: 4 });
  assert.equal(chip.outcome, "misconception");
  assert.equal(chip.source, "chip");
  const mod = await classify({ target: t, childText: "", moduleAnswer: { correct: true }, classLevel: 4 });
  assert.equal(mod.source, "module");
  assert.equal(calls.length, 0);
});

test("classify: a low-ASR turn is no evidence, but its words still get a distress-only check", async () => {
  reply = { distress: true };
  const asr = await classify({ target: targetOn("i3"), childText: "ghar pe sab gussa", asrConfidence: 0.3, classLevel: 4 });
  assert.equal(asr.outcome, "no_evidence");
  assert.equal(asr.source, "asr");
  assert.equal(asr.flags.distress, true, "the model's distress read is the predicate's backup on this path");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.response_format.json_schema.name, "distress");
  reply = { distress: false };
  assert.equal((await classify({ target: targetOn("i3"), childText: "ek tihai shayad", asrConfidence: 0.3, classLevel: 4 })).flags.distress, false);
});

test("classify: the safeguarding predicate fires on the bytes, without the model", async () => {
  reply = { match: "key", confidence: 1, ...flags };
  const r = await classify({ target: targetOn("i3"), childText: "mujhe marna chahti hoon", typed: true, classLevel: 4 });
  assert.equal(r.flags.distress, true);
  assert.equal(r.flags.distressKind, "self_harm");
  assert.equal(r.source, "predicate");
  assert.equal(calls.length, 0);
});

test("classify: model flags merge in, and an outage costs evidence, never the turn", async () => {
  reply = { match: "no_attempt", confidence: 0.9, ...flags, wants_to_stop: true };
  const r = await classify({ target: targetOn("i1"), childText: "didi ab mera mann nahi hai", typed: true, classLevel: 4 });
  assert.equal(r.flags.wantsToStop, true);
  assert.equal(r.outcome, "no_evidence");
  reply = new Error("connect ECONNREFUSED");
  const down = await classify({ target: targetOn("i1"), childText: "teen", typed: true, classLevel: 4 });
  assert.equal(down.outcome, "no_evidence");
  assert.equal(down.source, "error");
  assert.equal(down.flags.distress, false, "a failed backup leaves the predicate's verdict");
  assert.equal(calls.length, 4, "one call, the failed call and its single retry, then one distress-only try (no retry)");
  assert.equal(calls[3].body.response_format.json_schema.name, "distress");
});

test("parse: a reason volunteered with a correct answer is labelled right or as the misconception it expresses", () => {
  const t = targetOn("i3");
  assert.deepEqual(t.ideas, K.expectations, "the kit's key ideas are the yardstick for reasons");
  const right = parseClassification({ match: "key", reason: "right", confidence: 0.9, ...flags }, t);
  assert.equal(right.reason, "right");
  const trap = parseClassification({ match: "key", reason: "m1", confidence: 0.9, ...flags }, t);
  assert.equal(trap.outcome, "correct");
  assert.equal(trap.reason, "misconception");
  assert.equal(trap.reasonMisconceptionId, M1);
  assert.equal(parseClassification({ match: "other_wrong", reason: "right", confidence: 0.9, ...flags }, t).reason, undefined, "a reason only counts beside a correct answer");
});

test("classify: the teacher's last turn goes to the classifier so an answer to another question is not evidence", async () => {
  reply = { match: "no_attempt", reason: "none", confidence: 0.9, ...flags };
  const r = await classify({ target: targetOn("i3"), childText: "1/4 bada hai", heard: "Ab 1/4 aur 1/8 mein kaunsa bada hai?", typed: true, classLevel: 4 });
  assert.match(calls[0].body.messages[1].content, /WHAT THE TEACHER LAST SAID: Ab 1\/4 aur 1\/8/);
  assert.match(calls[0].body.messages[0].content, /DIFFERENT question/);
  assert.equal(r.outcome, "no_evidence");
});

test("parse: with no keyed item a voiced wrong belief is a flag, never graded evidence", () => {
  const s = stateOn(undefined);
  const t = targetFor(s, K, null);
  assert.equal(t.mode, "none");
  assert.equal(t.misconceptions.length, K.misconceptions.length);
  const r = parseClassification({ belief: "m1", ...flags }, t);
  assert.equal(r.outcome, "no_evidence");
  assert.equal(r.voiced, K.misconceptions[0].id);
  assert.equal(parseClassification({ belief: "none", ...flags }, t).voiced, undefined);
});
});
