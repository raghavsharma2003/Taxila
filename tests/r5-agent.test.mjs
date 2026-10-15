// round 5 (stream 4A; docs/design/round5/AGENT.md): the Teacher agent lane's harness invariants, with a stubbed model.
// The model decides the teaching; the harness decides what may happen: a posed item is an offered (verified) one, silence
// brings no new content, the board is drawn by code and reported, a spoken line never asks to type, budgets throw. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { agentTurn, applyAgentTurn, eventOf, gradeOf, earnedRead, withoutPraise, withoutInternals, withoutMastery, withoutGamePromise, AgentBudgetError } from "../server/agent/agent.js";
import { laneFor, teacherMode } from "../server/agent/flags.js";
import { specOf } from "../server/agent/tools.js";
import { systemPrompt, stateMessage, offeredItems, TURN_SCHEMA } from "../server/agent/prompt.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";
import { floorText } from "../server/compiler/floor.js";

const K = kit();
const KEEP = { action: "keep", kind: null, lines: [], mark: [], columns: [], rows: [], layout: null, subject: null, shapes: [] };
const SHOW = (lines) => ({ ...KEEP, action: "show", kind: "write", lines });
// stream 2's screen tools, stubbed: a write page goes up with its lines; nothing else is up until something is shown
const fakeTools = () => {
  const t = { calls: [], up: { ok: true, on: "nothing", words: "nothing is on the screen", texts: [], numbers: [] } };
  return Object.assign(t, {
    now: () => t.up,
    show: async (lessonId, spec, o) => { t.calls.push(["show", spec, o]); if (spec.kind === "draw") return { ...t.up, ok: false, refused: { why: "cannot sketch", checks: ["subject"] } };
      t.up = { ok: true, on: "board", words: `the board shows writing; written on it: ${spec.lines.join("; ")}`, texts: spec.lines, numbers: [], pageId: "p1" }; return t.up; },
    clear: () => { t.calls.push(["clear"]); t.up = { ok: true, on: "nothing", words: "the board is empty", texts: [], numbers: [] }; return t.up; },
    picture: (lessonId, subject) => { t.calls.push(["picture", subject]); return { ...t.up, ok: true, job: { id: "j1", etaMs: 15000 } }; },
    slot: (lessonId, pageId) => ({ slotId: `${pageId}:slot`, intentId: pageId, state: "revealed" }),
    news: () => [],
  });
};
const base = (over = {}) => ({ intent: "explain", say: "Chalo, aaj hum fractions dekhte hain.", pose_item: null, board: KEEP,
  picture: null, read: { skill: null, level: "unknown", evidence: "" }, plan: "1. equal parts 2. compare", end: false, ...over });
const stub = (json) => async (dep, messages, opts) => { stub.last = { dep, messages, opts }; return { json, usage: { prompt_tokens: 900, completion_tokens: 80 } }; };
const ST = (over = {}) => ({ turn: 3, phase: "teach", ctx: { ...CTX, classLevel: 4 }, itemsDone: [], skipped: [], ...over });
const run = (json, over = {}) => agentTurn({ state: ST(over.state), kit: K, event: "x", lessonId: "L1", chatFn: stub(json), tools: fakeTools(), ...over, state: ST(over.state) });

test("the lane: off wins, agent for all, the cohort by email or sha256", () => {
  assert.equal(laneFor({ email: "a@b.c" }, {}), "director");
  assert.equal(laneFor({ email: "a@b.c" }, { TAXILA_TEACHER: "agent" }), "agent");
  assert.equal(laneFor({ email: "A@b.c" }, { TAXILA_TEACHER_AGENT_FOR: "a@b.c" }), "agent");
  assert.equal(laneFor({ email: "a@b.c" }, { TAXILA_TEACHER: "off", TAXILA_TEACHER_AGENT_FOR: "a@b.c" }), "director");
  assert.equal(laneFor({ email: "x@b.c" }, { TAXILA_TEACHER_AGENT_FOR: "a@b.c" }), "director");
  assert.equal(teacherMode({ TAXILA_TEACHER: "director" }), "off");
});

