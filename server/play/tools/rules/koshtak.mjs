// Play coverage rules for the koshtak family (round 7: expressions, class 7; never timed). Authored: snapping tray walls into
// a row of numbers so that the counter (each tray worked out on its own, then the trays joined left to right) makes what
// the row is worth IS splitting an expression into its terms and evaluating terms first (the level is built so only the
// walls at the + and − gaps make it); laying ONE lid over a run of numbers so the row makes a given value IS "the bracket is
// worked out first" (built so exactly one lid makes it); turning the jumps of an opened bracket so the opened walk lands
// where the bracketed one does (the bracket as one big jump back) IS removing a bracket with a minus before it; putting term
// cards into bins that close into ONE term only when every card in them has the same letter part (a lone letter counting as
// one) IS identifying and combining like terms (the shelf is checked against the belt with numbers for the letters).
// Mal-rules map only to the topic's own kit misconceptions where the belief is the same one: one tray per number (strictly
// left to right) and, where left to right would make the value, no lid at all are "left-to-right"; no jump turned (the
// minus on the first number only) is "minus-first-only"; letter cards of different kinds in one bin (3a + 2b as one term,
// 5x + 2 as one) is "unlike-combine"; the lone letters left out as if they were nothing (6k − k → 6k) is "lone-letter".
// Not admitted (no honest mechanic here yet): c7-maths-ch02-t02-s4 (swapping and grouping terms smartly: term cards that
// carry their sign cannot show the sign-detach belief, and "smartly" is a choice of order, not a law), c7-maths-ch04-t02-s1
// (substituting a value: the evaluation is a number the child would type; the concatenate belief has no set-up in a
// physical model) and c7-maths-ch04-t02-s3 (growing patterns: kram's machine/rule already serves c7-maths-ch04-t03).
import { R } from "./rule.mjs";

export const family = "koshtak";
const K = "koshtak";
export const RULES = [
  R("c7-maths-ch02-t02", K, "tray", "terms", { "left-to-right": "left-to-right" }, { len: [3, 5] }),
  R("c7-maths-ch02-t02", K, "tray", "lid", { "left-to-right": "left-to-right" }, { len: [3, 4] }),
  R("c7-maths-ch02-t02", K, "tray", "open", { "minus-first-only": "minus-first-only" }, { len: [3, 5] }),
  R("c7-maths-ch04-t02", K, "bin", "like", { "unlike-combine": "unlike-combine", "lone-letter": "lone-letter" }, { kinds: [2, 3], cards: [4, 6] }),
];

export const ACTS = {
  "c7-maths-ch02-t02|terms": ["s1", "s2"],   // split at + and − into terms; each term first, then add / take the terms
  "c7-maths-ch02-t02|lid": ["s2"],           // brackets first, then terms, then + and −
  "c7-maths-ch02-t02|open": ["s3"],          // a minus before a bracket takes away every term inside
  "c7-maths-ch04-t02|like": ["s2"],          // identify like terms (the same letter part) and combine them
};
