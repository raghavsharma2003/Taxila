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
// kit here names it, so it maps nowhere. Divisibility (c6 ch05 t05): netting, before the wave, every numbered foe the ÷d
// tower will break IS applying the divisibility test (the numbers are too big to divide by eye); one goal per kit skill
// (ones: 2, 5, 10 by the last digit; tail: 4, 8 by the last two / three digits; sum: 3, 9 by the digit sum). Netting the
// foes ending in 4 for ÷4 is "divisible by 4 if its last digit is 4"; netting those ending in 3, 6, 9 for ÷3 is "uses the
// last digit to test for 3"; netting every multiple of 3 for ÷9 is "divisible by 3 must be divisible by 9". The other
// divisibility beliefs (even-for-4, digit-sum-for-4, four-test-for-8, last-digit-for-9, five-for-ten, only-zero-for-5,
// any-odd-digit) are implemented but no kit here names them, so they map nowhere. HCF × LCM (c7 ch11 t03, mode lcm): building
// the wall (the biggest tower that hits both towers' squares) and the trap (where they first meet), then watching the scale lay
// wall × trap beside a × b, IS verifying the relation (balance); setting the one hidden value of a, b, wall, trap so the scale
// balances IS using it (missing); the trap for three towers beside their wall IS its limit: h × L is not a × b × c (three); a
// partner that shares no stride with a composite tower IS a co-prime pair that need not be prime (coprime); a wall and a trap
// whose product is the stones and whose bricks land on the trap IS "the HCF divides the LCM" (mend). The trap at a × b × c ÷ h
// is "the relation holds for three numbers"; the partner on the pads' one prime (it divides the tower) is "co-prime means
// prime"; keeping the draft wall that does not land on stones ÷ draft is "any HCF and LCM go together". product, low-wall,
// lcm-over-a and pair-only are implemented but this kit names none of them, so they map nowhere. The builder checks every id
// against the kits.
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
  R("c6-maths-ch05-t05", K, "divisibility", "ones", {}, { divisors: [2, 5, 10], digits: [3, 5], foes: [8, 10] }),
  R("c6-maths-ch05-t05", K, "divisibility", "tail", { "ends-in-four": "four-last-digit" }, { divisors: [4, 8], digits: [3, 5], foes: [8, 10] }),
  R("c6-maths-ch05-t05", K, "divisibility", "sum", { "last-digit-for-3": "three-last-digit", "three-for-nine": "nine-implies" }, { divisors: [3, 9], digits: [3, 5], foes: [8, 10] }),
  R("c7-maths-ch11-t02", K, "lcm", "meet", { product: "product-always", "gcd-for-lcm": "lcm-smaller" }, { periods: [4, 6, 8, 9, 10, 12], n: [20, 36], coprime: false }),
  R("c7-maths-ch11-t03", K, "lcm", "balance", {}, { periods: [4, 6, 8, 9, 10, 12, 14, 15, 16, 18], n: [16, 72] }),
  R("c7-maths-ch11-t03", K, "lcm", "missing", {}, { periods: [4, 6, 8, 9, 10, 12, 14, 15, 16, 18], n: [16, 72], hides: ["b", "wall", "trap"] }),
  R("c7-maths-ch11-t03", K, "lcm", "three", { "three-numbers": "three-numbers" }, { periods: [2, 3, 4, 5, 6, 8, 9, 10, 12], n: [12, 72] }),
  R("c7-maths-ch11-t03", K, "lcm", "coprime", { "prime-partner": "coprime-prime" }, { periods: [4, 8, 9, 15], n: [30, 72] }),
  R("c7-maths-ch11-t03", K, "lcm", "mend", { "any-pair": "any-pair" }, { n: [16, 60] }),
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
  "c6-maths-ch05-t05|ones": ["s1"],           // the tests for 2, 5 and 10: the last digit decides which foes break
  "c6-maths-ch05-t05|tail": ["s2"],           // the tests for 4 and 8: the last two / three digits
  "c6-maths-ch05-t05|sum": ["s3"],            // the tests for 3 and 9: the digit sum
  "c7-maths-ch11-t02|meet": ["s1"],           // the LCM by listing multiples (the wave lists them)
  "c7-maths-ch11-t03|balance": ["s1"],        // set the HCF wall and the LCM trap; the scale shows HCF × LCM = a × b
  "c7-maths-ch11-t03|missing": ["s2"],        // the hidden one of a, b, HCF, LCM from the other three (the scale balances)
  "c7-maths-ch11-t03|three": ["s3"],          // three towers: h × L is not a × b × c (the limit)
  "c7-maths-ch11-t03|coprime": ["s3"],        // co-prime need not be prime: the composite partner meets at the product
  "c7-maths-ch11-t03|mend": ["s3"],           // the HCF divides the LCM: a wall that does not land on the trap is refused
};
