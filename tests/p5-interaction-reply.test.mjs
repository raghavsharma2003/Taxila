// p5-interaction reply guards in brain/say.js textReply (owner-2 on prod 2026-10-05: R3 bare question 9/90, R4 repeat 8/90,
// R6 gutted 3/90; owner-4: a reply opening on a dangling quote; "0. 4" cut decimals). The reply model is replaced
// (replyDeps), no network. Needs the patches (APPLY.md).
import { test, afterEach } from "node:test";
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
