// round 7 A2 brain-age-register (decision D3, dc-r7-age-bands; OWNER-RESET #1: a class-4 child got the babyish register):
// ONE band table (shared/learner.ts BANDS, Brain-owned) with a three-way register, young 1-3 / preteen 4-6 / teen 7-9;
// the legacy age band, Learning's twin, Asha's persona sheets and the agent lane all derive from it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BANDS as SHARED } from "../shared/learner.ts";
import { registerOf, contractBandOf, classesOf } from "../shared/bands.ts";
import { BANDS as SERVER, bandsFor } from "../server/learner/bands.js";
import { ageBandFor } from "../server/learner/model.js";
import { CHARACTERS, sheetFor } from "../server/compiler/characters/index.js";
import { systemPrompt } from "../server/agent/prompt.js";

test("one table: young 1-3, preteen 4-6, teen 7-9; the legacy band follows the register", () => {
  const want = { 1: "young", 2: "young", 3: "young", 4: "preteen", 5: "preteen", 6: "preteen", 7: "teen", 8: "teen", 9: "teen" };
  for (let c = 1; c <= 9; c++) {
    assert.equal(registerOf(c), want[c], `class ${c}`);
    assert.equal(contractBandOf(c), want[c] === "young" ? "6-9" : "10-15", `class ${c}`);
  }
  assert.deepEqual(classesOf("young"), [1, 3]);
  assert.deepEqual(classesOf("preteen"), [4, 6]);
  assert.deepEqual(classesOf("teen"), [7, 9]);
  assert.throws(() => registerOf(10));
});

test("Learning's twin and ageBandFor derive from the one table (never a second split)", () => {
  assert.equal(SERVER, SHARED);
  for (let c = 1; c <= 9; c++) assert.equal(ageBandFor(c), bandsFor(c).contract);
  assert.equal(ageBandFor(4), "10-15", "class 4 is no longer the young band");
  assert.equal(ageBandFor(undefined), "10-15");
});

test("a class-4 child gets the older persona sheet: a peer protégé, never the baby elephant", () => {
  const asha = CHARACTERS.asha;
  const four = sheetFor(asha, 4), three = sheetFor(asha, 3);
  assert.doesNotMatch(four.protege.what, /baby|elephant|animal/i);
  assert.ok(four.notes.some((n) => /^competence before warmth/.test(n)));
  assert.match(three.protege.what, /baby elephant/, "classes 1-3 keep the young sheet");
});

test("the agent lane speaks in the same register: class 4 is a 9-12 child, class 3 young, class 8 a teenager", () => {
  const promptFor = (classLevel) => systemPrompt({ classLevel, lang: "hinglish", address: "tum", teacherName: "Asha" });
  assert.match(promptFor(4), /a child of 9-12/);
  assert.match(promptFor(3), /a young child/);
  assert.match(promptFor(8), /a teenager/);
});
