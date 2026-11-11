// Play coverage rules for the kon family (round 4 G1, E1 angles: angles as an amount of turning; S0.3 split format).
// Authored: turning the ship's nose IS the idea of a turn (c5) and opening an arm against a two-scale protractor IS reading
// the right scale and drawing a given angle (c6). The builder checks every id against the kits.
import { R } from "./rule.mjs";

export const family = "kon";
export const RULES = [
  R("c5-maths-ch03-t01", "kon", "turn", "turn", { "cw-confuse": "cw-confuse", "half-is-quarter": "half-is-quarter" }, { q: [1, 2, 3], tol: 12 }),
  // r8 (docs/design/round8/games-engine-needs.md §1): the protractor is no longer laid on the angle for her. She PLACES a
  // loose one (centre on the corner, base on an arm) and then reads it (measure) or marks and joins (draw); a reading off a
  // misplaced protractor is the placement mix-up, never right. size: the same angle under a big and a small protractor.
  // (replaces the kon/set entry, which only ever showed wrong-scale on a protractor already in place)
  R("c6-maths-ch02-t03", "kon", "place", "draw", { "vertex-off": "vertex-off", "wrong-scale": "wrong-scale", "join-wrong-end": "join-wrong-end" }, { tol: 3, tolPx: 11 }),
  R("c6-maths-ch02-t03", "kon", "place", "measure", { "vertex-off": "vertex-off", "wrong-scale": "wrong-scale" }, { tol: 3, tolPx: 11 }),
  R("c6-maths-ch02-t03", "kon", "place", "size", {}, { tol: 3 }),   // no mix-up named: tool-size is about one angle's READING under two tools (main 2026-11-11)
  // r7 (studio-play-coverage-expansion): the kind of an angle is how far the arm opens from a base that may tilt and may
  // open either way (a tilted square corner is still a right angle); arm length and arc size never change an angle; a linear
  // pair is read off the other side of the line; a triangle closes only when its angles make 180°
  R("c4-maths-ch01-t02", "kon", "zone", "kind", { orientation: "tilted-not-right" }, { kinds: ["acute", "right", "obtuse"], tol: 5 }),
  R("c4-maths-ch01-t02", "kon", "zone", "match", {}, { tol: 6 }),
  R("c5-maths-ch03-t02", "kon", "zone", "kind", { orientation: "prototype-right" }, { kinds: ["acute", "right", "obtuse"], tol: 4 }),
  R("c6-maths-ch02-t04", "kon", "zone", "kind", { orientation: "orientation", "reflex-missing": "reflex-missing" }, { kinds: ["acute", "right", "obtuse", "straight", "reflex"], tol: 4 }),
  R("c6-maths-ch02-t02", "kon", "zone", "match", {}, { tol: 5 }),
  // r8 (docs/design/round8/games-engine-needs.md §2): an angle's name is its vertex in the middle and a point on each arm
  // either side; the law lights whatever angle the three letters really name, so a vertex-first name lights another corner
  R("c6-maths-ch02-t02", "kon", "name", "say", { "vertex-name": "vertex-name" }, {}),
  R("c6-maths-ch02-t02", "kon", "name", "find", { "vertex-name": "vertex-name" }, {}),
  R("c7-maths-ch05-t01", "kon", "pair", "linear", { "linear-90": "linear-90" }, { tol: 3 }),
  R("c7-maths-ch07-t03", "kon", "close", "tri", {}, { tol: 3 }),
  R("c7-maths-ch09-t03", "kon", "close", "iso", { "wrong-pair": "wrong-pair" }, { tol: 3 }),
  // r7 kon2: lines are directions. Parallel is turning line 2 until it never meets line 1, however far the run extends them
  // (lines that miss each other on the page may still meet); perpendicular is a set-square's corner fitting the crossing
  // whatever the tilt; a transversal's corresponding / alternate angles equal ∠1 exactly when the canals run parallel (the
  // same-side interior angle makes 180°); a segment, a ray and a line are told apart by where their stops sit
  R("c7-maths-ch05-t02", "kon", "lines", "parallel", { "not-meet-on-page": "not-meet-on-page" }, { tol: 2 }),
  R("c7-maths-ch05-t02", "kon", "lines", "perp", { "perp-upright": "perp-upright" }, { tol: 3 }),
  R("c7-maths-ch05-t03", "kon", "cross", "corr", { "corr-position": "alternate-position" }, { tol: 3 }),
  R("c7-maths-ch05-t03", "kon", "cross", "alt", { "same-side-equal": "interior-equal", "alt-same-side": "alternate-position" }, { tol: 3 }),
  R("c6-maths-ch02-t01", "kon", "ends", "ends", { "ray-two-ends": "ray-two-ends", "ray-order": "ray-order", "line-ends": "longer-line" }, { figs: ["seg", "ray", "ray", "line"] }),
];

export const ACTS = {
  "c5-maths-ch03-t01|turn": ["s1", "s2"],               // quarter / half / three-quarter turns, clockwise or anticlockwise
  "c6-maths-ch02-t03|draw": ["s3", "s2", "s1"],         // draw a given angle: place it, mark on the scale from 0 on the arm, join to O
  "c6-maths-ch02-t03|measure": ["s2", "s1"],            // read the scale that starts at 0 on the arm, off a protractor she placed
  "c6-maths-ch02-t03|size": ["s2"],                     // degrees are turns: a bigger protractor does not read more
  "c4-maths-ch01-t02|kind": ["s2", "s1"],               // less than / equal to / more than a right angle; the square corner
  "c4-maths-ch01-t02|match": ["s2"],                    // equal angles whatever the length of the arms
  "c5-maths-ch03-t02|kind": ["s2", "s1", "s3"],         // acute / right / obtuse in any direction
  "c6-maths-ch02-t04|kind": ["s1", "s2"],               // acute, right, obtuse; straight and reflex
  "c6-maths-ch02-t02|match": ["s3", "s2"],              // compare by laying one on the other, ignoring arm length
  "c6-maths-ch02-t02|say": ["s1"],                      // vertex and arms; name it with the vertex in the middle
  "c6-maths-ch02-t02|find": ["s1"],                     // the angle a three-letter name denotes
  "c7-maths-ch05-t01|linear": ["s1"],                   // a linear pair adds to 180°
  "c7-maths-ch07-t03|tri": ["s2"],                      // the missing angle from the angle sum
  "c7-maths-ch09-t03|iso": ["s1", "s2"],                // base angles equal; missing angles in an isosceles triangle
  "c7-maths-ch05-t02|parallel": ["s1", "s3"],          // parallel: same direction, never meet; draw one on squared paper
  "c7-maths-ch05-t02|perp": ["s2", "s3"],              // perpendicular: a right angle at the crossing, at any tilt
  "c7-maths-ch05-t03|corr": ["s2", "s1", "s3"],        // corresponding angles equal when parallel (and the one beside it)
  "c7-maths-ch05-t03|alt": ["s2", "s1", "s3"],         // alternate equal, same-side interior 180°, as a test for parallel
  "c6-maths-ch02-t01|ends": ["s1", "s2"],              // segment / ray / line by endpoints; ray AB starts at A
};
