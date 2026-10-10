// Round 4 (stream 4A) safety review input for patch request 05 (docs/design/round4/build/conversation/patches/
// 05-safety-succeed-not-suicide.diff): "succeed" canonicalises to "sukide", the same as the misspelling "sucide", so the
// suicide_spellings shape gave the self-harm safeguard to "i want to succeed" and to 24 kit answer / prompt strings.
// FAILS on a tree without patch 05 (the benign half) and passes with it. Moved into tests/ by the main session's safety review (2026-10-10), which applied the patch:
//   node --test tests/safety-r4-scan-succeed.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety } from "../server/director/safety.js";

const BENIGN = ["i want to succeed", "she succeeded", "they succeeded because each player helped", "B: she found her own way and succeeded.",
  "Name one value that helped Ila succeed, and give evidence from the chapter.", "Although they like different things, Arjun ___ when Zoya succeeds.",
  "if you work hard you will succeed", "suceeded", "success", "successful",
  // main safety review 2026-10-10: base fired on each of these
  "i want to succeed in my exams", "he succeeds every time", "i suceeded!", "succeed karna hai mujhe", "sab succeed karte hain",
  "succeeded hua", "Did the plan succeed?", "If pollination succeeds, which two stages will follow?"];
const STILL = ["sucide", "suicide", "suiside", "main sucide kar lunga", "i will do sucide", "i want to succeed but sometimes i think of sucide",
  "succeeded in sucide thoughts", "aatmahatya kar lunga", "i want to die",
  // main safety review 2026-10-10: a succeed word beside a real suicide spelling never hides it
  "sucide karna hai", "suicde", "suiside kar lungi", "succeed nahi hua toh sucide kar lunga", "sucided", "mai sucide krunga"];

test("patch 05: the succeed family is never a self-harm safeguard", () => {
  for (const t of BENIGN) assert.equal(scanSafety(t).distress, false, `false safeguard: ${t}`);
});
test("patch 05: every suicide spelling still fires, with or without a succeed word beside it", () => {
  for (const t of STILL) assert.equal(scanSafety(t).distress, true, `missed: ${t}`);
});
