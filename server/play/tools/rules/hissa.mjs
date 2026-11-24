// Play coverage rules for the hissa family (round 7: multiplying and dividing fractions and decimals, class 7; never timed).
// Authored: folding a unit sheet into b strips and shading a, then into d strips and taking c of the shaded part, IS a/b of
// c/d (the overlap is the product, and tagging it by counting pieces taken twice over pieces in the whole IS the rule a·c
// over b·d); laying w rope pieces of a/b m end to end and tagging the rope IS a whole number times a fraction; pouring full
// cups of c/d from a jug until it cannot fill one, then tagging the part-cup as a fraction OF A CUP, IS dividing by a fraction
// (how many fit) and, with decimal jugs and glasses, dividing by a decimal; shading a/10 across and c/10 down a grid of tenths
// and placing the point on the overlap's count IS multiplying decimals (tenths × tenths are hundredths); sliding the digits
// past a fixed point IS × / ÷ 10, 100, 1000 (and × 0.1, 0.01); folding a bar for a first spend and folding WHAT IS LEFT for a
// second IS a fraction of a remainder; folding a recipe's amount into one share per person it was for and laying one share
// per person eating now IS scaling a quantity. Mal-rules map only to the topic's own kit misconceptions where the belief is
// the same one: a shared denominator kept is "keep-denominator"; the whole number multiplying top and bottom is "whole-both";
// a unit piece's product taken as bigger (3 × 1/4 → 12) is "mult-bigger"; the cups counted as jug × cup is "div-smaller"
// (ch08 and ch12); ÷ done as × is "no-flip"; the first fraction flipped is "flip-first"; ÷ 0.5 as halving is "div-half"; only
// the glass scaled by 10 is "scale-one"; one decimal place kept is "point-03"; × 10 as a zero written at the end is
// "times10-zero"; the second fraction taken of the whole is "fraction-of-original"; the shares folded for the new people and
// laid for the old is "scale-flip".
// Not admitted (no honest mechanic here): c7-maths-ch08-t01-s3 (predicting bigger / smaller before multiplying: the sheet
// shows the size, there is no prediction to commit without a choice), c7-maths-ch08-t03-s3 (checking size and units),
// c7-maths-ch12-t01-s3 (estimating products in money and measurement), c7-maths-ch12-t02-s1 (a decimal ÷ a whole number:
// sharing, which the jug's "how many fit" is not). Kit beliefs with no honest set-up here: last-op (the story's action is
// done, never chosen as an operation word), half-bigger (a product's size is not committed apart from the grid it shades).
import { R } from "./rule.mjs";

export const family = "hissa";
const H = "hissa";
export const RULES = [
  R("c7-maths-ch08-t01", H, "fold", "of", { "keep-den": "keep-denominator" }, { same: 0.5 }),
  R("c7-maths-ch08-t01", H, "fold", "times", { "whole-both": "whole-both", "mult-bigger": "mult-bigger" }, {}),
  R("c7-maths-ch08-t02", H, "pour", "fit", { "div-smaller": "div-smaller" }, { unit: 1 }),
  R("c7-maths-ch08-t02", H, "pour", "part", { "no-flip": "no-flip", "flip-first": "flip-first" }, {}),
  R("c7-maths-ch08-t03", H, "story", "rest", { "of-original": "fraction-of-original" }, {}),
  R("c7-maths-ch08-t03", H, "story", "scale", { "scale-flip": "scale-flip" }, {}),
  R("c7-maths-ch12-t01", H, "grid", "mul", { "point-one": "point-03" }, {}),
  R("c7-maths-ch12-t01", H, "grid", "shift", { "append-zero": "times10-zero" }, { moves: [1, 2, 3, -1, -2], form: "times" }),
  R("c7-maths-ch12-t02", H, "pour", "deci", { "div-half": "div-half", "div-smaller": "div-smaller", "scale-one": "scale-one" }, { glasses: [50, 25, 20, 40, 60, 75, 30, 15, 80] }),
  R("c7-maths-ch12-t02", H, "grid", "shift", {}, { moves: [-1, -2, -3], form: "div" }),
];

export const ACTS = {
  "c7-maths-ch08-t01|of": ["s2"],             // two fractions on a folded sheet, and the rule a·c / b·d by counting
  "c7-maths-ch08-t01|times": ["s1"],          // a whole number times a fraction (only the pieces multiply)
  "c7-maths-ch08-t02|fit": ["s1", "s3"],      // a whole ÷ a fraction by counting how many cups fit (and why it is more)
  "c7-maths-ch08-t02|part": ["s2"],           // any fraction ÷ a fraction (the part-cup is a fraction of the divisor)
  "c7-maths-ch08-t03|rest": ["s2"],           // a fraction of what remains (multi-step)
  "c7-maths-ch08-t03|scale": ["s1"],          // read the situation: scale a recipe the right way
  "c7-maths-ch12-t01|mul": ["s2"],            // decimal × decimal, the point placed by the hundredths
  "c7-maths-ch12-t01|shift": ["s1"],          // × 10, 100, 1000, 0.1, 0.01 on the place-value chart
  "c7-maths-ch12-t02|deci": ["s3"],           // ÷ a decimal: how many glasses fit
  "c7-maths-ch12-t02|shift": ["s2"],          // ÷ 10, 100, 1000 on the place-value chart
};
