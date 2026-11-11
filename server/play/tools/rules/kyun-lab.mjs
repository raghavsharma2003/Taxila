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
  // ── r7 chumbak (magnets, class 6 science; src/play/families/kyun-lab/chumbak.logic.ts; never timed). Authored: touching a
  // pin along a hidden magnet, the pins that cling (most at its two ends, few along the middle, none off it) and flagging
  // where they cling most IS locating the poles where the attraction is strongest (c6-science-ch04-t02 s1: sira); turning
  // the toy train's carriages until every joint couples and pushing them together, the like poles that meet pushing a
  // carriage away, IS like poles repel, unlike attract (s2: jodo); bringing either pole of a marked magnet to the ends of
  // bars that look alike and calling a bar the magnet only once it has pushed a pole away IS repulsion as the sure test
  // (s2: pakka); labelling the new ends of a magnet imagined snapped (each piece N and S, tested with the marked magnet) IS
  // broken magnets form new poles (s3: todo); dipping the kit's own two magnets (a small thin one lifts 20 pins, a big grey
  // one only 8) and tagging the stronger IS strength is not size (s3: taakat). Letting a hung magnet go (it settles
  // north-south, its N end north, whichever way it was twisted) and turning a map along it IS a freely suspended magnet
  // settles north-south (ch04-t03 s1: latkao); facing a landmark, turning the compass box until N is under the needle
  // (turning herself turns the box, never the needle) and reading the letter ahead IS using a compass to find directions
  // (s2: ghoomo); doing it by a steel almirah, an iron table or a magnet, where the needle turns towards it, and walking
  // away first IS keeping a compass away from iron and magnets (s2: loha).
  // Mal-rules map to the topics' own kit misconceptions: a flag on the magnet's middle is t02 m3 (pull strongest in the
  // middle / the same all along); "this is the magnet" for a bar only ever pulled is t02 m4; a snapped piece labelled with
  // one pole only (a "no pole" end, or one pole at both ends) is t02 m2; the big grey magnet tagged stronger is t02 m1 (the
  // kit's own 20 pins against 8); reading after turning herself without setting the dial again (the box turned, the needle
  // did not) is t03 m3; reading by the iron with the dial set under its pulled needle is t03 m2.
  // Not admitted: t03 m1 ("the needle points north because it is cold there"): the kit's remediation for it (a compass
  // beside an ice box, no change) would need a mechanic of its own, and the lead's ruling for this round is that the needle
  // simply settles as the kit says and the reason is the teacher's; t03 s3 (make a compass; the Earth as a giant magnet):
  // no act here makes one. jodo and latkao map no belief (none of the kit's shows there).
  R("c6-science-ch04-t02", "kyun-lab", "dhruv", "sira", { "middle-strong": "m3" }, {}),
  R("c6-science-ch04-t02", "kyun-lab", "dhruv", "jodo", {}, {}),
  R("c6-science-ch04-t02", "kyun-lab", "dhruv", "pakka", { "pull-proves": "m4" }, {}),
  R("c6-science-ch04-t02", "kyun-lab", "dhruv", "todo", { "one-pole": "m2" }, {}),
  R("c6-science-ch04-t02", "kyun-lab", "dhruv", "taakat", { "big-stronger": "m1" }, {}),
  R("c6-science-ch04-t03", "kyun-lab", "disha", "latkao", {}, {}),
  R("c6-science-ch04-t03", "kyun-lab", "disha", "ghoomo", { "needle-turns": "m3" }, {}),
  R("c6-science-ch04-t03", "kyun-lab", "disha", "loha", { "iron-trust": "m2" }, {}),
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
  // r7: the pendulum's skills go to yantra/pendulum (the same experiment in real time: set the thread so the swing keeps
  // a beat, count full oscillations; all three kit beliefs). This lab stays authored, not admitted; restore to re-admit.
  "c7-science-ch08-t01|predict": [],
  "c7-science-ch11-t02|predict": ["s2"],
  // r7 chumbak
  "c6-science-ch04-t02|sira": ["s1"],                   // the poles, where the pull is strongest
  "c6-science-ch04-t02|jodo": ["s2"],                   // like poles repel, unlike attract
  "c6-science-ch04-t02|pakka": ["s2"],                  // repulsion is the sure test
  "c6-science-ch04-t02|todo": ["s3"],                   // a broken magnet: new poles at the break
  "c6-science-ch04-t02|taakat": ["s3"],                 // strength is not size
  "c6-science-ch04-t03|latkao": ["s1"],                 // a freely suspended magnet settles north-south
  "c6-science-ch04-t03|ghoomo": ["s2"],                 // use a compass (the dial set under the needle)
  "c6-science-ch04-t03|loha": ["s2"],                   // away from iron and magnets
};

/** Family check (was inline in build-coverage.mjs): every lab a rule names must be written for that topic. */
export function check(r, problems) {
  for (const lab of r.grammar.labs ?? []) if (!LABS[lab]?.topicIds.includes(r.topicId)) problems.push(`${r.topicId}: lab ${lab} is not written for this topic`);
}
