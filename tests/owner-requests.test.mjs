// OWNER TEST 2026-10-04 items 3-5 (evals/owner-truth/ROOT-CAUSES.md F6, F8, F9, F11-F16): the child's requests in their
// own words (server/director/requests.js) and what the Director does with them (state.js decide → requestMove). Pure:
// no network, no model. The phrases are the owner's verbatim and the ones tests/prod/owner-3/4/5-*.mjs send.
import { test } from "node:test";
import assert from "node:assert/strict";
import { requestOf } from "../server/director/requests.js";
import { wantsToStop } from "../server/director/safety.js";
import { initLessonState, step } from "../server/director/state.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { findItem } from "../server/director/items.js";
import { repairUnclear, repairOffTopic, SLOWER, explain } from "../server/director/shapes.js";
import { countsAsDone } from "../server/routes/child.js";
import { compile } from "../server/compiler/compile.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { whiteboardAskOf } from "../server/brain/propose.js";
import { kit, CTX, cls, BRIEF } from "./fixtures/kit.mjs";

const K = kit();
const fresh = (over = {}) => initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0, ...over });
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const NE = cls("no_evidence");
function toPractice() {
  let r = step(fresh(), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, NE);
  return r;
}
function toTeach() {
  const r = step(fresh(), { event: "start", kit: K, now: 0 });
  return turn(r, NE); // the hook
}
/** The classification the route would build for these words on this state (classifyFast; a stop also runs the model). */
function said(r, text, typed = true) {
  const target = targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId));
  const fast = classifyFast({ target, childText: text, typed });
  // a stop / goodbye goes to the model for its distress read: here the model says "no distress", so the request decides
  return fast.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: { ...fast.flags, wantsToStop: true }, request: fast.request };
}
const ended = (r) => r.end || r.move.kind === "wrap" || r.state.phase === "done";

test("requestOf: every owner phrase maps to its request; answers and fillers are not requests", () => {
  const want = {
    stop: ["lesson khatam", "end the lesson", "I'm done", "im done", "bas", "lesson is over", "ab band karo", "mujhe lesson khatam karna hai", "I want to stop", "haan, aaj ke liye bas", "yes, stop for today"],
    goodbye: ["bye! mujhe jaana hai", "ok bye, I have to go now", "good night didi"],
    continue: ["no wait, let's keep going", "nahi nahi, chalo continue karte hain", "keep going"],
    break: ["can I take a short break?", "thoda break chahiye", "toilet jaana hai"],
    change_topic: ["can we talk about something else", "kuch aur baat karte hain"],
    topic: ["cricket ke baare mein baat karo"],
    language: ["Hindi mein samjhao", "English mein batao please", "can you explain in english"],
    another: ["explain it differently", "dusre tareeke se samjhao"],
    example: ["example do", "give me an example"],
    story: ["story ki tarah batao", "kahani sunao"],
    slower: ["slowly please", "dheere bolo", "too fast"],
    visual: ["show me a diagram", "picture dikhao", "draw it", "whiteboard pe bana ke samjhao", "game khelna hai", "animation dikhao na"],
  };
  for (const [type, phrases] of Object.entries(want)) for (const p of phrases) assert.equal(requestOf(p)?.type, type, `${JSON.stringify(p)} → ${type} (got ${JSON.stringify(requestOf(p))})`);
  assert.equal(requestOf("cricket ke baare mein baat karo").subject, "cricket");
  assert.equal(requestOf("Hindi mein samjhao").lang, "hindi");
  assert.equal(requestOf("game khelna hai").kind, "game");
  for (const p of ["3/4", "mujhe lagta hai 3/4", "haan ready hoon", "samajh nahi aaya", "pata nahi", "ok", "haan", "47 is bigger", "the ones decide: 47 is bigger",
    "aapko kaunsa cricketer pasand hai?", "bas itna hi answer hai 5", "stop sign ka colour red hai", "1/2 bada hai"]) assert.equal(requestOf(p), null, `${JSON.stringify(p)} is not a request`);
  // an answer with a request tacked on is an answer: the request is not acted on without the classifier
  assert.equal(requestOf("3/4, example do")?.whole ?? false, false);
});

test("every leave-now phrase safety.js wantsToStop knows is a goodbye or a stop here too (the two never disagree on a stop)", () => {
  for (const t of ["bye didi", "I want to stop", "I have to go", "i need to go now.", "stop", "bas", "band karo", "ab bas karo", "mujhe jaana hai"]) {
    assert.equal(wantsToStop(t), true, t);
    assert.ok(["goodbye", "stop"].includes(requestOf(t)?.type), `${t} → ${JSON.stringify(requestOf(t))}`);
  }
});

