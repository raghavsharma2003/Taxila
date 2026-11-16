// dc-r7-script-walk-v2 (main's director4 judgement): script schema v2. F1 every spoken / shown field has a Hinglish form;
// F2 every explain beat ends in a keyed micro-question; F3 the worked example's last step is the child's, keyed; F4 interest
// slots are a closed interest with a spoken situation set in it. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateTopicScript, saidIn } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const good = () => JSON.parse(readFileSync(new URL("./fixtures/scripts/c6-s1-v2.json", import.meta.url), "utf8"));

test("the v2 c6 skill-1 fixture validates", () => {
  assert.deepEqual(validateTopicScript(good(), K), { ok: ["c6-maths-ch06-t01-s1"], errors: [] });
});

test("F1-F4 defects are refused", () => {
  const errs = (f) => { const s = good(); f(s.skills[0]); return validateTopicScript(s, K).errors.join(" | "); };
  assert.match(errs((k) => { k.workedExample.givens[0] = "a closed five-sided shape"; }), /F1/, "an English-only spoken field");
  assert.match(errs((k) => { k.workedExample.problem.hi = k.workedExample.problem.en; }), /reads as English/, "the hi form is English");
  assert.match(errs((k) => { delete k.explain[0].ask; }), /keyed question/, "F2: an explain beat with no question");
  assert.match(errs((k) => { k.explain[1].ask.prompt.hi = "Kinara 14 cm hai, toh kitna?"; }), /inside its question/);
  assert.match(errs((k) => { k.explain[0].mustSay = []; }), /mustSay/);
  assert.match(errs((k) => { delete k.workedExample.yourStep; }), /yourStep/, "F3: the child's step");
  assert.match(errs((k) => { k.workedExample.steps[0].why = null; }), /steps\[0\]\.why/);
  assert.match(errs((k) => { k.workedExample.answer = { hi: "25 m baad", en: "25 m of fencing" }; }), /child's step's key 20/);
  assert.match(errs((k) => { k.hook.interestSlots[0].interest = "politics"; }), /interestSlots\[0\]\.interest/, "F4: a closed interest");
  assert.match(errs((k) => { k.hook.interestSlots[0].use = { hi: "Ek bagiche ki baad", en: "A garden fence" }; }), /not set in cricket/);
  assert.match(errs((k) => { k.remediation[0].then = { prompt: k.remediation[0].then.prompt }; }), /then\.key/);
});

test("saidIn: the lesson language's form; never an English-only line in a Hinglish lesson", () => {
  assert.equal(saidIn({ hi: "parimap", en: "perimeter" }, "hinglish"), "parimap");
  assert.equal(saidIn({ hi: "parimap", en: "perimeter" }, "english"), "perimeter");
  assert.equal(saidIn("the flower bed is a closed five-sided shape", "hinglish"), null);
  assert.equal(saidIn("the flower bed is a closed five-sided shape", "english"), "the flower bed is a closed five-sided shape");
  assert.equal(saidIn("4 + 5 = 9 m", "hinglish"), "4 + 5 = 9 m");
});