test("the prompt: the floor is the last section; keys are never shown; schema is strict", () => {
  const sp = systemPrompt({ ...CTX, classLevel: 4 });
  assert.ok(sp.endsWith(floorText()));
  assert.match(floorText(), /1098/);
  const sm = stateMessage({ state: ST(), kit: K, event: "lesson_start", onScreen: [], lane: "voice" });
  assert.ok(!/\b(answer|acceptable)\s*:/i.test(sm.split("OFFERED ITEMS")[1].split("CARD NOW")[0]));
  assert.ok(sm.trim().endsWith("EVENT: lesson_start"));
  assert.equal(TURN_SCHEMA.additionalProperties, false);
  // an unverified item (solver disagrees) and a non-gradable kind are never offered
  const ids = offeredItems(ST(), K, 20).map((i) => i.id);
  assert.ok(!ids.includes("bad")); assert.ok(!ids.includes("i8"), "a teachback is never a card item"); assert.ok(ids.includes("i5"), "a why item is (round 5: deep evidence)");
});

test("a posed item must be an offered one; the card question closes her line", async () => {
  const ok = await run(base({ intent: "practice", say: "Ek sawaal.", pose_item: "i1" }));
  assert.equal(ok.item.id, "i1");
  assert.match(ok.say, /\?$/);
  const imp = await run(base({ intent: "practice", say: "Mele mein kya-kya dikhta hai. Teen cheezein batao.", pose_item: "i1" }));
  assert.equal(imp.say, "Mele mein kya-kya dikhta hai. Teen cheezein batao.");
  const bad = await run(base({ intent: "practice", say: "Batao 10 ka aadha?", pose_item: "bad" }));
  assert.equal(bad.item, null);
  assert.ok(bad.notes.some((n) => /not an offered item/.test(n)));
  const invented = await run(base({ pose_item: "made-up-7" }));
  assert.equal(invented.item, null);
});

test("silence brings no new item, no board, no picture, no end", async () => {
  const out = await run(base({ intent: "practice", pose_item: "i2", board: SHOW(["1/2", "1/4"]), picture: "roti", end: true }), { silent: true });
  assert.equal(out.item, null); assert.equal(out.board, null); assert.equal(out.picture, null); assert.equal(out.end, false);
  // the same card question may be asked again
  const again = await run(base({ pose_item: "i2" }), { silent: true, state: { activeItemId: "i2" } });
  assert.equal(again.item.id, "i2");
});

test("channel truth: a spoken line never asks to type; screen truth: no board claim without a board", async () => {
  const typed = await run(base({ say: "Apna jawab type karke bhejo." }));
  assert.ok(!/type kar/i.test(typed.say), typed.say);
  const claim = await run(base({ say: "Board par dekho, maine do roti banayi hain. Kaunsi badi hai?" }));
  assert.ok(!/board par dekho/i.test(claim.say), claim.say);
  const tools = fakeTools();
  const shown = await run(base({ say: "Board par dekho: 1/2 aur 1/4. Kaunsa bada hai?", board: SHOW(["1/2", "1/4"]) }), { tools });
  assert.deepEqual(shown.board.texts, ["1/2", "1/4"]);
  assert.equal(tools.calls[0][2].say, shown.say, "the page is gated against her line");
  assert.equal(shown.slot.intentId, "p1", "the response carries the gated slot");
  assert.match(shown.say, /Board par dekho/);
});

test("budgets throw (the Director then takes the turn); a bad output throws", async () => {
  await assert.rejects(run(base(), { state: { agent: { usage: { usd: 9, tokens: 0 } } } }), AgentBudgetError);
  await assert.rejects(run({ ...base(), say: "" }), /no line/);
  const out = await run(base());
  assert.ok(out.usage.tokens > 0);
});

test("the board goes through stream 2's tools: a refused page is not up and her pointing is removed; a picture is a job", async () => {
  const tools = fakeTools();
  const r = await run(base({ say: "Board par dekho, ek roti hai. Kitne tukde hain?", board: { ...KEEP, action: "show", kind: "draw", subject: "roti" } }), { tools });
  assert.equal(r.board, null);
  assert.ok(!/board par dekho/i.test(r.say), r.say);
  assert.ok(r.notes.some((n) => /board refused/.test(n)));
  const p = await run(base({ say: "Main ek photo banwa rahi hoon.", picture: "elephant" }), { tools: fakeTools() });
  assert.equal(p.picture.job.id, "j1");
  assert.equal(specOf({ ...KEEP, kind: "number_line", mark: ["1/4"] }).mark[0], "1/4");
  assert.equal(specOf({ ...KEEP, kind: "write", lines: [] }), null, "nothing to draw is no page");
  // a picture's arrival is told to her in the next event
  const t2 = fakeTools(); t2.news = () => ["content_ready: the screen shows a picture of an elephant"];
  await run(base(), { tools: t2 });
  assert.match(stub.last.messages[1].content, /EVENT: content_ready: the screen shows a picture of an elephant/);
});

