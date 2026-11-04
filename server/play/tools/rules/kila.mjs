// Play coverage rules for the kila family (round 7 E4: turn-based tower defence on a numbered path; a tower on square p
// fires on every multiple of p; the wave moves only on a press). Authored: laying nets where a tower will fire IS listing
// its multiples (p = 2: the even squares, c4 odd / even); one tower that hits every flag and no flower IS a period that
// divides the flags; a second tower that puts its shot on the first one's shield square IS a common multiple; building
// every tower that hits the gate IS finding all the factors (two gates: the common factors); the trap on the first square
// two towers hit together IS the LCM ("when do they meet"). Mal-rules map only to the topic's own kit misconceptions where
// the belief is the same one: nets on the factors of p is "confuses factors with multiples"; nets only up to 10 × p is
// "multiples stop at the tenth"; leaving out 12 or 34 from the even tower's squares is "any odd digit makes it odd"; the
// trap at a × b (or the second tower at shield ÷ first) is "the first common multiple is the product"; the trap on a common
// factor is "the LCM can be smaller / gives a factor instead of a multiple"; every factor but 1 and the number is "leaves
// out 1 and the number itself"; only the pairs from 1, 2, 3 is "misses pairs". `sum` (trap at a + b) is implemented but no
// kit here names it, so it maps nowhere. The builder checks every id against the kits.
import { R } from "./rule.mjs";

export const family = "kila";
const K = "kila";
export const RULES = [
  R("c4-maths-ch03-t01", K, "multiples", "mark", { "any-odd-digit": "any-odd-digit" }, { periods: [2], n: [12, 24] }),
  R("c5-maths-ch13-t01", K, "multiples", "mark", { "factor-for-multiple": "factor-multiple-confuse", "finite-multiples": "finite-multiples" }, { periods: [3, 4, 5, 6], n: [16, 36] }),
  R("c5-maths-ch13-t01", K, "multiples", "guard", {}, { periods: [2, 3, 4, 5, 6, 7, 8, 9], n: [16, 36] }),
  R("c5-maths-ch13-t01", K, "multiples", "common", { product: "product-only" }, { periods: [2, 3, 4, 5, 6], menu: [2, 3, 4, 5, 6, 7, 8, 9], n: [14, 36] }),
  R("c5-maths-ch13-t01", K, "lcm", "meet", { product: "product-only", "gcd-for-lcm": "factor-multiple-confuse" }, { periods: [2, 3, 4, 5, 6, 8, 9, 10], n: [12, 36] }),
  R("c5-maths-ch13-t02", K, "factors", "all", { "one-and-self": "one-and-self", "miss-pairs": "miss-pairs" }, { gates: 1, g: [8, 36] }),
  R("c6-maths-ch05-t01", K, "factors", "all", { "one-and-self": "miss-ends" }, { gates: 2, g: [8, 36] }),
  R("c6-maths-ch05-t01", K, "lcm", "meet", { product: "common-product", "gcd-for-lcm": "factor-multiple" }, { periods: [2, 3, 4, 5, 6, 8, 9, 10, 12], n: [16, 36] }),
  R("c7-maths-ch11-t02", K, "lcm", "meet", { product: "product-always", "gcd-for-lcm": "lcm-smaller" }, { periods: [4, 6, 8, 9, 10, 12], n: [20, 36], coprime: false }),
];

export const ACTS = {
  "c4-maths-ch03-t01|mark": ["s2", "s1"],     // the even tower's squares: decide even from the ones digit; even = makes pairs
  "c5-maths-ch13-t01|mark": ["s1"],           // list multiples by skip counting (the tower's squares)
  "c5-maths-ch13-t01|guard": ["s1"],          // a period whose multiples are every flag (and no flower)
  "c5-maths-ch13-t01|common": ["s2"],         // a common multiple: the shield square both towers hit
  "c5-maths-ch13-t01|meet": ["s3"],           // when do they meet: the smallest common multiple
  "c5-maths-ch13-t02|all": ["s2", "s3"],      // all the factors of the gate; a factor (hits it) from a non-factor (misses)
  "c6-maths-ch05-t01|all": ["s2", "s1"],      // the common factors of two gates
  "c6-maths-ch05-t01|meet": ["s3"],           // common multiples, the first one
  "c7-maths-ch11-t02|meet": ["s1"],           // the LCM by listing multiples (the wave lists them)
};
