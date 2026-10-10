// Play coverage rules for the kyun-lab family (S0.3 split of server/play/tools/build-coverage.mjs RULES / ACTS; one file per
// family so each games lane edits only its own). Authored: a person decided the family's mechanic IS the topic's idea.
// RULES: family/mode, goal, misMap (mal-rule → kit slug), grammar, arts. ACTS: `${topicId}|${goal}` → the kit skill
// suffixes the rule's act exercises (the first is the entry's own). The builder checks every id against the kits.
import { R } from "./rule.mjs";
import { LABS } from "../../../../src/play/families/kyun-lab/labs.ts";

export const family = "kyun-lab";
export const RULES = [
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

export const ACTS = {
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

/** Family check (was inline in build-coverage.mjs): every lab a rule names must be written for that topic. */
export function check(r, problems) {
  for (const lab of r.grammar.labs ?? []) if (!LABS[lab]?.topicIds.includes(r.topicId)) problems.push(`${r.topicId}: lab ${lab} is not written for this topic`);
}