test("the event carries the verified grade, never asks the model to grade", () => {
  const item = K.items.find((i) => i.id === "i3");
  assert.equal(gradeOf(cls("correct"), item, K), "correct");
  const ev = eventOf({ kind: "turn", childText: "1/3", asrConfidence: 0.9, cls: { ...cls("misconception"), misconceptionId: "c4-maths-ch05-t01-m1" }, card: item, kit: K, lang: "hinglish" });
  assert.match(ev, /VERIFIED GRADE/); assert.match(ev, /c4-maths-ch05-t01-m1/); assert.match(ev, /harness read: not/);
  assert.match(eventOf({ kind: "silence" }), /no words/);
});

test("apply: a posed item becomes the card; an answered card clears; end → done", async () => {
  const next = ST();
  const o1 = await run(base({ intent: "practice", say: "Batao?", pose_item: "i1" }));
  const a1 = applyAgentTurn(next, o1, { kit: K, childText: "haan", lessonId: "L1" });
  assert.equal(next.activeItemId, "i1"); assert.equal(next.phase, "practice"); assert.equal(a1.ui.ask.itemId, "i1");
  assert.equal(a1.move.agent, true);
  const card = K.items.find((i) => i.id === "i1");
  const o2 = await run(base({ intent: "celebrate", say: "Bilkul sahi!" }));
  applyAgentTurn(next, o2, { kit: K, childText: "1/2", cls: cls("correct"), card, lessonId: "L1" });
  assert.equal(next.activeItemId, undefined); assert.ok(next.itemsDone.includes("i1"));
  assert.deepEqual(next.agent.learner["c4-maths-ch05-t01-s1"].grades, ["correct"]);
  const o3 = await run(base({ intent: "wrap", say: "Aaj bas itna.", end: true }));
  const a3 = applyAgentTurn(next, o3, { kit: K, childText: "bye", lessonId: "L1" });
  assert.equal(next.phase, "done"); assert.equal(a3.end, true); assert.equal(a3.move.kind, "wrap");
});

test("understood is earned on a DEEP kind plus another right answer; two plain items are partly; a miss is recovered by three right after it, one deep (sim lab b185d50; cc4b3d2 overclaims)", () => {
  const C = (item, kind = "practice", g = "correct") => ({ item, kind, g });
  assert.equal(earnedRead("understood", [C("i1")]), "partly");
  assert.equal(earnedRead("understood", [C("i1"), C("i2")]), "partly", "two plain items right: a partly child does that a quarter of the time");
  assert.equal(earnedRead("understood", [C("i1"), C("i4", "near_transfer")]), "understood");
  assert.equal(earnedRead("understood", [C("i4", "near_transfer")]), "partly", "one deep item alone");
  assert.equal(earnedRead("understood", [C("i1", "practice", "wrong"), C("i2"), C("i3", "contrast")]), "partly", "two right after a miss: not yet recovered");
  assert.equal(earnedRead("understood", [C("i1", "practice", "wrong"), C("i2"), C("i3", "contrast"), C("i5")]), "understood", "three right after the miss, one deep");
  assert.equal(earnedRead("understood", [C("i1", "practice", "partly"), C("i2"), C("i5"), C("i6")]), "partly", "three plain right after a miss: no deep one");
  assert.equal(earnedRead("understood", [C("i1", "practice", "wrong"), C("i2"), C("i3")], { deepAvailable: false }), "partly", "no deep item in the kit: still three after the miss");
  assert.equal(earnedRead("understood", [C("i2"), C("i3", "contrast"), C("i7", "practice", "wrong")]), "partly", "a miss after the deep right one");
  assert.equal(earnedRead("understood", [C("i1", "practice", "wrong")]), "not");
  assert.equal(earnedRead("partly", []), "partly");
  // a skill whose kit has no deep item: two different items right
  assert.equal(earnedRead("understood", [C("i1"), C("i2")], { deepAvailable: false }), "understood");
  assert.equal(earnedRead("understood", [C("i1"), C("i1")], { deepAvailable: false }), "partly");
});

