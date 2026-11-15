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
  // with no symbol and no "mark"; main 2026-11-15: the chapter's word for it is now "mark", and "question mark" stays out)
  assert.match(s.skills[0].checks[2].prompt.hi, /pehle mark par koi number nahi likha/);
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
  // (director22 clause 8 rewrite, 2026-11-15: c5-t02 s2's then-card "2/4 ya 5/12?" was recast as which strip has more colour,
  // naming no fraction; the choice then-card naming its own key is now c4 s2's bag card, "1/5 hai ya 1/6?", key 1/6 — and
  // remediationKeyErrors(c4) is [] above)
  const t = script("c4-maths-ch05-t01");
  const ch = t.skills[1].remediation[0].then;
  assert.match(ch.prompt.hi, /1\/5 hai ya 1\/6/);
  assert.equal(ch.key, "1/6");
});

test("D9.3: a follow-up card is posed with its named values unmarked (c5-t02 s1 steady 6: 1/7 and 1/9 already marked)", () => {
  // (director22 clause 8 rewrite, 2026-11-15: c5-t02 s1's then-card moved from a line to two unnamed, unshaded strips (1/9 vs
  // 1/11, which part is bigger), so nothing on it is marked; the line choice card named by its fractions is now c5-t01 s3's
  // "9/5 ya 9/10?" over its 0-to-2 line, posed unmarked — marking both of its values is refused)
  const t02 = script("c5-maths-ch02-t02");
  assert.ok(t02.skills[0].remediation[0].then.board.params.bars.every((b) => b.shade === 0 && b.label === ""), "c5-t02 s1's then-card: nothing shaded or named");
  const s = script("c5-maths-ch02-t01"), kit = topic("c5", "c5-maths-ch02-t01");
  assert.match(s.skills[2].remediation[1].then.prompt.hi, /9\/5 ya 9\/10/);
  assert.equal(s.skills[2].remediation[1].then.board.template, "fraction-line@1");
  assert.deepEqual(s.skills[2].remediation[1].then.board.params.marks ?? [], []);
  assert.ok(!structureErrorsV2(s, kit).some((x) => /already marked/.test(x)));
  s.skills[2].remediation[1].then.board.params.marks = [[9, 5], [9, 10]];
  assert.ok(structureErrorsV2(s, kit).some((x) => /remediation\[1\]\.then is posed with its values already marked/.test(x)));
  // a reference mark the prompt names (c5-t01 s1: "pehla mark 1/5", asking where 1/6 goes) is fine
  const r = script("c5-maths-ch02-t01");
  assert.deepEqual(r.skills[0].remediation[1].then.board.params.marks, [[1, 5]]);
  assert.ok(!structureErrorsV2(r, topic("c5", "c5-maths-ch02-t01")).some((x) => /already marked/.test(x)));
});

test("D9.4-5: c4's yourStep board draws the eaten pieces (5-piece barfi, 3 eaten, since the reader pass); every pilot worked example speaks its givens as one sentence", () => {
  assert.deepEqual(script("c4-maths-ch05-t01").skills[0].workedExample.yourStep.board.params, { parts: 5, shade: 3, whole: "bar", hideResult: true });
  for (const id of PILOTS) for (const k of script(id).skills) assert.equal(k.workedExample.givens.length, 1, `${k.skillId}: one spoken sentence`);
});
