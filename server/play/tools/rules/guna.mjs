// Play coverage rules for the guna family (round 7: multi-digit multiplication and division, classes 4-5; never timed).
// Authored: cutting a field a × b into place-value strips (34 = 30 + 4) IS splitting a factor into tens and ones; each piece's
// tiles (30 × 6 is 3 × 6 ten-tiles) ARE the partial products, and loading a truck that must weigh exactly a × b (nine
// crates to a rack, ten packed as one of the next place) IS adding the partial products with their regrouping; a field
// of round sides (60 × 50) or a factor of 10 / 100 IS multiplying by multiples of 10 and powers of 10; stretching a field's
// sides to their nearest round lengths and loading about that much IS estimating a product by rounding; sharing a godown's
// crates one round into every truck, opening a crate into ten of the next place when it cannot go round, IS dividing
// place by place with regrouping (the dock that is left IS the remainder, and it must be less than a share); setting out
// vehicles / packets / a jar that the story then runs IS deciding what a remainder means (round up, round down, the
// leftover itself). Mal-rules map only to the topic's own kit misconceptions where the belief is the same one: × 10 as + 10
// is "times-ten-adds-ten"; the tens digit brought down is "ones-only"; the digit products side by side is "no-carry" (c4)
// and the carried tens not added is "forget-carry" (c5); the tens digit's product without its zero is "shift-error"; only
// tens × tens and ones × ones is "place-by-place"; a zero lost when the basic fact ends in 0 is "zero-count"; each place
// shared on its own without opening a crate is "digitwise"; a round less than can be made (the leftover a share or more) is
// "remainder-too-big"; the leftover dropped where everyone must go is "remainder-ignored-in-story" (c4) / "always-drop"
// (c5); always one more is "always-up"; the packets' count put for the leftover is "quotient-always".
// Not admitted (no honest mechanic here): c4-maths-ch13-t02-s2 (repeated subtraction of big chunks: the godown shares by
// rounds, not chunks), c5-maths-ch06-t01-s3 (the written column method), c5-maths-ch06-t02-s2 (doubling and halving). Kit
// beliefs with no honest set-up here: drop-zero-quotient / zero-in-quotient (the trucks hold the crates, so a place is never
// dropped), remainder-as-decimal, ignore-remainder (the leftover stays on the dock), mult-makes-bigger, double-both.
import { R } from "./rule.mjs";

export const family = "guna";
const G = "guna";
export const RULES = [
  R("c4-maths-ch13-t01", G, "field", "area", { "ones-only": "ones-only", "no-carry": "no-carry", "adds-ten": "times-ten-adds-ten" }, { shapes: ["2x1", "2x10", "2xT", "3x1"] }),
  R("c4-maths-ch13-t02", G, "pack", "share", { digitwise: "digitwise" }, { sizes: [2, 3] }),
  R("c4-maths-ch13-t02", G, "story", "all", { drop: "remainder-ignored-in-story" }, { cap: [3, 9], q: [3, 30] }),
  R("c5-maths-ch06-t01", G, "field", "area", { "no-zero": "shift-error", diagonal: "place-by-place", "forget-carry": "forget-carry" }, { shapes: ["2xT", "2x2"] }),
  R("c5-maths-ch06-t02", G, "field", "area", { "zero-count": "zero-count" }, { shapes: ["RxR", "2xH", "2x10"] }),
  R("c5-maths-ch06-t02", G, "field", "round", { "zero-count": "zero-count" }, {}),
  R("c5-maths-ch09-t01", G, "pack", "share", { short: "remainder-too-big" }, { sizes: [3] }),
  R("c5-maths-ch09-t01", G, "story", "full", { short: "remainder-too-big" }, { cap: [12, 50], q: [3, 40] }),
  R("c5-maths-ch09-t02", G, "story", "all", { drop: "always-drop" }, { cap: [3, 12], q: [2, 20] }),
  R("c5-maths-ch09-t02", G, "story", "full", { up: "always-up" }, { cap: [3, 12], q: [2, 20] }),
  R("c5-maths-ch09-t02", G, "story", "left", { quotient: "quotient-always" }, { cap: [3, 12], q: [2, 20] }),
];

export const ACTS = {
  "c4-maths-ch13-t01|area": ["s1", "s2", "s3"],    // × 10 and tens; 2-digit × 1-digit split into tens and ones; 3-digit × 1-digit
  "c4-maths-ch13-t02|share": ["s1", "s3"],         // share the tens then the ones (regrouping); 3-digit ÷ 1-digit with leftovers
  "c4-maths-ch13-t02|all": ["s3"],                 // a leftover in a story that needs one more
  "c5-maths-ch06-t01|area": ["s1", "s2"],          // × multiples of 10; 2-digit × 2-digit by the area model
  "c5-maths-ch06-t02|area": ["s1"],                // × 10, 100 and round × round by place value
  "c5-maths-ch06-t02|round": ["s3"],               // estimate a product by rounding
  "c5-maths-ch09-t01|share": ["s1", "s3"],         // 3-digit ÷ 1-digit place by place; the remainder less than the divisor
  "c5-maths-ch09-t01|full": ["s2"],                // ÷ 2-digit numbers like 25 or 30 (full sacks and the rest)
  "c5-maths-ch09-t02|all": ["s1"],                 // round up when everyone must be included
  "c5-maths-ch09-t02|full": ["s2"],                // round down when only full groups count
  "c5-maths-ch09-t02|left": ["s3"],                // the remainder itself when the leftover is asked
};
