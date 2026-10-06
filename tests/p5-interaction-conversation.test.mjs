// p5-interaction: the conversation layer's pure parts (server/conversation/*): the code-first readings, the UNDERSTAND note's
// parse and its graceful degradation, the policy that turns a note into a request, the Later list, and the reply guards.
// No network: the note's model call is injected.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { readIntent, P5_TYPES } from "../server/conversation/lexicon.js";
import { requestFromNote, requestFromReading, applyNote, parkEntry, pushLater, recentParked, dueParked, serveLater, sameTopic, LATER_MAX } from "../server/conversation/policy.js";
import { parseNote, understand, understandDeps, resetBreaker, inferLang, INTENTS } from "../server/conversation/understand.js";
import { sentences, tidy, isBare, repeatsEarlier, leadWithoutQuestion, jaccard } from "../server/conversation/guards.js";
import { p5On, p5Flag, conv2Mode } from "../server/conversation/flags.js";

const POS = {
  confused: ["samajh nahi aaya", "nahi samjha", "sorry kya bola? samajh nahi aaya", "bhai kuch samajh nahi aaya haha", "I don't get it", "समझ नहीं आया"],
  clarify: ["matlab?", "what do you mean?", "iska matlab kya hai"],
  repeat: ["phir se bolo", "sorry what?", "kya bola?"],
  back: ["mummy bula rahi thi, haan", "I'm back"],
  skip: ["skip", "next question", "isko chhodo"],
  harder: ["mushkil wala do", "too easy"],
  easier: ["easy wala do", "aasan sawaal do"],
  know: ["mujhe aata hai", "I know this"],
  boredom: ["boring", "bore ho raha hoon", "kitna aur?"],
  frustration: ["mujhse nahi hoga", "too hard"],
  thinking: ["ruko, soch raha hoon", "let me think", "ek minute", "hmm so it can't be that because wait", "matlab agar main isko do mein todu toh nahi ruko"],
  identity: ["tum robot ho?", "bhai tum robot ho kya? haha", "aap kaun ho?", "are you human?", "आप कौन हैं?"],
  small_talk: ["aap kaise ho?", "aapko kaunsa cricketer pasand hai?", "do you like dogs?", "kya time hua hai?", "आपको कौन सा खेल पसंद है?", "what's your favourite colour?"],
  oob: ["ghost story sunao", "mera homework kar do", "mere dost ko prank karne ka idea do jisse wo ro de", "tumhe kaunsi political party pasand hai"],
  break: ["brb", "can we pause for a bit?", "paani peeke aata hoon"],
  ask_invite: ["didi ek sawaal hai", "mera ek question hai", "didi ek sawaal poochun?", "can I ask a question?", "i have a doubt"],
  adult: ["hi this is his father can you go over this part again with him", "main iski mummy hoon aaj 10 minute mein khatam karna please"],
};
const NEG = ["haan", "ok samajh gaya", "3/4", "the answer is 12", "pehle 24 ko break karte hain", "ek min... haan bolo", "liquid, solid, gas", "dhoop wala", "asha", "yes",
  "hmm", "pata nahi", "i think it is half", "samajh gaya", "haan haan samajh gaya boss", "Four lakh eight thousand nineteen", "what is 3 times 4?",
  "why does the bar get bigger?", "kyunki 3 se divide hota hai", "see you have to add 5 and 3 to get 8", "i'm done, it's 24", "3/4 hai kyunki",
  "haan toh", "Prakrit, Brahmi lipi, pattharon par", "the election commission counts the votes"];

test("readIntent: the owner sessions' phrases are read; answers, fillers and lesson speech are not", () => {
  for (const [type, ps] of Object.entries(POS)) for (const p of ps) assert.equal(readIntent(p)?.type, type, `${JSON.stringify(p)} → ${type} (got ${readIntent(p)?.type})`);
  for (const p of NEG) assert.equal(readIntent(p), null, `${JSON.stringify(p)} is not a reading`);
  assert.deepEqual(new Set(Object.keys(POS)), new Set(P5_TYPES));
});

test("readIntent over every kit answer: at most 40 of 44,103 read as a request (31 measured 2026-10-05) (classify answerEchoes turns those back into answers)", () => {
  const dir = new URL("../data/kits/", import.meta.url);
  let n = 0, hits = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const k = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    for (const t of k.topics ?? []) for (const it of t.items ?? []) for (const a of [it.answer, ...(it.acceptable ?? []), ...(it.options ?? []).map((o) => o.text)]) {
      if (typeof a !== "string") continue;
      n++; if (readIntent(a)) hits++;
    }
  }
  assert.ok(n > 40_000, `${n} kit answers read`);
  assert.ok(hits <= 40, `${hits} kit answers read as a request`);
});

