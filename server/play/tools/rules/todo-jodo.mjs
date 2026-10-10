// Play coverage rules for the todo-jodo family (S0.3 split of server/play/tools/build-coverage.mjs RULES / ACTS; one file per
// family so each games lane edits only its own). Authored: a person decided the family's mechanic IS the topic's idea.
// RULES: family/mode, goal, misMap (mal-rule → kit slug), grammar, arts. ACTS: `${topicId}|${goal}` → the kit skill
// suffixes the rule's act exercises (the first is the entry's own). The builder checks every id against the kits.
import { R } from "./rule.mjs";

export const family = "todo-jodo";
export const RULES = [
  // ── Todo-Jodo · atoms (prime factorisation, HCF, LCM)
  R("c6-maths-ch05-t02", "todo-jodo", "atoms", "atoms", { "include-one": "one-prime" }, { hi: 120 }),
  R("c6-maths-ch05-t04", "todo-jodo", "atoms", "atoms", { "stop-composite": "stop-composite", "include-one": "include-one" }),
  R("c6-maths-ch05-t04", "todo-jodo", "atoms", "two-trees", { "different-trees": "different-trees", "stop-composite": "stop-composite", "include-one": "include-one" }),
  R("c7-maths-ch11-t01", "todo-jodo", "atoms", "hcf", { "hcf-lowest": "lowest", "hcf-all-primes": "all-primes" }),
  R("c7-maths-ch11-t02", "todo-jodo", "atoms", "lcm", { "lcm-product": "product-always" }),
  R("c6-maths-ch05-t01", "todo-jodo", "atoms", "lcm", { "lcm-product": "common-product" }, { hi: 120 }),
  R("c6-maths-ch05-t01", "todo-jodo", "atoms", "hcf", {}, { hi: 120 }),
  // co-prime = the two molecules share NO atom (an empty pair tray, HCF 1); pairs of composites like 8 and 15 included
  R("c6-maths-ch05-t03", "todo-jodo", "atoms", "hcf", {}, { hi: 120, coprime: true }),
  // ── Todo-Jodo · strips (fractions)
  R("c4-maths-ch05-t01", "todo-jodo", "strips", "make", { "part-part": "part-part" }, { dens: [2, 3, 4, 6, 8] }, ["kagaz", "chalk"]),
  R("c4-maths-ch05-t01", "todo-jodo", "strips", "unit", { "bigger-denominator": "bigger-denominator-bigger" }, { dens: [2, 3, 4, 6, 8] }, ["kagaz", "chalk"]),
  R("c4-maths-ch05-t02", "todo-jodo", "strips", "make", {}, { dens: [2, 4, 8] }, ["kagaz", "chalk"]),
  R("c5-maths-ch02-t02", "todo-jodo", "strips", "compare", { "bigger-denominator": "bigger-denominator", "only-num-den": "tops-only", "gap": "gap-thinking" }),
  R("c5-maths-ch02-t03", "todo-jodo", "strips", "equal", { "more-pieces-more": "more-pieces-more", "add-same": "add-same", "one-side": "one-part-only" }),
  R("c6-maths-ch07-t01", "todo-jodo", "strips", "make", {}, {}),
  R("c6-maths-ch07-t01", "todo-jodo", "strips", "unit", { "bigger-denominator": "bigger-denominator" }),
  R("c6-maths-ch07-t03", "todo-jodo", "strips", "equal", { "add-same": "add-same", "one-side": "one-side" }),
  R("c6-maths-ch07-t04", "todo-jodo", "strips", "compare", { "only-num-den": "only-num-den", "gap": "gap", "bigger-denominator": "bigger-den-bigger" }),
  R("c6-maths-ch07-t05", "todo-jodo", "strips", "add", { "add-across": "add-across", "change-only-den": "change-only-den" }),
  // ── Todo-Jodo · bundles (place-value subtraction with regrouping)
  R("c4-maths-ch07-t01", "todo-jodo", "bundles", "subtract", { "smaller-from-larger": "smaller-from-larger", "zero-regroup": "borrow-across-zero" }, { places: 4 }, ["kagaz", "chalk", "blueprint"]),
  R("c5-maths-ch04-t01", "todo-jodo", "bundles", "subtract", { "smaller-from-larger": "smaller-from-larger", "zero-regroup": "zero-regroup" }, { places: 5 }),
];

export const ACTS = {
  "c6-maths-ch05-t02|atoms": ["s1"],                    // split into prime atoms = decide prime / composite by its factors
  "c6-maths-ch05-t04|atoms": ["s2", "s1"],              // a product of primes, by splitting (a factor tree)
  "c6-maths-ch05-t04|two-trees": ["s3"],                // the same atoms from any tree
  "c7-maths-ch11-t01|hcf": ["s2"],                      // HCF by prime factorisation (not "list the factors")
  "c7-maths-ch11-t02|lcm": ["s2"],                      // LCM by prime factorisation (not "list the multiples")
  "c6-maths-ch05-t01|lcm": ["s3"],                      // the first common multiple
  "c6-maths-ch05-t01|hcf": ["s2"],                      // common factors of two numbers
  "c6-maths-ch05-t03|hcf": ["s1", "s2"],                // only common factor 1; co-primes need not be primes (8 and 15)
  "c4-maths-ch05-t01|make": ["s1"],                     // equal parts, name halves / thirds / quarters
  "c4-maths-ch05-t01|unit": ["s3"],                     // compare unit fractions of the same whole
  "c4-maths-ch05-t02|make": [],                         // fractions of a kg / litre / metre: a strip act converts nothing
  "c5-maths-ch02-t02|compare": ["s1", "s3"],            // generated pairs never share a denominator (s2 is not exercised)
  "c5-maths-ch02-t03|equal": ["s1", "s2", "s3"],        // cut every part into k = multiply top and bottom by k; check equal
  "c6-maths-ch07-t01|make": ["s1"],
  "c6-maths-ch07-t01|unit": ["s2"],
  "c6-maths-ch07-t03|equal": ["s1", "s2"],              // not s3 (lowest terms)
  "c6-maths-ch07-t04|compare": ["s2", "s1"],            // different denominators, cut to a common unit to compare
  "c6-maths-ch07-t05|add": ["s2", "s1"],                // not s3 (mixed fractions)
  "c4-maths-ch07-t01|subtract": ["s2"],                 // subtraction with borrowing only (never s1: addition)
  "c5-maths-ch04-t01|subtract": ["s2"],
};
