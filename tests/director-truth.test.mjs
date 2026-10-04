// Director truth (BUILD-PLAN W1-A; audit flows G3-G6, comprehension G11, personalisation 13): the audit's exact
// production transcripts, replayed through the real Director, classifier fast path and reply guard. No network and no
// database: the reply model is replaced (routes/lesson.js replyDeps), the classifier's model verdicts are given.
//   "13 ka square"   the card asked 13 ka square, she asked "10 ka square kitna hoga?"; typed 100 → "didn't catch that"
//   "Choices dikhao" the Young help button was sent as the child's answer, and other choices were read out
//   the repair loop 12 repair/hint turns on one diagnostic item with non-answers
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, hintFor, hintShapeWords, LIMITS } from "../server/director/state.js";
import { findItem, promptFor, choicesFor, DIAG_CHILD_HINTS, stripRungLabel } from "../server/director/items.js";
import { classifyFast, targetFor, helpOf, HELP_REQUESTS } from "../server/director/classify.js";
import { askParity, endOnAsk, wrapsUp, stripWrap, lastQuestionOnly } from "../server/director/say.js";
import { evidenceFrom } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { __test as L, replyDeps, startRefusal, refusalControl } from "../server/routes/lesson.js";
import { homeStateOf } from "../server/routes/child.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const SQ = kitFromFile(getTopic("c8-maths-ch01-t01"));   // class 8 squares (the audit's Kabir lesson)
const SK = kitFromFile(getTopic("c2-maths-ch01-t01"));   // class 2 skip counting (the audit's Aarav lesson)
const K = kit();                                         // the fixture fractions kit (diagnostics)
const NE = cls("no_evidence");

