// Play coverage rules for the kon family (round 4 G1, E1 angles: angles as an amount of turning; S0.3 split format).
// Authored: turning the ship's nose IS the idea of a turn (c5) and opening an arm against a two-scale protractor IS reading
// the right scale and drawing a given angle (c6). The builder checks every id against the kits.
import { R } from "./rule.mjs";

export const family = "kon";
export const RULES = [
  R("c5-maths-ch03-t01", "kon", "turn", "turn", { "cw-confuse": "cw-confuse", "half-is-quarter": "half-is-quarter" }, { q: [1, 2, 3], tol: 12 }),
  R("c6-maths-ch02-t03", "kon", "set", "set", { "wrong-scale": "wrong-scale" }, { tol: 3 }),
  // r7 (studio-play-coverage-expansion): the kind of an angle is how far the arm opens from a base that may tilt and may
  // open either way (a tilted square corner is still a right angle); arm length and arc size never change an angle; a linear
  // pair is read off the other side of the line; a triangle closes only when its angles make 180°
  R("c4-maths-ch01-t02", "kon", "zone", "kind", { orientation: "tilted-not-right" }, { kinds: ["acute", "right", "obtuse"], tol: 5 }),
  R("c4-maths-ch01-t02", "kon", "zone", "match", {}, { tol: 6 }),
  R("c5-maths-ch03-t02", "kon", "zone", "kind", { orientation: "prototype-right" }, { kinds: ["acute", "right", "obtuse"], tol: 4 }),
  R("c6-maths-ch02-t04", "kon", "zone", "kind", { orientation: "orientation", "reflex-missing": "reflex-missing" }, { kinds: ["acute", "right", "obtuse", "straight", "reflex"], tol: 4 }),
  R("c6-maths-ch02-t02", "kon", "zone", "match", {}, { tol: 5 }),
  R("c7-maths-ch05-t01", "kon", "pair", "linear", { "linear-90": "linear-90" }, { tol: 3 }),
  R("c7-maths-ch07-t03", "kon", "close", "tri", {}, { tol: 3 }),
  R("c7-maths-ch09-t03", "kon", "close", "iso", { "wrong-pair": "wrong-pair" }, { tol: 3 }),
];

export const ACTS = {
  "c5-maths-ch03-t01|turn": ["s1", "s2"],               // quarter / half / three-quarter turns, clockwise or anticlockwise
  "c6-maths-ch02-t03|set": ["s3", "s2"],                // draw a given angle; read the scale that starts at 0 on the arm
  "c4-maths-ch01-t02|kind": ["s2", "s1"],               // less than / equal to / more than a right angle; the square corner
  "c4-maths-ch01-t02|match": ["s2"],                    // equal angles whatever the length of the arms
  "c5-maths-ch03-t02|kind": ["s2", "s1", "s3"],         // acute / right / obtuse in any direction
  "c6-maths-ch02-t04|kind": ["s1", "s2"],               // acute, right, obtuse; straight and reflex
  "c6-maths-ch02-t02|match": ["s3", "s2"],              // compare by laying one on the other, ignoring arm length
  "c7-maths-ch05-t01|linear": ["s1"],                   // a linear pair adds to 180°
  "c7-maths-ch07-t03|tri": ["s2"],                      // the missing angle from the angle sum
  "c7-maths-ch09-t03|iso": ["s1", "s2"],                // base angles equal; missing angles in an isosceles triangle
};
