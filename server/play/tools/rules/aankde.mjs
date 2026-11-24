// Play coverage rules for the aankde family (round 7: data and statistics, classes 6-7; never timed). Authored: taking every
// survey slip off the pile into its row as one stroke, upright or across the four before it, until the pile is empty and
// the table's total row makes the survey, IS organising data with tally marks into a frequency table (c6-ch04-t01 s2);
// stroking a lost row so that the total row makes the children asked IS reading a frequency table and checking its total
// (s3, and s2 for the bundles). Moving blocks from tall towers to short ones until every tower stands level IS the mean as
// the equal share (c7-ch13-t02 s1); setting the line where the blocks above exactly fill the gaps below IS the mean as the
// balance of the data (s1). Swapping value cards into order and setting the peg where the line folds from both ends (a
// card, or the gap between two) IS the median (s2). Tallying the sizes a shop sold and putting the stock crate on the
// longest row IS the mode and choosing it where only a real size will do (s3).
// Mal-rules map only to the topic's own kit misconceptions where the belief is the same one: the fifth stroke drawn upright,
// or the standing bundles read as four, is "tally-five" ("draws the fifth mark as another upright line", "reads one crossed
// bundle plus 3 lines as 7"); counting with slips still on the pile is "total-mismatch" ("table totals fewer than the
// people asked", "never adds the frequency column"); the line at the data value nearest the mean is "mean-in-data" ("rounds
// the mean to the nearest data value"); the line where the towers stand without the one far taller is "outlier" ("does not
// notice a very large value"); the written line pegged in its middle is "median-unordered" ("points to the middle of the
// list as written"); the stock crate on the size nearest the mean is "mean-in-data" (the kit's own shoe-shop item i11:
// "a mean like 6.4 is not even a real size").
// Not admitted (no honest mechanic here yet): c6-maths-ch04-t01-s1 (choosing a clear question: a written judgement).
// Kit beliefs with no honest set-up here: raw-organised (thinks a raw list is organised: the pile must be emptied to count,
// so a child never answers from it), median-mean (a median computed by adding and dividing: the peg names a place, not a
// worked value). Pictographs and bar graphs (c6-ch04-t02, t03) are stambh's. zero-dropped (an empty tower left out of the
// levelling) and one-card (one middle card pegged for an even count) are implemented but no kit names them: never claimed.
import { R } from "./rule.mjs";

export const family = "aankde";
const A = "aankde";
export const RULES = [
  R("c6-maths-ch04-t01", A, "tally", "sort", { "tally-five": "tally-five", "total-mismatch": "total-mismatch" }, { cats: [3, 4], slips: [10, 26] }),
  R("c6-maths-ch04-t01", A, "tally", "missing", { "tally-five": "tally-five" }, { cats: [3, 4] }),
  R("c7-maths-ch13-t02", A, "stack", "even", {}, { n: [3, 5] }),
  R("c7-maths-ch13-t02", A, "stack", "pour", { "middle-value": "mean-in-data", outlier: "outlier" }, { n: [4, 6] }),
  R("c7-maths-ch13-t02", A, "line", "middle", { unordered: "median-unordered" }, { n: [5, 8] }),
  R("c7-maths-ch13-t02", A, "tally", "mode", { "mean-size": "mean-in-data" }, { cats: [3, 5], slips: [8, 18] }),
];

export const ACTS = {
  "c6-maths-ch04-t01|sort": ["s2"],             // tally marks in bundles of five into a frequency table
  "c6-maths-ch04-t01|missing": ["s3", "s2"],    // read the table, check the total against the children asked
  "c7-maths-ch13-t02|even": ["s1"],             // the mean as the equal share (towers levelled)
  "c7-maths-ch13-t02|pour": ["s1"],             // the mean as the balance (blocks above fill the gaps below)
  "c7-maths-ch13-t02|middle": ["s2"],           // the median: order the data first, then the middle
  "c7-maths-ch13-t02|mode": ["s3"],             // the mode, where only a real value will do
};