test("a misconception the child showed puts the item that tests it first, and the read is held to the evidence", async () => {
  const next = ST();
  const card = K.items.find((i) => i.id === "i1");
  const o = await run(base({ intent: "reteach", say: "Socho, roti ke do tukde.", read: { skill: card.skillId, level: "understood", evidence: "said it" } }));
  applyAgentTurn(next, o, { kit: K, childText: "1/3", cls: { ...cls("misconception"), misconceptionId: "c4-maths-ch05-t01-m1" }, card, lessonId: "L1" });
  assert.equal(next.agent.learner[card.skillId].read, "not", "a wrong answer and no right one is not understood");
  assert.equal(next.agent.learner[card.skillId].claimed, "understood");
  const first = offeredItems(next, K)[0];
  assert.equal(first.targetsMisconception, "c4-maths-ch05-t01-m1");
  assert.match(stateMessage({ state: next, kit: K, event: "x", onScreen: [], lane: "voice" }), /showed c4-maths-ch05-t01-m1/);
});

test("no praise on an answer the key says is wrong or partly right (sim lab misread_wrong_as_right); praise stays on a right one", async () => {
  const line = "Haan, 60,000 sahi chuna. Ab socho, estimate exact kyun nahi hota?";
  assert.equal((await run(base({ say: line }), { verdict: "wrong" })).say, "Ab socho, estimate exact kyun nahi hota?");
  assert.equal((await run(base({ say: line }), { verdict: "partly" })).say, "Ab socho, estimate exact kyun nahi hota?");
  assert.equal((await run(base({ say: line }), { verdict: "correct" })).say, line);
  assert.equal(withoutPraise("Yes, tum got it. Eighteen is ten and eight extra."), "Eighteen is ten and eight extra.");
  assert.equal(withoutPraise("Socho, sahi jawab kya hoga?"), "Socho, sahi jawab kya hoga?", "a question about the right answer is not praise");
});

test("a right answer with a wrong reason is partly in the learner record, never evidence for understood", async () => {
  const next = ST();
  const card = K.items.find((i) => i.id === "i3");
  const o = await run(base({ read: { skill: card.skillId, level: "understood", evidence: "1/2" } }));
  applyAgentTurn(next, o, { kit: K, childText: "1/2 kyunki 2 chhota hai", cls: { ...cls("correct"), reasonMisconceptionId: "c4-maths-ch05-t01-m1" }, card, lessonId: "L1" });
  assert.deepEqual(next.agent.learner[card.skillId].grades, ["partly(c4-maths-ch05-t01-m1)"]);
  assert.equal(next.agent.learner[card.skillId].read, "partly");
});

test("after a right plain answer, that skill's deep item is offered first (the evidence that separates understood from partly)", () => {
  const st = ST({ agent: { learner: { "c4-maths-ch05-t01-s2": { graded: [{ item: "i7", kind: "practice", g: "correct" }] } }, skill: "c4-maths-ch05-t01-s1" } });
  const first = offeredItems(st, K)[0];
  assert.equal(first.skillId, "c4-maths-ch05-t01-s2");
  assert.ok(["contrast", "near_transfer", "error_spot"].includes(first.kind), first.kind);
});

test("a page asked for this turn that is not up (refused or still drawing) is never pointed at or promised; a game is a real piece or an honest not-yet", async () => {
  const tools = fakeTools();
  const r = await run(base({ say: "Main dono andaaze dikhati hoon. Dekho, ek gola neeche hai. Kaunsa bada hai?", board: { ...KEEP, action: "show", kind: "draw", subject: "two estimates" } }), { tools });
  assert.equal(r.board, null);
  assert.equal(r.say, "Kaunsa bada hai?");
  const g = fakeTools();
  g.game = async () => ({ ok: true, on: "game", words: "the screen shows play:catch/count for the child to use", texts: [], slot: { slotId: "g:slot", intentId: "g", state: "revealed" }, game: { family: "catch" } });
  const ok = await run(base({ say: "Chalo, ek game khelte hain!", play: true }), { tools: g });
  assert.equal(ok.slot.intentId, "g"); assert.equal(ok.screen.on, "game"); assert.equal(ok.say, "Chalo, ek game khelte hain!");
  const none = fakeTools(); none.game = async () => ({ ok: false, refused: { why: "no game exists for this yet" } });
  const no = await run(base({ say: "Dekho, game screen par aa gaya. Ab ek paheli suno: 2 aur 3 kitne?", play: true }), { tools: none });
  assert.equal(no.say, "Ab ek paheli suno: 2 aur 3 kitne?");
  assert.ok(no.notes.some((n) => /game refused/.test(n)));
});

