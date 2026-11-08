// Play coverage rules for the paheli family (round 7: number puzzles, classes 6-7; never timed). Authored: loading k bags
// onto a boat that must carry exactly T counters, where the k odd bags nearest T can never make it, and sailing it (each
// bag pairs up inside, the lone counters pair up with each other) IS deciding odd or even for sums (c7-ch06-t01 s1) and
// using parity to rule a load out before adding (s3); the same boat with trays of rows × columns IS the parity of
// products (s2). Placing number tiles in a 3 × 3 grid so that all 8 lines (3 rows, 3 columns, 2 diagonals) add the same,
// the run adding every line, IS checking and completing a magic square (c7-ch06-t02 s1, s2); doing it with nine numbers
// in other steps (3-11, 2-18 by 2), where the magic sum and the centre move with the numbers, IS what changes when every
// cell changes (s3). Giving each letter of a letter sum a digit tile (each digit once, no leading 0), the run adding
// column by column with its carries, IS finding hidden digits and cracking letter sums (c7-ch06-t04 s1, s2) and the
// limits of a carry (s3: a sum one digit longer starts with 1). Setting a 2-digit start that reverse-and-add carries to a
// given palindrome IS making palindromes by reverse-and-add (c6-ch03-t02 s2).
// Mal-rules map only to the topic's own kit misconceptions where the belief is the same one: two odd bags for an odd
// count is "odd-plus-odd"; three or five odd bags for an even count is "three-odds-even"; trays chosen by reading their
// parity with the sum rules is "product-like-sum"; a grid with every row on the sum (or every row and column) but a
// column or a diagonal off is "rows-only"; digits that make each column alone write its letter, the carries dropped, is
// "ignore-carry"; the leading letter of a one-digit-longer sum set to 2 is "big-carry".
// Not admitted (no honest mechanic here yet): c6-maths-ch03-t02-s1 (digit sums: setting a number with a given digit sum
// would be an answer box) and c6-maths-ch03-t02-s3 (the Kaprekar routine). Kit beliefs with no honest set-up here:
// trial-only (trial is not a set-up: any filling may be found by trying), add-breaks (no level asks whether a shifted
// square stays magic), few-works, digitsum-size, kaprekar-zero (their skills are not admitted).
import { R } from "./rule.mjs";

export const family = "paheli";
const P = "paheli";
export const RULES = [
  R("c7-maths-ch06-t01", P, "pairs", "load", { "two-odds": "odd-plus-odd", "odd-count": "three-odds-even" }, { ks: [2, 3, 5] }),
  R("c7-maths-ch06-t01", P, "pairs", "trays", { "like-sum": "product-like-sum" }, { ks: [2, 3] }),
  R("c7-maths-ch06-t02", P, "magic", "square", { rows: "rows-only", "rows-cols": "rows-only" }, {}),
  R("c7-maths-ch06-t02", P, "magic", "shift", { rows: "rows-only", "rows-cols": "rows-only" }, { sets: [[2, 1], [3, 1], [11, 1], [2, 2], [1, 2]] }),
  R("c7-maths-ch06-t04", P, "cipher", "letters", { "ignore-carry": "ignore-carry", "big-carry": "big-carry" }, { forms: ["2+2=3", "rev", "2+2=2", "3+3=4"] }),
  R("c6-maths-ch03-t02", P, "mirror", "reach", {}, {}),
];

export const ACTS = {
  "c7-maths-ch06-t01|load": ["s1", "s3"],     // odd or even for sums; parity rules a load out before adding
  "c7-maths-ch06-t01|trays": ["s2"],          // odd or even for products (and sums of many)
  "c7-maths-ch06-t02|square": ["s1", "s2"],   // check every line; complete a 1-9 magic square
  "c7-maths-ch06-t02|shift": ["s3"],          // the magic sum and the centre move when every cell moves
  "c7-maths-ch06-t04|letters": ["s1", "s2", "s3"], // hidden digits, letter sums, carries of 0 or 1
  "c6-maths-ch03-t02|reach": ["s2"],          // palindromes by reverse-and-add
};
