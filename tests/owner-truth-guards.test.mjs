// OWNER TEST 2026-10-04 items 1 and 2 (evals/owner-truth/ROOT-CAUSES.md F1-F5, F10, F17, F18, F20): grading truth and
// the reply guards that gutted or contradicted her words. Pure: no network, no model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { moduleAnswerOf, recheckValue, numericOf } from "../server/director/modules.js";
import { activitySummary } from "../server/brain/turn.js";
import { praiseProblem, verdictFor, endOnAsk, joinAsk, sharedRun, wrapsUp, stripPraise } from "../server/director/say.js";
import { repairDrift, coherentRemainder, statementKey, fallbackReply, FALLBACK, scriptOk } from "../server/brain/say.js";
import { multiPartKey, targetFor } from "../server/director/classify.js";
import { floorViolations } from "../server/director/safety.js";
import { resolveParams } from "../src/modules/frame/params.ts";
import * as NL from "../src/modules/frame/engines/numberLine.logic.ts";
import { kit } from "./fixtures/kit.mjs";

const K = kit();
// number-line@1's mode / value params as its def declares them (src/modules/frame/engines/numberLine.tsx is JSX, which a
// node test cannot import; tests/engines-browser.test.mjs mounts the real def)
const numberLineDef = { params: {
  mode: { type: "string", enum: ["place", "read", "jump", "show", "predict"], default: "place" },
  fractions: { type: "array" }, numbers: { type: "array" }, target: { type: "string" }, start: { type: "string" },
} };

test("F1: a bound engine's numeric commit is re-checked against the verified key; a forged claim is never graded", () => {
  const state = { activeItemId: "i1", module: { id: "m3", itemId: "i1", key: "72" } };
  const ev = (data) => [{ moduleId: "m3", type: "answer", data }];
  assert.deepEqual(moduleAnswerOf(state, ev({ value: "82", correct: true })), { correct: false, value: "82", source: "engine_rechecked", claimMismatch: true });
  assert.deepEqual(moduleAnswerOf(state, ev({ value: "72", correct: false })), { correct: true, value: "72", source: "engine_rechecked", claimMismatch: true });
  assert.equal(moduleAnswerOf(state, ev({ value: "72", correct: true })).correct, true);
  // a non-numeric key or commit keeps the engine's verdict (the engine's own binding computed it)
  assert.deepEqual(moduleAnswerOf({ ...state, module: { ...state.module, key: "closer to 1" } }, ev({ value: "x", correct: true })), { correct: true, value: "x", source: "engine" });
  assert.equal(recheckValue({ written: "3/4" }, "6/8"), true);
  assert.equal(recheckValue({ chosen: 1, fractions: ["1/3", "1/2"] }, "1/2"), true);
  assert.equal(recheckValue({ chosen: 0, fractions: ["1/3", "1/2"] }, "1/2"), false);
  assert.equal(recheckValue({ value: "1,000" }, "1000"), true);
  assert.equal(numericOf("abc"), null);
  assert.equal(numericOf(0.5), 0.5);
});

test("F2/F3: the reply model never sees the frame's right/wrong claim, only the committed value", () => {
  const s = activitySummary([{ type: "answer", data: { value: "2/5", correct: true } }, { type: "goal_met", name: "placed" }, { type: "tap" }], 0);
  assert.doesNotMatch(s, /\((?:right|wrong)\)/);
  assert.match(s, /answer 2\/5/);
  assert.match(s, /1 other event/);
});

test("F2/F3: the praise guard sees a tick emoji; the deny guard sees 'galti hui' / 'step toot gaya' after a right answer", () => {
  assert.equal(praiseProblem("✅ Achha, ab dekho: 3 ke paas kya hai?", "not_yet"), "praise");
  assert.equal(praiseProblem("👍 Theek, phir se socho.", "not_yet"), "praise");
  assert.equal(praiseProblem("Dekho, yahan galti hui: 4 tukde barabar nahi the.", "correct"), "contradicts");
  assert.equal(praiseProblem("Is step mein ek step toot gaya.", "correct"), "contradicts");
  assert.equal(praiseProblem("Koi galti nahi hui, tumne tens dekhe. Ab agla?", "correct"), null, "a negation is not a denial");
  assert.equal(praiseProblem("Haan, 47 bada hai kyunki ones mein 7 hai. Agla?", "correct"), null);
  assert.doesNotMatch(stripPraise("✅ Sahi! Ab agla: 5 ka double?"), /✅/);
});

test("F5: a multi-part key offers `partial`; an ungraded attempt is never told it is right", () => {
  assert.equal(multiPartKey("The ones decide: 47 is bigger"), true);
  assert.equal(multiPartKey("solid, liquid and gas"), true);
  assert.equal(multiPartKey("3/4"), false);
  assert.equal(multiPartKey("one-fourth"), false);
  const item = { id: "x", skillId: K.skills[0].id, kind: "predict", answer: "The ones decide: 47 is bigger", acceptable: [] };
  const t = targetFor({ phase: "practice", hintLevel: 0 }, K, item);
  assert.equal(t.open, true);
  const none = { mode: "none" };
  assert.equal(verdictFor({ outcome: "no_evidence" }, none, { childText: "photosynthesis means plants make food from sunlight" }), "attempt");
  assert.equal(verdictFor({ outcome: "no_evidence" }, none, { childText: "haan" }), "ungraded");
  assert.equal(verdictFor({ outcome: "no_evidence" }, none, { childText: "kya ye roz hota hai?" }), "ungraded");
  assert.equal(praiseProblem("Aapne bilkul sahi likhi baat. Ab agla?", "attempt"), "praise");
  assert.equal(praiseProblem("Bilkul, chalo shuru karte hain!", "attempt"), null, "an opener on an ungraded turn is not answer praise");
});