test("she never voices the harness: the card's check, the grade, the key (sim lab 3cf7cdc p08 #1)", async () => {
  const line = "Aapne chaar equal sides ke liye 6 times 4 bola. Card ka check isse match nahi hua. Ek baar phir batao, perimeter kitna hai?";
  assert.equal(withoutInternals(line), "Aapne chaar equal sides ke liye 6 times 4 bola. Ek baar phir batao, perimeter kitna hai?");
  assert.equal((await run(base({ say: line }))).say, "Aapne chaar equal sides ke liye 6 times 4 bola. Ek baar phir batao, perimeter kitna hai?");
  assert.equal(withoutInternals("Chalo card ka sawaal dekhte hain?"), "Chalo card ka sawaal dekhte hain?");
});

test("a skill that needs deep evidence offers only its deep items; no mastery claim the record does not hold (sim lab 35c0b7c)", async () => {
  const st = ST({ agent: { learner: { "c4-maths-ch05-t01-s2": { graded: [{ item: "i7", kind: "practice", g: "correct" }] } }, skill: "c4-maths-ch05-t01-s2" } });
  const s2 = offeredItems(st, K, 20).filter((i) => i.skillId === "c4-maths-ch05-t01-s2");
  assert.ok(s2.length && s2.every((i) => ["contrast", "near_transfer", "error_spot", "far_transfer", "predict", "translate_rep", "why"].includes(i.kind)), s2.map((i) => i.kind).join());
  const wrap = "Aaj tumne fractions compare karna sikh liya! Kal phir milte hain.";
  assert.equal(withoutMastery(wrap, { s2: { read: "partly" } }), "Kal phir milte hain.");
  assert.equal(withoutMastery(wrap, { s2: { read: "understood" } }), wrap);
  assert.equal(withoutMastery("Kya tum samajh gaye ho?", {}), "Kya tum samajh gaye ho?", "a question is not a claim");
});

test("no game for the topic: no promise of one this turn or later; the state tells her (sim lab 1a346d9 p29, p33)", async () => {
  const none = fakeTools(); none.game = async () => ({ ok: false, refused: { why: "no game exists for this yet" } });
  const r = await run(base({ say: "Ab thoda game khelte hain. Main line wala game taiyaar kar rahi hoon. A ki sides kaisi hain?", play: true }), { tools: none });
  assert.equal(r.say, "A ki sides kaisi hain?");
  const next = ST();
  applyAgentTurn(next, r, { kit: K, childText: "game khelna hai", lessonId: "L1" });
  assert.equal(next.agent.noGame, true);
  assert.match(stateMessage({ state: next, kit: K, event: "x", onScreen: "nothing", lane: "voice" }), /GAMES: no game exists/);
  const later = await run(base({ say: "Game abhi aa raha hai! Chalo bolkar ek game khelte hain: 2 aur 2?" }), { state: { agent: { noGame: true } } });
  assert.equal(later.say, "Chalo bolkar ek game khelte hain: 2 aur 2?");
  assert.equal(withoutGamePromise("Game ready hai? Nahi abhi."), "Nahi abhi.");
});

test("streamed: her words reach speakStreamed clause by clause through the gate; praise on a wrong answer and pointing at an empty screen are dropped; the card question is the tail", async () => {
  const { speakStreamed } = await import("../server/latency/speech-stream.js");
  const { clauseGate } = await import("../server/agent/agent.js");
  const json = JSON.stringify(base({ say: "Bahut accha! Screen par dekho, do roti hain. Socho, ek roti ke 2 barabar tukde hon. Ab ek chhota sawaal.", pose_item: "i1", intent: "practice" }));
  const streamFn = async (dep, messages, o) => { for (let i = 0; i < json.length; i += 7) { o.onDelta(json.slice(i, i + 7)); await new Promise((r) => setImmediate(r)); } return { text: json, usage: { in: 900, out: 80 } }; };
  let speech = null;
  const onSay = (deltas, gate) => { speech = speakStreamed({ deltas, gate, synth: async function* (c) { yield Buffer.from(c); }, emit: () => {} }); };
  const out = await run(base(), { streamFn, onSay, verdict: "wrong" });
  const sp = await speech;
  assert.deepEqual(sp.spoken, ["Socho, ek roti ke 2 barabar tukde hon.", "Ab ek chhota sawaal."]);
  assert.equal(out.streamed, true);
  assert.ok(out.tail, "the card question the code appended is the tail to speak");
  assert.ok(typeof out.firstSayMs === "number");
  // the gate on its own: a floor break stops, a type ask is rewritten, the harness's words are dropped
  const g = clauseGate({ verdict: "correct", screen: { on: "nothing" }, lane: "voice" });
  assert.equal(g("Apna jawab type karke bhejo.", []).clause, "Apna jawab bolkar batao.");
  assert.equal(g("Card ka check isse match nahi hua.", []).skip, true);
  assert.equal(g("Bahut badhiya, sahi jawab!", []).ok, true);
});

