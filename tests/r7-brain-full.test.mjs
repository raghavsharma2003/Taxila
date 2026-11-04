// round 7: main's judgement of the full hybrid run (docs/design/round7/judgements/hybrid-full-2026-11-04.md), the Director
// block, one test per defect on the exact transcript turn (evals/hybrid-side-by-side/results/2026-11-04-full/). Pure.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { textReply, replyDeps, affirmsAnswer, withoutAffirm } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const R7_FLAGS = ["TAXILA_R7_PARK_TOPIC", "TAXILA_R7_BYE_CHECKIN", "TAXILA_R7_FRUSTRATION"];
const R7_KEEP = {};
describe("r7-brain-full: the Director block after the full hybrid run", () => {
beforeEach(() => { for (const k of R7_FLAGS) { R7_KEEP[k] = process.env[k]; delete process.env[k]; } });
afterEach(() => { replyDeps.chat = chat; for (const k of R7_FLAGS) { if (R7_KEEP[k] === undefined) delete process.env[k]; else process.env[k] = R7_KEEP[k]; } });

const C5 = kitFromFile(getTopic("c5-maths-ch02-t01"));
const C4 = kitFromFile(getTopic("c4-maths-ch05-t01"));
const NE = cls("no_evidence");
const start = (K, classLevel) => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel, ageBand: "10-15", lang: "hinglish" }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
const turn = (K, r, text, c = NE, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000, ...extra });
const replyTo = async (K, r, childText, draft) => {
  replyDeps.chat = async () => ({ text: draft });
  return textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText, verdict: "ungraded", history: [], ui: r.ui, module: null });
};

test("#1 (c5 stuck T6, c4 offtopic T6): a verdict word only on a turn graded correct: '5?' and a game pick '3' are never 'sahi'", async () => {
  assert.equal(affirmsAnswer("Riya, agar tum kul barabar hisse 5 keh rahi ho, haan, wahi sahi hai."), true);
  assert.equal(affirmsAnswer("Sahi, Riya—1/3 mein 3 equal parts hote hain."), true);
  assert.equal(affirmsAnswer("Iska sahi tarika ye hai: pehle jodo."), false, "a neutral 'sahi' is not a verdict");
  assert.equal(affirmsAnswer("Achha, tumne 5 kaha."), false);
  assert.doesNotMatch(withoutAffirm("Sahi, Riya—1/3 mein 3 equal parts hote hain."), /^Sahi/);
  let r = start(C5, 5);
  for (let i = 0; i < 3; i++) r = turn(C5, r, "pata nahi");
  const a = await replyTo(C5, r, "5?", "Riya, agar tum kul barabar hisse 5 keh rahi ho, haan, wahi sahi hai. Pehla hissa 1/5 hota hai. Doosra nishaan kya hoga?");
  assert.equal(affirmsAnswer(a.reply), false, a.reply);
  assert.ok(a.guard.caught.includes("affirms"));
  let q = start(C4, 4);
  for (let i = 0; i < 2; i++) q = turn(C4, q, "haan");
  const b = await replyTo(C4, q, "3", "Sahi, Riya—1/3 mein 3 equal parts hote hain. Ab bolo, inmein se ek part ko fraction mein kaise likhenge?");
  assert.equal(affirmsAnswer(b.reply), false, b.reply);
});

test("#9 (c4 steering T5): the fixed fallback never asks a heard 'pata nahi' to say it again: a stuck signal gets help", async () => {
  const { fallbackReply, FALLBACK } = await import("../server/brain/say.js");
  let r = start(C4, 4);
  for (let i = 0; i < 2; i++) r = turn(C4, r, "haan");
  const st = (said) => ({ ...r.state, activeItemId: undefined, lastMove: { kind: "repair" }, recent: [...r.state.recent, { who: "child", text: said }] });
  assert.equal(fallbackReply(st("pata nahi"), null), FALLBACK.hinglish.stuck);
  assert.doesNotMatch(fallbackReply(st("pata nahi"), null), /phir se batao|kya kaha/);
  assert.equal(fallbackReply(st("cricket"), null), FALLBACK.hinglish.heard);
  assert.equal(fallbackReply(st(""), null), FALLBACK.hinglish.other, "no words heard: the re-ask stays");
});