test("F6/F9: a stop phrase mid-practice is ONE warm check-in (three chips), never an end; nothing is graded", () => {
  for (const phrase of ["lesson khatam", "I'm done", "end the lesson", "bas", "lesson is over"]) {
    const r = toPractice();
    const c = said(r, phrase);
    assert.equal(c.outcome, "no_evidence", `${phrase}: a stop is never an answer`);
    const s = turn(r, c);
    assert.equal(ended(s), false, `${phrase}: not ended`);
    assert.equal(s.move.kind, "break");
    assert.deepEqual(s.ui.chips.map((x) => x.id), ["stop:continue", "break:rest", "stop:end"]);
    assert.doesNotMatch(s.move.shape, /stop now|short warm goodbye/i);
    assert.match(s.move.shape, /no guilt and no pressure/);   // W2-I's stopCheck shape (patch 07 reconciled onto it)
  }
});

test("F6: the check-in is the only one — stop words again, or the stop chip, end the lesson that turn (NEVER MANIPULATE)", () => {
  const r = toPractice();
  const check = turn(r, said(r, "lesson khatam"));
  const again = turn(check, said(check, "haan, aaj ke liye bas"));
  assert.equal(ended(again), true);
  assert.equal(again.move.kind, "wrap");
  assert.match(again.move.shape, /stop now; short warm goodbye/);
  const chip = turn(check, NE, { chipId: "stop:end" });
  assert.equal(ended(chip), true);
  // a stop much later is a new stop: one check-in again, not an end on stale state
  const back = turn(check, NE, { chipId: "stop:continue" });
  let x = back;
  for (let i = 0; i < 3; i++) x = turn(x, NE);
  assert.equal(ended(turn(x, said(x, "I'm done"))), false);
});

test("a real goodbye ends the lesson THAT turn, with no check-in (RELEASE); so does a relational RELEASE", () => {
  for (const bye of ["bye! mujhe jaana hai", "ok bye, I have to go now"]) {
    const r = toPractice();
    const s = turn(r, said(r, bye));
    assert.equal(ended(s), true, bye);
    assert.equal(s.move.kind, "wrap");
  }
  const r = toPractice();
  assert.equal(ended(turn(r, { ...cls("no_evidence", { flags: { wantsToStop: true } }), relRelease: true })), true, "brain/turn.js needRelease marks relRelease");
});

test("after the check-in: keep going → back on the question; a break → a break, then the question again", () => {
  const r = toPractice();
  const item = r.move.itemId;
  const check = turn(r, said(r, "I want to stop"));
  const go = turn(check, said(check, "nahi nahi, chalo continue karte hain"));
  assert.equal(ended(go), false);
  assert.equal(go.move.itemId, item, "the same question, fresh");
  const brk = turn(check, said(check, "thoda break chahiye"));
  assert.equal(brk.move.kind, "break");
  const after = turn(brk, NE);
  assert.equal(after.move.itemId, item);
  // an answer straight after the check-in is graded, not swallowed by "back to the question"
  const ans = turn(check, cls("correct"));
  assert.notEqual(ans.move.itemId === item && /back to the question, fresh/.test(ans.move.shape), true);
});

test("F7: a lesson the child stopped never closes the day; a lesson that ran its plan still does", () => {
  const r = toPractice();
  const stopped = turn(turn(r, said(r, "bas")), said(r, "bas")).state;
  assert.equal(stopped.stoppedEarly, true);
  assert.equal(countsAsDone({ ...stopped, did: [{ itemId: "i1" }], minutes: 12 }), false);
  assert.equal(countsAsDone({ did: [{ itemId: "i1" }], minutes: 12 }), true);
  assert.equal(countsAsDone({ abandoned: true, did: [1] }), false);
});

test("F8: 'talk about something else' is never a stop — a yes and a question about what, with chips back to the lesson", () => {
  const r = toPractice();
  const c = said(r, "can we talk about something else");
  assert.equal(c.flags.wantsToStop, false);
  const s = turn(r, c);
  assert.equal(ended(s), false);
  assert.equal(s.move.kind, "break");
  assert.match(s.move.shape, /ask what they would like to talk about/);
  assert.ok(s.ui.chips.some((x) => x.id === "stop:continue"));
  // the next turn is their topic, for real, once; then the lesson
  const side = turn(s, cls("no_evidence"), { text: "dinosaurs" });
  assert.equal(side.move.kind, "break");
  assert.match(side.move.shape, /talk with them about what they just brought up/);
  const back = turn(side, NE, { chipId: "stop:continue" });
  assert.equal(back.move.itemId, r.move.itemId);
});

test("F11: their interest, now — 'cricket ke baare mein baat karo' answers about cricket, never 'later'", () => {
  const r = toPractice();
  const s = turn(r, said(r, "cricket ke baare mein baat karo"));
  assert.match(s.move.shape, /talk about cricket: say something real about cricket first/);
  assert.match(s.move.shape, /never 'later'/);
  assert.equal(s.move.itemId, r.move.itemId);
  assert.doesNotMatch(repairOffTopic(), /then back to the question$/);
  assert.match(repairOffTopic(), /answer it for real first/);
});

