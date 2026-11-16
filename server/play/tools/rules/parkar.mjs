// Play coverage rules for the parkar family (round 7: ruler-and-compass constructions, classes 6-7; never timed). Authored:
// a spot exists only where tool marks cross, so swinging an arc of CA from A and of BC from B and pinning where they cross
// IS constructing a triangle from three sides (c7-ch07-t01 s2); opening the compass for the longest / shortest whole-cm
// third stick that still closes the frame, with the frame hinged on the run, IS the triangle inequality (s1) and the range
// of a third side (s3). Building with the protractor's ray and an arc (SAS), two rays (ASA), the set-square's right angle and
// the hypotenuse's arc (RHS) IS using the criteria that fix a triangle (c7-ch09-t02 s1, s2); an arc from B cutting the ray
// at A twice, where every triangle with those parts must be pinned, IS why SSA does not fix one (s3). Equal arcs from A and
// B crossing twice and joined IS the perpendicular bisector (c7-ch14-t01 s1); an arc from the vertex, equal arcs from its
// cut-spots, joined IS the angle bisector (s2); the compass's opening stepped once round its own arc IS 60° (s3). The tank
// on the road, as far from one house as from the other, found by equal arcs, their line and its crossing with the road, IS
// finding equidistant spots (c6-ch08-t03 s2) and using it on a real plan (s3). The set-square laid along the opposite side
// (extended when the foot falls outside) with its edge through A IS the altitude (c7-ch07-t02 s1, s2).
// Mal-rules map only to the topic's own kit misconceptions where the belief is the same one: the third stick exactly the
// sum (or difference) of the other two is "equal-sum"; any length taken (the compass's top or its smallest opening) is
// "any-three"; the SAS angle built at B, not between the sides, and only one of the two SSA triangles pinned, are "ssa"
// ("does not check where the angle is", "draws only one of the two possible triangles"); the opening changed between arcs
// that must be equal is "compass-change" (c7-ch14) / "unequal-arcs" (c6-ch08); A joined to BC's midpoint is
// "median-confusion"; the set-square along the page's edge is "vertical-height"; A joined to the end of BC nearest the foot
// (the side never extended) is "inside-only".
// Not admitted (no honest mechanic here yet): c7-maths-ch07-t02-s3 (an altitude as the height in a real object, the area),
// c6-maths-ch08-t03-s1 (a rectangle's diagonals equal and halving each other). Kit beliefs with no honest set-up here:
// check-one-pair (its set-up is the any-three one on every level), aaa (no construction takes angles alone to a size),
// order-mismatch (a written statement), protractor (the protractor is not on the tray in a construction), short-radius
// (arcs that do not cross leave nothing to pin, so it never reaches a run), midpoint-only, diag-right-angle. The sss swap
// (the lengths swung from the wrong ends) has no kit belief and is never claimed.
import { R } from "./rule.mjs";

export const family = "parkar";
const P = "parkar";
export const RULES = [
  R("c7-maths-ch07-t01", P, "build", "sss", {}, {}),
  R("c7-maths-ch07-t01", P, "build", "long", { "equal-sum": "equal-sum", "any-three": "any-three" }, {}),
  R("c7-maths-ch07-t01", P, "build", "short", { "equal-sum": "equal-sum", "any-three": "any-three" }, {}),
  R("c7-maths-ch09-t02", P, "build", "sas", { "wrong-vertex": "ssa" }, {}),
  R("c7-maths-ch09-t02", P, "build", "asa", {}, {}),
  R("c7-maths-ch09-t02", P, "build", "rhs", {}, {}),
  R("c7-maths-ch09-t02", P, "build", "ssa", { ssa: "ssa" }, {}),
  R("c7-maths-ch14-t01", P, "bisect", "perp", { "compass-change": "compass-change" }, {}),
  R("c7-maths-ch14-t01", P, "bisect", "angle", { "compass-change": "compass-change" }, {}),
  R("c7-maths-ch14-t01", P, "bisect", "sixty", { "compass-change": "compass-change" }, {}),
  R("c6-maths-ch08-t03", P, "bisect", "equi", { "compass-change": "unequal-arcs" }, {}),
  R("c7-maths-ch07-t02", P, "drop", "alt", { median: "median-confusion", vertical: "vertical-height", "inside-only": "inside-only" }, {}),
];

export const ACTS = {
  "c7-maths-ch07-t01|sss": ["s2"],            // construct a triangle from three sides with ruler and compass
  "c7-maths-ch07-t01|long": ["s1", "s3"],     // the longest third side: less than the sum of the other two
  "c7-maths-ch07-t01|short": ["s1", "s3"],    // the shortest third side: more than their difference
  "c7-maths-ch09-t02|sas": ["s1"],            // SAS: the angle between the two sides
  "c7-maths-ch09-t02|asa": ["s2"],            // ASA: the side between the two angles
  "c7-maths-ch09-t02|rhs": ["s2"],            // RHS: the right angle, the hypotenuse, a side
  "c7-maths-ch09-t02|ssa": ["s3"],            // SSA: two triangles with the same parts
  "c7-maths-ch14-t01|perp": ["s1"],           // the perpendicular bisector
  "c7-maths-ch14-t01|angle": ["s2"],          // the angle bisector
  "c7-maths-ch14-t01|sixty": ["s3"],          // 60° with ruler and compass
  "c6-maths-ch08-t03|equi": ["s2", "s3"],     // equidistant spots by equal arcs; on a real plan (the road)
  "c7-maths-ch07-t02|alt": ["s1", "s2"],      // the perpendicular from a vertex to the opposite side or its extension
};
