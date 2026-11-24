// Learning 017 (dc-r8-director28): the checker's fit limits, quick questions only where a pair cannot fit, worked examples that ask
// the reasoning step, joints.stepMiss in and joints.workedInvite out. Written from the rules, not from a sentence of today's scripts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scriptOf, d29Errors, fitOf, fitReport, D29_PILOTS, HOOK_MAX, POINT_CARD_MAX, REM_CARD_MAX, WORKED_OPENING_MAX, remWhole } from "../scripts/lesson-scripts/check.mjs";

const S = Object.fromEntries(D29_PILOTS.map((t) => [t, scriptOf(t)]));
const fresh = (t) => structuredClone(S[t]);

test("017: the live scripts (the four pilots, c5-maths-ch02-t03 from dc-r8-director31, c6-maths-ch07-t01 from director32) are under the rules and pass them", () => {
  // (to-brain 052 D: c4-maths-ch01-t02 live, the seventh)
  assert.deepEqual([...D29_PILOTS].sort(), ["c4-maths-ch01-t02", "c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01", "c6-maths-ch07-t01"]);
  for (const [t, s] of Object.entries(S)) assert.deepEqual(d29Errors(s), [], t);
});

test("017 A.1, A.2: a hook over 20 words, and a later point and card over 61, fail; a quick is the record of a pair that cannot fit", () => {
  const s = fresh("c6-maths-ch06-t01");
  s.skills[0].hook.interestSlots[0].use.hi = Array(HOOK_MAX + 1).fill("kinaara").join(" ") + ".";
  assert.ok(d29Errors(s).some((x) => /s1\/hook\.slot0: 21 words > 20/.test(x)));
  const u = fresh("c6-maths-ch06-t01"), b = u.skills[0].explain[1];
  b.point.hi = `${b.point.hi} ${Array(POINT_CARD_MAX).fill("bhuja").join(" ")}.`;
  assert.ok(d29Errors(u).some((x) => /s1\/e2: the point and its card are \d+ words > 61/.test(x)));
  // (kept with a quick whose answer the point does not say, the pair is allowed)
  b.quick = { prompt: { hi: "Bina label wali kitni bhujayein hain?", en: "How many sides have no label?" }, key: "paanch", accept: ["5 bhujayein"], say: { hi: "Paanch bhujayein.", en: "Five sides." } };
  assert.ok(!d29Errors(u).some((x) => /s1\/e2/.test(x)), d29Errors(u).join(" | "));
  // (a quick whose key the point says is an echo)
  b.quick.accept = ["hexagon"];
  assert.ok(d29Errors(u).some((x) => /s1\/e2\.quick: "hexagon" is in the point/.test(x)));
});

test("017 B.1: a quick on a pair that fits is an error", () => {
  const s = fresh("c4-maths-ch05-t01");
  s.skills[0].explain[1].quick = { prompt: { hi: "Cake ke kitne tukde hain?", en: "How many pieces has the cake?" }, key: "3", accept: ["teen"], say: { hi: "Teen tukde.", en: "Three pieces." } };
  assert.ok(d29Errors(s).some((x) => /s1\/e2\.quick: the point and its card fit one turn/.test(x)));
});

test("017 A.4, D: the worked opening fits 53 words; an asked step or the child's own step is never a bare sum", () => {
  const s = fresh("c6-maths-ch06-t01"), we = s.skills[1].workedExample;
  we.steps[0].ask.prompt.hi = "Bracket pehle: 24 + 18 kitna hua?";
  we.yourStep.prompt.hi = "Poore chakkar ke liye 2 × 42 kitna hoga?";
  const e = d29Errors(s);
  assert.ok(e.some((x) => /s2\/workedExample\.steps\[0\]\.ask\.prompt: asks a sum/.test(x)));
  assert.ok(e.some((x) => /s2\/workedExample\.yourStep\.prompt: hands the child the sum/.test(x)));
  const u = fresh("c5-maths-ch02-t02");
  u.skills[0].workedExample.problem.hi += " " + Array(WORKED_OPENING_MAX).fill("chocolate").join(" ") + ".";
  assert.ok(d29Errors(u).some((x) => /s1\/workedExample: the problem and the first question .* > 53/.test(x)));
  for (const s2 of Object.values(S)) for (const w of fitOf(s2).worked) assert.ok(w.total <= WORKED_OPENING_MAX && w.between.length === 0, `${s2.topicId} ${w.skill}`);
});

test("017 E: stepMiss, three short forms that say no and name no answer; workedInvite is gone", () => {
  for (const [t, s] of Object.entries(S)) {
    assert.equal(s.joints.workedInvite, undefined, t);
    assert.equal(s.joints.stepMiss.length, 3, t);
  }
  const s = fresh("c4-maths-ch05-t01");
  s.joints.workedInvite = [{ hi: "Saath mein karein?", en: "Together?" }];
  s.joints.stepMiss[0] = { hi: "Jawab 2/5 tha, yeh nahi.", en: "It was 2/5, not that." };
  const e = d29Errors(s);
  assert.ok(e.some((x) => /joints\.workedInvite: the invitation is gone/.test(x)));
  assert.ok(e.some((x) => /joints\.stepMiss\[0\]: \d+ words > 4/.test(x)) && e.some((x) => /joints\.stepMiss\[0\]: names no answer/.test(x)));
});

// (repinned for Learning 018, "said beats fitted": a pilot remediation fits 49 or is on the checker's REM_WHOLE list with its reason;
// d29Errors still never fails one — d30Errors does, unless it is listed)
test("017 A.3: a remediation and its card are measured and reported, never failed by d29Errors; every pilot remediation fits 49 or is listed whole (018)", () => {
  for (const [t, s] of Object.entries(S)) {
    for (const r of fitOf(s).rems) assert.ok(r.total <= REM_CARD_MAX || remWhole(t, r.skill, r.targets), `${t} ${r.skill} rem${r.i}: ${r.total}`);
    assert.ok(fitReport(s).some((x) => /^remediation /.test(x)), t);
  }
  const s = fresh("c6-maths-ch06-t01");
  s.skills[0].remediation[0].say.hi += " " + Array(30).fill("bhuja").join(" ") + ".";
  assert.ok(!d29Errors(s).some((x) => /remediation/.test(x)), "a long remediation is not an error");
  assert.ok(fitReport(s).some((x) => /remediation s1\[0\].*WHOLE \(said alone\)/.test(x)));
});

test("017 C: c4 s1 e4's point is drawn on the 8-strip alone; c5-t01's count-marks card no longer draws the ticks it asks to count", () => {
  const e4 = S["c4-maths-ch05-t01"].skills[0].explain[3];
  assert.deepEqual(e4.board.params.bars.map((b) => b.parts), [8]);
  assert.deepEqual(e4.ask.board.params.bars.map((b) => b.parts), [8, 6], "the Raju strip comes with its card");
  const cm = S["c5-maths-ch02-t01"].skills[0].remediation[0].then;
  assert.ok(!(cm.board.params.dens ?? [cm.board.params.den]).includes(12), "the card is posed without the 12-gap line");
  assert.ok((cm.answerBoard.params.dens ?? []).includes(12), "its answer board shows the 11 marks");
  const e2 = S["c5-maths-ch02-t01"].skills[0].explain[1];
  assert.equal(e2.board.params.den, 7, "s1 e2's point: the upper line alone");
  for (const t of ["c5-maths-ch02-t02"]) for (const k of S[t].skills.slice(0, 2)) assert.notDeepEqual(k.workedExample.board, k.workedExample.yourStep.answerBoard, `${t} ${k.skillId}: the problem is not posed on the answer board`);
});
