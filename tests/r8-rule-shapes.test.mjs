// director32 (report-c6 A, clause 28): "Parimap mein bhujayein jodte hain, guna nahi." was a false rule said to children, and the
// --rules listing did not print it (no trigger word). The listing now also prints a sentence that ends on a bare contrast and one
// that names an arithmetic operation with "sirf" or "nahi". These are the two sentences the judge found, as fixtures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { d32Listing, isRuleSentence, RULE_WORDS } from "../scripts/lesson-scripts/check.mjs";

const HI = (hi, en = "x") => ({ hi, en });
const BARE_CONTRAST = "Parimap mein bhujayein jodte hain, guna nahi.";
const OP_SIRF = "Line ke liye bhujayein judti hain; guna sirf andar ke square ginta hai.";
const frag = (say, sayAlt) => ({ topicId: "t-frag", terms: [], joints: {}, skills: [{ skillId: "t-frag-s1", explain: [],
  remediation: [{ targets: "m", say: HI(say), ...(sayAlt ? { sayAlt: HI(sayAlt) } : {}) }] }] });

test("rule shapes: the bare closing contrast is listed although it has no trigger word", () => {
  assert.equal(RULE_WORDS.test(BARE_CONTRAST), false);
  assert.equal(isRuleSentence(BARE_CONTRAST), true);
  for (const x of ["Kaatne se hisse guna hote hain, jod nahi.", "Number bada hone se hissa bada nahi hota."]) assert.equal(isRuleSentence(x), true, x);
});

test("rule shapes: an operation named with sirf or nahi is listed", () => {
  assert.equal(isRuleSentence(OP_SIRF), true);
  assert.equal(isRuleSentence("6 × 4 toh andar ke square hain, dhaaga nahi hai yeh."), true);
  assert.equal(isRuleSentence("Yahan jodna nahi hai, ghatana hai."), true);
});

test("rule shapes: a plain teaching sentence is not listed", () => {
  for (const x of ["Kinaare ke liye bhujayein jodo.", "Socho, ek cheenti khet ke kone se chalti hai.", "Lambai aur chaudai ka guna andar ki tiles ginta hai."])
    assert.equal(isRuleSentence(x), false, x);
});

test("rule shapes: --rules prints both fixture sentences as R lines", () => {
  const r = d32Listing(frag(`Socho, kinaare par dhaaga lapeta. ${BARE_CONTRAST}`, OP_SIRF)).filter((x) => x.startsWith("R "));
  assert.deepEqual(r, [`R t-frag-s1/remediation[0].say: ${BARE_CONTRAST}`, `R t-frag-s1/remediation[0].sayAlt: ${OP_SIRF}`]);
});