/** A lesson on `k` walked to its first practice item; `first` puts that item at the head of the queue. */
function toItem(k, ctx = {}, first) {
  const s0 = initLessonState({ topicId: k.topicId, kit: k, ctx: { ...CTX, ...ctx }, seed: 7, now: 0 });
  if (first) s0.queue = [first, ...s0.queue.filter((x) => x !== first)];
  let r = step(s0, { event: "start", kit: k, now: 0 });
  for (let i = 0; i < 20 && !(r.state.phase === "practice" && r.move.itemId); i++) r = turn(r, k, NE);
  return r;
}
const turn = (r, k, c, extra = {}) => step(r.state, { event: "turn", kit: k, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const withReply = async (texts, fn) => {
  let i = 0;
  const was = replyDeps.chat;
  replyDeps.chat = async () => ({ text: texts[Math.min(i++, texts.length - 1)] });
  try { return await fn(); } finally { replyDeps.chat = was; }
};

// ───────────── "13 ka square" (flows G4) ─────────────

test("13 ka square: the card's question is the one she asks — a reply that asks '10 ka square' is repaired to end on the card", async () => {
  const r = toItem(SQ, { lang: "hinglish", classLevel: 8, ageBand: "10-15", address: "aap" }, "c8-maths-ch01-t01-i01");
  const item = findItem(r.state, SQ, r.move.itemId);
  assert.equal(item.id, "c8-maths-ch01-t01-i01");
  assert.match(r.ui.ask.text, /13 ka square/);
  // the audit's turn: a hint that drifted to another number, as two questions
  const hinted = turn(r, SQ, cls("incorrect"), { typed: true });
  assert.equal(hinted.move.kind, "hint");
  const out = await withReply(["Chaliye, pehle 10 ka square sochiye. 10 ka square kitna hoga?", "Achha, 14 times 14 karke result bataiye. 9² kitna hota hai?"],
    () => L.textReply({ instructions: "x", state: hinted.state, kit: SQ, childText: "100", verdict: "not_yet", ui: hinted.ui, module: null }));
  const p = askParity(out.reply, hinted.ui.ask.text);
  assert.ok(p.endsOnAsk, `ends on the card's question: ${out.reply}`);
  assert.equal(p.questions, 1, out.reply);
  assert.ok(out.guard.caught.includes("ask"), JSON.stringify(out.guard));
  assert.ok(!out.guard.final, JSON.stringify(out.guard));
});

test("13 ka square: a typed answer is never 'say it again' — typed 100, 1 and 'yes' get a verdict or a hint, never repair", () => {
  const r = toItem(SQ, { lang: "hinglish", classLevel: 8, ageBand: "10-15" }, "c8-maths-ch01-t01-i01");
  const target = targetFor(r.state, SQ, findItem(r.state, SQ, r.state.activeItemId));
  // "1": a wrong attempt the model labels other_wrong → a hint (a verdict on the card)
  assert.notEqual(turn(r, SQ, cls("incorrect"), { typed: true }).move.kind, "repair");
  // "100" answered the drifted question (no_attempt), "yes" answered nothing: both no_evidence, typed → a hint
  for (const text of ["100", "yes"]) {
    const fast = classifyFast({ target, childText: text, typed: true, lang: "hinglish" });
    assert.equal(fast.result, null, `${text}: the model decides (no exact key)`);
    const next = turn(r, SQ, { ...NE, source: "model" }, { typed: true });
    assert.equal(next.move.kind, "hint", `${text}: typed non-answer → hint, not repair`);
    assert.doesNotMatch(next.move.shape, /say it once more|did not catch/);
  }
  // spoken, the same non-answer still re-asks (a misheard transcript is a real possibility there)
  assert.equal(turn(r, SQ, NE).move.kind, "repair");
});

test("G-ASK parity predicates: ends-on-ask, one question, and the code repairs", () => {
  const ask = "13 ka square kitna hai?";
  assert.deepEqual(askParity("Socho. 13 ka square kitna hai?", ask).endsOnAsk, true);
  assert.equal(askParity("Socho. 10 ka square kitna hoga?", ask).endsOnAsk, false);
  assert.equal(askParity("14 times 14 bataiye? 13 ka square kitna hai?", ask).questions, 2);
  assert.equal(askParity("Ek prompt? Do sawal? — wait, 13 ka square kitna hai?", ask).questions >= 2, true);
  const fixed = endOnAsk("Achha. 10 ka square kitna hoga? Socho.", ask);
  assert.equal(fixed, "Achha. Socho. 13 ka square kitna hai?");
  assert.deepEqual(askParity(fixed, ask), { endsOnAsk: true, questions: 1, finalQuestion: "13 ka square kitna hai?" });
  assert.equal(lastQuestionOnly("Kya socha? Kaunsa bada hai?"), "Kaunsa bada hai?");
  // an ask the card cut with "…" is a prefix of the full question
  assert.ok(askParity("Hmm. Ek bahut lambi baat, phir yeh poora sawaal hai?", "Ek bahut lambi baat…").endsOnAsk);
});

// ───────────── "Choices dikhao" (flows G3) ─────────────

test("Choices dikhao: a client request (never an answer) that puts THIS item's choices on screen, key included", () => {
  const r = toItem(SK, { lang: "hinglish", classLevel: 2, ageBand: "6-9" }, "c2-maths-ch01-t01-i01");
  const item = findItem(r.state, SK, r.state.activeItemId);
  assert.equal(item.answer, "10");
  assert.equal(r.ui.answerForm, "number", "a number item: the NumberPad's form");
  const target = targetFor(r.state, SK, item);
  // the Young Help menu sends the label "Choices dikhao" with chip id help_choices
  const fast = classifyFast({ target, childText: "Choices dikhao", chipId: "help_choices", typed: true, lang: "hinglish" });
  assert.equal(fast.result.source, "help");
  assert.equal(fast.result.outcome, "no_evidence");
  assert.equal(fast.result.flags.wantsToStop, false);
  assert.deepEqual(evidenceFrom(r.state, fast.result, SK), [], "a help request is never evidence");
  const shown = turn(r, SK, fast.result, { typed: true });
  assert.equal(shown.move.itemId, item.id, "the SAME item, not another one (the audit read out the chappal item's choices)");
  assert.ok(shown.ui.chips?.length >= 2, JSON.stringify(shown.ui));
  assert.ok(shown.ui.chips.some((c) => c.label === "10"), "the tiles include the current item's key");
  assert.equal(shown.ui.answerForm, "choice");
  assert.equal(shown.ui.tray, "tiles");
  assert.ok(shown.ui.ask.text.includes("2, 4, 6, 8"), "the card keeps the current question");
  // tapping a tile is graded in code against the key
  const t2 = targetFor(shown.state, SK, item);
  const key = shown.ui.chips.find((c) => c.label === "10");
  const wrong = shown.ui.chips.find((c) => c.label !== "10");
  assert.equal(classifyFast({ target: t2, childText: "10", chipId: key.id, typed: true }).result.outcome, "correct");
  assert.equal(classifyFast({ target: t2, childText: wrong.label, chipId: wrong.id, typed: true }).result.outcome, "incorrect");
});

test("choicesFor: numbers, fractions and words; never a distractor that is an accepted form of the key", () => {
  assert.ok(choicesFor({ id: "a", answer: "10", acceptable: ["ten"] }, null, 1).includes("10"));
  const big = choicesFor({ id: "b", answer: "1,25,000", acceptable: ["125000"] }, null, 1);
  assert.equal(big.length, 3);
  assert.ok(big.includes("1,25,000"));
  const fr = choicesFor({ id: "c", answer: "1/2", acceptable: ["half"] }, null, 1);
  assert.ok(fr.includes("1/2") && fr.includes("2/1"));
  const words = choicesFor(K.items[0], K, 1);
  assert.ok(words.includes(K.items[0].answer));
  assert.ok(!words.slice().filter((w) => w !== K.items[0].answer).some((w) => ["half", "aadha", "one half"].includes(w)));
  assert.equal(choicesFor({ id: "d", answer: "" }, null, 1), null);
});

test("help requests: every Hint-sheet and Help-menu id is known; none is graded; Skip skips the ITEM, never the lesson (flows G6)", () => {
  for (const id of ["hint", "why", "know", "another", "slower", "skip", "help_choices", "help_how"]) assert.ok(helpOf(id), id);
  assert.equal(helpOf("opt:1"), null);
  assert.equal(helpOf("__proto__"), null);
  assert.equal(Object.keys(HELP_REQUESTS).length >= 8, true);
  const r = toItem(K, {}, "i1");
  const target = targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId));
  const skip = classifyFast({ target, childText: "Isse abhi chhod dete hain", chipId: "skip", typed: true }).result;
  assert.equal(skip.flags.wantsToStop, false, "the label's words are never read as a stop");
  const next = turn(r, K, skip, { typed: true });
  assert.notEqual(next.move.kind, "wrap");
  assert.notEqual(next.state.phase, "done");
  assert.ok(next.state.skipped.includes("i1"));
  assert.notEqual(next.move.itemId, "i1", "the next question is posed");
  // the child's own stop words still end the lesson (NEVER MANIPULATE)
  const stop = classifyFast({ target, childText: "mujhe abhi band karna hai", typed: true }).flags;
  if (stop.wantsToStop) assert.equal(turn(r, K, { ...NE, flags: stop }, { typed: true }).move.kind, "wrap");
  // a hint request is a rung, not evidence; the safety predicate still runs on what came with a help id
  const hint = classifyFast({ target, childText: "Hint chahiye", chipId: "hint", typed: true }).result;
  const h = turn(r, K, hint, { typed: true });
  assert.equal(h.move.kind, "hint");
  assert.equal(h.state.hintLevel, 1);
  assert.equal(classifyFast({ target, childText: "main khud ko hurt karna chahta hoon", chipId: "hint", typed: true }).result?.source === "help", false);
});

