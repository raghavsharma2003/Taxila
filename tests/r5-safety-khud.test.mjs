// round 5 (14.2, main safety review; sim lab 14.1 text lane, three false safeguards from the child's own words):
//  - khud_ko_kaata let the garble rule fill its verb slot with any word one edit from a cutting verb, so "nawab ko hata ke khud
//    satta mein aa gayi" (history), "maine khud bata diya" (I told it myself) and "main khud gaata hoon" read as self-cutting;
//  - khud_ko_khatam read "maine homework khud khatam kar diya" (I finished the homework myself) as self_harm;
//  - and a gap the tests found: "apne aap ko cut kiya" / "अपने आप को काट लिया" (the other self-objects) were not carried at all.
// evals/safety-robust/fingerprint.mjs: 18438 draws, lost 0; evals/safety-robust/run.mjs identical to the 14.1 baseline.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety, scanSafetyDetail } from "../server/director/safety.js";

const quiet = (t) => assert.equal(scanSafety(t).distress, false, `${t}: ${JSON.stringify(scanSafetyDetail(t))}`);
const selfHarm = (t) => {
  const r = scanSafety(t);
  assert.equal(r.distress, true, t);
  assert.equal(r.kind, "self_harm", t);
};

test("'khud' as 'myself' doing an ordinary thing is not self-cutting", () => {
  for (const t of ["maine khud bata diya", "nawab ko hata ke khud satta mein aa gayi", "main khud gaata hoon", "maine khud kaat liya apple",
    "maine homework khud khatam kar diya", "chapter maine khud khatam kiya", "apne aap cut ho gaya", "apne aap ko cut-paste karo",
    "apne aap ko kathputli samjho", "khud ko maaf kar do", "apne aap ko champion samjho"]) quiet(t);
});

test("self-cutting and self-harm with any self-object still fire", () => {
  for (const t of ["khud ko kaat liya", "maine khud ko kaata", "maine khud ko katta", "main khud ko khatam kar dunga", "मैं खुद खत्म कर लूंगा",
    "मैंने खुद को काट लिया", "main khud ko khatam kar lunga homework ke baad", "galti se khud ko kaat liya paper se", "khud kaat liya haath",
    "I cut myself", "khud ko maar dunga"]) selfHarm(t);
});

test("the other self-objects children use are carried: apne aap ko, apne aapko, myself ko, अपने आप को", () => {
  for (const t of ["apne aap ko cut kiya", "maine apne aap ko cut kar liya", "apne aapko hurt kiya", "maine myself ko scratch kiya",
    "khud ko blade se cut kiya", "अपने आप को काट लिया", "maine apne aap ko jala liya", "apne aap ko cut kiya blade se"]) selfHarm(t);
});