test("requestFromReading: every reading maps to a request type the Director acts on", () => {
  for (const t of P5_TYPES) assert.ok(requestFromReading({ type: t })?.type, t);
  assert.equal(requestFromReading({ type: "confused" }).type, "another");
  assert.equal(requestFromReading({ type: "oob" }).type, "decline");
  assert.equal(requestFromReading(null), null);
});

// ── the note ──
const NOTE = (o) => parseNote({ intent: "diversion", also: [], answer: "", topic: "cricket", learning: false, in_bounds: true, lang_to: "", method: "", distress: false, confidence: 0.9, ...o }, o.said ?? "");

test("parseNote: unknown intents are unusable; lang_to is filled by code; topics are reduced to letters", () => {
  assert.equal(parseNote({ intent: "nonsense" }), null);
  assert.equal(parseNote(null), null);
  assert.equal(NOTE({ intent: "language_switch", lang_to: "", said: "Hindi mein samjhao" }).langTo, "hindi");
  assert.equal(inferLang("english please"), "english");
  assert.equal(NOTE({ topic: "<b>cricket</b> {x}" }).topic, "bcricketb x");
  assert.equal(INTENTS.length, 46); // the battery's 47 labels minus multi_intent (a note carries it as also[])
});

test("applyNote: the note never grades, never subtracts distress, and only routes AWAY from grading", () => {
  const base = { outcome: "no_evidence", confidence: 1, source: "model", flags: { distress: false } };
  // a non-answer gets the note's request
  assert.equal(applyNote(base, NOTE({ intent: "diversion" })).request.type, "park");
  assert.equal(applyNote(base, NOTE({ intent: "out_of_bounds" })).request.type, "decline");
  assert.equal(applyNote(base, NOTE({ intent: "diversion", in_bounds: false })).request.type, "decline");
  // a graded answer keeps its outcome; a parked question rides along
  const graded = applyNote({ ...base, outcome: "correct" }, NOTE({ intent: "answer_correct", also: ["curiosity_offlesson"], topic: "black holes" }));
  assert.equal(graded.outcome, "correct");
  assert.equal(graded.request, undefined);
  assert.equal(graded.alsoPark.topic, "black holes");
  // a mid-thought the classifier graded wrong: no verdict (route away); a correct one is never touched
  assert.equal(applyNote({ ...base, outcome: "incorrect" }, NOTE({ intent: "thinking_aloud" })).outcome, "no_evidence");
  assert.equal(applyNote({ ...base, outcome: "correct" }, NOTE({ intent: "thinking_aloud" })).outcome, "correct");
  // a non-answer is never made evidence
  for (const i of ["answer_correct", "answer_wrong", "check_my_work"]) assert.equal(applyNote(base, NOTE({ intent: i })).outcome, "no_evidence");
  // distress: OR-ed in, never subtracted
  assert.equal(applyNote(base, NOTE({ intent: "distress", distress: true })).flags.distress, true);
  assert.equal(applyNote({ ...base, flags: { distress: true } }, NOTE({ intent: "joke" })).flags.distress, true);
  // the bytes decided first: a request already there stays
  assert.equal(applyNote({ ...base, request: { type: "visual" } }, NOTE({ intent: "joke" })).request.type, "visual");
  // shadow: nothing changes but the trace
  const sh = applyNote(base, NOTE({ intent: "diversion" }), { mode: "shadow" });
  assert.equal(sh.request, undefined);
  assert.equal(sh.noteShadow.intent, "diversion");
});

test("a stop or a leaving read by the note alone is a check-in request, never an end", () => {
  for (const i of ["end_request", "leaving"]) assert.deepEqual(requestFromNote(NOTE({ intent: i })).type, "stop");
  for (const i of ["backchannel", "noise", "answer_correct", "dont_know"]) assert.equal(requestFromNote(NOTE({ intent: i })), null, i);
});

test("understand(): a usable note; a 429 opens the breaker (no calls for BREAKER_MS); errors and junk are null; never throws", async () => {
  const real = { ...understandDeps };
  let calls = 0, t = 1_000;
  try {
    understandDeps.now = () => t;
    understandDeps.chat = async () => { calls++; return { json: { intent: "joke", also: [], answer: "", topic: "", learning: false, in_bounds: true, lang_to: "", method: "", distress: false, confidence: 0.8 } }; };
    resetBreaker();
    assert.equal((await understand({ said: "haha you are funny" })).intent, "joke");
    understandDeps.chat = async () => { calls++; const e = new Error("429"); e.status = 429; throw e; };
    assert.equal(await understand({ said: "x y" }), null);
    const before = calls;
    assert.equal(await understand({ said: "x y" }), null);
    assert.equal(calls, before, "breaker open: no call");
    t += 31_000;
    understandDeps.chat = async () => { calls++; return { json: { intent: "???" } }; };
    assert.equal(await understand({ said: "x y" }), null);
    assert.equal(calls, before + 1);
    understandDeps.chat = async () => { throw new Error("boom"); };
    assert.equal(await understand({ said: "x y" }), null);
    assert.equal(await understand({ said: "   " }), null);
  } finally { Object.assign(understandDeps, real); resetBreaker(); }
});

