#!/usr/bin/env node
// Builds data/play/coverage.json: which class 4-7 maths / science / EVS topics have a play family, with which goal and
// grammar, and which of the family's mal-rules map to which of the topic's VERIFIED kit misconceptions.
//
//   node server/play/tools/build-coverage.mjs           write the file
//   node server/play/tools/build-coverage.mjs --check   exit 1 if the file on disk is stale or any mapping is broken
//
// The RULES below are authored (a person decided that the family's mechanic IS the topic's idea); the builder only
// checks them against the kits: every mapped misconception id must exist in the topic's kit, every mal-rule must be one
// the family's logic actually implements, every topic must exist in the curriculum. A broken entry fails the build
// rather than shipping a silent hole. Coverage counts are computed, never typed.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LOGIC } from "../../../src/play/families/index.ts";
import { LABS } from "../../../src/play/families/kyun-lab/labs.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = join(ROOT, "data/play/coverage.json");

/** family/mode, goal, grammar, misMap (mal-rule → kit slug: the part after "-m-", or the full id) */
const R = (topicId, family, mode, goal, misMap = {}, grammar = {}, arts = undefined, skill = undefined) => ({ topicId, family, mode, goal, misMap, grammar, arts, skill });
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
  // ── Taraazu (the balance: "=" as a relation, equations)
  R("c4-maths-ch10-t01", "taraazu", "equality", "fill", { "answer-next": "equals-operational" }, {}, ["kagaz", "chalk"]),
  R("c7-maths-ch04-t01", "taraazu", "equation", "solve", {}, { maxX: 9, maxBags: 2 }),
  R("c7-maths-ch15-t01", "taraazu", "equation", "solve", {}, { maxX: 9, maxBags: 2 }),
  R("c7-maths-ch15-t02", "taraazu", "equation", "solve", { "move-no-change": "move-no-change", "one-side": "one-side" }),
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
  // ── Kyun-Lab (fair tests on the reviewed causal models in labs.ts)
  R("c4-evs-ch07-t01", "kyun-lab", "fair-test", "predict", { "sinker-never-floats": "m3", "heavy-sinks": "m1" }, { labs: ["tairna"] }, ["kagaz", "blueprint"]),
  R("c6-science-ch06-t01", "kyun-lab", "fair-test", "predict", { "heavy-sinks": "m2" }, { labs: ["tairna"] }),
  R("c6-science-ch04-t01", "kyun-lab", "fair-test", "predict", { "all-metals-magnetic": "m1", "magnet-needs-touch": "m2" }, { labs: ["chumbak"] }),
  R("c7-science-ch03-t03", "kyun-lab", "fair-test", "predict", { "water-never-conducts": "m1", "only-metals-conduct": "m3" }, { labs: ["bijli"] }),
  R("c7-science-ch07-t01", "kyun-lab", "fair-test", "predict", { "wool-makes-heat": "m1", "metal-is-colder": "m2" }, { labs: ["barf"] }),
  R("c7-science-ch10-t01", "kyun-lab", "fair-test", "predict", { "food-from-soil": "m1", "light-only": "m3" }, { labs: ["patta"] }),
  R("c7-science-ch10-t01", "kyun-lab", "fair-test", "fair", {}, { labs: ["patta"] }),
  R("c5-evs-ch03-t01", "kyun-lab", "fair-test", "predict", { "only-age-spoils": "m1" }, { labs: ["phaphoond"] }, ["kagaz", "chalk"]),
  R("c5-evs-ch03-t01", "kyun-lab", "fair-test", "fair", {}, { labs: ["phaphoond"] }, ["kagaz", "chalk"]),
  R("c6-science-ch01-t02", "kyun-lab", "fair-test", "golu", { "many-at-once": "m1" }, { labs: ["sukhao"] }),
  R("c6-science-ch01-t02", "kyun-lab", "fair-test", "fair", {}, { labs: ["sukhao"] }),
  R("c6-science-ch08-t03", "kyun-lab", "fair-test", "predict", { "only-temperature": "m2" }, { labs: ["sukhao"] }),
  R("c6-science-ch10-t02", "kyun-lab", "fair-test", "predict", { "needs-soil-light": "m1", "more-water-better": "m2", "warmth-irrelevant": "m3" }, { labs: ["ankur"] }),
  R("c6-science-ch10-t02", "kyun-lab", "fair-test", "fair", {}, { labs: ["ankur"] }),
  R("c7-science-ch01-t01", "kyun-lab", "fair-test", "golu", {}, { labs: ["sukhao"] }),
  R("c7-science-ch04-t02", "kyun-lab", "fair-test", "predict", { "one-of-air-water": "m2" }, { labs: ["jang"] }),
  R("c7-science-ch07-t03", "kyun-lab", "fair-test", "predict", { "black-attracts-heat": "m2" }, { labs: ["rang"] }),
  R("c7-science-ch08-t01", "kyun-lab", "fair-test", "predict", { "heavy-faster": "m1", "pull-changes-period": "m2" }, { labs: ["jhoola"] }),
  R("c7-science-ch11-t02", "kyun-lab", "fair-test", "predict", { "shadow-same-size": "m3" }, { labs: ["parchhai"] }),
];

