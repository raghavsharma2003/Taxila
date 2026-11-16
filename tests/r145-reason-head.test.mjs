// 14.5 (4A, main's conditions): the REASON HEAD. sim lab 14.3 decided gate r5-rel143-9a30285 (claude/r5-simlab 551f72dd):
// a right answer followed by its own reason earned no evidence ("7 lakh rahega... kyunki 49,999 aadhe lakh se kam hai",
// "saat! kyuki dus ungliyaan hain na, teen mod do toh saat"), because the reason brought numbers or words of its own. The
// answer before the first reason marker is the answer when it carries a complete form on its own and the reason does not
// take it back (correction, alternative, hedge, another answer, don't-know, a negated head). Pure: real kits, no model
// (the model's label is given, the worst case: "correct" on everything).
import { test } from "node:test";
import assert from "node:assert/strict";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { targetFor, classifyFast } from "../server/director/classify.js";
import { corroborate, reasonHead, reasonTakesBack } from "../server/grading/corroborate.js";

const kits = {};
const targetOf = (id) => {
  const tp = id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)[0];
  const kit = (kits[tp] ??= kitFromFile(getTopic(tp)));
  const item = kit.items.find((i) => i.id === id);
  return targetFor({ phase: "practice", hintLevel: 0, activeItemId: id }, kit, item);
};
const MODEL_CORRECT = { outcome: "correct", confidence: 0.9, source: "model", flags: {} };
/** The grade a reply gets when the model calls it correct: the code path first, then corroboration. */
const grade = (id, text, label = MODEL_CORRECT) => {
  const target = targetOf(id);
  const fast = classifyFast({ target, childText: text, typed: true });
  return fast.result ?? corroborate({ target, text, result: label });
};

test("the five example turns: two rescued, three out of this rule's reach (and why)", () => {
  // p61 #8 predict: the key's acceptable "7 lakh" first, its reason after (49,999 and 50,000 are the key's own)
  const p61 = grade("c7-maths-ch01-t02-i04", "7 lakh rahega... kyunki 49,999 aadhe lakh se kam hai na, isliye upar nahi gaya");
  assert.equal(p61.outcome, "correct"); assert.equal(p61.corroboration, "supported_reason_head");
  // p28 #2: the number path read two numbers (a hedge); the head is the key's one number
  const p28 = grade("c1-maths-ch04-t01-i01", "saat! kyuki dus ungliyaan hain na, teen mod do toh saat khadi rehti hain");
  assert.equal(p28.outcome, "correct"); assert.equal(p28.source, "number_reason_head");
  // p16 #5 is a WHY item: the key is a reason, so a head before "taaki" is never it (low cover of a Hinglish paraphrase)
  assert.equal(grade("c7-science-ch04-t03-i06", "haan didi, chlorine daalte hain tanki mein taaki paani ke germs mar jayen aur paani safe ho peene ke liye.").outcome, "no_evidence");
  // p27 #2: no reason marker ("मतलब" is not one); the reader cannot read "(3, 2) मतलब तीन right, दो up"
  assert.equal(grade("c9-maths-ch01-t01-i02", "नहीं, same point नहीं हैं। (3, 2) मतलब तीन right, दो up और (2, 3) मतलब दो right, तीन up।").outcome, "no_evidence");
  // p03 #13 "तेरा" (13, but also "your"): not in scope, an open item
  assert.equal(grade("c3-maths-ch03-t02-i10", "तेरा।").outcome, "no_evidence");
});

test("the reason may bring its own numbers and words when they are working, a comparison or the question's", () => {
  assert.equal(grade("c7-maths-ch01-t02-i01", "6 lakh, kyunki 62 hazaar aadhe lakh se zyada hai").outcome, "correct");
  assert.equal(grade("c7-maths-ch01-t02-rl-o2", "umm... 3 lakh views... kyunki das-hazaar wala digit 2 hai na, 5 se kam hai toh lakh wala 3 hi rahega").outcome, "correct");
  assert.equal(reasonTakesBack("kyunki usmein 4 hai, 5 se kam, toh 3 lakh hi rahega.", "nahi", [300000, 4, 5], new Set()), null);
  assert.equal(reasonTakesBack("kyunki beech mein 3,50,000 karke phir 4,00,000 karna galat hai", "nahi", [300000], new Set()), null);
});