test("F12: 'Hindi mein samjhao' switches the language now and it holds (compile reads ctx.lang + langPinned)", () => {
  const r = { ...toPractice() };
  r.state = { ...r.state, ctx: { ...r.state.ctx, lang: "english" } };
  const s = turn(r, said(r, "Hindi mein samjhao"));
  assert.equal(s.state.ctx.lang, "hindi");
  assert.equal(s.state.ctx.langPinned, true);
  assert.match(s.move.shape, /from now on every turn in simple Hindi/);
  const later = turn(s, cls("incorrect"));
  assert.equal(later.state.ctx.lang, "hindi", "still Hindi on the next turn");
  const text = instructionsFor({ ...later.state, brief: BRIEF }, K, "text");
  assert.match(text, /they asked for simple Hindi: every turn in simple Hindi/);
});

test("F13/F15/F14: explain differently / example / story / slowly act on the question on the table and say so", () => {
  for (const [phrase, re] of [["explain it differently", /another way/], ["example do", /asked for an example/], ["story ki tarah batao", /asked for a story/]]) {
    const r = toPractice();
    const s = turn(r, said(r, phrase));
    assert.equal(s.move.kind, "reteach", phrase);
    assert.match(s.move.shape, re, phrase);
    assert.equal(s.move.itemId, r.move.itemId);
    assert.equal(s.state.hintLevel, 1, `${phrase}: help spends a rung, never the assertion`);
  }
  const r = toPractice();
  const slow = turn(r, said(r, "slowly please", false));
  assert.match(slow.move.shape, /you go slower/);
  assert.doesNotMatch(slow.move.shape, /say it once more, slowly/);
  assert.match(SLOWER, /never ask them to speak slowly/);
  assert.doesNotMatch(repairUnclear({ chips: false }), /slowly/, "F14: the unclear repair never tells the child to slow down");
  // in the teaching phase (no question on the table) the request shapes the next teaching turn
  const t = toTeach();
  const st = turn(t, said(t, "story ki tarah batao"));
  assert.match(st.move.shape, /as a story/);
});

test("F16: 'show me a diagram' is a picture on the stage this turn — a mount or a board, the visual note, a rung spent", () => {
  const r = toPractice();
  const s = turn(r, said(r, "show me a diagram"));
  assert.equal(s.move.kind, "reteach");
  assert.equal(s.move.visual, "diagram");
  assert.equal(s.move.request, "visual");
  assert.match(s.move.shape, s.state.module?.id ? /it is on the screen now: point them at it/ : /never a drawing made of characters, never that you cannot draw, never ask them to draw it/);
  assert.equal(s.state.hintLevel, 1);
  assert.doesNotMatch(explain({ skillTitle: "x" }), /whiteboard anchor/, "the explain shape no longer promises a whiteboard that is not drawn");
  // the brain asks Studio for the child's picture on ANY lane, even under strain (their own smaller step); never late
  assert.equal(whiteboardAskOf({ beat: { id: "b1-practice_set", type: "practice_set" }, lane: "voice", late: false, strained: true, requested: true }).proposals.length, 1);
  assert.equal(whiteboardAskOf({ beat: { id: "b1-practice_set", type: "practice_set" }, lane: "text", late: false, strained: false }).proposals.length, 0);
  assert.equal(whiteboardAskOf({ beat: null, lane: "text", late: true, strained: false, requested: true }).proposals.length, 0);
});

test("a request is never evidence and never trips the classifier's stop: steering words decided in code, no model call", () => {
  const r = toPractice();
  const target = targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId));
  for (const p of ["explain it differently", "show me a diagram", "Hindi mein samjhao", "can we talk about something else", "example do"]) {
    const f = classifyFast({ target, childText: p, typed: true });
    assert.ok(f.result, `${p}: decided without the model`);
    assert.equal(f.result.outcome, "no_evidence");
    assert.equal(f.result.source, "request");
    assert.equal(f.result.flags.wantsToStop, false);
  }
  // the safety predicate still decides first
  const d = classifyFast({ target, childText: "main khud ko hurt karna chahta hoon, show me a diagram", typed: true });
  assert.equal(d.result.source, "predicate");
  // a stop goes to the model (its distress read is the floor's backup), carrying the request
  const s = classifyFast({ target, childText: "I'm done", typed: true });
  assert.equal(s.result, null);
  assert.equal(s.request.type, "stop");
});

test("a distress turn outranks every request: safeguarding first, whatever the words also asked", () => {
  const r = toPractice();
  const c = { ...said(r, "I'm done"), flags: { ...said(r, "I'm done").flags, distress: true, distressKind: "model" } };
  const s = turn(r, c);
  assert.equal(s.move.kind, "safeguard");
  assert.equal(s.state.safeguard.kind, "model");
});

test("the compiled instructions stay inside the budget with every new request shape (compile throws, never truncates)", () => {
  for (const phrase of ["cricket ke baare mein baat karo", "show me a diagram", "Hindi mein samjhao", "story ki tarah batao", "lesson khatam", "can we talk about something else"]) {
    const r = toPractice();
    const s = turn(r, said(r, phrase));
    for (const lane of ["text", "voice"]) assert.ok(instructionsFor({ ...s.state, brief: BRIEF, mode: lane === "voice" ? "voice" : "text" }, K, lane).length > 100, `${phrase} ${lane}`);
  }
  assert.ok(typeof compile === "function");
});