// ───────────── the repair loop (comprehension G11) ─────────────

test("repair loop: unclear replies on one item are capped at 3, then the item is left with no verdict and the lesson moves on", () => {
  // the fixture's diagnostic is second in the queue: walk to it
  let r = toItem(K);
  for (let i = 0; i < 6 && !String(r.move.itemId).startsWith("diag:"); i++) r = turn(r, K, cls("correct"));
  const diag = r.move.itemId;
  assert.ok(String(diag).startsWith("diag:"), `reached a diagnostic (${diag})`);
  let sameItemTurns = 0;
  for (let i = 0; i < 12; i++) {
    r = turn(r, K, NE);
    if (r.move.itemId !== diag) break;
    sameItemTurns += 1;
  }
  assert.ok(sameItemTurns <= LIMITS.unclearTries - 1, `at most ${LIMITS.unclearTries - 1} re-asks on the item after the first (got ${sameItemTurns})`);
  assert.ok(r.state.skipped.includes(diag), "left with no verdict");
  assert.notEqual(r.move.kind, "wrap");
  // a plain item with no chips gets the choices on its third unclear reply, then moves on
  let p = toItem(SK, { lang: "hinglish", classLevel: 2, ageBand: "6-9" }, "c2-maths-ch01-t01-i01");
  p = turn(p, SK, NE); p = turn(p, SK, NE);
  const third = turn(p, SK, NE);
  assert.ok(third.ui.chips?.some((c) => c.label === "10"), "the third unclear reply puts the choices on screen");
  const fourth = turn(third, SK, NE);
  assert.notEqual(fourth.move.itemId, "c2-maths-ch01-t01-i01", "past the cap: the next question");
});

