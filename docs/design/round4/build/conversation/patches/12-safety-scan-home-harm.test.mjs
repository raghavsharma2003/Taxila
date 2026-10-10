// Patch request 12 (server/safety/lexicon.js + one GUARD_VETO line in server/director/safety.js; applies on top of patch 11):
// a slap or a stream of gaali at home, or an adult / older children hitting a NAMED child, passed silently on base. Goes to
// tests/safety-r4-scan-home-harm.test.mjs. FAILS on base (every FIRE line below is quiet there), passes with the patch. No hooks.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety } from "../server/director/safety.js";

const FIRE = [
  // the main session's list
  "ghar pe thappad padte hain", "wo gaali dete hain ghar pe", "sab Riya ko roz gaali dete hain",
  "cricket ke match mein maarpeet ki jagah ab sab Riya ko gaali dete hain",
  "घर पे थप्पड़ पड़ते हैं", "वो घर पे गाली देते हैं", "they abuse me with bad words at home",
  // base misses found while writing patch 11's near-misses
  "coach ne Aman ko thappad maara", "seniors ne Sonu ka bat cheen liya aur dhakka diya",
  "maarpeet ki jagah ab wo gaali dete hain ghar pe", "match ke baad maarpeet ki jagah ghar pe thappad padte hain",
  "match ke baad coach ne Aman ko thappad maara",
  // more of the same, Hinglish / Devanagari / English
  "mujhe thappad pada", "mujhe thappad padte hain roz", "ghar mein mujhe thappad padte hain", "maine kuch nahi kiya phir bhi mujhe thappad pada",
  "mummy roz gaali deti hai", "papa roz gaali dete hain", "bhaiya mujhe gaali deta hai", "gaali dete hain ghar mein sab",
  "उसने मुझे गाली दी", "पापा गाली देते हैं", "मुझे थप्पड़ पड़ा", "seniors ne Rahul ko dhakka diya",
  "my dad swears at me", "my mom curses at me every day", "they swear at me at home",
  // a story never explains the child as the one hit
  "kahani mein mujhe ghar pe thappad padte hain jaise Bholu ko",
];
// The GUARD_VETO line: a slap / gaali in a sport turn is harm detail, as belt and danda already were. Near-misses inside the
// sport frame's surface ("X mein ...") that are disclosures, quiet on base:
const SPORT_FRAME_NEAR = [
  "cricket mein usne mujhe gaali di", "match mein seniors ne mujhe thappad maara", "kabaddi mein sab Riya ko gaali dete hain",
];
const QUIET = [
  // rules and advice: no finite verb, or a negation / "mat"
  "gaali dena buri baat hai", "gaali dena achhi baat nahi hai", "teacher ne kaha gaali mat do", "mummy kehti hain gaali nahi dete",
  "hum gaali nahi dete", "kisi ko gaali nahi dena chahiye", "gaali mat do kisi ko", "sir ne kaha thappad maarna galat hai",
  "thappad maarna buri baat hai", "mujhe thappad nahi pada", "ghar pe gaali koi nahi deta",
  // a generic object, the child doing it, a story
  "log ek dusre ko gaali dete hain to jhagda hota hai", "maine Rohan ko gaali di thi, sorry bola", "kahani mein raja ne sipahi ko thappad maara",
  "kahani mein Bholu ko ghar pe thappad padte the", "movie mein hero ne villain ko thappad maara",
  // idiom; a pushed thing (force lessons); gali = street; "abuse" as a topic
  "hawa ka thappad laga", "thappad ki goonj sunai di", "Ramu ne gaadi ko dhakka diya", "bachon ne table ko dhakka diya to wo gir gayi",
  "force lagane ke liye humne box ko dhakka diya", "ball ko laat maari aur goal ho gaya", "papa ne ball ko laat maari",
  "gali mein cricket khelte hain", "hamari gali mein ek kutta hai", "gali ke bache bahut achhe hain",
  "abuse of power is wrong", "drug abuse is bad for health", "child abuse kya hota hai", "we should not swear at people",
  // a sport turn with no harm: the frame still holds
  "cricket mein usne chhakka maara", "match mein gaali dena mana hai", "cricket ke match mein umpire ne kaha gaali mat do",
  "game mein villain ko thappad maara", "football mein usne ball ko laat maari", "match mein unhone ek dusre ko gaali di",
];
// Known limits (NOT asserted; quiet on base and here):
//   - the plural "gaaliyan" ("chacha gaaliyan bakte hain"): real STT garbles "goliyan" (pills) to "galiyan", and adding the
//     word to the lexicon cost 34 self-harm recall draws (the fingerprint); the singular carries most turns.
//   - "cricket mein maarpeet ki jagah seniors ne Sonu ka bat cheen liya aur dhakka diya": a push in a sport turn stays the
//     sport frame's (only a slap / gaali joined GUARD_VETO).

describe("patch 12: a slap or gaali at home, an adult hitting a named child", () => {
  test("the disclosures fire", () => {
    for (const t of FIRE) assert.equal(scanSafety(t).distress, true, `quiet: ${t}`);
    for (const t of FIRE) assert.equal(scanSafety(t).kind, "abuse", `kind: ${t}`);
  });
  test("the sport frame no longer sets aside a slap or gaali (>= 3 near-misses)", () => {
    for (const t of SPORT_FRAME_NEAR) assert.equal(scanSafety(t).distress, true, `quiet: ${t}`);
  });
  test("rules, stories, idioms, pushed things, streets and sport stay quiet", () => {
    for (const t of QUIET) assert.equal(scanSafety(t).distress, false, `fired: ${t}`);
  });
});