test("F4: an unbound number-line mount with no mode takes the generic path — a fraction line with a target, Check possible", () => {
  const { params } = resolveParams(numberLineDef, { fractions: [[1, 8]] });
  assert.equal(params.mode, undefined, "no def default 'place' on an absent mode");
  const c = NL.normalize(params);
  assert.equal(c.kind, "fraction");
  assert.ok(c.target, "a target from the fractions");
  assert.equal(`${c.max.n}/${c.max.d}`, "1/1");
  // an explicit mode is unchanged, and a non-generic engine's default still applies
  assert.equal(resolveParams(numberLineDef, { mode: "jump" }).params.mode, "jump");
  assert.equal(resolveParams({ params: { mode: { type: "string", enum: ["a", "b"], default: "a" } } }, {}).params.mode, "a");
});

test("F10: a safeguard fallback for a trigger that is not a disclosure is the neutral check-in line, both helplines kept", () => {
  const base = { ctx: { lang: "hinglish" }, lastMove: { kind: "safeguard" } };
  const neutral = fallbackReply({ ...base, safeguard: { kind: "content_filter" } }, null);
  assert.equal(neutral, FALLBACK.hinglish.safeguardCheck);
  assert.doesNotMatch(neutral, /jo bataya/);
  assert.match(neutral, /1098/); assert.match(neutral, /14416/);
  assert.deepEqual(floorViolations(neutral, { requireHelpline: true }), []);
  // a disclosure keeps W2-I's vetted disclosure opening (server/relational/openings.js; patch 05 reconciled onto it)
  const disclosure = fallbackReply({ ...base, safeguard: { kind: "abuse" } }, null);
  assert.notEqual(disclosure, FALLBACK.hinglish.safeguardCheck, "a disclosure keeps the disclosure line");
  assert.match(disclosure, /1098/); assert.match(disclosure, /14416/);
  assert.equal(fallbackReply({ ...base, safeguard: { kind: "relational_floor" } }, null), disclosure, "the relational floor keeps the disclosure line (W2-I)");
  assert.deepEqual(floorViolations(FALLBACK.english.safeguardCheck, { requireHelpline: true }), []);
});

test("F17: a leak / drift that survives the rewrite keeps her acknowledgement and ends on the question (never the bare question)", () => {
  const item = K.items.find((i) => i.id === "i2");
  const out = repairDrift("Achha, tumne cake ke tukde gine. Cake ke 4 tukde hain aur tumne 1/4 khaya. Kya tum bata sakte ho?", item, "hinglish", { noLeak: true });
  assert.match(out, /^Achha, tumne cake ke tukde gine\./);
  assert.doesNotMatch(out, /tumne 1\/4 khaya/, "the leaking sentence goes");
  assert.ok(out.endsWith("?"));
});

test("F18: a gutted remainder is not a turn; a statement-key item is not an 'answer' an explanation can leak; no Gujarati marks", () => {
  assert.equal(coherentRemainder("” Aapka question?"), false);
  assert.equal(coherentRemainder("Aapka question?"), false);
  // s09 t17: Gujarati vowel signs inside Roman Hinglish no longer pass as Latin; Latin accents and Hindi's Devanagari do
  assert.equal(scriptOk("Paani garam karo, phir dekho\u0A82 kya hota hai?", "hinglish"), false);
  assert.equal(scriptOk("Café mein socho: kya hota hai?", "english"), true);
  assert.equal(scriptOk("पानी गरम करो, फिर देखो?", "hindi"), true);
  assert.equal(scriptOk("पानी गरम करो", "hinglish"), false);
  assert.equal(coherentRemainder("Socho, agar hum paani garam karein toh kya hoga? Batao."), true);
  assert.equal(statementKey({ kind: "practice", answer: "Any question that can be checked by trying something" }), true);
  assert.equal(statementKey({ kind: "practice", answer: "one-fourth" }), false);
  assert.equal(statementKey({ kind: "why", answer: "x" }), true);
});

test("F20: a draft that quotes part of the question is not followed by the whole question again", () => {
  const ask = "Tarbooz A ke 3 tukde kiye: ek bada aur do chhote. Kya yeh tihai hain?";
  const out = endOnAsk("Achha socha; ab socho: Tarbooz A ke 3 tukde kiye: ek bada aur do chhote.", ask);
  assert.equal(out.split("Tarbooz A ke 3 tukde").length - 1, 1, out);
  assert.ok(sharedRun("ab socho: Tarbooz A ke 3 tukde kiye", ask) >= 5);
  assert.equal(joinAsk("Tumne 3 kaha.", "Kitne tukde hain?"), "Tumne 3 kaha. Kitne tukde hain?");
});

test("F9: 'Yahin rok dete hain' and its kin are goodbye words (a turn that goes on cannot say them)", () => {
  for (const t of ["Theek hai, yahin rok dete hain.", "Chalo yahin rukte hain.", "We'll stop here.", "Aaj ke liye yahin."]) assert.equal(wrapsUp(t), true, t);
  assert.equal(wrapsUp("Yahan ruko aur socho: kaunsa bada hai?"), false);
});