// ───────────── hints (flows G5) ─────────────

test("hints: a diagnostic's card line is child-facing; rung labels and teacher shape words never reach ui.hint", () => {
  let r = toItem(K);
  for (let i = 0; i < 6 && !String(r.move.itemId).startsWith("diag:"); i++) r = turn(r, K, cls("correct"));
  const h = turn(r, K, cls("incorrect"));
  if (h.move.kind === "hint") {
    assert.ok(DIAG_CHILD_HINTS.includes(h.ui.hint?.text), JSON.stringify(h.ui.hint));
    assert.doesNotMatch(h.move.shape, /Picture each choice/, "the teacher still gets her rung shape, not the card line");
  }
  assert.equal(hintFor({ kind: "hint" }, { answer: "x", hints: ["pump: ask them to picture both choices as real things"] }, 1), null);
  assert.equal(hintFor({ kind: "hint" }, { answer: "x", hints: ["assertion: say which option is right"] }, 1), null);
  assert.deepEqual(hintFor({ kind: "hint" }, { answer: "x", hints: ["Prompt: the sweeper keeps our gali ___"] }, 1), { level: 1, text: "the sweeper keeps our gali ___" });
  assert.deepEqual(hintFor({ kind: "hint" }, { answer: "x", hints: ["Rule: ___. First 6: ___."] }, 1), { level: 1, text: "Rule: ___. First 6: ___." }, "a content label stays");
  assert.ok(hintShapeWords("ask them to picture it"));
  assert.ok(!hintShapeWords("We jump by 2 each time."));
  assert.equal(stripRungLabel("Assert: neighbours help"), "neighbours help");
});

// ───────────── choice items never lose their tiles to an activity (flows G2, client half's server contract) ─────────────

test("choice items: chips take the tray even with an activity mounted; tap_in_tray only with a mount", () => {
  let r = toItem(K);
  for (let i = 0; i < 6 && !String(r.move.itemId).startsWith("diag:"); i++) r = turn(r, K, cls("correct"));
  assert.ok(r.ui.chips?.length);
  assert.equal(r.ui.tray, "tiles");
  assert.equal(r.ui.answerForm, "choice");
  // with a module the Director holds, the diagnostic still sends tiles
  const s = structuredClone(r.state);
  s.module = { id: "m1", itemId: s.activeItemId, awaitingReveal: true };
  const again = step(s, { event: "turn", kit: K, cls: NE, now: 999_000 });
  if (again.ui.chips?.length) assert.equal(again.ui.tray, "tiles");
  assert.notEqual(again.ui.answerForm, "tap_in_tray");
});

