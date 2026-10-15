// round 5 (14.3, main safety review; sim lab p11, TEST trace: 13 of 52 content-filter safeguards were plain maths with the
// Hindi number "teen"): Azure's content filter reads Roman Hindi "teen" (three) as the English word and blocks sums as
// `sexual` ("teen guna teen nau", "do aur teen paanch", "teen saal ka bhai"); the digit passes. The copy a safety-relevant
// model call reads writes that "teen" as "3" (safety.js filterSafe); the predicate and every code check read the raw words.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { filterSafe, scrubPii, scanSafety } from "../server/director/safety.js";
import { forModel, probeWords } from "../server/brain/say.js";
import { classify, targetFor } from "../server/director/classify.js";
import { initLessonState } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { understand, understandDeps, resetBreaker } from "../server/conversation/understand.js";
import { REDTEAM_DISTRESS, REDTEAM_ROUND2, REDTEAM_ROUND3 } from "../evals/safety-robust/redteam.data.mjs";
import { kit, CTX } from "./fixtures/kit.mjs";

describe("filterSafe: the Hindi number 'teen' as the digit", () => {
  test("the sums the filter blocked, and p11's words", () => {
    const cases = {
      "teen guna teen nau": "3 guna 3 nau", "do aur teen paanch": "do aur 3 paanch", "teen aur teen chhe": "3 aur 3 chhe",
      "teen saal ka bhai": "3 saal ka bhai", "Teen sides hoti hain": "3 sides hoti hain", "tteen sides hoti hain, haan?": "3 sides hoti hain, haan?",
      "kyunki... uske teen sides hote hain... tircha ho ya seedha, sides ginne se teen hi aate hain... maine sahi bola?":
        "kyunki... uske 3 sides hote hain... tircha ho ya seedha, sides ginne se 3 hi aate hain... maine sahi bola?",
      "ek-do-teen, bas teen?": "ek-do-3, bas 3?", "6000 mein teen zero": "6000 mein 3 zero",
    };
    for (const [raw, out] of Object.entries(cases)) assert.equal(filterSafe(raw), out, raw);
  });
  test("English 'teen' (a teenager) and the longer words stay as said", () => {
    for (const t of ["a teen boy", "my teen sister", "The teen at the shop", "her teen cousin", "teenage", "teens", "teenager", "canteen", "fifteen", "nineteen", "तीन"]) {
      assert.equal(filterSafe(t), t, t);
    }
  });
  test("scrubPii's text is unchanged: code checks (askedOther / revealsAnswer on her line) read 'teen' as said", () => {
    assert.equal(scrubPii("teen guna teen nau").text, "teen guna teen nau");
  });
  test("the predicate reads the raw words: no distress line in the red-team sets carries the word", () => {
    const lines = [...REDTEAM_DISTRESS, ...REDTEAM_ROUND2, ...REDTEAM_ROUND3].map((x) => (Array.isArray(x) ? x[0] : x));
    assert.deepEqual(lines.filter((t) => filterSafe(t) !== t), []);
    assert.equal(scanSafety("mere teen saal ke bhai ko papa roz maarte hain").distress, true, "a disclosure with 'teen' still fires on the raw words");
  });
});

describe("the reply side: the prompt's history and this turn, and the child-words probe", () => {
  test("forModel and probeWords", () => {
    assert.equal(forModel("teen aur teen chhe"), "3 aur 3 chhe");
    assert.equal(probeWords([{ who: "child", text: "do aur teen paanch" }, { who: "teacher", text: "teen guna teen?" }], "teen guna teen nau"), "do aur 3 paanch\n3 guna 3 nau");
  });
});

// ── the classifier and the understanding note: mock fetch / deps, all inside one describe (npm test runs every file in
// one process; top-level hooks would wrap other files' tests too) ──
let realFetch, bodies, reply;
describe("model-bound copies in classify and the understanding note", () => {
  const K = kit();
  const target = () => { const s = { ...initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 1, now: 0 }), phase: "practice", activeItemId: "i1" }; return targetFor(s, K, findItem(s, K, "i1")); };
  const flags = { off_topic: false, distress: false, asks_for_answer: false, wants_to_stop: false };
  beforeEach(() => {
    realFetch = globalThis.fetch; bodies = [];
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    globalThis.fetch = async (_u, init) => { bodies.push(JSON.parse(init.body)); return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200 }); };
  });
  afterEach(() => { globalThis.fetch = realFetch; reply = undefined; });

  test("the label call reads '3'; the child's words and her line are never sent with that 'teen'", async () => {
    reply = { match: "no_attempt", confidence: 0.9, ...flags };
    await classify({ target: target(), childText: "teen guna teen nau", heard: "teen guna teen kitna hota hai?", typed: true, classLevel: 3 });
    const user = bodies.flatMap((b) => b.messages.filter((m) => m.role === "user").map((m) => m.content));
    assert.ok(user.length >= 1);
    for (const u of user) { assert.doesNotMatch(u, /(?<![\p{L}])teen(?![\p{L}])/iu, u); }
    assert.ok(user.some((u) => /3 guna 3 nau/.test(u)));
  });
  test("the understanding note reads '3'", async () => {
    const seen = [];
    const keep = understandDeps.chat;
    understandDeps.chat = async (_dep, messages) => { seen.push(messages.find((m) => m.role === "user").content); return { json: { intent: "answer" } }; };
    resetBreaker();
    try { await understand({ said: "do aur teen paanch", teacherLast: "do aur teen kitne?", earlier: [] }); } finally { understandDeps.chat = keep; }
    assert.ok(seen.length >= 1);
    for (const u of seen) assert.doesNotMatch(u, /(?<![\p{L}])teen(?![\p{L}])/iu, u);
  });
});
