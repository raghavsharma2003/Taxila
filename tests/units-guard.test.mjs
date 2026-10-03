// The hook bug seen in prod (2026-10-03): "45,000 fans" vs "4,500 km" in a "which is bigger" question. A shape-level
// constraint on the hook (a note, not a line) and a code predicate in the text-lane reply guards.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mixedUnitComparison, withoutMixedUnits, quantitiesIn } from "../server/director/units.js";
import * as SH from "../server/director/shapes.js";
import { initLessonState, step } from "../server/director/state.js";
import { __test } from "../server/routes/lesson.js";
import { kit, CTX, BRIEF, cls } from "./fixtures/kit.mjs";

const FLAGGED = [
  "Kaun bada hai: 45,000 fans ya 4,500 km?",
  "Which is bigger, 45,000 fans or 4,500 km?",
  "Stadium mein 45,000 fans hain aur Delhi se Agra 4,500 km hai. Kaun sa number bada hai?",
  "Is ₹50 zyada hai ya 30 toffee?",
  "Kya 2 ghante 100 log se zyada hain?",
];
const QUIET = [
  "Which is longer, 1 km or 900 m?", "12 boys or 10 girls, which is more?", "Kya 5 kg 500 g se zyada hai?", "3/4 bada hai ya 1/2?",
  "Ek stadium mein 45,000 log aate hain, doosre mein 32,500 log. Kis mein zyada log?",
  "Delhi se Kanyakumari 2,800 km hai aur Mumbai se Pune 150 km. Kaunsa safar lamba hai?",
  "Kanyakumari is 2,800 km from Delhi; a train takes 40 hours. More than a day!",
  "Riya, cricket stadium mein 48,000 fans aur 75,000 fans—tum kis match mein zyada bheed predict karogi?",
];

describe("mixed-unit comparisons", () => {
  test("flags a which-is-bigger across kinds of quantity (one measure involved), within a question and its setup", () => {
    for (const t of FLAGGED) assert.ok(mixedUnitComparison(t), t);
  });
  test("passes like-with-like (counts, or one dimension in two units) and statements that are not a comparing question", () => {
    for (const t of QUIET) assert.equal(mixedUnitComparison(t), null, t);
  });
  test("quantities carry their kind", () => {
    assert.deepEqual(quantitiesIn("45,000 fans ya 4,500 km").map((q) => q.kind), ["count:fan", "length"]);
    assert.deepEqual(quantitiesIn("₹50 ya 2 lakh log").map((q) => q.kind), ["money", "count:log"]);
  });
  test("what survives a failed rewrite: the comparing question is dropped, the true setup stays", () => {
    assert.equal(withoutMixedUnits("Stadium mein 45,000 fans hain aur Delhi se Agra 4,500 km hai. Kaun sa number bada hai?"),
      "Stadium mein 45,000 fans hain aur Delhi se Agra 4,500 km hai.");
  });
  test("the hook shape constrains comparisons to one kind and unit, as a note (not a sayable line)", () => {
    const shape = SH.hook({ interest: null, contexts: ["highway distances", "cricket stadium crowds"], protege: { name: "Golu", what: "x" } });
    assert.match(shape, /one kind, in one unit/);
    assert.doesNotMatch(shape, /"/, "no quoted sentence for the model to recite");
  });
  test("text-lane guard: a draft comparing across kinds is rewritten once; a rewrite that still does is cut", async () => {
    const K = kit();
    const r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 1, now: 0 }), { event: "start", kit: K, now: 0 });
    const hook = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: 20_000 });
    assert.equal(hook.move.kind, "hook");
    const real = globalThis.fetch;
    process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.test/openai/v1";
    process.env.AZURE_OPENAI_API_KEY ||= "test-key";
    const drafts = ["Riya, stadium mein 45,000 fans aur highway 4,500 km. Kaun bada hai?", "Socho, 45,000 fans ya 4,500 km, kaun zyada hai? Batao!"];
    let n = 0;
    globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: drafts[Math.min(n++, 1)] } }] }), { status: 200 });
    try {
      const out = await __test.textReply({ instructions: "x", state: { ...hook.state, brief: BRIEF }, kit: K, childText: "haan", history: [] });
      assert.ok(out.guard.caught.includes("units"));
      assert.equal(out.guard.rewritten, true);
      assert.equal(mixedUnitComparison(out.reply), null, out.reply);
    } finally { globalThis.fetch = real; }
  });
});
