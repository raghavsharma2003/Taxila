// dc-r7-script-walk-v6-1 R7/R8 (main's director9 judgement): no model-written teaching in script mode; "samajh nahi aaya" /
// "pata nahi" get the authored `simpler` (format 2.3). Replays go through the real turn path (tests/fixtures/replay.mjs).
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { replay } from "./fixtures/replay.mjs";
import { textReply, replyDeps, RULE_SAID } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest, scriptWorkedStepSmaller, SCRIPT_VERSIONS } from "../server/director/script.js";

const RUN = "2026-11-06-director9";
const runScript = (T) => JSON.parse(readFileSync(new URL(`../evals/hybrid-side-by-side/results/${RUN}/scripts/${T}.json`, import.meta.url), "utf8"));
const KEEP = {};
beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
const sayAt = async (kit, plan, draft, state = plan.state) => { replyDeps.chat = async () => ({ text: draft }); return textReply({ instructions: instructionsFor(state, kit), state, kit, childText: plan.child, history: [], ui: plan.p.r.ui, module: null }); };

const T1 = "c5-maths-ch02-t01";
const T27_DRAFT = "10 barabar gaps mein, chhota denominator wala fraction pehle aata hai, aur bada denominator wala chhota gap hota hai. Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?";

test("R7 replay director9 c5-t01 offtopic T27: 'samajh nahi aaya' on e3 never gets her own 'smaller' lines (the misconception as a rule), only authored words", async () => {
  setScriptForTest(T1, runScript(T1));
  const { kit, last } = await replay(RUN, "offtopic", T1, 27);
  assert.equal(last.child, "samajh nahi aaya");
  assert.equal(last.state.lastMove?.smaller, true);
  const out = await sayAt(kit, last, T27_DRAFT);
  assert.doesNotMatch(out.reply, /chhota denominator wala fraction pehle aata hai/, out.reply);
  assert.equal(out.guard.smaller, "point");
  assert.ok(out.reply.startsWith(last.state.lastMove.point.split(/(?<=\.)\s/)[0]), out.reply);
});

test("R7/R8 (format 2.3): an explain beat's authored simpler is what 'samajh nahi aaya' gets", async () => {
  const sc = runScript(T1);
  const e3 = sc.skills[0].explain.find((b) => b.id === "e3");
  e3.simpler = { hi: "Ek roti ko 10 tukdon mein kaato, har tukda chhota hoga. 5 tukdon wala har tukda usse bada hai.", en: "Cut one roti into 10 pieces and each is small. A piece of 5 is bigger." };
  setScriptForTest(T1, { ...sc, version: 2.3 });
  const { kit, last } = await replay(RUN, "offtopic", T1, 27);
  assert.equal(last.state.lastMove?.simpler, e3.simpler.hi);
  const out = await sayAt(kit, last, T27_DRAFT);
  assert.ok(out.reply.startsWith("Ek roti ko 10 tukdon mein kaato, har tukda chhota hoga. 5 tukdon wala har tukda usse bada hai."), out.reply);
  assert.equal(out.guard.smaller, "authored");
  assert.ok(SCRIPT_VERSIONS.includes(2.3));
});

test("R8 (format 2.3): 'pata nahi' on a live scripted card gets the card's authored simpler, never a model hint", async () => {
  const sc = runScript(T1);
  const ask = sc.skills[0].explain.find((b) => b.id === "e1").ask;
  ask.simpler = { hi: "Line ke 0 aur 1 ke beech gaps gino, marks nahi.", en: "Count the gaps between 0 and 1, not the marks." };
  setScriptForTest(T1, { ...sc, version: 2.3 });
  const { kit, last } = await replay(RUN, "steady", T1, 11);
  assert.equal(last.child, "pata nahi");
  assert.equal(last.p.r.move.kind, "hint");
  assert.equal(last.state.lastMove?.simpler, ask.simpler.hi);
  const out = await sayAt(kit, last, "Riya, 1/3 ka matlab hai 3 barabar hisse, aur pehla hissa 1/3 hota hai. Ab batao.");
  assert.match(out.reply, /^Line ke 0 aur 1 ke beech gaps gino, marks nahi\./, out.reply);
  assert.doesNotMatch(out.reply, /1\/3 ka matlab/);
});

test("R7: a right answer's reason is the card's authored why; her own reason goes", async () => {
  setScriptForTest(T1, runScript(T1));
  const { kit, last } = await replay(RUN, "steady", T1, 21);
  const out = await sayAt(kit, last, "Haan, sahi hai, kyunki chhote denominator ka gap bada hota hai aur 1/8 sabse pehle aata hai. Taiyaar ho?");
  assert.match(out.reply, /^Haan, sahi hai, kyunki sadak 8 barabar hisson mein hai/, out.reply);
  assert.doesNotMatch(out.reply, /chhote denominator/);
  assert.equal(out.guard.rightWhy, "authored");
});

test("R7: a sentence of hers that states the live card's listed wrong answer as true goes; a rule of hers in a scripted turn goes", async () => {
  setScriptForTest(T1, runScript(T1));
  const { kit, last } = await replay(RUN, "offtopic", T1, 25); // e3's card is live (wrongIfMis 1/5)
  assert.equal(last.p.r.move.kind, "practice");
  const out = await sayAt(kit, last, `Socho, 1/5 zero ke zyada paas hai. Sadak ke hisse hamesha barabar hote hain. ${last.p.r.ui.ask.text}`);
  assert.doesNotMatch(out.reply, /1\/5 zero ke zyada paas hai/, out.reply);
  assert.doesNotMatch(out.reply, /hamesha barabar hote hain/, out.reply);
  assert.ok(out.reply.endsWith(last.p.r.ui.ask.text.trim()), "the card stays");
  assert.ok(RULE_SAID.test("Cheenti har kinaare se do baar guzarti hai.") && !RULE_SAID.test("Chalo, ek baar aur dekhte hain."));
});

test("R7 (format 2.3): a worked step said smaller is its authored simpler when there is one", () => {
  assert.equal(scriptWorkedStepSmaller({ do: { hi: "8 aur 3 jodo", en: "add 8 and 3" }, result: "11", simpler: { hi: "Pehle 8 lo, phir 3 aage gino", en: "Take 8, count 3 on" } }), "Pehle 8 lo, phir 3 aage gino.");
  assert.equal(scriptWorkedStepSmaller({ do: { hi: "8 aur 3 jodo", en: "add 8 and 3" }, result: "11" }), "Bas yeh ek kadam: 8 aur 3 jodo, aur milta hai 11.");
});
