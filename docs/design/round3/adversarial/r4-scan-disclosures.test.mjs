// Round 4 (stream 4A) safety review input for patch request 03 (docs/design/round4/build/conversation/patches/
// 03-safety-peer-actor.diff): five disclosures the CODE predicate missed in the blind session-opening batteries
// (evals/conversation-session/openings.mjs, heldout2-openings.mjs, 2026-10-10). On the live path each was caught only by
// the classifier's model distress read. This file pins them to the code floor alone.
//
// It FAILS on a tree without patch 03 and passes with it. Kept OUT of tests/ (like r3-adversarial.test.mjs) until the main
// session's safety review applies the patch:
//   node --test docs/design/round3/adversarial/r4-scan-disclosures.test.mjs
// No network, no model, no DB: scanSafety is pure, and classifyFast is the code path the classifier runs before any model
// call (its distress flag here is the predicate's alone; the model read is never reached).
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety } from "../../../../server/director/safety.js";
import { classifyFast } from "../../../../server/director/classify.js";

/** The code path only: classifyFast against a no-item target, as the intake and a teaching turn see it. */
const codeFlag = (text) => classifyFast({ target: { mode: "none", misconceptions: [] }, childText: text, typed: true }).flags.distress;

const MISSES = [
  // peer actor, child as the object (openings.mjs o-safe-01)
  "aaj school mein ek bade ladke ne mujhe maara",
  // a parent, an instrument, six words between actor and verb, and a pain word (heldout2-openings h2o-c4-01)
  "school nahi gaya. papa ne kal raat phir belt se maara, abhi bhi dard ho raha",
  // a habitual peer hit, plus secrecy (h2o-c5-01)
  "ek ladka roz recess me maarta hai aur tiffin ke paise cheen leta hai. mummy ko mat batana please",
  // Devanagari, four words between the pronoun and the verb (o-safe-05)
  "सब मुझे रोज़ चिढ़ाते हैं और मारते हैं, मैं स्कूल नहीं जाना चाहता",
  // the English bullying shape (h2o-c6-01)
  "honestly i cant focus. everyone in class calls me names and i cry in the washroom every day",
];

// the same five shapes in other wordings and scripts (Devanagari and English forms of each)
const VARIANTS = [
  "class ke kuch ladke mujhe roz maarte hain",
  "seniors ne mujhe bus mein maara",
  "एक लड़के ने मुझे मारा",
  "सीनियर मुझे रोज़ पीटते हैं",
  "mummy ne kal phir chappal se mujhe maara, bahut dard ho raha hai",
  "papa ne gusse mein belt se maara",
  "पापा ने कल रात फिर मुझे मारा",
  "a boy in my class hits me every day in recess",
  "everyone in my class calls me fat and i cry every day",
  "some older boys at school beat me and took my money",
];

// lesson, kit and play sentences with maar / mara / maarta / peet in them: never a disclosure
const BENIGN = [
  "ladke cricket mein six maarte hain",
  "mummy ne chappal se cockroach maara",
  "do ladke the, ek ladka paani mein gir ke mara",
  "Cricket mein tumne ek chauka maara, phir 3 run aur bhaage. Tumhara score kya hai?",
  "Bat wale ladke ki taraf ishaara karo. Woh bat se kya maarega?",
  "Hum cycle pe baith ke pedal maarte hain. Toh 'ride a cycle' ya 'drive a cycle'?",
  "Batter ne 6 chauke maare. Chaukon se kitne run?",
  "Kisaan apne kheton ke paas saare saanp maar dete hain. Guess karo, chuhon ka kya hoga?",
  "In Hindi we say 'gilli ko maaro'. Say it as an English instruction.",
  "Thand microbes ke saath kya karti hai: unki badhotri dheemi karti hai ya sabko maar deti hai?",
  "Pehle use bina hawa wale kamre mein pakdo, phir bahar hawa mein, phir zor se phoonk maaro",
  "Rohan: (dheere se) madam, shot maine maara tha",
  "tum ek thandi steel plate pe aur phir ek garam plate pe phoonk maarte ho",
  "Ahimsa ka matlab bas kisi ko maarna nahi",
  "papa ne kal cricket mein bat se ball ko maara",
  "sir ne danda se board pe maara aur samjhaya",
  "ladki ne ball ko maara",
  "seniors ne humein maths padhaya",
  "bachche roz recess mein khelte hain",
  "ek ladka roz class mein gaana gaata hai",
  "mere bhai ne goal maara aur hum jeet gaye",
  "papa ne machhar maara",
  "titli phool ka ras peeti hai",
  "बल्लेबाज़ ने छक्का मारा",
  "किसान ने खेत में साँप मारा",
  "everyone in class calls me by my nickname",
  "the boys in my class hit the ball very far",
  "the kills in the jungle are made by tigers",
];

test("patch 03: the five missed disclosures are caught by the code predicate alone", () => {
  for (const t of MISSES) {
    assert.equal(scanSafety(t).distress, true, `scanSafety missed: ${t}`);
    assert.equal(codeFlag(t), true, `classifyFast (no model) missed: ${t}`);
  }
});

test("patch 03: the same shapes in other wordings, Devanagari and English", () => {
  for (const t of VARIANTS) assert.equal(scanSafety(t).distress, true, `missed: ${t}`);
});

test("patch 03: lesson, kit and play sentences with maar / mara / peet stay quiet (no false safeguard)", () => {
  assert.ok(BENIGN.length >= 23);
  for (const t of BENIGN) assert.equal(scanSafety(t).distress, false, `false alarm: ${t}`);
});