/**
 * round 3 fix (adversarial B1, 2026-10-10): the kit skills each rule's ACT exercises, by suffix ("s2" = <topicId>-s2), keyed
 * `${topicId}|${goal}`. Before this every entry carried ALL of its topic's skills and took the first as its own, so a solved
 * 1096 − 710 subtraction level was credited to "Add 3- and 4-digit numbers with regrouping" and an addition lesson's
 * "game khelna hai" served the subtraction game: topic admission again (rj-r3g-topic-tag-admission), against GRAMMAR.md
 * §1 "admit by skill". Authored like RULES (a person decided the mechanic IS that skill's idea, reading the kit's skill
 * titles beside the family's level generator); the builder checks every id exists. [] = the act exercises none of the
 * topic's skills: the rule is kept for the record and never admitted (c4-maths-ch05-t02: shading a strip is not
 * converting half a kilogram to grams). The first listed skill is the entry's own (its evidence when no lesson skill).
 */
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
  "c4-maths-ch10-t01|fill": ["s2"],                     // a + b = _ + c is compensation / the same-difference trick
  "c7-maths-ch04-t01|solve": ["s1"],                    // the bag is the letter: an unknown number to find
  "c7-maths-ch15-t01|solve": ["s3"],                    // trying a value until it balances; never s1 (phrases to expressions)
  "c7-maths-ch15-t02|solve": ["s1", "s2", "s3"],        // one-step, two-step (2 bags), x on both sides
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
  "c4-evs-ch07-t01|predict": ["s1", "s2"],              // predict and test float / sink; what it is made of matters
  "c6-science-ch06-t01|predict": ["s2"],                // the float / sink half of s2
  "c6-science-ch04-t01|predict": ["s1", "s3", "s2"],
  "c7-science-ch03-t03|predict": ["s1", "s2", "s4"],    // the tester; conductors / insulators; water conducts
  "c7-science-ch07-t01|predict": ["s2", "s3", "s1", "s4"], // wool traps air; steel conducts heat in; metal-is-colder
  "c7-science-ch10-t01|predict": ["s2", "s3", "s1"],    // light, chlorophyll, CO2; the iodine (starch) test
  "c7-science-ch10-t01|fair": ["s3", "s2"],
  "c5-evs-ch03-t01|predict": ["s2"],                    // warm and moist food spoils fastest
  "c5-evs-ch03-t01|fair": ["s2"],
  "c6-science-ch01-t02|golu": ["s3", "s2"],             // one change at a time; never s1 (record a table)
  "c6-science-ch01-t02|fair": ["s2", "s3"],
  "c6-science-ch08-t03|predict": ["s1", "s2"],
  "c6-science-ch10-t02|predict": ["s1", "s3"],
  "c6-science-ch10-t02|fair": ["s2", "s1"],
  "c7-science-ch01-t01|golu": ["s3"],
  "c7-science-ch04-t02|predict": ["s2", "s3"],          // air AND water; paint as prevention (the coat factor)
  "c7-science-ch07-t03|predict": ["s2", "s3"],
  "c7-science-ch08-t01|predict": ["s3", "s2"],          // length / mass / swing vs period; timing 10 swings
  "c7-science-ch11-t02|predict": ["s2"],
};

/** Topics deliberately NOT given a game, with the reason (a game would trivialise or mis-frame them). */
export const EXCLUDED = [
  { prefix: "c7-science-ch06", why: "adolescence and reproductive health: taught in dialogue with care, never gamified" },
  { prefix: "c8-science-ch07", why: "adolescence (class 8): out of the class 4-7 scope and never gamified" },
];

const SCOPE = /^c[4-7]-(maths|science|evs)\.json$/;

function load() {
  const kits = new Map(), cur = new Map();
  for (const f of readdirSync(join(ROOT, "data/kits"))) if (SCOPE.test(f)) for (const t of JSON.parse(readFileSync(join(ROOT, "data/kits", f), "utf8")).topics) kits.set(t.topicId, t);
  for (const f of readdirSync(join(ROOT, "data/curriculum"))) if (SCOPE.test(f)) {
    const c = JSON.parse(readFileSync(join(ROOT, "data/curriculum", f), "utf8"));
    for (const ch of c.chapters ?? []) for (const t of ch.topics ?? []) cur.set(t.id, { ...t, classLevel: Number(c.class), subject: c.subject });
  }
  return { kits, cur };
}

