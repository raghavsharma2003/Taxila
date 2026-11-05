// Play coverage rules for the darpan family (round 7: symmetry). Authored: laying mirror lines through a figure and folding
// it over each, until the lines laid are exactly the ones where it lands on itself, IS testing a line of symmetry by folding
// and finding ALL of a figure's lines (the count matters: a rectangle's corner-to-corner lines and a rhombus's side-middle
// lines are there to be tried); turning a figure on a turntable over its own trace to the smallest part turn where it lands
// on itself IS finding the smallest turn of turn symmetry (in fractions of a turn at class 5, in degrees at class 6);
// marking every stop of one full turn where it lands IS counting how many times it looks the same (the order).
// Mal-rules map only to the topic's own kit misconception where the belief is the same one:
//   exactly-one → "every shape has exactly one line" (c4); vertical-only → "only looks for vertical lines" (c6);
//   diagonals → "the corner-to-corner lines of a rectangle are lines of symmetry" (c4, c6); equal-halves → "any line that
//   cuts it into two equal halves is a line of symmetry" (c4, c6); quarter-default → "every symmetric shape matches after a
//   quarter turn" (c5); full-turn → "counts the full turn / the start, so every shape has it" (c5, c6); mirror-only → "only
//   shapes with a mirror line are symmetrical" (c5) and "no line symmetry, so no rotational symmetry" (c6: a figure with no
//   mirror line, all of its stops left unmarked); angle-order → "mixes up the angle with the order" (c6, degree dial).
//   The builder checks every id against the kits.
// Not covered (no honest law here, or another family has it): c4-maths-ch11-t01 none beyond s1-s3 (all three served:
// rangoli, kite and tile designs are the s3 designs; letters are not drawn); c6-maths-ch09-t01 s3 (completing a figure:
// nazariya/mirror); c5-maths-ch10-t01 s3 and c6-maths-ch09-t02 s3 (telling turn symmetry from mirror symmetry as a judgement
// on its own); c7-maths-ch14-t02 tilings (angles at a point: no symmetry law).
import { R } from "./rule.mjs";

export const family = "darpan";
const D = "darpan";
const FIGS = ["rect", "rhombus", "kite", "tri", "square", "pentagon", "hexagon", "octagon", "star"];
export const RULES = [
  R("c4-maths-ch11-t01", D, "mirror", "lines", { "exactly-one": "exactly-one", diagonals: "diagonal-rectangle", "equal-halves": "equal-halves-is-symmetry" }, { figs: FIGS, upright: 0.3 }),
  R("c5-maths-ch10-t01", D, "turn", "smallest", { "quarter-default": "quarter-default", "full-turn": "full-turn-counts" }, { ns: [2, 3, 4, 6, 8], chiral: 0.4 }),
  R("c5-maths-ch10-t01", D, "turn", "order", { "quarter-default": "quarter-default", "full-turn": "full-turn-counts", "mirror-only": "mirror-only" }, { ns: [2, 3, 4, 6, 8], chiral: 0.5 }),
  R("c6-maths-ch09-t01", D, "mirror", "lines", { "vertical-only": "vertical-only", diagonals: "rect-diagonals", "equal-halves": "halves-equal" }, { figs: FIGS, upright: 0.45 }),
  R("c6-maths-ch09-t02", D, "turn", "smallest", { "angle-order": "angle-order", "full-turn": "full-turn" }, { ns: [2, 3, 4, 5, 6, 8], chiral: 0.4, fine: true }),
  R("c6-maths-ch09-t02", D, "turn", "order", { "full-turn": "full-turn", "mirror-only": "needs-line" }, { ns: [2, 3, 4, 5, 6, 8], chiral: 0.6, fine: true }),
];

export const ACTS = {
  "c4-maths-ch11-t01|lines": ["s2", "s1", "s3"],   // find all the lines; test a line by folding; lines in Indian designs
  "c5-maths-ch10-t01|smallest": ["s2"],            // the smallest turn that looks the same
  "c5-maths-ch10-t01|order": ["s2", "s1"],         // how many times in a full turn; checking each part turn
  "c6-maths-ch09-t01|lines": ["s2", "s1"],         // find all lines of symmetry; decide a line by a fold
  "c6-maths-ch09-t02|smallest": ["s2"],            // the angle of rotational symmetry
  "c6-maths-ch09-t02|order": ["s2", "s1"],         // the order; does it look the same after a part turn
};
