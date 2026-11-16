// round 7 (dc-r7-teaching-scripts, T-schema): a lesson script is validated against its kit before the Director walks it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateTopicScript, calcHolds, rateAsFraction } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

// Learning's pilot script for c6 perimeter (claude/r7-learning 0b4a2e3a), the TopicScript shape of shared/contracts.ts
const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const good = () => JSON.parse(readFileSync(new URL("./fixtures/scripts/c6-maths-ch06-t01.json", import.meta.url), "utf8"));
const S2 = "c6-maths-ch06-t01-s2";

test("the c6 perimeter pilot script passes against its kit: every skill walkable", () => {
  const r = validateTopicScript(good(), K);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.ok, good().skills.map((s) => s.skillId));
});

test("director3's defects are refused by the validator, and only that skill stops being walkable", () => {
  const bad = (f) => { const s = good(); f(s.skills.find((k) => k.skillId === S2)); return validateTopicScript(s, K); };
  const errs = (f) => bad(f).errors.join(" | ");
  assert.match(errs((k) => { k.workedExample.steps = k.workedExample.steps.slice(0, 1); }), /at least two/, "one step is not a worked example");
  assert.match(errs((k) => { k.workedExample.answer = ""; }), /toh jawab/, "the answer is said");
  assert.match(errs((k) => { k.workedExample.problem = ""; }), /stated in full/, "the problem is stated");
  assert.match(errs((k) => { k.workedExample.steps[2].result = "2 × 42 = 48 cm"; }), /does not hold/);
  assert.match(errs((k) => { k.workedExample.answer = "48 cm"; }), /not the last step's result/);
  assert.match(errs((k) => { k.checks[0].prompt = "A playground 40 m by 25 m has perimeter 130 m. What is its perimeter?"; }), /inside its question/);
  assert.match(errs((k) => { k.checks[0].targets = "c6-maths-ch06-t01-m-nope"; }), /not a kit misconception/);
  assert.match(errs((k) => { k.ladder.push({ itemId: "c6-maths-ch06-t01-i99", why: "x" }); }), /not a kit item/);
  assert.match(errs((k) => { k.ladder[0].itemId = "c6-maths-ch06-t01-i09"; }), /is skill c6-maths-ch06-t01-s|not a practice kind/, "the ladder stays on the skill");
  assert.match(errs((k) => { k.remediation = k.remediation.filter((r) => r.targets !== "c6-maths-ch06-t01-m-l-plus-b"); }), /none for c6-maths-ch06-t01-m-l-plus-b/);
  assert.match(errs((k) => { k.remediation[0].move = "rectangle mein kitni sides hoti hain, gino"; }), /below class 6/, "remediation never counts sides at class 6");
  assert.match(errs((k) => { k.explain[0].convey = 'say "parimap matlab boundary ki poori lambai hoti hai"'; }), /quoted line/, "shapes, not lines");
  assert.match(errs((k) => { k.hook.convey = "Chalo, aaj hum parimap seekhenge!"; }), /a shape, not a sentence/);
  assert.match(errs((k) => { k.checks[1].prompt = "5 balls mein 2 runs = 2/5, toh fraction kya hai?"; }), /rate as a fraction/);
  const r = bad((k) => { k.workedExample.steps = k.workedExample.steps.slice(0, 1); });
  assert.ok(!r.ok.includes(S2) && r.ok.length === good().skills.length - 1, "the other skills stay walkable");
});

test("calculations and the rate predicate", () => {
  assert.equal(calcHolds("2 × (50 + 30) = 2 × 80 = 160 m"), true);
  assert.equal(calcHolds("3 × 160 = 460"), false);
  assert.equal(calcHolds("3 rounds = 3 × 160 m"), null, "a label is not a term");
  assert.equal(calcHolds("3 rounds = 3 × 160 = 460 m"), false);
  assert.equal(calcHolds("one round is the perimeter"), null);
  assert.equal(rateAsFraction("5 balls mein 2 runs = 2/5"), true);
  assert.equal(rateAsFraction("5 barabar hisson mein se 2 = 2/5"), false);
});

test("a scripted beat's board rides on the board ask explicitly (Studio reads intent.boardRef; scriptBeat for tracing)", async () => {
  const { whiteboardIntentOf } = await import("../server/brain/propose.js");
  const board = { template: "measured@1", shape: "rect", w: 50, h: 30, unit: "m", trace: true };
  const next = { turn: 3, ctx: { classLevel: 6, lang: "hinglish" }, lastMove: { kind: "explain", skillId: "s", scriptBeat: { scriptId: "sc1", skillId: "s", beatId: "e1", kind: "explain", board } } };
  const ask = whiteboardIntentOf({ lessonId: "L", turn: 3, beat: { id: "e", type: "explain" }, next, kit: { skills: [{ id: "s" }] }, item: null, line: { text: "" } });
  assert.deepEqual(ask.intent.boardRef, board);
  assert.deepEqual(ask.intent.scriptBeat, { scriptId: "sc1", beatId: "e1", kind: "explain" });
  const plain = whiteboardIntentOf({ lessonId: "L", turn: 3, beat: { id: "e", type: "explain" }, next: { ...next, lastMove: { kind: "explain" } }, kit: { skills: [{ id: "s" }] }, item: null, line: { text: "" } });
  assert.equal(plain.intent.boardRef, undefined);
});
