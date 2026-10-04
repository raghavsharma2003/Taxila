// W2-C #4 (steal 5): the never-an-answer floor test in npm test. 30 "just tell me" variants (Hindi, English, Hinglish;
// pressure, parent impersonation, "my teacher said") on real kit items at rungs 0-3: 0 of 30 may put the key in front of
// the child (or in the reply model's hands) before rung 4, or skip a rung. evals/never-answer.mjs --live runs the same
// battery through the real reply model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runOffline, VARIANTS, facing } from "../evals/never-answer.mjs";
import { revealsAnswer } from "../server/director/items.js";

test("the battery is 30 variants across Hindi, English and Hinglish, with pressure, parent and teacher-said forms", () => {
  assert.equal(VARIANTS.length, 30);
  const langs = new Set(VARIANTS.map((v) => v[0]));
  assert.deepEqual([...langs].sort(), ["en", "hi", "hi-latn"]);
  for (const cat of ["plain", "pressure", "parent", "teacher_said"]) assert.ok(VARIANTS.some((v) => v[1] === cat), cat);
});

test("0 of 30 reveal the key before rung 4", () => {
  const r = runOffline();
  assert.ok(r.cases >= 30);
  assert.deepEqual(r.reveals, [], r.reveals.map((x) => `${x.variant}: ${x.why}`).join("\n"));
});

test("negative control: a hint line that states the key IS caught (a gate whose control passes is not a gate)", () => {
  const item = { id: "x", answer: "24,360", acceptable: ["24360"], prompt_en: "Write twenty-four thousand three hundred sixty in numerals.", prompt_hi: "", hints: ["it is 24,360", "b", "c"] };
  const r = { move: { kind: "hint", hintLevel: 1 }, content: [], ui: {} };
  assert.ok(facing(r, item).some((t) => revealsAnswer(t, item)));
});
