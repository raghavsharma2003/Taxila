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
  // ── round 7: measurement (weigh.logic.ts). The conversion is the act: weights onto a pan (kg / g), jugs into a vessel
  // (l / ml); c4 labels carry whole kg / l and simple small parts, c5 mixed ones ("2 kg 50 g")
  R("c4-maths-ch08-t01", "taraazu", "weigh", "balance", { "kg-is-100g": "kg-is-100g" }, { smalls: "simple" }),
  R("c5-maths-ch08-t01", "taraazu", "weigh", "balance", { "mixed-concat": "mixed-concat", "fifty-as-half": "fifty-as-half" }, { smalls: "mixed" }),
  R("c4-maths-ch08-t02", "taraazu", "fill", "fill", { "l-is-100ml": "l-is-100ml" }, { smalls: "simple" }),
  R("c5-maths-ch08-t02", "taraazu", "fill", "fill", { "mixed-concat": "mixed-concat" }, { smalls: "mixed" }),
  // ── r7 maap: fractions of a measure (c4-maths-ch05-t02). The parcel says "¾ kg" / "½ kg + ¼ kg", the vessel "¼ l"; the
  // box holds no weight / jug equal to the label (no 250 g at all), so the fraction is made in grams / ml; two fractions
// added ("½ l + ¼ l") is s3. The kit's three
  // beliefs are the loads: ½ as 50, ¼ as 400, ¾ as 3 small pieces. Not admitted: s2 (½ / ¼ / ¾ m in cm), no tape here.
  R("c4-maths-ch05-t02", "taraazu", "weigh", "balance", { "half-is-50": "half-is-50", "quarter-is-4": "quarter-is-4", "pieces-not-size": "pieces-not-size" }, { frac: "sum" }),
  R("c4-maths-ch05-t02", "taraazu", "fill", "fill", { "half-is-50": "half-is-50", "quarter-is-4": "quarter-is-4", "pieces-not-size": "pieces-not-size" }, { frac: "sum" }),
];

export const ACTS = {
  "c4-maths-ch10-t01|fill": ["s2"],                     // a + b = _ + c is compensation / the same-difference trick
  "c7-maths-ch04-t01|solve": ["s1"],                    // the bag is the letter: an unknown number to find
  "c7-maths-ch15-t01|solve": ["s3"],                    // trying a value until it balances; never s1 (phrases to expressions)
  "c7-maths-ch15-t02|solve": ["s1", "s2", "s3"],        // one-step, two-step (2 bags), x on both sides
  "c4-maths-ch08-t01|balance": ["s1", "s3"],            // 1 kg = 1000 g built from weights; adding weights to a total
  "c5-maths-ch08-t01|balance": ["s2", "s3"],            // mixed units (2 kg 50 g = 2050 g); adding weights
  "c4-maths-ch08-t02|fill": ["s1"],                     // 1 l = 1000 ml poured from jugs
  "c5-maths-ch08-t02|fill": ["s2"],                     // mixed units (1 l 250 ml = 1250 ml)
  "c4-maths-ch05-t02|balance": ["s1", "s3"],            // ½ / ¼ / ¾ kg in grams; ½ kg + ¼ kg added
  "c4-maths-ch05-t02|fill": ["s1", "s3"],               // ½ / ¼ / ¾ l in ml; ½ l + ¼ l added
};
