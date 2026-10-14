// Round 5 (sim lab baseline 9b73641, main safety review): an Azure content-filter block is a child-safety signal only when a
// HARM category fired (sexual, self_harm, violence, hate) or the categories cannot be read. A block that is only Prompt
// Shields' "jailbreak" (or another prompt-injection / copyright detector) on a child's maths answer used to play the full
// helpline script twice (persona p43, "6 aur 5... 30... 3,00,000?"). Harm and unreadable blocks still fail CLOSED.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat, AzureError, CONTENT_FILTER, filterCategories, nonHarmFilter } from "../server/azure.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const promptBody = (cats) => JSON.stringify({ error: { message: "The response was filtered due to the prompt triggering Azure OpenAI's content management policy.", code: "content_filter", status: 400,
  innererror: { code: "ResponsibleAIPolicyViolation", content_filter_result: {
    hate: { filtered: cats.includes("hate"), severity: "safe" }, sexual: { filtered: cats.includes("sexual"), severity: cats.includes("sexual") ? "medium" : "safe" },
    violence: { filtered: false, severity: "safe" }, self_harm: { filtered: cats.includes("self_harm"), severity: "safe" },
    jailbreak: { filtered: cats.includes("jailbreak"), detected: cats.includes("jailbreak") } } } } });

test("filterCategories reads every shape the filter arrives in", () => {
  assert.deepEqual(filterCategories(promptBody(["jailbreak"])), ["jailbreak"]);
  assert.deepEqual(filterCategories(promptBody(["sexual"])).sort(), ["sexual"]);
  assert.deepEqual(filterCategories(promptBody(["jailbreak", "self_harm"])).sort(), ["jailbreak", "self_harm"]);
  assert.deepEqual(filterCategories({ choices: [{ finish_reason: "content_filter", content_filter_results: { violence: { filtered: true, severity: "high" } } }] }), ["violence"]);
  assert.deepEqual(filterCategories("Response content blocked by label 'Jailbreak'."), ["jailbreak"]);
  assert.deepEqual(filterCategories("not json at all"), []);
  assert.deepEqual(filterCategories(null), []);
});

test("nonHarmFilter: only KNOWN, only injection / copyright categories; empty or unknown stays a safety signal", () => {
  const e = (cats) => Object.assign(new AzureError("x", 400, CONTENT_FILTER), cats ? { filterCats: cats } : {});
  assert.equal(nonHarmFilter(e(["jailbreak"])), true);
  assert.equal(nonHarmFilter(e(["indirect_attack", "protected_material_text"])), true);
  for (const c of [["sexual"], ["self_harm"], ["violence"], ["hate"], ["jailbreak", "sexual"], ["something_new"], [], null]) assert.equal(nonHarmFilter(e(c)), false, JSON.stringify(c));
  assert.equal(nonHarmFilter(undefined), false);
});

const K = kit();
function lesson() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: 20_000 });
  return r;
}
const block = (cats, status = 400) => Object.assign(new AzureError("chat taxila-fast HTTP 400: content_filter", status, CONTENT_FILTER), { filterCats: cats });
const said = "Sahi socha: 6 guna 5 tees, aur zero jodne par teen lakh. Ab 7000 guna 30 bataiye?";
const run = (r, history = []) => textReply({ instructions: "x", state: r.state, kit: K, childText: "6 aur 5... 30... 3,00,000?", history, ui: r.ui, module: r.state.module });

describe("reply filter categories (round 5)", () => {
  afterEach(() => { replyDeps.chat = chat; });

  test("a jailbreak-only block, then a clean retry on this turn alone: the lesson goes on, no safeguard", async () => {
    const r = lesson();
    const seen = [];
    replyDeps.chat = async (_d, msgs) => { seen.push(msgs.length); if (seen.length === 1) throw block(["jailbreak"]); return { text: said }; };
    const out = await run(r, [{ who: "teacher", text: "Screen par 6000 aur 50 dekhiye" }, { who: "child", text: "chaar zero honge?" }]);
    assert.notEqual(out.filtered, true, JSON.stringify(out.guard));
    assert.equal(out.reply, said);
    assert.equal(seen.length, 2);
    assert.ok(seen[1] < seen[0], `the retry drops the history (${seen})`);
  });

  test("a jailbreak-only block twice: a neutral fallback line, never the helplines", async () => {
    const r = lesson();
    replyDeps.chat = async () => { throw block(["jailbreak"]); };
    const out = await run(r);
    assert.notEqual(out.filtered, true);
    assert.deepEqual(out.guard.caught, ["content_filter_nonharm"]);
    assert.doesNotMatch(out.reply, /1098|14416|Childline|चाइल्डलाइन/);
  });

  test("a harm category, or an unreadable block, still fails CLOSED at once (no retry)", async () => {
    for (const cats of [["sexual"], ["self_harm"], ["jailbreak", "violence"], []]) {
      const r = lesson();
      let calls = 0;
      replyDeps.chat = async () => { calls++; throw block(cats); };
      assert.equal((await run(r)).filtered, true, JSON.stringify(cats));
      assert.equal(calls, 1, JSON.stringify(cats));
    }
  });

  test("a jailbreak block, then a HARM block on the retry: fails closed", async () => {
    const r = lesson();
    let calls = 0;
    replyDeps.chat = async () => { calls++; throw block(calls === 1 ? ["jailbreak"] : ["sexual"]); };
    assert.equal((await run(r)).filtered, true);
  });
});