test("a why question in the child's own words is offered as deep evidence; easy-only partly is marked not yet tested deeply (sim lab 71a6b11)", async () => {
  const st = ST({ agent: { learner: { "c4-maths-ch05-t01-s2": { graded: [{ item: "i7", kind: "practice", g: "correct" }] } }, skill: "c4-maths-ch05-t01-s2" } });
  assert.ok(offeredItems(st, K, 20).some((i) => i.kind === "why"), "why items are offered");
  const next = ST();
  const card = K.items.find((i) => i.id === "i7");
  const o = await run(base({ read: { skill: card.skillId, level: "understood", evidence: "right" } }));
  applyAgentTurn(next, o, { kit: K, childText: "1/4", cls: cls("correct"), card, lessonId: "L1" });
  assert.equal(next.agent.learner[card.skillId].read, "partly");
  assert.equal(next.agent.learner[card.skillId].depth, "untested");
  assert.match(stateMessage({ state: next, kit: K, event: "x", onScreen: "nothing", lane: "voice" }), /not yet tested on a why/);
  const why = K.items.find((i) => i.id === "i5");
  const o2 = await run(base({ read: { skill: why.skillId, level: "understood", evidence: "explained why" } }));
  applyAgentTurn(next, o2, { kit: K, childText: "kam tukde matlab bada tukda", cls: cls("correct"), card: why, lessonId: "L1" });
  assert.equal(next.agent.learner[why.skillId].read, "understood", "a right why plus a right plain answer");
  assert.equal(next.agent.learner[why.skillId].depth, undefined);
});

test("a game ask is looked up BEFORE she speaks: up → she is told it is on screen; none → she is told to offer a spoken game (sim lab cc4b3d2)", async () => {
  const t = fakeTools(); let looked = 0;
  t.game = async () => { looked++; return { ok: false, refused: { why: "no game exists for this yet" } }; };
  const r = await run(base({ say: "Is topic ka game abhi nahi hai. Chalo bolkar ek game: main number bolungi, tum agla bolo. 5?" }), { tools: t, event: 'the child said (speech recognition confidence 0.90): "game khelna hai"' });
  assert.equal(looked, 1);
  assert.match(stub.last.messages[1].content, /GAME: no game exists for this topic/);
  assert.equal(r.gameRefused, true);
  const up = fakeTools(); up.game = async () => ({ ok: true, on: "game", words: "the screen shows play:catch for the child to use", texts: [], slot: { slotId: "g:slot", intentId: "g", state: "revealed" }, game: { family: "catch" } });
  const r2 = await run(base({ say: "Game screen par hai, khelo!" }), { tools: up, event: 'the child said (speech recognition confidence 0.90): "mujhe game khelna hai"' });
  assert.match(stub.last.messages[1].content, /GAME: a game for this skill is now on the screen/);
  assert.equal(r2.slot.intentId, "g"); assert.equal(r2.say, "Game screen par hai, khelo!");
  // no game ask: no lookup
  const t3 = fakeTools(); let n3 = 0; t3.game = async () => { n3++; return { ok: false }; };
  await run(base(), { tools: t3, event: 'the child said (speech recognition confidence 0.90): "1/2"' });
  assert.equal(n3, 0);
});

test("no promise of a picture that is not being made; a job that started keeps it; honest not-yet stays (sim lab 7740135 effort none)", async () => {
  const { withoutPicturePromise, clauseGate } = await import("../server/agent/agent.js");
  assert.equal(withoutPicturePromise("Is fraction ki picture bana rahi hoon; tab tak sochiye, sau tukde kitne honge?"), "Sochiye, sau tukde kitne honge?");
  assert.equal(withoutPicturePromise("Haan tum, I’ll request a picture of a real circular track; it may take a moment. Constant speed is not zero acceleration."), "Constant speed is not zero acceleration.");
  assert.equal(withoutPicturePromise("Main ab liti battery ka sketch banwati hoon."), "Main ab liti battery ka sketch banwati hoon.", "nothing else left: the line stands (the Director's checks still apply)");
  assert.equal(withoutPicturePromise("Sorry, battery ka sketch abhi nahi aaya. Ek sawaal?"), "Sorry, battery ka sketch abhi nahi aaya. Ek sawaal?");
  assert.equal(withoutPicturePromise("Board par likha hai: aadha."), "Board par likha hai: aadha.");
  // the model promises without asking the tool: removed; asks the tool and the job starts: kept
  const promise = "Roti ki photo banwa rahi hoon; tab tak socho, ek tukda kya kehlata hai?";
  const none = await run(base({ say: promise }));
  assert.ok(!/photo/i.test(none.say), none.say);
  assert.match(none.say, /^Socho, ek tukda/);
  const job = await run(base({ say: promise, picture: "roti" }));
  assert.match(job.say, /photo banwa rahi hoon/);
  // streamed: she speaks before the tool runs, so no clause promises a picture
  const g = clauseGate({ verdict: "correct", screen: { on: "board" }, lane: "voice" });
  assert.deepEqual(g("Roti ki photo banwa rahi hoon,"), { ok: true, skip: true });
  assert.equal(g("ek tukda kya kehlata hai?").clause, "ek tukda kya kehlata hai?");
});