export function build() {
  const { kits, cur } = load();
  const problems = [], entries = [], notAdmitted = [];
  for (const r of RULES) {
    const key = `${r.family}/${r.mode}`, logic = LOGIC[key], kit = kits.get(r.topicId), c = cur.get(r.topicId);
    if (!logic) { problems.push(`${r.topicId}: no logic ${key}`); continue; }
    if (!c) { problems.push(`${r.topicId}: not in the curriculum`); continue; }
    if (!kit) { problems.push(`${r.topicId}: no kit`); continue; }
    if (EXCLUDED.some((e) => r.topicId.startsWith(e.prefix))) { problems.push(`${r.topicId}: excluded topic has a rule`); continue; }
    const misMap = {};
    for (const [mal, slug] of Object.entries(r.misMap)) {
      if (!logic.malRules.includes(mal)) { problems.push(`${r.topicId}: ${key} has no mal-rule ${mal}`); continue; }
      const id = slug.startsWith(r.topicId) ? slug : `${r.topicId}-${slug.startsWith("m") && /^m\d+$/.test(slug) ? slug : `m-${slug}`}`;
      if (!kit.misconceptions.some((m) => m.id === id)) { problems.push(`${r.topicId}: kit has no misconception ${id}`); continue; }
      misMap[mal] = id;
    }
    if (r.family === "kyun-lab") for (const lab of r.grammar.labs ?? []) if (!LABS[lab]?.topicIds.includes(r.topicId)) problems.push(`${r.topicId}: lab ${lab} is not written for this topic`);
    // round 3 fix (adversarial B1): only the skills the act exercises (ACTS), never every skill of the topic
    const acts = ACTS[`${r.topicId}|${r.goal}`];
    if (!Array.isArray(acts)) { problems.push(`${r.topicId}|${r.goal}: no ACTS entry (which kit skills does the act exercise?)`); continue; }
    const skillIds = acts.map((sfx) => `${r.topicId}-${sfx}`);
    const unknown = skillIds.filter((id) => !kit.skills.some((sk) => sk.id === id));
    if (unknown.length) { problems.push(`${r.topicId}: ACTS names skills the kit does not have: ${unknown.join(", ")}`); continue; }
    if (!skillIds.length) { notAdmitted.push({ topicId: r.topicId, family: r.family, mode: r.mode, goal: r.goal, why: "the act exercises none of the topic's kit skills (ACTS [])" }); continue; }
    entries.push({ topicId: r.topicId, title: c.title, classLevel: c.classLevel, subject: c.subject, family: r.family, mode: r.mode, goal: r.goal,
      skillId: skillIds[0], skillIds, grammar: r.grammar, misMap, ...(r.arts ? { arts: r.arts } : {}) });
  }
  const inScope = [...cur.values()].filter((t) => /-(maths|science|evs)-/.test(t.id));
  const covered = new Set(entries.map((e) => e.topicId));
  const by = (pred) => inScope.filter(pred);
  const counts = {
    topicsInScope: inScope.length,
    topicsCovered: covered.size,
    entries: entries.length,
    withMisconceptionMap: new Set(entries.filter((e) => Object.keys(e.misMap).length).map((e) => e.topicId)).size,
    mappedMisconceptions: new Set(entries.flatMap((e) => Object.values(e.misMap))).size,
    bySubject: Object.fromEntries(["maths", "science", "evs"].map((s) => [s, { inScope: by((t) => t.id.includes(`-${s}-`)).length, covered: by((t) => t.id.includes(`-${s}-`) && covered.has(t.id)).length }])),
    byClass: Object.fromEntries([4, 5, 6, 7].map((k) => [k, { inScope: by((t) => t.classLevel === k).length, covered: by((t) => t.classLevel === k && covered.has(t.id)).length }])),
    byFamily: Object.fromEntries(["todo-jodo", "taraazu", "nishana", "kyun-lab"].map((f) => [f, new Set(entries.filter((e) => e.family === f).map((e) => e.topicId)).size])),
  };
  // GRAMMAR.md §10: `skills` (skill id → its admitted game; the topic's FIRST rule wins) and `excluded` (topic id → why)
  const excluded = Object.fromEntries(inScope.filter((t) => EXCLUDED.some((e) => t.id.startsWith(e.prefix))).map((t) => [t.id, EXCLUDED.find((e) => t.id.startsWith(e.prefix)).why]));
  const skills = {};
  for (const e of entries) for (const sk of e.skillIds) if (!skills[sk]) skills[sk] = { topicId: e.topicId, family: e.family, mode: e.mode, goal: e.goal, grammar: e.grammar, misMap: e.misMap, ...(e.arts ? { arts: e.arts } : {}), contexts: [], why: `RULES ${e.topicId} ${e.family}/${e.mode}/${e.goal} · ACTS` };
  counts.skillsAdmitted = Object.keys(skills).length;
  counts.rulesNotAdmitted = notAdmitted.length;
  return { problems, file: { v: 1, note: "built by server/play/tools/build-coverage.mjs from RULES + ACTS; do not edit by hand", counts, skills, excluded, entries, notAdmitted } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { problems, file } = build();
  const text = JSON.stringify(file, null, 1) + "\n";
  if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
  if (process.argv.includes("--check")) {
    let disk = ""; try { disk = readFileSync(OUT, "utf8"); } catch { /* missing */ }
    if (disk !== text) { console.error("data/play/coverage.json is stale: run node server/play/tools/build-coverage.mjs"); process.exit(1); }
    console.log("coverage ok", JSON.stringify(file.counts));
  } else { writeFileSync(OUT, text); console.log("wrote", OUT, JSON.stringify(file.counts)); }
}
