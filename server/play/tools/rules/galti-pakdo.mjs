// Play coverage rules for the galti-pakdo family (round 7: a classmate's working of a simple equation, class 7; never
// timed). Authored: putting the friend's claim x = v into a line on the taraazu (each pan weighs one side of THAT line with
// v put in) and seeing the question itself balance or tip IS checking a claimed solution in the original equation
// (c7-ch15-t03 s1); tapping the first line that does not follow from the one above (every working line is made by the law,
// a step done to both sides, plus at most one of the topic's own step bugs) IS finding the first wrong line (s2); taking
// the line that belongs there from three offers (the law's line and two other step bugs' lines), the law rewriting the
// lines below and weighing the new claim in the question, IS naming the error and correcting the solution (s3, s2).
// A third of the workings are all correct ("sab sahi" after the question is weighed), a third reach the right answer from
// a wrong step, a third end in a neat wrong line (the kind is drawn from the level's seed).
// Mal-rules map to the topic's own kit misconceptions, the belief the same one: "sab sahi" on a neat wrong working without
// weighing it is "neat-correct"; the question weighed (it balances), then "sab sahi" on a working with a wrong step is
// "right-answer"; the claim weighed in a later line before the question (it balances there, the question does not) is
// "check-later". The step bugs (move-no-change, sign-slip, part-bracket, one-side, wrong-inverse) are the friend's, not
// the child's: they are the working's lines, never evidence about the child.
import { R } from "./rule.mjs";

export const family = "galti-pakdo";
const F = "galti-pakdo";
const MIS = { "neat-correct": "neat-correct", "right-answer": "right-answer", "check-later": "check-later" };
export const RULES = [
  R("c7-maths-ch15-t03", F, "kaapi", "pakdo", MIS, {}),
  R("c7-maths-ch15-t03", F, "kaapi", "sudhaaro", MIS, {}),
];

export const ACTS = {
  "c7-maths-ch15-t03|pakdo": ["s1", "s2"],      // weigh the claim in the question; the first wrong line
  "c7-maths-ch15-t03|sudhaaro": ["s3", "s2"],   // the first wrong line mended (the error named by its fix)
};