test("a new question with no page of its own clears an earlier page that shares nothing with her line and the question (stream 2's matcher); a related page stays (sim lab 7740135)", async () => {
  const up = (texts) => { const t = fakeTools(); t.up = { ok: true, on: "board", words: `written on it: ${texts.join("; ")}`, texts, numbers: [], pageId: "p0" }; return t; };
  // stream 2's syncedWithLine stands in here as a stub with its contract: (script, line) → does the page share content with the line
  const seen = [];
  const synced = (script, line) => { seen.push(line); const w = (x) => new Set(String(x).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((y) => y.length >= 4 || /^\d+$/.test(y)));
    const lw = w(line); return [...w(script.ops.map((o) => o.text).join(" "))].some((y) => lw.has(y)); };
  const stale = up(["Ghaas → Hiran → Sher"]);
  const a = await run(base({ intent: "practice", say: "Ab ek naya sawaal.", pose_item: "i3" }), { tools: stale, synced, state: { activeItemId: "i1" } });
  assert.deepEqual(stale.calls.map((c) => c[0]), ["clear"]);
  assert.equal(a.cleared, true);
  assert.match(seen[0], /naya sawaal.*1\/2/, "her line and the question are the line it is matched against");
  const related = up(["1/2 aur 1/3", "kaun bada?"]);
  await run(base({ intent: "practice", say: "Ab ek naya sawaal.", pose_item: "i3" }), { tools: related, synced, state: { activeItemId: "i1" } });
  assert.deepEqual(related.calls, [], "a page with the question's numbers stays");
  const same = up(["Ghaas → Hiran → Sher"]);
  await run(base({ intent: "practice", say: "Phir se socho.", pose_item: "i1" }), { tools: same, synced, state: { activeItemId: "i1" } });
  assert.deepEqual(same.calls, [], "the same question keeps its page");
  const noMatcher = up(["Ghaas → Hiran → Sher"]);
  await run(base({ intent: "practice", say: "Ab ek naya sawaal.", pose_item: "i3" }), { tools: noMatcher, synced: null, state: { activeItemId: "i1" } });
  assert.deepEqual(noMatcher.calls, [], "no matcher in the tree: nothing is cleared");
  // a page the child asked to SEE is theirs (stream 2: the request exemption lives in seam.js, not in the matcher)
  const asked = up(["Ghaas → Hiran → Sher"]);
  await run(base({ intent: "practice", say: "Ab ek naya sawaal.", pose_item: "i3" }), { tools: asked, synced, state: { activeItemId: "i1", agent: { askedPageId: "p0" } } });
  assert.deepEqual(asked.calls, [], "the child's own page stays");
  const askingNow = up(["Ghaas → Hiran → Sher"]);
  await run(base({ intent: "practice", say: "Ab ek naya sawaal.", pose_item: "i3" }), { tools: askingNow, synced, event: 'the child said (speech recognition confidence 0.9): "board pe likh ke dikhao"', state: { activeItemId: "i1" } });
  assert.deepEqual(askingNow.calls, [], "a child asking to see this turn: nothing is cleared");
  // and the page that goes up on a see-ask is remembered as theirs
  const next = ST({ activeItemId: "i1" });
  applyAgentTurn(next, { say: "Yeh lo.", intent: "explain", item: null, board: { ok: true, on: "board", texts: ["x"], pageId: "p9" }, screen: { on: "board", texts: ["x"] }, usage: { usd: 0, tokens: 0 }, notes: [], read: null }, { kit: K, childText: "board pe likh ke dikhao", lessonId: "L1" });
  assert.equal(next.agent.askedPageId, "p9");
});

