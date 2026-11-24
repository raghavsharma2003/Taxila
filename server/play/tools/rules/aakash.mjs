// Play coverage rules for the aakash family (round 7: the Earth's motions, seasons and eclipses, class 7 science; never timed:
// the child spins the Earth, moves it round the Sun, or moves the Moon round the Earth, a step per tap or drag). Authored:
// - Spinning the Earth (seen from above its North Pole, the Sun's light from one side) an eighth of a turn at a time from
//   west to east, so the card's place turns from night into day and back, and saying "Now!" when it is at sunrise, noon,
//   sunset or midnight (the sky over the place shows the Sun coming up in the east; at look 3 Arunachal turns into the light
//   before Gujarat) IS day and night by rotation and the Sun's apparent east-to-west motion (c7-science-ch12-t01 s1, s2:
//   din); dragging the Sun to go round the Earth for day (it stays put) is m1. Making a day pass (one whole spin, staying at
//   its place on the path) and a year pass (once all the way round the Sun), each closed with "Done", IS the year as one
//   revolution and the day as one rotation (s3, s1: saal); "Done" on a year after a spin on the spot, or going round the Sun
//   for a day, is m2.
// - Moving the Earth round its path (its axis leaning, and pointing the same way all the way round; the law refuses to turn
//   it) and saying "Here!" where the card's half has summer or winter, each half's share of the same bundle of sunlight drawn
//   on graph paper (small and bright where it falls straight, spread out where it slants) IS the tilt keeping its direction
//   and the two halves' opposite seasons (c7-science-ch12-t02 s1, s3: jhuk); "Here!" for the north's summer at the point
//   closest to the Sun (the kit: early January, the northern winter) is m1, the axis turned to lean towards the Sun is m2.
//   Melting the ice block on India's or Australia's field with one day of sunshine, which melts it only where the light
//   falls straight, IS the angle of sunlight (s2: dhoop); a day of sunshine where the light slants (the same light over more
//   squares; the ice stays) is m3.
// - Moving the Moon round the Earth and saying "Eclipse!" when the Moon is between the Sun and the Earth on the line (solar)
//   or the Earth is between the Sun and the Moon (lunar), the side strip showing the Moon on the line, IS solar and lunar
//   eclipses (c7-science-ch12-t03 s1, s2: chaaya); starting in a month when the Moon's path crosses the line away from the
//   new and full moons (it passes above or below), so months must pass before the three line up, IS why eclipses do not
//   happen every month (s3: kab). "Eclipse!" at a new or full moon off the line is m1; a lunar eclipse claimed at a part-lit
//   moon is m2. Not admitted: m3 (sunglasses, a partly covered Sun): no mechanic, by ruling; it is the teacher's safety line.
//   s4 (viewing safely) has no act here.
import { R } from "./rule.mjs";

export const family = "aakash";
const F = "aakash";
export const RULES = [
  R("c7-science-ch12-t01", F, "chakkar", "din", { "sun-goes": "m1" }, {}),
  R("c7-science-ch12-t01", F, "chakkar", "saal", { "spin-year": "m2", "trip-day": "m2" }, {}),
  R("c7-science-ch12-t02", F, "ritu", "jhuk", { "near-summer": "m1", "axis-turns": "m2" }, {}),
  R("c7-science-ch12-t02", F, "ritu", "dhoop", { "slant-same": "m3" }, {}),
  R("c7-science-ch12-t03", F, "grahan", "chaaya", { "phase-shadow": "m2" }, {}),
  R("c7-science-ch12-t03", F, "grahan", "kab", { "every-month": "m1", "phase-shadow": "m2" }, {}),
];

export const ACTS = {
  "c7-science-ch12-t01|din": ["s1", "s2"],      // day and night by rotation; the Sun's apparent motion, the east first
  "c7-science-ch12-t01|saal": ["s3", "s1"],     // the year as one revolution; the day as one rotation
  "c7-science-ch12-t02|jhuk": ["s1", "s3"],     // the axis keeps its direction; opposite seasons; distance not the cause
  "c7-science-ch12-t02|dhoop": ["s2"],          // the angle of sunlight: straight and concentrated, slanting and spread
  "c7-science-ch12-t03|chaaya": ["s1", "s2"],   // solar and lunar eclipses
  "c7-science-ch12-t03|kab": ["s3"],            // why not every month; phases are not the Earth's shadow
};