test("#10 (c5 offtopic T6): with a game mounted, a spoken '3' is not a game event: 'Game ne 3 jumps register kiye' is caught", async () => {
  let r = start(C5, 5);
  for (let i = 0; i < 2; i++) r = turn(C5, r, "haan");
  replyDeps.chat = async () => ({ text: "Game ne 3 jumps register kiye—tum 3 over 5 par pahunchi. Ab 2 over 5 ke liye kitne jumps chahiye?" });
  const { gameActs } = await import("../server/brain/say.js");
  const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text", module: { id: "nishana", itemId: null } }, kit: C5, childText: "3",
    verdict: "ungraded", history: [], ui: r.ui, module: { id: "nishana" } });
  assert.equal(gameActs(out.reply), false, out.reply);
  assert.ok(out.guard.caught.includes("gameclaim"));
});

test("#2/#3 (c4 steady, c4 steering after 'hindi mein batao'): an English card is shown, never read: she asks it in the lesson's language", async () => {
  const { readsCard, looksEnglish, fallbackReply } = await import("../server/brain/say.js");
  const { promptFor } = await import("../server/director/items.js");
  const { fadeItem } = await import("../server/director/fading.js");
  const card = promptFor(fadeItem(C4, { index: 0 }), "hinglish");
  assert.equal(card, "Khaali jagah bharo: 1/3 means 1 of ___ equal groups.");
  assert.equal(looksEnglish(card), true);
  for (const lang of ["hinglish", "hindi"]) {
    let r = start(C4, 4);
    for (let i = 0; i < 2; i++) r = turn(C4, r, "haan");
    const st = { ...r.state, mode: "text", ctx: { ...r.state.ctx, lang, ...(lang === "hindi" ? { langPinned: true } : {}) },
      activeItemId: "fade:0", lastMove: { kind: "practice", itemId: "fade:0", skillId: C4.skills[0].id } };
    const calls = [];
    replyDeps.chat = async (_d, msgs) => { calls.push(msgs.at(-1).content); return { text: calls.length === 1 ? `Chalo dekhte hain. ${card}` : "Chalo, 1/3 ka matlab: kul kitne barabar group mein se ek? Batao, kitne group?" }; };
    const out = await textReply({ instructions: "x", state: st, kit: C4, childText: "haan", verdict: "ungraded", history: [], ui: { ask: { text: card, itemId: "fade:0" } }, module: null });
    assert.equal(readsCard(out.reply, card), false, `${lang}: ${out.reply}`);
    assert.match(calls[0], /never read it out; ask the same question in your own words/, "the first call already says so");
    // and the fixed fallback line points to the screen instead of reading it
    assert.doesNotMatch(fallbackReply(st, fadeItem(C4, { index: 0 })), /means 1 of/);
  }
});

test("#4 (c4 steady T5-T6): an answer to her own question ('4' to 'kitne groups?') is answered first, never skipped for a new question", async () => {
  let r = start(C4, 4);
  for (let i = 0; i < 2; i++) r = turn(C4, r, "haan");
  r = turn(C4, r, "4");
  const history = [{ who: "teacher", text: "1/3 ka matlab kya hai, kitne barabar groups banenge?" }, { who: "child", text: "4" }];
  const calls = [];
  replyDeps.chat = async (_d, msgs) => { calls.push(msgs.at(-1).content);
    return { text: calls.length === 1 ? "Riya, 15 pencils total hain. Ab batao, problem humse kya pooch rahi hai?" : "Tumne 4 kaha; 1/3 mein 3 barabar groups bante hain, 4 nahi. Ab batao, 15 pencils ke 3 groups mein ek group mein kitne?" }; };
  const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text", activeItemId: undefined, lastMove: { kind: "explain" } }, kit: C4, childText: "4", verdict: "ungraded", history: history.slice(0, 1), ui: {}, module: null });
  assert.match(calls[0], /They answered your last question with "4": respond to that answer FIRST/);
  assert.ok(out.guard.caught.includes("ignored"), JSON.stringify(out.guard));
  assert.match(out.reply, /\b4\b/, out.reply);
});
});
