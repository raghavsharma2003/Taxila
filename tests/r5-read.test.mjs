// round 5 (stream 4A; owner 2026-10-14: "the understood-or-not concept, the human part"): the covert per-turn read
// (server/director/read.js) and what the teacher does with a claim of understanding. The read is measured against blind
// labels in evals/comprehension-r5 (n = 198 + 198 held out); these pin its rules. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { comprehensionRead, claimsUnderstanding, claimsToUnderstand } from "../server/director/read.js";
import { norm } from "../server/director/items.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const R = (o, text, extra = {}) => comprehensionRead({ outcome: o, flags: {}, ...extra }, { childText: text, target: { mode: "item" } });

test("the read: understood / partly / not / null, from the verified grade and the turn's own words", () => {
  assert.equal(R("correct", "3/4").read, "understood");
  assert.deepEqual(R("correct", "3/4", { reasonMisconceptionId: "m1" }), { read: "partly", misconceptionId: "m1", basis: "right_answer_wrong_reason" });
  assert.equal(R("partial", "summer").read, "partly");
  assert.deepEqual(R("misconception", "the peas, there are more", { misconceptionId: "m-more" }), { read: "not", misconceptionId: "m-more", basis: "misconception" });
  assert.equal(R("incorrect", "13").read, "not");
  assert.equal(R("no_evidence", "").basis, "silence");
  assert.equal(R("no_evidence", "pata nahi").read, "not");
  assert.equal(R("no_evidence", "मुझे नहीं पता").read, "not");
  for (const t of ["haan haan samajh gaya", "हाँ समझ गया", "ok samajh aa gaya", "yes I understood"]) assert.equal(R("no_evidence", t).read, "partly", t);
  assert.equal(R("no_evidence", "kya hai yeh?").read, null, "their own question is not about understanding");
  assert.equal(R("no_evidence", "kuch bhi", { request: { type: "visual" } }).read, null);
  assert.equal(R("no_evidence", "the ₹10 note", { flags: { offTopic: true } }).read, "not", "an answer that misses the question");
  assert.equal(comprehensionRead({ outcome: "no_evidence", flags: { offTopic: true } }, { childText: "cricket?", target: { mode: "none" } }).read, null);
  assert.equal(claimsUnderstanding("ok"), true);
  assert.equal(claimsToUnderstand("ok"), false, "a bare ok is not an explicit claim");
});

test("Hindi answers keep their vowel signs: a gender or chandrabindu misconception is never the key", () => {
  assert.notEqual(norm("हरा घास"), norm("हरी घास"));
  assert.notEqual(norm("लोमड़ी भागने लगा"), norm("लोमड़ी भागने लगी"));
  assert.notEqual(norm("चाद"), norm("चाँद"));
  assert.equal(norm("बर्फ़"), norm("बर्फ"), "the nukta is folded (ASR drops it)");
  assert.equal(norm("चांद"), norm("चाँद"), "candrabindu and anusvara are free variants");
  for (const [a, b] of [["हँसना", "हंसना"], ["पहुँचा", "पहुंचा"], ["गाँव", "गांव"], ["ब्रेकफॉस्ट", "ब्रेकफास्ट"], ["दुःख", "दुख"]]) assert.equal(norm(a), norm(b), `${a} = ${b}`);
});

test("a claim of understanding after an explanation gets ONE light check, not more teaching on trust", () => {
  const K = kit();
  const NE = cls("no_evidence");
  const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  while (!["explain", "worked_example"].includes(r.move.kind) && r.state.phase !== "practice") r = turn(r, NE);
  assert.ok(["explain", "worked_example"].includes(r.move.kind), "an explanation on the table");
  const skill = r.move.skillId;
  const c = turn(r, NE, { text: "haan haan samajh gaya" });
  assert.equal(c.move.request, "light_check");
  assert.ok(c.move.itemId, "a question is posed");
  assert.equal(K.items.find((i) => i.id === c.move.itemId)?.skillId, skill, "on the skill just explained");
  assert.match(c.move.shape, /light question/);
  assert.doesNotMatch(c.move.shape, /really understood\?/);
});

test("a bluff after skill 1's explanation, the light check answered right: skill 2 is still taught", () => {
  // main's review of 2dcd117: bluffCheck ends the opening teach plan; that plan only ever teaches the kit's FIRST skill
  // (fading.js teachPlanFor; every later skill gets its explain turn in poseNext when it is first introduced)
  const K = kit();
  const [s1, s2] = K.skills.map((s) => s.id);
  const NE = cls("no_evidence");
  const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  while (!["explain", "worked_example"].includes(r.move.kind) && r.state.phase !== "practice") r = turn(r, NE);
  assert.equal(r.move.skillId, s1);
  r = turn(r, NE, { text: "haan haan samajh gaya" });
  assert.equal(r.move.request, "light_check");
  const moves = [];
  for (let i = 0; i < 40 && r.state.phase !== "done" && r.state.phase !== "teachback"; i++) {
    r = turn(r, r.state.activeItemId ? cls("correct") : NE, { text: r.state.activeItemId ? "answer" : "ok" });
    moves.push(r.move);
    if (r.move.kind === "explain" && r.move.skillId === s2) break;
  }
  assert.ok(moves.some((m) => m.kind === "explain" && m.skillId === s2), `skill 2 explained: ${moves.map((m) => `${m.kind}:${m.skillId ?? m.itemId ?? ""}`).join(" ")}`);
});
