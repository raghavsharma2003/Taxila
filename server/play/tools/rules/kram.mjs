// Play coverage rules for the kram family (round 7: growing patterns and number sequences, classes 4-7; never timed).
// Authored: setting a step machine (+ − × ÷ and a number) that must walk a list from its first number through every given
// step, then fill the blanks, IS finding and using a pattern's rule (going up, going down, doubling, halving, a calendar
// column); laying tiles on a copy of the last stage until it is the next stage IS continuing a shape pattern by what changes
// (and, for dot squares and staircases, drawing the square / triangular numbers and the L or row each step adds); filling a
// bag with exactly the pieces a far stage needs, which the run then grows stage by stage, IS predicting a far term from the
// rule (stick houses and rows, dot squares, points joined in pairs, the snowflake's sides); setting a rule machine "a × n + b"
// fed the stage number so it makes every stage IS writing the nth-term rule; laying every rhythm of n beats (a rhythm one
// shelf up with S in front, two shelves up with L in front) IS the Virahanka recursion, and a bag for the rhythms of a far
// beat count IS generating the sequence; picking the L-pieces (or the two staircases) that fill a square frame IS the
// relation "consecutive odd numbers from 1 add to a square" ("two consecutive triangular numbers make a square").
// Mal-rules map only to the topic's own kit misconceptions where the belief is the same one: a going-down list continued
// upward is "only-increase"; the first step read alone is "first-step-only"; + 1 down a calendar column is
// "calendar-plus-one"; the last stage run unchanged is "guess-next" (its sign: copies the last shape); N × stage 1 is
// "whole-object" (c5) / "proportional" (c7); N × the step is "forget-start"; a row and a column without their corner is
// "corner"; a row only (k rows of k + 1 as the next square) is "any-arrangement"; every line counted from both ends, or the
// last step added again, is "line-jump"; the snowflake's sides grown by adding is "sides-plus"; the change written as the
// rule (n + d) is "recursive-only"; a × n with b = 0 from stage 1 is "proportional"; SL and LS as one rhythm is
// "order-ignored"; the rhythm count going up by one (or doubling) is "add-one"; a run of odd pieces not from 1 is
// "skip-start".
// Not admitted (no honest mechanic here): c4-maths-ch03-t02 changing-step lists (1, 2, 4, 7, 11; the step machine has one
// fixed step), c6-maths-ch01-t02-s3 and c6-maths-ch01-t03-s3 (a picture as an argument / testing new cases: a judgement of
// reasoning, not a build), c7-maths-ch04-t03-s3 (algebra explaining why a calendar pattern always works), and
// c7-maths-ch01-t03 (patterns in products: its kit beliefs are zero-counting in round products, which is guna's field of
// round sides; no sequence mechanic tests it honestly). Kit beliefs with no honest set-up here: decoration, three-cases,
// odd-sum-odd, unrelated, cant-generalise, europe-first.
import { R } from "./rule.mjs";

export const family = "kram";
const K = "kram";
export const RULES = [
  R("c4-maths-ch03-t02", K, "machine", "step", { "only-increase": "only-increase", "first-step": "first-step-only", "plus-one": "calendar-plus-one" }, { kinds: ["add", "sub", "mul", "div", "cal"] }),
  R("c5-maths-ch07-t02", K, "grow", "next", { copy: "guess-next" }, { seqs: ["ell", "plus", "stair", "oblong"], n: [4, 6] }),
  R("c5-maths-ch07-t02", K, "grow", "far", { "times-first": "whole-object", "step-only": "forget-start" }, { seqs: ["houses", "sqrow", "trirow"], far: [6, 12] }),
  R("c5-maths-ch07-t02", K, "machine", "step", {}, { kinds: ["fig"] }),
  R("c6-maths-ch01-t02", K, "grow", "next", { corner: "corner", "rows-only": "any-arrangement" }, { seqs: ["square", "square", "stair"], n: [4, 6] }),
  R("c6-maths-ch01-t03", K, "nest", "odd", { "skip-start": "skip-start" }, { n: [3, 6] }),
  R("c6-maths-ch01-t03", K, "nest", "pair", {}, { n: [3, 7] }),
  R("c6-maths-ch01-t04", K, "grow", "far", { double: "line-jump", "same-step": "line-jump", "sides-plus": "sides-plus" }, { seqs: ["lines", "koch"], far: [7, 12] }),
  R("c7-maths-ch04-t03", K, "machine", "rule", { recursive: "recursive-only", proportional: "proportional" }, { far: [10, 100] }),
  R("c7-maths-ch04-t03", K, "grow", "far", { "times-first": "proportional" }, { seqs: ["houses", "sqrow", "trirow"], far: [20, 50] }),
  R("c7-maths-ch06-t03", K, "beats", "lay", { "order-ignored": "order-ignored" }, { n: [4, 5] }),
  R("c7-maths-ch06-t03", K, "beats", "count", { "add-one": "add-one", doubling: "add-one" }, { far: [6, 10] }),
];

export const ACTS = {
  "c4-maths-ch03-t02|step": ["s1", "s2", "s3"],    // add the same each time; going down, doubling, halving; the rule used on a calendar
  "c5-maths-ch07-t02|next": ["s1"],                // continue a shape pattern by what changes each step
  "c5-maths-ch07-t02|far": ["s3"],                 // use the rule to predict a far stage (the 10th house)
  "c5-maths-ch07-t02|step": ["s2"],                // the rule of a growing pattern ("add 4 each time")
  "c6-maths-ch01-t02|next": ["s1", "s2"],          // dot squares and triangles; how the picture grows a step
  "c6-maths-ch01-t03|odd": ["s1"],                 // consecutive odd numbers from 1 make the squares
  "c6-maths-ch01-t03|pair": ["s2"],                // two consecutive triangular numbers make a square
  "c6-maths-ch01-t04|far": ["s2", "s3"],           // lines joining every pair of points; the snowflake's count from its picture
  "c7-maths-ch04-t03|rule": ["s1"],                // a growing pattern's algebraic rule
  "c7-maths-ch04-t03|far": ["s2"],                 // a rule used for far terms
  "c7-maths-ch06-t03|lay": ["s1", "s3"],           // count the rhythms; each shelf from the two before (S in front, L in front)
  "c7-maths-ch06-t03|count": ["s2"],               // the counts 1, 2, 3, 5, 8 … each the sum of the two before
};
