// Play coverage rules for the nishana family (S0.3 split of server/play/tools/build-coverage.mjs RULES / ACTS; one file per
// family so each games lane edits only its own). Authored: a person decided the family's mechanic IS the topic's idea.
// RULES: family/mode, goal, misMap (mal-rule → kit slug), grammar, arts. ACTS: `${topicId}|${goal}` → the kit skill
// suffixes the rule's act exercises (the first is the entry's own). The builder checks every id against the kits.
import { R } from "./rule.mjs";

export const family = "nishana";
export const RULES = [
  // ── Nishana (the number line)
  R("c4-maths-ch04-t02", "nishana", "compare", "compare", {}, { forms: ["whole"], ranges: [[0, 10000]] }),
  R("c4-maths-ch10-t02", "nishana", "compare", "compare", { "first-digit-compare": "first-digit-compare" }, { forms: ["whole"], ranges: [[0, 1000], [0, 10000]] }),
  R("c5-maths-ch01-t01", "nishana", "compare", "compare", { "first-digit-compare": "first-digit-compare" }, { forms: ["whole"], ranges: [[0, 100000]] }),
  R("c5-maths-ch02-t01", "nishana", "place", "place", { "count-marks": "count-marks", "whole-number-bias": "whole-number-bias", "all-less-than-one": "all-less-than-one" }, { forms: ["fraction"], ranges: [[0, 1], [0, 2]] }),
  R("c6-maths-ch07-t02", "nishana", "place", "place", { "all-less-than-one": "less-than-one", "count-marks": "count-marks" }, { forms: ["fraction", "mixed"] }),
  R("c6-maths-ch10-t01", "nishana", "place", "place", { "sign-ignored": "sign-direction" }, { forms: ["integer"] }),
  R("c6-maths-ch10-t02", "nishana", "place", "place", { "neg-order-line": "neg-order-line" }, { forms: ["integer"] }),
  R("c6-maths-ch10-t02", "nishana", "compare", "compare", { "neg-magnitude": "neg-magnitude" }, { forms: ["integer"] }),
  R("c7-maths-ch03-t02", "nishana", "place", "place", {}, { forms: ["decimal"], decimals: 2 }),
  R("c7-maths-ch03-t03", "nishana", "compare", "compare", { "longer-bigger": "longer-bigger", "shorter-bigger": "shorter-bigger" }, { forms: ["decimal"], decimals: 3 }),
  R("c7-maths-ch03-t03", "nishana", "place", "place", {}, { forms: ["decimal"], decimals: 2 }),
  R("c7-maths-ch03-t01", "nishana", "place", "place", { "decimal-place": "same-digit" }, { forms: ["decimal"], decimals: 2, ranges: [[0, 1]] }),
  // rounding = which landmark is nearer on the line (place the value between two landmarks, then choose the nearer end)
  R("c4-maths-ch04-t03", "nishana", "place", "round", { "round-truncate": "truncate", "round-chain": "chain-rounding", "round-last-digit": "wrong-digit" }, { to: [100, 1000] }),
  R("c5-maths-ch01-t02", "nishana", "place", "round", { "round-truncate": "truncate", "round-chain": "chain-round" }, { to: [1000, 10000], maxV: 99999 }),
];

export const ACTS = {
  "c4-maths-ch04-t02|compare": ["s1", "s3"],            // two numbers, placed on the line
  "c4-maths-ch10-t02|compare": ["s3"],                  // compare large counts; never s1 (read a data table)
  "c5-maths-ch01-t01|compare": ["s3"],
  "c5-maths-ch02-t01|place": ["s1", "s2", "s3"],        // unit, non-unit, greater than 1 (range 0-2)
  "c6-maths-ch07-t02|place": ["s1"],
  "c6-maths-ch10-t01|place": ["s3"],                    // 0 as the reference point, negatives to its left
  "c6-maths-ch10-t02|place": ["s1"],
  "c6-maths-ch10-t02|compare": ["s2"],
  "c7-maths-ch03-t02|place": ["s1"],
  "c7-maths-ch03-t03|compare": ["s2"],
  "c7-maths-ch03-t03|place": ["s1"],
  "c7-maths-ch03-t01|place": ["s1", "s2"],
  "c4-maths-ch04-t03|round": ["s2"],                    // nearest 100 and 1000 (the grammar's "to")
  "c5-maths-ch01-t02|round": ["s1"],
};
