// round 5 (stream 4A; docs/design/round5/AGENT.md): the Teacher agent lane's harness invariants, with a stubbed model.
// The model decides the teaching; the harness decides what may happen: a posed item is an offered (verified) one, silence
// brings no new content, the board is drawn by code and reported, a spoken line never asks to type, budgets throw. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { agentTurn, applyAgentTurn, eventOf, gradeOf, AgentBudgetError } from "../server/agent/agent.js";
import { laneFor, teacherMode } from "../server/agent/flags.js";
import { boardScript } from "../server/agent/board.js";
import { systemPrompt, stateMessage, offeredItems, TURN_SCHEMA } from "../server/agent/prompt.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";
import { floorText } from "../server/compiler/floor.js";

const K = kit();
const base = (over = {}) => ({ intent: "explain", say: "Chalo, aaj hum fractions dekhte hain.", pose_item: null, board: { action: "keep", lines: [] },
  picture: null, read: { skill: null, level: "unknown", evidence: "" }, plan: "1. equal parts 2. compare", end: false, ...over });
const stub = (json) => async (dep, messages, opts) => { stub.last = { dep, messages, opts }; return { json, usage: { prompt_tokens: 900, completion_tokens: 80 } }; };
const ST = (over = {}) => ({ turn: 3, phase: "teach", ctx: { ...CTX, classLevel: 4 }, itemsDone: [], skipped: [], ...over });
const run = (json, over = {}) => agentTurn({ state: ST(over.state), kit: K, event: "x", lessonId: "L1", chatFn: stub(json), ...over, state: ST(over.state) });

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
  assert.ok(!ids.includes("bad")); assert.ok(!ids.includes("i5")); assert.ok(!ids.includes("i8"));
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
  const out = await run(base({ intent: "practice", pose_item: "i2", board: { action: "show", lines: ["1/2", "1/4"] }, picture: "roti", end: true }), { silent: true });
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
  const shown = await run(base({ say: "Board par dekho: 1/2 aur 1/4. Kaunsa bada hai?", board: { action: "show", lines: ["1/2", "1/4"] } }));
  assert.deepEqual(shown.board.shown, ["1/2", "1/4"]);
  assert.match(shown.say, /Board par dekho/);
});

test("budgets throw (the Director then takes the turn); a bad output throws", async () => {
  await assert.rejects(run(base(), { state: { agent: { usage: { usd: 9, tokens: 0 } } } }), AgentBudgetError);
  await assert.rejects(run({ ...base(), say: "" }), /no line/);
  const out = await run(base());
  assert.ok(out.usage.tokens > 0);
});

test("the board: code-drawn, ≤ 24-char lines, a sentence refused, the cap holds", () => {
  const b = boardScript(["1/2 > 1/3", "roti ke 2 barabar tukde", "a", "b", "c", "d", "e"], { lessonId: "L1", seq: 1, max: 6 });
  assert.equal(b.ok, true);
  assert.ok(b.shown.every((l) => [...l].length <= 24));
  assert.ok(b.shown.length <= 6 && b.refused.length >= 1);
  assert.equal(boardScript([], {}).ok, false);
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