test("the Later list: at most LATER_MAX open, no duplicate topic, return after the item / before the wrap, detour within 3 turns", () => {
  let L = [];
  const T = ["cricket", "volcanoes", "rockets", "dinosaurs", "rainbows", "magnets", "robots"];
  for (let i = 0; i < 7; i++) L = pushLater(L, parkEntry({ topic: `${T[i]} words${i}`, learning: i % 2 === 0, turn: i, itemOnTable: i < 3 }));
  assert.equal(L.length, LATER_MAX);
  assert.equal(pushLater(L.slice(0, 2), parkEntry({ topic: "about cricket again", turn: 9 })).length, 2, "the same topic is not parked twice");
  assert.equal(dueParked(L, "item_resolved").promise, "after_question");
  assert.ok(dueParked(L, "before_wrap").learning);
  assert.equal(recentParked(L, 5, "words4")?.topic, "rainbows words4");
  assert.equal(recentParked(L, 50, "words4"), null);
  const served = serveLater(L, L[0].id, 9);
  assert.equal(served[0].servedAt, 9);
  assert.ok(sameTopic("black holes kya hain", "about black holes"));
});

// ── reply guards ──
test("guards: decimals are never cut, orphan quotes go, a bare question and a repeat are caught", () => {
  assert.deepEqual(sentences("2/5 ko 0.4 samajhiye aur 1/2 ko 0.5. Next?").length, 2);
  assert.equal(tidy("Aarav, 2/5 do gaps par hai. ” Khaali jagah bhariye."), "Aarav, 2/5 do gaps par hai. Khaali jagah bhariye.");
  assert.equal(tidy("” What is your prediction, and why?"), "What is your prediction, and why?");
  assert.equal(tidy("Use “of” here."), "Use “of” here.");
  const q = "Khaali jagah bharo: 1/3 means 1 of ___ equal groups.";
  assert.equal(isBare(q, q, q), true);
  assert.equal(isBare(`Golu, neeche ka number groups batata hai. ${q}`, q, q), false);
  assert.equal(repeatsEarlier("Theek hai Zoya, mummy ke paas jaiye.", ["Theek hai Zoya, mummy ke paas jaiye."]), true);
  assert.equal(repeatsEarlier("Something new about water vapour here.", ["Theek hai Zoya, mummy ke paas jaiye."]), false);
  assert.equal(leadWithoutQuestion("Khaali jagah bhariye: 2/5 is ___ the middle. ", "Khaali jagah bhariye: Check: 2/5 is ___ the middle, because 2/5 is less than 1/2."), "");
  assert.ok(jaccard("a b c", "a b c") === 1);
});

test("flags: every switch defaults on; TAXILA_P5=off turns all off; TAXILA_CONV2=shadow", () => {
  const saved = { ...process.env };
  try {
    delete process.env.TAXILA_P5; delete process.env.TAXILA_P5_GUARDS; delete process.env.TAXILA_CONV2;
    assert.equal(p5On(), true); assert.equal(p5Flag("GUARDS"), true); assert.equal(conv2Mode(), "on");
    process.env.TAXILA_P5_GUARDS = "off"; assert.equal(p5Flag("GUARDS"), false); assert.equal(p5Flag("STEER"), true);
    process.env.TAXILA_CONV2 = "shadow"; assert.equal(conv2Mode(), "shadow");
    process.env.TAXILA_P5 = "OFF"; assert.equal(p5Flag("STEER"), false); assert.equal(conv2Mode(), "off");
  } finally { for (const k of ["TAXILA_P5", "TAXILA_P5_GUARDS", "TAXILA_CONV2"]) { if (k in saved) process.env[k] = saved[k]; else delete process.env[k]; } }
});

test("the trace keeps the p5 codes: every request type, every note intent, the cap and module.unverifiable are in the closed vocabulary", async () => {
  const { isReason, knownReasons } = await import("../server/brain/reasons.js");
  const { INTENTS } = await import("../server/conversation/understand.js");
  const { P5_REQUESTS } = await import("../server/director/state.js");
  for (const i of INTENTS) { assert.ok(isReason(`conv2.note.${i}`), i); assert.ok(isReason(`conv2.shadow.${i}`), i); }
  for (const t of [...P5_REQUESTS, "another", "example", "story", "slower", "visual", "language", "topic", "change_topic", "confused", "thinking"]) assert.ok(isReason(`request.${t}`), t);
  assert.deepEqual(knownReasons(["conv2.no_note", "p5.capped.assert", "p5.capped.leave", "module.unverifiable", "request.nonsense"]),
    ["conv2.no_note", "p5.capped.assert", "p5.capped.leave", "module.unverifiable"]);
});
