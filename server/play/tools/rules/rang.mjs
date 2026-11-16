// Play coverage rules for the rang family (round 7: acids, bases, indicators and neutralisation, class 7 science; never timed:
// the child works a dropper a drop at a time). Authored:
// - Dropping a drop of each of the kit's household liquids (lemon juice, vinegar, soap solution, baking soda solution, pure
//   water, sugar solution, common salt solution) onto blue and red litmus and sorting each cup acidic, basic or neutral by
//   the colours it gives, a sort taken only when the colours seen leave one kind, IS litmus (c7-science-ch02-t01 s2: litmus);
//   the same with turmeric (haldi) paper and hibiscus (gudhal) water, the gudhal water short at looks 2 and 3 so turmeric
//   finds the bases first, IS the natural indicators (s3: desi). A base sorted as acidic because turmeric went red on it
//   (made-red), or a neutral liquid sorted as acidic on red litmus alone (own-red), is m3: the indicator taken to make the
//   liquid acidic; the consequence shows the same liquid on the other indicator giving the same kind.
// - Adding baking soda solution drop by drop to lemon juice or vinegar with hibiscus water until its pink goes (or, on a card
//   item asking for it, until it turns green), plain water on the bench beside it, IS neutralisation followed by an
//   indicator and told apart from diluting (c7-science-ch02-t02 s2, s1: boond); the kit's uses (an ant bite's formic acid
//   with baking soda, too much stomach acid with an antacid, acidic soil with lime), each case's base on the bench beside
//   lemon juice and plain water, IS neutralisation in daily life (s3, s1: ilaaj). "Done" on a pink glass after plain water
//   is m2; "Done" for no pink after extra base (it is green) is m3; "Danger!" once a base is in is m1, answered by the label
//   of what forms (a salt and water, heat given out), never a harm mechanic.
// Not admitted (the lead's ruling: safety and taste beliefs are the teacher's lines, never a mechanic): c7-science-ch02-t01
// m1 (acids are dangerous and burn), m2 (tasting is fine; acids taste sour), m4 (bases are always safe). s1 (sour and bitter
// by taste) and s4 (indicators, not taste) have no act here: nothing is tasted, touched or drunk.
import { R } from "./rule.mjs";

export const family = "rang";
const F = "rang";
export const RULES = [
  R("c7-science-ch02-t01", F, "pehchaan", "litmus", { "own-red": "m3" }, {}),
  R("c7-science-ch02-t01", F, "pehchaan", "desi", { "made-red": "m3" }, {}),
  R("c7-science-ch02-t02", F, "milao", "boond", { "water-only": "m2", "too-much": "m3", "harm-mix": "m1" }, {}),
  R("c7-science-ch02-t02", F, "milao", "ilaaj", { "water-only": "m2", "too-much": "m3", "harm-mix": "m1" }, {}),
];

export const ACTS = {
  "c7-science-ch02-t01|litmus": ["s2"],        // litmus: acids turn blue litmus red, bases red litmus blue, neutral neither
  "c7-science-ch02-t01|desi": ["s3"],          // turmeric and hibiscus classify acidic, basic, neutral
  "c7-science-ch02-t02|boond": ["s2", "s1"],   // an indicator follows neutralisation; diluting is not neutralising
  "c7-science-ch02-t02|ilaaj": ["s3", "s1"],   // the kit's uses: antacid, ant bite, acidic soil
};

/** the kit misconceptions deliberately given no mechanic, with the reason (read by tests/r7-games-rang.test.mjs) */
export const NOT_ADMITTED = {
  "c7-science-ch02-t01-m1": "acids are dangerous and burn: a safety belief, the teacher's line by ruling",
  "c7-science-ch02-t01-m2": "tasting is fine; acids taste sour: a taste belief, the teacher's line by ruling (nothing is tasted here)",
  "c7-science-ch02-t01-m4": "bases are always safe: a safety belief, the teacher's line by ruling",
};
