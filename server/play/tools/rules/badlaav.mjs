// Play coverage rules for the badlaav family (round 7: physical and chemical changes, rusting and combustion, class 7 science;
// never timed: every step is a tap, and slow changes advance by the child's own "wait" or "another day"). Authored:
// - Running each of the kit's changes (melting ghee, ice or wax, freezing water, tearing paper; burning a wick, curdling milk,
//   baking soda in lemon juice, roasting a chapati, rusting) and marking the kit's sign of a chemical change it showed (gas
//   bubbles, a change of colour, heat or light, a new smell, a new solid) or "nothing new: only its form changed", a sign
//   taken only if that change shows it, IS recognising physical and chemical changes by their signs (c7-science-ch05-t01 s2,
//   s1: nishaan). Running a change, trying to undo it (cool it, warm it) and saying it came back, did not come back but is
//   the same stuff, or made a new substance, torn paper on every card, IS "reversibility is a clue, not the rule" (s3, s1:
//   ulta). Putting ghee and wax on a warm tawa (no water) and sugar and salt into cold water on a kitchen scale, then waiting
//   or stirring a step at a time, IS melting told apart from dissolving, the scale showing the dissolved solid still there
//   (s4: ghol). A change of state marked or said to make something new is m2; "it came back" of a change that did not is
//   m1; sugar or salt put on the tawa is m3 (dissolving taken to need heat); "Gone!" of dissolving sugar or salt is m4.
//   The salt-recovery mechanic is chhaano's and is not here.
// - Taking the wood out of a burning sigri, putting its lid on (it goes out a wait at a time), taking the lid off and fanning
//   it (more oxygen-rich air: it burns more strongly), each card item asking for it out (keeping the wood, or with no lid on
//   the bench) or burning more strongly, IS the fire triangle (c7-science-ch05-t02 s2, s1: trikon); fanning it with its lid
//   on is m2 (fanning taken to blow heat in). Letting a fire burn its wood or straw down a wait at a time, a closer look at
//   the air showing the carbon dioxide and water vapour, and saying where each product went (the air, or left behind) IS
//   burning not destroying matter (s4, s1: raakh); Done without looking for what went into the air is m1. Putting iron nails
//   and railing somewhere damp (air and water) or dry (air, no water) and taking another day, rust growing slowly only where
//   there is water as well as air, with no flame, IS rusting (s3: jang); rust wiped off as if it were dirt is m4.
// No act lights a fire: the fire is a picture that responds when a side of its triangle is taken away or given more.
// Not admitted (the lead's ruling: a fire-safety line, the teacher's, never a mechanic): c7-science-ch05-t02 m3 (water can put
// out every kind of fire). No act here puts water on a fire.
import { R } from "./rule.mjs";

export const family = "badlaav";
const F = "badlaav";
export const RULES = [
  R("c7-science-ch05-t01", F, "palat", "nishaan", { "looks-new": "m2" }, {}),
  R("c7-science-ch05-t01", F, "palat", "ulta", { "undo-all": "m1", "looks-new": "m2" }, {}),
  R("c7-science-ch05-t01", F, "palat", "ghol", { "sugar-melts": "m3", "gone": "m4" }, {}),
  R("c7-science-ch05-t02", F, "aag", "trikon", { "fan-heat": "m2" }, {}),
  R("c7-science-ch05-t02", F, "aag", "raakh", { "vanished": "m1" }, {}),
  R("c7-science-ch05-t02", F, "aag", "jang", { "just-dirt": "m4" }, {}),
];

export const ACTS = {
  "c7-science-ch05-t01|nishaan": ["s2", "s1"],   // the signs of a chemical change; nothing new in a physical one
  "c7-science-ch05-t01|ulta": ["s3", "s1"],      // classify by evidence; reversibility a clue, not the rule
  "c7-science-ch05-t01|ghol": ["s4"],            // melting (heat) told apart from dissolving (a liquid); dissolved, still there
  "c7-science-ch05-t02|trikon": ["s2", "s1"],    // fuel, oxygen, heat; removing one puts it out; fanning gives oxygen
  "c7-science-ch05-t02|raakh": ["s4", "s1"],     // burning does not destroy matter: gases, smoke and ash
  "c7-science-ch05-t02|jang": ["s3"],            // rusting: slow, needs oxygen and water, no flame
};

/** the kit misconceptions deliberately given no mechanic, with the reason (read by tests/r7-games-badlaav.test.mjs) */
export const NOT_ADMITTED = {
  "c7-science-ch05-t02-m3": "water can put out every kind of fire: never water on burning oil or electrical fires is a fire-safety line, the teacher's by ruling (no act puts water on a fire)",
};
