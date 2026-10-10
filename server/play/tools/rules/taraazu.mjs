// Play coverage rules for the taraazu family (S0.3 split of server/play/tools/build-coverage.mjs RULES / ACTS; one file per
// family so each games lane edits only its own). Authored: a person decided the family's mechanic IS the topic's idea.
// RULES: family/mode, goal, misMap (mal-rule → kit slug), grammar, arts. ACTS: `${topicId}|${goal}` → the kit skill
// suffixes the rule's act exercises (the first is the entry's own). The builder checks every id against the kits.
import { R } from "./rule.mjs";

export const family = "taraazu";
export const RULES = [
  // ── Taraazu (the balance: "=" as a relation, equations)
  R("c4-maths-ch10-t01", "taraazu", "equality", "fill", { "answer-next": "equals-operational" }, {}, ["kagaz", "chalk"]),
  R("c7-maths-ch04-t01", "taraazu", "equation", "solve", {}, { maxX: 9, maxBags: 2 }),
  R("c7-maths-ch15-t01", "taraazu", "equation", "solve", {}, { maxX: 9, maxBags: 2 }),
  R("c7-maths-ch15-t02", "taraazu", "equation", "solve", { "move-no-change": "move-no-change", "one-side": "one-side" }),
];

export const ACTS = {
  "c4-maths-ch10-t01|fill": ["s2"],                     // a + b = _ + c is compensation / the same-difference trick
  "c7-maths-ch04-t01|solve": ["s1"],                    // the bag is the letter: an unknown number to find
  "c7-maths-ch15-t01|solve": ["s3"],                    // trying a value until it balances; never s1 (phrases to expressions)
  "c7-maths-ch15-t02|solve": ["s1", "s2", "s3"],        // one-step, two-step (2 bags), x on both sides
};
