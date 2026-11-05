// Play coverage rules for the feeta family (round 7: length and distance, classes 4-5; never timed). Authored: cutting a
// ribbon as long as an object that lies from one mark to another of a (sometimes broken) ruler IS measuring with a ruler
// from its 0 mark (the spaces under the object, not the end number or the marks); cutting a rope ordered in m + cm off a
// tape marked in cm only IS converting with 1 m = 100 cm; putting lengths written in cm and in m on a rack shortest
// first, then rolling them out to one scale, IS comparing lengths in one unit; cutting a fence roll to go exactly round
// a garden (squares only, squares and some lengths, or some lengths only, the rest following from equal sides) IS the
// distance around a shape; setting a metre-only trip meter to a trip written in km + m IS converting with 1 km = 1000 m;
// racking routes written in km, m or km + m shortest first IS comparing distances in mixed units. Mal-rules map only to
// the topic's own kit misconceptions where the belief is the same one: the object's end number or the marks counted is
// "edge-start"; 1 m as 10 cm is "m-is-10cm"; bare numbers compared is "number-ignores-unit" / "ignore-units"; only the
// labelled sides added is "two-sides"; the squares inside is "area-confusion"; the squares along the edge is
// "border-squares"; 1 km as 100 m is "km-100m"; km and m joined side by side is "mixed-concat". Not admitted:
// c4-maths-ch06-t01-s3 (estimating a length and choosing cm or m), c5-maths-ch05-t01-s3 (choosing a unit) and
// c5-maths-ch05-t02-s3 (how much farther; the subtract-separately belief): no honest mechanic here yet. The
// c4 joined-units belief (2 m 8 cm as 28 cm) is the same set-up as 1 m = 10 cm on every rope, so it is never claimed.
import { R } from "./rule.mjs";

export const family = "feeta";
const F = "feeta";
export const RULES = [
  R("c4-maths-ch06-t01", F, "measure", "ribbon", { "end-number": "edge-start", "count-marks": "edge-start" }, {}),
  R("c4-maths-ch06-t01", F, "measure", "rope", { "m-is-10": "m-is-10cm" }, {}),
  R("c4-maths-ch06-t01", F, "compare", "order", { "ignore-units": "number-ignores-unit" }, { u: "m", forms: ["big", "small"] }),
  R("c4-maths-ch06-t02", F, "fence", "fence", { "labelled-only": "two-sides", area: "area-confusion", "border-squares": "border-squares" }, { shapes: ["rect", "square", "L"] }),
  R("c5-maths-ch05-t01", F, "trip", "odo", { "km-100": "km-100m", concat: "mixed-concat" }, {}),
  R("c5-maths-ch05-t02", F, "compare", "order", { "ignore-units": "ignore-units", concat: "mixed-concat" }, { u: "km", forms: ["big", "small", "mixed"] }),
];

export const ACTS = {
  "c4-maths-ch06-t01|ribbon": ["s1"],               // measure with a ruler from its 0 mark (count the spaces)
  "c4-maths-ch06-t01|rope": ["s2"],                 // m + cm into cm with 1 m = 100 cm
  "c4-maths-ch06-t01|order": ["s2"],                // cm against m: one unit first, then compare
  "c4-maths-ch06-t02|fence": ["s1", "s2", "s3"],    // every side added; equal sides of rectangles and squares; around, not inside
  "c5-maths-ch05-t01|odo": ["s1", "s2"],            // 1 km = 1000 m; km + m into m
  "c5-maths-ch05-t02|order": ["s1", "s2"],          // one unit before comparing; order three or four mixed distances
};
