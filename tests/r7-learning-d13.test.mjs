// Round 7 F, director18 D13 (dc-r7-script-walk-v6-10): her joints authored per topic (three forms each, a {said} slot in the
// return, no topic the child did not raise); a point never solves a later card; c4 e3 on a heap e1 does not solve; c5-t02's
// whys are full clauses and its gap remediation is one short. Pure: check.mjs on the pilot scripts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { jointErrors, pointKeyErrors, whyVerbErrors, JOINT_KINDS } from "../scripts/lesson-scripts/check.mjs";

const script = (id) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${id}.json`, import.meta.url), "utf8"));
const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];

test("every pilot carries its own joints: four kinds, three distinct forms each, {said} in every return", () => {
  const seen = new Set();
  for (const id of PILOTS) {
    const s = script(id);
    assert.deepEqual([...jointErrors(s), ...pointKeyErrors(s)], [], id);
    for (const k of JOINT_KINDS) assert.ok(s.joints[k].length >= 3, `${id} ${k}`);
    assert.ok(s.joints.asideReturn.every((f) => f.hi.includes("{said}") && f.en.includes("{said}")));
    seen.add(s.joints.asidePark.map((f) => f.hi).join("|"));
  }
  assert.equal(seen.size, PILOTS.length, "each topic parks in its own words");
});

test("D13.1: one sentence said every time is refused; a return without {said}, a named topic, a park promising a question", () => {
  const s = script("c4-maths-ch05-t01");
  s.joints.hindiSwitch = [s.joints.hindiSwitch[0]];
  assert.ok(jointErrors(s).some((x) => /joints\.hindiSwitch: at least 3 forms/.test(x)));
  const t = script("c4-maths-ch05-t01");
  t.joints.asideReturn[0] = { hi: "Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?", en: "Now your cricket: what do you like most?" };
  const errs = jointErrors(t);
  assert.ok(errs.some((x) => /asideReturn\[0\]: the return picks up what the child said/.test(x)));
  assert.ok(errs.some((x) => /names a topic \(cricket\)/.test(x)));
  const u = script("c4-maths-ch05-t01");
  u.joints.asidePark[1] = { hi: "{aside} ki baat hum is sawaal ke baad karenge.", en: "We'll do {aside} after this question." };
  assert.ok(jointErrors(u).some((x) => /asidePark\[1\]: a park promises no question/.test(x)));
  const v = script("c4-maths-ch05-t01");
  delete v.joints;
  assert.deepEqual(jointErrors(v), ["joints: a { asidePark, asideReturn, hindiSwitch, askAgain } block, three forms each (D13)"]);
});

test("D13.3: a point that solves a later card is refused (c4 e1 '12 … 4 barabar group, har group mein 3' over e3's 12 → 3)", () => {
  const s = script("c4-maths-ch05-t01");
  const e1 = s.skills[1].explain[0], e3 = s.skills[1].explain[2];
  assert.equal(e3.ask.key, "5");
  assert.match(e3.ask.prompt.hi, /20/);
  assert.notDeepEqual(e3.ask.board, e1.ask.board, "e3 is posed on a heap e1 does not draw");
  // the director18 shape: e3 back on 12 → 3 while e1's point groups 12 in 4s of 3
  e3.ask.prompt = { hi: "In 12 kanchon ka 1/4 kitna hai?", en: "What is 1/4 of these 12 marbles?" };
  e3.ask.key = "3";
  assert.ok(pointKeyErrors(s).some((x) => /s2\/e1 point: states 3, the key of c4-maths-ch05-t01-s2\/e3 still to come, with its prompt's 12/.test(x)));
});

test("D13.3: c5-t02 e1's why is a full clause; the gap remediations are one short over unshaded bars", () => {
  const s = script("c5-maths-ch02-t02");
  const why = s.skills[0].explain[0].ask.why;
  assert.ok(/\bhain\b/.test(why.hi) && /\bhai\b/.test(why.hi) && !/^2 patti/.test(why.hi), why.hi);
  assert.deepEqual(whyVerbErrors({ skills: [{ ...s.skills[0], explain: [s.skills[0].explain[0]], checks: [], remediation: [] }] }), []);
  for (const [i, j] of [[1, 2], [2, 2]]) {
    const r = s.skills[i].remediation[j];
    assert.match(r.say.hi, /ek-ek hissa/, `s${i + 1} rem${j}: one short`);
    assert.doesNotMatch(r.say.hi, /do-do hisse/);
    assert.ok(r.then.board.params.bars.every((b) => b.shade === 0));
  }
  // s1 c1's close shows the answer: shaded
  assert.ok(s.skills[0].checks[0].answerBoard.params.wholes.every((w) => w.shade === 1));
});
