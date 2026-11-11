// Round 7 F, director15 D10 (v6.7): no ask board puts "?" over a value its prompt states; "no later key" covers then-cards,
// distractors and choice cards; a worked problem states every number its givens use. Pure: check.mjs on the pilot scripts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { askBoardQuestionErrors, remediationKeyErrors, workedProblemNumberErrors, spokenSymbolErrors } from "../scripts/lesson-scripts/check.mjs";

const script = (id) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${id}.json`, import.meta.url), "utf8"));
const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];

test("the four pilots are clean of every D9/D10 rule", () => {
  for (const id of PILOTS) {
    const s = script(id);
    assert.deepEqual([...spokenSymbolErrors(s), ...remediationKeyErrors(s), ...askBoardQuestionErrors(s), ...workedProblemNumberErrors(s)], [], id);
  }
});

test("D10.2: an ask board never labels '?' a value its prompt states (c4 steady 78: 'is aadhe' over a '?' half)", () => {
  const s = script("c4-maths-ch05-t01");
  const b = s.skills[2].explain[0];
  assert.match(b.ask.prompt.hi, /aadhe/);
  (b.ask.board ?? b.board).params.bars[0].label = "?";
  assert.ok(askBoardQuestionErrors(s).some((x) => /e1: its board labels a bar of 2 parts "\?" though its prompt states/.test(x)));
});

test("D10.4: 'no later key' covers distractors, choice cards and a then-card's own key", () => {
  // a distractor still to come (director15: c5-t01's whole-number-bias remediation used e3's distractor, now 1/8)
  const a = script("c5-maths-ch02-t01");
  assert.equal(a.skills[0].explain[2].ask.wrongIfMis, "1/8");
  a.skills[0].remediation[1].say.hi += " 1/8 bhi aisa hi hai.";
  assert.ok(remediationKeyErrors(a).some((x) => /remediation\[1\]: states 1\/8, the distractor of c5-maths-ch02-t01-s1\/e3/.test(x)));
  // a then-card whose key a/b gives a later whole-number key b (the count-marks then-card's 1/8 m gave e2's "8 gaps")
  const b = script("c5-maths-ch02-t01");
  assert.equal(b.skills[0].explain[1].ask.key, "8");
  b.skills[0].remediation[0].then.key = "1/8 m";
  assert.ok(remediationKeyErrors(b).some((x) => /remediation\[0\]\.then: its key 1\/8 m states 8, the key of c5-maths-ch02-t01-s1\/e2/.test(x)));
  // a choice card is no longer exempt (c5-t02's s1 remediation said e2's 1/4, firing at e1)
  const c = script("c5-maths-ch02-t02");
  assert.equal(c.skills[0].explain[1].ask.key, "1/4");
  c.skills[0].remediation[0].say.hi += " Do 1/8 milkar ek 1/4.";
  assert.ok(remediationKeyErrors(c).some((x) => /states 1\/4, the key of c5-maths-ch02-t02-s1\/e2/.test(x)));
});

test("D10: a worked problem states every number its givens use (the givens recital is gone, the problem is said)", () => {
  const s = script("c6-maths-ch06-t01");
  assert.match(s.skills[0].workedExample.problem.hi, /7 m, 9 m aur 12 m/);
  s.skills[0].workedExample.problem.hi = "Phoolon ki ek kyari triangle jaisi hai. Kitni lambi baad lagegi?";
  s.skills[0].workedExample.givens = [{ hi: "bhujayein 7 m, 9 m aur 12 m", en: "sides 7 m, 9 m and 12 m" }];
  assert.ok(workedProblemNumberErrors(s).some((x) => /givens\/find use 7, 9, 12, which its problem never states/.test(x)));
});