test("the reason takes the head back: correction, alternative, hedge, another answer, don't-know", () => {
  const base = "7 lakh rahega, kyunki 49,999 aadhe lakh se kam hai";
  for (const tail of [", nahi nahi, 8 lakh", ". wait, 8 lakh", " ya 8 lakh", ", toh answer 8 lakh hai", ", toh 8 lakh hoga", ", par shayad 8 lakh hoga", "... pata nahi", ", sorry 8 lakh"]) {
    const g = grade("c7-maths-ch01-t02-i04", base + tail);
    assert.notEqual(g.outcome, "correct", base + tail);
  }
  assert.notEqual(grade("c7-maths-ch01-t02-i04", "7 lakh ya 8 lakh, kyunki 49,999 aadhe lakh se kam hai").outcome, "correct");
  // a number the question states is never an answer after an explicit cue
  assert.equal(reasonTakesBack("kyunki ..., toh answer 60 hai", "40", [40], new Set(), [60]), "other_answer");
  // an unreadable number after an answer cue is not the key
  assert.equal(reasonTakesBack("kyunki ..., toh answer 5⁴ hai", "x", [1000000], new Set()), "other_answer");
});

test("a negated head is not the answer; a 'no' key said twice is", () => {
  assert.notEqual(grade("c6-maths-ch01-t03-rl-h1", "225 nahi, Kyunki 1 se lekar odd numbers ka sum square hota hai").outcome, "correct");
  assert.equal(reasonHead("saat! kyuki dus ungliyaan hain na")?.head, "saat!");
  assert.equal(reasonHead("kyunki dus ungliyaan hain"), null, "a reply that starts with its reason has no head");
});

test("a misconception the model read in the reason stays on the result (a trap, never plain correct)", () => {
  const label = { ...MODEL_CORRECT, reasonMisconceptionId: "m-test" };
  const g = corroborate({ target: targetOf("c7-maths-ch01-t02-i04"), text: "7 lakh rahega... kyunki 49,999 aadhe lakh se kam hai na", result: label });
  assert.equal(g.corroboration, "supported_reason_head");
  assert.equal(g.reasonMisconceptionId, "m-test");
});

test("constructed adversarial forms on real items: no wrong head and no taken-back right head is credited by a head rule", () => {
  const items = ["c7-maths-ch01-t02-i04", "c7-maths-ch01-t02-i01", "c1-maths-ch04-t01-i01", "c5-maths-ch04-t02-i01", "c2-maths-ch02-t01-i04", "c4-evs-ch03-t02-rl-h3"];
  const reasons = ["kyunki maine dhyan se dekha", "because I checked it on the board", "क्योंकि मैंने गिनकर देखा"];
  let n = 0;
  for (const id of items) {
    const t = targetOf(id);
    const head = String(t.also?.find((a) => a && t.alsoLabel?.[a] !== "partial" && t.alsoLabel?.[a] !== "wrong") ?? t.key).split(/[.;]/)[0];
    const w = /^\d/.test(head) ? String(Number(String(head).replace(/[^\d.]/g, "")) + 1) : "Sphere";
    for (const r of reasons) {
      for (const text of [`${w}, ${r}`, `${head}, ${r}... nahi nahi, ${w}`, `${head} ya ${w}, ${r}`, `${head}, ${r}, toh answer ${w} hai`, `${head}, ${r}. wait, ${w}`, `${head}, ${r}, par shayad ${w} hoga`, `${head}, ${r}... pata nahi`]) {
        const g = grade(id, text); n++;
        assert.ok(!(g.outcome === "correct" && /reason_head|supported_head/.test(`${g.source}:${g.corroboration}`)), `${id}: ${text} → ${g.source}:${g.corroboration}`);
      }
    }
  }
  assert.ok(n >= 100);
});

