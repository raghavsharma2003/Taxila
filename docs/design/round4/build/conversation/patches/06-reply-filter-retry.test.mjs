// Patch request 06 (server/brain/say.js, stream 3's file): a content-filter block on the reply COMPLETION gets one fresh reply
// before the turn fails closed. Fails on a tree without the patch (the "one fresh reply" case), passes with it. Kept out of
// tests/ until applied:   node --test docs/design/round4/build/conversation/patches/06-reply-filter-retry.test.mjs
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { textReply, replyDeps } from "../../../../../../server/brain/say.js";
import { chat, AzureError, CONTENT_FILTER } from "../../../../../../server/azure.js";
import { initLessonState, step } from "../../../../../../server/director/state.js";
import { kit, CTX, cls } from "../../../../../../tests/fixtures/kit.mjs";

const K = kit();
afterEach(() => { replyDeps.chat = chat; });
function lesson() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: 20_000 });
  return r;
}
const completionBlock = () => new AzureError("chat taxila-fast completion blocked by the content filter", 200, CONTENT_FILTER);
const promptBlock = () => new AzureError("chat taxila-fast HTTP 400: content_filter", 400, CONTENT_FILTER);
const said = "Koi baat nahi, ek aur tarah se dekhte hain: paani teen roop mein milta hai. Ice kis roop mein hai?";
const run = (r) => textReply({ instructions: "x", state: r.state, kit: K, childText: "explain it differently", history: [], ui: r.ui, module: r.state.module });

test("a completion block, then a clean reply: the turn goes on (never the safeguard)", async () => {
  const r = lesson();
  let calls = 0;
  replyDeps.chat = async () => { calls++; if (calls === 1) throw completionBlock(); return { text: said }; };
  const out = await run(r);
  assert.notEqual(out.filtered, true, JSON.stringify(out.guard));
  assert.ok(calls >= 2);
});

test("two completion blocks in a row fail closed, as before", async () => {
  const r = lesson();
  replyDeps.chat = async () => { throw completionBlock(); };
  assert.equal((await run(r)).filtered, true);
});

test("a PROMPT block (the child's words are in it) fails closed at once, with no retry", async () => {
  const r = lesson();
  let calls = 0;
  replyDeps.chat = async () => { calls++; throw promptBlock(); };
  assert.equal((await run(r)).filtered, true);
  assert.equal(calls, 1);
});
