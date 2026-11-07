// v6 checker (evals/hybrid-side-by-side/checks.mjs; main on director8: the code saw 1, 0, 0 of the judges' 10, 4, 45 firm
// contradictions). Each kind the screen checker did not model, pinned on director8's own rows where one shows it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { withheldStated, pictureMismatch, authoredWhys, borrowedWhy, verdictMisplaced, falseAnswerNumbers } from "../evals/hybrid-side-by-side/checks.mjs";

const D8 = (f) => JSON.parse(readFileSync(new URL(`../evals/hybrid-side-by-side/results/2026-11-06-director8/${f}`, import.meta.url), "utf8")).director;
const SCRIPT = (t) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${t}.json`, import.meta.url), "utf8"));

test("(a) a value the board shows as '?' that her line states (director8 c5-t02 steady T35: 1/3, 1/12, 1/6 over '?' items)", () => {
  const x = D8("steady-c5-ch02-t02.json")[34];
  assert.deepEqual(withheldStated(x.text, x.screen).sort(), ["1/12", "1/3", "1/6"]);
  // a "?" mark on a line in quarters, said as 1/4
  const line = { counts: { lines: [{ gaps: 4 }], marks: [{ at: "mark 1", label: "?" }] }, boardRef: { template: "fraction-line@1", params: { den: 4, from: 0, to: 1, mark: 1 } }, onScreen: { labels: "?" } };
  assert.deepEqual(withheldStated("Pehla nishaan 1/4 hai.", line), ["1/4"]);
  assert.deepEqual(withheldStated("Pehla nishaan kahan hai?", line), []);
  assert.deepEqual(withheldStated("1/4 hai.", { counts: { marks: [{ at: "1/4", label: "1/4" }] }, onScreen: { labels: "1/4" } }), [], "nothing hidden");
});

test("(b) a picture asked for, described as a thing the board does not draw (c4 stuck T19: a pizza over a word table)", () => {
  const x = D8("stuck-c4-ch05-t01.json")[18];
  assert.deepEqual(pictureMismatch(x.text, x.screen.boardRef), ["pizza"]);
  assert.deepEqual(pictureMismatch("Screen par ek circle hai, 4 barabar hisson mein.", { template: "fraction-parts@1", params: { parts: 4, whole: "circle" } }), []);
  assert.deepEqual(pictureMismatch("Pizza ke 4 slice the.", { template: "compare@1", params: {} }), [], "only a sentence that points at the screen");
});

test("(c) a close's why taken from a remediation (c6 offtopic T43 'wapas A par'); an authored why is not", () => {
  const whys = authoredWhys(SCRIPT("c6-maths-ch06-t01"));
  assert.equal(borrowedWhy("Pichhle sawaal ka jawab 30 m tha, kyunki jod tabhi poora hota hai jab tum wapas A par pahunchte ho.", whys).length, 1);
  const own = SCRIPT("c6-maths-ch06-t01").skills[0].workedExample.why.hi;
  assert.equal(borrowedWhy(`Toh poora jawab: 28 m, kyunki ${own}.`, whys).length, 0);
  assert.equal(borrowedWhy("Pichhle sawaal ka jawab 30 m tha.", whys).length, 0);
});

test("(d) a verdict with content said over a board other than the answered card's", () => {
  const a = { template: "measured@1", params: { shape: "rect", w: 9, h: 2 } }, b = { template: "measured@1", params: { shape: "triangle", sides: [7, 9, 12] } };
  assert.equal(verdictMisplaced({ graded: "correct", verdict: "Bilkul, 22 cm sahi hai: 9 plus 2 plus 9 plus 2.", firstBoard: b, answeredBoard: a }), true);
  assert.equal(verdictMisplaced({ graded: "correct", verdict: "Bilkul, 22 cm sahi hai.", firstBoard: a, answeredBoard: a }), false);
  assert.equal(verdictMisplaced({ graded: "correct", verdict: "Haan, sahi hai.", firstBoard: b, answeredBoard: a }), false, "a bare yes says nothing a board contradicts");
  assert.equal(verdictMisplaced({ graded: null, verdict: "x 5", firstBoard: b, answeredBoard: a }), false);
});

test("widened false keys: any number stated as an answer that no key, accept form, question or their words carry", () => {
  const keys = new Set(["2/3", "1/4", "3/4"]);
  assert.deepEqual(falseAnswerNumbers("Toh jawab 5/7 hoga.", { keys, given: "Ek roti ke 3 barabar tukde, 2 khaye." }), ["5/7"]);
  assert.deepEqual(falseAnswerNumbers("Isliye khaya hissa 2/3 hai.", { keys, given: "" }), []);
  assert.deepEqual(falseAnswerNumbers("Isliye 8 + 3 = 11 hua.", { keys, given: "8 m, 3 m" }), [], "a shown working is not a stated key");
  assert.deepEqual(falseAnswerNumbers("Roti ke 3 tukde hain.", { keys, given: "" }), [], "not an answer statement");
});

import { boardWords } from "../server/brain/board-words.js";
test("Studio's fraction-bars@1 and wholes@1 (Learning's c5-t02 worked board, c4 e2): code describes them, and the checker knows what they draw", () => {
  const bars = { template: "fraction-bars@1", params: { bars: [{ parts: 6, shade: 1, label: "1/6" }, { parts: 3, shade: 1, label: "1/3" }] } };
  const wholes = { template: "wholes@1", params: { wholes: [{ parts: 3, equal: false, title: "Cake A" }, { parts: 3, title: "Cake B" }] } };
  assert.equal(boardWords(bars, "hinglish"), "Screen par 2 ek jaisi pattiyan hain: ek 6 barabar hisson mein, 1 rangin aur ek 3 barabar hisson mein, 1 rangin.");
  assert.equal(boardWords(wholes, "hinglish"), "Screen par: Cake A ke 3 alag-alag tukde; Cake B ke 3 barabar tukde.");
  assert.deepEqual(pictureMismatch("Screen par dekho, do patti hain.", bars), []);
  assert.deepEqual(pictureMismatch("Screen par dekho, ek pizza hai.", bars), ["pizza"]);
});