test("speculation (stream 3): her call starts on the prefetched turn with no tool run and nothing drained; the turn adopts it only on the same inputs, else aborts it and calls again", async () => {
  const { speakStreamed } = await import("../server/latency/speech-stream.js");
  const { agentSpeculate, agentCallOf } = await import("../server/agent/agent.js");
  const EV = 'the child said (speech recognition confidence 0.92): "aadha"';
  // the key: same inputs → same key; a different event → a different key
  assert.equal(agentCallOf({ state: ST(), kit: K, event: EV }).key, agentCallOf({ state: ST(), kit: K, event: EV }).key);
  assert.notEqual(agentCallOf({ state: ST(), kit: K, event: EV }).key, agentCallOf({ state: ST(), kit: K, event: EV.replace("0.92", "0.81") }).key);
  const json = JSON.stringify(base({ say: "Haan, aadha. Ab ek chhota sawaal.", pose_item: "i1", intent: "practice", board: SHOW(["1/2"]) }));
  let calls = 0;
  const streamFn = async (dep, messages, o) => { calls++; for (let i = 0; i < json.length; i += 9) { if (o.signal?.aborted) throw Object.assign(new Error("cancelled"), { code: "cancelled" }); o.onDelta(json.slice(i, i + 9)); await new Promise((r) => setImmediate(r)); } return { text: json, usage: { in: 900, out: 80 } }; };
  const tools = fakeTools();
  tools.peek = () => []; let drained = 0; tools.news = () => { drained++; return []; };
  const spec = agentSpeculate({ state: ST(), kit: K, event: EV, lessonId: "L1", tools, streamFn });
  assert.ok(spec && spec.key);
  await spec.done;
  assert.deepEqual(tools.calls, [], "no tool ran while speculating");
  assert.equal(drained, 0, "the content news is peeked, not drained");
  // adopted: no second call; her words replay into the speech path; the actions run now
  let speech = null;
  const onSay = (deltas, gate) => { speech = speakStreamed({ deltas, gate, synth: async function* (c) { yield Buffer.from(c); }, emit: () => {} }); };
  const out = await agentTurn({ state: ST(), kit: K, event: EV, lessonId: "L1", verdict: "correct", tools, streamFn, onSay, spec });
  assert.equal(calls, 1, "the turn did not call the model again");
  assert.equal(out.speculation, "adopted");
  assert.deepEqual((await speech).spoken, ["Haan, aadha.", "Ab ek chhota sawaal."]);
  assert.deepEqual(tools.calls.map((c) => c[0]), ["show"], "the board went up at adoption, not before");
  // different inputs: aborted, and the turn makes its own call
  const spec2 = agentSpeculate({ state: ST(), kit: K, event: EV, lessonId: "L1", tools: fakeTools(), streamFn });
  const out2 = await agentTurn({ state: ST(), kit: K, event: EV.replace("aadha", "ek tihai"), lessonId: "L1", verdict: "wrong", tools: fakeTools(), streamFn, chatFn: stub(JSON.parse(json)), spec: spec2 });
  assert.ok(spec2.aborted);
  assert.equal(out2.speculation, "dropped");
  assert.equal(stub.last.messages[1].content.includes("ek tihai"), true, "the turn made its own call on its own inputs");
  // the waste is recorded apart from the lesson budget: a finished call brings its tokens, a cut one counts as cut
  const { specWasteOf } = await import("../server/agent/agent.js");
  assert.deepEqual(specWasteOf(null, { usage: { in: 900, out: 80 }, dep: "taxila-gpt6" }).tokens, 980);
  assert.deepEqual(specWasteOf({ dropped: 1, cut: 0, tokens: 980, usd: 0.002 }, { usage: null }), { dropped: 2, cut: 1, tokens: 980, usd: 0.002 });
  const nx = ST(); applyAgentTurn(nx, { ...out2 }, { kit: K, childText: "ek tihai", lessonId: "L1" });
  assert.equal(nx.agent.specWaste.dropped, 1);
  assert.equal(nx.agent.usage.tokens, out2.usage.tokens, "the lesson budget counts only the call the turn used");
  // a game ask is never speculated (its lookup is an action); silence neither
  assert.equal(agentSpeculate({ state: ST(), kit: K, event: 'the child said (speech recognition confidence 0.9): "game khelna hai"', lessonId: "L1", tools: { ...fakeTools(), game: async () => ({ ok: false }) }, streamFn }), null);
  assert.equal(agentSpeculate({ state: ST(), kit: K, event: EV, silent: true, lessonId: "L1", tools: fakeTools(), streamFn }), null);
});
