// p5-interaction reply guards in brain/say.js textReply (owner-2 on prod 2026-10-05: R3 bare question 9/90, R4 repeat 8/90,
// R6 gutted 3/90; owner-4: a reply opening on a dangling quote; "0. 4" cut decimals). The reply model is replaced
// (replyDeps), no network. Needs the patches (APPLY.md).
import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { textReply, replyDeps, tidyAround, GUTTED_MIN } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { initLessonState, step } from "../server/director/state.js";
import { promptFor } from "../server/director/items.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const fresh = () => initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 });
const turn = (r, c) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000 });
function toPractice() {
  let r = step(fresh(), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, cls("no_evidence"));
  return r;
}
// File-scoped: a top-level hook wraps EVERY file's tests in the shared npm-test process (rj: shared-process hook leak).
describe('p5-interaction reply', () => {
afterEach(() => { replyDeps.chat = chat; delete process.env.TAXILA_P5_GUARDS; });
const scripted = (...texts) => { const seen = []; let i = 0; replyDeps.chat = async (_d, msgs) => { seen.push(msgs.at(-1).content); return { text: texts[Math.min(i++, texts.length - 1)] }; }; return seen; };

test("bare: a reply that is only the question again is rewritten (one model call) with a reason that asks for an uptake", async () => {
  const r = turn(toPractice(), cls("incorrect"));               // a hint move on the item
  const item = r.item;
  const q = promptFor(item, CTX.lang);
  const seen = scripted(q, `Socho, dono tukde barabar hain kya? ${q}`);
  const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "1/3", history: [], ui: r.ui, module: r.state.module, verdict: "not_yet" });
  assert.ok(out.guard.caught.includes("bare"), JSON.stringify(out.guard));
  assert.match(seen.at(-1), /only the question again/);
  assert.notEqual(out.reply.trim(), q.trim());
});

test("bare after the rewrite on a hint turn: the rung's own kit hint (never the key, never a teacher note) leads the question", async () => {
  const r = turn(turn(toPractice(), cls("incorrect")), cls("incorrect"));
  const q = r.ui.ask.text;
  scripted(q, q);
  const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "1/3", history: [], ui: r.ui, module: r.state.module, verdict: "not_yet" });
  assert.ok(out.reply.length > q.length, out.reply);
  assert.ok(!String(out.reply).toLowerCase().includes("assertion"), "no rung label");
});

test("same: a line she already said in this lesson is rewritten", async () => {
  const r = turn(toPractice(), cls("incorrect"));
  const q = r.ui.ask.text;
  const old = `Theek hai, ek baar phir socho. ${q}`;
  const seen = scripted(old, `Roti ke do barabar tukde socho. ${q}`);
  const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "1/3", history: [{ who: "teacher", text: old }, { who: "child", text: "1/3" }], ui: r.ui, module: r.state.module, verdict: "not_yet" });
  assert.ok(out.guard.caught.includes("same"));
  assert.match(seen.at(-1), /repeats what you already said/);
});

test("tidy: an orphan closing quote and a re-posed blank are gone; the verified question is kept byte for byte", () => {
  const ask = "Khaali jagah bhariye: Check: 2/5 is ___ the middle, because 2/5 is less than 1/2.";
  assert.equal(tidyAround(`Aarav, 2/5 do gaps par hai. ” Khaali jagah bhariye: 2/5 is ___ the middle. ${ask}`, ask), `Aarav, 2/5 do gaps par hai. ${ask}`);
  assert.equal(tidyAround("” What is your prediction, and why?", null), "What is your prediction, and why?");
  assert.equal(tidyAround("2/5 ko 0.4 samajhiye, 1/2 ko 0.5. Kaun bada?", null), "2/5 ko 0.4 samajhiye, 1/2 ko 0.5. Kaun bada?");
});

test("gutted: a teaching turn under GUTTED_MIN words gets one more attempt at a full turn", async () => {
  // an explain turn: no item on the table
  let r = step(fresh(), { event: "start", kit: K, now: 0 });
  while (!["explain", "hook"].includes(r.move.kind)) r = turn(r, cls("no_evidence"));
  const full = "Socho ek roti ko barabar tukdon mein kaata. Har tukda ek jaisa bada hota hai. Tum batao, tukde barabar kyun hone chahiye?";
  scripted("What do you predict?", full);
  const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "haan", history: [], ui: r.ui, module: r.state.module });
  assert.ok(out.reply.split(/\s+/).length >= GUTTED_MIN, out.reply);
});

test("kill switch: TAXILA_P5_GUARDS=off — a bare question ships as before (HEAD)", async () => {
  process.env.TAXILA_P5_GUARDS = "off";
  const r = turn(toPractice(), cls("incorrect"));
  const q = promptFor(r.item, CTX.lang);
  scripted(q);
  const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "1/3", history: [], ui: r.ui, module: r.state.module, verdict: "not_yet" });
  assert.ok(!out.guard.caught.includes("bare"));
});

test("thinking aloud: a reply that asks a question is rewritten to a go-on; a right answer is confirmed first (noconfirm)", async () => {
  const { classifyFast, targetFor } = await import("../server/director/classify.js");
  const { findItem } = await import("../server/director/items.js");
  let r = toPractice();
  const target = targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId));
  const c = classifyFast({ target, childText: "ruko, soch raha hoon", typed: true }).result;
  const t = turn(r, c);
  const seen = scripted("Haan, kaunsa part dekh rahe ho?", "Haan, aaram se socho, main sun rahi hoon.");
  const out = await textReply({ instructions: "x", state: t.state, kit: K, childText: "ruko, soch raha hoon", history: [], ui: t.ui, module: t.state.module });
  assert.ok(out.guard.caught.includes("thinkq"), JSON.stringify(out.guard));
  assert.match(seen.at(-1), /ask nothing at all/);
  assert.doesNotMatch(out.reply, /\?/);
  // a right answer: the reply opens by confirming it
  r = toPractice();
  const right = turn(r, cls("correct"));
  const seen2 = scripted("Ab batao, tumne yeh kaise socha?", "Sahi, 1/2 hi hai! Ab batao, tumne yeh kaise socha?");
  const out2 = await textReply({ instructions: "x", state: right.state, kit: K, childText: "1/2", history: [], ui: right.ui, module: right.state.module, verdict: "correct" });
  assert.ok(out2.guard.caught.includes("noconfirm"), JSON.stringify(out2.guard));
  assert.match(seen2.at(-1), /open by confirming it/);
});

test("a REQUESTED story whose numbers state the key is not cut to the bare question: one more attempt with other numbers", async () => {
  const r0 = toPractice();
  const r = turn(r0, { ...cls("no_evidence"), source: "chip", request: { type: "story", whole: true } });
  assert.equal(r.state.lastMove?.request, "story");
  const item = r.item, q = r.ui.ask.text, key = String(item.answer);
  const leaky = `Ek din Riya ne socha, jawab ${key} hai, haan ${key}. ${q}`;
  const clean = `Ek din Riya ne ek roti ke barabar tukde kiye aur sabko ek-ek diya. ${q}`;
  const seen = scripted(leaky, leaky, clean);
  const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "Tell it as a story", history: [], ui: r.ui, module: r.state.module, verdict: null });
  assert.ok(out.guard.caught.includes("leak"), JSON.stringify(out.guard));
  assert.equal(out.guard.reasked, true, JSON.stringify(out.guard));
  assert.match(seen.at(-1), /different numbers/);
  assert.equal(out.reply, clean);
});
});
