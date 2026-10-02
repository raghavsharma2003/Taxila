// Red-team table for the safeguarding predicate (director/safety.js). A miss here means no safeguard move
// and no incident row whenever the model's distress read is skipped or fails, so every disclosure shape a
// review found missing is pinned here, beside idioms that must stay quiet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety, wantsToStop } from "../server/director/safety.js";

const DISCLOSURES = [
  ["I wanna die", "self_harm"],
  ["i dont want to live anymore", "self_harm"],
  ["I don't want to live", "self_harm"],
  ["main mar jaungi", "self_harm"],
  ["main mar jaunga didi", "self_harm"],
  ["nobody loves me i want to disappear", "self_harm"],
  ["mujhe marna chahti hoon", "self_harm"],
  ["my father beats me", "abuse"],
  ["my mother hits me", "abuse"],
  ["my brother hits me every day", "abuse"],
  ["sir touched me", "abuse"],
  ["ma'am slapped me", "abuse"],
  ["papa marte hain", "abuse"],
  ["mummy roz peetti hai", "abuse"],
  ["chacha ne chhua", "abuse"],
  ["didi mujhe papa maarte hain", "abuse"],
  ["papa mujhe maarte hain", "abuse"],
  ["bad touch hua", "abuse"],
  ["ghar mein dar lagta hai", "fear"],
  ["they bully me at school", "fear"],
  ["nobody loves me", "fear"],
];
const QUIET = ["it beats me", "this one beats me, no idea", "my arm hurts", "1/2 bada hai", "maine ball ko maara", "teen wala bada hai kyunki teen bada hai", "pata nahi didi", "roti ke do tukde"];

test("every disclosure in the red-team table fires the predicate, in its family", () => {
  for (const [text, kind] of DISCLOSURES) assert.deepEqual(scanSafety(text), { distress: true, kind }, text);
});

test("idioms and lesson talk do not fire it", () => {
  for (const text of QUIET) assert.equal(scanSafety(text).distress, false, text);
});

test("stop: a goodbye or a bare stop ends the lesson; a toilet or water break does not", () => {
  for (const t of ["bye didi", "I want to stop", "I have to go", "i need to go now.", "stop", "bas", "band karo", "ab bas karo", "mujhe jaana hai"]) assert.equal(wantsToStop(t), true, t);
  for (const t of ["I have to go to toilet", "I have to go get water", "i need to go to the bathroom", "bas itna hi answer hai", "stop sign ka colour red hai", "1/2 bada hai"]) assert.equal(wantsToStop(t), false, t);
});
