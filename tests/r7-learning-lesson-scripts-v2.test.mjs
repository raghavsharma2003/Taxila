// Round 7 F (dc-r7-script-walk-v2): the four pilot scripts in schema v2, live in data/lesson-scripts/ since integration 8 (staged in -v2 until Brain's v2
// validator reaches this tree (integration 7) and Studio's W10 gap count reads fraction-line@1; then they replace the v1
// files in data/lesson-scripts/ and the full S/W/V check (tests/r7-learning-lesson-scripts.test.mjs) runs on them.
// Here: Learning's v2 structure rules (F1 Hinglish Said fields, F2 a keyed ask ending every explain beat, F3 the worked
// example's yourStep, F4 interest slots in their interest's words), every kit misconception checked.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { kitTopic, structureErrors, leaks, saidErrors } from "../scripts/lesson-scripts/check.mjs";
import { INTERESTS } from "../server/persona/signals.js";

const DIR = new URL("../data/lesson-scripts/", import.meta.url);
const files = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
// (Studio 015 item 4: the lines a removed view leaves for the script authors — pictureBoard to author, a caption naming a view no
// longer drawn, an answerViewCaption over an answer board with no view — counted at the change; they only shrink)
const STUDIO015_LOST = /has no second view: author a pictureBoard|but the view drawn is none over|the answer board has no second view; write none/;
const STUDIO015_LOST_N = { "c4-maths-ch05-t01.json": 30, "c5-maths-ch02-t02.json": 73, "c5-maths-ch02-t03.json": 95, "c6-maths-ch07-t01.json": 10 };

test("the live scripts: the four v2 pilots, c5-maths-ch02-t03 (live as judged, dc-r8-director31) and c6-maths-ch07-t01 (director32)", () => {
  assert.deepEqual(files, ["c4-maths-ch05-t01.json", "c5-maths-ch02-t01.json", "c5-maths-ch02-t02.json", "c5-maths-ch02-t03.json", "c6-maths-ch06-t01.json", "c6-maths-ch07-t01.json"]);
});

for (const f of files) {
  test(`${f}: v2 structure (F1-F4) against its kit`, () => {
    const s = JSON.parse(readFileSync(new URL(f, DIR), "utf8"));
    assert.equal(s.version, 2.3, "v2.3 (director9: an authored simpler on every beat, step and card)");
    Object.defineProperty(s, "__interests", { value: INTERESTS, enumerable: false });
    // (Studio 015 item 4, 2026-11-23: a bars board whose view drew the same wholes round now has no view. Its card is listed to
    // author a pictureBoard, and a caption written for that view names a view no longer drawn — Learning 021's to fix. Those
    // lines only, and no more of them than at the change: every other line still fails)
    const errs = structureErrors(s, kitTopic(s.topicId)), lost = errs.filter((e) => STUDIO015_LOST.test(e));
    assert.deepEqual(errs.filter((e) => !STUDIO015_LOST.test(e)), []);
    assert.ok(lost.length <= (STUDIO015_LOST_N[f] ?? 0), `${f}: ${lost.length} lines for views Studio 015 item 4 removed (at most ${STUDIO015_LOST_N[f] ?? 0})\n${lost.slice(0, 5).join("\n")}`);
  });
}

test("F1: an English-only spoken line is refused; F2: a Hinglish choice question may name its key", () => {
  assert.equal(saidErrors({ hi: "The perimeter is the total length of the boundary.", en: "x" }, "t").length, 1);
  assert.deepEqual(saidErrors({ hi: "Parimap kitna hai, batao?", en: "What is the perimeter?" }, "t"), []);
  assert.equal(leaks("Ek hi bar ka 4/7 zyada hai ya 4/9?", "4/7"), false);
  assert.equal(leaks("Hint: 7 hai, toh jawab kya hai", "7"), true);
});

// ───────────── v2.1 (director5 judgement, dc-r7-script-walk-v3): Brain's validator rules, mirrored ─────────────
import { v21Errors } from "../scripts/lesson-scripts/check.mjs";

test("v2.1 rules: names, a gap '?', an echo ask, > 3 worked steps (class ≤ 5), a remediation with no board anywhere", () => {
  const sk = { skillId: "s", explain: [{ id: "e1", point: { hi: "Yeh 2 barabar tukde hain", en: "These are 2 equal pieces" }, ask: { prompt: { hi: "Riya ke paas 1/4 = ? hai", en: "x" }, key: "2" } }],
    workedExample: { steps: [1, 2, 3] }, remediation: [{ say: { hi: "a", en: "b" }, then: { prompt: { hi: "Parimap kitna hai?", en: "What is it?" }, key: "3" } }] };
  const e = v21Errors({ classLevel: 4, skills: [sk] });
  assert.equal(e.length, 5, e.join("\n"));
  // a sentence-final "?" glued to its word is fine; {friend} is the card character; class 6 may have more steps
  const ok = { skillId: "s", explain: [{ id: "e1", point: { hi: "Yeh 2 barabar tukde hain", en: "x" }, ask: { prompt: { hi: "{friend} ne kitne liye?", en: "How many did {friend} take?" }, key: "3" } }],
    workedExample: { steps: [1, 2, 3] }, remediation: [{ board: { template: "shape@1", params: { shape: "circle" } }, say: { hi: "a", en: "b" }, then: { prompt: { hi: "Kitna?", en: "How much?" }, key: "3" } }] };
  assert.deepEqual(v21Errors({ classLevel: 6, skills: [ok] }), []);
});
