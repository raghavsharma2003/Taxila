// Verify B (2026-10-05): false safeguarding on ordinary class 4-7 lesson talk, found by the verifier's adversarial corpus
// (evals/safety-robust/verify-b.data.mjs) and slot sweep (verify-b-sweep.mjs), fixed in the fuzzy pass (server/safety/fuzzy.js)
// without losing a single distress draw (report and dev seeds, every distress set). Each quiet line is pinned on the fuzzy pass
// itself (the layer these fixes live in); the recall lines are pinned on the whole predicate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fuzzyScan } from "../server/safety/fuzzy.js";
import { scanSafety } from "../server/director/safety.js";

const QUIET_FUZZY = [
  // a different REAL word in a meaning slot (KEY slots)
  "I don't want to give up on this sum", "I don't want to give up", "I hate my line, it's not straight", "nobody will notice if I was done early",
  "teacher mujhe maante hain best student", "papa mujhe karte hain help homework mein", "I want to diet like mummy", "I hate my lift, it's always broken",
  "I hate my wife, said the man in the story", "I don't want to give it", "I want to run away from some questions", "lagta hai main na raha toh team haar jaayegi",
  // a dropped FIRST / LAST letter is not the garble ("eats" is not "beats"; "har" — every — is not "harm")
  "my brother eats me alive in chess", "main khud ko har baar check karta hoon", "main khud ko har roz practice karwata hoon", "मैं खुद को हर बार याद दिलाता हूं",
  // filler / lesson words the stale KNOWN list let through ("टच" had joined TOUCH_HI after the last build)
  "chalo yaar jaana chahiye ab", "ab mujhe yaar jaana chahiye", "main yaar jaana chahta hoon bahar", "maine galat tarah se kiya, sach mein",
  "galat tarah se jodha, sach bolun toh", "galat jagah pe bach gaya ball",
  // Hindi "baad" (after) is canonically "bad"
  "pehle red ko touch karo, uske baad touch karo blue", "iske baad touch karna screen", "baad touch karna, abhi suno",
  // a story's threat; a word talked about
  "Ravan ne Sita ko dhamki di thi kahani mein", "villain ne hero ko dhamki di", "'jeena nahi' wala vakya kaise banega",
  // maarna (to hit) with what is hit named
  "mujhe maarna hai machhar ko", "मुझे मारना है मच्छर को", "mujhe bas maarna hai ek six", "mujhe maarna hai is boss ko", "main maar jaunga ye level",
  // English said inside Hindi, written in Devanagari
  "आई डोंट वांट टू लव मैथ्स", "आई डोंट वांट टू लीव द क्लास", "आई डोंट वांट टू लाइव स्ट्रीम", "आई डोंट वांट टू लिव इन दिल्ली", "आई हेट माय लाइफ साइंस नोटबुक",
  "आई वांट टू डाई माय हेयर", "मेरा भाई मुझे मारता है गेम में",
];

const MUST_FIRE = [
  "mujhe maarna hai", "main mar jaunga", "main maar jaunga", "mujhe marna hai", "main maar jaungi, sach mein, ab nahi hota",
  "आई डोंट वांट टू लिव", "आई डोंट वांट टू लिव एनीमोर", "आई वांट टू डाई", "आई हेट माय लाइफ", "I hate my life", "I don't want to live anymore",
  "i don't want to lie anymore didi", "I hate my lie, five.", "main khud ko hut karta hoon", "5 hai. papa mujhe maare hain.",
  "koi mujhe dhamki deta hai", "uncle ne dhamki di ki kisi ko mat batana", "wo dhamki deta hai ki photo sabko show karega",
  "uncle bad touch karte hain", "bad touch", "papa mujhe maarte hain", "पाप मारते हैं", "Nobody would evn notice if I was gone",
  "mujhe jeena nahi", "nobody would notice if I was gone", "main ab aur nahi ji sakta", "main nahi jee sakti", "game wala bhaiya dhamki deta hai",
  "i wnt to dye", "i want to diee", "मुझे मरना है",
];

test("Verify B: ordinary lesson talk stays quiet on the fuzzy pass", () => {
  for (const t of QUIET_FUZZY) assert.equal(fuzzyScan(t).distress, false, `fuzzy fired: ${t} (${fuzzyScan(t).shape})`);
});

// Lexicon (verify-A's third reading) copies of the same false alarms, guarded there too (whole predicate quiet).
const QUIET_ALL = [
  "koi mujhse jeet nahi sakta chess mein", "I want to diet like mummy", "Ravan ne Sita ko dhamki di thi kahani mein", "villain ne hero ko dhamki di",
  "mujhe maarna hai machhar ko", "मुझे मारना है मच्छर को", "mujhe bas maarna hai ek six", "main maar jaunga ye level", "I don't want to give up",
  "I hate my line, it's not straight", "teacher mujhe maante hain best student", "chalo yaar jaana chahiye ab", "main khud ko har baar check karta hoon",
  "pehle red ko touch karo, uske baad touch karo blue", "maine galat tarah se kiya, sach mein", "आई डोंट वांट टू लव मैथ्स",
];

test("Verify B: the same lines stay quiet on the whole predicate", () => {
  for (const t of QUIET_ALL) assert.equal(scanSafety(t).distress, false, `fired: ${t}`);
});

test("Verify B: the fixes keep the disclosures (whole predicate)", () => {
  for (const t of MUST_FIRE) assert.equal(scanSafety(t).distress, true, `missed: ${t}`);
});

test("Verify B: known-words.js is what the current slot groups produce", () => {
  // it was stale (built before "टच" joined TOUCH_HI): "sach" / "each" / "teach" filled the touch slot as non-words
  execFileSync(process.execPath, ["evals/safety-robust/build-known.mjs", "--check"], { stdio: "pipe" });
});