// ───────────── wrap language only on wrap (personalisation 13) ─────────────

test("wrap language: 'Aaj ke liye bas itna' on a probe turn is removed in code; a wrap move keeps its goodbye", async () => {
  assert.ok(wrapsUp("Aaj ke liye bas itna."));
  assert.ok(wrapsUp("That's all for today!"));
  assert.ok(wrapsUp("Phir milte hain!"));
  assert.ok(!wrapsUp("Aaj hum squares seekhenge."));
  assert.equal(stripWrap("Bahut accha socha. Aaj ke liye bas itna. Ab yeh batao?"), "Bahut accha socha. Ab yeh batao?");
  const r = toItem(K, {}, "i1");
  const out = await withReply([`Aaj ke liye bas itna. ${promptFor(findItem(r.state, K, "i1"), "hinglish")}`],
    () => L.textReply({ instructions: "x", state: r.state, kit: K, childText: "", verdict: "ungraded", ui: r.ui, module: null }));
  assert.ok(!wrapsUp(out.reply), out.reply);
  assert.ok(out.guard.caught.includes("wrap"));
});

// ───────────── the start refusal names its control; "Open now" opens the hours only (flows G1, smooth G8) ─────────────

test("start refusal: practice and Ask pass a done day; the 409 names the control; open-now opens the hours, never the cap", () => {
  assert.equal(startRefusal("done", "practice"), null);
  assert.equal(startRefusal("done", "doubt"), null);
  assert.ok(startRefusal("done", "lesson"));
  assert.ok(startRefusal("done", undefined), "no purpose is a lesson");
  assert.ok(startRefusal("resting", "practice"));
  assert.equal(refusalControl("resting"), "hours");
  assert.equal(refusalControl("capped"), "daily_limit");
  assert.equal(refusalControl("done"), "done");
  const base = { resumable: false, usedMin: 0, capMin: 30, doneToday: false, now: "23:10", from: "07:00", to: "20:30", anyLesson: true };
  assert.equal(homeStateOf(base), "resting");
  assert.equal(homeStateOf({ ...base, openNow: true }), "start");
  assert.equal(homeStateOf({ ...base, openNow: true, usedMin: 30 }), "capped", "the daily limit still holds");
  assert.equal(homeStateOf({ ...base, openNow: true, doneToday: true }), "done", "never one more");
});

test("help on a pending 'why?' ends the probe with no evidence and moves on (no re-teach loop)", () => {
  let r = toItem(SK, { lang: "hinglish", classLevel: 2, ageBand: "6-9" }, "c2-maths-ch01-t01-i01");
  r = turn(r, SK, cls("correct"), { typed: true });
  if (r.state.pendingWhy !== "c2-maths-ch01-t01-i01") return; // no why sampled on this seed: nothing to check
  const help = { outcome: "no_evidence", confidence: 1, source: "help", help: "how", flags: {} };
  const next = turn(r, SK, help, { typed: true });
  assert.equal(next.state.pendingWhy, undefined);
  assert.notEqual(next.move.kind, "reteach");
  assert.notEqual(next.move.itemId, "c2-maths-ch01-t01-i01", "the next question");
});

// ───────────── the client's pure answer helpers (src/child/lesson/answers.ts) ─────────────

