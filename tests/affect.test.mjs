import { test } from "node:test";
import assert from "node:assert/strict";
import { readUtterance, nextAffect, initialAffect, frustrationLoop, gaming, gamingDiscount, wheelSpinning } from "../server/learner/affect.js";
import { revealsAnswer, buildPracticeQueue, isomorphicFor, diagnosticItem } from "../server/director/items.js";
import { scanSafety, wantsToStop } from "../server/director/safety.js";
import { kit } from "./fixtures/kit.mjs";

const K = kit();

test("readUtterance: pata-nahi, just-tell-me and minimal answers in Hinglish, Hindi and English", () => {
  for (const t of ["pata nahi", "Pata nahin didi", "मुझे नहीं पता", "I don't know", "maloom nahi"]) assert.equal(readUtterance(t).dontKnow, true, t);
  for (const t of ["answer batao na", "aap hi bata do", "just tell me"]) assert.equal(readUtterance(t).asksForAnswer, true, t);
  for (const t of ["hmm", "ok", "haan", "acha"]) assert.equal(readUtterance(t).minimal, true, t);
  assert.equal(readUtterance("1/2 bada hai kyunki do hi tukde hain").dontKnow, false);
});

test("frustration loop after three don't-knows; a real answer resets it", () => {
  const dk = { read: readUtterance("pata nahi") };
  let a = initialAffect();
  a = nextAffect(a, dk); a = nextAffect(a, dk);
  assert.equal(frustrationLoop(a), false);
  a = nextAffect(a, dk);
  assert.equal(frustrationLoop(a), true);
  assert.equal(nextAffect(a, { read: readUtterance("1/2"), outcome: "correct", itemId: "i1", answer: "1/2" }).dontKnowStreak, 0);
});

test("gaming: repeated just-tell-me or cycling through different wrong answers discounts evidence", () => {
  let a = initialAffect();
  for (const ans of ["1/3", "1/4", "1/5"]) a = nextAffect(a, { read: readUtterance(ans), outcome: "incorrect", itemId: "i3", answer: ans });
  assert.equal(gaming(a), true);
  assert.equal(gamingDiscount(a), 0.5);
  let held = initialAffect();
  for (let i = 0; i < 3; i++) held = nextAffect(held, { read: readUtterance("1/3"), outcome: "misconception", itemId: "i3", answer: "1/3" });
  assert.equal(gaming(held), false, "repeating one wrong answer is a held belief, not gaming");
  let asks = initialAffect();
  for (let i = 0; i < 2; i++) asks = nextAffect(asks, { read: readUtterance("answer batao na"), itemId: "i3" });
  assert.equal(gaming(asks), true);
  for (let i = 0; i < 10; i++) asks = nextAffect(asks, { read: readUtterance("1/2"), outcome: "correct", itemId: `x${i}`, answer: "1/2" });
  assert.equal(gaming(asks), false, "asks age out of the window");
});

test("wheel-spinning: ten opportunities without three in a row", () => {
  assert.equal(wheelSpinning(["correct", "incorrect", "correct", "incorrect", "correct", "incorrect", "correct", "incorrect", "correct", "incorrect"]), true);
  assert.equal(wheelSpinning(["incorrect", "correct", "correct", "correct", "incorrect", "incorrect", "incorrect", "incorrect", "incorrect", "incorrect"]), false);
  assert.equal(wheelSpinning(["incorrect", "incorrect"]), false, "too few opportunities to call it");
});

test("revealsAnswer: a key the question does not name leaks anywhere; a named option only in a verdict", () => {
  const i1 = K.items.find((i) => i.id === "i1");     // answer 1/2, not in the prompt
  assert.equal(revealsAnswer("Socho, ek tukda 1/2 hota hai na?", i1), true);
  assert.equal(revealsAnswer("Do barabar tukde hain. Ek tukde ko kya bolte hain?", i1), false);
  assert.equal(revealsAnswer("Haan, aadha!", i1), true, "acceptable forms count");
  const i3 = K.items.find((i) => i.id === "i3");     // "Which is bigger, 1/2 or 1/3?" answer 1/2
  assert.equal(revealsAnswer("Kaun bada hai, 1/2 ya 1/3?", i3), false, "re-posing the question is not a leak");
  assert.equal(revealsAnswer("Dekho, 1/2 bada hai.", i3), true);
  assert.equal(revealsAnswer("1/2 aur 1/3 ko roti se socho. Kaunsa tukda bada lagega?", i3), false);
});

test("practice queue: kit order, teach-back held back, a diagnostic second; isomorphic stays on skill", () => {
  const q = buildPracticeQueue(K);
  assert.equal(q[1], "diag:c4-maths-ch05-t01-m1");
  assert.ok(!q.includes("i8"), "the teach-back item is for the teach-back phase");
  const s = { itemsDone: ["i1"] };
  const iso = isomorphicFor(s, K, K.items.find((i) => i.id === "i1"));
  assert.equal(iso.skillId, "c4-maths-ch05-t01-s1");
  assert.notEqual(iso.id, "i1");
  const d = diagnosticItem(K, K.misconceptions[0]);
  assert.equal(d.answer, "1/2");
  assert.equal(d.hints.length, 4);
});

test("safety predicate: self-harm, abuse and fear families in three scripts; idioms stay quiet", () => {
  assert.equal(scanSafety("I want to die").kind, "self_harm");
  assert.equal(scanSafety("mujhe jeena nahi hai").kind, "self_harm");
  assert.equal(scanSafety("papa hits me when I lose").kind, "abuse");
  assert.equal(scanSafety("मुझे मारते हैं").kind, "abuse");
  assert.equal(scanSafety("didi mujhe papa maarte hain").kind, "abuse", "actor between mujhe and the verb");
  assert.equal(scanSafety("मुझे पापा मारते हैं").kind, "abuse");
  assert.equal(scanSafety("school mein sab mujhe chidhate hain, bully karte").kind, "fear");
  assert.equal(scanSafety("beats me, no idea").distress, false);
  assert.equal(scanSafety("1/3 bada hai").distress, false);
  assert.equal(wantsToStop("didi mujhe jana hai ab"), true);
  assert.equal(wantsToStop("1/2 bada hai"), false);
});
