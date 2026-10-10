// r4-latency: the first TTS sentence lock (server/brain/say.js lockFirstSentence, TAXILA_TTS_FIRST_SENTENCE). The lock may
// only hold when a valid final turn that starts with s1 exists (s1 + the pinned question passes every guard) and s1 fails
// no per-sentence guard on its own. Safety, closing and check-in turns never lock. Pure: a fake `problems`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lockFirstSentence, firstSentenceMode, PER_SENTENCE } from "../server/brain/say.js";

const ASK = "Ek cube mein kitne corners hote hain?";
/** A fake guard: flags listed substrings; a turn without the question at the end is "ask". */
const fake = (bad = {}) => (t) => {
  const out = Object.entries(bad).filter(([, s]) => t.includes(s)).map(([k]) => k);
  if (!t.trim().endsWith(ASK)) out.push("ask");
  return out;
};
const base = { askEnd: ASK, closing: false, spoken: true, confirmNeeded: false };

test("off unless TAXILA_TTS_FIRST_SENTENCE=shadow", () => {
  assert.equal(firstSentenceMode({}), "off");
  assert.equal(firstSentenceMode({ TAXILA_TTS_FIRST_SENTENCE: "shadow" }), "shadow");
  assert.equal(firstSentenceMode({ TAXILA_TTS_FIRST_SENTENCE: "on" }), "off", "no live mode yet");
});

test("locks a clean first sentence when s1 + the question passes every guard", () => {
  const r = lockFirstSentence({ ...base, reply: `Achha, chalo gin ke dekhte hain. Har kone ko ek ek karke gino. ${ASK}`, problems: fake() });
  assert.equal(r.locked, true, r.why);
  assert.equal(r.s1, "Achha, chalo gin ke dekhte hain.");
  assert.ok(r.fallback.startsWith(r.s1) && r.fallback.endsWith(ASK));
});

test("a draft whose only problems are whole-turn shape still locks s1 (the rest is what gets fixed)", () => {
  const r = lockFirstSentence({ ...base, reply: "Achha, chalo gin ke dekhte hain. Aur kya socha tumne?", problems: fake() });
  assert.equal(r.locked, true, r.why);
});

test("never locks: text lane, closing / safety turns, no pinned question, one sentence, a question, the screen", () => {
  const reply = `Achha, chalo gin ke dekhte hain. ${ASK}`;
  assert.equal(lockFirstSentence({ ...base, reply, problems: fake(), spoken: false }).why, "text_lane");
  assert.equal(lockFirstSentence({ ...base, reply, problems: fake(), closing: true }).why, "turn_kind");
  assert.equal(lockFirstSentence({ ...base, reply, problems: fake(), askEnd: null }).why, "no_pinned_question");
  assert.equal(lockFirstSentence({ ...base, reply: ASK, problems: fake() }).why, "one_sentence");
  assert.equal(lockFirstSentence({ ...base, reply: `Kya tum taiyaar ho? ${ASK}`, problems: fake() }).why, "s1_asks");
  assert.equal(lockFirstSentence({ ...base, reply: `Screen par dekho cube ko. ${ASK}`, problems: fake() }).why, "s1_screen");
});

test("a per-sentence guard on s1 (leak, praise, floor, ...) blocks the lock; a guard only the minimal turn fails blocks it too", () => {
  for (const k of ["leak", "praise", "floor", "register", "script", "math"]) {
    assert.ok(PER_SENTENCE.has(k));
    const r = lockFirstSentence({ ...base, reply: `Achha, aath corners hote hain. ${ASK}`, problems: fake({ [k]: "aath" }) });
    assert.equal(r.locked, false);
    assert.equal(r.why, `s1_${k}`);
  }
  const r = lockFirstSentence({ ...base, reply: `Achha, chalo gin ke dekhte hain. ${ASK}`, problems: (t) => (t.includes(ASK) && t.startsWith("Achha") ? ["long"] : []) });
  assert.equal(r.why, "min_long");
});

test("after a right answer s1 must confirm it", () => {
  const r = lockFirstSentence({ ...base, confirmNeeded: true, reply: `Chalo agla dekhte hain. ${ASK}`, problems: fake() });
  assert.equal(r.why, "s1_noconfirm");
  assert.equal(lockFirstSentence({ ...base, confirmNeeded: true, reply: `Bilkul sahi, shabash. ${ASK}`, problems: fake() }).locked, true);
});