// 14.5 (main's review of f867cbd9): a doubt aside after a right head, and an answer said as a question, are hedges
test("main's two cases: a right head with a doubt after it, and a head said as a question, are not credited", () => {
  assert.notEqual(grade("c1-maths-ch04-t01-i02", "2... kyunki 8 ke baad 9...10, do fingers aur. Par maine to pehle hi bata diya tha na, sirf 5 aur 5 hota hai?").outcome, "correct");
  assert.notEqual(grade("c1-maths-ch04-t01-i02", "2... kyunki 8 ke baad 9, 10—do ungliyan aur, dekho... par mujhe laga sirf 5 aur 5 se 10 banta hai").outcome, "correct");
  assert.notEqual(grade("c5-maths-ch04-t02-i01", "8,000... kyunki 5 aur 3 milke 8 hota hai na, toh 8,000?").outcome, "correct");
  // a tag on the reason is not a question about the answer
  assert.equal(reasonTakesBack("kyunki uska ek angle 90 degree ka hai. yeh sahi hai na?", "right-angled triangle", [90], new Set(["triangle"])), null);
});

// 14.5 (main; open-r145-whole-reply-contradiction): the whole-reply credit has the same vetoes
test("a whole reply that carries the key but takes it back is not credited", () => {
  const id = "c4-maths-ch05-t01-i01";
  const key = targetOf(id).key;
  for (const t of [`${key}, kyunki maine dekha... nahi nahi, half`, `${key} ya half, kyunki maine dekha`, `${key}, kyunki maine dekha, toh answer half hai`,
    `${key}, kyunki maine dekha. wait, half`, `${key}, kyunki maine dekha... pata nahi`]) assert.notEqual(grade(id, t).outcome, "correct", t);
  // a different short answer before the reason, the key only inside the reason
  assert.notEqual(grade("c2-maths-ch02-t01-i03", "Sphere, isliye cuboid").outcome, "correct");
});

test("what is NOT taken back: a self-correction that ends on the key, a musing after it, another form of the same answer", () => {
  assert.equal(grade("c4-maths-ch05-t01-i01", "One quarter. Ya phir one-fourth kehte hain na.").outcome, "correct");
  assert.equal(grade("c7-science-ch02-t02-i01", "Neutralisation! The base reacts with extra acid and makes it calm, like... neutral. But wait, that means acid-base mix in her stomach? That's weird... I thought that makes poison or something?").outcome, "correct");
  // Devanagari: "या" inside "किया" and "पर" inside "ऊपर" are not an alternative or a doubt
  assert.equal(reasonTakesBack("दस x माइनस x किया तो 1.5 हुआ, और राइट साइड ऊपर है", "", [1.5], new Set(), [], { negation: false, cues: false }), null);
});

// 14.5 (main): the question rule is "a question with no confirmation after it"
test("an answer said as a question and then said again without one is credited; a question left standing is not", () => {
  assert.equal(grade("c8-maths-ch03-t02-i12", "aath hazaar...? aath hazaar hoga.").outcome, "correct");
  assert.equal(grade("c5-maths-ch04-t02-i05", "4000 ke aas-paas? 6,800 minus 2,900… haan, lagbhag 4,000.").outcome, "correct");
  assert.notEqual(grade("c5-maths-ch04-t02-i01", "8,000... kyunki 5 aur 3 milke 8 hota hai na, toh 8,000?").outcome, "correct");
  // a "shayad … hoga" after the question is a hedge, never its confirmation (the plain number path's own hedged-answer rule,
  // exact_hedged, is unchanged)
  assert.notEqual(reasonTakesBack("shayad aath hazaar hoga.", "aath hazaar...?", [8000], new Set()), null);
});