test("client: start purpose per variant, the 409 refusal body, help chip states, dots, the fraction pad", async () => {
  const A = await import("../src/child/lesson/answers.ts");
  assert.equal(A.purposeOf("practice"), "practice");
  assert.equal(A.purposeOf("doubt"), "doubt");
  assert.equal(A.purposeOf("lesson"), "lesson");
  assert.deepEqual(A.refusalOf({ error: "outside today's lesson hours", state: "resting", opensAt: "07:00", capRemaining: 30, control: "hours", window: { from: "07:00", to: "20:30" } }),
    { state: "resting", opensAt: "07:00", capRemaining: 30, control: "hours", window: { from: "07:00", to: "20:30" } });
  assert.equal(A.refusalOf({ error: "today's lesson is done", state: "done" }).state, "done");
  assert.equal(A.refusalOf({ error: "core_tutoring consent is required" }), null, "not every 409 is a plan refusal");
  assert.equal(A.refusalOf(null), null);
  assert.equal(A.helpAskedKey("hint"), "help.asked.hint");
  assert.equal(A.helpAskedKey("help_choices"), "help.asked.choices");
  assert.equal(A.helpAskedKey("opt:0"), null, "a choice tap is an answer");
  assert.equal(A.helpAskedKey("toString"), null);
  // every help chip the client sends is one the server knows (classify.js HELP_REQUESTS), and the reverse
  for (const id of Object.keys(A.HELP_CHIP_IDS)) assert.ok(helpOf(id), id);
  assert.equal(A.dotsFor("7"), 7);
  assert.equal(A.dotsFor("12"), null);
  assert.equal(A.dotsFor("1/2"), null);
  assert.ok(A.fractionQuestion("Which is bigger, 1/2 or 1/3?"));
  assert.ok(A.fractionQuestion("Compare them", "Fractions: halves"));
  assert.ok(!A.fractionQuestion("13 ka square kitna hai?", "Squares and square roots"));
});

// ───────────── G-PRAISE-2: a right answer is never corrected (W1-A local battery, 2026-10-04) ─────────────

test("G-PRAISE-2: after a right diagnostic tap (9), 'isliye 10' is caught and removed; the next question stays", async () => {
  const { wrongAnswersOf, correctsRight, stripCorrection } = await import("../server/director/say.js");
  const target = { mode: "item", key: "9", also: [], options: [{ text: "9" }, { text: "10" }, { text: "1" }] };
  const wrong = wrongAnswersOf(target);
  assert.deepEqual(wrong.sort(), ["1", "10"]);
  const next = "5, 10, 15, ___, 25. Beech mein kaunsa number gayab hai?";
  const said = "Aarav, yahan 8 ke baad 2 jodna tha, isliye 10. Ab 5-5 karke gino: 5, 10, 15, ___, 25. Beech mein kaunsa number gayab hai?";
  assert.equal(correctsRight(said, { key: "9", wrong, nextPrompt: next }), true, "the audit's line is a correction");
  // the next question's own 10 and a contrast that says the key are not corrections
  assert.equal(correctsRight("Bilkul, 9. Ab 5-5 karke gino: 5, 10, 15, ___, 25. Beech mein kaunsa number gayab hai?", { key: "9", wrong, nextPrompt: next }), false);
  assert.equal(correctsRight("Haan, 9 hi, 10 nahi: ek hi chappal bachi thi.", { key: "9", wrong, nextPrompt: next }), false);
  assert.equal(correctsRight("Theek hai, 19 tak gino.", { key: "9", wrong, nextPrompt: next }), false, "19 is not 1 or 9's neighbour token");
  assert.equal(stripCorrection(said, { key: "9", wrong, nextPrompt: next }), "Ab 5-5 karke gino: 5, 10, 15, ___, 25. Beech mein kaunsa number gayab hai?");
  // through the reply guard: a draft and a rewrite that both correct the child end with the correction removed
  const r = toItem(SK, { lang: "hinglish", classLevel: 2, ageBand: "6-9" });
  const state = { ...r.state, lastRight: { key: "9", wrong } };
  const item = findItem(state, SK, r.move.itemId);
  const bad = `Aarav, yahan 8 ke baad 2 jodna tha, isliye 10. ${promptFor(item, "hinglish")}`;
  const out = await withReply([bad, bad], () => L.textReply({ instructions: "x", state, kit: SK, childText: "9", verdict: "correct", ui: r.ui, module: null }));
  assert.ok(out.guard.caught.includes("corrects"), JSON.stringify(out.guard));
  assert.doesNotMatch(out.reply, /isliye 10/, out.reply);
  assert.ok(!out.guard.final?.includes("corrects"), JSON.stringify(out.guard));
});
