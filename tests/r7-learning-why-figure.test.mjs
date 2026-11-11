// Round 7 F director11 D2 (+ Studio cb7108d7 templates): a lesson-script card's why names only the figure its closing board
// draws, and an ask's answerBoard draws the posed figure. Pure: check.mjs's whyFigureErrors / figureOf / RANGE.
import { test } from "node:test";
import assert from "node:assert/strict";
import { whyFigureErrors, promptFigureErrors, figureOf, RANGE } from "../scripts/lesson-scripts/check.mjs";

const why = (en) => ({ hi: "", en });

test("a why naming a line, a bar or a round whole must match the board it closes over", () => {
  assert.equal(whyFigureErrors(why("1/4 sits on the number line"), { template: "wholes@1", params: { wholes: [{ parts: 4 }] } }).length, 1);
  assert.equal(whyFigureErrors(why("the strip has 3 equal parts"), { template: "wholes@1", params: { wholes: [{ parts: 3 }] } }).length, 1);
  assert.equal(whyFigureErrors(why("a 1/6 slice of the cake"), { template: "fraction-line@1", params: { dens: [3, 6] } }).length, 1);
  assert.deepEqual(whyFigureErrors(why("a 1/6 slice of the 6-slice cake"), { template: "wholes@1", params: { wholes: [{ parts: 6 }, { parts: 3 }] } }), []);
  assert.deepEqual(whyFigureErrors(why("the same chocolate bar in 3 parts"), { template: "fraction-bars@1", params: { bars: [{ parts: 3 }] } }), []);
});

test("'not equal' needs a board that draws unequal parts; two unequal parts now draw", () => {
  const eq = { template: "wholes@1", params: { wholes: [{ parts: 2 }] } };
  const uneq = { template: "wholes@1", params: { wholes: [{ parts: 2, equal: false }, { parts: 2 }] } };
  assert.equal(whyFigureErrors(why("the two pieces are not equal"), eq).length, 1);
  assert.deepEqual(whyFigureErrors(why("the two pieces are not equal"), uneq), []);
});

test("unequal groups: `sizes` draws them, the why's sizes must be the drawn sizes, and the figure is the heap's total", () => {
  const b = { template: "equal-groups@1", params: { sizes: [7, 3, 3, 3] } };
  assert.ok(RANGE["equal-groups@1"](b.params));
  assert.ok(!RANGE["equal-groups@1"]({ sizes: [7] }), "at least 2 groups");
  assert.ok(!RANGE["equal-groups@1"]({ sizes: [11, 3] }), "groups of 1-10");
  assert.deepEqual(whyFigureErrors(why("groups 7, 3, 3, 3 are not equal; quarters of 16 would be 4 each"), b), []);
  assert.equal(whyFigureErrors(why("groups 6, 3, 3 are not equal"), b).length, 1, "the why lists other groups than the board draws");
  assert.equal(whyFigureErrors(why("groups 7, 3, 3, 3 are not equal"), { template: "equal-groups@1", params: { groups: 4, each: 4 } }).length, 2);
  assert.equal(figureOf(b), figureOf({ template: "shade-grid@1", params: { rows: 2, cols: 8 } }), "the same 16 things");
});

test("director12 D6: bars and a number line of the same denominators are different figures", () => {
  const bars = { template: "fraction-bars@1", params: { bars: [{ parts: 4 }, { parts: 8 }] } };
  const line = { template: "fraction-line@1", params: { dens: [4, 8], from: 0, to: 1 } };
  assert.notEqual(figureOf(bars), figureOf(line));
  assert.equal(figureOf(line), figureOf({ template: "fraction-line@1", params: { dens: [8, 4], from: 0, to: 1, marks: [[1, 4]] } }), "marks are the answer, not the figure");
});

test("director12 D6: a prompt names the figure it is posed on (patti → bars, rekha → line, ringed → a drawn mark)", () => {
  const p = (en, hi = "") => ({ en, hi });
  const line = { template: "fraction-line@1", params: { dens: [4, 8], from: 0, to: 1 } };
  const bars = { template: "fraction-bars@1", params: { bars: [{ parts: 4 }, { parts: 8 }] } };
  assert.equal(promptFigureErrors(p("", "Isi patti ko 8 barabar hisson mein kaato"), line).length, 1);
  assert.deepEqual(promptFigureErrors(p("", "Isi patti ko 8 barabar hisson mein kaato"), bars), []);
  assert.equal(promptFigureErrors(p("Think on this same number line"), bars).length, 1);
  assert.equal(promptFigureErrors(p("The first mark after 0 is circled."), { template: "fraction-line@1", params: { den: 4 } }).length, 1);
  assert.deepEqual(promptFigureErrors(p("The first mark after 0 is circled."), { template: "fraction-line@1", params: { den: 4, mark: 1 } }), []);
  assert.deepEqual(promptFigureErrors(p("Two temple bells ring together every 30 minutes"), { template: "compare@1", params: {} }), [], "a bell rings; nothing is ringed");
});
