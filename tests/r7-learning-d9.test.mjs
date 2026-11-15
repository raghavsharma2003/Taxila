// Round 7 F, director14 D9 (v6.6): spoken fields say symbols in words; a remediation never states the key of a card still to
// come; a follow-up card is never posed with every value it names already marked. Pure: check.mjs on the pilot scripts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spokenSymbolErrors, remediationKeyErrors, structureErrorsV2 } from "../scripts/lesson-scripts/check.mjs";

const script = (id) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${id}.json`, import.meta.url), "utf8"));
const topic = (cls, id) => JSON.parse(readFileSync(new URL(`../data/kits/${cls}-maths.json`, import.meta.url), "utf8")).topics.find((t) => t.topicId === id);
const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];

test("D9.1: a quoted symbol in a spoken field is refused; the pilots say 'question mark' in words", () => {
  const s = script("c5-maths-ch02-t02");
  assert.deepEqual(spokenSymbolErrors(s), []);
  // (main's one-term round, 19:02: "question mark" beside "nishaan" was a twin pair; the card now names the unlabelled mark in words,
  // with no symbol and no "mark")
  assert.match(s.skills[0].checks[2].prompt.hi, /pehle nishaan par koi number nahi likha/);
  assert.ok(!/['"]\?['"]|question mark/.test(s.skills[0].checks[2].prompt.hi));
  s.skills[0].checks[2].prompt.hi = "Woh '?' wala nishaan 1/8 se bada hai ya chhota?";
  assert.equal(spokenSymbolErrors(s).length, 1);
  // a board's own "?" label is not spoken (the reader pass of 2026-11-11 dropped the pilot's "?" bar labels on cards that ask a
  // name, not a fraction; the rule is held on a copy)
  s.skills[2].checks[1].board.params.bars[0].label = "?";
  assert.equal(spokenSymbolErrors(s).length, 1, "only the quoted symbol in the prompt, never the board's label");
});

test("D9.2: a remediation never states a key still to come (steady 44: c5-t01's count-marks remediation said the yourStep's 1/4)", () => {
  for (const id of PILOTS) assert.deepEqual(remediationKeyErrors(script(id)), [], id);
  const s = script("c5-maths-ch02-t01");
  s.skills[0].remediation[0].say.hi += " Pehla nishaan 1/4 metre par hota.";
  assert.ok(remediationKeyErrors(s).some((x) => /states 1\/4, the key of c5-maths-ch02-t01-s1\/workedExample\.yourStep/.test(x)));
  // a choice card whose prompt names the value gives nothing away
  const t = script("c5-maths-ch02-t02");
  assert.match(t.skills[1].remediation[1].then.prompt.hi, /2\/4 ya 5\/12/);
});

test("D9.3: a follow-up card is posed with its named values unmarked (c5-t02 s1 steady 6: 1/7 and 1/9 already marked)", () => {
  const s = script("c5-maths-ch02-t02"), kit = topic("c5", "c5-maths-ch02-t02");
  assert.deepEqual(s.skills[0].remediation[0].then.board.params.marks ?? [], []);
  // (the then-card's own pair: 1/8 and 1/12 since the reader pass of 2026-11-11, 1/6 and 1/12 before)
  s.skills[0].remediation[0].then.board.params.marks = [[1, 8], [1, 12]];
  assert.ok(structureErrorsV2(s, kit).some((x) => /remediation\[0\]\.then is posed with its values already marked/.test(x)));
  // a reference mark the prompt names (c5-t01 s1: "pehla mark 1/5", asking where 1/6 goes) is fine
  const r = script("c5-maths-ch02-t01");
  assert.deepEqual(r.skills[0].remediation[1].then.board.params.marks, [[1, 5]]);
  assert.ok(!structureErrorsV2(r, topic("c5", "c5-maths-ch02-t01")).some((x) => /already marked/.test(x)));
});

test("D9.4-5: c4's yourStep board draws the eaten pieces (5-piece barfi, 3 eaten, since the reader pass); every pilot worked example speaks its givens as one sentence", () => {
  assert.deepEqual(script("c4-maths-ch05-t01").skills[0].workedExample.yourStep.board.params, { parts: 5, shade: 3, whole: "bar", hideResult: true });
  for (const id of PILOTS) for (const k of script(id).skills) assert.equal(k.workedExample.givens.length, 1, `${k.skillId}: one spoken sentence`);
});
