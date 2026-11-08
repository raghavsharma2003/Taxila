// Round 7 F director11 D2 (+ Studio cb7108d7 templates): a lesson-script card's why names only the figure its closing board
// draws, and an ask's answerBoard draws the posed figure. Pure: check.mjs's whyFigureErrors / figureOf / RANGE.
import { test } from "node:test";
import assert from "node:assert/strict";
import { whyFigureErrors, figureOf, RANGE } from "../scripts/lesson-scripts/check.mjs";

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
