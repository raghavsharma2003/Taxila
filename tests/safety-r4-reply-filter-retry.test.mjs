// Patch request 06 (server/brain/say.js, stream 3's file): a content-filter block on the reply COMPLETION gets one fresh reply
// before the turn fails closed. Fails on a tree without the patch (the "one fresh reply" case), passes with it. Moved into
// tests/ by the main safety review (2026-10-10), which applied it; hooks sit inside a describe (npm test is ONE process).
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat, AzureError, CONTENT_FILTER } from "../server/azure.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
function lesson() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: 20_000 });
  return r;
}
const completionBlock = () => new AzureError("chat taxila-fast completion blocked by the content filter", 200, CONTENT_FILTER);
const promptBlock = () => new AzureError("chat taxila-fast HTTP 400: content_filter", 400, CONTENT_FILTER);
const said = "Koi baat nahi, ek aur tarah se dekhte hain: paani teen roop mein milta hai. Ice kis roop mein hai?";
const run = (r) => textReply({ instructions: "x", state: r.state, kit: K, childText: "explain it differently", history: [], ui: r.ui, module: r.state.module });

describe("reply content-filter retry (patch 06)", () => {
afterEach(() => { replyDeps.chat = chat; });

test("a completion block, then a clean reply: the turn goes on (never the safeguard)", async () => {
  const r = lesson();
  let calls = 0;
  replyDeps.chat = async () => { calls++; if (calls === 1) throw completionBlock(); return { text: said }; };
  const out = await run(r);
  assert.notEqual(out.filtered, true, JSON.stringify(out.guard));
  assert.ok(calls >= 2);
});

test("two completion blocks in a row, and the child's words trip the filter too: fails closed, as before", async () => {
  const r = lesson();
  replyDeps.chat = async () => { throw completionBlock(); };
  assert.equal((await run(r)).filtered, true);
});

// 14.3.1 (main safety review; sim lab rel143 p16 r2, TEST 955a17b7 t12): her OWN completion blocked twice while the child's
// words pass the probe is not a child-safety signal: a neutral line, never the helplines (the 14.2 prompt-side rule)
test("two completion blocks, the child's own words probe clear: a neutral line, never the safeguard", async () => {
  const r = lesson();
  let probes = 0;
  replyDeps.chat = async (_d, _m, o) => { if (o?.purpose === "filter_probe") { probes++; return { text: "ok" }; } throw completionBlock(); };
  const out = await run(r);
  assert.notEqual(out.filtered, true, JSON.stringify(out.guard));
  assert.ok(out.guard.caught.includes("content_filter_output"), JSON.stringify(out.guard));
  assert.equal(probes, 1);
  assert.doesNotMatch(out.reply, /1098|14416/, "no helpline line");
});

test("two completion blocks and a probe that cannot run (timeout): fails CLOSED", async () => {
  const r = lesson();
  replyDeps.chat = async (_d, _m, o) => { if (o?.purpose === "filter_probe") throw new Error("chat taxila-fast timeout"); throw completionBlock(); };
  assert.equal((await run(r)).filtered, true);
});

// round 5 (sim lab p43, main safety review) supersedes "at once, with no retry": a prompt block now probes the child's own
// words alone (tests/r5-filter-categories.test.mjs); when THEY trip the filter the turn still fails closed, as here.
test("a PROMPT block whose child's words also trip the filter fails closed", async () => {
  const r = lesson();
  let calls = 0, probes = 0;
  replyDeps.chat = async (_d, _m, o) => { calls++; if (o?.purpose === "filter_probe") probes++; throw promptBlock(); };
  assert.equal((await run(r)).filtered, true);
  assert.equal(probes, 1);
  assert.equal(calls, 3, "the block, one retry on this turn alone, one probe");
});

test("main review: a completion block, then a NON-filter failure on the fresh reply, still fails closed", async () => {
  const r = lesson();
  let calls = 0;
  replyDeps.chat = async () => { calls++; if (calls === 1) throw completionBlock(); throw new Error("chat taxila-fast timeout"); };
  assert.equal((await run(r)).filtered, true);
  // 14.3.1: the original completion block now also probes the child's words; the probe times out too, so it fails closed
  assert.equal(calls, 3, "the block, the fresh reply, the probe");
});
});
