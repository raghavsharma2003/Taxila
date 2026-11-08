// Play coverage rules for the bhaap family (round 7: processes of water and air, classes 6 and 7 science; never timed: the
// child runs each process a step at a time). Authored:
// - Heating and cooling a pot a notch at a time on a thermometer marked only at 0 °C and 100 °C, so the ice melts and the
//   water freezes at the 0 °C mark, it boils at the 100 °C mark, and a cold lid turns the vapour back into water, in the
//   order a card names the changes (melting, freezing, boiling, condensation, dissolving sugar in the glass beside), IS naming
//   the changes of state and their key temperatures and telling them apart from dissolving (c6-science-ch08-t01 s2, s3:
//   badlo); sugar dissolved when the card says melting is m3. Boiling the water and keeping all of it in the pot (the cold
//   lid on the pot, never a plate held up in the white cloud: the invisible vapour leaves through the clear gap) IS telling
//   the invisible vapour from the visible mist (s3, s1: bachao); "ho gaya" after boiling it open (the bubbles "only air":
//   the level fell) is m1, the plate held up in the cloud to catch "the vapour" is m2.
// - Waiting a step at a time while water evaporates from an open plate, a shirt or a floor with no heat, putting something
//   cold out for the vapour in the air to condense on, and wiping the drops into the cup IS evaporation at any temperature
//   and condensation on a cool surface (c6-science-ch08-t02 s2: os, the air already full of vapour; s3, s1: wapas, all the
//   water back); a full glass of warm coloured drink put out for the drops (none forms, nothing comes through) is m1;
//   "ho gaya" with the plate dry and the water still in the air is m3. Not admitted: m2 (evaporation only when boiling):
//   no act in a stepping scene with no stove differs for a child holding it, and a stove would dry the plate just as well.
//   The factors (c6-science-ch08-t03) are kyun-lab's.
// - Setting day or night on a beach, waiting while the land warms (or cools) faster than the sea, and raising the sail so the
//   near-ground breeze takes the boat out to the fishing place and back IS the sea breeze by day and the land breeze at night
//   (c7-science-ch07-t02 s3: naav); the sail raised by day to go out (or at night to come in) is m2. Placing an AC, a heater
//   or a kitchen exhaust high or low on a room drawn as three layers of air and waiting while the warmer layer below rises
//   past the cooler one above IS convection applied to ventilators, ACs and heaters (s4, s1: kamra); the AC near the floor
//   (the cool air stays down) is m3. Not admitted: m1 (heat only moves upward): its kit move is labelling arrows as heat flow
//   or warm air moving, a quiz; no placement differs for it.
// - Running the cycle a step at a time (the sun evaporates sea water into invisible vapour, the vapour rises and cools into a
//   cloud of droplets, the cloud rains on the field, the field's water flows back to the sea) IS the water cycle
//   (c7-science-ch07-t04 s1: baadal); rain asked of vapour that has not risen and cooled is m3. Rain seeping into the gaps of
//   the ground and filling them from the bottom, the concrete's rain run off unless a recharge pit takes it in, and the well
//   drawn on only while the water table is above its bottom IS infiltration, groundwater and recharge (s2, s3: kuan); pumping
//   on a dry well is m2. Not admitted: m1 (a big underground lake): the scene always draws the water in the gaps, and no act
//   differs for a child holding it.
import { R } from "./rule.mjs";

export const family = "bhaap";
const F = "bhaap";
export const RULES = [
  R("c6-science-ch08-t01", F, "avastha", "badlo", { "sugar-melts": "m3" }, {}),
  R("c6-science-ch08-t01", F, "avastha", "bachao", { "air-bubbles": "m1", "cloud-gas": "m2" }, {}),
  R("c6-science-ch08-t02", F, "bhaapan", "os", { "glass-leak": "m1" }, {}),
  R("c6-science-ch08-t02", F, "bhaapan", "wapas", { "glass-leak": "m1", "water-gone": "m3" }, {}),
  R("c7-science-ch07-t02", F, "hawa", "naav", { "day-landward": "m2" }, {}),
  R("c7-science-ch07-t02", F, "hawa", "kamra", { "cold-rises": "m3" }, {}),
  R("c7-science-ch07-t04", F, "chakra", "baadal", { "vapour-rains": "m3" }, {}),
  R("c7-science-ch07-t04", F, "chakra", "kuan", { "never-dry": "m2" }, {}),
];

export const ACTS = {
  "c6-science-ch08-t01|badlo": ["s2", "s3"],    // the changes of state at 0 °C and 100 °C; dissolving is not one of them
  "c6-science-ch08-t01|bachao": ["s3", "s1"],   // invisible vapour, the visible mist; a gas spreads to fill the space
  "c6-science-ch08-t02|os": ["s2"],             // condensation on a cool surface
  "c6-science-ch08-t02|wapas": ["s3", "s1"],    // evaporation at any temperature and condensation: the water comes back
  "c7-science-ch07-t02|naav": ["s3"],           // the sea breeze by day, the land breeze at night
  "c7-science-ch07-t02|kamra": ["s4", "s1"],    // ACs high, heaters low, exhausts high: warm rises, cool sinks
  "c7-science-ch07-t04|baadal": ["s1"],         // evaporation, condensation into clouds, rain, collection
  "c7-science-ch07-t04|kuan": ["s2", "s3"],     // infiltration fills the gaps; pumping beyond recharge dries the well
};
