// Play coverage rules for the jaanch family (round 7: testing food for starch and fat, class 6 science; never timed: every step
// is a tap, and the paper dries only by the child's own Wait). Authored:
// - Dropping dilute iodine from the lab bench's labelled bottle on each food on the card a drop at a time, seeing it turn
//   blue-black or stay iodine's own brown, and only then saying "shows starch" or "no starch shown" IS the starch test and its
//   result (c6-science-ch03-t02 s1: neela / iodine). Sugar solution is on every card: said to show starch after it stayed
//   brown is m2 (iodine taken to show any carbohydrate).
// - Rubbing each food on paper (a liquid: a drop on it), letting the paper dry a Wait at a time, holding it to the light and
//   only then saying "shows fat" or "no fat shown" IS the paper test for fat (s2: daag / kaagaz). Water or a tomato is on
//   every card: "shows fat" said while its patch is still wet is m3 (any wet patch taken to mean fat, decided before the
//   paper dried).
// - Running both tests on each food and recording both in a grid (foods down the side, starch and fat across), "Next food"
//   only once both are said, the kit's new snack (blue-black AND a patch on dry paper) on every card, IS interpreting the
//   results and one food holding several nutrients (s3, with s1 and s2: thali / dono). "Next food" after one test showed
//   something and the other not done is m1 (one food, one nutrient: stopping after one positive test).
// NOT covered, by the owner's scope: the protein test (copper sulphate and sodium hydroxide, violet). It is out of this game
// entirely, so skill s2's protein half ("the result of the teacher-run protein test") has no mechanic; s2 is exercised by its
// paper-test half only. No food's protein is named, drawn or claimed anywhere in the family.
// Safety lines (tested food is never eaten; chemicals only with the teacher; a peanut allergy) are the teacher's, never a
// mechanic: no act eats, tastes or touches anything, and the iodine is a labelled bottle on the teacher's lab bench.
import { R } from "./rule.mjs";

export const family = "jaanch";
const F = "jaanch";
const T = "c6-science-ch03-t02";
export const RULES = [
  R(T, F, "neela", "iodine", { "sugar-starch": "m2" }, {}),
  R(T, F, "daag", "kaagaz", { "wet-fat": "m3" }, {}),
  R(T, F, "thali", "dono", { "one-only": "m1" }, {}),
];

export const ACTS = {
  [`${T}|iodine`]: ["s1"],               // the starch test: dilute iodine, blue-black where starch is present
  [`${T}|kaagaz`]: ["s2"],               // the paper test for fat (its protein half is out of scope: no mechanic)
  [`${T}|dono`]: ["s3", "s1", "s2"],     // read both results; one food can hold several nutrients
};

/** the kit misconceptions deliberately given no mechanic, with the reason (read by tests/r7-games-jaanch.test.mjs) */
export const NOT_ADMITTED = {};
/** the kit skill halves deliberately not covered, with the reason */
export const NOT_COVERED = {
  "c6-science-ch03-t02-s2": "its protein half (the teacher-run protein test, violet) is out of this game by the owner's scope: no copper sulphate, sodium hydroxide or violet anywhere; s2 is exercised by the paper test for fat only",
};
