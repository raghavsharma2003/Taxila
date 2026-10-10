// Play coverage rules for the kon family (round 4 G1, E1 angles: angles as an amount of turning; S0.3 split format).
// Authored: turning the ship's nose IS the idea of a turn (c5) and opening an arm against a two-scale protractor IS reading
// the right scale and drawing a given angle (c6). The builder checks every id against the kits.
import { R } from "./rule.mjs";

export const family = "kon";
export const RULES = [
  R("c5-maths-ch03-t01", "kon", "turn", "turn", { "cw-confuse": "cw-confuse", "half-is-quarter": "half-is-quarter" }, { q: [1, 2, 3], tol: 12 }),
  R("c6-maths-ch02-t03", "kon", "set", "set", { "wrong-scale": "wrong-scale" }, { tol: 3 }),
];

export const ACTS = {
  "c5-maths-ch03-t01|turn": ["s1", "s2"],               // quarter / half / three-quarter turns, clockwise or anticlockwise
  "c6-maths-ch02-t03|set": ["s3", "s2"],                // draw a given angle; read the scale that starts at 0 on the arm
};
